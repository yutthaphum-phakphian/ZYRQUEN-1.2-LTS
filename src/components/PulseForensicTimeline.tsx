import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { HardwareSnapshot } from '../types';
import {
  ComplianceTransitionRecord,
  INITIAL_COMPLIANCE_TRANSITIONS,
} from './ComplianceHistoryLog';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { SYSTEM_METADATA } from '../data/canonicalData';
import { copyToClipboard } from '../utils/clipboard';

interface PulseForensicTimelineProps {
  snapshots: HardwareSnapshot[];
  complianceTransitions?: ComplianceTransitionRecord[];
}

interface UnifiedTimelineEvent {
  id: string;
  kind: 'hardware' | 'compliance';
  timeIndex: number; // Normalized 0..100 for x positioning
  timeLabel: string;
  title: string;
  status: string;
  category: string;
  // Hardware specific
  snapshot?: HardwareSnapshot;
  isAnomaly?: boolean;
  cpu?: number;
  cryo?: number;
  qops?: number;
  voltage?: number;
  ssd?: number;
  // Compliance specific
  compliance?: ComplianceTransitionRecord;
  section?: string;
  fromState?: string;
  toState?: string;
  statuteRef?: string;
  legalImplication?: string;
  pqcAlgorithm?: string;
  blockHeight?: number;
  // Cross-link
  relatedEventId?: string;
}

export const PulseForensicTimeline: React.FC<PulseForensicTimelineProps> = ({
  snapshots,
  complianceTransitions = INITIAL_COMPLIANCE_TRANSITIONS,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [selectedMetric, setSelectedMetric] = useState<'cpu' | 'cryo' | 'qops' | 'voltage'>('cpu');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('ALL');
  const [selectedHealthFilter, setSelectedHealthFilter] = useState<string>('ALL');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isPlayingReplay, setIsPlayingReplay] = useState<boolean>(false);
  const [replayIndex, setReplayIndex] = useState<number>(0);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [hoveredTooltip, setHoveredTooltip] = useState<{
    x: number;
    y: number;
    event: UnifiedTimelineEvent;
  } | null>(null);

  // Synthesize and interleave hardware snapshots with historical compliance records
  const unifiedEvents = useMemo(() => {
    const list: UnifiedTimelineEvent[] = [];

    // Map hardware snapshots
    const totalSnaps = Math.max(1, snapshots.length);
    snapshots.forEach((snap, idx) => {
      const isAnomaly =
        snap.cpuAverage > 55 ||
        snap.cryoTempMk > 20 ||
        (snap.voltageStabilityPct ?? 100) < 99.5 ||
        snap.qopsThroughput < 750;

      // Normalized timeIndex spanning from 5 to 95
      const timeIndex = 5 + (idx / totalSnaps) * 90;

      list.push({
        id: snap.id,
        kind: 'hardware',
        timeIndex,
        timeLabel: snap.timestampIct.replace('2026-08-20 ', ''),
        title: `Hardware Snapshot #${String(snap.snapshotNumber).padStart(3, '0')}`,
        status: isAnomaly ? 'ANOMALOUS_STATE' : 'NOMINAL_STATE',
        category: isAnomaly ? 'HARDWARE_ANOMALY' : 'HARDWARE_NOMINAL',
        snapshot: snap,
        isAnomaly,
        cpu: snap.cpuAverage,
        cryo: snap.cryoTempMk,
        qops: snap.qopsThroughput,
        voltage: snap.voltageStabilityPct ?? 99.98,
        ssd: snap.ssdWearLevelPct ?? 0.82,
        relatedEventId: complianceTransitions[idx % complianceTransitions.length]?.id,
      });
    });

    // Map compliance audit log transitions
    const totalComp = Math.max(1, complianceTransitions.length);
    complianceTransitions.forEach((comp, idx) => {
      const timeIndex = 10 + (idx / totalComp) * 80;

      list.push({
        id: comp.id,
        kind: 'compliance',
        timeIndex,
        timeLabel: comp.timestamp,
        title: `${comp.transitionType} (${comp.section})`,
        status: comp.status,
        category: comp.section,
        compliance: comp,
        section: comp.section,
        fromState: comp.fromState,
        toState: comp.toState,
        statuteRef: comp.statuteRef,
        legalImplication: comp.legalImplication,
        pqcAlgorithm: comp.pqcAlgorithm,
        blockHeight: comp.blockHeight,
        relatedEventId: snapshots[idx % snapshots.length]?.id,
      });
    });

    // Sort chronologically by timeIndex
    return list.sort((a, b) => a.timeIndex - b.timeIndex);
  }, [snapshots, complianceTransitions]);

  // Filter events according to active criteria
  const filteredEvents = useMemo(() => {
    return unifiedEvents.filter((ev) => {
      if (selectedSectionFilter !== 'ALL') {
        if (ev.kind === 'compliance' && ev.section !== selectedSectionFilter) return false;
        if (ev.kind === 'hardware' && selectedSectionFilter.startsWith('Section')) return false;
      }
      if (selectedHealthFilter === 'ANOMALIES_ONLY') {
        if (ev.kind === 'hardware' && !ev.isAnomaly) return false;
      }
      if (selectedHealthFilter === 'NOMINAL_ONLY') {
        if (ev.kind === 'hardware' && ev.isAnomaly) return false;
      }
      return true;
    });
  }, [unifiedEvents, selectedSectionFilter, selectedHealthFilter]);

  const selectedEvent = useMemo(() => {
    return unifiedEvents.find((e) => e.id === selectedEventId) || unifiedEvents[0] || null;
  }, [unifiedEvents, selectedEventId]);

  // Replay animation runner
  useEffect(() => {
    if (!isPlayingReplay) return;
    const timer = setInterval(() => {
      setReplayIndex((prev) => {
        const next = (prev + 1) % unifiedEvents.length;
        const ev = unifiedEvents[next];
        if (ev) {
          setSelectedEventId(ev.id);
          playTone(ev.kind === 'compliance' ? 880 : ev.isAnomaly ? 380 : 620, 0.04);
        }
        return next;
      });
    }, 1200);

    return () => clearInterval(timer);
  }, [isPlayingReplay, unifiedEvents]);

  // D3 Rendering of the Forensic Dual-Track State Timeline
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 980;
    const height = 440;
    const margin = { top: 40, right: 40, bottom: 50, left: 60 };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    // Main Canvas Group
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale: 0 to 100 timeline index
    const xScale = d3.scaleLinear().domain([0, 100]).range([0, innerWidth]);

    // Y Axis Zones:
    // Top Zone (Y: 20 to 120): Compliance Audit Transitions Track
    // Middle Zone (Y: 130 to 190): System State Change Connectors
    // Bottom Zone (Y: 200 to 330): Hardware Snapshots Metric Track
    const complianceY = 55;
    const hardwareBaselineY = 240;

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data([10, 25, 40, 55, 70, 85, 95])
      .enter()
      .append('line')
      .attr('x1', (d) => xScale(d))
      .attr('x2', (d) => xScale(d))
      .attr('y1', 10)
      .attr('y2', innerHeight)
      .attr('stroke', '#1e293b')
      .attr('stroke-dasharray', '3 3')
      .attr('opacity', 0.6);

    // Track 1 Background Bar (Compliance Track)
    g.append('rect')
      .attr('x', 0)
      .attr('y', 15)
      .attr('width', innerWidth)
      .attr('height', 80)
      .attr('fill', '#0a0f1e')
      .attr('stroke', '#1e293b')
      .attr('rx', 12);

    g.append('text')
      .attr('x', 14)
      .attr('y', 36)
      .attr('fill', '#D4AF37')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .text('⚖️ COMPLIANCE AUDIT TRANSITIONS (ETDA SEC 9, 26, 28 & PDPA)');

    // Track 2 Background Bar (Hardware Telemetry Track)
    g.append('rect')
      .attr('x', 0)
      .attr('y', 180)
      .attr('width', innerWidth)
      .attr('height', 150)
      .attr('fill', '#070a12')
      .attr('stroke', '#1e293b')
      .attr('rx', 12);

    g.append('text')
      .attr('x', 14)
      .attr('y', 202)
      .attr('fill', '#06B6D4')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .text(`📡 HARDWARE SNAPSHOTS & ${selectedMetric.toUpperCase()} METRIC PROFILE (Ω600_1000)`);

    // Hardware Metric Sparkline & Area Chart
    const hardwareEvents = filteredEvents.filter((e) => e.kind === 'hardware');
    if (hardwareEvents.length > 1) {
      const metricExtent = d3.extent(hardwareEvents, (d) => {
        if (selectedMetric === 'cpu') return d.cpu ?? 41.2;
        if (selectedMetric === 'cryo') return d.cryo ?? 14.98;
        if (selectedMetric === 'qops') return d.qops ?? 851.9;
        return d.voltage ?? 99.98;
      }) as [number, number];

      const minVal = Math.min(metricExtent[0] ?? 0, selectedMetric === 'cpu' ? 35 : 10);
      const maxVal = Math.max(metricExtent[1] ?? 100, selectedMetric === 'cpu' ? 65 : 30);

      const metricYScale = d3
        .scaleLinear()
        .domain([minVal * 0.95, maxVal * 1.05])
        .range([hardwareBaselineY + 60, hardwareBaselineY - 20]);

      // D3 Area Generator
      const areaGen = d3
        .area<UnifiedTimelineEvent>()
        .x((d) => xScale(d.timeIndex))
        .y0(hardwareBaselineY + 65)
        .y1((d) => {
          const val =
            selectedMetric === 'cpu'
              ? d.cpu ?? 41.2
              : selectedMetric === 'cryo'
              ? d.cryo ?? 14.98
              : selectedMetric === 'qops'
              ? d.qops ?? 851.9
              : d.voltage ?? 99.98;
          return metricYScale(val);
        })
        .curve(d3.curveMonotoneX);

      // Area fill
      g.append('path')
        .datum(hardwareEvents)
        .attr('d', areaGen)
        .attr('fill', '#06B6D4')
        .attr('fill-opacity', 0.12);

      // Line path
      const lineGen = d3
        .line<UnifiedTimelineEvent>()
        .x((d) => xScale(d.timeIndex))
        .y((d) => {
          const val =
            selectedMetric === 'cpu'
              ? d.cpu ?? 41.2
              : selectedMetric === 'cryo'
              ? d.cryo ?? 14.98
              : selectedMetric === 'qops'
              ? d.qops ?? 851.9
              : d.voltage ?? 99.98;
          return metricYScale(val);
        })
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(hardwareEvents)
        .attr('d', lineGen)
        .attr('fill', 'none')
        .attr('stroke', '#06B6D4')
        .attr('stroke-width', 2);
    }

    // State Change Connectors (Curved Béziers connecting Hardware anomalies/changes to Compliance milestones)
    const complianceEvents = filteredEvents.filter((e) => e.kind === 'compliance');
    hardwareEvents.forEach((hEv) => {
      // If hardware snapshot has an anomaly or ties into a compliance record
      const matchComp = complianceEvents.find(
        (c) => c.id === hEv.relatedEventId || Math.abs(c.timeIndex - hEv.timeIndex) < 18
      );

      if (matchComp) {
        const x1 = xScale(hEv.timeIndex);
        const y1 = hardwareBaselineY - 10;
        const x2 = xScale(matchComp.timeIndex);
        const y2 = complianceY + 18;

        const pathData = `M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}`;

        g.append('path')
          .attr('d', pathData)
          .attr('fill', 'none')
          .attr('stroke', hEv.isAnomaly ? '#f43f5e' : '#D4AF37')
          .attr('stroke-width', hEv.id === selectedEventId ? 2.5 : 1)
          .attr('stroke-dasharray', hEv.isAnomaly ? '4 3' : '2 2')
          .attr('opacity', hEv.id === selectedEventId ? 0.9 : 0.4);
      }
    });

    // Render Compliance Transition Nodes
    complianceEvents.forEach((ev) => {
      const cx = xScale(ev.timeIndex);
      const cy = complianceY + 12;
      const isSelected = ev.id === selectedEventId;

      const nodeG = g
        .append('g')
        .attr('cursor', 'pointer')
        .on('click', () => {
          playAuditChime();
          setSelectedEventId(ev.id);
        })
        .on('mouseenter', (event) => {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setHoveredTooltip({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
              event: ev,
            });
          }
        })
        .on('mouseleave', () => {
          setHoveredTooltip(null);
        });

      // Halo ring for selected
      if (isSelected) {
        nodeG
          .append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', 16)
          .attr('fill', '#D4AF37')
          .attr('fill-opacity', 0.25)
          .attr('stroke', '#D4AF37')
          .attr('stroke-width', 2);
      }

      // Outer diamond or hexagon marker
      nodeG
        .append('rect')
        .attr('x', cx - 9)
        .attr('y', cy - 9)
        .attr('width', 18)
        .attr('height', 18)
        .attr('transform', `rotate(45 ${cx} ${cy})`)
        .attr('fill', ev.section === 'Section 28' ? '#D4AF37' : ev.section === 'Section 26' ? '#06B6D4' : '#6366f1')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1.5);

      // Section label badge above node
      nodeG
        .append('text')
        .attr('x', cx)
        .attr('y', cy - 14)
        .attr('text-anchor', 'middle')
        .attr('fill', '#e2e8f0')
        .attr('font-size', '9px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'monospace')
        .text(ev.section ?? 'ETDA');
    });

    // Render Hardware Snapshot Nodes
    hardwareEvents.forEach((ev) => {
      const cx = xScale(ev.timeIndex);
      const cy = hardwareBaselineY + 20;
      const isSelected = ev.id === selectedEventId;

      const nodeG = g
        .append('g')
        .attr('cursor', 'pointer')
        .on('click', () => {
          playTone(ev.isAnomaly ? 360 : 620, 0.04);
          setSelectedEventId(ev.id);
        })
        .on('mouseenter', (event) => {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setHoveredTooltip({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
              event: ev,
            });
          }
        })
        .on('mouseleave', () => {
          setHoveredTooltip(null);
        });

      if (isSelected) {
        nodeG
          .append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', 16)
          .attr('fill', ev.isAnomaly ? '#f43f5e' : '#10b981')
          .attr('fill-opacity', 0.25)
          .attr('stroke', ev.isAnomaly ? '#f43f5e' : '#10b981')
          .attr('stroke-width', 2);
      }

      nodeG
        .append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', ev.isAnomaly ? 8 : 6)
        .attr('fill', ev.isAnomaly ? '#f43f5e' : '#10b981')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1.5);

      // Value label below node
      nodeG
        .append('text')
        .attr('x', cx)
        .attr('y', cy + 18)
        .attr('text-anchor', 'middle')
        .attr('fill', ev.isAnomaly ? '#fca5a5' : '#a7f3d0')
        .attr('font-size', '9px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'monospace')
        .text(
          selectedMetric === 'cpu'
            ? `${ev.cpu?.toFixed(1)}°C`
            : selectedMetric === 'cryo'
            ? `${ev.cryo?.toFixed(1)}mK`
            : selectedMetric === 'qops'
            ? `${ev.qops?.toFixed(0)}`
            : `${ev.voltage?.toFixed(1)}%`
        );
    });

    // Time Axis at Bottom
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(6)
      .tickFormat((d) => `T+${d}s`);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .attr('color', '#64748b')
      .selectAll('text')
      .attr('font-family', 'monospace')
      .attr('font-size', '10px');
  }, [filteredEvents, selectedMetric, selectedEventId]);

  return (
    <div className="space-y-6 font-mono">
      {/* Top Header Banner */}
      <div className="p-6 rounded-[28px] bg-[#070a12] border border-cyan-500/30 backdrop-blur-xl shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#0a0f1e] border border-cyan-500/40 flex items-center justify-center text-cyan-400 text-xl shadow-lg shrink-0">
              ⚖️
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#0a0f1e] text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                  D3.JS FORENSIC STATE TIMELINE
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#0a0f1e] text-amber-300 border border-amber-500/30 text-[10px]">
                  ETDA SEC 9, 26, 28 &bull; SAFE HARBOR
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#0a0f1e] text-emerald-300 border border-emerald-500/30 text-[10px]">
                  SSoT &Delta;0.00% INVARIANT
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#0a0f1e] text-cyan-400 border border-cyan-500/30 text-[10px]">
                  Ω600_1000 LOCKED
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                Forensic Timeline &bull; Hardware Snapshots vs. Historical Compliance Audit Logs
              </h2>
              <p className="text-xs text-zinc-400">
                Maps physical sub-Kelvin sensor observations against statutory state changes with Merkle leaf lineage
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                playTone(680, 0.04);
                setIsPlayingReplay((prev) => !prev);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                isPlayingReplay
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(212,175,55,0.3)]'
                  : 'bg-[#0a0f1e] text-zinc-300 border-zinc-700 hover:text-white'
              }`}
            >
              <span>{isPlayingReplay ? '⏸️' : '▶️'}</span>
              <span>{isPlayingReplay ? 'Pause Replay' : 'Replay Timeline'}</span>
            </button>

            <button
              onClick={() => {
                playAuditChime();
                const payload = {
                  timeline: unifiedEvents,
                  canonicalBlock: 849202,
                  merkleRoot: SYSTEM_METADATA.merkleRoot,
                  boundary: 'Ω600_1000',
                  exportTimestamp: new Date().toISOString(),
                };
                const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `zyrquen-forensic-timeline-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0a0f1e] hover:bg-cyan-950/40 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 transition-all"
            >
              <span>📑</span>
              <span>Export Timeline (JSON)</span>
            </button>
          </div>
        </div>

        {/* Filter and Metric Selectors */}
        <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-zinc-400 text-[11px]">Metric Curve:</span>
            {(['cpu', 'cryo', 'qops', 'voltage'] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  playTone(600, 0.03);
                  setSelectedMetric(m);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                  selectedMetric === m
                    ? 'bg-[#06B6D4] text-black font-bold'
                    : 'bg-[#0a0f1e] text-zinc-400 border border-zinc-800 hover:text-white'
                }`}
              >
                {m === 'cpu' ? 'CPU Temp (°C)' : m === 'cryo' ? 'Cryo (mK)' : m === 'qops' ? 'QOps/s' : 'Voltage (%)'}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400 text-[11px]">Section:</span>
              <select
                value={selectedSectionFilter}
                onChange={(e) => setSelectedSectionFilter(e.target.value)}
                className="bg-[#0a0f1e] border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-cyan-400"
              >
                <option value="ALL">All Statutory Invariants</option>
                <option value="Section 9">ETDA Section 9 (Authenticity)</option>
                <option value="Section 26">ETDA Section 26 (Reliability)</option>
                <option value="Section 28">ETDA Section 28 (Safe Harbor)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400 text-[11px]">Health:</span>
              <select
                value={selectedHealthFilter}
                onChange={(e) => setSelectedHealthFilter(e.target.value)}
                className="bg-[#0a0f1e] border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-cyan-400"
              >
                <option value="ALL">All Observations</option>
                <option value="ANOMALIES_ONLY">Anomalies Only</option>
                <option value="NOMINAL_ONLY">Nominal Only</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* D3 Interactive Dual-Track Canvas */}
      <div
        ref={containerRef}
        className="relative p-4 rounded-[28px] bg-[#070a12] border border-white/10 shadow-2xl overflow-hidden"
      >
        <svg ref={svgRef} className="w-full select-none" />

        {/* Hover Tooltip Overlay */}
        {hoveredTooltip && (
          <div
            style={{
              position: 'absolute',
              left: `${Math.min(hoveredTooltip.x + 15, (containerRef.current?.clientWidth || 900) - 280)}px`,
              top: `${Math.max(10, hoveredTooltip.y - 100)}px`,
            }}
            className="p-3.5 rounded-xl bg-[#0a0f1e] border border-cyan-400/60 shadow-2xl text-xs max-w-xs space-y-1.5 pointer-events-none z-50 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1">
              <span className="font-bold text-white flex items-center gap-1">
                <span>{hoveredTooltip.event.kind === 'compliance' ? '⚖️' : '📡'}</span>
                <span>{hoveredTooltip.event.title}</span>
              </span>
              <span className="text-[10px] text-zinc-400">{hoveredTooltip.event.timeLabel}</span>
            </div>

            {hoveredTooltip.event.kind === 'compliance' ? (
              <div className="space-y-1 text-[11px] text-zinc-300">
                <div>
                  <span className="text-zinc-500">Statute:</span>{' '}
                  <span className="text-amber-300">{hoveredTooltip.event.statuteRef}</span>
                </div>
                <div>
                  <span className="text-zinc-500">State Shift:</span>{' '}
                  <span className="text-cyan-300">{hoveredTooltip.event.fromState}</span> &rarr;{' '}
                  <span className="text-emerald-400 font-bold">{hoveredTooltip.event.toState}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Algorithm:</span>{' '}
                  <span className="text-purple-300">{hoveredTooltip.event.pqcAlgorithm}</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5 text-[10px] text-zinc-300 pt-1">
                <div className="p-1 rounded bg-black/40 border border-white/5">
                  <span className="text-zinc-500 block">CPU TEMP</span>
                  <span className="font-bold text-white">{hoveredTooltip.event.cpu}°C</span>
                </div>
                <div className="p-1 rounded bg-black/40 border border-white/5">
                  <span className="text-zinc-500 block">CRYO</span>
                  <span className="font-bold text-cyan-300">{hoveredTooltip.event.cryo} mK</span>
                </div>
                <div className="p-1 rounded bg-black/40 border border-white/5">
                  <span className="text-zinc-500 block">QOPS</span>
                  <span className="font-bold text-violet-300">{hoveredTooltip.event.qops}</span>
                </div>
                <div className="p-1 rounded bg-black/40 border border-white/5">
                  <span className="text-zinc-500 block">VOLTAGE</span>
                  <span className="font-bold text-emerald-300">{hoveredTooltip.event.voltage}%</span>
                </div>
              </div>
            )}
            <div className="text-[9px] text-zinc-500 pt-1 border-t border-white/5">
              Click node to view full forensic legal ledger audit
            </div>
          </div>
        )}
      </div>

      {/* Forensic Inspection Detail Drawer */}
      {selectedEvent && (
        <div className="p-6 rounded-[28px] bg-[#070a12] border border-white/10 shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedEvent.kind === 'compliance' ? '⚖️' : '📡'}</span>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                  SELECTED STATE TRANSITION EVENT &bull; {selectedEvent.kind.toUpperCase()}
                </span>
                <h3 className="text-lg font-bold text-white">{selectedEvent.title}</h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                  selectedEvent.status.includes('ANOMAL')
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {selectedEvent.status}
              </span>
              <span className="text-xs text-zinc-400 bg-[#0a0f1e] px-2.5 py-1 rounded-xl border border-zinc-800">
                {selectedEvent.timeLabel}
              </span>
            </div>
          </div>

          {selectedEvent.kind === 'compliance' && selectedEvent.compliance ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#0a0f1e] border border-white/5 space-y-2">
                <span className="text-[10px] text-amber-400 font-bold block">
                  STATUTORY SAFE HARBOR & LEGAL IMPLICATION
                </span>
                <div className="text-sm font-bold text-white">{selectedEvent.compliance.statuteRef}</div>
                <p className="text-zinc-300 leading-relaxed text-[11px]">
                  {selectedEvent.compliance.legalImplication}
                </p>
                <div className="pt-2 border-t border-white/5 text-[10px] text-zinc-400">
                  Signatory: <strong className="text-white">{selectedEvent.compliance.signatory}</strong> (
                  {selectedEvent.compliance.passportId})
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0a0f1e] border border-white/5 space-y-2">
                <span className="text-[10px] text-cyan-400 font-bold block">
                  STATE SHIFT &amp; POST-QUANTUM CRYPTOGRAPHY
                </span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded bg-black/40 border border-white/10 text-cyan-300 font-bold">
                    {selectedEvent.compliance.fromState}
                  </span>
                  <span className="text-zinc-400">&rarr;</span>
                  <span className="px-2 py-1 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold">
                    {selectedEvent.compliance.toState}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-300">
                  PQC Scheme: <strong className="text-purple-300">{selectedEvent.compliance.pqcAlgorithm}</strong>
                </div>
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                  <span className="text-zinc-500">Merkle Leaf:</span>
                  <span className="font-mono text-cyan-300">{selectedEvent.compliance.merkleLeafHash.slice(0, 24)}...</span>
                </div>
              </div>
            </div>
          ) : selectedEvent.snapshot ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#0a0f1e] border border-white/5 space-y-3">
                <span className="text-[10px] text-cyan-400 font-bold block">
                  HARDWARE SUB-KELVIN & POWER TELEMETRY
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-zinc-500 block text-[10px]">CPU TEMPERATURE</span>
                    <span className="font-bold text-white text-sm">{selectedEvent.snapshot.cpuAverage}°C</span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-zinc-500 block text-[10px]">CRYO DILUTION</span>
                    <span className="font-bold text-cyan-300 text-sm">{selectedEvent.snapshot.cryoTempMk} mK</span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-zinc-500 block text-[10px]">QUANTUM OPERATIONS</span>
                    <span className="font-bold text-violet-300 text-sm">{selectedEvent.snapshot.qopsThroughput} QOps/s</span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-zinc-500 block text-[10px]">VOLTAGE STABILITY</span>
                    <span className="font-bold text-emerald-300 text-sm">{selectedEvent.snapshot.voltageStabilityPct}%</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0a0f1e] border border-white/5 space-y-3">
                <span className="text-[10px] text-emerald-400 font-bold block">
                  CHAIN OF CUSTODY &amp; MERKLE HASH ANCHOR
                </span>
                <div className="space-y-1.5 text-[11px]">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">SEALED LEAF HASH</span>
                    <div className="p-2 rounded-xl bg-black/60 border border-white/10 text-cyan-300 font-mono text-[10px] break-all flex items-center justify-between gap-2">
                      <span>{selectedEvent.snapshot.sealedHash}</span>
                      <button
                        onClick={() => {
                          copyToClipboard(selectedEvent.snapshot!.sealedHash);
                          setCopiedHash(selectedEvent.snapshot!.sealedHash);
                          setTimeout(() => setCopiedHash(null), 2000);
                        }}
                        className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 hover:text-white shrink-0"
                      >
                        {copiedHash === selectedEvent.snapshot.sealedHash ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <div className="pt-2 flex items-center justify-between text-[10px] text-zinc-400">
                    <span>Tenants Range: Ω600-Ω1000 (400 Tenants LOCKED)</span>
                    <span className="text-emerald-400 font-bold">14,902 Canonical Seals</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
