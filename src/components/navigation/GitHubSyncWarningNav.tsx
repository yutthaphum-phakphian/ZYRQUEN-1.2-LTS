import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, Github } from 'lucide-react';
import { githubSyncService, GitHubSyncState } from '../../services/githubSyncService';
import { playTone, playAuditChime } from '../AudioSynthesizer';

export const GitHubSyncWarningNav: React.FC = () => {
  const [syncState, setSyncState] = useState<GitHubSyncState>(githubSyncService.getState());
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [resyncSuccessToast, setResyncSuccessToast] = useState(false);

  useEffect(() => {
    const unsubscribe = githubSyncService.subscribe((state) => {
      setSyncState(state);
    });
    return () => unsubscribe();
  }, []);

  const hasDrift = syncState.localBlockHeight !== syncState.remoteBranchHeight || syncState.driftCount !== 0;

  const handleForceResync = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    playTone(520, 0.08);
    playTone(780, 0.12);
    await githubSyncService.forceRemoteResync();
    playAuditChime();
    setResyncSuccessToast(true);
    setTimeout(() => setResyncSuccessToast(false), 3500);
  };

  const handleSimulateDrift = (e: React.MouseEvent) => {
    e.stopPropagation();
    playTone(340, 0.1);
    githubSyncService.simulateDrift(2);
  };

  return (
    <div className="relative flex items-center font-mono select-none">
      {/* Visual Warning System: Drift Alert Banner / Pill in Navigation Bar */}
      <AnimatePresence mode="wait">
        {hasDrift ? (
          <motion.div
            key="drift-warning"
            initial={{ opacity: 0, scale: 0.92, y: -2 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:py-1.5 rounded-xl bg-[#EF4444]/20 border border-[#EF4444]/60 text-[#EF4444] shadow-[0_0_16px_rgba(239,68,68,0.35)] cursor-pointer"
            onClick={() => {
              playTone(600, 0.05);
              setShowDetailModal(true);
            }}
            title="Block Height Drift Detected! Click to inspect details or Force Remote Re-sync"
          >
            {/* Pulsing Warning Indicator with Red Warning Icon */}
            <div className="flex items-center gap-1 text-base text-[#EF4444] animate-pulse">
              <span>⚠️</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1.5 text-[10px] sm:text-xs font-bold leading-tight">
              <span className="text-white flex items-center gap-1">
                <span>GitHub Health Check:</span>
              </span>
              <span className="text-[#EF4444] whitespace-nowrap">
                Local #{syncState.localBlockHeight} ≠ Remote #{syncState.remoteBranchHeight}
              </span>
              <span className="hidden md:inline-block px-1.5 py-0.2 rounded bg-[#EF4444]/30 text-white text-[9px]">
                Δ+{syncState.driftCount} BLOCKS
              </span>
            </div>

            {/* DIRECT 'Force Remote Re-sync' ACTION TRIGGER */}
            <button
              id="btn-nav-force-resync"
              onClick={handleForceResync}
              disabled={syncState.isSyncing}
              className="ml-1 sm:ml-2 px-2.5 py-1 rounded-lg bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#070a12] font-bold text-[10px] sm:text-xs shadow-[0_0_12px_rgba(212,175,55,0.4)] flex items-center gap-1 transition-all active:scale-95 shrink-0 cursor-pointer disabled:opacity-50"
              title="Force Remote Re-sync: Immediately reconcile local Block Height with remote GitHub branch"
            >
              <span>{syncState.isSyncing ? '⏳' : '⚡'}</span>
              <span>{syncState.isSyncing ? 'Syncing...' : 'Force Remote Re-sync'}</span>
            </button>
          </motion.div>
        ) : (
          /* Normal State: Healthy GitHub SSoT Indicator */
          <motion.div
            key="synced-status"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#0a0f1e] border border-cyan-500/30 text-cyan-300 hover:border-cyan-400 text-[11px] shadow-sm cursor-pointer transition-colors"
            onClick={() => {
              playTone(640, 0.04);
              setShowDetailModal(true);
            }}
            title="GitHub Remote Parity: Synced (Δ0.00%). Click to inspect or simulate branch drift."
          >
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shrink-0" />
            <span className="text-zinc-400 hidden xl:inline">GitHub:</span>
            <span className="font-bold text-white">#{syncState.localBlockHeight}</span>
            <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-cyan-950 text-[#06B6D4] text-[9px] border border-cyan-500/40">
              Δ0.00%
            </span>
            <span className="text-[10px] text-zinc-500 hover:text-cyan-300 ml-0.5" title="Inspect sync details">⚙️</span>
            {/* Direct Open GitHub Link button */}
            <a
              href="https://github.com/yutthaphum-phakphian/ZYRQUEN-1.2-LTS"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                playTone(740, 0.04);
              }}
              className="p-1 rounded-md hover:bg-cyan-500/25 text-cyan-400 hover:text-white transition-all flex items-center gap-0.5 ml-0.5"
              title="เปิดลิงก์ Canonical GitHub Repository (yutthaphum-phakphian/ZYRQUEN-1.2-LTS)"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Re-sync Success Floating Toast Notification */}
      <AnimatePresence>
        {resyncSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed top-16 right-6 z-50 px-4 py-2.5 rounded-xl bg-[#0a0f1e] border border-[#10B981] text-[#10B981] font-mono text-xs shadow-[0_0_25px_rgba(16,185,129,0.3)] flex items-center gap-2"
          >
            <span>✅</span>
            <div>
              <div className="font-bold text-white">Remote Re-sync Successful!</div>
              <div className="text-[10px] text-zinc-400">
                Block #{syncState.localBlockHeight} aligned with GitHub {syncState.remoteBranch} • SSoT Δ0.00%
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forensic Inspection Modal for GitHub Sync & Drift Resolution */}
      <AnimatePresence>
        {showDetailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl bg-[#070a12] border border-cyan-500/40 rounded-2xl p-5 shadow-2xl space-y-4 text-xs font-mono"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">🌐</span>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      GitHub Branch & Block Height Synchronization
                    </h3>
                    <p className="text-[10px] text-zinc-400">
                      Boundary: <span className="text-cyan-300">Ω600_1000</span> • Repository Parity Verifier
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-2 py-1 rounded-lg bg-[#0a0f1e] text-zinc-400 hover:text-white border border-white/10 hover:border-white/20"
                >
                  ✕
                </button>
              </div>

              {/* Status Comparison Matrix */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#0a0f1e] border border-cyan-500/20 space-y-1">
                  <span className="text-[10px] text-zinc-400 block">Local Sovereign Block Height</span>
                  <div className="text-lg font-bold text-cyan-300">#{syncState.localBlockHeight}</div>
                  <span className="text-[10px] text-zinc-500">Genesis Block: #849202</span>
                </div>

                <div
                  className={`p-3 rounded-xl bg-[#0a0f1e] border space-y-1 ${
                    hasDrift ? 'border-[#EF4444]/60 bg-[#EF4444]/10' : 'border-[#10B981]/40'
                  }`}
                >
                  <span className="text-[10px] text-zinc-400 block">Remote GitHub Branch Height</span>
                  <div
                    className={`text-lg font-bold ${
                      hasDrift ? 'text-[#EF4444]' : 'text-[#10B981]'
                    }`}
                  >
                    #{syncState.remoteBranchHeight}
                  </div>
                  <span className="text-[10px] text-zinc-500">
                    Branch: {syncState.remoteBranch} ({hasDrift ? `Δ+${syncState.driftCount} drift` : 'Δ0.00%'})
                  </span>
                </div>
              </div>

              {/* Parity & Merkle Checksum */}
              <div className="p-3 rounded-xl bg-[#0a0f1e] border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">Sync Health Score:</span>
                  <span
                    className={`font-bold text-sm ${
                      syncState.syncHealthScore === 100 ? 'text-[#10B981]' : 'text-[#D4AF37]'
                    }`}
                  >
                    {syncState.syncHealthScore}%
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-white/10">
                  <div
                    className={`h-full transition-all duration-500 ${
                      syncState.syncHealthScore === 100 ? 'bg-[#10B981]' : 'bg-[#D4AF37]'
                    }`}
                    style={{ width: `${syncState.syncHealthScore}%` }}
                  />
                </div>

                <div className="space-y-1 text-[10px] pt-1">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Local Merkle:</span>
                    <span className="text-zinc-300 truncate max-w-[280px]">
                      {syncState.localMerkleRoot}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Remote Git SHA:</span>
                    <span
                      className={`truncate max-w-[280px] ${
                        syncState.localMerkleRoot === syncState.remoteGitTreeSha
                          ? 'text-[#10B981]'
                          : 'text-[#EF4444]'
                      }`}
                    >
                      {syncState.remoteGitTreeSha}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Merkle Bit Parity:</span>
                    <span className="text-cyan-300 font-bold">
                      {syncState.matchingHexChars}/64 chars ({syncState.merkleParityPercentage}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* GitHub Official Links & Live Portal Access */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-sky-950/30 to-indigo-950/40 border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-200 flex items-center gap-1.5">
                    <Github className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Official GitHub Live Portal & Repository</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[9px] border border-cyan-500/40">
                    LIVE ACTIVE
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a
                    href="https://github.com/yutthaphum-phakphian/ZYRQUEN-1.2-LTS"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => playTone(780, 0.04)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Open Official GitHub Repository (yutthaphum-phakphian/ZYRQUEN-1.2-LTS)</span>
                  </a>
                  <a
                    href="https://github.com/yutthaphum-phakphian"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => playTone(740, 0.04)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-200 text-xs flex items-center gap-1.5 transition-all"
                  >
                    <Github className="w-3.5 h-3.5 text-zinc-400" />
                    <span>GitHub Profile & Repositories</span>
                  </a>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  onClick={handleSimulateDrift}
                  className="px-3 py-2 rounded-xl bg-[#0a0f1e] hover:bg-white/10 border border-white/20 text-zinc-300 hover:text-white transition-colors"
                  title="Simulate remote branch advancement by +2 blocks to test the warning system"
                >
                  🧪 Simulate Remote Drift (+2)
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      githubSyncService.resetToCanonical();
                      setShowDetailModal(false);
                    }}
                    className="px-3 py-2 rounded-xl bg-[#0a0f1e] text-zinc-400 hover:text-white border border-white/10"
                  >
                    Reset SSoT
                  </button>

                  <button
                    onClick={async (e) => {
                      await handleForceResync(e);
                      setShowDetailModal(false);
                    }}
                    disabled={syncState.isSyncing}
                    className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#070a12] font-bold shadow-[0_0_15px_rgba(212,175,55,0.4)] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span>{syncState.isSyncing ? '⏳' : '⚡'}</span>
                    <span>{syncState.isSyncing ? 'กำลังดึงอัปเดท...' : 'ดึงอัปเดท / Force Remote Re-sync'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const GitHubHealthCheckNav = GitHubSyncWarningNav;

