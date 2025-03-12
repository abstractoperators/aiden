from uuid import uuid4

import pytest

from src.db import crud
from src.db.models import (
    AgentBase,
    Runtime,
    RuntimeBase,
    Token,
    TokenBase,
    User,
    UserBase,
    Wallet,
    WalletBase,
)
from src.models import AgentPublic, UserPublic
from src.server import Session


def test_ping(client):
    response = client.get("/ping")
    assert response.status_code == 200


@pytest.fixture()
def wallet_factory(user_factory):
    def factory(client, **kwargs) -> Wallet:
        owner_id = kwargs.get("owner_id", user_factory(client).id)

        public_key = kwargs.get("public_key", "public_key_01")
        wallet_base = WalletBase(
            public_key=public_key,
            chain="EVM",
            chain_id="1",
            owner_id=owner_id,
        )
        response = client.post("/wallets", json=wallet_base.model_dump(mode="json"))
        assert response.status_code == 200
        wallet = Wallet.model_validate(response.json())
        return wallet

    return factory


@pytest.fixture()
def user_factory():
    def factory(client, **kwargs) -> User:
        email = kwargs.get("email", "email@email.com")
        phone_number = kwargs.get("phone_number", "1234567890")
        username = kwargs.get("username", "username_01")
        dynamic_id = kwargs.get("dynamic_id")
        if not dynamic_id:
            dynamic_id = uuid4()

        user_base = UserBase(
            email=email,
            phone_number=phone_number,
            username=username,
            dynamic_id=dynamic_id,
        )
        response = client.post("/users", json=user_base.model_dump(mode="json"))
        assert response.status_code == 200
        return User.model_validate(response.json())

    return factory


# TODO: Use the actual endpoint instead of directly through crud
@pytest.fixture()
def token_factory():
    def factory(client, **kwargs) -> Token:
        ticker = kwargs.get("ticker", "testticker")
        name = kwargs.get("name", "testtokenname")
        evm_contract_address = kwargs.get("evm_contract_address", "0x12345")
        abi = kwargs.get("abi", [{"key": "value"}])
        token_base = TokenBase(
            ticker=ticker,
            name=name,
            evm_contract_address=evm_contract_address,
            abi=abi,
        )
        with Session() as session:
            token = crud.create_token(session, token_base)

            return token

    return factory


# TODO: Use the actual endpoint instead of directly through crud
@pytest.fixture()
def runtime_factory():
    def factory(client, **kwargs) -> Runtime:
        url = kwargs.get("url", "testurl")
        started = kwargs.get("started", False)
        runtime_base = RuntimeBase(url=url, started=started)
        with Session() as session:
            return crud.create_runtime(session, runtime_base)

    return factory


@pytest.fixture()
def agent_factory(user_factory, token_factory, runtime_factory):
    def factory(client, **kwargs) -> AgentPublic:
        if (owner_id := kwargs.get("owner_id")) is None:
            owner = user_factory(client)
            owner_id = owner.id
        eliza_agent_id = kwargs.get("eliza_agent_id", "eliza_agent_id_01")
        if (token_id := kwargs.get("token_id")) is None:
            token = token_factory(client)
            token_id = token.id
        if (runtime_id := kwargs.get("runtime_id")) is None:
            runtime = runtime_factory(client)
            runtime_id = runtime.id
        character_json = kwargs.get("character_json", {})
        env_file = kwargs.get("env_file", "env_var=env_val")

        agent_base = AgentBase(
            eliza_agent_id=eliza_agent_id,
            owner_id=owner_id,
            runtime_id=runtime_id,
            token_id=token_id,
            character_json=character_json,
            env_file=env_file,
        )
        response = client.post("/agents", json=agent_base.model_dump(mode="json"))
        assert response.status_code == 200
        return AgentPublic.model_validate(response.json())

    return factory


def test_wallets(client, wallet_factory) -> None:
    wallet: Wallet = wallet_factory(
        client,
    )
    assert wallet is not None

    response = client.get(f"/wallets?wallet_id={wallet.id}")
    assert response.status_code == 200
    Wallet.model_validate(response.json())

    response = client.get(f"/wallets?owner_id={wallet.owner_id}")
    assert response.status_code == 200
    Wallet.model_validate(response.json()[0])

    response = client.get(f"/wallets?public_key={wallet.public_key}")

    response = client.get(f"/wallets?public_key={wallet.public_key}")

    return None


def test_users(client, user_factory, wallet_factory) -> None:
    user: User = user_factory(
        client,
    )

    wallet: Wallet = wallet_factory(
        client,
        owner_id=user.id,
    )
    assert user is not None

    response = client.get(f"/users?user_id={user.id}")
    assert response.status_code == 200, response.json()
    user_public: UserPublic = UserPublic.model_validate(response.json())
    assert user_public.id == user.id
    assert user_public.email == user.email
    assert user_public.phone_number == user.phone_number
    assert user_public.username == user.username
    assert user_public.dynamic_id == user.dynamic_id
    assert user_public.wallets[0].public_key == wallet.public_key

    response = client.get(f"/users?public_key={wallet.public_key}")
    assert response.status_code == 200, response.json()
    UserPublic.model_validate(response.json())

    response = client.get(f"/users?dynamic_id={user.dynamic_id}")
    assert response.status_code == 200, response.json()
    UserPublic.model_validate(response.json())

    response = client.get(f"/users?public_key={wallet.public_key}&user_id={user.id}")
    assert response.status_code == 400, response.json()

    return None


def test_tokens(client, token_factory) -> None:
    token: Token = token_factory(
        client,
    )
    assert token is not None

    response = client.get(f"/tokens/{token.id}")
    assert response.status_code == 200
    Token.model_validate(response.json())

    response = client.get("/tokens")
    assert response.status_code == 200
    Token.model_validate(response.json()[0])

    return None


def test_runtimes(client, runtime_factory) -> None:
    runtime: Runtime = runtime_factory(
        client,
    )
    assert runtime is not None

    response = client.get(f"/runtimes/{runtime.id}")
    assert response.status_code == 200
    Runtime.model_validate(response.json())

    response = client.get("/runtimes")
    assert response.status_code == 200
    Runtime.model_validate(response.json()[0])
    return None


def test_agents(client, agent_factory) -> None:
    agent: AgentPublic = agent_factory(
        client,
    )
    assert agent is not None

    response = client.get(f"/agents/{agent.id}")
    assert response.status_code == 200
    AgentPublic.model_validate(response.json())

    response = client.get("/agents")
    assert response.status_code == 200
    AgentPublic.model_validate(response.json()[0])

    return None
