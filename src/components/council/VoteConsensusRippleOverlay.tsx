import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Vote, CheckCircle2, ShieldCheck, Sparkles, Radio, Zap, Activity } from 'lucide-react';

export interface ConsensusRippleEvent {
  id: number;
  slotId?: number | 'ALL';
  decision?: string;
  proposalId?: string;
  timestamp: string;
}

interface VoteConsensusRippleOverlayProps {
  rippleEvent: ConsensusRippleEvent | null;
}

export const VoteConsensusRippleOverlay: React.FC<VoteConsensusRippleOverlayProps> = ({
  rippleEvent,
}) => {
  if (!rippleEvent) return null;

  const isAll = rippleEvent.slotId === 'ALL' || rippleEvent.slotId === undefined;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={`ripple-container-${rippleEvent.id}`}
          className="absolute inset-0 flex items-center justify-center"
        >
          {/* 1. Multi-Layer Concentric Expanding Shockwaves from Grid Center */}
          {/* Ring 1 - Immediate Fast Emerald Wave */}
          <motion.div
            initial={{ scale: 0.1, opacity: 0.95, borderWidth: '6px' }}
            animate={{ scale: 2.8, opacity: 0, borderWidth: '1px' }}
            transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute w-72 h-72 rounded-full border-emerald-400 bg-emerald-500/15 shadow-[0_0_60px_rgba(16,185,129,0.6)]"
          />

          {/* Ring 2 - Bright Cyan Ripple with slight stagger */}
          <motion.div
            initial={{ scale: 0.1, opacity: 0.9, borderWidth: '5px' }}
            animate={{ scale: 2.4, opacity: 0, borderWidth: '1px' }}
            transition={{ duration: 2.0, delay: 0.18, ease: 'easeOut' }}
            className="absolute w-80 h-80 rounded-full border-cyan-400 bg-cyan-500/10 shadow-[0_0_50px_rgba(6,182,212,0.5)]"
          />

          {/* Ring 3 - Golden Consensus Quorum Wave */}
          <motion.div
            initial={{ scale: 0.1, opacity: 0.85, borderWidth: '4px' }}
            animate={{ scale: 2.1, opacity: 0, borderWidth: '1px' }}
            transition={{ duration: 2.2, delay: 0.35, ease: 'easeOut' }}
            className="absolute w-96 h-96 rounded-full border-amber-400 bg-amber-500/5 shadow-[0_0_40px_rgba(245,158,11,0.45)]"
          />

          {/* Ring 4 - Ultra-wide Outer Grid Edge Pulse */}
          <motion.div
            initial={{ scale: 0.2, opacity: 0.8 }}
            animate={{ scale: 3.6, opacity: 0 }}
            transition={{ duration: 2.5, delay: 0.5, ease: 'easeOut' }}
            className="absolute w-64 h-64 rounded-full border border-teal-300/50 shadow-[0_0_70px_rgba(45,212,191,0.35)]"
          />

          {/* 2. Concentric Hexagonal Harmonic Mesh Grid Overlay */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0.7, rotate: 0 }}
            animate={{ scale: 2.2, opacity: 0, rotate: 45 }}
            transition={{ duration: 2.0, ease: 'easeOut' }}
            className="absolute w-96 h-96 border border-dashed border-emerald-400/40 rounded-3xl"
          />

          {/* 3. High-Energy Radial Particle Lasers (Propagating to individual cards) */}
          {Array.from({ length: 16 }).map((_, idx) => {
            const angle = (idx * 360) / 16;
            return (
              <motion.div
                key={`ray-${idx}`}
                initial={{ scaleX: 0, opacity: 0.95 }}
                animate={{ scaleX: 1.5, opacity: 0 }}
                transition={{
                  duration: 1.4,
                  delay: 0.08 + (idx % 4) * 0.04,
                  ease: 'easeOut',
                }}
                style={{
                  transformOrigin: 'left center',
                  transform: `rotate(${angle}deg)`,
                }}
                className="absolute left-1/2 top-1/2 w-80 h-0.5 bg-gradient-to-r from-emerald-400 via-cyan-400 to-transparent"
              />
            );
          })}

          {/* 4. Central Vote Consensus Pop Hologram Banner with Scanline Effect */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 360, damping: 24 }}
            className="relative z-40 p-4 sm:p-5 rounded-3xl bg-zinc-950/95 border-2 border-emerald-400/80 shadow-[0_0_60px_rgba(16,185,129,0.55)] backdrop-blur-2xl text-center space-y-2 max-w-md mx-4 holographic-stream-effect"
          >
            <div className="flex items-center justify-center gap-3">
              <span className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-pulse">
                <Vote className="w-5 h-5 text-emerald-400" />
              </span>
              <div className="text-left">
                <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase block">
                  Vote Consensus Ripple Active
                </span>
                <span className="text-xs sm:text-sm font-mono font-bold text-white">
                  {isAll ? '10/10 Full Quorum Consensus Ratified' : `Node #${rippleEvent.slotId} Vote Sealed & Propagated`}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-zinc-300 pt-1.5 border-t border-white/10">
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                {rippleEvent.decision || 'YES (APPROVED)'}
              </span>
              <span className="text-zinc-600">&bull;</span>
              <span className="text-amber-400 font-mono text-[11px]">
                {rippleEvent.proposalId || 'CONSENSUS_SEAL'}
              </span>
              <span className="text-zinc-600">&bull;</span>
              <span className="text-emerald-400 text-[10px]">NIST FIPS 204</span>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-emerald-300 pt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              <span>กระจายคลื่นมติสัตยาบันจากศูนย์กลางสู่โหนด HSM รอบโครงข่าย</span>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
