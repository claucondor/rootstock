import Fastify from 'fastify';
import cors from '@fastify/cors';
import { registerRoutes } from '../../internal/http/compile/routes';
import healthzRoutes from '../../internal/http/healthz/routes';
import { registerContractGeneratorRoutes } from '../../internal/http/contract-generator/routes';

export async function startServer() {
  const fastify = Fastify({ logger: true });

  await fastify.register(cors, {
    origin: true,
  });

  fastify.register(healthzRoutes);
  registerRoutes(fastify);
  registerContractGeneratorRoutes(fastify);

  try {
    await fastify.listen({ port: 8080, host: '0.0.0.0' });
    fastify.log.info('Server listening on port 8080');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}