import pytest
from fastapi.testclient import TestClient

# TODO: Bring this back. ATM it's using staging db, and then cleaning up at the end.
# @pytest.fixture(scope="session", autouse=True)
# def verify_env():
#     # I couldn't figure out how to set env before app startup.
# This is the workaround to ensure that the env is set to test.
# Make sure that .env.api has ENV=test
# assert os.getenv("ENV") == "test", "See conftest.py"


@pytest.fixture()
def client():
    from src.server import app

    with TestClient(app) as client:
        yield client
