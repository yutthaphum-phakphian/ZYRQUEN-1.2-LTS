import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Lock, Activity, Hexagon, Fingerprint, Zap } from 'lucide-react';

interface ConsensusCorePulseMonitorProps {
  isOpen: boolean;
  onClose: () => void;
  custodianCount?: number;
}

export const ConsensusCorePulseMonitor: React.FC<ConsensusCorePulseMonitorProps> = ({
  isOpen,
  onClose,
  custodianCount = 10,
}) => {
  const [pulseCount, setPulseCount] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen) {
      interval = setInterval(() => {
        setPulseCount((prev) => prev + 1);
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Generate 10 nodes for the Quorum Ring
  const nodes = Array.from({ length: custodianCount }, (_, i) => {
    const angle = (i * 360) / custodianCount;
    return { id: i, angle };
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-4xl rounded-3xl border border-cyan-500/30 bg-zinc-950 p-8 text-white shadow-[0_0_80px_rgba(6,182,212,0.15)] overflow-hidden"
        >
          {/* Grid Background */}
          <div className="absolute inset-0 pointer-events-none opacity-20"
               style={{
                 backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.2) 1px, transparent 1px)',
                 backgroundSize: '40px 40px'
               }}
          />

          <div className="relative z-10 flex flex-col items-center justify-center space-y-12 h-full min-h-[500px]">
            
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 font-mono uppercase">
                Consensus Core Pulse Monitor
              </h2>
              <p className="text-zinc-400 text-sm font-mono flex items-center justify-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                Sovereign Quorum Visualization v∞
              </p>
            </div>

            {/* Quorum Ring Visualization */}
            <div className="relative w-80 h-80 flex items-center justify-center">
              
              {/* Central Core */}
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 20px 0px rgba(6, 182, 212, 0.4)',
                    '0 0 60px 10px rgba(6, 182, 212, 0.8)',
                    '0 0 20px 0px rgba(6, 182, 212, 0.4)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="relative z-20 w-32 h-32 rounded-full bg-zinc-900 border-2 border-cyan-400 flex flex-col items-center justify-center"
              >
                <Hexagon className="w-12 h-12 text-cyan-300 absolute opacity-20" />
                <Fingerprint className="w-8 h-8 text-cyan-400 mb-1" />
                <span className="text-[10px] font-mono font-bold text-cyan-300 tracking-widest">ROOT</span>
                <span className="text-[9px] font-mono text-cyan-500">#849208</span>
              </motion.div>

              {/* Connecting Beams */}
              <svg className="absolute inset-0 w-full h-full z-10" viewBox="0 0 320 320">
                {nodes.map((node) => {
                  const radius = 140;
                  const centerX = 160;
                  const centerY = 160;
                  const x = centerX + radius * Math.cos((node.angle * Math.PI) / 180);
                  const y = centerY + radius * Math.sin((node.angle * Math.PI) / 180);
                  
                  return (
                    <motion.line
                      key={`beam-${node.id}`}
                      x1={centerX}
                      y1={centerY}
                      x2={x}
                      y2={y}
                      stroke="rgba(6, 182, 212, 0.3)"
                      strokeWidth="2"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ 
                        pathLength: [0, 1, 0],
                        opacity: [0.1, 0.8, 0.1],
                        stroke: ['rgba(6,182,212,0.2)', 'rgba(139,92,246,0.8)', 'rgba(6,182,212,0.2)']
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: node.id * 0.15,
                        ease: "linear"
                      }}
                    />
                  );
                })}
              </svg>

              {/* Custodian Nodes */}
              {nodes.map((node) => {
                const radius = 140; // Distance from center
                return (
                  <motion.div
                    key={node.id}
                    className="absolute z-30"
                    style={{
                      transform: `rotate(${node.angle}deg) translate(${radius}px) rotate(-${node.angle}deg)`,
                    }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: node.id * 0.1 }}
                      className="w-10 h-10 rounded-full bg-zinc-900 border border-violet-500/50 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)] relative group cursor-pointer"
                    >
                      <Lock className="w-4 h-4 text-violet-400 group-hover:text-violet-300" />
                      
                      {/* Tooltip */}
                      <div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/10 text-[10px] font-mono px-2 py-1 rounded whitespace-nowrap text-zinc-300">
                        Custodian-{String(node.id + 1).padStart(2, '0')}
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>

            {/* Status Panel */}
            <div className="grid grid-cols-4 gap-4 w-full">
              <div className="p-4 rounded-2xl bg-black/50 border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Quorum State</span>
                <p className="text-lg font-bold text-emerald-400 font-mono">10/10 SIGNED</p>
              </div>
              <div className="p-4 rounded-2xl bg-black/50 border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Phase Alignment</span>
                <p className="text-lg font-bold text-cyan-400 font-mono">0.99999 π</p>
              </div>
              <div className="p-4 rounded-2xl bg-black/50 border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Drift Δ</span>
                <p className="text-lg font-bold text-violet-400 font-mono flex items-center gap-2">
                  0.00 % <Zap className="w-4 h-4" />
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-black/50 border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Consensus Lock</span>
                <p className="text-lg font-bold text-amber-400 font-mono flex items-center gap-2">
                  IMMUTABLE <Shield className="w-4 h-4" />
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-6 px-8 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-white font-mono text-xs uppercase tracking-widest transition-all"
            >
              Close Overlay
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
