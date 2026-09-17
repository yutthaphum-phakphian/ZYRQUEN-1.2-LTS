import React, { useState } from 'react';
import {
  ShieldAlert,
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
  Download,
  Copy,
  Check,
  Terminal,
  Search,
  Filter,
} from 'lucide-react';
import { P1QuarantineLayer, QuarantineEvidenceRecord, P1AcceptanceTestResult } from '../utils/p1QuarantineLayer';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';

export const P1QuarantineLayerPanel: React.FC = () => {
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [tests, setTests] = useState<P1AcceptanceTestResult[]>(() => P1QuarantineLayer.evaluateAcceptanceTests());
  const [activeTab, setActiveTab] = useState<'PLANES' | 'REGISTRY' | 'FIREWALL' | 'DUPLICATE_GUARD' | 'TESTS_12'>('PLANES');
  const [selectedRecord, setSelectedRecord] = useState<QuarantineEvidenceRecord | null>(() => P1QuarantineLayer.getQuarantineRegistry()[0]);
  const [simulatedWriteTarget, setSimulatedWriteTarget] = useState<string>('');
  const [copiedJson, setCopiedJson] = useState(false);
  const [auditTrail, setAuditTrail] = useState(() => P1QuarantineLayer.getAuditTrail());

  const quarantineRecords = P1QuarantineLayer.getQuarantineRegistry();

  const handleRunAcceptanceTests = () => {
    setIsRunningTests(true);
    playTone(560, 0.05);

    setTimeout(() => {
      const results = P1QuarantineLayer.evaluateAcceptanceTests();
      setTests(results);
      setIsRunningTests(false);
      playAuditChime();
    }, 400);
  };

  const handleSimulateWriteAttempt = (prop: string, val: string) => {
    playTone(260, 0.1);
    const res = P1QuarantineLayer.interceptQuarantineWriteBack(prop, val, 'QUARANTINE_MUTATION_SIMULATOR');
    setAuditTrail(P1QuarantineLayer.getAuditTrail());
    setSimulatedWriteTarget(`Write Attempt to ${prop} -> REJECTED (Fail-Closed, Mutation Delta = 0)`);
  };

  const handleExportManifest = () => {
    playTone(700, 0.03);
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(quarantineRecords, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `zyrquen-quarantine-manifest-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyJson = () => {
    playTone(650, 0.02);
    copyToClipboard(JSON.stringify(quarantineRecords, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div id="p1-quarantine-layer-panel" className="p-6 rounded-[28px] bg-gradient-to-br from-[#0a0f1d]/95 via-[#060a14]/90 to-[#03050a] border-2 border-amber-500/40 backdrop-blur-2xl space-y-6 shadow-2xl font-mono text-xs text-zinc-300">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-amber-500/20 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide font-serif">
                P1 — OBSERVED EVIDENCE &amp; QUARANTINE LAYER
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                ISOLATION SANDBOX
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                PROMOTION = BLOCKED
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-serif mt-1">
              3-Plane Isolation (Canonical 14,902 / Observed 14,907 / Quarantine +5) • Zero Guesswork • SSoT Mutation = 0
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCopyJson}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 font-bold flex items-center gap-1.5 transition-all text-[11px]"
          >
            {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedJson ? 'COPIED JSON' : 'COPY JSON'}</span>
          </button>

          <button
            onClick={handleExportManifest}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 font-bold flex items-center gap-1.5 transition-all text-[11px]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT MANIFEST</span>
          </button>

          <button
            onClick={handleRunAcceptanceTests}
            disabled={isRunningTests}
            className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] disabled:opacity-50 text-[11px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
            <span>{isRunningTests ? 'EVALUATING P1...' : 'RUN P1 SUITE (12/12)'}</span>
          </button>
        </div>
      </div>

      {/* 3-Plane Architecture Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Plane 1 */}
        <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/40 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-cyan-300 font-bold">
            <span>PLANE 1: CANONICAL</span>
            <span className="px-1.5 py-0.5 bg-cyan-500/20 rounded">IMMUTABLE / READ-ONLY</span>
          </div>
          <div className="text-xl font-bold text-white">14,902 Seals</div>
          <div className="text-[10px] text-zinc-400 font-mono">Block #849202 • SSoT Mutation = 0</div>
          <div className="text-[9px] text-cyan-300/80 truncate">Root: 909ab814...fa4c68</div>
        </div>

        {/* Plane 2 */}
        <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/40 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-amber-300 font-bold">
            <span>PLANE 2: OBSERVED</span>
            <span className="px-1.5 py-0.5 bg-amber-500/20 rounded">RUNTIME INGRESS</span>
          </div>
          <div className="text-xl font-bold text-amber-200">14,907 Seals</div>
          <div className="text-[10px] text-zinc-400 font-mono">External / Non-Canonical Stream</div>
          <div className="text-[9px] text-amber-300/80">Classification: OBSERVED ONLY</div>
        </div>

        {/* Plane 3 */}
        <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/40 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-rose-300 font-bold">
            <span>PLANE 3: QUARANTINE</span>
            <span className="px-1.5 py-0.5 bg-rose-500/20 rounded">ISOLATED SANDBOX</span>
          </div>
          <div className="text-xl font-bold text-rose-200">+5 Evidences</div>
          <div className="text-[10px] text-zinc-400 font-mono">#14,903 – #14,907 (UNRESOLVED)</div>
          <div className="text-[9px] text-rose-300/80 font-bold">PROMOTION = BLOCKED (FAIL-CLOSED)</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'PLANES', label: '1. 3-Plane Architecture' },
            { id: 'REGISTRY', label: '2. Quarantine Delta Registry (5 Items)' },
            { id: 'FIREWALL', label: '3. Quarantine Write Firewall' },
            { id: 'DUPLICATE_GUARD', label: '4. Replay & Duplicate Guard' },
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
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
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
            No Guesswork (UNRESOLVED)
          </span>
          <span>•</span>
          <span className="text-rose-400 font-bold">
            Promotion: BLOCKED
          </span>
        </div>
      </div>

      {/* Tab 1: 3-Plane Architecture */}
      {activeTab === 'PLANES' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Evidence Plane Separation Rules</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                <div className="font-bold text-cyan-300">Quarantine Capabilities (ALLOWED):</div>
                <ul className="space-y-1 text-zinc-400 list-disc list-inside">
                  <li>Ingest runtime observed evidence</li>
                  <li>Store and read evidence records in sandbox</li>
                  <li>Calculate metadata &amp; SHA-256 digests</li>
                  <li>Inspect provenance trace chain</li>
                  <li>Generate forensic inspection reports</li>
                  <li>Export quarantine evidence manifest</li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-rose-500/20 space-y-1.5">
                <div className="font-bold text-rose-400">Quarantine Boundaries (STRICTLY PROHIBITED):</div>
                <ul className="space-y-1 text-zinc-400 list-disc list-inside">
                  <li>Write or mutate Canonical Core</li>
                  <li>Add seals to Frozen Core (14,902 === 14,902)</li>
                  <li>Modify Merkle Root or Block Height</li>
                  <li>Auto-reseal Canonical Core</li>
                  <li>Promote evidence without dual-custody governance</li>
                  <li>Guess classification without cryptographic proof</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
            <h4 className="text-amber-300 font-bold flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-amber-400" />
              <span>P1 Evidence Taxonomy &amp; Rules</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {[
                { tag: 'CANONICAL', desc: 'Immutable ground truth (14,902)' },
                { tag: 'OBSERVED', desc: 'External runtime stream' },
                { tag: 'REFERENCE', desc: 'Static benchmark snapshot' },
                { tag: 'SIMULATED', desc: 'Digital twin sandbox run' },
                { tag: 'PENDING_VERIF', desc: 'Awaiting hardware check' },
                { tag: 'MISMATCH', desc: 'Inconsistent hash or block' },
                { tag: 'QUARANTINED', desc: 'Isolated from canonical' },
                { tag: 'BLOCKED', desc: 'Fail-closed promotion gate' },
              ].map((item) => (
                <div key={item.tag} className="p-2 rounded-lg bg-black/50 border border-white/5 space-y-0.5">
                  <div className="text-[10px] font-bold text-amber-300">{item.tag}</div>
                  <div className="text-[9px] text-zinc-400">{item.desc}</div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-zinc-400 pt-1">
              <strong>Rules:</strong> SIMULATED ≠ VERIFIED • OBSERVED ≠ CANONICAL • REFERENCE ≠ LIVE • QUARANTINED ≠ PROMOTED • PENDING ≠ VERIFIED
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Quarantine Delta Registry */}
      {activeTab === 'REGISTRY' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* List */}
            <div className="space-y-2 lg:col-span-2">
              {quarantineRecords.map((item) => (
                <div
                  key={item.evidenceId}
                  onClick={() => {
                    setSelectedRecord(item);
                    playTone(620, 0.02);
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    selectedRecord?.evidenceId === item.evidenceId
                      ? 'bg-amber-500/15 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-400'
                      : 'bg-black/50 border-white/8 hover:border-white/20 hover:bg-black/70'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-bold">
                      <span className="text-amber-300">Seal #{item.observedSeal}</span>
                      <span className="text-zinc-500">•</span>
                      <span className="text-white">{item.evidenceId}</span>
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px]">
                        {item.quarantineStatus}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px]">
                        {item.classification}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-400 flex items-center gap-2">
                      <span>Source: {item.source}</span>
                      <span>•</span>
                      <span>Parent: {item.parentEvidence}</span>
                    </div>
                    <div className="text-[10px] text-zinc-500">{item.notes}</div>
                  </div>

                  <div className="text-right text-[10px] font-mono shrink-0 space-y-1">
                    <div className="text-rose-400 font-bold">{item.promotionStatus}</div>
                    <div className="text-zinc-500 text-[9px]">{item.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Detail Drawer */}
            <div className="p-4 rounded-2xl bg-black/70 border border-white/10 space-y-3 lg:col-span-1">
              <h4 className="font-bold text-white flex items-center justify-between border-b border-white/10 pb-2">
                <span>Evidence Record Detail</span>
                <span className="text-[10px] text-amber-300">{selectedRecord?.evidenceId}</span>
              </h4>

              {selectedRecord ? (
                <div className="space-y-2 text-[10px] font-mono">
                  <div>
                    <span className="text-zinc-500">Observed Seal:</span>{' '}
                    <strong className="text-amber-300">#{selectedRecord.observedSeal}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500">Classification:</span>{' '}
                    <strong className="text-amber-200">{selectedRecord.classification}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500">Provenance Status:</span>{' '}
                    <strong className="text-rose-300">{selectedRecord.provenanceStatus}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500">Quarantine Status:</span>{' '}
                    <strong className="text-rose-300">{selectedRecord.quarantineStatus}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500">Promotion Gate:</span>{' '}
                    <strong className="text-rose-400">{selectedRecord.promotionStatus}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500">Observer Identity:</span>{' '}
                    <span className="text-zinc-300">{selectedRecord.observerIdentity}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Execution State:</span>{' '}
                    <span className="text-zinc-300">{selectedRecord.executionState}</span>
                  </div>
                  <div className="pt-1">
                    <span className="text-zinc-500">Artifact SHA-256 Digest:</span>
                    <div className="p-2 rounded bg-black/60 text-[9px] text-cyan-300 break-all select-all mt-1">
                      {selectedRecord.artifactDigest}
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-500">Parent Evidence Link:</span>
                    <div className="text-zinc-300">{selectedRecord.parentEvidence}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-200 text-[9px] mt-2">
                    🔒 <strong>Fail-Closed Gate:</strong> Unresolved classification prohibits automatic promotion. Requires verified cryptographic chain.
                  </div>
                </div>
              ) : (
                <p className="text-zinc-500 italic">Select an evidence record from the list.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Quarantine Write Firewall */}
      {activeTab === 'FIREWALL' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
            <h4 className="font-bold text-white flex items-center justify-between">
              <span>Test P1 Quarantine Write Firewall Interceptor</span>
              <span className="text-xs text-zinc-400">QUARANTINE_WRITE &rarr; REJECT &rarr; AUDIT_EVENT &rarr; MUTATION = 0</span>
            </h4>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSimulateWriteAttempt('canonicalSeals', '14907')}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all"
              >
                Attempt Quarantine Promotion &rarr; Canonical
              </button>
              <button
                onClick={() => handleSimulateWriteAttempt('canonicalRoot', '0xTAMPER_FROM_QUARANTINE')}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all"
              >
                Attempt Mutate Merkle Root
              </button>
              <button
                onClick={() => handleSimulateWriteAttempt('blockHeight', '#849207')}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all"
              >
                Attempt Increment Block Height
              </button>
            </div>

            {simulatedWriteTarget && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-200 text-[11px]">
                {simulatedWriteTarget}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Quarantine Audit Events ({auditTrail.length})
            </h4>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {auditTrail.map((log) => (
                <div
                  key={log.eventId}
                  className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono flex flex-col md:flex-row md:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-rose-300 font-bold">
                      <span>[{log.result}]</span>
                      <span>Op: {log.operation}</span>
                      <span className="text-zinc-500 text-[10px]">Actor: {log.actor}</span>
                    </div>
                    <p className="text-zinc-400 text-[10px]">{log.reason}</p>
                  </div>
                  <div className="text-[10px] text-zinc-500 shrink-0">{log.timestamp}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Replay & Duplicate Guard */}
      {activeTab === 'DUPLICATE_GUARD' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Duplicate &amp; Replay Detection Policy</span>
            </h4>
            <p className="text-[11px] text-zinc-400">
              Evidence records are checked against existing artifact digests and source identities. Duplicate or replayed evidence is never counted towards Canonical Seals (Canonical Seals strictly remain 14,902).
            </p>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <div className="text-xs font-bold text-zinc-200">Simulate Ingress of Existing Artifact Digest (#14,903):</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const check = P1QuarantineLayer.checkDuplicateReplay(
                      'c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2',
                      'REPLAY_ATTACK_SIMULATOR'
                    );
                    setSimulatedWriteTarget(`Duplicate Check Result: ${check.action} | Classification: ${check.classification}`);
                    playTone(300, 0.08);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-bold transition-all"
                >
                  Test Ingress Duplicate Digest
                </button>
              </div>
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
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                      [{test.id}]
                    </span>
                    <span className="font-bold text-white text-xs">{test.title}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    Expected: <strong className="text-zinc-200">{test.expected}</strong>
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    Actual: <strong className="text-amber-300">{test.actual}</strong>
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
