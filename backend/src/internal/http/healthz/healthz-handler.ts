import { FastifyReply, FastifyRequest } from 'fastify';

export async function healthzHandler(request: FastifyRequest, reply: FastifyReply) {
  reply.code(200).send({ status: 'ok' });
} 