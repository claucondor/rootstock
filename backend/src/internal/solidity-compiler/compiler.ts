import * as solc from 'solc';
import { CompilationError, CompilationOutput } from './types';

/**
 * Compile Solidity source code using solc
 * @param source Flattened Solidity source code
 * @param contractName Name of the contract to compile
 * @returns Compilation output with ABI, bytecode, errors, and warnings
 */
export function compileSolc(source: string, contractName: string): CompilationOutput {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Compiling contract with solc...');
    }
    
    // Prepare input for solc
    const input = {
      language: 'Solidity',
      sources: {
        'contract.sol': {
          content: source
        }
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode', 'metadata', 'devdoc', 'userdoc']
          }
        },
        optimizer: {
          enabled: true,
          runs: 200
        },
        evmVersion: 'paris'
      }
    };
    
    // Log the input for debugging (only in development)
    if (process.env.NODE_ENV !== 'production') {
      console.log('Compilation input:', JSON.stringify(input, null, 2).substring(0, 200) + '...');
    }
    
    // Compile the contract
    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    
    // Process errors and warnings
    const errors: CompilationError[] = [];
    const warnings: CompilationError[] = [];
    
    if (output.errors) {
      for (const error of output.errors) {
        if (error.severity === 'error') {
          errors.push({
            severity: 'error',
            message: error.message,
            formattedMessage: error.formattedMessage
          });
        } else if (error.severity === 'warning') {
          warnings.push({
            severity: 'warning',
            message: error.message,
            formattedMessage: error.formattedMessage
          });
        }
      }
    }
    
    // If there are errors, return them
    if (errors.length > 0) {
      return { errors, warnings: warnings.length > 0 ? warnings : undefined };
    }
    
    // Find the contract in the output
    const contracts = output.contracts['contract.sol'];
    
    // Log available contracts for debugging (only in development)
    if (process.env.NODE_ENV !== 'production') {
      console.log('Available contracts:', Object.keys(contracts).join(', '));
    }
    
    // Try to find the contract by name, or use the first contract if not found
    let contractOutput = contracts[contractName];
    
    if (!contractOutput) {
      // If the exact name is not found, try case-insensitive matching
      const contractKey = Object.keys(contracts).find(
        key => key.toLowerCase() === contractName.toLowerCase()
      );
      
      if (contractKey) {
        contractOutput = contracts[contractKey];
      } else {
        // If still not found, use the first contract that's not an interface or abstract
        const nonAbstractContract = Object.keys(contracts).find(key => {
          // Check if the contract has bytecode (non-abstract contracts have bytecode)
          return contracts[key].evm &&
                 contracts[key].evm.bytecode &&
                 contracts[key].evm.bytecode.object &&
                 contracts[key].evm.bytecode.object.length > 0;
        });
        
        if (nonAbstractContract) {
          contractOutput = contracts[nonAbstractContract];
          if (process.env.NODE_ENV !== 'production') {
            console.log(`Using non-abstract contract: ${nonAbstractContract}`);
          }
        } else {
          // If no non-abstract contract found, use the first one
          contractOutput = Object.values(contracts)[0];
        }
      }
    }
    
    if (!contractOutput) {
      throw new Error(`Contract ${contractName} not found in compilation output`);
    }
    
    // Log contract output structure for debugging (only in development)
    if (process.env.NODE_ENV !== 'production') {
      console.log('Contract output keys:', Object.keys(contractOutput).join(', '));
      
      if (contractOutput.abi) {
        console.log('ABI length:', contractOutput.abi.length);
      } else {
        console.log('ABI is undefined or null');
      }
      
      if (contractOutput.evm && contractOutput.evm.bytecode) {
        console.log('Bytecode object length:', contractOutput.evm.bytecode.object ? contractOutput.evm.bytecode.object.length : 0);
      } else {
        console.log('Bytecode is undefined or null');
      }
    }
    
    return {
      abi: contractOutput.abi,
      bytecode: contractOutput.evm?.bytecode?.object || '',
      warnings: warnings.length > 0 ? warnings : undefined
    };
  } catch (error: any) {
    console.error('Error compiling with solc:', error.message);
    throw new Error(`Compilation error: ${error.message}`);
  }
}

/**
 * Extract contract name from Solidity source code
 * @param source Solidity source code
 * @param defaultName Default name to use if extraction fails
 * @returns Extracted contract name
 */
export function extractContractName(source: string, defaultName: string = 'TempContract'): string {
  const contractNameMatch = source.match(/contract\s+(\w+)/);
  return contractNameMatch ? contractNameMatch[1] : defaultName;
}