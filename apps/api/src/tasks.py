import os
from datetime import datetime
from time import sleep
from typing import Sequence
from uuid import UUID

import requests
from boto3 import Session as Boto3Session
from celery import Celery
from celery.utils.log import get_task_logger
from mypy_boto3_ecs.client import ECSClient
from mypy_boto3_elbv2.client import ElasticLoadBalancingv2Client as ELBv2Client
from requests.exceptions import HTTPError

from src.aws_utils import (
    create_http_target_group,
    create_listener_rules,
    create_runtime_service,
    get_aws_config,
    get_latest_task_definition_revision,
    get_role_session,
)
from src.db import crud
from src.db.models import Agent, AgentUpdate, Runtime, RuntimeUpdate
from src.db.setup import SQLALCHEMY_DATABASE_URL, Session
from src.models import AWSConfig
from src.utils import obj_or_404

logger = get_task_logger(__name__)
db_password = os.getenv("POSTGRES_DB_PASSWORD")
if not db_password:
    raise ValueError("POSTGRES_DB_PASSWORD is not set")
BACKEND_DB_URL = str(SQLALCHEMY_DATABASE_URL).replace("***", db_password)
BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost")
app = Celery(
    "tasks",
    broker=BROKER_URL,
    backend=f"db+{BACKEND_DB_URL}?sslmode=disable",
)
app.config_from_object("src.celeryconfig")


@app.on_after_configure.connect
def setup_periodic_tasks(sender: Celery, **kwargs):
    sender.add_periodic_task(
        300,
        healthcheck_runtimes.s(),
        name="Healthcheck all runtimes every 5 minutes",
    )


# TODO
# Update polling tasks to be non-blocking on worker concurrency slots.
# Maybe recursively call a polling task? not sure.


@app.task
def ping():
    logger.info("ping")


@app.task
def healthcheck_runtimes() -> None | str:
    """
    Polls all runtimes to see if they are healthy.
    If they are not healthy, then they are updated and restarted
    """
    with Session() as session:
        runtimes: Sequence[Runtime] = crud.get_runtimes(session)
        runtime_ids = [runtime.id for runtime in runtimes]

    for runtime_id in runtime_ids:
        healthcheck_runtime.delay(runtime_id)
    return None


@app.task
def healthcheck_runtime(runtime_id: UUID) -> str:
    """
    Healthchecks a single runtime to see if it is healthy.
    If it is not healthy, then it is updated and restarted.
    If it can't be updated and restarted, then it is deleted? Not sure about htis part.
    """
    MAX_FAILED_HEALTHCHECKS = 3

    with Session() as session:
        runtime: Runtime = obj_or_404(crud.get_runtime(session, runtime_id), Runtime)
        agent: Agent | None = runtime.agent

    try:
        resp = requests.get(f"{runtime.url}/ping")
        resp.raise_for_status()
        resp = requests.get(f"{runtime.url}/controller/ping")
        resp.raise_for_status()
        with Session() as session:
            crud.update_runtime(
                session,
                runtime,
                RuntimeUpdate(
                    last_healthcheck=datetime.now(),
                    failed_healthchecks=0,
                ),
            )

    except HTTPError as e:
        logger.info(
            f"{repr(e)}: Runtime {runtime_id} is unhealthy. Attempting to update and restart it."
        )

        with Session() as session:
            runtime = obj_or_404(crud.get_runtime(session, runtime_id), Runtime)
            crud.update_runtime(
                session,
                runtime,
                RuntimeUpdate(failed_healthchecks=runtime.failed_healthchecks + 1),
            )

        if runtime.failed_healthchecks > MAX_FAILED_HEALTHCHECKS:
            delete_runtime.delay(runtime_id)
            return "Runtime failed healthcheck too many times. Deleting it."
        else:
            update_runtime.delay(runtime_id)
            return "Runtime is unhealthy. Attempting to update and restart it."

    # 3. Check if the character running on the runtime is healthy
    if agent:
        healthcheck_runtime_running_agent.delay(agent.id)

    return "Runtime is healthy."


@app.task
def healthcheck_runtime_running_agent(agent_id: UUID) -> None | str:
    """
    Healthchecks an agent that should be running on a runtime.
    """
    with Session() as session:
        agent: Agent = obj_or_404(crud.get_agent(session, agent_id), Agent)
        runtime: Runtime | None = agent.runtime
        if runtime is None:
            return "Agent should not be running on any runtime."

    resp = requests.get(f"{runtime.url}/controller/character/status", timeout=3)
    resp.raise_for_status()
    # An HTTP error here means either the runtime is down, or the fastapi controller is down
    # This is unexpected, and should be handled by healthcheck_runtime. So, just raise an exception here.

    character_status = resp.json()
    # Make sure that the character matches the expected running agent.
    running: bool = character_status.get("running")
    running_character_agent_id: str = character_status.get("agent_id")
    # TODO: Improve agent health check coverage - this isn't comprehensive
    # Agent might be running, but not chattable.
    # This only covers client-direct, but not other clients (e.g. what if twitter client is down?)
    if (
        not running
        or not running_character_agent_id
        or running_character_agent_id != agent.eliza_agent_id
    ):
        logger.info(
            f"Expected agent {agent.eliza_agent_id} to be running on runtime {runtime.id}. But either no agent was running, or the wrong agent was running."  # noqa
        )
        #
        start_agent.delay(agent_id=agent.id, runtime_id=runtime.id)
    return None


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
    for i in range(1, 61):
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
    aws_config_dict: AWSConfig,
    runtime_no: int,
    runtime_id: UUID,
) -> None:
    """
    Creates a service w/ a basic rollback strategy
    Creates a target group + listener rule + service, deleting them if health check at the end fails.
    """
    try:
        with Session() as session:
            aws_config: AWSConfig = AWSConfig.model_validate(aws_config_dict)
            sts_client: Boto3Session = get_role_session()
            ecs_client: ECSClient = sts_client.client("ecs")
            elbv2_client: ELBv2Client = sts_client.client("elbv2")
            runtime = crud.get_runtime(session, runtime_id)
            if runtime is None:
                raise ValueError(f"Runtime {runtime_id} does not exist")
            host = f"{aws_config.subdomain}.{aws_config.host}"
            url = f"https://{host}"

            logger.info(f'Creating target group "{aws_config.target_group_name}"')
            target_group_arn = create_http_target_group(
                elbv2_client=elbv2_client,
                target_group_name=aws_config.target_group_name,
                vpc_id=aws_config.vpc_id,
            )
            runtime = crud.update_runtime(
                session, runtime, RuntimeUpdate(target_group_arn=target_group_arn)
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
            runtime = crud.update_runtime(
                session,
                runtime,
                RuntimeUpdate(
                    http_listener_rule_arn=http_rule_arn,
                    https_listener_rule_arn=https_rule_arn,
                ),
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
            runtime = crud.update_runtime(
                session, runtime, RuntimeUpdate(service_arn=service_arn)
            )

        # Poll runtime to see if it stands up. If it doesn't, throw an error and rollback.
        logger.info(f"Polling runtime {runtime.id} at {runtime.url} for health check")
        for i in range(1, 41):
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
                with Session() as session:
                    crud.update_runtime(session, runtime, RuntimeUpdate(started=True))
                return
            except Exception as e:
                logger.info(f"Attempt {i}/{40}. Runtime not online yet. {e}")
                continue

        raise Exception("Runtime did not come online in time. Rolling back.")
    except (Exception, KeyboardInterrupt) as e:
        logger.error(f"{e}: Rolling back runtime")
        delete_runtime(runtime_id=runtime_id)
        raise e


@app.task()
def update_runtime(
    runtime_id: UUID,
) -> str:
    """
    Updates a runtime to the latest revision of its task definition + latest container in ECR
    Deletes the runtime entirely
    """
    logger.warning("test warning message: update_runtime")
    try:
        # TODO: If the update fails then delete everything including aws and db entry.
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

            aws_config: AWSConfig = get_aws_config(runtime.service_no)
            # Force a redeployment of the runtime.
            task_definition_arn = aws_config.task_definition_arn
            ecs_client = get_role_session().client("ecs")
            latest_revision = get_latest_task_definition_revision(
                ecs_client, aws_config.task_definition_arn
            )
            service = ecs_client.update_service(
                cluster=aws_config.cluster,
                service=aws_config.service_name,
                taskDefinition=f"{task_definition_arn}:{latest_revision}",
                forceNewDeployment=True,
            )["service"]

        # Poll the service until the deployment is stable (that is, old tasks are stopped, and new ones are running)
        runtime_url = runtime.url
        for i in range(1, 41):
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
        for i in range(1, 41):
            try:
                resp = requests.get(f"{runtime_url}/ping", timeout=3)
                resp.raise_for_status()
                logger.info(f"Runtime {runtime_id} is online")
                with Session() as session:
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
    except Exception as e:
        logger.info(f"{e}: Deleting runtime - update failed")
        delete_runtime.delay(runtime_id=runtime_id)
        return "Update failed. Deleted runtime."
    return "Update successful."


@app.task()
def delete_runtime(
    runtime_id: UUID,
) -> None:
    logger.error(f"test error message: delete runtime {runtime_id}")
    ecs_client = get_role_session().client("ecs")
    elbv2_client = get_role_session().client("elbv2")
    with Session() as session:
        runtime: Runtime | None = crud.get_runtime(session, runtime_id)
        if runtime is None:
            raise ValueError(f"Runtime {runtime_id} does not exist")
        aws_config = get_aws_config(runtime.service_no)

    if runtime.service_arn:
        ecs_client.delete_service(
            cluster=aws_config.cluster,
            service=aws_config.service_name,
            force=True,
        )
        waiter = ecs_client.get_waiter("services_inactive")
        waiter.wait(
            cluster=aws_config.cluster,
            services=[aws_config.service_name],
        )

    # Delete the listener rules
    if runtime.http_listener_rule_arn:
        elbv2_client.delete_rule(RuleArn=runtime.http_listener_rule_arn)
    if runtime.https_listener_rule_arn:
        elbv2_client.delete_rule(RuleArn=runtime.https_listener_rule_arn)

    # Delete the target group
    if runtime.target_group_arn:
        elbv2_client.delete_target_group(
            TargetGroupArn=runtime.target_group_arn,
        )

    # Delete the runtime in db
    with Session() as session:
        crud.delete_runtime(session, runtime)

    return None
