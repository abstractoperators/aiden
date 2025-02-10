from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from psycopg2.extensions import connection as Tconnection

from . import logger
from .db import get_unique_accounts, pool
from .tests import test_db_connection
from .utils import decode_bearer_token, validate_bearer_token, verify_decoded_token

#  TODO: DB
wallets = {}  # {address: idk}


@asynccontextmanager
async def lifespan(app: FastAPI):
    if test_db_connection():
        logger.info("DB Connection Successful")
    else:
        logger.error("DB Connection Failed")

    yield


app = FastAPI(lifespan=lifespan)

# https://fastapi.tiangolo.com/tutorial/cors/#use-corsmiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

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


@router.get("/test-wallet")
async def test_wallet(request: Request):
    token = request.headers.get("Authorization")
    if validate_bearer_token(token):
        return {"message": "Authorized"}

    return {"message": "Not authorized"}


@router.post("/wallet")
async def register_wallet(request: Request):
    token = request.headers.get("Authorization")
    decoded = decode_bearer_token(token)
    if verify_decoded_token(decoded):
        wallet_address = decoded["verified_credentials"]["wallet_address"]
        wallets[wallet_address] = "foobarbaz"
    else:
        return {"message": "Not authorized"}


app.include_router(router, prefix="/api")
