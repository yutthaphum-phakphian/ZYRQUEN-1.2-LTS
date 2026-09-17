import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Binary,
  Layers,
  Copy,
  Check,
  Play,
  Pause,
  RefreshCw,
  Sparkles,
  Lock,
  Cpu,
  Fingerprint,
} from 'lucide-react';
import { generateSha256Hash } from '../utils/telemetrySnapshot';
import { SYSTEM_METADATA } from '../data/canonicalData';
import { playTone } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';

interface MerkleProofItem {
  id: string;
  blockHeight: number;
  type: 'MERKLE_BRANCH' | 'KYBER_1024' | 'DILITHIUM_5' | 'ZK_SNARK' | 'BLAS_VERIFY';
  leafIndex: number;
  leafHash: string;
  siblingHash: string;
  rootHash: string;
  proofValidity: 'VALID' | 'ATTESTED' | 'PQC_SEALED';
  latencyMicros: number;
  timestamp: string;
}

const INITIAL_PROOFS: MerkleProofItem[] = [
  {
    id: 'PRF-849202-01',
    blockHeight: 849202,
    type: 'MERKLE_BRANCH',
    leafIndex: 0,
    leafHash: '0x909ab814e5a973d4bb79e0a293673f8373a4b6c3d2e1f0a9b8c7d6e5f4a3b2c1',
    siblingHash: '0x3f4a8b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4',
    rootHash: SYSTEM_METADATA.merkleRoot,
    proofValidity: 'VALID',
    latencyMicros: 42,
    timestamp: '05:03:08.120',
  },
  {
    id: 'PRF-849202-02',
    blockHeight: 849202,
    type: 'KYBER_1024',
    leafIndex: 1,
    leafHash: '0x7c4f1e9a2b3d8c5e6f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e',
    siblingHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
    rootHash: SYSTEM_METADATA.merkleRoot,
    proofValidity: 'PQC_SEALED',
    latencyMicros: 68,
    timestamp: '05:03:08.245',
  },
  {
    id: 'PRF-849202-03',
    blockHeight: 849202,
    type: 'DILITHIUM_5',
    leafIndex: 2,
    leafHash: '0x5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6',
    siblingHash: '0x8f7e6d5c4b3a201f9e8d7c6b5a40392817263544536271809a8b7c6d5e4f3a2',
    rootHash: SYSTEM_METADATA.merkleRoot,
    proofValidity: 'ATTESTED',
    latencyMicros: 54,
    timestamp: '05:03:08.380',
  },
  {
    id: 'PRF-849202-04',
    blockHeight: 849202,
    type: 'ZK_SNARK',
    leafIndex: 3,
    leafHash: '0x2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3',
    siblingHash: '0x9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0',
    rootHash: SYSTEM_METADATA.merkleRoot,
    proofValidity: 'VALID',
    latencyMicros: 89,
    timestamp: '05:03:08.512',
  },
];

export const CryptographyStream: React.FC = () => {
  const [proofs, setProofs] = useState<MerkleProofItem[]>(INITIAL_PROOFS);
  const [isStreaming, setIsStreaming] = useState(true);
  const [streamSpeed, setStreamSpeed] = useState<number>(1800); // ms per proof
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [verifiedCount, setVerifiedCount] = useState(14902);
  const streamContainerRef = useRef<HTMLDivElement>(null);

  // Generate randomized Merkle proof entry
  const generateNewProof = (): MerkleProofItem => {
    const types: MerkleProofItem['type'][] = [
      'MERKLE_BRANCH',
      'KYBER_1024',
      'DILITHIUM_5',
      'ZK_SNARK',
      'BLAS_VERIFY',
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    const index = Math.floor(Math.random() * 16);
    const leafSeed = `leaf-${Date.now()}-${Math.random()}`;
    const sibSeed = `sib-${Date.now()}-${Math.random()}`;
    const now = new Date();
    const timeStr =
      now.toLocaleTimeString('th-TH', { hour12: false }) +
      '.' +
      String(now.getMilliseconds()).padStart(3, '0');

    return {
      id: `PRF-849202-${String(Math.floor(100 + Math.random() * 900))}`,
      blockHeight: 849202,
      type,
      leafIndex: index,
      leafHash: generateSha256Hash(leafSeed),
      siblingHash: generateSha256Hash(sibSeed),
      rootHash: SYSTEM_METADATA.merkleRoot,
      proofValidity: Math.random() > 0.3 ? 'VALID' : 'PQC_SEALED',
      latencyMicros: Math.floor(35 + Math.random() * 60),
      timestamp: timeStr,
    };
  };

  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      const newProof = generateNewProof();
      setProofs((prev) => [newProof, ...prev.slice(0, 19)]);
      setVerifiedCount((prev) => prev + 1);
    }, streamSpeed);

    return () => clearInterval(interval);
  }, [isStreaming, streamSpeed]);

  const handleCopy = (id: string, text: string) => {
    copyToClipboard(text);
    setCopiedId(id);
    playTone(700, 0.05);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="p-6 rounded-[28px] bg-[#0b0e1a]/75 border border-white/8 backdrop-blur-xl space-y-4 font-mono text-xs">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/8 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-300">
            <Binary className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white uppercase text-xs sm:text-sm tracking-wide">
                Cryptography & Merkle Proof Stream
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-semibold">
                CRYPTO-ENGINE V25
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
              Live rolling verification of Merkle tree branches, Kyber-1024 decapsulations & Dilithium-5 signatures.
            </p>
          </div>
        </div>

        {/* Stream Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-1 text-[10px]">
            <button
              onClick={() => setStreamSpeed(3000)}
              className={`px-2 py-0.5 rounded-lg transition-all ${
                streamSpeed === 3000 ? 'bg-white/15 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              1x
            </button>
            <button
              onClick={() => setStreamSpeed(1800)}
              className={`px-2 py-0.5 rounded-lg transition-all ${
                streamSpeed === 1800 ? 'bg-white/15 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              2x
            </button>
            <button
              onClick={() => setStreamSpeed(900)}
              className={`px-2 py-0.5 rounded-lg transition-all ${
                streamSpeed === 900 ? 'bg-white/15 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              4x
            </button>
          </div>

          <button
            onClick={() => {
              playTone(isStreaming ? 480 : 640, 0.05);
              setIsStreaming(!isStreaming);
            }}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all ${
              isStreaming
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
            }`}
          >
            {isStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isStreaming ? 'STREAMING' : 'PAUSED'}</span>
          </button>
        </div>
      </div>

      {/* Proof Stream Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
          <span className="text-[10px] text-zinc-500 block uppercase">Merkle Root</span>
          <span className="text-cyan-300 font-bold truncate block">{SYSTEM_METADATA.merkleRoot.slice(0, 18)}...</span>
        </div>
        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
          <span className="text-[10px] text-zinc-500 block uppercase">Total Verified Proofs</span>
          <span className="text-emerald-400 font-bold block">{verifiedCount.toLocaleString()} SEALS</span>
        </div>
        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
          <span className="text-[10px] text-zinc-500 block uppercase">PQC Security Level</span>
          <span className="text-violet-300 font-bold block">NIST Level 5 (Kyber-1024)</span>
        </div>
        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
          <span className="text-[10px] text-zinc-500 block uppercase">Avg Verification Latency</span>
          <span className="text-amber-300 font-bold block">48.2 μs (Sub-Millisecond)</span>
        </div>
      </div>

      {/* Rolling Proofs List */}
      <div
        ref={streamContainerRef}
        className="space-y-2 max-h-[320px] overflow-y-auto pr-1 select-text scrollbar-thin scrollbar-thumb-white/10"
      >
        {proofs.map((p, idx) => (
          <div
            key={p.id + '-' + p.timestamp}
            className={`p-3 rounded-2xl bg-black/50 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
              idx === 0
                ? 'border-violet-500/50 bg-violet-950/20 shadow-[0_0_15px_rgba(139,92,246,0.15)] animate-in fade-in slide-in-from-top-2 duration-300'
                : 'border-white/5 hover:border-white/15'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3">
              <span
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border shrink-0 ${
                  p.type === 'MERKLE_BRANCH'
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                    : p.type === 'KYBER_1024'
                    ? 'bg-violet-500/15 text-violet-300 border-violet-500/30'
                    : p.type === 'DILITHIUM_5'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}
              >
                {p.type}
              </span>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-zinc-200">{p.id}</span>
                  <span className="text-zinc-500 text-[10px]">Leaf #{p.leafIndex}</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-zinc-400 text-[10px]">{p.timestamp}</span>
                </div>
                <div className="text-[11px] text-zinc-400 truncate max-w-xl font-mono mt-0.5">
                  <span className="text-zinc-500">Hash: </span>
                  <span className="text-zinc-300">{p.leafHash.slice(0, 20)}...</span>
                  <span className="text-zinc-500"> ⊕ Sibling: </span>
                  <span className="text-zinc-400">{p.siblingHash.slice(0, 16)}...</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
              <span className="text-[10px] text-zinc-400">{p.latencyMicros} μs</span>

              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-bold">
                {p.proofValidity}
              </span>

              <button
                onClick={() => handleCopy(p.id, `${p.id} | Leaf:${p.leafHash} | Sibling:${p.siblingHash} | Root:${p.rootHash}`)}
                className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                title="Copy Full Cryptographic Proof Tuple"
              >
                {copiedId === p.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
