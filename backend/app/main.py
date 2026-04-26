from fastapi import FastAPI

from app.routes.user_routes import router as user_router

def create_app() -> FastAPI:
    app = FastAPI(title="Stonks Manager Backend")
    app.include_router(user_router, prefix="/api")
    return app


app = create_app()
