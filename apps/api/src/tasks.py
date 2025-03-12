from time import sleep

import requests
from celery import Celery

from src.db import crud
from src.db.models import AgentUpdate

# from src.celeryconfig import CELERY_CONFIG
from src.db.setup import SQLALCHEMY_DATABASE_URL, Session

print(SQLALCHEMY_DATABASE_URL)
app = Celery(
    "tasks",
    broker="redis://localhost",
    backend=f"db+{SQLALCHEMY_DATABASE_URL}",
)
app.config_from_object("src.celeryconfig")


@app.task
def add(x, y):
    return x + y


@app.task
# def start_agent(agent_id: UUID, runtime_id: UUID) -> None:
def start_agent(agent_id, runtime_id) -> None:
    return None
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
        resp = requests.post(start_endpoint)
        resp.raise_for_status()

    # Poll the runtime until the agent is running
    for i in range(60):
        resp = requests.get(f"{runtime.url}/controller/character/status")
        if resp.status_code == 200 and resp.json()["status"] == "running":
            eliza_agent_id = resp.json()["eliza_agent_id"]
            with Session() as session:
                crud.update_agent(
                    session,
                    agent,
                    AgentUpdate(runtime_id=runtime_id, eliza_agent_id=eliza_agent_id),
                )
            return
        sleep(10)

    # agent failed to start - mark the task as failed
    # TODO: Improve
    raise Exception("Agent failed to start")
    return None
