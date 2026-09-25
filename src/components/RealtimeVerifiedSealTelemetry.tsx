import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, animate, useMotionValue } from 'motion/react';
import { Lock, ShieldCheck, CheckCircle2, AlertTriangle, ArrowUpRight, Cpu, Layers, Sparkles } from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';

interface RealtimeVerifiedSealTelemetryProps {
  sealCount: number;
  baseSealCount?: number;
  status: 'ACTIVE_GUARD' | 'PASSED' | 'BLOCKED';
  lastCheckedTime?: string;
  complianceEventCount: number;
  onNavigateToLedger?: () => void;
}

export const RealtimeVerifiedSealTelemetry: React.FC<RealtimeVerifiedSealTelemetryProps> = ({
  sealCount,
  baseSealCount = 14902,
  status,
  lastCheckedTime = '05:05:30 ICT',
  complianceEventCount,
  onNavigateToLedger,
}) => {
  const [displayedCount, setDisplayedCount] = useState<number>(sealCount);
  const [isIncrementing, setIsIncrementing] = useState<boolean>(false);
  const motionVal = useMotionValue<number>(sealCount);
  const deltaFromBase = Math.max(0, sealCount - baseSealCount);
  const prevCountRef = useRef<number>(sealCount);

  // Framer Motion count-up effect when verification gate passes & sealCount increments
  useEffect(() => {
    if (prevCountRef.current === sealCount) return;

    const fromVal = prevCountRef.current;
    const toVal = sealCount;
    prevCountRef.current = sealCount;

    if (toVal > fromVal) {
      setIsIncrementing(true);
      playTone(720, 0.08);
      setTimeout(() => playAuditChime(), 150);
    }

    const controls = animate(fromVal, toVal, {
      duration: 0.85,
      ease: [0.16, 1, 0.3, 1], // Custom snappy cubic-bezier spring curve
      onUpdate: (latest) => {
        const rounded = Math.round(latest);
        setDisplayedCount(rounded);
        motionVal.set(rounded);
      },
      onComplete: () => {
        setDisplayedCount(toVal);
        setIsIncrementing(false);
      },
    });

    return () => controls.stop();
  }, [sealCount, motionVal]);

  return (
    <motion.div
      layout
      layoutId="verified-seals-telemetry-container"
      transition={{ layout: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
      className={`p-5 rounded-[24px] bg-[#0b0e1a]/85 border backdrop-blur-xl space-y-3 transition-all relative overflow-hidden group ${
        isIncrementing
          ? 'border-emerald-400/90 shadow-[0_0_50px_rgba(16,185,129,0.5),inset_0_0_20px_rgba(16,185,129,0.2)] ring-2 ring-emerald-400/50'
          : 'border-cyan-500/20 hover:border-cyan-500/40 shadow-[0_0_30px_-10px_rgba(6,182,212,0.15)]'
      }`}
    >
      {/* Dynamic Animated Green Glow Aura during Snapshot Increment */}
      <AnimatePresence>
        {isIncrementing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-teal-400/25 to-emerald-500/20 pointer-events-none rounded-[24px] blur-xl"
          />
        )}
      </AnimatePresence>

      {/* Corner Ambient Glow */}
      <div className={`absolute top-0 right-0 w-36 h-36 rounded-full blur-2xl pointer-events-none transition-all duration-700 ${
        isIncrementing ? 'bg-emerald-400/35 scale-150 animate-pulse' : 'bg-cyan-500/10'
      }`} />

      {/* Header */}
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="flex items-center gap-1.5 text-zinc-300 font-bold tracking-wide">
          <ShieldCheck className={`w-4 h-4 transition-colors ${isIncrementing ? 'text-emerald-400 animate-bounce' : 'text-cyan-400'}`} />
          VERIFIED SEALS TELEMETRY
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 transition-all ${
            status === 'PASSED' || isIncrementing
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
              : status === 'BLOCKED'
              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              status === 'PASSED' || isIncrementing
                ? 'bg-emerald-400 animate-pulse'
                : status === 'BLOCKED'
                ? 'bg-rose-400'
                : 'bg-cyan-400 animate-ping'
            }`}
          />
          {isIncrementing ? 'SEAL INCREMENTING...' : status === 'PASSED' ? 'GATE PASSED' : status === 'BLOCKED' ? 'GATE BLOCKED' : 'ACTIVE GUARD'}
        </span>
      </div>

      {/* Primary Animated Framer Motion Counter Value with Smooth Spring, Layout Transition & Glowing Aura */}
      <motion.div layout className="relative flex items-baseline gap-2 pt-0.5">
        {isIncrementing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.98, 1.05, 0.98] }}
            exit={{ opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
            className="absolute -inset-2 rounded-2xl bg-emerald-400/25 blur-lg pointer-events-none"
          />
        )}
        <AnimatePresence mode="popLayout">
          <motion.div
            layout
            key={displayedCount}
            initial={{ opacity: 0.7, y: isIncrementing ? -8 : -3, scale: isIncrementing ? 1.08 : 0.98, filter: 'drop-shadow(0 0 16px rgba(16,185,129,0.8))' }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              filter: isIncrementing
                ? 'drop-shadow(0 0 20px rgba(16,185,129,0.9)) drop-shadow(0 0 8px rgba(52,211,153,0.8))'
                : 'drop-shadow(0 0 4px rgba(6,182,212,0.25))',
            }}
            exit={{ opacity: 0.7, y: 8, scale: 0.98 }}
            transition={{
              layout: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
              type: 'spring',
              stiffness: 420,
              damping: 26,
            }}
            className={`text-3xl sm:text-4xl font-mono font-black text-transparent bg-clip-text tracking-tight transition-all relative z-10 ${
              isIncrementing
                ? 'bg-gradient-to-r from-emerald-200 via-teal-100 to-cyan-300'
                : 'bg-gradient-to-r from-white via-cyan-100 to-emerald-300'
            }`}
          >
            {displayedCount.toLocaleString()}
          </motion.div>
        </AnimatePresence>

        <motion.span layout className="text-xs font-normal font-mono text-zinc-400 relative z-10">
          / {baseSealCount.toLocaleString()} BASE
        </motion.span>

        {deltaFromBase > 0 && (
          <motion.span
            layout
            initial={{ opacity: 0, scale: 0.8, x: -5 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border-emerald-500/35 ml-auto flex items-center gap-1 shadow-[0_0_15px_rgba(16,185,129,0.35)] relative z-10"
          >
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>+{deltaFromBase} SEALED</span>
          </motion.span>
        )}
      </motion.div>

      {/* Live Verification Gate Anchors Status */}
      <div className="pt-2 border-t border-white/8 grid grid-cols-2 gap-2 text-[11px] font-mono">
        <div className="p-2 rounded-xl bg-white/[0.02] border-white/5 space-y-0.5">
          <div className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Compliance Anchors</span>
          </div>
          <div className="text-emerald-300 font-bold text-xs">{complianceEventCount} Active</div>
        </div>

        <div className="p-2 rounded-xl bg-white/[0.02] border-white/5 space-y-0.5">
          <div className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
            <Layers className="w-3 h-3 text-cyan-400" />
            <span>Consensus Drift</span>
          </div>
          <div className="text-cyan-300 font-bold text-xs">Δ0.00% SSoT</div>
        </div>
      </div>

      {/* Footnote with Verification Gate Time & Ledger Navigation */}
      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1">
        <span className="truncate">Checked: {lastCheckedTime}</span>
        {onNavigateToLedger && (
          <button
            onClick={() => {
              playTone(600, 0.04);
              onNavigateToLedger();
            }}
            className="text-cyan-400 hover:text-cyan-200 flex items-center gap-0.5 transition-colors"
            title="Inspect full Merkle Ledger seals"
          >
            <span>Audit Ledger</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
};
