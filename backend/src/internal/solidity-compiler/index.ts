import * as fs from 'fs';
import * as path from 'path';
import pino from 'pino';

// Import from modular files
import { CompilationOutput } from './types';
import { flattenSolidity } from './flattener';
import { compileSolc, extractContractName } from './compiler';
import { cleanup } from './utils';

// Re-export types for external use
export * from './types';

const logger = pino();

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
      logger.info({ dir: this.contractsDir }, 'Creating contracts directory');
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
    const contractFileName = `TempContract_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.sol`;
    const contractPath = path.join(this.contractsDir, contractFileName);
    
    logger.info({ 
      sourceLength: source.length,
      providedContractName: contractName,
      originalPath,
      tempFile: contractFileName
    }, 'Starting contract compilation');
    
    try {
      // Flatten the source code to resolve dependencies
      logger.info('Flattening source code...');
      const flattenedSource = await flattenSolidity(source, contractPath, originalPath);
      logger.info({ flattenedLength: flattenedSource.length }, 'Source code flattened');
      
      // Use the provided contract name or extract it from the source code
      const extractedContractName = contractName || extractContractName(flattenedSource);
      logger.info({ contractName: extractedContractName }, 'Contract name identified');
      
      // Compile the flattened source with solc
      logger.info('Compiling source code with solc...');
      const result = compileSolc(flattenedSource, extractedContractName);
      
      logger.info({ 
        hasAbi: !!result.abi,
        hasBytecode: !!result.bytecode,
        errorCount: result.errors?.length || 0,
        warningCount: result.warnings?.length || 0
      }, 'Compilation completed');
      
      if (result.errors && result.errors.length > 0) {
        logger.error({ errors: result.errors }, 'Compilation errors found');
      }
      
      if (result.warnings && result.warnings.length > 0) {
        logger.warn({ warnings: result.warnings }, 'Compilation warnings found');
      }
      
      // Clean up the temporary file
      cleanup(contractPath);
      logger.info({ tempFile: contractFileName }, 'Temporary file deleted');
      
      return result;
    } catch (error: any) {
      logger.error({ 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tempFile: contractFileName
      }, 'Error during compilation');
      
      // Clean up the temporary file
      cleanup(contractPath);
      logger.info({ tempFile: contractFileName }, 'Temporary file deleted after error');
      
      // Rethrow the error
      throw new Error(`Compilation error: ${error.message}`);
    }
  }
}