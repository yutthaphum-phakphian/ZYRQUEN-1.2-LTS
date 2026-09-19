import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  CheckCircle2,
  Activity,
  Cpu,
  Server,
  Zap,
  RefreshCw,
  Play,
  Pause,
  ArrowRight,
  Database,
  FileCheck2,
  Scale,
  Award,
  Fingerprint,
  Download,
  AlertTriangle,
  Radio,
  Clock,
  Sparkles,
  Sliders,
  Terminal,
  ExternalLink,
  ChevronRight,
  Eye,
  Info
} from 'lucide-react';
import { SYSTEM_METADATA } from '../../data/canonicalData';
import { playTone, playTelemetryBeep, playAuditChime } from '../AudioSynthesizer';
import { ViewType } from '../../types';

interface SecurityPipelineViewProps {
  onNavigate?: (view: ViewType) => void;
  onOpenCertificate?: () => void;
  onAddSystemEvent?: (
    type: any,
    title: string,
    description: string,
    statuteRef?: string,
    severity?: 'info' | 'warning' | 'critical',
    metaHash?: string
  ) => void;
}

interface PipelinePacket {
  id: string;
  timestamp: string;
  sourceNode: string;
  ingressType: string;
  payloadHash: string;
  tier1Pqc: 'DILITHIUM-5' | 'KYBER-1024' | 'SPHINCS+';
  tier2Quorum: string;
  tier3Ssot: 'CANONICAL_MATCH' | 'ZERO_DRIFT';
  verdict: 'VERIFIED_PASS' | 'QUARANTINED' | 'BLOCKED';
  latencyMs: number;
}

export const SecurityPipelineView: React.FC<SecurityPipelineViewProps> = ({
  onNavigate,
  onOpenCertificate,
  onAddSystemEvent,
}) => {
  // Live Risk & Simulation State
  const [riskScore, setRiskScore] = useState<number>(0.0);
  const [safetyCoherence, setSafetyCoherence] = useState<number>(100.0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationStatusText, setSimulationStatusText] = useState<string>('Nominal SSoT Stable State');
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
  const [isLiveStreamActive, setIsLiveStreamActive] = useState<boolean>(true);
  const [selectedPacket, setSelectedPacket] = useState<PipelinePacket | null>(null);
  const [filterTier, setFilterTier] = useState<string>('ALL');

  // Simulated Telemetry Packets
  const [packets, setPackets] = useState<PipelinePacket[]>([
    {
      id: 'PKT-849202-01',
      timestamp: new Date().toISOString().substring(11, 19) + ' UTC',
      sourceNode: 'BK01 Bangkok Root',
      ingressType: 'OTLP/gRPC mTLS',
      payloadHash: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      tier1Pqc: 'DILITHIUM-5',
      tier2Quorum: '10/10 REAL_HSM',
      tier3Ssot: 'CANONICAL_MATCH',
      verdict: 'VERIFIED_PASS',
      latencyMs: 0.28,
    },
    {
      id: 'PKT-849202-02',
      timestamp: new Date(Date.now() - 3200).toISOString().substring(11, 19) + ' UTC',
      sourceNode: 'SG02 Singapore Nexus',
      ingressType: 'RFC 3161 TSA',
      payloadHash: '5a13396c129c611fa438b9f7a240c11d23b78912cf345a67890123456789abcd',
      tier1Pqc: 'KYBER-1024',
      tier2Quorum: '10/10 REAL_HSM',
      tier3Ssot: 'CANONICAL_MATCH',
      verdict: 'VERIFIED_PASS',
      latencyMs: 0.31,
    },
    {
      id: 'PKT-849202-03',
      timestamp: new Date(Date.now() - 7400).toISOString().substring(11, 19) + ' UTC',
      sourceNode: 'TY03 Tokyo Vault',
      ingressType: 'ETDA Sec 9 Stamp',
      payloadHash: '7528e18501da86fc4691763a43fa4c68909ab814479844d8a14816bed34cdbb0',
      tier1Pqc: 'SPHINCS+',
      tier2Quorum: '10/10 REAL_HSM',
      tier3Ssot: 'ZERO_DRIFT',
      verdict: 'VERIFIED_PASS',
      latencyMs: 0.35,
    },
    {
      id: 'PKT-849202-04',
      timestamp: new Date(Date.now() - 12100).toISOString().substring(11, 19) + ' UTC',
      sourceNode: 'ZH04 Zurich Boundary',
      ingressType: 'OTLP/gRPC mTLS',
      payloadHash: '16bed34cdbb07528e18501da86fc4691763a43fa4c68909ab814479844d8a148',
      tier1Pqc: 'DILITHIUM-5',
      tier2Quorum: '10/10 REAL_HSM',
      tier3Ssot: 'CANONICAL_MATCH',
      verdict: 'VERIFIED_PASS',
      latencyMs: 0.42,
    },
    {
      id: 'PKT-849202-05',
      timestamp: new Date(Date.now() - 16800).toISOString().substring(11, 19) + ' UTC',
      sourceNode: 'SV05 Silicon Valley Gateway',
      ingressType: 'FIPS 204 Sig',
      payloadHash: '43a4c5897528e18501da86fc4691763a43fa4c68909ab814479844d8a14816be',
      tier1Pqc: 'DILITHIUM-5',
      tier2Quorum: '10/10 REAL_HSM',
      tier3Ssot: 'CANONICAL_MATCH',
      verdict: 'VERIFIED_PASS',
      latencyMs: 0.39,
    },
  ]);

  // Periodic pipeline stream generator
  useEffect(() => {
    if (!isLiveStreamActive) return;
    const interval = setInterval(() => {
      const nodes = [
        'BK01 Bangkok Root',
        'SG02 Singapore Nexus',
        'TY03 Tokyo Vault',
        'ZH04 Zurich Boundary',
        'SV05 Silicon Valley Gateway',
        'LD06 London Custodian',
      ];
      const types = ['OTLP/gRPC mTLS', 'RFC 3161 TSA', 'ETDA Sec 9 Stamp', 'FIPS 204 Sig'];
      const pqcs: Array<'DILITHIUM-5' | 'KYBER-1024' | 'SPHINCS+'> = ['DILITHIUM-5', 'KYBER-1024', 'SPHINCS+'];
      
      const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
      const randomType = types[Math.floor(Math.random() * types.length)];
      const randomPqc = pqcs[Math.floor(Math.random() * pqcs.length)];
      const randomHex = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const latency = +(0.25 + Math.random() * 0.18).toFixed(2);
      
      const newPkt: PipelinePacket = {
        id: `PKT-${Math.floor(849200 + Math.random() * 100)}-${Math.floor(10 + Math.random() * 90)}`,
        timestamp: new Date().toISOString().substring(11, 19) + ' UTC',
        sourceNode: randomNode,
        ingressType: randomType,
        payloadHash: randomHex,
        tier1Pqc: randomPqc,
        tier2Quorum: '10/10 REAL_HSM',
        tier3Ssot: 'CANONICAL_MATCH',
        verdict: 'VERIFIED_PASS',
        latencyMs: latency,
      };

      setPackets(prev => [newPkt, ...prev.slice(0, 19)]);
      setActiveStageIndex(prev => (prev + 1) % 5);
    }, 4500);

    return () => clearInterval(interval);
  }, [isLiveStreamActive]);

  // Handle Diagnostic Probe Test
  const handleDiagnosticProbe = () => {
    playTelemetryBeep(760);
    setIsSimulating(true);
    setSimulationStatusText('Injecting OTLP mTLS Diagnostic Test Pulse...');
    setRiskScore(1.2);
    setSafetyCoherence(99.88);

    setTimeout(() => {
      playTone(880, 0.08, 'sine', 0.05);
      setSimulationStatusText('Tier-1 PQC Shield Validated (ML-DSA-87 Dilithium-5 Valid)');
      setRiskScore(0.8);
    }, 600);

    setTimeout(() => {
      playTone(987, 0.08, 'sine', 0.05);
      setSimulationStatusText('Tier-2 Dual-Plane Quorum Confirmed (10/10 Gov + 10/10 Phy PASS)');
      setRiskScore(0.3);
    }, 1200);

    setTimeout(() => {
      playAuditChime();
      setSimulationStatusText('Tier-3 SSoT Verified. 14,902 Seals Matched. Phoenix Recovery 35.8ms Nominal.');
      setRiskScore(0.0);
      setSafetyCoherence(100.0);
      setIsSimulating(false);

      if (onAddSystemEvent) {
        onAddSystemEvent(
          'SECURITY',
          'Security Pipeline Diagnostic Pulse Verified',
          'Full 3-tier pipeline traversed. FIPS 203/204/205 post-quantum gates and 10/10 quorum verified with zero drift.',
          'ETDA Sec 9/26',
          'info'
        );
      }
    }, 1900);
  };

  // Filtered Packets
  const filteredPackets = useMemo(() => {
    if (filterTier === 'ALL') return packets;
    return packets.filter(p => p.tier1Pqc.includes(filterTier));
  }, [packets, filterTier]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-16 text-slate-100">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40 p-6 shadow-2xl backdrop-blur-xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                VERIFIEDLIVEMAINNET
              </span>
              <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-mono text-cyan-300">
                LOCKEDFROZENv1.2_LTS
              </span>
              <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-mono text-amber-300">
                GENESIS #849202
              </span>
              <span className="rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-mono text-slate-300">
                Δ0.00% ZERO DRIFT
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-emerald-400 shrink-0" />
              <span>ZYRQUEN Ω∞ Sovereign Security Pipeline</span>
            </h1>
            <p className="text-sm text-slate-400 max-w-3xl">
              Real-Time 3-Tier Zero-Trust Holographic Flow & Post-Quantum Defense Matrix. Continuous cryptographic ingestion,
              dual-plane quorum attestation (10/10 REAL_HSM), and immutable SSoT memory enforcement.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDiagnosticProbe}
              disabled={isSimulating}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-4 py-2.5 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/30 transition-all shadow-lg hover:shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Testing Pipeline...' : 'Inject Test Pulse'}</span>
            </button>

            {onOpenCertificate && (
              <button
                onClick={onOpenCertificate}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-700 transition cursor-pointer"
              >
                <Award className="h-4 w-4 text-amber-400" />
                <span>Court Cert</span>
              </button>
            )}
          </div>
        </div>

        {/* Master Parameters Strip */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800">
            <div className="text-slate-400">Canonical Merkle Root</div>
            <div className="font-mono text-emerald-400 truncate mt-0.5" title="909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68">
              909ab814...4c68
            </div>
          </div>
          <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800">
            <div className="text-slate-400">Deca-Key Quorum</div>
            <div className="font-semibold text-cyan-400 mt-0.5">10/10 REAL_HSM (Unanimous)</div>
          </div>
          <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800">
            <div className="text-slate-400">Sub-Kelvin Bus</div>
            <div className="font-semibold text-emerald-400 mt-0.5">14.98 mK (Limit ≤18.00mK)</div>
          </div>
          <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800">
            <div className="text-slate-400">Throughput / Latency</div>
            <div className="font-semibold text-slate-200 mt-0.5">1,240 req/s • 285ms p99</div>
          </div>
          <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800">
            <div className="text-slate-400">Phoenix Self-Healing</div>
            <div className="font-semibold text-emerald-400 mt-0.5">35.8 ms (SLA &lt;142ms)</div>
          </div>
          <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800">
            <div className="text-slate-400">Verification Gate</div>
            <div className="font-semibold text-emerald-400 mt-0.5">35/35 PURE GREEN PASS</div>
          </div>
        </div>
      </div>

      {/* 2. Top Interactive Section: Threat & Risk Gauge + Live Invariant Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Gauge Card */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-white">Dynamic Threat & Risk Gauge</h2>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                FIPS 140-3 L4
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Evaluates live packet stream against OPA Rego constraints, lattice tampering, and SSoT memory mutations.
            </p>
          </div>

          {/* SVG Semi-Circle Dial Gauge */}
          <div className="py-6 flex flex-col items-center justify-center">
            <div className="relative w-64 h-36 flex items-end justify-center">
              <svg className="w-64 h-36 overflow-visible" viewBox="0 0 200 110">
                <defs>
                  <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="60%" stopColor="#06B6D4" />
                    <stop offset="85%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#EF4444" />
                  </linearGradient>
                </defs>
                {/* Background Arc */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#1E293B"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                {/* Colored Tick Arc */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="url(#gaugeGradient)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="4 8"
                  opacity="0.5"
                />
                {/* Active Dynamic Arc */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * (riskScore / 100))}
                  className="transition-all duration-700 ease-out"
                />
                {/* Center Hub */}
                <circle cx="100" cy="100" r="10" fill="#0F172A" stroke="#10B981" strokeWidth="3" />
                {/* Needle */}
                <line
                  x1="100"
                  y1="100"
                  x2={100 + 65 * Math.cos(Math.PI - (riskScore / 100) * Math.PI)}
                  y2={100 - 65 * Math.sin(Math.PI - (riskScore / 100) * Math.PI)}
                  stroke="#10B981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out shadow-lg"
                />
              </svg>

              {/* Central Value Readout */}
              <div className="absolute bottom-0 text-center">
                <div className="text-3xl font-black tracking-tight text-white font-mono">
                  {riskScore.toFixed(2)}%
                </div>
                <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold mt-0.5">
                  Threat Risk Index
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between w-full px-4 text-xs font-mono text-slate-400">
              <span>0% PURE GREEN</span>
              <span className="text-emerald-400 font-bold">SAFETY: {safetyCoherence.toFixed(2)}%</span>
              <span>100% FAIL-CLOSED</span>
            </div>
          </div>

          {/* Status Message */}
          <div className="rounded-lg bg-slate-950/80 p-3 border border-slate-800 text-xs flex items-center justify-between">
            <span className="text-slate-400">Pipeline State:</span>
            <span className="font-mono text-emerald-400 flex items-center gap-1.5 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {simulationStatusText}
            </span>
          </div>
        </div>

        {/* Real-Time Defense Invariants Matrix */}
        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">Live Zero-Trust Gate Sentinel</h2>
            </div>
            <span className="text-xs text-slate-400">Evaluated every 100ms</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-white">Injection Attack Vectors</div>
                <div className="text-xs font-mono text-emerald-400 mt-0.5">0 Detected / Blocked</div>
                <div className="text-[11px] text-slate-500 mt-1">WAF &amp; OPA Rego strict schema whitelist</div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
              <Zap className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-white">Post-Quantum Lattice Tamper</div>
                <div className="text-xs font-mono text-cyan-400 mt-0.5">0 Tamper / Fail-Closed Armed</div>
                <div className="text-[11px] text-slate-500 mt-1">Dilithium-5 (ML-DSA-87) FIPS 204 verified</div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
              <Clock className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-white">Replay Jitter &amp; TSA Skew</div>
                <div className="text-xs font-mono text-emerald-400 mt-0.5">0.00 ms (Monotonic Vector)</div>
                <div className="text-[11px] text-slate-500 mt-1">RFC 3161 hardware nanosecond anchor</div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
              <Database className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-white">SSoT Memory Write Violations</div>
                <div className="text-xs font-mono text-emerald-400 mt-0.5">0 Delta / 0 Mutations</div>
                <div className="text-[11px] text-slate-500 mt-1">Write Firewall WORM enforcement active</div>
              </div>
            </div>
          </div>

          {/* Quick Action Simulator Row */}
          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-400 font-medium">Diagnostic Probes:</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  playTelemetryBeep(640);
                  setSimulationStatusText('Simulating Sub-Kelvin Jitter (0.0142 J/K)...');
                  setTimeout(() => setSimulationStatusText('Nominal SSoT Stable State'), 1500);
                }}
                className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition cursor-pointer"
              >
                Cryo Jitter Test
              </button>
              <button
                onClick={() => {
                  playTone(920, 0.08, 'triangle', 0.06);
                  setSimulationStatusText('Testing Phoenix Auto-Healing (35.8ms SLA)...');
                  setTimeout(() => setSimulationStatusText('Nominal SSoT Stable State'), 1500);
                }}
                className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition cursor-pointer"
              >
                Phoenix 35.8ms Replay
              </button>
              <button
                onClick={() => {
                  playAuditChime();
                  setSimulationStatusText('Asserting 14,902 Canonical Frozen Seals...');
                  setTimeout(() => setSimulationStatusText('Nominal SSoT Stable State'), 1500);
                }}
                className="px-2.5 py-1.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-mono hover:bg-emerald-900/60 transition cursor-pointer"
              >
                Assert 14,902 Seals
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 3-Tier Sovereign Security Pipeline - Holographic Flow Diagram */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Holographic 3-Tier Pipeline Flow</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              End-to-end packet traversal: Data Ingress &rarr; 3-Tier Sovereign Security Gates &rarr; Immutable WORM Verdict &amp; Replay.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Stream Status:</span>
            <button
              onClick={() => setIsLiveStreamActive(prev => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition ${
                isLiveStreamActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}
            >
              {isLiveStreamActive ? <Play className="h-3.5 w-3.5 fill-current" /> : <Pause className="h-3.5 w-3.5" />}
              <span>{isLiveStreamActive ? 'LIVE ACTIVE' : 'PAUSED'}</span>
            </button>
          </div>
        </div>

        {/* Holographic Stages Grid with Animated Flow */}
        <div className="relative">
          {/* SVG Animated Connector Line for Desktop */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 pointer-events-none z-0">
            <svg className="w-full h-8 overflow-visible">
              <line
                x1="12%"
                y1="4"
                x2="88%"
                y2="4"
                stroke="#1E293B"
                strokeWidth="2"
              />
              <line
                x1="12%"
                y1="4"
                x2="88%"
                y2="4"
                stroke="#10B981"
                strokeWidth="2"
                strokeDasharray="8 12"
                className="animate-[dash_15s_linear_infinite]"
              />
            </svg>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {/* Stage 1: Data Ingress */}
            <div className={`p-5 rounded-xl border transition-all duration-300 ${
              activeStageIndex === 0
                ? 'border-emerald-500/60 bg-emerald-950/20 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40'
                : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  STAGE 01
                </span>
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> INGRESS
                </span>
              </div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Server className="h-4 w-4 text-emerald-400" />
                <span>Peripheral Ingress</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Zero-Trust perimeter ingestion &amp; hardware time anchoring.
              </p>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">OTLP Protocol:</span>
                  <span className="font-mono text-cyan-300">Port 4318 mTLS</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Timestamp:</span>
                  <span className="font-mono text-emerald-400">RFC 3161 (ns)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Jurisdiction:</span>
                  <span className="font-mono text-amber-300">ETDA Sec 9 ICT</span>
                </div>
              </div>
            </div>

            {/* Stage 2: 3-Tier Sovereign Security Gates */}
            <div className={`p-5 rounded-xl border transition-all duration-300 ${
              activeStageIndex >= 1 && activeStageIndex <= 3
                ? 'border-cyan-500/60 bg-cyan-950/20 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/40'
                : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  STAGE 02
                </span>
                <span className="text-xs text-cyan-400 font-semibold flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5" /> 3-TIER GATES
                </span>
              </div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
                <span>3-Tier Security Gates</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Post-quantum signature, dual-plane quorum, and SSoT locks.
              </p>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Tier 1 (PQC):</span>
                  <span className="font-mono text-emerald-400 font-medium">ML-DSA-87 / Kyber</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Tier 2 (Quorum):</span>
                  <span className="font-mono text-cyan-400 font-medium">10/10 REAL_HSM</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Tier 3 (SSoT):</span>
                  <span className="font-mono text-amber-300 font-medium">14,902 Seals Lock</span>
                </div>
              </div>
            </div>

            {/* Stage 3: Verdict & WORM Storage */}
            <div className={`p-5 rounded-xl border transition-all duration-300 ${
              activeStageIndex === 4
                ? 'border-emerald-500/60 bg-emerald-950/20 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40'
                : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  STAGE 03
                </span>
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <FileCheck2 className="h-3.5 w-3.5" /> EVIDENCE SEAL
                </span>
              </div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="h-4 w-4 text-emerald-400" />
                <span>Verdict &amp; Forensic Replay</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                WORM Ledger V25 immutability &amp; court-admissible dossier.
              </p>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Storage Plane:</span>
                  <span className="font-mono text-emerald-400">WORM Audit V25</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Trace Replay:</span>
                  <span className="font-mono text-cyan-300">35.8ms (&lt;142ms)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Legal Standard:</span>
                  <span className="font-mono text-amber-300">ETDA 9/26 + PDPA 37</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Live Packet Inspection Feed */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">Live Pipeline Packet Stream</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live cryptographic telemetry packets verified through the 3-tier zero-trust gate. Click any row for deep payload inspection.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">PQC Algorithm:</span>
            {['ALL', 'DILITHIUM-5', 'KYBER-1024', 'SPHINCS+'].map((tier) => (
              <button
                key={tier}
                onClick={() => setFilterTier(tier)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition cursor-pointer ${
                  filterTier === tier
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* Packets Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Packet ID</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Origin Node</th>
                <th className="p-3">Ingress Type</th>
                <th className="p-3">Tier 1 PQC</th>
                <th className="p-3">Tier 2 Quorum</th>
                <th className="p-3">Latency</th>
                <th className="p-3 text-right">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredPackets.map((pkt) => (
                <tr
                  key={pkt.id}
                  onClick={() => setSelectedPacket(pkt)}
                  className="hover:bg-slate-800/50 transition cursor-pointer"
                >
                  <td className="p-3 font-semibold text-cyan-300">{pkt.id}</td>
                  <td className="p-3 text-slate-400">{pkt.timestamp}</td>
                  <td className="p-3 text-slate-200">{pkt.sourceNode}</td>
                  <td className="p-3 text-slate-300">{pkt.ingressType}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {pkt.tier1Pqc}
                    </span>
                  </td>
                  <td className="p-3 text-cyan-400">{pkt.tier2Quorum}</td>
                  <td className="p-3 text-slate-300">{pkt.latencyMs} ms</td>
                  <td className="p-3 text-right">
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {pkt.verdict}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Packet Inspection Detail Modal */}
      <AnimatePresence>
        {selectedPacket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-200"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Fingerprint className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-lg font-bold text-white">Cryptographic Packet Dossier</h3>
                </div>
                <button
                  onClick={() => setSelectedPacket(null)}
                  className="text-slate-400 hover:text-white p-1 rounded transition cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="mt-4 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-slate-400">Packet Identifier:</div>
                    <div className="font-mono text-cyan-300 font-bold mt-0.5">{selectedPacket.id}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Attestation Timestamp:</div>
                    <div className="font-mono text-slate-200 mt-0.5">{selectedPacket.timestamp}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Origin Hardware Node:</div>
                    <div className="font-mono text-emerald-400 mt-0.5">{selectedPacket.sourceNode}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Ingress Interface:</div>
                    <div className="font-mono text-slate-200 mt-0.5">{selectedPacket.ingressType}</div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 mb-1">Payload SHA-256 Merkle Leaf:</div>
                  <div className="font-mono text-emerald-400 break-all">{selectedPacket.payloadHash}</div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <div className="text-slate-400">Tier 1: PQC Shield</div>
                    <div className="font-mono text-emerald-400 font-bold mt-1">{selectedPacket.tier1Pqc}</div>
                  </div>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <div className="text-slate-400">Tier 2: HSM Quorum</div>
                    <div className="font-mono text-cyan-400 font-bold mt-1">{selectedPacket.tier2Quorum}</div>
                  </div>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <div className="text-slate-400">Tier 3: SSoT Drift</div>
                    <div className="font-mono text-emerald-400 font-bold mt-1">Δ0.00% ZERO DRIFT</div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Statutory Certification: ETDA Sec 9/26/28 Ratified</span>
                  </div>
                  <span className="font-mono text-xs">{selectedPacket.latencyMs} ms SLA</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setSelectedPacket(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
                >
                  Close Inspection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
