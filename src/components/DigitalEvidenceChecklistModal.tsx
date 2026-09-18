import React, { useState } from 'react';
import { motion } from 'motion/react';
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
} from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';
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
    description: 'ตรวจสอบบันทึกการยืนยันตัวตนของผู้ทำรายการผ่านระบบรับรองกุญแจสองชั้น (Dual-Key Auth) หรือใบรับรองอิเล็กทรอนิกส์',
    passed: true,
  },
  {
    id: 'CHK-02-INTENT',
    category: 'ETDA พ.ร.บ. ธุรกรรมฯ',
    statuteRef: 'มาตรา ๙',
    title: '2. การแสดงเจตนาผูกพันทางกฎหมาย (Legal Intent)',
    description: 'ตรวจสอบบันทึกเจตนาผูกพันในการทำธุรกรรม การกดยืนยัน และสภาวะแวดล้อมที่แสดงเจตนาชัดแจ้งโดยปราศจากการบังคับขู่เข็ญ',
    passed: true,
  },
  {
    id: 'CHK-03-TIMESTAMP',
    category: 'ETDA พ.ร.บ. ธุรกรรมฯ',
    statuteRef: 'มาตรา ๙ / RFC 3161',
    title: '3. ตราประทับเวลาสากลที่เชื่อถือได้ (Trusted Timestamping)',
    description: 'ตรวจสอบการผูกโยงเวลามาตรฐานสากล (RFC 3161 Timestamp Token) ณ ขณะเกิดรายการ ยืนยันความมีอยู่ของข้อมูลในเวลานั้น',
    passed: true,
  },

  // Module 2: Digital Signatures (ETDA Sec 26)
  {
    id: 'CHK-04-SIG-VALIDITY',
    category: 'ETDA พ.ร.บ. ธุรกรรมฯ',
    statuteRef: 'มาตรา ๒๖',
    title: '4. ความสมบูรณ์ของลายมือชื่อดิจิทัล (Signature Integrity)',
    description: 'ตรวจสอบใบรับรองอิเล็กทรอนิกส์ กุญแจรหัสลับผู้ลงนาม และอัลกอริทึมที่ได้มาตรฐานสากล (NIST FIPS 204 ML-DSA-87)',
    passed: true,
  },
  {
    id: 'CHK-05-TAMPER-EVIDENCE',
    category: 'ETDA พ.ร.บ. ธุรกรรมฯ',
    statuteRef: 'มาตรา ๒๖',
    title: '5. กลไกตรวจจับการบิดเบือนข้อมูล (Tamper-Evidence)',
    description: 'ตรวจสอบว่ามีการใช้ฟังก์ชันแฮชทางรหัสลับ (SHA-256) ป้องกันการแก้ไขเปลี่ยนแปลงข้อมูลหลังการลงนาม หากมีบิตใดเปลี่ยนจะตรวจพบได้ทันที',
    passed: true,
  },
  {
    id: 'CHK-06-NON-REPUDIATION',
    category: 'ETDA พ.ร.บ. ธุรกรรมฯ',
    statuteRef: 'มาตรา ๒๖',
    title: '6. การห้ามปฏิเสธความรับผิดชอบ (Non-Repudiation)',
    description: 'ค้ำประกันว่าข้อมูลถูกส่งหรือสร้างขึ้นโดยเจ้าของกุญแจจริง โดยเจ้าของกุญแจไม่สามารถปฏิเสธความรับผิดได้ในชั้นศาล',
    passed: true,
  },

  // Module 3: Chain of Custody & Hash (ETDA Sec 28 & ISO/IEC 27037)
  {
    id: 'CHK-07-HASH-INTEGRITY',
    category: 'ISO/IEC 27037 & ETDA',
    statuteRef: 'มาตรา ๒๘',
    title: '7. การคำนวณค่าดิจิทัลแฮชบิตต่อบิต (Cryptographic Hash)',
    description: 'คำนวณค่า Digest ของพยานหลักฐานเทียบกับสมุดบัญชี Merkle Root เพื่อยืนยันว่าไม่มีการดัดแปลงหรือสูญหาย',
    passed: true,
  },
  {
    id: 'CHK-08-APPEND-ONLY',
    category: 'ISO/IEC 27037 & ETDA',
    statuteRef: 'มาตรา ๒๘',
    title: '8. การจัดเก็บแบบลบไม่ได้ (Read-Only / Append-Only Ledger)',
    description: 'จัดเก็บพยานหลักฐานในสื่อบันทึกถาวรแบบ WORM (Write Once Read Many) ตามหลักการนิติวิทยาศาสตร์ Delete Nothing',
    passed: true,
  },
  {
    id: 'CHK-09-CHAIN-OF-CUSTODY',
    category: 'ISO/IEC 27037 & ETDA',
    statuteRef: 'มาตรา ๒๘',
    title: '9. การย้อนรอยประวัติห่วงโซ่พยาน (Chain of Custody Trace)',
    description: 'มีบันทึกการส่งมอบ ย้ายสถานที่ จัดเก็บ และผู้เข้าถึงพยานหลักฐานทุกขั้นตอนอย่างละเอียดเพื่อประกอบการนำสืบศาล',
    passed: true,
  },

  // Module 4: PDPA Data Protection (PDPA Sec 9, 26, 28)
  {
    id: 'CHK-10-PII-REDACTION',
    category: 'PDPA คุ้มครองข้อมูลฯ',
    statuteRef: 'มาตรา ๙',
    title: '10. การปกปิดและคัดกรองข้อมูลส่วนบุคคล (PII Redaction)',
    description: 'ตรวจสอบว่ามีการ Masking ข้อมูลระบุตัวบุคคลที่ไม่เกี่ยวข้องก่อนนำส่งหรือนำเสนอในรายงานพยานหลักฐาน',
    passed: true,
  },
  {
    id: 'CHK-11-SENSITIVE-DATA',
    category: 'PDPA คุ้มครองข้อมูลฯ',
    statuteRef: 'มาตรา ๒๖',
    title: '11. การเข้ารหัสคุ้มครองข้อมูลส่วนบุคคลอ่อนไหว (Sensitive Data Protection)',
    description: 'มีมาตรการรักษาความมั่นคงปลอดภัยขั้นสูงและการเข้ารหัสลับระดับควอนตัม (FIPS 203 ML-KEM) สำหรับข้อมูลอ่อนไหว',
    passed: true,
  },
  {
    id: 'CHK-12-CROSS-BORDER',
    category: 'PDPA คุ้มครองข้อมูลฯ',
    statuteRef: 'มาตรา ๒๘',
    title: '12. การควบคุมการโอนข้อมูลข้ามแดน (Cross-Border Transfer Controls)',
    description: 'ตรวจสอบว่าปลายทางมีมาตรฐานการคุ้มครองข้อมูลส่วนบุคคลที่เพียงพอและได้รับความยินยอมหรือมีข้อยกเว้นตามกฎหมาย',
    passed: true,
  },

  // Module 5: Cybersecurity Act (NCSA)
  {
    id: 'CHK-13-CII-PROTECTION',
    category: 'NCSA พ.ร.บ. ไซเบอร์ฯ',
    statuteRef: 'พ.ร.บ. ไซเบอร์ฯ ๒๕๖๒',
    title: '13. การคุ้มครองโครงสร้างพื้นฐานสำคัญ (CII Protection)',
    description: 'ประเมินความเสี่ยงและมาตรการป้องกันระบบสารสนเทศที่มีความสำคัญยิ่งยวดต่อความมั่นคงและการให้บริการสาธารณะ',
    passed: true,
  },
  {
    id: 'CHK-14-THREAT-AUDIT',
    category: 'NCSA พ.ร.บ. ไซเบอร์ฯ',
    statuteRef: 'พ.ร.บ. ไซเบอร์ฯ ๒๕๖๒',
    title: '14. การเฝ้าระวังและบันทึก Log ภัยคุกคาม (Threat Monitoring & Audit)',
    description: 'ระบบเฝ้าระวังความผิดปกติและตรวจจับการโจมตีแบบเรียลไทม์ พร้อมจัดเก็บ Audit Log อย่างน้อย 90 วันตามมาตรฐาน',
    passed: true,
  },
  {
    id: 'CHK-15-HARDWARE-BINDING',
    category: 'NCSA พ.ร.บ. ไซเบอร์ฯ',
    statuteRef: 'พ.ร.บ. ไซเบอร์ฯ ๒๕๖๒',
    title: '15. การควบคุมความปลอดภัยฮาร์ดแวร์และการตรึงความแท้จริง',
    description: 'การใช้งาน 10/10 REAL_HSM FIPS 140-3 L4 ตรึงกุญแจในระดับ Hardware Isolation ป้องกันการดึงกุญแจออกนอกอุปกรณ์',
    passed: true,
  },

  // Module 6: Court Dossier Packaging
  {
    id: 'CHK-16-COURT-PACKAGE',
    category: 'มาตรฐานศาลและสำนวน',
    statuteRef: 'ป.วิ.พ. & ข้อบังคับศาล',
    title: '16. การจัดชุดสำนวนและใบรับรองพยานหลักฐาน (Court Dossier Packaging)',
    description: 'จัดทำสารบัญบัญชีพยาน ตารางสรุปค่าแฮช และออกใบรับรองในรูปแบบ PDF/A สำหรับการยื่นและรับฟังในชั้นศาล',
    passed: true,
  },
];

export const DigitalEvidenceChecklistModal: React.FC<DigitalEvidenceChecklistModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [items, setItems] = useState<ChecklistItem[]>(INITIAL_CHECKLIST_ITEMS);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const toggleItem = (id: string) => {
    playTone(600, 0.03);
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, passed: !item.passed } : item))
    );
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-5xl max-h-[92vh] bg-[#070a12] border-2 border-emerald-500/40 rounded-[28px] shadow-2xl flex flex-col overflow-hidden text-zinc-200 font-mono"
      >
        {/* Subtle Forensic Shimmer Entrance Sweep */}
        <motion.div
          initial={{ x: '-120%', opacity: 0 }}
          animate={{ x: '180%', opacity: [0, 0.45, 0] }}
          transition={{ duration: 1.3, ease: 'easeInOut' }}
          className="pointer-events-none absolute inset-0 z-30 bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent skew-x-12"
        />
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-black to-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white font-serif tracking-wide">
                  แบบฟอร์มเช็คลิสต์ตรวจพิสูจน์พยานหลักฐานดิจิทัล
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  ISO/IEC 27037 &bull; v2.0
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-serif mt-1">
                มาตรฐานกฎหมายไทย 3 ฉบับ (ETDA ม.9,26,28 • PDPA ม.9,26,28 • NCSA พ.ร.บ. ไซเบอร์ฯ)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'กำลังสร้าง PDF...' : 'ส่งออก PDF เช็คลิสต์ (v2)'}</span>
            </button>

            <button
              onClick={() => {
                playTone(400, 0.03);
                onClose();
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Overview Stats & Filter Bar */}
        <div className="p-4 sm:p-5 bg-black/50 border-b border-white/10 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/5">
              <span className="text-zinc-500 text-[10px]">สถานะการตรวจพิสูจน์</span>
              <div className="text-sm sm:text-base font-bold text-emerald-400 mt-0.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{passPercent}% ผ่านเกณฑ์ ({passedCount}/{totalCount})</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/5">
              <span className="text-zinc-500 text-[10px]">ผู้ตรวจพิสูจน์ (Lead Inspector)</span>
              <div className="text-xs font-bold text-white mt-0.5 truncate">
                {SYSTEM_METADATA.sovereignPrincipal}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/5">
              <span className="text-zinc-500 text-[10px]">หนังสือเดินทาง / รหัสผู้พิทักษ์</span>
              <div className="text-xs font-bold text-amber-300 mt-0.5">#EP-SOVEREIGN-01</div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/5">
              <span className="text-zinc-500 text-[10px]">สมุดบัญชี Merkle Anchor</span>
              <div className="text-xs font-bold text-cyan-400 mt-0.5">Block #{SYSTEM_METADATA.sealedBlock} 🔒</div>
            </div>
          </div>

          {/* Search & Category Tabs */}
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
                  onClick={() => {
                    playTone(550, 0.02);
                    setFilterCategory(tab.id);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all ${
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
          {filteredItems.map((item) => (
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
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="p-4 border-t border-white/10 bg-black/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-zinc-400 text-[11px]">
            คลิกที่รายการเพื่อสลับสถานะ <span className="text-emerald-400 font-bold">ผ่าน</span> /{' '}
            <span className="text-rose-400 font-bold">ไม่ผ่าน</span> ก่อนทำการส่งออกเอกสาร PDF
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setItems((prev) => prev.map((i) => ({ ...i, passed: true })));
                playTone(700, 0.03);
              }}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold"
            >
              ทำเครื่องหมายผ่านทั้งหมด (All Pass)
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออก digital_evidence_verification_checklist_v2.pdf</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
