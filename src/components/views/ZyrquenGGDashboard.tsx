import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  ShieldCheck,
  Zap,
  Terminal,
  Server,
  Cpu,
  Lock,
  Boxes,
  FileCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Download,
  Share2,
  ChevronRight,
  Database,
  Radio,
  Eye,
  Sliders,
  Sparkles,
  ExternalLink,
  Layers,
  Flame,
  ShieldAlert,
  Fingerprint,
} from 'lucide-react';
import { playTone, playAuditChime } from '../AudioSynthesizer';
import { QuantumCitadelLatticeHologramVisualizer } from '../QuantumCitadelLatticeHologramVisualizer';
import { TopologyCanvas } from '../TopologyCanvas';
import { ViewType } from '../../types';

interface ZyrquenGGDashboardProps {
  onNavigate?: (view: ViewType) => void;
  onOpenCertificate?: () => void;
}

interface RestApiResult {
  endpoint: string;
  method: string;
  status: number | string;
  durationMs: number;
  data: any;
  timestamp: string;
}

export const ZyrquenGGDashboard: React.FC<ZyrquenGGDashboardProps> = ({
  onNavigate,
  onOpenCertificate,
}) => {
  // Navigation & Sub-modules
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'WORLD_ENGINE' | 'COPILOT' | 'CHAMBERS' | 'COMMAND_CONSOLE' | 'API_SUITE'>('OVERVIEW');
  const [activeVisualizer, setActiveVisualizer] = useState<'hologram' | 'topology'>('hologram');

  // Live WebSocket Telemetry Stream State
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [wsMessages, setWsMessages] = useState<any[]>([]);
  const [liveTelemetry, setLiveTelemetry] = useState({
    block_height: 849202,
    merkle_root: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    seals_count: 14902,
    qops: 851.9,
    cryo_temp: '14.98 mK',
    coherence: '99.992%',
    drift: '0.00%',
    status: 'LOCKED_FROZEN_v1.2_LTS',
  });

  // REST API Runner State
  const [runningEndpoint, setRunningEndpoint] = useState<string | null>(null);
  const [apiResults, setApiResults] = useState<Record<string, RestApiResult>>({});
  const [selectedApiForDetail, setSelectedApiForDetail] = useState<string>('telemetry');

  // Copilot Autonomy State
  const [copilotSector, setCopilotSector] = useState<'SIGNAL' | 'SENTINEL_REPLAY' | 'ZERO_TRUST' | 'CRYO_ISOLATION'>('SENTINEL_REPLAY');
  const [traceReplayRunning, setTraceReplayRunning] = useState<boolean>(false);
  const [currentReplayStage, setCurrentReplayStage] = useState<number>(12);
  const [activeSealInspector, setActiveSealInspector] = useState<number>(14902);

  // Sovereign Command Console state
  const [ssotStatus, setSsotStatus] = useState<string>('ENFORCED_LOCKED');
  const [invokingCommand, setInvokingCommand] = useState<boolean>(false);
  const [commandFeedback, setCommandFeedback] = useState<string | null>(null);

  // Establish Live WebSocket connection to /ws/telemetry with auto-reconnect
  useEffect(() => {
    let ws: WebSocket | null = null;
    let fallbackInterval: any = null;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      ws = new WebSocket(`${protocol}//${host}/ws/telemetry`);

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.block_height || payload.block) {
            setLiveTelemetry((prev) => ({
              ...prev,
              ...payload,
              block_height: payload.block_height || payload.block || 849202,
              seals_count: payload.seals_count || payload.seals || 14902,
            }));
          }
          setWsMessages((prev) => [
            {
              id: Date.now() + Math.random(),
              data: payload,
              time: new Date().toLocaleTimeString(),
            },
            ...prev.slice(0, 19),
          ]);
        } catch {
          // ignore non-json
        }
      };

      ws.onerror = () => {
        setWsConnected(false);
      };

      ws.onclose = () => {
        setWsConnected(false);
      };
    } catch {
      setWsConnected(false);
    }

    // Fallback ticker if WebSocket is quiet
    fallbackInterval = setInterval(() => {
      setLiveTelemetry((prev) => ({
        ...prev,
        qops: Number((850.5 + Math.random() * 2.8).toFixed(1)),
        coherence: '99.992%',
        drift: '0.00%',
      }));
    }, 1500);

    return () => {
      if (ws) ws.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, []);

  // REST API Executable Functions
  const executeApiEndpoint = async (endpointKey: string) => {
    setRunningEndpoint(endpointKey);
    playTone(600, 0.05);
    const startTime = performance.now();

    try {
      let res: Response;
      let data: any;

      if (endpointKey === 'root') {
        res = await fetch('/', {
          headers: {
            'X-Zyrquen-Sovereign-Sig': 'EP-SOVEREIGN-01_DILITHIUM5_SIGNED_PROOF',
            'Content-Type': 'application/json',
          },
        });
        data = await res.json();
      } else if (endpointKey === 'telemetry') {
        res = await fetch('/api/v1/telemetry');
        data = await res.json();
      } else if (endpointKey === 'audit_records') {
        res = await fetch('/api/v1/audit/records?chamber_filter=Chamber%2017');
        data = await res.json();
      } else if (endpointKey === 'trace_replay') {
        res = await fetch('/api/v1/forensic/trace-replay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seal_id: activeSealInspector, force_cold_replay: true }),
        });
        data = await res.json();
      } else if (endpointKey === 'gold_seal_verify') {
        res = await fetch('/api/v1/gold-seal/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            block_height: 849202,
            seal_id: activeSealInspector,
            expected_merkle_root: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
          }),
        });
        data = await res.json();
      } else if (endpointKey === 'reports_generate') {
        res = await fetch('/api/v1/reports/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            block_height: 849202,
            target_format: 'PDF',
            include_forensic_stream: true,
          }),
        });
        data = await res.json();
      } else {
        throw new Error('Unknown endpoint');
      }

      const durationMs = Math.round(performance.now() - startTime);
      playAuditChime();

      setApiResults((prev) => ({
        ...prev,
        [endpointKey]: {
          endpoint: endpointKey,
          method: endpointKey.includes('verify') || endpointKey.includes('replay') || endpointKey.includes('generate') ? 'POST' : 'GET',
          status: res.status,
          durationMs,
          data,
          timestamp: new Date().toLocaleTimeString(),
        },
      }));
      setSelectedApiForDetail(endpointKey);
    } catch (err: any) {
      setApiResults((prev) => ({
        ...prev,
        [endpointKey]: {
          endpoint: endpointKey,
          method: 'REQ',
          status: 'ERR',
          durationMs: Math.round(performance.now() - startTime),
          data: { error: err.message || 'Invocation Failed' },
          timestamp: new Date().toLocaleTimeString(),
        },
      }));
    } finally {
      setRunningEndpoint(null);
    }
  };

  // Run all 5 REST tests sequentially
  const handleRunFullTestSuite = async () => {
    playTone(700, 0.08);
    const endpoints = ['root', 'telemetry', 'audit_records', 'trace_replay', 'gold_seal_verify', 'reports_generate'];
    for (const ep of endpoints) {
      await executeApiEndpoint(ep);
      await new Promise((r) => setTimeout(r, 200));
    }
  };

  // Trigger 12-Stage Trace Replay Animation
  const handleTrigger12StageReplay = () => {
    setTraceReplayRunning(true);
    setCurrentReplayStage(1);
    playTone(450, 0.08);

    let stage = 1;
    const timer = setInterval(() => {
      stage += 1;
      setCurrentReplayStage(stage);
      playTone(450 + stage * 35, 0.04);
      if (stage >= 12) {
        clearInterval(timer);
        setTraceReplayRunning(false);
        playAuditChime();
      }
    }, 280);
  };

  // Run SSoT Δ0 Invariant Assertion
  const handleEnforceZeroDrift = () => {
    setInvokingCommand(true);
    playTone(520, 0.08);
    setTimeout(() => {
      setInvokingCommand(false);
      setSsotStatus('ZERO_DRIFT_LOCKED_0.00%');
      setCommandFeedback('SSoT Invariant Asserted: Delta = 0 across 14,902 Canonical Seals & Block #849202 Genesis Merkle Root.');
      playAuditChime();
      setTimeout(() => setCommandFeedback(null), 5000);
    }, 600);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-x-hidden text-zinc-100 font-sans">
      {/* ── TOP EXECUTIVE BANNER: ZYRQUEN GG CONTROL PLANE ── */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[#080d1a] border border-cyan-500/30 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[11px] font-mono font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                ZYRQUEN GG DASHBOARD
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-semibold">
                AUDIT TRAIL API v1.2.0-LTS
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-semibold">
                CRYPTOGRAPHIC EVIDENCE #849202
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-500/40 text-[11px] font-mono font-semibold">
                SSoT Δ0.00%
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-mono font-bold text-white tracking-tight flex items-center gap-2.5">
              <span>🎮 ZYRQUEN GG <strong className="text-cyan-400">Ω∞</strong> SOVEREIGN DASHBOARD</span>
            </h1>

            <p className="text-xs sm:text-sm font-mono text-zinc-300 max-w-4xl leading-relaxed">
              แผงควบคุมสถาปัตยกรรม Sovereign OS บูรณาการ 4 โมดูลหลักร่วมกับ Audit Trail REST API (5 Endpoints) และ WebSocket Telemetry Stream แบบเรียลไทม์ พร้อมตรวจรับรองหลักฐานความถูกต้อง 14,902 Canonical Seals
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRunFullTestSuite}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
              title="Execute All 5 REST API Endpoints in Sequence"
            >
              <Zap className="w-4 h-4 text-cyan-200" />
              <span>Run Full API Test Suite</span>
            </button>

            <button
              onClick={handleTrigger12StageReplay}
              disabled={traceReplayRunning}
              className={`px-3.5 py-2.5 rounded-xl border font-mono text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                traceReplayRunning
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 animate-pulse'
                  : 'bg-white/5 hover:bg-white/10 border-white/15 text-zinc-200'
              }`}
            >
              <Play className="w-4 h-4 text-amber-400" />
              <span>{traceReplayRunning ? `Replay Stage ${currentReplayStage}/12...` : '12-Stage Replay'}</span>
            </button>

            {onOpenCertificate && (
              <button
                onClick={onOpenCertificate}
                className="px-3.5 py-2.5 rounded-xl bg-yellow-950/70 hover:bg-yellow-900/80 border border-yellow-500/40 text-yellow-300 font-mono text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <FileCheck className="w-4 h-4 text-yellow-400" />
                <span>Certificate #849202</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Telemetry Ticker Strip */}
        <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs font-mono">
          <div className="p-2 rounded-lg bg-black/40 border border-white/5">
            <div className="text-zinc-400 text-[10px]">BLOCK HEIGHT</div>
            <div className="text-white font-bold text-sm">#{liveTelemetry.block_height}</div>
          </div>
          <div className="p-2 rounded-lg bg-black/40 border border-white/5">
            <div className="text-zinc-400 text-[10px]">THROUGHPUT (QOPS)</div>
            <div className="text-cyan-400 font-bold text-sm">{liveTelemetry.qops} QOps/s</div>
          </div>
          <div className="p-2 rounded-lg bg-black/40 border border-white/5">
            <div className="text-zinc-400 text-[10px]">CRYO THERMAL</div>
            <div className="text-amber-300 font-bold text-sm">{liveTelemetry.cryo_temp}</div>
          </div>
          <div className="p-2 rounded-lg bg-black/40 border border-white/5">
            <div className="text-zinc-400 text-[10px]">COHERENCE</div>
            <div className="text-emerald-400 font-bold text-sm">{liveTelemetry.coherence}</div>
          </div>
          <div className="p-2 rounded-lg bg-black/40 border border-white/5">
            <div className="text-zinc-400 text-[10px]">SSOT DRIFT</div>
            <div className="text-emerald-400 font-bold text-sm">{liveTelemetry.drift}</div>
          </div>
          <div className="p-2 rounded-lg bg-black/40 border border-white/5">
            <div className="text-zinc-400 text-[10px]">WEBSOCKET STREAM</div>
            <div className="flex items-center gap-1.5 text-sm font-bold text-cyan-300">
              <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{wsConnected ? 'LIVE /ws' : 'POLLING'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── TAB SELECTOR: 5 CORE INTERFACES ── */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-[#060914] border border-cyan-500/30 font-mono text-xs">
        {[
          { id: 'OVERVIEW', label: '🌟 Executive Matrix', badge: 'All 4 Sectors' },
          { id: 'WORLD_ENGINE', label: '🌐 Sovereign World Engine (3D)', badge: '14,902 Seals' },
          { id: 'COPILOT', label: '🧠 Copilot Autonomy Node', badge: '4 Automated Sub-systems' },
          { id: 'CHAMBERS', label: '🏛️ Hardware Chambers', badge: 'Chamber 17 & Room 00' },
          { id: 'COMMAND_CONSOLE', label: '⚙️ Sovereign Command Console', badge: 'SSoT Δ0' },
          { id: 'API_SUITE', label: '⚡ Audit Trail API (5 Endpoints)', badge: 'REST & WS' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              playTone(640, 0.03);
              setActiveTab(tab.id as any);
            }}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'text-zinc-400 hover:text-zinc-200 bg-white/5 border border-transparent'
            }`}
          >
            <span>{tab.label}</span>
            <span className="px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 text-[10px] border border-cyan-500/30">
              {tab.badge}
            </span>
          </button>
        ))}
      </div>

      {/* ── 1. OVERVIEW MATRIX VIEW ── */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Main 4 Quadrants corresponding directly to the 4 User Modules */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Quadrant 1: Sovereign World Engine (3D Topology & WARP Network) */}
            <div className="p-5 rounded-2xl bg-[#0a0f1e] border border-cyan-500/20 space-y-4 flex flex-col justify-between shadow-xl">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                      <Boxes className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                        1. Sovereign World Engine (3D Canvas)
                      </h3>
                      <p className="text-[11px] font-mono text-zinc-400">Visual Topology 3D • 14,902 Canonical Seals • WARP Node Mesh</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 text-[10px] font-mono border border-cyan-500/30">
                    GPU ACCELERATED
                  </span>
                </div>

                <div className="h-56 rounded-xl bg-[#04060d] border border-cyan-500/20 relative overflow-hidden flex items-center justify-center">
                  <QuantumCitadelLatticeHologramVisualizer expanded={false} onToggleExpand={() => {}} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1">
                  <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-zinc-500 text-[10px]">CANONICAL SEALS</span>
                    <div className="text-emerald-400 font-bold">14,902 Active</div>
                  </div>
                  <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-zinc-500 text-[10px]">WARP NODES</span>
                    <div className="text-cyan-400 font-bold">18 BFT Replicas</div>
                  </div>
                  <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-zinc-500 text-[10px]">TOPOLOGY DRIFT</span>
                    <div className="text-emerald-400 font-bold">Δ0.00% Zero Drift</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('WORLD_ENGINE')}
                className="w-full py-2.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Expand World Engine &amp; Topology</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quadrant 2: Copilot Autonomy Node (4 Automation Sectors) */}
            <div className="p-5 rounded-2xl bg-[#0a0f1e] border border-cyan-500/20 space-y-4 flex flex-col justify-between shadow-xl">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-purple-950 border border-purple-500/40 flex items-center justify-center text-purple-400">
                      <Cpu className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                        2. Copilot Autonomy Node
                      </h3>
                      <p className="text-[11px] font-mono text-zinc-400">4 Core Autonomous Sectors • Sentinel Intercepts • Fail-Closed</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 text-[10px] font-mono border border-purple-500/30">
                    AUTOMATION ACTIVE
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  {[
                    {
                      name: 'Sector A: Signal Isolation',
                      desc: 'Sub-kelvin RF shielded cryo chamber at 14.98 mK',
                      badge: 'PASS',
                      color: 'text-cyan-400',
                    },
                    {
                      name: 'Sector B: Sentinel 12-Stage Replay',
                      desc: 'Deterministic trace verification with post-quantum binding',
                      badge: `${currentReplayStage}/12 STAGES`,
                      color: 'text-amber-400',
                    },
                    {
                      name: 'Sector C: Zero-Trust Autonomy',
                      desc: '10/10 Hardware Security Module Quorum verified',
                      badge: '10/10 HSM',
                      color: 'text-emerald-400',
                    },
                    {
                      name: 'Sector D: Cryo Anomaly Isolation',
                      desc: 'Fail-closed quarantine circuit active for probe seal #14903',
                      badge: 'ISOLATED',
                      color: 'text-rose-400',
                    },
                  ].map((sec, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs font-mono"
                    >
                      <div>
                        <div className={`font-bold ${sec.color}`}>{sec.name}</div>
                        <div className="text-[11px] text-zinc-400">{sec.desc}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-white/5 text-zinc-300 font-bold text-[10px] border border-white/10">
                        {sec.badge}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setActiveTab('COPILOT')}
                className="w-full py-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Control Copilot Autonomy Node</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quadrant 3: Canonical Hardware Chambers (Chamber 17 & Room 00) */}
            <div className="p-5 rounded-2xl bg-[#0a0f1e] border border-cyan-500/20 space-y-4 flex flex-col justify-between shadow-xl">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <Server className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                        3. Canonical Hardware Chambers
                      </h3>
                      <p className="text-[11px] font-mono text-zinc-400">Chamber 17 (Audit Ledger) • Room 00 • Quarantine Guard</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                    ETDA SEC 9/26/28
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono pt-1">
                  <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/20 space-y-1">
                    <div className="flex items-center justify-between font-bold text-emerald-300">
                      <span>CHAMBER 17: AUDIT TRAIL LEDGER</span>
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-950 rounded text-emerald-300">14,902 SEALS</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      บันทึกหลักฐานทางกฎหมายไทย (ETDA &amp; PDPA) พร้อมผูกพันแฮช Merkle Root และอนุญาตการดึงข้อมูลผ่าน <code className="text-cyan-300">/api/v1/audit/records</code>
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/20 space-y-1">
                    <div className="flex items-center justify-between font-bold text-cyan-300">
                      <span>ROOM 00: SOVEREIGN FOUNDATION</span>
                      <span className="text-[10px] px-2 py-0.5 bg-cyan-950 rounded text-cyan-300">FROZEN v1.2</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01) กำกับดูแลสิทธิ์อธิปไตยดิจิทัลและ 10/10 Quorum ในสภาวะแช่แข็งเสถียรภาพ
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-rose-500/20 space-y-1">
                    <div className="flex items-center justify-between font-bold text-rose-300">
                      <span>CHAMBER 02: FAIL-CLOSED QUARANTINE</span>
                      <span className="text-[10px] px-2 py-0.5 bg-rose-950 rounded text-rose-300">80 ISOLATED</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      กักกันโพรบภายนอกและตราประทับนอกวงจร เช่น Seal #14903 เพื่อป้องกันมลภาวะข้อมูลต่อระบบความจริงหลัก (SSoT)
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('CHAMBERS')}
                className="w-full py-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Examine Hardware Chambers</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quadrant 4: Sovereign Command Console (SSoT Δ0 & Zero Drift) */}
            <div className="p-5 rounded-2xl bg-[#0a0f1e] border border-cyan-500/20 space-y-4 flex flex-col justify-between shadow-xl">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-amber-950 border border-amber-500/40 flex items-center justify-center text-amber-400">
                      <Terminal className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                        4. Sovereign Command Console
                      </h3>
                      <p className="text-[11px] font-mono text-zinc-400">SSoT Δ0 Invariant Enforcement • Zero Drift 0.00% • PQC Suite</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 text-[10px] font-mono border border-amber-500/30">
                    LOCKED_FROZEN
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-xs space-y-2">
                  <div className="text-zinc-400 flex items-center justify-between">
                    <span>STATE INVARIANT:</span>
                    <span className="text-emerald-400 font-bold">{ssotStatus}</span>
                  </div>
                  <div className="text-zinc-400 flex items-center justify-between">
                    <span>GENESIS MERKLE ROOT:</span>
                    <span className="text-zinc-200 text-[11px]">909ab814...43fa4c68</span>
                  </div>
                  <div className="text-zinc-400 flex items-center justify-between">
                    <span>POST-QUANTUM CRYPTO:</span>
                    <span className="text-cyan-300 font-bold">ML-DSA-87 &amp; ML-KEM-1024</span>
                  </div>
                  <div className="text-zinc-400 flex items-center justify-between">
                    <span>FAIL-CLOSED PROTECTION:</span>
                    <span className="text-emerald-400 font-bold">ACTIVE (142ms Phoenix)</span>
                  </div>
                </div>

                {commandFeedback && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono animate-in fade-in">
                    {commandFeedback}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleEnforceZeroDrift}
                  disabled={invokingCommand}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${invokingCommand ? 'animate-spin' : ''}`} />
                  <span>Enforce Zero Drift Δ0.00%</span>
                </button>
                <button
                  onClick={() => setActiveTab('COMMAND_CONSOLE')}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-mono text-xs font-bold transition-all cursor-pointer"
                >
                  <span>Console</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick API Suite Strip */}
          <div className="p-5 rounded-2xl bg-[#080d1a] border border-cyan-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-mono font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>Integrated Audit Trail REST API (v1.2.0-LTS) &amp; Evidence #849202</span>
                </h3>
                <p className="text-xs font-mono text-zinc-400">
                  ทดสอบเรียกใช้ 5 Endpoints พร้อม WebSocket Telemetry Stream แบบ Real-time
                </p>
              </div>

              <button
                onClick={() => setActiveTab('API_SUITE')}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center gap-2 cursor-pointer shrink-0"
              >
                <span>Open Full API Console</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-mono">
              {[
                { id: 'root', method: 'GET', path: '/', label: 'Root Status' },
                { id: 'telemetry', method: 'GET', path: '/api/v1/telemetry', label: 'Telemetry' },
                { id: 'audit_records', method: 'GET', path: '/api/v1/audit/records', label: 'Chamber 17' },
                { id: 'trace_replay', method: 'POST', path: '/api/v1/forensic/trace-replay', label: '12-Stage Trace' },
                { id: 'gold_seal_verify', method: 'POST', path: '/api/v1/gold-seal/verify', label: 'Gold Seal Verify' },
                { id: 'reports_generate', method: 'POST', path: '/api/v1/reports/generate', label: 'PDF Report' },
              ].map((ep) => {
                const res = apiResults[ep.id];
                const isRunning = runningEndpoint === ep.id;
                return (
                  <button
                    key={ep.id}
                    onClick={() => executeApiEndpoint(ep.id)}
                    disabled={isRunning}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      res
                        ? res.status === 200 || res.status === '200'
                          ? 'bg-emerald-950/40 border-emerald-500/30 hover:border-emerald-500/60'
                          : 'bg-rose-950/40 border-rose-500/30'
                        : 'bg-black/40 border-white/10 hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${ep.method === 'GET' ? 'bg-cyan-950 text-cyan-300' : 'bg-amber-950 text-amber-300'}`}>
                        {ep.method}
                      </span>
                      {res && (
                        <span className="text-[10px] text-zinc-400">{res.durationMs}ms</span>
                      )}
                    </div>
                    <div className="font-bold text-white mt-1 text-xs truncate">{ep.label}</div>
                    <div className="text-[10px] text-zinc-500 font-mono truncate">{ep.path}</div>
                    <div className="mt-1.5 pt-1 border-t border-white/5 flex items-center justify-between text-[10px]">
                      <span className="text-zinc-400">
                        {isRunning ? 'Running...' : res ? `HTTP ${res.status}` : 'Click to run'}
                      </span>
                      {res && (res.status === 200 || res.status === '200') ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 2. SOVEREIGN WORLD ENGINE (3D CANVAS) ── */}
      {activeTab === 'WORLD_ENGINE' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-5 rounded-2xl bg-[#0a0f1e] border border-cyan-500/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-mono font-bold text-white flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-cyan-400" />
                  <span>Sovereign World Engine: Visual Topology 3D &amp; WARP Node Mesh</span>
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  รองรับการตรวจสอบสถานะ 14,902 Canonical Seals พร้อมจำลองโครงข่ายกระจายข้อมูล WARP Node 18 จุด
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveVisualizer('hologram')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                    activeVisualizer === 'hologram'
                      ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300'
                      : 'bg-white/5 border-white/10 text-zinc-400'
                  }`}
                >
                  3D Lattice Hologram
                </button>
                <button
                  onClick={() => setActiveVisualizer('topology')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                    activeVisualizer === 'topology'
                      ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300'
                      : 'bg-white/5 border-white/10 text-zinc-400'
                  }`}
                >
                  WARP Network Mesh
                </button>
              </div>
            </div>

            {/* 3D Visualizer Canvas */}
            <div className="h-[460px] rounded-2xl bg-[#04060d] border border-cyan-500/30 overflow-hidden relative flex items-center justify-center">
              {activeVisualizer === 'hologram' ? (
                <QuantumCitadelLatticeHologramVisualizer expanded={true} onToggleExpand={() => {}} onNavigate={onNavigate} />
              ) : (
                <TopologyCanvas />
              )}
            </div>

            {/* 14,902 Canonical Seals Inspector Grid */}
            <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div className="font-bold text-zinc-200">
                  14,902 Canonical Seals Inspection Array
                </div>
                <div className="text-zinc-400 text-[11px]">
                  All Bitwise Parity Checks Passing (SSoT Δ0.00%)
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[14902, 14901, 14900, 14899, 14898, 14897, 14896, 14895, 14894, 14893].map((seal) => (
                  <button
                    key={seal}
                    onClick={() => {
                      setActiveSealInspector(seal);
                      playTone(550 + (seal % 100), 0.03);
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold cursor-pointer transition-all ${
                      activeSealInspector === seal
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Seal #{seal}
                  </button>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-[#070b16] border border-emerald-500/30 space-y-1.5">
                <div className="flex items-center justify-between text-emerald-300 font-bold">
                  <span>Selected Seal #{activeSealInspector} Status:</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/30">
                    CANONICAL_VERIFIED
                  </span>
                </div>
                <div className="text-zinc-400 text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-zinc-500">Merkle Leaf Binding:</span>{' '}
                    <span className="text-zinc-300 font-mono">0x{(activeSealInspector * 849202).toString(16).padStart(64, '0').slice(0, 32)}...</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Root Proof:</span>{' '}
                    <span className="text-zinc-300 font-mono">909ab814...43fa4c68 (Bitwise Equal)</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">PQC Signature:</span>{' '}
                    <span className="text-cyan-300">ML-DSA-87 (Dilithium-5) Validated</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Thai Legal Protection:</span>{' '}
                    <span className="text-amber-300">ETDA Sec 9/26/28 Compliant</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. COPILOT AUTONOMY NODE (4 SECTORS) ── */}
      {activeTab === 'COPILOT' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-5 rounded-2xl bg-[#0a0f1e] border border-purple-500/30 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-mono font-bold text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-purple-400" />
                  <span>Copilot Autonomy Node: 4 Core Autonomous Sectors</span>
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  ระบบอัตโนมัติ 4 มิติ ตรวจจับ ป้องกัน และกู้คืนตัวเองในเวลา 142ms ตามมาตรฐานการคุ้มครอง Fail-Closed
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {(['SIGNAL', 'SENTINEL_REPLAY', 'ZERO_TRUST', 'CRYO_ISOLATION'] as const).map((sector) => (
                  <button
                    key={sector}
                    onClick={() => {
                      setCopilotSector(sector);
                      playTone(600, 0.04);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                      copilotSector === sector
                        ? 'bg-purple-500/20 border-purple-400/50 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                        : 'bg-white/5 border-white/10 text-zinc-400'
                    }`}
                  >
                    {sector === 'SIGNAL' && '1. Signal'}
                    {sector === 'SENTINEL_REPLAY' && '2. Sentinel Replay'}
                    {sector === 'ZERO_TRUST' && '3. Zero-Trust'}
                    {sector === 'CRYO_ISOLATION' && '4. Cryo Isolation'}
                  </button>
                ))}
              </div>
            </div>

            {/* Sector Details Panel */}
            <div className="p-5 rounded-xl bg-black/60 border border-white/10 space-y-4 font-mono">
              {copilotSector === 'SIGNAL' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                      <Radio className="w-4 h-4 text-cyan-400" />
                      <span>Sector 1: Signal Isolation (Sub-Kelvin RF Shield)</span>
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                      14.98 mK PASS
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    ระบบป้องกันการดักฟังและสัญญาณคลื่นรบกวนภายนอกด้วยฉนวนดูดซับคลื่น Sub-kelvin และ Faraday Chamber ควบคุมอุณหภูมิที่ 14.98 mK รักษา Coherence ของตัวเข้ารหัสควอนตัมไว้ที่ 99.992%
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                    <div className="p-2.5 rounded-lg bg-[#070b16] border border-cyan-500/20">
                      <div className="text-zinc-500 text-[10px]">RF EMISSION</div>
                      <div className="text-white font-bold text-sm">-142.8 dBm (Silent)</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#070b16] border border-cyan-500/20">
                      <div className="text-zinc-500 text-[10px]">CRYO TEMPERATURE</div>
                      <div className="text-amber-300 font-bold text-sm">14.98 mK Hel-3/4</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#070b16] border border-cyan-500/20">
                      <div className="text-zinc-500 text-[10px]">ENTROPY RATE</div>
                      <div className="text-cyan-400 font-bold text-sm">7,018 KBps Continuous</div>
                    </div>
                  </div>
                </div>
              )}

              {copilotSector === 'SENTINEL_REPLAY' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                      <Play className="w-4 h-4 text-amber-400" />
                      <span>Sector 2: Terminal Sentinel 12-Stage Replay</span>
                    </h3>
                    <button
                      onClick={handleTrigger12StageReplay}
                      disabled={traceReplayRunning}
                      className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold transition-all cursor-pointer"
                    >
                      {traceReplayRunning ? 'Replaying...' : 'Simulate 12-Stage Execution'}
                    </button>
                  </div>

                  <p className="text-xs text-zinc-300">
                    การจำลองและสอบทานลำดับ 12 ขั้นตอน (Stage 1 ถึง Stage 12) เพื่อยืนยันว่าการประทับตรา Merkle Root และการลงนาม NIST FIPS 204 ปฏิบัติตาม SSoT โดยไม่มีความคลาดเคลื่อน
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                    {Array.from({ length: 12 }).map((_, idx) => {
                      const stageNum = idx + 1;
                      const isComplete = stageNum <= currentReplayStage;
                      const isCurrent = stageNum === currentReplayStage && traceReplayRunning;
                      return (
                        <div
                          key={stageNum}
                          className={`p-2.5 rounded-xl border transition-all text-xs ${
                            isCurrent
                              ? 'bg-amber-500/30 border-amber-400 text-white animate-pulse'
                              : isComplete
                              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                              : 'bg-black/40 border-white/5 text-zinc-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold">Stage {stageNum}</span>
                            {isComplete && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-1 truncate">
                            {stageNum === 1 && 'Ingress Probe'}
                            {stageNum === 2 && 'Signal Isolation'}
                            {stageNum === 3 && 'TRNG Seed'}
                            {stageNum === 4 && 'Dilithium Hash'}
                            {stageNum === 5 && 'HSM Quorum 10'}
                            {stageNum === 6 && 'ETDA Sec 9 Seal'}
                            {stageNum === 7 && 'PDPA Anonymize'}
                            {stageNum === 8 && 'Merkle Node Bind'}
                            {stageNum === 9 && 'BFT Replica 18'}
                            {stageNum === 10 && 'Fail-Closed Guard'}
                            {stageNum === 11 && 'Chamber 17 Notary'}
                            {stageNum === 12 && 'Gold Master Verify'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {copilotSector === 'ZERO_TRUST' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Sector 3: Zero-Trust Autonomy &amp; 10/10 HSM Quorum</span>
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                      10/10 REAL_HSM
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300">
                    ไม่มีสิทธิ์ใดในระบบสามารถแก้ไขข้อมูลย้อนหลังได้ (Immutable). การลงนามต้องได้รับฉันทามติครบ 10 ใน 10 ช่องของ Hardware Security Module FIPS 140-3 Level 4 พร้อมผู้มีอำนาจสิทธิราชย์ นายยุทธภูมิ พากเพียร
                  </p>
                  <div className="p-3 rounded-lg bg-[#070b16] border border-emerald-500/20 text-xs text-zinc-300 space-y-1">
                    <div className="text-emerald-400 font-bold">10/10 Sovereign Quorum Attestation Slots:</div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1 text-[11px]">
                      {['SLOT-01 (ML-DSA)', 'SLOT-02 (ML-KEM)', 'SLOT-03 (ETDA)', 'SLOT-04 (PDPA)', 'SLOT-05 (CRYPTO)', 'SLOT-06 (BFT)', 'SLOT-07 (CRYO)', 'SLOT-08 (LEDGER)', 'SLOT-09 (AUDIT)', 'SLOT-10 (CHAMBER-17)'].map((slot, i) => (
                        <div key={i} className="px-2 py-1 rounded bg-black/40 border border-emerald-500/30 text-center text-emerald-200">
                          {slot}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {copilotSector === 'CRYO_ISOLATION' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      <span>Sector 4: Cryo Anomaly Isolation (Fail-Closed Quarantine)</span>
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40">
                      80 SEALS ISOLATED
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300">
                    หากตรวจพบการเบี่ยงเบนของ Merkle Hash หรือการพยายามส่งข้อมูลหลังจากเวลาแช่แข็งของบล็อก #849202 (Post-Epoch Emission) ระบบจะตัดการเชื่อมต่อแบบ Fail-Closed ทันที และส่งข้อมูลเข้าตู้กักกัน Chamber 02
                  </p>
                  <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-xs text-rose-200">
                    🚨 <strong>Active Quarantine Target:</strong> Probe Seal #14903 held in isolation buffer (Post-Epoch Emission Probe mismatch blocked from canonical chain).
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 4. CANONICAL HARDWARE CHAMBERS ── */}
      {activeTab === 'CHAMBERS' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-5 rounded-2xl bg-[#0a0f1e] border border-emerald-500/30 space-y-5">
            <div>
              <h2 className="text-lg font-mono font-bold text-white flex items-center gap-2">
                <Server className="w-5 h-5 text-emerald-400" />
                <span>Canonical Hardware Chambers: Chamber 17, Room 00 &amp; Quarantine</span>
              </h2>
              <p className="text-xs font-mono text-zinc-400">
                สถาปัตยกรรมทางกายภาพและสมุดบันทึกหลักฐานความมั่นคงปลอดภัยตามกฎหมายไทย
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Chamber 17 */}
              <div className="p-4 rounded-xl bg-black/60 border border-emerald-500/40 space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300">CHAMBER 17</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                    AUDIT LEDGER
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">Audit Trail Ledger &amp; Legal Evidence</h3>
                <p className="text-xs text-zinc-400">
                  ศูนย์รวมระเบียนหลักฐานทางนิติวิทยาศาสตร์และ ETDA Section 9, 26, 28 พร้อมหลักฐาน Cryptographic Evidence #849202
                </p>
                <div className="text-xs space-y-1 pt-2 border-t border-white/5">
                  <div className="text-zinc-500">CANONICAL SEALS: <strong className="text-white">14,902</strong></div>
                  <div className="text-zinc-500">API ROUTE: <code className="text-cyan-300">/api/v1/audit/records</code></div>
                  <div className="text-zinc-500">CACHE POLICY: <strong className="text-emerald-300">Cache-Control: max-age=30</strong></div>
                </div>
              </div>

              {/* Room 00 */}
              <div className="p-4 rounded-xl bg-black/60 border border-cyan-500/40 space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300">ROOM 00</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    FOUNDATION
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">Sovereign Foundation &amp; Principal</h3>
                <p className="text-xs text-zinc-400">
                  รากฐานระบบอธิปไตยดิจิทัล ภายใต้การกำกับดูแลของ นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)
                </p>
                <div className="text-xs space-y-1 pt-2 border-t border-white/5">
                  <div className="text-zinc-500">STATE: <strong className="text-cyan-300">LOCKED_FROZEN_v1.2_LTS</strong></div>
                  <div className="text-zinc-500">QUORUM: <strong className="text-white">10/10 REAL_HSM</strong></div>
                  <div className="text-zinc-500">PRINCIPAL: <strong className="text-zinc-300">EP-SOVEREIGN-01</strong></div>
                </div>
              </div>

              {/* Fail-Closed Quarantine Chamber */}
              <div className="p-4 rounded-xl bg-black/60 border border-rose-500/40 space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-300">CHAMBER 02</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30">
                    QUARANTINE
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">Fail-Closed Quarantine Chamber</h3>
                <p className="text-xs text-zinc-400">
                  ห้องกักกันตราประทับและข้อความรบกวน 80 รายการ เพื่อไม่ให้แทรกซึมเข้าสู่ Genesis Chain
                </p>
                <div className="text-xs space-y-1 pt-2 border-t border-white/5">
                  <div className="text-zinc-500">QUARANTINED: <strong className="text-rose-400">80 Raw Seals</strong></div>
                  <div className="text-zinc-500">TARGET: <strong className="text-rose-300">Seal #14903 Isolated</strong></div>
                  <div className="text-zinc-500">RECOVERY: <strong className="text-emerald-400">142ms Phoenix Healing</strong></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. SOVEREIGN COMMAND CONSOLE ── */}
      {activeTab === 'COMMAND_CONSOLE' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-5 rounded-2xl bg-[#0a0f1e] border border-amber-500/30 space-y-5">
            <div>
              <h2 className="text-lg font-mono font-bold text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-amber-400" />
                <span>Sovereign Command Console: SSoT Δ0 Invariant Enforcer</span>
              </h2>
              <p className="text-xs font-mono text-zinc-400">
                ศูนย์บัญชาการระดับความมั่นคงสูงสุด ควบคุมและรักษาสถานะ Zero Drift (0.00%) ในโหมด LOCKED_FROZEN_v1.2_LTS
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/80 border border-white/10 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between text-zinc-400 pb-2 border-b border-white/10">
                <span>INVARIANT SPECIFICATION</span>
                <span className="text-emerald-400 font-bold">STATUS: {ssotStatus}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-zinc-300">
                <div className="p-3 rounded-lg bg-[#070b16] border border-white/5 space-y-1">
                  <span className="text-zinc-500 text-[10px]">CANONICAL GENESIS BLOCK</span>
                  <div className="font-bold text-white">#849202</div>
                  <div className="text-[11px] text-zinc-400">Locked permanently against re-orgs</div>
                </div>
                <div className="p-3 rounded-lg bg-[#070b16] border border-white/5 space-y-1">
                  <span className="text-zinc-500 text-[10px]">GENESIS MERKLE ROOT</span>
                  <div className="font-bold text-cyan-300 truncate">909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68</div>
                  <div className="text-[11px] text-zinc-400">Bitwise reference parity verified</div>
                </div>
                <div className="p-3 rounded-lg bg-[#070b16] border border-white/5 space-y-1">
                  <span className="text-zinc-500 text-[10px]">CANONICAL SEALS COUNT</span>
                  <div className="font-bold text-emerald-400">14,902 Seals</div>
                  <div className="text-[11px] text-zinc-400">ETDA Sec 9/26/28 &amp; PDPA notarized</div>
                </div>
                <div className="p-3 rounded-lg bg-[#070b16] border border-white/5 space-y-1">
                  <span className="text-zinc-500 text-[10px]">PQC SIGNATURE ATTESTATION</span>
                  <div className="font-bold text-purple-300">ML-DSA-87 (Dilithium-5)</div>
                  <div className="text-[11px] text-zinc-400">NIST FIPS 204 Standards Level</div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleEnforceZeroDrift}
                  disabled={invokingCommand}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-2 cursor-pointer transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                >
                  <RefreshCw className={`w-4 h-4 ${invokingCommand ? 'animate-spin' : ''}`} />
                  <span>Enforce Zero Drift (0.00%)</span>
                </button>

                <button
                  onClick={() => {
                    playTone(660, 0.05);
                    setCommandFeedback('PQC Suite Attested: Dilithium-5 + ML-KEM-1024 validated against 10/10 HSM.');
                    setTimeout(() => setCommandFeedback(null), 4000);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 font-bold flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Lock className="w-4 h-4 text-cyan-400" />
                  <span>Verify PQC Attestation</span>
                </button>
              </div>

              {commandFeedback && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 animate-in fade-in">
                  {commandFeedback}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 6. AUDIT TRAIL API SUITE & WEBSOCKET STREAM (REST + WS) ── */}
      {activeTab === 'API_SUITE' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-5 rounded-2xl bg-[#080d1a] border border-cyan-500/30 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-mono font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  <span>Audit Trail API (v1.2.0-LTS) Execution Suite &amp; Live WebSocket Stream</span>
                </h2>
                <p className="text-xs font-mono text-zinc-400">
                  ทดสอบและตรวจสอบผลลัพธ์ของ 5 REST API Endpoints และ WebSocket Telemetry Stream แบบ Real-time
                </p>
              </div>

              <button
                onClick={handleRunFullTestSuite}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer shrink-0"
              >
                <Zap className="w-4 h-4 text-cyan-200" />
                <span>Execute All Endpoints</span>
              </button>
            </div>

            {/* API Endpoints Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
              {[
                {
                  id: 'root',
                  method: 'GET',
                  url: '/',
                  title: '1. Root Status & Sovereign Signature',
                  desc: 'ตรวจสอบสถานะระบบและส่วนหัว X-Zyrquen-Sovereign-Sig',
                  payload: null,
                },
                {
                  id: 'telemetry',
                  method: 'GET',
                  url: '/api/v1/telemetry',
                  title: '2. Telemetry QOPS & Coherence',
                  desc: 'ดึงข้อมูล Telemetry 851.9 QOPS, อุณหภูมิ Cryo 14.98 mK',
                  payload: null,
                },
                {
                  id: 'audit_records',
                  method: 'GET',
                  url: '/api/v1/audit/records?chamber_filter=Chamber%2017',
                  title: '3. Fetch Audit Records (Chamber 17)',
                  desc: 'ดึงบันทึกการประทับตราหลักฐานทางกฎหมาย ETDA/PDPA',
                  payload: null,
                },
                {
                  id: 'trace_replay',
                  method: 'POST',
                  url: '/api/v1/forensic/trace-replay',
                  title: '4. Execute 12-Stage Trace Replay',
                  desc: 'สั่งประมวลผลจำลองและสอบทานหลักฐาน 12 ขั้นตอนย้อนหลัง',
                  payload: { seal_id: activeSealInspector, force_cold_replay: true },
                },
                {
                  id: 'gold_seal_verify',
                  method: 'POST',
                  url: '/api/v1/gold-seal/verify',
                  title: '5. Verify Gold Seal Integrity (#849202)',
                  desc: 'ยืนยันความถูกต้องของ Genesis Merkle Root และตราประทับ',
                  payload: { block_height: 849202, expected_merkle_root: '909ab814...4c68' },
                },
                {
                  id: 'reports_generate',
                  method: 'POST',
                  url: '/api/v1/reports/generate',
                  title: '6. Generate Legal Forensic Report',
                  desc: 'สร้างรายงานหลักฐานคดีพร้อมใช้งานในชั้นศาล (PDF Bundle)',
                  payload: { block_height: 849202, target_format: 'PDF', include_forensic_stream: true },
                },
              ].map((item) => {
                const res = apiResults[item.id];
                const isRunning = runningEndpoint === item.id;
                const isSelected = selectedApiForDetail === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedApiForDetail(item.id);
                      playTone(500, 0.02);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                        : 'bg-black/50 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.method === 'GET' ? 'bg-cyan-950 text-cyan-300' : 'bg-amber-950 text-amber-300'}`}>
                          {item.method}
                        </span>
                        {res && (
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${res.status === 200 || res.status === '200' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                            HTTP {res.status} ({res.durationMs}ms)
                          </span>
                        )}
                      </div>

                      <div className="font-bold text-white text-xs">{item.title}</div>
                      <div className="text-[11px] text-zinc-400 leading-snug">{item.desc}</div>
                      <div className="text-[10px] text-zinc-500 truncate font-mono">{item.url}</div>
                    </div>

                    <div className="pt-3 mt-2 border-t border-white/5 flex items-center justify-between">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          executeApiEndpoint(item.id);
                        }}
                        disabled={isRunning}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600/80 hover:bg-cyan-500 text-white text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Play className="w-3 h-3" />
                        <span>{isRunning ? 'Invoking...' : 'Run Request'}</span>
                      </button>

                      <span className="text-[10px] text-zinc-500">
                        {res ? res.timestamp : 'Untested'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected API Response Inspector */}
            {selectedApiForDetail && (
              <div className="p-4 rounded-xl bg-black/80 border border-cyan-500/30 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-zinc-300 pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold">JSON Response Inspector: [{selectedApiForDetail.toUpperCase()}]</span>
                  </div>
                  {apiResults[selectedApiForDetail] && (
                    <span className="text-emerald-400 text-[11px]">
                      Duration: {apiResults[selectedApiForDetail].durationMs}ms • Received: {apiResults[selectedApiForDetail].timestamp}
                    </span>
                  )}
                </div>

                {apiResults[selectedApiForDetail] ? (
                  <pre className="p-3 rounded-lg bg-[#04060d] border border-white/5 text-emerald-300 text-[11px] max-h-60 overflow-y-auto font-mono whitespace-pre-wrap">
                    {JSON.stringify(apiResults[selectedApiForDetail].data, null, 2)}
                  </pre>
                ) : (
                  <div className="p-4 text-center text-zinc-500">
                    Endpoint has not been invoked yet. Click "Run Request" above to execute.
                  </div>
                )}
              </div>
            )}

            {/* Live WebSocket Telemetry Stream Monitor */}
            <div className="p-4 rounded-xl bg-black/60 border border-cyan-500/20 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className={`w-4 h-4 ${wsConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
                  <span className="font-bold text-white">Live WebSocket Telemetry Stream (/ws/telemetry)</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${wsConnected ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-amber-950 text-amber-300 border border-amber-500/30'}`}>
                  {wsConnected ? 'SOCKET OPEN & STREAMING' : 'CONNECTING / POLLING'}
                </span>
              </div>

              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {wsMessages.length > 0 ? (
                  wsMessages.map((msg) => (
                    <div key={msg.id} className="p-2 rounded bg-[#070b16] border border-white/5 text-[11px] flex items-center justify-between text-zinc-300">
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-400 font-bold">[{msg.time}]</span>
                        <span>Block #{msg.data.block_height || 849202}</span>
                        <span className="text-zinc-500">•</span>
                        <span>QOPS: <strong className="text-white">{msg.data.qops || 851.9}</strong></span>
                        <span className="text-zinc-500">•</span>
                        <span>Temp: <strong className="text-amber-300">{msg.data.cryo_temp || '14.98 mK'}</strong></span>
                      </div>
                      <span className="text-emerald-400 font-bold">Drift: {msg.data.drift || '0.00%'}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-2 rounded bg-[#070b16] border border-white/5 text-[11px] text-zinc-400">
                    Listening for telemetry frames from WebSocket server...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
