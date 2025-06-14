import logging
import os

from sqlalchemy import URL, engine_from_config
from sqlalchemy import pool
from sqlmodel import SQLModel

from alembic import context
import alembic_postgresql_enum

from src.db.models import *

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# This line sets up loggers basically.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()],
)

# Enable log propagation for Alembic
logging.getLogger("alembic").propagate = True

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
target_metadata = SQLModel.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.

username = os.getenv("POSTGRES_USER")
password = os.getenv("POSTGRES_PASSWORD")
host = os.getenv("POSTGRES_HOST")
port = os.getenv("POSTGRES_PORT")
database = os.getenv("POSTGRES_DATABASE") or username
is_test = os.getenv("ENV") == "test"

if not is_test and password and host:
    SQLALCHEMY_DATABASE_URL = URL.create(
        drivername="postgresql+psycopg",
        username=username or "postgres",
        password=password,
        host=host,
        port=int(port) if port else 5432,
        database=database or "postgres",
    )

    config.set_main_option(
        "sqlalchemy.url", str(SQLALCHEMY_DATABASE_URL).replace("***", password)
    )
elif not is_test:
    raise ValueError("Unknown environment for db. See db/setup.py")


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
