from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class Character(
    BaseModel
):  # TODO: Look at Eliza's character loading to figure out the actual schema for character_json lowk high prio
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
