# from unittest.mock import MagicMock
from uuid import UUID, uuid4

import pytest
from sqlalchemy import inspect
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from .crud import (
    create_agent,
    create_runtime_create_task,
    create_runtime_delete_task,
    create_runtime_update_task,
    create_token,
    create_user,
    get_runtime_create_task,
    get_runtime_delete_task,
    get_runtime_update_task,
)
from .models import (
    Agent,
    AgentBase,
    RuntimeCreateTask,
    RuntimeCreateTaskBase,
    RuntimeDeleteTask,
    RuntimeDeleteTaskBase,
    RuntimeUpdateTask,
    RuntimeUpdateTaskBase,
    Token,
    TokenBase,
    User,
    UserBase,
)


@pytest.fixture
def session():
    engine = create_engine(
        "sqlite:///test.db",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    sess = Session(engine)
    try:
        yield sess
    finally:
        sess.close()
        SQLModel.metadata.drop_all(engine)
        engine.dispose()


@pytest.fixture
def runtime_create_task_factory(session):
    tasks = []

    def factory(**kwargs) -> RuntimeCreateTask:
        task_base: RuntimeCreateTaskBase = RuntimeCreateTaskBase(**kwargs)
        task: RuntimeCreateTask = create_runtime_create_task(session, task_base)

        return task

    try:
        yield factory
    finally:
        for task in tasks:
            session.delete(task)
        session.commit()


@pytest.fixture
def runtime_update_task_factory(session):
    tasks = []

    def factory(**kwargs) -> RuntimeUpdateTask:
        task_base: RuntimeUpdateTaskBase = RuntimeUpdateTaskBase(**kwargs)
        task: RuntimeUpdateTask = create_runtime_update_task(session, task_base)

        return task

    try:
        yield factory
    finally:
        for task in tasks:
            session.delete(task)
        session.commit()


@pytest.fixture
def runtime_delete_task_factory(session):
    tasks = []

    def factory(**kwargs) -> RuntimeDeleteTask:
        task_base: RuntimeDeleteTaskBase = RuntimeDeleteTaskBase(**kwargs)
        task: RuntimeDeleteTask = create_runtime_delete_task(session, task_base)

        return task

    try:
        yield factory
    finally:
        for task in tasks:
            session.delete(task)
        session.commit()


@pytest.fixture
def user_factory(session):
    users = []

    def factory(**kwargs) -> User:
        user = create_user(session, UserBase(**kwargs))
        users.append(user)
        return user

    try:
        yield factory
    finally:
        for user in users:
            session.delete(user)
        session.commit()


@pytest.fixture
def token_factory(session):
    tokens = []

    def factory(**kwargs) -> Token:
        token = create_token(session, TokenBase(**kwargs))
        tokens.append(token)
        return token

    try:
        yield factory
    finally:
        for token in tokens:
            session.delete(token)
        session.commit()


@pytest.fixture
def agent_factory(session):
    agents = []

    def factory(**kwargs) -> Agent:
        agent = create_agent(session, AgentBase(**kwargs))
        agents.append(agent)
        return agent

    try:
        yield factory
    finally:
        for agent in agents:
            session.delete(agent)
        session.commit()


def test_tables_exist(session):
    tables = inspect(session.get_bind()).get_table_names()
    assert "user" in tables
    assert "agent" in tables
    assert "runtime" in tables
    assert "token" in tables


def test_create_token(token_factory):
    token = token_factory(
        ticker="AIDEN",
        name="The greatest token ever",
        evm_contract_address="0x123",
        abi=[{"key": "value"}],
    )

    assert token is not None
    assert token.id is not None
    assert token.ticker == "AIDEN"
    assert token.name == "The greatest token ever"
    assert token.evm_contract_address == "0x123"
    assert token.abi == [{"key": "value"}]


def test_create_user(user_factory):
    uuid = uuid4()
    user = user_factory(
        dynamic_id=uuid,
        email="larrypage@gmail.com",
        phone_number="1234567890",
        username="larrypage",
    )

    assert user is not None
    assert user.id is not None
    assert user.dynamic_id == uuid
    assert user.email == "larrypage@gmail.com"
    assert user.phone_number == "1234567890"
    assert user.username == "larrypage"


def test_create_agent(user_factory, token_factory, agent_factory) -> None:
    runtime_id = None
    character_json: dict = {}
    env_file = ""
    owner: User = user_factory(
        dynamic_id=uuid4(),
    )
    token: Token = token_factory(
        ticker="AIDEN",
        name="The greatest token ever",
        evm_contract_address="0x123",
        abi=[{"key": "value"}],
    )
    agent: Agent = agent_factory(
        eliza_agent_id="123",
        owner_id=owner.id,
        runtime_id=runtime_id,
        token_id=token.id,
        character_json=character_json,
        env_file=env_file,
    )

    assert agent is not None
    assert agent.id is not None
    assert agent.owner_id == owner.id
    assert agent.runtime_id == runtime_id
    assert agent.token_id == token.id
    assert agent.character_json == character_json
    assert agent.env_file == env_file


def test_runtimes(
    session: Session,
    runtime_create_task_factory,
    runtime_update_task_factory,
    runtime_delete_task_factory,
):
    runtime_id: UUID = uuid4()
    create_celery_task_uuid: UUID = uuid4()
    create_task: RuntimeCreateTask = runtime_create_task_factory(
        celery_task_id=create_celery_task_uuid,
        runtime_id=runtime_id,
    )
    assert create_task is not None
    assert create_task.runtime_id == runtime_id
    assert create_task.celery_task_id == create_celery_task_uuid
    gotten_create_task: RuntimeCreateTask | None = get_runtime_create_task(
        session=session,
        runtime_id=runtime_id,
    )
    assert gotten_create_task is not None
    assert gotten_create_task.runtime_id == create_task.runtime_id
    assert gotten_create_task.celery_task_id == create_task.celery_task_id

    update_celery_task_id: UUID = uuid4()
    update_task: RuntimeUpdateTask = runtime_update_task_factory(
        celery_task_id=update_celery_task_id,
        runtime_id=runtime_id,
    )
    assert update_task is not None
    assert update_task.runtime_id == runtime_id
    assert update_task.celery_task_id == update_celery_task_id
    gotten_update_task: RuntimeUpdateTask | None = get_runtime_update_task(
        session=session,
        runtime_id=runtime_id,
    )
    assert gotten_update_task is not None
    assert gotten_update_task.runtime_id == update_task.runtime_id
    assert gotten_update_task.celery_task_id == update_task.celery_task_id

    delete_celery_task_id: UUID = uuid4()
    delete_task: RuntimeDeleteTask = runtime_delete_task_factory(
        celery_task_id=delete_celery_task_id,
        runtime_id=runtime_id,
    )
    assert delete_task is not None
    assert delete_task.runtime_id == runtime_id
    assert delete_task.celery_task_id == delete_celery_task_id
    gotten_delete_task: RuntimeDeleteTask | None = get_runtime_delete_task(
        session=session,
        runtime_id=runtime_id,
    )
    assert gotten_delete_task is not None
    assert gotten_delete_task.runtime_id == delete_task.runtime_id
    assert gotten_delete_task.celery_task_id == delete_task.celery_task_id
