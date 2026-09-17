import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  Lock,
  RefreshCw,
  Sparkles,
  Sliders,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import { playAuditChime, playTone } from '../AudioSynthesizer';

export interface IntegrityDomainAlignment {
  domain: string;
  domainTh: string;
  agreementPct: number; // 0 - 100%
  targetPct: number;
  agreeNodesCount: number; // e.g. 10 or 9
  totalNodes: number; // 10
  status: 'OPTIMAL' | 'SYNCHRONIZING' | 'MAX_CONSENSUS';
  category: string;
  pqcHardness: string;
}

const INITIAL_ALIGNMENT_DATA: IntegrityDomainAlignment[] = [
  {
    domain: 'Frozen Core v1.2',
    domainTh: 'แกนความจริงแช่แข็ง SSoT',
    agreementPct: 100,
    targetPct: 100,
    agreeNodesCount: 10,
    totalNodes: 10,
    status: 'MAX_CONSENSUS',
    category: 'Core Architecture',
    pqcHardness: 'Dilithium-5 (Level 5)',
  },
  {
    domain: 'Zero-Mutation Invariant',
    domainTh: 'กฎล็อกการกลายพันธุ์ศูนย์',
    agreementPct: 100,
    targetPct: 100,
    agreeNodesCount: 10,
    totalNodes: 10,
    status: 'MAX_CONSENSUS',
    category: 'Immutability',
    pqcHardness: 'SHA-256 Merkle Multi-Tree',
  },
  {
    domain: 'PQC ML-DSA-87 Lattice',
    domainTh: 'การเข้ารหัสลับหลังยุคควอนตัม',
    agreementPct: 98.6,
    targetPct: 100,
    agreeNodesCount: 10,
    totalNodes: 10,
    status: 'OPTIMAL',
    category: 'Cryptography',
    pqcHardness: 'NIST FIPS 204 Lattice',
  },
  {
    domain: 'Sub-Kelvin Cryo-Bus',
    domainTh: 'ช่องสัญญาณตัวนำยิ่งยวด 0.18ms',
    agreementPct: 99.4,
    targetPct: 100,
    agreeNodesCount: 10,
    totalNodes: 10,
    status: 'OPTIMAL',
    category: 'Hardware Bus',
    pqcHardness: 'Superconducting Waveguide',
  },
  {
    domain: 'RWA Vault Multi-Bridge',
    domainTh: 'คลังสำรองสินทรัพย์ค้ำประกัน',
    agreementPct: 97.8,
    targetPct: 100,
    agreeNodesCount: 10,
    totalNodes: 10,
    status: 'OPTIMAL',
    category: 'National Liquidity',
    pqcHardness: 'Multi-Sig 10/10 Enclave',
  },
  {
    domain: 'Quarantine Firewall Ring',
    domainTh: 'วงแหวนกักกันนิติวิทยาศาสตร์ P1',
    agreementPct: 99.1,
    targetPct: 100,
    agreeNodesCount: 10,
    totalNodes: 10,
    status: 'OPTIMAL',
    category: 'Deep Inspection',
    pqcHardness: 'Quantum TRNG Entropy',
  },
  {
    domain: '14,902 Canonical Seals',
    domainTh: 'ตราประทับมาตรฐานทั้ง 14,902 ชุด',
    agreementPct: 100,
    targetPct: 100,
    agreeNodesCount: 10,
    totalNodes: 10,
    status: 'MAX_CONSENSUS',
    category: 'Sovereign Records',
    pqcHardness: 'Dual-Proof Enclave Bound',
  },
];

export const ConsensusAlignmentChart: React.FC = () => {
  const [alignmentData, setAlignmentData] = useState<IntegrityDomainAlignment[]>(INITIAL_ALIGNMENT_DATA);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<IntegrityDomainAlignment | null>(INITIAL_ALIGNMENT_DATA[0]);

  // Overall aggregate agreement percentage
  const averageAgreement = (
    alignmentData.reduce((acc, curr) => acc + curr.agreementPct, 0) / alignmentData.length
  ).toFixed(2);

  const handleMaxCalibrateAll = () => {
    setIsCalibrating(true);
    playAuditChime();
    setTimeout(() => {
      setAlignmentData((prev) =>
        prev.map((item) => ({
          ...item,
          agreementPct: 100.0,
          agreeNodesCount: 10,
          status: 'MAX_CONSENSUS',
        }))
      );
      setIsCalibrating(false);
      playTone(880, 0.15, 'sine');
    }, 900);
  };

  const handleResetVariability = () => {
    playTone(440, 0.1, 'triangle');
    setAlignmentData(INITIAL_ALIGNMENT_DATA);
  };

  return (
    <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Section */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              10/10 HSM CONSENSUS ALIGNMENT MATRIX
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              100% SSoT STATE CONVERGENCE
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>ระดับความสอดคล้องฉันทามติของสภา (Consensus Alignment)</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 max-w-3xl leading-relaxed">
            แผนภูมิ Recharts แสดงอัตราความเห็นพ้อง (Agreement Percentage %) ของโหนดสภาผู้พิทักษ์ 10/10 โหนด ต่อสถานะความมั่นคงปลอดภัยและความจริงแท้ของระบบในแต่ละมิติ (0 - 100%)
          </p>
        </div>

        {/* Action Controls & Overall Stats */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 text-center sm:text-right font-mono space-y-0.5">
            <span className="text-zinc-400 block text-[10px]">ฉันทามติเฉลี่ยรวม 10 โหนด</span>
            <div className="flex items-center justify-center sm:justify-end gap-1.5">
              <span className="text-2xl font-black text-emerald-400 tracking-tight">{averageAgreement}%</span>
              <span className="text-xs text-zinc-500">/ 100%</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMaxCalibrateAll}
              disabled={isCalibrating}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95 border border-emerald-400/40"
              title="ทดสอบปรับเทียบระดับความสอดคล้องให้เต็ม 100% ทุกมิติ (ไปกดกว่าได้เต็มหมด)"
            >
              <Sparkles className={`w-4 h-4 text-emerald-200 ${isCalibrating ? 'animate-spin' : ''}`} />
              <span>ปรับเทียบฉันทามติเต็ม 100%</span>
            </button>

            <button
              onClick={handleResetVariability}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-colors"
              title="รีเซ็ตค่ากลับสู่ค่ามาตรฐาน"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Recharts Visualizer */}
      <div className="space-y-4">
        <div className="h-80 w-full rounded-2xl bg-black/60 border border-white/5 p-4 relative">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={alignmentData}
              margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
              onClick={(state: any) => {
                if (state && state.activePayload && state.activePayload.length > 0) {
                  const clicked = state.activePayload[0].payload as IntegrityDomainAlignment;
                  setSelectedDomain(clicked);
                  playTone(720, 0.05, 'sine');
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="domain"
                stroke="#a1a1aa"
                fontSize={11}
                tickLine={false}
                angle={-18}
                textAnchor="end"
                interval={0}
                fontFamily="monospace"
              />
              <YAxis
                stroke="#a1a1aa"
                fontSize={11}
                domain={[90, 100]}
                tickFormatter={(val) => `${val}%`}
                tickLine={false}
                fontFamily="monospace"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as IntegrityDomainAlignment;
                    return (
                      <div className="p-3.5 rounded-2xl bg-zinc-950/95 border border-cyan-500/40 shadow-2xl backdrop-blur-md space-y-1.5 text-xs font-mono">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-zinc-400 font-semibold">{data.domainTh}</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                            {data.agreeNodesCount}/10 Nodes
                          </span>
                        </div>
                        <p className="text-white font-bold text-sm">{data.domain}</p>
                        <div className="flex items-center justify-between text-zinc-300 pt-1 border-t border-white/10">
                          <span>อัตราความเห็นพ้อง:</span>
                          <strong className="text-emerald-400 text-sm">{data.agreementPct}%</strong>
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          <span>กลไก PQC: </span>
                          <span className="text-cyan-300 font-medium">{data.pqcHardness}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine
                y={98.0}
                stroke="#06B6D4"
                strokeDasharray="4 4"
                label={{
                  value: 'Threshold 98%',
                  fill: '#06B6D4',
                  fontSize: 10,
                  position: 'right',
                  fontFamily: 'monospace',
                }}
              />
              <Bar dataKey="agreementPct" radius={[8, 8, 0, 0]} cursor="pointer">
                {alignmentData.map((entry, index) => {
                  const isHundred = entry.agreementPct >= 100;
                  const isHigh = entry.agreementPct >= 99.0;
                  const isSelected = selectedDomain?.domain === entry.domain;

                  const fillColor = isHundred
                    ? isSelected
                      ? '#34D399'
                      : '#10B981'
                    : isHigh
                    ? isSelected
                      ? '#38BDF8'
                      : '#06B6D4'
                    : isSelected
                    ? '#FBBF24'
                    : '#F59E0B';

                  return <Cell key={`cell-${index}`} fill={fillColor} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Selected Domain Insight Card */}
        {selectedDomain && (
          <div className="p-4 rounded-2xl bg-zinc-950 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold uppercase text-[11px]">
                  {selectedDomain.category}
                </span>
                <span className="text-zinc-600">&bull;</span>
                <span className="text-zinc-400">{selectedDomain.domainTh}</span>
              </div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{selectedDomain.domain}</span>
              </h4>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="p-2.5 rounded-xl bg-black/60 border border-white/5 space-y-0.5">
                <span className="text-zinc-500 block text-[9px]">ระดับความเห็นพ้อง</span>
                <span className="text-emerald-400 font-bold text-sm">{selectedDomain.agreementPct}%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/60 border border-white/5 space-y-0.5">
                <span className="text-zinc-500 block text-[9px]">โหนดที่ยืนยันแล้ว</span>
                <span className="text-cyan-300 font-bold text-sm">
                  {selectedDomain.agreeNodesCount} / {selectedDomain.totalNodes} HSM Nodes
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/60 border border-white/5 space-y-0.5">
                <span className="text-zinc-500 block text-[9px]">การรับรองความปลอดภัย</span>
                <span className="text-amber-300 font-bold text-xs">{selectedDomain.pqcHardness}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
