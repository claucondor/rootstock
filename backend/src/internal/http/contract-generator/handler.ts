import { FastifyReply, FastifyRequest } from 'fastify';
import { ContractGeneratorService } from '../../contract-generator';
import { GenerateRequest } from './types';

/**
 * Handler for generating a smart contract from a prompt
 * @param request HTTP request
 * @param reply HTTP response
 */
export async function generateContractHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { prompt } = request.body as GenerateRequest;

  if (!prompt?.trim()) {
    request.log.error('Empty or invalid prompt received');
    return reply.code(400).send({ error: 'Valid prompt is required' });
  }

  request.log.info({ prompt }, 'Starting contract generation with prompt');
  const contractGenerator = new ContractGeneratorService();

  try {
    request.log.info('Generating contract...');
    const generatedContract = await contractGenerator.generateContract(prompt);
    request.log.info(
      {
        hasErrors: generatedContract.errors?.length ?? 0 > 0,
        attempts: generatedContract.attempts,
        warnings: generatedContract.warnings?.length,
      },
      'Contract generated'
    );

    if (generatedContract.errors && generatedContract.errors.length > 0) {
      request.log.error(
        {
          errors: generatedContract.errors,
          source: generatedContract.source,
        },
        'Errors in contract generation'
      );
      return reply.code(400).send({
        source: generatedContract.source,
        errors: generatedContract.errors,
        warnings: generatedContract.warnings,
        attempts: generatedContract.attempts || 1,
      });
    }

    // Return the generated contract with its ABI and bytecode
    return reply.send({
      source: generatedContract.source,
      abi: generatedContract.abi,
      bytecode: generatedContract.bytecode,
      warnings: generatedContract.warnings,
      attempts: generatedContract.attempts || 1,
    });
  } catch (error) {
    request.log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Error during contract generation process'
    );

    return reply.code(500).send({
      error: 'Error generating contract',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
