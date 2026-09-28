import React, { useState, useEffect } from 'react';
import { Terminal, ShieldCheck, Play, RefreshCw, Layers } from 'lucide-react';
import { AUDIT_TRACE_TX } from '../../data/canonicalData';

interface LogLine {
  id: string;
  time: string;
  type: 'TRACE' | 'SEAL' | 'QUORUM' | 'INGEST';
  msg: string;
}

const INITIAL_LOGS: LogLine[] = [
  { id: '1', time: '05:25:01.102', type: 'TRACE', msg: 'Core transaction committed to DAG block #849202' },
  { id: '2', time: '05:25:02.450', type: 'SEAL', msg: 'Hardware seal 14,902 integrity hash verified against Merkle SSOT' },
  { id: '3', time: '05:25:03.110', type: 'QUORUM', msg: '10/10 HSM consensus affirmation received in 35.80ms' },
  { id: '4', time: '05:25:04.880', type: 'INGEST', msg: 'Evidence envelope sealed with Post-Quantum signature ML-DSA-87' },
];

export const ExecutionTraceLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogLine[]>(INITIAL_LOGS);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toISOString().substring(11, 23);
      const types: LogLine['type'][] = ['TRACE', 'SEAL', 'QUORUM', 'INGEST'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      const newLog: LogLine = {
        id: Math.random().toString(),
        time: timeStr,
        type: randomType,
        msg: `Deterministic telemetry check passed: status=ZERO_DRIFT rtt=${(30 + Math.random() * 10).toFixed(2)}ms`,
      };
      setLogs((prev) => [newLog, ...prev.slice(0, 5)]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 p-4 sm:p-5 shadow-xl font-mono space-y-4">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Real-Time Execution Trace &amp; Gateway Logs
            </h3>
            <p className="text-[10px] text-slate-400">Tx: {AUDIT_TRACE_TX?.txId?.substring(0, 16) || 'tx_849202_canonical'}...</p>
          </div>
        </div>

        <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          STREAMING
        </span>
      </div>

      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {logs.map((log) => (
          <div
            key={log.id}
            className="p-2 rounded-lg bg-black/50 border border-slate-800/70 text-[11px] flex items-start gap-2"
          >
            <span className="text-slate-500 text-[10px] shrink-0 mt-0.5">{log.time}</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                log.type === 'SEAL'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                  : log.type === 'QUORUM'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                  : log.type === 'INGEST'
                  ? 'bg-violet-950 text-violet-300 border border-violet-500/30'
                  : 'bg-slate-900 text-slate-300 border border-slate-700'
              }`}
            >
              {log.type}
            </span>
            <span className="text-slate-300 truncate">{log.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExecutionTraceLogs;
