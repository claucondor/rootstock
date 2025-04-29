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

  // Use PORT environment variable provided by Cloud Run, or default to 8080
  const port = parseInt(process.env.PORT || '8080');

  try {
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Server listening on port ${port}`);

    // Handle graceful shutdown (important for Cloud Run)
    const signals = ['SIGTERM', 'SIGINT'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        fastify.log.info(`Received ${signal}, shutting down gracefully`);
        await fastify.close();
        process.exit(0);
      });
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}
