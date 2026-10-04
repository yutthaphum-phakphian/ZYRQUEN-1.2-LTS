import type { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'node:crypto';

function safeSecretEqual(a: string, b: string): boolean {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}


/**
 * Lightweight security headers (no extra dependency).
 * Suitable for SPA + API on the same origin.
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Allow AI Studio preview and cloud run iframe embedding
  // res.setHeader('X-Frame-Options', 'SAMEORIGIN'); -> removed to allow AI Studio iframe
  // Basic XSS filter (legacy, still useful)
  res.setHeader('X-XSS-Protection', '0'); // modern browsers use CSP instead
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Permissions policy (disable powerful features we don't use)
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // HSTS only when the request is already HTTPS (or behind a TLS-terminating proxy that sets x-forwarded-proto)
  const proto = process.env.TRUST_PROXY_PROTOCOL === '1' ? String(req.headers['x-forwarded-proto'] || req.protocol).split(',')[0].trim() : req.protocol;
  if (proto === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  // Strict production CSP. Relaxed framing is opt-in and never defaults to '*'.
  // Unsafe script execution is intentionally forbidden. If a deployment needs
  // embedding, set FRAME_ANCESTORS to an explicit space-separated origin list.
  const ancestors = (process.env.FRAME_ANCESTORS || "'self'").trim();
  const safeAncestors = ancestors === '*' ? "'self'" : ancestors;
  const scriptSrc = "script-src 'self'";
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:",
      `frame-ancestors ${safeAncestors}`,
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "frame-src 'self' https:",
    ].join('; '),
  );
  // Hide framework fingerprint
  res.removeHeader('X-Powered-By');
  next();
}

/** Simple request logger for auth-related routes (no secrets). */
export function authAuditLog(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const path = req.path;
  if (!path.startsWith('/login') && !path.startsWith('/logout') && !path.startsWith('/session')) {
    return next();
  }
  res.on('finish', () => {
    const ip = req.ip || req.socket?.remoteAddress || '?';
    const ms = Date.now() - start;
    console.log(`[auth] ${req.method} ${path} → ${res.statusCode} (${ms}ms) ip=${ip}`);
  });
  next();
}

/**
 * Redirect HTTP → HTTPS when FORCE_HTTPS=1 (or true/yes).
 * Trusts X-Forwarded-Proto from a TLS-terminating proxy (Cloud Run, nginx, etc.).
 * Skips localhost / health checks so local dev and probes still work over HTTP.
 */
export function forceHttps(req: Request, res: Response, next: NextFunction) {
  const enabled = /^(1|true|yes)$/i.test(String(process.env.FORCE_HTTPS || ''));
  if (!enabled) return next();

  const proto = process.env.TRUST_PROXY_PROTOCOL === '1'
    ? String(req.headers['x-forwarded-proto'] || req.protocol || 'http').split(',')[0].trim()
    : req.protocol;
  if (proto === 'https') return next();

  // Keep health/metrics reachable over plain HTTP for internal probes if desired
  if (req.path === '/api/health' || req.path === '/api/metrics') return next();
  let base: URL | null = null;
  try { if (process.env.APP_URL) base = new URL(process.env.APP_URL); } catch { return res.status(500).json({ error: 'INVALID_APP_URL' }); }
  if (base && base.protocol !== 'https:') return res.status(500).json({ error: 'APP_URL_MUST_BE_HTTPS' });
  if (!base) {
    const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
    if (!host || host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.startsWith('[') || process.env.NODE_ENV === 'production') return res.status(400).json({ error: 'TRUSTED_PUBLIC_HOST_REQUIRED' });
    base = new URL(`https://${host}`);
  }
  const url = new URL(req.originalUrl || req.url || '/', base);
  res.setHeader('Location', url);
  return res.status(301).end();
}

/**
 * Optional protection for /api/metrics.
 *
 * Env (any combination):
 *   METRICS_TOKEN=secret          → require Authorization: Bearer <secret>
 *   METRICS_ALLOW_IPS=10.0.0.1,10.0.0.2  → only these IPs (supports exact match)
 *
 * If neither is set, metrics stay open (dev-friendly).
 * If either is set, the request must satisfy the configured checks.
 */
export function metricsGuard(req: Request, res: Response, next: NextFunction) {
  const token = (process.env.METRICS_TOKEN || '').trim();
  const allow = (process.env.METRICS_ALLOW_IPS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // Nothing configured → open
  if (!token && allow.length === 0) return next();

  // IP allowlist
  if (allow.length > 0) {
    const ip = String(req.ip || req.socket?.remoteAddress || '')
      .replace(/^::ffff:/, ''); // strip IPv4-mapped prefix
    const ok = allow.some((a) => a === ip);
    if (!ok) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(403).json({ error: 'FORBIDDEN', reason: 'ip_not_allowed' });
    }
  }

  // Bearer token
  if (token) {
    const header = String(req.headers.authorization || '');
    const m = /^Bearer\s+(.+)$/i.exec(header);
    const given = (m?.[1] || '').trim();
    if (!safeSecretEqual(given, token)) {
      res.setHeader('WWW-Authenticate', 'Bearer realm="metrics"');
      res.setHeader('Cache-Control', 'no-store');
      return res.status(401).json({ error: 'UNAUTHORIZED', reason: 'metrics_token' });
    }
  }

  return next();
}

/**
 * Admin guard for operational endpoints.
 * Set ADMIN_TOKEN to a long random secret. Requests must send:
 *   Authorization: Bearer <ADMIN_TOKEN>
 * When ADMIN_TOKEN is unset, admin routes return 503 (disabled).
 */
export function adminGuard(req: Request, res: Response, next: NextFunction) {
  const expected = (process.env.ADMIN_TOKEN || '').trim();
  if (!expected || expected.length < 16) {
    return res.status(503).json({ error: 'ADMIN_DISABLED', reason: 'ADMIN_TOKEN not configured (min 16 chars)' });
  }
  const header = String(req.headers.authorization || '');
  const m = /^Bearer\s+(.+)$/i.exec(header);
  const given = (m?.[1] || '').trim();
  if (!safeSecretEqual(given, expected)) {
    res.setHeader('WWW-Authenticate', 'Bearer realm="admin"');
    return res.status(401).json({ error: 'UNAUTHORIZED', reason: 'admin_token' });
  }
  return next();
}
