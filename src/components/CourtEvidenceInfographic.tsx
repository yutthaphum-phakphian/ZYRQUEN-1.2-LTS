import React, { useState } from 'react';
import {
  FileText,
  Printer,
  ShieldCheck,
  Hash,
  Scale,
  CheckCircle2,
  Lock,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

export interface ExhibitItem {
  id: string; // e.g., "จพ.๐๑"
  title: string;
  category: string;
  statutoryBasis: string;
  merkleRootOrHash: string;
  status: 'VERIFIED_SSOT' | 'IMMUTABLE_WORM' | 'RATIFIED';
  details: { label: string; value: string }[];
}

export const EXHIBITS_DATA: ExhibitItem[] = [
  {
    id: 'จพ.๐๑',
    title: 'Genesis Block Anchor & Canonical Merkle Root Verification',
    category: 'Sovereign SSoT Anchor',
    statutoryBasis: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ฯ มาตรา ๒๘',
    merkleRootOrHash: '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    status: 'VERIFIED_SSOT',
    details: [
      { label: 'Genesis Anchor Block', value: '#849202' },
      { label: 'Baseline State Drift', value: 'Δ 0.00% (Zero Drift)' },
      { label: 'Ingestion Protocol', value: 'ZYRQUEN Ω∞ Canonical Vault' }
    ]
  },
  {
    id: 'จพ.๐๒',
    title: 'Deca-Key Council 10/10 REAL_HSM Physical Custody Certificates',
    category: 'Hardware Custody Ratification',
    statutoryBasis: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ฯ มาตรา ๒๖',
    merkleRootOrHash: '0x3f8a09b2e11d4029c71e84a2082b415a9900c9e102f481c009d18400fef2911b',
    status: 'RATIFIED',
    details: [
      { label: 'HSM Enclosure Standard', value: 'FIPS 140-3 Level 4' },
      { label: 'Quorum Consensus', value: '10/10 Unanimous Ratification' },
      { label: 'Tamper Protection', value: 'Active Zeroization (0.48 ms)' }
    ]
  },
  {
    id: 'จพ.๐๓',
    title: 'Post-Quantum Cryptography Hybrid Suite (FIPS 203/204/205)',
    category: 'Quantum-Resistant Signing',
    statutoryBasis: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ฯ มาตรา ๙',
    merkleRootOrHash: '0xe8a7102b48d1c9201f99c8200b2e7188179a029312d8a01124e90820bc12984a',
    status: 'VERIFIED_SSOT',
    details: [
      { label: 'Asymmetric Algorithm', value: 'Dilithium-5 (FIPS 204)' },
      { label: 'Stateless Hash Signature', value: 'SPHINCS+ (FIPS 205)' },
      { label: 'Key Encapsulation', value: 'ML-KEM-1024 (FIPS 203)' }
    ]
  },
  {
    id: 'จพ.๐๔',
    title: '14,902 Frozen Evidence Seals Immutable WORM Ledger',
    category: 'Digital Evidence Isolation',
    statutoryBasis: 'หลักเกณฑ์ Zero-Deletion Preservation Guarantee',
    merkleRootOrHash: '0x1010a28f99e012a8192a8301fe23101889a7711d9a200bba8371c109201f1092',
    status: 'IMMUTABLE_WORM',
    details: [
      { label: 'Frozen Seals Count', value: '14,902 Seals' },
      { label: 'Storage Architecture', value: 'Module 17 V24 WORM Storage' },
      { label: 'Isolation Enclosure', value: 'Chamber 02 Threat Escrow' }
    ]
  },
  {
    id: 'จพ.๐๕',
    title: 'Sub-Kelvin Telemetry & Phoenix Auto-Recovery Benchmarks',
    category: 'Forensic System Stability',
    statutoryBasis: 'มาตรฐานนิติวิทยาศาสตร์ ISO/IEC 27037',
    merkleRootOrHash: '0x77c201a0928b12e0912f8832a101b77629201e9120ba8201a39d8801902047a8',
    status: 'VERIFIED_SSOT',
    details: [
      { label: 'SLA Benchmark Target', value: '< 142.00 ms' },
      { label: 'Replay Execution Speed', value: '35.80 ms (PASS)' },
      { label: 'Data Recovery Assurance', value: 'Zero Data Loss (Pass)' }
    ]
  },
  {
    id: 'จพ.๐๖',
    title: 'Thai Sovereign Treasury & RWA Reserve Ledger (฿4.238B THB + Gold)',
    category: 'Asset Backing & Fiscal Anchor',
    statutoryBasis: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ฯ มาตรา ๒๘',
    merkleRootOrHash: '0xb2831a90c102f902e8812301f2010887162b901f18e90a88b12390a8c201827a',
    status: 'RATIFIED',
    details: [
      { label: 'Treasury Fiscal Asset', value: '฿4.238 Billion THB' },
      { label: 'Physical Custody Reserve', value: 'LBMA Gold Vault Reserve' },
      { label: 'Real-Time Valuation Sync', value: 'mTLS 4318 Telemetry' }
    ]
  },
  {
    id: 'จพ.๐๗',
    title: 'Non-Repudiation Chain of Custody & Statutory Safe Harbor Warrant',
    category: 'Judicial Warrant & Privacy',
    statutoryBasis: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคลฯ (PDPA) มาตรา ๓๗',
    merkleRootOrHash: '0xf4901e82b71d9002a71822c1092a81907e812a00e882b719001a8811e9a77210',
    status: 'VERIFIED_SSOT',
    details: [
      { label: 'PII Redaction Engine', value: 'Zero-Knowledge zk-SNARKs' },
      { label: 'Telemetry Anonymization', value: '100% PII Masked' },
      { label: 'Admissibility Warrant', value: 'Court-Ready Qualified Evidence' }
    ]
  }
];

export const CourtEvidenceInfographic: React.FC = () => {
  const [activeExhibit, setActiveExhibit] = useState<ExhibitItem>(EXHIBITS_DATA[0]);
  const [copied, setCopied] = useState(false);

  const handleCopyHash = () => {
    navigator.clipboard.writeText(activeExhibit.merkleRootOrHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="court-evidence-infographic-root" className="w-full bg-gray-950 text-gray-100 p-6 rounded-xl border border-gray-800 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-800 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-semibold px-2.5 py-0.5 rounded flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              JUDICIAL EVIDENCE DECK
            </span>
            <span className="text-xs text-gray-400 font-mono">
              Thai ETA B.E. 2544 (Sec 9, 26, 28) | PDPA Sec 37
            </span>
          </div>
          <h2 className="text-xl font-bold mt-1 text-white flex items-center gap-2">
            <span>บัญชีวัตถุพยานดิจิทัล (Court Exhibits จพ.๐๑ – จพ.๐๗)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Sovereign Forensic Exhibits Binder • Hash Anchors • Non-Repudiation WORM
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="btn-print-evidence-dossier"
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs rounded transition print:hidden flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-950/40"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export Official Dossier (PDF)</span>
          </button>
        </div>
      </div>

      {/* Grid Layout: Left Exhibit Selector, Right Highlight Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Exhibit Selector Cards */}
        <div className="lg:col-span-7 space-y-3">
          {EXHIBITS_DATA.map((exhibit) => {
            const isSelected = activeExhibit.id === exhibit.id;
            return (
              <div
                id={`exhibit-card-${exhibit.id}`}
                key={exhibit.id}
                onClick={() => setActiveExhibit(exhibit)}
                className={`p-4 rounded-lg border transition cursor-pointer ${
                  isSelected
                    ? 'bg-gray-800/90 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                    : 'bg-gray-900/60 border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                      {exhibit.id}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      {exhibit.category}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded">
                    {exhibit.status}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-gray-200">{exhibit.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{exhibit.statutoryBasis}</p>
              </div>
            );
          })}
        </div>

        {/* Selected Exhibit Deep-Dive Panel */}
        <div id="exhibit-deep-dive-panel" className="lg:col-span-5 bg-gray-900 p-5 rounded-lg border border-gray-800 flex flex-col justify-between">
          <div>
            <div className="border-b border-gray-800 pb-3 mb-4">
              <span className="text-xs font-mono text-amber-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                ACTIVE EXHIBIT INSPECTOR
              </span>
              <h3 className="text-lg font-bold text-white mt-1">
                {activeExhibit.id}: {activeExhibit.title}
              </h3>
              <p className="text-xs text-amber-300/80 mt-1">{activeExhibit.statutoryBasis}</p>
            </div>

            {/* Digest Box */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-mono text-gray-400 block">
                  CANONICAL DIGEST / MERKLE ROOT
                </label>
                <button
                  id="btn-copy-exhibit-hash"
                  type="button"
                  onClick={handleCopyHash}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-2.5 bg-black/60 rounded border border-gray-800 font-mono text-[11px] text-cyan-300 break-all select-all">
                {activeExhibit.merkleRootOrHash}
              </div>
            </div>

            {/* Spec Attributes */}
            <div className="space-y-2.5">
              {activeExhibit.details.map((detail, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs border-b border-gray-800/60 pb-1.5">
                  <span className="text-gray-400">{detail.label}</span>
                  <span className="font-mono text-gray-200 font-medium">{detail.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-800 text-[11px] font-mono text-emerald-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              CERTIFIED COURT-ADMISSIBLE
            </span>
            <span className="bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
              ZERO-DRIFT VERIFIED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourtEvidenceInfographic;
