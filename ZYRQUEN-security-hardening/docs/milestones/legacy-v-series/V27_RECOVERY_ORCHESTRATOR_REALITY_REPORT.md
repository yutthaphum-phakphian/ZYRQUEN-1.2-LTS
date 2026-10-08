# CodeVoice AI V27 — Mission Recovery Orchestrator Reality Report

## Objective
V27 extends V26 deterministic replay into a durable restart/recovery coordinator. It verifies the mission journal, reconstructs mission state, reconciles transactional state, and can resume eligible interrupted missions from verified durable state.

## Implemented
- `server/missionRecoveryOrchestrator.ts`
- Mission recovery inspection
- Verified-journal gate before resume
- Deterministic replay as recovery source of truth
- Durable mission state update on resume
- `MISSION_RESUMED_FROM_DURABLE_STATE` evidence event
- Recovery sweep across durable mission records
- Per-mission restart/recovery endpoint
- Bulk automatic recovery endpoint
- Client helpers in `src/tools/durableRuntime.ts`
- V27 test harness
- Package version `27.0.0`

## Recovery Policy
Resumable statuses: `RUNNING`, `RECOVERING`, `VALIDATING`, `ANALYZING`, `PLANNING`.

Terminal or human-gated states are not automatically resumed. `WAITING_APPROVAL` remains approval-gated. Completed, failed, cancelled and other terminal states are left unchanged.

A mission with a failed journal integrity check is `BLOCKED` and is never auto-resumed.

## Real Tests
- V25 recovery reconciler: PASS
- V26 deterministic replay: PASS
- V27 recovery orchestrator: PASS
- Resume reconstructs current task/progress from journal: PASS
- Tampered journal blocks recovery: PASS
- Recovery sweep detects and blocks tampered mission: PASS

## Build Verification
`npm run lint`: NOT VERIFIED / BLOCKED because the archive does not contain `node_modules` and the environment cannot resolve `vite/client`.

Full Vite/browser build: NOT VERIFIED.

No build PASS is claimed from this environment.

## API
- `GET /api/durable/recovery/mission/:missionId`
- `POST /api/durable/recovery/mission/:missionId/resume`
- `POST /api/durable/recovery/mission/:missionId/restart`
- `POST /api/durable/recovery/auto`

## Safety
- Journal integrity is mandatory before resume.
- Replay/reconstruction is read-only until the mission is explicitly resumed.
- Existing V20–V26 durable integrity, transaction, workspace, and replay boundaries remain in place.
- No unrestricted shell execution or external provider behavior was introduced.

## Known Limitations
- The recovery coordinator resumes durable mission state; actual long-running task execution still depends on the existing V18/V19 runtime worker path.
- No automatic package installation is performed.
- Browser/E2E regression is not verified in this environment.

## Output
`codevoice-ai-v27-recovery-orchestrator.zip`
