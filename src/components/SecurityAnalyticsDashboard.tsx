import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import {
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  Activity,
  Flame,
  Zap,
  Lock,
  Download,
  Filter,
  Eye,
  RefreshCw,
  Clock,
  Sparkles,
  Layers,
  FileText,
  Copy,
  Check,
  CheckCircle2,
  Cpu,
  ChevronRight,
  TrendingUp,
  Scale
} from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';
import { SystemEvent } from './SystemEventsSidebar';

export interface SentinelDailyDataPoint {
  dayIndex: number;
  dayLabel: string;
  date: string;
  thaiDate: string;
  riskScore: number; // 0.00 to 1.00
  inspectedTransactions: number;
  quarantinedCount: number;
  isQuarantineSurge: boolean;
  surgeClusterName?: string;
  prominentVector: string;
  chamber02Status: 'NOMINAL_BUFFER' | 'SURGE_QUARANTINED' | 'FAIL_CLOSED_TRIPPED';
  pqcScheme: string;
  evidenceDigest: string;
  statuteRef: string;
}

export interface SecurityAnalyticsDashboardProps {
  title?: string;
  onSelectIncident?: (incidentId: string) => void;
  onAddSystemEvent?: (
    type: SystemEvent['type'],
    title: string,
    description: string,
    metaHash?: string,
    severity?: SystemEvent['severity'],
    statuteRef?: string,
    targetView?: SystemEvent['targetView']
  ) => void;
}

const CANONICAL_GENESIS_ROOT = '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68';
const SENTINEL_QUARANTINE_THRESHOLD = 0.85;

// Generate 30 days of realistic Sentinel AI Interceptor telemetry
export const generate30DaySentinelData = (): SentinelDailyDataPoint[] => {
  const data: SentinelDailyDataPoint[] = [];
  const baseDate = new Date('2026-09-22T00:00:00Z');

  // Defined Surge Clusters for Chamber 02 High-Risk Anomalies
  // Surge 1: Day 7-9 (Dilithium-5 Signature Mismatch Attempt)
  // Surge 2: Day 16-19 (Merkle Root Mutation & State Inflation Vector)
  // Surge 3: Day 26-27 (Non-Quorum Sovereign Treasury Drain Vector)

  for (let i = 29; i >= 0; i--) {
    const dayIdx = 30 - i; // 1 to 30
    const pointDate = new Date(baseDate);
    pointDate.setDate(pointDate.getDate() - i);

    const isoDate = pointDate.toISOString().split('T')[0];
    const dayMonth = `${pointDate.getDate()}/${pointDate.getMonth() + 1}`;
    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    const thaiDate = `${pointDate.getDate()} ${thaiMonths[pointDate.getMonth()]}`;

    let riskScore = 0.15 + (Math.sin(dayIdx * 0.8) * 0.08) + ((dayIdx % 3) * 0.03);
    let isSurge = false;
    let surgeName: string | undefined;
    let vector = 'NOMINAL_TRANSACTION_TELEMETRY';
    let quarantined = 0;
    let status: SentinelDailyDataPoint['chamber02Status'] = 'NOMINAL_BUFFER';
    let statute = 'ETDA ม.๙ & ม.๒๖';

    // Surge Cluster Alpha (Days 7 to 9)
    if (dayIdx >= 7 && dayIdx <= 9) {
      isSurge = true;
      surgeName = 'Cluster α: Dilithium-5 Signature Mismatch Burst';
      vector = 'INVALID_PQC_SIGNATURE_FORGERY';
      riskScore = dayIdx === 8 ? 0.94 : (dayIdx === 7 ? 0.88 : 0.86);
      quarantined = dayIdx === 8 ? 24 : 14;
      status = 'SURGE_QUARANTINED';
      statute = 'ETDA ม.๒๖ & FIPS 204';
    }
    // Surge Cluster Beta (Days 16 to 19) - Critical Root Tampering Attempt
    else if (dayIdx >= 16 && dayIdx <= 19) {
      isSurge = true;
      surgeName = 'Cluster β: State Merkle Mutation & Drift Injection';
      vector = 'CANONICAL_MERKLE_ROOT_TAMPER_INJECTION';
      riskScore = dayIdx === 17 ? 0.98 : (dayIdx === 18 ? 0.92 : (dayIdx === 16 ? 0.87 : 0.85));
      quarantined = dayIdx === 17 ? 42 : (dayIdx === 18 ? 28 : 16);
      status = 'FAIL_CLOSED_TRIPPED';
      statute = 'ETDA ม.๒๘ & ISO/IEC 27037';
    }
    // Surge Cluster Gamma (Days 26 to 27) - Non-Quorum Treasury Drain
    else if (dayIdx >= 26 && dayIdx <= 27) {
      isSurge = true;
      surgeName = 'Cluster γ: Non-Quorum Sovereign Treasury Drain';
      vector = 'UNAUTHORIZED_TREASURY_DRAIN_PROBE';
      riskScore = dayIdx === 26 ? 0.91 : 0.89;
      quarantined = dayIdx === 26 ? 19 : 12;
      status = 'SURGE_QUARANTINED';
      statute = 'ETDA ม.๒๘ & 10/10 REAL_HSM Quorum';
    } else {
      // Normal background jitter
      quarantined = Math.random() > 0.6 ? Math.floor(Math.random() * 3) : 0;
      riskScore = Math.min(0.42, Math.max(0.08, riskScore));
    }

    const inspected = Math.floor(1800 + Math.sin(dayIdx) * 350 + (isSurge ? 1200 : 0));
    const evidenceDigest = '0x' + (Math.abs(Math.sin(dayIdx * 999)).toString(16).replace('.', '') + '7f8a9b2c3d4e5f6a7b8c').slice(0, 32);

    data.push({
      dayIndex: dayIdx,
      dayLabel: `Day ${dayIdx} (${dayMonth})`,
      date: isoDate,
      thaiDate,
      riskScore: +riskScore.toFixed(3),
      inspectedTransactions: inspected,
      quarantinedCount: quarantined,
      isQuarantineSurge: isSurge,
      surgeClusterName: surgeName,
      prominentVector: vector,
      chamber02Status: status,
      pqcScheme: isSurge ? 'ML-DSA-87 (Dilithium-5) + SPHINCS+ Fallback' : 'ML-DSA-87 (Dilithium-5)',
      evidenceDigest,
      statuteRef: statute,
    });
  }

  return data;
};

export const SecurityAnalyticsDashboard: React.FC<SecurityAnalyticsDashboardProps> = ({
  title = 'Sentinel AI Interceptor — 30-Day Risk & Chamber 02 Quarantine Analytics',
  onSelectIncident,
  onAddSystemEvent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [telemetryData, setTelemetryData] = useState<SentinelDailyDataPoint[]>(() => generate30DaySentinelData());
  const [timeRange, setTimeRange] = useState<'7D' | '14D' | '30D'>('30D');
  const [filterSurgeOnly, setFilterSurgeOnly] = useState<boolean>(false);
  const [selectedPoint, setSelectedPoint] = useState<SentinelDailyDataPoint | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{
    point: SentinelDailyDataPoint;
    x: number;
    y: number;
  } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isSimulatingLiveSurge, setIsSimulatingLiveSurge] = useState<boolean>(false);
  const [simulationToast, setSimulationToast] = useState<string | null>(null);

  // Filter dataset according to time range and surge filter
  const filteredData = useMemo(() => {
    let sliceCount = 30;
    if (timeRange === '7D') sliceCount = 7;
    if (timeRange === '14D') sliceCount = 14;

    const sliced = telemetryData.slice(-sliceCount);
    if (filterSurgeOnly) {
      return sliced.filter((d) => d.isQuarantineSurge || d.riskScore >= SENTINEL_QUARANTINE_THRESHOLD);
    }
    return sliced;
  }, [telemetryData, timeRange, filterSurgeOnly]);

  // Aggregate Metrics & Key Performance Indicators
  const metrics = useMemo(() => {
    if (telemetryData.length === 0) {
      return {
        avgRisk: 0,
        peakRisk: 0,
        totalQuarantined: 0,
        totalInspected: 0,
        surgeDayCount: 0,
        failClosedInterceptRate: 100,
      };
    }

    const risks = telemetryData.map((d) => d.riskScore);
    const avgRisk = risks.reduce((a, b) => a + b, 0) / risks.length;
    const peakRisk = Math.max(...risks);
    const totalQuarantined = telemetryData.reduce((acc, d) => acc + d.quarantinedCount, 0);
    const totalInspected = telemetryData.reduce((acc, d) => acc + d.inspectedTransactions, 0);
    const surgeDays = telemetryData.filter((d) => d.isQuarantineSurge).length;

    return {
      avgRisk: +avgRisk.toFixed(3),
      peakRisk: +peakRisk.toFixed(3),
      totalQuarantined,
      totalInspected,
      surgeDayCount: surgeDays,
      failClosedInterceptRate: 100.0,
    };
  }, [telemetryData]);

  // Handle Live Threat Vector Injection
  const handleInjectLiveSurge = useCallback(() => {
    setIsSimulatingLiveSurge(true);
    playTone(280, 0.15, 'sawtooth');

    setTimeout(() => {
      const injectedScore = +(0.95 + Math.random() * 0.04).toFixed(3);
      const injectedQuarantine = Math.floor(18 + Math.random() * 15);

      setTelemetryData((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0) {
          const current = updated[lastIndex];
          updated[lastIndex] = {
            ...current,
            riskScore: injectedScore,
            quarantinedCount: current.quarantinedCount + injectedQuarantine,
            isQuarantineSurge: true,
            surgeClusterName: 'Live Sentinel Intercept: Chamber 02 Active Quarantine Event',
            prominentVector: 'REALTIME_SIMULATED_STATE_INJECTION',
            chamber02Status: 'FAIL_CLOSED_TRIPPED',
          };
          setSelectedPoint(updated[lastIndex]);
        }
        return updated;
      });

      setIsSimulatingLiveSurge(false);
      setSimulationToast(`Sentinel AI Intercept: Risk ${injectedScore} >= 0.85 -> Quarantined in Chamber 02 (< 1.12 ms)`);
      playAuditChime();

      if (onAddSystemEvent) {
        onAddSystemEvent(
          'ANOMALY',
          'Sentinel AI Interceptor: Chamber 02 Surge Active',
          `High-risk payload detected (Score: ${injectedScore}). Fail-closed quarantine engaged in Chamber 02. SSoT Zero Drift Δ0.00% maintained.`,
          CANONICAL_GENESIS_ROOT,
          'critical',
          'ETDA มาตรา ๒๖, ๒๘ & PDPA มาตรา ๓๗',
          'security'
        );
      }

      setTimeout(() => setSimulationToast(null), 4000);
    }, 600);
  }, [onAddSystemEvent]);

  // D3 Chart Rendering Logic with Surge Highlight Bands
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || filteredData.length === 0) return;

    const width = containerRef.current.clientWidth || 800;
    const height = 260;
    const margin = { top: 28, right: 36, bottom: 44, left: 54 };

    const innerWidth = Math.max(100, width - margin.left - margin.right);
    const innerHeight = Math.max(80, height - margin.top - margin.bottom);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Gradients & SVG Filters
    const defs = svg.append('defs');

    // Gradient for Risk Score Area
    const lineGradId = 'sentinel-risk-gradient';
    const areaGrad = defs
      .append('linearGradient')
      .attr('id', lineGradId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    areaGrad.append('stop').attr('offset', '0%').attr('stop-color', '#f43f5e').attr('stop-opacity', 0.55);
    areaGrad.append('stop').attr('offset', '40%').attr('stop-color', '#f59e0b').attr('stop-opacity', 0.35);
    areaGrad.append('stop').attr('offset', '80%').attr('stop-color', '#06b6d4').attr('stop-opacity', 0.15);
    areaGrad.append('stop').attr('offset', '100%').attr('stop-color', '#06b6d4').attr('stop-opacity', 0.0);

    // Glow Filter for D3 lines
    const filter = defs.append('filter').attr('id', 'd3-glow-filter');
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([0, filteredData.length - 1])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear().domain([0, 1.05]).range([innerHeight, 0]);

    // Draw Quarantine Surge Highlight Bands (Chamber 02 Elevated Activity Zones)
    filteredData.forEach((d, idx) => {
      if (d.isQuarantineSurge || d.riskScore >= SENTINEL_QUARANTINE_THRESHOLD) {
        const xPos = xScale(idx);
        const bandWidth = Math.max(16, innerWidth / (filteredData.length || 1));

        g.append('rect')
          .attr('x', Math.max(0, xPos - bandWidth / 2))
          .attr('y', 0)
          .attr('width', bandWidth)
          .attr('height', innerHeight)
          .attr('fill', '#f43f5e')
          .attr('fill-opacity', 0.12)
          .attr('stroke', '#f43f5e')
          .attr('stroke-opacity', 0.25)
          .attr('stroke-dasharray', '2 2')
          .attr('rx', 3);
      }
    });

    // Horizontal Grid Lines
    const yAxisGrid = d3
      .axisLeft(yScale)
      .tickSize(-innerWidth)
      .tickFormat(() => '')
      .ticks(5);

    g.append('g')
      .attr('class', 'grid-lines')
      .call(yAxisGrid)
      .selectAll('line')
      .attr('stroke', '#1e293b')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-dasharray', '3 3');

    g.select('.grid-lines').select('.domain').remove();

    // Sentinel AI Quarantine Threshold Line (y = 0.85)
    const thresholdY = yScale(SENTINEL_QUARANTINE_THRESHOLD);

    g.append('line')
      .attr('x1', 0)
      .attr('y1', thresholdY)
      .attr('x2', innerWidth)
      .attr('y2', thresholdY)
      .attr('stroke', '#f43f5e')
      .attr('stroke-width', 1.8)
      .attr('stroke-dasharray', '6 4')
      .attr('stroke-opacity', 0.85);

    // Threshold Text Label
    g.append('text')
      .attr('x', innerWidth - 6)
      .attr('y', thresholdY - 6)
      .attr('text-anchor', 'end')
      .attr('fill', '#fb7185')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text('🚨 Chamber 02 Quarantine Limit (Risk ≥ 0.85)');

    // D3 Area Generator
    const areaGen = d3
      .area<SentinelDailyDataPoint>()
      .x((_, i) => xScale(i))
      .y0(innerHeight)
      .y1((d) => yScale(d.riskScore))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(filteredData)
      .attr('fill', `url(#${lineGradId})`)
      .attr('d', areaGen);

    // D3 Line Generator
    const lineGen = d3
      .line<SentinelDailyDataPoint>()
      .x((_, i) => xScale(i))
      .y((d) => yScale(d.riskScore))
      .curve(d3.curveMonotoneX);

    // Line Path with Glow
    g.append('path')
      .datum(filteredData)
      .attr('fill', 'none')
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 2.6)
      .attr('filter', 'url(#d3-glow-filter)')
      .attr('d', lineGen);

    // X Axis with Thai / Day Labels
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(Math.min(filteredData.length, 10))
      .tickFormat((d) => {
        const item = filteredData[+d];
        return item ? item.thaiDate : '';
      });

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .attr('color', '#64748b')
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('dy', '1.2em');

    // Y Axis (Risk Scale 0.00 to 1.00)
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickFormat((d) => `${(+d).toFixed(2)}`);

    g.append('g')
      .call(yAxis)
      .attr('color', '#64748b')
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    // Render Data Circles
    filteredData.forEach((d, idx) => {
      const cx = xScale(idx);
      const cy = yScale(d.riskScore);
      const isSurge = d.isQuarantineSurge || d.riskScore >= SENTINEL_QUARANTINE_THRESHOLD;

      // Pulse ring on surge days
      if (isSurge) {
        g.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', 8)
          .attr('fill', 'none')
          .attr('stroke', '#f43f5e')
          .attr('stroke-width', 1.5)
          .attr('stroke-opacity', 0.6)
          .attr('class', 'animate-ping');
      }

      // Main Point Circle
      g.append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', isSurge ? 5.5 : 3.5)
        .attr('fill', isSurge ? '#f43f5e' : (d.riskScore > 0.4 ? '#f59e0b' : '#06b6d4'))
        .attr('stroke', '#0f172a')
        .attr('stroke-width', 2)
        .attr('cursor', 'pointer')
        .on('click', () => {
          setSelectedPoint(d);
          playTone(isSurge ? 440 : 620, 0.05);
          if (onSelectIncident) onSelectIncident(d.dayLabel);
        });
    });

    // Invisible Overlay for Dynamic Mouse Tracking & Crosshair
    const overlay = g
      .append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .attr('cursor', 'crosshair');

    overlay.on('mousemove', (event) => {
      const [mouseX] = d3.pointer(event);
      const rawIdx = Math.round(xScale.invert(mouseX));
      const clampedIdx = Math.max(0, Math.min(filteredData.length - 1, rawIdx));
      const point = filteredData[clampedIdx];

      if (point) {
        setHoveredPoint({
          point,
          x: margin.left + xScale(clampedIdx),
          y: margin.top + yScale(point.riskScore),
        });
      }
    });

    overlay.on('mouseleave', () => {
      setHoveredPoint(null);
    });
  }, [filteredData]);

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    copyToClipboard(text);
    setCopiedText(label);
    playAuditChime();
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Export 30-day Threat Telemetry CSV
  const handleExportCsv = () => {
    playAuditChime();
    const headers = 'DayIndex,Date,ThaiDate,RiskScore,InspectedCount,QuarantinedCount,IsSurge,Chamber02Status,ThreatVector,PqcScheme,StatuteRef\n';
    const rows = telemetryData
      .map(
        (d) =>
          `${d.dayIndex},"${d.date}","${d.thaiDate}",${d.riskScore},${d.inspectedTransactions},${d.quarantinedCount},${d.isQuarantineSurge},"${d.chamber02Status}","${d.prominentVector}","${d.pqcScheme}","${d.statuteRef}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ZYRQUEN_Sentinel_AI_30Day_Telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="p-6 rounded-[24px] bg-gradient-to-br from-[#0c1021]/95 via-[#080c1b]/98 to-[#04060e] border border-cyan-500/30 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-64 bg-cyan-500/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-48 bg-rose-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 shadow-sm">
                <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                SENTINEL AI RISK ENGINE
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 shadow-sm">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                CHAMBER 02 QUARANTINE BUFFER
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-200 border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                ETDA ม.๙, ๒๖, ๒๘ • PDPA ม.๓๗
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight flex items-center gap-2.5">
              <Activity className="w-6 h-6 text-cyan-400" />
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-mono max-w-3xl leading-relaxed">
              การวิเคราะห์ความเสี่ยงย้อนหลัง ๓๐ วันของ Sentinel AI Interceptor พร้อมระบบตรวจจับและกักกันภัยคุกคามใน Chamber 02 เมื่อ Risk Score ≥ ๐.๘๕ (Fail-Closed Isolation &lt; ๑.๒๐ ms)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 font-mono">
            <button
              onClick={handleInjectLiveSurge}
              disabled={isSimulatingLiveSurge}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all shadow-md cursor-pointer ${
                isSimulatingLiveSurge
                  ? 'bg-rose-500/30 text-rose-200 border-rose-400 animate-pulse'
                  : 'bg-gradient-to-r from-rose-600/30 to-amber-600/30 hover:from-rose-600/50 hover:to-amber-600/50 text-rose-200 border-rose-500/40 hover:border-rose-400'
              }`}
            >
              <Zap className={`w-4 h-4 text-rose-400 ${isSimulatingLiveSurge ? 'animate-spin' : ''}`} />
              <span>{isSimulatingLiveSurge ? 'Injecting Anomaly...' : 'Simulate Threat Injection'}</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 border border-cyan-500/30 hover:border-cyan-400/50 flex items-center gap-2 transition-all shadow-sm cursor-pointer"
              title="Export 30-day Sentinel AI telemetry dataset as CSV"
            >
              <Download className="w-4 h-4 text-cyan-300" />
              <span>Export Telemetry (CSV)</span>
            </button>
          </div>
        </div>

        {/* Live Simulation Toast */}
        {simulationToast && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-200 text-xs font-mono flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{simulationToast}</span>
          </div>
        )}
      </div>

      {/* 6 Key Telemetry Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 font-mono">
        <div className="p-4 rounded-2xl bg-[#090d1f]/90 border border-cyan-500/20 shadow-sm relative overflow-hidden">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mb-1">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>30-Day Avg Risk</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-cyan-200 tracking-tight">
            {metrics.avgRisk}
          </div>
          <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Safe Range (&lt; 0.40)</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#090d1f]/90 border border-rose-500/30 shadow-sm relative overflow-hidden">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mb-1">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Peak Intercept Risk</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-300 tracking-tight">
            {metrics.peakRisk}
          </div>
          <div className="text-[10px] text-rose-400/90 mt-1">
            <span>Contained in Chamber 02</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#090d1f]/90 border border-amber-500/25 shadow-sm relative overflow-hidden">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mb-1">
            <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
            <span>Quarantined Count</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-200 tracking-tight">
            {metrics.totalQuarantined}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">
            <span>Trapped Threat Payloads</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#090d1f]/90 border border-emerald-500/25 shadow-sm relative overflow-hidden">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Intercept Success</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-300 tracking-tight">
            100.0%
          </div>
          <div className="text-[10px] text-emerald-400 mt-1">
            <span>0 Bypass / Zero Leak</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#090d1f]/90 border border-purple-500/25 shadow-sm relative overflow-hidden">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mb-1">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>Isolation Latency</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-purple-200 tracking-tight">
            1.18 ms
          </div>
          <div className="text-[10px] text-purple-300 mt-1">
            <span>Fail-Closed SLA &lt; 1.2ms</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#090d1f]/90 border border-cyan-500/25 shadow-sm relative overflow-hidden">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mb-1">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>SSoT State Drift</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-cyan-300 tracking-tight">
            Δ 0.00%
          </div>
          <div className="text-[10px] text-cyan-400 mt-1">
            <span>Zero Drift Inviolable</span>
          </div>
        </div>
      </div>

      {/* Main D3 Chart Interactive Container */}
      <div className="p-6 rounded-[24px] bg-[#070a17]/95 border border-cyan-500/20 shadow-xl relative overflow-hidden font-mono">
        {/* Controls Bar: Time Range & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-zinc-400 font-bold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Time Window:
            </span>
            {(['7D', '14D', '30D'] as const).map((r) => (
              <button
                key={r}
                onClick={() => {
                  playTone(550, 0.03);
                  setTimeRange(r);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  timeRange === r
                    ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-sm'
                    : 'bg-white/5 text-zinc-400 hover:text-zinc-200 border border-white/5 hover:border-white/15'
                }`}
              >
                {r === '30D' ? '30 Days (Full)' : r === '14D' ? '14 Days (Bi-Weekly)' : '7 Days (Weekly)'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => {
                playTone(520, 0.03);
                setFilterSurgeOnly(!filterSurgeOnly);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                filterSurgeOnly
                  ? 'bg-rose-500/30 text-rose-200 border border-rose-400/60 shadow-sm'
                  : 'bg-white/5 text-zinc-400 hover:text-zinc-200 border border-white/5 hover:border-white/15'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-rose-400" />
              <span>{filterSurgeOnly ? 'Showing Quarantine Surges Only' : 'Filter: All Daily Records'}</span>
            </button>

            <div className="flex items-center gap-3 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                Nominal (&lt; 0.40)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                Elevated (0.40 - 0.84)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse" />
                Quarantined (≥ 0.85)
              </span>
            </div>
          </div>
        </div>

        {/* D3 Canvas Wrapper */}
        <div ref={containerRef} className="relative mt-4 w-full h-[260px]">
          <svg ref={svgRef} className="w-full h-full overflow-visible" />

          {/* Floating Hover Card (D3 Pointer Tracker) */}
          {hoveredPoint && (
            <div
              className="absolute pointer-events-none z-30 p-3 rounded-xl bg-[#090d1f]/95 border border-cyan-400/50 shadow-2xl backdrop-blur-md text-[11px] text-white font-mono min-w-[240px] transform -translate-x-1/2 -translate-y-full mb-3"
              style={{
                left: `${hoveredPoint.x}px`,
                top: `${hoveredPoint.y}px`,
              }}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1.5">
                <span className="font-bold text-cyan-300">{hoveredPoint.point.thaiDate} ({hoveredPoint.point.date})</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    hoveredPoint.point.riskScore >= SENTINEL_QUARANTINE_THRESHOLD
                      ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
                      : hoveredPoint.point.riskScore > 0.4
                      ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
                      : 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/30'
                  }`}
                >
                  Risk {hoveredPoint.point.riskScore}
                </span>
              </div>

              <div className="space-y-1 text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Inspected Tx:</span>
                  <span className="font-bold text-white">{hoveredPoint.point.inspectedTransactions.toLocaleString()} tx</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Quarantined (Chamber 02):</span>
                  <span className={`font-bold ${hoveredPoint.point.quarantinedCount > 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
                    {hoveredPoint.point.quarantinedCount} payloads
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Status:</span>
                  <span className="text-cyan-300">{hoveredPoint.point.chamber02Status}</span>
                </div>
                <div className="text-[10px] text-amber-300/90 pt-1 border-t border-white/5 truncate">
                  Vector: {hoveredPoint.point.prominentVector}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3 Canonical Quarantine Surge Clusters Deep-Dive */}
      <div className="space-y-3 font-mono">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-400" />
            <span>Chamber 02 Quarantine Surge Clusters (Historical 30-Day Windows)</span>
          </h3>
          <span className="text-xs text-zinc-400">
            3 Surge Periods Intercepted & Cleansed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Surge 1 */}
          <div
            onClick={() => {
              playTone(480, 0.04);
              const target = telemetryData.find((d) => d.dayIndex === 8);
              if (target) setSelectedPoint(target);
            }}
            className="p-4 rounded-2xl bg-[#090d1f]/90 border border-rose-500/30 hover:border-rose-400/60 shadow-md transition-all cursor-pointer group hover:bg-[#0c1228]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                Days 7 - 9 • CLUSTER α
              </span>
              <span className="text-xs font-bold text-rose-400">Peak Risk: 0.94</span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-200 transition-colors">
              Dilithium-5 Signature Mismatch Burst
            </h4>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              สกัดกั้นการใช้ Classical RSA/ECDSA และ Signature Forgery ปลอมแปลงผ่าน Gateway ป้องกันด้วย PQC ML-DSA-87
            </p>
            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-zinc-400">
              <span>Quarantined: 38 Payloads</span>
              <span className="text-cyan-300 font-bold flex items-center gap-1">
                View Details <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Surge 2 */}
          <div
            onClick={() => {
              playTone(460, 0.04);
              const target = telemetryData.find((d) => d.dayIndex === 17);
              if (target) setSelectedPoint(target);
            }}
            className="p-4 rounded-2xl bg-[#090d1f]/90 border border-rose-500/40 hover:border-rose-400/70 shadow-md transition-all cursor-pointer group hover:bg-[#0c1228] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/30 text-rose-200 border border-rose-400/50">
                Days 16 - 19 • CLUSTER β (CRITICAL)
              </span>
              <span className="text-xs font-bold text-rose-400">Peak Risk: 0.98</span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-200 transition-colors">
              State Merkle Mutation & Drift Attempt
            </h4>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              พยายามแก้ไข Genesis Merkle Root 0x909ab814... ในหน่วยความจำ Sentinel AI กักกันทันทีใน 0.48 ms
            </p>
            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-zinc-400">
              <span>Quarantined: 86 Payloads</span>
              <span className="text-rose-300 font-bold flex items-center gap-1">
                Fail-Closed Tripped <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Surge 3 */}
          <div
            onClick={() => {
              playTone(500, 0.04);
              const target = telemetryData.find((d) => d.dayIndex === 26);
              if (target) setSelectedPoint(target);
            }}
            className="p-4 rounded-2xl bg-[#090d1f]/90 border border-rose-500/30 hover:border-rose-400/60 shadow-md transition-all cursor-pointer group hover:bg-[#0c1228]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                Days 26 - 27 • CLUSTER γ
              </span>
              <span className="text-xs font-bold text-rose-400">Peak Risk: 0.91</span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-200 transition-colors">
              Non-Quorum Treasury Drain Probe
            </h4>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              พยายามเบิกถอนกองทุน FIOS Gas โดยใช้เสียงข้างมากไม่ครบ 10/10 REAL_HSM Council ถูกระงับสิทธิ์ทันที
            </p>
            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-zinc-400">
              <span>Quarantined: 31 Payloads</span>
              <span className="text-cyan-300 font-bold flex items-center gap-1">
                View Details <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Day Forensic Inspection Modal / Drawer */}
      {selectedPoint && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0c1126] to-[#070a18] border border-cyan-500/40 shadow-2xl font-mono animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-3">
              <span
                className={`p-2 rounded-xl ${
                  selectedPoint.riskScore >= SENTINEL_QUARANTINE_THRESHOLD
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                }`}
              >
                {selectedPoint.riskScore >= SENTINEL_QUARANTINE_THRESHOLD ? (
                  <AlertOctagon className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </span>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-white">
                  Forensic Telemetry Snapshot — {selectedPoint.thaiDate} ({selectedPoint.date})
                </h4>
                <p className="text-xs text-zinc-400">
                  {selectedPoint.surgeClusterName || 'Nominal Execution Baseline Telemetry'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedPoint(null)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-zinc-300 cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
              <div className="text-zinc-400 mb-1">Sentinel AI Risk Score</div>
              <div
                className={`text-lg font-bold ${
                  selectedPoint.riskScore >= SENTINEL_QUARANTINE_THRESHOLD ? 'text-rose-400' : 'text-cyan-300'
                }`}
              >
                {selectedPoint.riskScore} / 1.00
              </div>
              <div className="text-[10px] text-zinc-400 mt-1">
                {selectedPoint.riskScore >= SENTINEL_QUARANTINE_THRESHOLD
                  ? 'Quarantined in Chamber 02'
                  : 'Passed Verification Gate'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
              <div className="text-zinc-400 mb-1">Quarantined Payloads</div>
              <div className="text-lg font-bold text-white">
                {selectedPoint.quarantinedCount} <span className="text-xs text-zinc-400">/ {selectedPoint.inspectedTransactions.toLocaleString()} tx</span>
              </div>
              <div className="text-[10px] text-zinc-400 mt-1">Fail-Closed Contained</div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
              <div className="text-zinc-400 mb-1">PQC Defense Scheme</div>
              <div className="text-sm font-bold text-cyan-200 truncate">
                {selectedPoint.pqcScheme}
              </div>
              <div className="text-[10px] text-zinc-400 mt-1">FIPS 204 Standard</div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
              <div className="text-zinc-400 mb-1">Statutory Basis</div>
              <div className="text-sm font-bold text-amber-200">
                {selectedPoint.statuteRef}
              </div>
              <div className="text-[10px] text-zinc-400 mt-1">Thai ETA B.E. 2544</div>
            </div>
          </div>

          {/* Evidence Digest & Action */}
          <div className="mt-3 p-3 rounded-xl bg-black/50 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="truncate">
              <span className="text-zinc-400">Evidence Digest: </span>
              <span className="text-cyan-300 font-mono">{selectedPoint.evidenceDigest}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleCopy(selectedPoint.evidenceDigest, 'digest')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/15 text-zinc-200 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedText === 'digest' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedText === 'digest' ? 'Copied' : 'Copy Hash'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
