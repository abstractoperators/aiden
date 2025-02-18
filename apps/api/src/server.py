from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, Request
from psycopg2.extensions import connection as Tconnection

from . import logger
from .db import get_unique_accounts, pool
from .token_deployment import deploy_token
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

@router.post("/deploy-token")
async def deploy_token_api(request: Request):
    # Validate inputs
    print(request)
    body = await request.json()
    name = body.get("name")
    ticker = body.get("ticker")
    
    # Deploy the token
    result = await deploy_token(name, ticker)

    # Return the result
    return {"message": f"Token {name} ({ticker}) deployed successfully!", "result": result}

app.include_router(router, prefix="/api")
