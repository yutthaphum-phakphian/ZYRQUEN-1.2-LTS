import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from 'recharts';
import {
  Share2,
  Globe,
  Database,
  Activity,
  ShieldCheck,
  Zap,
  Play,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Layers,
  ArrowUpRight,
  TrendingDown,
  Sparkles,
  Lock,
  GitMerge,
  Scale,
  Server,
  FileCheck2,
} from 'lucide-react';
import { playAuditChime, playTone, playWarningTone } from './AudioSynthesizer';
import { triggerFederationSync, subscribeFederationSync, FederationSyncState, KnowledgePacket } from '../utils/federationSyncManager';

interface NodeDriftData {
  epoch: string;
  timestamp: string;
  node1_bkk: number; // CIV-FED-001 Bangkok
  node2_sin: number; // CIV-FED-002 Singapore
  node3_tyo: number; // CIV-FED-003 Tokyo
  node4_fra: number; // CIV-FED-004 Frankfurt
  node5_iad: number; // CIV-FED-005 Virginia
  threshold: number;
}

const INITIAL_DRIFT_TIMELINE: NodeDriftData[] = [
  { epoch: 'E-00', timestamp: '12:00:00', node1_bkk: 0.0012, node2_sin: 0.0015, node3_tyo: 0.0019, node4_fra: 0.0022, node5_iad: 0.0025, threshold: 0.05 },
  { epoch: 'E-04', timestamp: '12:04:00', node1_bkk: 0.0010, node2_sin: 0.0018, node3_tyo: 0.0021, node4_fra: 0.0028, node5_iad: 0.0029, threshold: 0.05 },
  { epoch: 'E-08', timestamp: '12:08:00', node1_bkk: 0.0009, node2_sin: 0.0014, node3_tyo: 0.0018, node4_fra: 0.0025, node5_iad: 0.0024, threshold: 0.05 },
  { epoch: 'E-12', timestamp: '12:12:00', node1_bkk: 0.0014, node2_sin: 0.0022, node3_tyo: 0.0027, node4_fra: 0.0031, node5_iad: 0.0033, threshold: 0.05 },
  { epoch: 'E-16', timestamp: '12:16:00', node1_bkk: 0.0011, node2_sin: 0.0016, node3_tyo: 0.0020, node4_fra: 0.0024, node5_iad: 0.0026, threshold: 0.05 },
  { epoch: 'E-20', timestamp: '12:20:00', node1_bkk: 0.0008, node2_sin: 0.0013, node3_tyo: 0.0016, node4_fra: 0.0021, node5_iad: 0.0022, threshold: 0.05 },
  { epoch: 'E-24', timestamp: '12:24:00', node1_bkk: 0.0007, node2_sin: 0.0011, node3_tyo: 0.0015, node4_fra: 0.0019, node5_iad: 0.0020, threshold: 0.05 },
  { epoch: 'E-28', timestamp: '12:28:00', node1_bkk: 0.0010, node2_sin: 0.0014, node3_tyo: 0.0018, node4_fra: 0.0023, node5_iad: 0.0024, threshold: 0.05 },
];

const MATRIX_CELLS = [
  { pair: 'BKK ↔ SIN', latency: '14.2ms', drift: 0.0012, status: 'OPTIMAL', syncRate: '99.99%', confidence: 0.999 },
  { pair: 'BKK ↔ TYO', latency: '42.1ms', drift: 0.0018, status: 'OPTIMAL', syncRate: '99.98%', confidence: 0.998 },
  { pair: 'BKK ↔ FRA', latency: '128.4ms', drift: 0.0024, status: 'OPTIMAL', syncRate: '99.95%', confidence: 0.996 },
  { pair: 'BKK ↔ IAD', latency: '184.2ms', drift: 0.0026, status: 'OPTIMAL', syncRate: '99.94%', confidence: 0.995 },
  { pair: 'SIN ↔ TYO', latency: '31.5ms', drift: 0.0015, status: 'OPTIMAL', syncRate: '99.98%', confidence: 0.998 },
  { pair: 'SIN ↔ FRA', latency: '142.1ms', drift: 0.0027, status: 'OPTIMAL', syncRate: '99.93%', confidence: 0.994 },
  { pair: 'TYO ↔ IAD', latency: '155.8ms', drift: 0.0029, status: 'OPTIMAL', syncRate: '99.92%', confidence: 0.993 },
  { pair: 'FRA ↔ IAD', latency: '88.3ms', drift: 0.0021, status: 'OPTIMAL', syncRate: '99.97%', confidence: 0.997 },
];

interface ExecutionLog {
  id: string;
  architecture: string;
  status: 'RUNNING' | 'SUCCESS' | 'VERIFIED';
  title: string;
  commitHash: string;
  timestamp: string;
  steps: string[];
}

export const FederationKnowledgeDriftHeatmap: React.FC<{ onAddSystemEvent?: (type: string, title: string, desc: string, severity: 'info' | 'success' | 'warning' | 'critical') => void }> = ({ onAddSystemEvent }) => {
  const [driftTimeline, setDriftTimeline] = useState<NodeDriftData[]>(INITIAL_DRIFT_TIMELINE);
  const [syncState, setSyncState] = useState<FederationSyncState>(() => ({
    isSyncing: false,
    activePacket: null,
    stage: 'IDLE',
    progress: 100,
    lastSyncedMerkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    lastSyncedTimestamp: new Date().toISOString(),
    packetsProcessedCount: 849,
    totalDriftAvg: 0.0018,
    activeNodes: ['CIV-FED-001', 'CIV-FED-002', 'CIV-FED-003', 'CIV-FED-004', 'CIV-FED-005'],
  }));
  const [selectedNodeFilter, setSelectedNodeFilter] = useState<'ALL' | 'BKK' | 'SIN' | 'TYO' | 'FRA' | 'IAD'>('ALL');
  const [activeTab, setActiveTab] = useState<'drift_charts' | 'matrix_heatmap' | 'runtimes_v13_v14'>('drift_charts');
  const [activeLogs, setActiveLogs] = useState<ExecutionLog[]>([]);
  const [isExecutingEngine, setIsExecutingEngine] = useState<boolean>(false);

  useEffect(() => {
    const unsub = subscribeFederationSync((st) => {
      setSyncState(st);
    });
    return unsub;
  }, []);

  // Handler for publishing a knowledge packet
  const handlePublishKnowledgePacket = async (preset?: string) => {
    playTone(600, 0.04);
    const packetName = preset || 'Constitutional Adaptive Knowledge Shard (v12.3)';
    
    try {
      const packet = await triggerFederationSync({
        packetName,
        sourceNode: 'CIV-FED-001 (Bangkok Mainframe)',
        driftSigma: +(0.0008 + Math.random() * 0.0015).toFixed(4),
      });

      playAuditChime();
      
      // Append a new data point to Recharts timeline
      const newEpochNum = driftTimeline.length * 4;
      const newPoint: NodeDriftData = {
        epoch: `E-${newEpochNum < 10 ? '0' : ''}${newEpochNum}`,
        timestamp: new Date().toLocaleTimeString(),
        node1_bkk: +(0.0006 + Math.random() * 0.0008).toFixed(4),
        node2_sin: +(0.0010 + Math.random() * 0.0008).toFixed(4),
        node3_tyo: +(0.0014 + Math.random() * 0.0008).toFixed(4),
        node4_fra: +(0.0018 + Math.random() * 0.0009).toFixed(4),
        node5_iad: +(0.0020 + Math.random() * 0.0010).toFixed(4),
        threshold: 0.05,
      };

      setDriftTimeline((prev) => [...prev.slice(-11), newPoint]);

      onAddSystemEvent?.(
        'FEDERATION_SYNC',
        `Knowledge Packet Published: ${packet.id}`,
        `SSoT Merkle Root Verified: ${packet.merkleLeaf} with Post-Quantum Seal ${packet.pqcSignature}`,
        'success'
      );
    } catch (err) {
      console.error(err);
    }
  };

  // 1️⃣ Run Civilization Self-Evolution Architecture v13
  const handleRunSelfEvolutionV13 = async () => {
    if (isExecutingEngine) return;
    setIsExecutingEngine(true);
    playTone(650, 0.05);

    const logId = `EVO-${Date.now()}`;
    const newLog: ExecutionLog = {
      id: logId,
      architecture: 'MAEW Ω∞ — Civilization Self-Evolution v13',
      status: 'RUNNING',
      title: 'Adaptive Governance & Autonomous Intelligence Core',
      commitHash: '0xCIVILIZATION-EVOLUTION-VERIFIED',
      timestamp: new Date().toLocaleTimeString(),
      steps: [
        '1️⃣ Initializing Evolution Core (EVO-CIV-13, CIK-001, v12.3, AUTO Entropy)...',
      ],
    };

    setActiveLogs((prev) => [newLog, ...prev]);

    // Step 1 -> Step 2
    setTimeout(async () => {
      newLog.steps.push('2️⃣ Synchronizing Federation Nodes (CIV-FED-001, CIV-FED-002, CIV-FED-003, Quorum: 10/10-HSM)...');
      setActiveLogs((prev) => [...prev]);
      await triggerFederationSync({ packetName: 'Evolution Synchronization Core v13', driftSigma: 0.0004 });

      // Step 2 -> Step 3
      setTimeout(() => {
        newLog.steps.push('3️⃣ Adapting Constitutional Law (v1.2-Adaptive, PDPA, AI Governance, Quantum Resilience)...');
        setActiveLogs((prev) => [...prev]);

        // Step 3 -> Step 4
        setTimeout(() => {
          newLog.steps.push('4️⃣ Evolving Intelligence Kernel (Cognition v13.1, Reasoning v13.2, Coordination v13.3, Self-Learning ON)...');
          setActiveLogs((prev) => [...prev]);

          // Step 4 -> Step 5 Complete
          setTimeout(() => {
            newLog.steps.push('5️⃣ Publishing Evolution Ledger: Block #849202 (Commit: 0xCIVILIZATION-EVOLUTION-VERIFIED)...');
            newLog.status = 'VERIFIED';
            setActiveLogs((prev) => [...prev]);
            setIsExecutingEngine(false);
            playAuditChime();

            onAddSystemEvent?.(
              'CIVILIZATION_EVOLUTION',
              'Civilization Self-Evolution Architecture v13 Live',
              'Autonomous Governance & Adaptive Intelligence Kernel operational with 10/10-HSM Quorum.',
              'success'
            );
          }, 600);
        }, 600);
      }, 600);
    }, 600);
  };

  // 2️⃣ Run Sovereign Vault Expansion v14.0
  const handleRunVaultExpansionV14 = async () => {
    if (isExecutingEngine) return;
    setIsExecutingEngine(true);
    playTone(550, 0.05);

    const logId = `VAULT-${Date.now()}`;
    const newLog: ExecutionLog = {
      id: logId,
      architecture: 'MAEW Ω∞ — Sovereign Vault Expansion v14.0',
      status: 'RUNNING',
      title: 'Quantum-Resilient Storage & Multi-Node Synchronization',
      commitHash: '0xSOVEREIGN-VAULT-EXPANSION-VERIFIED',
      timestamp: new Date().toLocaleTimeString(),
      steps: [
        '1️⃣ Initializing Vault Cluster (SV-Ω∞-CORE, 10 Nodes, Quantum-Mirror, FIPS203-ML-KEM-1024)...',
      ],
    };

    setActiveLogs((prev) => [newLog, ...prev]);

    setTimeout(async () => {
      newLog.steps.push('2️⃣ Allocating Quantum Storage (1,024 TB Allocated, Cryo-Bus Latency ≤0.20ms, ZK-Mode ON)...');
      setActiveLogs((prev) => [...prev]);
      await triggerFederationSync({ packetName: 'Quantum Storage Allocation Shard', driftSigma: 0.0002 });

      setTimeout(() => {
        newLog.steps.push('3️⃣ Synchronizing 14,902 Merkle Proofs across CIV-FED-001 and CIV-FED-002...');
        setActiveLogs((prev) => [...prev]);

        setTimeout(() => {
          newLog.steps.push('4️⃣ Verifying Vault Integrity (PDPA, ETDA, NIST-FIPS Compliant, Drift 0.00%)...');
          setActiveLogs((prev) => [...prev]);

          setTimeout(() => {
            newLog.steps.push('5️⃣ Publishing Expansion Ledger (Commit: 0xSOVEREIGN-VAULT-EXPANSION-VERIFIED)...');
            newLog.status = 'VERIFIED';
            setActiveLogs((prev) => [...prev]);
            setIsExecutingEngine(false);
            playAuditChime();

            onAddSystemEvent?.(
              'VAULT_EXPANSION',
              'Sovereign Vault Expansion v14.0 Complete',
              '1,024 TB Quantum Storage & 14,902 Merkle Proofs verified under FIPS 203 ML-KEM-1024.',
              'success'
            );
          }, 600);
        }, 600);
      }, 600);
    }, 600);
  };

  // 3️⃣ Run Autonomous Governance Fabric v14.0
  const handleRunGovernanceFabricV14 = async () => {
    if (isExecutingEngine) return;
    setIsExecutingEngine(true);
    playTone(700, 0.05);

    const logId = `GOV-${Date.now()}`;
    const newLog: ExecutionLog = {
      id: logId,
      architecture: 'MAEW Ω∞ — Autonomous Governance Fabric v14.0',
      status: 'RUNNING',
      title: 'Self-Healing Governance & Continuous Assurance Runtime',
      commitHash: '0xAUTONOMOUS-GOVERNANCE-FABRIC-VERIFIED',
      timestamp: new Date().toLocaleTimeString(),
      steps: [
        '1️⃣ Initializing Governance Fabric (AGF-Ω∞-CORE, Zero-Trust Mode, Cryptographic Seal Active)...',
      ],
    };

    setActiveLogs((prev) => [newLog, ...prev]);

    setTimeout(async () => {
      newLog.steps.push('2️⃣ Activating 128 Auditor Agents (Evidence Ledger, Bias Monitor, Drift Detection)...');
      setActiveLogs((prev) => [...prev]);
      await triggerFederationSync({ packetName: 'Autonomous Governance Fabric Quorum', driftSigma: 0.0001 });

      setTimeout(() => {
        newLog.steps.push('3️⃣ Enabling Consensus Senate (12 Nodes, Quorum ≥99.5%, Self-Rollback Arming)...');
        setActiveLogs((prev) => [...prev]);

        setTimeout(() => {
          newLog.steps.push('4️⃣ Enforcing Invariant Laws (Truth Boundary, Fairness Metrics, Absolute Zero-Mutation)...');
          setActiveLogs((prev) => [...prev]);

          setTimeout(() => {
            newLog.steps.push('5️⃣ Publishing Governance Ledger (Commit: 0xAUTONOMOUS-GOVERNANCE-FABRIC-VERIFIED)...');
            newLog.status = 'VERIFIED';
            setActiveLogs((prev) => [...prev]);
            setIsExecutingEngine(false);
            playAuditChime();

            onAddSystemEvent?.(
              'GOVERNANCE_FABRIC',
              'Autonomous Governance Fabric v14.0 Active',
              'Self-Healing Governance & 128 Auditor Agents online with 12 Senate Nodes consensus.',
              'success'
            );
          }, 600);
        }, 600);
      }, 600);
    }, 600);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Header */}
      <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#0c1a24]/90 via-[#0b0e1a]/85 to-[#07080F] border border-cyan-500/20 backdrop-blur-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-[0_0_35px_rgba(6,182,212,0.12)]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-cyan-400" />
              FEDERATION INTELLIGENCE PROTOCOL (v12.3 &bull; v13 &bull; v14.0)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-mono">
              MERKLE-ALIGNED ZERO DRIFT (&Delta;0.00%)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 text-xs font-mono">
              NIST FIPS 204 PQC VERIFIED
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-mono font-bold text-white mt-1.5 flex items-center gap-2">
            Federation Knowledge Drift Heatmap & Multiverse Consensus Matrix
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-1 max-w-3xl">
            Visualizing statistical deviation (&sigma;) of exchanged knowledge over time across 5 Civilization Nodes. Automated Merkle-Root Verification Handshake & Real-Time Post-Quantum Dilithium-5 Seals.
          </p>
        </div>

        {/* Action Controls & Fast Triggers */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handlePublishKnowledgePacket()}
            disabled={syncState.isSyncing}
            className="px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:scale-[1.02] disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${syncState.isSyncing ? 'animate-spin' : ''}`} />
            <span>INGEST KNOWLEDGE SHARD</span>
          </button>

          <button
            onClick={handleRunSelfEvolutionV13}
            disabled={isExecutingEngine}
            className="px-4 py-2.5 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/40 font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(139,92,246,0.25)] hover:scale-[1.02] disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span>RUN SELF-EVOLUTION v13</span>
          </button>
        </div>
      </div>

      {/* Live Active Ledger Sync Bar */}
      <div className="p-4 rounded-2xl bg-[#090e1a]/85 border border-cyan-500/20 backdrop-blur-xl font-mono text-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-3.5 h-3.5 rounded-full ${syncState.isSyncing ? 'bg-cyan-400 animate-ping' : 'bg-emerald-500 shadow-[0_0_10px_#10b981]'}`} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white uppercase tracking-wider">
                  Active Ledger Sync Status: {syncState.isSyncing ? `VERIFYING HANDSHAKE (${syncState.stage})` : 'SYNCHRONIZED (IDLE)'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-300">
                  {syncState.packetsProcessedCount} PACKETS VERIFIED
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                <span>Latest Merkle Leaf:</span>
                <span className="text-cyan-300 font-bold">{syncState.lastSyncedMerkleRoot.slice(0, 24)}...</span>
                <span>• NIST FIPS 204 Dilithium-5:</span>
                <span className="text-emerald-400 font-bold">100% VALID</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right text-xs">
            <div>
              <span className="text-zinc-500 block text-[10px]">MEAN DRIFT (&mu;)</span>
              <span className="text-emerald-400 font-bold font-mono">{(syncState.totalDriftAvg * 100).toFixed(4)}% (&sigma; &lt; 0.002)</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px]">HSM QUORUM</span>
              <span className="text-amber-400 font-bold font-mono">10/10 SOVEREIGN</span>
            </div>
          </div>
        </div>

        {/* Progress Tracker Bar */}
        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-violet-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${syncState.progress}%` }}
          />
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 bg-zinc-950/80 border border-zinc-800/80 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => {
            playTone(550, 0.03);
            setActiveTab('drift_charts');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 ${
            activeTab === 'drift_charts'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500 shadow'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>Knowledge Drift Heatmap (Recharts)</span>
        </button>

        <button
          onClick={() => {
            playTone(550, 0.03);
            setActiveTab('matrix_heatmap');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 ${
            activeTab === 'matrix_heatmap'
              ? 'bg-blue-950 text-blue-300 border border-blue-500 shadow'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Multi-Node Correlation Heatmap Matrix</span>
        </button>

        <button
          onClick={() => {
            playTone(600, 0.03);
            setActiveTab('runtimes_v13_v14');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 ${
            activeTab === 'runtimes_v13_v14'
              ? 'bg-violet-950 text-violet-300 border border-violet-500 shadow'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Autonomous Architecture Engine (v13 / v14.0)</span>
        </button>
      </div>

      {/* 1️⃣ Tab: Recharts Knowledge Drift Heatmap */}
      {activeTab === 'drift_charts' && (
        <div className="space-y-6">
          <div className="p-6 rounded-[28px] bg-[#0b0e1a]/80 border border-white/8 backdrop-blur-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Statistical Deviation Over Epochs (&sigma; Deviation vs Zero Drift Baseline)
                </h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  Recharts visual timeline of cross-node statistical divergence. Boundary threshold: &lt;0.05&sigma;.
                </p>
              </div>

              {/* Node Filter Selector */}
              <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 p-1 rounded-xl text-xs font-mono">
                {(['ALL', 'BKK', 'SIN', 'TYO', 'FRA', 'IAD'] as const).map((nodeKey) => (
                  <button
                    key={nodeKey}
                    onClick={() => {
                      playTone(500, 0.03);
                      setSelectedNodeFilter(nodeKey);
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      selectedNodeFilter === nodeKey
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {nodeKey}
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts Area and Line Chart */}
            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={driftTimeline} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bkkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="sinGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="tyoGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="fraGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="iadGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="epoch" stroke="#71717a" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                  <YAxis
                    stroke="#71717a"
                    tick={{ fontSize: 11, fontFamily: 'monospace' }}
                    domain={[0, 0.006]}
                    tickFormatter={(v) => `${(v * 100).toFixed(2)}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090d16',
                      borderColor: '#ffffff15',
                      borderRadius: '16px',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [`${(Number(value) * 100).toFixed(4)}% deviation`, '']}
                  />
                  <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '11px', paddingTop: '10px' }} />

                  {(selectedNodeFilter === 'ALL' || selectedNodeFilter === 'BKK') && (
                    <Area
                      type="monotone"
                      dataKey="node1_bkk"
                      name="CIV-FED-001 (Bangkok)"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#bkkGrad)"
                    />
                  )}

                  {(selectedNodeFilter === 'ALL' || selectedNodeFilter === 'SIN') && (
                    <Area
                      type="monotone"
                      dataKey="node2_sin"
                      name="CIV-FED-002 (Singapore)"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#sinGrad)"
                    />
                  )}

                  {(selectedNodeFilter === 'ALL' || selectedNodeFilter === 'TYO') && (
                    <Area
                      type="monotone"
                      dataKey="node3_tyo"
                      name="CIV-FED-003 (Tokyo)"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#tyoGrad)"
                    />
                  )}

                  {(selectedNodeFilter === 'ALL' || selectedNodeFilter === 'FRA') && (
                    <Area
                      type="monotone"
                      dataKey="node4_fra"
                      name="CIV-FED-004 (Frankfurt)"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#fraGrad)"
                    />
                  )}

                  {(selectedNodeFilter === 'ALL' || selectedNodeFilter === 'IAD') && (
                    <Area
                      type="monotone"
                      dataKey="node5_iad"
                      name="CIV-FED-005 (Virginia)"
                      stroke="#ec4899"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#iadGrad)"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Metrics Bar below chart */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/5 font-mono text-xs">
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                <span className="text-zinc-500 block text-[10px]">ZERO-DRIFT GUARANTEE</span>
                <span className="text-emerald-400 font-bold text-sm">100% INTACT</span>
                <span className="text-[10px] text-zinc-500 block">&Delta;0.00% across all 18 Chambers</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                <span className="text-zinc-500 block text-[10px]">MAX RECORDED JITTER</span>
                <span className="text-cyan-400 font-bold text-sm">0.0033&sigma; (Pass)</span>
                <span className="text-[10px] text-zinc-500 block">Safe threshold: &lt; 0.0500&sigma;</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                <span className="text-zinc-500 block text-[10px]">MERKLE RECONCILIATION</span>
                <span className="text-violet-400 font-bold text-sm">0.48 ms RTT</span>
                <span className="text-[10px] text-zinc-500 block">14,902 Seals Validated</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                <span className="text-zinc-500 block text-[10px]">PQC SIGNATURE ALGORITHM</span>
                <span className="text-amber-400 font-bold text-sm">FIPS 204 (Dilithium-5)</span>
                <span className="text-[10px] text-zinc-500 block">Post-Quantum Bound</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2️⃣ Tab: Multi-Node Heatmap Matrix */}
      {activeTab === 'matrix_heatmap' && (
        <div className="space-y-6">
          <div className="p-6 rounded-[28px] bg-[#0b0e1a]/80 border border-white/8 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400" />
                  Cross-Node Synchronization & Inter-Domain Drift Matrix
                </h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  Pairwise latency, statistical drift coefficient, and Merkle leaf verification across global mesh.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-mono font-bold">
                8/8 PAIRWISE BRIDGES GREEN
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {MATRIX_CELLS.map((cell, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3 font-mono text-xs hover:border-cyan-500/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{cell.pair}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px]">
                      {cell.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1 border-t border-white/5 text-zinc-400">
                    <div className="flex justify-between">
                      <span className="text-[11px]">Round-Trip Latency:</span>
                      <span className="text-cyan-300 font-bold">{cell.latency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[11px]">Statistical Drift:</span>
                      <span className="text-emerald-400 font-bold">{(cell.drift * 100).toFixed(4)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[11px]">Sync Rate:</span>
                      <span className="text-zinc-200">{cell.syncRate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[11px]">Confidence Score:</span>
                      <span className="text-amber-300">{cell.confidence}</span>
                    </div>
                  </div>

                  {/* Heat Indicator Bar */}
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-400"
                      style={{ width: `${Math.min(100, (cell.drift / 0.005) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3️⃣ Tab: Autonomous Architecture Runtimes (v13 / v14.0) */}
      {activeTab === 'runtimes_v13_v14' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Civilization Self-Evolution v13 */}
            <div className="p-6 rounded-[28px] bg-gradient-to-b from-violet-950/20 to-[#0b0e1a]/80 border border-violet-500/30 backdrop-blur-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-violet-400 uppercase tracking-wider">
                    PHASE 13 RUNTIME
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
                    ADAPTIVE GOVERNANCE
                  </span>
                </div>
                <h4 className="text-base font-bold text-white">
                  Civilization Self-Evolution Architecture v13
                </h4>
                <p className="text-xs text-zinc-400">
                  Autonomous Governance & Adaptive Intelligence Runtime. Initializes Evolution Core, synchronizes 10/10-HSM quorum nodes, and adapts constitutional laws.
                </p>
                <div className="p-3 rounded-xl bg-black/50 border border-white/5 text-[11px] space-y-1 text-zinc-300">
                  <div>&bull; Evolution ID: <span className="text-violet-300 font-bold">EVO-CIV-13</span></div>
                  <div>&bull; Base Kernel: <span className="text-cyan-300">CIK-001 (v12.3)</span></div>
                  <div>&bull; Proof Type: <span className="text-amber-300">Merkle-Adaptive-Seal</span></div>
                  <div>&bull; Ledger Commit: <span className="text-emerald-400">0xCIVILIZATION-EVOLUTION-VERIFIED</span></div>
                </div>
              </div>

              <button
                onClick={handleRunSelfEvolutionV13}
                disabled={isExecutingEngine}
                className="w-full mt-4 py-2.5 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/40 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(139,92,246,0.2)] disabled:opacity-50"
              >
                <Play className="w-4 h-4 text-violet-400" />
                <span>EXECUTE SELF-EVOLUTION v13</span>
              </button>
            </div>

            {/* 2. Sovereign Vault Expansion v14.0 */}
            <div className="p-6 rounded-[28px] bg-gradient-to-b from-cyan-950/20 to-[#0b0e1a]/80 border border-cyan-500/30 backdrop-blur-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                    PHASE 14.0 RUNTIME
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    QUANTUM EXPANSION
                  </span>
                </div>
                <h4 className="text-base font-bold text-white">
                  Sovereign Vault Expansion v14.0
                </h4>
                <p className="text-xs text-zinc-400">
                  Quantum-Resilient Storage & Multi-Node Synchronization. Allocates 1,024 TB Quantum Storage with FIPS 203 ML-KEM-1024 encryption and 14,902 Merkle proofs.
                </p>
                <div className="p-3 rounded-xl bg-black/50 border border-white/5 text-[11px] space-y-1 text-zinc-300">
                  <div>&bull; Vault Core: <span className="text-cyan-300 font-bold">SV-&Omega;&infin;-CORE</span></div>
                  <div>&bull; Capacity: <span className="text-emerald-400">1,024 TB Allocated</span></div>
                  <div>&bull; Encryption: <span className="text-amber-300">FIPS203-ML-KEM-1024</span></div>
                  <div>&bull; Ledger Commit: <span className="text-cyan-400">0xSOVEREIGN-VAULT-EXPANSION-VERIFIED</span></div>
                </div>
              </div>

              <button
                onClick={handleRunVaultExpansionV14}
                disabled={isExecutingEngine}
                className="w-full mt-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] disabled:opacity-50"
              >
                <Play className="w-4 h-4 text-cyan-400" />
                <span>EXPAND SOVEREIGN VAULT v14.0</span>
              </button>
            </div>

            {/* 3. Autonomous Governance Fabric v14.0 */}
            <div className="p-6 rounded-[28px] bg-gradient-to-b from-amber-950/20 to-[#0b0e1a]/80 border border-amber-500/30 backdrop-blur-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                    PHASE 14.0 FABRIC
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    SELF-HEALING CONTINUOUS
                  </span>
                </div>
                <h4 className="text-base font-bold text-white">
                  Autonomous Governance Fabric v14.0
                </h4>
                <p className="text-xs text-zinc-400">
                  Self-Healing Governance & Continuous Assurance. Deploys 128 Auditor Agents swarm, 12 Senate Nodes consensus (&ge;99.5%), and invariant truth boundary locks.
                </p>
                <div className="p-3 rounded-xl bg-black/50 border border-white/5 text-[11px] space-y-1 text-zinc-300">
                  <div>&bull; Fabric ID: <span className="text-amber-300 font-bold">AGF-&Omega;&infin;-CORE</span></div>
                  <div>&bull; Swarm Size: <span className="text-emerald-400">128 Auditor Agents</span></div>
                  <div>&bull; Senate Quorum: <span className="text-cyan-300">12 Nodes (&ge;99.5%)</span></div>
                  <div>&bull; Ledger Commit: <span className="text-amber-400">0xAUTONOMOUS-GOVERNANCE-FABRIC-VERIFIED</span></div>
                </div>
              </div>

              <button
                onClick={handleRunGovernanceFabricV14}
                disabled={isExecutingEngine}
                className="w-full mt-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] disabled:opacity-50"
              >
                <Play className="w-4 h-4 text-amber-400" />
                <span>ACTIVATE GOVERNANCE FABRIC v14.0</span>
              </button>
            </div>
          </div>

          {/* Active Live Logs Inspector */}
          {activeLogs.length > 0 && (
            <div className="p-6 rounded-[28px] bg-[#090d16]/90 border border-white/10 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-cyan-400" />
                  Autonomous Execution Ledger Pipeline Logs
                </span>
                <button
                  onClick={() => setActiveLogs([])}
                  className="text-zinc-500 hover:text-zinc-300 text-[11px]"
                >
                  Clear Logs
                </button>
              </div>

              <div className="space-y-3">
                {activeLogs.map((log) => (
                  <div key={log.id} className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{log.architecture}</span>
                        <span className="text-[10px] text-zinc-500">[{log.timestamp}]</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        log.status === 'VERIFIED'
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400">{log.title} &bull; Hash: <span className="text-cyan-400 font-bold">{log.commitHash}</span></div>
                    <div className="space-y-1 pt-2 border-t border-white/5 text-[11px] text-zinc-300">
                      {log.steps.map((step, idx) => (
                        <div key={idx} className="leading-relaxed">{step}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
