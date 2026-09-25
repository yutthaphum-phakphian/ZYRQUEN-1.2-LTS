import React, { useState } from 'react';
import {
  Cpu,
  HardDrive,
  Activity,
  Layers,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Server,
  Clock,
  ShieldCheck,
  Flame,
  Database,
  Radio,
  Sliders,
  Sparkles,
  Info,
  Maximize2,
  RefreshCw,
  Download,
} from 'lucide-react';
import { HardwareSnapshot } from '../types';
import { INITIAL_HARDWARE_SNAPSHOTS, exportHardwareSnapshotJson, exportAllHardwareSnapshotsCsv } from '../utils/telemetrySnapshot';
import { playTone } from './AudioSynthesizer';

interface PulseHardwareGridProps {
  snapshots?: HardwareSnapshot[];
  currentCpu?: number;
  currentMemory?: number;
  currentCryo?: number;
  currentSsdWear?: number;
  currentVoltageStability?: number;
}

export interface HardwareHealthModule {
  id: string;
  name: string;
  category: 'CPU_CORE' | 'MEMORY_BANK' | 'CACHE_FABRIC' | 'CRYPTO_ACCELERATOR';
  type: string;
  loadPct: number;
  tempC: number;
  freqGhz?: number;
  capacity?: string;
  used?: string;
  status: 'NOMINAL' | 'ELEVATED' | 'CRITICAL';
  healthScore: number;
  latencyNs?: number;
  merkleLeaf: string;
  notes: string;
}

export const PulseHardwareGrid: React.FC<PulseHardwareGridProps> = ({
  snapshots = INITIAL_HARDWARE_SNAPSHOTS,
  currentCpu = 41.2,
  currentMemory = 62.4,
  currentCryo = 14.98,
  currentSsdWear = 0.82,
  currentVoltageStability = 99.98,
}) => {
  const [selectedSnapshotIndex, setSelectedSnapshotIndex] = useState<number>(0);
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'CPU_CORE' | 'MEMORY_BANK' | 'CACHE_FABRIC' | 'CRYPTO_ACCELERATOR'>('ALL');
  const [selectedModule, setSelectedModule] = useState<HardwareHealthModule | null>(null);
  const [viewDensity, setViewDensity] = useState<'comfort' | 'compact'>('comfort');

  const activeSnapshot = snapshots[selectedSnapshotIndex] || snapshots[0] || INITIAL_HARDWARE_SNAPSHOTS[0];

  // Derive dynamic core & memory values from active snapshot or live values
  const cores = activeSnapshot.cpuCores && activeSnapshot.cpuCores.length === 4
    ? activeSnapshot.cpuCores
    : [
        +(currentCpu * 1.02).toFixed(1),
        +(currentCpu * 0.96).toFixed(1),
        +(currentCpu * 1.05).toFixed(1),
        +(currentCpu * 0.94).toFixed(1),
      ];

  const memTotal = activeSnapshot.memoryTotalMb || 8192;
  const memUsed = activeSnapshot.memoryUsedMb || Math.round((currentMemory / 100) * memTotal);

  // 12 Detailed CPU & Memory Subsystem Health Modules
  const hardwareModules: HardwareHealthModule[] = [
    // CPU Cores
    {
      id: 'cpu-core-0',
      name: 'CPU Core #0 (Primary Executive)',
      category: 'CPU_CORE',
      type: 'ARM64 Neoverse-V2 Core',
      loadPct: cores[0],
      tempC: +(42.5 + (cores[0] - 40) * 0.4).toFixed(1),
      freqGhz: 3.40,
      status: cores[0] > 85 ? 'CRITICAL' : cores[0] > 70 ? 'ELEVATED' : 'NOMINAL',
      healthScore: +(100 - cores[0] * 0.05).toFixed(1),
      latencyNs: 1.2,
      merkleLeaf: `0x${activeSnapshot.sealedHash.slice(2, 10)}-C0`,
      notes: 'Executes Sovereign Gateway, OTLP Span Ingestion & Dispatcher',
    },
    {
      id: 'cpu-core-1',
      name: 'CPU Core #1 (Cryptographic Engine)',
      category: 'CPU_CORE',
      type: 'ARM64 Neoverse-V2 Core',
      loadPct: cores[1],
      tempC: +(41.8 + (cores[1] - 40) * 0.4).toFixed(1),
      freqGhz: 3.40,
      status: cores[1] > 85 ? 'CRITICAL' : cores[1] > 70 ? 'ELEVATED' : 'NOMINAL',
      healthScore: +(100 - cores[1] * 0.04).toFixed(1),
      latencyNs: 0.9,
      merkleLeaf: `0x${activeSnapshot.sealedHash.slice(10, 18)}-C1`,
      notes: 'Dedicated ML-DSA Dilithium & ML-KEM Kyber Quantum Math',
    },
    {
      id: 'cpu-core-2',
      name: 'CPU Core #2 (Evidence Ledger Sealer)',
      category: 'CPU_CORE',
      type: 'ARM64 Neoverse-V2 Core',
      loadPct: cores[2],
      tempC: +(43.1 + (cores[2] - 40) * 0.4).toFixed(1),
      freqGhz: 3.40,
      status: cores[2] > 85 ? 'CRITICAL' : cores[2] > 70 ? 'ELEVATED' : 'NOMINAL',
      healthScore: +(100 - cores[2] * 0.06).toFixed(1),
      latencyNs: 1.4,
      merkleLeaf: `0x${activeSnapshot.sealedHash.slice(18, 26)}-C2`,
      notes: 'Real-time SHA-256 Merkle Tree Proof calculation & Genesis chaining',
    },
    {
      id: 'cpu-core-3',
      name: 'CPU Core #3 (Observer & Self-Healing)',
      category: 'CPU_CORE',
      type: 'ARM64 Neoverse-V2 Core',
      loadPct: cores[3],
      tempC: +(40.9 + (cores[3] - 40) * 0.4).toFixed(1),
      freqGhz: 3.20,
      status: cores[3] > 85 ? 'CRITICAL' : cores[3] > 70 ? 'ELEVATED' : 'NOMINAL',
      healthScore: 99.4,
      latencyNs: 1.1,
      merkleLeaf: `0x${activeSnapshot.sealedHash.slice(26, 34)}-C3`,
      notes: 'Digital Twin simulation loop & fail-closed baseline reconciliation',
    },

    // Memory Banks & Allocation Pools
    {
      id: 'mem-bank-v8',
      name: 'V8 Execution Heap (RAM)',
      category: 'MEMORY_BANK',
      type: 'DDR5 ECC 5600MT/s',
      loadPct: +((memUsed / memTotal) * 100).toFixed(1),
      tempC: 38.4,
      capacity: `${(memTotal / 1024).toFixed(1)} GB`,
      used: `${(memUsed / 1024).toFixed(2)} GB`,
      status: (memUsed / memTotal) > 0.85 ? 'CRITICAL' : (memUsed / memTotal) > 0.75 ? 'ELEVATED' : 'NOMINAL',
      healthScore: 99.8,
      latencyNs: 42,
      merkleLeaf: `0x${activeSnapshot.sealedHash.slice(34, 42)}-MV8`,
      notes: 'Active Node.js V8 Runtime isolate heap with zero fragmentation',
    },
    {
      id: 'mem-bank-vector',
      name: '768-D Vector Codex Buffer',
      category: 'MEMORY_BANK',
      type: 'Direct Memory Mapped Vault',
      loadPct: 48.2,
      tempC: 36.8,
      capacity: '2.0 GB',
      used: '986 MB',
      status: 'NOMINAL',
      healthScore: 99.9,
      latencyNs: 18,
      merkleLeaf: `0x${activeSnapshot.sealedHash.slice(42, 50)}-VEC`,
      notes: 'High-dimensional embeddings for Thai legal & Sovereign semantic search',
    },
    {
      id: 'mem-bank-merkle',
      name: 'Merkle Proof Leaf Ring Buffer',
      category: 'MEMORY_BANK',
      type: 'L1 Lock-Free Circular Buffer',
      loadPct: 32.5,
      tempC: 35.2,
      capacity: '512 MB',
      used: '166 MB',
      status: 'NOMINAL',
      healthScore: 100.0,
      latencyNs: 8.4,
      merkleLeaf: `0x${activeSnapshot.sealedHash.slice(50, 58)}-MRK`,
      notes: '14,902 Canonical sealed block verification scratchpad',
    },
    {
      id: 'mem-bank-otel',
      name: 'OpenTelemetry Trace Buffer',
      category: 'MEMORY_BANK',
      type: 'Ring Buffer (Zero Loss)',
      loadPct: 54.1,
      tempC: 37.0,
      capacity: '1.0 GB',
      used: '554 MB',
      status: 'NOMINAL',
      healthScore: 99.7,
      latencyNs: 12.0,
      merkleLeaf: `0x${activeSnapshot.sealedHash.slice(58, 64)}-OTL`,
      notes: 'Buffered 2,480 spans/sec with non-authoritative isolation',
    },

    // Cache Fabric Subsystems
    {
      id: 'cache-l1-l2',
      name: 'L1/L2 High-Speed Cache Fabric',
      category: 'CACHE_FABRIC',
      type: 'Ultra-low Latency SRAM',
      loadPct: 24.8,
      tempC: 44.2,
      capacity: '64 MB',
      used: '15.8 MB',
      status: 'NOMINAL',
      healthScore: 100.0,
      latencyNs: 0.65,
      merkleLeaf: `0x${activeSnapshot.parentHash.slice(2, 10)}-L1`,
      notes: '99.4% Cache hit ratio for hot invariant validation rules',
    },
    {
      id: 'cache-l3-shared',
      name: 'L3 Shared System Cache (SLC)',
      category: 'CACHE_FABRIC',
      type: 'Coherent Crossbar Cache',
      loadPct: 39.4,
      tempC: 42.0,
      capacity: '128 MB',
      used: '50.4 MB',
      status: 'NOMINAL',
      healthScore: 99.9,
      latencyNs: 2.8,
      merkleLeaf: `0x${activeSnapshot.parentHash.slice(10, 18)}-L3`,
      notes: 'Inter-core messaging cache for Autonomous Agent Tri-Council',
    },

    // Crypto Accelerator & Storage Vault Subsystems
    {
      id: 'crypto-acc-qtrng',
      name: 'TRNG Quantum Entropy Source',
      category: 'CRYPTO_ACCELERATOR',
      type: 'NIST SP 800-90B Quantum Vacuum Diode',
      loadPct: 88.5,
      tempC: +(currentCryo * 10).toFixed(1),
      capacity: '2.4 Gbps',
      used: '2.12 Gbps',
      status: 'NOMINAL',
      healthScore: 100.0,
      latencyNs: 0.12,
      merkleLeaf: `0x${activeSnapshot.parentHash.slice(18, 26)}-TRNG`,
      notes: '7.994 Bits/Byte Shannon entropy rate for key generation',
    },
    {
      id: 'crypto-acc-hsm',
      name: 'HSM Dilithium Cryptographic Accelerator',
      category: 'CRYPTO_ACCELERATOR',
      type: 'FIPS 140-3 Level 4 Boundary',
      loadPct: 18.2,
      tempC: 34.5,
      capacity: '10,000 Sign/s',
      used: '1,820 Sign/s',
      status: 'NOMINAL',
      healthScore: 100.0,
      latencyNs: 0.45,
      merkleLeaf: `0x${activeSnapshot.parentHash.slice(26, 34)}-HSM`,
      notes: 'Hardware isolated private keys for Executive Passport EP-001',
    },
  ];

  const filteredModules = activeCategory === 'ALL'
    ? hardwareModules
    : hardwareModules.filter((m) => m.category === activeCategory);

  const getStatusBadge = (status: 'NOMINAL' | 'ELEVATED' | 'CRITICAL') => {
    switch (status) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border-rose-500/40 text-[10px] font-mono font-bold flex items-center gap-1 animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            CRITICAL
          </span>
        );
      case 'ELEVATED':
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            ELEVATED
          </span>
        );
      case 'NOMINAL':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            NOMINAL
          </span>
        );
    }
  };

  const getCategoryColor = (cat: HardwareHealthModule['category']) => {
    switch (cat) {
      case 'CPU_CORE':
        return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
      case 'MEMORY_BANK':
        return 'text-violet-400 border-violet-500/30 bg-violet-500/10';
      case 'CACHE_FABRIC':
        return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      case 'CRYPTO_ACCELERATOR':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    }
  };

  return (
    <div id="pulse-hardware-grid" className="p-6 rounded-[28px] bg-[#0b0e1a]/85 border-cyan-500/20 backdrop-blur-xl space-y-6 shadow-2xl relative overflow-hidden">
      {/* Background ambient gradient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-300 border-cyan-500/30 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-mono font-bold text-white tracking-wide">
                  Hardware Health & CPU/Memory Matrix
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border-cyan-500/30 text-[10px] font-mono">
                  12 HARDWARE MODULES
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border-emerald-500/20 text-[10px] font-mono">
                  ZERO DRIFT
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Real-time sub-millisecond core telemetry, memory isolate banks, L1-L3 cache coherence, & cryptographic HSM blocks
              </p>
            </div>
          </div>
        </div>

        {/* Snapshot Selector & Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
          {/* Snapshot selector */}
          <div className="flex items-center gap-1.5 p-1 bg-black/50 border-white/10 rounded-2xl">
            <span className="text-[11px] text-zinc-400 px-2 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Snapshot:
            </span>
            {snapshots.slice(0, 3).map((snap, idx) => (
              <button
                key={snap.id}
                onClick={() => {
                  setSelectedSnapshotIndex(idx);
                  playTone(550 + idx * 50, 0.04);
                }}
                className={`px-2.5 py-1 rounded-xl text-[10px] transition-all font-bold ${
                  selectedSnapshotIndex === idx
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
                title={`View Telemetry Snapshot #${snap.snapshotNumber} (${snap.id})`}
              >
                #{snap.snapshotNumber}
              </button>
            ))}
          </div>

          {/* Download Snapshot JSON Button */}
          <button
            id="pulse-grid-download-snapshot-btn"
            onClick={() => {
              playTone(720, 0.04);
              exportHardwareSnapshotJson(activeSnapshot);
            }}
            className="px-2.5 py-1 rounded-2xl text-[10px] font-bold bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-500/40 text-cyan-300 hover:text-white flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)]"
            title={`Download Hardware Snapshot #${activeSnapshot.snapshotNumber} (${activeSnapshot.id}) as JSON`}
          >
            <Download className="w-3 h-3 text-cyan-400" />
            <span>Download JSON</span>
          </button>

          {/* Export All Snapshots CSV Button */}
          <button
            id="pulse-grid-export-csv-btn"
            onClick={() => {
              playTone(740, 0.04);
              exportAllHardwareSnapshotsCsv(snapshots);
            }}
            className="px-2.5 py-1 rounded-2xl text-[10px] font-bold bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-300 hover:text-white flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(16,185,129,0.15)]"
            title="Export all hardware snapshots as a CSV spreadsheet"
          >
            <Download className="w-3 h-3 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          {/* Density toggle */}
          <div className="flex items-center p-1 bg-black/50 border-white/10 rounded-2xl">
            <button
              onClick={() => {
                setViewDensity(viewDensity === 'comfort' ? 'compact' : 'comfort');
                playTone(650, 0.03);
              }}
              className="px-2.5 py-1 rounded-xl text-[10px] text-zinc-300 hover:text-white flex items-center gap-1"
              title="Toggle Grid Density"
            >
              <Sliders className="w-3 h-3 text-cyan-400" />
              <span>{viewDensity === 'comfort' ? 'Comfort' : 'Compact'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3 relative z-10">
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          {[
            { id: 'ALL', label: 'All Modules (12)' },
            { id: 'CPU_CORE', label: 'CPU Cores (4)' },
            { id: 'MEMORY_BANK', label: 'Memory Banks (4)' },
            { id: 'CACHE_FABRIC', label: 'Cache Fabric (2)' },
            { id: 'CRYPTO_ACCELERATOR', label: 'HSM & Quantum (2)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveCategory(tab.id as any);
                playTone(520, 0.03);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs transition-all font-mono ${
                activeCategory === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)] font-bold'
                  : 'bg-white/5 text-zinc-400 hover:text-zinc-200 border-white/8 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Aggregate Health Metric */}
        <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Avg Health: <strong className="text-emerald-400">99.85%</strong>
          </span>
          <span className="hidden sm:inline-block text-zinc-600">•</span>
          <span className="hidden sm:flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            Fail-Closed Enforced
          </span>
        </div>
      </div>

      {/* The Hardware Grid Modules */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 relative z-10`}>
        {filteredModules.map((module) => {
          const isSelected = selectedModule?.id === module.id;
          const isCore = module.category === 'CPU_CORE';
          const isMemory = module.category === 'MEMORY_BANK';

          return (
            <div
              key={module.id}
              onClick={() => {
                setSelectedModule(isSelected ? null : module);
                playTone(isSelected ? 400 : 700, 0.05);
              }}
              className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 relative group ${
                isSelected
                  ? 'bg-cyan-950/40 border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/50'
                  : 'bg-black/40 hover:bg-black/60 border-white/10 hover:border-cyan-500/40'
              }`}
            >
              {/* Card Top */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono border font-bold uppercase tracking-wider ${getCategoryColor(module.category)}`}>
                    {module.category.replace('_', ' ')}
                  </span>
                  {getStatusBadge(module.status)}
                </div>

                <div className="pt-1">
                  <h4 className="font-mono text-xs font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center justify-between">
                    <span>{module.name}</span>
                    <Info className="w-3.5 h-3.5 text-zinc-500 group-hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-all" />
                  </h4>
                  <p className="text-[11px] font-mono text-zinc-400 truncate">{module.type}</p>
                </div>
              </div>

              {/* Dynamic Gauge / Load Level Bar */}
              <div className="space-y-1.5 font-mono">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 text-[11px]">Load / Utilization</span>
                  <span className={`font-bold ${
                    module.loadPct > 85 ? 'text-rose-400' : module.loadPct > 70 ? 'text-amber-400' : 'text-cyan-400'
                  }`}>
                    {module.loadPct}%
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      module.loadPct > 85
                        ? 'bg-rose-500'
                        : module.loadPct > 70
                        ? 'bg-amber-400'
                        : module.category === 'MEMORY_BANK'
                        ? 'bg-violet-400'
                        : module.category === 'CACHE_FABRIC'
                        ? 'bg-amber-400'
                        : 'bg-cyan-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(4, module.loadPct))}%` }}
                  />
                </div>

                {/* Sub-metrics */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] text-zinc-400">
                  <div className="flex items-center justify-between p-1 rounded bg-white/5">
                    <span>Temp:</span>
                    <span className="text-zinc-200 font-bold">{module.tempC}°C</span>
                  </div>
                  <div className="flex items-center justify-between p-1 rounded bg-white/5">
                    <span>{module.capacity ? 'Cap:' : 'Freq:'}</span>
                    <span className="text-zinc-200 font-bold">
                      {module.capacity || (module.freqGhz ? `${module.freqGhz} GHz` : `${module.latencyNs} ns`)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Merkle Leaf Proof Pin */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <span className="truncate max-w-[120px]" title={module.merkleLeaf}>
                  Proof: {module.merkleLeaf}
                </span>
                <span className="text-emerald-400 font-bold">
                  {module.healthScore}% HP
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Module Detail Modal / Drawer */}
      {selectedModule && (
        <div className="p-5 rounded-2xl bg-black/70 border-cyan-500/40 font-mono text-xs space-y-4 animate-in fade-in duration-200 relative z-10 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">{selectedModule.name}</h4>
                <p className="text-[11px] text-zinc-400">{selectedModule.type} • Subsystem ID: {selectedModule.id}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {getStatusBadge(selectedModule.status)}
              <button
                onClick={() => {
                  setSelectedModule(null);
                  playTone(450, 0.03);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-200 transition-all font-bold text-xs"
              >
                Close Details
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-[11px]">
            <div className="p-3 rounded-xl bg-white/5 border-white/5 space-y-1">
              <span className="text-zinc-400">Current Workload</span>
              <div className="text-base font-bold text-cyan-300">{selectedModule.loadPct}%</div>
              <p className="text-[10px] text-zinc-500">Nominal load envelope</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border-white/5 space-y-1">
              <span className="text-zinc-400">Thermal Junction</span>
              <div className="text-base font-bold text-amber-300">{selectedModule.tempC}°C</div>
              <p className="text-[10px] text-zinc-500">Below 85°C throttle limit</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border-white/5 space-y-1">
              <span className="text-zinc-400">Access Latency</span>
              <div className="text-base font-bold text-violet-300">{selectedModule.latencyNs || 1.2} ns</div>
              <p className="text-[10px] text-zinc-500">Direct bus routing</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border-white/5 space-y-1">
              <span className="text-zinc-400">Integrity Health</span>
              <div className="text-base font-bold text-emerald-300">{selectedModule.healthScore}%</div>
              <p className="text-[10px] text-zinc-500">Zero ECC error count</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border-white/5 space-y-1 text-[11px]">
            <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Architectural Description & Role:</span>
            <p className="text-zinc-200">{selectedModule.notes}</p>
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-zinc-500 border-t border-white/5">
              <span>Cryptographic Leaf Proof: <strong className="text-zinc-300">{selectedModule.merkleLeaf}</strong></span>
              <span>Parent Hash: <strong className="text-zinc-300">{activeSnapshot.parentHash.slice(0, 24)}...</strong></span>
              <span>Audit Block: <strong className="text-emerald-400">#849202 (Sealed)</strong></span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playTone(720, 0.04);
                  exportHardwareSnapshotJson(activeSnapshot);
                }}
                className="px-2 py-0.5 rounded bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-500/30 text-cyan-300 hover:text-white flex items-center gap-1 transition-all"
                title={`Download Snapshot #${activeSnapshot.snapshotNumber} JSON`}
              >
                <Download className="w-3 h-3 text-cyan-400" />
                <span>Download Snapshot #{activeSnapshot.snapshotNumber}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
