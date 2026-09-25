/**
 * ZYRQUEN Ω∞ Offline Audit Sync Engine
 * Client-side interface to service-worker.js Background Sync and IndexedDB
 * 
 * Provides:
 * - Transparent offline audit queuing
 * - Automatic background synchronization on connectivity recovery
 * - Reactive React hook for UI pending log counters & status badges
 */

import { useState, useEffect, useCallback } from 'react';

export interface AuditLogEntry {
  id?: string;
  source: string;
  action: string;
  nodeId?: string;
  anomalyScore?: number;
  triggerType?: string;
  details?: Record<string, any>;
  timestamp?: number;
}

const OFFLINE_DB_NAME = 'zyrquen_offline_audit_db';
const OFFLINE_STORE_NAME = 'pending_audit_logs';

function openClientDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(OFFLINE_DB_NAME, 1);
    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const target = event.target as IDBOpenDBRequest;
      const db = target.result;
      if (!db.objectStoreNames.contains(OFFLINE_STORE_NAME)) {
        db.createObjectStore(OFFLINE_STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Persist an audit log to IndexedDB
 */
export async function saveAuditLogOffline(entry: AuditLogEntry): Promise<number | string> {
  try {
    const db = await openClientDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(OFFLINE_STORE_NAME, 'readwrite');
      const store = tx.objectStore(OFFLINE_STORE_NAME);
      const record = {
        payload: {
          ...entry,
          timestamp: entry.timestamp || Date.now()
        },
        timestamp: Date.now(),
        attempts: 0
      };
      const req = store.add(record);
      req.onsuccess = () => resolve(req.result as number | string);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineAuditSync] IndexedDB write failed:', err);
    throw err;
  }
}

/**
 * Get count of pending unsynced audit logs
 */
export async function getPendingAuditLogCount(): Promise<number> {
  try {
    const db = await openClientDB();
    return new Promise((resolve) => {
      const tx = db.transaction(OFFLINE_STORE_NAME, 'readonly');
      const store = tx.objectStore(OFFLINE_STORE_NAME);
      const countReq = store.count();
      countReq.onsuccess = () => resolve(countReq.result);
      countReq.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

/**
 * Queue an audit log for reliable delivery.
 * If online, sends to server immediately. If offline or if request fails,
 * queues into IndexedDB and registers Service Worker background sync.
 */
export async function queueAuditLog(entry: AuditLogEntry): Promise<{ status: 'SENT' | 'QUEUED_OFFLINE'; details?: any }> {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  if (isOnline) {
    try {
      const response = await fetch('/api/v1/audit/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      if (response.ok) {
        return { status: 'SENT', details: await response.json() };
      }
    } catch (networkErr) {
      console.warn('[OfflineAuditSync] Network failed, falling back to offline queue:', networkErr);
    }
  }

  // Save to offline storage
  await saveAuditLogOffline(entry);

  // Request Service Worker to register Background Sync
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if ('sync' in registration) {
        await (registration as any).sync.register('sync-audit-logs');
      }
    } catch (swErr) {
      console.warn('[OfflineAuditSync] Background sync registration skipped:', swErr);
    }
  }

  return { status: 'QUEUED_OFFLINE' };
}

/**
 * Trigger manual sync of queued offline audit logs
 */
export async function triggerManualAuditSync(): Promise<void> {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        registration.active.postMessage({ type: 'TRIGGER_SYNC' });
      }
    } catch (e) {
      console.warn('[OfflineAuditSync] Could not message service worker:', e);
    }
  }
}

/**
 * React Hook for UI components to observe offline audit sync state
 */
export function useOfflineAuditSync() {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  const refreshCount = useCallback(async () => {
    const count = await getPendingAuditLogCount();
    setPendingCount(count);
  }, []);

  useEffect(() => {
    refreshCount();

    const handleOnline = () => {
      setIsOnline(true);
      triggerManualAuditSync();
      setTimeout(refreshCount, 1500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      refreshCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for service worker sync events via postMessage or BroadcastChannel
    let broadcastChannel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        broadcastChannel = new BroadcastChannel('zyrquen_audit_sync_bus');
        broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'AUDIT_LOGS_SYNCED') {
            setLastSyncTime(Date.now());
            refreshCount();
          } else if (event.data?.type === 'AUDIT_LOG_QUEUED_OFFLINE') {
            refreshCount();
          }
        };
      } catch (err) {
        // BroadcastChannel unavailable
      }
    }

    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'AUDIT_LOGS_SYNCED') {
        setLastSyncTime(Date.now());
        refreshCount();
      } else if (event.data?.type === 'AUDIT_LOG_QUEUED_OFFLINE') {
        refreshCount();
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }

    const interval = setInterval(refreshCount, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (broadcastChannel) broadcastChannel.close();
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
      clearInterval(interval);
    };
  }, [refreshCount]);

  return {
    pendingCount,
    isOnline,
    lastSyncTime,
    syncNow: triggerManualAuditSync,
    refreshCount
  };
}
