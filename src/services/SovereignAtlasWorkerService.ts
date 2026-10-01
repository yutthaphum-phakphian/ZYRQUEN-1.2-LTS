/**
 * ZYRQUEN Ω∞ — Sovereign Atlas Worker Service
 * 
 * Manages the dedicated Web Worker instance for Sovereign Atlas 3D Hologram Grid,
 * with concurrent message tracking, timeout safeguards, and zero-downtime fallback.
 */

import {
  AtlasSpatialMathEngine,
  AtlasWorkerRequest,
  AtlasWorkerResponse,
  GravityFieldResponsePayload,
  ChamberOrbitalsResponsePayload,
  SpatialHeatmapResponsePayload,
  TransformCoordinatesResponsePayload,
  ProcessTelemetryResponsePayload,
} from '../workers/sovereignAtlasSpatialWorker';

export class SovereignAtlasWorkerService {
  private static instance: SovereignAtlasWorkerService | null = null;
  private worker: Worker | null = null;
  private reqIdCounter = 0;
  private pendingRequests = new Map<number, {
    resolve: (data: any) => void;
    reject: (err: any) => void;
    timer: any;
  }>();
  private isWorkerSupported = false;

  private constructor() {
    this.initWorker();
  }

  public static getInstance(): SovereignAtlasWorkerService {
    if (!SovereignAtlasWorkerService.instance) {
      SovereignAtlasWorkerService.instance = new SovereignAtlasWorkerService();
    }
    return SovereignAtlasWorkerService.instance;
  }

  private initWorker() {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      this.isWorkerSupported = false;
      return;
    }

    try {
      this.worker = new Worker(
        new URL('../workers/sovereignAtlasSpatialWorker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = (e: MessageEvent<AtlasWorkerResponse>) => {
        const { id, success, data } = e.data;
        const pending = this.pendingRequests.get(id);
        if (pending) {
          clearTimeout(pending.timer);
          this.pendingRequests.delete(id);
          if (success) {
            pending.resolve(data);
          } else {
            pending.reject(new Error(data?.error || 'Worker computation error'));
          }
        }
      };

      this.worker.onerror = (err) => {
        console.warn('[SovereignAtlasWorker] Web Worker reported error, switching to inline fallback:', err);
      };

      this.isWorkerSupported = true;
    } catch (e) {
      console.warn('[SovereignAtlasWorker] Worker initialization fallback enabled:', e);
      this.isWorkerSupported = false;
      this.worker = null;
    }
  }

  public async calculateGravityField(
    clientX: number,
    clientY: number,
    rect: { left: number; top: number; width: number; height: number },
    gridScale: number = 6.5,
    wellDepthMultiplier: number = 1.65
  ): Promise<GravityFieldResponsePayload> {
    if (!this.worker || !this.isWorkerSupported) {
      return AtlasSpatialMathEngine.calculateGravityField(
        clientX,
        clientY,
        rect,
        gridScale,
        wellDepthMultiplier
      );
    }

    const id = ++this.reqIdCounter;
    const request: AtlasWorkerRequest = {
      id,
      type: 'CALCULATE_GRAVITY_FIELD',
      payload: { clientX, clientY, rect, gridScale, wellDepthMultiplier },
    };

    return new Promise<GravityFieldResponsePayload>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        // Fallback to synchronous inline calculation on timeout
        resolve(
          AtlasSpatialMathEngine.calculateGravityField(
            clientX,
            clientY,
            rect,
            gridScale,
            wellDepthMultiplier
          )
        );
      }, 50);

      this.pendingRequests.set(id, { resolve, reject, timer });
      this.worker?.postMessage(request);
    });
  }

  public async calculateChamberOrbitals(
    elapsed: number,
    effectiveSpeed: number,
    nodes: Array<{ id: string; basePos: [number, number, number] }>
  ): Promise<ChamberOrbitalsResponsePayload> {
    if (!this.worker || !this.isWorkerSupported) {
      return AtlasSpatialMathEngine.calculateChamberOrbitals(
        elapsed,
        effectiveSpeed,
        nodes
      );
    }

    const id = ++this.reqIdCounter;
    const request: AtlasWorkerRequest = {
      id,
      type: 'CALCULATE_CHAMBER_ORBITALS',
      payload: { elapsed, effectiveSpeed, nodes },
    };

    return new Promise<ChamberOrbitalsResponsePayload>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        resolve(
          AtlasSpatialMathEngine.calculateChamberOrbitals(
            elapsed,
            effectiveSpeed,
            nodes
          )
        );
      }, 50);

      this.pendingRequests.set(id, { resolve, reject, timer });
      this.worker?.postMessage(request);
    });
  }

  public async calculateSpatialHeatmap(
    dimensions: Array<{ id: string; coordinates: [number, number, number]; qOps: number }>,
    maxHotspots: number = 6
  ): Promise<SpatialHeatmapResponsePayload> {
    if (!this.worker || !this.isWorkerSupported) {
      return AtlasSpatialMathEngine.calculateSpatialHeatmap(
        dimensions,
        maxHotspots
      );
    }

    const id = ++this.reqIdCounter;
    const request: AtlasWorkerRequest = {
      id,
      type: 'CALCULATE_SPATIAL_HEATMAP',
      payload: { dimensions, maxHotspots },
    };

    return new Promise<SpatialHeatmapResponsePayload>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        resolve(
          AtlasSpatialMathEngine.calculateSpatialHeatmap(dimensions, maxHotspots)
        );
      }, 50);

      this.pendingRequests.set(id, { resolve, reject, timer });
      this.worker?.postMessage(request);
    });
  }

  public async transformCoordinates(
    dimensions: Array<{ id: string; coordinates: [number, number, number]; qOps: number; accentHex?: string }>,
    zoomLevel: number,
    panControl: { x: number; y: number }
  ): Promise<TransformCoordinatesResponsePayload> {
    if (!this.worker || !this.isWorkerSupported) {
      return AtlasSpatialMathEngine.transformCoordinates(
        dimensions,
        zoomLevel,
        panControl
      );
    }

    const id = ++this.reqIdCounter;
    const request: AtlasWorkerRequest = {
      id,
      type: 'TRANSFORM_COORDINATES',
      payload: { dimensions, zoomLevel, panControl },
    };

    return new Promise<TransformCoordinatesResponsePayload>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        resolve(
          AtlasSpatialMathEngine.transformCoordinates(
            dimensions,
            zoomLevel,
            panControl
          )
        );
      }, 50);

      this.pendingRequests.set(id, { resolve, reject, timer });
      this.worker?.postMessage(request);
    });
  }

  public async processTelemetry(
    telemetrySnapshots: Array<{ time: string; entropy: number; qops: number; coherence: number }>,
    driftTolerance: number = 0.05
  ): Promise<ProcessTelemetryResponsePayload> {
    if (!this.worker || !this.isWorkerSupported) {
      return AtlasSpatialMathEngine.processTelemetry(
        telemetrySnapshots,
        driftTolerance
      );
    }

    const id = ++this.reqIdCounter;
    const request: AtlasWorkerRequest = {
      id,
      type: 'PROCESS_TELEMETRY',
      payload: { telemetrySnapshots, driftTolerance },
    };

    return new Promise<ProcessTelemetryResponsePayload>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        resolve(
          AtlasSpatialMathEngine.processTelemetry(
            telemetrySnapshots,
            driftTolerance
          )
        );
      }, 50);

      this.pendingRequests.set(id, { resolve, reject, timer });
      this.worker?.postMessage(request);
    });
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingRequests.clear();
  }
}

export const sovereignAtlasWorker = SovereignAtlasWorkerService.getInstance();
