import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Printer,
  Copy,
  Check,
  Scan,
  Search,
  ShieldCheck,
  Download,
  QrCode,
  Sparkles,
  AlertTriangle,
  Flame,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { CryoChamber } from './chamberConsoleData';
import {
  ChamberCoherenceState,
  getChamberCoherenceState,
  getDefaultSealStatus,
  buildChamberQRPayload,
  downloadFocusedChamberPdf,
} from '../utils/forensicDossierPdfExport';
import { playAuditChime, playTone } from './AudioSynthesizer';

export const ForensicDossierQRCode: React.FC<{ payloadUrl: string; size?: number }> = ({
  payloadUrl,
  size = 210,
}) => {
  return (
    <div className="p-3 bg-white rounded-xl shadow-lg border-slate-700 inline-block">
      <QRCodeSVG
        value={payloadUrl}
        size={size}
        level="H"
        includeMargin={true}
        bgColor="#ffffff"
        fgColor="#050a14"
      />
    </div>
  );
};

export const generateChamberFieldQRPayload = (
  chamber: CryoChamber,
  coherenceState?: ChamberCoherenceState
): string => {
  const state = coherenceState || getChamberCoherenceState(chamber.coherence, chamber.status);
  const seal = getDefaultSealStatus(state);
  return buildChamberQRPayload({
    chamberId: chamber.chamberId,
    name: chamber.name,
    coherence: chamber.coherence,
    coherenceState: state,
    sealStatus: seal,
    merkleHash: chamber.merkleHash,
    temperature: chamber.temperature,
  });
};

export const printChamberQRCards = (
  chambersToPrint: CryoChamber[],
  overrideStates: Record<string, ChamberCoherenceState> = {}
): void => {
  if (typeof window === 'undefined') return;
  let printWindow: Window | null = null;
  try {
    printWindow = window.open('', '_blank', 'width=900,height=750');
  } catch {
    printWindow = null;
  }
  if (!printWindow) {
    window.print();
    return;
  }

  const cardsHtml = chambersToPrint.map((c) => {
    const state = overrideStates[c.chamberId] || getChamberCoherenceState(c.coherence, c.status);
    const seal = getDefaultSealStatus(state);
    const isFrozen = state === 'FROZEN';
    const isQuarantine = state === 'QUARANTINE';

    const statusColor = isFrozen ? '#059669' : isQuarantine ? '#d97706' : '#dc2626';
    const statusBg = isFrozen ? '#ecfdf5' : isQuarantine ? '#fffbeb' : '#fef2f2';
    const statusBorder = isFrozen ? '#10b981' : isQuarantine ? '#f59e0b' : '#ef4444';
    const statusText = isFrozen
      ? 'FROZEN (SSoT Δ0 PURE GREEN)'
      : isQuarantine
      ? 'QUARANTINE (STABILIZATION HOLD)'
      : 'TEMPERED (INTEGRITY BREACH DETECTED)';

    const qrPayload = generateChamberFieldQRPayload(c, state);

    return `
      <div style="border: 2px dashed ${statusBorder}; padding: 14px; border-radius: 10px; margin-bottom: 16px; page-break-inside: avoid; background: #ffffff; color: #0f172a; font-family: monospace;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 10px;">
          <div>
            <div style="font-size: 14px; font-weight: 900; color: #0f172a;">🛡️ ZYRQUEN Ω∞ CRYO ASSET FIELD VERIFICATION TAG</div>
            <div style="font-size: 12px; font-weight: bold; color: #334155;">${c.chamberId} — ${c.name}</div>
          </div>
          <div style="background: ${statusBg}; color: ${statusColor}; border: 1.5px solid ${statusBorder}; padding: 3px 8px; border-radius: 5px; font-size: 10px; font-weight: 800;">
            ${statusText}
          </div>
        </div>
        <div style="display: flex; gap: 16px; align-items: center;">
          <div style="background: #ffffff; padding: 8px; border: 1.5px solid #0f172a; border-radius: 8px; text-align: center; flex-shrink: 0;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qrPayload)}" alt="QR Code" width="125" height="125" style="display: block; margin: 0 auto;" />
            <div style="font-size: 8px; font-weight: bold; color: #64748b; margin-top: 4px;">SCAN FOR SSoT PROOF</div>
          </div>
          <div style="flex: 1; font-size: 11px; line-height: 1.5;">
            <div><strong>Coherence State:</strong> <span style="font-size: 14px; font-weight: 900; color: ${statusColor};">${state} (${(c.coherence * 100).toFixed(2)}%)</span></div>
            <div><strong>Current Seal Status:</strong> ${seal}</div>
            <div><strong>Cryo Temp:</strong> ${c.temperature.toFixed(2)} mK</div>
            <div><strong>Merkle Leaf:</strong> <code style="font-size: 10px; background: #f1f5f9; padding: 1px 4px; border-radius: 3px;">${c.merkleHash}</code></div>
            <div><strong>PQC Scheme:</strong> CRYSTALS-Dilithium-5 (ML-DSA-87 / FIPS 204)</div>
            <div><strong>Statutory Standard:</strong> Thai ETA B.E. 2544 Sec 9, 26, 28 Court Admissible</div>
            <div style="color: #64748b; font-size: 9px; margin-top: 4px;">Genesis Block #849202 | 10/10 HSM Quorum | Principal: นายยุทธภูมิ พากเพียร</div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>ZYRQUEN Ω∞ Chamber Field QR Badges — Block #849202</title>
        <style>
          @page { size: A4; margin: 12mm; }
          body { margin: 0; padding: 16px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; color: #0f172a; background: #f8fafc; }
          .header { text-align: center; margin-bottom: 16px; border-bottom: 2px solid #0f172a; padding-bottom: 8px; }
          .title { font-size: 16px; font-weight: 900; }
          .print-btn-bar { text-align: right; margin-bottom: 12px; }
          .print-btn { padding: 8px 16px; background: #059669; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px; }
          @media print { body { background: #ffffff; padding: 0; } .print-btn-bar { display: none; } }
        </style>
      </head>
      <body>
        <div class="print-btn-bar">
          <button class="print-btn" onclick="window.print()">🖨️ Print Field Badges Now</button>
        </div>
        <div class="header">
          <div class="title">🛡️ ZYRQUEN Ω∞ SOVEREIGN CRYOGENIC FIELD VERIFICATION DOSSIER</div>
          <div style="font-size: 11px; color: #64748b;">Genesis Block #849202 | Total Badges: ${chambersToPrint.length}</div>
        </div>
        <div>${cardsHtml}</div>
      </body>
    </html>
  `);
  printWindow.document.close();
  setTimeout(() => printWindow.focus(), 200);
};

export interface ChamberFieldQRSectionProps {
  chambers: CryoChamber[];
  selectedChamberIds: Set<number>;
  onSimulateScan?: (result: string) => void;
}

export const ChamberFieldQRSection: React.FC<ChamberFieldQRSectionProps> = ({
  chambers,
  selectedChamberIds,
  onSimulateScan,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'FROZEN' | 'QUARANTINE' | 'TEMPERED'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);
  const [qrGeneratedTimes, setQrGeneratedTimes] = useState<Record<string, string>>({});
  const [customStates, setCustomStates] = useState<Record<string, ChamberCoherenceState>>({});

  const getChamberState = (chamber: CryoChamber): ChamberCoherenceState => {
    return customStates[chamber.chamberId] || getChamberCoherenceState(chamber.coherence, chamber.status);
  };

  const setChamberState = (chamberId: string, state: ChamberCoherenceState) => {
    playTone(600 + (state === 'FROZEN' ? 200 : state === 'QUARANTINE' ? 100 : 0), 0.04);
    setCustomStates((prev) => ({ ...prev, [chamberId]: state }));
  };

  const handleGenerateQR = (chamber: CryoChamber) => {
    playAuditChime();
    const timeStr = new Date().toLocaleTimeString();
    setQrGeneratedTimes((prev) => ({ ...prev, [chamber.chamberId]: timeStr }));
  };

  const handleGenerateAllQR = () => {
    playAuditChime();
    const timeStr = new Date().toLocaleTimeString();
    const newTimes: Record<string, string> = {};
    chambers.forEach((c) => {
      newTimes[c.chamberId] = timeStr;
    });
    setQrGeneratedTimes(newTimes);
  };

  const handleDownloadPdf = async (chamber: CryoChamber) => {
    const state = getChamberState(chamber);
    const seal = getDefaultSealStatus(state);
    setDownloadingPdfId(chamber.chamberId);
    playAuditChime();
    try {
      await downloadFocusedChamberPdf({
        chamberId: chamber.chamberId,
        name: chamber.name,
        coherence: chamber.coherence,
        coherenceState: state,
        sealStatus: seal,
        temperature: chamber.temperature,
        merkleHash: chamber.merkleHash,
        lastSync: chamber.lastSync,
        history24h: chamber.history24h,
      });
    } catch (err) {
      console.error('Failed to download chamber PDF:', err);
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const filteredChambers = chambers.filter((c) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || c.chamberId.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
    const state = getChamberState(c);
    const matchesFilter = filter === 'all' || filter === state;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4 font-mono text-xs overflow-y-auto max-h-[65vh] pr-1">
      {/* Controls Bar */}
      <div className="bg-slate-950 p-3.5 rounded-2xl border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search chamber ID or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-900 border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-48 sm:w-56"
            />
          </div>

          {/* Dynamic State Filters */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border-slate-800 flex-wrap">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                filter === 'all' ? 'bg-cyan-500/30 text-cyan-200 border-cyan-500/50' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({chambers.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('FROZEN')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filter === 'FROZEN' ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40' : 'text-emerald-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>FROZEN ({chambers.filter((c) => getChamberState(c) === 'FROZEN').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter('QUARANTINE')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filter === 'QUARANTINE' ? 'bg-amber-500/25 text-amber-300 border-amber-500/40' : 'text-amber-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>QUARANTINE ({chambers.filter((c) => getChamberState(c) === 'QUARANTINE').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter('TEMPERED')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filter === 'TEMPERED' ? 'bg-rose-500/25 text-rose-300 border-rose-500/40' : 'text-rose-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>TEMPERED ({chambers.filter((c) => getChamberState(c) === 'TEMPERED').length})</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            id="btn-generate-all-chamber-qr"
            onClick={handleGenerateAllQR}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border-cyan-500/40 text-cyan-300 font-bold rounded-xl text-xs transition-all cursor-pointer active:scale-95 shadow-sm"
            title="Generate high-contrast QR codes for all 18 chambers"
          >
            <QrCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>Generate All QR</span>
          </button>

          {selectedChamberIds.size > 0 && (
            <button
              type="button"
              onClick={() => printChamberQRCards(chambers.filter((c) => selectedChamberIds.has(c.id)), customStates)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Selected ({selectedChamberIds.size})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => printChamberQRCards(filteredChambers, customStates)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print All ({filteredChambers.length})</span>
          </button>
        </div>
      </div>

      {/* Info Notice Banner */}
      <div className="bg-slate-950/70 p-3 rounded-xl border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Dynamic visual indicator changes color based on coherence state:{' '}
            <strong className="text-emerald-400">Green for FROZEN</strong>,{' '}
            <strong className="text-amber-400">Amber for QUARANTINE</strong>, and{' '}
            <strong className="text-rose-400">Red for TEMPERED</strong>.
          </span>
        </span>
        <span className="text-cyan-400 font-bold shrink-0">18 Chambers Total</span>
      </div>

      {/* Dynamic Grid of Individual Chamber Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredChambers.map((chamber) => {
          const state = getChamberState(chamber);
          const seal = getDefaultSealStatus(state);
          const payload = generateChamberFieldQRPayload(chamber, state);
          const isCopied = copiedId === chamber.chamberId;
          const isDownloadingThis = downloadingPdfId === chamber.chamberId;
          const hasGenerated = !!qrGeneratedTimes[chamber.chamberId];

          // Dynamic colors based on coherence state
          const indicatorStyles =
            state === 'FROZEN'
              ? {
                  cardBorder: 'border-emerald-500/40 hover:border-emerald-500/70',
                  badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                  dot: 'bg-emerald-400 shadow-[0_0_8px_#10b981]',
                  textAccent: 'text-emerald-400',
                  label: 'FROZEN',
                }
              : state === 'QUARANTINE'
              ? {
                  cardBorder: 'border-amber-500/40 hover:border-amber-500/70',
                  badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                  dot: 'bg-amber-400 shadow-[0_0_8px_#f59e0b]',
                  textAccent: 'text-amber-400',
                  label: 'QUARANTINE',
                }
              : {
                  cardBorder: 'border-rose-500/50 hover:border-rose-500/80',
                  badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
                  dot: 'bg-rose-500 animate-ping shadow-[0_0_10px_#ef4444]',
                  textAccent: 'text-rose-400',
                  label: 'TEMPERED',
                };

          return (
            <div
              key={chamber.id}
              className={`p-3.5 rounded-2xl border flex flex-col justify-between bg-[#060a13] transition-all shadow-md ${indicatorStyles.cardBorder}`}
            >
              <div>
                {/* Header with Dynamic Visual Indicator */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {/* Dynamic Visual Indicator Dot */}
                    <span className={`w-2.5 h-2.5 rounded-full ${indicatorStyles.dot}`} />
                    <span className="text-xs font-bold text-cyan-300 font-mono">{chamber.chamberId}</span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[110px]" title={chamber.name}>
                      {chamber.name}
                    </span>
                  </div>

                  {/* Dynamic Visual Indicator Badge */}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider border flex items-center gap-1 ${indicatorStyles.badgeBg}`}
                  >
                    <span>{indicatorStyles.label}</span>
                  </span>
                </div>

                {/* State simulation switcher */}
                <div className="flex items-center justify-between gap-1 mb-2 bg-slate-900/80 p-1 rounded-lg border-slate-800 text-[9px]">
                  <span className="text-slate-500 text-[8px] uppercase font-bold pl-1">State:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setChamberState(chamber.chamberId, 'FROZEN')}
                      className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition ${
                        state === 'FROZEN' ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/50' : 'text-slate-500 hover:text-white'
                      }`}
                      title="Set to FROZEN (Green)"
                    >
                      FROZEN
                    </button>
                    <button
                      type="button"
                      onClick={() => setChamberState(chamber.chamberId, 'QUARANTINE')}
                      className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition ${
                        state === 'QUARANTINE' ? 'bg-amber-500/30 text-amber-300 border-amber-500/50' : 'text-slate-500 hover:text-white'
                      }`}
                      title="Set to QUARANTINE (Amber)"
                    >
                      QUARANTINE
                    </button>
                    <button
                      type="button"
                      onClick={() => setChamberState(chamber.chamberId, 'TEMPERED')}
                      className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition ${
                        state === 'TEMPERED' ? 'bg-rose-500/30 text-rose-300 border-rose-500/50' : 'text-slate-500 hover:text-white'
                      }`}
                      title="Set to TEMPERED (Red)"
                    >
                      TEMPERED
                    </button>
                  </div>
                </div>

                {/* High-Contrast QR Code Presentation Box */}
                <div className="flex flex-col items-center justify-center p-2.5 bg-white rounded-xl border-slate-400 my-2 shadow-inner group relative">
                  <QRCodeSVG
                    value={payload}
                    size={116}
                    level="H"
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#050a14"
                    className="max-w-full h-auto transition-transform group-hover:scale-105"
                  />
                  <div className="w-full text-center mt-1 text-[8px] font-bold text-slate-800 tracking-wider">
                    {chamber.chamberId} • {state} • 14,902 SEALS
                  </div>
                </div>

                {/* Metadata details embedded in QR */}
                <div className="space-y-1 text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Coherence:</span>
                    <span className={`font-bold ${indicatorStyles.textAccent}`}>
                      {(chamber.coherence * 100).toFixed(2)}% [{state}]
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Seal Status:</span>
                    <span className="text-slate-200 font-bold truncate max-w-[160px]" title={seal}>
                      {seal.split(' ')[0]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cryo Temp:</span>
                    <span className="text-cyan-300 font-bold">{chamber.temperature.toFixed(2)} mK</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Merkle Leaf:</span>
                    <span className="text-amber-300/90 font-mono text-[9px]">{chamber.merkleHash.slice(0, 10)}...</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Generate QR, Download Chamber PDF, Verify, Copy */}
              <div className="pt-2.5 mt-2.5 border-t border-slate-800 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  {/* Generate QR Button */}
                  <button
                    type="button"
                    onClick={() => handleGenerateQR(chamber)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border-cyan-500/40 text-cyan-300 rounded-lg text-[10px] font-bold transition cursor-pointer active:scale-95"
                    title="Generate / Refresh unique high-contrast QR code with embedded Chamber ID, Coherence State, and Seal Status"
                  >
                    <QrCode className="w-3 h-3 text-cyan-400" />
                    <span>Generate QR</span>
                  </button>

                  {/* Download Chamber PDF Button */}
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(chamber)}
                    disabled={isDownloadingThis}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border-emerald-500/40 text-emerald-300 rounded-lg text-[10px] font-bold transition cursor-pointer active:scale-95 shadow-sm"
                    title="Generate focused court-admissible PDF report for this single chamber including technical breakdown and QR code"
                  >
                    {isDownloadingThis ? (
                      <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />
                    ) : (
                      <Download className="w-3 h-3 text-emerald-400" />
                    )}
                    <span>{isDownloadingThis ? 'Exporting...' : 'Download Chamber PDF'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-1.5 text-[9px]">
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(payload);
                        setCopiedId(chamber.chamberId);
                        setTimeout(() => setCopiedId(null), 2000);
                      }
                    }}
                    className="flex-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border-slate-800 transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-cyan-400" />}
                    <span>{isCopied ? 'Payload Copied' : 'Copy Payload'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onSimulateScan?.(
                        `CHAMBER_VERIFIED: ${chamber.chamberId} (${chamber.name}) | State: ${state} | Coherence: ${(chamber.coherence * 100).toFixed(2)}% | Seal: ${seal} | Leaf: ${chamber.merkleHash}`
                      )
                    }
                    className="flex-1 px-2 py-1 bg-slate-900 hover:bg-slate-850 text-cyan-300 border-slate-800 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Scan className="w-3 h-3 text-cyan-400" />
                    <span>Scan Verify</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

