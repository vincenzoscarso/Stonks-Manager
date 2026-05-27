import os
from pathlib import Path
from dotenv import load_dotenv


PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
load_dotenv(dotenv_path=PROJECT_ROOT / ".env", override=True)


def getEnvVariable(name: str) -> str:
    """
    Utility that returns the specified environment variable.
    """

    value = os.getenv(name)
    if value is None:
        raise EnvironmentError(f"Missing required environment variable: {name}")

    return value
