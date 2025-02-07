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
print(f"DB Host: {db_host}")


def get_unique_accounts(cursor: Tcursor):
    cursor.execute("SELECT name from accounts")
    accounts = cursor.fetchall()
    return accounts
