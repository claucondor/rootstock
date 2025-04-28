# Despliegue en Cloud Run

Este documento contiene instrucciones para construir y desplegar el servicio en Google Cloud Run.

## Requisitos previos

1. [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) instalado y configurado
2. [Docker](https://docs.docker.com/get-docker/) instalado
3. Acceso a un proyecto de Google Cloud con las APIs necesarias habilitadas:
   - Cloud Run API
   - Container Registry API o Artifact Registry API

## Opciones para construir y desplegar

Tienes dos opciones para construir y desplegar el servicio:

1. **Usando el Makefile (recomendado)**: Utiliza los comandos `make` que ya están configurados en el proyecto.
2. **Usando Docker directamente**: Construye y despliega manualmente usando comandos Docker y gcloud.

## Opción 1: Usando el Makefile

### 1. Autenticación con Google Cloud

```bash
# Iniciar sesión en Google Cloud
gcloud auth login

# Configurar el proyecto
gcloud config set project TU_ID_DE_PROYECTO
```

### 2. Construir y probar localmente

```bash
# Navegar al directorio backend
cd backend

# Construir y ejecutar el contenedor localmente
make docker APP_NAME=solidity-compiler-api
```

### 3. Desplegar en Cloud Run

```bash
# Desplegar en Cloud Run
make deploy APP_NAME=solidity-compiler-api
```

## Opción 2: Usando Docker directamente

### 1. Autenticación con Google Cloud

```bash
# Iniciar sesión en Google Cloud
gcloud auth login

# Configurar el proyecto
gcloud config set project TU_ID_DE_PROYECTO
```

### 2. Construir la imagen de Docker

```bash
# Navegar al directorio backend
cd backend

# Construir la imagen usando Cloud Build
gcloud builds submit --tag gcr.io/TU_ID_DE_PROYECTO/solidity-compiler-api -f src/cmd/solidity-compiler-api/Dockerfile .
```

Alternativamente, puedes construir la imagen localmente y subirla:

```bash
# Construir la imagen localmente
docker build -t gcr.io/TU_ID_DE_PROYECTO/solidity-compiler-api -f src/cmd/solidity-compiler-api/Dockerfile .

# Configurar Docker para usar las credenciales de gcloud
gcloud auth configure-docker

# Subir la imagen
docker push gcr.io/TU_ID_DE_PROYECTO/solidity-compiler-api
```

### 3. Desplegar en Cloud Run

```bash
gcloud run deploy solidity-compiler-api \
  --image gcr.io/TU_ID_DE_PROYECTO/solidity-compiler-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --concurrency 80 \
  --timeout 300s
```

Ajusta los parámetros según tus necesidades:
- `--region`: La región donde se desplegará el servicio
- `--memory`: Cantidad de memoria asignada al servicio
- `--cpu`: Número de CPUs asignadas
- `--concurrency`: Número máximo de solicitudes simultáneas por instancia
- `--timeout`: Tiempo máximo para procesar una solicitud
- `--allow-unauthenticated`: Permite acceso público (quitar para servicios privados)

### 4. Variables de entorno (importante)

Tu servicio requiere variables de entorno para funcionar correctamente, especialmente la clave de API de OpenRouter. Para configurarlas en Cloud Run:

```bash
gcloud run deploy solidity-compiler-api \
  --image gcr.io/TU_ID_DE_PROYECTO/solidity-compiler-api \
  --platform managed \
  --region us-central1 \
  --set-env-vars="OPENROUTER_API_KEY=tu_clave_de_api"
```

⚠️ **IMPORTANTE**: No incluyas el archivo .env en la imagen Docker para producción. En su lugar, configura las variables de entorno directamente en Cloud Run como se muestra arriba. Esto es más seguro y sigue las mejores prácticas para el manejo de secretos.

Para desarrollo local, el Dockerfile incluye el archivo .env para facilitar las pruebas, pero para producción debes usar el enfoque de variables de entorno de Cloud Run.

### 5. Verificar el despliegue

Una vez completado el despliegue, Cloud Run proporcionará una URL para acceder al servicio. Puedes verificar que el servicio esté funcionando correctamente accediendo a la ruta de healthcheck:

```
https://TU_SERVICIO_URL/healthz
```

## Optimizaciones realizadas para Cloud Run

1. **Uso de la variable PORT**: El servicio ahora utiliza la variable de entorno `PORT` proporcionada por Cloud Run.
2. **Manejo de señales de terminación**: Se agregó manejo de señales SIGTERM y SIGINT para un apagado gracioso.
3. **Seguridad mejorada**: El contenedor se ejecuta como un usuario no-root.
4. **Optimización de tamaño**: Se eliminaron archivos y dependencias innecesarias.
5. **Metadatos de contenedor**: Se agregaron etiquetas OCI para mejor documentación.

## Monitoreo y Logs

Para ver los logs del servicio:

```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=solidity-compiler-api" --limit=50
```

## Solución de problemas

Si encuentras problemas con el despliegue:

1. Verifica los logs del servicio como se muestra arriba
2. Asegúrate de que todas las variables de entorno necesarias estén configuradas
3. Verifica que el servicio tenga suficientes recursos asignados (memoria/CPU)
4. Comprueba que las APIs necesarias estén habilitadas en tu proyecto de Google Cloud