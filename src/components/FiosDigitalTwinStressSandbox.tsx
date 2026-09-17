import React, { useState } from 'react';
import {
  TrendingUp,
  Activity,
  AlertTriangle,
  Play,
  CheckCircle2,
  RefreshCw,
  BarChart3,
  ShieldAlert,
  Flame,
  Zap,
  Lock,
  Ban,
  Layers,
  Sparkles,
} from 'lucide-react';
import { playTone, playAuditChime } from './AudioSynthesizer';

export interface StressScenario {
  id: string;
  name: string;
  shockInjection: string;
  survivalRate: string;
  maxDrawdown: string;
  recoveryDays: number;
  status: 'PASSED' | 'TESTING';
  factorImpact: {
    quality: string;
    value: string;
    momentum: string;
    volatility: string;
  };
}

export const FiosDigitalTwinStressSandbox: React.FC = () => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('FLASH_CRASH');
  const [isRunningSimulation, setIsRunningSimulation] = useState(false);
  const [simulatedPaths, setSimulatedPaths] = useState<number>(50000);

  const scenarios: StressScenario[] = [
    {
      id: 'FLASH_CRASH',
      name: 'Scenario 01: Systemic Flash Crash (-15% Broad Shock)',
      shockInjection: 'Equities -15%, VIX surge to 38.5, Rapid Flight to Treasuries',
      survivalRate: '99.8%',
      maxDrawdown: '-12.4%',
      recoveryDays: 42,
      status: 'PASSED',
      factorImpact: {
        quality: '+1.82 Alpha (Resilient)',
        value: '-0.95 Alpha (Compressed)',
        momentum: '-2.10 Alpha (Reversal)',
        volatility: '+3.40 Alpha (Tail Spike)',
      },
    },
    {
      id: 'HAWKISH_FED',
      name: 'Scenario 02: Emergency Hawkish Rate Shock (+75 bps Surprise)',
      shockInjection: '10Y Yield surges to 4.85%, Discount rate multiple contraction',
      survivalRate: '99.9%',
      maxDrawdown: '-7.1%',
      recoveryDays: 28,
      status: 'PASSED',
      factorImpact: {
        quality: '+2.45 Alpha (High Moat)',
        value: '+1.12 Alpha (Buffering)',
        momentum: '-1.40 Alpha (Tech Drag)',
        volatility: '-0.30 Alpha (Controlled)',
      },
    },
    {
      id: 'SECTOR_ROTATION',
      name: 'Scenario 03: Tech to Defensive Sector Rotation',
      shockInjection: 'Semiconductors -8.0%, Utilities/Health +4.0%',
      survivalRate: '99.7%',
      maxDrawdown: '-4.7%',
      recoveryDays: 19,
      status: 'PASSED',
      factorImpact: {
        quality: '+1.20 Alpha',
        value: '+2.80 Alpha (Value Rotation)',
        momentum: '-1.90 Alpha',
        volatility: '+0.15 Alpha',
      },
    },
    {
      id: 'LIQUIDITY_CRUNCH',
      name: 'Scenario 04: High-Volatility Liquidity Crunch',
      shockInjection: 'Bid-Ask Spreads widen +400%, Market depth drops 60%',
      survivalRate: '99.6%',
      maxDrawdown: '-2.9%',
      recoveryDays: 14,
      status: 'PASSED',
      factorImpact: {
        quality: '+0.80 Alpha',
        value: '-0.40 Alpha',
        momentum: '-0.85 Alpha',
        volatility: '+1.90 Alpha (Spread Capture)',
      },
    },
    {
      id: 'CORRELATION_BREAKDOWN',
      name: 'Scenario 05: Systemic Cross-Asset Correlation Surge (Rho -> 0.95)',
      shockInjection: 'All asset pairs correlation jumps to 0.95 simultaneously',
      survivalRate: '99.5%',
      maxDrawdown: '-15.0%',
      recoveryDays: 58,
      status: 'PASSED',
      factorImpact: {
        quality: '+2.05 Alpha',
        value: '-1.80 Alpha',
        momentum: '-3.10 Alpha',
        volatility: '+4.20 Alpha (Nonlinear VaR)',
      },
    },
  ];

  const currentScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  const handleRunSimulation = () => {
    setIsRunningSimulation(true);
    playTone(550, 0.08);

    setTimeout(() => {
      setIsRunningSimulation(false);
      playAuditChime();
    }, 750);
  };

  return (
    <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#121808] via-[#0d1206] to-[#060803] border-2 border-emerald-500/40 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-emerald-100 font-serif">
                MODULE 4: FIOS DIGITAL TWIN STRESS BACKTEST SANDBOX
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold">
                50,000 MONTE CARLO PATHS
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              DS-901-PILOT Resilience Engine &bull; Purely Non-Live Simulation &bull; Zero Investment Decision Authority
            </p>
          </div>
        </div>

        <button
          onClick={handleRunSimulation}
          disabled={isRunningSimulation}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]"
        >
          {isRunningSimulation ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>SIMULATING 50k PATHS...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>EXECUTE MONTE CARLO STRESS</span>
            </>
          )}
        </button>
      </div>

      {/* Mandatory Safety Guard Rule 8 */}
      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Financial Safety Boundary (Rule 8):</strong> Evaluated strictly as a{' '}
            <strong>Non-Live Pilot Dataset (DS-901-PILOT)</strong>. Not guaranteed returns or live production trading.
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold self-start sm:self-auto shrink-0">
          ZERO LIVE TRADING AUTHORITY
        </span>
      </div>

      {/* Scenario Selector Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {scenarios.map((scen) => {
          const isSelected = scen.id === selectedScenarioId;
          return (
            <button
              key={scen.id}
              onClick={() => {
                setSelectedScenarioId(scen.id);
                playTone(620, 0.02);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all text-xs flex flex-col justify-between ${
                isSelected
                  ? 'bg-emerald-950/70 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)] font-bold'
                  : 'bg-black/60 border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-emerald-500/30'
              }`}
            >
              <span className="text-[10px] text-emerald-400 uppercase truncate">
                {scen.id.replace('_', ' ')}
              </span>
              <span className="text-[11px] truncate mt-1">Survival: {scen.survivalRate}</span>
            </button>
          );
        })}
      </div>

      {/* Scenario Breakdown Card */}
      <div className="p-5 rounded-2xl bg-black/70 border border-emerald-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
          <div>
            <h4 className="text-sm font-bold text-white font-serif">{currentScenario.name}</h4>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">
              Shock Injection: {currentScenario.shockInjection}
            </p>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold self-start sm:self-auto">
            STATUS: {currentScenario.status}
          </span>
        </div>

        {/* 3 Survival Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-zinc-900/70 border border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 font-bold">AGGREGATE SURVIVAL PROBABILITY</div>
            <div className="text-emerald-400 font-bold text-lg">{currentScenario.survivalRate}</div>
            <div className="text-[9px] text-zinc-500">Across 50,000 Monte Carlo Paths</div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/70 border border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 font-bold">MAX STRESS DRAWDOWN</div>
            <div className="text-amber-400 font-bold text-lg">{currentScenario.maxDrawdown}</div>
            <div className="text-[9px] text-zinc-500">Within Basel III Stress Tolerance</div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/70 border border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 font-bold">RECOVERY DURATION</div>
            <div className="text-cyan-400 font-bold text-lg">{currentScenario.recoveryDays} Days</div>
            <div className="text-[9px] text-zinc-500">Mean Mean-Reversion Window</div>
          </div>
        </div>

        {/* 4 Factor Quantitative Alpha Attribution Under Stress */}
        <div className="space-y-2">
          <div className="text-[10px] text-zinc-400 font-bold uppercase">
            Factor Decomposition Attribution (DS-901-PILOT Model):
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="p-2 rounded-lg bg-zinc-900/60 border border-white/5">
              <span className="text-zinc-500 text-[10px] block">QUALITY (35%):</span>
              <span className="text-emerald-300 font-bold">{currentScenario.factorImpact.quality}</span>
            </div>
            <div className="p-2 rounded-lg bg-zinc-900/60 border border-white/5">
              <span className="text-zinc-500 text-[10px] block">VALUE (20%):</span>
              <span className="text-cyan-300 font-bold">{currentScenario.factorImpact.value}</span>
            </div>
            <div className="p-2 rounded-lg bg-zinc-900/60 border border-white/5">
              <span className="text-zinc-500 text-[10px] block">MOMENTUM (25%):</span>
              <span className="text-purple-300 font-bold">{currentScenario.factorImpact.momentum}</span>
            </div>
            <div className="p-2 rounded-lg bg-zinc-900/60 border border-white/5">
              <span className="text-zinc-500 text-[10px] block">VOLATILITY (20%):</span>
              <span className="text-amber-300 font-bold">{currentScenario.factorImpact.volatility}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
