import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, CheckCircle2, RefreshCw, Zap, ShieldAlert, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import { offlineAuditSyncService } from '../../services/offlineAuditSyncService';

export const VerificationGate: React.FC = () => {
  const [gateStatus, setGateStatus] = useState<'ACTIVE_GUARD' | 'VERIFYING' | 'PASSED'>('ACTIVE_GUARD');
  const [lastCheck, setLastCheck] = useState<string>('05:25:30 UTC');
  const [offlinePendingCount, setOfflinePendingCount] = useState<number>(() => offlineAuditSyncService.getQueueCount());

  useEffect(() => {
    const unsub = offlineAuditSyncService.subscribe((count) => {
      setOfflinePendingCount(count);
    });
    return () => unsub();
  }, []);

  const handleReverify = () => {
    setGateStatus('VERIFYING');
    playTone(600, 0.05);
    setTimeout(() => {
      setGateStatus('PASSED');
      setLastCheck(new Date().toISOString().substring(11, 19) + ' UTC');
      playAuditChime();
    }, 800);
  };

  const handleToggleState = () => {
    setGateStatus((prev) => (prev === 'PASSED' ? 'ACTIVE_GUARD' : 'PASSED'));
    playTone(520, 0.04);
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
            <p className="text-[10px] text-slate-400">FIPS 140-3 Level 4 Gatekeeper</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Pill with Motion layout transition & pending badge */}
          <motion.div
            layout
            initial={false}
            animate={{
              backgroundColor:
                gateStatus === 'PASSED'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : gateStatus === 'VERIFYING'
                  ? 'rgba(245, 158, 11, 0.15)'
                  : 'rgba(6, 182, 212, 0.15)',
              borderColor:
                gateStatus === 'PASSED'
                  ? 'rgba(16, 185, 129, 0.4)'
                  : gateStatus === 'VERIFYING'
                  ? 'rgba(245, 158, 11, 0.4)'
                  : 'rgba(6, 182, 212, 0.4)',
              color:
                gateStatus === 'PASSED'
                  ? 'rgb(110, 231, 183)'
                  : gateStatus === 'VERIFYING'
                  ? 'rgb(252, 211, 77)'
                  : 'rgb(103, 232, 249)',
            }}
            transition={{
              layout: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
              duration: 0.45,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            onClick={handleToggleState}
            className="px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1.5 cursor-pointer select-none"
            title="Click to toggle between ACTIVE_GUARD and PASSED status"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                gateStatus === 'PASSED'
                  ? 'bg-emerald-400'
                  : gateStatus === 'VERIFYING'
                  ? 'bg-amber-400 animate-spin'
                  : 'bg-cyan-400 animate-pulse'
              }`}
            />
            <span>{gateStatus}</span>

            {/* Offline Pending Badge */}
            {offlinePendingCount > 0 && (
              <span
                className="px-1 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5 animate-pulse"
                title={`${offlinePendingCount} offline audit log${offlinePendingCount > 1 ? 's' : ''} pending sync`}
              >
                <span className="w-1 h-1 rounded-full bg-amber-400" />
                <span>pending</span>
              </span>
            )}
          </motion.div>

          <button
            onClick={handleReverify}
            disabled={gateStatus === 'VERIFYING'}
            className="px-2.5 py-1 text-[11px] rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${gateStatus === 'VERIFYING' ? 'animate-spin' : ''}`} />
            <span>{gateStatus === 'VERIFYING' ? 'Auditing...' : 'Audit Gate'}</span>
          </button>
        </div>
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
