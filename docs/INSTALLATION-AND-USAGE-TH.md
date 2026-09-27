# คู่มือการติดตั้งและการใช้งาน ZYRQUEN Ω∞ Frozen v1.2 LTS

คู่มือนี้อธิบายการติดตั้ง การรัน การทดสอบ และการใช้งานโปรเจกต์ **ZYRQUEN Ω∞ Frozen v1.2 LTS** เวอร์ชันล่าสุด ซึ่งรวมการแก้ไข dependency ของ `qs`, Unit Tests และการปรับส่วนติดต่อผู้ใช้ให้รองรับอุปกรณ์มือถือ

> คู่มือนี้อ้างอิงจากโครงสร้างไฟล์และคำสั่งในโปรเจกต์เวอร์ชันล่าสุดที่ส่งมอบเป็น ZIP

## 1. ภาพรวมระบบ

โปรเจกต์เป็นเว็บแอปพลิเคชันที่ใช้ React และ TypeScript โดยมี Vite เป็นเครื่องมือ build ฝั่งเว็บ และ Express เป็นเซิร์ฟเวอร์สำหรับ development และ production bundle

| รายการ | ค่า |
|---|---|
| Frontend | React 19 + TypeScript |
| Build tool | Vite 6 |
| Backend runtime | Express 4 |
| Visualization | D3, Recharts และ Three.js |
| Test runner | Node.js test runner ผ่าน `tsx` |
| Package manager | npm |
| Node.js ที่แนะนำ | Node.js 22 |
| Dependency security | `npm audit` และ `qs` override ที่ `6.16.0` |
| Responsive UI | Desktop, tablet และ mobile |

## 2. ข้อกำหนดก่อนติดตั้ง

ควรติดตั้งซอฟต์แวร์ต่อไปนี้ก่อนเริ่มใช้งาน

| ซอฟต์แวร์ | เวอร์ชันหรือเงื่อนไข |
|---|---|
| Node.js | แนะนำเวอร์ชัน 22 LTS |
| npm | เวอร์ชันที่มากับ Node.js 22 หรือใหม่กว่า |
| Git | จำเป็นเฉพาะกรณี clone จาก repository |
| ระบบปฏิบัติการ | Linux, macOS หรือ Windows ที่รองรับ Node.js |

ตรวจสอบเวอร์ชันที่ติดตั้งแล้วด้วยคำสั่ง:

```bash
node --version
npm --version
```

ควรใช้ Node.js รุ่นเดียวกันทั้งในเครื่องพัฒนาและ CI/CD เพื่อให้ผลการติดตั้งและการทดสอบสอดคล้องกัน

## 3. เตรียมไฟล์โปรเจกต์

หากได้รับไฟล์ ZIP ให้แตกไฟล์ก่อน เช่น:

```bash
unzip zyrquen-frozen-v1.2-lts-mobile-ui.zip
cd zyrquen-frozen-v1.2-lts-mobile-ui
```

หากใช้ Git ให้ clone repository แล้วเข้าสู่โฟลเดอร์โปรเจกต์:

```bash
git clone <repository-url>
cd <repository-directory>
```

ไม่ควรนำโฟลเดอร์ `node_modules` จากเครื่องอื่นมาใช้แทนการติดตั้งใหม่ เพราะ binary และ dependency บางรายการอาจแตกต่างตามระบบปฏิบัติการ

## 4. ติดตั้ง dependencies

สำหรับการติดตั้งตาม lockfile ที่ตรวจสอบแล้ว ให้ใช้ `npm ci`:

```bash
npm ci
```

`npm ci` จะติดตั้ง dependency ตาม `package-lock.json` และเหมาะสำหรับ CI/CD หรือการติดตั้งจาก ZIP ที่ส่งมอบ

โปรเจกต์กำหนด dependency override ดังนี้:

```json
"overrides": {
  "qs": "^6.16.0"
}
```

การตั้งค่านี้บังคับให้ dependency tree ใช้ `qs@6.16.0` ซึ่งเป็นเวอร์ชันที่ผ่านการตรวจสอบด้วย `npm audit` ในชุดไฟล์เวอร์ชันล่าสุด

ตรวจสอบ dependency tree ได้ด้วยคำสั่ง:

```bash
npm ls qs express
```

ผลที่คาดหวังคือ `express` และ `body-parser` resolve ไปยัง `qs@6.16.0`

## 5. ตัวแปรสภาพแวดล้อม

โปรเจกต์อ่านค่าจากไฟล์ `.env` ผ่าน `dotenv` ที่ฝั่งเซิร์ฟเวอร์ ไฟล์ตัวอย่างที่ตรวจสอบกับ source code แล้วอยู่ที่ [`.env.example`](./.env.example)

เริ่มต้นด้วยคำสั่ง:

```bash
cp .env.example .env
```

ตัวแปรที่โปรเจกต์ใช้งานจริงมีดังนี้:

| ตัวแปร | จำเป็นหรือไม่ | ค่าแนะนำ | หน้าที่ |
|---|---|---|---|
| `GEMINI_API_KEY` | ไม่จำเป็น | เว้นว่างได้ | เปิดใช้งาน Gemini Copilot ที่ endpoint `/api/copilot` หากไม่กำหนด ระบบจะใช้ Offline Rule Engine fallback |
| `NODE_ENV` | ไม่จำเป็น | `development` | ใช้แยกเส้นทาง development กับ production static serving ภายในเซิร์ฟเวอร์ |
| `DISABLE_HMR` | ไม่จำเป็น | `false` | หากเป็น `true` จะปิด Vite HMR และ file watching เหมาะกับสภาพแวดล้อมที่มีข้อจำกัด |

ตัวอย่างไฟล์ `.env` สำหรับ development:

```dotenv
# ใช้ค่า API key จริงเฉพาะในเครื่องหรือ secret manager ที่ปลอดภัย
GEMINI_API_KEY=
NODE_ENV=development
DISABLE_HMR=false
```

`GEMINI_API_KEY` เป็นตัวแปรเดียวที่เป็น secret โดยตรง หากปล่อยว่าง ระบบยังเปิดหน้าเว็บและตอบ Copilot ด้วย fallback engine ได้ ส่วน `NODE_ENV` และ `DISABLE_HMR` ไม่ใช่ secret แต่ควรตั้งค่าให้ชัดเจนตามสภาพแวดล้อม

โปรเจกต์กำหนดพอร์ตเซิร์ฟเวอร์เป็น `3000` ใน source code ปัจจุบัน จึงไม่มีตัวแปร `PORT` ที่ใช้งานจริง และการเพิ่ม `PORT` ลงใน `.env` จะไม่เปลี่ยนพอร์ตโดยอัตโนมัติ

ควรเก็บค่า secret จริงไว้ใน secret manager หรือ GitHub Actions Secrets และไม่ commit ไฟล์ `.env` ไฟล์ `.env*` ถูก ignore โดย `.gitignore` ยกเว้น `.env.example`

## 6. รันในโหมดพัฒนา

เริ่ม development server ด้วยคำสั่ง:

```bash
npm run dev
```

เซิร์ฟเวอร์จะเริ่มฟังที่พอร์ต `3000` ตามค่าเริ่มต้น และโดยทั่วไปสามารถเปิดได้ที่:

```text
http://localhost:3000
```

หากพอร์ต 3000 ถูกใช้งานอยู่ ให้หยุดโปรเซสเดิมก่อน หรือปรับการตั้งค่าของเซิร์ฟเวอร์ตามโครงสร้างที่โปรเจกต์รองรับ

หยุดเซิร์ฟเวอร์ด้วย `Ctrl+C`

## 7. การใช้งานบนคอมพิวเตอร์

หน้าเว็บหลักมีองค์ประกอบสำคัญดังนี้:

| ส่วน | วิธีใช้งาน |
|---|---|
| Header | แสดงสถานะระบบ ปุ่มเมนู การค้นหา เหตุการณ์ และ snapshot |
| Sidebar | เลือก View, Chamber หรือ Module และค้นหารายการภายในเมนู |
| Navigation tabs | เปลี่ยนหน้าไปยัง Dashboard, Quantum, Nexus, Vault, Ledger และหน้าอื่น |
| Main content | แสดง dashboard และเครื่องมือของ view ที่เลือก |
| Events sidebar | เปิดดู system events และการดำเนินการแบบกลุ่ม |
| Footer | แสดงสถานะ snapshot, heartbeat และทางลัดของระบบ |

ปุ่มเมนูด้านซ้ายใช้เปิดหรือปิด Sidebar ส่วนการเลือก View หรือ Chamber บนหน้าจอขนาดเล็กจะปิด drawer ให้อัตโนมัติ เพื่อให้กลับไปยังเนื้อหาหลักได้ทันที

## 8. การใช้งานบนมือถือ

เวอร์ชันล่าสุดเพิ่ม responsive layer โดยไม่ลบฟังก์ชันเดิม การใช้งานบนมือถือมีแนวทางดังนี้:

1. แตะปุ่มเมนูด้านซ้ายบน Header เพื่อเปิด Sidebar
2. แตะพื้นหลังด้านนอก Sidebar หรือปุ่มปิดเพื่อปิดเมนู
3. เลื่อนแถบ Navigation tabs ในแนวนอนเมื่อรายการเกินความกว้างหน้าจอ
4. เลื่อนกลุ่มปุ่มควบคุมด้านขวาของ Header ในแนวนอน
5. เลื่อนตารางและ code block ในแนวนอนเมื่อข้อมูลกว้างกว่าหน้าจอ
6. หมุนหน้าจอเป็นแนวนอนเมื่อทำงานกับกราฟหรือตารางที่มีข้อมูลจำนวนมาก
7. ใช้เบราว์เซอร์รุ่นปัจจุบันที่รองรับ CSS viewport และ touch scrolling

การปรับ responsive เน้นการป้องกัน horizontal overflow การเพิ่มพื้นที่สัมผัสของปุ่ม และการจำกัด dialog ไม่ให้เกินขอบหน้าจอ

## 9. รัน Unit Tests

โปรเจกต์มี Unit Tests 6 รายการ และเรียกใช้งานผ่านคำสั่ง:

```bash
npm test
```

ชุดทดสอบครอบคลุมฟังก์ชันหลักต่อไปนี้:

- Circuit breaker threshold ที่ `15,000 KBps`
- การยกเว้น authorized TRNG surge
- Frozen canonical core state
- การแยก observed stream และ quarantine state
- Write firewall แบบ fail-closed
- การป้องกัน canonical properties และ mutation delta เท่ากับ `0`

ผลสำเร็จควรมีลักษณะดังนี้:

```text
tests 6
pass 6
fail 0
```

## 10. ตรวจสอบ TypeScript และ lint

รันคำสั่ง:

```bash
npm run lint
```

คำสั่งนี้เรียก `tsc --noEmit` เพื่อทำ type-check โดยไม่สร้างไฟล์ JavaScript ผลลัพธ์ที่ถือว่าผ่านคือ process exit code `0`

## 11. ตรวจสอบความปลอดภัยของ dependencies

ตรวจสอบช่องโหว่ด้วยคำสั่ง:

```bash
npm audit --audit-level=moderate
```

สำหรับเวอร์ชันล่าสุดควรพบ:

```text
found 0 vulnerabilities
```

ไม่ควรรัน `npm audit fix` ใน production หรือ CI โดยไม่ review เพราะคำสั่งนี้อาจเปลี่ยน dependency tree อัตโนมัติ แนวทางที่เหมาะสมคือแก้ `package.json` และ `package-lock.json` ผ่าน Pull Request แล้วรันชุดทดสอบซ้ำ

## 12. สร้าง production build

สร้างไฟล์สำหรับ production ด้วยคำสั่ง:

```bash
npm run build
```

คำสั่งนี้จะทำสองขั้นตอน:

1. ใช้ Vite สร้าง frontend bundle
2. ใช้ esbuild bundle `server.ts` เป็น `dist/server.cjs`

ไฟล์ output สำคัญจะอยู่ในโฟลเดอร์ `dist/` ซึ่งไม่ควรนำไปแก้ไขด้วยมือ

Build อาจแสดงคำเตือนเกี่ยวกับ dynamic/static imports และ JavaScript chunk ที่มีขนาดใหญ่กว่า 500 KB คำเตือนเหล่านี้ไม่ทำให้ build ล้มเหลว แต่ควรติดตามเพื่อปรับปรุง code splitting ในอนาคต

## 13. รัน production bundle

หลัง build สำเร็จ ให้เริ่มเซิร์ฟเวอร์ด้วย:

```bash
npm start
```

หากต้องการตรวจสอบแบบรวดเร็ว ให้เปิด:

```text
http://localhost:3000
```

ควรตรวจสอบด้วยว่าเซิร์ฟเวอร์ตอบ HTTP status `200 OK` และหน้าเว็บโหลด asset จาก `dist/` ได้ครบ

## 14. Benchmark และ Gatekeeper

รัน benchmark:

```bash
npm run benchmark
```

สร้าง performance report:

```bash
npm run report:perf
```

รัน gatekeeper:

```bash
npm run gatekeeper
```

คำสั่ง gatekeeper ตรวจค่า CPU, latency, throughput, memory และ cache hit rate ตามเกณฑ์ที่อยู่ในสคริปต์ของโปรเจกต์ ผลผ่านหมายความว่าสคริปต์ตรวจสอบทุกเกณฑ์จบด้วย exit code `0` ไม่ได้หมายความว่าเป็นผล load test ของ production จริง

## 15. คำสั่งทั้งหมดใน package.json

| คำสั่ง | หน้าที่ |
|---|---|
| `npm run dev` | เปิด development server |
| `npm test` | รัน Unit Tests ด้วย `tsx --test` |
| `npm run lint` | ตรวจ TypeScript ด้วย `tsc --noEmit` |
| `npm run build` | สร้าง frontend และ production server bundle |
| `npm start` | รัน production bundle จาก `dist/` |
| `npm run preview` | เปิด Vite preview server |
| `npm run benchmark` | รัน benchmark script |
| `npm run report:perf` | สร้าง performance report |
| `npm run gatekeeper` | ตรวจ performance threshold |
| `npm run clean` | ลบ `dist` และไฟล์ server ที่สร้างขึ้น |

## 16. ขั้นตอนตรวจสอบก่อนส่งมอบ

ใช้ลำดับคำสั่งต่อไปนี้เพื่อจำลองการตรวจสอบใน CI/CD:

```bash
npm ci
npm audit --audit-level=moderate
npm test
npm run lint
npm run build
npm run benchmark
npm run report:perf
npm run gatekeeper
```

ควรหยุดกระบวนการทันทีเมื่อคำสั่งใดคำสั่งหนึ่งล้มเหลว และควรตรวจสอบ diff ของ `package.json` กับ `package-lock.json` ก่อน commit ทุกครั้ง

## 17. ปัญหาที่พบบ่อย

### `npm ci` ล้มเหลวเพราะ lockfile ไม่สอดคล้อง

ตรวจสอบว่าใช้ `package.json` และ `package-lock.json` จากชุดเดียวกัน หากแก้ dependency ให้รัน:

```bash
npm install
```

จากนั้นตรวจสอบ lockfile และ commit ทั้งสองไฟล์พร้อมกัน

### `npm test` ไม่พบคำสั่ง

ตรวจสอบว่า `package.json` มีรายการต่อไปนี้:

```json
"test": "tsx --test"
```

จากนั้นติดตั้ง dependencies ใหม่ด้วย:

```bash
npm ci
```

### `tsc`, `vite` หรือ `tsx` ไม่พบ

มักเกิดจากยังไม่ได้ติดตั้ง `node_modules` ให้รัน:

```bash
npm ci
```

### พอร์ต 3000 ถูกใช้งานอยู่

ตรวจสอบโปรเซสที่ใช้งานพอร์ต:

```bash
# Linux/macOS
lsof -i :3000

# Linux ทางเลือก
ss -ltnp | grep :3000
```

หยุด development server เก่าก่อนเริ่มใหม่

### Build ผ่านแต่มี bundle warning

ตรวจสอบ dynamic imports และพิจารณาแบ่ง bundle ด้วย Vite manual chunks หรือปรับโครงสร้างการโหลด view แบบ lazy loading การแก้ไขควรทำเป็นงาน optimization แยกจาก security fix

### หน้าเว็บบนมือถือมีข้อมูลยาว

เลื่อนส่วน navigation, ตาราง หรือ code block ในแนวนอน หากข้อมูลยังล้น ให้ตรวจว่า component นั้นใช้ `min-width: 0` และไม่ได้กำหนด fixed width ที่มากกว่า viewport

## 18. ข้อควรระวังด้านความปลอดภัย

ไม่ควรถือว่าผล `npm audit` เป็นการรับรองความปลอดภัยทั้งระบบ เพราะเป็นเพียงการตรวจ dependency ที่ npm รู้จัก ควรใช้ CodeQL, Dependency Review, secret scanning และการตรวจสอบโค้ดตามความเหมาะสมด้วย

ไม่ควรใส่ API key, private key, credential หรือข้อมูลส่วนบุคคลใน source code, ZIP หรือ log file ควรหมุนเวียน key ทันทีหากพบว่าถูกเผยแพร่

ผล benchmark และ gatekeeper ของโปรเจกต์เป็นผลจากสคริปต์ภายใน repository จึงควรใช้ HTTP integration test และ load test แยกต่างหากเมื่อต้องประเมิน production performance

## 19. สรุปขั้นตอนเริ่มต้นแบบย่อ

```bash
unzip zyrquen-frozen-v1.2-lts-mobile-ui.zip
cd zyrquen-frozen-v1.2-lts-mobile-ui
npm ci
npm audit --audit-level=moderate
npm test
npm run lint
npm run dev
```

หากต้องการตรวจสอบ production build ให้รัน:

```bash
npm run build
npm start
```

## References

[1]: https://nodejs.org/en/download "Node.js Downloads"

[2]: https://docs.npmjs.com/cli/v10/commands/npm-ci "npm ci Documentation"

[3]: https://docs.npmjs.com/cli/v10/commands/npm-audit "npm audit Documentation"

[4]: https://vite.dev/guide/ "Vite Guide"

[5]: https://nodejs.org/api/test.html "Node.js Test Runner Documentation"
