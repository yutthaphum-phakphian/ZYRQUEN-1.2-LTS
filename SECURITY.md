# 🛡️ Security Policy

## Supported Versions

Only the latest release of the LTS branch receives active security updates and patches.

| Version | Supported | Status |
| --- | --- | --- |
| 1.2.x (LTS) | ✅ Yes | Maintained (Active Support) |
| 1.1.x | ❌ No | End of Life |
| 1.0.x | ❌ No | End of Life |

---

## Reporting a Vulnerability

We take the security of ZYRQUEN Ω™ seriously. If you believe you have found a security vulnerability, please follow the coordinated disclosure process below.

### Contact Information
**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please send a private report to:
- **Email**: `security@zyrquen.internal` (or submit via [GitHub Private Vulnerability Reporting](https://github.com/yutthaphum-phakphian/ZYRQUEN-1.2-LTS/security/advisories/new))
- **GPG Key**: Please encrypt sensitive reports using our Master Security Key (`Nong Zyrquen Master Key`).

### What to Include in Your Report
1. Description of the vulnerability and its potential impact.
2. Step-by-step Proof of Concept (PoC) or reproduction steps.
3. Affected components (e.g., Chamber 02 Buffer, HSM Deca-Key Council, PQC Suite).
4. Proposed mitigation or patch (if available).

### Response SLA & Process
1. **Acknowledgement**: We will acknowledge receipt of your report within **24 hours**.
2. **Triage**: Our security team will validate and triage the report within **48 hours**.
3. **Status Updates**: You will receive progress updates at least every **3 business days** until resolution.
4. **Fix & Release**: If accepted, a patch will be deployed, and credit will be granted to the researcher in our release notes and Hall of Fame (unless requested otherwise).

---

## Severity Classification

Vulnerabilities are triaged using CVSS v3.1:

| Severity | CVSS Range | Response & Patch SLA |
| --- | --- | --- |
| **Critical** | 9.0–10.0 | Fix within **7 days** |
| **High** | 7.0–8.9 | Fix within **14 days** |
| **Medium** | 4.0–6.9 | Fix within **30 days** |
| **Low** | 0.1–3.9 | Fix within **90 days** |

---

## Disclosure Timeline

- **Day 0**: Vulnerability accepted and confirmed.
- **Day 1–21**: Fix development, testing, and validation within CI/CD security gates.
- **Day 22–28**: Embargo period; reporters may request a temporary extension if needed.
- **Day 29**: Public security advisory published, patch released, and CVE assigned (if applicable).

---

## Scope & Out-of-Scope

### In-Scope
- Core ZYRQUEN Ω™ Engine (React 19 / TypeScript runtime)
- Chamber System Invariants & SSoT Zero-Drift Kernel
- Cryptographic Module Integrations (FIPS 203/204/205 PQC)
- Hardware Security Module (HSM) Quorum Monitor & Handshake
- Sentinel AI Interceptor & Risk Scoring Engine

### Out of Scope
The following are **not** considered security vulnerabilities:
- Denial of Service (DoS/DDoS) via resource exhaustion (unless caused by a direct code defect).
- Social engineering, phishing, or physical attacks against maintainers or infrastructure.
- Vulnerabilities in third-party npm dependencies (please report upstream; we track and patch these via automated Dependabot workflows).
- Theoretical cryptographic attacks without practical proof of concept.
- Issues in documentation, examples, or public website typos.

---

## Security Best Practices

To ensure maximum security when running ZYRQUEN Ω™:
- Always run the latest patch version of the `v1.2.x` LTS branch.
- Enable post-quantum cryptography validation (`CRYSTALS-Dilithium-5` / `ML-DSA-87`).
- Monitor **Sentinel AI Interceptor** logs for Risk Score >= 0.85 events (automatic HTTP 423 Quarantine).
- Rotate HSM Deca-Key Council quorum keys according to your organization's compliance schedule.
- Conduct monthly audits on Module 17 forensic records.

---

## Recognition & Hall of Fame

We acknowledge and thank security researchers who help keep ZYRQUEN Ω™ safe. With your permission, we will recognize your contribution in:
- The `SECURITY.md` Hall of Fame
- Official Release Notes for the corresponding fix version
- A digital contributor badge on the project's Security Advisory page

---

## Additional Resources

- [Cryptographic Specifications](./docs/CRYPTO.md) — NIST FIPS 204/205 compliance details
- [Module 17 Forensics Documentation](./docs/MODULE17.md) — Incident logging and audit trails
- [CI/CD Security Gate Pipeline](https://github.com/yutthaphum-phakphian/ZYRQUEN-1.2-LTS/blob/main/.github/workflows/zyrquen-security-gate.yml)
- [PDPA & Thai Statutory Compliance Notes](./docs/LEGAL.md)
