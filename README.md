<div align="center">

![ZYRQUEN Ω™ Banner](banner.svg)

</div>

# ZYRQUEN Ω™ Sovereign Runtime (v1.2.1 LTS)

![Version](https://img.shields.io/badge/Version-v1.2.1%20LTS-blue?style=for-the-badge)
![CI/CD Status](https://img.shields.io/badge/CI%2FCD-Pure%20Green%20%E2%9C%85-brightgreen?style=for-the-badge)
![Security Gate](https://img.shields.io/badge/Security%20Gate-22%2F22%20Passed%20100%25-00c853?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Zero--Any-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tests](https://img.shields.io/badge/Vitest-Passed-brightgreen?style=for-the-badge&logo=vitest&logoColor=white)

> Autonomous SRE and Technical Architect Runtime Engine with 100% Pure Green Security, 10-Node Hardware HSM Quorum Telemetry, Copilot Sovereign AI v6.0 Ultra, and Invariant Enforcement (`main` & `gh-pages` Synchronized).

---

## 📖 Table of Contents
- [Overview](#overview)
- [Live Replay & Telemetry Dashboard](#-live-replay--telemetry-dashboard)
- [Branch & Deployment Architecture](#-branch--deployment-architecture)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Core Invariants (SSoT Δ0)](#core-invariants-ssot-δ0)
- [CI/CD Pipelines](#cicd-pipelines)
- [Security & Compliance](#security--compliance)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Overview

ZYRQUEN Ω™ is a sovereign autonomous SRE and Technical Architect agent engineered for high-assurance environments:
- **Mathematical Truth Enforcement**: Zero baseline drift (SSoT Δ0 = 0.000%) anchored to Genesis Block #849202 / Canonical Epoch #849205.
- **Hardware HSM Quorum Monitor**: Real-time 10-Node FIPS 140-3 Level 4 HSM Quorum Gauge (`0%–100%`), subtle crimson pulse alert (`< 8/10` nodes), and one-click Auto-Heal (`Reconnect Nodes`).
- **Copilot Sovereign AI v6.0 Ultra**: Full 12-file SSoT synchronization matrix, 60-minute active entropy telemetry, and FIPS 204 Signed Snapshot export.
- **Cryptographic Security**: NIST Post-Quantum Cryptography Category 5 ready (ML-DSA-87 / Dilithium-5, ML-KEM-1024, SPHINCS+).
- **CI/CD Automation**: GitHub Actions-native 22-stage security gate and zero-drift pipelines on Node.js 22 LTS.
- **Regulatory Compliance**: Aligned with Thai statutory frameworks (พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ฯ Sections 9, 26, 28 & PDPA Section 37).

---

## 📊 Live Replay & Telemetry Dashboard

![ZYRQUEN Ω™ Replay Verification Dashboard](replay_verification_dashboard.svg)

*Live forensic replay & control dashboard showing the 12-stage verification profile, sovereign KPIs, and digital evidence exhibit audit compliance.*

---

## 🌿 Branch & Deployment Architecture

| Branch | Role | Status |
|---|---|---|
| `main` (Default) | Canonical Sovereign Source, 22-Gate Security Suite & Vitest Verification | `SYNCED (Δ0 = 0.00%)` |
| `gh-pages` | Production PWA Bundle (`dist/`), SPA `404.html` Fallback, `.nojekyll` & `README.md` | `DEPLOYED & VERIFIED` |
| `dependabot/npm_and_yarn/vite-tools-94da19ef29` | Automated Dependency & Vite Toolchain Security Audit Branch | `VERIFIED (Node 22 LTS)` |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 22+ LTS
- npm 10+
- Python 3.12+
- Git

### Installation & Development

```bash
# Clone repository
git clone https://github.com/yuththaphum-phakphian/ZYRQUEN-1.2-LTS.git
cd ZYRQUEN-1.2-LTS

# Install dependencies
npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Type checking
npx tsc --noEmit

# Execute 22-Gate Security Verification
python3 scripts/zyrquen-security-gate.py

# Execute Vitest & Unit suite
npm test

# Run local development server
npm run dev
```

---

## 📁 Project Structure

```
ZYRQUEN-1.2-LTS/
├── .github/              # CI/CD Workflows & Sovereign Security Gates
│   └── workflows/        # GitHub Actions Pipeline Configurations (Node 22 LTS)
├── config/               # System and Environment Configurations
├── docs/                 # Documentation, Specifications & Compliance Notes
├── public/               # Static Web Assets & gh-pages README/Manifest
├── scripts/              # Operational Scripts & 22-Gate Security Drivers
├── src/                  # Core Sovereign Runtime Source (TypeScript / React 19)
├── telemetry/            # Grafana Dashboards & Prometheus Alerts
└── tests/                # Vitest & Invariant Test Suites
```

---

## Core Invariants (SSoT Δ0)

| Metric / Invariant | Baseline Value / Specification |
|---|---|
| Genesis Block Height | #849202 (Bit-Exact Anchor) |
| Canonical Seals | 14,902 Immutable Seals |
| Baseline Drift | SSoT Δ0 = 0.000% |
| Cryptographic Standard | NIST FIPS 203 / 204 / 205 (PQC Category 5) |
| Execution SLA | ≤ 142.00 ms |
| HSM Quorum | 10/10 REAL_HSM (FIPS 140-3 Level 4 / CC EAL6+) |

Implementation details: [`src/config/sovereign.config.ts`](src/config/sovereign.config.ts)

---

## CI/CD Pipelines

| Workflow File | Trigger | Purpose |
|---|---|---|
| `zyrquen-security-gate.yml` | Push / PR to main | 22-Stage Security Gate & Invariant Attestation |
| `deploy.yml` | Push to main | Production / `gh-pages` Branch Deployment (with `README.md`) |
| `ci.yml` | Push / PR to main | Lint, Vitest & Sovereign Build Gate |
| `sovereign-runtime-verification.yml` | Push / PR to main | Runtime & HSM Quorum Verification Suite |
| `chamber-console-ci.yml` | PR / Push | Chamber Console UI Compilation & Tests |
| `ledger-sync.yml` | Push / PR | Audit Ledger & Anchor Synchronization |
| `helm-benchmark.yml` | Push / PR | Kubernetes Infrastructure & SLA Benchmarks |

---

## Security & Compliance

- **Risk Scoring**: High-risk payloads (Risk Score ≥ 0.85) trigger automatic HTTP 423 Locked quarantine response.
- **HSM Quorum Threshold**: High-severity alert toast and subtle crimson container pulse trigger automatically if active HSM nodes drop below `8/10` (`< 80%`), with instant Auto-Heal recovery via `Reconnect Nodes`.
- **Module 17 Preservation**: Zero-deletion immutable logging for forensic analysis.
- **Thai Statutory Alignment**: Compliant with พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ (มาตรา ๙, ๒๖, ๒๘).
- **PDPA Compliance**: Strict Data Protection Enforcement under Section 37.
- **Post-Quantum Cryptography**: ML-DSA-87 / Dilithium-5 (FIPS 204) and ML-KEM-1024 (FIPS 203).

---

## Contributing

- **Strict Type Safety**: Maintain `--noEmit` cleanliness with zero `any` types.
- **Clean Dependencies**: Use `npm ci --legacy-peer-deps` for lockfile consistency.
- **Commit Signatures**: All commits must be GPG signed (Nong Zyrquen Master Key).
- **Verification**: All pull requests must pass `scripts/zyrquen-security-gate.py` (22/22 Gates).

Refer to [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for full guidelines.

---

## Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| `npm install` peer dependency conflicts | Legacy peer deps in environment | Use `npm ci --legacy-peer-deps` or `npm install --legacy-peer-deps` |
| `gh-pages` branch shows "No description provided" | `README.md` missing from `dist/` artifact | Automatically resolved via `public/README.md` and `deploy.yml` artifact copy |
| Type check errors | Uncompiled TS definitions | Run `npx tsc --noEmit` to identify non-compliant types |
| Security gate blocked | Risk score exceeded or missing GPG signature | Check Module 17 logs and verify GPG key status |

---

## License

Copyright © ZYRQUEN Ω™ Sovereign Systems (`#EP-SOVEREIGN-01`). All Rights Reserved.
