"""
Handles JWT-based authentication and authorization with FastAPI and Dynamic.
"""

from collections.abc import Callable
from typing import Annotated, Any
from uuid import UUID
import os

from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer
from fastapi.security.http import HTTPAuthorizationCredentials
from jwt import PyJWK, PyJWKClient, PyJWT
from jwt.exceptions import PyJWTError

from src.db import Session, crud
from src.db.models import User, Wallet
from src.utils import obj_or_404

options: dict[str, Any] = {
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
      jwt.exceptions.PyJWTError if the token is invalid
    """
    signing_key: PyJWK = pyjwk_client.get_signing_key_from_jwt(jwt_token)
    return py_jwt.decode_complete(jwt_token, signing_key, leeway=10)


# This guy basically just checks for Authorization header.
auth_scheme = HTTPBearer(
    bearerFormat="",
    scheme_name="Bearer Token from Dynamic",
    auto_error=False,
)

TokenDepends = Annotated[HTTPAuthorizationCredentials | None, Security(auth_scheme)]


def parse_jwt(required: bool = True):
    def parse_jwt_helper(token: TokenDepends) -> dict[str, Any] | None:
        """
        Standard JWTs contains the aud, iss, sub, iat, and exp fields.
        Dynamic adds the fields email, environment_id, given_name, family_name, lists, verified_credentials, verified_accounts.
        See https://docs.dynamic.xyz/authentication-methods/auth-tokens
        params:
        token (HTTPAuthorizationCredentials): JWT token
        returns:
        payload (dict | None): user credentials details if token is provided
        raises:
        HTTPException with status code 401 unauthorized
        """
        if not token:
            if required:
                raise HTTPException(detail="No token was provided", status_code=401)
            return None
        try:
            decoded_token = decode_bearer_token(token.credentials)
        except PyJWTError:
            raise HTTPException(detail="Failed to decode token", status_code=401)

        payload: dict[str, Any] | None = decoded_token.get("payload")
        if not payload:
            raise HTTPException(
                detail="Expected payload in token",
                status_code=401,
            )

        return payload

    return parse_jwt_helper


def get_user_from_token(required: bool = True):
    def get_user_helper(payload: Annotated[dict[str, Any] | None, Security(parse_jwt(required))]) -> User | None:
        """
        Retrieve a user using their JWT
        params:
        token (HTTPAuthorizationCredentials): JWT token
        returns:
        user (User | None | 404)
        """
        if not payload:
            if required:
                raise HTTPException(detail="No token was provided", status_code=401)
            return None
        subject = payload.get("sub")
        if not subject:
            raise ValueError()
        dynamic_user_id: UUID = UUID(subject)

        with Session() as session:
            user = crud.get_user_by_dynamic_id(session, dynamic_id=dynamic_user_id)
            if required:
                user = obj_or_404(user, User)

        return user

    return get_user_helper


def get_wallets_from_token(required: bool = True):
    def get_wallets_helper(
        payload: Annotated[dict[str, Any] | None, Security(parse_jwt(required))],
    ) -> list[Wallet] | None:
        """
        Retrieve a wallet based on its JWT
        params:
        token (HTTPAuthorizationCredentials): JWT token
        raises:
        HTTPException with status code 401 unauthorized
        """
        if not payload:
            if required:
                raise HTTPException(detail="No token was provided", status_code=401)
            return None
        credentials: list[dict[str, Any]] | None = payload.get("verified_credentials")
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
                if wallet:
                    wallets.append(wallet)

        return wallets

    return get_wallets_helper


def check_scopes(
    *required_permissions: str,
    required: bool = True,
):
    def helper(
        payload: Annotated[dict[str, Any] | None, Security(parse_jwt(required))],
    ) -> None:
        """
        Check if a user has the necessary permissions.
        raises:
        HTTPException with status code 403 forbidden
        """
        if not payload:
            if required:
                raise HTTPException(detail="No token was provided", status_code=401)
            return None
        payload_access_list: list[str] = payload.get("lists", [])
        if missing_permissions := (set(required_permissions) - set(payload_access_list)):
            raise HTTPException(
                detail=f"Missing permissions: {missing_permissions}",
                status_code=403,
            )

        return None

    return helper


def get_scopes(
    payload: Annotated[dict[str, Any] | None, Security(parse_jwt(False))],
) -> set[str]:
    """
    Optional security, does not throw if no token
    """
    if not payload:
        return set()
    scopes_list = payload.get("lists", [])
    return set(scopes_list)


def get_is_admin(
    payload: Annotated[dict[str, Any] | None, Security(parse_jwt(False))],
) -> bool:
    """
    Optional security, does not throw if no token
    """
    if not payload:
        return False
    scopes = set(payload.get("lists", []))
    return "admin" in scopes

IsAdminDepends = Annotated[bool, Security(get_is_admin)]


def get_is_admin_or_owner(
    is_admin: IsAdminDepends,
    user: Annotated[User | None, Security(get_user_from_token(False))]
) -> Callable[[UUID], bool]:
    """
    Optional security, does not throw if no token
    """
    def helper(maybe_id: UUID) -> bool:
        return is_admin or (user is not None and maybe_id == user.id)
    return helper

IsAdminOrOwnerDepends = Annotated[Callable[[UUID], bool], Security(get_is_admin_or_owner)]