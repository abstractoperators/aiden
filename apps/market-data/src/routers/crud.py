from fastapi import APIRouter

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
