# Developer Repair Loop — Reality Report

## Capability
ระบบสามารถเดินจาก **verification failure → explicit repair → real workspace mutation → durable transaction → verification again** โดยมี worker fence, approval, bounded attempts และ audit hash

## สิ่งที่เพิ่ม
- `server/developerRepairLoop.ts`
  - สถานะ `COMPLETED / REPAIR_REQUIRED / APPROVAL_REQUIRED / BLOCKED / FAILED`
  - ตรวจ worker fence ก่อนทุก repair attempt
  - รับเฉพาะ repair operations ที่ระบุชัดเจน (`CREATE/UPDATE/DELETE`)
  - จำกัด repair operations ไม่เกิน 100 รายการ
  - จำกัด retry สูงสุด 3 attempts
  - ใช้ expected hash ป้องกันแก้ไฟล์ที่เปลี่ยนไปแล้ว
  - เขียน mutation ลง workspace จริงภายใต้ `workspaceRoot`
  - ใช้ durable mission transaction + fenced workspace effect เป็นหลักฐาน
  - verify ซ้ำหลัง repair
  - audit SHA-256
  - mission event `DEVELOPER_REPAIR_APPLIED`
- `server.ts`
  - `POST /api/runtime/developer-workflow/repair`
- `tests/milestone-developer-repair-loop.test.ts`

## Security / correctness boundary
- ไม่มีการเดา patch เอง และไม่สร้างโค้ดซ่อมแบบไม่มีคำสั่งที่อนุมัติ
- repair ต้องมี `missionId + workerId + leaseId`
- mutation ต้องผ่าน approval
- target ห้าม absolute path / `..` traversal
- UPDATE/DELETE ต้องมี target จริง
- CREATE ต้องไม่มี target เดิม
- expected hash ตรวจทั้งก่อน mutation
- verification ใช้คำสั่งจริงผ่าน developer tool runtime
- retry bounded และหยุดเมื่อยังไม่ผ่าน

## Validation
- `node --experimental-strip-types tests/milestone-developer-repair-loop.test.ts` → PASS
- scenario ที่ทดสอบ:
  1. verification ล้มเหลว → `REPAIR_REQUIRED`
  2. ส่ง approved UPDATE ของ `package.json`
  3. mutation ถูกเขียนลง workspace จริง
  4. durable transaction/effect ถูกบันทึก
  5. verification รอบใหม่ผ่าน → `COMPLETED`
  6. audit hash เป็น SHA-256 64 hex

## Reality boundary
การ mutation ระหว่าง filesystem จริงกับ durable workspace เป็นสอง persistence surfaces ที่เชื่อมด้วย repair event/transaction evidence; ไม่ควรเรียกว่า distributed atomic commit ระหว่างสองระบบจนกว่าจะมี coordinator สำหรับ physical filesystem โดยตรง

## Next capability
ขั้นถัดไปควรยกระดับจาก **explicit repair operations** ไปเป็น **bounded Repair Planner** ที่สร้าง repair plan จาก failure evidence แบบ deterministic/ตรวจสอบได้ ก่อนเข้าสู่ approval และ mutation โดยยังคงไม่ให้ agent เขียน arbitrary code โดยไร้ guardrails
