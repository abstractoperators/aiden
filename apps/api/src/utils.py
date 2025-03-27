from typing import Any, TypeVar

import jwt
from fastapi import HTTPException
from jwt import PyJWKClient

from src.db.models import Base

T = TypeVar("T", bound=Base)


def obj_or_404(obj: T | None, T) -> T:
    if not obj:
        raise HTTPException(status_code=404, detail=f"{T.__name__} Not found")
    return obj


def decode_bearer_token(jwt_token: str, pyjwk_client: PyJWKClient) -> dict[str, Any]:
    """
    Decodes a JWT token and returns its payload
    """
    if jwt_token.startswith("Bearer "):
        jwt_token = jwt_token.split(" ")[1]

    signing_key = pyjwk_client.get_signing_key_from_jwt(jwt_token)
    print(f"signing_key: {signing_key}")
    print(f"jwt_token: {jwt_token}")

    decoded: dict[str, Any] = jwt.decode(
        jwt_token,
        signing_key,
        algorithms=["RS256"],
        options={"verify_signature": False},
    )
    return decoded
