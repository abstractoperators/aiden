import os

import psycopg2.pool
from psycopg2.extensions import cursor as Tcursor

# TODO: ORM

db_password = os.getenv("POSTGRES_DB_PASSWORD")
db_host = os.getenv("POSTGRES_DB_HOST")
pool = psycopg2.pool.SimpleConnectionPool(
    1,
    20,
    user="postgres",
    password=db_password,
    host=db_host,
    port="5432",
    database="postgres",
)


def get_unique_accounts(cursor: Tcursor):
    cursor.execute("SELECT id, name from accounts")
    accounts = cursor.fetchall()
    return accounts


def create_runtime(cursor: Tcursor, url: str, agent_id: str = ""):
    cursor.execute(
        "INSERT INTO RUNTIMES (url, agent_id) VALUES (%s, %s)", (url, agent_id)
    )


def get_runtimes(cursor: Tcursor):
    cursor.execute("SELECT * from RUNTIMES")
    runtimes = cursor.fetchall()
    return runtimes


def get_runtime_for_agent(cursor: Tcursor, agent_id: str) -> str:
    cursor.execute("SELECT * from RUNTIMES WHERE agent_id = %s", (agent_id,))
    runtime = cursor.fetchone()
    return runtime[0] if runtime else ""


def update_runtime(cursor: Tcursor, runtime_id: str, agent_id: str):
    cursor.execute(
        "UPDATE RUNTIMES SET agent_id = %s WHERE id = %s", (agent_id, runtime_id)
    )
