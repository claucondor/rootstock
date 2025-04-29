import { FastifyInstance } from 'fastify';
import { healthzHandler } from './healthz-handler';

export default async function healthzRoutes(fastify: FastifyInstance) {
  fastify.get('/', healthzHandler);
}
