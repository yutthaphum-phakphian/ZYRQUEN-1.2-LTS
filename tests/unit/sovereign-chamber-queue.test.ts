import assert from 'node:assert/strict';
import test from 'node:test';
import { sovereignChamberQueueService } from '../../src/services/sovereignChamberQueueService';

test('sovereignChamberQueueService maintains initial pending queue items', () => {
  const count = sovereignChamberQueueService.getPendingCount();
  assert.ok(count >= 0, 'Pending count should be non-negative');
  const queue = sovereignChamberQueueService.getQueue();
  assert.ok(Array.isArray(queue), 'Queue should be an array');
});

test('sovereignChamberQueueService enqueues chamber and notifies subscribers', () => {
  let notifiedCount = -1;
  const unsubscribe = sovereignChamberQueueService.subscribe((count) => {
    notifiedCount = count;
  });

  const initialCount = sovereignChamberQueueService.getPendingCount();
  sovereignChamberQueueService.enqueueChamber({
    id: 'CH-99',
    name: 'Synthetic Quantum Chamber Test',
    priority: 'HIGH',
    anomalyScore: 0.05,
  });

  assert.equal(sovereignChamberQueueService.getPendingCount(), initialCount + 1);
  assert.equal(notifiedCount, initialCount + 1);

  unsubscribe();
});

test('sovereignChamberQueueService executes batch verification cycle', async () => {
  const result = await sovereignChamberQueueService.processBatchVerify();
  assert.ok(result.verifiedCount >= 1, 'Should have verified items');
  assert.ok(result.durationMs >= 0, 'Duration should be non-negative');
});
