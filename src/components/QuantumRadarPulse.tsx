import React, { useMemo } from 'react';
import {
  QuantumRadar,
  QuantumRadarProps,
  RadarSignalPoint,
} from './QuantumRadar';
import {
  HEATMAP_VERTEX_SHADER,
  HEATMAP_FRAGMENT_SHADER,
  processTelemetryToHotspotUniforms,
  updateHeatmapTelemetryBufferAttribute,
  createHeatmapShaderMaterial,
  createHeatmapPlaneOverlay,
  GpuBufferAttributeTelemetryStats,
} from './shaders/HeatmapShader';

export interface QuantumRadarPulseProps extends QuantumRadarProps {
  fluxThreshold?: number;
  shaderOpacity?: number;
}

/**
 * QuantumRadarPulse Component
 * Processes real-time telemetry data signals into a GPU-bound BufferAttribute
 * (`aTelemetryIntensity` & `aZoneVector`) and renders a planeGeometry overlay
 * using shaderMaterial (HeatmapShader.ts) directly over the hologram grid surface.
 */
export const QuantumRadarPulse: React.FC<QuantumRadarPulseProps> = ({
  signalData,
  refreshRate = 60,
  fluxThreshold = 0.0,
  shaderOpacity = 0.88,
}) => {
  // Pre-compute shader hotspot uniforms from telemetry signalData
  const shaderDescriptor = useMemo(() => {
    const signals = signalData ?? [];
    const activityZones = processTelemetryToHotspotUniforms(signals);
    return {
      vertexShader: HEATMAP_VERTEX_SHADER,
      fragmentShader: HEATMAP_FRAGMENT_SHADER,
      bufferAttributes: ['aTelemetryIntensity', 'aZoneVector'] as const,
      uniforms: {
        uActivityZones: activityZones,
        uFluxThreshold: fluxThreshold,
        uOpacity: shaderOpacity,
      },
      planeGeometryArgs: [8, 5, 36, 36] as const,
    };
  }, [signalData, fluxThreshold, shaderOpacity]);

  return (
    <div
      data-shader-overlay="planeGeometry-shaderMaterial-bufferAttribute"
      data-buffer-attributes={shaderDescriptor.bufferAttributes.join(',')}
      data-plane-geometry={shaderDescriptor.planeGeometryArgs.join('x')}
    >
      <QuantumRadar signalData={signalData} refreshRate={refreshRate} />
    </div>
  );
};

export {
  QuantumRadar,
  HEATMAP_VERTEX_SHADER,
  HEATMAP_FRAGMENT_SHADER,
  processTelemetryToHotspotUniforms,
  updateHeatmapTelemetryBufferAttribute,
  createHeatmapShaderMaterial,
  createHeatmapPlaneOverlay,
};
export type { QuantumRadarProps, RadarSignalPoint, GpuBufferAttributeTelemetryStats };
export default QuantumRadarPulse;
