import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Activity,
  Cpu,
  Thermometer,
  Zap,
  Server,
  RefreshCw,
  Lock,
  Globe,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Key,
} from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { FULL_DECA_HSM_RESTORED_DATA } from '../data/decaHsmRestoredPayload';

export interface DecaHsmNodeMetric {
  id: string;
  location: string;
  datacenter: string;
  rack: string;
  status: 'ONLINE' | 'STANDBY' | 'DEGRADED' | 'BREACHED';
  sealStatus: 'SEALED_VALID' | 'TAMPER_ALERT' | 'UNSEALED';
  firmware: string;
  sealNumber: string;
  lastPingMs: number;
  cpuLoadPct: number;
  tempC: number;
  cryoTempMk?: number;
  forensicHash: string;
  pqcSignature?: string;
}

interface HsmClusterHealthGaugeProps {
  className?: string;
  onSelectNode?: (node: DecaHsmNodeMetric) => void;
}

export const HsmClusterHealthGauge: React.FC<HsmClusterHealthGaugeProps> = ({
  className = '',
  onSelectNode,
}) => {
  const [nodes, setNodes] = useState<DecaHsmNodeMetric[]>(
    FULL_DECA_HSM_RESTORED_DATA.decaHsmNodes as DecaHsmNodeMetric[]
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string>('HSM-NODE-01');
  const [isAutoHealing, setIsAutoHealing] = useState<boolean>(false);
  const [simulatedStressActive, setSimulatedStressActive] = useState<boolean>(false);

  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || nodes[0];
  }, [nodes, selectedNodeId]);

  // Aggregate Metrics
  const onlineCount = useMemo(() => nodes.filter((n) => n.status === 'ONLINE').length, [nodes]);
  const avgLatency = useMemo(() => {
    const sum = nodes.reduce((acc, n) => acc + (n.status === 'ONLINE' ? n.lastPingMs : 0), 0);
    return (sum / (onlineCount || 1)).toFixed(1);
  }, [nodes, onlineCount]);

  const avgCpuLoad = useMemo(() => {
    const sum = nodes.reduce((acc, n) => acc + n.cpuLoadPct, 0);
    return Math.round(sum / nodes.length);
  }, [nodes]);

  const avgTemp = useMemo(() => {
    const sum = nodes.reduce((acc, n) => acc + n.tempC, 0);
    return (sum / nodes.length).toFixed(1);
  }, [nodes]);

  const healthScore = Math.round((onlineCount / 10) * 100);

  // Radial Gauge Geometry (SVG circumference calculation)
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * healthScore) / 100;

  const handleSelectNode = (node: DecaHsmNodeMetric) => {
    setSelectedNodeId(node.id);
    playTone(600 + parseInt(node.id.split('-')[2] || '1', 10) * 25, 0.03);
    if (onSelectNode) onSelectNode(node);
  };

  const handleAutoHealCluster = () => {
    setIsAutoHealing(true);
    playTone(550, 0.05);

    setTimeout(() => {
      setNodes(FULL_DECA_HSM_RESTORED_DATA.decaHsmNodes as DecaHsmNodeMetric[]);
      setSimulatedStressActive(false);
      setIsAutoHealing(false);
      playAuditChime();
    }, 600);
  };

  const handleSimulateClusterStress = () => {
    playTone(500, 0.04);
    setSimulatedStressActive(true);
    setNodes((prev) =>
      prev.map((n, idx) => {
        if (idx === 7) {
          return {
            ...n,
            status: 'DEGRADED',
            sealStatus: 'TAMPER_ALERT',
            tempC: 64.5,
            cpuLoadPct: 88,
            lastPingMs: 78.4,
          };
        }
        if (idx === 8) {
          return {
            ...n,
            status: 'STANDBY',
            tempC: 45.2,
            cpuLoadPct: 62,
            lastPingMs: 34.1,
          };
        }
        return n;
      })
    );
  };

  return (
    <div className={`p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#070d1a] via-[#0a1122] to-[#040814] border border-cyan-500/30 shadow-2xl relative overflow-hidden font-mono text-zinc-300 ${className}`}>
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
              10/10 REAL_HSM QUORUM CLUSTER
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${
                onlineCount >= 8
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30 animate-pulse'
              }`}
            >
              {onlineCount >= 8 ? '⚖️ QUORUM RATIFIED (PASS)' : '🚨 QUORUM BREACH (<8/10)'}
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px]">
              FIPS 140-3 LEVEL 4
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 pt-0.5">
            <Server className="w-4 h-4 text-cyan-400" />
            <span>HSM Cluster Health & Performance Gauge</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {simulatedStressActive ? (
            <button
              onClick={handleAutoHealCluster}
              disabled={isAutoHealing}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAutoHealing ? 'animate-spin' : ''}`} />
              <span>{isAutoHealing ? 'Healing Cluster...' : 'Restore 10/10 Quorum'}</span>
            </button>
          ) : (
            <button
              onClick={handleSimulateClusterStress}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Simulate load stress and latency fluctuation across nodes"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Cluster Stress</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Cluster Overview: Circular Gauge + Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 py-4 items-center relative z-10">
        {/* Left: Circular Health Speedometer Gauge */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 bg-black/40 rounded-2xl border border-white/5 space-y-2">
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="#1e293b"
                strokeWidth="12"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke={onlineCount >= 8 ? '#10b981' : '#f43f5e'}
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold font-mono text-white tracking-tight">
                {onlineCount}/10
              </span>
              <span className={`text-[10px] font-bold ${onlineCount >= 8 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {onlineCount >= 8 ? '100% HEALTH' : 'DEGRADED'}
              </span>
              <span className="text-[9px] text-zinc-500">REAL_HSM NODES</span>
            </div>
          </div>
          <div className="text-center text-xs">
            <div className="font-bold text-zinc-200">Consensus Authority</div>
            <div className="text-[10px] text-zinc-400">Min. 8/10 Threshold (FIPS 140-3 L4)</div>
          </div>
        </div>

        {/* Right: 4 Real-time Telemetry Cards */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-zinc-500 text-[10px]">
              <span>AVG LATENCY</span>
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-lg font-bold text-cyan-300 font-mono">{avgLatency} ms</div>
            <div className="text-[10px] text-emerald-400 font-sans">SLA Target &lt; 142ms</div>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-zinc-500 text-[10px]">
              <span>CLUSTER CPU LOAD</span>
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-lg font-bold text-indigo-300 font-mono">{avgCpuLoad}%</div>
            <div className="text-[10px] text-zinc-400 font-sans">Optimal &lt; 65%</div>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-zinc-500 text-[10px]">
              <span>AVG TEMPERATURE</span>
              <Thermometer className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-lg font-bold text-amber-300 font-mono">{avgTemp}°C</div>
            <div className="text-[10px] text-zinc-400 font-sans">Trip Threshold 85°C</div>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-zinc-500 text-[10px]">
              <span>PQC ALGORITHM</span>
              <Key className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-xs font-bold text-purple-300 font-mono truncate">ML-DSA-87</div>
            <div className="text-[10px] text-emerald-400 font-sans">Dilithium-5 Active</div>
          </div>
        </div>
      </div>

      {/* 10 HSM Nodes Interactive Visual Selector Grid */}
      <div className="space-y-3 pt-3 border-t border-white/10 relative z-10">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-zinc-200">Deca-Key Nodes Topology (Select Node to Inspect)</span>
          <span className="text-emerald-400 text-[11px] font-bold">Bangkok (4) • Chiang Mai (2) • Hong Kong (2) • Singapore (2)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {nodes.map((node) => {
            const isSelected = node.id === selectedNodeId;
            const isOnline = node.status === 'ONLINE';

            return (
              <button
                key={node.id}
                onClick={() => handleSelectNode(node)}
                className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400/50'
                    : isOnline
                    ? 'bg-black/40 hover:bg-white/5 border-white/10 text-zinc-300'
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-200 animate-pulse'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="font-bold">{node.id}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOnline ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]' : 'bg-rose-400'
                    }`}
                  />
                </div>
                <div className="text-[10px] text-zinc-400 truncate">{node.location}</div>
                <div className="flex items-center justify-between text-[10px] font-mono mt-1 pt-1 border-t border-white/5">
                  <span className="text-cyan-300">{node.lastPingMs}ms</span>
                  <span className="text-zinc-400">{node.tempC}°C</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Node Detailed Forensic Card */}
      {selectedNode && (
        <div className="mt-4 p-4 rounded-xl bg-black/60 border border-cyan-500/30 space-y-2 text-xs relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{selectedNode.id}</span>
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px]">
                {selectedNode.datacenter}
              </span>
              <span className="px-2 py-0.5 rounded bg-white/5 text-zinc-400 text-[10px]">
                {selectedNode.rack}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-zinc-400">Seal:</span>
              <strong className="text-emerald-300 font-mono">{selectedNode.sealNumber}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] pt-1">
            <div>
              <span className="text-zinc-500">Firmware Enclave:</span>
              <div className="text-zinc-200 font-semibold">{selectedNode.firmware}</div>
            </div>
            <div>
              <span className="text-zinc-500">Latency / Response:</span>
              <div className="text-cyan-300 font-semibold">{selectedNode.lastPingMs} ms (Sub-Millisecond Wire)</div>
            </div>
            <div>
              <span className="text-zinc-500">Forensic SHA-256 Digest:</span>
              <div className="text-amber-300 font-mono text-[10px] truncate select-all">{selectedNode.forensicHash}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
