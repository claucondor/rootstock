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

    // Import resolver para OpenZeppelin y cualquier URL remota
    async function findImport(path: string) {
      // Soporte para OpenZeppelin vía GitHub
      if (path.startsWith('@openzeppelin/')) {
        const url = `https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v4.9.3/${path.replace('@openzeppelin/', '')}`;
        try {
          const res = await axios.get(url);
          return { contents: res.data };
        } catch (e) {
          return { error: 'No se pudo resolver el import: ' + path };
        }
      }
      // Soporte para cualquier import remoto http(s)
      if (path.startsWith('http://') || path.startsWith('https://')) {
        try {
          const res = await axios.get(path);
          return { contents: res.data };
        } catch (e) {
          return { error: 'No se pudo resolver el import remoto: ' + path };
        }
      }
      // Otros imports no soportados
      return { error: 'Import no soportado: ' + path };
    }

    // Usar la versión async de solc.compile para soportar el import resolver async
    const output = JSON.parse(await new Promise<string>((resolve, reject) => {
      solc.compile(
        JSON.stringify(input),
        {
          import: (path: string) => {
            // solc.compile espera un import resolver sync, así que usamos una promesa y resolvemos async
            // pero solc-js >=0.8.0 soporta import async
            // Si tu versión de solc-js no soporta esto, hay que actualizarla
            throw new Error('El compilador debe soportar import async');
          },
        },
        async (path: string) => {
          const result = await findImport(path);
          return result;
        },
        (err: any, compiled: string) => {
          if (err) reject(err);
          else resolve(compiled);
        }
      );
    }));

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