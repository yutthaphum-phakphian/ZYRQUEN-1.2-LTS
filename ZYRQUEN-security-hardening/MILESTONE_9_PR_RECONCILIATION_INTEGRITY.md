# Milestone 9 — PR Reconciliation Integrity

## Scope
Harden Automated Pull Request recovery so an existing remote PR is only reconciled when its machine marker matches the locally verified patch hash.

## Changes
- Added `ZYRQUEN-AUTOHEAL patchHash=<sha256>` marker to automated PR bodies.
- Remote PR recovery now requires matching branch, base branch, and patch marker.
- Existing branch + unmatched/missing marker remains blocked as ambiguous.
- Created PRs and recovered PRs retain the verified patch hash in the result/audit hash.
- No workspace mutation behavior changed.

## Verification
Focused Milestone 5–8 regression plus Milestone 9 integrity checks: 11/11 PASS.

Full npm install/typecheck/build/full regression are not claimed PASS because dependency installation previously timed out in the sandbox.
