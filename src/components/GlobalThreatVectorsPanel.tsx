import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  Globe,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Activity,
  AlertTriangle,
  Radio,
  RefreshCw,
  Filter,
  Lock,
  Layers,
  Sparkles,
  CheckCircle2,
  Sliders,
  Compass,
} from 'lucide-react';
import { playTone, playAuditChime } from './AudioSynthesizer';
import { SYSTEM_METADATA } from '../data/canonicalData';
import { SystemEvent } from './SystemEventsSidebar';

export interface ThreatIncident {
  id: string;
  region: string;
  regionCode: 'APAC' | 'EMEA' | 'AMER' | 'POLAR' | 'ORBIT';
  flag: string;
  vectorType: string;
  targetChamber: string;
  severity: 'CRITICAL' | 'HIGH' | 'ELEVATED';
  timestamp: string;
  latencyMs: number;
  mitigation: string;
  signatureVerification: string;
}

interface GlobalThreatVectorsPanelProps {
  onAddSystemEvent?: (
    type: SystemEvent['type'],
    title: string,
    description: string,
    metaHash?: string,
    severity?: SystemEvent['severity'],
    statuteRef?: string,
    targetView?: SystemEvent['targetView']
  ) => void;
}

export const GlobalThreatVectorsPanel: React.FC<GlobalThreatVectorsPanelProps> = ({
  onAddSystemEvent,
}) => {
  const [chartMode, setChartMode] = useState<'area' | 'bar' | 'radar'>('area');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [isSimulatingWave, setIsSimulatingWave] = useState<boolean>(false);
  const [totalBreachAttempts, setTotalBreachAttempts] = useState<number>(14892);
  const [neutralizedCount, setNeutralizedCount] = useState<number>(14892);
  const [liveAttackRate, setLiveAttackRate] = useState<number>(4.2);

  // Time series dataset for breach attempts across 5 regions (12 time slices)
  const [timelineData, setTimelineData] = useState([
    { time: '01:00', apac: 42, emea: 31, americas: 38, polar: 4, orbital: 2, total: 117 },
    { time: '01:05', apac: 46, emea: 29, americas: 41, polar: 3, orbital: 1, total: 120 },
    { time: '01:10', apac: 52, emea: 34, americas: 45, polar: 5, orbital: 3, total: 139 },
    { time: '01:15', apac: 39, emea: 38, americas: 36, polar: 2, orbital: 2, total: 117 },
    { time: '01:20', apac: 61, emea: 44, americas: 50, polar: 6, orbital: 4, total: 165 },
    { time: '01:25', apac: 48, emea: 36, americas: 42, polar: 4, orbital: 2, total: 132 },
    { time: '01:30', apac: 55, emea: 40, americas: 47, polar: 3, orbital: 3, total: 148 },
    { time: '01:35', apac: 64, emea: 48, americas: 53, polar: 7, orbital: 5, total: 177 },
    { time: '01:40', apac: 58, emea: 42, americas: 49, polar: 5, orbital: 2, total: 156 },
    { time: '01:45', apac: 62, emea: 45, americas: 51, polar: 4, orbital: 4, total: 166 },
    { time: '01:50', apac: 70, emea: 52, americas: 59, polar: 8, orbital: 6, total: 195 },
    { time: '01:55', apac: 59, emea: 43, americas: 48, polar: 5, orbital: 3, total: 158 },
  ]);

  // Regional breakdown by vector category
  const regionalVectorData = [
    {
      category: 'Quantum Shor Probe',
      apac: 84,
      emea: 62,
      americas: 75,
      polar: 12,
      orbital: 8,
      defense: 'FIPS 203 ML-KEM-1024',
    },
    {
      category: '0-Day Memory Injection',
      apac: 110,
      emea: 78,
      americas: 92,
      polar: 6,
      orbital: 4,
      defense: 'Fail-Closed Buffer Isolator',
    },
    {
      category: 'SSoT State Drift Forgery',
      apac: 95,
      emea: 71,
      americas: 84,
      polar: 9,
      orbital: 5,
      defense: '0.00% Baseline Inviolability',
    },
    {
      category: 'Side-Channel Cryo Analysis',
      apac: 48,
      emea: 35,
      americas: 42,
      polar: 18,
      orbital: 14,
      defense: 'Sub-Kelvin Thermal Cloak',
    },
    {
      category: 'BGP Hijack & Mesh Poisoning',
      apac: 72,
      emea: 54,
      americas: 68,
      polar: 4,
      orbital: 11,
      defense: 'Post-Quantum Sovereign Node Mesh',
    },
  ];

  // Radar chart data for attack surface vector intensity
  const radarData = [
    { vector: 'Quantum Cryptanalysis', apac: 88, emea: 65, americas: 78, fullMark: 100 },
    { vector: 'Memory Bus Tampering', apac: 94, emea: 72, americas: 86, fullMark: 100 },
    { vector: 'Ledger Mutation Attempt', apac: 98, emea: 80, americas: 91, fullMark: 100 },
    { vector: 'Cryo Thermal Infiltration', apac: 55, emea: 40, americas: 48, fullMark: 100 },
    { vector: 'Routing Mesh Spoofing', apac: 74, emea: 60, americas: 70, fullMark: 100 },
  ];

  // Live intercepted attack incidents
  const [incidents, setIncidents] = useState<ThreatIncident[]>([
    {
      id: 'ATK-2026-8492',
      region: 'Asia-Pacific (Bangkok Sovereign Enclave)',
      regionCode: 'APAC',
      flag: '🇹🇭',
      vectorType: 'Zero-Day Memory Bus Injection',
      targetChamber: 'Chamber 04: Memory Fabric Bus',
      severity: 'CRITICAL',
      timestamp: '01:55:42 ICT',
      latencyMs: 0.28,
      mitigation: 'FAIL_CLOSED_BUFFER_ISOLATION',
      signatureVerification: 'NIST ML-DSA-87 REJECTED',
    },
    {
      id: 'ATK-2026-8491',
      region: 'EMEA (Frankfurt PQC Airgap Gateway)',
      regionCode: 'EMEA',
      flag: '🇩🇪',
      vectorType: 'Quantum Shor Algorithm Pre-Image Search',
      targetChamber: 'Chamber 11: HSM Quantum Seal Ledger',
      severity: 'CRITICAL',
      timestamp: '01:55:31 ICT',
      latencyMs: 0.34,
      mitigation: 'POST_QUANTUM_LATTICE_DEFENSE',
      signatureVerification: 'SPHINCS+ PROOF INTACT',
    },
    {
      id: 'ATK-2026-8490',
      region: 'Americas (Ashburn Secure Node)',
      regionCode: 'AMER',
      flag: '🇺🇸',
      vectorType: 'SSoT Drift Forgery & Seal Override',
      targetChamber: 'Chamber 00: Sovereign Core Engine',
      severity: 'HIGH',
      timestamp: '01:55:18 ICT',
      latencyMs: 0.21,
      mitigation: 'READ_ONLY_SSOT_HARD_INTERCEPT',
      signatureVerification: '0.00% DRIFT CERTIFIED',
    },
    {
      id: 'ATK-2026-8489',
      region: 'Polar Deep Vault (Svalbard Cold Enclave)',
      regionCode: 'POLAR',
      flag: '🇳🇴',
      vectorType: 'Cryostat Thermal Noise Power Probing',
      targetChamber: 'Chamber 17: Sub-Kelvin Dilution Unit',
      severity: 'ELEVATED',
      timestamp: '01:54:55 ICT',
      latencyMs: 0.42,
      mitigation: 'SUBLATENT_CRYOTHERMIC_SHREDDER',
      signatureVerification: '12.4 mK LOCKED',
    },
    {
      id: 'ATK-2026-8488',
      region: 'Orbital LEO Relay (Quantum Satellite Mesh #4)',
      regionCode: 'ORBIT',
      flag: '🛰️',
      vectorType: 'Optical Entanglement Laser Perturbation',
      targetChamber: 'Chamber 08: Global Quantum Mesh',
      severity: 'HIGH',
      timestamp: '01:54:30 ICT',
      latencyMs: 0.19,
      mitigation: 'ENTANGLEMENT_DECOHERENCE_CIRCUIT',
      signatureVerification: '0.9997 COHERENCE PRESERVED',
    },
  ]);

  // Real-time background simulation tick every 2.8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      // Small organic drift in attack rate
      setLiveAttackRate((prev) => {
        const drift = (Math.random() - 0.48) * 0.8;
        return Math.max(1.5, Math.min(12.0, Math.round((prev + drift) * 10) / 10));
      });

      // Increment counters
      const newAttempts = Math.floor(Math.random() * 3) + 1;
      setTotalBreachAttempts((prev) => prev + newAttempts);
      setNeutralizedCount((prev) => prev + newAttempts);

      // Organic pulse in timeline data
      setTimelineData((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        const apacDelta = Math.floor(Math.random() * 5) - 2;
        const emeaDelta = Math.floor(Math.random() * 4) - 2;
        const amerDelta = Math.floor(Math.random() * 4) - 2;

        const nextApac = Math.max(25, last.apac + apacDelta);
        const nextEmea = Math.max(20, last.emea + emeaDelta);
        const nextAmer = Math.max(25, last.americas + amerDelta);

        updated[updated.length - 1] = {
          ...last,
          apac: nextApac,
          emea: nextEmea,
          americas: nextAmer,
          total: nextApac + nextEmea + nextAmer + last.polar + last.orbital,
        };
        return updated;
      });
    }, 2800);

    return () => clearInterval(timer);
  }, []);

  const handleSimulateAttackWave = () => {
    setIsSimulatingWave(true);
    playTone(320, 0.1, 'sawtooth', 0.08);
    setTimeout(() => playTone(240, 0.15, 'sawtooth', 0.1), 100);

    const waveBurst = 148;
    setTotalBreachAttempts((prev) => prev + waveBurst);
    setNeutralizedCount((prev) => prev + waveBurst);
    setLiveAttackRate(28.6);

    // Add immediate high-severity incidents across regions
    const nowTime = new Date().toLocaleTimeString('en-GB', { hour12: false }) + ' ICT';
    const waveIncidents: ThreatIncident[] = [
      {
        id: `ATK-${Date.now().toString().slice(-4)}`,
        region: 'Global Coordinated Assault Wave (5 Regions Synchronized)',
        regionCode: 'APAC',
        flag: '⚡',
        vectorType: 'Multi-Vector Distributed Quantum & Memory Flood',
        targetChamber: 'All 18 Chambers (Chamber 00 - Chamber 17)',
        severity: 'CRITICAL',
        timestamp: nowTime,
        latencyMs: 0.18,
        mitigation: 'GLOBAL_FAIL_CLOSED_QUARANTINE_ENGAGED',
        signatureVerification: 'SSoT Δ0 INVIOLABLE (14,902 SEALS PRESERVED)',
      },
    ];

    setIncidents((prev) => [waveIncidents[0], ...prev.slice(0, 7)]);

    if (onAddSystemEvent) {
      onAddSystemEvent(
        'SECURITY',
        'Global Coordinated Threat Wave Intercepted',
        `Intercepted ${waveBurst} simultaneous breach attempts across 5 geographic regions. All 18 chambers defended with 100.00% fail-closed isolation.`,
        SYSTEM_METADATA.merkleRoot,
        'critical',
        'Fail-Closed SSoT Invariant (Temp < 85°C, BW > 15 GB/s)',
        'security'
      );
    }

    setTimeout(() => {
      setIsSimulatingWave(false);
      playAuditChime();
      setLiveAttackRate(5.4);
    }, 1600);
  };

  // Filtered incidents based on selectedRegion
  const filteredIncidents = useMemo(() => {
    if (selectedRegion === 'ALL') return incidents;
    return incidents.filter((inc) => inc.regionCode === selectedRegion);
  }, [incidents, selectedRegion]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-mono">
      {/* Top Banner & Operational Status */}
      <div className="p-6 sm:p-7 rounded-[28px] bg-gradient-to-br from-[#0c0e1e]/95 via-[#07080f]/95 to-[#0b1022]/95 border border-rose-500/25 shadow-[0_10px_50px_-10px_rgba(244,63,94,0.15)] backdrop-blur-3xl relative overflow-hidden group">
        <div className="absolute top-0 right-1/4 w-96 h-64 bg-rose-500/8 rounded-full blur-[85px] pointer-events-none transition-opacity opacity-60 group-hover:opacity-100" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] sm:text-xs font-bold tracking-wider flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                GLOBAL THREAT MATRIX • REAL-TIME
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] sm:text-xs font-bold tracking-wider shadow-sm">
                100.00% FAIL-CLOSED INTERCEPTED
              </span>
              <span className="px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] sm:text-xs font-bold tracking-wider shadow-sm">
                5 GEOGRAPHIC REGIONS MONITORED
              </span>
            </div>

            <h2 className="text-xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-rose-100 to-rose-300">
              Global Threat Vectors & Breach Attempt Telemetry
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-3xl leading-relaxed font-sans">
              ระบบตรวจสอบและตรวจจับความพยายามบุกรุกความปลอดภัยระดับโลกแบบเรียลไทม์ ผ่านเครือข่ายอธิปไตยดิจิทัล 5 ภูมิภาค ทุกการโจมตีจะถูกกักกันด้วยระบบ Fail-Closed ทันทีโดยปราศจากการเปลี่ยนแปลงข้อมูล (Mutation = 0)
            </p>
          </div>

          {/* Action Trigger Button */}
          <div className="relative z-10 flex items-center gap-3 self-start xl:self-center shrink-0">
            <button
              onClick={handleSimulateAttackWave}
              disabled={isSimulatingWave}
              className={`px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all shadow-lg ${
                isSimulatingWave
                  ? 'bg-rose-600/40 text-rose-200 border border-rose-500 animate-pulse cursor-not-allowed'
                  : 'bg-gradient-to-r from-rose-600/30 via-red-600/25 to-rose-600/30 hover:from-rose-600/40 hover:to-rose-600/40 text-rose-100 border border-rose-500/40 hover:border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.25)]'
              }`}
              title="Simulate a coordinated multi-region DDoS and cryptographic attack wave"
            >
              <Zap className={`w-4 h-4 ${isSimulatingWave ? 'text-white animate-spin' : 'text-rose-300'}`} />
              <span>{isSimulatingWave ? 'Intercepting Wave...' : 'Simulate Attack Wave'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Executive Metric Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0b0e1e]/80 border border-white/8 backdrop-blur-xl space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>TOTAL ATTEMPTS</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {totalBreachAttempts.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% Intercepted (0 Breaches)</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0b0e1e]/80 border border-white/8 backdrop-blur-xl space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>LIVE ATTACK RATE</span>
            <Activity className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div className="text-2xl font-bold text-amber-300 tracking-tight">
            {liveAttackRate} <span className="text-xs text-zinc-400 font-normal">atk/sec</span>
          </div>
          <div className="text-[11px] text-zinc-400">
            Peak: 28.6 atk/sec (Wave Blocked)
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0b0e1e]/80 border border-white/8 backdrop-blur-xl space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>FAIL-CLOSED ISOLATION</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300 tracking-tight">
            0.28 <span className="text-xs text-zinc-400 font-normal">ms latency</span>
          </div>
          <div className="text-[11px] text-cyan-400">
            Threshold &lt; 5.0ms (Optimal)
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0b0e1e]/80 border border-white/8 backdrop-blur-xl space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>SSoT INVARIANTS DRIFT</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-300 tracking-tight">
            0.00% <span className="text-xs text-zinc-400 font-normal">Drift</span>
          </div>
          <div className="text-[11px] text-emerald-400 font-bold">
            14,902 Seals Inviolable
          </div>
        </div>
      </div>

      {/* Main Visualization Container */}
      <div className="p-6 rounded-[28px] bg-[#090c1a]/85 border border-white/8 backdrop-blur-2xl space-y-6">
        {/* Controls Toolbar: Mode Selection & Regional Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/8 pb-4">
          {/* Chart Type Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-black/40 border border-white/8 rounded-2xl text-xs">
            <button
              onClick={() => {
                playTone(550, 0.03);
                setChartMode('area');
              }}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all font-bold ${
                chartMode === 'area'
                  ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Timeline Density (Area)</span>
            </button>

            <button
              onClick={() => {
                playTone(580, 0.03);
                setChartMode('bar');
              }}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all font-bold ${
                chartMode === 'bar'
                  ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Vector Categories (Bar)</span>
            </button>

            <button
              onClick={() => {
                playTone(610, 0.03);
                setChartMode('radar');
              }}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all font-bold ${
                chartMode === 'radar'
                  ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Vector Profiling (Radar)</span>
            </button>
          </div>

          {/* Regional Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
            <span className="text-zinc-500 text-[11px] mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Region:
            </span>
            {[
              { id: 'ALL', label: 'All Global (5)' },
              { id: 'APAC', label: '🇹🇭 APAC' },
              { id: 'EMEA', label: '🇩🇪 EMEA' },
              { id: 'AMER', label: '🇺🇸 Americas' },
              { id: 'POLAR', label: '🇳🇴 Polar' },
              { id: 'ORBIT', label: '🛰️ LEO' },
            ].map((reg) => (
              <button
                key={reg.id}
                onClick={() => {
                  playTone(520, 0.03);
                  setSelectedRegion(reg.id);
                }}
                className={`px-2.5 py-1.5 rounded-xl transition-all whitespace-nowrap text-[11px] font-bold ${
                  selectedRegion === reg.id
                    ? 'bg-white/15 text-white border border-white/20'
                    : 'text-zinc-400 hover:text-zinc-200 bg-white/5 border border-transparent'
                }`}
              >
                {reg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Chart Container */}
        <div className="w-full h-80 sm:h-96">
          {chartMode === 'area' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradApac" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradEmea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradAmer" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradPolar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradOrbit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="time" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#07080F',
                    border: '1px solid rgba(244,63,94,0.3)',
                    borderRadius: '16px',
                    fontSize: '11px',
                    color: '#e4e4e7',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                {(selectedRegion === 'ALL' || selectedRegion === 'APAC') && (
                  <Area
                    type="monotone"
                    dataKey="apac"
                    name="Asia-Pacific (🇹🇭 TH-01)"
                    stroke="#f43f5e"
                    fill="url(#gradApac)"
                    strokeWidth={2}
                  />
                )}
                {(selectedRegion === 'ALL' || selectedRegion === 'EMEA') && (
                  <Area
                    type="monotone"
                    dataKey="emea"
                    name="EMEA (🇩🇪 Frankfurt)"
                    stroke="#06b6d4"
                    fill="url(#gradEmea)"
                    strokeWidth={2}
                  />
                )}
                {(selectedRegion === 'ALL' || selectedRegion === 'AMER') && (
                  <Area
                    type="monotone"
                    dataKey="americas"
                    name="Americas (🇺🇸 Ashburn)"
                    stroke="#f59e0b"
                    fill="url(#gradAmer)"
                    strokeWidth={2}
                  />
                )}
                {(selectedRegion === 'ALL' || selectedRegion === 'POLAR') && (
                  <Area
                    type="monotone"
                    dataKey="polar"
                    name="Polar Vault (🇳🇴 Svalbard)"
                    stroke="#a855f7"
                    fill="url(#gradPolar)"
                    strokeWidth={2}
                  />
                )}
                {(selectedRegion === 'ALL' || selectedRegion === 'ORBIT') && (
                  <Area
                    type="monotone"
                    dataKey="orbital"
                    name="Orbital LEO Relay (🛰️ Satellite)"
                    stroke="#10b981"
                    fill="url(#gradOrbit)"
                    strokeWidth={2}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}

          {chartMode === 'bar' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionalVectorData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="category" stroke="#71717a" fontSize={10} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#07080F',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '16px',
                    fontSize: '11px',
                    color: '#e4e4e7',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
                {(selectedRegion === 'ALL' || selectedRegion === 'APAC') && (
                  <Bar dataKey="apac" name="APAC" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                )}
                {(selectedRegion === 'ALL' || selectedRegion === 'EMEA') && (
                  <Bar dataKey="emea" name="EMEA" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                )}
                {(selectedRegion === 'ALL' || selectedRegion === 'AMER') && (
                  <Bar dataKey="americas" name="Americas" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                )}
                {(selectedRegion === 'ALL' || selectedRegion === 'POLAR') && (
                  <Bar dataKey="polar" name="Polar" fill="#a855f7" radius={[4, 4, 0, 0]} />
                )}
                {(selectedRegion === 'ALL' || selectedRegion === 'ORBIT') && (
                  <Bar dataKey="orbital" name="Orbital" fill="#10b981" radius={[4, 4, 0, 0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          )}

          {chartMode === 'radar' && (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="vector" stroke="#a1a1aa" fontSize={10} />
                <PolarRadiusAxis stroke="#52525b" fontSize={10} />
                <Radar name="APAC" dataKey="apac" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.4} />
                <Radar name="EMEA" dataKey="emea" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
                <Radar name="Americas" dataKey="americas" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.25} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#07080F',
                    border: '1px solid rgba(244,63,94,0.3)',
                    borderRadius: '16px',
                    fontSize: '11px',
                    color: '#e4e4e7',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 5 Monitored Geographic Nodes Status Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-white/8">
          {[
            {
              code: 'APAC',
              name: 'Bangkok Sovereign Gateway',
              flag: '🇹🇭',
              status: 'ARMED • AIRGAP',
              defense: 'NIST ML-DSA-87 / SPHINCS+',
              accent: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
            },
            {
              code: 'EMEA',
              name: 'Frankfurt PQC Node',
              flag: '🇩🇪',
              status: 'ACTIVE • ZERO-TRUST',
              defense: 'FIPS 203 ML-KEM-1024',
              accent: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
            },
            {
              code: 'AMER',
              name: 'Ashburn Secure Vault',
              flag: '🇺🇸',
              status: 'ENFORCED • MUTATION=0',
              defense: 'Hardware Cryo Enclave',
              accent: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
            },
            {
              code: 'POLAR',
              name: 'Svalbard Deep Seed Vault',
              flag: '🇳🇴',
              status: 'COLD STORAGE • 12.4mK',
              defense: 'Sub-Kelvin Thermal Cloak',
              accent: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
            },
            {
              code: 'ORBIT',
              name: 'Quantum LEO Satellite #4',
              flag: '🛰️',
              status: 'ENTANGLED • 0.9997',
              defense: 'Photonic Space Mesh',
              accent: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
            },
          ].map((node) => (
            <div
              key={node.code}
              className={`p-3 rounded-2xl border ${node.accent} backdrop-blur-md space-y-1.5`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-lg">{node.flag}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/40 border border-white/10">
                  {node.code}
                </span>
              </div>
              <div className="text-xs font-bold text-white truncate">{node.name}</div>
              <div className="text-[10px] text-zinc-300">{node.status}</div>
              <div className="text-[9px] text-zinc-400 truncate">{node.defense}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-Time Neutralized Incidents Stream */}
      <div className="p-6 rounded-[28px] bg-[#090c1a]/85 border border-white/8 backdrop-blur-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Intercepted Breach Attempts Activity Stream
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold">
              LIVE BUFFER
            </span>
          </div>
          <span className="text-xs text-zinc-500">
            Filtered: {filteredIncidents.length} Events
          </span>
        </div>

        <div className="space-y-2.5">
          {filteredIncidents.map((inc) => (
            <div
              key={inc.id}
              className="p-4 rounded-2xl bg-black/40 border border-white/6 hover:border-rose-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base">{inc.flag}</span>
                  <span className="font-bold text-white">{inc.id}</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                    {inc.severity}
                  </span>
                  <span className="text-zinc-400">{inc.region}</span>
                </div>
                <div className="text-zinc-300 font-sans text-[11px]">
                  <strong>Vector:</strong> {inc.vectorType} • <strong>Target:</strong>{' '}
                  <span className="text-cyan-300">{inc.targetChamber}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right shrink-0">
                <div>
                  <div className="text-emerald-400 font-bold text-[11px] flex items-center gap-1 justify-end">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{inc.mitigation}</span>
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    Latency: {inc.latencyMs}ms • {inc.timestamp}
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[10px] text-zinc-400">
                  {inc.signatureVerification}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
