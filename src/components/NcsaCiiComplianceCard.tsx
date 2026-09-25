import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  Server,
  Zap,
  Lock,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Radio,
  Clock,
  RefreshCw,
  Terminal,
  Scale,
  Award,
  ExternalLink,
  ChevronRight,
  Eye,
  Bell,
  Sparkles,
  Search,
} from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { CANONICAL_MERKLE_ROOT, SYSTEM_METADATA } from '../data/canonicalData';

export type ThreatLevel = 1 | 2 | 3;

interface CiiSector {
  id: string;
  nameTh: string;
  nameEn: string;
  code: string;
  health: number;
  latencyMs: number;
  status: 'ONLINE' | 'GUARD' | 'PROTECTED';
  incidentCount: number;
  encryption: string;
}

const CII_SECTORS: CiiSector[] = [
  {
    id: 'sec-01',
    nameTh: 'ความมั่นคงของรัฐและบริการภาครัฐ',
    nameEn: 'National Security & Public Services',
    code: 'CII-GOV-01',
    health: 99.98,
    latencyMs: 1.4,
    status: 'PROTECTED',
    incidentCount: 0,
    encryption: 'NIST FIPS 204 ML-DSA-87',
  },
  {
    id: 'sec-02',
    nameTh: 'การเงินและการธนาคาร',
    nameEn: 'Banking & Financial Services',
    code: 'CII-FIN-02',
    health: 99.99,
    latencyMs: 1.8,
    status: 'PROTECTED',
    incidentCount: 0,
    encryption: 'PQC ML-KEM-1024 + HSM',
  },
  {
    id: 'sec-03',
    nameTh: 'โทรคมนาคมและโครงสร้างพื้นฐานดิจิทัล',
    nameEn: 'Telecommunications & Digital Mesh',
    code: 'CII-TEL-03',
    health: 100.0,
    latencyMs: 1.1,
    status: 'PROTECTED',
    incidentCount: 0,
    encryption: 'Quantum Entropy Wireguard',
  },
  {
    id: 'sec-04',
    nameTh: 'การขนส่งและโลจิสติกส์',
    nameEn: 'Transportation & Logistics',
    code: 'CII-LOG-04',
    health: 99.95,
    latencyMs: 2.2,
    status: 'PROTECTED',
    incidentCount: 0,
    encryption: 'WORM Immutable Hash Ledger',
  },
  {
    id: 'sec-05',
    nameTh: 'พลังงานและสาธารณูปโภค',
    nameEn: 'Energy & Public Utilities',
    code: 'CII-ENE-05',
    health: 99.99,
    latencyMs: 1.6,
    status: 'PROTECTED',
    incidentCount: 0,
    encryption: 'Cryo-Enclave Isolated',
  },
  {
    id: 'sec-06',
    nameTh: 'สาธารณสุขและการแพทย์',
    nameEn: 'Public Health & Healthcare',
    code: 'CII-HLT-06',
    health: 99.97,
    latencyMs: 1.9,
    status: 'PROTECTED',
    incidentCount: 0,
    encryption: 'Zero-Knowledge Health Enclave',
  },
  {
    id: 'sec-07',
    nameTh: 'บริการฉุกเฉินและความปลอดภัยสาธารณะ',
    nameEn: 'Emergency & Public Safety',
    code: 'CII-EMG-07',
    health: 100.0,
    latencyMs: 0.9,
    status: 'PROTECTED',
    incidentCount: 0,
    encryption: '10/10 REAL_HSM Fast-Quorum',
  },
  {
    id: 'sec-08',
    nameTh: 'ศูนย์ข้อมูลอธิปไตย (Sovereign Data Center)',
    nameEn: 'Sovereign Enclaves & Vaults',
    code: 'CII-DC-08',
    health: 100.0,
    latencyMs: 0.8,
    status: 'PROTECTED',
    incidentCount: 0,
    encryption: 'Dual-Hash Fusion BLAKE3+SHA3',
  },
];

interface NcsaCiiComplianceCardProps {
  onOpenSearch?: (query: string) => void;
  onOpenChecklist?: () => void;
}

export const NcsaCiiComplianceCard: React.FC<NcsaCiiComplianceCardProps> = ({
  onOpenSearch,
  onOpenChecklist,
}) => {
  const [threatLevel, setThreatLevel] = useState<ThreatLevel>(1);
  const [selectedSector, setSelectedSector] = useState<CiiSector>(CII_SECTORS[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<string>('Just now');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleRunSecurityScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    playTone(550, 0.08);

    setTimeout(() => {
      setIsScanning(false);
      setLastScanTime(new Date().toLocaleTimeString('th-TH'));
      playAuditChime();
      showToast('การสแกนความมั่นคงปลอดภัยไซเบอร์ CII 8 หมวดหมู่ เสร็จสิ้น: 0 ช่องโหว่ (100% Passed)');
    }, 1200);
  };

  const handleSetThreatLevel = (lvl: ThreatLevel) => {
    setThreatLevel(lvl);
    if (lvl === 1) playTone(500, 0.04);
    else if (lvl === 2) playTone(650, 0.06);
    else playTone(800, 0.08);
  };

  return (
    <div className="p-6 sm:p-7 rounded-[26px] bg-[#070a12] border-amber-500/30 shadow-[0_10px_35px_-10px_rgba(245,158,11,0.15)] relative overflow-hidden font-mono space-y-6">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)] shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                พ.ร.บ. การรักษาความมั่นคงปลอดภัยไซเบอร์ พ.ศ. ๒๕๖๒ (NCSA)
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                CII COMPLIANT
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border-amber-500/30 text-amber-300 text-[10px] font-bold">
                สกมช. CERT DIRECT
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              ศูนย์เฝ้าระวังและคุ้มครองโครงสร้างพื้นฐานสำคัญทางสารสนเทศ (Critical Information Infrastructure) ๘ หมวดหมู่
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRunSecurityScan}
            disabled={isScanning}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
              isScanning
                ? 'bg-amber-500/20 text-amber-200 border-amber-500/40 animate-pulse'
                : 'bg-white/5 hover:bg-white/10 text-amber-300 border-amber-500/30 hover:border-amber-400/50'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning 8 CII Sectors...' : 'Run CII Health Audit'}</span>
          </button>

          {onOpenChecklist && (
            <button
              onClick={() => {
                playTone(600, 0.04);
                onOpenChecklist();
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border-amber-500/40 transition-all flex items-center gap-1.5"
            >
              <FileCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>NCSA Checklist</span>
            </button>
          )}
        </div>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className="p-3 rounded-xl bg-amber-950/70 border-amber-500/40 text-amber-200 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top 4 Core Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-black/50 border-white/10 space-y-1">
          <span className="text-[10px] text-zinc-400 block flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-400" />
            CII Sectors Monitored
          </span>
          <div className="text-sm sm:text-base font-bold text-white">8/8 Sectors Active</div>
          <div className="text-[10px] text-emerald-400 font-bold">100% Coverage Online</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/50 border-white/10 space-y-1">
          <span className="text-[10px] text-zinc-400 block flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-400" />
            Threat Response SLA (RTO)
          </span>
          <div className="text-sm sm:text-base font-bold text-cyan-300">35.8 ms</div>
          <div className="text-[10px] text-zinc-400">Standard Requirement &lt; 50ms</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/50 border-white/10 space-y-1">
          <span className="text-[10px] text-zinc-400 block flex items-center gap-1">
            <Lock className="w-3 h-3 text-purple-400" />
            Audit Log Retention (Sec 44)
          </span>
          <div className="text-sm sm:text-base font-bold text-purple-300">&gt; 90 Days WORM</div>
          <div className="text-[10px] text-emerald-400 font-bold">Cryptographically Sealed</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/50 border-white/10 space-y-1">
          <span className="text-[10px] text-zinc-400 block flex items-center gap-1">
            <Cpu className="w-3 h-3 text-amber-400" />
            Hardware Root of Trust
          </span>
          <div className="text-sm sm:text-base font-bold text-amber-300">FIPS 140-3 L4</div>
          <div className="text-[10px] text-zinc-400">10/10 REAL_HSM Council</div>
        </div>
      </div>

      {/* Real-time Threat Level Detection Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0f1e] border-white/10 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              ระดับการเฝ้าระวังภัยคุกคามทางไซเบอร์ (NCSA Threat Detection Levels)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleSetThreatLevel(1)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                threatLevel === 1
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'bg-black/40 text-zinc-400 border-white/5 hover:text-white'
              }`}
            >
              ระดับ ๑: ไม่ร้ายแรง (Nominal)
            </button>

            <button
              onClick={() => handleSetThreatLevel(2)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                threatLevel === 2
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'bg-black/40 text-zinc-400 border-white/5 hover:text-white'
              }`}
            >
              ระดับ ๒: ร้ายแรง (Critical)
            </button>

            <button
              onClick={() => handleSetThreatLevel(3)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                threatLevel === 3
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                  : 'bg-black/40 text-zinc-400 border-white/5 hover:text-white'
              }`}
            >
              ระดับ ๓: วิกฤติ (Crisis)
            </button>
          </div>
        </div>

        {/* Threat Level Narrative Box */}
        <div className={`p-3.5 rounded-xl border text-xs leading-relaxed transition-all ${
          threatLevel === 1
            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
            : threatLevel === 2
            ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
            : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
        }`}>
          {threatLevel === 1 && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>ระดับ ๑ (ไม่ร้ายแรง):</strong> ระบบทำงานในโหมดเสถียรปกติ ปริมาณทราฟฟิกเอนโทรปีเฉลี่ย 11,264 KBps ไม่มีพฤติกรรมผิดปกติ รายงานสถานะอัตโนมัติต่อศูนย์ประสานการรักษาความมั่นคงปลอดภัยไซเบอร์ (NCSA-CERT) ตามรอบเวลาปกติ
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold shrink-0">
                STATUS: NOMINAL
              </span>
            </div>
          )}

          {threatLevel === 2 && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>ระดับ ๒ (ร้ายแรง):</strong> ตรวจพบความพยายามโจมตีหรือการเปลี่ยนแปลงข้อมูลเกินพิกัด Circuit Breaker พร้อมสั่งตัดการเชื่อมต่อเครือข่ายภายนอก (Fail-Closed) และแจ้งเตือนเจ้าหน้าที่คุ้มครองข้อมูลทันทีภายใน 142ms
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold shrink-0">
                STATUS: GUARD ARMED
              </span>
            </div>
          )}

          {threatLevel === 3 && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  <strong>ระดับ ๓ (วิกฤติ):</strong> เหตุการณ์ภัยคุกคามระดับชาติ ระบบเข้าสู่โหมดกักกันฉุกเฉิน (Lockdown) ปิดผนึกสมุดบัญชีแบบ WORM ล็อกอ่านอย่างเดียว และต้องใช้มติ 10/10 REAL_HSM Council ในการปลดล็อก
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold shrink-0">
                STATUS: CRISIS QUARANTINE
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 8 CII Sectors Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-bold">
          <span className="flex items-center gap-1.5 text-zinc-200">
            <Server className="w-4 h-4 text-amber-400" />
            สถานะรายหมวดหมู่โครงสร้างพื้นฐานสำคัญทางสารสนเทศ (๘ CII Sectors)
          </span>
          <span className="text-[11px] text-zinc-500">Last Audit: {lastScanTime}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CII_SECTORS.map((sector) => (
            <button
              key={sector.id}
              onClick={() => {
                playTone(600, 0.03);
                setSelectedSector(sector);
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between space-y-2.5 ${
                selectedSector.id === sector.id
                  ? 'bg-[#0c1427] border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                  : 'bg-black/40 border-white/5 hover:border-white/20 hover:bg-black/60'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-mono text-zinc-400">
                  {sector.code}
                </span>
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {sector.health}%
                </span>
              </div>

              <div>
                <div className="text-xs font-bold text-white line-clamp-1">{sector.nameTh}</div>
                <div className="text-[10px] text-zinc-400 line-clamp-1">{sector.nameEn}</div>
              </div>

              <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                <span>Latency: <strong className="text-cyan-300">{sector.latencyMs}ms</strong></span>
                <span className="text-emerald-300 font-bold">{sector.status}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Sector Drill-down Panel */}
      <div className="p-4 rounded-2xl bg-[#0a0f1e] border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">{selectedSector.nameTh}</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border-amber-500/30">
              {selectedSector.code}
            </span>
          </div>
          <div className="text-[11px] text-zinc-400">
            ระบบความปลอดภัยทางรหัสลับ: <code className="text-cyan-300 font-mono">{selectedSector.encryption}</code> | เวลาตอบสนอง: <strong className="text-white">{selectedSector.latencyMs}ms</strong>
          </div>
        </div>

        {onOpenSearch && (
          <button
            onClick={() => {
              playTone(620, 0.04);
              onOpenSearch(`พ.ร.บ. การรักษาความมั่นคงปลอดภัยไซเบอร์ พ.ศ. 2562 ${selectedSector.nameTh} CII`);
            }}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-300 border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span>ค้นหากฎหมายมาตราที่เกี่ยวข้อง</span>
          </button>
        )}
      </div>

    </div>
  );
};
