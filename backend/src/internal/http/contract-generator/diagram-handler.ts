import { FastifyReply, FastifyRequest } from 'fastify';
import { ContractAnalyzerService } from '../../contract-analyzer';
import { GenerateDiagramRequest } from './types';

const MAX_RETRIES = 3;

/**
 * Handler for generating diagram data for a smart contract
 * @param request HTTP request
 * @param reply HTTP response
 */
export async function generateDiagramHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { source, abi, functionDescriptions } = request.body as GenerateDiagramRequest;
  
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
      request.log.info({ attempt }, `Starting diagram generation attempt ${attempt}...`);
      
      // Generate diagram data
      const diagramData = await contractAnalyzer.generateDiagramData(source, abi, functionDescriptions || {});
      
      // Check if we got a valid response with required properties
      if (!diagramData || !diagramData.nodes || !diagramData.edges) {
        throw new Error('Invalid diagram data generated');
      }
      
      request.log.info({ 
        attempt,
        nodeCount: diagramData.nodes.length,
        edgeCount: diagramData.edges.length,
        hasExplanation: !!diagramData.explanation
      }, 'Diagram data generated successfully');
      
      return reply.send({
        diagramData,
        attempts: attempt
      });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      request.log.error({ 
        attempt,
        error: lastError.message,
        stack: lastError.stack
      }, 'Error during diagram generation');
      
      // If this is the last attempt, return error response
      if (attempt >= MAX_RETRIES) {
        return reply.code(500).send({
          error: 'Failed to generate diagram',
          details: lastError.message,
          attempts: attempt
        });
      }
      
      // Wait a short time before retrying, increasing delay with each attempt
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  // This should never be reached due to the return in the error case above
  return reply.code(500).send({
    error: 'Failed to generate diagram',
    details: lastError?.message || 'Unknown error',
    attempts: attempt
  });
} 