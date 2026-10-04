# V16 Production Infrastructure & Live Connector Completion Reality Report

## Executive summary

V16 extends the V13 Integration Hub and V15 execution layer without creating a
second Integration Hub, Tool Registry, Permission System, Model Router, Event
Bus, or runtime. It adds provider-aware capability/readiness inspection,
provider-neutral credential references, OAuth availability status, SSRF/domain
validation, parameterized SQL safety checks, browser-compatible webhook HMAC
verification architecture, provider health evidence, provider-aware status
reporting, and a desktop/mobile Infrastructure Readiness panel.

No provider, credential vault, OAuth callback service, database driver, MCP
transport, or WebSocket provider was available in the current sandbox. Those
capabilities are reported `UNAVAILABLE` or `PARTIAL`, never as connected or
healthy. Current runtime result: `NO_LIVE_PROVIDER_CONFIGURED`.

## Architecture changes

- Extended the existing V13 state and connector metadata through
  `infrastructureCompletion.ts`.
- Added capability metadata: health, idempotency, webhook, streaming,
  transaction, rollback, authentication, and supported operations.
- Added dynamic readiness matrix based on actual V13 state, not UI presence.
- Added credential references only; raw credentials are not accepted into V16
  persistence, trace, UI, reports, or exports.
- Added provider-neutral OAuth lifecycle status that returns `UNAVAILABLE` when
  callback infrastructure is absent.
- Added SSRF/domain validation with HTTPS requirement, private/link-local/
  metadata host blocking, URL userinfo rejection, and conservative `UNKNOWN`
  for DNS/rebinding checks requiring server-side resolution.
- Added SQL safety inspection that accepts parameterized queries and blocks
  dangerous SQL/dynamic interpolation. Database execution remains unavailable
  without a driver.
- Added webhook validation architecture using Web Crypto HMAC, timestamp/event
  requirements, and explicit untrusted-data classification.
- Added V16 Infrastructure Readiness panel to desktop and mobile navigation.
- Added voice routing for provider, health, credential-status, webhook, MCP, and
  production status commands.

## Provider readiness matrix

| Capability | Status | Evidence / enablement |
|---|---|---|
| Secure credential vault | UNAVAILABLE | No server-side vault configured; enable a secure vault adapter |
| Credential references | PARTIAL | Typed references exist; no real secret resolution |
| OAuth2 lifecycle | UNAVAILABLE | Callback/exchange service absent; add a server callback with PKCE/state validation |
| REST | PARTIAL | Existing V13 HTTPS REST path is present; no live credential/provider configured |
| Database | UNAVAILABLE | No database driver/connection configured |
| MCP | UNAVAILABLE | No MCP transport/server configured |
| GraphQL | UNAVAILABLE | No GraphQL provider/transport configured |
| WebSocket | UNAVAILABLE | Browser architecture not registered as a provider transport |
| Webhook ingress | PARTIAL | HMAC/timestamp/event validation architecture exists; no server ingress/event bus deployment |
| Provider health | PARTIAL | Readiness is evidence-based; health is UNKNOWN without connector health operation |
| Rate limits | PARTIAL | V13 bounded retry metadata exists; no live provider headers observed |
| Durable checkpoint | PARTIAL | V15 local metadata checkpoint exists; server/distributed store unavailable |
| Approval service | PARTIAL | Existing V12/V15 permission boundary remains authoritative; no separate server approval service created |
| Provider idempotency | UNKNOWN/PARTIAL | Capability field is tracked; provider support cannot be inferred without live provider evidence |
| Compensation/rollback | UNAVAILABLE | No provider transaction/compensation capability configured |
| External verification | UNAVAILABLE | Requires a live provider mutation plus follow-up read |
| Production export scan | PARTIAL | Existing ZIP excludes environment files; final V16 export secret-scan gate remains a deployment hardening task |

## Security test results

| Test | Result |
|---|---|
| HTTPS requirement | PASS; non-HTTPS URLs denied |
| localhost / loopback | PASS; denied |
| RFC1918 private ranges | PASS; denied |
| link-local / cloud metadata IP | PASS; denied |
| URL userinfo trick | PASS; denied |
| optional domain allowlist | PASS; non-allowlisted domain denied |
| DNS rebinding / redirect target | Conservative `UNKNOWN`; server-side resolution required before allow |
| SQL destructive operation | PASS; blocked |
| SQL interpolation pattern | PASS; blocked |
| parameterized SQL representation | PASS; accepted as safe for driver boundary |
| credential leakage | PASS at V16 boundary; only references are modeled |
| webhook signature | Browser Web Crypto HMAC architecture implemented; live ingress unavailable |
| webhook replay | Timestamp/event ID inputs required; persistent duplicate-event store unavailable |
| OAuth CSRF | Lifecycle is UNAVAILABLE until server callback/state store exists; not claimed secure/live |
| prompt injection | Reuses V14 untrusted-data boundary |

## Test execution

- `npm run lint` — passed.
- `npm run build` — passed.
- SSRF matrix executed against public, loopback, metadata, userinfo, and
  allowlisted URLs.
- SQL matrix executed for parameterized, destructive, and interpolated queries.
- Provider report generated with zero live providers and explicit unavailable
  findings.
- ZIP integrity validation is performed in the final packaging command.

## REAL / PARTIAL / UNAVAILABLE / MOCK

| Feature | Classification | Why |
|---|---|---|
| Capability discovery | REAL | Inspects registered V13 connector metadata |
| Dynamic provider readiness | REAL/PARTIAL | Uses actual connector/integration state; no provider can become READY without evidence |
| Credential abstraction | REAL/PARTIAL | References and status exist; vault resolution unavailable |
| Raw secret protection | REAL/PARTIAL | No raw secret persistence; deployment-wide scans still depend on export path |
| OAuth architecture | UNAVAILABLE | Callback infrastructure not available |
| REST connector | PARTIAL | Existing V13 code path exists; secure credential/provider readiness absent |
| SSRF validation | REAL/PARTIAL | Deterministic local blocks are real; DNS rebinding/redirect verification needs server resolver |
| Database connector | UNAVAILABLE | Driver absent |
| MCP transport | UNAVAILABLE | Transport absent |
| GraphQL connector | UNAVAILABLE | Transport/provider absent |
| WebSocket connector | UNAVAILABLE | Provider transport absent |
| Webhook security | PARTIAL | HMAC validation architecture exists; ingress/event bus deployment absent |
| Provider health monitor | PARTIAL | Evidence model exists; no real provider health response |
| Rate-limit management | PARTIAL | Bounded policy metadata exists; no live headers observed |
| Durable checkpoint | PARTIAL | V15 local persistence only |
| Approval service | PARTIAL | Existing permission boundary reused; server approval store absent |
| Provider idempotency | PARTIAL | Capability detection metadata exists; no provider evidence |
| Compensation | UNAVAILABLE | No provider compensation action available |
| External verification | UNAVAILABLE | No live mutation/provider available |
| Infrastructure UI | REAL | Desktop/mobile panel reads the generated report |
| MOCK | NONE in V16 core | No missing provider is represented as a fake provider |

## Known limitations and dependencies

1. A server-side secure vault is required before any provider can become
   credential-ready. Enablement requires a vault adapter and a credential
   reference resolver that never returns secrets to browser/UI state.
2. OAuth requires a server callback endpoint, secure state/PKCE storage, token
   exchange, refresh, revocation, and redirect allowlisting.
3. Database support requires an approved server-side driver and parameterized
   query adapter with permission gates.
4. MCP, GraphQL, and WebSocket require real transport/provider adapters.
5. Webhook ingress requires a server endpoint, replay-resistant event store,
   rate limiting, schema validation, and the existing event bus.
6. Durable checkpoints require server/distributed persistence; localStorage is
   explicitly `LOCAL_ONLY` and not server durable.
7. Distributed rollback requires provider-specific compensating operations and
   must be reported as compensation, not guaranteed transaction rollback.
8. The known Vite `__dirname` future config-loader warning and bundle-size
   advisory remain technical debt; neither is a build error.

## Regression result

V1–V15 behavior was preserved through additive type/runtime/UI changes. V16
uses the existing V13 Integration Hub, V14 research trust model, and V15
execution boundaries. No V17 work was started.
