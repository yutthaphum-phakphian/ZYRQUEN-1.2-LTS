import React, { useEffect, useState, useRef } from 'react';
import { Radio, Activity, ShieldCheck, Flame, Grid3X3, Sparkles, Code2 } from 'lucide-react';
import { playTone } from './AudioSynthesizer';
import { DimensionalHotspotUniform } from '../utils/hologramMaterial';
import {
  HEATMAP_VERTEX_SHADER,
  HEATMAP_FRAGMENT_SHADER,
  processTelemetryToHotspotUniforms,
  updateHeatmapTelemetryBufferAttribute,
  createHeatmapPlaneOverlay,
  GpuBufferAttributeTelemetryStats,
} from './shaders/HeatmapShader';

export interface RadarSignalPoint {
  id: string;
  label: string;
  sector: string;
  angleDeg: number;
  distancePct: number;
  latencyMs: number;
  activityPct: number;
  port: number;
  status: 'NOMINAL' | 'STANDBY_BUFFER' | 'VERIFIED' | 'HIGH_FLUX';
}

export interface QuantumRadarProps {
  signalData?: RadarSignalPoint[];
  refreshRate?: number;
}

const DEFAULT_SIGNALS: RadarSignalPoint[] = [
  { id: 'sig-1', label: 'Genesis #849202 Anchor', sector: 'SEC-00', angleDeg: 32, distancePct: 28, latencyMs: 1.20, activityPct: 98.4, port: 8443, status: 'VERIFIED' },
  { id: 'sig-2', label: 'HSM Quorum 10/10 Node', sector: 'SEC-04', angleDeg: 115, distancePct: 54, latencyMs: 8.40, activityPct: 94.2, port: 8443, status: 'VERIFIED' },
  { id: 'sig-3', label: 'Chamber 02 Buffer Gamma', sector: 'SEC-02', angleDeg: 210, distancePct: 72, latencyMs: 0.80, activityPct: 62.5, port: 8443, status: 'STANDBY_BUFFER' },
  { id: 'sig-4', label: 'Telemetry Core Stream', sector: 'SEC-08', angleDeg: 295, distancePct: 44, latencyMs: 35.80, activityPct: 96.8, port: 8443, status: 'HIGH_FLUX' },
  { id: 'sig-5', label: 'Dimension Router Mk-III', sector: 'SEC-10', angleDeg: 340, distancePct: 62, latencyMs: 11.20, activityPct: 91.5, port: 8443, status: 'HIGH_FLUX' },
];

export interface HeatmapZoneCell {
  id: string;
  sectorCode: string;
  dimensionRef: string;
  activityPct: number;
  qOpsFlux: number;
}

const INITIAL_HEATMAP_CELLS: HeatmapZoneCell[] = [
  { id: 'hm-00', sectorCode: 'S00-NW', dimensionRef: 'DIM-00', activityPct: 96, qOpsFlux: 1920 },
  { id: 'hm-01', sectorCode: 'S01-N', dimensionRef: 'DIM-01', activityPct: 88, qOpsFlux: 1640 },
  { id: 'hm-02', sectorCode: 'S02-NE', dimensionRef: 'DIM-02', activityPct: 54, qOpsFlux: 610 },
  { id: 'hm-03', sectorCode: 'S03-E', dimensionRef: 'DIM-09', activityPct: 94, qOpsFlux: 1850 },
  { id: 'hm-04', sectorCode: 'S04-W', dimensionRef: 'DIM-01', activityPct: 79, qOpsFlux: 1410 },
  { id: 'hm-05', sectorCode: 'S05-CORE', dimensionRef: 'DIM-00', activityPct: 99, qOpsFlux: 2048 },
  { id: 'hm-06', sectorCode: 'S06-GATE', dimensionRef: 'DIM-10', activityPct: 95, qOpsFlux: 1890 },
  { id: 'hm-07', sectorCode: 'S07-ROUT', dimensionRef: 'DIM-10', activityPct: 84, qOpsFlux: 1520 },
  { id: 'hm-08', sectorCode: 'S08-XF4', dimensionRef: 'DIM-09', activityPct: 97, qOpsFlux: 1980 },
  { id: 'hm-09', sectorCode: 'S09-SW', dimensionRef: 'DIM-11', activityPct: 91, qOpsFlux: 1760 },
  { id: 'hm-10', sectorCode: 'S10-S', dimensionRef: 'DIM-11', activityPct: 72, qOpsFlux: 1180 },
  { id: 'hm-11', sectorCode: 'S11-SE', dimensionRef: 'DIM-02', activityPct: 64, qOpsFlux: 890 },
];

export const QuantumRadar: React.FC<QuantumRadarProps> = ({
  signalData = DEFAULT_SIGNALS,
  refreshRate = 60,
}) => {
  const [sweepAngle, setSweepAngle] = useState<number>(0);
  const [showHeatmapOverlay, setShowHeatmapOverlay] = useState<boolean>(true);
  const [heatmapFilter, setHeatmapFilter] = useState<'ALL' | 'HIGH_FLUX'>('ALL');
  const [shaderPalette, setShaderPalette] = useState<'QUANTUM_FLUX' | 'THERMAL_PLASMA'>('QUANTUM_FLUX');
  const [heatmapCells, setHeatmapCells] = useState<HeatmapZoneCell[]>(INITIAL_HEATMAP_CELLS);
  const [selectedCell, setSelectedCell] = useState<HeatmapZoneCell>(INITIAL_HEATMAP_CELLS[5]);
  const [showShaderSource, setShowShaderSource] = useState<boolean>(false);
  const [gpuBufferStats, setGpuBufferStats] = useState<GpuBufferAttributeTelemetryStats | null>(null);
  const shaderCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const planeOverlayRef = useRef<ReturnType<typeof createHeatmapPlaneOverlay> | null>(null);

  // Initialize Three.js PlaneGeometry + GPU-bound BufferAttribute + ShaderMaterial overlay from HeatmapShader.ts
  useEffect(() => {
    const overlay = createHeatmapPlaneOverlay(signalData, 8, 5, 36);
    planeOverlayRef.current = overlay;
    setGpuBufferStats(overlay.bufferStats);
    return () => {
      overlay.geometry.dispose();
      overlay.material.dispose();
    };
  }, [signalData]);

  // Update GPU-bound BufferAttribute (`aTelemetryIntensity`, `aZoneVector`) and ShaderMaterial uniforms
  useEffect(() => {
    if (!planeOverlayRef.current) return;
    const { geometry, material } = planeOverlayRef.current;
    const stats = updateHeatmapTelemetryBufferAttribute(geometry, signalData, 8);
    setGpuBufferStats(stats);
    material.uniforms.uActivityZones.value = processTelemetryToHotspotUniforms(signalData);
    material.uniforms.uFluxThreshold.value = heatmapFilter === 'HIGH_FLUX' ? 0.85 : 0.0;
    material.uniforms.uPaletteMode.value = shaderPalette === 'THERMAL_PLASMA' ? 1 : 0;
    material.uniforms.uSweepAngleRad.value = (sweepAngle * Math.PI) / 180;
  }, [signalData, heatmapFilter, shaderPalette, sweepAngle]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSweepAngle((prev) => (prev + 6) % 360);
    }, Math.max(30, Math.round(1000 / Math.min(refreshRate, 30))));
    return () => clearInterval(interval);
  }, [refreshRate]);

  // Dynamic dimensional activity fluctuation on the navigation grid heatmap
  useEffect(() => {
    const fluxTimer = setInterval(() => {
      setHeatmapCells((prev) =>
        prev.map((c) => {
          const delta = Math.round((Math.random() - 0.48) * 4);
          const nextAct = Math.max(45, Math.min(100, c.activityPct + delta));
          return {
            ...c,
            activityPct: nextAct,
            qOpsFlux: Math.round(nextAct * 20.48),
          };
        })
      );
    }, 2200);
    return () => clearInterval(fluxTimer);
  }, []);

  // Process telemetry data into shader hotspot uniforms and evaluate fragment field over the hologram grid surface
  useEffect(() => {
    const canvas = shaderCanvasRef.current;
    if (!canvas || !showHeatmapOverlay) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Dark cosmic hologram grid substrate
    ctx.fillStyle = '#040710';
    ctx.fillRect(0, 0, width, height);

    // Convert telemetry signalData + top heatmapCells into normalized shader hotspot uniforms
    const hotspots: DimensionalHotspotUniform[] = signalData.slice(0, 5).map((sig) => {
      const rad = (sig.angleDeg * Math.PI) / 180;
      const normDist = (sig.distancePct / 100) * 0.72;
      return {
        x: 0.5 + Math.cos(rad) * normDist * 0.5,
        z: 0.5 + Math.sin(rad) * normDist * 0.5,
        intensity: sig.activityPct / 100,
        radius: 0.22 + (sig.activityPct / 100) * 0.16,
      };
    });

    // Add selected high-intensity sector hotspot
    hotspots.push({
      x: 0.5,
      z: 0.5,
      intensity: selectedCell.activityPct / 100,
      radius: 0.30,
    });

    // Render shader Gaussian-Lorentzian thermal lobes directly onto the hologram grid surface
    ctx.globalCompositeOperation = 'lighter';
    hotspots.forEach((h, idx) => {
      if (heatmapFilter === 'HIGH_FLUX' && h.intensity < 0.85) return;
      const cx = h.x * width;
      const cy = h.z * height;
      const rPx = h.radius * width;
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, rPx);

      if (shaderPalette === 'THERMAL_PLASMA') {
        grad.addColorStop(0, `rgba(239, 68, 68, ${(h.intensity * 0.72).toFixed(2)})`);
        grad.addColorStop(0.45, `rgba(245, 158, 11, ${(h.intensity * 0.45).toFixed(2)})`);
        grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
      } else {
        const isPeak = h.intensity >= 0.94 || idx === hotspots.length - 1;
        grad.addColorStop(
          0,
          isPeak
            ? `rgba(212, 175, 55, ${(h.intensity * 0.70).toFixed(2)})`
            : `rgba(139, 92, 246, ${(h.intensity * 0.68).toFixed(2)})`
        );
        grad.addColorStop(0.5, `rgba(6, 182, 212, ${(h.intensity * 0.42).toFixed(2)})`);
        grad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, rPx, 0, Math.PI * 2);
      ctx.fill();
    });

    // Perspective Hologram Grid Surface Wireframe Lines
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.26)';
    ctx.lineWidth = 1;
    const cols = 8;
    const rows = 5;
    for (let c = 0; c <= cols; c++) {
      const xTop = width * 0.12 + (c / cols) * (width * 0.76);
      const xBot = (c / cols) * width;
      ctx.beginPath();
      ctx.moveTo(xTop, 6);
      ctx.lineTo(xBot, height - 4);
      ctx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      const t = r / rows;
      const y = 6 + Math.pow(t, 1.15) * (height - 10);
      const inset = (1 - t) * (width * 0.12);
      ctx.beginPath();
      ctx.moveTo(inset, y);
      ctx.lineTo(width - inset, y);
      ctx.stroke();
    }
  }, [signalData, heatmapCells, selectedCell, showHeatmapOverlay, heatmapFilter, shaderPalette, sweepAngle]);

  const visibleCells =
    heatmapFilter === 'HIGH_FLUX'
      ? heatmapCells.filter((c) => c.activityPct >= 85)
      : heatmapCells;

  return (
    <div className="p-4 rounded-xl bg-[#070b16] border border-white/10 space-y-3">
      {/* Header & Dynamic Heatmap Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">
            Quantum Radar Pulse &amp; Shader-Based Dimensional Heatmap
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              playTone(660, 0.03);
              setShowHeatmapOverlay((v) => !v);
            }}
            className={`px-2.5 py-1 rounded-lg font-mono text-xs border flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              showHeatmapOverlay
                ? 'bg-violet-950/70 border-violet-400/50 text-violet-200'
                : 'bg-black/40 border-white/10 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>{showHeatmapOverlay ? 'Shader Heatmap: ON' : 'Shader Heatmap: OFF'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playTone(700, 0.03);
              setShaderPalette((p) => (p === 'QUANTUM_FLUX' ? 'THERMAL_PLASMA' : 'QUANTUM_FLUX'));
            }}
            className="px-2.5 py-1 rounded-lg font-mono text-xs border bg-black/50 border-amber-500/40 text-amber-200 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{shaderPalette === 'QUANTUM_FLUX' ? 'Shader: Quantum Flux' : 'Shader: Thermal Plasma'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playTone(620, 0.03);
              setHeatmapFilter((f) => (f === 'ALL' ? 'HIGH_FLUX' : 'ALL'));
            }}
            className={`px-2.5 py-1 rounded-lg font-mono text-xs border flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              heatmapFilter === 'HIGH_FLUX'
                ? 'bg-cyan-950/70 border-cyan-400/50 text-cyan-200'
                : 'bg-black/40 border-white/10 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{heatmapFilter === 'HIGH_FLUX' ? 'High Flux (≥85%)' : 'All Grid Sectors'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Radar Polar Sweep + Shader-Evaluated Hologram Grid Surface Heatmap Overlay */}
        <div className="md:col-span-5 flex flex-col items-center justify-center space-y-3">
          <div className="relative w-48 h-48 rounded-full bg-[#040710] border border-cyan-500/30 flex items-center justify-center overflow-hidden">
            {/* Dynamic Heatmap Thermal Zones inside Radar Navigation Grid */}
            {showHeatmapOverlay && (
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                style={{
                  background:
                    shaderPalette === 'THERMAL_PLASMA'
                      ? 'radial-gradient(circle at 62% 34%, rgba(239, 68, 68, 0.44) 0%, transparent 45%), radial-gradient(circle at 35% 68%, rgba(245, 158, 11, 0.38) 0%, transparent 48%)'
                      : 'radial-gradient(circle at 62% 34%, rgba(139, 92, 246, 0.42) 0%, transparent 45%), radial-gradient(circle at 35% 68%, rgba(6, 182, 212, 0.38) 0%, transparent 48%), radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.28) 0%, transparent 55%)',
                }}
              />
            )}

            {/* Concentric Rings */}
            <div className="absolute w-36 h-36 rounded-full border border-cyan-500/20" />
            <div className="absolute w-24 h-24 rounded-full border border-cyan-500/20" />
            <div className="absolute w-12 h-12 rounded-full border border-cyan-500/20" />
            <div className="absolute w-full h-[1px] bg-cyan-500/15" />
            <div className="absolute h-full w-[1px] bg-cyan-500/15" />

            {/* Rotating Sweep Beam */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                transform: `rotate(${sweepAngle}deg)`,
                background:
                  'conic-gradient(from 0deg, rgba(6, 182, 212, 0.34) 0deg, rgba(139, 92, 246, 0.12) 50deg, transparent 95deg)',
              }}
            />

            {/* Plotted Telemetry Particle Blips & High-Activity Halos */}
            {signalData.map((pt) => {
              const rad = (pt.angleDeg * Math.PI) / 180;
              const r = (pt.distancePct / 100) * 82;
              const cx = 96 + Math.cos(rad) * r;
              const cy = 96 + Math.sin(rad) * r;
              const isHighActivity = pt.activityPct >= 90;
              return (
                <div
                  key={pt.id}
                  style={{ left: `${cx}px`, top: `${cy}px` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                  title={`${pt.label} · Activity ${pt.activityPct}% · Latency ${pt.latencyMs}ms`}
                >
                  {showHeatmapOverlay && isHighActivity && (
                    <span className="absolute w-7 h-7 rounded-full bg-violet-500/30 animate-ping" />
                  )}
                  <span
                    className={`relative w-2.5 h-2.5 rounded-full ${
                      pt.status === 'STANDBY_BUFFER'
                        ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                        : isHighActivity
                        ? 'bg-violet-300 shadow-[0_0_10px_#8b5cf6]'
                        : 'bg-cyan-400 shadow-[0_0_8px_#06b6d4]'
                    }`}
                  />
                </div>
              );
            })}

            <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] z-10" />
          </div>

          {/* Shader-Based PlaneGeometry Overlay (HeatmapShader.ts) */}
          {showHeatmapOverlay && (
            <div className="w-full rounded-lg bg-[#040710] border border-cyan-500/30 p-2 space-y-1.5">
              <div className="text-[10px] font-mono text-cyan-300 flex items-center justify-between">
                <span>PLANEGEOMETRY SHADER OVERLAY (HeatmapShader.ts)</span>
                <button
                  type="button"
                  onClick={() => setShowShaderSource((s) => !s)}
                  className="text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Code2 className="w-3 h-3" />
                  <span>{showShaderSource ? 'Hide GLSL' : 'GLSL'}</span>
                </button>
              </div>
              <canvas
                ref={shaderCanvasRef}
                width={280}
                height={92}
                className="w-full h-[84px] rounded border border-cyan-500/20 block bg-[#040710]"
              />
              {gpuBufferStats && (
                <div className="flex flex-wrap items-center justify-between gap-1 text-[9px] font-mono text-emerald-300 bg-emerald-950/30 border border-emerald-500/30 px-2 py-1 rounded">
                  <span>
                    GPU BufferAttribute: <strong>{gpuBufferStats.attributeName}</strong> + <strong>{gpuBufferStats.zoneAttributeName}</strong>
                  </span>
                  <span>
                    {gpuBufferStats.vertexCount} Verts · {(gpuBufferStats.byteLength / 1024).toFixed(1)} KB · -{gpuBufferStats.cpuLoadReductionPct}% CPU
                  </span>
                </div>
              )}
              {showShaderSource && (
                <pre className="p-2 rounded bg-black/80 border border-white/10 text-[9px] text-cyan-200 max-h-28 overflow-y-auto leading-tight select-all">
                  {`// HeatmapShader.ts (GPU BufferAttribute + PlaneGeometry 8x5x36)\n${HEATMAP_VERTEX_SHADER.trim().slice(0, 290)}...\n${HEATMAP_FRAGMENT_SHADER.trim().slice(0, 260)}...`}
                </pre>
              )}
            </div>
          )}

          <div className="text-[11px] font-mono text-zinc-400 tabular-nums">
            Hotspot: <strong className="text-violet-300">{selectedCell.sectorCode}</strong> ({selectedCell.activityPct}% Flux · {selectedCell.qOpsFlux} QOps/s)
          </div>
        </div>

        {/* Navigation Grid Dimensional Activity Heatmap Matrix + Signal Telemetry */}
        <div className="md:col-span-7 space-y-3 font-mono text-xs tabular-nums">
          {showHeatmapOverlay && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>NAVIGATION GRID ACTIVITY HEATMAP (CLICK SECTOR)</span>
                <span>Violet ≥90% · Cyan 75–89% · Amber &lt;75%</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {visibleCells.map((cell) => {
                  const isHigh = cell.activityPct >= 90;
                  const isMid = cell.activityPct >= 75 && cell.activityPct < 90;
                  const isSelected = selectedCell.id === cell.id;
                  return (
                    <button
                      key={cell.id}
                      type="button"
                      onClick={() => {
                        playTone(680, 0.02);
                        setSelectedCell(cell);
                      }}
                      className={`p-1.5 rounded-lg border text-left transition-colors cursor-pointer ${
                        isHigh
                          ? 'bg-violet-950/60 border-violet-500/50 text-violet-200'
                          : isMid
                          ? 'bg-cyan-950/50 border-cyan-500/40 text-cyan-200'
                          : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                      } ${isSelected ? 'ring-1 ring-white/70' : ''}`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-semibold">{cell.sectorCode}</span>
                        <span>{cell.activityPct}%</span>
                      </div>
                      <div className="text-[9px] text-zinc-400 mt-0.5">
                        {cell.dimensionRef} · {cell.qOpsFlux} QOps
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Particle Stream Signal List */}
          <div className="space-y-1.5">
            {signalData.slice(0, 4).map((sig) => (
              <div
                key={sig.id}
                className="p-2 rounded-lg bg-black/40 border border-white/8 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="text-zinc-200 font-medium truncate">{sig.label}</div>
                  <div className="text-[11px] text-zinc-400">
                    {sig.sector} · Activity {sig.activityPct}% · Port {sig.port}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-cyan-300 font-semibold">{sig.latencyMs.toFixed(2)} ms</div>
                  <div className="text-[10px] text-emerald-400 flex items-center justify-end gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Δ0=0.000%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-zinc-400 tabular-nums">
        <span className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>Isolation Buffer: Chamber 02 Buffer Gamma [STANDBY]</span>
        </span>
        <span>Refresh: {refreshRate}Hz · HSM Quorum 10/10</span>
      </div>
    </div>
  );
};

export const QuantumRadarPulse = QuantumRadar;

export default QuantumRadar;
