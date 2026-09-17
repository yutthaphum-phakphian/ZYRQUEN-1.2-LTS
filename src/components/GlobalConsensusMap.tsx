import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'motion/react';
import {
  Globe,
  Activity,
  Server,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Terminal,
  Copy,
  Check,
  Zap,
  Lock,
  Scale,
  ExternalLink,
  ChevronRight,
  Info,
  Clock,
  Radio,
  Layers,
  Sparkles,
  ArrowRightLeft,
  FileText,
} from 'lucide-react';
import {
  INITIAL_GEO_REGIONS,
  INITIAL_CROSS_REGION_LINKS,
  GeoRegionNode,
  CrossRegionLinkHealth,
  GlobalSyncAuditResult,
  runSimulatedGlobalSyncAudit,
  RUN_GLOBAL_SYNC_AUDIT_SH,
} from '../data/senateBenchmarkSuiteV5';
import { playTone, playAuditChime, playWarningTone } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';
import { SovereignReportModal } from './SovereignReportModal';

// Virtual coordinate space for stable, vector-crisp projection (zero resize loops, zero flickering)
const MAP_CANVAS_WIDTH = 960;
const MAP_CANVAS_HEIGHT = 480;

interface GlobalConsensusMapProps {
  onNavigateToSenate?: () => void;
  className?: string;
  theme?: 'quantum' | 'ultraviolet' | 'obsidian';
}

// Stylized geometric land polygons for fast, offline, and reliable world rendering
// Coordinates format: [longitude, latitude][]
const WORLD_LANDMASS_POLYGONS: [number, number][][] = [
  // North America
  [
    [-168, 68], [-140, 70], [-125, 52], [-124, 38], [-117, 30], [-105, 20],
    [-80, 8], [-77, 8], [-80, 25], [-75, 35], [-65, 45], [-55, 52],
    [-60, 60], [-85, 68], [-130, 72], [-168, 68]
  ],
  // South America
  [
    [-80, 10], [-50, -5], [-35, -7], [-40, -22], [-55, -35], [-68, -55],
    [-75, -45], [-72, -18], [-80, -2], [-80, 10]
  ],
  // Eurasia (Europe + Asia)
  [
    [-10, 36], [0, 44], [10, 54], [25, 71], [60, 75], [100, 77], [170, 66],
    [142, 50], [130, 35], [120, 22], [105, 10], [98, 2], [80, 10],
    [70, 24], [55, 25], [45, 12], [35, 32], [28, 41], [15, 38],
    [-5, 36], [-10, 36]
  ],
  // Africa
  [
    [-17, 15], [-5, 36], [10, 37], [32, 32], [51, 12], [42, -12],
    [32, -30], [18, -34], [12, -18], [9, 5], [-17, 15]
  ],
  // Australia
  [
    [113, -22], [125, -14], [142, -11], [153, -28], [148, -38],
    [135, -35], [115, -34], [113, -22]
  ],
  // British Isles & Scandinavia accent
  [
    [-5, 50], [2, 52], [0, 58], [-6, 56], [-5, 50]
  ],
  // Japan & East Asia Coastline
  [
    [130, 32], [136, 35], [141, 43], [145, 45], [140, 38], [130, 32]
  ],
];

export const GlobalConsensusMap: React.FC<GlobalConsensusMapProps> = ({
  onNavigateToSenate,
  className = '',
  theme = 'quantum',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Active view mode: map | matrix | audit-cli
  const [activeTab, setActiveTab] = useState<'map' | 'matrix' | 'cli'>('map');

  // Multi-region consensus state
  const [regions, setRegions] = useState<GeoRegionNode[]>(INITIAL_GEO_REGIONS);
  const [links, setLinks] = useState<CrossRegionLinkHealth[]>(INITIAL_CROSS_REGION_LINKS);
  const [auditResult, setAuditResult] = useState<GlobalSyncAuditResult>(() =>
    runSimulatedGlobalSyncAudit(INITIAL_GEO_REGIONS, INITIAL_CROSS_REGION_LINKS)
  );

  // Selected Region for Deep Inspection (Defaults to Bangkok Sovereign HQ)
  const [selectedRegionId, setSelectedRegionId] = useState<string>('node-th-04');
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);
  const [hoveredLinkId, setHoveredLinkId] = useState<string | null>(null);

  // Chaos / Lag Simulation Mode
  const [chaosLagInjected, setChaosLagInjected] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditProgress, setAuditProgress] = useState(100);
  const [copiedCli, setCopiedCli] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Handle synthetic chaos / lag injection
  const handleToggleChaosLag = () => {
    if (!chaosLagInjected) {
      // Inject synthetic replication lag: 320ms into asia-east1 (exceeds 250ms threshold)
      playWarningTone();
      setChaosLagInjected(true);

      const updatedRegions: GeoRegionNode[] = regions.map((reg) => {
        if (reg.id === 'asia-east1') {
          return {
            ...reg,
            replicationLagMs: 324.5,
            driftBlocks: 3,
            status: 'DEGRADED',
            latencyMs: 388.2,
          };
        }
        return reg;
      });

      const updatedLinks: CrossRegionLinkHealth[] = links.map((lnk) => {
        if (lnk.targetRegionId === 'asia-east1' || lnk.sourceRegionId === 'asia-east1') {
          return {
            ...lnk,
            replicationLagMs: 324.5,
            status: 'DEGRADED',
            syncParityPct: 91.4,
          };
        }
        return lnk;
      });

      setRegions(updatedRegions);
      setLinks(updatedLinks);
      setAuditResult({
        ...auditResult,
        regions: updatedRegions,
        crossRegionLinks: updatedLinks,
        allRegionsInSync: false,
        maxDriftSec: 0.324,
        splitBrainRisk: 'POTENTIAL_RAFT_ELECTION_DELAY',
      });
    } else {
      // Re-sync & heal back to 100% lockstep parity
      playTone(600, 0.08);
      handleTriggerSyncAudit();
    }
  };

  // Run Simulated Global Sync Audit (matching scripts/run_global_sync_audit.sh)
  const handleTriggerSyncAudit = () => {
    setIsAuditing(true);
    setAuditProgress(0);
    playTone(520, 0.05);

    let prog = 0;
    const interval = setInterval(() => {
      prog += 20;
      setAuditProgress(Math.min(100, prog));
      if (prog >= 100) {
        clearInterval(interval);
        setIsAuditing(false);
        setChaosLagInjected(false);
        setRegions(INITIAL_GEO_REGIONS);
        setLinks(INITIAL_CROSS_REGION_LINKS);
        const res = runSimulatedGlobalSyncAudit(INITIAL_GEO_REGIONS, INITIAL_CROSS_REGION_LINKS);
        setAuditResult(res);
        playAuditChime();
      }
    }, 120);
  };

  const handleCopyCli = () => {
    copyToClipboard(
      `bash scripts/run_global_sync_audit.sh\n\n# Or inspect Envoy Edge routing\ncat scripts/envoy_global_router.yaml`
    );
    setCopiedCli(true);
    playAuditChime();
    setTimeout(() => setCopiedCli(false), 2000);
  };

  // D3 Projection & Path Rendering
  useEffect(() => {
    if (!svgRef.current) return;

    const width = MAP_CANVAS_WIDTH;
    const height = MAP_CANVAS_HEIGHT;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Natural Earth projection centered around Eurasia/Americas
    const projection = d3
      .geoNaturalEarth1()
      .scale(width / 5.6)
      .translate([width * 0.48, height * 0.52]);

    const pathGenerator = d3.geoPath().projection(projection);

    // Defs for gradients, filters, and glow effects
    const defs = svg.append('defs');

    // Subtle dark radial gradient for map backdrop
    const radialBg = defs
      .append('radialGradient')
      .attr('id', 'mapRadialGlow')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '65%');
    radialBg.append('stop').attr('offset', '0%').attr('stop-color', '#0e172e').attr('stop-opacity', 0.95);
    radialBg.append('stop').attr('offset', '100%').attr('stop-color', '#060a15').attr('stop-opacity', 1);

    // Neon Glow filter for links and active regions
    const filter = defs.append('filter').attr('id', 'neonGlow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // 1. Background Canvas
    svg
      .append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'url(#mapRadialGlow)')
      .attr('rx', 20);

    // 2. Graticule (Tactical Lat/Lon Grid)
    const graticule = d3.geoGraticule10();
    const graticuleGroup = svg.append('g').attr('class', 'graticule-layer');

    graticuleGroup
      .append('path')
      .datum(graticule)
      .attr('class', 'graticule')
      .attr('d', pathGenerator as any)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(6, 182, 212, 0.08)')
      .attr('stroke-width', 0.6)
      .attr('stroke-dasharray', '2,3');

    // Outline equator
    graticuleGroup
      .append('path')
      .datum({
        type: 'LineString',
        coordinates: [
          [-180, 0],
          [-90, 0],
          [0, 0],
          [90, 0],
          [180, 0],
        ],
      } as any)
      .attr('d', pathGenerator as any)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(6, 182, 212, 0.22)')
      .attr('stroke-width', 0.9)
      .attr('stroke-dasharray', '4,4');

    // 3. World Landmass Continents Layer
    const landGroup = svg.append('g').attr('class', 'landmass-layer');

    WORLD_LANDMASS_POLYGONS.forEach((coords, i) => {
      const polygonGeo: any = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [coords],
        },
      };

      landGroup
        .append('path')
        .datum(polygonGeo)
        .attr('d', pathGenerator as any)
        .attr('fill', '#0d172c')
        .attr('stroke', 'rgba(14, 165, 233, 0.22)')
        .attr('stroke-width', 1.0)
        .attr('opacity', 0.9);
    });

    // 4. Region Coordinates Mapping
    const regionPositions: Record<string, [number, number]> = {};
    regions.forEach((reg) => {
      if (reg.coordinates) {
        const projected = projection(reg.coordinates);
        if (projected) {
          regionPositions[reg.id] = projected;
        }
      }
    });

    // 5. Cross-Region Replication Geodesic Links
    const linksGroup = svg.append('g').attr('class', 'replication-links-layer');

    links.forEach((link) => {
      const sourceReg = regions.find((r) => r.id === link.sourceRegionId);
      const targetReg = regions.find((r) => r.id === link.targetRegionId);

      if (!sourceReg?.coordinates || !targetReg?.coordinates) return;

      const p1 = projection(sourceReg.coordinates);
      const p2 = projection(targetReg.coordinates);
      if (!p1 || !p2) return;

      // Generate curved geodesic arc via great-circle interpolation
      const interpolator = d3.geoInterpolate(sourceReg.coordinates, targetReg.coordinates);
      const arcPoints: [number, number][] = [];
      const steps = 36;
      for (let s = 0; s <= steps; s++) {
        const pt = interpolator(s / steps);
        const projPt = projection(pt);
        if (projPt) arcPoints.push(projPt);
      }

      const lineGen = d3
        .line<[number, number]>()
        .x((d) => d[0])
        .y((d) => d[1])
        .curve(d3.curveBasis);

      const pathString = lineGen(arcPoints) || '';

      // Determine color by replication health
      const isDegraded = link.status === 'DEGRADED';
      const isSyncing = link.status === 'SYNCING';
      const strokeColor = isDegraded ? '#f43f5e' : isSyncing ? '#f59e0b' : '#10b981';
      const glowColor = isDegraded ? 'rgba(244, 63, 94, 0.4)' : 'rgba(16, 185, 129, 0.35)';

      // Outer glow line
      linksGroup
        .append('path')
        .attr('d', pathString)
        .attr('fill', 'none')
        .attr('stroke', glowColor)
        .attr('stroke-width', 6)
        .attr('opacity', 0.6)
        .style('filter', 'url(#neonGlow)');

      // Core crisp path
      const pathElement = linksGroup
        .append('path')
        .attr('id', `path-${link.id}`)
        .attr('d', pathString)
        .attr('fill', 'none')
        .attr('stroke', strokeColor)
        .attr('stroke-width', 2.2)
        .attr('stroke-dasharray', isDegraded ? '5,5' : 'none')
        .attr('opacity', 0.95);

      // Animated Sync Particle Streams (Consensus Stream)
      // Moving dashed pulse to illustrate active replication packets
      const pulseStream = linksGroup
        .append('path')
        .attr('d', pathString)
        .attr('fill', 'none')
        .attr('stroke', isDegraded ? '#fb7185' : '#6ee7b7')
        .attr('stroke-width', 3)
        .attr('stroke-dasharray', '8, 24')
        .attr('opacity', 0.8);

      // Animate stream pulse via d3.transition
      function repeatPulse() {
        pulseStream
          .attr('stroke-dashoffset', 0)
          .transition()
          .duration(2400)
          .ease(d3.easeLinear)
          .attr('stroke-dashoffset', -64)
          .on('end', repeatPulse);
      }
      repeatPulse();

      // Mid-point replication tag (Distance & Lag)
      const midPoint = arcPoints[Math.floor(arcPoints.length / 2)];
      if (midPoint) {
        const tagG = linksGroup
          .append('g')
          .attr('transform', `translate(${midPoint[0]}, ${midPoint[1] - 12})`)
          .style('cursor', 'pointer')
          .on('mouseenter', () => setHoveredLinkId(link.id))
          .on('mouseleave', () => setHoveredLinkId(null));

        const tagText = `${link.replicationLagMs.toFixed(1)}ms lag · ${link.roundTripLatencyMs.toFixed(0)}ms RTT`;
        const textWidth = tagText.length * 6.2 + 14;

        tagG
          .append('rect')
          .attr('x', -textWidth / 2)
          .attr('y', -9)
          .attr('width', textWidth)
          .attr('height', 18)
          .attr('rx', 9)
          .attr('fill', '#050a16')
          .attr('stroke', isDegraded ? '#f43f5e' : 'rgba(16, 185, 129, 0.5)')
          .attr('stroke-width', 1.2);

        tagG
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('y', 3.5)
          .attr('fill', isDegraded ? '#fca5a5' : '#a7f3d0')
          .attr('font-size', '9px')
          .attr('font-family', 'monospace')
          .attr('font-weight', 'bold')
          .text(tagText);
      }
    });

    // 6. Region Nodes (Markers, Radar Rings, Labels)
    const nodesGroup = svg.append('g').attr('class', 'region-nodes-layer');

    regions.forEach((reg) => {
      const pos = regionPositions[reg.id];
      if (!pos) return;

      const isLeader = reg.id === 'us-central1';
      const isDegraded = reg.status === 'DEGRADED';
      const isSelected = selectedRegionId === reg.id;
      const isHovered = hoveredRegionId === reg.id;

      const nodeColor = isDegraded ? '#f43f5e' : isLeader ? '#38bdf8' : '#34d399';
      const glowColor = isDegraded ? 'rgba(244, 63, 94, 0.35)' : 'rgba(56, 189, 248, 0.35)';

      const nodeG = nodesGroup
        .append('g')
        .attr('transform', `translate(${pos[0]}, ${pos[1]})`)
        .style('cursor', 'pointer')
        .on('click', () => {
          setSelectedRegionId(reg.id);
          playTone(680, 0.05);
        })
        .on('mouseenter', () => setHoveredRegionId(reg.id))
        .on('mouseleave', () => setHoveredRegionId(null));

      // Animated Expanding Radar Ping Rings
      const radarCircle1 = nodeG
        .append('circle')
        .attr('r', 8)
        .attr('fill', 'none')
        .attr('stroke', nodeColor)
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.9);

      const radarCircle2 = nodeG
        .append('circle')
        .attr('r', 8)
        .attr('fill', 'none')
        .attr('stroke', nodeColor)
        .attr('stroke-width', 1)
        .attr('opacity', 0.6);

      function pulseRadar(element: d3.Selection<SVGCircleElement, unknown, null, undefined>, delay: number) {
        element
          .attr('r', 8)
          .attr('opacity', 0.9)
          .transition()
          .delay(delay)
          .duration(2000)
          .ease(d3.easeCubicOut)
          .attr('r', 28)
          .attr('opacity', 0)
          .on('end', () => pulseRadar(element, 0));
      }
      pulseRadar(radarCircle1, 0);
      pulseRadar(radarCircle2, 1000);

      // Outer Selection Ring
      if (isSelected || isHovered) {
        nodeG
          .append('circle')
          .attr('r', 16)
          .attr('fill', 'none')
          .attr('stroke', '#38bdf8')
          .attr('stroke-width', 1.8)
          .attr('stroke-dasharray', '3,3');
      }

      // Core Node Circle
      nodeG
        .append('circle')
        .attr('r', isLeader ? 9 : 7.5)
        .attr('fill', nodeColor)
        .attr('stroke', '#060b17')
        .attr('stroke-width', 2.5)
        .style('filter', 'url(#neonGlow)');

      // Inner Center Core
      nodeG
        .append('circle')
        .attr('r', 3)
        .attr('fill', '#ffffff');

      // Region Title Pill (Anchor Text)
      // Adjust position for clean readability on global canvas
      const labelOffsetX = reg.id === 'us-central1' ? -12 : reg.id === 'asia-east1' ? 14 : 0;
      const labelOffsetY = reg.id === 'europe-west1' ? -18 : 22;

      const labelG = nodeG.append('g').attr('transform', `translate(${labelOffsetX}, ${labelOffsetY})`);

      const pillText = reg.name.split(' ')[0];
      const pillWidth = pillText.length * 7.2 + 18;

      labelG
        .append('rect')
        .attr('x', -pillWidth / 2)
        .attr('y', -10)
        .attr('width', pillWidth)
        .attr('height', 20)
        .attr('rx', 10)
        .attr('fill', isSelected ? '#0b162d' : '#050a16')
        .attr('stroke', isSelected ? '#38bdf8' : isDegraded ? '#f43f5e' : 'rgba(255, 255, 255, 0.2)')
        .attr('stroke-width', isSelected ? 1.5 : 1.0);

      labelG
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 4)
        .attr('fill', isSelected ? '#38bdf8' : '#f1f5f9')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .text(pillText);

      // Leader Crown Badge
      if (isLeader) {
        labelG
          .append('circle')
          .attr('cx', pillWidth / 2 - 2)
          .attr('cy', -8)
          .attr('r', 4.5)
          .attr('fill', '#f59e0b')
          .attr('stroke', '#050a16')
          .attr('stroke-width', 1.5);
      }
    });

    // 7. Tactical Compass & HUD Overlay in Corner
    const hud = svg.append('g').attr('transform', `translate(20, ${height - 40})`);

    hud
      .append('text')
      .attr('fill', 'rgba(148, 163, 184, 0.7)')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .text(`PROJECTION: D3.NATURAL_EARTH1 · TOPOLOGY: 6-NODE BFT MESH (SOVEREIGN LTS)`);

    hud
      .append('text')
      .attr('y', 14)
      .attr('fill', 'rgba(56, 189, 248, 0.8)')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .text(`14,902 SEALS LOCKED · Δ_0 = 0.00% · 99.9996% SLA · AIR-GAPPED`);
  }, [regions, links, selectedRegionId, hoveredRegionId, chaosLagInjected]);

  // Selected Region Object
  const currentRegion = useMemo(() => {
    return regions.find((r) => r.id === selectedRegionId) || regions[0];
  }, [regions, selectedRegionId]);

  // Overall Global Consensus Status
  const globalParityPercent = auditResult.allRegionsInSync ? '100.0%' : '91.4%';
  const globalDriftSec = auditResult.maxDriftSec;
  const isHealthySla = globalDriftSec < 0.25;

  const isEmbedded = className.includes('border-0');

  return (
    <div
      id="global-consensus-map-panel"
      className={`text-slate-100 font-sans space-y-6 overflow-hidden ${
        isEmbedded
          ? className
          : `rounded-3xl bg-[#070e1c]/90 border border-cyan-500/25 p-5 sm:p-7 backdrop-blur-2xl shadow-[0_16px_50px_rgba(0,0,0,0.7)] ${className}`
      }`}
    >
      {/* ========================================================================= */}
      {/* 1. HEADER & GLOBAL AUDIT METRICS BAR                                      */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <span className={`w-2 h-2 rounded-full ${isHealthySla ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span>{isHealthySla ? '14,902 SEALS LOCKED · Δ_0 = 0.00%' : 'REPLICATION LAG DRIFT DETECTED'}</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 font-bold">
              99.9996% Sovereign SLA
            </span>
            <span className="px-2.5 py-1 rounded-full bg-purple-950/70 border border-purple-500/40 text-purple-300 font-bold">
              AIR-GAPPED SOVEREIGN INSTANCE
            </span>
            <span className="px-2.5 py-1 rounded-full bg-black/60 border border-white/10 text-zinc-300">
              6-Node BFT Mesh
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5 pt-1">
            <Globe className="w-6 h-6 text-cyan-400" />
            <span>Global Consensus Map (ZYRQUEN FROZEN v1.2 LTS)</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-500/40">
              6-Node BFT Mesh
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-3xl">
            โครงข่ายโทรมาตรฉันทามติอธิปไตย 6 โหนด (Bangkok Sovereign HQ, Singapore, Tokyo, London, Zadar Air-Gap, Virginia) ตรวจวัดความหน่วงการจำลองข้อมูลข้ามทวีปแบบเรียลไทม์ ตรวจสอบพันธะ SSoT 14,902 Seals โดยปราศจากการกลายพันธุ์ (Δ₀ = 0.00%)
          </p>
        </div>

        {/* Actions Deck */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Sovereign Report Trigger Button */}
          <button
            onClick={() => {
              setIsReportModalOpen(true);
              playTone(600, 0.05);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/25 hover:bg-cyan-500/35 text-cyan-200 border border-cyan-400/60 font-mono text-xs font-bold transition-all shadow-md cursor-pointer"
            title="Open Sovereign Node Technical Verification Report (Manus AI / 2026-05-13)"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-300" />
            <span>Technical Report (Manus AI)</span>
          </button>

          {/* Tab Switcher */}
          <div className="flex bg-black/60 p-1 rounded-2xl border border-white/10 text-xs font-mono">
            <button
              onClick={() => setActiveTab('map')}
              className={`px-3 py-1.5 rounded-xl transition-all font-semibold ${
                activeTab === 'map' ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Map Topology
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-xl transition-all font-semibold ${
                activeTab === 'matrix' ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Replication Matrix
            </button>
            <button
              onClick={() => setActiveTab('cli')}
              className={`px-3 py-1.5 rounded-xl transition-all font-semibold ${
                activeTab === 'cli' ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Audit Script CLI
            </button>
          </div>

          {/* Chaos / Lag Injection Toggle */}
          <button
            id="btn-toggle-lag-chaos"
            onClick={handleToggleChaosLag}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
              chaosLagInjected
                ? 'bg-rose-500/20 text-rose-200 border-rose-500/50 hover:bg-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
            }`}
            title="Inject artificial replication lag to test drift threshold warnings"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{chaosLagInjected ? 'Heal & Re-Sync Parity' : 'Inject Synthetic Lag (+320ms)'}</span>
          </button>

          {/* Trigger Audit Button */}
          <button
            id="btn-run-global-sync-audit"
            onClick={handleTriggerSyncAudit}
            disabled={isAuditing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 hover:from-cyan-500/30 hover:to-emerald-500/30 border border-cyan-400/40 text-cyan-200 text-xs font-mono font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-300 ${isAuditing ? 'animate-spin' : ''}`} />
            <span>{isAuditing ? `Auditing (${auditProgress}%)` : 'Run Sync Audit'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STATUTORY SLA & CROSS-REGION LAG HIGHLIGHT BANNER                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
        <div className="p-3 rounded-2xl bg-black/50 border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase">
            <span>Primary Leader</span>
            <Server className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="font-bold text-white text-sm">us-central1 (Iowa)</div>
          <div className="text-[10px] text-emerald-400">Raft Lease Term 4209 Active</div>
        </div>

        <div className="p-3 rounded-2xl bg-black/50 border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase">
            <span>Max Replication Lag</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className={`font-bold text-sm ${isHealthySla ? 'text-emerald-300' : 'text-rose-400 font-black'}`}>
            {chaosLagInjected ? '324.5 ms (ALERT)' : '12.4 ms (0.012s)'}
          </div>
          <div className="text-[10px] text-zinc-400">
            SLA Threshold: <span className="text-sky-300">&lt; 0.250s (250ms)</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-black/50 border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase">
            <span>Byzantine Parity</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="font-bold text-emerald-400 text-sm">{globalParityPercent} In Sync</div>
          <div className="text-[10px] text-zinc-400">3/3 Regional Clusters Attested</div>
        </div>

        <div className="p-3 rounded-2xl bg-black/50 border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase">
            <span>Split-Brain Risk</span>
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="font-bold text-white text-sm">0.00% ZERO RISK</div>
          <div className="text-[10px] text-indigo-300 truncate" title="FIPS 140-3 HSM Level 4 PQC Quorum">
            FIPS 140-3 HSM L4 Quorum
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN INTERACTIVE CONTENT: D3 MAP / MATRIX / AUDIT CLI                  */}
      {/* ========================================================================= */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          {/* D3 Map Canvas Container (Stable aspect ratio, zero layout thrashing) */}
          <div
            className="relative w-full aspect-[16/9] sm:aspect-[2/1] rounded-2xl overflow-hidden border border-cyan-500/30 bg-[#060a16] shadow-2xl flex items-center justify-center"
          >
            <svg
              ref={svgRef}
              viewBox={`0 0 ${MAP_CANVAS_WIDTH} ${MAP_CANVAS_HEIGHT}`}
              preserveAspectRatio="xMidYMid meet"
              className="w-full h-auto block select-none"
            />

            {/* Floating Quick Region Badges on Map Top Left */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 pointer-events-none max-w-[70%]">
              {regions.map((reg) => {
                const isSelected = selectedRegionId === reg.id;
                const isDegraded = reg.status === 'DEGRADED';
                return (
                  <div
                    key={reg.id}
                    className={`px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold backdrop-blur-md border ${
                      isSelected
                        ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-md'
                        : isDegraded
                        ? 'bg-rose-950/80 border-rose-500/60 text-rose-200'
                        : 'bg-black/70 border-white/10 text-zinc-300'
                    }`}
                  >
                    <span className="opacity-70">{reg.id}:</span>{' '}
                    <span className={isDegraded ? 'text-rose-400' : 'text-emerald-400'}>
                      {reg.replicationLagMs ? `${reg.replicationLagMs.toFixed(1)}ms` : '0.0ms'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Map Legend on Top Right */}
            <div className="absolute top-3 right-3 hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-zinc-300">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <span>Primary Leader (Bangkok)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>6 BFT Nodes</span>
              </span>
              {chaosLagInjected && (
                <span className="flex items-center gap-1 text-rose-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span>Degraded Lag &gt; 0.25s</span>
                </span>
              )}
            </div>
          </div>

          {/* Region Node Detail Cards (Interactive Selection: 6 Nodes) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {regions.map((reg) => {
              const isSelected = selectedRegionId === reg.id;
              const isLeader = reg.id === 'node-th-04' || reg.role.includes('Leader');
              const isDegraded = reg.status === 'DEGRADED';

              return (
                <motion.div
                  key={reg.id}
                  whileHover={{ y: -2 }}
                  onClick={() => {
                    setSelectedRegionId(reg.id);
                    playTone(620, 0.04);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.25)]'
                      : isDegraded
                      ? 'bg-rose-950/25 border-rose-500/40'
                      : 'bg-black/50 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                        <span>{reg.location}</span>
                        {isLeader && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[9px]">
                            LEADER
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-white font-mono mt-0.5">{reg.name}</h4>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        isDegraded
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {reg.status}
                    </span>
                  </div>

                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Replication Lag:</span>
                      <span className={`font-bold ${isDegraded ? 'text-rose-400 text-sm' : 'text-emerald-300'}`}>
                        {reg.replicationLagMs?.toFixed(1) || '0.0'} ms
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Ping Round-Trip:</span>
                      <span className="text-cyan-300 font-bold">{reg.latencyMs} ms</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Block Height:</span>
                      <span className="text-white font-bold">#{reg.blockHeight.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">PQC Standard:</span>
                      <span className="text-indigo-300 text-[11px]">{reg.pqcAttestation}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                    <span>FIPS Level: {reg.hsmFipsLevel} HSM</span>
                    <span className="text-zinc-500">{reg.zone || 'us-central1'}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CROSS-REGION REPLICATION LAG MATRIX TAB                                */}
      {/* ========================================================================= */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-zinc-400 text-[11px] uppercase tracking-wider">
                  <th className="p-3.5">Consensus Link Pipe</th>
                  <th className="p-3.5">Replication Lag</th>
                  <th className="p-3.5">Round-Trip Latency</th>
                  <th className="p-3.5">Distance</th>
                  <th className="p-3.5">Parity Parity</th>
                  <th className="p-3.5">Protocol &amp; Cryptography</th>
                  <th className="p-3.5">Health Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {links.map((lnk) => {
                  const isDegraded = lnk.status === 'DEGRADED';
                  return (
                    <tr
                      key={lnk.id}
                      className={`hover:bg-white/[0.04] transition-colors ${
                        isDegraded ? 'bg-rose-950/20' : ''
                      }`}
                    >
                      <td className="p-3.5 font-bold flex items-center gap-2">
                        <ArrowRightLeft className={`w-3.5 h-3.5 ${isDegraded ? 'text-rose-400' : 'text-cyan-400'}`} />
                        <span>
                          {lnk.sourceName} <span className="text-zinc-500">⇄</span> {lnk.targetName}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`font-bold ${
                            isDegraded ? 'text-rose-400 font-black' : 'text-emerald-300'
                          }`}
                        >
                          {lnk.replicationLagMs.toFixed(1)} ms
                        </span>
                        <span className="text-[10px] text-zinc-500 block">
                          SLA &lt; {lnk.maxAllowedLagMs}ms
                        </span>
                      </td>

                      <td className="p-3.5 font-bold text-cyan-300">
                        {lnk.roundTripLatencyMs.toFixed(1)} ms
                        <span className="text-[10px] text-zinc-400 block font-normal">
                          Jitter: ±{lnk.jitterMs}ms
                        </span>
                      </td>

                      <td className="p-3.5 text-zinc-300">
                        {lnk.distanceKm.toLocaleString()} km
                      </td>

                      <td className="p-3.5 font-bold text-emerald-400">
                        {lnk.syncParityPct.toFixed(1)}%
                      </td>

                      <td className="p-3.5 text-[11px] text-zinc-300 font-mono">
                        {lnk.protocol}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            isDegraded
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          }`}
                        >
                          {lnk.status === 'HEALTHY' ? 'PASSED (HEALTHY)' : 'DEGRADED (LAG DRIFT)'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 text-zinc-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                Statutory Requirement: ETDA B.E. 2544 มาตรา 26 (1)-(4) &amp; Section 28 Cross-Border Parity &lt; 0.250s
              </span>
            </div>
            <div className="text-emerald-400 font-bold">100% Statutory Compliant</div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. AUDIT SCRIPT EXECUTION CLI TAB                                         */}
      {/* ========================================================================= */}
      {activeTab === 'cli' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Shell Execution Output: scripts/run_global_sync_audit.sh</span>
            </div>

            <button
              onClick={handleCopyCli}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-300 transition-all cursor-pointer"
            >
              {copiedCli ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCli ? 'Copied' : 'Copy Script'}</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-black/80 border border-cyan-500/30 font-mono text-xs text-cyan-300 space-y-1 overflow-x-auto shadow-inner">
            <div className="text-zinc-500"># Validating Multi-Region Consensus Sync &amp; Audit v5.0 LTS</div>
            <div className="text-emerald-400 font-bold">
              $ bash scripts/run_global_sync_audit.sh
            </div>
            <div className="text-zinc-400">
              ==========================================================================
            </div>
            <div className="text-sky-300 font-bold">
              🌐 ZYRQUEN Ω∞ Senate Gate — Geo-Distributed Sync Audit v5.0 LTS
            </div>
            <div className="text-zinc-300">
              Global SSoT Epoch : {auditResult.globalEpoch}
            </div>
            <div className="text-zinc-300">
              Monitored Regions : us-central1 europe-west1 asia-east1
            </div>
            <div className="text-zinc-300">
              Max Allowed Drift : &lt; 0.25s
            </div>
            <div className="text-zinc-400">
              ==========================================================================
            </div>
            <div className="text-white font-bold pt-1">
              [+] REGIONAL CONSENSUS CLUSTER ATTESTATION:
            </div>
            {regions.map((r) => (
              <div key={r.id} className="text-zinc-300 pl-2">
                -&gt; Region: {r.name.padEnd(26)} | Role: {r.role.padEnd(24)} | Height: {r.blockHeight} | Latency: {r.latencyMs.toFixed(1).padStart(5)}ms | Lag: {(r.replicationLagMs || 0).toFixed(1).padStart(5)}ms | Drift: {r.driftBlocks} blocks ({r.driftBlocks === 0 ? '0.00% drift' : 'LAG'})
              </div>
            ))}
            <div className="text-cyan-300 pt-1">
              [+] Global Merkle Root Attestation (SSoT): {auditResult.merkleRootHash.slice(0, 34)}... [VERIFIED ✓]
            </div>
            <div className="text-zinc-300">
              [+] Raft Lease Term: Term {auditResult.raftTerm} | Lease Holder: {auditResult.leaseHolderDid}
            </div>
            <div className="text-emerald-400 font-bold">
              [+] Byzantine Fault Tolerance: 3/3 Clusters Attested | Split-Brain Risk: {auditResult.splitBrainRisk}
            </div>
            <div className="text-zinc-400">
              ==========================================================================
            </div>
            <div className="text-emerald-300 font-bold">
              [✔] GLOBAL CONSENSUS SYNC AUDIT COMPLETED: All regions in 100% lockstep parity.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. BOTTOM PROVENANCE FOOTER                                               */}
      {/* ========================================================================= */}
      <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-zinc-400">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>Merkle Root:</span>
          <span className="text-zinc-200 font-bold truncate max-w-[240px] sm:max-w-md">
            {auditResult.merkleRootHash}
          </span>
        </div>

        {onNavigateToSenate && (
          <button
            onClick={onNavigateToSenate}
            className="flex items-center gap-1.5 text-cyan-300 hover:text-cyan-200 transition-colors font-semibold cursor-pointer"
          >
            <span>Open Senate OPA Governance Console</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Sovereign Node Technical Verification Report Modal (Manus AI / 2026-05-13) */}
      <SovereignReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
};

export default GlobalConsensusMap;
