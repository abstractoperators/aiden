from datetime import datetime
from decimal import Decimal
from enum import Enum

from sqlmodel import Column, Enum as SQLEnum, Field, SQLModel, TIMESTAMP

# region Base
class Base(SQLModel):
    def __repr__(self) -> str:
        return self.model_dump_json(
            indent=4,
            exclude_unset=True,
            exclude_none=True,
        )


# endregion Base
# region Symbol
def get_enum_values(enum_class: type[Enum]) -> list[str]:
    """Get values for enum."""
    return [status.value for status in enum_class]


class TokenSymbolFormat(str, Enum):
    PRICE = "price"
    VOLUME = "volume"


class TokenSymbolType(str, Enum):
    STOCK = "stock"
    INDEX = "index"
    FOREX = "forex"
    FUTURES = "futures"
    BITCOIN = "bitcoin"
    CRYPTO = "crypto"
    UNDEFINED = "undefined"
    EXPRESSION = "expression"
    SPREAD = "spread"
    CFD = "cfd"
    ECONOMIC = "economic"
    EQUITY = "equity"
    DR = "dr"
    BOND = "bond"
    RIGHT = "right"
    WARRANT = "warrant"
    FUND = "fund"
    STRUCTURED = "structured"
    COMMODITY = "commodity"
    FUNDAMENTAL = "fundamental"
    SPOT = "spot"
    SWAP = "swap"
    OPTION = "option"


class TokenSymbolBase(Base):
    description: str = Field(
        description="Description of the token",
        default="",
    )
    exchange: str = Field(
        description="Exchange on which the token is traded.  The name will be displayed in the chart legend for this token.",
        default="DragonSwap",
    )
    has_intraday: bool = Field(
        description="Flag indicating intraday (minutes) data for this symbol.",
        default=True,
    )
    format: TokenSymbolFormat = Field(
        description="Format of displaying labels on the price scale. Can be 'price' or 'volume'.",
        default=TokenSymbolFormat.PRICE,
        sa_column=Column(SQLEnum(TokenSymbolFormat, values_callable=get_enum_values)),
    )
    listed_exchange: str = Field(
        description="Short name for the exchange on which the token is traded. The name will be displayed in the chart legend for this token.",
        default="DragonSwap",
        max_length=32,
    )
    minmov: int = Field(
        description="Number of units that make up one tick.",
        default=1,
    )
    name: str = Field(
        description="Token name. Note that it should not contain the exchange name. This token name is visible to users and can be repeated."
    )
    pricescale: int = Field(
        description="A number of decimal places or fractions that the price has. Must be a power of ten (for decimal places) or two (for fractions).",
        default=1000,
    )
    session: str = Field(
        description="Trading hours for the token.",
        default="24x7",
    )
    ticker: str = Field(
        description="Unique identifier for the token.",
        max_length=32,
        unique=True,
        primary_key=True,
    )
    timezone: str = Field(
        description="The timezone of the exchange where the token is listed. Should be in OlsonDB Format.",
        default="America/New_York",
        max_length=50,
    )
    type: TokenSymbolType = Field(
        description="Type of the instrument.",
        default=TokenSymbolType.CRYPTO,
        sa_column=Column(SQLEnum(TokenSymbolType, values_callable=get_enum_values)),
    )


class TokenSymbolUpdate(Base):
    description: str | None = Field(
        description="Description of the token",
        default=None,
    )
    exchange: str | None = Field(
        description="Exchange on which the token is traded.  The name will be displayed in the chart legend for this token.",
        default=None,
    )
    has_intraday: bool | None = Field(
        description="Flag indicating intraday (minutes) data for this symbol.",
        default=None,
    )
    format: TokenSymbolFormat | None = Field(
        description="Format of displaying labels on the price scale. Can be 'price' or 'volume'.",
        default=None,
    )
    listed_exchange: str | None = Field(
        description="Short name for the exchange on which the token is traded. The name will be displayed in the chart legend for this token.",
        default=None,
        max_length=32,
    )
    minmov: int | None = Field(
        description="Number of units that make up one tick.",
        default=None,
    )
    pricescale: int | None = Field(
        description="A number of decimal places or fractions that the price has. Must be a power of ten (for decimal places) or two (for fractions).",
        default=None,
    )
    session: str | None = Field(
        description="Trading hours for the token.",
        default=None,
    )
    timezone: str | None = Field(
        description="The timezone of the exchange where the token is listed. Should be in OlsonDB Format.",
        default=None,
        max_length=50,
    )
    type: TokenSymbolType | None = Field(
        description="Type of the instrument.",
        default=None,
    )


class TokenSymbol(TokenSymbolBase, table=True):
    pass


# endregion Symbol
# region Timeseries
class TokenTimeseriesBase(Base):
    time: datetime = Field(
        sa_column=Column(
            TIMESTAMP(timezone=True), primary_key=True
        ),
    )
    ticker: str = Field(
        foreign_key="tokensymbol.ticker",
        description="Ticker associated with token",
        primary_key=True,
    )
    supply: Decimal = Field(
        description="Total amount of token in existence",
        max_digits=78,
        decimal_places=0,
    )
    price: Decimal = Field(
        description="Number of tokens worth one SEI.",
        max_digits=78,
        decimal_places=0,
    )
    market_cap: Decimal = Field(
        description="Market capitalization of token.",
        max_digits=78,
        decimal_places=0,
    )
    liquidity: Decimal = Field(
        description="Liquidity of token",
        max_digits=78,
        decimal_places=0,
    )
    volume: Decimal = Field(
        description="Volume of token",
        max_digits=78,
        decimal_places=0,
    )


class TokenTimeseries(TokenTimeseriesBase, table=True):
    pass


# endregion Timeseries