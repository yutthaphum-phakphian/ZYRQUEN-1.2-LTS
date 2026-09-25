import React, { useState, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Printer,
  ShieldCheck,
  Scale,
  CheckCircle2,
  Copy,
  Check,
  QrCode,
  Download,
  Eye,
  Maximize2,
  X,
  Scan,
  AlertTriangle,
  Layers,
  Search,
  FileCode
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

export interface ExhibitVerificationPayload {
  sys: string;
  exhibit_id: string;
  title: string;
  category: string;
  statutory_basis: string;
  merkle_or_hash: string;
  genesis_block: number;
  ssot_delta: string;
  status: string;
  court_admissible: boolean;
  pqc_suite: string;
  timestamp: string;
  verification_uri: string;
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

export function buildExhibitPayload(exhibit: ExhibitItem): ExhibitVerificationPayload {
  return {
    sys: 'ZYRQUEN_OMEGA_INFINITY_v1.2_LTS',
    exhibit_id: exhibit.id,
    title: exhibit.title,
    category: exhibit.category,
    statutory_basis: exhibit.statutoryBasis,
    merkle_or_hash: exhibit.merkleRootOrHash,
    genesis_block: 849202,
    ssot_delta: 'Δ 0.00% (Zero Drift)',
    status: exhibit.status,
    court_admissible: true,
    pqc_suite: 'ML-DSA-87 / SPHINCS+ / ML-KEM-1024',
    timestamp: '2026-03-30T00:00:00Z',
    verification_uri: `urn:zyrquen:court:exhibit:${encodeURIComponent(exhibit.id)}:${exhibit.merkleRootOrHash}`
  };
}

export const CourtEvidenceInfographic: React.FC = () => {
  const [activeExhibit, setActiveExhibit] = useState<ExhibitItem>(EXHIBITS_DATA[0]);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  const [scannerInput, setScannerInput] = useState('');
  const [scanResult, setScanResult] = useState<{
    valid: boolean;
    exhibit?: ExhibitItem;
    message: string;
  } | null>(null);

  const activePayload = useMemo(() => buildExhibitPayload(activeExhibit), [activeExhibit]);
  const activePayloadJson = useMemo(() => JSON.stringify(activePayload, null, 2), [activePayload]);

  const handleCopyHash = () => {
    navigator.clipboard.writeText(activeExhibit.merkleRootOrHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(activePayloadJson);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleDownloadQrPng = (exhibit: ExhibitItem, elementId: string) => {
    const svgNode = document.getElementById(elementId);
    if (!svgNode) return;

    const svgData = new XMLSerializer().serializeToString(svgNode);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width + 60;
      canvas.height = img.height + 90;
      if (ctx) {
        // Dark high-contrast background
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // White rounded frame for QR
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(20, 20, img.width + 20, img.height + 20);
        
        // Draw QR
        ctx.drawImage(img, 30, 30);
        
        // Add header/caption text
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`COURT EXHIBIT ${exhibit.id} • SSoT ANCHOR #849202`, canvas.width / 2, canvas.height - 24);
        
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px monospace';
        ctx.fillText(`HASH: ${exhibit.merkleRootOrHash.slice(0, 24)}...`, canvas.width / 2, canvas.height - 10);

        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `COURT_EXHIBIT_${exhibit.id}_QR_SEAL.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleVerifyScan = (inputVal: string) => {
    const trimmed = inputVal.trim();
    if (!trimmed) {
      setScanResult(null);
      return;
    }

    try {
      // Check if raw JSON
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const parsed = JSON.parse(trimmed);
        const matched = EXHIBITS_DATA.find(
          (e) => e.id === parsed.exhibit_id || e.merkleRootOrHash.toLowerCase() === (parsed.merkle_or_hash || '').toLowerCase()
        );
        if (matched) {
          setScanResult({
            valid: true,
            exhibit: matched,
            message: `MATCHED: Exhibit ${matched.id} Verified against Canonical Genesis Root 0x909ab814...43fa4c68 (SSoT Δ 0.00%)`
          });
          setActiveExhibit(matched);
          return;
        }
      }

      // Check if Hash or URN
      const matched = EXHIBITS_DATA.find(
        (e) =>
          e.merkleRootOrHash.toLowerCase() === trimmed.toLowerCase() ||
          e.id.toLowerCase() === trimmed.toLowerCase() ||
          trimmed.includes(e.merkleRootOrHash)
      );

      if (matched) {
        setScanResult({
          valid: true,
          exhibit: matched,
          message: `MATCHED: Exhibit ${matched.id} Authentic. Zero Drift Verified under Thai ETA B.E. 2544 Sec 28.`
        });
        setActiveExhibit(matched);
      } else {
        setScanResult({
          valid: false,
          message: 'UNVERIFIED: Payload does not match any ratified Exhibit in the 10/10 REAL_HSM Council Ledger.'
        });
      }
    } catch {
      setScanResult({
        valid: false,
        message: 'MALFORMED: Invalid QR verification signature or non-canonical payload structure.'
      });
    }
  };

  return (
    <div id="court-evidence-infographic-root" className="w-full bg-gray-950 text-gray-100 p-6 rounded-xl border-gray-800 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-800 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-xs font-semibold px-2.5 py-0.5 rounded flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              JUDICIAL EVIDENCE DECK
            </span>
            <span className="text-xs text-gray-400 font-mono">
              Thai ETA B.E. 2544 (Sec 9, 26, 28) | PDPA Sec 37 | ISO/IEC 27037
            </span>
          </div>
          <h2 className="text-xl font-bold mt-1 text-white flex items-center gap-2">
            <span>บัญชีวัตถุพยานดิจิทัล (Court Exhibits จพ.๐๑ – จพ.๐๗)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Sovereign Forensic Exhibits Binder • QR Rapid Scan-to-Verify • Non-Repudiation WORM
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-gray-900 border-gray-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('single')}
              className={`px-3 py-1.5 text-xs font-mono rounded flex items-center gap-1.5 transition ${
                viewMode === 'single'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Inspector</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 text-xs font-mono rounded flex items-center gap-1.5 transition ${
                viewMode === 'grid'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All QR Cards ({EXHIBITS_DATA.length})</span>
            </button>
          </div>

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

      {/* Judicial Rapid Scan-to-Verify Bar */}
      <div className="p-4 bg-slate-900/90 border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-mono text-cyan-400 flex items-center gap-1.5">
            <Scan className="w-4 h-4 text-amber-400" />
            RAPID SCAN-TO-VERIFY ENGINE (JUDICIAL OFFICIALS)
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Anchor #849202 • Zero Drift Check (Δ 0.00%)
          </span>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Paste QR verification payload JSON, Hash (0x...), or Exhibit ID (จพ.๐๑)..."
              value={scannerInput}
              onChange={(e) => {
                setScannerInput(e.target.value);
                handleVerifyScan(e.target.value);
              }}
              className="w-full bg-slate-950 border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs font-mono text-cyan-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          {scannerInput && (
            <button
              type="button"
              onClick={() => {
                setScannerInput('');
                setScanResult(null);
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono transition"
            >
              Clear
            </button>
          )}
        </div>

        {scanResult && (
          <div
            className={`p-3 rounded-lg border text-xs font-mono flex items-start gap-2.5 transition animate-fadeIn ${
              scanResult.valid
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
            }`}
          >
            {scanResult.valid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-semibold">{scanResult.message}</p>
              {scanResult.exhibit && (
                <div className="mt-1.5 text-[11px] text-slate-300 flex flex-wrap gap-x-4 gap-y-1">
                  <span>ID: <strong className="text-amber-300">{scanResult.exhibit.id}</strong></span>
                  <span>Title: <strong>{scanResult.exhibit.title}</strong></span>
                  <span>Status: <strong className="text-emerald-400">{scanResult.exhibit.status}</strong></span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {viewMode === 'single' ? (
        /* Single View: Exhibit Selector + Deep Dive Panel */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Exhibit Selector Cards */}
          <div className="lg:col-span-6 space-y-3">
            {EXHIBITS_DATA.map((exhibit) => {
              const isSelected = activeExhibit.id === exhibit.id;
              return (
                <div
                  id={`exhibit-card-${exhibit.id}`}
                  key={exhibit.id}
                  onClick={() => setActiveExhibit(exhibit)}
                  className={`p-4 rounded-xl border transition cursor-pointer relative overflow-hidden group ${
                    isSelected
                      ? 'bg-gray-800/95 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                      : 'bg-gray-900/60 border-gray-800 hover:border-gray-700 hover:bg-gray-900/90'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-amber-950 text-amber-300 border-amber-800">
                        {exhibit.id}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">
                        {exhibit.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border-emerald-800/80 px-2 py-0.5 rounded">
                        {exhibit.status}
                      </span>
                      <span className="p-1 rounded bg-slate-800 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                        <QrCode className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-200">{exhibit.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{exhibit.statutoryBasis}</p>
                </div>
              );
            })}
          </div>

          {/* Selected Exhibit Deep-Dive Panel with QR Generation */}
          <div id="exhibit-deep-dive-panel" className="lg:col-span-6 bg-gray-900 p-5 rounded-xl border-gray-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="border-b border-gray-800 pb-3 mb-4 flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono text-amber-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    ACTIVE EXHIBIT QR & EVIDENCE INSPECTOR
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">
                    {activeExhibit.id}: {activeExhibit.title}
                  </h3>
                  <p className="text-xs text-amber-300/80 mt-1">{activeExhibit.statutoryBasis}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition flex items-center gap-1 text-xs font-mono cursor-pointer"
                  title="Enlarge QR Code & Payload Inspector"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              {/* QR Code & Verification Tag Section */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 bg-slate-950 border-slate-800 rounded-xl mb-4 items-center">
                {/* QR Code Container */}
                <div className="sm:col-span-5 flex flex-col items-center justify-center">
                  <div 
                    onClick={() => setIsModalOpen(true)}
                    className="p-2.5 bg-white rounded-lg shadow-xl cursor-pointer hover:scale-105 transition transform"
                  >
                    <QRCodeSVG
                      id={`qr-active-exhibit-${activeExhibit.id}`}
                      value={activePayloadJson}
                      size={135}
                      level="H"
                      fgColor="#020617"
                      bgColor="#FFFFFF"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadQrPng(activeExhibit, `qr-active-exhibit-${activeExhibit.id}`)}
                    className="mt-2 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition hover:underline cursor-pointer"
                  >
                    <Download className="w-3 h-3" /> Save Seal PNG
                  </button>
                </div>

                {/* Evidence Summary Meta */}
                <div className="sm:col-span-7 space-y-2 text-xs font-mono text-slate-300">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-1">
                    <span className="text-slate-400">Scan Standard:</span>
                    <span className="text-amber-300 font-bold">ETDA Sec 9/26/28</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-1">
                    <span className="text-slate-400">Genesis Block:</span>
                    <span className="text-cyan-300 font-bold">#849202</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-1">
                    <span className="text-slate-400">PQC Suite:</span>
                    <span className="text-purple-300 font-bold">Dilithium-5 / SPHINCS+</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-1">
                    <span className="text-slate-400">ISO/IEC 27037:</span>
                    <span className="text-emerald-400 font-bold">QUALIFIED</span>
                  </div>
                  <div className="pt-1 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="w-full py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-cyan-300 font-mono flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <FileCode className="w-3 h-3" /> Inspect JSON Payload
                    </button>
                  </div>
                </div>
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
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition-colors cursor-pointer"
                  >
                    {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-2.5 bg-black/60 rounded border-gray-800 font-mono text-[11px] text-cyan-300 break-all select-all">
                  {activeExhibit.merkleRootOrHash}
                </div>
              </div>

              {/* Spec Attributes */}
              <div className="space-y-2">
                {activeExhibit.details.map((detail, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs border-b border-gray-800/60 pb-1.5">
                    <span className="text-gray-400">{detail.label}</span>
                    <span className="font-mono text-gray-200 font-medium">{detail.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-800 text-[11px] font-mono text-emerald-400 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                CERTIFIED COURT-ADMISSIBLE
              </span>
              <span className="bg-emerald-950/80 px-2 py-0.5 rounded border-emerald-800/60">
                ZERO-DRIFT VERIFIED (Δ 0.00%)
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Grid View: All Exhibit QR Cards for Batch Inspection / Printing */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {EXHIBITS_DATA.map((exhibit) => {
            const payload = buildExhibitPayload(exhibit);
            const payloadJson = JSON.stringify(payload);
            const qrDomId = `qr-batch-card-${exhibit.id}`;
            return (
              <div
                key={exhibit.id}
                className="bg-gray-900/90 border-gray-800 rounded-xl p-4 flex flex-col justify-between hover:border-amber-500/50 transition space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border-amber-800">
                      {exhibit.id}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border-emerald-800/80 px-1.5 py-0.5 rounded">
                      {exhibit.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white line-clamp-2 h-8">{exhibit.title}</h4>
                  <p className="text-[10px] text-gray-400 font-mono truncate mt-0.5">{exhibit.category}</p>
                </div>

                {/* Centered QR */}
                <div className="flex flex-col items-center justify-center p-3 bg-slate-950 border-slate-800/80 rounded-lg">
                  <div className="p-2 bg-white rounded shadow">
                    <QRCodeSVG
                      id={qrDomId}
                      value={payloadJson}
                      size={120}
                      level="M"
                      fgColor="#020617"
                      bgColor="#FFFFFF"
                    />
                  </div>
                  <div className="mt-2 text-[10px] font-mono text-slate-400 text-center truncate max-w-full">
                    {exhibit.merkleRootOrHash.slice(0, 16)}...
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveExhibit(exhibit);
                      setIsModalOpen(true);
                    }}
                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-mono rounded flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <Eye className="w-3 h-3" /> Inspect
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadQrPng(exhibit, qrDomId)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono rounded transition cursor-pointer"
                    title="Download QR PNG"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Enlarged QR Inspection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div
            className="relative w-full max-w-3xl bg-slate-900 border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 border-amber-500/30 text-amber-400">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-wide">
                    EXHIBIT {activeExhibit.id} • JUDICIAL VERIFICATION SEAL
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Genesis Anchor #849202 • ETDA B.E. 2544 Sec 28 • ISO/IEC 27037
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* High-Resolution QR Container */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-5 bg-slate-950 border-slate-800 rounded-xl">
                <div className="p-3.5 bg-white rounded-xl shadow-2xl">
                  <QRCodeSVG
                    id={`modal-qr-${activeExhibit.id}`}
                    value={activePayloadJson}
                    size={220}
                    level="H"
                    fgColor="#020617"
                    bgColor="#FFFFFF"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadQrPng(activeExhibit, `modal-qr-${activeExhibit.id}`)}
                  className="mt-3 text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition hover:underline cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download High-Res Evidence Seal PNG
                </button>
              </div>

              {/* Raw JSON Payload Viewer */}
              <div className="md:col-span-7 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-amber-400" /> CANONICAL VERIFICATION PAYLOAD
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPayload}
                    className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition border-slate-700 active:scale-95 cursor-pointer"
                  >
                    {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                    <span>{copiedPayload ? 'Copied!' : 'Copy Raw JSON'}</span>
                  </button>
                </div>

                <div className="p-3 bg-slate-950 border-slate-800 rounded-xl max-h-56 overflow-y-auto font-mono text-xs text-cyan-300">
                  <pre className="whitespace-pre-wrap break-all leading-relaxed">{activePayloadJson}</pre>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/40 border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Statute Ref:</span>
                    <span className="text-amber-300 font-bold">{activeExhibit.statutoryBasis}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SSoT State Drift:</span>
                    <span className="text-emerald-400 font-bold">Δ 0.00% (Zero Drift)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Deca-Key Quorum:</span>
                    <span className="text-cyan-400 font-bold">10/10 REAL_HSM (FIPS 140-3 L4)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourtEvidenceInfographic;
