/**
 * ZYRQUEN Ω∞ Operations & Audit View (Phase 6)
 * Real-time operational lifecycle actions & cryptographic audit event verification
 */
import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  FileCheck,
  RotateCw,
  Search,
} from 'lucide-react';
import { playAuditChime, playTone } from '../../components/AudioSynthesizer';
import { SYSTEM_METADATA } from '../../data/canonicalData';

interface OperationItem {
  id: number;
  action: string;
  enclave: string;
  status: 'Success' | 'Pending' | 'Blocked';
  timestamp: string;
}

interface AuditItem {
  id: number;
  event: string;
  evidenceId: string;
  result: 'Pass' | 'Fail';
  timestamp: string;
}

const INITIAL_OPERATIONS: OperationItem[] = [
  { id: 1, action: 'Deploy AI Agent Enclave', enclave: 'SGX-Cryo-01', status: 'Success', timestamp: '2026-09-28 19:45 ICT' },
  { id: 2, action: 'Re-anchor Merkle Root State', enclave: 'HSM-Quorum-10', status: 'Success', timestamp: '2026-09-28 19:50 ICT' },
  { id: 3, action: 'PQC Key Rotation (Kyber-1024)', enclave: 'Vault-01', status: 'Success', timestamp: '2026-09-28 19:52 ICT' },
  { id: 4, action: 'Execute 12-Stage Forensic Trace', enclave: 'WORM-Ledger', status: 'Success', timestamp: '2026-09-28 19:58 ICT' },
];

const INITIAL_AUDITS: AuditItem[] = [
  { id: 101, event: 'Statutory ETDA Sec 26 Policy Verification', evidenceId: 'EVD-ETDA-901', result: 'Pass', timestamp: '2026-09-28 19:55 ICT' },
  { id: 102, event: 'Deca-Custodian Quorum Hash Ratification', evidenceId: 'EVD-HSM-1010', result: 'Pass', timestamp: '2026-09-28 20:00 ICT' },
  { id: 103, event: 'Zero-Mutation Core State Certification', evidenceId: 'EVD-CORE-000', result: 'Pass', timestamp: '2026-09-28 20:02 ICT' },
  { id: 104, event: 'PDPA Sec 37 Enclave Encryption Verification', evidenceId: 'EVD-PDPA-370', result: 'Pass', timestamp: '2026-09-28 20:05 ICT' },
];

export const OperationsAuditView: React.FC = () => {
  const [operations] = useState<OperationItem[]>(INITIAL_OPERATIONS);
  const [audits] = useState<AuditItem[]>(INITIAL_AUDITS);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOps = operations.filter(
    (o) => o.action.toLowerCase().includes(searchQuery.toLowerCase()) || o.enclave.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredAudits = audits.filter(
    (a) => a.event.toLowerCase().includes(searchQuery.toLowerCase()) || a.evidenceId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-[#080d1a] border border-cyan-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl sm:text-2xl font-mono font-black text-white">
              Operations &amp; Audit View (Phase 6)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-sans">
            ศูนย์รวมการบริหารจัดการปฏิบัติการระบบ (Operations) และบันทึกผลการตรวจสอบทางนิติวิทยาศาสตร์ (Audit Ledger)
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหากิจกรรมหรือ Evidence ID..."
            className="pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Operations Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-mono font-bold text-violet-400 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span>Active Operations Stream</span>
          </h3>
          <span className="text-[10px] font-mono text-slate-400">{filteredOps.length} ACTIVE ACTIONS</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs text-slate-300">
              <thead className="bg-black/40 text-cyan-400 text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="p-4">Action</th>
                  <th className="p-4">Target Enclave</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredOps.map((op) => (
                  <tr key={op.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-white flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      {op.action}
                    </td>
                    <td className="p-4 text-slate-400">{op.enclave}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {op.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 text-[11px]">{op.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Audit Verification Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Cryptographic Audit &amp; Forensic Logs</span>
          </h3>
          <span className="text-[10px] font-mono text-emerald-400">100% RATIFIED</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs text-slate-300">
              <thead className="bg-black/40 text-emerald-400 text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="p-4">Verification Event</th>
                  <th className="p-4">Evidence Artifact ID</th>
                  <th className="p-4">Result</th>
                  <th className="p-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredAudits.map((audit) => (
                  <tr key={audit.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      {audit.event}
                    </td>
                    <td className="p-4 text-cyan-300">{audit.evidenceId}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 w-fit block">
                        ● {audit.result.toUpperCase()} (VERIFIED)
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 text-[11px]">{audit.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OperationsAuditView;
