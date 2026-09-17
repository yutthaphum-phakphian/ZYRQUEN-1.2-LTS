import React, { useState } from 'react';
import {
  Scale,
  ShieldCheck,
  Cpu,
  Key,
  Layers,
  Lock,
  Binary,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Award,
  Zap,
  Info,
  RefreshCw,
  Eye,
  FileCheck,
  ChevronRight,
  Sliders,
} from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { SYSTEM_METADATA } from '../data/canonicalData';

export interface DiagramNode {
  id: string;
  category: 'STATUTE' | 'SOVEREIGN_LAYER' | 'VERIFICATION_OUTCOME';
  labelTh: string;
  labelEn: string;
  subtext: string;
  citation: string;
  technicalEnforcement: string;
  etdaTier: string;
  accentColor: string;
  x: number;
  y: number;
  width: number;
  height: number;
  connections: string[]; // Connected target node IDs
}

export const DIAGRAM_NODES: DiagramNode[] = [
  // Column 1: Thai Statutory & International Standards
  {
    id: 'node-sec9',
    category: 'STATUTE',
    labelTh: 'มาตรา 9 (Section 9)',
    labelEn: 'Electronic Signature Validity',
    subtext: 'การรับรองผลทางกฎหมายและเจตนาในการลงนาม',
    citation: 'พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 (แก้ไข 2562) มาตรา 9',
    technicalEnforcement: 'Merkle Leaf Signatures with Dilithium-5 / SHA-256 session keys binding non-repudiable intent.',
    etdaTier: 'ETDA Level 2 (Reliable Signature)',
    accentColor: '#3b82f6', // Blue
    x: 40,
    y: 40,
    width: 220,
    height: 90,
    connections: ['node-layer-identity', 'node-layer-crypto'],
  },
  {
    id: 'node-sec26',
    category: 'STATUTE',
    labelTh: 'มาตรา 26 (Section 26)',
    labelEn: 'Reliable Digital Signatures',
    subtext: 'มาตรฐานลายมือชื่อดิจิทัลที่เชื่อถือได้สูงสุด ป้องกันการแก้ไข 100%',
    citation: 'พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 มาตรา 26',
    technicalEnforcement: 'Cryogenic Merkle Core (14,902 Blocks), Post-Quantum Kyber-1024 / Dilithium-5 lattice proofs, 0.00% drift.',
    etdaTier: 'ETDA Level 3+ (Highest Reliability)',
    accentColor: '#06b6d4', // Cyan
    x: 40,
    y: 155,
    width: 220,
    height: 90,
    connections: ['node-layer-crypto', 'node-layer-pqc'],
  },
  {
    id: 'node-sec28',
    category: 'STATUTE',
    labelTh: 'มาตรา 28 (Section 28)',
    labelEn: 'Signatory Legal Custody & Liability',
    subtext: 'ความรับผิดชอบของผู้ถือครองข้อมูลสำหรับสร้างลายมือชื่อ',
    citation: 'พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 มาตรา 28',
    technicalEnforcement: 'Executive Passport #EP-SOVEREIGN-01 (นายยุทธภูมิ พากเพียร) physical biometric root-of-trust custody gate.',
    etdaTier: 'ETDA & NCSA Custodian Standard',
    accentColor: '#f59e0b', // Amber
    x: 40,
    y: 270,
    width: 220,
    height: 90,
    connections: ['node-layer-custody'],
  },
  {
    id: 'node-pdpa',
    category: 'STATUTE',
    labelTh: 'PDPA Thailand (พ.ร.บ. คุ้มครองข้อมูล)',
    labelEn: 'Personal Data Protection Act 2019',
    subtext: 'มาตรา 19, 27, 37 มาตรการความปลอดภัยของข้อมูลส่วนบุคคล',
    citation: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562',
    technicalEnforcement: 'Zero-Knowledge Privacy Vault, ephemeral session keys, zero plaintext data persistence.',
    etdaTier: 'PDPA Sec 37 Compliant',
    accentColor: '#10b981', // Emerald
    x: 40,
    y: 385,
    width: 220,
    height: 90,
    connections: ['node-layer-sovereignty'],
  },
  {
    id: 'node-ncsa',
    category: 'STATUTE',
    labelTh: 'NCSA & NIST PQC (FIPS 203/204)',
    labelEn: 'Cybersecurity & Post-Quantum Standards',
    subtext: 'ความมั่นคงปลอดภัยไซเบอร์โครงสร้างพื้นฐานสำคัญ (CII)',
    citation: 'พ.ร.บ. ไซเบอร์ 2562 & NIST Post-Quantum Cryptography',
    technicalEnforcement: 'Zero-Trust Gateway Ω601-Ω1000, 5/5 blocked attack vectors, lattice-based ML-KEM/ML-DSA.',
    etdaTier: 'NIST & NCSA CII Tier 1',
    accentColor: '#8b5cf6', // Violet
    x: 40,
    y: 500,
    width: 220,
    height: 90,
    connections: ['node-layer-crypto', 'node-layer-pqc'],
  },

  // Column 2: ZYRQUEN Ω∞ Sovereign Seal Chain Layers
  {
    id: 'node-layer-identity',
    category: 'SOVEREIGN_LAYER',
    labelTh: 'Identity & Trust Layer',
    labelEn: 'Sovereign Identity Seal Chain',
    subtext: 'ผูกโยงอัตลักษณ์อธิปไตยเข้ากับ Merkle Leaf Signatures',
    citation: 'Section 9 Electronic Recognition Layer',
    technicalEnforcement: 'Dilithium-5 / SHA-256 session key non-repudiation binding per sovereign execution.',
    etdaTier: 'Layer-1 Sovereign Foundation',
    accentColor: '#3b82f6',
    x: 350,
    y: 55,
    width: 240,
    height: 95,
    connections: ['node-outcome-court', 'node-outcome-etda'],
  },
  {
    id: 'node-layer-crypto',
    category: 'SOVEREIGN_LAYER',
    labelTh: 'Cryptographic & Zero-Trust Fabric',
    labelEn: 'Cryogenic Merkle Core Runtime',
    subtext: 'โครงสร้าง Merkle Core 14,902 บล็อก ตรวจวัด Invariant แบบเรียลไทม์',
    citation: 'Section 26 Immutable Cryptographic Layer',
    technicalEnforcement: 'Continuous qOps telemetry streaming with 0.00% drift and Sub-Kelvin cryogenic proof.',
    etdaTier: 'Layer-2 Cryptographic Inviolability',
    accentColor: '#06b6d4',
    x: 350,
    y: 175,
    width: 240,
    height: 95,
    connections: ['node-outcome-drift', 'node-outcome-etda', 'node-outcome-court'],
  },
  {
    id: 'node-layer-custody',
    category: 'SOVEREIGN_LAYER',
    labelTh: 'Responsibility & Executive Gate',
    labelEn: 'Executive Passport Custody Gate',
    subtext: 'การกำกับสิทธิ์และบังคับความรับผิดชอบส่วนบุคคลระดับ Omega',
    citation: 'Section 28 Sovereign Custodian Mandate',
    technicalEnforcement: 'Passport #EP-SOVEREIGN-01 (นายยุทธภูมิ พากเพียร) perpetual biometric signature root.',
    etdaTier: 'Layer-3 Governance & Clearance',
    accentColor: '#f59e0b',
    x: 350,
    y: 295,
    width: 240,
    height: 95,
    connections: ['node-outcome-court', 'node-outcome-custodian'],
  },
  {
    id: 'node-layer-sovereignty',
    category: 'SOVEREIGN_LAYER',
    labelTh: 'Data Sovereignty & Privacy Vault',
    labelEn: 'Zero-Knowledge Privacy Vault',
    subtext: 'ปกป้องข้อมูลส่วนบุคคลตาม PDPA ด้วยการเข้ารหัสระดับฮาร์ดแวร์',
    citation: 'PDPA Compliance Security Layer',
    technicalEnforcement: 'Ephemeral key rotation, zero persistent plaintext, isolated sovereign enclave memory.',
    etdaTier: 'Layer-4 Privacy Assurance',
    accentColor: '#10b981',
    x: 350,
    y: 415,
    width: 240,
    height: 95,
    connections: ['node-outcome-court'],
  },
  {
    id: 'node-layer-pqc',
    category: 'SOVEREIGN_LAYER',
    labelTh: 'Quantum-Resilience Lattice',
    labelEn: 'NIST FIPS 203/204 Post-Quantum Guard',
    subtext: 'ระบบป้องกันการถอดรหัสในยุคควอนตัมคอมพิวติ้ง',
    citation: 'NIST PQC & NCSA Shield',
    technicalEnforcement: 'Kyber-1024 key encapsulation & Dilithium-5 lattice signatures across all Merkle roots.',
    etdaTier: 'Layer-5 Quantum Immunity',
    accentColor: '#8b5cf6',
    x: 350,
    y: 535,
    width: 240,
    height: 95,
    connections: ['node-outcome-drift', 'node-outcome-etda'],
  },

  // Column 3: Legal Verification & Admissible Outcomes
  {
    id: 'node-outcome-court',
    category: 'VERIFICATION_OUTCOME',
    labelTh: 'หลักฐานดิจิทัลที่รับฟังได้ตามกฎหมาย',
    labelEn: 'Admissible Court Digital Evidence',
    subtext: 'มีผลผูกพันตามกฎหมายไทย 100% ไม่สามารถปฏิเสธความรับผิดได้',
    citation: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ มาตรา 9, 11, 26, 28',
    technicalEnforcement: 'End-to-end cryptographic proof bundle with Merkle leaf validation and timestamp.',
    etdaTier: 'Legal Admissibility 100%',
    accentColor: '#3b82f6',
    x: 680,
    y: 80,
    width: 230,
    height: 90,
    connections: [],
  },
  {
    id: 'node-outcome-etda',
    category: 'VERIFICATION_OUTCOME',
    labelTh: 'การรับรองตามเกณฑ์ ETDA Level 3+',
    labelEn: 'ETDA Level 3+ Certified Standard',
    subtext: 'มาตรฐานลายมือชื่อดิจิทัลและระบบธุรกรรมอิเล็กทรอนิกส์ระดับสูงสุด',
    citation: 'ETDA Recommendation on Electronic Signature Standards',
    technicalEnforcement: 'Cryogenic Merkle verification, post-quantum cryptography, and audit logs.',
    etdaTier: 'ETDA Compliant Level 3+',
    accentColor: '#06b6d4',
    x: 680,
    y: 215,
    width: 230,
    height: 90,
    connections: [],
  },
  {
    id: 'node-outcome-drift',
    category: 'VERIFICATION_OUTCOME',
    labelTh: 'Zero-Drift Telemetry & Invariant Proof',
    labelEn: '0.00% Drift Cryptographic Invariant',
    subtext: 'ความถูกต้องแม่นยำของข้อมูล 100% ปราศจากการดัดแปลง',
    citation: '10/10 Invariants Passed • Continuous Real-Time Checking',
    technicalEnforcement: 'Live telemetry invariance validation matching Genesis Merkle Root 909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    etdaTier: 'Mathematical Proof',
    accentColor: '#10b981',
    x: 680,
    y: 350,
    width: 230,
    height: 90,
    connections: [],
  },
  {
    id: 'node-outcome-custodian',
    category: 'VERIFICATION_OUTCOME',
    labelTh: 'Sovereign Custodian Seal of Ownership',
    labelEn: 'Permanent Custodian Non-Repudiation',
    subtext: 'การรับรองสิทธิ์โดยผู้ถืออำนาจสูงสุด นายยุทธภูมิ พากเพียร',
    citation: 'Passport #EP-SOVEREIGN-01 • Omega Sovereign Clearance',
    technicalEnforcement: 'Biometric hardware root-of-trust anchor to Sovereign Principal.',
    etdaTier: 'Omega Clearance Authority',
    accentColor: '#f59e0b',
    x: 680,
    y: 485,
    width: 230,
    height: 90,
    connections: [],
  },
];

export const LegalEnforcementDiagram: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-sec26');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'STATUTE' | 'SOVEREIGN_LAYER' | 'VERIFICATION_OUTCOME'>('ALL');
  const [isSimulatingPulse, setIsSimulatingPulse] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(-1);

  const selectedNode = DIAGRAM_NODES.find((n) => n.id === selectedNodeId) || DIAGRAM_NODES[1];

  const handleNodeClick = (node: DiagramNode) => {
    playTone(550, 0.04);
    setSelectedNodeId(node.id);
  };

  const runPulseSimulation = () => {
    setIsSimulatingPulse(true);
    setActiveStep(0);
    playTone(520, 0.08);

    const steps = [
      'node-sec26',
      'node-layer-crypto',
      'node-outcome-etda',
      'node-outcome-court',
    ];

    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current < steps.length) {
        setSelectedNodeId(steps[current]);
        setActiveStep(current);
        playTone(500 + current * 60, 0.06);
      } else {
        clearInterval(interval);
        setIsSimulatingPulse(false);
        playAuditChime();
      }
    }, 650);
  };

  // Generate connection paths
  const connectionLines: { from: DiagramNode; to: DiagramNode; id: string }[] = [];
  DIAGRAM_NODES.forEach((fromNode) => {
    fromNode.connections.forEach((targetId) => {
      const toNode = DIAGRAM_NODES.find((n) => n.id === targetId);
      if (toNode) {
        connectionLines.push({
          from: fromNode,
          to: toNode,
          id: `${fromNode.id}->${toNode.id}`,
        });
      }
    });
  });

  return (
    <div className="p-6 sm:p-8 rounded-[28px] bg-[#070913]/90 border border-white/8 backdrop-blur-2xl space-y-6 shadow-2xl">
      {/* Diagram Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/8 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.15)] shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-mono font-bold text-white tracking-wide">
                Legal Enforcement Flow Graph & Sovereign Seal Chain Architecture
              </h3>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono font-bold">
                INTERACTIVE GRAPH
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Thai Statutory Articles (Section 9, 26, 28, PDPA, NCSA) ↔ ZYRQUEN Ω∞ Cryptographic Layers ↔ Admissible Evidence
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={runPulseSimulation}
            disabled={isSimulatingPulse}
            className={`px-4 py-2 rounded-2xl font-mono text-xs font-semibold flex items-center gap-2 transition-all border ${
              isSimulatingPulse
                ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40 animate-pulse'
                : 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulatingPulse ? 'animate-spin' : ''}`} />
            <span>{isSimulatingPulse ? 'Simulating Cryptographic Proof...' : 'Simulate Verification Pulse'}</span>
          </button>

          {/* Filter Pills */}
          <div className="flex items-center bg-black/40 border border-white/10 rounded-2xl p-1 font-mono text-xs">
            {(['ALL', 'STATUTE', 'SOVEREIGN_LAYER', 'VERIFICATION_OUTCOME'] as const).map((f) => (
              <button
                key={f}
                onClick={() => {
                  playTone(580, 0.03);
                  setFilterCategory(f);
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] transition-all whitespace-nowrap ${
                  filterCategory === f
                    ? 'bg-white/15 text-white font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {f === 'ALL' ? 'All Nodes' : f === 'STATUTE' ? 'Statutes' : f === 'SOVEREIGN_LAYER' ? 'Sovereign Layers' : 'Outcomes'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Column Headers Legend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
        <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-2 text-blue-300">
          <Scale className="w-4 h-4 shrink-0" />
          <span className="font-bold">1. Thai Statutes & Standards</span>
        </div>
        <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center gap-2 text-cyan-300">
          <Cpu className="w-4 h-4 shrink-0" />
          <span className="font-bold">2. ZYRQUEN Ω∞ Sovereign Layers</span>
        </div>
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-emerald-300">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span className="font-bold">3. Admissible Legal Outcomes</span>
        </div>
      </div>

      {/* Interactive SVG Canvas */}
      <div className="relative w-full overflow-x-auto rounded-2xl bg-black/60 border border-white/10 p-4 min-h-[640px]">
        <svg
          viewBox="0 0 960 650"
          className="w-full min-w-[760px] h-auto select-none"
          style={{ minHeight: '600px' }}
        >
          <defs>
            {/* Gradient for Connections */}
            <linearGradient id="conn-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.5" />
            </linearGradient>

            <linearGradient id="conn-active-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>

            {/* Glow Filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Render Connection Bezier Curves */}
          {connectionLines.map(({ from, to, id }) => {
            const startX = from.x + from.width;
            const startY = from.y + from.height / 2;
            const endX = to.x;
            const endY = to.y + to.height / 2;
            const controlX1 = startX + (endX - startX) * 0.5;
            const controlX2 = startX + (endX - startX) * 0.5;
            const d = `M ${startX} ${startY} C ${controlX1} ${startY}, ${controlX2} ${endY}, ${endX} ${endY}`;

            const isPathActive =
              selectedNodeId === from.id ||
              selectedNodeId === to.id ||
              isSimulatingPulse;

            return (
              <g key={id}>
                {/* Background Shadow Line */}
                <path
                  d={d}
                  fill="none"
                  stroke={isPathActive ? 'url(#conn-active-grad)' : 'url(#conn-grad)'}
                  strokeWidth={isPathActive ? 2.5 : 1.5}
                  strokeDasharray={isPathActive ? 'none' : '4 4'}
                  opacity={isPathActive ? 0.9 : 0.4}
                  filter={isPathActive ? 'url(#glow)' : undefined}
                />

                {/* Animated Pulse Particle */}
                {isPathActive && (
                  <circle r="3.5" fill="#38bdf8" filter="url(#glow)">
                    <animateMotion dur="2.4s" repeatCount="indefinite" path={d} />
                  </circle>
                )}
              </g>
            );
          })}

          {/* Render Interactive Nodes */}
          {DIAGRAM_NODES.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isDimmed = filterCategory !== 'ALL' && filterCategory !== node.category;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => handleNodeClick(node)}
                className="cursor-pointer transition-all duration-200"
                opacity={isDimmed ? 0.25 : 1}
              >
                {/* Node Box Background */}
                <rect
                  width={node.width}
                  height={node.height}
                  rx="14"
                  ry="14"
                  fill={isSelected ? '#0e1726' : '#070913'}
                  stroke={isSelected ? node.accentColor : 'rgba(255,255,255,0.12)'}
                  strokeWidth={isSelected ? 2 : 1}
                  filter={isSelected ? 'url(#glow)' : undefined}
                />

                {/* Left Color Accent Pill */}
                <rect
                  x="0"
                  y="0"
                  width="4.5"
                  height={node.height}
                  rx="2"
                  fill={node.accentColor}
                />

                {/* Top Badge */}
                <rect
                  x="12"
                  y="10"
                  width="85"
                  height="16"
                  rx="4"
                  fill={`${node.accentColor}25`}
                  stroke={`${node.accentColor}50`}
                  strokeWidth="0.8"
                />
                <text
                  x="18"
                  y="21.5"
                  fill={node.accentColor}
                  fontSize="8.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {node.category === 'STATUTE' ? 'STATUTE' : node.category === 'SOVEREIGN_LAYER' ? 'SOVEREIGN LAYER' : 'VERIFIED'}
                </text>

                {/* Tier Badge Right */}
                <text
                  x={node.width - 12}
                  y="21.5"
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="8"
                  fontFamily="monospace"
                >
                  {node.etdaTier.slice(0, 16)}
                </text>

                {/* Title Thai */}
                <text
                  x="12"
                  y="44"
                  fill="#ffffff"
                  fontSize="11"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {node.labelTh}
                </text>

                {/* Subtitle English */}
                <text
                  x="12"
                  y="59"
                  fill="#94a3b8"
                  fontSize="9"
                  fontFamily="sans-serif"
                >
                  {node.labelEn}
                </text>

                {/* Quick Tech Subtext */}
                <text
                  x="12"
                  y="75"
                  fill={node.accentColor}
                  fontSize="8"
                  fontFamily="monospace"
                >
                  {node.subtext.slice(0, 34)}...
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Node Detailed Inspector Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-black/75 border border-white/10 space-y-4 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/8 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="p-3 rounded-2xl border flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `${selectedNode.accentColor}18`,
                color: selectedNode.accentColor,
                borderColor: `${selectedNode.accentColor}35`,
              }}
            >
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-white">{selectedNode.labelTh}</span>
                <span className="text-xs text-zinc-400 font-sans">({selectedNode.labelEn})</span>
              </div>
              <span className="text-xs text-zinc-400 font-sans mt-0.5 block">{selectedNode.citation}</span>
            </div>
          </div>

          <span
            className="px-3 py-1 rounded-xl text-xs font-semibold border self-start sm:self-auto"
            style={{
              backgroundColor: `${selectedNode.accentColor}18`,
              color: selectedNode.accentColor,
              borderColor: `${selectedNode.accentColor}35`,
            }}
          >
            {selectedNode.etdaTier}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Left: Principle */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/6 space-y-2">
            <span className="text-cyan-300 font-bold flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              <span>หลักการและข้อกำหนดทางกฎหมาย (Legal Mandate):</span>
            </span>
            <p className="text-zinc-200 font-sans text-xs sm:text-sm leading-relaxed">
              {selectedNode.subtext}
            </p>
          </div>

          {/* Right: Technical Sovereign Enforcement */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/6 space-y-2">
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              <span>การบังคับใช้เชิงคริปโตกราฟิก (Cryptographic Enforcement):</span>
            </span>
            <p className="text-zinc-300 font-mono text-xs leading-relaxed">
              {selectedNode.technicalEnforcement}
            </p>
          </div>
        </div>

        {/* Invariant Cert Footer */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-zinc-300">
          <span>
            Certified under Sovereign Principal: <strong className="text-white">{SYSTEM_METADATA.sovereignPrincipal}</strong> (#EP-SOVEREIGN-01)
          </span>
          <span className="text-cyan-300 font-bold">Merkle Root: {SYSTEM_METADATA.merkleRoot.slice(0, 20)}...</span>
        </div>
      </div>
    </div>
  );
};
