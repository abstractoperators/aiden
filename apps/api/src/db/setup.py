import os
from contextlib import contextmanager

from sqlalchemy import URL
from sqlmodel import Session as SQLModelSession
from sqlmodel import SQLModel, create_engine

from .models import *  # noqa

# TODO: ORM

db_password = os.getenv("POSTGRES_DB_PASSWORD")
db_host = os.getenv("POSTGRES_DB_HOST")
is_test = os.getenv("ENV") == "test"
if db_password and db_host and not is_test:
    SQLALCHEMY_DATABASE_URL = URL.create(
        drivername="postgresql+psycopg2",
        username="postgres",
        password=db_password,
        host=db_host,
        database="postgres",
    )
    connect_args = {}
else:
    SQLALCHEMY_DATABASE_URL = URL.create(
        drivername="sqlite",
        username="",
        password="",
        host="",
        database="test.db",
    )

    connect_args = {"check_same_thread": False}
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)


@contextmanager
def Session():
    session = SQLModelSession(engine)
    try:
        yield session
    finally:
        session.close()


with Session() as session:
    SQLModel.metadata.drop_all(session.get_bind())
    SQLModel.metadata.create_all(session.get_bind())
