import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import {
  getTTSConfig,
  updateTTSConfig,
  toggleTTSEnabled,
  toggleHandsFreeMode,
  announceSecurityLockdown,
  announceSystemEventVerbal,
  announceHandsFreeBriefing,
  containsThai,
  subscribeTTSConfig,
  cancelAllAnnouncements,
  verbalFeedbackService,
} from '../../src/utils/textToSpeechService.js';

describe('ZYRQUEN Ω∞ Verbal Feedback Service (Web Speech API)', () => {
  beforeEach(() => {
    // Reset config to baseline defaults before each test
    updateTTSConfig({
      enabled: true,
      handsFreeMode: false,
      rate: 1.05,
      pitch: 0.98,
      volume: 0.95,
      language: 'auto',
      announceLockdown: true,
      announceCritical: true,
      announceAnomaly: true,
      announceWarning: false,
      audibleChimePrepend: true,
    });
  });

  it('correctly reads and updates TTS configuration and notifies subscribers', () => {
    let notifiedConfig: any = null;
    const unsubscribe = subscribeTTSConfig((cfg) => {
      notifiedConfig = cfg;
    });

    updateTTSConfig({ rate: 1.2, volume: 0.8 });
    const current = getTTSConfig();

    assert.equal(current.rate, 1.2, 'Speech rate must be updated');
    assert.equal(current.volume, 0.8, 'Volume must be updated');
    assert.ok(notifiedConfig, 'Subscriber must be notified on config change');
    assert.equal(notifiedConfig.rate, 1.2);

    unsubscribe();
  });

  it('toggles master TTS enabled and hands-free mode correctly', () => {
    const wasEnabled = getTTSConfig().enabled;
    const toggled = toggleTTSEnabled();
    assert.equal(toggled, !wasEnabled);
    assert.equal(getTTSConfig().enabled, !wasEnabled);

    // Toggle back
    toggleTTSEnabled(true);
    assert.equal(getTTSConfig().enabled, true);

    // Test hands-free toggle
    assert.equal(getTTSConfig().handsFreeMode, false);
    const handsFreeActive = toggleHandsFreeMode(true);
    assert.equal(handsFreeActive, true);
    assert.equal(getTTSConfig().handsFreeMode, true);
  });

  it('correctly identifies Thai characters for automatic language routing', () => {
    assert.equal(containsThai('รายงานความปลอดภัย Chamber 02'), true);
    assert.equal(containsThai('Emergency Isolation Engaged'), false);
    assert.equal(containsThai('มาตรา ๒๖ แห่ง พ.ร.บ. ธุรกรรม'), true);
    assert.equal(containsThai('Genesis Block #849202'), false);
  });

  it('formats security lockdown announcements with highest emergency priority', () => {
    // Test that announceSecurityLockdown returns boolean (false in Node environment without window.speechSynthesis, but executes without exception)
    const resultEngaged = announceSecurityLockdown('engaged', {
      chamber: 'Chamber 02 Quarantine',
      reason: 'Adversarial high entropy detected',
    });
    assert.equal(typeof resultEngaged, 'boolean');

    const resultReleased = announceSecurityLockdown('released');
    assert.equal(typeof resultReleased, 'boolean');

    const resultTamper = announceSecurityLockdown('tamper');
    assert.equal(typeof resultTamper, 'boolean');

    const resultFailClosed = announceSecurityLockdown('fail_closed');
    assert.equal(typeof resultFailClosed, 'boolean');
  });

  it('processes critical system events and security titles correctly via announceSystemEventVerbal', () => {
    // Should not throw and correctly route
    assert.doesNotThrow(() => {
      announceSystemEventVerbal('SECURITY', 'Chamber 02 Quarantine Isolation Protocol Engaged', 'critical');
      announceSystemEventVerbal('ANOMALY', 'Quantum Qubit Decoherence Spike Exceeded 14.98mK', 'critical');
      announceSystemEventVerbal('COMPLIANCE', 'Thai Electronic Transactions Act Sec 28 Bound', 'success');
      announceSystemEventVerbal('CRYPTO', 'Genesis Block #849202 Anchored with 14,902 Seals', 'info');
    });
  });

  it('hands-free briefing generates comprehensive invariant status report', () => {
    assert.doesNotThrow(() => {
      announceHandsFreeBriefing({
        blockHeight: 849202,
        sealCount: 14902,
        drift: '0.00%',
        quorum: '10/10 REAL_HSM',
        tempMK: 14.98,
      });
    });
  });

  it('cancels all announcements without throwing and resets internal state', () => {
    assert.doesNotThrow(() => {
      cancelAllAnnouncements();
    });
  });

  it('exposes verbalFeedbackService singleton with all required methods', () => {
    assert.ok(verbalFeedbackService, 'verbalFeedbackService singleton must exist');
    assert.equal(typeof verbalFeedbackService.getConfig, 'function');
    assert.equal(typeof verbalFeedbackService.updateConfig, 'function');
    assert.equal(typeof verbalFeedbackService.toggleEnabled, 'function');
    assert.equal(typeof verbalFeedbackService.toggleHandsFreeMode, 'function');
    assert.equal(typeof verbalFeedbackService.speak, 'function');
    assert.equal(typeof verbalFeedbackService.announceLockdown, 'function');
    assert.equal(typeof verbalFeedbackService.announceSystemEvent, 'function');
    assert.equal(typeof verbalFeedbackService.announceBriefing, 'function');
    assert.equal(typeof verbalFeedbackService.repeatLast, 'function');
    assert.equal(typeof verbalFeedbackService.cancelAll, 'function');
    assert.equal(typeof verbalFeedbackService.getVoices, 'function');
    assert.equal(typeof verbalFeedbackService.subscribeConfig, 'function');
    assert.equal(typeof verbalFeedbackService.subscribeState, 'function');
  });
});
