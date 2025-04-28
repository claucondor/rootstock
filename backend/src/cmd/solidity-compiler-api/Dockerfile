# syntax=docker/dockerfile:1
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.json hardhat.config.ts ./
COPY src ./src
# Usar npm ci para instalacion mas consistente
RUN npm ci && npm run build

# Etapa de produccion
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY package.json package-lock.json hardhat.config.ts tsconfig.json ./
# Copiar el archivo .env al mismo directorio que el archivo index.js
COPY src/cmd/solidity-compiler-api/.env ./dist/src/cmd/solidity-compiler-api/.env
# Tambien copiar a la raiz por si acaso
COPY src/cmd/solidity-compiler-api/.env ./

# Crear directorio contracts e instalar dependencias
RUN mkdir -p contract && \
    # Instalar dependencias de produccion
    npm ci --omit=dev --ignore-scripts && \
    # Instalar hardhat y paquetes relacionados para compilacion
    npm install --no-save hardhat@2.23.0 @nomiclabs/hardhat-ethers@2.2.3 ethers@5.8.0 @openzeppelin/contracts@5.3.0 && \
    # Limpiar cache de npm para reducir tamaño de imagen
    npm cache clean --force

# Establecer variables de entorno
ENV NODE_ENV=production

# Metadata del contenedor
LABEL org.opencontainers.image.description="Solidity compiler and contract generator API"
LABEL org.opencontainers.image.licenses="MIT"

# Cloud Run establecera la variable PORT
# La aplicacion esta configurada para usar esta variable

CMD ["node", "dist/src/cmd/solidity-compiler-api/index.js"]