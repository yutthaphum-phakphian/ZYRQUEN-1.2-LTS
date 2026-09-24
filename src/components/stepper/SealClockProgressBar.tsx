// src/components/stepper/SealClockProgressBar.tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Bell,
  BellOff,
  Volume2,
  Sparkles,
  Zap,
  Activity,
} from 'lucide-react';
import { CANONICAL_SEALS } from '../../data/canonicalData';
import { playSnapshotSealChime, playTone } from '../AudioSynthesizer';
import { useAuditChimeSettings } from '../../hooks/useAuditChimeSettings';

interface SealClockProgressBarProps {
  verifiedSeals: number;
  totalSeals?: number;
  isRunning?: boolean;
  passedCount: number;
  totalSteps?: number;
  onFastSealSweep?: () => void;
  className?: string;
}

export const SealClockProgressBar: React.FC<SealClockProgressBarProps> = ({
  verifiedSeals,
  totalSeals = CANONICAL_SEALS,
  isRunning = false,
  passedCount,
  totalSteps = 16,
  onFastSealSweep,
  className = '',
}) => {
  const { enabled: chimeEnabled, volumePercent, toggleEnabled } = useAuditChimeSettings();
  const [animatedCount, setAnimatedCount] = useState(verifiedSeals);
  const [clockAngle, setClockAngle] = useState(0);

  // Smooth count-up animation when verifiedSeals changes
  useEffect(() => {
    let startVal = animatedCount;
    const endVal = verifiedSeals;
    if (startVal === endVal) return;

    const duration = 400; // ms
    const startTime = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (endVal - startVal) * eased);
      setAnimatedCount(current);

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        setAnimatedCount(endVal);
      }
    };

    const animId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animId);
  }, [verifiedSeals]);

  // Sweep hand rotation
  useEffect(() => {
    let animId: number;
    const updateHand = () => {
      if (isRunning) {
        setClockAngle((prev) => (prev + 3) % 360);
      } else {
        // Point to percentage of completion
        const targetAngle = (verifiedSeals / totalSeals) * 360;
        setClockAngle(targetAngle);
      }
      animId = requestAnimationFrame(updateHand);
    };
    animId = requestAnimationFrame(updateHand);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, verifiedSeals, totalSeals]);

  const percentage = Math.min(100, Math.max(0, (animatedCount / totalSeals) * 100));
  const isComplete = animatedCount >= totalSeals;

  // SVG circular dimensions
  const size = 96;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const handleManualSweep = () => {
    playSnapshotSealChime();
    if (onFastSealSweep) {
      onFastSealSweep();
    }
  };

  return (
    <div
      className={`p-4 rounded-2xl bg-gradient-to-br from-[#070b18]/90 via-[#0a0e24]/85 to-[#060914]/90 border border-cyan-500/30 backdrop-blur-xl shadow-[0_4px_24px_rgba(6,182,212,0.15)] font-mono text-xs ${className}`}
    >
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left: Circular Seal Clock Dial */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="relative flex items-center justify-center">
            {/* Ambient circular glow */}
            <div
              className={`absolute inset-0 rounded-full filter blur-md transition-opacity duration-500 ${
                isComplete ? 'bg-emerald-500/20' : isRunning ? 'bg-cyan-500/25' : 'bg-amber-500/15'
              }`}
            />

            <svg width={size} height={size} className="transform -rotate-90">
              {/* Background Track */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="#182038"
                strokeWidth={strokeWidth}
              />

              {/* Progress Ring */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="url(#sealClockGradient)"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-300 ease-out"
              />

              {/* Gradient Definition */}
              <defs>
                <linearGradient id="sealClockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="50%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
            </svg>

            {/* Sweep Hand / Needle */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ transform: `rotate(${clockAngle}deg)` }}
            >
              <div className="w-0.5 h-10 bg-gradient-to-t from-transparent via-cyan-400 to-amber-300 -translate-y-5 rounded-full shadow-[0_0_8px_#06b6d4]" />
            </div>

            {/* Center Core Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <Clock className={`w-3.5 h-3.5 mb-0.5 ${isRunning ? 'animate-spin text-amber-300' : 'text-cyan-400'}`} />
              <span className="text-[11px] font-black text-white leading-tight">
                {percentage.toFixed(0)}%
              </span>
              <span className="text-[8px] text-zinc-400 font-bold">SEALED</span>
            </div>
          </div>

          {/* Seal Clock Metadata */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Hardware Seal Clock
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isComplete
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : isRunning
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                }`}
              >
                {isComplete ? 'ALL 14,902 SEALS VERIFIED' : isRunning ? 'VERIFYING...' : `${passedCount}/${totalSteps} PASSED`}
              </span>
            </div>

            <div className="flex items-baseline gap-1.5 text-zinc-300">
              <span className="text-xl sm:text-2xl font-black text-emerald-300 font-mono tracking-tight drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]">
                {animatedCount.toLocaleString()}
              </span>
              <span className="text-xs text-zinc-400">/ {totalSeals.toLocaleString()} Hardware Seals Verified</span>
            </div>

            <p className="text-[11px] font-sans text-zinc-400">
              Active Session Integrity Checks • Sub-Kelvin Cryo Enclaves 01–18
            </p>
          </div>
        </div>

        {/* Center / Right: Progress Bar & Milestone Ticks */}
        <div className="flex-1 w-full space-y-2">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1 text-cyan-300 font-bold">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              SESSION INTEGRITY PROGRESSION
            </span>
            <span className="text-emerald-400 font-bold font-mono">
              Δ0.00% Zero Drift Invariant
            </span>
          </div>

          {/* Main Visual Progress Bar */}
          <div className="relative h-3 w-full bg-black/60 rounded-full overflow-hidden border border-white/10 p-0.5">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-amber-400 shadow-[0_0_14px_rgba(6,182,212,0.6)]"
              style={{ width: `${percentage}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Milestone Ticks */}
          <div className="flex justify-between text-[9px] text-zinc-500 font-mono pt-0.5">
            <span className="hover:text-cyan-300 transition-colors">0 Ingestion</span>
            <span className="hover:text-cyan-300 transition-colors">3,725 PQC</span>
            <span className="hover:text-cyan-300 transition-colors">7,451 Quorum</span>
            <span className="hover:text-cyan-300 transition-colors">11,176 ETDA</span>
            <span className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors">
              14,902 Full Seals
            </span>
          </div>
        </div>

        {/* Right Controls: Fast Sweep & Audit Chime Quick Toggle */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          {/* Quick Audit Chime Toggle */}
          <button
            type="button"
            onClick={() => {
              toggleEnabled();
              playTone(chimeEnabled ? 440 : 880, 0.04);
            }}
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
              chimeEnabled
                ? 'bg-amber-500/20 text-amber-200 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'bg-zinc-800 text-zinc-500 border-zinc-700'
            }`}
            title={`Audit Chime: ${chimeEnabled ? `ENABLED (${volumePercent}%)` : 'MUTED'}`}
          >
            {chimeEnabled ? (
              <Bell className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            ) : (
              <BellOff className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{chimeEnabled ? `Chime ${volumePercent}%` : 'Chime Off'}</span>
          </button>

          {/* Verify / Sweep Seals Button */}
          <button
            type="button"
            onClick={handleManualSweep}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/25 to-cyan-500/25 hover:from-emerald-500/35 hover:to-cyan-500/35 border border-emerald-500/40 text-emerald-200 text-xs font-bold font-mono flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)] transition cursor-pointer"
            title="Trigger manual seal clock verification chime and snapshot seal sweep"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Sweep 14,902 Seals</span>
          </button>
        </div>
      </div>
    </div>
  );
};
