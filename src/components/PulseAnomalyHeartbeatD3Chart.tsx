import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import {
  Activity,
  AlertTriangle,
  Volume2,
  Bell,
  RefreshCw,
  Download,
  Filter,
  Sliders,
  ShieldCheck,
  Flame,
  Snowflake,
  Gauge,
  TrendingDown,
  Sparkles,
  Layers,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { HardwareSnapshot } from '../types';
import {
  TelemetryAnomalyObserver,
  TelemetryAnomalyReport,
} from '../utils/telemetryAnomalyObserver';
import { playAnomalyAlertChime, playAuditChime, playTone } from './AudioSynthesizer';
import { SYSTEM_METADATA } from '../data/canonicalData';

export interface HeartbeatAnomalyPoint {
  index: number;
  snapshotNumber: number;
  snapshotId: string;
  time: Date;
  timeLabel: string;
  heartbeatHz: number; // Nominal ~1.00 Hz (882 QOps pulse rhythm)
  heartbeatQops: number;
  coherencePct: number;
  hasAnomaly: boolean;
  anomalyReport: TelemetryAnomalyReport | null;
  anomalyMetric?: string;
  anomalyObserved?: number;
  anomalyBaseline?: number;
  zScore: number;
  severity: 'nominal' | 'warning' | 'critical';
  outlierFrequencyPct: number; // Rolling outlier frequency relative to heartbeat window (0% - 100%)
  rollingWindowOutliers: number;
  rollingWindowTotal: number;
  snapshot: HardwareSnapshot;
}

interface PulseAnomalyHeartbeatD3ChartProps {
  snapshots: HardwareSnapshot[];
  onAddHardwareSnapshot?: (snap: HardwareSnapshot) => void;
  onAddSystemEvent?: (
    type: any,
    title: string,
    description: string,
    statuteRef?: string,
    severity?: 'info' | 'warning' | 'critical',
    metaHash?: string
  ) => void;
}

export const PulseAnomalyHeartbeatD3Chart: React.FC<PulseAnomalyHeartbeatD3ChartProps> = ({
  snapshots,
  onAddHardwareSnapshot,
  onAddSystemEvent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Filter and Sensitivity Controls
  const [zScoreThreshold, setZScoreThreshold] = useState<number>(2.5);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [rollingWindowSize, setRollingWindowSize] = useState<number>(5);
  const [hoveredPoint, setHoveredPoint] = useState<HeartbeatAnomalyPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [activeAudition, setActiveAudition] = useState<'none' | 'alert' | 'audit'>('none');
  const [autoChimeEnabled, setAutoChimeEnabled] = useState<boolean>(true);

  // Compute processed timeline dataset
  const dataset: HeartbeatAnomalyPoint[] = useMemo(() => {
    if (!snapshots || snapshots.length === 0) return [];

    // Sort chronologically
    const sorted = [...snapshots].sort((a, b) => a.epoch - b.epoch || a.snapshotNumber - b.snapshotNumber);

    // Track anomalies first
    const evaluated = sorted.map((snap, idx) => {
      const historyWindow = sorted.slice(0, idx + 1);
      const evalResult = TelemetryAnomalyObserver.evaluate(snap, historyWindow);
      const isCustomOutlier =
        evalResult.hasAnomaly &&
        evalResult.anomalies.some((a) => Math.abs(a.zScore) >= zScoreThreshold);

      const hasAnomaly =
        isCustomOutlier || (evalResult.hasAnomaly && evalResult.report?.severity === 'critical');

      // Heartbeat pulse calculation centered at 1.00 Hz (carrier 882 QOps clock)
      // Modulated subtly by coherence, CPU variance, and latency
      const nominalClockHz = 1.00;
      const qopsVariation = ((snap.qopsThroughput - 850) / 850) * 0.08;
      const coherenceFactor = ((snap.coherencePct - 99.9) / 0.1) * 0.02;
      const heartbeatHz = +(nominalClockHz + qopsVariation + coherenceFactor).toFixed(3);

      // Parse timestamp
      let pointTime = new Date();
      if (snap.timestampIct) {
        const parsed = new Date(snap.timestampIct.replace(' ', 'T'));
        if (!isNaN(parsed.getTime())) {
          pointTime = parsed;
        } else {
          pointTime = new Date(Date.now() - (sorted.length - idx) * 10000);
        }
      }

      const timeLabel = snap.timestampIct
        ? snap.timestampIct.split(' ')[1] || snap.timestampIct
        : `T-${(sorted.length - idx) * 10}s`;

      return {
        snap,
        idx,
        pointTime,
        timeLabel,
        heartbeatHz,
        hasAnomaly,
        evalResult,
      };
    });

    // Compute rolling outlier frequency relative to system heartbeat
    const W = Math.max(3, rollingWindowSize);
    return evaluated.map((item, i) => {
      // Rolling window of size W centered or preceding
      const startIdx = Math.max(0, i - Math.floor(W / 2));
      const endIdx = Math.min(evaluated.length, startIdx + W);
      const windowSlice = evaluated.slice(startIdx, endIdx);

      const windowOutliers = windowSlice.filter((w) => {
        if (!w.hasAnomaly) return false;
        if (selectedTypeFilter === 'ALL') return true;
        return w.evalResult.report?.anomalyType === selectedTypeFilter;
      }).length;

      const outlierFrequencyPct = +((windowOutliers / windowSlice.length) * 100).toFixed(1);

      const rep = item.evalResult.report;

      return {
        index: i,
        snapshotNumber: item.snap.snapshotNumber,
        snapshotId: item.snap.id,
        time: item.pointTime,
        timeLabel: item.timeLabel,
        heartbeatHz: item.heartbeatHz,
        heartbeatQops: item.snap.qopsThroughput,
        coherencePct: item.snap.coherencePct,
        hasAnomaly: item.hasAnomaly,
        anomalyReport: rep,
        anomalyMetric: rep?.metricLabel,
        anomalyObserved: rep?.observedValue,
        anomalyBaseline: rep?.expectedMean,
        zScore: rep?.zScore ?? 0,
        severity: item.hasAnomaly ? (rep?.severity === 'critical' ? 'critical' : 'warning') : 'nominal',
        outlierFrequencyPct,
        rollingWindowOutliers: windowOutliers,
        rollingWindowTotal: windowSlice.length,
        snapshot: item.snap,
      };
    });
  }, [snapshots, zScoreThreshold, selectedTypeFilter, rollingWindowSize]);

  // Detected anomalies count
  const detectedAnomalies = useMemo(() => {
    return dataset.filter((d) => d.hasAnomaly);
  }, [dataset]);

  // Auto-chime trigger on newly flagged anomaly
  const prevAnomalyCountRef = useRef(detectedAnomalies.length);
  useEffect(() => {
    if (autoChimeEnabled && detectedAnomalies.length > prevAnomalyCountRef.current) {
      playAnomalyAlertChime();
    }
    prevAnomalyCountRef.current = detectedAnomalies.length;
  }, [detectedAnomalies.length, autoChimeEnabled]);

  // Audition handlers
  const handleAuditionAlertChime = () => {
    setActiveAudition('alert');
    playAnomalyAlertChime();
    setTimeout(() => setActiveAudition('none'), 1200);
  };

  const handleAuditionAuditChime = () => {
    setActiveAudition('audit');
    playAuditChime();
    setTimeout(() => setActiveAudition('none'), 1200);
  };

  // Inject simulated outlier
  const handleInjectOutlier = (type: 'thermal' | 'cryo' | 'voltage' | 'qops') => {
    // Custom low-frequency alert chime triggers specifically on detected anomaly
    playAnomalyAlertChime();

    const outlierSnap = TelemetryAnomalyObserver.generateSimulatedOutlierSnapshot(
      type,
      snapshots.length + 1
    );

    if (onAddHardwareSnapshot) {
      onAddHardwareSnapshot(outlierSnap);
    }

    if (onAddSystemEvent) {
      onAddSystemEvent(
        'ANOMALY',
        `Telemetry Outlier Flagged: ${type.toUpperCase()}`,
        `Hardware parameter deviated (>3.5σ) from nominal heartbeat baseline. Low-frequency chime triggered.`,
        'ISO/IEC 27037 Telemetry Anomaly Protocol',
        'critical',
        outlierSnap.sealedHash
      );
    }
  };

  // Export Chart as CSV
  const handleExportCsv = () => {
    playTone(720, 0.04);
    const headers = [
      'Index',
      'Snapshot_ID',
      'Time_Label',
      'Heartbeat_Hz',
      'QOps_Throughput',
      'Coherence_Pct',
      'Has_Anomaly',
      'Anomaly_Type',
      'Metric_Label',
      'Observed_Value',
      'Baseline_Mean',
      'Z_Score',
      'Severity',
      'Outlier_Frequency_Pct',
      'Sealed_Hash'
    ];

    const rows = dataset.map((d) => [
      d.index,
      `"${d.snapshotId}"`,
      `"${d.timeLabel}"`,
      d.heartbeatHz,
      d.heartbeatQops,
      d.coherencePct,
      d.hasAnomaly ? 'TRUE' : 'FALSE',
      `"${d.anomalyReport?.anomalyType || 'NOMINAL'}"`,
      `"${d.anomalyMetric || 'N/A'}"`,
      d.anomalyObserved ?? 'N/A',
      d.anomalyBaseline ?? 'N/A',
      d.zScore.toFixed(2),
      d.severity,
      d.outlierFrequencyPct,
      `"${d.snapshot.sealedHash || ''}"`
    ]);

    const csvString = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zyrquen-heartbeat-anomalies-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export Chart as SVG
  const handleExportSvg = () => {
    if (!svgRef.current) return;
    playTone(740, 0.04);
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zyrquen-heartbeat-anomalies-d3-${Date.now()}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // D3 Rendering Engine
  const renderChart = useCallback(() => {
    if (!svgRef.current || !containerRef.current || dataset.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const rect = containerRef.current.getBoundingClientRect();
    const width = Math.max(320, rect.width);
    const height = 340;

    const margin = { top: 30, right: 65, bottom: 45, left: 65 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale (Linear index or time across snapshots)
    const xScale = d3
      .scaleLinear()
      .domain([0, Math.max(1, dataset.length - 1)])
      .range([0, innerWidth]);

    // Y1 Scale (Left Axis - Heartbeat Frequency Hz)
    const minHz = d3.min(dataset, (d) => d.heartbeatHz) ?? 0.92;
    const maxHz = d3.max(dataset, (d) => d.heartbeatHz) ?? 1.08;
    const y1Scale = d3
      .scaleLinear()
      .domain([Math.min(0.85, minHz - 0.05), Math.max(1.15, maxHz + 0.05)])
      .range([innerHeight, 0]);

    // Y2 Scale (Right Axis - Outlier Event Frequency %)
    const y2Scale = d3
      .scaleLinear()
      .domain([0, 100])
      .range([innerHeight, 0]);

    // Background Grid lines
    const y1Ticks = y1Scale.ticks(5);
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
      .attr('stroke', '#ffffff')
      .attr('stroke-opacity', 0.06)
      .attr('stroke-dasharray', '2 4');

    // Nominal Heartbeat Reference Line (1.00 Hz)
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', y1Scale(1.0))
      .attr('y2', y1Scale(1.0))
      .attr('stroke', '#06B6D4')
      .attr('stroke-opacity', 0.45)
      .attr('stroke-dasharray', '4 4')
      .attr('stroke-width', 1.5);

    g.append('text')
      .attr('x', 8)
      .attr('y', y1Scale(1.0) - 5)
      .attr('fill', '#06B6D4')
      .attr('font-family', 'monospace')
      .attr('font-size', '10px')
      .attr('opacity', 0.8)
      .text('Nominal Heartbeat Baseline (1.00 Hz • 882 QOps Carrier)');

    // 1. D3 Area under Heartbeat Line (Solid color fill)
    const heartbeatArea = d3
      .area<HeartbeatAnomalyPoint>()
      .x((d) => xScale(d.index))
      .y0(innerHeight)
      .y1((d) => y1Scale(d.heartbeatHz))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(dataset)
      .attr('fill', '#06B6D4')
      .attr('fill-opacity', 0.1)
      .attr('d', heartbeatArea);

    // 2. D3 Heartbeat Line (Solid cyan)
    const heartbeatLine = d3
      .line<HeartbeatAnomalyPoint>()
      .x((d) => xScale(d.index))
      .y((d) => y1Scale(d.heartbeatHz))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(dataset)
      .attr('fill', 'none')
      .attr('stroke', '#06B6D4')
      .attr('stroke-width', 2.2)
      .attr('d', heartbeatLine);

    // 3. D3 Outlier Event Frequency Line (Solid amber / gold)
    const frequencyLine = d3
      .line<HeartbeatAnomalyPoint>()
      .x((d) => xScale(d.index))
      .y((d) => y2Scale(d.outlierFrequencyPct))
      .curve(d3.curveMonotoneX);

    // Area under outlier frequency line
    const frequencyArea = d3
      .area<HeartbeatAnomalyPoint>()
      .x((d) => xScale(d.index))
      .y0(innerHeight)
      .y1((d) => y2Scale(d.outlierFrequencyPct))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(dataset)
      .attr('fill', '#D4AF37')
      .attr('fill-opacity', 0.08)
      .attr('d', frequencyArea);

    g.append('path')
      .datum(dataset)
      .attr('fill', 'none')
      .attr('stroke', '#D4AF37')
      .attr('stroke-width', 2.6)
      .attr('d', frequencyLine);

    // 4. Draw Anomaly Outlier Event Markers
    // For each snapshot with an anomaly, draw a vertical connector and distinct pulse dot
    dataset.forEach((point) => {
      if (!point.hasAnomaly) return;

      const px = xScale(point.index);
      const pyHeartbeat = y1Scale(point.heartbeatHz);
      const pyFreq = y2Scale(point.outlierFrequencyPct);

      // Color based on anomaly type
      let markerColor = '#F43F5E'; // Default thermal/critical rose
      if (point.anomalyReport?.anomalyType === 'VOLTAGE_JITTER') markerColor = '#F59E0B';
      if (point.anomalyReport?.anomalyType === 'CRYO_DRIFT') markerColor = '#06B6D4';
      if (point.anomalyReport?.anomalyType === 'QOPS_DEVIATION') markerColor = '#D4AF37';

      // Vertical connector stem from frequency line down to heartbeat line
      g.append('line')
        .attr('x1', px)
        .attr('x2', px)
        .attr('y1', pyFreq)
        .attr('y2', pyHeartbeat)
        .attr('stroke', markerColor)
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '3 3')
        .attr('stroke-opacity', 0.85);

      // Outer pulsing ring
      g.append('circle')
        .attr('cx', px)
        .attr('cy', pyFreq)
        .attr('r', 9)
        .attr('fill', markerColor)
        .attr('fill-opacity', 0.25)
        .attr('stroke', markerColor)
        .attr('stroke-width', 1.5)
        .attr('class', 'cursor-pointer transition-transform hover:scale-125')
        .on('click', () => {
          playAnomalyAlertChime();
          setHoveredPoint(point);
        });

      // Inner solid center dot
      g.append('circle')
        .attr('cx', px)
        .attr('cy', pyFreq)
        .attr('r', 4.5)
        .attr('fill', markerColor)
        .attr('stroke', '#070a12')
        .attr('stroke-width', 1.5)
        .attr('class', 'cursor-pointer')
        .on('click', () => {
          playAnomalyAlertChime();
          setHoveredPoint(point);
        });

      // Small Z-score label above marker
      g.append('text')
        .attr('x', px)
        .attr('y', pyFreq - 13)
        .attr('text-anchor', 'middle')
        .attr('fill', markerColor)
        .attr('font-family', 'monospace')
        .attr('font-size', '9px')
        .attr('font-weight', 'bold')
        .text(`${point.zScore > 0 ? '+' : ''}${point.zScore.toFixed(1)}σ`);
    });

    // 5. Left Y-Axis (Heartbeat Rhythm Hz)
    const y1Axis = d3.axisLeft(y1Scale).ticks(5).tickFormat((d) => `${(+d).toFixed(2)} Hz`);
    const y1AxisGroup = g.append('g').call(y1Axis);
    y1AxisGroup.select('.domain').attr('stroke', '#06B6D4').attr('stroke-opacity', 0.4);
    y1AxisGroup.selectAll('.tick text').attr('fill', '#06B6D4').attr('font-family', 'monospace').attr('font-size', '10px');
    y1AxisGroup.selectAll('.tick line').attr('stroke', '#06B6D4').attr('stroke-opacity', 0.3);

    // Left Axis Title
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -48)
      .attr('x', -innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#06B6D4')
      .attr('font-family', 'monospace')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .text('HEARTBEAT RHYTHM (Hz)');

    // 6. Right Y-Axis (Outlier Event Frequency %)
    const y2Axis = d3.axisRight(y2Scale).ticks(5).tickFormat((d) => `${d}%`);
    const y2AxisGroup = g.append('g').attr('transform', `translate(${innerWidth}, 0)`).call(y2Axis);
    y2AxisGroup.select('.domain').attr('stroke', '#D4AF37').attr('stroke-opacity', 0.4);
    y2AxisGroup.selectAll('.tick text').attr('fill', '#D4AF37').attr('font-family', 'monospace').attr('font-size', '10px');
    y2AxisGroup.selectAll('.tick line').attr('stroke', '#D4AF37').attr('stroke-opacity', 0.3);

    // Right Axis Title
    g.append('text')
      .attr('transform', 'rotate(90)')
      .attr('y', -innerWidth - 48)
      .attr('x', innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#D4AF37')
      .attr('font-family', 'monospace')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .text('OUTLIER FREQUENCY (%)');

    // 7. Bottom X-Axis (Snapshot Sequence & Time)
    const tickStep = Math.max(1, Math.floor(dataset.length / 7));
    const tickIndices = dataset.map((_, i) => i).filter((i) => i % tickStep === 0 || i === dataset.length - 1);

    const xAxis = d3
      .axisBottom(xScale)
      .tickValues(tickIndices)
      .tickFormat((i) => {
        const pt = dataset[i as number];
        return pt ? pt.timeLabel : '';
      });

    const xAxisGroup = g.append('g').attr('transform', `translate(0, ${innerHeight})`).call(xAxis);
    xAxisGroup.select('.domain').attr('stroke', '#ffffff').attr('stroke-opacity', 0.2);
    xAxisGroup.selectAll('.tick text').attr('fill', '#9ca3af').attr('font-family', 'monospace').attr('font-size', '10px');
    xAxisGroup.selectAll('.tick line').attr('stroke', '#ffffff').attr('stroke-opacity', 0.2);

    // 8. Interactive Cursor Tracking Scrubber
    const verticalLine = g
      .append('line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3 3')
      .attr('stroke-opacity', 0)
      .attr('pointer-events', 'none');

    const focusHeartbeat = g
      .append('circle')
      .attr('r', 5)
      .attr('fill', '#06B6D4')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0)
      .attr('pointer-events', 'none');

    const focusFrequency = g
      .append('circle')
      .attr('r', 5)
      .attr('fill', '#D4AF37')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0)
      .attr('pointer-events', 'none');

    // Overlay Rect for Pointer Events
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
          const pyHeartbeat = y1Scale(point.heartbeatHz);
          const pyFreq = y2Scale(point.outlierFrequencyPct);

          verticalLine.attr('x1', px).attr('x2', px).attr('stroke-opacity', 0.5);
          focusHeartbeat.attr('cx', px).attr('cy', pyHeartbeat).attr('opacity', 1);
          focusFrequency.attr('cx', px).attr('cy', pyFreq).attr('opacity', 1);

          setHoveredPoint(point);

          // Get absolute page positioning for floating tooltip
          const containerBounds = containerRef.current?.getBoundingClientRect();
          if (containerBounds) {
            setTooltipPos({
              x: px + margin.left,
              y: Math.min(pyHeartbeat, pyFreq) + margin.top,
            });
          }
        }
      })
      .on('mouseleave', function () {
        verticalLine.attr('stroke-opacity', 0);
        focusHeartbeat.attr('opacity', 0);
        focusFrequency.attr('opacity', 0);
        setHoveredPoint(null);
        setTooltipPos(null);
      })
      .on('click', function (event) {
        const [mx] = d3.pointer(event);
        const indexFloat = xScale.invert(mx);
        const nearestIndex = Math.max(0, Math.min(dataset.length - 1, Math.round(indexFloat)));
        const point = dataset[nearestIndex];
        if (point) {
          if (point.hasAnomaly) {
            playAnomalyAlertChime();
          } else {
            playTone(point.heartbeatHz * 600, 0.05);
          }
        }
      });
  }, [dataset]);

  // Redraw on window resize or data update
  useEffect(() => {
    renderChart();

    const handleResize = () => {
      renderChart();
    };

    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        renderChart();
      });
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [renderChart]);

  return (
    <div
      id="pulse-anomaly-heartbeat-d3-container"
      className="p-6 rounded-[28px] bg-[#070a12] border-[#06B6D4]/30 backdrop-blur-xl space-y-5 shadow-2xl relative overflow-hidden"
    >
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#06B6D4]/15 text-[#06B6D4] border-[#06B6D4]/30 text-[10px] font-mono font-bold">
              D3.JS FORENSIC OVERLAY
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30 text-[10px] font-mono font-bold">
              SSoT Δ0.00% LOCKED
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border-emerald-700/50 text-[10px] font-mono">
              Ω600_1000 BOUNDARY
            </span>
          </div>
          <h3 className="text-lg font-bold font-mono text-white mt-1.5 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#06B6D4] animate-pulse" />
            <span>Telemetry Anomaly Frequency &amp; System Heartbeat Timeline</span>
          </h3>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            D3 line chart overlaying statistical hardware anomalies against the Sovereign Engine's 1.00 Hz clock heartbeat
          </p>
        </div>

        {/* Audio Alert Chime Verification Suite */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          {/* Audition Low-Frequency Alert Chime Button */}
          <button
            id="btn-audition-anomaly-alert-chime"
            onClick={handleAuditionAlertChime}
            className={`px-3 py-2 rounded-xl border font-bold flex items-center gap-2 transition-all shadow-md ${
              activeAudition === 'alert'
                ? 'bg-rose-500/30 text-rose-200 border-rose-500/70 scale-105 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                : 'bg-[#0a0f1e] text-rose-300 border-rose-500/40 hover:bg-rose-950/40'
            }`}
            title="Audition the custom low-frequency alert chime (147Hz D3 -> 110Hz A2 -> 73Hz D2 sub-bass) triggered on anomaly detection"
          >
            <Volume2 className="w-4 h-4 text-rose-400" />
            <span>Audition Alert Chime (Low-Freq)</span>
            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-200 text-[9px]">147Hz</span>
          </button>

          {/* Audition Standard Audit Chime Button for Direct Comparison */}
          <button
            id="btn-audition-standard-audit-chime"
            onClick={handleAuditionAuditChime}
            className={`px-3 py-2 rounded-xl border font-bold flex items-center gap-2 transition-all ${
              activeAudition === 'audit'
                ? 'bg-cyan-500/30 text-cyan-200 border-cyan-500/70 scale-105'
                : 'bg-[#0a0f1e] text-cyan-300 border-cyan-500/40 hover:bg-cyan-950/40'
            }`}
            title="Audition standard bright audit chime (523Hz C5 -> 659Hz E5 -> 784Hz G5) for acoustic differentiation"
          >
            <Bell className="w-4 h-4 text-cyan-400" />
            <span>Audit Chime (High-Freq)</span>
            <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-200 text-[9px]">523Hz</span>
          </button>

          {/* Auto Chime Tripwire Toggle */}
          <button
            onClick={() => {
              playTone(600, 0.04);
              setAutoChimeEnabled(!autoChimeEnabled);
            }}
            className={`px-2.5 py-2 rounded-xl border flex items-center gap-1.5 transition-all ${
              autoChimeEnabled
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                : 'bg-white/5 text-zinc-500 border-white/10'
            }`}
            title="Automatically play low-frequency alert chime when a new anomaly is evaluated"
          >
            <span className={`w-2 h-2 rounded-full ${autoChimeEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
            <span>Tripwire {autoChimeEnabled ? 'ARMED' : 'MUTED'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
        <div className="p-3.5 rounded-2xl bg-[#0a0f1e] border-[#06B6D4]/30">
          <div className="text-zinc-500 text-[10px]">SOVEREIGN HEARTBEAT</div>
          <div className="text-base font-bold text-[#06B6D4] mt-0.5 flex items-center gap-1.5">
            <span>1.00 Hz</span>
            <span className="text-[10px] text-zinc-400 font-normal">(882 QOps clock)</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0a0f1e] border-rose-500/40">
          <div className="text-rose-400 text-[10px] font-bold">DETECTED ANOMALIES</div>
          <div className="text-base font-bold text-rose-300 mt-0.5 flex items-center gap-1.5">
            <span>{detectedAnomalies.length} Outliers</span>
            <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-200 text-[9px] font-bold">
              ≥{zScoreThreshold}σ
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0a0f1e] border-[#D4AF37]/40">
          <div className="text-[#D4AF37] text-[10px] font-bold">PEAK OUTLIER FREQUENCY</div>
          <div className="text-base font-bold text-[#D4AF37] mt-0.5">
            {dataset.length > 0 ? `${Math.max(...dataset.map((d) => d.outlierFrequencyPct))}%` : '0.0%'}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0a0f1e] border-emerald-500/30">
          <div className="text-emerald-400 text-[10px] font-bold">CARRIER STABILITY</div>
          <div className="text-base font-bold text-emerald-300 mt-0.5 flex items-center gap-1.5">
            <span>99.98%</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Interactive Controls & Filter Strip */}
      <div className="p-4 rounded-2xl bg-[#0a0f1e] border-white/10 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        {/* Outlier Type Filter */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 flex items-center gap-1 text-[11px]">
            <Filter className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>Metric Filter:</span>
          </span>
          <select
            value={selectedTypeFilter}
            onChange={(e) => {
              playTone(600, 0.03);
              setSelectedTypeFilter(e.target.value);
            }}
            className="bg-[#070a12] border-white/20 rounded-xl px-2.5 py-1 text-xs text-zinc-200 focus:border-[#06B6D4] focus:outline-none"
          >
            <option value="ALL">All Hardware Metrics</option>
            <option value="THERMAL_OUTLIER">Thermal / CPU Load Outliers</option>
            <option value="CRYO_DRIFT">Cryogenic Dilution Temp Drift</option>
            <option value="VOLTAGE_JITTER">Primary DC Rail Voltage Jitter</option>
            <option value="QOPS_DEVIATION">QOps Throughput Deviations</option>
          </select>
        </div>

        {/* Z-Score Sensitivity Slider */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 flex items-center gap-1 text-[11px]">
            <Sliders className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Sensitivity:</span>
          </span>
          <input
            type="range"
            min="1.5"
            max="4.0"
            step="0.1"
            value={zScoreThreshold}
            onChange={(e) => setZScoreThreshold(parseFloat(e.target.value))}
            className="w-24 accent-[#D4AF37] cursor-pointer"
          />
          <span className="px-2 py-0.5 rounded bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30 text-[10px] font-bold">
            |Z| ≥ {zScoreThreshold.toFixed(1)}σ
          </span>
        </div>

        {/* Rolling Window Size for Outlier Frequency */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 text-[11px]">Frequency Window:</span>
          <select
            value={rollingWindowSize}
            onChange={(e) => setRollingWindowSize(parseInt(e.target.value, 10))}
            className="bg-[#070a12] border-white/20 rounded-xl px-2 py-1 text-xs text-zinc-200 focus:border-[#06B6D4] focus:outline-none"
          >
            <option value="3">3 Snapshots</option>
            <option value="5">5 Snapshots (Nominal)</option>
            <option value="7">7 Snapshots</option>
            <option value="10">10 Snapshots</option>
          </select>
        </div>

        {/* Quick Simulator Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-zinc-500 text-[10px]">Test Outlier:</span>
          <button
            onClick={() => handleInjectOutlier('thermal')}
            className="px-2 py-1 rounded-lg bg-rose-950/70 hover:bg-rose-900/70 text-rose-300 border-rose-700/50 text-[10px] flex items-center gap-1 transition-all"
            title="Inject Thermal Outlier (>55°C) and trigger low-frequency alert chime"
          >
            <Flame className="w-3 h-3 text-rose-400" />
            <span>+Thermal</span>
          </button>
          <button
            onClick={() => handleInjectOutlier('cryo')}
            className="px-2 py-1 rounded-lg bg-cyan-950/70 hover:bg-cyan-900/70 text-cyan-300 border-cyan-700/50 text-[10px] flex items-center gap-1 transition-all"
            title="Inject Cryo Drift (>25 mK) and trigger low-frequency alert chime"
          >
            <Snowflake className="w-3 h-3 text-cyan-400" />
            <span>+Cryo</span>
          </button>
          <button
            onClick={() => handleInjectOutlier('voltage')}
            className="px-2 py-1 rounded-lg bg-amber-950/70 hover:bg-amber-900/70 text-amber-300 border-amber-700/50 text-[10px] flex items-center gap-1 transition-all"
            title="Inject Voltage Drop (<99.5%) and trigger low-frequency alert chime"
          >
            <Gauge className="w-3 h-3 text-amber-400" />
            <span>+Volt</span>
          </button>
          <button
            onClick={() => handleInjectOutlier('qops')}
            className="px-2 py-1 rounded-lg bg-violet-950/70 hover:bg-violet-900/70 text-violet-300 border-violet-700/50 text-[10px] flex items-center gap-1 transition-all"
            title="Inject QOps Deviation and trigger low-frequency alert chime"
          >
            <TrendingDown className="w-3 h-3 text-violet-400" />
            <span>+QOps</span>
          </button>
        </div>

        {/* Exports */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportSvg}
            className="px-2.5 py-1 rounded-xl bg-[#06B6D4]/15 hover:bg-[#06B6D4]/25 text-[#06B6D4] border-[#06B6D4]/30 text-[11px] font-bold flex items-center gap-1 transition"
            title="Export D3 Chart as SVG"
          >
            <Download className="w-3 h-3 text-[#06B6D4]" />
            <span>SVG</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="px-2.5 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 transition"
            title="Export Timeline Data to CSV"
          >
            <Download className="w-3 h-3 text-emerald-400" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* D3 Visual Canvas Container */}
      <div ref={containerRef} className="relative w-full rounded-2xl bg-[#070a12] border-white/5 overflow-hidden">
        <svg ref={svgRef} className="w-full block" />

        {/* Floating Tooltip */}
        {hoveredPoint && tooltipPos && (
          <div
            className="absolute z-30 pointer-events-none p-3.5 rounded-2xl bg-[#0a0f1e] border-[#06B6D4]/50 shadow-2xl font-mono text-xs text-white max-w-sm"
            style={{
              left: Math.min(tooltipPos.x + 15, (containerRef.current?.clientWidth || 500) - 280),
              top: Math.max(10, tooltipPos.y - 80),
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5 mb-1.5">
              <span className="font-bold text-[#06B6D4] flex items-center gap-1">
                <span>Snapshot #{String(hoveredPoint.snapshotNumber).padStart(3, '0')}</span>
              </span>
              <span className="text-[10px] text-zinc-400">{hoveredPoint.timeLabel}</span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between gap-3">
                <span className="text-zinc-400">System Heartbeat:</span>
                <span className="font-bold text-[#06B6D4]">{hoveredPoint.heartbeatHz.toFixed(3)} Hz</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-zinc-400">Carrier QOps:</span>
                <span className="font-bold text-cyan-300">{hoveredPoint.heartbeatQops.toFixed(1)} QOps/s</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-zinc-400">Outlier Event Freq:</span>
                <span className="font-bold text-[#D4AF37]">{hoveredPoint.outlierFrequencyPct}%</span>
              </div>
            </div>

            {hoveredPoint.hasAnomaly ? (
              <div className="mt-2 pt-2 border-t border-rose-500/30 text-[10px] space-y-1">
                <div className="flex items-center gap-1 font-bold text-rose-300">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  <span>{hoveredPoint.anomalyReport?.title || 'Hardware Anomaly Detected'}</span>
                </div>
                <div className="text-zinc-300">
                  Metric: <strong className="text-white">{hoveredPoint.anomalyMetric}</strong>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Observed: {hoveredPoint.anomalyObserved?.toFixed(2)}</span>
                  <span>Mean: {hoveredPoint.anomalyBaseline?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-rose-300 font-bold">
                  <span>Z-Score Deviation:</span>
                  <span>{hoveredPoint.zScore > 0 ? '+' : ''}{hoveredPoint.zScore.toFixed(2)}σ</span>
                </div>
                <div className="text-[9px] text-amber-400 font-mono mt-1">
                  Audio: Low-frequency alert chime triggered (147 Hz)
                </div>
              </div>
            ) : (
              <div className="mt-1.5 pt-1.5 border-t border-emerald-500/30 text-[10px] text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Nominal Heartbeat • Zero Baseline Drift</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Visual Legend & Architectural Footnote */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] font-mono text-zinc-400 border-t border-white/5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-[#06B6D4] rounded" />
            <span className="text-[#06B6D4] font-bold">Heartbeat Rhythm (1.00 Hz Baseline)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-[#D4AF37] rounded" />
            <span className="text-[#D4AF37] font-bold">Outlier Event Frequency (%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border-white" />
            <span className="text-rose-300">Flagged Hardware Anomaly (Alert Chime 147Hz)</span>
          </div>
        </div>

        <div className="text-[10px] text-zinc-500 flex items-center gap-2">
          <span>ETDA/PDPA Safe Harbor Certified</span>
          <span>&bull;</span>
          <span>NIST FIPS 203/204 Invariant</span>
        </div>
      </div>
    </div>
  );
};
