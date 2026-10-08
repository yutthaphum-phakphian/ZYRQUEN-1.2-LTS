import test from 'node:test';
import assert from 'node:assert/strict';
import { metricsGuard, adminGuard } from '../src/server/security.ts';

function response() {
  const headers = new Map();
  return {
    headers,
    statusCode: 200,
    body: null,
    setHeader(k, v) { headers.set(k, v); },
    json(v) { this.body = v; return this; },
    status(v) { this.statusCode = v; return this; },
  };
}
function req(auth = '', query = {}) {
  return { headers: auth ? { authorization: auth } : {}, query, ip: '10.0.0.5', socket: { remoteAddress: '10.0.0.5' } };
}

test('metrics token is bearer-only and rejects query-string secrets', () => {
  const old = process.env.METRICS_TOKEN;
  process.env.METRICS_TOKEN = '0123456789abcdef';
  let next = false;
  let r = response();
  metricsGuard(req('', { token: process.env.METRICS_TOKEN }), r, () => { next = true; });
  assert.equal(r.statusCode, 401);
  assert.equal(next, false);
  r = response(); next = false;
  metricsGuard(req('Bearer 0123456789abcdef'), r, () => { next = true; });
  assert.equal(next, true);
  if (old === undefined) delete process.env.METRICS_TOKEN; else process.env.METRICS_TOKEN = old;
});

test('admin token uses bearer auth and fails closed when missing', () => {
  const old = process.env.ADMIN_TOKEN;
  delete process.env.ADMIN_TOKEN;
  const r = response(); let next = false;
  adminGuard(req(), r, () => { next = true; });
  assert.equal(r.statusCode, 503);
  assert.equal(next, false);
  process.env.ADMIN_TOKEN = '0123456789abcdef';
  const ok = response(); next = false;
  adminGuard(req('Bearer 0123456789abcdef'), ok, () => { next = true; });
  assert.equal(next, true);
  if (old === undefined) delete process.env.ADMIN_TOKEN; else process.env.ADMIN_TOKEN = old;
});

test('metrics IP allowlist does not treat wildcard as an allow-all token', () => {
  const old = process.env.METRICS_ALLOW_IPS;
  const oldToken = process.env.METRICS_TOKEN;
  process.env.METRICS_ALLOW_IPS = '*';
  delete process.env.METRICS_TOKEN;
  const r = response(); let next = false;
  metricsGuard(req(), r, () => { next = true; });
  assert.equal(r.statusCode, 403);
  assert.equal(next, false);
  if (old === undefined) delete process.env.METRICS_ALLOW_IPS; else process.env.METRICS_ALLOW_IPS = old;
  if (oldToken === undefined) delete process.env.METRICS_TOKEN; else process.env.METRICS_TOKEN = oldToken;
});
