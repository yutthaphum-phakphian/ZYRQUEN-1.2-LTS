import React, { useState } from 'react';
import {
  TrendingUp,
  ShieldCheck,
  Award,
  Layers,
  BarChart3,
  Activity,
  Download,
  Copy,
  Check,
  CheckCircle2,
  FileCode,
  DollarSign,
  Sparkles,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Database,
  Lock,
} from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';

export interface FiosFactorData {
  factor: string;
  weight: number;
  alpha: number;
  zScore: number;
  description: string;
  exposure: string;
}

export interface FiosDatasetManifesto {
  manifesto: string;
  datasetId: string;
  generatedAt: string;
  governingBody: string;
  assetClass: string;
  metrics: FiosFactorData[];
  backtestPerformance: {
    trailing30DaysReturnPct: number;
    annualizedSharpeRatio: number;
    maxDrawdownPct: number;
    uptimeSlaCompliancePct: number;
  };
  provenance: {
    hash: string;
    classification: string;
    bindingStatus: string;
  };
}

export const CANONICAL_FIOS_DATASET: FiosDatasetManifesto = {
  manifesto: 'MAEW Ω∞ FIOS ULTIMATE v2.1 LTS',
  datasetId: 'DS-901-PILOT',
  generatedAt: '2026-08-03T04:31:50.500Z',
  governingBody: 'Maew & Partners Fiduciary Control',
  assetClass: 'Sovereign Managed Securities & Equities',
  metrics: [
    {
      factor: 'Quality',
      weight: 0.35,
      alpha: 2.15,
      zScore: 2.31,
      description: 'High return on invested capital (ROIC) and sovereign balance sheet stability',
      exposure: 'OVERWEIGHT (35%)',
    },
    {
      factor: 'Value',
      weight: 0.2,
      alpha: 1.84,
      zScore: 1.45,
      description: 'Discounted intrinsic cash flow & defensive sovereign enterprise multiples',
      exposure: 'BALANCED (20%)',
    },
    {
      factor: 'Momentum',
      weight: 0.25,
      alpha: 2.76,
      zScore: 2.85,
      description: 'Persistent 6-12 month institutional alpha trend acceleration',
      exposure: 'OVERWEIGHT (25%)',
    },
    {
      factor: 'Volatility',
      weight: 0.2,
      alpha: -0.42,
      zScore: -0.92,
      description: 'Inverse tail-risk dampener & systemic drawdown hedging shield',
      exposure: 'HEDGED (20%)',
    },
  ],
  backtestPerformance: {
    trailing30DaysReturnPct: 12.42,
    annualizedSharpeRatio: 2.41,
    maxDrawdownPct: -4.18,
    uptimeSlaCompliancePct: 99.98,
  },
  provenance: {
    hash: 'SHA256:8f912cba9910e53a201b4491763a43fa4c68909ab814479844d8a14816bed34c',
    classification: 'SOVEREIGN_FIDUCIARY_INTELLIGENCE',
    bindingStatus: 'FROZEN_LAYER_COMPATIBLE (ZERO_MUTATION)',
  },
};

export const FiosFactorIntelligence: React.FC = () => {
  const [selectedFactor, setSelectedFactor] = useState<string>('Quality');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const dataset = CANONICAL_FIOS_DATASET;

  // Calculate Weighted Alpha
  const weightedAlpha = dataset.metrics
    .reduce((acc, m) => acc + m.weight * m.alpha, 0)
    .toFixed(2);

  const handleCopy = (text: string, id: string) => {
    copyToClipboard(text);
    setCopiedKey(id);
    playTone(740, 0.03);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleExportJson = () => {
    setIsExporting(true);
    playTone(600, 0.05);
    setTimeout(() => {
      const blob = new Blob([JSON.stringify(dataset, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MAEW_FIOS_ULTIMATE_${dataset.datasetId}_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setIsExporting(false);
      playAuditChime();
    }, 350);
  };

  const currentFactor = dataset.metrics.find((m) => m.factor === selectedFactor) || dataset.metrics[0];

  return (
    <div id="fios-factor-intelligence-suite" className="space-y-6 font-mono">
      {/* Top Header Card */}
      <div className="p-6 rounded-[28px] bg-gradient-to-r from-[#0d1527]/95 via-[#0c1220]/90 to-[#070b14] border-2 border-cyan-500/40 shadow-2xl backdrop-blur-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400 text-cyan-300 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-bold text-cyan-100 font-serif">
                  {dataset.manifesto}
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold">
                  {dataset.datasetId}
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  FIDUCIARY CONTROL: PASS
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-serif mt-1">
                {dataset.governingBody} &bull; {dataset.assetClass}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end lg:self-center">
            <button
              onClick={handleExportJson}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'EXPORTING...' : 'EXPORT FIOS DATASET (JSON)'}</span>
            </button>
          </div>
        </div>

        {/* 4-Key Performance KPI Cards */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-black/60 border border-emerald-500/30 space-y-1">
            <div className="text-[10px] text-zinc-400 flex items-center justify-between">
              <span>TRAILING 30D RETURN</span>
              <ArrowUpRight className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="font-mono text-emerald-400 text-base font-bold">
              +{dataset.backtestPerformance.trailing30DaysReturnPct}%
            </div>
            <div className="text-[9px] text-emerald-400 font-bold">High Alpha Performance</div>
          </div>

          <div className="p-3 rounded-xl bg-black/60 border border-cyan-500/30 space-y-1">
            <div className="text-[10px] text-zinc-400 flex items-center justify-between">
              <span>ANNUALIZED SHARPE</span>
              <Activity className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="font-mono text-cyan-300 text-base font-bold">
              {dataset.backtestPerformance.annualizedSharpeRatio}
            </div>
            <div className="text-[9px] text-cyan-400 font-bold">Institutional Risk-Adjusted</div>
          </div>

          <div className="p-3 rounded-xl bg-black/60 border border-amber-500/30 space-y-1">
            <div className="text-[10px] text-zinc-400 flex items-center justify-between">
              <span>MAX DRAWDOWN</span>
              <ArrowDownRight className="w-3 h-3 text-amber-400" />
            </div>
            <div className="font-mono text-amber-400 text-base font-bold">
              {dataset.backtestPerformance.maxDrawdownPct}%
            </div>
            <div className="text-[9px] text-zinc-400">Strict Tail-Risk Bounds</div>
          </div>

          <div className="p-3 rounded-xl bg-black/60 border border-purple-500/30 space-y-1">
            <div className="text-[10px] text-zinc-400 flex items-center justify-between">
              <span>WEIGHTED ALPHA</span>
              <Sparkles className="w-3 h-3 text-purple-400" />
            </div>
            <div className="font-mono text-purple-300 text-base font-bold">
              +{weightedAlpha}%
            </div>
            <div className="text-[9px] text-purple-400 font-bold">Aggregate 4-Factor Net</div>
          </div>
        </div>
      </div>

      {/* Factor Breakdown Grid & Factor Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Factor Cards */}
        <div className="lg:col-span-2 p-6 rounded-[28px] bg-[#090d18] border border-cyan-500/30 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-cyan-100 font-serif">
                QUANTITATIVE FACTOR ATTRIBUTION &amp; Z-SCORES
              </h3>
            </div>
            <span className="text-[10px] text-zinc-400">
              Total Weight: <strong>100.0%</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {dataset.metrics.map((m) => {
              const isSelected = selectedFactor === m.factor;
              return (
                <button
                  key={m.factor}
                  onClick={() => {
                    setSelectedFactor(m.factor);
                    playTone(650 + m.weight * 200, 0.03);
                  }}
                  className={`p-4 rounded-2xl text-left transition-all border ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                      : 'bg-black/60 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-zinc-100">{m.factor}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-black/60 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                      {(m.weight * 100).toFixed(0)}% Weight
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-zinc-400 mt-2">
                    <div>
                      Alpha: <strong className={m.alpha >= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                        {m.alpha >= 0 ? `+${m.alpha}` : m.alpha}
                      </strong>
                    </div>
                    <div>
                      z-Score: <strong className={m.zScore >= 0 ? 'text-purple-300' : 'text-zinc-400'}>
                        {m.zScore >= 0 ? `+${m.zScore}` : m.zScore}
                      </strong>
                    </div>
                  </div>

                  {/* Visual Weight Bar */}
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-3 overflow-hidden">
                    <div
                      className="bg-cyan-400 h-full rounded-full"
                      style={{ width: `${m.weight * 100}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3.5 rounded-xl bg-black/80 border border-white/5 text-xs text-zinc-300 space-y-1">
            <div className="font-bold text-cyan-300 text-xs">
              Selected Factor Dossier: {currentFactor.factor}
            </div>
            <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
              {currentFactor.description}
            </p>
            <div className="flex items-center gap-4 text-[10px] font-mono pt-1 text-zinc-500">
              <span>Strategy Exposure: <strong className="text-cyan-300">{currentFactor.exposure}</strong></span>
              <span>Normalized z-Score: <strong className="text-purple-300">{currentFactor.zScore} &sigma;</strong></span>
            </div>
          </div>
        </div>

        {/* Right: Provenance & Fiduciary Governance Panel */}
        <div className="p-6 rounded-[28px] bg-[#090d18] border border-cyan-500/30 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-emerald-100 font-serif">
                FIDUCIARY PROVENANCE
              </h3>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <div className="text-[10px] text-zinc-500">TIMESTAMP (UTC):</div>
                <div className="text-zinc-300 text-[11px]">{dataset.generatedAt}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <div className="text-[10px] text-zinc-500">UPTIME SLA COMPLIANCE:</div>
                <div className="text-emerald-400 font-bold">{dataset.backtestPerformance.uptimeSlaCompliancePct}%</div>
              </div>

              <div className="p-2.5 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <div className="text-[10px] text-zinc-500">DATASET DIGEST:</div>
                <div className="text-cyan-300 text-[10px] truncate">{dataset.provenance.hash}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <div className="text-[10px] text-zinc-500">BINDING COMPATIBILITY:</div>
                <div className="text-emerald-300 text-[10px] font-bold">{dataset.provenance.bindingStatus}</div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-200 leading-relaxed font-mono">
            <strong>Immutable Fiduciary Guarantee:</strong> Ingested as read-only sovereign quantitative dataset. Preserves Frozen Baseline v1.2 LTS and SSoT Mutation = 0.
          </div>
        </div>
      </div>
    </div>
  );
};
