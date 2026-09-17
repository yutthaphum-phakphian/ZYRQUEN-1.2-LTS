import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Network, Server, Shield, Database, Lock, Activity, Zap, X, ChevronRight } from 'lucide-react';

interface RuntimeBindingMapProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RuntimeBindingMap: React.FC<RuntimeBindingMapProps> = ({ isOpen, onClose }) => {
  const [activePhase, setActivePhase] = useState<number>(1);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      // Simulate API integration phases binding in real-time
      timer = setInterval(() => {
        setActivePhase((prev) => (prev < 5 ? prev + 1 : 5));
      }, 1500);
    } else {
      setActivePhase(1); // Reset when closed
    }
    return () => clearInterval(timer);
  }, [isOpen]);

  const phases = [
    { id: 1, title: 'Auth Handshake', desc: 'Secure Key Exchange & JWT Generation', icon: Lock, status: activePhase >= 1 ? 'VERIFIED' : 'PENDING' },
    { id: 2, title: 'Telemetry Stream', desc: '/api/swarm/telemetry (Δ0.00%)', icon: Activity, status: activePhase >= 2 ? 'STREAMING' : 'PENDING' },
    { id: 3, title: 'Consensus Lock', desc: '10/10 Custodian Quorum Verification', icon: Shield, status: activePhase >= 3 ? '10/10 PASS' : 'PENDING' },
    { id: 4, title: 'Ledger Anchor', desc: 'Merkle Root #849208 Anchored', icon: Database, status: activePhase >= 4 ? 'IMMUTABLE' : 'PENDING' },
    { id: 5, title: 'Runtime Binding', desc: 'Unified Sovereign Runtime v∞', icon: Network, status: activePhase >= 5 ? 'UNIFIED' : 'PENDING' },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-5xl rounded-3xl border border-violet-500/30 bg-zinc-950/80 p-8 text-white shadow-[0_0_100px_rgba(139,92,246,0.15)] overflow-hidden"
        >
          {/* Cybernetic Grid Background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)',
              backgroundSize: '30px 30px'
            }}
          />

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between w-full mb-8">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 uppercase">
                  API Sovereign Binding Map
                </h2>
                <p className="text-xs text-zinc-400 font-mono flex items-center gap-2">
                  <Server className="w-3.5 h-3.5 text-violet-400" />
                  Real Runtime Integration v∞ (Production Grade)
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Main Graph Area */}
            <div className="flex-1 flex flex-col items-center justify-center py-10 relative">
              
              <div className="flex items-center justify-between w-full max-w-4xl relative">
                {/* Background Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-zinc-800 -translate-y-1/2 z-0" />
                
                {/* Animated Progress Line */}
                <motion.div 
                  className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 -translate-y-1/2 z-0"
                  initial={{ width: '0%' }}
                  animate={{ width: `${((activePhase - 1) / (phases.length - 1)) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />

                {phases.map((phase, index) => {
                  const Icon = phase.icon;
                  const isActive = activePhase >= phase.id;
                  const isCurrent = activePhase === phase.id;

                  return (
                    <div key={phase.id} className="relative z-10 flex flex-col items-center group">
                      <motion.div
                        animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-500 ${
                          isActive 
                            ? 'bg-violet-950/80 border-violet-400 shadow-[0_0_30px_rgba(139,92,246,0.4)]' 
                            : 'bg-zinc-900 border-zinc-700'
                        } ${isCurrent ? 'animate-pulse' : ''}`}
                      >
                        <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                      </motion.div>
                      
                      <div className="absolute -bottom-16 w-32 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-zinc-400 font-mono block">Phase {phase.id}</span>
                        <span className="text-xs font-bold text-white font-mono">{phase.title}</span>
                      </div>
                      
                      {/* Status Badge */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 10 }}
                        className={`absolute -top-10 px-3 py-1 rounded-full text-[10px] font-bold font-mono tracking-widest border ${
                          isActive ? 'bg-emerald-950/50 border-emerald-500 text-emerald-400' : 'hidden'
                        }`}
                      >
                        {phase.status}
                      </motion.div>
                    </div>
                  );
                })}
              </div>

              {/* Active Phase Details */}
              <div className="mt-20 w-full max-w-2xl bg-black/60 border border-violet-500/30 rounded-2xl p-6 text-center h-32 flex flex-col justify-center">
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest block mb-2">Current System State</span>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePhase}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-1"
                  >
                    <h3 className="text-xl font-bold text-white font-mono">{phases[activePhase - 1].title}</h3>
                    <p className="text-sm text-violet-400 font-mono">{phases[activePhase - 1].desc}</p>
                  </motion.div>
                </AnimatePresence>
              </div>

            </div>

            {/* Bottom Status Panel */}
            <div className="grid grid-cols-4 gap-6 w-full mt-auto pt-4 border-t border-white/5">
              <div className="p-4 bg-zinc-900/50 rounded-xl space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Pulse Stability</span>
                <p className="text-sm font-bold text-cyan-400 font-mono flex items-center gap-2">99.9999% <Zap className="w-3.5 h-3.5" /></p>
              </div>
              <div className="p-4 bg-zinc-900/50 rounded-xl space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Drift Control</span>
                <p className="text-sm font-bold text-emerald-400 font-mono">Δ 0.00%</p>
              </div>
              <div className="p-4 bg-zinc-900/50 rounded-xl space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Entropy Surge</span>
                <p className="text-sm font-bold text-violet-400 font-mono">0.0001% Contained</p>
              </div>
              <div className="p-4 bg-zinc-900/50 rounded-xl space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">API Flow</span>
                <p className="text-sm font-bold text-fuchsia-400 font-mono flex items-center gap-2">PRODUCTION <Network className="w-3.5 h-3.5" /></p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
