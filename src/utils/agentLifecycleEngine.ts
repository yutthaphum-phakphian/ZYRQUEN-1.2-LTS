import { sha256Sync } from './merkleVerificationEngine';

/**
 * 8-State Transition Lifecycle Model for ZYRQUEN Ω∞ FROZEN v1.2 LTS
 * Strict invariant state machine matching official reference specification.
 */
export enum AgentState {
  GENESIS = 'GENESIS',
  IDENTITY_VERIFIED = 'IDENTITY_VERIFIED',
  REGISTERED = 'REGISTERED',
  AUTHORIZED = 'AUTHORIZED',
  ACTIVE_WORKER = 'ACTIVE_WORKER',
  SUSPENDED = 'SUSPENDED',
  REVOKED = 'REVOKED',
  ARCHIVED = 'ARCHIVED',
}

export interface StateMetadata {
  state: AgentState;
  label: string;
  order: number;
  description: string;
  colorHex: string;
  badgeClass: string;
  terminal: boolean;
  securityClearance: string;
}

export const AGENT_STATE_METADATA: Record<AgentState, StateMetadata> = {
  [AgentState.GENESIS]: {
    state: AgentState.GENESIS,
    label: 'Genesis',
    order: 1,
    description: 'Initial cryptographic key generation and entropy attestation in progress.',
    colorHex: '#94a3b8',
    badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    terminal: false,
    securityClearance: 'UNVERIFIED',
  },
  [AgentState.IDENTITY_VERIFIED]: {
    state: AgentState.IDENTITY_VERIFIED,
    label: 'Identity Verified',
    order: 2,
    description: 'DID and PQC Dilithium/ML-DSA-87 signature verified against Root HSM.',
    colorHex: '#38bdf8',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    terminal: false,
    securityClearance: 'TIER-1 PQC-VERIFIED',
  },
  [AgentState.REGISTERED]: {
    state: AgentState.REGISTERED,
    label: 'Registered',
    order: 3,
    description: 'Enrolled in ZYRQUEN Global Registry (capacity 10M identities) with Redis/Postgres anchor.',
    colorHex: '#818cf8',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    terminal: false,
    securityClearance: 'TIER-2 REGISTRY-LOCKED',
  },
  [AgentState.AUTHORIZED]: {
    state: AgentState.AUTHORIZED,
    label: 'Authorized',
    order: 4,
    description: 'Passed OPA Policy Gate v0.62.0 and AI Senate consensus quorum (>60%).',
    colorHex: '#34d399',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    terminal: false,
    securityClearance: 'TIER-3 SENATE-SANCTIONED',
  },
  [AgentState.ACTIVE_WORKER]: {
    state: AgentState.ACTIVE_WORKER,
    label: 'Active Worker',
    order: 5,
    description: 'Executing live warp tasks, mission payloads, and autonomous governance actions.',
    colorHex: '#06b6d4',
    badgeClass: 'bg-cyan-500/20 text-cyan-200 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]',
    terminal: false,
    securityClearance: 'TIER-4 ACTIVE-EXECUTION',
  },
  [AgentState.SUSPENDED]: {
    state: AgentState.SUSPENDED,
    label: 'Suspended',
    order: 6,
    description: 'Temporarily halted due to telemetry drift, policy evaluation, or circuit-breaker flag.',
    colorHex: '#fbbf24',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    terminal: false,
    securityClearance: 'HOLD / ISOLATED',
  },
  [AgentState.REVOKED]: {
    state: AgentState.REVOKED,
    label: 'Revoked',
    order: 7,
    description: 'Cryptographic credentials permanently invalidated by Senate Decree or security event.',
    colorHex: '#f43f5e',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    terminal: false,
    securityClearance: 'INVALIDATED / AIRGAPPED',
  },
  [AgentState.ARCHIVED]: {
    state: AgentState.ARCHIVED,
    label: 'Archived',
    order: 8,
    description: 'Terminal lifecycle state. Preserved in immutable SHA-256 historical cold ledger.',
    colorHex: '#64748b',
    badgeClass: 'bg-zinc-700/30 text-zinc-400 border-zinc-600/40',
    terminal: true,
    securityClearance: 'FROZEN COLD ARCHIVE',
  },
};

/**
 * IdentityStateEngine enforces the 8-State Transition Lifecycle Model
 * Throws an explicit error on any illegal transition attempt.
 */
export class IdentityStateEngine {
  static readonly ALLOWED_TRANSITIONS: Record<AgentState, AgentState[]> = {
    [AgentState.GENESIS]: [AgentState.IDENTITY_VERIFIED],
    [AgentState.IDENTITY_VERIFIED]: [AgentState.REGISTERED],
    [AgentState.REGISTERED]: [AgentState.AUTHORIZED],
    [AgentState.AUTHORIZED]: [AgentState.ACTIVE_WORKER, AgentState.REVOKED],
    [AgentState.ACTIVE_WORKER]: [AgentState.SUSPENDED, AgentState.REVOKED],
    [AgentState.SUSPENDED]: [AgentState.ACTIVE_WORKER, AgentState.REVOKED],
    [AgentState.REVOKED]: [AgentState.ARCHIVED],
    [AgentState.ARCHIVED]: [],
  };

  static getAllowedTransitions(currentState: AgentState): AgentState[] {
    return this.ALLOWED_TRANSITIONS[currentState] || [];
  }

  static canTransition(currentState: AgentState, targetState: AgentState): boolean {
    const allowed = this.ALLOWED_TRANSITIONS[currentState] || [];
    return allowed.includes(targetState);
  }

  static transition(currentState: AgentState, targetState: AgentState): AgentState {
    if (!this.canTransition(currentState, targetState)) {
      throw new Error(`Illegal State Transition: ${currentState} -> ${targetState}`);
    }
    return targetState;
  }
}

/**
 * Deterministic JSON stringification with sorted keys matching Python json.dumps(..., sort_keys=True)
 */
export function canonicalJsonDumpsSortKeys(obj: any): string {
  if (obj === null) return 'null';
  if (typeof obj === 'boolean') return obj ? 'true' : 'false';
  if (typeof obj === 'number') return obj.toString();
  if (typeof obj === 'string') return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalJsonDumpsSortKeys).join(', ') + ']';
  }
  if (typeof obj === 'object') {
    const sortedKeys = Object.keys(obj).sort();
    const pairs = sortedKeys.map((k) => `${JSON.stringify(k)}: ${canonicalJsonDumpsSortKeys(obj[k])}`);
    return '{' + pairs.join(', ') + '}';
  }
  return JSON.stringify(obj);
}

export interface EvidenceBlock {
  block_height: number;
  timestamp: string;
  mission_id: string;
  agent_did: string;
  policy_version: string;
  execution_payload: Record<string, any>;
  previous_block_hash: string;
  current_block_hash: string;
}

/**
 * CryptographicEvidenceLedger implements SHA-256 Immutable Hash Chaining for Audit Trace
 */
export class CryptographicEvidenceLedger {
  previous_hash: string;

  constructor(previous_hash: string = '0'.repeat(64)) {
    this.previous_hash = previous_hash;
  }

  create_block(
    block_height: number,
    mission_id: string,
    agent_did: string,
    policy_version: string,
    execution_payload: Record<string, any>,
    customTimestamp?: string
  ): EvidenceBlock {
    const timestamp = customTimestamp || new Date().toISOString();

    const blockDataWithoutHash: Omit<EvidenceBlock, 'current_block_hash'> = {
      block_height,
      timestamp,
      mission_id,
      agent_did,
      policy_version,
      execution_payload,
      previous_block_hash: this.previous_hash,
    };

    // Calculate SHA-256 Block Hash from canonical sorted keys JSON
    const serialized = canonicalJsonDumpsSortKeys(blockDataWithoutHash);
    const current_block_hash = sha256Sync(serialized);

    const fullBlock: EvidenceBlock = {
      ...blockDataWithoutHash,
      current_block_hash,
    };

    this.previous_hash = current_block_hash; // Advance chain root
    return fullBlock;
  }

  static verifyChain(blocks: EvidenceBlock[]): {
    isValid: boolean;
    brokenBlockHeight?: number;
    error?: string;
  } {
    if (blocks.length === 0) return { isValid: true };

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];

      // Check linkage with previous block
      if (i > 0) {
        const prev = blocks[i - 1];
        if (b.previous_block_hash !== prev.current_block_hash) {
          return {
            isValid: false,
            brokenBlockHeight: b.block_height,
            error: `Hash Chain Discontinuity at height ${b.block_height}: previous_block_hash '${b.previous_block_hash}' does not match block ${prev.block_height}'s hash '${prev.current_block_hash}'`,
          };
        }
      }

      // Recompute and verify current hash
      const checkData: Omit<EvidenceBlock, 'current_block_hash'> = {
        block_height: b.block_height,
        timestamp: b.timestamp,
        mission_id: b.mission_id,
        agent_did: b.agent_did,
        policy_version: b.policy_version,
        execution_payload: b.execution_payload,
        previous_block_hash: b.previous_block_hash,
      };
      const serialized = canonicalJsonDumpsSortKeys(checkData);
      const computedHash = sha256Sync(serialized);

      if (computedHash !== b.current_block_hash) {
        return {
          isValid: false,
          brokenBlockHeight: b.block_height,
          error: `Tampered Hash Digest at height ${b.block_height}: Computed ${computedHash}, expected ${b.current_block_hash}`,
        };
      }
    }

    return { isValid: true };
  }
}

export interface ManagedLifecycleAgent {
  id: string;
  did: string;
  name: string;
  role: string;
  state: AgentState;
  missionId: string;
  policyVersion: string;
  lastTransitionUtc: string;
  history: Array<{
    from: AgentState;
    to: AgentState;
    timestamp: string;
    reason: string;
    blockHash: string;
  }>;
}

export const INITIAL_LIFECYCLE_AGENTS: ManagedLifecycleAgent[] = [
  {
    id: 'ag-sre-007',
    did: 'did:zyrquen:shard-bkk:ag-sre-007',
    name: 'SRE Autonomous Optimizer 007',
    role: 'Infrastructure SRE & Self-Healing',
    state: AgentState.ACTIVE_WORKER,
    missionId: 'MSN-20260913-001',
    policyVersion: 'v1.2.0-LTS-STRICT',
    lastTransitionUtc: '2026-09-13T09:12:00Z',
    history: [
      {
        from: AgentState.GENESIS,
        to: AgentState.IDENTITY_VERIFIED,
        timestamp: '2026-09-13T08:00:00Z',
        reason: 'PQC Dilithium-87 Root Certificate Attestation Passed',
        blockHash: '0x8f4c2198a0de41f23b89012a9e87d4cb310a293847561029384756a0b1c2d3e4',
      },
      {
        from: AgentState.IDENTITY_VERIFIED,
        to: AgentState.REGISTERED,
        timestamp: '2026-09-13T08:15:00Z',
        reason: 'Enrolled in Postgres & Redis shard-bkk Registry cluster',
        blockHash: '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      },
      {
        from: AgentState.REGISTERED,
        to: AgentState.AUTHORIZED,
        timestamp: '2026-09-13T08:30:00Z',
        reason: 'OPA Gate v0.62.0 verified and Senate Quorum 0.85 approved',
        blockHash: '0x7528e18501da86fc4691763a43fa4c68909ab814479844d8a14816bed34cdbb0',
      },
      {
        from: AgentState.AUTHORIZED,
        to: AgentState.ACTIVE_WORKER,
        timestamp: '2026-09-13T09:12:00Z',
        reason: 'Activated for mission MSN-20260913-001 (DB Optimization)',
        blockHash: '0x69e10a9285a730da4869378ddcf25f8ba443f58ca9c3a8e6d64318abe76303eb',
      },
    ],
  },
  {
    id: 'archon-solon',
    did: 'did:zyrquen:shard-bkk:archon-solon',
    name: 'Archon Solon (Legislative Guardian)',
    role: 'ETDA B.E. 2544 & PDPA B.E. 2562 Compliance',
    state: AgentState.AUTHORIZED,
    missionId: 'MSN-20260913-002',
    policyVersion: 'v1.2.0-LTS-STRICT',
    lastTransitionUtc: '2026-09-13T07:45:00Z',
    history: [
      {
        from: AgentState.GENESIS,
        to: AgentState.IDENTITY_VERIFIED,
        timestamp: '2026-09-13T07:00:00Z',
        reason: 'NIST FIPS 204 Lattice Signature Verification',
        blockHash: '0x3a9f182c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a',
      },
      {
        from: AgentState.IDENTITY_VERIFIED,
        to: AgentState.REGISTERED,
        timestamp: '2026-09-13T07:20:00Z',
        reason: 'Registered to Thai Sovereignty Enclave shard-bkk-01',
        blockHash: '0xfed40ab9812401208492023940120fed40ab9812401208492023940120fed40a',
      },
      {
        from: AgentState.REGISTERED,
        to: AgentState.AUTHORIZED,
        timestamp: '2026-09-13T07:45:00Z',
        reason: 'Senate Quorum 100% Granted Sovereign Legislative Clearance',
        blockHash: '0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c',
      },
    ],
  },
  {
    id: 'cryo-telemetry-04',
    did: 'did:zyrquen:shard-bkk:cryo-telemetry-04',
    name: 'Sub-Kelvin Cryo Sensor Array',
    role: '14.98 mK Cryogenic Thermal Stabilization',
    state: AgentState.SUSPENDED,
    missionId: 'MSN-20260913-003',
    policyVersion: 'v1.2.0-LTS-STRICT',
    lastTransitionUtc: '2026-09-13T09:00:00Z',
    history: [
      {
        from: AgentState.ACTIVE_WORKER,
        to: AgentState.SUSPENDED,
        timestamp: '2026-09-13T09:00:00Z',
        reason: 'Circuit-Breaker Tripped: Scheduled sub-kelvin recalibration cycle',
        blockHash: '0x43fa4c68909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a',
      },
    ],
  },
  {
    id: 'pqc-sentinel-09',
    did: 'did:zyrquen:shard-bkk:pqc-sentinel-09',
    name: 'PQC Lattice Sentinel Probe',
    role: 'Quantum Threat & Decryption Interceptor',
    state: AgentState.IDENTITY_VERIFIED,
    missionId: 'MSN-20260913-004',
    policyVersion: 'v1.2.0-LTS-STRICT',
    lastTransitionUtc: '2026-09-13T09:15:00Z',
    history: [
      {
        from: AgentState.GENESIS,
        to: AgentState.IDENTITY_VERIFIED,
        timestamp: '2026-09-13T09:15:00Z',
        reason: 'Initial Kyber/Dilithium identity cryptographic verification',
        blockHash: '0x16bed34cdbb07528e18501da86fc4691763a43fa4c68909ab814479844d8a148',
      },
    ],
  },
  {
    id: 'legacy-deprec-01',
    did: 'did:zyrquen:shard-bkk:legacy-deprec-01',
    name: 'Legacy Pre-FIPS Ingress Filter',
    role: 'Deprecated Ingress Router',
    state: AgentState.ARCHIVED,
    missionId: 'MSN-20260910-099',
    policyVersion: 'v1.1.0-LEGACY',
    lastTransitionUtc: '2026-09-12T18:00:00Z',
    history: [
      {
        from: AgentState.REVOKED,
        to: AgentState.ARCHIVED,
        timestamp: '2026-09-12T18:00:00Z',
        reason: 'Archived permanently following migration to Istio / OPA Policy Gate',
        blockHash: '0x86fc4691763a43fa4c68909ab814479844d8a14816bed34cdbb07528e18501da',
      },
    ],
  },
];

/**
 * Official Python Reference Implementation Code
 */
export const PYTHON_REFERENCE_CODE = `import hashlib
import json
from datetime import datetime, timezone
from enum import Enum
from typing import Dict, Any, Optional

class AgentState(Enum):
    GENESIS = "GENESIS"
    IDENTITY_VERIFIED = "IDENTITY_VERIFIED"
    REGISTERED = "REGISTERED"
    AUTHORIZED = "AUTHORIZED"
    ACTIVE_WORKER = "ACTIVE_WORKER"
    SUSPENDED = "SUSPENDED"
    REVOKED = "REVOKED"
    ARCHIVED = "ARCHIVED"

class IdentityStateEngine:
    """ Enforces the 8-State Transition Lifecycle Model """
    ALLOWED_TRANSITIONS = {
        AgentState.GENESIS: [AgentState.IDENTITY_VERIFIED],
        AgentState.IDENTITY_VERIFIED: [AgentState.REGISTERED],
        AgentState.REGISTERED: [AgentState.AUTHORIZED],
        AgentState.AUTHORIZED: [AgentState.ACTIVE_WORKER, AgentState.REVOKED],
        AgentState.ACTIVE_WORKER: [AgentState.SUSPENDED, AgentState.REVOKED],
        AgentState.SUSPENDED: [AgentState.ACTIVE_WORKER, AgentState.REVOKED],
        AgentState.REVOKED: [AgentState.ARCHIVED],
        AgentState.ARCHIVED: []
    }

    @classmethod
    def transition(cls, current_state: AgentState, target_state: AgentState) -> AgentState:
        if target_state not in cls.ALLOWED_TRANSITIONS.get(current_state, []):
            raise ValueError(f"Illegal State Transition: {current_state.value} -> {target_state.value}")
        return target_state

class CryptographicEvidenceLedger:
    """ Implements SHA-256 Immutable Hash Chaining for Audit Trace """
    def __init__(self, previous_hash: str = "0" * 64):
        self.previous_hash = previous_hash

    def create_block(
        self, 
        block_height: int, 
        mission_id: str, 
        agent_did: str, 
        policy_version: str, 
        execution_payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        
        timestamp = datetime.now(timezone.utc).isoformat()
        
        block_data = {
            "block_height": block_height,
            "timestamp": timestamp,
            "mission_id": mission_id,
            "agent_did": agent_did,
            "policy_version": policy_version,
            "execution_payload": execution_payload,
            "previous_block_hash": self.previous_hash
        }
        
        # Calculate SHA-256 Block Hash
        serialized_data = json.dumps(block_data, sort_keys=True).encode('utf-8')
        current_block_hash = hashlib.sha256(serialized_data).hexdigest()
        
        block_data["current_block_hash"] = current_block_hash
        self.previous_hash = current_block_hash  # Advance chain root
        
        return block_data

# --- Quick Execution Proof ---
if __name__ == "__main__":
    ledger = CryptographicEvidenceLedger()
    
    # 1. State Machine Validation
    current_status = AgentState.GENESIS
    current_status = IdentityStateEngine.transition(current_status, AgentState.IDENTITY_VERIFIED)
    current_status = IdentityStateEngine.transition(current_status, AgentState.REGISTERED)
    print(f"Agent Lifecycle State: {current_status.value}")

    # 2. Block Evidence Minting
    block_1 = ledger.create_block(
        block_height=881293,
        mission_id="MSN-20260913-001",
        agent_did="did:zyrquen:shard-bkk:ag-sre-007",
        policy_version="v1.2.0-LTS-STRICT",
        execution_payload={"intent": "DB Optimization", "action": "INDEX_CREATE", "status": "SUCCESS"}
    )
    print("Minted Block Hash:", block_1["current_block_hash"])
`;

/**
 * Official Helm Chart Values Configuration
 */
export const HELM_VALUES_YAML = `# ZYRQUEN Ω∞ FROZEN v1.2 LTS — Global Values Configuration
global:
  environment: production
  clusterName: zyrquen-shard-bkk-01
  domain: zyrquen.internal
  storageClass: "gp3-encrypted"

# Ingress / API Gateway Configuration
ingress:
  enabled: true
  className: istio
  annotations:
    kubernetes.io/ingress.class: "istio"
    cert-manager.io/cluster-issuer: "zyrquen-ca-issuer"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "64m"
  hosts:
    - host: controlplane.zyrquen.internal
      paths:
        - path: /
          pathType: Prefix

# API Router & Lifecycle Engine Component
apiRouter:
  replicaCount: 3
  image:
    repository: registry.zyrquen.internal/core/api-router
    tag: v1.2.0-LTS
    pullPolicy: IfNotPresent
  resources:
    limits:
      cpu: 2000m
      memory: 4Gi
    requests:
      cpu: 500m
      memory: 1Gi
  env:
    LOG_LEVEL: "INFO"
    REDIS_HOST: "zyrquen-redis-master"
    POSTGRES_HOST: "zyrquen-postgres-primary"
    MAX_REGISTERED_IDENTITIES: "10000000"

# OPA Policy Gate Engine Component
opaPolicyGate:
  replicaCount: 3
  image:
    repository: registry.zyrquen.internal/core/opa-policy-gate
    tag: v0.62.0-zyrquen-lts
    pullPolicy: IfNotPresent
  resources:
    limits:
      cpu: 1000m
      memory: 2Gi
    requests:
      cpu: 250m
      memory: 512Mi

# AI Senate Governance Consensus Coordinator
aiSenate:
  replicaCount: 3
  image:
    repository: registry.zyrquen.internal/core/ai-senate-coordinator
    tag: v1.2.0-LTS
    pullPolicy: IfNotPresent
  resources:
    limits:
      cpu: 4000m
      memory: 8Gi
    requests:
      cpu: 1000m
      memory: 2Gi
  config:
    quorumThreshold: 0.60
    minVotesForConsensus: 3
    executionTimeoutMs: 5000

# Security & Service Account Settings
serviceAccount:
  create: true
  name: zyrquen-control-plane-sa

podSecurityContext:
  runAsNonRoot: true
  runAsUser: 10001
  runAsGroup: 10001
  fsGroup: 10001
  seccompProfile:
    type: RuntimeDefault
`;

/**
 * Official Namespace Manifest
 */
export const K8S_NAMESPACE_YAML = `apiVersion: v1
kind: Namespace
metadata:
  name: zyrquen-system
  labels:
    name: zyrquen-system
    zyrquen.io/tier: control-plane
    pod-security.kubernetes.io/enforce: restricted
`;

/**
 * Official Chart.yaml Manifest
 */
export const HELM_CHART_YAML = `apiVersion: v2
name: zyrquen-control-plane
description: Production-grade Helm chart for ZYRQUEN Ω∞ FROZEN v1.2 LTS Control Plane Ecosystem
type: application
version: 1.2.0
appVersion: "1.2.0-LTS"
keywords:
  - zyrquen
  - ai-governance
  - multi-agent
  - zero-trust
maintainers:
  - name: ZYRQUEN Ω∞ Core Engineering & Civilization Systems Division
    email: architecture@zyrquen.internal
`;

/**
 * Deployment: zyrquen-api-router
 */
export const DEPLOYMENT_API_ROUTER_YAML = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: zyrquen-api-router
  namespace: zyrquen-system
  labels:
    app.kubernetes.io/name: zyrquen-api-router
    app.kubernetes.io/part-of: zyrquen-control-plane
spec:
  replicas: {{ .Values.apiRouter.replicaCount }}
  selector:
    matchLabels:
      app: zyrquen-api-router
  template:
    metadata:
      labels:
        app: zyrquen-api-router
        zyrquen.io/tier: api-gateway
    spec:
      serviceAccountName: {{ .Values.serviceAccount.name }}
      securityContext:
        {{- toYaml .Values.podSecurityContext | nindent 8 }}
      containers:
        - name: api-router
          image: "{{ .Values.apiRouter.image.repository }}:{{ .Values.apiRouter.image.tag }}"
          imagePullPolicy: {{ .Values.apiRouter.image.pullPolicy }}
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL
          ports:
            - containerPort: 8080
              name: http
            - containerPort: 9090
              name: metrics
          env:
            - name: POD_NAMESPACE
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
            {{- range $k, $v := .Values.apiRouter.env }}
            - name: {{ $k }}
              value: {{ $v | quote }}
            {{- end }}
          resources:
            {{- toYaml .Values.apiRouter.resources | nindent 12 }}
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
`;

/**
 * Deployment: zyrquen-opa-policy-gate
 */
export const DEPLOYMENT_OPA_GATE_YAML = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: zyrquen-opa-policy-gate
  namespace: zyrquen-system
  labels:
    app.kubernetes.io/name: zyrquen-opa-policy-gate
    app.kubernetes.io/part-of: zyrquen-control-plane
spec:
  replicas: {{ .Values.opaPolicyGate.replicaCount }}
  selector:
    matchLabels:
      app: zyrquen-opa-policy-gate
  template:
    metadata:
      labels:
        app: zyrquen-opa-policy-gate
        zyrquen.io/tier: policy-engine
    spec:
      serviceAccountName: {{ .Values.serviceAccount.name }}
      securityContext:
        {{- toYaml .Values.podSecurityContext | nindent 8 }}
      containers:
        - name: opa-gate
          image: "{{ .Values.opaPolicyGate.image.repository }}:{{ .Values.opaPolicyGate.image.tag }}"
          imagePullPolicy: {{ .Values.opaPolicyGate.image.pullPolicy }}
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL
          ports:
            - containerPort: 8181
              name: opa-http
          volumeMounts:
            - name: policy-config
              mountPath: /etc/opa/policies
              readOnly: true
          resources:
            {{- toYaml .Values.opaPolicyGate.resources | nindent 12 }}
          livenessProbe:
            httpGet:
              path: /health
              port: 8181
            initialDelaySeconds: 10
            periodSeconds: 10
      volumes:
        - name: policy-config
          configMap:
            name: zyrquen-control-plane-config
`;

/**
 * ConfigMap: zyrquen-control-plane-config
 */
export const CONFIGMAP_CONTROL_PLANE_YAML = `apiVersion: v1
kind: ConfigMap
metadata:
  name: zyrquen-control-plane-config
  namespace: zyrquen-system
  labels:
    app.kubernetes.io/name: zyrquen-control-plane
data:
  zyrquen-config.json: |
    {
      "architecture_version": "v1.2.0-LTS-PROD",
      "capacity_target": 10000000,
      "consensus_engine": "Raft-Senate-Hybrid",
      "crypto_evidence_hashing": "SHA-256-Merkle-Chain",
      "policy_eval_timeout_ms": 50,
      "identity_lookup_sla_ms": 100,
      "shard_identity": "{{ .Values.global.clusterName }}"
    }
  senate-rules.rego: |
    package zyrquen.senate.governance

    default allow = false

    # Standard senate voting verification
    allow {
        input.action_risk_level == "LOW"
        input.identity_verified == true
    }

    allow {
        input.action_risk_level == "HIGH"
        input.senate_approval_count >= 3
        input.cryptographic_sig_valid == true
    }
`;

/**
 * Core Control Plane Services Manifest
 */
export const K8S_SERVICES_YAML = `apiVersion: v1
kind: Service
metadata:
  name: zyrquen-api-router
  namespace: zyrquen-system
  labels:
    app.kubernetes.io/name: zyrquen-api-router
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: 8080
      name: http
    - port: 9090
      targetPort: 9090
      name: metrics
  selector:
    app: zyrquen-api-router
---
apiVersion: v1
kind: Service
metadata:
  name: zyrquen-opa-policy-gate
  namespace: zyrquen-system
  labels:
    app.kubernetes.io/name: zyrquen-opa-policy-gate
spec:
  type: ClusterIP
  ports:
    - port: 8181
      targetPort: 8181
      name: opa-http
  selector:
    app: zyrquen-opa-policy-gate
---
apiVersion: v1
kind: Service
metadata:
  name: zyrquen-ai-senate-coordinator
  namespace: zyrquen-system
  labels:
    app.kubernetes.io/name: zyrquen-ai-senate-coordinator
spec:
  type: ClusterIP
  ports:
    - port: 9000
      targetPort: 9000
      name: grpc
  selector:
    app: zyrquen-ai-senate-coordinator
`;

/**
 * Deployment: zyrquen-ai-senate-coordinator
 */
export const DEPLOYMENT_AI_SENATE_YAML = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: zyrquen-ai-senate-coordinator
  namespace: zyrquen-system
  labels:
    app.kubernetes.io/name: zyrquen-ai-senate-coordinator
    app.kubernetes.io/part-of: zyrquen-control-plane
spec:
  replicas: {{ .Values.aiSenate.replicaCount }}
  selector:
    matchLabels:
      app: zyrquen-ai-senate-coordinator
  template:
    metadata:
      labels:
        app: zyrquen-ai-senate-coordinator
        zyrquen.io/tier: senate-consensus
    spec:
      serviceAccountName: {{ .Values.serviceAccount.name }}
      securityContext:
        {{- toYaml .Values.podSecurityContext | nindent 8 }}
      containers:
        - name: ai-senate
          image: "{{ .Values.aiSenate.image.repository }}:{{ .Values.aiSenate.image.tag }}"
          imagePullPolicy: {{ .Values.aiSenate.image.pullPolicy }}
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL
          ports:
            - containerPort: 9000
              name: senate-grpc
          resources:
            {{- toYaml .Values.aiSenate.resources | nindent 12 }}
`;

/**
 * Ingress: zyrquen-control-plane-ingress
 */
export const INGRESS_CONTROL_PLANE_YAML = `{{- if .Values.ingress.enabled -}}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: zyrquen-control-plane-ingress
  namespace: zyrquen-system
  annotations:
    {{- toYaml .Values.ingress.annotations | nindent 4 }}
spec:
  ingressClassName: {{ .Values.ingress.className }}
  tls:
    - hosts:
        {{- range .Values.ingress.hosts }}
        - {{ .host }}
        {{- end }}
      secretName: zyrquen-tls-cert
  rules:
    {{- range .Values.ingress.hosts }}
    - host: {{ .host }}
      http:
        paths:
          {{- range .paths }}
          - path: {{ .path }}
            pathType: {{ .pathType }}
            backend:
              service:
                name: zyrquen-api-router
                port:
                  number: 80
          {{- end }}
    {{- end }}
{{- end }}
`;

/**
 * HorizontalPodAutoscaler: zyrquen-api-router-hpa
 */
export const HPA_API_ROUTER_YAML = `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: zyrquen-api-router-hpa
  namespace: zyrquen-system
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: zyrquen-api-router
  minReplicas: 3
  maxReplicas: 30
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
`;

/**
 * ServiceAccount: zyrquen-control-plane-sa
 */
export const SERVICE_ACCOUNT_YAML = `apiVersion: v1
kind: ServiceAccount
metadata:
  name: {{ .Values.serviceAccount.name }}
  namespace: zyrquen-system
  labels:
    app.kubernetes.io/name: zyrquen-control-plane
    app.kubernetes.io/component: rbac
`;

/**
 * Extracted Rego rules source code
 */
export const SENATE_RULES_REGO = `package zyrquen.senate.governance

default allow = false

# Standard senate voting verification
allow {
    input.action_risk_level == "LOW"
    input.identity_verified == true
}

allow {
    input.action_risk_level == "HIGH"
    input.senate_approval_count >= 3
    input.cryptographic_sig_valid == true
}
`;

/**
 * Extracted Zyrquen Config JSON
 */
export const ZYRQUEN_CONFIG_JSON = `{
  "architecture_version": "v1.2.0-LTS-PROD",
  "capacity_target": 10000000,
  "consensus_engine": "Raft-Senate-Hybrid",
  "crypto_evidence_hashing": "SHA-256-Merkle-Chain",
  "policy_eval_timeout_ms": 50,
  "identity_lookup_sla_ms": 100,
  "shard_identity": "zyrquen-shard-bkk-01"
}`;

/**
 * Policy Evaluation Types & Simulator matching OPA Rego Engine
 */
export interface PolicyEvaluationInput {
  action_risk_level: 'LOW' | 'HIGH';
  identity_verified: boolean;
  senate_approval_count: number;
  cryptographic_sig_valid: boolean;
}

export interface PolicyEvaluationResult {
  allow: boolean;
  matchedRule: string;
  reason: string;
  evaluationTimeMs: number;
}

export function evaluateSenateRegoPolicy(input: PolicyEvaluationInput): PolicyEvaluationResult {
  const start = performance.now();

  // Rule 1: LOW risk + identity_verified
  if (input.action_risk_level === 'LOW' && input.identity_verified === true) {
    return {
      allow: true,
      matchedRule: 'RULE-01 (Standard Low Risk Evaluation)',
      reason: 'Action risk level is LOW and agent identity has been verified via PQC certificate.',
      evaluationTimeMs: Math.round((performance.now() - start) * 100) / 100,
    };
  }

  // Rule 2: HIGH risk + senate_approval_count >= 3 + cryptographic_sig_valid
  if (
    input.action_risk_level === 'HIGH' &&
    input.senate_approval_count >= 3 &&
    input.cryptographic_sig_valid === true
  ) {
    return {
      allow: true,
      matchedRule: 'RULE-02 (High Risk Senate Quorum Sanction)',
      reason: `High risk mission authorized with ${input.senate_approval_count} Senate approvals and valid cryptographic signature.`,
      evaluationTimeMs: Math.round((performance.now() - start) * 100) / 100,
    };
  }

  // Default: deny (default allow = false)
  return {
    allow: false,
    matchedRule: 'DEFAULT_DENY (default allow = false)',
    reason:
      input.action_risk_level === 'HIGH'
        ? `High-risk action denied: Requires >= 3 senate approvals (current: ${input.senate_approval_count}) and valid cryptographic signature (current: ${input.cryptographic_sig_valid}).`
        : 'Low-risk action denied: Requires identity_verified == true.',
    evaluationTimeMs: Math.round((performance.now() - start) * 100) / 100,
  };
}

