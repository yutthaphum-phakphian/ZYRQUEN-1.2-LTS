import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertOctagon,
  ShieldAlert,
  Zap,
  RefreshCw,
  Cpu,
  CheckCircle2,
  X,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { hsmClusterService, HsmClusterState } from '../../services/hsmClusterService';
import { playTone, playAuditChime } from '../AudioSynthesizer';

export const HsmQuorumAlertBanner: React.FC = () => {
  const [clusterState, setClusterState] = useState<HsmClusterState>(() =>
    hsmClusterService.getState()
  );
  const [showRemediationToast, setShowRemediationToast] = useState(false);

  useEffect(() => {
    const unsubscribe = hsmClusterService.subscribe((state) => {
      setClusterState(state);
      // Audible warning alarm if quorum drops below 80%
      if (state.isDegraded) {
        playTone(380, 0.12);
        setTimeout(() => playTone(320, 0.15), 180);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleRemediate = async () => {
    playTone(520, 0.08);
    playTone(740, 0.1);
    await hsmClusterService.remediateCluster();
    playAuditChime();
    setShowRemediationToast(true);
    setTimeout(() => setShowRemediationToast(false), 3500);
  };

  const handleSimulateDegrade = () => {
    playTone(340, 0.1);
    hsmClusterService.simulateDegradation(7); // 7/10 = 70% < 80%
  };

  return (
    <>
      <AnimatePresence>
        {clusterState.isDegraded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full bg-gradient-to-r from-red-950/90 via-red-900/90 to-red-950/90 border-b border-red-500/60 text-white font-mono text-xs shadow-[0_4px_25px_rgba(239,68,68,0.4)] relative z-50 overflow-hidden"
          >
            {/* Pulsing Alert Scanline */}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(239,68,68,0.15)_50%,transparent_100%)] animate-pulse pointer-events-none" />

            <div className="max-w-[1720px] mx-auto px-3 sm:px-6 py-2.5 flex flex-col md:flex-row items-center justify-between gap-2.5">
              {/* Alert Message & Diagnostics */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-300 animate-bounce shrink-0">
                  <AlertOctagon className="w-4 h-4 text-red-400" />
                </div>

                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-red-100 tracking-wide text-xs sm:text-sm flex items-center gap-1.5">
                      <span>⚠️ CRITICAL CLUSTER ALERT:</span>
                      <span className="text-red-300">HSM Quorum Degraded Below 80% Threshold!</span>
                    </span>
                    <span className="px-2 py-0.2 rounded-full bg-red-500 text-black font-extrabold text-[10px] animate-pulse">
                      {clusterState.activeNodes}/10 NODES ({clusterState.quorumPercentage}%)
                    </span>
                  </div>

                  <p className="text-[11px] text-red-200/90 truncate max-w-2xl">
                    FIPS 140-3 Level 4 hardware quorum is compromised ({10 - clusterState.activeNodes} nodes offline).
                    Immediate remediation required to prevent state transaction freeze.
                  </p>
                </div>
              </div>

              {/* Immediate Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <button
                  id="btn-remediate-hsm-cluster"
                  type="button"
                  onClick={handleRemediate}
                  disabled={clusterState.isRemediating}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.5)] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  title="Execute automated sub-kelvin cryptographic re-ratification to restore all 10 HSM nodes"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${clusterState.isRemediating ? 'animate-spin' : ''}`} />
                  <span>{clusterState.isRemediating ? 'Remediating...' : '⚡ Immediate Remediation (Restore 10/10)'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Remediation Success Toast */}
      <AnimatePresence>
        {showRemediationToast && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed top-16 right-6 z-50 px-4 py-2.5 rounded-xl bg-[#081325] border border-emerald-500 text-emerald-300 font-mono text-xs shadow-[0_0_25px_rgba(16,185,129,0.3)] flex items-center gap-2.5"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="font-bold text-white">HSM Cluster Quorum Restored!</div>
              <div className="text-[10px] text-zinc-400">
                10/10 Deca-Key Nodes Active • Sub-Kelvin 14.98 mK Temperature Ratified
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HsmQuorumAlertBanner;
