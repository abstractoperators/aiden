from sqlmodel import text

from src import logger
from src.db import Session


def test_db_connection() -> bool:
    with Session() as session:
        try:
            session.exec(text("SELECT 1"))
            return True
        except Exception as e:
            logger.error(e)
            return False
