import asyncio
import json
import os
from base64 import b64decode
from collections.abc import Sequence
from contextlib import asynccontextmanager
from uuid import UUID

import requests
from fastapi import BackgroundTasks, FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from prometheus_fastapi_instrumentator import Instrumentator, metrics
from pydantic import TypeAdapter

from src import logger
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
from src.models import AgentPublic, TokenCreationRequest
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
    Creates a new runtime via github actions.
    Runtime will not truly be started until the github action is completed, and aws resources are up and running (~5min)
    Raises a 500 if the github action fails to start.
    Returns the runtime object.
    """
    with Session() as session:
        runtimes = crud.get_runtimes(session)
        runtime_count = len(runtimes)
    next_runtime_number = runtime_count + 1
    if os.getenv("ENV") == "staging":
        url = f"https://aiden-runtime-{next_runtime_number}.staigen.space"
        actions_url = "https://api.github.com/repos/abstractoperators/aiden/actions/workflows/145628373/dispatches"
    elif os.getenv("ENV") == "prod":
        url = f"https://aiden-runtime-{next_runtime_number}.aiden.space"
        actions_url = "https://api.github.com/repos/abstractoperators/aiden/actions/workflows/144070661/dispatches"
    else:
        # TODO: dev env w/ local runtime.
        pass

    # Store the runtime in the database

    GITHUB_WORKFLOW_DISPATCH_PAT = os.getenv("GITHUB_WORKFLOW_DISPATCH_PAT")
    next_runtime_number = runtime_count + 1
    try:
        resp = requests.post(
            actions_url,
            headers={
                "Accept": "application/vnd.github+json",
                "Authorization": f"Bearer {GITHUB_WORKFLOW_DISPATCH_PAT}",
                "X-GitHub-Api-Version": "2022-11-28",
            },
            json={
                "ref": "main",
                "inputs": {
                    "service-no": str(next_runtime_number),
                },
            },
            timeout=3,
        )
        resp.raise_for_status()
    except Exception as e:
        logger.error(e)
        raise HTTPException(status_code=500, detail="Failed to start the runtime.")

    # Assume that if the action didn't error, then all is good 🤡
    with Session() as session:
        runtime = crud.create_runtime(
            session,
            RuntimeBase(url=url, started=False),
        )

    async def helper():
        # Poll the runtime for a couple of minutes to see if it stands up
        for _ in range(60):
            await asyncio.sleep(10)
            resp = requests.get(f"{url}/ping")
            if resp.status_code == 200:
                with Session() as session:
                    crud.update_runtime(session, runtime, RuntimeUpdate(started=True))
                return

        with Session() as session:
            crud.update_runtime(session, runtime, RuntimeUpdate(started=False))

    # TODO: Actually kill the runtime and delete if it doesn't start up instead of leaving on a potential aws crash loop
    # TODO: Heartbeat beyond the initial startup
    background_tasks.add_task(helper)

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
    agent_id: UUID, runtime_id: UUID, background_tasks: BackgroundTasks
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
        resp = requests.get(ping_endpoint)
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
    async def helper():
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
async def get_users() -> Sequence[User]:
    """
    Returns a list of users.
    """
    with Session() as session:
        users = crud.get_users(session)
    return users


@app.get("/users/{user_id}")
async def get_user(user_id: UUID) -> User:
    """
    Returns a user by id.
    Raises a 404 if the user is not found.
    """
    with Session() as session:
        user: User | None = crud.get_user(session, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@app.get("/users/{public_key}")
async def get_user_by_public_key(public_key: str) -> User:
    """
    Returns a user by public key.
    Raises a 404 if the user is not found.
    """
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
