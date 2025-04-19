#!/bin/bash
set -e

# Carpeta destino (relativa a la raíz del proyecto)
DEST=backend/src/internal/contracts-lib
mkdir -p "$DEST"
cd "$DEST"

# OpenZeppelin Contracts v5.3.0
OZ_VERSION=v5.3.0
OZ_URL="https://github.com/OpenZeppelin/openzeppelin-contracts/archive/refs/tags/${OZ_VERSION}.zip"
echo "Descargando OpenZeppelin $OZ_VERSION..."
curl -L "$OZ_URL" -o oz.zip
unzip -q -o oz.zip
OZ_FOLDER=$(find . -maxdepth 1 -type d -name "openzeppelin-contracts-*")
rm -rf openzeppelin || true
mkdir openzeppelin
mv "$OZ_FOLDER/contracts" openzeppelin/
rm -rf "$OZ_FOLDER" oz.zip

# Uniswap v2-core v1.0.1
UNI_V2_CORE_VERSION=v1.0.1
UNI_V2_CORE_URL="https://github.com/Uniswap/v2-core/archive/refs/tags/${UNI_V2_CORE_VERSION}.zip"
echo "Descargando Uniswap v2-core $UNI_V2_CORE_VERSION..."
curl -L "$UNI_V2_CORE_URL" -o univ2core.zip
unzip -q -o univ2core.zip
UNI_V2_CORE_FOLDER=$(find . -maxdepth 1 -type d -name "v2-core-*")
rm -rf uniswap-v2-core || true
mkdir uniswap-v2-core
mv "$UNI_V2_CORE_FOLDER/contracts" uniswap-v2-core/
rm -rf "$UNI_V2_CORE_FOLDER" univ2core.zip

# Uniswap v2-periphery v1.0.0-beta.0
UNI_V2_PERIPHERY_VERSION=v1.0.0-beta.0
UNI_V2_PERIPHERY_URL="https://github.com/Uniswap/v2-periphery/archive/refs/tags/${UNI_V2_PERIPHERY_VERSION}.zip"
echo "Descargando Uniswap v2-periphery $UNI_V2_PERIPHERY_VERSION..."
curl -L "$UNI_V2_PERIPHERY_URL" -o univ2periphery.zip
unzip -q -o univ2periphery.zip
UNI_V2_PERIPHERY_FOLDER=$(find . -maxdepth 1 -type d -name "v2-periphery-*")
rm -rf uniswap-v2-periphery || true
mkdir uniswap-v2-periphery
mv "$UNI_V2_PERIPHERY_FOLDER/contracts" uniswap-v2-periphery/
rm -rf "$UNI_V2_PERIPHERY_FOLDER" univ2periphery.zip

# Uniswap v3-core v1.0.0
UNI_V3_CORE_VERSION=v1.0.0
UNI_V3_CORE_URL="https://github.com/Uniswap/v3-core/archive/refs/tags/${UNI_V3_CORE_VERSION}.zip"
echo "Descargando Uniswap v3-core $UNI_V3_CORE_VERSION..."
curl -L "$UNI_V3_CORE_URL" -o univ3core.zip
unzip -q -o univ3core.zip
UNI_V3_CORE_FOLDER=$(find . -maxdepth 1 -type d -name "v3-core-*")
rm -rf uniswap-v3-core || true
mkdir uniswap-v3-core
mv "$UNI_V3_CORE_FOLDER/contracts" uniswap-v3-core/
rm -rf "$UNI_V3_CORE_FOLDER" univ3core.zip

# Uniswap v3-periphery v1.3.0
UNI_V3_PERIPHERY_VERSION=v1.3.0
UNI_V3_PERIPHERY_URL="https://github.com/Uniswap/v3-periphery/archive/refs/tags/${UNI_V3_PERIPHERY_VERSION}.zip"
echo "Descargando Uniswap v3-periphery $UNI_V3_PERIPHERY_VERSION..."
curl -L "$UNI_V3_PERIPHERY_URL" -o univ3periphery.zip
unzip -q -o univ3periphery.zip
UNI_V3_PERIPHERY_FOLDER=$(find . -maxdepth 1 -type d -name "v3-periphery-*")
rm -rf uniswap-v3-periphery || true
mkdir uniswap-v3-periphery
mv "$UNI_V3_PERIPHERY_FOLDER/contracts" uniswap-v3-periphery/
rm -rf "$UNI_V3_PERIPHERY_FOLDER" univ3periphery.zip

# Chainlink v2.22.0
CHAINLINK_VERSION=v2.22.0
CHAINLINK_URL="https://github.com/smartcontractkit/chainlink/archive/refs/tags/${CHAINLINK_VERSION}.zip"
echo "Descargando Chainlink $CHAINLINK_VERSION..."
curl -L "$CHAINLINK_URL" -o chainlink.zip
unzip -q -o chainlink.zip
CHAINLINK_FOLDER=$(find . -maxdepth 1 -type d -name "chainlink-*")
rm -rf chainlink || true
mkdir chainlink
# Copia toda la estructura de subcarpetas de contracts/src a chainlink/src
mkdir -p chainlink/src
cp -r "$CHAINLINK_FOLDER/contracts/src/"* chainlink/src/
rm -rf "$CHAINLINK_FOLDER" chainlink.zip
# Eliminar la carpeta contracts si quedó
rm -rf chainlink/contracts

# Eliminar todos los archivos que no sean .sol recursivamente en contracts-lib
echo "Eliminando archivos que no son .sol..."
find . -type f ! -name "*.sol" -delete
# Eliminar carpetas vacías
echo "Eliminando carpetas vacías..."
find . -type d -empty -delete

# Copiar la carpeta limpia a dist/internal/contracts-lib para Docker
DIST_DEST=../../../dist/internal/contracts-lib
mkdir -p "$DIST_DEST"
cp -r ./* "$DIST_DEST"/

echo "¡Descarga y limpieza completa! Solo archivos .sol en $DEST y copiados a $DIST_DEST." 