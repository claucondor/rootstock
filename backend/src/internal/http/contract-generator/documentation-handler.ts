import { FastifyReply, FastifyRequest } from 'fastify';
import { ContractAnalyzerService } from '../../contract-analyzer';
import { GenerateDocumentationRequest } from './types';

const MAX_RETRIES = 3;

/**
 * Handler for generating documentation for a smart contract
 * @param request HTTP request
 * @param reply HTTP response
 */
export async function generateDocumentationHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { source, abi } = request.body as GenerateDocumentationRequest;
  
  if (!source?.trim()) {
    request.log.error('Empty or invalid source code received');
    return reply.code(400).send({ 
      error: 'Valid source code is required',
      details: 'Please provide the complete source code of the contract'
    });
  }

  if (!abi) {
    request.log.error('Missing or invalid ABI received');
    return reply.code(400).send({ 
      error: 'Valid contract ABI is required',
      details: 'Please provide the contract ABI for accurate function analysis'
    });
  }

  const contractAnalyzer = new ContractAnalyzerService();
  let attempt = 0;
  let lastError: Error | null = null;
  
  while (attempt < MAX_RETRIES) {
    attempt++;
    try {
      request.log.info({ attempt }, `Starting documentation generation attempt ${attempt}...`);
      
      // Generate function descriptions
      const functionDescriptions = await contractAnalyzer.generateFunctionDescriptions(source, abi);
      
      // Check if we got a valid response
      if ('error' in functionDescriptions) {
        throw new Error(functionDescriptions.error);
      }
      
      request.log.info({ 
        attempt,
        functionCount: Object.keys(functionDescriptions).length
      }, 'Documentation generated successfully');
      
      return reply.send({
        functionDescriptions,
        attempts: attempt
      });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      request.log.error({ 
        attempt,
        error: lastError.message,
        stack: lastError.stack
      }, 'Error during documentation generation');
      
      // If this is the last attempt, return error response
      if (attempt >= MAX_RETRIES) {
        return reply.code(500).send({
          error: 'Failed to generate documentation',
          details: lastError.message,
          attempts: attempt
        });
      }
      
      // Wait a short time before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  // This should never be reached due to the return in the error case above
  return reply.code(500).send({
    error: 'Failed to generate documentation',
    details: lastError?.message || 'Unknown error',
    attempts: attempt
  });
} 