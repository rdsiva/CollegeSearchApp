import re
from fastapi import APIRouter, Request
from pydantic import BaseModel, Field, field_validator
from app.services import metrics_store
from app.limiter import limiter

router = APIRouter()


class HeartbeatRequest(BaseModel):
    session_id: str = Field(..., min_length=8, max_length=64)
    path: str = Field("/", max_length=80)

    @field_validator("session_id")
    @classmethod
    def validate_session_id(cls, v: str) -> str:
        if not re.match(r"^[A-Za-z0-9_-]+$", v):
            raise ValueError("invalid session_id")
        return v


@router.post("/metrics/heartbeat")
@limiter.limit("60/minute")
async def heartbeat(request: Request, req: HeartbeatRequest):
    country = (
        request.headers.get("CF-IPCountry")
        or request.headers.get("cf-ipcountry")
        or "??"
    )
    await metrics_store.record_heartbeat(req.session_id, req.path, country)
    return {"ok": True}


@router.get("/metrics/stats")
@limiter.limit("60/minute")
async def stats(request: Request):
    return await metrics_store.snapshot()
