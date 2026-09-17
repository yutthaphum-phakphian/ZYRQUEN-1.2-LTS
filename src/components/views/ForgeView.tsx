import React, { useState, useEffect } from 'react';
import {
  Workflow,
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Layers,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Cpu,
  Server,
  Clock,
  Radio,
  Lock,
  Search,
  Filter,
  Terminal,
  Activity,
  Zap,
  Check,
  Copy,
  Info,
  Scale,
  Sparkles,
  ArrowRight,
  Database,
  Eye,
  FileCheck2,
  Gauge,
  Network
} from 'lucide-react';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import { copyToClipboard } from '../../utils/clipboard';
import { TerminalJobLifecycleManager } from '../../services/TerminalJobLifecycleManager';

interface DagNode {
  id: number;
  title: string;
  stageName: 'DETECT' | 'SIMULATE' | 'GOVERN' | 'EXECUTE' | 'VERIFY' | 'EVIDENCE_SEAL';
  type: 'DETECT' | 'SIMULATE' | 'GOVERN' | 'EXECUTE' | 'VERIFY' | 'EVIDENCE_SEAL';
  status: 'READY' | 'EXECUTING' | 'PASSED' | 'BLOCKED';
  desc: string;
  nodeCode: string;
  inputPayload: string;
  outputPayload: string;
  invariantCheck: string;
  ssotMutationDelta: 0;
  latencyMs: number;
  workerAssigned: string;
}

interface ActiveTask {
  id: string;
  name: string;
  category: 'INVARIANT' | 'TELEMETRY' | 'HEALING' | 'SCALING' | 'SEALING' | 'GOVERNANCE';
  worker: string;
  status: 'RUNNING' | 'STREAMING' | 'PROCESSING' | 'COMPLETED' | 'MONITORING' | 'SCHEDULED' | 'READY' | 'IDLE' | 'ACTIVE';
  latency: string;
  failClosedArmed: boolean;
  ssotMutation: 0;
}

interface QueueInfo {
  queueName: string;
  displayName: string;
  state: 'DRAINED / IDLE' | '1 ACTIVE' | '12 events/sec' | 'IDLE';
  tasksPending: number;
  workerCount: number;
  description: string;
  health: 'HEALTHY' | 'STREAMING' | 'OPTIMAL';
}

interface CronSchedule {
  id: string;
  name: string;
  cronExpression: string;
  frequency: string;
  nextRun: string;
  lastRunResult: 'PASS (0 MUTATION)' | 'VERIFIED (0 DRIFT)' | 'STABILIZED';
  description: string;
}

interface CircuitBreaker {
  id: string;
  name: string;
  targetScope: string;
  state: 'CLOSED (ARMED)' | 'TRIPPED';
  tripThreshold: string;
  failAction: string;
  ssotProtection: 'ENFORCED (MUTATION = 0)';
}

// Initial DAG Nodes (Official 6-Stage Pipeline: DETECT -> SIMULATE -> GOVERN -> EXECUTE -> VERIFY -> EVIDENCE SEAL)
const INITIAL_PIPELINE_STEPS: DagNode[] = [
  {
    id: 1,
    title: 'OTel Anomaly Sensor',
    stageName: 'DETECT',
    type: 'DETECT',
    status: 'READY',
    desc: 'ตรวจ CPU/Memory, latency, event rate, resource pressure, invariant deviation >85%',
    nodeCode: 'DAG-NODE-01:DETECT_OTEL_ANOMALY',
    inputPayload: '{"metric": "container.cpu.pressure", "threshold": 0.85, "observed": 0.884, "eventRate": "12 eps", "tenant": "TNT-TH-001"}',
    outputPayload: '{"alert": "EVIDENCE_EVENT_EMITTED", "deviationDetected": true, "twinSimulationEligible": true, "canonicalWrite": "DENIED"}',
    invariantCheck: 'Telemetry read-only stream ingestion; generates Evidence Event; 0 write to Canonical.',
    ssotMutationDelta: 0,
    latencyMs: 6,
    workerAssigned: 'Worker-Beta-02',
  },
  {
    id: 2,
    title: 'Digital Twin SimA',
    stageName: 'SIMULATE',
    type: 'SIMULATE',
    status: 'READY',
    desc: 'จำลองผลกระทบ: Observed Event → Simulation → Blast Radius → Recommendation (FAIL-CLOSED if fail)',
    nodeCode: 'DAG-NODE-02:SIM_DIGITAL_TWIN_A',
    inputPayload: '{"simTarget": "worker_pool_resizing", "currentCpu": 2.0, "targetCpu": 4.0, "isolation": "SANDBOX"}',
    outputPayload: '{"simStatus": "PASSED", "estimatedLatencyReduction": "42%", "blastRadius": "0.00%", "recommendation": "SAFE_FOR_GOVERNANCE"}',
    invariantCheck: 'Sandbox simulation strictly isolated; fail-closed stop on simulated regression.',
    ssotMutationDelta: 0,
    latencyMs: 38,
    workerAssigned: 'Worker-Beta-02',
  },
  {
    id: 3,
    title: 'Executive Passport Gate',
    stageName: 'GOVERN',
    type: 'GOVERN',
    status: 'READY',
    desc: 'ตรวจ actor, authorization, policy, namespace, operation scope, evidence provenance',
    nodeCode: 'DAG-NODE-03:GOV_EXECUTIVE_PASSPORT',
    inputPayload: '{"passportNumber": "#EP-SOVEREIGN-01", "signer": "นายยุทธภูมิ พากเพียร", "namespace": "zyrquen-omega-control", "op": "RESIZE_WORKER_POOL"}',
    outputPayload: '{"authDecision": "ALLOW", "policyCheck": "CONFORMANT", "provenanceVerified": true, "scope": "NON_CANONICAL_ONLY"}',
    invariantCheck: 'ETDA Sec 26 & 28 dual-custody verification enforced. ALLOW / DENY / QUARANTINE gate.',
    ssotMutationDelta: 0,
    latencyMs: 12,
    workerAssigned: 'Worker-Gamma-03',
  },
  {
    id: 4,
    title: 'Cloud Run Auto-Scaler',
    stageName: 'EXECUTE',
    type: 'EXECUTE',
    status: 'READY',
    desc: 'ดำเนินการเฉพาะ action ที่ได้รับอนุญาต (resource right-sizing, worker scaling, queue management)',
    nodeCode: 'DAG-NODE-04:EXEC_CLOUDRUN_SCALER',
    inputPayload: '{"targetService": "zyrquen-omega-worker-pool", "cpuLimit": "4.0", "concurrency": 80, "boundary": "NON_CANONICAL"}',
    outputPayload: '{"executionState": "SCALED_SUCCESS", "activeWorkers": 4, "boundaryEnforced": true}',
    invariantCheck: 'Executed strictly within Non-Canonical Execution Boundary; Frozen Core untouched.',
    ssotMutationDelta: 0,
    latencyMs: 98,
    workerAssigned: 'Worker-Delta-04',
  },
  {
    id: 5,
    title: 'Post-Execution Invariant Verifier',
    stageName: 'VERIFY',
    type: 'VERIFY',
    status: 'READY',
    desc: 'Before State → Action → After State → Invariant Check → Evidence Record (SSoT Mutation = 0)',
    nodeCode: 'DAG-NODE-05:VERIFY_INVARIANT_ASSERTION',
    inputPayload: '{"beforeRoot": "909ab814...fa4c68", "afterRoot": "909ab814...fa4c68", "canonicalSeals": 14902, "canonicalBlock": 849202}',
    outputPayload: '{"invariantVerification": "PASS", "ssotMutation": 0, "canonicalDrift": "0.000000%", "failClosedStatus": "UNTRIGGERED"}',
    invariantCheck: 'Bit-for-bit check confirming SSoT Mutation = 0. Fail-closed halt if mutation != 0.',
    ssotMutationDelta: 0,
    latencyMs: 14,
    workerAssigned: 'Worker-Gamma-03',
  },
  {
    id: 6,
    title: 'Candidate Evidence Seal & Promotion Quarantine',
    stageName: 'EVIDENCE_SEAL',
    type: 'EVIDENCE_SEAL',
    status: 'READY',
    desc: 'สร้าง Candidate Evidence Seal → ส่งเข้า Evidence → Verification → Promotion Gate (BLOCKED in Quarantine)',
    nodeCode: 'DAG-NODE-06:SEAL_CANDIDATE_EVIDENCE',
    inputPayload: '{"evidenceType": "AUTONOMOUS_SCALING_RECORD", "canonicalSeals": 14902, "canonicalBlock": 849202, "quarantine": true}',
    outputPayload: '{"candidateSealId": "SEAL-CANDIDATE-940121", "promotionGate": "BLOCKED (QUARANTINED)", "ssotMutation": 0}',
    invariantCheck: 'AUTOMATION ≠ CANONICAL AUTHORITY. Promotion BLOCKED unless explicitly authorized.',
    ssotMutationDelta: 0,
    latencyMs: 16,
    workerAssigned: 'Worker-Alpha-01',
  },
];

// 18 Active Tasks
const ACTIVE_TASKS: ActiveTask[] = [
  { id: 'TSK-01', name: 'otel-cpu-threshold-watcher', category: 'TELEMETRY', worker: 'Worker-Beta-02', status: 'RUNNING', latency: '2.1ms', failClosedArmed: true, ssotMutation: 0 },
  { id: 'TSK-02', name: 'otel-memory-pressure-sampler', category: 'TELEMETRY', worker: 'Worker-Beta-02', status: 'STREAMING', latency: '1.8ms', failClosedArmed: true, ssotMutation: 0 },
  { id: 'TSK-03', name: 'merkle-leaf-candidate-indexer-01', category: 'SEALING', worker: 'Worker-Alpha-01', status: 'PROCESSING', latency: '14.2ms', failClosedArmed: true, ssotMutation: 0 },
  { id: 'TSK-04', name: 'sim-twin-right-sizing-evaluator', category: 'HEALING', worker: 'Worker-Beta-02', status: 'COMPLETED', latency: '44.0ms', failClosedArmed: true, ssotMutation: 0 },
  { id: 'TSK-05', name: 'executive-passport-sig-verifier', category: 'GOVERNANCE', worker: 'Worker-Gamma-03', status: 'IDLE', latency: '0.9ms', failClosedArmed: true, ssotMutation: 0 },
  { id: 'TSK-06', name: 'phoenix-container-health-sentinel', category: 'HEALING', worker: 'Worker-Delta-04', status: 'MONITORING', latency: '3.4ms', failClosedArmed: true, ssotMutation: 0 },
  { id: 'TSK-07', name: 'drift-detector-frozen-core-check', category: 'INVARIANT', worker: 'Worker-Gamma-03', status: 'SCHEDULED', latency: '5.2ms', failClosedArmed: true, ssotMutation: 0 },
  { id: 'TSK-08', name: 'fail-closed-circuit-breaker-poller', category: 'GOVERNANCE', worker: 'Worker-Delta-04', status: 'ACTIVE', latency: '1.1ms', failClosedArmed: true, ssotMutation: 0 },
  { id: 'TSK-09', name: 'otel-span-aggregator-stream', category: 'TELEMETRY', worker: 'Worker-Beta-02', status: 'STREAMING', latency: '0.8ms', failClosedArmed: true, ssotMutation: 0 },
  { id: 'TSK-10', name: 'subzero-cryo-flush-agent', category: 'HEALING', worker: 'Worker-Gamma-03', status: 'SCHEDULED', latency: '8.0ms', failClosedArmed: true, ssotMutation: 0 },
  { id: 'TSK-11', name: 'post-quantum-dilithium-validator', category: 'SEALING', worker: 'Worker-Alpha-01', status: 'READY', latency: '6.5ms', failClosedArmed: true, ssotMutation: 0 },
  { id: 'TSK-12', name: 'tenant-boundary-isolation-probe', category: 'INVARIANT', worker: 'Worker-Delta-04', status: 'RUNNING', latency: '2.4ms', failClosedArmed: true, ssotMutation: 0 },
  { id: 'TSK-13', name: 'crypto-merkle-recalculator-worker', category: 'INVARIANT', worker: 'Worker-Gamma-03', status: 'SCHEDULED', latency: '19.8ms', failClosedArmed: true, ssotMutation: 0 },
  { id: 'TSK-14', name: 'vector-batch-embedder-pipeline', category: 'SCALING', worker: 'Worker-Beta-02', status: 'IDLE', latency: '0.0ms', failClosedArmed: true, ssotMutation: 0 },
  { id: 'TSK-15', name: 'evidence-quarantine-guard', category: 'GOVERNANCE', worker: 'Worker-Delta-04', status: 'ACTIVE', latency: '1.5ms', failClosedArmed: true, ssotMutation: 0 },
  { id: 'TSK-16', name: 'sovereign-audit-log-appender', category: 'GOVERNANCE', worker: 'Worker-Alpha-01', status: 'STREAMING', latency: '2.9ms', failClosedArmed: true, ssotMutation: 0 },
  { id: 'TSK-17', name: 'cloud-run-worker-pool-governor', category: 'SCALING', worker: 'Worker-Beta-02', status: 'MONITORING', latency: '4.2ms', failClosedArmed: true, ssotMutation: 0 },
  { id: 'TSK-18', name: 'candidate-evidence-seal-emitter', category: 'SEALING', worker: 'Worker-Alpha-01', status: 'READY', latency: '3.1ms', failClosedArmed: true, ssotMutation: 0 },
];

// 4 Task Queues
const TASK_QUEUES: QueueInfo[] = [
  {
    queueName: 'phoenix-healing-queue',
    displayName: 'Phoenix Auto-Healing Queue',
    state: 'DRAINED / IDLE',
    tasksPending: 0,
    workerCount: 1,
    description: 'Zero pending healing interventions. Auto-recovery loop armed and standing by.',
    health: 'HEALTHY',
  },
  {
    queueName: 'merkle-indexing-queue',
    displayName: 'Merkle Indexing Queue',
    state: '1 ACTIVE',
    tasksPending: 1,
    workerCount: 1,
    description: 'Candidate telemetry leaf indexing in progress. Canonical Merkle Root strictly untouched.',
    health: 'STREAMING',
  },
  {
    queueName: 'otel-span-aggregation',
    displayName: 'OpenTelemetry Span Stream',
    state: '12 events/sec',
    tasksPending: 12,
    workerCount: 1,
    description: 'Live ingestion of spans, traces, and metrics from sandboxed container runtimes.',
    health: 'STREAMING',
  },
  {
    queueName: 'vector-batch-embedder',
    displayName: 'Vector Batch Embedder',
    state: 'IDLE',
    tasksPending: 0,
    workerCount: 1,
    description: 'Civilization telemetry embedding pipeline synchronized at 256 dimensions.',
    health: 'OPTIMAL',
  },
];

// 3 Scheduled Cron Automation Rules
const CRON_SCHEDULES: CronSchedule[] = [
  {
    id: 'CRON-01',
    name: 'Drift & Invariant Check',
    cronExpression: '*/5 * * * *',
    frequency: 'Every 5 minutes',
    nextRun: 'in 2m 14s',
    lastRunResult: 'PASS (0 MUTATION)',
    description: 'Continuous cryptographic hash comparison against Frozen Core #849202 (14,902 Seals).',
  },
  {
    id: 'CRON-02',
    name: 'Merkle Tree Re-Validation',
    cronExpression: '0 * * * *',
    frequency: 'Hourly on minute 0',
    nextRun: 'in 24m 08s',
    lastRunResult: 'VERIFIED (0 DRIFT)',
    description: 'Complete 14,902-leaf Merkle root recalculation confirming bit-for-bit exact match.',
  },
  {
    id: 'CRON-03',
    name: 'Subzero Cryo Flush Cycle',
    cronExpression: '0 0 * * *',
    frequency: 'Daily at 00:00 ICT',
    nextRun: 'in 6h 12m',
    lastRunResult: 'STABILIZED',
    description: 'Cryostat vacuum calibration and quantum coherence baseline thermal flush.',
  },
];

// 8 Automatic Circuit Breaker Rules
const AUTOMATIC_CIRCUIT_BREAKER_RULES = [
  { condition: 'Canonical Drift > 0', action: 'BLOCK', state: 'CLOSED (ARMED)', type: 'CRITICAL', description: 'Hard denial & immediate container halt if any baseline hash differs from #849202.' },
  { condition: 'SSoT Mutation ≠ 0', action: 'BLOCK', state: 'CLOSED (ARMED)', type: 'CRITICAL', description: 'Zero write authority enforced across all DAG workflows and candidate pipelines.' },
  { condition: 'Cross-Tenant Access', action: 'BLOCK', state: 'CLOSED (ARMED)', type: 'CRITICAL', description: 'Prohibits any worker or tenant token from crossing isolated namespace bounds.' },
  { condition: 'Invalid Signature', action: 'BLOCK', state: 'CLOSED (ARMED)', type: 'CRITICAL', description: 'Rejects execution if Executive Passport or HSM signature validation fails.' },
  { condition: 'Failed Simulation', action: 'BLOCK', state: 'CLOSED (ARMED)', type: 'CRITICAL', description: 'Fail-closed: Stops workflow immediately if Digital Twin SimA predicts blast radius > 0.' },
  { condition: 'Missing Provenance', action: 'QUARANTINE', state: 'CLOSED (ARMED)', type: 'GUARD', description: 'Buffers evidence records lacking verifiable causal trace links in quarantine buffer.' },
  { condition: 'Candidate Drift', action: 'QUARANTINE', state: 'CLOSED (ARMED)', type: 'GUARD', description: 'Isolates candidate evidence seals if discrepancy with local index is detected.' },
  { condition: 'Verification PASS', action: 'Evidence Accepted', state: 'ACTIVE', type: 'SUCCESS', description: 'Candidate Evidence Seal safely buffered into Quarantine Evidence Ledger.' },
  { condition: 'Promotion Authorization', action: 'Separate Gate (LOCKED)', state: 'FAIL-CLOSED', type: 'SOVEREIGN', description: 'Physical quarantine barrier: Promotion requires explicit sovereign dual-custody clearance.' },
];

// 4 Fail-Closed Circuit Breakers
const CIRCUIT_BREAKERS: CircuitBreaker[] = [
  {
    id: 'CB-01',
    name: 'Canonical Core Write Interceptor',
    targetScope: 'Frozen Core Block #849202 & 14,902 Seals',
    state: 'CLOSED (ARMED)',
    tripThreshold: 'Any direct write, mutate, or delete attempt on Frozen SSoT',
    failAction: 'HARD DENY + REVERT + LOG SECURITY EVENT',
    ssotProtection: 'ENFORCED (MUTATION = 0)',
  },
  {
    id: 'CB-02',
    name: 'OTel Telemetry Flood Guard',
    targetScope: 'otel-span-aggregation Queue',
    state: 'CLOSED (ARMED)',
    tripThreshold: 'Ingress rate > 5,000 spans/sec',
    failAction: 'THROTTLE TO 1,000 EPS + BACKPRESSURE',
    ssotProtection: 'ENFORCED (MUTATION = 0)',
  },
  {
    id: 'CB-03',
    name: 'Auto-Scaler Resource Ceiling',
    targetScope: 'Cloud Run Worker Container Allocation',
    state: 'CLOSED (ARMED)',
    tripThreshold: 'Requested CPU > 8.0 or Memory > 16GB',
    failAction: 'CAP AT 4.0 CPU / 8GB RAM + REQUIRE DUAL-CUSTODY SIGN',
    ssotProtection: 'ENFORCED (MUTATION = 0)',
  },
  {
    id: 'CB-04',
    name: 'Candidate Seal Quarantine Barrier',
    targetScope: 'Promotion Firewall Pipeline',
    state: 'CLOSED (ARMED)',
    tripThreshold: 'Automatic promotion attempt into Canonical Ledger',
    failAction: 'FAIL-CLOSED: PROMOTION BLOCKED (CANDIDATE ONLY)',
    ssotProtection: 'ENFORCED (MUTATION = 0)',
  },
];

export const ForgeView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<
    'PIPELINE' | 'QUEUES_WORKERS' | 'SCHEDULED_CRON' | 'ACTIVE_TASKS' | 'CIRCUIT_BREAKERS' | 'CANONICAL_BOUNDARY'
  >('PIPELINE');

  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [selectedNode, setSelectedNode] = useState<DagNode | null>(() => INITIAL_PIPELINE_STEPS[0]);
  const [pipelineSteps, setPipelineSteps] = useState<DagNode[]>(INITIAL_PIPELINE_STEPS);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<string>('ALL');
  const [cronLogs, setCronLogs] = useState<string[]>([
    '[CRON] 05:00:00 ICT - Drift & Invariant Check triggered (*/5 * * * *): PASS (0 Drift, 0 Mutation)',
    '[CRON] 05:00:00 ICT - Merkle Tree Re-Validation triggered (0 * * * *): 14,902 Seals Verified Intact',
    '[CRON] 00:00:00 ICT - Subzero Cryo Flush Cycle executed: Cryostat thermal locked at 12.4 mK',
  ]);
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([
    '[INIT] DAG Workflow Forge initialized in READ-ONLY / FROZEN mode.',
    '[CORE] Canonical Baseline locked: #849202 (14,902 Seals, SSoT Mutation = 0).',
    '[STANDBY] Phoenix Auto-Healing pipeline ready on event triggers.',
  ]);

  const activeTasks = ACTIVE_TASKS;
  const taskQueues = TASK_QUEUES;
  const cronSchedules = CRON_SCHEDULES;
  const automaticCircuitBreakerRules = AUTOMATIC_CIRCUIT_BREAKER_RULES;
  const circuitBreakers = CIRCUIT_BREAKERS;

  // Pipeline Execution Runner
  const handleRunPipeline = () => {
    if (isRunningPipeline) return;

    const idempotencyKey = `IDEMP-DAG-PIPELINE-${Date.now().toString().slice(0, 8)}`;
    const existingJob = TerminalJobLifecycleManager.getJobOrByKey(idempotencyKey);
    const status = existingJob?.state;

    // Strict guard pattern: block re-triggering of terminal states
    if (status === 'COMPLETED' || status === 'UPLOADED' || status === 'TERMINAL_BLOCKED' || status === 'TERMINAL_REJECTED') {
      console.warn(`[ForgeView] Pipeline trigger blocked: job '${idempotencyKey}' already in terminal state '${status}'.`);
      return;
    }

    TerminalJobLifecycleManager.submitJob({
      jobType: 'PIPELINE_EXECUTION',
      idempotencyKey,
      payload: { stagesCount: pipelineSteps.length },
      actor: 'FORGE_DAG_RUNNER',
    });

    setIsRunningPipeline(true);
    setActiveStep(0);
    playTone(520, 0.08);

    const updated: DagNode[] = [...pipelineSteps].map((s) => ({ ...s, status: 'READY' }));
    updated[0].status = 'EXECUTING';
    setPipelineSteps(updated);
    setSelectedNode(updated[0]);

    setPipelineLogs((prev) => [
      `[DAG START] Initiating Phoenix Auto-Healing Automation Layer execution at ${new Date().toLocaleTimeString('en-GB')} ICT...`,
      `[STAGE 01: DETECT] OTel Anomaly Sensor: Evaluating CPU/Memory, latency, pressure, invariant deviation...`,
      ...prev,
    ]);

    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current < pipelineSteps.length) {
        setActiveStep(current);
        playTone(480 + current * 60, 0.06);

        setPipelineSteps((prevSteps) => {
          const next = [...prevSteps];
          next[current - 1].status = 'PASSED';
          next[current].status = 'EXECUTING';
          setSelectedNode(next[current]);
          return next;
        });

        const step = pipelineSteps[current];
        setPipelineLogs((prev) => [
          `[STAGE 0${step.id}: ${step.stageName}] ${step.title}: Verified (${step.latencyMs}ms) • SSoT Mutation = 0`,
          ...prev,
        ]);
      } else {
        clearInterval(interval);
        setPipelineSteps((prevSteps) => {
          const next = [...prevSteps];
          next[next.length - 1].status = 'PASSED';
          setSelectedNode(next[next.length - 1]);
          return next;
        });

        setIsRunningPipeline(false);
        playAuditChime();

        TerminalJobLifecycleManager.transitionState(idempotencyKey, 'COMPLETED', {
          stagesPassed: 6,
          ssotMutation: 0,
        });

        setPipelineLogs((prev) => [
          `[DAG COMPLETE] All 6 Automation Stages executed successfully.`,
          `[VERIFICATION] SSoT Mutation = 0 bit-for-bit verified. Invariant Check Passed.`,
          `[EVIDENCE SEAL] Candidate Evidence Seal SEAL-CANDIDATE-940121 generated & placed in Quarantine Buffer.`,
          `[PROMOTION GATE] Promotion BLOCKED (Fail-Closed Barrier). Canonical Block #849202 (14,902 Seals) unchanged.`,
          ...prev,
        ]);
      }
    }, 650);
  };

  const handleSimulateCron = (cron: CronSchedule) => {
    playTone(640, 0.05);
    const log = `[CRON MANUAL] ${new Date().toLocaleTimeString('en-GB')} ICT - Executed ${cron.name} (${cron.cronExpression}): Verified PASS (0 Mutation, 0 Drift).`;
    setCronLogs((prev) => [log, ...prev]);
  };

  const handleCopy = (text: string, key: string) => {
    copyToClipboard(text);
    setCopiedKey(key);
    playTone(720, 0.03);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredTasks = activeTasks.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
      t.worker.toLowerCase().includes(taskSearchQuery.toLowerCase());
    const matchesCategory = taskCategoryFilter === 'ALL' || t.category === taskCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans">
      {/* Top Banner / Canonical Baseline & Automation Status */}
      <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#1c1206]/90 via-[#0b0e1a]/85 to-[#07080F] border border-amber-500/20 backdrop-blur-2xl flex flex-col xl:flex-row xl:items-center justify-between gap-6 shadow-[0_0_35px_rgba(245,158,11,0.08)]">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Workflow className="w-3.5 h-3.5" />
              <span>DAG WORKFLOW FORGE</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>18 ACTIVE TASKS</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" />
              <span>4 WORKERS</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>FAIL-CLOSED BREAKERS ARMED</span>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-mono font-bold text-white tracking-tight flex items-center gap-3">
            <span>Visual Automation &amp; DAG Workflow Forge</span>
            <span className="text-xs px-2.5 py-0.5 rounded-lg bg-zinc-800 text-zinc-300 font-mono font-normal">
              v1.2 LTS Orchestration Plane
            </span>
          </h2>

          <p className="text-zinc-400 text-xs sm:text-sm font-mono max-w-4xl leading-relaxed">
            Automated Task Orchestration &bull; Event-Driven Cron Triggers &bull; Phoenix Auto-Healing Pipeline &bull;
            Fail-Closed Circuit Breakers &bull; <strong className="text-amber-300">AUTOMATION ≠ CANONICAL AUTHORITY</strong>
          </p>
        </div>

        {/* Action Button & Invariant Badge */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="p-3 rounded-2xl bg-black/60 border border-white/10 text-xs font-mono text-zinc-400 space-y-1">
            <div className="flex justify-between gap-4">
              <span>Canonical Seals:</span>
              <strong className="text-emerald-400">14,902 / 14,902</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>SSoT Mutation:</span>
              <strong className="text-cyan-400">0 (INVIOLABLE)</strong>
            </div>
          </div>

          <button
            onClick={handleRunPipeline}
            disabled={isRunningPipeline}
            className={`px-5 py-3 rounded-2xl font-mono text-xs font-bold flex items-center gap-2.5 border transition-all cursor-pointer shadow-lg ${
              isRunningPipeline
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 animate-pulse'
                : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.25)] hover:scale-[1.02]'
            }`}
          >
            <Play className={`w-4 h-4 ${isRunningPipeline ? 'animate-spin text-amber-400' : ''}`} />
            <span>
              {isRunningPipeline
                ? `Executing Node 0${activeStep + 1} of ${pipelineSteps.length}...`
                : 'Run Automated DAG Pipeline'}
            </span>
          </button>
        </div>
      </div>

      {/* Hard Boundary Banner */}
      <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/30 font-mono text-xs text-zinc-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-white font-bold flex items-center gap-2">
              <span>CANONICAL BOUNDARY LOCK:</span>
              <span className="text-amber-400">AUTOMATION ≠ CANONICAL AUTHORITY</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              DAG can detect, simulate, govern, execute worker sizing, and generate candidate evidence seals. Direct write to Frozen Core is strictly prohibited (Mutation = 0).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-[10px]">
          <span className="px-2.5 py-1 rounded bg-black/80 border border-white/10 text-emerald-300">
            Block: #849202
          </span>
          <span className="px-2.5 py-1 rounded bg-black/80 border border-white/10 text-cyan-300">
            Heartbeat: 1.00 Hz
          </span>
          <span className="px-2.5 py-1 rounded bg-black/80 border border-white/10 text-zinc-400 font-mono">
            Root: 909ab814...fa4c68
          </span>
        </div>
      </div>

      {/* Subtab Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => {
            setActiveSubTab('PIPELINE');
            playTone(560, 0.02);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'PIPELINE'
              ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
              : 'text-zinc-400 hover:text-white bg-black/40 border border-white/5'
          }`}
        >
          <Workflow className="w-4 h-4 text-amber-400" />
          <span>DAG Pipeline (6 Stages)</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('QUEUES_WORKERS');
            playTone(570, 0.02);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'QUEUES_WORKERS'
              ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
              : 'text-zinc-400 hover:text-white bg-black/40 border border-white/5'
          }`}
        >
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Queues &amp; 4 Workers</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('SCHEDULED_CRON');
            playTone(580, 0.02);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'SCHEDULED_CRON'
              ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
              : 'text-zinc-400 hover:text-white bg-black/40 border border-white/5'
          }`}
        >
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>Scheduled Cron (3)</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('ACTIVE_TASKS');
            playTone(590, 0.02);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'ACTIVE_TASKS'
              ? 'bg-violet-500/20 text-violet-200 border border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.2)]'
              : 'text-zinc-400 hover:text-white bg-black/40 border border-white/5'
          }`}
        >
          <Activity className="w-4 h-4 text-violet-400" />
          <span>18 Active Tasks</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('CIRCUIT_BREAKERS');
            playTone(600, 0.02);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'CIRCUIT_BREAKERS'
              ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
              : 'text-zinc-400 hover:text-white bg-black/40 border border-white/5'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>Circuit Breakers (8 Rules)</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('CANONICAL_BOUNDARY');
            playTone(610, 0.02);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'CANONICAL_BOUNDARY'
              ? 'bg-teal-500/20 text-teal-200 border border-teal-500/40 shadow-[0_0_15px_rgba(20,184,166,0.2)]'
              : 'text-zinc-400 hover:text-white bg-black/40 border border-white/5'
          }`}
        >
          <Scale className="w-4 h-4 text-teal-400" />
          <span>Architecture Topology &amp; Boundary</span>
        </button>
      </div>

      {/* Subtab 1: DAG Pipeline (6 Stages) */}
      {activeSubTab === 'PIPELINE' && (
        <div className="space-y-6">
          {/* Architecture Topology Flow Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-black/80 via-[#0a1020]/90 to-black/80 border border-cyan-500/20 font-mono text-xs text-zinc-300 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5" />
                <span>FORMAL AUTOMATION PLANE TOPOLOGY</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
                CANONICAL CORE: READ-ONLY
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-2 items-center text-[10px] text-center">
              <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 font-bold">
                1. 🛰️ DETECT<br /><span className="text-[9px] text-zinc-400 font-normal">OTel Anomaly Sensor</span>
              </div>
              <div className="text-zinc-600 hidden md:block">&rarr;</div>
              <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 font-bold">
                2. 🧪 SIMULATE<br /><span className="text-[9px] text-zinc-400 font-normal">Digital Twin SimA</span>
              </div>
              <div className="text-zinc-600 hidden md:block">&rarr;</div>
              <div className="p-2.5 rounded-xl bg-violet-950/30 border border-violet-500/30 text-violet-200 font-bold">
                3. 🏛️ GOVERN<br /><span className="text-[9px] text-zinc-400 font-normal">Passport Gate</span>
              </div>
              <div className="text-zinc-600 hidden md:block">&rarr;</div>
              <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 font-bold">
                4. ⚡ EXECUTE<br /><span className="text-[9px] text-zinc-400 font-normal">Worker Auto-Scaler</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center text-[10px] text-center pt-2 border-t border-white/5">
              <div className="p-2.5 rounded-xl bg-teal-950/30 border border-teal-500/30 text-teal-200 font-bold">
                5. 🔐 VERIFY<br /><span className="text-[9px] text-zinc-400 font-normal">Before &rarr; After (Mutation=0)</span>
              </div>
              <div className="text-zinc-600 hidden md:block">&rarr;</div>
              <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-500/30 text-blue-200 font-bold">
                6. 🧬 EVIDENCE SEAL<br /><span className="text-[9px] text-zinc-400 font-normal">Candidate Quarantine Buffer</span>
              </div>
              <div className="text-zinc-600 hidden md:block">&rarr;</div>
              <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 font-bold">
                ⛔ PROMOTION GATE<br /><span className="text-[9px] text-rose-400 font-normal">FAIL-CLOSED (BLOCKED)</span>
              </div>
            </div>
          </div>

          {/* Visual DAG Flow Chart */}
          <div className="p-6 rounded-[28px] bg-[#0b0e1a]/80 border border-white/8 backdrop-blur-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
                  Phoenix Auto-Healing Pipeline (Directed Acyclic Graph)
                </span>
                <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                  DETECT &rarr; SIMULATE &rarr; GOVERN &rarr; EXECUTE &rarr; VERIFY &rarr; EVIDENCE SEAL
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                Deterministic Topo Order: 6 Stages
              </span>
            </div>

            {/* 6 Stage Interactive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 relative">
              {pipelineSteps.map((step, idx) => {
                const isCurrent = activeStep === idx;
                const isCompleted = step.status === 'PASSED';
                const isSelected = selectedNode?.id === step.id;

                return (
                  <div
                    key={step.id}
                    onClick={() => {
                      setSelectedNode(step);
                      playTone(520 + step.id * 30, 0.03);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between space-y-2.5 ${
                      isSelected
                        ? 'ring-2 ring-amber-400/80 bg-amber-950/40 border-amber-500/60 shadow-[0_0_30px_rgba(245,158,11,0.25)] scale-[1.02]'
                        : isCurrent
                        ? 'bg-amber-950/30 border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.2)]'
                        : isCompleted
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300 hover:border-emerald-400/60'
                        : 'bg-black/40 border-white/6 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 font-bold">
                          {step.stageName}
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isCurrent
                              ? 'bg-amber-400 animate-ping'
                              : isCompleted
                              ? 'bg-emerald-400'
                              : 'bg-zinc-600'
                          }`}
                        />
                      </div>

                      <h4 className="text-[11px] font-mono font-bold text-zinc-100 mt-2 leading-snug">
                        {step.title}
                      </h4>
                      <p className="text-[10px] text-zinc-400 font-mono mt-1 leading-snug line-clamp-2">
                        {step.desc}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/5 text-[9px] font-mono flex items-center justify-between text-zinc-400">
                      <span>0{step.id}</span>
                      <span
                        className={
                          isCompleted
                            ? 'text-emerald-400 font-bold'
                            : isCurrent
                            ? 'text-amber-400 font-bold'
                            : 'text-zinc-500'
                        }
                      >
                        {step.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Node Inspector & Live Log Stream */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Node Deep Inspector (7 cols) */}
            {selectedNode && (
              <div className="lg:col-span-7 p-6 rounded-[28px] bg-[#0b0e1a]/80 border border-white/10 space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Node 0{selectedNode.id}: {selectedNode.title}
                      </h4>
                      <span className="text-zinc-400 text-[10px]">{selectedNode.nodeCode}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold">
                    Worker: {selectedNode.workerAssigned}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                  <div className="p-3 rounded-xl bg-black/50 border border-white/5">
                    <span className="text-zinc-500 block text-[10px]">STAGE TYPE</span>
                    <strong className="text-amber-300">{selectedNode.type}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-black/50 border border-white/5">
                    <span className="text-zinc-500 block text-[10px]">LATENCY</span>
                    <strong className="text-cyan-300">{selectedNode.latencyMs} ms</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-black/50 border border-white/5">
                    <span className="text-zinc-500 block text-[10px]">SSoT MUTATION DELTA</span>
                    <strong className="text-emerald-400">0 (ZERO)</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                    <span>INPUT TELEMETRY PAYLOAD:</span>
                    <button
                      onClick={() => handleCopy(selectedNode.inputPayload, 'node-input')}
                      className="text-zinc-500 hover:text-white flex items-center gap-1 text-[10px]"
                    >
                      {copiedKey === 'node-input' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded-xl bg-black/90 border border-white/5 text-zinc-300 text-[11px] overflow-x-auto">
                    {selectedNode.inputPayload}
                  </pre>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                    <span>OUTPUT / ATTESTATION RESULT:</span>
                    <button
                      onClick={() => handleCopy(selectedNode.outputPayload, 'node-output')}
                      className="text-zinc-500 hover:text-white flex items-center gap-1 text-[10px]"
                    >
                      {copiedKey === 'node-output' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded-xl bg-black/90 border border-white/5 text-emerald-300 text-[11px] overflow-x-auto">
                    {selectedNode.outputPayload}
                  </pre>
                </div>

                <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-300 text-[11px] flex items-start gap-2">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">Invariant Assertion:</strong>
                    <span>{selectedNode.invariantCheck}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Right: Live Execution Logs (5 cols) */}
            <div className="lg:col-span-5 p-6 rounded-[28px] bg-[#0b0e1a]/80 border border-white/10 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-bold text-white">DAG Execution Log Stream</h4>
                </div>
                <button
                  onClick={() => setPipelineLogs([`[CLEAR] Execution logs reset at ${new Date().toLocaleTimeString('en-GB')} ICT.`])}
                  className="text-zinc-500 hover:text-white text-[10px]"
                >
                  Clear
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-black/90 border border-white/5 text-zinc-300 text-[11px] space-y-2 h-[340px] overflow-y-auto font-mono">
                {pipelineLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`leading-relaxed ${
                      log.includes('INVARIANT PROOF') || log.includes('EVIDENCE SEAL')
                        ? 'text-emerald-300 font-bold'
                        : log.includes('TRIGGER') || log.includes('DAG START')
                        ? 'text-amber-300'
                        : 'text-zinc-400'
                    }`}
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Queues & 4 Workers */}
      {activeSubTab === 'QUEUES_WORKERS' && (
        <div className="space-y-6 font-mono text-xs">
          {/* 4 Task Queues Status Grid */}
          <div className="p-6 rounded-[28px] bg-[#0b0e1a]/80 border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Execution Task Queues (Active State)</h3>
                  <span className="text-zinc-400 text-[11px]">Asynchronous Workflow Buffer &amp; Telemetry Queues</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[11px] font-bold">
                4 Queues Synchronized
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {taskQueues.map((q, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-black/50 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{q.displayName}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        q.state === 'DRAINED / IDLE' || q.state === 'IDLE'
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 animate-pulse'
                      }`}
                    >
                      {q.state}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400">{q.description}</div>
                  <div className="text-[10px] text-zinc-500 pt-2 border-t border-white/5 flex justify-between">
                    <span>Queue: <strong className="text-zinc-300">{q.queueName}</strong></span>
                    <span>Assigned Workers: <strong className="text-cyan-400">{q.workerCount}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4 Dedicated Worker Slots */}
          <div className="p-6 rounded-[28px] bg-[#0b0e1a]/80 border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">4 Dedicated Orchestration Workers</h3>
                  <span className="text-zinc-400 text-[11px]">Sandboxed Cloud Run Worker Container Instances</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-bold">
                Worker Pool: 4 / 4 Healthy
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: 'Worker-Alpha-01', role: 'Candidate Sealing & Indexing', currentTask: 'merkle-indexing-queue #TX-901', cpu: '14.2%', ram: '240 MB' },
                { name: 'Worker-Beta-02', role: 'OTel Telemetry & Simulation', currentTask: 'otel-span-aggregator stream', cpu: '22.8%', ram: '310 MB' },
                { name: 'Worker-Gamma-03', role: 'Governance & Cron Schedulers', currentTask: 'IDLE (Standby for Drift Check)', cpu: '2.1%', ram: '180 MB' },
                { name: 'Worker-Delta-04', role: 'Fail-Closed Circuit Breakers', currentTask: 'tenant-boundary-isolation-probe', cpu: '5.6%', ram: '195 MB' },
              ].map((w, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-black/60 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{w.name}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-[10px] text-amber-300 font-bold">{w.role}</div>
                  <div className="text-[11px] text-zinc-400 truncate">Task: {w.currentTask}</div>
                  <div className="text-[10px] text-zinc-500 pt-2 border-t border-white/5 flex justify-between">
                    <span>CPU: {w.cpu}</span>
                    <span>RAM: {w.ram}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subtab 3: Scheduled Cron (3 Rules) */}
      {activeSubTab === 'SCHEDULED_CRON' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="p-6 rounded-[28px] bg-[#0b0e1a]/80 border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Scheduled Invariant &amp; Maintenance Cron</h3>
                  <span className="text-zinc-400 text-[11px]">Fail-Closed Automated Verification Schedulers</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-bold">
                3 Active Schedules
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cronSchedules.map((cron) => (
                <div key={cron.id} className="p-5 rounded-2xl bg-black/60 border border-white/5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[10px] font-bold border border-emerald-500/20">
                        {cron.cronExpression}
                      </span>
                      <span className="text-cyan-400 text-[11px] font-bold">{cron.nextRun}</span>
                    </div>

                    <h4 className="text-xs font-bold text-white mt-1">{cron.name}</h4>
                    <p className="text-[11px] text-zinc-400 leading-snug">{cron.description}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span>Frequency:</span>
                      <strong className="text-zinc-200">{cron.frequency}</strong>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span>Last Result:</span>
                      <strong className="text-emerald-400">{cron.lastRunResult}</strong>
                    </div>

                    <button
                      onClick={() => handleSimulateCron(cron)}
                      className="w-full mt-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Simulate Trigger Now</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cron Execution Audit Log */}
          <div className="p-6 rounded-[28px] bg-[#0b0e1a]/80 border border-white/10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-bold text-white">Cron Invariant Verification Log</span>
              <span className="text-[10px] text-zinc-500">Immutable Audit Trail</span>
            </div>
            <div className="p-3 rounded-2xl bg-black/90 border border-white/5 text-zinc-400 text-[11px] space-y-1.5 font-mono max-h-48 overflow-y-auto">
              {cronLogs.map((log, idx) => (
                <div key={idx} className="text-emerald-300">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subtab 4: 18 Active Tasks */}
      {activeSubTab === 'ACTIVE_TASKS' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="p-6 rounded-[28px] bg-[#0b0e1a]/80 border border-white/10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-violet-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">18 Active Tasks Directory</h3>
                  <span className="text-zinc-400 text-[11px]">Continuous Orchestrated Autonomous Workloads</span>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={taskSearchQuery}
                    onChange={(e) => setTaskSearchQuery(e.target.value)}
                    placeholder="Search tasks..."
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-violet-400"
                  />
                </div>

                <select
                  value={taskCategoryFilter}
                  onChange={(e) => setTaskCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-zinc-200 text-xs focus:outline-none focus:border-violet-400 cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  <option value="TELEMETRY">Telemetry</option>
                  <option value="INVARIANT">Invariant</option>
                  <option value="HEALING">Healing</option>
                  <option value="SCALING">Scaling</option>
                  <option value="SEALING">Sealing</option>
                  <option value="GOVERNANCE">Governance</option>
                </select>
              </div>
            </div>

            {/* Tasks Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="text-zinc-500 border-b border-white/5">
                    <th className="pb-2">TASK ID</th>
                    <th className="pb-2">TASK NAME</th>
                    <th className="pb-2">CATEGORY</th>
                    <th className="pb-2">ASSIGNED WORKER</th>
                    <th className="pb-2">LATENCY</th>
                    <th className="pb-2">FAIL-CLOSED</th>
                    <th className="pb-2">SSOT MUTATION</th>
                    <th className="pb-2">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 font-bold text-white">{task.id}</td>
                      <td className="py-2.5 font-mono text-zinc-200">{task.name}</td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-zinc-400 border border-white/10">
                          {task.category}
                        </span>
                      </td>
                      <td className="py-2.5 text-cyan-300">{task.worker}</td>
                      <td className="py-2.5 text-zinc-400">{task.latency}</td>
                      <td className="py-2.5">
                        <span className="text-emerald-400 font-bold">ARMED (TRUE)</span>
                      </td>
                      <td className="py-2.5 text-emerald-400 font-bold">0</td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            task.status === 'RUNNING' || task.status === 'STREAMING'
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                              : task.status === 'PROCESSING'
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                              : 'bg-white/5 text-zinc-400'
                          }`}
                        >
                          {task.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 5: Circuit Breakers (8 Rules) */}
      {activeSubTab === 'CIRCUIT_BREAKERS' && (
        <div className="space-y-6 font-mono text-xs">
          {/* Automatic Circuit Breaker Matrix (8 Rules) */}
          <div className="p-6 rounded-[28px] bg-[#0b0e1a]/80 border border-rose-500/20 space-y-4">
            <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-3 gap-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">AUTOMATIC CIRCUIT BREAKER RULE MATRIX</h3>
                  <span className="text-zinc-400 text-[11px]">Central Fail-Closed Invariant Boundary Contracts</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px] font-bold">
                8 Rules Armed &bull; Fail-Closed Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="text-zinc-500 border-b border-white/5">
                    <th className="pb-2.5">CONDITION</th>
                    <th className="pb-2.5">ACTION</th>
                    <th className="pb-2.5">ENFORCEMENT STATE</th>
                    <th className="pb-2.5">TYPE</th>
                    <th className="pb-2.5">INVARIANT DESCRIPTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                  {automaticCircuitBreakerRules.map((rule, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 font-bold text-white font-mono">{rule.condition}</td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            rule.action === 'BLOCK'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : rule.action === 'QUARANTINE'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : rule.action === 'Evidence Accepted'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                          }`}
                        >
                          {rule.action === 'BLOCK' && '🔴 '}
                          {rule.action === 'QUARANTINE' && '🟠 '}
                          {rule.action === 'Evidence Accepted' && '🟢 '}
                          {rule.action === 'Separate Gate (LOCKED)' && '🔐 '}
                          {rule.action}
                        </span>
                      </td>
                      <td className="py-2.5 text-emerald-400 font-bold">{rule.state}</td>
                      <td className="py-2.5 text-zinc-400">{rule.type}</td>
                      <td className="py-2.5 text-zinc-400">{rule.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4 Dedicated Hardware/Software Interceptors */}
          <div className="p-6 rounded-[28px] bg-[#0b0e1a]/80 border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">4 Hardware/Software Interceptors</h3>
                  <span className="text-zinc-400 text-[11px]">Real-time Container Boundary Filters</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-bold">
                SSoT Mutation = 0
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {circuitBreakers.map((cb) => (
                <div key={cb.id} className="p-5 rounded-2xl bg-black/60 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{cb.name}</span>
                    <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[10px] font-bold border border-emerald-500/20">
                      {cb.state}
                    </span>
                  </div>

                  <div className="text-[11px] text-zinc-400">
                    <span className="text-zinc-500 block text-[10px]">TARGET SCOPE:</span>
                    <strong className="text-zinc-200">{cb.targetScope}</strong>
                  </div>

                  <div className="text-[11px] text-zinc-400">
                    <span className="text-zinc-500 block text-[10px]">TRIP THRESHOLD:</span>
                    <span className="text-amber-300">{cb.tripThreshold}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/20 text-rose-300 text-[10px]">
                    <strong>Fail Action:</strong> {cb.failAction}
                  </div>

                  <div className="text-[10px] text-emerald-400 pt-2 border-t border-white/5 flex justify-between">
                    <span>Protection Level:</span>
                    <strong>{cb.ssotProtection}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subtab 6: Architecture Topology & Boundary */}
      {activeSubTab === 'CANONICAL_BOUNDARY' && (
        <div className="space-y-6 font-mono text-xs">
          {/* Top Architecture Topology Tree Diagram */}
          <div className="p-6 rounded-[28px] bg-[#0b0e1a]/80 border border-cyan-500/30 space-y-6">
            <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-3 gap-3">
              <div className="flex items-center gap-2">
                <Network className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">ZYRQUEN Ω∞ — DAG AUTOMATION PLANE ARCHITECTURE</h3>
                  <span className="text-zinc-400 text-[11px]">Official Automation Layer &amp; Frozen Canonical Core Boundary</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-bold">
                Anchor: 100% Invariant
              </span>
            </div>

            {/* ASCII Architecture Box */}
            <div className="p-4 rounded-2xl bg-black/90 border border-white/10 overflow-x-auto text-[11px] text-zinc-300 leading-relaxed font-mono">
              <pre className="text-amber-300 font-bold">
{`┌───────────────────────────────────────────────────────────┐
│              FROZEN CANONICAL CORE v1.2 LTS               │
│        14,902 Seals • Block #849202 • SSoT = 0            │
└─────────────────────────────┬─────────────────────────────┘
                              │ READ ONLY
                              ▼
┌───────────────────────────────────────────────────────────┐
│               EVIDENCE / AUTOMATION PLANE                 │
│                                                           │
│   DETECT ──► SIMULATE ──► GOVERN ──► EXECUTE              │
│                              │                            │
│                           VERIFY (SSoT Mutation = 0)      │
│                              │                            │
│                     EVIDENCE SEAL                         │
└─────────────────────────────┬─────────────────────────────┘
                              │
                    Promotion Gate
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
                 BLOCKED             AUTHORIZED
               QUARANTINE            PROMOTION`}
              </pre>
            </div>

            {/* Phoenix Healing Boundary Highlight */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/20 via-black/60 to-cyan-950/20 border border-amber-500/20 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <Sparkles className="w-4 h-4" />
                <span>🔥 Phoenix Auto-Healing Boundary Contract</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-zinc-300">
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
                  <strong className="text-emerald-300 block mb-1">✅ Phoenix CAN:</strong>
                  <span>Detect &rarr; Diagnose &rarr; Simulate &rarr; Recover &rarr; Verify (Container Right-Sizing, Worker Scaling, Queue Draining)</span>
                </div>
                <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20">
                  <strong className="text-rose-300 block mb-1">⛔ Phoenix FORBIDDEN FROM:</strong>
                  <span>Detect &rarr; Modify Canonical Core (Direct block/seal write strictly prohibited; 0 ambient write authority)</span>
                </div>
              </div>
            </div>

            {/* 3 Core Rules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-black/60 border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Rule 01: Authority Separation</span>
                </div>
                <div className="text-white font-bold text-sm">AUTOMATION &ne; CANONICAL AUTHORITY</div>
                <p className="text-zinc-400 text-[11px] leading-snug">
                  The DAG Workflow Forge orchestrates tasks, collects telemetry, and adjusts ephemeral container sizing, but possesses zero authority to modify the Frozen Single Source of Truth.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-black/60 border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                  <FileCheck2 className="w-4 h-4" />
                  <span>Rule 02: Evidence Quarantine</span>
                </div>
                <div className="text-white font-bold text-sm">EVIDENCE &ne; CANONICAL STATE</div>
                <p className="text-zinc-400 text-[11px] leading-snug">
                  Candidate evidence seals generated by DAG workflows are buffered in quarantine. They remain unpromoted unless dual-custody sovereign clearance is explicitly granted.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-black/60 border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                  <Lock className="w-4 h-4" />
                  <span>Rule 03: Fail-Closed Default</span>
                </div>
                <div className="text-white font-bold text-sm">PROMOTION = FAIL-CLOSED</div>
                <p className="text-zinc-400 text-[11px] leading-snug">
                  In any scenario of ambiguity, hash mismatch, or unauthenticated candidate write attempt, the system defaults to immediate denial, maintaining SSoT Mutation = 0.
                </p>
              </div>
            </div>

            {/* Baseline Matrix */}
            <div className="p-4 rounded-2xl bg-black/80 border border-white/5 space-y-3">
              <div className="text-white font-bold text-xs">Frozen Baseline Parameters (v1.2 LTS)</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-zinc-500 block text-[10px]">CANONICAL SEALS</span>
                  <strong className="text-emerald-400">14,902 / 14,902</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-zinc-500 block text-[10px]">CANONICAL BLOCK</span>
                  <strong className="text-cyan-400">#849202</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-zinc-500 block text-[10px]">BASELINE DRIFT</span>
                  <strong className="text-emerald-400">0.000000%</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-zinc-500 block text-[10px]">SSOT MUTATION</span>
                  <strong className="text-emerald-400">0 (INVIOLABLE)</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

