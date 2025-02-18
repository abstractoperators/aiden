import os
from contextlib import contextmanager
from datetime import datetime
from typing import Any, Mapping, cast
from uuid import UUID, uuid4

import psycopg2.pool
from psycopg2.extensions import cursor as Tcursor
from sqlalchemy import URL, DateTime, func
from sqlmodel import Field
from sqlmodel import Session as SQLModelSession
from sqlmodel import SQLModel, create_engine

# TODO: ORM

db_password = os.getenv("POSTGRES_DB_PASSWORD")
db_host = os.getenv("POSTGRES_DB_HOST")
if db_password and db_host:
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
