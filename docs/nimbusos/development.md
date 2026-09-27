# Development — Foundation Through Phase 10

## Requirements

- Node.js 22 (the current project toolchain)
- pnpm installed via the project environment

No service credentials, cloud account, API key, database, or external authentication are needed.

## Commands

From the project root:

```bash
pnpm install
pnpm run dev
pnpm run check
pnpm run lint
pnpm test
pnpm run build
```

`pnpm run lint` checks formatting and configured project lint rules for the implemented Core, Local Runtime Adapter, and main dashboard.

## Tests

Run all unit tests with `pnpm test`; re-run on changes with `pnpm run test:watch`. Core tests use in-memory repositories and explicit Runtime test fixtures only inside automated tests. Worker lifecycle behavior uses a deterministic fake host in tests; tests do not launch external services or user code.

## Local data and Worker lifetime

Workspace records persist in the browser's `localStorage` under `nimbusos.workspace-core.v1`; terminal Command audit records use `nimbusos.command-audit.v1`. Clearing browser storage deletes both development stores. Bounded Internal events, live command history, and idempotency keys are in-memory and are lost on refresh. A real Local Runtime Worker belongs to the page/tab, ends when that page closes, and cannot be resumed from a persisted handle after refresh.

## Known limitations

- The Browser Worker executes only the adapter's fixed lifecycle control loop. It is not an OS process, Shell, Container, or general-purpose code runner.
- There is no user-code execution, host Filesystem, host process control, host telemetry, exposed network operation, background execution after the tab closes, or cross-tab Worker sharing.
- Resource limits are configured reservation policy, not system-detected capacity; actual host usage is unavailable.
- The audit trail is local, single-device, retention-capped storage; it is not tamper-evident, legal-grade, or cross-device synchronization.
- No server-side persistence, authentication, multi-user isolation, production observability, AI Agent, cloud/provider, external API, container, or deployment integration exists.
