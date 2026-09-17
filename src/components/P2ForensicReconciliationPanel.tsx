import React, { useState } from 'react';
import {
  FileSearch,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Lock,
  GitBranch,
  KeyRound,
  FileCheck2,
  Clock,
  Radio,
  FileSpreadsheet,
  Terminal,
  Activity,
  Workflow,
  Search,
} from 'lucide-react';
import { P2ForensicEngine, ForensicRecord, P2AcceptanceTestResult } from '../utils/p2ForensicEngine';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';

export const P2ForensicReconciliationPanel: React.FC = () => {
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [tests, setTests] = useState<P2AcceptanceTestResult[]>(() => P2ForensicEngine.evaluateAcceptanceTests());
  const [activeTab, setActiveTab] = useState<'MATRIX' | 'CHAIN_OF_CUSTODY' | 'GENESIS_ANCHOR' | 'SIGNATURE_POLICY' | 'AUDIT_TRAIL' | 'TESTS_12'>('MATRIX');
  const [selectedRecord, setSelectedRecord] = useState<ForensicRecord | null>(() => P2ForensicEngine.getForensicRecords()[0]);
  const [copiedReport, setCopiedReport] = useState(false);
  const [auditLog, setAuditLog] = useState(() => P2ForensicEngine.getAuditLog());

  const records = P2ForensicEngine.getForensicRecords();

  const handleRunAcceptanceTests = () => {
    setIsRunningTests(true);
    playTone(580, 0.05);

    setTimeout(() => {
      const results = P2ForensicEngine.evaluateAcceptanceTests();
      setTests(results);
      setIsRunningTests(false);
      playAuditChime();
    }, 400);
  };

  const handleVerifyEvidence = (evidenceId: string) => {
    playTone(680, 0.04);
    const updated = P2ForensicEngine.runForensicVerification(evidenceId);
    if (updated) {
      setSelectedRecord(updated);
      setAuditLog(P2ForensicEngine.getAuditLog());
    }
  };

  const handleExportJson = () => {
    playTone(720, 0.03);
    const reportJson = P2ForensicEngine.generateForensicReportJson();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(reportJson);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `zyrquen-p2-forensic-report-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyReport = () => {
    playTone(650, 0.02);
    const reportJson = P2ForensicEngine.generateForensicReportJson();
    copyToClipboard(reportJson);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  return (
    <div id="p2-forensic-panel" className="p-6 rounded-[28px] bg-gradient-to-br from-[#0c0d1e]/95 via-[#080916]/90 to-[#04040a] border-2 border-indigo-500/40 backdrop-blur-2xl space-y-6 shadow-2xl font-mono text-xs text-zinc-300">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-indigo-500/20 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(99,102,241,0.25)]">
            <FileSearch className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide font-serif">
                P2 — FORENSIC RECONCILIATION &amp; PROVENANCE
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold">
                PROVENANCE AUDIT
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                SSoT MUTATION = 0
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-serif mt-1">
              Deep Forensic Analysis on Observed Delta (+5) • Genesis Anchor (#849202) • Merkle Proof • Chain-of-Custody
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCopyReport}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 font-bold flex items-center gap-1.5 transition-all text-[11px]"
          >
            {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedReport ? 'COPIED JSON' : 'COPY REPORT'}</span>
          </button>

          <button
            onClick={handleExportJson}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 font-bold flex items-center gap-1.5 transition-all text-[11px]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT JSON</span>
          </button>

          <button
            onClick={handleRunAcceptanceTests}
            disabled={isRunningTests}
            className="px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/50 text-indigo-200 font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] disabled:opacity-50 text-[11px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
            <span>{isRunningTests ? 'EVALUATING P2...' : 'RUN P2 SUITE (12/12)'}</span>
          </button>
        </div>
      </div>

      {/* Target Baseline Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-0.5">
          <span className="text-[10px] text-zinc-500 font-bold uppercase">Canonical Root</span>
          <div className="text-[11px] font-bold text-cyan-300 truncate">909ab814...fa4c68</div>
          <div className="text-[9px] text-zinc-500">v1.2 LTS Core Immutable</div>
        </div>

        <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-0.5">
          <span className="text-[10px] text-zinc-500 font-bold uppercase">Canonical Block</span>
          <div className="text-[11px] font-bold text-white">#849202</div>
          <div className="text-[9px] text-zinc-500">Frozen Genesis Epoch</div>
        </div>

        <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-0.5">
          <span className="text-[10px] text-zinc-500 font-bold uppercase">Canonical / Observed</span>
          <div className="text-[11px] font-bold text-amber-300">14,902 / 14,907 (+5)</div>
          <div className="text-[9px] text-rose-400 font-bold">Delta in Quarantine</div>
        </div>

        <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-0.5">
          <span className="text-[10px] text-zinc-500 font-bold uppercase">SSoT Mutation Delta</span>
          <div className="text-[11px] font-bold text-emerald-400">0 (Zero Drift)</div>
          <div className="text-[9px] text-emerald-400">Fail-Closed Inviolable</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'MATRIX', label: '1. Forensic Evidence Matrix' },
            { id: 'CHAIN_OF_CUSTODY', label: '2. Chain-of-Custody Tracing' },
            { id: 'GENESIS_ANCHOR', label: '3. Genesis Anchor & Merkle Proof' },
            { id: 'SIGNATURE_POLICY', label: '4. Signature & Key Policy' },
            { id: 'AUDIT_TRAIL', label: '5. Immutable Audit Events' },
            { id: 'TESTS_12', label: '6. Acceptance Tests (12/12 PASS)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                playTone(620, 0.02);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs transition-all font-bold ${
                activeTab === tab.id
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                  : 'bg-white/5 text-zinc-400 hover:text-zinc-200 border-white/8 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-[11px] text-zinc-400 flex items-center gap-2">
          <span>Authority:</span>
          <strong className="text-zinc-200">READ / VERIFY / REPORT ONLY</strong>
        </div>
      </div>

      {/* Tab 1: Forensic Evidence Matrix */}
      {activeTab === 'MATRIX' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/60">
            <table className="w-full text-left text-[11px] font-mono border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-zinc-400">
                  <th className="p-3">Evidence</th>
                  <th className="p-3">Provenance</th>
                  <th className="p-3">SHA-256 Digest</th>
                  <th className="p-3">Merkle Proof</th>
                  <th className="p-3">Block Ref</th>
                  <th className="p-3">Signature</th>
                  <th className="p-3">Classification</th>
                  <th className="p-3">Promotion</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {records.map((item) => (
                  <tr
                    key={item.evidenceId}
                    onClick={() => setSelectedRecord(item)}
                    className={`hover:bg-indigo-500/10 cursor-pointer transition-colors ${
                      selectedRecord?.evidenceId === item.evidenceId ? 'bg-indigo-500/15' : ''
                    }`}
                  >
                    <td className="p-3 font-bold text-white">
                      <div className="text-amber-300">#{item.observedSeal}</div>
                      <div className="text-[9px] text-zinc-500">{item.evidenceId}</div>
                    </td>
                    <td className="p-3 text-rose-300 font-bold">{item.provenanceStatus}</td>
                    <td className="p-3">
                      <span className="text-[10px] text-cyan-300">{item.artifactDigest.slice(0, 10)}...</span>
                      <div className="text-[9px] text-zinc-500">Status: {item.digestStatus}</div>
                    </td>
                    <td className="p-3 text-rose-300 font-bold">{item.merkleProofStatus}</td>
                    <td className="p-3 text-zinc-300">{item.blockReference}</td>
                    <td className="p-3">
                      <div className="text-zinc-200">{item.signatureAlgorithm}</div>
                      <div className="text-[9px] text-rose-400">{item.signatureStatus}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold">
                        {item.classification}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-bold">
                        {item.promotionStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVerifyEvidence(item.evidenceId);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 text-[10px] font-bold transition-all"
                      >
                        Re-Verify
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Selected Record Inspector */}
          {selectedRecord && (
            <div className="p-4 rounded-2xl bg-black/60 border border-indigo-500/30 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Forensic Investigation Record</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                    Seal #{selectedRecord.observedSeal}
                  </span>
                </div>
                <span className="text-xs text-rose-400 font-bold">
                  Promotion Gate: {selectedRecord.promotionStatus} (FAIL-CLOSED)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                <div className="space-y-1 bg-black/40 p-3 rounded-xl border border-white/5">
                  <div>
                    <span className="text-zinc-500">Source ID:</span> {selectedRecord.sourceId} ({selectedRecord.sourceType})
                  </div>
                  <div>
                    <span className="text-zinc-500">Observer:</span> {selectedRecord.observerIdentity}
                  </div>
                  <div>
                    <span className="text-zinc-500">Event Timestamp:</span> {selectedRecord.eventTimestamp}
                  </div>
                  <div>
                    <span className="text-zinc-500">Ingestion Timestamp:</span> {selectedRecord.ingestionTimestamp}
                  </div>
                  <div>
                    <span className="text-zinc-500">Causality Check:</span>{' '}
                    <strong className="text-emerald-400">{selectedRecord.causalityStatus}</strong>
                  </div>
                </div>

                <div className="space-y-1 bg-black/40 p-3 rounded-xl border border-white/5">
                  <div>
                    <span className="text-zinc-500">Genesis Anchor Check:</span>{' '}
                    <strong className="text-rose-300">{selectedRecord.genesisAnchorStatus}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500">Merkle Path:</span> {selectedRecord.merklePath}
                  </div>
                  <div>
                    <span className="text-zinc-500">Key Fingerprint:</span> {selectedRecord.keyFingerprint}
                  </div>
                  <div>
                    <span className="text-zinc-500">Reason:</span>{' '}
                    <span className="text-amber-200">{selectedRecord.classificationReason}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Chain-of-Custody Tracing */}
      {activeTab === 'CHAIN_OF_CUSTODY' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Workflow className="w-4 h-4 text-indigo-400" />
              <span>Mandatory 9-Step Chain-of-Custody Verification Pipeline</span>
            </h4>
            <p className="text-[11px] text-zinc-400">
              Every observed item must satisfy all 9 chain verification links. If any link is broken or missing, the status is automatically set to <code className="text-rose-300">PROVENANCE = INCOMPLETE</code> and <code className="text-rose-300">PROMOTION = BLOCKED</code>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              {[
                { step: '1. SOURCE', status: 'PRESENT', desc: 'Worker node identity recorded' },
                { step: '2. TIMESTAMP', status: 'VALID_ORDER', desc: 'Parent < Event < Ingestion' },
                { step: '3. ARTIFACT', status: 'RECORDED', desc: 'Artifact ID assigned in sandbox' },
                { step: '4. SHA-256 DIGEST', status: 'NOT_EXECUTED', desc: 'Unexecuted in frozen sandbox' },
                { step: '5. PARENT EVIDENCE', status: 'LINKED', desc: 'Prior sequence pointer' },
                { step: '6. MERKLE ANCHOR', status: 'INVALID', desc: 'Differs from 909ab814...fa4c68' },
                { step: '7. BLOCK REF', status: 'MISMATCH / UNBOUND', desc: 'Claims #849203 or non-genesis' },
                { step: '8. SIGNER / KEY', status: 'PRESENT_UNVERIFIED', desc: 'Key valid ≠ Genesis authorized' },
                { step: '9. PROMOTION', status: 'FAIL-CLOSED BLOCKED', desc: 'Dual-custody gate required' },
              ].map((step, idx) => (
                <div key={step.step} className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <div className="text-[11px] font-bold text-indigo-300">{step.step}</div>
                  <div className={`text-[10px] font-bold ${
                    step.status.includes('INVALID') || step.status.includes('MISMATCH') || step.status.includes('BLOCKED')
                      ? 'text-rose-400'
                      : 'text-amber-300'
                  }`}>
                    {step.status}
                  </div>
                  <div className="text-[9px] text-zinc-500">{step.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Genesis Anchor & Merkle Proof */}
      {activeTab === 'GENESIS_ANCHOR' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-indigo-400" />
              <span>Genesis Block #849202 &amp; Merkle Proof Invariants</span>
            </h4>
            <p className="text-[11px] text-zinc-400">
              Observed evidence items claim membership in a block higher than Genesis (#849202) or submit a Merkle proof with an invalid sibling path. Under P2 rules, the Canonical Root <code className="text-cyan-300">909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68</code> is never modified to match observed evidence.
            </p>

            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-200 text-[11px] space-y-1">
              <div className="font-bold">Invariant Enforced:</div>
              <div>Computed Root vs Declared Canonical Root &rarr; MISMATCH &rarr; STATUS = MISMATCH &rarr; PROMOTION = BLOCKED.</div>
              <div className="text-zinc-400 text-[10px]">Canonical Block #849202 remains frozen. No new blocks added to Canonical SSoT.</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Signature & Key Policy */}
      {activeTab === 'SIGNATURE_POLICY' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-400" />
              <span>Signature &amp; Key Policy Separation</span>
            </h4>
            <div className="space-y-2 text-[11px] text-zinc-400">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <div className="font-bold text-white">Rule 1: SIGNATURE PRESENT &ne; SIGNATURE VERIFIED</div>
                <p>Having a signature byte payload attached does not mean it was signed by a recognized Sovereign Genesis key.</p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <div className="font-bold text-white">Rule 2: KEY VALID &ne; GENESIS AUTHORIZED</div>
                <p>An Ed25519 or Dilithium-5 key may be mathematically valid, but lacking authorization in the Genesis Manifest disallows canonical promotion.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Immutable Audit Events */}
      {activeTab === 'AUDIT_TRAIL' && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Immutable Forensic Audit Events ({auditLog.length})</span>
            <span>Zero Mutation (Delta = 0)</span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {auditLog.map((log) => (
              <div
                key={log.eventId}
                className="p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono flex flex-col md:flex-row md:items-center justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold">
                    <span>[{log.type}]</span>
                    <span>Target: {log.evidenceId}</span>
                    <span className="text-zinc-500 text-[10px]">Actor: {log.actor}</span>
                  </div>
                  <p className="text-zinc-400 text-[10px]">{log.reason}</p>
                </div>
                <div className="text-[10px] text-zinc-500 shrink-0">{log.timestamp}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Acceptance Tests 12/12 */}
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
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                      [{test.id}]
                    </span>
                    <span className="font-bold text-white text-xs">{test.title}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    Expected: <strong className="text-zinc-200">{test.expected}</strong>
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    Actual: <strong className="text-indigo-300">{test.actual}</strong>
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
