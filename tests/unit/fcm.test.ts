import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  fcmNotificationService,
  ANDROID_16_NOTIFICATION_CHANNELS,
  FcmNotificationService,
} from '../../src/services/fcmNotificationService';

describe('FCM Android 16.0+ Push Notification Module & Token Lifecycle', () => {
  test('Android 16.0+ Notification Channels are properly configured with importance and priority', () => {
    const secChannel = ANDROID_16_NOTIFICATION_CHANNELS.SECURITY_ALERTS;
    assert.equal(secChannel.id, 'zyrquen_security_alerts');
    assert.equal(secChannel.importance, 'URGENT');
    assert.equal(secChannel.bypassDnd, true);
    assert.equal(secChannel.lockscreenVisibility, 'PUBLIC');

    const telChannel = ANDROID_16_NOTIFICATION_CHANNELS.TELEMETRY_DRIFT;
    assert.equal(telChannel.id, 'zyrquen_telemetry_drift');
    assert.equal(telChannel.importance, 'HIGH');
    assert.equal(telChannel.bypassDnd, false);

    const compChannel = ANDROID_16_NOTIFICATION_CHANNELS.COMPLIANCE_AUDIT;
    assert.equal(compChannel.id, 'zyrquen_compliance_audit');
    assert.equal(compChannel.importance, 'DEFAULT');
  });

  test('builds compliant Android 16.0+ FCM HTTP v1 payload for Security Alerts', () => {
    const payload = fcmNotificationService.buildAndroid16Payload(
      'SECURITY',
      'Chamber 02 Quarantine Engaged',
      'Risk 0.94 anomaly detected. Fail-closed lockdown active.',
      {
        sealId: '14902',
        riskScore: '0.94',
        action: 'ZEROIZATION_ENGAGED',
      }
    );

    assert.equal(payload.message.notification.title, 'Chamber 02 Quarantine Engaged');
    assert.equal(payload.message.android.priority, 'high');
    assert.equal(payload.message.android.notification.channelId, 'zyrquen_security_alerts');
    assert.equal(payload.message.android.notification.notificationPriority, 'PRIORITY_MAX');
    assert.equal(payload.message.android.notification.visibility, 'PUBLIC');
    assert.equal(payload.message.data.genesisBlock, '849202');
    assert.equal(payload.message.data.merkleRoot, '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68');
    assert.equal(payload.message.data.sealId, '14902');
    assert.equal(payload.message.data.riskScore, '0.94');
  });

  test('manages client-side token lifecycle: register, rotate/refresh, and revoke', () => {
    const testToken = 'fcm_test_tok_baklava_unit_test_001';
    const reg = fcmNotificationService.registerToken({
      token: testToken,
      deviceId: 'dev-unit-test-pixel9',
      platform: 'Android 16.0+ (Baklava / API 36)',
      clientVersion: '1.2.0-LTS',
      registeredAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      tokenStatus: 'ACTIVE',
      subscribedChannels: ['zyrquen_security_alerts'],
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });

    assert.equal(reg.tokenStatus, 'ACTIVE');
    assert.equal(reg.token, testToken);

    // Refresh / Rotate token
    const rotatedToken = 'fcm_test_tok_baklava_unit_test_002_rotated';
    const refreshed = fcmNotificationService.refreshToken(testToken, rotatedToken);
    assert.ok(refreshed);
    assert.equal(refreshed.token, rotatedToken);
    assert.equal(refreshed.tokenStatus, 'REFRESHED');

    // Revoke token
    const revoked = fcmNotificationService.revokeToken(rotatedToken);
    assert.equal(revoked, true);

    const activeList = fcmNotificationService.getActiveTokens();
    const found = activeList.find((t) => t.token === rotatedToken);
    assert.equal(found, undefined); // Should no longer be active
  });

  test('dispatches push alert to registered Android 16.0+ devices with delivery receipt', async () => {
    // Register active test device
    const testToken = `fcm_test_push_${Date.now()}`;
    fcmNotificationService.registerToken({
      token: testToken,
      deviceId: 'dev-unit-push-target',
      platform: 'Android 16.0+ (API 36)',
      clientVersion: '1.2.0-LTS',
      registeredAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      tokenStatus: 'ACTIVE',
      subscribedChannels: ['zyrquen_security_alerts'],
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });

    const receipts = await fcmNotificationService.dispatchPush(
      'SECURITY',
      'Unit Test Alert',
      'Test delivery across Android 16.0+ cluster',
      { testCase: 'true' }
    );

    assert.ok(receipts.length > 0);
    const targetReceipt = receipts.find((r) => r.targetToken === testToken);
    assert.ok(targetReceipt);
    assert.equal(targetReceipt.status, 'DELIVERED_200_OK');
    assert.equal(targetReceipt.channelId, 'zyrquen_security_alerts');
    assert.ok(targetReceipt.latencyMs > 0);
  });
});
