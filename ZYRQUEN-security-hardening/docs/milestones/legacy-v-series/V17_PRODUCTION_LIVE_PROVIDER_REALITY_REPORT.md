# V17 Production Live Provider & Durable Infrastructure Reality Report

## Executive summary

V17 extends V16 with provider lifecycle abstractions, credential vault boundary,
provider connection manager, local checkpoint store with integrity verification,
action-bound approval service, webhook replay guard, post-action verification
states, compensation status, and a V17 Production Provider Center. Existing V12
through V16 runtimes remain authoritative.

The current sandbox has no secure vault backend, OAuth callback service, live
provider credential, database driver, MCP transport, GraphQL provider, WebSocket
provider, or server checkpoint store. V17 therefore reports those capabilities as
`UNAVAILABLE` or `PARTIAL`; no fake provider or credential was created.

## Implemented

- `CredentialVault` abstraction that returns `UNAVAILABLE` without a secure
  backend and never stores raw secrets.
- `ProviderConnectionManager` with connect/disconnect/health-check state and
  evidence fields. Metadata-only credential references remain `AUTH_REQUIRED`.
- Capability/readiness reuse of V16 and V13 Integration Hub state.
- `LocalCheckpointStore` with `LOCAL_ONLY` durability and integrity hash
  verification. No server durability claim.
- `ApprovalService` binding approval to mission, execution, action, tool, provider,
  operation, risk, and parameters hash. Mismatched actions are rejected.
- Webhook replay guard layered on V16 HMAC/timestamp validation using event IDs.
  Payloads remain untrusted data.
- Post-action verification states: `VERIFIED` only with operation ID plus
  follow-up evidence; otherwise `EXECUTED_UNVERIFIED`.
- Compensation state reports `UNSUPPORTED` without provider rollback evidence.
- Provider Center UI on desktop/mobile and existing voice command route reuse.

## Verified REAL

| Capability | Evidence |
|---|---|
| Credential vault boundary | Resolver returns unavailable without backend; raw secret storage remains disabled |
| Action-bound approval | Approval test rejected mismatched action with `ACTION_BINDING_MISMATCH` |
| Local checkpoint integrity | Created record returned `LOCAL_ONLY`; integrity verification returned true |
| Post-action verification guard | Operation ID + follow-up read returned `VERIFIED`; missing evidence returned `EXECUTED_UNVERIFIED` |
| Webhook HMAC architecture | Web Crypto HMAC test returned `ACCEPTED` and untrusted-data marker |
| Provider readiness matrix | Reuses V16/V13 actual connector state; zero providers found in current runtime |
| Provider Center UI | Desktop/mobile panel connected and build-validated |

## PARTIAL

| Capability | Reason / enablement |
|---|---|
| Provider connection manager | Lifecycle exists, but no vault/provider is configured |
| REST provider | V13 HTTPS path and V16 security checks exist; live credential and provider are absent |
| Webhook ingress | HMAC and replay guard exist; server ingress/event persistence is absent |
| Checkpoint store | Local integrity-checked storage exists; server/distributed adapter is absent |
| Approval service | Exact action binding exists locally; durable server approval authority is absent |
| Verification | Evidence-based states exist; live mutation/follow-up read is unavailable |
| Health monitor | V16 health evidence is reused; no live provider health response |
| Idempotency | Provider-aware status fields exist; provider-side support is unknown without a provider |

## UNAVAILABLE

- Secure credential vault backend
- OAuth callback/token exchange/refresh/revocation service
- PostgreSQL/MySQL/SQLite database drivers
- MCP transport and server discovery
- GraphQL provider
- WebSocket provider
- Durable server/distributed checkpoint store
- Provider rollback/compensation implementation
- Live provider end-to-end test

Current readiness is `NO_LIVE_PROVIDER_CONFIGURED`. No provider is reported
`CONNECTED`, `HEALTHY`, or `READY`.

## Security tests

- V16 SSRF protections retained: loopback, private, metadata, userinfo, and
  non-allowlisted targets are blocked; DNS/rebinding uncertainty remains
  conservative `UNKNOWN`.
- Dangerous SQL and unsafe interpolation remain blocked.
- Web Crypto HMAC accepted a valid signed payload and marked it untrusted data.
- Replay test path rejects duplicate event IDs after first accepted event.
- Approval replay/mismatch rejects a different action or parameter hash.
- Checkpoint integrity verification detects modified record content.
- Secret scan blocked a test report containing `Authorization: Bearer`.
- No raw secret was stored in V17 state, trace, report, or ZIP.

## Failure injection results

| Failure | Result |
|---|---|
| Missing credential | `AUTH_REQUIRED` / `SECURE_CREDENTIAL_VAULT_UNAVAILABLE` |
| OAuth callback unavailable | `UNAVAILABLE` |
| Provider unavailable | `UNAVAILABLE` |
| Database unavailable | `UNAVAILABLE` |
| MCP unavailable | `UNAVAILABLE` |
| GraphQL unavailable | `UNAVAILABLE` |
| WebSocket unavailable | `UNAVAILABLE` |
| SSRF attempt | `DENY` |
| DNS rebinding uncertainty | `UNKNOWN` / blocked before unsafe allow |
| Dangerous SQL | `BLOCKED` |
| Webhook signature failure | `REJECTED` |
| Webhook replay | `REJECTED:DUPLICATE_EVENT_ID` |
| Approval action mismatch | `REJECTED:ACTION_BINDING_MISMATCH` |
| Missing verification evidence | `EXECUTED_UNVERIFIED` |
| Missing rollback capability | `UNSUPPORTED` |

## Build and regression

- `npm run lint` — passed after V17 type correction.
- `npm run build` — passed.
- V17 provider/checkpoint/approval/verification tests — passed.
- V16 security and export tests retained.
- ZIP integrity — validated in final package command.
- Existing V12–V16 systems were extended additively; no duplicate core runtime,
  permission system, connector registry, or execution engine was created.

## Exact next infrastructure dependencies

1. Secure server-side vault or external secret manager.
2. OAuth callback server with PKCE/state/nonce and redirect allowlist.
3. Approved live provider credentials and provider-specific health/read APIs.
4. Server database driver and policy-controlled connection pool.
5. MCP, GraphQL, and WebSocket transport adapters.
6. Server webhook ingress, replay store, rate limiting, and event bus.
7. Server/distributed checkpoint and approval stores.
8. Provider-specific idempotency, verification, and compensation APIs.

V17 stops here. No V18 work was started.
