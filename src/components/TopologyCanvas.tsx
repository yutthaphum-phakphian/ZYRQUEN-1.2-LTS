import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw, Network, Sparkles, X, Shield, Cpu, Activity, Database, Lock } from 'lucide-react';
import { playTone } from './AudioSynthesizer';

interface TopologyNode {
  id: string;
  label: string;
  category: 'root' | 'governance' | 'quantum' | 'telemetry' | 'security';
  x: number;
  y: number;
  initialX: number;
  initialY: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  connections: string[];
  status: string;
  description: string;
  hash: string;
}

export const TopologyCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);

  const initialNodesData: TopologyNode[] = [
    {
      id: 'n1',
      label: 'Gold Master Root (SHA-256)',
      category: 'root',
      x: 0.5,
      y: 0.45,
      initialX: 0.5,
      initialY: 0.45,
      vx: 0,
      vy: 0,
      radius: 20,
      color: '#F59E0B',
      connections: ['n2', 'n3', 'n4', 'n5'],
      status: 'FROZEN LTS #14,902',
      description: 'Canonical immutable Merkle root sealed with SHA-256 hash digest.',
      hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    },
    {
      id: 'n2',
      label: '31-Phase Verification Matrix',
      category: 'governance',
      x: 0.25,
      y: 0.28,
      initialX: 0.25,
      initialY: 0.28,
      vx: 0,
      vy: 0,
      radius: 15,
      color: '#8B5CF6',
      connections: ['n1', 'n6'],
      status: '31/31 PASSED',
      description: 'Deterministic acceptance pipeline enforcing zero-drift invariant execution.',
      hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
    },
    {
      id: 'n3',
      label: 'Command Fabric v2 (851.9 QOps)',
      category: 'quantum',
      x: 0.75,
      y: 0.28,
      initialX: 0.75,
      initialY: 0.28,
      vx: 0,
      vy: 0,
      radius: 16,
      color: '#06B6D4',
      connections: ['n1', 'n7'],
      status: '851.9 QOps ONLINE',
      description: 'Quantum state arbitration layer synchronizing 768-qubit entanglement.',
      hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
    },
    {
      id: 'n4',
      label: 'Ω601–Ω1000 Sovereign Gates',
      category: 'security',
      x: 0.25,
      y: 0.72,
      initialX: 0.25,
      initialY: 0.72,
      vx: 0,
      vy: 0,
      radius: 15,
      color: '#10B981',
      connections: ['n1', 'n8'],
      status: '400 GATES ENFORCED',
      description: 'Air-gapped cryptographic hardware security modules enforcing zero trust.',
      hash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a'
    },
    {
      id: 'n5',
      label: 'Post-Quantum Evidence Ledger V25',
      category: 'governance',
      x: 0.75,
      y: 0.72,
      initialX: 0.75,
      initialY: 0.72,
      vx: 0,
      vy: 0,
      radius: 16,
      color: '#3B82F6',
      connections: ['n1', 'n8'],
      status: '14,902 EVIDENCE BLOCKS',
      description: 'Multi-signature notary log bound to Thai Legal Section 26 & 28 frameworks.',
      hash: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d'
    },
    {
      id: 'n6',
      label: 'Sovereign World Model (SimA)',
      category: 'quantum',
      x: 0.12,
      y: 0.48,
      initialX: 0.12,
      initialY: 0.48,
      vx: 0,
      vy: 0,
      radius: 12,
      color: '#8B5CF6',
      connections: ['n2'],
      status: 'COHERENT L4',
      description: 'Predictive multi-agent digital twin simulating adversarial telemetry.',
      hash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'
    },
    {
      id: 'n7',
      label: 'OpenTelemetry Sensor Stream',
      category: 'telemetry',
      x: 0.88,
      y: 0.48,
      initialX: 0.88,
      initialY: 0.48,
      vx: 0,
      vy: 0,
      radius: 12,
      color: '#06B6D4',
      connections: ['n3'],
      status: '1.2ms REALTIME',
      description: 'Distributed cryo-sensor network monitoring hardware thermals & drift.',
      hash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'
    },
    {
      id: 'n8',
      label: 'Zero Trust Guard (#EP-SOVEREIGN-01)',
      category: 'security',
      x: 0.5,
      y: 0.86,
      initialX: 0.5,
      initialY: 0.86,
      vx: 0,
      vy: 0,
      radius: 14,
      color: '#10B981',
      connections: ['n4', 'n5'],
      status: 'SECURED & IMMUTABLE',
      description: 'Continuous mutual attestation validating cryptographic credentials.',
      hash: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb'
    },
  ];

  const nodesRef = useRef<TopologyNode[]>(initialNodesData);

  const resetTopology = () => {
    nodesRef.current.forEach((n) => {
      n.x = n.initialX;
      n.y = n.initialY;
    });
    playTone(660, 0.04);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let isDragging = false;
    let draggedNodeIndex: number | null = null;
    let currentWidth = 600;
    let currentHeight = 340;

    const resize = () => {
      const parent = containerRef.current || canvas.parentElement;
      const rect = parent ? parent.getBoundingClientRect() : canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(rect.width || 500, 300);
      const h = Math.max(rect.height || 340, 240);

      currentWidth = w;
      currentHeight = h;

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

    const getPos = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    const handlePointerDown = (clientX: number, clientY: number) => {
      const pos = getPos(clientX, clientY);
      const nodes = nodesRef.current;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const nx = n.x * currentWidth;
        const ny = n.y * currentHeight;
        const dist = Math.hypot(nx - pos.x, ny - pos.y);
        if (dist < n.radius + 12) {
          isDragging = true;
          draggedNodeIndex = i;
          setSelectedNode(n);
          playTone(720, 0.03);
          return;
        }
      }
    };

    const handlePointerMove = (clientX: number, clientY: number) => {
      if (isDragging && draggedNodeIndex !== null) {
        const pos = getPos(clientX, clientY);
        nodesRef.current[draggedNodeIndex].x = Math.max(0.06, Math.min(0.94, pos.x / currentWidth));
        nodesRef.current[draggedNodeIndex].y = Math.max(0.08, Math.min(0.92, pos.y / currentHeight));
      }
    };

    const handlePointerUp = () => {
      isDragging = false;
      draggedNodeIndex = null;
    };

    const onMouseDown = (e: MouseEvent) => handlePointerDown(e.clientX, e.clientY);
    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    const onMouseUp = () => handlePointerUp();

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchEnd = () => handlePointerUp();

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    let pulse = 0;

    const render = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, currentWidth, currentHeight);
      pulse += 0.025;

      const nodes = nodesRef.current;
      const cx = currentWidth / 2;
      const cy = currentHeight / 2;

      // 1. Ambient holographic radar grid
      const radarGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(cx, cy));
      radarGrad.addColorStop(0, 'rgba(6, 182, 212, 0.08)');
      radarGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.03)');
      radarGrad.addColorStop(1, 'rgba(4, 6, 14, 0)');
      ctx.fillStyle = radarGrad;
      ctx.fillRect(0, 0, currentWidth, currentHeight);

      // Radar Concentric Circles
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      [60, 120, 180, 240].forEach((r) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Subtle Grid
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.035)';
      const step = 45;
      for (let x = step; x < currentWidth; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, currentHeight);
        ctx.stroke();
      }
      for (let y = step; y < currentHeight; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(currentWidth, y);
        ctx.stroke();
      }

      // 2. Draw Connections with glowing data pulses
      nodes.forEach((node) => {
        const nx = node.x * currentWidth;
        const ny = node.y * currentHeight;

        node.connections.forEach((targetId) => {
          const target = nodes.find((n) => n.id === targetId);
          if (!target) return;

          const tx = target.x * currentWidth;
          const ty = target.y * currentHeight;

          // Connecting line gradient
          const linkGrad = ctx.createLinearGradient(nx, ny, tx, ty);
          linkGrad.addColorStop(0, `${node.color}55`);
          linkGrad.addColorStop(1, `${target.color}55`);

          ctx.beginPath();
          ctx.moveTo(nx, ny);
          ctx.lineTo(tx, ty);
          ctx.strokeStyle = linkGrad;
          ctx.lineWidth = 1.6;
          ctx.stroke();

          // Flowing data packets (multiple per link)
          for (let pIdx = 0; pIdx < 2; pIdx++) {
            const offset = pIdx * Math.PI;
            const progress = (Math.sin(pulse * 1.5 + nx * 0.01 + offset) + 1) / 2;
            const px = nx + (tx - nx) * progress;
            const py = ny + (ty - ny) * progress;

            ctx.beginPath();
            ctx.arc(px, py, 2.2, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = target.color;
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        });
      });

      // 3. Draw Nodes
      nodes.forEach((node) => {
        const nx = node.x * currentWidth;
        const ny = node.y * currentHeight;
        const isSelected = selectedNode?.id === node.id;

        // Outer pulsating halo
        ctx.beginPath();
        ctx.arc(nx, ny, node.radius + 6 + Math.sin(pulse + nx) * 2, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? `${node.color}44` : `${node.color}18`;
        ctx.fill();

        // Node main circle
        ctx.beginPath();
        ctx.arc(nx, ny, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = isSelected ? 18 : 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inner glowing core
        ctx.beginPath();
        ctx.arc(nx, ny, node.radius * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        // Node Label
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, nx, ny + node.radius + 14);

        // Status badge
        ctx.fillStyle = isSelected ? '#38BDF8' : '#94A3B8';
        ctx.font = '9px monospace';
        ctx.fillText(node.status, nx, ny + node.radius + 25);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', resize);

      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      canvas.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [selectedNode]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden rounded-[22px] bg-gradient-to-b from-[#080a14] via-[#050711] to-[#04050b]"
    >
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

      {/* Top Left HUD */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-violet-400 text-[10px] font-mono pointer-events-none">
        <Network className="w-3.5 h-3.5" />
        <span className="font-semibold tracking-wider">TOPOLOGY MESH</span>
        <span className="text-zinc-500">•</span>
        <span className="text-zinc-300">8 NODES / 14 EDGES</span>
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-lg">
        <button
          onClick={resetTopology}
          title="Reset Node Layout"
          className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white text-[10px] font-mono transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Layout</span>
        </button>
      </div>

      {/* Selected Node Inspector Drawer */}
      {selectedNode && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm bg-[#0a0d1a]/95 backdrop-blur-xl border border-cyan-500/30 p-3.5 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full ring-2 ring-white/20"
                style={{ backgroundColor: selectedNode.color }}
              />
              <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 tracking-wider">
                {selectedNode.category} Node
              </span>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-sm font-semibold text-white mt-1">{selectedNode.label}</div>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{selectedNode.description}</p>

          <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono">
            <span className="text-zinc-500">Hash: {selectedNode.hash.substring(0, 16)}...</span>
            <span className="text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              {selectedNode.status}
            </span>
          </div>
        </div>
      )}

      {/* Helper Footer */}
      {!selectedNode && (
        <div className="absolute bottom-3 right-3 text-[9px] font-mono text-zinc-500 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-md border border-white/5 pointer-events-none hidden sm:flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-violet-400" />
          <span>Click &amp; Drag Nodes &bull; Realtime Dynamic Topology</span>
        </div>
      )}
    </div>
  );
};
