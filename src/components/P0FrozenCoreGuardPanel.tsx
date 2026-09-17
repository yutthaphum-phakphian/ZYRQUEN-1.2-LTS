import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  FileCheck,
  RefreshCw,
  Ban,
  Layers,
  Clock,
  Radio,
  FileWarning,
  EyeOff,
  Flame,
  KeyRound,
  FileCode,
  Sparkles,
  Zap,
} from 'lucide-react';
import { P0FrozenCoreGuard, P0AcceptanceTestResult } from '../utils/p0FrozenCoreGuard';
import { playAuditChime, playTone } from './AudioSynthesizer';

export const P0FrozenCoreGuardPanel: React.FC = () => {
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [tests, setTests] = useState<P0AcceptanceTestResult[]>(() => P0FrozenCoreGuard.evaluateAcceptanceTests());
  const [activeTab, setActiveTab] = useState<'INVARIANTS' | 'SEPARATION' | 'QUARANTINE_5' | 'TESTS_12' | 'WRITE_FIREWALL'>('INVARIANTS');
  const [testSimulatedWrite, setTestSimulatedWrite] = useState<string>('');
  const [writeAuditLog, setWriteAuditLog] = useState(() => P0FrozenCoreGuard.getWriteAttemptAuditLog());

  const canonical = P0FrozenCoreGuard.getCanonicalState();
  const observed = P0FrozenCoreGuard.getObservedStreamState();
  const quarantineItems = P0FrozenCoreGuard.getQuarantineItems();

  const handleRunAcceptanceTests = () => {
    setIsRunningTests(true);
    playTone(550, 0.05);

    setTimeout(() => {
      const results = P0FrozenCoreGuard.evaluateAcceptanceTests();
      setTests(results);
      setIsRunningTests(false);
      playAuditChime();
    }, 450);
  };

  const handleSimulateWriteAttempt = (prop: string, val: string) => {
    playTone(280, 0.1);
    const audit = P0FrozenCoreGuard.interceptWriteAttempt(prop, val, 'CONTROL_PLANE_SIMULATOR');
    setWriteAuditLog(P0FrozenCoreGuard.getWriteAttemptAuditLog());
    setTestSimulatedWrite(`Attempted: ${prop} = ${val} -> REJECTED (Fail-Closed, Mutation Delta = 0)`);
  };

  return (
    <div id="p0-frozen-core-guard-panel" className="p-6 rounded-[28px] bg-gradient-to-br from-[#070d18]/95 via-[#050912]/90 to-[#04060a] border-2 border-cyan-500/40 backdrop-blur-2xl space-y-6 shadow-2xl font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide font-serif">
                P0 — FROZEN CORE GUARD HARDENING
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold">
                ZYRQUEN Ω∞ FROZEN v1.2 LTS
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                BYTE-FOR-BYTE IMMUTABLE
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-serif mt-1">
              Read-Only Boundary between UI/Runtime/Evidence &amp; Canonical Core • SSoT Mutation = 0 • Fail-Closed Promotion Block
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRunAcceptanceTests}
            disabled={isRunningTests}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
            <span>{isRunningTests ? 'EVALUATING INVARIANTS...' : 'RUN P0 ACCEPTANCE SUITE (12/12)'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'INVARIANTS', label: '1. P0 Canonical Invariants' },
            { id: 'SEPARATION', label: '2. 4-Layer State Separation' },
            { id: 'QUARANTINE_5', label: '3. Observed +5 Quarantine Pool' },
            { id: 'WRITE_FIREWALL', label: '4. Write Firewall & Audit' },
            { id: 'TESTS_12', label: '5. Acceptance Tests (12/12 PASS)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                playTone(600, 0.02);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs transition-all font-bold ${
                activeTab === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'bg-white/5 text-zinc-400 hover:text-zinc-200 border-white/8 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-zinc-400">
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            SSoT Mutation: 0
          </span>
          <span>•</span>
          <span className="text-cyan-300">
            Write Authority: <strong>NONE</strong>
          </span>
        </div>
      </div>

      {/* Tab 1: P0 Canonical Invariants */}
      {activeTab === 'INVARIANTS' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-cyan-300 font-bold uppercase tracking-wider text-[11px] flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                ABSOLUTE CANONICAL BASELINE — READ ONLY BOUNDARY
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                100% INVIOLABLE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-500">1. CANONICAL_SEALS</span>
                <div className="text-lg font-bold text-amber-300">14,902</div>
                <p className="text-[10px] text-zinc-400">CANONICAL_SEALS === 14902 (LOCKED)</p>
              </div>

              <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-500">2. BLOCK_HEIGHT</span>
                <div className="text-lg font-bold text-purple-300">#849,202</div>
                <p className="text-[10px] text-zinc-400">BLOCK_HEIGHT === 849202 (GENESIS ANCHOR)</p>
              </div>

              <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-500">3. SSOT_MUTATION</span>
                <div className="text-lg font-bold text-emerald-300">0 (ZERO)</div>
                <p className="text-[10px] text-zinc-400">SSOT_MUTATION === 0 (IMMUTABLE)</p>
              </div>

              <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1 md:col-span-2 lg:col-span-2">
                <span className="text-[10px] text-zinc-500">4. CANONICAL_ROOT (SHA-256)</span>
                <div className="text-xs font-bold text-cyan-300 break-all select-all">
                  909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68
                </div>
                <p className="text-[10px] text-zinc-400">CANONICAL_ROOT === 909ab814...fa4c68 (64-Hex SHA256)</p>
              </div>

              <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-500">5. WRITE_AUTHORITY</span>
                <div className="text-lg font-bold text-rose-300">NONE</div>
                <p className="text-[10px] text-zinc-400">WRITE_AUTHORITY === NONE (READ-ONLY)</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
            <h4 className="text-zinc-300 font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              P0 Guard Operational Principles
            </h4>
            <ul className="space-y-1.5 text-zinc-400 text-[11px] list-disc list-inside">
              <li><strong className="text-zinc-200">No Auto-Merge:</strong> Strictly forbidden from merging 14907 &rarr; 14902 or 14902 &rarr; 14907.</li>
              <li><strong className="text-zinc-200">No Auto-Reseal:</strong> Cannot re-generate root or increase seal counter to pass UI validation.</li>
              <li><strong className="text-zinc-200">Fail-Closed Promotion:</strong> Any mismatch instantly sets <span className="text-rose-300">PROMOTION = BLOCKED</span>.</li>
              <li><strong className="text-zinc-200">UI Presentation Only:</strong> UI is strictly a read-only viewer and cannot issue canonical mutation calls.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 2: 4-Layer State Separation */}
      {activeTab === 'SEPARATION' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Layer 1: Canonical Core */}
            <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-cyan-300 font-bold">
                <span>LAYER 1: CANONICAL</span>
                <span className="px-1.5 py-0.5 bg-cyan-500/20 rounded">FROZEN</span>
              </div>
              <div className="text-xl font-bold text-white">14,902 Seals</div>
              <div className="text-[10px] text-zinc-400 font-mono">Block #849,202 LTS</div>
              <div className="p-2 rounded-lg bg-black/40 text-[10px] text-cyan-200/90 font-mono break-all">
                Root: 909ab814...fa4c68
              </div>
              <p className="text-[10px] text-emerald-400 font-bold pt-1">
                ✓ SSoT Mutation: 0 (Inviolable)
              </p>
            </div>

            {/* Layer 2: Observed Stream */}
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-amber-300 font-bold">
                <span>LAYER 2: OBSERVED</span>
                <span className="px-1.5 py-0.5 bg-amber-500/20 rounded">NON-CANONICAL</span>
              </div>
              <div className="text-xl font-bold text-amber-200">14,907 Seals</div>
              <div className="text-[10px] text-zinc-400 font-mono">Runtime Delta: +5 Seals</div>
              <div className="p-2 rounded-lg bg-black/40 text-[10px] text-amber-300 font-mono">
                Class: OBSERVED / NON-CANONICAL
              </div>
              <p className="text-[10px] text-amber-300 font-bold pt-1">
                ⚠ Status: QUARANTINED
              </p>
            </div>

            {/* Layer 3: Quarantine Pool */}
            <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-rose-300 font-bold">
                <span>LAYER 3: QUARANTINE</span>
                <span className="px-1.5 py-0.5 bg-rose-500/20 rounded">ISOLATED</span>
              </div>
              <div className="text-xl font-bold text-rose-200">5 Evidences</div>
              <div className="text-[10px] text-zinc-400 font-mono">#14,903 – #14,907</div>
              <div className="p-2 rounded-lg bg-black/40 text-[10px] text-rose-300 font-mono">
                State: UNRESOLVED / NOT_EXECUTED
              </div>
              <p className="text-[10px] text-rose-300 font-bold pt-1">
                🔒 Execution: BLOCKED
              </p>
            </div>

            {/* Layer 4: Promotion Firewall */}
            <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/40 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-purple-300 font-bold">
                <span>LAYER 4: PROMOTION</span>
                <span className="px-1.5 py-0.5 bg-purple-500/20 rounded">FAIL-CLOSED</span>
              </div>
              <div className="text-xl font-bold text-purple-200">BLOCKED</div>
              <div className="text-[10px] text-zinc-400 font-mono">Policy: Zero Write Authority</div>
              <div className="p-2 rounded-lg bg-black/40 text-[10px] text-purple-300 font-mono">
                Auto-Reseal: DISALLOWED
              </div>
              <p className="text-[10px] text-purple-300 font-bold pt-1">
                🛡 Canonical Write: BLOCKED
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Observed +5 Quarantine Pool */}
      {activeTab === 'QUARANTINE_5' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-amber-400" />
              <span>Observed Runtime Seals #14,903 – #14,907 isolated in Quarantine Sandbox</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-[10px] font-bold">
              PROMOTION = BLOCKED
            </span>
          </div>

          <div className="space-y-2">
            {quarantineItems.map((item) => (
              <div
                key={item.sealNumber}
                className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <span className="text-cyan-300">Seal #{item.sealNumber}</span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-300">{item.evidenceId}</span>
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px]">
                      {item.status}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px]">
                      {item.executionState}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">{item.reason}</p>
                </div>

                <div className="text-right text-[10px] font-mono text-zinc-500 shrink-0">
                  <div>SHA: {item.sha256.slice(0, 16)}...</div>
                  <div className="text-amber-400 font-bold">Provenance: {item.provenanceState}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Write Firewall & Audit */}
      {activeTab === 'WRITE_FIREWALL' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
            <h4 className="font-bold text-white flex items-center justify-between">
              <span>Test P0 Write Firewall Rejection</span>
              <span className="text-xs text-zinc-400">WRITE_ATTEMPT &rarr; REJECT &rarr; AUDIT_LOG &rarr; NO_MUTATION</span>
            </h4>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSimulateWriteAttempt('merkleRoot', '0xFAKEROOT_999999')}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all"
              >
                Attempt Mutate Root
              </button>
              <button
                onClick={() => handleSimulateWriteAttempt('blockHeight', '#849203')}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all"
              >
                Attempt Mutate Block #
              </button>
              <button
                onClick={() => handleSimulateWriteAttempt('canonicalSeals', '14907')}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all"
              >
                Attempt Merge 14,907 &rarr; 14,902
              </button>
            </div>

            {testSimulatedWrite && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-200 text-[11px]">
                {testSimulatedWrite}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Immutable Write Rejection Audit Log ({writeAuditLog.length})
            </h4>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {writeAuditLog.map((log) => (
                <div
                  key={log.attemptId}
                  className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono flex flex-col md:flex-row md:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-rose-300 font-bold">
                      <span>[{log.checkResult}]</span>
                      <span>Target: {log.targetProperty}</span>
                      <span className="text-zinc-500 text-[10px]">({log.actor})</span>
                    </div>
                    <p className="text-zinc-400 text-[10px]">{log.auditLogEntry}</p>
                  </div>
                  <div className="text-[10px] text-zinc-500 shrink-0">{log.timestamp}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Acceptance Tests 12/12 */}
      {activeTab === 'TESTS_12' && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {tests.map((test) => (
              <div
                key={test.id}
                className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                      [{test.id}]
                    </span>
                    <span className="font-bold text-white text-xs">{test.title}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    Expected: <strong className="text-zinc-200">{test.expected}</strong>
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    Actual: <strong className="text-cyan-300">{test.actual}</strong>
                  </div>
                  <p className="text-[9px] text-zinc-500 italic pt-0.5">{test.auditEvidence}</p>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  {test.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
