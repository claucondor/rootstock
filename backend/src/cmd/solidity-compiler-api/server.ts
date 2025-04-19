import Fastify from 'fastify';
import cors from '@fastify/cors';
import compileRoutes from '../../internal/http/compile/routes';
import healthzRoutes from '../../internal/http/healthz/routes';

export async function startServer() {
  const fastify = Fastify({ logger: true });

  await fastify.register(cors, {
    origin: true, // Permite cualquier origen
  });

  fastify.register(healthzRoutes, { prefix: '/healthz' });
  fastify.register(compileRoutes, { prefix: '/compile' });

  try {
    await fastify.listen({ port: 8080, host: '0.0.0.0' });
    fastify.log.info('Servidor Fastify escuchando en puerto 8080');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
} 