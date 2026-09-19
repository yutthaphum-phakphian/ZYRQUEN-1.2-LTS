/**
 * Cross-Tab Synchronization Service
 * Utilizes the Broadcast Channel API (with localStorage storage-event fallback)
 * to synchronize system events, audit log updates, and global lock states
 * across all active tabs and windows of the ZYRQUEN Sovereign Engine.
 */

import { SystemEvent } from '../components/SystemEventsSidebar';

export type CrossTabMessageType =
  | 'SYSTEM_EVENT'
  | 'AUDIT_LOG_UPDATE'
  | 'GLOBAL_LOCK_STATE'
  | 'TAB_PRESENCE_PING'
  | 'TAB_PRESENCE_PONG';

export interface GlobalLockStatePayload {
  isSystemFrozen?: boolean;
  isForensicAuditMode?: boolean;
  isEmergencyLockdown?: boolean;
  timestamp: number;
}

export interface CrossTabMessage<T = any> {
  id: string;
  type: CrossTabMessageType;
  senderTabId: string;
  timestamp: number;
  payload: T;
}

const CHANNEL_NAME = 'zyrquen_broadcast_channel_v1';
const FALLBACK_STORAGE_KEY = 'zyrquen_cross_tab_bridge';

class CrossTabSyncService {
  private channel: BroadcastChannel | null = null;
  private tabId: string;
  private listeners = new Set<(msg: CrossTabMessage) => void>();
  private activeTabs = new Set<string>();
  private isBroadcastChannelSupported = typeof window !== 'undefined' && 'BroadcastChannel' in window;

  constructor() {
    this.tabId = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.initChannel();
    this.initPresence();
  }

  private initChannel() {
    if (typeof window === 'undefined') return;

    if (this.isBroadcastChannelSupported) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event: MessageEvent<CrossTabMessage>) => {
          this.handleIncomingMessage(event.data);
        };
        this.channel.onmessageerror = (err) => {
          console.warn('BroadcastChannel error in CrossTabSyncService:', err);
        };
      } catch (err) {
        console.warn('Failed to create BroadcastChannel, falling back to localStorage events:', err);
        this.channel = null;
      }
    }

    // Secondary fallback listener for environments where BroadcastChannel is blocked
    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.key === FALLBACK_STORAGE_KEY && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue) as CrossTabMessage;
          if (parsed && parsed.senderTabId !== this.tabId) {
            this.handleIncomingMessage(parsed);
          }
        } catch {}
      }
    });

    // Unload cleanup
    window.addEventListener('beforeunload', () => {
      this.activeTabs.delete(this.tabId);
    });
  }

  private initPresence() {
    if (typeof window === 'undefined') return;

    // Announce tab presence on startup
    setTimeout(() => {
      this.broadcastMessage('TAB_PRESENCE_PING', { tabId: this.tabId });
    }, 200);
  }

  private handleIncomingMessage(msg: CrossTabMessage) {
    if (!msg || msg.senderTabId === this.tabId) return;

    // Update active tab presence list
    if (msg.type === 'TAB_PRESENCE_PING') {
      this.activeTabs.add(msg.senderTabId);
      // Respond with PONG so new tab learns about this tab
      this.broadcastMessage('TAB_PRESENCE_PONG', { tabId: this.tabId });
    } else if (msg.type === 'TAB_PRESENCE_PONG') {
      this.activeTabs.add(msg.senderTabId);
    }

    // Notify registered subscribers
    for (const listener of this.listeners) {
      try {
        listener(msg);
      } catch (err) {
        console.error('Error in cross-tab sync listener:', err);
      }
    }
  }

  /**
   * Broadcast an arbitrary message across tabs
   */
  public broadcastMessage<T = any>(type: CrossTabMessageType, payload: T): void {
    if (typeof window === 'undefined') return;

    const msg: CrossTabMessage<T> = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      senderTabId: this.tabId,
      timestamp: Date.now(),
      payload,
    };

    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch (err) {
        console.warn('BroadcastChannel postMessage failed, using fallback:', err);
        this.fallbackBroadcast(msg);
      }
    } else {
      this.fallbackBroadcast(msg);
    }
  }

  private fallbackBroadcast(msg: CrossTabMessage): void {
    try {
      localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(msg));
    } catch {}
  }

  /**
   * Synchronize System Events across tabs
   */
  public broadcastSystemEvent(event: SystemEvent): void {
    this.broadcastMessage('SYSTEM_EVENT', event);
  }

  /**
   * Synchronize Audit Log records across tabs
   */
  public broadcastAuditLog(logRecord: any): void {
    this.broadcastMessage('AUDIT_LOG_UPDATE', logRecord);
  }

  /**
   * Synchronize Global Lock states across tabs (Frozen state, Forensic Audit Mode, Emergency Lockdown)
   */
  public broadcastGlobalLockState(lockState: Partial<GlobalLockStatePayload>): void {
    this.broadcastMessage('GLOBAL_LOCK_STATE', {
      ...lockState,
      timestamp: Date.now(),
    });
  }

  /**
   * Subscribe to incoming cross-tab messages
   */
  public subscribe(listener: (msg: CrossTabMessage) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getTabId(): string {
    return this.tabId;
  }

  public getActiveTabsCount(): number {
    return Math.max(1, this.activeTabs.size + 1);
  }

  public close(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.listeners.clear();
  }
}

export const crossTabSyncService = new CrossTabSyncService();
