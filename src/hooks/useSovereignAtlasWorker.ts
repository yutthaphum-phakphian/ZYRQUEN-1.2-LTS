/**
 * ZYRQUEN Ω∞ — useSovereignAtlasWorker Hook
 * 
 * Custom hook providing access to offloaded spatial computations.
 */

import { useEffect, useCallback, useRef } from 'react';
import {
  sovereignAtlasWorker,
  SovereignAtlasWorkerService,
} from '../services/SovereignAtlasWorkerService';
import {
  GravityFieldResponsePayload,
  ChamberOrbitalsResponsePayload,
  SpatialHeatmapResponsePayload,
  TransformCoordinatesResponsePayload,
  ProcessTelemetryResponsePayload,
} from '../workers/sovereignAtlasSpatialWorker';

export function useSovereignAtlasWorker() {
  const serviceRef = useRef<SovereignAtlasWorkerService>(sovereignAtlasWorker);

  const computeGravityField = useCallback(
    async (
      clientX: number,
      clientY: number,
      rect: { left: number; top: number; width: number; height: number },
      gridScale: number = 6.5,
      wellDepthMultiplier: number = 1.65
    ): Promise<GravityFieldResponsePayload> => {
      return serviceRef.current.calculateGravityField(
        clientX,
        clientY,
        rect,
        gridScale,
        wellDepthMultiplier
      );
    },
    []
  );

  const computeChamberOrbitals = useCallback(
    async (
      elapsed: number,
      effectiveSpeed: number,
      nodes: Array<{ id: string; basePos: [number, number, number] }>
    ): Promise<ChamberOrbitalsResponsePayload> => {
      return serviceRef.current.calculateChamberOrbitals(
        elapsed,
        effectiveSpeed,
        nodes
      );
    },
    []
  );

  const computeSpatialHeatmap = useCallback(
    async (
      dimensions: Array<{ id: string; coordinates: [number, number, number]; qOps: number }>,
      maxHotspots: number = 6
    ): Promise<SpatialHeatmapResponsePayload> => {
      return serviceRef.current.calculateSpatialHeatmap(dimensions, maxHotspots);
    },
    []
  );

  const computeTransformCoordinates = useCallback(
    async (
      dimensions: Array<{ id: string; coordinates: [number, number, number]; qOps: number; accentHex?: string }>,
      zoomLevel: number,
      panControl: { x: number; y: number }
    ): Promise<TransformCoordinatesResponsePayload> => {
      return serviceRef.current.transformCoordinates(dimensions, zoomLevel, panControl);
    },
    []
  );

  const computeProcessTelemetry = useCallback(
    async (
      telemetrySnapshots: Array<{ time: string; entropy: number; qops: number; coherence: number }>,
      driftTolerance: number = 0.05
    ): Promise<ProcessTelemetryResponsePayload> => {
      return serviceRef.current.processTelemetry(telemetrySnapshots, driftTolerance);
    },
    []
  );

  return {
    computeGravityField,
    computeChamberOrbitals,
    computeSpatialHeatmap,
    computeTransformCoordinates,
    computeProcessTelemetry,
  };
}
