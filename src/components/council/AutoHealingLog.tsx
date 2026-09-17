import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, ShieldAlert, Sparkles, RefreshCw, Terminal, CheckCircle2 } from 'lucide-react';
import { playTone } from '../AudioSynthesizer';

interface LogEntry {
  id: number;
  time: string;
  message: string;
  targetNode: string;
  status: 'HEALED' | 'MITIGATED' | 'PROTECTED';
}

const INITIAL_LOGS: LogEntry[] = [
  { id: 1, time: '18:32:01', message: 'Anomaly detected on Mesh Node #04 (Jitter spike > 1.2ms) — sub-kelvin recalibrated', targetNode: 'HSM-04', status: 'HEALED' },
  { id: 2, time: '18:29:45', message: 'PQC Dilithium-5 handshake re-routed via Sovereign Subnet B (Zero packet drop)', targetNode: 'MESH-SUB-B', status: 'MITIGATED' },
  { id: 3, time: '18:24:10', message: 'Quantum entropy generator auto-tuned: TRNG rate stabilized at 2,048 KB/s', targetNode: 'HSM-01', status: 'PROTECTED' },
];

export const AutoHealingLog: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [isSimulating, setIsSimulating] = useState(true);

  useEffect(() => {
    if (!isSimulating) return;

    const sampleMessages = [
      { msg: 'Micro-instability isolated and auto-corrected via Quorum Consensus #08', node: 'HSM-08', status: 'HEALED' as const },
      { msg: 'Cryogenic thermal drift compensated on Bus #03 (0.019K -> 0.014K)', node: 'CRYO-BUS-3', status: 'HEALED' as const },
      { msg: 'NIST FIPS 204 ML-DSA-87 signature verified with 0-entropy degradation', node: 'PQC-ENCLAVE', status: 'PROTECTED' as const },
      { msg: 'Lattice key-pair rotated across Sovereign Guardian #02 Enclave', node: 'HSM-02', status: 'MITIGATED' as const },
    ];

    const interval = setInterval(() => {
      const sample = sampleMessages[Math.floor(Math.random() * sampleMessages.length)];
      const newLog: LogEntry = {
        id: Date.now(),
        time: new Date().toLocaleTimeString('th-TH', { hour12: false }),
        message: sample.msg,
        targetNode: sample.node,
        status: sample.status,
      };

      setLogs((prev) => [newLog, ...prev.slice(0, 3)]);
      playTone(720, 0.04, 'sine');
    }, 14000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  return (
    <div className="bg-[#0b0f17]/95 border border-amber-500/30 rounded-3xl p-6 backdrop-blur-2xl shadow-xl space-y-4 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Terminal className="w-4 h-4" />
            </div>
            <h3 className="text-amber-400 font-bold text-sm sm:text-base tracking-wide flex items-center gap-2 font-mono">
              <span>Automated Threat Auto-Healing Log</span>
            </h3>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Self-remediation engine & autonomous mesh defense telemetry
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            DEFENSE ACTIVE
          </span>
        </div>
      </div>

      <div className="space-y-2.5 font-mono text-xs max-h-[195px] overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10, y: -5 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/80 border border-slate-800/80 hover:border-amber-500/40 p-3 rounded-2xl gap-2 transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-slate-500 shrink-0 text-[11px]">{log.time}</span>
                <span className="text-amber-400/90 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 shrink-0 font-bold">
                  {log.targetNode}
                </span>
                <span className="text-slate-200 text-xs truncate" title={log.message}>
                  {log.message}
                </span>
              </div>

              <div className="flex items-center justify-end">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                    log.status === 'HEALED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : log.status === 'PROTECTED'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {log.status}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
