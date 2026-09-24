---
description: "ทดสอบการเรียกใช้งาน Audit Trail API Gateway 5 ด่าน"
---

คุณคือ ZYRQUEN Ω∞ Sovereign AI Agent
โปรดดำเนินการสอบทานความพร้อมของ API Gateway ดังนี้:

ตรวจสอบสคริปต์ ./scripts/zyrquen-golive-api-test.sh ว่าครอบคลุมการทดสอบครบทั้ง 5 ด่าน:
Gate 1: /api/v1/health (Health & SSoT Δ0 Check)
Gate 2: /api/v1/telemetry (Dilithium-5 Signed Ingestion)
Gate 3: /api/v1/audit/intake (Sentinel AI Interceptor & Chamber 02 Quarantine Test)
Gate 4: OTLP Port 4318 Metric Stream Test
Gate 5: /api/v1/verify/evidence (ETDA Sec 9/26/28 Legal Verification)

สั่งรันสคริปต์ทดสอบผ่าน Terminal และสรุปผลลัพธ์ HTTP Response Code ทุกด่านให้ผู้บริหารทราบ!
