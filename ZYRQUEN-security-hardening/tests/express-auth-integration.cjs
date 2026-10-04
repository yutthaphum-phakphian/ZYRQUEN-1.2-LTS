/**
 * Lightweight Express integration smoke test for the auth/session layer.
 * Does NOT need the full server.ts or Gemini — it mounts only the auth routes.
 *
 * Run after compiling the server modules:
 *   npx tsc --outDir out --module commonjs --target es2022 --lib es2022,dom \
 *     --esModuleInterop --skipLibCheck \
 *     src/server/auth.ts src/server/sessions.ts src/server/security.ts src/server/redisSessions.ts
 *   node tests/express-auth-integration.cjs
 */
const http = require('http');
const express = require('express'); // may need: npm i express (already a dep of the project)
const path = require('path');

// Prefer compiled out/; fall back with a clear error.
let A, SessionStore, securityHeaders, authAuditLog, asAsync;
try {
  A = require('./out/server/auth.js');
  SessionStore = require('./out/server/sessions.js').SessionStore;
  securityHeaders = require('./out/server/security.js').securityHeaders;
  authAuditLog = require('./out/server/security.js').authAuditLog;
  asAsync = require('./out/server/redisSessions.js').asAsync;
} catch (e) {
  console.error('Compile first (see tests/README.md). Missing:', e.message);
  process.exit(2);
}

let fail = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };

(async () => {
  const table = A.parseTokens('integration-test-key1:alice,integration-test-key2:bob');
  const lim = new A.FailLimiter(5, 60_000);
  const store = new SessionStore(3600_000, 100, Date.now);
  const backend = asAsync(store);

  const app = express();
  app.use(securityHeaders);
  app.use(express.json());
  app.post('/api/login', async (req, res) => {
    const r = await A.loginAsync(req.body?.key, req.ip || '127.0.0.1', table, backend, lim);
    res.status(r.status).json(r.body);
  });
  app.use('/api', authAuditLog, (req, res, next) => {
    if (req.path === '/health' || req.path === '/metrics') return next();
    return A.makeAuthMiddlewareAsync(table, lim, backend)(req, res, next);
  });
  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  try {
    const { toPrometheus, metricsMiddleware } = require('./out/server/metrics.js');
    app.use(metricsMiddleware);
    app.get('/api/metrics', (_req, res) => { res.type('text/plain').send(toPrometheus()); });
  } catch (e) { /* metrics module optional in this harness */ }
  app.get('/api/me', (req, res) => res.json({ userId: req.userId }));
  app.post('/api/logout', async (req, res) => {
    const bearer = /^Bearer (.{1,512})$/.exec(req.headers.authorization || '')?.[1];
    res.json({ ok: await backend.revoke(bearer) });
  });
  app.post('/api/session/refresh', async (req, res) => {
    const bearer = /^Bearer (.{1,512})$/.exec(req.headers.authorization || '')?.[1];
    const r = await backend.refresh(bearer);
    return r ? res.json({ authRequired: true, ...r }) : res.status(401).json({ error: 'UNAUTHORIZED' });
  });

  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;

  const req = (method, urlPath, { body, token, headers = {} } = {}) =>
    new Promise((resolve, reject) => {
      const u = new URL(urlPath, base);
      const data = body ? JSON.stringify(body) : null;
      const h = { ...headers };
      if (data) h['Content-Type'] = 'application/json';
      if (token) h['Authorization'] = 'Bearer ' + token;
      const r = http.request(u, { method, headers: h }, (res) => {
        let buf = '';
        res.on('data', (c) => (buf += c));
        res.on('end', () => {
          let json = null;
          try { json = JSON.parse(buf); } catch {}
          resolve({ status: res.statusCode, headers: res.headers, body: json, raw: buf });
        });
      });
      r.on('error', reject);
      if (data) r.write(data);
      r.end();
    });

  // 1. Health is open
  let r = await req('GET', '/api/health');
  ok(r.status === 200 && r.body?.ok === true, 'GET /api/health open without auth');

  // 2. Protected route rejects missing token
  r = await req('GET', '/api/me');
  ok(r.status === 401, 'GET /api/me without token → 401');

  // 3. Login with bad key
  r = await req('POST', '/api/login', { body: { key: 'wrong' } });
  ok(r.status === 401 && r.body?.error === 'UNAUTHORIZED', 'login bad key → 401');

  // 4. Login with good key
  r = await req('POST', '/api/login', { body: { key: 'integration-test-key1' } });
  ok(r.status === 200 && r.body?.userId === 'alice' && r.body?.token, 'login good key → session');
  const token = r.body.token;
  const expiresAt = r.body.expiresAt;

  // 5. Protected route accepts session
  r = await req('GET', '/api/me', { token });
  ok(r.status === 200 && r.body?.userId === 'alice', 'GET /api/me with session → alice');

  // 6. Security headers present
  ok(r.headers['x-content-type-options'] === 'nosniff', 'X-Content-Type-Options set');
  ok(!!r.headers['content-security-policy'], 'Content-Security-Policy set');
  ok(!r.headers['x-frame-options'] && r.headers['content-security-policy'].includes("frame-ancestors 'self'") && !r.headers['content-security-policy'].includes("unsafe-eval"), 'CSP is strict by default');

  // 7. Refresh rotates token
  r = await req('POST', '/api/session/refresh', { token });
  ok(r.status === 200 && r.body?.token && r.body.token !== token, 'refresh issues new token');
  const token2 = r.body.token;
  r = await req('GET', '/api/me', { token });
  ok(r.status === 401, 'old token dead after refresh');
  r = await req('GET', '/api/me', { token: token2 });
  ok(r.status === 200 && r.body?.userId === 'alice', 'new token works');

  // 8. Logout
  r = await req('POST', '/api/logout', { token: token2 });
  ok(r.status === 200 && r.body?.ok === true, 'logout ok');
  r = await req('GET', '/api/me', { token: token2 });
  ok(r.status === 401, 'token dead after logout');

  // 9. Metrics endpoint is open and returns Prometheus text
  r = await req('GET', '/api/metrics');
  ok(r.status === 200 && (r.raw || '').includes('http_requests_total'), 'GET /api/metrics open + prometheus text');

  // 10. Access key cannot call protected routes directly
  r = await req('GET', '/api/me', { token: 'integration-test-key1' });
  ok(r.status === 401, 'static access key rejected on protected route');

  server.close();
  console.log(fail ? fail + ' FAILED' : 'ALL PASSED');
  process.exit(fail ? 1 : 0);
})().catch((e) => {
  console.error('CRASH', e);
  process.exit(2);
});
