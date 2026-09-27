# ZYRQUEN Ω — Repository Audit & File Placement Mapping Guide

รายงานการวิเคราะห์โครงสร้าง Repository `ZYRQUEN-1.2-LTS` จากภาพถ่ายหน้าจอระบบ GitHub และข้อแนะนำการจัดระเบียบตำแหน่งไฟล์เพื่อแก้ไขปัญหา Build Failure (CI/CD)

---

## ⚠️ 1. ผลการวินิจฉัยสาเหตุข้อผิดพลาด (Root Cause Analysis)

จากการตรวจสอบสถานะการปรับใช้ในแถบด้านข้าง (Sidebar):
* **สถานะ GitHub Pages:** `❌ การผลิต (Failed)`
* **สาเหตุหลัก:**
  1. **การแปลชื่อไฟล์คอนฟิกระบบเป็นภาษาไทย:** เครื่องมือสร้างระบบ (Build Tools) เช่น Node.js, Vite, TypeScript, Docker และ Vercel จะค้นหาเฉพาะไฟล์สากล (ASCII) เช่น `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html` การตั้งชื่อเป็น `แพคเกจ.เจซอน` หรือ `ไวน์คอนฟิก.ts` ทำให้ระบบหาไฟล์ตั้งค่าไม่พบ
  2. **Web Root Entry Point:** GitHub Pages และ Web Server ค้นหา `index.html` ในโฟลเดอร์ root หรือ `public/` แต่ในระบบปัจจุบันถูกตั้งเป็น `ดรรชนี.html` ในโฟลเดอร์ `สาธารณะ/`

---

## 🔄 2. ตารางแมปปิ้งการเปลี่ยนชื่อและจัดวางไฟล์ (Standardized Directory Mapping)

เพื่อให้ระบบ **CI/CD, GitHub Actions, Vercel และ Web Server** ทำงานได้อย่างถูกต้อง 100% ควรปรับโครงสร้างชื่อโฟลเดอร์และไฟล์ดังนี้:

| ชื่อปัจจุบันใน Repo (ภาษาไทย) | ชื่อมาตรฐานสากล (Standard Structure) | หน้าที่และการจัดวางไฟล์ |
| :--- | :--- | :--- |
| `สาธารณะ/` | `/public/` | เก็บไฟล์ Static assets และ Web Entry Point |
| `สาธารณะ/ดรรชนี.html` | `/public/index.html` | **[ไฟล์ 1]** Apex Command & Chamber 16/17 Control Hub |
| `เอกสาร/` | `/docs/` | เก็บเอกสารทางเทคนิคและรายงานการตรวจสอบ |
| `เอกสาร/` | `/docs/zyrquen_audit_report.md` | **[ไฟล์ 2]** Technical Verification & 22 Gates Audit Report |
| `หลักฐาน/` | `/docs/legal/` | เก็บสำนวนพยานหลักฐานดิจิทัลชั้นศาล (Dossier) |
| `หลักฐาน/` | `/docs/legal/zyrquen_sovereign_audit_report.md` | **[ไฟล์ 3]** Sovereign Master Briefing & Court Dossier |
| `แหล่งที่มา/` | `/src/` | โค้ดต้นฉบับระบบ (Source Code) |
| `สคริปต์/` | `/scripts/` | สคริปต์สำหรับการ Deployment และการทดสอบ |
| `การทดสอบ/` | `/tests/` | ไฟล์ E2E Test และ Unit Test |
| `แพคเกจ.เจซอน` | `package.json` | ไฟล์ตั้งค่า Node.js Dependencies |
| `ไวน์คอนฟิก.ts` | `vite.config.ts` | ไฟล์ตั้งค่า Vite Bundler |
| `เวอร์เซล.เจซอน` | `vercel.json` | ไฟล์ตั้งค่า Vercel Deployment |

---

## 📁 3. โครงสร้างไฟนอลที่แนะนำหลังจัดระเบียบ (Target Directory Structure)

```text
ZYRQUEN-1.2-LTS/
├── .github/                           # Workflows & CI/CD Pipelines
├── public/                            # Web Root Directory
│   └── index.html                     # [ไฟล์ที่ 1] Apex Command Hub (index.html)
│
├── docs/                              # เอกสารระบบและรายงานทางเทคนิค
│   ├── zyrquen_audit_report.md        # [ไฟล์ที่ 2] Technical Audit Report (22 Gates)
│   └── legal/                         # สำนวนและหลักฐานชั้นศาล
│       └── zyrquen_sovereign_audit_report.md # [ไฟล์ที่ 3] Sovereign Court Dossier
│
├── src/                               # Source Code
├── scripts/                           # Deployment & Build Scripts
├── tests/                             # Test Suites (E2E & Container tests)
├── package.json                       # Config (ต้องใช้ชื่ออังกฤษ)
├── vite.config.ts                     # Config (ต้องใช้ชื่ออังกฤษ)
├── tsconfig.json                      # Config
├── vercel.json                        # Config
└── README.md                          # Main Repository Documentation
```

---

## 🛠️ 4. ขั้นตอนการนำไฟล์ทั้ง 3 เข้าสู่ระบบ (Action Plan)

1. **ปรับชื่อโฟลเดอร์/ไฟล์คอนฟิกหลัก:** แก้ไขชื่อไฟล์คอนฟิกระดับ Root ให้เป็นภาษาอังกฤษมาตรฐาน (`package.json`, `vite.config.ts`, `vercel.json`)
2. **วางไฟล์ `index.html`:** นำเนื้อหาไฟล์ Apex Command Hub ไปวางที่ `/public/index.html`
3. **วางไฟล์ `zyrquen_audit_report.md`:** นำไปวางที่ `/docs/zyrquen_audit_report.md`
4. **วางไฟล์ `zyrquen_sovereign_audit_report.md`:** นำไปวางที่ `/docs/legal/zyrquen_sovereign_audit_report.md`
5. **Commit & Push:** ทำการ Commit และ Push ขึ้น GitHub เพื่อให้ GitHub Actions / GitHub Pages ทำการ Re-build ใหม่ ซึ่งไอคอนจะเปลี่ยนเป็น ✅ Green สวยงามครับ