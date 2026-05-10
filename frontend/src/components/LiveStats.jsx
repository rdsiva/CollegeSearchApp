import { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';
import { fetchStats } from '../api/analytics';

const REFRESH_MS = 30_000;

export default function LiveStats() {
  const [stats, setStats] = useState(null);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const s = await fetchStats();
        if (alive) {
          setStats(s);
          setErr(false);
        }
      } catch {
        if (alive) setErr(true);
      }
    };
    tick();
    const t = setInterval(tick, REFRESH_MS);
    return () => { alive = false; clearInterval(t); };
  }, []);

  if (err || !stats) {
    return null;
  }

  const live = stats.live_users ?? 0;
  const today = stats.pageviews_today ?? 0;
  const total = stats.pageviews_total ?? 0;
  const topCountries = stats.live_by_country?.length ? stats.live_by_country : (stats.top_countries_today || []);

  return (
    <div className="relative inline-block text-xs">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
        title="Live stats — click for details"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-medium">{live}</span>
        <span>online</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-50">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Globe size={14} className="text-emerald-600" />
            <span className="font-semibold text-gray-800">Live activity</span>
          </div>
          <dl className="grid grid-cols-3 gap-2 mt-2 text-center">
            <Cell label="Online now" value={live} />
            <Cell label="Today" value={today} />
            <Cell label="All time" value={total} />
          </dl>

          {topCountries.length > 0 && (
            <>
              <h4 className="mt-3 mb-1 text-[11px] uppercase tracking-wide text-gray-500">
                {stats.live_by_country?.length ? 'Live by country' : 'Top countries today'}
              </h4>
              <ul className="space-y-0.5">
                {topCountries.slice(0, 6).map((c) => (
                  <li key={c.country} className="flex justify-between">
                    <span>{flag(c.country)} {c.country}</span>
                    <span className="font-medium text-gray-700">{c.count}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {stats.top_pages_today?.length > 0 && (
            <>
              <h4 className="mt-3 mb-1 text-[11px] uppercase tracking-wide text-gray-500">Top pages today</h4>
              <ul className="space-y-0.5">
                {stats.top_pages_today.slice(0, 5).map((p) => (
                  <li key={p.path} className="flex justify-between gap-2">
                    <span className="truncate text-gray-700" title={p.path}>{p.path}</span>
                    <span className="font-medium text-gray-700">{p.count}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          <p className="mt-3 text-[10px] text-gray-400">
            Anonymous • {stats.persistence === 'postgres' ? 'persisted' : 'session-only'}
          </p>
        </div>
      )}
    </div>
  );
}

function Cell({ label, value }) {
  return (
    <div className="rounded-lg bg-gray-50 p-2">
      <div className="text-base font-semibold text-gray-800">{value}</div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</div>
    </div>
  );
}

function flag(cc) {
  if (!cc || cc.length !== 2 || cc === '??') return '🌐';
  const A = 0x1F1E6;
  return String.fromCodePoint(A + (cc.charCodeAt(0) - 65), A + (cc.charCodeAt(1) - 65));
}
