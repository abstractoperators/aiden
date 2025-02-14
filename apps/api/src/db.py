import os

import psycopg2.pool
from psycopg2.extensions import cursor as Tcursor

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


def add_runtime(cursor: Tcursor, url: str, agent_id: str):
    cursor.execute(
        "INSERT INTO RUNTIMES (url, agent_id) VALUES (%s, %s)", (url, agent_id)
    )
