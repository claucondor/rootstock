# syntax=docker/dockerfile:1
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.json hardhat.config.ts ./
COPY src ./src
# Usar npm ci para instalaciones más consistentes
RUN npm ci && npm run build

# Etapa de producción
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY package.json package-lock.json hardhat.config.ts ./
# Copiar el archivo .env al mismo directorio que el archivo index.js
COPY src/cmd/solidity-compiler-api/.env ./dist/src/cmd/solidity-compiler-api/.env
# También copiarlo a la raíz por si acaso
COPY src/cmd/solidity-compiler-api/.env ./

# Create contracts directory and install dependencies
RUN mkdir -p contracts && \
    # Install production dependencies
    npm ci --omit=dev --ignore-scripts && \
    # Install hardhat and related packages for compilation
    npm install --no-save hardhat@2.23.0 @nomiclabs/hardhat-ethers@2.2.3 ethers@5.8.0 @openzeppelin/contracts@5.3.0 && \
    # Clean npm cache to reduce image size
    npm cache clean --force

# Set environment variables
ENV NODE_ENV=production

# Container metadata
LABEL org.opencontainers.image.description="Solidity compiler and contract generator API"
LABEL org.opencontainers.image.licenses="MIT"

# Cloud Run will set PORT environment variable
# The application is configured to use this variable

CMD ["node", "dist/src/cmd/solidity-compiler-api/index.js"]