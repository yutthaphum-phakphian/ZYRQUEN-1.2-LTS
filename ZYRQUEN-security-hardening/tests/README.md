# Repository test suites

From the project root:

```bash
npm test
npm run lint
npm run build
```

`npm test` runs the TypeScript suite, compiled legacy CJS regressions, and both
Playwright UI scripts. Install the pinned browser once after `npm ci`:

```bash
npx playwright install chromium
```

Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` only when using a system-managed
Chromium instead of the Playwright-installed browser. UI bundles and file
fixtures are built in a temporary directory and removed by the test harness.

## Current TypeScript suite

From the project root:

```bash
npm run test:typescript
```

## Unit / module tests (need TypeScript compile first)

The `test:legacy` script compiles these modules into a temporary `tests/out/`
directory, runs the regression scripts, and removes only that generated
directory afterward. It refuses to overwrite a pre-existing `tests/out/`.

```bash
npm run test:legacy
```

- `auth.cjs` — token parsing, constant-time auth, FailLimiter, middleware, per-user isolation (12 assertions)
- `sessions.cjs` — SessionStore create/verify/refresh/revoke/evict + login flow (24 assertions)
- `mission-store.cjs` — durable per-user mission files

## UI tests (Playwright + real Chromium)

- `ui-login-playwright.cjs` — Mission panel login/logout/429/expired (9 assertions, Thai UI strings)
- `ui-playwright.cjs` + `harness.tsx` + `lucide-stub.tsx` — mission controls and voice attachment UI
- `nutrition-report-playwright.cjs` — detailed nutrient average and downloaded JSON report

The UI harness bundles the real components with esbuild, serves them over local
HTTP, and resolves Playwright from the project dependency. No prebuilt
`bundle.js`, checked-in browser, or machine-specific absolute path is required.

## Engine / runtime

- `engine-stress.cjs`: fuzz/soak/race tests for the mission engine.
- `runtime-restore.cjs`: checkpoint / restore checks
- `v18-autonomous-mission.test.cjs`: mission completion, approval, recovery, pause, and parallel-read checks.

## Manual smoke (real Express)

```bash
# Terminal 1
export AUTH_TOKENS="test-access-key-16chars:alice"
export SESSION_PERSIST_PATH=.data/sessions.json
npm run dev   # or: npx tsx server.ts

# Terminal 2
curl -s -X POST http://localhost:3000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"key":"test-access-key-16chars"}' | jq .

# Copy the token, then:
TOKEN=...   # from previous response
curl -s -X POST http://localhost:3000/api/session/refresh \
  -H "Authorization: Bearer $TOKEN" | jq .

curl -s -X POST http://localhost:3000/api/logout \
  -H "Authorization: Bearer $TOKEN" | jq .
```

Restart the server and confirm the same session token still verifies when `SESSION_PERSIST_PATH` is set.

## Express auth integration

```bash
npm run test:legacy
```

Covers: health open, login, protected route, security headers, refresh rotation, logout, static key rejection.
