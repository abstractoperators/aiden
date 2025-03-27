import os
from typing import Any

from jwt import PyJWK, PyJWKClient, PyJWT

options = {
    "verify_signature": True,
    "verify_exp": True,
    "verify_nbf": False,
    "verify_iat": True,
    "verify_iss": True,
    "verify_aud": False,
    "verify_sub": False,
    "verify_jti": False,
    "strict_iat": False,
    "require": ["exp", "iat"],
}
py_jwt = PyJWT(options)

dynamic_environment_id = os.getenv("DYNAMIC_ENVIRONMENT_ID", None)
if not dynamic_environment_id:
    raise EnvironmentError("DYNAMIC_ENVIRONMENT_ID is not set")
uri = (
    f"https://app.dynamicauth.com/api/v0/sdk/{dynamic_environment_id}/.well-known/jwks"
)
pyjwk_client: PyJWKClient = PyJWKClient(
    uri=uri,
    headers={"User-Agent": "AidenBackend"},
)


def decode_bearer_token(jwt_token: str) -> dict[str, Any]:
    """
    Decodes a JWT token and returns its payload
    jwt_token (str): JWT token to decode - does not include the "Bearer " prefix
    Raises an jwt.exceptions.PyJWTError if the token is invalid
    """
    signing_key: PyJWK = pyjwk_client.get_signing_key_from_jwt(jwt_token)

    return py_jwt.decode_complete(jwt_token, signing_key, leeway=10)
