# CodeVoice AI V11 Multi-Agent Team Runtime

V11 adds a coordinated team layer on top of V1–V10. Existing Agent Runtime,
Tool Orchestrator, Project Brain, Memory, Browser/Visual QA, Security,
Performance, Production Build, Release Gate, Snapshot/Rollback, ZIP Export,
Voice Router, and Workspace UI remain the authorities for their capabilities.

## Implemented

The new `TeamRuntime` creates a Lead and selectively activates Coder, UI/UX,
QA/Browser, Security, Performance, Reviewer, and Release roles based on the
user objective. It creates a dependency-aware task graph and one shared
`TeamTaskState`. Agents return structured `AgentResult` values and communicate
with structured `AgentMessage` records. Evidence, findings, blockers, retries,
context size, and final decisions are persisted in the shared state.

File ownership locks and conflict detection prevent simultaneous writes to the
same path. Code/UI specialists do not silently mutate files: mutations require
an explicit ChangeSet and the existing Agent Runtime remains the implementation
route. V10 remains the only Release Engine.

The Team panel is available on desktop and mobile. It shows real agent status,
current action, progress based on task state, files, evidence, errors, task
Graph, and a final reality report. Voice routing supports team creation,
role-targeted requests, stop-all, pause, resume, and cancellation commands.

## Executed scenarios

| Scenario | Result |
|---|---|
| `สร้างหน้า Login` team selection | Lead + UI/UX + Coder + Reviewer selected |
| `เตรียม production` team selection | Lead + QA + Security + Performance + Reviewer + Release selected |
| Two agents lock the same file | First lock granted; second lock denied with conflict evidence |
| Critical secret detection | Security audit returned `releaseBlocked=true` and one critical finding |
| Shared-state team execution | Structured messages/evidence produced; browser unavailable outside browser is reported as BLOCKED/PARTIAL, not PASS |
| V10 integration | Team reality report delegates Release and Rollback to V10 |

## Validation

`npm run lint` passed with TypeScript no-emit. `npm run build` passed. Vite still
reports the existing future `__dirname` config-loader warning and the existing
large-bundle advisory; these are warnings, not fabricated passes.

## Reality boundaries

Multi-Agent Orchestration, Agent Execution, File Coordination, Review, and
Rollback are REAL in the local runtime. Browser QA is REAL only when a browser
probe loads; otherwise it is PARTIAL/BLOCKED. Vulnerability database scanning,
Lighthouse, deployment, and external publishing remain UNAVAILABLE unless the
corresponding runtime/service is present.
