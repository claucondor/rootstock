# Solidity Compiler Backend (Fastify + TypeScript)

Backend API para compilar contratos Solidity usando solc-js, preparado para escalar y crecer con múltiples comandos y endpoints.

## Estructura

```
backend/
  src/
    cmd/
      solidity-compiler-api/
        Dockerfile
        index.ts
        server.ts
    internal/
      solidity-compiler/
        index.ts
        solc-service.ts
        types.ts
      config/
        env.ts
      http/
        compile/
          compile-handler.ts
          routes.ts
        healthz/
          healthz-handler.ts
          routes.ts
      utils/
        logger.ts
    package.json
    tsconfig.json
    README.md
```

## Uso local

```bash
npm install
npm run dev
```

## Build y deploy en Cloud Run

```bash
docker build -t solidity-compiler-api -f src/cmd/solidity-compiler-api/Dockerfile .
# docker run -p 8080:8080 solidity-compiler-api
``` 