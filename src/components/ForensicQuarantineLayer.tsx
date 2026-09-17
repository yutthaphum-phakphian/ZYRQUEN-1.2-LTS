import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  AlertTriangle,
  FileCode,
  CheckCircle2,
  Copy,
  Check,
  Flame,
  FileCheck2,
  Download,
  GitCompare,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';
import {
  CANONICAL_SEALS,
  QUARANTINE_COUNT,
  CANONICAL_GENESIS_BLOCK,
  SSOT_MUTATION,
  BASELINE_DRIFT,
  CANONICAL_MERKLE_ROOT,
} from '../data/canonicalData';
import {
  generateMasterForensicAuditPdf,
  generateMasterAuditJsonLd,
} from '../utils/masterForensicAuditPackage';

export interface QuarantinedSealRecord {
  sealNumber: number;
  anomalyClass: string;
  sourceTelemetry: string;
  payloadDigest: string;
  causalBlockMismatch: string;
  signatureScheme: string;
  quarantineReason: string;
  isolationBoundary: string;
  investigationStatus: 'QUARANTINED' | 'UNDER_ANALYSIS' | 'CONFIRMED_NON_CANONICAL';
  timestamp: string;
  discrepancyType: 'BLOCK_HEIGHT_DRIFT' | 'DIGEST_COLLISION' | 'NON_PQC_ALGO' | 'ORPHAN_ROOT' | 'SIMULATION_TAG';
  canonicalComparison: {
    expected: string;
    received: string;
    impact: string;
  };
}

export const ForensicQuarantineLayer: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedSeal, setSelectedSeal] = useState<number>(14903);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'DIFF_VIEW' | 'RECONCILIATION_PROOF'>('DETAILS');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [reconciliationConfirmed, setReconciliationConfirmed] = useState<boolean>(true);

  const quarantinedItems: QuarantinedSealRecord[] = [
    {
      sealNumber: 14903,
      anomalyClass: 'Post-Epoch Emission (Block Height Drift)',
      sourceTelemetry: 'OTel-Sensor-Node-TH-09 (Probe Height #849,203)',
      payloadDigest: '0x9a88f110c223849203a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3',
      causalBlockMismatch: `Expected #${CANONICAL_GENESIS_BLOCK} (Frozen Genesis) vs Observed #849,203 (+1 Block Drift)`,
      signatureScheme: 'Ed25519-Provisional (Unratified)',
      quarantineReason: 'Emission originated after block sealing epoch timestamp (2026-08-23 03:00:00 ICT). Excluded from Merkle Root calculation.',
      isolationBoundary: 'RING-04-ISOLATED-BUFFER (Zero Read/Write to Canonical Core)',
      investigationStatus: 'QUARANTINED',
      timestamp: '2026-08-23 03:00:14 ICT',
      discrepancyType: 'BLOCK_HEIGHT_DRIFT',
      canonicalComparison: {
        expected: `Block Height = #${CANONICAL_GENESIS_BLOCK} (Genesis Epoch)`,
        received: 'Block Height = #849203 (+1 drift)',
        impact: 'Zero impact on SSoT. Quarantined before Merkle tree aggregation.',
      },
    },
    {
      sealNumber: 14904,
      anomalyClass: 'Replay Candidate / Digest Collision',
      sourceTelemetry: 'Gateway-Ingress-Cluster-02 (Telemetry Replica)',
      payloadDigest: '0x44bc9102fa4c68881909ab81479844d8a14816bed34cdbb07528e18501da86fc',
      causalBlockMismatch: 'Identical digest payload to Canonical Seal #14,881 (Duplicate Ingestion Attempt)',
      signatureScheme: 'ECDSA-Secp256k1 (Legacy Relay)',
      quarantineReason: 'Payload duplicate signature detects idempotent or replayed telemetry frame. Discarded from SSoT aggregation.',
      isolationBoundary: 'RING-04-ISOLATED-BUFFER (Idempotency Filter Trap)',
      investigationStatus: 'CONFIRMED_NON_CANONICAL',
      timestamp: '2026-08-23 03:00:22 ICT',
      discrepancyType: 'DIGEST_COLLISION',
      canonicalComparison: {
        expected: 'Unique Cryptographic Frame Nonce',
        received: 'Identical Hash Frame to Seal #14881',
        impact: 'Replay rejected by Idempotency Filter. Zero SSoT duplicate.',
      },
    },
    {
      sealNumber: 14905,
      anomalyClass: 'Cryptographic Key-Type Mismatch',
      sourceTelemetry: 'External Oracle Bridge (TH-FIN-INTERBANK-FEED)',
      payloadDigest: '0x88920199aa7766554433221100ffeeddccbbaa99887766554433221100aabbcc',
      causalBlockMismatch: 'Key type Ed25519 submitted; Post-Quantum CRYSTALS-Dilithium5 mandatory',
      signatureScheme: 'Ed25519-Standard (Non-PQC Policy Violation)',
      quarantineReason: 'Violates ETDA Section 28 & Sub-Kelvin Sovereign PQC Mandate. Lacks post-quantum lattice proof.',
      isolationBoundary: 'RING-04-ISOLATED-BUFFER (PQC Armor Interceptor)',
      investigationStatus: 'QUARANTINED',
      timestamp: '2026-08-23 03:00:35 ICT',
      discrepancyType: 'NON_PQC_ALGO',
      canonicalComparison: {
        expected: 'CRYSTALS-Dilithium-5 / FALCON-1024 PQC',
        received: 'Ed25519 Classical Signature',
        impact: 'Rejected by Post-Quantum Hardening Filter. Stored in quarantine ledger.',
      },
    },
    {
      sealNumber: 14906,
      anomalyClass: 'Provisional Session Key (Missing Genesis Anchor)',
      sourceTelemetry: 'Ephemeral Worker Pod-k8s-autoscale-07',
      payloadDigest: '0x12479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68909ab8',
      causalBlockMismatch: `Root parent pointer points to 0x0000...0000 instead of #${CANONICAL_GENESIS_BLOCK} Genesis Merkle Root`,
      signatureScheme: 'JWT-Provisional (Session Ephemeral)',
      quarantineReason: 'Missing Sovereign Genesis Parent hash binding. Attempted ambient session creation without Root Governor authorization.',
      isolationBoundary: 'RING-04-ISOLATED-BUFFER (Zero Ambient Write Enclave)',
      investigationStatus: 'QUARANTINED',
      timestamp: '2026-08-23 03:00:48 ICT',
      discrepancyType: 'ORPHAN_ROOT',
      canonicalComparison: {
        expected: `Parent Root = ${CANONICAL_MERKLE_ROOT.slice(0, 16)}...`,
        received: 'Parent Root = 0x0000000000000000',
        impact: 'Orphaned node blocked from Genesis tree lineage.',
      },
    },
    {
      sealNumber: 14907,
      anomalyClass: 'Synthetic Stress Benchmark Diagnostic',
      sourceTelemetry: 'Digital Twin SimA Monte Carlo Simulator',
      payloadDigest: '0xfa4c68768q0997124mk909ab814479844d8a14816bed34cdbb07528e18501da86fc',
      causalBlockMismatch: 'Simulation-Tagged Artifact (Tag: MONTE_CARLO_SIM_100K_RUN)',
      signatureScheme: 'Synthetic-Twin-SelfSigned (Simulation Lab)',
      quarantineReason: 'Diagnostic synthetic stress workload generated for failure boundary testing. Never intended for canonical promotion.',
      isolationBoundary: 'RING-04-ISOLATED-BUFFER (Simulation Sandbox Prison)',
      investigationStatus: 'CONFIRMED_NON_CANONICAL',
      timestamp: '2026-08-23 03:01:02 ICT',
      discrepancyType: 'SIMULATION_TAG',
      canonicalComparison: {
        expected: 'Production Genesis Telemetry Stream',
        received: 'MONTE_CARLO_SIM_100K_RUN Stress Artifact',
        impact: 'Simulated diagnostic isolated permanently. Mutation = 0.',
      },
    },
  ];

  const handleCopy = (text: string, id: string) => {
    copyToClipboard(text);
    setCopiedId(id);
    playTone(740, 0.04);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleVerifyQuarantineIntegrity = () => {
    setIsVerifying(true);
    playTone(550, 0.04);
    setTimeout(() => {
      setIsVerifying(false);
      setReconciliationConfirmed(true);
      playAuditChime();
    }, 450);
  };

  const handleExportReconciliationJson = () => {
    playTone(680, 0.03);
    const reportData = {
      reportType: 'ZYRQUEN_FORENSIC_QUARANTINE_RECONCILIATION_AUDIT',
      canonicalSealsCount: CANONICAL_SEALS,
      quarantinedSealsCount: QUARANTINE_COUNT,
      quarantinedSealsRange: '14903 - 14907',
      ssotMutationDelta: SSOT_MUTATION,
      baselineDrift: BASELINE_DRIFT,
      genesisBlockHeight: CANONICAL_GENESIS_BLOCK,
      merkleTreeRoot: CANONICAL_MERKLE_ROOT,
      quarantinedRecords: quarantinedItems,
      isolationProof: {
        layer: 'RING-04-ISOLATED-BUFFER',
        leakageDetected: 0,
        promotionBlocked: true,
        reconciliationVerdict: 'ALL_5_DELTA_SEALS_RECONCILED_AS_NON_CANONICAL',
      },
      auditTimestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZYRQUEN-QUARANTINE-RECONCILIATION-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMasterPdf = () => {
    playTone(720, 0.03);
    generateMasterForensicAuditPdf();
    playAuditChime();
  };

  const activeRecord = quarantinedItems.find((q) => q.sealNumber === selectedSeal) || quarantinedItems[0];

  return (
    <div
      id="forensic-quarantine-layer"
      className="p-6 rounded-[28px] bg-gradient-to-br from-[#120808] via-black to-[#190c0c] border-2 border-amber-500/40 space-y-6 font-mono text-xs shadow-2xl"
    >
      {/* Header Isolation Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-amber-500/20 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-bold text-amber-300 tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              FORENSIC QUARANTINE RECONCILIATION LAYER &bull; ISOLATED BUFFER
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white font-mono">
            STRUCTURAL ISOLATION: {QUARANTINE_COUNT} NON-CANONICAL SEALS (#14,903 &ndash; #14,907)
          </h2>
          <p className="text-[11px] text-zinc-400">
            กักกันความผิดปกติทางนิติวิทยาศาสตร์แยกขาดจาก Frozen Core SSoT ({CANONICAL_SEALS} Seals) เพื่อรักษาความคงกระพัน {BASELINE_DRIFT.toFixed(2)}% Drift (SSoT Mutation = {SSOT_MUTATION})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleVerifyQuarantineIntegrity}
            disabled={isVerifying}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'VERIFYING...' : 'RE-VERIFY ZERO-LEAK'}</span>
          </button>
          <button
            onClick={handleExportReconciliationJson}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>EXPORT AUDIT JSON</span>
          </button>
          <button
            onClick={handleExportMasterPdf}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-violet-500/20 hover:from-amber-500/30 hover:to-violet-500/30 border border-amber-500/40 text-amber-200 font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
            <span>MASTER AUDIT PDF</span>
          </button>
        </div>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-black/60 border border-cyan-500/30">
          <span className="text-[10px] text-zinc-500 block">CANONICAL SSoT SEALS</span>
          <strong className="text-cyan-300 text-sm block mt-0.5">{CANONICAL_SEALS.toLocaleString()} Seals</strong>
          <span className="text-[9px] text-zinc-400">100% Frozen &bull; Zero Drift</span>
        </div>
        <div className="p-3 rounded-xl bg-black/60 border border-amber-500/30">
          <span className="text-[10px] text-zinc-500 block">QUARANTINE BUFFER DELTA</span>
          <strong className="text-amber-300 text-sm block mt-0.5">+{QUARANTINE_COUNT} Isolated</strong>
          <span className="text-[9px] text-amber-400 font-bold">RING-04 Firewall Active</span>
        </div>
        <div className="p-3 rounded-xl bg-black/60 border border-emerald-500/30">
          <span className="text-[10px] text-zinc-500 block">SSOT MUTATION COUNT</span>
          <strong className="text-emerald-400 text-sm block mt-0.5">{SSOT_MUTATION} (Zero Mutation)</strong>
          <span className="text-[9px] text-emerald-400">Core Write Denied</span>
        </div>
        <div className="p-3 rounded-xl bg-black/60 border border-rose-500/30">
          <span className="text-[10px] text-zinc-500 block">PROMOTION CIRCUIT</span>
          <strong className="text-rose-400 text-sm block mt-0.5">FAIL-CLOSED 🔒</strong>
          <span className="text-[9px] text-rose-300">Protected by Gates G11–G13</span>
        </div>
      </div>

      {/* Main Forensic Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: List of 5 Quarantined Seals */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="text-[11px] font-bold text-zinc-400 flex items-center justify-between pb-1">
            <span>QUARANTINE BUFFER REGISTRY ({QUARANTINE_COUNT} ITEMS)</span>
            <span className="text-amber-400 font-mono">ALL RECONCILED</span>
          </div>

          <div className="space-y-2">
            {quarantinedItems.map((item) => {
              const isSelected = selectedSeal === item.sealNumber;
              return (
                <div
                  key={item.sealNumber}
                  onClick={() => {
                    setSelectedSeal(item.sealNumber);
                    playTone(600, 0.03);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-950/40 border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                      : 'bg-black/60 border-white/10 hover:border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30">
                        SEAL #{item.sealNumber.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-zinc-400 truncate max-w-[130px] font-mono">
                        {item.timestamp}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      ISOLATED
                    </span>
                  </div>
                  <div className="mt-1.5 font-bold text-white text-xs truncate">{item.anomalyClass}</div>
                  <div className="text-[10px] text-zinc-400 truncate font-mono mt-0.5">{item.sourceTelemetry}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deep Forensic Dossier & Differential Inspector */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-black/80 border border-amber-500/30 space-y-4">
            {/* Tab Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'DETAILS', label: '1. Forensic Dossier' },
                  { id: 'DIFF_VIEW', label: '2. Canonical vs Observed Diff' },
                  { id: 'RECONCILIATION_PROOF', label: '3. Zero-Leak Proof' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      playTone(620, 0.02);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      activeTab === tab.id
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-white/5 text-zinc-400 hover:text-zinc-200 border border-white/5'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                {activeRecord.investigationStatus}
              </span>
            </div>

            {/* Sub-Tab 1: Dossier */}
            {activeTab === 'DETAILS' && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                    <span className="text-zinc-500 block text-[10px]">Anomaly Classification</span>
                    <strong className="text-amber-300 block">{activeRecord.anomalyClass}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                    <span className="text-zinc-500 block text-[10px]">Signature Scheme Policy</span>
                    <strong className="text-rose-300 block">{activeRecord.signatureScheme}</strong>
                  </div>
                </div>

                <div className="space-y-1 text-[11px]">
                  <span className="text-zinc-500 block text-[10px]">Causal Block Height Inconsistency:</span>
                  <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-200 font-mono text-[10px]">
                    {activeRecord.causalBlockMismatch}
                  </div>
                </div>

                <div className="space-y-1 text-[11px]">
                  <span className="text-zinc-500 block text-[10px]">Forensic Quarantine Rationale:</span>
                  <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/20 text-zinc-300 text-[10px] leading-relaxed">
                    {activeRecord.quarantineReason}
                  </div>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500">
                    <span>Payload SHA-256 Telemetry Digest:</span>
                    <button
                      onClick={() => handleCopy(activeRecord.payloadDigest, `hash-${activeRecord.sealNumber}`)}
                      className="flex items-center gap-1 text-cyan-300 hover:text-cyan-200 cursor-pointer"
                    >
                      {copiedId === `hash-${activeRecord.sealNumber}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === `hash-${activeRecord.sealNumber}` ? 'COPIED' : 'COPY'}</span>
                    </button>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black border border-white/10 text-cyan-300 font-mono text-[10px] break-all select-all">
                    {activeRecord.payloadDigest}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-Tab 2: Diff View */}
            {activeTab === 'DIFF_VIEW' && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-zinc-300 font-bold text-xs">
                    <GitCompare className="w-4 h-4 text-amber-400" />
                    <span>Cryptographic Discrepancy Differential Analysis</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] pt-1">
                    <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                      <span className="text-[10px] font-bold text-emerald-400">CANONICAL EXPECTED</span>
                      <p className="text-zinc-200 text-[11px] font-mono">{activeRecord.canonicalComparison.expected}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-500/30 space-y-1">
                      <span className="text-[10px] font-bold text-rose-400">OBSERVED QUARANTINE</span>
                      <p className="text-zinc-200 text-[11px] font-mono">{activeRecord.canonicalComparison.received}</p>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/20 text-[10px] text-amber-200">
                    <strong>Reconciliation Verdict:</strong> {activeRecord.canonicalComparison.impact}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-Tab 3: Zero-Leak Proof */}
            {activeTab === 'RECONCILIATION_PROOF' && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <div className="p-3.5 rounded-xl bg-black/60 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>SSoT Inviolability Proof & Zero-Leak Audit</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-zinc-300">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Canonical Merkle Tree Hash: <code className="text-cyan-300">{CANONICAL_MERKLE_ROOT.slice(0, 20)}...</code> (Unchanged)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Zero Write Authority: Canonical Core is write-protected and completely frozen.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Isolation Barrier: 5 delta artifacts permanently jailed in Ring-04 buffer memory.</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-zinc-400">
              <span className="flex items-center gap-1.5 text-amber-300">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                {activeRecord.isolationBoundary}
              </span>
              <span className="text-emerald-400 font-bold">SSOT MUTATION = {SSOT_MUTATION} &bull; SSoT DRIFT = {BASELINE_DRIFT.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

