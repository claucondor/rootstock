import { OpenRouterClient } from '../openrouter/client';
import { ModelMessage } from '../openrouter/types';
import pino from 'pino';

const logger = pino();

/**
 * Interface for function descriptions
 */
export interface FunctionDescriptions {
  [functionName: string]: string;
}

/**
 * Interface for diagram data
 */
export interface DiagramData {
  nodes: any[];
  edges: any[];
  explanation: string;
}

/**
 * Service for analyzing smart contracts using LLM
 */
export class ContractAnalyzerService {
  private openRouterClient: OpenRouterClient;

  constructor() {
    this.openRouterClient = new OpenRouterClient();
  }

  /**
   * Analyze a smart contract and generate function descriptions and diagram data
   * @param source Solidity source code
   * @param abi Contract ABI
   * @returns Object containing function descriptions and diagram data
   */
  public async analyzeContract(source: string, abi: any): Promise<{ functionDescriptions: FunctionDescriptions; diagramData: DiagramData }> {
    logger.info('Starting contract analysis');
    logger.info({ sourceLength: source.length, hasAbi: !!abi }, 'Data received for analysis');

    try {
      logger.info('Generating function descriptions...');
      const functionDescriptions = await this.generateFunctionDescriptions(source, abi);
      logger.info({ 
        descriptionCount: Object.keys(functionDescriptions).length,
        hasError: 'error' in functionDescriptions 
      }, 'Function descriptions generated');

      logger.info('Generating diagram data...');
      const diagramData = await this.generateDiagramData(source, abi, functionDescriptions);
      logger.info({ 
        nodeCount: diagramData.nodes.length,
        edgeCount: diagramData.edges.length,
        hasExplanation: !!diagramData.explanation
      }, 'Diagram data generated');

      return {
        functionDescriptions,
        diagramData
      };
    } catch (error) {
      logger.error({ 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }, 'Error during contract analysis');
      throw error;
    }
  }

  /**
   * Generate descriptions for each function in the contract
   * @param source Solidity source code
   * @param abi Contract ABI
   * @returns Object mapping function names to descriptions
   */
  public async generateFunctionDescriptions(source: string, abi: any): Promise<FunctionDescriptions> {
    logger.info('Preparing messages for LLM model - function descriptions');
    
    const messages: ModelMessage[] = [
      {
        role: "system",
        content: `You are a Solidity smart contract analyzer. Your task is to analyze the provided smart contract and generate clear, concise descriptions for each function. 
        Focus on explaining what each function does, its parameters, return values, and any important side effects or state changes.
        
        IMPORTANT: You MUST return ONLY a valid JSON object where keys are function names and values are descriptions.
        Do NOT include any markdown formatting, explanation, or commentary in your response.
        The response MUST be a properly formatted JSON object that can be directly parsed.
        
        Format: 
        {
          "functionName1": "Description of what the function does",
          "functionName2": "Description of what the function does"
        }`
      },
      {
        role: "user",
        content: `Analyze the following Solidity smart contract and provide descriptions for each function.
        
        Source code:
        ${source}
        
        ABI:
        ${JSON.stringify(abi, null, 2)}
        
        Return a JSON object with function names as keys and descriptions as values.`
      }
    ];

    try {
      logger.info('Calling LLM model to generate descriptions...');
      const response = await this.openRouterClient.callModel(messages, {
        temperature: 0.1,
        maxTokens: 2048
      });
      
      logger.info({ responseLength: response.length }, 'Response received from LLM model');
      
      // Extract JSON from the response and parse more safely
      try {
        // First try to parse the direct response
        try {
          const parsed = JSON.parse(response.trim());
          logger.info({ functionCount: Object.keys(parsed).length }, 'Function descriptions parsed successfully (direct JSON)');
          return parsed;
        } catch (directError) {
          // If direct parsing fails, try to extract JSON from markdown
          const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/```\n([\s\S]*?)\n```/) || response.match(/({[\s\S]*})/);
          
          if (jsonMatch && jsonMatch[1]) {
            const parsed = JSON.parse(jsonMatch[1].trim());
            logger.info({ functionCount: Object.keys(parsed).length }, 'Function descriptions parsed successfully (from markdown)');
            return parsed;
          }
          
          // No valid JSON found in the response
          throw new Error('Failed to parse LLM response as JSON');
        }
      } catch (error) {
        logger.error({ 
          error: error instanceof Error ? error.message : String(error),
          response: response.substring(0, 500) // Log part of the response for debugging
        }, "Error parsing LLM response as JSON");
        return { error: "Failed to generate function descriptions" };
      }
    } catch (error) {
      logger.error({ 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }, "Error al llamar al LLM para las descripciones de funciones");
      return { error: "Failed to generate function descriptions" };
    }
  }

  /**
   * Generate diagram data for visualizing the contract
   * @param source Solidity source code
   * @param abi Contract ABI
   * @param functionDescriptions Previously generated function descriptions
   * @returns Diagram data for ReactFlow
   */
  public async generateDiagramData(source: string, abi: any, functionDescriptions: FunctionDescriptions): Promise<DiagramData> {
    logger.info('Preparing messages for LLM model - diagram data');
    
    const messages: ModelMessage[] = [
      {
        role: "system",
        content: `You are a Solidity smart contract visualizer. Your task is to analyze the provided smart contract and generate data for a ReactFlow diagram.
        Identify the contract's storage variables, functions, and their interactions.
        
        IMPORTANT: You MUST return ONLY a valid JSON object with the specified structure below.
        Do NOT include any markdown formatting, explanation, or commentary in your response.
        The response MUST be a properly formatted JSON object that can be directly parsed.
        
        Return format:
        {
          "nodes": [
            { "id": "string", "type": "string", "data": { "label": "string" }, "position": { "x": number, "y": number } }
          ],
          "edges": [
            { "id": "string", "source": "string", "target": "string", "label": "string" }
          ],
          "explanation": "string describing the overall contract architecture and flow"
        }
        
        Node types should be one of: "contract", "function", "storage", "external".
        Position coordinates should be spaced out appropriately for a clear diagram.`
      },
      {
        role: "user",
        content: `Analyze the following Solidity smart contract and generate ReactFlow diagram data.
        
        Source code:
        ${source}
        
        ABI:
        ${JSON.stringify(abi, null, 2)}
        
        Function descriptions:
        ${JSON.stringify(functionDescriptions, null, 2)}
        
        Return ONLY a valid JSON object with nodes, edges, and an explanation for a ReactFlow diagram.`
      }
    ];

    try {
      logger.info('Calling LLM model to generate diagram data...');
      const response = await this.openRouterClient.callModel(messages, {
        temperature: 0.1,
        maxTokens: 3072
      });
      
      logger.info({ responseLength: response.length }, 'Response received from LLM model');
      
      // Extract JSON from the response and parse more safely
      try {
        // First try to parse the direct response
        try {
          const parsed = JSON.parse(response.trim());
          logger.info({ 
            nodeCount: parsed.nodes.length,
            edgeCount: parsed.edges.length
          }, 'Diagram data parsed successfully (direct JSON)');
          return parsed;
        } catch (directError) {
          // If direct parsing fails, try to extract JSON from markdown
          const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/```\n([\s\S]*?)\n```/) || response.match(/({[\s\S]*})/);
          
          if (jsonMatch && jsonMatch[1]) {
            const parsed = JSON.parse(jsonMatch[1].trim());
            logger.info({ 
              nodeCount: parsed.nodes.length,
              edgeCount: parsed.edges.length
            }, 'Diagram data parsed successfully (from markdown)');
            return parsed;
          }
          
          // No valid JSON found in the response
          throw new Error('Failed to parse LLM response as JSON');
        }
      } catch (error) {
        logger.error({ 
          error: error instanceof Error ? error.message : String(error),
          response: response.substring(0, 500) // Log part of the response for debugging
        }, "Error parsing LLM response as JSON");
        return {
          nodes: [],
          edges: [],
          explanation: "Failed to generate diagram data"
        };
      }
    } catch (error) {
      logger.error({ 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }, "Error al llamar al LLM para los datos del diagrama");
      return {
        nodes: [],
        edges: [],
        explanation: "Failed to generate diagram data"
      };
    }
  }
}