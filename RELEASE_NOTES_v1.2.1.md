# Sovereign Runtime Security Patch v1.2.1

**Release type:** Security and compatibility hardening  
**Migration branch:** `feature/jspdf-security-patch`  
**Release date:** 2026-09-24

## Overview

Sovereign Runtime Security Patch v1.2.1 hardens the client-side PDF export
pipeline and completes the staged jsPDF/AutoTable migration. The patch keeps
the migration isolated from `main` while preserving existing PDF layout
behavior and adding regression coverage for the AutoTable position contract.

## Security enhancements

- Retained `jspdf` at `4.2.1`, including the updated DOMPurify dependency
  resolution.
- Upgraded `jspdf-autotable` from `3.8.4` to `5.0.8`.
- Replaced direct, untyped `lastAutoTable.finalY` access with a typed helper
  that provides an explicit fallback when no table has been rendered.
- Updated all affected PDF export call sites to use the shared helper.

## Regression coverage

- Added `tests/unit/pdf-auto-table-regression.test.ts`.
- Covered both the missing-table fallback and the populated-table `finalY`
  path.
- Preserved the existing PDF export consumers in:
  - `src/App.tsx`
  - `src/components/ForensicAuditStepper.tsx`
  - `src/components/QuantumPerformanceReport.tsx`
  - `src/utils/forensicDossierPdfExport.ts`

## Validation

The migration was validated with:

- TypeScript compiler (`tsc --noEmit`) — passed.
- Unit tests (`npm run test:unit`) — passed.
- Vitest suite with coverage (`npx vitest run --coverage`) — passed:
  8 files and 52 tests.
- Production Vite build — passed.
- npm audit at high severity (`npm audit --audit-level=high`) — 0
  vulnerabilities.
- Focused AutoTable regression test — passed.

The current project-wide Vitest coverage report is **23.23% statements**,
**9.39% branches**, **12.39% functions**, and **24.06% lines**. This is the
repository baseline and is reported here explicitly; no 78% coverage claim is
made for this patch.

## Upgrade notes

This is a staged migration release. Review the generated PDF exports,
especially documents that chain multiple AutoTable calls, before merging the
branch into `main`.

## GitHub release draft

Suggested tag: `v1.2.1`

Suggested title: `Sovereign Runtime Security Patch v1.2.1`

This release hardens the client-side PDF export pipeline by retaining jsPDF
4.2.1, upgrading jsPDF-AutoTable to 5.0.8, and replacing unsafe
`lastAutoTable.finalY` access with a typed fallback helper. It also adds
focused regression coverage for PDF layout positioning.

All available validation gates passed: TypeScript typecheck, unit tests,
Vitest coverage run, production build, focused regression test, and
`npm audit --audit-level=high` with zero reported vulnerabilities.

