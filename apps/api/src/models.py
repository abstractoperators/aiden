from pydantic import BaseModel, Field


class Character(BaseModel):
    character_json: str = Field(
        "{}",
        description="Escaped character json for an eliza agent",
    )
    envs: str = Field(
        "",
        description="A string representing an env file containing environment variables for the eliza agent",
    )


class ChatRequest(BaseModel):
    roomId: str | None = None
    user: str | None = None
    text: str
