from typing import Any

import jwt

with open("dynamic_pub_key.pub", "r") as f:
    dynamic_pub_key = f.read().strip()


def validate_bearer_token(token: str):
    jwt_token: str = token
    if token.startswith("Bearer "):
        jwt_token = token.split(" ")[1]

    decoded: dict[str, Any] = jwt.decode(
        jwt_token, dynamic_pub_key, algorithms=["RS256"]
    )
    print(decoded)
