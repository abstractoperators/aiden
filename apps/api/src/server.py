from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI
from psycopg2.extensions import connection as Tconnection

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
    with conn.cursor as cursor:
        agents = get_unique_accounts(cursor)
    pool.putconn(conn)
    return agents


app.include_router(router, prefix="/api")
