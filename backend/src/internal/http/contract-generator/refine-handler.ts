import { FastifyReply, FastifyRequest } from 'fastify';
import { ContractGeneratorService } from '../../contract-generator';

interface RefineContractRequest {
  source: string;
  prompt: string;
}

/**
 * Handler for refining an existing smart contract
 * @param request HTTP Request containing the source code and refinement instructions
 * @param reply HTTP Response
 */
export async function refineContractHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { source, prompt } = request.body as RefineContractRequest;

  if (!source?.trim()) {
    return reply.code(400).send({
      error: 'Contract source code is required',
      details:
        'Please provide the complete source code of the contract to refine',
    });
  }

  if (!prompt?.trim()) {
    return reply.code(400).send({
      error: 'Refinement instructions are required',
      details:
        'Please provide clear instructions on how to modify the contract',
    });
  }

  const contractGenerator = new ContractGeneratorService();
  try {
    const generatedContract = await contractGenerator.refineContract(
      source,
      prompt
    );

    // If there are compilation errors, return a 400 status code
    if (generatedContract.errors && generatedContract.errors.length > 0) {
      return reply.code(400).send({
        error: 'Contract compilation failed',
        source: generatedContract.source,
        errors: generatedContract.errors,
        warnings: generatedContract.warnings,
        attempts: generatedContract.attempts || 1,
      });
    }

    // Return the refined contract with its ABI and bytecode
    return reply.send({
      source: generatedContract.source,
      abi: generatedContract.abi,
      bytecode: generatedContract.bytecode,
      warnings: generatedContract.warnings,
      attempts: generatedContract.attempts || 1,
    });
  } catch (error) {
    console.error('Error refining contract:', error);
    return reply.code(500).send({
      error: 'Failed to refine contract',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
