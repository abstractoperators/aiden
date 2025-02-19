# from unittest.mock import MagicMock

from uuid import uuid4

import pytest
from sqlalchemy import inspect

from . import Session


@pytest.fixture
def setenv(monkeypatch):
    monkeypatch.setenv("ENV", "test")
    monkeypatch.setenv("POSTGRES_DB_PASSWORD", "")
    monkeypatch.setenv("POSTGRES_DB_HOST", "")


def test_tables_exist(setenv):
    with Session() as session:
        tables = inspect(session.get_bind()).get_table_names()
        assert "user" in tables
        assert "agent" in tables
        assert "runtime" in tables
        assert "token" in tables


def test_create_user(setenv):
    from .crud import create_user
    from .models import UserBase

    with Session() as session:
        user = create_user(
            session,
            UserBase(
                public_key="0x123",
                public_key_sei="0x456",
                email="larrypage@gmail.com",
                phone_number="1234567890",
                username="larrypage",
            ),
        )

    assert user is not None
    assert user.id is not None
    assert user.public_key == "0x123"
    assert user.public_key_sei == "0x456"
    assert user.email == "larrypage@gmail.com"
    assert user.phone_number == "1234567890"
    assert user.username == "larrypage"


def test_create_agent(setenv):
    from .crud import create_agent
    from .models import AgentBase

    owner_id = uuid4()
    runtime_id = uuid4()
    token_id = uuid4()
    character_json = "{}"
    env_file = ""
    with Session() as session:
        agent = create_agent(
            session,
            AgentBase(
                owner_id=owner_id,
                runtime_id=runtime_id,
                token_id=token_id,
                character_json=character_json,
                env_file=env_file,
            ),
        )

    assert agent is not None
    assert agent.id is not None
    assert agent.owner_id == owner_id
    assert agent.runtime_id == runtime_id
    assert agent.token_id == token_id
    assert agent.character_json == character_json
    assert agent.env_file == env_file
