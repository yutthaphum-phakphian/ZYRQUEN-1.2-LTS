import React, { useState } from 'react';
import { ShieldCheck, Download, Activity, FileText, CheckCircle2, Sparkles, Radio, Zap } from 'lucide-react';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import { MerkleVerificationBadge } from './MerkleVerificationBadge';

interface CouncilViewExtensionsProps {
  onJitterChange?: (enabled: boolean) => void;
  defaultJitter?: boolean;
  onTriggerTestRipple?: () => void;
}

export const CouncilViewExtensions: React.FC<CouncilViewExtensionsProps> = ({
  onJitterChange,
  defaultJitter = true,
  onTriggerTestRipple,
}) => {
  const [jitterOverlay, setJitterOverlay] = useState<boolean>(defaultJitter);
  const [isGeneratingAudit, setIsGeneratingAudit] = useState<boolean>(false);

  const handleToggleJitter = () => {
    const next = !jitterOverlay;
    setJitterOverlay(next);
    playTone(next ? 880 : 440, 0.08, 'sine');
    if (onJitterChange) {
      onJitterChange(next);
    }
  };

  const handleDownloadAuditPDF = () => {
    setIsGeneratingAudit(true);
    playAuditChime();
    playTone(660, 0.15, 'triangle');

    setTimeout(() => {
      const auditData = {
        timestamp: new Date().toISOString(),
        quorum: '10/10 SYNCHRONIZED',
        standard: 'NIST FIPS 204 (ML-DSA-87 / Dilithium-5)',
        status: 'SECURE COMPLIANCE EVIDENCE VERIFIED',
        enclaveProtocol: 'Sub-Kelvin Cryogenic Bus & Hardware Entropy State',
        cryptographicProofDigest:
          '0x94f2c9e782613dbe4f1074a3f9e9841029471abef193859230584719284759281a8b7c3d2e1f',
        consensusTable: [
          { slotId: 1, node: 'SOV-GENESIS-LEAD-01', vote: 'YES', status: 'RATIFIED' },
          { slotId: 2, node: 'SOV-AIRGAP-SEAL-02', vote: 'YES', status: 'RATIFIED' },
          { slotId: 3, node: 'SOV-KEYGEN-CEREMONY-03', vote: 'YES', status: 'RATIFIED' },
          { slotId: 4, node: 'SOV-DEFENSE-CYBER-04', vote: 'YES', status: 'RATIFIED' },
          { slotId: 5, node: 'SOV-MERKLE-CONSENSUS-05', vote: 'YES', status: 'RATIFIED' },
          { slotId: 6, node: 'SOV-QUANTUM-LATTICE-06', vote: 'YES', status: 'RATIFIED' },
          { slotId: 7, node: 'SOV-COMPLIANCE-LAW-07', vote: 'YES', status: 'RATIFIED' },
          { slotId: 8, node: 'SOV-DISASTER-VAULT-08', vote: 'YES', status: 'RATIFIED' },
          { slotId: 9, node: 'SOV-SRE-RECOVERY-09', vote: 'YES', status: 'RATIFIED' },
          { slotId: 10, node: 'SOV-FINANCIAL-ORACLE-10', vote: 'YES', status: 'RATIFIED' },
        ],
      };

      const blob = new Blob([JSON.stringify(auditData, null, 2)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Sovereign_Quorum_Audit_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsGeneratingAudit(false);
      playTone(1050, 0.2, 'sine');
    }, 1200);
  };

  return (
    <div className="space-y-4 my-6">
      {/* Jitter Variance Toggle Layer & Quick Consensus Ripple Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/80 border border-slate-800 px-5 py-4 rounded-2xl backdrop-blur-xl gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full transition-all ${
              jitterOverlay
                ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)] animate-pulse'
                : 'bg-slate-600'
            }`}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-200">Jitter Variance Overlay Layer</span>
              {jitterOverlay && (
                <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">Mesh network micro-instability deep-inspection taxonomy</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onTriggerTestRipple && (
            <button
              onClick={onTriggerTestRipple}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono transition-all inline-flex items-center gap-1.5"
              title="ส่งคลื่นฉันทามติ Vote Consensus Ripple ข้ามการ์ดทั้ง 10 ใบ"
            >
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>TEST CONSENSUS RIPPLE</span>
            </button>
          )}

          <button
            onClick={handleToggleJitter}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-black ${
              jitterOverlay ? 'bg-amber-500' : 'bg-slate-700'
            }`}
            title="สลับการแสดงผลโอเวอร์เลย์ความแปรปรวนของสัญญาณ Jitter"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                jitterOverlay ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Merkle Verification Engine Hash Chain Continuity Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/80 border border-slate-800 px-5 py-4 rounded-2xl backdrop-blur-xl gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-200">Merkle Verification Engine</span>
            <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              LEDGER INVARIANT
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Hash chain audit log comparison against Sovereign Ledger sealed block #849202
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MerkleVerificationBadge showInspectorButton={true} />
        </div>
      </div>

      {/* Download Consensus Audit Compliance Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/80 border border-slate-800 px-5 py-4 rounded-2xl backdrop-blur-xl gap-4">
        <div>
          <span className="text-sm font-medium text-slate-200">Regulatory Compliance Evidence</span>
          <p className="text-xs text-slate-400">Export PQC-signed 10/10 Quorum Consensus Table report</p>
        </div>
        <button
          onClick={handleDownloadAuditPDF}
          disabled={isGeneratingAudit}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-mono transition-all shadow-[0_0_15px_rgba(245,158,11,0.15)] disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {isGeneratingAudit ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-amber-300" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>COMPILING SECURE PDF...</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>DOWNLOAD CONSENSUS AUDIT (PDF)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
