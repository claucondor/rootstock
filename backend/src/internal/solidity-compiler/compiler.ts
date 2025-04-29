import * as solc from 'solc';
import { CompilationError, CompilationOutput } from './types';
import pino from 'pino';

const logger = pino();

/**
 * Compile Solidity source code using solc
 * @param source Flattened Solidity source code
 * @param contractName Name of the contract to compile
 * @returns Compilation output with ABI, bytecode, errors, and warnings
 */
export function compileSolc(
  source: string,
  contractName: string
): CompilationOutput {
  try {
    logger.info(
      { sourceLength: source.length, contractName },
      'Starting compilation with solc'
    );

    // Prepare input for solc
    const input = {
      language: 'Solidity',
      sources: {
        'contract.sol': {
          content: source,
        },
      },
      settings: {
        outputSelection: {
          '*': {
            '*': [
              'abi',
              'evm.bytecode',
              'evm.deployedBytecode',
              'metadata',
              'devdoc',
              'userdoc',
            ],
          },
        },
        optimizer: {
          enabled: true,
          runs: 200,
        },
        evmVersion: 'paris',
      },
    };

    logger.info(
      {
        inputConfig: {
          language: input.language,
          optimizer: input.settings.optimizer,
          evmVersion: input.settings.evmVersion,
        },
      },
      'Compilation configuration prepared'
    );

    // Compile the contract
    logger.info('Executing solc compiler...');
    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    logger.info('Compilation completed, processing results');

    // Process errors and warnings
    const errors: CompilationError[] = [];
    const warnings: CompilationError[] = [];

    if (output.errors) {
      logger.info(
        { errorCount: output.errors.length },
        'Processing errors and warnings'
      );
      for (const error of output.errors) {
        if (error.severity === 'error') {
          errors.push({
            severity: 'error',
            message: error.message,
            formattedMessage: error.formattedMessage,
          });
        } else if (error.severity === 'warning') {
          warnings.push({
            severity: 'warning',
            message: error.message,
            formattedMessage: error.formattedMessage,
          });
        }
      }

      logger.info(
        {
          errorCount: errors.length,
          warningCount: warnings.length,
        },
        'Errors and warnings processed'
      );
    }

    // If there are errors, return them
    if (errors.length > 0) {
      logger.error({ errors }, 'Compilation errors found');
      return { errors, warnings: warnings.length > 0 ? warnings : undefined };
    }

    // Find the contract in the output
    const contracts = output.contracts['contract.sol'];
    const availableContracts = Object.keys(contracts);

    logger.info(
      {
        availableContracts,
        requestedContract: contractName,
      },
      'Contracts available in output'
    );

    // Try to find the contract by name, or use the first contract if not found
    let contractOutput = contracts[contractName];
    let selectedContractName = contractName;

    if (!contractOutput) {
      logger.info('Contract not found by exact name, searching alternatives');

      // If the exact name is not found, try case-insensitive matching
      const contractKey = Object.keys(contracts).find(
        (key) => key.toLowerCase() === contractName.toLowerCase()
      );

      if (contractKey) {
        logger.info(
          { matchedName: contractKey },
          'Contract found by case-insensitive match'
        );
        contractOutput = contracts[contractKey];
        selectedContractName = contractKey;
      } else {
        // If still not found, use the first contract that's not an interface or abstract
        const nonAbstractContract = Object.keys(contracts).find((key) => {
          // Check if the contract has bytecode (non-abstract contracts have bytecode)
          return (
            contracts[key].evm &&
            contracts[key].evm.bytecode &&
            contracts[key].evm.bytecode.object &&
            contracts[key].evm.bytecode.object.length > 0
          );
        });

        if (nonAbstractContract) {
          logger.info(
            { selectedContract: nonAbstractContract },
            'Using first non-abstract contract found'
          );
          contractOutput = contracts[nonAbstractContract];
          selectedContractName = nonAbstractContract;
        } else {
          // If no non-abstract contract found, use the first one
          const firstContract = Object.keys(contracts)[0];
          logger.info(
            { selectedContract: firstContract },
            'Using first available contract'
          );
          contractOutput = contracts[firstContract];
          selectedContractName = firstContract;
        }
      }
    }

    if (!contractOutput) {
      logger.error(
        { contractName },
        'Contract not found in compilation output'
      );
      throw new Error(
        `Contract ${contractName} not found in compilation output`
      );
    }

    logger.info(
      {
        selectedContract: selectedContractName,
        hasAbi: !!contractOutput.abi,
        abiLength: contractOutput.abi?.length,
        hasBytecode: !!contractOutput.evm?.bytecode?.object,
        bytecodeLength: contractOutput.evm?.bytecode?.object?.length,
        warningCount: warnings.length,
      },
      'Contract compiled successfully'
    );

    return {
      abi: contractOutput.abi,
      bytecode: contractOutput.evm?.bytecode?.object || '',
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error: any) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Error during compilation with solc'
    );
    throw new Error(`Compilation error: ${error.message}`);
  }
}

/**
 * Extract contract name from Solidity source code
 * @param source Solidity source code
 * @param defaultName Default name to use if extraction fails
 * @returns Extracted contract name
 */
export function extractContractName(
  source: string,
  defaultName: string = 'TempContract'
): string {
  logger.info(
    { sourceLength: source.length, defaultName },
    'Extracting contract name'
  );
  // Improved regex that handles inheritance with 'is' keyword
  // This matches 'contract Name' or 'contract Name is SomethingElse'
  const contractNameMatch = source.match(/contract\s+(\w+)(?:\s+is\s+|[\s{])/);
  const extractedName = contractNameMatch ? contractNameMatch[1] : defaultName;
  logger.info({ extractedName }, 'Contract name extracted');
  return extractedName;
}
