"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const fastify_1 = __importDefault(require("fastify"));
const routes_1 = __importDefault(require("../../internal/http/compile/routes"));
const routes_2 = __importDefault(require("../../internal/http/healthz/routes"));
async function startServer() {
    const fastify = (0, fastify_1.default)({ logger: true });
    fastify.register(routes_2.default, { prefix: '/healthz' });
    fastify.register(routes_1.default, { prefix: '/compile' });
    try {
        await fastify.listen({ port: 8080, host: '0.0.0.0' });
        fastify.log.info('Servidor Fastify escuchando en puerto 8080');
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}
