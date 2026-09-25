import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Compass,
  Zap,
  Radio,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  ChevronRight,
  TrendingUp,
  Cpu,
  Clock,
  Key,
  Copy,
  Check,
  Sliders,
  AlertTriangle,
  ArrowUpRight,
  Maximize2,
} from 'lucide-react';
import {
  MultiversePathProjection,
  PathProjectionNode,
  MultiverseNavigationState,
  HardwareSnapshot,
} from '../types';
import {
  getMultiverseNavigationState,
  subscribeMultiverseNavigation,
  updatePathProjection,
  calculateTelemetryEntropy,
} from '../utils/multiverseNavigationGrid';
import { INITIAL_HARDWARE_SNAPSHOTS } from '../utils/telemetrySnapshot';
import { playTone, playAuditChime, playTelemetryBeep } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';

interface MultiversePathProjectionD3GraphProps {
  snapshots?: HardwareSnapshot[];
  onSelectNode?: (node: PathProjectionNode) => void;
  selectedBranchFilter?: string;
  className?: string;
}

const BRANCH_CONFIG: Record<
  PathProjectionNode['branchType'],
  {
    name: string;
    nameTh: string;
    color: string;
    strokeColor: string;
    glowColor: string;
    bgBadge: string;
    description: string;
  }
> = {
  canonical_anchor: {
    name: 'SSoT Canonical Anchor',
    nameTh: 'แกนสัจจะปฐมภูมิ SSoT',
    color: '#10B981',
    strokeColor: '#059669',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    bgBadge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    description: 'Zero drift Δ0.0% trajectory with 10/10 invariant preservation and Dilithium-5 seal.',
  },
  optimal_warp: {
    name: 'Quantum Warp Corridor',
    nameTh: 'ทางผ่านวาร์ปควอนตัมความเร็วสูง',
    color: '#8B5CF6',
    strokeColor: '#7C3AED',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    bgBadge: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
    description: 'Accelerated continuum pathway with ≤0.12ms transition latency and high coherence.',
  },
  entropy_surge: {
    name: 'Counterfactual Entropy Surge',
    nameTh: 'การผันผวนเอนโทรปีจำลอง',
    color: '#F59E0B',
    strokeColor: '#D97706',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    bgBadge: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    description: 'Simulated high-load thermal stress with Lyapunov dissipative self-stabilization.',
  },
  quarantine_divergence: {
    name: 'Quarantine Fail-Closed Cone',
    nameTh: 'กรวยกักกันความเสี่ยงเบี่ยงเบน',
    color: '#EF4444',
    strokeColor: '#DC2626',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    bgBadge: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
    description: 'Adversarial counterfactual path automatically quarantined with bounded blast radius <2.0%.',
  },
};

export const MultiversePathProjectionD3Graph: React.FC<MultiversePathProjectionD3GraphProps> = ({
  snapshots = INITIAL_HARDWARE_SNAPSHOTS,
  onSelectNode,
  selectedBranchFilter = 'all',
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const [navState, setNavState] = useState<MultiverseNavigationState>(getMultiverseNavigationState);
  const [selectedNode, setSelectedNode] = useState<PathProjectionNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<PathProjectionNode | null>(null);
  const [activeBranch, setActiveBranch] = useState<string>(selectedBranchFilter);
  const [horizonHorizonLimit, setHorizonLimit] = useState<number>(5);
  const [entropyMultiplier, setEntropyMultiplier] = useState<number>(1.0);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);

  // Subscribe to navigation state
  useEffect(() => {
    const unsub = subscribeMultiverseNavigation((state) => {
      setNavState(state);
      if (state.pathProjection && (!selectedNode || !state.pathProjection.nodes.find((n) => n.id === selectedNode.id))) {
        setSelectedNode(state.pathProjection.nodes[0] || null);
      }
    });
    return unsub;
  }, []);

  const projection = navState.pathProjection;

  // Filtered nodes & edges
  const filteredData = useMemo(() => {
    if (!projection) return { nodes: [], edges: [] };

    let nodes = projection.nodes.filter((n) => n.stepHorizon <= horizonHorizonLimit);
    if (activeBranch !== 'all') {
      nodes = nodes.filter((n) => n.branchType === activeBranch || n.stepHorizon === 0);
    }

    const nodeIds = new Set(nodes.map((n) => n.id));
    const edges = projection.edges.filter(
      (e) => nodeIds.has(e.sourceId) && nodeIds.has(e.targetId)
    );

    return { nodes, edges };
  }, [projection, horizonHorizonLimit, activeBranch]);

  // Update projection whenever snapshots change or initial mount
  useEffect(() => {
    updatePathProjection({
      snapshots,
      horizonSteps: horizonHorizonLimit,
      entropyMultiplier,
    });
  }, [snapshots]);

  // Handle Entropy Recalculation
  const handleRecalculate = (newMultiplier = entropyMultiplier) => {
    setIsRecalculating(true);
    playTelemetryBeep();

    setTimeout(() => {
      const updated = updatePathProjection({
        snapshots,
        horizonSteps: horizonHorizonLimit,
        entropyMultiplier: newMultiplier,
      });
      setIsRecalculating(false);
      playAuditChime();
      if (selectedNode) {
        const found = updated.nodes.find((n) => n.id === selectedNode.id);
        if (found) setSelectedNode(found);
      }
    }, 400);
  };

  const handleCopy = (text: string) => {
    copyToClipboard(text);
    setCopiedHash(text);
    playTone(720, 0.05);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // D3 Rendering & Vector Path Layout
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !projection) return;

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 540;

    svg.selectAll('*').remove();

    // Defs for gradients, filters, markers
    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter').attr('id', 'glow-filter').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Arrow markers for branches
    Object.entries(BRANCH_CONFIG).forEach(([key, cfg]) => {
      defs
        .append('marker')
        .attr('id', `marker-${key}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 22)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-4L8,0L0,4')
        .attr('fill', cfg.color);
    });

    // Radial background grid lines pattern
    const centerX = width / 2;
    const centerY = height / 2 + 10;

    const g = svg.append('g').attr('class', 'main-projection-group');

    // Zoom setup
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3.5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomScale(Number(event.transform.k.toFixed(2)));
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Initial transform center
    svg.call(
      zoom.transform,
      d3.zoomIdentity.translate(centerX, centerY).scale(1)
    );

    // 1. Draw Horizon Orbital Rings (T+1 to T+5)
    const ringGroup = g.append('g').attr('class', 'horizon-rings');
    for (let r = 1; r <= horizonHorizonLimit; r++) {
      const radius = r * 85;
      ringGroup
        .append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', radius)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(255, 255, 255, 0.05)')
        .attr('stroke-dasharray', '4 4')
        .attr('stroke-width', 1);

      // Horizon Label
      ringGroup
        .append('text')
        .attr('x', 6)
        .attr('y', -radius + 12)
        .attr('fill', 'rgba(255, 255, 255, 0.25)')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .text(`HORIZON T+${r} (+${r * 45}s)`);
    }

    // 2. Coordinate Map for Nodes
    const nodeCoords: Record<string, { x: number; y: number }> = {};
    const branchAngles: Record<string, number> = {
      canonical_anchor: -Math.PI / 2, // Upward 90 deg
      optimal_warp: -Math.PI / 4, // Up-Right 45 deg
      entropy_surge: (-3 * Math.PI) / 4, // Up-Left 135 deg
      quarantine_divergence: Math.PI / 4, // Down-Right 45 deg
    };

    filteredData.nodes.forEach((node) => {
      if (node.stepHorizon === 0) {
        nodeCoords[node.id] = { x: 0, y: 0 };
      } else {
        const angle = branchAngles[node.branchType] ?? -Math.PI / 2;
        const radius = node.stepHorizon * 85;
        // Add subtle natural entropy jitter
        const jitter = (Math.sin(node.stepHorizon * 2) * 8 * (entropyMultiplier - 1.0));
        nodeCoords[node.id] = {
          x: Math.cos(angle) * (radius + jitter),
          y: Math.sin(angle) * (radius + jitter),
        };
      }
    });

    // 3. Draw Edge Vectors with Curved Bezier Stream
    const edgeGroup = g.append('g').attr('class', 'vector-edges');

    filteredData.edges.forEach((edge) => {
      const source = nodeCoords[edge.sourceId];
      const target = nodeCoords[edge.targetId];
      if (!source || !target) return;

      const cfg = BRANCH_CONFIG[edge.branchType];
      const isSelected =
        selectedNode && (selectedNode.id === edge.sourceId || selectedNode.id === edge.targetId);

      // Draw curved bezier
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const cx = source.x + dx * 0.5 - dy * 0.15;
      const cy = source.y + dy * 0.5 + dx * 0.15;

      const pathData = `M ${source.x} ${source.y} Q ${cx} ${cy} ${target.x} ${target.y}`;

      // Edge shadow/glow
      edgeGroup
        .append('path')
        .attr('d', pathData)
        .attr('fill', 'none')
        .attr('stroke', cfg.color)
        .attr('stroke-width', isSelected ? 3 : 1.5)
        .attr('stroke-opacity', isSelected ? 0.8 : 0.4)
        .attr('stroke-dasharray', edge.branchType === 'quarantine_divergence' ? '5 3' : 'none')
        .attr('marker-end', `url(#marker-${edge.branchType})`);

      // Animated energy pulse particle along trajectory
      const pulseCircle = edgeGroup
        .append('circle')
        .attr('r', isSelected ? 3.5 : 2.5)
        .attr('fill', cfg.color)
        .attr('filter', 'url(#glow-filter)');

      // Transition along path
      const pathNode = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathNode.setAttribute('d', pathData);
      const totalLen = Math.hypot(dx, dy);

      function animateParticle() {
        pulseCircle
          .transition()
          .duration(1800 + edge.branchType.length * 200)
          .ease(d3.easeLinear)
          .attrTween('transform', () => {
            return (t: number) => {
              const curX = source.x + (target.x - source.x) * t;
              const curY = source.y + (target.y - source.y) * t;
              return `translate(${curX}, ${curY})`;
            };
          })
          .on('end', animateParticle);
      }
      animateParticle();
    });

    // 4. Draw Confidence Halos & Nodes
    const nodeGroup = g.append('g').attr('class', 'vector-nodes');

    filteredData.nodes.forEach((node) => {
      const coord = nodeCoords[node.id];
      if (!coord) return;

      const cfg = BRANCH_CONFIG[node.branchType];
      const isSelected = selectedNode?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;
      const isOrigin = node.stepHorizon === 0;

      const nodeG = nodeGroup
        .append('g')
        .attr('transform', `translate(${coord.x}, ${coord.y})`)
        .attr('class', 'cursor-pointer group')
        .on('click', () => {
          setSelectedNode(node);
          if (onSelectNode) onSelectNode(node);
          playTone(isOrigin ? 600 : 500 + node.stepHorizon * 50, 0.06);
        })
        .on('mouseenter', () => {
          setHoveredNode(node);
          playTone(650, 0.02);
        })
        .on('mouseleave', () => {
          setHoveredNode(null);
        });

      // Uncertainty Cone Halo / Probability Radius
      const haloRadius = isOrigin ? 18 : Math.max(16, node.divergenceVector.driftRadius * 1.6);
      nodeG
        .append('circle')
        .attr('r', haloRadius)
        .attr('fill', cfg.color)
        .attr('fill-opacity', isSelected ? 0.22 : 0.08)
        .attr('stroke', cfg.color)
        .attr('stroke-width', isSelected ? 1.5 : 0.8)
        .attr('stroke-opacity', isSelected ? 0.6 : 0.2)
        .attr('stroke-dasharray', isSelected ? 'none' : '3 3')
        .attr('class', isSelected ? 'animate-pulse' : '');

      // Core Node Circle
      const coreRadius = isOrigin ? 12 : isSelected ? 9 : 7;
      nodeG
        .append('circle')
        .attr('r', coreRadius)
        .attr('fill', isOrigin ? '#064E3B' : isSelected ? cfg.color : '#0B0E1A')
        .attr('stroke', isOrigin ? '#34D399' : cfg.color)
        .attr('stroke-width', isSelected ? 2.5 : 1.8)
        .attr('filter', isSelected ? 'url(#glow-filter)' : 'none');

      // Inner Symbol/Dot
      if (!isOrigin) {
        nodeG
          .append('circle')
          .attr('r', isSelected ? 3.5 : 2)
          .attr('fill', isSelected ? '#FFFFFF' : cfg.color);
      } else {
        nodeG
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('fill', '#FFFFFF')
          .attr('font-size', '9px')
          .attr('font-weight', 'bold')
          .text('Ω');
      }

      // Label text
      const labelText = isOrigin ? 'ORIGIN' : `T+${node.stepHorizon} (${node.stabilityIndexPct}%)`;
      nodeG
        .append('text')
        .attr('y', isOrigin ? -18 : 16)
        .attr('text-anchor', 'middle')
        .attr('fill', isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)')
        .attr('font-size', isSelected ? '11px' : '9.5px')
        .attr('font-family', 'monospace')
        .attr('font-weight', isSelected ? 'bold' : 'normal')
        .text(labelText);
    });
  }, [filteredData, selectedNode, hoveredNode, horizonHorizonLimit, entropyMultiplier]);

  // Zoom control helpers
  const handleZoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 0.77);
    }
  };

  const handleResetZoom = () => {
    if (svgRef.current && zoomBehaviorRef.current && containerRef.current) {
      const width = containerRef.current.clientWidth || 800;
      const height = containerRef.current.clientHeight || 540;
      d3.select(svgRef.current)
        .transition()
        .duration(400)
        .call(zoomBehaviorRef.current.transform, d3.zoomIdentity.translate(width / 2, height / 2 + 10).scale(1));
    }
  };

  return (
    <div
      className={`rounded-[28px] bg-gradient-to-br from-[#0c0d18] via-[#090a14] to-[#05060b] border-white/8 backdrop-blur-xl p-5 space-y-4 ${className}`}
    >
      {/* Header & Sub-Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border-violet-500/20 text-xs font-mono flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-violet-400" />
              PATH PROJECTION VECTOR ENGINE
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border-emerald-500/20 text-xs font-mono flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              TELEMETRY ENTROPY PREDICTOR
            </span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border-cyan-500/20 text-[10px] font-mono">
              LYAPUNOV: {projection?.lyapunovExponent ?? -0.0384} (STABLE)
            </span>
          </div>
          <h3 className="text-lg font-mono font-bold text-white mt-1.5 flex items-center gap-2">
            Multiverse Trajectory & Future State Projections
          </h3>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            Predictive quantum vector cones across time horizons T+1 to T+5 • Grounded in historical telemetry variance
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleRecalculate(entropyMultiplier)}
            disabled={isRecalculating}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold flex items-center gap-2 border transition-all ${
              isRecalculating
                ? 'bg-violet-500/20 border-violet-500/40 text-violet-200 animate-pulse'
                : 'bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/30 text-violet-300 shadow-sm'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-violet-400 ${isRecalculating ? 'animate-spin' : ''}`} />
            <span>{isRecalculating ? 'Computing Trajectories...' : 'Recalculate Projections'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Entropy Slider Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-black/40 border-white/5">
        {/* Branch Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono text-zinc-400 mr-1 flex items-center gap-1">
            <Layers className="w-3 h-3 text-zinc-500" />
            Branch Filter:
          </span>
          <button
            onClick={() => {
              setActiveBranch('all');
              playTone(500, 0.03);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
              activeBranch === 'all'
                ? 'bg-white/15 text-white font-bold border-white/20'
                : 'text-zinc-400 hover:text-white bg-white/5 border-transparent'
            }`}
          >
            All Trajectories
          </button>
          {Object.entries(BRANCH_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => {
                setActiveBranch(key);
                playTone(560, 0.03);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all ${
                activeBranch === key
                  ? `${cfg.bgBadge} font-bold border`
                  : 'text-zinc-400 hover:text-white bg-white/5 border-transparent'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
              <span>{cfg.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Horizon Steps & Entropy Injection Slider */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 text-[11px]">Horizon:</span>
            <div className="flex items-center gap-1">
              {[3, 4, 5].map((h) => (
                <button
                  key={h}
                  onClick={() => {
                    setHorizonLimit(h);
                    playTone(580 + h * 20, 0.03);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                    horizonHorizonLimit === h
                      ? 'bg-violet-500/20 text-violet-300 border-violet-500/40 font-bold'
                      : 'bg-white/5 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  T+{h}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-400 text-[11px] flex items-center gap-1">
              <Sliders className="w-3 h-3 text-zinc-500" />
              Entropy Load:
            </span>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={entropyMultiplier}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setEntropyMultiplier(val);
                handleRecalculate(val);
              }}
              className="w-20 accent-violet-500 cursor-pointer h-1.5 bg-zinc-700 rounded-lg"
            />
            <span className="text-violet-300 text-[11px] font-bold w-10 text-right">
              {entropyMultiplier}x
            </span>
          </div>
        </div>
      </div>

      {/* Main Vector Graph Canvas & HUD Inspector Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* D3 Vector Graph Canvas */}
        <div
          ref={containerRef}
          className="lg:col-span-8 relative h-[480px] rounded-2xl bg-black/60 border-white/8 overflow-hidden shadow-inner flex items-center justify-center"
        >
          <svg ref={svgRef} className="w-full h-full" />

          {/* Canvas Floating Overlay Controls */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#0B0E1A]/80 backdrop-blur-md p-1.5 rounded-xl border-white/10 z-10">
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-zinc-400 px-1 border-l border-white/10">
              {Math.round(zoomScale * 100)}%
            </span>
          </div>

          {/* Trajectory Target Compass in Top Right */}
          <div className="absolute top-3 right-3 bg-[#0B0E1A]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border-white/10 z-10 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] font-mono text-zinc-300">
              {navState.currentSector} ──► {navState.destination}
            </span>
          </div>

          {/* Quick Legend at bottom left */}
          <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-2 bg-[#0B0E1A]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border-white/10 text-[10px] font-mono text-zinc-300 z-10">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>SSoT</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-violet-400" />
              <span>Warp</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Entropy</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Quarantine</span>
            </div>
          </div>
        </div>

        {/* Node Deep Inspector HUD Card */}
        <div className="lg:col-span-4 space-y-3">
          {selectedNode ? (
            <div className="p-4 rounded-2xl bg-[#0e101f]/90 border-white/10 backdrop-blur-md space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-white/5">
                <div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase border ${
                      BRANCH_CONFIG[selectedNode.branchType].bgBadge
                    }`}
                  >
                    {selectedNode.branchType.replace('_', ' ')}
                  </span>
                  <h4 className="text-sm font-mono font-bold text-white mt-1.5">
                    {selectedNode.name}
                  </h4>
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    {selectedNode.stepHorizon === 0
                      ? 'Base Origin State (T=0)'
                      : `Time Offset: +${selectedNode.timeOffsetSeconds}s • Horizon T+${selectedNode.stepHorizon}`}
                  </p>
                </div>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
                  style={{
                    backgroundColor: `${BRANCH_CONFIG[selectedNode.branchType].color}15`,
                    borderColor: `${BRANCH_CONFIG[selectedNode.branchType].color}40`,
                  }}
                >
                  <Sparkles
                    className="w-4 h-4"
                    style={{ color: BRANCH_CONFIG[selectedNode.branchType].color }}
                  />
                </div>
              </div>

              {/* Telemetry Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-black/40 border-white/5 space-y-0.5">
                  <span className="text-[10px] text-zinc-500 uppercase">PROJECTED ENTROPY</span>
                  <div className="text-emerald-400 font-bold flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    <span>{selectedNode.projectedEntropyRateKBps} KB/s</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/40 border-white/5 space-y-0.5">
                  <span className="text-[10px] text-zinc-500 uppercase">STABILITY INDEX</span>
                  <div className="text-cyan-400 font-bold">
                    {selectedNode.stabilityIndexPct}%
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/40 border-white/5 space-y-0.5">
                  <span className="text-[10px] text-zinc-500 uppercase">THERMAL VARIANCE</span>
                  <div className="text-amber-400 font-bold">
                    +{selectedNode.thermalVarianceDeltaC}°C ΔT
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/40 border-white/5 space-y-0.5">
                  <span className="text-[10px] text-zinc-500 uppercase">CONFIDENCE CONE</span>
                  <div className="text-violet-400 font-bold">
                    {selectedNode.confidenceScorePct}% (±{selectedNode.divergenceVector.driftRadius}px)
                  </div>
                </div>
              </div>

              {/* Coordinates & Hop Info */}
              <div className="p-3 rounded-xl bg-black/50 border-white/5 space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-500">Sector Address:</span>
                  <span className="text-zinc-200 font-bold">{selectedNode.sector}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-500">Gateway Relay:</span>
                  <span className="text-zinc-200 font-bold">{selectedNode.gateway}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-500">Quantum Coherence:</span>
                  <span className="text-emerald-400 font-bold">{selectedNode.quantumCoherencePct}%</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-500">Invariants Verified:</span>
                  <span className="text-emerald-400 font-bold">{selectedNode.invariantPassRate}/10 PASS</span>
                </div>
              </div>

              {/* Dilithium-5 Attestation Seal */}
              <div className="p-3 rounded-xl bg-violet-950/20 border-violet-500/20 space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-violet-300 font-bold uppercase flex items-center gap-1">
                    <Key className="w-3 h-3 text-violet-400" />
                    Dilithium-5 Attestation Seal
                  </span>
                  <button
                    onClick={() => handleCopy(selectedNode.pqcAttestationSeal)}
                    className="p-1 rounded hover:bg-violet-500/20 text-violet-300 transition-colors"
                    title="Copy Seal"
                  >
                    {copiedHash === selectedNode.pqcAttestationSeal ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-violet-400" />
                    )}
                  </button>
                </div>
                <div className="text-[11px] text-violet-200 break-all font-mono">
                  {selectedNode.pqcAttestationSeal}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-black/40 border-white/5 text-center text-xs font-mono text-zinc-500">
              Select any node in the vector graph to view projected telemetry metrics.
            </div>
          )}

          {/* Historical Telemetry Summary Banner */}
          <div className="p-3.5 rounded-2xl bg-black/40 border-white/5 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-zinc-400 text-[11px]">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                Snapshot Feed Source:
              </span>
              <span className="text-cyan-300 font-bold">
                {projection?.telemetrySourceSnapshotsCount ?? 2} Hardened Snapshots
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-400 text-[11px]">
              <span>Base Telemetry Rate:</span>
              <span className="text-emerald-400 font-bold">
                {projection?.baseEntropyRateKBps ?? 12.4} KB/s
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-400 text-[11px]">
              <span>Entropy Trend:</span>
              <span className="text-zinc-200 capitalize font-bold">
                {projection?.entropyTrend ?? 'steady'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
