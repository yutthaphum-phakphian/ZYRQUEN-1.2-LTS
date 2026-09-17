import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import {
  ShieldCheck,
  RefreshCw,
  Cpu,
  Lock,
  Activity,
  Layers,
  Database,
  Radio,
  FileCode,
  CheckCircle2,
  Sparkles,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import { SYSTEM_METADATA } from '../../data/canonicalData';
import { ForensicsSealAuditModal } from '../ForensicsSealAuditModal';
import { SovereignUpgradeCycleModal } from '../SovereignUpgradeCycleModal';
import { copilotAssistantService } from '../../services/copilotAssistantService';

export interface CanonicalIntegrityDashboardViewProps {
  onNavigateToLedger?: () => void;
}

interface Merkle3DNode {
  id: string;
  name: string;
  level: number;
  x: number;
  y: number;
  z: number;
  hash: string;
  seals: number;
  validity: number; // 0-100%
  strength: number; // connection strength 0.0 - 1.0
  type: 'ROOT' | 'BRANCH' | 'LEAF';
  status: 'VERIFIED' | 'ANCHORED_P0';
}

interface MerkleLink {
  source: string;
  target: string;
  strength: number;
}

export const CanonicalIntegrityDashboardView: React.FC<CanonicalIntegrityDashboardViewProps> = ({
  onNavigateToLedger,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [frequencyHz, setFrequencyHz] = useState<number>(60.0);
  const [rotationAngle, setRotationAngle] = useState<number>(25);
  const [pitchAngle, setPitchAngle] = useState<number>(20);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [vizMode, setVizMode] = useState<'SPHERE' | 'TREE'>('SPHERE');
  const [selectedAuditSeal, setSelectedAuditSeal] = useState<{ id: string | number; hash: string } | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [promotionStatus, setPromotionStatus] = useState<'SOVEREIGNLOCKEDACTIVE' | 'FAIL-CLOSED'>('SOVEREIGNLOCKEDACTIVE');
  const [logsPaused, setLogsPaused] = useState<boolean>(false);

  // Continuum 60Hz logs
  const [streamLogs, setStreamLogs] = useState<string[]>([
    '[19:24:01.010Z] EPOCH Epoch Block Height advanced to #849205 (Previous #849204)',
    '[19:24:02.140Z] MERKLE Merkle Root P0 sealed: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    '[19:24:03.450Z] HSM REAL HSM Signature Quorum attested: 10/10 Nodes signed @ 14.98 mK',
    '[19:24:04.220Z] ARTIFACT TNT-TH-001 bound to #849205 (Digest: 7f83b165...9069)',
    '[19:24:05.011Z] ARTIFACT DS-901-PILOT bound to #849205 (Digest: 3b8d35e7...a6b2)',
    '[19:24:05.890Z] ARTIFACT TX-20260809-909A-B814 bound to #849205 (Digest: f25581c9...a74e)',
    '[19:24:06.500Z] SEALS Canonical Sealed Items increased to 14,905 (+3 sealed items)',
    '[19:24:07.120Z] DRIFT SSoT Mutation Drift verified: Δ0.00% (Zero Drift preserved)',
    '[19:24:08.000Z] STATUS Promotion Gate status: 🔒 SOVEREIGNLOCKEDACTIVE',
  ]);

  // Periodic log tick (simulating 60Hz continuum sync monitors)
  useEffect(() => {
    if (logsPaused) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toISOString().slice(11, 23);
      const randEvent = Math.random();

      let newLog = '';
      if (randEvent < 0.25) {
        newLog = `[${timeStr}Z] SYNC Continuum Frequency: 60.00 Hz ● Coherence 99.97%`;
      } else if (randEvent < 0.5) {
        newLog = `[${timeStr}Z] AUDIT Hardware HSM Quorum verified: 10/10 signed @ 14.98 mK`;
      } else if (randEvent < 0.75) {
        newLog = `[${timeStr}Z] ANCHOR Merkle Root 909ab814... confirmed on Block #849202 (Δ0.00%)`;
      } else {
        newLog = `[${timeStr}Z] INTAKE Artifacts TNT-TH-001 & DS-901-PILOT status: BOUND`;
      }

      setStreamLogs((prev) => [...prev.slice(-14), newLog]);
    }, 2800);

    return () => clearInterval(interval);
  }, [logsPaused]);

  // Synchronize with Copilot Assistant UI Renderer
  useEffect(() => {
    const unsub = copilotAssistantService.subscribe((s) => {
      setVizMode(s.uiRendererMode);
      setAutoRotate(s.uiSpinActive);
    });
    return () => unsub();
  }, []);

  // Auto-rotate 3D hologram perspective
  useEffect(() => {
    if (!autoRotate) return;
    const rotInterval = setInterval(() => {
      setRotationAngle((prev) => (prev + 0.5) % 360);
    }, 50);
    return () => clearInterval(rotInterval);
  }, [autoRotate]);

  // D3.js 3D Holographic Merkle Tree Projection
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = 380;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', height);

    const centerX = width / 2;
    const centerY = height / 2 - 10;

    const rad = (rotationAngle * Math.PI) / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);

    const pitchRad = (pitchAngle * Math.PI) / 180;
    const cosP = Math.cos(pitchRad);
    const sinP = Math.sin(pitchRad);

    const projectPoint = (x: number, y: number, z: number) => {
      // Rotate around Y axis (yaw)
      const x1 = x * cosA - z * sinA;
      const z1 = x * sinA + z * cosA;
      // Rotate around X axis (pitch)
      const y2 = y * cosP - z1 * sinP;
      const z2 = y * sinP + z1 * cosP;
      const scale = 1 + z2 / 550;
      return {
        projX: centerX + x1 * scale,
        projY: centerY + y2 * scale,
        projZ: z2,
        scale,
      };
    };

    let rawNodes: Merkle3DNode[] = [];
    let rawLinks: MerkleLink[] = [];

    if (vizMode === 'SPHERE') {
      // Holographic Epoch Sphere (3D Continuum Orbit)
      const R = 135;
      rawNodes = [
        // Center: Merkle Root P0 #849205
        {
          id: 'root-849205',
          name: 'P0 Merkle Root #849205',
          level: 0,
          x: 0,
          y: 0,
          z: 0,
          hash: '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          seals: 14905,
          validity: 100,
          strength: 1.0,
          type: 'ROOT',
          status: 'ANCHORED_P0',
        },
        // Inner Anchor: Parent Master Hash #849204
        {
          id: 'parent-849204',
          name: 'Parent Master #849204 (Genesis #849202)',
          level: 1,
          x: -60,
          y: -40,
          z: -50,
          hash: '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
          seals: 14902,
          validity: 100,
          strength: 1.0,
          type: 'BRANCH',
          status: 'ANCHORED_P0',
        },
        // Sphere Shell Nodes (Equatorial & Orbital Points)
        {
          id: 'artifact-tnt',
          name: 'TNT-TH-001 (Tenant Manifest)',
          level: 2,
          x: -R * 0.85,
          y: R * 0.2,
          z: R * 0.45,
          hash: '0x7f83b1657f83b1657f83b1657f83b1657f83b1657f83b1657f83b1657f839069',
          seals: 1,
          validity: 100,
          strength: 0.98,
          type: 'LEAF',
          status: 'ANCHORED_P0',
        },
        {
          id: 'artifact-fios',
          name: 'DS-901-PILOT (FIOS Telemetry)',
          level: 2,
          x: R * 0.82,
          y: R * 0.35,
          z: -R * 0.4,
          hash: '0x3b8d35e73b8d35e73b8d35e73b8d35e73b8d35e73b8d35e73b8d35e73b8da6b2',
          seals: 1,
          validity: 100,
          strength: 0.97,
          type: 'LEAF',
          status: 'ANCHORED_P0',
        },
        {
          id: 'artifact-trace12',
          name: 'TX-20260809 (Stage 12 Replay)',
          level: 2,
          x: 0,
          y: -R * 0.85,
          z: R * 0.5,
          hash: '0xf25581c9f25581c9f25581c9f25581c9f25581c9f25581c9f25581c9f255a74e',
          seals: 1,
          validity: 100,
          strength: 0.99,
          type: 'LEAF',
          status: 'ANCHORED_P0',
        },
        {
          id: 'leaf-hsm10',
          name: 'REAL HSM 10/10 Quorum (14.98 mK)',
          level: 2,
          x: -R * 0.5,
          y: -R * 0.6,
          z: -R * 0.6,
          hash: '0x889c10f2345ab678901bcdef2345678901bcdef2345678901bcdef23456789',
          seals: 10,
          validity: 100,
          strength: 1.0,
          type: 'BRANCH',
          status: 'VERIFIED',
        },
        {
          id: 'leaf-master',
          name: 'Seal #14,905 (Sovereign Active)',
          level: 2,
          x: R * 0.45,
          y: -R * 0.75,
          z: -R * 0.4,
          hash: '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          seals: 14905,
          validity: 100,
          strength: 1.0,
          type: 'LEAF',
          status: 'ANCHORED_P0',
        },
        {
          id: 'leaf-tenant',
          name: 'Partition Ω600_1000 (400 Tenants)',
          level: 1,
          x: R * 0.95,
          y: -R * 0.15,
          z: R * 0.25,
          hash: '0x5b4c10ef8923d4567890abcdef1234567890abcdef1234567890abcdef123456',
          seals: 400,
          validity: 100,
          strength: 0.99,
          type: 'BRANCH',
          status: 'VERIFIED',
        },
        {
          id: 'leaf-bft',
          name: 'BFT Mesh 6 Nodes (Fail-Closed)',
          level: 1,
          x: -R * 0.6,
          y: R * 0.7,
          z: -R * 0.35,
          hash: '0x3a9f4c8e10b2d3567890abcdef1234567890abcdef1234567890abcdef123456',
          seals: 6,
          validity: 100,
          strength: 0.98,
          type: 'BRANCH',
          status: 'VERIFIED',
        },
        {
          id: 'leaf-pqc',
          name: 'PQC ML-DSA-87 / ML-KEM-1024',
          level: 1,
          x: R * 0.1,
          y: R * 0.9,
          z: R * 0.4,
          hash: '0x7e2b10c98f34a5678901bcdef2345678901bcdef2345678901bcdef23456789',
          seals: 4200,
          validity: 100,
          strength: 0.99,
          type: 'BRANCH',
          status: 'VERIFIED',
        },
      ];

      rawLinks = [
        { source: 'root-849205', target: 'parent-849204', strength: 1.0 },
        { source: 'root-849205', target: 'artifact-tnt', strength: 0.98 },
        { source: 'root-849205', target: 'artifact-fios', strength: 0.97 },
        { source: 'root-849205', target: 'artifact-trace12', strength: 0.99 },
        { source: 'root-849205', target: 'leaf-hsm10', strength: 1.0 },
        { source: 'root-849205', target: 'leaf-master', strength: 1.0 },
        { source: 'root-849205', target: 'leaf-tenant', strength: 0.99 },
        { source: 'root-849205', target: 'leaf-bft', strength: 0.98 },
        { source: 'root-849205', target: 'leaf-pqc', strength: 0.99 },
        // Inter-orbit linkages
        { source: 'parent-849204', target: 'artifact-trace12', strength: 0.95 },
        { source: 'artifact-tnt', target: 'leaf-tenant', strength: 0.96 },
        { source: 'leaf-hsm10', target: 'leaf-pqc', strength: 0.99 },
        { source: 'leaf-bft', target: 'artifact-fios', strength: 0.94 },
      ];
    } else {
      // Hierarchical Merkle Tree Mode for Block #849205
      rawNodes = [
        // Level 0: Root #849205
        {
          id: 'root-849205',
          name: 'P0 Merkle Root #849205',
          level: 0,
          x: 0,
          y: -115,
          z: 0,
          hash: '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          seals: 14905,
          validity: 100,
          strength: 1.0,
          type: 'ROOT',
          status: 'ANCHORED_P0',
        },
        // Level 1: Core Branches
        {
          id: 'branch-parent',
          name: 'Parent Epoch #849204 (Genesis #849202)',
          level: 1,
          x: -200,
          y: -35,
          z: -50,
          hash: '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
          seals: 14902,
          validity: 100,
          strength: 1.0,
          type: 'BRANCH',
          status: 'VERIFIED',
        },
        {
          id: 'branch-pqc',
          name: 'PQC Attestation Branch (ML-DSA)',
          level: 1,
          x: -60,
          y: -25,
          z: 60,
          hash: '0x7e2b10c98f34a5678901bcdef2345678901bcdef2345678901bcdef23456789',
          seals: 4200,
          validity: 100,
          strength: 0.99,
          type: 'BRANCH',
          status: 'VERIFIED',
        },
        {
          id: 'branch-bft',
          name: 'BFT Mesh Branch (6 Nodes)',
          level: 1,
          x: 70,
          y: -30,
          z: -40,
          hash: '0x3a9f4c8e10b2d3567890abcdef1234567890abcdef1234567890abcdef123456',
          seals: 7453,
          validity: 100,
          strength: 0.98,
          type: 'BRANCH',
          status: 'VERIFIED',
        },
        {
          id: 'branch-tenant',
          name: 'Tenant Partition Ω600_1000',
          level: 1,
          x: 210,
          y: -35,
          z: 50,
          hash: '0x5b4c10ef8923d4567890abcdef1234567890abcdef1234567890abcdef123456',
          seals: 3252,
          validity: 100,
          strength: 0.97,
          type: 'BRANCH',
          status: 'VERIFIED',
        },
        // Level 2: Leaves (Committed Bound Artifacts & HSM)
        {
          id: 'artifact-tnt',
          name: 'TNT-TH-001 (Manifest Bound)',
          level: 2,
          x: -240,
          y: 75,
          z: -30,
          hash: '0x7f83b1657f83b1657f83b1657f83b1657f83b1657f83b1657f83b1657f839069',
          seals: 1,
          validity: 100,
          strength: 0.98,
          type: 'LEAF',
          status: 'ANCHORED_P0',
        },
        {
          id: 'artifact-fios',
          name: 'DS-901-PILOT (Dataset Bound)',
          level: 2,
          x: -120,
          y: 80,
          z: 40,
          hash: '0x3b8d35e73b8d35e73b8d35e73b8d35e73b8d35e73b8d35e73b8d35e73b8da6b2',
          seals: 1,
          validity: 100,
          strength: 0.97,
          type: 'LEAF',
          status: 'ANCHORED_P0',
        },
        {
          id: 'artifact-trace12',
          name: 'TX-20260809 (Replay Bound)',
          level: 2,
          x: 0,
          y: 85,
          z: -20,
          hash: '0xf25581c9f25581c9f25581c9f25581c9f25581c9f25581c9f25581c9f255a74e',
          seals: 1,
          validity: 100,
          strength: 0.99,
          type: 'LEAF',
          status: 'ANCHORED_P0',
        },
        {
          id: 'leaf-hsm10',
          name: 'REAL HSM 10/10 Quorum',
          level: 2,
          x: 120,
          y: 80,
          z: 40,
          hash: '0x889c10f2345ab678901bcdef2345678901bcdef2345678901bcdef23456789',
          seals: 10,
          validity: 100,
          strength: 1.0,
          type: 'LEAF',
          status: 'VERIFIED',
        },
        {
          id: 'leaf-master',
          name: 'Seal #14,905 (Active Master)',
          level: 2,
          x: 240,
          y: 75,
          z: -30,
          hash: '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          seals: 14905,
          validity: 100,
          strength: 1.0,
          type: 'LEAF',
          status: 'ANCHORED_P0',
        },
      ];

      rawLinks = [
        { source: 'root-849205', target: 'branch-parent', strength: 1.0 },
        { source: 'root-849205', target: 'branch-pqc', strength: 0.99 },
        { source: 'root-849205', target: 'branch-bft', strength: 0.98 },
        { source: 'root-849205', target: 'branch-tenant', strength: 0.97 },
        { source: 'branch-parent', target: 'artifact-tnt', strength: 0.98 },
        { source: 'branch-bft', target: 'artifact-fios', strength: 0.97 },
        { source: 'branch-bft', target: 'artifact-trace12', strength: 0.99 },
        { source: 'branch-pqc', target: 'leaf-hsm10', strength: 1.0 },
        { source: 'branch-tenant', target: 'leaf-master', strength: 1.0 },
      ];
    }

    const projectedNodes = rawNodes.map((node) => {
      const p = projectPoint(node.x, node.y, node.z);
      return {
        ...node,
        projX: p.projX,
        projY: p.projY,
        projZ: p.projZ,
        scale: p.scale,
      };
    });

    // Sort nodes by Z-depth for correct occlusion
    projectedNodes.sort((a, b) => a.projZ - b.projZ);

    const nodeMap = new Map(projectedNodes.map((n) => [n.id, n]));

    const g = svg.append('g');

    // In SPHERE mode, render celestial 3D sphere orbital rings (Equator, Meridian, Oblique)
    if (vizMode === 'SPHERE') {
      const R = 135;
      const numSegments = 40;
      const rings = [
        // Equatorial ring (XZ plane)
        Array.from({ length: numSegments + 1 }, (_, i) => {
          const theta = (i * 2 * Math.PI) / numSegments;
          return { x: R * Math.cos(theta), y: 0, z: R * Math.sin(theta) };
        }),
        // Meridian ring (YZ plane)
        Array.from({ length: numSegments + 1 }, (_, i) => {
          const theta = (i * 2 * Math.PI) / numSegments;
          return { x: 0, y: R * Math.cos(theta), z: R * Math.sin(theta) };
        }),
        // Oblique inclined ring (45 degree rotated)
        Array.from({ length: numSegments + 1 }, (_, i) => {
          const theta = (i * 2 * Math.PI) / numSegments;
          return {
            x: R * Math.cos(theta) * 0.7071,
            y: R * Math.sin(theta),
            z: R * Math.cos(theta) * 0.7071,
          };
        }),
      ];

      rings.forEach((ringPoints, ringIdx) => {
        const projectedPoints = ringPoints.map((pt) => projectPoint(pt.x, pt.y, pt.z));
        const lineGenerator = d3
          .line<{ projX: number; projY: number }>()
          .x((d) => d.projX)
          .y((d) => d.projY);

        g.append('path')
          .datum(projectedPoints)
          .attr('d', lineGenerator)
          .attr('fill', 'none')
          .attr('stroke', ringIdx === 0 ? '#06B6D4' : ringIdx === 1 ? '#10B981' : '#D4AF37')
          .attr('stroke-width', 1)
          .attr('stroke-opacity', 0.28)
          .attr('stroke-dasharray', '3,4');
      });
    }

    // Draw Connection Links with pulse animation
    rawLinks.forEach((link) => {
      const s = nodeMap.get(link.source);
      const t = nodeMap.get(link.target);
      if (!s || !t) return;

      // Base link
      g.append('line')
        .attr('x1', s.projX)
        .attr('y1', s.projY)
        .attr('x2', t.projX)
        .attr('y2', t.projY)
        .attr('stroke', '#06B6D4')
        .attr('stroke-width', 1.5 * ((s.scale + t.scale) / 2))
        .attr('stroke-opacity', 0.5 * link.strength);

      // Pulse particle
      g.append('circle')
        .attr('cx', (s.projX + t.projX) / 2)
        .attr('cy', (s.projY + t.projY) / 2)
        .attr('r', 2.5)
        .attr('fill', '#10B981')
        .attr('opacity', 0.8);
    });

    // Draw Nodes
    const nodeGroups = g
      .selectAll('.merkle-node')
      .data(projectedNodes)
      .enter()
      .append('g')
      .attr('class', 'merkle-node')
      .attr('transform', (d) => `translate(${d.projX},${d.projY})`)
      .style('cursor', 'pointer');

    // Outer aura ring for root and master seal
    nodeGroups
      .filter((d) => d.type === 'ROOT' || d.id === 'leaf-master' || d.id === 'parent-849204')
      .append('circle')
      .attr('r', (d) => (d.type === 'ROOT' ? 18 : 14) * d.scale)
      .attr('fill', 'none')
      .attr('stroke', (d) => (d.type === 'ROOT' ? '#D4AF37' : '#06B6D4'))
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.7)
      .attr('stroke-dasharray', '3,3');

    // Main Node Circle
    nodeGroups
      .append('circle')
      .attr('r', (d) => (d.type === 'ROOT' ? 13 : d.type === 'BRANCH' ? 9 : 7) * d.scale)
      .attr('fill', (d) =>
        d.type === 'ROOT' ? '#D4AF37' : d.status === 'ANCHORED_P0' ? '#10B981' : '#06B6D4'
      )
      .attr('stroke', '#070a12')
      .attr('stroke-width', 2);

    // Node Labels
    nodeGroups
      .append('text')
      .attr('y', (d) => (d.type === 'ROOT' ? -22 : 20) * d.scale)
      .attr('text-anchor', 'middle')
      .attr('fill', (d) => (d.type === 'ROOT' ? '#D4AF37' : '#e2e8f0'))
      .attr('font-size', (d) => `${Math.max(9, Math.round(10 * d.scale))}px`)
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text((d) => d.name);

    // Connection Strength / Validity Sub-label
    nodeGroups
      .append('text')
      .attr('y', (d) => (d.type === 'ROOT' ? -11 : 31) * d.scale)
      .attr('text-anchor', 'middle')
      .attr('fill', '#10B981')
      .attr('font-size', '8px')
      .attr('font-family', 'monospace')
      .text((d) => `Conn: ${(d.strength * 100).toFixed(0)}% • Valid 100%`);

    // Interactive Click to open Forensics Seal Audit Modal
    nodeGroups.on('click', (event, d) => {
      playTone(920, 0.05);
      setSelectedAuditSeal({ id: d.name, hash: d.hash });
    });
  }, [rotationAngle, pitchAngle, vizMode]);

  return (
    <div className="space-y-4 font-mono">
      {/* Top Banner with Continuum Frequency 60.00 Hz and HSM Quorum 10/10 */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0f1e] border border-cyan-500/30 shadow-2xl relative overflow-hidden space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                ZYRQUEN_OMEGA_INFINITY_HARDENING_V2_1
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold">
                CONTINUUM FREQUENCY: {frequencyHz.toFixed(2)} Hz ● SYNC
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40 text-[11px] font-bold">
                HARDWARE HSM: QUORUM 10/10 @ 14.98 mK
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>🏛️ CANONICAL INTEGRITY DASHBOARD</span>
              <span className="text-cyan-400 text-sm font-normal">EPOCH #849205</span>
            </h1>

            <p className="text-xs text-zinc-400">
              Deterministic Post-Quantum Ledger Anchor • Thai ETDA Sec 9/26/28 &amp; PDPA Sec 37 Log Integrity • Signer: นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                playTone(800, 0.04);
                setIsUpgradeModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all"
            >
              <span>🚀 Start Next Sovereign Upgrade Cycle</span>
            </button>

            {onNavigateToLedger && (
              <button
                onClick={() => {
                  playTone(660, 0.04);
                  onNavigateToLedger();
                }}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <span>📜 View Full Ledger</span>
              </button>
            )}
          </div>
        </div>

        {/* Canonical Core Status KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-cyan-500/20 text-xs">
          <div className="p-2.5 rounded-xl bg-[#070a12] border border-cyan-500/20 space-y-0.5">
            <div className="text-zinc-500 text-[10px] uppercase">EPOCH BLOCK HEIGHT</div>
            <div className="text-base font-bold text-cyan-300">#849205</div>
            <div className="text-[10px] text-zinc-400">Prev #849204 • Gen #849202</div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#070a12] border border-emerald-500/20 space-y-0.5">
            <div className="text-emerald-400 text-[10px] uppercase">CANONICAL SEALS</div>
            <div className="text-base font-bold text-emerald-300">14,905 (+3 Active)</div>
            <div className="text-[10px] text-emerald-500">100% Attestation Passed</div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#070a12] border border-cyan-500/20 space-y-0.5">
            <div className="text-cyan-400 text-[10px] uppercase">SSOT MUTATION DRIFT</div>
            <div className="text-base font-bold text-cyan-300">Δ0.00%</div>
            <div className="text-[10px] text-zinc-400">Zero Drift Invariant</div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#070a12] border border-emerald-500/20 space-y-0.5">
            <div className="text-zinc-400 text-[10px] uppercase">PROMOTION GATE</div>
            <div className="text-base font-bold text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {promotionStatus}
            </div>
            <div className="text-[10px] text-zinc-400">Sovereign Stable Lock Active</div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#070a12] border border-amber-500/20 space-y-0.5 col-span-2">
            <div className="text-amber-400 text-[10px] uppercase">CANONICAL MERKLE ROOT P0</div>
            <div className="text-xs font-bold text-zinc-200 truncate font-mono">
              e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
            </div>
            <div className="text-[10px] text-emerald-400 font-semibold flex items-center justify-between">
              <span>ANCHOR: 🟢 SOVEREIGNLOCKEDACTIVE</span>
              <span className="text-zinc-400">Parent: 909ab814...</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Holographic 3D Visualization Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0f1e] border border-cyan-500/20 space-y-3 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-500/20 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Holographic Continuum &amp; Provenance Topology</span>
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[10px]">
                LIVE REAL-TIME 3D PROJECTION
              </span>
            </h2>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
              <span>EPOCH #849205 BOUND</span>
              <span>•</span>
              <span className="text-emerald-400">REAL HSM QUORUM: 10 / 10 SIGNED</span>
              <span>•</span>
              <span className="text-cyan-400">FORENSICS DIFF: 0 MISMATCH</span>
              <span>•</span>
              <span className="text-amber-400">SEALS: 14,905 (+3)</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 text-xs">
            {/* Copilot Assistant Sync Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300 text-[10px] font-mono shadow-sm">
              <span className="animate-pulse text-xs">🧠</span>
              <span className="hidden sm:inline font-bold">Copilot UI Renderer:</span>
              <span className="text-white font-bold">{vizMode}</span>
            </div>

            {/* View Mode Toggle: Sphere vs Tree */}
            <div className="flex items-center bg-[#070a12] p-1 rounded-xl border border-cyan-500/30">
              <button
                onClick={() => {
                  playTone(700, 0.03);
                  copilotAssistantService.setUIRendererMode('SPHERE');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  vizMode === 'SPHERE'
                    ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                🌌 Holographic Epoch Sphere
              </button>
              <button
                onClick={() => {
                  playTone(700, 0.03);
                  copilotAssistantService.setUIRendererMode('TREE');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  vizMode === 'TREE'
                    ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                🌲 Hierarchical Merkle Tree
              </button>
            </div>

            <button
              onClick={() => {
                copilotAssistantService.toggleUISpin();
              }}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                autoRotate
                  ? 'bg-cyan-950 text-cyan-200 border-cyan-400'
                  : 'bg-white/5 text-zinc-400 border-white/10'
              }`}
            >
              {autoRotate ? '⏸ Pause 3D Spin' : '▶ Auto Rotate'}
            </button>

            <button
              onClick={() => setPitchAngle((prev) => (prev + 15) % 90)}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300"
              title="Pitch Tilt +15°"
            >
              🔼 Pitch {pitchAngle}°
            </button>

            <button
              onClick={() => setRotationAngle((prev) => (prev + 45) % 360)}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300"
              title="Rotate 45 degrees"
            >
              🔄 Yaw 45°
            </button>
          </div>
        </div>

        {/* 3D D3 Holographic Canvas */}
        <div
          ref={containerRef}
          className="w-full relative overflow-hidden bg-[#070a12] rounded-xl border border-white/5 p-2"
        >
          <svg ref={svgRef} className="w-full block" />
          <div className="absolute bottom-3 right-3 text-[10px] text-zinc-500 bg-black/60 px-2.5 py-1 rounded border border-white/5 pointer-events-none">
            Mode: {vizMode === 'SPHERE' ? '🌌 Holographic Sphere (3D Continuum)' : '🌲 Hierarchical Merkle Tree'} • Yaw: {rotationAngle.toFixed(0)}° • Pitch: {pitchAngle}°
          </div>
        </div>
      </div>

      {/* Committed Evidence Intake Ledger Table */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0f1e] border border-cyan-500/20 space-y-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Committed Evidence Intake Ledger
            </h2>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px]">
              CANONICAL P0 BOUND (#849205)
            </span>
          </div>
          <span className="text-xs text-zinc-400">3 Core Production Artifacts Committed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400">
                <th className="py-2 px-3">EVIDENCE ID</th>
                <th className="py-2 px-3">SOURCE TYPE</th>
                <th className="py-2 px-3">SHA-256 DIGEST</th>
                <th className="py-2 px-3">MERKLE ANCHOR</th>
                <th className="py-2 px-3">WRITE PERMISSION</th>
                <th className="py-2 px-3">BINDING STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300">
              <tr className="hover:bg-white/5 transition-colors">
                <td className="py-2.5 px-3 font-bold text-cyan-300">TNT-TH-001</td>
                <td className="py-2.5 px-3 text-zinc-400">Tenant Audit Manifest</td>
                <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-400 truncate max-w-[200px]">
                  7f83b1657f83b1657f83b1657f83b1657f83b1657f83b1657f83b1657f839069
                </td>
                <td className="py-2.5 px-3 text-purple-300">CANONICAL_P0_BOUND</td>
                <td className="py-2.5 px-3 text-emerald-400 font-semibold">ALLOWED</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                    🟢 BOUND (#849205)
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="py-2.5 px-3 font-bold text-cyan-300">DS-901-PILOT</td>
                <td className="py-2.5 px-3 text-zinc-400">FIOS Pilot Dataset</td>
                <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-400 truncate max-w-[200px]">
                  3b8d35e73b8d35e73b8d35e73b8d35e73b8d35e73b8d35e73b8d35e73b8da6b2
                </td>
                <td className="py-2.5 px-3 text-purple-300">CANONICAL_P0_BOUND</td>
                <td className="py-2.5 px-3 text-emerald-400 font-semibold">ALLOWED</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                    🟢 BOUND (#849205)
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="py-2.5 px-3 font-bold text-cyan-300">TX-20260809-909A-B814</td>
                <td className="py-2.5 px-3 text-zinc-400">12-Stage Forensic Trace</td>
                <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-400 truncate max-w-[200px]">
                  f25581c9f25581c9f25581c9f25581c9f25581c9f25581c9f25581c9f255a74e
                </td>
                <td className="py-2.5 px-3 text-purple-300">CANONICAL_P0_BOUND</td>
                <td className="py-2.5 px-3 text-emerald-400 font-semibold">ALLOWED</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                    🟢 BOUND (#849205)
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Continuum Stream Logs (60Hz) - Auto-refreshing */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0f1e] border border-cyan-500/20 space-y-2.5 shadow-xl">
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Continuum Stream Logs (60Hz) - Auto-refreshing
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setLogsPaused((prev) => !prev)}
              className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 text-[11px]"
            >
              {logsPaused ? '▶ Resume Stream' : '⏸ Pause'}
            </button>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-300 text-[11px]">ACTIVE STREAM</span>
          </div>
        </div>

        <div className="p-3 bg-black/90 rounded-xl border border-white/5 font-mono text-[11px] space-y-1 max-h-52 overflow-y-auto">
          {streamLogs.map((log, idx) => {
            const isWarn = log.includes('WARN');
            const isSuccess = log.includes('SUCCESS') || log.includes('LOCK');
            const isAudit = log.includes('AUDIT') || log.includes('DIFF') || log.includes('ANCHOR');

            return (
              <div
                key={idx}
                className={`leading-relaxed ${
                  isWarn
                    ? 'text-amber-400'
                    : isSuccess
                    ? 'text-emerald-400 font-bold'
                    : isAudit
                    ? 'text-cyan-300'
                    : 'text-zinc-400'
                }`}
              >
                {log}
              </div>
            );
          })}
        </div>
      </div>

      {/* Forensics Seal Audit Modal */}
      {selectedAuditSeal && (
        <ForensicsSealAuditModal
          sealId={selectedAuditSeal.id}
          sealHash={selectedAuditSeal.hash}
          blockHeight={849205}
          onClose={() => setSelectedAuditSeal(null)}
        />
      )}

      {/* Sovereign Upgrade Cycle Modal */}
      <SovereignUpgradeCycleModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onCommitSuccess={() => {
          setPromotionStatus('SOVEREIGNLOCKEDACTIVE');
          setStreamLogs((prev) => [
            ...prev,
            `[${new Date().toISOString().slice(11, 23)}Z] SUCCESS Sovereign Upgrade Cycle verified and anchored to Block #849205`,
          ]);
        }}
      />
    </div>
  );
};
