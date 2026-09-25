import React, { useState, useEffect } from 'react';
import { playTone } from './AudioSynthesizer';

export interface MeshNode {
  id: string;
  name: string;
  category: string;
  emoji: string;
  x: number;
  y: number;
  latency: number;
  heartbeat: number;
  packetsSent: number;
  status: 'ACTIVE' | 'SYNCING';
  endpoint: string;
  role: string;
}

export interface MeshLink {
  source: string;
  target: string;
  latency: number;
  active: boolean;
}

export const FederationMeshVisualizer: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<MeshNode | null>(null);
  const [isSimulating, setIsSimulating] = useState(true);

  const [nodes, setNodes] = useState<MeshNode[]>([
    {
      id: 'sovereignCore',
      name: 'Sovereign Core Node',
      category: 'Core',
      emoji: '🏛️',
      x: 300,
      y: 80,
      latency: 0.8,
      heartbeat: 62.4,
      packetsSent: 149020,
      status: 'ACTIVE',
      endpoint: '/api/ledger/block/849202',
      role: 'Block #849202 & 14,902 Seals SSoT Anchor',
    },
    {
      id: 'telemetry',
      name: 'Sub-Kelvin Telemetry Node',
      category: 'Telemetry',
      emoji: '📡',
      x: 480,
      y: 170,
      latency: 1.1,
      heartbeat: 62.1,
      packetsSent: 89430,
      status: 'ACTIVE',
      endpoint: '/api/v1/telemetry',
      role: '14.98 mK Sub-Kelvin OTLP Sensor Network',
    },
    {
      id: 'compliance',
      name: 'Safe Harbor Compliance Node',
      category: 'Compliance',
      emoji: '⚖️',
      x: 480,
      y: 350,
      latency: 1.4,
      heartbeat: 60.8,
      packetsSent: 42150,
      status: 'ACTIVE',
      endpoint: '/api/v1/pqc/dossier',
      role: 'ETDA & PDPA Sec 9, 26, 28 Court Dossier Validator',
    },
    {
      id: 'security',
      name: 'Zero-Trust HSM Vault Node',
      category: 'Security',
      emoji: '🛡️',
      x: 300,
      y: 440,
      latency: 0.9,
      heartbeat: 63.0,
      packetsSent: 184500,
      status: 'ACTIVE',
      endpoint: '/api/chamber/04/status',
      role: '10/10 REAL_HSM FIPS 140-3 L4 Enclave Quorum',
    },
    {
      id: 'commerce',
      name: 'Sovereign Treasury & RWA Node',
      category: 'Commerce',
      emoji: '💰',
      x: 120,
      y: 350,
      latency: 1.2,
      heartbeat: 61.5,
      packetsSent: 67320,
      status: 'ACTIVE',
      endpoint: '/api/treasury/assets',
      role: '1.49B THB-SOV + 14,902 oz XAU & Ω600_1000 Bound',
    },
    {
      id: 'visualization',
      name: '3D Quantum Matrix HUD Node',
      category: 'Visualization',
      emoji: '🎮',
      x: 120,
      y: 170,
      latency: 1.3,
      heartbeat: 62.8,
      packetsSent: 112800,
      status: 'ACTIVE',
      endpoint: '/api/chamber/16/status',
      role: 'Real-Time Hologram & Atlas Spatial Rendering',
    },
  ]);

  const links: MeshLink[] = [
    { source: 'sovereignCore', target: 'telemetry', latency: 0.8, active: true },
    { source: 'telemetry', target: 'compliance', latency: 1.2, active: true },
    { source: 'compliance', target: 'security', latency: 1.4, active: true },
    { source: 'security', target: 'commerce', latency: 0.9, active: true },
    { source: 'commerce', target: 'visualization', latency: 1.1, active: true },
    { source: 'visualization', target: 'sovereignCore', latency: 1.0, active: true },
    // Cross-mesh chords
    { source: 'sovereignCore', target: 'security', latency: 0.7, active: true },
    { source: 'telemetry', target: 'commerce', latency: 1.3, active: true },
    { source: 'compliance', target: 'visualization', latency: 1.2, active: true },
  ];

  // Dynamic heartbeat and latency simulation
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setNodes(prev =>
        prev.map(n => ({
          ...n,
          latency: +(n.latency + (Math.random() * 0.2 - 0.1)).toFixed(2),
          heartbeat: +(62.0 + (Math.random() * 2 - 1)).toFixed(1),
          packetsSent: n.packetsSent + Math.floor(Math.random() * 15 + 5),
        }))
      );
    }, 2500);

    return () => clearInterval(interval);
  }, [isSimulating]);

  const activeNode = selectedNode || nodes[0];

  return (
    <div id="federation-mesh-visualizer" className="w-full bg-[#070a12] border-[#06B6D4]/40 rounded-xl p-6 font-mono text-[#06B6D4] shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#0a0f1e] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🕸️</span>
            <h2 className="text-lg font-black tracking-wider text-[#D4AF37]">
              UNIVERSAL API FEDERATION MESH VISUALIZER
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic P2P BFT Node Graph • 6 Sovereign API Domains • 10/10 REAL_HSM Consensus • Ω600_1000
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              playTone(620, 0.02);
              setIsSimulating(!isSimulating);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded border transition-colors ${
              isSimulating
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400'
                : 'bg-[#0a0f1e] border-slate-700 text-slate-400'
            }`}
          >
            {isSimulating ? '⚡ Mesh Pulse Active' : '⏸️ Mesh Paused'}
          </button>
          <span className="px-3 py-1.5 bg-[#0a0f1e] border-[#D4AF37] text-[#D4AF37] text-xs font-bold rounded">
            Δ0.00% Zero Drift
          </span>
        </div>
      </div>

      {/* Main Node Graph Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* SVG Node Graph */}
        <div className="lg:col-span-8 bg-[#0a0f1e] border-[#06B6D4]/30 rounded-xl p-4 flex flex-col items-center justify-center relative min-h-[460px]">
          <svg viewBox="0 0 600 520" className="w-full max-w-[560px] h-[440px]">
            {/* Background Mesh Rings */}
            <circle cx="300" cy="260" r="180" fill="none" stroke="#070a12" strokeWidth="2" strokeDasharray="6 6" />
            <circle cx="300" cy="260" r="120" fill="none" stroke="#070a12" strokeWidth="1.5" />
            <circle cx="300" cy="260" r="40" fill="#070a12" stroke="#D4AF37" strokeWidth="1.5" />
            <text x="300" y="264" textAnchor="middle" fill="#D4AF37" fontSize="10" fontWeight="bold" fontFamily="monospace">
              Ω600_1000
            </text>

            {/* Links */}
            {links.map((link, idx) => {
              const srcNode = nodes.find(n => n.id === link.source);
              const tgtNode = nodes.find(n => n.id === link.target);
              if (!srcNode || !tgtNode) return null;

              const isConnectedToSelected =
                activeNode.id === srcNode.id || activeNode.id === tgtNode.id;

              return (
                <g key={idx}>
                  <line
                    x1={srcNode.x}
                    y1={srcNode.y}
                    x2={tgtNode.x}
                    y2={tgtNode.y}
                    stroke={isConnectedToSelected ? '#D4AF37' : '#06B6D4'}
                    strokeOpacity={isConnectedToSelected ? 0.9 : 0.25}
                    strokeWidth={isConnectedToSelected ? 2 : 1}
                    strokeDasharray={isConnectedToSelected ? 'none' : '4 4'}
                  />
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map(node => {
              const isSelected = activeNode.id === node.id;
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => {
                    playTone(650, 0.03);
                    setSelectedNode(node);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Outer pulse circle */}
                  <circle
                    r={isSelected ? 28 : 22}
                    fill="#070a12"
                    stroke={isSelected ? '#D4AF37' : '#06B6D4'}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />

                  {/* Emoji symbol */}
                  <text
                    x="0"
                    y="6"
                    textAnchor="middle"
                    fontSize={isSelected ? '18' : '14'}
                  >
                    {node.emoji}
                  </text>

                  {/* Node label */}
                  <text
                    x="0"
                    y="36"
                    textAnchor="middle"
                    fill={isSelected ? '#D4AF37' : '#94a3b8'}
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {node.name.split(' ')[0]}
                  </text>

                  {/* Latency badge */}
                  <text
                    x="0"
                    y="48"
                    textAnchor="middle"
                    fill="#10b981"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {node.latency}ms
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="w-full flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-900 px-2">
            <span>Mesh Protocols: PQC BFT Mesh (FIPS 203 / 204 / 205)</span>
            <span className="text-emerald-400 font-bold">100% Federation Heartbeat Green</span>
          </div>
        </div>

        {/* Selected Node Inspector Panel */}
        <div className="lg:col-span-4 bg-[#0a0f1e] border-[#D4AF37]/30 rounded-xl p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{activeNode.emoji}</span>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">{activeNode.category} Node</span>
                <h3 className="font-bold text-[#D4AF37] text-sm">{activeNode.name}</h3>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 border-emerald-500 text-emerald-400">
              {activeNode.status}
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="p-2.5 bg-[#070a12] border-slate-800 rounded space-y-1">
              <span className="text-slate-500 text-[10px] block">Role &amp; Jurisdiction</span>
              <div className="text-slate-200 font-bold">{activeNode.role}</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-[#070a12] border-slate-800 rounded">
                <span className="text-slate-500 text-[10px] block">Round-Trip Latency</span>
                <span className="text-emerald-400 font-bold">{activeNode.latency} ms</span>
              </div>
              <div className="p-2.5 bg-[#070a12] border-slate-800 rounded">
                <span className="text-slate-500 text-[10px] block">Heartbeat Frequency</span>
                <span className="text-cyan-400 font-bold">{activeNode.heartbeat} Hz</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-[#070a12] border-slate-800 rounded">
                <span className="text-slate-500 text-[10px] block">Packets Processed</span>
                <span className="text-purple-300 font-bold">{activeNode.packetsSent.toLocaleString()}</span>
              </div>
              <div className="p-2.5 bg-[#070a12] border-slate-800 rounded">
                <span className="text-slate-500 text-[10px] block">Quorum Consent</span>
                <span className="text-[#D4AF37] font-bold">10/10 REAL_HSM</span>
              </div>
            </div>

            <div className="p-2.5 bg-[#070a12] border-slate-800 rounded space-y-1">
              <span className="text-slate-500 text-[10px] block">Bound API Endpoint</span>
              <code className="text-[#06B6D4] text-[11px] block break-all">
                {activeNode.endpoint}
              </code>
            </div>

            <div className="p-2.5 bg-[#070a12] border-[#D4AF37]/30 rounded flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Boundary Multi-Tenant:</span>
              <span className="text-[#D4AF37] font-bold">Ω600_1000 (400 Locked)</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400">
            Principal: <strong className="text-slate-200">นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
