import { FastifyReply, FastifyRequest } from 'fastify';
import { ContractAnalyzerService } from '../../contract-analyzer';
import { GenerateDiagramRequest } from './types';
import { ContractAnalysisOutput } from '../../contract-analyzer/types';

const MAX_RETRIES = 3;

/**
 * Handler for generating analysis data (including diagrams) for a smart contract
 * @param request HTTP request
 * @param reply HTTP response
 */
export async function generateDiagramHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { source, abi } = request.body as GenerateDiagramRequest;

  if (!source || !abi || !Array.isArray(abi)) {
    return reply
      .status(400)
      .send({ error: 'Source code and a valid ABI array are required' });
  }

  const contractAnalyzer = new ContractAnalyzerService();
  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < MAX_RETRIES) {
    attempt++;
    try {
      request.log.info(
        { attempt },
        `Starting contract analysis attempt ${attempt}...`
      );

      const analysisResult: ContractAnalysisOutput = await contractAnalyzer.analyzeContract(
        source,
        abi
      );

      if (!analysisResult || !analysisResult.diagramData || !analysisResult.functionAnalyses) {
        throw new Error('Invalid analysis data structure received from service');
      }

      request.log.info(
        {
          attempt,
          analyzedFunctionCount: Object.keys(analysisResult.functionAnalyses).length,
          hasGeneralDiagram: !!analysisResult.diagramData.generalDiagram,
          validatedFunctionDiagramCount: Object.keys(analysisResult.diagramData.functionDiagrams).length
        },
        'Contract analysis generated successfully'
      );

      return reply.send({
        functionAnalyses: analysisResult.functionAnalyses,
        diagramData: analysisResult.diagramData,
        attempts: attempt,
      });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      request.log.error(
        {
          attempt,
          error: lastError.message,
          stack: lastError.stack,
        },
        'Error during contract analysis'
      );

      if (attempt >= MAX_RETRIES) {
        return reply.code(500).send({
          error: 'Failed to analyze contract',
          details: lastError.message,
          attempts: attempt,
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }

  return reply.code(500).send({
    error: 'Failed to analyze contract after multiple retries',
    details: lastError?.message || 'Unknown error',
    attempts: attempt,
  });
}
