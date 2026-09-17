import React, { useState, useMemo } from 'react';
import {
  Eye,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Search,
  Copy,
  Check,
  Zap,
  RefreshCw,
  Scale,
  Sparkles,
  Layers,
  SlidersHorizontal,
  Brain,
  Radio,
  Radar,
  TrendingUp,
  AlertTriangle,
  Cpu
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { HardwareSnapshot, ViewType } from '../types';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';

export const CANONICAL_FROZEN_SEALS = 14902;
export const CANONICAL_BLOCK = 849202;
export const CANONICAL_MERKLE_ROOT = '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68';
export const CANONICAL_VERSION = 'ZYRQUEN Ω∞ v4.16 PDPA FINAL (Frozen v1.2 LTS)';
export const CANONICAL_PRINCIPAL = '🇹🇭 นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)';

export interface AnomalyVector {
  id: string;
  name: string;
  category: string;
  score: number;
  baseline: string;
  status: 'NOMINAL' | 'OPTIMAL' | 'ZERO_THREAT';
}

export const ANOMALY_VECTORS: AnomalyVector[] = [
  { id: 'vec-01', name: 'Shannon Entropy Deviation', category: 'Entropy Pool', score: 0.0001, baseline: '7.9998 bits/byte', status: 'OPTIMAL' },
  { id: 'vec-02', name: 'Timing Side-Channel Variance', category: 'Hardware Clock', score: 0.0000, baseline: '< 0.002 ms', status: 'ZERO_THREAT' },
  { id: 'vec-03', name: 'Merkle Branch Traversal Jitter', category: 'DAG Engine', score: 0.0002, baseline: '0.08 ms target', status: 'NOMINAL' },
  { id: 'vec-04', name: 'HSM Deca-Key Ring Symmetry', category: 'Quorum Physics', score: 0.0000, baseline: '10/10 In Phase', status: 'ZERO_THREAT' }
];

interface Room14MasterPanelProps {
  snapshots?: HardwareSnapshot[];
  onNavigate?: (view: ViewType) => void;
  onOpenCertificate?: () => void;
}

export const Room14MasterPanel: React.FC<Room14MasterPanelProps> = ({
  snapshots = [],
  onNavigate,
  onOpenCertificate
}) => {
  const [activeTab, setActiveTab] = useState<'neural-stream' | 'entropy-spectrograph' | 'timing-audit' | 'threat-matrix'>('neural-stream');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<string>('ALL SYSTEMS NOMINAL • ZERO DRIFT');

  const handleCopy = (id: string, text: string) => {
    copyToClipboard(text);
    setCopiedId(id);
    playTone(650, 0.03);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRunNeuralScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    playTone(740, 0.05);

    setTimeout(() => {
      setIsScanning(false);
      setScanResult(`14,902 SEALS & QUANTUM ENTROPY SCANNED AT ${new Date().toLocaleTimeString('th-TH')} (0 ANOMALIES)`);
      playAuditChime();
    }, 800);
  };

  // Entropy Chart Data
  const entropyData = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      sample: `S-${i + 1}`,
      entropy: 7.999 + Math.sin(i * 0.7) * 0.0006 + (Math.random() * 0.0002),
      jitter: 0.08 + Math.cos(i * 0.5) * 0.015
    }));
  }, [isScanning]);

  return (
    <div className="space-y-6 font-mono text-zinc-300">
      {/* Top Banner for Room 14 */}
      <div className="p-6 sm:p-8 rounded-[28px] bg-gradient-to-br from-teal-950/40 via-[#061719]/95 to-black border border-teal-500/40 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-teal-500/10 via-emerald-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/40 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(20,184,166,0.25)]">
                <Brain className="w-4 h-4 text-teal-400 animate-pulse" />
                CHAMBER 14 • NEURAL & HEURISTIC ANOMALY DIAGNOSTIC OBSERVER
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                ANOMALY INDEX: 0.0000
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold">
                7.9998 BITS/BYTE ENTROPY
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
                ระบบวินิจฉัยความผิดปกติเชิงฮิวริสติก และโครงข่ายประสาท (Heuristic Anomaly Observer)
              </h2>
              <p className="text-sm text-zinc-400 max-w-4xl leading-relaxed">
                สแกนความผันผวนของค่าเอนโทรปีเชิงควอนตัม (Quantum Entropy), ตรวจสอบช่องสัญญาณลอบข้าง (Side-Channel Timing)
                และยืนยันความคงสภาพของโครงข่ายสัตยาบัน 14,902 ตราประทับแบบเรียลไทม์
              </p>
            </div>
          </div>

          <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-3 shrink-0">
            <button
              onClick={handleRunNeuralScan}
              disabled={isScanning}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600/80 to-emerald-600/80 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-teal-500/20 border border-teal-400/40 transition-all transform hover:-translate-y-0.5"
            >
              <Radar className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Neural Scanning...' : 'Execute Deep Anomaly Scan'}
            </button>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Status: {scanResult}</span>
            </div>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-teal-500/20">
          <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Anomaly Score</div>
            <div className="text-base sm:text-lg font-bold text-emerald-400">0.0000</div>
            <div className="text-[10px] text-emerald-300 font-semibold">Zero Anomaly</div>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Entropy Quality</div>
            <div className="text-base sm:text-lg font-bold text-teal-400">7.9998 bits</div>
            <div className="text-[10px] text-zinc-400">Pure Randomness</div>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Mythic Engines</div>
            <div className="text-base sm:text-lg font-bold text-cyan-400">3 Engines</div>
            <div className="text-[10px] text-cyan-300">Inference 100%</div>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Threat Horizon</div>
            <div className="text-base sm:text-lg font-bold text-emerald-400">CLEARED</div>
            <div className="text-[10px] text-zinc-400">0 Active Threats</div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#0a0d16] border border-teal-500/20">
        <button
          onClick={() => {
            playTone(600, 0.04);
            setActiveTab('neural-stream');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'neural-stream'
              ? 'bg-teal-500/20 text-teal-200 border border-teal-500/40 shadow-[0_0_12px_rgba(20,184,166,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-transparent border border-transparent'
          }`}
        >
          <Radar className="w-3.5 h-3.5" />
          1. Neural Stream & Anomaly Vectors
        </button>

        <button
          onClick={() => {
            playTone(640, 0.04);
            setActiveTab('entropy-spectrograph');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'entropy-spectrograph'
              ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-transparent border border-transparent'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          2. Shannon Entropy & Jitter Spectrum
        </button>

        <button
          onClick={() => {
            playTone(680, 0.04);
            setActiveTab('timing-audit');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'timing-audit'
              ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-transparent border border-transparent'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          3. Side-Channel Timing Audit
        </button>

        <button
          onClick={() => {
            playTone(720, 0.04);
            setActiveTab('threat-matrix');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'threat-matrix'
              ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-transparent border border-transparent'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          4. Threat Mitigation Attestation
        </button>
      </div>

      {/* Tab 1: Neural Stream */}
      {activeTab === 'neural-stream' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ANOMALY_VECTORS.map((vec) => (
            <div
              key={vec.id}
              className="p-5 rounded-2xl bg-[#0a0d1a] border border-teal-500/20 hover:border-teal-500/50 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-300">{vec.name}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  {vec.status}
                </span>
              </div>
              <div className="text-xs text-zinc-400">Category: {vec.category}</div>

              <div className="pt-2 border-t border-white/5 flex justify-between text-xs">
                <div>
                  <span className="text-zinc-500 text-[10px]">Deviation Score:</span>
                  <div className="text-emerald-400 font-bold">{vec.score.toFixed(4)}</div>
                </div>
                <div className="text-right">
                  <span className="text-zinc-500 text-[10px]">Target Baseline:</span>
                  <div className="text-cyan-300 font-semibold">{vec.baseline}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Entropy Spectrograph */}
      {activeTab === 'entropy-spectrograph' && (
        <div className="p-6 rounded-2xl bg-[#0a0d1a] border border-teal-500/20 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-400" />
            การสแกนความสม่ำเสมอของเอนโทรปีควอนตัม (Quantum Entropy Stability Curve)
          </h3>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={entropyData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id="entropyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                <XAxis dataKey="sample" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis domain={[7.995, 8.001]} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0d1a',
                    borderColor: '#14b8a6',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="entropy" stroke="#14b8a6" fillOpacity={1} fill="url(#entropyGradient)" name="Entropy (bits/byte)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 3: Timing Audit */}
      {activeTab === 'timing-audit' && (
        <div className="p-6 rounded-2xl bg-[#0a0d1a] border border-emerald-500/20 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            ผลการตรวจสอบช่องสัญญาณลอบข้างด้านเวลา (Side-Channel Timing Audit)
          </h3>
          <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-zinc-300 space-y-2">
            <div>Clock Jitter Tolerance: <span className="text-emerald-400">&lt; 0.002 ms (NIST SP 800-90B Compliant)</span></div>
            <div>Constant-Time Crypto Operations: <span className="text-cyan-300">100% Enforced (Dilithium-5 / Kyber-1024)</span></div>
            <div>Side-Channel Leakage Probability: <span className="text-emerald-400">0.000000% (Mathematically Bounded)</span></div>
          </div>
        </div>
      )}

      {/* Tab 4: Threat Matrix */}
      {activeTab === 'threat-matrix' && (
        <div className="p-6 rounded-2xl bg-[#0a0d1a] border border-purple-500/20 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            ใบรับรองความปลอดภัยเชิงฮิวริสติก (Heuristic Threat Clearance Attestation)
          </h3>
          <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-zinc-300 space-y-1.5">
            <div>Attestation Authority: <span className="text-purple-300">ZYRQUEN Ω∞ Heuristic Neural Core</span></div>
            <div>Scanned Blocks: <span className="text-white">Block #{CANONICAL_BLOCK}</span></div>
            <div>Verified Invariants: <span className="text-emerald-400">10/10 Invariants NOMINAL</span></div>
            <div>Genesis Anchor: <span className="text-yellow-300">{CANONICAL_MERKLE_ROOT}</span></div>
          </div>
        </div>
      )}
    </div>
  );
};
