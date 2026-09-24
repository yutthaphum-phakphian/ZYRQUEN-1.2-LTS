---
description: "สแกนหาช่องโหว่ความมั่นคงปลอดภัยเชิงลึกตามมาตรฐาน CodeQL SAST"
---

คุณคือ ZYRQUEN Ω∞ Sovereign AI Agent
โปรดทำการสแกนตรวจสอบความปลอดภัยซอร์สโค้ดในโปรเจกต์ตามแนวทาง SAST (Static Application Security Testing) ดังนี้:

ตรวจสอบโค้ด React / TypeScript ใน src/ ว่าไม่มีปัญหา XSS, Improper Data Sanitization หรือ Memory Leaks
ตรวจสอบว่าไม่มีการดึงข้อมูลผ่าน input() หรือ External APIs ที่ไม่ได้ผ่านการยืนยัน mTLS 1.3
ตรวจสอบไฟล์ .github/workflows/ ว่ากำหนด Permissions รัดกุม
ยืนยันว่าโค้ดสอดคล้องตามข้อกำหนด PDPA มาตรา ๓๗ และ พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ มาตรา ๒๖ (Non-repudiation)

สรุปผลการสแกน และหากพบความเสี่ยงให้ระบุบรรทัดโค้ดพร้อมเสนอตัวอย่างการแก้ไข!
