# Prompts para LLM: Solidity Deployer (Frontend y Backend)

---

## Prompts Frontend (Vite + React + MetaMask)

### Prompt 1: Estructura del proyecto y dependencias

Quiero crear una aplicación web con Vite + React que permita a los usuarios escribir contratos inteligentes en Solidity, compilarlos en el navegador y desplegarlos en la red Rootstock (RSK) usando MetaMask.

Dame el archivo `package.json` con las dependencias necesarias: React, Vite, ethers.js, solc-js y Monaco Editor para el editor de código.

Además, indícame cómo debe ser la estructura de carpetas y archivos principales para empezar el proyecto.

---

### Prompt 2: Interfaz y componentes principales

Ahora, crea el archivo `App.jsx` para el frontend.

Debe tener:

- Un editor de código Solidity usando Monaco Editor, con un ejemplo de contrato por defecto.
- Un selector para elegir entre RSK Testnet y Mainnet.
- Un botón para desplegar el contrato.
- Un área para mostrar la dirección y el hash de la transacción del contrato desplegado.

Usa estilos simples y claros. No incluyas aún la lógica de compilación ni deploy, solo la estructura y el estado.

---

### Prompt 3: Lógica de compilación y deploy

Agrega la lógica a `App.jsx` para que:

- Compile el código Solidity usando solc-js en el navegador.
- Use ethers.js para desplegar el contrato a la red seleccionada, conectándose con MetaMask.
- Cambie la red de MetaMask automáticamente si es necesario (o la agregue si no está).
- Si el constructor del contrato requiere argumentos, pide al usuario un string por prompt.
- Muestra errores claros si ocurre algún problema.

El resultado debe mostrar la dirección y el hash de la transacción del contrato desplegado, o el error si ocurre.

---

## Prompts Backend (Node.js + TypeScript)

### Prompt 1: Estructura del proyecto y dependencias

Quiero crear un backend en **Node.js + TypeScript** para compilar contratos Solidity y servirlos vía API HTTP. El proyecto debe ser escalable y profesional, siguiendo una estructura similar a grandes monorepos:

- `src/cmd/solidity-compiler-api/` — Punto de entrada del API de compilación, con su propio Dockerfile, index.ts y server.ts
- `src/internal/solidity-compiler/` — Lógica de compilación de Solidity (usando solc-js), tipos y servicios
- `src/internal/http/compile/` — Handlers y rutas para el endpoint `/compile`
- `src/internal/http/healthz/` — Handler y ruta para `/healthz`
- `src/internal/config/` — Configuración y carga de variables de entorno
- `src/internal/utils/` — Utilidades como logger
- Un Dockerfile por cada comando/API en `cmd/`
- `package.json`, `tsconfig.json`, `README.md`

Dame el `package.json` con dependencias para TypeScript, Express (o Fastify), solc-js, dotenv, y utilidades modernas.

---

### Prompt 2: Esqueleto de archivos y componentes principales

Crea los archivos base para la estructura anterior:

- `cmd/solidity-compiler-api/index.ts` y `server.ts` para levantar el servidor HTTP
- `internal/http/compile/compile-handler.ts` y `routes.ts` para el endpoint `/compile`
- `internal/http/healthz/healthz-handler.ts` y `routes.ts` para `/healthz`
- `internal/solidity-compiler/solc-service.ts` para la lógica de compilación usando solc-js
- `internal/config/env.ts` para cargar variables de entorno
- `internal/utils/logger.ts` para logging básico
- Un `Dockerfile` en `cmd/solidity-compiler-api/` para correr el servicio en Cloud Run

No incluyas aún la lógica de compilación, solo la estructura, imports y exports necesarios.

---

### Prompt 3: Lógica de compilación y endpoint funcional

Implementa la lógica en `solc-service.ts` para compilar código Solidity usando solc-js (en Node.js, no en el navegador). El handler `/compile` debe:

- Recibir código Solidity por POST (JSON: `{ source: string }`)
- Compilar el contrato usando solc-js
- Devolver el ABI, bytecode y advertencias/errores en JSON
- Manejar errores de compilación y validación de input

Asegúrate de que el endpoint sea seguro, robusto y fácil de extender. El Dockerfile debe estar listo para producción en Cloud Run.
