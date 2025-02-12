from contextlib import asynccontextmanager

import requests
from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI
from psycopg2.extensions import connection as Tconnection
from pydantic import BaseModel

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
async def get_agents():
    conn: Tconnection = pool.getconn()
    with conn.cursor() as cursor:
        agents = get_unique_accounts(cursor)
    pool.putconn(conn)
    return agents


@router.get("/agents/{agent_id}")
async def get_agent(agent_id: str):
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
    Returns the url of the restapi of the agent
    """
    return agent_runtime_restapis.get(agent_id, None)


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


app.include_router(router, prefix="/api")
