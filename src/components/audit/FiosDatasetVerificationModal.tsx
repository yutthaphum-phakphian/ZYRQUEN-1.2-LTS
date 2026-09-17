import React, { useState } from 'react';
import {
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Database,
  BarChart3,
  Layers,
  FileCode,
  Lock,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { CANONICAL_FIOS_DATASET } from '../FiosFactorIntelligence';
import { copyToClipboard } from '../../utils/clipboard';
import { playAuditChime, playTone } from '../AudioSynthesizer';

export const FiosDatasetVerificationModal: React.FC = () => {
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [showJsonRaw, setShowJsonRaw] = useState<boolean>(false);

  const dataset = CANONICAL_FIOS_DATASET;

  const handleCopyHash = () => {
    copyToClipboard(dataset.provenance.hash);
    setCopiedHash(true);
    playTone(680, 0.04);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleCopyJson = () => {
    copyToClipboard(JSON.stringify(dataset, null, 2));
    setCopiedJson(true);
    playAuditChime();
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleDownloadJson = () => {
    playAuditChime();
    const blob = new Blob([JSON.stringify(dataset, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MAEW_FIOS_ULTIMATE_${dataset.datasetId}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-black to-emerald-950/30 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
              {dataset.datasetId}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
              {dataset.provenance.bindingStatus}
            </span>
          </div>
          <h3 className="text-sm font-bold text-white mt-1">
            {dataset.manifesto}
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Governing Body: <span className="text-zinc-200">{dataset.governingBody}</span> • Asset Class: <span className="text-cyan-300">{dataset.assetClass}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyJson}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 flex items-center gap-1.5 cursor-pointer"
          >
            {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedJson ? 'JSON Copied' : 'Copy JSON'}</span>
          </button>
          <button
            onClick={handleDownloadJson}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Artifact</span>
          </button>
        </div>
      </div>

      {/* Provenance Hash Card */}
      <div className="p-3 rounded-xl bg-black/60 border border-white/8 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="truncate">
          <span className="text-zinc-500 text-[10px] uppercase font-bold mr-2">Provenance Digest:</span>
          <code className="text-emerald-400 text-[11px]">{dataset.provenance.hash}</code>
        </div>
        <button
          onClick={handleCopyHash}
          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-200 text-[10px] shrink-0 flex items-center gap-1 cursor-pointer"
        >
          {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copiedHash ? 'Copied' : 'Copy Hash'}</span>
        </button>
      </div>

      {/* 4 Core Factor Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {dataset.metrics.map((factor) => (
          <div
            key={factor.factor}
            className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2 hover:border-cyan-500/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs">{factor.factor} Factor</span>
              <span className="text-[10px] text-zinc-500">Weight: {(factor.weight * 100).toFixed(0)}%</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center py-1 bg-white/[0.02] rounded-lg border border-white/5">
              <div>
                <div className="text-[10px] text-zinc-500">Alpha</div>
                <div className="text-xs font-bold text-emerald-400">+{factor.alpha.toFixed(2)}%</div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500">Z-Score</div>
                <div className="text-xs font-bold text-cyan-300">{factor.zScore.toFixed(2)}σ</div>
              </div>
            </div>

            <div className="text-[10px] text-amber-300/90 font-bold">{factor.exposure}</div>
            <p className="text-[10px] text-zinc-400 leading-relaxed line-clamp-2">{factor.description}</p>
          </div>
        ))}
      </div>

      {/* Backtest Statistics */}
      <div className="p-4 rounded-xl bg-black/40 border border-white/8 space-y-2">
        <div className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Fiduciary Backtest &amp; Performance Bounds (Sovereign Verification)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
            <div className="text-zinc-500 text-[10px]">Trailing 30D Return</div>
            <div className="text-sm font-bold text-emerald-400">+{dataset.backtestPerformance.trailing30DaysReturnPct}%</div>
          </div>
          <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
            <div className="text-zinc-500 text-[10px]">Annualized Sharpe</div>
            <div className="text-sm font-bold text-cyan-300">{dataset.backtestPerformance.annualizedSharpeRatio}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
            <div className="text-zinc-500 text-[10px]">Max Drawdown</div>
            <div className="text-sm font-bold text-rose-400">{dataset.backtestPerformance.maxDrawdownPct}%</div>
          </div>
          <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
            <div className="text-zinc-500 text-[10px]">Uptime SLA Compliance</div>
            <div className="text-sm font-bold text-emerald-300">{dataset.backtestPerformance.uptimeSlaCompliancePct}%</div>
          </div>
        </div>
      </div>

      {/* Raw JSON Toggle */}
      <div className="text-right">
        <button
          onClick={() => setShowJsonRaw(!showJsonRaw)}
          className="text-[11px] text-zinc-400 hover:text-white underline cursor-pointer"
        >
          {showJsonRaw ? 'Hide Raw Canonical JSON' : 'View Raw Canonical JSON Schema'}
        </button>
      </div>

      {showJsonRaw && (
        <pre className="p-4 rounded-xl bg-black border border-white/10 text-[10px] text-emerald-400 overflow-x-auto max-h-60 leading-tight">
          {JSON.stringify(dataset, null, 2)}
        </pre>
      )}
    </div>
  );
};
