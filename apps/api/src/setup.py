import os

import requests
from jwt import PyJWKClient
from sqlmodel import text

from src import logger
from src.db import Session


def test_db_connection() -> bool:
    with Session() as session:
        try:
            session.exec(text("SELECT 1"))
            return True
        except Exception as e:
            logger.error(e)
            return False


dynamic_environment_id = os.getenv("DYNAMIC_ENVIRONMENT_ID", None)
if not dynamic_environment_id:
    raise EnvironmentError("DYNAMIC_ENVIRONMENT_ID is not set")
uri = (
    f"https://app.dynamicauth.com/api/v0/sdk/{dynamic_environment_id}/.well-known/jwks"
)
print(uri)
print(requests.get(uri).json())
pyjwk_client: PyJWKClient = PyJWKClient(
    uri=uri,
    headers={"User-Agent": "AidenBackend"},
)
