import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { githubSyncService, GitHubCommitRecord, GitHubSyncState } from '../../services/githubSyncService';
import { playTone, playAuditChime } from '../AudioSynthesizer';

export const RepositoryChangeAudit: React.FC = () => {
  const [syncState, setSyncState] = useState<GitHubSyncState>(githubSyncService.getState());
  const [selectedCommit, setSelectedCommit] = useState<GitHubCommitRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [copiedSha, setCopiedSha] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = githubSyncService.subscribe((state) => {
      setSyncState(state);
    });
    return () => unsubscribe();
  }, []);

  const filteredCommits = syncState.recentCommits.filter((c) => {
    const matchesSearch =
      c.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.shortSha.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.blockHeight.toString().includes(searchQuery);

    const matchesCategory = categoryFilter === 'ALL' || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleCopy = (sha: string) => {
    navigator.clipboard?.writeText(sha);
    playTone(720, 0.04);
    setCopiedSha(sha);
    setTimeout(() => setCopiedSha(null), 2000);
  };

  const handleExportJson = () => {
    const payload = {
      repository: syncState.remoteRepo,
      branch: syncState.remoteBranch,
      epochBlock: syncState.localBlockHeight,
      boundary: 'Ω600_1000',
      canonicalMerkleRoot: syncState.localMerkleRoot,
      exportedAt: new Date().toISOString(),
      principal: 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
      totalAuditedCommits: syncState.recentCommits.length,
      commits: syncState.recentCommits,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZYRQUEN-GIT-FORENSIC-AUDIT-BLOCK-${syncState.localBlockHeight}.json`;
    a.click();
    URL.revokeObjectURL(url);
    playAuditChime();
  };

  const categories = ['ALL', 'FEAT', 'CI', 'FREEZE', 'AUDIT', 'HSM', 'PERF', 'TREASURY', 'GENESIS'];

  return (
    <div className="rounded-[24px] bg-[#0a0f1e] border border-cyan-500/30 p-5 sm:p-6 space-y-5 font-mono shadow-xl relative overflow-hidden">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-500/20 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-[#06B6D4] border border-cyan-500/40 text-xs font-bold">
              📑 REPOSITORY CHANGE AUDIT
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-[#10B981] border border-emerald-500/40 text-xs">
              TIME-SERIES GIT LOG
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 text-xs">
              Ω600_1000 BOUNDARY
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mt-1.5 flex items-center gap-2">
            <span>🏛️</span>
            <span>Forensic Git Commit Trace & Cryptographic Parity</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Cryptographically anchored immutable Git log verifying the last 10 repository mutations against Block #{syncState.localBlockHeight}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportJson}
            className="px-3 py-2 rounded-xl bg-[#070a12] hover:bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:text-white text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Export Forensic Git Audit as JSON"
          >
            <span>💾</span>
            <span className="hidden sm:inline">Export Git Audit JSON</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">🔍</span>
          <input
            type="text"
            placeholder="Search commit message, SHA, author, or block..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#070a12] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                playTone(580, 0.03);
                setCategoryFilter(cat);
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400'
                  : 'bg-[#070a12] text-zinc-400 border border-white/5 hover:border-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Forensic Time-Series Git Log Table */}
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#070a12]">
        <table className="w-full text-left text-xs border-collapse min-w-[850px]">
          <thead>
            <tr className="bg-[#0a0f1e] border-b border-white/10 text-zinc-400 text-[11px]">
              <th className="py-3 px-3 w-12 text-center">#</th>
              <th className="py-3 px-3 w-32">Commit / Block</th>
              <th className="py-3 px-3 w-28">Timestamp</th>
              <th className="py-3 px-4">Commit Message & Category</th>
              <th className="py-3 px-3 w-48">Author / Sovereign Signer</th>
              <th className="py-3 px-3 w-40">PQC Verification</th>
              <th className="py-3 px-3 w-24 text-right">Delta / Seals</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredCommits.map((c, index) => {
              const isSelected = selectedCommit?.sha === c.sha;
              const isLatest = index === 0;

              return (
                <tr
                  key={c.sha}
                  onClick={() => {
                    playTone(620, 0.03);
                    setSelectedCommit(isSelected ? null : c);
                  }}
                  className={`hover:bg-cyan-950/20 cursor-pointer transition-colors ${
                    isSelected ? 'bg-cyan-950/40' : ''
                  }`}
                >
                  {/* Visual Time-Series Node */}
                  <td className="py-3 px-3 text-center relative">
                    <div className="flex items-center justify-center">
                      <span
                        className={`w-3 h-3 rounded-full flex items-center justify-center ${
                          isLatest
                            ? 'bg-[#10B981] ring-4 ring-[#10B981]/20 animate-pulse'
                            : 'bg-cyan-500/60'
                        }`}
                      />
                    </div>
                  </td>

                  {/* SHA & Block Height */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(c.sha);
                        }}
                        className="text-cyan-300 font-bold hover:underline"
                        title="Click to copy full commit SHA"
                      >
                        {c.shortSha}
                      </button>
                      {copiedSha === c.sha && <span className="text-[9px] text-[#10B981]">copied!</span>}
                    </div>
                    <div className="text-[10px] text-[#D4AF37] font-semibold mt-0.5">
                      Block #{c.blockHeight}
                    </div>
                  </td>

                  {/* Timestamp */}
                  <td className="py-3 px-3 text-zinc-400 text-[10px]">
                    <div>{c.timestamp.slice(0, 10)}</div>
                    <div className="text-zinc-500">{c.timestamp.slice(11, 19)} UTC</div>
                  </td>

                  {/* Message & Category */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          c.category === 'FEAT'
                            ? 'bg-blue-950 text-blue-300 border border-blue-500/40'
                            : c.category === 'FREEZE'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                            : c.category === 'AUDIT'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : c.category === 'HSM'
                            ? 'bg-purple-950 text-purple-300 border border-purple-500/40'
                            : c.category === 'TREASURY'
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            : 'bg-zinc-800 text-zinc-300 border border-zinc-600'
                        }`}
                      >
                        {c.category}
                      </span>
                      <span className="text-white font-medium line-clamp-1">{c.message}</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5 truncate max-w-md">
                      Merkle: {c.merkleRoot.slice(0, 24)}...
                    </div>
                  </td>

                  {/* Author */}
                  <td className="py-3 px-3">
                    <div className="text-zinc-200 text-[11px] truncate max-w-[170px]" title={c.author}>
                      {c.author}
                    </div>
                    <div className="text-[10px] text-zinc-500">Branch: {c.branch}</div>
                  </td>

                  {/* PQC Sign */}
                  <td className="py-3 px-3">
                    <div className="text-[#10B981] text-[10px] flex items-center gap-1 font-semibold">
                      <span>🔒</span>
                      <span>{c.pqcSignStatus}</span>
                    </div>
                  </td>

                  {/* Changes & Seals */}
                  <td className="py-3 px-3 text-right">
                    <div className="text-[10px]">
                      <span className="text-[#10B981]">+{c.insertions}</span>{' '}
                      <span className="text-[#EF4444]">-{c.deletions}</span>
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {c.sealsCount.toLocaleString()} seals
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Expanded Commit Forensic Proof Card */}
      <AnimatePresence>
        {selectedCommit && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-xl bg-[#070a12] border border-cyan-500/40 space-y-3 text-xs"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-[#D4AF37] font-bold">🔍 Forensic Commit Detail:</span>
                <span className="text-white font-bold">{selectedCommit.shortSha}</span>
                <span className="text-zinc-500">({selectedCommit.sha})</span>
              </div>
              <button
                onClick={() => setSelectedCommit(null)}
                className="text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-[#0a0f1e]"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
              <div className="space-y-1">
                <span className="text-zinc-500 block">Commit Message:</span>
                <p className="text-white font-medium">{selectedCommit.message}</p>
                <div className="text-zinc-400 pt-1">
                  Author: <span className="text-cyan-300">{selectedCommit.author}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-zinc-500 block">Cryptographic Seals State:</span>
                <div className="text-zinc-300">
                  Canonical Seals: <span className="text-[#10B981] font-bold">{selectedCommit.sealsCount.toLocaleString()}</span>
                </div>
                <div className="text-zinc-400">
                  Block Height: <span className="text-[#D4AF37]">#{selectedCommit.blockHeight}</span>
                </div>
                <div className="text-zinc-400">
                  Attestation: <span className="text-[#10B981]">{selectedCommit.pqcSignStatus}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-zinc-500 block">Merkle Root Anchor:</span>
                <div className="font-mono text-[10px] text-zinc-300 bg-black/50 p-1.5 rounded border border-white/5 break-all">
                  {selectedCommit.merkleRoot}
                </div>
                <div className="text-[10px] text-zinc-500 pt-0.5">
                  Tenant Boundary: <span className="text-cyan-300 font-bold">Ω600_1000 Strict</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
