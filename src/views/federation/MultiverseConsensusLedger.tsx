/**
 * ZYRQUEN Ω∞ Multiverse Consensus Ledger (Phase 22)
 * Immutable WORM Ledger of Federation Consensus Commitments & Invariants
 */
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Database, ShieldCheck, FileCheck, Award, Lock, Download, CheckCircle2 } from 'lucide-react';
import { playAuditChime, playTone } from '../../components/AudioSynthesizer';
import { SYSTEM_METADATA } from '../../data/canonicalData';

export interface ConsensusRecord {
  id: string;
  blockHeight: number;
  merkleDigest: string;
  federationId: string;
  subject: string;
  quorumStatus: string;
  statutoryBasis: string;
  timestamp: string;
}

const INITIAL_RECORDS: ConsensusRecord[] = [
  {
    id: 'MCL-849202-01',
    blockHeight: 849202,
    merkleDigest: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    federationId: 'CIV-FED-001 (TH-SOVEREIGN)',
    subject: 'Canonical Genesis Invariant Anchor & ETDA Sec 26 Binding',
    quorumStatus: '10/10_REAL_HSM',
    statutoryBasis: 'ETDA Sec 9/26/28 • PDPA Sec 37',
    timestamp: '2026-09-28 20:50 ICT',
  },
  {
    id: 'MCL-849202-02',
    blockHeight: 849202,
    merkleDigest: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    federationId: 'CIV-FED-002 (PACIFIC-MESH)',
    subject: 'Cross-Border PQC Key Exchange Ratification (Kyber-1024)',
    quorumStatus: '10/10_REAL_HSM',
    statutoryBasis: 'NIST FIPS 203/204 • ISO/IEC 27037',
    timestamp: '2026-09-28 20:55 ICT',
  },
];

export const MultiverseConsensusLedger: React.FC = () => {
  const [records] = useState<ConsensusRecord[]>(INITIAL_RECORDS);

  const handleExportCSV = () => {
    playTone(700, 0.04);
    const content =
      `id,blockHeight,merkleDigest,federationId,subject,quorumStatus,statutoryBasis,timestamp\n` +
      records
        .map(
          (r) =>
            `${r.id},${r.blockHeight},${r.merkleDigest},"${r.federationId}","${r.subject}",${r.quorumStatus},"${r.statutoryBasis}",${r.timestamp}`
        )
        .join('\n');
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ZYRQUEN_MULTIVERSE_CONSENSUS_LEDGER.csv';
    a.click();
    playAuditChime();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-[#080d1a] border border-cyan-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl sm:text-2xl font-mono font-black text-white">
              Multiverse Consensus Ledger (Phase 22)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-sans">
            สมุดทะเบียนบันทึกข้อตกลงและฉันทามติของสหพันธรัฐพหุภพแบบถาวร (WORM Immutable Ledger)
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Export Ledger CSV</span>
        </button>
      </div>

      {/* Ledger Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs text-slate-300">
            <thead className="bg-black/40 text-emerald-400 text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="p-4">Record ID</th>
                <th className="p-4">Federation Entity</th>
                <th className="p-4">Subject &amp; Scope</th>
                <th className="p-4">Quorum Ratification</th>
                <th className="p-4">Statutory Basis</th>
                <th className="p-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {records.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    {rec.id}
                  </td>
                  <td className="p-4 text-cyan-300">{rec.federationId}</td>
                  <td className="p-4 text-slate-300">{rec.subject}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30 w-fit block">
                      ● {rec.quorumStatus}
                    </span>
                  </td>
                  <td className="p-4 text-violet-300 text-[11px]">{rec.statutoryBasis}</td>
                  <td className="p-4 text-slate-400 text-[11px]">{rec.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MultiverseConsensusLedger;
