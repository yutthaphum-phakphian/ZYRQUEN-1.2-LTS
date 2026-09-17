import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Flame,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Play,
  RotateCcw,
  AlertTriangle,
  FileText,
  Activity,
  Radio,
  Terminal,
  Server,
  Download
} from 'lucide-react';
import { RegoEvaluationOutput, RegoBenchmarkCase, BENCHMARK_PAYLOAD_SUITE } from '../../data/senateRegoPolicy';
import { exportOpaSessionPdf } from '../../utils/senateGovernanceAuditExport';

interface SenateChaosSimulatorPanelProps {
  onScenarioTriggered: (scenarioId: string, result: RegoEvaluationOutput) => void;
  currentResult: RegoEvaluationOutput | null;
}

interface ChaosScenarioItem {
  id: string;
  name: string;
  codename: string;
  category: 'IMPERSONATION' | 'BYZANTINE' | 'INJECTION' | 'CONTROL';
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  targetGuard: string;
  expectedVerdict: 'DENIED' | 'ALLOWED';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  attackVector: string;
  benchmarkPayloadId: string;
}

const CHAOS_SCENARIOS: ChaosScenarioItem[] = [
  {
    id: 'phantom-citadel',
    name: 'Scenario A: Phantom Citadel',
    codename: 'PHANTOM_CITADEL_FORGERY',
    category: 'IMPERSONATION',
    icon: ShieldAlert,
    description: 'Suspended rogue agent injecting forged PQC ML-DSA-87 signatures attempting an unauthorized 1,000,000 token canonical purge.',
    targetGuard: 'Stage 1: Lifecycle Guard / Stage 2: Cryptographic Guard',
    expectedVerdict: 'DENIED',
    riskLevel: 'CRITICAL',
    attackVector: 'Lifecycle SUSPENDED bypass + 1M token overflow + forged signature envelope',
    benchmarkPayloadId: 'chaos-phantom-citadel'
  },
  {
    id: 'split-brain',
    name: 'Scenario B: Split-Brain & Role Spoofing',
    codename: 'BYZANTINE_SPLIT_BRAIN',
    category: 'BYZANTINE',
    icon: Flame,
    description: 'Partition attack injecting unverified rogue senator role FAKE_ROUGE_SENATOR alongside active dissenting quorum votes.',
    targetGuard: 'Stage 6: Senate Quorum Guard',
    expectedVerdict: 'DENIED',
    riskLevel: 'HIGH',
    attackVector: 'Rogue Node ID spoofing + Quorum partition + 1 REJECT dissent vote',
    benchmarkPayloadId: 'chaos-split-brain'
  },
  {
    id: 'null-injection',
    name: 'Scenario C: Null Boundary & Memory Injection',
    codename: 'NULL_BOUNDARY_CORRUPTION',
    category: 'INJECTION',
    icon: AlertTriangle,
    description: 'Format confusion attack passing null trust scores, null cryptographic pointers, negative budget balance (-$500), and 999B token requests.',
    targetGuard: 'Stage 2: Cryptographic Guard / Stage 4: Resource Budget Guard',
    expectedVerdict: 'DENIED',
    riskLevel: 'HIGH',
    attackVector: 'Null pointer deserialization + negative balance buffer overflow',
    benchmarkPayloadId: 'chaos-null-boundary'
  },
  {
    id: 'baseline',
    name: 'Nominal Control: Statutory Transaction',
    codename: 'NOMINAL_STATUTORY_BASELINE',
    category: 'CONTROL',
    icon: ShieldCheck,
    description: 'Active Sovereign Principal (#EP-SOVEREIGN-01) with valid ML-DSA-87 certificate, $12 within $10,000 quota, 10/10 Core AYE votes.',
    targetGuard: 'All 6 Stages (100% Pass)',
    expectedVerdict: 'ALLOWED',
    riskLevel: 'HIGH',
    attackVector: 'None (Authorized canonical ledger update pursuant to ETDA B.E. 2544)',
    benchmarkPayloadId: 'nominal-baseline'
  }
];

export const SenateChaosSimulatorPanel: React.FC<SenateChaosSimulatorPanelProps> = ({
  onScenarioTriggered,
  currentResult
}) => {
  const [activeScenarioId, setActiveScenarioId] = useState<string>('phantom-citadel');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [simulationResponse, setSimulationResponse] = useState<any>(null);
  const [webhookDispatched, setWebhookDispatched] = useState<boolean>(false);
  const [showRawJson, setShowRawJson] = useState<boolean>(false);

  const activeScenario = CHAOS_SCENARIOS.find((s) => s.id === activeScenarioId) || CHAOS_SCENARIOS[0];

  const handleTriggerScenario = async (scenario: ChaosScenarioItem) => {
    setActiveScenarioId(scenario.id);
    setIsLoading(true);
    setWebhookDispatched(false);

    try {
      // 1. Call Backend Chaos API
      const res = await fetch('/api/opa/chaos/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: scenario.id })
      });

      const data = await res.json();
      setSimulationResponse(data.response);

      // Simulate automated SOC Webhook dispatch on denial
      if (data.response?.decision === 'DENIED') {
        setTimeout(() => setWebhookDispatched(true), 400);
      }

      // 2. Synthesize RegoEvaluationOutput to update the UI & Pipeline Animation
      const payloadRef = BENCHMARK_PAYLOAD_SUITE.find((p) => p.id === scenario.benchmarkPayloadId);

      const synthesizedResult: RegoEvaluationOutput = {
        allowed: data.response.decision === 'ALLOWED',
        decision: data.response.decision,
        engine_mode: 'v2.5-OPTIMIZED',
        matched_scenario_id: scenario.id,
        matched_rule_id: data.response.passedRules?.[0] || 'RULE-FAIL-CLOSED',
        denialReasons: data.response.denialReasons || [],
        denial_reasons: data.response.denialReasons || [],
        passedRules: data.response.passedRules || [],
        passed_rules: data.response.passedRules || [],
        shortCircuitGuard: data.response.shortCircuitGuard,
        short_circuit_guard: data.response.shortCircuitGuard,
        securitySeverity: data.response.decision === 'ALLOWED' ? 'INFO' : 'CRITICAL_ALERT',
        evaluation_latency_microseconds: data.response.latencyUs || 28,
        agent_did: data.response.agentDid || payloadRef?.payload?.input?.agent?.did || 'did:zyrquen:ag-chaos-adversary',
        action: data.response.action || payloadRef?.payload?.input?.request?.action || 'CHAOS_ATTACK',
        guardTraces: data.response.guardTraces || [],
        guard_traces: data.response.guardTraces || [],
        guards: {
          suspended: false,
          signature_valid: data.response.decision === 'ALLOWED',
          budget_ok: true,
          trust_ok: true,
          quorum_ok: data.response.decision === 'ALLOWED',
          capability_ok: true
        },
        auditLog: {
          decision: data.response.decision,
          agent_did: data.response.agentDid || payloadRef?.payload?.input?.agent?.did || 'did:zyrquen:ag-chaos-adversary',
          action: data.response.action || payloadRef?.payload?.input?.request?.action || 'CHAOS_ATTACK',
          timestamp: data.response.timestamp,
          security_severity: data.response.decision === 'ALLOWED' ? 'INFO' : 'CRITICAL_ALERT',
          eval_metadata: {
            suspended: false,
            signature_valid: data.response.decision === 'ALLOWED',
            budget_ok: true,
            trust_ok: true,
            quorum_ok: data.response.decision === 'ALLOWED',
            capability_ok: true,
            short_circuit_guard: data.response.shortCircuitGuard,
            latency_us: data.response.latencyUs || 28
          },
          budget_scaling: {
            trust_score: 95,
            scaling_factor: 1,
            remaining_usd: 1000,
            max_allowed_usd: 1000,
            requested_usd: 12,
            tokens_requested: 1000,
            tokens_limit: 100000
          },
          policy_version: 'v2.5-OPTIMIZED'
        },
        evalDurationMs: (data.response.latencyUs || 28) / 1000,
        evalDurationUs: data.response.latencyUs || 28,
        evaluation_timestamp_iso: data.response.timestamp
      };

      onScenarioTriggered(scenario.id, synthesizedResult);
    } catch (err) {
      console.error('Failed to trigger chaos scenario:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportIncidentPdf = () => {
    if (!simulationResponse && !currentResult) return;

    const source = simulationResponse || currentResult;
    const isAllow = (source.decision === 'ALLOWED' || source.decision === 'ALLOW');

    exportOpaSessionPdf({
      decision: isAllow ? 'ALLOWED' : 'DENIED',
      engineMode: 'v2.5-OPTIMIZED',
      shortCircuitGuard: source.shortCircuitGuard || source.short_circuit_guard,
      denialReasons: source.denialReasons || source.denial_reasons || [],
      latencyUs: source.latencyUs || source.evaluation_latency_microseconds || 32,
      agentDid: source.agentDid || source.agent_did || 'did:zyrquen:ag-chaos-adversary',
      action: source.action || 'CHAOS_INCIDENT_ANALYSIS',
      riskLevel: 'CRITICAL',
      guardTraces: source.guardTraces || source.guard_traces || []
    });
  };

  return (
    <div id="senate-chaos-simulator-panel" className="rounded-xl border border-slate-700/80 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-md">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-950/80 text-rose-400 border border-rose-800">
              <Flame className="h-4 w-4 animate-pulse" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Chaos Simulator: Security & Resilience Stress Testing
                <span className="rounded bg-rose-950/80 px-2 py-0.5 text-xs font-mono font-bold text-rose-400 border border-rose-800">
                  CHAOS MESH v5.0
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Manually trigger adversarial scenarios against the active Senate OPA engine to verify real-time Short-Circuit fail-closed defense.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportIncidentPdf}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-700 bg-emerald-950/80 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            Export Incident PDF
          </button>
        </div>
      </div>

      {/* Scenario Trigger Cards Grid */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {CHAOS_SCENARIOS.map((scenario) => {
          const isSelected = activeScenarioId === scenario.id;
          const isAdversarial = scenario.category !== 'CONTROL';
          const IconComp = scenario.icon;

          return (
            <motion.div
              key={scenario.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`flex flex-col justify-between rounded-xl border p-4 cursor-pointer transition-all ${
                isSelected
                  ? isAdversarial
                    ? 'border-rose-500 bg-rose-950/30 shadow-lg shadow-rose-950/30 ring-1 ring-rose-500'
                    : 'border-emerald-500 bg-emerald-950/30 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
              }`}
              onClick={() => handleTriggerScenario(scenario)}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono font-bold ${
                    isAdversarial
                      ? 'bg-rose-900/60 text-rose-300 border border-rose-800'
                      : 'bg-emerald-900/60 text-emerald-300 border border-emerald-800'
                  }`}>
                    {scenario.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {scenario.riskLevel} RISK
                  </span>
                </div>

                <div className="flex items-start gap-2.5 mb-2">
                  <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                    isAdversarial ? 'bg-rose-900/60 text-rose-400' : 'bg-emerald-900/60 text-emerald-400'
                  }`}>
                    <IconComp className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-snug">
                      {scenario.name}
                    </h4>
                    <span className="font-mono text-[10px] text-slate-400">
                      {scenario.codename}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3 mb-3">
                  {scenario.description}
                </p>
              </div>

              <div>
                <div className="rounded bg-slate-900/90 p-2 text-[10px] font-mono text-slate-400 border border-slate-800/80 mb-3">
                  <div className="text-slate-500">Expected Fail Stage:</div>
                  <div className="font-bold text-amber-300 truncate">{scenario.targetGuard}</div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTriggerScenario(scenario);
                  }}
                  disabled={isLoading}
                  className={`w-full flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-bold transition-all shadow-md ${
                    isAdversarial
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  <Play className="h-3 w-3 fill-current" />
                  {isLoading && isSelected ? 'Simulating Engine...' : isAdversarial ? `Trigger ${scenario.id.split('-')[0].toUpperCase()}` : 'Run Baseline'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Immediate Simulation Response Display */}
      {simulationResponse && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 rounded-xl border border-slate-700 bg-slate-950 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <span className={`flex h-3 w-3 rounded-full ${
                simulationResponse.decision === 'ALLOWED' ? 'bg-emerald-500' : 'bg-rose-500'
              }`} />
              <span className="text-xs font-mono font-bold text-white">
                IMMEDIATE RESPONSE: {simulationResponse.id}
              </span>
              <span className={`rounded px-2 py-0.5 text-xs font-mono font-bold ${
                simulationResponse.decision === 'ALLOWED'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-rose-950 text-rose-300 border border-rose-800'
              }`}>
                {simulationResponse.decision === 'ALLOWED' ? 'VERDICT: ALLOWED' : 'VERDICT: DENIED (FAIL-CLOSED)'}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-slate-400">
                Latency: <strong className="text-sky-300">{simulationResponse.latencyUs} µs</strong>
              </span>
              {simulationResponse.shortCircuitGuard && (
                <span className="text-amber-400">
                  Halted at: <strong>{simulationResponse.shortCircuitGuard}</strong>
                </span>
              )}
              <button
                onClick={() => setShowRawJson(!showRawJson)}
                className="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:text-white"
              >
                <Terminal className="h-3 w-3" />
                {showRawJson ? 'Hide JSON' : 'Raw OPA JSON'}
              </button>
            </div>
          </div>

          {/* Details Bar */}
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="rounded-lg bg-slate-900/90 p-2.5 border border-slate-800">
              <div className="text-slate-500 text-[10px]">TARGET AGENT DID</div>
              <div className="text-slate-200 truncate mt-0.5">{simulationResponse.agentDid}</div>
            </div>
            <div className="rounded-lg bg-slate-900/90 p-2.5 border border-slate-800">
              <div className="text-slate-500 text-[10px]">SECURITY STATUS</div>
              <div className="text-emerald-400 font-bold mt-0.5">
                {simulationResponse.decision === 'DENIED' ? '✓ ATTACK NEUTRALIZED (0 Drift)' : '✓ SANCTIONED (100% Core Quorum)'}
              </div>
            </div>
            <div className="rounded-lg bg-slate-900/90 p-2.5 border border-slate-800">
              <div className="text-slate-500 text-[10px]">AUTOMATED SOC WEBHOOK</div>
              <div className="mt-0.5 flex items-center gap-1">
                {webhookDispatched ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Radio className="h-3 w-3 animate-ping" /> Dispatched to SIEM / Slack SOC (#sec-ops-alert)
                  </span>
                ) : (
                  <span className="text-slate-400">Standby / Monitoring</span>
                )}
              </div>
            </div>
          </div>

          {/* Denial Reasons */}
          {simulationResponse.denialReasons && simulationResponse.denialReasons.length > 0 && (
            <div className="mt-3 rounded-lg bg-rose-950/40 p-3 border border-rose-800/60 text-xs">
              <div className="font-bold text-rose-300 flex items-center gap-1.5 mb-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                Engine Denial Rule Enforced:
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-200/90 font-mono">
                {simulationResponse.denialReasons.map((r: string, idx: number) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Raw JSON View */}
          {showRawJson && (
            <div className="mt-3 rounded-lg bg-black p-3 font-mono text-[10px] text-emerald-400 border border-slate-800 overflow-x-auto max-h-48">
              <pre>{JSON.stringify(simulationResponse, null, 2)}</pre>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};
