import os
from dotenv import load_dotenv

ENV_PATH = "C:\\Users\\vince\\Desktop\\Code\\_Projects\\Stonks-Manager\\.env"

load_dotenv(dotenv_path=ENV_PATH, override=True)


def getEnvVariable(name: str) -> str:
    """
    Utility that returns the specified environment variable.
    """

    value = os.getenv(name)
    if value is None:
        raise EnvironmentError(f"Missing required environment variable: {name}")

    return value
