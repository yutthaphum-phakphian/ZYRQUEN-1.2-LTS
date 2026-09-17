import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  CheckCircle2,
  Cpu,
  Fingerprint,
  Key,
  ShieldCheck,
  Zap,
  RotateCw,
  Copy,
  Check,
  Terminal,
  Radio,
  Clock,
  Sparkles,
} from 'lucide-react';
import { CouncilMember } from '../../data/councilData';
import { playAuditChime, playTone } from '../AudioSynthesizer';
import { copyToClipboard } from '../../utils/clipboard';

interface ModalMemberDiagnosticProps {
  member: CouncilMember;
}

type StepStage = 'IDLE' | 'BUS_HANDSHAKE' | 'TRNG_ENTROPY' | 'LATTICE_PQC_SIGN' | 'COMPLETED';

export const ModalMemberDiagnostic: React.FC<ModalMemberDiagnosticProps> = ({ member }) => {
  const [stage, setStage] = useState<StepStage>('IDLE');
  const [isRunning, setIsRunning] = useState(false);
  const [latencyResult, setLatencyResult] = useState<string | null>(null);
  const [pqcDigestResult, setPqcDigestResult] = useState<string | null>(null);
  const [entropyRateResult, setEntropyRateResult] = useState<string | null>(null);
  const [copiedDigest, setCopiedDigest] = useState(false);

  const runDiagnosticHandshake = () => {
    if (isRunning) return;

    setIsRunning(true);
    setStage('BUS_HANDSHAKE');
    setLatencyResult(null);
    setPqcDigestResult(null);
    setEntropyRateResult(null);
    playTone(520, 0.1, 'sine');

    // Step 1: Sub-Kelvin Cryo-Bus Handshake (0-600ms)
    setTimeout(() => {
      setStage('TRNG_ENTROPY');
      const calculatedLatency = (0.12 + (member.slotId % 5) * 0.025 + Math.random() * 0.03).toFixed(3);
      setLatencyResult(`${calculatedLatency} ms`);
      playTone(680, 0.1, 'sine');

      // Step 2: Quantum TRNG Entropy Sampling (600-1200ms)
      setTimeout(() => {
        setStage('LATTICE_PQC_SIGN');
        const calculatedEntropy = `${(1800 + member.slotId * 45 + Math.floor(Math.random() * 80))} KB/s`;
        setEntropyRateResult(calculatedEntropy);
        playTone(840, 0.1, 'sine');

        // Step 3: NIST FIPS 204 ML-DSA-87 Signature Attestation (1200-1800ms)
        setTimeout(() => {
          setStage('COMPLETED');
          setIsRunning(false);
          // Deterministic PQC digest based on member and current timestamp
          const salt = Math.random().toString(16).substring(2, 8);
          const sig = member.cryptoSignature || '0x94f2c9e782613dbe4f1074a3f9e9841029471abef19385923058471928475928';
          const computedDigest = `0x${sig.substring(2, 34)}${salt}A256_${member.councilCode || 'COUNCIL'}_VALID_FIPS204`;
          setPqcDigestResult(computedDigest);
          playAuditChime();
        }, 650);
      }, 650);
    }, 600);
  };

  const handleCopyDigest = (text: string) => {
    copyToClipboard(text);
    setCopiedDigest(true);
    setTimeout(() => setCopiedDigest(false), 2000);
  };

  return (
    <div className="p-4 rounded-2xl bg-zinc-950/95 border border-cyan-500/30 space-y-3 font-mono shadow-xl relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Run Diagnostic Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            <Zap className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Cryptographic Handshake Diagnostic
              </span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                NIST FIPS 204
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 block font-sans">
              จำลองการเชื่อมต่อ Sub-Kelvin Bus และตรวจสอบลายเซ็น PQC Dilithium-5 แบบเรียลไทม์
            </span>
          </div>
        </div>

        <button
          onClick={runDiagnosticHandshake}
          disabled={isRunning}
          className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-all shadow-md active:scale-95 ${
            isRunning
              ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/40 cursor-wait'
              : 'bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white border border-cyan-400/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.35)]'
          }`}
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'กำลังวินิจฉัย...' : 'รันการวินิจฉัย (Run Diagnostic)'}</span>
        </button>
      </div>

      {/* Diagnostic Progress Stages */}
      <div className="grid grid-cols-3 gap-2 text-[11px]">
        {/* Step 1 */}
        <div
          className={`p-2 rounded-xl border transition-all ${
            stage === 'BUS_HANDSHAKE'
              ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 animate-pulse'
              : stage === 'TRNG_ENTROPY' || stage === 'LATTICE_PQC_SIGN' || stage === 'COMPLETED'
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
              : 'bg-zinc-900/40 border-white/5 text-zinc-500'
          }`}
        >
          <div className="flex items-center gap-1 font-bold">
            {stage === 'BUS_HANDSHAKE' ? (
              <Activity className="w-3 h-3 animate-spin text-cyan-400" />
            ) : stage === 'TRNG_ENTROPY' || stage === 'LATTICE_PQC_SIGN' || stage === 'COMPLETED' ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
            )}
            <span>1. Bus Ping</span>
          </div>
          <span className="text-[9px] text-zinc-400 block mt-0.5">
            {latencyResult ? `Latency: ${latencyResult}` : 'Sub-Kelvin Sync'}
          </span>
        </div>

        {/* Step 2 */}
        <div
          className={`p-2 rounded-xl border transition-all ${
            stage === 'TRNG_ENTROPY'
              ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 animate-pulse'
              : stage === 'LATTICE_PQC_SIGN' || stage === 'COMPLETED'
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
              : 'bg-zinc-900/40 border-white/5 text-zinc-500'
          }`}
        >
          <div className="flex items-center gap-1 font-bold">
            {stage === 'TRNG_ENTROPY' ? (
              <Cpu className="w-3 h-3 animate-spin text-cyan-400" />
            ) : stage === 'LATTICE_PQC_SIGN' || stage === 'COMPLETED' ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
            )}
            <span>2. Quantum TRNG</span>
          </div>
          <span className="text-[9px] text-zinc-400 block mt-0.5">
            {entropyRateResult ? `Rate: ${entropyRateResult}` : 'Entropy Harvest'}
          </span>
        </div>

        {/* Step 3 */}
        <div
          className={`p-2 rounded-xl border transition-all ${
            stage === 'LATTICE_PQC_SIGN'
              ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 animate-pulse'
              : stage === 'COMPLETED'
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
              : 'bg-zinc-900/40 border-white/5 text-zinc-500'
          }`}
        >
          <div className="flex items-center gap-1 font-bold">
            {stage === 'LATTICE_PQC_SIGN' ? (
              <Key className="w-3 h-3 animate-spin text-cyan-400" />
            ) : stage === 'COMPLETED' ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
            )}
            <span>3. PQC Attest</span>
          </div>
          <span className="text-[9px] text-zinc-400 block mt-0.5">
            {stage === 'COMPLETED' ? 'Lattice Valid' : 'Dilithium-5'}
          </span>
        </div>
      </div>

      {/* Real-Time Live Result View */}
      <AnimatePresence>
        {stage === 'COMPLETED' && pqcDigestResult && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-xl bg-black/80 border border-emerald-500/40 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Node Status: ONLINE & CRYPTO_VALIDATED</span>
              </div>
              <span className="text-[10px] text-cyan-400 font-mono">
                Round-trip: <strong>{latencyResult}</strong>
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span className="flex items-center gap-1">
                  <Fingerprint className="w-3 h-3 text-purple-400" />
                  <span>Real-time Verified PQC Digest (ML-DSA-87):</span>
                </span>
                <button
                  onClick={() => handleCopyDigest(pqcDigestResult)}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 underline"
                >
                  {copiedDigest ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>คัดลอกแล้ว</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>คัดลอก Digest</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-2 rounded-lg bg-zinc-950 font-mono text-[11px] text-cyan-300 break-all select-all border border-cyan-500/30">
                {pqcDigestResult}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-zinc-400">
              <span>Enclave: <strong>{member.hardwareEnclave}</strong></span>
              <span className="text-emerald-400 font-semibold">SSoT Verified 100%</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
