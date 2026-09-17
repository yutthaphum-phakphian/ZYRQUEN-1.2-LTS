import React, { useState } from 'react';
import {
  FileText,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Building2,
  TrendingUp,
  AlertTriangle,
  Clock,
  Layers,
  FileCode,
  Check,
  Copy,
  Download,
  Terminal,
  Database,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Ban,
  FileCheck,
  Cpu,
  Fingerprint,
  Award,
} from 'lucide-react';
import { playTone, playAuditChime } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';
import { FiosEvidencePackageMaster, FIOS_EVIDENCE_PACKAGE } from './FiosEvidencePackageMaster';
import { DeterministicVerificationPipeline } from './DeterministicVerificationPipeline';
import { QuarantineFirewallPanel } from './QuarantineFirewallPanel';
import { MultiTenantNamespaceMatrix } from './MultiTenantNamespaceMatrix';
import { FiosDigitalTwinStressSandbox } from './FiosDigitalTwinStressSandbox';
import { AdversarialFailureLab } from './AdversarialFailureLab';
import { Phase3UpgradeManifestModal } from './Phase3UpgradeManifestModal';
import { PolicyEngine, PolicyEvaluationResult } from './PolicyEngine';
import { CryptoVerificationCenter } from './CryptoVerificationCenter';
import { QuarantineForensics } from './QuarantineForensics';
import { Phase7ProductionReadinessDashboard } from './Phase7ProductionReadinessDashboard';

import { TerminalJobLifecycleManager } from '../services/TerminalJobLifecycleManager';

export type EvidenceStatus =
  | 'CANONICAL'
  | 'REAL_SOURCE_FILE'
  | 'REFERENCE'
  | 'OBSERVED'
  | 'PENDING_VERIFICATION'
  | 'SIMULATED'
  | 'BLOCKED';

export interface EvidenceIntakePanelProps {
  evidenceIds?: [string, string] | string[];
}

export interface EvidenceItemData {
  evidenceId: string;
  sourceFilename: string;
  sourceType: string;
  provenance: 'SOURCE_FILE';
  status: 'PENDING VERIFICATION';
  canonicalWriteAuthority: 'BLOCKED (0 MUTATIONS)';
  dataClassification: string;
  isolationScope: string;
  organizationOrGoverningBody: string;
  timestamp: string;
  claimsSummary: string;
  digestStatus: 'NOT COMPUTED';
}

const EVIDENCE_DATA_REGISTRY: Record<string, EvidenceItemData> = {
  'TNT-TH-001': {
    evidenceId: 'TNT-TH-001',
    sourceFilename: 'tenant_audit_manifest_TNT-TH-001.json',
    sourceType: 'TENANT_AUDIT_MANIFEST',
    provenance: 'SOURCE_FILE',
    status: 'PENDING VERIFICATION',
    canonicalWriteAuthority: 'BLOCKED (0 MUTATIONS)',
    dataClassification: 'Non-Canonical Tenant Source Manifest',
    isolationScope: 'Sovereign Physical Hardware Isolation (Tenant-isolated)',
    organizationOrGoverningBody: 'MAEW HOLDINGS CO., LTD. (Sovereign HQ)',
    timestamp: '2026-08-01T14:58:13.449Z',
    claimsSummary: 'CPU 32% | Storage 480/2000 GB | 142.8M Req/mo | v2.8.0-GA-SEAL',
    digestStatus: 'NOT COMPUTED',
  },
  'DS-901-PILOT': {
    evidenceId: 'DS-901-PILOT',
    sourceFilename: 'maew_fios_pilot_dataset.json',
    sourceType: 'FIOS_PILOT_DATASET',
    provenance: 'SOURCE_FILE',
    status: 'PENDING VERIFICATION',
    canonicalWriteAuthority: 'BLOCKED (0 MUTATIONS)',
    dataClassification: 'Non-Live Pilot Dataset (Zero Trading Authority)',
    isolationScope: 'Simulated Sandbox / Pilot Namespace Only',
    organizationOrGoverningBody: 'Maew & Partners Fiduciary Control',
    timestamp: '2026-08-03T04:31:50.500Z',
    claimsSummary: '30D Return +12.42% | Sharpe 2.41 | MaxDD -4.18% (Non-live historical backtest)',
    digestStatus: 'NOT COMPUTED',
  },
};

export const EvidenceIntakePanel: React.FC<EvidenceIntakePanelProps> = ({
  evidenceIds = ['TNT-TH-001', 'DS-901-PILOT'],
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    | 'OVERVIEW'
    | 'VERIFY_GATE'
    | 'CRYPTO_CENTER'
    | 'QUARANTINE'
    | 'QUARANTINE_FORENSICS'
    | 'TENANTS'
    | 'DIGITAL_TWIN'
    | 'ADVERSARIAL_LAB'
    | 'PHASE7_DASHBOARD'
  >('OVERVIEW');
  const [isManifestOpen, setIsManifestOpen] = useState(false);
  const [policyResults, setPolicyResults] = useState<Record<string, PolicyEvaluationResult>>({});

  const handleEvaluatePolicy = (id: string) => {
    playTone(680, 0.03);
    const data = EVIDENCE_DATA_REGISTRY[id];
    const isTnt = id === 'TNT-TH-001';

    const result = PolicyEngine.evaluate({
      actorId: 'SEC-ADMIN-CONTROL',
      tenantId: isTnt ? 'TNT-TH-001' : 'TNT-TH-001',
      targetNamespace: isTnt ? 'TNT-TH-001' : 'TNT-TH-001',
      operation: 'EVIDENCE_PROMOTE',
      artifactId: id,
      artifactState: 'PENDING_VERIFICATION',
      provenance: data?.provenance || 'SOURCE_FILE',
      computedSha256: null,
      hardwareSlot: isTnt ? 'HSM-SLOT-01' : 'HSM-SLOT-02-PILOT-SANDBOX',
    });

    setPolicyResults((prev) => ({ ...prev, [id]: result }));
  };

  const handleCopy = (text: string, id: string) => {
    copyToClipboard(text);
    setCopiedKey(id);
    playTone(700, 0.03);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadLedger = () => {
    const filename = `EVIDENCE_INTAKE_PANEL_LEDGER.json`;
    const idempotencyKey = `IDEMP-INTAKE-DOWNLOAD-${filename}`;
    const existingJob = TerminalJobLifecycleManager.getJobOrByKey(idempotencyKey);
    const status = existingJob?.state;

    // Strict state machine guard pattern
    if (status === 'COMPLETED' || status === 'UPLOADED' || status === 'TERMINAL_BLOCKED' || status === 'TERMINAL_REJECTED') {
      console.warn(`[EvidenceIntakePanel] Guard triggered: job '${idempotencyKey}' already in terminal state '${status}'. Duplicate suppressed.`);
      return;
    }

    TerminalJobLifecycleManager.submitJob({
      jobType: 'AUDIT_SEAL_EXPORT',
      idempotencyKey,
      payload: { filename },
      actor: 'EVIDENCE_INTAKE_ACTOR',
    });

    playTone(600, 0.04);
    const data = {
      manifesto: 'ZYRQUEN_OMEGA_INFINITY_HARDENING_V2_1',
      title: 'REAL EVIDENCE INTAKE & PROVENANCE BINDING LEDGER',
      timestamp: new Date().toISOString(),
      canonicalCore: {
        merkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
        blockHeight: '#849202',
        canonicalSeals: 14902,
        ssotMutation: 0,
        promotionStatus: 'FAIL-CLOSED',
      },
      intakeArtifacts: evidenceIds.map((id) => {
        const item = EVIDENCE_DATA_REGISTRY[id] || {
          evidenceId: id,
          sourceFilename: `${id}.json`,
          sourceType: 'SOURCE_ARTIFACT',
          provenance: 'SOURCE_FILE',
          status: 'PENDING VERIFICATION',
          canonicalWriteAuthority: 'BLOCKED (0 MUTATIONS)',
          dataClassification: 'External Non-Canonical Artifact',
          isolationScope: 'Isolated Namespace',
          organizationOrGoverningBody: 'Unknown Ingress Node',
          timestamp: new Date().toISOString(),
          claimsSummary: 'Raw external artifact',
          digestStatus: 'NOT COMPUTED',
        };
        return {
          evidenceId: item.evidenceId,
          sourceFilename: item.sourceFilename,
          sourceType: item.sourceType,
          provenance: item.provenance,
          verification: item.status,
          reconciliation: 'NOT_APPLICABLE_PENDING',
          mutationAuthority: 'NONE',
          canonicalWrite: 'BLOCKED',
          classification: item.dataClassification,
          binding: {
            artifactDigest: item.digestStatus,
            merkleAnchor: 'CANONICAL_P0_ANCHOR_REQUIRED',
            blockBinding: 'PENDING',
          },
        };
      }),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EVIDENCE_INTAKE_PANEL_LEDGER_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    playAuditChime();

    TerminalJobLifecycleManager.transitionState(idempotencyKey, 'COMPLETED', { downloaded: true });
  };

  return (
    <div id="evidence-intake-panel" className="space-y-6 font-mono text-zinc-200">
      {/* Main Header Container - Visually Distinct from Core Telemetry */}
      <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#0c1328]/95 via-[#0a0f20]/90 to-[#060810] border-2 border-indigo-500/40 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-indigo-500/20 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400 text-indigo-300 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              <FileCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-indigo-100 font-serif tracking-wide">
                  REAL EVIDENCE INTAKE
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 font-bold">
                  HARDENING v2.1
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  SSOT MUTATION = 0
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-serif mt-1">
                Control-Plane Hardening Layer &bull; External Evidence Ingestion &bull; Zero Canonical Write Authority
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-end lg:self-center">
            <button
              onClick={() => {
                setIsManifestOpen(true);
                playTone(700, 0.03);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>PHASE 3 MANIFEST</span>
            </button>

            <button
              onClick={handleDownloadLedger}
              className="px-3.5 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/50 text-indigo-200 text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT INTAKE LEDGER</span>
            </button>
          </div>
        </div>

        {/* Status Distinction Taxonomy Legend */}
        <div className="mt-4 p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-zinc-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              PROVENANCE &amp; VERIFICATION TAXONOMY
            </span>
            <span className="text-[10px] text-zinc-500">Explicit Visual Boundaries Enforced</span>
          </div>

          <div className="flex flex-wrap gap-2 text-[10px]">
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
              CANONICAL (SSoT Core)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold">
              REAL SOURCE FILE (Supplied Input)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
              PENDING VERIFICATION (Awaiting Hardware Node)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
              OBSERVED (Runtime Telemetry Probe)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
              REFERENCE (RFC / Standard Spec)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-zinc-700/50 text-zinc-300 border border-zinc-500/40 font-bold">
              SIMULATED (Local Fallback)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-rose-900/40 text-rose-300 border border-rose-500/40 font-bold">
              BLOCKED (Write Firewall)
            </span>
          </div>
        </div>

        {/* 4 State Comparison Grid */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-black/60 border border-emerald-500/30 space-y-1">
            <div className="text-[10px] text-zinc-400 flex items-center justify-between">
              <span>CANONICAL STATE</span>
              <Lock className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="text-emerald-400 font-bold text-sm">14,902 SEALS</div>
            <div className="text-[9px] text-zinc-400">Root: 909ab814...fa4c68</div>
          </div>

          <div className="p-3 rounded-xl bg-black/60 border border-indigo-500/30 space-y-1">
            <div className="text-[10px] text-zinc-400 flex items-center justify-between">
              <span>INTAKE FILES</span>
              <Layers className="w-3 h-3 text-indigo-400" />
            </div>
            <div className="text-indigo-300 font-bold text-sm">{evidenceIds.length} REAL ARTIFACTS</div>
            <div className="text-[9px] text-indigo-400 truncate">{evidenceIds.join(' • ')}</div>
          </div>

          <div className="p-3 rounded-xl bg-black/60 border border-amber-500/30 space-y-1">
            <div className="text-[10px] text-zinc-400 flex items-center justify-between">
              <span>VERIFICATION</span>
              <Clock className="w-3 h-3 text-amber-400" />
            </div>
            <div className="text-amber-300 font-bold text-sm">PENDING (0/{evidenceIds.length})</div>
            <div className="text-[9px] text-zinc-400">Presence &ne; Validity</div>
          </div>

          <div className="p-3 rounded-xl bg-black/60 border border-rose-500/30 space-y-1">
            <div className="text-[10px] text-zinc-400 flex items-center justify-between">
              <span>PROMOTION GATE</span>
              <ShieldAlert className="w-3 h-3 text-rose-400" />
            </div>
            <div className="text-rose-400 font-bold text-sm">FAIL-CLOSED</div>
            <div className="text-[9px] text-rose-400 font-bold">No Canonical Write</div>
          </div>
        </div>

        {/* 6 Hardening Sub-Module Navigation Tabs */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-6 gap-2 border-t border-indigo-500/20 pt-4">
          <button
            onClick={() => {
              setActiveTab('OVERVIEW');
              playTone(600, 0.02);
            }}
            className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
              activeTab === 'OVERVIEW'
                ? 'bg-indigo-600/30 text-indigo-100 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                : 'bg-black/60 text-zinc-400 border-white/10 hover:text-white hover:border-white/20'
            }`}
          >
            <FileCheck className="w-4 h-4 text-indigo-400" />
            <span className="truncate">Overview &amp; SSoT</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('VERIFY_GATE');
              playTone(650, 0.02);
            }}
            className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
              activeTab === 'VERIFY_GATE'
                ? 'bg-indigo-600/30 text-indigo-100 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                : 'bg-black/60 text-zinc-400 border-white/10 hover:text-white hover:border-white/20'
            }`}
          >
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span className="truncate">1. Crypto Verify</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('CRYPTO_CENTER');
              playTone(670, 0.02);
            }}
            className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
              activeTab === 'CRYPTO_CENTER'
                ? 'bg-cyan-600/30 text-cyan-100 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'bg-black/60 text-zinc-400 border-white/10 hover:text-white hover:border-white/20'
            }`}
          >
            <Fingerprint className="w-4 h-4 text-cyan-400" />
            <span className="truncate">Byte SHA-256</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('QUARANTINE');
              playTone(680, 0.02);
            }}
            className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
              activeTab === 'QUARANTINE'
                ? 'bg-rose-600/30 text-rose-100 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                : 'bg-black/60 text-zinc-400 border-white/10 hover:text-white hover:border-white/20'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span className="truncate">2. Quarantine</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('QUARANTINE_FORENSICS');
              playTone(700, 0.02);
            }}
            className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
              activeTab === 'QUARANTINE_FORENSICS'
                ? 'bg-rose-600/30 text-rose-100 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                : 'bg-black/60 text-zinc-400 border-white/10 hover:text-white hover:border-white/20'
            }`}
          >
            <Shield className="w-4 h-4 text-rose-400" />
            <span className="truncate">Forensics Diff</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('TENANTS');
              playTone(720, 0.02);
            }}
            className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
              activeTab === 'TENANTS'
                ? 'bg-cyan-600/30 text-cyan-100 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'bg-black/60 text-zinc-400 border-white/10 hover:text-white hover:border-white/20'
            }`}
          >
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span className="truncate">3. Multi-Tenant</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('DIGITAL_TWIN');
              playTone(760, 0.02);
            }}
            className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
              activeTab === 'DIGITAL_TWIN'
                ? 'bg-emerald-600/30 text-emerald-100 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-black/60 text-zinc-400 border-white/10 hover:text-white hover:border-white/20'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="truncate">4. Digital Twin</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('ADVERSARIAL_LAB');
              playTone(800, 0.02);
            }}
            className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
              activeTab === 'ADVERSARIAL_LAB'
                ? 'bg-rose-600/30 text-rose-100 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                : 'bg-black/60 text-zinc-400 border-white/10 hover:text-white hover:border-white/20'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span className="truncate">Attack Lab</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('PHASE7_DASHBOARD');
              playTone(840, 0.02);
            }}
            className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
              activeTab === 'PHASE7_DASHBOARD'
                ? 'bg-indigo-600/30 text-indigo-100 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                : 'bg-black/60 text-zinc-400 border-white/10 hover:text-white hover:border-white/20'
            }`}
          >
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span className="truncate">Phase 7 Ready</span>
          </button>
        </div>
      </div>

      {/* Conditional Sub-Module Views */}
      {activeTab === 'VERIFY_GATE' && <DeterministicVerificationPipeline />}
      {activeTab === 'CRYPTO_CENTER' && <CryptoVerificationCenter />}
      {activeTab === 'QUARANTINE' && <QuarantineFirewallPanel />}
      {activeTab === 'QUARANTINE_FORENSICS' && <QuarantineForensics />}
      {activeTab === 'TENANTS' && <MultiTenantNamespaceMatrix />}
      {activeTab === 'DIGITAL_TWIN' && <FiosDigitalTwinStressSandbox />}
      {activeTab === 'ADVERSARIAL_LAB' && <AdversarialFailureLab />}
      {activeTab === 'PHASE7_DASHBOARD' && <Phase7ProductionReadinessDashboard />}

      {/* READ-ONLY INTAKE EVIDENCE LIST (Rendered on Overview tab) */}
      {activeTab === 'OVERVIEW' && (
        <>
          <div className="p-6 rounded-[28px] bg-[#090d18] border-2 border-indigo-500/40 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-500/20 pb-3">
          <div>
            <h3 className="text-sm font-bold text-indigo-100 font-serif flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-400" />
              <span>INGESTED EVIDENCE REGISTRY (READ-ONLY)</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Strict Non-Canonical Source Data &bull; Zero Write Authority &bull; Pure Read-Only Intake
            </p>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold self-start sm:self-auto">
            ALL WRITE ATTEMPTS BLOCKED
          </span>
        </div>

        <div className="space-y-3">
          {evidenceIds.length === 0 ? (
            <div className="p-8 rounded-2xl bg-black/50 border border-white/10 text-center space-y-2">
              <ShieldAlert className="w-8 h-8 text-zinc-500 mx-auto" />
              <div className="text-sm font-bold text-zinc-300 font-mono">NO EVIDENCE RECORDED</div>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                No external non-canonical artifacts currently ingested. The SSoT core operates under strictly isolated canonical baseline #849202.
              </p>
            </div>
          ) : (
            evidenceIds.map((id) => {
            const data = EVIDENCE_DATA_REGISTRY[id] || {
              evidenceId: id,
              sourceFilename: `${id}.json`,
              sourceType: 'EXTERNAL_FILE',
              provenance: 'SOURCE_FILE' as const,
              status: 'PENDING VERIFICATION' as const,
              canonicalWriteAuthority: 'BLOCKED (0 MUTATIONS)' as const,
              dataClassification: 'Non-Live Non-Canonical External Source Data',
              isolationScope: 'Isolated Namespace',
              organizationOrGoverningBody: 'External Entity',
              timestamp: new Date().toISOString(),
              claimsSummary: 'Unverified input payload',
              digestStatus: 'NOT COMPUTED' as const,
            };

            const isTnt = id === 'TNT-TH-001';

            return (
              <div
                key={id}
                className="p-4 rounded-2xl bg-black/70 border border-indigo-500/30 hover:border-indigo-400/50 transition-all space-y-3"
              >
                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isTnt
                          ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300'
                          : 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      }`}
                    >
                      {isTnt ? <Building2 className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-white font-serif">{data.evidenceId}</span>
                        <span className="text-[10px] px-2 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 font-bold">
                          PROVENANCE: {data.provenance}
                        </span>
                        <span className="text-[10px] px-2 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-white/10 font-bold">
                          TYPE: {data.sourceType}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{data.sourceFilename}</div>
                    </div>
                  </div>

                  {/* Verification Status & Canonical Write Indicators */}
                  <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                    <span className="pending-state-pulse px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/50 text-[10px] font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>{data.status}</span>
                    </span>

                    <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/50 text-[10px] font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(244,63,94,0.2)]">
                      <Ban className="w-3 h-3 text-rose-400" />
                      <span>NO CANONICAL WRITE</span>
                    </span>
                  </div>
                </div>

                {/* Read-Only Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-white/5 space-y-0.5">
                    <div className="text-[9px] text-zinc-500 font-bold uppercase">Classification</div>
                    <div className="text-amber-300 font-bold truncate">{data.dataClassification}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-white/5 space-y-0.5">
                    <div className="text-[9px] text-zinc-500 font-bold uppercase">Isolation Scope</div>
                    <div className="text-zinc-200 truncate">{data.isolationScope}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-white/5 space-y-0.5">
                    <div className="text-[9px] text-zinc-500 font-bold uppercase">Issuing/Source Entity</div>
                    <div className="text-indigo-300 truncate">{data.organizationOrGoverningBody}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-white/5 space-y-0.5">
                    <div className="text-[9px] text-zinc-500 font-bold uppercase">Digest &amp; Write Gate</div>
                    <div className="text-rose-300 font-bold flex items-center justify-between">
                      <span>{data.digestStatus}</span>
                      <span className="text-[9px] text-emerald-400">MUTATION: 0</span>
                    </div>
                  </div>
                </div>

                {/* Source Provided Claims Summary Banner */}
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[10px] text-zinc-400 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span>
                    <strong className="text-zinc-300">Source Claims (Read-Only):</strong> {data.claimsSummary}
                  </span>
                  <span className="text-zinc-500 text-[9px] shrink-0">Timestamp: {data.timestamp}</span>
                </div>

                {/* Central Zero-Trust Policy Engine Evaluation */}
                <div className="pt-2 border-t border-white/5 flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                      <Shield className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Zero-Trust Policy Engine (Default-Deny Policy):</span>
                    </div>

                    <button
                      onClick={() => handleEvaluatePolicy(id)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/50 text-indigo-200 text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-300" />
                      <span>Test Promotion Request via Policy Engine</span>
                    </button>
                  </div>

                  {policyResults[id] && (
                    <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 space-y-1.5 text-xs animate-in fade-in duration-200">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-500/20 pb-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-400/50 text-[10px] font-bold">
                            DECISION: {policyResults[id].decision}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            Trace: {policyResults[id].traceId}
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-bold">
                          SSoT Mutation Delta: {policyResults[id].ssotMutationDelta}
                        </span>
                      </div>

                      <div className="text-[11px] text-rose-200 font-medium">
                        {policyResults[id].reasons.map((r, idx) => (
                          <div key={idx} className="flex items-start gap-1.5">
                            <span className="text-rose-400">&bull;</span>
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          }))}
        </div>
      </div>

      {/* P0 Invariant & Evidence Reconciliation Status Table */}
      <div className="p-5 rounded-[24px] bg-[#080d1a] border-2 border-indigo-500/30 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-500/20 pb-2.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-indigo-100 uppercase tracking-wider">
              EVIDENCE INTAKE RECONCILIATION &amp; P0 INVARIANT ENFORCEMENT
            </h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold self-start sm:self-auto">
            ALL MUTATION GATES = LOCKED (0)
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
          {/* Left: Reconciliation Table */}
          <div className="p-3 rounded-xl bg-black/60 border border-white/5 space-y-2">
            <div className="text-[10px] text-zinc-400 font-bold flex justify-between">
              <span>ARTIFACT RECONCILIATION STATUS</span>
              <span className="text-zinc-500">P0 MATCH COMPARISON</span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="p-2 rounded-lg bg-zinc-900/60 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-indigo-300">TNT-TH-001:</span>
                  <span className="text-zinc-400 ml-1.5 text-[10px]">Tenant Manifest</span>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  NOT APPLICABLE / PENDING
                </span>
              </div>

              <div className="p-2 rounded-lg bg-zinc-900/60 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-cyan-300">DS-901-PILOT:</span>
                  <span className="text-zinc-400 ml-1.5 text-[10px]">Pilot Dataset</span>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  NOT APPLICABLE (NON-LIVE)
                </span>
              </div>

              <div className="p-2 rounded-lg bg-zinc-900/60 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-purple-300">FIOS-EVIDENCE-PKG:</span>
                  <span className="text-zinc-400 ml-1.5 text-[10px]">13 Manifests / Gold Master</span>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold">
                  REGISTERED / PENDING VERIFICATION
                </span>
              </div>
            </div>
          </div>

          {/* Right: P0 Immutable Core Verification */}
          <div className="p-3 rounded-xl bg-black/60 border border-white/5 space-y-2">
            <div className="text-[10px] text-zinc-400 font-bold flex justify-between">
              <span>CANONICAL P0 INVARIANTS (FROZEN CORE)</span>
              <Lock className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-2 rounded-lg bg-zinc-900/60 border border-white/5">
                <div className="text-zinc-500">P0 MERKLE ROOT:</div>
                <div className="font-mono text-emerald-400 font-bold truncate">909ab814...fa4c68 🔒</div>
              </div>
              <div className="p-2 rounded-lg bg-zinc-900/60 border border-white/5">
                <div className="text-zinc-500">CANONICAL BLOCK:</div>
                <div className="font-mono text-emerald-400 font-bold">#849202 🔒</div>
              </div>
              <div className="p-2 rounded-lg bg-zinc-900/60 border border-white/5">
                <div className="text-zinc-500">CANONICAL SEALS:</div>
                <div className="font-mono text-emerald-400 font-bold">14,902 SEALS 🔒</div>
              </div>
              <div className="p-2 rounded-lg bg-zinc-900/60 border border-white/5">
                <div className="text-zinc-500">SSOT MUTATION:</div>
                <div className="font-mono text-emerald-400 font-bold">0 MUTATIONS 🔒</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Artifact Detailed Inspect Cards: TNT-TH-001 & DS-901-PILOT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Artifact Card 1: TNT-TH-001 */}
        <div className="p-6 rounded-[28px] bg-[#090d18] border-2 border-indigo-500/40 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400 text-indigo-300 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-indigo-100 font-serif">
                      TNT-TH-001
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 font-bold">
                      SOURCE_FILE
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400">tenant_audit_manifest_TNT-TH-001.json</div>
                </div>
              </div>

              <div className="text-right">
                <span className="pending-state-pulse text-[9px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  PENDING VERIFICATION
                </span>
                <div className="text-[9px] text-rose-400 font-bold mt-1">NO CANONICAL WRITE</div>
              </div>
            </div>

            {/* Source-Reported Evidence Fields */}
            <div className="space-y-2.5 text-xs">
              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                Source-Provided Manifest Properties (Non-Canonical &bull; Read-Only):
              </div>

              <div className="p-3 rounded-xl bg-black/70 border border-white/5 space-y-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-400">Organization:</span>
                  <span className="text-zinc-100 font-bold">MAEW HOLDINGS CO., LTD. (Sovereign HQ)</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-400">Isolation Mode:</span>
                  <span className="text-cyan-300 font-bold">Sovereign Physical Hardware Isolation</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-400">Active Release:</span>
                  <span className="text-emerald-300 font-bold">v2.8.0-GA-SEAL</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-400">Timestamp:</span>
                  <span className="text-zinc-300">2026-08-01T14:58:13.449Z</span>
                </div>
              </div>

              {/* Source-Provided Cryptographic Claims */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-2.5 rounded-xl bg-black/60 border border-white/5 space-y-1">
                  <div className="text-zinc-500">KEY FINGERPRINT (SOURCE):</div>
                  <div className="text-indigo-300 font-bold truncate">0xTH-990A-F11E-8C2A-4F11</div>
                </div>
                <div className="p-2.5 rounded-xl bg-black/60 border border-white/5 space-y-1">
                  <div className="text-zinc-500">CRYPTO PROOF (SOURCE):</div>
                  <div className="text-amber-300 font-bold truncate">sha256_tenant_audit_tnt_th_001_sealed</div>
                </div>
              </div>

              {/* Source Quota Metrics */}
              <div className="p-2.5 rounded-xl bg-black/60 border border-white/5 space-y-1 text-[10px]">
                <div className="text-zinc-500 flex justify-between">
                  <span>QUOTA TELEMETRY (SOURCE-REPORTED):</span>
                  <span className="text-zinc-400">CPU 32% &bull; Storage 480/2000 GB &bull; 142.8M Req/mo</span>
                </div>
              </div>

              {/* Cryptographic Binding Record */}
              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-1 text-[10px]">
                <div className="font-bold text-indigo-300 flex items-center justify-between">
                  <span>CRYPTOGRAPHIC BINDING RECORD</span>
                  <span className="text-amber-300">VERIFICATION: PENDING</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-zinc-400">
                  <div>Artifact Digest: <strong className="text-zinc-300">NOT COMPUTED</strong></div>
                  <div>Merkle Anchor: <strong className="text-zinc-300">CANONICAL_P0_REQUIRED</strong></div>
                  <div>Block Binding: <strong className="text-zinc-300">PENDING</strong></div>
                  <div>Mutation Authority: <strong className="text-emerald-400">NONE (0 MUTATIONS)</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* Tenant Isolation Boundary */}
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[10px] text-rose-200 space-y-1">
            <div className="font-bold text-rose-300 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>TENANT ISOLATION BOUNDARY: STRICTLY ISOLATED</span>
            </div>
            <p className="text-zinc-400 text-[9px] leading-relaxed">
              `TNT-TH-001` is strictly isolated to its tenant evidence namespace. No cross-tenant promotion, no cross-tenant evidence inheritance, and zero authority to modify global canonical state.
            </p>
          </div>
        </div>

        {/* Artifact Card 2: DS-901-PILOT */}
        <div className="p-6 rounded-[28px] bg-[#090d18] border-2 border-cyan-500/40 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-300 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-cyan-100 font-serif">
                      DS-901-PILOT
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold">
                      SOURCE_FILE
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400">maew_fios_pilot_dataset.json</div>
                </div>
              </div>

              <div className="text-right">
                <span className="pending-state-pulse text-[9px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  PENDING VERIFICATION
                </span>
                <div className="text-[9px] text-rose-400 font-bold mt-1">NON-LIVE &bull; NO CANONICAL WRITE</div>
              </div>
            </div>

            {/* Source-Reported Dataset Metrics */}
            <div className="space-y-2.5 text-xs">
              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                Source-Provided Dataset Attribution (Non-Live &bull; Read-Only):
              </div>

              <div className="p-3 rounded-xl bg-black/70 border border-white/5 space-y-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-400">Manifesto:</span>
                  <span className="text-zinc-100 font-bold">MAEW Ω∞ FIOS ULTIMATE v2.1 LTS</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-400">Governing Body:</span>
                  <span className="text-cyan-300 font-bold">Maew &amp; Partners Fiduciary Control</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-400">Asset Class:</span>
                  <span className="text-emerald-300 font-bold">Sovereign Managed Securities &amp; Equities</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-400">Timestamp:</span>
                  <span className="text-zinc-300">2026-08-03T04:31:50.500Z</span>
                </div>
              </div>

              {/* 4 Factor Quantitative Breakdown (Source Data) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                <div className="p-2 rounded-lg bg-black/60 border border-white/5 text-center">
                  <div className="text-zinc-500 font-bold">QUALITY (35%)</div>
                  <div className="text-emerald-400 font-bold">+2.15 &alpha;</div>
                  <div className="text-[9px] text-purple-300">z: +2.31</div>
                </div>
                <div className="p-2 rounded-lg bg-black/60 border border-white/5 text-center">
                  <div className="text-zinc-500 font-bold">VALUE (20%)</div>
                  <div className="text-emerald-400 font-bold">+1.84 &alpha;</div>
                  <div className="text-[9px] text-purple-300">z: +1.45</div>
                </div>
                <div className="p-2 rounded-lg bg-black/60 border border-white/5 text-center">
                  <div className="text-zinc-500 font-bold">MOMENTUM (25%)</div>
                  <div className="text-emerald-400 font-bold">+2.76 &alpha;</div>
                  <div className="text-[9px] text-purple-300">z: +2.85</div>
                </div>
                <div className="p-2 rounded-lg bg-black/60 border border-white/5 text-center">
                  <div className="text-zinc-500 font-bold">VOLATILITY (20%)</div>
                  <div className="text-amber-400 font-bold">-0.42 &alpha;</div>
                  <div className="text-[9px] text-zinc-400">z: -0.92</div>
                </div>
              </div>

              {/* Backtest Reported */}
              <div className="p-2.5 rounded-xl bg-black/60 border border-white/5 space-y-1 text-[10px]">
                <div className="text-zinc-400 flex justify-between font-bold">
                  <span>BACKTEST REPORTED (PILOT DATASET):</span>
                  <span className="text-cyan-300">30D: +12.42% &bull; Sharpe: 2.41 &bull; MaxDD: -4.18%</span>
                </div>
              </div>

              {/* Cryptographic Binding Record */}
              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-1 text-[10px]">
                <div className="font-bold text-cyan-300 flex items-center justify-between">
                  <span>CRYPTOGRAPHIC BINDING RECORD</span>
                  <span className="text-amber-300">VERIFICATION: PENDING</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-zinc-400">
                  <div>Artifact Digest: <strong className="text-zinc-300">NOT COMPUTED</strong></div>
                  <div>Merkle Anchor: <strong className="text-zinc-300">CANONICAL_P0_REQUIRED</strong></div>
                  <div>Block Binding: <strong className="text-zinc-300">PENDING</strong></div>
                  <div>Mutation Authority: <strong className="text-emerald-400">NONE (0 MUTATIONS)</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Safety Boundary */}
          <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-200 space-y-1">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>FINANCIAL SAFETY BOUNDARY: ENFORCED</span>
            </div>
            <p className="text-zinc-400 text-[9px] leading-relaxed">
              Treated strictly as a <strong>NON-LIVE PILOT DATASET</strong>. Not represented as live performance, guaranteed return, or production investment execution. Investment decision authority = <strong>NONE</strong>.
            </p>
          </div>
        </div>
      </div>
        </>
      )}

      {/* FIOS Evidence Package Master (13 Manifests, Dual-Key Signatures, 10 Certification Dimensions) */}
      <FiosEvidencePackageMaster />

      {/* Phase 3 Upgrade Manifest Modal */}
      <Phase3UpgradeManifestModal isOpen={isManifestOpen} onClose={() => setIsManifestOpen(false)} />
    </div>
  );
};
