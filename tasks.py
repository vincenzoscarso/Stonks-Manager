import os, shutil, subprocess
from invoke.tasks import task
from invoke.context import Context
from dotenv import load_dotenv

SEPARATOR = "-" * 90
MAIN_FILE = "./backend/app/main.py"
PYTHON = ".venv/Scripts/python.exe"
ENV_PATH = "./.env"



@task
def runFront(c: Context):
    """Simply runs the frontend http server handler."""

    __clearScreen()

    c.run("python ui_server.py")


@task
def runBack(c: Context):
    """Simply runs the backend uvicorn server."""

    __clearScreen()

    c.run("uvicorn backend.app.main:app --host 0.0.0.0 --reload")


@task
def routeTest(c: Context, jwt=False, no_cleanup=False, keep_user=False):
    """Runs a script that tests each route one by one. Requires human intervention.
    
    Options:
        --jwt: Only retrieve JWT token without running tests
        --no-cleanup: Skip cleanup of test data after tests
        --keep-user: Keep test user after tests complete
    """

    __clearScreen()

    args = []
    if jwt:
        args.append("--jwt")
    if no_cleanup:
        args.append("--no-cleanup")
    if keep_user:
        args.append("--keep-user")

    cmd = "python -m backend.tests.full_routes_test"
    if args:
        cmd += " " + " ".join(args)

    c.run(cmd)


@task
def clean(c: Context):
    """Deletes '*.pytest_cache' and every '__pycache__' folder inside this directory."""

    __clearScreen()
    __clean(c)


@task
def checkLeaks(c: Context):
    """Checks Git history for any values found in .env."""
    __clearScreen()

    if not os.path.exists(ENV_PATH):
        print("No env file found")
        return

    with open(ENV_PATH, "r") as f:
        lines = f.readlines()

    found_any = False
    for line in lines:
        if "=" in line:
            key, value = line.split("=", 1)
            value = value.strip().strip("'\"")

            if len(value) > 3:
                print(f"Checking {key}...", end=" ", flush=True)

                result = subprocess.run(
                    ["git", "log", "--all", "--fixed-strings", "-S", value, "--oneline"], capture_output=True, text=True
                )

                if result.stdout.strip():
                    print(f"\nFOUND: {key} is in history!\n{result.stdout}")
                    found_any = True
                else:
                    print("Clean")

    if found_any:
        print("\nDANGER: Secrets leaked in history.")
    else:
        print("\nSUCCESS: No leaks found.")


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
    subprocess.run("clear", shell=True)
