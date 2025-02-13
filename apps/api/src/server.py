from contextlib import asynccontextmanager

import requests
from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI
from psycopg2.extensions import connection as Tconnection

from . import logger
from .db import get_unique_accounts, pool
from .models import Character, ChatRequest
from .tests import test_db_connection

load_dotenv()


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


@router.post("/agents/{agent_id}/chat")
async def chat(agent_id: str, chat_request: ChatRequest) -> list[dict]:
    agent_restapi_url = await get_agent_runtime_host(agent_id)
    if (
        requests.get(f"{agent_restapi_url}/api/character/is-running")
        .json()
        .get("status")
        != "running"
    ):
        return [{"text": "Agent is not running"}]

    chat_endpoint = f"{agent_restapi_url}/{agent_id}/message"

    try:
        resp = requests.post(
            chat_endpoint,
            json={
                "roomId": chat_request.roomId,
                "user": chat_request.user,
                "text": chat_request.text,
            },
        )
        resp.raise_for_status()
    except Exception as e:
        print(e)

    return resp.json()


@router.post("/runtime/new")
def new_runtime(character: Character):
    # TODO: Start a new aws service - probably via github actions to minimize permissions on this thing.
    pass


app.include_router(router, prefix="/api")
