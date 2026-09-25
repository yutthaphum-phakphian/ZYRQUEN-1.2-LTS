import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { motion } from 'motion/react';
import {
  Activity,
  Zap,
  TrendingUp,
  Gauge,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Play,
  Pause,
  Sparkles,
  Download,
  Flame,
  Radio,
  BarChart2,
  Layers,
  Copy,
  Check,
} from 'lucide-react';
import { COUNCIL_MEMBERS, getMemberVitality } from '../data/councilData';
import { playTone, playAuditChime } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';

export const CANONICAL_ENTROPY_ANCHOR_HASH =
  '0x3319203849102834019283401928340192834019283401928340192834019283';

export interface EntropyDataPoint {
  minute: number; // 0 = 60 min ago, 59 = now
  timestamp: Date;
  timeLabel: string;
  entropyRateKBps: number; // e.g. 10,000 - 15,000 KBps
  baselineKBps: number;
  upperStdKBps: number;
  lowerStdKBps: number;
  isPeak: boolean;
  peakLabel?: string;
  surgeFactorPct?: number;
  stabilityScorePct: number;
  activeEnclavesCount: number;
  nodeContributions: { slotId: number; code: string; rateKBps: number }[];
}

export const exportActiveEntropyCsv = (
  dataset: EntropyDataPoint[],
  filenamePrefix = 'zyrquen-active-entropy-rate-60min'
) => {
  playTone(720, 0.05);
  const headers = [
    'Minute_Index',
    'Timestamp_ISO',
    'Time_Label',
    'Active_Entropy_Rate_KBps',
    'SSoT_Baseline_KBps',
    'Upper_Std_1Sigma_KBps',
    'Lower_Std_1Sigma_KBps',
    'Delta_From_Baseline_KBps',
    'Is_Peak_Surge',
    'Peak_Event_Label',
    'Surge_Factor_Pct',
    'Stability_Score_Pct',
    'Active_Hardware_Enclaves',
    'Canonical_Anchor_Root',
    'NIST_FIPS_Standard'
  ];

  const rows = dataset.map((d) => [
    d.minute,
    d.timestamp.toISOString(),
    `"${d.timeLabel}"`,
    d.entropyRateKBps,
    d.baselineKBps,
    d.upperStdKBps,
    d.lowerStdKBps,
    d.entropyRateKBps - d.baselineKBps,
    d.isPeak ? 'TRUE' : 'FALSE',
    `"${d.peakLabel || 'Nominal TRNG Noise'}"`,
    d.surgeFactorPct ?? 0,
    d.stabilityScorePct,
    d.activeEnclavesCount,
    `"${CANONICAL_ENTROPY_ANCHOR_HASH}"`,
    '"NIST SP 800-90B / FIPS 140-3 Level 4 Pass"'
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `${filenamePrefix}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export interface ActiveEntropyRateMonitorProps {
  className?: string;
  autoRefresh?: boolean;
  timeHorizon?: '60m' | '24h';
  onTimeHorizonChange?: (horizon: '60m' | '24h') => void;
  onCurrentRateChange?: (rate: number) => void;
  onHistoryChange?: (history: EntropyDataPoint[]) => void;
}

export const ActiveEntropyRateMonitor: React.FC<ActiveEntropyRateMonitorProps> = ({
  className = '',
  autoRefresh = true,
  timeHorizon: propTimeHorizon,
  onTimeHorizonChange,
  onCurrentRateChange,
  onHistoryChange,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [timeHorizon, setTimeHorizon] = useState<'60m' | '24h'>(propTimeHorizon || '60m');

  // Synchronize with external timeHorizon prop if passed
  useEffect(() => {
    if (propTimeHorizon && propTimeHorizon !== timeHorizon) {
      setTimeHorizon(propTimeHorizon);
    }
  }, [propTimeHorizon]);

  const handleHorizonToggle = (horizon: '60m' | '24h') => {
    setTimeHorizon(horizon);
    playTone(horizon === '60m' ? 560 : 620, 0.04);
    if (onTimeHorizonChange) {
      onTimeHorizonChange(horizon);
    }
  };

  const [timeRangeMinutes, setTimeRangeMinutes] = useState<60 | 30 | 15>(60);
  const [streamMode, setStreamMode] = useState<'aggregate' | 'multinode'>('aggregate');
  const [isLiveRunning, setIsLiveRunning] = useState<boolean>(autoRefresh);
  const [selectedPeak, setSelectedPeak] = useState<EntropyDataPoint | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<EntropyDataPoint | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [lastSurgeTriggered, setLastSurgeTriggered] = useState<string | null>(null);
  const [copiedAnchor, setCopiedAnchor] = useState<boolean>(false);

  const handleCopyAnchor = useCallback(() => {
    copyToClipboard(CANONICAL_ENTROPY_ANCHOR_HASH);
    setCopiedAnchor(true);
    playTone(880, 0.05);
    setTimeout(() => setCopiedAnchor(false), 2000);
  }, []);

  // Baseline aggregate entropy computed from 10 council nodes
  const baselineSystemEntropy = useMemo(() => {
    return COUNCIL_MEMBERS.reduce((sum, m) => {
      const vit = getMemberVitality(m);
      return sum + vit.activeEntropyRateKBps;
    }, 0); // e.g. 11,264 KBps
  }, []);

  // Initialize 24 Hours of diurnal vitality telemetry (hourly intervals)
  const [history24h] = useState<EntropyDataPoint[]>(() => {
    const now = Date.now();
    const data: EntropyDataPoint[] = [];
    const base = baselineSystemEntropy;

    for (let i = 0; i < 24; i++) {
      const pointTime = new Date(now - (23 - i) * 3600000);
      const hourLabel = pointTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      const diurnalCycle = Math.sin((i / 24) * Math.PI * 2) * 480;
      let rate = Math.round(base + diurnalCycle + (Math.random() - 0.5) * 160);
      let isPeak = false;
      let peakLabel: string | undefined = undefined;
      let surgeFactorPct: number | undefined = undefined;

      if (i === 4) {
        isPeak = true;
        rate += 2600;
        peakLabel = '04:00 Lattice Dilithium Quorum Rekey';
        surgeFactorPct = 23.1;
      } else if (i === 12) {
        isPeak = true;
        rate += 3150;
        peakLabel = '12:00 Midday Quantum TRNG Reseed';
        surgeFactorPct = 28.0;
      } else if (i === 19) {
        isPeak = true;
        rate += 2900;
        peakLabel = '19:00 Cross-Border Sovereign Sync';
        surgeFactorPct = 25.7;
      }

      const std = 520;
      const stabilityScore = +(99.80 - (Math.abs(rate - base) / base) * 4).toFixed(2);
      const nodeContributions = COUNCIL_MEMBERS.map((m) => {
        const vit = getMemberVitality(m);
        return {
          slotId: m.slotId,
          code: m.councilCode,
          rateKBps: Math.round(rate * (vit.activeEntropyRateKBps / base)),
        };
      });

      data.push({
        minute: i * 60,
        timestamp: pointTime,
        timeLabel: hourLabel,
        entropyRateKBps: rate,
        baselineKBps: base,
        upperStdKBps: base + std,
        lowerStdKBps: base - std,
        isPeak,
        peakLabel,
        surgeFactorPct,
        stabilityScorePct: Math.max(98.2, Math.min(100, stabilityScore)),
        activeEnclavesCount: 10,
        nodeContributions,
      });
    }
    return data;
  });

  // Initialize 60 minutes of real-time vitality history
  const [history, setHistory] = useState<EntropyDataPoint[]>(() => {
    const now = Date.now();
    const data: EntropyDataPoint[] = [];
    const base = baselineSystemEntropy;

    // Seed realistic peak events over the past hour
    const peakMinutes = [14, 32, 48]; // 46m ago, 28m ago, 12m ago

    for (let i = 0; i < 60; i++) {
      const pointTime = new Date(now - (59 - i) * 60000);
      const isScheduledPeak = peakMinutes.includes(i);
      
      // Natural quantum noise simulation (sub-Kelvin jitter ±1.8%)
      const quantumNoise = Math.sin(i * 0.45) * 180 + Math.cos(i * 0.8) * 120 + (Math.random() - 0.5) * 150;
      let rate = Math.round(base + quantumNoise);

      let isPeak = false;
      let peakLabel: string | undefined = undefined;
      let surgeFactorPct: number | undefined = undefined;

      if (isScheduledPeak) {
        isPeak = true;
        const surge = 2800 + Math.round(Math.random() * 1200);
        rate += surge;
        surgeFactorPct = +((surge / base) * 100).toFixed(1);
        if (i === 14) peakLabel = 'Lattice Dilithium-5 Master Seeding';
        else if (i === 32) peakLabel = '10/10 Council Quorum Rekeying';
        else if (i === 48) peakLabel = 'Sub-Kelvin Thermal Bus Cryo-Burst';
      }

      const std = 450;
      const stabilityScore = +(99.85 - (Math.abs(rate - base) / base) * 5).toFixed(2);

      const nodeContributions = COUNCIL_MEMBERS.map((m) => {
        const vit = getMemberVitality(m);
        const nodeRatio = vit.activeEntropyRateKBps / base;
        return {
          slotId: m.slotId,
          code: m.councilCode,
          rateKBps: Math.round(rate * nodeRatio),
        };
      });

      data.push({
        minute: i,
        timestamp: pointTime,
        timeLabel: pointTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        entropyRateKBps: rate,
        baselineKBps: base,
        upperStdKBps: base + std,
        lowerStdKBps: base - std,
        isPeak,
        peakLabel,
        surgeFactorPct,
        stabilityScorePct: Math.max(98.5, Math.min(100, stabilityScore)),
        activeEnclavesCount: 10,
        nodeContributions,
      });
    }
    return data;
  });

  // Derived Statistics over current window
  const activeDataset = useMemo(() => {
    if (timeHorizon === '24h') {
      return history24h;
    }
    return history.slice(60 - timeRangeMinutes);
  }, [timeHorizon, history24h, history, timeRangeMinutes]);

  const currentPoint = history[history.length - 1] || activeDataset[activeDataset.length - 1];

  // Notify parent of current rate & 60m history changes
  useEffect(() => {
    if (currentPoint && onCurrentRateChange) {
      onCurrentRateChange(currentPoint.entropyRateKBps);
    }
  }, [currentPoint?.entropyRateKBps, onCurrentRateChange]);

  useEffect(() => {
    if (onHistoryChange) {
      onHistoryChange(history);
    }
  }, [history, onHistoryChange]);
  
  const stats = useMemo(() => {
    const rates = activeDataset.map((d) => d.entropyRateKBps);
    const sum = rates.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / rates.length);
    const max = Math.max(...rates);
    const min = Math.min(...rates);
    const peakPoint = activeDataset.find((d) => d.entropyRateKBps === max) || activeDataset[0];
    
    // Variance and Coefficient of Variation
    const variance = rates.reduce((acc, r) => acc + Math.pow(r - avg, 2), 0) / rates.length;
    const stdDev = Math.round(Math.sqrt(variance));
    const cv = +((stdDev / avg) * 100).toFixed(2);
    const stabilityIndex = Math.max(98.2, +(100 - cv).toFixed(2));

    return {
      current: currentPoint?.entropyRateKBps ?? avg,
      avg,
      max,
      min,
      stdDev,
      stabilityIndex,
      peakCount: activeDataset.filter((d) => d.isPeak).length,
      peakPoint,
    };
  }, [activeDataset, currentPoint]);

  // Real-time ticking simulation: push fresh entropy reading every 2s
  useEffect(() => {
    if (!isLiveRunning) return;

    const interval = setInterval(() => {
      setHistory((prev) => {
        const last = prev[prev.length - 1];
        const nowTime = new Date();
        const base = baselineSystemEntropy;
        
        // Micro-jitter of live quantum TRNG
        const noise = (Math.random() - 0.48) * 220 + Math.sin(Date.now() / 3000) * 150;
        const newRate = Math.round(base + noise);
        const std = 450;
        const stabilityScore = +(99.85 - (Math.abs(newRate - base) / base) * 4).toFixed(2);

        const nodeContributions = COUNCIL_MEMBERS.map((m) => {
          const vit = getMemberVitality(m);
          const nodeRatio = vit.activeEntropyRateKBps / base;
          return {
            slotId: m.slotId,
            code: m.councilCode,
            rateKBps: Math.round(newRate * nodeRatio),
          };
        });

        const newPoint: EntropyDataPoint = {
          minute: last ? last.minute + 1 : 60,
          timestamp: nowTime,
          timeLabel: nowTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
          entropyRateKBps: newRate,
          baselineKBps: base,
          upperStdKBps: base + std,
          lowerStdKBps: base - std,
          isPeak: false,
          stabilityScorePct: Math.max(98.5, Math.min(100, stabilityScore)),
          activeEnclavesCount: 10,
          nodeContributions,
        };

        // Maintain rolling 60 points
        return [...prev.slice(1), newPoint];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isLiveRunning, baselineSystemEntropy]);

  // Simulate an Entropy Surge / PQC Rekeying Peak
  const triggerEntropySurge = useCallback(() => {
    if (soundEnabled) {
      playTone(740, 0.08);
      setTimeout(() => playTone(920, 0.12), 80);
      playAuditChime();
    }

    const surgeAmount = 3200 + Math.round(Math.random() * 1200);
    const nowTime = new Date();
    const label = 'Manual PQC Lattice Entropy Injection Surge';
    setLastSurgeTriggered(label);
    setTimeout(() => setLastSurgeTriggered(null), 4000);

    setHistory((prev) => {
      const last = prev[prev.length - 1];
      const base = baselineSystemEntropy;
      const surgeRate = base + surgeAmount;
      const surgeFactorPct = +((surgeAmount / base) * 100).toFixed(1);

      const surgePoint: EntropyDataPoint = {
        minute: last ? last.minute + 1 : 60,
        timestamp: nowTime,
        timeLabel: nowTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        entropyRateKBps: surgeRate,
        baselineKBps: base,
        upperStdKBps: base + 450,
        lowerStdKBps: base - 450,
        isPeak: true,
        peakLabel: label,
        surgeFactorPct,
        stabilityScorePct: 98.9,
        activeEnclavesCount: 10,
        nodeContributions: COUNCIL_MEMBERS.map((m) => {
          const vit = getMemberVitality(m);
          return {
            slotId: m.slotId,
            code: m.councilCode,
            rateKBps: Math.round(surgeRate * (vit.activeEntropyRateKBps / base)),
          };
        }),
      };

      return [...prev.slice(1), surgePoint];
    });
  }, [baselineSystemEntropy, soundEnabled]);

  // D3 Rendering Pipeline with Smooth Transition Animation for incoming data points
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = 360;
    const margin = { top: 30, right: 35, bottom: 45, left: 75 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('overflow', 'visible');

    // 1. Defs (Gradients & Filters)
    let defs = svg.select<SVGDefsElement>('defs');
    if (defs.empty()) {
      defs = svg.append('defs');

      // Emerald/Cyan Area Gradient
      const areaGrad = defs
        .append('linearGradient')
        .attr('id', 'entropy-area-grad')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');
      areaGrad.append('stop').attr('offset', '0%').attr('stop-color', '#10b981').attr('stop-opacity', 0.4);
      areaGrad.append('stop').attr('offset', '65%').attr('stop-color', '#06b6d4').attr('stop-opacity', 0.12);
      areaGrad.append('stop').attr('offset', '100%').attr('stop-color', '#0e1726').attr('stop-opacity', 0.0);

      // Stability Band Gradient
      const bandGrad = defs
        .append('linearGradient')
        .attr('id', 'stability-band-grad')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');
      bandGrad.append('stop').attr('offset', '0%').attr('stop-color', '#38bdf8').attr('stop-opacity', 0.12);
      bandGrad.append('stop').attr('offset', '100%').attr('stop-color', '#38bdf8').attr('stop-opacity', 0.04);

      // Peak Glow Filter
      const filter = defs
        .append('filter')
        .attr('id', 'peak-glow')
        .attr('x', '-50%')
        .attr('y', '-50%')
        .attr('width', '200%')
        .attr('height', '200%');
      filter.append('feGaussianBlur').attr('stdDeviation', 4).attr('result', 'coloredBlur');
      const feMerge = filter.append('feMerge');
      feMerge.append('feMergeNode').attr('in', 'coloredBlur');
      feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    }

    // 2. Root Group & Child Layers
    let g = svg.select<SVGGElement>('g.root-entropy-group');
    const isInitial = g.empty();

    if (isInitial) {
      g = svg.append('g').attr('class', 'root-entropy-group').attr('transform', `translate(${margin.left}, ${margin.top})`);
      g.append('g').attr('class', 'grid-lines');
      g.append('path').attr('class', 'stability-band')
        .attr('fill', 'url(#stability-band-grad)')
        .attr('stroke', 'rgba(56, 189, 248, 0.25)')
        .attr('stroke-width', 0.75)
        .attr('stroke-dasharray', '4 2');
      g.append('line').attr('class', 'baseline-line')
        .attr('stroke', '#38bdf8')
        .attr('stroke-width', 1.2)
        .attr('stroke-dasharray', '6 3')
        .attr('opacity', 0.7);
      g.append('text').attr('class', 'baseline-text')
        .attr('text-anchor', 'end')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('fill', '#38bdf8');
      g.append('path').attr('class', 'entropy-area')
        .attr('fill', 'url(#entropy-area-grad)');
      g.append('path').attr('class', 'entropy-line')
        .attr('fill', 'none')
        .attr('stroke', '#10b981')
        .attr('stroke-width', 2.2);
      g.append('g').attr('class', 'peaks-layer');

      const pulseGroup = g.append('g').attr('class', 'pulse-point-group');
      pulseGroup.append('circle').attr('class', 'pulse-halo')
        .attr('r', 8)
        .attr('fill', '#10b981')
        .attr('opacity', 0.3)
        .append('animate')
        .attr('attributeName', 'r')
        .attr('values', '4;14;4')
        .attr('dur', '2s')
        .attr('repeatCount', 'indefinite');
      pulseGroup.append('circle').attr('class', 'pulse-center')
        .attr('r', 4.5)
        .attr('fill', '#34d399')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1.5);

      g.append('g').attr('class', 'x-axis').attr('transform', `translate(0, ${innerHeight})`);
      g.append('g').attr('class', 'y-axis');

      svg.append('text').attr('class', 'top-left-label')
        .attr('x', margin.left)
        .attr('y', 18)
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .attr('fill', '#38bdf8');

      svg.append('text').attr('class', 'top-right-anchor')
        .attr('x', width - margin.right)
        .attr('y', 18)
        .attr('text-anchor', 'end')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('fill', '#06b6d4')
        .attr('opacity', 0.85);

      const focusG = g.append('g').attr('class', 'focus').style('display', 'none');
      focusG.append('line').attr('class', 'focus-line')
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', '#38bdf8')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3 3')
        .attr('opacity', 0.8);
      focusG.append('circle').attr('class', 'focus-circle')
        .attr('r', 5)
        .attr('fill', '#38bdf8')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1.5);

      g.append('rect').attr('class', 'overlay')
        .attr('fill', 'transparent');
    }

    // Define smooth animation transition
    const transitionDuration = isInitial ? 0 : 600;
    const t = svg.transition().duration(transitionDuration).ease(d3.easeCubicOut) as any;

    // 3. Compute Scales
    const xScale = d3
      .scaleLinear()
      .domain([0, activeDataset.length - 1])
      .range([0, innerWidth]);

    const yMin = Math.max(0, Math.min(stats.min - 800, baselineSystemEntropy - 1500));
    const yMax = Math.max(stats.max + 1200, baselineSystemEntropy + 3500);
    const yScale = d3.scaleLinear().domain([yMin, yMax]).range([innerHeight, 0]).nice();

    // 4. Horizontal Grid Lines with Transition
    const yTicks = yScale.ticks(6);
    const gridSel = g.select('.grid-lines').selectAll<SVGLineElement, number>('line').data(yTicks, (d) => d);
    gridSel.exit().remove();
    gridSel.enter()
      .append('line')
      .attr('stroke', 'rgba(255, 255, 255, 0.06)')
      .attr('stroke-dasharray', '3 3')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .merge(gridSel)
      .transition(t as any)
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d));

    // 5. Area & Line Generators
    const stabilityArea = d3
      .area<EntropyDataPoint>()
      .x((_, i) => xScale(i))
      .y0((d) => yScale(d.lowerStdKBps))
      .y1((d) => yScale(d.upperStdKBps))
      .curve(d3.curveMonotoneX);

    const areaGenerator = d3
      .area<EntropyDataPoint>()
      .x((_, i) => xScale(i))
      .y0(innerHeight)
      .y1((d) => yScale(d.entropyRateKBps))
      .curve(d3.curveMonotoneX);

    const lineGenerator = d3
      .line<EntropyDataPoint>()
      .x((_, i) => xScale(i))
      .y((d) => yScale(d.entropyRateKBps))
      .curve(d3.curveMonotoneX);

    // 6. Smooth Paths Transition
    g.select<SVGPathElement>('.stability-band')
      .datum(activeDataset)
      .transition(t as any)
      .attr('d', stabilityArea);

    g.select<SVGPathElement>('.entropy-area')
      .datum(activeDataset)
      .transition(t as any)
      .attr('d', areaGenerator);

    g.select<SVGPathElement>('.entropy-line')
      .datum(activeDataset)
      .transition(t as any)
      .attr('d', lineGenerator);

    g.select<SVGLineElement>('.baseline-line')
      .transition(t as any)
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScale(baselineSystemEntropy))
      .attr('y2', yScale(baselineSystemEntropy));

    g.select<SVGTextElement>('.baseline-text')
      .transition(t as any)
      .attr('x', innerWidth - 6)
      .attr('y', yScale(baselineSystemEntropy) - 6)
      .text(`Baseline SSoT: ${baselineSystemEntropy.toLocaleString()} KBps`);

    // Top unit & anchor headers
    svg.select<SVGTextElement>('.top-left-label')
      .text(`Active Entropy Rate (KBps) / ${timeHorizon === '24h' ? '24H Diurnal Profile' : 'Sub-Kelvin Real-Time TRNG'}`);

    svg.select<SVGTextElement>('.top-right-anchor')
      .attr('x', width - margin.right)
      .text(`ROOT ANCHOR: ${CANONICAL_ENTROPY_ANCHOR_HASH.slice(0, 12)}...${CANONICAL_ENTROPY_ANCHOR_HASH.slice(-8)}`);

    // 7. Real-Time Trailing Head Pulse Point (Smooth transition to latest coordinates)
    if (activeDataset.length > 0) {
      const lastIdx = activeDataset.length - 1;
      const lastPoint = activeDataset[lastIdx];
      const curX = xScale(lastIdx);
      const curY = yScale(lastPoint.entropyRateKBps);

      const pulseGroup = g.select('.pulse-point-group');
      pulseGroup.select('.pulse-halo')
        .transition(t as any)
        .attr('cx', curX)
        .attr('cy', curY);

      pulseGroup.select('.pulse-center')
        .transition(t as any)
        .attr('cx', curX)
        .attr('cy', curY);
    }

    // 8. Peaks Data Join with Transition
    const peaksData = activeDataset.map((d, i) => ({ ...d, datasetIdx: i })).filter((d) => d.isPeak);
    const peaksSel = g.select('.peaks-layer').selectAll<SVGGElement, any>('g.peak-node')
      .data(peaksData, (d: any) => `${d.timeLabel}-${d.entropyRateKBps}`);

    peaksSel.exit().transition(t as any).attr('opacity', 0).remove();

    const peakEnter = peaksSel.enter().append('g').attr('class', 'peak-node').attr('opacity', 0);
    peakEnter.append('circle').attr('class', 'peak-glow-ring')
      .attr('r', 10)
      .attr('fill', 'none')
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.6)
      .attr('filter', 'url(#peak-glow)');

    peakEnter.append('circle').attr('class', 'peak-center-dot')
      .attr('r', 4.5)
      .attr('fill', '#f59e0b')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer');

    const badgeG = peakEnter.append('g').attr('class', 'peak-badge').style('cursor', 'pointer');
    badgeG.append('rect')
      .attr('x', -44)
      .attr('y', -30)
      .attr('width', 88)
      .attr('height', 16)
      .attr('rx', 4)
      .attr('fill', '#1e140a')
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 0.8)
      .attr('opacity', 0.95);
    badgeG.append('text')
      .attr('x', 0)
      .attr('y', -18)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .attr('fill', '#fde68a');

    const peaksMerged = peakEnter.merge(peaksSel);
    peaksMerged.style('cursor', 'pointer').on('click', (_, d) => {
      setSelectedPeak(d);
      playTone(800, 0.05);
    });

    peaksMerged.transition(t as any).attr('opacity', 1);
    peaksMerged.select('.peak-glow-ring')
      .transition(t as any)
      .attr('cx', (d) => xScale((d as any).datasetIdx))
      .attr('cy', (d) => yScale((d as any).entropyRateKBps));
    peaksMerged.select('.peak-center-dot')
      .transition(t as any)
      .attr('cx', (d) => xScale((d as any).datasetIdx))
      .attr('cy', (d) => yScale((d as any).entropyRateKBps));
    peaksMerged.select('.peak-badge')
      .transition(t as any)
      .attr('transform', (d) => `translate(${xScale((d as any).datasetIdx)}, ${yScale((d as any).entropyRateKBps)})`);
    peaksMerged.select('.peak-badge text')
      .text((d) => `▲ ${(d as any).entropyRateKBps.toLocaleString()} KBps`);

    // 9. Axes with Transition
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(Math.min(8, activeDataset.length))
      .tickFormat((d) => {
        const idx = Math.round(Number(d));
        const point = activeDataset[idx];
        if (!point) return '';
        if (timeHorizon === '24h') {
          return point.timeLabel;
        }
        const minAgo = activeDataset.length - 1 - idx;
        return minAgo === 0 ? 'NOW' : `-${minAgo}m`;
      });

    const xG = g.select<SVGGElement>('.x-axis');
    xG.attr('transform', `translate(0, ${innerHeight})`).transition(t as any).call(xAxis);
    xG.select('.domain').attr('stroke', 'rgba(255, 255, 255, 0.2)');
    xG.selectAll('.tick line').attr('stroke', 'rgba(255, 255, 255, 0.15)');
    xG.selectAll('.tick text')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('fill', '#94a3b8');

    const yAxis = d3
      .axisLeft(yScale)
      .ticks(6)
      .tickFormat((d) => `${(Number(d) / 1000).toFixed(1)}k`);

    const yG = g.select<SVGGElement>('.y-axis');
    yG.transition(t as any).call(yAxis);
    yG.select('.domain').attr('stroke', 'rgba(255, 255, 255, 0.2)');
    yG.selectAll('.tick line').attr('stroke', 'rgba(255, 255, 255, 0.15)');
    yG.selectAll('.tick text')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('fill', '#94a3b8');

    // 10. Interactive Crosshair & Tooltip Overlay
    const focusG = g.select<SVGGElement>('.focus');
    const focusLine = focusG.select('line');
    const focusCircle = focusG.select('circle');

    g.select<SVGRectElement>('rect.overlay')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .on('mouseover', () => focusG.style('display', null))
      .on('mouseout', () => {
        focusG.style('display', 'none');
        setHoveredPoint(null);
      })
      .on('mousemove', function (event) {
        const [mx] = d3.pointer(event);
        const idx = Math.round(xScale.invert(mx));
        const clampedIdx = Math.max(0, Math.min(activeDataset.length - 1, idx));
        const point = activeDataset[clampedIdx];

        if (point) {
          const cx = xScale(clampedIdx);
          const cy = yScale(point.entropyRateKBps);

          focusLine.attr('x1', cx).attr('x2', cx);
          focusCircle.attr('cx', cx).attr('cy', cy);
          setHoveredPoint(point);
        }
      });
  }, [activeDataset, baselineSystemEntropy, stats, timeRangeMinutes, timeHorizon]);

  // Export Time Series as JSON
  const handleExportJson = () => {
    playAuditChime();
    const payload = {
      reportType: 'ZYRQUEN_ACTIVE_ENTROPY_RATE_TIME_SERIES',
      canonicalEntropyAnchorHash: CANONICAL_ENTROPY_ANCHOR_HASH,
      fipsCertification: 'NIST FIPS 140-3 Level 4 physical security & Common Criteria EAL6+',
      timestampUtc: new Date().toUTCString(),
      timeRangeMinutes,
      baselineKBps: baselineSystemEntropy,
      statistics: stats,
      readingsCount: activeDataset.length,
      readings: activeDataset,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `active-entropy-rate-history-${timeRangeMinutes}m-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="active-entropy-rate-monitor"
      ref={containerRef}
      className={`rounded-[24px] bg-gradient-to-br from-[#0c131d]/90 via-[#070b14]/85 to-[#04060b] border-cyan-500/25 p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden font-mono ${className}`}
    >
      {/* Background Decorative Ambient Glow */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & Metrics Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/8 pb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[11px] font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>D3 ACTIVE ENTROPY ENGINE</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border-cyan-500/20 text-[11px]">
              SUB-KELVIN TRNG POOL (0.014K)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border-amber-500/20 text-[11px]">
              10/10 ENCLAVES SYNCHRONIZED
            </span>
            {isLiveRunning && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 text-[10px] border-emerald-500/30 animate-pulse">
                ● LIVE TICK (2s)
              </span>
            )}
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mt-1.5 flex items-center gap-2">
            Active Entropy Rate (KBps) Vitality & Stability Monitor
          </h3>
          <p className="text-xs text-zinc-400 font-sans mt-0.5">
            Continuous real-time cryptographic vitality telemetry tracking quantum noise stability, standard deviation bands, and peak entropy surges over the last hour.
          </p>

          {/* Canonical Entropy Anchor Digest Pill */}
          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-black/60 border-cyan-500/30 text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider">Entropy Anchor Digest:</span>
              <span className="text-cyan-200 font-mono text-[11px] font-bold tracking-tight select-all">
                {CANONICAL_ENTROPY_ANCHOR_HASH}
              </span>
              <button
                onClick={handleCopyAnchor}
                className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors"
                title="Copy Canonical Entropy Anchor Hash"
              >
                {copiedAnchor ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
              </button>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border-emerald-500/20">
              10/10 HSM SSoT Invariant Sealed
            </span>
          </div>
        </div>

        {/* Action Controls, View Switcher & Range Selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Horizon View-Switcher: Last 60 Minutes vs Last 24 Hours */}
          <div
            id="entropy-horizon-view-switcher"
            className="flex items-center bg-black/60 border-cyan-500/30 rounded-xl p-1 text-xs"
          >
            <button
              id="btn-entropy-horizon-60m"
              onClick={() => handleHorizonToggle('60m')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                timeHorizon === '60m'
                  ? 'bg-cyan-500/25 text-cyan-200 font-bold border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Switch to real-time 60-minute Active Entropy telemetry"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Last 60 Minutes</span>
            </button>
            <button
              id="btn-entropy-horizon-24h"
              onClick={() => handleHorizonToggle('24h')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                timeHorizon === '24h'
                  ? 'bg-cyan-500/25 text-cyan-200 font-bold border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Switch to diurnal 24-hour Active Entropy telemetry"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Last 24 Hours</span>
            </button>
          </div>

          {/* Sub-window filter (Only applicable in 60m view) */}
          {timeHorizon === '60m' && (
            <div className="flex items-center bg-black/50 border-white/10 rounded-xl p-1 text-xs">
              <button
                onClick={() => {
                  setTimeRangeMinutes(60);
                  playTone(550, 0.04);
                }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  timeRangeMinutes === 60
                    ? 'bg-cyan-500/25 text-cyan-200 font-bold border-cyan-500/40'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                1 Hour
              </button>
              <button
                onClick={() => {
                  setTimeRangeMinutes(30);
                  playTone(590, 0.04);
                }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  timeRangeMinutes === 30
                    ? 'bg-cyan-500/25 text-cyan-200 font-bold border-cyan-500/40'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                30 Min
              </button>
              <button
                onClick={() => {
                  setTimeRangeMinutes(15);
                  playTone(630, 0.04);
                }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  timeRangeMinutes === 15
                    ? 'bg-cyan-500/25 text-cyan-200 font-bold border-cyan-500/40'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                15 Min
              </button>
            </div>
          )}

          {/* Trigger Peak Surge Simulation Button */}
          <button
            onClick={triggerEntropySurge}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border-amber-500/40 text-amber-200 hover:text-white flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(245,158,11,0.25)] hover:scale-[1.02]"
            title="Simulate a real-time cryptographic entropy burst (e.g. 10/10 Council PQC Rekeying)"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Peak Surge</span>
          </button>

          {/* Pause / Resume Button */}
          <button
            onClick={() => {
              setIsLiveRunning(!isLiveRunning);
              playTone(650, 0.04);
            }}
            className="px-3 py-1.5 rounded-xl text-xs bg-black/60 hover:bg-black/80 border-white/15 text-zinc-300 hover:text-white flex items-center gap-1.5 transition-all"
            title={isLiveRunning ? 'Pause live entropy tick' : 'Resume live entropy tick'}
          >
            {isLiveRunning ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isLiveRunning ? 'Pause' : 'Resume'}</span>
          </button>

          {/* Export CSV Button */}
          <button
            id="btn-export-entropy-csv"
            onClick={() => exportActiveEntropyCsv(history, 'zyrquen-entropy-60min')}
            className="px-3 py-1.5 rounded-xl text-xs bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-300 hover:text-white flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(16,185,129,0.15)]"
            title="Download the current 60-minute Active Entropy Rate data points as CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          {/* Export JSON Button */}
          <button
            onClick={handleExportJson}
            className="px-3 py-1.5 rounded-xl text-xs bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-300 hover:text-white flex items-center gap-1.5 transition-all"
            title="Export entropy time-series dataset as JSON"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Quick Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 my-4">
        <div className="p-3 rounded-2xl bg-black/40 border-white/8">
          <div className="text-[10px] text-zinc-400 flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-400" />
            <span>Current Rate</span>
          </div>
          <div className="text-lg font-bold text-emerald-300 mt-0.5">
            {stats.current.toLocaleString()} <span className="text-xs font-normal text-zinc-400">KBps</span>
          </div>
          <div className="text-[10px] text-emerald-400/80">
            {stats.current >= baselineSystemEntropy ? `+${(stats.current - baselineSystemEntropy).toLocaleString()} above SSoT` : `-${(baselineSystemEntropy - stats.current).toLocaleString()} SSoT`}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-black/40 border-white/8">
          <div className="text-[10px] text-zinc-400 flex items-center gap-1">
            <Gauge className="w-3 h-3 text-cyan-400" />
            <span>1-Hour Baseline Mean</span>
          </div>
          <div className="text-lg font-bold text-cyan-300 mt-0.5">
            {stats.avg.toLocaleString()} <span className="text-xs font-normal text-zinc-400">KBps</span>
          </div>
          <div className="text-[10px] text-zinc-400">Nominal 11,264 KBps</div>
        </div>

        <div className="p-3 rounded-2xl bg-black/40 border-amber-500/20 bg-amber-950/10">
          <div className="text-[10px] text-amber-300/80 flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-400" />
            <span>1-Hour Peak Surge</span>
          </div>
          <div className="text-lg font-bold text-amber-300 mt-0.5">
            {stats.max.toLocaleString()} <span className="text-xs font-normal text-zinc-400">KBps</span>
          </div>
          <div className="text-[10px] text-amber-400/80">
            {stats.max > baselineSystemEntropy ? `+${+(((stats.max - baselineSystemEntropy) / baselineSystemEntropy) * 100).toFixed(1)}% Max Peak` : 'Stable Baseline'}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-black/40 border-white/8">
          <div className="text-[10px] text-zinc-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Stability Index</span>
          </div>
          <div className="text-lg font-bold text-emerald-300 mt-0.5">
            {stats.stabilityIndex}%
          </div>
          <div className="text-[10px] text-emerald-400/80">ULTRA-STABLE (±{stats.stdDev} KBps)</div>
        </div>

        <div className="p-3 rounded-2xl bg-black/40 border-white/8">
          <div className="text-[10px] text-zinc-400 flex items-center gap-1">
            <Layers className="w-3 h-3 text-indigo-400" />
            <span>Detected Peaks</span>
          </div>
          <div className="text-lg font-bold text-indigo-300 mt-0.5">
            {stats.peakCount} <span className="text-xs font-normal text-zinc-400">events</span>
          </div>
          <div className="text-[10px] text-zinc-400">Cryptographic Re-seeds</div>
        </div>

        <div className="p-3 rounded-2xl bg-black/40 border-white/8">
          <div className="text-[10px] text-zinc-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-purple-400" />
            <span>Last Peak Time</span>
          </div>
          <div className="text-sm font-bold text-purple-300 mt-1">
            {stats.peakPoint.timeLabel}
          </div>
          <div className="text-[10px] text-zinc-400 truncate" title={stats.peakPoint.peakLabel || 'Nominal Peak'}>
            {stats.peakPoint.peakLabel || 'Nominal Invariant'}
          </div>
        </div>
      </div>

      {/* Surge Notification Toast */}
      {lastSurgeTriggered && (
        <div className="p-3 mb-3 rounded-xl bg-amber-500/15 border-amber-500/40 text-amber-200 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
            <span><strong>Entropy Peak Surge Injected:</strong> {lastSurgeTriggered} (+{stats.max.toLocaleString()} KBps peak registered in D3 stream).</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 rounded-md">RATIFIED</span>
        </div>
      )}

      {/* D3 Primary Canvas */}
      <div className="relative w-full rounded-2xl bg-black/60 border-white/10 p-2 overflow-hidden shadow-inner">
        <svg ref={svgRef} className="w-full h-[360px]" />

        {/* Live Floating Inspector Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-4 right-4 p-3 rounded-xl bg-[#090d16]/95 border-cyan-500/40 backdrop-blur-md shadow-2xl text-xs space-y-1 z-10 pointer-events-none">
            <div className="flex items-center justify-between gap-3 text-cyan-300 font-bold border-b border-white/10 pb-1">
              <span>Reading @ {hoveredPoint.timeLabel}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-200">
                {hoveredPoint.isPeak ? 'PEAK SURGE' : 'STABLE'}
              </span>
            </div>
            <div className="text-white flex items-center justify-between gap-4 pt-0.5">
              <span className="text-zinc-400">Entropy Rate:</span>
              <span className="font-bold text-emerald-300">{hoveredPoint.entropyRateKBps.toLocaleString()} KBps</span>
            </div>
            <div className="text-white flex items-center justify-between gap-4">
              <span className="text-zinc-400">Delta vs Mean:</span>
              <span className={hoveredPoint.entropyRateKBps >= baselineSystemEntropy ? 'text-amber-300' : 'text-zinc-300'}>
                {hoveredPoint.entropyRateKBps >= baselineSystemEntropy ? `+${(hoveredPoint.entropyRateKBps - baselineSystemEntropy).toLocaleString()} KBps` : `-${(baselineSystemEntropy - hoveredPoint.entropyRateKBps).toLocaleString()} KBps`}
              </span>
            </div>
            <div className="text-white flex items-center justify-between gap-4">
              <span className="text-zinc-400">Stability Rating:</span>
              <span className="text-emerald-400">{hoveredPoint.stabilityScorePct}%</span>
            </div>
            {hoveredPoint.peakLabel && (
              <div className="pt-1 text-[11px] text-amber-300 border-t border-white/10">
                Event: {hoveredPoint.peakLabel}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Peak Detail Card */}
      {selectedPeak && (
        <div className="mt-4 p-4 rounded-2xl bg-amber-950/25 border-amber-500/40 text-xs animate-in fade-in flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <strong className="text-amber-200 text-sm">
                Selected Peak Invariant: {selectedPeak.peakLabel || 'Cryptographic Entropy Surge'}
              </strong>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">
                {selectedPeak.timeLabel} ({60 - selectedPeak.minute}m ago)
              </span>
            </div>
            <p className="text-zinc-300 font-sans">
              Recorded peak magnitude: <strong className="text-white">{selectedPeak.entropyRateKBps.toLocaleString()} KBps</strong>{' '}
              ({selectedPeak.surgeFactorPct ? `+${selectedPeak.surgeFactorPct}% surge` : 'above normal'}) with all 10 Hardware Enclaves operating at sub-Kelvin temperature 0.014K.
            </p>
          </div>
          <button
            onClick={() => setSelectedPeak(null)}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 hover:text-white transition-all text-xs shrink-0 self-start md:self-center"
          >
            Dismiss Details
          </button>
        </div>
      )}

      {/* 10 Council Enclaves Multi-Stream Mini Distribution */}
      <div className="mt-5 pt-4 border-t border-white/8">
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-zinc-200">10 Council HSM Node Entropy Contributors</span>
            <span className="text-[10px] text-zinc-400 font-sans">
              (Distributed Quantum TRNG Entropy Pool Breakdown)
            </span>
          </div>
          <div className="text-[11px] text-emerald-400 font-bold">
            Total Aggregate: {currentPoint.entropyRateKBps.toLocaleString()} KBps
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          {COUNCIL_MEMBERS.map((m) => {
            const vit = getMemberVitality(m);
            const ratio = vit.activeEntropyRateKBps / baselineSystemEntropy;
            const currentContribution = Math.round(currentPoint.entropyRateKBps * ratio);
            const pctOfTotal = ((currentContribution / currentPoint.entropyRateKBps) * 100).toFixed(1);

            return (
              <div
                key={m.slotId}
                className="p-2.5 rounded-xl bg-black/40 border-white/6 hover:border-cyan-500/40 transition-all group"
                title={`${m.councilCode} - ${m.nameEn} (${m.hardwareEnclave})`}
              >
                <div className="flex items-center justify-between text-[10px] text-zinc-400">
                  <span className="font-bold text-zinc-300 group-hover:text-cyan-300">{m.councilCode}</span>
                  <span className="text-[9px] text-emerald-400">{pctOfTotal}%</span>
                </div>
                <div className="text-xs font-bold text-white mt-1 group-hover:text-cyan-200">
                  {currentContribution.toLocaleString()}
                </div>
                <div className="text-[9px] text-zinc-500 truncate mt-0.5">
                  KBps ({(vit.subKelvinTempK * 1000).toFixed(0)}mK)
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
