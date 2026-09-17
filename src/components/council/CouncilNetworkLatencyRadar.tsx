import React, { useState, useEffect } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Cell,
} from 'recharts';
import {
  RadioTower,
  Zap,
  Activity,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Sliders,
  Shield,
  Layers,
  Cpu,
  TrendingDown,
  Clock,
} from 'lucide-react';
import { COUNCIL_MEMBERS, getMemberVitality } from '../../data/councilData';
import { playAuditChime, playTone } from '../AudioSynthesizer';

export interface NodeLatencyMetrics {
  slotId: number;
  councilCode: string;
  nameTh: string;
  nameEn: string;
  latencyMs: number; // e.g. 0.12ms - 0.45ms
  jitterMs: number;
  temperatureK: number; // 0.08K - 0.35K
  packetLossPct: number; // 0.00%
  entropyRateKb: number;
  hardwareEnclave: string;
  status: 'ULTRA_FAST' | 'OPTIMAL' | 'SYNCHRONIZED';
}

const INITIAL_LATENCY_DATA: NodeLatencyMetrics[] = COUNCIL_MEMBERS.map((m) => {
  const v = getMemberVitality(m);
  return {
    slotId: m.slotId,
    councilCode: m.councilCode,
    nameTh: m.nameTh,
    nameEn: m.nameEn,
    latencyMs: v.lastPingMs,
    jitterMs: v.jitterMs,
    temperatureK: v.subKelvinTempK,
    packetLossPct: v.packetLossPct,
    entropyRateKb: v.activeEntropyRateKBps,
    hardwareEnclave: m.hardwareEnclave,
    status: v.lastPingMs <= 0.2 ? 'ULTRA_FAST' : 'OPTIMAL',
  };
});

export const CouncilNetworkLatencyRadar: React.FC = () => {
  const [latencyData, setLatencyData] = useState<NodeLatencyMetrics[]>(INITIAL_LATENCY_DATA);
  const [viewMode, setViewMode] = useState<'RADAR' | 'SCATTER'>('RADAR');
  const [isPinging, setIsPinging] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NodeLatencyMetrics | null>(INITIAL_LATENCY_DATA[0]);

  // Average Sub-Kelvin latency across all 10 nodes
  const avgLatency = (
    latencyData.reduce((sum, n) => sum + n.latencyMs, 0) / latencyData.length
  ).toFixed(3);

  const minLatency = Math.min(...latencyData.map((n) => n.latencyMs)).toFixed(3);
  const maxLatency = Math.max(...latencyData.map((n) => n.latencyMs)).toFixed(3);

  const handlePingAllNodes = () => {
    setIsPinging(true);
    playAuditChime();

    setTimeout(() => {
      setLatencyData((prev) =>
        prev.map((node) => {
          // Rapid simulated quantum bus ping jitter (0.11ms to 0.28ms)
          const newLatency = Number((0.11 + Math.random() * 0.15).toFixed(3));
          const newJitter = Number((0.005 + Math.random() * 0.012).toFixed(3));
          return {
            ...node,
            latencyMs: newLatency,
            jitterMs: newJitter,
            status: 'ULTRA_FAST',
          };
        })
      );
      setIsPinging(false);
      playTone(880, 0.15, 'sine');
    }, 750);
  };

  const handleUltraOptimizeBus = () => {
    setIsPinging(true);
    playAuditChime();

    setTimeout(() => {
      setLatencyData((prev) =>
        prev.map((node) => ({
          ...node,
          latencyMs: 0.12,
          jitterMs: 0.004,
          status: 'ULTRA_FAST',
        }))
      );
      setIsPinging(false);
      playTone(980, 0.2, 'sine');
    }, 600);
  };

  // Format data for Recharts Radar
  const radarChartData = latencyData.map((item) => ({
    node: item.councilCode,
    fullName: `${item.councilCode} (${item.nameTh})`,
    latency: item.latencyMs,
    // Scaled score for radar visual balance (lower latency = higher score)
    speedScore: Math.round((0.6 - item.latencyMs) * 200),
    entropyScore: Math.round(item.entropyRateKb / 12),
    rawItem: item,
  }));

  return (
    <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-6 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Controls */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              <RadioTower className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              10/10 SOVEREIGN MESH NETWORK RADAR
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              SUB-KELVIN SUPERCONDUCTING BUS
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>แผนภาพความเร็วและเวลาแฝงของโครงข่ายสภา (Mesh Network Latency Radar)</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 max-w-3xl leading-relaxed">
            วิเคราะห์ความหน่วงและประสิทธิภาพการเชื่อมต่อแบบเรียลไทม์ระหว่างโหนดฮาร์ดแวร์ HSM ทั้ง 10 โหนดผ่านช่องสัญญาณตัวนำยิ่งยวด Sub-Kelvin (ความหน่วงเฉลี่ย &lt; 0.25ms, Zero Packet Loss)
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/60 border border-white/10 text-xs font-mono">
            <button
              onClick={() => {
                setViewMode('RADAR');
                playTone(600, 0.05, 'sine');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                viewMode === 'RADAR'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Radar Chart
            </button>
            <button
              onClick={() => {
                setViewMode('SCATTER');
                playTone(640, 0.05, 'sine');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                viewMode === 'SCATTER'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Scatter Plot
            </button>
          </div>

          <button
            onClick={handlePingAllNodes}
            disabled={isPinging}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 transition-all active:scale-95 border border-cyan-400/40"
            title="ส่งสัญญาณ Ping ตรวจสอบเวลาแฝงของทั้ง 10 โหนดพร้อมกัน"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-200 ${isPinging ? 'animate-spin' : ''}`} />
            <span>{isPinging ? 'กำลัง Ping โครงข่าย...' : 'Ping 10/10 โหนด'}</span>
          </button>

          <button
            onClick={handleUltraOptimizeBus}
            disabled={isPinging}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-emerald-300 border border-emerald-500/30 text-xs font-semibold font-mono transition-all active:scale-95"
            title="ปรับเทียบช่องสัญญาณตัวนำยิ่งยวดให้มีความหน่วงต่ำสุด 0.12ms"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>จูนความหน่วงต่ำสุด</span>
          </button>
        </div>
      </div>

      {/* Latency Stats Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-1">
          <span className="text-zinc-400 block text-[10px]">เวลาแฝงเฉลี่ย (Average Latency)</span>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-cyan-400">{avgLatency} ms</span>
            <span className="text-[10px] text-emerald-400 font-semibold">(Ultra-low)</span>
          </div>
          <span className="text-[10px] text-zinc-500 block">Sub-Kelvin Superconducting</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-1">
          <span className="text-zinc-400 block text-[10px]">ความหน่วงต่ำสุด (Best Node)</span>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-emerald-400">{minLatency} ms</span>
            <span className="text-[10px] text-zinc-400">/ 0.35K</span>
          </div>
          <span className="text-[10px] text-zinc-500 block">Dilithium-5 Co-Processor</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-1">
          <span className="text-zinc-400 block text-[10px]">อัตราการสูญหาย (Packet Loss)</span>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-emerald-400">0.00%</span>
            <span className="text-[10px] text-emerald-400">Lossless</span>
          </div>
          <span className="text-[10px] text-zinc-500 block">Zero Mutation Bus Guarantee</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-1">
          <span className="text-zinc-400 block text-[10px]">อัตราความแปรปรวน (Jitter)</span>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-amber-400">&lt; 0.015 ms</span>
            <span className="text-[10px] text-zinc-400">Stable</span>
          </div>
          <span className="text-[10px] text-zinc-500 block">Atomic Clock Synchronized</span>
        </div>
      </div>

      {/* Main Visualizer: Radar or Scatter */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-8 h-84 w-full rounded-2xl bg-black/60 border border-white/5 p-4 relative flex items-center justify-center">
          {viewMode === 'RADAR' ? (
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarChartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <PolarGrid stroke="#27272a" />
                <PolarAngleAxis
                  dataKey="node"
                  stroke="#a1a1aa"
                  fontSize={11}
                  fontFamily="monospace"
                />
                <PolarRadiusAxis
                  stroke="#52525b"
                  fontSize={9}
                  domain={[0, 0.5]}
                  tickFormatter={(val) => `${val}ms`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload.rawItem as NodeLatencyMetrics;
                      return (
                        <div className="p-3.5 rounded-2xl bg-zinc-950/95 border border-cyan-500/40 shadow-2xl backdrop-blur-md space-y-1.5 text-xs font-mono">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-amber-400 font-bold">{data.councilCode}</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                              {data.status}
                            </span>
                          </div>
                          <p className="text-white font-bold">{data.nameTh}</p>
                          <div className="flex items-center justify-between text-zinc-300 pt-1 border-t border-white/10">
                            <span>เวลาแฝง (Latency):</span>
                            <strong className="text-cyan-400">{data.latencyMs} ms</strong>
                          </div>
                          <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                            <span>Jitter: {data.jitterMs} ms</span>
                            <span>Cryo: {data.temperatureK} K</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Radar
                  name="เวลาแฝง (Latency ms)"
                  dataKey="latency"
                  stroke="#06B6D4"
                  fill="#06B6D4"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  type="number"
                  dataKey="slotId"
                  name="Node Slot"
                  stroke="#a1a1aa"
                  domain={[1, 10]}
                  tickCount={10}
                  tickFormatter={(val) => `Node #${val}`}
                  fontSize={10}
                  fontFamily="monospace"
                />
                <YAxis
                  type="number"
                  dataKey="latencyMs"
                  name="Latency"
                  unit="ms"
                  stroke="#a1a1aa"
                  domain={[0.08, 0.45]}
                  fontSize={10}
                  fontFamily="monospace"
                />
                <ZAxis type="number" dataKey="entropyRateKb" range={[60, 200]} name="Entropy" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as NodeLatencyMetrics;
                      return (
                        <div className="p-3 rounded-2xl bg-zinc-950/95 border border-cyan-500/40 shadow-xl text-xs font-mono space-y-1">
                          <span className="text-amber-400 font-bold">{data.councilCode} &bull; {data.nameTh}</span>
                          <div className="text-white">
                            Latency: <strong className="text-cyan-400">{data.latencyMs} ms</strong>
                          </div>
                          <div className="text-zinc-400 text-[10px]">
                            Entropy: {data.entropyRateKb} KB/s &bull; Jitter: {data.jitterMs} ms
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter data={latencyData} fill="#06B6D4">
                  {latencyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.latencyMs <= 0.18 ? '#10B981' : entry.latencyMs <= 0.28 ? '#06B6D4' : '#F59E0B'}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Selected Node Real-time Inspector */}
        <div className="lg:col-span-4 space-y-3">
          <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-4 text-xs font-mono">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-cyan-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                Node Real-time Telemetry
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                HEALTHY
              </span>
            </div>

            {selectedNode && (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold text-sm">{selectedNode.councilCode}</span>
                    <span className="text-zinc-500">#{selectedNode.slotId}</span>
                  </div>
                  <p className="text-white font-bold text-sm">{selectedNode.nameTh}</p>
                  <p className="text-zinc-400 text-[11px] truncate">{selectedNode.hardwareEnclave}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-white/5 space-y-0.5">
                    <span className="text-zinc-500 block text-[10px]">บัสเวลาแฝง</span>
                    <span className="text-cyan-300 font-bold text-sm">{selectedNode.latencyMs} ms</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-white/5 space-y-0.5">
                    <span className="text-zinc-500 block text-[10px]">อุณหภูมิ Cryo</span>
                    <span className="text-emerald-400 font-bold text-sm">{selectedNode.temperatureK} K</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-white/5 space-y-0.5">
                    <span className="text-zinc-500 block text-[10px]">Entropy Rate</span>
                    <span className="text-purple-300 font-bold text-sm">{selectedNode.entropyRateKb} KB/s</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-white/5 space-y-0.5">
                    <span className="text-zinc-500 block text-[10px]">Jitter</span>
                    <span className="text-amber-300 font-bold text-sm">{selectedNode.jitterMs} ms</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick selector pills for 10 nodes */}
            <div className="pt-2 border-t border-white/5">
              <span className="text-[10px] text-zinc-500 block mb-2">เลือกโหนดเพื่อตรวจสอบ:</span>
              <div className="grid grid-cols-5 gap-1.5">
                {latencyData.map((node) => (
                  <button
                    key={node.slotId}
                    onClick={() => {
                      setSelectedNode(node);
                      playTone(600 + node.slotId * 20, 0.04, 'sine');
                    }}
                    className={`py-1 px-1 rounded-lg text-[10px] font-bold text-center transition-all ${
                      selectedNode?.slotId === node.slotId
                        ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 shadow-sm'
                        : 'bg-white/5 hover:bg-white/10 text-zinc-400 border border-white/5'
                    }`}
                  >
                    #{node.slotId}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
