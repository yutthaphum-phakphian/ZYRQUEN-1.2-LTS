import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Cpu, Database, CheckCircle2, AlertTriangle, Layers, X, ScanFace, Activity } from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';

interface SealValidationAnimationProps {
  onComplete: () => void;
  onClose: () => void;
}

export function SealValidationAnimation({ onComplete, onClose }: SealValidationAnimationProps) {
  const TOTAL_SEALS = 14902;
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'initializing' | 'scanning' | 'verifying' | 'finalizing' | 'complete'>('initializing');
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentHash, setCurrentHash] = useState('');

  const generateHash = () => {
    const chars = '0123456789abcdef';
    return Array.from({ length: 64 }).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 8));
  };

  useEffect(() => {
    let frameId: number;
    let startTime: number;
    let lastLogTime = 0;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      
      const duration = 6000; // 6 seconds total
      const p = Math.min(elapsed / duration, 1);
      
      setProgress(p * 100);
      
      // Update counts exponentially to make it look cool
      const easeOutQuart = 1 - Math.pow(1 - p, 4);
      setVerifiedCount(Math.floor(easeOutQuart * TOTAL_SEALS));

      if (elapsed - lastLogTime > 150) {
        setCurrentHash(generateHash());
        lastLogTime = elapsed;
        
        if (p < 0.2) {
          if (stage !== 'initializing') { setStage('initializing'); addLog('Initializing Merkle Root Anchor...'); playTone(400, 0.05); }
        } else if (p < 0.5) {
          if (stage !== 'scanning') { setStage('scanning'); addLog('Scanning Sovereign Chambers...'); playTone(450, 0.05); }
        } else if (p < 0.8) {
          if (stage !== 'verifying') { setStage('verifying'); addLog(`Cross-referencing signatures...`); playTone(500, 0.05); }
        } else if (p < 1) {
          if (stage !== 'finalizing') { setStage('finalizing'); addLog('Finalizing state mutations (0.00%)...'); playTone(550, 0.05); }
        }
      }

      if (p < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        setStage('complete');
        setVerifiedCount(TOTAL_SEALS);
        addLog(`SUCCESS: ${TOTAL_SEALS}/${TOTAL_SEALS} Cryptographic Seals LOCKED.`);
        playAuditChime();
        setTimeout(() => {
          onComplete();
        }, 3000);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-[#0a0f1e] border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-900/20 overflow-hidden relative flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <ScanFace className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
              System-Wide Seal Validation
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 flex flex-col items-center justify-center space-y-8 relative overflow-hidden">
          
          {/* Background Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)] pointer-events-none" />

          {/* Central Visualization */}
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Outer Rotating Ring */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 border-2 border-dashed border-cyan-500/30 rounded-full"
            />
            {/* Inner Pulsing Ring */}
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-4 border border-cyan-400/40 rounded-full bg-cyan-900/10"
            />
            
            {/* Core Icon */}
            <div className="relative z-10 flex flex-col items-center justify-center text-cyan-300">
              {stage === 'complete' ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  <ShieldCheck className="w-16 h-16 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                </motion.div>
              ) : (
                <ShieldCheck className="w-16 h-16 text-cyan-400" />
              )}
            </div>

            {/* Orbiting Particles */}
            {stage !== 'complete' && (
              <>
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0"
                >
                  <div className="absolute top-0 left-1/2 -ml-1 w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.8)]" />
                </motion.div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-6"
                >
                  <div className="absolute bottom-0 left-1/2 -ml-1 w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
                </motion.div>
              </>
            )}
          </div>

          {/* Progress Section */}
          <div className="w-full space-y-3 z-10">
            <div className="flex items-end justify-between font-mono">
              <div className="text-cyan-300 text-sm font-bold">
                {stage === 'complete' ? 'VERIFIED' : 'SCANNING'}
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-white tracking-widest">
                  {verifiedCount.toLocaleString()} <span className="text-sm text-zinc-500">/ {TOTAL_SEALS.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden border border-white/5 relative">
              <motion.div 
                className={`absolute top-0 bottom-0 left-0 ${stage === 'complete' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            
            {/* Hash Display */}
            <div className="text-[10px] text-center font-mono text-zinc-500 truncate mt-2 font-light">
              <span className="text-cyan-600">CURRENT_ROOT:</span> {currentHash || 'AWAITING_HASH_SEQUENCE'}
            </div>
          </div>

          {/* Terminal Logs */}
          <div className="w-full h-32 bg-black/60 border border-white/5 rounded-xl p-3 overflow-hidden z-10 flex flex-col justify-end">
            <div className="space-y-1 font-mono text-[10px]">
              <AnimatePresence>
                {logs.map((log, i) => (
                  <motion.div
                    key={i + log}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1 - i * 0.15, x: 0 }}
                    className={i === 0 && stage === 'complete' ? 'text-emerald-400 font-bold' : 'text-zinc-400'}
                  >
                    <span className="text-zinc-600 mr-2">[{new Date().toISOString().substring(11, 23)}]</span>
                    {log}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
