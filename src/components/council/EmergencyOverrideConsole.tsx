import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertOctagon,
  ShieldAlert,
  Lock,
  Unlock,
  Radio,
  Cpu,
  Key,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  FileCheck2,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { COUNCIL_MEMBERS } from '../../data/councilData';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import { copyToClipboard } from '../../utils/clipboard';

export const EmergencyOverrideConsole: React.FC<{
  onOverrideStateChange?: (active: boolean) => void;
}> = ({ onOverrideStateChange }) => {
  const [isArming, setIsArming] = useState<boolean>(false);
  const [armingStep, setArmingStep] = useState<number>(0);
  const [overrideActive, setOverrideActive] = useState<boolean>(false);
  const [verifiedSlots, setVerifiedSlots] = useState<number[]>([]);
  const [copiedToken, setCopiedToken] = useState(false);

  const emergencyDigest = '0xEMERGENCY_PQC_OVERRIDE_NIST_FIPS204_0x909AB814FA4C68E993D711B029A887C99F128E6102A_RATIFIED';

  const handleExecuteOverride = () => {
    setIsArming(true);
    setArmingStep(1);
    setVerifiedSlots([]);
    playAuditChime();
    playTone(440, 0.15, 'sawtooth');

    // Simulate progressive 10/10 signature collection
    const interval = setInterval(() => {
      setVerifiedSlots((prev) => {
        if (prev.length < 10) {
          const next = prev.length + 1;
          playTone(500 + next * 40, 0.08, 'sine');
          return [...prev, next];
        }
        return prev;
      });
    }, 180);

    setTimeout(() => {
      clearInterval(interval);
      setIsArming(false);
      setOverrideActive(true);
      setVerifiedSlots([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      playTone(880, 0.4, 'sawtooth');
      if (onOverrideStateChange) onOverrideStateChange(true);
    }, 2200);
  };

  const handleDisarm = () => {
    setOverrideActive(false);
    setIsArming(false);
    setArmingStep(0);
    setVerifiedSlots([]);
    playTone(580, 0.2, 'sine');
    if (onOverrideStateChange) onOverrideStateChange(false);
  };

  const handleCopyToken = () => {
    copyToClipboard(emergencyDigest);
    setCopiedToken(true);
    playTone(900, 0.08, 'sine');
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-red-500/40 bg-[#0b0f17]/95 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_0_40px_rgba(239,68,68,0.15)] text-white space-y-6">
      {/* Background Decorative Ambient Pulse */}
      {overrideActive && (
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-red-600/10 via-transparent to-red-950/20 animate-pulse" />
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-red-500/20 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 shrink-0">
            <AlertOctagon className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <h3 className="text-base sm:text-lg font-bold tracking-wide text-red-400 font-mono">
                EMERGENCY PQC MULTI-SIG OVERRIDE CONSOLE
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              คอนโซลสั่งการฉุกเฉินระดับสูงสุด (Sovereign Level-Omega) กำหนดให้มีฉันทามติรับรองด้วยลายมือชื่อดิจิทัล NIST FIPS 204 ครบ 10/10 โหนดแบบ Unanimous
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold tracking-wider border transition-all ${
              overrideActive
                ? 'bg-red-500/20 text-red-300 border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse'
                : isArming
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-black/60 text-slate-400 border-white/10'
            }`}
          >
            STATUS: {overrideActive ? 'ARMED & EXECUTED' : isArming ? 'COLLECTING 10/10 SEALS...' : 'STANDBY'}
          </span>
        </div>
      </div>

      {/* Protocol Telemetry Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-1">
          <span className="text-[10px] text-zinc-400 uppercase font-mono block">Cryptographic Standard</span>
          <div className="text-sm font-bold font-mono text-amber-400">NIST FIPS 204 (ML-DSA-87)</div>
          <span className="text-[10px] text-zinc-500 block">Post-Quantum Lattice Multi-Sig</span>
        </div>

        <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-1">
          <span className="text-[10px] text-zinc-400 uppercase font-mono block">Target Infrastructure</span>
          <div className="text-sm font-bold font-mono text-cyan-300">Global Sovereign Mesh Enclave</div>
          <span className="text-[10px] text-zinc-500 block">Sub-Kelvin Cryogenic Bus</span>
        </div>

        <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-1">
          <span className="text-[10px] text-zinc-400 uppercase font-mono block">Required Quorum</span>
          <div className="text-sm font-bold font-mono text-emerald-400">10 / 10 Guardian Signatures</div>
          <span className="text-[10px] text-zinc-500 block">100% Unanimous Ratification</span>
        </div>
      </div>

      {/* 10-Node Live Attestation Grid During Arming / Active */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
          <span>ความพร้อมของตราประทับรหัสลับ 10 ผู้พิทักษ์ (Guardian Key Status):</span>
          <span className="text-amber-400 font-bold">
            {overrideActive ? '10/10 VERIFIED' : isArming ? `${verifiedSlots.length}/10 GATHERING` : '10/10 READY'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {COUNCIL_MEMBERS.map((m) => {
            const isVerified = overrideActive || verifiedSlots.includes(m.slotId);
            return (
              <div
                key={m.slotId}
                className={`p-2.5 rounded-xl border text-[11px] font-mono transition-all flex items-center justify-between ${
                  isVerified
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm'
                    : isArming
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse'
                    : 'bg-black/50 border-white/10 text-zinc-400'
                }`}
              >
                <span className="font-bold">{m.councilCode}</span>
                {isVerified ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Control Panel */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-black/80 border border-white/10">
        <div className="text-xs font-mono text-zinc-400">
          {overrideActive ? (
            <div className="space-y-1">
              <div className="text-red-400 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>OVERRIDE LOCKDOWN PROTOCOL ACTIVE</span>
              </div>
              <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                <span className="font-mono text-zinc-300">Digest: {emergencyDigest.slice(0, 24)}...</span>
                <button
                  onClick={handleCopyToken}
                  className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-1"
                >
                  {copiedToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedToken ? 'คัดลอกแล้ว' : 'คัดลอก Token'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <span className="text-zinc-300 font-semibold block">สภาวะเตรียมพร้อม (Standby Ready)</span>
              <span className="text-[11px] text-zinc-500">
                การคลิกปุ่มจะเริ่มกระบวนการรวบรวมลายมือชื่อดิจิทัลผ่านเครือข่ายความเร็วสูง
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {overrideActive && (
            <button
              onClick={handleDisarm}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-semibold transition-all border border-zinc-600 inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>DISARM / STANDBY RESET</span>
            </button>
          )}

          <button
            onClick={handleExecuteOverride}
            disabled={isArming || overrideActive}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-mono text-xs font-bold transition-all shadow-lg inline-flex items-center justify-center gap-2 border ${
              overrideActive
                ? 'bg-red-500/20 text-red-300 border-red-500/50 cursor-not-allowed opacity-80'
                : isArming
                ? 'bg-amber-500/30 text-amber-200 border-amber-500/50 cursor-wait'
                : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white border-red-400/50 shadow-red-500/20 active:scale-95'
            }`}
          >
            {isArming ? (
              <>
                <svg className="animate-spin h-4 w-4 text-amber-300" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>VERIFYING 10/10 QUORUM ({verifiedSlots.length}/10)...</span>
              </>
            ) : overrideActive ? (
              <>
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>OVERRIDE RATIFIED & ACTIVE</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-white" />
                <span>INITIATE EMERGENCY OVERRIDE</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
