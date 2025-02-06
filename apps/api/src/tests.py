import os

import psycopg2

from . import logger


def test_db_connection() -> bool:
    conn = psycopg2.connect(
        database="postgres",
        user="postgres",
        password=os.getenv("POSTGRES_DB_PASSWORD"),
        host=os.getenv("POSTGRES_DB_HOST"),
        port=5432,
        connect_timeout=3,
    )

    cursor = conn.cursor()
    try:
        cursor.execute("SELECT 1")
    except psycopg2.Error as e:
        logger.error(e)
        return False

    return True
