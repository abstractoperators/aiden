from sqlmodel import text

from . import logger
from .db import Session


def test_db_connection() -> bool:
    with Session() as session:
        try:
            session.exec(text("SELECT 1"))
            return True
        except Exception as e:
            logger.error(e)
            return False
