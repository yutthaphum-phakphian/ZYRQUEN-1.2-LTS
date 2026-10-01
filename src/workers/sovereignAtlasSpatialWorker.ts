/**
 * ZYRQUEN Ω∞ — Sovereign Atlas 3D Hologram Grid Dedicated Web Worker
 * 
 * Offloads intensive 3D spatial coordinate calculations, gravitational well vector fields,
 * orbital harmonic node physics, particle stream transforms, and real-time mapping updates
 * away from the main UI thread to minimize input latency and maximize rendering framerates.
 */

export interface GravityFieldRequest {
  id: number;
  type: 'CALCULATE_GRAVITY_FIELD';
  payload: {
    clientX: number;
    clientY: number;
    rect: {
      left: number;
      top: number;
      width: number;
      height: number;
    };
    gridScale?: number;
    wellDepthMultiplier?: number;
  };
}

export interface GravityFieldResponsePayload {
  gx: number;
  gz: number;
  dy: number;
  fieldTesla: number;
  radial: number;
  dx: number;
  dz: number;
  magnitude: number;
  angleDeg: number;
  normX: number;
  normY: number;
  targetGravity: {
    x: number;
    z: number;
    strength: number;
  };
}

export interface ChamberOrbitalsRequest {
  id: number;
  type: 'CALCULATE_CHAMBER_ORBITALS';
  payload: {
    elapsed: number;
    effectiveSpeed: number;
    nodes: Array<{
      id: string;
      basePos: [number, number, number];
    }>;
  };
}

export interface ChamberOrbitalsResponsePayload {
  nodes: Array<{
    id: string;
    position: [number, number, number];
    pulse: number;
    haloScale: number;
  }>;
  torusRotations: Array<{
    zDelta: number;
    yDelta: number;
  }>;
  coreRotation: {
    xDelta: number;
    yDelta: number;
  };
}

export interface SpatialHeatmapRequest {
  id: number;
  type: 'CALCULATE_SPATIAL_HEATMAP';
  payload: {
    dimensions: Array<{
      id: string;
      coordinates: [number, number, number];
      qOps: number;
    }>;
    maxHotspots?: number;
  };
}

export interface SpatialHeatmapResponsePayload {
  hotspots: Array<{
    x: number;
    z: number;
    intensity: number;
    radius: number;
  }>;
}

export interface TransformCoordinatesRequest {
  id: number;
  type: 'TRANSFORM_COORDINATES';
  payload: {
    dimensions: Array<{
      id: string;
      coordinates: [number, number, number];
      qOps: number;
      accentHex?: string;
    }>;
    zoomLevel: number;
    panControl: { x: number; y: number };
  };
}

export interface TransformCoordinatesResponsePayload {
  transformedNodes: Array<{
    id: string;
    rawCoords: [number, number, number];
    projectedCoords: [number, number, number];
    linkToCoreDistance: number;
    activityNorm: number;
    accentHex: string;
  }>;
  cameraDamping: {
    dist: number;
    targetX: number;
    targetY: number;
  };
  totalQOps: number;
  avgLatencyMs: number;
}

export interface ProcessTelemetryRequest {
  id: number;
  type: 'PROCESS_TELEMETRY';
  payload: {
    telemetrySnapshots: Array<{
      time: string;
      entropy: number;
      qops: number;
      coherence: number;
    }>;
    driftTolerance?: number;
  };
}

export interface ProcessTelemetryResponsePayload {
  smoothedTelemetry: Array<{
    time: string;
    entropy: number;
    qops: number;
    coherence: number;
    trend: 'STABLE' | 'ELEVATING' | 'REDUCING';
  }>;
  meanEntropy: number;
  meanQOps: number;
  coherenceSlaPassed: boolean;
  hasSignificantShift: boolean;
}

export type AtlasWorkerRequest =
  | GravityFieldRequest
  | ChamberOrbitalsRequest
  | SpatialHeatmapRequest
  | TransformCoordinatesRequest
  | ProcessTelemetryRequest;

export type AtlasWorkerResponse = {
  id: number;
  type: string;
  success: boolean;
  data: any;
  computedAt: number;
};

/**
 * Pure Spatial Mathematics Engine (Worker Thread)
 */
export const AtlasSpatialMathEngine = {
  calculateGravityField(
    clientX: number,
    clientY: number,
    rect: { left: number; top: number; width: number; height: number },
    gridScale: number = 6.5,
    wellDepthMultiplier: number = 1.65
  ): GravityFieldResponsePayload {
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);

    const relX = (clientX - rect.left) / width;
    const relY = (clientY - rect.top) / height;

    const nx = relX * 2 - 1; // -1 to +1
    const ny = relY * 2 - 1; // -1 to +1

    const gx = +(nx * gridScale).toFixed(3);
    const gz = +(ny * gridScale).toFixed(3);

    const rSq = nx * nx + ny * ny;
    const radial = Math.min(1.414, Math.sqrt(rSq));

    const wellDepth = Math.exp(-rSq * wellDepthMultiplier);
    const dy = +(-Math.exp(-radial * radial * 1.4) * 2.06).toFixed(3);
    const dx = +(nx * 4.8 * wellDepth).toFixed(3);
    const dz = +(-wellDepth * 3.4).toFixed(3);

    const magnitude = +Math.sqrt(dx * dx + dy * dy + dz * dz).toFixed(3);
    const angleDeg = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
    const fieldTesla = +(1.42 + (1 - Math.min(1, radial) * 0.5) * 0.88 + wellDepth * 0.3).toFixed(3);

    return {
      gx,
      gz,
      dy,
      fieldTesla,
      radial: +radial.toFixed(3),
      dx,
      dz,
      magnitude,
      angleDeg,
      normX: +(relX * 100).toFixed(1),
      normY: +(relY * 100).toFixed(1),
      targetGravity: {
        x: gx,
        z: gz,
        strength: +(1.25 * wellDepth + 0.1).toFixed(3),
      },
    };
  },

  calculateChamberOrbitals(
    elapsed: number,
    effectiveSpeed: number,
    nodes: Array<{ id: string; basePos: [number, number, number] }>
  ): ChamberOrbitalsResponsePayload {
    const computedNodes = nodes.map((node, i) => {
      const pulse = +(Math.sin(elapsed * 2.5 + i) * 0.15 + 1.0).toFixed(4);
      const wobbleY = +(Math.sin(elapsed * 1.2 + i * 0.5) * 0.08 * effectiveSpeed).toFixed(4);
      const posX = node.basePos[0];
      const posY = +(node.basePos[1] + wobbleY).toFixed(4);
      const posZ = node.basePos[2];

      return {
        id: node.id,
        position: [posX, posY, posZ] as [number, number, number],
        pulse,
        haloScale: pulse,
      };
    });

    const torusRotations = [0, 1, 2, 3].map((idx) => ({
      zDelta: +(0.004 * (idx + 1) * (idx % 2 === 0 ? 1 : -1) * effectiveSpeed).toFixed(5),
      yDelta: +(0.003 * (idx + 1) * effectiveSpeed).toFixed(5),
    }));

    const coreRotation = {
      xDelta: +(0.008 * effectiveSpeed).toFixed(5),
      yDelta: +(0.012 * effectiveSpeed).toFixed(5),
    };

    return {
      nodes: computedNodes,
      torusRings: torusRotations,
      coreRotation,
    } as any;
  },

  calculateSpatialHeatmap(
    dimensions: Array<{ id: string; coordinates: [number, number, number]; qOps: number }>,
    maxHotspots: number = 6
  ): SpatialHeatmapResponsePayload {
    const hotspots = dimensions.slice(0, maxHotspots).map((d) => ({
      x: d.coordinates[0],
      z: d.coordinates[2],
      intensity: +(Math.min(1.0, d.qOps / 1050)).toFixed(4),
      radius: +(1.8 + Math.min(1.0, d.qOps / 1200) * 1.1).toFixed(4),
    }));

    return { hotspots };
  },

  transformCoordinates(
    dimensions: Array<{ id: string; coordinates: [number, number, number]; qOps: number; accentHex?: string }>,
    zoomLevel: number,
    panControl: { x: number; y: number }
  ): TransformCoordinatesResponsePayload {
    const safeZoom = Math.max(0.5, Math.min(2.2, zoomLevel));
    const dist = +(11.5 / safeZoom).toFixed(3);
    let totalQOps = 0;

    const transformedNodes = dimensions.map((dim) => {
      totalQOps += dim.qOps;
      const [x, y, z] = dim.coordinates;
      const linkToCoreDistance = +Math.sqrt(x * x + (y - 0.4) * (y - 0.4) + z * z).toFixed(3);
      const activityNorm = +Math.min(1.0, dim.qOps / 1200).toFixed(3);

      return {
        id: dim.id,
        rawCoords: [x, y, z] as [number, number, number],
        projectedCoords: [+(x + panControl.x).toFixed(3), +(y + panControl.y).toFixed(3), z] as [number, number, number],
        linkToCoreDistance,
        activityNorm,
        accentHex: dim.accentHex || '#06B6D4',
      };
    });

    return {
      transformedNodes,
      cameraDamping: {
        dist,
        targetX: +(panControl.x * 2).toFixed(3),
        targetY: +(6.5 + panControl.y).toFixed(3),
      },
      totalQOps: +totalQOps.toFixed(1),
      avgLatencyMs: 0.85,
    };
  },

  processTelemetry(
    telemetrySnapshots: Array<{ time: string; entropy: number; qops: number; coherence: number }>,
    driftTolerance: number = 0.05
  ): ProcessTelemetryResponsePayload {
    if (telemetrySnapshots.length === 0) {
      return {
        smoothedTelemetry: [],
        meanEntropy: 0,
        meanQOps: 0,
        coherenceSlaPassed: true,
        hasSignificantShift: false,
      };
    }

    let sumEntropy = 0;
    let sumQOps = 0;
    let sumCoherence = 0;

    const smoothedTelemetry = telemetrySnapshots.map((item, idx, arr) => {
      sumEntropy += item.entropy;
      sumQOps += item.qops;
      sumCoherence += item.coherence;

      let trend: 'STABLE' | 'ELEVATING' | 'REDUCING' = 'STABLE';
      if (idx > 0) {
        const prev = arr[idx - 1];
        const diff = item.entropy - prev.entropy;
        if (diff > 0.02) trend = 'ELEVATING';
        else if (diff < -0.02) trend = 'REDUCING';
      }

      return {
        time: item.time,
        entropy: +item.entropy.toFixed(3),
        qops: +item.qops.toFixed(1),
        coherence: +item.coherence.toFixed(2),
        trend,
      };
    });

    const count = telemetrySnapshots.length;
    const meanEntropy = +(sumEntropy / count).toFixed(3);
    const meanQOps = +(sumQOps / count).toFixed(1);
    const meanCoherence = +(sumCoherence / count).toFixed(2);
    const coherenceSlaPassed = meanCoherence >= 99.90;

    // Check if latest item differs significantly from mean
    const latest = telemetrySnapshots[telemetrySnapshots.length - 1];
    const hasSignificantShift = Math.abs(latest.entropy - meanEntropy) > driftTolerance;

    return {
      smoothedTelemetry,
      meanEntropy,
      meanQOps,
      coherenceSlaPassed,
      hasSignificantShift,
    };
  },
};

// Web Worker Execution Context Handler
if (typeof self !== 'undefined' && typeof window === 'undefined') {
  self.onmessage = (event: MessageEvent<AtlasWorkerRequest>) => {
    const req = event.data;
    if (!req || !req.type) return;

    const start = performance.now();

    try {
      let resultData: any;

      switch (req.type) {
        case 'CALCULATE_GRAVITY_FIELD': {
          const { clientX, clientY, rect, gridScale, wellDepthMultiplier } = req.payload;
          resultData = AtlasSpatialMathEngine.calculateGravityField(
            clientX,
            clientY,
            rect,
            gridScale,
            wellDepthMultiplier
          );
          break;
        }

        case 'CALCULATE_CHAMBER_ORBITALS': {
          const { elapsed, effectiveSpeed, nodes } = req.payload;
          resultData = AtlasSpatialMathEngine.calculateChamberOrbitals(
            elapsed,
            effectiveSpeed,
            nodes
          );
          break;
        }

        case 'CALCULATE_SPATIAL_HEATMAP': {
          const { dimensions, maxHotspots } = req.payload;
          resultData = AtlasSpatialMathEngine.calculateSpatialHeatmap(
            dimensions,
            maxHotspots
          );
          break;
        }

        case 'TRANSFORM_COORDINATES': {
          const { dimensions, zoomLevel, panControl } = req.payload;
          resultData = AtlasSpatialMathEngine.transformCoordinates(
            dimensions,
            zoomLevel,
            panControl
          );
          break;
        }

        case 'PROCESS_TELEMETRY': {
          const { telemetrySnapshots, driftTolerance } = req.payload;
          resultData = AtlasSpatialMathEngine.processTelemetry(
            telemetrySnapshots,
            driftTolerance
          );
          break;
        }

        default:
          throw new Error(`Unknown Atlas Worker message type: ${(req as any).type}`);
      }

      const response: AtlasWorkerResponse = {
        id: req.id,
        type: req.type,
        success: true,
        data: resultData,
        computedAt: performance.now() - start,
      };

      self.postMessage(response);
    } catch (err: any) {
      const errorResponse: AtlasWorkerResponse = {
        id: req.id,
        type: req.type,
        success: false,
        data: { error: err?.message || String(err) },
        computedAt: performance.now() - start,
      };
      self.postMessage(errorResponse);
    }
  };
}
