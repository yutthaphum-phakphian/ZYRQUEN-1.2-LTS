import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, CheckCircle2, Lock, X, Fingerprint, Zap } from 'lucide-react';

export interface CustodianNodeData {
  id: number;
  name: string;
  epId: string;
  timestamp: string;
  status: string;
  hash: string;
  pubKey: string;
  quantumEntropy: string;
  signatureProof: string;
  merklePath: string[];
}

interface QuorumRingGraphProps {
  custodiansCount?: number;
  signedCount?: number;
  heartbeat: number;
}

export const QuorumRingGraph: React.FC<QuorumRingGraphProps> = ({ custodiansCount = 10, signedCount = 10, heartbeat }) => {
  const [custodians, setCustodians] = useState<CustodianNodeData[]>([]);
  const [hoveredNode, setHoveredNode] = useState<CustodianNodeData | null>(null);
  const [selectedNode, setSelectedNode] = useState<CustodianNodeData | null>(null);

  useEffect(() => {
    const initial = Array.from({ length: custodiansCount }, (_, i) => ({
      id: i + 1,
      name: `Custodian ${String(i + 1).padStart(2, '0')}`,
      epId: `EP-SIG-9082-${String(i + 1).padStart(3, '0')}`,
      timestamp: new Date(Date.now() - (custodiansCount - i) * 1420).toISOString().replace('T', ' ').substring(0, 19) + ' ICT',
      status: i < signedCount ? 'Signed' : 'Pending',
      hash: `0x849208${Math.random().toString(16).substring(2, 8)}`,
      pubKey: `0x04${Math.random().toString(16).substring(2, 34)}...${Math.random().toString(16).substring(2, 10)}`,
      quantumEntropy: (99.999 + Math.random() * 0.0009).toFixed(6),
      signatureProof: `0x8f9a2b${Math.random().toString(16).substring(2, 40)}...${Math.random().toString(16).substring(2, 10)}`,
      merklePath: [
        `0x${Math.random().toString(16).substring(2, 10)}`,
        `0x${Math.random().toString(16).substring(2, 10)}`,
        `#849208`
      ]
    }));
    setCustodians(initial);
  }, [custodiansCount, signedCount]);

  // Simulate live updates for Entropy and Timestamp to show "real-time verification status"
  useEffect(() => {
    const simulateLiveUpdate = setInterval(() => {
      const targetId = Math.floor(Math.random() * custodiansCount) + 1;
      setCustodians((prev) =>
        prev.map((c) =>
          c.id === targetId && c.status === 'Signed'
            ? {
                ...c,
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' ICT',
                quantumEntropy: (99.999 + Math.random() * 0.0009).toFixed(6),
              }
            : c
        )
      );
    }, 3000);
    return () => clearInterval(simulateLiveUpdate);
  }, [custodiansCount]);

  const radius = 150;
  const center = 200;

  return (
    <div className="relative flex flex-col items-center justify-center p-6 w-full max-w-2xl mx-auto overflow-visible">
      {/* Main Quorum Ring SVG + Nodes */}
      <div className="relative w-[400px] h-[400px] flex items-center justify-center">
        
        {/* Rotating Energy Core Glow */}
        <motion.div
          className="absolute w-[320px] h-[320px] rounded-full border border-cyan-500/20 bg-cyan-500/5 blur-md"
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />

        <motion.div
          className="absolute w-[240px] h-[240px] rounded-full border-2 border-dashed border-cyan-400/30"
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        />

        {/* SVG Ring Connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 400">
          <circle cx={center} cy={center} r={radius} className="stroke-cyan-800/40" strokeWidth="2" fill="none" />
          {custodians.map((c, index) => {
            const angle = (index * (360 / custodiansCount) - 90) * (Math.PI / 180);
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);
            const isSigned = c.status === 'Signed';
            
            return (
              <motion.line
                key={`conn-${index}`}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                className={isSigned ? "stroke-cyan-500/40" : "stroke-zinc-700/50"}
                strokeWidth={isSigned ? "2" : "1"}
                strokeDasharray={isSigned ? "none" : "4 2"}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: index * 0.1 }}
              />
            );
          })}
        </svg>

        {/* Core Quantum Engine Indicator */}
        <div className="z-10 flex flex-col items-center justify-center w-28 h-28 rounded-full bg-slate-900 border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
          <motion.div
            className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]"
            animate={{ scale: [1, 1.6, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="text-[10px] text-cyan-300 mt-2 font-bold tracking-widest font-mono">CORE PULSE</span>
          <span className="text-[9px] text-emerald-400 font-mono">99.9999%</span>
        </div>

        {/* Custodian Nodes */}
        <motion.div
          className="absolute inset-0"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.12,
                delayChildren: 0.1
              }
            }
          }}
        >
          <AnimatePresence>
            {custodians.map((custodian, index) => {
              const angle = (index * (360 / custodiansCount) - 90) * (Math.PI / 180);
              const x = center + radius * Math.cos(angle) - 20; // 20px offset for node width/2 (w-10 = 40px)
              const y = center + radius * Math.sin(angle) - 20;
              const isSigned = custodian.status === 'Signed';

              return (
                <motion.div
                  key={custodian.id}
                  custom={{ startX: center - x - 20, startY: center - y - 20 }}
                  variants={{
                    hidden: (custom: any) => ({
                      opacity: 0,
                      scale: 0.5,
                      x: custom.startX,
                      y: custom.startY
                    }),
                    visible: {
                      opacity: 1,
                      scale: 1,
                      x: 0,
                      y: 0,
                      transition: {
                        type: "spring",
                        stiffness: 100,
                        damping: 15
                      }
                    },
                    exit: {
                      opacity: 0,
                      scale: 0,
                      transition: { duration: 0.2 }
                    }
                  }}
                  className="absolute z-20 cursor-pointer"
                  style={{ left: `${x}px`, top: `${y}px` }}
                  onMouseEnter={() => setHoveredNode(custodian)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => setSelectedNode(custodian)}
                >
                  {/* Subtle Rotating Energy Glow Around Node */}
                  {isSigned && (
                    <motion.div
                      className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-indigo-500 opacity-60 blur-[3px]"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4 + index, repeat: Infinity, ease: "linear" }}
                    />
                  )}

                  {/* Global Heartbeat Synchronized Verification Pulse */}
                  {isSigned && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-emerald-400/40"
                      animate={{
                        scale: [1, 1.8, 1],
                        opacity: [0.7, 0, 0.7]
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: (index % 3) * 0.15, // Pulse synced with Heartbeat cycle
                        ease: "easeInOut"
                      }}
                    />
                  )}

                  {/* Main Node Body */}
                  <motion.div
                    className={`relative w-10 h-10 rounded-full border-2 flex flex-col items-center justify-center bg-zinc-950 transition-colors ${
                      isSigned ? 'border-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.6)] hover:border-cyan-300' : 'border-zinc-700'
                    }`}
                    whileHover={{ scale: 1.25 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isSigned ? (
                       <span className="text-xs font-bold text-emerald-300 font-mono">{custodian.id}</span>
                    ) : (
                       <Lock className="w-4 h-4 text-zinc-500" />
                    )}
                  </motion.div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Hover Tooltip */}
        <AnimatePresence>
          {hoveredNode && !selectedNode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.15 }}
              className="absolute z-30 bottom-4 bg-zinc-950/95 border border-cyan-500/60 p-3 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.4)] backdrop-blur-md text-xs w-64 pointer-events-none"
            >
              <div className="flex justify-between items-center border-b border-cyan-800/50 pb-1 mb-2">
                <span className="font-bold text-cyan-200">{hoveredNode.name}</span>
                <span className="px-1.5 py-0.5 text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-500/50 rounded font-semibold">
                  {hoveredNode.status}
                </span>
              </div>
              <div className="space-y-1 text-zinc-300 text-[11px] font-mono">
                <p><span className="text-zinc-500">EP-ID:</span> <span className="text-cyan-300">{hoveredNode.epId}</span></p>
                <p><span className="text-zinc-500">Signed At:</span> {hoveredNode.timestamp}</p>
                {hoveredNode.status === 'Signed' && (
                  <p><span className="text-zinc-500">Entropy:</span> <span className="text-emerald-400">{hoveredNode.quantumEntropy}% Coherent</span></p>
                )}
              </div>
              {hoveredNode.status === 'Signed' && (
                <div className="mt-2 text-[9px] text-cyan-400/80 text-center border-t border-cyan-900/50 pt-1">
                  Click node to inspect Merkle & Cryptographic Proofs
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Cryptographic Detail Modal (OnClick Event) */}
      <AnimatePresence>
        {selectedNode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-zinc-950 border border-cyan-500/50 rounded-2xl p-6 shadow-[0_0_60px_rgba(6,182,212,0.25)] font-mono text-zinc-200"
            >
              {/* Close Button */}
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedNode(null); }}
                className="absolute top-4 right-4 text-zinc-400 hover:text-cyan-300 p-2 transition-colors rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-3 border-b border-cyan-800/60 pb-4 mb-5">
                <div className="w-12 h-12 rounded-full bg-emerald-950 border-2 border-emerald-400 flex items-center justify-center font-bold text-emerald-300 text-lg shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  {selectedNode.id}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-cyan-200">{selectedNode.name} Signature Proof</h4>
                  <div className="text-xs text-zinc-400 mt-1">EP-ID: <span className="text-cyan-400">{selectedNode.epId}</span></div>
                </div>
              </div>

              {/* Modal Content / Proof Details */}
              {selectedNode.status === 'Signed' ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="text-zinc-500 text-[10px] uppercase tracking-wider block mb-1.5">Public Key Identifier</label>
                    <div className="p-2.5 bg-black rounded-lg border border-zinc-800 text-cyan-300 break-all select-all">
                      {selectedNode.pubKey}
                    </div>
                  </div>

                  <div>
                    <label className="text-zinc-500 text-[10px] uppercase tracking-wider block mb-1.5">Cryptographic Signature Proof</label>
                    <div className="p-2.5 bg-black rounded-lg border border-zinc-800 text-emerald-400 break-all select-all">
                      {selectedNode.signatureProof}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-zinc-500 text-[10px] uppercase tracking-wider block mb-1.5">Quantum Entropy</label>
                      <div className="p-2.5 bg-black rounded-lg border border-zinc-800 text-emerald-400 font-bold">
                        {selectedNode.quantumEntropy}% Coherent
                      </div>
                    </div>
                    <div>
                      <label className="text-zinc-500 text-[10px] uppercase tracking-wider block mb-1.5">Timestamp</label>
                      <div className="p-2.5 bg-black rounded-lg border border-zinc-800 text-zinc-300">
                        {selectedNode.timestamp}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-zinc-500 text-[10px] uppercase tracking-wider block mb-1.5">Merkle Proof Path</label>
                    <div className="p-3 bg-black rounded-lg border border-zinc-800 text-zinc-400 space-y-2">
                      {selectedNode.merklePath.map((path, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[11px]">
                          <span>Level {idx}:</span>
                          <span className="text-cyan-300 font-mono">{path}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-zinc-500 flex flex-col items-center">
                  <Lock className="w-12 h-12 mb-4 opacity-50" />
                  <p>Signature Pending</p>
                  <p className="text-[10px] mt-2">Waiting for Custodian Quorum Verification...</p>
                </div>
              )}

              {/* Modal Footer */}
              <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-between items-center text-[10px] text-zinc-400">
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  SOVEREIGN VERIFIED
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedNode(null); }}
                  className="px-5 py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 rounded-lg transition-colors font-bold uppercase"
                >
                  Close Proof
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface QuorumRingGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  signedCount?: number;
}

export const QuorumRingGraphModal: React.FC<QuorumRingGraphModalProps> = ({ isOpen, onClose, signedCount = 10 }) => {
  const [heartbeat, setHeartbeat] = useState(0);

  // 1. Global Consensus Heartbeat State Loop
  useEffect(() => {
    if (!isOpen) return;
    const pulseInterval = setInterval(() => {
      setHeartbeat((prev) => (prev + 1) % 100);
    }, 1200); // 1.2s Heartbeat pulse timing

    return () => clearInterval(pulseInterval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl rounded-3xl border border-cyan-500/30 bg-zinc-950/90 p-8 text-white shadow-[0_0_100px_rgba(6,182,212,0.15)] overflow-hidden"
        >
          {/* Scanline Background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6, 182, 212, 0.1) 2px, rgba(6, 182, 212, 0.1) 4px)'
            }}
          />

          <div className="relative z-10 flex flex-col items-center justify-center h-full">
            <div className="flex items-center justify-between w-full mb-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] tracking-widest text-cyan-500 uppercase font-mono">Sovereign Consensus Binding</span>
                  {/* Global Heartbeat Indicator */}
                  <div className="flex items-center gap-1.5 bg-zinc-900/80 px-2 py-0.5 rounded-full border border-cyan-900">
                    <motion.span
                      className="w-2 h-2 rounded-full bg-emerald-400"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <span className="text-[9px] text-zinc-300 font-mono">HEARTBEAT: {heartbeat}</span>
                  </div>
                </div>
                <h2 className="text-2xl font-bold font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 uppercase">
                  MAEW Ω∞ Custodian Quorum Ring
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="w-full text-xs text-zinc-400 mt-1 mb-6 font-mono text-left">
              Merkle Root: <span className="text-emerald-400 font-semibold">#849208</span> | Status: <span className="text-emerald-400 font-semibold">{signedCount}/10 Verified</span>
            </div>

            <div className="py-2 w-full flex justify-center">
              <QuorumRingGraph signedCount={signedCount} heartbeat={heartbeat} />
            </div>

            <div className="grid grid-cols-3 gap-6 w-full mt-8">
              <div className="p-4 rounded-2xl bg-black/60 border border-white/5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Signatures</span>
                  <p className="text-lg font-bold font-mono text-white">{signedCount}/10 Validated</p>
                </div>
              </div>
              
              <div className="p-4 rounded-2xl bg-black/60 border border-white/5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-violet-500/20 border border-violet-500/50 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Consensus State</span>
                  <p className="text-lg font-bold font-mono text-white">
                    {signedCount === 10 ? 'IMMUTABLE LOCK' : 'PENDING'}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/60 border border-white/5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Ledger Anchor</span>
                  <p className="text-lg font-bold font-mono text-white">#849208 Anchored</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
