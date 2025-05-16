from fastapi import APIRouter

router = APIRouter()

@router.get('/config')
async def get_config():
    return {
        'supported_resolutions': ['1', '5', '15', '30', '60', 'D', 'W', 'M', '6M'],
        'supports_time': True,
        'supports_search': True,
        'supports_group_request': False,
    }

@router.get('/symbols')
async def resolve_symbol(symbol: str):
    # placeholder
    return {
        # required
        'description': "Description of the symbol",
        'exchange': 'Demo',
        'format': "price",
        'listed_exchange': "AIDN",
        'minmov': 1,
        'name': symbol,
        'pricescale': 1,
        'session': '24x7',
        'timezone': 'America/New_York',
        'type': 'crypto',

        # optional
    }

@router.get('/history')
async def get_history(symbol: str, from_: int, to: int, resolution: str, countback: int):
    return {
        's': 'no_data',
        'nextTime': 1234567890,
    }
    # from_/to are UNIX seconds
    # async with async_session() as session:
    #     stmt = select('*').where(
    #         Bar.symbol==symbol,
    #         Bar.time >= datetime.datetime.fromtimestamp(from_),
    #         Bar.time <= datetime.datetime.fromtimestamp(to)
    #     ).order_by(Bar.time)
    #     result = await session.execute(stmt)
    #     rows = result.fetchall()
    # if not rows:
    # bars = [
    #     { 'time': int(r.time.timestamp()*1000), 'open': r.open, 'high': r.high,
    #       'low': r.low, 'close': r.close, 'volume': r.volume }
    #     for r in rows
    # ]
    # return {'s': 'ok', 'bars': bars}
