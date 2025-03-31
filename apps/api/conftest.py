from typing import Callable
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from jwt import PyJWT

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


test_secret = "foobarbaz"
py_jwt = PyJWT(
    options={
        "verify_signature": False,
        "verify_exp": False,
        "verify_iat": False,
        "verify_nbf": False,
        "verify_iss": False,
        "verify_aud": False,
        "verify_sub": False,
        "verify_jti": False,
        "require": [],
    }
)


@pytest.fixture
def helper_encode_jwt() -> Callable:
    def helper(payload) -> str:
        """
        Encodes a JWT token with the test secret key.
        """
        return py_jwt.encode(
            payload,
            test_secret,
            algorithm="HS256",
        )

    return helper


@pytest.fixture(scope="session", autouse=True)
def mock_decode_bearer_token():
    """
    Symmetrically signs a JWT token with secret key.
    Patches src.auth.decode_bearer_token
    """

    def _mock_decode(jwt_token: str):
        return py_jwt.decode_complete(jwt_token, test_secret, algorithms=["HS256"])

    with (
        patch("src.auth.decode_bearer_token", side_effect=_mock_decode),
        patch("src.test_endpoints.decode_bearer_token", side_effect=_mock_decode),
    ):
        yield
