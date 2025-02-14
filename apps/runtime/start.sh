echo "Starting nginx"
nginx -g "daemon off;" &


echo "Starting fastapi server"
cd /app/apps/runtime
uv run uvicorn src.server:app --host 0.0.0.0 --port 8000