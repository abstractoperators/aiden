run:
	uv run uvicorn server:app --reload --host 0.0.0.0 --port 8000

build-docker:
	docker build -f Dockerfile.api -t aiden-api .

run-docker: build-docker
	docker run -p 8000:80 aiden-api