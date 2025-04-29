/**
 * Request body for generating a smart contract
 */
export interface GenerateRequest {
  /**
   * Prompt describing the contract to generate
   */
  prompt: string;
}

/**
 * Request body for refining an existing smart contract
 */
export interface RefineContractRequest {
  /**
   * Source code of the existing contract
   */
  source: string;
  
  /**
   * Instructions for modifying the contract
   */
  prompt: string;
}

/**
 * Request body for generating documentation for a contract
 */
export interface GenerateDocumentationRequest {
  /**
   * Source code of the contract
   */
  source: string;
  
  /**
   * Contract ABI
   */
  abi: any;
}

/**
 * Request body for generating diagram data for a contract
 */
export interface GenerateDiagramRequest {
  /**
   * Source code of the contract
   */
  source: string;
  
  /**
   * Contract ABI
   */
  abi: any;
  
  /**
   * Function descriptions (optional)
   */
  functionDescriptions?: Record<string, string>;
} 