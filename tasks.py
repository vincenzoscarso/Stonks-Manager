import os, shutil, subprocess
from invoke.tasks import task
from invoke.context import Context
from dotenv import load_dotenv

SEPARATOR = "-" * 90
MAIN_FILE = ".\\backend\\app\\main.py"
PYTHON = ".venv\\Scripts\\python.exe"
ENV_PATH = "..\\.env"


@task
def run(c: Context):
    """Simply runs the code."""

    __clearScreen()

    c.run(f"uvicorn backend.app.main:app --reload")


@task
def routeTest(c: Context):
    """Runs a script that tests each route one by one. Requires human intervention."""

    __clearScreen()

    c.run("python -m tests.full_routes_test")


@task
def clean(c: Context):
    """Deletes '*.pytest_cache' and every '__pycache__' folder inside this directory."""

    __clearScreen()
    __clean(c)


@task
def checkLeaks(c: Context):
    """Checks Git history for any secrets defined in .env."""
    __clearScreen()

    __printMessageWithSeparator("SCANNING GIT HISTORY FOR SECRETS FROM .ENV")

    if not os.path.exists(ENV_PATH):
        print(f"Error: {ENV_PATH} not found.")
        return
    secrets = {}
    with open(ENV_PATH, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                value = value.strip("'\"")

                # We only check values longer than 3 chars to avoid noise
                if value and len(value) > 3:
                    secrets[key] = value

    if not secrets:
        print("No significant secrets found in .env to check.")
        return

    found_any = False

    for key, value in secrets.items():
        print(f"Checking for {key}...", end=" ", flush=True)
        # git log -S finds commits where the number of occurrences of 'value' changed
        result = subprocess.run(
            ["git", "log", "--all", "-S", value, "--oneline"],
            capture_output=True,
            text=True,
        )

        if result.stdout.strip():
            print("\n\n" + "!" * 90)
            print(f"POSSIBLE COMPROMISE: '{key}' found in history:")
            print(result.stdout.strip())
            print("!" * 90 + "\n")
            found_any = True
        else:
            print("Clean")
    print(SEPARATOR)

    if not found_any:
        print("SUCCESS: No secrets from .env were found in Git history.")
    else:
        print("DANGER: Some secrets were found in your Git history!")
        print("        Consider rotating these secrets and cleaning the history.")
    print(SEPARATOR)


## helper functions ####################################################################################################


def __clean(c: Context):
    c.run("powershell Remove-Item -r '*.pytest_cache'", echo=True)
    c.run("powershell Remove-Item -r '*.pyc'", echo=True)
    __removePycacheFolders(".\\")
    __printMessageWithSeparator("Cleaned cache")


def __removePycacheFolders(directory: str):
    for root, dirs, _ in os.walk(directory):
        if "__pycache__" in dirs:
            pycache_path = os.path.join(root, "__pycache__")
            shutil.rmtree(pycache_path)
            print(f"Removed: {pycache_path}")


def __printMessageWithSeparator(msg: str):
    print(SEPARATOR)
    print(msg)
    print(SEPARATOR)


def __clearScreen():
    subprocess.run("cls", shell=True)
