import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  formatSealPayload,
  generateSealQrCodeDataUrl,
  parseSealQrPayload,
  SealQrPayload,
} from '../../src/utils/sealQrCode';

describe('Seal QR Code Utility Suite', () => {
  const samplePayload: SealQrPayload = {
    sealId: 'SEAL-14902',
    blockHeight: 849202,
    merkleRoot: '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    pqcAlgorithm: 'Dilithium-5',
    hsmQuorum: '10/10 REAL_HSM',
    timestamp: '2026-09-24T12:00:00.000Z',
    signature: 'SIG_PQC_DILITHIUM-5_10/10_RATIFIED',
  };

  it('should format payload into deterministic JSON string', () => {
    const formatted = formatSealPayload(samplePayload);
    assert.ok(formatted.includes('SEAL-14902'), 'Should contain seal ID');
    assert.ok(
      formatted.includes('0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68'),
      'Should contain Merkle root'
    );
  });

  it('should generate a valid data URL base64 image', async () => {
    const dataUrl = await generateSealQrCodeDataUrl(samplePayload);
    assert.ok(/^data:image\/png;base64,/.test(dataUrl), 'Should match png base64 data URL');
  });

  it('should parse valid seal QR string', () => {
    const formatted = formatSealPayload(samplePayload);
    const parsed = parseSealQrPayload(formatted);
    assert.notEqual(parsed, null, 'Parsed payload should not be null');
    assert.equal(parsed?.sealId, 'SEAL-14902');
    assert.equal(parsed?.blockHeight, 849202);
  });

  it('should return null for invalid QR string', () => {
    const parsed = parseSealQrPayload('invalid non-json text');
    assert.equal(parsed, null, 'Invalid payload should return null');
  });
});
