from datetime import datetime
from typing import Any, Mapping, Optional, cast
from uuid import UUID, uuid4

from sqlalchemy import JSON, DateTime, func
from sqlmodel import Field, Relationship, SQLModel


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


class WalletBase(Base):
    public_key: str = Field(
        description="Public key",
        nullable=False,
    )
    chain: str = Field(
        description="Chain the wallet is on",
        nullable=False,
        index=True,
        default="EVM",
    )
    chain_id: int = Field(
        description="Chain ID",
        nullable=True,
        default=None,
    )
    owner_id: UUID = Field(
        foreign_key="user.id",
        description="UUID of the User who owns the wallet.",
        nullable=False,
    )


class WalletUpdate(Base):
    # what does it even mean to update a wallet? public_key, chain_id, and chain are all immutable afaik
    owner_id: UUID | None


class UserBase(Base):
    dynamic_id: UUID = Field(
        description="Dynamic generated UUID for the user.",
        nullable=False,
        index=True,
        unique=True,
    )
    email: str | None = Field(
        description="Email of the user.", nullable=True, default=None
    )
    phone_number: str | None = Field(
        description="Phone number of the user.", nullable=True, default=None
    )
    username: str | None = Field(
        description="Username of the user.", nullable=True, default=None
    )


class UserUpdate(Base):
    # Not allowed to change dynamic_id.
    email: str | None = Field(
        description="Email of the user.", nullable=True, default=None
    )
    phone_number: str | None = Field(
        description="Phone number of the user.", nullable=True, default=None
    )
    username: str | None = Field(
        description="Username of the user.", nullable=True, default=None
    )


class AgentBase(Base):
    # TODO: Update to UUID type
    eliza_agent_id: str | None = Field(
        description="Eliza's agent id", nullable=True, default=None
    )
    owner_id: UUID = Field(
        foreign_key="user.id",
        description="UUID of the User who owns the agent.",
        nullable=False,
    )
    runtime_id: UUID | None = Field(
        foreign_key="runtime.id",
        description="UUID of the runtime the agent uses.",
        nullable=True,
        default=None,
    )
    token_id: UUID | None = Field(
        foreign_key="token.id",
        description="UUID of the token the agent uses.",
        nullable=True,
        default=None,
    )
    # 🤮
    character_json: dict = Field(
        description="Eliza character json", nullable=False, sa_type=JSON
    )
    env_file: str = Field(description=".env for the agent", nullable=False)


class AgentUpdate(Base):
    # TODO: Update to UUID type
    eliza_agent_id: str | None = Field(
        description="Agent id of the eliza agent (different from Agent.id)",
        nullable=True,
        default=None,
    )
    owner_id: UUID | None = Field(
        description="UUID of the User who owns the agent.", nullable=True, default=None
    )
    runtime_id: UUID | None = Field(
        description="UUID of the runtime the agent uses.", nullable=True, default=None
    )
    token_id: UUID | None = Field(
        description="UUID of the token associated with the agent.",
        nullable=True,
        default=None,
    )
    character_json: dict | None = Field(
        description="Eliza character json. Json or dict.", nullable=True, default=None
    )
    env_file: str | None = Field(
        description=".env for the agent", nullable=True, default=None
    )


class TokenBase(Base):
    ticker: str = Field(description="Token ticker")
    name: str = Field(description="Token name")
    evm_contract_address: str = Field(description="EVM contract address")
    abi: list[dict] = Field(description="EVM contract ABI", sa_type=JSON)


class RuntimeBase(Base):
    url: str = Field(description="URL of the agents runtime.")
    service_no: int = Field(
        description="The service number of the runtime.", nullable=False
    )
    last_healthcheck: datetime | None = Field(
        description="Datetime of last healthcheck", nullable=True, default=None
    )
    failed_healthchecks: int = Field(
        description="Number of failed healthchecks.", nullable=False, default=0
    )
    service_arn: str | None = Field(
        description="ARN of the service that runs the runtime.",
        nullable=True,
        default=None,
    )
    target_group_arn: str | None = Field(
        description="ARN of the target group.", nullable=True, default=None
    )
    http_listener_rule_arn: str | None = Field(
        description="ARN of the HTTP listener rule.", nullable=True, default=None
    )
    https_listener_rule_arn: str | None = Field(
        description="ARN of the HTTPS listener rule.", nullable=True, default=None
    )


class RuntimeUpdate(Base):
    url: str | None = Field(
        description="URL of the agents runtime.", nullable=True, default=None
    )
    last_healthcheck: datetime | None = Field(
        description="Last healthcheck time.", nullable=True, default=None
    )
    # Note, default = 0 won't be used in crud.update_generic becuase of the exclude_unset=True
    failed_healthchecks: int = Field(
        description="Number of failed healthchecks.", nullable=False, default=0
    )
    started: bool | None = Field(
        description="If the runtime has started. Proxies for a heartbeat.",
        nullable=True,
        default=None,
    )
    service_arn: str | None = Field(
        description="ARN of the service that runs the runtime.",
        nullable=True,
        default=None,
    )
    target_group_arn: str | None = Field(
        description="ARN of the target group pointing to the service.",
        nullable=True,
        default=None,
    )
    http_listener_rule_arn: str | None = Field(
        description="ARN of the HTTP listener rule.",
        nullable=True,
        default=None,
    )
    https_listener_rule_arn: str | None = Field(
        description="ARN of the HTTPS listener rule.",
        nullable=True,
        default=None,
    )


class AgentStartTaskBase(Base):
    agent_id: UUID
    runtime_id: UUID
    celery_task_id: UUID


class RuntimeCreateTaskBase(Base):
    runtime_id: UUID
    celery_task_id: UUID


class RuntimeUpdateTaskBase(Base):
    runtime_id: UUID
    celery_task_id: UUID


class RuntimeDeleteTaskBase(Base):
    runtime_id: UUID
    celery_task_id: UUID


# endregion
# region Tables


class User(UserBase, MetadataMixin, table=True):
    agents: list["Agent"] = Relationship(back_populates="owner")
    wallets: list["Wallet"] = Relationship(back_populates="owner")


class Wallet(WalletBase, MetadataMixin, table=True):
    owner: User = Relationship(back_populates="wallets")


class Agent(AgentBase, MetadataMixin, table=True):
    owner: User = Relationship(back_populates="agents")
    token: "Token" = Relationship(back_populates="agent")
    runtime: Optional["Runtime"] = Relationship(back_populates="agent")


class Token(TokenBase, MetadataMixin, table=True):
    agent: Optional["Agent"] = Relationship(back_populates="token")


class Runtime(RuntimeBase, MetadataMixin, table=True):
    agent: Optional["Agent"] = Relationship(back_populates="runtime")


# TODO: Add relationships.
class AgentStartTask(AgentStartTaskBase, MetadataMixin, table=True):
    pass


class RuntimeCreateTask(RuntimeCreateTaskBase, MetadataMixin, table=True):
    pass


class RuntimeUpdateTask(RuntimeUpdateTaskBase, MetadataMixin, table=True):
    pass


class RuntimeDeleteTask(RuntimeDeleteTaskBase, MetadataMixin, table=True):
    pass
