

build-eve:
	docker compose -f docker-compose.yml build

run-eve: build-eve
	docker compose -f docker-compose.yml up

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
