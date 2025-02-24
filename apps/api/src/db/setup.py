import logging
import os
from contextlib import contextmanager

from sqlalchemy import URL
from sqlmodel import Session as SQLModelSession
from sqlmodel import SQLModel, create_engine

# Don't need to import models because alembic will populate metadata
# from .models import *  # noqa

db_password = os.getenv("POSTGRES_DB_PASSWORD")
db_host = os.getenv("POSTGRES_DB_HOST")
is_test = os.getenv("ENV") == "test"
if not is_test and (db_password and db_host):
    SQLALCHEMY_DATABASE_URL = URL.create(
        drivername="postgresql+psycopg2",
        username="postgres",
        password=db_password,
        host=db_host,
        database="postgres",
    )
    connect_args = {}
else:
    SQLALCHEMY_DATABASE_URL = URL.create(drivername="sqlite", database="./test.db")

    connect_args = {"check_same_thread": False}

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)


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
    if SQLALCHEMY_DATABASE_URL.drivername == "sqlite":
        with Session() as session:
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
