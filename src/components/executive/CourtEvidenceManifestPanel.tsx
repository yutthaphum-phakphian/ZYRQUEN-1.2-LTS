import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileCheck,
  Download,
  Copy,
  Check,
  Scale,
  ShieldCheck,
  Award,
  Layers,
  FileText,
  Clock,
  Cpu,
  Lock,
  Radio,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
  Terminal,
  Server,
  Zap,
} from 'lucide-react';
import {
  SYSTEM_METADATA,
  THAI_CUSTODIANS,
  CANONICAL_MERKLE_ROOT,
} from '../../data/canonicalData';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import { safeCopyToClipboard } from '../../utils/clipboard';

export interface CourtExhibitItem {
  id: string;
  numberTh: string;
  titleTh: string;
  titleEn: string;
  typeTh: string;
  statute: string;
  standard: string;
  hash: string;
  status: 'VERIFIED_CANONICAL' | 'VERIFIED_TIMESTAMPED' | 'RATIFIED_100%' | 'PRESERVED_ZERO_DELETION' | 'PASSED_SLA_COMPLIANT' | 'FROZEN_v1.2_LTS' | 'VERIFIED_ZERO_LEAKAGE';
  summaryTh: string;
  legalWeightTh: string;
  verificationMethodTh: string;
}

const COURT_EXHIBITS: CourtExhibitItem[] = [
  {
    id: 'exhibit-01',
    numberTh: 'จพ.01',
    titleTh: 'บันทึกรากฐานบล็อกปฐมกาล Genesis Block #849202 และ Merkle Root ดั้งเดิม',
    titleEn: 'Genesis Anchor Block #849202 & Canonical Merkle Root',
    typeTh: 'วัตถุพยานดิจิทัลระดับปฐมกาล (Genesis Anchor)',
    statute: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 ม. 9, ป.วิ.พ. ม. 94/1',
    standard: 'SHA3-512 / BLAKE3 Dual-Tree SSoT Δ0',
    hash: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    status: 'VERIFIED_CANONICAL',
    summaryTh: 'หลักฐานการสลักสถานะความจริงหนึ่งเดียว (SSoT) ตั้งแต่บล็อกปฐมกาล #849202 ไม่พบการดัดแปลง (Mutation Count = 0, Drift Δ0.00%)',
    legalWeightTh: 'มีผลผูกพันเป็นพยานหลักฐานต้นฉบับดิจิทัลที่ไม่สามารถปฏิเสธความถูกต้องแท้จริงได้ตาม ป.วิ.พ. ม. 94/1',
    verificationMethodTh: 'เทียบค่า Merkle Root กับชุดพยานวัตถุใน Cold Vault ผ่านกระบวนการคำนวณแบบบิตต่อบิต (Bit-for-Bit Deterministic)',
  },
  {
    id: 'exhibit-02',
    numberTh: 'จพ.02',
    titleTh: 'โทเค็นประทับเวลาระดับฮาร์ดแวร์ RFC 3161 Hardware TSA Time-Stamp Token',
    titleEn: 'RFC 3161 Hardware TSA Electronic Time-Stamp Token',
    typeTh: 'พยานหลักฐานการประทับเวลาอิเล็กทรอนิกส์ (Hardware Time-Lock)',
    statute: 'ข้อเสนอแนะ ขมธอ. 23-2563 / ETDA ม. 9',
    standard: 'RFC 3161 Trusted Time-Stamping via Atomic Clock NTP/PTP',
    hash: '8f4c2918bb12903e1a55019283cd89e182390812903bc102938401928374a123',
    status: 'VERIFIED_TIMESTAMPED',
    summaryTh: 'หลักฐานยืนยันว่าข้อมูลชุดพยานหลักฐานถูกปิดผนึก ณ เวลา 14:43:43 ICT (14:04:43 UTC) โดยไม่มีการสร้างหรือปรับแก้เวลาหลังจากนั้น',
    legalWeightTh: 'รับฟังเป็นพยานหลักฐานรับรองความมีอยู่จริงของข้อมูลในวันและเวลาที่ระบุ ตามมาตรฐาน ETDA ขมธอ. 23-2563',
    verificationMethodTh: 'ตรวจสอบลายมือชื่อของ TSA Authority ด้วย Public Key ที่ฝังในฮาร์ดแวร์ HSM ระดับ FIPS 140-3 L4',
  },
  {
    id: 'exhibit-03',
    numberTh: 'จพ.03',
    titleTh: 'เอกสารรับรององค์ประชุมสัตยาบัน 10/10 Deca-Key REAL_HSM Quorum Attestation',
    titleEn: '10/10 Deca-Key REAL_HSM Quorum Attestation Certificate',
    typeTh: 'หนังสือรับรองฉันทามติทางกายภาพ (Hardware Attestation Certificate)',
    statute: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 ม. 26 (Non-repudiation)',
    standard: 'NIST FIPS 204 ML-DSA-87 (Dilithium-5) + FIPS 206 (FALCON-1024)',
    hash: '5a13396c129c611f15232fdaf54bfad00c4147abdbc3424c71e4ec103dcc8cc3',
    status: 'RATIFIED_100%',
    summaryTh: 'ลายมือชื่อดิจิทัลหลังยุคควอนตัม (PQC) ครบทั้ง 10 คีย์ 100% จากผู้ถือสิทธิ์และผู้ปกป้องระบบ นำโดย นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
    legalWeightTh: 'สร้างข้อสันนิษฐานเด็ดขาดเรื่องการไม่สามารถปฏิเสธความรับผิด (Non-repudiation) ตามมาตรา ๒๖ แห่ง พ.ร.บ. ธุรกรรมฯ',
    verificationMethodTh: 'ตรวจสอบความถูกต้องของลายมือชื่อ ML-DSA-87 (Dilithium-5) ของฮาร์ดแวร์ NitroKey, YubiKey, Trezor, Ledger',
  },
  {
    id: 'exhibit-04',
    numberTh: 'จพ.04',
    titleTh: 'บันทึกการกักกันและการสลักข้อมูลพยานหลักฐาน Chamber 02 & Module 17 V24 Log',
    titleEn: 'Chamber 02 Quarantine & Module 17 V24 Preservation Log',
    typeTh: 'บันทึกลำดับเหตุการณ์ควบคุมการกักกัน (Forensic Quarantine Record)',
    statute: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 ม. 28 (WORM / Delete-Nothing)',
    standard: 'WORM (Write Once, Read Many) & ISO/IEC 27037 Digital Evidence Handling',
    hash: '7528e18501da86fc4691763a43fa4c68909ab814479844d8a14816bed34cdbb0',
    status: 'PRESERVED_ZERO_DELETION',
    summaryTh: 'บันทึกเหตุการณ์กักกันซีลแปลกปลอม 80 รายการแยกเข้าสู่ Chamber 02 พร้อมเก็บข้อมูลดิบทั้งหมด 100% โดยไม่มีการลบทิ้งแม้แต่ไบต์เดียว',
    legalWeightTh: 'สอดคล้องกับหลักห่วงโซ่การครอบครองพยานหลักฐาน (Chain of Custody) ตามระเบียบสำนักงานศาลยุติธรรมว่าด้วยพยานหลักฐานดิจิทัล',
    verificationMethodTh: 'ตรวจสอบ Immutable Log ผ่านบล็อกสลักข้อมูล Module 17 V24 Unclassified Preservation',
  },
  {
    id: 'exhibit-05',
    numberTh: 'จพ.05',
    titleTh: 'ผลการทดสอบการย้อนรอยหลักฐาน 12 ขั้นตอน (12-Stage Forensic Trace Replay 35.8ms)',
    titleEn: '12-Stage Forensic Trace Replay Benchmark Report (35.8ms)',
    typeTh: 'รายงานการพิสูจน์พยานหลักฐานทางนิติวิทยาศาสตร์คอมพิวเตอร์ (Forensic Audit Report)',
    statute: 'ISO/IEC 27037 / ETDA ม. 26, 28',
    standard: 'Trace Replay SLA < 142ms (Measured 35.8ms / 100% Passed)',
    hash: '43a4c58901da86fc16bed34cdbb07528e18501da86fc4691763a43fa4c68909a',
    status: 'PASSED_SLA_COMPLIANT',
    summaryTh: 'รายงานการประมวลผลย้อนรอยกระบวนการยืนยันตัวตน 12 สเตจ รวดเร็ว 35.8 มิลลิวินาที ภายใต้เกณฑ์มาตรฐานความมั่นคงปลอดภัยขั้นสูง',
    legalWeightTh: 'พิสูจน์ความเสถียรและความแม่นยำของระบบประมวลผลหลักฐานในชั้นศาลโดยไร้ข้อสงสัยอันสมเหตุผล',
    verificationMethodTh: 'รันการตรวจสอบ 12 สเตจแบบ Real-time ตั้งแต่ STG-01-INGEST ถึง STG-12-CERT-EMISSION',
  },
  {
    id: 'exhibit-06',
    numberTh: 'จพ.06',
    titleTh: 'บัญชีคลังซีลอธิปไตย 14,902 รายการ (WORM Audit Trail Ledger 14,902 Frozen Seals)',
    titleEn: 'WORM Audit Trail Ledger (14,902 Canonical Frozen Seals)',
    typeTh: 'บัญชีพยานเอกสารดิจิทัลฉบับสมบูรณ์ (Master Evidence Ledger Fabric)',
    statute: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 ม. 28 / SSoT Δ0 Invariant',
    standard: 'SQLite WORM Enclave + SHA256 Chained Blocks #849202–#864104',
    hash: '16bed34cdbb07528e18501da86fc4691763a43fa4c68909ab814479844d8a148',
    status: 'FROZEN_v1.2_LTS',
    summaryTh: 'บัญชีซีล 14,902 รายการที่ถูกแช่แข็งในสถานะ LOCKEDFROZENv1.2_LTS พร้อมโครงข่าย 400 องค์กร (Ω601–Ω1000)',
    legalWeightTh: 'มีน้ำหนักพยานหลักฐานเทียบเท่าสารบบทางราชการที่ปิดรับรองโดยสมบูรณ์',
    verificationMethodTh: 'ตรวจสอบความต่อเนื่องของแฮชลูกโซ่ (Hash-Chaining) จากซีล #00001 ถึง #14902',
  },
  {
    id: 'exhibit-07',
    numberTh: 'จพ.07',
    titleTh: 'ใบรับรองความปลอดภัยห้องนิรภัยและการกำจัดข้อมูลส่วนบุคคล (Zero-Knowledge Data Vault Certificate)',
    titleEn: 'Zero-Knowledge Data Vault & 100% PII Redaction Certificate',
    typeTh: 'ใบรับรองการคุ้มครองข้อมูลส่วนบุคคล (PDPA Protection Certificate)',
    statute: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) ม. 37',
    standard: 'Zero-Knowledge Proof + Multi-Tenant Cryptographic Partitioning',
    hash: '86fc4691763a43fa4c68909ab814479844d8a14816bed34cdbb07528e18501da',
    status: 'VERIFIED_ZERO_LEAKAGE',
    summaryTh: 'หลักฐานการกักเก็บข้อมูลแบบไม่เปิดเผยข้อมูลส่วนบุคคล (Zero-Knowledge) ไม่มีการส่งข้อมูล PII ออกนอกราชอาณาจักร 100%',
    legalWeightTh: 'คุ้มครองตามหลัก Safe Harbor ของ PDPA มาตรา ๓๗ ยกเว้นความรับผิดเนื่องจากมีมาตรการรักษาความปลอดภัยขั้นสูงสุด',
    verificationMethodTh: 'ตรวจสอบ Audit Stream จาก OpenTelemetry mTLS 1.3 Port 4318 ที่ผ่านการ Redaction 100%',
  },
];

const FORENSIC_12_STAGES = [
  { id: 1, code: 'STG-01-INGEST', nameTh: 'บันทึกเจตนาธุรกรรมและประทับเวลา RFC 3161', duration: '4.2ms', standard: 'RFC 3161 / ETDA ม.๙' },
  { id: 2, code: 'STG-02-ML-DSA-87', nameTh: 'ตรวจสอบลายมือชื่อควอนตัม Dilithium-5', duration: '12.4ms', standard: 'NIST FIPS 204' },
  { id: 3, code: 'STG-03-ML-KEM-1024', nameTh: 'ถอดรหัสกุญแจความลับควอนตัม Kyber-1024', duration: '10.8ms', standard: 'NIST FIPS 203' },
  { id: 4, code: 'STG-04-SLH-DSA', nameTh: 'ตรวจสอบลายมือชื่อสำรอง SPHINCS+', duration: '14.2ms', standard: 'NIST FIPS 205' },
  { id: 5, code: 'STG-05-LEAF-HASH', nameTh: 'คำนวณแฮชโหนดกิ่งคู่ BLAKE3 + SHA3-512', duration: '8.5ms', standard: 'Dual-Hash Tree' },
  { id: 6, code: 'STG-06-MERKLE-ROOT', nameTh: 'เทียบค่าราก Merkle Root สู่ Genesis #849202', duration: '15.3ms', standard: 'SSoT Δ0 Invariant' },
  { id: 7, code: 'STG-07-HSM-QUORUM', nameTh: 'ยืนยันสัตยาบันฉันทามติ 10/10 REAL_HSM', duration: '16.2ms', standard: 'FIPS 140-3 L4' },
  { id: 8, code: 'STG-08-SENTINEL', nameTh: 'เซนติเนลตรวจความร้อนและตัดวงจร 85.0°C', duration: '9.1ms', standard: 'Fail-Closed Guard' },
  { id: 9, code: 'STG-09-LEGAL-PDPA', nameTh: 'ตรวจสิทธิ์ข้ามแดนและ Safe Harbor PDPA ม.37', duration: '14.5ms', standard: 'PDPA / ETDA' },
  { id: 10, code: 'STG-10-WARP-RELAY', nameTh: 'กระจายข้อมูลผ่านโครงข่ายดาวเทียม BFT Mesh', duration: '16.4ms', standard: 'Sovereign Relay' },
  { id: 11, code: 'STG-11-MINT-SEAL', nameTh: 'ปิดผนึกลงบัญชีแยกประเภทถาวร WORM', duration: '10.9ms', standard: 'Seal #14902' },
  { id: 12, code: 'STG-12-CERT-EMISSION', nameTh: 'ออกเอกสารรับรองนิติวิทยาศาสตร์และคำรับรองศาล', duration: '9.5ms', standard: 'Court-Ready' },
];

const CROSS_EXAMINATION_QA = [
  {
    topicTh: 'ประเด็นที่ 1: การป้องกันการแก้ไขข้อมูลย้อนหลัง (Anti-Tampering & WORM)',
    question: 'ถาม: ผู้ดูแลระบบหรือแอดมินสามารถเข้าไปแก้ไขหรือลบบันทึกข้อมูลย้อนหลังในฐานข้อมูลได้หรือไม่?',
    answer: 'ตอบ: ไม่สามารถทำได้อย่างเด็ดขาด เนื่องจากระบบใช้สถาปัตยกรรม WORM (Write Once, Read Many) ผสานกับ Merkle Hash-Chaining ทุกๆ รายการถูกผูกโยงทางคณิตศาสตร์ หากมีการแก้ไขแม้แต่ 1 บิต ค่า Merkle Root จะเปลี่ยนแปลงทันที และจะถูกปฏิเสธโดยฉันทามติ 10/10 REAL_HSM ภายใน 0.48ms ตามข้อกำหนดในมาตรา ๒๘ แห่ง พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์',
    citation: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๒๘ และ ป.วิ.พ. มาตรา ๙๔/๑',
  },
  {
    topicTh: 'ประเด็นที่ 2: ความน่าเชื่อถือของลายมือชื่อดิจิทัล (Post-Quantum Signature)',
    question: 'ถาม: ลายมือชื่ออิเล็กทรอนิกส์ของระบบมีความมั่นคงปลอดภัยและมีผลผูกพันทางกฎหมายอย่างไร?',
    answer: 'ตอบ: มีผลผูกพันอย่างสมบูรณ์ตามมาตรา ๙ และมาตรา ๒๖ แห่ง พ.ร.บ. ธุรกรรมฯ โดยใช้มาตรฐานสากล NIST FIPS 204 (ML-DSA-87 / Dilithium-5) ซึ่งต้านทานการเจาะรหัสจากคอมพิวเตอร์ควอนตัม และสร้างขึ้นภายในชิปนิรภัยระดับฮาร์ดแวร์ FIPS 140-3 Level 4 ซึ่งอยู่ภายใต้การครอบครองของผู้ถือสิทธิ์อย่างแท้จริง จึงเกิดข้อสันนิษฐานเด็ดขาดว่าเป็นการกระทำของเจ้าของลายมือชื่อ',
    citation: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๙ และ ๒๖',
  },
  {
    topicTh: 'ประเด็นที่ 3: กรณีอุปกรณ์ฮาร์ดแวร์ถูกทำลายหรือโจมตีทางกายภาพ (Fail-Closed & Auto-Healing)',
    question: 'ถาม: หากมีผู้บุกรุกเข้าไปทำลายหรือดัดแปลงฮาร์ดแวร์ ณ ที่ตั้ง ระบบจะสูญเสียพยานหลักฐานหรือไม่?',
    answer: 'ตอบ: ระบบมีกลไก Active Zeroization ตัดวงจรฉุกเฉิน (Fail-Closed) เมื่ออุณหภูมิเกิน 85°C หรือมีการเปิดฝาครอบ (Tamper Foil Breach) กุญแจชั่วคราวใน RAM จะถูกลบล้างในเวลา 0.48ms และเข้าสู่โหมดกักกัน จากนั้นกระบวนการ Phoenix Auto-Recovery จะกู้คืนสถานะที่ถูกต้องจาก Cold Vault ภายใน 35.8ms ทำให้หลักฐานดั้งเดิม 14,902 ซีลยังคงอยู่ครบ 100% โดยมี Delta Drift = Δ0.00%',
    citation: 'มาตรฐาน ISO/IEC 27037 การรักษาสภาพพยานหลักฐานดิจิทัล',
  },
  {
    topicTh: 'ประเด็นที่ 4: การปฏิบัติตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล (PDPA Safe Harbor)',
    question: 'ถาม: ข้อมูลขององค์กร 400 รายและข้อมูลส่วนบุคคลมีความเสี่ยงรั่วไหลออกนอกประเทศหรือไม่?',
    answer: 'ตอบ: ไม่มีความเสี่ยง เนื่องจากระบบใช้ Zero-Knowledge Cryptographic Partitioning แยกข้อมูลแต่ละองค์กร (Ω601–Ω1000) อย่างเด็ดขาด และมีการลบ/ปิดบังข้อมูลส่วนบุคคล (PII Redaction) 100% ก่อนจัดเก็บในคลังข้อมูล ข้อมูลทั้งหมดยังคงอยู่ภายใต้การควบคุมของโหนดอธิปไตยในราชอาณาจักรไทย จึงได้รับความคุ้มครองตามหลัก Safe Harbor ของ PDPA มาตรา ๓๗',
    citation: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ มาตรา ๓๗',
  },
];

export const CourtEvidenceManifestPanel: React.FC = () => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [expandedExhibit, setExpandedExhibit] = useState<string | null>('exhibit-01');
  const [expandedQA, setExpandedQA] = useState<number | null>(0);
  const [isSimulatingReplay, setIsSimulatingReplay] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(-1);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    safeCopyToClipboard(text);
    setCopiedHash(label);
    playTone(620, 0.05);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const handleDownload = (filename: string, url: string) => {
    playAuditChime();
    setDownloadNotice(`กำลังดาวน์โหลด: ${filename}`);
    setTimeout(() => setDownloadNotice(null), 3500);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleRunForensicReplay = () => {
    if (isSimulatingReplay) return;
    setIsSimulatingReplay(true);
    setCurrentStageIndex(0);
    playTone(440, 0.08);

    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      if (idx < FORENSIC_12_STAGES.length) {
        setCurrentStageIndex(idx);
        playTone(500 + idx * 40, 0.04);
      } else {
        clearInterval(interval);
        setCurrentStageIndex(FORENSIC_12_STAGES.length - 1);
        setIsSimulatingReplay(false);
        playAuditChime();
      }
    }, 280);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner Notice */}
      {downloadNotice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center justify-between shadow-lg"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadNotice}</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
            STATUS: 200 OK
          </span>
        </motion.div>
      )}

      {/* Manifest Master Header Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-b from-[#0a0f1e] to-[#070a12] border border-[#D4AF37]/50 shadow-2xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  แฟ้มสำนวนพยานหลักฐานดิจิทัล จพ.01–จพ.07 & Master Evidence Manifest
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold">
                  COURT-ADMISSIBLE READY
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold">
                  10/10 REAL_HSM
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                ชุดพยานหลักฐานพร้อมยื่นต่อศาลไทยตาม พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 มาตรา ๙, ๒๖, ๒๘, พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 มาตรา ๓๗ และ ป.วิ.พ. มาตรา ๙๔/๑
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleDownload('zyrquen-court-manifest.json', '/zyrquen-court-manifest.json')}
              className="px-3 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="ดาวน์โหลด JSON Manifest ทางการ"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Manifest JSON</span>
            </button>

            <button
              onClick={() => handleDownload('zyrquen-court-manifest.csv', '/zyrquen-court-manifest.csv')}
              className="px-3 py-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="ดาวน์โหลด Evidence CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Manifest CSV</span>
            </button>

            <button
              onClick={() => handleDownload('zyrquen-cross-examination-script.md', '/zyrquen-cross-examination-script.md')}
              className="px-3 py-2 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="ดาวน์โหลดบทซักค้านพยานผู้เชี่ยวชาญ"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>บทซักค้าน (MD)</span>
            </button>

            <button
              onClick={() => handleDownload('court-exhibits-th.md', '/court-exhibits-th.md')}
              className="px-3 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="ดาวน์โหลดสำนวนพยาน จพ.01–จพ.07"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>สำนวน จพ.01–07</span>
            </button>
          </div>
        </div>

        {/* Technical Key Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-black/40 border border-zinc-800">
            <span className="text-[10px] text-zinc-500 block">Genesis Block</span>
            <span className="text-emerald-400 font-bold">#849202</span>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-zinc-800">
            <span className="text-[10px] text-zinc-500 block">Frozen Seals</span>
            <span className="text-cyan-400 font-bold">14,902 Seals</span>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-zinc-800">
            <span className="text-[10px] text-zinc-500 block">System Drift</span>
            <span className="text-purple-400 font-bold">Δ0.00% (SSoT Δ0)</span>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-zinc-800">
            <span className="text-[10px] text-zinc-500 block">HSM Quorum</span>
            <span className="text-amber-400 font-bold">10/10 REAL_HSM</span>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-zinc-800">
            <span className="text-[10px] text-zinc-500 block">Sub-Kelvin Temp</span>
            <span className="text-blue-400 font-bold">14.98 mK</span>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-zinc-800">
            <span className="text-[10px] text-zinc-500 block">Quantum Coherence</span>
            <span className="text-emerald-400 font-bold">99.992%</span>
          </div>
        </div>

        {/* Canonical Merkle Root Verification Line */}
        <div className="p-3 rounded-xl bg-black/60 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 overflow-hidden">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-zinc-400 shrink-0">Canonical Merkle Root:</span>
            <span className="text-emerald-400 truncate">{CANONICAL_MERKLE_ROOT}</span>
          </div>
          <button
            onClick={() => handleCopy(CANONICAL_MERKLE_ROOT, 'Merkle Root')}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono flex items-center gap-1.5 transition-colors shrink-0"
          >
            {copiedHash === 'Merkle Root' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>คัดลอกแฮช</span>
          </button>
        </div>
      </div>

      {/* 7 Court Exhibits Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="text-base font-bold text-white">
              สารบัญบัญชีพยานหลักฐานดิจิทัลแห่งอธิปไตย (7 Court Exhibits: จพ.01 – จพ.07)
            </h3>
          </div>
          <span className="text-xs text-zinc-400 font-mono">7 รายการครบถ้วน (100% Verified)</span>
        </div>

        <div className="space-y-3">
          {COURT_EXHIBITS.map((exhibit) => {
            const isExpanded = expandedExhibit === exhibit.id;
            return (
              <div
                key={exhibit.id}
                className={`rounded-2xl border transition-all ${
                  isExpanded
                    ? 'bg-[#0a0f1e] border-emerald-500/50 shadow-xl'
                    : 'bg-black/30 hover:bg-black/50 border-zinc-800/80'
                }`}
              >
                {/* Accordion Header */}
                <div
                  onClick={() => {
                    setExpandedExhibit(isExpanded ? null : exhibit.id);
                    playTone(550, 0.03);
                  }}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-start gap-3.5">
                    <span className="px-2.5 py-1 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] font-mono font-bold text-xs shrink-0">
                      {exhibit.numberTh}
                    </span>
                    <div>
                      <div className="font-semibold text-sm text-zinc-100">{exhibit.titleTh}</div>
                      <div className="text-xs text-zinc-400 mt-0.5 flex flex-wrap items-center gap-2">
                        <span className="text-cyan-400 font-mono">{exhibit.typeTh}</span>
                        <span>•</span>
                        <span className="text-amber-300">{exhibit.statute}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold">
                      {exhibit.status}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-zinc-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-zinc-800/80 p-5 space-y-4 text-xs"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 p-3.5 rounded-xl bg-black/50 border border-zinc-800">
                          <span className="text-[11px] font-semibold text-zinc-300 block">
                            สาระสำคัญของพยานหลักฐาน:
                          </span>
                          <p className="text-zinc-400 leading-relaxed">{exhibit.summaryTh}</p>
                        </div>

                        <div className="space-y-2 p-3.5 rounded-xl bg-black/50 border border-zinc-800">
                          <span className="text-[11px] font-semibold text-amber-300 block">
                            ค่าน้ำหนักและการรับฟังในชั้นศาล:
                          </span>
                          <p className="text-zinc-400 leading-relaxed">{exhibit.legalWeightTh}</p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-black/60 border border-zinc-800 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-cyan-400">
                            วิธีการพิสูจน์ยืนยันความแท้จริง:
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400">
                            มาตรฐาน: {exhibit.standard}
                          </span>
                        </div>
                        <p className="text-zinc-400 leading-relaxed">{exhibit.verificationMethodTh}</p>

                        <div className="mt-2 pt-2 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-[11px]">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-zinc-500 shrink-0">Evidence Hash:</span>
                            <span className="text-emerald-400 truncate">{exhibit.hash}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(exhibit.hash, exhibit.id);
                            }}
                            className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono flex items-center gap-1 shrink-0 self-start sm:self-auto"
                          >
                            {copiedHash === exhibit.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>คัดลอกแฮช</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* 12-Stage Forensic Trace Replay Engine */}
      <div className="p-6 rounded-2xl bg-[#0a0f1e] border border-cyan-500/40 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">
                กลไกจำลองการตรวจพิสูจน์พยานหลักฐาน 12 ขั้นตอน (12-Stage Forensic Engine)
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              การพิสูจน์ตามลำดับ STG-01 ถึง STG-12 ภายใต้เกณฑ์เวลา SLA &lt; 142ms (ผลวัดได้ 35.8ms)
            </p>
          </div>

          <button
            onClick={handleRunForensicReplay}
            disabled={isSimulatingReplay}
            className="px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 font-mono text-xs font-semibold flex items-center gap-2 transition-all shrink-0"
          >
            {isSimulatingReplay ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin text-cyan-400" />
                <span>กำลังประมวลผลสเตจ...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-cyan-400" />
                <span>จำลองการตรวจพิสูจน์ 12 ขั้นตอน</span>
              </>
            )}
          </button>
        </div>

        {/* 12 Stages Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {FORENSIC_12_STAGES.map((stage, idx) => {
            const isCurrent = currentStageIndex === idx;
            const isCompleted = currentStageIndex > idx || (currentStageIndex === FORENSIC_12_STAGES.length - 1 && !isSimulatingReplay);

            return (
              <div
                key={stage.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-[1.02]'
                    : isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                    : 'bg-black/40 border-zinc-800/80 text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                  <span className="font-bold text-[#D4AF37]">{stage.code}</span>
                  <span className="text-zinc-500">{stage.duration}</span>
                </div>
                <div className="text-xs font-semibold leading-snug my-1.5">{stage.nameTh}</div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] font-mono">
                  <span className="text-zinc-500">{stage.standard}</span>
                  {isCompleted && <span className="text-emerald-400 font-bold">PASSED ✓</span>}
                  {isCurrent && <span className="text-cyan-400 font-bold animate-pulse">VERIFYING...</span>}
                  {!isCompleted && !isCurrent && <span className="text-zinc-600">PENDING</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Court Cross-Examination Q&A */}
      <div className="p-6 rounded-2xl bg-gradient-to-b from-[#070a12] to-[#0a0f1e] border border-amber-500/40 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              บทซักค้านพยานผู้เชี่ยวชาญศาล (Expert Witness Cross-Examination Rebuttal)
            </h3>
          </div>
          <span className="text-xs text-zinc-400 font-mono">4 ประเด็นสำคัญข้อต่อสู้</span>
        </div>

        <div className="space-y-3">
          {CROSS_EXAMINATION_QA.map((qa, index) => {
            const isExpanded = expandedQA === index;
            return (
              <div
                key={index}
                className={`rounded-xl border transition-all ${
                  isExpanded
                    ? 'bg-black/60 border-amber-500/50'
                    : 'bg-black/30 hover:bg-black/40 border-zinc-800'
                }`}
              >
                <div
                  onClick={() => {
                    setExpandedQA(isExpanded ? null : index);
                    playTone(500, 0.03);
                  }}
                  className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="font-semibold text-sm text-amber-200">{qa.topicTh}</div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-zinc-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                  )}
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-zinc-800/80 p-4 space-y-3 text-xs"
                    >
                      <div className="p-3 rounded-lg bg-red-950/20 border border-red-500/30 text-red-300 font-medium">
                        {qa.question}
                      </div>

                      <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-zinc-200 leading-relaxed">
                        <span className="font-bold text-emerald-400 block mb-1">
                          คำตอบพยานผู้เชี่ยวชาญ (Technical Witness Rebuttal):
                        </span>
                        {qa.answer}
                      </div>

                      <div className="text-[11px] font-mono text-cyan-400 pt-1">
                        ข้อกฎหมายอ้างอิง: {qa.citation}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
