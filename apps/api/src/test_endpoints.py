from uuid import UUID

from fastapi.testclient import TestClient
from src.models import AgentPublic
from src.server import app

# from src.db.test_db import session

client = TestClient(app)


def test_ping():
    response = client.get("/ping")
    assert response.status_code == 200


def test_get_agents():
    response = client.get("/agents")
    assert response.status_code == 200
    for agent in response.json():
        try:
            agent_public = AgentPublic.model_validate(agent)
            if agent_public.runtime_id:
                assert agent_public.runtime
            if agent_public.token_id:
                assert agent_public.token
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
