import { OpenRouterClient } from '../openrouter/client';
import { ModelMessage } from '../openrouter/types';

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
    const functionDescriptions = await this.generateFunctionDescriptions(source, abi);
    const diagramData = await this.generateDiagramData(source, abi, functionDescriptions);
    
    return {
      functionDescriptions,
      diagramData
    };
  }

  /**
   * Generate descriptions for each function in the contract
   * @param source Solidity source code
   * @param abi Contract ABI
   * @returns Object mapping function names to descriptions
   */
  private async generateFunctionDescriptions(source: string, abi: any): Promise<FunctionDescriptions> {
    const messages: ModelMessage[] = [
      {
        role: "system",
        content: `You are a Solidity smart contract analyzer. Your task is to analyze the provided smart contract and generate clear, concise descriptions for each function. 
        Focus on explaining what each function does, its parameters, return values, and any important side effects or state changes.
        Return your analysis as a valid JSON object where keys are function names and values are descriptions.
        Format: { "functionName": "Description of what the function does", ... }`
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
      const response = await this.openRouterClient.callModel(messages, {
        temperature: 0.1,
        maxTokens: 2048
      });
      
      // Extract JSON from the response
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/```\n([\s\S]*?)\n```/) || response.match(/({[\s\S]*})/);
      
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1]);
      } else {
        try {
          return JSON.parse(response);
        } catch (error) {
          console.error("Failed to parse LLM response as JSON:", error);
          return { error: "Failed to generate function descriptions" };
        }
      }
    } catch (error) {
      console.error("Error calling LLM for function descriptions:", error);
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
  private async generateDiagramData(source: string, abi: any, functionDescriptions: FunctionDescriptions): Promise<DiagramData> {
    const messages: ModelMessage[] = [
      {
        role: "system",
        content: `You are a Solidity smart contract visualizer. Your task is to analyze the provided smart contract and generate data for a ReactFlow diagram.
        Identify the contract's storage variables, functions, and their interactions.
        Return your analysis as a valid JSON object with the following structure:
        {
          "nodes": [
            { "id": "string", "type": "string", "data": { "label": "string" }, "position": { "x": number, "y": number } },
            ...
          ],
          "edges": [
            { "id": "string", "source": "string", "target": "string", "label": "string" },
            ...
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
        
        Return a JSON object with nodes, edges, and an explanation for a ReactFlow diagram.`
      }
    ];

    try {
      const response = await this.openRouterClient.callModel(messages, {
        temperature: 0.1,
        maxTokens: 3072
      });
      
      // Extract JSON from the response
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/```\n([\s\S]*?)\n```/) || response.match(/({[\s\S]*})/);
      
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1]);
      } else {
        try {
          return JSON.parse(response);
        } catch (error) {
          console.error("Failed to parse LLM response as JSON:", error);
          return {
            nodes: [],
            edges: [],
            explanation: "Failed to generate diagram data"
          };
        }
      }
    } catch (error) {
      console.error("Error calling LLM for diagram data:", error);
      return {
        nodes: [],
        edges: [],
        explanation: "Failed to generate diagram data"
      };
    }
  }
}