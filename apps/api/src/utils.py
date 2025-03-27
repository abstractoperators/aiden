from typing import TypeVar

from fastapi import HTTPException

from src.db.models import Base
import jwt
from typing import Any

T = TypeVar("T", bound=Base)


def obj_or_404(obj: T | None, T) -> T:
    if not obj:
        raise HTTPException(status_code=404, detail=f"{T.__name__} Not found")
    return obj


def decode_bearer_token(token: str) -> dict[str, Any]:
    """
    Decodes Dynamic's JWT token
    """
    jwt_token: str = token
    if token.startswith("Bearer "):
        jwt_token = token.split(" ")[1]
    print(f"jwt_token: {jwt_token}")

    with open("dynamic_pub_key.pub", "r") as f:
        signing_key = f.read().strip()

    decoded: dict[str, Any] = jwt.decode(
        jwt_token,
        signing_key,
        algorithms=["RS256"],
        options={"verify_signature": False},
    )
    return decoded
