import os

import psycopg2
from dotenv import load_dotenv
from fastapi import FastAPI, Request

load_dotenv("../../.env.eve")
app = FastAPI()


async def root():
    return {"message": "Hello World"}


@app.get("/agents/{agent_id}")
async def get_agent(agent_id: int):
    return {"agent_id": agent_id}


@app.get("/agents/{agent_id}/chat")
async def get_agent_chat(agent_id: int, request: Request):
    request_body = await request.json()
    message = request_body["message"]
    return {"agent_id": agent_id, "message": message}


def test_db_connection() -> bool:
    password = os.getenv("POSTGRES_DB_PASSWORD")
    host = os.getenv("POSTGRES_DB_HOST")
    print(password[:3])
    print(host[:3])

    conn = psycopg2.connect(
        database="postgres",
        user="postgres",
        password=password,
        host=host,
        port=5432,
        connect_timeout=3,
    )

    cursor = conn.cursor()
    try:
        cursor.execute("SELECT 1")
    except:
        return False

    return True


if test_db_connection():
    print("DB Connection Successful")
else:
    print("DB Connection Failed")
