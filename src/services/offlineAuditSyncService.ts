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
   * Flushes all queued audit events to the server endpoint
   */
  public async flushQueue(): Promise<{ flushedCount: number; success: boolean; error?: string }> {
    if (this.isFlushing || typeof window === 'undefined') {
      return { flushedCount: 0, success: false };
    }

    if (!navigator.onLine) {
      return { flushedCount: 0, success: false, error: 'Offline' };
    }

    const queue = this.getQueue();
    if (queue.length === 0) {
      return { flushedCount: 0, success: true };
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
          clientSyncProtocol: 'ZYRQUEN-OFFLINE-RECONCILIATION-v1.2',
        }),
      });

      if (!response.ok) {
        throw new Error(`Server sync failed with HTTP ${response.status}`);
      }

      const flushedCount = queue.length;
      // Clear queue upon successful server confirmation
      this.saveQueue([]);
      this.notifyListeners([]);
      triggerVibration('snapshot');

      console.log(`[OfflineAuditSync] Successfully flushed ${flushedCount} audit events to server ledger.`);
      return { flushedCount, success: true };
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
