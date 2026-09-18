import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  ShieldCheck,
  Zap,
  Radio,
  RefreshCw,
  Cpu,
  Thermometer,
  Wifi,
  Lock,
  CheckCircle2,
  AlertCircle,
  Clock,
  Server,
  Sparkles
} from 'lucide-react';
import { COUNCIL_MEMBERS } from '../data/councilData';
import { playTone } from './AudioSynthesizer';

export interface HsmEnclaveHeartbeatState {
  slotId: number;
  councilCode: string;
  nameTh: string;
  roleTh: string;
  hardwareModel: string;
  status: 'ONLINE_ACTIVE' | 'SYNCHRONIZING' | 'SUB_KELVIN_CRYSTALLINE';
  latencyMs: number;
  tempMilliKelvin: number;
  connectivityPct: number;
  pqcSignReady: boolean;
  lastHeartbeatIso: string;
}

export const HsmQuorumHeartbeatGauge: React.FC = () => {
  const [pulseActive, setPulseActive] = useState(false);
  const [heartbeatTick, setHeartbeatTick] = useState(0);
  const [isManualPinging, setIsManualPinging] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Initialize the 10 HSM Enclaves based on COUNCIL_MEMBERS
  const [enclaves, setEnclaves] = useState<HsmEnclaveHeartbeatState[]>(() => {
    return COUNCIL_MEMBERS.map((m, idx) => ({
      slotId: m.slotId,
      councilCode: m.councilCode,
      nameTh: m.nameTh,
      roleTh: m.roleTh,
      hardwareModel: `FIPS 140-3 L4 Enclave #0${idx + 1}`,
      status: 'ONLINE_ACTIVE',
      latencyMs: +(0.08 + (idx % 4) * 0.03 + (idx % 3) * 0.01).toFixed(2),
      tempMilliKelvin: +(14.96 + (idx % 3) * 0.02).toFixed(2),
      connectivityPct: 100,
      pqcSignReady: true,
      lastHeartbeatIso: new Date().toISOString(),
    }));
  });

  // Periodic heartbeat loop (runs every 2.5 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setPulseActive(true);
      setHeartbeatTick((t) => t + 1);

      // Micro-fluctuate latencies to simulate live high-speed telemetry
      setEnclaves((prev) =>
        prev.map((enc) => {
          const delta = (Math.random() - 0.5) * 0.02;
          const newLatency = Math.max(0.06, Math.min(0.25, +(enc.latencyMs + delta).toFixed(2)));
          const tempDelta = (Math.random() - 0.5) * 0.01;
          const newTemp = +(enc.tempMilliKelvin + tempDelta).toFixed(2);
          return {
            ...enc,
            latencyMs: newLatency,
            tempMilliKelvin: newTemp,
            lastHeartbeatIso: new Date().toISOString(),
          };
        })
      );

      const pulseTimer = setTimeout(() => setPulseActive(false), 600);
      return () => clearTimeout(pulseTimer);
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  // Compute aggregate statistics
  const quorumStats = useMemo(() => {
    const total = enclaves.length;
    const activeCount = enclaves.filter((e) => e.status === 'ONLINE_ACTIVE' || e.status === 'SUB_KELVIN_CRYSTALLINE').length;
    const avgLatency = (enclaves.reduce((acc, e) => acc + e.latencyMs, 0) / total).toFixed(2);
    const avgTemp = (enclaves.reduce((acc, e) => acc + e.tempMilliKelvin, 0) / total).toFixed(2);
    const minLatency = Math.min(...enclaves.map((e) => e.latencyMs)).toFixed(2);
    const maxLatency = Math.max(...enclaves.map((e) => e.latencyMs)).toFixed(2);
    const quorumPercentage = ((activeCount / total) * 100).toFixed(0);

    return {
      total,
      activeCount,
      avgLatency,
      avgTemp,
      minLatency,
      maxLatency,
      quorumPercentage,
    };
  }, [enclaves]);

  // Handle manual force ping
  const handleManualPing = useCallback(() => {
    setIsManualPinging(true);
    if (soundEnabled) {
      playTone(880, 0.04);
    }

    setTimeout(() => {
      setPulseActive(true);
      setHeartbeatTick((t) => t + 1);
      setEnclaves((prev) =>
        prev.map((enc) => ({
          ...enc,
          latencyMs: +(0.07 + Math.random() * 0.06).toFixed(2),
          lastHeartbeatIso: new Date().toISOString(),
        }))
      );
      setIsManualPinging(false);
      setTimeout(() => setPulseActive(false), 500);
    }, 400);
  }, [soundEnabled]);

  return (
    <div className="space-y-4 font-mono">
      {/* Top Heartbeat Banner & Circular Gauge */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-br from-[#06151c]/95 via-[#040c12]/95 to-black border-2 border-cyan-500/40 shadow-[0_0_35px_rgba(6,182,212,0.2)] text-zinc-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Gauge Summary Info */}
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
                <Radio className={`w-3.5 h-3.5 text-cyan-400 ${pulseActive ? 'animate-ping' : ''}`} />
                <span>HSM QUORUM REAL-TIME HEARTBEAT</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                10/10 ENCLAVES UNANIMOUS
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-zinc-400">
                Pulse #{heartbeatTick}
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center gap-2">
              <span>มาตรวัดสัญญาณชีพองค์ประชุมฮาร์ดแวร์ (HSM Quorum Heartbeat Gauge)</span>
            </h3>

            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              การตรวจวัดสัญญาณชีพแบบเรียลไทม์ความถี่ 400 mHz ตรวจสอบสถานะการเชื่อมต่อ (Round-Trip Latency, Jitter, อุณหภูมิยิ่งยวด Sub-Kelvin 14.98 mK, และความพร้อมของกุญแจ ML-DSA-87) ครบทั้ง 10 Enclaves ประจำสภาผู้พิทักษ์
            </p>
          </div>

          {/* Quick Gauge Controls */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleManualPing}
              disabled={isManualPinging}
              className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer select-none active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isManualPinging ? 'animate-spin text-cyan-300' : ''}`} />
              <span>{isManualPinging ? 'Pinging 10 HSMs...' : '⚡ Ping All 10 Enclaves'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSoundEnabled((prev) => !prev)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10'
              }`}
              title="Toggle Audio Feedback for Heartbeat Pings"
            >
              {soundEnabled ? '🔊 Sound: ON' : '🔈 Sound: OFF'}
            </button>
          </div>
        </div>

        {/* Real-time Radial Gauge & Vital Stats Row */}
        <div className="mt-5 pt-5 border-t border-cyan-500/20 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Radial Quorum Health Gauge */}
          <div className="col-span-2 sm:col-span-2 flex items-center gap-4 p-3 rounded-2xl bg-black/40 border border-cyan-500/30">
            {/* Animated Circular Gauge SVG */}
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/10"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`text-cyan-400 transition-all duration-700 ease-out ${
                    pulseActive ? 'stroke-[4.2] text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : ''
                  }`}
                  strokeDasharray="100, 100"
                  strokeLinecap="round"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-black text-cyan-200">100%</span>
                <span className="text-[8px] text-zinc-400 font-sans">Quorum</span>
              </div>
            </div>

            <div className="space-y-0.5 min-w-0">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
                Quorum Status
              </div>
              <div className="text-sm font-black text-emerald-300 flex items-center gap-1.5 truncate">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>10/10 ACTIVE</span>
              </div>
              <div className="text-[10px] text-cyan-400 truncate">
                FIPS 140-3 Level 4 Sealed
              </div>
            </div>
          </div>

          {/* Average Latency */}
          <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <div className="text-zinc-500 text-[10px] flex items-center gap-1">
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>Avg Latency</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-cyan-300">
              {quorumStats.avgLatency} <span className="text-xs font-normal text-zinc-500">ms</span>
            </div>
            <div className="text-[10px] text-zinc-400">
              Range: {quorumStats.minLatency} - {quorumStats.maxLatency} ms
            </div>
          </div>

          {/* Sub-Kelvin Cryo Temperature */}
          <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <div className="text-zinc-500 text-[10px] flex items-center gap-1">
              <Thermometer className="w-3 h-3 text-blue-400" />
              <span>Cryo Core Temp</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-blue-300">
              {quorumStats.avgTemp} <span className="text-xs font-normal text-zinc-500">mK</span>
            </div>
            <div className="text-[10px] text-zinc-400">
              Helium-4 Dilution Bus
            </div>
          </div>

          {/* Consensus Algorithm */}
          <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <div className="text-zinc-500 text-[10px] flex items-center gap-1">
              <Lock className="w-3 h-3 text-violet-400" />
              <span>PQC Signature</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-violet-300 truncate">
              ML-DSA-87
            </div>
            <div className="text-[10px] text-zinc-400">
              NIST FIPS 204
            </div>
          </div>

          {/* Packet Jitter */}
          <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <div className="text-zinc-500 text-[10px] flex items-center gap-1">
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span>Network Jitter</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-emerald-300">
              &plusmn;0.01 <span className="text-xs font-normal text-zinc-500">ms</span>
            </div>
            <div className="text-[10px] text-emerald-400">
              0.00% Packet Loss
            </div>
          </div>
        </div>
      </div>

      {/* Grid of 10 HSM Enclaves Status */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
          <span className="font-bold text-zinc-300 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <span>สถานะเรียลไทม์ของ 10 HSM Enclaves (Slots #01 – #10)</span>
          </span>
          <span className="text-[11px] text-cyan-400">
            {pulseActive ? '⚡ Pulse Syncing...' : '● Continuous 400mHz Stream'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {enclaves.map((enc) => {
            return (
              <div
                key={enc.slotId}
                className={`p-3 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                  pulseActive
                    ? 'bg-[#081720] border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    : 'bg-[#050b10]/90 hover:bg-[#08141d] border-white/10 hover:border-cyan-500/30'
                }`}
              >
                {/* Top Slot Header */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    Slot #{enc.slotId < 10 ? `0${enc.slotId}` : enc.slotId}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ONLINE
                  </span>
                </div>

                {/* Guardian Name & Role */}
                <div className="text-xs font-bold text-white truncate font-sans" title={enc.nameTh}>
                  {enc.nameTh}
                </div>
                <div className="text-[10px] text-zinc-400 truncate font-sans mb-2" title={enc.roleTh}>
                  {enc.roleTh}
                </div>

                {/* Metrics */}
                <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-1.5 text-[10px]">
                  <div>
                    <span className="text-zinc-500 block">Latency:</span>
                    <span className="text-cyan-300 font-bold">{enc.latencyMs} ms</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Cryo Temp:</span>
                    <span className="text-blue-300 font-bold">{enc.tempMilliKelvin} mK</span>
                  </div>
                </div>

                {/* Hardware Spec */}
                <div className="mt-2 pt-1 border-t border-white/5 flex items-center justify-between text-[9px] text-zinc-500">
                  <span className="truncate">FIPS 140-3 L4</span>
                  <span className="text-emerald-400 font-bold">SIGNED</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
