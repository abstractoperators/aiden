import asyncio
import json
import os
import re
from base64 import b64decode
from collections.abc import Sequence
from contextlib import asynccontextmanager
from uuid import UUID

import requests
from boto3 import Session as Boto3Session
from fastapi import BackgroundTasks, FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from mypy_boto3_ecs.client import ECSClient
from mypy_boto3_elbv2.client import ElasticLoadBalancingv2Client as ELBv2Client
from prometheus_fastapi_instrumentator import Instrumentator, metrics
from pydantic import TypeAdapter

from src import logger
from src.aws_utils import (
    create_http_target_group,
    create_listener_rules,
    create_runtime_service,
    get_aws_config,
    get_role_session,
)
from src.db import Session, crud, init_db
from src.db.models import (
    Agent,
    AgentBase,
    AgentUpdate,
    Runtime,
    RuntimeBase,
    RuntimeUpdate,
    Token,
    TokenBase,
    User,
    UserBase,
    UserUpdate,
)
from src.models import AgentPublic, AWSConfig, TokenCreationRequest
from src.setup import test_db_connection
from src.token_deployment import buy_token_unsigned, deploy_token, sell_token_unsigned


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa
    init_db()
    if test_db_connection():
        logger.info("DB Connection Successful")
    else:
        logger.error("DB Connection Failed")
        raise Exception("DB Connection Failed")
    yield


app = FastAPI(lifespan=lifespan)


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    if request.url.path == "/metrics":
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return JSONResponse(
                status_code=401, content={"detail": "No authorization header"}
            )

        scheme_name, credentials_b64_encoded = auth_header.split(" ")
        if scheme_name != "Basic":
            return JSONResponse(
                status_code=401,
                content={
                    "detail": f"Invalid authorization scheme {scheme_name}. Should be Basic."
                },
            )

        credentials = b64decode(credentials_b64_encoded).decode("utf-8")
        username, password = credentials.split(":")
        if not username == "prometheus":
            return JSONResponse(
                status_code=401,
                content={"detail": f"User {username} is not authorized"},
            )
        if not password == os.getenv("PROMETHEUS_BASIC_AUTH"):
            return JSONResponse(
                status_code=401,
                content={"detail": f"Incorrect password for user {username}"},
            )

        return await call_next(request)
    else:
        pass
    return await call_next(request)


instrumentator = Instrumentator(
    excluded_handlers=["/metrics"],
)

# Handler and method included by default
instrumentator.add(metrics.latency())
instrumentator.add(metrics.request_size())
instrumentator.add(metrics.response_size())

instrumentator.instrument(app).expose(app)


@app.get("/ping")
async def ping():
    """
    pong
    """
    return "pong"


@app.post("/agents")
def create_agent(agent: AgentBase) -> Agent:
    """
    Creates an agent. Does not start the agent.
    Only stores it in db.
    """
    with Session() as session:
        agent = crud.create_agent(session, agent)

    return agent


@app.get("/agents")
async def get_agents() -> Sequence[Agent]:
    """
    Returns a list of Agents.
    """
    with Session() as session:
        agents = crud.get_agents(session)
    return agents


@app.get("/agents/{agent_id}")
async def get_agent(agent_id: UUID) -> AgentPublic:
    """
    Returns an agent by id.
    Raises a 404 if the agent is not found.
    """
    with Session() as session:
        agent: Agent | None = crud.get_agent(session, agent_id)

        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")

        # Prefetch the runtime
        agent.runtime  # noqa
        agent.token  # noqa

        return TypeAdapter(AgentPublic).validate_python(agent)


@app.patch("/agents/{agent_id}")
async def update_agent(agent_id: UUID, agent_update: AgentUpdate) -> Agent:
    """
    Updates an agent by id.
    Raises a 404 if the agent is not found.
    """
    with Session() as session:
        agent: Agent | None = crud.get_agent(session, agent_id)

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    with Session() as session:
        agent = crud.update_agent(session, agent, agent_update)
    return agent


@app.post("/tokens")
async def deploy_token_api(token_request: TokenCreationRequest) -> Token:
    """
    Deploys a token smart contract to the block chain.
    Returns the token object.
    """
    # Validate inputs
    name = token_request.name
    ticker = token_request.ticker

    # Deploy the token
    contract_address, contract_abi = await deploy_token(name, ticker)

    with Session() as session:
        token = crud.create_token(
            session,
            TokenBase(
                name=name,
                ticker=ticker,
                evm_contract_address=contract_address,
                abi=json.dumps(contract_abi),
            ),
        )

    return token


@app.get("/tokens")
async def get_tokens() -> Sequence[Token]:
    """
    Returns a list of tokens.
    """
    with Session() as session:
        tokens = crud.get_tokens(session)
    return tokens


@app.get("/tokens/{token_id}")
async def get_token(token_id: UUID) -> Token:
    """
    Returns a token by id.
    Raises a 404 if the token is not found.
    """
    with Session() as session:
        token: Token | None = crud.get_token(session, token_id)

    if not token:
        raise HTTPException(status_code=404, detail="Token not found")

    return token


@app.get("/tokens/{token_id}/sell_txn")
def get_sell_txn(token_id: UUID, user_address: str, amount_tokens: int) -> dict:
    """
    Returns an unsigned transaction to sell tokens for SEI.

    contract_address: Address of the token contract
    user_address: Address of the user selling the tokens
    amount: Amount of tokens to sell
    """
    with Session() as session:
        token = crud.get_token(session, token_id)

        if not token:
            raise ValueError(f"Token {token_id} not found")

        contract_address = token.evm_contract_address
        contract_abi = token.abi

    return sell_token_unsigned(
        amount_tokens,
        contract_abi,
        contract_address,
        user_address,
    )


@app.get("/tokens/{token_id}/buy_txn")
def get_buy_txn(token_id: UUID, user_address: str, amount_sei: int) -> dict:
    """
    Returns an unsigned transaction buy tokens with Sei
    TODO: Change amount_sei -> amount_tokens
    """
    with Session() as session:
        token = crud.get_token(session, token_id)

        if not token:
            raise ValueError(f"Token {token_id} not found")

        contract_address = token.evm_contract_address

    return buy_token_unsigned(
        amount_sei,
        contract_address,
        user_address,
    )


@app.post("/runtimes")
def create_runtime(background_tasks: BackgroundTasks) -> Runtime:
    """
    Attempts to create a new runtime.
    Returns a Runtime object immediately, with flag started=False.
    The runtime will be polled for 10 min to verify that it is online.
    If it is not, then the runtime will be deleted.
    """
    # Perhaps, the least performant code ever written
    # This is why *real* companies use leetcode
    with Session() as session:
        runtimes = crud.get_runtimes(
            session, limit=1000000
        )  # lul better hope you don't run out of memory
        runtime_nums = []
        for runtime in runtimes:
            match = re.search(r"aiden-runtime-(\d+)", runtime.url)
            if match:
                runtime_nums.append(int(match.group(1)))

    next_runtime_number = max(runtime_nums) + 1 if runtime_nums else 1

    aws_config: AWSConfig | None = get_aws_config(next_runtime_number)
    if not aws_config:
        raise HTTPException(
            status_code=500,
            detail="Failed to get AWS config. Check ENV environment variable (probably it's dev)",
        )

    host = f"{aws_config.subdomain}.{aws_config.host}"
    url = f"https://{host}"
    with Session() as session:
        runtime = crud.create_runtime(
            session,
            RuntimeBase(
                url=url,
                started=False,
            ),
        )

    async def create_service_atomic() -> None:
        """
        Creates a service w/ a basic rollback strategy
        Creates a target group + listener rule + service, deleting them if health check at the end fails.
        """
        sts_client: Boto3Session = get_role_session()
        ecs_client: ECSClient = sts_client.client("ecs")
        elbv2_client: ELBv2Client = sts_client.client("elbv2")

        try:
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
                priority=100 + 10 * next_runtime_number,
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
            logger.info(
                f"Polling runtime {runtime.id} at {runtime.url} for health check"
            )
            for i in range(40):
                await asyncio.sleep(15)
                try:
                    url = f"{runtime.url}/ping"
                    resp = requests.get(
                        url=url,
                        timeout=3,
                    )
                    resp.raise_for_status()

                    logger.info(f"Runtime {runtime.id} has started")
                    with Session() as session:
                        crud.update_runtime(
                            session, runtime, RuntimeUpdate(started=True)
                        )
                        return
                except Exception as e:
                    logger.info(f"Attempt {i}/{40}. Runtime not online yet. {e}")
                    continue

            raise Exception("Runtime did not come online in time. Rolling back.")
        except Exception as e:
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
            logger.info(f"Deleting runtime {runtime.id}")
            with Session() as session:
                crud.delete_runtime(session, runtime)

        return None

    background_tasks.add_task(create_service_atomic)

    return runtime


@app.get("/runtimes")
def get_runtimes() -> Sequence[Runtime]:
    """
    Returns a list of up to 100 runtimes.
    """
    with Session() as session:
        runtimes = crud.get_runtimes(session)
    return runtimes


@app.get("/runtimes/{runtime_id}")
def get_runtime(runtime_id: UUID) -> Runtime:
    """
    Returns a runtime by id.
    Raises a 404 if the runtime is not found.
    """
    with Session() as session:
        runtime: Runtime | None = crud.get_runtime(session, runtime_id)

    if not runtime:
        raise HTTPException(status_code=404, detail="Runtime not found")

    return runtime


@app.post("/agents/{agent_id}/start/{runtime_id}")
def start_agent(
    agent_id: UUID,
    runtime_id: UUID,
    background_tasks: BackgroundTasks,
) -> tuple[Agent, Runtime]:
    """
    Starts an agent on a runtime.
    Returns a tuple of the agent and runtime.
    Potentially stops the old agent on the runtime.
    Returns a 404 if the agent or runtime is not found.
    """
    with Session() as session:
        agent: Agent | None = crud.get_agent(session, agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        agent_character_json: dict = agent.character_json
        agent_env_file: str = agent.env_file

    with Session() as session:
        runtime: Runtime | None = crud.get_runtime(session, runtime_id)
        if not runtime:
            raise HTTPException(status_code=404, detail="Runtime not found")

        ping_endpoint = f"{runtime.url}/ping"
        resp = requests.get(ping_endpoint, timeout=3)
        resp.raise_for_status()

        runtime.started = True

        old_agent = runtime.agent
        if old_agent:
            stop_endpoint = f"{runtime.url}/controller/character/stop"
            resp = requests.post(stop_endpoint)
            resp.raise_for_status()
            crud.update_agent(
                session,
                old_agent,
                AgentUpdate(runtime_id=None),
            )

        start_endpoint = f"{runtime.url}/controller/character/start"

    # Start the new agent
    async def helper() -> None:
        """
        Polls the runtime to ensure the agent has started.
        Allows for a faster response to the caller
        """
        character_json: str = json.dumps(agent_character_json)
        env_file: str = agent_env_file
        resp = requests.post(
            start_endpoint,
            json={"character_json": character_json, "envs": env_file},
        )
        resp.raise_for_status()
        # Update the agent once it has been confirmed to be started.

        for _ in range(60):
            resp = requests.get(f"{runtime.url}/controller/character/status")
            if resp.status_code == 200:
                eliza_agent_id: str = resp.json().get("agent_id")
                with Session() as session:
                    crud.update_agent(
                        session,
                        agent,
                        AgentUpdate(
                            eliza_agent_id=eliza_agent_id,
                            runtime_id=runtime_id,
                        ),
                    )
                return
            await asyncio.sleep(10)

        return None

    background_tasks.add_task(helper)
    return (agent, runtime)


@app.post("/users")
async def create_user(user: UserBase) -> User:
    """
    Creates a new user in the database, and returns the full user.
    """
    with Session() as session:
        user = crud.create_user(session, user)

    return user


@app.get("/users")
async def get_user(user_id: UUID | None, public_key: str | None) -> User:
    """
    Returns all users if neither user_id nor public_key are passed
    Returns a user by id if user_id is passed
    Returns a user by public key if public_key is passed
    Raises a 404 if the user is not found
    Raises a 400 if both user_id and public_key are passed
    """
    if user_id and public_key:
        raise HTTPException(
            status_code=400, detail="Only one of user_id or public_key can be provided"
        )

    if not user_id and not public_key:
        with Session() as session:
            users = crud.get_users(session)
        return users

    if user_id:
        with Session() as session:
            user: User | None = crud.get_user(session, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
    else:
        with Session() as session:
            user: User | None = crud.get_user_by_public_key(session, public_key)

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return user


@app.patch("/users/{user_id}")
async def update_user(user_id: UUID, user_update: UserUpdate) -> User:
    """
    Updates an existing in the database, and returns the full user.
    Returns a 404 if the user is not found.
    """
    with Session() as session:
        user = crud.get_user(session, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user = crud.update_user(session, user, user_update)
    return user


@app.delete("/users/{user_id}")
async def delete_user(user_id: UUID) -> None:
    """
    Deletes a user from the database.
    Returns a 404 if the user is not found.
    """
    with Session() as session:
        user = crud.get_user(session, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        crud.delete_user(session, user)
    return None
