# Local Runtime — Phase 07

## Implemented boundary

`RuntimeAdapter` defines `capabilities`, `create`, `start`, `stop`, `restart`, `inspect`, and `destroy`. `LocalRuntimeAdapter` is the foundation's local implementation. It runs a fixed, bundled control loop inside a browser Web Worker, scoped to the current page/tab. It is **not** a host process manager, container runtime, or cloud runtime.

The frozen `WorkspacePlatform` facade exposes a detached, read-only `runtimeCapabilities()` snapshot. UI lifecycle actions still follow `UI → Command → State Machine → Provisioner → RuntimeAdapter`; the UI does not receive or call the adapter.

## Capability contract

- The `localRuntimeWorker` feature flag enables or disables Worker lifecycle support.
- Browser support for `Worker`, `Blob`, and object-URL APIs is checked before reporting lifecycle operations as available. `capabilities()` distinguishes `AVAILABLE`, `NOT_CONFIGURED`, and `UNAVAILABLE`.
- Supported operations are create, start, stop, restart, inspect, and destroy. The Worker accepts only a fixed set of lifecycle messages; Workspace input cannot supply source code.
- Each Workspace has at most one managed Worker in this adapter instance. Requests are correlated, bounded by a timeout, and Worker errors make inspection unavailable.
- Destroy sends a lifecycle request, then always terminates the Worker and revokes its generated object URL. If the page closes, browser Workers end with that page.
- A persisted handle cannot restore the old Worker after refresh or in another tab. A new Runtime session must be established through Workspace commands.

## Explicit non-capabilities and security scope

`RuntimeCapabilities` reports `hostProcess: false`, `hostFilesystem: false`, `hostTelemetry: false`, and `arbitraryUserCode: false`. This adapter does not provide a shell, filesystem operations, user-supplied code execution, port exposure, network clients, host metrics, cross-tab sharing, durable execution, or background execution after the page closes. The Worker source is fixed and uses only in-memory state and lifecycle messages. Browser Web Workers in general can have platform APIs such as `fetch`; this adapter does not expose a fetch/network operation or arbitrary script interface.

Resource Engine limits remain configured quota policy, not detected host capacity. Actual host usage stays `UNAVAILABLE` and `used` remains `null`.

## Failure behavior

Unsupported browser APIs are reported as `UNAVAILABLE`; a disabled flag reports `NOT_CONFIGURED`. Worker construction, message, timeout, and lifecycle errors are returned as typed Runtime failures and flow through Provisioner compensation. Capability snapshots are informational only and do not bypass Command Engine or State Machine checks.

No cloud, AI, external API, container orchestration, host process bridge, or remote deployment integration is included in this phase.
