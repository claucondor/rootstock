"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileHandler = compileHandler;
const solidity_compiler_1 = require("../../solidity-compiler");
async function compileHandler(request, reply) {
    const body = request.body;
    if (!body || typeof body.source !== 'string' || !body.source.trim()) {
        reply.code(400).send({ error: "El campo 'source' es requerido y debe ser un string no vacío." });
        return;
    }
    const compiler = new solidity_compiler_1.SolidityCompilerService();
    try {
        const result = await compiler.compileSolidity(body.source);
        if (result.errors && result.errors.length > 0) {
            reply.code(400).send({ errors: result.errors, warnings: result.warnings });
            return;
        }
        reply.code(200).send({ abi: result.abi, bytecode: result.bytecode, warnings: result.warnings });
    }
    catch (err) {
        reply.code(500).send({ error: err.message || 'Error interno de compilación' });
    }
}
