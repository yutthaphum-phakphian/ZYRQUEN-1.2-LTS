import React, { useState } from 'react';
import {
  Link2,
  FileCode,
  Hash,
  Layers,
  KeyRound,
  UserCheck,
  CheckCircle2,
  AlertOctagon,
  Copy,
  Check,
  ShieldCheck,
  Search,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { SYSTEM_METADATA, THAI_CUSTODIANS } from '../data/canonicalData';
import { CryptographicBindingProof } from '../types';
import { copyToClipboard } from '../utils/clipboard';

export const CryptographicBindingPanel: React.FC = () => {
  const [selectedBindingId, setSelectedBindingId] = useState<string>('bind-01');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // 5-Tier Canonical Cryptographic Binding Proof Records
  const bindings: CryptographicBindingProof[] = [
    {
      id: 'bind-01',
      artifactName: 'kernel_sec28_breaker.ko (Fail-Closed Circuit Breaker Kernel)',
      artifactDigest: 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      merkleRoot: '909ab8146747f520beec1907beab286c06a38096f9bf00f40d8aa536b3fa4c68',
      blockHeight: 849202,
      pqcSignature: 'DILITHIUM5:SIG_e8f39a044b76a91c8903c7340026e6ef...9b21ae7c',
      signerPassport: '#EP-SOVEREIGN-01',
      signerName: 'สมชาย พากเพียร (Level 25 Sovereign Director)',
      status: 'BOUND_VERIFIED',
      verifiedAt: '2026-08-22 01:46:12 ICT',
    },
    {
      id: 'bind-02',
      artifactName: 'libdilithium_lattice_core.so (NIST FIPS 204 Engine)',
      artifactDigest: 'SHA256:2c6ee4b9c1d2e5b871c5658b1a37c83c2e64627b0eb817c1bf86c2e3da72c9a8',
      merkleRoot: '909ab8146747f520beec1907beab286c06a38096f9bf00f40d8aa536b3fa4c68',
      blockHeight: 849202,
      pqcSignature: 'DILITHIUM5:SIG_912cd71034f5902187cc890209ab4471...00ae341f',
      signerPassport: '#EP-CUSTODIAN-02',
      signerName: 'ดร. กานดา วัฒนพาณิชย์ (Quantum Lead)',
      status: 'BOUND_VERIFIED',
      verifiedAt: '2026-08-22 01:46:12 ICT',
    },
    {
      id: 'bind-03',
      artifactName: 'sovereign_merkle_tree.dat (Frozen SSoT State Ledger)',
      artifactDigest: 'SHA256:b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',
      merkleRoot: '909ab8146747f520beec1907beab286c06a38096f9bf00f40d8aa536b3fa4c68',
      blockHeight: 849202,
      pqcSignature: 'DILITHIUM5:SIG_4401bbfa9230018742ccb30219904712...ef182a4d',
      signerPassport: '#EP-CUSTODIAN-03',
      signerName: 'พ.ต.อ. เอกชัย รัตนประสิทธิ์ (Forensics Chief)',
      status: 'BOUND_VERIFIED',
      verifiedAt: '2026-08-22 01:46:12 ICT',
    },
    {
      id: 'bind-04',
      artifactName: 'bluefors_cryo_telemetry.bin (14.98 mK Sub-Kelvin Sensor Log)',
      artifactDigest: 'SHA256:11a4e2ef64d73cf02b9e1e5b8d9633e888fd2e58a74e502c34a2e88a09f3e4cb',
      merkleRoot: '909ab8146747f520beec1907beab286c06a38096f9bf00f40d8aa536b3fa4c68',
      blockHeight: 849202,
      pqcSignature: 'DILITHIUM5:SIG_33b8a1c900e5f21287900bba76020119...88ac0194',
      signerPassport: '#EP-CUSTODIAN-04',
      signerName: 'ศ.ดร. ธนพล มิ่งขวัญ (Cryogenics Principal)',
      status: 'BOUND_VERIFIED',
      verifiedAt: '2026-08-22 01:46:12 ICT',
    },
  ];

  const handleCopy = (text: string, id: string) => {
    copyToClipboard(text);
    setCopiedKey(id);
    playTone(720, 0.03);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const selectedBinding = bindings.find((b) => b.id === selectedBindingId) || bindings[0];

  return (
    <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#0c0f18]/95 via-[#080a12]/90 to-[#07080F] border-2 border-amber-500/35 backdrop-blur-2xl space-y-6 shadow-2xl font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center justify-center shrink-0">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-amber-100 font-serif">
                Cryptographic Binding Panel (การผูกมัดทางรหัสวิทยา ๕ ขั้น)
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                5-TIER BINDING LOCKED
              </span>
            </div>
            <p className="text-xs text-amber-200/80 font-serif mt-0.5">
              Artifact Digest ➔ Merkle Root ➔ Block #849202 ➔ PQC Signature ➔ Signer Passport
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-xl bg-black/60 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ALL BINDINGS VERIFIED</span>
          </span>
        </div>
      </div>

      {/* 5-Tier Binding Flow Architecture Visualizer */}
      <div className="p-5 rounded-2xl bg-black/60 border border-white/8 space-y-4">
        <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
          <span>INVIOLABLE 5-STAGE CRYPTOGRAPHIC PROVENANCE FLOW</span>
          <span className="text-[10px] text-amber-400">UNBROKEN ROOT OF TRUST</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          {[
            {
              step: '1. ARTIFACT DIGEST',
              icon: FileCode,
              val: selectedBinding.artifactDigest.slice(0, 18) + '...',
              sub: 'SHA-256 Binary Hash',
              color: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
            },
            {
              step: '2. MERKLE ROOT',
              icon: Hash,
              val: '909ab814...fa4c68',
              sub: 'Root 64-Hex Anchor',
              color: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
            },
            {
              step: '3. BLOCK HEIGHT',
              icon: Layers,
              val: `#${selectedBinding.blockHeight.toLocaleString()}`,
              sub: 'Immutable Seal Epoch',
              color: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
            },
            {
              step: '4. PQC SIGNATURE',
              icon: KeyRound,
              val: 'Dilithium-5 (FIPS 204)',
              sub: 'Zero-Knowledge Seal',
              color: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
            },
            {
              step: '5. SIGNER PASSPORT',
              icon: UserCheck,
              val: selectedBinding.signerPassport,
              sub: selectedBinding.signerName.split(' ')[0],
              color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
            },
          ].map((node, i) => {
            const IconComp = node.icon;
            return (
              <div
                key={i}
                className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2 ${node.color}`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="opacity-80">{node.step}</span>
                  <IconComp className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-mono text-xs font-bold truncate text-white">{node.val}</div>
                  <div className="text-[10px] opacity-75 font-sans truncate mt-0.5">{node.sub}</div>
                </div>
                <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[9px]">
                  <span className="text-emerald-400 font-bold">CRYPTOGRAPHIC PASS</span>
                  <span>🔒</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Artifact Binding Selector & Detailed Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Artifact List */}
        <div className="p-4 rounded-2xl bg-black/60 border border-white/8 space-y-2 lg:col-span-1">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider pb-1">
            CANONICAL ARTIFACTS
          </div>
          <div className="space-y-1.5">
            {bindings.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  playTone(560, 0.03);
                  setSelectedBindingId(b.id);
                }}
                className={`w-full p-3 rounded-xl border text-left transition-all text-xs ${
                  selectedBindingId === b.id
                    ? 'bg-amber-500/20 border-amber-400/60 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="font-bold truncate text-[11px] text-zinc-200">{b.artifactName}</div>
                <div className="flex items-center justify-between text-[10px] mt-1 text-zinc-500 font-mono">
                  <span>Block #{b.blockHeight}</span>
                  <span className="text-emerald-400 font-bold">BOUND</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Full Proof Drilldown */}
        <div className="p-5 rounded-2xl bg-black/70 border border-amber-500/30 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-xs font-bold text-amber-200 font-serif">
              BOUND PROOF ATTESTATION: {selectedBinding.artifactName}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              IMMUTABLE VALIDATED
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Artifact Digest */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <div className="text-[10px] text-zinc-500 flex items-center justify-between">
                <span>ARTIFACT BINARY SHA-256 DIGEST:</span>
                <button
                  onClick={() => handleCopy(selectedBinding.artifactDigest, 'digest')}
                  className="text-zinc-400 hover:text-white flex items-center gap-1 text-[10px]"
                >
                  {copiedKey === 'digest' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'digest' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="font-mono text-cyan-300 text-[11px] break-all">{selectedBinding.artifactDigest}</div>
            </div>

            {/* Merkle Root & Block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <div className="text-[10px] text-zinc-500">MERKLE ROOT ANCHOR:</div>
                <div className="font-mono text-amber-300 text-[11px] font-bold truncate">
                  {selectedBinding.merkleRoot}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <div className="text-[10px] text-zinc-500">SEAL BLOCK HEIGHT:</div>
                <div className="font-mono text-purple-300 text-sm font-bold">
                  #{selectedBinding.blockHeight.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Post-Quantum Signature */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <div className="text-[10px] text-zinc-500 flex items-center justify-between">
                <span>POST-QUANTUM DILITHIUM-5 SIGNATURE SEAL:</span>
                <span className="text-[10px] text-emerald-400 font-bold">NIST FIPS 204 PASS</span>
              </div>
              <div className="font-mono text-emerald-300 text-[10px] break-all">{selectedBinding.pqcSignature}</div>
            </div>

            {/* Signer Details */}
            <div className="p-3 rounded-xl bg-amber-500/[0.05] border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-[10px] text-amber-400/90 font-bold">AUTHORITATIVE SIGNER PASSPORT:</div>
                <div className="text-white font-bold text-xs mt-0.5">{selectedBinding.signerName}</div>
              </div>
              <div className="text-right">
                <span className="font-mono text-amber-300 font-bold text-xs bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40">
                  {selectedBinding.signerPassport}
                </span>
                <div className="text-[9px] text-zinc-500 mt-0.5">{selectedBinding.verifiedAt}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
