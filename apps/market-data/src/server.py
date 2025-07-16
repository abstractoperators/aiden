from contextlib import asynccontextmanager
import os

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src import logger
from src.db.setup import init_db, test_db_connection
from src.routers.crud import collect_timeseries, router as crud_router
from src.routers.udf import router as udf_router


scheduler = AsyncIOScheduler()
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    if test_db_connection():
        logger.info("DB Connection Successful")
    else:
        logger.error("DB Connection Failed")
        raise Exception("DB Connection Failed")
    scheduler.add_job(
        collect_timeseries,
        'interval',
        seconds=60,
        id='collect_timeseries_job',
        replace_existing=True,
    )
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(title='AIDN Market Data API', lifespan=lifespan)
app.include_router(udf_router, prefix='')
app.include_router(crud_router, prefix='')


allow_origins = []
env = os.getenv("ENV")
if env == "dev":
    allow_origins = ["http://localhost:3000", "http://localhost:8001",]
elif env == "staging":
    allow_origins = ["https://staigen.space"]
elif env == "prod":
    allow_origins = ["https://aidn.fun"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/ping")
async def ping():
    """
    pong
    """
    return "pong"
