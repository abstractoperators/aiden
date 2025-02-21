import os
from logging import getLogger

from dotenv import load_dotenv

dir_path = os.path.dirname(os.path.realpath(__file__))
env_path = os.path.join(dir_path, ".env.api")
load_dotenv(dotenv_path=env_path)
print("loading .env.api @", env_path)

print(os.getenv("POSTGRES_DB_PASSWORD"))


logger = getLogger(__name__)
