import React from 'react';
import { X, ShieldCheck, AlertTriangle, Lock, Cpu, Clock, Terminal, Copy, Check, Fingerprint, ShieldAlert, Binary } from 'lucide-react';

export interface HardwareUnit {
  id: string;
  serialNumber: string;
  status: 'Verified' | 'Quarantined' | 'Drifted';
  lastAudit: string;
  signature: string;
  enclaveHash: string;
  firmwareVersion: string;
  driftValue: number;
}

interface SealDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: HardwareUnit | null;
}

export const SealDetailModal: React.FC<SealDetailModalProps> = ({ isOpen, onClose, unit }) => {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  if (!isOpen || !unit) return null;

  const handleCopy = (field: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusBadge = () => {
    switch (unit.status) {
      case 'Verified':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 rounded">
            <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED // IN-CONSENSUS
          </span>
        );
      case 'Quarantined':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-rose-400 bg-rose-950/60 border border-rose-500/40 rounded">
            <ShieldAlert className="w-3.5 h-3.5" /> QUARANTINED // CRYPTO-HALT
          </span>
        );
      case 'Drifted':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-amber-400 bg-amber-950/60 border border-amber-500/40 rounded">
            <AlertTriangle className="w-3.5 h-3.5" /> DRIFT DETECTED // AUDIT PENDING
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-slate-950 border border-slate-700/80 rounded-lg shadow-2xl shadow-cyan-950/50 overflow-hidden font-mono text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Terminal Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold tracking-wider text-slate-300">
              FORENSIC SEAL INSPECTOR // {unit.id}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close Inspector Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Status & Unit Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Hardware Unit SN</div>
              <div className="text-lg font-bold text-white tracking-wide">{unit.serialNumber}</div>
            </div>
            <div>{getStatusBadge()}</div>
          </div>

          {/* Metric Telemetry Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>LAST AUDIT (UTC)</span>
              </div>
              <div className="text-xs font-semibold text-slate-200">{unit.lastAudit}</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>FIRMWARE</span>
              </div>
              <div className="text-xs font-semibold text-slate-200">{unit.firmwareVersion}</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Binary className="w-3.5 h-3.5 text-amber-400" />
                <span>DRIFT VALUE</span>
              </div>
              <div className={`text-xs font-semibold ${unit.driftValue > 0.05 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {unit.driftValue.toFixed(4)} Δ
              </div>
            </div>
          </div>

          {/* Cryptographic Signatures & Hashes */}
          <div className="space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded">
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold">
                  <Fingerprint className="w-3.5 h-3.5" /> SECURE ENCLAVE SEAL HASH
                </span>
                <button
                  onClick={() => handleCopy('enclave', unit.enclaveHash)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 transition-colors"
                >
                  {copiedField === 'enclave' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedField === 'enclave' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <code className="block text-[11px] text-slate-300 break-all bg-black/60 p-2 rounded border border-slate-800/60 font-mono">
                {unit.enclaveHash}
              </code>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded">
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold">
                  <Lock className="w-3.5 h-3.5" /> POST-QUANTUM SEAL SIGNATURE (PQC-FALCON-512)
                </span>
                <button
                  onClick={() => handleCopy('sig', unit.signature)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-300 transition-colors"
                >
                  {copiedField === 'sig' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedField === 'sig' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <code className="block text-[11px] text-slate-300 break-all bg-black/60 p-2 rounded border border-slate-800/60 font-mono">
                {unit.signature}
              </code>
            </div>
          </div>

          {/* Forensic Statutory Attestation Footer */}
          <div className="text-[11px] text-slate-500 border-t border-slate-800/80 pt-4 flex items-center justify-between">
            <span>ETDA Sec 26 & PDPA Statutory Chain of Custody</span>
            <span className="text-emerald-500 font-semibold">ZERO CORRUPTION VERIFIED</span>
          </div>
        </div>
      </div>
    </div>
  );
};
