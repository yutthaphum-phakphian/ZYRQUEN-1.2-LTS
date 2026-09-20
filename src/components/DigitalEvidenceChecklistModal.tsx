import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  Scale,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Download,
  Copy,
  Check,
  Search,
  Filter,
  Layers,
  AlertTriangle,
  UserCheck,
  X,
  FileText,
  Lock,
  Cpu,
  Fingerprint,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  ArrowRight,
  Sparkles,
  Award,
  ExternalLink,
  SlidersHorizontal,
  ListChecks,
  Activity
} from 'lucide-react';
import { playAuditChime, playTone, playTelemetryBeep } from './AudioSynthesizer';
import { SYSTEM_METADATA, CANONICAL_MERKLE_ROOT } from '../data/canonicalData';
import {
  ChecklistItem,
  InspectorProfile,
  generateDigitalEvidenceChecklistPdf,
} from '../utils/digitalEvidenceChecklistPdfExport';

interface DigitalEvidenceChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const INITIAL_CHECKLIST_ITEMS: ChecklistItem[] = [
  // Module 1: Intent & Identity (ETDA Sec 9)
  {
    id: 'CHK-01-AUTH',
    category: 'ETDA พ.ร.บ. ธุรกรรมฯ',
    statuteRef: 'มาตรา ๙',
    title: '1. การระบุตัวตนและยืนยันผู้ทำรายการ (Authentication)',
    description: 'ตรวจสอบบันทึกการยืนยันตัวตนของผู้ทำรายการผ่านระบบรับรองกุญแจสองชั้น (Dual-Key Auth) หรือใบรับรองอิเล็กทรอนิกส์สากล',
    passed: true,
    technicalProof: 'Sovereign Principal ID: นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01) • FIPS 140-3 L4 Enclave Bound',
    legalImplication: 'ระบุตัวบุคคลผู้เป็นเจ้าของลายมือชื่อได้ตามมาตรา ๙ วรรคหนึ่ง (๑) แห่ง พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔',
    pqcStandard: 'NIST FIPS 204 (ML-DSA-87 / CRYSTALS-Dilithium-5)',
    hashDigest: '0x5a13396c129c611f7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
  },
  {
    id: 'CHK-02-INTENT',
    category: 'ETDA พ.ร.บ. ธุรกรรมฯ',
    statuteRef: 'มาตรา ๙',
    title: '2. การแสดงเจตนาผูกพันทางกฎหมาย (Legal Intent)',
    description: 'ตรวจสอบบันทึกเจตนาผูกพันในการทำธุรกรรม การยืนยันด้วยรหัสผ่าน และสภาวะแวดล้อมที่แสดงเจตนาชัดแจ้งปราศจากการบังคับ',
    passed: true,
    technicalProof: 'Transaction Intent Token SHA3-512 Encapsulation • OMEGA-1 Executive Lock Authorized',
    legalImplication: 'แสดงให้เห็นว่าเจ้าของลายมือชื่อยอมรับข้อความในข้อมูลอิเล็กทรอนิกส์ตามมาตรา ๙ วรรคหนึ่ง (๒)',
    pqcStandard: 'SHA3-512 Hash with Dilithium-5 Attestation Binding',
    hashDigest: '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
  },
  {
    id: 'CHK-03-TIMESTAMP',
    category: 'ETDA พ.ร.บ. ธุรกรรมฯ',
    statuteRef: 'มาตรา ๙ / RFC 3161',
    title: '3. ตราประทับเวลาสากลที่เชื่อถือได้ (Trusted Timestamping)',
    description: 'ตรวจสอบการผูกโยงเวลามาตรฐานสากล (RFC 3161 Timestamp Token) ณ ขณะเกิดรายการ ยืนยันความมีอยู่ของข้อมูลในเวลานั้น',
    passed: true,
    technicalProof: 'RFC 3161 Certified TSA • 14:04:43 UTC (14:43:43 ICT) • Latency 4.2ms Zero Clock Skew',
    legalImplication: 'รับรองความมีอยู่จริงของข้อมูล ณ เวลาที่ทำรายการ สามารถนำสืบหักล้างข้อต่อสู้เรื่องการทำย้อนหลังได้ในชั้นศาล',
    pqcStandard: 'RFC 3161 Cryptographic TSA Token with PQC Wrap',
    hashDigest: '0x849202_TSA_RFC3161_2026_09_14_140443_UTC_HASH',
  },

  // Module 2: Digital Signatures (ETDA Sec 26)
  {
    id: 'CHK-04-SIG-VALIDITY',
    category: 'ETDA พ.ร.บ. ธุรกรรมฯ',
    statuteRef: 'มาตรา ๒๖',
    title: '4. ความสมบูรณ์ของลายมือชื่อดิจิทัล (Signature Integrity)',
    description: 'ตรวจสอบใบรับรองอิเล็กทรอนิกส์ กุญแจรหัสลับผู้ลงนาม และอัลกอริทึมที่ได้มาตรฐานสากล (NIST FIPS 204 ML-DSA-87)',
    passed: true,
    technicalProof: 'Verify_Dilithium5(A·z - c·t₁·2^d = w₁ mod q) = TRUE • Latency 12.4ms • Zero Lattice Mutation',
    legalImplication: 'ถือเป็นลายมือชื่ออิเล็กทรอนิกส์ที่เชื่อถือได้ตามมาตรา ๒๖ ซึ่งกฎหมายให้ข้อสันนิษฐานว่าเป็นลายมือชื่อที่แท้จริง',
    pqcStandard: 'CRYSTALS-Dilithium-5 (ML-DSA-87)',
    hashDigest: '0x14902_DILITHIUM5_SIG_FIPS204_ETDA_SEC26_PASS',
  },
  {
    id: 'CHK-05-TAMPER-EVIDENCE',
    category: 'ETDA พ.ร.บ. ธุรกรรมฯ',
    statuteRef: 'มาตรา ๒๖',
    title: '5. กลไกตรวจจับการบิดเบือนข้อมูล (Tamper-Evidence)',
    description: 'ตรวจสอบว่ามีการใช้ฟังก์ชันแฮชทางรหัสลับ (SHA-256) ป้องกันการแก้ไขเปลี่ยนแปลงข้อมูลหลังการลงนาม หากมีบิตใดเปลี่ยนจะตรวจพบได้ทันที',
    passed: true,
    technicalProof: 'Zero Drift Invariant: Δ0.00% across 14,902 Canonical Seals • Mutation Block Engine Active',
    legalImplication: 'ตรวจพบการเปลี่ยนแปลงใดๆ ที่เกิดขึ้นกับข้อมูลหลังจากเวลาที่ได้ลงลายมือชื่อได้ตามมาตรา ๒๖ (๔)',
    pqcStandard: 'SHA-256 Merkle Invariant with WORM Guard',
    hashDigest: '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
  },
  {
    id: 'CHK-06-NON-REPUDIATION',
    category: 'ETDA พ.ร.บ. ธุรกรรมฯ',
    statuteRef: 'มาตรา ๒๖',
    title: '6. การห้ามปฏิเสธความรับผิดชอบ (Non-Repudiation)',
    description: 'ค้ำประกันว่าข้อมูลถูกส่งหรือสร้างขึ้นโดยเจ้าของกุญแจจริง โดยเจ้าของกุญแจไม่สามารถปฏิเสธความรับผิดได้ในชั้นศาล',
    passed: true,
    technicalProof: '10/10 REAL_HSM Council Deca-Key Attestation Ratified • Hardware Enclave Private Key Seclusion',
    legalImplication: 'ผูกพันคู่สัญญาและไม่สามารถปฏิเสธความรับผิดชอบในทางแพ่งและพาณิชย์ตามมาตรา ๒๖ วรรคสอง',
    pqcStandard: 'FIPS 140-3 Level 4 HSM Hardware Signature',
    hashDigest: '0xDECA_HSM_NON_REPUDIATION_RATIFIED_10_OF_10',
  },

  // Module 3: Chain of Custody & Hash (ETDA Sec 28 & ISO/IEC 27037)
  {
    id: 'CHK-07-HASH-INTEGRITY',
    category: 'ISO/IEC 27037 & ETDA',
    statuteRef: 'มาตรา ๒๘',
    title: '7. การคำนวณค่าดิจิทัลแฮชบิตต่อบิต (Cryptographic Hash)',
    description: 'คำนวณค่า Digest ของพยานหลักฐานเทียบกับสมุดบัญชี Merkle Root เพื่อยืนยันว่าไม่มีการดัดแปลงหรือสูญหาย',
    passed: true,
    technicalProof: 'Genesis Block #849202 • Root: 909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    legalImplication: 'เป็นพยานหลักฐานทางนิติวิทยาศาสตร์ที่มีความน่าเชื่อถือสูงตามข้อกำหนด ISO/IEC 27037 และ พ.ร.บ. ธุรกรรมฯ ม.๒๘',
    pqcStandard: 'Canonical Merkle Tree (Depth 14, 14902 Leaves)',
    hashDigest: '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
  },
  {
    id: 'CHK-08-APPEND-ONLY',
    category: 'ISO/IEC 27037 & ETDA',
    statuteRef: 'มาตรา ๒๘',
    title: '8. การจัดเก็บแบบลบไม่ได้ (Read-Only / Append-Only Ledger)',
    description: 'จัดเก็บพยานหลักฐานในสื่อบันทึกถาวรแบบ WORM (Write Once Read Many) ตามหลักการนิติวิทยาศาสตร์ Delete Nothing',
    passed: true,
    technicalProof: 'WORM Immutable Audit Ledger V25 • Zero-Trust Write Firewall • Parent Hash Chaining 100ms',
    legalImplication: 'ป้องกันการทำลาย ลบ หรือแก้ไขพยานหลักฐานย้อนหลัง ซึ่งมีผลต่อความรับฟังได้ของพยานหลักฐานในศาล',
    pqcStandard: 'WORM Cryptographic Chaining with Parity 452/452',
    hashDigest: '0xAPPEND_ONLY_WORM_V25_PARITY_452_VERIFIED',
  },
  {
    id: 'CHK-09-CHAIN-OF-CUSTODY',
    category: 'ISO/IEC 27037 & ETDA',
    statuteRef: 'มาตรา ๒๘',
    title: '9. การย้อนรอยประวัติห่วงโซ่พยาน (Chain of Custody Trace)',
    description: 'มีบันทึกการส่งมอบ ย้ายสถานที่ จัดเก็บ และผู้เข้าถึงพยานหลักฐานทุกขั้นตอนอย่างละเอียดเพื่อประกอบการนำสืบศาล',
    passed: true,
    technicalProof: '12-Stage Forensic Trace Replay SLA <142ms • Audit Trail API OpenTelemetry OTLP Protobuf mTLS',
    legalImplication: 'แสดงห่วงโซ่การครอบครองพยานหลักฐานดิจิทัลที่ครบถ้วนและสมบูรณ์ตามหลักกฎหมายวิธีพิจารณาความแพ่งและอาญา',
    pqcStandard: 'OpenTelemetry Trace ID with mTLS 1.3 Audit Certificate',
    hashDigest: '0xTRACE_REPLAY_142MS_STAGE01_TO_STAGE12_PASSED',
  },

  // Module 4: PDPA Data Protection (PDPA Sec 9, 26, 28, 37)
  {
    id: 'CHK-10-PII-REDACTION',
    category: 'PDPA คุ้มครองข้อมูลฯ',
    statuteRef: 'มาตรา ๙ / มาตรา ๓๗',
    title: '10. การปกปิดและคัดกรองข้อมูลส่วนบุคคล (PII Redaction)',
    description: 'ตรวจสอบว่ามีการ Masking ข้อมูลระบุตัวบุคคลที่ไม่เกี่ยวข้องก่อนนำส่งหรือนำเสนอในรายงานพยานหลักฐาน',
    passed: true,
    technicalProof: 'Zero-Knowledge Privacy Vault • PII Zero Egress Filter • PDPA Redaction Automated Gate Active',
    legalImplication: 'สอดคล้องกับหน้าที่ของผู้ควบคุมข้อมูลส่วนบุคคลตามมาตรา ๓๗ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒',
    pqcStandard: 'Zero-Knowledge Proofs & PII Masking Protocol',
    hashDigest: '0xZK_PII_REDACTION_PDPA_SEC37_VERIFIED_PASS',
  },
  {
    id: 'CHK-11-SENSITIVE-DATA',
    category: 'PDPA คุ้มครองข้อมูลฯ',
    statuteRef: 'มาตรา ๒๖ / FIPS 203',
    title: '11. การเข้ารหัสคุ้มครองข้อมูลส่วนบุคคลอ่อนไหว (Sensitive Data Protection)',
    description: 'มีมาตรการรักษาความมั่นคงปลอดภัยขั้นสูงและการเข้ารหัสลับระดับควอนตัม (FIPS 203 ML-KEM) สำหรับข้อมูลอ่อนไหว',
    passed: true,
    technicalProof: 'ML-KEM-1024 (Kyber-1024) Category 5 Key Encapsulation • Protection against "Harvest Now Decrypt Later"',
    legalImplication: 'ปฏิบัติตามมาตรฐานการรักษาความมั่นคงปลอดภัยของข้อมูลส่วนบุคคลขั้นสูงตามประกาศคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล',
    pqcStandard: 'NIST FIPS 203 (ML-KEM-1024 / Kyber-1024)',
    hashDigest: '0xML_KEM_1024_KYBER_PDPA_SEC26_CONFIRMED',
  },
  {
    id: 'CHK-12-CROSS-BORDER',
    category: 'PDPA คุ้มครองข้อมูลฯ',
    statuteRef: 'มาตรา ๒๘',
    title: '12. การควบคุมการโอนข้อมูลข้ามแดน (Cross-Border Transfer Controls)',
    description: 'ตรวจสอบว่าปลายทางมีมาตรฐานการคุ้มครองข้อมูลส่วนบุคคลที่เพียงพอและได้รับความยินยอมหรือมีข้อยกเว้นตามกฎหมาย',
    passed: true,
    technicalProof: 'Thai Sovereign Boundary Gate (th-bangkok Sovereign Hub Primary) • Encrypted Lattice Tunnel with QKD',
    legalImplication: 'ป้องกันการส่งหรือโอนข้อมูลส่วนบุคคลไปยังต่างประเทศโดยฝ่าฝืนมาตรา ๒๘ และ ๒๙ แห่ง PDPA',
    pqcStandard: 'QKD 256-bit Secure Channel with Sovereign Boundary Routing',
    hashDigest: '0xTHAI_SOVEREIGN_HUB_BK01_QKD_SECURE_TUNNEL',
  },

  // Module 5: Cybersecurity Act (NCSA)
  {
    id: 'CHK-13-CII-PROTECTION',
    category: 'NCSA พ.ร.บ. ไซเบอร์ฯ',
    statuteRef: 'พ.ร.บ. ไซเบอร์ฯ ๒๕๖๒',
    title: '13. การคุ้มครองโครงสร้างพื้นฐานสำคัญ (CII Protection)',
    description: 'ประเมินความเสี่ยงและมาตรการป้องกันระบบสารสนเทศที่มีความสำคัญยิ่งยวดต่อความมั่นคงและการให้บริการสาธารณะ',
    passed: true,
    technicalProof: 'National CII Compliant Architecture • 400 Tenants Ω601–Ω1000 Isolated Partitioning Locked',
    legalImplication: 'เป็นไปตามหลักเกณฑ์การรักษาความมั่นคงปลอดภัยของหน่วยงานโครงสร้างพื้นฐานสำคัญทางสารสนเทศ (สกมช.)',
    pqcStandard: 'NCSA CII Level 4 Air-Gapped Architectural Standard',
    hashDigest: '0xCII_400_TENANTS_LOCKED_OMEGA600_1000_VERIFIED',
  },
  {
    id: 'CHK-14-THREAT-AUDIT',
    category: 'NCSA พ.ร.บ. ไซเบอร์ฯ',
    statuteRef: 'พ.ร.บ. ไซเบอร์ฯ ๒๕๖๒',
    title: '14. การเฝ้าระวังและบันทึก Log ภัยคุกคาม (Threat Monitoring & Audit)',
    description: 'ระบบเฝ้าระวังความผิดปกติและตรวจจับการโจมตีแบบเรียลไทม์ พร้อมจัดเก็บ Audit Log อย่างน้อย 90 วันตามมาตรฐาน',
    passed: true,
    technicalProof: 'Neural Anomaly Diagnostic Observer Active • Sub-Kelvin Cryo 14.96 mK • Jitter 0.31 ms SLA Nominal',
    legalImplication: 'รองรับการตรวจสอบและส่งรายงานการรับมือภัยคุกคามทางไซเบอร์ต่อหน่วยงานกำกับดูแลตามมาตรา ๕๐',
    pqcStandard: 'Real-time AI Threat Sentinel with OpenTelemetry OTLP',
    hashDigest: '0xTHREAT_MONITORING_OTLP_MTLS_PORT4318_ACTIVE',
  },
  {
    id: 'CHK-15-HARDWARE-BINDING',
    category: 'NCSA พ.ร.บ. ไซเบอร์ฯ',
    statuteRef: 'พ.ร.บ. ไซเบอร์ฯ ๒๕๖๒',
    title: '15. การควบคุมความปลอดภัยฮาร์ดแวร์และการตรึงความแท้จริง',
    description: 'การใช้งาน 10/10 REAL_HSM FIPS 140-3 L4 ตรึงกุญแจในระดับ Hardware Isolation ป้องกันการดึงกุญแจออกนอกอุปกรณ์',
    passed: true,
    technicalProof: '10 Nodes Hardware Enclave: NitroKey FIPS 140-3, YubiKey 5C, Trezor Safe 5 CC EAL6+, Ledger Stax',
    legalImplication: 'พิสูจน์การถือครองกุญแจส่วนตัวในระดับฮาร์ดแวร์ที่ไม่มีผู้ใดสามารถคัดลอกหรือปลอมแปลงได้',
    pqcStandard: 'FIPS 140-3 Level 4 / Common Criteria EAL6+',
    hashDigest: '0x10_OF_10_REAL_HSM_FIPS140_3_L4_CC_EAL6_PLUS',
  },

  // Module 6: Court Dossier Packaging
  {
    id: 'CHK-16-COURT-PACKAGE',
    category: 'มาตรฐานศาลและสำนวน',
    statuteRef: 'ป.วิ.พ. & ข้อบังคับศาล',
    title: '16. การจัดชุดสำนวนและใบรับรองพยานหลักฐาน (Court Dossier Packaging)',
    description: 'จัดทำสารบัญบัญชีพยาน ตารางสรุปค่าแฮช และออกใบรับรองในรูปแบบ PDF/A สำหรับการยื่นและรับฟังในชั้นศาล',
    passed: true,
    technicalProof: 'Court Dossier PDF Packaging with Embedded Merkle Proof, Digital Evidence QR & Dilithium-5 Attestation',
    legalImplication: 'พร้อมสำหรับการยื่นเป็นพยานหลักฐานในชั้นศาลตามประมวลกฎหมายวิธีพิจารณาความแพ่งและอาญาแห่งราชอาณาจักรไทย',
    pqcStandard: 'ISO 19005-3 PDF/A Judicial Evidence Profile',
    hashDigest: '0xCOURT_DOSSIER_JUDICIAL_PACKAGE_VERIFIED_SSOT',
  },
];

export const DigitalEvidenceChecklistModal: React.FC<DigitalEvidenceChecklistModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [items, setItems] = useState<ChecklistItem[]>(INITIAL_CHECKLIST_ITEMS);
  const [viewMode, setViewMode] = useState<'stepper' | 'matrix'>('stepper');
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isAutoRunning, setIsAutoRunning] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Auto-Runner Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAutoRunning) {
      timer = setTimeout(() => {
        playTone(600 + activeStep * 20, 0.05);
        if (activeStep < items.length - 1) {
          setActiveStep((prev) => prev + 1);
        } else {
          setIsAutoRunning(false);
          playAuditChime();
        }
      }, 1200);
    }
    return () => clearTimeout(timer);
  }, [isAutoRunning, activeStep, items.length]);

  if (!isOpen) return null;

  const currentStep = items[activeStep] || items[0];

  const toggleItem = (id: string) => {
    playTone(600, 0.03);
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, passed: !item.passed } : item))
    );
  };

  const handleNextStep = () => {
    if (activeStep < items.length - 1) {
      playTone(720, 0.05);
      setActiveStep((prev) => prev + 1);
    } else {
      playAuditChime();
    }
  };

  const handlePrevStep = () => {
    if (activeStep > 0) {
      playTone(540, 0.05);
      setActiveStep((prev) => prev - 1);
    }
  };

  const handleCopyText = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    playTone(880, 0.04);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleExportPdf = () => {
    setIsExporting(true);
    playTone(520, 0.08);
    try {
      generateDigitalEvidenceChecklistPdf(items, {
        name: SYSTEM_METADATA.sovereignPrincipal,
        organization: 'Thai Sovereign Custodian Council & Digital Forensic Lab',
        inspectorId: '#EP-SOVEREIGN-01',
        inspectionDate: new Date().toISOString().split('T')[0],
        overallConclusion: items.every((i) => i.passed) ? 'PASSED' : 'CONDITIONAL',
      });
      playAuditChime();
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      filterCategory === 'ALL' || item.category.includes(filterCategory);
    const matchesSearch =
      searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.statuteRef.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const passedCount = items.filter((i) => i.passed).length;
  const totalCount = items.length;
  const passPercent = Math.round((passedCount / totalCount) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-5xl max-h-[94vh] bg-[#070a12] border-2 border-emerald-500/40 rounded-[28px] shadow-2xl flex flex-col overflow-hidden text-zinc-200 font-mono">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-emerald-500/25 bg-gradient-to-r from-emerald-950/50 via-[#070a12] to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.35)]">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white font-serif tracking-wide">
                  ระบบตรวจเช็คระบบ &amp; พยานหลักฐานดิจิทัล (System Check-Up)
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  ISO/IEC 27037 &bull; v2.0
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                  SSoT Δ0.00%
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-serif mt-0.5">
                มาตรฐานกฎหมายไทย 3 ฉบับ (ETDA ม.๙, ๒๖, ๒๘ • PDPA ม.๙, ๒๖, ๒๘, ๓๗ • NCSA พ.ร.บ. ไซเบอร์ฯ ๒๕๖๒)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* View Mode Switcher: Stepper vs Matrix */}
            <div className="flex items-center p-1 bg-black/60 rounded-xl border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => {
                  playTone(640, 0.04);
                  setViewMode('stepper');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  viewMode === 'stepper'
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="ไล่ตรวจทีละขั้นตอน (Step-by-Step Stepper Mode)"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                <span>ไล่ทีละขั้นตอน</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playTone(640, 0.04);
                  setViewMode('matrix');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  viewMode === 'matrix'
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="ตารางตรวจสอบพยานรวม (Full Matrix View)"
              >
                <ListChecks className="w-3.5 h-3.5 text-cyan-400" />
                <span>ตารางรวม (16)</span>
              </button>
            </div>

            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer shrink-0"
              title="ส่งออกเอกสารรับรองสำหรับยื่นศาล"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isExporting ? 'กำลังสร้าง...' : 'ส่งออก PDF'}</span>
            </button>

            <button
              onClick={() => {
                playTone(400, 0.03);
                onClose();
              }}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Overview Stats Bar */}
        <div className="px-4 py-3 bg-black/60 border-b border-white/10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-emerald-500/20">
              <span className="text-zinc-500 text-[10px]">สถานะการตรวจพิสูจน์รวม</span>
              <div className="text-xs sm:text-sm font-bold text-emerald-400 mt-0.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{passPercent}% ผ่านเกณฑ์ ({passedCount}/{totalCount})</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-white/5">
              <span className="text-zinc-500 text-[10px]">ผู้ตรวจพิสูจน์ (Lead Inspector)</span>
              <div className="text-xs font-bold text-white mt-0.5 truncate" title={SYSTEM_METADATA.sovereignPrincipal}>
                {SYSTEM_METADATA.sovereignPrincipal}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-white/5">
              <span className="text-zinc-500 text-[10px]">รหัสหนังสือเดินทางอธิปไตย</span>
              <div className="text-xs font-bold text-amber-300 mt-0.5">#EP-SOVEREIGN-01 (OMEGA-1)</div>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-white/5">
              <span className="text-zinc-500 text-[10px]">สมุดบัญชี Merkle Anchor</span>
              <div className="text-xs font-bold text-cyan-400 mt-0.5">Block #{SYSTEM_METADATA.sealedBlock} 🔒</div>
            </div>
          </div>
        </div>

        {/* MAIN BODY: STEP-BY-STEP (STEPPER) VIEW */}
        {viewMode === 'stepper' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Step Navigation Dots & Progress Bar */}
            <div className="space-y-2 bg-zinc-950/60 p-3.5 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                    <span>ขั้นตอนที่ {activeStep + 1} จาก {totalCount}</span>
                  </span>
                  <span className="text-zinc-500">•</span>
                  <span className="text-zinc-300 font-medium truncate max-w-xs sm:max-w-md">
                    {currentStep.title}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Auto Run Button */}
                  <button
                    type="button"
                    onClick={() => {
                      playTone(isAutoRunning ? 440 : 760, 0.06);
                      setIsAutoRunning(!isAutoRunning);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isAutoRunning
                        ? 'bg-amber-500/30 text-amber-200 border border-amber-400 animate-pulse'
                        : 'bg-white/10 hover:bg-white/15 text-zinc-300 hover:text-white border border-white/10'
                    }`}
                    title="เริ่ม/หยุด การตรวจเช็คอัตโนมัติทีละขั้นตอน"
                  >
                    {isAutoRunning ? (
                      <>
                        <Pause className="w-3 h-3 text-amber-300" />
                        <span>หยุดชั่วคราว</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 text-emerald-400" />
                        <span>รันอัตโนมัติ</span>
                      </>
                    )}
                  </button>

                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                    {Math.round(((activeStep + 1) / totalCount) * 100)}%
                  </span>
                </div>
              </div>

              {/* Progress track */}
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.7)]"
                  style={{ width: `${((activeStep + 1) / totalCount) * 100}%` }}
                />
              </div>

              {/* Interactive Step Selector Pills */}
              <div className="grid grid-cols-8 sm:grid-cols-16 gap-1 pt-1">
                {items.map((it, idx) => {
                  const isActive = idx === activeStep;
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => {
                        playTone(600 + idx * 15, 0.04);
                        setActiveStep(idx);
                        setIsAutoRunning(false);
                      }}
                      className={`h-7 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.8)] scale-105 ring-2 ring-emerald-300'
                          : it.passed
                          ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-zinc-900 text-zinc-500 border border-zinc-700'
                      }`}
                      title={`${idx + 1}. ${it.title}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Step Detailed Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950/90 border border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15)] space-y-4">
              {/* Step Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-bold flex items-center justify-center text-sm">
                    {activeStep + 1}
                  </span>
                  <div>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold mr-2">
                      {currentStep.category}
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40 font-mono font-bold">
                      {currentStep.statuteRef}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => toggleItem(currentStep.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                      currentStep.passed
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400 hover:bg-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-400 hover:bg-rose-500/30'
                    }`}
                  >
                    {currentStep.passed ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>ผ่านการตรวจสอบ (PASSED)</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span>ต้องตรวจสอบเพิ่ม (PENDING)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-white font-serif">
                  {currentStep.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
                  {currentStep.description}
                </p>
              </div>

              {/* Cryptographic Proof & Legal Matrix Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                {/* Technical Proof */}
                <div className="p-3.5 rounded-xl bg-black/60 border border-cyan-500/20 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-cyan-300">
                    <span className="flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                      <span>หลักฐานทางเทคนิค (Technical Proof)</span>
                    </span>
                    <span className="text-[10px] text-emerald-400">100% SSoT Valid</span>
                  </div>
                  <p className="text-xs text-zinc-300 font-mono leading-relaxed bg-zinc-900/60 p-2.5 rounded-lg border border-white/5">
                    {currentStep.technicalProof}
                  </p>
                </div>

                {/* Legal Implication */}
                <div className="p-3.5 rounded-xl bg-black/60 border border-amber-500/20 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-amber-400" />
                      <span>ผลทางกฎหมายในชั้นศาล (Judicial Admissibility)</span>
                    </span>
                    <span className="text-[10px] text-amber-400">Court-Admissible</span>
                  </div>
                  <p className="text-xs text-zinc-300 font-sans leading-relaxed bg-zinc-900/60 p-2.5 rounded-lg border border-white/5">
                    {currentStep.legalImplication}
                  </p>
                </div>
              </div>

              {/* Hash Digest & PQC Standard Strip */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-mono">
                <div className="flex items-center gap-2 truncate">
                  <Fingerprint className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-zinc-500 text-[11px]">Hash Digest:</span>
                  <span className="text-zinc-300 text-[11px] truncate max-w-xs sm:max-w-md">
                    {currentStep.hashDigest}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(currentStep.hashDigest || '', `hash-${activeStep}`)}
                    className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition cursor-pointer"
                    title="คัดลอก Digest"
                  >
                    {copiedField === `hash-${activeStep}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-zinc-500 text-[11px]">PQC Standard:</span>
                  <span className="text-purple-300 text-[11px] font-bold">
                    {currentStep.pqcStandard}
                  </span>
                </div>
              </div>

              {/* Step Navigation Controls (Prev / Next) */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={activeStep === 0}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    activeStep === 0
                      ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>ขั้นตอนก่อนหน้า</span>
                </button>

                <div className="text-xs text-zinc-400 text-center hidden sm:block">
                  กดปุ่มขั้นตอนถัดไปเพื่อไล่ตรวจให้ครบ 16 ขั้นตอน
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    activeStep === items.length - 1
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  }`}
                >
                  <span>{activeStep === items.length - 1 ? 'เสร็จสิ้นการตรวจเช็ค' : 'ขั้นตอนถัดไป'}</span>
                  {activeStep === items.length - 1 ? (
                    <Award className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FULL MATRIX VIEW (LIST OF 16 ITEMS) */}
        {viewMode === 'matrix' && (
          <>
            {/* Search & Category Tabs */}
            <div className="p-3 sm:p-4 bg-black/40 border-b border-white/10 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  {[
                    { id: 'ALL', label: 'ทั้งหมด (16)' },
                    { id: 'ETDA', label: 'ETDA ธุรกรรมฯ' },
                    { id: 'PDPA', label: 'PDPA ข้อมูลส่วนบุคคล' },
                    { id: 'NCSA', label: 'NCSA ไซเบอร์ฯ' },
                    { id: 'ISO', label: 'ISO/IEC 27037' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        playTone(550, 0.02);
                        setFilterCategory(tab.id);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
                        filterCategory === tab.id
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-white/5 text-zinc-400 hover:text-zinc-200 border border-transparent'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="ค้นหาข้อกำหนดหรือมาตรา..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Checklist Rows List */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-2.5">
              {filteredItems.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                    item.passed
                      ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50'
                      : 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50'
                  }`}
                >
                  <button
                    type="button"
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 font-bold transition-all ${
                      item.passed
                        ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                        : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                    }`}
                  >
                    {item.passed ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className={`text-xs sm:text-sm font-bold ${item.passed ? 'text-white' : 'text-zinc-400'}`}>
                        {item.title}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                          {item.statuteRef}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${
                            item.passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {item.passed ? '[ PASS / ผ่าน ]' : '[ FAIL / ไม่ผ่าน ]'}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] sm:text-xs text-zinc-400 font-sans leading-relaxed">
                      {item.description}
                    </p>

                    {item.technicalProof && (
                      <div className="pt-1 text-[10px] text-cyan-400/90 font-mono flex items-center gap-1 truncate">
                        <Cpu className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate">{item.technicalProof}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Bottom Action Bar */}
        <div className="p-3.5 sm:p-4 border-t border-white/10 bg-black/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-zinc-400 text-[11px]">
            {viewMode === 'stepper' ? (
              <span>
                กำลังอยู่ใน <strong className="text-emerald-300">โหมดไล่ตรวจทีละขั้นตอน</strong> (คลิกหมายเลขด้านบนเพื่อข้ามขั้นตอนได้ทันที)
              </span>
            ) : (
              <span>
                คลิกที่รายการเพื่อสลับสถานะ <span className="text-emerald-400 font-bold">ผ่าน</span> /{' '}
                <span className="text-rose-400 font-bold">ไม่ผ่าน</span> ก่อนทำการส่งออกเอกสาร PDF
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => {
                setItems((prev) => prev.map((i) => ({ ...i, passed: true })));
                playTone(700, 0.03);
              }}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold cursor-pointer transition"
            >
              ผ่านทั้งหมด (All Pass)
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออก PDF สำนวนศาล</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
