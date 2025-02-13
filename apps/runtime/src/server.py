import os
import signal
import subprocess
import time
from contextlib import asynccontextmanager

import fastapi
import requests
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


@asynccontextmanager
async def lifespan(app: fastapi.FastAPI):
    yield
    stop_character()


app = fastapi.FastAPI(lifespan=lifespan)
router = fastapi.APIRouter()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


agent_runtime_subprocess = None


class Character(BaseModel):
    character_json: str = Field(
        "{}",
        description="Escaped character json for an eliza agent",
    )
    envs: str = Field(
        "",
        description="A string representing an env file containing environment variables for the eliza agent",
    )


@router.get("/character/is-running")
def is_character_running():
    global agent_runtime_subprocess
    if (
        agent_runtime_subprocess
        and agent_runtime_subprocess.poll() is None
        and requests.get("http://localhost:3000/", timeout=3).status_code == 200
    ):
        return {"status": "running"}
    else:
        return {"status": "not running"}


@router.post("/character/start")
def start_character(character: Character):
    global agent_runtime_subprocess
    subprocess.Popen(["pwd"], cwd="../..")
    write_character(character)

    # Start eliza server
    agent_runtime_subprocess = subprocess.Popen(
        [
            "pnpm",
            "start",
            "--characters=app/characters/character.json",
        ],
        cwd="../../eliza",
        preexec_fn=os.setsid,  # start the process in a new session (from chatgpt)
        stderr=subprocess.PIPE,
    )
    # Assume that the server will always run on port 3000
    # Wait until the server is up, and we can query localhost:3000/agents, or errors out
    agent_id = None
    for attempt in range(6):
        if is_character_running().get("status") == "running":
            agents = requests.get("http://localhost:3000/agents").json().get("agents")
            agent_id = agents[0].get("id") if agents else None
            break
        time.sleep(10)

    if agent_id:
        return {"status": "started", "agent_id": agent_id}
    return {
        "status": "error",
        "message": (
            "Failed to start the agent runtime"
            + "\n"
            + str(agent_runtime_subprocess.stderr.read())
            if agent_runtime_subprocess.stderr
            else ""
        ),
    }


@router.post("/character/stop")
def stop_character():
    global agent_runtime_subprocess
    if agent_runtime_subprocess and agent_runtime_subprocess.poll() is None:
        os.killpg(os.getpgid(agent_runtime_subprocess.pid), signal.SIGINT)
        agent_runtime_subprocess.wait()
        return {"status": "stopped"}
    else:
        return {"status": "not running"}


def write_character(character: Character):
    # TODO check if json and envs are valid
    with open("../../eliza/characters/character.json", "w") as f:
        f.write(character.character_json)

    with open("../../eliza/.env", "w") as f:
        f.write(character.envs)


app.include_router(router, prefix="/api")
