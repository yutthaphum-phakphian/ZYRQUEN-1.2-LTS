import React, { useState } from 'react';
import { HardwareSnapshot } from '../types';
import { playAuditChime, playTone } from './AudioSynthesizer';
import {
  ArrowRightLeft,
  Cpu,
  Activity,
  Layers,
  Thermometer,
  Zap,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Check,
  Clock,
  FileCheck,
  FileText,
  Download,
  Sparkles,
} from 'lucide-react';
import { generateForensicPdfReport } from '../utils/forensicPdfExport';

interface SnapshotCompareViewProps {
  snapshots: HardwareSnapshot[];
  timestampFormat?: 'human' | 'block-height';
}

export const SnapshotCompareView: React.FC<SnapshotCompareViewProps> = ({
  snapshots,
  timestampFormat = 'human',
}) => {
  const [indexA, setIndexA] = useState<number>(0);
  const [indexB, setIndexB] = useState<number>(Math.min(1, snapshots.length - 1));
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [pdfExportedName, setPdfExportedName] = useState<string | null>(null);

  const snapA = snapshots[indexA] || snapshots[0];
  const snapB = snapshots[indexB] || snapshots[Math.min(1, snapshots.length - 1)] || snapA;

  const handleGeneratePdfReport = () => {
    setIsExportingPdf(true);
    playAuditChime();
    try {
      const filename = generateForensicPdfReport({
        snapA,
        snapB,
        allSnapshots: snapshots,
        timestampFormat,
      });
      setPdfExportedName(filename);
      setTimeout(() => setPdfExportedName(null), 4000);
    } catch (err) {
      console.error('Failed to generate PDF forensic report:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Calculate variances
  const cpuVariance = +(snapB.cpuAverage - snapA.cpuAverage).toFixed(1);
  const ramVariance = snapB.memoryUsedMb - snapA.memoryUsedMb;
  const cryoVariance = +(snapB.cryoTempMk - snapA.cryoTempMk).toFixed(2);
  const qopsVariance = +(snapB.qopsThroughput - snapA.qopsThroughput).toFixed(1);
  const coherenceVariance = +(snapB.coherencePct - snapA.coherencePct).toFixed(2);

  const renderVarianceBadge = (val: number, unit: string = '', inverseGood: boolean = false) => {
    if (val === 0) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 text-xs font-mono flex items-center gap-1">
          <Minus className="w-3 h-3" /> 0.0{unit} Δ
        </span>
      );
    }
    const isPositive = val > 0;
    const isGood = inverseGood ? !isPositive : isPositive;

    return (
      <span
        className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold flex items-center gap-1 border ${
          isGood
            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
        }`}
      >
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {isPositive ? `+${val}` : `${val}`}
        {unit} Δ
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-mono">
      {/* Selector Controls Bar */}
      <div className="p-5 rounded-[24px] bg-[#0b0e1a]/85 border border-white/8 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              Hardware Telemetry Variance & Snapshot Diff Engine
            </h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Select two sealed telemetry points to compute differential load vectors and cryo stability deltas.
            </p>
          </div>
        </div>

        {/* Dual Snapshot Selectors */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-cyan-400 font-bold">SNAPSHOT A:</span>
            <select
              value={indexA}
              onChange={(e) => {
                playTone(500, 0.04);
                setIndexA(Number(e.target.value));
              }}
              className="bg-zinc-900 text-white font-mono text-xs rounded-lg px-2 py-1 border border-white/15 focus:outline-none focus:border-cyan-500"
            >
              {snapshots.map((s, idx) => (
                <option key={s.id} value={idx}>
                  #{s.snapshotNumber} ({s.id}) - {s.cpuAverage}% CPU
                </option>
              ))}
            </select>
          </div>

          <span className="text-zinc-500 font-bold hidden sm:inline">VS</span>

          <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-violet-400 font-bold">SNAPSHOT B:</span>
            <select
              value={indexB}
              onChange={(e) => {
                playTone(580, 0.04);
                setIndexB(Number(e.target.value));
              }}
              className="bg-zinc-900 text-white font-mono text-xs rounded-lg px-2 py-1 border border-white/15 focus:outline-none focus:border-violet-500"
            >
              {snapshots.map((s, idx) => (
                <option key={s.id} value={idx}>
                  #{s.snapshotNumber} ({s.id}) - {s.cpuAverage}% CPU
                </option>
              ))}
            </select>
          </div>

          {/* Generate Forensic Report (PDF) Action Button */}
          <button
            onClick={handleGeneratePdfReport}
            disabled={isExportingPdf}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isExportingPdf ? 'Compiling PDF...' : 'Generate Forensic Report (PDF)'}</span>
          </button>
        </div>
      </div>

      {pdfExportedName && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Forensic PDF Report compiled and saved: <strong className="text-white">{pdfExportedName}</strong></span>
          </div>
          <span className="text-[10px] text-zinc-400">SHA-256 Verified Document</span>
        </div>
      )}

      {/* Side-by-Side Comparison Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: CPU Average */}
        <div className="p-5 rounded-[24px] bg-[#0b0e1a]/70 border border-white/8 backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              CPU CLUSTER AVERAGE
            </span>
            {renderVarianceBadge(cpuVariance, '%', true)}
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5 text-xs">
            <div>
              <span className="text-[10px] text-cyan-400/80 block">SNAPSHOT A</span>
              <span className="text-xl font-bold text-white">{snapA.cpuAverage}%</span>
            </div>
            <div>
              <span className="text-[10px] text-violet-400/80 block">SNAPSHOT B</span>
              <span className="text-xl font-bold text-white">{snapB.cpuAverage}%</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Cryo Temperature */}
        <div className="p-5 rounded-[24px] bg-[#0b0e1a]/70 border border-white/8 backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-amber-400" />
              CRYO TEMPERATURE
            </span>
            {renderVarianceBadge(cryoVariance, 'mK', true)}
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5 text-xs">
            <div>
              <span className="text-[10px] text-cyan-400/80 block">SNAPSHOT A</span>
              <span className="text-xl font-bold text-white">{snapA.cryoTempMk} mK</span>
            </div>
            <div>
              <span className="text-[10px] text-violet-400/80 block">SNAPSHOT B</span>
              <span className="text-xl font-bold text-white">{snapB.cryoTempMk} mK</span>
            </div>
          </div>
        </div>

        {/* Metric 3: QOps Throughput */}
        <div className="p-5 rounded-[24px] bg-[#0b0e1a]/70 border border-white/8 backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-400" />
              QOPS THROUGHPUT
            </span>
            {renderVarianceBadge(qopsVariance, ' QOps')}
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5 text-xs">
            <div>
              <span className="text-[10px] text-cyan-400/80 block">SNAPSHOT A</span>
              <span className="text-xl font-bold text-white">{snapA.qopsThroughput}</span>
            </div>
            <div>
              <span className="text-[10px] text-violet-400/80 block">SNAPSHOT B</span>
              <span className="text-xl font-bold text-white">{snapB.qopsThroughput}</span>
            </div>
          </div>
        </div>

        {/* Metric 4: RAM Usage */}
        <div className="p-5 rounded-[24px] bg-[#0b0e1a]/70 border border-white/8 backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-violet-400" />
              RAM ALLOCATION
            </span>
            {renderVarianceBadge(ramVariance, 'MB', true)}
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5 text-xs">
            <div>
              <span className="text-[10px] text-cyan-400/80 block">SNAPSHOT A</span>
              <span className="text-xl font-bold text-white">{snapA.memoryUsedMb} MB</span>
            </div>
            <div>
              <span className="text-[10px] text-violet-400/80 block">SNAPSHOT B</span>
              <span className="text-xl font-bold text-white">{snapB.memoryUsedMb} MB</span>
            </div>
          </div>
        </div>
      </div>

      {/* In-Depth Side-by-Side Comparison Table */}
      <div className="p-6 rounded-[28px] bg-[#0b0e1a]/70 border border-white/8 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Detailed Hardware Subsystem Variance Matrix
          </h4>
          <span className="text-xs text-zinc-400">
            Epoch Delta: {Math.abs(snapB.epoch - snapA.epoch)} Epochs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400 text-[11px]">
                <th className="pb-3 pr-4">HARDWARE PARAMETER</th>
                <th className="pb-3 px-4 text-cyan-300">SNAPSHOT A (#{snapA.snapshotNumber})</th>
                <th className="pb-3 px-4 text-violet-300">SNAPSHOT B (#{snapB.snapshotNumber})</th>
                <th className="pb-3 pl-4 text-right">VARIANCE (DELTA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300">
              <tr>
                <td className="py-3 pr-4 text-zinc-400">Snapshot Identifier</td>
                <td className="py-3 px-4 font-bold text-white">{snapA.id}</td>
                <td className="py-3 px-4 font-bold text-white">{snapB.id}</td>
                <td className="py-3 pl-4 text-right text-zinc-500 font-mono">
                  {snapA.id === snapB.id ? 'IDENTICAL' : 'DISTINCT'}
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-zinc-400">Timestamp (ICT)</td>
                <td className="py-3 px-4">{snapA.timestampIct}</td>
                <td className="py-3 px-4">{snapB.timestampIct}</td>
                <td className="py-3 pl-4 text-right text-zinc-500">
                  {timestampFormat === 'block-height' ? 'BLOCK-LEVEL' : 'TEMPORAL DRIFT'}
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-zinc-400">CPU Core 0 (System)</td>
                <td className="py-3 px-4">{snapA.cpuCores[0]}%</td>
                <td className="py-3 px-4">{snapB.cpuCores[0]}%</td>
                <td className="py-3 pl-4 text-right">
                  {renderVarianceBadge(snapB.cpuCores[0] - snapA.cpuCores[0], '%', true)}
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-zinc-400">CPU Core 1 (Cryptographic)</td>
                <td className="py-3 px-4">{snapA.cpuCores[1]}%</td>
                <td className="py-3 px-4">{snapB.cpuCores[1]}%</td>
                <td className="py-3 pl-4 text-right">
                  {renderVarianceBadge(snapB.cpuCores[1] - snapA.cpuCores[1], '%', true)}
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-zinc-400">CPU Core 2 (AI Inference)</td>
                <td className="py-3 px-4">{snapA.cpuCores[2]}%</td>
                <td className="py-3 px-4">{snapB.cpuCores[2]}%</td>
                <td className="py-3 pl-4 text-right">
                  {renderVarianceBadge(snapB.cpuCores[2] - snapA.cpuCores[2], '%', true)}
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-zinc-400">CPU Core 3 (Consensus)</td>
                <td className="py-3 px-4">{snapA.cpuCores[3]}%</td>
                <td className="py-3 px-4">{snapB.cpuCores[3]}%</td>
                <td className="py-3 pl-4 text-right">
                  {renderVarianceBadge(snapB.cpuCores[3] - snapA.cpuCores[3], '%', true)}
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-zinc-400">Quantum Coherence Ratio</td>
                <td className="py-3 px-4">{snapA.coherencePct}%</td>
                <td className="py-3 px-4">{snapB.coherencePct}%</td>
                <td className="py-3 pl-4 text-right">
                  {renderVarianceBadge(coherenceVariance, '%')}
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-zinc-400">Sealed Status</td>
                <td className="py-3 px-4 text-emerald-400 font-semibold">{snapA.status}</td>
                <td className="py-3 px-4 text-emerald-400 font-semibold">{snapB.status}</td>
                <td className="py-3 pl-4 text-right text-emerald-400">
                  <Check className="w-4 h-4 inline" /> VERIFIED
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
