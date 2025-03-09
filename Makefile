aws-ecr-login:
	aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 008971649127.dkr.ecr.us-east-1.amazonaws.com

########### FRONTEND #########
down-frontend:
	docker compose -f docker-compose.yml down frontend
build-frontend:
	docker compose -f docker-compose.yml build frontend
run-frontend: down-frontend build-frontend
	docker compose -f docker-compose.yml up -d frontend
run-frontend-nodocker:
	cd apps/frontend && \
	pnpm i && \
	pnpm dev
# Staging image
aws-ecr-push-frontend: aws-ecr-login
	docker tag frontend:latest 008971649127.dkr.ecr.us-east-1.amazonaws.com/aiden/frontend:latest
	docker push 008971649127.dkr.ecr.us-east-1.amazonaws.com/aiden/frontend:latest
# Prod image
aws-ecr-push-frontend-prod: aws-ecr-login
	docker tag frontend:latest 008971649127.dkr.ecr.us-east-1.amazonaws.com/aiden/frontend:prod
	docker push 008971649127.dkr.ecr.us-east-1.amazonaws.com/aiden/frontend:prod


############ API #############
down-api:
	docker compose -f docker-compose.yml down api
build-api:
	docker compose -f docker-compose.yml build api
run-api: down-api build-api
	docker compose -f docker-compose.yml up -d api	
run-api-nodocker:
	cd apps/api && \
	uv run uvicorn src.server:app --reload --host 0.0.0.0 --port 8003
aws-ecr-push-api: aws-ecr-login
	docker tag api:latest 008971649127.dkr.ecr.us-east-1.amazonaws.com/aiden/api:latest
	docker push 008971649127.dkr.ecr.us-east-1.amazonaws.com/aiden/api:latest

build-token-contract:
	cd apps/api/src/bonding_token && \
	npm install && \
	npx hardhat compile
test-token-contract:
	cd apps/api/src/bonding_token && \
	npm install && \
	npx hardhat test

######### RUNTIME #########
down-runtime:
	docker compose -f docker-compose.yml down agent-runtime
build-runtime:
	docker compose -f docker-compose.yml build agent-runtime
run-runtime: down-runtime build-runtime
	docker compose -f docker-compose.yml up -d agent-runtime
run-runtime-nodocker:
	cd apps/runtime && \
	uv run uvicorn src.server:app --reload --host localhost --port 8002

aws-ecr-push-runtime: aws-ecr-login
	docker tag agent-runtime:latest 008971649127.dkr.ecr.us-east-1.amazonaws.com/aiden/agent-runtime:latest
	docker push 008971649127.dkr.ecr.us-east-1.amazonaws.com/aiden/agent-runtime:latest

##### Prometheus ##### 
down-prometheus:
	docker compose -f docker-compose.yml down prometheus
build-prometheus:
	docker compose -f docker-compose.yml build prometheus
run-prometheus: down-prometheus build-prometheus
	docker compose -f docker-compose.yml up -d prometheus
aws-ecr-push-prometheus: aws-ecr-login
	docker tag prometheus:latest 008971649127.dkr.ecr.us-east-1.amazonaws.com/aiden/prometheus:latest
	docker push 008971649127.dkr.ecr.us-east-1.amazonaws.com/aiden/prometheus:latest

mypy:
	cd apps/api && uv run mypy src || true
	cd apps/runtime && uv run mypy src || true

pytest:
	(cd apps/api && uv run pytest src --capture=no --log-cli-level=INFO)