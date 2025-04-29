import { FastifyInstance } from 'fastify';
import { generateContractHandler } from './handler';
import { refineContractHandler } from './refine-handler';
import { generateDocumentationHandler } from './documentation-handler';
import { generateDiagramHandler } from './diagram-handler';

export function registerContractGeneratorRoutes(server: FastifyInstance) {
  server.post('/generate', generateContractHandler);
  server.post('/refine', refineContractHandler);
  server.post('/generate/documentation', generateDocumentationHandler);
  server.post('/generate/diagram', generateDiagramHandler);
}
