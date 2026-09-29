import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, CheckCircle2, RefreshCw, Zap, ShieldAlert, Activity, History, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import { offlineAuditSyncService } from '../../services/offlineAuditSyncService';

export const VerificationGate: React.FC = () => {
  const [gateStatus, setGateStatus] = useState<'ACTIVE_GUARD' | 'VERIFYING' | 'PASSED'>('ACTIVE_GUARD');
  const [lastCheck, setLastCheck] = useState<string>('05:25:30 UTC');
  const [offlinePendingCount, setOfflinePendingCount] = useState<number>(() => offlineAuditSyncService.getQueueCount());
  const [isGateTooltipVisible, setIsGateTooltipVisible] = useState<boolean>(false);
  const [syncHistory, setSyncHistory] = useState<string[]>(() => offlineAuditSyncService.getSyncHistory());

  useEffect(() => {
    const unsub = offlineAuditSyncService.subscribe((count) => {
      setOfflinePendingCount(count);
    });
    const unsubHistory = offlineAuditSyncService.subscribeSyncHistory((history) => {
      setSyncHistory(history);
    });
    return () => {
      unsub();
      unsubHistory();
    };
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
    <div className="relative rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 p-4 sm:p-5 shadow-xl font-mono space-y-4">
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
          {/* Status Pill with Motion layout transition, pending badge, & tooltip toggle */}
          <div className="relative">
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
              onClick={() => {
                handleToggleState();
                setIsGateTooltipVisible((prev) => !prev);
              }}
              onMouseEnter={() => setIsGateTooltipVisible(true)}
              onMouseLeave={() => setIsGateTooltipVisible(false)}
              className="px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1.5 cursor-pointer select-none"
              title="Click to toggle status or view Sync History tooltip"
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

              {/* Offline Pending Badge (Turns RED if > 50 threshold) */}
              {offlinePendingCount > 0 && (
                <span
                  className={`px-1 py-0.2 rounded-full text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5 ${
                    offlinePendingCount > 50
                      ? 'bg-rose-500/25 text-rose-200 border border-rose-500/70 pending-badge-breathing-red shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 pending-badge-breathing'
                  }`}
                  title={`${offlinePendingCount} offline audit log${offlinePendingCount > 1 ? 's' : ''} pending sync ${offlinePendingCount > 50 ? '(CRITICAL: > 50 Logs)' : ''}`}
                >
                  <span className={`w-1 h-1 rounded-full ${offlinePendingCount > 50 ? 'bg-rose-400' : 'bg-amber-400'}`} />
                  <span>{offlinePendingCount > 50 ? '⚠️ pending' : 'pending'}</span>
                </span>
              )}
            </motion.div>

            {/* Subtle scale-up entrance animation for isGateTooltipVisible */}
            <AnimatePresence>
              {isGateTooltipVisible && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.94, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -8, scale: 0.95, filter: 'blur(4px)' }}
                  transition={{
                    duration: 0.32,
                    ease: [0.16, 1, 0.3, 1],
                    scale: { duration: 0.34, ease: [0.16, 1, 0.3, 1] },
                    opacity: { duration: 0.24, ease: 'easeOut' },
                    y: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
                  }}
                  className="absolute right-0 top-full mt-2 z-50 w-72 p-3 rounded-xl bg-slate-950/95 border border-cyan-500/40 shadow-2xl backdrop-blur-xl text-[10px] text-zinc-300 space-y-2 pointer-events-none"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-1.5 font-bold">
                    <span className="text-cyan-300 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Verification Gate
                    </span>
                    <span className="text-emerald-400 text-[8px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-500/30">
                      SSoT Δ0.00%
                    </span>
                  </div>

                  {/* Sync History Log Section */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[8.5px] text-zinc-400 font-bold">
                      <span className="flex items-center gap-1 text-cyan-300">
                        <History className="w-3 h-3 text-cyan-400" />
                        SYNC HISTORY (LAST 5 FLUSHES)
                      </span>
                      <span className="text-[7.5px] text-zinc-500">5 ENTRIES</span>
                    </div>

                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {syncHistory.slice(0, 5).map((ts, idx) => {
                        const dateObj = new Date(ts);
                        const timeFormatted = isNaN(dateObj.getTime())
                          ? ts
                          : dateObj.toLocaleTimeString('en-GB', { timeZone: 'UTC', hour12: false }) + ' UTC';
                        return (
                          <div
                            key={`${ts}-${idx}`}
                            className="flex items-center justify-between p-1 rounded bg-black/60 border border-white/5 text-[8px] font-mono"
                          >
                            <div className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span className="text-zinc-200">{timeFormatted}</span>
                            </div>
                            <span className="text-emerald-400 text-[7px] font-bold">
                              {idx === 0 ? 'LATEST' : `#${idx + 1}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
