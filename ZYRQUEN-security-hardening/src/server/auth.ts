import { createHash, timingSafeEqual } from 'crypto';
import type { SessionStore } from './sessions';
import type { SessionBackend } from './redisSessions';

/** Minimal surface used by login to resolve dynamic registry keys. */
export type AccessKeyResolver = { resolve(accessKey: string | undefined | null): string | null };


export const USER_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
export type TokenTable = Array<{ hash: Buffer; userId: string }>;
const sha = (s: string) => createHash('sha256').update(s).digest();

/** AUTH_TOKENS="token1:alice,token2:bob". Tokens must be >= 16 chars; user ids match USER_ID_RE. Throws on bad config (fail closed). */
export function parseTokens(env: string | undefined): TokenTable {
  if (!env || !env.trim()) return [];
  const seen = new Set<string>();
  return env.split(',').map(x => x.trim()).filter(Boolean).map(entry => {
    const i = entry.lastIndexOf(':');
    const token = i > 0 ? entry.slice(0, i) : '', userId = i > 0 ? entry.slice(i + 1) : '';
    if (token.length < 16) throw new Error('AUTH_TOKENS: token must be at least 16 characters');
    if (!USER_ID_RE.test(userId)) throw new Error('AUTH_TOKENS: invalid user id');
    if (seen.has(token)) throw new Error('AUTH_TOKENS: duplicate token');
    seen.add(token);
    return { hash: sha(token), userId };
  });
}

/** Constant-time check of an "Authorization: Bearer <token>" header against every entry. */
export function authenticate(header: string | undefined, table: TokenTable): string | null {
  const m = /^Bearer (.{1,512})$/.exec(header || '');
  if (!m) return null;
  const given = sha(m[1]);
  let found: string | null = null;
  for (const e of table) if (timingSafeEqual(given, e.hash) && found === null) found = e.userId;
  return found;
}

/**
 * Progressive fixed-window limiter for FAILED auth attempts per key (e.g. IP).
 * - After `max` failures in the base window → blocked until window ends.
 * - Each additional failure while blocked extends the lockout (capped).
 * - Returns Retry-After seconds so clients can back off cleanly.
 */
export class FailLimiter {
  private hits = new Map<string, { n: number; reset: number }>();
  /**
   * @param max          failures allowed inside the base window before block
   * @param windowMs     base window length
   * @param now          clock (injectable for tests)
   * @param extendMs     extra lockout added per failure while already blocked (default = windowMs)
   * @param maxLockMs    hard cap on lockout length (default 15 min)
   */
  constructor(
    private max = 10,
    private windowMs = 60_000,
    private now: () => number = Date.now,
    private extendMs = 60_000,
    private maxLockMs = 15 * 60_000,
  ) {}
  blocked(key: string) {
    const h = this.hits.get(key);
    return !!h && h.reset > this.now() && h.n >= this.max;
  }
  /** Seconds until the current lockout ends (0 if not blocked). */
  retryAfterSec(key: string): number {
    const h = this.hits.get(key);
    if (!h || h.reset <= this.now() || h.n < this.max) return 0;
    return Math.max(1, Math.ceil((h.reset - this.now()) / 1000));
  }
  fail(key: string) {
    const t = this.now();
    const h = this.hits.get(key);
    if (!h || h.reset <= t) {
      this.hits.set(key, { n: 1, reset: t + this.windowMs });
    } else {
      h.n++;
      // Progressive: once over the limit, each extra fail stretches the ban
      if (h.n > this.max) {
        const extra = Math.min(this.extendMs * (h.n - this.max), this.maxLockMs);
        h.reset = Math.min(h.reset + this.extendMs, t + this.maxLockMs);
        // ensure we actually applied progressive stretch
        if (h.reset < t + extra) h.reset = t + extra;
      }
    }
    if (this.hits.size > 10_000) {
      for (const [k, v] of this.hits) if (v.reset <= t) this.hits.delete(k);
    }
  }
  ok(key: string) { this.hits.delete(key); }
  /** Current failure count inside the active window (for metrics / debug). */
  failures(key: string): number {
    const h = this.hits.get(key);
    if (!h || h.reset <= this.now()) return 0;
    return h.n;
  }
}

export interface AuthedRequest { headers: Record<string, any>; ip?: string; socket?: { remoteAddress?: string }; userId?: string; }

/**
 * Express-style middleware (sync path, used by unit tests and memory store).
 * With no AUTH_TOKENS configured, auth is OFF and every request is user "local" (dev mode).
 */
export function makeAuthMiddleware(table: TokenTable, limiter = new FailLimiter(), sessions?: SessionStore) {
  return (req: AuthedRequest, res: { status: (n: number) => any; json: (b: unknown) => any }, next: () => void) => {
    if (table.length === 0) { req.userId = 'local'; return next(); }
    const key = String(req.ip || req.socket?.remoteAddress || 'unknown');
    if (limiter.blocked(key)) {
      const ra = limiter.retryAfterSec(key);
      if (typeof (res as any).setHeader === 'function') (res as any).setHeader('Retry-After', String(ra));
      return res.status(429).json({ error: 'TOO_MANY_FAILED_ATTEMPTS', retryAfterSec: ra });
    }
    const bearer = /^Bearer (.{1,512})$/.exec(req.headers['authorization'] || '')?.[1];
    const userId = sessions ? (sessions.verify(bearer)?.userId ?? null) : authenticate(req.headers['authorization'], table);
    if (!userId) { limiter.fail(key); return res.status(401).json({ error: 'UNAUTHORIZED' }); }
    limiter.ok(key); req.userId = userId; return next();
  };
}

/**
 * Async-aware middleware for Redis (or any SessionBackend).
 * Drop-in replacement when using tryCreateRedisBackend().
 */
export function makeAuthMiddlewareAsync(table: TokenTable, limiter = new FailLimiter(), sessions?: SessionBackend, registry?: AccessKeyResolver | null) {
  return async (req: AuthedRequest, res: { status: (n: number) => any; json: (b: unknown) => any }, next: (err?: any) => void) => {
    try {
      // Open (dev) mode only when no env tokens and no registry users
      const regSize = registry && typeof (registry as any).size === 'function' ? (registry as any).size() : 0;
      if (table.length === 0 && regSize === 0) { req.userId = 'local'; return next(); }
      const key = String(req.ip || req.socket?.remoteAddress || 'unknown');
      if (limiter.blocked(key)) {
        const ra = limiter.retryAfterSec(key);
        if (typeof (res as any).setHeader === 'function') (res as any).setHeader('Retry-After', String(ra));
        return res.status(429).json({ error: 'TOO_MANY_FAILED_ATTEMPTS', retryAfterSec: ra });
      }
      const bearer = /^Bearer (.{1,512})$/.exec(req.headers['authorization'] || '')?.[1];
      const userId = sessions ? ((await sessions.verify(bearer))?.userId ?? null) : authenticate(req.headers['authorization'], table);
      if (!userId) { limiter.fail(key); return res.status(401).json({ error: 'UNAUTHORIZED' }); }
      limiter.ok(key); req.userId = userId; return next();
    } catch (err) {
      return next(err);
    }
  };
}

export interface LoginResult { status: number; body: Record<string, unknown>; }

/** Sync login (memory / file SessionStore). */
export function login(key: unknown, ipKey: string, table: TokenTable, sessions: SessionStore, limiter: FailLimiter, registry?: AccessKeyResolver | null): LoginResult {
  const hasAuth = table.length > 0 || !!(registry && registry.resolve);
  if (!hasAuth && table.length === 0 && !registry) return { status: 200, body: { authRequired: false, userId: 'local', token: '', expiresAt: null } };
  // Open mode only when both env table and registry are empty
  if (table.length === 0 && !registry) return { status: 200, body: { authRequired: false, userId: 'local', token: '', expiresAt: null } };
  if (limiter.blocked(ipKey)) { const ra = limiter.retryAfterSec(ipKey); return { status: 429, body: { error: 'TOO_MANY_FAILED_ATTEMPTS', retryAfterSec: ra } }; }
  let userId: string | null = typeof key === 'string' ? authenticate('Bearer ' + key, table) : null;
  if (!userId && typeof key === 'string' && registry) userId = registry.resolve(key);
  if (!userId) { limiter.fail(ipKey); return { status: 401, body: { error: 'UNAUTHORIZED' } }; }
  limiter.ok(ipKey); const sess = sessions.create(userId);
  return { status: 200, body: { authRequired: true, userId, token: sess.token, expiresAt: sess.expiresAt } };
}

/** Async login for Redis / SessionBackend. */
export async function loginAsync(key: unknown, ipKey: string, table: TokenTable, sessions: SessionBackend, limiter: FailLimiter, registry?: AccessKeyResolver | null): Promise<LoginResult> {
  if (table.length === 0 && !registry) return { status: 200, body: { authRequired: false, userId: 'local', token: '', expiresAt: null } };
  if (limiter.blocked(ipKey)) { const ra = limiter.retryAfterSec(ipKey); return { status: 429, body: { error: 'TOO_MANY_FAILED_ATTEMPTS', retryAfterSec: ra } }; }
  let userId: string | null = typeof key === 'string' ? authenticate('Bearer ' + key, table) : null;
  if (!userId && typeof key === 'string' && registry) userId = registry.resolve(key);
  if (!userId) { limiter.fail(ipKey); return { status: 401, body: { error: 'UNAUTHORIZED' } }; }
  limiter.ok(ipKey); const sess = await sessions.create(userId);
  return { status: 200, body: { authRequired: true, userId, token: sess.token, expiresAt: sess.expiresAt } };
}
