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

  constructor() {
    this.tabId = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;

    if ('BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(ZYRQUEN_BROADCAST_CHANNEL_NAME);
        this.channel.onmessage = this.handleMessage.bind(this);
        this.isInitialized = true;

        // Broadcast a ping so any existing tabs know a new window opened
        this.postMessage('SYNC_PING', {});
      } catch (err) {
        console.warn('[BroadcastSync] BroadcastChannel init failed, falling back to local state:', err);
      }
    }
  }

  public getTabId(): string {
    return this.tabId;
  }

  public getIsInitialized(): boolean {
    return this.isInitialized;
  }

  public getChannelName(): string {
    return ZYRQUEN_BROADCAST_CHANNEL_NAME;
  }

  public onSystemEvent(handler: BroadcastEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  public onAuditSnapshot(handler: BroadcastSnapshotHandler): () => void {
    this.snapshotHandlers.add(handler);
    return () => this.snapshotHandlers.delete(handler);
  }

  public onLockState(handler: BroadcastLockStateHandler): () => void {
    this.lockStateHandlers.add(handler);
    return () => this.lockStateHandlers.delete(handler);
  }

  public broadcastSystemEvent(event: SystemEvent) {
    this.postMessage('SYSTEM_EVENT_ADDED', { event });
  }

  public broadcastAuditSnapshot(snapshot: HardwareSnapshot) {
    this.postMessage('AUDIT_SNAPSHOT_ADDED', { snapshot });
  }

  public broadcastGlobalLockState(lockState: GlobalLockStatePayload) {
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
      console.warn('[BroadcastSync] postMessage failed:', err);
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
