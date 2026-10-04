# V18 Autonomous Multi-Step Agent Runtime Reality Report

## Executive Summary

V18 upgrades the V17 Self-Contained Runtime with a bounded Autonomous Mission
Engine. It creates missions, decomposes objectives into a dependency-aware task
graph, selects task context, executes real internal tools, observes actual
results, validates the real project model, records evidence events, pauses and
resumes from V17 local checkpoints, cancels safely, and exposes desktop/mobile
Mission V18 controls.

This hardening pass closes the most important gaps: mutation approval is now
visible in the UI and bound to the specific task; context selection is executed
for every task; risky mutation groups create a local snapshot before execution;
and mutation requests without sufficient file inputs stop at WAITING_USER rather
than fabricating a file change.

## What was missing and what was fixed

| Gap | Fix | State |
|---|---|---|
| Approval existed only as an API | Added Approve/Reject controls in Mission V18 panel | REAL |
| Approved mutation could silently appear complete without inputs | Missing name/content produces WAITING_USER and no mutation | REAL |
| Context manager was defined but unused | Every task now receives selected project/rule/file/error context | REAL |
| Risk snapshot was not created before mutation | Snapshot is created and evidence-recorded before approved mutation | REAL |
| WAITING_USER was not preserved by loop | Autonomous loop now stops explicitly in WAITING_USER | REAL |
| Pause/resume was hard to inspect | Local checkpoint and integrity verification are exposed through mission state/events | REAL/PARTIAL |

## Architecture Reuse

- V12 Universal Agent Runtime and existing tool boundary retained.
- V15 execution/permission/checkpoint concepts retained.
- V16 security boundary retained.
- V17 `SelfContainedRuntime`, local workspace, snapshots, checkpoints, and
  runtime events reused.
- No second tool registry, connector system, external provider layer, or
  duplicate memory/runtime was introduced.

## REAL

- Mission lifecycle: CREATED → ANALYZING → PLANNING → READY → RUNNING →
  VALIDATING → COMPLETED / WAITING_APPROVAL / WAITING_USER / FAILED / CANCELLED.
- Dependency-aware task graph; a task runs only after dependency completion.
- Real internal task execution for inspect/analyze/plan/validate.
- Real evidence events for mission creation, planning, task start/completion,
  approval, waiting user, snapshots, recovery, pause, resume, cancel, and
  completion.
- Context selection based on objective, task, project files, rules, known issues,
  and previous errors, with a bounded budget record.
- Approval UI connected to the same engine API used by runtime controls.
- Mutation boundary never bypasses V17 permission checks.
- Snapshot before risky mutation groups.
- Honest WAITING_USER state when a mutation lacks concrete file inputs.
- Local checkpoint resume with integrity verification.
- Actual progress calculated from completed task states.
- Desktop and mobile Mission V18 panels.
- Bounded execution/recovery limits.

## PARTIAL

- `executeMission` currently drains available tasks synchronously; a future
  worker/scheduler can make long missions yield between task steps. The state
  machine and checkpoint APIs are real, but browser-level pause during a single
  synchronous drain is limited.
- Natural-language decomposition is deterministic keyword-based unless an
  existing upstream model route supplies richer task planning.
- Mutation tasks stop for approval and concrete file inputs; the engine does not
  invent implementation content.
- Local browser persistence is available when the browser storage API exists;
  this is not server durability.
- Parallel execution is conservatively sequential; safe parallel scheduling is
  not enabled.
- Full error-specific auto-fix generation is bounded but requires concrete
  validation/tool error details and is not fabricated.

## UNAVAILABLE

- OAuth, external REST, database, MCP, GraphQL, WebSocket, external webhook, and
  external credential vault providers remain unavailable by design.
- Server/distributed checkpoint durability remains unavailable.

## Test Results

### Mission engine regression

- Mission creation: passed.
- Analysis and planning: passed.
- Four-task graph created for inspect/validate objective: passed.
- Dependency vector `[0, 1, 1, 1]`: passed.
- Sequential real internal tool execution: passed.
- Final validation gate and COMPLETED state: passed.
- Evidence event count: 13 for the inspect scenario: passed.
- Pause and local checkpoint: passed.
- Resume with verified checkpoint and no restart of completed tasks: passed.
- Cancel state and cancellation event: passed.

### Approval and safety

- Mutation mission enters WAITING_APPROVAL: passed.
- Approval is bound to task ID: passed.
- Approved mutation with missing file inputs enters WAITING_USER: passed.
- No fabricated file mutation occurs: passed.
- V17 path, permission, checkpoint, snapshot, and export security remain active.

## Build Results

- `npm run lint` — passed.
- `npm run build` — passed.
- Non-blocking Vite config-loader and bundle-size warnings remain.

## Known Limitations

- Long synchronous mission drains are not cancellable mid-function; use the
  persisted state/checkpoint boundary between task steps.
- Mutation content must be supplied by a future user/tool interaction; V18
  intentionally does not guess critical file content.
- No external infrastructure is simulated.
- No V19 work was started.

## Continuation hardening (same V18)

- Added `executeNextTask()` for real one-task-at-a-time execution and inspection.
- Added deterministic `replayMission()` projection from persisted evidence events.
- Added `restoreMission()` hydration with browser persistence and a process fallback
  for environments without `localStorage`.
- Mission panel now exposes **Run next task** without fake progress.
- Continuation test verified: first task changed from PENDING to COMPLETED while
  remaining tasks stayed PENDING; replay returned 5 evidence events; mission
  restoration returned `true`.
- No version bump and no V19 work started.

## Real mutation continuation

- Added `provideTaskInputs()` to resume a WAITING_USER mutation with explicit
  filename/content/language from the user.
- Mission panel now exposes filename/content fields and **Provide inputs &
  continue**.
- Verified flow: `WAITING_APPROVAL` → `WAITING_USER` → concrete input → real
  `src/login.ts` creation → local snapshot → validation → `COMPLETED`.
- Verified no fabricated mutation: the engine refuses to mutate until required
  file inputs exist.
- No version number was added or changed.

### Further hardening (same V18 pass)
- Security headers middleware (`src/server/security.ts`): CSP, X-Content-Type-Options, X-Frame-Options,
  Referrer-Policy, Permissions-Policy, HSTS when HTTPS, strip X-Powered-By. Auth audit log for
  login/logout/refresh (status + IP only, never tokens).
- Optional Redis session backend (`src/server/redisSessions.ts`) activated by `REDIS_URL` + `npm i redis`.
  Priority: Redis → file persist → memory. Async middleware/login paths added; unit tests keep the sync API.
- Mission panel: remaining session time (auto-tick) + manual "ต่ออายุ" (refresh) button; all auth UI in Thai.
- New integration test: `tests/express-auth-integration.cjs` (login → me → headers → refresh → logout).
- `/api/health` upgraded to readiness payload: version V18, uptime, authRequired, sessionBackend
  (redis|file|memory), sessionsApprox, geminiConfigured.
- 429 responses include `retryAfterSec` + `Retry-After` header (FailLimiter.retryAfterSec).
- Dockerfile + .dockerignore with non-root user and HEALTHCHECK against `/api/health`.
- Progressive rate-limit: each failure past the window max extends lockout (capped at 15 min);
  `retryAfterSec` + `Retry-After` header always returned on 429.
- Prometheus-lite metrics at `GET /api/metrics` (open): `http_requests_total`,
  `http_request_duration_ms_*`, `auth_login_total`, `auth_failures_total`. Protect at the proxy if public.
- `FORCE_HTTPS=1` enables HTTP→HTTPS 301 redirect (trusts `X-Forwarded-Proto`); skips localhost and
  health/metrics probes.
- `/api/metrics` optional protection: `METRICS_TOKEN` (Bearer or `?token=`) and/or `METRICS_ALLOW_IPS`
  (exact IP list). When neither is set the endpoint stays open for local/dev scrapers.
- `GET /api/session/me` — returns current userId, expiresAt, remainingMs (session required).
- Admin ops (`ADMIN_TOKEN` ≥ 16 chars): `GET /api/admin/status`, `POST /api/admin/revoke-user`
  `{ "userId": "alice" }` revokes all live sessions for that user (memory + Redis index).
  Admin routes use only the admin bearer token (no user session required).
- **User registry** (`src/server/userRegistry.ts`): runtime create / rotate / enable / delete users
  without restart. Keys stored as SHA-256 only; plaintext accessKey returned once on create/rotate.
  Login accepts env `AUTH_TOKENS` **or** registry keys. Persist path: `USER_REGISTRY_PATH` (default
  `.data/users.json` when auth/admin is configured). Admin routes:
  `GET/POST /api/admin/users`, `POST .../rotate`, `POST .../enable`, `DELETE .../users/:userId`.
- Mission panel **Admin UI** (collapsible): paste `ADMIN_TOKEN` (sessionStorage only), list/create/rotate/
  enable/delete registry users, one-time accessKey display with copy button. Thai labels throughout.
- **One-time invites** (`src/server/invites.ts`): admin creates invite for a userId (optionally
  auto-create user); recipient opens `/api/invite/redeem?token=...` (GET or POST) and receives a
  fresh accessKey once; invite is burned; existing sessions for that user are revoked. Default TTL
  48h. Admin UI: "สร้าง invite link" + copy. Persist: `INVITE_STORE_PATH`.
- SPA **InviteRedeemModal**: opening `/?invite=<token>` auto-redeems, shows accessKey once, copy +
  one-click login, then strips the token from the URL. Admin-issued `redeemUrl` points at the SPA.
- **Audit log** (`src/server/auditLog.ts`): ring buffer (500) + optional NDJSON file (`AUDIT_LOG_PATH`).
  Records login, user create/rotate, invite create/redeem, session revoke — no secrets. Admin:
  `GET /api/admin/audit?limit=50`. Mission Admin UI: "โหลด audit".











## Cancellable async execution (same V18)

- Added `executeMissionAsync()` / `resumeMissionAsync()`: one task per tick, yielding
  to the event loop between tasks, with bounded recovery of failed tasks.
- Added `requestPause()` / `requestCancel()`: cooperative control applied at the next
  task boundary, so pause/cancel now work mid-mission (closes the synchronous-drain
  limitation above). The Mission panel updates live after each task.
- Verified on the engine (compiled and run in isolation): full run → COMPLETED;
  pause after task 1 → PAUSED with later tasks PENDING, resume → COMPLETED without
  re-running task 1; cancel after task 2 → CANCELLED with remaining tasks CANCELLED.
- NOT verified: `npm run lint` / `npm run build` for the whole app — dependency
  install was blocked (HTTP 403 for `ws@8.22.0`) in this environment. The engine file
  type-checked cleanly; `App.tsx` changes (4 handlers) were not compiled.
- No version number was added or changed.

## Safe parallel read-only scheduling (same V18)

- `executeMissionAsync` now runs independent ready tasks of side-effect-free types
  (READ, ANALYZE, SEARCH, REVIEW, SUMMARIZE; max 3 per tick) as one batch, recorded as a
  `PARALLEL_BATCH` evidence event. Mutation and validation tasks always run alone.
  Controlled by `limits.parallelReadOnly` (default on; set `false` for the old strictly
  sequential graph, dependency vector `[0,1,1,1]`).
- With it on, "Analyze relevant files" no longer waits for "Inspect project"
  (vector `[0,0,2,1]`). Tasks still run one after another inside the JS thread, so this
  is batching/ordering safety, not multi-threaded speed-up.
- Verified in isolation: batch occurs once and mission COMPLETED; sequential mode has
  0 batches; a create-file mission still stops at WAITING_APPROVAL; pause/resume/cancel
  still work. Engine type-checks cleanly. Full `lint`/`build` still unverified (npm 403
  on `ws`).
- No version number was added or changed.

## Model-assisted task planning (same V18)

- New `POST /api/plan-mission` (server.ts) asks the existing Gemini route to decompose an
  objective into tasks (JSON). Requires `GEMINI_API_KEY`; otherwise returns 503.
- `planMissionAsync(mission, planner)` treats the model output as untrusted: it must be
  3+-style structured tasks (>=2, <= maxTasks), known task types, `dependsOn` pointing
  only to earlier tasks (so no cycles), last task VALIDATE, and VALIDATE is forced to wait
  for every leaf task. Anything else is rejected, not repaired.
- On rejection, planner error, or no key, the engine records a `MODEL_PLAN_REJECTED`
  evidence event and falls back to the deterministic planner. Mutation tasks planned by
  the model still stop at WAITING_APPROVAL / WAITING_USER like any other.
- Verified with an injected planner: valid plan → READY with correct graph, runs through
  parallel batch to WAITING_APPROVAL on the create task; forward dependency, missing
  VALIDATE, unknown type, 25 tasks, and planner failure all fall back (5 deterministic
  tasks) with the rejection event; no planner → deterministic.
- NOT verified: the live `/api/plan-mission` call against Gemini (no key/network here),
  server.ts and App.tsx compilation, `npm run lint` / `npm run build` (npm 403 on `ws`).
- No version number was added or changed.

## File attach buttons (same V18)

- Chat input: paperclip button attaches up to 5 text/code files (each <= 200 KB). Files
  are read in the browser as UTF-8; binary or oversized files are rejected with a visible
  message. On send, file contents are appended to the message as fenced blocks; chips
  show attached files and can be removed.
- Mission panel: "Load from file" fills the file name/content for a WAITING_USER mutation
  task (user still presses "Provide inputs & continue"; approval flow unchanged).
- Only text files are supported; images/PDF/zip are not read. Attached text is sent to the
  configured model route like any typed message.
- Not verified at runtime or via `npm run build` (npm 403 on `ws`); the edited components
  were syntax-checked only, without React type definitions.
- No version number was added or changed.

## Endurance & real-browser verification (same V18)

Full `npm install` is blocked in the build sandbox (registry 403 for `ws`, `@tailwindcss/vite`,
`typescript`), so the whole app could not be built or served. Instead the REAL components and
REAL engine were bundled with esbuild (lucide icons stubbed) and driven in Chromium with Playwright.

UI (17 checks, no page errors): live RUNNING state and progress; pause mid-run at 50% then resume
to 100%; cancel mid-run; mutation mission → Approve → WAITING_USER → "Load from file" fills name/content
→ Provide inputs → file really present in the runtime workspace with a snapshot taken first; chat
attach-only send; typed text + attachment via Enter; max 5 attachments; chip removal; 300 KB file and
binary file rejected with message; attachments cleared after send.

Engine stress (9 checks): 16 malformed model plans (null, wrong types, cycles, negative/fractional deps,
`__proto__` type, 1000 tasks) all rejected with safe fallback; 200 random valid DAGs all COMPLETED with
dependency order respected; 300 missions on a 300-file project in ~1.7 s / 41 MB heap; 200 randomized
pause/cancel races all ended in legal states (110 COMPLETED, 90 CANCELLED); re-executing a finished mission
refused; tampered checkpoint refused on resume; model-planned DELETE stops at approval and never fabricates
a mutation.

Still NOT verified: `npm run lint` / `npm run build`, `server.ts`, `App.tsx` compilation, and the live
Gemini `/api/plan-mission` call. Observation: `SelfContainedRuntime` restores its workspace from
localStorage by project key, so stale saved state can override a freshly supplied project.
Test scripts are in `tests/`.

## Fix: stale workspace overriding the live project (same V18)

- `SelfContainedRuntime.restore()` no longer replaces the project passed in with the saved
  copy. Files always come from the live project; memories, tasks, snapshots and events are
  still restored from local storage.
- Verified: a runtime created with new files after an earlier run no longer sees the old
  files (only `new.ts`), and keeps its 1 saved snapshot. Engine stress suite (9/9) and the
  Chromium UI suite (17/17) re-run and pass. Test: `tests/runtime-restore.cjs`.
- No version number was added or changed.

## Server-side mission durability (same V18)

- New `src/server/missionStore.ts` + routes `GET /api/missions`, `GET|PUT /api/missions/:id`
  in `server.ts`. Missions are written atomically (tmp + rename) to `.data/missions/`
  (override with `MISSION_STORE_DIR`; `.data/` is git-ignored). Ids are restricted to
  `[A-Za-z0-9_-]{1,100}`, bodies to 2 MB, and the mission shape is validated before writing.
- Engine: `setRemoteStore()` mirrors every saved mission to the server (coalesced, serialized,
  fire-and-forget); `remoteStatus` reports the real result of the last attempt
  (`OFF` / `PENDING` / `SYNCED` / `FAILED:<reason>`). A server outage never blocks a mission.
  `restoreMissionRemote()` reloads a mission; one persisted as RUNNING is restored as PAUSED with a
  `RESTORED_AFTER_RESTART` event and can be resumed without re-running completed tasks.
- App loads the most recent server mission on startup (silently ignored if the server store is
  unavailable).
- Scope / honesty: this is single-node local-disk durability, not distributed storage; there is no
  authentication or per-user isolation on these routes (same as the existing /api routes), so do not
  expose them publicly as-is. Runtime snapshots/checkpoints themselves still live in browser storage.
- Verified (19 checks, `tests/mission-store.cjs`): traversal/bad ids, oversize, invalid JSON, id mismatch,
  no partial files, 200 overwrites leave no tmp files, corrupt file skipped, restart-and-resume, server
  down, write coalescing. Earlier suites re-run and pass. NOT verified: Express route handlers and
  `App.tsx` wiring (no express/build in sandbox), real HTTP.
- No version number was added or changed.

## Access control, sessions & per-user isolation (same V18)

- `src/server/auth.ts` + `src/server/sessions.ts`: set `AUTH_TOKENS="key:user,key2:user2"` (keys >= 16
  chars, user ids `[A-Za-z0-9_-]{1,64}`, no duplicates; bad config throws at startup = fail closed).
  Keys ("access keys") are accepted ONLY at `POST /api/login`, which returns a random 256-bit session token
  valid for `SESSION_TTL_HOURS` (default 12). Every other `/api` route (except `/api/health`) requires that
  session token, which also protects the Gemini-backed routes. Only the SHA-256 of a session token is kept.
- `POST /api/logout` revokes the session; `POST /api/session/refresh` rotates it (old token dies, fresh TTL).
  Sessions are capped at 1000 (oldest evicted). Optional single-process durability via
  `SESSION_PERSIST_PATH` (atomic JSON write + load on startup); when unset, sessions stay in memory
  only and vanish on restart.
- Access keys are compared in constant time; failed login/auth attempts are limited per IP (10/min → 429).
- With `AUTH_TOKENS` unset the server warns and runs OPEN as user `local` (development only).
- Missions are stored per user: `.data/missions/<user>/`; one user cannot list or load another's.
- Client (`src/utils/authFetch.ts`): the session token is sent to same-origin `/api/` requests only (never
  other origins, never over an explicit header); it is rotated automatically in the last 10 minutes
  (one refresh even for parallel requests); a 401 clears it and emits `codevoice-auth-expired`.
  The Mission panel has Log in / Log out; the access key is never stored, only the session token.
  `installAuthFetch()` is called from `main.tsx` before the React root is created.
- Express wiring in `server.ts` is present and correct: `/api/login` is registered before the auth
  middleware; logout + refresh share the same SessionStore and FailLimiter; `userMissionDir` enforces
  the user-id regex. (Still recommend a full `npm run lint && npm run build` + manual login smoke test
  with a real `AUTH_TOKENS` value before production use.)
- Verified: `tests/auth.cjs` (12), `tests/sessions.cjs` (24), `tests/ui-login-playwright.cjs` (9, real
  Chromium over HTTP with mocked API; UI strings now Thai), plus earlier suites re-run: stress 9/9,
  store 19/19, UI 17/17. Express wiring in `server.ts` + `main.tsx` inspected and confirmed present.
- UI (Mission panel): login / logout / error / expired messages are in Thai; access-key input never
  stores the secret; only the short-lived session token is kept in localStorage.
- Limits: access keys are static shared secrets (no user management/registration, no password hashing
  since they are random keys); session token sits in browser localStorage (XSS would expose it); use HTTPS;
  limiter + optional file store (`SESSION_PERSIST_PATH`) are still single-process only. For multi-machine
  deployments replace the SessionStore with a Redis (or equivalent) backend.
- No version number was added or changed.

## Pipeline status fix: FAILED runs no longer leave steps "pending" (same V18)

- Cause: `AgentExecutionView` derived the 8 step statuses only from diffs/validation/QA, so a failed run
  (e.g. the `/api/chat` request erroring) showed steps 4, 7, 8 as `pending` next to completed 5 and 6, hid which step
  broke, and the card renderer had no styling for `failed`/`skipped`.
- Fix: `src/utils/pipelineSteps.ts` derives steps from real evidence. FAILED marks the stage that actually broke
  (validation gate → step 5, failed tool or request → step 4), keeps only evidenced steps completed and marks the
  rest `skipped`; COMPLETED completes all steps but marks Browser QA `skipped` when no report exists. The UI now shows
  a failure banner with the real reason and a Retry button (`failureReason` wired from App for request errors and
  validation errors).
- Tests: `tests/pipeline-steps.test.ts` (7). Real component rendered in Chromium (FAILED and COMPLETED views,
  Retry click, no page errors) — layout styling not checked (Tailwind not compiled in the sandbox).
- This does not make a failed request succeed: if the cause is a missing `GEMINI_API_KEY` or server error, that
  must be fixed and the run retried.
