from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI

from . import logger
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


app.include_router(router, prefix="/api")
