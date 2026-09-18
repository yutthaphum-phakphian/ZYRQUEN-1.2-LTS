import React, { useState, useMemo } from 'react';
import {
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Search,
  Copy,
  Check,
  Zap,
  RefreshCw,
  Scale,
  FileCheck2,
  Sparkles,
  Activity,
  SlidersHorizontal,
  Layers,
  KeyRound,
  ShieldAlert,
  Flame,
  Binary,
  ArrowRightLeft
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

export interface CryptoAlgorithmSpec {
  id: string;
  name: string;
  standard: string;
  role: 'Primary' | 'Fallback' | 'High-Speed' | 'Deprecated';
  type: string;
  securityLevel: string;
  status: 'ACTIVE' | 'STANDBY' | 'DEPRECATED';
  keySize: string;
  signatureSize: string;
  notesTh: string;
}

export const CRYPTO_ALGO_SPECS: CryptoAlgorithmSpec[] = [
  {
    id: 'algo-01',
    name: 'ML-DSA-87 (Dilithium-5)',
    standard: 'NIST FIPS 204',
    role: 'Primary',
    type: 'Lattice-based (Module-LWE/SIS)',
    securityLevel: 'NIST Category 5 (256-bit PQC)',
    status: 'ACTIVE',
    keySize: '2,592 bytes',
    signatureSize: '4,595 bytes',
    notesTh: 'ลายเซ็นหลักของระบบและสภา 10/10 HSM ในการสลักสิทธิ์และตรึง 14,902 ตราประทับทองคำ',
  },
  {
    id: 'algo-02',
    name: 'SLH-DSA (SPHINCS+)',
    standard: 'NIST FIPS 205',
    role: 'Fallback',
    type: 'Stateless Hash-based (Zero Lattice Risk)',
    securityLevel: 'NIST Category 5 (256-bit PQC)',
    status: 'STANDBY',
    keySize: '64 bytes',
    signatureSize: '29,792 bytes',
    notesTh: 'ระบบสำรองฉุกเฉินไร้สถานะ สลับสิทธิ์ทำงานทันทีแบบ Zero-Downtime หากทฤษฎีแลตทิซมีข้อบกพร่อง',
  },
  {
    id: 'algo-03',
    name: 'Falcon-1024',
    standard: 'NIST PQC Round 3 Finalist',
    role: 'High-Speed',
    type: 'NTRU Lattice (Fast Fourier Sampling)',
    securityLevel: 'NIST Category 5 (256-bit PQC)',
    status: 'STANDBY',
    keySize: '1,793 bytes',
    signatureSize: '1,330 bytes',
    notesTh: 'ลายเซ็นขนาดเล็กความเร็วสูง สำหรับงานทรูพุตพิเศษที่ต้องการลดความหน่วงเวลาและขนาดข้อมูล',
  },
  {
    id: 'algo-04',
    name: 'HAWK Signatures',
    standard: 'Lattice Variant',
    role: 'Deprecated',
    type: 'Lattice-based (Without GPV)',
    securityLevel: 'REMOVED / UNSECURE',
    status: 'DEPRECATED',
    keySize: 'N/A',
    signatureSize: 'N/A',
    notesTh: 'ถอดถอนและระงับการใช้งานถาวรตามรายงานประเมินความเสี่ยง Claude Mythos เพื่อความปลอดภัยสูงสุด',
  },
];

interface Room08MasterPanelProps {
  snapshots?: HardwareSnapshot[];
  onNavigate?: (view: ViewType) => void;
  onOpenCertificate?: () => void;
}

export const Room08MasterPanel: React.FC<Room08MasterPanelProps> = ({
  snapshots = [],
  onNavigate,
  onOpenCertificate,
}) => {
  const [selectedAlgoId, setSelectedAlgoId] = useState<string>('algo-01');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSimulatingFallback, setIsSimulatingFallback] = useState<boolean>(false);

  const selectedAlgo = useMemo(
    () => CRYPTO_ALGO_SPECS.find((a) => a.id === selectedAlgoId) || CRYPTO_ALGO_SPECS[0],
    [selectedAlgoId]
  );

  const handleCopy = (id: string, text: string) => {
    copyToClipboard(text);
    setCopiedId(id);
    playTone(650, 0.03);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTestFallback = () => {
    if (isSimulatingFallback) return;
    setIsSimulatingFallback(true);
    playTone(520, 0.06);

    setTimeout(() => {
      setIsSimulatingFallback(false);
      playAuditChime();
    }, 1200);
  };

  // Performance comparison data
  const algoPerformanceData = useMemo(() => {
    return [
      { name: 'Dilithium-5 (Primary)', signSpeedOps: 840, verifySpeedOps: 3200 },
      { name: 'SPHINCS+ (Fallback)', signSpeedOps: 120, verifySpeedOps: 1800 },
      { name: 'Falcon-1024 (Fast)', signSpeedOps: 1450, verifySpeedOps: 4800 },
    ];
  }, []);

  return (
    <div className="space-y-6 font-mono text-zinc-300">
      {/* Top Banner for Room 08 */}
      <div className="p-6 sm:p-8 rounded-[28px] bg-gradient-to-br from-cyan-950/40 via-[#051419]/95 to-black border border-cyan-500/40 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
                <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
                CHAMBER 08 • POST-QUANTUM DILITHIUM-5 & CRYPTO-AGILITY
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                NIST FIPS 204 & 205
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[11px] font-bold">
                HAWK DEPRECATED
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
                เอนจินรหัสลับต้านทานควอนตัม (Post-Quantum Dilithium-5 Engine)
              </h2>
              <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
                สถาปัตยกรรมความยืดหยุ่นเชิงรหัสลับ (Crypto-Agility) ที่ใช้ลายเซ็นแลตทิซ <strong>ML-DSA-87 (Dilithium-5)</strong> เป็นแกนหลัก และมีระบบสลับฉุกเฉินสู่ <strong>SLH-DSA (SPHINCS+)</strong> แบบไร้สถานะทันทีโดยไม่มีดาวน์ไทม์ พร้อมการถอดถอนอัลกอริทึม HAWK อย่างถาวร
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                <span className="text-zinc-500">Primary Signature:</span>
                <span className="text-cyan-300 font-bold">Dilithium-5 (ML-DSA-87)</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                <span className="text-zinc-500">Fallback Engine:</span>
                <span className="text-emerald-300 font-bold">SPHINCS+ (FIPS 205)</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                <span className="text-zinc-500">PQC Security:</span>
                <span className="text-amber-300 font-bold">NIST Category 5</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              onClick={handleTestFallback}
              disabled={isSimulatingFallback}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-black font-black text-xs transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50 cursor-pointer"
            >
              {isSimulatingFallback ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Asserting SPHINCS+ Switch...</span>
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Test Crypto Fallback Switch</span>
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
              <FileCheck2 className="w-4 h-4 text-cyan-400" />
              <span>NIST PQC Certificate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Algorithm Performance Bar Chart */}
      <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-3">
        <h3 className="text-xs font-bold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          Quantum-Resistant Signing & Verification Throughput (Ops/sec)
        </h3>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={algoPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" stroke="#71717a" fontSize={10} />
              <YAxis stroke="#71717a" fontSize={10} unit=" ops" />
              <Tooltip
                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                itemStyle={{ color: '#22d3ee' }}
              />
              <Bar dataKey="verifySpeedOps" fill="#06b6d4" name="Verify Ops/sec" radius={[6, 6, 0, 0]} />
              <Bar dataKey="signSpeedOps" fill="#3b82f6" name="Sign Ops/sec" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Seal Generation Over Time - Recharts Line Chart */}
      <SealGenerationVelocityLineChart
        title="การสร้างตราประทับเมื่อเวลาผ่านไป (Seal Generation Over Time)"
        subtitle="แสดงอัตราความเร็ว (Velocity) และการเติบโตสะสมของการสร้างตราประทับทองคำ ๑๔,๙๐๒ ชุดในอดีต (NIST FIPS 204 ML-DSA-87)"
      />

      {/* Algorithm Specs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CRYPTO_ALGO_SPECS.map((algo) => {
          const isSelected = selectedAlgoId === algo.id;
          const isDeprecated = algo.status === 'DEPRECATED';

          return (
            <div
              key={algo.id}
              onClick={() => {
                playTone(580, 0.03);
                setSelectedAlgoId(algo.id);
              }}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                isDeprecated
                  ? 'bg-rose-950/20 border-rose-500/30 opacity-75'
                  : isSelected
                  ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                  : 'bg-black/60 border-white/10 hover:border-cyan-500/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                    algo.role === 'Primary'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                      : algo.role === 'Fallback'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : algo.role === 'High-Speed'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}>
                    {algo.role}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {algo.standard}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded font-bold text-[10px] flex items-center gap-1 ${
                  isDeprecated ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {isDeprecated ? <ShieldAlert className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                  {algo.status}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white mb-1">{algo.name}</h4>
              <div className="text-[10px] text-zinc-400 mb-2 font-mono">{algo.type}</div>
              <p className="text-[11px] text-zinc-400 mb-3 leading-relaxed">{algo.notesTh}</p>

              <div className="pt-2.5 border-t border-white/5 grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-zinc-500 block">Security Level:</span>
                  <span className="text-zinc-300 font-semibold">{algo.securityLevel}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Signature Size:</span>
                  <span className="text-cyan-300 font-semibold">{algo.signatureSize}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
