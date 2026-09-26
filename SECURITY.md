# Security Policy

## Supported Versions

Security updates and patches are provided for the following versions of **ZYRQUEN Ω™ Sovereign Runtime**:

| Version | Supported |
| ------- | --------- |
| 1.2.x (LTS) | ✅ |
| 1.1.x | ✅ |
| 1.0.x | ❌ |
| < 1.0 | ❌ |

---

## Reporting a Vulnerability

If you discover a security vulnerability in ZYRQUEN Ω™, please report it responsibly:

- **Do not** open a public GitHub issue for security vulnerabilities.
- Email details to **nong.zyrquen@zyrquen.io** with a clear description, steps to reproduce, and (if possible) a proof of concept.
- Encrypt sensitive reports using the GPG key below.

### What to expect

| Stage | Timeline |
| --- | --- |
| Acknowledgement of report | Within 48 hours |
| Initial assessment & severity triage | Within 5 business days |
| Status update (accepted / declined) | Within 10 business days |
| Fix & disclosure (if accepted) | Coordinated, typically within 30 days |

- **If accepted**: the issue will be logged under Module 17 (immutable forensic record), a fix will be developed and tested against the `zyrquen-security-gate.yml` suite, and credit will be given to the reporter (unless anonymity is requested).
- **If declined**: you will receive an explanation of why the report does not qualify as a vulnerability, or why it falls outside the current threat model.

---

## GPG Contact

Reports may be encrypted using the project's signing key:

```
Maintainer: Nong Zyrquen
Email: nong.zyrquen@zyrquen.io
Fingerprint: 9641650E56EEEBC38263F4126AA098097151A505
```

---

## Scope

This policy covers the ZYRQUEN Ω™ Sovereign Runtime codebase, its CI/CD pipelines, and associated cryptographic modules (PQC signature suite, HSM quorum logic, evidence ledger). Third-party dependencies should be reported to their respective maintainers.
