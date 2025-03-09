from uuid import UUID, uuid4

from fastapi.testclient import TestClient

from src.db.models import Runtime, Token, User
from src.models import AgentPublic
from src.server import app

# from src.db.test_db import session

client = TestClient(app)


def test_ping():
    response = client.get("/ping")
    assert response.status_code == 200


def test_get_user():
    # real user hardcoded to AbopDev
    user_id: UUID = "292392de-ddfd-48a8-81fc-b61b0212c391"
    public_key: str = "0xe98493C9943097f1127dD1C55257fbA8eD2E3211"
    fake_user_id: UUID = uuid4()
    fake_public_key: str = "0xfoobarbaz"

    response = client.get("/users")
    assert response.status_code == 200

    response = client.get(f"/users?public_key={public_key}&user_id={user_id}")
    assert response.status_code == 400

    response = client.get(f"/users?public_key={fake_public_key}")
    assert response.status_code == 404

    response = client.get(f"/users?user_id={fake_user_id}")
    assert response.status_code == 404

    response = client.get(f"/users?public_key={public_key}")
    assert response.status_code == 200
    User.model_validate(response.json())


def test_get_agents():
    response = client.get("/agents")
    assert response.status_code == 200
    for agent in response.json():
        try:
            agent_public = AgentPublic.model_validate(agent)
            if agent_public.runtime_id:
                assert agent_public.runtime
                Runtime.model_validate(agent_public.runtime)
            if agent_public.token_id:
                assert agent_public.token
                Token.model_validate(agent_public.token)
        except Exception as e:
            assert False, f"{e} {agent}"


def test_get_agent():
    # hardcoded to kent gang
    id: UUID = "01493ea3-f672-4fb7-a32e-aa1d1b507f80"
    response = client.get(f"/agents/{id}")
    assert response.status_code == 200
    try:
        agent_public = AgentPublic.model_validate(response.json())
        if agent_public.runtime_id:
            assert agent_public.runtime
        if agent_public.token_id:
            assert agent_public.token
    except Exception as e:
        assert False, e


def test_get_tokens():
    response = client.get("/tokens")
    assert response.status_code == 200
    for token in response.json():
        try:
            Token.model_validate(token)
        except Exception as e:
            assert False, e


def test_get_token():
    # Hardcoded to kentbottest $kbt
    id: UUID = "1bdcf274-1a16-400a-bf50-94cbf5188483"
    response = client.get(f"/tokens/{id}")
    assert response.status_code == 200
    try:
        Token.model_validate(response.json())
    except Exception as e:
        assert False, e


def test_get_runtimes():
    response = client.get("/runtimes")
    assert response.status_code == 200
    for runtime in response.json():
        try:
            Runtime.model_validate(runtime)
        except Exception as e:
            assert False, e


def test_get_runtime():
    # Hardcoded to runtime 2
    id: UUID = "c9053b67-5e7a-4f55-af83-7438dc8777e2"
    response = client.get(f"/runtimes/{id}")
    assert response.status_code == 200
    try:
        Runtime.model_validate(response.json())
    except Exception as e:
        assert False, e
