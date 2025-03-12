from celery import Celery

# from src.celeryconfig import CELERY_CONFIG
from src.db.setup import SQLALCHEMY_DATABASE_URL

print(SQLALCHEMY_DATABASE_URL)
app = Celery(
    "tasks",
    broker="redis://localhost",
    backend=f"db+{SQLALCHEMY_DATABASE_URL}",
)
app.config_from_object("src.celeryconfig")


@app.task
def add(x, y):
    return x + y
