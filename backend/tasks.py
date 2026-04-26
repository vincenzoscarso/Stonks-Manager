import os, shutil, subprocess
from invoke.tasks import task
from invoke.context import Context
from dotenv import load_dotenv

SEPARATOR = "-" * 90
MAIN_FILE = ".\\app\\main.py"
PYTHON = ".venv\\Scripts\\python.exe"


@task
def run(c: Context):
    """Simply runs the code."""

    __clearScreen()

    c.run(f"uvicorn app.main:app --reload")


@task
def clean(c: Context):
    """Deletes '*.pytest_cache' and every '__pycache__' folder inside this directory."""
    __clearScreen()
    __clean(c)


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
