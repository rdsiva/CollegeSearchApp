import os
import time as _time
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.limiter import limiter
from app.routers import search, colleges, export, chat

load_dotenv()

IS_PRODUCTION = os.getenv("ENVIRONMENT", "development") == "production"

# ---------------------------------------------------------------------------
# App — disable interactive docs in production
# ---------------------------------------------------------------------------
app = FastAPI(
    title="College Research Assistant API",
    version="1.0.0",
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None if IS_PRODUCTION else "/redoc",
    openapi_url=None if IS_PRODUCTION else "/openapi.json",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ---------------------------------------------------------------------------
# Security headers middleware
# ---------------------------------------------------------------------------
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        if IS_PRODUCTION:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# ---------------------------------------------------------------------------
# CORS — lock down origins in production
# ---------------------------------------------------------------------------
cors_origin = os.getenv("CORS_ORIGIN", "http://localhost:5173")
allowed_origins = [cors_origin]
if not IS_PRODUCTION:
    allowed_origins.append("http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(search.router, prefix="/api", tags=["Search"])
app.include_router(colleges.router, prefix="/api", tags=["Colleges"])
app.include_router(export.router, prefix="/api", tags=["Export"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])


_START_TIME = _time.time()


@app.get("/")
async def root():
    return {"message": "College Research Assistant API", "status": "ok"}


@app.get("/health")
async def health():
    """Keep-alive + health check endpoint — safe to poll from external cron."""
    return {
        "status": "healthy",
        "uptime_seconds": round(_time.time() - _START_TIME),
        "environment": os.getenv("ENVIRONMENT", "development"),
    }
