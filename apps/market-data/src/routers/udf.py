from decimal import Decimal
from time import time
from typing import Sequence

from fastapi import APIRouter, HTTPException

from src.db import crud, Session
from src.db.models import TokenTimeseriesBase, TokenTimeseries, TokenSymbol, TokenSymbolBase
from src.routers.utils import obj_or_404

router = APIRouter()

supported_resolutions = {
    '1': 'minute',
    '60': 'hour',
    'D': 'day',
    'W': 'week',
    'M': 'month',
    '3M': 'quarter',
    '12M': 'year',
}

@router.get('/config')
async def get_config() -> dict[str, bool | list[str]]:
    return {
        'supported_resolutions': list(supported_resolutions.keys()),
        'supports_search': True,
        'supports_group_request': False,
    }


@router.get('/time')
async def get_time() -> int:
    return int(time())


@router.get('/symbols')
async def resolve_symbol(symbol: str) -> TokenSymbol:
    with Session() as session:
        return obj_or_404(
            crud.get_token_symbol_by_name_or_ticker(session, symbol),
            TokenSymbol,
            symbol,
        )


@router.post('/symbols')
async def insert_token(token_info: TokenSymbolBase) -> TokenSymbol:
    with Session() as session:
        return crud.create_token_symbol(session, token_info)


@router.get('/history')
async def get_history(
    symbol: str,
    to: float,
    resolution: str,
    from_: float | None = None,
    countback: int | None = None,
) -> dict[str, str | Decimal | float | Sequence[float] | Sequence[Decimal]]:
    if not from_ and not countback:
        raise HTTPException(status_code=400, detail=f"At least one of 'countback' or 'from' must be set")
    if resolution not in supported_resolutions:
        raise HTTPException(status_code=400, detail=f'Unsupported resolution: {resolution}')
    # 'countback' takes precedence over 'from'
    # TODO: fix countback and use resolution
    with Session() as session:
        token_symbol = crud.get_token_symbol_by_name_or_ticker(session, symbol)
        if not token_symbol:
            return {
                's': 'error',
                'errmsg': f'Token by name or ticker of {symbol} not found!',
            }
        timeseries = crud.get_token_timeseries(
            session,
            token_symbol.ticker,
            supported_resolutions[resolution],
            to,
            start=from_,
            limit=countback,
        )

        times: list[float] = []
        prices: list[Decimal] = []
        volumes: list[Decimal] = []
        for t in timeseries:
            times.append(t[0].timestamp())
            prices.append(t[1])
            volumes.append(t[2])

        if any([len(seq) == 0 for seq in (times, prices, volumes)]):
            return { 's': 'no_data' }
        return {
            's': 'ok',
            't': times if len(times) > 1 else times[0],
            'c': prices if len(prices) > 1 else prices[0],
            'v': volumes if len(volumes) > 1 else volumes[0],
        }


@router.post('/history')
async def insert_timeseries(timeseries: TokenTimeseriesBase) -> TokenTimeseries:
    with Session() as session:
        return crud.create_token_timeseries(session, timeseries)