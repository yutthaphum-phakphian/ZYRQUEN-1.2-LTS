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

export type VizMode = 'CLUSTERED_3D' | 'SPHERE' | 'TREE';

export interface Merkle3DNode {
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
  type: 'ROOT' | 'BRANCH' | 'LEAF' | 'CLUSTER_CORE' | 'MICRO_SEAL' | 'FAILING_NODE';
  status: 'VERIFIED' | 'ANCHORED_P0' | 'FAIL_CHECK' | 'QUARANTINED';
  failingCheck?: boolean;
  failReason?: string;
  clusterCategory?: string;
  hardwareUnit?: string;
  location?: string;
  fipsLevel?: string;
}

export interface MerkleLink {
  source: string;
  target: string;
  strength: number;
  isFailingLink?: boolean;
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
  const [vizMode, setVizMode] = useState<VizMode>('CLUSTERED_3D');
  const [sealStatusFilter, setSealStatusFilter] = useState<'ALL' | 'PASSING' | 'FAILING'>('ALL');
  const [hoveredNode, setHoveredNode] = useState<Merkle3DNode | null>(null);
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

    if (vizMode === 'CLUSTERED_3D') {
      // 14,902 Hardware Seals Clustered 3D Topology + Failing Status Checks
      const clusterCores = [
        {
          id: 'cluster-hsm10',
          name: 'HSM Cryo Enclaves [TC-01..10]',
          category: 'HSM Enclaves (FIPS 140-3 L4)',
          seals: 1490,
          cx: -130,
          cy: -55,
          cz: 35,
          color: '#06B6D4',
          fips: 'FIPS 140-3 Level 4 / CC EAL6+',
          location: 'Global Deca-Key Distributed Vaults',
          hardware: 'NitroKey HSM-PQC / YubiKey 5C FIPS / Trezor Safe 5',
          microCount: 16,
        },
        {
          id: 'cluster-cryo',
          name: 'Sub-Kelvin Cryo Bus [14.98 mK]',
          category: 'Chamber 14 Thermal Stabilizer',
          seals: 2140,
          cx: -150,
          cy: 65,
          cz: -40,
          color: '#10B981',
          fips: 'Sub-Kelvin Bus SLA ≤18.00 mK',
          location: 'Helium-3/Helium-4 Dilution Refrigeration Core',
          hardware: 'Oxford Cryofree Dilution Refrigeration Enclave',
          microCount: 16,
        },
        {
          id: 'cluster-qkd',
          name: 'QKD Photonic Mesh [BB84 Fiber]',
          category: 'Quantum Entangled Optical Link',
          seals: 1820,
          cx: 0,
          cy: -130,
          cz: -50,
          color: '#38BDF8',
          fips: 'NIST PQC Category 5 / QKD 256-bit',
          location: 'High-Coherence BB84 Photonic Channel',
          hardware: 'ID Quantique Clavis 3 QKD Station',
          microCount: 16,
        },
        {
          id: 'cluster-tpm',
          name: 'TPM 2.0 Silicon Grid [Slot J19]',
          category: 'Hardware Root of Trust Grid',
          seals: 1650,
          cx: 135,
          cy: -60,
          cz: -25,
          color: '#A78BFA',
          fips: 'FIPS 140-3 L3 / CC EAL6+ Certified',
          location: 'Server Enclosure Slot J19 Active Grid',
          hardware: 'Infineon OPTIGA TPM SLB 9672',
          microCount: 16,
        },
        {
          id: 'cluster-tenant',
          name: 'RWA Tenant Partition [Ω601-Ω1000]',
          category: '400 Enterprise Tenants (Locked)',
          seals: 3252,
          cx: 165,
          cy: 55,
          cz: 35,
          color: '#34D399',
          fips: 'Zero-Knowledge Isolation PDPA Sec 37',
          location: 'National Fiber & Satellite Infrastructure Partition',
          hardware: 'Confidential Computing AMD SEV-SNP Enclaves',
          microCount: 20,
        },
        {
          id: 'cluster-bft',
          name: 'Global Satellite Mesh [6 Nodes]',
          category: 'BK01/SG02/TY03/ZH04/SV05/LD06',
          seals: 2850,
          cx: 25,
          cy: 120,
          cz: 20,
          color: '#06B6D4',
          fips: 'BFT Mesh / Delay-Tolerant Satellite Protocol',
          location: 'Bangkok, Singapore, Tokyo, Zurich, SV, London',
          hardware: 'Starlink & Ground Station Quantum Transceivers',
          microCount: 18,
        },
        {
          id: 'cluster-genesis',
          name: 'Genesis Core Safe #849202',
          category: 'Sovereign Principal Custodian Safe',
          seals: 1700,
          cx: -40,
          cy: 20,
          cz: 90,
          color: '#D4AF37',
          fips: 'ETDA Sec 9/26 Sovereign Non-Repudiation',
          location: 'Bangkok Sovereign Hub (th-bangkok)',
          hardware: 'NitroKey HSM-PQC-01 Master Key Override',
          microCount: 14,
        },
      ];

      // Canonical Merkle Root P0 Anchor
      rawNodes.push({
        id: 'root-849205',
        name: 'P0 Merkle Root #849205 (14,905 Active)',
        level: 0,
        x: 0,
        y: -10,
        z: 0,
        hash: '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        seals: 14905,
        validity: 100,
        strength: 1.0,
        type: 'ROOT',
        status: 'ANCHORED_P0',
        clusterCategory: 'CANONICAL_ROOT',
        hardwareUnit: 'Genesis Core Key HSM FIPS 140-3 L4',
        location: 'Bangkok Sovereign Hub (th-bangkok)',
        fipsLevel: 'FIPS 140-3 Level 4',
      });

      // Assemble cluster cores and micro-seal satellites
      clusterCores.forEach((c) => {
        rawNodes.push({
          id: c.id,
          name: c.name,
          level: 1,
          x: c.cx,
          y: c.cy,
          z: c.cz,
          hash: `0x${c.id.slice(-6)}909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68`.slice(0, 66),
          seals: c.seals,
          validity: 100,
          strength: 0.99,
          type: 'CLUSTER_CORE',
          status: 'VERIFIED',
          clusterCategory: c.category,
          hardwareUnit: c.hardware,
          location: c.location,
          fipsLevel: c.fips,
        });

        // Link from Root to Cluster Core
        rawLinks.push({
          source: 'root-849205',
          target: c.id,
          strength: 0.98,
        });

        // Generate satellite micro-seals clustering in 3D around core
        for (let i = 0; i < c.microCount; i++) {
          const theta = (i / c.microCount) * Math.PI * 2;
          const phi = ((i % 5) - 2) * 0.35;
          const r = 24 + (i % 3) * 6;
          const mx = c.cx + r * Math.cos(theta) * Math.cos(phi);
          const my = c.cy + r * Math.sin(theta) * Math.cos(phi);
          const mz = c.cz + r * Math.sin(phi);

          const microId = `micro-${c.id}-${i}`;
          rawNodes.push({
            id: microId,
            name: `${c.name} Seal #${(c.seals - c.microCount + i + 1).toLocaleString()}`,
            level: 2,
            x: mx,
            y: my,
            z: mz,
            hash: `0x${i}909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68`.slice(0, 66),
            seals: Math.round(c.seals / c.microCount),
            validity: 100,
            strength: 0.95,
            type: 'MICRO_SEAL',
            status: 'VERIFIED',
            clusterCategory: c.category,
            hardwareUnit: `${c.hardware} (Port #${i + 1})`,
            location: c.location,
            fipsLevel: c.fips,
          });

          rawLinks.push({
            source: c.id,
            target: microId,
            strength: 0.85,
          });
        }
      });

      // Inter-cluster backbone links
      rawLinks.push(
        { source: 'cluster-hsm10', target: 'cluster-cryo', strength: 0.95 },
        { source: 'cluster-cryo', target: 'cluster-qkd', strength: 0.94 },
        { source: 'cluster-qkd', target: 'cluster-tpm', strength: 0.96 },
        { source: 'cluster-tpm', target: 'cluster-tenant', strength: 0.97 },
        { source: 'cluster-tenant', target: 'cluster-bft', strength: 0.95 },
        { source: 'cluster-bft', target: 'cluster-genesis', strength: 0.98 },
        { source: 'cluster-genesis', target: 'cluster-hsm10', strength: 0.99 }
      );

      // Failing Status Check Nodes (Prompt requirement: "highlighting any nodes currently failing status checks")
      const failingNodes: Merkle3DNode[] = [
        {
          id: 'fail-tc03',
          name: '⚠️ TC-03 Foil Tamper Anomaly (Seal #14903)',
          level: 2,
          x: -210,
          y: -105,
          z: 75,
          hash: '0x7528e18501da86fc4691763a43fa4c68909ab814479844d8a14816bed34cdbb0',
          seals: 1,
          validity: 0,
          strength: 0.15,
          type: 'FAILING_NODE',
          status: 'FAIL_CHECK',
          failingCheck: true,
          failReason:
            'STATUS CHECK FAILED: Physical tamper foil breach detected on module TC-03. Active Zeroization executed. Restored in 35.8ms via Phoenix.',
          clusterCategory: 'HSM Enclave Incident (Fail-Closed Quarantine)',
          hardwareUnit: 'Utimaco CryptoServer Se500 (TC-03 Enclave)',
          location: 'EU-Central FRA Vault (Sandbox Isolated)',
          fipsLevel: 'FIPS 140-3 L4 [Zeroized / Quarantined]',
        },
        {
          id: 'fail-quarantine-80',
          name: '⚠️ 80 Quarantined Legacy Seals (Shard #Q80)',
          level: 2,
          x: 230,
          y: -100,
          z: -65,
          hash: '0x8080808080808080808080808080808080808080808080808080808080808080',
          seals: 80,
          validity: 0,
          strength: 0.1,
          type: 'FAILING_NODE',
          status: 'QUARANTINED',
          failingCheck: true,
          failReason:
            'STATUS CHECK FAILED: 80 Legacy hardware seals quarantined pending Deca-Key Council re-attestation. Excluded from canonical 14,902 active set.',
          clusterCategory: 'Cold Storage Airgap Quarantine',
          hardwareUnit: '80 Quarantined Seal Shards (Foil-Tag-3908-Q01..Q80)',
          location: 'Airgapped Cold Quarantine Vault',
          fipsLevel: 'Non-Ratified / Awaiting Re-Audit',
        },
        {
          id: 'fail-ch07',
          name: '⚠️ Chamber 07 Transient Decoupler Bus',
          level: 2,
          x: 180,
          y: 130,
          z: 60,
          hash: '0x43a4c58916bed34c86fc4691a1891a3cb242b1e8c37a109ed41d0f425a13396c',
          seals: 1,
          validity: 45,
          strength: 0.35,
          type: 'FAILING_NODE',
          status: 'FAIL_CHECK',
          failingCheck: true,
          failReason:
            'STATUS CHECK FAILED: Transient thermal jitter spike (18.4 mK > 18.0 mK SLA threshold). Fail-Closed circuit armed in Chamber 07 sandbox.',
          clusterCategory: 'Chamber 07 Transient Decoupler Monitoring',
          hardwareUnit: 'Dilution Refrigeration Transient Sensor Bus',
          location: 'Cryo Dilution Core Chamber 07',
          fipsLevel: 'CC EAL6+ Sensor Fail-Safe',
        },
      ];

      failingNodes.forEach((fn) => {
        rawNodes.push(fn);
        rawLinks.push({
          source: fn.id === 'fail-tc03' ? 'cluster-hsm10' : fn.id === 'fail-ch07' ? 'cluster-cryo' : 'cluster-tenant',
          target: fn.id,
          strength: 0.3,
          isFailingLink: true,
        });
      });
    } else if (vizMode === 'SPHERE') {
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

    // Filter nodes and links by seal status check
    if (sealStatusFilter === 'PASSING') {
      rawNodes = rawNodes.filter((n) => !n.failingCheck);
      rawLinks = rawLinks.filter((l) => !l.isFailingLink);
    } else if (sealStatusFilter === 'FAILING') {
      rawNodes = rawNodes.filter((n) => n.failingCheck || n.type === 'ROOT');
      rawLinks = rawLinks.filter((l) => l.isFailingLink || l.target === 'root-849205');
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

    // In CLUSTERED_3D mode, draw subtle constellation orbit rings around clusters
    if (vizMode === 'CLUSTERED_3D') {
      const clusterCenters = [
        { x: -130, y: -55, z: 35, r: 28 },
        { x: -150, y: 65, z: -40, r: 28 },
        { x: 0, y: -130, z: -50, r: 28 },
        { x: 135, y: -60, z: -25, r: 28 },
        { x: 165, y: 55, z: 35, r: 32 },
        { x: 25, y: 120, z: 20, r: 30 },
        { x: -40, y: 20, z: 90, r: 26 },
      ];

      clusterCenters.forEach((c, idx) => {
        const ringSegments = 24;
        const ringPoints = Array.from({ length: ringSegments + 1 }, (_, i) => {
          const theta = (i * 2 * Math.PI) / ringSegments;
          return {
            x: c.x + c.r * Math.cos(theta),
            y: c.y + c.r * Math.sin(theta),
            z: c.z,
          };
        });
        const projectedPoints = ringPoints.map((pt) => projectPoint(pt.x, pt.y, pt.z));
        const lineGen = d3
          .line<{ projX: number; projY: number }>()
          .x((d) => d.projX)
          .y((d) => d.projY);

        g.append('path')
          .datum(projectedPoints)
          .attr('d', lineGen)
          .attr('fill', 'none')
          .attr('stroke', idx % 2 === 0 ? '#06B6D4' : '#10B981')
          .attr('stroke-width', 0.75)
          .attr('stroke-opacity', 0.2)
          .attr('stroke-dasharray', '2,4');
      });
    }

    // Draw Connection Links with pulse animation and failure highlighting
    rawLinks.forEach((link) => {
      const s = nodeMap.get(link.source);
      const t = nodeMap.get(link.target);
      if (!s || !t) return;

      const isFailing = link.isFailingLink || s.failingCheck || t.failingCheck;

      // Base link line
      g.append('line')
        .attr('x1', s.projX)
        .attr('y1', s.projY)
        .attr('x2', t.projX)
        .attr('y2', t.projY)
        .attr('stroke', isFailing ? '#F43F5E' : '#06B6D4')
        .attr('stroke-width', (isFailing ? 2.2 : 1.2) * ((s.scale + t.scale) / 2))
        .attr('stroke-opacity', isFailing ? 0.85 : 0.45 * link.strength)
        .attr('stroke-dasharray', isFailing ? '4,4' : 'none');

      // Pulse particle
      g.append('circle')
        .attr('cx', (s.projX + t.projX) / 2)
        .attr('cy', (s.projY + t.projY) / 2)
        .attr('r', isFailing ? 3.5 : 2.0)
        .attr('fill', isFailing ? '#EF4444' : '#10B981')
        .attr('opacity', isFailing ? 0.95 : 0.75);
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

    // Outer warning pulsating strobe rings for failing nodes
    nodeGroups
      .filter((d) => !!d.failingCheck)
      .append('circle')
      .attr('r', (d) => 24 * d.scale)
      .attr('fill', 'none')
      .attr('stroke', '#F43F5E')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.9)
      .attr('stroke-dasharray', '3,3');

    nodeGroups
      .filter((d) => !!d.failingCheck)
      .append('circle')
      .attr('r', (d) => 32 * d.scale)
      .attr('fill', '#EF4444')
      .attr('fill-opacity', 0.18)
      .attr('stroke', '#FB7185')
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.5);

    // Outer aura ring for root, cluster cores, and master seal
    nodeGroups
      .filter(
        (d) =>
          !d.failingCheck &&
          (d.type === 'ROOT' || d.type === 'CLUSTER_CORE' || d.id === 'leaf-master' || d.id === 'parent-849204')
      )
      .append('circle')
      .attr('r', (d) => (d.type === 'ROOT' ? 19 : d.type === 'CLUSTER_CORE' ? 16 : 14) * d.scale)
      .attr('fill', 'none')
      .attr('stroke', (d) => (d.type === 'ROOT' ? '#D4AF37' : '#06B6D4'))
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.65)
      .attr('stroke-dasharray', '3,3');

    // Main Node Circle
    nodeGroups
      .append('circle')
      .attr('r', (d) => {
        if (d.failingCheck) return 13 * d.scale;
        if (d.type === 'ROOT') return 14 * d.scale;
        if (d.type === 'CLUSTER_CORE') return 10 * d.scale;
        if (d.type === 'MICRO_SEAL') return 2.6 * d.scale;
        return (d.type === 'BRANCH' ? 9 : 7) * d.scale;
      })
      .attr('fill', (d) => {
        if (d.failingCheck) return '#E11D48';
        if (d.type === 'ROOT') return '#D4AF37';
        if (d.type === 'CLUSTER_CORE') return '#06B6D4';
        if (d.type === 'MICRO_SEAL') return '#10B981';
        return d.status === 'ANCHORED_P0' ? '#10B981' : '#06B6D4';
      })
      .attr('stroke', (d) => (d.failingCheck ? '#FFFFFF' : '#070a12'))
      .attr('stroke-width', (d) => (d.failingCheck ? 2 : 1.5))
      .attr('opacity', (d) => (d.type === 'MICRO_SEAL' ? 0.75 : 1));

    // Node Labels (Only for core, root, and failing nodes to keep visualization clean)
    nodeGroups
      .filter((d) => d.type !== 'MICRO_SEAL')
      .append('text')
      .attr('y', (d) => (d.type === 'ROOT' ? -22 : d.failingCheck ? -20 : 20) * d.scale)
      .attr('text-anchor', 'middle')
      .attr('fill', (d) => (d.failingCheck ? '#FCA5A5' : d.type === 'ROOT' ? '#D4AF37' : '#e2e8f0'))
      .attr('font-size', (d) => `${Math.max(9, Math.round((d.failingCheck ? 11 : 10) * d.scale))}px`)
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text((d) => d.name);

    // Connection Strength / Status Check Sub-label
    nodeGroups
      .filter((d) => d.type !== 'MICRO_SEAL')
      .append('text')
      .attr('y', (d) => (d.type === 'ROOT' ? -11 : d.failingCheck ? 28 : 31) * d.scale)
      .attr('text-anchor', 'middle')
      .attr('fill', (d) => (d.failingCheck ? '#F43F5E' : '#10B981'))
      .attr('font-size', '8.5px')
      .attr('font-family', 'monospace')
      .attr('font-weight', (d) => (d.failingCheck ? 'bold' : 'normal'))
      .text((d) =>
        d.failingCheck
          ? '❌ STATUS CHECK FAILED (QUARANTINED)'
          : d.type === 'CLUSTER_CORE'
          ? `${d.seals.toLocaleString()} Seals • Status: VERIFIED`
          : `Conn: ${(d.strength * 100).toFixed(0)}% • Valid 100%`
      );

    // Interactive Hover and Click for Forensics Seal Audit Modal
    nodeGroups
      .on('mouseenter', (event, d) => {
        setHoveredNode(d);
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
      })
      .on('click', (event, d) => {
        playTone(d.failingCheck ? 350 : 920, 0.05);
        setSelectedAuditSeal({ id: d.name, hash: d.hash });
      });
  }, [rotationAngle, pitchAngle, vizMode, sealStatusFilter]);

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

            {/* View Mode Toggle: Clustered 3D vs Sphere vs Tree */}
            <div className="flex items-center bg-[#070a12] p-1 rounded-xl border border-cyan-500/30">
              <button
                onClick={() => {
                  playTone(700, 0.03);
                  copilotAssistantService.setUIRendererMode('CLUSTERED_3D');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  vizMode === 'CLUSTERED_3D'
                    ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                🌐 Clustered 3D (14,902 Seals)
              </button>
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
                🌌 Holographic Sphere
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
                🌲 Merkle Tree
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

        {/* Seal Status Check Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[#070a12] border border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider">
              Status Check Filter:
            </span>
            <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-white/5">
              <button
                onClick={() => {
                  playTone(600, 0.02);
                  setSealStatusFilter('ALL');
                }}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  sealStatusFilter === 'ALL'
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All Seals (14,982 Raw)
              </button>
              <button
                onClick={() => {
                  playTone(600, 0.02);
                  setSealStatusFilter('PASSING');
                }}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  sealStatusFilter === 'PASSING'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-zinc-400 hover:text-emerald-300'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Passing Status (14,902 Frozen)
              </button>
              <button
                onClick={() => {
                  playTone(400, 0.03);
                  setSealStatusFilter('FAILING');
                }}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  sealStatusFilter === 'FAILING'
                    ? 'bg-rose-950 text-rose-300 border border-rose-500/50 shadow-sm shadow-rose-950'
                    : 'text-rose-400/80 hover:text-rose-300'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                ⚠️ Failing Status Checks (Highlighted Alerts)
              </button>
            </div>
          </div>

          {/* Topology Quick Status Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
              P0 Root Anchor
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]" />
              7 Sovereign Clusters
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              Passing Hardware Seals
            </span>
            <span className="flex items-center gap-1 text-rose-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48] ring-2 ring-rose-500 animate-pulse" />
              Failing Check Anomaly
            </span>
          </div>
        </div>

        {/* 3D D3 Holographic Canvas */}
        <div
          ref={containerRef}
          className="w-full relative overflow-hidden bg-[#070a12] rounded-xl border border-white/5 p-2"
        >
          <svg ref={svgRef} className="w-full block" />

          {/* Interactive Hover Diagnostics Overlay */}
          {hoveredNode && (
            <div
              className={`absolute top-4 left-4 max-w-md p-3.5 rounded-xl backdrop-blur-md border shadow-2xl transition-all z-20 pointer-events-none ${
                hoveredNode.failingCheck
                  ? 'bg-rose-950/90 border-rose-500/80 text-rose-100 shadow-rose-950/50'
                  : 'bg-[#0a0f1e]/90 border-cyan-500/40 text-cyan-100'
              }`}
            >
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 mb-2">
                <div className="font-bold text-xs flex items-center gap-1.5">
                  {hoveredNode.failingCheck ? (
                    <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px] animate-pulse">
                      STATUS CHECK ALERT
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px]">
                      STATUS VERIFIED
                    </span>
                  )}
                  <span className="truncate">{hoveredNode.name}</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                  {hoveredNode.seals.toLocaleString()} Seals
                </span>
              </div>

              {hoveredNode.failingCheck && hoveredNode.failReason && (
                <div className="p-2 mb-2 rounded bg-black/50 border border-rose-500/50 text-[11px] text-rose-200 font-sans">
                  {hoveredNode.failReason}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div>
                  <span className="text-zinc-400">HARDWARE UNIT:</span>
                  <div className="text-zinc-200 truncate">{hoveredNode.hardwareUnit || 'Cryptographic SE'}</div>
                </div>
                <div>
                  <span className="text-zinc-400">PHYSICAL VAULT:</span>
                  <div className="text-zinc-200 truncate">{hoveredNode.location || 'Distributed HSM Enclave'}</div>
                </div>
                <div>
                  <span className="text-zinc-400">FIPS STANDARD:</span>
                  <div className="text-zinc-200 truncate">{hoveredNode.fipsLevel || 'FIPS 140-3 Level 4'}</div>
                </div>
                <div>
                  <span className="text-zinc-400">NODE VALIDITY:</span>
                  <div className={hoveredNode.failingCheck ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                    {hoveredNode.validity}% • Conn: {(hoveredNode.strength * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-white/10 text-[9px] text-zinc-400 truncate">
                DIGEST: {hoveredNode.hash}
              </div>
            </div>
          )}

          <div className="absolute bottom-3 right-3 text-[10px] text-zinc-500 bg-black/60 px-2.5 py-1 rounded border border-white/5 pointer-events-none">
            Mode:{' '}
            {vizMode === 'CLUSTERED_3D'
              ? '🌐 14,902 Clustered Topology (3D)'
              : vizMode === 'SPHERE'
              ? '🌌 Holographic Sphere (3D Continuum)'
              : '🌲 Hierarchical Merkle Tree'}{' '}
            • Filter: {sealStatusFilter} • Yaw: {rotationAngle.toFixed(0)}° • Pitch: {pitchAngle}°
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
