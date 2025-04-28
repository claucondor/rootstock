import { OpenRouterService } from '../openrouter';
import { SolidityCompilerService } from '../solidity-compiler';
import { COMBINED_CONTEXT, COMBINED_REFINE_CONTEXT } from './templates';
import { GeneratedContract } from './types';
import { CompilationError } from '../solidity-compiler/types';

/**
 * Clase para la generación de contratos inteligentes
 */
export class ContractGenerator {
  private readonly openRouter: OpenRouterService;
  private readonly compiler: SolidityCompilerService;
  private readonly MAX_RETRIES = 3;

  /**
   * Constructor del generador de contratos
   * @param openRouter Servicio OpenRouter a utilizar
   */
  constructor(openRouter: OpenRouterService) {
    this.openRouter = openRouter;
    this.compiler = new SolidityCompilerService();
  }

  /**
   * Genera un contrato inteligente basado en el prompt proporcionado
   * @param prompt Descripción del contrato a generar
   * @returns Objeto con el código del contrato generado, ABI y bytecode
   */
  async generateContract(prompt: string): Promise<GeneratedContract> {
    let sourceCode = '';
    let attempt = 0;
    let lastErrors: CompilationError[] = [];
    
    while (attempt < this.MAX_RETRIES) {
      attempt++;
      
      try {
        // En el primer intento, generamos el contrato desde cero
        // En los siguientes intentos, pedimos al LLM que corrija los errores
        if (attempt === 1) {
          const response = await this.openRouter.callModel([
            { role: 'system', content: COMBINED_CONTEXT },
            { role: 'user', content: prompt }
          ]);
          
          // Extraer solo el código del contrato (eliminar markdown si existe)
          sourceCode = response.replace(/```(solidity)?|```/g, '').trim();
        } else {
          // Para los reintentos, enviamos el código con errores al LLM para que lo corrija
          sourceCode = await this.fixContractErrors(sourceCode, lastErrors, prompt);
        }
        
        // Compilar el contrato generado
        const compilationResult = await this.compiler.compileSolidity(sourceCode);
        
        // Si no hay errores, retornamos el resultado exitoso
        if (!compilationResult.errors || compilationResult.errors.length === 0) {
          console.log(`Contrato compilado exitosamente en el intento ${attempt}`);
          return {
            source: sourceCode,
            abi: compilationResult.abi,
            bytecode: compilationResult.bytecode,
            warnings: compilationResult.warnings,
            attempts: attempt
          };
        }
        
        // Si hay errores, los guardamos para el siguiente intento
        lastErrors = compilationResult.errors;
        console.log(`Intento ${attempt}: Contrato con errores de compilación. Reintentando...`);
        
        // Si es el último intento y aún hay errores, retornamos el resultado con errores
        if (attempt >= this.MAX_RETRIES) {
          return {
            source: sourceCode,
            errors: compilationResult.errors,
            warnings: compilationResult.warnings,
            attempts: attempt
          };
        }
      } catch (error) {
        console.error(`Error en el intento ${attempt}:`, error);
        
        // Si es un error de compilación que no se capturó en el bloque anterior
        if (attempt >= this.MAX_RETRIES) {
          return {
            source: sourceCode,
            errors: [{ 
              severity: 'error', 
              message: error instanceof Error ? error.message : String(error) 
            }],
            attempts: attempt
          };
        }
        
        // Guardamos el error para el siguiente intento
        lastErrors = [{
          severity: 'error',
          message: error instanceof Error ? error.message : String(error)
        }];
      }
    }
    
    // Este código no debería ejecutarse, pero lo incluimos por seguridad
    return {
      source: sourceCode,
      errors: lastErrors,
      attempts: attempt
    };
  }

  /**
   * Refina un contrato existente basado en las instrucciones del usuario
   * @param sourceCode Código fuente del contrato existente
   * @param prompt Instrucciones para modificar el contrato
   * @returns Objeto con el código del contrato refinado, ABI y bytecode
   */
  async refineContract(sourceCode: string, prompt: string): Promise<GeneratedContract> {
    let attempt = 0;
    let lastErrors: CompilationError[] = [];
    let refinedCode = sourceCode;
    
    while (attempt < this.MAX_RETRIES) {
      attempt++;
      
      try {
        // En el primer intento, refinamos el contrato original
        // En los siguientes intentos, pedimos al LLM que corrija los errores
        if (attempt === 1) {
          // Creamos un prompt para refinar el contrato
          const refinePrompt = `
Contrato existente:

\`\`\`solidity
${sourceCode}
\`\`\`

Instrucciones para modificar el contrato:
${prompt}`;

          const response = await this.openRouter.callModel([
            { role: 'system', content: COMBINED_REFINE_CONTEXT },
            { role: 'user', content: refinePrompt }
          ]);
          
          // Extraer solo el código del contrato (eliminar markdown si existe)
          refinedCode = response.replace(/```(solidity)?|```/g, '').trim();
        } else {
          // Para los reintentos, enviamos el código con errores al LLM para que lo corrija
          refinedCode = await this.fixContractErrors(refinedCode, lastErrors, prompt);
        }
        
        // Compilar el contrato refinado
        const compilationResult = await this.compiler.compileSolidity(refinedCode);
        
        // Si no hay errores, retornamos el resultado exitoso
        if (!compilationResult.errors || compilationResult.errors.length === 0) {
          console.log(`Contrato refinado y compilado exitosamente en el intento ${attempt}`);
          return {
            source: refinedCode,
            abi: compilationResult.abi,
            bytecode: compilationResult.bytecode,
            warnings: compilationResult.warnings,
            attempts: attempt
          };
        }
        
        // Si hay errores, los guardamos para el siguiente intento
        lastErrors = compilationResult.errors;
        console.log(`Intento ${attempt}: Contrato refinado con errores de compilación. Reintentando...`);
        
        // Si es el último intento y aún hay errores, retornamos el resultado con errores
        if (attempt >= this.MAX_RETRIES) {
          return {
            source: refinedCode,
            errors: compilationResult.errors,
            warnings: compilationResult.warnings,
            attempts: attempt
          };
        }
      } catch (error) {
        console.error(`Error en el intento ${attempt}:`, error);
        
        // Si es un error de compilación que no se capturó en el bloque anterior
        if (attempt >= this.MAX_RETRIES) {
          return {
            source: refinedCode,
            errors: [{ 
              severity: 'error', 
              message: error instanceof Error ? error.message : String(error) 
            }],
            attempts: attempt
          };
        }
        
        // Guardamos el error para el siguiente intento
        lastErrors = [{
          severity: 'error',
          message: error instanceof Error ? error.message : String(error)
        }];
      }
    }
    
    // Este código no debería ejecutarse, pero lo incluimos por seguridad
    return {
      source: refinedCode,
      errors: lastErrors,
      attempts: attempt
    };
  }
  
  /**
   * Envía el contrato con errores al LLM para que lo corrija
   * @param sourceCode Código fuente del contrato con errores
   * @param errors Errores de compilación
   * @param originalPrompt Prompt original para mantener el contexto
   * @returns Código fuente corregido
   */
  private async fixContractErrors(
    sourceCode: string, 
    errors: CompilationError[], 
    originalPrompt: string
  ): Promise<string> {
    // Formateamos los errores para que sean más legibles
    const formattedErrors = errors.map(err => 
      `- ${err.severity.toUpperCase()}: ${err.formattedMessage || err.message}`
    ).join('\n');
    
    // Creamos un prompt para corregir los errores
    const fixPrompt = `
He generado el siguiente contrato Solidity basado en tu solicitud:

\`\`\`solidity
${sourceCode}
\`\`\`

Sin embargo, el compilador ha encontrado los siguientes errores:

${formattedErrors}

Por favor, corrige estos errores y devuelve el contrato completo corregido. 
Mantén la funcionalidad original solicitada: "${originalPrompt}".
Responde SOLO con el código del contrato corregido, sin explicaciones adicionales.`;

    // Enviamos el prompt al LLM
    const response = await this.openRouter.callModel([
      { role: 'system', content: COMBINED_CONTEXT },
      { role: 'user', content: fixPrompt }
    ]);
    
    // Extraemos el código corregido
    return response.replace(/```(solidity)?|```/g, '').trim();
  }
}