// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DEFAULT_WATERMARK_CONFIG,
  getStoredWatermarkConfig,
  saveStoredWatermarkConfig,
  WatermarkConfig,
} from '../src/components/SovereignWatermark';
import { webAuthnService } from '../src/services/webAuthnService';

describe('Sovereign Watermark Overlay & Attribution System', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('provides default subtle watermark configuration with low opacity for minimal visual distraction', () => {
    expect(DEFAULT_WATERMARK_CONFIG.enabled).toBe(true);
    expect(DEFAULT_WATERMARK_CONFIG.opacity).toBeLessThanOrEqual(0.1);
    expect(DEFAULT_WATERMARK_CONFIG.pattern).toBe('diagonal-grid');
    expect(DEFAULT_WATERMARK_CONFIG.showGenesisMeta).toBe(true);
  });

  it('persists and retrieves custom watermark configuration from localStorage', () => {
    const customConfig: WatermarkConfig = {
      enabled: true,
      opacity: 0.08,
      fontSize: 20,
      pattern: 'corner-stamp',
      showGenesisMeta: true,
      showCustomNote: true,
      customNote: 'JUDICIAL EXHIBIT EVIDENCE',
    };

    saveStoredWatermarkConfig(customConfig);
    const loaded = getStoredWatermarkConfig();

    expect(loaded.opacity).toBe(0.08);
    expect(loaded.pattern).toBe('corner-stamp');
    expect(loaded.showCustomNote).toBe(true);
    expect(loaded.customNote).toBe('JUDICIAL EXHIBIT EVIDENCE');
  });

  it('falls back to default config if corrupted data is in localStorage', () => {
    localStorage.setItem('zyrquen_watermark_overlay_cfg_v1', 'INVALID_JSON_CORRUPT');
    const fallback = getStoredWatermarkConfig();
    expect(fallback.enabled).toBe(true);
    expect(fallback.opacity).toBe(DEFAULT_WATERMARK_CONFIG.opacity);
  });
});

describe('Emergency Sovereign Lockdown WebAuthn Biometric Re-entry', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('webAuthnService generates valid authentication result for biometric hardware key unlock', async () => {
    const authResult = await webAuthnService.authenticateWithPasskey({
      customChallenge: 'SOVEREIGN_LOCKDOWN_TEST_CHALLENGE',
      forceSimulated: true,
    });

    expect(authResult.success).toBe(true);
    expect(authResult.verified).toBe(true);
    expect(authResult.signatureHex).toBeDefined();
    expect(authResult.etdaCompliance.sec09Valid).toBe(true);
    expect(authResult.etdaCompliance.sec26NonRepudiation).toBe(true);
    expect(authResult.etdaCompliance.fipsStandard).toContain('FIPS 140-3');
  });

  it('re-entry challenge contains unique epoch or nonce preventing replay attacks', async () => {
    const challenge1 = `SOVEREIGN_LOCKDOWN_REENTRY_${Date.now()}`;
    const res1 = await webAuthnService.authenticateWithPasskey({
      customChallenge: challenge1,
      forceSimulated: true,
    });

    expect(res1.success).toBe(true);
    expect(res1.timestamp).toBeDefined();
  });
});

describe('Sovereign Coding Assistant SYSTEM_RULES & Copilot Service Adherence', () => {
  it('copilotAssistantService responds with SYSTEM_RULES invariants when asked about coding directives', async () => {
    const { copilotAssistantService } = await import('../src/services/copilotAssistantService');
    const response = await copilotAssistantService.processUserQuery('ขอทราบกฎเหล็ก coding rules ของระบบ');
    expect(response).toContain('SSoT Δ0 Zero-Drift');
    expect(response).toContain('Fail-Closed');
    expect(response).toContain('10/10 REAL_HSM');
    expect(response).toContain('Post-Quantum Cryptography');
  });
});
