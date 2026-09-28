import React, { useState, useRef, useCallback } from 'react';
import { Crosshair, Orbit, Sparkles } from 'lucide-react';

export interface VectorDisplacement {
  dx: number;
  dy: number;
  dz: number;
  magnitude: number;
  angleDeg: number;
  fieldTesla: number;
  normX: number; // 0 to 100%
  normY: number; // 0 to 100%
}

export interface GravitationalHologramContainerProps {
  phaseCode: 'PHASE_B' | 'PHASE_C';
  phaseTitle: string;
  phaseSubtitle?: string;
  resilienceAccentHex?: string;
  glitchIntensity?: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * Mouse-responsive 3D Gravitational Distortion Container for PhaseB and PhaseC Hologram UI views.
 * Calculates real-time 3D vector displacement based on pointer coordinates to create a tactile field effect.
 */
export const GravitationalHologramContainer: React.FC<GravitationalHologramContainerProps> = ({
  phaseCode,
  phaseTitle,
  phaseSubtitle,
  resilienceAccentHex = '#06B6D4',
  glitchIntensity = 0,
  children,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [gravityEnabled, setGravityEnabled] = useState<boolean>(true);
  const [vectorField, setVectorField] = useState<VectorDisplacement>({
    dx: 0,
    dy: 0,
    dz: 0,
    magnitude: 0,
    angleDeg: 0,
    fieldTesla: 1.42,
    normX: 50,
    normY: 50,
  });

  const handlePointerMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!gravityEnabled || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / Math.max(1, rect.width); // 0..1
      const relY = (e.clientY - rect.top) / Math.max(1, rect.height); // 0..1

      // Normalized centered coordinates (-1 to +1)
      const cx = relX * 2 - 1;
      const cy = relY * 2 - 1;
      const rSq = cx * cx + cy * cy;
      const r = Math.min(1.414, Math.sqrt(rSq));

      // Gravitational potential well depth (Gaussian Lorentzian curve)
      const wellDepth = Math.exp(-rSq * 1.65);
      const dx = +(cx * 4.8 * wellDepth).toFixed(2);
      const dy = +(-cy * 4.8 * wellDepth).toFixed(2);
      const dz = +(-wellDepth * 3.4).toFixed(2);
      const magnitude = +Math.sqrt(dx * dx + dy * dy + dz * dz).toFixed(2);
      const angleDeg = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
      const fieldTesla = +(1.42 + wellDepth * 1.18).toFixed(2);

      setVectorField({
        dx,
        dy,
        dz,
        magnitude,
        angleDeg,
        fieldTesla,
        normX: +(relX * 100).toFixed(1),
        normY: +(relY * 100).toFixed(1),
      });
    },
    [gravityEnabled]
  );

  const handlePointerEnter = () => {
    if (gravityEnabled) setIsHovering(true);
  };

  const handlePointerLeave = () => {
    setIsHovering(false);
    setVectorField((prev) => ({
      ...prev,
      dx: 0,
      dy: 0,
      dz: 0,
      magnitude: 0,
      fieldTesla: 1.42,
      normX: 50,
      normY: 50,
    }));
  };

  const tiltX = isHovering && gravityEnabled ? (vectorField.dy * 0.42).toFixed(2) : '0.00';
  const tiltY = isHovering && gravityEnabled ? (vectorField.dx * 0.42).toFixed(2) : '0.00';
  const translateZ = isHovering && gravityEnabled ? (vectorField.dz * 1.5).toFixed(1) : '0.0';

  return (
    <div
      ref={containerRef}
      onMouseMove={handlePointerMove}
      onMouseEnter={handlePointerEnter}
      onMouseLeave={handlePointerLeave}
      style={{ perspective: '1400px' }}
      className={`relative rounded-2xl border border-cyan-500/20 bg-[#050814]/90 p-3 sm:p-4 transition-colors duration-300 overflow-hidden ${className}`}
    >
      {/* Dynamic Gravitational Field Lens & Vector Displacement Mesh */}
      {gravityEnabled && isHovering && (
        <div
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-200"
          style={{
            background: `radial-gradient(380px circle at ${vectorField.normX}% ${vectorField.normY}%, ${resilienceAccentHex}22 0%, rgba(139, 92, 246, 0.10) 42%, transparent 75%)`,
          }}
        />
      )}

      {/* Glitch Distortion Pulse Overlay when Chaos Anomaly is active */}
      {glitchIntensity > 0.05 && (
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-35"
          style={{
            background:
              'repeating-linear-gradient(180deg, rgba(239,68,68,0.14) 0px, rgba(6,182,212,0.08) 2px, transparent 4px, transparent 8px)',
          }}
        />
      )}

      {/* Top Phase & Vector Displacement Telemetry Strip */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-3 border-b border-white/10 font-mono text-xs tabular-nums">
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 rounded font-semibold text-[11px] border"
            style={{
              backgroundColor: `${resilienceAccentHex}18`,
              borderColor: `${resilienceAccentHex}55`,
              color: resilienceAccentHex,
            }}
          >
            {phaseCode === 'PHASE_B' ? 'PHASE B · HOLOGRAM GRID & RADAR' : 'PHASE C · ASSURANCE & RECOVERY'}
          </span>
          <span className="text-white font-semibold">{phaseTitle}</span>
          {phaseSubtitle && (
            <span className="text-zinc-400 hidden md:inline">· {phaseSubtitle}</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="px-2.5 py-0.5 rounded bg-black/60 border border-white/10 text-[11px] text-zinc-300 flex items-center gap-1.5">
            <Crosshair className="w-3 h-3 text-cyan-400" />
            <span>
              {isHovering && gravityEnabled
                ? `ΔV(${vectorField.dx}, ${vectorField.dy}, ${vectorField.dz}) · |Δr|=${vectorField.magnitude} · ${vectorField.fieldTesla}T`
                : '3D Gravity Field: Move Pointer to Warp Space'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setGravityEnabled((v) => !v)}
            className={`px-2 py-0.5 rounded border text-[11px] flex items-center gap-1 cursor-pointer transition-colors ${
              gravityEnabled
                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-200'
                : 'bg-black/40 border-white/10 text-zinc-400'
            }`}
          >
            <Orbit className="w-3 h-3" />
            <span>{gravityEnabled ? '3D Field: ON' : '3D Field: OFF'}</span>
          </button>
        </div>
      </div>

      {/* 3D Tactile Distorted Inner Container */}
      <div
        className="relative z-10 transition-transform duration-150 ease-out"
        style={{
          transform:
            isHovering && gravityEnabled
              ? `rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(${translateZ}px)`
              : 'rotateX(0deg) rotateY(0deg) translateZ(0px)',
          transformStyle: 'preserve-3d',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const PhaseBHologramContainer: React.FC<
  Omit<GravitationalHologramContainerProps, 'phaseCode'>
> = (props) => <GravitationalHologramContainer phaseCode="PHASE_B" {...props} />;

export const PhaseCHologramContainer: React.FC<
  Omit<GravitationalHologramContainerProps, 'phaseCode'>
> = (props) => <GravitationalHologramContainer phaseCode="PHASE_C" {...props} />;

export const PhaseB = PhaseBHologramContainer;
export const PhaseC = PhaseCHologramContainer;

export default GravitationalHologramContainer;
