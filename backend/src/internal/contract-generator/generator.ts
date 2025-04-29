import { OpenRouterService } from '../openrouter';
import { SolidityCompilerService } from '../solidity-compiler';
import { COMBINED_CONTEXT, COMBINED_REFINE_CONTEXT } from './templates';
import { GeneratedContract } from './types';
import { CompilationError } from '../solidity-compiler/types';
import pino from 'pino';
import { extractContractName } from '../solidity-compiler/compiler';

const logger = pino();

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
    let contractName: string | undefined;
    
    logger.info({ prompt }, 'Starting contract generation');
    
    while (attempt < this.MAX_RETRIES) {
      attempt++;
      logger.info({ attempt }, `Starting generation attempt ${attempt}`);
      
      try {
        // On first attempt, generate the contract from scratch
        // On subsequent attempts, ask the LLM to fix errors
        if (attempt === 1) {
          logger.info('Calling LLM model to generate initial contract');
          const response = await this.openRouter.callModel([
            { role: 'system', content: COMBINED_CONTEXT },
            { role: 'user', content: prompt }
          ]);
          
          // Extract only the contract code (remove markdown if present)
          sourceCode = response.replace(/```(solidity)?|```/g, '').trim();
          logger.info({ sourceLength: sourceCode.length }, 'Initial code generated');
          
          // Extract contract name from the clean source code
          contractName = extractContractName(sourceCode);
          logger.info({ contractName }, 'Contract name extracted from initial code');
        } else {
          logger.info({ 
            errorCount: lastErrors.length,
            attempt 
          }, 'Attempting to fix contract errors');
          sourceCode = await this.fixContractErrors(sourceCode, lastErrors, prompt);
          logger.info({ sourceLength: sourceCode.length }, 'Fixed code generated');
        }
        
        // Compile the generated contract
        logger.info('Compiling contract...');
        const compilationResult = await this.compiler.compileSolidity(sourceCode, contractName);
        
        // If no errors, return the successful result
        if (!compilationResult.errors || compilationResult.errors.length === 0) {
          logger.info({ 
            attempt,
            hasAbi: !!compilationResult.abi,
            hasBytecode: !!compilationResult.bytecode,
            warningCount: compilationResult.warnings?.length || 0
          }, 'Contract compiled successfully');
          
          return {
            source: sourceCode,
            abi: compilationResult.abi,
            bytecode: compilationResult.bytecode,
            warnings: compilationResult.warnings,
            attempts: attempt
          };
        }
        
        // If there are errors, save them for the next attempt
        lastErrors = compilationResult.errors;
        logger.warn({ 
          attempt,
          errorCount: lastErrors.length,
          errors: lastErrors
        }, 'Contract has compilation errors');
        
        // If this is the last attempt and there are still errors, return the result with errors
        if (attempt >= this.MAX_RETRIES) {
          logger.error({ 
            attempt,
            errorCount: lastErrors.length,
            errors: lastErrors
          }, 'Maximum number of attempts reached with errors');
          
          return {
            source: sourceCode,
            errors: compilationResult.errors,
            warnings: compilationResult.warnings,
            attempts: attempt
          };
        }
      } catch (error) {
        logger.error({ 
          attempt,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        }, 'Error during generation/compilation');
        
        // If this is the last attempt and there are still errors, return the result with errors
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
        
        // Save the error for the next attempt
        lastErrors = [{
          severity: 'error',
          message: error instanceof Error ? error.message : String(error)
        }];
      }
    }
    
    // This code should not be executed, but we include it for safety
    logger.error({ 
      attempt,
      errorCount: lastErrors.length,
      errors: lastErrors
    }, 'Unexpected completion of contract generation');
    
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
    
    // Extract the contract name from the original source
    let contractName = extractContractName(sourceCode);
    logger.info({ contractName }, 'Contract name extracted from original source');
    
    logger.info({ 
      sourceLength: sourceCode.length,
      prompt 
    }, 'Starting contract refinement');
    
    while (attempt < this.MAX_RETRIES) {
      attempt++;
      logger.info({ attempt }, `Starting refinement attempt ${attempt}`);
      
      try {
        // On first attempt, refine the original contract
        // On subsequent attempts, ask the LLM to fix errors
        if (attempt === 1) {
          // Create a prompt to refine the contract
          const refinePrompt = `
Existing contract:

\`\`\`solidity
${sourceCode}
\`\`\`

Instructions to modify the contract:
${prompt}`;

          logger.info('Calling LLM model to refine contract');
          const response = await this.openRouter.callModel([
            { role: 'system', content: COMBINED_REFINE_CONTEXT },
            { role: 'user', content: refinePrompt }
          ]);
          
          // Extract only the contract code (remove markdown if present)
          refinedCode = response.replace(/```(solidity)?|```/g, '').trim();
          logger.info({ refinedLength: refinedCode.length }, 'Refined code generated');
          
          // Re-extract the contract name in case it changed
          const refinedContractName = extractContractName(refinedCode);
          if (refinedContractName !== 'TempContract') {
            contractName = refinedContractName;
            logger.info({ contractName: refinedContractName }, 'Updated contract name from refined code');
          }
        } else {
          logger.info({ 
            errorCount: lastErrors.length,
            attempt 
          }, 'Attempting to fix errors in refined contract');
          refinedCode = await this.fixContractErrors(refinedCode, lastErrors, prompt);
          logger.info({ refinedLength: refinedCode.length }, 'Fixed code generated');
        }
        
        // Compile the refined contract
        logger.info('Compiling refined contract...');
        const compilationResult = await this.compiler.compileSolidity(refinedCode, contractName);
        
        // If no errors, return the successful result
        if (!compilationResult.errors || compilationResult.errors.length === 0) {
          logger.info({ 
            attempt,
            hasAbi: !!compilationResult.abi,
            hasBytecode: !!compilationResult.bytecode,
            warningCount: compilationResult.warnings?.length || 0
          }, 'Refined contract compiled successfully');
          
          return {
            source: refinedCode,
            abi: compilationResult.abi,
            bytecode: compilationResult.bytecode,
            warnings: compilationResult.warnings,
            attempts: attempt
          };
        }
        
        // If there are errors, save them for the next attempt
        lastErrors = compilationResult.errors;
        logger.warn({ 
          attempt,
          errorCount: lastErrors.length,
          errors: lastErrors
        }, 'Refined contract has compilation errors');
        
        // If this is the last attempt and there are still errors, return the result with errors
        if (attempt >= this.MAX_RETRIES) {
          logger.error({ 
            attempt,
            errorCount: lastErrors.length,
            errors: lastErrors
          }, 'Maximum number of attempts reached with errors in refinement');
          
          return {
            source: refinedCode,
            errors: compilationResult.errors,
            warnings: compilationResult.warnings,
            attempts: attempt
          };
        }
      } catch (error) {
        logger.error({ 
          attempt,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        }, 'Error during refinement/compilation');
        
        // If this is the last attempt and there are still errors, return the result with errors
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
        
        // Save the error for the next attempt
        lastErrors = [{
          severity: 'error',
          message: error instanceof Error ? error.message : String(error)
        }];
      }
    }
    
    // This code should not be executed, but we include it for safety
    logger.error({ 
      attempt,
      errorCount: lastErrors.length,
      errors: lastErrors
    }, 'Unexpected completion of contract refinement');
    
    return {
      source: refinedCode,
      errors: lastErrors,
      attempts: attempt
    };
  }
  
  /**
   * Sends the contract with errors to the LLM for correction
   * @param sourceCode Código fuente del contrato con errores
   * @param errors Errores de compilación
   * @param originalPrompt Original prompt to maintain context
   * @returns Código fuente corregido
   */
  private async fixContractErrors(
    sourceCode: string, 
    errors: CompilationError[], 
    originalPrompt: string
  ): Promise<string> {
    // Format errors for easier readability
    const formattedErrors = errors.map(err => 
      `- ${err.severity.toUpperCase()}: ${err.formattedMessage || err.message}`
    ).join('\n');
    
    // Create a prompt to fix errors
    const fixPrompt = `
I generated the following Solidity contract based on your request:

\`\`\`solidity
${sourceCode}
\`\`\`

However, the compiler found the following errors:

${formattedErrors}

Please correct these errors and return the complete corrected contract. 
Maintain the original functionality requested: "${originalPrompt}".
Respond ONLY with the corrected contract code, without additional explanations.`;

    // Send the prompt to the LLM
    const response = await this.openRouter.callModel([
      { role: 'system', content: COMBINED_CONTEXT },
      { role: 'user', content: fixPrompt }
    ]);
    
    // Extract the corrected code
    const correctedCode = response.replace(/```(solidity)?|```/g, '').trim();
    
    return correctedCode;
  }
}