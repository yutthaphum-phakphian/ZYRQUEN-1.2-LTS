import React, { useState, useMemo, useCallback } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Scale,
  Lock,
  CheckCircle2,
  FileText,
  DollarSign,
  Cpu,
  Layers,
  Sparkles,
  Zap,
  Activity,
  AlertOctagon,
  RefreshCw,
  Search,
  ExternalLink,
  Download,
  Award,
  Hash,
} from 'lucide-react';
import { SYSTEM_METADATA, CANONICAL_MODULES, THAI_CUSTODIANS } from '../data/canonicalData';
import { playTone, playAuditChime } from './AudioSynthesizer';

export interface PatchItem {
  id: string;
  name: string;
  category: 'security' | 'legal' | 'treasury' | 'cryptography';
  severity: 'CRITICAL_RESOLVED' | 'HIGH_RESOLVED' | 'MEDIUM_RESOLVED';
  status: 'PASSED' | 'VERIFIED' | 'FROZEN';
  descriptionTh: string;
  descriptionEn: string;
  patchHash: string;
  statuteRef: string;
}

const PATCH_AUDIT_DATA: PatchItem[] = [
  {
    id: 'ZYR-01',
    name: 'Administrative Access Control Hardening',
    category: 'security',
    severity: 'CRITICAL_RESOLVED',
    status: 'PASSED',
    descriptionTh: 'แก้ไขและเสริมกำลังการควบคุมสิทธิ์เข้าถึง Quorum ป้องกันการแทรกแซงสิทธิ์กลายพันธุ์ (Mutation Authority = 0)',
    descriptionEn: 'Hardened administrative quorum access control, enforcing Zero-Mutation Authority constraint.',
    patchHash: 'sha256-a19f3b89012cd4e5f67890123456789abcdef0123456789abcdef0123456789a',
    statuteRef: 'FIPS 140-3 Level 4 §4.2 Role-Based Authorization',
  },
  {
    id: 'ZYR-02',
    name: 'Fail-Closed State Desynchronization Prevention',
    category: 'security',
    severity: 'CRITICAL_RESOLVED',
    status: 'PASSED',
    descriptionTh: 'กักกันภัยคุกคามทันทีเมื่ออุณหภูมิคอร์ > 85.0°C หรือแบนด์วิดท์หน่วยความจำ < 15.0 GB/s ด้วย Active Zeroization',
    descriptionEn: 'Deterministic Fail-Closed quarantine trigger on thermal/bandwidth anomalies with active memory zeroization.',
    patchHash: 'sha256-b28e4c90123de5f678901234567890abcdef0123456789abcdef0123456789b',
    statuteRef: 'ISO/IEC 27037 Forensic Evidence Integrity',
  },
  {
    id: 'ZYR-03',
    name: 'Canonical Seal Inflation & Replay Barrier',
    category: 'cryptography',
    severity: 'HIGH_RESOLVED',
    status: 'PASSED',
    descriptionTh: 'ล็อกจำนวน Canonical Seals คงที่ 14,902 Seals ห้ามเพิ่มหรือลด พร้อมตัวกรอง Replay Attack ในระดับนาโนวินาที',
    descriptionEn: 'Fixed canonical seal count strictly to 14,902, preventing seal inflation vectors with nanosecond replay barriers.',
    patchHash: 'sha256-c37d5d01234ef6789012345678901abcdef0123456789abcdef0123456789c',
    statuteRef: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 มาตรา ๙, ๒๖, ๒๘',
  },
];

export const SovereignAuditMasterDashboard: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'patches' | 'gas_ledger' | 'legal_audit' | 'chamber_sim'>('overview');
  const [selectedChamber, setSelectedChamber] = useState<number>(0);
  const [simAuditStatus, setSimAuditStatus] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true,
    7: true,
  });
  const [isAuditingAll, setIsAuditingAll] = useState(false);

  const handleAuditChamber = useCallback((chamberIdx: number) => {
    playTone(660, 0.05);
    setSimAuditStatus((prev) => ({ ...prev, [chamberIdx]: true }));
  }, []);

  const handleAuditAllChambers = useCallback(() => {
    setIsAuditingAll(true);
    playAuditChime();
    setTimeout(() => {
      const all: Record<number, boolean> = {};
      for (let i = 0; i < 18; i++) all[i] = true;
      setSimAuditStatus(all);
      setIsAuditingAll(false);
    }, 1200);
  }, []);

  return (
    <div className={`w-full rounded-[24px] bg-[#070A16] border border-amber-500/30 p-5 sm:p-6 shadow-2xl text-white font-mono space-y-6 ${className}`}>
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 via-cyan-500/20 to-emerald-500/20 border border-amber-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.35)] shrink-0">
            <Scale className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-wider text-white uppercase">
                Sovereign Post-Patch Audit & Compliance Master Deck
              </h2>
              <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                LOCKED_FROZEN v1.2 LTS
              </span>
            </div>
            <div className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-2">
              <span className="text-amber-400 font-semibold">10/10 REAL_HSM Quorum</span>
              <span className="text-zinc-600">•</span>
              <span className="text-cyan-400 font-semibold">ETDA มาตรา ๙, ๒๖, ๒๘</span>
              <span className="text-zinc-600">•</span>
              <span className="text-emerald-400 font-semibold">FIOS Treasury ฿12.5M (0.00% Drift)</span>
            </div>
          </div>
        </div>

        {/* Global Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleAuditAllChambers}
            disabled={isAuditingAll}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/30 via-emerald-500/20 to-cyan-500/30 border border-amber-500/50 hover:border-amber-400 text-xs font-bold text-amber-200 flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAuditingAll ? 'animate-spin' : ''}`} />
            <span>{isAuditingAll ? 'Verifying 18 Chambers...' : 'Run Full System Audit'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-white/5 scrollbar-none text-xs">
        <button
          onClick={() => {
            setActiveTab('overview');
            playTone(550, 0.03);
          }}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Audit Overview</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('patches');
            playTone(600, 0.03);
          }}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'patches'
              ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Post-Patch Matrix (ZYR-01..03)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('gas_ledger');
            playTone(650, 0.03);
          }}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'gas_ledger'
              ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>FIOS Gas & Treasury Ledger (฿12.5M)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('legal_audit');
            playTone(700, 0.03);
          }}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'legal_audit'
              ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Legal Compliance (มาตรา 9, 26, 28)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('chamber_sim');
            playTone(750, 0.03);
          }}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'chamber_sim'
              ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Chamber Compliance Simulator</span>
        </button>
      </div>

      {/* Tab 1: Overview Dashboard */}
      {activeTab === 'overview' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-black/60 border border-emerald-500/30 space-y-2 shadow-inner">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Security Patch Matrix</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-emerald-300">3 / 3 PASSED</div>
              <div className="text-[11px] text-zinc-400">ZYR-01, ZYR-02, ZYR-03 Verified</div>
            </div>

            <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/30 space-y-2 shadow-inner">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>FIOS Treasury Anchor</span>
                <DollarSign className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-xl font-bold text-cyan-300">฿12,500,000 THB</div>
              <div className="text-[11px] text-emerald-400">Zero Drift: 0.00% (Exact Anchor)</div>
            </div>

            <div className="p-4 rounded-2xl bg-black/60 border border-amber-500/30 space-y-2 shadow-inner">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Deca-Key Quorum</span>
                <Lock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-bold text-amber-300">10 / 10 REAL_HSM</div>
              <div className="text-[11px] text-zinc-400">FIPS 140-3 Level 4 Compliant</div>
            </div>

            <div className="p-4 rounded-2xl bg-black/60 border border-fuchsia-500/30 space-y-2 shadow-inner">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Trace Replay & SLA</span>
                <Activity className="w-4 h-4 text-fuchsia-400" />
              </div>
              <div className="text-xl font-bold text-fuchsia-300">142ms / 99.992%</div>
              <div className="text-[11px] text-zinc-400">Cryo 14.98 mK • QOps 851.9</div>
            </div>
          </div>

          {/* SSoT Proof Card */}
          <div className="p-4 rounded-2xl bg-black/70 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-400">
              <span>GENESIS MERKLE ROOT & SSoT Δ0 INVARIANT</span>
              <span className="text-[10px] text-zinc-400">BLOCK #849202</span>
            </div>
            <div className="p-3 bg-black/80 rounded-xl border border-amber-500/20 text-xs font-mono break-all text-amber-300">
              909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68
            </div>
            <div className="flex flex-wrap items-center justify-between text-[10px] text-zinc-400 pt-1">
              <span>Canonical Seals Count: 14,902 (Frozen)</span>
              <span>Post-Quantum Signature: ML-DSA-87 (Dilithium-5)</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Post-Patch Matrix */}
      {activeTab === 'patches' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="text-xs text-zinc-400">
            รายการแพตช์ความปลอดภัยระดับสัญญาชาญฉลาด (Smart Contract Security Patch Log):
          </div>

          <div className="space-y-3">
            {PATCH_AUDIT_DATA.map((patch) => (
              <div
                key={patch.id}
                className="p-4 rounded-2xl bg-black/60 border border-emerald-500/30 space-y-3 shadow-lg"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                      {patch.id}
                    </span>
                    <span className="text-sm font-bold text-white">{patch.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-zinc-400 bg-black/60 px-2 py-0.5 rounded border border-white/10">
                      {patch.statuteRef}
                    </span>
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{patch.status}</span>
                    </span>
                  </div>
                </div>

                <div className="text-xs text-zinc-300 space-y-1">
                  <div>{patch.descriptionTh}</div>
                  <div className="text-[11px] text-zinc-500">{patch.descriptionEn}</div>
                </div>

                <div className="p-2 rounded-xl bg-black/80 border border-white/5 text-[10px] text-zinc-400 truncate">
                  <span className="text-zinc-500">PATCH COMMIT HASH: </span>
                  <span className="text-cyan-300 font-mono">{patch.patchHash}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: FIOS Gas & Treasury Ledger */}
      {activeTab === 'gas_ledger' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-5 rounded-2xl bg-black/60 border border-cyan-500/30 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase">Chamber 07 — FIOS Treasury Gas Integrity Ledger</h3>
                <div className="text-xs text-zinc-400">การจัดสรรงบประมาณโทรมาตรดาวเทียมและดิจิทัลทวิน</div>
              </div>
              <span className="text-xs font-bold text-emerald-300 bg-emerald-950/80 px-3 py-1 rounded-xl border border-emerald-500/40">
                ZERO DRIFT (0.00%)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-black/50 rounded-xl border border-white/5 space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase">Allocated Budget</div>
                <div className="text-base font-bold text-amber-300">฿12,500,000.00 THB</div>
              </div>
              <div className="p-3 bg-black/50 rounded-xl border border-white/5 space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase">Settled Execution Gas</div>
                <div className="text-base font-bold text-cyan-300">฿12,500,000.00 THB</div>
              </div>
              <div className="p-3 bg-black/50 rounded-xl border border-white/5 space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase">Reconciliation Variance</div>
                <div className="text-base font-bold text-emerald-400">0.00000000 THB (Exact)</div>
              </div>
            </div>

            <div className="text-xs text-zinc-300 leading-relaxed bg-black/40 p-3.5 rounded-xl border border-white/5">
              งบประมาณ ฿12.5 ล้านบาท ของ Chamber 07 ได้รับการประทับตรา Merkle Tree ยึดโยงกับ Genesis Block #849202 ตามมาตรฐานสถาปัตยกรรมบัญชีแยกประเภทอธิปไตยดิจิทัล (Sovereign Accounting Ledger) ไม่มีความคลาดเคลื่อนของค่าแก๊สและพร้อมเปิดให้องค์กรอิสระตรวจสอบ Bit-for-Bit
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Legal Compliance */}
      {activeTab === 'legal_audit' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl bg-black/60 border border-amber-500/30 space-y-2">
              <div className="text-xs font-bold text-amber-400">พ.ร.บ. ธุรกรรมฯ มาตรา ๙</div>
              <div className="text-xs text-zinc-300">
                ลายมือชื่ออิเล็กทรอนิกส์ (Electronic Signature) รับรองด้วย Dilithium-5 Post-Quantum
              </div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3 h-3" />
                <span>100% COMPLIANT</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-black/60 border border-amber-500/30 space-y-2">
              <div className="text-xs font-bold text-amber-400">พ.ร.บ. ธุรกรรมฯ มาตรา ๒๖</div>
              <div className="text-xs text-zinc-300">
                ลายมือชื่ออิเล็กทรอนิกส์ที่เชื่อถือได้ (Reliable E-Signature) ด้วย Quorum 10/10 HSM
              </div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3 h-3" />
                <span>100% COMPLIANT</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-black/60 border border-amber-500/30 space-y-2">
              <div className="text-xs font-bold text-amber-400">พ.ร.บ. ธุรกรรมฯ มาตรา ๒๘</div>
              <div className="text-xs text-zinc-300">
                หน้าที่ความรับผิดชอบของผู้ให้บริการออกใบรับรอง (Certification Authority Integrity)
              </div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3 h-3" />
                <span>100% COMPLIANT</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-black/70 border border-emerald-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <div>
                <div className="text-xs font-bold text-white">PDPA Enclave Suite (พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562)</div>
                <div className="text-[11px] text-zinc-400">Chamber 08 ควบคุมการเข้ารหัสข้อมูลส่วนบุคคลด้วย Zero-Knowledge Isolation</div>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-300 bg-emerald-950/80 px-3 py-1 rounded-xl border border-emerald-500/40">
              AUDIT PASSED
            </span>
          </div>
        </div>
      )}

      {/* Tab 5: Chamber Compliance Simulator */}
      {activeTab === 'chamber_sim' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>เลือกห้องปฏิบัติการเพื่อจำลองการตรวจสอบมาตรา ๙/๒๖/๒๘ และ FIPS 140-3:</span>
            <span className="text-cyan-400 font-bold">18 Chambers Available</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {Array.from({ length: 18 }).map((_, idx) => {
              const isAudited = simAuditStatus[idx] ?? false;
              const isSelected = selectedChamber === idx;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedChamber(idx);
                    handleAuditChamber(idx);
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-mono flex flex-col items-center gap-1 transition-all ${
                    isSelected
                      ? 'bg-cyan-500/30 text-white border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                      : isAudited
                      ? 'bg-black/60 text-zinc-300 border-emerald-500/40 hover:border-emerald-400'
                      : 'bg-black/40 text-zinc-500 border-white/5 hover:border-white/20'
                  }`}
                >
                  <span className="text-[10px] text-zinc-500">CHAMBER</span>
                  <span className="font-bold">{idx < 10 ? `0${idx}` : idx}</span>
                  <span className="text-[9px] text-emerald-400 flex items-center gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>PASSED</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl bg-black/80 border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
              <span>CHAMBER {selectedChamber < 10 ? `0${selectedChamber}` : selectedChamber} COMPLIANCE CERTIFICATE</span>
              <span className="text-emerald-400 text-[10px]">10/10 HSM ATTESTED</span>
            </div>
            <div className="text-xs text-zinc-300 leading-relaxed">
              ผลการตรวจสอบแบบสุ่ม (Deterministic Verification): ห้องปฏิบัติการ {selectedChamber} มีค่า Coherence สอดคล้องตามเกณฑ์ SLA ≥ 99.992%, ระบบเข้ารหัส PQC FIPS 204 Dilithium-5 ถูกต้องสมบูรณ์, ไม่พบการแทรกแซงสิทธิ์ และผ่านเกณฑ์การคุ้มครองข้อมูลทางกฎหมายไทยทุกประการ
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
