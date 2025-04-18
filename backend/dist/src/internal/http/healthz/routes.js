"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = healthzRoutes;
const healthz_handler_1 = require("./healthz-handler");
async function healthzRoutes(fastify) {
    fastify.get('/', healthz_handler_1.healthzHandler);
}
