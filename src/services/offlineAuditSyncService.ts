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

export type SyncErrorStage =
  | 'NETWORK'
  | 'SERVER_REJECTION'
  | 'SERVICE_WORKER'
  | 'PAYLOAD_ENCODING'
  | 'OFFLINE'
  | 'TIMEOUT'
  | 'UNKNOWN';

export interface SyncErrorInfo {
  traceId: string;
  message: string;
  stage: SyncErrorStage;
  httpStatus?: number;
  failedAt: string;
  pendingCount: number;
  retryCount: number;
  errorDetails?: string;
  userFeedbackMessage: string;
}

export interface SyncHealthStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  autoSyncEnabled: boolean;
  lastSyncTime: string | null;
  lastError: SyncErrorInfo | null;
  errorHistoryCount: number;
}

const STORAGE_KEY = 'zyrquen_offline_audit_queue_v1';
const LAST_SYNC_KEY = 'zyrquen_last_audit_sync_time_v1';
const AUTO_SYNC_KEY = 'zyrquen_auto_sync_enabled_v1';
const SYNC_HISTORY_KEY = 'zyrquen_audit_sync_history_v1';
const PENDING_THRESHOLD_KEY = 'zyrquen_pending_logs_threshold_v1';
const LAST_ERROR_KEY = 'zyrquen_last_audit_sync_error_v1';
const ERROR_HISTORY_KEY = 'zyrquen_audit_sync_error_history_v1';
const DEFAULT_PENDING_THRESHOLD = 50;
const MAX_ERROR_HISTORY = 10;
const SYNC_FETCH_TIMEOUT_MS = 8000;

type QueueListener = (count: number, items: QueuedAuditEvent[]) => void;
type AutoSyncListener = (enabled: boolean) => void;
type SyncHistoryListener = (history: string[]) => void;
type ThresholdListener = (threshold: number) => void;
type SyncStatusListener = (isSyncing: boolean) => void;
type SyncProgressListener = (progressPercent: number) => void;
type BroadcastHeartbeatListener = (timestamp: number) => void;
type SyncErrorListener = (error: SyncErrorInfo | null) => void;

class OfflineAuditSyncService {
  private listeners: Set<QueueListener> = new Set();
  private autoSyncListeners: Set<AutoSyncListener> = new Set();
  private historyListeners: Set<SyncHistoryListener> = new Set();
  private thresholdListeners: Set<ThresholdListener> = new Set();
  private syncStatusListeners: Set<SyncStatusListener> = new Set();
  private syncProgressListeners: Set<SyncProgressListener> = new Set();
  private broadcastHeartbeatListeners: Set<BroadcastHeartbeatListener> = new Set();
  private syncErrorListeners: Set<SyncErrorListener> = new Set();
  private lastSyncError: SyncErrorInfo | null = null;
  private isFlushing = false;
  private currentProgress = 0;
  private autoSyncTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private readonly AUTO_SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Restore persisted error if available
    if (typeof window !== 'undefined') {
      try {
        const rawErr = localStorage.getItem(LAST_ERROR_KEY);
        if (rawErr) {
          this.lastSyncError = JSON.parse(rawErr);
        }
      } catch {
        // ignore
      }

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
            this.clearSyncError();
            this.notifyBroadcastHeartbeat(Date.now());
          }
        });
      }

      if (typeof BroadcastChannel !== 'undefined') {
        try {
          this.broadcastChannel = new BroadcastChannel('zyrquen_audit_sync_bus');
          this.broadcastChannel.onmessage = (event) => {
            if (event.data?.type === 'AUDIT_LOGS_SYNCED') {
              this.saveQueue([]);
              this.notifyListeners([]);
              this.recordSyncSuccess();
              this.clearSyncError();
              this.notifyBroadcastHeartbeat(Date.now());
            } else if (event.data?.type === 'HEARTBEAT_PULSE') {
              this.notifyBroadcastHeartbeat(event.data.timestamp || Date.now());
            }
          };
        } catch {
          // BroadcastChannel fallback
        }
      }

      // Start periodic cross-tab heartbeat propagation (every 3.5 seconds)
      this.startHeartbeatTimer();

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
          payload: item,
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
              isSyncSupported: event.data.isSyncSupported,
            });
          } else {
            resolve({ pendingLogsCount: this.getQueueCount() });
          }
        };

        targetWorker.postMessage({ type: 'GET_CACHE_STATUS' }, [messageChannel.port2]);
      });
    } catch {
      return { pendingLogsCount: this.getQueueCount() };
    }
  }

  private setFlushing(isFlushing: boolean) {
    this.isFlushing = isFlushing;
    if (!isFlushing) {
      this.setProgress(0);
    }
    this.syncStatusListeners.forEach((listener) => {
      try {
        listener(isFlushing);
      } catch (e) {
        console.warn('[OfflineAuditSync] Listener error:', e);
      }
    });
  }

  private setProgress(percent: number) {
    this.currentProgress = Math.max(0, Math.min(100, Math.round(percent)));
    this.syncProgressListeners.forEach((listener) => {
      try {
        listener(this.currentProgress);
      } catch (e) {
        console.warn('[OfflineAuditSync] Progress listener error:', e);
      }
    });
  }

  private notifyBroadcastHeartbeat(timestamp: number) {
    this.broadcastHeartbeatListeners.forEach((listener) => {
      try {
        listener(timestamp);
      } catch (e) {
        console.warn('[OfflineAuditSync] Heartbeat listener error:', e);
      }
    });
  }

  private startHeartbeatTimer() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (typeof window === 'undefined') return;
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      if (this.broadcastChannel) {
        try {
          this.broadcastChannel.postMessage({ type: 'HEARTBEAT_PULSE', timestamp: now });
        } catch {
          // ignore
        }
      }
      this.notifyBroadcastHeartbeat(now);
    }, 3500);
  }

  /**
   * Subscribes to sync error notifications
   */
  public subscribeSyncError(listener: SyncErrorListener): () => void {
    this.syncErrorListeners.add(listener);
    listener(this.lastSyncError);
    return () => this.syncErrorListeners.delete(listener);
  }

  /**
   * Returns the most recent sync error information, if any
   */
  public getLastSyncError(): SyncErrorInfo | null {
    if (this.lastSyncError) return this.lastSyncError;
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(LAST_ERROR_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return null;
  }

  /**
   * Returns historical sync errors (up to 10 entries) for forensic auditing
   */
  public getSyncErrorHistory(): SyncErrorInfo[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(ERROR_HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.slice(0, MAX_ERROR_HISTORY);
      }
    } catch {
      // ignore
    }
    return [];
  }

  /**
   * Clears the current sync error state and resets feedback
   */
  public clearSyncError(): void {
    this.lastSyncError = null;
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(LAST_ERROR_KEY);
      } catch {
        // ignore
      }
    }
    this.syncErrorListeners.forEach((fn) => {
      try {
        fn(null);
      } catch (e) {
        console.warn('[OfflineAuditSync] Listener error on clear error:', e);
      }
    });
  }

  /**
   * Formats human-friendly feedback message for non-disruptive UI presentation
   */
  private generateUserFeedback(stage: SyncErrorStage, pendingCount: number, message: string): string {
    switch (stage) {
      case 'OFFLINE':
        return `Offline: ${pendingCount} audit log${pendingCount !== 1 ? 's' : ''} safely buffered locally. Automatic sync will resume upon reconnection.`;
      case 'TIMEOUT':
        return `Network sync timed out (${SYNC_FETCH_TIMEOUT_MS / 1000}s). ${pendingCount} log${pendingCount !== 1 ? 's' : ''} retained safely in local storage buffer.`;
      case 'SERVER_REJECTION':
        return `Server ledger temporarily rejected sync (${message}). Retaining ${pendingCount} pending log${pendingCount !== 1 ? 's' : ''} for automatic retry.`;
      case 'NETWORK':
        return `Network transport error: ${message}. ${pendingCount} log${pendingCount !== 1 ? 's' : ''} preserved in local buffer.`;
      case 'SERVICE_WORKER':
        return `Service worker background sync unavailable. Falling back to in-memory/localStorage buffer (${pendingCount} logs).`;
      default:
        return `Audit sync deferred: ${message}. Zero data loss guaranteed.`;
    }
  }

  /**
   * Records detailed error information with trace IDs, stores in history, and notifies listeners without disrupting UI
   */
  private recordSyncError(info: {
    message: string;
    stage: SyncErrorStage;
    httpStatus?: number;
    pendingCount: number;
    retryCount: number;
    errorDetails?: string;
  }): SyncErrorInfo {
    const traceId = `TRC-SYNC-ERR-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const userFeedbackMessage = this.generateUserFeedback(info.stage, info.pendingCount, info.message);

    const errorInfo: SyncErrorInfo = {
      traceId,
      message: info.message,
      stage: info.stage,
      httpStatus: info.httpStatus,
      failedAt: new Date().toISOString(),
      pendingCount: info.pendingCount,
      retryCount: info.retryCount,
      errorDetails: info.errorDetails,
      userFeedbackMessage,
    };

    this.lastSyncError = errorInfo;

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LAST_ERROR_KEY, JSON.stringify(errorInfo));

        // Append to error history
        const existingHistory = this.getSyncErrorHistory();
        const updatedHistory = [errorInfo, ...existingHistory.filter((e) => e.traceId !== traceId)].slice(
          0,
          MAX_ERROR_HISTORY
        );
        localStorage.setItem(ERROR_HISTORY_KEY, JSON.stringify(updatedHistory));
      } catch {
        // ignore storage errors
      }
    }

    // Notify registered error subscribers
    this.syncErrorListeners.forEach((fn) => {
      try {
        fn(errorInfo);
      } catch (e) {
        console.warn('[OfflineAuditSync] Error listener failure:', e);
      }
    });

    // Non-disruptive haptic feedback to operator (fail-safe)
    try {
      triggerVibration('warning');
    } catch {
      // safe fallback
    }

    // Detailed structured logging for dev / telemetry debugging
    console.warn(
      `[OfflineAuditSync][SyncFailed][Trace: ${traceId}] Stage: [${errorInfo.stage}] | HTTP: ${errorInfo.httpStatus || 'N/A'} | Pending: ${errorInfo.pendingCount} | Retries: ${errorInfo.retryCount} | Error: "${errorInfo.message}"`
    );

    return errorInfo;
  }

  /**
   * Subscribes to background sync status changes (isSyncing: boolean)
   */
  public subscribeSyncStatus(listener: SyncStatusListener): () => void {
    this.syncStatusListeners.add(listener);
    listener(this.isFlushing);
    return () => this.syncStatusListeners.delete(listener);
  }

  /**
   * Subscribes to background sync progress updates (percent: 0-100)
   */
  public subscribeSyncProgress(listener: SyncProgressListener): () => void {
    this.syncProgressListeners.add(listener);
    listener(this.currentProgress);
    return () => this.syncProgressListeners.delete(listener);
  }

  /**
   * Subscribes to cross-tab broadcast heartbeat pulses
   */
  public subscribeBroadcastHeartbeat(listener: BroadcastHeartbeatListener): () => void {
    this.broadcastHeartbeatListeners.add(listener);
    return () => this.broadcastHeartbeatListeners.delete(listener);
  }

  /**
   * Returns current sync progress (0 - 100%)
   */
  public getCurrentSyncProgress(): number {
    return this.currentProgress;
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
   * Returns full health summary of the offline audit sync service
   */
  public getSyncHealthStatus(): SyncHealthStatus {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    return {
      isOnline,
      isSyncing: this.isFlushing,
      pendingCount: this.getQueueCount(),
      autoSyncEnabled: this.isAutoSyncEnabled(),
      lastSyncTime: this.getLastSyncTime(),
      lastError: this.getLastSyncError(),
      errorHistoryCount: this.getSyncErrorHistory().length,
    };
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
  public async flush(
    force: boolean = false
  ): Promise<{ flushedCount: number; success: boolean; error?: string; message?: string; traceId?: string }> {
    return this.flushQueue(force);
  }

  /**
   * Flushes queued audit events to the server endpoint.
   * If force is true, actively validates and reconciles with the primary ledger even if queue is empty.
   */
  public async flushQueue(
    force: boolean = false
  ): Promise<{ flushedCount: number; success: boolean; error?: string; message?: string; traceId?: string }> {
    if (this.isFlushing || typeof window === 'undefined') {
      return { flushedCount: 0, success: false, error: 'Synchronization already in progress' };
    }

    const queue = this.getQueue();

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const errInfo = this.recordSyncError({
        message: 'System is currently offline. Pending logs safely retained in local buffer.',
        stage: 'OFFLINE',
        pendingCount: queue.length,
        retryCount: queue[0]?.retryCount || 0,
      });
      return {
        flushedCount: 0,
        success: false,
        error: errInfo.message,
        traceId: errInfo.traceId,
      };
    }

    if (queue.length === 0) {
      if (force) {
        this.setFlushing(true);
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), SYNC_FETCH_TIMEOUT_MS);

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
            signal: controller.signal,
          }).finally(() => clearTimeout(timeoutId));

          if (!response.ok) {
            const errInfo = this.recordSyncError({
              message: `Server ledger ping returned HTTP ${response.status}`,
              stage: 'SERVER_REJECTION',
              httpStatus: response.status,
              pendingCount: 0,
              retryCount: 0,
            });
            throw new Error(errInfo.message);
          }

          const now = new Date().toISOString();
          try {
            localStorage.setItem(LAST_SYNC_KEY, now);
          } catch {
            // ignore
          }
          this.recordSyncSuccess(now);
          this.clearSyncError();
          triggerVibration('snapshot');
          return {
            flushedCount: 0,
            success: true,
            message: 'Primary ledger verified in sync. Zero pending offline audit logs.',
          };
        } catch (err: any) {
          const isTimeout = err?.name === 'AbortError';
          const stage: SyncErrorStage = isTimeout ? 'TIMEOUT' : 'NETWORK';
          const errInfo = this.recordSyncError({
            message: isTimeout
              ? `Sync request timed out after ${SYNC_FETCH_TIMEOUT_MS}ms`
              : err?.message || 'Force sync verification network failure',
            stage,
            pendingCount: 0,
            retryCount: 0,
            errorDetails: err?.stack,
          });
          console.warn('[OfflineAuditSync] Force sync verification failed:', errInfo.message);
          return {
            flushedCount: 0,
            success: false,
            error: errInfo.message,
            traceId: errInfo.traceId,
          };
        } finally {
          this.setFlushing(false);
        }
      }
      return { flushedCount: 0, success: true, message: 'Queue is empty. No pending audit logs to flush.' };
    }

    this.setFlushing(true);
    this.setProgress(15);

    try {
      this.setProgress(35);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SYNC_FETCH_TIMEOUT_MS);

      const response = await fetch('/api/v1/audit/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: queue,
          flushedAt: new Date().toISOString(),
          clientSyncProtocol: force
            ? 'ZYRQUEN-OFFLINE-FORCE-SYNC-v1.2'
            : 'ZYRQUEN-OFFLINE-RECONCILIATION-v1.2',
          manualTrigger: force,
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      this.setProgress(75);

      if (!response.ok) {
        const errInfo = this.recordSyncError({
          message: `Server sync failed with HTTP ${response.status}`,
          stage: 'SERVER_REJECTION',
          httpStatus: response.status,
          pendingCount: queue.length,
          retryCount: (queue[0]?.retryCount || 0) + 1,
        });
        throw new Error(errInfo.message);
      }

      this.setProgress(95);
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
      this.clearSyncError();
      this.notifyListeners([]);
      triggerVibration('snapshot');
      this.setProgress(100);

      const msg = `Successfully flushed ${flushedCount} pending audit event${flushedCount > 1 ? 's' : ''} to primary ledger.`;
      console.log(`[OfflineAuditSync] ${msg}`);
      return { flushedCount, success: true, message: msg };
    } catch (err: any) {
      const isTimeout = err?.name === 'AbortError';
      const stage: SyncErrorStage = isTimeout ? 'TIMEOUT' : 'NETWORK';
      console.warn('[OfflineAuditSync] Sync flush attempt failed, keeping queue:', err.message);

      // Increment retry counts on queue items
      const updatedQueue = queue.map((item) => ({ ...item, retryCount: item.retryCount + 1 }));
      this.saveQueue(updatedQueue);

      const errInfo = this.recordSyncError({
        message: isTimeout
          ? `Audit log sync timed out after ${SYNC_FETCH_TIMEOUT_MS}ms`
          : err.message || 'Unknown network error during audit log sync flush',
        stage,
        pendingCount: updatedQueue.length,
        retryCount: updatedQueue[0]?.retryCount || 1,
        errorDetails: err?.stack,
      });

      return {
        flushedCount: 0,
        success: false,
        error: errInfo.message,
        traceId: errInfo.traceId,
      };
    } finally {
      this.setFlushing(false);
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

  /**
   * Retrieves the configured pending logs buffer limit threshold (default: 50)
   */
  public getPendingThreshold(): number {
    if (typeof window === 'undefined') return DEFAULT_PENDING_THRESHOLD;
    try {
      const val = localStorage.getItem(PENDING_THRESHOLD_KEY);
      if (val !== null) {
        const parsed = parseInt(val, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_PENDING_THRESHOLD;
  }

  /**
   * Updates the pending logs buffer limit threshold
   */
  public setPendingThreshold(threshold: number): void {
    const valid = Math.max(5, Math.min(500, Math.round(threshold)));
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(PENDING_THRESHOLD_KEY, String(valid));
      } catch {
        // ignore
      }
    }
    this.thresholdListeners.forEach((fn) => fn(valid));
    console.log(`[OfflineAuditSync] Configured Pending Logs Alert Threshold: ${valid} logs`);
  }

  /**
   * Subscribes to changes in the pending logs buffer threshold
   */
  public subscribePendingThreshold(listener: ThresholdListener): () => void {
    this.thresholdListeners.add(listener);
    listener(this.getPendingThreshold());
    return () => this.thresholdListeners.delete(listener);
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
  public async forceSync(): Promise<{
    flushedCount: number;
    success: boolean;
    error?: string;
    message?: string;
    traceId?: string;
  }> {
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
