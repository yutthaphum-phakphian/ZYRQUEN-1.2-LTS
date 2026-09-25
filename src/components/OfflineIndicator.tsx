import React, { useEffect, useState, useCallback } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, Database, CloudUpload } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { offlineAuditSyncService } from '../services/offlineAuditSyncService';

interface ServiceWorkerCacheInfo {
  pendingLogsCount: number;
  cacheName?: string;
  cachedAssetsCount?: number;
  isSyncSupported?: boolean;
}

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [cachedAssetsCount, setCachedAssetsCount] = useState<number | undefined>(undefined);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [justSynced, setJustSynced] = useState<boolean>(false);

  // Poll and query Service Worker cache status
  const querySWCacheStatus = useCallback(async () => {
    try {
      const status: ServiceWorkerCacheInfo = await offlineAuditSyncService.getServiceWorkerCacheStatus();
      if (typeof status.pendingLogsCount === 'number') {
        setPendingCount(status.pendingLogsCount);
      }
      if (typeof status.cachedAssetsCount === 'number') {
        setCachedAssetsCount(status.cachedAssetsCount);
      }
    } catch {
      setPendingCount(offlineAuditSyncService.getQueueCount());
    }
  }, []);

  useEffect(() => {
    // Initial fetch from Service Worker cache & queue
    querySWCacheStatus();

    // 1. Subscribe to offlineAuditSyncService updates
    const unsubscribe = offlineAuditSyncService.subscribe((count) => {
      setPendingCount(count);
    });

    // 2. Listen to Service Worker messages
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'AUDIT_LOGS_SYNCED') {
        setPendingCount(0);
        setJustSynced(true);
        setTimeout(() => setJustSynced(false), 3500);
      } else if (event.data?.type === 'AUDIT_LOG_QUEUED_OFFLINE') {
        querySWCacheStatus();
      } else if (event.data?.type === 'CACHE_STATUS_RESULT') {
        if (typeof event.data.pendingLogsCount === 'number') {
          setPendingCount(event.data.pendingLogsCount);
        }
        if (typeof event.data.cachedAssetsCount === 'number') {
          setCachedAssetsCount(event.data.cachedAssetsCount);
        }
      }
    };

    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }

    // 3. Listen to BroadcastChannel
    let broadcastChannel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        broadcastChannel = new BroadcastChannel('zyrquen_audit_sync_bus');
        broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'AUDIT_LOGS_SYNCED') {
            setPendingCount(0);
            setJustSynced(true);
            setTimeout(() => setJustSynced(false), 3500);
          } else if (event.data?.type === 'AUDIT_LOG_QUEUED_OFFLINE') {
            querySWCacheStatus();
          }
        };
      } catch {
        // BroadcastChannel unavailable
      }
    }

    // 4. Periodic polling to keep cache & sync count reactive
    const interval = setInterval(querySWCacheStatus, 4000);

    return () => {
      unsubscribe();
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
      if (broadcastChannel) {
        broadcastChannel.close();
      }
      clearInterval(interval);
    };
  }, [querySWCacheStatus]);

  // Trigger manual background sync / queue flush
  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      // Message Service Worker to trigger immediate sync
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg.active) {
          reg.active.postMessage({ type: 'TRIGGER_SYNC' });
        }
      }
      // Also trigger service flush
      await offlineAuditSyncService.flushQueue(true);
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 3500);
      await querySWCacheStatus();
    } finally {
      setIsSyncing(false);
    }
  };

  // If online, SovereignBottomStatusBar handles pending sync display and manual sync button cleanly
  if (isOnline) {
    if (justSynced) {
      return (
        <div className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] left-4 z-50 flex items-center gap-2.5 rounded-xl bg-slate-900/95 border-emerald-500/60 px-4 py-2 text-xs font-mono text-emerald-300 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>✅ ซิงก์ข้อมูล Forensic Audit เข้าสู่ Primary Ledger สำเร็จ 100%</span>
        </div>
      );
    }
    return null;
  }

  // Full Offline Mode (Only shown when truly disconnected)
  return (
    <div className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] left-4 right-4 sm:right-auto sm:max-w-md z-50 flex flex-col sm:flex-row items-start sm:items-center gap-2.5 rounded-xl bg-[#0a0f1e]/95 border-amber-500/60 px-4 py-2.5 text-xs font-mono text-amber-300 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="flex items-center gap-2 shrink-0">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
        </span>
        <WifiOff className="w-4 h-4 text-amber-400" />
        <span className="font-bold">สภาวะออฟไลน์ (Offline Mode)</span>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-amber-200/90 pl-5 sm:pl-0 border-t sm:border-t-0 sm:border-l border-amber-500/30 pt-1.5 sm:pt-0 sm:pl-3">
        <span>รอ Background Sync:</span>
        <span className="px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border-amber-500/50 font-bold">
          {pendingCount} รายการ
        </span>
        {typeof cachedAssetsCount === 'number' && (
          <span className="hidden md:flex items-center gap-1 text-[10px] text-amber-400/70 ml-1">
            <Database className="w-3 h-3" />
            แคช: {cachedAssetsCount} ไฟล์
          </span>
        )}
      </div>

      {pendingCount > 0 && (
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="ml-auto mt-1 sm:mt-0 px-2.5 py-1 bg-amber-900/60 hover:bg-amber-800 text-amber-100 rounded-lg text-[10px] font-bold border-amber-500/40 flex items-center gap-1 transition-all cursor-pointer"
          title="พยายามส่งข้อมูลไปยังเซิร์ฟเวอร์ทันที"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'ซิงก์...' : 'ซิงก์ทันที'}
        </button>
      )}
    </div>
  );
};
