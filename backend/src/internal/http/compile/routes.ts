import { FastifyInstance } from 'fastify';
import { compileHandler } from './compile-handler';

export default async function compileRoutes(fastify: FastifyInstance) {
  fastify.post('/', compileHandler);
} 