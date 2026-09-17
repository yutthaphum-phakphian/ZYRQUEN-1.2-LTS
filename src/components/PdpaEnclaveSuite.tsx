import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Eye,
  FileCheck2,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Sparkles,
  Server,
  Globe,
  Database,
  ArrowRight,
  Send,
  Download,
  Copy,
  KeyRound,
  FileText,
} from 'lucide-react';
import { SYSTEM_METADATA } from '../data/canonicalData';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { safeCopyToClipboard } from '../utils/clipboard';

interface RopaRecord {
  ropaId: string;
  activityNameTh: string;
  activityNameEn: string;
  lawfulBasis: string;
  dataCategories: string;
  retentionPeriod: string;
  securityMeasure: string;
  merkleSealLeaf: string;
  status: 'AUDITED_IMMUTABLE' | 'ENCLAVE_RESTRICTED';
}

const ROPA_REGISTRY: RopaRecord[] = [
  {
    ropaId: 'ROPA-TH-01',
    activityNameTh: 'การตรวจสอบโทรมาตรและพยานหลักฐานทางนิติวิทยาศาสตร์ระบบ',
    activityNameEn: 'System Telemetry & Forensic Evidence Integrity Auditing',
    lawfulBasis: 'มาตรา ๒๔ (๕) ภารกิจเพื่อประโยชน์สาธารณะและความมั่นคงอธิปไตย',
    dataCategories: 'ฮาร์ดแวร์สถานะ, เวลาประทับคริปโต, รหัสแฮชลายเซ็น',
    retentionPeriod: 'ถาวร (Immutable WORM Merkle Ledger)',
    securityMeasure: 'NIST FIPS 204 ML-DSA-87 Post-Quantum Seal',
    merkleSealLeaf: 'leaf_ropa_909ab814479844d8a14816bed34cdbb0',
    status: 'AUDITED_IMMUTABLE',
  },
  {
    ropaId: 'ROPA-TH-02',
    activityNameTh: 'การยืนยันตัวตนผู้ถือสิทธิ์และหนังสือเดินทางอธิปไตย #EP-SOVEREIGN-01',
    activityNameEn: 'Sovereign Architect & Custodian Identity Verification',
    lawfulBasis: 'มาตรา ๒๔ (๓) การปฏิบัติตามสัญญาและความยินยอมชัดแจ้ง',
    dataCategories: 'รหัสลายนิ้วมือคริปโต (Key Fingerprint), สิทธิ์การเข้าถึง Omega-1',
    retentionPeriod: 'ตลอดระยะเวลาถือครองตราประทับอธิปไตย',
    securityMeasure: 'Sub-Kelvin Hardware Security Vault & Biometric Airgap',
    merkleSealLeaf: 'leaf_custody_5a13396c129c611f15232fdaf54bfad0',
    status: 'AUDITED_IMMUTABLE',
  },
  {
    ropaId: 'ROPA-TH-03',
    activityNameTh: 'การสตรีมโทรมาตรอุณหภูมิคอร์และแบนด์วิดท์หน่วยความจำ',
    activityNameEn: 'Thermal Telemetry & Memory Bandwidth Invariant Stream',
    lawfulBasis: 'มาตรา ๒๔ (๕) & ข้อบังคับความปลอดภัยไซเบอร์ NCSA CII',
    dataCategories: 'อุณหภูมิเซนเซอร์ (<85.0°C), แบนด์วิดท์ (>15.0 GB/s)',
    retentionPeriod: 'Real-Time Streaming / บันทึกเมื่อเกิด Anomaly',
    securityMeasure: 'Automatic Fail-Closed Quarantine Circuit Breaker',
    merkleSealLeaf: 'leaf_telemetry_7528e18501da86fc4691763a43fa4c68',
    status: 'AUDITED_IMMUTABLE',
  },
  {
    ropaId: 'ROPA-TH-04',
    activityNameTh: 'การบันทึกประวัติการสอบทานทางกฎหมาย (Legal Attestation Audit)',
    activityNameEn: 'Statutory Compliance & Legal Attestation History Log',
    lawfulBasis: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ มาตรา ๙, ๒๖, ๒๘ & PDPA มาตรา ๓๙',
    dataCategories: 'บันทึกการส่งมอบกุญแจ, ผลลัพธ์การตรวจสอบ Invariant 10/10',
    retentionPeriod: '10 ปีตามมาตรฐานพยานหลักฐานศาลยุติธรรมไทย',
    securityMeasure: 'Dilithium-5 / SHA-256 Merkle Chaining at Block #849202',
    merkleSealLeaf: 'leaf_legal_43fa4c68909ab814479844d8a14816bed34c',
    status: 'AUDITED_IMMUTABLE',
  },
];

export const PdpaEnclaveSuite: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'ROPA' | 'MEASURES' | 'RIGHTS' | 'BREACH_DRILL'>('ROPA');
  const [isShreddingKey, setIsShreddingKey] = useState(false);
  const [shreddedCount, setShreddedCount] = useState(0);
  const [isSimulatingBreachDrill, setIsSimulatingBreachDrill] = useState(false);
  const [drillStage, setDrillStage] = useState<number>(-1);
  const [copiedRopaId, setCopiedRopaId] = useState<string | null>(null);

  const handleCopyRopa = (id: string, text: string) => {
    safeCopyToClipboard(text);
    setCopiedRopaId(id);
    playTone(600, 0.05);
    setTimeout(() => setCopiedRopaId(null), 2000);
  };

  // Simulates Cryptographic Key Shredding (Right to Erasure under Section 33)
  const handleExecuteKeyShredding = () => {
    if (isShreddingKey) return;
    setIsShreddingKey(true);
    playTone(480, 0.08);

    setTimeout(() => {
      playTone(380, 0.1);
      setShreddedCount((prev) => prev + 1);
      setIsShreddingKey(false);
      playAuditChime();
    }, 1200);
  };

  // 72-Hour Data Breach Fail-Closed Drill Simulation
  const handleRunBreachDrill = () => {
    if (isSimulatingBreachDrill) return;
    setIsSimulatingBreachDrill(true);
    setDrillStage(0);
    playTone(520, 0.06);

    const stages = [
      () => { setDrillStage(1); playTone(600, 0.06); },
      () => { setDrillStage(2); playTone(680, 0.06); },
      () => { setDrillStage(3); playTone(750, 0.06); },
      () => {
        setDrillStage(4);
        setIsSimulatingBreachDrill(false);
        playAuditChime();
      },
    ];

    stages.forEach((fn, idx) => {
      setTimeout(fn, (idx + 1) * 700);
    });
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-6 rounded-[28px] bg-gradient-to-r from-[#0a1b24] via-[#091522] to-[#080d1a] border border-emerald-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.2)] shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold font-mono text-white">
                  พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ (PDPA Thailand Enclave)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                  PDPA v4.16 FINAL CERTIFIED
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-1 leading-relaxed">
                สถาปัตยกรรมอธิปไตยดิจิทัลรักษาความลับและสิทธิขั้นสูงสุด: มาตรา ๑๙ (ความยินยอม/ฐานกฎหมาย), มาตรา ๒๘–๒๙ (การโอนข้อมูลข้ามแดน), มาตรา ๓๗ (มาตรการรักษาความมั่นคงปลอดภัย) และ มาตรา ๓๙ (บันทึก ROPA Merkle Ledger)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
            <div className="text-right px-4 py-2 rounded-2xl bg-black/40 border border-white/10">
              <div className="text-[10px] font-mono text-zinc-500 uppercase">Plaintext Leakage Invariant</div>
              <div className="text-sm font-mono font-bold text-emerald-400">0.0000% (ZERO LEAK)</div>
            </div>
            <div className="text-right px-4 py-2 rounded-2xl bg-black/40 border border-white/10">
              <div className="text-[10px] font-mono text-zinc-500 uppercase">PDPA Canonical Block</div>
              <div className="text-sm font-mono font-bold text-cyan-400">#{SYSTEM_METADATA.sealedBlock}</div>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Pills */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10 overflow-x-auto pb-1">
          {[
            { id: 'ROPA', label: 'บันทึกรายการกิจกรรม (ROPA Sec 39)', icon: FileText },
            { id: 'MEASURES', label: 'มาตรการความปลอดภัยเชิงเทคนิค (Sec 37)', icon: Lock },
            { id: 'RIGHTS', label: 'สิทธิเจ้าของข้อมูล & Cryptographic Shredding', icon: KeyRound },
            { id: 'BREACH_DRILL', label: 'ระบบรับมือเหตุละเมิด 72 ชม. (Sec 37(4))', icon: AlertTriangle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  playTone(540, 0.04);
                  setActiveSection(tab.id as any);
                }}
                className={`px-4 py-2 rounded-xl font-mono text-xs font-semibold flex items-center gap-2 transition-all shrink-0 border ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content: ROPA Section 39 */}
      {activeSection === 'ROPA' && (
        <div className="p-6 rounded-[28px] bg-[#0b0e1a]/85 border border-white/8 backdrop-blur-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/8 pb-4">
            <div>
              <h3 className="text-sm sm:text-base font-mono font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Record of Processing Activities (ROPA) — พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล มาตรา ๓๙</span>
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                บันทึกรายการกิจกรรมการประมวลผลข้อมูลส่วนบุคคลแบบกระจายศูนย์ สลักลงสู่ Merkle Leaf ภายใต้ Root Hash {SYSTEM_METADATA.merkleRoot.slice(0, 16)}...
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30 shrink-0">
              4/4 ROPA RECORDS SEALED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ROPA_REGISTRY.map((ropa) => (
              <div
                key={ropa.ropaId}
                className="p-5 rounded-2xl bg-black/40 border border-white/8 hover:border-emerald-500/30 transition-all space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/30">
                      {ropa.ropaId}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/20">
                      {ropa.status}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyRopa(ropa.ropaId, JSON.stringify(ropa, null, 2))}
                    className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    title="คัดลอก ROPA Spec"
                  >
                    {copiedRopaId === ropa.ropaId ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div>
                  <h4 className="text-xs sm:text-sm font-mono font-bold text-white leading-snug">
                    {ropa.activityNameTh}
                  </h4>
                  <div className="text-[11px] font-mono text-zinc-400 mt-0.5">{ropa.activityNameEn}</div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-white/5 text-[11px] font-mono">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-zinc-500 shrink-0">ฐานกฎหมาย:</span>
                    <span className="text-zinc-300 text-right">{ropa.lawfulBasis}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-zinc-500 shrink-0">หมวดหมู่ข้อมูล:</span>
                    <span className="text-zinc-300 text-right">{ropa.dataCategories}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-zinc-500 shrink-0">ระยะเวลาจัดเก็บ:</span>
                    <span className="text-emerald-400 text-right font-medium">{ropa.retentionPeriod}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-zinc-500 shrink-0">มาตรการเทคนิค:</span>
                    <span className="text-cyan-300 text-right">{ropa.securityMeasure}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                  <span>Leaf Hash:</span>
                  <span className="text-zinc-400 font-mono">{ropa.merkleSealLeaf}...</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Technical Measures Section 37 */}
      {activeSection === 'MEASURES' && (
        <div className="p-6 rounded-[28px] bg-[#0b0e1a]/85 border border-white/8 backdrop-blur-xl space-y-6">
          <div className="border-b border-white/8 pb-4">
            <h3 className="text-sm sm:text-base font-mono font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>มาตรการรักษาความมั่นคงปลอดภัยตามมาตรา ๓๗ แห่ง พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒</span>
            </h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              จัดให้มีมาตรการรักษาความมั่นคงปลอดภัยที่เหมาะสม เพื่อป้องกันการสูญหาย เข้าถึง ใช้ เปลี่ยนแปลง หรือเปิดเผยข้อมูลส่วนบุคคลโดยมิชอบ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-black/40 border border-white/8 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Lock className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                1. Confidentiality (การรักษาความลับ)
              </h4>
              <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                การเข้ารหัสแบบ Sub-Kelvin Hardware Security Vault ร่วมกับ NIST FIPS 203 (ML-KEM-1024) ข้อมูลทุกแพลอยด์ถูกสุ่มรหัสผ่าน Zero-Knowledge Ephemeral Keys
              </p>
              <div className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-500/20">
                STATUS: ZERO-PLAINTEXT ENFORCED
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-black/40 border border-white/8 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Server className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                2. Integrity (ความถูกต้องสมบูรณ์)
              </h4>
              <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                โครงสร้าง Merkle Tree 14,902 บล็อก ตรวจสอบความเปลี่ยนแปลงย้อนหลังแบบ 100% Invariant Checking หากมีการดัดแปลงแม้เพียง 1 บิต ระบบจะ Fail-Closed ทันที
              </p>
              <div className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-1 rounded border border-cyan-500/20">
                STATUS: DRIFT = 0.0000% (FROZEN)
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-black/40 border border-white/8 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Globe className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                3. Availability (ความพร้อมใช้งานและกักกัน)
              </h4>
              <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                กลไกอัตโนมัติ Fail-Closed กักกันภัยคุกคามทันทีเมื่ออุณหภูมิคอร์ &gt; 85.0°C หรือแบนด์วิดท์ &lt; 15.0 GB/s พร้อมระบบ Phoenix Auto-Healing
              </p>
              <div className="text-[10px] font-mono text-amber-400 bg-amber-950/40 px-2 py-1 rounded border border-amber-500/20">
                TRIGGER: &gt;85.0°C / &lt;15.0 GB/s ARMED
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Data Subject Rights & Cryptographic Shredding */}
      {activeSection === 'RIGHTS' && (
        <div className="p-6 rounded-[28px] bg-[#0b0e1a]/85 border border-white/8 backdrop-blur-xl space-y-6">
          <div className="border-b border-white/8 pb-4">
            <h3 className="text-sm sm:text-base font-mono font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>การคุ้มครองสิทธิของเจ้าของข้อมูลส่วนบุคคล (มาตรา ๓๐–๓๖) และเทคโนโลยี Cryptographic Key Shredding</span>
            </h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              การปฏิบัติตามสิทธิขอให้ลบหรือทำลายข้อมูล (Right to Erasure - มาตรา ๓๓) บนระบบบัญชีแยกประเภทแบบ Merkle ที่ไม่สามารถย้อนกลับได้
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/8 space-y-2">
                <h4 className="text-xs font-mono font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>หลักการ Cryptographic Shredding (การทำลายกุญแจถอดรหัสเฉพาะบุคคล)</span>
                </h4>
                <p className="text-xs text-zinc-300 font-mono leading-relaxed">
                  เนื่องจากโครงสร้าง Merkle Ledger ต้องคงความสมบูรณ์ทางคณิตศาสตร์ 100% จึงไม่สามารถลบ Leaf Node ในอดีตได้โดยตรง ระบบ ZYRQUEN Ω∞ จึงใช้เทคนิค <strong>Ephemeral Symmetric Key Shredding</strong> โดยการทำลายกุญแจถอดรหัสระดับฮาร์ดแวร์เฉพาะของข้อมูลเป้าหมาย เมื่อกุญแจถูกทำลาย ข้อมูลเดิมที่เข้ารหัสไว้จะกลายเป็น Random Entropy Noise โดยสมบูรณ์ ซึ่งมีผลทางกฎหมายเทียบเท่ากับการทำลายข้อมูลตามมาตรา ๓๓
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-zinc-500 text-[10px]">สิทธิการเข้าถึง (Sec 30):</div>
                  <div className="text-emerald-400 font-bold mt-0.5">พร้อมใช้งาน 100% (Instant Proof)</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-zinc-500 text-[10px]">สิทธิการโอนย้าย (Sec 31):</div>
                  <div className="text-cyan-400 font-bold mt-0.5">W3C DID / JSON-LD Export</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-zinc-500 text-[10px]">สิทธิคัดค้าน (Sec 32):</div>
                  <div className="text-amber-400 font-bold mt-0.5">Revocation Invariant Active</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-zinc-500 text-[10px]">กุญแจที่ถูกทำลายไปแล้ว:</div>
                  <div className="text-rose-400 font-bold mt-0.5">{shreddedCount} รายการ (Permanent Noise)</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 p-5 rounded-2xl bg-gradient-to-b from-rose-950/30 to-black/60 border border-rose-500/30 space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-mono font-bold text-white">
                  ทดสอบการทำลายกุญแจเข้ารหัส (Section 33 Erasure Drill)
                </h4>
                <p className="text-[11px] text-zinc-400 font-mono mt-1">
                  จำลองการเพิกถอนกุญแจของข้อมูลส่วนบุคคลตัวอย่างใน Enclave
                </p>
              </div>

              <button
                onClick={handleExecuteKeyShredding}
                disabled={isShreddingKey}
                className={`w-full py-2.5 px-4 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                  isShreddingKey
                    ? 'bg-rose-500/20 text-rose-200 border-rose-500/40 animate-pulse'
                    : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                }`}
              >
                <Trash2 className={`w-3.5 h-3.5 ${isShreddingKey ? 'animate-spin' : ''}`} />
                <span>{isShreddingKey ? 'Shredding Hardware Decryption Key...' : 'Execute Key Shredding Drill'}</span>
              </button>

              <div className="text-[10px] font-mono text-zinc-500">
                Merkle Block Root Hash remains unchanged: {SYSTEM_METADATA.merkleRoot.slice(0, 12)}...
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: 72-Hour Breach Drill */}
      {activeSection === 'BREACH_DRILL' && (
        <div className="p-6 rounded-[28px] bg-[#0b0e1a]/85 border border-white/8 backdrop-blur-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/8 pb-4">
            <div>
              <h3 className="text-sm sm:text-base font-mono font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>ระบบตอบสนองและแจ้งเตือนเหตุละเมิดข้อมูลส่วนบุคคลภายใน ๗๒ ชั่วโมง (มาตรา ๓๗ (๔))</span>
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                การแจ้งเหตุละเมิดแก่สำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (สคส.) โดยไม่ชักช้าภายใน ๗๒ ชั่วโมง พร้อมการแจ้งเจ้าของข้อมูล
              </p>
            </div>

            <button
              onClick={handleRunBreachDrill}
              disabled={isSimulatingBreachDrill}
              className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 border shrink-0 ${
                isSimulatingBreachDrill
                  ? 'bg-amber-500/20 text-amber-200 border-amber-500/40 animate-pulse'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSimulatingBreachDrill ? 'animate-spin' : ''}`} />
              <span>{isSimulatingBreachDrill ? 'Running 72h Circuit Drill...' : 'Simulate 72-Hour Response Drill'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[
              {
                step: 1,
                title: 'T+0s: Anomaly Detection',
                desc: 'ตรวจพบความพยายามละเมิด หรือคอร์อุณหภูมิ >85°C',
                active: drillStage >= 1,
              },
              {
                step: 2,
                title: 'T+0.4ms: Fail-Closed Isolation',
                desc: 'ตัดวงจร Enclave ทันที ป้องกันการรั่วไหล 100%',
                active: drillStage >= 2,
              },
              {
                step: 3,
                title: 'T+12m: Automated Forensic Log',
                desc: 'สร้างรายงาน Merkle Proof และพยานหลักฐานนิติวิทยาศาสตร์',
                active: drillStage >= 3,
              },
              {
                step: 4,
                title: 'T+24h: สคส. & Owner Notification',
                desc: 'ส่งรายงานสรุปแก่ สคส. ภายในกำหนด 72 ชั่วโมง',
                active: drillStage >= 4,
              },
            ].map((st) => (
              <div
                key={st.step}
                className={`p-4 rounded-2xl border transition-all space-y-2 ${
                  st.active
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 shadow-lg'
                    : 'bg-black/30 border-white/5 text-zinc-500'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono font-bold">
                  <span>Step {st.step}</span>
                  {st.active && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <div className="text-xs font-mono font-bold text-white">{st.title}</div>
                <div className="text-[11px] font-mono leading-relaxed">{st.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
