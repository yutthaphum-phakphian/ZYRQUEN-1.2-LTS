import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  ShieldCheck,
  Zap,
  RefreshCw,
  Clock,
  Cpu,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Server,
  Fingerprint,
} from 'lucide-react';
import { COUNCIL_MEMBERS, getMemberVitality, CouncilMember } from '../../data/councilData';
import { playAuditChime, playTone } from '../AudioSynthesizer';

export interface HSMNodeHealth {
  slotId: number;
  councilCode: string;
  nameTh: string;
  nameEn: string;
  score: number; // 88 - 100
  latencyMs: number; // 0.08 - 0.58 ms
  jitterMs: number;
  temperatureK: number;
  entropyRateKb: number;
  status: 'optimal' | 'warning' | 'critical';
  clearanceLevel: string;
}

const buildInitialNodes = (): HSMNodeHealth[] => {
  return COUNCIL_MEMBERS.map((m) => {
    const v = getMemberVitality(m);
    const latency = v?.lastPingMs ?? 0.15;
    let status: 'optimal' | 'warning' | 'critical' = 'optimal';
    if (latency > 0.45) status = 'critical';
    else if (latency >= 0.22) status = 'warning';

    return {
      slotId: m.slotId,
      councilCode: m.councilCode,
      nameTh: m.nameTh,
      nameEn: m.nameEn,
      score: Math.min(100, Math.max(88, Math.round((v?.activeEntropyRateKBps ?? 2048) / 21))),
      latencyMs: latency,
      jitterMs: v?.jitterMs ?? 0.012,
      temperatureK: v?.subKelvinTempK ?? 0.015,
      entropyRateKb: v?.activeEntropyRateKBps ?? 2048,
      status,
      clearanceLevel: m.clearanceLevel,
    };
  });
};

export const SovereignHealthHeatmapWidget: React.FC<{
  onSelectNode?: (slotId: number) => void;
}> = ({ onSelectNode }) => {
  const [nodes, setNodes] = useState<HSMNodeHealth[]>(buildInitialNodes);
  const [filterMode, setFilterMode] = useState<'ALL' | 'OPTIMAL' | 'WARNING' | 'CRITICAL'>('ALL');
  const [isRecalibrating, setIsRecalibrating] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);

  const getThresholdStyle = (status: 'optimal' | 'warning' | 'critical', latencyMs: number) => {
    if (status === 'critical' || latencyMs > 0.45) {
      return 'bg-red-500/15 text-red-300 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:border-red-400';
    }
    if (status === 'warning' || latencyMs >= 0.22) {
      return 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:border-amber-400';
    }
    return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:border-emerald-400';
  };

  const handleRecalibrate = () => {
    setIsRecalibrating(true);
    playAuditChime();

    setTimeout(() => {
      setNodes((prev) =>
        prev.map((n) => {
          const newLatency = Number((Math.random() * 0.16 + 0.09).toFixed(3));
          const newJitter = Number((Math.random() * 0.006 + 0.002).toFixed(4));
          return {
            ...n,
            latencyMs: newLatency,
            jitterMs: newJitter,
            score: Math.floor(Math.random() * 6 + 95),
            status: 'optimal',
          };
        })
      );
      setIsRecalibrating(false);
      playTone(960, 0.2, 'sine');
    }, 750);
  };

  const filteredNodes = nodes.filter((n) => {
    if (filterMode === 'ALL') return true;
    if (filterMode === 'OPTIMAL') return n.status === 'optimal';
    if (filterMode === 'WARNING') return n.status === 'warning';
    if (filterMode === 'CRITICAL') return n.status === 'critical';
    return true;
  });

  const optimalCount = nodes.filter((n) => n.status === 'optimal').length;
  const avgLatency = (nodes.reduce((acc, n) => acc + n.latencyMs, 0) / nodes.length).toFixed(3);

  return (
    <div className="bg-[#0b0f17]/95 border border-slate-800/80 rounded-3xl p-5 sm:p-7 backdrop-blur-2xl shadow-2xl space-y-5 text-white">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold tracking-wide text-slate-100 flex items-center gap-2">
                <span>เมทริกซ์คะแนนสุขภาพโหนดสภา (Sovereign Health Score Matrix)</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                  REAL-TIME 10/10
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                เกณฑ์ประเมินสถานะและเวลาแฝงของฮาร์ดแวร์ HSM และบัสตัวนำยิ่งยวด Sub-Kelvin ทั้ง 10 โหนด
              </p>
            </div>
          </div>
        </div>

        {/* Global Vitality Badges & Recalibrate */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-zinc-400">เฉลี่ย:</span>
            <span className="text-cyan-300 font-bold">{avgLatency} ms</span>
            <span className="text-zinc-600">|</span>
            <span className="text-emerald-300 font-bold">{optimalCount}/10 Optimal</span>
          </div>

          <button
            onClick={handleRecalibrate}
            disabled={isRecalibrating}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-semibold transition-all disabled:opacity-50"
            title="ปรับเทียบและวัดค่าเวลาแฝงใหม่แบบเรียลไทม์"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRecalibrating ? 'animate-spin' : ''}`} />
            <span>{isRecalibrating ? 'กำลังวัดผล...' : 'Recalibrate'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 text-xs font-mono overflow-x-auto pb-1">
        {(['ALL', 'OPTIMAL', 'WARNING', 'CRITICAL'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => {
              setFilterMode(mode);
              playTone(680, 0.04, 'sine');
            }}
            className={`px-3 py-1 rounded-lg transition-all ${
              filterMode === mode
                ? 'bg-slate-700 text-white font-bold border border-slate-500 shadow-xs'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            {mode === 'ALL' ? 'ทั้งหมด (10)' : mode}
          </button>
        ))}
      </div>

      {/* 10-Cell Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {filteredNodes.map((node) => {
          const isSelected = selectedNodeId === node.slotId;
          return (
            <motion.div
              key={node.slotId}
              layout
              onClick={() => {
                setSelectedNodeId(node.slotId);
                playTone(700 + node.slotId * 20, 0.05, 'sine');
                if (onSelectNode) onSelectNode(node.slotId);
              }}
              className={`cursor-pointer relative p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-3 ${getThresholdStyle(
                node.status,
                node.latencyMs
              )} ${isSelected ? 'ring-2 ring-cyan-400 scale-[1.02]' : 'hover:scale-[1.01]'}`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono opacity-90">
                <span className="font-bold">{node.councilCode}</span>
                <span className="text-cyan-200">{node.latencyMs} ms</span>
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold font-mono tracking-tight">{node.score}%</span>
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold">
                    {node.status}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-300 truncate mt-1">{node.nameTh}</div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9px] font-mono text-zinc-400">
                <span>Jitter: {node.jitterMs}ms</span>
                <span>Cryo: {node.temperatureK}K</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
