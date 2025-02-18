from . import logger
from .db import Session


def test_db_connection() -> bool:
    with Session() as session:
        try:
            session.exec("SELECT 1")
        except Exception as e:
            logger.error(e)
            return False
