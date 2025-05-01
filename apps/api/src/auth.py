"""
Handles JWT-based authentication and authorization with FastAPI and Dynamic.
"""

import os
from typing import Any, Callable
from uuid import UUID

from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer
from fastapi.security.http import HTTPAuthorizationCredentials
from jwt import PyJWK, PyJWKClient, PyJWT
from jwt.exceptions import PyJWTError

from src.db import Session, crud
from src.db.models import User, Wallet
from src.utils import obj_or_404

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
    params:
      jwt_token (str): JWT token to decode - does not include the "Bearer " prefix
    raises:
      `jwt.exceptions.PyJWTError` if the token is invalid
    """
    signing_key: PyJWK = pyjwk_client.get_signing_key_from_jwt(jwt_token)
    return py_jwt.decode_complete(jwt_token, signing_key, leeway=10)


# This guy basically just checks for Authorization header.
auth_scheme = HTTPBearer(
    bearerFormat="",
    scheme_name="Bearer Token from Dynamic",
    auto_error=False,
)


def optional_jwt(
    token: HTTPAuthorizationCredentials | None = Security(auth_scheme),
) -> HTTPAuthorizationCredentials | None:
    """ """
    return token


def parse_jwt(
    token: HTTPAuthorizationCredentials = Security(auth_scheme),
) -> dict[str, Any]:
    """
    params:
      token (HTTPAuthorizationCredentials): JWT token
    returns:
      payload (dict): user credentials details
    raises:
      HTTPException with status code 401 unauthorized
    """
    if not token:
        raise HTTPException(detail="No token was provided", status_code=401)
    try:
        decoded_token = decode_bearer_token(token.credentials)
    except PyJWTError:
        raise HTTPException(detail="Failed to decode token", status_code=401)

    payload: dict | None = decoded_token.get("payload")
    if not payload:
        raise HTTPException(
            detail="Expected payload in token",
            status_code=401,
        )
    return payload


def get_user_from_token(
    token: HTTPAuthorizationCredentials = Security(auth_scheme),
) -> User:
    """
    Retrieve a user using their JWT
    params:
      token (str): JWT token
    returns:
      user (User | 404)
    """
    payload = parse_jwt(token)

    subject = payload.get("sub")
    if not subject:
        raise ValueError()
    dynamic_user_id: UUID = UUID(subject)

    # For now, assume the user already exists
    with Session() as session:
        user: User = obj_or_404(
            crud.get_user_by_dynamic_id(session, dynamic_id=dynamic_user_id), User
        )
    return user


def get_wallets_from_token(
    token: HTTPAuthorizationCredentials = Security(auth_scheme),
) -> list[Wallet]:
    """
    Retrieve a wallet based on its JWT
    params:
      token (str): JWT token
    raises:
      HTTPException with status code 401 unauthorized
    """
    payload = parse_jwt(token)

    credentials: list[dict] | None = payload.get("verified_credentials")
    if not credentials:
        raise HTTPException(
            detail="No verified credentials in token",
            status_code=401,
        )
    addresses: list[str] = []
    for credential in credentials:
        if address := credential.get("address"):
            addresses.append(address)
    # For now, assume the wallet already exists

    wallets: list[Wallet] = []
    with Session() as session:
        for address in addresses:
            # Not going to throw a 404 here cuz it's hacky af any how.
            wallet = crud.get_wallet_by_public_key_hack(session, address)
            if wallet is None:
                continue
            wallets.append(wallet)

    return [wallet for wallet in wallets if wallet is not None]


def check_scopes(
    *required_permissions: str,
) -> Callable:
    """
    Check if a user has the necessary permissions.
    params:
      token (str): JWT token
    raises:
      HTTPException with status code 403 forbidden
    """
    def helper(
        token: HTTPAuthorizationCredentials = Security(auth_scheme),
    ) -> None:
        payload = parse_jwt(token)

        # Access lists will be in lists field of payload
        # https://docs.dynamic.xyz/authentication-methods/auth-tokens
        payload_access_list: list[str] = payload.get("lists", [])
        if not set(payload_access_list) == set(required_permissions):
            raise HTTPException(
                detail="User does not have the required permissions",
                status_code=403,
            )

        return None
    return helper
