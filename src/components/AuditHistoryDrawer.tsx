import React from 'react';
import { X, History, ShieldCheck, Clock, Cpu, Lock, FileCode } from 'lucide-react';

export interface AuditEvent {
  id: string;
  timestamp: string;
  stage: string;
  actor: string;
  action: string;
  hash: string;
  status: 'VERIFIED' | 'ANCHORED' | 'PENDING';
}

interface AuditHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sealIndex: number | null;
  blockNumber: number | null;
}

export const AuditHistoryDrawer: React.FC<AuditHistoryDrawerProps> = ({
  isOpen,
  onClose,
  sealIndex,
  blockNumber,
}) => {
  if (!isOpen || sealIndex === null) return null;

  // Mock Audit History Timeline for given seal
  const auditTimeline: AuditEvent[] = [
    {
      id: "evt-01",
      timestamp: "2026-09-19 17:14:02.102 UTC",
      stage: "STAGE_01_INGEST",
      actor: "Sovereign Ingestion Gate #01",
      action: "Digital Artifact Pre-hashed (BLAKE3)",
      hash: "0x892a...f92b",
      status: "VERIFIED"
    },
    {
      id: "evt-02",
      timestamp: "2026-09-19 17:14:02.145 UTC",
      stage: "STAGE_04_HSM_KEY_FORGE",
      actor: "Utimaco FIPS 140-3 Level 4 HSM",
      action: "Dilithium-5 Post-Quantum Signature Applied",
      hash: "0x419e...1029",
      status: "VERIFIED"
    },
    {
      id: "evt-03",
      timestamp: "2026-09-19 17:14:02.210 UTC",
      stage: "STAGE_08_MERKLE_TREE",
      actor: "SSoT Consensus Engine",
      action: "Merkle Tree Leaf Injected & Anchored",
      hash: "909a...4c68",
      status: "ANCHORED"
    },
    {
      id: "evt-04",
      timestamp: "2026-09-19 17:14:02.350 UTC",
      stage: "STAGE_12_COURT_SYNC",
      actor: "Thai Judicial Evidence Ledger",
      action: "Real-time Verification Seal Minted",
      hash: "0x7a11...9188",
      status: "VERIFIED"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 text-slate-100 shadow-2xl p-6 flex flex-col font-sans">
          
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">CHAIN OF CUSTODY AUDIT</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Seal #{sealIndex} • Block #{blockNumber}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Timeline Stream */}
          <div className="flex-1 overflow-y-auto py-6 space-y-6">
            {auditTimeline.map((item) => (
              <div key={item.id} className="relative pl-6 border-l-2 border-slate-800 group hover:border-cyan-500 transition duration-300">
                {/* Timeline Dot */}
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-cyan-400 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      {item.stage}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.timestamp.split(' ')[1]}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-200 pt-1">{item.action}</h4>

                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-purple-400" />
                    <span>{item.actor}</span>
                  </div>

                  <div className="p-2 rounded bg-slate-950 border border-slate-800/80 font-mono text-[10px] text-slate-400 break-all flex items-center justify-between mt-2">
                    <span className="truncate">{item.hash}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Drawer Footer */}
          <div className="pt-4 border-t border-slate-800 text-center font-mono text-xs text-slate-500">
            Immutable Audit Trail • Dilithium-5 Cryptographically Signed
          </div>

        </div>
      </div>
    </div>
  );
};
export default AuditHistoryDrawer;
