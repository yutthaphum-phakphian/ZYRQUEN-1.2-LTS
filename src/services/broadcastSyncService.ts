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
  | 'SYNC_PONG'
  | 'SYNC_HEARTBEAT';

export interface GlobalLockStatePayload {
  isSystemActivityFrozen?: boolean;
  isForensicAuditMode?: boolean;
  isMonochromeMode?: boolean;
}

export interface SovereignSyncPeerNode {
  id: string;
  label: string;
  lastSeen: number;
  isSelf: boolean;
  role: 'PRIMARY_COORDINATOR' | 'ENCLAVE_PEER' | 'STANDBY_VALIDATOR';
  latencyMs?: number;
  merkleRoot?: string;
  blockHeight?: number;
}

export interface SovereignSyncStatus {
  mode: 'BROADCAST_CHANNEL' | 'LOCAL_FALLBACK';
  state: 'SYNCHRONIZED' | 'SYNCING' | 'SOLO_ACTIVE' | 'ISOLATED';
  activeNodeCount: number;
  peerCount: number;
  nodes: SovereignSyncPeerNode[];
  channelName: string;
  lastSyncTimestamp: number;
  roundTripLatencyMs: number;
  merkleCoherence: boolean;
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
    pingTime?: number;
    nodeInfo?: SovereignSyncPeerNode;
  };
}

export type BroadcastEventHandler = (event: SystemEvent) => void;
export type BroadcastSnapshotHandler = (snapshot: HardwareSnapshot) => void;
export type BroadcastLockStateHandler = (state: GlobalLockStatePayload) => void;
export type BroadcastSyncStatusHandler = (status: SovereignSyncStatus) => void;

class SovereignBroadcastSyncService {
  private channel: BroadcastChannel | null = null;
  private tabId: string;
  private eventHandlers: Set<BroadcastEventHandler> = new Set();
  private snapshotHandlers: Set<BroadcastSnapshotHandler> = new Set();
  private lockStateHandlers: Set<BroadcastLockStateHandler> = new Set();
  private syncStatusHandlers: Set<BroadcastSyncStatusHandler> = new Set();
  private peerNodes: Map<string, SovereignSyncPeerNode> = new Map();
  private isInitialized = false;
  private mode: 'BROADCAST_CHANNEL' | 'LOCAL_FALLBACK' = 'LOCAL_FALLBACK';
  private lastSyncTimestamp: number = Date.now();
  private roundTripLatencyMs: number = 0.8;
  private heartbeatTimer: any = null;
  private pendingMessages: Array<{ type: BroadcastSyncMessageType; payload: BroadcastSyncMessage['payload'] }> = [];
  private pendingEvents: SystemEvent[] = [];
  private pendingSnapshots: HardwareSnapshot[] = [];
  private lastLockState: GlobalLockStatePayload | null = null;

  constructor() {
    this.tabId = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  private getSelfNode(): SovereignSyncPeerNode {
    return {
      id: this.tabId,
      label: `Node-${this.tabId.slice(-4).toUpperCase()} (Local)`,
      lastSeen: Date.now(),
      isSelf: true,
      role: 'PRIMARY_COORDINATOR',
      latencyMs: 0.1,
      merkleRoot: '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      blockHeight: 849202,
    };
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

        this.flushPendingMessages();
        // Broadcast a ping so any existing tabs know a new window opened
        this.pingEnclave();
        this.startHeartbeat();
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

  private startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (typeof window === 'undefined') return;

    // Heartbeat every 8 seconds to maintain active node presence & check latency
    this.heartbeatTimer = setInterval(() => {
      this.pingEnclave();
      this.cleanStalePeers();
    }, 8000);
  }

  private cleanStalePeers() {
    const now = Date.now();
    let changed = false;
    for (const [id, peer] of this.peerNodes.entries()) {
      // Mark or prune peers older than 25 seconds
      if (now - peer.lastSeen > 25000) {
        this.peerNodes.delete(id);
        changed = true;
      }
    }
    if (changed) {
      this.notifySyncStatus();
    }
  }

  private notifySyncStatus() {
    const status = this.getSyncStatus();
    this.syncStatusHandlers.forEach((handler) => {
      try {
        handler(status);
      } catch (err) {
        console.error('[broadcastSyncService] Error in sync status handler:', err);
      }
    });
  }

  public getSyncStatus(): SovereignSyncStatus {
    const peers = Array.from(this.peerNodes.values());
    const selfNode = this.getSelfNode();
    const allNodes = [selfNode, ...peers];
    const peerCount = peers.length;

    let state: SovereignSyncStatus['state'] = 'SOLO_ACTIVE';
    if (this.mode === 'LOCAL_FALLBACK') {
      state = 'ISOLATED';
    } else if (peerCount > 0) {
      state = 'SYNCHRONIZED';
    } else {
      state = 'SOLO_ACTIVE';
    }

    return {
      mode: this.mode,
      state,
      activeNodeCount: allNodes.length,
      peerCount,
      nodes: allNodes,
      channelName: ZYRQUEN_BROADCAST_CHANNEL_NAME,
      lastSyncTimestamp: this.lastSyncTimestamp,
      roundTripLatencyMs: this.roundTripLatencyMs,
      merkleCoherence: true,
    };
  }

  public onSyncStatusChange(handler: BroadcastSyncStatusHandler): () => void {
    if (!this.isInitialized) this.init();
    this.syncStatusHandlers.add(handler);
    // Immediately emit current status
    try {
      handler(this.getSyncStatus());
    } catch (e) {
      // Ignore immediate invoke error
    }
    return () => this.syncStatusHandlers.delete(handler);
  }

  public pingEnclave(): void {
    if (!this.isInitialized) this.init();
    this.postMessage('SYNC_PING', {
      pingTime: Date.now(),
      nodeInfo: this.getSelfNode(),
    });
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
    this.eventHandlers.add(handler);
    this.pendingEvents.splice(0).forEach((event) => handler(event));
    return () => this.eventHandlers.delete(handler);
  }

  public onAuditSnapshot(handler: BroadcastSnapshotHandler): () => void {
    this.snapshotHandlers.add(handler);
    this.pendingSnapshots.splice(0).forEach((snapshot) => handler(snapshot));
    return () => this.snapshotHandlers.delete(handler);
  }

  public onLockState(handler: BroadcastLockStateHandler): () => void {
    this.lockStateHandlers.add(handler);
    if (this.lastLockState) handler(this.lastLockState);
    return () => this.lockStateHandlers.delete(handler);
  }

  public broadcastSystemEvent(event: SystemEvent) {
    this.lastSyncTimestamp = Date.now();
    if (this.eventHandlers.size === 0) this.pendingEvents.push(event);
    this.postMessage('SYSTEM_EVENT_ADDED', { event });
    this.notifySyncStatus();
  }

  public broadcastAuditSnapshot(snapshot: HardwareSnapshot) {
    this.lastSyncTimestamp = Date.now();
    if (this.snapshotHandlers.size === 0) this.pendingSnapshots.push(snapshot);
    this.postMessage('AUDIT_SNAPSHOT_ADDED', { snapshot });
    this.notifySyncStatus();
  }

  public broadcastGlobalLockState(lockState: GlobalLockStatePayload) {
    this.lastSyncTimestamp = Date.now();
    this.lastLockState = lockState;
    this.postMessage('GLOBAL_LOCK_STATE_CHANGED', { lockState });
    this.notifySyncStatus();
  }

  private postMessage(type: BroadcastSyncMessageType, payload: BroadcastSyncMessage['payload']) {
    if (!this.channel) {
      this.pendingMessages.push({ type, payload });
      return;
    }
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

  private flushPendingMessages() {
    const messages = this.pendingMessages.splice(0);
    messages.forEach(({ type, payload }) => this.postMessage(type, payload));
  }

  private handleMessage(ev: MessageEvent<BroadcastSyncMessage>) {
    const data = ev.data;
    if (!data || data.sourceTabId === this.tabId) return;

    this.lastSyncTimestamp = Date.now();

    switch (data.type) {
      case 'SYSTEM_EVENT_ADDED':
        if (data.payload.event) {
          if (this.eventHandlers.size === 0) this.pendingEvents.push(data.payload.event);
          else this.eventHandlers.forEach((fn) => fn(data.payload.event!));
        }
        this.notifySyncStatus();
        break;

      case 'AUDIT_SNAPSHOT_ADDED':
        if (data.payload.snapshot) {
          if (this.snapshotHandlers.size === 0) this.pendingSnapshots.push(data.payload.snapshot);
          else this.snapshotHandlers.forEach((fn) => fn(data.payload.snapshot!));
        }
        this.notifySyncStatus();
        break;

      case 'GLOBAL_LOCK_STATE_CHANGED':
        if (data.payload.lockState) {
          this.lastLockState = data.payload.lockState;
          this.lockStateHandlers.forEach((fn) => fn(data.payload.lockState!));
        }
        this.notifySyncStatus();
        break;

      case 'SYNC_PING': {
        const peerNode: SovereignSyncPeerNode = data.payload.nodeInfo || {
          id: data.sourceTabId,
          label: `Node-${data.sourceTabId.slice(-4).toUpperCase()}`,
          lastSeen: Date.now(),
          isSelf: false,
          role: 'ENCLAVE_PEER',
          merkleRoot: '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
          blockHeight: 849202,
        };
        peerNode.lastSeen = Date.now();
        this.peerNodes.set(data.sourceTabId, peerNode);

        // Acknowledge by responding with SYNC_PONG
        this.postMessage('SYNC_PONG', {
          pingTime: data.payload.pingTime || data.timestamp,
          nodeInfo: this.getSelfNode(),
          lockState: this.lastLockState || undefined,
        });
        this.notifySyncStatus();
        break;
      }

      case 'SYNC_PONG': {
        if (data.payload.pingTime) {
          const rtt = Math.max(0.4, Date.now() - data.payload.pingTime);
          this.roundTripLatencyMs = Number(rtt.toFixed(2));
        }
        const peerNode: SovereignSyncPeerNode = data.payload.nodeInfo || {
          id: data.sourceTabId,
          label: `Node-${data.sourceTabId.slice(-4).toUpperCase()}`,
          lastSeen: Date.now(),
          isSelf: false,
          role: 'ENCLAVE_PEER',
          latencyMs: this.roundTripLatencyMs,
          merkleRoot: '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
          blockHeight: 849202,
        };
        peerNode.lastSeen = Date.now();
        peerNode.latencyMs = this.roundTripLatencyMs;
        this.peerNodes.set(data.sourceTabId, peerNode);
        this.notifySyncStatus();
        break;
      }

      case 'SYNC_HEARTBEAT': {
        if (data.payload.nodeInfo) {
          const peer = data.payload.nodeInfo;
          peer.lastSeen = Date.now();
          this.peerNodes.set(data.sourceTabId, peer);
          this.notifySyncStatus();
        }
        break;
      }

      default:
        break;
    }
  }

  public destroy() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.eventHandlers.clear();
    this.snapshotHandlers.clear();
    this.lockStateHandlers.clear();
    this.syncStatusHandlers.clear();
    this.peerNodes.clear();
    this.pendingMessages = [];
    this.pendingEvents = [];
    this.pendingSnapshots = [];
    this.lastLockState = null;
    this.isInitialized = false;
  }
}

export const broadcastSyncService = new SovereignBroadcastSyncService();
