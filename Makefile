docker-deployment:
	cp ${ENV_FILE_PATH} .env.production
	docker compose build
	docker compose down || true
	@echo "Updating container version"
	docker compose up -d

# Gera as capturas do guia do usuário contra a stack de integração do gatekeeper.
# Usage: make manual [GATEKEEPER_DIR=../gatekeeper] [MANUAL_PORT=3100] [MANUAL_SCENES=01,06]
.PHONY: manual
manual:
	GATEKEEPER_DIR="$(GATEKEEPER_DIR)" manual-capture/run.sh
