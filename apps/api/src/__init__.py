import os
from logging import getLogger

from dotenv import load_dotenv

logger = getLogger(__name__)

dir_path = os.path.dirname(os.path.realpath(__file__))
env_path = os.path.join(dir_path, ".env.api")
load_dotenv(dotenv_path=env_path)
logger.info(f"Loading environment variables from {env_path}")
