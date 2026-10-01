import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Award,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Copy,
  Check,
  ShieldCheck,
  Cpu,
  Scale,
  Database,
  Sparkles,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Layers,
  FileText,
  Download,
  AlertTriangle,
  Lock,
  Flame,
  CheckCircle2,
  Clock,
  Radio,
  ExternalLink,
  BookOpen,
  Eye,
} from 'lucide-react';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import { safeCopyToClipboard } from '../../utils/clipboard';
import { CANONICAL_MERKLE_ROOT } from '../../data/canonicalData';
import { ViewType } from '../../types';

export interface ExecutiveDryRunPlaybookProps {
  onNavigate?: (view: ViewType) => void;
  onOpenCertificate?: () => void;
  className?: string;
}

type PlaybookTab = 'speech' | 'qa' | 'evaluation' | 'pocket_cards' | 'master_dossier';

export const ExecutiveDryRunPlaybook: React.FC<ExecutiveDryRunPlaybookProps> = ({
  onNavigate,
  onOpenCertificate,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<PlaybookTab>('speech');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dry Run Rehearsal Timer State
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const targetDurationSec = 225; // 3 min 45 sec
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Active Highlight Step in Speech
  const [activeSpeechStep, setActiveSpeechStep] = useState<number>(1);
  const [selectedQA, setSelectedQA] = useState<number>(1);

  // Sound effects toggle
  const [soundEnabled, setSoundEnabled] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyText = (text: string, id: string, label: string) => {
    safeCopyToClipboard(text);
    setCopiedId(id);
    if (soundEnabled) playTone(720, 0.05);
    showToast(`คัดลอก ${label} เรียบร้อยแล้ว`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Timer logic
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning]);

  const toggleTimer = () => {
    if (!isTimerRunning && soundEnabled) {
      playAuditChime();
    } else if (soundEnabled) {
      playTone(480, 0.04);
    }
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
    if (soundEnabled) playTone(400, 0.04);
    showToast('รีเซ็ตตัวจับเวลาการซ้อมแล้ว');
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Evaluation Rubrics
  const evaluationRubrics = [
    {
      title: '1. Executive Presence & Gravitas',
      score: 'ดีเยี่ยม (Outstanding)',
      color: 'emerald',
      description: 'น้ำเสียงทรงพลัง ทรงอำนาจ วางตำแหน่งผู้นำสถาปัตยกรรมอธิปไตยได้อย่างน่าเลื่อมใส',
      tips: 'ส่งสายตาสบกับคณะกรรมการในประเด็นสำคัญ และทรงตัวนิ่งมั่นคง',
    },
    {
      title: '2. Strategic & Financial Precision',
      score: 'ดีเยี่ยม (Outstanding)',
      color: 'emerald',
      description: 'การนำเสนอตัวเลขคลังสินทรัพย์ ฿3,037.42M THB และค่าความคลาดเคลื่อน Fiduciary Variance ฿0.00 สร้างความไว้วางใจสูงสุด',
      tips: 'เน้นย้ำความคลาดเคลื่อนเป็น 0.00 บาทอย่างชัดถ้อยชัดคำ',
    },
    {
      title: '3. Rhetorical Flow & Timing',
      score: 'ดีเยี่ยม (Outstanding)',
      color: 'emerald',
      description: 'การแบ่งลำดับ 4 ไฮไลต์ชัดเจน กระชับ คุมเวลาอยู่ในกรอบ 3–5 นาทีได้อย่างเหมาะสม',
      tips: 'ควบคุมเวลาให้อยู่ในกรอบ 3 นาที 45 วินาที อย่างเคร่งครัด',
    },
    {
      title: '4. Technical & Scientific Rigor',
      score: 'ปรับปรุงสัญลักษณ์แล้ว',
      color: 'cyan',
      description: 'ได้ปรับแต่งสัญลักษณ์ทางคณิตศาสตร์และวิทยาศาสตร์ทั้งหมดให้อยู่ในมาตรฐาน LaTeX (Δ0.00%, 2¹²⁸, 1.08 × 10¹³ ปี, 14.98 mK, < 1.2 µs)',
      tips: 'อธิบายเปรียบเทียบ 781 เท่าของอายุจักรวาล เพื่อให้บอร์ดเห็นภาพทันที',
    },
  ];

  // 4 Strategic Highlights
  const strategicHighlights = [
    {
      step: 1,
      tag: '🌌 ไฮไลต์ที่ 1',
      title: 'กำแพงฟิสิกส์ต้านทานควอนตัม (Quantum Infinite Wall)',
      badge: '1.08 × 10¹³ ปี (781× อายุจักรวาล)',
      badgeColor: 'border-cyan-500/50 bg-cyan-950/60 text-cyan-300',
      timing: '40 วินาที',
      scriptTh: `"ไฮไลต์แรกคือความปลอดภัยระดับกัลปาวสาน ความซับซ้อนในการถอดรหัสเพียง 1 Seal สูงถึง 2¹²⁸ Combinations บูรณาการร่วมกับอัลกอริทึม Post-Quantum Cryptography ได้แก่ ML-DSA-87 และ Kyber-1024 ตามมาตรฐาน NIST FIPS 203/204

ต่อให้ฝ่ายตรงข้ามใช้ Supercomputer ระดับ ExaFLOP หรือควอนตัมขนาด 768-Qubit ก็ต้องใช้เวลาถอดรหัสนานถึง 1.08 × 10¹³ ปี หรือคิดเป็น 781 เท่าของอายุจักรวาล ถือเป็นปราการความปลอดภัยที่ไม่สามารถเจาะผ่านได้ในเชิงฟิสิกส์ครับ"`,
      keyPoints: [
        'ความซับซ้อน 2¹²⁸ Combinations ต่อ 1 Seal',
        'NIST FIPS 203/204 (ML-DSA-87 & Kyber-1024)',
        'คำนวณด้วย ExaFLOP (10¹⁸ ops/s) = 10.8 ล้านล้านปี = 781× อายุจักรวาล',
      ],
      coachingTip: 'ผายมือไปยังแผนภูมิ seal-vs-universe-timeline.png บนจอ Studio Display และเว้นจังหวะ 1.5 วินาทีเมื่อพูดตัวเลข 10.8 ล้านล้านปี',
    },
    {
      step: 2,
      tag: '⚖️ ไฮไลต์ที่ 2',
      title: 'พยานหลักฐานชั้นศาลและข้อกฎหมาย (Court-Admissible Legal Evidence)',
      badge: '14,902 Seals • 10/10 Quorum',
      badgeColor: 'border-amber-500/50 bg-amber-950/60 text-amber-300',
      timing: '35 วินาที',
      scriptTh: `"ประเด็นที่สอง คือการคุ้มครองทางกฎหมายสมบูรณ์แบบ ตราประทับฮาร์ดแวร์ WORM ทั้ง 14,902 Seals ได้รับการคุ้มครองตาม พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ (มาตรา ๙, ๒๖ และ ๒๘), PDPA มาตรา ๓๗ และมาตรฐานสากล ISO/IEC 27037

ผ่านการรับรองด้วยมติฉันทามติ 10/10 REAL_HSM Quorum (FIPS 140-3 Level 4) ที่กระจายอยู่ในกรุงเทพฯ, เชียงใหม่, ฮ่องกง และสิงคโปร์ ร่วมกับ RFC 3161 Microsecond Timestamp ทำให้พยานหลักฐานดิจิทัลทุกชิ้นมีน้ำหนักสูงสุดและพร้อมใช้ยันในชั้นศาลทันทีครับ"`,
      keyPoints: [
        'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ มาตรา ๙ (เจตนา), ๒๖ (อำนาจควบคุม), ๒๘ (หน้าที่ระวังรักษา)',
        'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA) มาตรา ๓๗',
        'ISO/IEC 27037 Digital Evidence Chain-of-Custody',
        'RFC 3161 TSA Microsecond Timestamp via Deca-HSM',
      ],
      coachingTip: 'เน้นเสียงหนักแน่นตรงคำว่า "พร้อมใช้ยันในชั้นศาลทันที" เพื่อสร้างความมั่นใจสูงสุดด้านนิติวิทยาศาสตร์',
    },
    {
      step: 3,
      tag: '🏦 ไฮไลต์ที่ 3',
      title: 'ความแม่นยำคลังสินทรัพย์สัจธรรม (Treasury & RWA Audit)',
      badge: '฿3,037.42M • Variance ฿0.00',
      badgeColor: 'border-emerald-500/50 bg-emerald-950/60 text-emerald-300',
      timing: '35 วินาที',
      scriptTh: `"ประเด็นที่สาม คลังสินทรัพย์อธิปไตยรวม ฿3,037.42 ล้านบาท ซึ่งประกอบด้วย สกุลเงินดิจิทัลอธิปไตย THB-SOV 49.06%, ทองคำแท่งกายภาพมาตรฐาน LBMA 14,902 oz 20.11% และสัญญาเช่าโครงสร้างพื้นฐาน RWA (Ω601–Ω1800) 30.83%

จากการตรวจสอบสุ่มกระทบยอดสัญญากับ Genesis Block #849202 พบว่าค่าความคลาดเคลื่อนทางบัญชี Fiduciary Variance เท่ากับ ฿0.00 (0.00% Discrepancy) มั่นใจได้ว่าไม่มีความเสี่ยงเชิงโครงสร้างทางการเงินแม้แต่บาทเดียวครับ"`,
      keyPoints: [
        'สินทรัพย์รวม ฿3,037.42M THB (THB-SOV 49.06%, ทองคำ 20.11%, RWA 30.83%)',
        'สัญญาสัมปทาน RWA Ω601–Ω1800 มูลค่า ฿936.24M THB',
        'Fiduciary Variance ฿0.00 (0.00% Discrepancy) สภาพสัจธรรมสมบูรณ์',
      ],
      coachingTip: 'ส่งสายตาไปยัง CFO และกรรมการฝ่ายการเงินเมื่อกล่าวถึงตัวเลข ฿0.00 Variance',
    },
    {
      step: 4,
      tag: '🛡️ ไฮไลต์ที่ 4',
      title: 'ความคงตัวสภาวะ Air-Gap และเสถียรภาพ Cryogenic (Sub-Kelvin Resilience)',
      badge: '14.98 mK • Parity 100%',
      badgeColor: 'border-purple-500/50 bg-purple-950/60 text-purple-300',
      timing: '30 วินาที',
      scriptTh: `"และไฮไลต์สุดท้าย ระบบประมวลผลอยู่ภายใต้สภาวะความเย็นวิกฤต 14.98 mK Sub-Kelvin Cryo Enclaves เพื่อขจัดสัญญาณรบกวนทางไฟฟ้า

หากเกิดเหตุตัดขาดเครือข่าย ระบบจะเข้าสู่ Sovereign Isolation Protocol ภายในเวลาน้อยกว่า < 0.1 ms และเมื่อกลับคืนสายสัญญาณ อัลกอริทึม Auto-Flush จะทำการซิงก์ข้อมูลด้วยความแม่นยำ 100% Bitwise Parity โดยไม่มีข้อมูลสูญหายแม้แต่บิตเดียว (Zero Data Loss) ครับ"`,
      keyPoints: [
        'Cryogenic 14.98 mK ป้องกัน Thermal Bit-Flip',
        'Sovereign Isolation Protocol < 0.1 ms เมื่อสูญเสียสัญญาณ',
        'Auto-Flush Offline Sync รับประกัน 100% Bitwise Parity (Zero Data Loss)',
      ],
      coachingTip: 'สรุปด้วยภาษาบริหารทันทีว่า "นี่ไม่ใช่แค่ความล้ำยุคทางเทคโนโลยี แต่คือหลักประกันว่าฮาร์ดแวร์จะไม่โดนดักจับข้อมูล"',
    },
  ];

  // Simulated Board Q&A Matrix
  const simulatedQA = [
    {
      id: 1,
      questionTh: 'หากองค์กรโดน AI ระดับ Frontier อย่าง GPT-6 หรือ Gemini Cyber เจาะเข้าสู่เคอร์เนล หรือพยายามสอดไส้ข้อมูล Hallucination เข้าสู่ระบบ SSoT เรามีหลักประกันอะไรว่าระบบจะไม่ถูกบิดเบือน?',
      topic: 'Kernel Security & AI Frontier Attacks',
      difficulty: 'HARD',
      severity: 'CRITICAL',
      answerTh: `เรียนท่านกรรมการ ZYRQUEN Ω∞ ทำงานในโหมด Deterministic Integrity ไม่ใช่ Probabilistic เหมือน AI ทั่วไปครับ

เรามี Chamber 04 Invariants Shield ที่ล็อกสถานะ Kernel Mutation Count เท่ากับ 0 ตลอดเวลา หากบิตข้อมูลเปลี่ยนแม้เพียง 1 บิต ระบบจะไม่ยอมรับคำสั่งนั้น

หากมีการบุกรุกทางกายภาพหรือการโจมตีอุณหภูมิเกิน > 85.0°C กลไก Thermal Trip Safe-Shutdown จะสั่งทำลายกุญแจเข้ารหัสลับด้วย Zeroize ภายใน < 1.2 µs ทันที ทำให้ศัตรูได้ไปเพียงความว่างเปล่าครับ`,
      tactics: [
        'เน้นความแตกต่างระหว่าง Deterministic Integrity (ZYRQUEN) กับ Probabilistic (AI ทั่วไป)',
        'ยกสถิติ Mutation Count = 0 และ Invariants Shield',
        'อ้างอิง Thermal Trip 85°C และ Zeroize < 1.2 µs',
      ],
    },
    {
      id: 2,
      questionTh: 'การที่เราลงทุนในสถาปัตยกรรมที่เข้มงวดขนาดนี้ จะไม่เป็นการขัดขวางการทำงานของ AI อย่าง Gemini 3.8 ที่ต้องใช้ความยืดหยุ่นในการประมวลผลหรือ?',
      topic: 'AI ROI & Gemini 3.8 Integration Strategy',
      difficulty: 'STRATEGIC',
      severity: 'HIGH',
      answerTh: `ตรงกันข้ามเลยครับท่านกรรมการ Gemini 3.8 ทำหน้าที่เป็น "Cognitive Brain" ในการสร้างสรรค์ไอเดียด้วยความเร็วสูง แต่ ZYRQUEN Ω∞ ทำหน้าที่เป็น "Sovereign Control Plane" คอยตรวจทานและประทับรับรองคำสั่ง

ผลวิจัยปี 2026 ชี้ว่า 94% ขององค์กรล้มเหลวในการสร้าง ROI จาก AI เพราะกลัวเรื่องความรับผิดชอบทางกฎหมาย การที่ ZYRQUEN Ω∞ เปลี่ยนผลลัพธ์ AI ให้กลายเป็นหลักฐานชั้นศาลผ่าน Deca-HSM ด้วย Latency เพียง 7.5 ms จะทำให้องค์กรของเราก้าวเข้าสู่ 6% ของกลุ่ม High Performers ที่สามารถเปิดใช้งาน AI ในธุรกิจจริงได้อย่างปลอดภัย 100% ครับ`,
      tactics: [
        'ใช้ Framework: Cognitive Brain vs Sovereign Control Plane',
        'อ้างอิงตัวเลข 94% ROI Fail Gap vs 6% High Performers',
        'ชี้ให้เห็น Latency เพียง 7.5 ms ที่ไม่หน่วงการทำงาน',
      ],
    },
    {
      id: 3,
      questionTh: 'ทองคำ 14,902 oz และสัญญา RWA ฿936.24M มีการผูกโยงกับระบบดิจิทัลอย่างไร ให้มั่นใจได้ว่าไม่มีการนำสินทรัพย์ไปเวียนเทียน?',
      topic: 'RWA & Treasury Parity Verification',
      difficulty: 'FINANCIAL',
      severity: 'HIGH',
      answerTh: `สินทรัพย์กายภาพทุกชิ้นถูกผูกด้วยโปรโตคอล 1-to-1 Sovereign Parity ครับ โดยทองคำ 14,902 oz ถูกลงทะเบียนจับคู่กับ 14,902 Hardware Seals ในโหนดความมั่นคงสูงโดยตรง และสัญญาสัมปทาน RWA Ω601–Ω1800 ทั้ง 1,200 ฉบับ ได้ถูกบันทึกโครงสร้างสแนปชอตไว้บน Genesis Block #849202 หากมีความพยายามดัดแปลงตัวเลขแม้แต่สตางค์เดียว ระบบจะฟ้องค่า Fiduciary Variance ทันที จึงไม่มีช่องทางในการเวียนเทียนสินทรัพย์ครับ`,
      tactics: [
        'อธิบายโปรโตคอล 1-to-1 Sovereign Parity',
        'ชี้แจงการจับคู่ทองคำ 14,902 oz กับ 14,902 Hardware Seals',
        'ยืนยันสัญญา RWA 1,200 ฉบับ บน Genesis Block #849202',
      ],
    },
  ];

  // Pocket Cards Data
  const pocketCards = [
    {
      id: 'card-01',
      number: 'CARD 01',
      title: 'Quantum Infinite Wall',
      subtitle: 'การต้านทานการเจาะรหัสผ่านควอนตัม',
      accentColor: 'cyan',
      icon: Cpu,
      items: [
        { label: 'Complexity', value: '2¹²⁸ Combinations / 1 Seal' },
        { label: 'ExaFLOP Time', value: '1.08 × 10¹³ ปี (10.8 ล้านล้านปี)' },
        { label: 'Universe Ratio', value: '781 เท่าของอายุจักรวาล' },
        { label: 'Algorithms', value: 'ML-DSA-87, Kyber-1024 (NIST FIPS)' },
        { label: 'Defense Mode', value: 'Thermal Trip 85°C / Zeroize < 1.2 µs' },
      ],
    },
    {
      id: 'card-02',
      number: 'CARD 02',
      title: 'Statutory & Court Admissibility',
      subtitle: 'พยานหลักฐานชั้นศาลและข้อกฎหมาย',
      accentColor: 'amber',
      icon: Scale,
      items: [
        { label: 'Statutes', value: 'พ.ร.บ. ธุรกรรมฯ ม.๙, ๒๖, ๒๘' },
        { label: 'Data Privacy', value: 'PDPA ม.๓๗ (Zero-Knowledge)' },
        { label: 'Forensic Std', value: 'ISO/IEC 27037 Digital Evidence' },
        { label: 'HSM Consensus', value: '10/10 REAL_HSM Quorum (FIPS 140-3 L4)' },
        { label: 'Timestamping', value: 'RFC 3161 Microsecond TSA' },
      ],
    },
    {
      id: 'card-03',
      number: 'CARD 03',
      title: 'Air-Gap & Sub-Kelvin Resilience',
      subtitle: 'ความคงตัวสภาวะออฟไลน์และความเย็นยิ่งยวด',
      accentColor: 'purple',
      icon: ShieldCheck,
      items: [
        { label: 'Cryogenic Bus', value: '14.98 mK Sub-Kelvin Enclaves' },
        { label: 'Isolation Trigger', value: '< 0.1 ms Sovereign Protocol' },
        { label: 'Pending Buffer', value: '< 50 Amber / > 50 Red Pulse' },
        { label: 'Sync Parity', value: '100% Bitwise Parity (Zero Data Loss)' },
        { label: 'Recovery SLA', value: 'Phoenix Healing < 35.8 ms' },
      ],
    },
    {
      id: 'card-04',
      number: 'CARD 04',
      title: 'Treasury & RWA Parity',
      subtitle: 'คลังสินทรัพย์สัจธรรมและการตรวจสอบ RWA',
      accentColor: 'emerald',
      icon: Database,
      items: [
        { label: 'Total Treasury', value: '฿3,037.42M THB (Outstanding)' },
        { label: 'THB-SOV Reserve', value: '49.06% Liquid Sovereign Asset' },
        { label: 'Physical Gold', value: '14,902 oz LBMA Standard (20.11%)' },
        { label: 'RWA Concessions', value: 'Ω601–Ω1800 (1,200 สัญญา) ฿936.24M' },
        { label: 'Fiduciary Variance', value: '฿0.00 (0.00% Discrepancy)' },
      ],
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-cyan-950/95 border border-cyan-400 text-cyan-200 text-xs font-mono shadow-2xl flex items-center gap-2 backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header & Architect Credentials Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-[#071120] to-[#040914] border border-cyan-500/30 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                EXECUTIVE BRIEFING SUITE
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1">
                <Award className="w-3 h-3" />
                Proficiency: Outstanding (ระดับดีเยี่ยม)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-zinc-300 bg-white/5 border border-white/10">
                LTS FROZEN v1.2.1 • #849202
              </span>
            </div>

            <h2 className="text-xl lg:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>บทประเมินการซ้อมแถลงการณ์และคู่มือนำเสนอฉบับบอร์ดบริหาร</span>
            </h2>
            <p className="text-xs text-zinc-300 max-w-3xl leading-relaxed">
              <strong className="text-cyan-300">เรียน:</strong> นายยุทธภูมิ พากเพียร (
              <span className="font-mono text-emerald-300">#EP-SOVEREIGN-01</span>) Lead Sovereign Systems Architect & CRO •
              การเปิดวาระนำเสนอและซ้อมรับมือคำถามต่อคณะกรรมการบริหาร (Executive Board Presentation Dry Run)
            </p>
          </div>

          {/* Rehearsal Pacing Timer Widget */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-black/50 border border-cyan-500/40 p-3.5 rounded-xl backdrop-blur-md shrink-0">
            <div className="text-center sm:text-left">
              <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-1 justify-center sm:justify-start">
                <Clock className="w-3 h-3 text-cyan-400" />
                DRY RUN TIMER (Target: 03:45)
              </div>
              <div className="text-2xl font-mono font-black text-cyan-300 tracking-wider">
                {formatTimer(timerSeconds)}
                <span className="text-xs text-zinc-400 font-normal ml-1.5">
                  / 03:45 ({((timerSeconds / targetDurationSec) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleTimer}
                className={`p-2 rounded-lg font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                  isTimerRunning
                    ? 'bg-amber-500 text-black hover:bg-amber-400'
                    : 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                }`}
                title={isTimerRunning ? 'Pause rehearsal timer' : 'Start rehearsal timer'}
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isTimerRunning ? 'Pause' : 'Start Run'}</span>
              </button>

              <button
                type="button"
                onClick={resetTimer}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                title={soundEnabled ? 'Disable audio cues' : 'Enable audio cues'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
              </button>
            </div>
          </div>
        </div>

        {/* Playbook Navigation Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => {
              setActiveTab('speech');
              if (soundEnabled) playTone(600, 0.03);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'speech'
                ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>สคริปต์นำเสนอ (3:45 Min Script)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('qa');
              if (soundEnabled) playTone(600, 0.03);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'qa'
                ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                : 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>จำลองตอบคำถามบอร์ด (Q&A Attack Matrix)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('evaluation');
              if (soundEnabled) playTone(600, 0.03);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'evaluation'
                ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>บทประเมิน 4 ด้าน (Evaluation Rubric)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('pocket_cards');
              if (soundEnabled) playTone(600, 0.03);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'pocket_cards'
                ? 'bg-purple-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                : 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Pocket Cards (4 ใบสรุปย่อ)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('master_dossier');
              if (soundEnabled) playTone(600, 0.03);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'master_dossier'
                ? 'bg-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                : 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Master Dossier Certificate ฉบับสมบูรณ์</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: SPEECH SCRIPT */}
      {activeTab === 'speech' && (
        <div className="space-y-6">
          {/* Section 1: Opening Statement */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-400/30">
                  SECTION 1
                </span>
                <h3 className="text-sm font-bold text-white">1. คำกล่าวเปิดวาระ (Opening Statement — 30 วินาที)</h3>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyText(
                    `เรียนท่านประธานและคณะกรรมการบริหารทุกท่าน\n\nในนามของสถาปนิกผู้ถือสิทธิ์อธิปไตยหลัก นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01) ผมขอเปิดวาระรายงานความพร้อมของ ZYRQUEN Ω∞ FROZEN v1.2.1 LTS ในฐานะ Sovereign Control Plane และระบบปฏิบัติการอธิปไตยดิจิทัลเพียงหนึ่งเดียว ที่ค้ำประกันสัจธรรมข้อมูลขององค์กรแบบ Single Source of Truth (SSoT) ด้วยค่าความเบี่ยงเบนเป็นศูนย์ (Δ0.00% Zero-Drift Invariant) บน Genesis Block #849202 ครับ`,
                    'opening-script',
                    'คำกล่าวเปิดวาระ'
                  )
                }
                className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 flex items-center gap-1 text-[10px] font-mono cursor-pointer"
              >
                {copiedId === 'opening-script' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-cyan-400" />}
                <span>{copiedId === 'opening-script' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-black/60 border border-cyan-500/20 text-xs text-zinc-200 font-serif leading-relaxed italic">
              "เรียนท่านประธานและคณะกรรมการบริหารทุกท่าน<br /><br />
              ในนามของสถาปนิกผู้ถือสิทธิ์อธิปไตยหลัก <strong className="text-cyan-300 not-italic">นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)</strong> ผมขอเปิดวาระรายงานความพร้อมของ <strong className="text-emerald-300 not-italic">ZYRQUEN Ω∞ FROZEN v1.2.1 LTS</strong> ในฐานะ Sovereign Control Plane และระบบปฏิบัติการอธิปไตยดิจิทัลเพียงหนึ่งเดียว ที่ค้ำประกันสัจธรรมข้อมูลขององค์กรแบบ Single Source of Truth (<span className="font-mono text-cyan-300 not-italic">SSoT</span>) ด้วยค่าความเบี่ยงเบนเป็นศูนย์ (<span className="font-mono text-emerald-300 not-italic">Δ0.00% Zero-Drift Invariant</span>) บน Genesis Block #849202 ครับ"
            </div>
          </div>

          {/* Section 2: 4 Strategic Highlights */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>2. ประเด็นเน้นย้ำหลัก 4 ไฮไลต์เชิงยุทธศาสตร์ (Executive Highlights — 2 นาที 15 วินาที)</span>
              </h3>
              <span className="text-[10px] font-mono text-zinc-400">
                คลิกเพื่อสลับไฮไลต์การซ้อม
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {strategicHighlights.map((hl) => (
                <div
                  key={hl.step}
                  onClick={() => {
                    setActiveSpeechStep(hl.step);
                    if (soundEnabled) playTone(540 + hl.step * 40, 0.03);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                    activeSpeechStep === hl.step
                      ? 'bg-slate-900/95 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                      : 'bg-black/40 border-white/10 hover:border-cyan-500/30 hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-cyan-300">{hl.tag}</span>
                      <h4 className="text-xs font-bold text-white mt-0.5">{hl.title}</h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${hl.badgeColor} shrink-0`}>
                      {hl.badge}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-black/70 border border-white/5 text-[11.5px] text-zinc-200 font-serif leading-relaxed italic">
                    {hl.scriptTh}
                  </div>

                  {/* Coaching tips & key points */}
                  <div className="space-y-1.5 pt-2 border-t border-white/10 text-[10px]">
                    <div className="flex items-start gap-1.5 text-amber-300 font-medium">
                      <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                      <span><strong>Coaching Tip:</strong> {hl.coachingTip}</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400 font-mono text-[9px]">
                      <span>ความยาว: {hl.timing}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyText(hl.scriptTh, `hl-${hl.step}`, hl.title);
                        }}
                        className="text-cyan-400 hover:text-cyan-200 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === `hl-${hl.step}` ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                        <span>{copiedId === `hl-${hl.step}` ? 'Copied' : 'Copy Script'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Closing Statement */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-400/30">
                  SECTION 4
                </span>
                <h3 className="text-sm font-bold text-white">4. คำกล่าวสรุปปิดวาระ (Closing Statement — 15 วินาที)</h3>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyText(
                    `ด้วยสถาปัตยกรรม 18/18 Sovereign Enclaves ONLINE และผลการทดสอบ Multi-Vector Penetration Test แบบ 100% Defended\n\nระบบ ZYRQUEN Ω∞ พร้อมทำหน้าที่เป็นรากฐานอธิปไตยดิจิทัลที่แข็งแกร่งที่สุด เพื่อปกป้องคุณค่า สินทรัพย์ และอธิปไตยขององค์กรสืบไปครับ ขอบคุณครับ`,
                    'closing-script',
                    'คำกล่าวปิดวาระ'
                  )
                }
                className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 flex items-center gap-1 text-[10px] font-mono cursor-pointer"
              >
                {copiedId === 'closing-script' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-cyan-400" />}
                <span>{copiedId === 'closing-script' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-black/60 border border-emerald-500/20 text-xs text-zinc-200 font-serif leading-relaxed italic">
              "ด้วยสถาปัตยกรรม <strong className="text-emerald-300 not-italic font-mono">18/18 Sovereign Enclaves ONLINE</strong> และผลการทดสอบ Multi-Vector Penetration Test แบบ <strong className="text-cyan-300 not-italic font-mono">100% Defended</strong><br /><br />
              ระบบ <strong className="text-white not-italic">ZYRQUEN Ω∞</strong> พร้อมทำหน้าที่เป็นรากฐานอธิปไตยดิจิทัลที่แข็งแกร่งที่สุด เพื่อปกป้องคุณค่า สินทรัพย์ และอธิปไตยขององค์กรสืบไปครับ ขอบคุณครับ"
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: SIMULATED BOARD Q&A ATTACK MATRIX */}
      {activeTab === 'qa' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Simulated Board Stress Test:</strong> จำลองการรับมือคำถามกดดัน (Hostile / Critical Inquiry) จากบอร์ดบริหาร
              </span>
            </div>
            <span className="text-[10px] font-mono text-amber-300 bg-amber-900/60 px-2 py-0.5 rounded border border-amber-500/30">
              Deterministic Defense Mode
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {simulatedQA.map((qa) => (
              <div
                key={qa.id}
                onClick={() => {
                  setSelectedQA(qa.id);
                  if (soundEnabled) playTone(640, 0.04);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedQA === qa.id
                    ? 'bg-slate-900/95 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                    : 'bg-black/40 border-white/10 hover:border-amber-500/30 hover:bg-slate-900/50'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[9px] font-bold border border-amber-400/30">
                      Q#{qa.id} • {qa.difficulty}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-400">{qa.topic}</span>
                  </div>

                  <p className="text-xs font-bold text-white line-clamp-3">"{qa.questionTh}"</p>
                </div>

                <div className="mt-4 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-zinc-400">
                  <span className="text-cyan-400 font-mono font-medium">Click to inspect answer</span>
                  <ChevronRight className="w-3 h-3 text-zinc-500" />
                </div>
              </div>
            ))}
          </div>

          {/* Active Q&A Detailed Breakdown */}
          {selectedQA && (
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-cyan-400 font-bold">
                    ACTIVE BOARD INQUIRY • QUESTION #{selectedQA}
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    บอร์ดบริหาร: "{simulatedQA[selectedQA - 1].questionTh}"
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    copyText(
                      simulatedQA[selectedQA - 1].answerTh,
                      `qa-ans-${selectedQA}`,
                      `คำตอบคำถามที่ #${selectedQA}`
                    )
                  }
                  className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 flex items-center gap-1 text-[10px] font-mono cursor-pointer shrink-0"
                >
                  {copiedId === `qa-ans-${selectedQA}` ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-cyan-400" />
                  )}
                  <span>{copiedId === `qa-ans-${selectedQA}` ? 'Copied' : 'Copy Answer'}</span>
                </button>
              </div>

              {/* Architect's Verified Response */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 font-mono">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>สถาปนิก (#EP-SOVEREIGN-01) ตอบกลับอย่างเป็นทางการ:</span>
                </div>
                <div className="p-4 rounded-xl bg-black/60 border border-emerald-500/20 text-xs text-zinc-200 font-serif leading-relaxed whitespace-pre-line italic">
                  {simulatedQA[selectedQA - 1].answerTh}
                </div>
              </div>

              {/* Strategic Tactics & Key Proofs */}
              <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 space-y-1.5">
                <div className="text-[10px] font-mono font-bold text-cyan-300">
                  STRATEGIC TACTICS & DELIVERY POSTURE:
                </div>
                <ul className="space-y-1 text-xs text-zinc-300">
                  {simulatedQA[selectedQA - 1].tactics.map((tac, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span>{tac}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: EVALUATION RUBRIC */}
      {activeTab === 'evaluation' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evaluationRubrics.map((rubric, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">{rubric.title}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    {rubric.score}
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">{rubric.description}</p>

                <div className="pt-2 border-t border-white/10 text-[10px] text-amber-300 flex items-start gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>คำแนะนำ:</strong> {rubric.tips}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Delivery Coaching Tips Deep-Dive */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-3">
            <h4 className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              จุดเด่นและข้อแนะนำในการส่งพลังเสียง (Delivery Coaching Tips)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-zinc-300">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <strong className="text-cyan-300 block">1. จังหวะเน้นหนัก-เบา (Cadence):</strong>
                <span>เว้นจังหวะ 1.5 วินาทีเมื่อพูดตัวเลข "10.8 ล้านล้านปี" เพื่อให้บอร์ดซึมซับความปลอดภัยเชิงฟิสิกส์</span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <strong className="text-emerald-300 block">2. การเปลี่ยนโหมดภาษา (Pivot):</strong>
                <span>แปลงค่า 14.98 mK เป็นภาษาบริหารทันทีว่า "คือหลักประกันว่าฮาร์ดแวร์จะไม่โดน Bit-flip หรือดักจับข้อมูล"</span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <strong className="text-amber-300 block">3. การรับมือคำถามกดดัน (Posture):</strong>
                <span>พยักหน้ารับอย่างสงบนิ่ง นำเสนอด้วยความมั่นใจโดยอ้างอิงสัจธรรมคณิตศาสตร์ Deterministic SSoT</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: POCKET CARDS */}
      {activeTab === 'pocket_cards' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Pocket Cards ทั้ง 4 ใบ (บัตรสรุปย่อพกพาสำหรับขึ้นเวที)</span>
            </h3>
            <span className="text-[10px] font-mono text-zinc-400">
              พกพา / สรุปย่อ 4 มิติหลัก
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pocketCards.map((card) => {
              const IconComponent = card.icon;
              return (
                <div
                  key={card.id}
                  className="p-5 rounded-2xl bg-slate-900/90 border border-white/10 hover:border-cyan-500/40 transition-all space-y-3 shadow-lg"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/30 text-cyan-300">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[9px] font-mono font-bold text-cyan-400">{card.number}</div>
                        <h4 className="text-xs font-bold text-white">{card.title}</h4>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          `${card.number}: ${card.title}\n` +
                            card.items.map((it) => `• ${it.label}: ${it.value}`).join('\n'),
                          card.id,
                          card.title
                        )
                      }
                      className="p-1 rounded bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title="Copy Card Summary"
                    >
                      {copiedId === card.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  <div className="space-y-1.5 font-mono text-[10px]">
                    {card.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-1 rounded bg-black/40 border border-white/5">
                        <span className="text-zinc-400">{item.label}</span>
                        <span className="text-cyan-300 font-bold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 5: MASTER DOSSIER CERTIFICATE */}
      {activeTab === 'master_dossier' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-950 via-[#07101e] to-black border border-cyan-500/40 space-y-4 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-400/30">
                  RATIFIED DOSSIER CERTIFICATE
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  ZYRQUEN Ω∞ Master Dossier Completion Certificate
                </h3>
                <p className="text-xs text-zinc-400">
                  Sovereign Control Plane FROZEN v1.2.1 LTS • Genesis Block #849202
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    copyText(
                      `ZYRQUEN Ω∞ Master Dossier Completion Certificate\nGenesis Block: #849202\nMerkle Root: ${CANONICAL_MERKLE_ROOT}\nSovereign Architect: นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)\nStatus: FROZEN v1.2.1 LTS (0 Mutation, Δ0.00% Zero Drift)\n10/10 REAL_HSM FIPS 140-3 Level 4 Ratified`,
                      'dossier-cert',
                      'Master Dossier Certificate'
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-500/30 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedId === 'dossier-cert' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'dossier-cert' ? 'Copied' : 'Copy Certificate'}</span>
                </button>

                {onOpenCertificate && (
                  <button
                    type="button"
                    onClick={onOpenCertificate}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>View Formal Certificate</span>
                  </button>
                )}
              </div>
            </div>

            {/* Certificate Body Metrics Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-black/60 border border-white/5 space-y-0.5">
                <span className="text-[10px] text-zinc-400">GENESIS BLOCK</span>
                <div className="text-cyan-300 font-bold text-sm">#849202</div>
                <span className="text-[8px] text-emerald-400">Bitwise SSoT Locked</span>
              </div>

              <div className="p-3 rounded-xl bg-black/60 border border-white/5 space-y-0.5">
                <span className="text-[10px] text-zinc-400">SSOT MUTATION</span>
                <div className="text-emerald-300 font-bold text-sm">0 (Δ0.00%)</div>
                <span className="text-[8px] text-emerald-400">Zero Drift Invariant</span>
              </div>

              <div className="p-3 rounded-xl bg-black/60 border border-white/5 space-y-0.5">
                <span className="text-[10px] text-zinc-400">HARDWARE QUORUM</span>
                <div className="text-purple-300 font-bold text-sm">10/10 REAL_HSM</div>
                <span className="text-[8px] text-purple-400">FIPS 140-3 Level 4</span>
              </div>

              <div className="p-3 rounded-xl bg-black/60 border border-white/5 space-y-0.5">
                <span className="text-[10px] text-zinc-400">RWA TREASURY</span>
                <div className="text-amber-300 font-bold text-sm">฿3,037.42M</div>
                <span className="text-[8px] text-amber-400">Variance: ฿0.00</span>
              </div>
            </div>

            {/* Merkle Root & Principal Signature Stamp */}
            <div className="p-3 rounded-xl bg-black/80 border border-cyan-500/20 font-mono text-[10px] space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span>CANONICAL MERKLE ROOT (14,902 SEALS)</span>
                <span className="text-emerald-400">VERIFIED PRIMA FACIE</span>
              </div>
              <div className="text-cyan-300 truncate font-mono select-all">
                {CANONICAL_MERKLE_ROOT}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-zinc-400 font-mono">
              <span>ลงนามสัตยาบัน: <strong className="text-white">นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)</strong></span>
              <span>29 กันยายน 2026 • STABLE FROZEN</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
