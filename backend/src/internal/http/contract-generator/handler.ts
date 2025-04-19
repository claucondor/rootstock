import { FastifyReply, FastifyRequest } from 'fastify';
import axios from 'axios';
import path from 'path';
import { SolidityCompilerService } from '../../solidity-compiler';
import fs from 'fs';
import fsPromises from 'fs/promises';

// Prefijos permitidos para imports absolutos
const ALLOWED_IMPORT_PREFIXES = [
  '@openzeppelin/contracts/',
  '@chainlink/contracts/src/',
  '@uniswap/v2-core/contracts/',
  '@uniswap/v2-periphery/contracts/',
  '@uniswap/v3-core/contracts/',
  '@uniswap/v3-periphery/contracts/',
];

// Configuración de OpenRouter
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = 'deepseek/deepseek-chat-v3-0324';

interface GenerateRequestBody {
  prompt: string;
}

async function callOpenRouter(messages: any[]): Promise<string> {
  const response = await axios.post(
    OPENROUTER_URL,
    {
      model: OPENROUTER_MODEL,
      messages,
      max_tokens: 2048,
      temperature: 0.2,
    },
    {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data.choices[0].message.content;
}

function extractImports(source: string): string[] {
  const importRegex = /import\s+['\"]([^'\"]+)['\"];?/g;
  const imports: string[] = [];
  let match;
  while ((match = importRegex.exec(source)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

function logStep(step: string, data?: any) {
  // eslint-disable-next-line no-console
  console.log(`[CONTRACT-GENERATOR] ${step}`, data || '');
}

// Helper para saber si un import relativo es de OpenZeppelin
function isOpenZeppelinRelativeImport(parentPath: string, importPath: string): boolean {
  return parentPath.startsWith('@openzeppelin/') && importPath.startsWith('./');
}

// Helper para saber si un import es probablemente una interfaz
function isInterfaceImport(importPath: string): boolean {
  const fileName = importPath.split('/').pop() || '';
  
  // Criterios para detectar interfaces:
  // 1. Empieza con 'I' y termina con '.sol' (convención común)
  // 2. Contiene 'Interface' en el nombre
  // 3. Contiene 'IERC' (interfaces comunes de ERC tokens)
  // 4. Está en una carpeta llamada 'interfaces'
  
  return (
    (fileName.startsWith('I') && fileName.endsWith('.sol')) ||
    fileName.includes('Interface') ||
    fileName.includes('IERC') ||
    importPath.includes('/interfaces/') ||
    // Caso especial para los tokens ERC20 de OpenZeppelin
    importPath.includes('IERC20') ||
    importPath.includes('IERC721') ||
    importPath.includes('IERC1155')
  );
}

// Base path para los contratos locales
const CONTRACTS_BASE = path.resolve(__dirname, '../../contracts-lib');

// Mapeo de prefijos de imports a carpetas locales
const IMPORT_MAP: Record<string, string> = {
  '@openzeppelin/contracts/': 'openzeppelin/contracts/',
  '@chainlink/contracts/src/': 'chainlink/src/',
  '@uniswap/v2-core/contracts/': 'uniswap-v2-core/contracts/',
  '@uniswap/v2-periphery/contracts/': 'uniswap-v2-periphery/contracts/',
  '@uniswap/v3-core/contracts/': 'uniswap-v3-core/contracts/',
  '@uniswap/v3-periphery/contracts/': 'uniswap-v3-periphery/contracts/',
};

// Lee un archivo Solidity local, con prioridad a búsqueda por nombre (async)
async function readSolidityFile(importPath: string, _parentFilePath?: string, mainLib?: string): Promise<string> {
  logStep('readSolidityFile', { importPath, mainLib });
  
  // Función auxiliar para búsqueda por nombre
  async function searchByName(dir: string, fileName: string): Promise<string | null> {
    console.log(`[RESOLVER] Buscando archivo "${fileName}" en directorio "${dir}"`);
    const found = await findSolFileByName(dir, fileName);
    if (found) {
      console.log(`[RESOLVER] ✅ ENCONTRADO "${fileName}" en "${found}"`);
      return await fsPromises.readFile(found, 'utf8');
    }
    console.log(`[RESOLVER] ❌ NO ENCONTRADO "${fileName}" en "${dir}"`);
    return null;
  }
  
  const fileName = path.basename(importPath);
  
  // Caso especial para Pausable.sol - buscar primero en utils si viene de security
  if (fileName === 'Pausable.sol' && importPath.includes('/security/')) {
    console.log('[RESOLVER] 🔍 Caso especial detectado para Pausable.sol');
    if (mainLib === 'openzeppelin') {
      const utilsPath = path.join(CONTRACTS_BASE, 'openzeppelin/contracts/utils');
      const content = await searchByName(utilsPath, 'Pausable.sol');
      if (content) return content;
    }
  }
  
  // SIEMPRE priorizar la búsqueda por nombre, independientemente del tipo de importación
  // 1. Buscar en todas las librerías disponibles por nombre
  for (const localDir of Object.values(IMPORT_MAP)) {
    const pkgRoot = path.join(CONTRACTS_BASE, localDir.split('/')[0]);
    // Buscar por nombre de archivo en toda la librería
    const contentByName = await searchByName(pkgRoot, fileName);
    if (contentByName) return contentByName;
  }
  
  // 2. Si hay una librería principal identificada, buscar primero allí
  if (mainLib) {
    const pkgRoot = path.join(CONTRACTS_BASE, mainLib);
    // Buscar por nombre de archivo en la librería principal
    const contentByName = await searchByName(pkgRoot, fileName);
    if (contentByName) return contentByName;
  }
  
  // 3. Solo como último recurso, intentar la ruta exacta
  for (const [prefix, localDir] of Object.entries(IMPORT_MAP)) {
    if (importPath.startsWith(prefix)) {
      const relPath = importPath.replace(prefix, '');
      const absPath = path.join(CONTRACTS_BASE, localDir, relPath);
      try {
        console.log(`[RESOLVER] Intentando leer (ruta exacta como último recurso): ${absPath}`);
        await fsPromises.access(absPath);
        return await fsPromises.readFile(absPath, 'utf8');
      } catch (err) {
        console.log(`[RESOLVER] Falló leer (ruta exacta): ${absPath}`, err);
      }
    }
  }
  
  console.log(`[RESOLVER] No se pudo resolver el import: ${importPath} (mainLib: ${mainLib})`);
  throw new Error(`No se pudo resolver el import: ${importPath}`);
}

// Busca un archivo .sol por nombre en todas las subcarpetas de un directorio (async)
async function findSolFileByName(dir: string, fileName: string): Promise<string | null> {
  const entries = await fsPromises.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = await findSolFileByName(fullPath, fileName);
      if (found) return found;
    } else if (entry.isFile() && entry.name === fileName) {
      return fullPath;
    }
  }
  return null;
}

// Estructura para mantener la información de un archivo y sus dependencias
interface FileNode {
  path: string;          // Ruta original del import
  content: string;       // Contenido del archivo
  fileName: string;      // Nombre del archivo
  dependencies: string[]; // Lista de nombres de archivos que depende
}

// Función para normalizar rutas de OpenZeppelin conocidas por problemas
function normalizeOpenZeppelinPath(importPath: string): string {
  // Caso específico: Pausable en security vs utils
  if (importPath === '@openzeppelin/contracts/security/Pausable.sol') {
    console.log('[RESOLVER] 🔄 Normalizando ruta Pausable: security → utils');
    return '@openzeppelin/contracts/utils/Pausable.sol';
  }
  
  // Otros casos que puedan surgir...
  
  return importPath;
}

// Descubre recursivamente todos los archivos necesarios
async function discoverDependencies(
  importPath: string,
  discoveredFiles: Map<string, FileNode> = new Map(),
  mainLib?: string,
  importFailCount: Record<string, number> = {}
): Promise<Map<string, FileNode>> {
  // Normalizar rutas conocidas con problemas
  const normalizedPath = normalizeOpenZeppelinPath(importPath);
  if (normalizedPath !== importPath) {
    importPath = normalizedPath;
  }
  
  logStep('discoverDependencies: procesando', importPath);
  
  const fileName = path.basename(importPath);
  
  // Si ya procesamos este archivo, no repetir
  if (discoveredFiles.has(fileName)) {
    logStep('discoverDependencies: archivo ya procesado', fileName);
    return discoveredFiles;
  }
  
  // Obtener el contenido del archivo
  let fileContent: string;
  try {
    console.log(`[FLATTEN] Intentando resolver import: ${importPath} (buscando por nombre ${fileName})`);
    fileContent = await readSolidityFile(importPath, undefined, mainLib);
    console.log(`[FLATTEN] ✅ Resuelto import: ${importPath}`);
  } catch (e: any) {
    console.log(`[FLATTEN] ❌ Error resolviendo import: ${importPath}`, e.message);
    importFailCount[importPath] = (importFailCount[importPath] || 0) + 1;
    
    if (importFailCount[importPath] >= 2 && isInterfaceImport(importPath)) {
      logStep('discoverDependencies: no se pudo resolver interfaz tras 2 intentos', importPath);
      // Marcamos interfaces no resueltas con contenido especial
      discoveredFiles.set(fileName, {
        path: importPath,
        content: `// [INTERFAZ NO RESUELTA: ${importPath}]`,
        fileName,
        dependencies: []
      });
      return discoveredFiles;
    } else if (importFailCount[importPath] >= 2) {
      logStep('discoverDependencies: no se pudo resolver import NO interfaz tras 2 intentos', importPath);
      throw new Error(`No se pudo resolver el import ${importPath} tras 2 intentos y no es una interfaz. No se puede continuar.`);
    } else {
      throw e;
    }
  }
  
  // Extraer todos los imports
  const extractImports = (source: string): string[] => {
    const imports: string[] = [];
    
    // Extraer imports simples
    const importRegexSimple = /import\s+['"]([^'"]+)['"](;)?/g;
    let match;
    while ((match = importRegexSimple.exec(source)) !== null) {
      imports.push(match[1]);
    }
    
    // Extraer imports con nombres
    const importRegexNamed = /import\s+\{([^\}]+)\}\s+from\s+['"]([^'"]+)['"](;)?/g;
    while ((match = importRegexNamed.exec(source)) !== null) {
      imports.push(match[2]);
    }
    
    return imports;
  };
  
  // Detectar la librería principal si no está definida
  if (!mainLib && importPath !== 'Contract.sol') {
    if (importPath.includes('@openzeppelin/')) mainLib = 'openzeppelin';
    else if (importPath.includes('@chainlink/')) mainLib = 'chainlink';
    else if (importPath.includes('@uniswap/v2-core/')) mainLib = 'uniswap-v2-core';
    else if (importPath.includes('@uniswap/v2-periphery/')) mainLib = 'uniswap-v2-periphery';
    else if (importPath.includes('@uniswap/v3-core/')) mainLib = 'uniswap-v3-core';
    else if (importPath.includes('@uniswap/v3-periphery/')) mainLib = 'uniswap-v3-periphery';
  }
  
  // Extraer todas las dependencias
  const imports = extractImports(fileContent);
  const dependencies: string[] = [];
  
  // Registrar este archivo antes de procesar sus dependencias para evitar ciclos
  discoveredFiles.set(fileName, {
    path: importPath,
    content: fileContent,
    fileName,
    dependencies
  });
  
  if (imports.length > 0) {
    console.log(`[FLATTEN] Archivo ${fileName} importa: ${imports.join(', ')}`);
  }
  
  // Procesar recursivamente todos los imports
  for (const importDep of imports) {
    const depFileName = path.basename(importDep);
    dependencies.push(depFileName);
    
    // Verificar si el import es permitido
    const isAllowedImport = 
      ALLOWED_IMPORT_PREFIXES.some(prefix => importDep.startsWith(prefix)) || 
      importDep.startsWith('./') || 
      importDep.startsWith('../') ||
      importDep.endsWith('.sol');
    
    if (!isAllowedImport) {
      logStep('discoverDependencies: import no permitido', importDep);
      throw new Error(`Import no permitido: ${importDep}`);
    }
    
    try {
      // Procesar recursivamente
      await discoverDependencies(importDep, discoveredFiles, mainLib, importFailCount);
    } catch (e: any) {
      console.log(`[FLATTEN] ⚠️ Error procesando dependencia ${importDep}: ${e.message}`);
      // Si falla alguna dependencia, seguimos con las demás
    }
  }
  
  return discoveredFiles;
}

// Generar el código flatten a partir de la lista de archivos descubiertos
function generateFlattenedCode(discoveredFiles: Map<string, FileNode>): string {
  logStep('generateFlattenedCode: generando código flatten');
  
  // Ordenar topológicamente las dependencias para asegurar que las dependencias se procesen antes
  const sortedFiles: FileNode[] = [];
  const visited = new Set<string>();
  const temp = new Set<string>();
  
  // Registro de dependencias para análisis
  const dependencyGraph = new Map<string, string[]>();
  const dependedOnBy = new Map<string, Set<string>>();
  
  // Detectar todas las dependencias por interfaz
  for (const [fileName, node] of discoveredFiles.entries()) {
    dependencyGraph.set(fileName, [...node.dependencies]);
    
    // Registrar cada archivo que depende de un determinado archivo
    for (const dep of node.dependencies) {
      if (!dependedOnBy.has(dep)) {
        dependedOnBy.set(dep, new Set());
      }
      dependedOnBy.get(dep)?.add(fileName);
    }
  }
  
  // Determinar qué archivos son cruciales: aquellos que otras dependencias necesitan
  const crucialFiles = new Set<string>();
  for (const [fileName, dependents] of dependedOnBy.entries()) {
    if (dependents.size > 0) {
      crucialFiles.add(fileName);
      console.log(`[FLATTEN] Archivo crucial detectado: ${fileName}, usado por: ${Array.from(dependents).join(', ')}`);
    }
  }
  
  // Añadir también el contrato principal y sus dependencias directas
  crucialFiles.add('Contract.sol');
  const mainNode = discoveredFiles.get('Contract.sol');
  if (mainNode) {
    for (const dep of mainNode.dependencies) {
      crucialFiles.add(dep);
      console.log(`[FLATTEN] Archivo crucial (dependencia directa del contrato principal): ${dep}`);
    }
  }
  
  function visit(fileName: string, path: string[] = []) {
    // Si ya está en el resultado final, no procesar de nuevo
    if (visited.has(fileName)) return;
    
    // Ciclo detectado
    if (temp.has(fileName)) {
      // Si es un archivo crucial, lo incluimos a pesar del ciclo
      if (crucialFiles.has(fileName)) {
        console.log(`[FLATTEN] ⚠️ Ciclo detectado en dependencia crucial: ${fileName}, se incluirá de todas formas`);
        // No retornamos, permitimos que continúe para archivos cruciales
      } else {
        // Incluso si no es "crucial", lo incluimos si alguien lo necesita
        console.log(`[FLATTEN] ⚠️ Ciclo detectado en dependencia: ${fileName} en el camino [${path.join(' -> ')}]`);
        if (dependedOnBy.has(fileName) && dependedOnBy.get(fileName)!.size > 0) {
          console.log(`[FLATTEN] Este archivo es necesario para otros, se incluirá a pesar del ciclo`);
        } else {
          return; // Solo descartamos si realmente nadie lo necesita
        }
      }
    }
    
    const node = discoveredFiles.get(fileName);
    if (!node) {
      console.log(`[FLATTEN] ❌ Nodo no encontrado: ${fileName}`);
      return;
    }
    
    temp.add(fileName);
    path.push(fileName);
    
    // Primero visitar todas las dependencias
    for (const dep of node.dependencies) {
      visit(dep, [...path]);  // Clonar el path para cada rama
    }
    
    temp.delete(fileName);
    visited.add(fileName);
    sortedFiles.push(node);
  }
  
  // Primero incluir los archivos cruciales
  for (const fileName of crucialFiles) {
    const node = discoveredFiles.get(fileName);
    if (node) {
      console.log(`[FLATTEN] Asegurando que el archivo crucial ${fileName} esté incluido`);
      visit(fileName);
    }
  }
  
  // Luego procesar el resto
  for (const fileName of discoveredFiles.keys()) {
    if (!visited.has(fileName)) {
      console.log(`[FLATTEN] Procesando archivo adicional no crucial: ${fileName}`);
    }
    visit(fileName);
  }
  
  // Unir todos los contenidos en orden
  let flattenedCode = '';
  const seenPragmas = new Set<string>();
  const seenContracts = new Set<string>();
  const seenErrors = new Set<string>();
  const seenLibraries = new Set<string>();
  
  // Extraer declaraciones de contratos, interfaces, etc.
  const contractRegex = /\b(abstract\s+contract|contract|interface)\s+([A-Za-z][A-Za-z0-9_]*)\s+/g;
  const errorRegex = /\berror\s+([A-Za-z][A-Za-z0-9_]*)\s*\(/g;
  const libraryRegex = /\blibrary\s+([A-Za-z][A-Za-z0-9_]*)\s+/g;
  
  // Añadimos una única licencia SPDX al principio
  flattenedCode += "// SPDX-License-Identifier: MIT\n";
  
  // Añadimos solo los pragma solidity (no los SPDX)
  for (const file of sortedFiles) {
    const lines = file.content.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('pragma solidity') && !seenPragmas.has(trimmedLine)) {
        flattenedCode += trimmedLine + '\n';
        seenPragmas.add(trimmedLine);
      }
    }
  }
  
  flattenedCode += '\n';
  
  // Recolectar y procesar declaraciones para evitar duplicados
  const contractDeclarations: Record<string, string> = {};
  
  for (const file of sortedFiles) {
    console.log(`[FLATTEN] Procesando archivo ${file.fileName}`);
    
    // Eliminar todos los imports y licencias SPDX
    let processedContent = file.content
      .replace(/import\s+(\{[^\}]+\}\s+from\s+)?['"]([^'"]+)['"](;)?/g, '')
      .replace(/\/\/\s*SPDX-License-Identifier:.*$/mg, ''); // Eliminar todas las licencias SPDX
    
    // Extraer todas las declaraciones de contratos y verificar duplicados
    let contractMatch;
    const contractMatches: {name: string, text: string}[] = [];
    
    // Extraer todas las definiciones de contratos
    const tempContractRegex = /\b(abstract\s+contract|contract|interface)\s+([A-Za-z][A-Za-z0-9_]*)\s+[^{]*?\{[\s\S]*?(?=\n})/g;
    while ((contractMatch = tempContractRegex.exec(processedContent)) !== null) {
      const contractName = contractMatch[2];
      
      // Si no es un token aleatorio y no está en la lista de palabras clave
      if (contractName && contractName.length > 1 && !/^(is|to|and|the|of|or)$/.test(contractName)) {
        contractMatches.push({
          name: contractName,
          text: contractMatch[0] + '\n}'
        });
      }
    }
    
    // Verificar duplicados
    for (const {name, text} of contractMatches) {
      if (seenContracts.has(name)) {
        console.log(`[FLATTEN] Contrato duplicado ${name} en ${file.fileName}, se omitirá`);
        // Remover solo esta declaración
        processedContent = processedContent.replace(text, '');
      } else {
        seenContracts.add(name);
        // Guardar la declaración
        contractDeclarations[name] = text;
      }
    }
    
    if (processedContent.trim()) {
      flattenedCode += processedContent + '\n\n';
    }
  }
  
  // Eliminar líneas de import que pudieran quedar
  flattenedCode = flattenedCode.replace(/import\s+(\{[^\}]+\}\s+from\s+)?['"]([^'"]+)['"];?/g, '');
  
  // Eliminar líneas vacías múltiples
  flattenedCode = flattenedCode.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  // Verificar referencias a contratos faltantes
  // Analizamos el código para encontrar referencias a interfaces/contratos que no hayamos incluido
  const missingContracts = new Set<string>();
  
  // Buscar referencias a interfaces como "contract X is Y, Z" donde Y o Z no están definidos
  const inheritanceRegex = /\b(abstract\s+contract|contract|interface)\s+([A-Za-z][A-Za-z0-9_]*)\s+is\s+([^{]+)\{/g;
  let inheritanceMatch;
  while ((inheritanceMatch = inheritanceRegex.exec(flattenedCode)) !== null) {
    const inherits = inheritanceMatch[3].split(',').map(s => s.trim());
    for (const parent of inherits) {
      // Ignorar cosas como palabras clave solidity, herencia modificada, etc.
      if (parent && !parent.includes(' ') && !seenContracts.has(parent) && 
          !/^(public|private|internal|external|pure|view|payable|nonpayable|override)$/.test(parent)) {
        missingContracts.add(parent);
        console.log(`[FLATTEN] ⚠️ Detectada referencia a contrato faltante: ${parent}`);
      }
    }
  }
  
  // Si encontramos contratos faltantes, intentamos agregarlos
  if (missingContracts.size > 0) {
    console.log(`[FLATTEN] Contratos faltantes detectados: ${Array.from(missingContracts).join(', ')}`);
    
    // Caso específico: IERC20Errors
    if (missingContracts.has('IERC20Errors')) {
      console.log('[FLATTEN] ⚠️ IERC20Errors faltante, añadiendo interface de reemplazo');
      
      // Agregar una definición simple de IERC20Errors al principio
      const ierc20ErrorsInterface = `
interface IERC20Errors {
    error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed);
    error ERC20InvalidSender(address sender);
    error ERC20InvalidReceiver(address receiver);
    error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed);
    error ERC20InvalidApprover(address approver);
    error ERC20InvalidSpender(address spender);
}
`;
      flattenedCode = flattenedCode.replace(/\n\n/, `\n\n${ierc20ErrorsInterface}\n\n`);
    }
  }
  
  logStep('generateFlattenedCode: código flatten generado');
  return flattenedCode;
}

// Nueva función para aplanar contrato usando el enfoque de descubrimiento previo
async function flattenContract(
  source: string,
  already: Set<string> = new Set(),
  parentPkgInfo?: any,
  parentAbsPath?: string,
  importFailCount: Record<string, number> = {},
  mainLib?: string
): Promise<string> {
  logStep('flattenContract: usando nueva implementación con descubrimiento previo');
  
  // Crear un mapa para almacenar los archivos descubiertos
  const discoveredFiles = new Map<string, FileNode>();
  
  // Detectar la librería principal si no está definida
  if (!mainLib) {
    if (source.includes('@openzeppelin/')) mainLib = 'openzeppelin';
    else if (source.includes('@chainlink/')) mainLib = 'chainlink';
    else if (source.includes('@uniswap/v2-core/')) mainLib = 'uniswap-v2-core';
    else if (source.includes('@uniswap/v2-periphery/')) mainLib = 'uniswap-v2-periphery';
    else if (source.includes('@uniswap/v3-core/')) mainLib = 'uniswap-v3-core';
    else if (source.includes('@uniswap/v3-periphery/')) mainLib = 'uniswap-v3-periphery';
  }
  
  // Registrar el contrato principal directamente sin buscarlo
  const mainContractName = 'Contract.sol';
  discoveredFiles.set(mainContractName, {
    path: mainContractName,
    content: source,
    fileName: mainContractName,
    dependencies: []
  });
  
  // Extraer todas las dependencias del contrato principal
  const extractImports = (source: string): string[] => {
    const imports: string[] = [];
    
    // Extraer imports simples
    const importRegexSimple = /import\s+['"]([^'"]+)['"](;)?/g;
    let match;
    while ((match = importRegexSimple.exec(source)) !== null) {
      imports.push(match[1]);
    }
    
    // Extraer imports con nombres
    const importRegexNamed = /import\s+\{([^\}]+)\}\s+from\s+['"]([^'"]+)['"](;)?/g;
    while ((match = importRegexNamed.exec(source)) !== null) {
      imports.push(match[2]);
    }
    
    return imports;
  };
  
  // Identificar los imports del contrato principal
  const mainImports = extractImports(source);
  const mainNode = discoveredFiles.get(mainContractName);
  
  if (mainNode) {
    // Procesar cada importación del contrato principal
    for (const importPath of mainImports) {
      logStep('flattenContract: procesando import principal', importPath);
      const depFileName = path.basename(importPath);
      mainNode.dependencies.push(depFileName);
      
      // Descubrir recursivamente las dependencias de este import
      await discoverDependencies(importPath, discoveredFiles, mainLib, importFailCount);
    }
  }
  
  // Generar el código flatten a partir de la lista de archivos descubiertos
  return generateFlattenedCode(discoveredFiles);
}

export async function contractGeneratorHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as GenerateRequestBody;
  logStep('handler: recibido prompt', body?.prompt);
  if (!body || typeof body.prompt !== 'string' || !body.prompt.trim()) {
    reply.code(400).send({ error: "El campo 'prompt' es requerido y debe ser un string no vacío." });
    return;
  }

  // Prompt optimizado y robusto
  let messages = [
    { role: 'system', content: `Eres un experto en Solidity. SOLO puedes usar imports absolutos de las siguientes librerías y versiones en el contrato principal:\n\n- OpenZeppelin (v4.9.5)\n- Uniswap V2 (v1.0.1) y V3 (v1.0.2)\n- Chainlink (v0.8.0)\n\nEjemplos de imports válidos:\nimport \"@openzeppelin/contracts/token/ERC20/ERC20.sol\";\nimport \"@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol\";\nimport \"@chainlink/contracts/src/v0.8/VRFConsumerBase.sol\";\n\nNO copies el código fuente de ninguna librería, solo usa imports absolutos. No uses imports relativos ni personalizados en el contrato principal. Si necesitas funcionalidad adicional, escribe el código tú mismo. Los imports relativos internos de OpenZeppelin, Uniswap y Chainlink serán resueltos automáticamente.\nSi el sistema te indica que no pudo resolver una interfaz tras 2 intentos, DEBES escribir el código de esa interfaz directamente en el contrato, en vez de usar el import. Si el sistema te indica que no pudo resolver un import que NO es interfaz, no intentes escribirlo y reporta el error.` },
    { role: 'user', content: body.prompt }
  ];

  let code = '';
  let attempts = 0;
  let maxAttempts = 3; // Menos reintentos para ahorrar tokens
  let lastError = '';
  let flattened = '';
  let compileResult: any = null;
  const compiler = new SolidityCompilerService();
  let importFailCount: Record<string, number> = {};

  while (attempts < maxAttempts) {
    logStep('handler: llamando a la IA', { attempt: attempts });
    code = await callOpenRouter(messages);
    // Log completo de la respuesta de la IA
    console.log('--- RESPUESTA COMPLETA DE LA IA ---\n', code, '\n--- FIN RESPUESTA IA ---');
    logStep('handler: respuesta IA', code?.slice(0, 200));
    // Extraer solo el bloque de código si la IA responde con markdown
    const codeMatch = code.match(/```solidity([\s\S]*?)```/);
    let contractSource = codeMatch ? codeMatch[1].trim() : code.trim();
    // Validar imports relativos en el contrato principal
    const mainImports = extractImports(contractSource);
    if (mainImports.some(i => i.startsWith('./') || i.startsWith('../'))) {
      logStep('handler: contrato principal con imports relativos, reintentando');
      messages.push({ role: 'user', content: 'No uses imports relativos en el contrato principal. Solo puedes usar imports absolutos de las librerías permitidas.' });
      attempts++;
      continue;
    }
    // Flatten y validación de imports
    try {
      logStep('handler: flatten start');
      flattened = await flattenContract(contractSource, undefined, undefined, undefined, importFailCount);
      logStep('handler: flatten end');
    } catch (e: any) {
      // Solo reintentar con la IA si el error es por import no permitido fuera de OpenZeppelin/Uniswap/Chainlink
      if (e.message && e.message.startsWith('Import no permitido:')) {
        logStep('handler: import no permitido', e.message);
        messages.push({ role: 'user', content: `Has usado un import no permitido en el contrato principal. Solo puedes usar los imports de la lista blanca. No uses imports relativos ni personalizados. Si necesitas funcionalidad adicional, escribe el código tú mismo.` });
        attempts++;
        continue;
      }
      // Si el error es por un import NO interfaz no resuelto, aborta y reporta
      if (e.message && e.message.startsWith('No se pudo resolver el import relativo')) {
        logStep('handler: error import NO interfaz', e.message);
        reply.code(500).send({ error: e.message });
        return;
      }
      logStep('handler: error resolviendo imports', e.message);
      reply.code(500).send({ error: 'Error resolviendo imports: ' + e.message });
      return;
    }
    // Compilar
    logStep('handler: compilando');
    compileResult = await compiler.compileSolidity(flattened);
    logStep('handler: resultado compilación', compileResult);
    if (!compileResult.errors || compileResult.errors.length === 0) {
      break;
    }
    // Si hay una interfaz no resuelta, dile al LLM que escriba el código de esa interfaz
    if (flattened.includes('// [INTERFAZ NO RESUELTA:')) {
      const missingInterfaces = [...flattened.matchAll(/\/\/ \[INTERFAZ NO RESUELTA: ([^\]]+)\]/g)].map(m => m[1]);
      messages.push({ role: 'user', content: `No se pudo resolver la interfaz ${missingInterfaces.join(', ')} tras 2 intentos. Escribe el código de esa interfaz directamente en el contrato, en vez de usar el import.` });
      attempts++;
      continue;
    }
    // Solo reintentar con la IA si el error es de compilación real
    lastError = compileResult.errors.join('\n');
    messages.push({ role: 'user', content: `Corrige estos errores de compilación y genera el contrato listo para deployar (solo usando los imports permitidos en el contrato principal, o escribiendo el código tú mismo):\n${lastError}` });
    attempts++;
  }

  if (compileResult.errors && compileResult.errors.length > 0) {
    logStep('handler: error final', compileResult.errors);
    reply.code(400).send({ error: 'No se pudo generar un contrato válido tras varios intentos.', errors: compileResult.errors, code: flattened });
    return;
  }

  logStep('handler: éxito', { abi: compileResult.abi, bytecode: compileResult.bytecode });
  reply.code(200).send({ code: flattened, abi: compileResult.abi, bytecode: compileResult.bytecode, warnings: compileResult.warnings });
} 