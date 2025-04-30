# syntax=docker/dockerfile:1
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.json hardhat.config.ts ./
COPY src ./src

# Instalar dependencias del sistema para Playwright (Chromium) antes de npm ci
# Esta seccion sera movida a la etapa final
# RUN apk add --no-cache \
#     chromium \
#     nss \
#     freetype \
#     freetype-dev \
#     harfbuzz \
#     ca-certificates \
#     ttf-freefont \
#     udev \
#     ttf-opensans \
#     libstdc++ \
#     libgcc

# Usar npm ci para instalacion mas consistente con verbose
RUN set -x && \
    # Configurar npm para más robustez de red
    npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-retry-maxtimeout 60000 && \
    npm config set maxsockets 3 && \
    # Configuraciones anteriores
    npm config set loglevel verbose && \
    npm config set progress true && \
    npm config set audit true && \
    # Usar mirror de npm
    npm config set registry https://registry.npmmirror.com && \
    # No ignorar scripts ahora que tenemos dependencias de sistema (aunque se movio)
    npm ci --verbose --debug && \
    npm run build --verbose

# Etapa de produccion
FROM node:20-alpine
WORKDIR /app

# Indicar a Puppeteer que use el Chromium instalado por el sistema y que no descargue el suyo
# REMOVED as Puppeteer/Mermaid CLI is no longer used
# ENV PUPPETEER_SKIP_DOWNLOAD=true
# ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Instalar dependencias del sistema (movido de la etapa de build)
# Necesarias para Playwright/Puppeteer que usa Mermaid-CLI
# Ver: https://playwright.dev/docs/ci#docker
# REMOVED as Mermaid-CLI is no longer used
# RUN apk add --no-cache \
#     chromium \
#     nss \
#     freetype \
#     harfbuzz \
#     ca-certificates \
#     ttf-freefont \
#     # udev no esta disponible en Alpine por defecto, puede causar problemas con Chrome headless
#     # Si hay problemas especificos, podria necesitarse instalar 'eudev' o ajustar flags de Chrome
#     # ttf-opensans esta disponible? harfbuzz, freetype, ttf-freefont cubren la mayoria de fuentes
#     libstdc++ \
#     libgcc

# Continuar con la copia y configuración
COPY --from=build /app/dist ./dist
COPY package.json package-lock.json hardhat.config.ts tsconfig.json ./
# Copiar el archivo .env al mismo directorio que el archivo index.js
COPY src/cmd/solidity-compiler-api/.env ./dist/src/cmd/solidity-compiler-api/.env
# Tambien copiar a la raiz por si acaso
COPY src/cmd/solidity-compiler-api/.env ./
# Copiar el script de inicio
COPY src/cmd/solidity-compiler-api/start.sh /app/start.sh

# --- INICIO DE INSTALACIONES SEPARADAS ---

# 1. Configurar npm y crear directorio
RUN set -x && \
    # Configurar npm para máxima verbosidad y usar mirror
    npm config set loglevel silly && \
    npm config set progress true && \
    npm config set audit true && \
    npm config set timing true && \
    npm config set registry https://registry.npmmirror.com && \
    # Crear directorio
    mkdir -p contract

# 2. Instalar dependencias de produccion
RUN set -x && \
    # Configurar npm para más robustez de red (opcional aquí, pero no hace daño)
    npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-retry-maxtimeout 60000 && \
    npm config set maxsockets 3 && \
    # No necesitamos ignorar scripts aqui ya que son dependencias de produccion
    npm ci --omit=dev --ignore-scripts --verbose --debug --timing

# 3. Instalar Hardhat y dependencias relacionadas (pesadas)
RUN set -x && \
    # Configurar npm para más robustez de red
    npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-retry-maxtimeout 60000 && \
    npm config set maxsockets 3 && \
    npm install --no-save --verbose --debug --timing hardhat@2.23.0 @nomiclabs/hardhat-ethers@2.2.3 ethers@5.8.0 @openzeppelin/contracts@4.9.3

# 4. Verificar instalación, mostrar dependencias y limpiar
RUN set -x && \
    # Verificar que los contratos de OpenZeppelin estén instalados correctamente
    ls -la node_modules/@openzeppelin/contracts && \
    # Mostrar información de debug de npm
    npm ls && \
    # Limpiar cache de npm para reducir tamaño de imagen
    npm cache clean --force && \
    # Asegurar que el script de inicio tenga permisos de ejecución
    chmod +x /app/start.sh

# --- FIN DE INSTALACIONES SEPARADAS ---

# Establecer variables de entorno
ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=silly

# Metadata del contenedor
LABEL org.opencontainers.image.description="Solidity compiler and contract generator API"
LABEL org.opencontainers.image.licenses="MIT"

# Cloud Run establecera la variable PORT
# La aplicacion esta configurada para usar esta variable

CMD ["/app/start.sh"]