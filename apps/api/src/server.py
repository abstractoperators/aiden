import asyncio
import os
import re
from base64 import b64decode
from collections.abc import Sequence
from contextlib import asynccontextmanager
from uuid import UUID

import requests
from boto3 import Session as Boto3Session
from fastapi import BackgroundTasks, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from mypy_boto3_ecs.client import ECSClient
from mypy_boto3_elbv2.client import ElasticLoadBalancingv2Client as ELBv2Client
from prometheus_fastapi_instrumentator import Instrumentator, metrics

# from pydantic import TypeAdapter
from src import logger, tasks
from src.aws_utils import (
    create_http_target_group,
    create_listener_rules,
    create_runtime_service,
    get_aws_config,
    get_latest_task_definition_revision,
    get_role_session,
)
from src.db import Session, crud, init_db
from src.db.models import (
    Agent,
    AgentBase,
    AgentStartTask,
    AgentUpdate,
    Runtime,
    RuntimeBase,
    RuntimeUpdate,
    Token,
    TokenBase,
    User,
    UserBase,
    UserUpdate,
    Wallet,
    WalletBase,
    WalletUpdate,
)
from src.models import (
    AgentPublic,
    AWSConfig,
    TaskStatus,
    TokenCreationRequest,
    UserPublic,
    agent_to_agent_public,
    user_to_user_public,
)
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
                status_code=401, content={"detail": "No authorization header provided"}
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

# TODO: Change this based on env
env = os.getenv("ENV")
if env == "dev" or env == "test":
    allowed_origins = ["http://localhost:3000", "http://localhost:8001"]
elif env == "staging":
    allowed_origins = ["https://staigen.space"]
elif env == "prod":
    allowed_origins = ["https://aiden.space"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/add")
async def add_celery():
    result = tasks.add.delay(4, 4)
    result.get()


@app.get("/ping")
async def ping():
    """
    pong
    """
    return "pong"


@app.post("/agents")
def create_agent(agent: AgentBase) -> AgentPublic:
    """
    Creates an agent. Does not start the agent.
    Only stores it in db.
    """
    with Session() as session:
        agent = crud.create_agent(session, agent)

        return agent_to_agent_public(agent)


@app.get("/agents")
async def get_agents(
    user_id: UUID | None = None, user_dynamic_id: UUID | None = None
) -> Sequence[AgentPublic]:
    """
    Returns a list of Agents.
    If user_id is passed, returns all agents for that user.
    If user_dynamic_id is passed, returns all agents for that user.
    If neither is passed, returns all agents.
    Raises a 400 if both user_id and user_dynamic_id are passed.
    """
    if user_id and user_dynamic_id:
        raise HTTPException(
            status_code=400,
            detail="Exactly one of user_id or user_dynamic_id should be passed",
        )

    with Session() as session:
        if user_dynamic_id:
            pass
            # TODO: merge in pr 52 w/ dynamic_id stuff.
        if user_id:
            agents = crud.get_agents_by_user_id(session, user_id)
        else:
            agents = crud.get_agents(session)

        return [agent_to_agent_public(agent) for agent in agents]


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

        return agent_to_agent_public(agent)


@app.patch("/agents/{agent_id}")
async def update_agent(agent_id: UUID, agent_update: AgentUpdate) -> AgentPublic:
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

        return agent_to_agent_public(agent)


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
                abi=contract_abi,
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


def create_runtime_local():
    """
    'Creates' a runtime locally.
    Expects that runtime docker image is already running with make run-runtime
    Just creates an entry in sqlite db.
    """
    if os.getenv("inside_docker") and os.getenv("ENV") == "dev":
        url = "http://host.docker.internal:8000"
    else:
        url = "http://localhost:8000"

    with Session() as session:
        runtime = crud.create_runtime(
            session,
            RuntimeBase(
                url=url,
                started=True,
            ),
        )

    return runtime


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
def get_runtimes(unused: bool = False) -> Sequence[Runtime]:
    """
    Returns a list of up to 100 runtimes.
    """
    with Session() as session:
        runtimes = crud.get_runtimes(session)

        if unused:
            runtimes = [runtime for runtime in runtimes if not runtime.agent]
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


@app.get("/tasks/{task_id}")
def get_task_status(task_id: UUID) -> TaskStatus:
    """
    Returns the status of a task by id.
    """
    with Session() as session:
        task = crud.get_task(session, task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        return TaskStatus(task["status"])


@app.get("/agents/{agent_id}/start/{runtime_id}")
def get_start_agent_task_status(
    agent_id: UUID,
    runtime_id: UUID,
) -> TaskStatus:
    with Session() as session:
        agent_start_task: AgentStartTask = crud.get_agent_start_task(
            session, agent_id, runtime_id
        )
        if not agent_start_task:
            raise HTTPException(status_code=404, detail="Agent start task not found.")

        task_id = agent_start_task.task_id

        task_status = get_task_status(task_id)
        return task_status


@app.post("/agents/{agent_id}/start/{runtime_id}")
def start_agent(
    agent_id: UUID,
    runtime_id: UUID,
) -> AgentStartTask:
    """
    Kicks off a task to start an agent on a runtime.
    Returns a task record that you can retrieve from.
    Returns a 404 if the agent or runtime is not found.
    """
    # TODO: Check to make sure that no task is currently running on the same parameters, and that it is still pending.
    with Session() as session:
        agent: Agent | None = crud.get_agent(session, agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")

        runtime: Runtime | None = crud.get_runtime(session, runtime_id)
        if not runtime:
            raise HTTPException(status_code=404, detail="Runtime not found")

        logger.info(f"Checking if runtime {runtime_id} is online")
        ping_endpoint = f"{runtime.url}/ping"
        resp = requests.get(ping_endpoint, timeout=3)
        resp.raise_for_status()

        logger.info(f"Runtime {runtime_id} is online")
        runtime.started = True

    res = tasks.start_agent.delay(agent_id, runtime_id)
    task_record = AgentStartTask(
        agent_id=agent_id,
        runtime_id=runtime_id,
        celery_task_id=res.id,
    )
    return task_record


@app.post("/wallets")
async def create_wallet(wallet: WalletBase) -> Wallet:
    """
    Creates a new wallet.
    Returns the wallet address and private key.
    """
    with Session() as session:
        wallet = crud.create_wallet(session, wallet)
        return wallet


@app.get("/wallets")
async def get_wallets(
    wallet_id: UUID | None = None,
    owner_id: UUID | None = None,
    public_key: str | None = None,
) -> Sequence[Wallet] | Wallet:
    """
    Returns wallet(s) by query parameter.
    wallet_id returns a single wallet.
    owner_id returns all wallets for an owner as a sequence
    public_key returns a wallet.
    """
    if sum([bool(wallet_id), bool(owner_id), bool(public_key)]) != 1:
        raise HTTPException(
            status_code=400,
            detail="Exactly one of wallet_id, owner_id, or wallet_public_key must be passed.",
        )

    with Session() as session:
        if wallet_id:
            wallet = crud.get_wallet(session, wallet_id)
            if not wallet:
                raise HTTPException(status_code=404, detail="Wallet not found")
            return wallet
        elif public_key:
            wallet = crud.get_wallet_by_public_key(
                session,
                public_key,
            )  # no-redef
            if not wallet:
                raise HTTPException(status_code=404, detail="Wallet not found")
            return wallet
        elif owner_id:
            wallets = crud.get_wallets_by_owner(session, owner_id)  # no-redef
            if not wallets:
                raise HTTPException(status_code=404, detail="Wallet not found")
            return wallets

    raise HTTPException(status_code=500, detail="Should not reach here")


@app.patch("/wallets/{wallet_id}")
async def update_wallet(wallet_id: UUID, wallet_update: WalletUpdate) -> Wallet:
    with Session() as session:
        wallet = crud.get_wallet(session, wallet_id)
        if not wallet:
            raise HTTPException(status_code=404, detail="Wallet not found")
        wallet = crud.update_wallet(session, wallet, wallet_update)

        return wallet


@app.delete("/wallets/{wallet_id}")
async def delete_wallet(wallet_id: UUID) -> None:
    """
    Deletes a wallet.
    Returns a 404 if the wallet is not found.
    """
    with Session() as session:
        wallet = crud.get_wallet(session, wallet_id)
        if not wallet:
            raise HTTPException(status_code=404, detail="Wallet not found")
        crud.delete_wallet(session, wallet)
    return None


@app.post("/users")
async def create_user(user: UserBase) -> User:
    """
    Creates a new user in the database, and returns the full user.
    """
    with Session() as session:
        user = crud.create_user(session, user)

    return user


@app.get("/users")
async def get_user(
    user_id: UUID | None = None,
    public_key: str | None = None,
    dynamic_id: UUID | None = None,
) -> UserPublic:
    """
    Raises a 400 if more than one parameter is passed.
    Raises a 404 if the user is not found.
    Otherwise, returns the user by query parameter.
    """
    num_params = sum([bool(user_id), bool(public_key), bool(dynamic_id)])
    if num_params != 1:
        raise HTTPException(
            status_code=400,
            detail="Exactly one of user_id, public_key, or dynamic_id must be passed.",
        )

    with Session() as session:
        user: User | None = None
        if user_id:
            user = crud.get_user(session, user_id)
        elif public_key:
            user = crud.get_user_by_public_key(session, public_key)  # no-redef
        elif dynamic_id:
            user = crud.get_user_by_dynamic_id(session, dynamic_id)  # no-redef

        if user is None:
            raise HTTPException(status_code=404, detail="User not found")

        return user_to_user_public(user)


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


@app.patch("/runtimes/{runtime_id}")
def update_runtime(runtime_id: UUID, background_tasks: BackgroundTasks) -> Runtime:
    """
    Updates runtime to latest task definition.
    Restarts the agent running on it (if any).
    This needs to be run everytime:
       1. Runtime image is updated (in ECR)
       2. Task definition is updated.
    """
    # Get the session, and use it's URL to find the service
    # TODO: Just track the service ARN in the DB so we don't have to do this shenanigans.
    with Session() as session:
        runtime: Runtime | None = crud.get_runtime(session, runtime_id)
        if not runtime:
            raise HTTPException(status_code=404, detail="Runtime not found")
        runtime_url = runtime.url

        runtime_service_num_match = re.search(r"aiden-runtime-(\d+)", runtime_url)
        if not runtime_service_num_match or not (
            runtime_service_num := runtime_service_num_match.group(1)
        ):
            raise HTTPException(
                status_code=500,
                detail="Failed to parse runtime number from runtime URL",
            )
        runtime_service_num = int(runtime_service_num)
        ecs_client = get_role_session().client("ecs")
        aws_config = get_aws_config(runtime_service_num)
        if not aws_config:
            raise HTTPException(
                status_code=500,
                detail="Failed to get AWS config. Check ENV environment variable (probably it's dev)",
            )
        runtime_task_definition_arn: str = aws_config.task_definition_arn
        latest_revision: int = get_latest_task_definition_revision(
            ecs_client, runtime_task_definition_arn
        )
        service = ecs_client.describe_services(
            cluster=aws_config.cluster,
            services=[aws_config.service_name],
        )["services"][0]
        service_arn = service["serviceArn"]
        logger.info(
            f"Forcing redeployment of service: {service_arn}\n{aws_config.cluster}.{aws_config.service_name} to task revision {latest_revision}"  # noqa
        )

        # Force redeployment w/ latest definition
        # 1. Update Agent in DB to not have a runtime
        agent = runtime.agent
        if agent is not None:
            agent_id = agent.id
            crud.update_agent(session, agent, AgentUpdate(runtime_id=None))
        crud.update_runtime(session, runtime, RuntimeUpdate(started=False))

    # 2. Force redeployment
    service = ecs_client.update_service(
        cluster=aws_config.cluster,
        service=aws_config.service_name,
        taskDefinition=f"{runtime_task_definition_arn}:{latest_revision}",
        forceNewDeployment=True,
    )["service"]

    # 3. Make sure that the service is stable, then restart the running agent.
    async def helper():
        """
        Helper polls service until deployment is stable.
        Then it polls the actual service until it is online.
        Finally, it restarts the agent that was running on this runtime (if any)
        """
        # Poll until service is stable
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
            await asyncio.sleep(15)

        # Poll until server on the service is up
        for i in range(40):
            try:
                resp = requests.get(f"{runtime_url}/ping", timeout=3)
                resp.raise_for_status()
                logger.info(f"Runtime for {runtime_id} is online")
                with Session() as session:
                    crud.update_runtime(session, runtime, RuntimeUpdate(started=True))
                break
            except Exception as e:
                logger.info(
                    f"{i}/{40}: Runtime for {runtime_id} is not online yet. {e}"
                )
                await asyncio.sleep(15)

        # Restart the agent (if any)
        logger.info("Restarting agent (if any)")
        if agent is not None:
            logger.info(f"Restarting agent {agent_id}")
            start_agent(
                agent_id=agent_id,
                runtime_id=runtime_id,
                background_tasks=background_tasks,
            )

    background_tasks.add_task(helper)

    return runtime
