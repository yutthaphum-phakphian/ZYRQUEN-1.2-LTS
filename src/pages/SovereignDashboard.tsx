/**
 * ZYRQUEN Ω∞ Unified Sentinel & Gateways Control Plane
 * Sovereign Principal Architect: นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)
 * Multi-Column CSS Grid Dashboard with Tab Navigation
 */
import React, { useState } from 'react';
import {
  Cpu,
  Activity,
  ShieldAlert,
  Terminal,
  Layers,
  LayoutGrid,
  CheckCircle2,
} from 'lucide-react';
import { SentinelRemediation } from '../components/SentinelRemediation';
import { SovereignGateways } from '../components/SovereignGateways';
import {
  CommandCenterOperationsConsole,
  type StagedAiCommandRequest,
} from '../components/CommandCenterOperationsConsole';
import { SovereignEngineHeader } from '../components/core/SovereignEngineHeader';
import { OverviewTab } from '../views/overview/OverviewTab';
import { OperationsTab } from '../views/operations/OperationsTab';
import { ForensicsTab } from '../views/forensics/ForensicsTab';
import { ChartAnimationToggle } from '../components/dashboard/ChartAnimationToggle';
import { playTone } from '../components/AudioSynthesizer';

export interface SovereignDashboardProps {
  initialModule?: 'operations' | 'self-tuning' | 'voice-builder';
  stagedAiRequest?: StagedAiCommandRequest | null;
  onConsumeStagedAiRequest?: () => void;
  onSystemAuditLog?: (action: string, details: string, status: 'VERIFIED' | 'BLOCKED') => void;
}

export const SovereignDashboard: React.FC<SovereignDashboardProps> = ({
  initialModule = 'operations',
  stagedAiRequest = null,
  onConsumeStagedAiRequest,
  onSystemAuditLog,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'telemetry' | 'forensics' | 'ops-console'>('overview');
  const [alertLevel, setAlertLevel] = useState<'NOMINAL' | 'CRITICAL'>('NOMINAL');

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    playTone(650, 0.04);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 space-y-6 font-sans">
      {/* 1. Header & Key System Metrics (Fixed Top Banner) */}
      <section>
        <SovereignEngineHeader activeViewTitle="ZYRQUEN Ω∞ SOVEREIGN SENTINEL & GATEWAYS" />
      </section>

      {/* Sentinel & Gateway Realtime Quorum Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <SentinelRemediation monitoringIntervalMs={4500} onAlertLevelChange={setAlertLevel} />
        </section>
        <section>
          <SovereignGateways alertLevel={alertLevel} />
        </section>
      </div>

      {/* 2. Tab Navigation (Switch between Grid Views) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleTabChange('overview')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800'
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-cyan-400" />
            <span>System Overview (Grid)</span>
          </button>

          <button
            onClick={() => handleTabChange('telemetry')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeTab === 'telemetry'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Telemetry &amp; Ops</span>
          </button>

          <button
            onClick={() => handleTabChange('forensics')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeTab === 'forensics'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Audit &amp; Forensics</span>
          </button>

          <button
            onClick={() => handleTabChange('ops-console')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeTab === 'ops-console'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.25)]'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4 text-violet-400" />
            <span>Deep Ops Console</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <ChartAnimationToggle variant="compact" />
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>SSoT Δ0.00%</span>
            <span className="text-slate-700">•</span>
            <span>10/10 REAL_HSM</span>
          </div>
        </div>
      </div>

      {/* 3. Main Multi-Column Content Area */}
      <main>
        {activeTab === 'overview' && (
          <OverviewTab />
        )}

        {activeTab === 'telemetry' && (
          <OperationsTab />
        )}

        {activeTab === 'forensics' && (
          <ForensicsTab />
        )}

        {activeTab === 'ops-console' && (
          <div className="space-y-6">
            <section>
              <CommandCenterOperationsConsole
                embedded={true}
                initialModule={initialModule}
                stagedAiRequest={stagedAiRequest}
                onConsumeStagedAiRequest={onConsumeStagedAiRequest}
                onSystemAuditLog={onSystemAuditLog}
              />
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default SovereignDashboard;
