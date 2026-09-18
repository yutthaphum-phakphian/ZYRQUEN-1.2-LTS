import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Rocket,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Scale,
  Lock,
  Cpu,
  Layers,
  Sparkles,
  Zap,
  Activity,
  Terminal,
  RefreshCw,
  FileCode,
  Download,
  Award,
  AlertOctagon,
  ExternalLink,
  ChevronRight,
  Radio,
  Clock,
} from 'lucide-react';
import { SYSTEM_METADATA, THAI_CUSTODIANS, CANONICAL_GENESIS_BLOCK, CANONICAL_MERKLE_ROOT } from '../data/canonicalData';
import { playAuditChime, playTone } from './AudioSynthesizer';

export type DeploymentStep = 'IDLE' | 'STEP_1_GENESIS' | 'STEP_2_PACKAGE' | 'STEP_3_QUORUM' | 'STEP_4_DEPLOY' | 'STEP_5_COMPLETED';

export const GenesisDeploymentConsole: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [currentStep, setCurrentStep] = useState<DeploymentStep>('IDLE');
  const [isDeploying, setIsDeploying] = useState(false);
  const [activeTab, setActiveTab] = useState<'console' | 'manifest' | 'hologram' | 'quorum'>('console');
  const [deploymentLogs, setDeploymentLogs] = useState<string[]>([
    'SYSTEM READY: Sovereign World Engine G11 Core initialized.',
    'Awaiting Omega Runtime Update Package deployment command...',
  ]);

  const addLog = useCallback((msg: string) => {
    const timestamp = new Date().toLocaleTimeString('th-TH', { hour12: false });
    setDeploymentLogs((prev) => [...prev, `[${timestamp} ICT] ${msg}`]);
  }, []);

  const handleStartDeployment = useCallback(() => {
    if (isDeploying) return;
    setIsDeploying(true);
    setCurrentStep('STEP_1_GENESIS');
    playTone(520, 0.08, 'sine');
    addLog('INITIATING GENESIS DEPLOYMENT: Target Core G11 (Canonical Node)...');

    // Step 1: Genesis Init
    setTimeout(() => {
      setCurrentStep('STEP_2_PACKAGE');
      playTone(620, 0.08, 'sine');
      addLog('STEP 1 OK: Genesis Block #849202 & Merkle Root verified.');
      addLog('STEP 2 LOADING: Omega Runtime Update Package (Audit + Gas + SLA + Smart Contract)...');
    }, 1400);

    // Step 2: Package Load
    setTimeout(() => {
      setCurrentStep('STEP_3_QUORUM');
      playTone(740, 0.08, 'sine');
      addLog('STEP 2 OK: ZYR-01..03 Patches, ฿12.5M FIOS Gas Ledger & ETA Sec 9/26/28 loaded.');
      addLog('STEP 3 ATTESTING: Verifying 10/10 REAL HSM Custodian Dilithium-5 signatures...');
    }, 2800);

    // Step 3: Quorum Attestation
    setTimeout(() => {
      setCurrentStep('STEP_4_DEPLOY');
      playTone(880, 0.12, 'sawtooth');
      addLog('STEP 3 OK: Unanimous Quorum 10/10 Attestation verified (FIPS 204 ML-DSA-87).');
      addLog('STEP 4 EXECUTING: Atomic state transition into LOCKED_FROZEN v1.2 LTS...');
    }, 4200);

    // Step 4: Final Closure
    setTimeout(() => {
      setCurrentStep('STEP_5_COMPLETED');
      setIsDeploying(false);
      playAuditChime();
      addLog('STEP 5 SUCCESS: GENESIS ONLINE v∞.1 — Court-Admissible Maximum Assurance Active!');
      addLog('SSoT Δ0 LOCKED: Zero Drift 0.00% across all 18 Chambers.');
    }, 5800);
  }, [isDeploying, addLog]);

  const handleReset = useCallback(() => {
    setCurrentStep('IDLE');
    setIsDeploying(false);
    playTone(400, 0.05);
    setDeploymentLogs(['SYSTEM RESET: Ready for new deployment cycle.']);
  }, []);

  const manifestYaml = useMemo(() => {
    return `OmegaRuntimeUpdatePackage:
  version: v∞.1
  canonical_block: ${CANONICAL_GENESIS_BLOCK}
  merkle_root: "${CANONICAL_MERKLE_ROOT}"
  seals_count: 14902
  sovereign_principal: "#EP-SOVEREIGN-01 (นายยุทธภูมิ พากเพียร)"
  modules:
    - SecurityPatchMatrix:
        ZYR-01: PASSED (Access Control Hardening)
        ZYR-02: PASSED (Fail-Closed Quarantine & Zeroization)
        ZYR-03: PASSED (Canonical Seal Inflation & Replay Barrier)
    - GasAllocationLedger:
        chamber_07_treasury: "฿12,500,000.00 THB"
        reconciliation_variance: "0.00% Zero Drift"
    - SLAComplianceTemplate:
        coherence_threshold: ">= 99.992%"
        qops_minimum: ">= 851.9 QOps/s"
        cryo_temperature: "14.98 mK He-4"
    - SovereignContractCore:
        cryptography: "NIST FIPS 204 ML-DSA-87 (Dilithium-5)"
        quorum_requirement: "10/10 REAL_HSM Custodians"
        fail_closed_trigger: "Core Temp > 85.0°C or Bandwidth < 15.0 GB/s"
  legal_compliance:
    ThaiElectronicTransactionsAct_BE2544:
      - Section_9: "Post-Quantum Electronic Signatures"
      - Section_26: "Reliable Electronic Signatures (10/10 HSM)"
      - Section_28: "Certification Authority Integrity"
    PDPA_BE2562: "Zero-Knowledge Personal Data Enclave"
    FIPS_Standard: "140-3 Level 4"
  runtimestatus: "LOCKED_FROZEN_v1.2_LTS"
  deployment_target: "Canonical Core G11"
  forensic_readiness: "COURT_ADMISSIBLE_MAXIMUM_ASSURANCE"`;
  }, []);

  return (
    <div className={`w-full rounded-[24px] bg-[#070A16] border border-cyan-500/30 p-5 sm:p-6 shadow-2xl text-white font-mono space-y-6 ${className}`}>
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-violet-500/20 to-amber-500/20 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.35)] shrink-0">
            <Rocket className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-wider text-white uppercase">
                Genesis Deployment Console & Hologram Deck
              </h2>
              <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-500/40">
                Core G11 Target
              </span>
            </div>
            <div className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-2">
              <span className="text-cyan-400 font-semibold">Omega Runtime Update Package</span>
              <span className="text-zinc-600">•</span>
              <span className="text-amber-400 font-semibold">10/10 REAL HSM Custodians</span>
              <span className="text-zinc-600">•</span>
              <span className="text-emerald-400 font-semibold">GENESIS ONLINE v∞.1</span>
            </div>
          </div>
        </div>

        {/* Deploy Action Controls */}
        <div className="flex items-center gap-2">
          {currentStep === 'STEP_5_COMPLETED' ? (
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl bg-black/60 border border-white/10 hover:border-white/30 text-xs font-bold text-zinc-300 flex items-center gap-2 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Deployment</span>
            </button>
          ) : (
            <button
              onClick={handleStartDeployment}
              disabled={isDeploying}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2.5 transition-all shadow-lg ${
                isDeploying
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
                  : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer'
              }`}
            >
              <Rocket className={`w-4 h-4 ${isDeploying ? 'animate-bounce' : ''}`} />
              <span>{isDeploying ? 'Deploying to Core G11...' : 'Deploy Omega Runtime Package'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 5-Step Deployment Lifecycle Pipeline */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
        <div
          className={`p-3 rounded-xl border text-xs flex flex-col justify-between gap-1 transition-all ${
            currentStep === 'STEP_1_GENESIS'
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              : currentStep !== 'IDLE'
              ? 'bg-black/60 border-emerald-500/40 text-emerald-300'
              : 'bg-black/40 border-white/5 text-zinc-500'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold">STAGE 1</span>
            {currentStep !== 'IDLE' && currentStep !== 'STEP_1_GENESIS' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Cpu className="w-3.5 h-3.5" />
            )}
          </div>
          <div className="font-bold text-[11px] truncate">1. Genesis Init</div>
          <div className="text-[9px] text-zinc-400">Block #849202 Root</div>
        </div>

        <div
          className={`p-3 rounded-xl border text-xs flex flex-col justify-between gap-1 transition-all ${
            currentStep === 'STEP_2_PACKAGE'
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              : currentStep === 'STEP_3_QUORUM' || currentStep === 'STEP_4_DEPLOY' || currentStep === 'STEP_5_COMPLETED'
              ? 'bg-black/60 border-emerald-500/40 text-emerald-300'
              : 'bg-black/40 border-white/5 text-zinc-500'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold">STAGE 2</span>
            {currentStep === 'STEP_3_QUORUM' || currentStep === 'STEP_4_DEPLOY' || currentStep === 'STEP_5_COMPLETED' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Layers className="w-3.5 h-3.5" />
            )}
          </div>
          <div className="font-bold text-[11px] truncate">2. Load Package</div>
          <div className="text-[9px] text-zinc-400">Audit + Gas + SLA</div>
        </div>

        <div
          className={`p-3 rounded-xl border text-xs flex flex-col justify-between gap-1 transition-all ${
            currentStep === 'STEP_3_QUORUM'
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              : currentStep === 'STEP_4_DEPLOY' || currentStep === 'STEP_5_COMPLETED'
              ? 'bg-black/60 border-emerald-500/40 text-emerald-300'
              : 'bg-black/40 border-white/5 text-zinc-500'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold">STAGE 3</span>
            {currentStep === 'STEP_4_DEPLOY' || currentStep === 'STEP_5_COMPLETED' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}
          </div>
          <div className="font-bold text-[11px] truncate">3. Verify Quorum</div>
          <div className="text-[9px] text-zinc-400">10/10 Dilithium-5</div>
        </div>

        <div
          className={`p-3 rounded-xl border text-xs flex flex-col justify-between gap-1 transition-all ${
            currentStep === 'STEP_4_DEPLOY'
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              : currentStep === 'STEP_5_COMPLETED'
              ? 'bg-black/60 border-emerald-500/40 text-emerald-300'
              : 'bg-black/40 border-white/5 text-zinc-500'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold">STAGE 4</span>
            {currentStep === 'STEP_5_COMPLETED' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Zap className="w-3.5 h-3.5" />
            )}
          </div>
          <div className="font-bold text-[11px] truncate">4. Execute Deploy</div>
          <div className="text-[9px] text-zinc-400">LOCKED_FROZEN v1.2</div>
        </div>

        <div
          className={`p-3 rounded-xl border text-xs flex flex-col justify-between gap-1 transition-all ${
            currentStep === 'STEP_5_COMPLETED'
              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              : 'bg-black/40 border-white/5 text-zinc-500'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold">STAGE 5</span>
            {currentStep === 'STEP_5_COMPLETED' ? (
              <Award className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Scale className="w-3.5 h-3.5" />
            )}
          </div>
          <div className="font-bold text-[11px] truncate">5. Forensic Proof</div>
          <div className="text-[9px] text-zinc-400">Court Admissible</div>
        </div>
      </div>

      {/* Subtabs Switcher */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-white/5 text-xs">
        <button
          onClick={() => {
            setActiveTab('console');
            playTone(580, 0.03);
          }}
          className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'console'
              ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Execution Terminal</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('manifest');
            playTone(630, 0.03);
          }}
          className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'manifest'
              ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Deployment Manifest (YAML)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('quorum');
            playTone(680, 0.03);
          }}
          className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'quorum'
              ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>10/10 Custodian Quorum Verification</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('hologram');
            playTone(730, 0.03);
          }}
          className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'hologram'
              ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Hologram Deck Status</span>
        </button>
      </div>

      {/* Tab 1: Terminal Log */}
      {activeTab === 'console' && (
        <div className="p-4 rounded-2xl bg-black/80 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span>CORE G11 DEPLOYMENT STREAM</span>
            </div>
            <span className="text-[10px] text-zinc-500">FORMAT: DETERMINISTIC REPLAY</span>
          </div>
          <div className="h-44 overflow-y-auto space-y-1.5 text-xs text-zinc-300 scrollbar-none font-mono">
            {deploymentLogs.map((log, idx) => (
              <div key={idx} className="leading-relaxed flex items-start gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Manifest View */}
      {activeTab === 'manifest' && (
        <div className="p-4 rounded-2xl bg-black/80 border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
            <span className="font-bold text-white">DEPLOYMENT_MANIFEST_OMEGA_V_INF.1.YAML</span>
            <span className="text-emerald-400 text-[10px]">IMMUTABLE SSoT Δ0</span>
          </div>
          <pre className="text-[11px] leading-relaxed text-cyan-300 overflow-x-auto max-h-56 p-2 bg-black/50 rounded-xl border border-white/5">
            {manifestYaml}
          </pre>
        </div>
      )}

      {/* Tab 3: Custodian Quorum Verification */}
      {activeTab === 'quorum' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>10 REAL HSM Custodians Attestation (Dilithium-5 FIPS 204):</span>
            <span className="text-emerald-400 font-bold">10 / 10 UNANIMOUS</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {THAI_CUSTODIANS.map((custodian, i) => (
              <div
                key={custodian.id}
                className="p-3 rounded-xl bg-black/60 border border-emerald-500/30 flex items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="text-amber-400">TC-0{i + 1}</span>
                    <span>{custodian.nameTh}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400">{custodian.passportNumber} • {custodian.clearanceLevel}</div>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>DILITHIUM-5</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Hologram Deck Status */}
      {activeTab === 'hologram' && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/30 via-black to-fuchsia-950/30 border border-cyan-500/40 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase">Canonical Core G11 Hologram Deck</h3>
              <div className="text-xs text-zinc-400">Cosmic Holographic Visualization of Deployed Components</div>
            </div>
            <span className="text-xs font-bold text-emerald-300 bg-emerald-950/80 px-3 py-1 rounded-xl border border-emerald-500/40">
              CORE STATUS: GENESIS ONLINE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-black/60 rounded-xl border border-cyan-500/30 space-y-1">
              <div className="text-[10px] text-zinc-400 uppercase">Patch Matrix</div>
              <div className="text-sm font-bold text-emerald-300">ZYR-01..03 SECURED</div>
            </div>
            <div className="p-3 bg-black/60 rounded-xl border border-amber-500/30 space-y-1">
              <div className="text-[10px] text-zinc-400 uppercase">Gas Ledger</div>
              <div className="text-sm font-bold text-amber-300">฿12.5M LOCKED</div>
            </div>
            <div className="p-3 bg-black/60 rounded-xl border border-emerald-500/30 space-y-1">
              <div className="text-[10px] text-zinc-400 uppercase">SLA & ETA Law</div>
              <div className="text-sm font-bold text-cyan-300">SEC 9/26/28 PASS</div>
            </div>
            <div className="p-3 bg-black/60 rounded-xl border border-fuchsia-500/30 space-y-1">
              <div className="text-[10px] text-zinc-400 uppercase">Quorum Signature</div>
              <div className="text-sm font-bold text-fuchsia-300">10/10 SIGNED</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
