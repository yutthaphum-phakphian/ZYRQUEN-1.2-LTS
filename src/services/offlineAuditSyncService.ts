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

const STORAGE_KEY = 'zyrquen_offline_audit_queue_v2';
type QueueListener = (count: number, items: QueuedAuditEvent[]) => void;

class OfflineAuditSyncService {
  private listeners = new Set<QueueListener>();
  private isFlushing = false;
  private onlineHandler = () => { void this.flushQueue(); };
  private storageHandler = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) this.notifyListeners(this.getQueue());
  };

  private createEventId(): string {
    const cryptoApi = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
    const randomUuid = cryptoApi && 'randomUUID' in cryptoApi
      ? (cryptoApi as Crypto & { randomUUID?: () => string }).randomUUID?.()
      : undefined;
    return `offline-audit-${randomUuid ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
  }

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.onlineHandler);
      window.addEventListener('storage', this.storageHandler);
      if (navigator.onLine) window.setTimeout(() => void this.flushQueue(), 0);
    }
  }

  public getQueue(): QueuedAuditEvent[] {
    if (typeof window === 'undefined') return [];
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }
  public getQueueCount(): number { return this.getQueue().length; }

  public enqueueEvent(eventData: Omit<QueuedAuditEvent, 'id' | 'queuedAt' | 'retryCount'>): QueuedAuditEvent {
    const item: QueuedAuditEvent = {
      ...eventData,
      id: this.createEventId(),
      queuedAt: new Date().toISOString(),
      retryCount: 0,
    };
    const queue = [...this.getQueue(), item];
    this.saveQueue(queue);
    this.notifyListeners(queue);
    if (navigator.onLine) void this.flushQueue();
    return item;
  }

  public subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    listener(this.getQueueCount(), this.getQueue());
    return () => this.listeners.delete(listener);
  }

  public async flushQueue(): Promise<{ flushedCount: number; success: boolean; error?: string }> {
    if (this.isFlushing || typeof window === 'undefined' || !navigator.onLine) return { flushedCount: 0, success: false, error: 'Offline or already flushing' };
    const queue = this.getQueue();
    if (!queue.length) return { flushedCount: 0, success: true };
    this.isFlushing = true;
    try {
      const response = await fetch('/api/v1/audit/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: queue, flushedAt: new Date().toISOString(), clientSyncProtocol: 'ZYRQUEN-OFFLINE-RECONCILIATION-v2' }),
      });
      if (!response.ok) throw new Error(`Server sync failed with HTTP ${response.status}`);
      const result = await response.json() as { acceptedIds?: string[]; reconciledCount?: number };
      const accepted = new Set(result.acceptedIds ?? queue.map((item) => item.id));
      const remaining = queue.filter((item) => !accepted.has(item.id));
      this.saveQueue(remaining);
      this.notifyListeners(remaining);
      if (queue.length !== remaining.length) triggerVibration('snapshot');
      return { flushedCount: queue.length - remaining.length, success: remaining.length === 0 };
    } catch (error) {
      const updated = queue.map((item) => ({ ...item, retryCount: item.retryCount + 1 }));
      this.saveQueue(updated);
      this.notifyListeners(updated);
      return { flushedCount: 0, success: false, error: error instanceof Error ? error.message : 'Unknown sync error' };
    } finally { this.isFlushing = false; }
  }

  private saveQueue(queue: QueuedAuditEvent[]): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(queue)); } catch (error) { console.error('[OfflineAuditSync] Queue persistence failed', error); }
  }
  private notifyListeners(queue: QueuedAuditEvent[]): void { this.listeners.forEach((listener) => listener(queue.length, queue)); }
}

export const offlineAuditSyncService = new OfflineAuditSyncService();
export default offlineAuditSyncService;
