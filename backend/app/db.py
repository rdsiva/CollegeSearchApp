"""asyncpg connection pool + idempotent schema migrations.

DATABASE_URL is read once at startup. Format:
  postgresql://user:pass@host:port/database

The pool is optional — if DATABASE_URL is unset, db calls become no-ops so the
app still runs locally without Postgres. Metrics in that mode revert to
in-memory only.
"""
import os
from datetime import date as _date_t
import asyncpg
import logging


def _as_date(d):
    """asyncpg requires a datetime.date for DATE columns. Accept either str or date."""
    return _date_t.fromisoformat(d) if isinstance(d, str) else d

log = logging.getLogger(__name__)

_pool: asyncpg.Pool | None = None
_disabled = False


SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS metrics_pageviews_daily (
    day   DATE   NOT NULL,
    path  TEXT   NOT NULL,
    count BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (day, path)
);

CREATE TABLE IF NOT EXISTS metrics_countries_daily (
    day     DATE   NOT NULL,
    country TEXT   NOT NULL,
    count   BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (day, country)
);

CREATE TABLE IF NOT EXISTS metrics_sessions (
    session_id TEXT PRIMARY KEY,
    first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen  TIMESTAMPTZ NOT NULL DEFAULT now(),
    country    TEXT
);

CREATE INDEX IF NOT EXISTS idx_pageviews_day  ON metrics_pageviews_daily (day);
CREATE INDEX IF NOT EXISTS idx_countries_day  ON metrics_countries_daily (day);
CREATE INDEX IF NOT EXISTS idx_sessions_seen ON metrics_sessions (last_seen);
"""


async def init() -> None:
    global _pool, _disabled
    dsn = os.getenv("DATABASE_URL", "").strip()
    if not dsn:
        _disabled = True
        log.info("DATABASE_URL not set — metrics persistence disabled")
        return
    try:
        _pool = await asyncpg.create_pool(
            dsn=dsn, min_size=1, max_size=4, command_timeout=10, timeout=10,
        )
        async with _pool.acquire() as conn:
            await conn.execute(SCHEMA_SQL)
        log.info("Postgres pool initialised, schema ensured")
    except Exception as exc:
        log.warning("DB init failed (%s) — falling back to in-memory only", exc)
        _disabled = True
        _pool = None


async def close() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


def is_enabled() -> bool:
    return _pool is not None and not _disabled


async def upsert_pageviews(day: str, deltas: dict[str, int]) -> None:
    if not is_enabled() or not deltas:
        return
    d = _as_date(day)
    rows = [(d, path, n) for path, n in deltas.items() if n > 0]
    if not rows:
        return
    async with _pool.acquire() as conn:
        await conn.executemany(
            """
            INSERT INTO metrics_pageviews_daily (day, path, count)
            VALUES ($1, $2, $3)
            ON CONFLICT (day, path) DO UPDATE
            SET count = metrics_pageviews_daily.count + EXCLUDED.count
            """,
            rows,
        )


async def upsert_countries(day: str, deltas: dict[str, int]) -> None:
    if not is_enabled() or not deltas:
        return
    d = _as_date(day)
    rows = [(d, country, n) for country, n in deltas.items() if n > 0]
    if not rows:
        return
    async with _pool.acquire() as conn:
        await conn.executemany(
            """
            INSERT INTO metrics_countries_daily (day, country, count)
            VALUES ($1, $2, $3)
            ON CONFLICT (day, country) DO UPDATE
            SET count = metrics_countries_daily.count + EXCLUDED.count
            """,
            rows,
        )


async def upsert_sessions(sessions: list[tuple[str, str]]) -> None:
    """sessions: list of (session_id, country). Inserts or refreshes last_seen."""
    if not is_enabled() or not sessions:
        return
    async with _pool.acquire() as conn:
        await conn.executemany(
            """
            INSERT INTO metrics_sessions (session_id, country)
            VALUES ($1, $2)
            ON CONFLICT (session_id) DO UPDATE
            SET last_seen = now(), country = EXCLUDED.country
            """,
            sessions,
        )


async def fetch_aggregates(day) -> dict:
    """Read totals for the given day plus all-time pageviews and unique sessions."""
    if not is_enabled():
        return {}
    d = _as_date(day)
    async with _pool.acquire() as conn:
        pageviews_today_rows = await conn.fetch(
            "SELECT path, count FROM metrics_pageviews_daily WHERE day = $1 ORDER BY count DESC LIMIT 10",
            d,
        )
        countries_today_rows = await conn.fetch(
            "SELECT country, count FROM metrics_countries_daily WHERE day = $1 ORDER BY count DESC LIMIT 10",
            d,
        )
        pageviews_total_rows = await conn.fetch(
            "SELECT path, SUM(count) AS count FROM metrics_pageviews_daily GROUP BY path ORDER BY count DESC LIMIT 10",
        )
        pageviews_today_total = await conn.fetchval(
            "SELECT COALESCE(SUM(count),0) FROM metrics_pageviews_daily WHERE day = $1", d,
        )
        pageviews_all = await conn.fetchval(
            "SELECT COALESCE(SUM(count),0) FROM metrics_pageviews_daily",
        )
        unique_sessions = await conn.fetchval(
            "SELECT COUNT(*) FROM metrics_sessions",
        )
    return {
        "top_pages_today": [{"path": r["path"], "count": r["count"]} for r in pageviews_today_rows],
        "top_countries_today": [{"country": r["country"], "count": r["count"]} for r in countries_today_rows],
        "top_pages_total": [{"path": r["path"], "count": int(r["count"])} for r in pageviews_total_rows],
        "pageviews_today": int(pageviews_today_total or 0),
        "pageviews_total": int(pageviews_all or 0),
        "unique_sessions_total": int(unique_sessions or 0),
    }
