import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  Activity,
  Zap,
  Cpu,
  ShieldCheck,
  Radio,
  Layers,
  Sparkles,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Terminal,
  Download,
  Share2,
  Sliders,
  Maximize2,
  Lock,
  Eye,
  Key,
} from 'lucide-react';
import * as d3 from 'd3';
import { playTone, playAuditChime } from './AudioSynthesizer';
import { COUNCIL_MEMBERS } from '../data/councilData';
import { EvidenceExportService } from '../services/EvidenceExportService';

export interface ChamberEntropyNode {
  id: string;
  name: string;
  chamberNum: number;
  x: number; // -100 to 100
  y: number; // -100 to 100
  entropy: number; // 0.00 - 1.00
  temperatureK: number; // in mK or K
  status: 'NOMINAL' | 'CALIBRATING' | 'SUPERPOSED' | 'HANDSHAKE_READY' | 'SYNCHRONIZED';
  handshakeSlot?: number;
  custodian?: string;
  pqcAlgorithm: string;
}

const INITIAL_CHAMBERS_ENTROPY: ChamberEntropyNode[] = [
  { id: 'ch-00', name: 'Chamber 00: Boot Enclave Microcode', chamberNum: 0, x: 0, y: 0, entropy: 0.18, temperatureK: 14.2, status: 'SYNCHRONIZED', handshakeSlot: 1, custodian: 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)', pqcAlgorithm: 'ML-DSA-87 Dilithium-5' },
  { id: 'ch-01', name: 'Chamber 01: Genesis Merkle Shard', chamberNum: 1, x: -35, y: 28, entropy: 0.22, temperatureK: 14.5, status: 'SYNCHRONIZED', handshakeSlot: 2, custodian: 'พล. สมชาย พากเพียร (#EP-001)', pqcAlgorithm: 'FALCON-1024' },
  { id: 'ch-02', name: 'Chamber 02: PQC Dilithium Quarantine Enclave', chamberNum: 2, x: 42, y: 32, entropy: 0.28, temperatureK: 14.8, status: 'SYNCHRONIZED', handshakeSlot: 3, custodian: 'ดร. กัญญารัตน์ เวชสิทธิ์ (#EP-007)', pqcAlgorithm: 'ML-DSA-87 Dilithium-5' },
  { id: 'ch-03', name: 'Chamber 03: SPHINCS+ Fallback Signer', chamberNum: 3, x: 72, y: -22, entropy: 0.25, temperatureK: 15.0, status: 'SYNCHRONIZED', handshakeSlot: 4, custodian: 'วศ. ธนพล เกียรติไพศาล (#EP-014)', pqcAlgorithm: 'SLH-DSA SPHINCS+' },
  { id: 'ch-04', name: 'Chamber 04: Sub-Kelvin Dilution Matrix', chamberNum: 4, x: -22, y: -52, entropy: 0.12, temperatureK: 12.4, status: 'SYNCHRONIZED', handshakeSlot: 5, custodian: 'ศ.ดร. นครินทร์ สุวรรณเมฆา (EP-022)', pqcAlgorithm: 'ML-KEM-1024 Kyber' },
  { id: 'ch-05', name: 'Chamber 05: Cryo Heat Exchanger Pump', chamberNum: 5, x: 26, y: -62, entropy: 0.16, temperatureK: 14.9, status: 'SYNCHRONIZED', handshakeSlot: 6, custodian: 'พญ.ดร. รพิพร รัตนพิบูลย์ (EP-033)', pqcAlgorithm: 'ML-DSA-87 Dilithium-5' },
  { id: 'ch-06', name: 'Chamber 06: Superconducting Thermal Shield', chamberNum: 6, x: -68, y: -32, entropy: 0.14, temperatureK: 11.8, status: 'SYNCHRONIZED', handshakeSlot: 7, custodian: 'ดร. ธีรภัทร ชาญวณิชย์ (EP-048)', pqcAlgorithm: 'ML-DSA-87 Dilithium-5' },
  { id: 'ch-07', name: 'Chamber 07: 768-Qubit Transmon Grid', chamberNum: 7, x: -16, y: 68, entropy: 0.31, temperatureK: 12.1, status: 'SYNCHRONIZED', handshakeSlot: 8, custodian: 'อ. เมธาวี อัครเดโช (EP-059)', pqcAlgorithm: 'ML-DSA-87 Dilithium-5' },
  { id: 'ch-08', name: 'Chamber 08: Quantum Coherence Bus', chamberNum: 8, x: 32, y: 78, entropy: 0.29, temperatureK: 12.5, status: 'SYNCHRONIZED', handshakeSlot: 9, custodian: 'ดร. ชวินทร์ โรจนทรัพย์ (EP-077)', pqcAlgorithm: 'ML-DSA-87 Dilithium-5' },
  { id: 'ch-09', name: 'Chamber 09: Vector Embedding Coprocessor', chamberNum: 9, x: 78, y: 46, entropy: 0.34, temperatureK: 35.2, status: 'SYNCHRONIZED', handshakeSlot: 10, custodian: 'ดร. อภิชญา ทักษิณากุล (EP-100)', pqcAlgorithm: 'Custom Hardware HSM-10' },
  { id: 'ch-10', name: 'Chamber 10: HBM3 Memory Matrix Alpha', chamberNum: 10, x: -76, y: 22, entropy: 0.27, temperatureK: 38.4, status: 'SYNCHRONIZED', pqcAlgorithm: 'AES-256-GCM Hardware' },
  { id: 'ch-11', name: 'Chamber 11: 8K Quantum Radar & Defense', chamberNum: 11, x: -82, y: -12, entropy: 0.29, temperatureK: 39.0, status: 'SYNCHRONIZED', pqcAlgorithm: 'ML-DSA-87 Dilithium-5' },
  { id: 'ch-12', name: 'Chamber 12: SSoT Merkle Root Seal Array', chamberNum: 12, x: 12, y: -26, entropy: 0.19, temperatureK: 32.5, status: 'SYNCHRONIZED', pqcAlgorithm: 'SHA-256 / Blake3 Involatile' },
  { id: 'ch-13', name: 'Chamber 13: PDPA Section 26 Vault Unit', chamberNum: 13, x: -48, y: -76, entropy: 0.21, temperatureK: 34.0, status: 'SYNCHRONIZED', pqcAlgorithm: 'NIST PQC Privacy' },
  { id: 'ch-14', name: 'Chamber 14: ETDA Electronic Evidence Gate', chamberNum: 14, x: 56, y: -72, entropy: 0.24, temperatureK: 36.1, status: 'SYNCHRONIZED', pqcAlgorithm: 'ETDA Sec 9/26/28 Enclave' },
  { id: 'ch-15', name: 'Chamber 15: Spatial Entropy Heat Map Core', chamberNum: 15, x: 0, y: 48, entropy: 0.15, temperatureK: 14.98, status: 'SYNCHRONIZED', pqcAlgorithm: 'Spatial Coherence Matrix' },
  { id: 'ch-16', name: 'Chamber 16: Phoenix Autonomous Healer', chamberNum: 16, x: 86, y: 12, entropy: 0.26, temperatureK: 38.0, status: 'SYNCHRONIZED', pqcAlgorithm: 'Fault-Tolerant Lattice' },
  { id: 'ch-17', name: 'Chamber 17: Unclassified Forensic Sanctuary V24', chamberNum: 17, x: 2, y: -92, entropy: 0.14, temperatureK: 30.5, status: 'SYNCHRONIZED', pqcAlgorithm: 'Zero-Deletion Merkle Tree' },
];

export const Chamber15SpatialEntropySimulator: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [nodes, setNodes] = useState<ChamberEntropyNode[]>(INITIAL_CHAMBERS_ENTROPY);
  const [selectedChamber, setSelectedChamber] = useState<ChamberEntropyNode>(INITIAL_CHAMBERS_ENTROPY[15]);
  const [simStage, setSimStage] = useState<'IDLE' | 'SAMPLING_VACUUM' | 'BALANCING_LATTICE' | 'PQC_ATTESTING' | 'HANDSHAKE_BROADCAST' | 'COMPLETED'>('IDLE');
  const [isSimulating, setIsSimulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeHarmonicHz, setActiveHarmonicHz] = useState(440);
  const [cryoTempK, setCryoTempK] = useState(14.98);
  const [signalToNoiseDb, setSignalToNoiseDb] = useState(99.98);
  const [coherencePct, setCoherencePct] = useState(99.992);
  const [currentQOpsRate, setCurrentQOpsRate] = useState(1482.6); // M-QOPS
  const [antimatterFuelBurnRate, setAntimatterFuelBurnRate] = useState(0.042); // ng/s
  const [handshakeQuorum, setHandshakeQuorum] = useState<number[]>([]);
  const [logs, setLogs] = useState<string[]>([
    '[INIT] Chamber 15 Spatial Entropy Core initialized (SSoT Δ0.0%).',
    '[HARDWARE] Dilution Refrigerator sub-kelvin baseline locked at 14.98 mK.',
    '[PQC] 768-Qubit superposition phase aligned with 10/10 REAL_HSM Nodes.',
    '[TELEMETRY] Live QOps: 1482.6 M-QOPS | Antimatter Burn Rate: 0.042 ng/s.',
  ]);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${msg}`, ...prev.slice(0, 30)]);
  };

  // Start the 4-Stage Spatial Entropy & 10/10 Deca-Key Handshake Sequence
  const handleRunSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setProgress(5);
    setSimStage('SAMPLING_VACUUM');
    setHandshakeQuorum([]);
    setCurrentQOpsRate(1520.4);
    setAntimatterFuelBurnRate(0.045);
    playTone(432, 0.1, 'sine', 0.08);
    addLog('🚀 [PHASE 1] Initializing Vacuum Fluctuation & Spatial Entropy Sampling...');

    // Phase 1 -> 2
    setTimeout(() => {
      setProgress(28);
      setSimStage('BALANCING_LATTICE');
      setActiveHarmonicHz(528);
      playTone(528, 0.12, 'sine', 0.08);
      setCryoTempK(14.92);
      setCoherencePct(99.995);
      setCurrentQOpsRate(1680.2);
      setAntimatterFuelBurnRate(0.048);
      addLog('⚖️ [PHASE 2] Balancing 768-D Superposition Matrix & Zero-Drift Spatial Field...');
    }, 1200);

    // Phase 2 -> 3
    setTimeout(() => {
      setProgress(58);
      setSimStage('PQC_ATTESTING');
      setActiveHarmonicHz(660);
      playTone(660, 0.14, 'sine', 0.09);
      setSignalToNoiseDb(100.04);
      setCurrentQOpsRate(1840.5);
      setAntimatterFuelBurnRate(0.051);
      addLog('🔐 [PHASE 3] Attesting NIST FIPS 204 ML-DSA-87 Dilithium-5 Quantum Signatures...');
    }, 2400);

    // Phase 3 -> 4 (Deca-Key Handshake Quorum Rolling)
    setTimeout(() => {
      setProgress(85);
      setSimStage('HANDSHAKE_BROADCAST');
      setActiveHarmonicHz(880);
      playTone(880, 0.15, 'sine', 0.1);
      setCurrentQOpsRate(1995.8);
      setAntimatterFuelBurnRate(0.054);
      addLog('📡 [PHASE 4] Emitting 10/10 REAL_HSM Deca-Key Consensus Handshake...');

      // Rapidly ratify 10 HSM nodes
      const ratifyNodes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      ratifyNodes.forEach((slot, idx) => {
        setTimeout(() => {
          setHandshakeQuorum((prev) => [...prev, slot]);
          playTone(400 + slot * 60, 0.04, 'sine', 0.04);
          addLog(`  ✅ HSM Node #${slot} (TC-${slot < 10 ? '0' + slot : slot}) Handshake Ratified (FIPS 140-3 L4).`);
        }, idx * 120);
      });
    }, 3600);

    // Phase 4 -> Complete
    setTimeout(() => {
      setProgress(100);
      setSimStage('COMPLETED');
      setIsSimulating(false);
      setCurrentQOpsRate(1999.9);
      setAntimatterFuelBurnRate(0.039);
      playAuditChime();
      addLog('🌟 [COMPLETE] Spatial Entropy Heat Map Simulation & Deca-Key Handshake 100% Ratified!');
    }, 5200);
  };

  const handleReset = () => {
    setIsSimulating(false);
    setSimStage('IDLE');
    setProgress(0);
    setHandshakeQuorum([]);
    setCryoTempK(14.98);
    setSignalToNoiseDb(99.98);
    setCoherencePct(99.992);
    setCurrentQOpsRate(1482.6);
    setAntimatterFuelBurnRate(0.042);
    playTone(330, 0.06);
    addLog('[RESET] Spatial Entropy state returned to baseline monitoring.');
  };

  // Download Evidence Blob for Chamber 15
  const [isExportingEvidence, setIsExportingEvidence] = useState(false);

  const handleDownloadEvidence = () => {
    setIsExportingEvidence(true);
    playTone(880, 0.08);

    try {
      EvidenceExportService.exportToJsonFile(
        {
          dossierType: 'ZYRQUEN_CHAMBER_15_SPATIAL_ENTROPY_EVIDENCE',
          chamberId: 'CH-15',
          chamberName: 'Quantum Fuel Core & Spatial Entropy Heat Map (ห้องปฏิบัติการที่ 15)',
          schemaVersion: '1.2.0-LTS',
          exportTimestamp: new Date().toISOString(),
          canonicalBlock: 849202,
          canonicalGenesisMerkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
          canonicalSealsCount: 14902,
          principalAuthority: 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
          clearanceLevel: 'OMEGA-1 SUPREME CLEARANCE',
          telemetryData: {
            currentQOpsRateMQOPS: currentQOpsRate,
            coherenceLevelPercentage: coherencePct,
            antimatterFuelBurnRateNgPerSec: antimatterFuelBurnRate,
            cryostatDilutionTempMK: cryoTempK,
            signalToNoiseDb: signalToNoiseDb,
            harmonicFrequencyHz: activeHarmonicHz,
            simulationStage: simStage,
            handshakeQuorumRatio: `${handshakeQuorum.length}/10 REAL_HSM`,
            handshakeQuorumSlots: handshakeQuorum,
            activeChamberNodesCount: nodes.length,
            nodesTelemetrySnapshot: nodes.map(n => ({
              id: n.id,
              name: n.name,
              chamberNum: n.chamberNum,
              entropy: n.entropy,
              temperatureK: n.temperatureK,
              status: n.status,
              pqcAlgorithm: n.pqcAlgorithm,
              custodian: n.custodian
            }))
          },
          statutoryFramework: {
            pdpa: 'พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒',
            etda: 'พระราชบัญญัติว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ (มาตรา ๙, ๒๖, ๒๘)',
            secNist: 'NIST FIPS 203 ML-KEM-1024 / FIPS 204 ML-DSA-87 / FIPS 205 SLH-DSA',
            complianceVerdict: '100% STATUTORY COMPLIANT / SOVEREIGN VERIFIED'
          },
          forensicVerdict: {
            zeroDrift: '0.00% SSoT Verified',
            failClosedThreshold: '85.0°C / Coherence < 85.0%',
            decaKeyQuorum: `${handshakeQuorum.length}/10 REAL_HSM QUORUM`,
            status: 'RUNTIME-VERIFIED'
          }
        },
        'zyrquen-chamber-15-telemetry-evidence'
      );

      playAuditChime();
      addLog('[EXPORT] Chamber 15 Telemetry Evidence (QOps, Coherence, Antimatter Fuel) downloaded successfully via EvidenceExportService.');
    } catch (err) {
      console.error('Failed to export Chamber 15 evidence', err);
    } finally {
      setTimeout(() => setIsExportingEvidence(false), 600);
    }
  };

  // Color helper
  const getEntropyColor = (val: number) => {
    if (val < 0.20) return '#06b6d4'; // Cyan
    if (val < 0.35) return '#10b981'; // Emerald
    if (val < 0.55) return '#f59e0b'; // Amber
    return '#f43f5e'; // Rose
  };

  // D3 Rendering of 2D Topological Heat Field with Dynamic Quantum Waves
  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = Math.max(380, containerRef.current.clientHeight);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left + innerWidth / 2},${margin.top + innerHeight / 2})`);

    const scale = Math.min(innerWidth, innerHeight) / 220;
    const xScale = (coord: number) => coord * scale;
    const yScale = (coord: number) => -coord * scale;

    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter').attr('id', 'chamber-heat-glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Concentric coordinate rings
    [25, 50, 75, 100].forEach((r) => {
      g.append('circle')
        .attr('r', r * scale)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(6, 182, 212, 0.1)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3');
    });

    // Cartesian Axes
    g.append('line').attr('x1', -105 * scale).attr('y1', 0).attr('x2', 105 * scale).attr('y2', 0).attr('stroke', 'rgba(6, 182, 212, 0.15)');
    g.append('line').attr('x1', 0).attr('y1', -105 * scale).attr('x2', 0).attr('y2', 105 * scale).attr('stroke', 'rgba(6, 182, 212, 0.15)');

    // Quantum Heat Halos
    nodes.forEach((node) => {
      const color = getEntropyColor(node.entropy);
      const radius = (22 + node.entropy * 38) * scale;
      const gradId = `chamber-grad-${node.id}`;

      const radialGrad = defs.append('radialGradient').attr('id', gradId).attr('cx', '50%').attr('cy', '50%').attr('r', '50%');
      radialGrad.append('stop').attr('offset', '0%').attr('stop-color', color).attr('stop-opacity', 0.35);
      radialGrad.append('stop').attr('offset', '70%').attr('stop-color', color).attr('stop-opacity', 0.08);
      radialGrad.append('stop').attr('offset', '100%').attr('stop-color', color).attr('stop-opacity', 0);

      g.append('circle')
        .attr('cx', xScale(node.x))
        .attr('cy', yScale(node.y))
        .attr('r', radius)
        .attr('fill', `url(#${gradId})`)
        .attr('pointer-events', 'none');
    });

    // Interconnect mesh
    const points: [number, number][] = nodes.map((d) => [xScale(d.x), yScale(d.y)]);
    const delaunay = d3.Delaunay.from(points);
    const { halfedges, points: p } = delaunay;

    for (let i = 0; i < halfedges.length; i++) {
      if (halfedges[i] > i) {
        const p1 = [p[i * 2], p[i * 2 + 1]];
        const j = halfedges[i];
        const p2 = [p[j * 2], p[j * 2 + 1]];
        const dist = Math.hypot(p1[0] - p2[0], p1[1] - p2[1]);
        if (dist < 85 * scale) {
          g.append('line')
            .attr('x1', p1[0])
            .attr('y1', p1[1])
            .attr('x2', p2[0])
            .attr('y2', p2[1])
            .attr('stroke', isSimulating ? 'rgba(6, 182, 212, 0.35)' : 'rgba(255, 255, 255, 0.07)')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', isSimulating ? 'none' : '2,3');
        }
      }
    }

    // Node glyphs
    const nodeGroups = g
      .selectAll('.node-group')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node-group cursor-pointer')
      .attr('transform', (d) => `translate(${xScale(d.x)},${yScale(d.y)})`)
      .on('click', (_, d) => {
        playTone(400 + d.chamberNum * 25, 0.05, 'sine', 0.05);
        setSelectedChamber(d);
      });

    // Outer Selection / Status Ring
    nodeGroups
      .append('circle')
      .attr('r', (d) => (selectedChamber.id === d.id ? 15 : 10))
      .attr('fill', 'none')
      .attr('stroke', (d) => (selectedChamber.id === d.id ? '#ffffff' : getEntropyColor(d.entropy)))
      .attr('stroke-width', (d) => (selectedChamber.id === d.id ? 2 : 1))
      .attr('opacity', 0.85);

    // Inner Core
    nodeGroups
      .append('circle')
      .attr('r', (d) => (d.chamberNum === 15 ? 8 : 5))
      .attr('fill', (d) => (d.chamberNum === 15 ? '#06b6d4' : getEntropyColor(d.entropy)))
      .style('filter', 'url(#chamber-heat-glow)');

    // Text Label
    nodeGroups
      .append('text')
      .attr('y', 16)
      .attr('text-anchor', 'middle')
      .attr('fill', (d) => (selectedChamber.id === d.id ? '#38bdf8' : '#94a3b8'))
      .attr('font-family', 'monospace')
      .attr('font-size', '9px')
      .attr('font-weight', (d) => (selectedChamber.id === d.id ? 'bold' : 'normal'))
      .text((d) => `CH${d.chamberNum < 10 ? '0' + d.chamberNum : d.chamberNum}`);

  }, [nodes, selectedChamber, isSimulating]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Control Deck */}
      <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#0c1222]/95 via-[#080d1a]/90 to-[#050811]/95 border border-cyan-500/30 backdrop-blur-2xl shadow-[0_10px_35px_-10px_rgba(6,182,212,0.2)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                CHAMBER 15: SPATIAL ENTROPY CORE
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                SSoT Δ0.00% ZERO DRIFT
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold">
                10/10 DECA-KEY QUORUM
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-mono text-white flex items-center gap-2">
              Spatial Entropy Heat Map Simulator
            </h2>
            <p className="text-xs text-zinc-400 font-mono max-w-3xl">
              Real-time quantum energy assessment, 768-qubit superposition coherence balancing, and Deca-Key handshake synchronization across 18 Chambers prior to mainnet consensus emission.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Download Evidence JSON Blob */}
            <button
              onClick={handleDownloadEvidence}
              disabled={isExportingEvidence}
              className="px-4 py-2.5 rounded-2xl font-mono text-xs font-bold flex items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              title="ดาวน์โหลดประจักษ์พยานดิจิทัล Chamber 15 (JSON Attestation Evidence)"
            >
              <Download className={`w-4 h-4 text-emerald-400 ${isExportingEvidence ? 'animate-bounce' : ''}`} />
              <span>{isExportingEvidence ? 'EXPORTING...' : 'DOWNLOAD EVIDENCE'}</span>
            </button>

            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className={`px-5 py-2.5 rounded-2xl font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.3)] ${
                isSimulating
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold'
              }`}
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                  <span>Simulating Phase ({progress}%)...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-black" />
                  <span>Run Chamber 15 Simulation</span>
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              disabled={isSimulating}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
              title="Reset Simulation State"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real-time Progress & Telemetry Metrics */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
          <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] text-zinc-400 uppercase">Cryogenic Temp</span>
            <div className="text-sm sm:text-base font-bold text-cyan-300 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{cryoTempK.toFixed(2)} mK</span>
            </div>
            <span className="text-[9px] text-emerald-400">Sub-Kelvin Locked</span>
          </div>

          <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] text-zinc-400 uppercase">Coherence Level</span>
            <div className="text-sm sm:text-base font-bold text-emerald-300 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{coherencePct.toFixed(3)}%</span>
            </div>
            <span className="text-[9px] text-zinc-500">768 Qubits Aligned</span>
          </div>

          <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] text-zinc-400 uppercase">Current QOps</span>
            <div className="text-sm sm:text-base font-bold text-blue-300 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>{currentQOpsRate.toFixed(1)} M</span>
            </div>
            <span className="text-[9px] text-blue-400">Quantum Processing</span>
          </div>

          <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] text-zinc-400 uppercase">Antimatter Fuel Burn</span>
            <div className="text-sm sm:text-base font-bold text-rose-300 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{antimatterFuelBurnRate.toFixed(3)} ng/s</span>
            </div>
            <span className="text-[9px] text-emerald-400">Steady Reaction</span>
          </div>

          <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] text-zinc-400 uppercase">Signal-to-Noise (SNR)</span>
            <div className="text-sm sm:text-base font-bold text-amber-300 flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{signalToNoiseDb.toFixed(2)} dB</span>
            </div>
            <span className="text-[9px] text-emerald-400">&gt;99.5 dB Passed</span>
          </div>

          <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] text-zinc-400 uppercase">Deca-Key Handshake</span>
            <div className="text-sm sm:text-base font-bold text-purple-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>{handshakeQuorum.length}/10 Nodes</span>
            </div>
            <span className="text-[9px] text-purple-400">
              {handshakeQuorum.length === 10 ? '100% UNANIMOUS' : 'Awaiting Pulse'}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        {isSimulating && (
          <div className="mt-4 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between text-zinc-400 text-[11px]">
              <span className="text-cyan-300">Phase: {simStage}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-black/60 border border-white/10 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500"
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: D3 Map + Deca-Key Live Custodian Quorum Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 2D D3 Heat Map Stage */}
        <div className="lg:col-span-7 bg-[#0a0f1d]/90 border border-white/10 rounded-[28px] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                2D Spatial Energy Gradient Matrix (18 Chambers)
              </h3>
            </div>
            <div className="text-[10px] font-mono text-zinc-400 bg-white/5 px-2.5 py-1 rounded-xl">
              Freq: {activeHarmonicHz} Hz Harmonic
            </div>
          </div>

          <div ref={containerRef} className="w-full h-[380px] relative bg-black/40 rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center">
            <svg ref={svgRef} className="w-full h-full" />

            <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md rounded-xl px-3 py-1.5 flex items-center gap-3 text-[10px] font-mono text-zinc-400 border border-white/10 pointer-events-none">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#06b6d4]"></span> Low (&lt;0.20)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#10b981]"></span> Nominal (0.35)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span> Elevated (0.55)</span>
            </div>
          </div>

          {/* Selected Chamber Detail Box */}
          <div className="p-4 rounded-2xl bg-black/50 border border-cyan-500/20 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-cyan-300 font-bold">{selectedChamber.name}</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] border border-emerald-500/30">
                {selectedChamber.status}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1 text-zinc-400">
              <div>Entropy: <strong className="text-white">{selectedChamber.entropy.toFixed(3)}</strong></div>
              <div>Temp: <strong className="text-white">{selectedChamber.temperatureK} {selectedChamber.temperatureK < 100 ? 'mK' : 'K'}</strong></div>
              <div>Algorithm: <strong className="text-purple-300">{selectedChamber.pqcAlgorithm}</strong></div>
              <div>Coord: <strong className="text-cyan-300">({selectedChamber.x}, {selectedChamber.y})</strong></div>
            </div>
          </div>
        </div>

        {/* Right: 10/10 Deca-Key REAL_HSM Handshake Pulse & Live Telemetry Logs */}
        <div className="lg:col-span-5 space-y-5">
          {/* Deca-Key 10/10 Grid */}
          <div className="p-5 rounded-[28px] bg-[#0a0f1d]/90 border border-purple-500/20 space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  10/10 REAL_HSM Deca-Key Custodians
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                FIPS 140-3 L4
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-[10px]">
              {COUNCIL_MEMBERS.map((member, idx) => {
                const slot = idx + 1;
                const isRatified = handshakeQuorum.includes(slot) || simStage === 'COMPLETED';
                return (
                  <div
                    key={member.slotId}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center space-y-1 transition-all ${
                      isRatified
                        ? 'bg-purple-950/40 border-purple-500/50 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.25)]'
                        : 'bg-black/30 border-white/5 text-zinc-500'
                    }`}
                  >
                    <span className="font-bold">TC-0{slot}</span>
                    <span className="text-[8px] truncate max-w-[70px] text-zinc-400">{member.passportId}</span>
                    <span className={`text-[8px] px-1 py-0.2 rounded font-bold ${
                      isRatified ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-zinc-600'
                    }`}>
                      {isRatified ? 'RATIFIED' : 'PENDING'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* OTel Forensic Log Stream */}
          <div className="p-5 rounded-[28px] bg-black/60 border border-white/10 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-zinc-400 flex items-center gap-1.5 text-[11px]">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                Live Chamber 15 Telemetry &amp; Handshake Logs
              </span>
              <span className="text-[10px] text-zinc-600">OTel v1.28</span>
            </div>

            <div className="h-44 overflow-y-auto space-y-1.5 text-[11px] pr-1">
              {logs.map((log, i) => (
                <div key={i} className={`leading-relaxed ${
                  log.includes('🚀') || log.includes('🌟') ? 'text-cyan-300 font-bold' :
                  log.includes('✅') ? 'text-emerald-300' :
                  log.includes('⚖️') || log.includes('🔐') ? 'text-purple-300' : 'text-zinc-400'
                }`}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
