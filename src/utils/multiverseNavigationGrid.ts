import { MultiverseNavigationState, MultiversePathProjection, PathProjectionNode, HardwareSnapshot } from '../types';
import { generateSha256Hash, INITIAL_HARDWARE_SNAPSHOTS } from './telemetrySnapshot';

export interface NavigationGridConfig {
  gridId: string;
  continuumRuntime: string;
  omegaCore: string;
  holographicMode: boolean;
}

export interface CoordinatesConfig {
  currentSector: string;
  targetGateway: string;
  destination: string;
}

export interface WarpControlsConfig {
  align: boolean;
  engage: boolean;
  warpMode: string;
  latency: string;
}

export interface TelemetryOverlayConfig {
  heartbeat: string;
  qOps: number;
  delta: string;
  omegaInfinityCore: boolean;
}

/**
 * Calculates Shannon-like entropy from telemetry historical snapshots
 */
export function calculateTelemetryEntropy(snapshots: HardwareSnapshot[]): {
  entropyKBps: number;
  thermalVariance: number;
  lyapunovExponent: number;
  trend: 'decreasing' | 'steady' | 'accelerating';
} {
  if (!snapshots || snapshots.length === 0) {
    return {
      entropyKBps: 12.4,
      thermalVariance: 0.18,
      lyapunovExponent: -0.0384,
      trend: 'steady',
    };
  }

  // Calculate variances in CPU & Cryo
  const cpuVals = snapshots.map((s) => s.cpuAverage);
  const cryoVals = snapshots.map((s) => s.cryoTempMk);
  const qopsVals = snapshots.map((s) => s.qopsThroughput);

  const meanCpu = cpuVals.reduce((a, b) => a + b, 0) / cpuVals.length;
  const varianceCpu = cpuVals.reduce((acc, v) => acc + Math.pow(v - meanCpu, 2), 0) / cpuVals.length;

  const meanCryo = cryoVals.reduce((a, b) => a + b, 0) / cryoVals.length;
  const varianceCryo = cryoVals.reduce((acc, v) => acc + Math.pow(v - meanCryo, 2), 0) / cryoVals.length;

  // Base entropy rate
  const rawEntropy = 11.2 + Math.min(6.0, varianceCpu * 0.4 + varianceCryo * 12.0);
  const entropyKBps = Number(rawEntropy.toFixed(2));
  const thermalVariance = Number(varianceCryo.toFixed(4));

  // Determine trend by comparing latest with older
  let trend: 'decreasing' | 'steady' | 'accelerating' = 'steady';
  if (snapshots.length >= 2) {
    const latest = snapshots[snapshots.length - 1];
    const prev = snapshots[snapshots.length - 2];
    if (latest.cpuAverage > prev.cpuAverage + 2.0) {
      trend = 'accelerating';
    } else if (latest.cpuAverage < prev.cpuAverage - 2.0) {
      trend = 'decreasing';
    }
  }

  // Lyapunov stability (<0 is dissipative/stable, >0 is chaotic)
  const lyapunovExponent = Number((-0.042 + varianceCpu * 0.005).toFixed(4));

  return {
    entropyKBps,
    thermalVariance,
    lyapunovExponent,
    trend,
  };
}

/**
 * Generate Path Projections predicting future state nodes over T+1 to T+5
 */
export function generatePathProjection(options?: {
  snapshots?: HardwareSnapshot[];
  sector?: string;
  gateway?: string;
  destination?: string;
  horizonSteps?: number;
  entropyModifier?: number; // e.g. +1.2 or -0.5
  entropyMultiplier?: number; // 0.5 to 2.0
}): MultiversePathProjection {
  const snapshots = options?.snapshots || INITIAL_HARDWARE_SNAPSHOTS;
  const baseSector = options?.sector || '08-XF4';
  const baseGateway = options?.gateway || 'Nexus-Gateway';
  const baseDestination = options?.destination || 'Celestial-Haven';
  const horizonSteps = options?.horizonSteps || 5;
  const entropyMod = options?.entropyModifier || 0;
  const multiplier = options?.entropyMultiplier || 1.0;

  const entropyCalc = calculateTelemetryEntropy(snapshots);
  const baseEntropyRate = Number(((entropyCalc.entropyKBps + entropyMod) * multiplier).toFixed(2));
  const projId = `PROJ-Ω∞-${Date.now().toString(36).toUpperCase()}`;

  const branches: Array<{
    type: 'canonical_anchor' | 'optimal_warp' | 'entropy_surge' | 'quarantine_divergence';
    namePrefix: string;
    sectorPrefix: string;
    colorBias: string;
    baseStability: number;
    driftFactor: number;
    probWeight: number;
  }> = [
    {
      type: 'canonical_anchor',
      namePrefix: 'SSoT Canonical Anchor',
      sectorPrefix: '08-XF4-PRIME',
      colorBias: '#10B981',
      baseStability: 99.94,
      driftFactor: 0.08,
      probWeight: 0.58,
    },
    {
      type: 'optimal_warp',
      namePrefix: 'Quantum Warp Corridor',
      sectorPrefix: '08-WARP-HYPER',
      colorBias: '#8B5CF6',
      baseStability: 98.85,
      driftFactor: 0.22,
      probWeight: 0.28,
    },
    {
      type: 'entropy_surge',
      namePrefix: 'Counterfactual Entropy Node',
      sectorPrefix: '08-ENTROPY-SURGE',
      colorBias: '#F59E0B',
      baseStability: 96.2,
      driftFactor: 0.55,
      probWeight: 0.11,
    },
    {
      type: 'quarantine_divergence',
      namePrefix: 'Fail-Closed Quarantine Cone',
      sectorPrefix: '08-QUARANTINE-ISOL',
      colorBias: '#EF4444',
      baseStability: 91.5,
      driftFactor: 0.88,
      probWeight: 0.03,
    },
  ];

  const nodes: PathProjectionNode[] = [];
  const edges: MultiversePathProjection['edges'] = [];

  // Root anchor node at T=0
  const rootNode: PathProjectionNode = {
    id: 'NODE-T0-ORIGIN',
    stepHorizon: 0,
    timeOffsetSeconds: 0,
    name: `Origin Core (${baseSector})`,
    sector: baseSector,
    gateway: baseGateway,
    projectedEntropyRateKBps: baseEntropyRate,
    thermalVarianceDeltaC: 0.0,
    stabilityIndexPct: 100.0,
    divergenceVector: { x: 0, y: 0, driftRadius: 4 },
    confidenceScorePct: 100.0,
    quantumCoherencePct: 99.99,
    invariantPassRate: 10,
    branchType: 'canonical_anchor',
    pqcAttestationSeal: generateSha256Hash(`ORIGIN_${projId}`).slice(0, 24),
    status: 'HIGH_CONFIDENCE',
  };
  nodes.push(rootNode);

  // Generate projection nodes for each step horizon T+1 to T+5 across each branch
  const timeOffsets = [30, 60, 120, 180, 240];

  for (let step = 1; step <= horizonSteps; step++) {
    const offsetSec = timeOffsets[step - 1] || step * 60;

    branches.forEach((br, bIdx) => {
      const nodeId = `NODE-T${step}-${br.type.toUpperCase()}`;
      const entropyFluctuation = (Math.sin(step * 1.5 + bIdx) * 0.8 + br.driftFactor * 1.8) * multiplier;
      const projectedEntropy = Number(Math.max(8.0, baseEntropyRate + entropyFluctuation).toFixed(2));
      const thermalDelta = Number((br.driftFactor * step * 0.48 * multiplier).toFixed(2));
      const stability = Number(Math.max(85.0, br.baseStability - step * br.driftFactor * 1.2).toFixed(2));
      const confidence = Number(Math.max(70.0, (100 - step * 2.8 * (br.driftFactor + 0.3))).toFixed(1));
      const coherence = Number(Math.max(90.0, 99.98 - step * br.driftFactor * 1.1).toFixed(2));
      const driftRadius = Number((8 + step * 6 * (br.driftFactor + 0.4)).toFixed(1));

      // Coordinate offset for D3 vector projection layout
      const xAngle = (bIdx - 1.5) * 0.42;
      const distance = step * 90;
      const x = Math.sin(xAngle) * distance;
      const y = -Math.cos(xAngle) * distance;

      let status: PathProjectionNode['status'] = 'HIGH_CONFIDENCE';
      if (br.type === 'quarantine_divergence') {
        status = 'QUARANTINE_BOUND';
      } else if (stability < 96.0) {
        status = 'POTENTIAL_DRIFT';
      } else if (confidence > 92.0) {
        status = 'STABLE_PROJECTED';
      }

      const node: PathProjectionNode = {
        id: nodeId,
        stepHorizon: step,
        timeOffsetSeconds: offsetSec,
        name: `${br.namePrefix} [T+${step}]`,
        sector: `${br.sectorPrefix}-${step}`,
        gateway: step === horizonSteps ? baseDestination : `${baseGateway}-HOP${step}`,
        projectedEntropyRateKBps: projectedEntropy,
        thermalVarianceDeltaC: thermalDelta,
        stabilityIndexPct: stability,
        divergenceVector: { x, y, driftRadius },
        confidenceScorePct: confidence,
        quantumCoherencePct: coherence,
        invariantPassRate: br.type === 'quarantine_divergence' ? 8 : 10,
        branchType: br.type,
        pqcAttestationSeal: generateSha256Hash(`${nodeId}_${projId}`).slice(0, 24),
        status,
      };

      nodes.push(node);

      // Connect edge from previous step
      const sourceId = step === 1 ? rootNode.id : `NODE-T${step - 1}-${br.type.toUpperCase()}`;
      edges.push({
        id: `EDGE-${sourceId}->${nodeId}`,
        sourceId,
        targetId: nodeId,
        weight: Number((1.0 - br.driftFactor * 0.3).toFixed(2)),
        probability: Number((br.probWeight * Math.pow(0.95, step - 1)).toFixed(3)),
        latencyMs: Number((0.08 + step * 0.03 * (br.driftFactor + 0.5)).toFixed(2)),
        branchType: br.type,
      });
    });
  }

  return {
    projectionId: projId,
    generatedAt: new Date().toISOString(),
    telemetrySourceSnapshotsCount: snapshots.length,
    baseEntropyRateKBps: baseEntropyRate,
    entropyTrend: entropyCalc.trend,
    lyapunovExponent: entropyCalc.lyapunovExponent,
    targetTrajectory: `Sector ${baseSector} ──► ${baseGateway} ──► ${baseDestination}`,
    activeHorizonSteps: horizonSteps,
    nodes,
    edges,
    pqcRootHash: generateSha256Hash(`PATH_PROJECTION_${projId}_${nodes.length}_${baseEntropyRate}`),
  };
}

let initialProjection = generatePathProjection();

let navState: MultiverseNavigationState = {
  gridId: 'NAV-Ω∞-GRID',
  continuumRuntime: 'QCR-v14',
  omegaCore: 'Ω∞',
  holographicMode: true,
  currentSector: '08-XF4',
  targetGateway: 'Nexus-Gateway',
  destination: 'Celestial-Haven',
  warpEngaged: true,
  warpLatency: '≤0.12ms',
  heartbeat: '60Hz Stable',
  qOps: 2048,
  commitHash: '0xMULTIVERSE-NAVIGATION-GRID-VERIFIED',
  blockId: 'Block #849202 (Merkle-Navigation-Seal)',
  status: 'ONLINE',
  pathProjection: initialProjection,
};

type NavigationListener = (state: MultiverseNavigationState) => void;
const navListeners: Set<NavigationListener> = new Set();

export function subscribeMultiverseNavigation(listener: NavigationListener): () => void {
  navListeners.add(listener);
  listener(navState);
  return () => {
    navListeners.delete(listener);
  };
}

export function getMultiverseNavigationState(): MultiverseNavigationState {
  return { ...navState };
}

export function updatePathProjection(options?: {
  snapshots?: HardwareSnapshot[];
  sector?: string;
  gateway?: string;
  destination?: string;
  horizonSteps?: number;
  entropyModifier?: number;
  entropyMultiplier?: number;
}): MultiversePathProjection {
  const newProjection = generatePathProjection({
    snapshots: options?.snapshots,
    sector: options?.sector || navState.currentSector,
    gateway: options?.gateway || navState.targetGateway,
    destination: options?.destination || navState.destination,
    horizonSteps: options?.horizonSteps || 5,
    entropyModifier: options?.entropyModifier,
    entropyMultiplier: options?.entropyMultiplier,
  });

  navState = {
    ...navState,
    pathProjection: newProjection,
  };

  navListeners.forEach((fn) => fn({ ...navState }));
  return newProjection;
}

export async function activateMultiverseNavigation(
  params?: Partial<CoordinatesConfig>,
  onProgress?: (step: number, msg: string) => void
): Promise<MultiverseNavigationState> {
  const currentSector = params?.currentSector || '08-XF4';
  const targetGateway = params?.targetGateway || 'Nexus-Gateway';
  const destination = params?.destination || 'Celestial-Haven';

  if (onProgress) onProgress(1, '1️⃣ Initializing Navigation Grid (NAV-Ω∞-GRID, QCR-v14, Ω∞, Holographic Mode: ON)...');
  await new Promise((r) => setTimeout(r, 120));

  if (onProgress) onProgress(2, `2️⃣ Setting System Coordinates (Sector: ${currentSector} → Gateway: ${targetGateway} → Destination: ${destination})...`);
  await new Promise((r) => setTimeout(r, 120));

  if (onProgress) onProgress(3, '3️⃣ Activating Warp Controls (Quantum-Resilient, Latency: ≤0.12ms, Alignment 100%)...');
  await new Promise((r) => setTimeout(r, 120));

  if (onProgress) onProgress(4, '4️⃣ Projecting Multiverse Future Paths (Entropy: 12.4 KB/s, Lyapunov: -0.0384, 4 Vector Branches)...');
  await new Promise((r) => setTimeout(r, 120));

  if (onProgress) onProgress(5, '5️⃣ Publishing Navigation Ledger (Commit 0xMULTIVERSE-NAVIGATION-GRID-VERIFIED, Merkle-Navigation-Seal)...');
  await new Promise((r) => setTimeout(r, 120));

  const updatedProjection = generatePathProjection({
    sector: currentSector,
    gateway: targetGateway,
    destination,
  });

  navState = {
    ...navState,
    currentSector,
    targetGateway,
    destination,
    warpEngaged: true,
    qOps: 2048,
    status: 'ONLINE',
    pathProjection: updatedProjection,
    commitHash: '0xMULTIVERSE-NAVIGATION-GRID-VERIFIED',
    blockId: `Block #849202 (${generateSha256Hash('NAV_' + Date.now()).slice(0, 16)})`,
  };

  navListeners.forEach((fn) => fn({ ...navState }));
  return navState;
}

