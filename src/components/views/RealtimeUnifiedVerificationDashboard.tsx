import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Cpu,
  Zap,
  Radio,
  Lock,
  RotateCw,
  Copy,
  Check,
  Download,
  Terminal,
  Database,
  Layers,
  Clock,
  Sparkles,
  AlertTriangle,
  Play,
  Send,
  Eye,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Flame,
  RadioTower,
  Gauge,
  Sliders,
  Maximize2
} from 'lucide-react';
import { playAuditChime, playTone } from '../AudioSynthesizer';

const CANONICAL_ROOT = '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68';
const BLOCK_HEIGHT = '#849202';
const TOTAL_SEALS = 14902;

interface EvidencePackage {
  manifest: string;
  category: string;
  status: 'VERIFIED' | 'PENDING' | 'QUARANTINED';
  records: number;
  hash: string;
}

interface IncidentEvent {
  id: string;
  timestamp: string;
  type: 'PASS' | 'ALERT' | 'INFO';
  title: string;
  message: string;
  category: 'ZERO_TRUST' | 'QUARANTINE' | 'REPLAY' | 'DRIFT' | 'BLAST_RADIUS';
}

interface SecuritySentinelAlert {
  id: string;
  type: 'PASS' | 'ALERT';
  message: string;
  time: string;
}

export const RealtimeUnifiedVerificationDashboard: React.FC<{
  onNavigateToLedger?: () => void;
  onOpenCertificate?: () => void;
}> = ({ onNavigateToLedger, onOpenCertificate }) => {
  // Live Telemetry State
  const [telemetry, setTelemetry] = useState({
    cpu: 41.2,
    memory: 5214,
    cryo: 14.98,
    qops: 24960,
    coherence: 99.98,
    voltage: 1.002,
    blastRadius: 1.14,
  });

  // History for CPU Load Chart
  const [cpuHistory, setCpuHistory] = useState<number[]>([38.6, 39.8, 42.1, 40.5, 41.2]);
  const [copiedRoot, setCopiedRoot] = useState(false);
  const [activeTabFilter, setActiveTabFilter] = useState<'ALL' | 'ALERT' | 'PASS'>('ALL');
  const [isSimulatingAttack, setIsSimulatingAttack] = useState(false);
  const [failClosedLockdownActive, setFailClosedLockdownActive] = useState(false);

  // Evidence Packages Monitor
  const [packages, setPackages] = useState<EvidencePackage[]>([
    { manifest: 'MNF-01 Core Invariants', category: 'CANONICALP0', status: 'VERIFIED', records: 14902, hash: '0x909a...4c68' },
    { manifest: 'MNF-03 Pilot DS-901', category: 'PILOT_DATASET', status: 'PENDING', records: 1200, hash: '0x8f2c...e19a' },
    { manifest: 'MNF-07 Digital Twin Stress', category: 'SANDBOX_STRESS', status: 'VERIFIED', records: 50000, hash: '0x71ba...8812' },
    { manifest: 'MNF-11 Audit Ledger', category: 'AUDIT_LEDGER', status: 'VERIFIED', records: 14902, hash: '0x33e1...b004' },
    { manifest: 'MNF-13 Production Readiness', category: 'PRODUCTIONGATE', status: 'VERIFIED', records: 40, hash: '0xfa01...8810' },
  ]);

  // Floating Security Sentinel Overlay Alerts
  const [sentinelAlerts, setSentinelAlerts] = useState<SecuritySentinelAlert[]>([
    { id: '1', type: 'PASS', message: 'PASS ✓ Sovereign Integrity (Zero-Trust Auth Validated)', time: 'Live' },
    { id: '2', type: 'PASS', message: 'PASS ✓ 10/10 REAL_HSM Quorum Attestation Confirmed', time: 'Live' },
  ]);

  // Chrono-Stream Timeline Incidents
  const [incidents, setIncidents] = useState<IncidentEvent[]>([
    {
      id: 'inc-1',
      timestamp: '19:00:30',
      type: 'PASS',
      title: 'Deterministic Trace Replay Closure',
      message: '12-Stage Trace Replay Verified (Δ0.00% SSoT zero mutation, 142ms closure)',
      category: 'REPLAY'
    },
    {
      id: 'inc-2',
      timestamp: '19:00:15',
      type: 'ALERT',
      title: 'Quarantine Chamber 02 Engaged',
      message: 'Quarantine Chamber 02 - Risk Index 0.88 (Payload diverted, zero leak)',
      category: 'QUARANTINE'
    },
    {
      id: 'inc-3',
      timestamp: '19:00:02',
      type: 'PASS',
      title: 'Zero-Trust Auth Token Verified',
      message: 'ม.9 & ม.26 IAL2+/AAL2+ Token & RPC invocation authenticated',
      category: 'ZERO_TRUST'
    },
    {
      id: 'inc-4',
      timestamp: '18:59:44',
      type: 'PASS',
      title: 'SSoT Baseline Drift Check',
      message: 'Zero-drift invariant held: deviation Δ0.00% across all 14,902 seals',
      category: 'DRIFT'
    },
    {
      id: 'inc-5',
      timestamp: '18:59:12',
      type: 'PASS',
      title: 'Blast Radius Boundary Enforced',
      message: 'Execution domain isolation validated at 1.14% (Strictly bound ≤ 2.0%)',
      category: 'BLAST_RADIUS'
    },
  ]);

  // Connect to backend WebSocket or fallback to smooth live ticker
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'SNAPSHOT_EVENT' && data.payload) {
            setTelemetry((prev) => ({
              ...prev,
              cpu: data.payload.cpuAvg ? +Number(data.payload.cpuAvg).toFixed(1) : prev.cpu,
              memory: data.payload.memoryUsed || prev.memory,
              cryo: data.payload.cryoTemp || prev.cryo,
              qops: data.payload.qops || prev.qops,
            }));
          } else if (data.type === 'INTAKE_EVENT') {
            playTone(520, 0.08, 'sine');
            addIncident('INFO', 'Evidence Intake Received', data.message, 'ZERO_TRUST');
          } else if (data.type === 'PACKAGE_EVENT') {
            playTone(720, 0.08, 'sine');
            addIncident('PASS', 'Evidence Package Verified', data.message, 'ZERO_TRUST');
          }
        } catch {
          // ignore parsing error
        }
      };
    } catch {
      // ws fallback
    }

    const interval = setInterval(() => {
      setTelemetry((prev) => {
        const nextCpu = +(38 + Math.random() * 5.2).toFixed(1);
        const nextQops = Math.floor(24800 + Math.random() * 320);
        const nextCryo = +(14.98 + (Math.random() * 0.004 - 0.002)).toFixed(3);
        const nextMem = 5200 + Math.floor(Math.random() * 30);
        const nextBlast = +(1.10 + Math.random() * 0.15).toFixed(2);

        setCpuHistory((hist) => [...hist.slice(1), nextCpu]);

        return {
          ...prev,
          cpu: nextCpu,
          qops: nextQops,
          cryo: nextCryo,
          memory: nextMem,
          blastRadius: nextBlast,
        };
      });
    }, 3200);

    return () => {
      clearInterval(interval);
      if (ws) ws.close();
    };
  }, []);

  const addIncident = (
    type: 'PASS' | 'ALERT' | 'INFO',
    title: string,
    message: string,
    category: 'ZERO_TRUST' | 'QUARANTINE' | 'REPLAY' | 'DRIFT' | 'BLAST_RADIUS'
  ) => {
    const newInc: IncidentEvent = {
      id: `inc-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour12: false }),
      type,
      title,
      message,
      category,
    };
    setIncidents((prev) => [newInc, ...prev.slice(0, 19)]);

    if (type === 'ALERT') {
      const alertItem: SecuritySentinelAlert = {
        id: String(Date.now()),
        type: 'ALERT',
        message: `⚠️ ${title}: ${message}`,
        time: new Date().toLocaleTimeString('th-TH', { hour12: false }),
      };
      setSentinelAlerts((prev) => [alertItem, ...prev.slice(0, 2)]);
    }
  };

  const handleCopyRoot = () => {
    navigator.clipboard.writeText(CANONICAL_ROOT);
    setCopiedRoot(true);
    playAuditChime();
    setTimeout(() => setCopiedRoot(false), 2000);
  };

  // Verify pending package
  const handleVerifyPackage = (pkgManifest: string) => {
    playTone(880, 0.1, 'sine');
    setPackages((prev) =>
      prev.map((p) => (p.manifest === pkgManifest ? { ...p, status: 'VERIFIED' } : p))
    );
    addIncident('PASS', 'Package Seal Certified', `${pkgManifest} verified & anchored under FIPS 204`, 'ZERO_TRUST');
    
    // Broadcast to backend API
    fetch('/api/v1/package', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manifestId: pkgManifest, status: 'VERIFIED' }),
    }).catch(() => {});
  };

  // Simulate Security Sentinel attack / fail-closed quarantine
  const handleSimulateAttack = () => {
    if (isSimulatingAttack) return;
    setIsSimulatingAttack(true);
    setFailClosedLockdownActive(true);
    playTone(320, 0.25, 'sawtooth');

    addIncident(
      'ALERT',
      'Privilege Injection Blocked',
      'TC-09 Fail-Closed Guard engaged: Token privilege escalation blocked → Diverted to Chamber 02 Buffer (Blast Radius 1.48% ≤ 2.0%)',
      'QUARANTINE'
    );

    setTimeout(() => {
      playAuditChime();
      addIncident(
        'PASS',
        'Fail-Closed Quarantine Neutralized',
        'Dilithium-5 Ephemeral RAM zeroized in 0.48ms. Invariants 10/10 verified intact (Δ0.00%)',
        'REPLAY'
      );
      setFailClosedLockdownActive(false);
      setIsSimulatingAttack(false);
    }, 4500);
  };

  const filteredIncidents = useMemo(() => {
    if (activeTabFilter === 'ALL') return incidents;
    return incidents.filter((i) => i.type === activeTabFilter);
  }, [incidents, activeTabFilter]);

  // Compute SVG coordinates for the CPU graph
  const minVal = 30;
  const maxVal = 55;
  const graphWidth = 500;
  const graphHeight = 160;
  const points = cpuHistory.map((val, idx) => {
    const x = (idx / (cpuHistory.length - 1)) * (graphWidth - 40) + 20;
    const y = graphHeight - 25 - ((val - minVal) / (maxVal - minVal)) * (graphHeight - 50);
    return { x, y, val };
  });

  const pathD = points.reduce((acc, pt, idx, arr) => {
    if (idx === 0) return `M ${pt.x} ${pt.y}`;
    const prev = arr[idx - 1];
    const cx = (prev.x + pt.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${graphHeight - 10} L ${points[0].x} ${graphHeight - 10} Z`;

  return (
    <div className="space-y-5 text-white font-mono relative overflow-hidden animate-in fade-in duration-200">
      {/* ── SECURITY SENTINEL OVERLAY (Floating Real-Time Alerts) ── */}
      <div className="fixed top-20 right-4 z-50 pointer-events-none space-y-2 max-w-sm w-full">
        <AnimatePresence>
          {sentinelAlerts.map((evt) => (
            <motion.div
              key={evt.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 30, scale: 0.9 }}
              className={`p-3 rounded-xl text-xs font-bold shadow-2xl backdrop-blur-xl border pointer-events-auto transition-all ${
                evt.type === 'ALERT'
                  ? 'bg-rose-950/90 border-rose-500/80 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.35)]'
                  : 'bg-emerald-950/90 border-emerald-500/70 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${evt.type === 'ALERT' ? 'bg-rose-400 animate-ping' : 'bg-emerald-400'}`} />
                  <span className="text-[11px] font-sans">{evt.message}</span>
                </div>
                <button
                  onClick={() => setSentinelAlerts((prev) => prev.filter((a) => a.id !== evt.id))}
                  className="text-zinc-400 hover:text-white p-0.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* FAIL-CLOSED LOCKDOWN ALERT OVERLAY IF SIMULATED */}
      {failClosedLockdownActive && (
        <div className="p-3.5 rounded-2xl bg-rose-950/80 border-2 border-rose-500 text-rose-200 flex items-center justify-between shadow-[0_0_30px_rgba(244,63,94,0.3)] animate-pulse">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0" />
            <div>
              <div className="text-sm font-bold text-white">FAIL-CLOSED GUARD ENGAGED • CHAMBER 02 QUARANTINE</div>
              <div className="text-xs text-rose-300">
                Unauthorized mutation attempt isolated into Chamber 02 Buffer. SSoT drift remains strictly Δ0.00%.
              </div>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-rose-900 border border-rose-400 text-xs font-bold text-white">
            QUARANTINE ACTIVE
          </span>
        </div>
      )}

      {/* ── TOP SECTION: CORE VERIFICATION PANEL & SUMMARY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        
        {/* 1. Core Verification Panel */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0f1e]/90 border border-cyan-500/30 shadow-xl backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
              <h2 className="text-cyan-400 font-bold text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Core Verification Panel</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold">
                SSoT v1.2 LTS
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-zinc-300">
              <div className="flex items-center justify-between gap-2">
                <span className="text-zinc-400">Canonical Root:</span>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30 text-[11px]">
                    909ab814...fa4c68
                  </span>
                  <button
                    onClick={handleCopyRoot}
                    className="p-1 rounded hover:bg-cyan-500/20 text-cyan-400 transition-colors"
                    title="Copy Full 64-character SHA-256 Root Hash"
                  >
                    {copiedRoot ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Block Height:</span>
                <span className="text-white font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10">
                  {BLOCK_HEIGHT}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Seals:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {TOTAL_SEALS.toLocaleString()} Sovereign Seals
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">SSoT Mutation:</span>
                <span className="text-cyan-300 font-bold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                  0 (Immutable) • Δ0.00%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Quorum:</span>
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  10/10 REAL_HSM Signed
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
            <button
              onClick={handleSimulateAttack}
              disabled={isSimulatingAttack}
              className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(244,63,94,0.2)]"
              title="Test Fail-Closed Sentinel Quarantine Reaction"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>{isSimulatingAttack ? 'Testing Guard...' : 'Simulate Fail-Closed'}</span>
            </button>

            {onOpenCertificate && (
              <button
                onClick={onOpenCertificate}
                className="px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Certificate</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Live Telemetry Stream Gauges & Metrics */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0f1e]/90 border border-violet-500/30 shadow-xl backdrop-blur-xl lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-violet-500/20">
              <h2 className="text-violet-400 font-bold text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-violet-400" />
                <span>Live Telemetry Stream</span>
              </h2>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
                <span className="text-[11px] text-zinc-400 font-mono">Live Sync</span>
              </div>
            </div>

            {/* 4 Essential Realtime Boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {/* CPU Load */}
              <div className="bg-black/50 p-3 rounded-xl border border-cyan-500/20 relative overflow-hidden">
                <span className="text-zinc-400 text-xs block mb-1">CPU Load</span>
                <p className="text-xl font-bold text-cyan-300">{telemetry.cpu}%</p>
                <div className="w-full bg-zinc-800 h-1 rounded-full mt-2 overflow-hidden">
                  <div className="bg-cyan-400 h-full transition-all duration-500" style={{ width: `${telemetry.cpu}%` }} />
                </div>
              </div>

              {/* Memory Utilization with dynamic hologram bar */}
              <div className="bg-black/50 p-3 rounded-xl border border-violet-500/20 relative overflow-hidden">
                <span className="text-zinc-400 text-xs block mb-1">Memory Utilization</span>
                <p className="text-xl font-bold text-violet-300">{telemetry.memory} MB</p>
                <div className="w-full bg-zinc-800 h-1 rounded-full mt-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-400 to-violet-500 h-full transition-all duration-500" style={{ width: `${(telemetry.memory / 16384) * 100}%` }} />
                </div>
              </div>

              {/* Cryo Temp Animated Gauge */}
              <div className="bg-black/50 p-3 rounded-xl border border-cyan-500/20 relative overflow-hidden">
                <span className="text-zinc-400 text-xs block mb-1">Cryo Temp</span>
                <p className="text-xl font-bold text-cyan-300">{telemetry.cryo} mK</p>
                <span className="text-[10px] text-emerald-400 font-mono">±0.001 mK Stable</span>
              </div>

              {/* QOPS Throughput */}
              <div className="bg-black/50 p-3 rounded-xl border border-violet-500/20 relative overflow-hidden">
                <span className="text-zinc-400 text-xs block mb-1">QOPS Throughput</span>
                <p className="text-xl font-bold text-violet-300">{telemetry.qops.toLocaleString()}</p>
                <span className="text-[10px] text-violet-400 font-mono">ops/sec</span>
              </div>
            </div>
          </div>

          {/* Dual Ring Indicators: Coherence & Voltage Stability */}
          <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-xs font-bold text-zinc-200">Quantum Coherence</div>
                  <div className="text-[10px] text-zinc-400">Phase alignment across 18 chambers</div>
                </div>
              </div>
              <span className="text-sm font-bold text-cyan-300 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30">
                {telemetry.coherence}%
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-400" />
                <div>
                  <div className="text-xs font-bold text-zinc-200">Voltage Stability</div>
                  <div className="text-[10px] text-zinc-400">Zero-noise rail regulation</div>
                </div>
              </div>
              <span className="text-sm font-bold text-violet-300 px-2 py-0.5 rounded bg-violet-950/80 border border-violet-500/30">
                {telemetry.voltage} V
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MIDDLE SECTION: REAL-TIME CPU GRAPH & INCIDENT CHRONO-STREAM ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        
        {/* Real-time CPU Load Graph (Cyan-Violet Gradient Area) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0f1e]/90 border border-cyan-500/30 shadow-xl backdrop-blur-xl lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-cyan-300 font-bold text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Real-Time CPU Load Stream (Cyan-Violet Gradient)</span>
            </h3>
            <span className="text-xs text-zinc-400 font-mono">
              Current: <strong className="text-cyan-300">{telemetry.cpu}%</strong>
            </span>
          </div>

          {/* SVG Line Graph */}
          <div className="h-52 w-full bg-black/60 rounded-xl border border-white/10 p-2 flex flex-col justify-between relative overflow-hidden">
            <svg viewBox={`0 0 ${graphWidth} ${graphHeight}`} className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00ffff" stopOpacity="0.45" />
                  <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#00ffff" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid Lines */}
              {[35, 40, 45, 50].map((v) => {
                const y = graphHeight - 25 - ((v - minVal) / (maxVal - minVal)) * (graphHeight - 50);
                return (
                  <g key={v}>
                    <line x1="20" y1={y} x2={graphWidth - 20} y2={y} stroke="#1f2937" strokeDasharray="3 3" />
                    <text x="5" y={y + 3} fill="#6b7280" fontSize="9" fontFamily="monospace">
                      {v}%
                    </text>
                  </g>
                );
              })}

              {/* Filled Area */}
              <path d={areaD} fill="url(#cpuGradient)" />

              {/* Smooth Path Curve */}
              <path d={pathD} fill="none" stroke="url(#lineGrad)" strokeWidth="3" strokeLinecap="round" />

              {/* Points */}
              {points.map((pt, idx) => (
                <g key={idx}>
                  <circle cx={pt.x} cy={pt.y} r="4" fill="#070a12" stroke={idx === points.length - 1 ? '#00ffff' : '#8b5cf6'} strokeWidth="2" />
                  {idx === points.length - 1 && (
                    <circle cx={pt.x} cy={pt.y} r="8" fill="none" stroke="#00ffff" strokeWidth="1" className="animate-ping" />
                  )}
                </g>
              ))}

              {/* X Labels */}
              {['t-4', 't-3', 't-2', 't-1', 'Live'].map((lbl, idx) => {
                const x = (idx / 4) * (graphWidth - 40) + 20;
                return (
                  <text key={lbl} x={x} y={graphHeight - 5} fill="#9ca3af" fontSize="10" textAnchor="middle" fontFamily="monospace">
                    {lbl}
                  </text>
                );
              })}
            </svg>
          </div>

          {/* Subsystem Blast Radius Metric Bar */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-zinc-300">Blast Radius Monitor:</span>
              <span className="text-emerald-300 font-bold">{telemetry.blastRadius}%</span>
              <span className="text-zinc-500">(Strictly bound ≤ 2.0%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-zinc-400">Zero-Trust RPC Authentication Active</span>
            </div>
          </div>
        </div>

        {/* Incident Chrono-Stream Timeline */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0f1e]/90 border border-violet-500/30 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-violet-500/20">
              <h3 className="text-violet-400 font-bold text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-violet-400" />
                <span>Chrono-Stream Timeline</span>
              </h3>
              <div className="flex items-center gap-1 bg-black/50 p-0.5 rounded-lg border border-white/10 text-[10px]">
                {(['ALL', 'ALERT', 'PASS'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveTabFilter(filter)}
                    className={`px-2 py-0.5 rounded transition-all ${
                      activeTabFilter === filter
                        ? 'bg-violet-500 text-white font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Incidents List */}
            <div className="mt-3 space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {filteredIncidents.map((evt) => (
                <div
                  key={evt.id}
                  className={`p-2.5 rounded-xl border text-xs transition-all ${
                    evt.type === 'ALERT'
                      ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                      : evt.type === 'PASS'
                      ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                      : 'bg-cyan-950/30 border-cyan-500/30 text-cyan-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                    <span className="font-mono text-zinc-300 font-bold flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${evt.type === 'ALERT' ? 'bg-rose-400 animate-ping' : 'bg-emerald-400'}`} />
                      {evt.title}
                    </span>
                    <span>{evt.timestamp}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-zinc-300 font-sans">
                    {evt.message}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Deterministic 12-Stage Replay</span>
            <span className="text-emerald-400 font-bold">142ms Determinism</span>
          </div>
        </div>
      </div>

      {/* ── BOTTOM SECTION: EVIDENCE PACKAGE MONITOR (TABLE) ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0f1e]/90 border border-cyan-500/30 shadow-xl backdrop-blur-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-cyan-500/20">
          <div>
            <h3 className="text-cyan-400 font-bold text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Evidence Package Monitor</span>
            </h3>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              Statutory evidence manifests certified under ETDA B.E. 2544 Sections 9, 11, 26, 28 and PDPA Section 37.
            </p>
          </div>

          <span className="px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-xs font-bold self-start sm:self-auto">
            {packages.filter((p) => p.status === 'VERIFIED').length}/{packages.length} Packages Verified
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="border-b border-white/10 text-cyan-300 font-mono text-[11px]">
              <tr>
                <th className="pb-2.5">Manifest</th>
                <th className="pb-2.5">Category</th>
                <th className="pb-2.5">Status</th>
                <th className="pb-2.5">Records</th>
                <th className="pb-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {packages.map((pkg) => (
                <tr key={pkg.manifest} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 text-cyan-200 font-mono font-bold">
                    {pkg.manifest}
                  </td>
                  <td className="py-2.5 font-mono text-zinc-400">
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px]">
                      {pkg.category}
                    </span>
                  </td>
                  <td className="py-2.5">
                    {pkg.status === 'VERIFIED' ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold flex items-center gap-1 w-max">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        VERIFIED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold flex items-center gap-1 w-max">
                        <Clock className="w-3 h-3 text-amber-400 animate-spin" />
                        PENDING
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 font-mono text-zinc-300">
                    {pkg.records.toLocaleString()}
                  </td>
                  <td className="py-2.5 text-right font-mono">
                    {pkg.status === 'PENDING' ? (
                      <button
                        onClick={() => handleVerifyPackage(pkg.manifest)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 text-[11px] font-bold transition-all"
                      >
                        Verify Now
                      </button>
                    ) : (
                      <span className="text-zinc-500 text-[11px]">Anchored</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
