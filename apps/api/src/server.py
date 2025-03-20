import os
from base64 import b64decode
from collections.abc import Sequence
from contextlib import asynccontextmanager
from uuid import UUID

import requests
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_fastapi_instrumentator import Instrumentator, metrics
from urllib3.exceptions import HTTPError

# from pydantic import TypeAdapter
from src import logger, tasks
from src.aws_utils import (
    get_aws_config,
    get_latest_task_definition_revision,
    get_role_session,
)
from src.db import Session, crud, init_db
from src.db.models import (
    Agent,
    AgentBase,
    AgentStartTask,
    AgentStartTaskBase,
    AgentUpdate,
    Runtime,
    RuntimeBase,
    RuntimeCreateTask,
    RuntimeCreateTaskBase,
    RuntimeDeleteTask,
    RuntimeDeleteTaskBase,
    RuntimeUpdate,
    RuntimeUpdateTask,
    RuntimeUpdateTaskBase,
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
    user_id: UUID | None = None,
    user_dynamic_id: UUID | None = None,
) -> Sequence[AgentPublic]:
    """
    Returns a list of Agents.
    If user_id is passed, returns all agents owned by that user.
    If user_dynamic_id is passed, returns all agents owned by that user.
    If neither is passed, returns all agents.
    Raises a 400 if both user_id and user_dynamic_id are passed.
    """
    if user_id and user_dynamic_id:
        raise HTTPException(
            status_code=400,
            detail="Exactly one or zero of user_id or user_dynamic_id may be passed",
        )

    with Session() as session:
        if user_dynamic_id:
            user = crud.get_user_by_dynamic_id(session, user_dynamic_id)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            user_id = user.id
            agents = crud.get_agents_by_user_id(session, user_id)
        elif user_id:
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


@app.post("/runtimes")
def create_runtime() -> RuntimeCreateTask:
    """
    Attempts to create a new runtime.
    Returns a Runtime object immediately, with flag started=False.
    The runtime will be polled for 10 min to verify that it is online.
    If it is not, then the runtime will be deleted.
    Note: This doesn't need to block anything.
    """
    # Perhaps, the least performant code ever written
    # This is why *real* companies use leetcode
    with Session() as session:
        runtimes = crud.get_runtimes(
            session, limit=1000000
        )  # lul better hope you don't run out of memory
        runtime_nums = set()
        for runtime in runtimes:
            runtime_nums.add(runtime.service_no)

    next_runtime_number = 1
    while next_runtime_number in runtime_nums:
        next_runtime_number += 1

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
                service_no=next_runtime_number,
            ),
        )
        res = tasks.create_runtime.delay(
            aws_config_dict=aws_config.model_dump(),
            runtime_no=next_runtime_number,
            runtime_id=runtime.id,
        )

        runtime_create_task: RuntimeCreateTask = crud.create_runtime_create_task(
            session,
            RuntimeCreateTaskBase(
                runtime_id=runtime.id,
                celery_task_id=res.id,
            ),
        )

        return runtime_create_task


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
    Raises a 404 if the task is not found.
    """
    with Session() as session:
        task = crud.get_task(session, task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        return TaskStatus(task["status"])


@app.get("/agents/{agent_id}/start/{runtime_id}")
def get_start_agent_task_status(
    agent_id: UUID | None = None,
    runtime_id: UUID | None = None,
) -> TaskStatus | None:
    """
    Returns the latest status of a task to start an agent on a runtime.
    If only one of agent_id or runtime_id is passed, it returns the status of the most recent task using that id.
    If both are passed, it returns the status of the most recent task using both ids.
    If not found, raises a 404
    Otherwise, it returns the status of the task.
    """
    if not agent_id and not runtime_id:
        raise ValueError("At least one of agent_id or runtime_id must be provided")

    with Session() as session:
        if agent_id and runtime_id:
            agent_start_task: AgentStartTask | None = crud.get_agent_start_task(
                session,
                agent_id=agent_id,
                runtime_id=runtime_id,
            )
        elif agent_id:
            agent_start_task: AgentStartTask | None = crud.get_agent_start_task(
                session,
                agent_id=agent_id,
            )
        elif runtime_id:
            agent_start_task: AgentStartTask | None = crud.get_agent_start_task(  # type: ignore[no-redef]
                session,
                runtime_id=runtime_id,
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="Should not reach here",
            )

        if not agent_start_task:
            raise HTTPException(status_code=404, detail="Task not found")

        task_id = agent_start_task.celery_task_id

        return get_task_status(task_id)


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
    # Make sure that no task for starting an agent is already running.
    # Must block on both agent_id or runtime_id.
    # That is, there must not be a running task for either agent_id or runtime_id.
    task_status_agent: TaskStatus | None = get_start_agent_task_status(
        agent_id=agent_id
    )
    task_status_runtime: TaskStatus | None = get_start_agent_task_status(
        runtime_id=runtime_id
    )

    if task_status_agent and (
        task_status_agent == "PENDING" or task_status_agent == "STARTED"
    ):
        raise HTTPException(
            status_code=400,
            detail=f"There is already a {task_status_agent} task for agent {agent_id}",
        )
    if task_status_runtime and (
        task_status_runtime == TaskStatus.PENDING
        or task_status_runtime == TaskStatus.STARTED
    ):
        raise HTTPException(
            status_code=400,
            detail=f"There is already a {task_status_runtime} task for runtime {runtime_id}",
        )

    with Session() as session:
        agent: Agent | None = crud.get_agent(session, agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")

        runtime: Runtime | None = crud.get_runtime(session, runtime_id)
        if not runtime:
            raise HTTPException(status_code=404, detail="Runtime not found")

        ping_endpoint = f"{runtime.url}/ping"
        resp = requests.get(ping_endpoint, timeout=3)
        try:
            resp.raise_for_status()
            runtime_update = RuntimeUpdate(started=True)
            crud.update_runtime(session, runtime, runtime_update)
        except HTTPError as e:
            logger.error(f"Runtime {runtime_id} is not online. {e}")
            runtime_update = RuntimeUpdate(started=False)
            crud.update_runtime(session, runtime, runtime_update)
            runtime.started = False
            raise HTTPException(status_code=500, detail="Runtime is not online.")

        res = tasks.start_agent.delay(agent_id, runtime_id)
        task_record = AgentStartTaskBase(
            agent_id=agent_id,
            runtime_id=runtime_id,
            celery_task_id=res.id,
        )
        return crud.create_agent_start_task(session, task_record)


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
def update_runtime(
    runtime_id: UUID,
) -> RuntimeUpdateTask:
    """
    Updates runtime to latest task definition.
    Restarts the agent running on it (if any).
    This needs to be run everytime:
       1. Runtime image is updated (in ECR)
       2. Task definition is updated.
    """
    with Session() as session:
        # Make sure that there isn't already a task running to update this runtime.
        runtime: Runtime | None = crud.get_runtime(session, runtime_id)
        if not runtime:
            raise HTTPException(status_code=404, detail="Runtime not found")
        existing_runtime_update_task: RuntimeUpdateTask | None = (
            crud.get_runtime_update_task(session, runtime_id)
        )
        if existing_runtime_update_task:
            task_status = get_task_status(existing_runtime_update_task.celery_task_id)
            if task_status == "PENDING" or task_status == "STARTED":
                raise HTTPException(
                    status_code=400,
                    detail=f"There is already a {task_status} runtime update task for runtime {runtime_id}",
                )

        service_arn = runtime.service_arn
        aws_config = get_aws_config(runtime.service_no)
        if not aws_config:
            raise HTTPException(
                status_code=500,
                detail="Failed to get AWS config. Check ENV environment variable (probably it's dev)",
            )
        ecs_client = get_role_session().client("ecs")
        runtime_task_definition_arn: str = aws_config.task_definition_arn
        latest_revision: int = get_latest_task_definition_revision(
            ecs_client, runtime_task_definition_arn
        )

        logger.info(
            f"Forcing redeployment of service: {service_arn}\n{aws_config.cluster}.{aws_config.service_name} to task revision {latest_revision}"  # noqa
        )

        res = tasks.update_runtime.delay(
            runtime_id=runtime_id,
            aws_config_dict=aws_config.model_dump(),
            service_arn=service_arn,
            task_definition_arn=runtime_task_definition_arn,
            latest_revision=latest_revision,
        )
        runtime_update_task: RuntimeUpdateTask = crud.create_runtime_update_task(  #
            session,
            RuntimeUpdateTaskBase(
                runtime_id=runtime_id,
                celery_task_id=res.id,
            ),
        )

        return runtime_update_task


@app.delete("/runtimes/{runtime_id}")
def delete_runtime(
    runtime_id: UUID,
) -> RuntimeDeleteTask:
    """
    Deletes a runtime by id.
    Raises a 404 if the runtime is not found.
    """
    with Session() as session:
        runtime: Runtime | None = crud.get_runtime(session, runtime_id)
        if not runtime:
            raise HTTPException(status_code=404, detail="Runtime not found")

        aws_config = get_aws_config(runtime.service_no)
        res = tasks.delete_runtime.delay(runtime_id, aws_config.model_dump())
        runtime_delete_task: RuntimeDeleteTask = crud.create_runtime_delete_task(
            session,
            RuntimeDeleteTaskBase(
                runtime_id=runtime_id,
                celery_task_id=res.id,
            ),
        )
        return runtime_delete_task
