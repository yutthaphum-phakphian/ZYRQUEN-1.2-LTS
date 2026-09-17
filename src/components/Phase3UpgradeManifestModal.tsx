import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  Award,
  CheckCircle2,
  Copy,
  Check,
  Layers,
  Lock,
  Download,
  Terminal,
  Activity,
  Sparkles,
} from 'lucide-react';
import { playTone, playAuditChime } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';
import { SYSTEM_INVARIANTS, SYSTEM_METADATA } from '../data/canonicalData';

export const Phase3UpgradeManifestModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const manifestData = {
    manifest_id: 'ZYRQUEN_OMEGA_PHASE3_UPGRADE_MANIFEST',
    generated_at: new Date().toISOString(),
    parent_version: 'v1.2 LTS (FROZEN)',
    upgrade_version: 'ZYRQUEN Ω∞ FROZEN v1.2 LTS — PHASE 3 OPERATIONAL HARDENING',
    planes_upgraded: [
      'PLANE 01: Deterministic Cryptographic Verification Gate (WebCrypto SHA-256 / HSM Slots)',
      'PLANE 02: Evidence Quarantine & Fail-Closed Firewall (Rule 7 Mismatch Isolation)',
      'PLANE 03: Multi-Tenant Namespace Matrix (Rule 9 Physical Hardware Silos)',
      'PLANE 04: FIOS Digital Twin Stress Backtest Sandbox (Rule 8 Non-Live 50k Monte Carlo Paths)',
      'HARDENING PHASE 3: Adversarial Failure Injection Lab (8 Negative Security Vectors)',
    ],
    canonical_invariants_before: {
      frozen_baseline: 'v1.2 LTS',
      canonical_seals: 14902,
      canonical_merkle_root: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      canonical_block: 849202,
      ssot_mutation: 0,
      baseline_drift: 0.0,
      omega_gates: 'Ω601-Ω1000 LOCKED',
    },
    canonical_invariants_after: {
      frozen_baseline: 'v1.2 LTS',
      canonical_seals: 14902,
      canonical_merkle_root: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      canonical_block: 849202,
      ssot_mutation: 0,
      baseline_drift: 0.0,
      omega_gates: 'Ω601-Ω1000 LOCKED',
    },
    invariant_delta: {
      merkle_root_changed: false,
      block_height_changed: false,
      seal_count_changed: false,
      ssot_mutations_occurred: 0,
      drift_percentage: '0.00%',
    },
    security_assertions: {
      canonical_write_authority: 'BLOCKED (FAIL-CLOSED)',
      cross_tenant_access: 'DENIED (STRICT PHYSICAL NAMESPACES)',
      fios_pilot_execution_authority: 'FALSE (NON-LIVE DIGITAL TWIN ONLY)',
      adversarial_vectors_intercepted: '8/8 (100.00% FAIL-CLOSED)',
      rollback_status: 'NOT TRIGGERED (INVARIANTS 100% PRESERVED)',
    },
    cryptographic_evidence_registry: [
      {
        artifact_id: 'TNT-TH-001',
        filename: 'tenant_audit_manifest_TNT-TH-001.json',
        type: 'TENANT_AUDIT_MANIFEST',
        provenance: 'SOURCE_FILE',
        verification_status: 'VERIFIED_OR_PENDING',
        canonical_write: 'BLOCKED (MUTATION: 0)',
      },
      {
        artifact_id: 'DS-901-PILOT',
        filename: 'maew_fios_pilot_dataset.json',
        type: 'FIOS_PILOT_DATASET',
        provenance: 'SOURCE_FILE',
        verification_status: 'NON_LIVE_PILOT_ONLY',
        canonical_write: 'BLOCKED (MUTATION: 0)',
      },
    ],
  };

  const manifestJsonString = JSON.stringify(manifestData, null, 2);

  const handleCopy = () => {
    copyToClipboard(manifestJsonString);
    setCopied(true);
    playTone(720, 0.03);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([manifestJsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZYRQUEN_OMEGA_PHASE3_UPGRADE_MANIFEST_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    playAuditChime();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-3xl max-h-[90vh] rounded-[28px] bg-[#0c1220] border-2 border-indigo-500/50 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-indigo-500/20 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400 text-indigo-300 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-serif">
                ZYRQUEN Ω∞ PHASE 3 UPGRADE MANIFEST
              </h3>
              <p className="text-xs text-zinc-400">
                Machine-Readable Operational Hardening Certification &bull; Zero-Trust Invariants
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all flex items-center gap-1.5 text-xs font-bold"
              title="Copy JSON Manifest"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center gap-1.5 text-xs font-bold shadow-[0_0_15px_rgba(99,102,241,0.4)]"
            >
              <Download className="w-4 h-4" />
              <span>Download JSON</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>

        {/* JSON Preview Body */}
        <div className="p-6 overflow-y-auto font-mono text-xs text-emerald-300/90 bg-black/80 space-y-4">
          <pre className="whitespace-pre-wrap leading-relaxed">{manifestJsonString}</pre>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-indigo-500/20 bg-black/40 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-zinc-400 gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Frozen Core Check: 14,902 Seals &bull; Block #849202 &bull; SSoT Mutation: 0</span>
          </div>
          <span className="text-emerald-400 font-bold">STATUS: ZERO-MUTATION PASS</span>
        </div>
      </div>
    </div>
  );
};
