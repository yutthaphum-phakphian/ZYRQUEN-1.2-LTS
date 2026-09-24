export type ViewType =
  | 'dashboard'
  | 'fusion'
  | 'playback'
  | 'civilization'
  | 'studio'
  | 'unified'
  | 'heatmap'
  | 'production'
  | 'council'
  | 'quantum'
  | 'nexus'
  | 'vault'
  | 'ledger'
  | 'pulse'
  | 'forge'
  | 'matrix'
  | 'archive'
  | 'console'
  | 'security'
  | 'settings'
  | 'legal'
  | 'canonical'
  | 'admin'
  | 'analytics'
  | 'chambers'
  | 'audithistory'
  | 'securitypipeline'
  | 'briefing'
  | 'sovereign-wallet'
  | 'sovereign';

export interface AuditStage {
  id: string;
  stageNumber: number;
  name: string;
  shortDesc: string;
  status: 'VERIFIED' | 'PASS' | 'PENDING' | 'BLOCKED';
  timestamp: string;
  durationMs: number;
  stageId: string;
  parentHash: string;
  outputHash: string;
  sourceModule: string;
  actor: string;
  metadata: Record<string, string | number | boolean>;
}

export interface AuditTransaction {
  txId: string;
  title: string;
  createdAt: string;
  overallStatus: string;
  totalLatencyMs: number;
  rootActor: string;
  sealedLedgerBlock: number;
  invariantsPassed: number;
  totalInvariants: number;
  masterHash: string;
  stages: AuditStage[];
}

export interface CanonicalSubModule {
  id: string;
  nameEn: string;
  nameTh: string;
  targetView: ViewType;
  status: 'nominal' | 'active' | 'sync' | 'standby' | 'warning';
  descriptionEn: string;
  descriptionTh: string;
}

export interface CanonicalModule {
  id: string;
  num: string;
  titleEn: string;
  titleTh: string;
  badge: string;
  targetView: ViewType;
  metrics: Array<{
    label: string;
    value: string;
    status: 'nominal' | 'active' | 'sync' | 'standby' | 'warning';
  }>;
  descriptionEn: string;
  descriptionTh: string;
  subModules: CanonicalSubModule[];
}

export interface ThaiCustodian {
  id: string;
  passportNumber: string;
  nameTh: string;
  nameEn: string;
  roleTh: string;
  roleEn: string;
  clearanceLevel: string;
  signedDate: string;
  keyFingerprint: string;
  status: 'ACTIVE' | 'SOVEREIGN' | 'FROZEN' | 'REAL_HSM_SIGNED';
  code?: string;
  hardware?: string;
  algorithm?: string;
  invariantBinding?: string;
}

export interface SystemInvariant {
  id: string;
  code: string;
  name: string;
  description: string;
  layer: string;
  status: 'PASSED' | 'BLOCKED' | 'ENFORCED';
  verificationHash: string;
}

export type EvidenceStatus =
  | 'CANONICAL'
  | 'VERIFIED'
  | 'ACCEPTED_TEST'
  | 'CANDIDATE'
  | 'SIMULATED'
  | 'REFERENCE'
  | 'NOT_IN_EVIDENCE'
  | 'MISMATCH'
  | 'BLOCKED';

export type TelemetrySource =
  | 'LIVE'
  | 'SNAPSHOT'
  | 'SIMULATED'
  | 'REFERENCE'
  | 'UNVERIFIED';

export interface CryptographicBindingProof {
  id: string;
  artifactName: string;
  artifactDigest: string;
  merkleRoot: string;
  blockHeight: number;
  pqcSignature: string;
  signerPassport: string;
  signerName: string;
  status: 'BOUND_VERIFIED' | 'UNBOUND_ORPHAN' | 'MISMATCH_BLOCKED';
  verifiedAt: string;
}

export interface ImmutableAuditEvent {
  id: string;
  sequenceNumber: number;
  timestampIct: string;
  actor: string;
  action: string;
  inputHash: string;
  outputHash: string;
  result: 'SUCCESS' | 'BLOCKED' | 'FAIL_CLOSED' | 'IMMUTABLE_LOGGED';
  proofAnchor: string;
}

export interface PromotionFirewallItem {
  id: string;
  moduleName: string;
  currentStage: 'CANDIDATE' | 'EVIDENCE' | 'VERIFICATION' | 'GOVERNANCE' | 'EXPLICIT_PROMOTION' | 'CANONICAL';
  evidenceScore: number;
  fiosReportAttached: boolean;
  dilithiumVerified: boolean;
  quorumSignedCount: number; // e.g. 4/10, 10/10
  directPromotionBlocked: boolean;
  notes: string;
}

export interface IdentityCollisionProof {
  displayName: string;
  signerId: string;
  credentialId: string;
  publicKeyFingerprint: string;
  signatureVerification: 'VERIFIED' | 'FAILED' | 'PENDING';
  uniquenessVerified: boolean;
  notes?: string;
}

export interface BaselineReconciliationState {
  canonicalMerkleRoot: string;
  canonicalBlock: number;
  canonicalSeals: number;
  runtimeMerkleRoot: string;
  runtimeBlock: number;
  runtimeSeals: number;
  reconciliationStatus: 'HARMONIZED_100' | 'MISMATCH_FAIL_CLOSED';
  readOnlyEnforced: boolean;
  lastReconciliationAt: string;
}

export interface HardwareSnapshot {
  id: string;
  snapshotNumber: number;
  timestampIct: string;
  timestampUtc: string;
  epoch: number;
  cpuAverage: number;
  cpuCores: number[];
  memoryUsedMb: number;
  memoryTotalMb: number;
  cryoTempMk: number;
  heliumFlowPct: number;
  networkRxMbps: number;
  networkTxMbps: number;
  qopsThroughput: number;
  coherencePct: number;
  otelSpansSec: number;
  ssdWearLevelPct?: number;
  voltageStabilityPct?: number;
  SSD_Wear_Level?: number;
  Voltage_Stability?: number;
  bftNodeLatencyMs?: number;
  cognitiveDriftPct?: number;
  reasoningScore?: number;
  atmosphericEntropy?: number;
  entropyDrift?: number;
  'entropy-drift'?: number;
  cpuThermalVariance?: number;
  isDeepFrozen?: boolean;
  parentHash: string;
  sealedHash: string;
  actor: string;
  status: 'SEALED' | 'VERIFIED';
}

export interface DeepFreezePartition {
  partitionId: string;
  blockRangeStart: number;
  blockRangeEnd: number;
  recordsCount: number;
  uncompressedBytes: number;
  compressedBytes: number;
  compressionRatio: number;
  merkleBranchRoot: string;
  frozenAt: string;
  pqcSignature: string;
  coldStorageVault: string;
  isReadOnly: boolean;
}

export interface DeepFreezeArchiveState {
  totalLedgerEntries: number;
  activeHotEntries: number;
  deepFrozenEntries: number;
  thresholdLimit: number;
  isDeepFreezeActive: boolean;
  lastFrozenAt: string | null;
  partitions: DeepFreezePartition[];
  totalBytesSavedMb: number;
}

export interface QuantumContinuumState {
  continuumId: string;
  baseKernel: string;
  governanceFabric: string;
  entropyControl: string;
  seal: string;
  status: 'ACTIVE' | 'SYNCHRONIZED' | 'INITIALIZING';
  synchronizedNodes: string[];
  quorum: string;
  driftTolerance: number;
  activeDimensions: string[];
  latency: string;
  commitHash: string;
  blockId: string;
}

export interface PathProjectionNode {
  id: string;
  stepHorizon: number; // 1 to 5 (T+1 to T+5)
  timeOffsetSeconds: number; // +30s, +60s, +120s, +180s, +240s
  name: string;
  sector: string;
  gateway: string;
  projectedEntropyRateKBps: number;
  thermalVarianceDeltaC: number;
  stabilityIndexPct: number;
  divergenceVector: {
    x: number;
    y: number;
    driftRadius: number;
  };
  confidenceScorePct: number;
  quantumCoherencePct: number;
  invariantPassRate: number; // e.g., 10 (out of 10)
  branchType: 'canonical_anchor' | 'optimal_warp' | 'entropy_surge' | 'quarantine_divergence';
  pqcAttestationSeal: string;
  status: 'STABLE_PROJECTED' | 'HIGH_CONFIDENCE' | 'POTENTIAL_DRIFT' | 'QUARANTINE_BOUND';
}

export interface MultiversePathProjection {
  projectionId: string;
  generatedAt: string;
  telemetrySourceSnapshotsCount: number;
  baseEntropyRateKBps: number;
  entropyTrend: 'decreasing' | 'steady' | 'accelerating';
  lyapunovExponent: number;
  targetTrajectory: string;
  activeHorizonSteps: number;
  nodes: PathProjectionNode[];
  edges: Array<{
    id: string;
    sourceId: string;
    targetId: string;
    weight: number;
    probability: number;
    latencyMs: number;
    branchType: 'canonical_anchor' | 'optimal_warp' | 'entropy_surge' | 'quarantine_divergence';
  }>;
  pqcRootHash: string;
}

export interface MultiverseNavigationState {
  gridId: string;
  continuumRuntime: string;
  omegaCore: string;
  holographicMode: boolean;
  currentSector: string;
  targetGateway: string;
  destination: string;
  warpEngaged: boolean;
  warpLatency: string;
  heartbeat: string;
  qOps: number;
  commitHash: string;
  blockId: string;
  status: 'ONLINE' | 'ENGAGED' | 'STANDBY';
  pathProjection?: MultiversePathProjection;
}

export interface ChamberMetric {
  label: string;
  value: string;
  sublabel?: string;
}

export interface ChamberDetail {
  protocol: string;
  keySpecs: Array<{ label: string; value: string }>;
  telemetry: string;
  authorityCheck: string;
}

export interface Chamber {
  id: string;
  code: string;
  name: string;
  nameTh: string;
  description: string;
  descriptionTh: string;
  category: string;
  status: 'LOCKED' | 'ACTIVE' | 'SEALED' | 'STANDBY' | 'ENFORCED' | 'NOMINAL';
  invariants: string[];
  metrics: ChamberMetric[];
  number?: string;
  emoji?: string;
  tagline?: string;
  details?: ChamberDetail;
}

export interface OperatingModule {
  id: string;
  number: string;
  name: string;
  category: string;
  status: 'NOMINAL' | 'ACTIVE' | 'ENFORCED' | 'SEALED' | 'SOVEREIGN' | 'FROZEN' | 'PRESERVED';
  stat: string;
  detail: string;
}

export interface SatelliteNode {
  code: string;
  location: string;
  locationTh: string;
  coordinates: [number, number];
  latency: string;
  role: 'PRIMARY' | 'RELAY' | 'VAULT' | 'BOUNDARY' | 'GATEWAY' | 'CUSTODIAN';
  securityStandard: string;
  status: 'ONLINE' | 'STANDBY' | 'SYNCING';
}

export interface HSMUnit {
  id: string;
  code: string;
  name: string;
  temperature: string;
  status: 'REAL_HSM_ONLINE' | 'STANDBY' | 'SYNCING';
  keyType: string;
  fipsLevel: string;
}

export interface InvariantRule {
  id: string;
  name: string;
  description: string;
  status: 'ENFORCED' | 'PASSED' | 'ZERO_DRIFT';
  guarantee: string;
}

export interface VerificationPhase {
  id: string;
  name: string;
  domain: string;
  status: 'PASS' | 'PENDING' | 'BLOCKED';
  seals: number;
  coherence: string;
}

export interface TreasuryAsset {
  assetClass: string;
  description: string;
  valuation: string;
  verificationStatus: string;
  allocation: string;
}

export interface LogEntry {
  id: string;
  source: string;
  timestamp: string;
  message: string;
  level?: 'info' | 'warn' | 'error' | 'success';
}

// ======================================================================
// TERMINAL STATE MACHINE TYPES (UPLOAD & SEND LIFECYCLE)
// ======================================================================

export type JobTerminalState = 'UPLOADED' | 'COMPLETED' | 'TERMINAL_BLOCKED' | 'TERMINAL_REJECTED';
export type JobActiveState = 'IDLE' | 'PENDING' | 'QUEUED' | 'UPLOADING' | 'SENDING' | 'IN_PROGRESS';
export type JobErrorState = 'FAILED' | 'RETRY_EXHAUSTED';
export type JobLifecycleState = JobActiveState | JobTerminalState | JobErrorState;

export type JobType =
  | 'EVIDENCE_UPLOAD'
  | 'TELEMETRY_DISPATCH'
  | 'SIEM_WEBHOOK_SEND'
  | 'AUDIT_SEAL_EXPORT'
  | 'ATTESTATION_INTAKE'
  | 'BACKUP_SNAPSHOT'
  | 'PIPELINE_EXECUTION'
  | 'CUSTOM_JOB';

export interface JobLifecycleRecord {
  jobId: string;
  jobType: JobType;
  state: JobLifecycleState;
  isTerminal: boolean;
  idempotencyKey: string;
  payloadHash: string;
  actor: string;
  createdAt: string;
  updatedAt: string;
  terminalTimestamp?: string;
  retryCount: number;
  maxRetries: number;
  locked: boolean;
  responsePayload?: any;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export function isJobTerminalState(state: JobLifecycleState): boolean {
  return state === 'UPLOADED' || state === 'COMPLETED' || state === 'TERMINAL_BLOCKED' || state === 'TERMINAL_REJECTED';
}

export type { SystemEvent } from './components/SystemEventsSidebar';

