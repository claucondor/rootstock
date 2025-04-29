#!/bin/sh
echo "Verificando instalación de OpenZeppelin..."
if [ ! -d "/app/node_modules/@openzeppelin/contracts" ]; then
  echo "Instalando @openzeppelin/contracts..."
  npm install --no-save @openzeppelin/contracts@4.9.3
fi
echo "Iniciando aplicación..."
exec node dist/src/cmd/solidity-compiler-api/index.js 