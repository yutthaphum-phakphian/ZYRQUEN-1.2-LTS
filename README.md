# 🌌 ZYRQUEN Ω∞

## Sovereign Kernel & Truth Matrix

| Parameter | Value |
| :--- | :--- |
| **Version** | `v4.16` |
| **Release State** | `LOCKED_FROZEN_v1.2_LTS` |
| **Principal Architect** | นายยุทธภูมิ พากเพียร |
| **Principal ID** | `#EP-SOVEREIGN-01` |
| **Genesis Block** | `#849202` |

---

## 📌 Project Overview

ZYRQUEN Ω∞ is a TypeScript-led Sovereign Control Plane and integrity-oriented system architecture focused on:

- Verifiable system state
- Cryptographic integrity
- Evidence handling
- Runtime telemetry
- Auditability
- Security controls
- Quarantine and preservation
- Operational traceability

The architecture is designed around a Single Source of Truth (SSoT) model and a fail-closed verification philosophy.

> *«VERIFIABLE BY EVIDENCE — NOT BY CLAIM.»*

---

## 🔒 Frozen Baseline

| Parameter | Current Baseline |
| :--- | :--- |
| **Kernel State** | `LOCKED_FROZEN_v1.2_LTS` |
| **Genesis Block** | `#849202` |
| **Merkle Root** | `909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68` |
| **Canonical Seals** | `14,902` |
| **SSoT Mutation** | `0` |
| **SSoT Drift** | `0.00%` |
| **Canonical Write** | `DENIED` |
| **Auto-Reseal** | `BLOCKED` |
| **Observed Evidence** | `+5` |
| **Observed Evidence State** | `QUARANTINED / NON-PROMOTED` |

### Preservation Rule

The frozen canonical baseline must not be modified by presentation-layer changes, development experiments, or unverified evidence.

Any new observation must pass the project's verification gates before it can be considered for promotion.

---

## 🧬 System Identity

```text
ZYRQUEN Ω∞
│
├── Sovereign Control Plane
├── Truth Matrix
├── Evidence Pipeline
├── Verification Gates
├── Canonical State
├── Runtime Telemetry
├── Quarantine
├── Audit
└── Preservation
```

### Core Principle

```text
REAL DATA ──> COLLECT ──> VERIFY ──> 100% PASS ──> SEAL ──> APPEND ──> AUDIT ──> GRAPH
```

No missing runtime evidence should be converted into a fabricated PASS state.

---

## 🛡️ Security Architecture

### 1. HSM / Key Management

The project documentation describes a 10-node HSM quorum architecture:

```text
[TC-01 .. TC-10] ──> [HSM QUORUM] ──> [VERIFICATION GATE]
```

Documented technologies include:

- Utimaco u.trust GP CSe-Series
- FIPS 140-3 Level 4
- Hardware-backed key protection
- Quorum-based authorization

Any runtime or cryptographic status should be treated according to the evidence actually available from the corresponding runtime/artifact.

### 2. Post-Quantum Cryptography

The architecture references the following NIST-standardized algorithms:

- **Digital signatures:** ML-DSA-87 / Dilithium-5 (NIST FIPS 204)
- **Key encapsulation:** ML-KEM / Kyber (NIST FIPS 203)
- **Stateless hash-based signatures:** SLH-DSA / SPHINCS+ (NIST FIPS 205)

---

## 🔎 Evidence & Forensics

### 12-Stage Trace Replay

The forensic architecture contains a 12-stage trace pipeline:

```text
STAGE-01 (INGEST) ──> STAGE-02 .. STAGE-11 ──> STAGE-12 (CLOSURE)
```

The purpose is to provide a structured path from evidence ingestion through verification and closure.

---

## 🗃️ Quarantine & Preservation

### Chamber 02

The project includes a dedicated forensic/quarantine concept for evidence that has been observed but has not satisfied promotion requirements.

```text
OBSERVED ──> QUARANTINE ──> VERIFY ──> [ 100% PASS? ]
                                      │
                              ┌───────┴───────┐
                              │               │
                             YES              NO
                              │               │
                              ▼               ▼
                            SEAL      REMAIN QUARANTINED
```

This preserves the distinction between:

- Canonical
- Verified Runtime
- Telemetry
- Presentation
- Quarantined Evidence

---

## 📊 Telemetry Baseline

The project baseline currently documents the following system-reported telemetry values:

| Metric | Baseline |
| :--- | :--- |
| **Cryogenic telemetry** | `14.98 mK` |
| **qOps** | `851.9` |
| **Coherence** | `99.992%` |
| **Forensic SLA target** | `142ms` |
| **Trace execution** | `35.80ms` |

Telemetry values must not be treated as independently verified unless the corresponding runtime evidence is available.

---

## 🏗️ Architecture

```text
┌──────────────────────────────────────────┐
│            React 19 / Vite SPA           │
└───────────────────┬──────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│         Node.js / Express Gateway        │
│          Sentinel / Policy Layer         │
└───────────────────┬──────────────────────┘
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
┌─────────────────┐   ┌───────────────────┐
│ Runtime /       │   │ Security /        │
│ Telemetry       │   │ Verification      │
└────────┬────────┘   └─────────┬─────────┘
         │                      │
         └──────────┬───────────┘
                    ▼
          ┌──────────────────┐
          │ Verification     │
          │ Gates            │
          └────────┬─────────┘
                   ▼
          ┌──────────────────┐
          │ Canonical /      │
          │ Quarantine       │
          └──────────────────┘
```

---

## 🧰 Technology Stack

### Frontend

- React 19
- TypeScript 5.6
- Vite 5.4
- Tailwind CSS
- Three.js
- Lucide React
- jsQR

### Backend

- Node.js
- Express
- Sentinel / policy interception layer
- Runtime telemetry interfaces

### Smart Contracts

- Solidity `0.8.20`
- `ZyrquenSovereignCoreV2`
- `ZyrquenFiosTreasuryDistributor`

---

## 📂 Project Structure

A simplified conceptual structure:

```text
ZYRQUEN-1.2-LTS/
│
├── src/
│   ├── components/
│   ├── rooms/
│   ├── modules/
│   ├── services/
│   ├── telemetry/
│   └── security/
│
├── contracts/
├── public/
├── tests/
├── README.md
├── package.json
└── vite.config.*
```

> *The actual repository structure is authoritative over this conceptual diagram.*

---

## 🚀 Quick Start

### Requirements

- Node.js `18+`
- npm `9+`

### Clone and install

```bash
git clone https://github.com/yutthaphum-phakphian/ZYRQUEN-1.2-LTS.git
cd ZYRQUEN-1.2-LTS
npm install
```

### Environment

Create `.env.local` in the root directory and configure only the credentials required by the actual runtime:

```dotenv
GEMINI_API_KEY=your_gemini_api_key_here
```

Do not commit secrets to the repository.

### Development

```bash
npm run dev
```

---

## 🧪 Verification

Recommended verification sequence:

```bash
npm run lint && npm test && npm run build
```

```text
LINT ──> TEST ──> BUILD ──> READY
```

A successful build confirms that the source compiles successfully. It does not, by itself, constitute external verification of security, cryptographic, legal, or physical infrastructure claims.

---

## 📜 Evidence Policy

ZYRQUEN follows a strict Zero Mock Evidence principle.

The system must not manufacture:

- Telemetry
- Cryptographic seals
- Hashes
- HSM attestations
- Transactions
- Legal mappings
- Runtime measurements
- Verification results

When evidence is unavailable, the correct state is:

```text
NULL / NO EVIDENCE / PENDING / UNVERIFIED
```

—not an invented PASS state.

---

## 🧭 Development Discipline

ZYRQUEN uses an additive development model:

1. **Audit First** — Inspect the existing repository and runtime.
2. **Identify Missing Gaps** — Determine only what is actually missing.
3. **Safe Real Upgrade** — Add the required capability without unnecessarily replacing existing modules, rooms, datasets, or canonical state.

```text
PRESERVE EXISTING STATE
        +
ADD ONLY REAL GAPS
        +
VERIFY BEFORE PROMOTION
```

---

## 📋 Evidence Classification

Every system artifact should have a clear provenance class:

| Class | Meaning |
| :--- | :--- |
| `CANONICAL` | Frozen authoritative project state |
| `VERIFIED RUNTIME` | Supported by runtime evidence |
| `TELEMETRY` | Runtime/system measurement |
| `PRESENTATION` | UI representation only |
| `QUARANTINED` | Observed but not promoted |

Presentation must never silently become canonical state.

---

## ⚖️ Compliance & Legal References

Project documentation references:

- Thai Electronic Transactions Act B.E. 2544
- Thai Personal Data Protection Act B.E. 2562
- NIST post-quantum cryptography standards
- ISO/IEC 27037 concepts relating to digital evidence handling

These references describe the standards and legal frameworks considered by the project.

They should not be interpreted as an independent legal certification, court determination, or compliance certification unless supported by the appropriate external documentation or qualified authority.

---

## 📎 Project Attestation Records

The following document identifiers are part of the project's documented evidence set:

| Document ID | Scope |
| :--- | :--- |
| `DOC-SOV-HSM-1010-2026` | HSM quorum / cryptographic architecture |
| `DOC-SOV-TELEMETRY-144343-ICT` | mTLS / telemetry measurements |
| `DOC-SOV-PRESERVATION-M17-V24` | Preservation / trace architecture |

The documents themselves remain the source of truth for any claim attributed to them.

---

## 👤 Principal Architect

นายยุทธภูมิ พากเพียร  
`#EP-SOVEREIGN-01`

ZYRQUEN Ω∞

---

## 💬 Engineering Motto

> *«Build boldly. Verify carefully. Document clearly. Improve continuously.»*

---

<p align="center">
  🌌 ⚡ 🛡️<br/>
  <strong>ZYRQUEN Ω∞</strong> • <code>LOCKED_FROZEN_v1.2_LTS</code><br/>
  Sovereign Control Plane & Truth Matrix
</p>
