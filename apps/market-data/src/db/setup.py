from contextlib import contextmanager
import logging
import os

from sqlalchemy import URL
from sqlmodel import create_engine, Session as SQLModelSession, text

from src import logger


username = os.getenv("POSTGRES_USER")
password = os.getenv("POSTGRES_PASSWORD")
host = os.getenv("POSTGRES_HOST")
port = os.getenv("POSTGRES_PORT")
database = os.getenv("POSTGRES_DATABASE") or username
if password and host:
    SQLALCHEMY_DATABASE_URL = URL.create(
        drivername="postgresql+psycopg",
        username=username or "postgres",
        password=password,
        host=host,
        port=int(port) if port else 5432,
        database=database or "postgres",
    )
    logger.info(f"SQLALCHEMY_DATABASE_URL {SQLALCHEMY_DATABASE_URL}")
else:
    raise ValueError("Unknown environment for db. See db/setup.py")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
)


@contextmanager
def Session():
    session = SQLModelSession(engine)
    try:
        yield session
    finally:
        session.close()


def init_db():
    """
    Initializes database tables and runs alembic migrations
    """
    logger.info("Initializing database, running alembic migrations")
    from alembic import command
    from alembic.config import Config

    dir_path = os.path.dirname(os.path.realpath(__file__))
    alembic_cfg = Config(os.path.join(dir_path, "../../alembic.ini"))
    command.upgrade(alembic_cfg, "head")

    logging.getLogger().setLevel(logging.INFO)
    logging.getLogger("alembic").propagate = True


def test_db_connection() -> bool:
    with Session() as session:
        try:
            session.exec(text("SELECT 1"))
            return True
        except Exception as e:
            logger.error(e)
            return False
