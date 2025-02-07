
down-eve:
	docker compose -f docker-compose.yml down eve-agent

build-eve:
	docker compose -f docker-compose.yml build eve-agent

run-eve: down-eve build-eve
	docker compose -f docker-compose.yml up -d eve-agent

aws-ecr-login:
	aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 008971649127.dkr.ecr.us-east-1.amazonaws.com

aws-ecr-push-eve: aws-ecr-login 
	docker tag eve-agent:latest 008971649127.dkr.ecr.us-east-1.amazonaws.com/aiden/eve:latest
	docker push 008971649127.dkr.ecr.us-east-1.amazonaws.com/aiden/eve:latest

run-eve-nodocker:
	cp .env.eve eliza/.env && \
	cd eliza && \
	pnpm i && \
	pnpm run build && \
	pnpm run cleanstart:debug --characters="$(shell pwd)/eve.character.json"

down-api:
	docker compose -f docker-compose.yml down api

build-api:
	docker compose -f docker-compose.yml build api

run-api: down-api build-api
	docker compose -f docker-compose.yml up -d api	

run-api-nodocker:
	cd apps/api && \
	uv run uvicorn src.server:app --reload --host 0.0.0.0 --port 8001

aws-ecr-push-api: aws-ecr-login
	docker tag api:latest 008971649127.dkr.ecr.us-east-1.amazonaws.com/aiden/api:latest
	docker push 008971649127.dkr.ecr.us-east-1.amazonaws.com/aiden/api:latest