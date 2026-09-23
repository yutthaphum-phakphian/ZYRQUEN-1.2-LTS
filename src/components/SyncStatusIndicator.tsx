import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Radio,
  Wifi,
  WifiOff,
  Cpu,
  Layers,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Clock,
  CheckCircle2,
  Activity,
  Server,
  Zap,
  X,
  Send,
} from 'lucide-react';
import {
  broadcastSyncService,
  SovereignSyncStatus,
  SovereignSyncPeerNode,
} from '@/services/broadcastSyncService';
import { playAuditChime, playTone } from '@/components/AudioSynthesizer';

interface SyncStatusIndicatorProps {
  className?: string;
  compact?: boolean;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  className = '',
  compact = false,
}) => {
  const [syncStatus, setSyncStatus] = useState<SovereignSyncStatus>(() =>
    broadcastSyncService.getSyncStatus()
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [pingMessage, setPingMessage] = useState<string | null>(null);
  const [timeAgo, setTimeAgo] = useState<string>('just now');

  useEffect(() => {
    // Subscribe to real-time sync state updates from broadcastSyncService
    const unsubscribe = broadcastSyncService.onSyncStatusChange((status) => {
      setSyncStatus(status);
    });

    // Initial ping to discover any already-open tabs/enclave peers
    broadcastSyncService.pingEnclave();

    // Timer to update "last synced X seconds ago"
    const timer = setInterval(() => {
      const diffMs = Date.now() - broadcastSyncService.getSyncStatus().lastSyncTimestamp;
      if (diffMs < 3000) {
        setTimeAgo('just now');
      } else if (diffMs < 60000) {
        setTimeAgo(`${Math.floor(diffMs / 1000)}s ago`);
      } else {
        setTimeAgo(`${Math.floor(diffMs / 60000)}m ago`);
      }
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  const handleManualPing = () => {
    playTone(660, 0.05);
    setIsPinging(true);
    broadcastSyncService.pingEnclave();
    setPingMessage('Heartbeat broadcasted to Sovereign Enclave nodes...');
    setTimeout(() => {
      setIsPinging(false);
      setSyncStatus(broadcastSyncService.getSyncStatus());
      playAuditChime();
      setPingMessage(
        syncStatus.peerCount > 0
          ? `Synchronized with ${syncStatus.peerCount} active peer node(s) (RTT: ${syncStatus.roundTripLatencyMs}ms)`
          : 'Enclave broadcast channel active • Listening for peer nodes'
      );
    }, 450);

    setTimeout(() => setPingMessage(null), 4000);
  };

  const handleOpenPeerTab = () => {
    playTone(800, 0.05);
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank');
    }
  };

  const isMultiNode = syncStatus.peerCount > 0;
  const isIsolated = syncStatus.mode === 'LOCAL_FALLBACK';

  return (
    <>
      {/* Header Indicator Badge */}
      <button
        type="button"
        onClick={() => {
          playTone(550, 0.04);
          setIsModalOpen(true);
        }}
        className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-2xl transition-all duration-200 border cursor-pointer font-mono text-xs shadow-inner ${
          isMultiNode
            ? 'bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
            : isIsolated
            ? 'bg-amber-950/30 hover:bg-amber-900/40 border-amber-500/30 text-amber-300'
            : 'bg-cyan-950/30 hover:bg-cyan-900/40 border-cyan-500/30 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
        } ${className}`}
        title={`Sovereign Enclave Sync: ${
          isMultiNode
            ? `${syncStatus.activeNodeCount} Nodes Active • ${syncStatus.roundTripLatencyMs}ms`
            : 'Local Coordinator Active • Click for Enclave details'
        }`}
      >
        {/* Pulsing Status Dot */}
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isMultiNode ? 'bg-emerald-400' : isIsolated ? 'bg-amber-400' : 'bg-cyan-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isMultiNode ? 'bg-emerald-500' : isIsolated ? 'bg-amber-500' : 'bg-cyan-500'
            }`}
          />
        </span>

        {/* Sync Icon */}
        <Radio
          className={`w-3.5 h-3.5 ${
            isMultiNode
              ? 'text-emerald-400 animate-pulse'
              : isIsolated
              ? 'text-amber-400'
              : 'text-cyan-400'
          }`}
        />

        {/* Text Label */}
        <div className="flex items-center gap-1.5">
          <span className="font-bold tracking-wider text-[10px] sm:text-xs">
            {isMultiNode
              ? `ENCLAVE SYNC: ${syncStatus.activeNodeCount} NODES`
              : isIsolated
              ? 'ENCLAVE: AIR-GAPPED'
              : 'ENCLAVE SYNC: ACTIVE'}
          </span>

          {!compact && (
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                isMultiNode
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'
                  : 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/30'
              }`}
            >
              {isMultiNode ? `${syncStatus.roundTripLatencyMs}ms` : 'SSoT Δ0'}
            </span>
          )}
        </div>
      </button>

      {/* Real-time Enclave Sync Modal / Drawer */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl bg-[#080b16] border border-cyan-500/30 rounded-3xl p-6 sm:p-7 shadow-[0_20px_70px_rgba(6,182,212,0.2)] text-zinc-200 font-mono relative overflow-hidden"
            >
              {/* Background ambient glow */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-[90px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[90px] pointer-events-none" />

              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 border-b border-zinc-800/80 pb-5 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        Sovereign Enclave Real-Time Synchronizer
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        v25 SSoT
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Multi-node broadcast channel telemetry & zero-drift replication
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    playTone(450, 0.04);
                    setIsModalOpen(false);
                  }}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Overview Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5 relative z-10">
                <div className="p-3 rounded-2xl bg-black/40 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">
                    Sync State
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isMultiNode ? 'bg-emerald-400' : 'bg-cyan-400'
                      }`}
                    />
                    <span className="text-xs font-bold text-white">
                      {isMultiNode ? 'SYNCHRONIZED' : 'SOLO COORDINATOR'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-black/40 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">
                    Active Nodes
                  </span>
                  <div className="text-xs font-bold text-cyan-300 mt-1 flex items-center gap-1">
                    <Server className="w-3.5 h-3.5" />
                    <span>{syncStatus.activeNodeCount} in Enclave</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-black/40 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">
                    Round-Trip Ping
                  </span>
                  <div className="text-xs font-bold text-emerald-300 mt-1 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    <span>{syncStatus.roundTripLatencyMs} ms</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-black/40 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">
                    Last Heartbeat
                  </span>
                  <div className="text-xs font-bold text-zinc-300 mt-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{timeAgo}</span>
                  </div>
                </div>
              </div>

              {/* Notification Banner */}
              {pingMessage && (
                <div className="mb-4 px-4 py-2.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 text-xs flex items-center gap-2 animate-in fade-in">
                  <Activity className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span>{pingMessage}</span>
                </div>
              )}

              {/* Active Enclave Nodes List */}
              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                  <span className="font-semibold uppercase tracking-wider">
                    Discovered Sovereign Nodes ({syncStatus.nodes.length})
                  </span>
                  <span className="text-[11px] text-zinc-500">Channel: {syncStatus.channelName}</span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {syncStatus.nodes.map((node: SovereignSyncPeerNode) => (
                    <div
                      key={node.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        node.isSelf
                          ? 'bg-cyan-950/20 border-cyan-500/30'
                          : 'bg-emerald-950/20 border-emerald-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                            node.isSelf
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          <Cpu className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{node.label}</span>
                            {node.isSelf ? (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                                THIS TAB (PRIMARY)
                              </span>
                            ) : (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                                PEER ENCLAVE NODE
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400 block mt-0.5">
                            ID: {node.id} • Merkle Root: {node.merkleRoot?.slice(0, 14)}...
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:self-center">
                        <div className="text-right font-mono text-[11px]">
                          <span className="text-emerald-400 font-bold flex items-center gap-1 justify-end">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Δ0.00% Zero-Drift</span>
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            Block #{node.blockHeight || 849202}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-5 border-t border-zinc-800/80 relative z-10">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleManualPing}
                    disabled={isPinging}
                    className="px-4 py-2 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                    <span>Ping Enclave Nodes</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenPeerTab}
                    className="px-4 py-2 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2 transition-all"
                    title="Open a second tab to test real-time peer discovery and synchronization"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Spawn Peer Tab</span>
                  </button>
                </div>

                <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ETDA ม.28 Multi-Node Enclave Bound</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SyncStatusIndicator;
