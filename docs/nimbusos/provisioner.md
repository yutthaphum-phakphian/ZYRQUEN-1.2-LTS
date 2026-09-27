# Workspace Provisioner — Phase 08

## Scope

`WorkspaceProvisioner` orchestrates Workspace lifecycle work behind the Command Engine. It coordinates the Workspace Repository, State Machine, Resource Engine, injected `RuntimeAdapter`, and the internal event bus. It does not implement cloud/provider calls, host process launch, distributed scheduling, retries in the background, or external integrations.

## Create sequence

```text
validate request
→ persist CREATING record
→ State Machine CREATING → INITIALIZING (persist, emit transition)
→ reserve quota
→ persist reservation snapshot
→ RuntimeAdapter.create
→ persist READY state (State Machine)
→ emit WORKSPACE_READY
```

Every exception after record creation enters compensation:

1. If a Runtime handle is known, attempt `RuntimeAdapter.destroy` before releasing quota.
2. If runtime cleanup fails, preserve the known handle and reservation, persist the Workspace in `ERROR`, and report `PROVISIONING_COMPENSATION_FAILED` with the primary failure as `cause` plus cleanup detail in the message. Quota restoration includes nonzero allocations on `ERROR` Workspaces after restart so capacity is not silently oversubscribed.
3. If runtime cleanup succeeds, persist an `ERROR` snapshot with a cleared local handle and zero allocated quota via the Resource Engine's pre-release commit callback. Only after that save succeeds does Resource Engine remove the reservation.
4. If the error snapshot cannot be committed, retain the in-memory reservation and report that failure rather than pretending cleanup succeeded.
5. Emit transition/error/release events only after their corresponding persisted state/resource changes.

If the RuntimeAdapter fails before returning a handle, Provisioner cannot infer or destroy an unknown partial provider-side instance. A future adapter must define an explicit discoverable/idempotent create-and-compensate contract before external provisioning is enabled.

## Start, stop, restart

Each operation follows `State Machine transition → Repository save → transition event → RuntimeAdapter operation → persist resulting handle/state`. Runtime failure transitions the latest persisted Workspace into `ERROR`; retained runtime handles remain truthful and can be retried or inspected through the adapter boundary. All lifecycle commands remain serialized per Workspace by the Command Engine.

## Destroy sequence and retry

```text
persist DESTROYING
→ destroy known Runtime handle
→ ResourceEngine.release(workspaceId, beforeCommit)
    ├─ save DESTROYING snapshot with cleared handle and zero allocated quota
    └─ delete reservation only after the save succeeds
→ delete Workspace record
→ emit DESTROYED transition + WORKSPACE_DESTROYED
```

The Resource Engine holds its quota queue while the pre-release persistence callback runs. A failed callback leaves the allocation intact. If Runtime destruction fails, an `ERROR` Workspace retains its existing handle/allocation. If Runtime destruction succeeds but later quota persistence or record deletion fails, Provisioner keeps an `ERROR` record that reflects the cleared runtime handle; allocated quota is retained only until its zero-allocation snapshot is persisted. A subsequent DESTROY command can safely retry without destroying an already-cleared Runtime again.

## Limitations

- Repository operations are local-development in-memory/Local Storage only, not database transactions.
- There is no crash-atomic transaction spanning Workspace storage, quota memory, and a real Runtime.
- An adapter process may fail after creating an external resource but before returning a handle; no safe cleanup is possible without a provider-specific recovery capability.
- Event history, live command history, and idempotency keys are session-local. Terminal command records are copied to the local, retention-capped audit repository by Command Engine; this is not a tamper-evident ledger, global lease, cross-tab lock, or distributed compensation mechanism.
- Tests inject Repository and Resource Engine failures at the composition root. This injection does not expose mutable infrastructure through the UI-facing `WorkspacePlatform` façade.
