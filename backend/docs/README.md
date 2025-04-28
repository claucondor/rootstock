# Generador de Contratos Inteligentes API

Esta API permite generar y refinar contratos inteligentes utilizando OpenZeppelin y Uniswap V3 en Rootstock a partir de descripciones en lenguaje natural.

## Características

- **Generación de contratos**: Crea contratos inteligentes a partir de descripciones en lenguaje natural
- **Refinamiento de contratos**: Modifica contratos existentes con instrucciones específicas
- **Soporte para múltiples frameworks**:
  - OpenZeppelin 4.9.3
  - Uniswap V3 en Rootstock
  - Combinación de ambos frameworks

## Documentación OpenAPI

La especificación completa de la API está disponible en formato OpenAPI en el archivo [contract-generator-api.yaml](./contract-generator-api.yaml).

Para visualizar la documentación de forma interactiva, puedes usar herramientas como:
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [Redoc](https://redocly.github.io/redoc/)

## Endpoints

### Generar un contrato

```
POST /generate
```

Genera un nuevo contrato inteligente basado en una descripción en lenguaje natural.

#### Parámetros de solicitud

```json
{
  "prompt": "Descripción del contrato a generar"
}
```

#### Ejemplos

1. **Contrato solo con OpenZeppelin**:

```json
{
  "prompt": "Crea un token ERC20 simple llamado \"MiToken\" con símbolo \"MTK\" y 18 decimales. Debe tener una función de mint que solo pueda ser llamada por el owner."
}
```

2. **Contrato solo con Uniswap**:

```json
{
  "prompt": "Crea un contrato que permita hacer swaps en Uniswap V3 en Rootstock. Debe tener una función para hacer swap de tokens exactos por la máxima cantidad posible de otro token."
}
```

3. **Contrato combinado**:

```json
{
  "prompt": "Crea un token ERC20 llamado \"SwapToken\" con símbolo \"SWT\" y 18 decimales que también tenga una función para hacer swaps directamente con Uniswap V3 en Rootstock. El token debe permitir a los usuarios intercambiar sus tokens por otros tokens usando Uniswap."
}
```

### Refinar un contrato

```
POST /refine
```

Refina un contrato inteligente existente basado en instrucciones específicas.

#### Parámetros de solicitud

```json
{
  "source": "Código fuente del contrato existente",
  "prompt": "Instrucciones para modificar el contrato"
}
```

#### Ejemplo

```json
{
  "source": "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\nimport \"@openzeppelin/contracts/token/ERC20/ERC20.sol\";\nimport \"@openzeppelin/contracts/access/Ownable.sol\";\n\ncontract MiToken is ERC20, Ownable {\n    constructor() ERC20(\"MiToken\", \"MTK\") {}\n\n    function mint(address to, uint256 amount) public onlyOwner {\n        _mint(to, amount);\n    }\n}",
  "prompt": "Agrega una función burn que permita a los usuarios quemar sus propios tokens."
}
```

## Respuestas

### Éxito

```json
{
  "source": "Código fuente del contrato generado",
  "abi": [...],
  "bytecode": "...",
  "warnings": [...],
  "attempts": 1
}
```

### Error

```json
{
  "source": "Código fuente del contrato con errores",
  "errors": [...],
  "warnings": [...],
  "attempts": 1
}
```

## Uso con curl

### Generar un contrato

```bash
curl -X POST http://localhost:8080/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Crea un token ERC20 simple llamado \"MiToken\" con símbolo \"MTK\" y 18 decimales."}'
```

### Refinar un contrato

```bash
curl -X POST http://localhost:8080/refine \
  -H "Content-Type: application/json" \
  -d '{
    "source": "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\nimport \"@openzeppelin/contracts/token/ERC20/ERC20.sol\";\n\ncontract MiToken is ERC20 {\n    constructor() ERC20(\"MiToken\", \"MTK\") {}\n}",
    "prompt": "Agrega una función mint que solo pueda ser llamada por el owner."
  }'
```

## Tecnologías utilizadas

- **OpenZeppelin 4.9.3**: Framework para el desarrollo seguro de contratos inteligentes
- **Uniswap V3**: Protocolo de intercambio descentralizado
- **Rootstock**: Sidechain de Bitcoin que permite la ejecución de contratos inteligentes
- **Solidity**: Lenguaje de programación para contratos inteligentes
- **Hardhat**: Entorno de desarrollo para Ethereum