import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  bufferToBase64Url,
  base64UrlToBuffer,
  bufferToHex,
  hexToBuffer,
  webAuthnService,
} from '../../src/services/webAuthnService';

describe('WebAuthn Biometric & Hardware Key Security Service', () => {
  test('bufferToBase64Url and base64UrlToBuffer handle bidirectional encoding correctly', () => {
    const originalText = 'ZYRQUEN_SOVEREIGN_WEBAUTHN_CHALLENGE_#849202';
    const encoder = new TextEncoder();
    const originalBuffer = encoder.encode(originalText).buffer;

    const base64Url = bufferToBase64Url(originalBuffer);
    assert.ok(typeof base64Url === 'string');
    assert.ok(!base64Url.includes('+'));
    assert.ok(!base64Url.includes('/'));
    assert.ok(!base64Url.includes('='));

    const decodedBuffer = base64UrlToBuffer(base64Url);
    const decoder = new TextDecoder();
    const decodedText = decoder.decode(decodedBuffer);

    assert.equal(decodedText, originalText);
  });

  test('bufferToHex and hexToBuffer convert byte arrays accurately', () => {
    const hexInput = '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68';
    const buffer = hexToBuffer(hexInput);
    assert.equal(buffer.byteLength, 32);

    const reconstructedHex = bufferToHex(buffer);
    assert.equal(reconstructedHex.toLowerCase(), hexInput.toLowerCase());
  });

  test('generates simulated enclave credentials when navigator.credentials is unavailable in Node environment', async () => {
    const regResult = await webAuthnService.registerPasskey({
      userName: 'EP-SOVEREIGN-01',
      userDisplayName: 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
      authenticatorType: 'platform',
      forceSimulated: true,
    });

    assert.equal(regResult.success, true);
    assert.ok(regResult.credential);
    assert.equal(regResult.credential?.userName, 'EP-SOVEREIGN-01');
    assert.equal(regResult.credential?.fipsLevel, 'FIPS 140-3 Level 4');
    assert.ok(regResult.credential?.rawIdHex);
  });

  test('authenticates with passkey and validates ETDA Sec 9 and Sec 26 compliance', async () => {
    const authResult = await webAuthnService.authenticateWithPasskey({
      customChallenge: 'ETDA_SEC_26_CHALLENGE_NON_REPUDIATION',
      forceSimulated: true,
    });

    assert.equal(authResult.success, true);
    assert.equal(authResult.verified, true);
    assert.ok(authResult.signatureHex.startsWith('0x'));
    assert.equal(authResult.etdaCompliance.sec09Valid, true);
    assert.equal(authResult.etdaCompliance.sec26NonRepudiation, true);
  });

  test('signs transaction hash with biometric hardware key credentials', async () => {
    const txPayload = JSON.stringify({
      decree: 'SOVEREIGN_BAHT_RESERVE_EXPANSION',
      amount: '1490200000.00',
      currency: 'THB',
      block: 849202,
      signers: ['#EP-SOVEREIGN-01'],
    });

    const signatureResult = await webAuthnService.signTransactionWithHardwareKey(txPayload);

    assert.ok(signatureResult.txHash.startsWith('0x'));
    assert.ok(signatureResult.signatureDigest.startsWith('0x'));
    assert.equal(signatureResult.verified, true);
    assert.equal(signatureResult.fipsStandard, 'FIPS 140-3 Level 4');
  });
});
