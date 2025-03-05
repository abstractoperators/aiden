import json
import os
import signal
import subprocess
import time
from contextlib import asynccontextmanager

import fastapi
import requests
from dotenv import dotenv_values, load_dotenv
from fastapi.exceptions import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, SecretStr


@asynccontextmanager
async def lifespan(app: fastapi.FastAPI):
    load_dotenv()
    yield
    print(stop_character())


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


class Env(BaseModel):
    key: str
    value: SecretStr | None


class Character(BaseModel):
    character_json: dict = Field({}, description="Character json for an eliza agent")
    envs: str = Field(
        "",
        description="A string representing an env file containing environment variables for the eliza agent",
    )


class CharacterPublic(BaseModel):
    character_json: dict = Field({}, description="Character json for an eliza agent")
    envs: list[Env] = Field(
        [],
        description="A list of environment variables for the eliza agent with password redacted",
    )


class CharacterStatus(BaseModel):
    running: bool
    agent_id: str = ""
    msg: str = ""


@router.get("/character/status")
def get_character_status() -> CharacterStatus:
    """
    Checks if a character is running
    """
    global agent_runtime_subprocess

    if agent_runtime_subprocess and agent_runtime_subprocess.poll() is None:
        try:
            agents = requests.get("http://localhost:3000/agents").json().get("agents")
            agent_id = agents[0].get("id") if agents else ""
        except requests.exceptions.ConnectionError:
            return CharacterStatus(running=False)
        return CharacterStatus(running=True, agent_id=agent_id)
    else:
        return CharacterStatus(running=False)


@router.post("/character/start")
def start_character(character: Character) -> CharacterStatus:
    """
    Attempts to start a character and returns its status after a wait.
    """
    # TODO: Respond immediately, and add figure out another way for the caller to know when the character is ready
    global agent_runtime_subprocess
    write_character(character)

    if get_character_status().running:
        raise HTTPException(
            status_code=400,
            detail="There is already a character running. Please stop it first.",
        )

    env = os.environ.copy()

    print(env)
    # Start eliza server
    agent_runtime_subprocess = subprocess.Popen(
        [
            "pnpm",
            "cleanstart:debug",
            "--characters=app/characters/character.json",
        ],
        cwd="../../eliza",
        preexec_fn=os.setsid,  # start the process in a new session (from chatgpt)
        stderr=subprocess.PIPE,
        env=env,
    )

    # Poll server for a while until it starts
    for _ in range(10):
        character_status: CharacterStatus = get_character_status()
        if character_status.running:
            return character_status
        time.sleep(10)

    # Failed to start the character (in time)
    return CharacterStatus(
        running=False,
        msg=(
            "Failed to start the agent runtime"
            + "\n"
            + str(
                agent_runtime_subprocess.stderr.read()
                if agent_runtime_subprocess.stderr is not None
                else ""
            )
        ),
    )


@router.get("/character/read")
def read_character() -> CharacterPublic:
    """
    Returns the configuration for the current character
    """
    with open("../../eliza/characters/character.json", "r") as f:
        character_json_str: str = f.read()
        character_json_dict: dict = json.loads(character_json_str)

    env_full_path = os.path.abspath("../../eliza/.env")
    env_values = dotenv_values(env_full_path)
    envs = [
        Env(key=k, value=SecretStr(v)) if v else Env(key=k, value=None)
        for k, v in env_values.items()
    ]

    return CharacterPublic(character_json=character_json_dict, envs=envs)


@router.post("/character/stop")
def stop_character():
    """
    Attempts to stop the currently running character
    """
    print("Stopping character")
    global agent_runtime_subprocess
    if agent_runtime_subprocess and agent_runtime_subprocess.poll() is None:
        os.killpg(os.getpgid(agent_runtime_subprocess.pid), signal.SIGINT)
        agent_runtime_subprocess.wait()
        return {"status": "stopped"}
    else:
        return {"status": "not running"}


def write_character(character: Character) -> None:
    """
    Writes the character json and envs to the eliza directory so that the character can be started.
    """

    with open("../../eliza/characters/character.json", "w") as f:
        f.write(json.dumps(character.character_json))

    # Don't need to write braintrust config into env file.
    # process.env respects gloabl env variables, which are set already in task definition.

    with open("../../eliza/.env", "w") as f:
        f.write(character.envs)

    return None


app.include_router(router, prefix="/controller")
