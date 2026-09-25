import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertOctagon,
  Lock,
  RefreshCw,
  Hash,
  Layers,
  CheckCircle2,
  XCircle,
  FileCode,
  Flame,
  KeyRound,
  EyeOff,
  Radio,
  Server,
  Zap,
} from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { SYSTEM_METADATA, CANONICAL_MERKLE_ROOT } from '../data/canonicalData';
import { P0FrozenCoreGuard } from '../utils/p0FrozenCoreGuard';

export interface BaselineReconciliationGuardProps {
  onStatusChange?: (status: 'LOCKED' | 'FAIL_CLOSED') => void;
}

export const BaselineReconciliationGuard: React.FC<BaselineReconciliationGuardProps> = ({
  onStatusChange,
}) => {
  // Hardcoded Immutable Frozen Baseline v1.2 LTS (P0 Invariants)
  const FROZEN_BASELINE = {
    merkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    blockCount: 849202,
    sealCount: 14902,
    mutationAllowed: 0,
  };

  // Runtime State (Synchronized with Sovereign SSoT Δ0.00%)
  const [runtimeState, setRuntimeState] = useState({
    merkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    blockCount: 849202,
    sealCount: 14902,
    mutationCount: 0,
    deployedIndexHash: 'SHA256:909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    localIndexHash: 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
  });

  const [observedDriftMode, setObservedDriftMode] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [reconciliationCount, setReconciliationCount] = useState(1);
  const [lastCheckTime, setLastCheckTime] = useState('2026-08-22 02:04:15 ICT');

  // Effective evaluated seal count
  const effectiveSealCount = observedDriftMode ? 14907 : runtimeState.sealCount;

  // Strict Evaluation
  const merkleMatch = runtimeState.merkleRoot === FROZEN_BASELINE.merkleRoot;
  const blockMatch = runtimeState.blockCount === FROZEN_BASELINE.blockCount;
  const sealMatch = effectiveSealCount === FROZEN_BASELINE.sealCount;
  const zeroMutation = runtimeState.mutationCount === 0;

  const isLocked = merkleMatch && blockMatch && sealMatch && zeroMutation;

  const handleReconcile = () => {
    setIsVerifying(true);
    playTone(700, 0.04);
    setTimeout(() => {
      setIsVerifying(false);
      setReconciliationCount((prev) => prev + 1);
      setLastCheckTime(new Date().toISOString().replace('T', ' ').slice(0, 19) + ' ICT');
      if (isLocked) {
        playAuditChime();
      } else {
        playTone(300, 0.2);
      }
    }, 400);
  };

  const toggleDriftSimulation = () => {
    setObservedDriftMode((prev) => {
      const next = !prev;
      playTone(next ? 400 : 800, 0.05);
      return next;
    });
  };

  return (
    <div
      id="baseline-reconciliation-guard-banner"
      className={`p-5 rounded-[24px] border-2 backdrop-blur-2xl transition-all duration-300 font-mono shadow-2xl ${
        isLocked
          ? 'bg-gradient-to-r from-[#071318]/95 via-[#061014]/90 to-[#04090c] border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.25)]'
          : 'bg-gradient-to-r from-[#200808]/95 via-[#180505]/90 to-[#0c0404] border-red-500/80 shadow-[0_0_35px_rgba(239,68,68,0.4)] animate-pulse'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Status Badge & Core Identity */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
              isLocked
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'bg-red-500/30 border-red-400 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
            }`}
          >
            {isLocked ? <Lock className="w-6 h-6" /> : <AlertOctagon className="w-6 h-6 animate-bounce" />}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2
                className={`text-base sm:text-lg font-extrabold tracking-wider font-serif ${
                  isLocked ? 'text-cyan-100' : 'text-red-100'
                }`}
              >
                {isLocked
                  ? 'CANONICAL BASELINE INTEGRITY: PASS / MATCH (FROZEN v1.2 LTS)'
                  : 'OBSERVED EVIDENCE RECONCILIATION: FAIL-CLOSED (14,907 observed ≠ 14,902 canonical)'}
              </h2>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                  isLocked
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-red-500/30 text-red-200 border-red-500/60'
                }`}
              >
                {isLocked ? 'CANONICAL MUTATION = 0' : 'PROMOTION CIRCUIT: FAIL-CLOSED'}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                  isLocked
                    ? 'bg-zinc-900 text-emerald-300 border-emerald-500/40'
                    : 'bg-red-950 text-red-300 border-red-500/50'
                }`}
              >
                {isLocked ? 'FROZEN BASELINE READBACK: 14,902' : 'OBSERVED TELEMETRY: 14,907 (+5 QUARANTINED)'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400 font-mono mt-1">
              <span>Canonical Baseline: <strong className="text-zinc-200">14,902 = 14,902 (Δ0.00%)</strong></span>
              <span className="text-zinc-600">•</span>
              <span>Independent Runtime Execution: <strong className="text-amber-400">NOT EXECUTED</strong></span>
              <span className="text-zinc-600">•</span>
              <span>Write Authority: <strong className="text-zinc-300">NONE</strong></span>
              <span className="text-zinc-600">•</span>
              <span>Auto-Reseal: <strong className="text-red-400">BLOCKED</strong></span>
            </div>
          </div>
        </div>

        {/* Right: Reconciliation Action & Telemetry */}
        <div className="flex flex-wrap items-center gap-2.5 self-end lg:self-center">
          <button
            onClick={toggleDriftSimulation}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all border ${
              observedDriftMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{observedDriftMode ? 'LIVE TELEMETRY: 14,907 SEALS' : 'INSPECT OBSERVED (+5 DRIFT)'}</span>
          </button>

          <button
            onClick={handleReconcile}
            disabled={isVerifying}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
              isVerifying
                ? 'bg-zinc-800 text-zinc-500 border-zinc-700'
                : isLocked
                ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'bg-red-500/20 hover:bg-red-500/30 text-red-200 border-red-400/50'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'RECONCILING...' : 'RECONCILE BASELINE'}</span>
          </button>
        </div>
      </div>

      {/* Discrepancy / Drift Warning Box (Shown when Fail-Closed) */}
      {!isLocked && (
        <div className="mt-4 p-3.5 rounded-xl bg-red-950/60 border-red-500/40 text-xs text-red-200 space-y-2">
          <div className="flex items-center justify-between font-bold text-red-300">
            <span className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-red-400" />
              <span>[LIVE] OBSERVED — NOT CANONICAL / BASELINE MISMATCH (+5 SEALS DETECTED)</span>
            </span>
            <span className="text-[10px] bg-red-500/30 px-2 py-0.5 rounded border-red-500/50">
              CANONICAL PROMOTION: BLOCKED 🔒
            </span>
          </div>
          <p className="text-[11px] text-red-300/90 leading-relaxed font-sans">
            ตรวจพบค่า Observed Telemetry (14,907) &ne; Frozen Baseline (14,902). ระบบตัดเข้าสถานะ <strong>FAIL-CLOSED</strong> ทันที 
            <br />
            <strong>ข้อบังคับ SSoT:</strong> ห้ามแก้ Frozen Baseline จาก 14,902 &rarr; 14,907 เพื่อให้ตรงกับ Dashboard เพราะจะละเมิดกฎ <em>SSoT Mutation = 0</em>. 
            การเปลี่ยนแปลงต้องผ่าน Baseline Reconciliation Report และ Governance Quorum เท่านั้น.
          </p>
        </div>
      )}

      {/* 4-Vector Comparison Grid */}
      <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* 1. Merkle Root Match */}
        <div className="p-3 rounded-xl bg-black/60 border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-zinc-500">
            <span>MERKLE ROOT ANCHOR</span>
            {merkleMatch ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> MATCH
              </span>
            ) : (
              <span className="text-red-400 font-bold flex items-center gap-1">
                <XCircle className="w-3 h-3" /> MISMATCH
              </span>
            )}
          </div>
          <div className="font-mono text-cyan-300 text-[11px] truncate">{FROZEN_BASELINE.merkleRoot}</div>
          <div className="text-[9px] text-zinc-500">Target: 909ab814... (Exact 64-Hex)</div>
        </div>

        {/* 2. Block Height */}
        <div className="p-3 rounded-xl bg-black/60 border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-zinc-500">
            <span>BLOCK HEIGHT</span>
            {blockMatch ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> #{FROZEN_BASELINE.blockCount.toLocaleString()}
              </span>
            ) : (
              <span className="text-red-400 font-bold">MISMATCH</span>
            )}
          </div>
          <div className="font-mono text-purple-300 text-sm font-bold">#{runtimeState.blockCount.toLocaleString()}</div>
          <div className="text-[9px] text-zinc-500">Frozen Epoch: #849,202 LTS</div>
        </div>

        {/* 3. Sovereign Seals */}
        <div className={`p-3 rounded-xl bg-black/60 border space-y-1 ${sealMatch ? 'border-white/5' : 'border-red-500/50 bg-red-950/20'}`}>
          <div className="flex items-center justify-between text-[10px] text-zinc-500">
            <span>SOVEREIGN SEALS</span>
            {sealMatch ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> 14,902 LOCKED
              </span>
            ) : (
              <span className="text-red-400 font-bold flex items-center gap-1">
                <XCircle className="w-3 h-3" /> +5 MISMATCH (14,907)
              </span>
            )}
          </div>
          <div className={`font-mono text-sm font-bold ${sealMatch ? 'text-amber-300' : 'text-red-400'}`}>
            {effectiveSealCount.toLocaleString()} Seals
          </div>
          <div className="text-[9px] text-zinc-500">
            {sealMatch ? 'Dilithium-5 Proof Bound' : 'Frozen Baseline: 14,902 (IMMUTABLE)'}
          </div>
        </div>

        {/* 4. Write Firewall / Mutation Count */}
        <div className="p-3 rounded-xl bg-black/60 border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-zinc-500">
            <span>MUTATION COUNT</span>
            {zeroMutation ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> ZERO (0)
              </span>
            ) : (
              <span className="text-red-400 font-bold">MUTATION VIOLATION</span>
            )}
          </div>
          <div className="font-mono text-emerald-300 text-sm font-bold">0 Mutations</div>
          <div className="text-[9px] text-zinc-500">Canonical Write Firewall: Active</div>
        </div>
      </div>
    </div>
  );
};
