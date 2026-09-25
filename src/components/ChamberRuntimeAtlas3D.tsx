import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
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
} from 'lucide-react';
import { SYSTEM_METADATA, CANONICAL_MODULES, THAI_CUSTODIANS } from '../data/canonicalData';
import { playTone, playAuditChime } from './AudioSynthesizer';

export interface ChamberRuntimeAtlas3DProps {
  className?: string;
  expanded?: boolean;
  onToggleExpand?: () => void;
  speedMultiplier?: number;
  interactive?: boolean;
  onSelectChamber?: (chamberId: string) => void;
}

interface ChamberNodeData {
  id: string;
  chamberNum: string;
  nameEn: string;
  nameTh: string;
  category: 'core' | 'ai' | 'data' | 'workflow' | 'governance' | 'security' | 'genesis';
  color: string;
  emissive: string;
  pos: [number, number, number];
  metrics: { label: string; value: string; status: 'nominal' | 'active' | 'sync' }[];
  clearance: string;
  hash: string;
  status: string;
}

// 18 Canonical Chamber Nodes & Quorum Coordinates mapped across 3D orbital rings
const CHAMBER_NODES: ChamberNodeData[] = [
  {
    id: 'chamber_00_genesis',
    chamberNum: '00',
    nameEn: 'Genesis Merkle Sovereign Core',
    nameTh: '00 — ศูนย์กลางเกเนซิสอธิปไตย',
    category: 'genesis',
    color: '#FFD700',
    emissive: '#FFB700',
    pos: [0, 0, 0],
    metrics: [
      { label: 'Canonical Seals', value: '14,902 / 14,902', status: 'nominal' },
      { label: 'SSoT Mutation', value: '0 (Immutable)', status: 'nominal' },
      { label: 'Block Height', value: '#849202', status: 'nominal' },
    ],
    clearance: 'OMEGA-1 SUPREME CLEARANCE',
    hash: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    status: 'REAL_HSM_SEALED',
  },
  {
    id: 'chamber_01_core',
    chamberNum: '01',
    nameEn: 'Core Kernel & Decision Dispatch',
    nameTh: '01 — เคอร์เนลควบคุมและตัดสินใจหลัก',
    category: 'core',
    color: '#06B6D4',
    emissive: '#0891B2',
    pos: [2.6, 0.4, 1.2],
    metrics: [
      { label: 'Core Precision', value: '99.98%', status: 'nominal' },
      { label: 'Kernel Latency', value: '1.2ms', status: 'nominal' },
      { label: 'Energy Dispatch', value: '851.9 QOps/s', status: 'active' },
    ],
    clearance: 'LEVEL 25 SOVEREIGN GOVERNOR',
    hash: 'sha256-a18f91a3c091811eb242e1b87d00f28a',
    status: 'ACTIVE_FAIL_CLOSED',
  },
  {
    id: 'chamber_02_ai',
    chamberNum: '02',
    nameEn: 'Mythic AI Council & Reasoning',
    nameTh: '02 — เอนจินปัญญาประดิษฐ์และเอเจนต์',
    category: 'ai',
    color: '#A855F7',
    emissive: '#9333EA',
    pos: [1.8, 1.9, -1.5],
    metrics: [
      { label: 'Tri-Agent Council', value: 'Valerie, Chronos, Athena', status: 'active' },
      { label: 'Model Latency', value: '180ms', status: 'nominal' },
      { label: 'Context Coherence', value: '99.4%', status: 'nominal' },
    ],
    clearance: 'LEVEL 20 REASONING ARCHITECT',
    hash: 'sha256-c37a109e3f19e48cd41d04f29a28a30f',
    status: 'SYNCHRONIZED',
  },
  {
    id: 'chamber_03_data',
    chamberNum: '03',
    nameEn: 'Vector Codex & Memory Fabric',
    nameTh: '03 — คลังข้อมูลและเวกเตอร์ 768-มิติ',
    category: 'data',
    color: '#3B82F6',
    emissive: '#2563EB',
    pos: [-2.2, 1.2, 1.8],
    metrics: [
      { label: 'Vector Nodes', value: '768 Dimensions', status: 'active' },
      { label: 'Cache Hit Ratio', value: '98.2%', status: 'nominal' },
      { label: 'Storage Capacity', value: '1.4 TB / 10 TB', status: 'nominal' },
    ],
    clearance: 'LEVEL 18 DATA CUSTODIAN',
    hash: 'sha256-d41d04f29a28a30fa18f91a3c091811e',
    status: 'PERSISTED_ENCRYPTED',
  },
  {
    id: 'chamber_04_workflow',
    chamberNum: '04',
    nameEn: 'Visual Orchestration & Task DAG',
    nameTh: '04 — เวิร์กโฟลว์และระบบอัตโนมัติ',
    category: 'workflow',
    color: '#EC4899',
    emissive: '#DB2777',
    pos: [-2.5, -0.8, -1.4],
    metrics: [
      { label: 'Active Pipelines', value: '18 Running', status: 'active' },
      { label: 'Pipeline Health', value: '100% Passed', status: 'nominal' },
    ],
    clearance: 'LEVEL 16 AUTOMATION MASTER',
    hash: 'sha256-e533a912bc33e48cd41d04f29a28a30f',
    status: 'ACTIVE_STREAMING',
  },
  {
    id: 'chamber_05_governance',
    chamberNum: '05',
    nameEn: 'Constitution & Veto Protocol',
    nameTh: '05 — สภากำกับดูแลและธรรมาภิบาล',
    category: 'governance',
    color: '#F59E0B',
    emissive: '#D97706',
    pos: [0.8, -2.4, 1.6],
    metrics: [
      { label: 'Active Vetoes', value: '0 (Clear)', status: 'nominal' },
      { label: 'Compliance Score', value: '100% Passed', status: 'nominal' },
    ],
    clearance: 'OMEGA LEVEL 1 CONSTITUTIONAL',
    hash: 'sha256-f644b023cd44a30fa18f91a3c091811e',
    status: 'VERIFIED_CANONICAL',
  },
  {
    id: 'chamber_06_security',
    chamberNum: '06',
    nameEn: 'PQC Firewall & Deca-Key Quorum',
    nameTh: '06 — ความปลอดภัย ML-DSA-87 และ 10/10 HSM',
    category: 'security',
    color: '#10B981',
    emissive: '#059669',
    pos: [-1.4, -2.1, -1.8],
    metrics: [
      { label: 'HSM Quorum', value: '10/10 Signed', status: 'nominal' },
      { label: 'PQC Algorithm', value: 'FIPS 204 Dilithium-5', status: 'nominal' },
    ],
    clearance: 'LEVEL 25 POST-QUANTUM DEFENDER',
    hash: 'sha256-5a13396c129c611f15232fdaf54bfad0',
    status: 'PROTECTED_QUORUM',
  },
  {
    id: 'chamber_07_forensics',
    chamberNum: '07',
    nameEn: 'Digital Forensics & Deterministic Replay',
    nameTh: '07 — นิติวิทยาศาสตร์ดิจิทัลและการรื้อรอย',
    category: 'governance',
    color: '#6366F1',
    emissive: '#4F46E5',
    pos: [2.2, -1.6, -1.1],
    metrics: [
      { label: 'Trace Replay', value: '142ms Bit-for-Bit', status: 'nominal' },
      { label: 'Standard', value: 'ISO/IEC 27037', status: 'nominal' },
    ],
    clearance: 'LEVEL 18 FORENSIC AUDITOR',
    hash: 'sha256-7b24c134de55c091811eb242e1b87d00',
    status: 'REPLAY_VERIFIED',
  },
  {
    id: 'chamber_08_pdpa',
    chamberNum: '08',
    nameEn: 'PDPA Enclave & Thai Sovereignty',
    nameTh: '08 — ตู้นิรภัยคุ้มครองข้อมูลส่วนบุคคล PDPA',
    category: 'security',
    color: '#14B8A6',
    emissive: '#0D9488',
    pos: [-0.5, 2.7, -1.2],
    metrics: [
      { label: 'PDPA Compliance', value: '100% Enforced', status: 'nominal' },
      { label: 'ETDA Law', value: 'Section 9, 26, 28 Passed', status: 'nominal' },
    ],
    clearance: 'LEVEL 20 PDPA CUSTODIAN',
    hash: 'sha256-8c35d245ef66d41d04f29a28a30fa18f',
    status: 'LAW_COMPLIANT',
  },
  {
    id: 'chamber_09_cryo',
    chamberNum: '09',
    nameEn: 'Sub-Kelvin Cryogenic Cryostat',
    nameTh: '09 — ห้องควบคุมความเย็นยวดยิ่ง 14.98 mK',
    category: 'core',
    color: '#38BDF8',
    emissive: '#0284C7',
    pos: [1.2, 2.4, 1.5],
    metrics: [
      { label: 'Cryo Temp', value: '14.98 mK', status: 'nominal' },
      { label: 'Coolant', value: '100% Helium-4', status: 'nominal' },
    ],
    clearance: 'LEVEL 16 CRYO PHYSICIST',
    hash: 'sha256-9d46e356fa77e533a912bc33e48cd41d',
    status: 'SUPERCONDUCTING',
  },
  {
    id: 'chamber_10_fios',
    chamberNum: '10',
    nameEn: 'FIOS Orbital Telemetry Twin',
    nameTh: '10 — โทรมาตรดาวเทียมและดิจิทัลทวิน FIOS',
    category: 'data',
    color: '#8B5CF6',
    emissive: '#7C3AED',
    pos: [-2.7, 1.4, -0.6],
    metrics: [
      { label: 'Sensors', value: '88.4% Nominal Load', status: 'active' },
      { label: 'Isolation', value: 'Shadow Reconciliation', status: 'nominal' },
    ],
    clearance: 'LEVEL 18 ORBITAL CONTROLLER',
    hash: 'sha256-49089fcf2ac4e334cfbb88db1aa7a748',
    status: 'ISOLATED_BUFFER',
  },
  {
    id: 'chamber_11_entropy',
    chamberNum: '11',
    nameEn: 'Quantum Entropy Wave Generator',
    nameTh: '11 — เครื่องกำเนิดคลื่นเอนโทรปีเชิงควอนตัม',
    category: 'core',
    color: '#F43F5E',
    emissive: '#E11D48',
    pos: [2.8, -0.5, -1.8],
    metrics: [
      { label: 'Entropy Level', value: '0.082 Coherent', status: 'active' },
      { label: 'Flux Frequency', value: '882.0 Hz Carrier', status: 'nominal' },
    ],
    clearance: 'LEVEL 22 ENTROPY ARCHITECT',
    hash: 'sha256-bf57f467ab88c37a109e3f19e48cd41d',
    status: 'PULSING_882HZ',
  },
];

export const ChamberRuntimeAtlas3D: React.FC<ChamberRuntimeAtlas3DProps> = ({
  className = '',
  expanded = false,
  onToggleExpand,
  speedMultiplier = 1.0,
  interactive = true,
  onSelectChamber,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animIdRef = useRef<number>(0);

  // Mesh refs for animated transformations
  const coreIcoRef = useRef<THREE.Mesh | null>(null);
  const torusRingsRef = useRef<THREE.Mesh[]>([]);
  const nodeMeshesRef = useRef<{ mesh: THREE.Mesh; data: ChamberNodeData; halo: THREE.Mesh }[]>([]);
  const beamLinesRef = useRef<THREE.Line[]>([]);
  const particleSystemRef = useRef<THREE.Points | null>(null);
  const gridShaderRef = useRef<THREE.ShaderMaterial | null>(null);

  // Interaction State
  const [selectedNode, setSelectedNode] = useState<ChamberNodeData | null>(CHAMBER_NODES[0]);
  const [hoveredNode, setHoveredNode] = useState<ChamberNodeData | null>(null);
  const [warpSpeed, setWarpSpeed] = useState<number>(speedMultiplier);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showBeams, setShowBeams] = useState<boolean>(true);
  const [showParticles, setShowParticles] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [wireframeMode, setWireframeMode] = useState<boolean>(false);
  const [cameraZoom, setCameraZoom] = useState<number>(100);

  // Telemetry Simulation Dataset (for Recharts HUD)
  const [entropyTelemetry, setEntropyTelemetry] = useState(() => [
    { time: '00s', entropy: 0.02, qops: 848, coherence: 99.98 },
    { time: '02s', entropy: 0.038, qops: 850, coherence: 99.97 },
    { time: '04s', entropy: 0.082, qops: 852, coherence: 99.99 },
    { time: '06s', entropy: 0.054, qops: 851, coherence: 99.98 },
    { time: '08s', entropy: 0.029, qops: 849, coherence: 99.98 },
    { time: '10s', entropy: 0.065, qops: 853, coherence: 99.99 },
    { time: '12s', entropy: 0.042, qops: 851, coherence: 99.98 },
  ]);

  // Orbit drag tracking
  const mouseState = useRef({
    isDragging: false,
    prevX: 0,
    prevY: 0,
    rotX: 0.35,
    rotY: 0.45,
    targetRotX: 0.35,
    targetRotY: 0.45,
    distance: 7.2,
    targetDistance: 7.2,
  });

  // Cycle telemetry periodically for live HUD
  useEffect(() => {
    const timer = setInterval(() => {
      setEntropyTelemetry((prev) => {
        const lastSec = parseInt(prev[prev.length - 1].time) || 12;
        const nextSec = `${(lastSec + 2) % 60}s`;
        const nextEntropy = Number((0.02 + Math.random() * 0.065).toFixed(3));
        const nextQops = Number((850 + (Math.random() * 3.8 - 1.9)).toFixed(1));
        const nextCoh = Number((99.96 + Math.random() * 0.03).toFixed(2));
        return [...prev.slice(1), { time: nextSec, entropy: nextEntropy, qops: nextQops, coherence: nextCoh }];
      });
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Initialize Three.js Scene
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // 1. Scene & Deep Space Background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#070a12');
    scene.fog = new THREE.FogExp2('#070a12', 0.04);
    sceneRef.current = scene;

    // 2. Camera
    const aspect = mount.clientWidth / (mount.clientHeight || 450);
    const camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 1000);
    camera.position.set(0, 2.5, 7.2);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer with antialiasing and sRGB encoding
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight || 450);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting Rig
    const ambientLight = new THREE.AmbientLight('#0a1128', 2.0);
    scene.add(ambientLight);

    const goldPointLight = new THREE.PointLight('#FFD700', 3.5, 16);
    goldPointLight.position.set(0, 0, 0);
    scene.add(goldPointLight);

    const cyanSpotLight = new THREE.PointLight('#06B6D4', 3.0, 22);
    cyanSpotLight.position.set(6, 7, 6);
    scene.add(cyanSpotLight);

    const violetSpotLight = new THREE.PointLight('#A855F7', 2.8, 22);
    violetSpotLight.position.set(-6, -5, -6);
    scene.add(violetSpotLight);

    const emeraldRimLight = new THREE.PointLight('#10B981', 1.8, 18);
    emeraldRimLight.position.set(0, -6, 5);
    scene.add(emeraldRimLight);

    // 5. Crystalline Quantum Core (Genesis Merkle Root #849202)
    // A. Outer Translucent Crystalline Facet Hull
    const icoGeometry = new THREE.IcosahedronGeometry(0.88, 1);
    const icoMaterial = new THREE.MeshStandardMaterial({
      color: '#083344',
      emissive: '#06B6D4',
      emissiveIntensity: 0.35,
      metalness: 0.3,
      roughness: 0.08,
      transparent: true,
      opacity: 0.45,
      wireframe: false,
    });
    const icoMesh = new THREE.Mesh(icoGeometry, icoMaterial);
    scene.add(icoMesh);
    coreIcoRef.current = icoMesh;

    // B. Golden Cybernetic Wireframe Cage around the Crystal
    const wireframeCageGeo = new THREE.IcosahedronGeometry(0.89, 1);
    const wireframeCageMat = new THREE.MeshBasicMaterial({
      color: '#FFD700',
      wireframe: true,
      transparent: true,
      opacity: 0.75,
    });
    const wireframeCage = new THREE.Mesh(wireframeCageGeo, wireframeCageMat);
    icoMesh.add(wireframeCage);

    // C. Inner Radiant Quantum Singularity (Octahedron Gem)
    const innerCrystalGeo = new THREE.OctahedronGeometry(0.48, 0);
    const innerCrystalMat = new THREE.MeshStandardMaterial({
      color: '#FFFBEB',
      emissive: '#FFD700',
      emissiveIntensity: 1.6,
      metalness: 0.95,
      roughness: 0.1,
    });
    const innerCrystal = new THREE.Mesh(innerCrystalGeo, innerCrystalMat);
    icoMesh.add(innerCrystal);

    // D. Concentric Internal Micro Gyro Rings
    const microRing1Geo = new THREE.TorusGeometry(0.62, 0.012, 16, 64);
    const microRing1Mat = new THREE.MeshBasicMaterial({ color: '#06B6D4', wireframe: false });
    const microRing1 = new THREE.Mesh(microRing1Geo, microRing1Mat);
    microRing1.rotation.x = Math.PI / 3;
    icoMesh.add(microRing1);

    const microRing2Geo = new THREE.TorusGeometry(0.72, 0.01, 16, 64);
    const microRing2Mat = new THREE.MeshBasicMaterial({ color: '#FFD700', wireframe: false });
    const microRing2 = new THREE.Mesh(microRing2Geo, microRing2Mat);
    microRing2.rotation.y = Math.PI / 4;
    icoMesh.add(microRing2);

    // 6. Sleek Quantum Containment Torus Rings (4 Ultra-Fine Orbital Tracks)
    const torusRings: THREE.Mesh[] = [];

    // Ring 1 (Gold Genesis Quorum Ring)
    const torusGeo1 = new THREE.TorusGeometry(2.1, 0.016, 16, 160);
    const torusMat1 = new THREE.MeshStandardMaterial({
      color: '#FFD700',
      emissive: '#FFD700',
      emissiveIntensity: 0.85,
      metalness: 0.9,
      roughness: 0.15,
    });
    const ring1 = new THREE.Mesh(torusGeo1, torusMat1);
    ring1.rotation.x = Math.PI / 2.3;
    scene.add(ring1);
    torusRings.push(ring1);

    // Ring 2 (Cyan PQC Lattice Ring)
    const torusGeo2 = new THREE.TorusGeometry(2.6, 0.015, 16, 160);
    const torusMat2 = new THREE.MeshStandardMaterial({
      color: '#06B6D4',
      emissive: '#06B6D4',
      emissiveIntensity: 0.95,
      metalness: 0.85,
      roughness: 0.2,
    });
    const ring2 = new THREE.Mesh(torusGeo2, torusMat2);
    ring2.rotation.x = -Math.PI / 3.2;
    ring2.rotation.y = Math.PI / 5;
    scene.add(ring2);
    torusRings.push(ring2);

    // Ring 3 (Violet Neural BFT Ring)
    const torusGeo3 = new THREE.TorusGeometry(3.1, 0.014, 16, 180);
    const torusMat3 = new THREE.MeshStandardMaterial({
      color: '#A855F7',
      emissive: '#A855F7',
      emissiveIntensity: 0.9,
      metalness: 0.85,
      roughness: 0.2,
    });
    const ring3 = new THREE.Mesh(torusGeo3, torusMat3);
    ring3.rotation.x = Math.PI / 4;
    ring3.rotation.z = -Math.PI / 3.5;
    scene.add(ring3);
    torusRings.push(ring3);

    // Ring 4 (Emerald State Harbor Ring)
    const torusGeo4 = new THREE.TorusGeometry(3.6, 0.012, 16, 200);
    const torusMat4 = new THREE.MeshStandardMaterial({
      color: '#10B981',
      emissive: '#059669',
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.2,
    });
    const ring4 = new THREE.Mesh(torusGeo4, torusMat4);
    ring4.rotation.x = Math.PI / 6;
    ring4.rotation.y = -Math.PI / 4;
    scene.add(ring4);
    torusRings.push(ring4);

    torusRingsRef.current = torusRings;

    // 7. 18 Chamber Telemetry Nodes + Halos
    const nodeMeshes: { mesh: THREE.Mesh; data: ChamberNodeData; halo: THREE.Mesh }[] = [];
    const beamLines: THREE.Line[] = [];

    CHAMBER_NODES.forEach((nodeData) => {
      // Don't duplicate the center 00 node
      if (nodeData.id === 'chamber_00_genesis') return;

      // Node Sphere
      const sphereGeo = new THREE.SphereGeometry(0.18, 32, 32);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: nodeData.color,
        emissive: nodeData.emissive,
        emissiveIntensity: 1.1,
        metalness: 0.85,
        roughness: 0.2,
      });
      const nodeMesh = new THREE.Mesh(sphereGeo, sphereMat);
      nodeMesh.position.set(...nodeData.pos);
      nodeMesh.userData = { isChamberNode: true, data: nodeData };
      scene.add(nodeMesh);

      // Pulsing Halo
      const haloGeo = new THREE.SphereGeometry(0.26, 16, 16);
      const haloMat = new THREE.MeshBasicMaterial({
        color: nodeData.color,
        transparent: true,
        opacity: 0.35,
        wireframe: true,
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      nodeMesh.add(haloMesh);

      nodeMeshes.push({ mesh: nodeMesh, data: nodeData, halo: haloMesh });

      // Animated Warp Energy Beam connecting Node to Core
      const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(...nodeData.pos)];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: nodeData.color,
        transparent: true,
        opacity: 0.45,
        linewidth: 1.5,
      });
      const beamLine = new THREE.Line(lineGeo, lineMat);
      scene.add(beamLine);
      beamLines.push(beamLine);
    });

    nodeMeshesRef.current = nodeMeshes;
    beamLinesRef.current = beamLines;

    // 8. Cosmic Particle Field / Warp Starfield (800 particles)
    const particleCount = 800;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const paletteColors = [
      new THREE.Color('#06B6D4'),
      new THREE.Color('#A855F7'),
      new THREE.Color('#FFD700'),
      new THREE.Color('#EC4899'),
      new THREE.Color('#38BDF8'),
    ];

    for (let i = 0; i < particleCount; i++) {
      const radius = 3.5 + Math.random() * 6.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      particlePos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePos[i * 3 + 2] = radius * Math.cos(phi);

      const chosenColor = paletteColors[Math.floor(Math.random() * paletteColors.length)];
      particleColors[i * 3] = chosenColor.r;
      particleColors[i * 3 + 1] = chosenColor.g;
      particleColors[i * 3 + 2] = chosenColor.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);
    particleSystemRef.current = particleSystem;

    // 9. Holographic Floor Grid with Ripple Shader Effect
    const gridVertexShader = `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const gridFragmentShader = `
      uniform float time;
      varying vec3 vPos;
      void main() {
        float dist = length(vPos.xy);
        float ripple = sin(dist * 2.8 - time * 2.0) * 0.5 + 0.5;
        float gridX = step(0.92, fract(vPos.x * 2.0));
        float gridY = step(0.92, fract(vPos.y * 2.0));
        float grid = max(gridX, gridY);
        float alpha = smoothstep(9.0, 0.0, dist) * (grid * 0.45 + ripple * 0.25);
        vec3 col = mix(vec3(0.02, 0.7, 0.85), vec3(0.65, 0.33, 0.95), ripple);
        gl_FragColor = vec4(col, alpha * 0.75);
      }
    `;

    const gridShaderMat = new THREE.ShaderMaterial({
      vertexShader: gridVertexShader,
      fragmentShader: gridFragmentShader,
      uniforms: {
        time: { value: 0 },
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    gridShaderRef.current = gridShaderMat;

    const gridPlaneGeo = new THREE.PlaneGeometry(18, 18, 64, 64);
    const gridMesh = new THREE.Mesh(gridPlaneGeo, gridShaderMat);
    gridMesh.rotation.x = -Math.PI / 2;
    gridMesh.position.y = -3.2;
    scene.add(gridMesh);

    // 10. Mouse Drag & Raycasting Listeners
    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();

    const getPointerPos = (e: MouseEvent | TouchEvent) => {
      const rect = mount.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      return {
        x: ((clientX - rect.left) / rect.width) * 2 - 1,
        y: -((clientY - rect.top) / rect.height) * 2 + 1,
        clientX,
        clientY,
      };
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const p = getPointerPos(e);
      mouseState.current.isDragging = true;
      mouseState.current.prevX = p.clientX;
      mouseState.current.prevY = p.clientY;
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const p = getPointerPos(e);

      if (mouseState.current.isDragging) {
        const deltaX = p.clientX - mouseState.current.prevX;
        const deltaY = p.clientY - mouseState.current.prevY;
        mouseState.current.targetRotY += deltaX * 0.006;
        mouseState.current.targetRotX = Math.max(
          -Math.PI / 2.5,
          Math.min(Math.PI / 2.5, mouseState.current.targetRotX + deltaY * 0.006)
        );
        mouseState.current.prevX = p.clientX;
        mouseState.current.prevY = p.clientY;
      }

      // Raycasting for hovered chamber node
      mouseVector.x = p.x;
      mouseVector.y = p.y;
      raycaster.setFromCamera(mouseVector, camera);

      const interactables = [
        icoMesh,
        ...nodeMeshesRef.current.map((n) => n.mesh),
      ];
      const intersects = raycaster.intersectObjects(interactables);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit === icoMesh) {
          setHoveredNode(CHAMBER_NODES[0]);
        } else if (hit.userData?.data) {
          setHoveredNode(hit.userData.data);
        }
      } else {
        setHoveredNode(null);
      }
    };

    const handlePointerUp = (e: MouseEvent | TouchEvent) => {
      mouseState.current.isDragging = false;
    };

    const handleClick = (e: MouseEvent) => {
      const p = getPointerPos(e);
      mouseVector.x = p.x;
      mouseVector.y = p.y;
      raycaster.setFromCamera(mouseVector, camera);

      const interactables = [
        icoMesh,
        ...nodeMeshesRef.current.map((n) => n.mesh),
      ];
      const intersects = raycaster.intersectObjects(interactables);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit === icoMesh) {
          setSelectedNode(CHAMBER_NODES[0]);
          playTone(880, 0.08, 'sine');
          if (onSelectChamber) onSelectChamber('chamber_00_genesis');
        } else if (hit.userData?.data) {
          setSelectedNode(hit.userData.data);
          playTone(660, 0.06, 'sine');
          if (onSelectChamber) onSelectChamber(hit.userData.data.id);
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      mouseState.current.targetDistance = Math.max(
        4.0,
        Math.min(13.0, mouseState.current.targetDistance + e.deltaY * 0.005)
      );
      setCameraZoom(Math.round((7.2 / mouseState.current.targetDistance) * 100));
    };

    mount.addEventListener('mousedown', handlePointerDown);
    mount.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    mount.addEventListener('click', handleClick);
    mount.addEventListener('wheel', handleWheel, { passive: false });

    // Touch support
    mount.addEventListener('touchstart', handlePointerDown, { passive: true });
    mount.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);

    // 11. Animation Loop with Three.js Clock
    const clock = new THREE.Clock();

    const animate = () => {
      animIdRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();
      const effectiveSpeed = isPaused ? 0 : warpSpeed;

      // Update shader uniforms
      if (gridShaderRef.current) {
        gridShaderRef.current.uniforms.time.value = elapsed * effectiveSpeed;
      }

      // Rotate Golden Core
      if (icoMesh) {
        icoMesh.rotation.x += 0.008 * effectiveSpeed;
        icoMesh.rotation.y += 0.012 * effectiveSpeed;
      }

      // Rotate Torus Rings
      torusRings.forEach((ring, idx) => {
        ring.rotation.z += (0.004 * (idx + 1) * (idx % 2 === 0 ? 1 : -1)) * effectiveSpeed;
        ring.rotation.y += (0.003 * (idx + 1)) * effectiveSpeed;
      });

      // Pulse and orbit Node Spheres & Halos
      nodeMeshes.forEach(({ mesh, data, halo }, i) => {
        const pulse = Math.sin(elapsed * 2.5 + i) * 0.15 + 1.0;
        halo.scale.setScalar(pulse);

        // Orbital wobble
        const wobbleY = Math.sin(elapsed * 1.2 + i * 0.5) * 0.08 * effectiveSpeed;
        mesh.position.y = data.pos[1] + wobbleY;
      });

      // Warp Particle Orbit
      if (particleSystem) {
        particleSystem.rotation.y += 0.0015 * effectiveSpeed;
        particleSystem.rotation.x = Math.sin(elapsed * 0.2) * 0.05;
      }

      // Smooth Camera Orbit Damping
      mouseState.current.rotX += (mouseState.current.targetRotX - mouseState.current.rotX) * 0.1;
      mouseState.current.rotY += (mouseState.current.targetRotY - mouseState.current.rotY) * 0.1;
      mouseState.current.distance += (mouseState.current.targetDistance - mouseState.current.distance) * 0.1;

      if (!mouseState.current.isDragging && !isPaused) {
        mouseState.current.targetRotY += 0.0015 * effectiveSpeed;
      }

      const dist = mouseState.current.distance;
      camera.position.x = dist * Math.sin(mouseState.current.rotY) * Math.cos(mouseState.current.rotX);
      camera.position.y = dist * Math.sin(mouseState.current.rotX);
      camera.position.z = dist * Math.cos(mouseState.current.rotY) * Math.cos(mouseState.current.rotX);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // 12. Resize Observer for dynamic responsive resizing with rAF guard
    let resizeRafId: number | null = null;
    const resizeObserver = new ResizeObserver((entries) => {
      if (resizeRafId !== null) {
        cancelAnimationFrame(resizeRafId);
      }
      resizeRafId = requestAnimationFrame(() => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
          }
        }
      });
    });

    resizeObserver.observe(mount);

    // Cleanup WebGL on unmount
    return () => {
      cancelAnimationFrame(animIdRef.current);
      resizeObserver.disconnect();

      mount.removeEventListener('mousedown', handlePointerDown);
      mount.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      mount.removeEventListener('click', handleClick);
      mount.removeEventListener('wheel', handleWheel);
      mount.removeEventListener('touchstart', handlePointerDown);
      mount.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);

      if (renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [warpSpeed, isPaused]);

  // Update wireframe / visibility states
  useEffect(() => {
    if (coreIcoRef.current) {
      (coreIcoRef.current.material as THREE.MeshStandardMaterial).wireframe = wireframeMode;
    }
  }, [wireframeMode]);

  useEffect(() => {
    beamLinesRef.current.forEach((line) => {
      line.visible = showBeams;
    });
  }, [showBeams]);

  useEffect(() => {
    if (particleSystemRef.current) {
      particleSystemRef.current.visible = showParticles;
    }
  }, [showParticles]);

  const resetCamera = useCallback(() => {
    mouseState.current.targetRotX = 0.35;
    mouseState.current.targetRotY = 0.45;
    mouseState.current.targetDistance = 7.2;
    setCameraZoom(100);
    playTone(600, 0.04);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-[28px] bg-[#0a0f1e] border-[#06B6D4]/30 overflow-hidden shadow-[0_0_50px_-10px_rgba(6,182,212,0.25)] flex flex-col transition-all duration-300 ${
        expanded ? 'h-[85vh] sm:h-[88vh]' : 'h-[540px] sm:h-[620px]'
      } ${className}`}
    >
      {/* 3D WebGL Mount Canvas */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-0" />

      {/* Top HUD Header: Sovereign Deck & Quantum Telemetry Bar */}
      <div className="relative z-10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#070a12]/90 border-b border-[#06B6D4]/20 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="w-10 h-10 rounded-2xl bg-[#070a12] border-[#D4AF37]/50 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.35)] shrink-0">
            <Orbit className="w-5 h-5 text-[#D4AF37] animate-spin" style={{ animationDuration: '20s' }} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-mono font-bold text-white tracking-wider uppercase flex items-center gap-2">
                Chamber Runtime Atlas 3D
                <span className="text-[10px] font-mono font-semibold text-[#D4AF37] bg-[#070a12] px-2 py-0.5 rounded-full border-[#D4AF37]/50">
                  SSoT Block #849202
                </span>
              </h2>
            </div>
            <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-2 mt-0.5">
              <span className="text-[#06B6D4] font-semibold">18 CANONICAL CHAMBERS</span>
              <span className="text-zinc-600">•</span>
              <span className="text-emerald-400 font-medium">10/10 REAL_HSM QUORUM</span>
              <span className="text-zinc-600">•</span>
              <span className="text-[#D4AF37] font-medium">FROZEN v1.2 LTS</span>
            </div>
          </div>
        </div>

        {/* Quick Diagnostics Badges */}
        <div className="flex items-center gap-2 pointer-events-auto flex-wrap sm:flex-nowrap">
          <div className="px-2.5 py-1 rounded-xl bg-black/60 border-cyan-500/30 text-[10px] font-mono text-cyan-300 flex items-center gap-1.5 shadow-inner">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>CRYO: 14.98 mK</span>
          </div>
          <div className="px-2.5 py-1 rounded-xl bg-black/60 border-emerald-500/30 text-[10px] font-mono text-emerald-300 flex items-center gap-1.5 shadow-inner">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>PQC: ML-DSA-87</span>
          </div>
          <div className="px-2.5 py-1 rounded-xl bg-black/60 border-amber-500/30 text-[10px] font-mono text-amber-300 flex items-center gap-1.5 shadow-inner">
            <Lock className="w-3 h-3 text-amber-400" />
            <span>SEALS: 14,902</span>
          </div>
        </div>
      </div>

      {/* Floating Interactive HUD Controls (Top-Right) */}
      <div className="absolute top-20 right-4 z-20 flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={() => {
            const next = warpSpeed === 1 ? 2 : warpSpeed === 2 ? 3 : warpSpeed === 3 ? 0.5 : 1;
            setWarpSpeed(next);
            playTone(640, 0.03);
          }}
          title="Adjust Warp Rotation Speed"
          className="p-2 rounded-xl bg-black/70 border-white/10 hover:border-cyan-500/50 text-zinc-300 hover:text-cyan-300 backdrop-blur-md shadow-lg transition-all flex items-center gap-1 text-xs font-mono"
        >
          <Gauge className="w-4 h-4 text-cyan-400" />
          <span>{warpSpeed}x</span>
        </button>

        <button
          onClick={() => {
            setIsPaused(!isPaused);
            playTone(520, 0.03);
          }}
          title={isPaused ? 'Resume 3D Rotation' : 'Pause 3D Rotation'}
          className={`p-2 rounded-xl border backdrop-blur-md shadow-lg transition-all flex items-center justify-center ${
            isPaused
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
              : 'bg-black/70 border-white/10 text-zinc-300 hover:text-white'
          }`}
        >
          <Radio className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            setShowBeams(!showBeams);
            playTone(580, 0.03);
          }}
          title="Toggle Warp Energy Beams"
          className={`p-2 rounded-xl border backdrop-blur-md shadow-lg transition-all flex items-center justify-center ${
            showBeams
              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
              : 'bg-black/70 border-white/10 text-zinc-500'
          }`}
        >
          <Zap className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            setShowParticles(!showParticles);
            playTone(700, 0.03);
          }}
          title="Toggle Cosmic Starfield Particles"
          className={`p-2 rounded-xl border backdrop-blur-md shadow-lg transition-all flex items-center justify-center ${
            showParticles
              ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
              : 'bg-black/70 border-white/10 text-zinc-500'
          }`}
        >
          <Sparkles className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            setWireframeMode(!wireframeMode);
            playTone(740, 0.03);
          }}
          title="Toggle Wireframe Shading"
          className={`p-2 rounded-xl border backdrop-blur-md shadow-lg transition-all flex items-center justify-center ${
            wireframeMode
              ? 'bg-pink-500/20 border-pink-500/50 text-pink-300'
              : 'bg-black/70 border-white/10 text-zinc-300 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
        </button>

        <button
          onClick={resetCamera}
          title="Reset Camera Viewport"
          className="p-2 rounded-xl bg-black/70 border-white/10 hover:border-amber-500/50 text-zinc-300 hover:text-amber-300 backdrop-blur-md shadow-lg transition-all flex items-center justify-center"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {onToggleExpand && (
          <button
            onClick={() => {
              onToggleExpand();
              playTone(660, 0.04);
            }}
            title={expanded ? 'Minimize Viewport' : 'Expand Viewport'}
            className="p-2 rounded-xl bg-black/70 border-white/10 hover:border-cyan-500/50 text-zinc-300 hover:text-cyan-300 backdrop-blur-md shadow-lg transition-all flex items-center justify-center"
          >
            {expanded ? <Minimize2 className="w-4 h-4 text-cyan-400" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Hovered Node Tooltip HUD */}
      {hoveredNode && !selectedNode && (
        <div className="absolute top-20 left-6 z-20 p-3 rounded-2xl bg-black/80 border-cyan-500/40 backdrop-blur-xl shadow-2xl pointer-events-none max-w-xs animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: hoveredNode.color }}
            />
            <span>{hoveredNode.nameEn}</span>
          </div>
          <div className="text-[10px] font-mono text-zinc-400 mt-1">{hoveredNode.nameTh}</div>
          <div className="text-[9px] font-mono text-cyan-300 mt-2 truncate">
            HASH: {hoveredNode.hash}
          </div>
        </div>
      )}

      {/* Selected Node Inspector Drawer / Card */}
      {selectedNode && (
        <div className="absolute bottom-24 left-4 sm:left-6 z-20 p-4 sm:p-5 rounded-2xl bg-[#090D1C]/90 border-cyan-500/40 backdrop-blur-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] max-w-sm sm:max-w-md w-[calc(100%-2rem)] sm:w-auto animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-3.5 h-3.5 rounded-full shadow-[0_0_12px_currentColor]"
                style={{ backgroundColor: selectedNode.color, color: selectedNode.color }}
              />
              <div>
                <div className="text-xs font-mono font-bold text-white tracking-wide uppercase">
                  CHAMBER {selectedNode.chamberNum}: {selectedNode.nameEn}
                </div>
                <div className="text-[11px] font-mono text-zinc-400">{selectedNode.nameTh}</div>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedNode(null);
                playTone(400, 0.02);
              }}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 my-3">
            {selectedNode.metrics.map((m, idx) => (
              <div key={idx} className="p-2 rounded-xl bg-black/50 border-white/5 font-mono">
                <div className="text-[9px] text-zinc-500 uppercase">{m.label}</div>
                <div className="text-xs font-bold text-cyan-300 mt-0.5 truncate">{m.value}</div>
              </div>
            ))}
            <div className="p-2 rounded-xl bg-black/50 border-white/5 font-mono">
              <div className="text-[9px] text-zinc-500 uppercase">Clearance</div>
              <div className="text-[10px] font-bold text-amber-300 mt-0.5 truncate">
                {selectedNode.clearance}
              </div>
            </div>
            <div className="p-2 rounded-xl bg-black/50 border-white/5 font-mono">
              <div className="text-[9px] text-zinc-500 uppercase">Status</div>
              <div className="text-[10px] font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{selectedNode.status}</span>
              </div>
            </div>
          </div>

          <div className="text-[9px] font-mono text-zinc-400 bg-black/60 p-2 rounded-xl border-white/5 truncate">
            <span className="text-zinc-500">SEALED MASTER HASH: </span>
            <span className="text-amber-300">{selectedNode.hash}</span>
          </div>
        </div>
      )}

      {/* Bottom Dock: QuantumWaveSim Entropy Waveform Monitor & Coordinates HUD */}
      <div className="relative z-10 mt-auto p-4 sm:p-5 bg-gradient-to-t from-[#000014]/95 via-[#000014]/80 to-transparent flex flex-col md:flex-row md:items-center justify-between gap-4 pointer-events-auto border-t border-white/5">
        {/* Left: Interactive Chamber Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-xl scrollbar-none">
          {CHAMBER_NODES.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            return (
              <button
                key={node.id}
                onClick={() => {
                  setSelectedNode(node);
                  playTone(600 + parseInt(node.chamberNum) * 20, 0.04);
                  if (onSelectChamber) onSelectChamber(node.id);
                }}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-mono whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-cyan-500/20 text-white font-bold border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                    : 'bg-black/50 text-zinc-400 border-white/5 hover:border-white/20 hover:text-zinc-200'
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: node.color }}
                />
                <span>C-{node.chamberNum}</span>
              </button>
            );
          })}
        </div>

        {/* Right: QuantumWaveSim Entropy Real-Time Sparkline */}
        <div className="flex items-center gap-3 shrink-0 bg-black/60 px-3.5 py-1.5 rounded-2xl border-cyan-500/20 shadow-inner">
          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-zinc-400">QUANTUM WAVE ENTROPY</span>
            <span className="text-xs font-mono font-bold text-fuchsia-400">
              {entropyTelemetry[entropyTelemetry.length - 1].entropy.toFixed(3)} QOps
            </span>
          </div>

          <div className="w-28 sm:w-36 h-9">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={entropyTelemetry}>
                <Line
                  type="monotone"
                  dataKey="entropy"
                  stroke="#EC4899"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
