import { FastifyInstance } from 'fastify';
import { compileHandler } from './compile-handler';

export function registerRoutes(server: FastifyInstance) {
  server.post('/api/compile', compileHandler);
}