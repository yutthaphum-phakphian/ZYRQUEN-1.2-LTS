import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Vote,
  ShieldCheck,
  Sparkles,
  Zap,
  Radio,
  CheckCircle2,
  Lock,
  Layers,
} from 'lucide-react';
import { playAuditChime, playTone } from '../AudioSynthesizer';

export interface ConsensusVoteEvent {
  type: 'CONSENSUS_VOTE';
  id: string | number;
  slotId?: number | 'ALL';
  voterName?: string;
  decision: 'YES' | 'NO' | 'ABSTAIN' | string;
  proposalId?: string;
  proposalTitle?: string;
  timestamp: string;
  pqcSignature?: string;
  sealedBlockHash?: string;
}

export interface ConsensusRippleOverlayProps {
  event: ConsensusVoteEvent | null;
  boundedToGrid?: boolean; // if true: absolute inside container; if false: fixed full-screen
  onDismiss?: () => void;
}

export const ConsensusRippleOverlay: React.FC<ConsensusRippleOverlayProps> = ({
  event,
  boundedToGrid = true,
  onDismiss,
}) => {
  useEffect(() => {
    if (event && event.type === 'CONSENSUS_VOTE') {
      playAuditChime();
      playTone(920, 0.22, 'sine');
      setTimeout(() => playTone(1140, 0.18, 'triangle'), 180);
    }
  }, [event]);

  if (!event || event.type !== 'CONSENSUS_VOTE') {
    return null;
  }

  const isAll = event.slotId === 'ALL' || event.slotId === undefined;
  const decisionText = event.decision || 'YES (RATIFIED)';
  const isApproved = decisionText.toUpperCase().includes('YES') || decisionText.toUpperCase().includes('RATIFIED');

  return (
    <div
      className={`pointer-events-none z-40 overflow-hidden flex items-center justify-center ${
        boundedToGrid ? 'absolute inset-0' : 'fixed inset-0 bg-black/30 backdrop-blur-[2px]'
      }`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`consensus-ripple-${event.id}`}
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Layer 1: Central Radial Wave 1 (Rapid High-Energy Emerald Pulse) */}
          <motion.div
            initial={{ scale: 0.05, opacity: 0.95, borderWidth: '6px' }}
            animate={{ scale: 3.8, opacity: 0, borderWidth: '1px' }}
            transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute w-72 h-72 rounded-full ${
              isApproved
                ? 'border-emerald-400 bg-emerald-500/15 shadow-[0_0_80px_rgba(16,185,129,0.7)]'
                : 'border-red-400 bg-red-500/15 shadow-[0_0_80px_rgba(239,68,68,0.7)]'
            }`}
          />

          {/* Layer 2: Intermediate Cyan Harmonic Shockwave */}
          <motion.div
            initial={{ scale: 0.05, opacity: 0.9, borderWidth: '4px' }}
            animate={{ scale: 3.2, opacity: 0, borderWidth: '1px' }}
            transition={{ duration: 2.4, delay: 0.15, ease: 'easeOut' }}
            className="absolute w-84 h-84 rounded-full border-cyan-400 bg-cyan-500/10 shadow-[0_0_60px_rgba(6,182,212,0.6)]"
          />

          {/* Layer 3: Golden Quorum Invariant Ring */}
          <motion.div
            initial={{ scale: 0.05, opacity: 0.85, borderWidth: '3px' }}
            animate={{ scale: 2.7, opacity: 0, borderWidth: '1px' }}
            transition={{ duration: 2.6, delay: 0.3, ease: 'easeOut' }}
            className="absolute w-96 h-96 rounded-full border-amber-400 bg-amber-500/5 shadow-[0_0_50px_rgba(245,158,11,0.5)]"
          />

          {/* Layer 4: Distant Outer Propagation Wave across Guardian Grid */}
          <motion.div
            initial={{ scale: 0.1, opacity: 0.75 }}
            animate={{ scale: 4.5, opacity: 0 }}
            transition={{ duration: 2.8, delay: 0.45, ease: 'easeOut' }}
            className="absolute w-64 h-64 rounded-full border border-teal-300/40 shadow-[0_0_90px_rgba(45,212,191,0.4)]"
          />

          {/* Layer 5: Expanding Hexagonal Cryptographic Lattice */}
          <motion.div
            initial={{ scale: 0.2, opacity: 0.7, rotate: 0 }}
            animate={{ scale: 2.6, opacity: 0, rotate: 60 }}
            transition={{ duration: 2.3, ease: 'easeOut' }}
            className="absolute w-80 h-80 border-2 border-dashed border-emerald-400/40 rounded-3xl"
          />

          {/* Layer 6: 24 Radial Particle Lasers Propagating Outward to 10 Guardian Cards */}
          {Array.from({ length: 24 }).map((_, idx) => {
            const angle = (idx * 360) / 24;
            return (
              <motion.div
                key={`laser-particle-${idx}`}
                initial={{ scaleX: 0, opacity: 0.95 }}
                animate={{ scaleX: 1.8, opacity: 0 }}
                transition={{
                  duration: 1.6,
                  delay: 0.06 + (idx % 6) * 0.03,
                  ease: 'easeOut',
                }}
                style={{
                  transformOrigin: 'left center',
                  transform: `rotate(${angle}deg)`,
                }}
                className={`absolute left-1/2 top-1/2 w-96 h-0.5 ${
                  isApproved
                    ? 'bg-gradient-to-r from-emerald-400 via-cyan-400 to-transparent'
                    : 'bg-gradient-to-r from-red-400 via-amber-400 to-transparent'
                }`}
              />
            );
          })}

          {/* Centerpiece: Holographic Consensus Ratification Seal Badge */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0, y: 35 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -25 }}
            transition={{ type: 'spring', stiffness: 350, damping: 22 }}
            className="relative z-50 p-5 rounded-3xl bg-zinc-950/95 border-2 border-emerald-400/90 shadow-[0_0_80px_rgba(16,185,129,0.6)] backdrop-blur-2xl text-center space-y-2.5 max-w-lg mx-4 holographic-stream-effect"
          >
            {/* Top Indicator */}
            <div className="flex items-center justify-center gap-3">
              <span className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.5)] animate-pulse">
                <Vote className="w-6 h-6 text-emerald-400" />
              </span>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                    EVENT: CONSENSUS_VOTE
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    PROPAGATED
                  </span>
                </div>
                <span className="text-sm sm:text-base font-mono font-bold text-white block">
                  {isAll
                    ? '10/10 Full Quorum Consensus Ratified'
                    : `Guardian Node #${event.slotId} Vote Sealed & Propagated`}
                </span>
              </div>
            </div>

            {/* Proposal & Decision Strip */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono text-zinc-300 pt-2 border-t border-white/10">
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                {decisionText}
              </span>
              <span className="text-zinc-600">&bull;</span>
              <span className="text-amber-400 font-mono">
                {event.proposalId || 'PROP-SOV-2026-CONSENSUS'}
              </span>
              <span className="text-zinc-600">&bull;</span>
              <span className="text-cyan-400 text-[11px]">NIST FIPS 204 (ML-DSA-87)</span>
            </div>

            {/* Micro-Details */}
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-1 border-t border-white/5">
              <span>Time: {event.timestamp}</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400 animate-spin" />
                <span>Radial Wavefront Broadcast across 10 Guardian Cards</span>
              </span>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
