import { FastifyInstance } from 'fastify';
import { contractGeneratorHandler } from './handler';

export default async function contractGeneratorRoutes(fastify: FastifyInstance) {
  fastify.post('/', contractGeneratorHandler);
} 