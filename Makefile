docker-deployment:
	cp ${ENV_FILE_PATH} .env.production
	docker-compose build
	docker-compose down || true
	@echo "Updating container version"
	docker-compose up -d
