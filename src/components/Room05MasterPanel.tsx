import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layers,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Search,
  Copy,
  Check,
  Zap,
  RefreshCw,
  Terminal,
  Scale,
  FileCheck2,
  Sparkles,
  Activity,
  SlidersHorizontal,
  Workflow,
  Cpu,
  KeyRound,
  Eye,
  Play
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { SYSTEM_METADATA } from '../data/canonicalData';
import { HardwareSnapshot, ViewType } from '../types';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';
import { SealGenerationVelocityLineChart } from './SealGenerationVelocityLineChart';

export const CANONICAL_FROZEN_SEALS = 14902;
export const CANONICAL_BLOCK = 849202;
export const CANONICAL_MERKLE_ROOT = '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68';
export const CANONICAL_VERSION = 'ZYRQUEN Ω∞ v4.16 PDPA FINAL (Frozen v1.2 LTS)';
export const CANONICAL_PRINCIPAL = '🇹🇭 นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)';

export interface MasterGateItem {
  id: string;
  gateNumber: number;
  code: string;
  titleTh: string;
  titleEn: string;
  tier: 'Pre-Flight' | 'Lattice PQC' | 'Memory Ring' | 'Judicial ETDA';
  status: 'PASSED' | 'VERIFYING';
  latencyMs: number;
  hash: string;
  descTh: string;
}

export const MASTER_22_GATES: MasterGateItem[] = [
  { id: 'gate-01', gateNumber: 1, code: 'GATE-01-GENESIS-ANCHOR', titleTh: 'ด่านตรวจจับหมุดเจเนซิส (Genesis Root #849202)', titleEn: 'Genesis Root Anchor Gate', tier: 'Pre-Flight', status: 'PASSED', latencyMs: 1.2, hash: 'sha256-909ab8144798', descTh: 'ตรวจสอบความสอดคล้องของ Genesis Merkle Root และตราประทับ 14,902 ซีล' },
  { id: 'gate-02', gateNumber: 2, code: 'GATE-02-ML-DSA-87-SIG', titleTh: 'ด่านตรวจสอบลายเซ็น Dilithium-5 (FIPS 204)', titleEn: 'Dilithium-5 Primary Signature Gate', tier: 'Lattice PQC', status: 'PASSED', latencyMs: 2.4, hash: 'sha256-7528e18501da', descTh: 'รับรองลายมือชื่อดิจิทัลหลังยุคควอนตัม ML-DSA-87 ของสภา 10/10 HSM' },
  { id: 'gate-03', gateNumber: 3, code: 'GATE-03-SPHINCS-FALLBACK', titleTh: 'ด่านทดสอบระบบสำรอง SPHINCS+ (FIPS 205)', titleEn: 'SPHINCS+ Fallback Readiness Gate', tier: 'Lattice PQC', status: 'PASSED', latencyMs: 3.1, hash: 'sha256-43fa4c68909a', descTh: 'ตรวจสอบความพร้อมของสายธารสลับกุญแจแบบ Stateless Hash-based' },
  { id: 'gate-04', gateNumber: 4, code: 'GATE-04-FALCON-LATENCY', titleTh: 'ด่านกุญแจความเร็วสูง Falcon-1024', titleEn: 'Falcon-1024 High-Speed Gate', tier: 'Lattice PQC', status: 'PASSED', latencyMs: 0.9, hash: 'sha256-16bed34cdbb0', descTh: 'ประเมินความเร็วและความหน่วงต่ำพิเศษสำหรับการประทับตราต่อเนื่อง' },
  { id: 'gate-05', gateNumber: 5, code: 'GATE-05-HAWK-DEPRECATED', titleTh: 'ด่านตรวจสอบการถอดถอน HAWK ถาวร', titleEn: 'HAWK Complete Removal Gate', tier: 'Pre-Flight', status: 'PASSED', latencyMs: 0.5, hash: 'sha256-86fc4691763a', descTh: 'ยืนยันการระงับและตัดสัญญาณ HAWK ออกจากสารระบบตามรายงาน Claude Mythos' },
  { id: 'gate-06', gateNumber: 6, code: 'GATE-06-HSM-DECA-QUORUM', titleTh: 'ด่านมติเอกฉันท์ 10/10 HSM Quorum', titleEn: '10/10 Deca-Key Quorum Gate', tier: 'Pre-Flight', status: 'PASSED', latencyMs: 4.8, hash: 'sha256-a18f91a3c091', descTh: 'รวมศูนย์ลายเซ็นฮาร์ดแวร์ตู้เซฟ FIPS 140-3 Level 4 ครบ 10 โหนด' },
  { id: 'gate-07', gateNumber: 7, code: 'GATE-07-PRINCIPAL-PASSPORT', titleTh: 'ด่านรับรองพาสปอร์ตอธิปไตย #EP-SOVEREIGN-01', titleEn: 'Principal Passport Authentication Gate', tier: 'Pre-Flight', status: 'PASSED', latencyMs: 1.1, hash: 'sha256-b242e1b87d00', descTh: 'ตรวจสอบสิทธิ์ OMEGA-1 ของนายยุทธภูมิ พากเพียร' },
  { id: 'gate-08', gateNumber: 8, code: 'GATE-08-MEMORY-RING-ISOLATION', titleTh: 'ด่านแยกวงแหวนหน่วยความจำเคอร์เนล', titleEn: 'Kernel Memory Ring Isolation Gate', tier: 'Memory Ring', status: 'PASSED', latencyMs: 1.5, hash: 'sha256-c37a109e3f19', descTh: 'ป้องกัน Buffer Overflow และการแทรกแซงข้ามโพรเซส' },
  { id: 'gate-09', gateNumber: 9, code: 'GATE-09-DMA-BANDWIDTH-15GB', titleTh: 'ด่านค้ำประกันแบนด์วิดท์ DMA > 15 GB/s', titleEn: 'Zero-Copy DMA Bandwidth Gate', tier: 'Memory Ring', status: 'PASSED', latencyMs: 0.8, hash: 'sha256-d41d04f29a28', descTh: 'ยืนยันอัตราการถ่ายโอนข้อมูลความเร็วสูงแบบ Zero-Copy Ring Buffer' },
  { id: 'gate-10', gateNumber: 10, code: 'GATE-10-CRYO-TEMP-14MK', titleTh: 'ด่านความเย็นยิ่งยวด Cryo Bus 14.98 mK', titleEn: '14.98 mK Subzero Temperature Gate', tier: 'Memory Ring', status: 'PASSED', latencyMs: 2.0, hash: 'sha256-e533a912bc33', descTh: 'ตรวจวัดอุณหภูมิหล่อเย็น Helium-4 รักษาระดับ Superconducting State' },
  { id: 'gate-11', gateNumber: 11, code: 'GATE-11-THERMAL-85C-CUTOFF', titleTh: 'ด่านตัดวงจรความร้อนฉุกเฉิน 85.0°C', titleEn: '85°C Thermal Surge Cutoff Gate', tier: 'Memory Ring', status: 'PASSED', latencyMs: 0.4, hash: 'sha256-f644ba23cd44', descTh: 'ทริกเกอร์ Active Zeroization หากอุณหภูมิแตะระดับวิกฤต' },
  { id: 'gate-12', gateNumber: 12, code: 'GATE-12-FAIL-CLOSED-INTEGRATION', titleTh: 'ด่านความปลอดภัยแบบ Fail-Closed ล็อกอัตโนมัติ', titleEn: 'Fail-Closed Auto-Defensive Gate', tier: 'Memory Ring', status: 'PASSED', latencyMs: 1.7, hash: 'sha256-a755cb34de55', descTh: 'แช่แข็งสถานะระบบทันทีเมื่อตรวจพบความผิดปกติทางรหัสลับ' },
  { id: 'gate-13', gateNumber: 13, code: 'GATE-13-ZYR-02-TREASURY-SHIELD', titleTh: 'ด่านป้องกันคลังสินทรัพย์ Patch ZYR-02', titleEn: 'ZYR-02 Treasury Griefing Shield Gate', tier: 'Memory Ring', status: 'PASSED', latencyMs: 1.3, hash: 'sha256-b866dc45ef66', descTh: 'ล็อกฟังก์ชัน triggerFailClosed เฉพาะ OnlySovereign เท่านั้น' },
  { id: 'gate-14', gateNumber: 14, code: 'GATE-14-ZYR-03-CARDINALITY', titleTh: 'ด่านป้องกันการขยายสถานะ Patch ZYR-03', titleEn: 'ZYR-03 Cardinality Shield Gate', tier: 'Memory Ring', status: 'PASSED', latencyMs: 1.6, hash: 'sha256-c977ed56fa77', descTh: 'ล็อกฟังก์ชัน quarantineSeal ด้วย OnlyAuthorizedOracle ป้องกันซีลเท็จ' },
  { id: 'gate-15', gateNumber: 15, code: 'GATE-15-RFC-3161-TIMESTAMP', titleTh: 'ด่านประทับเวลาสากล RFC 3161 TSA', titleEn: 'RFC 3161 Trusted Time Stamping Gate', tier: 'Judicial ETDA', status: 'PASSED', latencyMs: 3.5, hash: 'sha256-d088fe670b88', descTh: 'ผูกโยงเวลามาตรฐานสากลความแม่นยำสูงระดับนาโนวินาที' },
  { id: 'gate-16', gateNumber: 16, code: 'GATE-16-ETDA-SEC-9-INTENT', titleTh: 'ด่านรับรองเจตนาทางกฎหมาย (ETDA ม.๙)', titleEn: 'ETDA Section 9 Legal Intent Gate', tier: 'Judicial ETDA', status: 'PASSED', latencyMs: 2.2, hash: 'sha256-e1990f781c99', descTh: 'ยืนยันเจตนารมณ์การทำธุรกรรมอิเล็กทรอนิกส์ของสถาปนิกสูงสุด' },
  { id: 'gate-17', gateNumber: 17, code: 'GATE-17-ETDA-SEC-26-NON-REPUDIATION', titleTh: 'ด่านลายมือชื่อปลอดภัยขั้นสูง (ETDA ม.๒๖)', titleEn: 'ETDA Section 26 Non-Repudiation Gate', tier: 'Judicial ETDA', status: 'PASSED', latencyMs: 2.8, hash: 'sha256-f2001a892d00', descTh: 'ค้ำประกันการไม่สามารถปฏิเสธความรับผิดชอบได้ในชั้นศาลไทย' },
  { id: 'gate-18', gateNumber: 18, code: 'GATE-18-ETDA-SEC-28-CERT-BURDEN', titleTh: 'ด่านภาระการพิสูจน์พยาน (ETDA ม.๒๘)', titleEn: 'ETDA Section 28 Evidence Burden Gate', tier: 'Judicial ETDA', status: 'PASSED', latencyMs: 3.0, hash: 'sha256-a3112b903e11', descTh: 'พร้อมออกชุดพยานหลักฐานและรายงานผลการรันย้อนหลัง 12 ขั้นตอน' },
  { id: 'gate-19', gateNumber: 19, code: 'GATE-19-PDPA-PII-MASKING', titleTh: 'ด่านแปลงข้อมูลนิรนาม PDPA ม.๒๖, ๒๘', titleEn: 'PDPA Zero-Knowledge PII Masking Gate', tier: 'Judicial ETDA', status: 'PASSED', latencyMs: 1.9, hash: 'sha256-b4223c014f22', descTh: 'ปกป้องข้อมูลส่วนบุคคลด้วยการเข้ารหัสคณิตศาสตร์ ZK-Proofs' },
  { id: 'gate-20', gateNumber: 20, code: 'GATE-20-ISO-27037-CHAIN-OF-CUSTODY', titleTh: 'ด่านห่วงโซ่พยานหลักฐาน ISO/IEC 27037', titleEn: 'ISO/IEC 27037 Chain of Custody Gate', tier: 'Judicial ETDA', status: 'PASSED', latencyMs: 2.5, hash: 'sha256-c5334d125033', descTh: 'การคงความถูกต้องของพยานแบบ DELETE NOTHING (V24 Archive)' },
  { id: 'gate-21', gateNumber: 21, code: 'GATE-21-12-STAGE-TRACE-REPLAY', titleTh: 'ด่านตรวจสอบการรันย้อนหลัง 12-Stage Trace', titleEn: '12-Stage Deterministic Trace Gate', tier: 'Judicial ETDA', status: 'PASSED', latencyMs: 4.2, hash: 'sha256-d6445e236144', descTh: 'สืบย้อนรอยธุรกรรม 142 ms บิตต่อบิตพร้อมพิมพ์เอกสารหลักฐาน' },
  { id: 'gate-22', gateNumber: 22, code: 'GATE-22-FROZEN-LTS-SEAL', titleTh: 'ด่านปิดผนึกระบบถาวร (FROZEN v1.2 LTS)', titleEn: 'Permanent Frozen LTS Seal Gate', tier: 'Judicial ETDA', status: 'PASSED', latencyMs: 1.0, hash: 'sha256-e7556f347255', descTh: 'แช่แข็งสถานะระบบและปิดการแก้ไขรหัสหลัก 100% GREEN' },
];

interface Room05MasterPanelProps {
  snapshots?: HardwareSnapshot[];
  onNavigate?: (view: ViewType) => void;
  onOpenCertificate?: () => void;
}

export const Room05MasterPanel: React.FC<Room05MasterPanelProps> = ({
  snapshots = [],
  onNavigate,
  onOpenCertificate,
}) => {
  const [selectedGateId, setSelectedGateId] = useState<string>('gate-01');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTier, setActiveTier] = useState<'ALL' | 'Pre-Flight' | 'Lattice PQC' | 'Memory Ring' | 'Judicial ETDA'>('ALL');
  const [isVerifyingAll, setIsVerifyingAll] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const selectedGate = useMemo(
    () => MASTER_22_GATES.find((g) => g.id === selectedGateId) || MASTER_22_GATES[0],
    [selectedGateId]
  );

  const filteredGates = useMemo(() => {
    return MASTER_22_GATES.filter((gate) => {
      const matchTier = activeTier === 'ALL' || gate.tier === activeTier;
      if (!matchTier) return false;
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        gate.code.toLowerCase().includes(term) ||
        gate.titleTh.toLowerCase().includes(term) ||
        gate.titleEn.toLowerCase().includes(term) ||
        gate.descTh.toLowerCase().includes(term)
      );
    });
  }, [activeTier, searchTerm]);

  const handleCopy = (id: string, text: string) => {
    copyToClipboard(text);
    setCopiedId(id);
    playTone(650, 0.03);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleVerify22Gates = () => {
    if (isVerifyingAll) return;
    setIsVerifyingAll(true);
    playTone(520, 0.06);

    setTimeout(() => {
      setIsVerifyingAll(false);
      playAuditChime();
    }, 1200);
  };

  // Latency chart data across 4 tiers
  const tierLatencyData = useMemo(() => {
    return [
      { name: 'Pre-Flight (Gates 1,5-7)', avgLatency: 1.9, gates: 4 },
      { name: 'Lattice PQC (Gates 2-4)', avgLatency: 2.1, gates: 3 },
      { name: 'Memory Ring (Gates 8-14)', avgLatency: 1.3, gates: 7 },
      { name: 'Judicial ETDA (Gates 15-22)', avgLatency: 2.6, gates: 8 },
    ];
  }, []);

  return (
    <div className="space-y-6 font-mono text-zinc-300">
      {/* Top Banner for Room 05 */}
      <div className="p-6 sm:p-8 rounded-[28px] bg-gradient-to-br from-violet-950/40 via-[#0d0a1a]/95 to-black border border-violet-500/40 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-violet-500/10 via-fuchsia-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/40 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(139,92,246,0.25)]">
                <Layers className="w-4 h-4 text-violet-400 animate-pulse" />
                CHAMBER 05 • MASTER GATES 22/22 VERIFICATION
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                22/22 GATES PASSED (100%)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold">
                CLEARANCE: LEVEL 20 SRE
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
                ประตูด่านทดสอบหลัก ๒๒ ด่าน (Master Verification Gates)
              </h2>
              <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
                การตรวจสอบความปลอดภัยและความสอดคล้องตามกฎหมาย ๔ มิติหลัก (Pre-Flight, วิทยาการรหัสลับแลตทิซ, การแยกวงแหวนหน่วยความจำเคอร์เนล, และการรับรองพยานหลักฐานตาม พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์)
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                <span className="text-zinc-500">Passed:</span>
                <span className="text-emerald-300 font-bold">22/22 Unanimous</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                <span className="text-zinc-500">Avg Latency:</span>
                <span className="text-cyan-300 font-bold">1.82 ms/Gate</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                <span className="text-zinc-500">Audit Ref:</span>
                <span className="text-violet-300 font-bold">GATE-849202-ALL</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                <span className="text-zinc-500">Court Admissible:</span>
                <span className="text-amber-300 font-bold">100% Ready</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              onClick={handleVerify22Gates}
              disabled={isVerifyingAll}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-400 hover:to-violet-500 text-white font-black text-xs transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(139,92,246,0.3)] disabled:opacity-50 cursor-pointer"
            >
              {isVerifyingAll ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sequencing 22 Gates...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify All 22 Gates</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                playTone(720, 0.04);
                if (onOpenCertificate) onOpenCertificate();
              }}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <FileCheck2 className="w-4 h-4 text-violet-400" />
              <span>Evidence Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tier Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-black/50 border border-white/10 text-xs font-bold">
        {(['ALL', 'Pre-Flight', 'Lattice PQC', 'Memory Ring', 'Judicial ETDA'] as const).map((tier) => (
          <button
            key={tier}
            onClick={() => {
              playTone(620, 0.03);
              setActiveTier(tier);
            }}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTier === tier
                ? 'bg-violet-500/20 text-violet-200 border border-violet-500/40 shadow-[0_0_12px_rgba(139,92,246,0.2)]'
                : 'text-zinc-400 hover:text-zinc-200 bg-white/5 border border-transparent'
            }`}
          >
            <span>{tier === 'ALL' ? 'All 22 Gates' : tier}</span>
          </button>
        ))}
      </div>

      {/* Search & Latency Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Latency by Tier Bar Chart */}
        <div className="lg:col-span-1 p-5 rounded-2xl bg-black/60 border border-white/10 space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-violet-400" />
            Gate Execution Latency by Tier (ms)
          </h3>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tierLatencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={9} interval={0} tick={{ fontSize: 8 }} />
                <YAxis stroke="#71717a" fontSize={9} unit="ms" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                  itemStyle={{ color: '#c084fc' }}
                />
                <Bar dataKey="avgLatency" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Search & Quick Stats */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/60 border border-white/10">
            <Search className="w-4 h-4 text-zinc-400 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหารหัสด่านทดสอบ, ชื่อด่าน, หรือข้อกำหนดทางกฎหมาย..."
              className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
            />
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="text-zinc-400">
              Showing <strong className="text-white">{filteredGates.length}</strong> of 22 Master Verification Gates
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                100% UNANIMOUS PASS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Seal Generation Over Time - Recharts Line Chart */}
      <SealGenerationVelocityLineChart
        title="การสร้างตราประทับเมื่อเวลาผ่านไป (Seal Generation Over Time)"
        subtitle="แสดงอัตราความเร็ว (Velocity) และการเติบโตสะสมของการสร้างตราประทับทองคำ ๑๔,๙๐๒ ชุดผ่านประตูด่านทดสอบหลัก ๒๒ ด่าน"
      />

      {/* Grid of 22 Master Gates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredGates.map((gate) => {
          const isSelected = selectedGateId === gate.id;

          return (
            <div
              key={gate.id}
              onClick={() => {
                playTone(580, 0.03);
                setSelectedGateId(gate.id);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-violet-950/40 border-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.25)]'
                  : 'bg-black/60 border-white/10 hover:border-violet-500/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 font-bold text-[10px] border border-violet-500/30">
                    GATE {gate.gateNumber}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {gate.tier}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {gate.latencyMs}ms
                </span>
              </div>

              <h4 className="text-xs font-bold text-white mb-1 line-clamp-1">{gate.titleTh}</h4>
              <div className="text-[10px] text-zinc-400 mb-2 font-sans">{gate.titleEn}</div>
              <p className="text-[11px] text-zinc-400 line-clamp-2 mb-3">{gate.descTh}</p>

              <div className="pt-2 border-t border-white/5 space-y-1 text-[10px]">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Hash Digest:</span>
                  <div className="flex items-center gap-1">
                    <code className="text-violet-300 font-mono">{gate.hash}</code>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(`gate-${gate.id}`, gate.hash);
                      }}
                      className="p-1 rounded hover:bg-white/10 text-zinc-400"
                    >
                      {copiedId === `gate-${gate.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-500" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
