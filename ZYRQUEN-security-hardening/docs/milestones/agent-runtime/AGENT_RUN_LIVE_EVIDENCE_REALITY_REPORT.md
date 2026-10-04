# Agent Run Live Evidence — Reality Report

## Delivered

This milestone closes the runtime-to-UI observability gap for durable Agent Runs.

### Runtime
- Agent Run execution now persists a `RUNNING` execution checkpoint before work starts.
- Each completed capability step is persisted immediately with its evidence and audit hash.
- Final `COMPLETED` / `FAILED` state remains durable and integrity-protected.
- Existing execution gateway behavior and capability gates remain unchanged.

### UI
- Added `AgentRunMonitor`.
- Added a `Durable Run` tab to `AgentExecutionView`.
- Monitor accepts an Agent Run ID or reads `agentRunId` from the URL query string.
- Polls the durable Run + execution records every 1.5 seconds.
- Shows admission status, run status, execution status, progress, step status, evidence, and per-step audit hash.

## API surface used

- `GET /api/runtime/agent/run/:id`
- `GET /api/runtime/agent/run/:id/execution`

## Reality boundaries

- The monitor observes the server durable store; it does not invent progress.
- Polling is client-side and intentionally bounded to one Run ID.
- Evidence is whatever the executed capability actually returned.
- The monitor does not bypass approval, leader, or worker-fence checks.
- Full TypeScript/build verification still depends on installing the project's declared dependencies in the environment.

## Verification

Passed:
- Agent run live evidence milestone
- Agent run execution gateway milestone
- Agent run control milestone
- Upgrade admission milestone
- Agent governance foundation pack
- Agent expansion pack
- Agent planning + capability registry milestone
