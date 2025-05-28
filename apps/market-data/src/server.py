from contextlib import asynccontextmanager

from fastapi import FastAPI

from src import logger
from src.db.setup import init_db, test_db_connection
from src.routers.udf import router as udf_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    if test_db_connection():
        logger.info("DB Connection Successful")
    else:
        logger.error("DB Connection Failed")
        raise Exception("DB Connection Failed")
    yield


app = FastAPI(title='AIDN Market Data API', lifespan=lifespan)
app.include_router(udf_router, prefix='')


@app.get("/ping")
async def ping():
    """
    pong
    """
    return "pong"
