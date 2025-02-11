import time
from typing import Any

import jwt


def decode_bearer_token(token: str) -> dict[str, Any]:
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


def verify_decoded_token(decoded: dict[str, Any]) -> bool:
    if time.time() > decoded["exp"]:
        return False

    dynamic_environment_id = "2c6dd185-953d-411c-a7a7-dfd109b611c9"
    if decoded["iss"] != f"app.dynamicauth.com/{dynamic_environment_id}":
        return False

    return True


def validate_bearer_token(token: str) -> bool:
    decoded = decode_bearer_token(token)
    return verify_decoded_token(decoded)
