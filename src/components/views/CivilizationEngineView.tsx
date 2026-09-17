import React, { useState, useEffect, useRef } from 'react';
import { ViewType } from '../../types';
import { playTone, playAuditChime, playWarningTone } from '../AudioSynthesizer';
import { SupremeWarpCivilizationEngine } from '../SupremeWarpCivilizationEngine';
import {
  Sparkles,
  Download,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  FileText,
  Sliders,
  CheckCircle2,
  ShieldAlert,
  Layers,
  Activity,
  Cpu,
  Share2,
} from 'lucide-react';

export interface CivilizationAgent {
  id: string;
  name: string;
  role: string;
  reputation: number;
  votesCast: number;
  proposedPolicy: string;
  consensusAlignment: number;
  status: 'ACTIVE' | 'DEBATING' | 'CONSENSUS_REACHED' | 'QUORUM_LOCKED';
  emoji: string;
}

export interface CivilizationResource {
  id: string;
  name: string;
  category: 'Energy' | 'Compute' | 'Treasury' | 'Security' | 'Lattice';
  currentCapacity: number;
  allocated: number;
  unit: string;
  driftDelta: number;
  ratePerSecond: number;
}

export interface WarpSessionEventLog {
  id: string;
  timestamp: string;
  epoch: number;
  qOps: number;
  warpFactor: number;
  sector: string;
  eventType: 'GOVERNANCE_VOTE' | 'RESOURCE_REBALANCING' | 'MERKLE_ATTESTATION' | 'WARP_BURST' | 'HSM_RECONCILIATION';
  summary: string;
  merkleHash: string;
}

export const CivilizationEngineView: React.FC<{
  onNavigate?: (view: ViewType) => void;
}> = ({ onNavigate }) => {
  const [warpSpeed, setWarpSpeed] = useState<number>(2.0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [simulationEpoch, setSimulationEpoch] = useState<number>(849202);
  const [qOpsStream, setQOpsStream] = useState<number>(24960);
  const [activeTab, setActiveTab] = useState<'governance' | 'resources' | 'warp_engine' | 'forensic_logs'>('governance');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('AGENT-01-SOLON');
  const [logFilter, setLogFilter] = useState<string>('ALL');

  const [agents, setAgents] = useState<CivilizationAgent[]>([
    {
      id: 'AGENT-01-SOLON',
      name: 'Archon Solon (Legislative Guardian)',
      role: 'ETDA & PDPA Safe Harbor Convergence',
      reputation: 99.8,
      votesCast: 1420,
      proposedPolicy: 'Enforce Sub-Kelvin (14.98 mK) strict zero-leakage attestation across Ω600-Ω1000',
      consensusAlignment: 100.0,
      status: 'ACTIVE',
      emoji: '⚖️',
    },
    {
      id: 'AGENT-02-ALAN',
      name: 'Turing-Oppenheimer Overseer',
      role: 'FIPS 204 ML-DSA-87 Lattice Verification',
      reputation: 99.9,
      votesCast: 1398,
      proposedPolicy: 'Auto-promote 10/10 REAL_HSM cryptographic quorum in super-luminal warp streams',
      consensusAlignment: 100.0,
      status: 'ACTIVE',
      emoji: '🔐',
    },
    {
      id: 'AGENT-03-PLATO',
      name: 'Philosopher Sovereign Node',
      role: 'Zero Mutation Policy & Immutable SSoT',
      reputation: 99.5,
      votesCast: 1412,
      proposedPolicy: 'Strict Δ0.00% Zero Drift guarantee enforcement with Ring-04 quarantine buffer',
      consensusAlignment: 99.9,
      status: 'ACTIVE',
      emoji: '🏛️',
    },
    {
      id: 'AGENT-04-MIDAS',
      name: 'Tesseract Vault Grace (Treasury Oracle)',
      role: '1.49B THB-SOV & 14,902 oz XAU Backing',
      reputation: 99.7,
      votesCast: 1380,
      proposedPolicy: 'Continuous real-world asset physical gold rebalancing under FIPS 140-3 L4 consensus',
      consensusAlignment: 100.0,
      status: 'ACTIVE',
      emoji: '💰',
    },
    {
      id: 'AGENT-05-VALKYRIE',
      name: 'Valkyrie Zero-Trust Arbiter',
      role: 'Boundary Partitioning & Threat Neutralization',
      reputation: 99.9,
      votesCast: 1450,
      proposedPolicy: 'Multi-Tenant isolation lock on Ω600_1000 (400 Tenants) with zero cross-tenant bleed',
      consensusAlignment: 100.0,
      status: 'ACTIVE',
      emoji: '🛡️',
    },
  ]);

  const [resources, setResources] = useState<CivilizationResource[]>([
    {
      id: 'RES-01-QUANTUM-COMPUTE',
      name: 'Post-Quantum Lattice Throughput',
      category: 'Compute',
      currentCapacity: 100000,
      allocated: 41200,
      unit: 'qOps/s',
      driftDelta: 0.0012,
      ratePerSecond: 24960,
    },
    {
      id: 'RES-02-CRYO-ISOLATION',
      name: 'Sub-Kelvin Cryo Helium Reserves',
      category: 'Energy',
      currentCapacity: 5000,
      allocated: 3710,
      unit: 'mK-Hours',
      driftDelta: 0.0,
      ratePerSecond: 14.98,
    },
    {
      id: 'RES-03-TREASURY-GOLD',
      name: 'Physical XAU Custody Reserve',
      category: 'Treasury',
      currentCapacity: 25000,
      allocated: 14902,
      unit: 'oz Gold',
      driftDelta: 0.0,
      ratePerSecond: 0.0,
    },
    {
      id: 'RES-04-ZERO-TRUST-SHIELDS',
      name: 'Ring-04 Isolated Firewall Shards',
      category: 'Security',
      currentCapacity: 100,
      allocated: 100,
      unit: 'Shards',
      driftDelta: 0.0,
      ratePerSecond: 0.0,
    },
  ]);

  const [sessionLogs, setSessionLogs] = useState<WarpSessionEventLog[]>([
    {
      id: 'LOG-849202-01',
      timestamp: '2026-09-10 01:10:00 ICT',
      epoch: 849202,
      qOps: 12480,
      warpFactor: 1.0,
      sector: 'Sector-01 Solaris Prime',
      eventType: 'MERKLE_ATTESTATION',
      summary: 'SSoT Block #849202 canonical seal verification complete. 14,902 verified seals reconciled.',
      merkleHash: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    },
    {
      id: 'LOG-849202-02',
      timestamp: '2026-09-10 01:10:15 ICT',
      epoch: 849202,
      qOps: 12510,
      warpFactor: 1.0,
      sector: 'Sector-03 Cygnus Legal',
      eventType: 'GOVERNANCE_VOTE',
      summary: 'Archon Solon passed PDPA Sec 28 cross-border safe harbor validation with 100% consensus.',
      merkleHash: '0x5d8e71a0b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0',
    },
    {
      id: 'LOG-849203-01',
      timestamp: '2026-09-10 01:10:30 ICT',
      epoch: 849203,
      qOps: 12640,
      warpFactor: 1.5,
      sector: 'Sector-02 Andromeda Enclave',
      eventType: 'WARP_BURST',
      summary: 'Quantum warp stream stabilized at 14.98 mK sub-kelvin thermal baseline. Zero thermal jitter.',
      merkleHash: '0x849203c94816bed34cdbb07528e18501da86fc4691763a43fa4c69',
    },
    {
      id: 'LOG-849203-02',
      timestamp: '2026-09-10 01:10:45 ICT',
      epoch: 849203,
      qOps: 12890,
      warpFactor: 1.5,
      sector: 'Sector-04 Orion Treasury',
      eventType: 'RESOURCE_REBALANCING',
      summary: 'Treasury verified 14,902 oz physical gold backing across all 400 tenants in Ω600_1000.',
      merkleHash: '0x040202e14816bed34cdbb07528e18501da86fc4691763a43fa4c60',
    },
  ]);

  // Real-time Epoch & qOps simulation loop
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setQOpsStream((prev) => {
        const delta = Math.floor(Math.random() * 120) - 60;
        return Math.max(9000, Math.floor(12500 * warpSpeed + delta));
      });

      // Add dynamic event log periodically
      if (Math.random() > 0.6) {
        const sectors = ['Sector-01 Solaris Prime', 'Sector-02 Andromeda Enclave', 'Sector-03 Cygnus Legal', 'Sector-04 Orion Treasury', 'Sector-05 Centauri BFT', 'Sector-06 Valkyrie Defense'];
        const eventTypes: WarpSessionEventLog['eventType'][] = ['GOVERNANCE_VOTE', 'RESOURCE_REBALANCING', 'MERKLE_ATTESTATION', 'WARP_BURST', 'HSM_RECONCILIATION'];
        const randomSector = sectors[Math.floor(Math.random() * sectors.length)];
        const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const newEpoch = simulationEpoch + 1;
        setSimulationEpoch(newEpoch);

        const newLog: WarpSessionEventLog = {
          id: `LOG-${newEpoch}-${Date.now().toString().slice(-4)}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' ICT',
          epoch: newEpoch,
          qOps: Math.floor(12500 * warpSpeed),
          warpFactor: warpSpeed,
          sector: randomSector,
          eventType: randomType,
          summary: `Continuous Warp Civilization cycle executed for ${randomSector}. Zero drift verified.`,
          merkleHash: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
        };

        setSessionLogs((prev) => [newLog, ...prev.slice(0, 49)]);
      }
    }, 1500 / Math.max(0.5, warpSpeed));

    return () => clearInterval(interval);
  }, [isPaused, warpSpeed, simulationEpoch]);

  // Export functions
  const handleExportJSON = () => {
    playAuditChime();
    const exportData = {
      exportMetadata: {
        system: "ZYRQUEN Ω∞ SOVEREIGN WORLD ENGINE",
        edition: "APEX ULTIMATE MASTER EDITION FROZEN v1.2 LTS",
        exportTimestamp: new Date().toISOString(),
        principal: "นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)",
        genesisRoot: "909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68",
        canonicalSeals: 14902,
        boundary: "Ω600_1000 (400 Tenants LOCKED)",
        hsmQuorum: "10/10 REAL_HSM FIPS 140-3 L4",
        currentWarpSpeed: `${warpSpeed}x`,
        activeThroughput: `${qOpsStream} qOps/s`,
      },
      agents,
      resources,
      sessionLogs,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ZYRQUEN_WARP_CIVILIZATION_SESSION_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    playAuditChime();
    const headers = ['Log_ID', 'Timestamp', 'Epoch', 'qOps', 'Warp_Factor', 'Sector', 'Event_Type', 'Summary', 'Merkle_Hash'];
    const rows = sessionLogs.map((log) => [
      log.id,
      `"${log.timestamp}"`,
      log.epoch,
      log.qOps,
      log.warpFactor,
      `"${log.sector}"`,
      log.eventType,
      `"${log.summary.replace(/"/g, '""')}"`,
      log.merkleHash,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ZYRQUEN_WARP_CIVILIZATION_EVENTS_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const currentAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  const filteredLogs = sessionLogs.filter((log) => {
    if (logFilter === 'ALL') return true;
    return log.eventType === logFilter;
  });

  return (
    <div id="civilization-engine-view" className="w-full max-w-full overflow-hidden bg-[#070a12] border border-[#D4AF37]/50 rounded-xl sm:rounded-2xl p-3 sm:p-5 md:p-6 font-mono text-[#06B6D4] shadow-2xl space-y-4 sm:space-y-6">
      {/* Top Header & Simulation Master HUD */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-3 sm:pb-4 border-b border-[#0a0f1e] gap-3 sm:gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-xl sm:text-2xl">🏛️</span>
            <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-black tracking-wide sm:tracking-wider text-[#D4AF37] break-words">
              CIVILIZATION ENGINE &amp; MULTI-AGENT GOVERNANCE Ω∞
            </h1>
            <span className="px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-emerald-950/60 border border-emerald-500 text-emerald-400">
              FROZEN v1.2 LTS
            </span>
            <span className="px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-[#0a0f1e] border border-[#D4AF37] text-[#D4AF37]">
              Ω600_1000 (400 TENANTS)
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400">
            Continuous Resource Management • Multi-Agent Sovereign Governance • Warp Throughput: <strong className="text-emerald-400">{qOpsStream.toLocaleString()} qOps/s</strong>
          </p>
        </div>

        {/* Warp Controls & Export Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-[11px] sm:text-xs">
          <button
            onClick={() => {
              playTone(600, 0.02);
              setIsPaused(!isPaused);
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isPaused
                ? 'bg-amber-950/40 border border-[#D4AF37] text-[#D4AF37]'
                : 'bg-emerald-950/40 border border-emerald-500 text-emerald-400'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'RESUME SIMULATION' : 'PAUSE SIMULATION'}</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="px-2.5 sm:px-3 py-1.5 bg-[#0a0f1e] border border-[#06B6D4] hover:bg-[#06B6D4]/20 text-[#06B6D4] font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT JSON</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-2.5 sm:px-3 py-1.5 bg-[#0a0f1e] border border-[#D4AF37] hover:bg-[#D4AF37]/20 text-[#D4AF37] font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>EXPORT CSV</span>
          </button>
        </div>
      </div>

      {/* Warp Simulation Controller Bar */}
      <div className="p-3 sm:p-4 bg-[#0a0f1e] border border-slate-800 rounded-xl space-y-2.5 sm:space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base">⚡</span>
            <span className="font-bold text-slate-200 text-xs sm:text-sm">WARP SIMULATION FLOW CONTROLLER</span>
            <span className="px-2 py-0.5 rounded bg-black text-[#D4AF37] font-bold text-[10px] sm:text-[11px] border border-slate-800">
              Epoch: #{simulationEpoch}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => {
                playTone(450, 0.02);
                setWarpSpeed((prev) => Math.max(0.2, Number((prev - 0.2).toFixed(1))));
              }}
              className="px-2 py-1 bg-[#070a12] border border-slate-700 hover:border-slate-500 rounded text-slate-300"
              title="Decrease speed"
            >
              <Rewind className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Warp Speed:</span>
              <span className="text-emerald-400 font-bold text-xs sm:text-sm">{warpSpeed}x</span>
            </div>

            <button
              onClick={() => {
                playTone(750, 0.02);
                setWarpSpeed((prev) => Math.min(3.0, Number((prev + 0.2).toFixed(1))));
              }}
              className="px-2 py-1 bg-[#070a12] border border-slate-700 hover:border-slate-500 rounded text-slate-300"
              title="Increase speed"
            >
              <FastForward className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                playAuditChime();
                setWarpSpeed(1.0);
              }}
              className="px-2 py-1 bg-[#070a12] border border-slate-700 hover:border-slate-500 rounded text-slate-300 text-[10px]"
            >
              RESET 1.0x
            </button>
          </div>
        </div>

        {/* Interactive Warp Range Slider */}
        <div className="space-y-1.5">
          <input
            type="range"
            min="0.2"
            max="3.0"
            step="0.1"
            value={warpSpeed}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setWarpSpeed(val);
              playTone(500 + val * 100, 0.01);
            }}
            className="w-full h-1.5 bg-[#070a12] rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
          />
          <div className="flex justify-between text-[9px] sm:text-[10px] text-slate-500 gap-1 overflow-hidden">
            <span className="truncate">0.2x <span className="hidden sm:inline">(Sub-Quantum)</span></span>
            <span className="truncate">1.0x <span className="hidden sm:inline">(Nominal Warp)</span></span>
            <span className="truncate">2.0x <span className="hidden sm:inline">(HyperWarp)</span></span>
            <span className="truncate">3.0x <span className="hidden sm:inline">(Max Velocity)</span></span>
          </div>
        </div>
      </div>

      {/* Navigation Mode Ribbon */}
      <div className="flex overflow-x-auto no-scrollbar sm:flex-wrap items-center gap-1.5 sm:gap-2 bg-[#0a0f1e] p-1.5 sm:p-2 rounded-lg border border-slate-800 text-[11px] sm:text-xs w-full">
        <button
          onClick={() => {
            playTone(600, 0.02);
            setActiveTab('governance');
          }}
          className={`px-3 py-1.5 rounded font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
            activeTab === 'governance'
              ? 'bg-[#070a12] text-[#D4AF37] border border-[#D4AF37]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>👑 Multi-Agent Council ({agents.length})</span>
        </button>

        <button
          onClick={() => {
            playTone(640, 0.02);
            setActiveTab('resources');
          }}
          className={`px-3 py-1.5 rounded font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
            activeTab === 'resources'
              ? 'bg-[#070a12] text-emerald-400 border border-emerald-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>⚙️ Resource Matrix ({resources.length})</span>
        </button>

        <button
          onClick={() => {
            playTone(680, 0.02);
            setActiveTab('warp_engine');
          }}
          className={`px-3 py-1.5 rounded font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
            activeTab === 'warp_engine'
              ? 'bg-[#070a12] text-cyan-300 border border-cyan-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🌌 Warp Visualizer</span>
        </button>

        <button
          onClick={() => {
            playTone(720, 0.02);
            setActiveTab('forensic_logs');
          }}
          className={`px-3 py-1.5 rounded font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
            activeTab === 'forensic_logs'
              ? 'bg-[#070a12] text-purple-300 border border-purple-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>📜 Session Logs ({sessionLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: Multi-Agent Governance */}
      {activeTab === 'governance' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5">
          {/* Agent Selection List */}
          <div className="lg:col-span-5 bg-[#0a0f1e] border border-slate-800 rounded-xl p-3 sm:p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200">Sovereign Autonomous Agents</span>
              <span className="text-[10px] text-emerald-400 font-bold">10/10 Quorum Active</span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {agents.map((agent) => {
                const isSelected = selectedAgentId === agent.id;
                return (
                  <div
                    key={agent.id}
                    onClick={() => {
                      playTone(550, 0.02);
                      setSelectedAgentId(agent.id);
                    }}
                    className={`p-2.5 sm:p-3 rounded-lg border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-[#070a12] border-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                        : 'bg-[#070a12]/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span>{agent.emoji}</span>
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-[#D4AF37]' : 'text-slate-200'}`}>
                          {agent.name}
                        </span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500 text-emerald-400 font-bold shrink-0">
                        {agent.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-snug">{agent.role}</p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                      <span>Reputation: <strong className="text-emerald-400">{agent.reputation}%</strong></span>
                      <span>Votes: <strong className="text-slate-300">{agent.votesCast}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Policy View */}
          <div className="lg:col-span-7 bg-[#0a0f1e] border border-[#D4AF37]/30 rounded-xl p-3.5 sm:p-5 space-y-3 sm:space-y-4 text-xs">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl sm:text-2xl">{currentAgent.emoji}</span>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-500 uppercase block">{currentAgent.id}</span>
                  <h3 className="font-bold text-[#D4AF37] text-xs sm:text-sm truncate">{currentAgent.name}</h3>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-[#070a12] border border-emerald-500 text-emerald-400 font-bold text-[10px] shrink-0">
                ALIGNMENT: {currentAgent.consensusAlignment}%
              </span>
            </div>

            <div className="p-3 bg-[#070a12] border border-slate-800 rounded space-y-1.5">
              <span className="text-slate-500 text-[10px] block uppercase">Active Sovereign Policy Proposal</span>
              <p className="text-slate-200 leading-relaxed font-sans text-xs">
                "{currentAgent.proposedPolicy}"
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div className="p-2.5 sm:p-3 bg-[#070a12] border border-slate-800 rounded space-y-1">
                <span className="text-slate-500 text-[10px] block">Cryptographic Authority</span>
                <span className="text-purple-300 font-bold text-[11px] sm:text-xs">FIPS 204 ML-DSA-87 Signed</span>
              </div>
              <div className="p-2.5 sm:p-3 bg-[#070a12] border border-slate-800 rounded space-y-1">
                <span className="text-slate-500 text-[10px] block">Tenant Namespace Guard</span>
                <span className="text-[#D4AF37] font-bold text-[11px] sm:text-xs">Ω600_1000 Partition Locked</span>
              </div>
            </div>

            <div className="p-2.5 sm:p-3 bg-[#070a12] border border-emerald-500/30 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
              <span className="text-slate-300">Continuous Consensus Status:</span>
              <span className="text-emerald-400 font-bold">UNANIMOUS 10/10 REAL_HSM QUORUM</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Continuous Resource Matrix */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {resources.map((res) => {
              const pct = ((res.allocated / res.currentCapacity) * 100).toFixed(1);
              return (
                <div key={res.id} className="p-3.5 sm:p-4 bg-[#0a0f1e] border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{res.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500 text-cyan-300">
                      {res.category}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Allocation</span>
                      <span className="text-[#D4AF37] font-bold">{res.allocated.toLocaleString()} / {res.currentCapacity.toLocaleString()} {res.unit}</span>
                    </div>
                    <div className="w-full h-2 bg-[#070a12] rounded-full overflow-hidden border border-slate-800">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-[#D4AF37]" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-500 block text-right">{pct}% Utilized</span>
                  </div>

                  <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Drift Delta:</span>
                    <span className="text-emerald-400 font-bold">Δ{res.driftDelta.toFixed(4)}% ZERO</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: 6-Sector Warp Engine Visualizer */}
      {activeTab === 'warp_engine' && (
        <SupremeWarpCivilizationEngine />
      )}

      {/* TAB 4: Forensic Session Logs */}
      {activeTab === 'forensic_logs' && (
        <div className="bg-[#0a0f1e] border border-purple-500/30 rounded-xl p-3.5 sm:p-5 space-y-3 sm:space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-purple-300 text-xs sm:text-sm">
                📜 Forensic Warp Session Event Stream
              </span>
              <span className="text-[10px] text-slate-500">({filteredLogs.length} Events)</span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="text-slate-400 text-[11px]">Filter:</span>
              {['ALL', 'GOVERNANCE_VOTE', 'MERKLE_ATTESTATION', 'WARP_BURST', 'RESOURCE_REBALANCING'].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    playTone(600, 0.01);
                    setLogFilter(type);
                  }}
                  className={`px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold border transition-colors ${
                    logFilter === type
                      ? 'bg-purple-950 border-purple-500 text-purple-300'
                      : 'bg-[#070a12] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 font-mono">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-2.5 sm:p-3 bg-[#070a12] border border-slate-800 rounded space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 text-[10px] sm:text-[11px]">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className="font-bold text-[#D4AF37]">{log.id}</span>
                    <span className="px-1.5 py-0.2 rounded bg-purple-950/60 border border-purple-500/50 text-purple-300 text-[9px]">
                      {log.eventType}
                    </span>
                    <span className="text-slate-400">{log.sector}</span>
                  </div>
                  <span className="text-slate-500 text-[9px] sm:text-[10px]">{log.timestamp}</span>
                </div>

                <p className="text-slate-300 text-xs font-sans">
                  {log.summary}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                  <code className="text-emerald-400 truncate max-w-[200px] sm:max-w-sm">Root: {log.merkleHash}</code>
                  <span>Warp: <strong className="text-cyan-300">{log.warpFactor}x</strong> &bull; qOps: <strong className="text-slate-200">{log.qOps}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sovereign Attestation Footer */}
      <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-slate-400 gap-1.5 sm:gap-2">
        <span>Principal: <strong className="text-slate-200">นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)</strong></span>
        <span>Civilization Boundary: <strong className="text-[#D4AF37]">Ω600_1000 LOCKED</strong></span>
        <span className="text-emerald-400 font-bold">MULTI-AGENT CONTINUUM 100% GREEN</span>
      </div>
    </div>
  );
};
