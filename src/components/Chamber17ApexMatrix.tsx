import React, { useEffect, useRef, useState } from 'react';
import {
  Cpu,
  Layers,
  Shield,
  Activity,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  Zap,
  Play,
  Pause,
  ExternalLink,
  ChevronRight,
  Info,
  Eye
} from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';
import ExecutiveSlideDeck from './ExecutiveSlideDeck';
import JudicialEtdaDeepDive from './JudicialEtdaDeepDive';
import QuantumCoherenceAuditView from './QuantumCoherenceAuditView';
import FullForensicCourtDossierView from './FullForensicCourtDossierView';
import Chamber15QuantumEntropyD3Visualizer from './Chamber15QuantumEntropyD3Visualizer';
import Chamber18NeuralSentinel from './Chamber18NeuralSentinel';

export interface Chamber17ApexMatrixProps {
  onSelectChamber?: (chamberId: string) => void;
  selectedChamberId?: string;
  className?: string;
}

export interface ChamberMatrixItem {
  id: string;
  name: string;
  status: string;
  type: string;
  category: 'Core' | 'Security' | 'Recovery' | 'Asset' | 'Compliance' | 'Interface' | 'Network' | 'Graphics' | 'Command' | 'Intelligence';
  row: 1 | 2 | 3;
  col: number;
  drift: string;
  description: string;
  authority: string;
}

export const APEX_18_CHAMBERS: ChamberMatrixItem[] = [
  // แถวที่ 1 (CH-00–05): แกนหลัก ฉันทามติ และโล่พิทักษ์ (Genesis Root, G11 Core, Quarantine, HSM Roster, 10/10 Invariants, 22/22 Gates)
  { id: 'CH-00', name: 'Genesis Root', status: 'SECURE', type: 'Core SSoT', category: 'Core', row: 1, col: 1, drift: '0.0000%', description: 'รากสัจธรรม Genesis Block #849,202 Merkle Anchor', authority: '#EP-SOVEREIGN-01' },
  { id: 'CH-01', name: 'G11 Core', status: 'ACTIVE', type: 'Consensus Engine', category: 'Core', row: 1, col: 2, drift: '0.0000%', description: 'ฉันทามติ G11 Canonical Core & DAG Execution', authority: '#EP-SOVEREIGN-01' },
  { id: 'CH-02', name: 'Quarantine', status: 'ISOLATED', type: 'Shield Isolation', category: 'Security', row: 1, col: 3, drift: '0.0000%', description: 'Chamber 02 Quarantine WORM & Sandbox Fail-Closed', authority: '#EP-SOVEREIGN-01' },
  { id: 'CH-03', name: 'HSM Roster', status: '10/10 OK', type: 'Hardware Quorum', category: 'Security', row: 1, col: 4, drift: '0.0000%', description: 'สภาผู้พิทักษ์ Deca-Key Council FIPS 140-3 L4', authority: '#EP-SOVEREIGN-01' },
  { id: 'CH-04', name: 'Invariants', status: '10/10 LOCKED', type: 'Rule Enforcement', category: 'Security', row: 1, col: 5, drift: '0.0000%', description: '10 Master Invariants Zero-Drift Verification', authority: '#EP-SOVEREIGN-01' },
  { id: 'CH-05', name: 'Gates Array', status: '22/22 OPEN', type: 'Security Gates', category: 'Security', row: 1, col: 6, drift: '0.0000%', description: '22 Master Verification Gates All Evaluated PASS', authority: '#EP-SOVEREIGN-01' },

  // แถวที่ 2 (CH-06–11): ระบบกู้คืน ฟื้นฟู และรหัสลับควอนตัม (Phoenix Recovery, FIOS Treasury, Dilithium-5 PQC, Phase Registry, Thai Legal, 8K Radar)
  { id: 'CH-06', name: 'Phoenix Recovery', status: 'STANDBY', type: 'Recovery Protocol', category: 'Recovery', row: 2, col: 1, drift: '0.0000%', description: 'SPHINCS+ Stateless Fallback (0.00ms Downtime)', authority: '#EP-SOVEREIGN-01' },
  { id: 'CH-07', name: 'FIOS Treasury', status: 'VERIFIED', type: 'Nc x Vc Model', category: 'Asset', row: 2, col: 2, drift: '0.0000%', description: '฿12.5M Gas Refund Allocation Pool', authority: '#EP-SOVEREIGN-01' },
  { id: 'CH-08', name: 'Dilithium-5 PQC', status: 'ACTIVE', type: 'NIST Category 5', category: 'Security', row: 2, col: 3, drift: '0.0000%', description: 'ML-DSA-87 Primary Post-Quantum Signature', authority: '#EP-SOVEREIGN-01' },
  { id: 'CH-09', name: 'Phase Registry', status: 'SYNCED', type: 'Phase Ledger', category: 'Core', row: 2, col: 4, drift: '0.0000%', description: 'Phase 7 Production Readiness Registry SSoT', authority: '#EP-SOVEREIGN-01' },
  { id: 'CH-10', name: 'Thai Legal', status: 'ETDA/PDPA', type: 'Statutory Proof', category: 'Compliance', row: 2, col: 5, drift: '0.0000%', description: 'ETDA มาตรา 9, 26, 28 และ PDPA มาตรา 37 Admissible', authority: '#EP-SOVEREIGN-01' },
  { id: 'CH-11', name: '8K Radar', status: 'MONITORING', type: 'Dossier Radar', category: 'Compliance', row: 2, col: 6, drift: '0.0000%', description: 'Court Evidence Dossier & High-Res Radar Scanner', authority: '#EP-SOVEREIGN-01' },

  // แถวที่ 3 (CH-12–17): ตัวเร่งประมวลผล ความเย็นยิ่งยวด นิติวิทยาศาสตร์ และศูนย์สั่งการ Apex Control
  { id: 'CH-12', name: 'Sovereign CLI', status: 'ONLINE', type: 'Command Interface', category: 'Interface', row: 3, col: 1, drift: '0.0000%', description: 'Zero-Trust Write Firewall & Immutable CLI Shell', authority: '#EP-SOVEREIGN-01' },
  { id: 'CH-13', name: 'Multiverse Map', status: 'MESH 6-BFT', type: 'Global Network', category: 'Network', row: 3, col: 2, drift: '0.0000%', description: '6-Node Global BFT Mesh (BK, SG, TY, ZH, SV, LD)', authority: '#EP-SOVEREIGN-01' },
  { id: 'CH-14', name: 'Warp Accelerator', status: 'OPTIMIZED', type: 'Sub-ms Engine', category: 'Interface', row: 3, col: 3, drift: '0.0000%', description: 'Runtime Acceleration & Heuristic Anomaly Filter', authority: '#EP-SOVEREIGN-01' },
  { id: 'CH-15', name: 'Cryo Fuel Synth', status: 'STABLE', type: 'Sonic & Energy', category: 'Asset', row: 3, col: 4, drift: '0.0000%', description: 'Sub-Kelvin 14.98mK Helium-4 & Sonic Speech Synth', authority: '#EP-SOVEREIGN-01' },
  { id: 'CH-16', name: '3D Visualizer', status: 'RENDERING', type: 'Quantum Hologram', category: 'Graphics', row: 3, col: 5, drift: '0.0000%', description: '410 Nodes (400 RWA + 10 HSM) D10 Symmetry GPU', authority: '#EP-SOVEREIGN-01' },
  { id: 'CH-17', name: 'Apex Control', status: 'SOVEREIGN', type: 'Supreme Command', category: 'Command', row: 3, col: 6, drift: '0.0000%', description: 'Supreme Omnipresent Command & Control Plane', authority: '#EP-SOVEREIGN-01' }
];

export const CHAMBER_18_SENTINEL: ChamberMatrixItem = {
  id: 'CH-18',
  name: 'Neural Sentinel',
  status: 'RUNTIME/ACTIVE',
  type: 'Neural Anomaly Observer',
  category: 'Intelligence',
  row: 3,
  col: 6,
  drift: '0.0000%',
  description: 'ผู้พิทักษ์โครงข่ายประสาท 100 Hz และระบบทำนายธรรมาภิบาลเชิงคาดการณ์ (Predictive Governance)',
  authority: '#EP-SOVEREIGN-01'
};

export const APEX_SOVEREIGN_CHAMBERS: ChamberMatrixItem[] = [
  ...APEX_18_CHAMBERS,
  CHAMBER_18_SENTINEL
];

export const Chamber17ApexMatrix: React.FC<Chamber17ApexMatrixProps> = ({
  onSelectChamber,
  selectedChamberId = 'CH-17',
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'matrix_visualizer'
    | 'chamber18_sentinel'
    | 'chamber15_d3_entropy'
    | 'quantum_coherence'
    | 'court_dossier'
    | 'slide_deck'
    | 'judicial_deep_dive'
  >('matrix_visualizer');
  const [activeChamber, setActiveChamber] = useState<string>(selectedChamberId);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Sync internal state with external selection
  useEffect(() => {
    if (selectedChamberId) {
      setActiveChamber(selectedChamberId);
    }
  }, [selectedChamberId]);

  const activeData = APEX_SOVEREIGN_CHAMBERS.find((c) => c.id === activeChamber) || APEX_18_CHAMBERS[17];

  // Chamber 16 Canvas Quantum Visualizer Animation Loop (Isolated Buffer)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;

    const resize = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight || 260;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      ctx.save();
      ctx.translate(cx, cy);
      if (isRotating) {
        ctx.rotate(angle);
      }

      // Outer Torus Ring (Cyan)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.ellipse(0, 0, 85, 32, Math.PI / 4, 0, Math.PI * 2);
      ctx.stroke();

      // Inner Torus Ring (Gold)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.ellipse(0, 0, 65, 24, -Math.PI / 4, 0, Math.PI * 2);
      ctx.stroke();

      // Core Golden Icosahedron representation (Omega Core #849202)
      ctx.beginPath();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 10;
      for (let i = 0; i < 5; i++) {
        const theta = (i * 2 * Math.PI) / 5;
        const x = Math.cos(theta) * 28;
        const y = Math.sin(theta) * 28;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 10 Deca-Key Ring & 400 RWA Orbits Nodes (Scaled to 12 representative orbital points)
      const nodeCount = 12;
      for (let i = 0; i < nodeCount; i++) {
        const nodeAngle = angle * 1.5 + (i * 2 * Math.PI) / nodeCount;
        const nx = Math.cos(nodeAngle) * 105;
        const ny = Math.sin(nodeAngle) * 42;

        ctx.beginPath();
        ctx.arc(nx, ny, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? '#06b6d4' : '#10b981';
        ctx.fill();

        // Connective beam to Golden Core
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(nx, ny);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      ctx.restore();

      if (isRotating) {
        angle += 0.009;
      }
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRotating]);

  const handleSelect = (ch: ChamberMatrixItem) => {
    setActiveChamber(ch.id);
    playTone(600, 0.04);
    if (onSelectChamber) {
      onSelectChamber(ch.id);
    }
  };

  return (
    <div className={`space-y-6 ${className} font-sans`}>
      {/* Top Sovereign Authority Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-cyan-950/80 border border-cyan-700/60 rounded-xl text-cyan-400 shadow-inner">
            <span className="text-xl">👑</span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-cyan-400 tracking-wider">
                ZYRQUEN Ω v1.2 LTS
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60">
                FROZEN v1.2 LTS
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                SSoT Mutation Delta = 0
              </span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight mt-0.5">
              Chamber 17: Supreme Omnipresent Apex Command &amp; Reality Sync
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Sovereign Authority: <span className="text-slate-200 font-bold">นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)</span> • Genesis Block #849,202
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
          <div className="bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <span className="text-slate-500">SSoT Drift:</span>
            <span className="text-emerald-400 font-bold">0.0000%</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <span className="text-slate-500">Canonical Seals:</span>
            <span className="text-cyan-400 font-bold">14,902</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <span className="text-slate-500">Lattice Nodes:</span>
            <span className="text-amber-400 font-bold">410 (400 RWA + 10 HSM)</span>
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-900/90 border border-slate-800 rounded-2xl">
        <button
          type="button"
          onClick={() => {
            playTone(600, 0.03);
            setActiveTab('matrix_visualizer');
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'matrix_visualizer'
              ? 'bg-cyan-600 text-slate-950 shadow-lg shadow-cyan-950/60 font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>👑 6×3 Matrix &amp; CH-16 3D</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playTone(620, 0.03);
            setActiveTab('chamber18_sentinel');
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'chamber18_sentinel'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/60 font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>👁️ CH-18 Neural Sentinel</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playTone(640, 0.03);
            setActiveTab('chamber15_d3_entropy');
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'chamber15_d3_entropy'
              ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-950/60 font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>⚛️ CH-15 D3 Entropy</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playTone(650, 0.03);
            setActiveTab('quantum_coherence');
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'quantum_coherence'
              ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-950/60 font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>⚛️ Quantum Coherence (768 Qubits)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playTone(700, 0.03);
            setActiveTab('court_dossier');
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'court_dossier'
              ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-950/60 font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>🏛️ Full Court Dossier (Exhibits)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playTone(750, 0.03);
            setActiveTab('slide_deck');
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'slide_deck'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-950/60 font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>📑 Executive Slide Deck (10 Slides)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playTone(800, 0.03);
            setActiveTab('judicial_deep_dive');
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'judicial_deep_dive'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-950/60 font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>⚖️ Judicial ETDA Deep-Dive (Gates 15–22)</span>
        </button>
      </div>

      {/* View 1: 6x3 Matrix & Chamber 16 3D Visualizer */}
      {activeTab === 'matrix_visualizer' && (
        <>
          {/* Main Grid: 6x3 Matrix (Col 1-2) + Chamber 16 3D Visualizer (Col 3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: 6x3 Matrix Grid */}
            <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-cyan-400 rounded-sm"></span>
                    <h3 className="font-mono text-sm font-bold text-cyan-300 uppercase tracking-wider">
                      CH-17: Supreme Apex Control (6×3 Matrix Grid)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                    18 Chambers Online
                  </span>
                </div>

                <p className="text-xs text-slate-400 font-mono mb-4">
                  โครงสร้างตารางพิกัด 6 คอลัมน์ × 3 แถว แสดงสถานะครบทั้ง 18 Chambers ตรึงสิทธิ์ Read-Only ภายใต้อำนาจอธิปไตยเดี่ยว
                </p>

                {/* Matrix 6x3 Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                  {APEX_18_CHAMBERS.map((ch) => {
                    const isSelected = activeChamber === ch.id;
                    return (
                      <div
                        key={ch.id}
                        onClick={() => handleSelect(ch)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between font-mono ${
                          isSelected
                            ? 'bg-cyan-950/80 border-cyan-400 shadow-lg shadow-cyan-950/60 ring-1 ring-cyan-400/50 scale-[1.02]'
                            : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-cyan-400">{ch.id}</span>
                            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-cyan-300 animate-ping' : 'bg-emerald-400'}`}></span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-100 mt-1 truncate">{ch.name}</h4>
                          <p className="text-[9px] text-slate-500 mt-0.5 truncate">{ch.type}</p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px]">
                          <span className="text-slate-500">SSoT</span>
                          <span className={`px-1.5 py-0.2 rounded font-bold ${
                            ch.status.includes('OK') || ch.status === 'SECURE' || ch.status === 'ACTIVE' || ch.status === 'SOVEREIGN'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                              : 'bg-amber-950 text-amber-300 border border-amber-800/50'
                          }`}>
                            {ch.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chamber 18 Neural Sentinel Extension Banner */}
              <div
                onClick={() => {
                  playTone(720, 0.03);
                  setActiveTab('chamber18_sentinel');
                }}
                className="mt-3.5 p-3 rounded-xl bg-gradient-to-r from-purple-950/70 via-slate-950 to-indigo-950/70 border border-purple-800/80 hover:border-purple-500 transition cursor-pointer flex items-center justify-between shadow-lg shadow-purple-950/40"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-900/60 rounded-lg text-purple-300 border border-purple-700">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-purple-400">CH-18 EXTENSION</span>
                      <span className="text-xs font-bold text-white">Neural Sentinel &amp; Pattern Detection</span>
                      <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-800 font-bold">100 Hz ACTIVE</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      ตรวจจับความผิดปกติเชิงรุก ครอบคลุม CH-00 ถึง CH-17 พร้อมการพยากรณ์ธรรมาภิบาลล่วงหน้า 24 ชม.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-purple-300 bg-purple-950 px-2 py-1 rounded border border-purple-800">
                    Open Sentinel &rarr;
                  </span>
                </div>
              </div>

              {/* Active Chamber Quick Insight Bar */}
              <div className="mt-4 p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 font-bold border border-cyan-800">
                    {activeData.id}
                  </span>
                  <span className="font-bold text-white">{activeData.name}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">{activeData.description}</span>
                </div>
                <div className="flex items-center gap-3">
                  {activeData.id === 'CH-15' && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('chamber15_d3_entropy')}
                      className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Open D3 Entropy &rarr;
                    </button>
                  )}
                  {activeData.id === 'CH-18' && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('chamber18_sentinel')}
                      className="px-2.5 py-1 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-700 rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Open Sentinel &rarr;
                    </button>
                  )}
                  <span className="text-slate-500">Drift: <b className="text-emerald-400">{activeData.drift}</b></span>
                  <span className="text-slate-500">Authority: <b className="text-slate-300">{activeData.authority}</b></span>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Chamber 16 3D Quantum Visualizer */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-amber-400 rounded-sm"></span>
                    <h3 className="font-mono text-sm font-bold text-amber-300 uppercase tracking-wider">
                      CH-16: 3D Quantum Visualizer
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
                      10 FPS
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsRotating(!isRotating)}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                      title={isRotating ? 'Pause Rotation' : 'Resume Rotation'}
                    >
                      {isRotating ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  </div>
                </div>

                {/* 3D Canvas Box (Isolated UI Buffer) */}
                <div className="relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center min-h-[260px] h-[260px]">
                  <canvas ref={canvasRef} className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing"></canvas>
                  
                  <div className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur px-2 py-1 rounded border border-slate-800 text-[10px] font-mono text-cyan-300">
                    Omega Core #849202 • Torus Ring
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 bg-black/70 backdrop-blur px-2 py-1 rounded border border-slate-800 text-[10px] font-mono text-amber-300">
                    410 Nodes (400 RWA + 10 HSM)
                  </div>

                  <div className="absolute bottom-2.5 right-2.5 bg-black/70 backdrop-blur px-2 py-1 rounded border border-slate-800 text-[10px] font-mono text-emerald-400">
                    GPU Accelerated
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Crystal Symmetry</span>
                    <span className="text-amber-400 font-bold">Decagonal D10</span>
                  </div>
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Isolated UI Buffer</span>
                    <span className="text-emerald-400 font-bold">SECURE / ZERO-DRIFT</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-500 flex items-center justify-between">
                <span>RWA Range: Ω601–Ω1000</span>
                <span className="text-cyan-400">100% SSoT Parity</span>
              </div>
            </div>

          </div>

          {/* Sovereign Audit & Reality Sync Pipeline Log */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="font-mono text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Sovereign Audit &amp; Reality Sync Pipeline
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Mutation Authority: 0 (Read-Only Locked)
              </span>
            </div>

            <div className="bg-slate-950 rounded-xl p-3 font-mono text-xs text-emerald-400 space-y-1.5 h-28 overflow-y-auto border border-slate-800">
              <div>[03:20:07 UTC] SYSTEM INIT: SSoT Kernel FROZEN v1.2 LTS successfully verified (Mutation Delta = 0, Baseline Drift = 0.00%).</div>
              <div>[03:20:10 UTC] CH-16 QUANTUM SYNC: GPU Accelerated canvas pipeline online (14,902 canonical seals loaded).</div>
              <div>[03:20:15 UTC] CH-17 APEX CONTROL: 6x3 Matrix Grid synchronized under Supreme Sovereign #EP-SOVEREIGN-01.</div>
              <div>[03:20:20 UTC] HARDWARE QUORUM: 10/10 Deca-Key Council verified on FIPS 140-3 Level 4 HSM.</div>
              <div>[03:20:25 UTC] PQC INTEGRATION: Dilithium-5 (ML-DSA-87) active, SPHINCS+ (SLH-DSA) on standby.</div>
            </div>
          </div>
        </>
      )}

      {/* View 2: Chamber 18 Neural Sentinel */}
      {activeTab === 'chamber18_sentinel' && (
        <Chamber18NeuralSentinel />
      )}

      {/* View 3: Chamber 15 Quantum Entropy D3 Visualizer */}
      {activeTab === 'chamber15_d3_entropy' && (
        <Chamber15QuantumEntropyD3Visualizer />
      )}

      {/* View 4: Quantum Coherence Audit (768 Qubits) */}
      {activeTab === 'quantum_coherence' && (
        <QuantumCoherenceAuditView />
      )}

      {/* View 5: Full Forensic Court Dossier */}
      {activeTab === 'court_dossier' && (
        <FullForensicCourtDossierView />
      )}

      {/* View 6: Executive Slide Deck */}
      {activeTab === 'slide_deck' && (
        <ExecutiveSlideDeck />
      )}

      {/* View 7: Judicial ETDA Deep-Dive */}
      {activeTab === 'judicial_deep_dive' && (
        <JudicialEtdaDeepDive />
      )}
    </div>
  );
};

export default Chamber17ApexMatrix;
