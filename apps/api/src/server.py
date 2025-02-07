from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI

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


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/agents/{agent_id}")
async def get_agent(agent_id: int):
    return {"agent_id": "mock_id"}


@app.get('/ping')
async def ping():
    return "pong"
