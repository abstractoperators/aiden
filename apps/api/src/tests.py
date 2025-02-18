from . import logger
from .db.db import pool


def test_db_connection() -> bool:
    conn = pool.getconn()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT 1")
    except Exception as e:
        logger.error(e)
        return False

    return True
