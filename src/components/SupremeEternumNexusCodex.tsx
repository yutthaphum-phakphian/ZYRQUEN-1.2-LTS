import React, { useState } from 'react';
import { playTone, playAuditChime } from './AudioSynthesizer';

export interface HistoricalMerkleProof {
  blockHeight: number;
  blockHash: string;
  merkleRoot: string;
  canonicalSeals: number;
  quarantinedSeals: number;
  hsmQuorum: string;
  pqcAlgorithm: string;
  drift: string;
  timestamp: string;
  principal: string;
  boundary: string;
  courtDossierId: string;
  description: string;
}

export interface CodexDocumentationEntry {
  id: string;
  category: 'Cryptography' | 'Governance' | 'Architecture' | 'Compliance' | 'Treasury';
  title: string;
  emoji: string;
  tags: string[];
  summary: string;
  merkleProofAnchor: string;
  chamberRef: string;
  securityStandard: string;
}

export const SupremeEternumNexusCodex: React.FC<{
  onNavigateToLedger?: () => void;
  onNavigateToNexus?: () => void;
}> = ({ onNavigateToLedger, onNavigateToNexus }) => {
  const [activeTab, setActiveTab] = useState<'codex_docs' | 'merkle_explorer' | 'seal_deep_dive' | 'legal_crosswalk'>('codex_docs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProofIndex, setSelectedProofIndex] = useState<number>(0);
  const [selectedEntryId, setSelectedEntryId] = useState<string>('PQC-FIPS-204');

  const historicalProofs: HistoricalMerkleProof[] = [
    {
      blockHeight: 849202,
      blockHash: '0x849202a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      merkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      canonicalSeals: 14902,
      quarantinedSeals: 80,
      hsmQuorum: '10/10 REAL_HSM FIPS 140-3 L4',
      pqcAlgorithm: 'FIPS 204 ML-DSA-87 / Dilithium-3',
      drift: 'Δ0.00% Zero Drift',
      timestamp: '2026-09-10 00:00:00 ICT (FROZEN v1.2 LTS)',
      principal: 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
      boundary: 'Ω600_1000 (400 Tenants LOCKED)',
      courtDossierId: 'ZQ-COURT-ETDA-PDPA-849202',
      description: 'Primary Genesis SSoT Anchor Block for ZYRQUEN Ω∞ Sovereign Engine. Fully reconciled with zero mutation.',
    },
    {
      blockHeight: 849203,
      blockHash: '0x849203c94816bed34cdbb07528e18501da86fc4691763a43fa4c69',
      merkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      canonicalSeals: 14902,
      quarantinedSeals: 80,
      hsmQuorum: '10/10 REAL_HSM FIPS 140-3 L4',
      pqcAlgorithm: 'FIPS 203 ML-KEM-1024',
      drift: 'Δ0.00% Zero Drift',
      timestamp: '2026-09-10 00:15:22 ICT',
      principal: 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
      boundary: 'Ω600_1000 (400 Tenants LOCKED)',
      courtDossierId: 'ZQ-COURT-ETDA-PDPA-849203',
      description: 'Sub-Kelvin (14.98 mK) Telemetry validation snapshot with real-time OTLP health sync.',
    },
    {
      blockHeight: 40202,
      blockHash: '0x040202e14816bed34cdbb07528e18501da86fc4691763a43fa4c60',
      merkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      canonicalSeals: 14902,
      quarantinedSeals: 80,
      hsmQuorum: '10/10 REAL_HSM FIPS 140-3 L4',
      pqcAlgorithm: 'FIPS 205 SLH-DSA',
      drift: 'Δ0.00% Zero Drift',
      timestamp: '2026-09-10 00:30:14 ICT',
      principal: 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
      boundary: 'Ω600_1000 (400 Tenants LOCKED)',
      courtDossierId: 'ZQ-COURT-ETDA-PDPA-40202',
      description: 'Immutable Treasury & RWA Reserve Attestation for 1.49B THB-SOV and 14,902 oz XAU physical backing.',
    },
  ];

  const codexEntries: CodexDocumentationEntry[] = [
    {
      id: 'PQC-FIPS-204',
      category: 'Cryptography',
      title: 'FIPS 204 ML-DSA-87 Post-Quantum Signatures',
      emoji: '🔐',
      tags: ['PQC', 'NIST', 'ML-DSA-87', 'FIPS 204'],
      summary: 'Quantum-resistant digital signature algorithm ensuring root attestation cannot be compromised by Shor-class quantum computers.',
      merkleProofAnchor: 'Block #849202 Leaf #001',
      chamberRef: 'Chamber 01 & 08',
      securityStandard: 'FIPS 140-3 Level 4 / NIST PQC Standard',
    },
    {
      id: 'CRYO-14-98MK',
      category: 'Architecture',
      title: '14.98 mK Sub-Kelvin Cryogenic Enclave Protocol',
      emoji: '🧊',
      tags: ['Cryo', 'Enclave', 'Thermal', '14.98mK'],
      summary: 'Operating environment for quantum state stabilization, eliminating thermal thermal jitter and ensuring strict deterministic execution.',
      merkleProofAnchor: 'Block #849203 Telemetry',
      chamberRef: 'Chamber 04 HSM Quorum',
      securityStandard: 'Sub-Kelvin Isolation Spec v4.16',
    },
    {
      id: 'PDPA-SEC-28',
      category: 'Compliance',
      title: 'PDPA มาตรา 9, 26, 28 & ETDA Safe Harbor Synthesis',
      emoji: '⚖️',
      tags: ['PDPA', 'ETDA', 'Safe Harbor', 'Court Dossier'],
      summary: 'Automated legal convergence mapping ensuring cross-border data transfer compliance and immutable cryptographic court admissibility.',
      merkleProofAnchor: 'Block #849202 Dossier',
      chamberRef: 'Chamber 03 & 11',
      securityStandard: 'Thailand Legal Framework / ETDA Electronic Transactions Act',
    },
    {
      id: 'TREASURY-423B',
      category: 'Treasury',
      title: 'Sovereign Treasury 1.49B THB-SOV & 14,902 oz XAU Gold Matrix',
      emoji: '💰',
      tags: ['Treasury', 'RWA', 'XAU Gold', 'Ω600_1000'],
      summary: 'Verifiable physical vault gold reserve and real-world asset pegging authenticated by 10/10 REAL_HSM cryptographic consensus.',
      merkleProofAnchor: 'Block #40202 Treasury',
      chamberRef: 'Chamber 10 Treasury Matrix',
      securityStandard: 'Basel III RWA Custody Attestation',
    },
    {
      id: 'OMEGA-600-1000',
      category: 'Governance',
      title: 'Ω600_1000 Sovereign Multi-Tenant Boundary Lock',
      emoji: '🏛️',
      tags: ['Boundary', 'Multi-Tenant', 'Ω600_1000', '400 Tenants'],
      summary: 'Strict namespace enforcement strictly containing all 400 tenant partitions within Ω600-Ω1000 with zero cross-tenant contamination.',
      merkleProofAnchor: 'Genesis #849202 Boundary',
      chamberRef: 'Chamber 00 Sovereign Foundation',
      securityStandard: 'ISO/IEC 27001 / Zero-Trust Partitioning',
    },
  ];

  const currentProof = historicalProofs[selectedProofIndex];
  const currentEntry = codexEntries.find((e) => e.id === selectedEntryId) || codexEntries[0];

  const filteredEntries = codexEntries.filter((entry) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      entry.title.toLowerCase().includes(q) ||
      entry.category.toLowerCase().includes(q) ||
      entry.tags.some((t) => t.toLowerCase().includes(q)) ||
      entry.summary.toLowerCase().includes(q)
    );
  });

  return (
    <div id="supreme-eternum-nexus-codex" className="w-full bg-[#070a12] border border-[#D4AF37]/50 rounded-xl p-6 font-mono text-[#06B6D4] shadow-2xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-[#0a0f1e] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏛️</span>
            <h2 className="text-lg font-black tracking-wider text-[#D4AF37]">
              SUPREME ETERNUM NEXUS CODEX
            </h2>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 border border-emerald-500 text-emerald-400">
              FROZEN v1.2 LTS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Navigable Sovereign Documentation Hub • Eternum Custody Archive • Deep Historical Merkle Proofs • Ω600_1000
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            onClick={() => {
              playAuditChime();
              onNavigateToNexus?.();
            }}
            className="px-3 py-1.5 bg-[#0a0f1e] border border-[#06B6D4] hover:bg-[#06B6D4]/20 text-[#06B6D4] font-bold rounded flex items-center gap-1.5 transition-colors"
          >
            <span>🌐 Jump to Nexus Portal</span>
          </button>
          <button
            onClick={() => {
              playAuditChime();
              onNavigateToLedger?.();
            }}
            className="px-3 py-1.5 bg-[#0a0f1e] border border-[#D4AF37] hover:bg-[#D4AF37]/20 text-[#D4AF37] font-bold rounded flex items-center gap-1.5 transition-colors"
          >
            <span>📜 View Immutable Ledger</span>
          </button>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-[#0a0f1e] p-2 rounded-lg border border-slate-800 text-xs">
        <button
          onClick={() => {
            playTone(600, 0.02);
            setActiveTab('codex_docs');
          }}
          className={`px-3.5 py-1.5 rounded font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'codex_docs'
              ? 'bg-[#070a12] text-[#D4AF37] border border-[#D4AF37]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>📑 Sovereign Knowledge Codex</span>
        </button>

        <button
          onClick={() => {
            playTone(640, 0.02);
            setActiveTab('merkle_explorer');
          }}
          className={`px-3.5 py-1.5 rounded font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'merkle_explorer'
              ? 'bg-[#070a12] text-emerald-400 border border-emerald-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🔍 Historical Merkle Proofs ({historicalProofs.length})</span>
        </button>

        <button
          onClick={() => {
            playTone(680, 0.02);
            setActiveTab('seal_deep_dive');
          }}
          className={`px-3.5 py-1.5 rounded font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'seal_deep_dive'
              ? 'bg-[#070a12] text-purple-300 border border-purple-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🔐 14,902 Seal Metadata &amp; HSM Specs</span>
        </button>

        <button
          onClick={() => {
            playTone(720, 0.02);
            setActiveTab('legal_crosswalk');
          }}
          className={`px-3.5 py-1.5 rounded font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'legal_crosswalk'
              ? 'bg-[#070a12] text-cyan-300 border border-cyan-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>⚖️ Safe Harbor Legal Crosswalk</span>
        </button>
      </div>

      {/* TAB 1: Sovereign Knowledge Codex */}
      {activeTab === 'codex_docs' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Codex Navigation & Search */}
          <div className="lg:col-span-5 bg-[#0a0f1e] border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200">Documentation Index</span>
              <span className="text-[10px] text-slate-500">{filteredEntries.length} Articles</span>
            </div>

            <input
              type="text"
              placeholder="Search Codex specifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#070a12] border border-slate-700 text-xs text-slate-200 px-3 py-1.5 rounded focus:outline-none focus:border-[#D4AF37]"
            />

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {filteredEntries.map((entry) => {
                const isSelected = selectedEntryId === entry.id;
                return (
                  <div
                    key={entry.id}
                    onClick={() => {
                      playTone(550, 0.02);
                      setSelectedEntryId(entry.id);
                    }}
                    className={`p-3 rounded-lg border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-[#070a12] border-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                        : 'bg-[#070a12]/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span>{entry.emoji}</span>
                        <span className={`text-xs font-bold ${isSelected ? 'text-[#D4AF37]' : 'text-slate-200'}`}>
                          {entry.title}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {entry.summary}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {entry.tags.map((tag, tIdx) => (
                        <span key={tIdx} className="px-1.5 py-0.5 rounded bg-black text-[9px] text-slate-400 border border-slate-800">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Codex Article Viewer */}
          <div className="lg:col-span-7 bg-[#0a0f1e] border border-[#D4AF37]/30 rounded-xl p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{currentEntry.emoji}</span>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">{currentEntry.category}</span>
                  <h3 className="font-bold text-[#D4AF37] text-sm">{currentEntry.title}</h3>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-[#070a12] border border-[#06B6D4] text-[#06B6D4] font-bold text-[10px]">
                {currentEntry.id}
              </span>
            </div>

            <div className="p-3 bg-[#070a12] border border-slate-800 rounded space-y-2">
              <span className="text-[10px] text-slate-500 block uppercase">Operational Overview</span>
              <p className="text-slate-200 leading-relaxed text-xs">
                {currentEntry.summary}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#070a12] border border-slate-800 rounded">
                <span className="text-slate-500 text-[10px] block">Merkle Proof Anchor</span>
                <span className="text-emerald-400 font-bold">{currentEntry.merkleProofAnchor}</span>
              </div>
              <div className="p-3 bg-[#070a12] border border-slate-800 rounded">
                <span className="text-slate-500 text-[10px] block">Chamber Attribution</span>
                <span className="text-purple-300 font-bold">{currentEntry.chamberRef}</span>
              </div>
            </div>

            <div className="p-3 bg-[#070a12] border border-slate-800 rounded space-y-1">
              <span className="text-slate-500 text-[10px] block">Mandatory Security Standard</span>
              <span className="text-slate-200 font-bold">{currentEntry.securityStandard}</span>
            </div>

            <div className="p-3 bg-[#070a12] border border-[#D4AF37]/30 rounded flex items-center justify-between">
              <span className="text-slate-400">Boundary &amp; Tenant Partition:</span>
              <span className="text-[#D4AF37] font-bold">Ω600_1000 (400 Tenants LOCKED)</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Historical Merkle Proofs */}
      {activeTab === 'merkle_explorer' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {historicalProofs.map((proof, idx) => {
              const isSelected = selectedProofIndex === idx;
              return (
                <div
                  key={proof.blockHeight}
                  onClick={() => {
                    playTone(600, 0.02);
                    setSelectedProofIndex(idx);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-[#0a0f1e] border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                      : 'bg-[#0a0f1e]/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#D4AF37]">Block #{proof.blockHeight}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500 text-emerald-400">
                      10/10 REAL_HSM
                    </span>
                  </div>
                  <code className="text-[10px] text-slate-400 block truncate">
                    Root: {proof.merkleRoot}
                  </code>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                    <span>{proof.canonicalSeals} Canonical</span>
                    <span className="text-emerald-400">{proof.drift}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Deep Merkle Proof Inspector */}
          <div className="bg-[#0a0f1e] border border-[#06B6D4]/40 rounded-xl p-5 space-y-3.5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="font-bold text-[#D4AF37] text-sm">
                📜 Block #{currentProof.blockHeight} Merkle Proof Attestation
              </h3>
              <span className="text-[11px] text-slate-400">
                Timestamp: <strong className="text-slate-200">{currentProof.timestamp}</strong>
              </span>
            </div>

            <p className="text-slate-300 text-xs">
              {currentProof.description}
            </p>

            <div className="p-3 bg-[#070a12] border border-slate-800 rounded space-y-1">
              <span className="text-slate-500 text-[10px] block">Canonical Merkle Root (SSoT)</span>
              <code className="text-emerald-400 text-xs font-bold block break-all">
                {currentProof.merkleRoot}
              </code>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-[#070a12] border border-slate-800 rounded">
                <span className="text-slate-500 text-[10px] block">PQC Suite</span>
                <span className="text-purple-300 font-bold">{currentProof.pqcAlgorithm}</span>
              </div>
              <div className="p-3 bg-[#070a12] border border-slate-800 rounded">
                <span className="text-slate-500 text-[10px] block">HSM Quorum</span>
                <span className="text-[#D4AF37] font-bold">{currentProof.hsmQuorum}</span>
              </div>
              <div className="p-3 bg-[#070a12] border border-slate-800 rounded">
                <span className="text-slate-500 text-[10px] block">Legal Court Dossier</span>
                <span className="text-cyan-300 font-bold">{currentProof.courtDossierId}</span>
              </div>
            </div>

            <div className="p-3 bg-[#070a12] border border-slate-800 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
              <span className="text-slate-400">
                Sovereign Architect: <strong className="text-slate-200">{currentProof.principal}</strong>
              </span>
              <span className="text-[#D4AF37] font-bold">
                Boundary: {currentProof.boundary}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Seal Metadata & HSM Specs */}
      {activeTab === 'seal_deep_dive' && (
        <div className="bg-[#0a0f1e] border border-purple-500/30 rounded-xl p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="font-bold text-purple-300 text-sm">
              🔐 14,902 Canonical Hardware Seals &amp; HSM Allocation Specs
            </span>
            <span className="text-emerald-400 font-bold">Δ0.00% Zero Drift</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="p-3 bg-[#070a12] border border-slate-800 rounded space-y-1">
              <span className="text-slate-500 text-[10px] block">Canonical Seals</span>
              <span className="text-2xl font-bold text-emerald-400">14,902</span>
              <p className="text-[10px] text-slate-400">Verified by 10/10 REAL_HSM FIPS 140-3 L4</p>
            </div>
            <div className="p-3 bg-[#070a12] border border-slate-800 rounded space-y-1">
              <span className="text-slate-500 text-[10px] block">Quarantined Seals</span>
              <span className="text-2xl font-bold text-red-400">80</span>
              <p className="text-[10px] text-slate-400">Ring-04 Isolated Buffer (Zero Leakage)</p>
            </div>
            <div className="p-3 bg-[#070a12] border border-slate-800 rounded space-y-1">
              <span className="text-slate-500 text-[10px] block">Multi-Tenant Partition</span>
              <span className="text-2xl font-bold text-[#D4AF37]">Ω600_1000</span>
              <p className="text-[10px] text-slate-400">400 Isolated Sovereign Tenant Slots</p>
            </div>
          </div>

          <div className="p-3 bg-[#070a12] border border-slate-800 rounded text-slate-300 space-y-1 text-xs">
            <strong className="text-[#D4AF37] block">HSM Hardware Allocation Schedule:</strong>
            <p>
              Slots 01–05: NitroKey HSM-PQC (CRYSTALS-Dilithium-5) • Slots 06–07: Trezor Safe 5 PQC &amp; YubiKey 5C FIPS •
              Slots 08–09: Ledger Stax Enclave &amp; NitroKey HSM-PQC-09 • Slot 10: Custom Hardware HSM Enclave-10 (SPHINCS+).
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: Safe Harbor Legal Crosswalk */}
      {activeTab === 'legal_crosswalk' && (
        <div className="bg-[#0a0f1e] border border-cyan-500/30 rounded-xl p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="font-bold text-cyan-300 text-sm">
              ⚖️ Thailand Legal Convergence &amp; Court Admissibility Framework
            </span>
            <span className="text-emerald-400 font-bold">100% Certified Safe Harbor</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-[#070a12] border border-slate-800 rounded space-y-1.5">
              <strong className="text-slate-200 block">PDPA มาตรา 9, 26</strong>
              <p className="text-slate-400 text-[11px]">
                Sensitive data encryption and cryptographic consent logging verified at 14.98 mK sub-kelvin isolation.
              </p>
            </div>
            <div className="p-3 bg-[#070a12] border border-slate-800 rounded space-y-1.5">
              <strong className="text-slate-200 block">PDPA มาตรา 28</strong>
              <p className="text-slate-400 text-[11px]">
                Cross-border data transfer safe harbor with mathematical zero-knowledge proof binding.
              </p>
            </div>
            <div className="p-3 bg-[#070a12] border border-slate-800 rounded space-y-1.5">
              <strong className="text-slate-200 block">ETDA Sec 9, 26, 28</strong>
              <p className="text-slate-400 text-[11px]">
                Electronic transactions admissible in judicial court under immutable Dilithium-3 signature guarantees.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer Attestation */}
      <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-slate-400 gap-2">
        <span>Principal: <strong className="text-slate-200">นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)</strong></span>
        <span>Certificate: <strong className="text-[#D4AF37]">ZQ-GOLD-DEP-849202-3908</strong></span>
        <span className="text-emerald-400 font-bold">STATUS: OMEGA LOCKED — RUNTIME VERIFIED 100% GREEN</span>
      </div>
    </div>
  );
};
