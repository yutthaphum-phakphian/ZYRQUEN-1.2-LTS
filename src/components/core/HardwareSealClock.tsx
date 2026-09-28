import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, Cpu, RefreshCw, CheckCircle2, Zap } from 'lucide-react';
import { playAuditChime, playTone } from '../AudioSynthesizer';

export interface HardwareSealClockProps {
  totalSeals?: number;
  verifiedSeals?: number;
  onManualVerify?: () => void;
}

export const HardwareSealClock: React.FC<HardwareSealClockProps> = ({
  totalSeals = 14902,
  verifiedSeals = 14902,
  onManualVerify,
}) => {
  const [time, setTime] = useState<string>('');
  const [epochProgress, setEpochProgress] = useState<number>(94.8);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
      );
      // Continuous clock micro-phase
      const seconds = now.getUTCSeconds() + now.getUTCMilliseconds() / 1000;
      setEpochProgress(((seconds % 10) / 10) * 100);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVerify = () => {
    setIsVerifying(true);
    playTone(880, 0.08);
    setTimeout(() => {
      setIsVerifying(false);
      playAuditChime();
      if (onManualVerify) onManualVerify();
    }, 600);
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 p-4 sm:p-5 shadow-xl font-mono flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
            Hardware Seal Clock &amp; Heartbeat
          </span>
        </div>
        <button
          onClick={handleVerify}
          disabled={isVerifying}
          className="px-2.5 py-1 text-[11px] rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
        >
          <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin text-amber-400' : ''}`} />
          <span>{isVerifying ? 'Syncing...' : 'Sync Clock'}</span>
        </button>
      </div>

      <div className="my-3.5 space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-slate-400">Atomic UTC Lock:</span>
          <span className="text-sm sm:text-base font-bold text-cyan-300 tracking-wider">
            {time || '2026-09-28 05:25:00 UTC'}
          </span>
        </div>

        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <span>Seal Epoch Synchronization</span>
            <span className="text-emerald-400 font-bold">{verifiedSeals.toLocaleString()} / {totalSeals.toLocaleString()} Seals</span>
          </div>
          <div className="h-2 w-full bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-400 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
              style={{ width: `${Math.max(15, epochProgress)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>100% Deterministic</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-300 justify-end">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Sub-Kelvin 0.082K</span>
        </div>
      </div>
    </div>
  );
};

export default HardwareSealClock;
