from fastapi import FastAPI

from app.routes.user_routes import router as user_router
from app.routes.account_routes import router as account_router
from app.routes.category_routes import router as category_router
from app.routes.transaction_routes import router as transaction_router

def createApp() -> FastAPI:
    app = FastAPI(title="Stonks Manager Backend")
    app.include_router(user_router, prefix="/api")
    app.include_router(account_router, prefix="/api")
    app.include_router(category_router, prefix="/api")
    app.include_router(transaction_router, prefix="/api")
    return app


app = createApp()
