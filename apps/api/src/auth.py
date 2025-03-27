import os
from typing import Any
from uuid import UUID

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer  # OAuth2PasswordBearer
from jwt import PyJWK, PyJWKClient, PyJWT
from jwt.exceptions import PyJWTError

from src.db import Session, crud
from src.db.models import User
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
    Decodes a JWT token and returns its payload
    jwt_token (str): JWT token to decode - does not include the "Bearer " prefix
    Raises an jwt.exceptions.PyJWTError if the token is invalid
    """
    signing_key: PyJWK = pyjwk_client.get_signing_key_from_jwt(jwt_token)

    return py_jwt.decode_complete(jwt_token, signing_key, leeway=10)


# This guy basically just checks for Authorization header.
auth_scheme = HTTPBearer(
    bearerFormat="",
    scheme_name="Bearer Token from Dynamic",
    auto_error=False,
)
# tokenUrl="", auto_error=False
# )  # Made by Dynamic - there is no tokenUrl


def get_user_from_token(
    request: Request,
    token: str = Depends(auth_scheme),
) -> User:
    """
    If the JWT token is valid, returns the User object associated with the token
    Otherwise, raises an HTTPException with status code 401
    request (Request): FastAPI Request object TODO Remove it after debugging
    token (str): JWT token to decode representing a user claim.
    """
    print("request.headers:", request.headers)
    print("token:", token)
    if not token:
        raise HTTPException(detail="No token was provided", status_code=401)
    try:
        decoded_token = decode_bearer_token(token.credentials)
    except PyJWTError:
        raise HTTPException(detail="Failed to decode token", status_code=401)

    payload = decoded_token.get("payload")
    if not payload:
        raise ValueError()
    subject = payload.get("sub")
    if not subject:
        raise ValueError()
    dynamic_user_id: UUID = UUID(subject)
    print(f"dynamic_user_id: {dynamic_user_id}")

    # For now, assume the user already exists
    with Session() as session:
        user: User = obj_or_404(
            crud.get_user_by_dynamic_id(session, dynamic_id=dynamic_user_id), User
        )

    return user
