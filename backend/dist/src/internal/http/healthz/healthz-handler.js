"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthzHandler = healthzHandler;
async function healthzHandler(request, reply) {
    reply.code(200).send({ status: 'ok' });
}
