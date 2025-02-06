import os
from contextlib import asynccontextmanager

import psycopg2
from dotenv import load_dotenv
from fastapi import FastAPI, Request

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


@app.get("/agents/{agent_id}/chat")
async def get_agent_chat(agent_id: int, request: Request):
    request_body = await request.json()
    message = request_body["message"]
    return {"agent_id": agent_id, "message": message}
