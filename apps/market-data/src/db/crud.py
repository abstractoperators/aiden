from datetime import datetime

# from sqlalchemy import func as sa_func, ScalarResult, select as sa_select
from sqlmodel import func, Session, select, TIMESTAMP

from .models import (
    TokenSymbol,
    TokenSymbolBase,
    TokenTimeseries,
    TokenTimeseriesBase,
)


# region Generics
def create_generic[M](session: Session, model: M) -> M:
    session.add(model)
    session.commit()
    session.refresh(model)
    return model


# endregion Generics
# region Token Symbols
def create_token_symbol(
    session: Session,
    token_symbol: TokenSymbolBase,
) -> TokenSymbol:
    return create_generic(
        session,
        TokenSymbol(**token_symbol.model_dump())
    )


def get_token_symbol_by_name_or_ticker(session: Session, name: str) -> TokenSymbol | None:
    stmt = select(TokenSymbol).where(TokenSymbol.ticker == name)
    by_ticker = session.exec(stmt).first()
    if by_ticker:
        return by_ticker
    stmt = select(TokenSymbol).where(TokenSymbol.name == name)
    return session.exec(stmt).first()


# endregion Token Symbols
# region Token Timeseries
def create_token_timeseries(
    session: Session,
    timeseries: TokenTimeseriesBase,
) -> TokenTimeseries:
    return create_generic(
        session,
        TokenTimeseries(**timeseries.model_dump()),
    )


def get_token_timeseries(
    session: Session,
    ticker: str,
    resolution: str,
    end: float,
    start: float | None = None,
    limit: int | None = None,
):
    stmt = (
        select(
            func.date_trunc(resolution, TokenTimeseries.time, type_=TIMESTAMP(timezone=True)).label('time'),
            func.min(TokenTimeseries.price),
            func.min(TokenTimeseries.volume),
        )
        .where(
            TokenTimeseries.ticker == ticker,
            TokenTimeseries.time < datetime.fromtimestamp(end),
        )
        .group_by('time')
        .order_by('time')
    )
    if limit:
        stmt = stmt.limit(limit)
    elif start:
        stmt = stmt.where(TokenTimeseries.time >= datetime.fromtimestamp(start))
    return session.exec(stmt)


# endregion Token Timeseries