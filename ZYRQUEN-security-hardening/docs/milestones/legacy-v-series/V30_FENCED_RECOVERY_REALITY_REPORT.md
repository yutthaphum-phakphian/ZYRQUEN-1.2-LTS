# V30 — Fenced Recovery Runtime Reality Report

## Objective
Close the gap between V29 worker fencing and the durable recovery orchestrator: a mission recovery state transition must be performed only by an exclusively fenced worker, with fence checks immediately before durable mutation.

## Implemented
- `resumeMissionWithWorkerLease(missionId, workerId, leaseId)`
- exclusive worker fence validation before inspection
- heartbeat before recovery mutation
- second fence validation immediately before mission save
- durable recovery event includes worker/lease evidence
- `recoverMissionWithWorker(missionId, workerId, ttlMs)` claim → fenced resume → release lifecycle
- stale/released worker is rejected from recovery resume
- package version 30.0.0
- V30 regression test

## Tests
- V30 fenced recovery: PASS
- V29 worker fencing regression: to be run in this environment

## Verification limits
The environment may not contain a complete `node_modules` installation. No Vite/browser build is claimed unless executed successfully.

## Design boundary
This version hardens the durable recovery handoff. It does not claim that every long-running autonomous task execution is server-worker based; browser/local runtime execution remains a separate layer.
