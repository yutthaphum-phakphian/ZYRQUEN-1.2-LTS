import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Activity,
  Layers,
  Sparkles,
  Maximize2,
  RefreshCw,
  Compass,
  Cpu,
  ShieldCheck,
  Zap,
  Info,
  Radio,
  Flame,
} from 'lucide-react';
import { playTone, playAuditChime } from './AudioSynthesizer';

export interface HardwareTopologicalNode {
  id: string;
  chamberId: string;
  name: string;
  x: number; // -100 to 100
  y: number; // -100 to 100
  entropy: number; // 0.00 to 1.00
  temperature: string;
  bandwidthGBs: number;
  status: 'NOMINAL' | 'ELEVATED' | 'CRYO_LOCKED' | 'AUTO_HEALED';
  category: 'CORE' | 'CRYPTO' | 'CRYO' | 'MEMORY' | 'LEDGER' | 'GUARD';
}

const INITIAL_TOPOLOGICAL_NODES: HardwareTopologicalNode[] = [
  { id: 'nd-00', chamberId: 'Chamber 00', name: 'Boot Enclave Microcode', x: 0, y: 0, entropy: 0.28, temperature: '36.2°C', bandwidthGBs: 42.5, status: 'NOMINAL', category: 'CORE' },
  { id: 'nd-01', chamberId: 'Chamber 01', name: 'Genesis Merkle Tree Shard', x: -35, y: 28, entropy: 0.32, temperature: '38.4°C', bandwidthGBs: 36.8, status: 'NOMINAL', category: 'LEDGER' },
  { id: 'nd-02', chamberId: 'Chamber 02', name: 'ML-DSA-87 Dilithium Engine', x: 42, y: 32, entropy: 0.44, temperature: '41.1°C', bandwidthGBs: 48.2, status: 'NOMINAL', category: 'CRYPTO' },
  { id: 'nd-03', chamberId: 'Chamber 03', name: 'SPHINCS+ Fallback Signer', x: 72, y: -22, entropy: 0.39, temperature: '39.8°C', bandwidthGBs: 28.6, status: 'NOMINAL', category: 'CRYPTO' },
  { id: 'nd-04', chamberId: 'Chamber 04', name: 'Sub-Kelvin Dilution Matrix', x: -22, y: -52, entropy: 0.18, temperature: '12.4 mK', bandwidthGBs: 52.1, status: 'CRYO_LOCKED', category: 'CRYO' },
  { id: 'nd-05', chamberId: 'Chamber 05', name: 'Cryo Heat Exchanger Pump', x: 26, y: -62, entropy: 0.22, temperature: '14.8 mK', bandwidthGBs: 44.0, status: 'CRYO_LOCKED', category: 'CRYO' },
  { id: 'nd-06', chamberId: 'Chamber 06', name: 'Superconducting Thermal Shield', x: -68, y: -32, entropy: 0.15, temperature: '11.9 mK', bandwidthGBs: 39.5, status: 'CRYO_LOCKED', category: 'CRYO' },
  { id: 'nd-07', chamberId: 'Chamber 07', name: '768-Qubit QPU Transmon Grid', x: -16, y: 68, entropy: 0.52, temperature: '12.2 mK', bandwidthGBs: 64.0, status: 'NOMINAL', category: 'CORE' },
  { id: 'nd-08', chamberId: 'Chamber 08', name: 'Quantum Coherence Bus', x: 32, y: 78, entropy: 0.48, temperature: '12.6 mK', bandwidthGBs: 58.4, status: 'NOMINAL', category: 'CORE' },
  { id: 'nd-09', chamberId: 'Chamber 09', name: 'Vector Embedding Coprocessor', x: 78, y: 46, entropy: 0.62, temperature: '49.6°C', bandwidthGBs: 51.2, status: 'ELEVATED', category: 'CORE' },
  { id: 'nd-10', chamberId: 'Chamber 10', name: 'HBM3 Memory Array Alpha', x: -76, y: 22, entropy: 0.41, temperature: '43.2°C', bandwidthGBs: 72.8, status: 'NOMINAL', category: 'MEMORY' },
  { id: 'nd-11', chamberId: 'Chamber 11', name: 'HBM3 Memory Array Beta', x: -82, y: -12, entropy: 0.43, temperature: '44.0°C', bandwidthGBs: 70.4, status: 'NOMINAL', category: 'MEMORY' },
  { id: 'nd-12', chamberId: 'Chamber 12', name: 'SSoT Merkle Root Seal Array', x: 12, y: -26, entropy: 0.29, temperature: '37.0°C', bandwidthGBs: 41.6, status: 'NOMINAL', category: 'LEDGER' },
  { id: 'nd-13', chamberId: 'Chamber 13', name: 'PDPA Section 26 Vault Unit', x: -48, y: -76, entropy: 0.31, temperature: '38.6°C', bandwidthGBs: 33.2, status: 'NOMINAL', category: 'LEDGER' },
  { id: 'nd-14', chamberId: 'Chamber 14', name: 'ETDA Electronic Evidence Gate', x: 56, y: -72, entropy: 0.35, temperature: '40.2°C', bandwidthGBs: 37.8, status: 'NOMINAL', category: 'GUARD' },
  { id: 'nd-15', chamberId: 'Chamber 15', name: 'Immutable Write Firewall', x: 0, y: 42, entropy: 0.25, temperature: '35.4°C', bandwidthGBs: 49.0, status: 'NOMINAL', category: 'GUARD' },
  { id: 'nd-16', chamberId: 'Chamber 16', name: 'Phoenix Autonomous Healer', x: 86, y: 12, entropy: 0.37, temperature: '42.8°C', bandwidthGBs: 46.2, status: 'AUTO_HEALED', category: 'GUARD' },
  { id: 'nd-17', chamberId: 'Chamber 17', name: 'Forensic Blackbox Sanctuary', x: 2, y: -92, entropy: 0.21, temperature: '34.8°C', bandwidthGBs: 38.0, status: 'NOMINAL', category: 'GUARD' },
];

export const SpatialEntropyHeatMap: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [nodes, setNodes] = useState<HardwareTopologicalNode[]>(INITIAL_TOPOLOGICAL_NODES);
  const [selectedNode, setSelectedNode] = useState<HardwareTopologicalNode | null>(INITIAL_TOPOLOGICAL_NODES[0]);
  const [hoveredNode, setHoveredNode] = useState<HardwareTopologicalNode | null>(null);
  const [metricMode, setMetricMode] = useState<'ENTROPY' | 'THERMAL' | 'BANDWIDTH'>('ENTROPY');
  const [showMeshLinks, setShowMeshLinks] = useState<boolean>(true);
  const [isPinging, setIsPinging] = useState<boolean>(false);

  // Periodic real-time perturbation simulating dynamic entropy variations
  useEffect(() => {
    const interval = setInterval(() => {
      setNodes((prev) =>
        prev.map((node) => {
          // Subtle natural entropy wave
          const delta = (Math.random() - 0.48) * 0.04;
          const nextEntropy = Math.max(0.1, Math.min(0.92, node.entropy + delta));
          const nextStatus =
            nextEntropy > 0.7
              ? 'ELEVATED'
              : node.status === 'CRYO_LOCKED'
              ? 'CRYO_LOCKED'
              : 'NOMINAL';
          return {
            ...node,
            entropy: Math.round(nextEntropy * 1000) / 1000,
            status: nextStatus,
          };
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Update selectedNode if its data changed
  useEffect(() => {
    if (selectedNode) {
      const updated = nodes.find((n) => n.id === selectedNode.id);
      if (updated) setSelectedNode(updated);
    }
  }, [nodes, selectedNode]);

  // Ping topological core
  const handlePingNodes = () => {
    setIsPinging(true);
    playTone(587.33, 0.08, 'sine', 0.07);
    setTimeout(() => playTone(880, 0.12, 'sine', 0.08), 120);

    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        entropy: Math.max(0.12, Math.min(0.85, n.entropy + (Math.random() * 0.08 - 0.04))),
      }))
    );

    setTimeout(() => {
      setIsPinging(false);
      playAuditChime();
    }, 1000);
  };

  // Color scale for entropy heat map
  const getEntropyColor = (val: number) => {
    if (val < 0.25) return '#06b6d4'; // Cyan (Subzero calm)
    if (val < 0.45) return '#10b981'; // Emerald (Optimal nominal)
    if (val < 0.65) return '#f59e0b'; // Amber (Elevated operational flux)
    return '#f43f5e'; // Rose / Red (High entropy stress)
  };

  // D3 Rendering
  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = Math.max(420, containerRef.current.clientHeight);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const margin = { top: 25, right: 25, bottom: 25, left: 25 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left + innerWidth / 2},${margin.top + innerHeight / 2})`);

    // Coordinate Scales: map [-100, 100] to [-innerWidth/2, innerWidth/2]
    const scale = Math.min(innerWidth, innerHeight) / 220;
    const xScale = (coord: number) => coord * scale;
    const yScale = (coord: number) => -coord * scale; // Invert Y for cartesian coordinates

    // Defs for gradients & filters
    const defs = svg.append('defs');

    // Glow filter for active nodes
    const filter = defs.append('filter').attr('id', 'entropy-heat-glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Concentric coordinate rings
    const rings = [25, 50, 75, 100];
    rings.forEach((r) => {
      g.append('circle')
        .attr('r', r * scale)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(255, 255, 255, 0.05)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3');

      g.append('text')
        .attr('x', 6)
        .attr('y', -r * scale - 4)
        .attr('fill', 'rgba(255, 255, 255, 0.25)')
        .attr('font-family', 'monospace')
        .attr('font-size', '9px')
        .text(`R=${r}`);
    });

    // Cartesian Axes (X and Y lines)
    g.append('line')
      .attr('x1', -105 * scale)
      .attr('y1', 0)
      .attr('x2', 105 * scale)
      .attr('y2', 0)
      .attr('stroke', 'rgba(6, 182, 212, 0.15)')
      .attr('stroke-width', 1);

    g.append('line')
      .attr('x1', 0)
      .attr('y1', -105 * scale)
      .attr('x2', 0)
      .attr('y2', 105 * scale)
      .attr('stroke', 'rgba(6, 182, 212, 0.15)')
      .attr('stroke-width', 1);

    // Axis coordinate labels
    g.append('text')
      .attr('x', 108 * scale)
      .attr('y', 3)
      .attr('fill', '#06b6d4')
      .attr('font-family', 'monospace')
      .attr('font-size', '10px')
      .text('+X');

    g.append('text')
      .attr('x', 0)
      .attr('y', -108 * scale)
      .attr('fill', '#06b6d4')
      .attr('font-family', 'monospace')
      .attr('font-size', '10px')
      .attr('text-anchor', 'middle')
      .text('+Y');

    // Background Spatial Heat Halos (Simulated Continuous Heat Field)
    nodes.forEach((node) => {
      const color = getEntropyColor(node.entropy);
      const radius = (20 + node.entropy * 40) * scale;
      const gradId = `heat-field-${node.id}`;

      const radialGrad = defs
        .append('radialGradient')
        .attr('id', gradId)
        .attr('cx', '50%')
        .attr('cy', '50%')
        .attr('r', '50%');

      radialGrad
        .append('stop')
        .attr('offset', '0%')
        .attr('stop-color', color)
        .attr('stop-opacity', 0.28);

      radialGrad
        .append('stop')
        .attr('offset', '60%')
        .attr('stop-color', color)
        .attr('stop-opacity', 0.08);

      radialGrad
        .append('stop')
        .attr('offset', '100%')
        .attr('stop-color', color)
        .attr('stop-opacity', 0);

      g.append('circle')
        .attr('cx', xScale(node.x))
        .attr('cy', yScale(node.y))
        .attr('r', radius)
        .attr('fill', `url(#${gradId})`)
        .attr('pointer-events', 'none');
    });

    // Topological Interconnect Mesh (Delaunay links)
    if (showMeshLinks) {
      const points: [number, number][] = nodes.map((d) => [xScale(d.x), yScale(d.y)]);
      const delaunay = d3.Delaunay.from(points);
      const { halfedges, points: p } = delaunay;

      for (let i = 0; i < halfedges.length; i++) {
        if (halfedges[i] > i) {
          const p1 = [p[i * 2], p[i * 2 + 1]];
          const j = halfedges[i];
          const p2 = [p[j * 2], p[j * 2 + 1]];

          // Only draw lines if distance is reasonable to preserve visual clarity
          const dist = Math.hypot(p1[0] - p2[0], p1[1] - p2[1]);
          if (dist < 80 * scale) {
            g.append('line')
              .attr('x1', p1[0])
              .attr('y1', p1[1])
              .attr('x2', p2[0])
              .attr('y2', p2[1])
              .attr('stroke', 'rgba(6, 182, 212, 0.12)')
              .attr('stroke-width', 1)
              .attr('stroke-dasharray', '2,3');
          }
        }
      }
    }

    // Ping shockwave if triggered
    if (isPinging) {
      g.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 10)
        .attr('fill', 'none')
        .attr('stroke', '#06b6d4')
        .attr('stroke-width', 2)
        .transition()
        .duration(800)
        .ease(d3.easeCubicOut)
        .attr('r', 100 * scale)
        .attr('stroke-opacity', 0)
        .remove();
    }

    // Node Interactive Elements
    const nodeGroups = g
      .selectAll('.node-group')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node-group cursor-pointer')
      .attr('transform', (d) => `translate(${xScale(d.x)},${yScale(d.y)})`)
      .on('click', (_, d) => {
        playTone(440 + d.entropy * 400, 0.05, 'sine', 0.05);
        setSelectedNode(d);
      })
      .on('mouseenter', (_, d) => {
        setHoveredNode(d);
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
      });

    // Outer Selection Ring
    nodeGroups
      .append('circle')
      .attr('r', (d) => (selectedNode?.id === d.id ? 14 : 9))
      .attr('fill', 'none')
      .attr('stroke', (d) =>
        selectedNode?.id === d.id ? '#ffffff' : getEntropyColor(d.entropy)
      )
      .attr('stroke-width', (d) => (selectedNode?.id === d.id ? 2 : 1))
      .attr('opacity', (d) => (selectedNode?.id === d.id ? 1 : 0.6));

    // Core Solid Dot
    nodeGroups
      .append('circle')
      .attr('r', (d) => 5 + d.entropy * 3)
      .attr('fill', (d) => getEntropyColor(d.entropy))
      .style('filter', 'url(#entropy-heat-glow)');

    // Node ID Label
    nodeGroups
      .append('text')
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .attr('fill', (d) => (selectedNode?.id === d.id ? '#ffffff' : '#a1a1aa'))
      .attr('font-family', 'monospace')
      .attr('font-size', '9px')
      .attr('font-weight', (d) => (selectedNode?.id === d.id ? 'bold' : 'normal'))
      .text((d) => d.id.toUpperCase());

  }, [nodes, selectedNode, showMeshLinks, isPinging]);

  return (
    <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#070914]/90 via-[#0b0e1e]/85 to-[#070914]/90 border border-cyan-500/25 shadow-[0_8px_30px_-10px_rgba(6,182,212,0.15)] backdrop-blur-2xl space-y-6">
      {/* Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/8 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <Compass className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                2D Spatial Entropy Heat Map & Topological Coordinates
              </h3>
              <span className="text-[10px] font-mono bg-cyan-500/15 text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-500/30 font-semibold">
                D3 SPATIAL GRID
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Topological performance projection across 18 Chambers • Origin (0,0) Anchor
            </p>
          </div>
        </div>

        {/* Heat Map Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Delaunay Interconnect Mesh */}
          <button
            onClick={() => setShowMeshLinks(!showMeshLinks)}
            className={`px-3 py-1.5 rounded-xl border font-mono text-xs transition-all flex items-center gap-1.5 ${
              showMeshLinks
                ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                : 'bg-black/40 border-white/10 text-zinc-400'
            }`}
            title="Toggle Topological Mesh Interconnects"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Mesh: {showMeshLinks ? 'ON' : 'OFF'}</span>
          </button>

          {/* Metric Selector */}
          <div className="flex rounded-xl bg-black/50 border border-white/10 p-0.5 font-mono text-xs">
            <button
              onClick={() => setMetricMode('ENTROPY')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                metricMode === 'ENTROPY'
                  ? 'bg-cyan-500/25 text-cyan-200 font-bold border border-cyan-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Entropy H(x)
            </button>
            <button
              onClick={() => setMetricMode('THERMAL')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                metricMode === 'THERMAL'
                  ? 'bg-cyan-500/25 text-cyan-200 font-bold border border-cyan-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Thermal
            </button>
            <button
              onClick={() => setMetricMode('BANDWIDTH')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                metricMode === 'BANDWIDTH'
                  ? 'bg-cyan-500/25 text-cyan-200 font-bold border border-cyan-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              QOps / BW
            </button>
          </div>

          {/* Pulse / Ping Shockwave Button */}
          <button
            onClick={handlePingNodes}
            disabled={isPinging}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-100 font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] flex items-center gap-1.5"
          >
            <Radio className={`w-3.5 h-3.5 ${isPinging ? 'animate-ping text-cyan-400' : ''}`} />
            <span>Ping Grid</span>
          </button>
        </div>
      </div>

      {/* Main Heat Map Stage & Detail Inspection Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: D3 Topological Canvas */}
        <div className="lg:col-span-8 relative bg-black/50 border border-white/8 rounded-2xl p-4 overflow-hidden min-h-[440px] flex flex-col items-center justify-center">
          <div ref={containerRef} className="w-full h-[400px] relative">
            <svg ref={svgRef} className="w-full h-full" />
          </div>

          {/* Map Legend Overlay */}
          <div className="absolute bottom-3 left-3 bg-[#070914]/85 border border-white/10 backdrop-blur-md rounded-xl px-3 py-1.5 flex items-center gap-3 text-[10px] font-mono text-zinc-400 pointer-events-none">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#06b6d4]"></span> Low (&lt;0.25)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#10b981]"></span> Nominal (0.45)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span> Elevated (0.65)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#f43f5e]"></span> Stress (&gt;0.75)
            </span>
          </div>

          {/* Coordinate indicator */}
          <div className="absolute top-3 right-3 bg-[#070914]/85 border border-white/10 backdrop-blur-md rounded-xl px-3 py-1 text-[10px] font-mono text-zinc-400 pointer-events-none">
            CARTESIAN BOUNDS: [-100, +100]²
          </div>
        </div>

        {/* Right: Selected Node Telemetry Card */}
        <div className="lg:col-span-4 space-y-4">
          {selectedNode ? (
            <div className="p-5 rounded-2xl bg-black/60 border border-cyan-500/30 space-y-4 shadow-xl animate-in fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold uppercase">
                    {selectedNode.chamberId}
                  </span>
                  <h4 className="text-sm font-mono font-bold text-white mt-1.5">
                    {selectedNode.name}
                  </h4>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    selectedNode.status === 'NOMINAL'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : selectedNode.status === 'CRYO_LOCKED'
                      ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {selectedNode.status}
                </span>
              </div>

              {/* Spatial Coordinates Box */}
              <div className="grid grid-cols-2 gap-2 bg-white/[0.02] border border-white/8 rounded-xl p-3 text-center font-mono">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase block">Coord X</span>
                  <span className="text-sm font-bold text-cyan-300">
                    {selectedNode.x >= 0 ? `+${selectedNode.x}` : selectedNode.x}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase block">Coord Y</span>
                  <span className="text-sm font-bold text-cyan-300">
                    {selectedNode.y >= 0 ? `+${selectedNode.y}` : selectedNode.y}
                  </span>
                </div>
              </div>

              {/* Entropy Bar Meter */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-400">Entropy Score H(x)</span>
                  <span
                    className="font-bold font-mono"
                    style={{ color: getEntropyColor(selectedNode.entropy) }}
                  >
                    {(selectedNode.entropy * 100).toFixed(1)}% ({selectedNode.entropy.toFixed(3)})
                  </span>
                </div>
                <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${selectedNode.entropy * 100}%`,
                      backgroundColor: getEntropyColor(selectedNode.entropy),
                    }}
                  />
                </div>
              </div>

              {/* Thermal & QOps Stats */}
              <div className="space-y-2 pt-2 border-t border-white/8 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Thermal Reading:</span>
                  <span className="text-white font-bold">{selectedNode.temperature}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Bandwidth / QOps:</span>
                  <span className="text-white font-bold">{selectedNode.bandwidthGBs} GB/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Security Invariant:</span>
                  <span className="text-emerald-400 font-bold">FIPS 204 VALID</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Sovereign Clearance:</span>
                  <span className="text-cyan-300 font-bold">OMEGA-1 #EP-01</span>
                </div>
              </div>

              <button
                onClick={() => {
                  playTone(660, 0.05);
                  setNodes((prev) =>
                    prev.map((n) =>
                      n.id === selectedNode.id
                        ? { ...n, entropy: Math.max(0.12, n.entropy - 0.12), status: 'AUTO_HEALED' }
                        : n
                    )
                  );
                }}
                className="w-full py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center justify-center gap-2"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-300" />
                <span>Re-calibrate Node Entropy</span>
              </button>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-black/40 border border-white/8 text-center text-zinc-500 font-mono text-xs">
              Select a node on the 2D topological map to inspect hardware metrics.
            </div>
          )}

          {/* Quick Chambers Summary Pill Box */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/8 space-y-2 font-mono text-[11px]">
            <div className="flex items-center justify-between text-zinc-400">
              <span>ACTIVE HARDWARE NODES</span>
              <span className="text-cyan-300 font-bold">18 / 18 ONLINE</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>GENESIS ANCHOR ROOT</span>
              <span className="text-emerald-400 font-bold">909ab814...fa4c68</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>CANONICAL SEALS</span>
              <span className="text-white font-bold">14,902 SEALS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
