from typing import Any, TypeVar

from fastapi import HTTPException
from jwt import PyJWKClient, PyJWT

from src.db.models import Base

T = TypeVar("T", bound=Base)


def obj_or_404(obj: T | None, T) -> T:
    if not obj:
        raise HTTPException(status_code=404, detail=f"{T.__name__} Not found")
    return obj


options = {
    "verify_signature": True,
    "verify_exp": True,
    "verify_nbf": True,
    "verify_iat": True,
    "verify_iss": True,
    "verify_aud": False,
    "verify_sub": False,
    "verify_jti": False,
    "strict_iat": False,
    "require": ["exp", "iat", "nbf"],
}
py_jwt = PyJWT(options)


def decode_bearer_token(jwt_token: str, pyjwk_client: PyJWKClient) -> dict[str, Any]:
    """
    Decodes a JWT token and returns its payload
    jwt_token (str): JWT token to decode - does not include the "Bearer " prefix
    pyjwk_client (PyJWKClient): PyJWKClient object to use for decoding the token
    """
    signing_key = pyjwk_client.get_signing_key_from_jwt(jwt_token)
    print(f"signing_key: {signing_key}")
    print(f"jwt_token: {jwt_token}")

    return py_jwt.decode_complete(jwt_token, signing_key)
