import os
from contextlib import asynccontextmanager

import requests
from fastapi import APIRouter, FastAPI
from psycopg2.extensions import connection as Tconnection

from . import logger
from .db import get_runtimes, get_unique_accounts, pool
from .models import Character, ChatRequest
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
    conn: Tconnection = pool.getconn()
    with conn.cursor() as cursor:
        cursor.execute("SELECT * FROM accounts WHERE id = %s", (agent_id,))
        agent = cursor.fetchone()
    pool.putconn(conn)
    return agent


# TODO: Db
# agentid_to_runtime_host = {
#     "3fb0b89b-047f-034c-8026-40bb1ee01035": "https://eve.aiden.space",
# }
# runtime_host_to_agentid = {
#     "https://eve.aiden.space": "3fb0b89b-047f-034c-8026-40bb1ee01035",
# }
agentid_to_runtime_host = {
    "3fb0b89b-047f-034c-8026-40bb1ee01035": "http://localhost:8000",
}
runtime_host_to_agentid = {
    "http://localhost:8000": "3fb0b89b-047f-034c-8026-40bb1ee01035",
}


@router.get("/agents/{agent_id}/hosturl")
async def get_agent_runtime_host(agent_id: str) -> str | None:
    """
    Returns the url of the restapi of an agent runtime
    """
    return agentid_to_runtime_host.get(agent_id, None)


@router.post("/agents/{agent_id}/update")
async def update_agent_runtime(agent_id: str, character: Character):
    # TODO: Only let FE do this.
    agent_restapi_url = await get_agent_runtime_host(agent_id)
    update_endpoint = f"{agent_restapi_url}/api/character/start"
    stop_endpoint = f"{agent_restapi_url}/api/character/stop"
    requests.post(stop_endpoint)
    resp = requests.post(update_endpoint, json=character.model_dump())
    new_agent_id = resp.json().get("agent_id")

    # Remove old mappings
    agentid_to_runtime_host.pop(agent_id)

    # Add new mappings
    agentid_to_runtime_host[new_agent_id] = agent_restapi_url
    runtime_host_to_agentid[agent_restapi_url] = new_agent_id


@router.post("/agents/{agent_id}/chat_endpoint")
async def chat(agent_id: str, chat_request: ChatRequest) -> list[dict]:
    return [{}]
    # agent_restapi_url = await get_agent_runtime_host(agent_id)
    # if requests.get(f"{agent_restapi_url}/api/character/is-running").json().get("status") != "running":
    #     return [{"text": "Agent is not running"}]

    # chat_endpoint = f"{agent_restapi_url}/{agent_id}/message"

    # try:
    #     resp = requests.post(
    #         chat_endpoint,
    #         json={
    #             "roomId": chat_request.roomId,
    #             "user": chat_request.user,
    #             "text": chat_request.text,
    #         },
    #     )
    #     resp.raise_for_status()
    # except Exception as e:
    #     print(e)

    # return resp.json()


@router.post("/runtime/new")
def new_runtime():
    # TODO: Only let FE do this.
    conn = pool.getconn()
    with conn.cursor() as cursor:
        runtimes = get_runtimes(cursor)
        print(runtimes)
        runtime_count = len(runtimes)

    print("Runtime count:", runtime_count)

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
        print(e)
        return {"error": "Failed to start the runtime"}

    # TODO: Verify completion of the github action, and that the runtime is up and running

    url = f"https://aiden-runtime-{next_runtime_number}.aiden.space"
    return {"url": url}


app.include_router(router, prefix="/api")
