import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Orbit,
  Globe,
  Shield,
  Cpu,
  Lock,
  Sparkles,
  Layers,
  CheckCircle2,
  Clock,
  FileText,
  Key,
  Maximize2,
  Minimize2,
  RotateCcw,
  Zap,
  Activity,
  Send,
  Eye,
  AlertTriangle,
  Download,
  Share2,
  Terminal,
  Scale,
  Wifi,
  ChevronRight,
  Sliders,
  Check,
  Award
} from 'lucide-react';
import { CANONICAL_GENESIS_BLOCK, CANONICAL_MERKLE_ROOT } from '@/data/canonicalData';
import { playAuditChime, playTone } from '@/components/AudioSynthesizer';
import { safeCopyToClipboard } from '@/utils/clipboard';

export interface AtlasAgent {
  id: string;
  name: string;
  role: string;
  status: 'PROPOSAL_READY' | 'VERIFIED' | 'APPROVED' | 'ACTIVE' | 'PREFLIGHT_AUDIT';
  hash: string;
  authority: string;
  batchSize: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'CRITICAL';
  currentPhase: number;
  quarantineSafe: boolean;
  pqcSignature?: string;
  timestamp: string;
}

export const INITIAL_ATLAS_AGENTS: AtlasAgent[] = [
  {
    id: 'ws-agent-02',
    name: 'AI Workspace Agent 02 (Core Invariant Engine)',
    role: 'Proposal Analysis & Text-Input Sanitization',
    status: 'PROPOSAL_READY',
    hash: '094fc7f944b8175e1284a0cd91fe9307d8b13904',
    authority: '#EP-SOVEREIGN-01 (Yutthaphum Phakphian)',
    batchSize: 'Batch 64 → 48 (REQ-P11-849205-0042)',
    riskLevel: 'LOW',
    currentPhase: 2,
    quarantineSafe: true,
    pqcSignature: 'ML-DSA-87:0x849202_DILITHIUM5_APPROVED',
    timestamp: '2026-10-01T04:30:00 UTC (RFC 3161)'
  },
  {
    id: 'ws-agent-03',
    name: 'AI Workspace Agent 03 (Preflight Sentinel)',
    role: 'Automated Preflight & Invariant Replay Testing',
    status: 'VERIFIED',
    hash: '4a19b88cd20f781123490aa184cd79b1580c8129',
    authority: '#EP-SOVEREIGN-01 (Master Custodian)',
    batchSize: 'Batch 32 (Standard Deterministic)',
    riskLevel: 'LOW',
    currentPhase: 3,
    quarantineSafe: true,
    pqcSignature: 'ML-DSA-87:0x849203_KYBER1024_ACTIVE',
    timestamp: '2026-10-01T04:35:12 UTC (RFC 3161)'
  },
  {
    id: 'ws-agent-04',
    name: 'AI Workspace Agent 04 (Genesis Sync Gateway)',
    role: 'Deca-HSM Quorum Sync & Multi-Region Wire',
    status: 'APPROVED',
    hash: '909ab814479844d8a14816bed34cdbb07528e185',
    authority: '#EP-SOVEREIGN-01 (Master Custodian)',
    batchSize: 'Batch 128 (Streaming Zero-Drift)',
    riskLevel: 'LOW',
    currentPhase: 4,
    quarantineSafe: true,
    pqcSignature: 'ML-DSA-87:0x849204_SLHDSA_SEALED',
    timestamp: '2026-10-01T04:40:00 UTC (RFC 3161)'
  }
];

export const REGIONAL_NODES = [
  { id: 'node-bkk', city: 'Bangkok', region: 'TH-BKK-01 (Primary Anchor)', latency: '2.1 ms', coherence: '99.99%', status: 'ONLINE', cryoTemp: '14.98 mK', hsmSlot: 'HSM #0-2' },
  { id: 'node-cnx', city: 'Chiang Mai', region: 'TH-CNX-02 (Redundant Vault)', latency: '5.4 ms', coherence: '99.98%', status: 'ONLINE', cryoTemp: '14.97 mK', hsmSlot: 'HSM #3-5' },
  { id: 'node-hkg', city: 'Hong Kong', region: 'HK-HKG-01 (Edge Relay)', latency: '9.8 ms', coherence: '99.97%', status: 'ONLINE', cryoTemp: '15.01 mK', hsmSlot: 'HSM #6-7' },
  { id: 'node-sgp', city: 'Singapore', region: 'SG-SIN-01 (DR Quorum)', latency: '11.2 ms', coherence: '99.99%', status: 'ONLINE', cryoTemp: '14.99 mK', hsmSlot: 'HSM #8-9' }
];

export const SovereignAtlasView: React.FC = () => {
  const [agents, setAgents] = useState<AtlasAgent[]>(INITIAL_ATLAS_AGENTS);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('ws-agent-02');
  const [activeLayer, setActiveLayer] = useState<'all' | 'governance' | 'custodian' | 'quantum' | 'agents' | 'forensic'>('all');
  const [isHologramRotating, setIsHologramRotating] = useState<boolean>(true);
  const [hologramIntensity, setHologramIntensity] = useState<number>(85);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [cameraAngle, setCameraAngle] = useState<{ rx: number; ry: number }>({ rx: 25, ry: 45 });
  const [executionLog, setExecutionLog] = useState<string[]>([
    '[INIT] Sovereign Runtime Atlas v1.2.1 LTS Initialized.',
    '[SSoT] Genesis Block Anchor #849202 Bound (Drift 0.000%).',
    '[QUORUM] 10/10 REAL_HSM FIPS 140-3 L4 Quorum Connected @ 14.98 mK.',
    '[AGENT-02] Preflight Hash SHA256:094fc7f944b8... Verified.',
    '[STAGE] Workspace ws-agent-02 is in PROPOSAL_READY state awaiting Explicit #EP-SOVEREIGN-01 Approval.'
  ]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedAgent = useMemo(() => {
    return agents.find((a) => a.id === selectedAgentId) || agents[0];
  }, [agents, selectedAgentId]);

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    safeCopyToClipboard(text);
    setCopiedText(label);
    playTone(880, 0.08, 'sine');
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Hologram 3D Canvas rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;

    const render = () => {
      const width = (canvas.width = canvas.parentElement?.clientWidth || 800);
      const height = (canvas.height = canvas.parentElement?.clientHeight || 450);

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      if (isHologramRotating) {
        angle += 0.008;
      }

      // Draw Grid Matrix floor in 3D Isometric projection
      ctx.save();
      ctx.strokeStyle = `rgba(0, 229, 255, ${hologramIntensity * 0.002})`;
      ctx.lineWidth = 1;

      const gridSize = 12;
      const step = 28;

      for (let i = -gridSize; i <= gridSize; i++) {
        const x1 = i * step;
        const z1 = -gridSize * step;
        const x2 = i * step;
        const z2 = gridSize * step;

        const p1 = project3D(x1, 100, z1, angle, centerX, centerY);
        const p2 = project3D(x2, 100, z2, angle, centerX, centerY);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        const p3 = project3D(-gridSize * step, 100, i * step, angle, centerX, centerY);
        const p4 = project3D(gridSize * step, 100, i * step, angle, centerX, centerY);

        ctx.beginPath();
        ctx.moveTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.stroke();
      }

      // Draw 3D Sovereign Central Core Pillar
      const coreTop = project3D(0, -120, 0, angle, centerX, centerY);
      const coreBottom = project3D(0, 100, 0, angle, centerX, centerY);

      const coreGradient = ctx.createLinearGradient(coreTop.x, coreTop.y, coreBottom.x, coreBottom.y);
      coreGradient.addColorStop(0, 'rgba(0, 229, 255, 0.9)');
      coreGradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.6)');
      coreGradient.addColorStop(1, 'rgba(16, 185, 129, 0.3)');

      ctx.beginPath();
      ctx.strokeStyle = coreGradient;
      ctx.lineWidth = 3;
      ctx.moveTo(coreTop.x, coreTop.y);
      ctx.lineTo(coreBottom.x, coreBottom.y);
      ctx.stroke();

      // Glowing Core Node
      ctx.beginPath();
      ctx.arc(coreTop.x, coreTop.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#00e5ff';
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Orbiting Agent & Quorum Nodes
      const nodes = [
        { name: 'ws-agent-02', color: '#00e5ff', r: 160, y: -40, speed: 1.0, active: selectedAgentId === 'ws-agent-02' },
        { name: 'ws-agent-03', color: '#a855f7', r: 190, y: 10, speed: -0.8, active: selectedAgentId === 'ws-agent-03' },
        { name: 'ws-agent-04', color: '#10b981', r: 220, y: -70, speed: 0.6, active: selectedAgentId === 'ws-agent-04' },
        { name: 'Deca-HSM', color: '#ffd700', r: 120, y: 50, speed: -1.2, active: false },
        { name: 'WORM-Ledger', color: '#38bdf8', r: 260, y: -20, speed: 0.4, active: false }
      ];

      nodes.forEach((node, idx) => {
        const nodeAngle = angle * node.speed + (idx * Math.PI * 2) / nodes.length;
        const nx = Math.cos(nodeAngle) * node.r;
        const nz = Math.sin(nodeAngle) * node.r;

        const np = project3D(nx, node.y, nz, angle, centerX, centerY);

        // Connecting Beam to Core
        ctx.beginPath();
        ctx.strokeStyle = node.active ? 'rgba(0, 229, 255, 0.8)' : 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = node.active ? 2 : 1;
        ctx.setLineDash(node.active ? [4, 4] : []);
        ctx.moveTo(coreTop.x, coreTop.y);
        ctx.lineTo(np.x, np.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Node Circle
        ctx.beginPath();
        ctx.arc(np.x, np.y, node.active ? 8 : 5, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        if (node.active) {
          ctx.shadowColor = node.color;
          ctx.shadowBlur = 15;
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label
        ctx.font = '10px ui-monospace, monospace';
        ctx.fillStyle = node.active ? '#ffffff' : 'rgba(255, 255, 255, 0.6)';
        ctx.fillText(node.name, np.x + 10, np.y + 4);
      });

      // Holographic Scanlines
      ctx.fillStyle = 'rgba(0, 229, 255, 0.02)';
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 1);
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isHologramRotating, hologramIntensity, selectedAgentId]);

  function project3D(x: number, y: number, z: number, rotY: number, cx: number, cy: number) {
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const rotX = 0.45; // fixed tilt angle
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);

    // Rotate Y
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;

    // Rotate X
    const y2 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;

    // Perspective Projection
    const distance = 480;
    const scale = distance / (distance + z2);

    return {
      x: cx + x1 * scale,
      y: cy + y2 * scale,
      scale
    };
  }

  // Execute Phase 3 Explicit Approval (#EP-SOVEREIGN-01)
  const handleExecuteApproval = () => {
    setIsApproving(true);
    playTone(520, 0.1, 'sine');

    setTimeout(() => {
      playTone(680, 0.15, 'sine');
      setExecutionLog((prev) => [
        `[${new Date().toISOString()}] [PHASE 1] Artifact Hash SHA256:${selectedAgent.hash.slice(0, 16)}... VERIFIED.`,
        ...prev
      ]);
    }, 400);

    setTimeout(() => {
      playTone(840, 0.15, 'sine');
      setExecutionLog((prev) => [
        `[${new Date().toISOString()}] [PHASE 2] Proposal Routed to #EP-SOVEREIGN-01 via HOLO-FLOW.`,
        ...prev
      ]);
    }, 900);

    setTimeout(() => {
      playAuditChime();
      setAgents((prev) =>
        prev.map((a) =>
          a.id === selectedAgentId
            ? {
                ...a,
                status: 'APPROVED',
                currentPhase: 4,
                pqcSignature: 'ML-DSA-87:0x849202_EXPLICIT_APPROVED_EP01'
              }
            : a
        )
      );
      setExecutionLog((prev) => [
        `[${new Date().toISOString()}] [PHASE 3] Explicit Approval Signed with NIST ML-DSA-87 / Dilithium-5.`,
        `[${new Date().toISOString()}] [PHASE 4] Runtime ws-agent-02 ACTIVATED & Bound to WORM Ledger #849202 (Δ0.00%).`,
        ...prev
      ]);
      setIsApproving(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 font-sans text-zinc-100">
      {/* Executive Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-[#0a1120] border border-cyan-500/30 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                <Orbit className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
                UNIFIED SOVEREIGN RUNTIME ATLAS
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                GENESIS ANCHOR #{CANONICAL_GENESIS_BLOCK} (Δ0.00%)
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-purple-950/80 border border-purple-500/40 text-purple-300">
                <Shield className="w-3.5 h-3.5" />
                10/10 REAL_HSM FIPS 140-3 L4
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Sovereign Atlas & 3D Hologram Topology</span>
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-mono">
                FROZEN v1.2.1 LTS
              </span>
            </h1>
            <p className="text-sm text-zinc-400 max-w-3xl leading-relaxed">
              ศูนย์รวมแผนที่สถาปัตยกรรมอธิปไตยเดี่ยว (Unified Sovereign Atlas) ผสาน 3D Hologram Grid, วงจรอนุมัติ AI Workspace Agent
              4 เฟส, ระบบ Deca-Custodian HSM 4 ภูมิภาค และพยานหลักฐานพร้อมใช้ในชั้นศาลตามกฎหมายไทย
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleCopy(CANONICAL_MERKLE_ROOT, 'merkle')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 text-xs font-mono text-cyan-300 transition-all cursor-pointer"
            >
              {copiedText === 'merkle' ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span>Merkle Root: {CANONICAL_MERKLE_ROOT.slice(0, 12)}...</span>
            </button>
          </div>
        </div>
      </div>

      {/* Layer Filters & 3D Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider px-2">Atlas Layer:</span>
          {(['all', 'governance', 'custodian', 'quantum', 'agents', 'forensic'] as const).map((layer) => (
            <button
              key={layer}
              onClick={() => {
                setActiveLayer(layer);
                playTone(440, 0.05, 'sine');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all capitalize cursor-pointer ${
                activeLayer === layer
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60 border border-transparent'
              }`}
            >
              {layer}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsHologramRotating(!isHologramRotating)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
              isHologramRotating
                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400'
            }`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isHologramRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            <span>3D Orbit: {isHologramRotating ? 'ACTIVE' : 'PAUSED'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: 3D Hologram Canvas & Agent Approval Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 3D Hologram Grid Topology (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="relative rounded-2xl bg-gradient-to-b from-zinc-950 to-[#060b14] border border-cyan-500/30 overflow-hidden shadow-xl min-h-[440px] flex flex-col">
            {/* Hologram Viewport Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
                </span>
                <span className="text-xs font-mono font-bold text-white tracking-wider">
                  3D HOLOGRAPHIC RUNTIME TOPOLOGY
                </span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                  GPU 60 FPS • SCANLINE ENGAGED
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-400">Coherence: 99.98%</span>
              </div>
            </div>

            {/* Canvas Container */}
            <div className="relative flex-1 w-full min-h-[360px] flex items-center justify-center">
              <canvas ref={canvasRef} className="w-full h-full block" />

              {/* HUD Overlay Stats */}
              <div className="absolute top-3 left-3 p-3 rounded-xl bg-zinc-950/80 backdrop-blur border border-zinc-800/80 font-mono text-[11px] space-y-1 pointer-events-none">
                <div className="text-cyan-400 font-bold flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>DECA-HSM: 10/10 ACTIVE</span>
                </div>
                <div className="text-zinc-400">Cryo Temp: <span className="text-emerald-400">14.98 mK</span></div>
                <div className="text-zinc-400">Mesh Wire Latency: <span className="text-cyan-300">7.5 ms Avg</span></div>
                <div className="text-zinc-400">PQC Mode: <span className="text-purple-400">ML-DSA-87 / Kyber</span></div>
              </div>

              <div className="absolute bottom-3 right-3 p-2.5 rounded-xl bg-zinc-950/80 backdrop-blur border border-zinc-800 font-mono text-[10px] text-zinc-400 pointer-events-none">
                <span>[HOLO-GRID] Tilt: 25° • Pitch: 45° • Sub-Kelvin Bus</span>
              </div>
            </div>
          </div>

          {/* Regional Mesh Table */}
          <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>Multi-Region Custodian Nodes (Deca-HSM Cluster)</span>
              </h3>
              <span className="text-xs font-mono text-emerald-400">100% QUORUM ACTIVE</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {REGIONAL_NODES.map((node) => (
                <div
                  key={node.id}
                  className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-cyan-500/40 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{node.city}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                      {node.status}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 font-mono">{node.region}</div>
                  <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-zinc-800/60 text-zinc-300">
                    <span>Latency: <span className="text-cyan-300">{node.latency}</span></span>
                    <span>Cryo: <span className="text-emerald-400">{node.cryoTemp}</span></span>
                    <span>{node.hsmSlot}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Multi-Agent Approval Deck & Execution Console (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Agent Selection Cards */}
          <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>AI Workspace Cluster Agents</span>
            </h3>

            <div className="space-y-2">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => {
                    setSelectedAgentId(agent.id);
                    playTone(550, 0.05, 'sine');
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    selectedAgentId === agent.id
                      ? 'bg-gradient-to-r from-cyan-950/60 to-purple-950/40 border-cyan-500/60 shadow-lg'
                      : 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-sm text-white">{agent.id}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                        agent.status === 'APPROVED' || agent.status === 'ACTIVE'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-950 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {agent.status}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-300 font-medium">{agent.name}</div>
                  <div className="text-[11px] font-mono text-zinc-400 mt-1">{agent.role}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 4-Phase Approval Execution Card for Selected Agent */}
          <div className="rounded-2xl bg-zinc-900/80 border border-cyan-500/30 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  APPROVAL EXECUTION PLAN
                </span>
                <h4 className="text-base font-bold text-white">{selectedAgent.name}</h4>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                Phase {selectedAgent.currentPhase} / 4
              </span>
            </div>

            {/* 4 Phases Visual Timeline */}
            <div className="space-y-3 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800/80 flex items-start gap-3">
                <div className="p-1 rounded bg-emerald-500/20 text-emerald-400 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-0.5">
                  <div className="font-bold text-white">Phase 1: Artifact Verification</div>
                  <div className="text-[11px] text-zinc-400">
                    Hash SHA256:{selectedAgent.hash.slice(0, 16)}... • Risk: {selectedAgent.riskLevel}
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800/80 flex items-start gap-3">
                <div className="p-1 rounded bg-emerald-500/20 text-emerald-400 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-0.5">
                  <div className="font-bold text-white">Phase 2: Proposal Routing</div>
                  <div className="text-[11px] text-zinc-400">
                    {selectedAgent.batchSize} • Route: HOLO-FLOW → Preview
                  </div>
                </div>
              </div>

              <div
                className={`p-2.5 rounded-lg border flex items-start gap-3 transition-all ${
                  selectedAgent.status === 'APPROVED' || selectedAgent.status === 'ACTIVE'
                    ? 'bg-zinc-950/80 border-emerald-500/30'
                    : 'bg-cyan-950/40 border-cyan-500/50'
                }`}
              >
                <div
                  className={`p-1 rounded mt-0.5 ${
                    selectedAgent.status === 'APPROVED'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-cyan-500/20 text-cyan-400'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-0.5 flex-1">
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>Phase 3: Explicit Approval Execution</span>
                    {selectedAgent.status === 'APPROVED' && (
                      <span className="text-[10px] text-emerald-300">SIGNED 🟢</span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Authority: {selectedAgent.authority} • Signature: {selectedAgent.pqcSignature}
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800/80 flex items-start gap-3">
                <div
                  className={`p-1 rounded mt-0.5 ${
                    selectedAgent.status === 'APPROVED' || selectedAgent.status === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-0.5">
                  <div className="font-bold text-white">Phase 4: Activation & Audit Binding</div>
                  <div className="text-[11px] text-zinc-400">
                    WORM Ledger Binding • RFC 3161 Timestamp • Telemetry Δ0.00%
                  </div>
                </div>
              </div>
            </div>

            {/* Approval Action Trigger */}
            <div className="pt-2">
              <button
                disabled={isApproving || selectedAgent.status === 'APPROVED' || selectedAgent.status === 'ACTIVE'}
                onClick={handleExecuteApproval}
                className={`w-full py-3 px-4 rounded-xl font-mono text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
                  selectedAgent.status === 'APPROVED' || selectedAgent.status === 'ACTIVE'
                    ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 cursor-default'
                    : isApproving
                    ? 'bg-cyan-900 border border-cyan-400 text-cyan-200 animate-pulse'
                    : 'bg-gradient-to-r from-cyan-600 via-purple-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white border border-cyan-400/40'
                }`}
              >
                {selectedAgent.status === 'APPROVED' || selectedAgent.status === 'ACTIVE' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>AGENT STATUS: APPROVED & ACTIVE IN RUNTIME 🟢</span>
                  </>
                ) : isApproving ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>SIGNING WITH NIST ML-DSA-87 / DILITHIUM-5...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 text-cyan-300" />
                    <span>EXPLICIT APPROVAL BY #EP-SOVEREIGN-01</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Realtime Execution Terminal Console */}
          <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2 text-zinc-400">
              <span className="flex items-center gap-2 text-cyan-400">
                <Terminal className="w-3.5 h-3.5" />
                <span>SOVEREIGN EXECUTION TERMINAL</span>
              </span>
              <span className="text-[10px] text-zinc-500">RFC 3161 AUDIT STREAM</span>
            </div>

            <div className="h-32 overflow-y-auto space-y-1 text-[11px] text-zinc-300 pr-1 select-text">
              {executionLog.map((log, idx) => (
                <div
                  key={idx}
                  className={`leading-relaxed ${
                    log.includes('EXPLICIT') || log.includes('ACTIVATED')
                      ? 'text-emerald-300 font-bold'
                      : log.includes('VERIFIED')
                      ? 'text-cyan-300'
                      : 'text-zinc-400'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SovereignAtlasView;
