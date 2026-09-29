/**
 * ZYRQUEN Ω∞ — Offline Audit Sync Service & Error Logging Unit Tests
 * 
 * Verifies queueing, auto-sync timers, robust error classification,
 * user feedback generation, and non-disruptive state notifications.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  offlineAuditSyncService,
  QueuedAuditEvent,
  SyncErrorInfo,
} from '../src/services/offlineAuditSyncService';

describe('offlineAuditSyncService (Error Logging & Feedback States)', () => {
  beforeEach(() => {
    offlineAuditSyncService.clearQueue();
    offlineAuditSyncService.clearSyncError();
  });

  afterEach(() => {
    offlineAuditSyncService.clearQueue();
    offlineAuditSyncService.clearSyncError();
  });

  it('enqueues audit events with deterministic metadata and auto-increments queue count', () => {
    expect(offlineAuditSyncService.getQueueCount()).toBe(0);

    const item = offlineAuditSyncService.enqueueEvent({
      type: 'LEGAL_AUDIT',
      title: 'Court Evidentiary Anchor',
      description: 'Recorded WORM evidence for Chamber 01',
      severity: 'info',
      statuteRef: 'ETDA Section 26',
    });

    expect(item.id).toMatch(/^offline-audit-/);
    expect(item.title).toBe('Court Evidentiary Anchor');
    expect(item.retryCount).toBe(0);
    expect(offlineAuditSyncService.getQueueCount()).toBe(1);

    const queue = offlineAuditSyncService.getQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].id).toBe(item.id);
  });

  it('clears queue properly and resets queue listeners', () => {
    offlineAuditSyncService.enqueueEvent({
      type: 'SECURITY',
      title: 'HSM Key Check',
      description: 'Quorum check slot 01',
    });
    expect(offlineAuditSyncService.getQueueCount()).toBe(1);

    const clearedCount = offlineAuditSyncService.clearQueue();
    expect(clearedCount).toBe(1);
    expect(offlineAuditSyncService.getQueueCount()).toBe(0);
  });

  it('subscribes to queue updates correctly', () => {
    let notifiedCount = -1;
    const unsub = offlineAuditSyncService.subscribe((count) => {
      notifiedCount = count;
    });

    expect(notifiedCount).toBe(0);

    offlineAuditSyncService.enqueueEvent({
      type: 'AUDIT',
      title: 'Test Event',
      description: 'Description',
    });

    expect(notifiedCount).toBe(1);
    unsub();
  });

  it('provides pending threshold getter/setter and validation limits', () => {
    offlineAuditSyncService.setPendingThreshold(75);
    expect(offlineAuditSyncService.getPendingThreshold()).toBe(75);

    // Clamps minimum to 5
    offlineAuditSyncService.setPendingThreshold(2);
    expect(offlineAuditSyncService.getPendingThreshold()).toBe(5);

    // Clamps maximum to 500
    offlineAuditSyncService.setPendingThreshold(999);
    expect(offlineAuditSyncService.getPendingThreshold()).toBe(500);

    // Reset to default
    offlineAuditSyncService.setPendingThreshold(50);
  });

  it('provides comprehensive health status summary', () => {
    const health = offlineAuditSyncService.getSyncHealthStatus();
    expect(typeof health.isOnline).toBe('boolean');
    expect(typeof health.isSyncing).toBe('boolean');
    expect(typeof health.pendingCount).toBe('number');
    expect(typeof health.autoSyncEnabled).toBe('boolean');
    expect(Array.isArray(offlineAuditSyncService.getSyncHistory())).toBe(true);
  });

  it('notifies error subscribers when sync fails and generates non-disruptive feedback', async () => {
    let lastReceivedError: SyncErrorInfo | null = null;
    const unsub = offlineAuditSyncService.subscribeSyncError((err) => {
      lastReceivedError = err;
    });

    // Enqueue an event
    offlineAuditSyncService.enqueueEvent({
      type: 'TEST_EVENT',
      title: 'Sync Fail Test',
      description: 'Testing error capture',
    });

    // Mock fetch rejection
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error('Network connection refused (ECONNREFUSED)'));

    try {
      const result = await offlineAuditSyncService.flushQueue(false);
      expect(result.success).toBe(false);
      expect(result.error).toContain('ECONNREFUSED');
      expect(result.traceId).toBeDefined();

      const syncErr = offlineAuditSyncService.getLastSyncError();
      expect(syncErr).not.toBeNull();
      expect(syncErr?.stage).toBe('NETWORK');
      expect(syncErr?.traceId).toMatch(/^TRC-SYNC-ERR-/);
      expect(syncErr?.userFeedbackMessage).toContain('Network transport error');
      expect(syncErr?.pendingCount).toBe(1);

      // Verify subscriber was notified
      expect(lastReceivedError).not.toBeNull();
      expect(lastReceivedError?.traceId).toBe(syncErr?.traceId);

      // Verify error history
      const history = offlineAuditSyncService.getSyncErrorHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].traceId).toBe(syncErr?.traceId);
    } finally {
      global.fetch = originalFetch;
      unsub();
    }
  });

  it('clears sync error on manual clear and notifies subscribers', () => {
    let lastReceivedError: SyncErrorInfo | null = {
      traceId: 'TRC-1',
      message: 'err',
      stage: 'OFFLINE',
      failedAt: new Date().toISOString(),
      pendingCount: 0,
      retryCount: 0,
      userFeedbackMessage: 'offline',
    };

    const unsub = offlineAuditSyncService.subscribeSyncError((err) => {
      lastReceivedError = err;
    });

    offlineAuditSyncService.clearSyncError();
    expect(offlineAuditSyncService.getLastSyncError()).toBeNull();
    expect(lastReceivedError).toBeNull();
    unsub();
  });
});
