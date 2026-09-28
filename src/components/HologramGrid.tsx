import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Compass,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  ShieldCheck,
  Crosshair,
  Flame,
  Sparkles,
} from 'lucide-react';
import { MultiverseDimensionNode, PanControlState } from '../hooks/useQuantumState';
import {
  createQuantumLatticeMaterial,
  createSovereignGoldSealMaterial,
  createDimensionalHeatmapShaderMaterial,
} from '../utils/hologramMaterial';
import { playTone } from './AudioSynthesizer';

export interface HologramGridProps {
  dimensions: MultiverseDimensionNode[];
  zoomLevel: number;
  panControl: PanControlState;
  activeDimensionId?: string;
  onSelectDimension?: (id: string) => void;
  onZoomChange?: (zoom: number) => void;
  onPanChange?: (pan: PanControlState) => void;
  glitchIntensity?: number;
}

export const HologramGrid: React.FC<HologramGridProps> = ({
  dimensions,
  zoomLevel,
  panControl,
  activeDimensionId = 'dim-00',
  onSelectDimension,
  onZoomChange,
  onPanChange,
  glitchIntensity = 0,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const latticeMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const heatmapGroupRef = useRef<THREE.Group | null>(null);
  const targetGravityRef = useRef<{ x: number; z: number; strength: number }>({
    x: 0,
    z: 0,
    strength: 0,
  });

  const [showSurfaceHeatmap, setShowSurfaceHeatmap] = useState<boolean>(true);
  const [gravityHud, setGravityHud] = useState<{
    active: boolean;
    px: number;
    py: number;
    gx: number;
    gz: number;
    dy: number;
    fieldTesla: number;
  }>({
    active: false,
    px: 50,
    py: 50,
    gx: 0,
    gz: 0,
    dy: 0,
    fieldTesla: 0,
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 320;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 6.5, 11.5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // 1. Multiverse Navigation Grid Mk-III Plane with 3D Gravitational Well Shader
    const planeGeo = new THREE.PlaneGeometry(16, 16, 36, 36);
    planeGeo.rotateX(-Math.PI / 2);
    const latticeMat = createQuantumLatticeMaterial({
      primaryColor: '#06B6D4',
      secondaryColor: '#8B5CF6',
      glitchIntensity,
      gravityStrength: 0.0,
    });
    latticeMatRef.current = latticeMat;
    const gridMesh = new THREE.Mesh(planeGeo, latticeMat);
    gridMesh.position.y = -1.2;
    group.add(gridMesh);

    // 2. Central Sovereign Gold Seal Core (#849202)
    const coreGeo = new THREE.IcosahedronGeometry(1.15, 1);
    const goldMat = createSovereignGoldSealMaterial();
    const coreMesh = new THREE.Mesh(coreGeo, goldMat);
    coreMesh.position.set(0, 0.4, 0);
    group.add(coreMesh);

    // 3. Gravitational Singularity Ring Indicator in 3D space
    const wellRingGeo = new THREE.RingGeometry(0.45, 0.95, 32);
    wellRingGeo.rotateX(-Math.PI / 2);
    const wellRingMat = new THREE.MeshBasicMaterial({
      color: 0xd4af37,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0,
      wireframe: true,
    });
    const wellRingMesh = new THREE.Mesh(wellRingGeo, wellRingMat);
    wellRingMesh.position.y = -1.15;
    group.add(wellRingMesh);

    // 4. Shader-Based Dimensional Activity Heatmap Surface directly over the 3D Hologram Grid
    const heatmapGroup = new THREE.Group();
    heatmapGroupRef.current = heatmapGroup;
    group.add(heatmapGroup);

    const hotspotUniforms = dimensions.slice(0, 6).map((d) => ({
      x: d.coordinates[0],
      z: d.coordinates[2],
      intensity: Math.min(1.0, d.qOps / 1050),
      radius: 1.8 + Math.min(1.0, d.qOps / 1200) * 1.1,
    }));
    const heatmapShaderMat = createDimensionalHeatmapShaderMaterial(hotspotUniforms);
    const heatmapPlaneGeo = new THREE.PlaneGeometry(16, 16, 48, 48);
    heatmapPlaneGeo.rotateX(-Math.PI / 2);
    const heatmapShaderMesh = new THREE.Mesh(heatmapPlaneGeo, heatmapShaderMat);
    heatmapShaderMesh.position.y = -1.16;
    heatmapGroup.add(heatmapShaderMesh);

    // 5. Dimension Nodes & Router Gateways
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.4,
    });

    dimensions.forEach((dim) => {
      const [x, y, z] = dim.coordinates;
      const nodeGeo = new THREE.OctahedronGeometry(dim.id === 'dim-00' ? 0.45 : 0.35, 0);
      const nodeMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(dim.accentHex),
        wireframe: true,
      });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.set(x, y, z);
      group.add(nodeMesh);

      const pts = [new THREE.Vector3(0, 0.4, 0), new THREE.Vector3(x, y, z)];
      const linkGeo = new THREE.BufferGeometry().setFromPoints(pts);
      group.add(new THREE.Line(linkGeo, lineMat));
    });

    let frameId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      latticeMat.uniforms.uTime.value = elapsed;
      goldMat.uniforms.uTime.value = elapsed;
      heatmapShaderMat.uniforms.uTime.value = elapsed;
      heatmapShaderMat.uniforms.uSweepAngleRad.value = (elapsed * 1.4) % (Math.PI * 2);

      // Smoothly interpolate 3D gravitational well center & strength
      const curCenter = latticeMat.uniforms.uGravityCenter.value as THREE.Vector2;
      curCenter.x += (targetGravityRef.current.x - curCenter.x) * 0.14;
      curCenter.y += (targetGravityRef.current.z - curCenter.y) * 0.14;

      const curStrength = latticeMat.uniforms.uGravityStrength.value as number;
      const nextStrength = curStrength + (targetGravityRef.current.strength - curStrength) * 0.12;
      latticeMat.uniforms.uGravityStrength.value = nextStrength;

      wellRingMesh.position.set(curCenter.x, -1.15 - nextStrength * 0.85, curCenter.y);
      wellRingMesh.rotation.z = elapsed * 1.8;
      wellRingMat.opacity = Math.min(0.75, nextStrength * 0.65);

      coreMesh.rotation.y = elapsed * 0.45 + curCenter.x * 0.08;
      coreMesh.rotation.x = elapsed * 0.2 + curCenter.y * 0.08;
      group.rotation.y = elapsed * 0.12 + curCenter.x * 0.04;
      group.rotation.x = curCenter.y * 0.03;

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 640;
      const h = container.clientHeight || 320;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      renderer.dispose();
    };
  }, [dimensions]);

  useEffect(() => {
    if (cameraRef.current) {
      const dist = 11.5 / Math.max(0.5, Math.min(2.2, zoomLevel));
      cameraRef.current.position.set(panControl.x * 2, 6.5 + panControl.y, dist);
      cameraRef.current.lookAt(panControl.x, 0, 0);
    }
    if (latticeMatRef.current) {
      latticeMatRef.current.uniforms.uGlitch.value = glitchIntensity;
    }
    if (heatmapGroupRef.current) {
      heatmapGroupRef.current.visible = showSurfaceHeatmap;
    }
  }, [zoomLevel, panControl, glitchIntensity, showSurfaceHeatmap]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1; // -1 to 1
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1; // -1 to 1
    const gx = +(nx * 6.5).toFixed(2);
    const gz = +(ny * 6.5).toFixed(2);
    const radial = Math.min(1, Math.sqrt(nx * nx + ny * ny));
    const dy = +(-Math.exp(-radial * radial * 1.4) * 2.06).toFixed(2);
    const fieldTesla = +(1.42 + (1 - radial * 0.5) * 0.88).toFixed(2);

    targetGravityRef.current = {
      x: gx,
      z: gz,
      strength: 1.25,
    };

    setGravityHud({
      active: true,
      px: ((e.clientX - rect.left) / rect.width) * 100,
      py: ((e.clientY - rect.top) / rect.height) * 100,
      gx,
      gz,
      dy,
      fieldTesla,
    });
  };

  const handleMouseLeave = () => {
    targetGravityRef.current = { x: 0, z: 0, strength: 0 };
    setGravityHud((prev) => ({ ...prev, active: false, dy: 0, fieldTesla: 0 }));
  };

  const activeDim = dimensions.find((d) => d.id === activeDimensionId) || dimensions[0];

  return (
    <div className="p-4 rounded-xl bg-[#070b16] border border-white/10 space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">
            Navigation Grid Mk-III &amp; 3D Gravitational Distortion Space
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 font-mono tabular-nums">
          <button
            type="button"
            onClick={() => {
              playTone(660, 0.03);
              setShowSurfaceHeatmap((v) => !v);
            }}
            className={`px-2 py-0.5 rounded border text-[11px] flex items-center gap-1 cursor-pointer ${
              showSurfaceHeatmap
                ? 'bg-violet-950/70 border-violet-400/50 text-violet-200'
                : 'bg-black/40 border-white/10 text-zinc-400'
            }`}
          >
            <Flame className="w-3 h-3 text-amber-400" />
            <span>{showSurfaceHeatmap ? '3D Grid Heatmap: ON' : '3D Grid Heatmap: OFF'}</span>
          </button>

          <span>
            {gravityHud.active
              ? `Vector Δ(${gravityHud.gx}, ${gravityHud.dy}, ${gravityHud.gz}) · ${gravityHud.fieldTesla}T`
              : 'Move Cursor to Warp 3D Space'}
          </span>
          <span aria-hidden="true">·</span>
          <span className="text-cyan-300">Zoom {zoomLevel.toFixed(1)}x</span>
        </div>
      </div>

      {/* 3D WebGL Hologram Canvas with Tactile Gravitational Distortion */}
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative h-64 sm:h-72 w-full rounded-lg bg-[#040710] border border-cyan-500/20 overflow-hidden cursor-crosshair"
        style={{
          perspective: '1000px',
        }}
      >
        <div
          ref={mountRef}
          className="w-full h-full transition-transform duration-150 ease-out"
          style={{
            transform: gravityHud.active
              ? `rotateX(${(-gravityHud.gz * 0.65).toFixed(2)}deg) rotateY(${(gravityHud.gx * 0.65).toFixed(2)}deg)`
              : 'rotateX(0deg) rotateY(0deg)',
          }}
        />

        {/* Tactile Mouse-Following Gravitational Lens Ring */}
        {gravityHud.active && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full border border-amber-400/40 flex items-center justify-center transition-opacity duration-150"
            style={{
              left: `${gravityHud.px}%`,
              top: `${gravityHud.py}%`,
              background:
                'radial-gradient(circle, rgba(212,175,55,0.16) 0%, rgba(6,182,212,0.10) 45%, transparent 72%)',
            }}
          >
            <div className="w-12 h-12 rounded-full border border-cyan-400/50 flex items-center justify-center">
              <Crosshair className="w-3.5 h-3.5 text-amber-300" />
            </div>
          </div>
        )}

        {/* Zoom / Pan Overlay Controls */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/70 border border-white/10 rounded-lg p-1 font-mono text-xs z-10">
          <button
            type="button"
            onClick={() => {
              playTone(680, 0.03);
              onZoomChange?.(Math.min(2.0, +(zoomLevel + 0.2).toFixed(1)));
            }}
            className="p-1.5 text-zinc-300 hover:text-cyan-300 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              playTone(540, 0.03);
              onZoomChange?.(Math.max(0.6, +(zoomLevel - 0.2).toFixed(1)));
            }}
            className="p-1.5 text-zinc-300 hover:text-cyan-300 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              playTone(600, 0.03);
              onZoomChange?.(1.0);
              onPanChange?.({ x: 0, y: 0, autoRotate: true });
            }}
            className="p-1.5 text-zinc-300 hover:text-amber-300 transition-colors cursor-pointer"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Active Dimension HUD Overlay */}
        {activeDim && (
          <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-lg bg-black/75 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono tabular-nums z-10">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-white font-semibold">
                {activeDim.code}: {activeDim.name}
              </span>
              <span className="text-zinc-500">·</span>
              <span className="text-zinc-300">{activeDim.gateway}</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-300">
              <span>
                Coherence: <strong className="text-emerald-400">{activeDim.coherencePct}%</strong>
              </span>
              <span>·</span>
              <span>
                Dispatch: <strong className="text-cyan-300">{activeDim.qOps} QOps/s</strong>
              </span>
              <span>·</span>
              <span>
                Latency: <strong className="text-amber-300">{activeDim.latencyMs.toFixed(2)} ms</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Dimension Selector Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 font-mono text-xs">
        {dimensions.map((dim) => {
          const isSelected = dim.id === activeDimensionId;
          return (
            <button
              key={dim.id}
              type="button"
              onClick={() => {
                playTone(640, 0.03);
                onSelectDimension?.(dim.id);
              }}
              className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-cyan-950/60 border-cyan-400/60 text-white'
                  : 'bg-black/40 border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-cyan-300">{dim.code}</span>
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
              </div>
              <div className="text-[11px] text-zinc-200 truncate mt-0.5">{dim.sector}</div>
              <div className="text-[10px] text-zinc-400 tabular-nums mt-0.5">
                {dim.sealsBound.toLocaleString()} Seals · {dim.latencyMs}ms
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default HologramGrid;
