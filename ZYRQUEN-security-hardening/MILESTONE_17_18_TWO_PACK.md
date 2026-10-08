# Milestone 17–18 Two-Pack

## M17 — Execution Health Gate & Recovery Plan
Fail-closed admission over execution health with deterministic recovery actions.

## M18 — Operational Admission Control
Final admission decision combining health gate and recovery plan. Only HEALTHY + no recovery is ADMITTED.

## Verification
Node 22 `--experimental-strip-types` focused regression: M15–M18 = 12/12 PASS.

Full dependency installation/typecheck/build remains environment-dependent and is not represented as PASS here.
