import React from 'react';
import { AlertCircle, CheckCircle2, Terminal, ShieldAlert, Cpu } from 'lucide-react';

export const FailsafeDiagnostics: React.FC = () => {
  const records = [
    { code: 'SEC-2026-0928-01', origin: 'Chamber 04', event: 'Quorum Heartbeat Verified', level: 'INFO', time: '05:24:12' },
    { code: 'SEC-2026-0928-02', origin: 'Envoy Router', event: 'mTLS Handshake Mutual Cert Valid', level: 'INFO', time: '05:24:35' },
    { code: 'SEC-2026-0928-03', origin: 'Cryostat Enclave', event: 'Temperature Threshold Guard Nominal (0.082K)', level: 'INFO', time: '05:25:01' },
    { code: 'SEC-2026-0928-04', origin: 'Write Firewall', event: 'Phase 11 Write Attempt Filtered & Approved', level: 'VERIFIED', time: '05:25:20' },
  ];

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 p-4 sm:p-5 shadow-xl font-mono space-y-4">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-400">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Failsafe Post-Mortem &amp; Diagnostics
            </h3>
            <p className="text-[10px] text-slate-400">Deterministic Incident Analysis Log</p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
          0 CRITICAL ALERTS
        </span>
      </div>

      <div className="space-y-2">
        {records.map((rec, idx) => (
          <div
            key={idx}
            className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs gap-2"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-cyan-400 font-bold">{rec.origin}</span>
                <span className="text-slate-600">•</span>
                <span className="text-[10px] text-slate-400">{rec.code}</span>
              </div>
              <div className="text-slate-300 text-xs mt-0.5 truncate">{rec.event}</div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 block">{rec.time}</span>
              <span className="text-[9px] font-bold text-emerald-400">{rec.level}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FailsafeDiagnostics;
