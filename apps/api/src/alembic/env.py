import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool
from sqlalchemy.engine.url import URL
from sqlmodel import SQLModel

pass
from db.models import *  # noqa

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
target_metadata = SQLModel.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.

db_password = os.getenv("POSTGRES_DB_PASSWORD")
db_host = os.getenv("POSTGRES_DB_HOST")
is_test = os.getenv("ENV") == "test"
print("is_test", is_test)
print("db_password", db_password)

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
    SQLALCHEMY_DATABASE_URL = "sqlite:///test.db"

    connect_args = {"check_same_thread": False}

print("Alembic SQLALCHEMY_DATABASE_URL", SQLALCHEMY_DATABASE_URL)
config.set_main_option(
    "sqlalchemy.url", str(SQLALCHEMY_DATABASE_URL).replace("***", db_password)
)


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
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
