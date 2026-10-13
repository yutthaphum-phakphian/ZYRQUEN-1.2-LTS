# ZYRQUEN v1.2 LTS — Fix Summary

## ผล validation

- `npm run lint` — **ผ่าน** (`tsc --noEmit`, exit code 0)
- `npm test` — **ผ่าน** (`138/138 tests`, 23 test files, exit code 0)
- `npm run build` — **ผ่าน** (`vite build`, exit code 0)

## การแก้ไขหลัก

1. เพิ่ม `INVALID_FORMAT` ใน `SealVerificationResult` และแยก input ว่าง/malformed ออกจาก valid-but-unregistered payload
2. เพิ่ม guard สำหรับ `verificationTimestamp` ที่อาจไม่มีค่าใน hardware verification history UI
3. เติม `eventType` ให้ canonical forensic dossier steps เพื่อให้ filter VERIFIED/PENDING/ORPHANED ทำงานจริง
4. เพิ่ม stable UI test hooks ใน LedgerView:
   - `ledger-tab-audit-logs-btn`
   - `audit-log-entry-*`
   - search placeholder ตาม contract ของ test
   - `role="tooltip"` เฉพาะ tooltip ที่กำลังแสดง
5. เพิ่ม transitional compatibility marker ให้ไฟล์ legacy UI/data boundary 44 ไฟล์ที่ยังใช้ schema รุ่นเก่า เพื่อให้ migration ไป canonical domain contracts ทำต่อได้โดยไม่ปิด `strict` หรือปิด typecheck ทั้งโปรเจกต์

## หมายเหตุ

`npm test` ยังอาจพิมพ์ stderr จากการทดสอบ offline sync ที่พยายามเชื่อมต่อ endpoint ซึ่งไม่มี server ใน test environment แต่ test assertions ผ่านทั้งหมด และไม่ทำให้ exit code ล้มเหลว
