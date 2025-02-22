import os
from collections.abc import Sequence
from contextlib import asynccontextmanager

import requests
from fastapi import FastAPI, HTTPException

from src import logger
from src.db import Session, crud, init_db
from src.db.models import (
    Agent,
    AgentBase,
    AgentUpdate,
    Runtime,
    RuntimeBase,
    Token,
    TokenBase,
    User,
    UserBase,
    UserUpdate,
)
from src.models import Character, TokenCreationRequest
from src.setup import test_db_connection
from src.token_deployment import deploy_token


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


@app.get("/ping")
async def ping():
    """
    pong
    """
    return "pong"


@app.get("/agents")
async def get_agents() -> Sequence[Agent]:
    """
    Returns a list of Agents.
    """
    with Session() as session:
        agents = crud.get_agents(session)
    return agents


@app.get("/agents/{agent_id}")
async def get_agent(agent_id: str) -> Agent:
    """
    Returns an agent by id.
    Raises a 404 if the agent is not found.
    """
    with Session() as session:
        agent: Agent | None = crud.get_agent(session, agent_id)

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

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
    contract_address = await deploy_token(name, ticker)

    with Session() as session:
        token = crud.create_token(
            session,
            TokenBase(
                name=name,
                ticker=ticker,
                evm_contract_address=contract_address,
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
async def get_token(token_id: str) -> Token:
    """
    Returns a token by id.
    Raises a 404 if the token is not found.
    """
    with Session() as session:
        token: Token | None = crud.get_token(session, token_id)

    if not token:
        raise HTTPException(status_code=404, detail="Token not found")

    return token


@app.post("/agents")
def create_agent(agent: AgentBase) -> Agent:
    """
    Creates an agent
    """
    with Session() as session:
        agent = crud.create_agent(session, agent)

    return agent


@app.post("/runtimes")
def create_runtime() -> Runtime:
    """
    Creates a new runtime via github actions.
    Runtime will not truly be started until the github action is completed, and aws resources are up and running (~5min)
    Raises a 500 if the github action fails to start.
    Returns the runtime object.
    """
    # Figure out how many runtimes there already are.
    with Session() as session:
        runtimes = crud.get_runtimes(session)
        runtime_count = len(runtimes)

    GITHUB_WORKFLOW_DISPATCH_PAT = os.getenv("GITHUB_WORKFLOW_DISPATCH_PAT")
    next_runtime_number = runtime_count + 1
    try:
        if os.getenv("ENV") == "staging":
            url = "https://api.github.com/repos/abstractoperators/aiden/actions/workflows/create-new-runtime-staging.yaml/dispatches"
        elif os.getenv("ENV") == "prod":
            url = "https://api.github.com/repos/abstractoperators/aiden/actions/workflows/144070661"
        print(url)
        print(next_runtime_number)
        resp = requests.post(
            url=url,
            headers={
                "Accept": "application/vnd.github+json",
                "Authorization": f"Bearer {GITHUB_WORKFLOW_DISPATCH_PAT}",
                "X-GitHub-Api-Version": "2022-11-28",
            },
            json={
                "ref": "refs/heads/michael/prod",
                "inputs": {
                    "service-no": str(next_runtime_number),
                },
            },
            timeout=3,
        )
        resp.raise_for_status()
    except Exception as e:
        logger.error(e)
        raise HTTPException(status_code=400, detail=f"Failed to start the runtime {e}")

    # TODO: Verify completion of the github action, and that the runtime is up and running

    url = f"https://aiden-runtime-{next_runtime_number}.aiden.space"

    # Store the runtime in the database
    with Session() as session:
        runtime = crud.create_runtime(session, RuntimeBase(url=url))

    return runtime


@app.get("/runtimes")
def get_runtimes() -> Sequence[Runtime]:
    """
    Returns a list of up to 100 runtimes.
    """
    with Session() as session:
        runtimes = crud.get_runtimes(session)
    return runtimes


@app.post("/agents/{agent_id}/start/{runtime_id}")
def start_agent(agent_id: str, runtime_id: str) -> tuple[Agent, Runtime]:
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

    with Session() as session:
        runtime: Runtime | None = crud.get_runtime(session, runtime_id)
        if not runtime:
            raise HTTPException(status_code=404, detail="Runtime not found")

        old_agent = runtime.agent
        if old_agent:
            stop_endpoint = f"{runtime.url}/controller/character/stop"
            requests.post(stop_endpoint)
            crud.update_agent(session, old_agent, AgentUpdate(runtime_id=None))

    start_endpoint = f"{runtime.url}/controller/character/start"

    # Start the new agent
    resp = requests.post(
        start_endpoint,
        Character(
            character_json=agent.character_json,
            envs=agent.env_file,
        ).model_dump_json(),
    )
    eliza_agent_id = resp.json().get("agent_id")
    # Update the agent to have a runtime now
    with Session() as session:
        agent = crud.update_agent(
            session,
            agent,
            AgentUpdate(eliza_agent_id=eliza_agent_id, runtime_id=runtime_id),
        )

    return (agent, runtime)


@app.post("/users")
async def create_user(user: UserBase) -> User:
    """
    Creates a new user in the database, and returns the full user.
    """
    with Session() as session:
        user = crud.create_user(session, user)

    return user


@app.patch("/users/{user_id}")
async def update_user(user_pub_key: str, user_update: UserUpdate) -> User:
    """
    Updates an existing in the database, and returns the full user.
    Returns a 404 if the user is not found.
    """
    with Session() as session:
        user = crud.get_user(session, user_pub_key)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user = crud.update_user(session, user, user_update)
    return user


@app.delete("/users/{user_id}")
async def delete_user(user_id: str) -> None:
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
