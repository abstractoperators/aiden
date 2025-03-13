import os
from time import sleep

import requests
from celery import Celery
from celery.utils.log import get_task_logger

from src.db import crud
from src.db.models import AgentUpdate
from src.db.setup import SQLALCHEMY_DATABASE_URL, Session

logger = get_task_logger(__name__)
db_password = os.getenv("POSTGRES_DB_PASSWORD")
if not db_password:
    raise ValueError("POSTGRES_DB_PASSWORD is not set")
BACKEND_DB_URL = str(SQLALCHEMY_DATABASE_URL).replace("***", db_password)
app = Celery(
    "tasks",
    broker="redis://localhost",
    backend=f"db+{BACKEND_DB_URL}",
)
app.config_from_object("src.celeryconfig")


@app.task
def add(x, y):
    return x + y


@app.task
def start_agent(agent_id, runtime_id) -> None:
    with Session() as session:
        # 1. Stop the old agent (if it exists)
        runtime = crud.get_runtime(session, runtime_id)
        agent = crud.get_agent(session, agent_id)

        old_agent = runtime.agent
        stop_endpoint = f"{runtime.url}/controller/character/stop"
        resp = requests.post(stop_endpoint)
        resp.raise_for_status()
        if old_agent:
            crud.update_agent(
                session,
                old_agent,
                AgentUpdate(runtime_id=None),
            )

        # 2. Start the new agent
        start_endpoint = f"{runtime.url}/controller/character/start"
        character_json: dict = agent.character_json
        env_file: str = agent.env_file
        resp = requests.post(
            start_endpoint,
            json={
                "character_json": character_json,
                "envs": env_file,
            },
        )
        resp.raise_for_status()

    # Poll the runtime until the agent is running
    for i in range(60):
        resp = requests.get(f"{runtime.url}/controller/character/status")
        logger.info(f"{i}/{60}: Polling for agent to start")
        if resp.status_code == 200 and resp.json()["running"]:
            eliza_agent_id = resp.json()["agent_id"]
            with Session() as session:
                crud.update_agent(
                    session,
                    agent,
                    AgentUpdate(runtime_id=runtime_id, eliza_agent_id=eliza_agent_id),
                )
            return
        sleep(10)

    # agent failed to start - mark the task as failed
    # TODO: Improve failed to start.
    raise Exception("Agent failed to start")


@app.task
def create_runtime() -> None:
    pass
