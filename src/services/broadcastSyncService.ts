/**
 * ZYRQUEN Ω∞ Multi-Tab Synchronization Service
 * Uses the Web Broadcast Channel API to synchronize system events, audit log updates,
 * and global lock states across all open tabs, preventing state fragmentation.
 */

import { HardwareSnapshot } from '@/types';
import { SystemEvent } from '@/components/SystemEventsSidebar';

export const ZYRQUEN_BROADCAST_CHANNEL_NAME = 'zyrquen_sovereign_sync_channel_v1';

export type BroadcastSyncMessageType =
  | 'SYSTEM_EVENT_ADDED'
  | 'AUDIT_SNAPSHOT_ADDED'
  | 'GLOBAL_LOCK_STATE_CHANGED'
  | 'SYNC_PING'
  | 'SYNC_PONG';

export interface GlobalLockStatePayload {
  isSystemActivityFrozen?: boolean;
  isForensicAuditMode?: boolean;
  isMonochromeMode?: boolean;
}

export interface BroadcastSyncMessage {
  type: BroadcastSyncMessageType;
  sourceTabId: string;
  timestamp: number;
  payload: {
    event?: SystemEvent;
    snapshot?: HardwareSnapshot;
    lockState?: GlobalLockStatePayload;
    totalEventsCount?: number;
    totalSnapshotsCount?: number;
  };
}

export type BroadcastEventHandler = (event: SystemEvent) => void;
export type BroadcastSnapshotHandler = (snapshot: HardwareSnapshot) => void;
export type BroadcastLockStateHandler = (state: GlobalLockStatePayload) => void;

class SovereignBroadcastSyncService {
  private channel: BroadcastChannel | null = null;
  private tabId: string;
  private eventHandlers: Set<BroadcastEventHandler> = new Set();
  private snapshotHandlers: Set<BroadcastSnapshotHandler> = new Set();
  private lockStateHandlers: Set<BroadcastLockStateHandler> = new Set();
  private isInitialized = false;
  private mode: 'BROADCAST_CHANNEL' | 'LOCAL_FALLBACK' = 'LOCAL_FALLBACK';

  constructor() {
    this.tabId = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  /**
   * Promise-based asynchronous initialization that ensures window and DOM readiness
   * before instantiating BroadcastChannel or falling back to local isolated event bus.
   */
  public async initAsync(): Promise<boolean> {
    if (this.isInitialized) return true;

    if (typeof window === 'undefined') {
      this.isInitialized = true;
      this.mode = 'LOCAL_FALLBACK';
      return true;
    }

    // Verify DOM readiness in browser environment
    if (typeof document !== 'undefined' && document.readyState === 'loading') {
      await new Promise<void>((resolve) => {
        const onReady = () => {
          window.removeEventListener('DOMContentLoaded', onReady);
          window.removeEventListener('load', onReady);
          resolve();
        };
        window.addEventListener('DOMContentLoaded', onReady, { once: true });
        window.addEventListener('load', onReady, { once: true });
      });
    }

    return this.init();
  }

  public init(): boolean {
    if (this.isInitialized) return true;

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(ZYRQUEN_BROADCAST_CHANNEL_NAME);
        this.channel.onmessage = this.handleMessage.bind(this);
        this.isInitialized = true;
        this.mode = 'BROADCAST_CHANNEL';

        // Broadcast a ping so any existing tabs know a new window opened
        this.postMessage('SYNC_PING', {});
        return true;
      } catch (err) {
        this.channel = null;
        this.isInitialized = true;
        this.mode = 'LOCAL_FALLBACK';
        return true;
      }
    } else {
      // In-memory / single-tab local state fallback (sandboxed iframes, test suites, SSR)
      this.isInitialized = true;
      this.mode = 'LOCAL_FALLBACK';
      return true;
    }
  }

  public getTabId(): string {
    return this.tabId;
  }

  public getIsInitialized(): boolean {
    return this.isInitialized;
  }

  public getMode(): 'BROADCAST_CHANNEL' | 'LOCAL_FALLBACK' {
    return this.mode;
  }

  public getChannelName(): string {
    return ZYRQUEN_BROADCAST_CHANNEL_NAME;
  }

  public onSystemEvent(handler: BroadcastEventHandler): () => void {
    if (!this.isInitialized) this.init();
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  public onAuditSnapshot(handler: BroadcastSnapshotHandler): () => void {
    if (!this.isInitialized) this.init();
    this.snapshotHandlers.add(handler);
    return () => this.snapshotHandlers.delete(handler);
  }

  public onLockState(handler: BroadcastLockStateHandler): () => void {
    if (!this.isInitialized) this.init();
    this.lockStateHandlers.add(handler);
    return () => this.lockStateHandlers.delete(handler);
  }

  public broadcastSystemEvent(event: SystemEvent) {
    if (!this.isInitialized) this.init();
    this.postMessage('SYSTEM_EVENT_ADDED', { event });
  }

  public broadcastAuditSnapshot(snapshot: HardwareSnapshot) {
    if (!this.isInitialized) this.init();
    this.postMessage('AUDIT_SNAPSHOT_ADDED', { snapshot });
  }

  public broadcastGlobalLockState(lockState: GlobalLockStatePayload) {
    if (!this.isInitialized) this.init();
    this.postMessage('GLOBAL_LOCK_STATE_CHANGED', { lockState });
  }

  private postMessage(type: BroadcastSyncMessageType, payload: BroadcastSyncMessage['payload']) {
    if (!this.channel) return;
    try {
      const message: BroadcastSyncMessage = {
        type,
        sourceTabId: this.tabId,
        timestamp: Date.now(),
        payload,
      };
      this.channel.postMessage(message);
    } catch (err) {
      // Silently handle postMessage in restricted sandbox environments
    }
  }

  private handleMessage(ev: MessageEvent<BroadcastSyncMessage>) {
    const data = ev.data;
    if (!data || data.sourceTabId === this.tabId) return;

    switch (data.type) {
      case 'SYSTEM_EVENT_ADDED':
        if (data.payload.event) {
          this.eventHandlers.forEach((fn) => fn(data.payload.event!));
        }
        break;

      case 'AUDIT_SNAPSHOT_ADDED':
        if (data.payload.snapshot) {
          this.snapshotHandlers.forEach((fn) => fn(data.payload.snapshot!));
        }
        break;

      case 'GLOBAL_LOCK_STATE_CHANGED':
        if (data.payload.lockState) {
          this.lockStateHandlers.forEach((fn) => fn(data.payload.lockState!));
        }
        break;

      case 'SYNC_PING':
        // Acknowledge new tab presence
        break;

      default:
        break;
    }
  }

  public destroy() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.eventHandlers.clear();
    this.snapshotHandlers.clear();
    this.lockStateHandlers.clear();
    this.isInitialized = false;
  }
}

export const broadcastSyncService = new SovereignBroadcastSyncService();
