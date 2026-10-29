import time
import uuid
from typing import Dict, Tuple
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from backend.app.core.config import settings

class SecurityAndTracingMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        # In-memory sliding rate limiter: ip -> (count, reset_time)
        self.rate_limit_records: Dict[str, Tuple[int, float]] = {}
        self.rate_limit_per_minute = settings.RATE_LIMIT_PER_MINUTE

    async def dispatch(self, request: Request, call_next) -> Response:
        # 1. Request ID Tracing
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id

        # 2. Rate Limiting on /api/ endpoints (exclude health check)
        if request.url.path.startswith("/api/v1/chat"):
            client_ip = request.client.host if request.client else "127.0.0.1"
            current_time = time.time()
            count, reset_time = self.rate_limit_records.get(client_ip, (0, current_time + 60))

            if current_time > reset_time:
                self.rate_limit_records[client_ip] = (1, current_time + 60)
            else:
                if count >= self.rate_limit_per_minute:
                    return JSONResponse(
                        status_code=429,
                        content={
                            "error": "Rate limit exceeded",
                            "message": "Too many requests. Please slow down and try again in a minute.",
                            "request_id": request_id
                        },
                        headers={"Retry-After": "60", "X-Request-ID": request_id}
                    )
                self.rate_limit_records[client_ip] = (count + 1, reset_time)

        # 3. Process Request
        start_time = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception as exc:
            return JSONResponse(
                status_code=500,
                content={
                    "error": "InternalServerError",
                    "message": "An unexpected error occurred while processing your request.",
                    "request_id": request_id
                },
                headers={"X-Request-ID": request_id}
            )

        # 4. Attach Security & Tracing Headers
        process_time = (time.perf_counter() - start_time) * 1000
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time-Ms"] = f"{process_time:.2f}"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response
