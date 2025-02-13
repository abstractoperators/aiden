from contextlib import asynccontextmanager

import requests
from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI
from psycopg2.extensions import connection as Tconnection
from pydantic import BaseModel, Field

from . import logger
from .db import get_unique_accounts, pool
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
agent_runtime_restapis = {
    "3fb0b89b-047f-034c-8026-40bb1ee01035": "https://eve.aiden.space",
}
# agent_runtime_restapis = {
#     "3fb0b89b-047f-034c-8026-40bb1ee01035": "http://localhost:8000",
# }


@router.get("/agents/{agent_id}/restapis")
async def get_agent_restapis(agent_id: str) -> str | None:
    """
    Returns the url of the restapi of an agent runtime
    """
    return agent_runtime_restapis.get(agent_id, None)


class Character(BaseModel):
    character_json: str = Field(
        "{}",
        description="Escaped character json for an eliza agent",
    )
    envs: str = Field(
        "",
        description="A string representing an env file containing environment variables for the eliza agent",
    )


@router.post("/agents/{agent_id}/update")
async def update_agent_runtime(agent_id: str, character: Character):
    agent_restapi_url = await get_agent_restapis(agent_id)
    update_endpoint = f"{agent_restapi_url}/api/character/start"
    stop_endpoint = f"{agent_restapi_url}/api/character/stop"
    requests.post(stop_endpoint)
    resp = requests.post(update_endpoint, json=character.model_dump())
    new_agent_id = resp.json().get("agent_id")

    agent_runtime_restapis[new_agent_id] = agent_restapi_url
    agent_runtime_restapis.pop(agent_id)


class ChatRequest(BaseModel):
    roomId: str | None = None
    user: str | None = None
    text: str


@router.post("/agents/{agent_id}/chat")
async def chat(agent_id: str, chat_request: ChatRequest) -> list[dict]:
    agent_restapi_url = await get_agent_restapis(agent_id)
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


async def build_and_push_agent_runtime(character_json: dict):
    """
    Uses github actions to build and push an agent runtime.
    """
    # TODO https://pygithub.readthedocs.io/en/stable/introduction.html
    pass


async def upload_secrets_for_agent_runtime(foo):
    """
    Uploads secrets to AWS secrets manager for the agent runtime
    """
    pass


app.include_router(router, prefix="/api")
