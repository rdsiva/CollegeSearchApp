"""In-memory async job queue for college research.

Decouples slow LLM-backed research from the HTTP request/response cycle.
A POST creates a job and returns its id immediately; the client polls
GET /api/colleges/research/job/{id} for state and partial results.

Process-local. Jobs auto-expire after JOB_TTL_SECS once finished.
"""
import asyncio
import logging
import time
import uuid
from typing import Any

log = logging.getLogger(__name__)

MAX_JOBS = 200
JOB_TTL_SECS = 600  # 10 min after finish

_jobs: dict[str, dict] = {}


def _cleanup() -> None:
    now = time.time()
    for jid in [j for j, v in _jobs.items()
                if v.get("finished_at") and now - v["finished_at"] > JOB_TTL_SECS]:
        _jobs.pop(jid, None)
    if len(_jobs) > MAX_JOBS:
        oldest = sorted(_jobs.items(), key=lambda x: x[1]["started_at"])[: len(_jobs) - MAX_JOBS]
        for k, _ in oldest:
            _jobs.pop(k, None)


async def _run_job(job_id: str, codes: list[str]) -> None:
    # Late import — research_one lives in routers/colleges and importing at module
    # load time would create a circular dependency.
    from app.routers.colleges import research_one

    job = _jobs[job_id]
    job["status"] = "running"

    async def _one(code: str) -> None:
        try:
            detail = await research_one(code)
            job["results"][code] = detail.model_dump(mode="json")
        except Exception as exc:
            log.exception("research job %s code %s failed", job_id, code)
            job["errors"][code] = str(exc)
        finally:
            job["completed"].append(code)
            job["last_update"] = time.time()

    await asyncio.gather(*(_one(c) for c in codes), return_exceptions=True)
    job["status"] = "failed" if len(job["errors"]) == len(codes) else "completed"
    job["finished_at"] = time.time()
    job["last_update"] = job["finished_at"]


def start_job(codes: list[str]) -> dict:
    _cleanup()
    job_id = uuid.uuid4().hex[:12]
    now = time.time()
    _jobs[job_id] = {
        "id": job_id,
        "codes": list(codes),
        "status": "queued",
        "started_at": now,
        "last_update": now,
        "finished_at": None,
        "results": {},        # code -> CollegeDetail dump
        "errors": {},         # code -> error message
        "completed": [],      # codes that have finished (success or error)
    }
    asyncio.create_task(_run_job(job_id, codes))
    return public_view(_jobs[job_id])


def get_job(job_id: str) -> dict | None:
    job = _jobs.get(job_id)
    return public_view(job) if job else None


def public_view(job: dict) -> dict:
    """Shape sent to the frontend on every poll."""
    return {
        "id": job["id"],
        "codes": job["codes"],
        "status": job["status"],
        "started_at": job["started_at"],
        "finished_at": job["finished_at"],
        "completed": list(job["completed"]),
        "results": list(job["results"].values()),
        "errors": dict(job["errors"]),
        "progress": {
            "done": len(job["completed"]),
            "total": len(job["codes"]),
        },
    }
