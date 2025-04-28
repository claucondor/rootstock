import { FastifyReply, FastifyRequest } from 'fastify';
import { ContractGeneratorService } from '../../contract-generator';

interface RefineContractRequest {
  source: string;
  prompt: string;
}

/**
 * Manejador para refinar un contrato existente
 * @param request Solicitud HTTP
 * @param reply Respuesta HTTP
 */
export async function refineContractHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { source, prompt } = request.body as RefineContractRequest;
  
  if (!source?.trim()) {
    return reply.code(400).send({ error: 'Se requiere el código fuente del contrato' });
  }
  
  if (!prompt?.trim()) {
    return reply.code(400).send({ error: 'Se requiere un prompt con instrucciones para modificar el contrato' });
  }

  const contractGenerator = new ContractGeneratorService();
  try {
    const generatedContract = await contractGenerator.refineContract(source, prompt);
    
    // Si hay errores de compilación, devolver un código de estado 400
    if (generatedContract.errors && generatedContract.errors.length > 0) {
      return reply.code(400).send({
        source: generatedContract.source,
        errors: generatedContract.errors,
        warnings: generatedContract.warnings,
        attempts: generatedContract.attempts || 1
      });
    }
    
    // Devolver el contrato refinado con su ABI y bytecode
    return reply.send({
      source: generatedContract.source,
      abi: generatedContract.abi,
      bytecode: generatedContract.bytecode,
      warnings: generatedContract.warnings,
      attempts: generatedContract.attempts || 1
    });
  } catch (error) {
    return reply.code(500).send({
      error: 'Error al refinar el contrato',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}