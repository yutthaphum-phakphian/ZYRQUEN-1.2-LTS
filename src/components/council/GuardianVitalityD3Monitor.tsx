import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { motion } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Radio,
  RefreshCw,
  Shield,
  ShieldAlert,
  Zap,
  Sliders,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { COUNCIL_MEMBERS, CouncilMember, getMemberVitality } from '../../data/councilData';
import { playAuditChime, playTone } from '../AudioSynthesizer';

export interface NodeVitalityState {
  slotId: number;
  code: string;
  nameEn: string;
  nameTh: string;
  roleEn: string;
  avatarColor: string;
  currentUptime: number; // 99.0 - 100.0%
  uptimeHistory: number[]; // past 20 tick readings
  entropyKBps: number; // 1024 - 4096 KB/s
  subKelvinTempMk: number; // 12 - 20 mK
  jitterMs: number; // 0.008 - 0.035 ms
  driftPct: number; // 0.00% baseline; > 0.05% is considered drift (surfaced in RED)
  isDrifted: boolean;
  status: 'OPTIMAL' | 'DRIFT_DETECTED' | 'RECALIBRATING';
}

export const GuardianVitalityD3Monitor: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sound feedback toggle
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [tickIntervalMs, setTickIntervalMs] = useState<number>(2000);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [hoveredNode, setHoveredNode] = useState<NodeVitalityState | null>(null);

  // Initialize state for 10 HSM nodes
  const [nodes, setNodes] = useState<NodeVitalityState[]>(() => {
    return COUNCIL_MEMBERS.map((m) => {
      const vit = getMemberVitality(m);
      const baseUptime = 99.985 + (m.slotId % 3) * 0.004;
      const history = Array.from({ length: 18 }, (_, i) => {
        return Math.min(100, Math.max(99.9, baseUptime + (Math.sin(i + m.slotId) * 0.01)));
      });

      return {
        slotId: m.slotId,
        code: m.councilCode,
        nameEn: m.nameEn,
        nameTh: m.nameTh,
        roleEn: m.roleEn,
        avatarColor: m.avatarColor,
        currentUptime: baseUptime,
        uptimeHistory: history,
        entropyKBps: vit.activeEntropyRateKBps,
        subKelvinTempMk: Math.round(vit.subKelvinTempK * 1000),
        jitterMs: vit.jitterMs,
        driftPct: 0.0,
        isDrifted: false,
        status: 'OPTIMAL',
      };
    });
  });

  // Inject or clear drift on a specific node
  const handleToggleDrift = (slotId: number) => {
    setNodes((prev) =>
      prev.map((node) => {
        if (node.slotId !== slotId) return node;

        const nextDrifted = !node.isDrifted;
        if (nextDrifted) {
          if (soundEnabled) {
            playTone(320, 0.2, 'sawtooth');
            setTimeout(() => playTone(240, 0.25, 'sawtooth'), 100);
          }
          return {
            ...node,
            isDrifted: true,
            driftPct: +(0.14 + (slotId % 4) * 0.06).toFixed(3),
            currentUptime: +(node.currentUptime - 0.25).toFixed(3),
            entropyKBps: Math.round(node.entropyKBps * 0.65),
            jitterMs: +(node.jitterMs * 4.2).toFixed(3),
            status: 'DRIFT_DETECTED',
          };
        } else {
          if (soundEnabled) {
            playAuditChime();
          }
          return {
            ...node,
            isDrifted: false,
            driftPct: 0.0,
            currentUptime: 99.992,
            entropyKBps: 3450,
            jitterMs: 0.012,
            status: 'OPTIMAL',
          };
        }
      })
    );
  };

  // Re-synchronize and calibrate all 10 nodes to 0.00% Zero-Drift
  const handleRecalibrateAll = () => {
    if (soundEnabled) {
      playAuditChime();
      playTone(880, 0.15, 'sine');
    }
    setNodes((prev) =>
      prev.map((node) => ({
        ...node,
        isDrifted: false,
        driftPct: 0.0,
        currentUptime: 99.995,
        entropyKBps: 3500 + (node.slotId * 50),
        jitterMs: 0.011,
        status: 'OPTIMAL',
      }))
    );
  };

  // Real-time ticking simulation
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setNodes((prev) =>
        prev.map((node) => {
          // Add subtle real-time jitter/entropy fluctuation
          const jitterDelta = (Math.random() - 0.5) * 0.002;
          const newJitter = Math.max(0.006, +(node.jitterMs + jitterDelta).toFixed(3));
          const entropyDelta = Math.round((Math.random() - 0.5) * 40);
          const newEntropy = Math.max(800, node.entropyKBps + entropyDelta);

          // Uptime micro-sample
          const uptimeDelta = (Math.random() - 0.48) * 0.003;
          const updatedUptime = node.isDrifted
            ? Math.max(98.5, Math.min(99.7, +(node.currentUptime + uptimeDelta).toFixed(3)))
            : Math.max(99.95, Math.min(100.0, +(node.currentUptime + uptimeDelta).toFixed(3)));

          const updatedHistory = [...node.uptimeHistory.slice(1), updatedUptime];

          return {
            ...node,
            jitterMs: newJitter,
            entropyKBps: newEntropy,
            currentUptime: updatedUptime,
            uptimeHistory: updatedHistory,
          };
        })
      );
    }, tickIntervalMs);

    return () => clearInterval(timer);
  }, [isPaused, tickIntervalMs]);

  // Aggregate metrics
  const aggregateMetrics = useMemo(() => {
    const totalUptime = nodes.reduce((acc, n) => acc + n.currentUptime, 0) / nodes.length;
    const driftedCount = nodes.filter((n) => n.isDrifted).length;
    const totalEntropy = nodes.reduce((acc, n) => acc + n.entropyKBps, 0);
    const maxDrift = Math.max(...nodes.map((n) => n.driftPct));
    return {
      averageUptime: totalUptime.toFixed(3),
      driftedCount,
      totalEntropy,
      maxDrift: maxDrift.toFixed(3),
      isAllHealthy: driftedCount === 0,
    };
  }, [nodes]);

  // D3 Visualization Render Pipeline
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 960;
    const height = 360;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clean previous render

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', '100%').attr('height', height);

    // Definitions (Gradients & Filters)
    const defs = svg.append('defs');

    // Glow filter for drifting nodes (intense RED glow)
    const redGlow = defs.append('filter').attr('id', 'red-drift-glow').attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%');
    redGlow.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
    redGlow.append('feComposite').attr('in', 'SourceGraphic').attr('in2', 'blur').attr('operator', 'over');

    // Emerald Glow for healthy nodes
    const greenGlow = defs.append('filter').attr('id', 'green-healthy-glow').attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%');
    greenGlow.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
    greenGlow.append('feComposite').attr('in', 'SourceGraphic').attr('in2', 'blur').attr('operator', 'over');

    // Linear Gradients for Uptime sparkline areas
    // 1. Healthy green gradient
    const greenGrad = defs.append('linearGradient').attr('id', 'grad-uptime-green').attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
    greenGrad.append('stop').attr('offset', '0%').attr('stop-color', '#10b981').attr('stop-opacity', 0.4);
    greenGrad.append('stop').attr('offset', '100%').attr('stop-color', '#10b981').attr('stop-opacity', 0.0);

    // 2. Drift red gradient
    const redGrad = defs.append('linearGradient').attr('id', 'grad-uptime-red').attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
    redGrad.append('stop').attr('offset', '0%').attr('stop-color', '#ef4444').attr('stop-opacity', 0.6);
    redGrad.append('stop').attr('offset', '100%').attr('stop-color', '#ef4444').attr('stop-opacity', 0.0);

    // Grid Layout Math for 10 HSM Nodes (2 rows of 5 nodes)
    const margin = { top: 20, right: 16, bottom: 20, left: 16 };
    const cols = 5;
    const rows = 2;
    const colGap = 12;
    const rowGap = 16;
    const totalColGaps = (cols - 1) * colGap;
    const totalRowGaps = (rows - 1) * rowGap;
    const cardWidth = Math.floor((width - margin.left - margin.right - totalColGaps) / cols);
    const cardHeight = Math.floor((height - margin.top - margin.bottom - totalRowGaps) / rows);

    const mainG = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Render each node card via D3
    nodes.forEach((node, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = col * (cardWidth + colGap);
      const y = row * (cardHeight + rowGap);

      const isDrift = node.isDrifted;
      const isHovered = hoveredNode?.slotId === node.slotId;

      const cardG = mainG.append('g')
        .attr('class', `node-card-${node.slotId}`)
        .attr('transform', `translate(${x}, ${y})`)
        .style('cursor', 'pointer');

      // Click handler to toggle drift simulation
      cardG.on('click', () => {
        handleToggleDrift(node.slotId);
      });

      cardG.on('mouseenter', () => {
        setHoveredNode(node);
      });

      cardG.on('mouseleave', () => {
        setHoveredNode(null);
      });

      // Background Card Rect
      cardG.append('rect')
        .attr('width', cardWidth)
        .attr('height', cardHeight)
        .attr('rx', 14)
        .attr('fill', isDrift ? 'rgba(69, 10, 10, 0.65)' : 'rgba(15, 23, 42, 0.75)')
        .attr('stroke', isDrift ? '#ef4444' : isHovered ? '#38bdf8' : 'rgba(51, 65, 85, 0.6)')
        .attr('stroke-width', isDrift ? 2 : isHovered ? 1.5 : 1)
        .attr('filter', isDrift ? 'url(#red-drift-glow)' : 'none')
        .style('transition', 'all 0.3s ease');

      // Subtle Scanline / Grid Header Pattern inside card
      cardG.append('line')
        .attr('x1', 0)
        .attr('y1', 32)
        .attr('x2', cardWidth)
        .attr('y2', 32)
        .attr('stroke', isDrift ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.08)')
        .attr('stroke-dasharray', '2,2');

      // Slot badge circle
      cardG.append('circle')
        .attr('cx', 18)
        .attr('cy', 17)
        .attr('r', 9)
        .attr('fill', isDrift ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.2)')
        .attr('stroke', isDrift ? '#ef4444' : '#10b981')
        .attr('stroke-width', 1);

      cardG.append('text')
        .attr('x', 18)
        .attr('y', 21)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .attr('fill', isDrift ? '#fca5a5' : '#6ee7b7')
        .text(node.slotId);

      // Node Code Label
      cardG.append('text')
        .attr('x', 34)
        .attr('y', 21)
        .attr('font-size', '11px')
        .attr('font-family', 'monospace')
        .attr('font-weight', '600')
        .attr('fill', isDrift ? '#fca5a5' : '#f1f5f9')
        .text(node.code.replace('SOV-', '').slice(0, 11));

      // Right Status Chip in Card Header
      const statusText = isDrift ? `DRIFT ${node.driftPct}%` : `${node.currentUptime.toFixed(2)}%`;
      const statusColor = isDrift ? '#ef4444' : '#10b981';

      cardG.append('text')
        .attr('x', cardWidth - 10)
        .attr('y', 21)
        .attr('text-anchor', 'end')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .attr('fill', statusColor)
        .text(statusText);

      // 1. D3 Arc / Donut Cryptographic Health Gauge
      const arcCenter = { x: 36, y: 78 };
      const arcOuterRadius = 24;
      const arcInnerRadius = 18;

      // Background Arc
      const bgArc = d3.arc<any>()
        .innerRadius(arcInnerRadius)
        .outerRadius(arcOuterRadius)
        .startAngle(0)
        .endAngle(Math.PI * 2);

      cardG.append('path')
        .attr('transform', `translate(${arcCenter.x}, ${arcCenter.y})`)
        .attr('d', bgArc({}))
        .attr('fill', isDrift ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.06)');

      // Foreground Value Arc (Calculated from entropy & uptime)
      const healthPct = isDrift ? Math.max(0.3, 1 - node.driftPct * 3) : 0.99;
      const valueArc = d3.arc<any>()
        .innerRadius(arcInnerRadius)
        .outerRadius(arcOuterRadius)
        .startAngle(0)
        .endAngle(Math.PI * 2 * healthPct);

      cardG.append('path')
        .attr('transform', `translate(${arcCenter.x}, ${arcCenter.y})`)
        .attr('d', valueArc({}))
        .attr('fill', isDrift ? '#ef4444' : '#10b981')
        .attr('filter', isDrift ? 'url(#red-drift-glow)' : 'none');

      // Arc Center Value
      cardG.append('text')
        .attr('x', arcCenter.x)
        .attr('y', arcCenter.y + 4)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .attr('fill', isDrift ? '#ef4444' : '#38bdf8')
        .text(`${Math.round(healthPct * 100)}%`);

      // 2. D3 Real-Time Uptime Sparkline Chart
      const sparkX = 72;
      const sparkY = 52;
      const sparkWidth = cardWidth - sparkX - 12;
      const sparkHeight = 36;

      const xScale = d3.scaleLinear()
        .domain([0, node.uptimeHistory.length - 1])
        .range([0, sparkWidth]);

      const yMin = isDrift ? 98.0 : 99.8;
      const yMax = 100.05;
      const yScale = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([sparkHeight, 0]);

      // Sparkline Area Generator
      const areaGen = d3.area<number>()
        .x((_, i) => xScale(i))
        .y0(sparkHeight)
        .y1((d) => yScale(d))
        .curve(d3.curveMonotoneX);

      // Sparkline Line Generator
      const lineGen = d3.line<number>()
        .x((_, i) => xScale(i))
        .y((d) => yScale(d))
        .curve(d3.curveMonotoneX);

      const sparkG = cardG.append('g')
        .attr('transform', `translate(${sparkX}, ${sparkY})`);

      // Area fill
      sparkG.append('path')
        .datum(node.uptimeHistory)
        .attr('d', areaGen)
        .attr('fill', isDrift ? 'url(#grad-uptime-red)' : 'url(#grad-uptime-green)');

      // Stroke line
      sparkG.append('path')
        .datum(node.uptimeHistory)
        .attr('d', lineGen)
        .attr('fill', 'none')
        .attr('stroke', isDrift ? '#ef4444' : '#10b981')
        .attr('stroke-width', 1.5);

      // Current point at the end
      const lastIdx = node.uptimeHistory.length - 1;
      const lastVal = node.uptimeHistory[lastIdx];
      sparkG.append('circle')
        .attr('cx', xScale(lastIdx))
        .attr('cy', yScale(lastVal))
        .attr('r', 3)
        .attr('fill', isDrift ? '#ef4444' : '#34d399')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1);

      // 3. Card Bottom Micro-Metrics Bar
      const bottomY = cardHeight - 16;
      cardG.append('text')
        .attr('x', 14)
        .attr('y', bottomY)
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('fill', '#94a3b8')
        .text(`Ent: ${node.entropyKBps}K`);

      cardG.append('text')
        .attr('x', cardWidth / 2)
        .attr('y', bottomY)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('fill', '#94a3b8')
        .text(`Jit: ±${node.jitterMs}ms`);

      cardG.append('text')
        .attr('x', cardWidth - 14)
        .attr('y', bottomY)
        .attr('text-anchor', 'end')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('font-weight', isDrift ? 'bold' : 'normal')
        .attr('fill', isDrift ? '#ef4444' : '#94a3b8')
        .text(isDrift ? 'DRIFT ALERT' : `${node.subKelvinTempMk}mK`);
    });
  }, [nodes, hoveredNode]);

  return (
    <div className="space-y-4 my-6">
      {/* Top Banner Header & Metric Dashboard */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 md:p-6 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        {/* Ambient Top Indicator Light */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 transition-colors duration-500 ${
            aggregateMetrics.isAllHealthy
              ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500'
              : 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]'
          }`}
        />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-2xl border transition-all ${
                  aggregateMetrics.isAllHealthy
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse'
                }`}
              >
                {aggregateMetrics.isAllHealthy ? (
                  <Activity className="w-5 h-5" />
                ) : (
                  <ShieldAlert className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-wide">
                    Guardian Vitality D3 Monitor
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                      aggregateMetrics.isAllHealthy
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-red-500/30 text-red-200 border-red-500/60 animate-pulse'
                    }`}
                  >
                    {aggregateMetrics.isAllHealthy
                      ? '10/10 SYNCHRONIZED (0.00% DRIFT)'
                      : `${aggregateMetrics.driftedCount} NODE DRIFT DETECTED`}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  D3.js dynamic hardware telemetry &bull; NIST FIPS 204 Cryptographic Health Matrix
                </p>
              </div>
            </div>
          </div>

          {/* Aggregate Telemetry Strip & Quick Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Average Uptime Metric */}
            <div className="px-3.5 py-1.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-mono">Quorum Uptime:</span>
              <span
                className={`text-xs font-mono font-bold ${
                  aggregateMetrics.isAllHealthy ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {aggregateMetrics.averageUptime}%
              </span>
            </div>

            {/* Total Entropy */}
            <div className="px-3.5 py-1.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-2 hidden sm:flex">
              <span className="text-[11px] text-slate-400 font-mono">Entropy:</span>
              <span className="text-xs font-mono font-bold text-cyan-400">
                {(aggregateMetrics.totalEntropy / 1000).toFixed(1)} MB/s
              </span>
            </div>

            {/* Quick Recalibrate Button */}
            <button
              onClick={handleRecalibrateAll}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600/20 to-teal-600/10 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 text-xs font-mono transition-all inline-flex items-center gap-1.5"
              title="Reset all 10 HSM nodes to 0.00% Zero-Drift baseline"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>RE-CALIBRATE (0.00% ZERO-DRIFT)</span>
            </button>

            {/* Simulate Drift Shortcut Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleToggleDrift(4)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-mono transition-all border ${
                  nodes[3]?.isDrifted
                    ? 'bg-red-500/30 text-red-200 border-red-500/50'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40'
                }`}
                title="Toggle simulated drift on Node #4 (Cyber Defensive)"
              >
                {nodes[3]?.isDrifted ? 'FIX #4' : 'DRIFT #4'}
              </button>

              <button
                onClick={() => handleToggleDrift(7)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-mono transition-all border ${
                  nodes[6]?.isDrifted
                    ? 'bg-red-500/30 text-red-200 border-red-500/50'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40'
                }`}
                title="Toggle simulated drift on Node #7 (Compliance Guardian)"
              >
                {nodes[6]?.isDrifted ? 'FIX #7' : 'DRIFT #7'}
              </button>

              {/* Sound toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 rounded-xl bg-slate-800/70 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                title={soundEnabled ? 'Disable Audio Warnings' : 'Enable Audio Warnings'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* D3 Canvas Visualization Container */}
        <div ref={containerRef} className="mt-4 relative w-full overflow-hidden">
          <svg
            ref={svgRef}
            className="w-full h-auto select-none transition-all duration-300"
          />

          {/* D3 Interactive Tooltip Floating Overlay */}
          {hoveredNode && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-2 right-2 p-3 rounded-2xl bg-zinc-950/95 border border-slate-700 shadow-2xl backdrop-blur-md text-xs font-mono max-w-xs pointer-events-none z-20"
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-white/10 gap-3">
                <span className="font-bold text-white">
                  Slot #{hoveredNode.slotId} - {hoveredNode.nameEn}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    hoveredNode.isDrifted
                      ? 'bg-red-500/30 text-red-300 border border-red-500/50'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {hoveredNode.status}
                </span>
              </div>
              <div className="space-y-1 pt-1.5 text-[11px] text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Uptime:</span>
                  <span className="text-emerald-400 font-bold">{hoveredNode.currentUptime}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Node Drift:</span>
                  <span
                    className={
                      hoveredNode.isDrifted
                        ? 'text-red-400 font-bold animate-pulse'
                        : 'text-slate-300'
                    }
                  >
                    {hoveredNode.driftPct > 0 ? `+${hoveredNode.driftPct}% (MISALIGNED)` : '0.00% (NOMINAL)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Entropy Gen:</span>
                  <span className="text-cyan-400">{hoveredNode.entropyKBps} KB/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sub-Kelvin Temp:</span>
                  <span className="text-amber-400">{hoveredNode.subKelvinTempMk} mK</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Packet Jitter:</span>
                  <span className="text-slate-300">±{hoveredNode.jitterMs} ms</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Legend and User Guidance */}
        <div className="flex flex-wrap items-center justify-between pt-3 mt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Nominal (0.00% Drift)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-red-400 font-bold">Node Drift (Surfaced in RED)</span>
            </span>
            <span className="flex items-center gap-1.5 hidden sm:flex">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>NIST FIPS 204 Key Rate</span>
            </span>
          </div>

          <span className="text-slate-500 text-[10px]">
            Tip: Click any node card to toggle simulated cryptographic drift
          </span>
        </div>
      </div>
    </div>
  );
};
