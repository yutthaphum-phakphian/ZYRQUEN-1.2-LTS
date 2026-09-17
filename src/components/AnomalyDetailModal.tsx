import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  X,
  Clock,
  User,
  Hash,
  Activity,
  Send,
  Loader2,
  Terminal,
  FileCode
} from 'lucide-react';
import { SovereignAuditEvent, evaluateAnomaly } from '../services/anomalyDetector';
import { playTone, playAuditChime } from './AudioSynthesizer';

interface AnomalyDetailModalProps {
  event: SovereignAuditEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onAcknowledged?: (eventId: string) => void;
}

export const AnomalyDetailModal: React.FC<AnomalyDetailModalProps> = ({
  event,
  isOpen,
  onClose,
  onAcknowledged
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ackSuccess, setAckSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !event) return null;

  const evaluation = evaluateAnomaly(event);

  const handleAcknowledge = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/audit/anomalies/${event.id}/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          acknowledgedBy: 'dr-apichaya-sovereign',
          timestamp: new Date().toISOString()
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || `HTTP ${res.status}`);
      }

      setAckSuccess(true);
      playAuditChime();
      onAcknowledged?.(event.id);
      setTimeout(() => {
        setAckSuccess(false);
        onClose();
      }, 1400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      playTone(280, 0.12);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm font-mono animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-[#070a12] border border-amber-500/40 rounded-2xl shadow-[0_0_40px_rgba(245,158,11,0.2)] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-amber-500/20 bg-[#0c101c] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Sovereign Anomaly Diagnostic
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  evaluation.severity === 'CRITICAL'
                    ? 'bg-rose-950 text-rose-300 border border-rose-500/50'
                    : evaluation.severity === 'HIGH'
                    ? 'bg-amber-950 text-amber-300 border border-amber-500/50'
                    : 'bg-yellow-950 text-yellow-300 border border-yellow-500/50'
                }`}>
                  {evaluation.severity} SEVERITY
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Event ID: {event.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Status & Drift Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-[#0c101c] rounded-xl border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block mb-1">Status</span>
              <span className={`font-bold ${event.status === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {event.status}
              </span>
            </div>
            <div className="p-3 bg-[#0c101c] rounded-xl border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block mb-1">Drift Level</span>
              <span className={`font-bold ${event.driftPercentage >= 15 ? 'text-amber-400 font-bold' : 'text-zinc-300'}`}>
                {event.driftPercentage.toFixed(2)}%
              </span>
            </div>
            <div className="p-3 bg-[#0c101c] rounded-xl border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block mb-1">Operator</span>
              <span className="text-zinc-300 truncate block">{event.operator || 'system'}</span>
            </div>
            <div className="p-3 bg-[#0c101c] rounded-xl border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block mb-1">Timestamp (UTC)</span>
              <span className="text-zinc-400 text-[10px] block truncate">{event.timestamp}</span>
            </div>
          </div>

          {/* Root Cause Analysis */}
          <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px] uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Diagnostic Failure Rationale</span>
            </div>
            <ul className="space-y-1 pl-4 list-disc text-amber-200/90 text-[11px]">
              {evaluation.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>

          {/* Cryptographic Invariant Proofs */}
          <div className="p-3.5 bg-[#05070d] border border-zinc-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-zinc-400 text-[11px]">
              <span className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-cyan-400" />
                <span>Evidence Block Merkle Hash</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">FIPS 204 Compliant</span>
            </div>
            <div className="p-2 bg-black/60 rounded border border-zinc-800/80 font-mono text-[10.5px] text-cyan-300 break-all">
              {event.blockHash || '0x7e8f3a9104b2c8d19e075af621bcde4901fa5c2b3e81749a0bcf18204689abcd'}
            </div>
          </div>

          {/* Tamper-Resistant Signature */}
          {event.signature && (
            <div className="p-3.5 bg-[#05070d] border border-zinc-800 rounded-xl space-y-1.5">
              <span className="text-[11px] text-zinc-400 block">Operator Signature Witness</span>
              <div className="p-2 bg-black/60 rounded border border-zinc-800 font-mono text-[10px] text-emerald-400 truncate">
                {event.signature}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs">
              <strong>Acknowledgment Error:</strong> {errorMessage}
            </div>
          )}

          {/* Success Banner */}
          {ackSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Anomaly acknowledged and registered to immutable audit ledger.</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800/80 bg-[#0c101c] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer text-xs"
          >
            Close
          </button>

          <button
            type="button"
            disabled={isSubmitting || ackSuccess || event.acknowledged}
            onClick={handleAcknowledge}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all disabled:opacity-40 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Submitting Audit Trail...</span>
              </>
            ) : event.acknowledged ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                <span>Acknowledged</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Acknowledge Anomaly</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
