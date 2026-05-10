// Lightweight client-side analytics: session UUID + heartbeat to /api/metrics/heartbeat.
// Anonymous (no PII). Server pairs each heartbeat with the CF-IPCountry header.
import api from './client';

const KEY = 'cshelp_session_id';
const HEARTBEAT_MS = 30_000;

function ensureSessionId() {
  try {
    let sid = sessionStorage.getItem(KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem(KEY, sid);
    }
    return sid;
  } catch {
    return null;
  }
}

let _interval = null;

export function startHeartbeat() {
  if (_interval) return;
  const send = async () => {
    const session_id = ensureSessionId();
    if (!session_id) return;
    try {
      await api.post('/metrics/heartbeat', {
        session_id,
        path: window.location.pathname || '/',
      });
    } catch {
      // network errors are non-fatal — analytics is best-effort
    }
  };
  send();
  _interval = setInterval(send, HEARTBEAT_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') send();
  });
}

export async function fetchStats() {
  const res = await api.get('/metrics/stats');
  return res.data;
}
