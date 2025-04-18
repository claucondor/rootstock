"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolidityCompilerService = void 0;
const solc_1 = __importDefault(require("solc"));
class SolidityCompilerService {
    async compileSolidity(source) {
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
        const output = JSON.parse(solc_1.default.compile(JSON.stringify(input)));
        const warnings = [];
        const errors = [];
        if (output.errors) {
            for (const err of output.errors) {
                if (err.severity === 'warning')
                    warnings.push(err.formattedMessage);
                if (err.severity === 'error')
                    errors.push(err.formattedMessage);
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
exports.SolidityCompilerService = SolidityCompilerService;
