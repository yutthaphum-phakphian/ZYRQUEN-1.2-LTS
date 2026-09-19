import React, { useState, useMemo, useRef } from 'react';
import {
  GitFork,
  Shield,
  Key,
  Database,
  FileCheck2,
  AlertTriangle,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Lock,
  Layers,
  Cpu,
} from 'lucide-react';
import { SYSTEM_METADATA } from '../data/canonicalData';
import { HardwareSnapshot } from '../types';
import { playTone, playAuditChime } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';

export interface MerkleNode {
  id: string;
  name: string;
  type: 'root' | 'branch' | 'leaf_seal' | 'leaf_snapshot' | 'leaf_stage' | 'leaf_quarantine';
  depth: number;
  hash: string;
  parentHash?: string;
  signatureScheme: string;
  timestamp: string;
  status: 'VERIFIED' | 'SEALED' | 'QUARANTINED';
  metadata: {
    statute?: string;
    sealIndex?: string | number;
    blockHeight?: number;
    description?: string;
    metrics?: Record<string, string | number>;
  };
  childrenIds?: string[];
}

interface MerkleTreeInteractiveGraphProps {
  snapshots?: HardwareSnapshot[];
  onSelectSnapshot?: (snap: HardwareSnapshot) => void;
}

export const MerkleTreeInteractiveGraph: React.FC<MerkleTreeInteractiveGraphProps> = ({
  snapshots = [],
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(SYSTEM_METADATA.merkleRoot);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [branchFilter, setBranchFilter] = useState<'all' | 'deca' | 'seals' | 'snapshots' | 'stages' | 'quarantine'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Build the complete Sovereign Merkle Tree dataset
  const merkleData = useMemo(() => {
    const nodes: Record<string, MerkleNode> = {};
    const rootId = SYSTEM_METADATA.merkleRoot;

    // 1. Level 0: Root Node
    nodes[rootId] = {
      id: rootId,
      name: 'Genesis Merkle Root',
      type: 'root',
      depth: 0,
      hash: rootId,
      signatureScheme: 'NIST Post-Quantum FIPS 204 (ML-DSA-87 / Dilithium-5)',
      timestamp: '2026-03-31 08:28:12 ICT',
      status: 'VERIFIED',
      metadata: {
        blockHeight: SYSTEM_METADATA.sealedBlock,
        description: 'Immutable root hash anchoring all 14,902 canonical seals and deca-key quorum.',
        statute: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 มาตรา ๙, ๒๖, ๒๘ (สพธอ. ETDA)',
      },
      childrenIds: [
        'branch-deca-key',
        'branch-canonical-seals',
        'branch-snapshots',
        'branch-forensics-trace',
        'branch-quarantine',
      ],
    };

    // 2. Level 1: Branch Intermediates
    nodes['branch-deca-key'] = {
      id: 'branch-deca-key',
      name: 'Deca-Key 10/10 HSM Quorum',
      type: 'branch',
      depth: 1,
      hash: '3e18a0429f583bb9024f2b9044d03e94441c2c8f8b1c554e21a8d0526e0339ab',
      parentHash: rootId,
      signatureScheme: 'Post-Quantum Threshold ML-DSA-87 (10-of-10)',
      timestamp: '2026-03-31 08:28:12 ICT',
      status: 'VERIFIED',
      metadata: {
        statute: 'NIST SP 800-90B & FIPS 140-3 Level 4 HSM',
        description: 'Deca-Key quorum consensus authority (10/10 REAL_HSM cryptographic signers intact).',
      },
      childrenIds: ['leaf-dk-01', 'leaf-dk-05', 'leaf-dk-10'],
    };

    nodes['branch-canonical-seals'] = {
      id: 'branch-canonical-seals',
      name: '14,902 Canonical Invariant Seals',
      type: 'branch',
      depth: 1,
      hash: '712a95c829e1d8847ff9386d4e2a1b9c70814f3b5d2e9c10447fa02948cd3e41',
      parentHash: rootId,
      signatureScheme: 'SPHINCS+ / Dilithium-5 Invariant Anchor',
      timestamp: '2026-03-31 08:28:12 ICT',
      status: 'VERIFIED',
      metadata: {
        sealIndex: '14,902 Seals',
        statute: 'PDPA B.E. 2562 & SSoT Δ0 Invariants',
        description: 'Frozen v1.2 LTS Canonical Invariant Seals (#0001 through #14,902).',
      },
      childrenIds: ['leaf-seal-0001', 'leaf-seal-7451', 'leaf-seal-14902'],
    };

    nodes['branch-snapshots'] = {
      id: 'branch-snapshots',
      name: 'Hardware Telemetry Snapshots',
      type: 'branch',
      depth: 1,
      hash: 'bc89421f928e04a55823190ab7155c024d9e03429a3e990b712399a81123ce50',
      parentHash: rootId,
      signatureScheme: 'SHA-256 with Post-Quantum Dilithium Envelope',
      timestamp: snapshots[0]?.timestampIct || '2026-03-31 08:28:12 ICT',
      status: 'VERIFIED',
      metadata: {
        sealIndex: `${snapshots.length} Active Snapshots`,
        statute: 'OpenTelemetry W3C TraceContext & Invariant Δ0',
        description: 'Chronological hardware state snapshots with cryptographic chaining.',
      },
      childrenIds: snapshots.slice(0, 4).map((s) => `leaf-snap-${s.id}`),
    };

    nodes['branch-forensics-trace'] = {
      id: 'branch-forensics-trace',
      name: '12-Stage Forensics Verification Trace',
      type: 'branch',
      depth: 1,
      hash: 'fa2456012e8b09337c4e51299a4192b05531980074128abde49201487cc59b8a',
      parentHash: rootId,
      signatureScheme: 'FIPS 180-4 Secure Chaining',
      timestamp: '2026-03-31 08:28:12 ICT',
      status: 'VERIFIED',
      metadata: {
        statute: 'พ.ร.บ. ธุรกรรมฯ มาตรา ๒๖ (ETDA Level 3+)',
        description: 'Full 12-stage forensic evidence trace of transaction execution lifecycle.',
      },
      childrenIds: ['leaf-stage-s01', 'leaf-stage-s06', 'leaf-stage-s12'],
    };

    nodes['branch-quarantine'] = {
      id: 'branch-quarantine',
      name: 'Quarantine Partition Registry',
      type: 'branch',
      depth: 1,
      hash: 'd591884029a174c829e0031846b9a8f274092b1a0344b802a9018e7724a9cf29',
      parentHash: rootId,
      signatureScheme: 'Isolated Quarantine Signature Envelope',
      timestamp: '2026-03-31 08:28:12 ICT',
      status: 'QUARANTINED',
      metadata: {
        sealIndex: 'Seals #14,903–#14,907',
        statute: 'SSoT Δ0 Fail-Closed Quarantine Policy',
        description: 'Quarantined unauthorized mutation attempts isolated from canonical ledger.',
      },
      childrenIds: ['leaf-quar-14903', 'leaf-quar-14907'],
    };

    // 3. Level 2: Leaf Nodes (Deca-Key)
    nodes['leaf-dk-01'] = {
      id: 'leaf-dk-01',
      name: 'DK-01: Sovereign Principal Key',
      type: 'leaf_seal',
      depth: 2,
      hash: '9a4e01928374a819b02847c019283746a8192837465019283746591827364501',
      parentHash: 'branch-deca-key',
      signatureScheme: 'ML-DSA-87 / HSM-Slot-01 (Yutthaphum Pakphian)',
      timestamp: '2026-03-31 08:28:12 ICT',
      status: 'VERIFIED',
      metadata: {
        sealIndex: '#EP-SOVEREIGN-01',
        statute: 'ETDA มาตรา ๙, ๒๖, ๒๘',
        description: 'Supreme Sovereign Architect Deca-Key slot with read-only audit clearance.',
      },
    };

    nodes['leaf-dk-05'] = {
      id: 'leaf-dk-05',
      name: 'DK-05: Post-Quantum Cloud HSM',
      type: 'leaf_seal',
      depth: 2,
      hash: '5f829102837461928374650192837465918273645019a4e01928374a819b0284',
      parentHash: 'branch-deca-key',
      signatureScheme: 'Dilithium-5 / Bangkok HSM Node #BK01',
      timestamp: '2026-03-31 08:28:12 ICT',
      status: 'VERIFIED',
      metadata: {
        sealIndex: 'HSM-SEAL-05',
        statute: 'NIST PQC Level 5',
        description: 'Hardware Security Module validator with sub-millisecond tamper tripwire.',
      },
    };

    nodes['leaf-dk-10'] = {
      id: 'leaf-dk-10',
      name: 'DK-10: International Quorum Witness',
      type: 'leaf_seal',
      depth: 2,
      hash: '1092837465918273645019a4e01928374a819b02845f82910283746192837465',
      parentHash: 'branch-deca-key',
      signatureScheme: 'SPHINCS+ / Zurich Vault Edge #CH01',
      timestamp: '2026-03-31 08:28:12 ICT',
      status: 'VERIFIED',
      metadata: {
        sealIndex: 'HSM-SEAL-10',
        statute: 'Cross-Border PQC Invariant',
        description: 'Deca-Key finalization witness ensuring 10/10 quorum consensus.',
      },
    };

    // Canonical Seals Leaves
    nodes['leaf-seal-0001'] = {
      id: 'leaf-seal-0001',
      name: 'Seal #0001: Genesis Constitution',
      type: 'leaf_seal',
      depth: 2,
      hash: '0184729102837465918273645019a4e01928374a819b02845f82910283746192',
      parentHash: 'branch-canonical-seals',
      signatureScheme: 'Dilithium-5 Invariant Seal',
      timestamp: '2026-03-31 08:28:12 ICT',
      status: 'SEALED',
      metadata: {
        sealIndex: '#0001',
        statute: 'SSoT Δ0 Constitution Invariant',
        description: 'Constitutional basis establishing zero unauthorized mutation authority.',
      },
    };

    nodes['leaf-seal-7451'] = {
      id: 'leaf-seal-7451',
      name: 'Seal #7451: Cryo Invariant (<25mK)',
      type: 'leaf_seal',
      depth: 2,
      hash: '7451a9102837465918273645019a4e01928374a819b02845f829102837461928',
      parentHash: 'branch-canonical-seals',
      signatureScheme: 'Post-Quantum Hardware Circuit Anchor',
      timestamp: '2026-03-31 08:28:12 ICT',
      status: 'SEALED',
      metadata: {
        sealIndex: '#7451',
        statute: 'Fail-Closed Hardware Threshold',
        description: 'Sub-kelvin dilution chamber telemetry bound: Fail-Closed if Temp > 25.0 mK.',
      },
    };

    nodes['leaf-seal-14902'] = {
      id: 'leaf-seal-14902',
      name: 'Seal #14,902: Canonical Apex Seal',
      type: 'leaf_seal',
      depth: 2,
      hash: '14902b9102837465918273645019a4e01928374a819b02845f82910283746192',
      parentHash: 'branch-canonical-seals',
      signatureScheme: 'ML-DSA-87 Sealed Apex',
      timestamp: '2026-03-31 08:28:12 ICT',
      status: 'SEALED',
      metadata: {
        sealIndex: '#14,902',
        statute: 'PDPA B.E. 2562 & ETDA Sec 28',
        description: 'Final canonical seal establishing the 14,902 invariant boundary for Frozen v1.2 LTS.',
      },
    };

    // Hardware Snapshots Leaves
    snapshots.slice(0, 4).forEach((snap) => {
      const id = `leaf-snap-${snap.id}`;
      nodes[id] = {
        id,
        name: `Snapshot #${snap.snapshotNumber} (${snap.id})`,
        type: 'leaf_snapshot',
        depth: 2,
        hash: snap.sealedHash,
        parentHash: 'branch-snapshots',
        signatureScheme: 'SHA-256 Telemetry Chained',
        timestamp: snap.timestampIct,
        status: snap.status === 'SEALED' ? 'SEALED' : 'VERIFIED',
        metadata: {
          sealIndex: `#${snap.snapshotNumber}`,
          statute: 'OpenTelemetry Container Standard',
          description: `Telemetry snapshot: CPU ${snap.cpuAverage}% • Cryo ${snap.cryoTempMk}mK • QOps ${snap.qopsThroughput} QOps/s`,
          metrics: {
            'CPU Avg': `${snap.cpuAverage}%`,
            'Cryo Temp': `${snap.cryoTempMk} mK`,
            'QOps Rate': `${snap.qopsThroughput} QOps/s`,
            'Voltage Stability': `${snap.voltageStabilityPct || snap.Voltage_Stability || 99.98}%`,
          },
        },
      };
    });

    // Forensic Stages Leaves
    nodes['leaf-stage-s01'] = {
      id: 'leaf-stage-s01',
      name: 'Stage 01: Client Intent Intake',
      type: 'leaf_stage',
      depth: 2,
      hash: 'e459018273645019a4e01928374a819b02845f82910283746192837465918273',
      parentHash: 'branch-forensics-trace',
      signatureScheme: 'Signed Payload Digest',
      timestamp: '2026-03-31 08:28:12 ICT',
      status: 'VERIFIED',
      metadata: {
        sealIndex: 'Stage 01',
        statute: 'ETDA Sec 9 (Electronic Signature)',
        description: 'Ingestion and provenance verification of signed client transaction intent.',
      },
    };

    nodes['leaf-stage-s06'] = {
      id: 'leaf-stage-s06',
      name: 'Stage 06: Zero-Knowledge Proof Evaluation',
      type: 'leaf_stage',
      depth: 2,
      hash: '6a01928374a819b02845f82910283746192837465918273e459018273645019a',
      parentHash: 'branch-forensics-trace',
      signatureScheme: 'Groth16 / STARK Verifier',
      timestamp: '2026-03-31 08:28:12 ICT',
      status: 'VERIFIED',
      metadata: {
        sealIndex: 'Stage 06',
        statute: 'PDPA Sec 26 (Privacy-Preserving Proof)',
        description: 'ZK-STARK proof computed with 0 personal data leakage.',
      },
    };

    nodes['leaf-stage-s12'] = {
      id: 'leaf-stage-s12',
      name: 'Stage 12: Merkle Tree Seal & Ledger Anchor',
      type: 'leaf_stage',
      depth: 2,
      hash: '12e459018273645019a4e01928374a819b02845f829102837461928374659182',
      parentHash: 'branch-forensics-trace',
      signatureScheme: 'Dilithium-5 Final Sealed Block',
      timestamp: '2026-03-31 08:28:12 ICT',
      status: 'SEALED',
      metadata: {
        sealIndex: 'Stage 12',
        statute: 'ETDA Sec 28 & Block #849202',
        description: 'Final cryptographic commitment incorporated into Genesis Merkle Root.',
      },
    };

    // Quarantine Partition Leaves
    nodes['leaf-quar-14903'] = {
      id: 'leaf-quar-14903',
      name: 'Quarantine #14,903: Mutation Injection',
      type: 'leaf_quarantine',
      depth: 2,
      hash: '9031846b9a8f274092b1a0344b802a9018e7724a9cf29d591884029a174c829e',
      parentHash: 'branch-quarantine',
      signatureScheme: 'Quarantined / Rejected',
      timestamp: '2026-03-31 08:28:12 ICT',
      status: 'QUARANTINED',
      metadata: {
        sealIndex: '#14,903',
        statute: 'Blocked by SSoT Δ0 Invariant',
        description: 'Attempted mutation payload without OMEGA-1 cryptographic authorization.',
      },
    };

    nodes['leaf-quar-14907'] = {
      id: 'leaf-quar-14907',
      name: 'Quarantine #14,907: Thermal Overrun',
      type: 'leaf_quarantine',
      depth: 2,
      hash: '9072b1a0344b802a9018e7724a9cf29d591884029a174c829e9031846b9a8f27',
      parentHash: 'branch-quarantine',
      signatureScheme: 'Fail-Closed Quarantined',
      timestamp: '2026-03-31 08:28:12 ICT',
      status: 'QUARANTINED',
      metadata: {
        sealIndex: '#14,907',
        statute: 'Fail-Closed Auto Trigger (Temp > 85°C)',
        description: 'Simulated thermal overrun payload isolated into immutable quarantine audit vault.',
      },
    };

    return nodes;
  }, [snapshots]);

  // Selected node
  const selectedNode = merkleData[selectedNodeId] || merkleData[SYSTEM_METADATA.merkleRoot];
  const hoveredNode = hoveredNodeId ? merkleData[hoveredNodeId] : null;

  // Filtered nodes based on branch selection and search query
  const filteredNodesList = useMemo(() => {
    return Object.values(merkleData).filter((node) => {
      // Branch filter
      if (branchFilter === 'deca' && !node.id.includes('deca') && node.id !== SYSTEM_METADATA.merkleRoot) {
        return false;
      }
      if (branchFilter === 'seals' && !node.id.includes('seal') && node.id !== SYSTEM_METADATA.merkleRoot) {
        return false;
      }
      if (branchFilter === 'snapshots' && !node.id.includes('snap') && node.id !== SYSTEM_METADATA.merkleRoot) {
        return false;
      }
      if (branchFilter === 'stages' && !node.id.includes('stage') && !node.id.includes('forensics') && node.id !== SYSTEM_METADATA.merkleRoot) {
        return false;
      }
      if (branchFilter === 'quarantine' && !node.id.includes('quar') && node.id !== SYSTEM_METADATA.merkleRoot) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = node.name.toLowerCase().includes(q);
        const matchesHash = node.hash.toLowerCase().includes(q);
        const matchesDesc = node.metadata.description?.toLowerCase().includes(q);
        const matchesStatute = node.metadata.statute?.toLowerCase().includes(q);
        return matchesName || matchesHash || matchesDesc || matchesStatute;
      }

      return true;
    });
  }, [merkleData, branchFilter, searchQuery]);

  // Coordinates mapping for node-link visualizer
  const nodeCoordinates = useMemo(() => {
    const coords: Record<string, { x: number; y: number }> = {};
    // Level 0: Root (Top Center)
    coords[SYSTEM_METADATA.merkleRoot] = { x: 450, y: 55 };

    // Level 1: 5 Branches horizontally spaced
    const branchIds = [
      'branch-deca-key',
      'branch-canonical-seals',
      'branch-snapshots',
      'branch-forensics-trace',
      'branch-quarantine',
    ];
    const branchX = [120, 280, 450, 620, 780];
    branchIds.forEach((id, idx) => {
      coords[id] = { x: branchX[idx], y: 190 };
    });

    // Level 2: Leaves under their parent branch
    const leafClusters: Record<string, string[]> = {
      'branch-deca-key': ['leaf-dk-01', 'leaf-dk-05', 'leaf-dk-10'],
      'branch-canonical-seals': ['leaf-seal-0001', 'leaf-seal-7451', 'leaf-seal-14902'],
      'branch-snapshots': snapshots.slice(0, 4).map((s) => `leaf-snap-${s.id}`),
      'branch-forensics-trace': ['leaf-stage-s01', 'leaf-stage-s06', 'leaf-stage-s12'],
      'branch-quarantine': ['leaf-quar-14903', 'leaf-quar-14907'],
    };

    Object.entries(leafClusters).forEach(([parentId, leafIds]) => {
      const parentCoord = coords[parentId] || { x: 450, y: 190 };
      const spread = Math.min(130, 240 / (leafIds.length || 1));
      leafIds.forEach((leafId, idx) => {
        const offset = (idx - (leafIds.length - 1) / 2) * spread;
        coords[leafId] = {
          x: Math.max(50, Math.min(850, parentCoord.x + offset)),
          y: 345 + (idx % 2 === 1 ? 25 : 0),
        };
      });
    });

    return coords;
  }, [snapshots]);

  // Edges/Links between nodes
  const links = useMemo(() => {
    const edgeList: { fromId: string; toId: string; from: { x: number; y: number }; to: { x: number; y: number } }[] = [];
    Object.values(merkleData).forEach((node) => {
      if (node.parentHash && merkleData[node.parentHash]) {
        const from = nodeCoordinates[node.parentHash];
        const to = nodeCoordinates[node.id];
        if (from && to) {
          edgeList.push({
            fromId: node.parentHash,
            toId: node.id,
            from,
            to,
          });
        }
      }
    });
    return edgeList;
  }, [merkleData, nodeCoordinates]);

  // Highlight cryptographic branch path to the root
  const pathNodeIds = useMemo(() => {
    const ids = new Set<string>();
    let curr: string | undefined = selectedNodeId;
    while (curr && merkleData[curr]) {
      ids.add(curr);
      curr = merkleData[curr].parentHash;
    }
    return ids;
  }, [selectedNodeId, merkleData]);

  // Historical Blocks Traversal Matrix
  const HISTORICAL_BLOCKS = useMemo(() => [
    {
      blockHeight: 849202,
      name: 'Block #849202 (Canonical Apex Seal)',
      seals: '14,902 Seals (Apex Boundary)',
      status: 'CANONICAL_SEALED',
      targetLeafId: 'leaf-seal-14902',
      rootHash: SYSTEM_METADATA.merkleRoot,
      pqcStandard: 'Dilithium-5 (ML-DSA-87) + SPHINCS+',
      etdaStatus: 'ETDA Sec 9, 26, 28 Fully Attested',
      traversalSteps: [
        { level: 'Leaf Seal #14,902', hash: '14902b9102837465918273645019a4e01928374a819b02845f82910283746192', sibling: '7451a9102837465918273645019a4e01928374a819b02845f829102837461928', verified: true },
        { level: 'Level 1: 14,902 Canonical Seals Branch', hash: '712a95c829e1d8847ff9386d4e2a1b9c70814f3b5d2e9c10447fa02948cd3e41', sibling: '3e18a0429f583bb9024f2b9044d03e94441c2c8f8b1c554e21a8d0526e0339ab', verified: true },
        { level: 'Genesis Merkle Root', hash: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68', sibling: 'FINAL_ROOT_ANCHOR', verified: true },
      ],
    },
    {
      blockHeight: 849201,
      name: 'Block #849201 (Pre-Apex Reconciliation)',
      seals: '14,901 Seals',
      status: 'HISTORICAL_PRESERVED',
      targetLeafId: 'leaf-seal-7451',
      rootHash: '7a192834b5c6d7e8f90123456789abcdef0123456789abcdef0123456789abcd',
      pqcStandard: 'Dilithium-5 (ML-DSA-87)',
      etdaStatus: 'ETDA Sec 26 Admissible',
      traversalSteps: [
        { level: 'Leaf Seal #7,451 (Cryo < 25mK)', hash: '7451a9102837465918273645019a4e01928374a819b02845f829102837461928', sibling: '0184729102837465918273645019a4e01928374a819b02845f82910283746192', verified: true },
        { level: 'Level 1: 14,902 Canonical Seals Branch', hash: '712a95c829e1d8847ff9386d4e2a1b9c70814f3b5d2e9c10447fa02948cd3e41', sibling: 'bc89421f928e04a55823190ab7155c024d9e03429a3e990b712399a81123ce50', verified: true },
        { level: 'Genesis Merkle Root', hash: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68', sibling: 'FINAL_ROOT_ANCHOR', verified: true },
      ],
    },
    {
      blockHeight: 849200,
      name: 'Block #849200 (10/10 Deca-Key Quorum)',
      seals: '14,900 Seals',
      status: 'HISTORICAL_PRESERVED',
      targetLeafId: 'leaf-dk-01',
      rootHash: '8b293847c6d5e4f3a210987654321fed0123456789abcdef0123456789abcdef',
      pqcStandard: 'Post-Quantum Threshold ML-DSA-87',
      etdaStatus: 'ETDA Sec 9 Sovereign Intent Signed',
      traversalSteps: [
        { level: 'Leaf DK-01 (#EP-SOVEREIGN-01)', hash: '9a4e01928374a819b02847c019283746a8192837465019283746591827364501', sibling: '5f829102837461928374650192837465918273645019a4e01928374a819b0284', verified: true },
        { level: 'Level 1: Deca-Key 10/10 HSM Branch', hash: '3e18a0429f583bb9024f2b9044d03e94441c2c8f8b1c554e21a8d0526e0339ab', sibling: '712a95c829e1d8847ff9386d4e2a1b9c70814f3b5d2e9c10447fa02948cd3e41', verified: true },
        { level: 'Genesis Merkle Root', hash: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68', sibling: 'FINAL_ROOT_ANCHOR', verified: true },
      ],
    },
    {
      blockHeight: 800000,
      name: 'Block #800000 (Genesis Constitution)',
      seals: '1 Seal (Genesis)',
      status: 'GENESIS_ANCHOR',
      targetLeafId: 'leaf-seal-0001',
      rootHash: '00000000000000000000000000000000909ab814479844d8a14816bed34cdbb0',
      pqcStandard: 'Dilithium-5 (ML-DSA-87)',
      etdaStatus: 'ETDA Sec 28 & PDPA Root Invariant',
      traversalSteps: [
        { level: 'Leaf Seal #0001 (Genesis Constitution)', hash: '0184729102837465918273645019a4e01928374a819b02845f82910283746192', sibling: '7451a9102837465918273645019a4e01928374a819b02845f829102837461928', verified: true },
        { level: 'Level 1: 14,902 Canonical Seals Branch', hash: '712a95c829e1d8847ff9386d4e2a1b9c70814f3b5d2e9c10447fa02948cd3e41', sibling: '3e18a0429f583bb9024f2b9044d03e94441c2c8f8b1c554e21a8d0526e0339ab', verified: true },
        { level: 'Genesis Merkle Root', hash: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68', sibling: 'FINAL_ROOT_ANCHOR', verified: true },
      ],
    },
  ], []);

  const [selectedHistoricalBlockIndex, setSelectedHistoricalBlockIndex] = useState<number>(0);
  const activeBlock = HISTORICAL_BLOCKS[selectedHistoricalBlockIndex];

  const handleSelectHistoricalBlock = (idx: number) => {
    setSelectedHistoricalBlockIndex(idx);
    const blk = HISTORICAL_BLOCKS[idx];
    if (blk && blk.targetLeafId) {
      setSelectedNodeId(blk.targetLeafId);
      playAuditChime();
    }
  };

  const handleCopy = (text: string, label: string = 'Hash') => {
    playTone(720, 0.05);
    copyToClipboard(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 3000);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="p-5 sm:p-6 rounded-[28px] bg-gradient-to-br from-[#070914]/95 via-[#0b0e1e]/90 to-[#070914]/95 border border-cyan-500/25 shadow-[0_10px_40px_-10px_rgba(6,182,212,0.15)] backdrop-blur-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold tracking-wide flex items-center gap-1.5">
              <GitFork className="w-3 h-3 text-cyan-400" />
              INTERACTIVE MERKLE TREE GRAPH
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
              100% POST-QUANTUM INTEGRITY
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 text-[10px] font-mono font-bold">
              NIST FIPS 204 (ML-DSA-87)
            </span>
          </div>
          <h2 className="text-lg sm:text-2xl font-mono font-bold text-white tracking-tight flex items-center gap-2">
            Post-Quantum Merkle Verification Hierarchy & Leaf Hash Inspector
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-mono mt-1">
            Visualizing the cryptographic tree anchored at Block #849202. Hover over or click any seal node to inspect its metadata hash and proof chain.
          </p>
        </div>

        {/* Controls: Zoom & Reset */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <div className="flex items-center bg-black/50 border border-white/10 rounded-xl p-1 text-xs font-mono">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.1))}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 font-bold text-cyan-300">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all ml-1"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Historical Block Merkle Traversal Engine */}
      <div className="p-5 rounded-[24px] bg-gradient-to-br from-[#0c1424]/90 via-[#070b14]/85 to-[#04060b] border border-cyan-500/30 backdrop-blur-xl shadow-2xl font-mono text-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              <Sparkles className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase">HISTORICAL MERKLE PROOF TRAVERSAL &bull; 14,902 CANONICAL SEALS</span>
              <h3 className="text-sm font-bold text-white">
                Deterministic Path Traversal for Historical Blocks
              </h3>
            </div>
          </div>

          {/* Block Selection Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {HISTORICAL_BLOCKS.map((blk, idx) => {
              const isSelected = selectedHistoricalBlockIndex === idx;
              return (
                <button
                  key={blk.blockHeight}
                  onClick={() => handleSelectHistoricalBlock(idx)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 border text-xs ${
                    isSelected
                      ? 'bg-cyan-500/30 text-cyan-100 border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-[1.02]'
                      : 'bg-black/40 text-zinc-400 border-white/5 hover:border-white/20 hover:text-zinc-200'
                  }`}
                >
                  <Lock className={`w-3 h-3 ${isSelected ? 'text-cyan-300' : 'text-zinc-500'}`} />
                  <span>#{blk.blockHeight}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Historical Block Traversal Summary Card */}
        {activeBlock && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left 4 Cols: Block Metadata */}
            <div className="lg:col-span-4 p-4 rounded-2xl bg-black/50 border border-cyan-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">{activeBlock.name}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  {activeBlock.status}
                </span>
              </div>
              <div className="text-[11px] text-zinc-400">
                Seals Boundary: <strong className="text-cyan-300">{activeBlock.seals}</strong>
              </div>
              <div className="text-[10px] text-zinc-500">
                Standard: <span className="text-zinc-300">{activeBlock.pqcStandard}</span>
              </div>
              <div className="text-[10px] text-emerald-400 font-medium">
                {activeBlock.etdaStatus}
              </div>
              <div className="pt-2 border-t border-white/5 text-[10px] text-zinc-500 truncate">
                Target Leaf ID: <span className="text-cyan-400 font-mono">{activeBlock.targetLeafId}</span>
              </div>
            </div>

            {/* Right 8 Cols: 3-Stage Traversal Proof Steps */}
            <div className="lg:col-span-8 space-y-2">
              <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mb-1">
                Merkle Proof Traversal Steps (Leaf &rarr; Level 1 &rarr; Genesis Merkle Root)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {activeBlock.traversalSteps.map((step, sIdx) => (
                  <div key={sIdx} className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5 relative overflow-hidden">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-cyan-300">{step.level}</span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                        VERIFIED
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono truncate" title={step.hash}>
                      H: {step.hash.slice(0, 16)}...
                    </div>
                    <div className="text-[9px] text-zinc-500 font-mono truncate" title={step.sibling}>
                      Sib: {step.sibling.slice(0, 16)}...
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#070914]/85 border border-cyan-500/20 rounded-2xl p-2.5 font-mono text-xs shadow-inner">
        {/* Branch Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => {
              playTone(520, 0.04);
              setBranchFilter('all');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              branchFilter === 'all'
                ? 'bg-cyan-500/25 text-cyan-100 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Nodes ({Object.keys(merkleData).length})
          </button>
          <button
            onClick={() => {
              playTone(540, 0.04);
              setBranchFilter('deca');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              branchFilter === 'deca'
                ? 'bg-emerald-500/25 text-emerald-100 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'text-zinc-400 hover:text-emerald-300'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-emerald-400" />
            <span>Deca-Key Quorum</span>
          </button>
          <button
            onClick={() => {
              playTone(560, 0.04);
              setBranchFilter('seals');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              branchFilter === 'seals'
                ? 'bg-violet-500/25 text-violet-100 border border-violet-500/40 shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                : 'text-zinc-400 hover:text-violet-300'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-violet-400" />
            <span>Canonical Seals (14,902)</span>
          </button>
          <button
            onClick={() => {
              playTone(580, 0.04);
              setBranchFilter('snapshots');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              branchFilter === 'snapshots'
                ? 'bg-cyan-500/25 text-cyan-100 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'text-zinc-400 hover:text-cyan-300'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Snapshots ({snapshots.length})</span>
          </button>
          <button
            onClick={() => {
              playTone(600, 0.04);
              setBranchFilter('stages');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              branchFilter === 'stages'
                ? 'bg-indigo-500/25 text-indigo-100 border border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                : 'text-zinc-400 hover:text-indigo-300'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Forensics Trace</span>
          </button>
          <button
            onClick={() => {
              playTone(620, 0.04);
              setBranchFilter('quarantine');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              branchFilter === 'quarantine'
                ? 'bg-amber-500/25 text-amber-100 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'text-zinc-400 hover:text-amber-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Quarantine</span>
          </button>
        </div>

        {/* Live Search Box */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search seal name, hash prefix..."
            className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Main Visualizer Stage & Hover/Inspector Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Interactive SVG Node-Link Canvas */}
        <div className="lg:col-span-8 p-4 rounded-[28px] bg-[#070914]/90 border border-cyan-500/20 shadow-2xl relative overflow-hidden flex flex-col min-h-[460px]">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

          {/* Interactive SVG Diagram */}
          <div className="relative w-full h-full min-h-[440px] flex-1 overflow-x-auto overflow-y-hidden">
            <svg
              viewBox="0 0 900 440"
              className="w-full h-full min-w-[720px] select-none"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center 50px', transition: 'transform 0.2s ease-out' }}
            >
              <defs>
                <linearGradient id="link-active" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="link-idle" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.1" />
                </linearGradient>
                <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Render Node-Link Connectors (Smooth Cubic Bézier Curves) */}
              {links.map((link, idx) => {
                const isPathActive = pathNodeIds.has(link.toId) && pathNodeIds.has(link.fromId);
                const isHovered = hoveredNodeId === link.toId || hoveredNodeId === link.fromId;
                const stroke = isPathActive ? 'url(#link-active)' : isHovered ? '#06B6D4' : 'url(#link-idle)';
                const strokeWidth = isPathActive ? 2.5 : isHovered ? 2 : 1.2;
                const cy1 = link.from.y + (link.to.y - link.from.y) * 0.5;
                const cy2 = link.from.y + (link.to.y - link.from.y) * 0.5;
                const d = `M ${link.from.x} ${link.from.y} C ${link.from.x} ${cy1}, ${link.to.x} ${cy2}, ${link.to.x} ${link.to.y}`;

                return (
                  <path
                    key={`link-${idx}`}
                    d={d}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    strokeDasharray={isPathActive ? 'none' : '4 4'}
                    className="transition-all duration-300"
                    opacity={isPathActive ? 1 : 0.6}
                  />
                );
              })}

              {/* Render Nodes */}
              {filteredNodesList.map((node) => {
                const coord = nodeCoordinates[node.id];
                if (!coord) return null;

                const isSelected = selectedNodeId === node.id;
                const isHovered = hoveredNodeId === node.id;
                const isPath = pathNodeIds.has(node.id);

                // Styling based on node type
                let fill = '#0a0d18';
                let strokeColor = '#06B6D4';
                let badgeText = 'LEAF';

                if (node.type === 'root') {
                  strokeColor = '#06B6D4';
                  badgeText = 'GENESIS ROOT';
                } else if (node.type === 'branch') {
                  strokeColor = node.status === 'QUARANTINED' ? '#F59E0B' : '#8B5CF6';
                  badgeText = 'BRANCH';
                } else if (node.type === 'leaf_seal') {
                  strokeColor = '#10B981';
                  badgeText = 'SEAL';
                } else if (node.type === 'leaf_snapshot') {
                  strokeColor = '#06B6D4';
                  badgeText = 'TELEMETRY';
                } else if (node.type === 'leaf_stage') {
                  strokeColor = '#6366F1';
                  badgeText = 'STAGE';
                } else if (node.type === 'leaf_quarantine') {
                  strokeColor = '#EF4444';
                  badgeText = 'QUARANTINE';
                }

                if (isSelected) {
                  strokeColor = '#38BDF8';
                  fill = '#0f172a';
                }

                return (
                  <g
                    key={node.id}
                    transform={`translate(${coord.x}, ${coord.y})`}
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => {
                      playTone(node.type === 'root' ? 882 : 600 + node.depth * 60, 0.05);
                      setSelectedNodeId(node.id);
                    }}
                    onMouseEnter={() => {
                      setHoveredNodeId(node.id);
                    }}
                    onMouseLeave={() => {
                      setHoveredNodeId(null);
                    }}
                  >
                    {/* Pulsing ring on selection or active path */}
                    {(isSelected || isHovered) && (
                      <circle
                        r={node.type === 'root' ? 36 : node.type === 'branch' ? 28 : 22}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={2}
                        opacity={0.5}
                        className="animate-ping"
                      />
                    )}

                    {/* Node Circle Shape */}
                    <circle
                      r={node.type === 'root' ? 28 : node.type === 'branch' ? 22 : 17}
                      fill={fill}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 3 : isPath ? 2 : 1.5}
                      filter={isSelected || isHovered ? 'url(#glow-cyan)' : undefined}
                    />

                    {/* Node Core Icon / Text */}
                    <text
                      textAnchor="middle"
                      dy={node.type === 'root' ? 4 : 3}
                      fill={strokeColor}
                      fontSize={node.type === 'root' ? 12 : node.type === 'branch' ? 10 : 9}
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight="bold"
                    >
                      {node.type === 'root'
                        ? 'ROOT'
                        : node.type === 'branch'
                        ? node.id.includes('deca')
                          ? '10/10'
                          : node.id.includes('seals')
                          ? '14.9K'
                          : node.id.includes('snap')
                          ? 'SNAP'
                          : node.id.includes('forensics')
                          ? 'S1-12'
                          : 'QUAR'
                        : node.metadata.sealIndex || 'LEAF'}
                    </text>

                    {/* Label below node */}
                    <text
                      textAnchor="middle"
                      y={node.type === 'root' ? 44 : node.type === 'branch' ? 36 : 28}
                      fill={isSelected ? '#ffffff' : '#94A3B8'}
                      fontSize={node.type === 'root' ? 11 : 9}
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                    >
                      {node.name.length > 22 ? node.name.slice(0, 20) + '...' : node.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Bottom Bar: Path breadcrumbs */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-zinc-500">Cryptographic Path:</span>
              {Array.from(pathNodeIds).reverse().map((id, idx, arr) => (
                <React.Fragment key={id}>
                  <button
                    onClick={() => setSelectedNodeId(id)}
                    className={`hover:underline ${id === selectedNodeId ? 'text-cyan-300 font-bold' : 'text-zinc-400'}`}
                  >
                    {merkleData[id]?.name || id}
                  </button>
                  {idx < arr.length - 1 && <ChevronRight className="w-3 h-3 text-zinc-600" />}
                </React.Fragment>
              ))}
            </div>
            <span className="text-[11px] text-zinc-500 hidden sm:inline">
              Click node to trace proof • Hover to inspect metadata hash
            </span>
          </div>
        </div>

        {/* Right 4 Cols: Live Metadata & Hash Inspector Panel */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Node Details Card */}
          <div className="p-5 rounded-[28px] bg-gradient-to-br from-[#0c1020]/95 to-[#070914]/95 border border-cyan-500/30 backdrop-blur-2xl shadow-xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    selectedNode.status === 'VERIFIED'
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                      : selectedNode.status === 'SEALED'
                      ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                      : 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                  }`}
                />
                <span className="font-bold text-white tracking-wide uppercase">
                  {selectedNode.type.replace('_', ' ')} INSPECTION
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">
                DEPTH: L{selectedNode.depth}
              </span>
            </div>

            <div>
              <div className="text-zinc-400 text-[11px]">Node Identifier</div>
              <div className="text-sm font-bold text-cyan-100 mt-0.5">{selectedNode.name}</div>
              <p className="text-[11px] text-zinc-400 font-sans mt-1 leading-relaxed">
                {selectedNode.metadata.description}
              </p>
            </div>

            {/* Cryptographic Hash Inspector with Copy */}
            <div className="p-3 bg-black/60 rounded-xl border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Cryptographic Digest (SHA-256 / Post-Quantum)</span>
                <button
                  onClick={() => handleCopy(selectedNode.hash, 'Node Hash')}
                  className="text-cyan-400 hover:text-cyan-200 flex items-center gap-1 text-[10px] font-bold"
                >
                  {copiedHash === selectedNode.hash ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">COPIED</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>COPY</span>
                    </>
                  )}
                </button>
              </div>
              <div className="font-mono text-[11px] text-cyan-300 break-all leading-tight selection:bg-cyan-500/30">
                {selectedNode.hash}
              </div>
            </div>

            {/* Parent Hash Link */}
            {selectedNode.parentHash && merkleData[selectedNode.parentHash] && (
              <div
                onClick={() => {
                  playTone(550, 0.04);
                  setSelectedNodeId(selectedNode.parentHash!);
                }}
                className="p-2.5 bg-black/40 hover:bg-white/5 rounded-xl border border-white/5 cursor-pointer transition-all flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] text-zinc-500 block">Parent Merkle Branch</span>
                  <span className="text-xs font-bold text-violet-300">
                    {merkleData[selectedNode.parentHash].name}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </div>
            )}

            {/* Metadata Badges */}
            <div className="space-y-2 pt-1 border-t border-white/5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Signature Standard:</span>
                <span className="text-zinc-200 font-bold">{selectedNode.signatureScheme}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Seal Timestamp:</span>
                <span className="text-zinc-300">{selectedNode.timestamp}</span>
              </div>
              {selectedNode.metadata.statute && (
                <div className="flex items-start justify-between gap-2 pt-1">
                  <span className="text-zinc-500 shrink-0">Legal Statute:</span>
                  <span className="text-emerald-300 text-right font-medium">
                    {selectedNode.metadata.statute}
                  </span>
                </div>
              )}
            </div>

            {/* Telemetry Metrics if present */}
            {selectedNode.metadata.metrics && (
              <div className="p-3 bg-black/40 rounded-xl border border-cyan-500/20 space-y-1.5">
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                  Snapshot Hardware Metrics
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {Object.entries(selectedNode.metadata.metrics).map(([k, v]) => (
                    <div key={k} className="p-1.5 rounded-lg bg-black/30 border border-white/5">
                      <span className="text-zinc-500 text-[10px] block">{k}</span>
                      <span className="text-white font-bold">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Hover Tooltip Preview Card */}
          {hoveredNode && hoveredNode.id !== selectedNode.id && (
            <div className="p-3.5 rounded-2xl bg-[#0e1424]/90 border border-cyan-500/40 backdrop-blur-xl animate-in fade-in duration-150 font-mono text-xs shadow-lg">
              <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                <span>Hovered Seal:</span>
                <span className="text-cyan-400 font-bold">{hoveredNode.type.toUpperCase()}</span>
              </div>
              <div className="font-bold text-white text-xs">{hoveredNode.name}</div>
              <div className="text-[10px] text-zinc-400 font-mono truncate mt-1">
                {hoveredNode.hash}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
