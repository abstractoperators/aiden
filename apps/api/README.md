# AIDEN API

This subdirectory contains the API component for the AIDEN protocol. It is written using FAST API.

`./server.py` contains the entrypoints and routes.

## Compiling and Running

Run `make run-api` to start a docker container hosting the API. (Make sure that your local docker daemon is running beforehand)

The API should be exposed on port 80 by default. Once the API is successfully deployed, you can go to localhost/docs to see a list of endpoints.

## Token Deployment

Send a `POST` request to `http://localhost/api/deploy-token` to deploy a new instance of the Bonding Curve Token.
The endpoint takes in a request body with a name and ticker.

```json
{
  "name": "moose",
  "ticker": "$MOOSE"
}
```

To set up this endpoint, ensure that the environment variables `SEI_RPC_URL` and `TOKEN_DEPLOYER_PRIVATE_KEY` are set.

## Development

There is a ruff precommit for basic linting.
Use mypy for type checking. Either run `uv run mypy src` in this directory or `make mypy` in the root directory.
Similarly, use pytest for testing. Run `uv run pytest src` in this directory or `make pytest` in the root directory.

### Alembic

Alembic will be automatically run on api server start.
Generate a new migration by running `uv run alembic revision --autogenerate -m "migration message"`. Update the generated migration file as needed.
