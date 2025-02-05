from fastapi import FastAPI, Request

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/agents/{agent_id}")
async def get_agent(agent_id: int):
    return {"agent_id": agent_id}


@app.get("/agents/{agent_id}/chat")
async def get_agent_chat(agent_id: int, request: Request):
    request_body = await request.json()
    message = request_body["message"]
    return {"agent_id": agent_id, "message": message}
