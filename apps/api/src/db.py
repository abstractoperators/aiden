import os
from contextlib import contextmanager

import psycopg2.pool
from psycopg2.extensions import cursor as Tcursor
from sqlalchemy import URL
from sqlmodel import Session as SQLModelSession
from sqlmodel import create_engine

# TODO: ORM

db_password = os.getenv("POSTGRES_DB_PASSWORD")
db_host = os.getenv("POSTGRES_DB_HOST")
if db_password and db_host:
    SQLALCHEMY_DATABASE_URL = URL.create(
        drivername="postgresql+psycopg2",
        username="postgres",
        password=db_password,
        host=db_host,
        database="postgres",
    )
    connect_args = {}
else:
    SQLALCHEMY_DATABASE_URL = URL.create(
        drivername="sqlite",
        username="",
        password="",
        host="",
        database="test.db",
    )
    connect_args = {"check_same_thread": False}

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)


@contextmanager
def Session():
    session = SQLModelSession(engine)
    try:
        yield session
    finally:
        session.close()


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
    """
    Returns a list of unique accounts ~ agents.
    """
    cursor.execute("SELECT id, name from accounts")
    accounts = cursor.fetchall()
    return accounts


def create_runtime(cursor: Tcursor, url: str, agent_id: str = ""):
    """
    Create a new runtime entry.
    """
    cursor.execute(
        "INSERT INTO RUNTIMES (url, agent_id) VALUES (%s, %s)", (url, agent_id)
    )


def get_runtimes(cursor: Tcursor):
    """
    Returns a list of all runtimes
    """
    cursor.execute("SELECT * from RUNTIMES")
    runtimes = cursor.fetchall()
    return runtimes


def get_runtime_for_agent(cursor: Tcursor, agent_id: str) -> str:
    cursor.execute("SELECT * from RUNTIMES WHERE agent_id = %s", (agent_id,))
    runtime = cursor.fetchone()
    return runtime[0] if runtime else ""


def update_runtime(cursor: Tcursor, url: str, agent_id: str = ""):
    """
    Updates the agent_id for a runtime.
    """
    cursor.execute("UPDATE RUNTIMES SET agent_id = %s WHERE url = %s", (agent_id, url))
