import { FastifyReply, FastifyRequest } from 'fastify';
import { ContractAnalyzerService } from '../../contract-analyzer';
import { GenerateDocumentationRequest } from './types';
import { FunctionAnalyses } from '../../contract-analyzer/types';

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
      details: 'Please provide the complete source code of the contract',
    });
  }

  if (!abi) {
    request.log.error('Missing or invalid ABI received');
    return reply.code(400).send({
      error: 'Valid contract ABI is required',
      details: 'Please provide the contract ABI for accurate function analysis',
    });
  }

  try {
    let attempt = 0;
    let functionAnalyses: FunctionAnalyses | null = null;
    let lastError: any = null;

    while (
      attempt < MAX_RETRIES &&
      (!functionAnalyses || 'error' in functionAnalyses)
    ) {
      attempt++;
      request.log.info(
        { reqId: request.id, attempt },
        `Starting documentation generation attempt ${attempt}...`
      );
      try {
        const contractAnalyzer = new ContractAnalyzerService();
        functionAnalyses = await contractAnalyzer.generateFunctionAnalyses(
          source,
          abi
        );
        if (!functionAnalyses || 'error' in functionAnalyses) {
          // If the analysis service returned its own error marker, use its description
          lastError = new Error(
            (functionAnalyses as any)?.error?.description ||
              'Analysis returned an error marker.'
          );
          request.log.warn(
            { reqId: request.id, attempt, error: lastError.message },
            'Analysis attempt returned error marker'
          );
          functionAnalyses = null; // Reset to allow retry
        } else {
          lastError = null; // Clear last error on success
          break; // Exit loop on success
        }
      } catch (e) {
        lastError = e;
        request.log.error(
          { reqId: request.id, attempt, error: e },
          `Error during documentation generation attempt ${attempt}`
        );
      }
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }
    }

    // Check final result after retries
    if (!functionAnalyses || 'error' in functionAnalyses) {
      // Linter Fix: Use the message from the last recorded error
      throw (
        lastError ||
        new Error('Documentation generation failed after multiple retries.')
      );
    }

    request.log.info(
      {
        attempt,
        functionCount: Object.keys(functionAnalyses).length,
      },
      'Documentation generated successfully'
    );

    return reply.send({
      functionAnalyses,
      attempts: attempt,
    });
  } catch (error: any) {
    // ... error handling ...
  }
}
