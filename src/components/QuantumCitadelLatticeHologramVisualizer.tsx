import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import {
  Orbit,
  Sparkles,
  Maximize2,
  Minimize2,
  RotateCcw,
  Gauge,
  Layers,
  Activity,
  Lock,
  Cpu,
  Zap,
  ShieldCheck,
  Radio,
  Eye,
  Crosshair,
  Volume2,
  VolumeX,
  Compass,
  CheckCircle2,
  X,
  AlertTriangle,
  Flame,
  Thermometer,
  Boxes,
  Grid3X3,
  Network,
  Share2,
  Download,
  Copy,
  Check,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { SYSTEM_METADATA } from '../data/canonicalData';
import { CHAMBERS_DATA, ChamberData } from '../lib/ssot-data';
import { ViewType } from '../types';
import { playTone, playAuditChime } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';

export interface QuantumCitadelLatticeHologramVisualizerProps {
  className?: string;
  expanded?: boolean;
  onToggleExpand?: () => void;
  speedMultiplier?: number;
  interactive?: boolean;
  onSelectChamber?: (chamberId: string) => void;
  onNavigate?: (view: ViewType) => void;
}

export interface ChamberLatticeNode {
  id: string;
  num: string;
  titleEn: string;
  titleTh: string;
  badge: string;
  category: 'core' | 'consensus' | 'quantum' | 'security' | 'legal' | 'data';
  gridPos: [number, number, number]; // [x, y, z] in 3D lattice
  telemetryAmplitude: number; // 0.0 - 1.0 (QOps intensity)
  thermalEntropyMk: number; // Temperature in mK (e.g., 14.98 mK nominal)
  entropyScore: number; // 0.001 - 0.095 ΔS/k
  status: 'NOMINAL' | 'ACTIVE' | 'SEALED' | 'ISOLATED';
  colorHex: number;
  accentColor: string;
  hashAnchor: string;
  targetView: ViewType;
}

// 18 Canonical Sovereign Chambers mapped onto a 6x3 Spatial Lattice with 3D elevations
export const LATTICE_CHAMBERS: ChamberLatticeNode[] = [
  // ROW 1: Chambers 00 - 05
  {
    id: 'ch-00',
    num: '00',
    titleEn: 'Genesis Merkle Root & Sovereign Core',
    titleTh: '00 — รากแก้วเจเนซิส และศูนย์บัญชาการพหุภพ',
    badge: 'GENESIS CORE',
    category: 'core',
    gridPos: [-7.5, 0.4, -4.5],
    telemetryAmplitude: 0.98,
    thermalEntropyMk: 14.98,
    entropyScore: 0.002,
    status: 'SEALED',
    colorHex: 0x06b6d4,
    accentColor: '#06b6d4',
    hashAnchor: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    targetView: 'dashboard'
  },
  {
    id: 'ch-01',
    num: '01',
    titleEn: 'Canonical Core G11 & Execution Engine',
    titleTh: '01 — แกนประมวลผลหลัก G11 และฉันทามติเอกฉันท์',
    badge: 'CONSENSUS G11',
    category: 'consensus',
    gridPos: [-4.5, 0.6, -4.5],
    telemetryAmplitude: 0.95,
    thermalEntropyMk: 15.02,
    entropyScore: 0.005,
    status: 'SEALED',
    colorHex: 0x10b981,
    accentColor: '#10b981',
    hashAnchor: 'sha256-5a13396c129c611f15232fdaf54bfad00c4147abdbc3424c',
    targetView: 'dashboard'
  },
  {
    id: 'ch-02',
    num: '02',
    titleEn: 'Forensics & Quarantine Buffer',
    titleTh: '02 — ศูนย์นิติวิทยาศาสตร์และบัฟเฟอร์กักกัน',
    badge: 'QUARANTINE',
    category: 'security',
    gridPos: [-1.5, 0.2, -4.5],
    telemetryAmplitude: 0.72,
    thermalEntropyMk: 15.45,
    entropyScore: 0.018,
    status: 'ISOLATED',
    colorHex: 0xf59e0b,
    accentColor: '#f59e0b',
    hashAnchor: 'sha256-43fa4c68909ab814479844d8a14816bed34cdbb07528e185',
    targetView: 'security'
  },
  {
    id: 'ch-03',
    num: '03',
    titleEn: 'Sub-Kelvin Qubit Nexus',
    titleTh: '03 — ควอนตัมเน็กซัส 768 คิวบิต ไครโอเจนิกส์',
    badge: 'CRYO NEXUS',
    category: 'quantum',
    gridPos: [1.5, 0.8, -4.5],
    telemetryAmplitude: 0.99,
    thermalEntropyMk: 14.92,
    entropyScore: 0.001,
    status: 'NOMINAL',
    colorHex: 0x8b5cf6,
    accentColor: '#8b5cf6',
    hashAnchor: 'sha256-16bed34cdbb07528e18501da86fc4691763a43fa4c68909a',
    targetView: 'quantum'
  },
  {
    id: 'ch-04',
    num: '04',
    titleEn: 'Neural Knowledge Fabric',
    titleTh: '04 — โครงข่ายความรู้อัตลักษณ์ 768 มิติ',
    badge: 'KNOWLEDGE FABRIC',
    category: 'data',
    gridPos: [4.5, 0.5, -4.5],
    telemetryAmplitude: 0.88,
    thermalEntropyMk: 15.10,
    entropyScore: 0.008,
    status: 'ACTIVE',
    colorHex: 0x3b82f6,
    accentColor: '#3b82f6',
    hashAnchor: 'sha256-86fc4691763a43fa4c68909ab814479844d8a14816bed34c',
    targetView: 'nexus'
  },
  {
    id: 'ch-05',
    num: '05',
    titleEn: 'Sub-Atomic Warp Engine',
    titleTh: '05 — เครื่องขับเคลื่อนวาร์ประดับอนุภาค',
    badge: 'WARP ENGINE',
    category: 'core',
    gridPos: [7.5, 0.7, -4.5],
    telemetryAmplitude: 0.92,
    thermalEntropyMk: 15.15,
    entropyScore: 0.012,
    status: 'NOMINAL',
    colorHex: 0xec4899,
    accentColor: '#ec4899',
    hashAnchor: 'sha256-a18f91a3c091811eb242e1b87d00f28ac37a109e3f19e48c',
    targetView: 'pulse'
  },

  // ROW 2: Chambers 06 - 11
  {
    id: 'ch-06',
    num: '06',
    titleEn: 'Digital Twin Simulation Fabric',
    titleTh: '06 — แฟบริกจำลองฝาแฝดดิจิทัลพหุภพ',
    badge: 'DIGITAL TWIN',
    category: 'core',
    gridPos: [-7.5, 0.5, 0],
    telemetryAmplitude: 0.86,
    thermalEntropyMk: 15.08,
    entropyScore: 0.007,
    status: 'ACTIVE',
    colorHex: 0x06b6d4,
    accentColor: '#06b6d4',
    hashAnchor: 'sha256-b242e1b87d00f28ac37a109e3f19e48cd41d04f29a28a30f',
    targetView: 'matrix'
  },
  {
    id: 'ch-07',
    num: '07',
    titleEn: 'FIOS Treasury & Emergency Gas Reserve',
    titleTh: '07 — คลังสินทรัพย์อธิปไตย และเชื้อเพลิงสำรอง',
    badge: 'FIOS TREASURY',
    category: 'legal',
    gridPos: [-4.5, 0.9, 0],
    telemetryAmplitude: 0.94,
    thermalEntropyMk: 14.95,
    entropyScore: 0.003,
    status: 'SEALED',
    colorHex: 0xf59e0b,
    accentColor: '#f59e0b',
    hashAnchor: 'sha256-c37a109e3f19e48cd41d04f29a28a30fa18f91a3c091811e',
    targetView: 'vault'
  },
  {
    id: 'ch-08',
    num: '08',
    titleEn: 'Identity & Biometric Enclave',
    titleTh: '08 — คลังอัตลักษณ์และข้อมูลชีวมิติเข้ารหัส',
    badge: 'BIOMETRIC VAULT',
    category: 'security',
    gridPos: [-1.5, 0.4, 0],
    telemetryAmplitude: 0.89,
    thermalEntropyMk: 15.01,
    entropyScore: 0.004,
    status: 'SEALED',
    colorHex: 0x10b981,
    accentColor: '#10b981',
    hashAnchor: 'sha256-d41d04f29a28a30fa18f91a3c091811eb242e1b87d00f28a',
    targetView: 'security'
  },
  {
    id: 'ch-09',
    num: '09',
    titleEn: 'Planetary Multi-Mesh Topology',
    titleTh: '09 — ผังโครงข่ายหลายตาข่ายระดับดาวเคราะห์',
    badge: 'MESH TOPOLOGY',
    category: 'data',
    gridPos: [1.5, 0.6, 0],
    telemetryAmplitude: 0.91,
    thermalEntropyMk: 15.12,
    entropyScore: 0.009,
    status: 'ACTIVE',
    colorHex: 0x3b82f6,
    accentColor: '#3b82f6',
    hashAnchor: 'sha256-e533a912bc33f91da18f91a3c091811eb242e1b87d00f28a',
    targetView: 'nexus'
  },
  {
    id: 'ch-10',
    num: '10',
    titleEn: 'Cryptographic HSM Key Ring (10/10)',
    titleTh: '10 — ห่วงโซ่กุญแจฮาร์ดแวร์ FIPS 140-3 L4',
    badge: 'HSM KEYRING',
    category: 'consensus',
    gridPos: [4.5, 0.95, 0],
    telemetryAmplitude: 0.97,
    thermalEntropyMk: 14.94,
    entropyScore: 0.002,
    status: 'SEALED',
    colorHex: 0x8b5cf6,
    accentColor: '#8b5cf6',
    hashAnchor: 'sha256-f691ef002144d18ea18f91a3c091811eb242e1b87d00f28a',
    targetView: 'council'
  },
  {
    id: 'ch-11',
    num: '11',
    titleEn: 'Statutory Legal Safe Harbor (ETDA/PDPA)',
    titleTh: '11 — ท่าเรือปลอดภัยทางกฎหมายและราชกิจจานุเบกษา',
    badge: 'LEGAL VAULT',
    category: 'legal',
    gridPos: [7.5, 0.5, 0],
    telemetryAmplitude: 0.85,
    thermalEntropyMk: 15.05,
    entropyScore: 0.006,
    status: 'SEALED',
    colorHex: 0x06b6d4,
    accentColor: '#06b6d4',
    hashAnchor: 'sha256-a767d2e41155e29fa18f91a3c091811eb242e1b87d00f28a',
    targetView: 'legal'
  },

  // ROW 3: Chambers 12 - 17
  {
    id: 'ch-12',
    num: '12',
    titleEn: 'Chaos Engineering & Thermal Sentinel',
    titleTh: '12 — วิศวกรรมความโกลาหลและเซนติเนลตรวจจับความร้อน',
    badge: 'CHAOS RESILIENCE',
    category: 'security',
    gridPos: [-7.5, 0.6, 4.5],
    telemetryAmplitude: 0.93,
    thermalEntropyMk: 15.22,
    entropyScore: 0.015,
    status: 'NOMINAL',
    colorHex: 0xef4444,
    accentColor: '#ef4444',
    hashAnchor: 'sha256-b805b6329a66f30aa18f91a3c091811eb242e1b87d00f28a',
    targetView: 'security'
  },
  {
    id: 'ch-13',
    num: '13',
    titleEn: 'Air-Gapped Cold Storage Chamber',
    titleTh: '13 — ห้องนิรภัยแอร์แก๊ปแช่แข็งออฟไลน์ถาวร',
    badge: 'COLD STORAGE',
    category: 'security',
    gridPos: [-4.5, 0.3, 4.5],
    telemetryAmplitude: 0.65,
    thermalEntropyMk: 14.88,
    entropyScore: 0.001,
    status: 'SEALED',
    colorHex: 0x06b6d4,
    accentColor: '#06b6d4',
    hashAnchor: 'sha256-c9821c4b9f77a41ba18f91a3c091811eb242e1b87d00f28a',
    targetView: 'vault'
  },
  {
    id: 'ch-14',
    num: '14',
    titleEn: 'Bio-AI Cognitive Ethics Core',
    titleTh: '14 — แกนจริยธรรมปัญญาประดิษฐ์เชิงพุทธิปัญญา',
    badge: 'BIO-AI CORE',
    category: 'quantum',
    gridPos: [-1.5, 0.7, 4.5],
    telemetryAmplitude: 0.88,
    thermalEntropyMk: 15.06,
    entropyScore: 0.006,
    status: 'ACTIVE',
    colorHex: 0x8b5cf6,
    accentColor: '#8b5cf6',
    hashAnchor: 'sha256-d0992d5c0e88b52ca18f91a3c091811eb242e1b87d00f28a',
    targetView: 'nexus'
  },
  {
    id: 'ch-15',
    num: '15',
    titleEn: 'Sovereign Civilization Control Plane',
    titleTh: '15 — ระนาบควบคุมระเบียบอารยธรรมดิจิทัล',
    badge: 'CIVILIZATION PLANE',
    category: 'core',
    gridPos: [1.5, 0.85, 4.5],
    telemetryAmplitude: 0.96,
    thermalEntropyMk: 14.99,
    entropyScore: 0.003,
    status: 'NOMINAL',
    colorHex: 0xf59e0b,
    accentColor: '#f59e0b',
    hashAnchor: 'sha256-e1aa3e6d1f99c63da18f91a3c091811eb242e1b87d00f28a',
    targetView: 'dashboard'
  },
  {
    id: 'ch-16',
    num: '16',
    titleEn: 'Cross-Border PDPA Data Enclave',
    titleTh: '16 — เอนเคลฟคุ้มครองข้อมูลข้ามแดน มาตรา ๒๘',
    badge: 'PDPA CROSS-BORDER',
    category: 'legal',
    gridPos: [4.5, 0.5, 4.5],
    telemetryAmplitude: 0.87,
    thermalEntropyMk: 15.04,
    entropyScore: 0.005,
    status: 'SEALED',
    colorHex: 0x10b981,
    accentColor: '#10b981',
    hashAnchor: 'sha256-f2bb4f7e20aad74ea18f91a3c091811eb242e1b87d00f28a',
    targetView: 'legal'
  },
  {
    id: 'ch-17',
    num: '17',
    titleEn: 'Audit Trail Ledger & Replay Engine V25',
    titleTh: '17 — สมุดบัญชีหลักฐานและเอนจินย้อนรอยประวัติพยาน',
    badge: 'AUDIT LEDGER',
    category: 'consensus',
    gridPos: [7.5, 0.9, 4.5],
    telemetryAmplitude: 0.98,
    thermalEntropyMk: 14.97,
    entropyScore: 0.002,
    status: 'SEALED',
    colorHex: 0x10b981,
    accentColor: '#10b981',
    hashAnchor: 'sha256-03cc508f31bbe85fa18f91a3c091811eb242e1b87d00f28a',
    targetView: 'ledger'
  }
];

export const QuantumCitadelLatticeHologramVisualizer: React.FC<QuantumCitadelLatticeHologramVisualizerProps> = ({
  className = '',
  expanded = false,
  onToggleExpand,
  speedMultiplier = 1.0,
  interactive = true,
  onSelectChamber,
  onNavigate
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Three.js State Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const chamberMeshesRef = useRef<Map<string, { group: THREE.Group; core: THREE.Mesh; beam: THREE.Mesh; rings: THREE.Mesh[] }>>(new Map());
  const particlesRef = useRef<THREE.Points | null>(null);
  const streamParticlesRef = useRef<{
    points: THREE.Points;
    segments: { p1: THREE.Vector3; p2: THREE.Vector3; speed: number; progress: number }[];
    count: number;
  } | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Interactive Camera Angle & Rotation
  const cameraAngleRef = useRef({ x: 0.42, y: 0.35, dist: 22 });
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // UI State
  const [selectedNode, setSelectedNode] = useState<ChamberLatticeNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<ChamberLatticeNode | null>(null);
  const [shadingMode, setShadingMode] = useState<'HOLO_NEON' | 'THERMAL_ENTROPY' | 'AMPLITUDE_BEACON' | 'WIREFRAME'>('HOLO_NEON');
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState<number>(speedMultiplier);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [telemetryTick, setTelemetryTick] = useState<number>(0);

  // Sound throttler
  const lastSoundTimeRef = useRef<number>(0);

  // Camera presets
  const setCameraPreset = (mode: 'ISO' | 'TOP' | 'FRONT' | 'RESET') => {
    if (mode === 'ISO') {
      cameraAngleRef.current = { x: 0.45, y: 0.45, dist: 22 };
    } else if (mode === 'TOP') {
      cameraAngleRef.current = { x: 1.45, y: 0.0, dist: 20 };
    } else if (mode === 'FRONT') {
      cameraAngleRef.current = { x: 0.05, y: 0.0, dist: 22 };
    } else {
      cameraAngleRef.current = { x: 0.42, y: 0.35, dist: 22 };
    }
    playTone(660, 0.04);
  };

  // Setup Three.js Scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x04060c, 0.035);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(12, 14, 18);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x0a1026, 2.5);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x06b6d4, 4.0, 50);
    pointLight1.position.set(0, 10, 0);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x8b5cf6, 2.5, 40);
    pointLight2.position.set(-10, -5, -10);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0x10b981, 2.5, 40);
    pointLight3.position.set(10, -5, 10);
    scene.add(pointLight3);

    // 1. Holographic Floor Grid
    const gridHelper = new THREE.GridHelper(26, 26, 0x06b6d4, 0x0f2038);
    gridHelper.position.y = -1.5;
    scene.add(gridHelper);

    // 2. Cosmic Ambient Floating Particles
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePos[i] = (Math.random() - 0.5) * 30;
      particlePos[i + 1] = (Math.random() - 0.5) * 15 + 2;
      particlePos[i + 2] = (Math.random() - 0.5) * 30;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.12,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    particlesRef.current = particles;

    // 3. Build 18 Chamber Hologram Nodes
    chamberMeshesRef.current.clear();

    LATTICE_CHAMBERS.forEach((chamber) => {
      const group = new THREE.Group();
      group.position.set(chamber.gridPos[0], chamber.gridPos[1], chamber.gridPos[2]);
      group.userData = { chamberId: chamber.id, chamberData: chamber };

      // Core Crystal (Octahedron / Icosahedron)
      const coreGeo = new THREE.OctahedronGeometry(0.65, 0);
      const coreMat = new THREE.MeshStandardMaterial({
        color: chamber.colorHex,
        emissive: chamber.colorHex,
        emissiveIntensity: 0.8,
        roughness: 0.2,
        metalness: 0.8,
        wireframe: false,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreMesh.castShadow = true;
      group.add(coreMesh);

      // Outer Wireframe Cage (Box)
      const cageGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
      const cageMat = new THREE.MeshBasicMaterial({
        color: chamber.colorHex,
        wireframe: true,
        transparent: true,
        opacity: 0.45
      });
      const cageMesh = new THREE.Mesh(cageGeo, cageMat);
      group.add(cageMesh);

      // Vertical Telemetry Amplitude Beacon Beam
      const beamHeight = 2.0 + chamber.telemetryAmplitude * 3.5;
      const beamGeo = new THREE.CylinderGeometry(0.04, 0.12, beamHeight, 8);
      const beamMat = new THREE.MeshBasicMaterial({
        color: chamber.colorHex,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      });
      const beamMesh = new THREE.Mesh(beamGeo, beamMat);
      beamMesh.position.y = beamHeight / 2;
      group.add(beamMesh);

      // Orbital Resonance Rings
      const ringGeo = new THREE.RingGeometry(1.0, 1.05, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: chamber.colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
      });
      const ringMesh1 = new THREE.Mesh(ringGeo, ringMat);
      ringMesh1.rotation.x = Math.PI / 2;
      group.add(ringMesh1);

      const ringMesh2 = new THREE.Mesh(ringGeo, ringMat);
      ringMesh2.rotation.y = Math.PI / 4;
      group.add(ringMesh2);

      scene.add(group);
      chamberMeshesRef.current.set(chamber.id, {
        group,
        core: coreMesh,
        beam: beamMesh,
        rings: [ringMesh1, ringMesh2]
      });
    });

    // 4. Connect Merkle Lineage Lattice Beams
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });

    const streamSegments: { p1: THREE.Vector3; p2: THREE.Vector3; speed: number; progress: number }[] = [];

    for (let i = 0; i < LATTICE_CHAMBERS.length - 1; i++) {
      const p1 = new THREE.Vector3(...LATTICE_CHAMBERS[i].gridPos);
      const p2 = new THREE.Vector3(...LATTICE_CHAMBERS[i + 1].gridPos);
      const lineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      const line = new THREE.Line(lineGeo, lineMaterial);
      scene.add(line);
      streamSegments.push({
        p1,
        p2,
        speed: 0.3 + (i % 3) * 0.15,
        progress: (i * 0.17) % 1.0
      });
    }

    // Connect everything back to Genesis Chamber 00
    const genesisPos = new THREE.Vector3(...LATTICE_CHAMBERS[0].gridPos);
    for (let i = 1; i < LATTICE_CHAMBERS.length; i += 3) {
      const targetPos = new THREE.Vector3(...LATTICE_CHAMBERS[i].gridPos);
      const beamGeo = new THREE.BufferGeometry().setFromPoints([genesisPos, targetPos]);
      const beamLine = new THREE.Line(
        beamGeo,
        new THREE.LineBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.2,
          blending: THREE.AdditiveBlending
        })
      );
      scene.add(beamLine);
      streamSegments.push({
        p1: genesisPos,
        p2: targetPos,
        speed: 0.45,
        progress: (i * 0.23) % 1.0
      });
    }

    // Conduit Data Packet Stream Particles
    const streamCount = streamSegments.length;
    const streamGeo = new THREE.BufferGeometry();
    const streamPositions = new Float32Array(streamCount * 3);
    streamGeo.setAttribute('position', new THREE.BufferAttribute(streamPositions, 3));
    const streamMat = new THREE.PointsMaterial({
      size: 0.28,
      color: 0x34d399,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    const streamPoints = new THREE.Points(streamGeo, streamMat);
    scene.add(streamPoints);
    streamParticlesRef.current = {
      points: streamPoints,
      segments: streamSegments,
      count: streamCount
    };

    // Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Camera Position derived from spherical coordinates
      if (autoRotate && !isDraggingRef.current) {
        cameraAngleRef.current.y += 0.003 * rotationSpeed;
      }

      const { x: pitch, y: yaw, dist } = cameraAngleRef.current;
      camera.position.x = dist * Math.sin(yaw) * Math.cos(pitch);
      camera.position.y = dist * Math.sin(pitch);
      camera.position.z = dist * Math.cos(yaw) * Math.cos(pitch);
      camera.lookAt(0, 0.5, 0);

      // Node Dynamic Oscillations & Telemetry Amplitude Wave
      chamberMeshesRef.current.forEach(({ group, core, beam, rings }, id) => {
        const chamber = LATTICE_CHAMBERS.find((c) => c.id === id);
        if (!chamber) return;

        // Subtle floating motion
        const floatOffset = Math.sin(elapsedTime * 2.0 + chamber.telemetryAmplitude * 5) * 0.15;
        group.position.y = chamber.gridPos[1] + floatOffset;

        // Core rotation
        core.rotation.x += 0.015;
        core.rotation.y += 0.02;

        // Rings rotation
        rings[0].rotation.z += 0.01;
        rings[1].rotation.x += 0.012;

        // Beacon scale oscillation based on QOps intensity
        const pulse = 1.0 + Math.sin(elapsedTime * 4.0 + chamber.telemetryAmplitude * 8) * 0.15;
        beam.scale.set(pulse, 1.0 + pulse * 0.2, pulse);
      });

      // Ambient Particles drift
      if (particlesRef.current) {
        particlesRef.current.rotation.y = elapsedTime * 0.03;
      }

      // Conduit Data Stream Pulses (Packets moving along lattice links)
      if (streamParticlesRef.current) {
        const { points, segments, count } = streamParticlesRef.current;
        const posAttr = points.geometry.getAttribute('position') as THREE.BufferAttribute;
        if (posAttr) {
          const arr = posAttr.array as Float32Array;
          for (let i = 0; i < count; i++) {
            const seg = segments[i];
            seg.progress = (seg.progress + delta * seg.speed) % 1.0;
            const currentX = seg.p1.x + (seg.p2.x - seg.p1.x) * seg.progress;
            const currentY = seg.p1.y + (seg.p2.y - seg.p1.y) * seg.progress;
            const currentZ = seg.p1.z + (seg.p2.z - seg.p1.z) * seg.progress;
            arr[i * 3] = currentX;
            arr[i * 3 + 1] = currentY;
            arr[i * 3 + 2] = currentZ;
          }
          posAttr.needsUpdate = true;
        }
      }

      renderer.render(scene, camera);
      animFrameIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    // ResizeObserver with requestAnimationFrame guard
    let resizeRafId: number | null = null;
    const resizeObserver = new ResizeObserver((entries) => {
      if (resizeRafId !== null) {
        cancelAnimationFrame(resizeRafId);
      }
      resizeRafId = requestAnimationFrame(() => {
        for (const entry of entries) {
          const { width: newWidth, height: newHeight } = entry.contentRect;
          if (newWidth > 0 && newHeight > 0 && cameraRef.current && rendererRef.current) {
            cameraRef.current.aspect = newWidth / newHeight;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(newWidth, newHeight);
          }
        }
      });
    });

    resizeObserver.observe(containerRef.current);

    // Periodic telemetry state refresh for UI meters
    const telemetryInterval = setInterval(() => {
      setTelemetryTick((prev) => prev + 1);
    }, 1500);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      resizeObserver.disconnect();
      clearInterval(telemetryInterval);
      renderer.dispose();
    };
  }, [autoRotate, rotationSpeed]);

  // Pointer Interaction Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      const deltaX = e.clientX - lastMousePosRef.current.x;
      const deltaY = e.clientY - lastMousePosRef.current.y;

      cameraAngleRef.current.y -= deltaX * 0.006;
      cameraAngleRef.current.x = Math.max(-1.2, Math.min(1.4, cameraAngleRef.current.x + deltaY * 0.006));

      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Raycasting for Hover Detection
    if (!canvasRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    const interactables: THREE.Object3D[] = [];
    chamberMeshesRef.current.forEach(({ group }) => {
      interactables.push(...group.children);
    });

    const intersects = raycaster.intersectObjects(interactables, false);

    if (intersects.length > 0) {
      const parentGroup = intersects[0].object.parent;
      if (parentGroup && parentGroup.userData?.chamberData) {
        const hovered = parentGroup.userData.chamberData as ChamberLatticeNode;
        if (hoveredNode?.id !== hovered.id) {
          setHoveredNode(hovered);
          const now = Date.now();
          if (now - lastSoundTimeRef.current > 150) {
            playTone(720 + parseInt(hovered.num, 10) * 15, 0.02);
            lastSoundTimeRef.current = now;
          }
        }
      }
    } else {
      if (hoveredNode !== null) {
        setHoveredNode(null);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;

    // Raycasting for Click Selection
    if (!canvasRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    const interactables: THREE.Object3D[] = [];
    chamberMeshesRef.current.forEach(({ group }) => {
      interactables.push(...group.children);
    });

    const intersects = raycaster.intersectObjects(interactables, false);

    if (intersects.length > 0) {
      const parentGroup = intersects[0].object.parent;
      if (parentGroup && parentGroup.userData?.chamberData) {
        const clicked = parentGroup.userData.chamberData as ChamberLatticeNode;
        setSelectedNode(clicked);
        playAuditChime();
        onSelectChamber?.(clicked.id);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    cameraAngleRef.current.dist = Math.max(10, Math.min(36, cameraAngleRef.current.dist + e.deltaY * 0.02));
  };

  // Shading Mode updates
  useEffect(() => {
    chamberMeshesRef.current.forEach(({ core, beam, rings }, id) => {
      const chamber = LATTICE_CHAMBERS.find((c) => c.id === id);
      if (!chamber) return;

      const coreMat = core.material as THREE.MeshStandardMaterial;
      const beamMat = beam.material as THREE.MeshBasicMaterial;

      if (shadingMode === 'THERMAL_ENTROPY') {
        // Shaded by cryo temperature: 14.88mK (cyan) -> 15.45mK (amber/red)
        const heatColor =
          chamber.thermalEntropyMk < 15.0
            ? 0x06b6d4
            : chamber.thermalEntropyMk < 15.2
            ? 0x10b981
            : chamber.thermalEntropyMk < 15.4
            ? 0xf59e0b
            : 0xef4444;
        coreMat.color.setHex(heatColor);
        coreMat.emissive.setHex(heatColor);
        beamMat.color.setHex(heatColor);
      } else if (shadingMode === 'AMPLITUDE_BEACON') {
        coreMat.color.setHex(0x38bdf8);
        coreMat.emissive.setHex(0x06b6d4);
        beamMat.color.setHex(0x38bdf8);
      } else if (shadingMode === 'WIREFRAME') {
        coreMat.wireframe = true;
      } else {
        coreMat.wireframe = false;
        coreMat.color.setHex(chamber.colorHex);
        coreMat.emissive.setHex(chamber.colorHex);
        beamMat.color.setHex(chamber.colorHex);
      }
    });
  }, [shadingMode]);

  const handleCopy = (text: string, label: string) => {
    copyToClipboard(text);
    setCopiedHash(text);
    playTone(880, 0.04);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  return (
    <div
      ref={containerRef}
      className={`relative rounded-[28px] bg-gradient-to-b from-[#080b18]/95 via-[#060812]/90 to-[#030408] border border-cyan-500/20 backdrop-blur-2xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.12)] flex flex-col ${
        expanded ? 'fixed inset-4 z-50 rounded-2xl' : 'min-h-[560px] h-[640px]'
      } ${className}`}
    >
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Hologram Scanlines & Vignette Filter */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(4,6,12,0.6)_100%)]" />
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:100%_4px]" />

      {/* Top HUD Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pointer-events-none font-mono">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)] shrink-0">
            <Orbit className="w-5 h-5 text-cyan-300 animate-spin" style={{ animationDuration: '28s' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-white tracking-wider">
                3D QUANTUM CITADEL LATTICE
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-[10px] text-cyan-300 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                18 CHAMBERS
              </span>
            </div>
            <p className="text-[10px] text-zinc-400">
              Three.js Hologram Mesh • Real-Time Telemetry Amplitude & Thermal Entropy
            </p>
          </div>
        </div>

        {/* Shading & Control Mode Selector */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto self-end sm:self-auto">
          <div className="flex items-center bg-black/70 p-1 rounded-xl border border-white/10 text-xs backdrop-blur-xl">
            <button
              onClick={() => {
                playTone(600, 0.03);
                setShadingMode('HOLO_NEON');
              }}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                shadingMode === 'HOLO_NEON'
                  ? 'bg-cyan-500/25 text-cyan-200 font-bold border border-cyan-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Holo Neon
            </button>
            <button
              onClick={() => {
                playTone(630, 0.03);
                setShadingMode('THERMAL_ENTROPY');
              }}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                shadingMode === 'THERMAL_ENTROPY'
                  ? 'bg-amber-500/25 text-amber-200 font-bold border border-amber-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Thermometer className="w-3 h-3 text-amber-400" />
              <span>Entropy Heat</span>
            </button>
            <button
              onClick={() => {
                playTone(660, 0.03);
                setShadingMode('AMPLITUDE_BEACON');
              }}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                shadingMode === 'AMPLITUDE_BEACON'
                  ? 'bg-purple-500/25 text-purple-200 font-bold border border-purple-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Zap className="w-3 h-3 text-purple-400" />
              <span>Amplitude</span>
            </button>
          </div>

          <button
            onClick={() => {
              setAutoRotate(!autoRotate);
              playTone(autoRotate ? 500 : 700, 0.03);
            }}
            title={autoRotate ? 'Pause Rotation' : 'Auto Rotate'}
            className={`p-2 rounded-xl border text-xs transition-all backdrop-blur-xl ${
              autoRotate
                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
                : 'bg-black/60 border-white/10 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
          </button>

          {onToggleExpand && (
            <button
              onClick={() => {
                onToggleExpand();
                playTone(620, 0.04);
              }}
              className="p-2 rounded-xl bg-black/60 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white transition-colors backdrop-blur-xl"
            >
              {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Camera View Angle Shortcuts (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-1.5 pointer-events-auto font-mono text-[11px] bg-black/70 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl">
        <span className="text-zinc-500 px-1 text-[10px]">CAM:</span>
        <button
          onClick={() => setCameraPreset('ISO')}
          className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all"
        >
          Isometric
        </button>
        <button
          onClick={() => setCameraPreset('TOP')}
          className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all"
        >
          Top-Down
        </button>
        <button
          onClick={() => setCameraPreset('FRONT')}
          className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all"
        >
          Elevation
        </button>
        <button
          onClick={() => setCameraPreset('RESET')}
          className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 hover:text-cyan-100 transition-all"
        >
          Reset
        </button>
      </div>

      {/* Real-time Telemetry Status Strip (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-10 hidden sm:flex items-center gap-3 pointer-events-auto font-mono text-[11px] bg-black/80 px-3.5 py-2 rounded-2xl border border-white/10 backdrop-blur-xl text-zinc-300">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          <span>Cryo: <strong className="text-blue-300">14.98 mK</strong></span>
        </div>
        <div className="w-px h-3 bg-white/10" />
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>QOps: <strong className="text-cyan-300">851.9/s</strong></span>
        </div>
        <div className="w-px h-3 bg-white/10" />
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-purple-400" />
          <span>Coherence: <strong className="text-purple-300">99.992%</strong></span>
        </div>
      </div>

      {/* Hover Node Preview Tooltip */}
      {hoveredNode && !selectedNode && (
        <div className="absolute top-20 left-4 z-20 p-3.5 rounded-2xl bg-black/85 border border-cyan-500/40 backdrop-blur-xl font-mono text-xs shadow-2xl pointer-events-none max-w-xs space-y-1.5 animate-in fade-in">
          <div className="flex items-center justify-between gap-2">
            <span className="text-cyan-300 font-bold">CHAMBER {hoveredNode.num}</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/15 text-cyan-200 border border-cyan-500/30 font-bold">
              {hoveredNode.badge}
            </span>
          </div>
          <div className="text-white font-bold text-xs">{hoveredNode.titleTh}</div>
          <div className="text-[11px] text-zinc-400">{hoveredNode.titleEn}</div>
          <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-white/10">
            <span>Amplitude: <strong className="text-cyan-300">{(hoveredNode.telemetryAmplitude * 100).toFixed(0)}%</strong></span>
            <span>Entropy: <strong className="text-amber-300">{hoveredNode.thermalEntropyMk} mK</strong></span>
          </div>
        </div>
      )}

      {/* Selected Chamber Detail Modal / Side HUD */}
      {selectedNode && (
        <div className="absolute top-16 right-4 z-30 w-80 max-w-[calc(100%-2rem)] p-4 rounded-2xl bg-black/90 border border-cyan-400/50 backdrop-blur-2xl font-mono text-xs shadow-[0_0_40px_rgba(6,182,212,0.25)] space-y-3 animate-in fade-in slide-in-from-right-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center font-bold text-xs">
                {selectedNode.num}
              </span>
              <div>
                <div className="text-white font-bold text-xs line-clamp-1">{selectedNode.titleEn}</div>
                <div className="text-[10px] text-cyan-300">{selectedNode.titleTh}</div>
              </div>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
              <div className="text-zinc-400">TELEMETRY AMPLITUDE</div>
              <div className="text-sm font-bold text-cyan-300">
                {(selectedNode.telemetryAmplitude * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
              <div className="text-zinc-400">THERMAL ENTROPY</div>
              <div className="text-sm font-bold text-amber-300">
                {selectedNode.thermalEntropyMk} mK
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 space-y-1 text-[10px]">
            <div className="text-zinc-400 flex items-center justify-between">
              <span>STATUS: <strong className="text-emerald-300">{selectedNode.status}</strong></span>
              <span>ENTROPY: <strong className="text-cyan-300">{selectedNode.entropyScore} ΔS/k</strong></span>
            </div>
            <div
              onClick={() => handleCopy(selectedNode.hashAnchor, `Anchor Hash for Chamber ${selectedNode.num}`)}
              className="text-zinc-500 font-mono truncate cursor-pointer hover:text-cyan-300 flex items-center justify-between pt-1 border-t border-white/5"
              title="Click to copy hash anchor"
            >
              <span>Hash: {selectedNode.hashAnchor.slice(0, 18)}...</span>
              <Copy className="w-2.5 h-2.5 opacity-70 ml-1 shrink-0" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate(selectedNode.targetView);
                }
              }}
              className="flex-1 py-2 rounded-xl bg-gradient-to-r from-cyan-600/30 to-emerald-600/30 hover:from-cyan-500/40 hover:to-emerald-500/40 border border-cyan-400/50 text-cyan-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
            >
              <span>Navigate to Chamber</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
