import { FastifyInstance } from 'fastify';
import { generateContractHandler } from './handler';
import { refineContractHandler } from './refine-handler';

export function registerContractGeneratorRoutes(server: FastifyInstance) {
  server.post('/generate', generateContractHandler);
  server.post('/refine', refineContractHandler);
}