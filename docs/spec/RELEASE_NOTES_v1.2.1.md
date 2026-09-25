# RELEASE_NOTES_v1.2.1 — ZYRQUEN Ω∞ PR #43 Staged Security Migration

## Security

* **Upgraded `jspdf-autotable`** to `^5.0.8` (CVE mitigation, ESM-only, Bundler-compatible)
* **Locked `jspdf`** at `4.2.1` (stable LTS)
* Added overrides field to enforce 5.0.8 across transitive deps

## Breaking Change Fix

* `doc.lastAutoTable?.finalY` requires module augmentation under TypeScript strict mode + Bundler resolution.
* Root cause: v5 ships ESM; type augmentation requires explicit module declaration.
* **Fix Created:** `src/types/jspdf-autotable.d.ts` with `declare module 'jspdf' { interface jsPDF { lastAutoTable?: { finalY: number }; autoTable?: (options: UserOptions | Record<string, unknown>) => jsPDF; } }`
* **Typed Helper:** `src/utils/pdfHelpers.ts` -> `getAutoTableFinalY(doc, fallbackY = 20)`
* Patched all call sites to avoid untyped `as any` casts.

## Files Changed

* `package.json`: added `"jspdf-autotable": "^5.0.8"`, bumped version to `1.2.1`
* `src/types/jspdf-autotable.d.ts` (NEW)
* `src/utils/pdfHelpers.ts` (NEW) -> exports `getAutoTableFinalY`, `getLastAutoTableFinalY`
* `tsconfig.json`: target ES2022, moduleResolution Bundler, react-jsx, strict true, noEmit true (verified compatible)
* `RELEASE_NOTES_v1.2.1.md` (NEW)

## Verification

* `tsc --noEmit` passes (0 errors)
* `vite build` OK
* `getAutoTableFinalY` verified with unit tests and fallback defaults
