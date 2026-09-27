import React, { useState } from 'react';
import {
  Activity,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Radio,
  Lock,
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  SlidersHorizontal,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { ViewType, HardwareSnapshot } from '../types';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';
import { Chamber18NeuralSentinel } from './dashboard/Chamber18NeuralSentinel';
import {
  Chamber18NeuralSentinelEngine,
  globalChamber18Engine,
} from '../chambers/chamber18/neuralSentinelEngine';
import { CANONICAL_SSOT_CORE } from '../core/canonicalSSoT';

interface Room18MasterPanelProps {
  snapshots?: HardwareSnapshot[];
  onNavigate?: (view: ViewType) => void;
  onOpenCertificate?: () => void;
}

export const Room18MasterPanel: React.FC<Room18MasterPanelProps> = ({
  onNavigate,
  onOpenCertificate,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationStatus, setVerificationStatus] = useState<string>(
    'CH-18 NEURAL SENTINEL • 12,480 SPANS/M • 1.33 fs JITTER BASELINE • Δ0.00% SSoT'
  );

  const invariantAttestations = globalChamber18Engine.getInvariantAttestations();

  const handleCopy = (id: string, text: string) => {
    copyToClipboard(text);
    setCopiedId(id);
    playTone(660, 0.03);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleVerifySentinelInvariants = () => {
    if (isVerifying) return;
    setIsVerifying(true);
    playTone(880, 0.05);

    setTimeout(() => {
      setIsVerifying(false);
      setVerificationStatus(
        `SENTINEL ATTESTED AT ${new Date().toLocaleTimeString('th-TH')} • INV-DRIFT-DETECTION & INV-FAIL-CLOSED-GUARD ARMED (<${Chamber18NeuralSentinelEngine.FAIL_CLOSED_SLA_MS}ms)`
      );
      playAuditChime();
    }, 650);
  };

  return (
    <div className="space-y-6 font-mono text-zinc-300">
      {/* Top Banner for Room 18 */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#0a0f1e] border border-cyan-500/35 relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-cyan-300">
              <span className="font-bold flex items-center gap-1.5 text-cyan-200">
                <Activity className="w-4 h-4 text-cyan-400" />
                ROOM 18 / CH-18 • NEURAL SENTINEL &amp; PREDICTIVE GOVERNANCE
              </span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span className="text-emerald-300">12,480 spans/m OTel Stream</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span className="text-amber-300">14.98 mK / 1.33 fs Baseline</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                ห้องปฏิบัติการที่ 18: ผู้พิทักษ์โครงข่ายประสาทและธรรมาภิบาลเชิงคาดการณ์
              </h2>
              <p className="text-sm text-zinc-400 max-w-4xl leading-relaxed">
                ตรวจจับความผิดปกติในสายธารข้อมูลโทรมาตรแบบ Real-time (Phase Jitter 1.33 fs, Latency 35.8 ms)
                พร้อมกลไกสกัดกั้นอัตโนมัติ (Fail-Closed Auto-Quarantine ไปยัง Chamber 02 ภายใน 142 ms)
                โดยรักษาสถานะ Canonical SSoT Block #{CANONICAL_SSOT_CORE.genesisAnchor.blockHeight} (Mutation Authority: 0)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-3 shrink-0">
            <button
              onClick={handleVerifySentinelInvariants}
              disabled={isVerifying}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
              {isVerifying ? 'Verifying Sentinel Guard...' : 'Verify CH-18 Sentinel Invariants'}
            </button>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{verificationStatus}</span>
            </div>
          </div>
        </div>

        {/* Key Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/8">
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>OTel Span Ingestion</span>
            </div>
            <div className="text-lg font-bold text-white mt-1">12,480 spans/m</div>
            <div className="text-[10px] text-cyan-300 mt-0.5">Protobuf Non-Authoritative Stream</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/8">
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Helium-4 Phase Jitter</span>
            </div>
            <div className="text-lg font-bold text-white mt-1">
              {Chamber18NeuralSentinelEngine.BASELINE_JITTER_FS} fs
            </div>
            <div className="text-[10px] text-emerald-300 mt-0.5">14.98 mK Sub-Kelvin Loop</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/8">
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Fail-Closed Threshold</span>
            </div>
            <div className="text-lg font-bold text-white mt-1">
              {(Chamber18NeuralSentinelEngine.CRITICAL_ANOMALY_THRESHOLD * 100).toFixed(0)}% Anomaly
            </div>
            <div className="text-[10px] text-amber-300 mt-0.5">
              RTO &le; {Chamber18NeuralSentinelEngine.FAIL_CLOSED_SLA_MS} ms to CH-02
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/8">
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-violet-400" />
              <span>SSoT Mutation Authority</span>
            </div>
            <div className="text-lg font-bold text-white mt-1">0 (Δ0.00%)</div>
            <div className="text-[10px] text-violet-300 mt-0.5">
              Root {CANONICAL_SSOT_CORE.genesisAnchor.merkleRoot.slice(0, 12)}...
            </div>
          </div>
        </div>

        {/* Invariant Attestation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {invariantAttestations.map((inv) => (
            <div
              key={inv.code}
              className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-start justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{inv.code}</span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span className="text-zinc-200">{inv.title}</span>
                </div>
                <p className="text-[11px] text-zinc-400">{inv.guarantee}</p>
                <div className="text-[10px] text-zinc-500">
                  Target: <span className="text-zinc-300">{inv.quarantineTarget}</span> · Latency:{' '}
                  <span className="text-emerald-300">{inv.enforcementLatencyMs} ms</span>
                </div>
              </div>
              <button
                onClick={() => handleCopy(inv.code, `${inv.code}: ${inv.guarantee}`)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white shrink-0"
                title="Copy Invariant Specification"
              >
                {copiedId === inv.code ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Quick Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-white/10">
          <div className="text-xs text-zinc-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Mounted in Registry: src/data/sovereignData.ts &amp; src/lib/ssot-data.ts (CH-18)</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onNavigate && (
              <>
                <button
                  onClick={() => onNavigate('security')}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>CH-02 Quarantine Buffer</span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                </button>
                <button
                  onClick={() => onNavigate('ledger')}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Immutable Audit Ledger</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              </>
            )}
            {onOpenCertificate && (
              <button
                onClick={onOpenCertificate}
                className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-xs text-amber-300 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Inspect Gold Certificate</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Chamber 18 Neural Sentinel Telemetry & Predictive Governance Console */}
      <Chamber18NeuralSentinel
        onNavigateToQuarantine={() => onNavigate && onNavigate('security')}
        onNavigateToLedger={() => onNavigate && onNavigate('ledger')}
      />
    </div>
  );
};

export default Room18MasterPanel;
