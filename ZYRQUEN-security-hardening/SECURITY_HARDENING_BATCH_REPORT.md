# Security Hardening Batch Report

## Changes
- Metrics token authentication is Bearer-header only; query-string token authentication removed.
- Metrics/admin secret comparisons use `timingSafeEqual` through a length-safe helper.
- `X-Forwarded-Proto` is trusted only when `TRUST_PROXY_PROTOCOL=1`.
- Metrics IP allowlist no longer treats `*` as an allow-all bypass.
- Added focused regression tests in `tests/security-guards.test.mjs`.

## Verified
- `node --check --experimental-strip-types src/server/security.ts` PASS.
- Focused security regression: 3/3 PASS using Node's native TypeScript stripping.

## Full-suite blocker
The checked-out `node_modules` tree is incomplete (`vite/client.d.ts` and `tsx/index.js` are missing). `npm run typecheck` therefore stops at TS2688 and the normal test runner cannot resolve `tsx`.
A subsequent `npm ci` attempt was interrupted by the execution environment timeout. No full build/test result is claimed from this state.

## Integrity
- package-lock.json was not modified by this batch.
- No source/test files were deleted.
