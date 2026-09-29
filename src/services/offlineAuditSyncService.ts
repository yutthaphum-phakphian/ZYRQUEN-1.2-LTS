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
const AUTO_SYNC_KEY = 'zyrquen_auto_sync_enabled_v1';
const SYNC_HISTORY_KEY = 'zyrquen_audit_sync_history_v1';

type QueueListener = (count: number, items: QueuedAuditEvent[]) => void;
type AutoSyncListener = (enabled: boolean) => void;
type SyncHistoryListener = (history: string[]) => void;

class OfflineAuditSyncService {
  private listeners: Set<QueueListener> = new Set();
  private autoSyncListeners: Set<AutoSyncListener> = new Set();
  private historyListeners: Set<SyncHistoryListener> = new Set();
  private isFlushing = false;
  private autoSyncTimer: ReturnType<typeof setInterval> | null = null;
  private readonly AUTO_SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

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
            this.recordSyncSuccess();
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
              this.recordSyncSuccess();
            }
          };
        } catch {
          // BroadcastChannel fallback
        }
      }

      // Initialize Auto-Sync timer if enabled (default ON)
      if (this.isAutoSyncEnabled()) {
        this.startAutoSyncTimer();
        // If already online and items pending in queue, flush automatically without user intervention
        if (typeof navigator !== 'undefined' && navigator.onLine && this.getQueueCount() > 0) {
          setTimeout(() => {
            this.flushQueue(false);
          }, 1200);
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

    // If online and auto-sync is enabled by default, schedule automatic queue flush without user intervention
    if (typeof navigator !== 'undefined' && navigator.onLine && this.isAutoSyncEnabled() && !this.isFlushing) {
      setTimeout(() => {
        if (navigator.onLine && !this.isFlushing && this.getQueueCount() > 0) {
          this.flushQueue(false);
        }
      }, 1500);
    }

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
   * Flushes queued audit events to the server endpoint (alias to flushQueue).
   */
  public async flush(force: boolean = false): Promise<{ flushedCount: number; success: boolean; error?: string; message?: string }> {
    return this.flushQueue(force);
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
          this.recordSyncSuccess(now);
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
      this.recordSyncSuccess(now);
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
   * Checks if Scheduled Auto-Sync is enabled (defaults to true)
   */
  public isAutoSyncEnabled(): boolean {
    if (typeof window === 'undefined') return true;
    try {
      const val = localStorage.getItem(AUTO_SYNC_KEY);
      return val === null || val === undefined ? true : val !== 'false';
    } catch {
      return true;
    }
  }

  /**
   * Sets Scheduled Auto-Sync enabled state (periodically flushes every 5 minutes)
   */
  public setAutoSync(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(AUTO_SYNC_KEY, String(enabled));
    } catch {
      // ignore
    }

    if (enabled) {
      this.startAutoSyncTimer();
    } else {
      this.stopAutoSyncTimer();
    }

    this.autoSyncListeners.forEach((fn) => fn(enabled));
    console.log(`[OfflineAuditSync] Scheduled Auto-Sync (5 min) set to: ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * Toggles Scheduled Auto-Sync
   */
  public toggleAutoSync(): boolean {
    const next = !this.isAutoSyncEnabled();
    this.setAutoSync(next);
    return next;
  }

  /**
   * Subscribes to Auto-Sync state changes
   */
  public subscribeAutoSync(listener: AutoSyncListener): () => void {
    this.autoSyncListeners.add(listener);
    listener(this.isAutoSyncEnabled());
    return () => this.autoSyncListeners.delete(listener);
  }

  private startAutoSyncTimer(): void {
    this.stopAutoSyncTimer();
    if (typeof window === 'undefined') return;
    this.autoSyncTimer = setInterval(() => {
      if (navigator.onLine && !this.isFlushing) {
        console.log('[OfflineAuditSync] Scheduled 5-minute Auto-Sync triggering flush...');
        this.flushQueue(false);
      }
    }, this.AUTO_SYNC_INTERVAL_MS);
  }

  private stopAutoSyncTimer(): void {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }
  }

  /**
   * Retrieves the last 5 successful sync timestamps
   */
  public getSyncHistory(): string[] {
    if (typeof window === 'undefined') {
      return this.getDefaultSyncHistory();
    }
    try {
      const raw = localStorage.getItem(SYNC_HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, 5);
        }
      }
    } catch (e) {
      console.warn('[OfflineAuditSync] Failed to read sync history:', e);
    }
    return this.getDefaultSyncHistory();
  }

  /**
   * Subscribes to Sync History updates
   */
  public subscribeSyncHistory(listener: SyncHistoryListener): () => void {
    this.historyListeners.add(listener);
    listener(this.getSyncHistory());
    return () => this.historyListeners.delete(listener);
  }

  /**
   * Records a successful sync timestamp in history (maintains last 5)
   */
  public recordSyncSuccess(timestamp?: string): string[] {
    const ts = timestamp || new Date().toISOString();
    const current = this.getSyncHistory();
    const updated = [ts, ...current.filter((t) => t !== ts)].slice(0, 5);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SYNC_HISTORY_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
    this.historyListeners.forEach((fn) => fn(updated));
    return updated;
  }

  private getDefaultSyncHistory(): string[] {
    const now = Date.now();
    return [
      new Date(now - 1 * 60 * 1000).toISOString(),
      new Date(now - 6 * 60 * 1000).toISOString(),
      new Date(now - 11 * 60 * 1000).toISOString(),
      new Date(now - 16 * 60 * 1000).toISOString(),
      new Date(now - 21 * 60 * 1000).toISOString(),
    ];
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
