import logging
import os
from logging import getLogger

from dotenv import load_dotenv

env_path = os.path.join(os.getcwd(), ".env")
load_dotenv(dotenv_path=env_path)

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = getLogger(__name__)

logger.info(f"Loading environment variables from {env_path}")
