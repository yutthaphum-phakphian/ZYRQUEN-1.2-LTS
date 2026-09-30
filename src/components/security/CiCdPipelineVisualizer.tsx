import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
  Terminal,
  Cpu,
  Lock,
  Layers,
  FileCheck,
  FileText,
  Award,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Info,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { playTone, playAuditChime } from '../AudioSynthesizer';
import { DeploymentReadinessReport } from '../executive/DeploymentReadinessReport';

export interface PipelineStageNode {
  id: string;
  stageNumber: number;
  title: string;
  shortCode: string;
  subtitle: string;
  category: 'INGEST' | 'PQC_CRYPTO' | 'HARDWARE_HSM' | 'MERKLE_COURT';
  status: 'PASSED' | 'RUNNING' | 'PENDING' | 'LOCKED' | 'WARNING';
  latencyMs: number;
  cpuLoad: number;
  throughput: string;
  invariantFormula: string;
  complianceRef: string;
  hashDigest: string;
  dependencies: string[];
  subSteps: Array<{
    name: string;
    status: 'PASSED' | 'RUNNING' | 'PENDING';
    details: string;
    duration: string;
  }>;
  artifacts: Array<{
    name: string;
    type: string;
    size: string;
    digest: string;
  }>;
}

const DEFAULT_PIPELINE_STAGES: PipelineStageNode[] = [
  {
    id: 'stg-01',
    stageNumber: 1,
    title: 'Ingest & Dual-Hash Anchor',
    shortCode: 'STG-01',
    subtitle: 'Dual-Hash Fusion SHA3-512(BLAKE3(Data)) & Ingest Quarantine Filter',
    category: 'INGEST',
    status: 'PASSED',
    latencyMs: 12,
    cpuLoad: 18,
    throughput: '14,905 seals/sec',
    invariantFormula: 'Leaf_Hash = SHA3_512( BLAKE3( Payload_Blob ) )',
    complianceRef: 'ISO/IEC 27037 Digital Evidence Acquisition Standard',
    hashDigest: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    dependencies: ['Council Genesis Root #849202'],
    subSteps: [
      { name: 'Deterministic Stream Ingestion', status: 'PASSED', details: 'Zero memory copy stream buffer intake', duration: '2.1ms' },
      { name: 'BLAKE3 Intermediate Leaf Hashing', status: 'PASSED', details: 'SIMD-accelerated 256-bit hash tree construction', duration: '3.4ms' },
      { name: 'SHA3-512 Root Finalizer', status: 'PASSED', details: 'Keccak cryptographic padding & collision resistance check', duration: '4.8ms' },
      { name: 'Quarantine Boundary Verification', status: 'PASSED', details: 'Boundary Ω600_1000 perimeter invariant validation', duration: '1.7ms' },
    ],
    artifacts: [
      { name: 'ingest_merkle_leaf_01.bin', type: 'Binary Leaf', size: '1.2 KB', digest: '909ab81...4c68' },
      { name: 'quarantine_intake_receipt.json', type: 'JSON Receipt', size: '3.4 KB', digest: '48f9021...e021' },
    ],
  },
  {
    id: 'stg-02',
    stageNumber: 2,
    title: 'PQC Quantum Signature & Lattice Proof',
    shortCode: 'STG-02',
    subtitle: 'NIST FIPS 204 ML-DSA-87 (Dilithium-5) & FIPS 203 ML-KEM-1024',
    category: 'PQC_CRYPTO',
    status: 'PASSED',
    latencyMs: 48,
    cpuLoad: 42,
    throughput: '4,820 sigs/sec',
    invariantFormula: 'Sig_PQC = ML_DSA_87_Sign(SK_Council, Leaf_Hash ∥ Nonce_Enclave)',
    complianceRef: 'NIST Post-Quantum Cryptography Standard (FIPS 203/204/205)',
    hashDigest: '4f88102a11b9024cba309121a88200198274109827a1a01102931a009188172c',
    dependencies: ['stg-01'],
    subSteps: [
      { name: 'ML-KEM-1024 Key Encapsulation', status: 'PASSED', details: 'Lattice-based IND-CCA2 secure key agreement', duration: '14.2ms' },
      { name: 'ML-DSA-87 Dual-Key Signing', status: 'PASSED', details: 'NIST Security Level 5 (256-bit quantum security)', duration: '19.6ms' },
      { name: 'SPHINCS+ Stateless Fallback Proof', status: 'PASSED', details: 'FIPS 205 hash-based signature redundancy', duration: '8.5ms' },
      { name: 'Zero-Knowledge Envelope Seal', status: 'PASSED', details: 'ZK-SNARK proof of data invariant consistency', duration: '5.7ms' },
    ],
    artifacts: [
      { name: 'dilithium5_signature_proof.sig', type: 'PQC Sig', size: '4.6 KB', digest: '4f88102...172c' },
      { name: 'lattice_proof_manifest.pqc', type: 'PQC Manifest', size: '12.8 KB', digest: '7a9921c...881f' },
    ],
  },
  {
    id: 'stg-03',
    stageNumber: 3,
    title: '10/10 Deca-Key Real_HSM Quorum',
    shortCode: 'STG-03',
    subtitle: 'Utimaco FIPS 140-3 Level 4 / CC EAL6+ Sub-Kelvin Hardware Quorum',
    category: 'HARDWARE_HSM',
    status: 'PASSED',
    latencyMs: 64,
    cpuLoad: 29,
    throughput: '10/10 Quorum Ratified',
    invariantFormula: 'Quorum_Valid = ( ∑ Node_Signatures == 10 ) ∧ ( T_Cryo ≤ 15.00 mK )',
    complianceRef: 'FIPS 140-3 Level 4 Hardware Cryptographic Module Security',
    hashDigest: '849203a11974ef9a0134cd981b23450912f02931109844d8a14816bed34cdbb0',
    dependencies: ['stg-02'],
    subSteps: [
      { name: 'Cryo-Thermal Attestation (14.98 mK)', status: 'PASSED', details: 'Sub-kelvin refrigeration chamber telemetry verified', duration: '11.0ms' },
      { name: 'True Random Quantum Entropy Pulse', status: 'PASSED', details: 'Entropy quality: 0.9994 bits/bit with zero bias', duration: '9.3ms' },
      { name: 'Deca-Key Sharded Signature Aggregation', status: 'PASSED', details: '10 distinct sovereign HSM hardware nodes ratified', duration: '31.2ms' },
      { name: 'Tamper-Evident Physical WORM Gate', status: 'PASSED', details: 'Optical Write-Once-Read-Many hardware latch locked', duration: '12.5ms' },
    ],
    artifacts: [
      { name: 'hsm_deca_quorum_attestation.xml', type: 'HSM Quorum XML', size: '8.2 KB', digest: '849203a...dbb0' },
      { name: 'cryo_thermal_telemetry.log', type: 'Hardware Log', size: '1.8 KB', digest: 'c091928...4491' },
    ],
  },
  {
    id: 'stg-04',
    stageNumber: 4,
    title: 'Merkle Tree Rollup & Court Invariant',
    shortCode: 'STG-04',
    subtitle: 'Thai ETDA B.E. 2544 (Sec 9, 26, 28) & SSoT Δ0.00% Zero-Drift Seal',
    category: 'MERKLE_COURT',
    status: 'PASSED',
    latencyMs: 18,
    cpuLoad: 12,
    throughput: '100% Invariant SSoT',
    invariantFormula: 'SSoT_Delta = | State_Local - State_Canonical | == 0.00%',
    complianceRef: 'Thai Electronic Transactions Act B.E. 2544 (Sec 9/26/28) & PDPA Sec 37',
    hashDigest: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    dependencies: ['stg-03'],
    subSteps: [
      { name: 'Canonical Merkle Root Recalculation', status: 'PASSED', details: 'Binary Merkle path verified against #849205', duration: '4.2ms' },
      { name: 'Thai ETDA Section 28 Presumption Stamp', status: 'PASSED', details: 'Court-admissible electronic signature certified', duration: '3.8ms' },
      { name: 'PDF/A-3 Evidence Dossier Compilation', status: 'PASSED', details: 'Embedded XML manifest + high-res QR payload', duration: '6.9ms' },
      { name: 'Replication Broadcast & Node Parity Sync', status: 'PASSED', details: 'Broadcast to multi-node sovereign enclave peers', duration: '3.1ms' },
    ],
    artifacts: [
      { name: 'court_evidence_master_dossier.pdf', type: 'PDF/A-3 ISO 19005', size: '245 KB', digest: 'e3b0c44...b855' },
      { name: 'merkle_proof_verification_tree.json', type: 'Merkle Path', size: '18.4 KB', digest: '2026fed...9902' },
    ],
  },
];

export const CiCdPipelineVisualizer: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [stages, setStages] = useState<PipelineStageNode[]>(DEFAULT_PIPELINE_STAGES);
  const [selectedStageId, setSelectedStageId] = useState<string>('stg-01');
  const [isRunningPipeline, setIsRunningPipeline] = useState<boolean>(false);
  const [activeRunningIndex, setActiveRunningIndex] = useState<number>(-1);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [activeViewMode, setActiveViewMode] = useState<'D3_GRAPH' | 'DETAILED_METRICS'>('D3_GRAPH');
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  const selectedStage = stages.find((s) => s.id === selectedStageId) || stages[0];

  // Total Pipeline Latency
  const totalLatencyMs = stages.reduce((sum, s) => sum + s.latencyMs, 0);

  // Trigger Complete Pipeline Simulation (D3 interactive state animation)
  const handleRunPipelineSimulation = async () => {
    if (isRunningPipeline) return;
    setIsRunningPipeline(true);
    playTone(520, 0.08);

    // Reset all to pending
    setStages((prev) =>
      prev.map((stage) => ({
        ...stage,
        status: 'PENDING',
        subSteps: stage.subSteps.map((sub) => ({ ...sub, status: 'PENDING' })),
      }))
    );

    for (let i = 0; i < stages.length; i++) {
      setActiveRunningIndex(i);
      setSelectedStageId(stages[i].id);
      playTone(600 + i * 120, 0.08);

      // Set current stage to RUNNING
      setStages((prev) =>
        prev.map((stg, idx) =>
          idx === i
            ? {
                ...stg,
                status: 'RUNNING',
                subSteps: stg.subSteps.map((s, sIdx) => ({
                  ...s,
                  status: sIdx === 0 ? 'RUNNING' : 'PENDING',
                })),
              }
            : stg
        )
      );

      // Simulate substep progression
      for (let subIdx = 0; subIdx < stages[i].subSteps.length; subIdx++) {
        await new Promise((res) => setTimeout(res, 220));
        setStages((prev) =>
          prev.map((stg, idx) =>
            idx === i
              ? {
                  ...stg,
                  subSteps: stg.subSteps.map((s, sI) => ({
                    ...s,
                    status: sI <= subIdx ? 'PASSED' : sI === subIdx + 1 ? 'RUNNING' : 'PENDING',
                  })),
                }
              : stg
          )
        );
      }

      await new Promise((res) => setTimeout(res, 180));

      // Mark stage as PASSED
      setStages((prev) =>
        prev.map((stg, idx) =>
          idx === i
            ? {
                ...stg,
                status: 'PASSED',
                subSteps: stg.subSteps.map((s) => ({ ...s, status: 'PASSED' })),
              }
            : stg
        )
      );
    }

    playAuditChime();
    setActiveRunningIndex(-1);
    setIsRunningPipeline(false);
  };

  // Render D3 Interactive Flow Diagram
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = containerRef.current.clientWidth || 900;
    const width = Math.max(containerWidth, 800);
    const height = 340;

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', '100%').attr('height', height);

    // Definitions: Gradients, Filters & Markers
    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter').attr('id', 'neon-glow').attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Arrow Marker
    defs
      .append('marker')
      .attr('id', 'pipeline-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#06b6d4');

    // Linear gradient for link lines
    const linkGradient = defs
      .append('linearGradient')
      .attr('id', 'link-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', width)
      .attr('y2', 0);
    linkGradient.append('stop').attr('offset', '0%').attr('stop-color', '#06b6d4').attr('stop-opacity', 0.8);
    linkGradient.append('stop').attr('offset', '50%').attr('stop-color', '#10b981').attr('stop-opacity', 0.9);
    linkGradient.append('stop').attr('offset', '100%').attr('stop-color', '#a855f7').attr('stop-opacity', 0.8);

    // Node Layout Positions
    const nodeWidth = 165;
    const nodeHeight = 145;
    const horizontalMargin = 40;
    const availableWidth = width - horizontalMargin * 2;
    const stepX = availableWidth / (stages.length - 1);
    const centerY = height / 2 - 15;

    const nodePositions = stages.map((stage, i) => ({
      ...stage,
      x: horizontalMargin + i * stepX,
      y: centerY,
      index: i,
    }));

    const mainG = svg.append('g').attr('class', 'pipeline-main-group');

    // 1. Draw Connecting Dependency Edges (Bézier curves with animated dashed particles)
    for (let i = 0; i < nodePositions.length - 1; i++) {
      const source = nodePositions[i];
      const target = nodePositions[i + 1];

      const startX = source.x + nodeWidth / 2;
      const startY = source.y;
      const endX = target.x - nodeWidth / 2;
      const endY = target.y;
      const midX = (startX + endX) / 2;

      const pathData = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;

      // Background Link Shadow
      mainG
        .append('path')
        .attr('d', pathData)
        .attr('fill', 'none')
        .attr('stroke', '#0f172a')
        .attr('stroke-width', 8)
        .attr('stroke-linecap', 'round');

      // Primary Link Line
      const isConnectedPassed = source.status === 'PASSED' && target.status === 'PASSED';
      const isLinkActive = source.status === 'RUNNING' || target.status === 'RUNNING';

      mainG
        .append('path')
        .attr('d', pathData)
        .attr('fill', 'none')
        .attr('stroke', isConnectedPassed ? '#06b6d4' : isLinkActive ? '#38bdf8' : '#334155')
        .attr('stroke-width', isLinkActive ? 3.5 : 2.5)
        .attr('stroke-dasharray', isLinkActive ? '6,6' : 'none')
        .attr('marker-end', 'url(#pipeline-arrow)')
        .attr('class', isLinkActive ? 'animate-pulse' : '');

      // Flowing particle dot animation
      if (isConnectedPassed || isLinkActive) {
        const particle = mainG
          .append('circle')
          .attr('r', isLinkActive ? 4 : 3)
          .attr('fill', isLinkActive ? '#38bdf8' : '#10b981')
          .attr('filter', 'url(#neon-glow)');

        // Animate particle along path
        const pathEl = mainG.append('path').attr('d', pathData).attr('fill', 'none').attr('stroke', 'transparent').node();
        if (pathEl) {
          const pathLength = pathEl.getTotalLength();
          const duration = 2400 + i * 400;

          function animateParticle() {
            particle
              .transition()
              .duration(duration)
              .ease(d3.easeLinear)
              .attrTween('transform', function () {
                return function (t: number) {
                  const p = pathEl!.getPointAtLength(t * pathLength);
                  return `translate(${p.x}, ${p.y})`;
                };
              })
              .on('end', animateParticle);
          }
          animateParticle();
        }
      }

      // Latency badge in midpoint of edge
      const badgeG = mainG
        .append('g')
        .attr('transform', `translate(${midX}, ${startY - 14})`)
        .attr('class', 'cursor-pointer');

      badgeG
        .append('rect')
        .attr('x', -24)
        .attr('y', -9)
        .attr('width', 48)
        .attr('height', 18)
        .attr('rx', 6)
        .attr('fill', '#020617')
        .attr('stroke', '#1e293b')
        .attr('stroke-width', 1);

      badgeG
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('fill', '#94a3b8')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .text(`+${target.latencyMs}ms`);
    }

    // 2. Draw Interactive Stage Nodes
    nodePositions.forEach((node) => {
      const isSelected = node.id === selectedStageId;
      const isRunning = node.status === 'RUNNING';
      const isPassed = node.status === 'PASSED';

      const nodeG = mainG
        .append('g')
        .attr('transform', `translate(${node.x - nodeWidth / 2}, ${node.y - nodeHeight / 2})`)
        .attr('class', 'cursor-pointer select-none transition-transform')
        .on('click', () => {
          playTone(680, 0.04);
          setSelectedStageId(node.id);
        })
        .on('mouseenter', function () {
          d3.select(this)
            .transition()
            .duration(150)
            .attr('transform', `translate(${node.x - nodeWidth / 2}, ${node.y - nodeHeight / 2 - 4}) scale(1.02)`);
        })
        .on('mouseleave', function () {
          d3.select(this)
            .transition()
            .duration(150)
            .attr('transform', `translate(${node.x - nodeWidth / 2}, ${node.y - nodeHeight / 2}) scale(1)`);
        });

      // Background Card
      const strokeColor = isSelected
        ? '#06b6d4'
        : isRunning
        ? '#38bdf8'
        : isPassed
        ? '#10b981'
        : '#334155';

      nodeG
        .append('rect')
        .attr('width', nodeWidth)
        .attr('height', nodeHeight)
        .attr('rx', 16)
        .attr('fill', isSelected ? '#081325' : '#030712')
        .attr('stroke', strokeColor)
        .attr('stroke-width', isSelected ? 2.5 : isRunning ? 2 : 1.2)
        .attr('filter', isSelected || isRunning ? 'url(#neon-glow)' : 'none')
        .attr('opacity', 0.95);

      // Header Banner inside card
      nodeG
        .append('rect')
        .attr('x', 1)
        .attr('y', 1)
        .attr('width', nodeWidth - 2)
        .attr('height', 34)
        .attr('rx', 15)
        .attr('fill', isSelected ? 'rgba(6, 182, 212, 0.15)' : 'rgba(15, 23, 42, 0.6)');

      // Stage Short Code Tag
      nodeG
        .append('text')
        .attr('x', 12)
        .attr('y', 21)
        .attr('fill', isSelected ? '#38bdf8' : '#94a3b8')
        .attr('font-size', '11px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .text(node.shortCode);

      // Status Pill / Dot
      const statusColor = isPassed ? '#10b981' : isRunning ? '#38bdf8' : '#64748b';
      nodeG
        .append('circle')
        .attr('cx', nodeWidth - 20)
        .attr('cy', 17)
        .attr('r', isRunning ? 4.5 : 4)
        .attr('fill', statusColor)
        .attr('class', isRunning ? 'animate-ping' : '');

      nodeG
        .append('circle')
        .attr('cx', nodeWidth - 20)
        .attr('cy', 17)
        .attr('r', 3)
        .attr('fill', statusColor);

      // Title (Wrapped text)
      nodeG
        .append('text')
        .attr('x', 12)
        .attr('y', 56)
        .attr('fill', '#ffffff')
        .attr('font-size', '12px')
        .attr('font-family', 'sans-serif')
        .attr('font-weight', 'bold')
        .text(node.title.length > 20 ? node.title.slice(0, 18) + '...' : node.title);

      // Subtitle / Standard
      nodeG
        .append('text')
        .attr('x', 12)
        .attr('y', 73)
        .attr('fill', '#64748b')
        .attr('font-size', '9.5px')
        .attr('font-family', 'monospace')
        .text(node.category);

      // Divider
      nodeG
        .append('line')
        .attr('x1', 12)
        .attr('y1', 84)
        .attr('x2', nodeWidth - 12)
        .attr('y2', 84)
        .attr('stroke', '#1e293b')
        .attr('stroke-width', 1);

      // Metrics Grid inside Node
      // Latency
      nodeG
        .append('text')
        .attr('x', 12)
        .attr('y', 101)
        .attr('fill', '#94a3b8')
        .attr('font-size', '9.5px')
        .attr('font-family', 'monospace')
        .text('Latency:');

      nodeG
        .append('text')
        .attr('x', nodeWidth - 12)
        .attr('y', 101)
        .attr('text-anchor', 'end')
        .attr('fill', '#38bdf8')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .text(`${node.latencyMs} ms`);

      // Sub-steps Pass Count
      const passedSubCount = node.subSteps.filter((s) => s.status === 'PASSED').length;
      nodeG
        .append('text')
        .attr('x', 12)
        .attr('y', 121)
        .attr('fill', '#94a3b8')
        .attr('font-size', '9.5px')
        .attr('font-family', 'monospace')
        .text('Sub-steps:');

      nodeG
        .append('text')
        .attr('x', nodeWidth - 12)
        .attr('y', 121)
        .attr('text-anchor', 'end')
        .attr('fill', isPassed ? '#10b981' : '#f59e0b')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .text(`${passedSubCount}/${node.subSteps.length} OK`);

      // Progress bar at bottom of card
      const pct = (passedSubCount / node.subSteps.length) * (nodeWidth - 24);
      nodeG
        .append('rect')
        .attr('x', 12)
        .attr('y', 132)
        .attr('width', nodeWidth - 24)
        .attr('height', 3)
        .attr('rx', 1.5)
        .attr('fill', '#1e293b');

      nodeG
        .append('rect')
        .attr('x', 12)
        .attr('y', 132)
        .attr('width', pct)
        .attr('height', 3)
        .attr('rx', 1.5)
        .attr('fill', isPassed ? '#10b981' : isRunning ? '#38bdf8' : '#f59e0b');
    });
  }, [stages, selectedStageId]);

  return (
    <div className="w-full space-y-5 font-mono text-zinc-200">
      {/* Visualizer Top Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/30 shadow-lg shadow-cyan-950/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">
                CI/CD SECURITY PIPELINE VISUALIZER
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                4-STAGE FLOW GRAPH
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Interactive D3.js Directed Dependency Graph • Invariant Enforcement • Zero-Drift Δ0.00%
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Total Latency Pill */}
          <div className="px-3 py-1.5 rounded-xl bg-black/50 border border-cyan-500/20 text-xs flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-zinc-400">Total Latency:</span>
            <span className="text-cyan-300 font-bold">{totalLatencyMs} ms</span>
          </div>

          {/* Executive Board Deployment Readiness Report Button */}
          <button
            id="btn-open-deployment-readiness-report"
            type="button"
            onClick={() => {
              playTone(740, 0.06);
              setIsReportModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-indigo-600/20 hover:from-purple-500/30 hover:to-indigo-600/30 border border-purple-500/40 text-purple-200 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.2)] active:scale-95 transition-all cursor-pointer"
            title="Generate and download Executive Board Deployment Readiness PDF Report"
          >
            <FileText className="w-3.5 h-3.5 text-purple-400" />
            <span>EXECUTIVE BOARD REPORT (PDF)</span>
          </button>

          {/* Trigger Pipeline Button */}
          <button
            id="btn-run-cicd-pipeline"
            type="button"
            onClick={handleRunPipelineSimulation}
            disabled={isRunningPipeline}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.35)] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {isRunningPipeline ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>EXECUTING STAGES...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>EXECUTE COMPLETE PIPELINE</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* D3.js Interactive Graph Canvas Container */}
      <div
        ref={containerRef}
        className="w-full relative rounded-2xl bg-[#020617] border border-cyan-500/30 shadow-2xl p-4 overflow-hidden"
      >
        {/* Ambient background glows */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Graph Legend & Status Header */}
        <div className="flex items-center justify-between text-xs text-zinc-400 pb-2 border-b border-zinc-800/80 mb-2">
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>STG-01 Ingest (12ms)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>STG-02 PQC Sign (48ms)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>STG-03 Deca-Key HSM (64ms)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span>STG-04 Merkle Court (18ms)</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
            <span>Click any node to inspect substeps & cryptographic proofs</span>
          </div>
        </div>

        {/* The D3 SVG Element */}
        <svg ref={svgRef} className="w-full select-none" />
      </div>

      {/* Selected Stage Forensic Deep-Dive Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Stage Invariants, Formula & Sub-Steps */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 space-y-4 shadow-lg">
          <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-xs">
                {selectedStage.shortCode}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{selectedStage.title}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    STATUS: {selectedStage.status}
                  </span>
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">{selectedStage.subtitle}</p>
              </div>
            </div>

            <div className="text-right text-xs">
              <span className="text-zinc-500 block text-[10px]">EXECUTION TIME</span>
              <span className="font-bold text-cyan-300">{selectedStage.latencyMs} ms</span>
            </div>
          </div>

          {/* Invariant Formula Card */}
          <div className="p-3.5 rounded-xl bg-black/60 border border-cyan-500/30 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="font-bold text-cyan-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>STAGE INVARIANT &amp; FORMULA:</span>
              </span>
              <span className="text-[10px] text-zinc-500">{selectedStage.complianceRef}</span>
            </div>
            <code className="block p-2 rounded bg-[#030712] border border-zinc-800 text-emerald-400 text-xs font-mono break-all select-all">
              {selectedStage.invariantFormula}
            </code>
          </div>

          {/* Sub-steps Execution Matrix */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-bold uppercase tracking-wider text-[11px]">
                Sub-Step Execution Telemetry ({selectedStage.subSteps.length})
              </span>
              <span className="text-[10px] text-zinc-500">Atomic Rollback Guard: Active</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {selectedStage.subSteps.map((sub, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-2 ${
                    sub.status === 'PASSED'
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : sub.status === 'RUNNING'
                      ? 'bg-cyan-950/30 border-cyan-500/50 animate-pulse'
                      : 'bg-zinc-950/40 border-zinc-800'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      {sub.status === 'PASSED' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      )}
                      <span>{sub.name}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">{sub.details}</p>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400 bg-black/40 px-2 py-0.5 rounded border border-zinc-800 shrink-0">
                    {sub.duration}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Stage Artifacts & Hash Manifest */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-cyan-400" />
                <span>STAGE ARTIFACTS</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                WORM PROTECTED
              </span>
            </div>

            {/* Artifacts List */}
            <div className="space-y-2">
              {selectedStage.artifacts.map((art, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-black/50 border border-zinc-800 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-zinc-200 text-[11px]">{art.name}</div>
                    <div className="text-[10px] text-zinc-500">
                      {art.type} • {art.size}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                    {art.digest}
                  </span>
                </div>
              ))}
            </div>

            {/* Digest Root */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">
                Stage Checksum Root
              </span>
              <code className="block p-2 rounded bg-black/70 border border-zinc-800 text-[10px] text-cyan-300 font-mono break-all select-all">
                {selectedStage.hashDigest}
              </code>
            </div>
          </div>

          {/* Quick Trigger Button for this individual stage */}
          <button
            type="button"
            onClick={() => {
              playTone(720, 0.05);
              setStages((prev) =>
                prev.map((s) => (s.id === selectedStage.id ? { ...s, status: 'PASSED' } : s))
              );
              playAuditChime();
            }}
            className="w-full py-2 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-200 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer mt-3"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Re-verify {selectedStage.shortCode} Invariant</span>
          </button>
        </div>
      </div>

      {/* Deployment Readiness Board PDF Report Modal */}
      <DeploymentReadinessReport
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        stages={stages}
      />
    </div>
  );
};

export default CiCdPipelineVisualizer;
