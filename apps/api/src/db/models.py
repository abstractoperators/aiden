from datetime import datetime
from typing import Any, Mapping, cast
from uuid import UUID, uuid4

from sqlalchemy import DateTime, func
from sqlmodel import Field, Relationship, SQLModel

from .setup import Session


# region Models
class Base(SQLModel):
    def __repr__(self) -> str:
        return self.model_dump_json(indent=4, exclude_unset=True, exclude_none=True)


class MetadataMixin(SQLModel):
    id: UUID = Field(primary_key=True, default_factory=uuid4)
    created_at: datetime | None = Field(
        default=None,
        sa_type=cast(Any, DateTime(timezone=True)),
        sa_column_kwargs=cast(Mapping[str, Any], {"server_default": func.now()}),
        nullable=False,
    )
    modified_at: datetime | None = Field(
        default=None,
        sa_type=cast(Any, DateTime(timezone=True)),
        sa_column_kwargs=cast(
            Mapping[str, Any], {"onupdate": func.now(), "server_default": func.now()}
        ),
    )


class UserBase(Base):
    public_key: str = Field(unique=True, description="Ethereum public key")
    public_key_sei: str = Field(unique=True, description="SEI public key")
    email: str | None = Field(description="Email of the user.", nullable=True)
    phone_number: str | None = Field(
        description="Phone number of the user.", nullable=True
    )


class AgentBase(Base):
    runtime_url: str | None = Field(
        description="URL of the agents runtime. Potentially none", nullable=True
    )
    agent_id: str = Field(description="Eliza's agent id", nullable=False)
    owner_id: UUID = Field(
        foreign_key="user.id",
        description="UUID of the User who owns the agent.",
        nullable=False,
    )


class TokenBase(Base):
    ticker: str = Field(description="Token ticker")
    name: str = Field(description="Token name")
    evm_contract_address: str = Field(description="EVM contract address")
    evm_contract_abi: str = Field(description="EVM contract ABI")


class RuntimeBase(Base):
    url: str = Field(description="URL of the agents runtime.")


# endregion Models


# region Tables
class User(UserBase, MetadataMixin, table=True):
    agents: list["Agent"] = Relationship(back_populates="owner")


class Agent(AgentBase, MetadataMixin, table=True):
    owner: User = Relationship(back_populates="agents")
    token: "Token" = Relationship(back_populates="agent")
    runtime: "Runtime" = Relationship(back_populates="agent")


class Token(TokenBase, MetadataMixin, table=True):
    agent: "Agent" = Relationship(back_populates="token")


class Runtime(RuntimeBase, MetadataMixin, table=True):
    agent: "Agent" = Relationship(back_populates="runtime")


with Session() as session:
    SQLModel.metadata.drop_all(session.get_bind())
    SQLModel.metadata.create_all(session.get_bind())
