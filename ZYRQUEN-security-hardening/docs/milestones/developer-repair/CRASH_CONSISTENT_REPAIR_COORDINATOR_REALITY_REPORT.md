# Crash-Consistent Repair Coordinator — Reality Report

## Capability
The developer repair path now uses a durable coordinator between the approved patch and the filesystem mutation.

Flow:

`PATCH APPROVED -> DURABLE PREPARE + BEFORE IMAGE -> APPLYING -> ATOMIC FILE REPLACEMENT -> APPLIED JOURNAL -> TRANSACTION COMMIT -> VERIFY`

If the process stops between filesystem mutation and durable transaction completion, recovery compares the actual workspace against two durable states:

- desired state: finalize the transaction when the complete intended state is present;
- before-image: abort when the workspace is still exactly unchanged;
- ambiguous state: stop with `RECOVERY_REQUIRED` rather than guessing.

## Safety boundaries
- mission worker fence is checked before and during mutation;
- project-level durable lock prevents concurrent repair coordinators for the same project;
- path traversal is rejected;
- expected file hashes are validated before mutation;
- file writes use temporary-file + rename for each file;
- repair operations are bounded by the existing repair loop limit;
- recovery never invents a patch or silently chooses between conflicting filesystem states.

## Integration
`server/developerRepairLoop.ts` now delegates approved filesystem mutation to `server/crashConsistentRepairCoordinator.ts`.

Recovery API:

`POST /api/runtime/developer-workflow/repair/recover`

with `{ "repairId": "..." }`.

## Validation
Passed:

- Crash-consistent repair coordinator milestone
- Developer repair loop milestone
- Developer patch engine milestone
- Developer repair planner milestone
- Developer workflow verification milestone
- Real tool execution milestone
- Runtime control plane milestone
- Runtime execution gateway milestone

## Important boundary
This is crash-consistent coordination for the controlled developer workspace plus durable transaction evidence. It is not a claim of distributed ACID semantics across an arbitrary external filesystem/database pair. When recovery sees an ambiguous state, it deliberately stops instead of guessing.
