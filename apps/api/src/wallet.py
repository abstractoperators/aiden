# import requests  # type: ignore
# from jwt import

# url = "https://app.dynamic.xyz/api/v0/sdk/2c6dd185-953d-411c-a7a7-dfd109b611c9/.well-known/jwks"
# jwks_client = PyJWKClient(url)

# with open("dynamic_pub_key.pub", "r") as f:
#     dynamic_pub_key = f.read().strip()


# def fetch_jwt_token(jwks_url: str):
#     resp = requests.get(jwks_url)
#     jwks = resp.json()
#     return jwks
