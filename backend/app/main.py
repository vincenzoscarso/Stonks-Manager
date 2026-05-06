from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.routes.user_routes import router as user_router
from backend.app.routes.account_routes import router as account_router
from backend.app.routes.category_routes import router as category_router
from backend.app.routes.transaction_routes import router as transaction_router
from backend.app.routes.ai_routes import router as ai_router
from backend.app.utils.rate_limiter import RateLimitMiddleware


def createApp() -> FastAPI:
    app = FastAPI(title="Stonks Manager Backend")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_middleware(RateLimitMiddleware)
    app.include_router(user_router, prefix="/api")
    app.include_router(account_router, prefix="/api")
    app.include_router(category_router, prefix="/api")
    app.include_router(transaction_router, prefix="/api")
    app.include_router(ai_router, prefix="/ai")
    return app


app = createApp()
