import { OpenRouterClient } from '../openrouter/client';
import { ModelMessage } from '../openrouter/types';
import pino from 'pino';
import {
  DIAGRAM_GENERATION_PROMPT,
  DIAGRAM_CORRECTION_PROMPT,
  FUNCTION_ANALYSIS_PROMPT,
} from './prompts';
import {
  AnalysisResult,
  AnalyzedFunctionDetails,
  ContractAnalysisOutput,
  DiagramItem,
  FunctionAnalyses,
  RawDiagramOutput,
} from './types';
import { isValidMermaid } from './mermaidUtils';
import { extractAndParseJson, callLlm } from './llmUtils';

const logger = pino();

const MAX_CORRECTION_RETRIES = 2;

/**
 * Service for analyzing smart contracts using LLM, including generating
 * function details and validated Mermaid diagrams.
 */
export class ContractAnalyzerService {
  private openRouterClient: OpenRouterClient;

  constructor() {
    this.openRouterClient = new OpenRouterClient();
  }

  /**
   * Analyzes a smart contract: generates function details and diagram data.
   * @param source Solidity source code
   * @param abi Contract ABI
   * @returns Object containing function analyses and validated diagram data
   */
  public async analyzeContract(
    source: string,
    abi: any[] // ABI is typically an array
  ): Promise<ContractAnalysisOutput> {
    logger.info('Starting contract analysis');
    if (!abi || !Array.isArray(abi)) {
      logger.error('Invalid or missing ABI for analysis.');
      // Return empty/error state appropriate for your frontend
      throw new Error('Invalid ABI provided for analysis.');
    }
    logger.info(
      { sourceLength: source.length, abiLength: abi.length },
      'Data received for analysis'
    );

    try {
      logger.info('Generating function analyses...');
      const functionAnalyses = await this.generateFunctionAnalyses(source, abi);
      logger.info(
        {
          analyzedFunctionCount: Object.keys(functionAnalyses).length,
          hasError: 'error' in functionAnalyses, // Basic check if error object returned
        },
        'Function analyses generated'
      );

      // Basic check if function analysis failed catastrophically
      if (Object.keys(functionAnalyses).length === 0 && source.length > 0) {
        logger.warn('Function analysis returned empty results. Skipping diagram generation.');
        return {
          functionAnalyses,
          diagramData: { generalDiagram: null, functionDiagrams: {} }, // Return empty diagram data
        };
      }

      logger.info('Generating and validating diagram data...');
      const diagramData = await this.generateAndValidateDiagramData(
        source,
        abi,
        functionAnalyses
      );
      logger.info(
        {
          hasGeneralDiagram: !!diagramData.generalDiagram,
          validatedFunctionDiagramCount: Object.keys(diagramData.functionDiagrams)
            .length,
        },
        'Diagram data generated and validated'
      );

      return {
        functionAnalyses,
        diagramData,
      };
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        'Error during contract analysis orchestration'
      );
      // Re-throw or return a structured error based on frontend needs
      throw error; // Consider returning a default ContractAnalysisOutput with error flags
    }
  }

  /**
   * Generates detailed analysis for each function (description, source, example, security).
   * Uses FUNCTION_ANALYSIS_PROMPT.
   * @param source Solidity source code
   * @param abi Contract ABI (array)
   * @returns Object mapping function names to their detailed analysis.
   */
  public async generateFunctionAnalyses(
    source: string,
    abi: any[]
  ): Promise<FunctionAnalyses> {
    logger.info('Preparing messages for LLM - detailed function analyses');

    const functionNames = abi
      .filter((item) => item.type === 'function')
      .map((item) => item.name);

    if (functionNames.length === 0) {
      logger.warn('No functions found in ABI to analyze.');
      return {};
    }

    const messages: ModelMessage[] = [
      {
        role: 'system',
        content: FUNCTION_ANALYSIS_PROMPT,
      },
      {
        role: 'user',
        content: `Source Code:\\n\`\`\`solidity\\n${source}\\n\`\`\`\\n\\nABI:\\n\`\`\`json\\n${JSON.stringify(
          abi, null, 2
        )}\\n\`\`\`\\n\\nFunction Names to Analyze: ${functionNames.join(', ')}`,
      },
    ];

    const response = await callLlm(
      this.openRouterClient,
      messages,
      'function analysis'
    );
    if (!response) {
      return { error: { description: 'LLM call failed' } } as any; // Return error marker
    }

    const parsedJson = extractAndParseJson<FunctionAnalyses>(
      response,
      'function analysis response'
    );
    if (!parsedJson) {
      return { error: { description: 'Failed to parse LLM response' } } as any; // Return error marker
    }

    // Simple validation: Check if at least some expected keys exist
    const receivedKeys = Object.keys(parsedJson);
    if (receivedKeys.length === 0 && functionNames.length > 0) {
      logger.warn('Parsed function analysis JSON is empty, but functions were expected.');
      // Decide how to handle: return empty, error, or the empty object?
      // Returning the empty object might be safest if frontend handles it.
      return {};
    }

    logger.info(`Successfully generated analyses for ${receivedKeys.length} functions.`);
    return parsedJson;
  }

  /**
   * Generates the initial diagram data from the LLM.
   * @param source Solidity source code
   * @param abi Contract ABI
   * @param functionAnalyses Previously generated function analyses (optional context)
   * @returns Raw diagram output from LLM or null if failed.
   */
  private async generateInitialDiagramData(
    source: string,
    abi: any[],
    functionAnalyses: FunctionAnalyses // Keep for potential future context use
  ): Promise<RawDiagramOutput | null> {
    logger.info('Preparing messages for LLM - initial diagram generation');

    const functionNames = Object.keys(functionAnalyses); // Get names from successful analysis

    const messages: ModelMessage[] = [
      {
        role: 'system',
        content: DIAGRAM_GENERATION_PROMPT,
      },
      {
        role: 'user',
        content: `Analyze the following contract:\\n\\nSource Code:\\n\`\`\`solidity\\n${source}\\n\`\`\`\\n\\nABI:\\n\`\`\`json\\n${JSON.stringify(
          abi, null, 2
        )}\\n\`\`\`\\n\\nFunction Names List: ${functionNames.join(', ')}`,
      },
    ];

    const response = await callLlm(
      this.openRouterClient,
      messages,
      'initial diagram generation'
    );
    if (!response) {
      return null;
    }

    const parsedJson = extractAndParseJson<RawDiagramOutput>(
      response,
      'initial diagram generation response'
    );
    return parsedJson;
  }

  /**
   * Validates a single diagram item and attempts correction via LLM if invalid.
   * @param diagramItem The diagram item (code + explanation) to validate.
   * @param diagramName Name for logging (e.g., "general" or function name).
   * @returns The validated DiagramItem or null if validation/correction fails.
   */
  private async validateAndCorrectDiagram(
    diagramItem: DiagramItem | undefined | null,
    diagramName: string
  ): Promise<DiagramItem | null> {
    if (!diagramItem || !diagramItem.mermaidCode) {
      logger.warn(`Skipping validation for ${diagramName}: No code provided.`);
      return null;
    }

    let currentCode = diagramItem.mermaidCode;
    let attempts = 0;

    while (attempts <= MAX_CORRECTION_RETRIES) {
      const validationResult = await isValidMermaid(currentCode);

      if (validationResult.valid) {
        logger.info(`Mermaid validation successful for ${diagramName} (attempt ${attempts + 1}).`);
        // Return the item with the validated (potentially corrected) code
        return { mermaidCode: currentCode, explanation: diagramItem.explanation };
      }

      logger.warn(
        `Mermaid validation failed for ${diagramName} (attempt ${attempts + 1}/${MAX_CORRECTION_RETRIES + 1}). Error: ${validationResult.error}`
      );

      if (attempts === MAX_CORRECTION_RETRIES) {
        logger.error(
          `Max correction retries reached for ${diagramName}. Discarding diagram.`
        );
        break; // Exit loop, will return null
      }

      // Attempt correction
      attempts++;
      logger.info(`Attempting LLM correction for ${diagramName} (attempt ${attempts}).`);

      const correctionMessages: ModelMessage[] = [
        {
          role: 'system',
          content: DIAGRAM_CORRECTION_PROMPT,
        },
        {
          role: 'user',
          content: `The following Mermaid code failed validation with the error:\\n\\nError Message: ${validationResult.error}\\n\\nOriginal Mermaid Code:\\n\`\`\`mermaid\\n${currentCode}\\n\`\`\`\\nPlease provide ONLY the corrected Mermaid code.`, // Ensure prompt asks only for code
        },
      ];

      const correctionResponse = await callLlm(
        this.openRouterClient,
        correctionMessages,
        `diagram correction for ${diagramName}`
      );

      if (correctionResponse) {
        // LLM might return markdown, explanations etc. Try to extract just the code.
        const correctedCodeMatch = correctionResponse.match(/```(?:mermaid)?\\n?([\\s\\S]*?)\\n?```/);
        const potentialCode = correctedCodeMatch ? correctedCodeMatch[1].trim() : correctionResponse.trim();

        if (potentialCode && potentialCode !== currentCode) {
          logger.info(`Received corrected code for ${diagramName}. Retrying validation.`);
          currentCode = potentialCode; // Use the potential fix for the next loop iteration
          // Continue loop to re-validate
        } else {
          logger.warn(`LLM correction for ${diagramName} did not provide new code or was identical. Stopping correction attempts.`);
          break; // Exit loop if no useful correction received
        }
      } else {
        logger.error(
          `LLM correction call failed for ${diagramName}. Stopping correction attempts.`
        );
        break; // Exit loop if LLM call fails
      }
    }

    return null; // Return null if validation/correction ultimately failed
  }

  /**
   * Generates and validates diagram data (general and function-specific).
   * Fetches initial data, then validates/corrects each diagram individually.
   * @param source Solidity source code
   * @param abi Contract ABI
   * @param functionAnalyses Analyses of functions (context)
   * @returns Validated AnalysisResult object.
   */
  public async generateAndValidateDiagramData(
    source: string,
    abi: any[],
    functionAnalyses: FunctionAnalyses
  ): Promise<AnalysisResult> {
    const rawOutput = await this.generateInitialDiagramData(
      source,
      abi,
      functionAnalyses
    );

    if (!rawOutput) {
      logger.error('Failed to generate initial diagram data from LLM.');
      return { generalDiagram: null, functionDiagrams: {} };
    }

    const validatedResult: AnalysisResult = {
      generalDiagram: null,
      functionDiagrams: {},
    };

    // Validate/Correct General Diagram
    logger.info('Validating general diagram...');
    validatedResult.generalDiagram = await this.validateAndCorrectDiagram(
      rawOutput.generalDiagram,
      'general'
    );

    // Validate/Correct Function Diagrams
    if (rawOutput.functionDiagrams) {
      logger.info('Validating function diagrams...');
      for (const funcName in rawOutput.functionDiagrams) {
        if (Object.prototype.hasOwnProperty.call(rawOutput.functionDiagrams, funcName)) {
          logger.debug(`Validating diagram for function: ${funcName}`);
          const validatedFuncDiagram = await this.validateAndCorrectDiagram(
            rawOutput.functionDiagrams[funcName],
            funcName
          );
          if (validatedFuncDiagram) {
            validatedResult.functionDiagrams[funcName] = validatedFuncDiagram;
            logger.info(`Successfully validated/corrected diagram for ${funcName}.`);
          }
        }
      }
    } else {
      logger.warn('No function diagrams found in the initial LLM output.');
    }

    return validatedResult;
  }
}
