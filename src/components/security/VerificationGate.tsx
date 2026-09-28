import React, { useState } from 'react';
import { ShieldCheck, Lock, CheckCircle2, RefreshCw, Zap } from 'lucide-react';
import { playAuditChime, playTone } from '../AudioSynthesizer';

export const VerificationGate: React.FC = () => {
  const [gateStatus, setGateStatus] = useState<'PASSED' | 'VERIFYING'>('PASSED');
  const [lastCheck, setLastCheck] = useState<string>('05:25:30 UTC');

  const handleReverify = () => {
    setGateStatus('VERIFYING');
    playTone(600, 0.05);
    setTimeout(() => {
      setGateStatus('PASSED');
      setLastCheck(new Date().toISOString().substring(11, 19) + ' UTC');
      playAuditChime();
    }, 800);
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 p-4 sm:p-5 shadow-xl font-mono space-y-4">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Quick Verification Gate
            </h3>
            <p className="text-[10px] text-slate-400">FIPS 140-2 Level 3 Gatekeeper</p>
          </div>
        </div>

        <button
          onClick={handleReverify}
          disabled={gateStatus === 'VERIFYING'}
          className="px-2.5 py-1 text-[11px] rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${gateStatus === 'VERIFYING' ? 'animate-spin' : ''}`} />
          <span>{gateStatus === 'VERIFYING' ? 'Auditing...' : 'Audit Gate'}</span>
        </button>
      </div>

      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-400">Gate Integrity State:</div>
          <div className="text-sm font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
            <CheckCircle2 className="w-4 h-4" />
            10/10 HSM QUORUM VERIFIED
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400">Last Gate Check</div>
          <div className="text-xs text-slate-300 font-bold">{lastCheck}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1.5 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>0/80 Jitter Anomaly</span>
        </div>
        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1.5 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>14,902 Seals Pure</span>
        </div>
      </div>
    </div>
  );
};

export default VerificationGate;
