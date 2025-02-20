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
    Token,
    TokenBase,
    User,
    UserBase,
    UserUpdate,
)

M = TypeVar("M", bound=Base)
N = TypeVar("N", bound=Base)


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


def create_user(session: Session, user: UserBase) -> User:
    return create_generic(session, User(**user.model_dump()))


def update_user(session: Session, user: User, user_update: UserUpdate) -> User:
    return update_generic(session, user, user_update)


def delete_user(session: Session, user: User) -> User:
    return delete_generic(session, user)


def create_runtime(session: Session, runtime: RuntimeBase) -> Runtime:
    return create_generic(session, Runtime(**runtime.model_dump()))


def create_agent(session: Session, agent: AgentBase) -> Agent:
    return create_generic(session, Agent(**agent.model_dump()))


def create_token(session: Session, token: TokenBase) -> Token:
    return create_generic(session, Token(**token.model_dump()))


def update_agent(session, agent: Agent, agent_update: AgentUpdate) -> Agent:
    return update_generic(session, agent, agent_update)


def get_agents(session: Session, skip: int = 0, limit: int = 0) -> Sequence[Agent]:
    stmt = select(Agent).offset(skip).limit(limit)
    return session.scalars(stmt).all()


def get_agent(session: Session, agent_id: str) -> Agent | None:
    stmt = select(Agent).where(Agent.id == agent_id)
    return session.exec(stmt).first()


def get_user(session: Session, public_key: str) -> User | None:
    stmt = select(User).where(User.public_key == public_key)
    return session.exec(stmt).first()


def get_runtime(session: Session, runtime_id: str) -> Runtime | None:
    stmt = select(Runtime).where(Runtime.id == runtime_id)
    return session.exec(stmt).first()


def get_runtimes(session: Session, skip: int = 0, limit: int = 0) -> Sequence[Runtime]:
    stmt = select(Runtime).offset(skip).limit(limit)
    return session.scalars(stmt).all()
