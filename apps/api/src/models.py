from pydantic import BaseModel, Field


class Character(
    BaseModel
):  # TODO: Look at Eliza's character loading to figure out the actual schema for character_json lowk high prio
    character_json: str = Field(
        "{}",
        description="Escaped character json for an eliza agent",
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
