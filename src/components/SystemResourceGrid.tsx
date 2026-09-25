import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Cpu,
  HardDrive,
  Activity,
  Layers,
  Grid,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Thermometer
} from 'lucide-react';
import { playTone } from './AudioSynthesizer';

export interface ResourceNode {
  id: string;
  name: string;
  subsystem: 'cpu' | 'memory' | 'thermal';
  value: number;
  threshold: number;
  unit: string;
  spec: string;
  temp: number;
  status: 'OPTIMAL' | 'NOMINAL' | 'HIGH_FLUX' | 'FAIL_SAFE';
}

const INITIAL_NODES: ResourceNode[] = [
  { id: 'cpu-0', name: 'CPU Core 0', subsystem: 'cpu', value: 42, threshold: 80, unit: '%', spec: '4.82 GHz • QOps Thread #0', temp: 39.4, status: 'OPTIMAL' },
  { id: 'cpu-1', name: 'CPU Core 1', subsystem: 'cpu', value: 38, threshold: 80, unit: '%', spec: '4.80 GHz • QOps Thread #1', temp: 38.8, status: 'OPTIMAL' },
  { id: 'cpu-2', name: 'CPU Core 2', subsystem: 'cpu', value: 49, threshold: 80, unit: '%', spec: '4.88 GHz • QOps Thread #2', temp: 42.1, status: 'NOMINAL' },
  { id: 'cpu-3', name: 'CPU Core 3', subsystem: 'cpu', value: 44, threshold: 80, unit: '%', spec: '4.78 GHz • QOps Thread #3', temp: 40.2, status: 'OPTIMAL' },
  { id: 'mem-l1', name: 'L1 Cache', subsystem: 'memory', value: 28, threshold: 90, unit: '%', spec: '0.8ns Latency • SRAM 32MB', temp: 35.1, status: 'OPTIMAL' },
  { id: 'mem-l2', name: 'L2 Cache', subsystem: 'memory', value: 36, threshold: 90, unit: '%', spec: '2.2ns Latency • SRAM 128MB', temp: 36.4, status: 'OPTIMAL' },
  { id: 'mem-hbm-a', name: 'HBM3 Bank A', subsystem: 'memory', value: 68, threshold: 90, unit: '%', spec: '28.4 GB/s • 3D Stacked', temp: 44.8, status: 'NOMINAL' },
  { id: 'mem-hbm-b', name: 'HBM3 Bank B', subsystem: 'memory', value: 64, threshold: 90, unit: '%', spec: '29.1 GB/s • 3D Stacked', temp: 43.5, status: 'NOMINAL' },
  { id: 'thm-ex', name: 'Cryo Exchanger', subsystem: 'thermal', value: 15, threshold: 30, unit: 'mK', spec: 'Sub-Kelvin • Liquid He-4', temp: -273.13, status: 'OPTIMAL' },
  { id: 'thm-pump', name: 'Cryo Pump', subsystem: 'thermal', value: 14, threshold: 30, unit: 'mK', spec: 'Magnetic Levitated Loop', temp: -273.14, status: 'OPTIMAL' },
];

export const SystemResourceGrid: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [nodes, setNodes] = useState<ResourceNode[]>(INITIAL_NODES);
  const [activeTab, setActiveTab] = useState<'treemap' | 'rack' | 'summary'>('treemap');
  const [filterSubsystem, setFilterSubsystem] = useState<'ALL' | 'cpu' | 'memory' | 'thermal'>('ALL');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('cpu-0');
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);

  // Live telemetry pulse simulation with smooth updates
  useEffect(() => {
    const interval = setInterval(() => {
      setNodes((prev) =>
        prev.map((node) => {
          const delta = (Math.random() * 6 - 3);
          const maxCap = node.subsystem === 'thermal' ? 28 : 95;
          const minCap = node.subsystem === 'thermal' ? 10 : 15;
          const nextVal = Math.min(maxCap, Math.max(minCap, Math.round((node.value + delta) * 10) / 10));
          const nextTemp = Math.round((node.temp + (Math.random() * 0.4 - 0.2)) * 10) / 10;
          
          let nextStatus: ResourceNode['status'] = 'OPTIMAL';
          if (node.subsystem === 'thermal') {
            nextStatus = nextVal > 22 ? 'HIGH_FLUX' : 'OPTIMAL';
          } else {
            const ratio = nextVal / node.threshold;
            if (ratio > 0.9) nextStatus = 'HIGH_FLUX';
            else if (ratio > 0.6) nextStatus = 'NOMINAL';
            else nextStatus = 'OPTIMAL';
          }

          return {
            ...node,
            value: nextVal,
            temp: nextTemp,
            status: nextStatus,
          };
        })
      );
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const filteredNodes = useMemo(() => {
    if (filterSubsystem === 'ALL') return nodes;
    return nodes.filter((n) => n.subsystem === filterSubsystem);
  }, [nodes, filterSubsystem]);

  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || nodes[0];
  }, [nodes, selectedNodeId]);

  // Aggregate metrics
  const avgCpu = useMemo(() => {
    const cpus = nodes.filter((n) => n.subsystem === 'cpu');
    return Math.round(cpus.reduce((acc, c) => acc + c.value, 0) / cpus.length);
  }, [nodes]);

  const avgMem = useMemo(() => {
    const mems = nodes.filter((n) => n.subsystem === 'memory');
    return Math.round(mems.reduce((acc, c) => acc + c.value, 0) / mems.length);
  }, [nodes]);

  const cryoTemp = useMemo(() => {
    const thm = nodes.find((n) => n.id === 'thm-pump');
    return thm ? `${thm.value} mK` : '14 mK';
  }, [nodes]);

  // D3 Treemap Rendering with mathematically bounded size & ResizeObserver
  useEffect(() => {
    if (activeTab !== 'treemap') return;
    if (!containerRef.current || !svgRef.current) return;

    const renderTreemap = () => {
      if (!containerRef.current || !svgRef.current) return;
      const width = containerRef.current.clientWidth || 600;
      const height = containerRef.current.clientHeight || 230;

      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();

      svg
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`);

      // Defs: Gradients and filters for cybernetic glass tiles
      const defs = svg.append('defs');

      // CPU Gradient
      const gradCpu = defs.append('linearGradient')
        .attr('id', 'grad-cpu')
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '100%').attr('y2', '100%');
      gradCpu.append('stop').attr('offset', '0%').attr('stop-color', 'rgba(6, 182, 212, 0.28)');
      gradCpu.append('stop').attr('offset', '100%').attr('stop-color', 'rgba(8, 47, 73, 0.5)');

      // Memory Gradient
      const gradMem = defs.append('linearGradient')
        .attr('id', 'grad-mem')
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '100%').attr('y2', '100%');
      gradMem.append('stop').attr('offset', '0%').attr('stop-color', 'rgba(139, 92, 246, 0.28)');
      gradMem.append('stop').attr('offset', '100%').attr('stop-color', 'rgba(46, 16, 101, 0.5)');

      // Thermal Gradient
      const gradThermal = defs.append('linearGradient')
        .attr('id', 'grad-thermal')
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '100%').attr('y2', '100%');
      gradThermal.append('stop').attr('offset', '0%').attr('stop-color', 'rgba(16, 185, 129, 0.28)');
      gradThermal.append('stop').attr('offset', '100%').attr('stop-color', 'rgba(6, 78, 59, 0.5)');

      // High-Flux Gradient
      const gradHot = defs.append('linearGradient')
        .attr('id', 'grad-hot')
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '100%').attr('y2', '100%');
      gradHot.append('stop').attr('offset', '0%').attr('stop-color', 'rgba(244, 63, 94, 0.35)');
      gradHot.append('stop').attr('offset', '100%').attr('stop-color', 'rgba(76, 5, 25, 0.6)');

      // Hierarchy
      const hierarchyData = {
        name: 'cluster',
        children: filteredNodes.map((n) => ({
          ...n,
          weight: Math.max(12, n.value),
        })),
      };

      const root = d3.hierarchy(hierarchyData)
        .sum((d: any) => d.weight || 0)
        .sort((a, b) => (b.value || 0) - (a.value || 0));

      d3.treemap()
        .size([width, height])
        .paddingTop(3)
        .paddingRight(3)
        .paddingInner(4)
        .paddingBottom(3)
        (root as any);

      const leaves = (root as d3.HierarchyRectangularNode<any>).leaves();

      const nodeGroup = svg.selectAll('.tile-group')
        .data(leaves)
        .join('g')
        .attr('class', 'tile-group cursor-pointer')
        .attr('transform', (d) => `translate(${d.x0},${d.y0})`)
        .on('click', (_, d) => {
          playTone(540 + d.data.value * 3, 0.04);
          setSelectedNodeId(d.data.id);
        });

      // Background rect
      nodeGroup.append('rect')
        .attr('width', (d) => Math.max(0, d.x1 - d.x0))
        .attr('height', (d) => Math.max(0, d.y1 - d.y0))
        .attr('rx', 6)
        .attr('ry', 6)
        .attr('fill', (d) => {
          if (d.data.status === 'HIGH_FLUX') return 'url(#grad-hot)';
          if (d.data.subsystem === 'cpu') return 'url(#grad-cpu)';
          if (d.data.subsystem === 'memory') return 'url(#grad-mem)';
          return 'url(#grad-thermal)';
        })
        .attr('stroke', (d) => {
          if (d.data.id === selectedNodeId) return '#ffffff';
          if (d.data.status === 'HIGH_FLUX') return 'rgba(244, 63, 94, 0.7)';
          if (d.data.subsystem === 'cpu') return 'rgba(6, 182, 212, 0.6)';
          if (d.data.subsystem === 'memory') return 'rgba(139, 92, 246, 0.6)';
          return 'rgba(16, 185, 129, 0.6)';
        })
        .attr('stroke-width', (d) => (d.data.id === selectedNodeId ? 2 : 1))
        .attr('stroke-dasharray', (d) => (d.data.id === selectedNodeId ? 'none' : 'none'))
        .style('transition', 'all 0.2s ease');

      // Utilization bar along bottom edge
      nodeGroup.append('rect')
        .attr('x', 3)
        .attr('y', (d) => Math.max(0, d.y1 - d.y0 - 5))
        .attr('width', (d) => {
          const maxW = Math.max(0, d.x1 - d.x0 - 6);
          const ratio = Math.min(1, d.data.value / d.data.threshold);
          return maxW * ratio;
        })
        .attr('height', 3)
        .attr('rx', 1.5)
        .attr('fill', (d) => {
          if (d.data.status === 'HIGH_FLUX') return '#f43f5e';
          if (d.data.subsystem === 'cpu') return '#06b6d4';
          if (d.data.subsystem === 'memory') return '#a78bfa';
          return '#34d399';
        });

      // Name & Subsystem Label
      nodeGroup.each(function (d) {
        const boxWidth = d.x1 - d.x0;
        const boxHeight = d.y1 - d.y0;
        const group = d3.select(this);

        if (boxWidth >= 70 && boxHeight >= 45) {
          // Subsystem micro badge
          group.append('text')
            .attr('x', 6)
            .attr('y', 13)
            .text(d.data.subsystem.toUpperCase())
            .attr('font-size', '8px')
            .attr('font-family', 'monospace')
            .attr('font-weight', '700')
            .attr('fill', d.data.subsystem === 'cpu' ? '#67e8f9' : d.data.subsystem === 'memory' ? '#c4b5fd' : '#6ee7b7')
            .attr('letter-spacing', '0.08em');

          // Node Name
          group.append('text')
            .attr('x', 6)
            .attr('y', 25)
            .text(d.data.name)
            .attr('font-size', boxWidth > 120 ? '11px' : '10px')
            .attr('font-family', 'monospace')
            .attr('font-weight', '600')
            .attr('fill', '#ffffff');

          // Large Value
          if (boxHeight >= 65) {
            group.append('text')
              .attr('x', 6)
              .attr('y', boxHeight - 12)
              .text(`${Math.round(d.data.value)}${d.data.unit}`)
              .attr('font-size', boxWidth > 110 ? '16px' : '13px')
              .attr('font-family', 'monospace')
              .attr('font-weight', '800')
              .attr('fill', d.data.status === 'HIGH_FLUX' ? '#fecdd3' : '#e0f2fe');
          } else {
            // Right-aligned value
            group.append('text')
              .attr('x', boxWidth - 6)
              .attr('y', 25)
              .attr('text-anchor', 'end')
              .text(`${Math.round(d.data.value)}${d.data.unit}`)
              .attr('font-size', '11px')
              .attr('font-family', 'monospace')
              .attr('font-weight', '700')
              .attr('fill', '#ffffff');
          }
        } else if (boxWidth >= 40 && boxHeight >= 25) {
          // Minimal label
          group.append('text')
            .attr('x', 4)
            .attr('y', 14)
            .text(`${Math.round(d.data.value)}${d.data.unit}`)
            .attr('font-size', '9px')
            .attr('font-family', 'monospace')
            .attr('font-weight', '700')
            .attr('fill', '#ffffff');
        }
      });
    };

    renderTreemap();

    let resizeRafId: number | null = null;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeRafId !== null) {
        cancelAnimationFrame(resizeRafId);
      }
      resizeRafId = requestAnimationFrame(() => {
        renderTreemap();
      });
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      if (resizeRafId !== null) {
        cancelAnimationFrame(resizeRafId);
      }
      resizeObserver.disconnect();
    };
  }, [filteredNodes, activeTab, selectedNodeId]);

  const handleCalibrate = () => {
    setIsCalibrating(true);
    playTone(520, 0.05);
    setTimeout(() => playTone(680, 0.05), 80);
    setTimeout(() => playTone(840, 0.08), 160);

    setTimeout(() => {
      setNodes((prev) =>
        prev.map((n) => ({
          ...n,
          value: n.subsystem === 'thermal' ? 14 : Math.min(60, Math.max(30, Math.round(n.value * 0.85))),
          status: 'OPTIMAL',
        }))
      );
      setIsCalibrating(false);
    }, 600);
  };

  return (
    <div className="w-full rounded-[24px] bg-gradient-to-br from-[#0a0d1c]/95 via-[#080b18]/90 to-[#050712]/95 border-cyan-500/25 shadow-[0_8px_30px_-10px_rgba(6,182,212,0.15)] backdrop-blur-2xl p-4 sm:p-5 flex flex-col space-y-3.5 transition-all">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white font-mono tracking-wider">
                SYSTEM RESOURCE GRID
              </h3>
              <span className="text-[9px] font-mono font-bold bg-cyan-950/80 text-cyan-300 px-2 py-0.5 rounded-full border-cyan-500/30">
                10 BLADES
              </span>
            </div>
            <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-2 mt-0.5">
              <span>CPU: <strong className="text-cyan-300">{avgCpu}%</strong></span>
              <span className="text-zinc-600">•</span>
              <span>HBM3: <strong className="text-violet-300">{avgMem}%</strong></span>
              <span className="text-zinc-600">•</span>
              <span>CRYO: <strong className="text-emerald-300">{cryoTemp}</strong></span>
            </div>
          </div>
        </div>

        {/* View Mode & Calibration Buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <div className="flex rounded-xl bg-black/60 border-white/10 p-0.5 font-mono text-[11px]">
            <button
              onClick={() => {
                playTone(600, 0.03);
                setActiveTab('treemap');
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                activeTab === 'treemap'
                  ? 'bg-cyan-500/25 text-cyan-200 font-bold border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="D3 Cybernetic Treemap Matrix"
            >
              <Grid className="w-3 h-3" />
              <span>Treemap</span>
            </button>
            <button
              onClick={() => {
                playTone(640, 0.03);
                setActiveTab('rack');
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                activeTab === 'rack'
                  ? 'bg-violet-500/25 text-violet-200 font-bold border-violet-500/30 shadow-[0_0_10px_rgba(139,92,246,0.2)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Hardware Blade Rack View"
            >
              <Layers className="w-3 h-3" />
              <span>Blades</span>
            </button>
            <button
              onClick={() => {
                playTone(680, 0.03);
                setActiveTab('summary');
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                activeTab === 'summary'
                  ? 'bg-emerald-500/25 text-emerald-200 font-bold border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Cluster Telemetry Meters"
            >
              <Activity className="w-3 h-3" />
              <span>Meters</span>
            </button>
          </div>

          <button
            onClick={handleCalibrate}
            disabled={isCalibrating}
            className="p-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-300 hover:text-white transition-all"
            title="Recalibrate Cluster Load Distribution"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCalibrating ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Subsystem Filters */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar text-[10px] font-mono">
        <div className="flex items-center gap-1">
          <span className="text-zinc-500 uppercase text-[9px] mr-1 hidden sm:inline">Filter:</span>
          {(['ALL', 'cpu', 'memory', 'thermal'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => {
                playTone(560, 0.02);
                setFilterSubsystem(filter);
              }}
              className={`px-2 py-0.5 rounded-md transition-all uppercase font-semibold ${
                filterSubsystem === filter
                  ? 'bg-white/15 text-white border-white/20'
                  : 'text-zinc-500 hover:text-zinc-300 bg-white/[0.02]'
              }`}
            >
              {filter === 'ALL' ? 'ALL (10)' : filter === 'cpu' ? 'CPU (4)' : filter === 'memory' ? 'HBM (4)' : 'CRYO (2)'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-zinc-500 text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-zinc-400">FAIL-CLOSED SAFE (&lt;85°C)</span>
        </div>
      </div>

      {/* Main Visual Stage with Strictly Constrained Height (Prevent Vertical Ballooning) */}
      <div className="w-full h-[220px] sm:h-[240px] relative overflow-hidden rounded-xl bg-black/40 border-white/5 flex items-center justify-center">
        {/* VIEW 1: D3 TREEMAP */}
        {activeTab === 'treemap' && (
          <div ref={containerRef} className="w-full h-full p-1 relative">
            <svg ref={svgRef} className="w-full h-full block" />
          </div>
        )}

        {/* VIEW 2: HARDWARE BLADE RACK */}
        {activeTab === 'rack' && (
          <div className="w-full h-full p-2.5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            {filteredNodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              const ratio = node.subsystem === 'thermal' ? node.value / 30 : node.value / node.threshold;
              return (
                <div
                  key={node.id}
                  onClick={() => {
                    playTone(540 + node.value * 2, 0.03);
                    setSelectedNodeId(node.id);
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                      : 'bg-black/50 border-white/8 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          node.status === 'HIGH_FLUX'
                            ? 'bg-rose-400 animate-ping'
                            : node.subsystem === 'cpu'
                            ? 'bg-cyan-400'
                            : node.subsystem === 'memory'
                            ? 'bg-violet-400'
                            : 'bg-emerald-400'
                        }`}
                      />
                      <span className="font-bold text-zinc-200 text-[11px]">{node.name}</span>
                    </div>
                    <span
                      className={`text-[11px] font-bold ${
                        node.status === 'HIGH_FLUX' ? 'text-rose-400' : 'text-zinc-200'
                      }`}
                    >
                      {node.value} {node.unit}
                    </span>
                  </div>

                  {/* Meter bar */}
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden my-1.5">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        node.status === 'HIGH_FLUX'
                          ? 'bg-rose-500'
                          : node.subsystem === 'cpu'
                          ? 'bg-cyan-400'
                          : node.subsystem === 'memory'
                          ? 'bg-violet-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, ratio * 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-zinc-400">
                    <span className="truncate max-w-[140px]">{node.spec}</span>
                    <span>{node.temp > 0 ? `${node.temp}°C` : `${node.value} mK`}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW 3: RADIAL TELEMETRY METERS */}
        {activeTab === 'summary' && (
          <div className="w-full h-full p-4 grid grid-cols-3 gap-3 items-center justify-center font-mono">
            {/* CPU Dial */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-black/40 border-cyan-500/20 text-center space-y-1">
              <div className="w-9 h-9 rounded-full border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                <Cpu className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="text-[10px] text-zinc-400">CPU CLUSTER</span>
              <div className="text-base sm:text-lg font-bold text-white">{avgCpu}%</div>
              <span className="text-[9px] text-cyan-400">4 Cores Active</span>
            </div>

            {/* HBM3 Dial */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-black/40 border-violet-500/20 text-center space-y-1">
              <div className="w-9 h-9 rounded-full border-2 border-violet-400 flex items-center justify-center shadow-[0_0_12px_rgba(139,92,246,0.3)]">
                <HardDrive className="w-4 h-4 text-violet-400" />
              </div>
              <span className="text-[10px] text-zinc-400">HBM3 FABRIC</span>
              <div className="text-base sm:text-lg font-bold text-white">{avgMem}%</div>
              <span className="text-[9px] text-violet-400">28.8 GB/s BW</span>
            </div>

            {/* Cryo Thermal Dial */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-black/40 border-emerald-500/20 text-center space-y-1">
              <div className="w-9 h-9 rounded-full border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                <Thermometer className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-[10px] text-zinc-400">CRYO COOLANT</span>
              <div className="text-base sm:text-lg font-bold text-emerald-300">{cryoTemp}</div>
              <span className="text-[9px] text-emerald-400">Liquid He-4</span>
            </div>
          </div>
        )}
      </div>

      {/* Selected Blade Telemetry Strip (Sleek Compact Inspector) */}
      <div className="p-2.5 rounded-xl bg-black/40 border-white/8 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
          <span className="font-bold text-white text-[11px]">{selectedNode.name}</span>
          <span className="text-zinc-500">•</span>
          <span className="text-zinc-400 text-[10px] truncate max-w-[200px]">{selectedNode.spec}</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-zinc-400">
          <span>Load: <strong className="text-cyan-300">{selectedNode.value}{selectedNode.unit}</strong></span>
          <span>Temp: <strong className="text-zinc-200">{selectedNode.temp > 0 ? `${selectedNode.temp}°C` : `${selectedNode.value} mK`}</strong></span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border-emerald-500/20 font-bold">
            FIPS 204
          </span>
        </div>
      </div>
    </div>
  );
};

