import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Shield,
  CheckCircle2,
  Clock,
  Vote,
  Lock,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Zap,
  Fingerprint,
  Radio,
  Sliders,
  Scale,
  Search,
  CheckCheck,
  History,
  Sparkles,
} from 'lucide-react';
import {
  ConsensusOverrideProposal,
  CONSENSUS_LEDGER_RECORDS,
  VoteDecision,
} from '../../data/councilData';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import { MerkleVerificationBadge } from './MerkleVerificationBadge';
import { copyToClipboard } from '../../utils/clipboard';

interface ConsensusLedgerSectionProps {
  onVoteLogged?: (slotId: number | 'ALL', decision: string, proposalId?: string) => void;
}

export const ConsensusLedgerSection: React.FC<ConsensusLedgerSectionProps> = ({
  onVoteLogged,
}) => {
  const [proposals, setProposals] = useState<ConsensusOverrideProposal[]>(CONSENSUS_LEDGER_RECORDS);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'RATIFIED' | 'EXECUTED' | 'ACTIVE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProposalId, setExpandedProposalId] = useState<string | null>('PROP-SOV-2026-005');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    copyToClipboard(text);
    setCopiedHash(id);
    playAuditChime();
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const toggleExpand = (id: string) => {
    playTone(580, 0.05, 'sine');
    setExpandedProposalId(expandedProposalId === id ? null : id);
  };

  const handleSimulateVote = (proposalId: string, slotId: number, decision: VoteDecision) => {
    playTone(660 + slotId * 30, 0.1, 'sine');
    setProposals((prev) =>
      prev.map((prop) => {
        if (prop.id !== proposalId) return prop;

        const updatedVotes = prop.memberVotes.map((mv) => {
          if (mv.slotId !== slotId) return mv;
          return {
            ...mv,
            vote: decision,
            signedAt: new Date().toLocaleTimeString('th-TH', { hour12: false }) + ' ICT',
            hsmSignatureDigest: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
            weight: decision === 'YES' ? 1 : 0,
          };
        });

        const votesFor = updatedVotes.filter((v) => v.vote === 'YES').length;
        const votesAgainst = updatedVotes.filter((v) => v.vote === 'NO').length;
        const votesAbstain = updatedVotes.filter((v) => v.vote === 'ABSTAIN').length;
        const votesPending = updatedVotes.filter((v) => v.vote === 'PENDING').length;

        let status = prop.status;
        let statusTh = prop.statusTh;

        if (votesFor >= prop.quorumRequired) {
          status = 'RATIFIED_IMMUTABLE';
          statusTh = 'สัตยาบันถาวร (Quorum Reached & Sealed)';
        }

        return {
          ...prop,
          votesFor,
          votesAgainst,
          votesAbstain,
          votesPending,
          status,
          statusTh,
          memberVotes: updatedVotes,
        };
      })
    );

    if (onVoteLogged) {
      onVoteLogged(slotId, decision, proposalId);
    }
  };

  // Quick Action: Ratify All Proposals to 10/10 YES ("ไปกดกว่าได้เต็มหมด")
  const handleRatifyAllToFull = () => {
    playAuditChime();
    setProposals((prev) =>
      prev.map((prop) => {
        const updatedVotes = prop.memberVotes.map((mv) => ({
          ...mv,
          vote: 'YES' as VoteDecision,
          signedAt: new Date().toLocaleTimeString('th-TH', { hour12: false }) + ' ICT',
          hsmSignatureDigest: mv.hsmSignatureDigest || `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
          weight: 1,
        }));

        return {
          ...prop,
          votesFor: 10,
          votesAgainst: 0,
          votesAbstain: 0,
          votesPending: 0,
          status: 'RATIFIED_IMMUTABLE' as const,
          statusTh: 'สัตยาบันถาวร (10/10 Full Quorum Sealed)',
          memberVotes: updatedVotes,
        };
      })
    );
    playTone(920, 0.2, 'sine');

    if (onVoteLogged) {
      onVoteLogged('ALL', 'YES (10/10 RATIFIED)', 'ALL_PROPOSALS');
    }
  };

  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      const matchFilter =
        activeFilter === 'ALL' ||
        (activeFilter === 'RATIFIED' && (p.status === 'RATIFIED_IMMUTABLE' || p.status === 'EXECUTED')) ||
        (activeFilter === 'EXECUTED' && p.status === 'EXECUTED') ||
        (activeFilter === 'ACTIVE' && p.status === 'ACTIVE_VOTING');

      const matchSearch =
        searchQuery === '' ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.titleTh.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.categoryTh.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.proposedBy.nameTh.toLowerCase().includes(searchQuery.toLowerCase());

      return matchFilter && matchSearch;
    });
  }, [proposals, activeFilter, searchQuery]);

  // Aggregate all signed votes chronologically into a scrollable history log
  const chronologicalVotingLogs = useMemo(() => {
    const logs: Array<{
      proposalId: string;
      proposalTitle: string;
      slotId: number;
      councilCode: string;
      nameTh: string;
      vote: VoteDecision;
      signedAt: string;
      digest: string;
      latencyMs: number;
    }> = [];

    proposals.forEach((p) => {
      p.memberVotes.forEach((mv) => {
        if (mv.vote !== 'PENDING') {
          logs.push({
            proposalId: p.id,
            proposalTitle: p.titleTh,
            slotId: mv.slotId,
            councilCode: mv.councilCode,
            nameTh: mv.nameTh,
            vote: mv.vote,
            signedAt: mv.signedAt,
            digest: mv.hsmSignatureDigest,
            latencyMs: mv.latencyMs,
          });
        }
      });
    });

    return logs;
  }, [proposals]);

  return (
    <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Header & Description */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              10/10 SOVEREIGN CONSENSUS LEDGER
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              <Lock className="w-3 h-3" />
              8/10 QUORUM RULE ENFORCED
            </span>
            <MerkleVerificationBadge compact={false} showInspectorButton={true} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>สมุดบันทึกฉันทามติและการเพิกถอนระบบ (Consensus Ledger)</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 max-w-3xl leading-relaxed">
            ติดตามประวัติและผลการลงคะแนนฉันทามติแบบเรียลไทม์ของสภาผู้พิทักษ์ 10/10 REAL_HSM สำหรับข้อเสนอการแก้ไขพารามิเตอร์ระบบ (System Overrides) ทุกมติจะถูกผนึกด้วย Merkle Hash และกุญแจ PQC
          </p>
        </div>

        {/* Ledger Quick Summary & Full Ratification Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono">
            <div className="p-3 rounded-2xl bg-black/60 border border-white/10 text-center space-y-0.5">
              <span className="text-zinc-500 block text-[10px]">ข้อเสนอ</span>
              <span className="text-amber-400 font-bold text-base">{proposals.length}</span>
            </div>
            <div className="p-3 rounded-2xl bg-black/60 border border-white/10 text-center space-y-0.5">
              <span className="text-zinc-500 block text-[10px]">เกณฑ์ฉันทามติ</span>
              <span className="text-emerald-400 font-bold text-base">8 / 10 โหนด</span>
            </div>
          </div>

          <button
            onClick={handleRatifyAllToFull}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95 border border-amber-400/40"
            title="ลงมติผ่าน 10/10 ครบทุกข้อเสนอทันที (ไปกดกว่าได้เต็มหมด)"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>ลงมติ 10/10 ครบทุกข้อเสนอ</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'ALL', label: 'ทั้งหมด (All Records)' },
            { id: 'ACTIVE', label: 'กำลังลงมติ (Active Quorum)' },
            { id: 'RATIFIED', label: 'สัตยาบันถาวร (Ratified)' },
            { id: 'EXECUTED', label: 'บังคับใช้แล้ว (Executed)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveFilter(tab.id as any);
                playTone(520, 0.05, 'sine');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all ${
                activeFilter === tab.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-400 border border-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาข้อเสนอ หรือ รหัส..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        {filteredProposals.map((proposal) => {
          const isExpanded = expandedProposalId === proposal.id;
          const isRatified = proposal.status === 'RATIFIED_IMMUTABLE' || proposal.status === 'EXECUTED';
          const isVoting = proposal.status === 'ACTIVE_VOTING';
          const quorumMet = proposal.votesFor >= proposal.quorumRequired;

          return (
            <motion.div
              key={proposal.id}
              layout
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                isVoting
                  ? 'bg-zinc-950/90 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                  : isRatified
                  ? 'bg-zinc-950/80 border-emerald-500/30'
                  : 'bg-zinc-950/80 border-white/10'
              }`}
            >
              {/* Proposal Summary Bar */}
              <div
                onClick={() => toggleExpand(proposal.id)}
                className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer hover:bg-white/5 transition-colors select-none"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      {proposal.id}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono bg-white/5 text-zinc-300 border border-white/10">
                      {proposal.categoryTh}
                    </span>
                    {isVoting ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
                        <Radio className="w-3 h-3 text-cyan-400" />
                        ACTIVE CONSENSUS WINDOW
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {proposal.statusTh}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{proposal.titleTh}</span>
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono">{proposal.titleEn}</p>
                </div>

                {/* Quorum Progress Indicator */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 lg:shrink-0">
                  <div className="w-full sm:w-48 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-400">ฉันทามติ (Quorum):</span>
                      <span className={`font-bold ${quorumMet ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {proposal.votesFor} / 10 โหนด
                      </span>
                    </div>
                    {/* Progress Bar with Quorum Threshold Marker */}
                    <div className="relative w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          quorumMet
                            ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                            : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                        }`}
                        style={{ width: `${(proposal.votesFor / 10) * 100}%` }}
                      />
                      {/* 8/10 Threshold Marker Line */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-white shadow"
                        style={{ left: '80%' }}
                        title="Quorum Threshold: 8/10"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                      <span>Threshold: 8 โหนด</span>
                      <span>{quorumMet ? 'QUORUM MET' : 'PENDING'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expandable Details Drawer */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-white/10 p-5 md:p-6 bg-black/60 space-y-6"
                  >
                    {/* Proposal Meta & Merkle Root */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      <div className="p-4 rounded-2xl bg-zinc-950 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-zinc-400">
                          <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                            <Shield className="w-3.5 h-3.5" />
                            ผู้เสนอและเวลาบังคับใช้
                          </span>
                          <span className="text-zinc-500">{proposal.proposedTimestamp}</span>
                        </div>
                        <p className="text-sm font-bold text-white">
                          {proposal.proposedBy.councilCode} &bull; {proposal.proposedBy.nameTh}
                        </p>
                        <p className="text-zinc-400 text-[11px] leading-relaxed pt-1">
                          {proposal.detailedDescriptionTh}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-zinc-950 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-zinc-400">
                          <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                            <Fingerprint className="w-3.5 h-3.5" />
                            Merkle Verified Root Hash
                          </span>
                          <button
                            onClick={() => handleCopy(proposal.merkleRootHash, proposal.id)}
                            className="text-zinc-400 hover:text-white flex items-center gap-1 text-[11px]"
                          >
                            {copiedHash === proposal.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">คัดลอกแล้ว</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>คัดลอก Merkle</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black font-mono text-[11px] text-cyan-300 break-all border border-cyan-500/20 select-all">
                          {proposal.merkleRootHash}
                        </div>
                        <div className="text-[10px] text-zinc-500 flex items-center justify-between">
                          <span>Attestation Seal: {proposal.hardwareAttestationSeal}</span>
                        </div>
                      </div>
                    </div>

                    {/* 10-Node Council Members Vote Matrix */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Vote className="w-4 h-4 text-amber-400" />
                          <span>ผลการลงมติรายโหนดผู้พิทักษ์ (10/10 HSM Member Vote Matrix)</span>
                        </h4>
                        <span className="text-[11px] font-mono text-zinc-400">
                          YES: <strong className="text-emerald-400">{proposal.votesFor}</strong> &bull; NO:{' '}
                          <strong className="text-rose-400">{proposal.votesAgainst}</strong> &bull; ABSTAIN:{' '}
                          <strong className="text-amber-400">{proposal.votesAbstain}</strong> &bull; PENDING:{' '}
                          <strong className="text-zinc-400">{proposal.votesPending}</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                        {proposal.memberVotes.map((mv) => {
                          const isYes = mv.vote === 'YES';
                          const isNo = mv.vote === 'NO';
                          const isAbstain = mv.vote === 'ABSTAIN';
                          const isPending = mv.vote === 'PENDING';

                          return (
                            <div
                              key={mv.slotId}
                              className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 transition-all ${
                                isYes
                                  ? 'bg-emerald-950/20 border-emerald-500/40 text-white'
                                  : isNo
                                  ? 'bg-rose-950/20 border-rose-500/40 text-white'
                                  : isAbstain
                                  ? 'bg-amber-950/20 border-amber-500/40 text-white'
                                  : 'bg-zinc-900/50 border-white/10 text-zinc-400'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div>
                                  <div className="flex items-center gap-1 font-mono text-xs font-bold">
                                    <span className="text-amber-400">{mv.councilCode}</span>
                                    <span className="text-zinc-500 text-[10px]">#{mv.passportId}</span>
                                  </div>
                                  <span className="text-[11px] font-medium text-zinc-300 block truncate max-w-[120px]">
                                    {mv.nameTh}
                                  </span>
                                </div>

                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                    isYes
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : isNo
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                      : isAbstain
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                      : 'bg-white/5 text-zinc-400 border border-white/10'
                                  }`}
                                >
                                  {mv.vote}
                                </span>
                              </div>

                              <div className="pt-1 border-t border-white/5 text-[9px] font-mono text-zinc-500 flex items-center justify-between">
                                <span className="truncate">{mv.signedAt}</span>
                                <span className="text-cyan-400 font-bold">{mv.latencyMs}ms</span>
                              </div>

                              {/* Interactive Simulation Button for Pending Votes */}
                              {isPending && isVoting && (
                                <div className="pt-1 flex items-center gap-1">
                                  <button
                                    onClick={() => handleSimulateVote(proposal.id, mv.slotId, 'YES')}
                                    className="flex-1 py-1 rounded bg-emerald-600/80 hover:bg-emerald-500 text-white text-[10px] font-mono font-bold transition-colors"
                                  >
                                    ลงมติ YES
                                  </button>
                                  <button
                                    onClick={() => handleSimulateVote(proposal.id, mv.slotId, 'ABSTAIN')}
                                    className="px-2 py-1 rounded bg-amber-600/80 hover:bg-amber-500 text-white text-[10px] font-mono font-bold transition-colors"
                                  >
                                    งด
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Scrollable History of Voting Logs */}
      <div className="pt-4 border-t border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              ประวัติการลงนามและการลงคะแนนย้อนหลัง (Scrollable Voting Log History)
            </h4>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            บันทึกแล้ว <strong className="text-cyan-400">{chronologicalVotingLogs.length}</strong> รายการ
          </span>
        </div>

        {/* Scrollable Container with Max Height */}
        <div className="max-h-64 overflow-y-auto rounded-2xl bg-black/80 border border-white/10 divide-y divide-white/5 scrollbar-thin scrollbar-thumb-zinc-700">
          {chronologicalVotingLogs.map((log, idx) => (
            <div
              key={`${log.proposalId}-${log.slotId}-${idx}`}
              className="p-3 hover:bg-white/5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
            >
              <div className="flex items-center gap-3">
                <span className="text-zinc-500 text-[10px] w-8">#{(idx + 1).toString().padStart(2, '0')}</span>
                <span className="text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px]">
                  {log.proposalId}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">{log.councilCode} &bull; {log.nameTh}</span>
                    <span className="text-[10px] text-zinc-400">({log.signedAt})</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 truncate block max-w-md">
                    {log.proposalTitle}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <span className="text-[10px] text-zinc-400 truncate max-w-[140px]" title={log.digest}>
                  Digest: {log.digest.slice(0, 14)}...
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    log.vote === 'YES'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : log.vote === 'NO'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {log.vote}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
