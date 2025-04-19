import solc from 'solc';
import axios from 'axios';

export interface CompileResult {
  abi: any;
  bytecode: string;
  warnings?: string[];
  errors?: string[];
}

export class SolidityCompilerService {
  async compileSolidity(source: string): Promise<CompileResult> {
    const input = {
      language: 'Solidity',
      sources: {
        'Contract.sol': {
          content: source,
        },
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode'],
          },
        },
      },
    };

    // Compilar directamente el código flatten, sin resolver imports
    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    const warnings: string[] = [];
    const errors: string[] = [];
    if (output.errors) {
      for (const err of output.errors) {
        if (err.severity === 'warning') warnings.push(err.formattedMessage);
        if (err.severity === 'error') errors.push(err.formattedMessage);
      }
    }
    if (errors.length > 0) {
      return { abi: [], bytecode: '', warnings, errors };
    }
    // Tomar el primer contrato encontrado
    const contractName = Object.keys(output.contracts['Contract.sol'])[0];
    const contract = output.contracts['Contract.sol'][contractName];
    return {
      abi: contract.abi,
      bytecode: contract.evm.bytecode.object,
      warnings,
    };
  }
} 