from datetime import datetime
from pathlib import Path
import json
import os

from fastapi import APIRouter
from web3 import AsyncHTTPProvider, AsyncWeb3

from src.db import crud, Session
from src.db.models import (
    TokenSymbol,
    TokenSymbolBase,
    TokenSymbolUpdate,
    TokenTimeseries,
    TokenTimeseriesBase,
)
from src.routers.utils import obj_or_404

router = APIRouter()


@router.post('/symbols')
async def insert_symbol(token_info: TokenSymbolBase) -> TokenSymbol:
    with Session() as session:
        return crud.create_token_symbol(session, token_info)


@router.patch('/symbols/{symbol}')
async def update_symbol(symbol: str, update: TokenSymbolUpdate) -> TokenSymbol:
    with Session() as session:
        token_symbol = obj_or_404(
            crud.get_token_symbol_by_name_or_ticker(session, symbol),
            TokenSymbol,
            symbol,
        )

        return crud.update_token_symbol(session, token_symbol, update)


@router.delete('/symbols/{symbol}')
async def delete_symbol(symbol: str):
    with Session() as session:
        token_symbol = obj_or_404(
            crud.get_token_symbol_by_name_or_ticker(session, symbol),
            TokenSymbol,
            symbol,
        )

        crud.delete_token_symbol(session, token_symbol)


@router.post('/history')
async def insert_timeseries(timeseries: TokenTimeseriesBase) -> TokenTimeseries:
    with Session() as session:
        return crud.create_token_timeseries(session, timeseries)


async def collect_timeseries():
    SEI_RPC_URL = os.getenv("SEI_RPC_URL")
    BONDING_CONTRACT_ADDRESS = os.getenv("BONDING_CONTRACT_ADDRESS")
    if not SEI_RPC_URL or not BONDING_CONTRACT_ADDRESS:
        raise ValueError(
            "SEI_RPC_URL or BONDING_CONTRACT_ADDRESS not set"
        )

    w3 = AsyncWeb3(AsyncHTTPProvider(SEI_RPC_URL))
    if not await w3.is_connected():
        raise ConnectionError("Failed to connect to Sei Network")

    bonding_json_path = Path(__file__).resolve().parents[1].joinpath('contracts/bonding.json')
    if not bonding_json_path.exists():
        raise FileNotFoundError(f"Bonding contract ABI not found at {bonding_json_path}")

    with Session() as session, open(bonding_json_path, "r") as f:
        contract_json = json.load(f)
        abi: list[dict] = contract_json["abi"]
        bytecode = contract_json["bytecode"]
        contract = w3.eth.contract(
            address=BONDING_CONTRACT_ADDRESS,
            abi=abi,
            bytecode=bytecode,
        )

        for token in crud.get_token_symbols(session):
            token_info = (await contract.functions.tokenInfo(token.address).call())[3]
            timeseries = TokenTimeseries(
                time=datetime.now(),
                ticker=token.ticker,
                supply=token_info[5],
                price=token_info[6],
                market_cap=token_info[7],
                liquidity=token_info[8],
                volume=token_info[9],
            )
            session.add(timeseries)
        session.commit()