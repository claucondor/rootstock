GIT_SHA := $(shell git rev-parse --short=7 HEAD)
PROJECT_ID=spanish-catalyst
REGION=us-central1

# Convierte el .env a la sintaxis KEY1=VAL1,KEY2=VAL2,... (ignora comentarios y líneas vacías)
env_vars = $(shell cat src/cmd/$(APP_NAME)/.env | grep -v '^#' | grep -v '^$$' | xargs | sed 's/ /,/g')

setup:
	@echo "[setup] Running setup commands..."
	@npm install

clean:
	@echo "[clean] Cleaning project..."
	@rm -rf dist
	@rm -rf build

build: clean
	@echo "[build] Building project..."
	@npm run build

check: build
	@echo "[check] Checking project..."
	@npm run lint || true

validate-app-name:
	@if [ -z "$(APP_NAME)" ]; then \
		echo "Error: The APP_NAME variable is not set."; \
		exit 1; \
	fi
	@if [ ! -d "src/cmd/$(APP_NAME)" ]; then \
		echo "Error: Application '$(APP_NAME)' does not exist in 'src/cmd/'"; \
		exit 1; \
	fi

dev: validate-app-name build
	@echo "[run-dev $(APP_NAME)] running service in dev mode..."
	@export $$(cat src/cmd/$(APP_NAME)/.env 2>/dev/null | xargs) && npx ts-node src/cmd/$(APP_NAME)/index.ts

docker: validate-app-name build
	@echo "[docker $(APP_NAME)] building and running docker in dev mode..."
	@docker build -t $(APP_NAME):$(GIT_SHA) -f src/cmd/$(APP_NAME)/Dockerfile .
	@docker run --env-file src/cmd/$(APP_NAME)/.env -p 8080:8080 $(APP_NAME):$(GIT_SHA)

deploy: validate-app-name build
	@echo "[deploy $(APP_NAME)] deploying to Cloud Run..."
	@docker buildx build --platform linux/amd64,linux/arm64 --build-arg APP_NAME=$(APP_NAME) -t gcr.io/$(PROJECT_ID)/$(APP_NAME):$(GIT_SHA) -f src/cmd/$(APP_NAME)/Dockerfile . --push
	@gcloud run deploy $(APP_NAME) \
		--image gcr.io/$(PROJECT_ID)/$(APP_NAME):$(GIT_SHA) \
		--region $(REGION) \
		--allow-unauthenticated \
		--memory 2Gi \
		--cpu 1 \
		--timeout 3600 \
		--set-env-vars "$(env_vars)"

.PHONY: setup build clean check validate-app-name dev docker deploy 