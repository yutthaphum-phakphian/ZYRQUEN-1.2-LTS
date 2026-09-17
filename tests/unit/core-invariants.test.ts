import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CH06_SAFETY_STATUS,
  ZYRQUEN_ENTROPY_CONFIG,
  shouldTriggerCriticalAlert,
} from '../../src/utils/circuitBreakerSafety';
import { P0FrozenCoreGuard } from '../../src/utils/p0FrozenCoreGuard';
import {
  CANONICAL_BLOCK_HEIGHT,
  CANONICAL_SEAL_COUNT,
  MERKLE_ROOT_BASELINE,
  WriteFirewallEngine,
  isCanonicalWriteProtected,
  verifyWriteFirewallFailClosedGate,
} from '../../src/utils/writeFirewall';

test('circuit breaker uses the configured 15,000 KBps critical threshold', () => {
  assert.equal(ZYRQUEN_ENTROPY_CONFIG.criticalThresholdKBps, 15000);
  assert.equal(shouldTriggerCriticalAlert(15000), false);
  assert.equal(shouldTriggerCriticalAlert(15001), true);
  assert.equal(CH06_SAFETY_STATUS.verificationGate, 'ACTIVE_GUARD');
});

test('circuit breaker suppresses an authorized TRNG surge', () => {
  assert.equal(shouldTriggerCriticalAlert(14500), false);
  assert.equal(shouldTriggerCriticalAlert(14900), false);
});

test('frozen core exposes the canonical immutable state', () => {
  const state = P0FrozenCoreGuard.getCanonicalState();

  assert.equal(state.version, 'v1.2 LTS');
  assert.equal(state.canonicalRoot, MERKLE_ROOT_BASELINE);
  assert.equal(state.blockHeight, CANONICAL_BLOCK_HEIGHT);
  assert.equal(state.canonicalSeals, CANONICAL_SEAL_COUNT);
  assert.equal(state.ssotMutation, 0);
  assert.equal(state.writeAuthority, 'NONE');
  assert.equal(state.isFrozen, true);
  assert.equal(Object.isFrozen(state), true);
});

test('observed seals remain quarantined and separate from canonical state', () => {
  const observed = P0FrozenCoreGuard.getObservedStreamState();
  const quarantine = P0FrozenCoreGuard.getQuarantineItems();

  assert.equal(observed.classification, 'OBSERVED / NON-CANONICAL');
  assert.equal(observed.status, 'QUARANTINED');
  assert.equal(observed.promotionState, 'BLOCKED');
  assert.equal(quarantine.length, 5);
  assert.deepEqual(
    quarantine.map((item) => item.sealNumber),
    [14903, 14904, 14905, 14906, 14907],
  );
  assert.ok(quarantine.every((item) => item.executionState === 'NOT_EXECUTED'));
});

test('write firewall rejects canonical mutations with zero mutation delta', () => {
  const result = WriteFirewallEngine.writeFirewall({
    targetProperty: 'canonicalRoot',
    requestedValue: 'tampered-root',
    actor: 'UNIT_TEST',
    origin: 'unit-test://write-firewall',
  });

  assert.equal(result.allowed, false);
  assert.equal(result.rejected, true);
  assert.equal(result.mutationDelta, 0);
  assert.equal(result.auditRecord.status, 'REJECTED_FAIL_CLOSED');
  assert.equal(result.auditRecord.canonicalValue, MERKLE_ROOT_BASELINE);
  assert.match(result.reason, /blocked illegal mutation attempt/i);
});

test('write firewall protects canonical field names and passes its fail-closed suite', () => {
  for (const property of ['canonicalSeals', 'merkleRoot', 'blockHeight', 'ssotMutation', 'isFrozen']) {
    assert.equal(isCanonicalWriteProtected(property), true, property);
  }
  assert.equal(isCanonicalWriteProtected('displayLabel'), false);

  const verification = verifyWriteFirewallFailClosedGate();
  assert.equal(verification.allPassed, true);
  assert.equal(verification.testResults.length, 5);
  assert.ok(verification.testResults.every((result) => result.mutationDelta === 0));
});
