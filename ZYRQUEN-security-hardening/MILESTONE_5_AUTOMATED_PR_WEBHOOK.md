# Milestone 5 — Automated Pull Request + Webhook

## Implemented

- Added `server/gitPullRequestAutomation.ts`
  - GitHub Git Data API flow: base ref → blobs → tree → commit → branch ref → Draft Pull Request.
  - Explicit `approved === true` gate.
  - Recomputes the developer patch preview and requires an exact `patchHash` match immediately before remote mutation.
  - Refuses non-GitHub providers in this execution layer.
  - Refuses execution when `GITHUB_TOKEN` is absent; token is read at runtime and never placed in audit payloads.
  - Detects an existing target branch before creation.
  - Keeps workspace mutation-free; the remote repository receives the proposed commit.
  - Returns `CREATED`, `BLOCKED`, or `FAILED` with an audit hash.

- Added `server/webhookNotifier.ts`
  - HTTPS-only outbound webhook.
  - Blocks localhost/private/link-local IPv4 destinations.
  - Optional exact hostname allowlist.
  - HMAC-SHA256 signature in `x-codevoice-signature`.
  - Delivery ID, timestamp, event type, and payload audit hash.

- Extended `src/server/selfHealingRoutes.ts`
  - `POST /api/self-healing/drafts/:draftId/pull-request`
  - Requires authenticated project ownership.
  - Workspace must remain inside the server workspace boundary.
  - Requires explicit approval and patch hash.
  - Optional notification after a successfully created PR using server-side webhook configuration.
  - Audits the PR result.

## Runtime configuration

- `GITHUB_TOKEN` — GitHub token with repository permissions required to create branches/commits/PRs.
- `SELF_HEALING_WEBHOOK_URL` — HTTPS webhook endpoint.
- `SELF_HEALING_WEBHOOK_SECRET` — HMAC secret; never send this in request bodies or audit records.
- `SELF_HEALING_WEBHOOK_ALLOWED_HOSTS` — optional comma-separated exact host allowlist.

## Verification

Executed with Node 22 native TypeScript stripping because dependency installation in the sandbox timed out. The focused Milestone 5 + existing Git dry-run tests passed:

- 7/7 tests passed.
- Existing dry-run workspace mutation protections passed.
- Automated PR mocked execution passed.
- Webhook signature/HTTPS/private-host tests passed.

Full project `npm ci`, full TypeScript typecheck, build, and complete regression suite were **not claimed as passed** in this environment because dependency installation did not complete.
