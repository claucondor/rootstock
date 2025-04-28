import * as fs from 'fs';
import * as path from 'path';
import { SolidityCompilerService } from '../internal/solidity-compiler/index';

// Función para obtener todos los archivos .sol recursivamente
function getAllSolFiles(dir: string): string[] {
  const files: string[] = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllSolFiles(itemPath));
    } else if (item.endsWith('.sol')) {
      files.push(itemPath);
    }
  }
  
  return files;
}

// Función para extraer el nombre del contrato del archivo
function extractContractName(filePath: string): string {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Buscar todos los contratos definidos en el archivo
  const contractMatches = content.matchAll(/contract\s+(\w+)(?:\s+is\s+[\w,\s]+)?\s*\{/g);
  const contracts = Array.from(contractMatches).map(match => match[1]);
  
  if (contracts.length > 0) {
    // Si hay contratos, usamos el último (generalmente el principal)
    return contracts[contracts.length - 1];
  }
  
  // Si no encontramos contratos, usamos el nombre del archivo
  return path.basename(filePath, '.sol');
}

async function testAllContracts() {
  console.log('Testing SolidityCompilerService with all contracts...');
  
  const compiler = new SolidityCompilerService();
  const contractsDir = path.join(process.cwd(), 'src/test/contract-test/openzeppelin');
  const solFiles = getAllSolFiles(contractsDir);
  
  console.log(`Found ${solFiles.length} Solidity contracts to test`);
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const filePath of solFiles) {
    const fileName = path.basename(filePath);
    
    const relativePath = path.relative(process.cwd(), filePath);
    const contractName = extractContractName(filePath);
    const source = fs.readFileSync(filePath, 'utf-8');
    
    console.log(`\n----- Testing ${relativePath} (${contractName}) -----`);
    
    try {
      // Pasamos la ruta original del archivo para que Hardhat pueda encontrar las dependencias
      const result = await compiler.compileSolidity(source, contractName, filePath);
      
      if (result.errors && result.errors.length > 0) {
        console.error('Compilation errors:');
        result.errors.forEach(error => {
          console.error(`- ${error.message}`);
        });
        failureCount++;
      } else {
        console.log('Compilation successful!');
        console.log(`ABI length: ${result.abi ? result.abi.length : 0}`);
        console.log(`Bytecode length: ${result.bytecode ? result.bytecode.length : 0}`);
        
        if (result.warnings && result.warnings.length > 0) {
          console.log('Warnings:');
          result.warnings.forEach(warning => {
            console.log(`- ${warning.message}`);
          });
        }
        
        successCount++;
      }
    } catch (error: any) {
      console.error('Error:', error.message);
      failureCount++;
    }
  }
  
  console.log(`\n----- Summary -----`);
  console.log(`Total contracts: ${solFiles.length}`);
  console.log(`Successful compilations: ${successCount}`);
  console.log(`Failed compilations: ${failureCount}`);
}

testAllContracts().catch(console.error);