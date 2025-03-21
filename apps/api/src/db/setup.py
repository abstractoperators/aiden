import logging
import os
from contextlib import contextmanager

from sqlalchemy import URL
from sqlmodel import Session as SQLModelSession
from sqlmodel import SQLModel, create_engine

from src import logger

db_password = os.getenv("POSTGRES_DB_PASSWORD")
db_host = os.getenv("POSTGRES_DB_HOST")
env = os.getenv("ENV")
if (db_password and db_host) and (env == "staging" or env == "prod"):
    SQLALCHEMY_DATABASE_URL = URL.create(
        drivername="postgresql+psycopg2",
        username="postgres",
        password=db_password,
        host=db_host,
        database="postgres",
    )
    connect_args = {}
elif env == "dev":
    SQLALCHEMY_DATABASE_URL = URL.create(drivername="sqlite", database="./dev.db")
    connect_args = {"check_same_thread": False}
elif env == "test":
    SQLALCHEMY_DATABASE_URL = URL.create(drivername="sqlite", database="./test.db")
    connect_args = {"check_same_thread": False}
else:
    raise ValueError("Unknown environment for db. See db/setup.py")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args,
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
    Initializes database tables
    If sqlite, then it drops and creates tables
    If postgres, then it runs alembic migrations
    """
    logger.info("Initializing database")
    if SQLALCHEMY_DATABASE_URL.drivername == "sqlite":
        with Session() as session:
            logger.info(f"Dropping and creating tables for sqlite. {SQLModel.metadata}")
            SQLModel.metadata.drop_all(session.get_bind())
            SQLModel.metadata.create_all(session.get_bind())
    else:
        from alembic import command
        from alembic.config import Config

        dir_path = os.path.dirname(os.path.realpath(__file__))
        alembic_cfg = Config(os.path.join(dir_path, "../../alembic.ini"))
        command.upgrade(alembic_cfg, "head")

        logging.getLogger().setLevel(logging.INFO)
        logging.getLogger("alembic").propagate = True
