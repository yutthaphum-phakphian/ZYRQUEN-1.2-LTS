# Milestone 8 — Automated PR Remote Reconciliation

## Goal
Prevent duplicate pull requests after a crash or process restart that occurs after the remote branch/PR mutation but before the local execution ledger is committed.

## Behavior
- If the automation branch does not exist, normal PR creation proceeds.
- If the branch already exists, the automation queries open pull requests for the exact owner/branch/base combination.
- A matching PR is treated as the authoritative remote result and recorded in the execution ledger.
- If no matching PR exists, the automation blocks with `GIT_BRANCH_ALREADY_EXISTS_REQUIRES_RECONCILIATION` instead of mutating the remote repository again.
- Existing approval, patch-hash, workspace, repository validation, idempotency, webhook, and audit protections remain unchanged.

## Verification
Focused Milestone 5–8 suite: 11/11 PASS.
Full npm install/typecheck/build/regression remains environment-dependent and is not claimed as passed unless dependency-complete execution succeeds.
