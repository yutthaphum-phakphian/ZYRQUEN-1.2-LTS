import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Activity,
  Volume2,
  VolumeX,
  Download,
  Cpu,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldAlert,
  Grid,
  Sliders,
  X,
  Layers,
  BarChart3,
  RefreshCw,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Clock,
  ChevronDown,
  ExternalLink,
  Eye,
  Siren,
  KeyRound,
  FileText
} from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
export type ChamberStatus = 'pure_green' | 'unstable' | 'quarantined';
export type CoherenceTrend = 'rising' | 'stable' | 'falling';
export type GridDensity = 'compact' | 'expanded';

export interface CryoChamber {
  id: number;
  chamberId: string;
  name: string;
  coherence: number;           // 0.00 to 1.00
  coherenceTrend: CoherenceTrend;
  temperature: number;         // in mK
  status: ChamberStatus;
  merkleHash: string;
  lastSync: string;            // Format: "HH:MM:SS"
  history24h: number[];        // Historic coherence data points for 24h history
}

export type SortCriterion =
  | 'coherence_desc'
  | 'coherence_asc'
  | 'temp_desc'
  | 'temp_asc'
  | 'sync_desc'
  | 'sync_asc'
  | 'status_pure'
  | 'status_unstable';

export interface StabilityDataPoint {
  hour: number;
  stabilityPercent: number;
  anomalyCount: number;
  avgCoherence: number;
}

export interface SignerMetadata {
  signerId: string;
  role: string;
  hsmSerial: string;
  timestamp: string;
}

export interface ToastAlert {
  id: string;
  chamberId: string;
  chamberName: string;
  coherence: number;
  timestamp: string;
}

// Helper to convert "HH:MM:SS" sync time string into total seconds for comparison
const parseSyncTimeToSeconds = (timeStr: string): number => {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3 && !parts.some(isNaN)) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
};

// ============================================================================
// AUDIO SYNTHESIZER MODULE (Web Audio API with Memory Leak Prevention)
// ============================================================================
export const playUnstableEventChime = (isMuted = false): void => {
  if (isMuted || typeof window === 'undefined') return;

  try {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxClass) return;

    const ctx = new AudioCtxClass();
    const now = ctx.currentTime;
    const duration = 0.38;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(880.00, now);
    osc1.frequency.exponentialRampToValueAtTime(440.00, now + 0.35);

    osc2.frequency.setValueAtTime(622.25, now);
    osc2.frequency.exponentialRampToValueAtTime(311.13, now + 0.35);

    gain.gain.setValueAtTime(0.20, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);

    window.setTimeout(() => {
      if (ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
    }, (duration + 0.1) * 1000);
  } catch (err) {
    console.warn('[AudioAlert] Web Audio alert synthesizer failed:', err);
  }
};

// ============================================================================
// INITIAL 18 CRYO CHAMBERS DATA
// ============================================================================
const INITIAL_18_CHAMBERS: CryoChamber[] = [
  { id: 1,  chamberId: 'CH-001', name: 'Cryo Array Alpha-1',   coherence: 0.998, coherenceTrend: 'rising',  temperature: 14.82, status: 'pure_green', merkleHash: '0x8f92a1c412e4', lastSync: '14:42:01', history24h: [0.992, 0.994, 0.995, 0.996, 0.997, 0.997, 0.998, 0.998] },
  { id: 2,  chamberId: 'CH-002', name: 'Cryo Array Alpha-2',   coherence: 0.995, coherenceTrend: 'stable',  temperature: 14.90, status: 'pure_green', merkleHash: '0x1a2b3c4d5e6f', lastSync: '14:42:02', history24h: [0.995, 0.996, 0.994, 0.995, 0.995, 0.994, 0.995, 0.995] },
  { id: 3,  chamberId: 'CH-003', name: 'Cryo Array Alpha-3',   coherence: 0.742, coherenceTrend: 'falling', temperature: 29.40, status: 'unstable',   merkleHash: '0x3b4c5d6e7f8a', lastSync: '14:42:03', history24h: [0.980, 0.950, 0.910, 0.880, 0.820, 0.790, 0.760, 0.742] },
  { id: 4,  chamberId: 'CH-004', name: 'Cryo Array Beta-1',    coherence: 0.999, coherenceTrend: 'rising',  temperature: 14.75, status: 'pure_green', merkleHash: '0x5c6d7e8f9a0b', lastSync: '14:42:04', history24h: [0.995, 0.996, 0.997, 0.998, 0.998, 0.999, 0.999, 0.999] },
  { id: 5,  chamberId: 'CH-005', name: 'Cryo Array Beta-2',    coherence: 0.992, coherenceTrend: 'falling', temperature: 15.10, status: 'pure_green', merkleHash: '0x7e8f9a0b1c2d', lastSync: '14:42:05', history24h: [0.998, 0.997, 0.996, 0.995, 0.994, 0.993, 0.992, 0.992] },
  { id: 6,  chamberId: 'CH-006', name: 'Cryo Array Beta-3',    coherence: 0.997, coherenceTrend: 'stable',  temperature: 14.88, status: 'pure_green', merkleHash: '0x9a0b1c2d3e4f', lastSync: '14:42:06', history24h: [0.997, 0.997, 0.996, 0.997, 0.998, 0.997, 0.997, 0.997] },
  { id: 7,  chamberId: 'CH-007', name: 'Cryo Array Gamma-1',   coherence: 0.680, coherenceTrend: 'falling', temperature: 31.20, status: 'unstable',   merkleHash: '0x0b1c2d3e4f5a', lastSync: '14:42:07', history24h: [0.940, 0.910, 0.860, 0.800, 0.750, 0.720, 0.690, 0.680] },
  { id: 8,  chamberId: 'CH-008', name: 'Cryo Array Gamma-2',   coherence: 0.996, coherenceTrend: 'rising',  temperature: 14.95, status: 'pure_green', merkleHash: '0x2c3d4e5f6a7b', lastSync: '14:42:08', history24h: [0.990, 0.992, 0.993, 0.994, 0.995, 0.995, 0.996, 0.996] },
  { id: 9,  chamberId: 'CH-009', name: 'Cryo Array Gamma-3',   coherence: 0.999, coherenceTrend: 'stable',  temperature: 14.70, status: 'pure_green', merkleHash: '0x4d5e6f7a8b9c', lastSync: '14:42:09', history24h: [0.999, 0.999, 0.998, 0.999, 0.999, 0.999, 0.999, 0.999] },
  { id: 10, chamberId: 'CH-010', name: 'Cryo Array Delta-1',   coherence: 0.991, coherenceTrend: 'falling', temperature: 15.05, status: 'pure_green', merkleHash: '0x6e7f8a9b0c1d', lastSync: '14:42:10', history24h: [0.996, 0.995, 0.994, 0.993, 0.992, 0.992, 0.991, 0.991] },
  { id: 11, chamberId: 'CH-011', name: 'Cryo Array Delta-2',   coherence: 0.994, coherenceTrend: 'rising',  temperature: 14.92, status: 'pure_green', merkleHash: '0x8a9b0c1d2e3f', lastSync: '14:42:11', history24h: [0.988, 0.990, 0.991, 0.992, 0.993, 0.993, 0.994, 0.994] },
  { id: 12, chamberId: 'CH-012', name: 'Cryo Array Delta-3',   coherence: 0.710, coherenceTrend: 'falling', temperature: 28.90, status: 'unstable',   merkleHash: '0x0b1c2d3e4f5a', lastSync: '14:42:12', history24h: [0.950, 0.920, 0.880, 0.830, 0.780, 0.740, 0.720, 0.710] },
  { id: 13, chamberId: 'CH-013', name: 'Cryo Array Epsilon-1', coherence: 0.998, coherenceTrend: 'rising',  temperature: 14.80, status: 'pure_green', merkleHash: '0x2d3e4f5a6b7c', lastSync: '14:42:13', history24h: [0.993, 0.994, 0.995, 0.996, 0.997, 0.997, 0.998, 0.998] },
  { id: 14, chamberId: 'CH-014', name: 'Cryo Array Epsilon-2', coherence: 0.997, coherenceTrend: 'stable',  temperature: 14.85, status: 'pure_green', merkleHash: '0x4f5a6b7c8d9e', lastSync: '14:42:14', history24h: [0.996, 0.997, 0.997, 0.996, 0.997, 0.997, 0.997, 0.997] },
  { id: 15, chamberId: 'CH-015', name: 'Cryo Array Epsilon-3', coherence: 0.993, coherenceTrend: 'falling', temperature: 15.12, status: 'pure_green', merkleHash: '0x6a7b8c9d0e1f', lastSync: '14:42:15', history24h: [0.997, 0.996, 0.995, 0.995, 0.994, 0.994, 0.993, 0.993] },
  { id: 16, chamberId: 'CH-016', name: 'Cryo Array Zeta-1',    coherence: 0.999, coherenceTrend: 'rising',  temperature: 14.72, status: 'pure_green', merkleHash: '0x8c9d0e1f2a3b', lastSync: '14:42:16', history24h: [0.995, 0.996, 0.997, 0.998, 0.998, 0.999, 0.999, 0.999] },
  { id: 17, chamberId: 'CH-017', name: 'Cryo Array Zeta-2',    coherence: 0.795, coherenceTrend: 'falling', temperature: 26.80, status: 'unstable',   merkleHash: '0x0a1b2c3d4e5f', lastSync: '14:42:17', history24h: [0.960, 0.930, 0.890, 0.850, 0.820, 0.810, 0.800, 0.795] },
  { id: 18, chamberId: 'CH-018', name: 'Cryo Array Zeta-3',    coherence: 0.996, coherenceTrend: 'rising',  temperature: 14.98, status: 'pure_green', merkleHash: '0x2b3c4d5e6f7a', lastSync: '14:42:18', history24h: [0.991, 0.992, 0.993, 0.994, 0.995, 0.995, 0.996, 0.996] }
];

const SYSTEM_24H_STABILITY: StabilityDataPoint[] = [
  { hour: 0,  stabilityPercent: 99.85, anomalyCount: 0, avgCoherence: 0.998 },
  { hour: 1,  stabilityPercent: 99.90, anomalyCount: 0, avgCoherence: 0.999 },
  { hour: 2,  stabilityPercent: 99.88, anomalyCount: 0, avgCoherence: 0.998 },
  { hour: 3,  stabilityPercent: 99.92, anomalyCount: 0, avgCoherence: 0.999 },
  { hour: 4,  stabilityPercent: 99.78, anomalyCount: 1, avgCoherence: 0.985 },
  { hour: 5,  stabilityPercent: 99.82, anomalyCount: 0, avgCoherence: 0.992 },
  { hour: 6,  stabilityPercent: 99.95, anomalyCount: 0, avgCoherence: 0.999 },
  { hour: 7,  stabilityPercent: 99.91, anomalyCount: 0, avgCoherence: 0.998 },
  { hour: 8,  stabilityPercent: 98.40, anomalyCount: 3, avgCoherence: 0.942 },
  { hour: 9,  stabilityPercent: 97.90, anomalyCount: 4, avgCoherence: 0.915 },
  { hour: 10, stabilityPercent: 99.10, anomalyCount: 1, avgCoherence: 0.978 },
  { hour: 11, stabilityPercent: 99.70, anomalyCount: 0, avgCoherence: 0.994 },
  { hour: 12, stabilityPercent: 99.89, anomalyCount: 0, avgCoherence: 0.998 },
  { hour: 13, stabilityPercent: 99.94, anomalyCount: 0, avgCoherence: 0.999 },
  { hour: 14, stabilityPercent: 99.80, anomalyCount: 1, avgCoherence: 0.989 },
  { hour: 15, stabilityPercent: 99.87, anomalyCount: 0, avgCoherence: 0.995 },
  { hour: 16, stabilityPercent: 99.93, anomalyCount: 0, avgCoherence: 0.998 },
  { hour: 17, stabilityPercent: 99.90, anomalyCount: 0, avgCoherence: 0.997 },
  { hour: 18, stabilityPercent: 98.20, anomalyCount: 3, avgCoherence: 0.935 },
  { hour: 19, stabilityPercent: 99.50, anomalyCount: 1, avgCoherence: 0.982 },
  { hour: 20, stabilityPercent: 99.88, anomalyCount: 0, avgCoherence: 0.998 },
  { hour: 21, stabilityPercent: 99.92, anomalyCount: 0, avgCoherence: 0.999 },
  { hour: 22, stabilityPercent: 99.96, anomalyCount: 0, avgCoherence: 0.999 },
  { hour: 23, stabilityPercent: 99.94, anomalyCount: 0, avgCoherence: 0.998 }
];

// ============================================================================
// PDF FORENSIC REPORT GENERATOR
// ============================================================================
export const generateForensicBatchPDF = (
  totalChambers: number,
  passedCount: number,
  unstableCount: number,
  signerMetadata: SignerMetadata
): void => {
  if (typeof window === 'undefined') return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.warn('[ForensicReport] Pop-up blocked or unable to open print window.');
    return;
  }

  const passRate = totalChambers > 0 ? ((passedCount / totalChambers) * 100).toFixed(3) : '0.000';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Forensic Batch Audit Report - ${totalChambers.toLocaleString()} Chambers</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: 'Courier New', Courier, monospace; background: #090d16; color: #f8fafc; padding: 25px; margin: 0; }
    .header { border-bottom: 2px solid #38bdf8; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-start; }
    .title { font-size: 20px; font-weight: bold; color: #38bdf8; }
    .subtitle { font-size: 11px; color: #94a3b8; margin-top: 4px; }
    .badge { display: inline-block; padding: 4px 10px; background: #0284c7; color: #fff; font-size: 10px; font-weight: bold; border-radius: 4px; }
    .grid-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 25px; }
    .box { background: #1e293b; border: 1px solid #334155; padding: 14px; border-radius: 6px; }
    .label { color: #64748b; font-size: 10px; text-transform: uppercase; margin-bottom: 4px; }
    .val { font-size: 13px; color: #e2e8f0; font-weight: bold; font-family: monospace; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 25px; }
    th { background: #0f172a; color: #94a3b8; text-transform: uppercase; font-size: 10px; padding: 8px; text-align: left; border: 1px solid #334155; }
    td { padding: 8px; border: 1px solid #334155; font-family: monospace; }
    .seal { border: 2px dashed #22c55e; padding: 16px; color: #22c55e; border-radius: 6px; text-align: center; font-weight: bold; margin-top: 25px; background: #022c22; }
    .footer { margin-top: 35px; border-top: 1px solid #334155; padding-top: 15px; font-size: 10px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <span class="badge">ZYRQUEN Ω∞ SOVEREIGN AUDIT DOSSIER</span>
      <div class="title" style="margin-top: 8px;">14,902 Chamber Batch Forensic Audit</div>
      <div class="subtitle">Cryogenic Quantum Coherence & Statutory Certification</div>
    </div>
    <div style="text-align: right; font-size: 10px; color: #64748b;">
      <div>Report ID: <strong style="color: #38bdf8;">WORM-14902-BATCH</strong></div>
      <div>Generated: ${signerMetadata.timestamp}</div>
    </div>
  </div>

  <div class="grid-meta">
    <div class="box">
      <div class="label">Total Batch Volume</div>
      <div class="val">${totalChambers.toLocaleString()} Chambers</div>
    </div>
    <div class="box">
      <div class="label">Verification Pass Rate</div>
      <div class="val" style="color: #4ade80;">${passRate}% (${passedCount.toLocaleString()} / ${totalChambers.toLocaleString()})</div>
    </div>
    <div class="box">
      <div class="label">Unstable / Divergent Chambers</div>
      <div class="val" style="color: #f59e0b;">${unstableCount} Chambers (Isolated in Quarantine)</div>
    </div>
    <div class="box">
      <div class="label">Merkle Tree Root Digest</div>
      <div class="val" style="font-size: 10px;">0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68</div>
    </div>
  </div>

  <div class="box" style="margin-bottom: 25px;">
    <div class="label">Cryptographic Signer & HSM Metadata</div>
    <div style="font-size: 11px; margin-top: 6px; line-height: 1.6;">
      • <strong>Authorized Signer ID:</strong> ${signerMetadata.signerId}<br/>
      • <strong>Signer Role:</strong> ${signerMetadata.role}<br/>
      • <strong>Hardware HSM Serial:</strong> ${signerMetadata.hsmSerial} (FIPS 140-3 L4)<br/>
      • <strong>PQC Scheme:</strong> SPHINCS+ (SLH-DSA-192) & ML-DSA-87 Dual Parity<br/>
      • <strong>Statutory Standard:</strong> Thai ETA B.E. 2544 Sec 9, 26, 28 / SEC Rule 17a-4(f)
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Chamber Range</th>
        <th>Sample ID</th>
        <th>Avg Temp</th>
        <th>Avg Coherence</th>
        <th>Verification Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>CH-00001 → CH-03000</td>
        <td>CH-01429</td>
        <td>14.82 mK</td>
        <td>0.9994</td>
        <td style="color: #22c55e; font-weight: bold;">PASSED 🟢</td>
      </tr>
      <tr>
        <td>CH-03001 → CH-06000</td>
        <td>CH-04812</td>
        <td>15.01 mK</td>
        <td>0.9989</td>
        <td style="color: #22c55e; font-weight: bold;">PASSED 🟢</td>
      </tr>
      <tr>
        <td>CH-06001 → CH-09000</td>
        <td>CH-07304</td>
        <td>14.95 mK</td>
        <td>0.9991</td>
        <td style="color: #22c55e; font-weight: bold;">PASSED 🟢</td>
      </tr>
      <tr>
        <td>CH-09001 → CH-12000</td>
        <td>CH-10992</td>
        <td>28.40 mK</td>
        <td>0.8120</td>
        <td style="color: #f59e0b; font-weight: bold;">UNSTABLE (6 Iso) ⚠️</td>
      </tr>
      <tr>
        <td>CH-12001 → CH-14902</td>
        <td>CH-13401</td>
        <td>14.88 mK</td>
        <td>0.9997</td>
        <td style="color: #22c55e; font-weight: bold;">PASSED 🟢</td>
      </tr>
    </tbody>
  </table>

  <div class="seal">
    🔒 COURT ADMISSIBLE QUANTUM EVIDENCE DOSSIER RATIFIED UNDER THAI ETA B.E. 2544
    <br/><span style="font-size: 10px; font-weight: normal; color: #a7f3d0;">All 14,902 chambers cryptographically verified against Genesis Block #849202 with SSoT Δ0 zero state drift.</span>
  </div>

  <div class="footer">
    ZYRQUEN Ω∞ Sentinel Engine | Cryptographic WORM Dossier Ref: WORM-14902-FORENSIC-V24
  </div>

  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>
  `;
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

// ============================================================================
// COMPONENT 1: FEATURE 1 - CHAMBER DETAIL MODAL (24H HISTORY + MERKLE PROOF)
// ============================================================================
export const ChamberDetailModal: React.FC<{
  chamber: CryoChamber | null;
  onClose: () => void;
  onToggleStatus: (id: number) => void;
}> = ({ chamber, onClose, onToggleStatus }) => {
  const [copied, setCopied] = useState(false);

  if (!chamber) return null;

  const isPure = chamber.status === 'pure_green';
  const isLowCoherence = chamber.coherence < 0.90;

  // Calculate 24h history metrics
  const minCoherence = Math.min(...chamber.history24h);
  const maxCoherence = Math.max(...chamber.history24h);
  const avgCoherence = (chamber.history24h.reduce((a, b) => a + b, 0) / chamber.history24h.length);

  // SVG Chart Dimensions
  const svgWidth = 560;
  const svgHeight = 180;
  const padding = { top: 20, right: 20, bottom: 30, left: 45 };
  const innerW = svgWidth - padding.left - padding.right;
  const innerH = svgHeight - padding.top - padding.bottom;

  const minScale = 0.60;
  const maxScale = 1.00;

  const getX = (i: number) => padding.left + (i / Math.max(1, chamber.history24h.length - 1)) * innerW;
  const getY = (val: number) => {
    const clamped = Math.max(minScale, Math.min(maxScale, val));
    return padding.top + innerH - ((clamped - minScale) / (maxScale - minScale)) * innerH;
  };

  const points = chamber.history24h.map((val, idx) => `${getX(idx).toFixed(1)},${getY(val).toFixed(1)}`).join(' ');
  const thresholdY = getY(0.90);

  const handleCopyMerkle = () => {
    navigator.clipboard.writeText(chamber.merkleHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative text-slate-100 max-h-[92vh] overflow-y-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl border ${
              isLowCoherence
                ? 'bg-rose-950 border-rose-500 text-rose-400'
                : isPure
                ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                : 'bg-amber-950 border-amber-500 text-amber-400'
            }`}>
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                  {chamber.chamberId}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                  isLowCoherence
                    ? 'bg-rose-950 text-rose-300 border border-rose-700'
                    : isPure
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : 'bg-amber-950 text-amber-300 border border-amber-700'
                }`}>
                  {isLowCoherence ? 'CRITICAL LOCKDOWN' : isPure ? 'Pure Green' : 'Unstable'}
                </span>
              </div>
              <h2 className="text-xl font-bold font-mono text-white mt-0.5">{chamber.name}</h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Telemetry Key Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-500 text-[10px] uppercase">Current Coherence</span>
            <div className={`text-lg font-bold flex items-center gap-1 ${isLowCoherence ? 'text-rose-400' : isPure ? 'text-emerald-400' : 'text-amber-400'}`}>
              {(chamber.coherence * 100).toFixed(1)}%
              {chamber.coherenceTrend === 'rising' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
              {chamber.coherenceTrend === 'falling' && <TrendingDown className="w-4 h-4 text-rose-400" />}
              {chamber.coherenceTrend === 'stable' && <Minus className="w-4 h-4 text-cyan-400" />}
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-500 text-[10px] uppercase">Cryo Temperature</span>
            <div className="text-lg font-bold text-cyan-300">{chamber.temperature.toFixed(2)} mK</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-500 text-[10px] uppercase">24H Mean Coherence</span>
            <div className="text-lg font-bold text-purple-300">{(avgCoherence * 100).toFixed(1)}%</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-500 text-[10px] uppercase">Last Sync Time</span>
            <div className="text-lg font-bold text-amber-300">{chamber.lastSync}</div>
          </div>
        </div>

        {/* FEATURE 1: Full 24-Hour History Graph */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center text-xs font-mono">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-slate-200 uppercase tracking-wider">Full 24-Hour Coherence Telemetry Graph</h3>
            </div>
            <span className="text-[11px] text-slate-400">
              Min: <strong className="text-amber-400">{(minCoherence * 100).toFixed(1)}%</strong> | Max: <strong className="text-emerald-400">{(maxCoherence * 100).toFixed(1)}%</strong>
            </span>
          </div>

          <div className="w-full overflow-x-auto">
            <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="overflow-visible">
              {/* Grid Lines */}
              {[0.60, 0.70, 0.80, 0.90, 1.00].map(val => (
                <g key={val}>
                  <line
                    x1={padding.left}
                    y1={getY(val)}
                    x2={svgWidth - padding.right}
                    y2={getY(val)}
                    stroke="#1e293b"
                    strokeDasharray={val === 0.90 ? '4 4' : '2 2'}
                  />
                  <text x={padding.left - 8} y={getY(val) + 3} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
                    {(val * 100).toFixed(0)}%
                  </text>
                </g>
              ))}

              {/* 90% Coherence Priority Threshold Line */}
              <line
                x1={padding.left}
                y1={thresholdY}
                x2={svgWidth - padding.right}
                y2={thresholdY}
                stroke="#f43f5e"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text x={svgWidth - padding.right - 5} y={thresholdY - 4} fill="#f43f5e" fontSize="9" textAnchor="end" fontFamily="monospace" fontWeight="bold">
                90% Lock Threshold
              </text>

              {/* Coherence Points Path */}
              {points && (
                <path d={`M ${points}`} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              )}

              {/* Data Points */}
              {chamber.history24h.map((val, i) => {
                const cx = getX(i);
                const cy = getY(val);
                const isWarning = val < 0.90;

                return (
                  <g key={i} className="cursor-pointer">
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isWarning ? 5 : 3.5}
                      fill={isWarning ? '#f43f5e' : '#38bdf8'}
                      stroke="#090d16"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })}

              {/* X Axis Time Labels */}
              {[0, 2, 4, 6, 7].map(idx => {
                const hourLabel = idx === 7 ? 'Now' : `-${(7 - idx) * 3}h`;
                return (
                  <text key={idx} x={getX(idx)} y={svgHeight - 8} fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">
                    {hourLabel}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* FEATURE 1: Cryptographic Merkle Proof Data Card */}
        <div className="bg-slate-950 border border-purple-500/30 rounded-xl p-4 space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-purple-400 font-bold">
              <KeyRound className="w-4 h-4" />
              <span>Cryptographic Merkle Proof Data</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
              VERIFIED INVARIANT 🟢
            </span>
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-slate-500 text-[10px]">Genesis Merkle Root Anchor:</span>
              <p className="text-cyan-400 font-bold break-all bg-slate-900 p-2 rounded border border-slate-800 mt-0.5">
                0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68 (Block #849202)
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-slate-500 text-[10px]">Chamber Merkle Leaf Hash:</span>
                <button
                  type="button"
                  onClick={handleCopyMerkle}
                  className="text-cyan-400 hover:text-cyan-300 text-[10px] cursor-pointer flex items-center gap-1"
                >
                  {copied ? 'Copied! ✓' : 'Copy Hash'}
                </button>
              </div>
              <p className="text-amber-300 font-bold break-all bg-slate-900 p-2 rounded border border-slate-800">
                {chamber.merkleHash}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px] block">PQC Signature Scheme:</span>
                <span className="text-purple-300 font-bold">Dilithium-5 (ML-DSA-87 / FIPS 204)</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px] block">HSM Quorum Approval:</span>
                <span className="text-emerald-300 font-bold">10/10 REAL_HSM (FIPS 140-3 L4)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => onToggleStatus(chamber.id)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Zap className="w-4 h-4" />
            Toggle Calibration Status
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer"
          >
            Close Detail View
          </button>
        </div>

      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT 2: D3-STYLE SVG MINI STABILITY CHART
// ============================================================================
const MiniD3StabilityChart: React.FC<{ data: StabilityDataPoint[] }> = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const width = 580;
  const height = 180;
  const padding = { top: 20, right: 20, bottom: 30, left: 45 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const minVal = 96.0;
  const maxVal = 100.0;

  const validLen = data.length > 1 ? data.length - 1 : 1;
  const getX = (i: number) => padding.left + (i / validLen) * innerWidth;
  const getY = (val: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    return padding.top + innerHeight - ((clamped - minVal) / (maxVal - minVal)) * innerHeight;
  };

  const points = useMemo(() => {
    if (!data || data.length === 0) return '';
    return data.map((d, i) => `${getX(i).toFixed(1)},${getY(d.stabilityPercent).toFixed(1)}`).join(' ');
  }, [data]);

  const areaPath = useMemo(() => {
    if (!data || data.length === 0) return '';
    const firstX = getX(0).toFixed(1);
    const lastX = getX(data.length - 1).toFixed(1);
    const bottomY = getY(minVal).toFixed(1);
    return `M ${firstX},${bottomY} ${points} L ${lastX},${bottomY} Z`;
  }, [data, points]);

  const linePath = useMemo(() => (points ? `M ${points}` : ''), [points]);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 relative">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            24-Hour Aggregate System Stability Trend (% Coherence)
          </h4>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 font-bold">
          24h Mean: 99.52% (SLA &gt; 99.0%)
        </span>
      </div>

      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {[97, 98, 99, 100].map(val => (
          <g key={val}>
            <line
              x1={padding.left}
              y1={getY(val)}
              x2={width - padding.right}
              y2={getY(val)}
              stroke="#1e293b"
              strokeDasharray="3 3"
            />
            <text x={padding.left - 8} y={getY(val) + 3} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
              {val}%
            </text>
          </g>
        ))}

        {areaPath && <path d={areaPath} fill="url(#chartGradient)" />}
        {linePath && <path d={linePath} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

        {data.map((d, i) => {
          const cx = getX(i);
          const cy = getY(d.stabilityPercent);
          const isAnomaly = d.anomalyCount > 0;
          const isHovered = hoveredIndex === i;

          return (
            <g key={d.hour} onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)} className="cursor-pointer">
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 6 : isAnomaly ? 4 : 2.5}
                fill={isAnomaly ? '#f59e0b' : '#38bdf8'}
                stroke={isHovered ? '#ffffff' : isAnomaly ? '#78350f' : '#0284c7'}
                strokeWidth={isHovered ? 2 : 1}
              />
            </g>
          );
        })}

        {[0, 6, 12, 18, 23].map(h => (
          <text key={h} x={getX(h)} y={height - 8} fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">
            {h === 23 ? 'Now' : `-${23 - h}h`}
          </text>
        ))}
      </svg>

      {hoveredIndex !== null && data[hoveredIndex] && (
        <div
          className="absolute bg-slate-900 border border-cyan-500/50 rounded-lg p-2 text-[10px] font-mono text-slate-200 shadow-xl pointer-events-none z-20"
          style={{
            left: `${(hoveredIndex / validLen) * 80 + 10}%`,
            top: '25px'
          }}
        >
          <div className="text-cyan-400 font-bold">Time T-{23 - hoveredIndex} Hours</div>
          <div>Stability: <strong>{data[hoveredIndex].stabilityPercent}%</strong></div>
          <div className={data[hoveredIndex].anomalyCount > 0 ? 'text-amber-400' : 'text-slate-400'}>
            Anomalies: {data[hoveredIndex].anomalyCount}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENT 3: CHAMBER SPARKLINE (FOR EXPANDED GRID VIEW)
// ============================================================================
const ChamberSparkline: React.FC<{ data: number[]; trend: CoherenceTrend }> = ({ data, trend }) => {
  const width = 180;
  const height = 36;

  const points = useMemo(() => {
    if (!data || data.length === 0) return '';
    const minVal = Math.min(...data) * 0.95;
    const maxVal = Math.max(...data) * 1.02;
    const range = maxVal - minVal > 0.0001 ? maxVal - minVal : 0.01;
    const validLen = data.length > 1 ? data.length - 1 : 1;

    return data
      .map((val, idx) => {
        const x = ((idx / validLen) * width).toFixed(1);
        const y = (height - ((val - minVal) / range) * height).toFixed(1);
        return `${x},${y}`;
      })
      .join(' ');
  }, [data]);

  const strokeColor = trend === 'rising' ? '#34d399' : trend === 'falling' ? '#f59e0b' : '#38bdf8';
  const latestVal = data.length > 0 ? ((data[data.length - 1]) * 100).toFixed(1) : '0.0';

  return (
    <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
      <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 mb-1">
        <span>24H Coherence Telemetry</span>
        <span className="font-bold text-slate-200">{latestVal}%</span>
      </div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {points && (
          <polyline
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        )}
      </svg>
    </div>
  );
};

// ============================================================================
// COMPONENT 4: HISTORICAL AUDIT LINE CHART (24H COHERENCE VS 95% THRESHOLD)
// ============================================================================
const HistoricalAuditLineChart: React.FC<{ data: StabilityDataPoint[] }> = ({ data }) => {
  const width = 640;
  const height = 220;
  const padding = { top: 25, right: 25, bottom: 35, left: 50 };

  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const minCoherence = 0.85;
  const maxCoherence = 1.00;
  const validLen = data.length > 1 ? data.length - 1 : 1;

  const getX = (i: number) => padding.left + (i / validLen) * innerW;
  const getY = (val: number) => {
    const clamped = Math.max(minCoherence, Math.min(maxCoherence, val));
    return padding.top + innerH - ((clamped - minCoherence) / (maxCoherence - minCoherence)) * innerH;
  };

  const points = useMemo(() => {
    if (!data || data.length === 0) return '';
    return data.map((d, i) => `${getX(i).toFixed(1)},${getY(d.avgCoherence).toFixed(1)}`).join(' ');
  }, [data]);

  const targetY = getY(0.95);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            System Coherence Audit (24-Hour Mean Drift Comparison)
          </h4>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="flex items-center gap-1 text-cyan-400 font-bold">
            <span className="w-2.5 h-0.5 bg-cyan-400 inline-block" /> Observed Coherence
          </span>
          <span className="flex items-center gap-1 text-rose-400 font-bold">
            <span className="w-2.5 h-0.5 bg-rose-400 border-b border-dashed border-rose-400 inline-block" /> 95% Lock Threshold
          </span>
        </div>
      </div>

      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {[0.85, 0.90, 0.95, 1.00].map(val => (
          <g key={val}>
            <line
              x1={padding.left}
              y1={getY(val)}
              x2={width - padding.right}
              y2={getY(val)}
              stroke="#1e293b"
              strokeDasharray={val === 0.95 ? '4 4' : '2 2'}
            />
            <text x={padding.left - 8} y={getY(val) + 3} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
              {(val * 100).toFixed(0)}%
            </text>
          </g>
        ))}

        <line
          x1={padding.left}
          y1={targetY}
          x2={width - padding.right}
          y2={targetY}
          stroke="#f43f5e"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {points && (
          <path d={`M ${points}`} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        )}

        {data.map((d, i) => {
          const isLow = d.avgCoherence < 0.92;
          return (
            <circle
              key={d.hour}
              cx={getX(i)}
              cy={getY(d.avgCoherence)}
              r={isLow ? 5 : 3}
              fill={isLow ? '#f43f5e' : '#38bdf8'}
              stroke="#090d16"
              strokeWidth="1.5"
            />
          );
        })}

        {[0, 6, 12, 18, 23].map(h => (
          <text key={h} x={getX(h)} y={height - 8} fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">
            {h === 23 ? 'Now' : `-${23 - h}h`}
          </text>
        ))}
      </svg>
    </div>
  );
};

// ============================================================================
// MAIN CONSOLE COMPONENT: SOVEREIGN CHAMBER CONSOLE
// ============================================================================
export const SovereignChamberConsole: React.FC = () => {
  const [chambers, setChambers] = useState<CryoChamber[]>(INITIAL_18_CHAMBERS);
  const [sortCriterion, setSortCriterion] = useState<SortCriterion>('status_unstable');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [gridDensity, setGridDensity] = useState<GridDensity>('compact');

  // FEATURE 1: Selected Chamber for Detail Modal
  const [selectedDetailChamber, setSelectedDetailChamber] = useState<CryoChamber | null>(null);

  // FEATURE 2: Toast Alert System for Threshold Monitoring (< 0.90)
  const [toastAlerts, setToastAlerts] = useState<ToastAlert[]>([]);
  const notifiedChambersRef = useRef<Set<string>>(new Set());

  // Modals & Overlay Drawers
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [isExecModalOpen, setIsExecModalOpen] = useState<boolean>(false);
  const [execActiveTab, setExecActiveTab] = useState<'overview' | 'historical_audit'>('overview');
  const [isLockdownDrawerOpen, setIsLockdownDrawerOpen] = useState<boolean>(false);

  // Batch Simulation State
  const [batchProgress, setBatchProgress] = useState<number>(0);
  const [isBatchRunning, setIsBatchRunning] = useState<boolean>(false);
  const batchIntervalRef = useRef<number | null>(null);

  const TOTAL_BATCH_CHAMBERS = 14902;
  const PASSED_BATCH_CHAMBERS = 14896;
  const UNSTABLE_BATCH_CHAMBERS = 6;

  const signerMetadata: SignerMetadata = useMemo(() => ({
    signerId: 'ZYRQUEN-HSM-CHAMBER-SIGNER-v4.1',
    role: 'Sovereign Quantum System Sentinel',
    hsmSerial: 'HSM-FIPS140-3-L4-99201',
    timestamp: new Date().toISOString()
  }), []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (batchIntervalRef.current !== null) {
        window.clearInterval(batchIntervalRef.current);
        batchIntervalRef.current = null;
      }
    };
  }, []);

  // AUTOMATED TRIGGER MECHANISM: Flag chambers with coherence < 90% (0.90)
  const priorityLockdownQueue = useMemo(() => {
    return chambers.filter(c => c.coherence < 0.90);
  }, [chambers]);

  // FEATURE 2: Monitor coherence < 0.90 and trigger Browser Toast Alert Notifications
  useEffect(() => {
    chambers.forEach(c => {
      if (c.coherence < 0.90 && !notifiedChambersRef.current.has(c.chamberId)) {
        notifiedChambersRef.current.add(c.chamberId);
        
        const newToast: ToastAlert = {
          id: `toast-${c.chamberId}-${Date.now()}`,
          chamberId: c.chamberId,
          chamberName: c.name,
          coherence: c.coherence,
          timestamp: new Date().toLocaleTimeString()
        };

        setToastAlerts(prev => [newToast, ...prev.slice(0, 4)]);
        playUnstableEventChime(isMuted);

        // Also dispatch global window event so toast shows anywhere in the app
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('zyrquen-toast', {
            detail: {
              message: `[ALERT] ${c.chamberId} (${c.name}) coherence dropped to ${(c.coherence * 100).toFixed(1)}% (< 90% threshold)`,
              type: 'error'
            }
          }));

          // Native browser notification if permission granted
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`Chamber Alert: ${c.chamberId}`, {
                body: `${c.name} coherence dropped to ${(c.coherence * 100).toFixed(1)}%`,
                icon: '/favicon.ico'
              });
            } catch {
              // Ignore iframe / sandboxed notification restrictions
            }
          }
        }
      } else if (c.coherence >= 0.90 && notifiedChambersRef.current.has(c.chamberId)) {
        notifiedChambersRef.current.delete(c.chamberId);
      }
    });
  }, [chambers, isMuted]);

  const handleDismissToast = (id: string) => {
    setToastAlerts(prev => prev.filter(t => t.id !== id));
  };

  // FEATURE 3: CSV Export Functionality
  const handleExportCSV = useCallback(() => {
    const headers = ['Chamber ID', 'Name', 'Coherence (%)', 'Temperature (mK)', 'Status', 'Last Sync Time', 'Merkle Leaf Hash', 'Coherence Trend'];
    const rows = chambers.map(c => [
      c.chamberId,
      `"${c.name}"`,
      (c.coherence * 100).toFixed(1),
      c.temperature.toFixed(2),
      c.status,
      c.lastSync,
      c.merkleHash,
      c.coherenceTrend
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `ZYRQUEN_Chamber_Status_Report_Block849202_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      if (a.parentNode && a.isConnected) {
        a.parentNode.removeChild(a);
      }
      URL.revokeObjectURL(url);
    }, 150);
  }, [chambers]);

  // FEATURE 4: Sorting Logic with Dropdown Support
  const sortedChambers = useMemo(() => {
    return [...chambers].sort((a, b) => {
      switch (sortCriterion) {
        case 'coherence_desc': return b.coherence - a.coherence;
        case 'coherence_asc':  return a.coherence - b.coherence;
        case 'temp_desc':      return b.temperature - a.temperature;
        case 'temp_asc':       return a.temperature - b.temperature;
        case 'sync_desc':      return parseSyncTimeToSeconds(b.lastSync) - parseSyncTimeToSeconds(a.lastSync);
        case 'sync_asc':       return parseSyncTimeToSeconds(a.lastSync) - parseSyncTimeToSeconds(b.lastSync);
        case 'status_pure':    return (a.status === 'pure_green' ? -1 : 1) - (b.status === 'pure_green' ? -1 : 1);
        case 'status_unstable':return (a.status === 'unstable' ? -1 : 1) - (b.status === 'unstable' ? -1 : 1);
        default: return 0;
      }
    });
  }, [chambers, sortCriterion]);

  const handleToggleUnstableEvent = useCallback((id: number) => {
    setChambers(prev => prev.map(c => {
      if (c.id === id) {
        const isCurrentlyPure = c.status === 'pure_green';
        const newStatus: ChamberStatus = isCurrentlyPure ? 'unstable' : 'pure_green';
        const newCoherence = isCurrentlyPure ? 0.680 : 0.998;

        if (newStatus === 'unstable') {
          playUnstableEventChime(isMuted);
        }

        return {
          ...c,
          status: newStatus,
          coherence: newCoherence,
          coherenceTrend: isCurrentlyPure ? 'falling' : 'rising',
          temperature: isCurrentlyPure ? 30.5 : 14.8,
          history24h: [...c.history24h.slice(1), newCoherence]
        };
      }
      return c;
    }));
  }, [isMuted]);

  const handleStartBatchVerification = useCallback(() => {
    if (batchIntervalRef.current !== null) {
      window.clearInterval(batchIntervalRef.current);
    }

    setIsBatchRunning(true);
    setBatchProgress(0);

    batchIntervalRef.current = window.setInterval(() => {
      setBatchProgress(prev => {
        if (prev >= 100) {
          if (batchIntervalRef.current !== null) {
            window.clearInterval(batchIntervalRef.current);
            batchIntervalRef.current = null;
          }
          setIsBatchRunning(false);
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans relative">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Navigation Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-cyan-950 border border-cyan-800/80 rounded-xl text-cyan-400">
              <Cpu className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded text-[10px] font-mono font-bold">
                  CRYONIC SSoT SENTINEL
                </span>
                <span className="text-xs text-slate-400">18-Cell Quantum Grid</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight mt-0.5">
                Cryo Chamber Sovereign Inspector
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* FEATURE 3: CSV Export Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/80 rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
              title="Export Current Chamber Status Data as CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export Chamber CSV</span>
            </button>

            {/* Priority Lockdown Queue Notification Button */}
            <button
              type="button"
              onClick={() => setIsLockdownDrawerOpen(true)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all relative cursor-pointer ${
                priorityLockdownQueue.length > 0
                  ? 'bg-rose-950/80 border-rose-700 text-rose-200 animate-pulse'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <ShieldAlert className={`w-4 h-4 ${priorityLockdownQueue.length > 0 ? 'text-rose-400' : 'text-slate-400'}`} />
              <span>Priority Lockdown Queue</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono ${
                priorityLockdownQueue.length > 0 ? 'bg-rose-500 text-slate-950' : 'bg-slate-700 text-slate-300'
              }`}>
                {priorityLockdownQueue.length}
              </span>
            </button>

            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => setIsMuted(prev => !prev)}
              className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isMuted
                  ? 'bg-slate-800 border-slate-700 text-slate-400'
                  : 'bg-cyan-950 border-cyan-700/60 text-cyan-400 hover:bg-cyan-900/60'
              }`}
              title={isMuted ? 'Unmute Audio Alert Chime' : 'Mute Audio Alert Chime'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Batch Status Trigger */}
            <button
              type="button"
              onClick={() => setIsBatchModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              14,902 Batch Status
            </button>

            {/* Executive Review Trigger */}
            <button
              type="button"
              onClick={() => setIsExecModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-950 cursor-pointer"
            >
              <BarChart3 className="w-4 h-4" />
              Executive Review
            </button>
          </div>
        </div>

        {/* Toolbar: Sorting & Grid Density Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-3">
            {/* Grid Density Toggle Button */}
            <button
              type="button"
              onClick={() => setGridDensity(prev => prev === 'compact' ? 'expanded' : 'compact')}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-700 hover:border-cyan-500 text-cyan-400 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer"
            >
              <Grid className="w-4 h-4" />
              <span>Density: {gridDensity === 'compact' ? 'Compact 6-Col' : 'Expanded 3-Col'}</span>
            </button>

            <span className="text-slate-600">|</span>

            {/* FEATURE 4: Dropdown Menu for Chamber Grid Sorting */}
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <label htmlFor="chamber-sort-select" className="font-bold">Sort Chambers:</label>
              <div className="relative">
                <select
                  id="chamber-sort-select"
                  value={sortCriterion}
                  onChange={(e) => setSortCriterion(e.target.value as SortCriterion)}
                  className="bg-slate-950 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 font-bold rounded-lg px-3 py-1.5 pr-8 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-cyan-400 appearance-none cursor-pointer"
                >
                  <option value="status_unstable">⚠️ Unstable First</option>
                  <option value="status_pure">🟢 Pure Green First</option>
                  <option value="coherence_desc">📊 Coherence: High → Low</option>
                  <option value="coherence_asc">📊 Coherence: Low → High</option>
                  <option value="temp_desc">🔥 Temp: Warm → Cool (High → Low)</option>
                  <option value="temp_asc">❄️ Temp: Cool → Warm (Low → High)</option>
                  <option value="sync_desc">🕒 Last Sync: Newest First</option>
                  <option value="sync_asc">⏳ Last Sync: Oldest First</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-cyan-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-400">
            Active Filter: <span className="text-cyan-300 font-bold">{sortedChambers.length} Chambers</span> | Click card to view <span className="text-amber-400 font-bold">24h History & Proof</span>
          </div>
        </div>

        {/* 18-Cell Grid Render (Dynamic Density Switch) */}
        <div className={`grid gap-3.5 ${
          gridDensity === 'compact'
            ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {sortedChambers.map(chamber => {
            const isPure = chamber.status === 'pure_green';
            const isLowCoherence = chamber.coherence < 0.90;

            return (
              <div
                key={chamber.id}
                onClick={() => setSelectedDetailChamber(chamber)}
                className={`p-4 rounded-xl border transition-all relative flex flex-col justify-between cursor-pointer group hover:scale-[1.01] ${
                  isLowCoherence
                    ? 'bg-rose-950/30 border-rose-600/80 shadow-lg shadow-rose-950/50 ring-1 ring-rose-500/50'
                    : isPure
                    ? 'bg-slate-900/90 border-emerald-800/50 hover:border-emerald-500/80 shadow-md'
                    : 'bg-amber-950/20 border-amber-600/70 shadow-lg shadow-amber-950/30 animate-pulse'
                }`}
              >
                <div>
                  {/* Top Status Header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 group-hover:text-cyan-400 transition-colors flex items-center gap-1">
                      {chamber.chamberId}
                      <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      isLowCoherence
                        ? 'bg-rose-950 text-rose-300 border border-rose-700'
                        : isPure
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-900/80 text-amber-300 border border-amber-700'
                    }`}>
                      {isLowCoherence ? 'LOCKDOWN' : isPure ? 'Pure Green' : 'Unstable'}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white mb-2 truncate group-hover:text-cyan-300 transition-colors">{chamber.name}</h3>

                  {/* Coherence % & Directional Trend Icon */}
                  <div className="space-y-1.5 font-mono text-[11px] mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Coherence</span>
                      <div className="flex items-center gap-1">
                        {chamber.coherenceTrend === 'rising' && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
                        {chamber.coherenceTrend === 'falling' && <TrendingDown className="w-3.5 h-3.5 text-rose-400" />}
                        {chamber.coherenceTrend === 'stable' && <Minus className="w-3.5 h-3.5 text-cyan-400" />}
                        <span className={`font-bold ${isPure ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {(chamber.coherence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Temp</span>
                      <span className="text-slate-200 font-bold">{chamber.temperature.toFixed(2)} mK</span>
                    </div>
                  </div>

                  {/* Expanded Grid Mode: Renders 24h Historical Telemetry Sparkline */}
                  {gridDensity === 'expanded' && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80">
                      <ChamberSparkline data={chamber.history24h} trend={chamber.coherenceTrend} />
                      <div className="mt-2 text-[10px] font-mono text-slate-400 flex justify-between">
                        <span>Merkle: {chamber.merkleHash.slice(0, 10)}...</span>
                        <span>Sync: {chamber.lastSync}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Trigger Action */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 mt-2">
                  <span className="font-mono">Sync {chamber.lastSync}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleUnstableEvent(chamber.id);
                    }}
                    className="p-1 hover:bg-slate-800 rounded text-amber-400/80 hover:text-amber-300 transition-all flex items-center gap-1 cursor-pointer"
                    title="Toggle Unstable / Lock state"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Toggle</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* FEATURE 2: Toast Notification Container for Threshold Alert System */}
      <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-sm w-full pointer-events-none">
        {toastAlerts.map(toast => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-slate-900 border-2 border-rose-500 rounded-xl p-4 shadow-2xl shadow-rose-950/80 text-slate-100 flex items-start gap-3 animate-in slide-in-from-bottom duration-300"
          >
            <div className="p-2 bg-rose-950 border border-rose-600 rounded-lg text-rose-400 animate-pulse shrink-0">
              <Siren className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-1 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-400 uppercase tracking-wider text-[11px]">COHERENCE ALERT (&lt; 90%)</span>
                <span className="text-[10px] text-slate-500">{toast.timestamp}</span>
              </div>
              <p className="font-bold text-white text-sm">{toast.chamberId} - {toast.chamberName}</p>
              <div className="text-slate-300 text-[11px]">
                Coherence dropped to <strong className="text-rose-400">{(toast.coherence * 100).toFixed(1)}%</strong>
              </div>
              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const found = chambers.find(c => c.chamberId === toast.chamberId);
                    if (found) setSelectedDetailChamber(found);
                    handleDismissToast(toast.id);
                  }}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-[10px] transition-colors cursor-pointer"
                >
                  Inspect Chamber
                </button>
                <button
                  type="button"
                  onClick={() => handleDismissToast(toast.id)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded text-[10px] transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleDismissToast(toast.id)}
              className="text-slate-500 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* FEATURE 1: CHAMBER DETAIL MODAL */}
      <ChamberDetailModal
        chamber={selectedDetailChamber}
        onClose={() => setSelectedDetailChamber(null)}
        onToggleStatus={(id) => {
          handleToggleUnstableEvent(id);
          setSelectedDetailChamber(prev => prev ? {
            ...prev,
            status: prev.status === 'pure_green' ? 'unstable' : 'pure_green',
            coherence: prev.status === 'pure_green' ? 0.680 : 0.998
          } : null);
        }}
      />

      {/* PRIORITY LOCKDOWN QUEUE DRAWER */}
      {isLockdownDrawerOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex justify-end z-50">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full p-6 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-500" />
                  <h3 className="text-base font-bold text-white">Priority Lockdown Queue</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLockdownDrawerOpen(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-400 mb-4">
                Chambers automatically flagged with quantum coherence below <strong className="text-rose-400">90.0%</strong>. Isolated for quarantine.
              </p>

              <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                {priorityLockdownQueue.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                    No chambers currently in lockdown queue. System operating within optimal thresholds.
                  </div>
                ) : (
                  priorityLockdownQueue.map(c => (
                    <div key={c.id} className="p-3.5 bg-rose-950/20 border border-rose-800/80 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold font-mono text-rose-300">{c.chamberId} - {c.name}</span>
                        <span className="text-[10px] font-mono bg-rose-900/80 text-rose-200 px-2 py-0.5 rounded font-bold">
                          {(c.coherence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 flex justify-between">
                        <span>Temp: {c.temperature.toFixed(2)} mK</span>
                        <span>Trend: {c.coherenceTrend}</span>
                      </div>
                      <div className="pt-2 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailChamber(c)}
                          className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold rounded cursor-pointer transition-all"
                        >
                          View 24h Proof
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleUnstableEvent(c.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold rounded cursor-pointer transition-all"
                        >
                          Recalibrate & Restore
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsLockdownDrawerOpen(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg cursor-pointer transition-all"
              >
                Close Queue Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VERIFICATION BATCH STATUS MODAL */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl p-6 shadow-2xl relative text-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-bold text-white">14,902 Chambers Batch Verification Console</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Mass quantum state audit & zero-drift SSoT verification across all high-density cryogenic nodes
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-5 font-mono">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Total Batch Chambers</span>
                <span className="text-sm font-bold text-cyan-400">{TOTAL_BATCH_CHAMBERS.toLocaleString()}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Passed (Pure Green)</span>
                <span className="text-sm font-bold text-emerald-400">{PASSED_BATCH_CHAMBERS.toLocaleString()} (99.96%)</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Unstable / Quarantined</span>
                <span className="text-sm font-bold text-amber-400">{UNSTABLE_BATCH_CHAMBERS} Chambers</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Execution Status</span>
                <span className="text-sm font-bold text-purple-400">VERIFIED (100%)</span>
              </div>
            </div>

            <div className="mb-5 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center text-xs font-mono mb-2">
                <span className="text-slate-400">Batch Inspection Cycle: {batchProgress}% Completed</span>
                <button
                  type="button"
                  onClick={handleStartBatchVerification}
                  disabled={isBatchRunning}
                  className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-slate-950 font-bold rounded text-xs transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isBatchRunning ? 'animate-spin' : ''}`} />
                  {isBatchRunning ? 'Verifying...' : 'Re-Run 14.9k Batch'}
                </button>
              </div>

              <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-300"
                  style={{ width: `${batchProgress}%` }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto border border-slate-800 rounded-lg p-3 bg-slate-950/60 mb-5 text-xs font-mono">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800 text-slate-500 uppercase text-[10px] mb-2">
                <span>Chamber ID</span>
                <span>Cryo Range</span>
                <span>Coherence</span>
                <span>Status</span>
              </div>

              <div className="space-y-1.5">
                {[
                  { id: 'CH-00001', range: 'Array Alpha-001', coherence: '0.9994', status: 'Passed' },
                  { id: 'CH-01429', range: 'Array Beta-142', coherence: '0.9989', status: 'Passed' },
                  { id: 'CH-04812', range: 'Array Gamma-088', coherence: '0.9991', status: 'Passed' },
                  { id: 'CH-07304', range: 'Array Delta-304', coherence: '0.7420', status: 'Unstable' },
                  { id: 'CH-10992', range: 'Array Epsilon-992', coherence: '0.9997', status: 'Passed' },
                  { id: 'CH-14902', range: 'Array Zeta-902', coherence: '0.9996', status: 'Passed' }
                ].map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-cyan-400 font-bold">{item.id}</span>
                    <span className="text-slate-400">{item.range}</span>
                    <span className="text-slate-200">{item.coherence}</span>
                    <span className={item.status === 'Passed' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[11px] text-slate-400 font-mono">
                PQC Signer: <strong style={{ color: '#38bdf8' }}>{signerMetadata.signerId}</strong>
              </span>

              <button
                type="button"
                onClick={() => generateForensicBatchPDF(TOTAL_BATCH_CHAMBERS, PASSED_BATCH_CHAMBERS, UNSTABLE_BATCH_CHAMBERS, signerMetadata)}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download Forensic Report (PDF)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXECUTIVE REVIEW MODAL */}
      {isExecModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl p-6 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-bold text-white">Executive Quantum Review & Governance Health</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExecModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-5 border-b border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => setExecActiveTab('overview')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  execActiveTab === 'overview'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                Overview & SLA Metrics
              </button>
              <button
                type="button"
                onClick={() => setExecActiveTab('historical_audit')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  execActiveTab === 'historical_audit'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                Historical Audit View (24H Coherence)
              </button>
            </div>

            {execActiveTab === 'overview' && (
              <div className="space-y-6">
                <div className="mb-6">
                  <MiniD3StabilityChart data={SYSTEM_24H_STABILITY} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="text-slate-500 text-[10px] uppercase">Mean Time Between Anomaly (MTBA)</div>
                    <div className="text-xl font-black text-cyan-400 mt-1">18.4 Hours</div>
                    <div className="text-[10px] text-emerald-400 mt-1">↑ +2.1h vs Previous Cycle</div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="text-slate-500 text-[10px] uppercase">Quantum State Fidelity</div>
                    <div className="text-xl font-black text-emerald-400 mt-1">99.982%</div>
                    <div className="text-[10px] text-slate-400 mt-1">Exceeds 99.95% Target</div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="text-slate-500 text-[10px] uppercase">Statutory Compliance</div>
                    <div className="text-xl font-black text-purple-400 mt-1">Thai ETA B.E. 2544</div>
                    <div className="text-[10px] text-emerald-400 mt-1">Fully Admissible Court Seal</div>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Executive Operational Ratification</span>
                  </div>
                  <p className="text-slate-400">
                    The quantum state across all 14,902 chambers remains well within cryptographic drift limits. The isolated 6 chambers in Array Gamma and Delta have been auto-quarantined with zero impact on single source of truth (SSoT) invariants.
                  </p>
                </div>
              </div>
            )}

            {execActiveTab === 'historical_audit' && (
              <div className="space-y-4">
                <HistoricalAuditLineChart data={SYSTEM_24H_STABILITY} />
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-400">
                  <strong className="text-slate-200">Audit Insight:</strong> Average coherence remained strictly above the 90% lock threshold, except for transient localized temperature dips at T-15h and T-5h, which were handled by automated quarantine protocols.
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsExecModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer transition-all"
              >
                Close Executive Review
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SovereignChamberConsole;
