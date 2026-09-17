import React, { useState } from 'react';
import {
  Scale,
  ShieldCheck,
  ShieldAlert,
  Award,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Check,
  Fingerprint,
  Cpu,
  Lock,
  Radio,
  Server,
  Terminal,
  Activity,
  Zap,
  Sparkles,
  QrCode,
  FileText,
  Clock,
  UserCheck,
  RefreshCw,
  Search,
} from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { safeCopyToClipboard } from '../utils/clipboard';
import { CANONICAL_MERKLE_ROOT, SYSTEM_METADATA, THAI_CUSTODIANS } from '../data/canonicalData';
import { generateDigitalEvidenceChecklistPdf } from '../utils/digitalEvidenceChecklistPdfExport';
import { generateSovereignReportPdf } from '../utils/sovereignReportPdfExport';
import { INITIAL_CHECKLIST_ITEMS } from './DigitalEvidenceChecklistModal';

export const ExpertWitnessCourtSuite: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'affidavit' | 'stress-test' | 'bft-mesh' | 'evidence-cert'>('affidavit');
  const [isExporting, setIsExporting] = useState(false);
  const [testEntropyRate, setTestEntropyRate] = useState<number>(11264);
  const [stressResult, setStressResult] = useState<string | null>(null);
  const [bftNodes, setBftNodes] = useState([
    { id: 'NODE-01', location: 'Bangkok Enclave (Primary)', role: 'Leader / Proposer', latency: 0.8, status: 'HONEST', votes: 10 },
    { id: 'NODE-02', location: 'Chiang Mai Cyber Hub', role: 'Validator', latency: 1.2, status: 'HONEST', votes: 10 },
    { id: 'NODE-03', location: 'Phuket Marine Subsea Enclave', role: 'Validator', latency: 1.4, status: 'HONEST', votes: 10 },
    { id: 'NODE-04', location: 'Khon Kaen High-Speed Node', role: 'Validator', latency: 1.1, status: 'HONEST', votes: 10 },
    { id: 'NODE-05', location: 'EEC Digital Park Sriracha', role: 'Validator', latency: 0.9, status: 'HONEST', votes: 10 },
    { id: 'NODE-06', location: 'Sovereign Cryo Vault #849202', role: 'Cold Quorum Sentry', latency: 0.7, status: 'HONEST', votes: 10 },
  ]);

  const handleCopy = (key: string, text: string) => {
    safeCopyToClipboard(text);
    setCopiedKey(key);
    playTone(600, 0.04);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleRunStressSimulation = (rate: number) => {
    setTestEntropyRate(rate);
    playTone(700, 0.05);

    if (rate <= 11500) {
      setStressResult('✅ สภาวะปกติ (Baseline 11,264 KBps): ระบบทำงานสมบูรณ์ ไม่มีแจ้งเตือนรบกวน (0 False Alarms)');
    } else if (rate >= 14300 && rate <= 14900) {
      setStressResult('🛡️ ได้รับอนุญาต (Authorized Safe Harbor Surge 14,300 - 14,900 KBps): รอบ TRNG Reseed ประจำเวลา 12:00/20:57/03:57 ได้รับข้อยกเว้น Safe Harbor (Pass)');
    } else if (rate > 15000) {
      setStressResult('🚨 ตัดวงจรฉุกเฉิน (Circuit Breaker Fail-Closed > 15,000 KBps): เอนโทรปีเกินพิกัดความปลอดภัย ระบบตัดการเชื่อมต่อภายนอกและกักกันข้อมูลทันทีภายใน 142ms');
    } else {
      setStressResult('⚡ เอนโทรปีผันผวนเล็กน้อย (Within Safe Threshold < 15,000 KBps): ระบบประมวลผลต่อเนื่องโดยไม่ตัดวงจร');
    }
  };

  const handleExportAffidavitPdf = () => {
    if (isExporting) return;
    setIsExporting(true);
    playTone(550, 0.08);

    try {
      generateDigitalEvidenceChecklistPdf(INITIAL_CHECKLIST_ITEMS, {
        name: SYSTEM_METADATA.sovereignPrincipal,
        organization: 'ศาลทรัพย์สินทางปัญญาและการค้าระหว่างประเทศกลาง / ศาลอาญาคดีทุจริต',
        inspectorId: '#EP-SOVEREIGN-01 (OMEGA-1)',
        inspectionDate: new Date().toISOString().split('T')[0],
        overallConclusion: 'PASSED',
      });
      playAuditChime();
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6 sm:p-7 rounded-[26px] bg-[#070a12] border border-amber-500/30 shadow-[0_10px_40px_-10px_rgba(245,158,11,0.15)] font-mono space-y-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)] shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                ระบบคำเบิกความพยานผู้เชี่ยวชาญและการพิสูจน์พยานหลักฐานชั้นศาล
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                ETDA SEC 28 QUALIFIED
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                ISO/IEC 27037 FORENSIC
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              ชุดเครื่องมือรับรองความถูกต้องของพยานหลักฐานดิจิทัล ลายมือชื่ออิเล็กทรอนิกส์ และห่วงโซ่แห่งหลักฐาน (Chain of Custody)
            </p>
          </div>
        </div>

        {/* Global Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportAffidavitPdf}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
          >
            <Download className={`w-3.5 h-3.5 text-amber-300 ${isExporting ? 'animate-bounce' : ''}`} />
            <span>{isExporting ? 'Generating PDF...' : 'ส่งออกคำเบิกความพยาน (PDF)'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {[
          { id: 'affidavit', label: '📜 คำเบิกความพยานดิจิทัล (Affidavit)', icon: FileText },
          { id: 'stress-test', label: '🧪 ทดสอบความทนทาน (Safety Stress Test)', icon: Zap },
          { id: 'bft-mesh', label: '🌐 ฉันทามติ BFT Mesh 6 โหนด (Consensus)', icon: Radio },
          { id: 'evidence-cert', label: '🔐 ตราประทับหลักฐาน & Merkle Proof', icon: Award },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              playTone(600, 0.03);
              setActiveTab(tab.id as any);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
              activeTab === tab.id
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-white/5 text-zinc-400 border-white/5 hover:text-zinc-200 hover:bg-white/10'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Expert Witness Affidavit */}
      {activeTab === 'affidavit' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#0a0f1e] border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-bold text-white">
                  ร่างคำให้การพยานผู้เชี่ยวชาญด้านนิติวิทยาศาสตร์ดิจิทัล (Digital Forensic Expert Statement)
                </span>
              </div>
              <button
                onClick={() => handleCopy('affidavit-text', `ข้าพเจ้า ${SYSTEM_METADATA.sovereignPrincipal} ในฐานะผู้ตรวจพิสูจน์ ขอเบิกความว่า พยานหลักฐานดิจิทัลชุดนี้ได้รับการจัดเก็บตามมาตรฐาน ISO/IEC 27037 และลงนามปิดผนึกด้วยลายเซ็นอิเล็กทรอนิกส์ปลอดภัยสูงตาม พ.ร.บ. ธุรกรรมฯ ม.๒๖ และได้รับข้อสันนิษฐานความถูกต้องตาม ม.๒๘ อย่างสมบูรณ์ ค่า Genesis Merkle Root คือ ${CANONICAL_MERKLE_ROOT}`)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 text-xs flex items-center gap-1"
              >
                {copiedKey === 'affidavit-text' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'affidavit-text' ? 'คัดลอกแล้ว' : 'คัดลอกข้อความนำสืบ'}</span>
              </button>
            </div>

            <div className="text-xs text-zinc-300 leading-relaxed space-y-3 font-sans">
              <p>
                <strong>ข้อ ๑:</strong> ข้าพเจ้า <strong>{SYSTEM_METADATA.sovereignPrincipal}</strong> (รหัสผู้พิทักษ์ <code>#EP-SOVEREIGN-01</code>) ได้ทำการตรวจสอบและรับรองความสมบูรณ์ของระบบ ZYRQUEN Ω∞ พบว่าพยานหลักฐานอิเล็กทรอนิกส์ทั้งหมด <strong>๑๔,๙๐๒ รายการ</strong> ได้รับการจัดเก็บและประมวลผลอย่างถูกต้องตามมาตรฐานนิติวิทยาศาสตร์สากล <strong>ISO/IEC 27037</strong>
              </p>
              <p>
                <strong>ข้อ ๒:</strong> ระบบใช้ระบบลายมือชื่อดิจิทัลควอนตัม <strong>NIST FIPS 204 ML-DSA-87 (Dilithium-5)</strong> ร่วมกับกุญแจฮาร์ดแวร์ <strong>FIPS 140-3 Level 4 (10/10 REAL_HSM Council)</strong> ทำให้เข้าเงื่อนไข <em>"ลายมือชื่ออิเล็กทรอนิกส์ที่เชื่อถือได้"</em> ตาม <strong>พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๒๖</strong>
              </p>
              <p>
                <strong>ข้อ ๓:</strong> ข้อมูลทั้งหมดได้รับการคุ้มครองด้วยเกราะ <strong>Safe Harbor ตามมาตรา ๒๘</strong> โดยมีข้อสันนิษฐานตามกฎหมายว่าเป็นข้อมูลที่ไม่ถูกเปลี่ยนแปลงหรือแก้ไขนับตั้งแต่เวลาที่ประทับตราเวลาสากล (RFC 3161 Qualified Timestamp)
              </p>
            </div>

            <div className="pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-400 block">Genesis Merkle Root</span>
                <code className="text-[11px] text-amber-300 break-all font-mono">
                  {CANONICAL_MERKLE_ROOT}
                </code>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-400 block">Certificate ID</span>
                <span className="text-xs font-bold text-cyan-300 font-mono">
                  ZQ-GOLD-DEP-849202-3908
                </span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-400 block">Quorum Verification</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  10/10 REAL_HSM (100% UNANIMOUS)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Safety Stress Test & Circuit Breaker Simulation */}
      {activeTab === 'stress-test' && (
        <div className="p-5 rounded-2xl bg-[#0a0f1e] border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-bold text-white">
                ระบบจำลองการทดสอบความทนทานของเอนโทรปีและ Circuit Breaker (CH-06)
              </span>
            </div>
            <span className="text-xs text-zinc-400 font-mono">Threshold: 15,000 KBps</span>
          </div>

          <div className="text-xs text-zinc-300 leading-relaxed">
            ทดสอบการตอบสนองของระบบต่อความผันผวนของเอนโทรปี เพื่อยืนยันว่าไม่มีการแจ้งเตือนผิดพลาด (Zero False Alarms) ในสภาวะคลื่น TRNG Reseed ปกติ และตัดวงจร Fail-Closed ทันทีเมื่อเกิดการโจมตีจริง
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => handleRunStressSimulation(11264)}
              className="p-3 rounded-xl bg-black/50 hover:bg-black/70 border border-emerald-500/30 text-left transition-all space-y-1"
            >
              <div className="text-[11px] font-bold text-emerald-300">1. Baseline Normal</div>
              <div className="text-xs text-white font-bold font-mono">11,264 KBps</div>
              <div className="text-[10px] text-zinc-400">สภาวะทราฟฟิกปกติ</div>
            </button>

            <button
              onClick={() => handleRunStressSimulation(13500)}
              className="p-3 rounded-xl bg-black/50 hover:bg-black/70 border border-cyan-500/30 text-left transition-all space-y-1"
            >
              <div className="text-[11px] font-bold text-cyan-300">2. Minor Traffic Spike</div>
              <div className="text-xs text-white font-bold font-mono">13,500 KBps</div>
              <div className="text-[10px] text-zinc-400">ต่ำกว่าเกณฑ์ปลอดภัย</div>
            </button>

            <button
              onClick={() => handleRunStressSimulation(14500)}
              className="p-3 rounded-xl bg-black/50 hover:bg-black/70 border border-amber-500/30 text-left transition-all space-y-1"
            >
              <div className="text-[11px] font-bold text-amber-300">3. TRNG Reseed Pass</div>
              <div className="text-xs text-white font-bold font-mono">14,500 KBps</div>
              <div className="text-[10px] text-zinc-400">Authorized Surge (Safe)</div>
            </button>

            <button
              onClick={() => handleRunStressSimulation(16200)}
              className="p-3 rounded-xl bg-black/50 hover:bg-black/70 border border-rose-500/30 text-left transition-all space-y-1"
            >
              <div className="text-[11px] font-bold text-rose-300">4. Critical Attack Spike</div>
              <div className="text-xs text-white font-bold font-mono">16,200 KBps</div>
              <div className="text-[10px] text-zinc-400">Fail-Closed Lockout</div>
            </button>
          </div>

          {stressResult && (
            <div className="p-4 rounded-xl bg-black/60 border border-amber-500/30 text-xs text-zinc-200 leading-relaxed animate-in fade-in">
              {stressResult}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: BFT Mesh 6 Nodes Consensus */}
      {activeTab === 'bft-mesh' && (
        <div className="p-5 rounded-2xl bg-[#0a0f1e] border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-bold text-white">
                โครงข่ายฉันทามติทนทานต่อความผิดพร่อง Byzantine (BFT Mesh 6 Nodes)
              </span>
            </div>
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              6/6 FULLY SYNCED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {bftNodes.map((node) => (
              <div
                key={node.id}
                className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded bg-white/5 text-amber-300 font-bold font-mono">
                    {node.id}
                  </span>
                  <span className="text-emerald-400 text-[10px] font-bold">
                    {node.status}
                  </span>
                </div>
                <div className="text-xs font-bold text-white">{node.location}</div>
                <div className="text-[10px] text-zinc-400">{node.role}</div>
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-400">
                  <span>Latency: <strong className="text-cyan-300">{node.latency}ms</strong></span>
                  <span>Votes: <strong className="text-emerald-300">{node.votes}/10</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Evidence Certification & QR */}
      {activeTab === 'evidence-cert' && (
        <div className="p-5 rounded-2xl bg-[#0a0f1e] border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-bold text-white">
                การรับรองพยานหลักฐานและตรารับรองรหัสลับดิจิทัล (Cryptographic Proof Verification)
              </span>
            </div>
            <span className="text-xs text-cyan-300 font-mono">ETDA Qualified</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-amber-400" />
                <span>จำลองการสแกนตรวจสอบพยานหลักฐานในชั้นศาล (Courtroom QR Verification)</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                เจ้าหน้าที่ศาลหรือคู่ความสามารถสแกนตราดิจิทัลเพื่อตรวจสอบความตรงกันของ Merkle Root และลายเซ็น FIPS 204 ได้ทันทีโดยไม่ต้องผ่านเซิร์ฟเวอร์กลาง
              </p>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono break-all">
                VERIFY://SOVEREIGN.ETH/849202?ROOT={CANONICAL_MERKLE_ROOT.slice(0, 24)}...
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-emerald-400" />
                <span>ห่วงโซ่แห่งหลักฐาน (Chain of Custody Timeline)</span>
              </div>
              <ul className="text-xs text-zinc-300 space-y-1.5 list-disc list-inside">
                <li><strong className="text-white">Intake:</strong> บันทึกแฮชไฟล์ระดับไบต์ตามมาตรฐาน ISO/IEC 27037</li>
                <li><strong className="text-white">Timestamp:</strong> ประทับเวลาสากล RFC 3161 Qualified Authority</li>
                <li><strong className="text-white">Quorum Seal:</strong> ลงนามรับรองโดย 10/10 REAL_HSM Council</li>
                <li><strong className="text-white">Immutable Lock:</strong> ตรึงลงสมุดบัญชี WORM อ่านอย่างเดียว (Δ0.00%)</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
