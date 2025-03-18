import os
from time import sleep
from uuid import UUID

import requests
from boto3 import Session as Boto3Session
from celery import Celery
from celery.utils.log import get_task_logger
from mypy_boto3_ecs.client import ECSClient
from mypy_boto3_elbv2.client import ElasticLoadBalancingv2Client as ELBv2Client

from src.aws_utils import (
    create_http_target_group,
    create_listener_rules,
    create_runtime_service,
    get_role_session,
)
from src.db import crud
from src.db.models import AgentUpdate, RuntimeUpdate
from src.db.setup import SQLALCHEMY_DATABASE_URL, Session
from src.models import AWSConfig

logger = get_task_logger(__name__)
db_password = os.getenv("POSTGRES_DB_PASSWORD")
if not db_password:
    raise ValueError("POSTGRES_DB_PASSWORD is not set")
BACKEND_DB_URL = str(SQLALCHEMY_DATABASE_URL).replace("***", db_password)
BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost")
app = Celery(
    "tasks",
    broker=BROKER_URL,
    backend=f"db+{BACKEND_DB_URL}",
)
app.config_from_object("src.celeryconfig")


# TODO: Only include tasks in celery worker, and not in fastapi server.


@app.task
def start_agent(agent_id: UUID, runtime_id: UUID) -> None:
    with Session() as session:
        # 1. Stop the old agent (if it exists)
        runtime = crud.get_runtime(session, runtime_id)
        if runtime is None:
            raise ValueError(f"Runtime {runtime_id} does not exist")
        agent = crud.get_agent(session, agent_id)
        if agent is None:
            raise ValueError(f"Agent {agent_id} does not exist")

        if (old_agent := runtime.agent) is not None:
            stop_endpoint = f"{runtime.url}/controller/character/stop"
            resp = requests.post(stop_endpoint)
            resp.raise_for_status()
            if old_agent:
                crud.update_agent(
                    session,
                    old_agent,
                    AgentUpdate(runtime_id=None),
                )

        # 2. Start the new agent
        start_endpoint = f"{runtime.url}/controller/character/start"
        character_json: dict = agent.character_json
        env_file: str = agent.env_file
        resp = requests.post(
            start_endpoint,
            json={
                "character_json": character_json,
                "envs": env_file,
            },
        )
        resp.raise_for_status()

    # Poll the runtime until the agent is running
    for i in range(60):
        resp = requests.get(f"{runtime.url}/controller/character/status")
        logger.info(f"{i}/{60}: Polling for agent to start")
        if resp.status_code == 200 and resp.json()["running"]:
            eliza_agent_id = resp.json()["agent_id"]
            with Session() as session:
                crud.update_agent(
                    session,
                    agent,
                    AgentUpdate(runtime_id=runtime_id, eliza_agent_id=eliza_agent_id),
                )
            return
        sleep(10)

    # agent failed to start - mark the task as failed
    # TODO: Improve failed to start.
    raise Exception("Agent failed to start")


@app.task
def create_runtime(
    aws_config_dict: AWSConfig, runtime_no: int, runtime_id: UUID
) -> None:
    """
    Creates a service w/ a basic rollback strategy
    Creates a target group + listener rule + service, deleting them if health check at the end fails.
    """
    try:
        aws_config: AWSConfig = AWSConfig.model_validate(aws_config_dict)
        sts_client: Boto3Session = get_role_session()
        ecs_client: ECSClient = sts_client.client("ecs")
        elbv2_client: ELBv2Client = sts_client.client("elbv2")

        host = f"{aws_config.subdomain}.{aws_config.host}"
        url = f"https://{host}"

        target_group_arn = http_rule_arn = https_rule_arn = service_arn = None
        logger.info(f'Creating target group "{aws_config.target_group_name}"')
        target_group_arn = create_http_target_group(
            elbv2_client=elbv2_client,
            target_group_name=aws_config.target_group_name,
            vpc_id=aws_config.vpc_id,
        )

        logger.info(f"Creating listener rules for {host}")
        http_rule_arn, https_rule_arn = create_listener_rules(
            elbv2_client=elbv2_client,
            http_listener_arn=aws_config.http_listener_arn,
            https_listener_arn=aws_config.https_listener_arn,
            host_header_pattern=host,
            target_group_arn=target_group_arn,
            priority=100 + 10 * runtime_no,
        )

        logger.info(f"Creating service {aws_config.service_name}")
        service_arn = create_runtime_service(
            ecs_client=ecs_client,
            cluster=aws_config.cluster,
            service_name=aws_config.service_name,
            task_definition_arn=aws_config.task_definition_arn,
            security_groups=aws_config.security_groups,
            subnets=aws_config.subnets,
            target_group_arn=target_group_arn,
        )

        # Poll runtime to see if it stands up. If it doesn't, throw an error and rollback.
        with Session() as session:
            runtime = crud.get_runtime(session, runtime_id)
            if runtime is None:
                raise ValueError(f"Runtime {runtime_id} does not exist")
            logger.info(
                f"Polling runtime {runtime.id} at {runtime.url} for health check"
            )
            for i in range(40):
                logger.info(f"{i}/40: Polling runtime for health check")
                sleep(15)
                try:
                    url = f"{runtime.url}/ping"
                    resp = requests.get(
                        url=url,
                        timeout=3,
                    )
                    resp.raise_for_status()

                    logger.info(f"Runtime {runtime.id} has started")
                    crud.update_runtime(session, runtime, RuntimeUpdate(started=True))
                    return
                except Exception as e:
                    logger.info(f"Attempt {i}/{40}. Runtime not online yet. {e}")
                    continue

            raise Exception("Runtime did not come online in time. Rolling back.")
    except (Exception, KeyboardInterrupt) as e:
        logger.error(e)
        if http_rule_arn:
            logger.info(f"Deleting HTTP rule {http_rule_arn}")
            elbv2_client.delete_rule(RuleArn=http_rule_arn)
        if https_rule_arn:
            logger.info(f"Deleting HTTPS rule {https_rule_arn}")
            elbv2_client.delete_rule(RuleArn=https_rule_arn)
        if target_group_arn:
            logger.info(f"Deleting target group {target_group_arn}")
            elbv2_client.delete_target_group(TargetGroupArn=target_group_arn)
        if service_arn:
            logger.info(f"Deleting service {service_arn}")
            ecs_client.delete_service(
                cluster=aws_config.cluster,
                service=aws_config.service_name,
                force=True,
            )
        logger.info(f"Deleting runtime {runtime_id}")
        with Session() as session:
            runtime = crud.get_runtime(session, runtime_id)
            if runtime is not None:
                crud.delete_runtime(session, runtime)

    return None


@app.task()
def update_runtime(
    runtime_id: UUID,
    aws_config_dict: dict,
    service_arn: str,
    task_definition_arn: str,
    latest_revision: int,
) -> None:
    aws_config: AWSConfig = AWSConfig.model_validate(aws_config_dict)
    with Session() as session:
        # Update agent running on the runtime to not have a runtime anymore.
        runtime = crud.get_runtime(session, runtime_id)
        if runtime is None:
            raise ValueError(f"Runtime {runtime_id} does not exist")
        agent = runtime.agent
        if agent is not None:
            agent_id = agent.id
            crud.update_agent(session, agent, AgentUpdate(runtime_id=None))
        crud.update_runtime(session, runtime, RuntimeUpdate(started=False))

        # Force a redeployment of the runtime.
        ecs_client = get_role_session().client("ecs")
        service = ecs_client.update_service(
            cluster=aws_config.cluster,
            service=aws_config.service_name,
            taskDefinition=f"{task_definition_arn}:{latest_revision}",
            forceNewDeployment=True,
        )["service"]

        # Poll the service until the deployment is stable (that is, old tasks are stopped, and new ones are running)
        runtime_url = runtime.url
        for i in range(40):
            logger.info(
                f"{i}/40: Polling service {aws_config.service_name} for stability"
            )
            service = ecs_client.describe_services(
                cluster=aws_config.cluster,
                services=[aws_config.service_name],
            )["services"][0]
            active_deployment_id = None
            for deployment in service["deployments"]:
                if deployment["status"] == "ACTIVE":
                    active_deployment_id = deployment["id"]
                    break
            if active_deployment_id is None:
                logger.info(f"{aws_config.service_name} is stable")
                break
            sleep(15)

        # Poll runtime until it's online.
        for i in range(40):
            try:
                resp = requests.get(f"{runtime_url}/ping", timeout=3)
                resp.raise_for_status()
                logger.info(f"Runtime {runtime_id} is online")
                crud.update_runtime(session, runtime, RuntimeUpdate(started=True))
                break
            except Exception as e:
                logger.info(f"{i}/{40}: Runtime {runtime_id} is not online yet. {e}")
                sleep(15)

    # Restart the agent (if any)
    logger.info("Restarting agent (if any)")
    if agent is not None:
        logger.info(f"Restarting agent {agent_id}")
        start_agent.delay(agent_id=agent_id, runtime_id=runtime_id)
