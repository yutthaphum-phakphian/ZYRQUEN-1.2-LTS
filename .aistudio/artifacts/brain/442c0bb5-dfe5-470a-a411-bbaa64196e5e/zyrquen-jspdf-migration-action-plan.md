# 🛡️ ZYRQUEN Ω∞ Staged Security Migration & Audit Action Plan
**Target Subsystem:** Post-Quantum PDF Generation Enclave (`jspdf` & `dompurify`)  
**Engine Version:** LOCKED_FROZEN_v1.2_LTS (Commit `a35da74`)  
**Security Policy:** Fail-Closed Gate | SSoT Δ0 Zero Drift Assurance  
**Chief Cryptographer & SRE Lead:** นายยุทธภูมิ พากเพียร (`#EP-SOVEREIGN-01`)  

---

## 🏛️ Executive Summary & Vulnerability Context

During automated Security Audit Gate execution (`npm audit --audit-level=high`), 3 High-Severity vulnerabilities were flagged originating from `jspdf@2.5.2` -> `dompurify@2.5.9`. Running `npm audit fix --force` introduces non-deterministic breaking changes across 25 PDF generation source files.

To adhere to the **SSoT Δ0 Zero Drift** doctrine, a **Staged Security Migration** will be executed in an isolated branch (`feature/jspdf-security-patch`) without forcing lockfile overrides on `main`.

---

## 📋 Staged Migration Execution Roadmap

### 🟢 **Stage 1: Branch Isolation & Single Dependency Upgrade**
```bash
# 1. Create and switch to isolated security patch branch
git checkout -b feature/jspdf-security-patch

# 2. Upgrade jsPDF directly to v4.2.1 (Patches dompurify)
npm install jspdf@4.2.1 --save-exact
```

### 🟡 **Stage 2: Type Safety & API Regression Verification**
* **Check Point 1 (TypeScript Engine):**
  ```bash
  npx tsc --noEmit
  ```
* **Check Point 2 (jspdf-autotable Compatibility):**
  - Audit `lastAutoTable.finalY` calculations across 25 PDF generator modules.
  - Verify whether `jspdf-autotable@3.8.4` functions smoothly with `jspdf@4.2.1`.
  - If type mismatch or runtime exception occurs, bump `jspdf-autotable` to `5.0.8`.

### 🔵 **Stage 3: Integration Testing & Coverage Gate**
```bash
# Run Vitest test suite with coverage report
npx vitest run tests/pdf_generation_verification.test.ts --coverage
```
* **Acceptance Criteria:**
  - All 4/4 Integration Test Suites pass (100% success rate).
  - Code coverage remains at or above baseline (**≥ 78.18%**).

### 🔴 **Stage 4: Production Build & Security Gate Sign-Off**
```bash
# 1. Run Production PWA Bundle Build
npm run build

# 2. Run Final High-Severity Audit Scan
npm audit --audit-level=high
```
* **Acceptance Criteria:** Zero High or Critical vulnerabilities reported.

---

## 🔍 Specific Regression Inspection Checklist (25 Source Files)

| File / Component | Key Risk Area | Audit Verification Method |
| :--- | :--- | :--- |
| **`CourtEvidenceExporter.tsx`** | Thai Font & ETDA Compliance Seals | Verify PDF/A-3 output & UTF-8 Thai text rendering |
| **`zyrquen-court-evidence-report-pdfa3.pdf`** | Merkle Root & 10/10 HSM Attestation Block | Confirm PDF structure & digital signature integrity |
| **`TraceReplayPanel.tsx`** | `lastAutoTable.finalY` Table Stacking | Verify dynamic Y-coordinate offset calculations |
| **`AuditReportGenerator.ts`** | Type casting (`as any`) overrides | Ensure `jsPDF` instance options compile without errors |
| **`ForensicAuditMasterDossierModal.tsx`** | Seal Hash QR Code Rendering | Confirm DataURL QR rendering and button integration |

---

## 🔒 Security Gate & Merge Policy

1. **No `--force` Overrides:** Strict prohibition against `npm audit fix --force` on `main`.
2. **Automated PR Security Gate:** The `.github/workflows/dependabot-security-patch.yml` workflow will validate all Dependabot PRs.
3. **Merge Requirement:** Merge to `main` is permitted ONLY when:
   - `npx tsc --noEmit` passes 0 errors
   - `npm run build` succeeds
   - `npm audit --audit-level=high` exits with code 0

---
*Signed & Certified by:* **นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)**  
*Supreme Sovereign Principal Architect | ZYRQUEN Ω∞*  
*Genesis Anchor Block #849202 | Merkle Root: 909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68*
