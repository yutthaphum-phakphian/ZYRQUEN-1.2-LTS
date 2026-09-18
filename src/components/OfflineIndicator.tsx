import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { offlineAuditSyncService, OfflineAuditSyncStatus } from '../services/offlineAuditSyncService';
import { RefreshCw, WifiOff, CheckCircle2 } from 'lucide-react';
import { hapticTap } from '../utils/haptics';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [syncStatus, setSyncStatus] = useState<OfflineAuditSyncStatus>(() =>
    offlineAuditSyncService.getStatus()
  );
  const [showRecentlyFlushed, setShowRecentlyFlushed] = useState(false);

  useEffect(() => {
    const unsubscribe = offlineAuditSyncService.subscribe((status) => {
      setSyncStatus(status);
      if (status.isOnline && status.queuedCount === 0 && status.totalFlushedCount > 0) {
        setShowRecentlyFlushed(true);
        const timer = setTimeout(() => setShowRecentlyFlushed(false), 4000);
        return () => clearTimeout(timer);
      }
    });

    return unsubscribe;
  }, []);

  const handleManualSync = () => {
    hapticTap();
    offlineAuditSyncService.flushQueue();
  };

  // If online, no queued items, and not recently flushed, hide the indicator
  if (isOnline && syncStatus.queuedCount === 0 && !showRecentlyFlushed && !syncStatus.isFlushing) {
    return null;
  }

  // Case 1: Recently flushed confirmation
  if (isOnline && showRecentlyFlushed) {
    return (
      <div
        id="audit-sync-flushed-toast"
        className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-[#071710] border border-emerald-500/50 px-4 py-2 text-xs font-mono text-emerald-300 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300"
      >
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        <span>Audit Ledger Flushed: Offline forensic events synchronized to server SSoT</span>
      </div>
    );
  }

  // Case 2: Flushing in progress
  if (syncStatus.isFlushing) {
    return (
      <div
        id="audit-sync-flushing-toast"
        className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-[#0b1324] border border-cyan-500/50 px-4 py-2 text-xs font-mono text-cyan-300 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300"
      >
        <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
        <span>Flushing {syncStatus.queuedCount} offline audit events to Sovereign Ledger...</span>
      </div>
    );
  }

  // Case 3: Offline mode with queue count
  return (
    <div
      id="offline-status-indicator"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-3 rounded-xl bg-[#0a0f1e]/95 border border-amber-500/50 px-4 py-2.5 text-xs font-mono text-amber-300 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
        <div>
          <span className="font-bold">สภาวะออฟไลน์ (Offline Mode)</span>
          {syncStatus.queuedCount > 0 && (
            <span className="ml-2 text-amber-200/80 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 text-[11px]">
              {syncStatus.queuedCount} Audit Events Queued
            </span>
          )}
        </div>
      </div>

      {isOnline && syncStatus.queuedCount > 0 && (
        <button
          onClick={handleManualSync}
          className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Sync Now</span>
        </button>
      )}
    </div>
  );
};
