from io import StringIO
from typing import Any
from uuid import UUID

from dotenv import dotenv_values
from pydantic import BaseModel, ConfigDict, Field, SecretStr, TypeAdapter

from .db.models import (
    Agent,
    AgentBase,
    RuntimeBase,
    TokenBase,
    User,
    UserBase,
    WalletBase,
)


# TODO: Look at Eliza's character loading to figure out the actual schema for character_json lowk high prio
class Character(BaseModel):
    character_json: dict = Field(
        {},
        description="A dictionary representing the character json for the eliza agent",
    )
    envs: str = Field(
        "",
        description="A string representing an env file containing environment variables for the eliza agent",
    )


class TokenCreationRequest(BaseModel):
    name: str = Field(description="Name of the token")
    ticker: str = Field(description="Ticker of the token")


class ChatRequest(BaseModel):
    roomId: str | None = None
    user: str | None = None
    text: str


class ElizaContent(BaseModel):
    text: str | None = Field(description="Text content of the message")
    # TODO: Include these additional fields foudn in client-direct/dist/index.js/createApiRouter.
    # action
    # source


class ElizaMessage(BaseModel):
    user: str = Field(
        description=r"User or agent. Potentially a placeholder like {{user1}}"
    )
    content: ElizaContent = Field(
        description="Content of the message, including text and potentially other fields"
    )


class ElizaCharacterJson(BaseModel):
    model_config = ConfigDict(extra="allow")
    name: str
    clients: list[str]
    modelProvider: str  # TODO enum
    settings: dict[str, Any]
    plugins: list[str]
    bio: list[str]
    lore: list[str]
    knowledge: list[str]
    # messageExamples: list[list[dict[ # TODO
    postExamples: list[str]
    topics: list[str]
    style: dict[str, Any]
    adjectives: list[str]


# Mirror of Agent model in db.models, but with base model for runtime and token instead of their table types.
# https://sqlmodel.tiangolo.com/tutorial/fastapi/relationships/#update-the-path-operations
class Env(BaseModel):
    key: str
    value: SecretStr | None


class AgentPublic(AgentBase):
    id: UUID
    token: TokenBase | None = None
    runtime: RuntimeBase | None = None
    env_file: list[Env] = []  # type: ignore


class UserPublic(UserBase):
    id: UUID
    wallets: list[WalletBase] = []


class AWSConfig(BaseModel):
    vpc_id: str
    target_group_name: str
    http_listener_arn: str
    https_listener_arn: str
    service_name: str
    host: str
    subdomain: str
    cluster: str
    task_definition_arn: str
    subnets: list[str]
    security_groups: list[str]


def user_to_user_public(user: User) -> UserPublic:
    return TypeAdapter(UserPublic).validate_python(user)


def agent_to_agent_public(agent: Agent) -> AgentPublic:
    """
    Converts an Agent to an AgentPublic.
    """
    old_env_file: str = agent.env_file
    env_dict: dict = dotenv_values(stream=StringIO(old_env_file))
    list_of_envs: list[Env] = [
        Env(key=key, value=value) for key, value in env_dict.items()
    ]

    agent_dump = agent.model_dump()
    agent_dump["env_file"] = list_of_envs
    agent_public = AgentPublic(**agent_dump)
    agent_public.runtime = agent.runtime
    agent_public.token = agent.token

    return agent_public
