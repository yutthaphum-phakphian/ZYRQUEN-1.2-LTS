import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, CheckCircle2, RefreshCw, Zap, ShieldAlert, Activity, History, Clock, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import { offlineAuditSyncService } from '../../services/offlineAuditSyncService';

export const VerificationGate: React.FC = () => {
  const [gateStatus, setGateStatus] = useState<'ACTIVE_GUARD' | 'VERIFYING' | 'PASSED'>('ACTIVE_GUARD');
  const [lastCheck, setLastCheck] = useState<string>('05:25:30 UTC');
  const [offlinePendingCount, setOfflinePendingCount] = useState<number>(() => offlineAuditSyncService.getQueueCount());
  const [pendingThreshold, setPendingThreshold] = useState<number>(() => offlineAuditSyncService.getPendingThreshold());
  const [isGateTooltipVisible, setIsGateTooltipVisible] = useState<boolean>(false);
  const [syncHistory, setSyncHistory] = useState<string[]>(() => offlineAuditSyncService.getSyncHistory());
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    const unsub = offlineAuditSyncService.subscribe((count) => {
      setOfflinePendingCount(count);
    });
    const unsubHistory = offlineAuditSyncService.subscribeSyncHistory((history) => {
      setSyncHistory(history);
    });
    const unsubThreshold = offlineAuditSyncService.subscribePendingThreshold((thresh) => {
      setPendingThreshold(thresh);
    });
    return () => {
      unsub();
      unsubHistory();
      unsubThreshold();
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

              {/* Offline Pending Badge (Turns RED if > threshold) */}
              {offlinePendingCount > 0 && (
                <span
                  className={`px-1 py-0.2 rounded-full text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5 ${
                    offlinePendingCount > pendingThreshold
                      ? 'bg-rose-500/25 text-rose-200 border border-rose-500/70 pending-badge-breathing-red shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 pending-badge-breathing'
                  }`}
                  title={`${offlinePendingCount} offline audit log${offlinePendingCount > 1 ? 's' : ''} pending sync ${offlinePendingCount > pendingThreshold ? `(CRITICAL: > ${pendingThreshold} Logs Limit)` : ''}`}
                >
                  <span className={`w-1 h-1 rounded-full ${offlinePendingCount > pendingThreshold ? 'bg-rose-400' : 'bg-amber-400'}`} />
                  <span>{offlinePendingCount > pendingThreshold ? '⚠️ pending' : 'pending'}</span>
                </span>
              )}
            </motion.div>

            {/* Subtle scale-up entrance animation for isGateTooltipVisible */}
            <AnimatePresence>
              {isGateTooltipVisible && (
                <motion.div
                  id="verification-gate-status-tooltip"
                  initial={{ opacity: 0, y: -10, scale: 0.94, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -8, scale: 0.95, filter: 'blur(4px)' }}
                  transition={{
                    duration: 0.3,
                    ease: 'easeOut',
                    scale: { duration: 0.3, ease: 'easeOut' },
                    opacity: { duration: 0.22, ease: 'easeOut' },
                    y: { duration: 0.3, ease: 'easeOut' },
                  }}
                  className="absolute right-0 top-full mt-2 z-50 w-[calc(100vw-32px)] sm:w-72 max-w-sm max-h-[70vh] overflow-y-auto custom-scrollbar p-3 rounded-xl bg-slate-950/95 border border-cyan-500/40 shadow-2xl backdrop-blur-xl text-[10px] text-zinc-300 space-y-2 pointer-events-auto"
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

                  {/* Pending Offline Queue Flush Action */}
                  {offlinePendingCount > 0 && (
                    <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                        <span className="text-amber-200 font-bold truncate">
                          {offlinePendingCount} Offline Logs
                        </span>
                      </div>
                      <button
                        type="button"
                        id="btn-gate-flush-sync"
                        onClick={async (e) => {
                          e.stopPropagation();
                          playTone(720, 0.04);
                          setIsRefreshing(true);
                          await offlineAuditSyncService.flushQueue(true);
                          setIsRefreshing(false);
                        }}
                        className="px-2 py-0.5 rounded bg-amber-500/25 hover:bg-amber-500/40 border border-amber-500/50 text-amber-200 text-[8px] font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0"
                      >
                        <RefreshCw className={`w-2.5 h-2.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span>Force Sync</span>
                      </button>
                    </div>
                  )}

                  {/* Sync History Log Section */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[8.5px] text-zinc-400 font-bold gap-1">
                      <span className="flex items-center gap-1 text-cyan-300">
                        <History className="w-3 h-3 text-cyan-400 shrink-0" />
                        SYNC HISTORY
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          id="btn-refresh-sync-history-logs-gate"
                          onClick={(e) => {
                            e.stopPropagation();
                            playTone(660, 0.04);
                            const updated = offlineAuditSyncService.getSyncHistory();
                            setSyncHistory(updated);
                            setIsRefreshing(true);
                            setTimeout(() => setIsRefreshing(false), 500);
                          }}
                          className="px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white text-[7.5px] font-bold flex items-center gap-0.5 cursor-pointer pointer-events-auto"
                          title="Refresh Sync History from offlineAuditSyncService"
                        >
                          <RefreshCw className={`w-2 h-2 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                          <span>Refresh Log</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playTone(700, 0.04);
                            if (syncHistory.length === 0) return;
                            const logsText = syncHistory
                              .slice(0, 5)
                              .map((ts, idx) => `[#${idx + 1}] ${ts}`)
                              .join('\n');
                            navigator.clipboard.writeText(logsText);
                            setIsCopied(true);
                            setTimeout(() => setIsCopied(false), 2000);
                          }}
                          className="px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300 hover:text-white text-[7.5px] font-bold flex items-center gap-0.5 cursor-pointer pointer-events-auto"
                          title="Copy Logs"
                        >
                          {isCopied ? <Check className="w-2 h-2 text-emerald-400" /> : <Copy className="w-2 h-2 text-cyan-400" />}
                          <span>{isCopied ? 'Copied' : 'Copy'}</span>
                        </button>
                        <span className="text-[7.5px] text-zinc-500">{syncHistory.length}</span>
                      </div>
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
                            className="group flex items-center justify-between p-1 rounded bg-black/60 border border-white/5 hover:bg-zinc-800/90 hover:border-cyan-400/50 hover:translate-x-1 hover:text-white transition-all duration-150 text-[8px] font-mono shadow-sm"
                          >
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 group-hover:scale-125 transition-transform" />
                              <span className="text-zinc-200 group-hover:text-white group-hover:drop-shadow-[0_0_4px_rgba(255,255,255,0.4)] whitespace-nowrap transition-colors">{timeFormatted}</span>
                            </div>
                            <span className="text-emerald-400 group-hover:text-emerald-300 text-[7px] font-bold shrink-0 transition-colors">
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
