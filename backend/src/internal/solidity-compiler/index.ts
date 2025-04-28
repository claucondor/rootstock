import * as fs from 'fs';
import * as path from 'path';

// Import from modular files
import { CompilationOutput } from './types';
import { flattenSolidity } from './flattener';
import { compileSolc, extractContractName } from './compiler';
import { cleanup } from './utils';

// Re-export types for external use
export * from './types';

/**
 * Service for compiling Solidity smart contracts
 */
export class SolidityCompilerService {
  private contractsDir: string;

  constructor() {
    // Use the contracts directory in the project
    this.contractsDir = path.join(process.cwd(), 'contracts');
    
    // Ensure the contracts directory exists
    if (!fs.existsSync(this.contractsDir)) {
      fs.mkdirSync(this.contractsDir, { recursive: true });
    }
  }

  /**
   * Compile Solidity source code
   * @param source Solidity source code
   * @param contractName Optional name of the contract to compile. If not provided, it will be extracted from the source.
   * @param originalPath Optional original path for the contract
   * @returns Compilation output with ABI, bytecode, errors, and warnings
   */
  public async compileSolidity(source: string, contractName?: string, originalPath?: string): Promise<CompilationOutput> {
    // Generate a unique filename to avoid conflicts
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const contractFileName = `TempContract_${timestamp}_${randomStr}.sol`;
    const contractPath = path.join(this.contractsDir, contractFileName);
    
    try {
      // Flatten the source code to resolve dependencies
      const flattenedSource = await flattenSolidity(source, contractPath, originalPath);
      
      // Use the provided contract name or extract it from the source code
      const extractedContractName = contractName || extractContractName(flattenedSource);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Compiling contract: ${extractedContractName}`);
      }
      
      // Compile the flattened source with solc
      const result = compileSolc(flattenedSource, extractedContractName);
      
      // Clean up the temporary file
      cleanup(contractPath);
      
      return result;
    } catch (error: any) {
      // Clean up the temporary file
      cleanup(contractPath);
      
      // Rethrow the error
      throw new Error(`Compilation error: ${error.message}`);
    }
  }
}