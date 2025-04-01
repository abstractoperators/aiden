import asyncio
import json
from asyncio import sleep as asyncio_sleep
from time import time
from typing import Any, Callable, Coroutine, Generator
from uuid import UUID, uuid4

import pytest

from src.auth import decode_bearer_token
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


def test_jwt(
    helper_encode_jwt,
) -> None:
    payload = {
        "sub": 1234,
        "exp": time() + 3600,
        "iat": 1234567890,
    }
    bearer_token = helper_encode_jwt(payload)
    assert bearer_token is not None
    decoded_payload = decode_bearer_token(bearer_token).get("payload")
    assert decoded_payload is not None
    assert decoded_payload["sub"] == payload["sub"]
    assert decoded_payload["exp"] == payload["exp"]
    assert decoded_payload["iat"] == payload["iat"]


@pytest.fixture()
def wallet_factory(
    client, user_factory, helper_encode_jwt
) -> Generator[Callable[..., Wallet], None, None]:
    # wallet_ids: list[UUID] = []
    wallets: list[Wallet] = []

    def factory(**kwargs) -> Wallet:
        owner_id = kwargs.get("owner_id", user_factory().id)

        public_key = kwargs.get("public_key", "public_key_01")
        wallet_base = WalletBase(
            public_key=public_key,
            chain="EVM",
            chain_id="1",
            owner_id=owner_id,
        )
        # POST /wallets is not yet authed.
        response = client.post("/wallets", json=wallet_base.model_dump(mode="json"))
        assert response.status_code == 200
        wallet = Wallet.model_validate(response.json())
        wallets.append(wallet)
        return wallet

    yield factory

    for wallet in wallets:
        auth = helper_encode_jwt(
            {
                "verified_credentials": [
                    {
                        "address": wallet.public_key,
                        "chain": wallet.chain,
                    }
                ],
            }
        )

        client.delete(
            f"/wallets/{wallet.id}", headers={"Authorization": f"Bearer {auth}"}
        )


@pytest.fixture()
def user_factory(
    client, helper_encode_jwt
) -> Generator[Callable[..., User], None, None]:
    users: list[User] = []

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
        auth: str = helper_encode_jwt({"sub": str(dynamic_id)})

        response = client.post(
            "/users",
            json=user_base.model_dump(mode="json"),
            headers={"Authorization": f"Bearer {auth}"},
        )
        assert response.status_code == 200
        user = User.model_validate(response.json())
        users.append(user)
        return user

    yield factory

    for user in users:
        auth: str = helper_encode_jwt({"sub": str(user.dynamic_id)})
        client.delete(f"/users/{user.id}", headers={"Authorization": f"Bearer {auth}"})


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
    helper_encode_jwt,
) -> Generator[Callable[[], Coroutine[Any, Any, Runtime]], None, None]:
    runtime_ids: list[UUID] = []
    auth = helper_encode_jwt({"lists": ["admin"]})

    async def factory() -> Runtime:
        runtime_resp = client.post(
            "/runtimes", headers={"Authorization": f"Bearer {auth}"}
        )
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
        client.delete(
            f"/runtimes/{runtime_id}", headers={"Authorization": f"Bearer {auth}"}
        )


@pytest.fixture()
def agent_factory(
    client,
    user_factory,
    token_factory,
    helper_encode_jwt,
) -> Generator[Callable[..., AgentPublic], None, None]:
    agents: list[AgentPublic] = []

    def factory(**kwargs) -> AgentPublic:
        if (owner_id := kwargs.get("owner_id")) is None:
            owner: User = user_factory()
            owner_id = owner.id
        owner_dict = client.get(f"/users?user_id={owner_id}").json()
        owner: UserPublic = UserPublic.model_validate(owner_dict)
        owner_dynamic_id = owner.dynamic_id

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
        auth = helper_encode_jwt({"sub": str(owner_dynamic_id)})
        response = client.post(
            "/agents",
            json=agent_base.model_dump(mode="json"),
            headers={"Authorization": f"Bearer {auth}"},
        )
        assert response.status_code == 200
        agent_public = AgentPublic.model_validate(response.json())
        agents.append(agent_public)
        return agent_public

    yield factory

    for agent in agents:
        owner_dict = client.get(f"/users?user_id={agent.owner_id}").json()
        owner: User = User.model_validate(owner_dict)
        auth = helper_encode_jwt({"sub": str(owner.dynamic_id)})
        client.delete(
            f"/agents/{agent.id}",
            headers={"Authorization": f"Bearer {auth}"},
        )


def test_wallets(
    client,
    wallet_factory,
    user_factory,
    helper_encode_jwt,
) -> None:
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
    auth = helper_encode_jwt(
        {
            "verified_credentials": [
                {
                    "address": wallet.public_key,
                    "chain": wallet.chain,
                }
            ],
        }
    )
    response = client.patch(
        f"/wallets/{wallet.id}",
        json=wallet_update.model_dump(mode="json"),
        headers={"Authorization": f"Bearer {auth}"},
    )
    assert response.status_code == 200
    wallet = Wallet.model_validate(response.json())
    assert wallet.owner_id == new_owner.id

    # Try deleting it
    response = client.delete(
        f"/wallets/{wallet.id}", headers={"Authorization": f"Bearer {auth}"}
    )
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
async def test_runtimes(
    client, runtime_factory, agent_factory, user_factory, helper_encode_jwt
) -> None:
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
    )  # uhhhh what happens when there are runtimes created during this test?
    Runtime.model_validate(response.json()[0])
    Runtime.model_validate(response.json()[1])

    owner: UserPublic = user_factory()
    agent: AgentPublic = agent_factory(owner_id=owner.id)
    assert agent is not None
    auth = helper_encode_jwt({"sub": str(owner.dynamic_id)})
    response = client.post(
        f"/agents/{agent.id}/start/{runtime_1.id}",
        headers={"Authorization": f"Bearer {auth}"},
    )
    assert response.status_code == 200, response.json()
    agent_start_task = AgentStartTask.model_validate(response.json())
    assert agent_start_task.agent_id == agent.id
    assert agent_start_task.runtime_id == runtime_1.id
    celery_task_id = agent_start_task.celery_task_id

    task_status = TaskStatus.PENDING
    while task_status != TaskStatus.SUCCESS:
        task_status = client.get(f"/tasks/{celery_task_id}").json()
        assert task_status != TaskStatus.FAILURE
        await asyncio_sleep(5)

    # Try chatting with it.
    # Get updated eliza_agent_id (from mock id eliza_agent_id_01)
    response = client.get(f"/agents/{agent.id}")
    assert response.status_code == 200
    agent = AgentPublic.model_validate(response.json())
    print(agent)

    response = client.post(
        f"{runtime_1.url}/{agent.eliza_agent_id}/message",
        json={"user": "testuser", "text": "hello"},
    )
    assert response.status_code == 200, response.json()

    return None


@pytest.mark.asyncio
async def test_agents(
    client, user_factory, agent_factory, runtime_factory, helper_encode_jwt
) -> None:
    owner: User = user_factory()
    agent: AgentPublic = agent_factory(owner_id=owner.id)
    assert agent is not None
    # Test getting agents by the user's dynamic id.
    # Make a random agent with a different owner.
    random_user: UserPublic = user_factory()
    agent_factory(owner_id=random_user.id)
    agent_factory(owner_id=random_user.id)

    response = client.get(f"/agents/{agent.id}")
    assert response.status_code == 200, response.json()
    AgentPublic.model_validate(response.json())

    response = client.get("/agents")
    assert response.status_code == 200, response.json()
    AgentPublic.model_validate(response.json()[0])

    # Logged in as wrong user
    bad_auth = helper_encode_jwt({"sub": str(random_user.dynamic_id)})
    response = client.get(
        f"/agents?user_id={agent.owner_id}",
        headers={"Authorization": f"Bearer {bad_auth}"},
    )
    assert response.status_code == 403, response.json()

    # Logged in as correct user
    auth = helper_encode_jwt({"sub": str(owner.dynamic_id)})
    response = client.get(
        f"/agents?user_id={agent.owner_id}",
        headers={"Authorization": f"Bearer {auth}"},
    )
    response_json = response.json()
    AgentPublic.model_validate(response_json[0])
    assert len(response_json) == 1

    response = client.get(f"/users?user_id={agent.owner_id}")
    owner = UserPublic.model_validate(response.json())
    assert owner.id == agent.owner_id

    response = client.get(
        f"/agents?user_dynamic_id={owner.dynamic_id}",
        headers={"Authorization": f"Bearer {auth}"},
    )
    assert response.status_code == 200
    response_json = response.json()
    AgentPublic.model_validate(response_json[0])
    assert len(response_json) == 1

    return None
