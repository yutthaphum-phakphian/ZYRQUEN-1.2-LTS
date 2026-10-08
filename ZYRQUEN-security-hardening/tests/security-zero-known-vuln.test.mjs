import assert from "node:assert/strict";
import test from "node:test";

test("production CSP defaults to self framing and forbids eval", async () => {
  process.env.NODE_ENV = "production";
  const { securityHeaders } = await import("../src/server/security.ts");
  const headers = new Map();
  const req = { protocol: "https", headers: {}, path: "/", originalUrl: "/", url: "/" };
  const res = { setHeader(k,v){ headers.set(k,v); }, removeHeader(){} };
  securityHeaders(req, res, () => {});
  const csp = headers.get("Content-Security-Policy");
  assert.match(csp, /frame-ancestors 'self'/);
  assert.doesNotMatch(csp, /unsafe-eval/);
  assert.doesNotMatch(csp, /frame-ancestors \*/);
});

test("external connector URL validation fails closed without explicit allowlist", async () => {
  const { validateExternalUrl } = await import("../src/tools/externalUrlGuard.ts");
  assert.equal(validateExternalUrl("https://example.com", []).decision, "UNKNOWN");
  assert.equal(validateExternalUrl("http://127.0.0.1", ["127.0.0.1"]).decision, "DENY");
  assert.equal(validateExternalUrl("https://user:pass@example.com", ["example.com"]).decision, "DENY");
});

test("workspace root is denied unless explicitly allowlisted", async () => {
  const { executeLocalCommand } = await import("../server/localExecutionRuntime.ts");
  delete process.env.CODEVOICE_ALLOWED_WORKSPACE_ROOTS;
  const r = await executeLocalCommand({ command: "node --version", workspaceRoot: "/tmp/zyr-security-outside", projectId: "security" });
  assert.equal(r.status, "BLOCKED");
  assert.equal(r.reason, "WORKSPACE_ROOT_BLOCKED");
});

test("host header cannot control production HTTPS redirect", async () => {
  process.env.NODE_ENV = "production";
  delete process.env.APP_URL;
  process.env.FORCE_HTTPS = "1";
  const { forceHttps } = await import("../src/server/security.ts");
  let status = 0;
  const req = { protocol: "http", headers: { host: "attacker.example" }, path: "/x", originalUrl: "/x" };
  const res = { setHeader(){}, status(n){ status=n; return this; }, json(){ return this; } };
  forceHttps(req, res, () => { status = 999; });
  assert.equal(status, 400);
  delete process.env.FORCE_HTTPS;
});
