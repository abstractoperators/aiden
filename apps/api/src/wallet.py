import time
from typing import Any

import jwt

# import requests  # type: ignore
# from jwt import

# url = "https://app.dynamic.xyz/api/v0/sdk/2c6dd185-953d-411c-a7a7-dfd109b611c9/.well-known/jwks"
# jwks_client = PyJWKClient(url)

# with open("dynamic_pub_key.pub", "r") as f:
#     dynamic_pub_key = f.read().strip()


def validate_bearer_token(token: str) -> bool:
    jwt_token: str = token
    if token.startswith("Bearer "):
        jwt_token = token.split(" ")[1]
    print(jwt_token)
    # TODO: Use jwks url because jwt will expire every 2 hours.
    # signing_key = jwks_client.get_signing_key_from_jwt(jwt_token)
    with open("dynamic_pub_key.pub", "r") as f:
        signing_key = f.read().strip()

    decoded: dict[str, Any] = jwt.decode(
        jwt_token,
        signing_key,
        algorithms=["RS256"],
        options={"verify_signature": False},
    )
    print(decoded)

    if time.time() > decoded["exp"]:
        return False

    dynamic_environment_id = "2c6dd185-953d-411c-a7a7-dfd109b611c9"
    if decoded["aud"] != f"app.dynamicauth.com/{dynamic_environment_id}":
        return False

    return True


# def fetch_jwt_token(jwks_url: str):
#     resp = requests.get(jwks_url)
#     jwks = resp.json()
#     return jwks
