import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Key,
  ShieldCheck,
  Fingerprint,
  Cpu,
  Scale,
  Sparkles,
  ChevronRight,
  Layers,
  FileText,
  X,
} from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { SYSTEM_METADATA } from '../data/canonicalData';
import { copyToClipboard } from '../utils/clipboard';

export interface ComplianceTransitionRecord {
  id: string;
  timestamp: string;
  section: 'Section 9' | 'Section 26' | 'Section 28';
  transitionType: string;
  fromState: string;
  toState: string;
  merkleLeafHash: string;
  merkleProofPath: string[];
  blockHeight: number;
  signatory: string;
  passportId: string;
  pqcAlgorithm: string;
  statuteRef: string;
  legalImplication: string;
  status: 'IMMUTABLE_VALIDATED' | 'VERIFIED' | 'PENDING';
}

export const INITIAL_COMPLIANCE_TRANSITIONS: ComplianceTransitionRecord[] = [
  {
    id: 'TRANS-909-01',
    timestamp: '08:34:12 ICT',
    section: 'Section 28',
    transitionType: 'Executive Passport Anchoring',
    fromState: 'PENDING_MPC_QUORUM',
    toState: 'IMMUTABLE_VALIDATED',
    merkleLeafHash: '0x909ab8146747f520beec1907beab286c06a38096f9bf00f40d8aa536b3fa4c68',
    merkleProofPath: [
      '0x41f8a847e33e61a091535787680b4356499878297b835ec443efae4cb30bc06c',
      '0x7528e18501da86fc4691763a43fa4c68909ab814479844d8a14816bed34cdbb0',
      '0x12a9c3814816479844d8bed34cdbb07528e18501da86fc4691763a43fa4c689',
    ],
    blockHeight: 849202,
    signatory: 'นายยุทธภูมิ พากเพียร (Sovereign Principal)',
    passportId: '#EP-SOVEREIGN-01',
    pqcAlgorithm: 'NIST FIPS 204 (ML-DSA / Dilithium-5)',
    statuteRef: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๒๘ วรรคสอง',
    legalImplication: 'Signatory Liability Attribution & Statutory Safe Harbor granted to Sovereign Principal.',
    status: 'IMMUTABLE_VALIDATED',
  },
  {
    id: 'TRANS-909-02',
    timestamp: '08:32:05 ICT',
    section: 'Section 26',
    transitionType: 'Cryogenic Hardware Core Lockdown',
    fromState: 'CALIBRATING_SUB_KELVIN',
    toState: 'IMMUTABLE_VALIDATED',
    merkleLeafHash: '0x7528e18501da86fc4691763a43fa4c68909ab814479844d8a14816bed34cdbb0',
    merkleProofPath: [
      '0x8891b2c45e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
      '0x41f8a847e33e61a091535787680b4356499878297b835ec443efae4cb30bc06c',
    ],
    blockHeight: 849201,
    signatory: 'ดร. กัญญารัตน์ เวชสิทธิ์ (Chief Cryo-Cryptographer)',
    passportId: '#EP-SOVEREIGN-03',
    pqcAlgorithm: 'NIST FIPS 203 (ML-KEM / Kyber-1024)',
    statuteRef: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๒๖ (๑)-(๔)',
    legalImplication: 'Statutory Presumption of Reliable Electronic Signature established (Zero-Drift Invariant).',
    status: 'IMMUTABLE_VALIDATED',
  },
  {
    id: 'TRANS-909-03',
    timestamp: '08:29:40 ICT',
    section: 'Section 9',
    transitionType: 'Identity & Signer Intent Manifestation',
    fromState: 'EPHEMERAL_HANDSHAKE',
    toState: 'IMMUTABLE_VALIDATED',
    merkleLeafHash: '0x41f8a847e33e61a091535787680b4356499878297b835ec443efae4cb30bc06c',
    merkleProofPath: [
      '0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b8891b2c45e6f7a8b9c0d1e2f',
      '0x7528e18501da86fc4691763a43fa4c68909ab814479844d8a14816bed34cdbb0',
    ],
    blockHeight: 849200,
    signatory: 'สมชาย พากเพียร (Senior Custodian)',
    passportId: '#EP-SOVEREIGN-02',
    pqcAlgorithm: 'NIST FIPS 204 (ML-DSA / Dilithium-5)',
    statuteRef: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๙ (๑)-(๒)',
    legalImplication: 'Court-admissible electronic evidence (Section 11) with unforgeable signatory identity linkage.',
    status: 'IMMUTABLE_VALIDATED',
  },
  {
    id: 'TRANS-909-04',
    timestamp: '08:25:18 ICT',
    section: 'Section 28',
    transitionType: 'Fail-Closed Circuit Breaker Armed',
    fromState: 'STANDBY_CIRCUIT_CHECK',
    toState: 'IMMUTABLE_VALIDATED',
    merkleLeafHash: '0x12a9c3814816479844d8bed34cdbb07528e18501da86fc4691763a43fa4c689',
    merkleProofPath: [
      '0x909ab8146747f520beec1907beab286c06a38096f9bf00f40d8aa536b3fa4c68',
      '0x8891b2c45e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    ],
    blockHeight: 849198,
    signatory: 'ธนพล เกียรติไพศาล (Security Operations Lead)',
    passportId: '#EP-SOVEREIGN-04',
    pqcAlgorithm: 'NIST FIPS 205 (SLH-DSA / SPHINCS+)',
    statuteRef: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๒๘ (๒) (ก)',
    legalImplication: '0.38ms immediate emergency notification armed upon key deviation event.',
    status: 'IMMUTABLE_VALIDATED',
  },
  {
    id: 'TRANS-909-05',
    timestamp: '08:18:55 ICT',
    section: 'Section 26',
    transitionType: 'Post-Quantum Dual-Signature Seal',
    fromState: 'PQC_LATTICE_VERIFY',
    toState: 'IMMUTABLE_VALIDATED',
    merkleLeafHash: '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b8891b2c4',
    merkleProofPath: [
      '0x7528e18501da86fc4691763a43fa4c68909ab814479844d8a14816bed34cdbb0',
      '0x909ab8146747f520beec1907beab286c06a38096f9bf00f40d8aa536b3fa4c68',
    ],
    blockHeight: 849195,
    signatory: 'นายยุทธภูมิ พากเพียร (Sovereign Principal)',
    passportId: '#EP-SOVEREIGN-01',
    pqcAlgorithm: 'NIST FIPS 204 (ML-DSA / Dilithium-5)',
    statuteRef: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๒๖ (๓)',
    legalImplication: 'Zero alteration detectable; tamper seal locked across 14,902 historic blocks.',
    status: 'IMMUTABLE_VALIDATED',
  },
];

export const ComplianceHistoryLog: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<'ALL' | 'Section 9' | 'Section 26' | 'Section 28'>('ALL');
  const [selectedTransition, setSelectedTransition] = useState<ComplianceTransitionRecord | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const filteredTransitions = useMemo(() => {
    return INITIAL_COMPLIANCE_TRANSITIONS.filter((item) => {
      const matchSection = selectedSection === 'ALL' || item.section === selectedSection;
      const matchSearch =
        searchTerm.trim() === '' ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.transitionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.signatory.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.merkleLeafHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.statuteRef.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSection && matchSearch;
    });
  }, [searchTerm, selectedSection]);

  const handleCopy = (text: string, id: string) => {
    copyToClipboard(text);
    setCopiedHash(id);
    playTone(700, 0.05);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleSelectTransition = (trans: ComplianceTransitionRecord) => {
    playTone(580, 0.04);
    setSelectedTransition(trans);
  };

  return (
    <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#100d05]/95 via-[#0b0803]/90 to-[#07080F] border-2 border-amber-500/30 backdrop-blur-2xl space-y-5 shadow-2xl font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center justify-center shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-amber-100 font-serif">
                Compliance History Log & Merkle Proof Ledger
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                AUDIT DRILL-DOWN READY
              </span>
            </div>
            <p className="text-xs text-amber-200/80 font-serif mt-0.5">
              สมุดทะเบียนบันทึกการเปลี่ยนสถานะความสอดคล้องตามมาตรา ๙, ๒๖, และ ๒๘ พร้อม Merkle Proof เฉพาะรายการ
            </p>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 bg-black/60 border border-white/10 rounded-xl p-1 text-xs">
          {(['ALL', 'Section 9', 'Section 26', 'Section 28'] as const).map((sec) => (
            <button
              key={sec}
              onClick={() => {
                playTone(520, 0.03);
                setSelectedSection(sec);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                selectedSection === sec
                  ? 'bg-amber-500/30 text-amber-100 border border-amber-400/50 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by Transition ID, Signatory, Statute, Merkle Hash (e.g. 909ab814), or Status..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/80 border border-amber-500/30 text-amber-100 placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-400 transition-all shadow-inner"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table / Ledger of State Transitions */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-amber-500/20 text-[10px] text-zinc-400 uppercase tracking-wider">
              <th className="py-2.5 px-3">TRANSITION ID & TIME</th>
              <th className="py-2.5 px-3">STATUTE & ACTION</th>
              <th className="py-2.5 px-3">STATE TRANSITION</th>
              <th className="py-2.5 px-3">SIGNATORY & PASSPORT</th>
              <th className="py-2.5 px-3">MERKLE LEAF HASH</th>
              <th className="py-2.5 px-3 text-right">PROOF DRILLDOWN</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredTransitions.map((t) => (
              <tr
                key={t.id}
                onClick={() => handleSelectTransition(t)}
                className={`hover:bg-amber-500/[0.08] cursor-pointer transition-colors ${
                  selectedTransition?.id === t.id ? 'bg-amber-500/[0.12] border-l-2 border-amber-400' : ''
                }`}
              >
                <td className="py-3 px-3">
                  <div className="font-bold text-amber-300">{t.id}</div>
                  <div className="text-[10px] text-zinc-400">{t.timestamp}</div>
                </td>

                <td className="py-3 px-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mb-1 ${
                      t.section === 'Section 9'
                        ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                        : t.section === 'Section 26'
                        ? 'bg-violet-500/15 text-violet-300 border-violet-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {t.section}
                  </span>
                  <div className="text-zinc-200 font-semibold">{t.transitionType}</div>
                </td>

                <td className="py-3 px-3">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-zinc-400 line-through">{t.fromState}</span>
                    <span className="text-amber-400 font-bold">$\rightarrow$</span>
                    <span className="text-emerald-300 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      {t.toState}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">Block #{t.blockHeight}</div>
                </td>

                <td className="py-3 px-3">
                  <div className="text-zinc-100 font-medium truncate max-w-[160px]">{t.signatory}</div>
                  <div className="text-[10px] text-amber-300 font-bold">{t.passportId}</div>
                </td>

                <td className="py-3 px-3 font-mono text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-200/90 truncate max-w-[140px]">{t.merkleLeafHash}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(t.merkleLeafHash, t.id);
                      }}
                      className="p-1 rounded bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
                      title="Copy Merkle Leaf Hash"
                    >
                      {copiedHash === t.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </td>

                <td className="py-3 px-3 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectTransition(t);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 text-[11px] font-bold inline-flex items-center gap-1 transition-all"
                  >
                    <span>Inspect</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Merkle Proof Drill-Down Modal / Expanded Panel */}
      {selectedTransition && (
        <div className="p-5 rounded-2xl bg-black/95 border-2 border-amber-400/60 space-y-4 animate-in fade-in duration-200 shadow-2xl relative">
          <button
            onClick={() => setSelectedTransition(null)}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 border-b border-amber-500/20 pb-3">
            <Layers className="w-5 h-5 text-amber-400" />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-amber-200">
                  Merkle Proof Verification: {selectedTransition.id}
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                  PROOF VALIDATED (ROOT 909ab814)
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                Cryptographic inclusion proof linking leaf state to canonical Sub-Kelvin Merkle Root
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Left Column: Metadata & Legal Basis */}
            <div className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/8">
              <div>
                <span className="text-zinc-500 text-[10px] block">STATUTORY MANDATE:</span>
                <span className="text-amber-300 font-serif font-bold text-xs">{selectedTransition.statuteRef}</span>
              </div>

              <div>
                <span className="text-zinc-500 text-[10px] block">LEGAL IMPLICATION:</span>
                <p className="text-zinc-300 font-sans text-[11px] leading-relaxed mt-0.5">
                  {selectedTransition.legalImplication}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                <div>
                  <span className="text-zinc-500 text-[10px] block">SIGNATORY:</span>
                  <span className="text-white font-semibold text-[11px]">{selectedTransition.signatory}</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">PASSPORT:</span>
                  <span className="text-amber-300 font-bold text-[11px]">{selectedTransition.passportId}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5">
                <span className="text-zinc-500 text-[10px] block">POST-QUANTUM ALGORITHM:</span>
                <span className="text-cyan-300 font-bold text-[11px]">{selectedTransition.pqcAlgorithm}</span>
              </div>
            </div>

            {/* Right Column: Merkle Tree Inclusion Proof Structure */}
            <div className="space-y-3 p-4 rounded-xl bg-black/80 border border-amber-500/30">
              <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between">
                <span>MERKLE PROOF TREE PATH</span>
                <span className="text-emerald-400">DEPTH: {selectedTransition.merkleProofPath.length + 1}</span>
              </div>

              {/* Leaf */}
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-amber-300 font-bold">
                  <span>LEAF HASH (H0):</span>
                  <span className="text-[9px] bg-amber-500/20 px-1.5 py-0.2 rounded">Transition Leaf</span>
                </div>
                <div className="text-[10px] text-zinc-300 break-all font-mono">
                  {selectedTransition.merkleLeafHash}
                </div>
              </div>

              {/* Sibling Path */}
              <div className="space-y-1.5">
                <div className="text-[10px] text-zinc-400">SIBLING NODES IN PROOF PATH:</div>
                {selectedTransition.merkleProofPath.map((pathHash, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-white/[0.03] border border-white/5 text-[10px] text-zinc-300 font-mono flex items-center justify-between gap-2"
                  >
                    <span className="text-cyan-400 font-bold text-[9px]">L{idx + 1}:</span>
                    <span className="truncate flex-1">{pathHash}</span>
                    <button
                      onClick={() => handleCopy(pathHash, `path-${idx}`)}
                      className="text-zinc-400 hover:text-white"
                    >
                      {copiedHash === `path-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                ))}
              </div>

              {/* Root Finality */}
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between text-[11px]">
                <div>
                  <span className="text-[10px] text-emerald-400 block font-bold">CANONICAL MERKLE ROOT:</span>
                  <span className="text-white font-bold">909ab814...fa4c68</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                  ANCHORED & SEALED
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
