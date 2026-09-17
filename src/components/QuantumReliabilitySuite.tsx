"use client";

import React, { useState } from 'react';
import { ComplianceAuditSimulator } from './ComplianceAuditSimulator';
import { ForensicLedgerMap } from './ForensicLedgerMap';
import { QuantumAnomalyPredictor } from './QuantumAnomalyPredictor';
import { ShieldCheck, Sparkles, Layers, Activity, FileCheck, RefreshCw } from 'lucide-react';
import { SSOT } from '../lib/ssot-data';

export interface QuantumReliabilitySuiteProps {
  telemetryData?: any;
  chambers?: any;
  className?: string;
}

export const QuantumReliabilitySuite: React.FC<QuantumReliabilitySuiteProps> = ({
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'compliance' | 'anomaly' | 'forensics'>('all');

  return (
    <div
      className={`bg-zinc-950 border border-cyan-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-6 text-zinc-100 backdrop-blur-xl ${className}`}
    >
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/60 flex items-center justify-center text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                QUANTUM RELIABILITY SUITE v∞
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 text-[10px] font-mono font-bold">
                AUDIT &bull; TELEMETRY &bull; FORENSICS
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold font-mono text-zinc-100 mt-0.5">
              Unified Sovereign Reliability &amp; Forensic Architecture
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-zinc-400">
          <div className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-yellow-400" />
            <span>Block #{SSOT.canonicalBlockHeight} &bull; 14,902 Seals Invariant</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800/80 pb-3 text-xs font-mono">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-xl transition border ${
            activeTab === 'all'
              ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-bold shadow'
              : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          ภาพรวมทั้งหมด (Unified View)
        </button>
        <button
          onClick={() => setActiveTab('compliance')}
          className={`px-3 py-1.5 rounded-xl transition border ${
            activeTab === 'compliance'
              ? 'bg-emerald-950 text-emerald-300 border-emerald-500 font-bold shadow'
              : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          1. Statutory Compliance (ม.๙, ๒๖, ๒๘ &amp; PDPA)
        </button>
        <button
          onClick={() => setActiveTab('anomaly')}
          className={`px-3 py-1.5 rounded-xl transition border ${
            activeTab === 'anomaly'
              ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-bold shadow'
              : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          2. Quantum Anomaly &amp; Threat Predictor
        </button>
        <button
          onClick={() => setActiveTab('forensics')}
          className={`px-3 py-1.5 rounded-xl transition border ${
            activeTab === 'forensics'
              ? 'bg-violet-950 text-violet-300 border-violet-500 font-bold shadow'
              : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          3. Forensic Ledger Map (142ms Replay &amp; 7 Evidences)
        </button>
      </div>

      {/* Main Multi-Column Reliability Grid */}
      {activeTab === 'all' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Compliance Audit & Quantum Anomaly Predictor (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <ComplianceAuditSimulator />
            <QuantumAnomalyPredictor />
          </div>

          {/* Right Column: Forensic Ledger Map (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <ForensicLedgerMap />
          </div>
        </div>
      )}

      {activeTab === 'compliance' && (
        <div className="max-w-4xl mx-auto">
          <ComplianceAuditSimulator />
        </div>
      )}

      {activeTab === 'anomaly' && (
        <div className="max-w-4xl mx-auto">
          <QuantumAnomalyPredictor />
        </div>
      )}

      {activeTab === 'forensics' && (
        <div className="max-w-4xl mx-auto">
          <ForensicLedgerMap />
        </div>
      )}

      {/* Footer Reliability Attestation */}
      <div className="p-4 bg-black/90 border border-cyan-900/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left font-mono text-xs text-cyan-300">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <span>
            Ω601–Ω21000 Boundary Active &bull; Phase Lock Stable &bull; Zero Trust Integrity 100%
          </span>
        </div>
        <span className="text-[11px] text-zinc-400">
          Sovereign Architect: {SSOT.sovereignPrincipal}
        </span>
      </div>
    </div>
  );
};

export default QuantumReliabilitySuite;
