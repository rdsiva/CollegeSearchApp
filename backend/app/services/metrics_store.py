"""Hybrid metrics store: in-memory live tracking + Postgres persistence.

- Live users (active in the last ACTIVE_WINDOW_SECS) are tracked in-process.
- Pageview, country, and session deltas accumulate in-memory and flush to
  Postgres every FLUSH_EVERY_SECS via UPSERT (idempotent on collisions).
- Lifetime totals (top pages all-time, unique sessions, pageviews_total) are
  read from Postgres so they survive restarts.

If DATABASE_URL is not set, only in-memory state is used.
"""
import asyncio
import logging
import time
from collections import defaultdict
from datetime import datetime, timezone
from app import db

log = logging.getLogger(__name__)

ACTIVE_WINDOW_SECS = 90
FLUSH_EVERY_SECS = 30
MAX_TRACKED_PATHS = 100
MAX_TRACKED_COUNTRIES = 250
MAX_TRACKED_SESSIONS = 5000

_lock = asyncio.Lock()
_started_at = time.time()
_sessions: dict[str, dict] = {}             # session_id → {last_seen, country, path}
_pending_pageviews: dict[str, int] = defaultdict(int)
_pending_countries: dict[str, int] = defaultdict(int)
_pending_sessions: dict[str, str] = {}       # session_id → country (latest)

_flusher_task: asyncio.Task | None = None
_today_date: str = datetime.now(timezone.utc).date().isoformat()


def _today() -> str:
    return datetime.now(timezone.utc).date().isoformat()


async def record_heartbeat(session_id: str, path: str, country: str | None) -> None:
    if not session_id or len(session_id) > 64:
        return
    path = (path or "/")[:80]
    country = (country or "??")[:2].upper()

    async with _lock:
        now = time.time()
        existing = _sessions.get(session_id)
        is_new_view = existing is None or existing.get("path") != path
        _sessions[session_id] = {"last_seen": now, "country": country, "path": path}

        if is_new_view and (len(_pending_pageviews) < MAX_TRACKED_PATHS or path in _pending_pageviews):
            _pending_pageviews[path] += 1

        if existing is None:
            _pending_sessions[session_id] = country
            if len(_pending_countries) < MAX_TRACKED_COUNTRIES or country in _pending_countries:
                _pending_countries[country] += 1
        else:
            _pending_sessions[session_id] = country  # refresh last_seen on flush

        if len(_sessions) > MAX_TRACKED_SESSIONS:
            cutoff = now - ACTIVE_WINDOW_SECS
            for sid in [s for s, v in _sessions.items() if v["last_seen"] < cutoff]:
                _sessions.pop(sid, None)


async def _flush_once() -> None:
    """Drain in-memory counters into Postgres. Runs every FLUSH_EVERY_SECS."""
    if not db.is_enabled():
        return
    async with _lock:
        pv = dict(_pending_pageviews)
        cc = dict(_pending_countries)
        ses = list(_pending_sessions.items())
        _pending_pageviews.clear()
        _pending_countries.clear()
        _pending_sessions.clear()

    if not (pv or cc or ses):
        return
    try:
        day = _today()
        await db.upsert_pageviews(day, pv)
        await db.upsert_countries(day, cc)
        await db.upsert_sessions(ses)
    except Exception as exc:
        log.warning("metrics flush failed: %s — re-queuing", exc)
        async with _lock:
            for k, v in pv.items():
                _pending_pageviews[k] += v
            for k, v in cc.items():
                _pending_countries[k] += v
            for sid, c in ses:
                _pending_sessions.setdefault(sid, c)


async def _flusher_loop() -> None:
    while True:
        try:
            await asyncio.sleep(FLUSH_EVERY_SECS)
            await _flush_once()
        except asyncio.CancelledError:
            break
        except Exception as exc:
            log.exception("flusher loop error: %s", exc)


def start_flusher() -> None:
    global _flusher_task
    if _flusher_task is None:
        _flusher_task = asyncio.create_task(_flusher_loop())


async def stop_flusher() -> None:
    global _flusher_task
    if _flusher_task is not None:
        _flusher_task.cancel()
        try:
            await _flusher_task
        except asyncio.CancelledError:
            pass
        _flusher_task = None
    await _flush_once()  # drain on shutdown


async def snapshot() -> dict:
    """Compose a public stats payload from in-memory live state + DB aggregates."""
    async with _lock:
        now = time.time()
        cutoff = now - ACTIVE_WINDOW_SECS
        active = [v for v in _sessions.values() if v["last_seen"] >= cutoff]

        live_by_country: dict[str, int] = defaultdict(int)
        live_by_path: dict[str, int] = defaultdict(int)
        for v in active:
            live_by_country[v["country"]] += 1
            live_by_path[v["path"]] += 1

        result = {
            "live_users": len(active),
            "live_by_country": [{"country": c, "count": n} for c, n in sorted(live_by_country.items(), key=lambda x: -x[1])[:10]],
            "live_by_page":    [{"path": p, "count": n} for p, n in sorted(live_by_path.items(), key=lambda x: -x[1])[:10]],
            "uptime_seconds": int(now - _started_at),
            "today_utc": _today(),
            "persistence": "postgres" if db.is_enabled() else "memory_only",
        }

    if db.is_enabled():
        try:
            agg = await db.fetch_aggregates(result["today_utc"])
            result.update(agg)
        except Exception as exc:
            log.warning("DB read failed in snapshot(): %s", exc)
            result.setdefault("pageviews_today", 0)
            result.setdefault("pageviews_total", 0)
            result.setdefault("unique_sessions_total", 0)
            result.setdefault("top_pages_today", [])
            result.setdefault("top_countries_today", [])
            result.setdefault("top_pages_total", [])
    else:
        result.update({
            "pageviews_today": 0,
            "pageviews_total": 0,
            "unique_sessions_total": 0,
            "top_pages_today": [],
            "top_countries_today": [],
            "top_pages_total": [],
        })
    return result
