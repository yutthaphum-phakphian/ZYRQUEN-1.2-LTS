import React, { useState, useEffect } from 'react';
import { ViewType } from '../types';
import { SYSTEM_METADATA, CANONICAL_MODULES, AUDIT_TRACE_TX, THAI_CUSTODIANS } from '../data/canonicalData';
import { CitadelCanvas } from './CitadelCanvas';
import { TopologyCanvas } from './TopologyCanvas';
import { QuantumEntropyGraph } from './QuantumEntropyGraph';
import { ConsoleHardwareTelemetryGrid } from './ConsoleHardwareTelemetryGrid';
import { CryptographyStream } from './CryptographyStream';
import {
  Activity,
  Cpu,
  ShieldCheck,
  Zap,
  ArrowRight,
  Database,
  Lock,
  Layers,
  Sparkles,
  Server,
  Play,
  RotateCw,
  Award,
  Pin,
  PinOff,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Layout,
  Plus,
  RefreshCw,
  Binary,
  Radio,
  Sliders,
  Check,
  Eye,
  Workflow,
  Orbit,
  BatteryCharging,
  Thermometer,
  Key,
  ShieldAlert,
  Globe,
  Maximize2,
  Minimize2,
  Trash2,
  Scale,
  FileCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { playAuditChime, playTone } from './AudioSynthesizer';

export type WidgetId =
  | 'entropy_graph'
  | 'hardware_grid'
  | 'crypto_stream'
  | 'forensic_pipeline'
  | 'citadel_3d'
  | 'topology_view'
  | 'pulse_telemetry_chart'
  | 'dag_forge_runner'
  | 'multiverse_matrix_sim'
  | 'custodian_registry'
  | 'legal_sovereign_mapping'
  | 'zero_trust_vectors'
  | 'global_nodes_mesh';

export interface WidgetDef {
  id: WidgetId;
  title: string;
  subtitle: string;
  sourceView: ViewType;
  badge: string;
  category: 'Quantum & Compute' | 'Cryptography & Ledger' | 'Simulation & Workflows' | 'Governance & Security';
  icon: React.ReactNode;
  accentColor: string;
}

export const ALL_AVAILABLE_WIDGETS: WidgetDef[] = [
  {
    id: 'entropy_graph',
    title: 'Quantum Coherence & Entropy Force Graph',
    subtitle: 'Interactive D3 physics topology of 768 physical qubits & entanglement channels',
    sourceView: 'quantum',
    badge: 'QUANTUM NEXUS',
    category: 'Quantum & Compute',
    icon: <Cpu className="w-4 h-4 text-violet-400" />,
    accentColor: '#8b5cf6',
  },
  {
    id: 'hardware_grid',
    title: 'Real-Time Hardware Telemetry Matrix',
    subtitle: '16 core modules with CPU trends, zoom/pan forensic inspection & live load telemetry',
    sourceView: 'console',
    badge: 'HARDWARE & TELEMETRY',
    category: 'Quantum & Compute',
    icon: <Activity className="w-4 h-4 text-cyan-400" />,
    accentColor: '#06b6d4',
  },
  {
    id: 'crypto_stream',
    title: 'Post-Quantum Cryptographic Proof Stream',
    subtitle: 'Live rolling hash verifications, Dilithium-5 signatures & Kyber-1024 envelopes',
    sourceView: 'vault',
    badge: 'CRYPTO VAULT',
    category: 'Cryptography & Ledger',
    icon: <Binary className="w-4 h-4 text-emerald-400" />,
    accentColor: '#10b981',
  },
  {
    id: 'forensic_pipeline',
    title: '12-Stage Forensics Transaction Pipeline',
    subtitle: 'Stage-by-stage audit attestation, cryptographic nonces & Merkle proofs',
    sourceView: 'ledger',
    badge: 'IMMUTABLE LEDGER',
    category: 'Cryptography & Ledger',
    icon: <ShieldCheck className="w-4 h-4 text-amber-400" />,
    accentColor: '#f59e0b',
  },
  {
    id: 'pulse_telemetry_chart',
    title: '24-Hour Civilization Intelligence Trend Stream',
    subtitle: 'Area sparklines for QOps throughput, sub-kelvin thermal stability & network nodes',
    sourceView: 'pulse',
    badge: 'SYSTEM PULSE',
    category: 'Quantum & Compute',
    icon: <Radio className="w-4 h-4 text-cyan-400" />,
    accentColor: '#06b6d4',
  },
  {
    id: 'citadel_3d',
    title: '3D Quantum Citadel Lattice Canvas',
    subtitle: 'Real-time rotating icosahedron with golden geometry and cyan torus ring',
    sourceView: 'dashboard',
    badge: 'WORLD ENGINE',
    category: 'Simulation & Workflows',
    icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
    accentColor: '#06b6d4',
  },
  {
    id: 'topology_view',
    title: 'Civilization Topological Subnet Mesh',
    subtitle: 'Decentralized Thai sovereign nodes and interconnect routing matrix',
    sourceView: 'nexus',
    badge: 'NEURAL NEXUS',
    category: 'Simulation & Workflows',
    icon: <Layers className="w-4 h-4 text-blue-400" />,
    accentColor: '#3b82f6',
  },
  {
    id: 'dag_forge_runner',
    title: 'DAG Workflow Automation Runner',
    subtitle: 'Simulate automated 5-step fail-closed incident response pipeline with live step feedback',
    sourceView: 'forge',
    badge: 'WORKFLOW FORGE',
    category: 'Simulation & Workflows',
    icon: <Workflow className="w-4 h-4 text-amber-400" />,
    accentColor: '#f59e0b',
  },
  {
    id: 'multiverse_matrix_sim',
    title: 'Multiverse Simulation & Blast Radius Matrix',
    subtitle: 'Parallel counterfactual universe comparison with Monte Carlo zero-drift verification',
    sourceView: 'matrix',
    badge: 'MULTIVERSE MATRIX',
    category: 'Simulation & Workflows',
    icon: <Orbit className="w-4 h-4 text-violet-400" />,
    accentColor: '#a855f7',
  },
  {
    id: 'custodian_registry',
    title: 'Thai Sovereign Custodians & Passports',
    subtitle: 'Biometric cryptographic custody cards with executive clearance fingerprints',
    sourceView: 'settings',
    badge: 'THAI CUSTODIANS',
    category: 'Governance & Security',
    icon: <Key className="w-4 h-4 text-amber-400" />,
    accentColor: '#f59e0b',
  },
  {
    id: 'legal_sovereign_mapping',
    title: 'Thai Electronic Transactions Act (Sec 9, 26, 28) ↔ Sovereign Chain',
    subtitle: 'Interactive 3-tier architecture mapping Thai statutory law to Merkle Seal Chain runtime',
    sourceView: 'settings',
    badge: 'ETDA & LEGAL MATRIX',
    category: 'Governance & Security',
    icon: <Scale className="w-4 h-4 text-cyan-400" />,
    accentColor: '#06b6d4',
  },
  {
    id: 'zero_trust_vectors',
    title: 'Zero-Trust Defense Shield & Invariant Matrix',
    subtitle: 'Real-time simulated adversarial vector interdiction across authority boundary Ω601–Ω1000',
    sourceView: 'security',
    badge: 'ZERO TRUST',
    category: 'Governance & Security',
    icon: <ShieldAlert className="w-4 h-4 text-emerald-400" />,
    accentColor: '#10b981',
  },
  {
    id: 'global_nodes_mesh',
    title: 'Global Regional Nodes Interconnect Matrix',
    subtitle: 'ASEAN, APAC, EU & US sovereign edge nodes with live latency & cache hit ratios',
    sourceView: 'nexus',
    badge: 'GLOBAL NEXUS',
    category: 'Governance & Security',
    icon: <Globe className="w-4 h-4 text-blue-400" />,
    accentColor: '#3b82f6',
  },
];

export const DEFAULT_PINNED_WIDGETS: WidgetId[] = [
  'entropy_graph',
  'hardware_grid',
  'pulse_telemetry_chart',
  'crypto_stream',
  'forensic_pipeline',
  'dag_forge_runner',
];

interface PinnedWidgetsDashboardProps {
  onNavigate: (view: ViewType) => void;
}

export const PinnedWidgetsDashboard: React.FC<PinnedWidgetsDashboardProps> = ({ onNavigate }) => {
  // Pinned state loaded from LocalStorage
  const [pinnedWidgets, setPinnedWidgets] = useState<WidgetId[]>(() => {
    try {
      const saved = localStorage.getItem('zyrquen_pinned_dashboard_widgets_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_PINNED_WIDGETS;
  });

  const [draggedWidgetId, setDraggedWidgetId] = useState<WidgetId | null>(null);
  const [dragOverWidgetId, setDragOverWidgetId] = useState<WidgetId | null>(null);
  const [collapsedWidgets, setCollapsedWidgets] = useState<Record<string, boolean>>({});
  const [expandedWidgets, setExpandedWidgets] = useState<Record<string, boolean>>({});
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Sub-widget state: DAG Forge
  const [isDagRunning, setIsDagRunning] = useState(false);
  const [dagStep, setDagStep] = useState(-1);

  // Sub-widget state: Multiverse Simulation
  const [selectedUniverse, setSelectedUniverse] = useState<'prime' | 'alpha' | 'omega'>('prime');
  const [isMonteCarloRunning, setIsMonteCarloRunning] = useState(false);
  const [monteCarloResult, setMonteCarloResult] = useState<string | null>(null);

  // Sub-widget state: Zero Trust Scan
  const [isShieldScanning, setIsShieldScanning] = useState(false);
  const [shieldScanResult, setShieldScanResult] = useState<string | null>(null);

  // Sub-widget state: Regional Node
  const [selectedRegion, setSelectedRegion] = useState('bkk');

  // Pulse Telemetry Chart Data
  const [telemetryStream, setTelemetryStream] = useState(() => {
    const hours = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'];
    return hours.map((h, i) => ({
      time: h,
      qops: 840 + Math.sin(i) * 15 + Math.random() * 8,
      cryo: +(14.8 + Math.random() * 0.4).toFixed(2),
      coherence: +(99.92 + Math.random() * 0.06).toFixed(3),
    }));
  });

  // Save changes to localStorage
  const savePinnedWidgets = (widgets: WidgetId[]) => {
    setPinnedWidgets(widgets);
    try {
      localStorage.setItem('zyrquen_pinned_dashboard_widgets_v2', JSON.stringify(widgets));
    } catch {
      // ignore
    }
  };

  const togglePinWidget = (id: WidgetId) => {
    playTone(580, 0.04);
    if (pinnedWidgets.includes(id)) {
      savePinnedWidgets(pinnedWidgets.filter((w) => w !== id));
    } else {
      savePinnedWidgets([...pinnedWidgets, id]);
    }
  };

  const moveWidget = (id: WidgetId, direction: 'up' | 'down') => {
    const idx = pinnedWidgets.indexOf(id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= pinnedWidgets.length) return;

    playTone(620, 0.04);
    const updated = [...pinnedWidgets];
    const item = updated.splice(idx, 1)[0];
    updated.splice(targetIdx, 0, item);
    savePinnedWidgets(updated);
  };

  const toggleCollapse = (id: string) => {
    playTone(540, 0.03);
    setCollapsedWidgets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleExpand = (id: string) => {
    playTone(560, 0.03);
    setExpandedWidgets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: WidgetId) => {
    setDraggedWidgetId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: WidgetId) => {
    e.preventDefault();
    if (draggedWidgetId && draggedWidgetId !== id) {
      setDragOverWidgetId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverWidgetId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: WidgetId) => {
    e.preventDefault();
    setDragOverWidgetId(null);
    const sourceId = (e.dataTransfer.getData('text/plain') as WidgetId) || draggedWidgetId;
    if (!sourceId || sourceId === targetId) return;

    const sourceIdx = pinnedWidgets.indexOf(sourceId);
    const targetIdx = pinnedWidgets.indexOf(targetId);
    if (sourceIdx === -1 || targetIdx === -1) return;

    playTone(660, 0.05);
    const updated = [...pinnedWidgets];
    const item = updated.splice(sourceIdx, 1)[0];
    updated.splice(targetIdx, 0, item);
    savePinnedWidgets(updated);
    setDraggedWidgetId(null);
  };

  const handleDragEnd = () => {
    setDraggedWidgetId(null);
    setDragOverWidgetId(null);
  };

  const resetDefaultWidgets = () => {
    playAuditChime();
    savePinnedWidgets(DEFAULT_PINNED_WIDGETS);
    setCollapsedWidgets({});
    setExpandedWidgets({});
  };

  // DAG Runner simulation trigger
  const runDagSimulation = () => {
    setIsDagRunning(true);
    setDagStep(0);
    playTone(500, 0.08);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < 5) {
        setDagStep(step);
        playTone(450 + step * 50, 0.06);
      } else {
        clearInterval(interval);
        setIsDagRunning(false);
        playAuditChime();
      }
    }, 500);
  };

  // Monte Carlo simulation trigger
  const runMonteCarlo = () => {
    setIsMonteCarloRunning(true);
    setMonteCarloResult(null);
    playTone(480, 0.1, 'sawtooth');

    setTimeout(() => {
      setIsMonteCarloRunning(false);
      setMonteCarloResult('10,000 parallel iterations validated. 0 invariant drift detected. Blast radius locked at 0.8%.');
      playAuditChime();
    }, 1000);
  };

  // Zero-Trust deep scan trigger
  const runZeroTrustScan = () => {
    setIsShieldScanning(true);
    setShieldScanResult(null);
    playTone(520, 0.08);

    setTimeout(() => {
      setIsShieldScanning(false);
      setShieldScanResult('10/10 Invariants passed. 5 simulated adversarial vectors intercepted & fail-closed.');
      playAuditChime();
    }, 900);
  };

  // Filter available widgets
  const filteredCatalog = ALL_AVAILABLE_WIDGETS.filter((w) => {
    const matchesCat = filterCategory === 'All' || w.category === filterCategory;
    const matchesSearch =
      w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.badge.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const categories = ['All', 'Quantum & Compute', 'Cryptography & Ledger', 'Simulation & Workflows', 'Governance & Security'];

  // Render individual sub-panel component content
  const renderWidgetContent = (id: WidgetId) => {
    switch (id) {
      case 'entropy_graph':
        return (
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
            <QuantumEntropyGraph />
          </div>
        );

      case 'hardware_grid':
        return (
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
            <ConsoleHardwareTelemetryGrid />
          </div>
        );

      case 'crypto_stream':
        return (
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 max-h-[380px] overflow-y-auto">
            <CryptographyStream />
          </div>
        );

      case 'forensic_pipeline':
        return (
          <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-4 font-mono text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-zinc-200 font-bold">{AUDIT_TRACE_TX.txId}</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">{AUDIT_TRACE_TX.title}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                12/12 ATTESTED
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {AUDIT_TRACE_TX.stages.slice(0, 6).map((st) => (
                <div key={st.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-cyan-300 font-bold">Stage {st.stageNumber}</span>
                    <span className="text-zinc-500">{st.durationMs}ms</span>
                  </div>
                  <div className="text-zinc-300 font-medium truncate">{st.name}</div>
                  <div className="text-[10px] text-emerald-400/80">Merkle Root Verified</div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-white/5">
              <span>Root: {AUDIT_TRACE_TX.rootActor}</span>
              <button
                onClick={() => onNavigate('ledger')}
                className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 flex items-center gap-1"
              >
                <span>Full Ledger Explorer</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        );

      case 'pulse_telemetry_chart':
        return (
          <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-zinc-300 font-bold">24-Hour QOps & Coherence Stream</span>
              </div>
              <span className="text-[10px] text-zinc-500">Live 1.2ms Sampling</span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={telemetryStream} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="qopsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="time" stroke="#71717a" fontSize={10} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={10} domain={['dataMin - 10', 'dataMax + 10']} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#07080f',
                      borderColor: '#ffffff15',
                      borderRadius: '12px',
                      fontSize: '11px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="qops"
                    name="QOps/s"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#qopsGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center">
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-zinc-500 block">THROUGHPUT</span>
                <span className="text-cyan-300 font-bold text-xs">{SYSTEM_METADATA.qOpsTelemetry} QOps/s</span>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-zinc-500 block">COHERENCE</span>
                <span className="text-violet-300 font-bold text-xs">{SYSTEM_METADATA.coherence}</span>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-zinc-500 block">CRYO TEMP</span>
                <span className="text-amber-300 font-bold text-xs">{SYSTEM_METADATA.cryoTemp}</span>
              </div>
            </div>
          </div>
        );

      case 'dag_forge_runner':
        const pipelineSteps = [
          { id: 0, title: 'OTel Anomaly Sensor', type: 'TRIGGER', desc: 'Listen to CPU/Memory threshold spikes > 85%' },
          { id: 1, title: 'Digital Twin SimA', type: 'SIMULATION', desc: 'Simulate container right-sizing blast radius' },
          { id: 2, title: 'Executive Passport Gate', type: 'GOVERNANCE', desc: 'Verify Thai Sovereign Passport #EP-001' },
          { id: 3, title: 'Cloud Run Auto-Scaler', type: 'EXECUTION', desc: 'Apply CPU_LIMIT=4.0 with isolated failover' },
          { id: 4, title: 'Post-Quantum Merkle Seal', type: 'SEAL', desc: 'Append 14,902nd block leaf with SHA-256' },
        ];

        return (
          <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-zinc-200 font-bold">5-Step Phoenix Healing Workflow</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">Automated DAG Pipeline with Fail-Closed Circuit Breaker</p>
              </div>
              <button
                onClick={runDagSimulation}
                disabled={isDagRunning}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  isDagRunning
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                    : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30'
                }`}
              >
                <Play className={`w-3.5 h-3.5 ${isDagRunning ? 'animate-spin' : ''}`} />
                <span>{isDagRunning ? 'Executing...' : 'Run Pipeline'}</span>
              </button>
            </div>

            <div className="space-y-2">
              {pipelineSteps.map((st, i) => {
                const isActive = dagStep === i;
                const isPassed = dagStep > i;
                return (
                  <div
                    key={st.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                      isActive
                        ? 'bg-amber-500/15 border-amber-400 text-white shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                        : isPassed
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-white/[0.02] border-white/5 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                          isActive
                            ? 'bg-amber-400 text-black animate-pulse'
                            : isPassed
                            ? 'bg-emerald-400 text-black'
                            : 'bg-white/5 text-zinc-500'
                        }`}
                      >
                        {isPassed ? '✓' : i + 1}
                      </span>
                      <div>
                        <span className="font-semibold text-zinc-200">{st.title}</span>
                        <span className="text-[10px] text-zinc-500 block">{st.desc}</span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 font-mono">
                      {isActive ? 'PROCESSING' : isPassed ? 'VERIFIED' : st.type}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'multiverse_matrix_sim':
        const universes = [
          { id: 'prime', name: 'Universe Prime (SSoT Mirror)', divergence: '0.00% Divergence', blastRadius: '0.8%', status: 'CANONICAL' },
          { id: 'alpha', name: 'Universe Alpha (Stress 10x Load)', divergence: '1.42% Counterfactual', blastRadius: '1.4%', status: 'SYNTHETIC' },
          { id: 'omega', name: 'Universe Omega (Adversarial Injection)', divergence: '4.88% Attack Vector', blastRadius: '0.0%', status: 'QUARANTINED' },
        ];

        return (
          <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-zinc-200 font-bold">Parallel Digital Twin Simulations</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">Monte Carlo Invariant Verification & Isolation Boundary</p>
              </div>
              <button
                onClick={runMonteCarlo}
                disabled={isMonteCarloRunning}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all ${
                  isMonteCarloRunning
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 animate-pulse'
                    : 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border-purple-500/30'
                }`}
              >
                <Orbit className={`w-3.5 h-3.5 ${isMonteCarloRunning ? 'animate-spin' : ''}`} />
                <span>{isMonteCarloRunning ? 'Simulating...' : 'Run 10k Iterations'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {universes.map((u) => {
                const isSelected = selectedUniverse === u.id;
                return (
                  <div
                    key={u.id}
                    onClick={() => {
                      playTone(520, 0.04);
                      setSelectedUniverse(u.id as any);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-400/50 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                        : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-200 font-bold truncate">{u.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-purple-300">{u.status}</span>
                    </div>
                    <div className="text-[10px] text-zinc-400">{u.divergence}</div>
                    <div className="text-[10px] text-emerald-400/90">Blast Radius: {u.blastRadius}</div>
                  </div>
                );
              })}
            </div>

            {monteCarloResult && (
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] animate-in fade-in">
                {monteCarloResult}
              </div>
            )}
          </div>
        );

      case 'custodian_registry':
        return (
          <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-zinc-200 font-bold">Thai Sovereign Executive Passports</span>
              <span className="text-emerald-400 text-[11px]">4 Registered Passports</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {THAI_CUSTODIANS.slice(0, 2).map((c) => (
                <div key={c.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span>🇹🇭</span>
                      <span>{c.nameTh}</span>
                    </span>
                    <span className="text-[10px] text-amber-400 font-semibold">{c.clearanceLevel}</span>
                  </div>
                  <div className="text-[11px] text-zinc-400">{c.nameEn}</div>
                  <div className="text-[10px] text-zinc-500 truncate pt-1 border-t border-white/5">
                    ID: {c.passportNumber} • {c.keyFingerprint.slice(0, 24)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'legal_sovereign_mapping':
        const legalMappings = [
          {
            sec: 'มาตรา 9 (Sec 9)',
            title: 'Electronic Signature Validity',
            layer: 'Identity Layer (Sovereign Identity Seal)',
            tech: 'Merkle Leaf Signatures + Dilithium-5',
            color: 'text-blue-400',
            bg: 'bg-blue-500/10 border-blue-500/20',
          },
          {
            sec: 'มาตรา 26 (Sec 26)',
            title: 'Reliable Digital Signatures',
            layer: 'Cryptographic Layer (Zero-Trust Fabric)',
            tech: 'Cryogenic Merkle Core & Kyber-1024 / qOps Invariant',
            color: 'text-cyan-400',
            bg: 'bg-cyan-500/10 border-cyan-500/20',
          },
          {
            sec: 'มาตรา 28 (Sec 28)',
            title: 'Signatory Legal Accountability',
            layer: 'Responsibility Layer (Executive Passport)',
            tech: 'Passport #EP-SOVEREIGN-01 (นายยุทธภูมิ พากเพียร)',
            color: 'text-amber-400',
            bg: 'bg-amber-500/10 border-amber-500/20',
          },
        ];

        return (
          <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div>
                <span className="text-zinc-200 font-bold">Thai Electronic Transactions Act ↔ Sovereign Chain Flow</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">Statute Section 9, 26, 28 → Sovereign Architecture Layer → Cryptographic Enforcement</p>
              </div>
              <span className="text-cyan-400 text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 font-bold">
                ETDA COMPLIANT
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {legalMappings.map((m, i) => (
                <div key={i} className={`p-3 rounded-xl border ${m.bg} space-y-2`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${m.color}`}>{m.sec}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-zinc-300">Tier {i + 1}</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="text-zinc-300 font-medium">{m.title}</div>
                    <div className="text-violet-300 font-mono text-[10px]">↳ {m.layer}</div>
                    <div className="text-emerald-400 text-[10px] pt-1 border-t border-white/5 font-mono">
                      ✓ {m.tech}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Certified under Sovereign Principal: {SYSTEM_METADATA.sovereignPrincipal}</span>
              </span>
              <button
                onClick={() => onNavigate('settings')}
                className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors"
              >
                <span>Full Interactive Matrix</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        );

      case 'zero_trust_vectors':
        const sampleVectors = [
          { id: 'TST-ADV-1', name: 'Telemetry -> Canonical Truth Mutation', defense: 'Fail-Closed Isolated Buffer', status: 'SIM-BLOCKED' },
          { id: 'TST-ADV-2', name: 'Forecast -> SSoT Drift Injection', defense: '0.00% Baseline Inviolability', status: 'SIM-BLOCKED' },
          { id: 'TST-ADV-5', name: 'Direct Privilege Escalation (Ω1001+)', defense: 'Executive Passport Veto Gate', status: 'SIM-BLOCKED' },
        ];

        return (
          <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-zinc-200 font-bold">Adversarial Vector Interdiction</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">Authority Boundary Ω601–Ω1000 Defense Shield</p>
              </div>
              <button
                onClick={runZeroTrustScan}
                disabled={isShieldScanning}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all ${
                  isShieldScanning
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                    : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isShieldScanning ? 'animate-spin' : ''}`} />
                <span>{isShieldScanning ? 'Scanning...' : 'Verify Shield'}</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {sampleVectors.map((v) => (
                <div key={v.id} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-zinc-200 font-medium">{v.name}</span>
                    <span className="text-[10px] text-zinc-500 block">Defense: {v.defense}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 text-[10px] font-bold">
                    {v.status}
                  </span>
                </div>
              ))}
            </div>

            {shieldScanResult && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] animate-in fade-in">
                {shieldScanResult}
              </div>
            )}
          </div>
        );

      case 'global_nodes_mesh':
        const nodes = [
          { id: 'bkk', code: 'ASEAN-BK01', location: 'Bangkok Sovereign Node', ping: '1.2ms', throughput: '4.2 GB/s', role: 'Master' },
          { id: 'sin', code: 'ASEAN-SG01', location: 'Singapore Quantum Grid', ping: '14.8ms', throughput: '3.1 GB/s', role: 'Edge' },
          { id: 'tyo', code: 'APAC-TY01', location: 'Tokyo Vector Codex Node', ping: '42.1ms', throughput: '2.8 GB/s', role: 'Edge' },
        ];

        return (
          <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-zinc-200 font-bold">Regional OTLP Node Mesh</span>
              <span className="text-cyan-400 text-[11px]">100% Synced</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {nodes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    playTone(500, 0.04);
                    setSelectedRegion(n.id);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1 ${
                    selectedRegion === n.id
                      ? 'bg-blue-950/40 border-blue-400/50 text-white shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                      : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-200">{n.code}</span>
                    <span className="text-[9px] text-cyan-300 font-semibold">{n.ping}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">{n.location}</div>
                  <div className="text-[10px] text-emerald-400/90">{n.throughput}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'citadel_3d':
        return (
          <div className="relative w-full h-[320px] rounded-2xl bg-black/40 border border-white/5 overflow-hidden flex items-center justify-center">
            <CitadelCanvas speedMultiplier={1.2} highlightColor="#06B6D4" />
          </div>
        );

      case 'topology_view':
        return (
          <div className="relative w-full h-[320px] rounded-2xl bg-black/40 border border-white/5 overflow-hidden flex items-center justify-center">
            <TopologyCanvas />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 sm:p-8 rounded-[28px] bg-gradient-to-b from-[#0c1022]/90 via-[#0a0d1c]/80 to-[#070914]/90 border border-cyan-500/20 backdrop-blur-2xl space-y-6 shadow-[0_0_50px_-15px_rgba(6,182,212,0.15)] relative overflow-hidden group">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Unified Header & Controls */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/8 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <Layout className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-mono font-bold text-white uppercase tracking-wider">
                Pinned Widgets Dashboard
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono font-bold shadow-[0_0_12px_rgba(6,182,212,0.25)]">
                {pinnedWidgets.length} Active Modules
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              Drag-and-drop to reorder live sub-panels from across all 12 views into a unified executive workspace.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              playTone(600, 0.04);
              setShowCatalogModal(!showCatalogModal);
            }}
            className="px-3.5 py-2 rounded-2xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-200 font-mono text-xs font-semibold flex items-center gap-2 transition-all shadow-[0_0_12px_rgba(6,182,212,0.1)] hover:shadow-[0_0_16px_rgba(6,182,212,0.2)]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Customize Sub-Panels</span>
          </button>
          
          <button
            onClick={resetDefaultWidgets}
            className="px-3 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            title="Reset to default pinned layout"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Widget Catalog Drawer / Selector Modal */}
      {showCatalogModal && (
        <div className="p-5 rounded-[24px] bg-[#0c0f1c]/95 border border-cyan-500/30 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Pin className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
                Cross-View Sub-Panel Catalog ({ALL_AVAILABLE_WIDGETS.length} Available)
              </span>
            </div>

            {/* Search and Category Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search sub-panels..."
                  className="px-3 py-1.5 pl-8 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 transition-colors w-full sm:w-auto"
                />
                <Layout className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2 pointer-events-none" />
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      playTone(550, 0.03);
                      setFilterCategory(cat as any);
                    }}
                    className={`px-2.5 py-1 text-[10px] font-mono rounded-lg transition-all ${
                      filterCategory === cat
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                        : 'bg-white/5 text-zinc-400 hover:text-zinc-200 border border-transparent hover:bg-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {filteredCatalog.map((widget) => {
              const isPinned = pinnedWidgets.includes(widget.id);
              return (
                <div
                  key={widget.id}
                  onClick={() => togglePinWidget(widget.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 relative group overflow-hidden ${
                    isPinned
                      ? 'bg-cyan-950/30 border-cyan-500/40 shadow-[0_0_15px_-3px_rgba(6,182,212,0.15)]'
                      : 'bg-black/40 border-white/8 hover:border-white/20 hover:bg-white/[0.04]'
                  }`}
                >
                  {!isPinned && (
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}

                  <div className="relative z-10 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-xl border ${isPinned ? 'bg-cyan-500/20 border-cyan-500/30' : 'bg-white/5 border-white/10'}`}>{widget.icon}</div>
                      <div>
                        <div className="text-xs font-mono font-bold text-zinc-100">{widget.title}</div>
                        <span className="text-[10px] font-mono text-cyan-400/80">{widget.badge}</span>
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border shrink-0 transition-all ${
                        isPinned
                          ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                          : 'bg-white/5 text-zinc-500 border-white/10'
                      }`}
                    >
                      {isPinned ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Plus className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                  <p className="relative z-10 text-[11px] text-zinc-400 font-sans leading-relaxed">{widget.subtitle}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pinned Widgets List with Drag & Drop */}
      <div className="relative z-10 space-y-6">
        {pinnedWidgets.length === 0 ? (
          <div className="h-48 rounded-[24px] border border-dashed border-cyan-500/30 flex flex-col items-center justify-center text-center p-6 text-zinc-500 space-y-3 font-mono bg-cyan-950/10">
            <PinOff className="w-8 h-8 text-cyan-600/50 animate-pulse" />
            <p className="text-xs text-zinc-400">No sub-panels currently pinned to the workspace.</p>
            <button
              onClick={() => {
                playTone(600, 0.04);
                setShowCatalogModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold hover:bg-cyan-500/25 transition-all shadow-sm"
            >
              Open Catalog to Add Sub-Panels
            </button>
          </div>
        ) : (
          pinnedWidgets.map((widgetId, index) => {
            const meta = ALL_AVAILABLE_WIDGETS.find((w) => w.id === widgetId);
            if (!meta) return null;
            const isCollapsed = !!collapsedWidgets[widgetId];
            const isExpanded = !!expandedWidgets[widgetId];
            const isDragOver = dragOverWidgetId === widgetId;

            return (
              <div
                key={widgetId}
                draggable
                onDragStart={(e) => handleDragStart(e, widgetId)}
                onDragOver={(e) => handleDragOver(e, widgetId)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, widgetId)}
                onDragEnd={handleDragEnd}
                className={`rounded-[24px] bg-[#090b16]/95 border backdrop-blur-xl transition-all duration-200 overflow-hidden shadow-2xl relative ${
                  isDragOver
                    ? 'border-cyan-400 ring-2 ring-cyan-500/30 scale-[1.005]'
                    : 'border-white/10 hover:border-white/20 hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.05)]'
                }`}
              >
                {/* Header with Drag Handle & Control Actions */}
                <div className="relative z-10 p-4 sm:p-5 bg-gradient-to-r from-white/[0.04] to-transparent border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
                  <div className="flex items-center gap-3">
                    {/* Drag Handle */}
                    <div
                      className="cursor-grab active:cursor-grabbing p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-cyan-300 transition-colors"
                      title="Drag and drop to reorder panel"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 shadow-inner">
                      {meta.icon}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">{meta.title}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/10 font-medium">
                          {meta.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-sans mt-0.5 hidden sm:block">
                        {meta.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Panel Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                    <button
                      onClick={() => moveWidget(widgetId, 'up')}
                      disabled={index === 0}
                      className={`p-1.5 rounded-lg border transition-all ${
                        index === 0
                          ? 'opacity-20 text-zinc-600 border-transparent cursor-not-allowed'
                          : 'text-zinc-400 hover:text-cyan-300 hover:bg-cyan-500/10 border-white/5 hover:border-cyan-500/20'
                      }`}
                      title="Move Up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => moveWidget(widgetId, 'down')}
                      disabled={index === pinnedWidgets.length - 1}
                      className={`p-1.5 rounded-lg border transition-all ${
                        index === pinnedWidgets.length - 1
                          ? 'opacity-20 text-zinc-600 border-transparent cursor-not-allowed'
                          : 'text-zinc-400 hover:text-cyan-300 hover:bg-cyan-500/10 border-white/5 hover:border-cyan-500/20'
                      }`}
                      title="Move Down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => toggleCollapse(widgetId)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/20 transition-all"
                      title={isCollapsed ? 'Expand Panel' : 'Collapse Panel'}
                    >
                      {isCollapsed ? <Eye className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => {
                        playTone(550, 0.04);
                        onNavigate(meta.sourceView);
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 hover:border-cyan-500/40 transition-all flex items-center gap-1.5 shadow-sm ml-1"
                      title={`Navigate to full ${meta.sourceView} view`}
                    >
                      <span className="font-semibold tracking-wide">OPEN</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => togglePinWidget(widgetId)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all ml-1"
                      title="Unpin sub-panel from workspace"
                    >
                      <PinOff className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sub-Panel Body Content */}
                {!isCollapsed && <div className="relative z-10 p-4 sm:p-6 bg-black/40">{renderWidgetContent(widgetId)}</div>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
