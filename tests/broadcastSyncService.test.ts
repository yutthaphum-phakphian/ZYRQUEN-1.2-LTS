// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  broadcastSyncService,
  ZYRQUEN_BROADCAST_CHANNEL_NAME,
  BroadcastSyncMessage,
} from '../src/services/broadcastSyncService';
import { SystemEvent } from '../src/components/SystemEventsSidebar';

describe('SovereignBroadcastSyncService Lifecycle & Race Condition Guard Suite', () => {
  let mockChannelInstance: any = null;
  let postedMessages: any[] = [];

  class MockBroadcastChannel {
    name: string;
    onmessage: ((ev: any) => void) | null = null;
    constructor(name: string) {
      this.name = name;
      mockChannelInstance = this;
    }
    postMessage(msg: any) {
      postedMessages.push(msg);
    }
    close() {}
  }

  beforeEach(() => {
    postedMessages = [];
    broadcastSyncService.destroy();
    (window as any).BroadcastChannel = MockBroadcastChannel;
  });

  afterEach(() => {
    broadcastSyncService.destroy();
    vi.restoreAllMocks();
  });

  it('allows subscribers to attach before init() without error (Subscriber-First)', () => {
    const mockEventHandler = vi.fn();
    const mockLockHandler = vi.fn();

    // Attach listeners BEFORE init() is invoked
    const unsubEvent = broadcastSyncService.onSystemEvent(mockEventHandler);
    const unsubLock = broadcastSyncService.onLockState(mockLockHandler);

    expect(broadcastSyncService.getIsInitialized()).toBe(false);

    // Now initialize service
    broadcastSyncService.init();

    expect(broadcastSyncService.getIsInitialized()).toBe(true);
    expect(mockChannelInstance).not.toBeNull();
    expect(mockChannelInstance.name).toBe(ZYRQUEN_BROADCAST_CHANNEL_NAME);

    // Initial ping must be sent
    expect(postedMessages.some((m) => m.type === 'SYNC_PING')).toBe(true);

    unsubEvent();
    unsubLock();
  });

  it('buffers outgoing messages sent before init() and flushes upon init()', () => {
    const dummyEvent: SystemEvent = {
      id: 'test-evt-1',
      timestamp: '14:43:43 ICT',
      type: 'SECURITY',
      title: 'Test Shield Active',
      description: 'Zero drift guaranteed',
      severity: 'info',
      status: 'VERIFIED',
    };

    // Broadcast before init()
    broadcastSyncService.broadcastSystemEvent(dummyEvent);
    broadcastSyncService.broadcastGlobalLockState({ isSystemActivityFrozen: true });

    // No messages sent yet because channel is not initialized
    expect(postedMessages.length).toBe(0);

    // When init() runs, buffered messages are flushed
    broadcastSyncService.init();

    expect(postedMessages.length).toBeGreaterThanOrEqual(2);
    expect(postedMessages.some((m) => m.type === 'SYSTEM_EVENT_ADDED')).toBe(true);
    expect(postedMessages.some((m) => m.type === 'GLOBAL_LOCK_STATE_CHANGED')).toBe(true);
  });

  it('replays last known lock state to late-attaching subscribers', () => {
    broadcastSyncService.init();

    // Remote tab broadcasts lock state
    const remoteMessage: MessageEvent<BroadcastSyncMessage> = {
      data: {
        type: 'GLOBAL_LOCK_STATE_CHANGED',
        sourceTabId: 'other-tab-456',
        timestamp: Date.now(),
        payload: {
          lockState: {
            isSystemActivityFrozen: true,
            isForensicAuditMode: true,
          },
        },
      },
    } as any;

    mockChannelInstance.onmessage(remoteMessage);

    // Now a new subscriber attaches later
    const lateLockHandler = vi.fn();
    const unsub = broadcastSyncService.onLockState(lateLockHandler);

    // Must immediately receive the last known lock state
    expect(lateLockHandler).toHaveBeenCalledWith({
      isSystemActivityFrozen: true,
      isForensicAuditMode: true,
    });

    unsub();
  });

  it('buffers incoming events if they arrive before handlers are registered', () => {
    broadcastSyncService.init();

    const incomingEvent: SystemEvent = {
      id: 'pre-mount-evt',
      timestamp: '14:43:43 ICT',
      type: 'COMPLIANCE',
      title: 'ETDA Sec 26 Anchor',
      description: 'PQC Non-repudiation',
      severity: 'success',
      status: 'VERIFIED',
    };

    // Message arrives before any onSystemEvent handler was attached
    const incomingMessage: MessageEvent<BroadcastSyncMessage> = {
      data: {
        type: 'SYSTEM_EVENT_ADDED',
        sourceTabId: 'other-tab-789',
        timestamp: Date.now(),
        payload: {
          event: incomingEvent,
        },
      },
    } as any;

    mockChannelInstance.onmessage(incomingMessage);

    // Now a subscriber attaches
    const subscriber = vi.fn();
    const unsub = broadcastSyncService.onSystemEvent(subscriber);

    // The buffered event must be replayed to the subscriber
    expect(subscriber).toHaveBeenCalledWith(incomingEvent);

    unsub();
  });

  it('responds to SYNC_PING with SYNC_PONG if authoritative state exists', () => {
    broadcastSyncService.init();
    broadcastSyncService.broadcastGlobalLockState({ isMonochromeMode: true });

    // Another tab pings
    const pingMessage: MessageEvent<BroadcastSyncMessage> = {
      data: {
        type: 'SYNC_PING',
        sourceTabId: 'tab_newly_opened',
        timestamp: Date.now(),
        payload: {},
      },
    } as any;

    mockChannelInstance.onmessage(pingMessage);

    // Established tab should respond with SYNC_PONG
    expect(postedMessages.some((m) => m.type === 'SYNC_PONG' && m.payload.lockState?.isMonochromeMode === true)).toBe(true);
  });
});
