from collections.abc import Sequence
from typing import TypeVar

from sqlmodel import Session, select

from .models import (
    Agent,
    AgentBase,
    AgentUpdate,
    Base,
    Runtime,
    RuntimeBase,
    RuntimeUpdate,
    Token,
    TokenBase,
    User,
    UserBase,
    UserUpdate,
)

M = TypeVar("M", bound=Base)
N = TypeVar("N", bound=Base)


# region Generics
def create_generic(session: Session, model: M) -> M:
    session.add(model)
    session.commit()
    session.refresh(model)
    return model


def update_generic(session: Session, model: M, model_update: N) -> M:
    fields_payload = model_update.model_dump(exclude_none=True)
    for value in fields_payload:
        setattr(model, value, fields_payload[value])
    session.commit()
    session.refresh(model)

    return model


def delete_generic(session: Session, model: M) -> None:
    session.delete(model)
    session.commit()
    return None


# endregion Generics


# region Users
def create_user(session: Session, user: UserBase) -> User:
    return create_generic(session, User(**user.model_dump()))


def update_user(session: Session, user: User, user_update: UserUpdate) -> User:
    return update_generic(session, user, user_update)


def delete_user(session: Session, user: User) -> None:
    return delete_generic(session, user)


def get_user(session: Session, user_id: str) -> User | None:
    stmt = select(User).where(User.id == user_id)
    return session.exec(stmt).first()


def get_user_by_public_key(session: Session, public_key: str) -> User | None:
    stmt = select(User).where(User.public_key == public_key)
    return session.exec(stmt).first()


def get_users(session: Session, skip: int = 0, limit: int = 100) -> Sequence[User]:
    stmt = select(User).offset(skip).limit(limit)
    return session.scalars(stmt).all()


# endregion Users
# region Agents
def create_agent(session: Session, agent: AgentBase) -> Agent:
    return create_generic(session, Agent(**agent.model_dump()))


def update_agent(session, agent: Agent, agent_update: AgentUpdate) -> Agent:
    return update_generic(session, agent, agent_update)


def get_agents(session: Session, skip: int = 0, limit: int = 100) -> Sequence[Agent]:
    stmt = select(Agent).offset(skip).limit(limit)
    return session.scalars(stmt).all()


def get_agent(session: Session, agent_id: str) -> Agent | None:
    stmt = select(Agent).where(Agent.id == agent_id)
    return session.exec(stmt).first()


# endregion Agents
# region Runtimes


def create_runtime(session: Session, runtime: RuntimeBase) -> Runtime:
    return create_generic(session, Runtime(**runtime.model_dump()))


def get_runtime(session: Session, runtime_id: str) -> Runtime | None:
    stmt = select(Runtime).where(Runtime.id == runtime_id)
    return session.exec(stmt).first()


def get_runtimes(
    session: Session, skip: int = 0, limit: int = 100
) -> Sequence[Runtime]:
    stmt = select(Runtime).offset(skip).limit(limit)
    return session.scalars(stmt).all()


def update_runtime(
    session: Session, runtime: Runtime, runtime_update: RuntimeUpdate
) -> Runtime:
    return update_generic(session, runtime, runtime_update)


# endregion Runtimes
# region Tokens
def create_token(session: Session, token: TokenBase) -> Token:
    return create_generic(session, Token(**token.model_dump()))


def get_tokens(session: Session, skip: int = 0, limit: int = 100) -> Sequence[Token]:
    stmt = select(Token).offset(skip).limit(limit)
    return session.scalars(stmt).all()


def get_token(session: Session, token_id: str) -> Token | None:
    stmt = select(Token).where(Token.id == token_id)
    return session.exec(stmt).first()


def get_token_by_address(session: Session, token_address: str) -> Token | None:
    stmt = select(Token).where(Token.evm_contract_address == token_address)
    return session.exec(stmt).first()


# endregion Tokens
