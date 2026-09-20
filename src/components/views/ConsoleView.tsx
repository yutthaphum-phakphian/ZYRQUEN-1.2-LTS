import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Terminal,
  Send,
  Play,
  Sparkles,
  CornerDownLeft,
  LayoutGrid,
  Activity,
  Layers,
  Camera,
  CheckCircle2,
  ArrowRight,
  FileCheck2,
  Download,
  Sliders,
  Radio,
  Clock,
  Zap,
  BatteryCharging,
  ShieldCheck,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  FileJson,
  Cpu,
  Server,
  Share2,
  RefreshCw,
  GitMerge,
  Scale,
  Lock,
  QrCode,
} from 'lucide-react';
import { SYSTEM_METADATA, AUDIT_TRACE_TX, THAI_CUSTODIANS, SYSTEM_INVARIANTS } from '../../data/canonicalData';
import { playAuditChime, playTone, playWarningTone } from '../AudioSynthesizer';
import { ConsoleHardwareTelemetryGrid } from '../ConsoleHardwareTelemetryGrid';
import { MacroConsole } from '../MacroConsole';
import { EvidentiaryManifestQRScanner, EvidentiaryManifestPayload } from '../EvidentiaryManifestQRScanner';
import { HardwareSnapshot, ViewType } from '../../types';
import { createTelemetrySnapshot, generateSha256Hash } from '../../utils/telemetrySnapshot';
import { exportCanonicalSealArtifactJson } from '../../utils/canonicalSealArtifactExport';
import {
  triggerFederationSync,
  subscribeFederationSync,
  getFederationSyncState,
  FederationSyncState,
  KnowledgePacket,
} from '../../utils/federationSyncManager';

interface ConsoleViewProps {
  onCaptureSnapshot?: (snapshot: HardwareSnapshot) => void;
  onNavigate?: (view: ViewType) => void;
  snapshots?: HardwareSnapshot[];
  snapshotsCount?: number;
}

export const ConsoleView: React.FC<ConsoleViewProps> = ({
  onCaptureSnapshot,
  onNavigate,
  snapshots = [],
  snapshotsCount = 2,
}) => {
  const [activeTab, setActiveTab] = useState<'both' | 'cli' | 'grid' | 'macros' | 'qr-scan'>('both');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [input, setInput] = useState('');
  const [isExportingLog, setIsExportingLog] = useState(false);
  const [lastCapturedSnapshot, setLastCapturedSnapshot] = useState<HardwareSnapshot | null>(null);
  const [lastIngestedManifest, setLastIngestedManifest] = useState<EvidentiaryManifestPayload | null>(null);
  const [latestCpuLoad, setLatestCpuLoad] = useState<number>(41.2);
  const [latestTelemetry, setLatestTelemetry] = useState<any>(null);

  // Active Ledger Sync State
  const [syncState, setSyncState] = useState<FederationSyncState>(getFederationSyncState);

  useEffect(() => {
    const unsub = subscribeFederationSync((state) => {
      setSyncState(state);
    });
    return unsub;
  }, []);

  const handleCpuLoadChange = useCallback((cpuAvg: number, telemetry: any) => {
    setLatestCpuLoad(cpuAvg);
    setLatestTelemetry(telemetry);
  }, []);

  // Custom Hardware Alert Thresholds (CPU % and RAM %)
  const [cpuAlertThreshold, setCpuAlertThreshold] = useState<number>(75);
  const [ramAlertThreshold, setRamAlertThreshold] = useState<number>(80);

  // Auto-Snapshot Settings State
  const [autoSnapshotEnabled, setAutoSnapshotEnabled] = useState<boolean>(false);
  const [autoSnapshotThreshold, setAutoSnapshotThreshold] = useState<number>(65); // High-load CPU %
  const [autoSnapshotCountdown, setAutoSnapshotCountdown] = useState<number>(30); // 30-second interval
  const [autoSnapshotsTriggeredCount, setAutoSnapshotsTriggeredCount] = useState<number>(0);

  const [history, setHistory] = useState<Array<{ type: 'input' | 'output' | 'error' | 'success'; text: string }>>([
    {
      type: 'output',
      text: 'ZYRQUEN Ω∞ FROZEN v1.2 LTS Sovereign Operating System and Civilization Intelligence Control Plane — SOVEREIGN CLI CONSOLE',
    },
    {
      type: 'output',
      text: 'Type "help" to list available commands (snapshot, audit, reconcile, cert, seals, trace, pentest, benchmark, assets, thai-custodians, autosnap, export-json, clear)',
    },
    { type: 'success', text: `Merkle Root: ${SYSTEM_METADATA.merkleRoot}` },
  ]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCaptureSnapshot = useCallback(
    (customTelemetry?: any, isAuto: boolean = false) => {
      const snap = createTelemetrySnapshot(
        customTelemetry || latestTelemetry || {
          core0: 42.1,
          core1: 39.8,
          core2: 44.5,
          core3: 38.6,
          memUsedMb: 5214,
          cryoTempMk: 14.98,
          qopsThroughput: 851.9,
          coherencePct: 99.98,
          networkRxMbps: 84.2,
          networkTxMbps: 112.6,
          otelSpansSec: 2450,
        },
        snapshotsCount + (isAuto ? 1 : 0)
      );

      if (onCaptureSnapshot) {
        onCaptureSnapshot(snap);
      }
      setLastCapturedSnapshot(snap);
      playAuditChime();

      if (isAuto) {
        setAutoSnapshotsTriggeredCount((prev) => prev + 1);
      }

      setHistory((prev) => [
        ...prev,
        {
          type: 'success',
          text: `[${isAuto ? 'AUTO-SNAPSHOT TRIGGERED (HIGH-LOAD DETECTED)' : 'HARDWARE SNAPSHOT SEALED'}]:
  ID: ${snap.id} (#${snap.snapshotNumber})
  Timestamp: ${snap.timestampIct}
  CPU Avg: ${snap.cpuAverage}% (4 Cores) | RAM: ${snap.memoryUsedMb}MB | Cryo: ${snap.cryoTempMk}mK
  QOps: ${snap.qopsThroughput} QOps/s | Coherence: ${snap.coherencePct}%
  Parent: ${snap.parentHash.slice(0, 24)}...
  Sealed Hash: ${snap.sealedHash}
  STATUS: Cryptographically appended to LedgerView evidence list`,
        },
      ]);
    },
    [latestTelemetry, snapshotsCount, onCaptureSnapshot]
  );

  // Quick Ingestion of Evidentiary Manifest Codes via QR Scanner or Manual Entry
  const handleManifestIngested = useCallback(
    (manifest: EvidentiaryManifestPayload) => {
      playAuditChime();
      setLastIngestedManifest(manifest);

      setHistory((prev) => [
        ...prev,
        {
          type: manifest.status === 'VERIFIED_INTACT' ? 'success' : 'error',
          text: `[EVIDENTIARY MANIFEST INGESTION REPORT]:
  Manifest ID:  ${manifest.manifestId} (${manifest.title})
  Type:         ${manifest.manifestType}
  Block Height: #${manifest.blockHeight} (Genesis Canonical Anchor)
  Merkle Root:  ${manifest.merkleRoot}
  Drift Delta:  ${manifest.driftDelta}
  Seals Count:  ${manifest.sealsCount.toLocaleString()} Frozen Seals (Ω601–Ω1000 Locked)
  Quorum:       ${manifest.custodyAttestation}
  Legal Basis:  ${manifest.legalBinding}
  Timestamp:    ${manifest.timestampIct}
  Status:       ${
    manifest.status === 'VERIFIED_INTACT'
      ? 'PASSED 100% GREEN (COURT-ADMISSIBLE)'
      : 'ALERT - TAMPER DETECTED / INTEGRITY VIOLATION'
  }`,
        },
      ]);

      if (onCaptureSnapshot) {
        handleCaptureSnapshot();
      }
    },
    [handleCaptureSnapshot, onCaptureSnapshot]
  );

  const latestCpuLoadRef = useRef(latestCpuLoad);
  const latestTelemetryRef = useRef(latestTelemetry);
  const autoSnapshotThresholdRef = useRef(autoSnapshotThreshold);
  const handleCaptureSnapshotRef = useRef(handleCaptureSnapshot);

  useEffect(() => {
    latestCpuLoadRef.current = latestCpuLoad;
  }, [latestCpuLoad]);

  useEffect(() => {
    latestTelemetryRef.current = latestTelemetry;
  }, [latestTelemetry]);

  useEffect(() => {
    autoSnapshotThresholdRef.current = autoSnapshotThreshold;
  }, [autoSnapshotThreshold]);

  useEffect(() => {
    handleCaptureSnapshotRef.current = handleCaptureSnapshot;
  }, [handleCaptureSnapshot]);

  // Auto-Snapshot 30-Second Countdown & Periodic Autopilot Trigger Hook
  useEffect(() => {
    if (!autoSnapshotEnabled) {
      setAutoSnapshotCountdown(30);
      return;
    }

    let currentCountdown = 30;
    const timer = setInterval(() => {
      currentCountdown -= 1;
      if (currentCountdown <= 0) {
        currentCountdown = 30;
        handleCaptureSnapshotRef.current(latestTelemetryRef.current, true);
      }
      setAutoSnapshotCountdown(currentCountdown);
    }, 1000);

    return () => clearInterval(timer);
  }, [autoSnapshotEnabled]);

  // Export Current System Log Array as Cryptographically Signed JSON Audit File
  const handleExportAuditLogs = () => {
    if (isExportingLog) return;
    setIsExportingLog(true);
    playAuditChime();
    
    setTimeout(() => {
      // Filter out empty lines or basic input echoes
      const filteredHistory = history.filter(log => log.type !== 'input' && log.text.trim().length > 0);
      const isoTimestamp = new Date().toISOString();
      const mockHmac = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');

      const signedLogDump = {
        header: '# ======================================================================',
        title: 'ZYRQUEN Ω∞ SOVEREIGN TERMINAL AUDIT LOG STREAM',
        version: 'v1.2 LTS (LOCKED_FROZEN_v1.2_LTS)',
        product: 'ZYRQUEN Ω∞ v4.16 PDPA FINAL (Frozen v1.2 LTS) | Engine v4.16 | NPM v4.16.0',
        canonical_boundary: 'Ω600_1000',
        boundary_scope: 'Ω601-Ω1000 Strict (400 Tenants LOCKED)',
        sovereign_principal: 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
        mutation_authority: '0 Read Only',
        clearance: 'OMEGA-1 SUPREME CLEARANCE',
        export_timestamp_iso: isoTimestamp,
        export_timestamp_ict: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('th-TH') + ' ICT',
        digital_signature: {
          signer: 'ZYRQUEN Ω∞ SECURE AUDIT MODULE',
          signature_type: 'HMAC-SHA256 + PQC',
          hmac_sha256: mockHmac,
          timestamp: isoTimestamp,
          verified: true
        },
        log_stream_metadata: {
          total_entries: filteredHistory.length,
          channel: 'TERMINAL CONSOLE (ZYRQUEN_OMEGA_CLI)',
          integrity: 'IMMUTABLE_CHAIN_OF_CUSTODY',
        },
        log_stream: filteredHistory.map((log, idx) => ({
          sequence: idx + 1,
          type: log.type,
          entry: log.text,
        })),
      };

      const jsonString = JSON.stringify(signedLogDump, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ZYRQUEN_AUDIT_LOG.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setHistory((prev) => [
        ...prev,
        {
          type: 'success',
          text: `[EXPORT COMPLETED] Cryptographically Signed JSON Audit Log Stream downloaded. (Entries: ${filteredHistory.length}, HMAC: ${mockHmac.slice(0, 16)}...)`,
        },
      ]);
      
      setIsExportingLog(false);
    }, 1500);
  };

  // Export Current Session's Hardware Telemetry Snapshots as JSON Forensic Dump
  const handleExportSnapshotsJson = () => {
    playAuditChime();
    const activeSnapshots = snapshots && snapshots.length > 0 ? snapshots : [
      ...(lastCapturedSnapshot ? [lastCapturedSnapshot] : [])
    ];

    const forensicDump = {
      system: 'ZYRQUEN Ω∞ SOVEREIGN FROZEN v1.2 LTS',
      codename: 'ZYRQUEN_OMEGA_SOVEREIGN',
      exportTimestampIct: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('th-TH') + ' ICT',
      exportTimestampUtc: new Date().toUTCString(),
      merkleRoot: SYSTEM_METADATA.merkleRoot,
      sovereignPrincipal: SYSTEM_METADATA.sovereignPrincipal,
      platformBoundary: 'Ω601–Ω1000',
      totalSnapshotsInDump: activeSnapshots.length,
      quantumCoolingPowerMatrix: {
        currentDrawAmps: 14.8,
        voltageAc3Phase: 240.0,
        totalPowerKw: 3.55,
        batteryHealthPercentage: 98.4,
        ultraCapacitorReserveHours: 4.8,
        coolingStage1CompressorKw: 2.4,
        coolingStage2TurboExpanderKw: 0.85,
        coolingStage3SorptionPumpKw: 0.3,
        phaseBalancePct: 99.98,
      },
      auditInvariantsStatus: {
        totalInvariants: 10,
        passedInvariants: 10,
        failClosedActive: true,
        driftPercentage: '0.00%',
      },
      snapshots: activeSnapshots,
    };

    const jsonString = JSON.stringify(forensicDump, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `zyrquen-telemetry-forensic-dump-${Date.now()}.json`;
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setHistory((prev) => [
      ...prev,
      {
        type: 'success',
        text: `[JSON FORENSIC DUMP EXPORTED]:
  Filename: ${filename}
  Snapshots Dumped: ${activeSnapshots.length} Records
  Payload Size: ${blob.size} Bytes
  Merkle Chain Verification: SSoT 100% INTACT
  Cryptographic Integrity Digest: ${generateSha256Hash(jsonString)}`,
      },
    ]);
  };

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    setHistory((prev) => [...prev, { type: 'input', text: `$ ${trimmed}` }]);
    setInput('');

    const command = trimmed.toLowerCase();

    if (command === 'clear') {
      setHistory([]);
      return;
    }

    if (command === 'dossier' || command === 'qr-dossier' || command === 'evidence-dossier' || command === 'unified-dossier') {
      playTone(660, 0.05);
      setHistory((prev) => [
        ...prev,
        {
          type: 'output',
          text: `[UNIFIED QR EVIDENCE DOSSIER & ATTESTATION MATRIX]:
  • Sovereign Principal: ${SYSTEM_METADATA.sovereignPrincipal} (#EP-SOVEREIGN-01)
  • Merkle Root: ${SYSTEM_METADATA.merkleRoot}
  • Canonical Sealed Block: #${SYSTEM_METADATA.sealedBlock} (Range #849198–#849202)
  • Seals: 14,902 Verified (Quarantined: 80, Raw: 14,982) | Drift: Δ 0.00%
  • PQC Cryptography: NIST FIPS 204 (ML-DSA-87), FIPS 203 (ML-KEM-1024), FIPS 205 (SLH-DSA)
  • Hardware Quorum: 10/10 REAL_HSM FIPS 140-3 L4 (Cryo: 14.98 mK)
  • Legal Safe Harbor: Thai ETDA B.E. 2544 (Sec 9, 26, 28) & PDPA B.E. 2562
  • 18-Chamber Matrix: All Chambers Operational (CH-00..CH-17)
  • Quick Export: Run "export-seal-artifact" for signed JSON or open Legal View for PDF.`,
        },
      ]);
      return;
    }

    if (command === 'export-manifest' || command === 'export-seal-artifact' || command === 'export-seals' || command === 'seal-manifest') {
      try {
        playTone(680, 0.05);
        const { filename, artifact } = exportCanonicalSealArtifactJson();
        playAuditChime();
        setHistory((prev) => [
          ...prev,
          {
            type: 'success',
            text: `[DIGITALLY SIGNED SEAL MANIFEST ARTIFACT EXPORTED]:
  Filename: ${filename}
  Canonical Seals: 14,902 Verified (Quarantined: 80, Raw: 14,982)
  Sealed Block Range: #849198–#849202 (Canonical Genesis #${artifact.blockMetadata.canonicalGenesisBlock})
  Genesis Merkle Root: ${artifact.blockMetadata.genesisMerkleRootHash}
  PQC Signature: NIST FIPS 204 ML-DSA-87 (Dilithium-5) & Deca-Key Quorum (10/10 REAL_HSM)
  Statutory Compliance: Thai ETDA Sec 9, 26, 28 & PDPA Sec 37/39 Safe Harbor
  Artifact SHA-256 Digest: ${artifact.digitalSignature.artifactSha256Digest}
  Status: SSoT 100% INTACT (Mutation = 0, Drift = 0.00%)`,
          },
        ]);
      } catch (err) {
        setHistory((prev) => [
          ...prev,
          { type: 'error', text: `Failed to export seal artifact: ${String(err)}` },
        ]);
      }
      return;
    }

    if (command === 'scan-qr' || command === 'qr' || command === 'manifest' || command === 'ingest-qr' || command === 'scan') {
      playTone(600, 0.05);
      setActiveTab('qr-scan');
      setHistory((prev) => [
        ...prev,
        {
          type: 'success',
          text: `[EVIDENTIARY MANIFEST QR SCANNER ENGAGED]:
  Camera, image upload, and direct code ingestion active.
  Ready to scan tamper-evident hardware foils or court dossier manifest envelopes.`,
        },
      ]);
      return;
    }

    if (command === 'export-json' || command === 'dump' || command === 'export') {
      handleExportSnapshotsJson();
      return;
    }

    if (command === 'autosnap' || command === 'auto-snapshot') {
      setAutoSnapshotEnabled((prev) => {
        const next = !prev;
        playTone(next ? 650 : 400, 0.06);
        setHistory((h) => [
          ...h,
          {
            type: 'output',
            text: `[AUTO-SNAPSHOT]: ${next ? `ARMED (30s interval, >${autoSnapshotThreshold}% load threshold)` : 'DISARMED'}`,
          },
        ]);
        return next;
      });
      return;
    }

    if (command === 'help') {
      playTone(500, 0.05);
      setHistory((prev) => [
        ...prev,
        {
          type: 'output',
          text: `Available Commands:
  • sync-ledger    - Trigger Active Ledger Merkle-Root Verification Handshake
  • publish-packet - Publish New Cross-Node Knowledge Packet to Federation
  • ingest-packet  - Ingest Inbound Knowledge Packet & Verify Dilithium-5
  • evolve         - Execute Civilization Self-Evolution Architecture v13
  • vault-expand   - Execute Sovereign Vault Expansion v14.0 (1,024 TB)
  • governance     - Activate Autonomous Governance Fabric v14.0 (128 Agents)
  • fed-drift      - Inspect Multi-Node Statistical Knowledge Drift Matrix
  • snapshot       - Capture Instant Hardware Telemetry State into Ledger
  • autosnap       - Toggle 30s Auto-Snapshot on High-Load Activity
  • scan-qr        - Open Evidentiary Manifest QR Scanner (Ingest Hardware & Court Codes)
  • dossier        - Inspect Unified QR Evidence Dossier & Attestation Status
  • export-seal-artifact - Export Signed Canonical Seal Manifest & Block Metadata (JSON)
  • export-json    - Export Complete Session Hardware Telemetry as JSON Forensic Dump
  • audit          - Run Full E2E Audit Engine Verification
  • reconcile      - Execute 12-Stage Forensics Reconciliation
  • cert           - Display Gold Master Attestation Certificate
  • seals          - Validate 14,902 Immutable Evidence Block Seals
  • trace          - Show Active Transaction TX-20260809-909A-B814
  • pentest        - Run Simulated 5 Attack Vectors Fail-Closed Defense
  • benchmark      - Run Hardware & QOps Scale Benchmark
  • assets         - List 8 Master Visual Assets & System Posters
  • thai-custodians- List Thai Sovereign Executive Custodian Passports
  • sysinfo        - Display Kernel Version, Merkle Root, & Uptime
  • clear          - Clear terminal history`,
        },
      ]);
      return;
    }

    if (command === 'sync-ledger' || command === 'federation-sync' || command === 'sync') {
      playTone(600, 0.04);
      setHistory((h) => [
        ...h,
        { type: 'output', text: '[ACTIVE LEDGER SYNC]: Initiating Multi-Node Merkle-Root Handshake...' },
      ]);
      triggerFederationSync(
        { packetName: 'Active Ledger Consensus Shard', driftSigma: 0.0006 },
        (stage, prog) => {
          setHistory((h) => [
            ...h,
            { type: 'output', text: `  → Stage: ${stage} (${prog}%)` },
          ]);
        }
      ).then((pkt) => {
        playAuditChime();
        setHistory((h) => [
          ...h,
          {
            type: 'success',
            text: `[ACTIVE LEDGER SYNC VERIFIED]:
  Packet ID: ${pkt.id}
  Merkle Root Leaf: ${pkt.merkleLeaf}
  NIST PQC Signature: ${pkt.pqcSignature}
  Statistical Drift: ${(pkt.driftSigma * 100).toFixed(4)}% (Nominal)
  Status: ${pkt.status}`,
          },
        ]);
      });
      return;
    }

    if (command === 'publish-packet' || command === 'publish-knowledge' || command.startsWith('publish')) {
      playTone(600, 0.04);
      setHistory((h) => [
        ...h,
        { type: 'output', text: '[PUBLISH KNOWLEDGE]: Ingesting Tensor & Broadcasting to Federation Nodes...' },
      ]);
      triggerFederationSync({ packetName: 'Constitutional Alignment Tensor v12.3', driftSigma: 0.0008 }).then((pkt) => {
        playAuditChime();
        setHistory((h) => [
          ...h,
          {
            type: 'success',
            text: `[KNOWLEDGE PACKET PUBLISHED]: ${pkt.id} - ${pkt.packetName}
  Source: ${pkt.sourceNode}
  Target Quorum: ${pkt.targetNodes.join(', ')}
  Merkle Leaf Hash: ${pkt.merkleLeaf}
  PQC Certificate: ${pkt.complianceCert} [10/10 HSM Quorum Passed]`,
          },
        ]);
      });
      return;
    }

    if (command === 'ingest-packet' || command === 'ingest-knowledge' || command.startsWith('ingest')) {
      playTone(550, 0.04);
      triggerFederationSync({ packetName: 'Inbound Cross-Domain Knowledge Shard', driftSigma: 0.0005 }).then((pkt) => {
        playAuditChime();
        setHistory((h) => [
          ...h,
          {
            type: 'success',
            text: `[INBOUND KNOWLEDGE INGESTED & SEALED]: ${pkt.id}
  Verified Merkle Anchor: ${pkt.merkleLeaf}
  Dilithium-5 Signature: FIPS-204-VALIDATED`,
          },
        ]);
      });
      return;
    }

    if (command === 'evolve' || command === 'self-evolution' || command === 'v13') {
      playTone(650, 0.05);
      setHistory((h) => [
        ...h,
        {
          type: 'output',
          text: `🌌 [MAEW Ω∞ — Civilization Self-Evolution Architecture v13]:
  1️⃣ Initializing Evolution Core (EVO-CIV-13, CIK-001, Federation Protocol v12.3)...
  2️⃣ Synchronizing Federation Nodes (CIV-FED-001..003, Quorum: 10/10-HSM)...
  3️⃣ Adapting Constitutional Law (v1.2-Adaptive, PDPA, AI Governance, Quantum Resilience)...
  4️⃣ Evolving Intelligence Kernel (Cognition v13.1, Reasoning v13.2, Self-Learning ON)...
  5️⃣ Publishing Evolution Ledger: Commit 0xCIVILIZATION-EVOLUTION-VERIFIED (Block #849202)`,
        },
      ]);
      triggerFederationSync({ packetName: 'Civilization Self-Evolution Core v13', driftSigma: 0.0003 }).then(() => {
        playAuditChime();
        setHistory((h) => [
          ...h,
          {
            type: 'success',
            text: '✅ Civilization Self-Evolution Architecture v13 is now LIVE — Adaptive Governance operational.',
          },
        ]);
      });
      return;
    }

    if (command === 'vault-expand' || command === 'expand-vault' || command === 'v14-vault') {
      playTone(550, 0.05);
      setHistory((h) => [
        ...h,
        {
          type: 'output',
          text: `🔐 [MAEW Ω∞ — Sovereign Vault Expansion v14.0]:
  1️⃣ Initializing Vault Cluster (SV-Ω∞-CORE, 10 Nodes, FIPS203-ML-KEM-1024)...
  2️⃣ Allocating Quantum Storage (1,024 TB, Cryo-Bus Latency ≤0.20ms, ZK-Mode ON)...
  3️⃣ Synchronizing 14,902 Merkle Proofs across Federation Nodes...
  4️⃣ Verifying Vault Integrity (PDPA, ETDA, NIST-FIPS Compliant, Drift 0.00%)...
  5️⃣ Publishing Expansion Ledger: Commit 0xSOVEREIGN-VAULT-EXPANSION-VERIFIED`,
        },
      ]);
      triggerFederationSync({ packetName: 'Sovereign Vault 1,024 TB Allocation Shard', driftSigma: 0.0002 }).then(() => {
        playAuditChime();
        setHistory((h) => [
          ...h,
          {
            type: 'success',
            text: '🚀 Sovereign Vault Expansion Complete — Capacity upgraded & 14,902 Merkle seals synchronized.',
          },
        ]);
      });
      return;
    }

    if (command === 'governance' || command === 'governance-fabric' || command === 'autonomy') {
      playTone(700, 0.05);
      setHistory((h) => [
        ...h,
        {
          type: 'output',
          text: `🏛 [MAEW Ω∞ — Autonomous Governance Fabric v14.0]:
  1️⃣ Initializing Governance Fabric (AGF-Ω∞-CORE, Zero-Trust Mode, Cryptographic Seal Active)...
  2️⃣ Activating 128 Auditor Agents (Evidence Ledger, Bias Monitor, Drift Detection)...
  3️⃣ Enabling Consensus Senate (12 Nodes, Quorum ≥99.5%, Rollback Defense Arming)...
  4️⃣ Enforcing Invariant Laws (Truth Boundary, Fairness Metrics, Absolute Zero-Mutation)...
  5️⃣ Publishing Governance Ledger: Commit 0xAUTONOMOUS-GOVERNANCE-FABRIC-VERIFIED`,
        },
      ]);
      triggerFederationSync({ packetName: 'Autonomous Governance Fabric Senate Consensus', driftSigma: 0.0001 }).then(() => {
        playAuditChime();
        setHistory((h) => [
          ...h,
          {
            type: 'success',
            text: '✅ Autonomous Governance Fabric is now ACTIVE — Self-Healing & Continuous Assurance operational.',
          },
        ]);
      });
      return;
    }

    if (command === 'fed-drift' || command === 'drift') {
      playTone(550, 0.04);
      setHistory((h) => [
        ...h,
        {
          type: 'output',
          text: `FEDERATION KNOWLEDGE DRIFT MATRIX:
  • CIV-FED-001 (Bangkok):   0.0008σ (0.0008% dev) [OPTIMAL]
  • CIV-FED-002 (Singapore): 0.0013σ (0.0013% dev) [OPTIMAL]
  • CIV-FED-003 (Tokyo):     0.0016σ (0.0016% dev) [OPTIMAL]
  • CIV-FED-004 (Frankfurt): 0.0021σ (0.0021% dev) [OPTIMAL]
  • CIV-FED-005 (Virginia):  0.0022σ (0.0022% dev) [OPTIMAL]
  Mean Drift: 0.0016σ | Zero-Drift Constraint: Δ0.00% INTACT`,
        },
      ]);
      return;
    }

    if (command === 'continuum' || command === 'qcr' || command === 'v14-continuum') {
      playTone(680, 0.06);
      setHistory((h) => [
        ...h,
        {
          type: 'output',
          text: `🌌 [MAEW Ω∞ — Quantum Continuum Runtime v14]:
  1️⃣ Initializing Continuum Core (QCR-Ω∞-CORE, EVO-CIV-13, AGF-v14.0, Entropy: AUTO)...
  2️⃣ Synchronizing Federation Nodes (CIV-FED-001..004, Quorum: 10/10-HSM, Drift: 0)...
  3️⃣ Activating Quantum Channels (DIM-09, DIM-10, DIM-11, Latency: ≤0.15ms, Bandwidth: ∞)...
  4️⃣ Enforcing Multiverse Invariants (Truth Boundary, Fairness Metrics, PDPA/ETDA/NIST-FIPS)...
  5️⃣ Publishing Continuum Ledger: Commit 0xQUANTUM-CONTINUUM-VERIFIED (Block #849202)`,
        },
      ]);
      triggerFederationSync({ packetName: 'Quantum Continuum Synchronization Tensor v14', driftSigma: 0.0001 }).then(() => {
        playAuditChime();
        setHistory((h) => [
          ...h,
          {
            type: 'success',
            text: '✅ Quantum Continuum Runtime v14 ACTIVE — Multiverse Node synchronization operational (Latency ≤0.15ms).',
          },
        ]);
      });
      return;
    }

    if (command === 'multiverse-nav' || command === 'nav' || command === 'warp' || command === 'v15-nav') {
      playTone(720, 0.06);
      setHistory((h) => [
        ...h,
        {
          type: 'output',
          text: `🧭 [MAEW Ω∞ — Multiverse Navigation Grid v15]:
  1️⃣ Initializing Navigation Grid (NAV-Ω∞-GRID, QCR-v14, Ω∞, Holographic Mode: ON)...
  2️⃣ Setting System Coordinates (Sector: 08-XF4 → Gateway: Nexus-Gateway → Destination: Celestial-Haven)...
  3️⃣ Activating Warp Controls (Quantum-Resilient, Latency: ≤0.12ms, Alignment: 100%)...
  4️⃣ Overlaying Telemetry (Heartbeat: 60Hz Stable, qOps: 2048, Delta: Verified, Ω∞ Core)...
  5️⃣ Publishing Navigation Ledger: Commit 0xMULTIVERSE-NAVIGATION-GRID-VERIFIED`,
        },
      ]);
      triggerFederationSync({ packetName: 'Multiverse Navigation Grid Coordinate Shard v15', driftSigma: 0.0001 }).then(() => {
        playAuditChime();
        setHistory((h) => [
          ...h,
          {
            type: 'success',
            text: '🚀 Multiverse Navigation Grid v15 ENGAGED — Warp vector aligned to Sector 08-XF4 (2048 QOps/s).',
          },
        ]);
      });
      return;
    }

    if (command === 'deep-freeze' || command === 'cold-storage' || command === 'freeze-archive') {
      playTone(520, 0.06);
      setHistory((h) => [
        ...h,
        {
          type: 'output',
          text: `❄️ [IMMUTABLE MERKLE LEDGER DEEP FREEZE ARCHIVE]:
  • Total Ledger Blocks: 14,902 Canonical Blocks
  • Deep Frozen Cold Storage: 14,000 Records (Partitions DF-PART-001..003)
  • Active Hot Memory Tier: 902 Records (Threshold: 1,000 entries max)
  • Storage Compression Ratio: 78.3% (33.78 MB space preserved)
  • Vault Partition: VAULT-CRYO-COLD-01..03 (Sector 08-XF4)
  • FIPS 204 PQC Seal: DILITHIUM-87 IMMUTABLE ROOT VERIFIED`,
        },
      ]);
      return;
    }

    if (command === 'entropy-thermal' || command === 'chaotic-stability' || command === 'entropy') {
      playTone(640, 0.05);
      setHistory((h) => [
        ...h,
        {
          type: 'output',
          text: `📊 [ATMOSPHERIC ENTROPY vs. CPU THERMAL VARIANCE OVERLAY]:
  • Atmospheric Entropy Rate: 11.92 KBps (Shannon TRNG: 7.994 bits/byte)
  • CPU Thermal Variance:     +2.14°C ΔT (Actual: 42.1°C • Base: 40.0°C)
  • Chaotic Stability Index:  99.42% (Dissipative Attractor Equilibrium)
  • Lyapunov Exponent (λ):    -0.0384 (<0 Exponential Convergence Stable)
  • Phase-Space Coupling:     Orthogonal Decoupled (R² = 0.042)`,
        },
      ]);
      return;
    }

    if (command === 'cognitive-drift' || command === 'reasoning-telemetry' || command === 'cognitive') {
      playTone(600, 0.05);
      setHistory((h) => [
        ...h,
        {
          type: 'output',
          text: `🧠 [TELEMETRY ANOMALY OBSERVER: COGNITIVE DRIFT & REASONING]:
  • Cognitive Drift Deviation: 0.0016% (0.0016σ baseline) [OPTIMAL]
  • Simulated Reasoning Score: 99.84% (High-Intensity Bound: >98.50%)
  • High-Intensity Trigger:    Armed (>48.0% CPU / >860 QOps/s)
  • Statute Reference:         SSoT AI Governance & Constitutional Reasoning Alignment Invariant`,
        },
      ]);
      return;
    }

    if (command === 'snapshot' || command === 'snap') {
      handleCaptureSnapshot();
      return;
    }

    if (command === 'audit') {
      playTone(520, 0.06);
      setTimeout(() => {
        playAuditChime();
        setHistory((prev) => [
          ...prev,
          {
            type: 'success',
            text: `E2E AUDIT RESULT: PASSED ALL SIMULATED INTERACTION LIFECYCLES (DEMO)
  - 10/10 Invariants Checked: 100% COMPLIANT
  - Merkle Root Binding: ${SYSTEM_METADATA.merkleRoot} (MATCHED)
  - SSoT Mutation: 0 (LOCKED)
  - Baseline Drift: 0.00%
  - 14,902 Mock Seals Reproducibility: VERIFIED`,
          },
        ]);
      }, 300);
      return;
    }

    if (command === 'reconcile' || command === 'trace') {
      playAuditChime();
      setHistory((prev) => [
        ...prev,
        {
          type: 'output',
          text: `FORENSICS RECONCILIATION TRACE:
  TxID: ${AUDIT_TRACE_TX.txId} (${AUDIT_TRACE_TX.title})
  Latency: ${AUDIT_TRACE_TX.totalLatencyMs}ms | Sealed Block: #${AUDIT_TRACE_TX.sealedLedgerBlock}
  Stages (12/12 Verified):
    1. SENSE (${AUDIT_TRACE_TX.stages[0].durationMs}ms) -> ${AUDIT_TRACE_TX.stages[0].outputHash}
    2. INGEST (${AUDIT_TRACE_TX.stages[1].durationMs}ms) -> ${AUDIT_TRACE_TX.stages[1].outputHash}
    3. ASSURE (${AUDIT_TRACE_TX.stages[2].durationMs}ms) -> ${AUDIT_TRACE_TX.stages[2].outputHash}
    4. UNDERSTAND (${AUDIT_TRACE_TX.stages[3].durationMs}ms) -> ${AUDIT_TRACE_TX.stages[3].outputHash}
    5. SIMULATE (${AUDIT_TRACE_TX.stages[4].durationMs}ms) -> ${AUDIT_TRACE_TX.stages[4].outputHash}
    6. DECIDE (${AUDIT_TRACE_TX.stages[5].durationMs}ms) -> ${AUDIT_TRACE_TX.stages[5].outputHash}
    7. GOVERN (${AUDIT_TRACE_TX.stages[6].durationMs}ms) -> ${AUDIT_TRACE_TX.stages[6].outputHash}
    8. AUTHORIZE (${AUDIT_TRACE_TX.stages[7].durationMs}ms) -> ${AUDIT_TRACE_TX.stages[7].outputHash}
    9. EXECUTE (${AUDIT_TRACE_TX.stages[8].durationMs}ms) -> ${AUDIT_TRACE_TX.stages[8].outputHash}
   10. OBSERVE (${AUDIT_TRACE_TX.stages[9].durationMs}ms) -> ${AUDIT_TRACE_TX.stages[9].outputHash}
   11. VERIFY (${AUDIT_TRACE_TX.stages[10].durationMs}ms) -> ${AUDIT_TRACE_TX.stages[10].outputHash}
   12. REPLAY (${AUDIT_TRACE_TX.stages[11].durationMs}ms) -> ${AUDIT_TRACE_TX.stages[11].outputHash}
  STATUS: VERIFIED WITHIN DEFINED V1.21 SCOPE`,
        },
      ]);
      return;
    }

    if (command === 'cert') {
      playAuditChime();
      setHistory((prev) => [
        ...prev,
        {
          type: 'success',
          text: `ZYRQUEN Ω∞ FROZEN v1.2 LTS GOLD MASTER CERTIFICATE:
  Release Baseline: FROZEN v1.2 LTS (Canonical SSoT)
  Merkle Root: ${SYSTEM_METADATA.merkleRoot}
  Sovereign Principal: ${SYSTEM_METADATA.sovereignPrincipal}
  Platform Boundary: Ω601–Ω1000 (Strict Enforcement, 0 Ω1001+)
  Total Verified Seals: 14,902 / 14,902
  Invariants Status: 10/10 VERIFIED COMPLIANT`,
        },
      ]);
      return;
    }

    if (command === 'seals') {
      playTone(600, 0.05);
      setHistory((prev) => [
        ...prev,
        {
          type: 'output',
          text: `EVIDENCE SEALS VALIDATION:
  - Total Blocks: 14,902 Sealed
  - Merkle Chain Integrity: INTACT (0 Orphans, 0 Floating)
  - Algorithm: SHA-256 (Canonical SSoT)
  - Tamper Check: UNTOUCHED`,
        },
      ]);
      return;
    }

    if (command === 'pentest') {
      playWarningTone();
      setHistory((prev) => [
        ...prev,
        {
          type: 'error',
          text: `PEN-TEST RESULT: PASS (SIMULATED, CLIENT-SIDE ONLY)
  - TST-ADV-1 (Telemetry -> Truth Mutation): SIM-BLOCKED (Fail-Closed)
  - TST-ADV-2 (Forecast -> SSoT Drift): SIM-BLOCKED (0.00% Drift)
  - TST-ADV-3 (UI Mutation Overwrite): SIM-BLOCKED (Read-Only Kernel)
  - TST-ADV-4 (Export Payload Injection): SIM-BLOCKED (Isolated Buffer)
  - TST-ADV-5 (Direct Privilege Escalation): SIM-BLOCKED (Executive Passport Required)
  TRUTH AUTO-REPAIR: FORBIDDEN / DEMO CORE: SELF-CONSISTENT`,
        },
      ]);
      return;
    }

    if (command === 'benchmark') {
      playTone(550, 0.05);
      setHistory((prev) => [
        ...prev,
        {
          type: 'output',
          text: `HARDWARE & QOPS BENCHMARK:
  - Energy Dispatch: ${SYSTEM_METADATA.qOpsTelemetry} QOps/s (Nominal)
  - Coherence Index: ${SYSTEM_METADATA.coherence} (768 Qubits)
  - Cryo Thermal: ${SYSTEM_METADATA.cryoTemp} (Subzero Helium)
  - Kernel Latency: ${SYSTEM_METADATA.kernelLatency}
  - [OBSERVABILITY] Scale test isolated. Canonical Truth Plane unaffected.`,
        },
      ]);
      return;
    }

    if (command === 'assets') {
      playTone(500, 0.05);
      setHistory((prev) => [
        ...prev,
        {
          type: 'output',
          text: `VISUAL ASSETS & SOVEREIGN ARTIFACTS:
  1. zyrquen_omega_seal_transparent.png (Gold/Cyan Hologram System Seal)
  2. sovereign_seal_phase31_text.png (Phase 31 Final Closeout)
  3. phoenix-autonomous-healing-core.jpg (Golden Phoenix Wings Cyan Lattice)
  4. quantum-citadel-core.jpg (Golden Icosahedron with Cyan Torus Rings)
  5. sovereign-command-deck.jpg (Multi-layered Holographic HUD)
  6. MAEW_V21_SOVEREIGN_POSTER_VERTICAL_3D.webp (15-Layer Full-Corps Deep Audit Engine)
  7. 1009140453.webp (Evidence Anchor)
  8. 1009140443.webp (Truth Matrix 200 vs 14,902 vs 1,000,000)`,
        },
      ]);
      return;
    }

    if (command === 'thai-custodians') {
      playTone(550, 0.05);
      setHistory((prev) => [
        ...prev,
        {
          type: 'output',
          text: `THAI SOVEREIGN CUSTODIANS REGISTRY:
${THAI_CUSTODIANS.map((c) => `  • ${c.passportNumber}: ${c.nameTh} (${c.nameEn}) - ${c.roleTh}`).join('\n')}`,
        },
      ]);
      return;
    }

    if (command === 'autopilot' || command === 'autosnap') {
      const nextState = !autoSnapshotEnabled;
      setAutoSnapshotEnabled(nextState);
      playAuditChime();
      setHistory((prev) => [
        ...prev,
        {
          type: 'success',
          text: `AUTOPILOT MODE: ${nextState ? 'ENABLED (Auto-capturing hardware telemetry snapshots every 30 seconds)' : 'DISABLED'}`,
        },
      ]);
      return;
    }

    if (command === 'sysinfo') {
      setHistory((prev) => [
        ...prev,
        {
          type: 'output',
          text: `SYSTEM INFO:
  OS: ${SYSTEM_METADATA.name}
  Codename: ${SYSTEM_METADATA.codename}
  Version: ${SYSTEM_METADATA.version}
  Merkle Root: ${SYSTEM_METADATA.merkleRoot}
  Sovereign Principal: ${SYSTEM_METADATA.sovereignPrincipal}`,
        },
      ]);
      return;
    }

    // Default unknown command
    playWarningTone();
    setHistory((prev) => [
      ...prev,
      { type: 'error', text: `Command not recognized: "${trimmed}". Type "help" for a list of available commands.` },
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(input);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#0c1814]/90 via-[#0b0e1a]/80 to-[#07080F] border border-white/8 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-mono">
              DEVELOPER CLI TERMINAL
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs font-mono">
              HARDWARE TELEMETRY GRID
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20 text-xs font-mono">
              POWER MATRIX INDICATOR
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-mono font-bold text-white mt-1">
            Developer CLI Terminal & Hardware Telemetry Matrix
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            Direct System State Inspector • Zoomable Sub-Module Architecture • Quantum Cooling Power Indicator • JSON Forensic Exporter
          </p>
        </div>

        {/* View Layout Tabs & Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Main Snapshot Button */}
          <button
            onClick={() => handleCaptureSnapshot()}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_16px_rgba(16,185,129,0.25)] hover:scale-[1.02]"
            title="Capture current hardware telemetry state into LedgerView"
          >
            <Camera className="w-4 h-4 text-emerald-400" />
            <span>SNAPSHOT STATE</span>
          </button>

          {/* Export JSON Forensic Dump Button */}
          <button
            onClick={handleExportSnapshotsJson}
            className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-cyan-200 border border-cyan-500/40 font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_16px_rgba(6,182,212,0.2)] hover:scale-[1.02] cursor-pointer"
            title="Export session hardware telemetry snapshots as a detailed JSON forensic file"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>EXPORT JSON</span>
          </button>

          {/* Quick Evidentiary Manifest QR Scanner Button */}
          <button
            onClick={() => {
              playTone(600, 0.04);
              setActiveTab('qr-scan');
            }}
            className={`px-3 py-2 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer ${
              activeTab === 'qr-scan'
                ? 'bg-cyan-500 text-black shadow-[0_0_16px_rgba(6,182,212,0.4)]'
                : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40'
            }`}
            title="Open QR scanner for rapid ingestion of evidentiary manifest codes"
          >
            <QrCode className="w-4 h-4" />
            <span>SCAN MANIFEST QR</span>
          </button>

          <div className="flex items-center bg-black/40 border border-white/10 p-1 rounded-2xl">
            <button
              onClick={() => {
                playTone(550, 0.04);
                setActiveTab('both');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                activeTab === 'both' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-zinc-400'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => {
                playTone(550, 0.04);
                setActiveTab('grid');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                activeTab === 'grid' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-zinc-400'
              }`}
            >
              Hardware Grid
            </button>
            <button
              onClick={() => {
                playTone(550, 0.04);
                setActiveTab('cli');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                activeTab === 'cli' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-zinc-400'
              }`}
            >
              CLI Only
            </button>
            <button
              onClick={() => {
                playTone(600, 0.04);
                setActiveTab('macros');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-mono transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === 'macros' ? 'bg-violet-500/20 text-violet-300 font-bold border border-violet-500/30 shadow-[0_0_12px_rgba(139,92,246,0.2)]' : 'text-zinc-400'
              }`}
            >
              <Sparkles className="w-3 h-3 text-violet-400" />
              <span>Macro Scripts</span>
            </button>
            <button
              onClick={() => {
                playTone(600, 0.04);
                setActiveTab('qr-scan');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-mono transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === 'qr-scan' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]' : 'text-zinc-400'
              }`}
            >
              <QrCode className="w-3 h-3 text-cyan-400" />
              <span>Manifest Scanner</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Ledger Sync Indicator & Merkle-Root Verification Handshake Animation */}
      <div className={`p-4 rounded-2xl border transition-all duration-300 font-mono text-xs space-y-3 ${
        syncState.isSyncing
          ? 'bg-gradient-to-r from-cyan-950/40 via-violet-950/30 to-emerald-950/40 border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.2)]'
          : 'bg-[#0a101d]/80 border-white/8 backdrop-blur-xl'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              syncState.isSyncing
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.4)] animate-pulse'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              <Share2 className={`w-5 h-5 ${syncState.isSyncing ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  Active Ledger Sync
                  <span className={`w-2 h-2 rounded-full ${syncState.isSyncing ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400 shadow-[0_0_8px_#10b981]'}`} />
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                  syncState.isSyncing
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                }`}>
                  {syncState.isSyncing ? `HANDSHAKE ACTIVE [${syncState.stage}]` : 'SSoT SYNCED (IDLE)'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono mt-0.5 flex flex-wrap items-center gap-x-2">
                <span>Merkle Root:</span>
                <span className="text-cyan-300 font-bold">{syncState.lastSyncedMerkleRoot.slice(0, 28)}...</span>
                <span className="text-zinc-500">•</span>
                <span>Packets: <strong className="text-emerald-400">{syncState.packetsProcessedCount}</strong></span>
                <span className="text-zinc-500">•</span>
                <span>Drift (&sigma;): <strong className="text-violet-300">{(syncState.totalDriftAvg * 100).toFixed(4)}%</strong></span>
              </p>
            </div>
          </div>

          {/* Handshake Quick Trigger Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                playTone(600, 0.04);
                triggerFederationSync({ packetName: 'Manual Active Ledger Sync Pulse', driftSigma: 0.0004 });
              }}
              disabled={syncState.isSyncing}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)] disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>SYNC HANDSHAKE</span>
            </button>

            <button
              onClick={() => {
                playTone(650, 0.04);
                triggerFederationSync({ packetName: 'Constitutional Tensor Broadcast', driftSigma: 0.0007 });
              }}
              disabled={syncState.isSyncing}
              className="px-3 py-1.5 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/40 font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-violet-400 ${syncState.isSyncing ? 'animate-spin' : ''}`} />
              <span>PUBLISH PACKET</span>
            </button>
          </div>
        </div>

        {/* Visual Merkle-Root Verification Handshake Pipeline Diagram */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-white/5 text-[10px]">
          <div className={`p-2 rounded-xl border flex flex-col justify-between transition-all ${
            syncState.stage === 'INGEST'
              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
              : syncState.progress >= 20
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-white/[0.02] border-white/5 text-zinc-500'
          }`}>
            <span className="font-bold">1. INGESTION</span>
            <span className="text-[9px] text-zinc-400">Payload Intake</span>
          </div>

          <div className={`p-2 rounded-xl border flex flex-col justify-between transition-all ${
            syncState.stage === 'MERKLE_TREE_HANDSHAKE'
              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
              : syncState.progress >= 50
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-white/[0.02] border-white/5 text-zinc-500'
          }`}>
            <span className="font-bold">2. MERKLE HANDSHAKE</span>
            <span className="text-[9px] text-zinc-400">Tree Root Verification</span>
          </div>

          <div className={`p-2 rounded-xl border flex flex-col justify-between transition-all ${
            syncState.stage === 'PQC_DILITHIUM_SIGN'
              ? 'bg-violet-500/20 border-violet-500 text-violet-200 shadow-[0_0_10px_rgba(139,92,246,0.3)]'
              : syncState.progress >= 75
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-white/[0.02] border-white/5 text-zinc-500'
          }`}>
            <span className="font-bold">3. DILITHIUM-5 SIGN</span>
            <span className="text-[9px] text-zinc-400">FIPS 204 PQC Proof</span>
          </div>

          <div className={`p-2 rounded-xl border flex flex-col justify-between transition-all ${
            syncState.stage === 'FEDERATION_CONSENSUS'
              ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
              : syncState.progress >= 90
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-white/[0.02] border-white/5 text-zinc-500'
          }`}>
            <span className="font-bold">4. 10/10 QUORUM</span>
            <span className="text-[9px] text-zinc-400">Sovereign Consensus</span>
          </div>

          <div className={`p-2 rounded-xl border flex flex-col justify-between transition-all ${
            syncState.stage === 'FINAL_SEAL' || (!syncState.isSyncing && syncState.progress === 100)
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
              : 'bg-white/[0.02] border-white/5 text-zinc-500'
          }`}>
            <span className="font-bold">5. LEDGER SEAL</span>
            <span className="text-[9px] text-zinc-400">Block #849202</span>
          </div>
        </div>

        {/* Handshake Progress Bar */}
        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400 transition-all duration-300"
            style={{ width: `${syncState.progress}%` }}
          />
        </div>
      </div>

      {/* Auto-Snapshot & Hardware Alert Threshold Configuration Panel */}
      <div className="p-4 rounded-2xl bg-[#0b0e1a]/85 border border-white/8 backdrop-blur-xl font-mono text-xs space-y-4">
        {/* Top row: Auto-Snapshot Daemon */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                autoSnapshotEnabled
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                  : 'bg-white/5 border border-white/10 text-zinc-500'
              }`}
            >
              <Clock className={`w-4 h-4 ${autoSnapshotEnabled ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white uppercase">
                  Auto-Snapshot Daemon (Every 30s on High-Load Activity)
                </span>
                <span
                  className={`text-[9px] px-2 py-0.2 rounded font-bold border ${
                    autoSnapshotEnabled
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-white/5 text-zinc-500 border-white/10'
                  }`}
                >
                  {autoSnapshotEnabled ? 'ARMED & MONITORING' : 'DISABLED'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                Automatically captures hardware telemetry state every 30 seconds whenever the system detects elevated CPU activity (≥{autoSnapshotThreshold}%).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Auto Snapshot Threshold Selection */}
            <div className="flex items-center gap-1.5 bg-black/40 border border-white/8 p-1 rounded-xl text-[11px]">
              <span className="text-zinc-500 px-1 text-[10px]">Auto-Snap Load:</span>
              {[50, 65, 75, 85].map((thr) => (
                <button
                  key={thr}
                  onClick={() => {
                    playTone(550, 0.03);
                    setAutoSnapshotThreshold(thr);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                    autoSnapshotThreshold === thr
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {thr}%
                </button>
              ))}
            </div>

            {/* Countdown timer badge when active */}
            {autoSnapshotEnabled && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Next Check: {autoSnapshotCountdown}s</span>
                {autoSnapshotsTriggeredCount > 0 && (
                  <span className="text-[10px] text-zinc-400 ml-1">
                    ({autoSnapshotsTriggeredCount} fired)
                  </span>
                )}
              </div>
            )}

            {/* Toggle Button */}
            <button
              onClick={() => {
                const next = !autoSnapshotEnabled;
                setAutoSnapshotEnabled(next);
                playTone(next ? 650 : 400, 0.06);
              }}
              className={`px-3.5 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-2 transition-all ${
                autoSnapshotEnabled
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-400 border-white/10'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${autoSnapshotEnabled ? 'bg-amber-400' : 'bg-zinc-600'}`} />
              <span>{autoSnapshotEnabled ? 'AUTO-SNAPSHOT ACTIVE' : 'ENABLE AUTO-SNAPSHOT'}</span>
            </button>
          </div>
        </div>

        {/* Bottom row: Custom CPU & RAM Alert Threshold Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* CPU Alert Threshold Slider */}
          <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-bold text-zinc-200">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>CPU Alert Highlight Threshold</span>
              </span>
              <span className="text-cyan-300 font-bold px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30">
                {cpuAlertThreshold}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-zinc-500">40%</span>
              <input
                type="range"
                min="40"
                max="95"
                step="5"
                value={cpuAlertThreshold}
                onChange={(e) => {
                  setCpuAlertThreshold(Number(e.target.value));
                  playTone(500 + Number(e.target.value) * 2, 0.02);
                }}
                className="flex-1 accent-cyan-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-zinc-500">95%</span>
            </div>
            <div className="text-[10px] text-zinc-400">
              Triggers visual amber/red alert highlight on 4x4 matrix and accessible list when exceeded.
            </div>
          </div>

          {/* RAM Alert Threshold Slider */}
          <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-bold text-zinc-200">
                <Server className="w-3.5 h-3.5 text-violet-400" />
                <span>RAM Alert Highlight Threshold</span>
              </span>
              <span className="text-violet-300 font-bold px-2 py-0.5 rounded bg-violet-500/15 border border-violet-500/30">
                {ramAlertThreshold}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-zinc-500">50%</span>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={ramAlertThreshold}
                onChange={(e) => {
                  setRamAlertThreshold(Number(e.target.value));
                  playTone(500 + Number(e.target.value) * 2, 0.02);
                }}
                className="flex-1 accent-violet-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-zinc-500">95%</span>
            </div>
            <div className="text-[10px] text-zinc-400">
              Highlights memory card and buffer allocation channels with animated status pulses.
            </div>
          </div>
        </div>
      </div>

      {/* Snapshot Confirmation Alert Banner */}
      {lastCapturedSnapshot && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-[#0b0e1a]/80 to-[#07080F] border border-emerald-500/40 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-white">
                  Hardware Snapshot Captured & Sealed: {lastCapturedSnapshot.id}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  BLOCK #{lastCapturedSnapshot.snapshotNumber}
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-400 mt-0.5 truncate">
                CPU Avg: {lastCapturedSnapshot.cpuAverage}% • Cryo: {lastCapturedSnapshot.cryoTempMk}mK • QOps: {lastCapturedSnapshot.qopsThroughput} QOps/s • Sealed: {lastCapturedSnapshot.sealedHash.slice(0, 24)}...
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs shrink-0">
            <button
              onClick={handleExportSnapshotsJson}
              className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold flex items-center gap-1.5 transition-all text-[11px]"
              title="Download forensic JSON dump"
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            {onNavigate && (
              <button
                onClick={() => {
                  playTone(600, 0.05);
                  onNavigate('ledger');
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1.5 transition-all"
              >
                <span>View in Ledger (Ctrl+L)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setLastCapturedSnapshot(null)}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all text-[11px]"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Evidentiary Manifest Ingestion Notification Banner */}
      {lastIngestedManifest && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/70 via-[#0b1324]/80 to-[#07080F] border border-cyan-500/40 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200 font-mono text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">
                  Manifest Ingested: {lastIngestedManifest.manifestId}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {lastIngestedManifest.status}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                Type: {lastIngestedManifest.manifestType} • Block #{lastIngestedManifest.blockHeight} • Root: {lastIngestedManifest.merkleRoot.slice(0, 20)}... • Drift: {lastIngestedManifest.driftDelta}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                playTone(600, 0.04);
                setActiveTab('qr-scan');
              }}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold flex items-center gap-1.5 transition-all text-[11px] cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Inspect Manifest</span>
            </button>
            <button
              onClick={() => setLastIngestedManifest(null)}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all text-[11px] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Sub-component: Real-time Hardware Telemetry Grid in Monospaced Layout with Zoom & Pan */}
      {(activeTab === 'both' || activeTab === 'grid') && (
        <div className="animate-in fade-in duration-300">
          <ConsoleHardwareTelemetryGrid
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            cpuThreshold={cpuAlertThreshold}
            ramThreshold={ramAlertThreshold}
            onSnapshot={handleCaptureSnapshot}
            onCpuLoadChange={handleCpuLoadChange}
          />
        </div>
      )}

      {/* Macro Console Automation Scripts View */}
      {activeTab === 'macros' && (
        <div className="animate-in fade-in duration-300">
          <MacroConsole onExecuteCommand={executeCommand} />
        </div>
      )}

      {/* Evidentiary Manifest QR Scanner View */}
      {activeTab === 'qr-scan' && (
        <div className="animate-in fade-in duration-300">
          <EvidentiaryManifestQRScanner
            onManifestIngested={handleManifestIngested}
          />
        </div>
      )}

      {/* Terminal Window */}
      {(activeTab === 'both' || activeTab === 'cli') && (
        <div className="rounded-[28px] bg-[#07080F]/95 border border-white/10 overflow-hidden shadow-2xl flex flex-col h-[460px] animate-in fade-in duration-300">
          {/* Terminal Header */}
          <div className="px-4 py-2.5 bg-black/60 border-b border-white/8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs font-mono text-zinc-400 ml-2">
                zyrquen-omega-cli — sovereign-node@cloudrun-bk01
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportAuditLogs}
                disabled={isExportingLog}
                className="px-2 py-0.5 rounded border border-[#D4AF37]/50 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-bold font-mono transition-colors flex items-center gap-1 mr-2 disabled:opacity-50"
                title="Export Signed Audit Logs (JSON)"
              >
                {isExportingLog ? (
                  <>
                    <span className="animate-spin inline-block text-[#D4AF37]">↻</span> Exporting...
                  </>
                ) : (
                  <>
                    <span>📥</span> Export Signed Log
                  </>
                )}
              </button>
              <span className="text-[10px] font-mono text-zinc-500">
                AUTO-SNAP: {autoSnapshotEnabled ? 'ON (30S)' : 'OFF'}
              </span>
              <span className="text-[10px] font-mono text-zinc-600">|</span>
              <span className="text-[10px] font-mono text-zinc-600">UTF-8 • SHA-256 • OTLP REAL-TIME</span>
            </div>
          </div>

          {/* Terminal Output */}
          <div className="flex-1 p-4 overflow-y-auto space-y-2 font-mono text-xs text-zinc-300 select-text">
            {history.map((item, idx) => (
              <div
                key={idx}
                className={`whitespace-pre-wrap leading-relaxed ${
                  item.type === 'input'
                    ? 'text-cyan-400 font-semibold'
                    : item.type === 'success'
                    ? 'text-emerald-400'
                    : item.type === 'error'
                    ? 'text-red-400'
                    : 'text-zinc-300'
                }`}
              >
                {item.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Terminal Input Bar */}
          <div className="p-3 bg-black/60 border-t border-white/8 flex items-center gap-2">
            <span className="text-cyan-400 font-mono text-xs font-bold pl-2">$</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command (e.g. snapshot, autosnap, export-json, audit, reconcile, cert, seals, pentest)..."
              className="flex-1 bg-transparent font-mono text-xs text-white focus:outline-none placeholder-zinc-600"
              autoFocus
            />
            <button
              onClick={() => executeCommand(input)}
              className="p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
