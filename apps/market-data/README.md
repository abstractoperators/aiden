The market data API is built using FastAPI, SQLModel, alembic, and psycopg. It uses [uv](https://docs.astral.sh/uv/) as its package and project manager.

The market data API requires PostgreSQL, i.e. it cannot use another SQL database unless it supports the `DATE_TRUNC` function.
For development, run `make run-market-data-db` before `make run-market-data` or `make run-market-data-nodocker`.
The required environment variables are `POSTGRES_PASSWORD` and `POSTGRES_HOST`. If not provided, `POSTGRES_USER`, `POSTGRES_PORT`, and `POSTGRES_DATABASE` default to the Postgres defaults.