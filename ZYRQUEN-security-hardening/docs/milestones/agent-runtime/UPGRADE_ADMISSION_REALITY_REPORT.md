# Upgrade Admission — Reality Report

## Purpose
Adds a deterministic preflight admission layer so an upgrade can be blocked when a prerequisite has failed instead of allowing a known-bad state to accumulate.

## Implemented
- `server/upgradeAdmission.ts`
- deterministic ADMITTED/BLOCKED result
- explicit prerequisite checks and blocker IDs
- bounded check detail
- SHA-256 audit hash
- no mutation performed by the admission layer
- milestone regression test

## Boundary
This layer does not install dependencies, run tests, or mutate the workspace itself. It consumes prerequisite results supplied by the caller and prevents downstream upgrade execution when blockers exist.
