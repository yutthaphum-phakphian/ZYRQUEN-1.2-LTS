import React, { useState, useMemo } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Download,
  Terminal,
  Server,
  Layers,
  Activity,
  ArrowRight,
  Lock,
  Unlock,
  Key,
  Database,
  Cpu,
  Play,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
  FileCode,
  FileText,
  Plus,
  X,
  ExternalLink,
  ChevronRight,
  Radio,
  Clock,
  Hash,
  Share2
} from 'lucide-react';
import {
  AgentState,
  AGENT_STATE_METADATA,
  IdentityStateEngine,
  CryptographicEvidenceLedger,
  EvidenceBlock,
  ManagedLifecycleAgent,
  INITIAL_LIFECYCLE_AGENTS,
  PYTHON_REFERENCE_CODE,
  HELM_VALUES_YAML,
  K8S_NAMESPACE_YAML,
  HELM_CHART_YAML,
  DEPLOYMENT_API_ROUTER_YAML,
  DEPLOYMENT_OPA_GATE_YAML,
  CONFIGMAP_CONTROL_PLANE_YAML,
  SERVICE_ACCOUNT_YAML,
  SENATE_RULES_REGO,
  ZYRQUEN_CONFIG_JSON,
  evaluateSenateRegoPolicy,
} from '../../utils/agentLifecycleEngine';
import { playTone, playAuditChime, playWarningTone } from '../AudioSynthesizer';
import { copyToClipboard } from '../../utils/clipboard';

export const AgentLifecycleEnginePanel: React.FC = () => {
  // Navigation sub-tabs
  const [subTab, setSubTab] = useState<'lifecycle' | 'evidence_ledger' | 'helm_control_plane' | 'python_spec'>('lifecycle');

  // Agent State Engine
  const [agents, setAgents] = useState<ManagedLifecycleAgent[]>(INITIAL_LIFECYCLE_AGENTS);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(INITIAL_LIFECYCLE_AGENTS[0].id);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stateFilter, setStateFilter] = useState<string>('ALL');

  // Ledger State Engine
  const [ledger] = useState<CryptographicEvidenceLedger>(() => {
    const l = new CryptographicEvidenceLedger('0'.repeat(64));
    return l;
  });

  // Initial seed of blocks matching Python execution proof
  const [evidenceBlocks, setEvidenceBlocks] = useState<EvidenceBlock[]>(() => {
    const tempLedger = new CryptographicEvidenceLedger('0'.repeat(64));
    const block1 = tempLedger.create_block(
      881293,
      'MSN-20260913-001',
      'did:zyrquen:shard-bkk:ag-sre-007',
      'v1.2.0-LTS-STRICT',
      { intent: 'DB Optimization', action: 'INDEX_CREATE', status: 'SUCCESS' },
      '2026-09-13T09:12:00Z'
    );
    const block2 = tempLedger.create_block(
      881294,
      'MSN-20260913-002',
      'did:zyrquen:shard-bkk:archon-solon',
      'v1.2.0-LTS-STRICT',
      { intent: 'ETDA Sec 26 Electronic Signature Attestation', action: 'SIGNATURE_VERIFY', status: 'SUCCESS' },
      '2026-09-13T09:15:30Z'
    );
    const block3 = tempLedger.create_block(
      881295,
      'MSN-20260913-003',
      'did:zyrquen:shard-bkk:cryo-telemetry-04',
      'v1.2.0-LTS-STRICT',
      { intent: 'Cryogenic Thermal Drift Monitor', action: 'SENSOR_POLL_14_98mK', status: 'STABILIZED' },
      '2026-09-13T09:18:00Z'
    );
    return [block3, block2, block1]; // Descending height order for display
  });

  // UI feedback states
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    timestamp: string;
    details: string;
    blockCount: number;
  } | null>(null);

  // Spawn Agent Modal
  const [isSpawnModalOpen, setIsSpawnModalOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentRole, setNewAgentRole] = useState('');
  const [newAgentDid, setNewAgentDid] = useState('');

  // Mint Block Modal
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [mintMissionId, setMintMissionId] = useState('MSN-20260913-005');
  const [mintAgentDid, setMintAgentDid] = useState('did:zyrquen:shard-bkk:ag-sre-007');
  const [mintPayloadJson, setMintPayloadJson] = useState(
    JSON.stringify({ intent: 'Autonomous Warp Rebalancing', action: 'LAT_OPTIMIZE', targetThroughput: '24960 qOps/s' }, null, 2)
  );

  // Copied state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Helm & Kubernetes Manifests State
  const [activeManifestView, setActiveManifestView] = useState<
    'all' | 'api-router' | 'opa-gate' | 'configmap' | 'serviceaccount' | 'values' | 'namespace' | 'chart' | 'rego'
  >('all');

  // Interactive Rego Policy Engine Simulator
  const [regoRiskLevel, setRegoRiskLevel] = useState<'LOW' | 'HIGH'>('HIGH');
  const [regoIdentityVerified, setRegoIdentityVerified] = useState<boolean>(true);
  const [regoSenateApprovals, setRegoSenateApprovals] = useState<number>(3);
  const [regoSigValid, setRegoSigValid] = useState<boolean>(true);

  const regoEvaluation = useMemo(() => {
    return evaluateSenateRegoPolicy({
      action_risk_level: regoRiskLevel,
      identity_verified: regoIdentityVerified,
      senate_approval_count: regoSenateApprovals,
      cryptographic_sig_valid: regoSigValid,
    });
  }, [regoRiskLevel, regoIdentityVerified, regoSenateApprovals, regoSigValid]);

  const handleCopy = (text: string, key: string) => {
    copyToClipboard(text);
    setCopiedKey(key);
    playTone(700, 0.03);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const selectedAgent = useMemo(() => {
    return agents.find((a) => a.id === selectedAgentId) || agents[0];
  }, [agents, selectedAgentId]);

  const filteredAgents = useMemo(() => {
    return agents.filter((a) => {
      if (stateFilter !== 'ALL' && a.state !== stateFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = a.name.toLowerCase().includes(q);
        const matchesDid = a.did.toLowerCase().includes(q);
        const matchesRole = a.role.toLowerCase().includes(q);
        if (!matchesName && !matchesDid && !matchesRole) return false;
      }
      return true;
    });
  }, [agents, stateFilter, searchQuery]);

  // Execute State Transition
  const handleTransition = (agentId: string, targetState: AgentState, reason?: string) => {
    setActionError(null);
    setActionSuccess(null);

    const targetAgent = agents.find((a) => a.id === agentId);
    if (!targetAgent) return;

    try {
      // Enforce strict 8-state model
      const nextState = IdentityStateEngine.transition(targetAgent.state, targetState);

      // Create new cryptographic evidence block for this transition
      const newHeight = (evidenceBlocks[0]?.block_height || 881295) + 1;
      const transitionBlock = ledger.create_block(
        newHeight,
        targetAgent.missionId || `MSN-${Date.now().toString().slice(-6)}`,
        targetAgent.did,
        targetAgent.policyVersion || 'v1.2.0-LTS-STRICT',
        {
          event: 'LIFECYCLE_STATE_TRANSITION',
          from_state: targetAgent.state,
          to_state: nextState,
          reason: reason || `Authorized transition from ${targetAgent.state} to ${nextState}`,
          identity_attestation: 'PQC_DILITHIUM_ROOT_VERIFIED',
        }
      );

      // Update agent record
      const updatedAgents = agents.map((a) => {
        if (a.id === agentId) {
          return {
            ...a,
            state: nextState,
            lastTransitionUtc: new Date().toISOString(),
            history: [
              {
                from: a.state,
                to: nextState,
                timestamp: new Date().toISOString(),
                reason: reason || `Transitioned to ${nextState}`,
                blockHash: transitionBlock.current_block_hash,
              },
              ...a.history,
            ],
          };
        }
        return a;
      });

      setAgents(updatedAgents);
      setEvidenceBlocks((prev) => [transitionBlock, ...prev]);
      playAuditChime();
      setActionSuccess(
        `Transition Successful: ${targetAgent.name} is now ${nextState} (Sealed in Block #${newHeight})`
      );
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      playWarningTone();
      setActionError(err.message || 'State transition rejected by IdentityStateEngine');
      setTimeout(() => setActionError(null), 6000);
    }
  };

  // Deliberate test of illegal transition to demonstrate invariant enforcement
  const handleTestIllegalTransition = (agentId: string, illegalState: AgentState) => {
    setActionError(null);
    setActionSuccess(null);
    const targetAgent = agents.find((a) => a.id === agentId);
    if (!targetAgent) return;

    try {
      IdentityStateEngine.transition(targetAgent.state, illegalState);
      setActionSuccess('Unexpected transition permitted (FAIL)');
    } catch (err: any) {
      playWarningTone();
      setActionError(
        `[INVARIANT ENFORCED] ${err.message} — Policy Gate halted illegal lifecycle mutation.`
      );
    }
  };

  // Verify Entire Evidence Hash Chain
  const handleVerifyChain = () => {
    // Reverse for ascending verification from root to tip
    const ascendingBlocks = [...evidenceBlocks].reverse();
    const result = CryptographicEvidenceLedger.verifyChain(ascendingBlocks);

    if (result.isValid) {
      playAuditChime();
      setVerificationResult({
        verified: true,
        timestamp: new Date().toISOString(),
        details: `All ${evidenceBlocks.length} cryptographic blocks cryptographically verified with zero hash discontinuities. Genesis root invariant intact.`,
        blockCount: evidenceBlocks.length,
      });
    } else {
      playWarningTone();
      setVerificationResult({
        verified: false,
        timestamp: new Date().toISOString(),
        details: result.error || 'Cryptographic chain discontinuity detected!',
        blockCount: evidenceBlocks.length,
      });
    }
  };

  // Spawn New Agent Form Submit
  const handleSpawnAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim()) return;

    const id = `agent-${Date.now().toString().slice(-4)}`;
    const did = newAgentDid.trim() || `did:zyrquen:shard-bkk:${id}`;
    const newAgent: ManagedLifecycleAgent = {
      id,
      did,
      name: newAgentName.trim(),
      role: newAgentRole.trim() || 'Autonomous Sovereign Worker',
      state: AgentState.GENESIS,
      missionId: `MSN-${Date.now().toString().slice(-6)}`,
      policyVersion: 'v1.2.0-LTS-STRICT',
      lastTransitionUtc: new Date().toISOString(),
      history: [
        {
          from: AgentState.GENESIS,
          to: AgentState.GENESIS,
          timestamp: new Date().toISOString(),
          reason: 'Initial Genesis keypair minting and entropy attestation',
          blockHash: '0x' + '0'.repeat(64),
        },
      ],
    };

    setAgents((prev) => [newAgent, ...prev]);
    setSelectedAgentId(id);
    setIsSpawnModalOpen(false);
    setNewAgentName('');
    setNewAgentRole('');
    setNewAgentDid('');
    playAuditChime();
    setActionSuccess(`Agent ${newAgent.name} spawned into GENESIS lifecycle state.`);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  // Mint Manual Block Submit
  const handleMintBlock = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedPayload = JSON.parse(mintPayloadJson);
      const newHeight = (evidenceBlocks[0]?.block_height || 881295) + 1;

      const newBlock = ledger.create_block(
        newHeight,
        mintMissionId.trim(),
        mintAgentDid.trim(),
        'v1.2.0-LTS-STRICT',
        parsedPayload
      );

      setEvidenceBlocks((prev) => [newBlock, ...prev]);
      setIsMintModalOpen(false);
      playAuditChime();
      setActionSuccess(`Minted Evidence Block #${newHeight} (Hash: ${newBlock.current_block_hash.slice(0, 16)}...)`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      playWarningTone();
      setActionError(`Invalid JSON payload: ${err.message}`);
    }
  };

  // Download Helm manifests or Python code
  const handleDownloadFile = (content: string, filename: string, mimeType: string) => {
    playAuditChime();
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const allowedTransitions = selectedAgent ? IdentityStateEngine.getAllowedTransitions(selectedAgent.state) : [];

  return (
    <div className="w-full bg-[#070a12] border border-[#D4AF37]/40 rounded-2xl p-4 sm:p-6 font-mono text-cyan-400 shadow-2xl space-y-6">
      {/* Top Banner & Context Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-2xl">🤖</span>
            <h2 className="text-lg sm:text-xl font-black tracking-wide text-[#D4AF37]">
              AGENT 8-STATE LIFECYCLE ENGINE &amp; EVIDENCE LEDGER
            </h2>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 border border-emerald-500 text-emerald-400">
              FROZEN v1.2 LTS
            </span>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950/60 border border-cyan-500 text-cyan-300">
              SHA-256 HASH CHAINING
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enforcing strict state invariant transitions • Immutable block hash audit trace • 10M Identity capacity router
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            onClick={() => setIsSpawnModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 flex items-center gap-1.5 transition font-bold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Spawn Genesis Agent</span>
          </button>

          <button
            onClick={() => setIsMintModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] border border-[#D4AF37]/40 flex items-center gap-1.5 transition font-bold cursor-pointer"
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Mint Evidence Block</span>
          </button>

          <button
            onClick={handleVerifyChain}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 transition font-bold cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verify Hash Chain</span>
          </button>
        </div>
      </div>

      {/* Alert Notices */}
      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-start gap-3 text-rose-300 text-xs animate-in fade-in">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <div className="flex-1 font-bold">{actionError}</div>
          <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 flex items-start gap-3 text-emerald-300 text-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
          <div className="flex-1 font-bold">{actionSuccess}</div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {verificationResult && (
        <div
          className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs animate-in fade-in ${
            verificationResult.verified
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
          }`}
        >
          {verificationResult.verified ? (
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 space-y-1">
            <div className="font-bold">
              {verificationResult.verified ? 'Cryptographic Hash Chain 100% Validated' : 'Cryptographic Chain Error Detected'}
            </div>
            <div className="text-[11px] text-slate-300">{verificationResult.details}</div>
            <div className="text-[10px] text-slate-400">
              Verified {verificationResult.blockCount} blocks at {verificationResult.timestamp}
            </div>
          </div>
          <button onClick={() => setVerificationResult(null)} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-white/10 pb-2 text-xs">
        <button
          onClick={() => {
            playTone(550, 0.02);
            setSubTab('lifecycle');
          }}
          className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            subTab === 'lifecycle'
              ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>8-State Lifecycle Engine ({agents.length} Agents)</span>
        </button>

        <button
          onClick={() => {
            playTone(600, 0.02);
            setSubTab('evidence_ledger');
          }}
          className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            subTab === 'evidence_ledger'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Evidence Ledger ({evidenceBlocks.length} Blocks)</span>
        </button>

        <button
          onClick={() => {
            playTone(650, 0.02);
            setSubTab('helm_control_plane');
          }}
          className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            subTab === 'helm_control_plane'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Kubernetes &amp; Helm Manifests</span>
        </button>

        <button
          onClick={() => {
            playTone(700, 0.02);
            setSubTab('python_spec');
          }}
          className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            subTab === 'python_spec'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Python Reference Code</span>
        </button>
      </div>

      {/* TAB 1: 8-STATE LIFECYCLE ENGINE */}
      {subTab === 'lifecycle' && (
        <div className="space-y-6">
          {/* Visual 8-State Pipeline Diagram */}
          <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#D4AF37]" />
                <span>8-State Transition Lifecycle Pipeline</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Selected Agent: <strong className="text-white">{selectedAgent?.name}</strong> (Current:{' '}
                <span className={`px-2 py-0.5 rounded font-bold ${AGENT_STATE_METADATA[selectedAgent?.state].badgeClass}`}>
                  {selectedAgent?.state}
                </span>)
              </div>
            </div>

            {/* Visual State Pipeline Nodes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
              {Object.values(AgentState).map((st) => {
                const meta = AGENT_STATE_METADATA[st];
                const isCurrent = selectedAgent?.state === st;
                const isAllowedNext = allowedTransitions.includes(st);

                return (
                  <div
                    key={st}
                    onClick={() => {
                      if (isAllowedNext && selectedAgent) {
                        handleTransition(selectedAgent.id, st);
                      } else if (!isCurrent && selectedAgent) {
                        handleTestIllegalTransition(selectedAgent.id, st);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer relative flex flex-col justify-between min-h-[90px] ${
                      isCurrent
                        ? 'bg-cyan-950/80 border-cyan-400 ring-2 ring-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                        : isAllowedNext
                        ? 'bg-emerald-950/30 border-emerald-500/80 hover:bg-emerald-950/60 hover:border-emerald-400 animate-pulse'
                        : 'bg-black/40 border-white/10 opacity-60 hover:opacity-100 hover:border-rose-500/50'
                    }`}
                  >
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold mb-1">STATE {meta.order}</div>
                      <div
                        className={`text-xs font-black tracking-tight ${
                          isCurrent ? 'text-cyan-200' : isAllowedNext ? 'text-emerald-300' : 'text-slate-300'
                        }`}
                      >
                        {st}
                      </div>
                    </div>

                    <div className="pt-2">
                      {isCurrent ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-black bg-cyan-400 text-black">
                          ACTIVE
                        </span>
                      ) : isAllowedNext ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-500/50">
                          PERMITTED
                        </span>
                      ) : (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono text-zinc-500 flex items-center justify-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> BLOCKED
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between flex-wrap gap-2 pt-1">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Current State
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Permitted Next Transition
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" /> Illegal Transition (Will Throw Error)
                </span>
              </div>
              <span className="text-[10px] text-[#D4AF37]">Click a permitted state to advance; click a blocked state to test invariant</span>
            </div>
          </div>

          {/* Main Content Layout: Directory & Selected Agent Detail */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Agent Directory (7 Cols) */}
            <div className="lg:col-span-7 space-y-3">
              {/* Filter & Search Bar */}
              <div className="flex items-center gap-2 flex-wrap justify-between bg-black/40 p-2.5 rounded-xl border border-white/10 text-xs">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search agents by name, DID, or role..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-black/50 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value)}
                    className="bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-cyan-300 focus:outline-none"
                  >
                    <option value="ALL">All States ({agents.length})</option>
                    {Object.values(AgentState).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Agent Cards List */}
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {filteredAgents.map((agent) => {
                  const isSelected = selectedAgentId === agent.id;
                  const meta = AGENT_STATE_METADATA[agent.state];
                  const agentAllowed = IdentityStateEngine.getAllowedTransitions(agent.state);

                  return (
                    <div
                      key={agent.id}
                      onClick={() => {
                        setSelectedAgentId(agent.id);
                        playTone(550, 0.02);
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                        isSelected
                          ? 'bg-[#0a0f1e] border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                          : 'bg-black/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-xs sm:text-sm">{agent.name}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${meta.badgeClass}`}>
                              {agent.state}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 font-mono truncate max-w-sm">
                            {agent.did}
                          </div>
                        </div>

                        <span className="text-[10px] text-slate-500 font-mono shrink-0">
                          {new Date(agent.lastTransitionUtc).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
                        <span className="truncate">{agent.role}</span>
                        <span className="text-cyan-300 font-bold shrink-0">{agent.policyVersion}</span>
                      </div>

                      {/* Quick Transition Action Ribbon */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[10px] text-slate-500 mr-1 font-bold">Advance:</span>
                        {agentAllowed.length > 0 ? (
                          agentAllowed.map((nextSt) => (
                            <button
                              key={nextSt}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTransition(agent.id, nextSt);
                              }}
                              className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <ArrowRight className="w-3 h-3" />
                              <span>{nextSt}</span>
                            </button>
                          ))
                        ) : (
                          <span className="text-[10px] text-zinc-500 italic">Terminal state reached (No further transitions)</span>
                        )}

                        {/* Test Illegal Transition trigger */}
                        {agent.state !== AgentState.ARCHIVED && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTestIllegalTransition(agent.id, AgentState.ARCHIVED);
                            }}
                            className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] ml-auto transition cursor-pointer"
                            title="Test illegal jump straight to ARCHIVED"
                          >
                            ⚠️ Test Illegal Skip
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Agent Forensic Dossier (5 Cols) */}
            <div className="lg:col-span-5 bg-[#0a0f1e] border border-white/10 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-xs font-bold text-white">Agent Attestation Dossier</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">FIPS 204 ML-DSA-87</span>
              </div>

              {selectedAgent ? (
                <div className="space-y-4 text-xs">
                  {/* Identity Summary Card */}
                  <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-2">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Agent Identity</div>
                      <div className="text-sm font-bold text-white">{selectedAgent.name}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Decentralized Identifier (DID)</div>
                      <div className="text-[11px] font-mono text-cyan-300 break-all flex items-center justify-between gap-1">
                        <span>{selectedAgent.did}</span>
                        <button
                          onClick={() => handleCopy(selectedAgent.did, 'selected-did')}
                          className="text-slate-400 hover:text-white shrink-0 cursor-pointer"
                        >
                          {copiedKey === 'selected-did' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Mission ID</div>
                        <div className="text-slate-200 font-bold">{selectedAgent.missionId}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Policy Version</div>
                        <div className="text-emerald-400 font-bold">{selectedAgent.policyVersion}</div>
                      </div>
                    </div>
                  </div>

                  {/* Current State Status */}
                  <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1.5">
                    <div className="text-[10px] text-slate-500 uppercase">Active Lifecycle Status</div>
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded text-xs font-black border ${AGENT_STATE_METADATA[selectedAgent.state].badgeClass}`}>
                        {selectedAgent.state}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Clearance: {AGENT_STATE_METADATA[selectedAgent.state].securityClearance}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                      {AGENT_STATE_METADATA[selectedAgent.state].description}
                    </p>
                  </div>

                  {/* Transition Control Box */}
                  <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
                    <div className="text-[10px] font-bold text-cyan-300 uppercase flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-cyan-400" />
                      <span>Authorized State Transitions</span>
                    </div>
                    <div className="space-y-1.5">
                      {allowedTransitions.length > 0 ? (
                        allowedTransitions.map((st) => (
                          <button
                            key={st}
                            onClick={() => handleTransition(selectedAgent.id, st)}
                            className="w-full p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 text-xs font-bold flex items-center justify-between transition cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5">
                              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Advance to {st}</span>
                            </span>
                            <span className="text-[10px] text-emerald-400/80 font-mono">MINT BLOCK</span>
                          </button>
                        ))
                      ) : (
                        <div className="p-2 rounded bg-black/40 border border-white/10 text-center text-slate-400 text-[11px] italic">
                          Agent is in ARCHIVED terminal state. No transitions allowed.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Historical Transition Timeline */}
                  <div className="space-y-2">
                    <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Audit Trace History ({selectedAgent.history.length})</span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {selectedAgent.history.map((h, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-black/40 border border-white/5 space-y-1 text-[11px]">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-[#D4AF37] font-bold">
                              {h.from} &rarr; {h.to}
                            </span>
                            <span className="text-slate-500 font-mono">{new Date(h.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div className="text-slate-300 text-[10px]">{h.reason}</div>
                          <div className="text-[9px] text-slate-500 font-mono truncate">
                            Block Hash: {h.blockHash}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs">Select an agent to inspect dossier.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CRYPTOGRAPHIC EVIDENCE LEDGER */}
      {subTab === 'evidence_ledger' && (
        <div className="space-y-5">
          {/* Header & Verification HUD */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>SHA-256 Immutable Evidence Hash Chain</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Every agent action, state transition, and mission payload is chained via SHA-256 hash root advancement.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleVerifyChain}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verify All {evidenceBlocks.length} Blocks</span>
              </button>

              <button
                onClick={() => handleDownloadFile(JSON.stringify(evidenceBlocks, null, 2), `ZYRQUEN_EVIDENCE_LEDGER_${Date.now()}.json`, 'application/json')}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Ledger JSON</span>
              </button>
            </div>
          </div>

          {/* Block Stream Display */}
          <div className="space-y-3">
            {evidenceBlocks.map((block, idx) => {
              const isTip = idx === 0;

              return (
                <div
                  key={block.current_block_hash}
                  className={`p-4 rounded-xl border transition-all space-y-3 ${
                    isTip
                      ? 'bg-[#0a0f1e] border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                      : 'bg-black/50 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-300 font-bold text-xs">
                        BLOCK #{block.block_height}
                      </span>
                      {isTip && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold">
                          CHAIN TIP
                        </span>
                      )}
                      <span className="text-xs text-slate-300 font-bold">{block.mission_id}</span>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono">
                      Timestamp: {block.timestamp}
                    </div>
                  </div>

                  {/* Agent & Policy metadata */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">EXECUTING AGENT DID</span>
                      <span className="font-mono text-slate-200 text-[11px] truncate block">{block.agent_did}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">POLICY GOVERNANCE VERSION</span>
                      <span className="font-bold text-emerald-400 text-[11px]">{block.policy_version}</span>
                    </div>
                  </div>

                  {/* Execution Payload JSON Box */}
                  <div className="p-2.5 rounded-lg bg-black/60 border border-white/5 space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Execution Payload</div>
                    <pre className="text-[11px] text-cyan-300/90 font-mono overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(block.execution_payload, null, 2)}
                    </pre>
                  </div>

                  {/* Cryptographic Hash Chaining Link */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] pt-1 border-t border-white/5">
                    <div>
                      <span className="text-[10px] text-slate-500 block">PREVIOUS BLOCK HASH</span>
                      <span className="font-mono text-slate-400 break-all text-[10px]">
                        {block.previous_block_hash}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-cyan-400 block font-bold">CURRENT SHA-256 HASH</span>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-cyan-300 font-bold break-all text-[10px]">
                          {block.current_block_hash}
                        </span>
                        <button
                          onClick={() => handleCopy(block.current_block_hash, `hash-${block.block_height}`)}
                          className="text-slate-400 hover:text-white shrink-0 cursor-pointer"
                        >
                          {copiedKey === `hash-${block.block_height}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: KUBERNETES & HELM MANIFESTS & OPA REGO SANDBOX */}
      {subTab === 'helm_control_plane' && (
        <div className="space-y-5">
          {/* Architecture Cluster Specs Card */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-400" />
                <span>ZYRQUEN Ω∞ FROZEN v1.2 LTS Control Plane Production Ecosystem</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const bundle = {
                      chart: 'zyrquen-control-plane',
                      version: '1.2.0',
                      appVersion: '1.2.0-LTS',
                      files: {
                        'Chart.yaml': HELM_CHART_YAML,
                        'values.yaml': HELM_VALUES_YAML,
                        'templates/namespace.yaml': K8S_NAMESPACE_YAML,
                        'templates/serviceaccount.yaml': SERVICE_ACCOUNT_YAML,
                        'templates/deployment-api-router.yaml': DEPLOYMENT_API_ROUTER_YAML,
                        'templates/deployment-opa-policy-gate.yaml': DEPLOYMENT_OPA_GATE_YAML,
                        'templates/configmap-control-plane.yaml': CONFIGMAP_CONTROL_PLANE_YAML,
                        'policies/senate-rules.rego': SENATE_RULES_REGO,
                        'config/zyrquen-config.json': ZYRQUEN_CONFIG_JSON,
                      },
                    };
                    handleDownloadFile(JSON.stringify(bundle, null, 2), 'zyrquen-control-plane-v1.2.0-helm-bundle.json', 'application/json');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Full Helm Bundle (.json)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase">Cluster Domain</span>
                <div className="font-bold text-white">zyrquen-shard-bkk-01</div>
                <div className="text-[10px] text-purple-400">zyrquen.internal</div>
              </div>

              <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase">Max Registered Identities</span>
                <div className="font-bold text-emerald-400">10,000,000</div>
                <div className="text-[10px] text-slate-400">Redis &amp; Postgres Sharded</div>
              </div>

              <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase">OPA Policy Gate</span>
                <div className="font-bold text-cyan-300">v0.62.0-zyrquen-lts</div>
                <div className="text-[10px] text-slate-400">3 HA Replicas (Port 8181)</div>
              </div>

              <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase">AI Senate Consensus</span>
                <div className="font-bold text-[#D4AF37]">Quorum 60% (Min 3)</div>
                <div className="text-[10px] text-slate-400">5000ms Execution Timeout</div>
              </div>
            </div>

            {/* Pod Security Profile Banner */}
            <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300">
                  <strong className="text-white font-mono">pod-security: restricted</strong> &bull; Non-Root UID 10001 &bull; Drop ALL Capabilities &bull; Read-Only Root Filesystem &bull; RuntimeDefault Seccomp
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] shrink-0">
                FIPS / ETDA SEC 26 COMPLIANT
              </span>
            </div>
          </div>

          {/* INTERACTIVE OPA REGO POLICY SIMULATOR */}
          <div className="p-4 rounded-2xl bg-[#0a0f1e] border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Live OPA Rego Evaluation Engine (`senate-rules.rego`)</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/40">
                    OPA v0.62.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Simulate zero-trust admission gating defined in the <code className="text-cyan-300">zyrquen-control-plane-config</code> ConfigMap.
                </p>
              </div>

              {/* Preset buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-500 font-bold mr-1">Presets:</span>
                <button
                  onClick={() => {
                    setRegoRiskLevel('LOW');
                    setRegoIdentityVerified(true);
                    playTone(600, 0.02);
                  }}
                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-bold transition cursor-pointer"
                >
                  Low Risk (Allow)
                </button>
                <button
                  onClick={() => {
                    setRegoRiskLevel('HIGH');
                    setRegoSenateApprovals(3);
                    setRegoSigValid(true);
                    playTone(600, 0.02);
                  }}
                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-bold transition cursor-pointer"
                >
                  High Risk (3 Votes - Allow)
                </button>
                <button
                  onClick={() => {
                    setRegoRiskLevel('HIGH');
                    setRegoSenateApprovals(2);
                    setRegoSigValid(true);
                    playTone(400, 0.03);
                  }}
                  className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[10px] font-bold transition cursor-pointer"
                >
                  High Risk (2 Votes - Deny)
                </button>
                <button
                  onClick={() => {
                    setRegoRiskLevel('LOW');
                    setRegoIdentityVerified(false);
                    playTone(400, 0.03);
                  }}
                  className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[10px] font-bold transition cursor-pointer"
                >
                  Unverified (Deny)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Input Parameters Controls (6 Cols) */}
              <div className="lg:col-span-6 bg-black/50 p-4 rounded-xl border border-white/10 space-y-3.5 text-xs">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  OPA Input Context (`input`)
                </span>

                {/* Risk Level */}
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <label className="text-white font-bold block">input.action_risk_level</label>
                    <span className="text-[10px] text-slate-400">Target operational risk tier</span>
                  </div>
                  <div className="flex rounded-lg overflow-hidden border border-white/10 p-0.5 bg-black/60">
                    <button
                      onClick={() => {
                        setRegoRiskLevel('LOW');
                        playTone(550, 0.02);
                      }}
                      className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        regoRiskLevel === 'LOW' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      LOW
                    </button>
                    <button
                      onClick={() => {
                        setRegoRiskLevel('HIGH');
                        playTone(550, 0.02);
                      }}
                      className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        regoRiskLevel === 'HIGH' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      HIGH
                    </button>
                  </div>
                </div>

                {/* Identity Verified */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                  <div>
                    <label className="text-white font-bold block">input.identity_verified</label>
                    <span className="text-[10px] text-slate-400">PQC Key and DID attestation confirmed</span>
                  </div>
                  <button
                    onClick={() => {
                      setRegoIdentityVerified(!regoIdentityVerified);
                      playTone(550, 0.02);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      regoIdentityVerified
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    {regoIdentityVerified ? 'TRUE (Verified)' : 'FALSE (Unverified)'}
                  </button>
                </div>

                {/* Senate Approval Count */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                  <div>
                    <label className="text-white font-bold block">input.senate_approval_count</label>
                    <span className="text-[10px] text-slate-400">Quorum threshold &ge; 3 for HIGH risk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setRegoSenateApprovals(Math.max(0, regoSenateApprovals - 1));
                        playTone(500, 0.02);
                      }}
                      className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono text-sm font-bold text-cyan-300 w-6 text-center">
                      {regoSenateApprovals}
                    </span>
                    <button
                      onClick={() => {
                        setRegoSenateApprovals(Math.min(10, regoSenateApprovals + 1));
                        playTone(600, 0.02);
                      }}
                      className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Cryptographic Signature Valid */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                  <div>
                    <label className="text-white font-bold block">input.cryptographic_sig_valid</label>
                    <span className="text-[10px] text-slate-400">Dilithium / ML-DSA-87 signature check</span>
                  </div>
                  <button
                    onClick={() => {
                      setRegoSigValid(!regoSigValid);
                      playTone(550, 0.02);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      regoSigValid
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    {regoSigValid ? 'TRUE (Valid)' : 'FALSE (Invalid)'}
                  </button>
                </div>
              </div>

              {/* Evaluation Output Decision Card (6 Cols) */}
              <div className="lg:col-span-6 bg-black/50 p-4 rounded-xl border border-white/10 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Evaluation Decision
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Latency: {regoEvaluation.evaluationTimeMs} ms (SLA &lt; 50ms)
                    </span>
                  </div>

                  {/* Decision Banner */}
                  <div
                    className={`p-4 rounded-xl border flex items-center gap-3.5 transition-all ${
                      regoEvaluation.allow
                        ? 'bg-emerald-950/30 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                        : 'bg-rose-950/30 border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
                    }`}
                  >
                    {regoEvaluation.allow ? (
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-8 h-8 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-lg font-black uppercase tracking-wider ${
                            regoEvaluation.allow ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {regoEvaluation.allow ? 'ALLOW: ACTION PERMITTED' : 'DENY: ACTION REJECTED'}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-slate-300 block mt-0.5">
                        Matched Rule: <strong className="text-white">{regoEvaluation.matchedRule}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Rationale explanation */}
                  <div className="p-3 rounded-lg bg-black/60 border border-white/5 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Policy Evaluator Rationale:</span>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans">{regoEvaluation.reason}</p>
                  </div>
                </div>

                {/* Input JSON mirror */}
                <div className="pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-mono">POST /v1/data/zyrquen/senate/governance/allow</span>
                    <button
                      onClick={() =>
                        handleCopy(
                          JSON.stringify(
                            {
                              input: {
                                action_risk_level: regoRiskLevel,
                                identity_verified: regoIdentityVerified,
                                senate_approval_count: regoSenateApprovals,
                                cryptographic_sig_valid: regoSigValid,
                              },
                            },
                            null,
                            2
                          ),
                          'rego-json'
                        )
                      }
                      className="hover:text-white cursor-pointer"
                    >
                      {copiedKey === 'rego-json' ? 'Copied' : 'Copy JSON'}
                    </button>
                  </div>
                  <pre className="text-[10px] text-cyan-300 font-mono bg-black/80 p-2 rounded max-h-24 overflow-y-auto">
                    {JSON.stringify(
                      {
                        input: {
                          action_risk_level: regoRiskLevel,
                          identity_verified: regoIdentityVerified,
                          senate_approval_count: regoSenateApprovals,
                          cryptographic_sig_valid: regoSigValid,
                        },
                        result: { allow: regoEvaluation.allow },
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* MANIFEST TABS RIBBON & EXPLORER */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'all', label: 'All 7 Manifests' },
                  { id: 'api-router', label: 'Deployment: api-router' },
                  { id: 'opa-gate', label: 'Deployment: opa-policy-gate' },
                  { id: 'configmap', label: 'ConfigMap: control-plane-config' },
                  { id: 'serviceaccount', label: 'ServiceAccount: sa' },
                  { id: 'values', label: 'values.yaml' },
                  { id: 'namespace', label: 'namespace.yaml' },
                  { id: 'chart', label: 'Chart.yaml' },
                  { id: 'rego', label: 'senate-rules.rego' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveManifestView(item.id as any);
                      playTone(550, 0.02);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activeManifestView === item.id
                        ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                        : 'bg-black/40 text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 1. Deployment: zyrquen-api-router */}
            {(activeManifestView === 'all' || activeManifestView === 'api-router') && (
              <div className="p-4 rounded-xl bg-[#0a0f1e] border border-white/10 space-y-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">
                      Deployment &bull; <code className="text-cyan-300">zyrquen-api-router</code> (Port 8080/9090, 10M identities)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(DEPLOYMENT_API_ROUTER_YAML, 'api-router-yaml')}
                      className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'api-router-yaml' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={() => handleDownloadFile(DEPLOYMENT_API_ROUTER_YAML, 'zyrquen-api-router.yaml', 'text/yaml')}
                      className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
                <pre className="text-xs text-slate-300 font-mono bg-black/60 p-3 rounded-lg overflow-x-auto max-h-72 whitespace-pre-wrap leading-relaxed">
                  {DEPLOYMENT_API_ROUTER_YAML}
                </pre>
              </div>
            )}

            {/* 2. Deployment: zyrquen-opa-policy-gate */}
            {(activeManifestView === 'all' || activeManifestView === 'opa-gate') && (
              <div className="p-4 rounded-xl bg-[#0a0f1e] border border-white/10 space-y-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">
                      Deployment &bull; <code className="text-amber-300">zyrquen-opa-policy-gate</code> (Port 8181, OPA v0.62.0, VolumeMount /etc/opa/policies)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(DEPLOYMENT_OPA_GATE_YAML, 'opa-gate-yaml')}
                      className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'opa-gate-yaml' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={() => handleDownloadFile(DEPLOYMENT_OPA_GATE_YAML, 'zyrquen-opa-policy-gate.yaml', 'text/yaml')}
                      className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
                <pre className="text-xs text-slate-300 font-mono bg-black/60 p-3 rounded-lg overflow-x-auto max-h-72 whitespace-pre-wrap leading-relaxed">
                  {DEPLOYMENT_OPA_GATE_YAML}
                </pre>
              </div>
            )}

            {/* 3. ConfigMap: zyrquen-control-plane-config */}
            {(activeManifestView === 'all' || activeManifestView === 'configmap') && (
              <div className="p-4 rounded-xl bg-[#0a0f1e] border border-white/10 space-y-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">
                      ConfigMap &bull; <code className="text-emerald-300">zyrquen-control-plane-config</code> (zyrquen-config.json + senate-rules.rego)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(CONFIGMAP_CONTROL_PLANE_YAML, 'configmap-yaml')}
                      className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'configmap-yaml' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={() => handleDownloadFile(CONFIGMAP_CONTROL_PLANE_YAML, 'zyrquen-control-plane-config.yaml', 'text/yaml')}
                      className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
                <pre className="text-xs text-slate-300 font-mono bg-black/60 p-3 rounded-lg overflow-x-auto max-h-72 whitespace-pre-wrap leading-relaxed">
                  {CONFIGMAP_CONTROL_PLANE_YAML}
                </pre>
              </div>
            )}

            {/* 4. values.yaml */}
            {(activeManifestView === 'all' || activeManifestView === 'values') && (
              <div className="p-4 rounded-xl bg-[#0a0f1e] border border-white/10 space-y-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-white">values.yaml — Helm Global Values</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(HELM_VALUES_YAML, 'helm-values')}
                      className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'helm-values' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={() => handleDownloadFile(HELM_VALUES_YAML, 'values.yaml', 'text/yaml')}
                      className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
                <pre className="text-xs text-slate-300 font-mono bg-black/60 p-3 rounded-lg overflow-x-auto max-h-72 whitespace-pre-wrap leading-relaxed">
                  {HELM_VALUES_YAML}
                </pre>
              </div>
            )}

            {/* 5. ServiceAccount, namespace.yaml & Chart.yaml */}
            {(activeManifestView === 'all' || activeManifestView === 'serviceaccount' || activeManifestView === 'namespace' || activeManifestView === 'chart') && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* ServiceAccount */}
                {(activeManifestView === 'all' || activeManifestView === 'serviceaccount') && (
                  <div className="p-4 rounded-xl bg-[#0a0f1e] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-rose-400" />
                        <span className="text-xs font-bold text-white">serviceaccount.yaml</span>
                      </div>
                      <button
                        onClick={() => handleCopy(SERVICE_ACCOUNT_YAML, 'k8s-sa')}
                        className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'k8s-sa' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                    </div>
                    <pre className="text-xs text-slate-300 font-mono bg-black/60 p-3 rounded-lg overflow-x-auto max-h-48 whitespace-pre-wrap leading-relaxed">
                      {SERVICE_ACCOUNT_YAML}
                    </pre>
                  </div>
                )}

                {/* namespace.yaml */}
                {(activeManifestView === 'all' || activeManifestView === 'namespace') && (
                  <div className="p-4 rounded-xl bg-[#0a0f1e] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-white">namespace.yaml</span>
                      </div>
                      <button
                        onClick={() => handleCopy(K8S_NAMESPACE_YAML, 'k8s-ns')}
                        className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'k8s-ns' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                    </div>
                    <pre className="text-xs text-slate-300 font-mono bg-black/60 p-3 rounded-lg overflow-x-auto max-h-48 whitespace-pre-wrap leading-relaxed">
                      {K8S_NAMESPACE_YAML}
                    </pre>
                  </div>
                )}

                {/* Chart.yaml */}
                {(activeManifestView === 'all' || activeManifestView === 'chart') && (
                  <div className="p-4 rounded-xl bg-[#0a0f1e] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-bold text-white">Chart.yaml</span>
                      </div>
                      <button
                        onClick={() => handleCopy(HELM_CHART_YAML, 'helm-chart')}
                        className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'helm-chart' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                    </div>
                    <pre className="text-xs text-slate-300 font-mono bg-black/60 p-3 rounded-lg overflow-x-auto max-h-48 whitespace-pre-wrap leading-relaxed">
                      {HELM_CHART_YAML}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* 6. senate-rules.rego */}
            {(activeManifestView === 'all' || activeManifestView === 'rego') && (
              <div className="p-4 rounded-xl bg-[#0a0f1e] border border-white/10 space-y-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">
                      policies/senate-rules.rego &bull; Open Policy Agent Rules
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(SENATE_RULES_REGO, 'senate-rules-rego')}
                      className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'senate-rules-rego' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Rego</span>
                    </button>
                    <button
                      onClick={() => handleDownloadFile(SENATE_RULES_REGO, 'senate-rules.rego', 'text/plain')}
                      className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
                <pre className="text-xs text-cyan-300 font-mono bg-black/60 p-3 rounded-lg overflow-x-auto max-h-56 whitespace-pre-wrap leading-relaxed">
                  {SENATE_RULES_REGO}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PYTHON REFERENCE CODE */}
      {subTab === 'python_spec' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/10">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>agent_lifecycle_engine.py — Official Reference Implementation</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Bit-exact implementation of AgentState Enum, IdentityStateEngine transition validator, and CryptographicEvidenceLedger.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(PYTHON_REFERENCE_CODE, 'py-code')}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedKey === 'py-code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Python</span>
              </button>

              <button
                onClick={() => handleDownloadFile(PYTHON_REFERENCE_CODE, 'agent_lifecycle_engine.py', 'text/x-python')}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .py</span>
              </button>
            </div>
          </div>

          <pre className="text-xs text-emerald-200/90 font-mono bg-[#0a0f1e] p-4 rounded-xl border border-white/10 overflow-x-auto max-h-[560px] whitespace-pre-wrap leading-relaxed">
            {PYTHON_REFERENCE_CODE}
          </pre>
        </div>
      )}

      {/* MODAL 1: Spawn Genesis Agent */}
      {isSpawnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#0d1222] border border-cyan-500/40 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Spawn New Agent (Genesis State)</h3>
              </div>
              <button onClick={() => setIsSpawnModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSpawnAgent} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Agent Name *</label>
                <input
                  type="text"
                  required
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  placeholder="e.g. Cryo Thermal Guardian 02"
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Role / Function</label>
                <input
                  type="text"
                  value={newAgentRole}
                  onChange={(e) => setNewAgentRole(e.target.value)}
                  placeholder="e.g. Sub-Kelvin Sensor Monitoring"
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Custom DID (Optional)</label>
                <input
                  type="text"
                  value={newAgentDid}
                  onChange={(e) => setNewAgentDid(e.target.value)}
                  placeholder="did:zyrquen:shard-bkk:custom-name"
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
                />
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-[11px] text-cyan-200">
                Agent will enter state <strong>GENESIS</strong>. To participate in mission execution, it must strictly proceed through <strong>IDENTITY_VERIFIED &rarr; REGISTERED &rarr; AUTHORIZED &rarr; ACTIVE_WORKER</strong>.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsSpawnModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold cursor-pointer"
                >
                  Spawn Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Mint Custom Evidence Block */}
      {isMintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[#0d1222] border border-[#D4AF37]/40 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="text-sm font-bold text-white">Mint Cryptographic Evidence Block</h3>
              </div>
              <button onClick={() => setIsMintModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleMintBlock} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Mission ID</label>
                  <input
                    type="text"
                    required
                    value={mintMissionId}
                    onChange={(e) => setMintMissionId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Agent DID</label>
                  <input
                    type="text"
                    required
                    value={mintAgentDid}
                    onChange={(e) => setMintAgentDid(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-[11px] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Execution Payload (JSON)</label>
                <textarea
                  rows={4}
                  required
                  value={mintPayloadJson}
                  onChange={(e) => setMintPayloadJson(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-cyan-300 font-mono text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[11px] text-[#D4AF37]">
                SHA-256 block hash will be computed with deterministic sorted keys. Chain root will advance from current hash.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsMintModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#c59e2f] text-black text-xs font-bold cursor-pointer"
                >
                  Calculate Hash &amp; Mint Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
