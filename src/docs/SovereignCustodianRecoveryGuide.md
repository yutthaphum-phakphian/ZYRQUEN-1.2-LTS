# ZYRQUEN Ω∞ SOVEREIGN CUSTODIAN KEYS RECOVERY POLICY & OPERATIONAL MANUAL
**Document Reference:** `ZYR-DOC-RECOVERY-SEC26-V24`  
**Classification:** OMEGA-1 SUPREME CLEARANCE / SOVEREIGN ARCHITECT DISASTER RECOVERY PROTOCOL  
**Sovereign Authority:** นายยุทธภูมิ พากเพียร (`#EP-SOVEREIGN-01`)  
**Canonical Genesis Merkle Root:** `909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68`  
**Canonical Sealed Block:** `#849202` (14,902 Canonical Seals)  
**Legal Framework Compliance:** พระราชบัญญัติว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๙, ๒๖, ๒๘ (สพธอ. ETDA) & PDPA พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ มาตรา ๓๗  

---

## 1. วัตถุประสงค์และขอบเขต (Purpose & Scope)
เอกสารคู่มือฉบับนี้กำหนดระเบียบปฏิบัติและขั้นตอนทางวิศวกรรมความมั่นคงปลอดภัยขั้นสูงสำหรับการกู้คืนกุญแจผู้พิทักษ์อธิปไตยดิจิทัล (**Sovereign Custodian Keys Recovery Policy**) เมื่อเกิดกรณีภัยพิบัติทางไซเบอร์ขั้นวิกฤต (Catastrophic Failure), การสูญเสียสภาพการเชื่อมต่อของตู้กุญแจฮาร์ดแวร์ (**Hardware Security Module - HSM Desynchronization**), หรือการเปลี่ยนผ่านสู่โหมดรหัสลับสำรองต้านควอนตัม (**SPHINCS+ Fallback Protocol**) ภายใต้การควบคุมของสถาปนิกสูงสุด นายยุทธภูมิ พากเพียร (`#EP-SOVEREIGN-01`)

---

## 2. โครงสร้างและอำนาจการพิทักษ์ (Sovereign Deca-Key Governance Architecture)
ระบบ ZYRQUEN Ω∞ บังคับใช้กลไกฉันทามติแบบ 10-of-10 (**Deca-Key HSM Quorum**) โดยแบ่งกุญแจฮาร์ดแวร์กระจายตามทำเนียบผู้พิทักษ์ไทย (Thai Custodians Registry) ซึ่งได้รับการรับรองตามมาตรฐาน **FIPS 140-3 Level 4**:

| Custodian ID | Holder Name & Role | Passport Ref | HSM Serial / Slot | PQC Algorithm |
|---|---|---|---|---|
| **CUST-01** | นายยุทธภูมิ พากเพียร (Sovereign Architect) | `#EP-SOVEREIGN-01` | HSM-TH-01 (Primary) | Dilithium-5 / SPHINCS+ |
| **CUST-02** | ดร. ธีรภัทร วงศ์สวรรค์ (Chief Cryptographer) | `#EP-SOVEREIGN-02` | HSM-TH-02 | Dilithium-5 (ML-DSA-87) |
| **CUST-03** | รศ.ดร. นันทิกร บุญยเกียรติ (ETDA Legal Custodian) | `#EP-SOVEREIGN-03` | HSM-TH-03 | Dilithium-5 (ML-DSA-87) |
| **CUST-04** | พล.อ.ต. นพ. กิตติภพ ไชยชนะ (National Defense Custodian)| `#EP-SOVEREIGN-04` | HSM-TH-04 | Dilithium-5 (ML-DSA-87) |
| **CUST-05** | นางสาว รัตนาพร เกียรติสกุล (Data Privacy Custodian) | `#EP-SOVEREIGN-05` | HSM-TH-05 | Dilithium-5 (ML-DSA-87) |
| **CUST-06** | ดร. พงศ์ศิริ นวรัตน์ (Quantum Telemetry Specialist) | `#EP-SOVEREIGN-06` | HSM-TH-06 | Dilithium-5 (ML-DSA-87) |
| **CUST-07** | นาย อภิชิต เตชะวงศ์ (Infrastructure SRE Lead) | `#EP-SOVEREIGN-07` | HSM-TH-07 | Dilithium-5 (ML-DSA-87) |
| **CUST-08** | ผศ. วรุตม์ ศรีสัจจา (Formal Verification Auditor) | `#EP-SOVEREIGN-08` | HSM-TH-08 | Dilithium-5 (ML-DSA-87) |
| **CUST-09** | ดร. กานดา ลิมปิโชติ (Zero Trust Policy Officer) | `#EP-SOVEREIGN-09` | HSM-TH-09 | Dilithium-5 (ML-DSA-87) |
| **CUST-10** | นาย ธนทัต ภานุวัฒน์ (PDPA & Cyber Law Attestor) | `#EP-SOVEREIGN-10` | HSM-TH-10 | Dilithium-5 (ML-DSA-87) |

---

## 3. ขั้นตอนการซิงโครไนซ์ตู้กุญแจฮาร์ดแวร์ (HSM Re-Synchronization Protocol)

เมื่อเกิดกรณี HSM สัญญาณขาดหาย หรือเกิด Clock Jitter เกินพิกัด (> 0.005 ps) ระบบจะเข้าสู่สภาวะ Fail-Closed ทันที ให้ปฏิบัติตาม 6 ขั้นตอนดังต่อไปนี้:

### Step 3.1: Isolated Air-Gapped Console Initialization
1. เชื่อมต่อคอนโซลฉุกเฉินแบบแยกการเชื่อมต่อภายนอก (Air-Gapped Terminal) เข้าสู่พอร์ต Sub-Kelvin Cryogenic Bus (Chamber 00)
2. ป้อนหนังสือเดินทางอธิปไตย `#EP-SOVEREIGN-01` พร้อมสแกนไบโอเมตริกซ์และการยืนยันตัวตนระดับ **AAL3**
3. ตรวจสอบสถานะความเย็นยิ่งยวดให้คงที่ที่ **14.98 mK** และความเร็วคอร์ **851.9 QOps**

### Step 3.2: Shamir Secret Sharing Quorum Reconstitution
- ใช้ชุดชิ้นส่วนลับ Shamir Secret Sharing ($k = 7$ of $n = 10$) เพื่อสร้าง Master Seed ชั่วคราวในหน่วยความจำเข้ารหัส Enclave:
$$S = \sum_{j=1}^{k} y_j \prod_{m \neq j} \frac{x_m}{x_m - x_j} \pmod p$$
- ต้องมีผู้พิทักษ์อย่างน้อย 7 ใน 10 ท่าน เสียบกุญแจฮาร์ดแวร์กายภาพพร้อมกันในช่อง Quorum Port Alpha ถึง Eta

### Step 3.3: Invariant & Merkle Root Assertion
- คำนวณค่าแฮชเทียบกับค่าคงสภาพถาวร **Genesis Merkle Root:**
  `909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68`
- ตรวจสอบจำนวนซีลคงที่ **14,902 Canonical Seals**
- หากพบค่าเบี่ยงเบนแม้แต่ 1 บิต ระบบจะปฏิเสธการปลดล็อก (Zero Canonical Write Mutation)

### Step 3.4: Hardware Key Attestation Signature Re-issuance
- ทำการ Re-sign พยานหลักฐานสัจจะด้วยคำสั่งภายใน HSM:
  ```bash
  zyrquen-hsm-tool --resync-quorum --threshold 10 --fips-level 4 \
    --expected-root 909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68 \
    --passport "#EP-SOVEREIGN-01" --output /dev/shm/hsm_attest.sig
  ```

---

## 4. แผนปฏิบัติการสำรอง SPHINCS+ (SPHINCS+ Fallback Scenarios)

ในกรณีที่ระบบโครงข่าย Lattice Cryptography (Dilithium-5 / FIPS 204) ตกอยู่ในสภาวะถูกโจมตีแบบ Side-channel หรือมีข้อสงสัยเกี่ยวกับความสมบูรณ์ของโครงสร้าง Lattice:

### Scenario 4.1: Stateless Hash-Based Signature Fallback (NIST FIPS 205)
1. **การเปิดใช้งาน:** สถาปนิกสูงสุด `#EP-SOVEREIGN-01` ออกคำสั่งสลับไปยังอัลกอริทึม **SLH-DSA-SHAKE-256s** (SPHINCS+) ซึ่งเป็นโครงสร้างรหัสลับแบบใช้แฮชล้วน (Stateless Hash-based PQC) ที่ไม่พึ่งพาปัญหา Lattice
2. **คุณสมบัติความปลอดภัย:**
   - ความยาวกุญแจสาธารณะ (Public Key): 64 Bytes
   - ความยาวลายมือชื่อ (Signature Size): 29,792 Bytes
   - ระดับความปลอดภัย: NIST Security Category 5 (เทียบเท่า 256-bit Quantum Security)
3. **การตรึงลงในสมุดทะเบียน:** ทุกธุรกรรมที่ใช้ SPHINCS+ จะถูกผูกเข้ากับ Module 17 Unclassified Preservation V24 โดยอัตโนมัติ พร้อมประทับตราพยานหลักฐานตามมาตรฐาน ETDA

---

## 5. การคุ้มครองทางกฎหมายและมาตรฐานชั้นศาล (Thai Electronic Transactions Act Compliance)

1. **มาตรา ๙ (พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔):**
   - การกู้คืนกุญแจทุกขั้นตอนจะบันทึกเจตนาของผู้พิทักษ์และสถาปนิกสูงสุดอย่างชัดแจ้ง ตรวจสอบได้ด้วยบันทึก OTel Trace STAGE-01 ถึง STAGE-12
2. **มาตรา ๒๖ (ลายมือชื่ออิเล็กทรอนิกส์ที่เชื่อถือได้):**
   - กุญแจที่กู้คืนจะอยู่ภายใต้การควบคุมแต่เพียงผู้เดียวของผู้ถือสิทธิ์ในฮาร์ดแวร์ และสามารถตรวจพบการเปลี่ยนแปลงใดๆ ได้ทันที
3. **มาตรา ๒๘ (หน้าที่และความรับผิดชอบของระบบรับรอง):**
   - ผู้พิทักษ์ทั้ง 10 ท่านปฏิบัติตามมาตรฐานการเก็บรักษาพยานหลักฐานดิจิทัล **ISO/IEC 27037**
4. **มาตรา ๓๗ (พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ - PDPA):**
   - มีมาตรการรักษาความมั่นคงปลอดภัยและความลับของข้อมูลผู้ใช้งานอย่างเคร่งครัด

---

## 6. สรุปบันทึกการรับรอง (Attestation Sign-off)
**ประทับตราโดย:** นายยุทธภูมิ พากเพียร (`#EP-SOVEREIGN-01`)  
**สถานะ:** เอกสารผ่านการรับรองและตรึงไว้ในสารบบความมั่นคงอธิปไตยดิจิทัล ZYRQUEN Ω∞  
**Block Height Anchor:** `#849202` | **Zero Drift Guarantee:** `0.00%`
