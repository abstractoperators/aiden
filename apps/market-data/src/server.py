from fastapi import FastAPI
from src.routers.udf import router as udf_router


app = FastAPI(title='AIDN Market Data API')
app.include_router(udf_router, prefix='')


@app.get("/ping")
async def ping():
    """
    pong
    """
    return "pong"
