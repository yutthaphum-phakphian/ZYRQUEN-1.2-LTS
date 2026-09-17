import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, ShieldCheck, Link2, Lock, X, Hexagon, Activity, Network } from 'lucide-react';

interface Block {
  id: number;
  hash: string;
  timestamp: string;
  status: 'ANCHORED' | 'PENDING';
}

interface ImmutableLineageGraphProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImmutableLineageGraph: React.FC<ImmutableLineageGraphProps> = ({ isOpen, onClose }) => {
  const [blocks, setBlocks] = useState<Block[]>([
    { id: 849202, hash: '0x909ab814...fa4c68', timestamp: '12:15:00', status: 'ANCHORED' },
    { id: 849203, hash: '0x1a2b3c4d...e5f6g7', timestamp: '12:15:45', status: 'ANCHORED' },
    { id: 849204, hash: '0x7h8i9j0k...l1m2n3', timestamp: '12:16:30', status: 'ANCHORED' },
    { id: 849205, hash: '0x4o5p6q7r...s8t9u0', timestamp: '12:17:15', status: 'ANCHORED' },
    { id: 849206, hash: '0xv1w2x3y4...z5a6b7', timestamp: '12:18:00', status: 'ANCHORED' },
    { id: 849207, hash: '0xc8d9e0f1...g2h3i4', timestamp: '12:18:45', status: 'ANCHORED' },
  ]);

  const [headBlock, setHeadBlock] = useState<Block>({
    id: 849208,
    hash: '0x849208aa...bbccddee',
    timestamp: '12:19:30',
    status: 'PENDING',
  });

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      timer = setTimeout(() => {
        setHeadBlock((prev) => ({ ...prev, status: 'ANCHORED' }));
      }, 3000); // Simulate block sealing
    }
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-5xl rounded-3xl border border-emerald-500/30 bg-zinc-950/80 p-8 text-white shadow-[0_0_100px_rgba(16,185,129,0.15)]"
        >
          {/* Holographic Background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20 rounded-3xl"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(16,185,129,0.1) 0%, transparent 70%), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(16,185,129,0.05) 40px, rgba(16,185,129,0.05) 80px)'
            }}
          />

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between w-full mb-8">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 uppercase">
                  Immutable Lineage Graph
                </h2>
                <p className="text-xs text-zinc-400 font-mono flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  Sovereign Ledger V25 - Real-time Anchoring
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Blockchain Visualizer */}
            <div className="flex-1 min-h-[300px] flex items-center gap-4 overflow-x-auto py-8 custom-scrollbar relative px-4">
              
              {blocks.map((block, index) => (
                <React.Fragment key={block.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="shrink-0 w-48 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-4 relative"
                  >
                    <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Lock className="w-3.5 h-3.5 text-black" />
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block mb-2">Block #{block.id}</span>
                    <p className="text-xs font-mono text-zinc-300 break-all bg-black/50 p-2 rounded-lg border border-white/5">{block.hash}</p>
                    <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                      <span>{block.timestamp} ICT</span>
                      <span className="text-emerald-500 font-bold">SEALED</span>
                    </div>
                  </motion.div>
                  
                  {/* Connection Line */}
                  <div className="shrink-0 w-8 flex items-center justify-center">
                    <Link2 className="w-5 h-5 text-emerald-500/50" />
                  </div>
                </React.Fragment>
              ))}

              {/* Head Block (Pending -> Anchored) */}
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className={`shrink-0 w-56 rounded-xl border-2 p-5 relative ${
                  headBlock.status === 'ANCHORED'
                    ? 'border-emerald-400 bg-emerald-950/40 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                    : 'border-amber-500/50 bg-amber-950/30 border-dashed animate-pulse'
                }`}
              >
                <div className={`absolute -top-4 -right-4 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                  headBlock.status === 'ANCHORED' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-amber-500 shadow-amber-500/50'
                }`}>
                  {headBlock.status === 'ANCHORED' ? <ShieldCheck className="w-4 h-4 text-black" /> : <Activity className="w-4 h-4 text-black animate-spin-slow" />}
                </div>
                <span className={`text-[11px] font-mono uppercase tracking-widest block mb-2 font-bold ${
                  headBlock.status === 'ANCHORED' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  Block #{headBlock.id} (Head)
                </span>
                <p className="text-xs font-mono text-white break-all bg-black/80 p-2 rounded-lg border border-white/10">{headBlock.hash}</p>
                <div className="mt-4 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-zinc-400">{headBlock.timestamp} ICT</span>
                  <span className={`font-bold ${headBlock.status === 'ANCHORED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {headBlock.status === 'ANCHORED' ? 'ANCHORED' : 'QUORUM SYNCING...'}
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Bottom Status Panel */}
            <div className="grid grid-cols-4 gap-6 w-full mt-4">
              <div className="p-4 rounded-2xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Lineage Integrity</span>
                <p className="text-lg font-bold text-emerald-400 font-mono flex items-center gap-2">
                  100% SECURE <ShieldCheck className="w-4 h-4" />
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Drift Delta</span>
                <p className="text-lg font-bold text-cyan-400 font-mono flex items-center gap-2">
                  Δ 0.00 %
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Total Seals</span>
                <p className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  14,902 Verified
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-black/60 border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Chain Status</span>
                <p className="text-lg font-bold text-emerald-400 font-mono flex items-center gap-2">
                  IMMUTABLE <Hexagon className="w-4 h-4" />
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
