from fastapi import FastAPI

from app.routes.user_routes import router as user_router
from app.routes.account_routes import router as account_router
from app.routes.category_routes import router as category_router
from app.routes.transaction_routes import router as transaction_router
from app.routes.ai_routes import router as ai_router
from app.utils.rate_limiter import RateLimitMiddleware


def createApp() -> FastAPI:
    app = FastAPI(title="Stonks Manager Backend")
    app.add_middleware(RateLimitMiddleware)
    app.include_router(user_router, prefix="/api")
    app.include_router(account_router, prefix="/api")
    app.include_router(category_router, prefix="/api")
    app.include_router(transaction_router, prefix="/api")
    app.include_router(ai_router, prefix="/ai")
    return app


app = createApp()
