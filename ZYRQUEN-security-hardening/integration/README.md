# CodeVoice AI ↔ ZYRQUEN Bridge

This adapter connects the conversational/proposal side to ZYRQUEN's governed agent-run surface.

## Safety contract

- Health is checked before handoff.
- CodeVoice output is treated as a proposal, never as proof of execution.
- ZYRQUEN receives a bounded, medium-risk governed run.
- No workspace mutation is performed by this bridge.
- Approval is manual by default.
- Auto-approval requires an explicit bearer token and `BRIDGE_AUTO_APPROVE=1`.
- Production requires HTTPS for both endpoints.
- Timeouts are bounded and failures are fail-closed.

## Run

From the project root:

```bash
cp integration/.env.example .env.bridge
set -a; . ./.env.bridge; set +a
node integration/bridge.mjs
```

For a deliberate approval flow:

```bash
export ZYRQUEN_AUTH_TOKEN='...'
export BRIDGE_AUTO_APPROVE=1
node integration/bridge.mjs
```

The bridge intentionally stops at the governed approval boundary. It does not invent a successful execution result and does not bypass ZYRQUEN's policy layer.
