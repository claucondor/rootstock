import { OpenRouterClient } from '../openrouter/client';
import { ModelMessage } from '../openrouter/types';
import pino from 'pino';
import {
  FUNCTION_ANALYSIS_PROMPT,
  SEQUENCE_DIAGRAM_GENERATION_PROMPT,
  FUNCTION_SEQUENCE_DIAGRAM_BATCH_PROMPT,
} from './prompts';
import {
  AnalysisResult,
  AnalyzedFunctionDetails,
  ContractAnalysisOutput,
  DiagramItem,
  FunctionAnalyses,
  RawDiagramOutput,
  FunctionDiagramBatchOutput,
} from './types';
import { extractAndParseJson, callLlm } from './llmUtils';

const logger = pino();

const MAX_ANALYSIS_RETRIES = 1;
const FUNCTION_BATCH_SIZE = 5;

/**
 * Service for analyzing smart contracts using LLM, including generating
 * function details and diagram data in batches.
 */
export class ContractAnalyzerService {
  private openRouterClient: OpenRouterClient;

  constructor() {
    this.openRouterClient = new OpenRouterClient();
  }

  /**
   * Analyzes a smart contract: generates function details and diagram data.
   * Orchestrates batch processing.
   */
  public async analyzeContract(
    source: string,
    abi: any[] // ABI is typically an array
  ): Promise<ContractAnalysisOutput> {
    logger.info('Starting contract analysis with batch processing');
    if (!abi || !Array.isArray(abi)) {
      logger.error('Invalid or missing ABI for analysis.');
      throw new Error('Invalid ABI provided for analysis.');
    }
    logger.info(
      { sourceLength: source.length, abiLength: abi.length },
      'Data received for analysis'
    );

    let functionAnalyses: FunctionAnalyses = {};
    let diagramData: AnalysisResult = { generalDiagram: null, functionDiagrams: {} };
    let success = false;

    for (let attempt = 1; attempt <= MAX_ANALYSIS_RETRIES + 1; attempt++) {
      try {
        logger.info(`Analysis attempt ${attempt}...`);

        logger.info('Generating function analyses in batches...');
        functionAnalyses = await this.generateFunctionAnalysesInBatches(source, abi);
        const analyzedCount = Object.keys(functionAnalyses).length;
        const hasErrorMarker = 'error' in functionAnalyses;
        logger.info(
          {
            analyzedFunctionCount: analyzedCount,
            hasError: hasErrorMarker,
            batchesAttempted: Math.ceil(abi.filter(item => item.type === 'function').length / FUNCTION_BATCH_SIZE) || 1
          },
          'Function analyses batch processing completed'
        );

        // Stop if analysis failed completely or partially (indicated by error marker or zero results)
        if (hasErrorMarker || (analyzedCount === 0 && abi.filter(item => item.type === 'function').length > 0)) {
          logger.warn('Function analysis failed or returned empty results. Skipping diagram generation.');
          // Return partial/empty results, diagrams won't be generated
          diagramData = { generalDiagram: null, functionDiagrams: {} };
          // Mark as success to avoid retry if it was just an empty result, but keep error marker if present
          success = !hasErrorMarker;
          break;
        }

        logger.info('Generating diagram data in batches...');
        diagramData = await this.generateDiagramDataInBatches(
          source,
          abi,
          functionAnalyses // Pass successful analyses
        );
        logger.info(
          {
            hasGeneralDiagram: !!diagramData.generalDiagram,
            functionDiagramCount: Object.keys(diagramData.functionDiagrams).length,
          },
          'Diagram data batch generation completed'
        );

        success = true; // Mark as successful if all steps completed
        break; // Exit loop on success

      } catch (error) {
        logger.error(
          {
            attempt: attempt,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          },
          'Error during contract analysis orchestration attempt'
        );
        if (attempt > MAX_ANALYSIS_RETRIES) {
          logger.error('Max analysis retries reached. Analysis failed.');
          throw error; // Re-throw final error
        }
        // Implicitly retries on next loop iteration
      }
    }

    if (!success && !('error' in functionAnalyses)) {
      // If loop finished without success but no specific error marker was set
      // it likely means a general error occurred during the process.
      logger.error('Contract analysis finished without success after retries.');
      // Consider throwing an error or returning a clearer error state
    }

    // Return the final results, potentially partial if analysis failed midway
    return {
      functionAnalyses,
      diagramData,
    };
  }

  /**
   * Generates detailed analysis for functions in batches.
   */
  public async generateFunctionAnalysesInBatches(
    source: string,
    abi: any[]
  ): Promise<FunctionAnalyses> {
    const allFunctionNames = abi
      .filter((item) => item.type === 'function')
      .map((item) => item.name as string);

    if (allFunctionNames.length === 0) {
      logger.warn('No functions found in ABI to analyze.');
      return {};
    }

    const allAnalyses: FunctionAnalyses = {};
    let overallSuccess = true;

    for (let i = 0; i < allFunctionNames.length; i += FUNCTION_BATCH_SIZE) {
      const batchNames = allFunctionNames.slice(i, i + FUNCTION_BATCH_SIZE);
      const batchNumber = Math.floor(i / FUNCTION_BATCH_SIZE) + 1;
      logger.info(`Processing function analysis batch ${batchNumber} (${batchNames.length} functions): ${batchNames.join(', ')}`);

      const messages: ModelMessage[] = [
        {
          role: 'system',
          content: FUNCTION_ANALYSIS_PROMPT,
        },
        {
          role: 'user',
          content: `Source Code:\\n\`\`\`solidity\\n${source}\\n\`\`\`\\n\\nABI:\\n\`\`\`json\\n${JSON.stringify(
            abi, null, 2
          )}\\n\`\`\`\\n\\nFunction Names to Analyze: ${batchNames.join(', ')}`,
        },
      ];

      try {
        const response = await callLlm(
          this.openRouterClient,
          messages,
          `function analysis batch ${batchNumber}`
        );

        if (!response) {
          logger.error(`LLM call failed for function analysis batch ${batchNumber}.`);
          overallSuccess = false;
          continue; // Skip to next batch or handle error more gracefully
        }

        const parsedJson = extractAndParseJson<FunctionAnalyses>(
          response,
          `function analysis batch ${batchNumber} response`
        );

        if (!parsedJson) {
          logger.error(`Failed to parse LLM response for function analysis batch ${batchNumber}. Raw response snippet: ${response.substring(0, 200)}`);
          overallSuccess = false;
          continue; // Skip to next batch
        }

        // Merge results from this batch
        Object.assign(allAnalyses, parsedJson);
        logger.info(`Successfully processed function analysis batch ${batchNumber}.`);

      } catch (batchError) {
        logger.error({ error: batchError }, `Error processing function analysis batch ${batchNumber}.`);
        overallSuccess = false;
        // Decide if one batch failure should halt everything or just be logged
      }
    }

    // If any batch failed, we might return partial results but mark it
    if (!overallSuccess) {
      logger.warn('One or more function analysis batches failed. Results may be incomplete.');
      // Option: Add an error marker to the return object if needed by frontend
      // allAnalyses.error = { description: 'Batch processing failed' };
    }

    logger.info(`Completed batch function analysis. Total functions analyzed: ${Object.keys(allAnalyses).length}`);
    return allAnalyses;
  }

  /**
   * Generates ONLY the general diagram data from the LLM.
   */
  private async generateGeneralDiagramData(
    source: string,
    abi: any[]
  ): Promise<DiagramItem | null> {
    logger.info('Preparing message for LLM - general diagram generation');

    const messages: ModelMessage[] = [
      {
        role: 'system',
        content: SEQUENCE_DIAGRAM_GENERATION_PROMPT,
      },
      {
        role: 'user',
        content: `Analyze the following contract and generate ONLY the general sequence diagram:\\n\\nSource Code:\\n\`\`\`solidity\\n${source}\\n\`\`\`\\n\\nABI:\\n\`\`\`json\\n${JSON.stringify(abi, null, 2)}\\n\`\`\` `,
      },
    ];

    try {
      const response = await callLlm(
        this.openRouterClient,
        messages,
        'general diagram generation'
      );
      if (!response) {
        logger.error('LLM call failed for general diagram generation.');
        return null;
      }

      // Expecting { generalDiagram: DiagramItem }
      const parsedJson = extractAndParseJson<{ generalDiagram: DiagramItem }>(
        response,
        'general diagram generation response'
      );

      if (!parsedJson || !parsedJson.generalDiagram) {
        logger.error(`Failed to parse general diagram from LLM response. Raw response snippet: ${response.substring(0, 200)}`);
        return null;
      }
      logger.info('Successfully generated general diagram.');
      return parsedJson.generalDiagram;
    } catch (error) {
      logger.error({ error }, 'Error during general diagram generation.');
      return null;
    }
  }

  /**
   * Generates function diagram data for a BATCH of function names.
   */
  private async generateFunctionDiagramsBatch(
    source: string,
    abi: any[],
    batchFunctionNames: string[],
    batchNumber: number
  ): Promise<FunctionDiagramBatchOutput | null> {
    if (batchFunctionNames.length === 0) {
      return {};
    }
    logger.info(`Preparing message for LLM - function diagrams batch ${batchNumber} (${batchFunctionNames.length} functions): ${batchFunctionNames.join(', ')}`);

    const messages: ModelMessage[] = [
      {
        role: 'system',
        content: FUNCTION_SEQUENCE_DIAGRAM_BATCH_PROMPT,
      },
      {
        role: 'user',
        content: `Generate sequence diagrams for the following functions ONLY:\\n\\nFunction Names to Generate Diagrams For: ${batchFunctionNames.join(', ')}\\n\\nSource Code:\\n\`\`\`solidity\\n${source}\\n\`\`\`\\n\\nABI:\\n\`\`\`json\\n${JSON.stringify(abi, null, 2)}\\n\`\`\` `,
      },
    ];

    try {
      const response = await callLlm(
        this.openRouterClient,
        messages,
        `function diagrams batch ${batchNumber}`
      );
      if (!response) {
        logger.error(`LLM call failed for function diagrams batch ${batchNumber}.`);
        return null;
      }

      // Expecting { funcName1: DiagramItem, funcName2: DiagramItem, ... }
      const parsedJson = extractAndParseJson<FunctionDiagramBatchOutput>(
        response,
        `function diagrams batch ${batchNumber} response`
      );

      if (!parsedJson) {
        logger.error(`Failed to parse function diagrams from LLM response for batch ${batchNumber}. Raw response snippet: ${response.substring(0, 200)}`);
        return null;
      }

      logger.info(`Successfully generated diagrams for function batch ${batchNumber}.`);
      return parsedJson;

    } catch (error) {
      logger.error({ error }, `Error during function diagram generation for batch ${batchNumber}.`);
      return null;
    }
  }

  /**
   * Generates all diagram data (general and function-specific) using batching for functions.
   */
  public async generateDiagramDataInBatches(
    source: string,
    abi: any[],
    functionAnalyses: FunctionAnalyses
  ): Promise<AnalysisResult> {
    const finalResult: AnalysisResult = {
      generalDiagram: null,
      functionDiagrams: {},
    };

    // 1. Generate General Diagram
    finalResult.generalDiagram = await this.generateGeneralDiagramData(source, abi);

    // 2. Generate Function Diagrams in Batches
    const functionNames = Object.keys(functionAnalyses).filter(key => key !== 'error'); // Exclude potential error marker
    if (functionNames.length > 0) {
      logger.info(`Starting batch generation for ${functionNames.length} function diagrams...`);
      for (let i = 0; i < functionNames.length; i += FUNCTION_BATCH_SIZE) {
        const batchNames = functionNames.slice(i, i + FUNCTION_BATCH_SIZE);
        const batchNumber = Math.floor(i / FUNCTION_BATCH_SIZE) + 1;

        const batchResult = await this.generateFunctionDiagramsBatch(
          source,
          abi,
          batchNames,
          batchNumber
        );

        if (batchResult) {
          // Merge results from this batch
          Object.assign(finalResult.functionDiagrams, batchResult);
        } else {
          logger.warn(`Function diagram batch ${batchNumber} failed or returned null. Diagrams for: ${batchNames.join(', ')} may be missing.`);
          // Decide if we want to mark specific functions as failed
        }
      }
      logger.info(`Completed batch generation for function diagrams. Total diagrams generated: ${Object.keys(finalResult.functionDiagrams).length}`);
    } else {
      logger.warn('No functions available from analysis to generate diagrams for.');
    }

    return finalResult;
  }
}
