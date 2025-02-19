import os
from collections.abc import Sequence
from contextlib import asynccontextmanager

import requests
from fastapi import APIRouter, FastAPI, HTTPException

from . import logger
from .db import Session, crud
from .db.models import (
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
from .models import Character, TokenCreationRequest
from .setup import test_db_connection
from .token_deployment import deploy_token


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa
    if test_db_connection():
        logger.info("DB Connection Successful")
    else:
        logger.error("DB Connection Failed")
        raise Exception("DB Connection Failed")
    yield


app = FastAPI(lifespan=lifespan)
router = APIRouter()


@router.get("/ping")
async def ping():
    return "pong"


@router.get("/agents")
async def get_agents() -> Sequence[Agent]:
    """
    Returns a list of agent ids and names.
    """
    with Session() as session:
        agents = crud.get_agents(session)
    return list(agents)


@router.get("/agents/{agent_id}")
async def get_agent(agent_id: str) -> Agent | None:
    """
    Returns a list of agent ids
    """
    with Session() as session:
        agent: Agent | None = crud.get_agent(session, agent_id)

    return agent


@router.post("/deploy-token")
async def deploy_token_api(token_request: TokenCreationRequest) -> Token:
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


@router.post("/agent/create")
def create_agent(agent: AgentBase) -> Agent:
    with Session() as session:
        agent = crud.create_agent(session, agent)

    return agent


@router.post("/runtime/create")
def create_runtime() -> Runtime | None:
    # Figure out how many runtimes there already are.j
    with Session() as session:
        runtimes = crud.get_runtimes(session)
        runtime_count = len(runtimes)

    GITHUB_WORKFLOW_DISPATCH_PAT = os.getenv("GITHUB_WORKFLOW_DISPATCH_PAT")
    next_runtime_number = runtime_count + 1
    try:
        resp = requests.post(
            "https://api.github.com/repos/abstractoperators/aiden/actions/workflows/144070661/dispatches",
            headers={
                "Accept": "application/vnd.github+json",
                "Authorization": f"Bearer {GITHUB_WORKFLOW_DISPATCH_PAT}",
                "X-GitHub-Api-Version": "2022-11-28",
            },
            json={
                "ref": "michael/crud-agents",
                "inputs": {
                    "service-no": str(next_runtime_number),
                },
            },
            timeout=3,
        )
        resp.raise_for_status()
    except Exception as e:
        logger.error(e)
        return None

    # TODO: Verify completion of the github action, and that the runtime is up and running

    url = f"https://aiden-runtime-{next_runtime_number}.aiden.space"

    # Store the runtime in the database
    with Session() as session:
        runtime = crud.create_runtime(session, RuntimeBase(url=url))

    return runtime


@router.post("/agent/{agent_id}/start/{runtime_id}")
def start_agent(agent_id: str, runtime_id: str) -> tuple[Agent, Runtime]:
    with Session() as session:
        runtime: Runtime | None = crud.get_runtime(session, runtime_id)
        if not runtime:
            return HTTPException(status_code=404, detail="Runtime not found")

    with Session() as session:
        old_agent: Agent | None = crud.get_agent(session, agent_id)
        if old_agent:
            stop_endpoint = f"{runtime.url}/controller/character/stop"
            requests.post(stop_endpoint)
            crud.update_agent(session, old_agent, AgentUpdate(runtime_id=None))

    start_endpoint = f"{runtime.url}/controller/character/start"

    # Start the new agent
    with Session() as session:
        agent: Agent | None = crud.get_agent(session, agent_id)
        if not agent:
            return HTTPException(status_code=404, detail="Agent not found")
    requests.post(
        start_endpoint,
        Character(
            character_json=agent.character_json,
            envs=agent.env_file,
        ),
    )
    # Update the agent to have a runtime now
    with Session() as session:
        crud.update_agent(session, agent, AgentUpdate(runtime_id=runtime_id))

    return (agent, runtime)


@router.get("/agents/{agent_id}/runtime")
async def get_runtime_for_agent(agent_id: str) -> Runtime | None:
    """
    Returns the url of the restapi of an agent runtime
    Empty string if not found
    """
    with Session() as session:
        agent: Agent | None = crud.get_agent(session, agent_id)
        if agent is None:
            return None
        runtime = agent.runtime
    return runtime


@router.get("/agents/{agent_id}/chat_endpoint")
async def chat(agent_id: str) -> str | None:
    """
    Returns the endpoint to chat with an agent
    """
    with Session() as session:
        agent = crud.get_agent(session, agent_id)
        if agent is None:
            return None
        runtime = agent.runtime
    return f"{runtime.url}/{agent_id}/chat"


@router.post("/user/create")
async def create_user(user: UserBase) -> User:
    with Session() as session:
        user = crud.create_user(session, user)

    return user


@router.post("/user/{user_id}/update")
async def update_user(user_id: str, user: UserUpdate) -> User | None:
    with Session() as session:
        user = crud.update_user(session, user_id, user)
    return user


app.include_router(router, prefix="/api")
