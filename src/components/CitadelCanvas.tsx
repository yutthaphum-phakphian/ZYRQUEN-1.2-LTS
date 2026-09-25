import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCcw, ZoomIn, ZoomOut, Eye, Sparkles, Orbit, Compass } from 'lucide-react';
import { playTone } from './AudioSynthesizer';

export interface CitadelCanvasProps {
  className?: string;
  speedMultiplier?: number;
  highlightColor?: string;
  showHud?: boolean;
  wireframeOnly?: boolean;
  interactive?: boolean;
  autoRotate?: boolean;
  onSelectNode?: (nodeInfo: { id: number; label: string; coords: [number, number, number] } | null) => void;
}

interface HoveredNode {
  id: number;
  label: string;
  x: number;
  y: number;
  dist: number;
}

export const CitadelCanvas: React.FC<CitadelCanvasProps> = ({
  className = '',
  speedMultiplier = 1.2,
  highlightColor = '#06B6D4',
  showHud = true,
  wireframeOnly = false,
  interactive = true,
  autoRotate = true,
  onSelectNode,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Interaction & Camera state refs (to avoid re-running canvas loop)
  const angleRef = useRef({ x: 0.35, y: 0.45, z: 0.15 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1.0);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const hoveredNodeRef = useRef<HoveredNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<HoveredNode | null>(null);
  const [rotationTelemetry, setRotationTelemetry] = useState({ yaw: 26, pitch: 20, zoom: 100 });
  const [isPaused, setIsPaused] = useState(false);
  const [showShading, setShowShading] = useState(!wireframeOnly);

  // Sound throttler
  const lastChimeTime = useRef<number>(0);

  const resetCamera = useCallback(() => {
    angleRef.current = { x: 0.35, y: 0.45, z: 0.15 };
    velocityRef.current = { x: 0, y: 0 };
    zoomRef.current = 1.0;
    playTone(680, 0.04);
  }, []);

  const handleZoom = (delta: number) => {
    zoomRef.current = Math.max(0.65, Math.min(1.85, zoomRef.current + delta));
    setRotationTelemetry((prev) => ({ ...prev, zoom: Math.round(zoomRef.current * 100) }));
    playTone(720, 0.02);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;

    // Golden ratio for icosahedron
    const phi = (1 + Math.sqrt(5)) / 2;
    const rawVertices: [number, number, number][] = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
    ];

    const nodeLabels = [
      'Ω-GENESIS', 'ROOT-SHA256', 'FROZEN-CORE', 'ETDA-SEC26',
      'CUSTODIAN-1', 'CUSTODIAN-2', 'PASSPORT-01', 'QUORUM-V4',
      'TOPOLOGY-L1', 'MERKLE-LEAF', 'ZERO-DRIFT', 'INVARIANT-10'
    ];

    // Normalize and scale vertices (radius ~ 92)
    const baseRadius = 90;
    const vertices = rawVertices.map(([x, y, z]) => {
      const len = Math.sqrt(x * x + y * y + z * z);
      return [(x / len) * baseRadius, (y / len) * baseRadius, (z / len) * baseRadius] as [number, number, number];
    });

    // 20 triangular faces of an icosahedron
    const faces: [number, number, number][] = [
      [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
      [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
      [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
    ];

    // Primary Torus Ring: Celestial Golden Equator Ring
    const goldRingCount = 54;
    const goldRingRadius = 135;
    const goldRingPoints: [number, number, number][] = [];
    for (let i = 0; i < goldRingCount; i++) {
      const theta = (i / goldRingCount) * Math.PI * 2;
      goldRingPoints.push([Math.cos(theta) * goldRingRadius, 0, Math.sin(theta) * goldRingRadius]);
    }

    // Secondary Torus Ring: Inclined Cyan Quantum Precession Ring (tilted ~45 degrees)
    const cyanRingCount = 48;
    const cyanRingRadius = 148;
    const cyanRingPoints: [number, number, number][] = [];
    const tiltAngle = Math.PI / 4; // 45 deg tilt
    for (let i = 0; i < cyanRingCount; i++) {
      const theta = (i / cyanRingCount) * Math.PI * 2;
      const rx = Math.cos(theta) * cyanRingRadius;
      const ry = Math.sin(theta) * cyanRingRadius * Math.sin(tiltAngle);
      const rz = Math.sin(theta) * cyanRingRadius * Math.cos(tiltAngle);
      cyanRingPoints.push([rx, ry, rz]);
    }

    // Orbiting energy flux sparks
    const particleCount = 28;
    const particles = Array.from({ length: particleCount }, (_, i) => ({
      orbitRadius: 45 + (i % 5) * 22,
      speed: (0.012 + (i % 6) * 0.004) * (i % 2 === 0 ? 1 : -1),
      currentAngle: (i / particleCount) * Math.PI * 2,
      yOffset: Math.sin(i * 1.5) * 32,
      size: 1.6 + (i % 3) * 0.8,
      color: i % 4 === 0 ? '#F59E0B' : i % 3 === 0 ? '#8B5CF6' : '#06B6D4',
      glow: i % 4 === 0 ? 'rgba(245, 158, 11, 0.9)' : '#06B6D4'
    }));

    let currentW = 600;
    let currentH = 340;

    const resize = () => {
      const parent = containerRef.current || canvas.parentElement;
      const rect = parent ? parent.getBoundingClientRect() : canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(rect.width || 500, 280);
      const h = Math.max(rect.height || 340, 240);

      currentW = w;
      currentH = h;

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resize();
    let resizeRafId: number | null = null;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeRafId !== null) {
        cancelAnimationFrame(resizeRafId);
      }
      resizeRafId = requestAnimationFrame(() => {
        resize();
      });
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    window.addEventListener('resize', resize);

    // Mouse & Touch Orbit Controls
    const onStart = (clientX: number, clientY: number) => {
      if (!interactive) return;
      isDraggingRef.current = true;
      lastMouseRef.current = { x: clientX, y: clientY };
      velocityRef.current = { x: 0, y: 0 };
    };

    const onMove = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const mouseCanvasX = clientX - rect.left;
      const mouseCanvasY = clientY - rect.top;

      if (isDraggingRef.current) {
        const dx = clientX - lastMouseRef.current.x;
        const dy = clientY - lastMouseRef.current.y;
        lastMouseRef.current = { x: clientX, y: clientY };

        velocityRef.current = { x: dx * 0.007, y: dy * 0.007 };
        angleRef.current.y += dx * 0.008;
        angleRef.current.x += dy * 0.008;

        // Clamp X angle to avoid pitch gimbal lock
        angleRef.current.x = Math.max(-Math.PI * 0.48, Math.min(Math.PI * 0.48, angleRef.current.x));
      } else {
        // Detect hover near 3D projected vertices
        const cx = currentW / 2;
        const cy = currentH / 2;
        const zoom = zoomRef.current;
        const perspective = 420;

        let closest: HoveredNode | null = null;
        let minDistance = 24; // Pixel threshold

        vertices.forEach((v, idx) => {
          // Quick test projection for hover
          const rx = v[0] * zoom;
          const ry = v[1] * zoom;
          const rz = v[2] * zoom;

          // 3D rotation transform
          const cosY = Math.cos(angleRef.current.y);
          const sinY = Math.sin(angleRef.current.y);
          const cosX = Math.cos(angleRef.current.x);
          const sinX = Math.sin(angleRef.current.x);

          const x1 = rx * cosY + rz * sinY;
          const z1 = -rx * sinY + rz * cosY;
          const y2 = ry * cosX - z1 * sinX;
          const z2 = ry * sinX + z1 * cosX;

          const scale = perspective / (perspective + z2);
          const screenX = cx + x1 * scale;
          const screenY = cy + y2 * scale;

          const dist = Math.hypot(screenX - mouseCanvasX, screenY - mouseCanvasY);
          if (dist < minDistance && z2 > -150) {
            minDistance = dist;
            closest = {
              id: idx,
              label: nodeLabels[idx] || `NODE-${idx + 1}`,
              x: screenX,
              y: screenY,
              dist
            };
          }
        });

        if (closest !== hoveredNodeRef.current) {
          hoveredNodeRef.current = closest;
          setHoveredNode(closest);
          if (closest && Date.now() - lastChimeTime.current > 350) {
            playTone(840, 0.02, 'sine', 0.03);
            lastChimeTime.current = Date.now();
          }
        }
      }
    };

    const onEnd = () => {
      isDraggingRef.current = false;
    };

    const handleMouseDown = (e: MouseEvent) => onStart(e.clientX, e.clientY);
    const handleMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const handleMouseUp = () => onEnd();

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        onStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handleTouchEnd = () => onEnd();

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      zoomRef.current = Math.max(0.65, Math.min(1.85, zoomRef.current + delta));
      setRotationTelemetry((prev) => ({ ...prev, zoom: Math.round(zoomRef.current * 100) }));
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    // Rendering Engine Loop
    let time = 0;
    let frameCounter = 0;

    const render = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      const width = currentW;
      const height = currentH;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      time += 0.016;
      frameCounter++;

      // Inertial damping & Auto-rotation
      if (!isDraggingRef.current) {
        // Damping velocity
        velocityRef.current.x *= 0.94;
        velocityRef.current.y *= 0.94;
        angleRef.current.y += velocityRef.current.x;
        angleRef.current.x += velocityRef.current.y;

        if (autoRotate && !isPaused) {
          angleRef.current.y += 0.005 * speedMultiplier;
          angleRef.current.z += 0.001 * speedMultiplier;
        }
      }

      // Update HUD telemetry periodically (~every 15 frames)
      if (frameCounter % 15 === 0) {
        setRotationTelemetry({
          yaw: Math.round(((angleRef.current.y % (Math.PI * 2)) * 180) / Math.PI),
          pitch: Math.round(((angleRef.current.x % (Math.PI * 2)) * 180) / Math.PI),
          zoom: Math.round(zoomRef.current * 100)
        });
      }

      const zoom = zoomRef.current;
      const perspective = 420;

      // 3D Matrix Rotation
      const cosX = Math.cos(angleRef.current.x);
      const sinX = Math.sin(angleRef.current.x);
      const cosY = Math.cos(angleRef.current.y);
      const sinY = Math.sin(angleRef.current.y);
      const cosZ = Math.cos(angleRef.current.z);
      const sinZ = Math.sin(angleRef.current.z);

      const rotate3D = (x: number, y: number, z: number): [number, number, number] => {
        // Rot Y
        const x1 = x * cosY + z * sinY;
        const y1 = y;
        const z1 = -x * sinY + z * cosY;

        // Rot X
        const x2 = x1;
        const y2 = y1 * cosX - z1 * sinX;
        const z2 = y1 * sinX + z1 * cosX;

        // Rot Z
        const x3 = x2 * cosZ - y2 * sinZ;
        const y3 = x2 * sinZ + y2 * cosZ;
        const z3 = z2;

        return [x3 * zoom, y3 * zoom, z3 * zoom];
      };

      const project = (rx: number, ry: number, rz: number) => {
        const scale = perspective / (perspective + rz);
        return {
          px: cx + rx * scale,
          py: cy + ry * scale,
          scale,
          z: rz
        };
      };

      // 1. Deep Space Cosmic Radial Glow
      const bgGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, Math.max(cx, cy));
      bgGrad.addColorStop(0, 'rgba(6, 182, 212, 0.12)');
      bgGrad.addColorStop(0.35, 'rgba(245, 158, 11, 0.05)');
      bgGrad.addColorStop(0.7, 'rgba(139, 92, 246, 0.03)');
      bgGrad.addColorStop(1, 'rgba(5, 7, 15, 0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle cybernetic coordinate grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      const step = 40;
      for (let gx = step; gx < width; gx += step) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
        ctx.stroke();
      }
      for (let gy = step; gy < height; gy += step) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }

      // 2. Render Outer Torus Rings
      // A. Golden Celestial Equator Torus Ring
      ctx.beginPath();
      let firstGold = true;
      for (let i = 0; i <= goldRingPoints.length; i++) {
        const pt = goldRingPoints[i % goldRingPoints.length];
        const [rx, ry, rz] = rotate3D(pt[0], pt[1], pt[2]);
        const proj = project(rx, ry, rz);
        if (firstGold) {
          ctx.moveTo(proj.px, proj.py);
          firstGold = false;
        } else {
          ctx.lineTo(proj.px, proj.py);
        }
      }
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.lineWidth = 1.4;
      ctx.shadowColor = '#F59E0B';
      ctx.shadowBlur = 4;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Golden Ring Ticks (Astrolabe / Celestial coordinate markers)
      for (let i = 0; i < goldRingPoints.length; i += 6) {
        const pt = goldRingPoints[i];
        const [rx, ry, rz] = rotate3D(pt[0], pt[1], pt[2]);
        const proj = project(rx, ry, rz);
        ctx.beginPath();
        ctx.arc(proj.px, proj.py, 1.8 * proj.scale, 0, Math.PI * 2);
        ctx.fillStyle = '#F59E0B';
        ctx.fill();
      }

      // B. Cyan Quantum Precession Torus Ring (Tilted 45° with active phase pulse)
      ctx.beginPath();
      let firstCyan = true;
      for (let i = 0; i <= cyanRingPoints.length; i++) {
        const pt = cyanRingPoints[i % cyanRingPoints.length];
        // Counter rotate cyan ring slightly in phase
        const phaseTheta = time * 0.2;
        const rotX = pt[0] * Math.cos(phaseTheta) - pt[2] * Math.sin(phaseTheta);
        const rotZ = pt[0] * Math.sin(phaseTheta) + pt[2] * Math.cos(phaseTheta);
        const [rx, ry, rz] = rotate3D(rotX, pt[1], rotZ);
        const proj = project(rx, ry, rz);
        if (firstCyan) {
          ctx.moveTo(proj.px, proj.py);
          firstCyan = false;
        } else {
          ctx.lineTo(proj.px, proj.py);
        }
      }
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#06B6D4';
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 3. Project 12 Vertices
      const projectedVerts = vertices.map(([vx, vy, vz], idx) => {
        const [rx, ry, rz] = rotate3D(vx, vy, vz);
        return {
          id: idx,
          label: nodeLabels[idx] || `N-${idx}`,
          raw: [vx, vy, vz] as [number, number, number],
          ...project(rx, ry, rz)
        };
      });

      // 4. Render 20 Shaded Golden Facets (Translucent 3D Crystalline Geometry)
      if (showShading) {
        // Sort faces by average depth Z (painter's algorithm)
        const faceDepths = faces.map((faceIndices) => {
          const v0 = projectedVerts[faceIndices[0]];
          const v1 = projectedVerts[faceIndices[1]];
          const v2 = projectedVerts[faceIndices[2]];
          const avgZ = (v0.z + v1.z + v2.z) / 3;

          // Compute 2D surface normal for backface detection & specular angle
          const ax = v1.px - v0.px;
          const ay = v1.py - v0.py;
          const bx = v2.px - v0.px;
          const by = v2.py - v0.py;
          const normalZ = ax * by - ay * bx;

          return { indices: faceIndices, avgZ, normalZ };
        });

        faceDepths.sort((a, b) => a.avgZ - b.avgZ);

        faceDepths.forEach(({ indices, normalZ, avgZ }) => {
          const v0 = projectedVerts[indices[0]];
          const v1 = projectedVerts[indices[1]];
          const v2 = projectedVerts[indices[2]];

          // Facet brightness based on orientation & depth
          const isFrontFacing = normalZ > 0;
          const depthNorm = Math.max(0.1, Math.min(1, (avgZ + 160) / 320));
          const fillAlpha = isFrontFacing ? 0.09 * depthNorm : 0.025 * depthNorm;

          ctx.beginPath();
          ctx.moveTo(v0.px, v0.py);
          ctx.lineTo(v1.px, v1.py);
          ctx.lineTo(v2.px, v2.py);
          ctx.closePath();

          ctx.fillStyle = isFrontFacing
            ? `rgba(245, 158, 11, ${fillAlpha})`
            : `rgba(6, 182, 212, ${fillAlpha})`;
          ctx.fill();

          // Subtle facet inner border
          ctx.strokeStyle = isFrontFacing
            ? `rgba(245, 158, 11, ${0.12 * depthNorm})`
            : `rgba(6, 182, 212, ${0.05 * depthNorm})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        });
      }

      // 5. Render 30 Lattice Edges (Golden rods with moving pulse photons)
      ctx.lineWidth = 1.2;
      for (let i = 0; i < vertices.length; i++) {
        for (let j = i + 1; j < vertices.length; j++) {
          const dx = vertices[i][0] - vertices[j][0];
          const dy = vertices[i][1] - vertices[j][1];
          const dz = vertices[i][2] - vertices[j][2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          // Neighbor distance for icosahedron (edge length ~ 94)
          if (dist < 112) {
            const v0 = projectedVerts[i];
            const v1 = projectedVerts[j];

            const avgZ = (v0.z + v1.z) / 2;
            const alpha = Math.max(0.15, Math.min(0.85, (avgZ + 160) / 280));

            // Edge gradient
            const edgeGrad = ctx.createLinearGradient(v0.px, v0.py, v1.px, v1.py);
            edgeGrad.addColorStop(0, `rgba(245, 158, 11, ${alpha * 0.85})`);
            edgeGrad.addColorStop(0.5, `rgba(6, 182, 212, ${alpha * 0.7})`);
            edgeGrad.addColorStop(1, `rgba(245, 158, 11, ${alpha * 0.85})`);

            ctx.beginPath();
            ctx.moveTo(v0.px, v0.py);
            ctx.lineTo(v1.px, v1.py);
            ctx.strokeStyle = edgeGrad;
            ctx.stroke();

            // Energy packet flow along edges
            const pulsePhase = (Math.sin(time * 2.5 + (i * 3 + j)) + 1) / 2;
            const sparkX = v0.px + (v1.px - v0.px) * pulsePhase;
            const sparkY = v0.py + (v1.py - v0.py) * pulsePhase;

            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 1.4 * v0.scale, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = '#06B6D4';
            ctx.shadowBlur = 4;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      // 6. Central Quantum Singularity Core (Event Horizon & Flux Filaments)
      // Gravitational lens / aura
      const pulseSize = 6 + Math.sin(time * 3) * 1.5;
      const coreGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 28);
      coreGrad.addColorStop(0, '#FFFFFF');
      coreGrad.addColorStop(0.3, 'rgba(6, 182, 212, 0.8)');
      coreGrad.addColorStop(0.6, 'rgba(139, 92, 246, 0.4)');
      coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.arc(cx, cy, 24, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // Singularity core sphere
      ctx.beginPath();
      ctx.arc(cx, cy, pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#06B6D4';
      ctx.shadowBlur = 18;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Filaments connecting Singularity to 4 closest vertices
      const sortedByZ = [...projectedVerts].sort((a, b) => b.z - a.z).slice(0, 4);
      sortedByZ.forEach((v) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(v.px, v.py);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });

      // 7. Orbiting Quantum Flux Particles
      particles.forEach((p) => {
        p.currentAngle += p.speed * speedMultiplier;
        const px = Math.cos(p.currentAngle) * p.orbitRadius;
        const pz = Math.sin(p.currentAngle) * p.orbitRadius;
        const [rx, ry, rz] = rotate3D(px, p.yOffset, pz);
        const proj = project(rx, ry, rz);

        ctx.beginPath();
        ctx.arc(proj.px, proj.py, p.size * proj.scale, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.glow;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 8. Render 12 Vertices with Luminous Bloom & Labels
      projectedVerts.forEach((v) => {
        const isHovered = hoveredNodeRef.current?.id === v.id;
        const depthAlpha = Math.max(0.3, Math.min(1, (v.z + 180) / 280));
        const radius = (isHovered ? 6 : 3.6) * v.scale;

        // Outer halo
        ctx.beginPath();
        ctx.arc(v.px, v.py, radius + (isHovered ? 5 : 3), 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? 'rgba(6, 182, 212, 0.4)' : `rgba(245, 158, 11, ${depthAlpha * 0.25})`;
        ctx.fill();

        // Node center
        ctx.beginPath();
        ctx.arc(v.px, v.py, radius, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? '#FFFFFF' : `rgba(245, 158, 11, ${depthAlpha})`;
        ctx.shadowColor = isHovered ? '#06B6D4' : '#F59E0B';
        ctx.shadowBlur = isHovered ? 14 : 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Micro-tag on high-depth front nodes or hovered
        if (isHovered || (v.z > 20 && zoom > 0.85)) {
          ctx.fillStyle = isHovered ? '#06B6D4' : 'rgba(255, 255, 255, 0.75)';
          ctx.font = isHovered ? 'bold 9px monospace' : '8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(v.label, v.px, v.py + radius + 11);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', resize);

      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      canvas.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [speedMultiplier, highlightColor, autoRotate, isPaused, showShading, interactive]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full select-none overflow-hidden rounded-[22px] bg-gradient-to-b from-[#080a14] via-[#050711] to-[#04050b] ${className}`}
    >
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
      />

      {/* In-Canvas Telemetry HUD (Top Left) */}
      {showHud && (
        <div className="absolute top-3 left-3 pointer-events-none flex flex-col gap-1 text-[10px] font-mono">
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border-white/10 text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-semibold tracking-wider">CITADEL LATTICE 3D</span>
            <span className="text-zinc-500">•</span>
            <span className="text-zinc-300">12V / 30E / 20F</span>
          </div>
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md border-white/5 text-zinc-400 text-[9px]">
            <span>YAW: {rotationTelemetry.yaw}°</span>
            <span>PITCH: {rotationTelemetry.pitch}°</span>
            <span>ZOOM: {rotationTelemetry.zoom}%</span>
          </div>
        </div>
      )}

      {/* In-Canvas HUD Controls (Top Right) */}
      {showHud && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-xl border-white/10 shadow-lg">
          <button
            onClick={() => handleZoom(0.15)}
            title="Zoom In"
            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleZoom(-0.15)}
            title="Zoom Out"
            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setShowShading(!showShading);
              playTone(700, 0.02);
            }}
            title={showShading ? 'Disable Facet Shading (Pure Wireframe)' : 'Enable 3D Facet Shading'}
            className={`p-1.5 rounded-lg transition-colors ${
              showShading ? 'bg-amber-500/20 text-amber-300' : 'hover:bg-white/10 text-zinc-400'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setIsPaused(!isPaused);
              playTone(620, 0.02);
            }}
            title={isPaused ? 'Resume Auto-Orbit' : 'Pause Orbit'}
            className={`p-1.5 rounded-lg transition-colors ${
              !isPaused ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-white/10 text-zinc-400'
            }`}
          >
            <Orbit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetCamera}
            title="Reset Perspective"
            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Interactive Node Inspection Card (Bottom Left) */}
      {hoveredNode && (
        <div className="absolute bottom-3 left-3 bg-[#0a0d1a]/90 backdrop-blur-md border-cyan-500/30 px-3 py-2 rounded-xl text-xs shadow-xl animate-in fade-in zoom-in-95 pointer-events-none">
          <div className="flex items-center gap-1.5 text-amber-400 font-mono text-[10px] uppercase font-bold">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>{hoveredNode.label}</span>
          </div>
          <div className="text-[10px] font-mono text-zinc-300 mt-0.5 flex items-center gap-2">
            <span>Vertex #{hoveredNode.id + 1}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-cyan-400">Cryo-Locked Invariant</span>
          </div>
        </div>
      )}

      {/* Orbit Gesture Helper Tooltip (Bottom Right) */}
      <div className="absolute bottom-3 right-3 text-[9px] font-mono text-zinc-500 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-md border-white/5 pointer-events-none hidden sm:flex items-center gap-1.5">
        <Compass className="w-3 h-3 text-cyan-400 animate-spin" style={{ animationDuration: '10s' }} />
        <span>Drag to rotate • Scroll to zoom</span>
      </div>
    </div>
  );
};
