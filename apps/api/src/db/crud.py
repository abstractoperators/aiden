from collections.abc import Sequence
from typing import TypeVar

from psycopg2.extensions import cursor as Tcursor
from sqlmodel import Session, select

from .models import Agent, Base, Runtime, User, UserBase

M = TypeVar("M", bound=Base)


def create_generic(session: Session, model: M):
    session.add(model)
    session.commit()
    session.refresh()
    return model


def get_agents(session: Session, skip: int = 0, limit: int = 100) -> Sequence[Agent]:
    """
    Returns a list of Agents.
    """
    stmt = select(Agent).offset(skip).limit(limit)
    return session.scalars(stmt).all()


def create_runtime(session: Session, url: str):
    runtime: Runtime = create_generic(session, Runtime(url=url))


def create_user(
    session: Session,
    public_key: str,
    public_key_sei: str,
    email: str = None,
    phone_number: str = None,
) -> User:
    user: User = create_generic(
        session,
        User(
            UserBase(
                public_key=public_key,
                public_key_sei=public_key_sei,
                email=email,
                phone_number=phone_number,
            ).model_dump(),
        ),
    )
    return user


def create_agent(
    session: Session,
    agent_id: str,
    owner_id: str,
    runtime_id: str | None = None,
) -> Agent:
    agent: Agent = create_generic(
        session,
        Agent(
            agent_id=agent_id,
            owner_id=owner_id,
            runtime_id=runtime_id,
        ),
    )
    return agent


def get_unique_accounts(cursor: Tcursor):
    """
    Returns a list of unique accounts ~ agents.
    """
    cursor.execute("SELECT id, name from accounts")
    accounts = cursor.fetchall()
    return accounts


def create_runtime(cursor: Tcursor, url: str, agent_id: str = ""):
    """
    Create a new runtime entry.
    """
    cursor.execute(
        "INSERT INTO RUNTIMES (url, agent_id) VALUES (%s, %s)", (url, agent_id)
    )


def get_runtimes(cursor: Tcursor):
    """
    Returns a list of all runtimes
    """
    cursor.execute("SELECT * from RUNTIMES")
    runtimes = cursor.fetchall()
    return runtimes


def get_runtime_for_agent(cursor: Tcursor, agent_id: str) -> str:
    cursor.execute("SELECT * from RUNTIMES WHERE agent_id = %s", (agent_id,))
    runtime = cursor.fetchone()
    return runtime[0] if runtime else ""


def update_runtime(cursor: Tcursor, url: str, agent_id: str = ""):
    """
    Updates the agent_id for a runtime.
    """
    cursor.execute("UPDATE RUNTIMES SET agent_id = %s WHERE url = %s", (agent_id, url))
