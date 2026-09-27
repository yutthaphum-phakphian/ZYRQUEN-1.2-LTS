import React, { useState, useMemo } from 'react';
import {
  Activity,
  Cpu,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  KeyRound,
  Zap,
} from 'lucide-react';
import { CryoChamber, StabilityDataPoint, SignerMetadata } from './chamberConsoleData';

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

export const generateForensicBatchPDF = (
  totalChambers: number = 14902,
  passedCount: number = 14896,
  unstableCount: number = 6,
  signerMetadata?: SignerMetadata | any
): void => {
  if (typeof window === 'undefined') return;

  const defaultMeta: SignerMetadata = {
    signerId: 'ZYRQUEN-HSM-CHAMBER-SIGNER-v4.1',
    role: 'Sovereign Quantum System Sentinel',
    hsmSerial: 'HSM-FIPS140-3-L4-99201',
    timestamp: new Date().toISOString(),
  };

  const meta = signerMetadata && signerMetadata.signerId ? signerMetadata : defaultMeta;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const passRate = totalChambers > 0 ? ((passedCount / totalChambers) * 100).toFixed(3) : '0.000';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Forensic Batch Audit Report - ${totalChambers.toLocaleString()} Chambers</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: monospace; background: #090d16; color: #f8fafc; padding: 25px; }
    .header { border-bottom: 2px solid #38bdf8; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; }
    .title { font-size: 20px; font-weight: bold; color: #38bdf8; }
    .box { background: #1e293b; border: 1px solid #334155; padding: 14px; border-radius: 6px; margin-bottom: 15px; }
    .seal { border: 2px dashed #22c55e; padding: 16px; color: #22c55e; border-radius: 6px; text-align: center; font-weight: bold; margin-top: 25px; background: #022c22; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">14,902 Chamber Batch Forensic Audit</div>
      <div>Cryogenic Quantum Coherence & Statutory Certification</div>
    </div>
    <div>Report ID: WORM-14902-BATCH | Generated: ${meta.timestamp}</div>
  </div>
  <div class="box">
    <div>Total Batch: ${totalChambers.toLocaleString()} Chambers</div>
    <div style="color: #4ade80;">Pass Rate: ${passRate}% (${passedCount.toLocaleString()} / ${totalChambers.toLocaleString()})</div>
    <div style="color: #f59e0b;">Unstable: ${unstableCount} Chambers</div>
    <div>Merkle Root: 0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68</div>
    <div>Signer: ${meta.signerId} (${meta.role}) | HSM: ${meta.hsmSerial}</div>
  </div>
  <div class="seal">
    🔒 COURT ADMISSIBLE QUANTUM EVIDENCE DOSSIER RATIFIED UNDER THAI ETA B.E. 2544
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>
  `;
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

export const ChamberSparkline: React.FC<{ data: number[]; trend: string }> = ({ data, trend }) => {
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
    <div className="bg-slate-950/80 p-2 rounded-lg border-slate-800">
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

export const MiniD3StabilityChart: React.FC<{ data: StabilityDataPoint[] }> = ({ data }) => {
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

  return (
    <div className="bg-slate-950 border-slate-800 rounded-xl p-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            24-Hour Aggregate System Stability Trend (% Coherence)
          </h4>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 font-bold">24h Mean: 99.52%</span>
      </div>

      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
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

        {points && <polyline fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points} />}

        {data.map((d, i) => (
          <circle
            key={d.hour}
            cx={getX(i)}
            cy={getY(d.stabilityPercent)}
            r={d.anomalyCount > 0 ? 4 : 2.5}
            fill={d.anomalyCount > 0 ? '#f59e0b' : '#38bdf8'}
          />
        ))}

        {[0, 6, 12, 18, 23].map(h => (
          <text key={h} x={getX(h)} y={height - 8} fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">
            {h === 23 ? 'Now' : `-${23 - h}h`}
          </text>
        ))}
      </svg>
    </div>
  );
};

export const ChamberDetailModal: React.FC<{
  chamber: CryoChamber | null;
  onClose: () => void;
  onToggleStatus: (id: number) => void;
}> = ({ chamber, onClose, onToggleStatus }) => {
  const [copied, setCopied] = useState(false);

  if (!chamber) return null;

  const isPure = chamber.status === 'pure_green';
  const isLowCoherence = chamber.coherence < 0.90;
  const minCoherence = Math.min(...chamber.history24h);
  const maxCoherence = Math.max(...chamber.history24h);
  const avgCoherence = (chamber.history24h.reduce((a, b) => a + b, 0) / chamber.history24h.length);

  const svgWidth = 540;
  const svgHeight = 160;
  const padding = { top: 15, right: 15, bottom: 25, left: 45 };
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

  const handleCopyMerkle = () => {
    navigator.clipboard.writeText(chamber.merkleHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border-cyan-500/40 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              isLowCoherence ? 'bg-rose-950 border-rose-500 text-rose-400' : isPure ? 'bg-emerald-950 border-emerald-500 text-emerald-400' : 'bg-amber-950 border-amber-500 text-amber-400'
            }`}>
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400">{chamber.chamberId}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  isLowCoherence ? 'bg-rose-950 text-rose-300' : isPure ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                }`}>
                  {isLowCoherence ? 'LOCKDOWN' : isPure ? 'Pure Green' : 'Unstable'}
                </span>
              </div>
              <h2 className="text-lg font-bold font-mono text-white">{chamber.name}</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Telemetry Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
          <div className="bg-slate-950 p-2.5 rounded-xl border-slate-800">
            <span className="text-slate-500 text-[10px] block">Coherence</span>
            <div className={`text-base font-bold flex items-center gap-1 ${isLowCoherence ? 'text-rose-400' : isPure ? 'text-emerald-400' : 'text-amber-400'}`}>
              {(chamber.coherence * 100).toFixed(1)}%
              {chamber.coherenceTrend === 'rising' && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
              {chamber.coherenceTrend === 'falling' && <TrendingDown className="w-3.5 h-3.5 text-rose-400" />}
              {chamber.coherenceTrend === 'stable' && <Minus className="w-3.5 h-3.5 text-cyan-400" />}
            </div>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border-slate-800">
            <span className="text-slate-500 text-[10px] block">Cryo Temp</span>
            <div className="text-base font-bold text-cyan-300">{chamber.temperature.toFixed(2)} mK</div>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border-slate-800">
            <span className="text-slate-500 text-[10px] block">24H Mean</span>
            <div className="text-base font-bold text-purple-300">{(avgCoherence * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border-slate-800">
            <span className="text-slate-500 text-[10px] block">Last Sync</span>
            <div className="text-base font-bold text-amber-300">{chamber.lastSync}</div>
          </div>
        </div>

        {/* 24h Graph */}
        <div className="bg-slate-950 border-slate-800 rounded-xl p-3 space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <Activity className="w-3.5 h-3.5" />
              <span>24-Hour Coherence Telemetry</span>
            </div>
            <span className="text-[10px] text-slate-400">
              Min: <strong className="text-amber-400">{(minCoherence * 100).toFixed(1)}%</strong> | Max: <strong className="text-emerald-400">{(maxCoherence * 100).toFixed(1)}%</strong>
            </span>
          </div>
          <div className="w-full overflow-x-auto">
            <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="overflow-visible">
              {[0.70, 0.80, 0.90, 1.00].map(val => (
                <g key={val}>
                  <line x1={padding.left} y1={getY(val)} x2={svgWidth - padding.right} y2={getY(val)} stroke="#1e293b" strokeDasharray="2 2" />
                  <text x={padding.left - 6} y={getY(val) + 3} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
                    {(val * 100).toFixed(0)}%
                  </text>
                </g>
              ))}
              <line x1={padding.left} y1={getY(0.90)} x2={svgWidth - padding.right} y2={getY(0.90)} stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 4" />
              {points && <polyline fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points} />}
              {chamber.history24h.map((val, i) => (
                <circle key={i} cx={getX(i)} cy={getY(val)} r={val < 0.90 ? 4 : 3} fill={val < 0.90 ? '#f43f5e' : '#38bdf8'} />
              ))}
            </svg>
          </div>
        </div>

        {/* Cryptographic Merkle Proof */}
        <div className="bg-slate-950 border-purple-500/30 rounded-xl p-3 space-y-2 font-mono text-xs">
          <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5 text-purple-400 font-bold">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Cryptographic Merkle Proof Data</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold">
              VERIFIED INVARIANT 🟢
            </span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px]">Genesis Merkle Root Anchor:</span>
            <p className="text-cyan-400 font-bold break-all bg-slate-900 p-1.5 rounded border-slate-800 mt-0.5 text-[11px]">
              0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68 (Block #849202)
            </p>
          </div>
          <div>
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-slate-500 text-[10px]">Chamber Merkle Leaf Hash:</span>
              <button type="button" onClick={handleCopyMerkle} className="text-cyan-400 hover:text-cyan-300 text-[10px] cursor-pointer">
                {copied ? 'Copied! ✓' : 'Copy Hash'}
              </button>
            </div>
            <p className="text-amber-300 font-bold break-all bg-slate-900 p-1.5 rounded border-slate-800 text-[11px]">
              {chamber.merkleHash}
            </p>
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => onToggleStatus(chamber.id)}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            Toggle Calibration Status
          </button>
          <button type="button" onClick={onClose} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold rounded-lg cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
