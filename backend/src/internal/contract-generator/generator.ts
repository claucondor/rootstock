import { OpenRouterService } from '../openrouter';
import { SolidityCompilerService } from '../solidity-compiler';
import {
  COMBINED_CONTEXT,
  COMBINED_REFINE_CONTEXT,
  FLATTENED_CORRECTION_CONTEXT,
  COMBINED_REFINE_JSON_CONTEXT,
  JSON_RECOVERY_CONTEXT,
} from './templates';
import { GeneratedContract } from './types';
import { CompilationError, CompilationOutput } from '../solidity-compiler/types';
import pino from 'pino';
import { extractContractName } from '../solidity-compiler/compiler';

const logger = pino();

// Helper function to escape regex special characters in the 'find' string
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'); // $& means the whole matched string
}

// Define the structure for the find/replace JSON response
interface FindReplacePair {
  find: string;
  replace: string;
}

/**
 * Clase para la generación de contratos inteligentes
 */
export class ContractGenerator {
  private readonly openRouter: OpenRouterService;
  private readonly compiler: SolidityCompilerService;
  // Adjust max retries (1 initial + 1 normal fix + 2 flattened fix)
  private readonly MAX_RETRIES = 4;
  // Attempt number to switch to flattened correction
  private readonly FLATTENED_FIX_START_ATTEMPT = 3;

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
    // Store flattened code in case we need it for later attempts
    let lastFlattenedSource: string | undefined;

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
            { role: 'user', content: prompt },
          ]);

          // Extract only the contract code (remove markdown if present)
          sourceCode = response.replace(/```(solidity)?|```/g, '').trim();
          logger.info(
            { sourceLength: sourceCode.length },
            'Initial code generated'
          );

          // Extract contract name from the clean source code
          contractName = extractContractName(sourceCode);
          logger.info(
            { contractName },
            'Contract name extracted from initial code'
          );
        } else {
          // Attempts >= FLATTENED_FIX_START_ATTEMPT use flattened correction
          logger.info(
            {
              errorCount: lastErrors.length,
              attempt,
            },
            'Attempting to fix contract errors using flattened code'
          );
          if (!lastFlattenedSource) {
            // This should ideally not happen if compilation produced errors and flattened code
            logger.error(
              {
                attempt,
              },
              'Cannot attempt flattened fix: Flattened source code not available'
            );
            // Re-throw or return error? For now, let's break the loop
            // Or maybe attempt normal fix again? Let's stick to breaking
            // Or perhaps try to flatten again? Needs compiler access.
            // Let's assume for now compileSolidity makes it available
            // If it's still unavailable, we return the last known error state.
            return {
              source: sourceCode, // Return the last non-flattened code
              errors: lastErrors,
              attempts: attempt,
            };
          }
          sourceCode = await this.fixContractErrorsFlattened(
            lastFlattenedSource, // Use the stored flattened code
            lastErrors,
            prompt
          );
          logger.info(
            { sourceLength: sourceCode.length },
            'Fixed flattened code generated'
          );
          // Update the flattened source for the next potential flattened attempt
          lastFlattenedSource = sourceCode;
        }

        // Compile the generated/corrected contract
        logger.info('Compiling contract...');
        const compilationResult: CompilationOutput = await this.compiler.compileSolidity(
          sourceCode,
          contractName
        );

        // Store the flattened source from this attempt in case the next attempt needs it
        // We need to ensure CompilationOutput includes flattenedSource optionally
        lastFlattenedSource = compilationResult.flattenedSource; // Now properly typed

        // If no errors, return the successful result
        if (
          !compilationResult.errors ||
          compilationResult.errors.length === 0
        ) {
          logger.info(
            {
              attempt,
              hasAbi: !!compilationResult.abi,
              hasBytecode: !!compilationResult.bytecode,
              warningCount: compilationResult.warnings?.length || 0,
            },
            'Contract compiled successfully'
          );

          return {
            source: sourceCode, // Return the last generated/corrected code
            abi: compilationResult.abi,
            bytecode: compilationResult.bytecode,
            warnings: compilationResult.warnings,
            attempts: attempt,
          };
        }

        // If there are errors, save them for the next attempt
        lastErrors = compilationResult.errors;
        logger.warn(
          {
            attempt,
            errorCount: lastErrors.length,
            errors: lastErrors,
          },
          'Contract has compilation errors'
        );

        // If this is the last attempt and there are still errors, return the result with errors
        if (attempt >= this.MAX_RETRIES) {
          logger.error(
            {
              attempt,
              errorCount: lastErrors.length,
              errors: lastErrors,
            },
            'Maximum number of attempts reached with errors'
          );

          return {
            source: sourceCode, // Return the last generated/corrected code
            errors: compilationResult.errors,
            warnings: compilationResult.warnings,
            attempts: attempt,
          };
        }
      } catch (error) {
        logger.error(
          {
            attempt,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          },
          'Error during generation/compilation'
        );

        // If this is the last attempt and there are still errors, return the result with errors
        if (attempt >= this.MAX_RETRIES) {
          return {
            source: sourceCode, // Return the last generated/corrected code
            errors: [
              {
                severity: 'error',
                message: error instanceof Error ? error.message : String(error),
              },
            ],
            attempts: attempt,
          };
        }

        // Save the error for the next attempt
        lastErrors = [
          {
            severity: 'error',
            message: error instanceof Error ? error.message : String(error),
          },
        ];
      }
    }

    // This code should not be executed, but we include it for safety
    logger.error(
      {
        attempt,
        errorCount: lastErrors.length,
        errors: lastErrors,
      },
      'Unexpected completion of contract generation'
    );

    return {
      source: sourceCode, // Return the last generated/corrected code
      errors: lastErrors,
      attempts: attempt,
    };
  }

  /**
   * Refina un contrato existente basado en las instrucciones del usuario
   * @param sourceCode Código fuente del contrato existente
   * @param prompt Instrucciones para modificar el contrato
   * @returns Objeto con el código del contrato refinado, ABI y bytecode
   */
  async refineContract(
    sourceCode: string,
    prompt: string
  ): Promise<GeneratedContract> {
    let attempt = 0;
    let lastErrors: CompilationError[] = [];
    let refinedCode = sourceCode;
    // Store flattened code for error correction attempts
    let lastFlattenedSource: string | undefined;

    // Extract the contract name from the original source
    let contractName = extractContractName(sourceCode);
    logger.info(
      { contractName },
      'Contract name extracted from original source'
    );

    logger.info(
      {
        sourceLength: sourceCode.length,
        prompt,
      },
      'Starting contract refinement'
    );

    while (attempt < this.MAX_RETRIES) {
      attempt++;
      logger.info({ attempt }, `Starting refinement attempt ${attempt}`);

      try {
        // Attempt 1: Use JSON-based find/replace refinement
        if (attempt === 1) {
          // Create a prompt for JSON-based refinement
          const refineJsonPrompt = `
Original contract code:

\`\`\`solidity
${sourceCode} 
\`\`\`

Instructions to modify the contract:
${prompt}

Generate the necessary modifications ONLY as a JSON array of { "find": "...", "replace": "..." } objects following the system prompt rules.`;

          logger.info('Calling LLM model to refine contract (JSON find/replace)');
          const response = await this.openRouter.callModel([
            // Use the new JSON context for refinement
            { role: 'system', content: COMBINED_REFINE_JSON_CONTEXT }, 
            { role: 'user', content: refineJsonPrompt },
          ]);

          // Apply the JSON patches
          try {
            const replacements: FindReplacePair[] = JSON.parse(response);
            if (!Array.isArray(replacements)) {
              throw new Error('LLM response for refinement is not a JSON array.');
            }
            logger.info(
              { count: replacements.length },
              'Received refinement find/replace instructions'
            );

            let currentCode = sourceCode; // Apply changes to the original code
            for (const { find, replace } of replacements) {
               if (typeof find !== 'string' || typeof replace !== 'string') {
                 logger.warn({ pair: { find, replace } }, 'Skipping invalid refinement pair');
                 continue;
               }
               if (!currentCode.includes(find)) {
                  logger.warn({ find }, 'Skipping refinement: `find` string not found in original code.');
                  continue;
               }
               // Use RegExp replace for broader compatibility instead of replaceAll
               currentCode = currentCode.replace(new RegExp(escapeRegExp(find), 'g'), replace);
            }
            refinedCode = currentCode; // Update refinedCode with patched version
            logger.info({ refinedLength: refinedCode.length }, 'Applied refinement patches');

          } catch (parseError) {
             logger.error(
               {
                 error: parseError instanceof Error ? parseError.message : String(parseError),
                 llmResponse: response,
               },
               'Failed to parse initial refinement JSON from LLM. Attempting recovery...'
             );
             
             // === JSON RECOVERY ATTEMPT ===
             try {
                const recoveryPrompt = `Original Prompt that led to invalid JSON:\n---\n${refineJsonPrompt}\n---\n\nInvalid Response (malformed JSON):\n---\n${response}\n---\n\nPlease provide the corrected JSON array.`;

                logger.info('Calling LLM for JSON format recovery');
                const recoveryResponse = await this.openRouter.callModel([
                   { role: 'system', content: JSON_RECOVERY_CONTEXT },
                   { role: 'user', content: recoveryPrompt },
                ]);
                
                // Try parsing the recovery response
                const recoveredReplacements: FindReplacePair[] = JSON.parse(recoveryResponse);
                if (!Array.isArray(recoveredReplacements)) {
                   throw new Error('LLM recovery response is also not a JSON array.');
                }
                logger.info(
                   { count: recoveredReplacements.length },
                   'Successfully recovered refinement JSON'
                );
                
                // Apply recovered replacements
                let currentCode = sourceCode; 
                for (const { find, replace } of recoveredReplacements) {
                  if (typeof find !== 'string' || typeof replace !== 'string') {
                     logger.warn({ pair: { find, replace } }, 'Skipping invalid recovered refinement pair');
                     continue;
                  }
                  if (!currentCode.includes(find)) {
                     logger.warn({ find }, 'Skipping recovered refinement: `find` string not found.');
                     continue;
                  }
                  currentCode = currentCode.replace(new RegExp(escapeRegExp(find), 'g'), replace);
                }
                refinedCode = currentCode; // Update with recovered patched version
                logger.info({ refinedLength: refinedCode.length }, 'Applied recovered refinement patches');

             } catch (recoveryError) {
                // If recovery also fails, then throw the final error
                logger.error(
                  {
                     recoveryError: recoveryError instanceof Error ? recoveryError.message : String(recoveryError),
                     originalError: parseError instanceof Error ? parseError.message : String(parseError),
                  },
                  'JSON recovery attempt failed.'
                );
                throw new Error(
                   `Failed to process LLM refinement response after recovery: ${recoveryError instanceof Error ? recoveryError.message : String(recoveryError)}`
                );
             }
             // === END JSON RECOVERY ATTEMPT ===
          }
          
          // Re-extract the contract name in case it changed during refinement
          const refinedContractName = extractContractName(refinedCode);
          if (refinedContractName !== 'TempContract' && refinedContractName !== contractName) {
             contractName = refinedContractName;
             logger.info({ contractName: refinedContractName }, 'Updated contract name from refined code');
          }

        } else {
          // Attempts 2+ : Error Correction using two-phase strategy
          if (attempt < this.FLATTENED_FIX_START_ATTEMPT) {
            // Attempt 2: Use normal error correction (expects full code)
             logger.info(
               { errorCount: lastErrors.length, attempt },
               'Attempting to fix errors in refined contract (normal mode)'
             );
             // Note: prompt here is the original refinement instruction,
             // fixContractErrors internally tells the LLM to fix based on that context
             refinedCode = await this.fixContractErrors(
               refinedCode, // Use the code from the previous failed attempt
               lastErrors,
               prompt 
             );
             logger.info({ refinedLength: refinedCode.length }, 'Fixed code generated (normal)');
          } else {
             // Attempts 3 & 4: Use flattened error correction (expects JSON)
             logger.info(
               { errorCount: lastErrors.length, attempt },
               'Attempting to fix errors in refined contract (flattened mode)'
             );
             if (!lastFlattenedSource) {
               logger.error({ attempt }, 'Cannot attempt flattened fix: Flattened source code not available for refined code');
               // Return last known error state
                return {
                  source: refinedCode, // Return the last code before flattening attempt
                  errors: lastErrors,
                  attempts: attempt,
                };
             }
             // Call fixContractErrorsFlattened with the flattened code
             refinedCode = await this.fixContractErrorsFlattened(
               lastFlattenedSource, 
               lastErrors,
               prompt // Original refinement prompt for context
             );
             logger.info({ refinedLength: refinedCode.length }, 'Fixed code generated (flattened)');
             // Update the potentially corrected flattened source
             lastFlattenedSource = refinedCode; 
          }
        }

        // Compile the refined/corrected contract
        logger.info('Compiling refined contract...');
        const compilationResult: CompilationOutput = await this.compiler.compileSolidity(
          refinedCode,
          contractName
        );
        
        // Store flattened source for potential next error correction attempt
        lastFlattenedSource = compilationResult.flattenedSource; // Now properly typed

        // If no errors, return the successful result
        if (
          !compilationResult.errors ||
          compilationResult.errors.length === 0
        ) {
          logger.info(
            {
              attempt,
              hasAbi: !!compilationResult.abi,
              hasBytecode: !!compilationResult.bytecode,
              warningCount: compilationResult.warnings?.length || 0,
            },
            'Refined contract compiled successfully'
          );

          return {
            source: refinedCode,
            abi: compilationResult.abi,
            bytecode: compilationResult.bytecode,
            warnings: compilationResult.warnings,
            attempts: attempt,
          };
        }

        // If there are errors, save them for the next attempt
        lastErrors = compilationResult.errors;
         logger.warn(
          {
            attempt,
            errorCount: lastErrors.length,
            errors: lastErrors,
          },
          'Refined contract has compilation errors'
        );

        // If this is the last attempt and there are still errors, return the result with errors
        if (attempt >= this.MAX_RETRIES) {
          logger.error(
            {
              attempt,
              errorCount: lastErrors.length,
              errors: lastErrors,
            },
            'Maximum number of attempts reached with errors in refinement'
          );

          return {
            source: refinedCode,
            errors: compilationResult.errors,
            warnings: compilationResult.warnings,
            attempts: attempt,
          };
        }
      } catch (error) {
        logger.error(
          {
            attempt,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          },
          'Error during refinement/compilation'
        );

        // If this is the last attempt and there are still errors, return the result with errors
        if (attempt >= this.MAX_RETRIES) {
          return {
            source: refinedCode,
            errors: [
              {
                severity: 'error',
                message: error instanceof Error ? error.message : String(error),
              },
            ],
            attempts: attempt,
          };
        }

        // Save the error for the next attempt
        lastErrors = [
          {
            severity: 'error',
            message: error instanceof Error ? error.message : String(error),
          },
        ];
      }
    }

    // This code should not be executed, but we include it for safety
    logger.error(
      {
        attempt,
        errorCount: lastErrors.length,
        errors: lastErrors,
      },
      'Unexpected completion of contract refinement'
    );

    return {
      source: refinedCode,
      errors: lastErrors,
      attempts: attempt,
    };
  }

  /**
   * Sends the *flattened* contract with errors to the LLM for correction using find/replace.
   * @param flattenedSourceCode Flattened source code of the contract with errors
   * @param errors Compilation errors
   * @param originalPrompt Original prompt to maintain context
   * @returns Corrected flattened source code after applying replacements
   * @throws Error if LLM response is not valid JSON or replacements fail
   */
  private async fixContractErrorsFlattened(
    flattenedSourceCode: string,
    errors: CompilationError[],
    originalPrompt: string
  ): Promise<string> {
    const formattedErrors = errors
      .map(
        (err) =>
          `- ${err.severity.toUpperCase()}: ${err.formattedMessage || err.message}`
      )
      .join('\n');

    // Create the user prompt for the flattened correction method
    const fixPrompt = `The following flattened Solidity code produced compilation errors:

\`\`\`solidity
${flattenedSourceCode}
\`\`\`

Compilation Errors:

${formattedErrors}

Please provide the necessary corrections in the specified JSON format (array of { \"find\": \"...\", \"replace\": \"...\" }) to fix these errors.
Remember the original request was: "${originalPrompt}".
Adhere strictly to the system prompt's JSON output format and rules.`;

    logger.info('Calling LLM for flattened code correction (find/replace)');
    const response = await this.openRouter.callModel([
      { role: 'system', content: FLATTENED_CORRECTION_CONTEXT }, // Use the new context
      { role: 'user', content: fixPrompt },
    ]);

    let correctedCode = flattenedSourceCode;
    try {
      // Attempt to parse the JSON response
      const replacements: FindReplacePair[] = JSON.parse(response);

      if (!Array.isArray(replacements)) {
        throw new Error('LLM response is not a JSON array.');
      }

      logger.info(
        { count: replacements.length },
        'Received find/replace instructions'
      );

      // Apply replacements sequentially
      for (const { find, replace } of replacements) {
        if (typeof find !== 'string' || typeof replace !== 'string') {
          logger.warn(
            { pair: { find, replace } },
            'Skipping invalid replacement pair (non-string find/replace)'
          );
          continue;
        }
        if (!correctedCode.includes(find)) {
          logger.warn(
            { find },
            'Skipping replacement: \`find\` string not found in current code. Code might have changed in previous replacements.'
          );
          // Consider more robust patching if this becomes an issue
          continue;
        }
        // Use RegExp replace for broader compatibility instead of replaceAll
        correctedCode = correctedCode.replace(new RegExp(escapeRegExp(find), 'g'), replace);
      }

      logger.info('Applied find/replace corrections to flattened code');
      return correctedCode;
    } catch (parseError) {
      logger.error(
        {
          error: parseError instanceof Error ? parseError.message : String(parseError),
          llmResponse: response, // Log the initial invalid response
        },
        'Failed to parse flattened correction JSON from LLM. Attempting recovery...'
      );

      // === JSON RECOVERY ATTEMPT ===
      try {
         const recoveryPrompt = `Original Prompt that led to invalid JSON:\n---\n${fixPrompt}\n---\n\nInvalid Response (malformed JSON):\n---\n${response}\n---\n\nPlease provide the corrected JSON array.`;

         logger.info('Calling LLM for JSON format recovery (flattened correction)');
         const recoveryResponse = await this.openRouter.callModel([
            { role: 'system', content: JSON_RECOVERY_CONTEXT },
            { role: 'user', content: recoveryPrompt },
         ]);

         // Try parsing the recovery response
         const recoveredReplacements: FindReplacePair[] = JSON.parse(recoveryResponse);
         if (!Array.isArray(recoveredReplacements)) {
            throw new Error('LLM recovery response for flattened correction is also not a JSON array.');
         }
         logger.info(
            { count: recoveredReplacements.length },
            'Successfully recovered flattened correction JSON'
         );

         // Apply recovered replacements (apply to the original flattened code passed to this function)
         let currentCode = flattenedSourceCode;
         for (const { find, replace } of recoveredReplacements) {
            if (typeof find !== 'string' || typeof replace !== 'string') {
               logger.warn({ pair: { find, replace } }, 'Skipping invalid recovered correction pair');
               continue;
            }
            if (!currentCode.includes(find)) {
               logger.warn({ find }, 'Skipping recovered correction: `find` string not found.');
               continue;
            }
            currentCode = currentCode.replace(new RegExp(escapeRegExp(find), 'g'), replace);
         }
         logger.info('Applied recovered find/replace corrections to flattened code');
         return currentCode; // Return the successfully recovered and patched code

      } catch (recoveryError) {
         // If recovery also fails, then throw the final error
         logger.error(
           {
              recoveryError: recoveryError instanceof Error ? recoveryError.message : String(recoveryError),
              originalError: parseError instanceof Error ? parseError.message : String(parseError),
           },
           'JSON recovery attempt failed for flattened correction.'
         );
         throw new Error(
            `Failed to process LLM flattened correction response after recovery: ${recoveryError instanceof Error ? recoveryError.message : String(recoveryError)}`
         );
      }
      // === END JSON RECOVERY ATTEMPT ===
    }
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
    const formattedErrors = errors
      .map(
        (err) =>
          `- ${err.severity.toUpperCase()}: ${err.formattedMessage || err.message}`
      )
      .join('\n');

    // Create a prompt to fix errors (Normal mode - expects full corrected code)
    const fixPrompt = `The following Solidity code was generated based on the initial request:

\`\`\`solidity
${sourceCode}
\`\`\`

However, the compiler reported the following errors:

${formattedErrors}

Please correct these errors and return the **complete, corrected Solidity code**.
Adhere strictly to the system prompt's rules (OpenZeppelin 4.9.3 / Uniswap V3 Rootstock, version compatibility, security, etc.).
Ensure the corrected code still fulfills the original request: "${originalPrompt}".
Respond ONLY with the corrected Solidity code, without any explanations or markdown formatting.`;

    // Send the prompt to the LLM
    // Use COMBINED_CONTEXT here as it contains the general rules
    const response = await this.openRouter.callModel([
      { role: 'system', content: COMBINED_CONTEXT },
      { role: 'user', content: fixPrompt },
    ]);

    // Extract the corrected code
    const correctedCode = response.replace(/```(solidity)?|```/g, '').trim();

    return correctedCode;
  }
}
