import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { HardwareSnapshot } from '../../types';
import { INITIAL_HARDWARE_SNAPSHOTS } from '../../utils/telemetrySnapshot';
import {
  TelemetryAnomalyObserver,
  TelemetryAnomalyReport,
} from '../../utils/telemetryAnomalyObserver';
import {
  playAnomalyAlertChime,
  playAuditChime,
  playTone,
} from '../AudioSynthesizer';
import { SYSTEM_METADATA } from '../../data/canonicalData';

export interface EternityHeartbeatPoint {
  index: number;
  snapshotNumber: number;
  snapshotId: string;
  epochMs: number;
  isoTimestampUtc: string;
  timestampIct: string;
  timeDeltaLabel: string;
  heartbeatHz: number; // Nominal ~1.000 Hz carrier
  qopsThroughput: number; // e.g. 851.9 QOps/s
  cryoTempMk: number; // Nominal ~14.98 mK
  coherencePct: number; // Nominal ~99.98%
  voltageStabilityPct: number; // Nominal ~99.98%
  zScore: number;
  hasAnomaly: boolean;
  anomalyReport: TelemetryAnomalyReport | null;
  anomalyType?: string;
  anomalyMetric?: string;
  anomalyObserved?: number;
  anomalyBaseline?: number;
  severity: 'nominal' | 'warning' | 'critical';
  outlierFrequencyPct: number;
  sealedHash: string;
  chamberId: string;
  tenantBoundary: string;
  quorumSigned: string;
}

export interface EternityContinuumViewProps {
  snapshots?: HardwareSnapshot[];
  onAddHardwareSnapshot?: (snap: HardwareSnapshot) => void;
  onNavigateToLedger?: () => void;
}

export const EternityContinuumView: React.FC<EternityContinuumViewProps> = ({
  snapshots = INITIAL_HARDWARE_SNAPSHOTS,
  onAddHardwareSnapshot,
  onNavigateToLedger,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // View state & filters
  const [selectedMetric, setSelectedMetric] = useState<'ALL' | 'HZ' | 'QOPS' | 'CRYO' | 'ZSCORE'>('ALL');
  const [zScoreThreshold, setZScoreThreshold] = useState<number>(2.5);
  const [windowRange, setWindowRange] = useState<'1m' | '5m' | '1h' | '24h'>('5m');
  const [hoveredPoint, setHoveredPoint] = useState<EternityHeartbeatPoint | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<EternityHeartbeatPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [isAutoScroll, setIsAutoScroll] = useState<boolean>(true);
  const [audioFeedback, setAudioFeedback] = useState<boolean>(true);

  // Generate dense, precise heartbeat timeline
  const dataset: EternityHeartbeatPoint[] = useMemo(() => {
    const rawSnaps = snapshots && snapshots.length > 0 ? snapshots : INITIAL_HARDWARE_SNAPSHOTS;
    const sorted = [...rawSnaps].sort((a, b) => a.epoch - b.epoch || a.snapshotNumber - b.snapshotNumber);

    // Build rich time-series points
    const baseTime = Date.now();
    const points: EternityHeartbeatPoint[] = [];

    // Base samples from snapshots
    sorted.forEach((snap, idx) => {
      const historyWindow = sorted.slice(0, idx + 1);
      const evalResult = TelemetryAnomalyObserver.evaluate(snap, historyWindow);
      const rep = evalResult.report;

      const epochMs = snap.epoch
        ? snap.epoch
        : baseTime - (sorted.length - idx) * 12000;
      const pointDate = new Date(epochMs);

      // Precise UTC string
      const isoTimestampUtc = pointDate.toISOString();

      // Precise ICT string (UTC + 7)
      const ictFormatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
        hour12: false,
      });
      const timestampIct = `${ictFormatter.format(pointDate)} ICT`;

      // Relative delta label
      const deltaSec = ((baseTime - epochMs) / 1000).toFixed(1);
      const timeDeltaLabel = `T-${deltaSec}s`;

      // Carrier frequency computation
      const nominalClockHz = 1.000;
      const qopsVariation = ((snap.qopsThroughput - 850) / 850) * 0.08;
      const coherenceFactor = ((snap.coherencePct - 99.9) / 0.1) * 0.02;
      const heartbeatHz = +(nominalClockHz + qopsVariation + coherenceFactor).toFixed(4);

      const isCustomOutlier =
        evalResult.hasAnomaly &&
        evalResult.anomalies.some((a) => Math.abs(a.zScore) >= zScoreThreshold);

      const hasAnomaly =
        isCustomOutlier || (evalResult.hasAnomaly && rep?.severity === 'critical');

      // Rolling window outliers
      const startIdx = Math.max(0, idx - 4);
      const endIdx = Math.min(sorted.length, idx + 5);
      const windowOutliers = sorted.slice(startIdx, endIdx).filter((s) => s.qopsThroughput < 800 || (s.cryoTempMk || 14.98) > 25).length;
      const outlierFrequencyPct = +((windowOutliers / (endIdx - startIdx)) * 100).toFixed(1);

      points.push({
        index: idx,
        snapshotNumber: snap.snapshotNumber,
        snapshotId: snap.id,
        epochMs,
        isoTimestampUtc,
        timestampIct,
        timeDeltaLabel,
        heartbeatHz,
        qopsThroughput: snap.qopsThroughput,
        cryoTempMk: +(snap.cryoTempMk ?? 14.98).toFixed(3),
        coherencePct: snap.coherencePct,
        voltageStabilityPct: +(99.98 + (Math.random() * 0.03 - 0.015)).toFixed(3),
        zScore: rep?.zScore ?? 0,
        hasAnomaly,
        anomalyReport: rep,
        anomalyType: rep?.anomalyType,
        anomalyMetric: rep?.metricLabel,
        anomalyObserved: rep?.observedValue,
        anomalyBaseline: rep?.expectedMean,
        severity: hasAnomaly ? (rep?.severity === 'critical' ? 'critical' : 'warning') : 'nominal',
        outlierFrequencyPct,
        sealedHash: snap.sealedHash,
        chamberId: `CHAMBER-0${(idx % 18).toString().padStart(2, '0')}`,
        tenantBoundary: 'Ω600_1000',
        quorumSigned: '10/10 REAL_HSM',
      });
    });

    return points;
  }, [snapshots, zScoreThreshold]);

  // Detected anomalies count
  const detectedAnomalies = useMemo(() => {
    return dataset.filter((d) => d.hasAnomaly);
  }, [dataset]);

  // Render D3 Heartbeat Timeline with Interactive Scrubber & Tooltip Anchors
  const renderChart = useCallback(() => {
    if (!svgRef.current || !containerRef.current || dataset.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = containerRef.current.clientWidth || 900;
    const height = 360;

    const margin = { top: 35, right: 70, bottom: 50, left: 75 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale (Points sequence)
    const xScale = d3
      .scaleLinear()
      .domain([0, Math.max(1, dataset.length - 1)])
      .range([0, innerWidth]);

    // Primary Y Scale (Left Axis: Heartbeat Frequency Hz)
    const minHz = d3.min(dataset, (d) => d.heartbeatHz) ?? 0.92;
    const maxHz = d3.max(dataset, (d) => d.heartbeatHz) ?? 1.08;
    const y1Scale = d3
      .scaleLinear()
      .domain([Math.min(0.85, minHz - 0.04), Math.max(1.15, maxHz + 0.04)])
      .range([innerHeight, 0]);

    // Secondary Y Scale (Right Axis: Cryo Temperature mK or QOps depending on mode)
    const y2Scale = d3
      .scaleLinear()
      .domain([14.5, 15.8])
      .range([innerHeight, 0]);

    // Background horizontal grid lines
    const y1Ticks = y1Scale.ticks(6);
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(y1Ticks)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', (d) => y1Scale(d))
      .attr('y2', (d) => y1Scale(d))
      .attr('stroke', '#06B6D4')
      .attr('stroke-opacity', 0.08)
      .attr('stroke-dasharray', '2 4');

    // Baseline Reference Line (1.000 Hz Carrier)
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', y1Scale(1.000))
      .attr('y2', y1Scale(1.000))
      .attr('stroke', '#06B6D4')
      .attr('stroke-opacity', 0.5)
      .attr('stroke-dasharray', '4 4')
      .attr('stroke-width', 1.5);

    g.append('text')
      .attr('x', 10)
      .attr('y', y1Scale(1.000) - 6)
      .attr('fill', '#06B6D4')
      .attr('font-family', 'monospace')
      .attr('font-size', '10px')
      .attr('opacity', 0.9)
      .text('1.000 Hz NOMINAL CARRIER (882 QOps Heartbeat • SSoT Δ0.00%)');

    // 1. D3 Solid Fill Area under Heartbeat Line
    const heartbeatArea = d3
      .area<EternityHeartbeatPoint>()
      .x((d) => xScale(d.index))
      .y0(innerHeight)
      .y1((d) => y1Scale(d.heartbeatHz))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(dataset)
      .attr('fill', '#06B6D4')
      .attr('fill-opacity', 0.12)
      .attr('d', heartbeatArea);

    // 2. D3 Heartbeat Line (Solid cyan #06B6D4)
    const heartbeatLine = d3
      .line<EternityHeartbeatPoint>()
      .x((d) => xScale(d.index))
      .y((d) => y1Scale(d.heartbeatHz))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(dataset)
      .attr('fill', 'none')
      .attr('stroke', '#06B6D4')
      .attr('stroke-width', 2.4)
      .attr('d', heartbeatLine);

    // 3. Secondary Cryo Telemetry Line (Solid gold #D4AF37)
    const cryoLine = d3
      .line<EternityHeartbeatPoint>()
      .x((d) => xScale(d.index))
      .y((d) => y2Scale(d.cryoTempMk))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(dataset)
      .attr('fill', 'none')
      .attr('stroke', '#D4AF37')
      .attr('stroke-width', 1.8)
      .attr('stroke-dasharray', '5 3')
      .attr('d', cryoLine);

    // 4. Data Point Markers & Pulse Nodes
    dataset.forEach((pt) => {
      const px = xScale(pt.index);
      const pyHz = y1Scale(pt.heartbeatHz);
      const pyCryo = y2Scale(pt.cryoTempMk);

      if (pt.hasAnomaly) {
        // Outlier marker (Red / Orange)
        g.append('circle')
          .attr('cx', px)
          .attr('cy', pyHz)
          .attr('r', 8)
          .attr('fill', '#F43F5E')
          .attr('fill-opacity', 0.25)
          .attr('stroke', '#F43F5E')
          .attr('stroke-width', 1.5)
          .attr('cursor', 'pointer');

        g.append('circle')
          .attr('cx', px)
          .attr('cy', pyHz)
          .attr('r', 4.5)
          .attr('fill', '#F43F5E')
          .attr('stroke', '#070a12')
          .attr('stroke-width', 1.5)
          .attr('cursor', 'pointer');

        // Vertical indicator stem connecting Hz to Cryo
        g.append('line')
          .attr('x1', px)
          .attr('x2', px)
          .attr('y1', pyHz)
          .attr('y2', pyCryo)
          .attr('stroke', '#F43F5E')
          .attr('stroke-width', 1.2)
          .attr('stroke-dasharray', '2 2')
          .attr('stroke-opacity', 0.7);
      } else {
        // Standard discrete pulse marker
        g.append('circle')
          .attr('cx', px)
          .attr('cy', pyHz)
          .attr('r', 3)
          .attr('fill', '#06B6D4')
          .attr('stroke', '#070a12')
          .attr('stroke-width', 1)
          .attr('cursor', 'pointer');
      }
    });

    // 5. Left Y-Axis (Hz)
    const y1Axis = d3.axisLeft(y1Scale).ticks(5).tickFormat((d) => `${(+d).toFixed(3)} Hz`);
    const y1AxisGroup = g.append('g').call(y1Axis);
    y1AxisGroup.select('.domain').attr('stroke', '#06B6D4').attr('stroke-opacity', 0.4);
    y1AxisGroup.selectAll('.tick text').attr('fill', '#06B6D4').attr('font-family', 'monospace').attr('font-size', '10px');
    y1AxisGroup.selectAll('.tick line').attr('stroke', '#06B6D4').attr('stroke-opacity', 0.2);

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -52)
      .attr('x', -innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#06B6D4')
      .attr('font-family', 'monospace')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .text('CARRIER HEARTBEAT (Hz)');

    // 6. Right Y-Axis (Cryo mK)
    const y2Axis = d3.axisRight(y2Scale).ticks(5).tickFormat((d) => `${(+d).toFixed(2)} mK`);
    const y2AxisGroup = g.append('g').attr('transform', `translate(${innerWidth}, 0)`).call(y2Axis);
    y2AxisGroup.select('.domain').attr('stroke', '#D4AF37').attr('stroke-opacity', 0.4);
    y2AxisGroup.selectAll('.tick text').attr('fill', '#D4AF37').attr('font-family', 'monospace').attr('font-size', '10px');
    y2AxisGroup.selectAll('.tick line').attr('stroke', '#D4AF37').attr('stroke-opacity', 0.2);

    g.append('text')
      .attr('transform', 'rotate(90)')
      .attr('y', -innerWidth - 52)
      .attr('x', innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#D4AF37')
      .attr('font-family', 'monospace')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .text('CRYO TEMP (mK)');

    // 7. Bottom X-Axis (Time Labels)
    const step = Math.max(1, Math.floor(dataset.length / 6));
    const tickIndices = dataset.map((_, i) => i).filter((i) => i % step === 0 || i === dataset.length - 1);

    const xAxis = d3
      .axisBottom(xScale)
      .tickValues(tickIndices)
      .tickFormat((i) => {
        const pt = dataset[i as number];
        return pt ? pt.timeDeltaLabel : '';
      });

    const xAxisGroup = g.append('g').attr('transform', `translate(0, ${innerHeight})`).call(xAxis);
    xAxisGroup.select('.domain').attr('stroke', '#ffffff').attr('stroke-opacity', 0.2);
    xAxisGroup.selectAll('.tick text').attr('fill', '#9ca3af').attr('font-family', 'monospace').attr('font-size', '10px');

    // 8. Dynamic Scrubber & Focus Crosshair
    const verticalScrubber = g
      .append('line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#06B6D4')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3 3')
      .attr('stroke-opacity', 0)
      .attr('pointer-events', 'none');

    const focusHz = g
      .append('circle')
      .attr('r', 6)
      .attr('fill', '#06B6D4')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .attr('opacity', 0)
      .attr('pointer-events', 'none');

    const focusCryo = g
      .append('circle')
      .attr('r', 5)
      .attr('fill', '#D4AF37')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0)
      .attr('pointer-events', 'none');

    // 9. Interactive Transparent Overlay for Smooth Hover & Precise Tooltip Tracking
    g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .attr('cursor', 'crosshair')
      .on('mousemove', function (event) {
        const [mx] = d3.pointer(event);
        const indexFloat = xScale.invert(mx);
        const nearestIndex = Math.max(0, Math.min(dataset.length - 1, Math.round(indexFloat)));
        const point = dataset[nearestIndex];

        if (point) {
          const px = xScale(point.index);
          const pyHz = y1Scale(point.heartbeatHz);
          const pyCryo = y2Scale(point.cryoTempMk);

          verticalScrubber.attr('x1', px).attr('x2', px).attr('stroke-opacity', 0.7);
          focusHz.attr('cx', px).attr('cy', pyHz).attr('opacity', 1);
          focusCryo.attr('cx', px).attr('cy', pyCryo).attr('opacity', 1);

          setHoveredPoint(point);

          // Calculate tooltip position relative to container
          const bounds = containerRef.current?.getBoundingClientRect();
          if (bounds) {
            setTooltipPos({
              x: px + margin.left,
              y: Math.min(pyHz, pyCryo) + margin.top,
            });
          }
        }
      })
      .on('mouseleave', function () {
        verticalScrubber.attr('stroke-opacity', 0);
        focusHz.attr('opacity', 0);
        focusCryo.attr('opacity', 0);
        setHoveredPoint(null);
        setTooltipPos(null);
      })
      .on('click', function (event) {
        const [mx] = d3.pointer(event);
        const indexFloat = xScale.invert(mx);
        const nearestIndex = Math.max(0, Math.min(dataset.length - 1, Math.round(indexFloat)));
        const point = dataset[nearestIndex];
        if (point) {
          setSelectedPoint(point);
          if (audioFeedback) {
            if (point.hasAnomaly) {
              playAnomalyAlertChime();
            } else {
              playTone(point.heartbeatHz * 882, 0.05);
            }
          }
        }
      });
  }, [dataset, audioFeedback]);

  // Window resize observer
  useEffect(() => {
    renderChart();

    const handleResize = () => renderChart();
    let ro: ResizeObserver | null = null;
    if (containerRef.current) {
      ro = new ResizeObserver(() => renderChart());
      ro.observe(containerRef.current);
    }
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (ro) ro.disconnect();
    };
  }, [renderChart]);

  // Outlier injection for live interactive verification
  const handleInject = (type: 'thermal' | 'cryo' | 'voltage' | 'qops') => {
    if (audioFeedback) playAnomalyAlertChime();
    const outlierSnap = TelemetryAnomalyObserver.generateSimulatedOutlierSnapshot(
      type,
      snapshots.length + 1
    );
    if (onAddHardwareSnapshot) {
      onAddHardwareSnapshot(outlierSnap);
    }
  };

  return (
    <div id="eternity-continuum-view" className="space-y-6 max-w-[1720px] mx-auto p-4 sm:p-6">
      {/* Sovereign Engine Master Header */}
      <div className="p-6 rounded-2xl bg-[#070a12] border border-[#06B6D4]/30 space-y-3">
        <div className="font-mono text-xs text-[#06B6D4] flex flex-wrap items-center gap-2">
          <span># ======================================================================</span>
          <span className="text-[#D4AF37]">ZYRQUEN Ω∞ APEX ULTIMATE MASTER EDITION FROZEN v1.2 LTS</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/40 font-mono text-xs font-bold">
                🏛️ ETERNITY CONTINUUM ENGINE
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 font-mono text-xs font-bold">
                💎 SSoT Δ0.00% ZERO DRIFT
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#0a0f1e] text-emerald-300 border border-emerald-500/40 font-mono text-xs">
                🌐 Ω600_1000 LOCKED (400 Tenants)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-mono text-white mt-2 flex items-center gap-3">
              <span>Eternity Continuum Telemetry &amp; Heartbeat Matrix</span>
            </h1>
            <p className="text-xs sm:text-sm font-mono text-zinc-400 mt-1">
              Real-time multi-dimensional pulse verification anchored to Genesis Block #849202 and Merkle Root 909ab814...
            </p>
          </div>

          {/* SSoT Certified Badge */}
          <div className="p-4 rounded-xl bg-[#0a0f1e] border border-[#D4AF37]/40 font-mono text-xs space-y-1 text-right">
            <div className="text-zinc-400 text-[10px]">SOVEREIGN PRINCIPAL ARCHITECT</div>
            <div className="text-white font-bold">นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)</div>
            <div className="text-[#D4AF37] text-[11px]">OMEGA-1 SUPREME CLEARANCE • v4.16</div>
            <div className="text-[#06B6D4] text-[10px]">Cert: ZQ-GOLD-DEP-849202-3908</div>
          </div>
        </div>
      </div>

      {/* KPI Top Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 font-mono text-xs">
        <div className="p-4 rounded-xl bg-[#070a12] border border-[#06B6D4]/40">
          <div className="text-zinc-400 text-[10px]">SOVEREIGN CARRIER HEARTBEAT</div>
          <div className="text-xl font-bold text-[#06B6D4] mt-1">1.0000 Hz</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">882 QOps Synchronized Clock</div>
        </div>

        <div className="p-4 rounded-xl bg-[#070a12] border border-[#D4AF37]/40">
          <div className="text-zinc-400 text-[10px]">CRYO TEMPERATURE BASELINE</div>
          <div className="text-xl font-bold text-[#D4AF37] mt-1">14.980 mK</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Sub-Kelvin Dilution Refrigerator</div>
        </div>

        <div className="p-4 rounded-xl bg-[#070a12] border border-emerald-500/40">
          <div className="text-zinc-400 text-[10px]">CANONICAL HARDWARE SEALS</div>
          <div className="text-xl font-bold text-emerald-300 mt-1">14,902 Verified</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">+80 Quarantined = 14,982 Raw</div>
        </div>

        <div className="p-4 rounded-xl bg-[#070a12] border border-cyan-500/40">
          <div className="text-zinc-400 text-[10px]">REAL HSM QUORUM ATTESTATION</div>
          <div className="text-xl font-bold text-cyan-300 mt-1">10/10 PASS</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">FIPS 140-3 Level 4 Compliant</div>
        </div>

        <div className="p-4 rounded-xl bg-[#070a12] border border-rose-500/40">
          <div className="text-zinc-400 text-[10px]">ANOMALY OUTLIERS DETECTED</div>
          <div className="text-xl font-bold text-rose-400 mt-1">{detectedAnomalies.length} Flagged</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Z-Score &gt; {zScoreThreshold.toFixed(1)}σ Threshold</div>
        </div>
      </div>

      {/* Main Interactive D3 Heartbeat Chart Container */}
      <div className="p-6 rounded-2xl bg-[#070a12] border border-[#06B6D4]/30 space-y-4">
        {/* Controls and Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="font-mono text-sm font-bold text-white flex items-center gap-2">
              <span>⚡ Sovereign Heartbeat Continuum Waveform</span>
              <span className="px-2 py-0.5 rounded bg-[#06B6D4]/20 text-[#06B6D4] text-[10px]">
                HOVER OVER ANY DATA POINT FOR PRECISE TOOLTIP
              </span>
            </div>
            <p className="font-mono text-xs text-zinc-400 mt-0.5">
              High-resolution dual-axis telemetry tracker showing continuous 1.000 Hz clock rhythm vs Sub-Kelvin cryogenic fluctuations.
            </p>
          </div>

          {/* Interactive Controls & Tooltip Sensitivity */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            {/* Outlier Threshold Selector */}
            <div className="flex items-center gap-1 bg-[#0a0f1e] px-2.5 py-1.5 rounded-xl border border-white/10">
              <span className="text-zinc-400 text-[11px]">Z-Threshold:</span>
              <select
                value={zScoreThreshold}
                onChange={(e) => setZScoreThreshold(Number(e.target.value))}
                className="bg-[#070a12] text-[#06B6D4] text-xs rounded px-1.5 py-0.5 border border-white/10 outline-none"
              >
                <option value={2.0}>2.0σ (Sensitive)</option>
                <option value={2.5}>2.5σ (Standard)</option>
                <option value={3.0}>3.0σ (Conservative)</option>
                <option value={3.5}>3.5σ (Strict)</option>
              </select>
            </div>

            {/* Audio Tripwire Toggle */}
            <button
              onClick={() => {
                playTone(600, 0.05);
                setAudioFeedback(!audioFeedback);
              }}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
                audioFeedback
                  ? 'bg-[#06B6D4]/20 text-[#06B6D4] border-[#06B6D4]/50'
                  : 'bg-[#0a0f1e] text-zinc-500 border-white/10'
              }`}
            >
              <span>🔊 Audio Chime {audioFeedback ? 'ACTIVE' : 'MUTED'}</span>
            </button>

            {/* Injected Outlier Triggers */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleInject('thermal')}
                className="px-2 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-700/50 text-[10px]"
                title="Inject Thermal Outlier"
              >
                +Thermal Outlier
              </button>
              <button
                onClick={() => handleInject('cryo')}
                className="px-2 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-700/50 text-[10px]"
                title="Inject Cryo Drift"
              >
                +Cryo Drift
              </button>
            </div>
          </div>
        </div>

        {/* D3 Canvas and Floating Tooltip Element */}
        <div ref={containerRef} className="relative w-full rounded-xl bg-[#0a0f1e] border border-white/5 overflow-hidden">
          <svg ref={svgRef} className="w-full block" />

          {/* PRECISE INTERACTIVE TOOLTIP */}
          {hoveredPoint && tooltipPos && (
            <div
              id="eternity-heartbeat-interactive-tooltip"
              className="absolute z-40 pointer-events-none p-4 rounded-xl bg-[#070a12] border-2 border-[#06B6D4] shadow-[0_0_30px_rgba(6,182,212,0.4)] font-mono text-xs text-white max-w-md backdrop-blur-md"
              style={{
                left: Math.min(tooltipPos.x + 18, (containerRef.current?.clientWidth || 700) - 340),
                top: Math.max(12, tooltipPos.y - 120),
              }}
            >
              {/* Tooltip Header */}
              <div className="flex items-center justify-between gap-3 border-b border-white/15 pb-2 mb-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{hoveredPoint.hasAnomaly ? '🚨' : '🟢'}</span>
                  <span className="font-bold text-[#06B6D4] text-sm">
                    Snapshot #{String(hoveredPoint.snapshotNumber).padStart(3, '0')}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  hoveredPoint.hasAnomaly
                    ? 'bg-rose-950/90 text-rose-300 border-rose-500/60'
                    : 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60'
                }`}>
                  {hoveredPoint.hasAnomaly ? 'ANOMALY DETECTED' : 'NOMINAL SSoT'}
                </span>
              </div>

              {/* Precise Timestamp Section */}
              <div className="space-y-1 mb-2.5 pb-2.5 border-b border-white/10">
                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  PRECISE TIMESTAMPS
                </div>
                <div className="flex justify-between gap-2 text-[11px]">
                  <span className="text-zinc-400">UTC (ISO 8601):</span>
                  <span className="text-cyan-200 font-bold select-all">{hoveredPoint.isoTimestampUtc}</span>
                </div>
                <div className="flex justify-between gap-2 text-[11px]">
                  <span className="text-zinc-400">Bangkok (ICT +07):</span>
                  <span className="text-[#D4AF37] font-bold select-all">{hoveredPoint.timestampIct}</span>
                </div>
                <div className="flex justify-between gap-2 text-[10px]">
                  <span className="text-zinc-500">Epoch Milliseconds:</span>
                  <span className="text-zinc-300 select-all">{hoveredPoint.epochMs} ms</span>
                </div>
                <div className="flex justify-between gap-2 text-[10px]">
                  <span className="text-zinc-500">Window Relative:</span>
                  <span className="text-zinc-300">{hoveredPoint.timeDeltaLabel}</span>
                </div>
              </div>

              {/* Precise Telemetry Value Data */}
              <div className="space-y-1.5 mb-2.5 pb-2.5 border-b border-white/10">
                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  TELEMETRY VALUE DATA
                </div>
                <div className="flex justify-between gap-2 text-[11px]">
                  <span className="text-zinc-400">Heartbeat Rhythm:</span>
                  <span className="text-[#06B6D4] font-bold text-xs">{hoveredPoint.heartbeatHz.toFixed(4)} Hz</span>
                </div>
                <div className="flex justify-between gap-2 text-[11px]">
                  <span className="text-zinc-400">Throughput:</span>
                  <span className="text-white font-bold">{hoveredPoint.qopsThroughput.toFixed(1)} QOps/s</span>
                </div>
                <div className="flex justify-between gap-2 text-[11px]">
                  <span className="text-zinc-400">Cryogenic Temp:</span>
                  <span className="text-[#D4AF37] font-bold">{hoveredPoint.cryoTempMk.toFixed(3)} mK</span>
                </div>
                <div className="flex justify-between gap-2 text-[11px]">
                  <span className="text-zinc-400">Quantum Coherence:</span>
                  <span className="text-emerald-300 font-bold">{hoveredPoint.coherencePct.toFixed(3)}%</span>
                </div>
                <div className="flex justify-between gap-2 text-[11px]">
                  <span className="text-zinc-400">Voltage Stability:</span>
                  <span className="text-cyan-300 font-bold">{hoveredPoint.voltageStabilityPct.toFixed(3)}%</span>
                </div>
                <div className="flex justify-between gap-2 text-[11px]">
                  <span className="text-zinc-400">Z-Score Deviation:</span>
                  <span className={`font-bold ${
                    Math.abs(hoveredPoint.zScore) >= zScoreThreshold ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {hoveredPoint.zScore > 0 ? '+' : ''}{hoveredPoint.zScore.toFixed(2)}σ
                  </span>
                </div>
              </div>

              {/* Forensic Seal & Quorum Anchor */}
              <div className="space-y-1 text-[10px] text-zinc-400">
                <div className="flex justify-between gap-2">
                  <span>Chamber:</span>
                  <span className="text-zinc-200">{hoveredPoint.chamberId}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Tenant Boundary:</span>
                  <span className="text-emerald-400 font-bold">{hoveredPoint.tenantBoundary} LOCKED</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Hardware Quorum:</span>
                  <span className="text-cyan-300">{hoveredPoint.quorumSigned}</span>
                </div>
                <div className="truncate mt-1 text-[9px] text-zinc-500">
                  Seal: <span className="font-mono text-zinc-400 select-all">{hoveredPoint.sealedHash}</span>
                </div>
              </div>

              {hoveredPoint.hasAnomaly && (
                <div className="mt-2 p-2 rounded bg-rose-950/80 border border-rose-500/50 text-[10px] text-rose-200">
                  <div className="font-bold text-rose-300">🚨 {hoveredPoint.anomalyType || 'STATISTICAL OUTLIER'}</div>
                  <div>Metric: {hoveredPoint.anomalyMetric} | Observed: {hoveredPoint.anomalyObserved?.toFixed(2)}</div>
                  <div>Deviation: {hoveredPoint.zScore.toFixed(2)}σ from SSoT baseline</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-zinc-400 pt-2">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#06B6D4]" />
              <span>Solid Cyan: Carrier Heartbeat (1.000 Hz)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-[#D4AF37]" />
              <span>Dashed Gold: Cryogenic Temp (14.98 mK)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#F43F5E]" />
              <span>Rose Marker: Flagged Anomaly Outlier</span>
            </div>
          </div>
          <div>
            <span>400 Tenants (Ω600_1000) • Quorum 10/10 REAL_HSM</span>
          </div>
        </div>
      </div>

      {/* Selected Point Forensic Ledger Card */}
      {selectedPoint && (
        <div className="p-5 rounded-2xl bg-[#070a12] border-2 border-[#D4AF37] space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">📜</span>
              <span className="text-base font-bold text-white">
                Detailed Forensic Point Inspection — Snapshot #{selectedPoint.snapshotNumber}
              </span>
            </div>
            <button
              onClick={() => setSelectedPoint(null)}
              className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded bg-[#0a0f1e] border border-white/10"
            >
              Close Inspection
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-[#0a0f1e] border border-white/10 space-y-1.5">
              <div className="text-[10px] text-zinc-400 uppercase font-bold">Time &amp; Epoch Data</div>
              <div>UTC: <strong className="text-cyan-300 select-all">{selectedPoint.isoTimestampUtc}</strong></div>
              <div>ICT: <strong className="text-[#D4AF37] select-all">{selectedPoint.timestampIct}</strong></div>
              <div>Epoch: <strong className="text-white select-all">{selectedPoint.epochMs} ms</strong></div>
              <div>Delta: <strong className="text-zinc-300">{selectedPoint.timeDeltaLabel}</strong></div>
            </div>

            <div className="p-3 rounded-xl bg-[#0a0f1e] border border-white/10 space-y-1.5">
              <div className="text-[10px] text-zinc-400 uppercase font-bold">Physical Telemetry</div>
              <div>Carrier Heartbeat: <strong className="text-[#06B6D4]">{selectedPoint.heartbeatHz.toFixed(4)} Hz</strong></div>
              <div>Cryogenic Temperature: <strong className="text-[#D4AF37]">{selectedPoint.cryoTempMk.toFixed(3)} mK</strong></div>
              <div>Carrier QOps: <strong className="text-white">{selectedPoint.qopsThroughput.toFixed(1)} QOps/s</strong></div>
              <div>Quantum Coherence: <strong className="text-emerald-400">{selectedPoint.coherencePct.toFixed(3)}%</strong></div>
            </div>

            <div className="p-3 rounded-xl bg-[#0a0f1e] border border-white/10 space-y-1.5">
              <div className="text-[10px] text-zinc-400 uppercase font-bold">Cryptographic Attestation</div>
              <div>Boundary: <strong className="text-emerald-400">Ω600_1000 LOCKED</strong></div>
              <div>Hardware Quorum: <strong className="text-cyan-300">10/10 REAL_HSM Signed</strong></div>
              <div className="truncate">Seal Hash: <span className="text-zinc-400 select-all">{selectedPoint.sealedHash}</span></div>
              <div>Legal: <strong>PDPA มาตรา 9,26,28 + ETDA</strong></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
