
build-eve:
	docker compose -f docker-compose.yml build eve-agent

run-eve: build-eve
	docker compose -f docker-compose.yml stop eve-agent
	docker compose -f docker-compose.yml up -d eve-agent

aws-ecr-login:
	aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 008971649127.dkr.ecr.us-east-1.amazonaws.com

aws-ecr-push: aws-ecr-login 
	docker tag $(APP):latest 008971649127.dkr.ecr.us-east-1.amazonaws.com/$(APP_ECR):latest
	docker push 008971649127.dkr.ecr.us-east-1.amazonaws.com/$(APP_ECR):latest