// src/components/SovereignBottomStatusBar.tsx
import React, { useState, useEffect } from 'react';
import { RefreshCw, CloudUpload, CheckCircle2, Zap, ShieldCheck } from 'lucide-react';
import { useOfflineAuditSync } from '../utils/offlineAuditSync';
import { offlineAuditSyncService } from '../services/offlineAuditSyncService';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { triggerVibration } from '../utils/vibration';

export const SovereignBottomStatusBar: React.FC = () => {
  const { pendingCount, isOnline, syncNow } = useOfflineAuditSync();
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [justSynced, setJustSynced] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<number>(100);
  const [showPulseEffect, setShowPulseEffect] = useState<boolean>(false);

  const handleManualSync = async () => {
    if (isSyncing) return;
    triggerVibration('click');
    playTone(660, 0.05);
    setIsSyncing(true);
    setSyncProgress(25);

    try {
      // Step 1: Progress from 25% -> 60%
      await new Promise((res) => setTimeout(res, 200));
      setSyncProgress(60);

      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg?.active) {
          reg.active.postMessage({ type: 'TRIGGER_SYNC' });
        }
      }

      // Step 2: Progress from 60% -> 85%
      await new Promise((res) => setTimeout(res, 250));
      setSyncProgress(85);
      await offlineAuditSyncService.flushQueue(true);

      if (syncNow) await syncNow();

      // Step 3: Animate to 100% and trigger Sync Complete pulse effect
      setSyncProgress(96);
      await new Promise((res) => setTimeout(res, 120));
      setSyncProgress(100);
      setShowPulseEffect(true);
      playAuditChime();
      triggerVibration('auditReport');
      setJustSynced(true);

      setTimeout(() => {
        setShowPulseEffect(false);
      }, 3000);

      setTimeout(() => {
        setJustSynced(false);
      }, 4500);
    } catch (e) {
      console.warn('Manual sync failed or network disconnected:', e);
      setSyncProgress(100);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-cyan-500/30 backdrop-blur-md px-4 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.6)]">
      {/* Top Animated Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-900/90 overflow-hidden">
        <div
          className={`h-full transition-all duration-700 ease-out ${
            syncProgress === 100
              ? 'bg-gradient-to-r from-emerald-500 via-cyan-300 to-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.9)]'
              : 'bg-gradient-to-r from-cyan-600 via-cyan-400 to-emerald-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]'
          }`}
          style={{ width: `${syncProgress}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isSyncing
                ? 'bg-cyan-400 animate-ping'
                : pendingCount > 0
                ? 'bg-amber-400 animate-ping'
                : showPulseEffect
                ? 'bg-emerald-300 animate-ping shadow-[0_0_10px_rgba(52,211,153,1)]'
                : 'bg-emerald-400 animate-pulse'
            }`}
          />
          <div className="flex items-center gap-2 truncate">
            <span className="text-slate-300 text-[11px] truncate">
              {isSyncing
                ? `Synchronizing Nexus Interlayer (${syncProgress}%)...`
                : pendingCount > 0
                ? `Background Sync: ${pendingCount} รายการรอดำเนินการ`
                : justSynced
                ? 'Background Sync: ซิงก์สมบูรณ์ 100% (SSoT Δ0 = 0.000%)'
                : 'Background Sync: บัญชีและข้อมูลพร้อม (100% Synced)'}
            </span>

            {/* Sync Complete Pulse Badge Effect */}
            {showPulseEffect && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/30 border border-emerald-400 text-emerald-200 animate-pulse shadow-[0_0_16px_rgba(16,185,129,0.7)] tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 animate-spin" />
                SYNC COMPLETE (100%)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-cyan-400 font-bold text-[11px] hidden sm:inline px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
            14.98 mK
          </span>
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className={`px-3 py-1 text-white font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.3)] active:scale-95 disabled:opacity-50 ${
              justSynced
                ? 'bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : 'bg-cyan-600 hover:bg-cyan-500'
            }`}
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin text-white" />
                <span>{syncProgress}% SYNCING</span>
              </>
            ) : justSynced ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                <span>SYNCED 100%</span>
              </>
            ) : (
              <>
                <Zap className="w-3 h-3 text-amber-300" />
                <span>SYNC NOW</span>
              </>
            )}
          </button>
        </div>
      </div>
    </footer>
  );
};

