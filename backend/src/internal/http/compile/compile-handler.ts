import { FastifyReply, FastifyRequest } from 'fastify';
import { SolidityCompilerService } from '../../solidity-compiler/index';
import { ContractAnalyzerService } from '../../contract-analyzer/index';

interface CompileRequestBody {
  source: string;
  contractName?: string;
  analyze?: boolean;
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
    
    // Base response with compilation results
    const response = {
      abi: result.abi,
      bytecode: result.bytecode,
      warnings: result.warnings
    };
    
    // If analyze flag is true or not specified (default to true), analyze the contract
    if (body.analyze !== false && result.abi) {
      try {
        const analyzer = new ContractAnalyzerService();
        const analysisResult = await analyzer.analyzeContract(body.source, result.abi);
        
        // Add analysis results to the response
        Object.assign(response, {
          functionDescriptions: analysisResult.functionDescriptions,
          diagramData: analysisResult.diagramData
        });
      } catch (analysisErr: any) {
        console.error('Error analyzing contract:', analysisErr);
        // Still return compilation results even if analysis fails
        Object.assign(response, {
          analysisError: analysisErr.message || 'Error analyzing contract'
        });
      }
    }
    
    reply.code(200).send(response);
  } catch (err: any) {
    reply.code(500).send({ error: err.message || 'Error interno de compilación' });
  }
}