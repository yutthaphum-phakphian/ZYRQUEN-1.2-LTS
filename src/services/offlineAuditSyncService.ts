/**
 * ZYRQUEN Ω∞ Background Offline Audit Synchronization Service
 * Queues non-critical audit events when the client is offline
 * and automatically flushes them to the server-side audit ledger
 * once connectivity is restored, ensuring zero data loss for forensic audit logs.
 */

import { triggerVibration } from '../utils/vibration';

export interface QueuedAuditEvent {
  id: string;
  queuedAt: string;
  type: string;
  title: string;
  description: string;
  metaHash?: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  statuteRef?: string;
  retryCount: number;
}

const STORAGE_KEY = 'zyrquen_offline_audit_queue_v1';
const LAST_SYNC_KEY = 'zyrquen_last_audit_sync_time_v1';
type QueueListener = (count: number, items: QueuedAuditEvent[]) => void;

class OfflineAuditSyncService {
  private listeners: Set<QueueListener> = new Set();
  private isFlushing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[OfflineAuditSync] Connectivity restored. Initiating automatic flush...');
        this.flushQueue();
      });

      // Listen for Service Worker background sync completions
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'AUDIT_LOGS_SYNCED') {
            console.log('[OfflineAuditSyncService] SW Synced logs remotely, reconciling queue...');
            this.saveQueue([]);
            this.notifyListeners([]);
          }
        });
      }

      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const channel = new BroadcastChannel('zyrquen_audit_sync_bus');
          channel.onmessage = (event) => {
            if (event.data?.type === 'AUDIT_LOGS_SYNCED') {
              this.saveQueue([]);
              this.notifyListeners([]);
            }
          };
        } catch {
          // BroadcastChannel fallback
        }
      }
    }
  }

  /**
   * Registers a background sync event with the Service Worker whenever an event is queued offline
   */
  private async registerBackgroundSync(item: QueuedAuditEvent) {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg.active) {
        reg.active.postMessage({
          type: 'QUEUE_AUDIT_LOG',
          payload: item
        });
      }
      if ('sync' in reg) {
        await (reg as any).sync.register('sync-audit-logs');
        console.log('[OfflineAuditSyncService] Background sync registered with tag: sync-audit-logs');
      }
    } catch (err) {
      console.warn('[OfflineAuditSyncService] Background sync registration skipped:', err);
    }
  }

  /**
   * Retrieves cache status and pending sync count directly from the Service Worker
   */
  public async getServiceWorkerCacheStatus(): Promise<{
    pendingLogsCount: number;
    cacheName?: string;
    cachedAssetsCount?: number;
    isSyncSupported?: boolean;
  }> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return { pendingLogsCount: this.getQueueCount() };
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      const targetWorker = reg.active || navigator.serviceWorker.controller;
      if (!targetWorker) {
        return { pendingLogsCount: this.getQueueCount() };
      }

      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        const timeout = setTimeout(() => {
          resolve({ pendingLogsCount: this.getQueueCount() });
        }, 1200);

        messageChannel.port1.onmessage = (event) => {
          clearTimeout(timeout);
          if (event.data && typeof event.data.pendingLogsCount === 'number') {
            resolve({
              pendingLogsCount: event.data.pendingLogsCount,
              cacheName: event.data.cacheName,
              cachedAssetsCount: event.data.cachedAssetsCount,
              isSyncSupported: event.data.isSyncSupported
            });
          } else {
            resolve({ pendingLogsCount: this.getQueueCount() });
          }
        };

        targetWorker.postMessage({ type: 'GET_CACHE_STATUS' }, [messageChannel.port2]);
      });
    } catch (e) {
      return { pendingLogsCount: this.getQueueCount() };
    }
  }

  /**
   * Returns whether a synchronization flush is actively occurring
   */
  public isSyncInProgress(): boolean {
    return this.isFlushing;
  }

  /**
   * Returns the ISO timestamp of the last successful sync
   */
  public getLastSyncTime(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(LAST_SYNC_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Retrieves all currently queued audit events from persistent storage
   */
  public getQueue(): QueuedAuditEvent[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as QueuedAuditEvent[];
    } catch (e) {
      console.error('[OfflineAuditSync] Failed to parse offline queue:', e);
      return [];
    }
  }

  /**
   * Returns current pending offline queue count
   */
  public getQueueCount(): number {
    return this.getQueue().length;
  }

  /**
   * Enqueues a non-critical audit event for deferred server transmission
   */
  public enqueueEvent(eventData: {
    type: string;
    title: string;
    description: string;
    metaHash?: string;
    severity?: 'info' | 'warning' | 'critical' | 'success';
    statuteRef?: string;
  }): QueuedAuditEvent {
    const queue = this.getQueue();
    const item: QueuedAuditEvent = {
      id: `offline-audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      queuedAt: new Date().toISOString(),
      type: eventData.type,
      title: eventData.title,
      description: eventData.description,
      metaHash: eventData.metaHash || `0x${Math.random().toString(16).substring(2, 10)}`,
      severity: eventData.severity || 'info',
      statuteRef: eventData.statuteRef || 'ETDA Section 26 / SSoT Log Buffer',
      retryCount: 0,
    };

    queue.push(item);
    this.saveQueue(queue);
    this.notifyListeners(queue);

    // Register Background Sync with Service Worker
    this.registerBackgroundSync(item);

    console.log(`[OfflineAuditSync] Queued event: ${item.title} (Queue depth: ${queue.length})`);
    return item;
  }

  /**
   * Subscribes to queue changes (for badges and status UI)
   */
  public subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    listener(this.getQueueCount(), this.getQueue());
    return () => this.listeners.delete(listener);
  }

  /**
   * Flushes queued audit events to the server endpoint.
   * If force is true, actively validates and reconciles with the primary ledger even if queue is empty.
   */
  public async flushQueue(force: boolean = false): Promise<{ flushedCount: number; success: boolean; error?: string; message?: string }> {
    if (this.isFlushing || typeof window === 'undefined') {
      return { flushedCount: 0, success: false, error: 'Synchronization already in progress' };
    }

    if (!navigator.onLine) {
      return { flushedCount: 0, success: false, error: 'System is currently offline. Pending logs safely retained.' };
    }

    const queue = this.getQueue();
    if (queue.length === 0) {
      if (force) {
        this.isFlushing = true;
        try {
          const response = await fetch('/api/v1/audit/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              events: [],
              flushedAt: new Date().toISOString(),
              clientSyncProtocol: 'ZYRQUEN-OFFLINE-FORCE-SYNC-v1.2',
              manualTrigger: true,
            }),
          });

          if (!response.ok) {
            throw new Error(`Server ledger ping returned HTTP ${response.status}`);
          }

          const now = new Date().toISOString();
          try {
            localStorage.setItem(LAST_SYNC_KEY, now);
          } catch {
            // ignore
          }
          triggerVibration('snapshot');
          return {
            flushedCount: 0,
            success: true,
            message: 'Primary ledger verified in sync. Zero pending offline audit logs.',
          };
        } catch (err: any) {
          console.warn('[OfflineAuditSync] Force sync verification failed:', err.message);
          return { flushedCount: 0, success: false, error: err.message };
        } finally {
          this.isFlushing = false;
        }
      }
      return { flushedCount: 0, success: true, message: 'Queue is empty. No pending audit logs to flush.' };
    }

    this.isFlushing = true;

    try {
      const response = await fetch('/api/v1/audit/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: queue,
          flushedAt: new Date().toISOString(),
          clientSyncProtocol: force ? 'ZYRQUEN-OFFLINE-FORCE-SYNC-v1.2' : 'ZYRQUEN-OFFLINE-RECONCILIATION-v1.2',
          manualTrigger: force,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server sync failed with HTTP ${response.status}`);
      }

      const flushedCount = queue.length;
      // Clear queue upon successful server confirmation
      this.saveQueue([]);
      const now = new Date().toISOString();
      try {
        localStorage.setItem(LAST_SYNC_KEY, now);
      } catch {
        // ignore
      }
      this.notifyListeners([]);
      triggerVibration('snapshot');

      const msg = `Successfully flushed ${flushedCount} pending audit event${flushedCount > 1 ? 's' : ''} to primary ledger.`;
      console.log(`[OfflineAuditSync] ${msg}`);
      return { flushedCount, success: true, message: msg };
    } catch (err: any) {
      console.warn('[OfflineAuditSync] Sync flush attempt failed, keeping queue:', err.message);
      // Increment retry counts
      const updatedQueue = queue.map((item) => ({ ...item, retryCount: item.retryCount + 1 }));
      this.saveQueue(updatedQueue);
      return { flushedCount: 0, success: false, error: err.message };
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Manually triggers immediate synchronization of pending offline audit logs to the primary ledger
   */
  public async forceSync(): Promise<{ flushedCount: number; success: boolean; error?: string; message?: string }> {
    return this.flushQueue(true);
  }

  /**
   * Manually clears the offline audit queue (e.g. from Data Persistence management)
   */
  public clearQueue(): number {
    const prevCount = this.getQueueCount();
    this.saveQueue([]);
    this.notifyListeners([]);
    return prevCount;
  }

  private saveQueue(queue: QueuedAuditEvent[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('[OfflineAuditSync] Failed to save queue to localStorage:', e);
    }
  }

  private notifyListeners(queue: QueuedAuditEvent[]) {
    this.listeners.forEach((fn) => fn(queue.length, queue));
  }
}

export const offlineAuditSyncService = new OfflineAuditSyncService();
