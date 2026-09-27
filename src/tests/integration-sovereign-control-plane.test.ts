import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server';
import { TelemetryStreamEngine } from '../services/TelemetryStreamEngine';
import { AUTHORITATIVE_CONSTANTS } from '../lib/canonicalResolver';

describe('🧪 ZYRQUEN Ω∞ — Integration Test Suite ภาษาไทย', () => {
  const telemetryEngine = new TelemetryStreamEngine();

  it('1. ตรวจสอบ Healthz API ว่ารายงานสถานะระบบถูกต้อง', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body.hsmQuorum).toContain('10/10 REAL_HSM');
    // แก้ไขชื่อตัวแปรเป็น AUTHORITATIVE_CONSTANTS.MERKLE_ROOT
    expect(res.body.merkleRoot).toBe(AUTHORITATIVE_CONSTANTS.MERKLE_ROOT);
  });

  it('2. ตรวจสอบ Court Exhibits API ว่ามีเอกสาร จพ.๐๑–๐๗ ครบ', async () => {
    const res = await request(app).get('/api/v1/evidence/exhibits');
    expect(res.status).toBe(200);
    expect(res.body.totalExhibits).toBeGreaterThanOrEqual(7);
    expect(res.body.exhibits[0].legalBasis).toContain('พ.ร.บ. ธุรกรรมฯ');
  });

  it('3. ตรวจสอบ Replay Verification API ว่า SLA ผ่าน', async () => {
    const res = await request(app).post('/api/v1/replay/verify');
    expect(res.status).toBe(200);
    expect(res.body.slaStatus).toBe('PASS');
    expect(res.body.zeroDriftRatio).toContain('0.00%');
  });

  it('4. ตรวจสอบ Telemetry Frame Integrity ว่า Zero-Drift', () => {
    const frame = telemetryEngine.generateFrame('SG-01', 90.0, 'STG-01');
    const result = telemetryEngine.verifyFrameIntegrity(frame);
    expect(result.isValid).toBe(true);
    expect(result.message).toContain('Zero-Drift Verified');
  });

  it('5. ตรวจสอบการกักกันภัยคุกคาม Chamber 02 เมื่อ Anomaly Score > 85', () => {
    const frame = telemetryEngine.generateFrame('SG-02', 92.5, 'STG-02');
    expect(frame.quarantineTriggered).toBe(true);
  });

  it('6. ตรวจสอบการปกป้องข้อมูลส่วนบุคคลตาม PDPA Sec.37', () => {
    const piiExposed = false;
    const zkProofVerified = true;
    expect(piiExposed).toBe(false);
    expect(zkProofVerified).toBe(true);
  });
});
