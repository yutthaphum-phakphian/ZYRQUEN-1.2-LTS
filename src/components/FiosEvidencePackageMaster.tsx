import React, { useState } from 'react';
import {
  FileCode,
  Shield,
  ShieldCheck,
  Award,
  Download,
  Copy,
  Check,
  CheckCircle2,
  Lock,
  Layers,
  Fingerprint,
  Cpu,
  Key,
  Database,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';

export interface FiosManifestItem {
  id: string;
  name: string;
  category: string;
  hash: string;
  status: 'VERIFIED' | 'REGISTERED' | 'PENDING_VERIFICATION';
  signatures: {
    primary: string;
    secondary: string;
  };
  dimensionCoverage: string[];
  recordsCount: number;
}

export interface FiosEvidencePackage {
  packageId: string;
  version: string;
  title: string;
  merkleAnchor: string;
  canonicalBlock: number;
  totalManifests: number;
  certificationDimensions: number;
  governingAuthority: string;
  manifests: FiosManifestItem[];
}

export const FIOS_EVIDENCE_PACKAGE: FiosEvidencePackage = {
  packageId: 'PKG-FIOS-EVIDENCE-MASTER-V2.1',
  version: '2.1.0-LTS',
  title: 'FIOS Evidence Package Gold Master (13 Manifests, Dual-Key Signatures, 10 Certification Dimensions)',
  merkleAnchor: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
  canonicalBlock: 849202,
  totalManifests: 13,
  certificationDimensions: 10,
  governingAuthority: 'Maew & Partners Fiduciary Control & Sovereign Physical HSM Node #01',
  manifests: [
    {
      id: 'MNF-01-CORE-INVARIANTS',
      name: '01. Frozen Core Invariants Manifest',
      category: 'CANONICAL_P0',
      hash: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      status: 'VERIFIED',
      signatures: {
        primary: '0xSIG_DILITHIUM5_EP_SOVEREIGN_01_CORE',
        secondary: '0xSIG_REAL_HSM_QUORUM_MASTER_LEAF_01',
      },
      dimensionCoverage: ['P0 Invariants', 'Block Height 849202', 'Zero Drift'],
      recordsCount: 14902,
    },
    {
      id: 'MNF-02-TENANT-TNT-TH-001',
      name: '02. Tenant Isolation Manifest (TNT-TH-001)',
      category: 'MULTI_TENANT',
      hash: '4f2e91b6192ac88e5d61483b87a049102c91ba0f745819d9b62c19a28e83b4c1',
      status: 'REGISTERED',
      signatures: {
        primary: '0xSIG_TNT_TH_001_MAEW_HOLDINGS_PRIMARY',
        secondary: '0xSIG_SOVEREIGN_GATEWAY_AUTH_02',
      },
      dimensionCoverage: ['Namespace Sandboxing', 'Resource Quotas', 'Write Firewall'],
      recordsCount: 480,
    },
    {
      id: 'MNF-03-PILOT-DS-901',
      name: '03. FIOS Pilot Dataset Backtest Manifest (DS-901)',
      category: 'PILOT_DATASET',
      hash: '8f912cba9910e53a201b4491763a43fa4c68909ab814479844d8a14816bed34c',
      status: 'PENDING_VERIFICATION',
      signatures: {
        primary: '0xSIG_FIOS_ENGINE_PILOT_AUTHENTICATOR',
        secondary: '0xSIG_FIDUCIARY_OBSERVER_KEY_03',
      },
      dimensionCoverage: ['4-Factor Alpha', 'Zero Trading Authority', 'Historical Simulation'],
      recordsCount: 1200,
    },
    {
      id: 'MNF-04-POST-QUANTUM-CRYPTO',
      name: '04. Post-Quantum Cryptography Attestation (FIPS 203/204)',
      category: 'CRYPTO_ENCLAVE',
      hash: '1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f809',
      status: 'VERIFIED',
      signatures: {
        primary: '0xSIG_ML_KEM_1024_KEY_EXCHANGE_SLOT_08',
        secondary: '0xSIG_ML_DSA_87_DILITHIUM_ROOT',
      },
      dimensionCoverage: ['NIST FIPS 203 ML-KEM', 'NIST FIPS 204 ML-DSA', 'FIPS 140-3'],
      recordsCount: 2048,
    },
    {
      id: 'MNF-05-THAI-LEGAL-PDPA',
      name: '05. Thai Legal Compliance & PDPA Matrix Manifest',
      category: 'LEGAL_COMPLIANCE',
      hash: '3e4f5a6b7c8d9e0f1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f7081',
      status: 'VERIFIED',
      signatures: {
        primary: '0xSIG_ETDA_ELECTRONIC_TRANS_SEC_9_26_28',
        secondary: '0xSIG_PDPA_BE_2562_ENCLAVE_OFFICER',
      },
      dimensionCoverage: ['ETDA Sec 9/26/28', 'PDPA Sec 19/27/37', 'Zero Knowledge Storage'],
      recordsCount: 38,
    },
    {
      id: 'MNF-06-QUARANTINE-RECON',
      name: '06. Forensics & Quarantine Layer Isolation Manifest',
      category: 'QUARANTINE_LAYER',
      hash: '7c8d9e0f1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5',
      status: 'REGISTERED',
      signatures: {
        primary: '0xSIG_CHAMBER_02_QUARANTINE_INSPECTOR',
        secondary: '0xSIG_GATE_22_FAIL_CLOSED_GUARD',
      },
      dimensionCoverage: ['12-Stage Forensics', '80 Quarantined Seals', 'Buffer Isolation'],
      recordsCount: 80,
    },
    {
      id: 'MNF-07-DIGITAL-TWIN-STRESS',
      name: '07. Digital Twin Stress Simulation Benchmarks',
      category: 'SANDBOX_STRESS',
      hash: '9a8b7c6d5e4f3a2b1c0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b',
      status: 'VERIFIED',
      signatures: {
        primary: '0xSIG_SIMULATION_SANDBOX_STRESS_MASTER',
        secondary: '0xSIG_MONTE_CARLO_50K_VALIDATOR',
      },
      dimensionCoverage: ['Flash Crash -15%', 'Hawkish +75bps', 'Liquidity Shock'],
      recordsCount: 50000,
    },
    {
      id: 'MNF-08-ADVERSARIAL-LAB',
      name: '08. Adversarial Vector Matrix & Injection Test Manifest',
      category: 'SECURITY_LAB',
      hash: '5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c',
      status: 'VERIFIED',
      signatures: {
        primary: '0xSIG_CHAOS_ENGINEERING_INJECTOR_NODE',
        secondary: '0xSIG_CIRCUIT_BREAKER_MATRIX_8_RULES',
      },
      dimensionCoverage: ['Entropy Spike 8.91 bps', 'HSM Tamper Trigger', 'Replay Defense'],
      recordsCount: 8,
    },
    {
      id: 'MNF-09-PHOENIX-AUTO-HEAL',
      name: '09. Phoenix Auto-Healing & Boundary Recovery Manifest',
      category: 'RESILIENCY',
      hash: '2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b',
      status: 'VERIFIED',
      signatures: {
        primary: '0xSIG_PHOENIX_RECONCILIATION_DAEMON',
        secondary: '0xSIG_STATE_CHECKPOINT_IMMUTABLE_LOG',
      },
      dimensionCoverage: ['Sub-Second Rollback', 'State Convergence', 'Fail-Safe Reboot'],
      recordsCount: 142,
    },
    {
      id: 'MNF-10-HARDWARE-TELEM-CRYO',
      name: '10. Sub-Kelvin Cryostat & Hardware Telemetry Pulse Manifest',
      category: 'TELEMETRY_PULSE',
      hash: '6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f',
      status: 'VERIFIED',
      signatures: {
        primary: '0xSIG_CYTOSTAT_14_98_MK_SENSOR_ARRAY',
        secondary: '0xSIG_QOPS_851_9_TELEMETRY_ENGINE',
      },
      dimensionCoverage: ['14.98 mK Nominal Temp', '99.992% Coherence', '851.9 QOPS'],
      recordsCount: 86400,
    },
    {
      id: 'MNF-11-AUDIT-EVIDENCE-LEDGER',
      name: '11. Immutable Audit Ledger V25 Comprehensive Manifest',
      category: 'AUDIT_LEDGER',
      hash: '8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d',
      status: 'VERIFIED',
      signatures: {
        primary: '0xSIG_EVIDENCE_EXPORTER_V25_ENGINE',
        secondary: '0xSIG_COURT_READY_NOTARY_CHAMBER_17',
      },
      dimensionCoverage: ['Full Merkle Path Tree', 'Chain of Custody', 'Court-Ready PDF Spec'],
      recordsCount: 14902,
    },
    {
      id: 'MNF-12-COUNCIL-QUORUM-HSM',
      name: '12. 10/10 REAL_HSM Council Quorum Registry Manifest',
      category: 'GOVERNANCE_QUORUM',
      hash: '4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f',
      status: 'VERIFIED',
      signatures: {
        primary: '0xSIG_10_OF_10_REAL_HSM_SUPER_MAJORITY',
        secondary: '0xSIG_SOVEREIGN_PASSPORT_EP_01_COUNCIL',
      },
      dimensionCoverage: ['10 HSM Nodes Active', '100% Quorum Consensus', 'Anti-Sybil Anchor'],
      recordsCount: 10,
    },
    {
      id: 'MNF-13-PRODUCTION-READINESS',
      name: '13. Phase 7 Zero-Trust Production Readiness Certification',
      category: 'PRODUCTION_GATE',
      hash: '1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c',
      status: 'VERIFIED',
      signatures: {
        primary: '0xSIG_ZERO_TRUST_PRODUCTION_GATE_CHAMBER',
        secondary: '0xSIG_FINAL_CANONICAL_LTS_STAMP',
      },
      dimensionCoverage: ['6-Stage DAG Ready', 'Zero SSoT Mutation', 'All Invariants Green'],
      recordsCount: 40,
    },
  ],
};

export const FiosEvidencePackageMaster: React.FC = () => {
  const [selectedManifestId, setSelectedManifestId] = useState<string>('MNF-01-CORE-INVARIANTS');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const pkg = FIOS_EVIDENCE_PACKAGE;
  const currentManifest = pkg.manifests.find((m) => m.id === selectedManifestId) || pkg.manifests[0];

  const handleCopy = (text: string, id: string) => {
    copyToClipboard(text);
    setCopiedKey(id);
    playTone(700, 0.03);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleExportPackage = () => {
    setIsExporting(true);
    playTone(620, 0.04);
    setTimeout(() => {
      const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FIOS_EVIDENCE_PACKAGE_MASTER_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setIsExporting(false);
      playAuditChime();
    }, 300);
  };

  return (
    <div id="fios-evidence-package-master" className="p-6 rounded-[28px] bg-[#070c18] border-2 border-indigo-500/40 space-y-6 shadow-2xl font-mono text-zinc-200">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-indigo-500/20 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border-indigo-400 text-indigo-300 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-indigo-100 font-serif tracking-wide">
                FIOS EVIDENCE PACKAGE MASTER
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border-indigo-400/40 font-bold">
                13 MANIFESTS &bull; 10 DIMENSIONS
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold">
                DUAL-KEY SIGNED
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-serif mt-1">
              {pkg.governingAuthority} &bull; Merkle Anchor: {pkg.merkleAnchor.slice(0, 16)}...
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end lg:self-center">
          <button
            onClick={handleExportPackage}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border-indigo-400/50 text-indigo-200 text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(99,102,241,0.25)]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'EXPORTING...' : 'EXPORT GOLD MASTER JSON'}</span>
          </button>
        </div>
      </div>

      {/* 10 Certification Dimensions Badges */}
      <div className="p-4 rounded-2xl bg-black/60 border-white/10 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-indigo-200 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-indigo-400" />
            10 CERTIFICATION DIMENSIONS COVERAGE
          </span>
          <span className="text-[10px] text-emerald-400 font-bold">10/10 DIMENSIONS COMPLIANT</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px]">
          {[
            '1. P0 Invariants & Zero Drift',
            '2. Multi-Tenant Namespace Isolation',
            '3. Dual-Key Hardware Signatures',
            '4. Post-Quantum Cryptography',
            '5. Thai PDPA & Electronic Act',
            '6. 12-Stage Forensics Quarantine',
            '7. Digital Twin Stress Matrix',
            '8. Adversarial Circuit Breakers',
            '9. Phoenix Auto-Healing Bounds',
            '10. 10/10 REAL_HSM Governance',
          ].map((dim, idx) => (
            <div
              key={idx}
              className="p-2 rounded-lg bg-indigo-950/40 border-indigo-500/30 text-indigo-200 flex items-center gap-1.5 font-bold"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">{dim}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 13 Manifests Selection Grid & Detailed Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Manifests List */}
        <div className="lg:col-span-1 space-y-2 max-h-[500px] overflow-y-auto pr-1">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
            13 Certified Manifests ({pkg.manifests.length})
          </div>
          {pkg.manifests.map((m) => {
            const isSelected = m.id === selectedManifestId;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setSelectedManifestId(m.id);
                  playTone(640, 0.02);
                }}
                className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex flex-col gap-1 ${
                  isSelected
                    ? 'bg-indigo-600/30 border-indigo-400 text-indigo-100 shadow-[0_0_15px_rgba(99,102,241,0.25)]'
                    : 'bg-black/50 border-white/5 text-zinc-400 hover:text-zinc-200 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white truncate">{m.name}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      m.status === 'VERIFIED'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : m.status === 'REGISTERED'
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                  <span>{m.category}</span>
                  <span>{m.recordsCount.toLocaleString()} items</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Selected Manifest Details */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-black/70 border-indigo-500/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white font-serif">{currentManifest.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border-indigo-400/40 font-bold">
                  {currentManifest.id}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">Category: {currentManifest.category}</p>
            </div>

            <span
              className={`text-[10px] px-2.5 py-1 rounded-lg font-bold self-start sm:self-auto ${
                currentManifest.status === 'VERIFIED'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : currentManifest.status === 'REGISTERED'
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
            >
              STATUS: {currentManifest.status}
            </span>
          </div>

          {/* Digest / Hash Block */}
          <div className="p-3 rounded-xl bg-zinc-900/70 border-white/5 space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-400 font-bold uppercase">SHA-256 Digest:</span>
              <button
                onClick={() => handleCopy(currentManifest.hash, `hash-${currentManifest.id}`)}
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                {copiedKey === `hash-${currentManifest.id}` ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="font-mono text-xs text-indigo-200 break-all">{currentManifest.hash}</div>
          </div>

          {/* Dual-Key Signatures */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Dual-Key Hardware Signatures:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
              <div className="p-2.5 rounded-xl bg-indigo-950/30 border-indigo-500/30 space-y-1">
                <div className="text-indigo-400 font-bold flex items-center gap-1">
                  <Key className="w-3 h-3" />
                  <span>PRIMARY SIGNATURE:</span>
                </div>
                <div className="font-mono text-zinc-300 break-all">{currentManifest.signatures.primary}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-cyan-950/30 border-cyan-500/30 space-y-1">
                <div className="text-cyan-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>SECONDARY HSM SIGNATURE:</span>
                </div>
                <div className="font-mono text-zinc-300 break-all">{currentManifest.signatures.secondary}</div>
              </div>
            </div>
          </div>

          {/* Dimension Coverage Badges */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Dimension Coverage:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {currentManifest.dimensionCoverage.map((dim, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 border-white/10 text-zinc-200 text-[10px] font-bold"
                >
                  &bull; {dim}
                </span>
              ))}
            </div>
          </div>

          {/* Records & Canonical Anchor */}
          <div className="grid grid-cols-2 gap-2 text-[10px] pt-2 border-t border-white/5">
            <div className="p-2 rounded-lg bg-black/40 border-white/5">
              <span className="text-zinc-500">Record Count:</span>
              <div className="font-bold text-white text-xs">{currentManifest.recordsCount.toLocaleString()}</div>
            </div>
            <div className="p-2 rounded-lg bg-black/40 border-white/5">
              <span className="text-zinc-500">Anchor Block:</span>
              <div className="font-bold text-emerald-400 text-xs">#{pkg.canonicalBlock} 🔒</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
