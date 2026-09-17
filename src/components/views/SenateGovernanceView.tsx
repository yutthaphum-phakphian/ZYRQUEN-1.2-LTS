import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  Scale,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Terminal,
  FileCode,
  Users,
  Vote,
  Sparkles,
  Lock,
  Cpu,
  Fingerprint,
  Layers,
  ChevronRight,
  Copy,
  Check,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  PieChart as PieChartIcon,
  Activity,
  ShieldAlert,
  Flame,
  Zap,
  SlidersHorizontal,
  FileDown,
  FileText,
  FileSpreadsheet,
  Clock,
  X,
  ExternalLink,
  Download,
  Printer,
  Info,
  Compass,
} from 'lucide-react';
import { playTone, playAuditChime, playWarningTone } from '../AudioSynthesizer';
import { copyToClipboard } from '../../utils/clipboard';
import {
  exportSenateAuditCsv,
  exportSenateAuditPdf,
  exportOpaSessionPdf,
  GENERATED_30_DAY_TRENDS,
  DOMAIN_QUORUM_30_DAYS,
  REJECTION_ANALYSIS_30_DAYS,
} from '../../utils/senateGovernanceAuditExport';
import {
  SENATE_GATE_REGO_V121,
  SENATE_GATE_TEST_REGO,
  SENATE_GATE_REGO_V25_OPTIMIZED,
  SENATE_GATE_BENCH_TEST_REGO,
  RUN_CHAOS_BENCHMARKS_SH,
  SENATE_GATE_INTEGRATION_SERVER_SH,
  PROMETHEUS_YML,
  SENATE_GATE_LOGSTASH_CONF,
  SENATE_GATE_GRAFANA_DASHBOARD_JSON,
  RUN_OBSERVABILITY_STACK_SH,
  BENCHMARK_PAYLOAD_SUITE,
  RegoBenchmarkCase,
  RegoBenchmarkInput,
  evaluateSovereignRegoPolicy,
  RegoEvaluationOutput,
} from '../../data/senateRegoPolicy';
import { SenateBenchmarkV5Section } from './SenateBenchmarkV5Section';
import { OpaSequentialGuardPipeline } from './OpaSequentialGuardPipeline';
import { SenateChaosSimulatorPanel } from './SenateChaosSimulatorPanel';
import { SenateGovernanceInsightsSubView } from './SenateGovernanceInsightsSubView';
import { FederatedComplianceAndSwarmAtlas } from '../federated/FederatedComplianceAndSwarmAtlas';

export type VoteDecision = 'AYE' | 'NAY' | 'ABSTAIN';
export type VerificationStatus = 'VERIFIED' | 'SIGNATURE_VALID' | 'PENDING_SIG' | 'ANOMALOUS_SIG';

export interface Senator {
  id: string;
  name: string;
  nodeDid: string;
  role: string;
  domain: string;
  vote: VoteDecision;
  weight: number;
  hsmFipsLevel: number;
  verificationStatus: VerificationStatus;
  signatureAlgorithm: string;
  signatureHash: string;
  latencyMs: number;
  lastVotedAt: string;
}

export interface SenateBill {
  id: string;
  code: string;
  title: string;
  thaiTitle: string;
  summary: string;
  regoPackage: string;
  status: 'PASSED' | 'VOTING' | 'PENDING_RATIFICATION';
  ayes: number;
  nays: number;
  abstains: number;
}

export interface VoteAnomalyInfo {
  senatorId: string;
  hasAnomaly: boolean;
  severity: 'CRITICAL' | 'WARNING' | 'NONE';
  types: ('PATTERN' | 'LATENCY' | 'SIGNATURE')[];
  reasons: string[];
}

/**
 * Anomaly Detection Engine: Analyzes senate votes for pattern deviation from quorum consensus,
 * suspicious latency (>28ms or <2.5ms), or cryptographic/HSM verification defects.
 */
export function detectSenateVoteAnomaly(
  senator: Senator,
  allSenators: Senator[]
): VoteAnomalyInfo {
  const reasons: string[] = [];
  const types: ('PATTERN' | 'LATENCY' | 'SIGNATURE')[] = [];

  const total = allSenators.length;
  const ayes = allSenators.filter((s) => s.vote === 'AYE').length;
  const nays = allSenators.filter((s) => s.vote === 'NAY').length;
  const ayesRatio = ayes / total;
  const naysRatio = nays / total;

  // 1. Quorum Voting Pattern Anomaly (deviation from established consensus)
  if (ayesRatio >= 0.7 && senator.vote !== 'AYE') {
    if (senator.id === 'sen-09') {
      types.push('PATTERN');
      reasons.push(`Attested Dissent: RedTeam adversary stress-test vote against ${Math.round(ayesRatio * 100)}% supermajority`);
    } else {
      types.push('PATTERN');
      reasons.push(`Pattern Deviation: Vote '${senator.vote}' diverges sharply from ${Math.round(ayesRatio * 100)}% chamber supermajority consensus`);
    }
  } else if (naysRatio >= 0.7 && senator.vote !== 'NAY') {
    types.push('PATTERN');
    reasons.push(`Pattern Deviation: Vote '${senator.vote}' contradicts ${Math.round(naysRatio * 100)}% chamber dissent consensus`);
  }

  // 2. Suspicious Latency Anomaly (> 28.0ms or < 2.5ms)
  if (senator.latencyMs > 28.0) {
    types.push('LATENCY');
    reasons.push(`Suspicious High Latency: ${senator.latencyMs}ms exceeds 28.0ms baseline threshold (+${(senator.latencyMs - 12).toFixed(1)}ms delay, possible MITM/network lag)`);
  } else if (senator.latencyMs < 2.5) {
    types.push('LATENCY');
    reasons.push(`Suspicious Fast Latency: ${senator.latencyMs}ms (< 2.5ms threshold, potential pre-computed signature replay)`);
  }

  // 3. Signature & Cryptographic Verification Anomaly
  if (senator.verificationStatus === 'ANOMALOUS_SIG') {
    types.push('SIGNATURE');
    reasons.push(`Cryptographic Alert: Signature verification failed (ANOMALOUS_SIG)`);
  } else if (senator.verificationStatus === 'PENDING_SIG') {
    types.push('SIGNATURE');
    reasons.push(`Cryptographic Alert: Signature attestation still pending`);
  } else if (senator.hsmFipsLevel < 4) {
    types.push('SIGNATURE');
    reasons.push(`HSM Compliance: FIPS 140-3 Level ${senator.hsmFipsLevel} is below mandatory Level 4 requirement`);
  }

  const hasAnomaly = reasons.length > 0;
  let severity: 'CRITICAL' | 'WARNING' | 'NONE' = 'NONE';
  if (hasAnomaly) {
    if (types.includes('SIGNATURE') || senator.latencyMs > 40.0 || types.length >= 2) {
      severity = 'CRITICAL';
    } else {
      severity = 'WARNING';
    }
  }

  return {
    senatorId: senator.id,
    hasAnomaly,
    severity,
    types,
    reasons,
  };
}

const DEFAULT_SENATORS: Senator[] = [
  {
    id: 'sen-01',
    name: 'Thai Sovereign Custodian (#EP-SOVEREIGN-01)',
    nodeDid: 'did:key:z6MkuEP_SOVEREIGN_01_FIPS140_3_HSM',
    role: 'Supreme Presiding Arbiter',
    domain: 'Constitutional & Legal SSoT (ETDA B.E. 2544)',
    vote: 'AYE',
    weight: 2.0,
    hsmFipsLevel: 4,
    verificationStatus: 'VERIFIED',
    signatureAlgorithm: 'ML-DSA-87 (Dilithium-5)',
    signatureHash: '4a8f9b2d1c0e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a',
    latencyMs: 8.4,
    lastVotedAt: '2026-09-12T14:22:01.402Z',
  },
  {
    id: 'sen-02',
    name: 'Senator Kyber-1024',
    nodeDid: 'did:key:z6MkuKYBER_1024_PQC_LATTICE_NODE',
    role: 'PQC Lattice Warden',
    domain: 'Post-Quantum Cryptography & Key Encapsulation',
    vote: 'AYE',
    weight: 1.0,
    hsmFipsLevel: 4,
    verificationStatus: 'VERIFIED',
    signatureAlgorithm: 'ML-KEM-1024 / Falcon-1024',
    signatureHash: '7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c',
    latencyMs: 11.2,
    lastVotedAt: '2026-09-12T14:22:01.415Z',
  },
  {
    id: 'sen-03',
    name: 'Senator Chronos-Block',
    nodeDid: 'did:key:z6MkuCHRONOS_BLOCK_MERKLE_ANCHOR',
    role: 'Block Height Anchor',
    domain: 'Time-Lock & Merkle Lineage Preservation',
    vote: 'AYE',
    weight: 1.0,
    hsmFipsLevel: 4,
    verificationStatus: 'VERIFIED',
    signatureAlgorithm: 'Ed25519-Dilithium Hybrid',
    signatureHash: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    latencyMs: 9.8,
    lastVotedAt: '2026-09-12T14:22:01.420Z',
  },
  {
    id: 'sen-04',
    name: 'Senator ETDA-Lex',
    nodeDid: 'did:key:z6MkuETDA_LEX_STATUTORY_ARBITER',
    role: 'Electronic Transactions Arbiter',
    domain: 'ETDA B.E. 2544 Sections 9, 26, 28 Statutory Rule',
    vote: 'AYE',
    weight: 1.0,
    hsmFipsLevel: 4,
    verificationStatus: 'VERIFIED',
    signatureAlgorithm: 'ML-DSA-87 (FIPS 204)',
    signatureHash: '2c4e6a8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6a8b0d2f4a',
    latencyMs: 14.1,
    lastVotedAt: '2026-09-12T14:22:01.428Z',
  },
  {
    id: 'sen-05',
    name: 'Senator Cryo-Core',
    nodeDid: 'did:key:z6MkuCRYO_CORE_SUB_KELVIN_HARDWARE',
    role: 'Sub-Kelvin Thermal Governor',
    domain: 'Hardware Thermodynamic Limits & Superconductor Bus',
    vote: 'AYE',
    weight: 1.0,
    hsmFipsLevel: 4,
    verificationStatus: 'VERIFIED',
    signatureAlgorithm: 'SPHINCS+ SHA256-256s',
    signatureHash: '5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f',
    latencyMs: 16.5,
    lastVotedAt: '2026-09-12T14:22:01.435Z',
  },
  {
    id: 'sen-06',
    name: 'Senator PDPA-Shield',
    nodeDid: 'did:key:z6MkuPDPA_PRIVACY_ENFORCER_NODE',
    role: 'Privacy & Sovereignty Enforcer',
    domain: 'PDPA B.E. 2562 Data Protection & ZK Shrouding',
    vote: 'AYE',
    weight: 1.0,
    hsmFipsLevel: 4,
    verificationStatus: 'VERIFIED',
    signatureAlgorithm: 'Zero-Knowledge Groth16 + ML-DSA',
    signatureHash: '1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b',
    latencyMs: 10.4,
    lastVotedAt: '2026-09-12T14:22:01.440Z',
  },
  {
    id: 'sen-07',
    name: 'Senator TRNG-Breaker',
    nodeDid: 'did:key:z6MkuTRNG_RULE7_CIRCUIT_BREAKER',
    role: 'Entropy Flow Governor',
    domain: 'Rule-7 Circuit Breaker (15,000 KBps Ceiling)',
    vote: 'AYE',
    weight: 1.0,
    hsmFipsLevel: 4,
    verificationStatus: 'SIGNATURE_VALID',
    signatureAlgorithm: 'NIST Quantum RNG Attested',
    signatureHash: '8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6a8b0d2f4a6c8e0b',
    latencyMs: 12.0,
    lastVotedAt: '2026-09-12T14:22:01.448Z',
  },
  {
    id: 'sen-08',
    name: 'Senator Merkle-Root',
    nodeDid: 'did:key:z6MkuMERKLE_14902_SEALS_CUSTODIAN',
    role: '14,902 Seals Custodian',
    domain: 'Zero Drift Ledger Invariance (SSoT Δ=0.00%)',
    vote: 'AYE',
    weight: 1.0,
    hsmFipsLevel: 4,
    verificationStatus: 'VERIFIED',
    signatureAlgorithm: 'BLAKE3 + Dilithium-5 Root',
    signatureHash: '3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e',
    latencyMs: 7.9,
    lastVotedAt: '2026-09-12T14:22:01.455Z',
  },
  {
    id: 'sen-09',
    name: 'Senator RedTeam-Guard',
    nodeDid: 'did:key:z6MkuREDTEAM_BYZANTINE_GUARDIAN',
    role: 'Adversarial Immune Guardian',
    domain: 'Byzantine Fault Tolerance & Attack Simulation',
    vote: 'NAY',
    weight: 1.0,
    hsmFipsLevel: 4,
    verificationStatus: 'VERIFIED',
    signatureAlgorithm: 'ML-DSA-87 (Attested Dissent)',
    signatureHash: '6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6a8b0d2f4a6c8e0b2d4f6a8c',
    latencyMs: 18.2,
    lastVotedAt: '2026-09-12T14:22:01.462Z',
  },
  {
    id: 'sen-10',
    name: 'Senator Matrix-Omni',
    nodeDid: 'did:key:z6MkuMATRIX_OMNI_CIVILIZATION_ENVOY',
    role: 'Civilization Coordination Envoy',
    domain: 'Autonomous 10M Agent Consensus Gateway',
    vote: 'AYE',
    weight: 1.0,
    hsmFipsLevel: 4,
    verificationStatus: 'VERIFIED',
    signatureAlgorithm: 'Multi-Shard Schnorr-PQC',
    signatureHash: '4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6a8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f',
    latencyMs: 13.7,
    lastVotedAt: '2026-09-12T14:22:01.470Z',
  },
];

const DEFAULT_BILLS: SenateBill[] = [
  {
    id: 'bill-01',
    code: 'SENATE-RES-2026-08',
    title: 'Statutory 15,000 KBps TRNG Entropy Surge Hard Ceiling',
    thaiTitle: 'มติวุฒิสภาว่าด้วยการจำกัดเพดานกระแสเอนโทรปี 15,000 KBps เด็ดขาด',
    summary: 'Strict enforcement of Rule 7 Circuit Breaker matrix. Any entropy flow exceeding 15,000 KBps must be instantly suppressed.',
    regoPackage: 'zyrquen.governance.entropy',
    status: 'PASSED',
    ayes: 10,
    nays: 0,
    abstains: 0,
  },
  {
    id: 'bill-02',
    code: 'SENATE-RES-2026-09',
    title: 'Mandatory ML-DSA-87 and Falcon-1024 Sovereign Ratification',
    thaiTitle: 'การให้สัตยาบันลายเซ็นดิจิทัลควอนตัม ML-DSA-87 และ Falcon-1024',
    summary: 'Binding all 18 Sovereign Chambers to dual-signed PQC cryptographic attestations under ETDA B.E. 2544 Section 26.',
    regoPackage: 'zyrquen.governance.pqc',
    status: 'PASSED',
    ayes: 9,
    nays: 0,
    abstains: 1,
  },
  {
    id: 'bill-03',
    code: 'SENATE-RES-2026-10',
    title: 'Zero-Drift Canonical Core Promotion Gate (SSoT Δ=0.00%)',
    thaiTitle: 'เกตอนุมัติการเลื่อนระดับแกนกลางอธิปไตยภายใต้เงื่อนไขดริฟต์เป็นศูนย์',
    summary: 'Prohibits any state promotion unless Merkle mutation delta is verified to be exactly zero (0.00%).',
    regoPackage: 'zyrquen.governance.promotion',
    status: 'VOTING',
    ayes: 9,
    nays: 1,
    abstains: 0,
  },
];

// Historical voting trends across sessions/epochs
const HISTORICAL_VOTING_TRENDS = [
  { epoch: 'Ep. 849,198', bill: 'RES-04 Dual-Key', ayes: 10, nays: 0, abstains: 0, quorumPct: 100, passRate: 100 },
  { epoch: 'Ep. 849,199', bill: 'RES-05 Rule-7', ayes: 9, nays: 1, abstains: 0, quorumPct: 100, passRate: 90 },
  { epoch: 'Ep. 849,200', bill: 'RES-06 Gas Pool', ayes: 8, nays: 1, abstains: 1, quorumPct: 90, passRate: 80 },
  { epoch: 'Ep. 849,201', bill: 'RES-07 Cryo Limit', ayes: 10, nays: 0, abstains: 0, quorumPct: 100, passRate: 100 },
  { epoch: 'Ep. 849,202', bill: 'RES-08 Entropy Hard', ayes: 10, nays: 0, abstains: 0, quorumPct: 100, passRate: 100 },
  { epoch: 'Ep. 849,203', bill: 'RES-09 ML-DSA Ratify', ayes: 9, nays: 0, abstains: 1, quorumPct: 90, passRate: 90 },
  { epoch: 'Ep. 849,204', bill: 'RES-10 Zero-Drift SSoT', ayes: 9, nays: 1, abstains: 0, quorumPct: 100, passRate: 90 },
];

// Quorum pass rates by statutory domain
const QUORUM_DOMAIN_METRICS = [
  { domain: 'Constitutional SSoT', passRate: 98.5, threshold: 66.7, totalVotes: 142 },
  { domain: 'PQC Cryptography', passRate: 94.2, threshold: 66.7, totalVotes: 118 },
  { domain: 'Circuit Breaker (Rule 7)', passRate: 89.1, threshold: 66.7, totalVotes: 164 },
  { domain: 'FIOS Treasury ($N_c \\times V_c$)', passRate: 91.8, threshold: 66.7, totalVotes: 95 },
  { domain: 'Autonomous Agents (10M)', passRate: 78.4, threshold: 66.7, totalVotes: 230 },
  { domain: 'Sub-Kelvin Thermal Limits', passRate: 97.0, threshold: 66.7, totalVotes: 82 },
];

// Rejection reasons breakdown
const REJECTION_REASONS_METRICS = [
  { reason: 'SSoT Drift Delta > 0.00% (Core Mutation)', code: 'REGO-ERR-01', count: 48, percentage: 38.7, color: '#f43f5e', severity: 'CRITICAL' },
  { reason: 'TRNG Entropy Surge > 15k KBps (Rule 7)', code: 'REGO-ERR-02', count: 32, percentage: 25.8, color: '#f97316', severity: 'HIGH' },
  { reason: 'Quorum Deficit (< 66.7% Supermajority)', code: 'REGO-ERR-03', count: 21, percentage: 16.9, color: '#eab308', severity: 'HIGH' },
  { reason: 'Hardware FIPS Level < 4 Attestation', code: 'REGO-ERR-04', count: 14, percentage: 11.3, color: '#a855f7', severity: 'MEDIUM' },
  { reason: 'Unrecognized Action / Non-Whitelisted Gate', code: 'REGO-ERR-05', count: 9, percentage: 7.3, color: '#38bdf8', severity: 'MEDIUM' },
];

const SAMPLE_REGO_CODE = `package zyrquen.governance.senate

import future.keywords.in

default allow = false

# Rule 1: Multi-Chamber High-Risk Gate
# Requires minimum 3 votes and >= 60% approval ratio
allow {
    input.risk_tier == "LOW"
}

allow {
    input.risk_tier == "MEDIUM"
    input.signature_valid == true
}

allow {
    input.risk_tier == "HIGH"
    input.senate_votes >= 3
    approval_ratio >= 0.60
    input.ssot_drift_delta == 0.0
    input.trng_entropy_kbps <= 15000
    input.fips_140_3_level >= 4
}

approval_ratio := count([v | v := input.votes[_]; v == "APPROVE"]) / count(input.votes)

# Rule 2: Fail-Closed Denial Triggers
deny[msg] {
    input.ssot_drift_delta > 0.0
    msg := sprintf("REGO_SECURITY_ERROR: SSoT drift is %v%%. Zero drift required.", [input.ssot_drift_delta])
}

deny[msg] {
    input.trng_entropy_kbps > 15000
    msg := sprintf("CIRCUIT_BREAKER_TRIGGER: Entropy %v KBps exceeds 15,000 KBps ceiling.", [input.trng_entropy_kbps])
}

deny[msg] {
    input.risk_tier == "HIGH"
    approval_ratio < 0.60
    msg := sprintf("QUORUM_DEFICIT: Received %v%% approval. Minimum 60.0%% required for HIGH risk.", [approval_ratio * 100])
}`;

// Custom Tooltip for Recharts
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-950/95 border border-white/15 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs font-mono text-white space-y-1 z-50">
        <div className="font-bold text-sky-300 pb-1 border-b border-white/10">{label}</div>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-[11px]">
            <span style={{ color: entry.color }} className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-bold text-white font-mono">
              {entry.value}
              {typeof entry.value === 'number' && entry.unit ? entry.unit : ''}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const SenateGovernanceView: React.FC = () => {
  const [senators, setSenators] = useState<Senator[]>(DEFAULT_SENATORS);
  const [bills, setBills] = useState<SenateBill[]>(DEFAULT_BILLS);
  const [selectedBill, setSelectedBill] = useState<SenateBill>(DEFAULT_BILLS[2]);
  const [regoCode, setRegoCode] = useState<string>(SAMPLE_REGO_CODE);

  // Table Sorting & Filtering State
  type SortField = 'name' | 'role' | 'vote' | 'verificationStatus' | 'weight' | 'latencyMs' | 'hsmFipsLevel' | 'anomaly';
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [decisionFilter, setDecisionFilter] = useState<'ALL' | VoteDecision>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | VerificationStatus>('ALL');
  const [anomalyFilter, setAnomalyFilter] = useState<'ALL' | 'ANOMALIES_ONLY' | 'NORMAL_ONLY'>('ALL');

  // Metrics Tab State
  const [metricsTab, setMetricsTab] = useState<'all' | 'trends' | 'quorum' | 'rejections'>('all');

  // Audit Export & Dossier Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [exportToast, setExportToast] = useState<string | null>(null);
  const [dossierTab, setDossierTab] = useState<'trends' | 'quorum' | 'rejections'>('trends');

  // Copy Clipboard State
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // OPA Evaluation Sandbox Inputs
  const [actionInput, setActionInput] = useState<string>('CANONICAL_PROMOTION');
  const [driftInput, setDriftInput] = useState<number>(0.0);
  const [entropyInput, setEntropyInput] = useState<number>(8450);
  const [quorumInput, setQuorumInput] = useState<number>(90.0);
  const [fipsInput, setFipsInput] = useState<number>(4);
  const [riskTierInput, setRiskTierInput] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('HIGH');

  // Active Rego Policy & Benchmark Suite State (v1.2.1-LTS-ADAPTIVE + v2.5-OPTIMIZED)
  const [engineMode, setEngineMode] = useState<'v2.5-OPTIMIZED' | 'v1.2.1-LTS'>('v2.5-OPTIMIZED');
  const [activeRegoTab, setActiveRegoTab] = useState<
    'policy-v25' | 'policy-v121' | 'bench-tests' | 'unit-tests' | 'integration-server' | 'chaos-script' | 'cli'
  >('policy-v25');
  const [selectedBenchmarkId, setSelectedBenchmarkId] = useState<string>('chaos-phantom-citadel');
  const [benchmarkSuiteFilter, setBenchmarkSuiteFilter] = useState<'ALL' | 'CHAOS' | 'BENCHMARK' | 'STRESS_TEST'>('ALL');
  const [payloadJsonText, setPayloadJsonText] = useState<string>(
    JSON.stringify(BENCHMARK_PAYLOAD_SUITE[0].payload, null, 2)
  );
  const [payloadParseError, setPayloadParseError] = useState<string | null>(null);
  const [regoEvalResult, setRegoEvalResult] = useState<RegoEvaluationOutput>(() =>
    evaluateSovereignRegoPolicy(BENCHMARK_PAYLOAD_SUITE[0].payload.input, 'v2.5-OPTIMIZED')
  );
  const [isObservabilityModalOpen, setIsObservabilityModalOpen] = useState<boolean>(false);
  const [observabilityTab, setObservabilityTab] = useState<'grafana' | 'prometheus' | 'logstash' | 'stack-script'>('grafana');
  const [governanceActiveTab, setGovernanceActiveTab] = useState<'ALL' | 'CHAMBER' | 'CHAOS' | 'INSIGHTS' | 'REGO_SANDBOX' | 'BENCHMARK' | 'FEDERATED_SUITE'>('ALL');

  // Evaluation Results
  const [evalResult, setEvalResult] = useState<{
    allowed: boolean;
    decision: 'ALLOW' | 'DENY';
    denialReasons: string[];
    evaluatedAt: string;
    evalDurationMs: number;
  } | null>({
    allowed: true,
    decision: 'ALLOW',
    denialReasons: [],
    evaluatedAt: new Date().toISOString(),
    evalDurationMs: 0.84,
  });

  const handleCopyHash = (text: string, keyId: string) => {
    copyToClipboard(text);
    setCopiedKey(keyId);
    playAuditChime();
    setTimeout(() => {
      setCopiedKey((prev) => (prev === keyId ? null : prev));
    }, 2000);
  };

  // Export OPA Decision Audit Session as Signed PDF
  const handleDownloadOpaPdf = () => {
    try {
      const isAllowed = regoEvalResult.allowed;
      exportOpaSessionPdf({
        decision: isAllowed ? 'ALLOWED' : 'DENIED',
        engineMode: regoEvalResult.engine_mode,
        shortCircuitGuard: regoEvalResult.short_circuit_guard,
        denialReasons: regoEvalResult.denial_reasons,
        latencyUs: regoEvalResult.evaluation_latency_microseconds,
        agentDid: regoEvalResult.agent_did,
        action: regoEvalResult.action,
        riskLevel: 'HIGH',
        guardTraces: regoEvalResult.guard_traces.map((g) => ({
          guard_name: g.guard_name,
          status: g.status,
          latency_us: g.latency_us,
          details: g.details,
        })),
      });
      playAuditChime();
      setExportToast('Official OPA Policy Decision Audit Evidence (Signed PDF) downloaded successfully.');
      setTimeout(() => setExportToast(null), 5000);
    } catch (e) {
      console.error('OPA PDF export failed', e);
      playWarningTone();
    }
  };

  const handleChaosScenarioTriggered = (scenarioId: string, result: RegoEvaluationOutput) => {
    setRegoEvalResult(result);
    setSelectedBenchmarkId(scenarioId);
    if (result.allowed) {
      playAuditChime();
    } else {
      playWarningTone();
    }
    setExportToast(`Chaos Scenario "${scenarioId.toUpperCase()}" executed: ${result.decision}`);
    setTimeout(() => setExportToast(null), 4000);
  };

  // Compute Anomalies Map for all current Senators
  const senatorAnomaliesMap = useMemo(() => {
    const map = new Map<string, VoteAnomalyInfo>();
    senators.forEach((sen) => {
      map.set(sen.id, detectSenateVoteAnomaly(sen, senators));
    });
    return map;
  }, [senators]);

  const anomaliesCount = useMemo(() => {
    let count = 0;
    senatorAnomaliesMap.forEach((anom) => {
      if (anom.hasAnomaly) count++;
    });
    return count;
  }, [senatorAnomaliesMap]);

  // Anomaly Simulation Handlers
  const handleInjectLatencyAnomaly = () => {
    // Pick senator Kyber-1024 (sen-02) and inject a suspicious latency spike of 46.8ms
    setSenators((prev) =>
      prev.map((s) => (s.id === 'sen-02' ? { ...s, latencyMs: 46.8, lastVotedAt: new Date().toISOString() } : s))
    );
    playWarningTone();
  };

  const handleInjectPatternAnomaly = () => {
    // Flip Senator ETDA-Lex (sen-04) to NAY to deviate against 90% quorum consensus
    setSenators((prev) =>
      prev.map((s) => (s.id === 'sen-04' ? { ...s, vote: 'NAY', lastVotedAt: new Date().toISOString() } : s))
    );
    playWarningTone();
  };

  const handleRestoreBaseline = () => {
    setSenators(DEFAULT_SENATORS);
    playAuditChime();
  };

  // 30-Day Audit Data Export Handlers
  const handleDownloadPdf = () => {
    try {
      exportSenateAuditPdf(senators);
      playAuditChime();
      setExportToast('Official 30-Day Senate Governance Audit Report (PDF) downloaded successfully.');
      setTimeout(() => setExportToast(null), 5000);
    } catch (e) {
      console.error('PDF export failed', e);
      playWarningTone();
    }
  };

  const handleDownloadCsv = () => {
    try {
      exportSenateAuditCsv(senators);
      playAuditChime();
      setExportToast('30-Day Senate Governance Audit Dataset (CSV) downloaded successfully.');
      setTimeout(() => setExportToast(null), 5000);
    } catch (e) {
      console.error('CSV export failed', e);
      playWarningTone();
    }
  };

  const handleEvaluateRego = () => {
    const startTime = performance.now();
    const reasons: string[] = [];

    if (actionInput !== 'CANONICAL_PROMOTION') {
      reasons.push(`UNRECOGNIZED_ACTION: Action "${actionInput}" is not authorized for promotion gate.`);
    }
    if (driftInput > 0) {
      reasons.push(`REGO_SECURITY_ERROR: SSoT drift is ${driftInput}%. Zero drift (0.00%) required.`);
    }
    if (entropyInput > 15000) {
      reasons.push(`CIRCUIT_BREAKER_TRIGGER: Entropy flow of ${entropyInput} KBps exceeds statutory 15,000 KBps ceiling.`);
    }
    if (quorumInput < 66.7) {
      reasons.push(`QUORUM_DEFICIT: Current quorum ${quorumInput}% does not satisfy supermajority (66.7%).`);
    }
    if (fipsInput < 4) {
      reasons.push(`HARDWARE_ATTESTATION_FAILURE: FIPS Level ${fipsInput} is below Level 4 requirement.`);
    }

    const isAllowed = reasons.length === 0;
    const duration = Math.round((performance.now() - startTime) * 100) / 100;

    if (isAllowed) {
      playAuditChime();
    } else {
      playWarningTone();
    }

    setEvalResult({
      allowed: isAllowed,
      decision: isAllowed ? 'ALLOW' : 'DENY',
      denialReasons: reasons,
      evaluatedAt: new Date().toISOString(),
      evalDurationMs: Math.max(0.38, duration),
    });
  };

  const handleSelectBenchmark = (bench: RegoBenchmarkCase) => {
    setSelectedBenchmarkId(bench.id);
    const jsonStr = JSON.stringify(bench.payload, null, 2);
    setPayloadJsonText(jsonStr);
    setPayloadParseError(null);
    const res = evaluateSovereignRegoPolicy(bench.payload.input, engineMode);
    setRegoEvalResult(res);
    if (res.allowed) {
      playAuditChime();
    } else {
      playWarningTone();
    }
  };

  const handleEvaluateCustomJson = () => {
    try {
      const parsed = JSON.parse(payloadJsonText);
      const input = (parsed && typeof parsed === 'object' && 'input' in parsed) ? parsed.input : parsed;
      setPayloadParseError(null);
      const res = evaluateSovereignRegoPolicy(input as RegoBenchmarkInput, engineMode);
      setRegoEvalResult(res);
      if (res.allowed) {
        playAuditChime();
      } else {
        playWarningTone();
      }
    } catch (e: any) {
      setPayloadParseError(e.message || 'Malformed JSON syntax');
      playWarningTone();
    }
  };

  const handleResetCurrentBenchmark = () => {
    const cur = BENCHMARK_PAYLOAD_SUITE.find((b) => b.id === selectedBenchmarkId) || BENCHMARK_PAYLOAD_SUITE[0];
    setPayloadJsonText(JSON.stringify(cur.payload, null, 2));
    setPayloadParseError(null);
    const res = evaluateSovereignRegoPolicy(cur.payload.input, engineMode);
    setRegoEvalResult(res);
    playAuditChime();
  };

  const handleSwitchEngineMode = (newMode: 'v2.5-OPTIMIZED' | 'v1.2.1-LTS') => {
    setEngineMode(newMode);
    try {
      const parsed = JSON.parse(payloadJsonText);
      const input = (parsed && typeof parsed === 'object' && 'input' in parsed) ? parsed.input : parsed;
      const res = evaluateSovereignRegoPolicy(input as RegoBenchmarkInput, newMode);
      setRegoEvalResult(res);
      playAuditChime();
    } catch {
      // ignore
    }
  };

  const filteredBenchmarks = useMemo(() => {
    if (benchmarkSuiteFilter === 'ALL') return BENCHMARK_PAYLOAD_SUITE;
    return BENCHMARK_PAYLOAD_SUITE.filter((b) => b.category === benchmarkSuiteFilter);
  }, [benchmarkSuiteFilter]);

  const handleCastVote = (senatorId: string, newVote: VoteDecision) => {
    setSenators((prev) =>
      prev.map((s) => (s.id === senatorId ? { ...s, vote: newVote, lastVotedAt: new Date().toISOString() } : s))
    );
    playTone(newVote === 'AYE' ? 660 : newVote === 'NAY' ? 320 : 440, 0.05);
  };

  const handleBatchVote = (type: 'ALL_AYE' | 'RANDOMIZE' | 'RESET') => {
    if (type === 'ALL_AYE') {
      setSenators((prev) => prev.map((s) => ({ ...s, vote: 'AYE', verificationStatus: 'VERIFIED' })));
      playAuditChime();
    } else if (type === 'RESET') {
      setSenators(DEFAULT_SENATORS);
      playTone(520, 0.05);
    } else if (type === 'RANDOMIZE') {
      const choices: VoteDecision[] = ['AYE', 'AYE', 'AYE', 'NAY', 'ABSTAIN'];
      setSenators((prev) =>
        prev.map((s) => ({
          ...s,
          vote: choices[Math.floor(Math.random() * choices.length)],
        }))
      );
      playTone(480, 0.05);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    playTone(550, 0.02);
  };

  // Filtered & Sorted Senators for Data Table
  const filteredAndSortedSenators = useMemo(() => {
    return [...senators]
      .filter((sen) => {
        const matchesSearch =
          sen.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sen.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sen.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sen.nodeDid.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDecision = decisionFilter === 'ALL' || sen.vote === decisionFilter;
        const matchesStatus = statusFilter === 'ALL' || sen.verificationStatus === statusFilter;
        const anomaly = senatorAnomaliesMap.get(sen.id);
        const matchesAnomaly =
          anomalyFilter === 'ALL' ||
          (anomalyFilter === 'ANOMALIES_ONLY' && (anomaly?.hasAnomaly ?? false)) ||
          (anomalyFilter === 'NORMAL_ONLY' && !(anomaly?.hasAnomaly ?? false));

        return matchesSearch && matchesDecision && matchesStatus && matchesAnomaly;
      })
      .sort((a, b) => {
        if (sortField === 'anomaly') {
          const anomA = senatorAnomaliesMap.get(a.id)?.hasAnomaly ? 1 : 0;
          const anomB = senatorAnomaliesMap.get(b.id)?.hasAnomaly ? 1 : 0;
          return sortOrder === 'asc' ? anomA - anomB : anomB - anomA;
        }

        let valA = a[sortField];
        let valB = b[sortField];

        if (typeof valA === 'string') {
          return sortOrder === 'asc'
            ? (valA as string).localeCompare(valB as string)
            : (valB as string).localeCompare(valA as string);
        }
        if (typeof valA === 'number') {
          return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
        }
        return 0;
      });
  }, [senators, searchQuery, decisionFilter, statusFilter, anomalyFilter, sortField, sortOrder, senatorAnomaliesMap]);

  // Aggregate Quorum Calculations
  const ayesCount = senators.filter((s) => s.vote === 'AYE').length;
  const naysCount = senators.filter((s) => s.vote === 'NAY').length;
  const abstainCount = senators.filter((s) => s.vote === 'ABSTAIN').length;
  const verifiedCount = senators.filter((s) => s.verificationStatus === 'VERIFIED' || s.verificationStatus === 'SIGNATURE_VALID').length;
  const quorumPercentage = Math.round(((ayesCount + naysCount) / senators.length) * 100);
  const approvalRate = Math.round((ayesCount / senators.length) * 100);

  // Dynamic Live Trend Data merging historical epochs with the current live senate session
  const dynamicVotingTrends = useMemo(() => {
    return [
      ...HISTORICAL_VOTING_TRENDS,
      {
        epoch: 'Ep. 849,205 (Live)',
        bill: selectedBill.code,
        ayes: ayesCount,
        nays: naysCount,
        abstains: abstainCount,
        quorumPct: quorumPercentage,
        passRate: approvalRate,
      },
    ];
  }, [ayesCount, naysCount, abstainCount, quorumPercentage, approvalRate, selectedBill]);

  return (
    <div className="space-y-8 pb-20 font-sans">
      {/* Top Banner & Governance Status */}
      <div className="bg-gradient-to-r from-sky-950/40 via-zinc-900/80 to-indigo-950/40 border border-sky-500/30 rounded-3xl p-6 backdrop-blur-2xl shadow-[0_0_40px_rgba(56,189,248,0.12)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-300 shadow-[0_0_25px_rgba(56,189,248,0.3)] shrink-0">
              <Scale className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                  AI Senate Governance & OPA Rego Decision Engine
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm">
                  OPA REGO v0.68+
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                  10/10 NODE QUORUM
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm">
                  10,000,000 AGENTS POOL
                </span>
              </div>
              <p className="text-zinc-400 text-xs sm:text-sm mt-1.5 max-w-4xl leading-relaxed">
                สภาสูงดิจิทัลอธิปไตย (Sovereign Digital Senate) ควบคุมกฎบัตรและตรวจสอบการลงมติด้วยระบบกระจายศูนย์ ผสานเครื่องยนต์ประเมินนโยบาย OPA Rego แบบเรียลไทม์ และบันทึกหลักฐานการลงนามความเร็วสูง (&lt; 50ms)
              </p>
            </div>
          </div>

          {/* KPI Snapshot Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono shrink-0">
            <div className="bg-black/50 border border-white/10 rounded-2xl px-4 py-3">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Senate Tally</div>
              <div className="text-sm font-bold text-sky-300 mt-0.5">
                {ayesCount} AYE / {naysCount} NAY
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">{abstainCount} ABSTAIN</div>
            </div>

            <div className="bg-black/50 border border-white/10 rounded-2xl px-4 py-3">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Approval Rate</div>
              <div className={`text-sm font-bold mt-0.5 ${approvalRate >= 66.7 ? 'text-emerald-300' : 'text-amber-300'}`}>
                {approvalRate}%
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">Threshold: 66.7%</div>
            </div>

            <div className="bg-black/50 border border-white/10 rounded-2xl px-4 py-3">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Attested Sigs</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">
                {verifiedCount} / {senators.length} Verified
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">NIST FIPS 204</div>
            </div>

            <div className="bg-black/50 border border-white/10 rounded-2xl px-4 py-3">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Engine Latency</div>
              <div className="text-sm font-bold text-cyan-300 mt-0.5">
                {evalResult ? `${evalResult.evalDurationMs}ms` : '0.84ms'}
              </div>
              <div className="text-[10px] text-emerald-400 mt-0.5">&lt; 50ms Target ✓</div>
            </div>
          </div>
        </div>

        {/* Audit Documentation Export Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 mt-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-zinc-300 font-mono">
            <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Audit Documentation Dossier (RFC 4180 / NIST SP 800-53 / FIPS 140-3 Compliant)</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
            <button
              type="button"
              onClick={handleDownloadOpaPdf}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer flex items-center gap-2"
              title="Export current OPA decision audit log session as a signed PDF evidence document, incorporating the existing seal metadata"
            >
              <FileDown className="w-3.5 h-3.5 text-emerald-200" />
              <span>Export OPA Decision (Signed PDF)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold transition-all shadow-[0_0_15px_rgba(56,189,248,0.25)] cursor-pointer flex items-center gap-2"
              title="Generate and download official 30-Day Senate Governance Audit Report in PDF"
            >
              <FileDown className="w-3.5 h-3.5 text-sky-200" />
              <span>Export 30-Day PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCsv}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold transition-all cursor-pointer flex items-center gap-2"
              title="Download complete 30-day voting trends and quorum pass rate dataset as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export 30-Day CSV</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsExportModalOpen(true);
                playAuditChime();
              }}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-all cursor-pointer flex items-center gap-1.5"
              title="Preview 30-day voting trends, quorum pass rates, and rejection analysis on screen"
            >
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              <span>View Dossier</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modern Sub-View Navigation Ribbon */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar p-2 bg-slate-900/90 border border-slate-800 rounded-2xl backdrop-blur-md">
        <button
          onClick={() => { setGovernanceActiveTab('ALL'); playAuditChime(); }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
            governanceActiveTab === 'ALL'
              ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Full Suite (All Modules)
        </button>

        <button
          onClick={() => { setGovernanceActiveTab('CHAMBER'); playAuditChime(); }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
            governanceActiveTab === 'CHAMBER'
              ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Scale className="h-3.5 w-3.5" />
          Voting Chamber & Senators
        </button>

        <button
          onClick={() => { setGovernanceActiveTab('CHAOS'); playAuditChime(); }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
            governanceActiveTab === 'CHAOS'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40 ring-1 ring-rose-400'
              : 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/40'
          }`}
        >
          <Flame className="h-3.5 w-3.5 animate-pulse" />
          Chaos Simulator (Stress Test)
        </button>

        <button
          onClick={() => { setGovernanceActiveTab('INSIGHTS'); playAuditChime(); }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
            governanceActiveTab === 'INSIGHTS'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40 ring-1 ring-emerald-400'
              : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 border border-emerald-900/40'
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          Senate Governance Insights (Live OPA Logs)
        </button>

        <button
          onClick={() => { setGovernanceActiveTab('REGO_SANDBOX'); playAuditChime(); }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
            governanceActiveTab === 'REGO_SANDBOX'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          OPA Rego Policy Sandbox
        </button>

        <button
          onClick={() => { setGovernanceActiveTab('BENCHMARK'); playAuditChime(); }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
            governanceActiveTab === 'BENCHMARK'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Zap className="h-3.5 w-3.5" />
          Enterprise Benchmark v5.0 Suite
        </button>

        <button
          onClick={() => { setGovernanceActiveTab('FEDERATED_SUITE'); playAuditChime(); }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
            governanceActiveTab === 'FEDERATED_SUITE'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40 ring-1 ring-cyan-400'
              : 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/40 border border-cyan-900/40'
          }`}
        >
          <Compass className="h-3.5 w-3.5" />
          Federated Compliance & Swarm Recovery Atlas
        </button>
      </div>

      {/* ========================================================================= */}
      {/* FEDERATED COMPLIANCE DASHBOARD & SWARM RECOVERY ATLAS                     */}
      {/* ========================================================================= */}
      {(governanceActiveTab === 'ALL' || governanceActiveTab === 'FEDERATED_SUITE') && (
        <FederatedComplianceAndSwarmAtlas />
      )}

      {/* ========================================================================= */}
      {/* INTERACTIVE CHAOS SIMULATOR PANEL (PHANTOM CITADEL, SPLIT-BRAIN, NULL)    */}
      {/* ========================================================================= */}
      {(governanceActiveTab === 'ALL' || governanceActiveTab === 'CHAOS') && (
        <SenateChaosSimulatorPanel
          onScenarioTriggered={handleChaosScenarioTriggered}
          currentResult={regoEvalResult}
        />
      )}

      {/* ========================================================================= */}
      {/* SENATE GOVERNANCE INSIGHTS SUB-VIEW (REAL-TIME OPA REST API LOGS)         */}
      {/* ========================================================================= */}
      {(governanceActiveTab === 'ALL' || governanceActiveTab === 'INSIGHTS') && (
        <SenateGovernanceInsightsSubView />
      )}

      {/* ========================================================================= */}
      {/* SECTION 1 & 2: SENATE METRICS CHARTS & QUORUM VOTING CHAMBER              */}
      {/* ========================================================================= */}
      {(governanceActiveTab === 'ALL' || governanceActiveTab === 'CHAMBER') && (
        <>
          <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Senate Governance Metrics
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  RECHARTS TELEMETRY
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Visualizing historical and real-time voting trends, statutory quorum pass rates, and OPA Rego policy rejection reasons.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Chart Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/10 font-mono text-xs">
              <button
                type="button"
                onClick={() => {
                  setMetricsTab('all');
                  playTone(500, 0.03);
                }}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  metricsTab === 'all'
                    ? 'bg-sky-500 text-white font-bold shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                All Metrics
              </button>
              <button
                type="button"
                onClick={() => {
                  setMetricsTab('trends');
                  playTone(520, 0.03);
                }}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  metricsTab === 'trends'
                    ? 'bg-sky-500 text-white font-bold shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Voting Trends
              </button>
              <button
                type="button"
                onClick={() => {
                  setMetricsTab('quorum');
                  playTone(540, 0.03);
                }}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  metricsTab === 'quorum'
                    ? 'bg-sky-500 text-white font-bold shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Quorum Pass Rates
              </button>
              <button
                type="button"
                onClick={() => {
                  setMetricsTab('rejections');
                  playTone(560, 0.03);
                }}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  metricsTab === 'rejections'
                    ? 'bg-sky-500 text-white font-bold shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Rejection Reasons
              </button>
            </div>

            {/* Quick Export Button in Chart Header */}
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="px-2.5 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                title="Export 30-Day Audit PDF"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">PDF</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadCsv}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                title="Export 30-Day CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart 1: Voting Trends (AreaChart) */}
          {(metricsTab === 'all' || metricsTab === 'trends') && (
            <div className={`${metricsTab === 'trends' ? 'lg:col-span-12' : 'lg:col-span-7'} bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider font-mono">
                    1. Voting Trends Across Epochs &amp; Live Session
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Ayes (Approval)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Nays (Dissent)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-500" /> Abstain
                  </span>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dynamicVotingTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ayeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="nayGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="abstainGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#71717a" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#71717a" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis
                      dataKey="epoch"
                      tick={{ fill: '#a1a1aa', fontSize: 10, fontFamily: 'monospace' }}
                      tickLine={{ stroke: '#ffffff20' }}
                      axisLine={{ stroke: '#ffffff20' }}
                    />
                    <YAxis
                      tick={{ fill: '#a1a1aa', fontSize: 10, fontFamily: 'monospace' }}
                      domain={[0, 10]}
                      ticks={[0, 2, 4, 6, 8, 10]}
                      tickLine={{ stroke: '#ffffff20' }}
                      axisLine={{ stroke: '#ffffff20' }}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="ayes"
                      name="Ayes (เห็นชอบ)"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#ayeGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="nays"
                      name="Nays (คัดค้าน)"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#nayGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="abstains"
                      name="Abstain (งดออกเสียง)"
                      stroke="#71717a"
                      strokeWidth={1.5}
                      fillOpacity={1}
                      fill="url(#abstainGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-1 border-t border-white/5">
                <span>Total 8 Epochs Monitored</span>
                <span className="text-emerald-400">Live epoch reflects current roll call selections</span>
              </div>
            </div>
          )}

          {/* Chart 2: Quorum Pass Rates by Domain (BarChart) */}
          {(metricsTab === 'all' || metricsTab === 'quorum') && (
            <div className={`${metricsTab === 'quorum' ? 'lg:col-span-12' : 'lg:col-span-5'} bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider font-mono">
                    2. Quorum Pass Rates vs 66.7% Threshold
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Supermajority
                </span>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={QUORUM_DOMAIN_METRICS} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis
                      dataKey="domain"
                      tick={{ fill: '#a1a1aa', fontSize: 9, fontFamily: 'monospace' }}
                      angle={-25}
                      textAnchor="end"
                      interval={0}
                      tickLine={{ stroke: '#ffffff20' }}
                      axisLine={{ stroke: '#ffffff20' }}
                    />
                    <YAxis
                      tick={{ fill: '#a1a1aa', fontSize: 10, fontFamily: 'monospace' }}
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 66.7, 100]}
                      unit="%"
                      tickLine={{ stroke: '#ffffff20' }}
                      axisLine={{ stroke: '#ffffff20' }}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <ReferenceLine
                      y={66.7}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{ value: '66.7% Threshold', fill: '#f59e0b', fontSize: 9, position: 'top', fontFamily: 'monospace' }}
                    />
                    <Bar
                      dataKey="passRate"
                      name="Pass Rate"
                      unit="%"
                      fill="#0284c7"
                      radius={[4, 4, 0, 0]}
                    >
                      {QUORUM_DOMAIN_METRICS.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.passRate >= 90 ? '#10b981' : entry.passRate >= 66.7 ? '#0284c7' : '#f43f5e'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-1 border-t border-white/5">
                <span>All 6 Sovereign Domains Compliant</span>
                <span className="text-sky-300">Min Pass Rate: 78.4%</span>
              </div>
            </div>
          )}

          {/* Chart 3: Rejection Reasons Breakdown (PieChart + Data List) */}
          {(metricsTab === 'all' || metricsTab === 'rejections') && (
            <div className="lg:col-span-12 bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider font-mono">
                    3. OPA Rego Rejection &amp; Denial Reasons Distribution
                  </h3>
                </div>
                <div className="text-xs font-mono text-zinc-400">
                  Total 124 Historical Blocks Analyzed • 100% Fail-Closed Enforcement
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Donut Chart */}
                <div className="md:col-span-5 h-60 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={REJECTION_REASONS_METRICS}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="reason"
                      >
                        {REJECTION_REASONS_METRICS.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#090d16" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Ranked Rejection Reasons Table */}
                <div className="md:col-span-7 space-y-2.5">
                  {REJECTION_REASONS_METRICS.map((item) => (
                    <div
                      key={item.code}
                      className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 flex items-center justify-between gap-3 text-xs font-mono transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-3 h-3 rounded-md shrink-0" style={{ backgroundColor: item.color }} />
                        <div className="truncate">
                          <div className="text-zinc-200 font-medium truncate">{item.reason}</div>
                          <div className="text-[10px] text-zinc-500">{item.code}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: `${item.color}20`, color: item.color, border: `1px solid ${item.color}40` }}>
                          {item.severity}
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-white">{item.count}</span>
                          <span className="text-zinc-400 text-[10px] ml-1">({item.percentage}%)</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: DETAILED BREAKDOWN OF INDIVIDUAL SENATE NODE VOTES (DATA TABLE) */}
      {/* ========================================================================= */}
      <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Senate Node Votes &amp; Attestation Breakdown
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {filteredAndSortedSenators.length} of {senators.length} NODES
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  SORTABLE DATA TABLE
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Detailed ledger of each senate node showing its constitutional role, active decision, cryptographic verification status, and signature hash.
              </p>
            </div>
          </div>

          {/* Quick Consensus Simulation & Export Actions */}
          <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
            <button
              type="button"
              onClick={() => handleBatchVote('ALL_AYE')}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title="Simulate unanimous consensus (10/10 AYE)"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>All AYE</span>
            </button>
            <button
              type="button"
              onClick={() => handleBatchVote('RANDOMIZE')}
              className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title="Simulate random Byzantine distribution"
            >
              <Vote className="w-3.5 h-3.5" />
              <span>Randomize</span>
            </button>
            <button
              type="button"
              onClick={() => handleBatchVote('RESET')}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-all cursor-pointer flex items-center gap-1.5"
              title="Reset to default roll call"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            {/* Direct Export Buttons in Table Header */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title="Export 30-Day Senate Governance Audit Report in PDF"
            >
              <FileDown className="w-3.5 h-3.5 text-sky-400" />
              <span>PDF</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title="Export 30-Day Senate Audit Data in CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Anomaly Detection Status Banner */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            anomaliesCount > 0
              ? 'bg-amber-950/30 border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.15)]'
              : 'bg-emerald-950/20 border-emerald-500/30'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  anomaliesCount > 0
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-white font-mono">
                    {anomaliesCount > 0
                      ? `Active Anomaly Alert: ${anomaliesCount} Senate Vote(s) Flagged`
                      : 'Autonomous Quorum Anomaly Detection Engine: All Clear'}
                  </h4>
                  {anomaliesCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/30 text-amber-200 border border-amber-500/50 animate-pulse">
                      QUORUM MONITOR ACTIVE
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      CANONICAL
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {anomaliesCount > 0
                    ? 'Detected votes deviating from established quorum consensus or exhibiting suspicious latency (> 28.0ms threshold or < 2.5ms).'
                    : 'All 10 custodian nodes comply with canonical voting distribution and maintain sub-20ms PQC attestation latency.'}
                </p>
              </div>
            </div>

            {/* Quick Anomaly Simulation & Filter Controls */}
            <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
              <button
                type="button"
                onClick={handleInjectLatencyAnomaly}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold transition-all cursor-pointer flex items-center gap-1.5"
                title="Simulate a 46.8ms latency surge on Senator Kyber-1024"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Latency Anomaly</span>
              </button>

              <button
                type="button"
                onClick={handleInjectPatternAnomaly}
                className="px-2.5 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 font-bold transition-all cursor-pointer flex items-center gap-1.5"
                title="Simulate an unexpected dissent vote on Senator ETDA-Lex"
              >
                <Vote className="w-3.5 h-3.5 text-purple-400" />
                <span>+ Vote Divergence</span>
              </button>

              <button
                type="button"
                onClick={handleRestoreBaseline}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 font-medium transition-all cursor-pointer flex items-center gap-1.5"
                title="Restore canonical roll call and normal latencies"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Normalize</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs font-mono">
          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Node name, role, domain, or DID..."
              className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          {/* Decision Filter */}
          <div className="md:col-span-3 flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
            <span className="text-[10px] text-zinc-500 px-2">Vote:</span>
            {(['ALL', 'AYE', 'NAY', 'ABSTAIN'] as const).map((dec) => (
              <button
                key={dec}
                type="button"
                onClick={() => {
                  setDecisionFilter(dec);
                  playTone(480, 0.02);
                }}
                className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  decisionFilter === dec
                    ? dec === 'AYE'
                      ? 'bg-emerald-600 text-white'
                      : dec === 'NAY'
                      ? 'bg-rose-600 text-white'
                      : dec === 'ABSTAIN'
                      ? 'bg-zinc-600 text-white'
                      : 'bg-sky-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {dec}
              </button>
            ))}
          </div>

          {/* Verification Status Filter */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                playTone(480, 0.02);
              }}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-zinc-300 focus:outline-none focus:border-sky-500 transition-colors text-xs"
            >
              <option value="ALL">Status: All</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="SIGNATURE_VALID">SIG_VALID</option>
              <option value="PENDING_SIG">PENDING</option>
              <option value="ANOMALOUS_SIG">ANOMALOUS</option>
            </select>
          </div>

          {/* Anomaly Filter */}
          <div className="md:col-span-3 flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
            <span className="text-[10px] text-zinc-500 px-1.5">Anomaly:</span>
            {(['ALL', 'ANOMALIES_ONLY', 'NORMAL_ONLY'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => {
                  setAnomalyFilter(filter);
                  playTone(480, 0.02);
                }}
                className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer truncate ${
                  anomalyFilter === filter
                    ? filter === 'ANOMALIES_ONLY'
                      ? 'bg-amber-600 text-white'
                      : filter === 'NORMAL_ONLY'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-sky-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {filter === 'ALL'
                  ? `All (${senators.length})`
                  : filter === 'ANOMALIES_ONLY'
                  ? `Alerts (${anomaliesCount})`
                  : `Normal (${senators.length - anomaliesCount})`}
              </button>
            ))}
          </div>
        </div>

        {/* Sortable Table */}
        <div className="overflow-x-auto border border-white/10 rounded-2xl bg-black/40">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 bg-[#070a14] text-zinc-400 text-[11px]">
                {/* Node Name */}
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>SENATE NODE &amp; DID</span>
                    {sortField === 'name' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-sky-400" /> : <ArrowDown className="w-3.5 h-3.5 text-sky-400" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-zinc-600" />
                    )}
                  </div>
                </th>

                {/* Role */}
                <th
                  onClick={() => handleSort('role')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>ROLE &amp; JURISDICTION</span>
                    {sortField === 'role' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-sky-400" /> : <ArrowDown className="w-3.5 h-3.5 text-sky-400" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-zinc-600" />
                    )}
                  </div>
                </th>

                {/* Decision */}
                <th
                  onClick={() => handleSort('vote')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>DECISION</span>
                    {sortField === 'vote' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-sky-400" /> : <ArrowDown className="w-3.5 h-3.5 text-sky-400" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-zinc-600" />
                    )}
                  </div>
                </th>

                {/* Verification Status */}
                <th
                  onClick={() => handleSort('verificationStatus')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>VERIFICATION STATUS</span>
                    {sortField === 'verificationStatus' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-sky-400" /> : <ArrowDown className="w-3.5 h-3.5 text-sky-400" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-zinc-600" />
                    )}
                  </div>
                </th>

                {/* Anomaly Alert Column */}
                <th
                  onClick={() => handleSort('anomaly')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>ANOMALY ALERT</span>
                    {sortField === 'anomaly' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-400" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-zinc-600" />
                    )}
                  </div>
                </th>

                {/* Cryptographic Signature Hash */}
                <th className="py-3 px-4">
                  <span>CRYPTOGRAPHIC SIGNATURE HASH</span>
                </th>

                {/* Latency / Weight */}
                <th
                  onClick={() => handleSort('latencyMs')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>LATENCY</span>
                    {sortField === 'latencyMs' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-sky-400" /> : <ArrowDown className="w-3.5 h-3.5 text-sky-400" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-zinc-600" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {filteredAndSortedSenators.map((sen) => {
                const anomaly = senatorAnomaliesMap.get(sen.id);
                const hasAnomaly = anomaly?.hasAnomaly ?? false;
                const isCritical = anomaly?.severity === 'CRITICAL';

                return (
                  <tr
                    key={sen.id}
                    className={`transition-colors group ${
                      hasAnomaly
                        ? isCritical
                          ? 'bg-rose-950/25 hover:bg-rose-950/35 border-l-4 border-l-rose-500 shadow-[inset_0_0_20px_rgba(244,63,94,0.06)]'
                          : 'bg-amber-950/20 hover:bg-amber-950/30 border-l-4 border-l-amber-500 shadow-[inset_0_0_20px_rgba(245,158,11,0.06)]'
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Node Identity */}
                    <td className="py-3 px-4">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-300 font-bold text-[11px] shrink-0 mt-0.5">
                          {sen.id.replace('sen-', '')}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-white flex items-center gap-1.5 flex-wrap">
                            <span>{sen.name}</span>
                            {sen.id === 'sen-01' && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                ARBITER
                              </span>
                            )}
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                              FIPS L{sen.hsmFipsLevel}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-500 truncate flex items-center gap-1 mt-0.5">
                            <span className="truncate max-w-[200px]" title={sen.nodeDid}>{sen.nodeDid}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyHash(sen.nodeDid, `did-${sen.id}`)}
                              className="p-0.5 hover:text-white transition-colors cursor-pointer"
                              title="Copy Node DID"
                            >
                              {copiedKey === `did-${sen.id}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 text-zinc-500" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role & Domain */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-200">{sen.role}</div>
                      <div className="text-[11px] text-zinc-400 font-sans mt-0.5">{sen.domain}</div>
                    </td>

                    {/* Decision (Badge + Interactive Toggle) */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="space-y-1.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono ${
                            sen.vote === 'AYE'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : sen.vote === 'NAY'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${sen.vote === 'AYE' ? 'bg-emerald-400' : sen.vote === 'NAY' ? 'bg-rose-400' : 'bg-zinc-400'}`} />
                          {sen.vote === 'AYE' ? 'AYE (เห็นชอบ)' : sen.vote === 'NAY' ? 'NAY (คัดค้าน)' : 'ABSTAIN'}
                        </span>

                        {/* Quick inline vote buttons */}
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleCastVote(sen.id, 'AYE')}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                              sen.vote === 'AYE' ? 'bg-emerald-600 text-white' : 'bg-white/5 hover:bg-white/10 text-zinc-400'
                            }`}
                          >
                            Aye
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCastVote(sen.id, 'NAY')}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                              sen.vote === 'NAY' ? 'bg-rose-600 text-white' : 'bg-white/5 hover:bg-white/10 text-zinc-400'
                            }`}
                          >
                            Nay
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCastVote(sen.id, 'ABSTAIN')}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                              sen.vote === 'ABSTAIN' ? 'bg-zinc-600 text-white' : 'bg-white/5 hover:bg-white/10 text-zinc-400'
                            }`}
                          >
                            Abs
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Verification Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          {sen.verificationStatus}
                        </span>
                        <div className="text-[10px] text-cyan-400/90 font-mono">
                          {sen.signatureAlgorithm}
                        </div>
                      </div>
                    </td>

                    {/* Anomaly Detection Status & Alert Indicator */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {hasAnomaly && anomaly ? (
                        <div className="space-y-1">
                          <div
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                              isCritical
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)] animate-pulse'
                            }`}
                          >
                            <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${isCritical ? 'text-rose-400' : 'text-amber-400'}`} />
                            <span>ALERT: {anomaly.types.join(' + ')}</span>
                          </div>
                          <div
                            className="text-[10px] text-amber-200/80 font-sans max-w-[200px] truncate"
                            title={anomaly.reasons.join('\n')}
                          >
                            {anomaly.reasons[0]}
                          </div>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>NORMAL</span>
                        </div>
                      )}
                    </td>

                    {/* Cryptographic Signature Hash (with Copy Button!) */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-between gap-2 bg-black/60 px-2.5 py-1.5 rounded-xl border border-white/5 max-w-[280px]">
                        <span className="text-[10px] text-cyan-300 font-mono truncate" title={sen.signatureHash}>
                          {sen.signatureHash.slice(0, 10)}...{sen.signatureHash.slice(-8)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyHash(sen.signatureHash, `sig-${sen.id}`)}
                          className="p-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-white transition-all cursor-pointer shrink-0"
                          title="Copy cryptographic signature hash"
                        >
                          {copiedKey === `sig-${sen.id}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Latency */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {sen.latencyMs > 28.0 ? (
                        <div className="space-y-0.5">
                          <div className="font-bold text-rose-400 text-xs flex items-center justify-end gap-1 animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>{sen.latencyMs}ms</span>
                          </div>
                          <div className="text-[10px] text-rose-400 font-mono">⚠️ Latency Outlier</div>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <div className="font-bold text-white text-xs">{sen.latencyMs}ms</div>
                          <div className="text-[10px] text-emerald-400 font-mono">Weight: {sen.weight.toFixed(1)}x</div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: SOVEREIGN REGO POLICY v1.2.1 LTS & PAYLOAD BENCHMARK SUITE       */}
      {/* ========================================================================= */}
      {(governanceActiveTab === 'ALL' || governanceActiveTab === 'REGO_SANDBOX') && (
        <div className="space-y-6">
          {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-zinc-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-white font-sans tracking-wide">
                  OPA Sovereign Rego Policy &amp; Benchmark Suite
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    engineMode === 'v2.5-OPTIMIZED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                  }`}
                >
                  {engineMode === 'v2.5-OPTIMIZED' ? 'v2.5 SHORT-CIRCUIT (p99 < 1.0ms)' : 'v1.2.1 LTS ADAPTIVE'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-sans mt-0.5">
                Zero-Trust fail-closed gate, sub-millisecond short-circuit pipeline, Dilithium/Kyber PQC validation, and multi-chamber Senate consensus.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
            {/* Engine Mode Toggle */}
            <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => handleSwitchEngineMode('v2.5-OPTIMIZED')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] ${
                  engineMode === 'v2.5-OPTIMIZED'
                    ? 'bg-emerald-600 text-white font-bold shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Cpu className="w-3 h-3" />
                <span>v2.5 Short-Circuit</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchEngineMode('v1.2.1-LTS')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] ${
                  engineMode === 'v1.2.1-LTS'
                    ? 'bg-sky-600 text-white font-bold shadow-[0_0_12px_rgba(56,189,248,0.4)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Scale className="w-3 h-3" />
                <span>v1.2.1 Adaptive</span>
              </button>
            </div>

            {/* Observability Suite Modal Trigger */}
            <button
              type="button"
              onClick={() => {
                setIsObservabilityModalOpen(true);
                playAuditChime();
              }}
              className="px-3 py-1.5 rounded-xl bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/40 text-purple-200 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              <span>Observability Suite</span>
            </button>

            <button
              type="button"
              onClick={() => handleCopyHash('opa test senate_gate.rego senate_gate_test.rego -v', 'cli-test')}
              className="px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedKey === 'cli-test' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Test CLI</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const cur = BENCHMARK_PAYLOAD_SUITE.find((b) => b.id === selectedBenchmarkId) || BENCHMARK_PAYLOAD_SUITE[0];
                handleCopyHash(cur.opaCommand, 'cli-eval');
              }}
              className="px-3 py-1.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-sky-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedKey === 'cli-eval' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5" />}
              <span>Eval CLI</span>
            </button>
          </div>
        </div>

        {/* Benchmark & Stress-Test Suite Selector Bar */}
        <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-5 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span className="font-mono font-bold text-xs text-white uppercase tracking-wider">
                Payload Benchmark &amp; Adversarial Stress-Test Suite
              </span>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-black/50 p-1 rounded-xl border border-white/10 font-mono text-[11px] flex-wrap">
              <button
                type="button"
                onClick={() => setBenchmarkSuiteFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  benchmarkSuiteFilter === 'ALL'
                    ? 'bg-sky-600 text-white font-bold shadow-[0_0_10px_rgba(56,189,248,0.4)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                All Cases ({BENCHMARK_PAYLOAD_SUITE.length})
              </button>
              <button
                type="button"
                onClick={() => setBenchmarkSuiteFilter('CHAOS')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  benchmarkSuiteFilter === 'CHAOS'
                    ? 'bg-purple-600 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                    : 'text-purple-300 hover:text-white'
                }`}
              >
                Multi-Vector Chaos (3)
              </button>
              <button
                type="button"
                onClick={() => setBenchmarkSuiteFilter('BENCHMARK')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  benchmarkSuiteFilter === 'BENCHMARK'
                    ? 'bg-emerald-600 text-white font-bold shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Standard Benchmarks (4)
              </button>
              <button
                type="button"
                onClick={() => setBenchmarkSuiteFilter('STRESS_TEST')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  benchmarkSuiteFilter === 'STRESS_TEST'
                    ? 'bg-rose-600 text-white font-bold shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Adversarial Stress-Tests (5)
              </button>
            </div>
          </div>

          {/* Benchmark Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredBenchmarks.map((bench) => {
              const isSelected = bench.id === selectedBenchmarkId;
              const isStress = bench.category === 'STRESS_TEST';
              const isApproved = bench.expectedDecision === 'ALLOW';

              return (
                <button
                  key={bench.id}
                  type="button"
                  onClick={() => handleSelectBenchmark(bench)}
                  className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between font-mono ${
                    isSelected
                      ? isApproved
                        ? 'bg-sky-950/40 border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.25)] ring-1 ring-sky-400'
                        : 'bg-rose-950/40 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.25)] ring-1 ring-rose-400'
                      : 'bg-black/40 border-white/10 hover:border-white/20 hover:bg-black/60'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                          bench.badgeColor === 'emerald'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : bench.badgeColor === 'amber'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : bench.badgeColor === 'sky'
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                            : bench.badgeColor === 'purple'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : bench.badgeColor === 'orange'
                            ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}
                      >
                        {bench.badge}
                      </span>

                      <span
                        className={`text-[10px] font-bold ${
                          isApproved ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        Expected: {bench.expectedDecision}
                      </span>
                    </div>

                    <div className="font-bold text-white text-xs font-sans mt-1">
                      {bench.name}
                    </div>

                    <p className="text-[11px] text-zinc-400 font-sans line-clamp-2 leading-relaxed">
                      {bench.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-2 mt-2 border-t border-white/5">
                    <span>
                      {bench.category === 'CHAOS'
                        ? '🔥 Multi-Vector Chaos'
                        : isStress
                        ? '⚡ Stress Vector'
                        : '✓ Standard Benchmark'}
                    </span>
                    <span className="text-sky-400 group-hover:translate-x-1 transition-transform">
                      {isSelected ? '● Active' : 'Load Payload →'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2-Column Main Workspace: Rego Policy Viewer (Left) & Sandbox / Execution (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Policy & Test Suite Code Viewer (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-4">
              {/* Tabs */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-1.5 bg-black/50 p-1 rounded-xl border border-white/10 font-mono text-[11px] flex-wrap max-w-full overflow-x-auto custom-scrollbar">
                  <button
                    type="button"
                    onClick={() => setActiveRegoTab('policy-v25')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeRegoTab === 'policy-v25'
                        ? 'bg-emerald-600 text-white font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>senategate.rego (v2.5)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveRegoTab('policy-v121')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeRegoTab === 'policy-v121'
                        ? 'bg-sky-600 text-white font-bold shadow-[0_0_10px_rgba(56,189,248,0.3)]'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>senate_gate.rego (v1.2)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveRegoTab('bench-tests')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeRegoTab === 'bench-tests'
                        ? 'bg-purple-600 text-white font-bold shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>bench_test.rego</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveRegoTab('unit-tests')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeRegoTab === 'unit-tests'
                        ? 'bg-sky-600 text-white font-bold shadow-[0_0_10px_rgba(56,189,248,0.3)]'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>unit_test.rego</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveRegoTab('chaos-script')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeRegoTab === 'chaos-script'
                        ? 'bg-amber-600 text-white font-bold shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>run_chaos.sh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveRegoTab('integration-server')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeRegoTab === 'integration-server'
                        ? 'bg-indigo-600 text-white font-bold shadow-[0_0_10px_rgba(99,102,241,0.3)]'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>server.sh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveRegoTab('cli')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeRegoTab === 'cli'
                        ? 'bg-teal-600 text-white font-bold shadow-[0_0_10px_rgba(20,184,166,0.3)]'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>CLI Guide</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const content =
                      activeRegoTab === 'policy-v25'
                        ? SENATE_GATE_REGO_V25_OPTIMIZED
                        : activeRegoTab === 'policy-v121'
                        ? SENATE_GATE_REGO_V121
                        : activeRegoTab === 'bench-tests'
                        ? SENATE_GATE_BENCH_TEST_REGO
                        : activeRegoTab === 'unit-tests'
                        ? SENATE_GATE_TEST_REGO
                        : activeRegoTab === 'chaos-script'
                        ? RUN_CHAOS_BENCHMARKS_SH
                        : activeRegoTab === 'integration-server'
                        ? SENATE_GATE_INTEGRATION_SERVER_SH
                        : 'opa test senate_gate.rego senate_gate_test.rego -v';
                    handleCopyHash(content, 'rego-tab-copy');
                  }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
                  title="Copy Active Code"
                >
                  {copiedKey === 'rego-tab-copy' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Code Viewer Box */}
              {activeRegoTab === 'policy-v25' && (
                <div className="bg-black/70 rounded-2xl p-4 border border-white/10 font-mono text-xs overflow-x-auto max-h-[580px] custom-scrollbar">
                  <pre className="text-emerald-300 leading-relaxed">
                    <code>{SENATE_GATE_REGO_V25_OPTIMIZED}</code>
                  </pre>
                </div>
              )}

              {activeRegoTab === 'policy-v121' && (
                <div className="bg-black/70 rounded-2xl p-4 border border-white/10 font-mono text-xs overflow-x-auto max-h-[580px] custom-scrollbar">
                  <pre className="text-zinc-300 leading-relaxed">
                    <code>{SENATE_GATE_REGO_V121}</code>
                  </pre>
                </div>
              )}

              {activeRegoTab === 'bench-tests' && (
                <div className="bg-black/70 rounded-2xl p-4 border border-white/10 font-mono text-xs overflow-x-auto max-h-[580px] custom-scrollbar">
                  <pre className="text-purple-300 leading-relaxed">
                    <code>{SENATE_GATE_BENCH_TEST_REGO}</code>
                  </pre>
                </div>
              )}

              {activeRegoTab === 'unit-tests' && (
                <div className="bg-black/70 rounded-2xl p-4 border border-white/10 font-mono text-xs overflow-x-auto max-h-[580px] custom-scrollbar">
                  <pre className="text-zinc-300 leading-relaxed">
                    <code>{SENATE_GATE_TEST_REGO}</code>
                  </pre>
                </div>
              )}

              {activeRegoTab === 'chaos-script' && (
                <div className="bg-black/70 rounded-2xl p-4 border border-white/10 font-mono text-xs overflow-x-auto max-h-[580px] custom-scrollbar">
                  <pre className="text-amber-300 leading-relaxed">
                    <code>{RUN_CHAOS_BENCHMARKS_SH}</code>
                  </pre>
                </div>
              )}

              {activeRegoTab === 'integration-server' && (
                <div className="bg-black/70 rounded-2xl p-4 border border-white/10 font-mono text-xs overflow-x-auto max-h-[580px] custom-scrollbar">
                  <pre className="text-sky-300 leading-relaxed">
                    <code>{SENATE_GATE_INTEGRATION_SERVER_SH}</code>
                  </pre>
                </div>
              )}

              {activeRegoTab === 'cli' && (
                <div className="bg-black/70 rounded-2xl p-5 border border-white/10 font-mono text-xs space-y-4 max-h-[580px] overflow-y-auto custom-scrollbar">
                  <div className="space-y-2">
                    <div className="text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                      1. Run Rego Unit Tests via OPA CLI
                    </div>
                    <div className="bg-zinc-950 p-3 rounded-xl border border-white/10 text-emerald-400 flex items-center justify-between">
                      <code>opa test senate_gate.rego senate_gate_test.rego -v</code>
                      <button
                        type="button"
                        onClick={() => handleCopyHash('opa test senate_gate.rego senate_gate_test.rego -v', 'cli-1')}
                        className="text-zinc-400 hover:text-white p-1"
                      >
                        {copiedKey === 'cli-1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                      2. Evaluate Benchmark Input Payloads
                    </div>
                    <div className="bg-zinc-950 p-3 rounded-xl border border-white/10 text-sky-300 space-y-2">
                      <div className="flex items-center justify-between">
                        <code>opa eval -i payload_low.json -d senate_gate.rego "data.zyrquen.governance.senate.decision_audit_log"</code>
                        <button
                          type="button"
                          onClick={() => handleCopyHash('opa eval -i payload_low.json -d senate_gate.rego "data.zyrquen.governance.senate.decision_audit_log"', 'cli-2')}
                          className="text-zinc-400 hover:text-white p-1"
                        >
                          {copiedKey === 'cli-2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <code>opa eval -i payload_high_approved.json -d senate_gate.rego "data.zyrquen.governance.senate.decision_audit_log"</code>
                        <button
                          type="button"
                          onClick={() => handleCopyHash('opa eval -i payload_high_approved.json -d senate_gate.rego "data.zyrquen.governance.senate.decision_audit_log"', 'cli-3')}
                          className="text-zinc-400 hover:text-white p-1"
                        >
                          {copiedKey === 'cli-3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                      3. Statutory Verification Principles (Zero-Trust)
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-zinc-300 space-y-1.5 font-sans text-xs">
                      <div>• <strong>Default Deny:</strong> Any unmatched conditions immediately resolve to <code>action = "REJECT"</code>.</div>
                      <div>• <strong>Identity &amp; Lifecycle:</strong> Agent must possess valid DID, <code>AUTHORIZED</code> state, and trust score &ge; 80.0.</div>
                      <div>• <strong>Adaptive Budget Scaling:</strong> Token envelope &le; 100,000 and cost &le; Remaining USD &times; (Trust Score / 100).</div>
                      <div>• <strong>Senate Quorum:</strong> High-risk operations mandate &ge; 3 votes, &ge; 60% approvals, and verified PQC cryptographic signatures.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Live Payload Sandbox & Execution Engine (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Payload Editor & Execution Trigger */}
            <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono">
                    OPA Payload Sandbox
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetCurrentBenchmark}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-mono transition-colors cursor-pointer flex items-center gap-1"
                    title="Reset Payload to Default"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyHash(payloadJsonText, 'payload-copy')}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-mono transition-colors cursor-pointer flex items-center gap-1"
                    title="Copy Payload JSON"
                  >
                    {copiedKey === 'payload-copy' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy</span>
                  </button>
                </div>
              </div>

              {/* Editable JSON Payload Textarea */}
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                  <span>input (JSON Payload)</span>
                  <span className="text-emerald-400">Live Interactive Sandbox</span>
                </div>
                <textarea
                  rows={10}
                  value={payloadJsonText}
                  onChange={(e) => {
                    setPayloadJsonText(e.target.value);
                    setPayloadParseError(null);
                  }}
                  className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-zinc-200 font-mono text-xs focus:border-sky-500 focus:outline-none custom-scrollbar leading-relaxed resize-y"
                  placeholder="Paste or edit OPA input JSON here..."
                />
              </div>

              {payloadParseError && (
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 font-mono text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>JSON Parse Error: {payloadParseError}</span>
                </div>
              )}

              {/* Evaluate Button */}
              <button
                type="button"
                onClick={handleEvaluateCustomJson}
                className="w-full py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:via-teal-500 hover:to-sky-500 text-white flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>Execute OPA Sovereign Gate Evaluation (ประเมินนโยบาย)</span>
              </button>

              {/* ================================================================= */}
              {/* OPA DECISION & IMMUTABLE AUDIT LOG OUTPUT                          */}
              {/* ================================================================= */}
              {regoEvalResult && (
                <div className="space-y-4 pt-2">
                  {/* Big Decision Status Banner */}
                  <div
                    className={`p-4 rounded-2xl border font-mono transition-all ${
                      regoEvalResult.allowed
                        ? 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.2)]'
                        : 'bg-rose-950/30 border-rose-500/50 shadow-[0_0_25px_rgba(244,63,94,0.2)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {regoEvalResult.allowed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-rose-400" />
                        )}
                        <span className="text-sm font-bold text-white tracking-wide">
                          DECISION:{' '}
                          <span
                            className={
                              regoEvalResult.allowed ? 'text-emerald-300' : 'text-rose-300'
                            }
                          >
                            {regoEvalResult.decision}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/60 border border-white/10 text-emerald-400">
                          {regoEvalResult.evalDurationUs ?? (regoEvalResult.evalDurationMs * 1000).toFixed(0)} µs
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          ({regoEvalResult.evalDurationMs}ms)
                        </span>
                      </div>
                    </div>

                    {/* Denial Reasons or All Passed Confirmation */}
                    {regoEvalResult.denialReasons.length > 0 ? (
                      <div className="space-y-1.5 border-t border-rose-500/20 pt-2 text-xs text-rose-200">
                        <div className="font-bold text-rose-400 uppercase text-[10px] tracking-wider">
                          Denial Triggers ({regoEvalResult.denialReasons.length}):
                        </div>
                        <ul className="space-y-1 text-[11px]">
                          {regoEvalResult.denialReasons.map((reason, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-rose-400 font-bold">✕</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="border-t border-emerald-500/20 pt-2 text-xs text-emerald-200">
                        ✓ All Sovereign Rego rules satisfied. Supermajority threshold verified, budget within adaptive envelope, and zero-trust policy confirmed.
                      </div>
                    )}
                  </div>

                  {/* Latency & SLA Microsecond Performance Gauge */}
                  <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase font-bold">
                      <span className="flex items-center gap-1.5 text-white">
                        <Activity className="w-3.5 h-3.5 text-sky-400" />
                        <span>Rego Engine Latency &amp; SLA Compliance</span>
                      </span>
                      <span className="text-emerald-400">Target p99 &lt; 1,000 µs (1.0ms)</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div className="p-2 rounded-xl bg-zinc-950/60 border border-white/5">
                        <div className="text-[10px] text-zinc-400">Observed Latency</div>
                        <div className="text-sm font-bold text-emerald-400 mt-0.5">
                          {regoEvalResult.evalDurationUs ?? (regoEvalResult.evalDurationMs * 1000).toFixed(0)} µs
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-zinc-950/60 border border-white/5">
                        <div className="text-[10px] text-zinc-400">p99 Budget Headroom</div>
                        <div className="text-sm font-bold text-sky-400 mt-0.5">
                          {Math.max(
                            0,
                            1000 -
                              (regoEvalResult.evalDurationUs ??
                                Number((regoEvalResult.evalDurationMs * 1000).toFixed(0)))
                          )}{' '}
                          µs Safe
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-zinc-950/60 border border-white/5">
                        <div className="text-[10px] text-zinc-400">Throughput Capacity</div>
                        <div className="text-sm font-bold text-purple-300 mt-0.5">&gt; 5,000 ops/s</div>
                      </div>

                      <div className="p-2 rounded-xl bg-zinc-950/60 border border-white/5">
                        <div className="text-[10px] text-zinc-400">Engine Mode</div>
                        <div className="text-sm font-bold text-white mt-0.5">{engineMode}</div>
                      </div>
                    </div>
                  </div>

                  {/* Interactive & Animated Sequential Short-Circuit Guard Pipeline */}
                  <OpaSequentialGuardPipeline
                    evaluationResult={regoEvalResult}
                    onExportPdf={handleDownloadOpaPdf}
                  />

                  {/* Adaptive Budget Scaling & Quorum Breakdown Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                    {/* Adaptive Budget Card */}
                    <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase font-bold">
                        <span>Adaptive Budget Scaling</span>
                        <span className="text-sky-400">
                          Factor: {regoEvalResult.auditLog.budget_scaling.scaling_factor.toFixed(2)}x
                        </span>
                      </div>

                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Agent Trust Score:</span>
                          <span className="font-bold text-white">
                            {regoEvalResult.auditLog.budget_scaling.trust_score} / 100
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Remaining USD:</span>
                          <span className="text-white">
                            ${regoEvalResult.auditLog.budget_scaling.remaining_usd}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Scaled Budget Ceiling:</span>
                          <span className="font-bold text-emerald-400">
                            ${regoEvalResult.auditLog.budget_scaling.max_allowed_usd}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Requested Amount:</span>
                          <span
                            className={
                              regoEvalResult.auditLog.budget_scaling.requested_usd >
                              regoEvalResult.auditLog.budget_scaling.max_allowed_usd
                                ? 'text-rose-400 font-bold'
                                : 'text-zinc-200'
                            }
                          >
                            ${regoEvalResult.auditLog.budget_scaling.requested_usd}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Requested Tokens:</span>
                          <span
                            className={
                              regoEvalResult.auditLog.budget_scaling.tokens_requested >
                              regoEvalResult.auditLog.budget_scaling.tokens_limit
                                ? 'text-rose-400 font-bold'
                                : 'text-zinc-200'
                            }
                          >
                            {regoEvalResult.auditLog.budget_scaling.tokens_requested.toLocaleString()} / 100k
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Senate Quorum Card */}
                    <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase font-bold">
                        <span>Senate Quorum Matrix</span>
                        <span className="text-sky-400">
                          {regoEvalResult.auditLog.quorum_summary
                            ? `${regoEvalResult.auditLog.quorum_summary.approval_ratio_pct}% Approvals`
                            : 'Bypass (Low/Med)'}
                        </span>
                      </div>

                      {regoEvalResult.auditLog.quorum_summary ? (
                        <div className="space-y-1 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Total Senate Votes:</span>
                            <span className="font-bold text-white">
                              {regoEvalResult.auditLog.quorum_summary.votes_total} (Min: {regoEvalResult.auditLog.quorum_summary.min_votes_required})
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Approvals / Rejections:</span>
                            <span className="text-emerald-300 font-bold">
                              {regoEvalResult.auditLog.quorum_summary.approvals} A / {regoEvalResult.auditLog.quorum_summary.rejections} R
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Statutory Quorum Ratio:</span>
                            <span
                              className={
                                regoEvalResult.auditLog.quorum_summary.approval_ratio_pct >=
                                regoEvalResult.auditLog.quorum_summary.required_ratio_pct
                                  ? 'text-emerald-400 font-bold'
                                  : 'text-rose-400 font-bold'
                              }
                            >
                              {regoEvalResult.auditLog.quorum_summary.approval_ratio_pct}% / {regoEvalResult.auditLog.quorum_summary.required_ratio_pct}% Req
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">PQC Hardware Attestation:</span>
                            <span className="text-cyan-300">FIPS 140-3 L4 ✓</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-zinc-400 py-2">
                          Tier {regoEvalResult.auditLog.risk_level} does not require Senate Quorum ratification. Whitelisted action / capability match applied.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Immutable Audit Log JSON Block */}
                  <div className="bg-black/60 rounded-2xl p-4 border border-white/10 space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] uppercase font-bold">
                        <Lock className="w-3 h-3 text-sky-400" />
                        <span>Immutable Ledger Record: decision_audit_log</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyHash(
                            JSON.stringify(regoEvalResult.auditLog, null, 2),
                            'audit-log-copy'
                          )
                        }
                        className="text-zinc-400 hover:text-white text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'audit-log-copy' ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>Copy Audit Log</span>
                      </button>
                    </div>

                    <pre className="text-sky-300 text-[11px] overflow-x-auto custom-scrollbar leading-relaxed">
                      <code>{JSON.stringify(regoEvalResult.auditLog, null, 2)}</code>
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}

      {/* ========================================================================= */}
      {/* SECTION 4: ENTERPRISE BENCHMARK & MULTI-REGION RESILIENCE SUITE v5.0 LTS  */}
      {/* ========================================================================= */}
      {(governanceActiveTab === 'ALL' || governanceActiveTab === 'BENCHMARK') && (
        <SenateBenchmarkV5Section />
      )}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isExportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#070b16] border border-sky-500/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(56,189,248,0.2)] font-mono text-xs"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-sky-950/40 via-zinc-900 to-indigo-950/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white font-sans">
                        30-Day Senate Governance Audit Dossier
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        NIST SP 800-53
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-sans mt-0.5">
                      Statutory audit report covering 120 legislative cycles, quorum adherence, and post-quantum attestation telemetry.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {/* Metrics 4-Box Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-black/50 border border-white/10 rounded-2xl p-4">
                    <div className="text-[10px] text-zinc-400 uppercase">Evaluated Cycles</div>
                    <div className="text-xl font-bold text-white mt-1">120 Sessions</div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">30-Day Window</div>
                  </div>

                  <div className="bg-black/50 border border-white/10 rounded-2xl p-4">
                    <div className="text-[10px] text-zinc-400 uppercase">Quorum Pass Rate</div>
                    <div className="text-xl font-bold text-emerald-400 mt-1">94.2%</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">113 / 120 Approved</div>
                  </div>

                  <div className="bg-black/50 border border-white/10 rounded-2xl p-4">
                    <div className="text-[10px] text-zinc-400 uppercase">Rejection Events</div>
                    <div className="text-xl font-bold text-rose-400 mt-1">7 Sessions</div>
                    <div className="text-[10px] text-rose-300/80 mt-0.5">5.8% Dissent Rate</div>
                  </div>

                  <div className="bg-black/50 border border-white/10 rounded-2xl p-4">
                    <div className="text-[10px] text-zinc-400 uppercase">Anomalies Trapped</div>
                    <div className="text-xl font-bold text-amber-400 mt-1">9 Vectors</div>
                    <div className="text-[10px] text-amber-300 mt-0.5">100% Quarantined</div>
                  </div>
                </div>

                {/* Rejection Taxonomy Breakdown */}
                <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <h4 className="font-bold text-white uppercase tracking-wider text-xs">
                      Rejection &amp; Policy Veto Taxonomy (Last 30 Days)
                    </h4>
                    <span className="text-[10px] text-zinc-400">Total Vetoes: 9 Instances</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20">
                      <div className="flex justify-between items-center text-xs font-bold text-rose-300">
                        <span>Supermajority Deficit (&lt;66.7%)</span>
                        <span>4 (44.4%)</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-sans mt-1">
                        Failure to attain the 7.0x weighted consensus threshold across custodian nodes.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20">
                      <div className="flex justify-between items-center text-xs font-bold text-amber-300">
                        <span>FIPS 140-3 HSM Attestation</span>
                        <span>2 (22.2%)</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-sans mt-1">
                        Node hardware security module attestation fell below required Level 4 baseline.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20">
                      <div className="flex justify-between items-center text-xs font-bold text-purple-300">
                        <span>PQC Signature Mismatch (ML-DSA)</span>
                        <span>2 (22.2%)</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-sans mt-1">
                        Dilithium-5 / Kyber-1024 quantum-resistant signature packet hash verification failed.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-sky-950/20 border border-sky-500/20">
                      <div className="flex justify-between items-center text-xs font-bold text-sky-300">
                        <span>Latency / Telemetry Outlier (&gt;28ms)</span>
                        <span>1 (11.1%)</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-sans mt-1">
                        Node packet roundtrip violated the sovereign consensus latency boundary.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Historical Log Excerpt */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-zinc-400 text-xs font-bold">
                    <span>REPRESENTATIVE AUDIT TIMELINE SAMPLES</span>
                    <span>STANDARDS: RFC 4180 / ISO 32000-1</span>
                  </div>

                  <div className="overflow-x-auto border border-white/10 rounded-xl bg-black/60">
                    <table className="w-full text-left text-[11px]">
                      <thead className="border-b border-white/10 bg-zinc-900/80 text-zinc-400">
                        <tr>
                          <th className="p-2.5">Date / Epoch</th>
                          <th className="p-2.5">Bill Code</th>
                          <th className="p-2.5">Outcome</th>
                          <th className="p-2.5">Ayes / Nays</th>
                          <th className="p-2.5">Quorum %</th>
                          <th className="p-2.5">Arbiter Attestation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-zinc-300">
                        <tr>
                          <td className="p-2.5 text-sky-400">2026-09-12 (Ep. 849,204)</td>
                          <td className="p-2.5 font-bold text-white">ZQ-FROZEN-8492</td>
                          <td className="p-2.5 text-emerald-400 font-bold">PASSED</td>
                          <td className="p-2.5">9 / 1 (0 Abs)</td>
                          <td className="p-2.5">100% (90.0% Pass)</td>
                          <td className="p-2.5 text-zinc-400">FIPS-L4 Verified ✓</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 text-sky-400">2026-09-11 (Ep. 849,203)</td>
                          <td className="p-2.5 font-bold text-white">SEC-POSTQUANTUM-91</td>
                          <td className="p-2.5 text-emerald-400 font-bold">PASSED</td>
                          <td className="p-2.5">8 / 1 (1 Abs)</td>
                          <td className="p-2.5">90% (80.0% Pass)</td>
                          <td className="p-2.5 text-zinc-400">FIPS-L4 Verified ✓</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 text-sky-400">2026-09-08 (Ep. 849,200)</td>
                          <td className="p-2.5 font-bold text-white">OPA-REGO-SANDBOX-77</td>
                          <td className="p-2.5 text-rose-400 font-bold">REJECTED</td>
                          <td className="p-2.5">5 / 4 (1 Abs)</td>
                          <td className="p-2.5">90% (50.0% Pass)</td>
                          <td className="p-2.5 text-rose-400">Quorum Deficit Veto</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 text-sky-400">2026-09-02 (Ep. 849,194)</td>
                          <td className="p-2.5 font-bold text-white">HSM-HARDEN-FIPS-140-3</td>
                          <td className="p-2.5 text-emerald-400 font-bold">PASSED</td>
                          <td className="p-2.5">10 / 0 (0 Abs)</td>
                          <td className="p-2.5">100% (100% Pass)</td>
                          <td className="p-2.5 text-zinc-400">Unanimous Attestation ✓</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="p-5 border-t border-white/10 bg-[#060912] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-[11px] text-zinc-400">
                  Cryptographic Root Attestation: <span className="text-cyan-300 font-mono">0x4f8e...39bd</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold transition-all shadow-[0_0_15px_rgba(56,189,248,0.3)] cursor-pointer flex items-center gap-2"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Download PDF Dossier</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadCsv}
                    className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold transition-all cursor-pointer flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Download CSV Dataset</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsExportModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* OBSERVABILITY SUITE MODAL (PROMETHEUS / GRAFANA / SIEM LOGSTASH)           */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isObservabilityModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0b0f19] border border-white/20 rounded-3xl w-full max-w-5xl overflow-hidden shadow-[0_0_60px_rgba(56,189,248,0.2)] flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-sky-950/40 via-purple-950/30 to-black">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.3)]">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                      <span>ZYRQUEN Ω∞ Observability &amp; Telemetry Suite</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                        Production Ready
                      </span>
                    </h2>
                    <p className="text-xs text-zinc-400 font-sans">
                      Prometheus Metrics Scraper, Grafana Dashboard JSON, Logstash SIEM Pipeline, &amp; Docker Stack Launcher
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsObservabilityModalOpen(false)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Live Metric KPIs Banner */}
              <div className="bg-black/50 border-b border-white/10 px-6 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="p-2 rounded-xl bg-zinc-950 border border-white/5">
                  <div className="text-[10px] text-zinc-400">p99 Latency (SLA &lt;1ms)</div>
                  <div className="text-sm font-bold text-emerald-400">820 µs (0.82ms)</div>
                </div>
                <div className="p-2 rounded-xl bg-zinc-950 border border-white/5">
                  <div className="text-[10px] text-zinc-400">Allowed Rate (24h)</div>
                  <div className="text-sm font-bold text-sky-300">96.86% (14,892)</div>
                </div>
                <div className="p-2 rounded-xl bg-zinc-950 border border-white/5">
                  <div className="text-[10px] text-zinc-400">Chaos Rejections</div>
                  <div className="text-sm font-bold text-rose-400">482 vectors</div>
                </div>
                <div className="p-2 rounded-xl bg-zinc-950 border border-white/5">
                  <div className="text-[10px] text-zinc-400">PQC Violations</div>
                  <div className="text-sm font-bold text-emerald-300">0 (100% Attested)</div>
                </div>
              </div>

              {/* Tab Selector */}
              <div className="flex items-center gap-2 px-6 pt-4 border-b border-white/10 font-mono text-xs overflow-x-auto custom-scrollbar">
                <button
                  type="button"
                  onClick={() => setObservabilityTab('prometheus')}
                  className={`px-3 py-2 border-b-2 font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    observabilityTab === 'prometheus'
                      ? 'border-sky-400 text-sky-300'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>prometheus.yml</span>
                </button>

                <button
                  type="button"
                  onClick={() => setObservabilityTab('grafana')}
                  className={`px-3 py-2 border-b-2 font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    observabilityTab === 'grafana'
                      ? 'border-purple-400 text-purple-300'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>grafana_dashboard.json</span>
                </button>

                <button
                  type="button"
                  onClick={() => setObservabilityTab('logstash')}
                  className={`px-3 py-2 border-b-2 font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    observabilityTab === 'logstash'
                      ? 'border-amber-400 text-amber-300'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>logstash.conf (SIEM)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setObservabilityTab('stack-script')}
                  className={`px-3 py-2 border-b-2 font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    observabilityTab === 'stack-script'
                      ? 'border-emerald-400 text-emerald-300'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>run_observability_stack.sh</span>
                </button>
              </div>

              {/* Tab Content Box */}
              <div className="p-6 overflow-y-auto flex-1 font-mono text-xs space-y-4 custom-scrollbar">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-[11px]">
                    {observabilityTab === 'prometheus' && 'Prometheus scrape config & alert rules for p99 latency breaches & quorum failures.'}
                    {observabilityTab === 'grafana' && 'Pre-configured Grafana Dashboard JSON with panels for p99, Throughput, and Denial Rates.'}
                    {observabilityTab === 'logstash' && 'Logstash SIEM ingestion pipeline mapping OPA decision logs directly to Elasticsearch / SOC.'}
                    {observabilityTab === 'stack-script' && 'Bash script to launch OPA, Prometheus, Grafana, and Mock SOC Alert Webhook via Docker.'}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      const content =
                        observabilityTab === 'prometheus'
                          ? PROMETHEUS_YML
                          : observabilityTab === 'grafana'
                          ? SENATE_GATE_GRAFANA_DASHBOARD_JSON
                          : observabilityTab === 'logstash'
                          ? SENATE_GATE_LOGSTASH_CONF
                          : RUN_OBSERVABILITY_STACK_SH;
                      handleCopyHash(content, 'observability-copy');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    {copiedKey === 'observability-copy' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>Copy Config</span>
                  </button>
                </div>

                <div className="bg-black/70 rounded-2xl p-4 border border-white/10 overflow-x-auto max-h-[420px] custom-scrollbar">
                  <pre className="text-zinc-200 leading-relaxed text-[11px]">
                    <code>
                      {observabilityTab === 'prometheus' && PROMETHEUS_YML}
                      {observabilityTab === 'grafana' && SENATE_GATE_GRAFANA_DASHBOARD_JSON}
                      {observabilityTab === 'logstash' && SENATE_GATE_LOGSTASH_CONF}
                      {observabilityTab === 'stack-script' && RUN_OBSERVABILITY_STACK_SH}
                    </code>
                  </pre>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-white/10 bg-[#060912] flex items-center justify-between">
                <div className="text-[11px] text-zinc-400 font-mono">
                  Stack Target: <span className="text-sky-400">OPA Engine v0.68+ / Prometheus v2.52+ / Grafana v11</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsObservabilityModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer font-mono text-xs"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {exportToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-md bg-zinc-900/95 border border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.3)] rounded-2xl p-4 backdrop-blur-xl flex items-start gap-3 font-mono text-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white flex items-center gap-2">
                <span>EXPORT VERIFIED</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  RFC 4180 / PDF
                </span>
              </div>
              <p className="text-zinc-300 mt-1 font-sans text-[11px]">{exportToast}</p>
            </div>
            <button
              type="button"
              onClick={() => setExportToast(null)}
              className="text-zinc-500 hover:text-white transition-colors cursor-pointer p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
