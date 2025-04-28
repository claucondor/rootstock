import { FastifyReply, FastifyRequest } from 'fastify';
import { ContractGeneratorService } from '../../contract-generator';
import { ContractAnalyzerService } from '../../contract-analyzer';

interface GenerateRequest {
  prompt: string;
}

export async function generateContractHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { prompt } = request.body as GenerateRequest;
  
  if (!prompt?.trim()) {
    return reply.code(400).send({ error: 'Se requiere un prompt válido' });
  }

  const contractGenerator = new ContractGeneratorService();
  const contractAnalyzer = new ContractAnalyzerService();
  try {
    const generatedContract = await contractGenerator.generateContract(prompt);
    const analysis = await contractAnalyzer.analyzeContract(
      generatedContract.source,
      generatedContract.abi
    );
    
    // Si hay errores de compilación, devolver un código de estado 400
    if (generatedContract.errors && generatedContract.errors.length > 0) {
      return reply.code(400).send({
        source: generatedContract.source,
        errors: generatedContract.errors,
        warnings: generatedContract.warnings,
        attempts: generatedContract.attempts || 1
      });
    }
    
    // Devolver el contrato generado con su ABI y bytecode
    return reply.send({
      source: generatedContract.source,
      abi: generatedContract.abi,
      bytecode: generatedContract.bytecode,
      warnings: generatedContract.warnings,
      attempts: generatedContract.attempts || 1,
      analysis: {
        functionDescriptions: analysis.functionDescriptions,
        diagramData: analysis.diagramData
      }
    });
  } catch (error) {
    return reply.code(500).send({
      error: 'Error al generar el contrato',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}