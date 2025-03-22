import asyncio
import json
from asyncio import sleep as asyncio_sleep
from typing import Any, Callable, Coroutine, Generator
from uuid import UUID, uuid4

import pytest

from src.db import crud
from src.db.models import (
    AgentBase,
    AgentStartTask,
    Runtime,
    RuntimeCreateTask,
    Token,
    TokenBase,
    User,
    UserBase,
    Wallet,
    WalletBase,
    WalletUpdate,
)
from src.models import AgentPublic, TaskStatus, UserPublic
from src.server import Session


def test_ping(client):
    response = client.get("/ping")
    assert response.status_code == 200


@pytest.fixture()
def wallet_factory(
    client, user_factory
) -> Generator[Callable[..., Wallet], None, None]:
    wallet_ids: list[UUID] = []

    def factory(**kwargs) -> Wallet:
        owner_id = kwargs.get("owner_id", user_factory().id)

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
        wallet_ids.append(wallet.id)
        return wallet

    yield factory

    for wallet_id in wallet_ids:
        client.delete(f"/wallets/{wallet_id}")


@pytest.fixture()
def user_factory(client) -> Generator[Callable[..., User], None, None]:
    user_ids: list[UUID] = []

    def factory(**kwargs) -> User:
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
        user = User.model_validate(response.json())
        user_ids.append(user.id)
        return user

    yield factory

    for user_id in user_ids:
        client.delete(f"/users/{user_id}")


# TODO: Use the actual endpoint instead of directly through crud
@pytest.fixture()
def token_factory(client):
    token_ids = []

    def factory(**kwargs) -> Token:
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
            token_ids.append(token.id)
            return token

    yield factory

    for token_id in token_ids:
        with Session() as session:
            token = crud.get_token(session, token_id)
            crud.delete_token(session, token)


# TODO: Use the actual endpoint instead of directly through crud
@pytest.fixture()
def runtime_factory(
    client,
) -> Generator[Callable[[], Coroutine[Any, Any, Runtime]], None, None]:
    runtime_ids: list[UUID] = []

    async def factory() -> Runtime:
        runtime_resp = client.post("/runtimes")
        runtime_create_task = RuntimeCreateTask.model_validate(runtime_resp.json())
        runtime_ids.append(runtime_create_task.runtime_id)

        # Wait for the runtime to be created
        task_status = TaskStatus.PENDING
        while task_status != TaskStatus.SUCCESS:
            celery_task_id = runtime_create_task.celery_task_id
            task_status = client.get(f"/tasks/{celery_task_id}").json()
            assert task_status != TaskStatus.FAILURE
            await asyncio_sleep(5)

        resp = client.get(f"/runtimes/{runtime_create_task.runtime_id}")
        assert resp.status_code == 200
        runtime = Runtime.model_validate(resp.json())
        return runtime

    yield factory

    for runtime_id in runtime_ids:
        client.delete(f"/runtimes/{runtime_id}")


@pytest.fixture()
def agent_factory(
    client, user_factory, token_factory
) -> Generator[Callable[..., AgentPublic], None, None]:
    agent_ids: list[UUID] = []

    def factory(**kwargs) -> AgentPublic:
        if (owner_id := kwargs.get("owner_id")) is None:
            owner = user_factory()
            owner_id = owner.id
        eliza_agent_id = kwargs.get("eliza_agent_id", "eliza_agent_id_01")
        if (token_id := kwargs.get("token_id")) is None:
            token = token_factory()
            token_id = token.id
        runtime_id = kwargs.get("runtime_id")

        with open("./src/test.character.json") as f:
            test_character_json = json.loads(f.read())
        character_json = kwargs.get("character_json", test_character_json)
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
        agent_public = AgentPublic.model_validate(response.json())
        agent_ids.append(agent_public.id)
        return agent_public

    yield factory

    for agent_id in agent_ids:
        client.delete(f"/agents/{agent_id}")


def test_wallets(client, wallet_factory, user_factory) -> None:
    wallet: Wallet = wallet_factory()
    assert wallet is not None

    # Try the get methods
    response = client.get(f"/wallets?wallet_id={wallet.id}")
    assert response.status_code == 200
    Wallet.model_validate(response.json())

    response = client.get(f"/wallets?owner_id={wallet.owner_id}")
    assert response.status_code == 200
    Wallet.model_validate(response.json()[0])

    response = client.get(f"/wallets?public_key={wallet.public_key}")
    assert response.status_code == 200
    Wallet.model_validate(response.json())

    # Try patching it
    new_owner = user_factory()
    wallet_update = WalletUpdate(
        owner_id=new_owner.id,
    )
    response = client.patch(
        f"/wallets/{wallet.id}",
        json=wallet_update.model_dump(mode="json"),
    )
    assert response.status_code == 200
    wallet = Wallet.model_validate(response.json())
    assert wallet.owner_id == new_owner.id

    # Try deleting it
    response = client.delete(f"/wallets/{wallet.id}")
    assert response.status_code == 200
    response = client.get(f"/wallets?wallet_id={wallet.id}")
    assert response.status_code == 404

    return None


def test_users(client, user_factory, wallet_factory) -> None:
    user: User = user_factory()
    assert user is not None
    wallet: Wallet = wallet_factory(
        owner_id=user.id,
    )
    assert wallet is not None

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
    token: Token = token_factory()
    assert token is not None

    response = client.get(f"/tokens/{token.id}")
    assert response.status_code == 200
    Token.model_validate(response.json())

    response = client.get("/tokens")
    assert response.status_code == 200
    Token.model_validate(response.json()[0])

    return None


@pytest.mark.asyncio
async def test_runtimes(client, runtime_factory) -> None:
    response = client.get("/runtimes")
    assert response.status_code == 200
    num_runtimes = len(response.json())
    # prayge that runtimes aren't being created/deleted while this test runs.

    runtime_1, runtime_2 = await asyncio.gather(runtime_factory(), runtime_factory())
    assert runtime_1 is not None
    assert runtime_2 is not None

    response = client.get(f"/runtimes/{runtime_1.id}")
    assert response.status_code == 200
    Runtime.model_validate(response.json())

    response = client.get(f"/runtimes/{runtime_2.id}")
    assert response.status_code == 200
    Runtime.model_validate(response.json())

    response = client.get("/runtimes")
    assert response.status_code == 200
    assert (
        len(response.json()) == 2 + num_runtimes
    )  # uhhhh what happens when there are runtimes prior to this test?
    Runtime.model_validate(response.json()[0])
    Runtime.model_validate(response.json()[1])

    return None


@pytest.mark.asyncio
async def test_agents(client, user_factory, agent_factory, runtime_factory) -> None:
    agent: AgentPublic = agent_factory()
    assert agent is not None
    # Test getting agents by the user's dynamic id.
    # Make a random agent with a different owner.
    random_user = user_factory()
    agent_factory(owner_id=random_user.id)
    agent_factory(owner_id=random_user.id)

    response = client.get(f"/agents/{agent.id}")
    assert response.status_code == 200
    AgentPublic.model_validate(response.json())

    response = client.get("/agents")
    assert response.status_code == 200
    AgentPublic.model_validate(response.json()[0])

    response = client.get(f"/agents?user_id={agent.owner_id}")
    assert response.status_code == 200
    response_json = response.json()
    AgentPublic.model_validate(response_json[0])
    assert len(response_json) == 1

    response = client.get(f"/users?user_id={agent.owner_id}")
    owner = UserPublic.model_validate(response.json())
    assert owner.id == agent.owner_id

    response = client.get(f"/agents?user_dynamic_id={owner.dynamic_id}")
    assert response.status_code == 200
    response_json = response.json()
    AgentPublic.model_validate(response_json[0])
    assert len(response_json) == 1

    # Try starting an agent
    runtime: Runtime = await runtime_factory()
    response = client.post(f"/agents/{agent.id}/start?runtime_id={runtime.id}")
    assert response.status_code == 200
    agent_start_task = AgentStartTask.model_validate(response.json())
    assert agent_start_task.agent_id == agent.id
    assert agent_start_task.runtime_id == runtime.id
    celery_task_id = agent_start_task.celery_task_id

    task_status = TaskStatus.PENDING
    while task_status != TaskStatus.SUCCESS:
        task_status = client.get(f"/tasks/{celery_task_id}").json()
        assert task_status != TaskStatus.FAILURE
        asyncio_sleep(5)

    # Try chatting with it.
    response = client.post(
        f"{runtime.url}/{agent.eliza_agent_id}/message",
        json={"user": "testuser", "text": "hello"},
    )
    assert response.status_code == 200
    return None
