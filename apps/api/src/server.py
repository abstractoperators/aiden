import os
from contextlib import asynccontextmanager

import requests
from fastapi import APIRouter, FastAPI
from psycopg2.extensions import connection as Tconnection

from . import logger
from .db import (
    create_runtime,
    get_runtime_for_agent,
    get_runtimes,
    get_unique_accounts,
    pool,
    update_runtime,
)
from .models import Character
from .tests import test_db_connection


@asynccontextmanager
async def lifespan(app: FastAPI):
    if test_db_connection():
        logger.info("DB Connection Successful")
    else:
        logger.error("DB Connection Failed")

    yield


app = FastAPI(lifespan=lifespan)
router = APIRouter()


@router.get("/ping")
async def ping():
    return "pong"


@router.get("/agents")
async def get_agents() -> list:
    conn: Tconnection = pool.getconn()
    with conn.cursor() as cursor:
        agents = get_unique_accounts(cursor)
    pool.putconn(conn)
    return agents


@router.get("/agents/{agent_id}")
async def get_agent(agent_id: str) -> list:
    """
    Returns a list of agent ids
    """
    # TODO: Reconcile agent_ids found in runtimes w/ those found in chat logs.
    conn: Tconnection = pool.getconn()

    with conn.cursor() as cursor:
        cursor.execute("SELECT * FROM accounts WHERE id = %s", (agent_id,))
        agent = cursor.fetchone()
    pool.putconn(conn)
    return agent


@router.get("/agents/{agent_id}/hosturl")
async def get_agent_runtime_host(agent_id: str) -> str:
    """
    Returns the url of the restapi of an agent runtime
    Empty string if not found
    """
    conn = pool.getconn()
    with conn.cursor() as cursor:
        return get_runtime_for_agent(cursor, agent_id)


@router.post("/agents/{agent_id}/update")
async def update_agent_runtime(agent_id: str, character: Character):
    # TODO: Only let FE do this.
    agent_restapi_url = await get_agent_runtime_host(agent_id)
    update_endpoint = f"{agent_restapi_url}/controller/character/start"
    stop_endpoint = f"{agent_restapi_url}/controller/character/stop"
    requests.post(stop_endpoint)
    resp = requests.post(update_endpoint, json=character.model_dump())
    new_agent_id = resp.json().get("agent_id")

    if new_agent_id:
        conn = pool.getconn()
        with conn.cursor() as cursor:
            update_runtime(cursor, new_agent_id, agent_id)


@router.get("/agents/{agent_id}/chat_endpoint")
async def chat(agent_id: str) -> str:
    """
    Returns the endpoint to chat with an agent
    """

    conn = pool.getconn()
    with conn.cursor() as cursor:
        agent_host = get_runtime_for_agent(cursor, agent_id)

    if not agent_host:
        return ""
    return f"{agent_host}/{agent_id}/message"


@router.post("/runtime/new")
def new_runtime():
    # TODO: Only let FE do this.
    conn = pool.getconn()
    with conn.cursor() as cursor:
        runtimes = get_runtimes(cursor)
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
        return {"error": "Failed to start the runtime"}

    # TODO: Verify completion of the github action, and that the runtime is up and running

    url = f"https://aiden-runtime-{next_runtime_number}.aiden.space"

    conn = pool.getconn()
    with conn.cursor() as cursor:
        create_runtime(cursor, url)

    return {"url": url}


app.include_router(router, prefix="/api")
