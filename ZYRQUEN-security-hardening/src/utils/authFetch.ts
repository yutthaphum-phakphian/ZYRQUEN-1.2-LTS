const KEY = 'codevoice-ai:authToken';
const EXP_KEY = 'codevoice-ai:authExpiresAt';
const REFRESH_WINDOW_MS = 10 * 60_000;
export const AUTH_EXPIRED_EVENT = 'codevoice-auth-expired';

const read = (k: string) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
const write = (k: string, v: string) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch { /* storage unavailable */ } };
export const getAuthToken = (): string => read(KEY);
export const getAuthExpiresAt = (): number => Number(read(EXP_KEY)) || 0;
export const setAuthSession = (token: string, expiresAt?: number | null) => { write(KEY, token); write(EXP_KEY, token && expiresAt ? String(expiresAt) : ''); };
export const clearAuthSession = () => setAuthSession('');
/** Remaining lifetime of the current session in ms (0 if none / already expired). */
export const getSessionRemainingMs = (): number => {
  const exp = getAuthExpiresAt();
  if (!exp || !getAuthToken()) return 0;
  return Math.max(0, exp - Date.now());
};
/** Manually rotate the session token (returns new expiresAt or null on failure). */
export async function refreshSession(f: typeof fetch = window.fetch.bind(window)): Promise<number | null> {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const r = await f('/api/session/refresh', { method: 'POST', headers: { Authorization: 'Bearer ' + token } });
    if (!r.ok) return null;
    const b = await r.json();
    if (b.token) {
      setAuthSession(b.token, b.expiresAt);
      return typeof b.expiresAt === 'number' ? b.expiresAt : null;
    }
  } catch { /* ignore */ }
  return null;
}

type FetchHost = { fetch: typeof fetch; location: { origin: string }; dispatchEvent?: (e: Event) => boolean };

/** Exchanges an access key for a short-lived session and stores it. Throws with the server's error code. */
export async function loginWithKey(key: string, f: typeof fetch = window.fetch.bind(window)) {
  const r = await f('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body?.error || 'HTTP_' + r.status);
  setAuthSession(body.token || '', body.expiresAt);
  return body as { authRequired: boolean; userId: string; token: string; expiresAt: number | null };
}
export async function logout(f: typeof fetch = window.fetch.bind(window)) {
  try { if (getAuthToken()) await f('/api/logout', { method: 'POST' }); } finally { clearAuthSession(); }
}

/**
 * Adds the session token to same-origin /api/ requests only (never other origins, never over an explicit header),
 * rotates the session shortly before it expires, and clears it + emits AUTH_EXPIRED_EVENT on a 401.
 */
/** Fetch current session identity from the server (userId, expiresAt, remainingMs). */
export async function fetchSessionMe(f: typeof fetch = window.fetch.bind(window)): Promise<{
  authRequired: boolean; userId: string; expiresAt: number | null; remainingMs?: number;
} | null> {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const r = await f('/api/session/me', { headers });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}



const ADMIN_KEY = 'codevoice-ai:adminToken';
export const getAdminToken = (): string => { try { return sessionStorage.getItem(ADMIN_KEY) || ''; } catch { return ''; } };
export const setAdminToken = (t: string) => { try { t ? sessionStorage.setItem(ADMIN_KEY, t) : sessionStorage.removeItem(ADMIN_KEY); } catch { /* */ } };

/** Call admin API with Bearer ADMIN_TOKEN from sessionStorage. */
export async function adminFetch(path: string, init: RequestInit = {}, f: typeof fetch = window.fetch.bind(window)) {
  const token = getAdminToken();
  const headers = new Headers(init.headers || {});
  if (token) headers.set('Authorization', 'Bearer ' + token);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const r = await f(path, { ...init, headers });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body?.error || 'HTTP_' + r.status);
  return body;
}

export function createAuthenticatedFetch(
  origFetch: typeof fetch = (typeof window !== 'undefined' ? window.fetch.bind(window) : (fetch as any)),
  origin: string = typeof window !== 'undefined' ? window.location.origin : '',
  dispatchAuthExpired?: (event: Event) => unknown,
): typeof fetch {
  let refreshing: Promise<void> | null = null;
  const refresh = () => (refreshing ??= (async () => {
    try {
      const r = await origFetch('/api/session/refresh', { method: 'POST', headers: { Authorization: 'Bearer ' + getAuthToken() } });
      if (r.ok) { const b = await r.json(); if (b.token) setAuthSession(b.token, b.expiresAt); }
    } catch { /* keep current session; a 401 later will clear it */ }
    finally { refreshing = null; }
  })());

  return (async (input: any, init: any = {}) => {
    let isApi = false;
    try {
      const url = new URL(typeof input === 'string' ? input : input?.url ?? String(input), origin || 'http://localhost');
      isApi = (origin ? url.origin === origin : true) && url.pathname.startsWith('/api/') && url.pathname !== '/api/login' && url.pathname !== '/api/session/refresh';
    } catch { /* plain fetch below */ }
    if (!isApi || !getAuthToken()) return origFetch(input, init);
    const exp = getAuthExpiresAt();
    if (exp && exp - Date.now() < REFRESH_WINDOW_MS && exp > Date.now()) await refresh();
    const headers = new Headers(init.headers || (typeof input !== 'string' ? input?.headers : undefined));
    const explicit = headers.has('Authorization');
    if (!explicit) headers.set('Authorization', 'Bearer ' + getAuthToken());
    const res = await origFetch(input, { ...init, headers });
    if (res.status === 401 && !explicit) {
      clearAuthSession();
      try {
        const dispatch = dispatchAuthExpired || (typeof window !== 'undefined' ? window.dispatchEvent.bind(window) : undefined);
        dispatch?.(new Event(AUTH_EXPIRED_EVENT));
      } catch { /* no DOM */ }
    }
    return res;
  }) as typeof fetch;
}

export function installAuthFetch(w: any = typeof window !== 'undefined' ? window : null) {
  if (!w || typeof w.fetch !== 'function') return;
  try {
    const orig = w.fetch.bind(w);
    const wrapped = createAuthenticatedFetch(orig, w.location?.origin, (event) => w.dispatchEvent?.(event));
    try {
      w.fetch = wrapped;
    } catch {
      try {
        Object.defineProperty(w, 'fetch', {
          value: wrapped,
          writable: true,
          configurable: true,
        });
      } catch (e) {
        console.warn('[authFetch] Could not patch window.fetch (getter-only/sealed window):', e);
      }
    }
  } catch (err) {
    console.warn('[authFetch] installAuthFetch failed safely:', err);
  }
}
