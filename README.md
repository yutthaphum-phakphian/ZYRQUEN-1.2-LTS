
# 🌌 ZYRQUEN Ω∞ Sovereign Kernel

[![Chamber Console CI](https://github.com/yutthaphum-phakphian/ZYRQUEN-1.2-LTS/actions/workflows/chamber-console-ci.yml/badge.svg)](https://github.com/yutthaphum-phakphian/ZYRQUEN-1.2-LTS/actions/workflows/chamber-console-ci.yml)
[![Ledger Sync & PQC Agility](https://github.com/yutthaphum-phakphian/ZYRQUEN-1.2-LTS/actions/workflows/ledger-sync.yml/badge.svg)](https://github.com/yutthaphum-phakphian/ZYRQUEN-1.2-LTS/actions/workflows/ledger-sync.yml)
[![CodeQL Security Audit](https://github.com/yutthaphum-phakphian/ZYRQUEN-1.2-LTS/actions/workflows/codeql.yml/badge.svg)](https://github.com/yutthaphum-phakphian/ZYRQUEN-1.2-LTS/actions/workflows/codeql.yml)

> **Status:** `LOCKED_FROZEN_v1.2_LTS` | **Build:** 10/10 Green 🟢 | **Mode:** `LIVE_PRODUCTION`

**ZYRQUEN Ω∞** is a security-focused control plane and operational dashboard. It provides a Post-Quantum Cryptography (PQC) ready architecture, forensic trace replay, and cryptographic validation workflows for sovereign digital environments. 

## ⚡ Quick Start

Requires **Node.js 22+** and **npm 10+**.

```bash
# 1. Clone and install
git clone [https://github.com/yutthaphum-phakphian/ZYRQUEN-1.2-LTS.git](https://github.com/yutthaphum-phakphian/ZYRQUEN-1.2-LTS.git)
cd ZYRQUEN-1.2-LTS
npm ci

# 2. Configure environment
echo -e "VITE_SOVEREIGN_MODE=LIVE_PRODUCTION\nGEMINI_API_KEY=your_key_here" > .env.local

# 3. Boot the Sovereign Gateway
npm run dev

🛠️ Core Commands
| Task | Command | Description |
|---|---|---|
| Development | npm run dev | Boots the React 19/Vite frontend and local gateway. |
| Linting | npm run lint | Runs strict static code analysis. |
| Testing | npm test | Executes the E2E and unit test pipeline. |
| Build | npm run build | Compiles a production-ready, highly optimized bundle. |
| Full Check | npm run lint && npm test && npm run build | The standard verification gate before submitting a PR. |
🛡️ Security & Verification Scripts
This repository includes Python-based simulations for our cryptographic and forensic trace engines. Run these to validate system integrity:
# Execute 12-Stage Forensic Trace Replay Simulation
python3 tests/court_replay_verification.py

# Run Full-Spectrum Security Penetration Test Suite
python3 tests/test_sovereign_security_pen_test.py

🏗️ Stack Overview
 * Frontend: React 19, TypeScript 5.6, Vite 5.4, Tailwind CSS, Three.js
 * Backend/Gateway: Node.js Express, Sentinel AI Risk Interceptor
 * Security Baselines: PQC-ready (Dilithium-5, Kyber-1024), HSM-simulated state controls
 * Smart Contracts: Solidity v0.8.20 (Immutable WORM Log)
 * Containers: Docker, GHCR, GitHub Actions
“Build boldly. Verify carefully. Document clearly. Improve continuously.”

<ElicitationsGroup message="What should we add to the repository next?">
  <Elicitation label="Draft SECURITY.md" query="Draft a SECURITY.md file detailing the vulnerability reporting process and the PQC/HSM security posture."/>
  <Elicitation label="Draft CONTRIBUTING.md" query="Draft a CONTRIBUTING.md file outlining strict PR requirements, testing gates, and commit standards."/>
  <Elicitation label="Explain the Sentinel AI Interceptor" query="Break down how the Sentinel AI Risk Interceptor logic works within this architecture."/>
</ElicitationsGroup>

