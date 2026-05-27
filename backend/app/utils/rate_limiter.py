import time
from typing import Dict, List
from collections import defaultdict
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from backend.app.config.configuration import RATE_LIMIT_GENERIC, RATE_LIMIT_AI, RATE_LIMIT_WINDOW_SECONDS


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app,
        generic_limit: int = RATE_LIMIT_GENERIC,
        ai_limit: int = RATE_LIMIT_AI,
        window_seconds: int = RATE_LIMIT_WINDOW_SECONDS,
    ):
        super().__init__(app)
        self.generic_limit = generic_limit
        self.ai_limit = ai_limit
        self.window_seconds = window_seconds

        self.request_history: Dict[str, Dict[str, List[float]]] = defaultdict(lambda: {"generic": [], "ai": []})

    def _get_client_identifier(self, request: Request) -> str:
        auth_header = request.headers.get("Authorization")
        return auth_header if auth_header else "anonymous"

    def _get_route_category(self, request: Request) -> str:
        return "ai" if request.url.path.startswith("/ai/") else "generic"

    def _get_limit_for_category(self, category: str) -> int:
        return self.ai_limit if category == "ai" else self.generic_limit

    def _is_rate_limited(self, client_id: str, category: str) -> bool:
        current_time = time.time()
        client_category_history = self.request_history[client_id][category]

        window_start_time = current_time - self.window_seconds
        active_requests = [timestamp for timestamp in client_category_history if timestamp > window_start_time]

        self.request_history[client_id][category] = active_requests

        max_allowed_requests = self._get_limit_for_category(category)
        return len(active_requests) >= max_allowed_requests

    def _record_request(self, client_id: str, category: str) -> None:
        self.request_history[client_id][category].append(time.time())

    async def dispatch(self, request: Request, call_next):
        client_id = self._get_client_identifier(request)
        route_category = self._get_route_category(request)

        if self._is_rate_limited(client_id, route_category):
            return JSONResponse(
                status_code=429, content={"detail": f"Rate limit exceeded for {route_category} requests. Try again later."}
            )

        self._record_request(client_id, route_category)

        return await call_next(request)
