# from unittest.mock import MagicMock
import json

import pytest
from sqlalchemy import inspect
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from .crud import create_agent, create_token, create_user
from .models import Agent, AgentBase, Token, TokenBase, User, UserBase


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
        abi=json.dumps({"key": "value"}),
    )

    assert token is not None
    assert token.id is not None
    assert token.ticker == "AIDEN"
    assert token.name == "The greatest token ever"
    assert token.evm_contract_address == "0x123"
    assert token.abi == {"key": "value"}


def test_create_user(user_factory):
    user = user_factory(
        public_key="0x123",
        public_key_sei="0x456",
        email="larrypage@gmail.com",
        phone_number="1234567890",
        username="larrypage",
    )

    assert user is not None
    assert user.id is not None
    assert user.public_key == "0x123"
    assert user.public_key_sei == "0x456"
    assert user.email == "larrypage@gmail.com"
    assert user.phone_number == "1234567890"
    assert user.username == "larrypage"


def test_create_agent(user_factory, token_factory, agent_factory):
    runtime_id = None
    character_json = {}
    env_file = ""
    owner: User = user_factory(
        public_key="0x123",
        public_key_sei="0x456",
    )
    token: Token = token_factory(
        ticker="AIDEN",
        name="The greatest token ever",
        evm_contract_address="0x123",
        abi=json.dumps({"key": "value"}),
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
