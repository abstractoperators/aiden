from collections.abc import Sequence
from typing import TypeVar
from uuid import UUID

from sqlalchemy.sql import text
from sqlmodel import Session, col, select

from .models import (
    Agent,
    AgentBase,
    AgentStartTask,
    AgentStartTaskBase,
    AgentUpdate,
    Base,
    Runtime,
    RuntimeBase,
    RuntimeCreateTask,
    RuntimeCreateTaskBase,
    RuntimeDeleteTask,
    RuntimeDeleteTaskBase,
    RuntimeUpdate,
    RuntimeUpdateTask,
    RuntimeUpdateTaskBase,
    Token,
    TokenBase,
    User,
    UserBase,
    UserUpdate,
    Wallet,
    WalletBase,
    WalletUpdate,
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
    fields_payload = model_update.model_dump(exclude_unset=True)
    model.sqlmodel_update(fields_payload)
    session.add(model)
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


def get_user(session: Session, user_id: UUID) -> User | None:
    stmt = select(User).where(User.id == user_id)
    return session.exec(stmt).first()


def get_user_by_dynamic_id(session: Session, dynamic_id: UUID) -> User | None:
    stmt = select(User).where(User.dynamic_id == dynamic_id)
    return session.exec(stmt).first()


def get_user_by_public_key(
    session: Session,
    public_key: str,
    chain: str = "EVM",
) -> User | None:
    wallet = get_wallet_by_public_key(session, public_key, chain)
    if wallet:
        return get_user(session, wallet.owner_id)
    return None


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


def get_agents_by_user_id(session: Session, user_id: UUID) -> Sequence[Agent]:
    stmt = select(Agent).where(Agent.owner_id == user_id)
    return session.scalars(stmt).all()


def get_agent(session: Session, agent_id: UUID) -> Agent | None:
    stmt = select(Agent).where(Agent.id == agent_id)
    return session.exec(stmt).first()


def delete_agent(session: Session, agent: Agent) -> None:
    return delete_generic(session, agent)


# endregion Agents
# region Wallets


def create_wallet(session: Session, wallet: WalletBase) -> Wallet:
    return create_generic(session, Wallet(**wallet.model_dump()))


def update_wallet(
    session: Session,
    wallet: Wallet,
    wallet_update: WalletUpdate,
) -> Wallet:
    return update_generic(session, wallet, wallet_update)


def get_wallet(session: Session, wallet_id: UUID) -> Wallet | None:
    stmt = select(Wallet).where(Wallet.id == wallet_id)
    return session.exec(stmt).first()


def get_wallets_by_owner(session: Session, owner_id: UUID) -> Sequence[Wallet]:
    stmt = select(Wallet).where(Wallet.owner_id == owner_id)
    return session.exec(stmt).all()


def get_wallet_by_public_key_hack(
    session: Session,
    public_key: str,
) -> Wallet | None:
    """
    TODO: Remove and replace with identification w/ address + chai9n
    """
    stmt = select(Wallet).where(Wallet.public_key == public_key)
    return session.exec(stmt).first()


def get_wallet_by_public_key(
    session: Session,
    public_key: str,
    chain: str = "EVM",
) -> Wallet | None:
    stmt = (
        select(Wallet)
        .where(Wallet.chain == chain)
        .where(Wallet.public_key == public_key)
    )
    return session.exec(stmt).first()


def delete_wallet(session: Session, wallet: Wallet) -> None:
    return delete_generic(session, wallet)


# endregion Wallets
# region Runtimes


def create_runtime(session: Session, runtime: RuntimeBase) -> Runtime:
    return create_generic(session, Runtime(**runtime.model_dump()))


def get_runtime(session: Session, runtime_id: UUID) -> Runtime | None:
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


def delete_runtime(session: Session, runtime: Runtime) -> None:
    return delete_generic(session, runtime)


# endregion Runtimes
# region Tokens
def create_token(session: Session, token: TokenBase) -> Token:
    return create_generic(session, Token(**token.model_dump()))


def get_tokens(session: Session, skip: int = 0, limit: int = 100) -> Sequence[Token]:
    stmt = select(Token).offset(skip).limit(limit)
    return session.scalars(stmt).all()


def get_token(session: Session, token_id: UUID) -> Token | None:
    stmt = select(Token).where(Token.id == token_id)
    return session.exec(stmt).first()


def get_token_by_address(session: Session, token_address: str) -> Token | None:
    stmt = select(Token).where(Token.evm_contract_address == token_address)
    return session.exec(stmt).first()


def delete_token(session: Session, token: Token) -> None:
    return delete_generic(session, token)


# endregion Tokens


# region Tasks
def get_task(session: Session, task_id: UUID) -> dict | None:
    query = text("""
        SELECT task_id, status FROM celery_taskmeta WHERE task_id = :task_id
        """).bindparams(task_id=str(task_id))
    with session.connection() as conn:
        result = conn.execute(query).mappings().first()

    return dict(result) if result else None


def create_agent_start_task(
    session: Session,
    agent_start_task: AgentStartTaskBase,
) -> AgentStartTask:
    return create_generic(session, AgentStartTask(**agent_start_task.model_dump()))


def get_agent_start_task(
    session: Session,
    agent_id: UUID | None = None,
    runtime_id: UUID | None = None,
) -> AgentStartTask | None:
    """
    Returns the most recent task where agent_id and/or runtime_id match.
    """
    if not agent_id and not runtime_id:
        raise ValueError("Must provide at least one of agent_id or runtime_id")

    stmt = select(AgentStartTask)
    if agent_id is not None:
        stmt = stmt.where(AgentStartTask.agent_id == agent_id)
    if runtime_id is not None:
        stmt = stmt.where(AgentStartTask.runtime_id == runtime_id)

    # col() required to fix type error
    # https://github.com/fastapi/sqlmodel/issues/279#issuecomment-1083188422
    if AgentStartTask.created_at:
        stmt = stmt.order_by(col(AgentStartTask.created_at).desc())

    return session.exec(stmt).first()


def create_runtime_create_task(
    session: Session,
    runtime_create_task: RuntimeCreateTaskBase,
) -> RuntimeCreateTask:
    return create_generic(
        session, RuntimeCreateTask(**runtime_create_task.model_dump())
    )


def create_runtime_update_task(
    session: Session,
    runtime_update_task: RuntimeUpdateTaskBase,
):
    return create_generic(
        session, RuntimeUpdateTask(**runtime_update_task.model_dump())
    )


def create_runtime_delete_task(
    session: Session,
    runtime_delete_task: RuntimeDeleteTaskBase,
):
    return create_generic(
        session, RuntimeDeleteTask(**runtime_delete_task.model_dump())
    )


def get_runtime_create_task(
    session: Session, runtime_id: UUID
) -> RuntimeCreateTask | None:
    """
    Returns the latest create task for a given runtime_id
    """
    stmt = select(RuntimeCreateTask).where(RuntimeCreateTask.runtime_id == runtime_id)
    if RuntimeCreateTask.created_at:
        stmt = stmt.order_by(col(RuntimeCreateTask.created_at).desc())
    return session.exec(stmt).first()


def get_runtime_update_task(
    session: Session, runtime_id: UUID
) -> RuntimeUpdateTask | None:
    """
    Returns the latest update task for a given runtime_id
    """
    stmt = select(RuntimeUpdateTask).where(RuntimeUpdateTask.runtime_id == runtime_id)
    if RuntimeUpdateTask.created_at:
        stmt = stmt.order_by(col(RuntimeUpdateTask.created_at).desc())
    return session.exec(stmt).first()


def get_runtime_delete_task(
    session: Session, runtime_id: UUID
) -> RuntimeDeleteTask | None:
    """
    Returns the latest delete task for a given runtime_id
    """
    stmt = select(RuntimeDeleteTask).where(RuntimeDeleteTask.runtime_id == runtime_id)
    if RuntimeDeleteTask.created_at:
        stmt = stmt.order_by(col(RuntimeDeleteTask.created_at).desc())
    return session.exec(stmt).first()


# endregion Tasks
