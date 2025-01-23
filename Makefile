
build-eve:
	docker compose -f docker-compose.yml build eve-agent

run-eve: build-eve
	docker compose -f docker-compose.yml stop eve-agent
	docker compose -f docker-compose.yml up -d eve-agent