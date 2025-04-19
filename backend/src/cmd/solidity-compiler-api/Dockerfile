# syntax=docker/dockerfile:1
FROM node:20-alpine AS build
WORKDIR /app
COPY ../../package.json ../../tsconfig.json ./
COPY ../../src ./src
RUN npm install && npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY ../../package.json ./
RUN npm install --omit=dev --ignore-scripts
CMD ["node", "dist/src/cmd/solidity-compiler-api/index.js"] 