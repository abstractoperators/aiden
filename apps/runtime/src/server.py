import os
import signal
import subprocess

import fastapi
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = fastapi.FastAPI()
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
        "{}", description="Escaped character json for an eliza agent"
    )
    envs: str = Field(
        "",
        description="A string representing an env file containing environment variables for the eliza agent",
    )


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
    )

    return {"status": "started"}


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
    with open("../../eliza/characters/character.json", "w") as f:
        f.write(character.character_json)

    with open("../../eliza/.env", "w") as f:
        f.write(character.envs)


app.include_router(router, prefix="/api")
