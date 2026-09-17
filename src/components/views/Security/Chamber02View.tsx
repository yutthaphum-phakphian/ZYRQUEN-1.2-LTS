"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  BarChart,
  Bar,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Cell,
} from 'recharts';
import {
  ShieldAlert,
  AlertOctagon,
  Lock,
  Scale,
  FileText,
  CheckCircle2,
  XCircle,
  Flame,
  RotateCcw,
  Play,
  Pause,
  FastForward,
  Fingerprint,
  Download,
  Copy,
  Check,
  Layers,
  Cpu,
  Clock,
  Activity,
  Sparkles,
  RefreshCw,
  FileWarning,
  Bug,
  Terminal,
  ShieldCheck,
  Eye,
  Archive,
  Search,
  Filter,
  Database,
  Sliders,
  ChevronRight,
  Zap,
  Radio,
  FileCode,
  ArrowRight,
  GitCommit,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Award,
  BookOpen,
  ExternalLink,
  QrCode,
} from 'lucide-react';
import { SYSTEM_METADATA, SYSTEM_INVARIANTS, THAI_CUSTODIANS, AUDIT_TRACE_TX, CANONICAL_GENESIS_BLOCK, CANONICAL_MERKLE_ROOT } from '../../../data/canonicalData';
import { playAuditChime, playTone } from '../../AudioSynthesizer';
import { copyToClipboard } from '../../../utils/clipboard';
import { InteractivePdfPreviewModal } from '../../InteractivePdfPreviewModal';
import { MerkleRootQrCodeModal } from '../../MerkleRootQrCodeModal';
import { ForensicSealRangeExportModal } from '../../ForensicSealRangeExportModal';
import { exportSignedForensicAuditSealChainJson } from '../../../utils/forensicAuditSealChainJsonExport';
import {
  EvidenceMetadataSchema,
  execute4StageIntakeVerification,
  SAMPLE_PHASE3_EVIDENCE_ITEMS,
  IntakePipelineReport,
} from '../../../utils/intakeVerificationSpec';

export interface QuarantinedModule17Item {
  id: string;
  incidentId: string;
  artifactId: string;
  sourceFilename: string;
  tenantId: string;
  isolationSlot: string;
  quarantineReason: string;
  quarantinedAt: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  declaredSha256: string;
  actualSha256: string;
  algorithmDetected: string;
  mutationRequested: number;
  courtPreservationStatus: 'IMMUTABLE_PRESERVED_V24';
  replaySlaPassed: boolean;
  fieldMismatches: Array<{
    field: string;
    expected: string;
    actual: string;
    violationType: string;
  }>;
  forensicTraceStages: Array<{
    stageNumber: number;
    stageCode: string;
    name: string;
    status: 'VERIFIED' | 'PASSED' | 'QUARANTINED' | 'BLOCKED';
    latencyMs: number;
    parentHash: string;
    outputHash: string;
    actor: string;
    sourceModule: string;
    evidenceNote: string;
  }>;
}

export const INITIAL_QUARANTINED_ITEMS: QuarantinedModule17Item[] = [
  {
    id: 'M17-INC-01',
    incidentId: 'INC-QRT-801',
    artifactId: 'TNT-TH-001-TAMPERED-FORGED',
    sourceFilename: 'tenant_audit_manifest_TNT-TH-001.forged.json',
    tenantId: 'TNT-TH-001',
    isolationSlot: 'CHAMBER-02-SLOT-ALPHA',
    quarantineReason: 'BYTE_DIGEST_MISMATCH & CANONICAL_ROOT_INJECTION_ATTEMPT',
    quarantinedAt: '2026-08-22 08:24:19 ICT',
    severity: 'CRITICAL',
    declaredSha256: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    actualSha256: 'deadbeef849202a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef012',
    algorithmDetected: 'Legacy Ed25519 (Rejected by PQC Policy)',
    mutationRequested: 1,
    courtPreservationStatus: 'IMMUTABLE_PRESERVED_V24',
    replaySlaPassed: true,
    fieldMismatches: [
      {
        field: 'cryptographicProof',
        expected: 'Dilithium-5 (ML-DSA-87 Round 4) FIPS 204',
        actual: '0xUNAUTHORIZED_OVERWRITE_ATTEMPT_ED25519',
        violationType: 'PQC_ALGORITHM_DOWNGRADE_ATTACK',
      },
      {
        field: 'requestedMutationAuthority',
        expected: '0 (Strict Read-Only)',
        actual: '1 (Write Mutation Request)',
        violationType: 'SSOT_MUTATION_INVARIANT_BREACH',
      },
      {
        field: 'quota.maxStorageGb',
        expected: '2000 GB',
        actual: '999999 GB (Privilege Escalation)',
        violationType: 'UNAUTHORIZED_PRIVILEGE_ESCALATION',
      },
    ],
    forensicTraceStages: [
      {
        stageNumber: 1,
        stageCode: 'STAGE-01: SENSE',
        name: 'Telemetry Anomaly Interception',
        status: 'PASSED',
        latencyMs: 8,
        parentHash: 'GENESIS_ROOT_0000',
        outputHash: 'sha256-a18f91a3c091811e',
        actor: 'Sentinel AI Interceptor',
        sourceModule: 'src/services/otelMetricsProvider.ts',
        evidenceNote: 'Ingress packet probe mismatch detected on port 902.',
      },
      {
        stageNumber: 2,
        stageCode: 'STAGE-02: INGEST',
        name: 'OTLP Payload Validation',
        status: 'PASSED',
        latencyMs: 11,
        parentHash: 'sha256-a18f91a3c091811e',
        outputHash: 'sha256-b242e1b87d00f28a',
        actor: 'TelemetryProviderSubscriber',
        sourceModule: 'src/services/TelemetryProvider.ts',
        evidenceNote: 'Captured 4,192 bytes raw JSON payload from untrusted gateway.',
      },
      {
        stageNumber: 3,
        stageCode: 'STAGE-03: ASSURE',
        name: 'Deterministic Schema Assertion',
        status: 'PASSED',
        latencyMs: 12,
        parentHash: 'sha256-b242e1b87d00f28a',
        outputHash: 'sha256-c399f17a8123ef45',
        actor: 'SchemaAssertionEngine',
        sourceModule: 'src/utils/intakeVerificationSpec.ts',
        evidenceNote: 'Schema validated against EvidenceMetadataSchema specification.',
      },
      {
        stageNumber: 4,
        stageCode: 'STAGE-04: UNDERSTAND',
        name: 'Semantic Discrepancy Parsing',
        status: 'PASSED',
        latencyMs: 9,
        parentHash: 'sha256-c399f17a8123ef45',
        outputHash: 'sha256-d410a82b998127bc',
        actor: 'ASTSemanticParser',
        sourceModule: 'src/utils/evidenceVerificationPipeline.ts',
        evidenceNote: 'Extracted AST metadata; detected mutation flag tampering.',
      },
      {
        stageNumber: 5,
        stageCode: 'STAGE-05: SIMULATE',
        name: 'Counterfactual Digital Twin Run',
        status: 'PASSED',
        latencyMs: 14,
        parentHash: 'sha256-d410a82b998127bc',
        outputHash: 'sha256-e521b93c009238cd',
        actor: 'DigitalTwinSandbox',
        sourceModule: 'src/components/FiosDigitalTwinStressSandbox.tsx',
        evidenceNote: 'Blast radius evaluation: simulated injection would cause 0.00% state drift in frozen core.',
      },
      {
        stageNumber: 6,
        stageCode: 'STAGE-06: DECIDE',
        name: 'Quarantine Firewall Trigger',
        status: 'QUARANTINED',
        latencyMs: 7,
        parentHash: 'sha256-e521b93c009238cd',
        outputHash: 'sha256-f632c04d110349de',
        actor: 'QuarantineDecisionMatrix',
        sourceModule: 'src/components/QuarantineInspector.tsx',
        evidenceNote: 'FAIL-CLOSED TRIGGER: Hash mismatch detected. Routed into Chamber 02 Buffer Alpha.',
      },
      {
        stageNumber: 7,
        stageCode: 'STAGE-07: GOVERN',
        name: 'Policy Violation Recording',
        status: 'PASSED',
        latencyMs: 10,
        parentHash: 'sha256-f632c04d110349de',
        outputHash: 'sha256-a743d15e22145aef',
        actor: 'PolicyGovernanceCore',
        sourceModule: 'src/components/PolicyEngine.ts',
        evidenceNote: 'Recorded Violation: SSoT Invariant #01 & #08 Breach.',
      },
      {
        stageNumber: 8,
        stageCode: 'STAGE-08: AUTHORIZE',
        name: '10/10 REAL_HSM Quorum Lock',
        status: 'PASSED',
        latencyMs: 13,
        parentHash: 'sha256-a743d15e22145aef',
        outputHash: 'sha256-b854e26f33256bf0',
        actor: '10/10 Custodian Quorum',
        sourceModule: 'src/components/CustodianQuorumRegistry.tsx',
        evidenceNote: '10/10 Hardware Keys ratified evidence containment signature.',
      },
      {
        stageNumber: 9,
        stageCode: 'STAGE-09: EXECUTE',
        name: 'Preservation Clone into Module 17',
        status: 'PASSED',
        latencyMs: 15,
        parentHash: 'sha256-b854e26f33256bf0',
        outputHash: 'sha256-c965f37a44367c01',
        actor: 'Module17PreservationEngine',
        sourceModule: 'src/components/views/Security/Chamber02View.tsx',
        evidenceNote: 'Cloned into unclassified preservation repository. Non-deletion lock set.',
      },
      {
        stageNumber: 10,
        stageCode: 'STAGE-10: OBSERVE',
        name: 'OTel Trace & Cryo Stream Monitor',
        status: 'PASSED',
        latencyMs: 8,
        parentHash: 'sha256-c965f37a44367c01',
        outputHash: 'sha256-da76a48b55478d12',
        actor: 'CryoTelemetryVisualizer',
        sourceModule: 'src/components/CryogenicTelemetryVisualizer.tsx',
        evidenceNote: 'Telemetry stable at 14.98 mK, 851.9 QOps, zero memory leak.',
      },
      {
        stageNumber: 11,
        stageCode: 'STAGE-11: VERIFY',
        name: 'Merkle Ledger Verification',
        status: 'PASSED',
        latencyMs: 11,
        parentHash: 'sha256-da76a48b55478d12',
        outputHash: 'sha256-eb87b59c66589e23',
        actor: 'MerkleTreeValidator',
        sourceModule: 'src/components/MerkleTreeInteractiveGraph.tsx',
        evidenceNote: 'Computed leaf hash anchored to Block #849202 (Root: 909ab814...).',
      },
      {
        stageNumber: 12,
        stageCode: 'STAGE-12: CLOSURE',
        name: 'Forensic Case Formal Seal',
        status: 'VERIFIED',
        latencyMs: 9,
        parentHash: 'sha256-eb87b59c66589e23',
        outputHash: 'sha256-fc98c6ad7769af34',
        actor: 'ForensicClosureControlPlane',
        sourceModule: 'src/components/ForensicClosureControlPlane.tsx',
        evidenceNote: 'Case formally sealed with Dilithium-5 signature and ETDA court dossier prepared.',
      },
    ],
  },
  {
    id: 'M17-INC-02',
    incidentId: 'INC-QRT-802',
    artifactId: 'ED25519-LEGACY-PROBE',
    sourceFilename: 'legacy_crypto_probe_node_99.bin',
    tenantId: 'TNT-GLOBAL-09',
    isolationSlot: 'CHAMBER-02-SLOT-BETA',
    quarantineReason: 'PQC_POLICY_BREACH: Pre-Quantum Ed25519 Key Submitted',
    quarantinedAt: '2026-08-22 09:12:44 ICT',
    severity: 'HIGH',
    declaredSha256: '4f29a0021b44d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c6889',
    actualSha256: '4f29a0021b44d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c6889',
    algorithmDetected: 'Legacy Ed25519 (Non-FIPS 204 Compliant)',
    mutationRequested: 0,
    courtPreservationStatus: 'IMMUTABLE_PRESERVED_V24',
    replaySlaPassed: true,
    fieldMismatches: [
      {
        field: 'cryptographicProof',
        expected: 'Dilithium-5 (ML-DSA-87 Round 4)',
        actual: 'Ed25519-Curve25519-Legacy',
        violationType: 'NIST_FIPS_204_DISALLOWED_ALGORITHM',
      },
    ],
    forensicTraceStages: [
      {
        stageNumber: 1,
        stageCode: 'STAGE-01: SENSE',
        name: 'Cryptographic Protocol Handshake',
        status: 'PASSED',
        latencyMs: 7,
        parentHash: 'GENESIS_ROOT_0000',
        outputHash: 'sha256-91823abce128919a',
        actor: 'GatewayAuthGuard',
        sourceModule: 'src/components/GatewayAuthHeatmap.tsx',
        evidenceNote: 'Handshake received from node TNT-GLOBAL-09 with deprecated cipher.',
      },
      {
        stageNumber: 2,
        stageCode: 'STAGE-02: INGEST',
        name: 'Header & Envelope Parsing',
        status: 'PASSED',
        latencyMs: 9,
        parentHash: 'sha256-91823abce128919a',
        outputHash: 'sha256-129384bcda87192a',
        actor: 'CryptoVerificationCenter',
        sourceModule: 'src/components/CryptoVerificationCenter.tsx',
        evidenceNote: 'Extracted public key header; algorithm tag = 0xED25519.',
      },
      {
        stageNumber: 3,
        stageCode: 'STAGE-03: ASSURE',
        name: 'NIST FIPS 204 Lattice Cryptography Filter',
        status: 'QUARANTINED',
        latencyMs: 12,
        parentHash: 'sha256-129384bcda87192a',
        outputHash: 'sha256-9817234abc12938a',
        actor: 'PostQuantumCryptoEngine',
        sourceModule: 'src/components/CipherVault.tsx',
        evidenceNote: 'REJECTED: Post-Quantum mandate prohibits pure classical curves.',
      },
      {
        stageNumber: 4,
        stageCode: 'STAGE-04: UNDERSTAND',
        name: 'Tenant Isolation Context Query',
        status: 'PASSED',
        latencyMs: 8,
        parentHash: 'sha256-9817234abc12938a',
        outputHash: 'sha256-8271635bcda1829a',
        actor: 'MultiTenantNamespaceMatrix',
        sourceModule: 'src/components/MultiTenantNamespaceMatrix.tsx',
        evidenceNote: 'Namespace TNT-GLOBAL-09 identified as external testing node.',
      },
      {
        stageNumber: 5,
        stageCode: 'STAGE-05: SIMULATE',
        name: 'Quantum Shor Attack Simulation',
        status: 'PASSED',
        latencyMs: 15,
        parentHash: 'sha256-8271635bcda1829a',
        outputHash: 'sha256-7162534cda18293b',
        actor: 'QuantumReliabilitySuite',
        sourceModule: 'src/components/QuantumReliabilitySuite.tsx',
        evidenceNote: 'Simulated 2048-qubit attack: Ed25519 vulnerable in 182 seconds.',
      },
      {
        stageNumber: 6,
        stageCode: 'STAGE-06: DECIDE',
        name: 'Containment Route into Slot Beta',
        status: 'QUARANTINED',
        latencyMs: 6,
        parentHash: 'sha256-7162534cda18293b',
        outputHash: 'sha256-6152433bcda1829a',
        actor: 'QuarantineForensics',
        sourceModule: 'src/components/QuarantineForensics.tsx',
        evidenceNote: 'Preserved in slot Beta for cryptographic policy audit.',
      },
      {
        stageNumber: 7,
        stageCode: 'STAGE-07: GOVERN',
        name: 'Audit Invariant Enforcement',
        status: 'PASSED',
        latencyMs: 11,
        parentHash: 'sha256-6152433bcda1829a',
        outputHash: 'sha256-5142322bcda1829a',
        actor: 'SystemAuditReport',
        sourceModule: 'src/components/SystemAuditReport.tsx',
        evidenceNote: 'Signed by Policy Engine: Dilithium-5 is non-negotiable.',
      },
      {
        stageNumber: 8,
        stageCode: 'STAGE-08: AUTHORIZE',
        name: '10/10 Custodian Hardware Attestation',
        status: 'PASSED',
        latencyMs: 10,
        parentHash: 'sha256-5142322bcda1829a',
        outputHash: 'sha256-4132211bcda1829a',
        actor: 'CustodianQuorumRegistry',
        sourceModule: 'src/components/CustodianQuorumRegistry.tsx',
        evidenceNote: '10/10 hardware seals appended.',
      },
      {
        stageNumber: 9,
        stageCode: 'STAGE-09: EXECUTE',
        name: 'Preservation Lock into Module 17',
        status: 'PASSED',
        latencyMs: 13,
        parentHash: 'sha256-4132211bcda1829a',
        outputHash: 'sha256-3121100bcda1829a',
        actor: 'Module17PreservationEngine',
        sourceModule: 'src/components/views/Security/Chamber02View.tsx',
        evidenceNote: 'Saved to immutable preservation ledger with zero drift.',
      },
      {
        stageNumber: 10,
        stageCode: 'STAGE-10: OBSERVE',
        name: 'Cryo-Stabilization Check',
        status: 'PASSED',
        latencyMs: 7,
        parentHash: 'sha256-3121100bcda1829a',
        outputHash: 'sha256-2110099bcda1829a',
        actor: 'CryogenicTelemetryVisualizer',
        sourceModule: 'src/components/CryogenicTelemetryVisualizer.tsx',
        evidenceNote: 'Temperature 14.98 mK, clock jitter < 0.002 ps.',
      },
      {
        stageNumber: 11,
        stageCode: 'STAGE-11: VERIFY',
        name: 'Merkle Block Root Anchor',
        status: 'PASSED',
        latencyMs: 10,
        parentHash: 'sha256-2110099bcda1829a',
        outputHash: 'sha256-1109988bcda1829a',
        actor: 'MerkleTreeValidator',
        sourceModule: 'src/components/MerkleTreeInteractiveGraph.tsx',
        evidenceNote: 'Anchored to canonical block #849202.',
      },
      {
        stageNumber: 12,
        stageCode: 'STAGE-12: CLOSURE',
        name: 'Case Finalization & ETDA Mapping',
        status: 'VERIFIED',
        latencyMs: 8,
        parentHash: 'sha256-1109988bcda1829a',
        outputHash: 'sha256-0108877bcda1829a',
        actor: 'ThaiLegalSovereignMapping',
        sourceModule: 'src/components/ThaiLegalSovereignMapping.tsx',
        evidenceNote: 'Thai ETA Sec 26 compliance maintained via rejection of substandard crypto.',
      },
    ],
  },
  {
    id: 'M17-INC-03',
    incidentId: 'INC-QRT-803',
    artifactId: 'REPLAY-ATTACK-SIM-003',
    sourceFilename: 'replay_block_849201_nonce_dup.raw',
    tenantId: 'TNT-REPLAY-SIM',
    isolationSlot: 'CHAMBER-02-SLOT-GAMMA',
    quarantineReason: 'REPLAY_DETECTED: Nonce duplicated from Block #849201',
    quarantinedAt: '2026-08-22 10:45:02 ICT',
    severity: 'CRITICAL',
    declaredSha256: '718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0123456789abcdef',
    actualSha256: '718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0123456789abcdef',
    algorithmDetected: 'Dilithium-5 (Valid signature, but Nonce Replayed)',
    mutationRequested: 0,
    courtPreservationStatus: 'IMMUTABLE_PRESERVED_V24',
    replaySlaPassed: true,
    fieldMismatches: [
      {
        field: 'nonceBinding',
        expected: 'Fresh Unused Nonce for Block #849202',
        actual: 'Replayed Nonce from Block #849201 (Consumed)',
        violationType: 'CRYPTOGRAPHIC_REPLAY_ATTACK',
      },
    ],
    forensicTraceStages: [
      {
        stageNumber: 1,
        stageCode: 'STAGE-01: SENSE',
        name: 'Ingress Nonce Registry Lookup',
        status: 'PASSED',
        latencyMs: 6,
        parentHash: 'GENESIS_ROOT_0000',
        outputHash: 'sha256-a01b02c03d04e05f',
        actor: 'GatewayAuthHeatmap',
        sourceModule: 'src/components/GatewayAuthHeatmap.tsx',
        evidenceNote: 'Ingress packet analyzed; nonce bloom filter tripped.',
      },
      {
        stageNumber: 2,
        stageCode: 'STAGE-02: INGEST',
        name: 'Nonce Ledger Duplicate Check',
        status: 'QUARANTINED',
        latencyMs: 8,
        parentHash: 'sha256-a01b02c03d04e05f',
        outputHash: 'sha256-b02c03d04e05f06a',
        actor: 'DeterministicVerificationPipeline',
        sourceModule: 'src/components/DeterministicVerificationPipeline.tsx',
        evidenceNote: 'Exact nonce match found in history block #849201 tx#4.',
      },
      {
        stageNumber: 3,
        stageCode: 'STAGE-03: ASSURE',
        name: 'State Invariant Check',
        status: 'PASSED',
        latencyMs: 10,
        parentHash: 'sha256-b02c03d04e05f06a',
        outputHash: 'sha256-c03d04e05f06a07b',
        actor: 'P0FrozenCoreGuardPanel',
        sourceModule: 'src/components/P0FrozenCoreGuardPanel.tsx',
        evidenceNote: 'Invariant #04 (Anti-Replay) successfully asserted.',
      },
      {
        stageNumber: 4,
        stageCode: 'STAGE-04: UNDERSTAND',
        name: 'Identity Collision Guard Query',
        status: 'PASSED',
        latencyMs: 9,
        parentHash: 'sha256-c03d04e05f06a07b',
        outputHash: 'sha256-d04e05f06a07b08c',
        actor: 'IdentityCollisionGuard',
        sourceModule: 'src/components/IdentityCollisionGuard.tsx',
        evidenceNote: 'Tenant TNT-REPLAY-SIM identified in simulation sandbox.',
      },
      {
        stageNumber: 5,
        stageCode: 'STAGE-05: SIMULATE',
        name: 'Blast Radius Isolation Test',
        status: 'PASSED',
        latencyMs: 14,
        parentHash: 'sha256-d04e05f06a07b08c',
        outputHash: 'sha256-e05f06a07b08c09d',
        actor: 'DigitalTwinSandbox',
        sourceModule: 'src/components/FiosDigitalTwinStressSandbox.tsx',
        evidenceNote: 'Zero state contamination outside buffer Gamma.',
      },
      {
        stageNumber: 6,
        stageCode: 'STAGE-06: DECIDE',
        name: 'Quarantine Firewall Enforcement',
        status: 'QUARANTINED',
        latencyMs: 7,
        parentHash: 'sha256-e05f06a07b08c09d',
        outputHash: 'sha256-f06a07b08c09d0ae',
        actor: 'QuarantineRegistry',
        sourceModule: 'src/components/QuarantineRegistry.tsx',
        evidenceNote: 'Replay packet quarantined in Chamber 02 Buffer Gamma.',
      },
      {
        stageNumber: 7,
        stageCode: 'STAGE-07: GOVERN',
        name: 'Incident Escalation Record',
        status: 'PASSED',
        latencyMs: 9,
        parentHash: 'sha256-f06a07b08c09d0ae',
        outputHash: 'sha256-a07b08c09d0ae0bf',
        actor: 'PolicyEngine',
        sourceModule: 'src/components/PolicyEngine.ts',
        evidenceNote: 'Logged as Replay Violation under Thai Electronic Transactions Act Section 9.',
      },
      {
        stageNumber: 8,
        stageCode: 'STAGE-08: AUTHORIZE',
        name: '10/10 REAL_HSM Quorum Lock',
        status: 'PASSED',
        latencyMs: 12,
        parentHash: 'sha256-a07b08c09d0ae0bf',
        outputHash: 'sha256-b08c09d0ae0bf0c0',
        actor: 'CustodianQuorumRegistry',
        sourceModule: 'src/components/CustodianQuorumRegistry.tsx',
        evidenceNote: '10/10 Key Custodians confirmed quarantine lock.',
      },
      {
        stageNumber: 9,
        stageCode: 'STAGE-09: EXECUTE',
        name: 'Cloning into Module 17 Unclassified Preservation',
        status: 'PASSED',
        latencyMs: 14,
        parentHash: 'sha256-b08c09d0ae0bf0c0',
        outputHash: 'sha256-c09d0ae0bf0c00d1',
        actor: 'Module17PreservationEngine',
        sourceModule: 'src/components/views/Security/Chamber02View.tsx',
        evidenceNote: 'Full payload archived in read-only court-admissible storage.',
      },
      {
        stageNumber: 10,
        stageCode: 'STAGE-10: OBSERVE',
        name: 'Cryo QOps Stabilizer Monitor',
        status: 'PASSED',
        latencyMs: 8,
        parentHash: 'sha256-c09d0ae0bf0c00d1',
        outputHash: 'sha256-d0ae0bf0c00d10e2',
        actor: 'CryogenicTelemetryVisualizer',
        sourceModule: 'src/components/CryogenicTelemetryVisualizer.tsx',
        evidenceNote: 'Sub-kelvin bus at 14.98 mK; QOps stable at 851.9.',
      },
      {
        stageNumber: 11,
        stageCode: 'STAGE-11: VERIFY',
        name: 'Genesis Merkle Tree Cross-Validation',
        status: 'PASSED',
        latencyMs: 11,
        parentHash: 'sha256-d0ae0bf0c00d10e2',
        outputHash: 'sha256-e0bf0c00d10e20f3',
        actor: 'MerkleTreeValidator',
        sourceModule: 'src/components/MerkleTreeInteractiveGraph.tsx',
        evidenceNote: 'Validated against Genesis Root 909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68.',
      },
      {
        stageNumber: 12,
        stageCode: 'STAGE-12: CLOSURE',
        name: 'Dossier Closure & Electronic Evidence Stamp',
        status: 'VERIFIED',
        latencyMs: 8,
        parentHash: 'sha256-e0bf0c00d10e20f3',
        outputHash: 'sha256-f0c00d10e20f3104',
        actor: 'ForensicClosureControlPlane',
        sourceModule: 'src/components/ForensicClosureControlPlane.tsx',
        evidenceNote: 'Court-admissible proof object sealed under ETDA Sections 9, 26, and 28.',
      },
    ],
  },
];

export interface AttackVectorDef {
  id: string;
  name: string;
  category: string;
  tag: string;
  description: string;
  targetSlot: string;
  violation: string;
  tripwireMessage: string;
  latencyMs: number;
}

export const SIMULATED_ATTACK_VECTORS: AttackVectorDef[] = [
  {
    id: 'VEC-SIDE-CHANNEL',
    name: 'Side-Channel Clock Glitch & Voltage Perturbation',
    category: 'PHYSICAL_FAULT_INJECTION',
    tag: 'FIPS 140-3 L4 FAULT',
    description: 'จำลองการดรอปแรงดันไฟฟ้าฉับพลันระหว่างการคำนวณ Dilithium-5 เพื่อหวังข้ามการตรวจสอบเงื่อนไข (Instruction Bypass)',
    targetSlot: 'CHAMBER-02-SLOT-DELTA',
    violation: 'CLOCK_FREQUENCY_DEVIATION > 1.4GHz & BRANCH_PREDICTION_FAULT',
    tripwireMessage: 'Sub-Kelvin Cryostat Tamper Foil Tripwire triggered in 4.8ms',
    latencyMs: 14,
  },
  {
    id: 'VEC-PQC-LATTICE',
    name: 'PQC Quantum Lattice Coefficient Tampering',
    category: 'POST_QUANTUM_CRYPTO_TAMPER',
    tag: 'NIST FIPS 203 VIOLATION',
    description: 'ฉีดค่าสัมประสิทธิ์ผิดรูปเกินขอบเขตโมดูลัส q=3329 ในเวกเตอร์รหัสลับ ML-KEM-1024',
    targetSlot: 'CHAMBER-02-SLOT-EPSILON',
    violation: 'LATTICE_COEFFICIENT_OUT_OF_BOUNDS (q > 3329)',
    tripwireMessage: 'FIPS 203 Modular Verification Gate tripped in 6.2ms',
    latencyMs: 18,
  },
  {
    id: 'VEC-CANONICAL-OVERFLOW',
    name: 'Zero Canonical Write Overflow (Seal #14,903 Attempt)',
    category: 'CANONICAL_BOUNDARY_VIOLATION',
    tag: 'SSoT Δ0 INVARIANT VIOLATION',
    description: 'พยายามแทรกเขียนตราประทับเกินขอบเขตถาวร 14,902 ไปเป็นตราที่ 14,903',
    targetSlot: 'CHAMBER-02-SLOT-ZETA',
    violation: 'IMMUTABLE_SEAL_COUNT_EXCEEDED (14,903 > 14,902)',
    tripwireMessage: 'Fail-Closed SSoT Boundary Tripwire triggered in 1.9ms',
    latencyMs: 9,
  },
  {
    id: 'VEC-SHA25G-COUNTERFEIT',
    name: "Counterfeit Primitive ('SHA-25G' Anomaly Injection)",
    category: 'FORGED_ALGORITHM_PRIMITIVE',
    tag: 'FIPS 180-4 INTEGRITY',
    description: "พยายามส่งค่าแฮชด้วยอัลกอริทึมปลอม 'SHA-25G' ซึ่งละเมิดมาตรฐานรหัสลับแห่งชาติ",
    targetSlot: 'CHAMBER-02-SLOT-ETA',
    violation: "UNAUTHORIZED_ALGORITHM_PRIMITIVE 'SHA-25G' (Standard: SHA-256)",
    tripwireMessage: 'Cryptographic Primitive Boundary triggered in 3.4ms',
    latencyMs: 11,
  },
];

export const Chamber02View: React.FC = () => {
  const [quarantinedItems, setQuarantinedItems] = useState<QuarantinedModule17Item[]>(INITIAL_QUARANTINED_ITEMS);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('INC-QRT-801');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<string>('2026-08-22 10:45:02 ICT');
  const [autoPollLedger, setAutoPollLedger] = useState(true);

  // Threat Injection Sandbox State
  const [selectedVectorId, setSelectedVectorId] = useState<string>('VEC-SIDE-CHANNEL');
  const [simState, setSimState] = useState<'IDLE' | 'INJECTING' | 'TRIPPED' | 'CONTAINED'>('IDLE');
  const [simProgress, setSimProgress] = useState<number>(0);
  const [simTelemetry, setSimTelemetry] = useState<string | null>(null);
  const [isDossierPreviewModalOpen, setIsDossierPreviewModalOpen] = useState<boolean>(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isRangeExportModalOpen, setIsRangeExportModalOpen] = useState<boolean>(false);

  // 12-Stage Trace Replay Controller
  const [currentReplayStageIndex, setCurrentReplayStageIndex] = useState<number>(11);
  const [isPlayingReplay, setIsPlayingReplay] = useState<boolean>(false);
  const [replaySpeedMs, setReplaySpeedMs] = useState<number>(650);
  const [chartViewMode, setChartViewMode] = useState<'latency' | 'cumulative' | 'coherence'>('latency');
  const replayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Copy helper feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // 4-Stage Pipeline execution state
  const [pipelineReports, setPipelineReports] = useState<IntakePipelineReport[]>([]);
  const [isExecutingPipeline, setIsExecutingPipeline] = useState(false);

  // Active Incident Selection
  const activeIncident = useMemo(() => {
    return quarantinedItems.find((i) => i.incidentId === selectedIncidentId) || quarantinedItems[0];
  }, [quarantinedItems, selectedIncidentId]);

  // Filtered Incidents List
  const filteredIncidents = useMemo(() => {
    return quarantinedItems.filter((item) => {
      if (severityFilter !== 'ALL' && item.severity !== severityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.incidentId.toLowerCase().includes(q) ||
          item.artifactId.toLowerCase().includes(q) ||
          item.tenantId.toLowerCase().includes(q) ||
          item.quarantineReason.toLowerCase().includes(q) ||
          item.actualSha256.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [quarantinedItems, severityFilter, searchQuery]);

  // Total accumulated latency for the selected incident's 12 stages
  const totalReplayLatencyMs = useMemo(() => {
    if (!activeIncident?.forensicTraceStages) return 142;
    return activeIncident.forensicTraceStages.reduce((sum, st) => sum + st.latencyMs, 0);
  }, [activeIncident]);

  // Prepared Recharts Data for 12-Stage Trace Replay Timeline
  const traceRechartsData = useMemo(() => {
    if (!activeIncident?.forensicTraceStages) return [];
    let cumulative = 0;
    return activeIncident.forensicTraceStages.map((st, idx) => {
      cumulative += st.latencyMs;
      // Coherence calculation: decreases slightly during quarantine trigger then recovers
      const isQuarantine = st.status === 'QUARANTINED' || st.status === 'BLOCKED';
      const coherence = isQuarantine ? 99.985 - idx * 0.005 : 99.998 - idx * 0.001;
      const qops = 851.9 + (idx % 3 === 0 ? 1.4 : -0.8);

      return {
        stageIndex: idx + 1,
        shortCode: `S${idx + 1}`,
        stageCode: st.stageCode,
        name: st.name,
        latencyMs: st.latencyMs,
        cumulativeLatency: cumulative,
        slaLimit: 142,
        status: st.status,
        actor: st.actor,
        coherence: Number(coherence.toFixed(4)),
        qops: Number(qops.toFixed(1)),
        isCurrent: idx === currentReplayStageIndex,
        isPast: idx <= currentReplayStageIndex,
        fillColor:
          idx === currentReplayStageIndex
            ? '#38bdf8'
            : isQuarantine
            ? '#f43f5e'
            : '#10b981',
      };
    });
  }, [activeIncident, currentReplayStageIndex]);

  // Simulation: Fetch latest records from Module 17 Evidence Ledger
  const handleFetchModule17Records = () => {
    setIsRefreshing(true);
    playTone(580, 0.04);
    setTimeout(() => {
      setLastFetchedAt(new Date().toLocaleTimeString('en-US', { hour12: false }) + ' ICT');
      setIsRefreshing(false);
      playAuditChime();
    }, 450);
  };

  // Auto-polling interval simulation for Module 17 ledger
  useEffect(() => {
    if (!autoPollLedger) return;
    const interval = setInterval(() => {
      setLastFetchedAt(new Date().toLocaleTimeString('en-US', { hour12: false }) + ' ICT');
    }, 30000);
    return () => clearInterval(interval);
  }, [autoPollLedger]);

  // 12-Stage Trace Replay Animation Loop
  useEffect(() => {
    if (isPlayingReplay) {
      replayTimerRef.current = setInterval(() => {
        setCurrentReplayStageIndex((prev) => {
          const totalStages = activeIncident?.forensicTraceStages?.length || 12;
          if (prev >= totalStages - 1) {
            setIsPlayingReplay(false);
            playAuditChime();
            return totalStages - 1;
          }
          playTone(440 + prev * 35, 0.03);
          return prev + 1;
        });
      }, replaySpeedMs);
    } else {
      if (replayTimerRef.current) {
        clearInterval(replayTimerRef.current);
      }
    }
    return () => {
      if (replayTimerRef.current) clearInterval(replayTimerRef.current);
    };
  }, [isPlayingReplay, activeIncident, replaySpeedMs]);

  const handleStartReplay = () => {
    playTone(520, 0.05);
    setCurrentReplayStageIndex(0);
    setIsPlayingReplay(true);
  };

  const handlePauseReplay = () => {
    playTone(400, 0.04);
    setIsPlayingReplay(false);
  };

  const handleResetReplay = () => {
    playTone(330, 0.04);
    setIsPlayingReplay(false);
    setCurrentReplayStageIndex(activeIncident?.forensicTraceStages?.length ? activeIncident.forensicTraceStages.length - 1 : 11);
  };

  const handleCopy = (text: string, label: string) => {
    copyToClipboard(text);
    setCopiedKey(label);
    playTone(720, 0.04);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Run 4-stage pipeline simulation from intakeVerificationSpec
  const handleRun4StagePipeline = (artifact: EvidenceMetadataSchema) => {
    setIsExecutingPipeline(true);
    playTone(600, 0.05);

    setTimeout(() => {
      const report = execute4StageIntakeVerification(artifact);
      setPipelineReports((prev) => [report, ...prev.filter((r) => r.artifactMetadata.artifactId !== artifact.artifactId)]);
      setIsExecutingPipeline(false);
      playAuditChime();
    }, 600);
  };

  // Export Court-Admissible Forensic Dossier JSON
  const handleExportForensicDossier = () => {
    playTone(640, 0.04);
    const dossier = {
      dossierId: `CHAMBER02-FORENSIC-DOSSIER-${activeIncident.incidentId}`,
      exportedAt: new Date().toISOString(),
      statuteCompliance: {
        legalFramework: 'พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ และที่แก้ไขเพิ่มเติม',
        sections: {
          section9: 'COMPLIANT (Zero Trust Principal Intent Verification & IAL2/IAL3)',
          section26: 'COMPLIANT WITH DILITHIUM-5 (FIPS 204 Non-repudiation & 10/10 REAL_HSM)',
          section28: 'COMPLIANT WITH 10/10 REAL_HSM QUORUM & CA CERTIFICATION BINDING',
        },
        pdpaCompliance: 'พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ มาตรา ๓๗ (การรักษาความมั่นคงปลอดภัย)',
        isoStandard: 'ISO/IEC 27037 Digital Evidence Chain of Custody',
      },
      preservationStorage: {
        module: 'Module 17 (Unclassified Preservation V24)',
        immutableNoDeletionEnforced: true,
        ssotMutationAuthority: 0,
        zeroDriftRate: '0.00%',
        merkleRootAnchor: SYSTEM_METADATA.merkleRoot,
        canonicalBlock: SYSTEM_METADATA.sealedBlock,
      },
      incidentDetails: activeIncident,
      replayTracePerformance: {
        totalStages: activeIncident.forensicTraceStages.length,
        totalLatencyMs: totalReplayLatencyMs,
        slaTargetMs: 142,
        slaStatus: totalReplayLatencyMs <= 142 ? 'PASSED_SLA' : 'SLA_EXCEEDED',
        cryogenicTemperature: '14.98 mK',
        qOpsRate: 851.9,
      },
      custodianSignatures: THAI_CUSTODIANS.map((c) => ({
        passport: c.passportNumber,
        nameTh: c.nameTh,
        role: c.roleTh,
        signedDate: c.signedDate,
        keyFingerprint: c.keyFingerprint,
      })),
    };

    const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zyrquen-chamber02-${activeIncident.incidentId}-forensic-dossier.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSignedSealChain = async () => {
    playAuditChime();
    try {
      await exportSignedForensicAuditSealChainJson();
    } catch (e) {
      console.error('Failed to export signed seal chain:', e);
    }
  };

  const handleRunThreatInjection = () => {
    const vector = SIMULATED_ATTACK_VECTORS.find((v) => v.id === selectedVectorId) || SIMULATED_ATTACK_VECTORS[0];
    setSimState('INJECTING');
    setSimProgress(20);
    setSimTelemetry(`[INJECTION INITIATED] Target: ${vector.name} -> Target Slot: ${vector.targetSlot}`);
    playTone(420, 0.08);

    setTimeout(() => {
      setSimProgress(55);
      setSimTelemetry(`[SENSOR SENSING] Jitter anomaly detected. ${vector.tripwireMessage}`);
      playTone(320, 0.09);

      setTimeout(() => {
        setSimState('TRIPPED');
        setSimProgress(85);
        setSimTelemetry(`[FAIL-CLOSED ENGAGED] Mutation halted (Δ0 Invariant 0). Transferring artifact to Module 17.`);
        playTone(550, 0.06);

        setTimeout(() => {
          const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' ICT';
          const randomHex = Math.random().toString(16).substring(2, 8);
          const newIncidentId = `INC-SIM-${Date.now().toString().slice(-4)}`;
          const newArtifactId = `SIM-PAYLOAD-${vector.id}-${randomHex}`;

          const newIncident: QuarantinedModule17Item = {
            id: `M17-SIM-${Date.now().toString().slice(-4)}`,
            incidentId: newIncidentId,
            artifactId: newArtifactId,
            sourceFilename: `adversarial_${vector.id.toLowerCase()}_payload.bin`,
            tenantId: 'TNT-SIMULATED-ATTACKER',
            isolationSlot: vector.targetSlot,
            quarantineReason: vector.violation,
            quarantinedAt: timestamp,
            severity: 'CRITICAL',
            declaredSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            actualSha256: `fa77b09c${randomHex}9182374650192837465918273645019283746501928374659182`,
            algorithmDetected: vector.category,
            mutationRequested: 1,
            courtPreservationStatus: 'IMMUTABLE_PRESERVED_V24',
            replaySlaPassed: true,
            fieldMismatches: [
              {
                field: 'execution_invariant',
                expected: 'FAIL_SAFE_READ_ONLY (0)',
                actual: 'ATTEMPTED_MUTATION (1)',
                violationType: 'SSoT_ZERO_DRIFT_INTEGRITY_BREACH',
              },
              {
                field: 'fault_vector',
                expected: 'CRYPTO_COHERENT_0.9997',
                actual: vector.violation,
                violationType: 'HARDWARE_TRIPWIRE_TRIGGERED',
              },
            ],
            forensicTraceStages: [
              { stageNumber: 1, stageCode: 'STAGE-01-INGEST', name: 'Raw Packet Intake & Entropy Sensor', status: 'VERIFIED', latencyMs: 2.1, parentHash: '0x00000000', outputHash: '0x1a8f9021', actor: 'GatewayIngress#01', sourceModule: 'Module 01 - Network Gateway', evidenceNote: 'Packet accepted into quarantine airlock buffer' },
              { stageNumber: 2, stageCode: 'STAGE-02-DECOMPOSE', name: 'Cryptographic Envelope Inspection', status: 'VERIFIED', latencyMs: 3.4, parentHash: '0x1a8f9021', outputHash: '0x2b90a132', actor: 'CryptoEngine#04', sourceModule: 'Module 04 - Cryptographic Core', evidenceNote: 'Envelope unsealed under isolated sandbox' },
              { stageNumber: 3, stageCode: 'STAGE-03-TRIPWIRE', name: 'Tripwire Intrusion Sensor Trigger', status: 'QUARANTINED', latencyMs: vector.latencyMs, parentHash: '0x2b90a132', outputHash: '0x3c01b243', actor: 'IntrusionMonitor#02', sourceModule: 'Module 02 - Citadel Guard', evidenceNote: `${vector.tripwireMessage}. Quarantine isolation triggered.` },
              { stageNumber: 4, stageCode: 'STAGE-04-FAIL_CLOSED', name: 'Fail-Closed Automatic Containment', status: 'BLOCKED', latencyMs: 1.8, parentHash: '0x3c01b243', outputHash: '0x4d12c354', actor: 'SiliconGovernor#01', sourceModule: 'Module 17 - Immutable Ledger', evidenceNote: 'Hardware mutation authority locked at 0. Zero drift preserved.' },
              { stageNumber: 5, stageCode: 'STAGE-05-PRESERVE', name: 'Module 17 Immutable Evidence Sealing', status: 'VERIFIED', latencyMs: 2.6, parentHash: '0x4d12c354', outputHash: '0x5e23d465', actor: 'ForensicArchivist#17', sourceModule: 'Module 17 - Preservation V24', evidenceNote: `Artifact frozen in ${vector.targetSlot} under ISO/IEC 27037 standards` },
              { stageNumber: 6, stageCode: 'STAGE-06-CLOSURE', name: 'Court Evidence Dossier Generation', status: 'VERIFIED', latencyMs: 3.2, parentHash: '0x5e23d465', outputHash: '0x6f34e576', actor: 'LegalAttestor#02', sourceModule: 'Module 02 - Forensics Chamber', evidenceNote: 'Incident logged to ETDA Sec 9, 26, 28 chain of custody' },
            ],
          };

          setQuarantinedItems((prev) => [newIncident, ...prev]);
          setSelectedIncidentId(newIncidentId);
          setCurrentReplayStageIndex(5);
          setSimState('CONTAINED');
          setSimProgress(100);
          setSimTelemetry(`[CONTAINMENT COMPLETE] Incident ${newIncidentId} isolated in ${vector.targetSlot}. Total Latency: ${(vector.latencyMs + 13.1).toFixed(1)}ms (SLA < 142ms PASS)`);
          playAuditChime();
        }, 300);
      }, 250);
    }, 250);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Chamber 02 & Module 17 Master Status */}
      <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#120b1e]/90 via-[#070b14]/85 to-[#04060b] border border-rose-500/30 backdrop-blur-xl shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/10 shrink-0">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold">
                  CHAMBER 02 &bull; FORENSICS &amp; QUARANTINE
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/50 text-[10px] font-mono">
                  MODULE 17 (V24) IMMUTABLE LOCK
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/50 text-[10px] font-mono">
                  ETDA SEC 9, 26, 28 ADMISSIBLE
                </span>
              </div>
              <h2 className="text-xl font-bold font-mono text-white mt-1">
                Chamber 02: Forensics &amp; Quarantine &bull; Module 17 Preservation
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                Active Isolation of Malicious / Degraded Artifacts &bull; Zero Deletion Authority &bull; 12-Stage Trace Replay SLA &lt; 142ms
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges & Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="p-3 rounded-2xl bg-black/50 border border-rose-500/30 font-mono text-xs">
              <div className="text-rose-400 text-[10px] font-bold">QUARANTINED ITEMS</div>
              <div className="text-lg font-bold text-rose-300 mt-0.5">{quarantinedItems.length} Records</div>
            </div>

            <div className="p-3 rounded-2xl bg-black/50 border border-emerald-500/30 font-mono text-xs">
              <div className="text-emerald-400 text-[10px] font-bold">MUTATION PERMITTED</div>
              <div className="text-lg font-bold text-emerald-300 mt-0.5">0 (SSoT &Delta;0)</div>
            </div>

            <div className="p-3 rounded-2xl bg-black/50 border border-cyan-500/30 font-mono text-xs">
              <div className="text-cyan-400 text-[10px] font-bold">TRACE REPLAY SLA</div>
              <div className="text-lg font-bold text-cyan-300 mt-0.5">{totalReplayLatencyMs} ms / 142ms</div>
            </div>

            <button
              onClick={() => {
                playTone(680, 0.04);
                setIsQrModalOpen(true);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600/30 via-emerald-600/30 to-teal-600/30 hover:from-cyan-500/40 hover:to-emerald-500/40 border border-cyan-400/50 text-cyan-100 font-mono text-xs font-bold flex items-center gap-2 transition hover:scale-105 shadow-md shadow-cyan-500/20"
              title="Generate PQC Signed Merkle Root QR Code for Physical Optical Scanning & Mobile Audit Trail Link"
            >
              <QrCode className="w-4 h-4 text-cyan-300" />
              <span>Merkle Root QR</span>
            </button>

            <button
              onClick={() => {
                playTone(620, 0.04);
                setIsDossierPreviewModalOpen(true);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 font-mono text-xs font-bold flex items-center gap-2 transition hover:scale-105 shadow-md shadow-cyan-500/10"
              title="Interactive Multi-Page PDF Preview"
            >
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Preview Dossier</span>
            </button>

            <button
              onClick={handleExportForensicDossier}
              className="px-3.5 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-mono text-xs font-bold flex items-center gap-2 transition hover:scale-105 shadow-md shadow-rose-500/10"
            >
              <Download className="w-4 h-4" />
              <span>Export Court Dossier</span>
            </button>

            <button
              onClick={() => {
                playTone(720, 0.05);
                setIsRangeExportModalOpen(true);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500/30 via-cyan-500/30 to-fuchsia-500/30 hover:from-indigo-500/40 hover:to-cyan-500/40 border border-cyan-400/50 text-white font-mono text-xs font-bold flex items-center gap-2 transition hover:scale-105 shadow-md shadow-cyan-500/20"
              title="Export complete 14,902 Seal Chain or Selected Historical Block Range in Signed JSON Format"
            >
              <Lock className="w-4 h-4 text-cyan-300" />
              <span>Export Signed Seal Chain (JSON)</span>
            </button>
          </div>
        </div>

        {/* Anti-Corruption Lock Guarantee Callout */}
        <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-zinc-300">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong className="text-white">Anti-Corruption Storage Rule:</strong> In Module 17 (Unclassified Preservation V24), deletion and edit buttons are mathematically disabled in silicon to prevent any custodian or intruder from purging evidence.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-emerald-300 font-bold">ISO/IEC 27037 CUSTODY INTACT</span>
          </div>
        </div>
      </div>

      {/* Real-time Threat Injection Simulator (Chamber 02 Fail-Closed Sandbox) */}
      <div className="p-5 rounded-[24px] bg-gradient-to-br from-[#160b1e]/90 via-[#0a0f1b]/80 to-[#050811] border border-rose-500/40 space-y-4 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-md shadow-rose-500/10">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                  Chamber 02 &bull; Real-time Threat Injection Simulator
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/25 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold animate-pulse">
                  FAIL-CLOSED SANDBOX
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600/40 text-[10px] font-mono">
                  &Delta;0 ZERO-MUTATION ENFORCED
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                ฉีดเวกเตอร์การโจมตีจำลองเพื่อทดสอบการตัดไฟอัตโนมัติ (Fail-Closed) การส่งเข้าสู่หลุมดำควบคุม Module 17 และบันทึกหลักฐานศาล
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunThreatInjection}
              disabled={simState === 'INJECTING' || simState === 'TRIPPED'}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-900/30 transition hover:scale-105 active:scale-95"
            >
              <Zap className="w-4 h-4 text-amber-200" />
              <span>
                {simState === 'INJECTING'
                  ? 'INJECTING PAYLOAD...'
                  : simState === 'TRIPPED'
                  ? 'CONTAINING & SEALING...'
                  : '⚡ EXECUTE INJECTION'}
              </span>
            </button>
          </div>
        </div>

        {/* Attack Vector Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 font-mono">
          {SIMULATED_ATTACK_VECTORS.map((vec) => {
            const isSelected = selectedVectorId === vec.id;
            return (
              <button
                key={vec.id}
                onClick={() => {
                  playTone(500, 0.03);
                  setSelectedVectorId(vec.id);
                }}
                className={`p-3.5 rounded-xl text-left border transition-all relative overflow-hidden ${
                  isSelected
                    ? 'bg-rose-950/40 border-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                    : 'bg-black/30 border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-bold">
                    {vec.tag}
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold">
                    {vec.targetSlot}
                  </span>
                </div>
                <div className="font-bold text-white text-xs mb-1">
                  {vec.name}
                </div>
                <div className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                  {vec.description}
                </div>
              </button>
            );
          })}
        </div>

        {/* Real-time Progress Bar & Telemetry */}
        {(simState !== 'IDLE' || simTelemetry) && (
          <div className="p-3.5 rounded-xl bg-black/70 border border-white/10 space-y-2 font-mono">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span className="text-zinc-300">
                  SANDBOX STATUS:{' '}
                  <strong className={simState === 'CONTAINED' ? 'text-emerald-400' : 'text-amber-400'}>
                    {simState}
                  </strong>
                </span>
              </div>
              <span className="text-[11px] text-zinc-400">{simProgress}% COMPLETE</span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  simState === 'CONTAINED'
                    ? 'bg-emerald-400'
                    : simState === 'TRIPPED'
                    ? 'bg-rose-500'
                    : 'bg-amber-400'
                }`}
                style={{ width: `${simProgress}%` }}
              />
            </div>

            {simTelemetry && (
              <div className="text-[11px] text-zinc-300 flex items-center justify-between pt-1">
                <span className="truncate">{simTelemetry}</span>
                <span className="text-emerald-400 font-bold shrink-0 ml-2">SLA PASS (&lt;142ms)</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Grid: Quarantined Items List (Left 5 Cols) vs Inspector & 12-Stage Trace Replay (Right 7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Module 17 Quarantined Records List */}
        <div className="lg:col-span-5 space-y-4 font-mono">
          {/* Header with Ledger Source & Refresh Button */}
          <div className="p-4 rounded-2xl bg-[#0b0e1a]/80 border border-white/8 backdrop-blur-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Module 17 Evidence Ledger
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleFetchModule17Records}
                  disabled={isRefreshing}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition flex items-center gap-1 text-[10px]"
                  title="Fetch latest from Module 17"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-rose-400' : ''}`} />
                  <span>Sync</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-zinc-500">
              <span>Source: <strong className="text-zinc-400">Chamber 17 Ledger V24</strong></span>
              <span>Updated: <strong className="text-cyan-400">{lastFetchedAt}</strong></span>
            </div>

            {/* Search & Filter Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหา Incident ID, Artifact, Tenant, หรือ SHA-256..."
                className="w-full bg-zinc-900/90 border border-zinc-700 focus:border-rose-400 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none transition"
              />
            </div>

            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-zinc-500 text-[11px]">Severity:</span>
              <div className="flex items-center gap-1.5">
                {(['ALL', 'CRITICAL', 'HIGH'] as const).map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                      severityFilter === sev
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quarantined Records List */}
          <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
            {filteredIncidents.map((item) => {
              const isSelected = activeIncident.incidentId === item.incidentId;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    playTone(550, 0.03);
                    setSelectedIncidentId(item.incidentId);
                    setCurrentReplayStageIndex(item.forensicTraceStages.length ? item.forensicTraceStages.length - 1 : 11);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 font-mono ${
                    isSelected
                      ? 'bg-gradient-to-r from-rose-950/40 via-[#0b0e1a] to-rose-950/20 border-rose-400/80 shadow-[0_0_18px_rgba(244,63,94,0.2)]'
                      : 'bg-[#0b0e1a]/70 hover:bg-[#120e22]/80 border-white/8'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          item.severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        {item.severity} &bull; {item.incidentId}
                      </span>
                      <span className="text-xs font-bold text-zinc-100 truncate max-w-[130px]">{item.tenantId}</span>
                    </div>

                    <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{item.quarantinedAt.replace('2026-08-', '08/').replace(' ICT', '')}</span>
                    </span>
                  </div>

                  <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="truncate">{item.artifactId}</span>
                  </div>

                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {item.quarantineReason}
                  </p>

                  <div className="flex items-center justify-between text-[10px] pt-1 border-t border-white/5 text-zinc-500">
                    <span>Slot: {item.isolationSlot}</span>
                    <span className="text-emerald-400">Module 17 Preserved</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deep Forensic Drill-Down & 12-Stage Trace Replay Visualization */}
        <div className="lg:col-span-7 space-y-5 font-mono">
          {/* Active Quarantined Item Inspector Card */}
          <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#120b1e]/90 via-[#070b14]/85 to-[#04060b] border border-rose-500/30 backdrop-blur-xl shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  <FileWarning className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500">CHAMBER 02 INCIDENT DOSSIER</span>
                  <h3 className="text-base font-bold text-white">
                    {activeIncident.incidentId} &bull; {activeIncident.artifactId}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  FAIL-CLOSED ISOLATED
                </span>
              </div>
            </div>

            {/* Mismatch & Violation Breakdown */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                <span>Cryptographic &amp; Schema Mismatch Violations</span>
                <span className="text-[10px] text-rose-400">{activeIncident.fieldMismatches.length} Invariants Violated</span>
              </div>

              <div className="space-y-2">
                {activeIncident.fieldMismatches.map((m, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-black/50 border border-rose-500/20 space-y-1 text-xs">
                    <div className="flex items-center justify-between font-bold text-rose-300">
                      <span>Field: {m.field}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                        {m.violationType}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800">
                        <span className="text-zinc-500">Expected SSoT:</span>
                        <div className="text-emerald-400 truncate">{m.expected}</div>
                      </div>
                      <div className="p-1.5 rounded bg-zinc-900 border border-rose-900/40">
                        <span className="text-zinc-500">Observed Actual:</span>
                        <div className="text-rose-300 truncate">{m.actual}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cryptographic Digests & Parent Binding */}
            <div className="p-3.5 rounded-2xl bg-black/60 border border-white/8 space-y-2 text-xs">
              <div className="text-[11px] font-bold text-zinc-400 uppercase flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5 text-rose-400" />
                <span>Byte Hashes &amp; Hardware Slot Anchor</span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Actual Byte SHA-256:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-rose-300 truncate max-w-[200px] sm:max-w-[260px]">
                      {activeIncident.actualSha256}
                    </span>
                    <button
                      onClick={() => handleCopy(activeIncident.actualSha256, 'actualSha')}
                      className="p-1 text-zinc-400 hover:text-white"
                      title="Copy Actual SHA-256"
                    >
                      {copiedKey === 'actualSha' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Algorithm Detected:</span>
                  <span className="text-amber-300">{activeIncident.algorithmDetected}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Preservation Slot:</span>
                  <span className="text-cyan-300">{activeIncident.isolationSlot} &bull; Module 17 (V24)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive 12-Stage Trace Replay Visualizer with RECHARTS */}
          <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#0c1322]/90 via-[#070b14]/85 to-[#04060b] border border-cyan-500/30 backdrop-blur-xl shadow-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500">ISO/IEC 27037 NATIVE REPLAY ENGINE</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      SLA &lt; 142ms VERIFIED
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">
                    Interactive 12-Stage Forensic Trace Replay
                  </h3>
                </div>
              </div>

              {/* Replay Playback Controls */}
              <div className="flex items-center gap-2">
                {!isPlayingReplay ? (
                  <button
                    onClick={handleStartReplay}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-cyan-300" />
                    <span>Play Replay</span>
                  </button>
                ) : (
                  <button
                    onClick={handlePauseReplay}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Pause className="w-3.5 h-3.5 fill-amber-300" />
                    <span>Pause</span>
                  </button>
                )}

                <button
                  onClick={handleResetReplay}
                  className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 transition"
                  title="Reset to Stage 12"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Recharts Mode Selector & Latency SLA Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 text-[11px]">Chart Mode:</span>
                <button
                  onClick={() => setChartViewMode('latency')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                    chartViewMode === 'latency'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  Stage Latency (ms)
                </button>
                <button
                  onClick={() => setChartViewMode('cumulative')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                    chartViewMode === 'cumulative'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  Cumulative vs SLA (142ms)
                </button>
                <button
                  onClick={() => setChartViewMode('coherence')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                    chartViewMode === 'coherence'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  Coherence &amp; QOps
                </button>
              </div>

              <div className="text-[11px] text-zinc-400">
                Speed: <span className="text-cyan-300 font-bold">{replaySpeedMs}ms / stage</span>
              </div>
            </div>

            {/* Recharts Timeline Visualizer */}
            <div className="p-3.5 rounded-2xl bg-black/60 border border-white/8 space-y-2">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartViewMode === 'latency' ? (
                    <BarChart data={traceRechartsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                      <XAxis
                        dataKey="shortCode"
                        stroke="#6b7280"
                        fontSize={10}
                        tickLine={false}
                        axisLine={{ stroke: '#374151' }}
                      />
                      <YAxis
                        stroke="#6b7280"
                        fontSize={10}
                        tickLine={false}
                        axisLine={{ stroke: '#374151' }}
                        domain={[0, 20]}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="p-2.5 rounded-xl bg-zinc-950/95 border border-cyan-500/40 text-[11px] font-mono shadow-xl space-y-1">
                                <div className="font-bold text-cyan-300">{data.stageCode}</div>
                                <div className="text-zinc-200">{data.name}</div>
                                <div className="flex items-center justify-between text-zinc-400 pt-1">
                                  <span>Latency: <strong className="text-white">{data.latencyMs} ms</strong></span>
                                  <span className={data.status === 'QUARANTINED' ? 'text-rose-400' : 'text-emerald-400'}>
                                    {data.status}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="latencyMs" radius={[4, 4, 0, 0]}>
                        {traceRechartsData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.fillColor}
                            opacity={entry.isPast ? 1 : 0.35}
                            onClick={() => {
                              playTone(400 + index * 30, 0.03);
                              setCurrentReplayStageIndex(index);
                            }}
                            cursor="pointer"
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : chartViewMode === 'cumulative' ? (
                    <ComposedChart data={traceRechartsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                      <XAxis
                        dataKey="shortCode"
                        stroke="#6b7280"
                        fontSize={10}
                        tickLine={false}
                        axisLine={{ stroke: '#374151' }}
                      />
                      <YAxis
                        stroke="#6b7280"
                        fontSize={10}
                        tickLine={false}
                        axisLine={{ stroke: '#374151' }}
                        domain={[0, 160]}
                      />
                      <ReferenceLine y={142} label={{ value: 'SLA 142ms Target', fill: '#f43f5e', fontSize: 10, position: 'top' }} stroke="#f43f5e" strokeDasharray="4 4" />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="p-2.5 rounded-xl bg-zinc-950/95 border border-cyan-500/40 text-[11px] font-mono shadow-xl space-y-1">
                                <div className="font-bold text-cyan-300">{data.stageCode}</div>
                                <div className="text-zinc-200">Cumulative: <strong className="text-cyan-400">{data.cumulativeLatency} ms</strong> / 142ms</div>
                                <div className="text-zinc-400">Status: {data.status}</div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area type="monotone" dataKey="cumulativeLatency" fill="rgba(6,182,212,0.15)" stroke="#06b6d4" strokeWidth={2} />
                      <Line type="monotone" dataKey="cumulativeLatency" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3, fill: '#38bdf8' }} />
                    </ComposedChart>
                  ) : (
                    <AreaChart data={traceRechartsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                      <XAxis
                        dataKey="shortCode"
                        stroke="#6b7280"
                        fontSize={10}
                        tickLine={false}
                        axisLine={{ stroke: '#374151' }}
                      />
                      <YAxis
                        stroke="#6b7280"
                        fontSize={10}
                        tickLine={false}
                        axisLine={{ stroke: '#374151' }}
                        domain={[99.95, 100]}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="p-2.5 rounded-xl bg-zinc-950/95 border border-emerald-500/40 text-[11px] font-mono shadow-xl space-y-1">
                                <div className="font-bold text-emerald-300">{data.stageCode}</div>
                                <div className="text-zinc-200">Coherence: <strong className="text-emerald-400">{data.coherence}%</strong></div>
                                <div className="text-zinc-400">Cryo QOps: {data.qops} QOps</div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area type="monotone" dataKey="coherence" fill="rgba(16,185,129,0.15)" stroke="#10b981" strokeWidth={2} />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Step Pipeline Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>
                  Stage Progress: <strong className="text-white">{currentReplayStageIndex + 1}</strong> of {activeIncident.forensicTraceStages.length}
                </span>
                <span className="text-cyan-300 font-bold">
                  Accumulated Latency: {activeIncident.forensicTraceStages.slice(0, currentReplayStageIndex + 1).reduce((s, c) => s + c.latencyMs, 0)} ms / 142ms
                </span>
              </div>

              <div className="grid grid-cols-12 gap-1">
                {activeIncident.forensicTraceStages.map((st, sIdx) => {
                  const isCurrent = sIdx === currentReplayStageIndex;
                  const isPast = sIdx < currentReplayStageIndex;
                  return (
                    <button
                      key={sIdx}
                      onClick={() => {
                        playTone(400 + sIdx * 30, 0.03);
                        setCurrentReplayStageIndex(sIdx);
                      }}
                      className={`h-2.5 rounded-full transition-all ${
                        isCurrent
                          ? 'bg-cyan-400 ring-2 ring-cyan-300/80 shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                          : isPast
                          ? st.status === 'BLOCKED' || st.status === 'QUARANTINED'
                            ? 'bg-rose-500/80'
                            : 'bg-emerald-500/80'
                          : 'bg-zinc-800'
                      }`}
                      title={st.stageCode}
                    />
                  );
                })}
              </div>
            </div>

            {/* Current Active Stage Drill-Down Detail */}
            {activeIncident.forensicTraceStages[currentReplayStageIndex] && (
              <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/20 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px]">
                      {activeIncident.forensicTraceStages[currentReplayStageIndex].stageCode}
                    </span>
                    <span className="font-bold text-white text-sm">
                      {activeIncident.forensicTraceStages[currentReplayStageIndex].name}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                      activeIncident.forensicTraceStages[currentReplayStageIndex].status === 'BLOCKED' ||
                      activeIncident.forensicTraceStages[currentReplayStageIndex].status === 'QUARANTINED'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {activeIncident.forensicTraceStages[currentReplayStageIndex].status}
                  </span>
                </div>

                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  {activeIncident.forensicTraceStages[currentReplayStageIndex].evidenceNote}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="p-2 rounded-xl bg-zinc-900/90 border border-white/5 space-y-1">
                    <span className="text-zinc-500">Actor / Passport:</span>
                    <div className="text-amber-300 font-bold">
                      {activeIncident.forensicTraceStages[currentReplayStageIndex].actor}
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-zinc-900/90 border border-white/5 space-y-1">
                    <span className="text-zinc-500">Source Module Code:</span>
                    <div className="text-cyan-300 truncate">
                      {activeIncident.forensicTraceStages[currentReplayStageIndex].sourceModule}
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-zinc-900/90 border border-white/5 space-y-1">
                    <span className="text-zinc-500">Parent Digest:</span>
                    <div className="text-zinc-400 font-mono truncate">
                      {activeIncident.forensicTraceStages[currentReplayStageIndex].parentHash}
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-zinc-900/90 border border-white/5 space-y-1">
                    <span className="text-zinc-500">Output Digest:</span>
                    <div className="text-zinc-400 font-mono truncate">
                      {activeIncident.forensicTraceStages[currentReplayStageIndex].outputHash}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Thai Legal Compliance & ETDA Attestation Status Summary Component */}
          <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#0b0e1a]/90 via-[#070b14]/85 to-[#04060b] border border-emerald-500/30 backdrop-blur-xl shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500">LEGAL ADMISSIBILITY &amp; ETDA ATTESTATION</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      100% SSoT COMPLIANT
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">
                    พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ &amp; สพธอ. (ETDA) Standards
                  </h3>
                </div>
              </div>

              <span className="text-[11px] text-zinc-400 font-mono">
                Court Admissible &bull; ISO/IEC 27037
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Section 9 */}
              <div className="p-3.5 rounded-2xl bg-black/50 border border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">มาตรา ๙</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 text-[9px]">
                    IAL2 / IAL3
                  </span>
                </div>
                <div className="text-emerald-300 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>เจตนา &amp; ระบุตัวตน</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  ระบุตัวตนและเจตนาของผู้ทำรายการด้วยระบบตรวจยามซีโร่ทรัสต์ ควบคู่หนังสือเดินทางอธิปไตย (#EP-SOVEREIGN-01)
                </p>
                <div className="text-[9px] text-zinc-500 pt-1 border-t border-white/5">
                  Assurance: AAL2 / AAL3 Authenticator
                </div>
              </div>

              {/* Section 26 */}
              <div className="p-3.5 rounded-2xl bg-black/50 border border-cyan-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">มาตรา ๒๖</span>
                  <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60 text-[9px]">
                    FIPS 204 PQC
                  </span>
                </div>
                <div className="text-cyan-300 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>ลายมือชื่อเชื่อถือได้</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  ห้ามปฏิเสธความรับผิด (Non-repudiation) ด้วย Dilithium-5 (ML-DSA-87) ควบคู่ 10/10 REAL_HSM Quorum (FIPS 140-3 L4)
                </p>
                <div className="text-[9px] text-zinc-500 pt-1 border-t border-white/5">
                  Algorithm: Dilithium-5 Lattice PQC
                </div>
              </div>

              {/* Section 28 */}
              <div className="p-3.5 rounded-2xl bg-black/50 border border-amber-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">มาตรา ๒๘</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700/60 text-[9px]">
                    CA BINDING
                  </span>
                </div>
                <div className="text-amber-300 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>การรับรองจาก CA</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  ผูกมัดร่วมกับใบรับรอง CA ที่โปร่งใสบนสมุดทะเบียนสัจจะถาวร (Immutable Audit Ledger V25)
                </p>
                <div className="text-[9px] text-zinc-500 pt-1 border-t border-white/5">
                  Ledger: Genesis Block #849202
                </div>
              </div>
            </div>

            {/* PDPA Section 37 & Data Protection Guarantee */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-zinc-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>PDPA พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ มาตรา ๓๗:</strong> มีมาตรการรักษาความมั่นคงปลอดภัยขั้นสูงสุด และการแยกสิทธิ์ Multi-Tenant Isolation
                </span>
              </div>
              <span className="text-emerald-300 font-bold shrink-0">14,902 SEALS PRESERVED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive 4-Stage Intake Verification Pipeline Simulator */}
      <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#0c1626]/90 via-[#070b14]/85 to-[#04060b] border border-cyan-500/30 backdrop-blur-xl shadow-2xl space-y-5 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              <Zap className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-500">AUTOMATED INTAKE VERIFICATION SERVICE</span>
              <h3 className="text-base font-bold text-white">
                4-Stage Verification Protocol Pipeline (Phase 3 Manifest)
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {SAMPLE_PHASE3_EVIDENCE_ITEMS.map((item) => (
              <button
                key={item.artifactId}
                onClick={() => handleRun4StagePipeline(item)}
                disabled={isExecutingPipeline}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                  item.artifactId.includes('TAMPERED')
                    ? 'bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border-rose-700/50'
                    : 'bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border-cyan-700/50'
                }`}
              >
                <span>Test {item.tenantId}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Live Simulation Results */}
        {pipelineReports.length > 0 ? (
          <div className="space-y-4">
            {pipelineReports.map((report) => (
              <div
                key={report.pipelineExecutionId}
                className={`p-4 rounded-2xl border space-y-3 ${
                  report.overallVerdict === 'PROMOTED_TO_CANDIDATE'
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-rose-950/20 border-rose-500/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{report.artifactMetadata.artifactId}</span>
                    <span className="text-zinc-400">({report.artifactMetadata.sourceFilename})</span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                      report.overallVerdict === 'PROMOTED_TO_CANDIDATE'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    VERDICT: {report.overallVerdict} ({report.totalDurationMs} ms)
                  </span>
                </div>

                {/* 4 Stage Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                  {report.stages.map((st) => (
                    <div key={st.stageId} className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-zinc-400 truncate">{st.stageName.split('.')[0]}</span>
                        <span
                          className={`font-bold ${
                            st.status === 'PASSED'
                              ? 'text-emerald-400'
                              : st.status === 'QUARANTINED'
                              ? 'text-rose-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {st.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-300 line-clamp-2 leading-relaxed">
                        {st.details}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-black/20 border border-dashed border-zinc-800 rounded-2xl text-xs font-mono text-zinc-500">
            คลิกปุ่ม "Test TNT-TH-001" หรือ "Test DS-901-PILOT" ด้านบนเพื่อรันไปป์ไลน์ตรวจสอบข้อมูลขาเข้า 4 ขั้นตอน (Crypto Verify &rarr; Quarantine Diff &rarr; Multi-Tenant Validation &rarr; Digital Twin)
          </div>
        )}
      </div>

      {/* Interactive Sovereign PDF Dossier Preview Modal */}
      <InteractivePdfPreviewModal
        isOpen={isDossierPreviewModalOpen}
        onClose={() => setIsDossierPreviewModalOpen(false)}
      />

      {/* Merkle Root QR Code Modal for Physical Mobile Scanning */}
      <MerkleRootQrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        currentBlockHeight={CANONICAL_GENESIS_BLOCK}
        merkleRootHash={CANONICAL_MERKLE_ROOT}
      />

      {/* Historical Seal Block Range Export Modal (PQC Signed JSON) */}
      <ForensicSealRangeExportModal
        isOpen={isRangeExportModalOpen}
        onClose={() => setIsRangeExportModalOpen(false)}
      />
    </div>
  );
};
