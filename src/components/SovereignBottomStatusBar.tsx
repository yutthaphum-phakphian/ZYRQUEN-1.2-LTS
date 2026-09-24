// src/components/SovereignBottomStatusBar.tsx
import React, { useState } from 'react';
import { RefreshCw, CloudUpload, CheckCircle2 } from 'lucide-react';
import { useOfflineAuditSync } from '../utils/offlineAuditSync';
import { offlineAuditSyncService } from '../services/offlineAuditSyncService';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { triggerVibration } from '../utils/vibration';

export const SovereignBottomStatusBar: React.FC = () => {
  const { pendingCount, isOnline, syncNow } = useOfflineAuditSync();
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [justSynced, setJustSynced] = useState<boolean>(false);

  const handleManualSync = async () => {
    if (isSyncing) return;
    triggerVibration('click');
    playTone(660, 0.05);
    setIsSyncing(true);

    try {
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg?.active) {
          reg.active.postMessage({ type: 'TRIGGER_SYNC' });
        }
      }
      await offlineAuditSyncService.flushQueue(true);
      if (syncNow) await syncNow();
      playAuditChime();
      triggerVibration('auditReport');
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 3000);
    } catch (e) {
      console.warn('Manual sync failed or network disconnected:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 border-t border-slate-800 backdrop-blur-md px-4 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${pendingCount > 0 ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
          <span className="text-slate-300 text-[11px] truncate max-w-[200px] sm:max-w-none">
            {pendingCount > 0
              ? `Background Sync: ${pendingCount} รายการ`
              : justSynced
              ? 'Background Sync: ซิงก์สมบูรณ์ 100%'
              : 'Background Sync: บัญชีและข้อมูลพร้อม'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-bold hidden sm:inline">14.98 Mk</span>
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.3)] active:scale-95"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>SYNCING...</span>
              </>
            ) : justSynced ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                <span>SYNCED</span>
              </>
            ) : (
              <span>SYNC NOW</span>
            )}
          </button>
        </div>
      </div>
    </footer>
  );
};
