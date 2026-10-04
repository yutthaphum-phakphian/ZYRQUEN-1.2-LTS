# CodeVoice AI

ผู้ช่วยเขียนโค้ดสั่งงานด้วยเสียง/ข้อความ (UI ภาษาไทย) ที่ทำงานเป็น agent: วางแผน → แก้ไฟล์ →
ตรวจโค้ด → ทดสอบ → สรุปผล พร้อมระบบ mission อัตโนมัติ, การยืนยันตัวตนหลายผู้ใช้ และชุดทดสอบ

> เอกสารนี้อธิบายเฉพาะสิ่งที่มีอยู่ในซอร์สจริง ส่วนที่ยังไม่ได้ต่อเข้าระบบหรือยังไม่ได้ตรวจใน
> สภาพแวดล้อมจริงถูกระบุไว้ในหัวข้อ [ข้อจำกัด](#ข้อจำกัดที่ต้องรู้) ใช้ป้ายสถานะแบบตรงไปตรงมา:
> `REAL` ทำงานจริงและมีเทสต์ · `PARTIAL` ทำงานบางส่วน · `UNAVAILABLE` ต้องมีโครงสร้างพื้นฐานภายนอกก่อน

ลิงก์แอปใน AI Studio: https://ai.studio/apps/02746e66-9bf4-45cf-a9b5-5f8269a5d07d

## เริ่มใช้งาน

ต้องมี Node.js 22 ขึ้นไป (ทดสอบกับ 22)

```bash
npm install
cp .env.example .env            # แล้วใส่ GEMINI_API_KEY (server โหลดไฟล์ .env ผ่าน dotenv)
npm run dev                     # http://localhost:3000
```

- `npm run dev` / `npm start` รัน `tsx server.ts` (Express + Vite middleware) ฟังที่ `0.0.0.0` พอร์ต **3000** (กำหนดตายตัวในโค้ด)
- `npm run build` สร้างไฟล์ฝั่งหน้าเว็บไว้ใน `dist/` จากนั้นรันด้วย `NODE_ENV=production npm start`
  เพื่อให้ server เสิร์ฟ `dist/`
- ไม่มี `GEMINI_API_KEY`: ส่วนที่เรียกโมเดล (`/api/chat`, `/api/tts`, `/api/enhance-prompt`, `/api/plan-mission`)
  จะตอบ error และ pipeline จะขึ้น FAILED พร้อมเหตุผล ส่วน runtime ภายใน/mission แบบกำหนดแผนเองยังใช้ได้

## การตั้งค่า (environment)

ตัวอย่างอยู่ใน [`.env.example`](.env.example) ทุกตัวไม่บังคับ ยกเว้น `GEMINI_API_KEY` ถ้าจะใช้โมเดล

| ตัวแปร | หน้าที่ | ค่าเริ่มต้น |
|---|---|---|
| `GEMINI_API_KEY` | คีย์ Gemini สำหรับแชต/TTS/วางแผน | — |
| `APP_URL` | URL ที่โฮสต์แอป | — |
| `AUTH_TOKENS` | access key ของผู้ใช้ `key:user,key2:user2` (key ≥ 16 ตัวอักษร) | ไม่ตั้ง = **เปิดโล่ง (dev)** |
| `ADMIN_TOKEN` | เปิดใช้ `/api/admin/*` (≥ 16 ตัวอักษร) | ไม่ตั้ง = admin ตอบ 503 |
| `SESSION_TTL_HOURS` | อายุ session | `12` |
| `SESSION_PERSIST_PATH` | เก็บ session ลงไฟล์ (เครื่องเดียว) | memory |
| `REDIS_URL` | เก็บ session ใน Redis (หลายเครื่อง; ต้อง `npm i redis`) | — |
| `USER_REGISTRY_PATH` | ไฟล์ผู้ใช้ที่สร้างผ่าน admin | `.data/users.json` เมื่อมี `AUTH_TOKENS`/`ADMIN_TOKEN` |
| `INVITE_STORE_PATH` | ไฟล์ invite แบบใช้ครั้งเดียว | `.data/invites.json` |
| `AUDIT_LOG_PATH` | audit log แบบ NDJSON (เพิ่มต่อท้ายอย่างเดียว) | `.data/audit.ndjson` |
| `MISSION_STORE_DIR` | ที่เก็บ mission ต่อผู้ใช้ | `.data/missions/` |
| `FORCE_HTTPS` | `1/true/yes` redirect HTTP→HTTPS (เชื่อ `X-Forwarded-Proto`) | ปิด |
| `METRICS_TOKEN`, `METRICS_ALLOW_IPS` | ป้องกัน `/api/metrics` (ตั้งทั้งคู่ = ต้องผ่านทั้งคู่) | เปิดโล่ง |

ตัวแปรของ agent runtime ในโฟลเดอร์ `server/` (ใช้เมื่อโมดูลเหล่านั้นถูกเรียก ดู[หัวข้อ agent runtime](#agent-runtime-library-โฟลเดอร์-server)):
`CODEVOICE_DURABLE_ROOT` (`.codevoice-data`), `CODEVOICE_WORKER_CAPACITY` (4),
`CODEVOICE_SCHEDULER_INTERVAL_MS` (5000), `CODEVOICE_SCHEDULER_BATCH_LIMIT` (4),
`CODEVOICE_RECOVERY_INTERVAL_MS` (30000), `CODEVOICE_RECOVERY_BATCH_LIMIT` (500),
`CODEVOICE_CONTROL_PLANE_HEARTBEAT_MS` (5000) และกลุ่ม `CODEVOICE_TASK_CONSISTENCY_*`
(interval 10000, stale 30000, batch 500, failure threshold 3, backoff 5000→120000, circuit 60000 ms)

## ความปลอดภัยและผู้ใช้

- **โหมดเปิดโล่ง**: ไม่ตั้ง `AUTH_TOKENS` และไม่มีผู้ใช้ใน registry → ทุก `/api/*` ใช้ได้โดยไม่ล็อกอิน
  (ผู้ใช้ชื่อ `local`) server จะเตือนตอนเริ่ม ห้ามเปิดสู่สาธารณะในโหมดนี้
- **โหมดล็อกอิน**: access key ใช้ได้เฉพาะ `POST /api/login` เพื่อแลก session token แบบสุ่ม
  (เก็บเฉพาะแฮช) route อื่นใช้ `Authorization: Bearer <session>` เท่านั้น
  เปรียบเทียบ key แบบ constant-time และจำกัดการล็อกอินผิดต่อ IP (10 ครั้ง/นาที → 429)
- **session**: ต่ออายุ/หมุน token ได้ (`/api/session/refresh`), ออกจากระบบ (`/api/logout`),
  admin เพิกถอนทั้งผู้ใช้ได้ หน้าเว็บต่ออายุให้เองในช่วงก่อนหมดอายุและแจ้งเมื่อหมดอายุ
- **ผู้ใช้แบบ dynamic**: admin สร้าง/หมุน key/ปิด/ลบผู้ใช้ผ่าน API, สร้าง invite ใช้ครั้งเดียวให้ผู้ใช้
  แลก access key ของตัวเอง; ทุกเหตุการณ์สำคัญลง audit log
- **แยกข้อมูลตามผู้ใช้**: mission เก็บที่ `.data/missions/<user>/` ผู้ใช้คนหนึ่งอ่านของอีกคนไม่ได้
- **อื่น ๆ**: security headers, ตัวนับ metrics แบบ Prometheus, `FORCE_HTTPS`
- แอดมิน UI: คอมโพเนนต์ `AdminPanel`, `InviteRedeemModal`, `SessionAuthBar`

## API (จาก `server.ts`)

| กลุ่ม | Route |
|---|---|
| ยืนยันตัวตน | `POST /api/login` · `POST /api/logout` · `POST /api/session/refresh` · `GET /api/session/me` |
| Invite | `GET/POST /api/invite/redeem` |
| Admin (ต้อง `ADMIN_TOKEN`) | `GET /api/admin/status` · `POST /api/admin/revoke-user` · `GET/POST /api/admin/users` · `POST /api/admin/users/:userId/rotate` · `POST …/:userId/enable` · `DELETE /api/admin/users/:userId` · `GET /api/admin/audit` · `GET/POST /api/admin/invites` |
| โมเดล (ต้อง `GEMINI_API_KEY`) | `POST /api/chat` · `POST /api/tts` · `POST /api/enhance-prompt` · `POST /api/plan-mission` |
| Mission | `GET /api/missions` · `GET/PUT /api/missions/:id` (ต่อผู้ใช้) |
| Agent run (governance) | `POST/GET /api/agent/runs` · `GET /api/agent/runs/:id` · `POST /api/agent/runs/:id/approve` · `POST /api/agent/runs/:id/cancel` (ต่อผู้ใช้) |
| Self-Healing (authenticated read-only) | `GET /api/self-healing/failures` · `GET /api/self-healing/failures/:fingerprint` · `GET /api/self-healing/drafts` · `GET /api/self-healing/drafts/:draftId` · `POST /api/self-healing/drafts/:draftId/branch-preview` (dry-run) |
| ปฏิบัติการ | `GET /api/health` (ไม่ต้องล็อกอิน) · `GET /api/metrics` (Prometheus) |

## Mission อัตโนมัติ (V18) — `src/tools/autonomousMissionEngine.ts`

แตกเป้าหมายเป็น task graph ที่มี dependency, รัน tool ภายในจริง, ตรวจสถานะโปรเจกต์, บันทึก evidence event
และทำงานผ่านหน้า Mission บนเดสก์ท็อป/มือถือ ความสามารถที่มีเทสต์รองรับ:

- รันแบบ async ทีละ task และ **pause/cancel ได้กลางทาง** · resume จาก checkpoint ที่ตรวจความสมบูรณ์แล้ว
- **จัดคิวขนานเฉพาะงานอ่านอย่างเดียว** (READ/ANALYZE/SEARCH/REVIEW/SUMMARIZE ไม่เกิน 3 ต่อรอบ) งานแก้ไฟล์รันเดี่ยวเสมอ
- **วางแผนด้วยโมเดล** (`/api/plan-mission`) โดยตรวจแผนเข้มงวดก่อนใช้ ถ้าไม่ผ่านถอยไปใช้ planner แบบกำหนดเอง
- งานแก้ไฟล์ต้องได้รับอนุมัติเป็นราย task, ถ้าขาดชื่อ/เนื้อหาไฟล์จะหยุดที่ `WAITING_USER` (ไม่แต่งเนื้อหาเอง),
  สร้าง snapshot ก่อนแก้, โหลดเนื้อหาจากไฟล์ที่เลือกได้
- เก็บ mission ลงดิสก์ฝั่ง server (เขียนแบบ atomic) และกู้คืนหลังรีสตาร์ท (สถานะ RUNNING กู้เป็น PAUSED)
- แชตแนบไฟล์ข้อความ/โค้ดได้สูงสุด 5 ไฟล์ ไฟล์ละไม่เกิน 200 KB (ไฟล์ไบนารีถูกปฏิเสธ)

ขั้นตอน Agent Pipeline ในหน้าจอ (8 ขั้น) คำนวณจากหลักฐานจริงใน `src/utils/pipelineSteps.ts`:
รอบที่ล้มเหลวจะแสดงขั้นที่ล้ม เหตุผล และปุ่มลองใหม่ ไม่ปล่อยค้างเป็น `pending`

## ความสามารถอื่นในแอป (V10–V17)

อ้างอิงรายงานใน [`docs/milestones/legacy-v-series/`](docs/milestones/legacy-v-series/)

- **V10 Release Agent**: ตรวจความพร้อม production (`READY`/`NOT_READY`/`BLOCKED`) พร้อมหลักฐาน, export release ที่ตัดไฟล์ลับ
- **V11 Team Runtime**: ทีม Lead/Coder/UI/QA/Security/Performance/Reviewer ใช้ task state ร่วมกัน มีล็อกไฟล์และตรวจ conflict
- **V12 Mission Control**: จัดหมวดภารกิจ สร้าง workflow เลือก agent/tool/context ตามงบ
- **V13 Integration Hub**: registry ของ connector, นำเข้า OpenAPI, REST ผ่าน HTTPS, permission gate
- **V14 Research**: วางแผนค้นคว้า ดึงแหล่งผ่าน Hub สกัดหลักฐาน ตรวจข้อขัดแย้ง สร้างอ้างอิง
- **V15–V17**: trace/checkpoint/dry-run, ความพร้อมของ provider, runtime ภายในที่รันเครื่องมือโปรเจกต์จริง
  (CRUD ไฟล์, ค้นหา, ตรวจโค้ด, memory, snapshot)

หลักเดียวกันทุกชั้น: เมื่อไม่มี provider/credential/connector จริง ระบบรายงาน `UNAVAILABLE`/`AUTH_REQUIRED`/`CONFIG_REQUIRED`
แทนการแต่งผลลัพธ์

## Agent runtime library (โฟลเดอร์ `server/`)

โมดูลชุดใหญ่ (V19–V48 และ milestone ที่ตั้งชื่อตามความสามารถ) เช่น แผนงาน/นโยบาย/จำลองก่อนรัน, ตัวควบคุมการรัน agent,
developer tools & repair loop, durable store, transactional workspace, mission queue/worker pool, recovery/reconciliation,
supervisor + leader lease/failover, control plane

**สถานะจริง (ตรวจจากโค้ด):** มีเพียงส่วน *governance ของ agent run* ที่ต่อเข้า `server.ts` แล้ว
(`agentRunController` → `src/server/agentRunRoutes.ts`) ได้แก่ สร้างแผน → จำลอง → ตรวจ admission/นโยบาย → อนุมัติ/ยกเลิก
ผ่าน `/api/agent/runs*` ซึ่ง**สร้าง/อ่าน/เปลี่ยนสถานะ "ระเบียนการรัน" เท่านั้น ไม่ได้รันเครื่องมือหรือแก้ไฟล์โปรเจกต์**
- แยกต่อผู้ใช้ (project เก็บเป็น `<user>.<project>`), ผู้อนุมัติคือผู้ใช้ที่ล็อกอินเสมอ (ไม่รับค่าจาก body),
  คนอื่นเห็นเป็น 404, ขอระดับความเสี่ยงได้สูงสุด `HIGH` (ค่าเริ่มต้น `MEDIUM`; ไม่รับ `CRITICAL`)
- ไม่เปิด API จัดการนโยบาย (policy) เพื่อไม่ให้ผู้ใช้ให้สิทธิ์ตัวเอง; **ถ้าโปรเจกต์ไม่มี policy ไลบรารีจะถือว่า capability
  ที่ลงทะเบียนไว้ "อนุญาต" (`NO_PROJECT_POLICY`)** ผู้ดูแลควรตั้ง policy ผ่านโค้ด/สคริปต์ฝั่ง server ก่อนเปิดให้ใช้จริง
- ข้อมูลเก็บที่ `CODEVOICE_DURABLE_ROOT` (ค่าเริ่มต้น `.codevoice-data/`, อยู่ใน `.gitignore`)

โมดูลที่เหลือ (worker pool, queue/scheduler, recovery, supervisor/leader failover, transactional workspace ฯลฯ)
**ยังถูกเรียกจากเทสต์ใน `tests/` เท่านั้น** ไม่มี route หรือหน้าจอ และไม่มี UI สำหรับดู agent run ในหน้าเว็บ

### Self-Healing milestone (draft-only)

`server/selfHealingLoop.ts` เพิ่ม registry สำหรับจัดกลุ่ม failure ที่เกิดซ้ำด้วย fingerprint
ที่ลบ path/secret ออกจากหลักฐาน, ตรวจ threshold และสร้าง root-cause summary กับ payload
สำหรับ Draft PR ได้ แต่ **ยังไม่ push branch, ไม่สร้าง PR จริง และไม่ merge/deploy**
Draft จะเป็น `DRAFT_READY` ต่อเมื่อมี repeated failure, มี operation ที่อยู่ใน workspace
อย่างปลอดภัย และ validation gates ทุกตัวผ่าน มิฉะนั้นจะเป็น `BLOCKED` เพื่อให้มนุษย์ตรวจสอบ
ก่อนดำเนินการต่อ

API สังเกตการณ์ใช้ namespace ผู้ใช้และไม่เผย project ของผู้ใช้อื่น: list/detail ของ
fingerprint และ draft จะคืน `404` เมื่อไม่ใช่เจ้าของ นอกจากนี้ response จะตัด secret และ
path จาก stack trace แล้ว โดยการอ่านทั้งหมดต้องใช้ session token (`Authorization: Bearer ...`)

### Git provider dry-run (Milestone 4)

`server/gitProviderDryRun.ts` มี provider abstraction (`github`, `gitlab`, `generic`) ที่ใช้
`previewDeveloperPatch` เป็นแหล่ง unified diff เดียวกับ repair engine เพื่อเช็ก
`expectedHash` และสร้าง branch/PR payload แบบจำลองเท่านั้น ค่า preview จะระบุชัดเจนว่า
`mode: DRY_RUN`, `branchCreated: false`, `pushRequested: false` และ
`pullRequestCreated: false` เสมอ หาก draft ยังไม่พร้อมหรือไฟล์เปลี่ยนจากตอนสร้าง draft
จะคืน `BLOCKED` พร้อมเหตุผล และไม่แก้ working tree

`POST /api/self-healing/drafts/:draftId/branch-preview` รับ workspace ที่อยู่ใต้ server root
เท่านั้น เพื่อป้องกันการอ่านไฟล์นอกขอบเขต และคืน unified diff, patch hash, changed files,
base/proposed branch และ Draft PR metadata โดยยังไม่มีการเรียก GitHub/GitLab จริง

## ทดสอบ

```bash
npm test                  # = test:typescript + test:legacy + test:ui
npm run test:typescript   # 61 ไฟล์ใน tests/*.test.ts (node:test ผ่าน tsx)
npm run test:legacy       # คอมไพล์โมดูลหลักแล้วรัน 7 สคริปต์ .cjs ใน tests/
npm run test:ui            # 3 สคริปต์ Playwright บน Chromium จริง (login, mission/แนบไฟล์, รายงานโภชนาการ)
npm run lint              # tsc --noEmit
```

ชุด `tests/*.test.ts` เป็นโปรแกรม `node:test` ที่มี assertion ระดับโมดูล ไม่ใช่
Vitest `describe`/`it` suites จึงต้องใช้ `npm run test:typescript` ซึ่งบังคับรันทีละไฟล์
เพื่อป้องกัน race จาก durable store และ worker lease ที่ใช้ state ร่วมกัน การรัน
`npx vitest run` กับโฟลเดอร์นี้จะรายงาน `No test suite found` และไม่ใช่คำสั่งทดแทน
ของโปรเจกต์

ติดตั้ง Chromium ครั้งเดียวหลัง `npm ci`: `npx playwright install chromium`
(หรือกำหนด `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`) รายละเอียดดู [`tests/README.md`](tests/README.md)

ผลล่าสุดที่ตรวจในสภาพแวดล้อมที่ไม่มี Express/Vite (ติดตั้งจาก npm ไม่ได้): `test:typescript` 79/79 ผ่าน
(รวมเทสต์ pipeline และ agent-run routes ที่เพิ่มใหม่), `test:legacy` ผ่าน 6/7 (ตัวที่ 7 `express-auth-integration.cjs` ต้องใช้ Express จริง),
`test:ui` ผ่าน 3/3 `npm run lint` และ `npm run build` **ยังไม่ได้รันในสภาพแวดล้อมนั้น** — ให้รันบนเครื่องที่ติดตั้ง dependencies ครบ

## เอกสารและรายงาน

- [`docs/milestones/INDEX.md`](docs/milestones/INDEX.md) — ดัชนีรายงาน (`agent-runtime/`, `developer-repair/`,
  `recovery-reliability/`, `runtime-foundation/`, `legacy-v-series/`)
- รายงานแต่ละชิ้นแยก REAL / PARTIAL / UNAVAILABLE และผลทดสอบ; รายงาน V-series เก่าเก็บไว้ตามประวัติ
- ซอร์สหลักคือโครงสร้างในรากโปรเจกต์ ไฟล์ zip เป็นเพียง snapshot

## ข้อจำกัดที่ต้องรู้

- เก็บข้อมูลบนดิสก์ของเครื่องเดียว (mission, ผู้ใช้, invite, audit); ใช้หลายเครื่องได้เฉพาะ session ผ่าน Redis
- ไม่มีระบบสมัครสมาชิกด้วยรหัสผ่าน: ผู้ใช้เข้าด้วย access key/invite ที่ admin ออกให้; session token เก็บใน `localStorage`
  ของเบราว์เซอร์ (ควรใช้ผ่าน HTTPS)
- ไม่มี provider ภายนอกจริง (OAuth, ฐานข้อมูล, MCP, GraphQL, WebSocket, webhook, vault) — รายงานเป็น `UNAVAILABLE`
- คุณภาพผลลัพธ์จากโมเดลขึ้นกับ Gemini และคีย์ของคุณ; การเรียกโมเดลจริงยังไม่ได้ตรวจในชุดเทสต์อัตโนมัติ
- การเรียก Express จริงของ `server.ts`, `npm run build` และ `npm run lint` ต้องตรวจบนเครื่องที่ติดตั้ง dependencies ครบ
