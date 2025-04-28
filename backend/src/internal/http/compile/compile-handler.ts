import { FastifyReply, FastifyRequest } from 'fastify';
import { SolidityCompilerService } from '../../solidity-compiler/index';

interface CompileRequestBody {
  source: string;
  contractName?: string;
}

export async function compileHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as CompileRequestBody;
  if (!body || typeof body.source !== 'string' || !body.source.trim()) {
    reply.code(400).send({ error: "El campo 'source' es requerido y debe ser un string no vacío." });
    return;
  }
  const compiler = new SolidityCompilerService();
  try {
    const result = await compiler.compileSolidity(body.source, body.contractName);
    if (result.errors && result.errors.length > 0) {
      reply.code(400).send({ errors: result.errors, warnings: result.warnings });
      return;
    }
    reply.code(200).send({ abi: result.abi, bytecode: result.bytecode, warnings: result.warnings });
  } catch (err: any) {
    reply.code(500).send({ error: err.message || 'Error interno de compilación' });
  }
} 