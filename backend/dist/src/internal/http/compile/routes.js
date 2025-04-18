"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = compileRoutes;
const compile_handler_1 = require("./compile-handler");
async function compileRoutes(fastify) {
    fastify.post('/', compile_handler_1.compileHandler);
}
