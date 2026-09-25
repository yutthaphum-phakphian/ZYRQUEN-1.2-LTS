import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QRCodeSVG } from 'qrcode.react';
import {
  Printer, CheckSquare, Square, Trash2, Shield, Layers, FileSearch,
  FileDown, Download, Upload, QrCode, X, CheckCircle2, Search,
  ArrowUpDown, Table, Maximize2, Copy, FileCheck
} from 'lucide-react';
import { triggerVibration } from '../utils/vibration';
import { playTone } from './AudioSynthesizer';

export interface EvidenceSeal {
  id: string;
  sealCode: string;
  merkleRoot: string;
  pqcType: string;
  timestamp: string;
  status: 'VERIFIED' | 'FROZEN';
}

const INITIAL_SEALS: EvidenceSeal[] = [
  { id: 'SEAL-01', sealCode: 'SEAL-849202-A', merkleRoot: '909ab8144798a12bc9155801718cd034912e', pqcType: 'ML-DSA-87', timestamp: '18:14:02', status: 'VERIFIED' },
  { id: 'SEAL-02', sealCode: 'SEAL-849203-B', merkleRoot: 'a12bc9155801718cd034912e909ab8144798', pqcType: 'ML-DSA-87', timestamp: '18:14:15', status: 'VERIFIED' },
  { id: 'SEAL-03', sealCode: 'SEAL-849204-C', merkleRoot: '718cd034912e909ab8144798a12bc9155801', pqcType: 'ML-KEM-1024', timestamp: '18:15:00', status: 'FROZEN' },
  { id: 'SEAL-04', sealCode: 'SEAL-849205-D', merkleRoot: 'e45fa198234a718cd034912e909ab8144798', pqcType: 'ML-DSA-87', timestamp: '18:15:42', status: 'VERIFIED' },
  { id: 'SEAL-05', sealCode: 'SEAL-849206-E', merkleRoot: 'b91c5d602e718cd034912e909ab8144798a12b', pqcType: 'ML-DSA-87', timestamp: '18:16:10', status: 'FROZEN' },
  { id: 'SEAL-06', sealCode: 'SEAL-849207-F', merkleRoot: 'c82d6e713f829e45fa198234a718cd034912', pqcType: 'ML-KEM-1024', timestamp: '18:17:33', status: 'VERIFIED' },
];

export const ActiveEvidenceSealsPayload: React.FC = () => {
  const [seals, setSeals] = useState<EvidenceSeal[]>(INITIAL_SEALS);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [qrInputData, setQrInputData] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'VERIFIED' | 'FROZEN'>('ALL');
  const [sortBy, setSortBy] = useState<'timestamp' | 'sealCode' | 'merkleRoot'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [isQrPreviewOpen, setIsQrPreviewOpen] = useState(false);
  const [previewSeal, setPreviewSeal] = useState<EvidenceSeal | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtering + Sorting
  const filteredSeals = useMemo(() => {
    let result = [...seals];
    if (filterStatus !== 'ALL') result = result.filter((s) => s.status === filterStatus);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) => s.sealCode.toLowerCase().includes(q) || s.merkleRoot.toLowerCase().includes(q) || s.pqcType.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'timestamp') cmp = a.timestamp.localeCompare(b.timestamp);
      if (sortBy === 'sealCode') cmp = a.sealCode.localeCompare(b.sealCode);
      if (sortBy === 'merkleRoot') cmp = a.merkleRoot.localeCompare(b.merkleRoot);
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [seals, filterStatus, sortBy, sortOrder, searchQuery]);

  // PDF Export
  const handleDownloadPDF = () => {
    triggerVibration(40);
    playTone(659.25, 0.15, 'sine');
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('ZYRQUEN EVIDENCE SEALS REPORT', 14, 15);
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`Sovereign Chain Epoch #849,202 | Exported: ${new Date().toLocaleString()}`, 14, 22);
    doc.text(`Filtered: ${filteredSeals.length}/${seals.length}`, 150, 22);
    autoTable(doc, {
      startY: 35,
      head: [['Seal Code', 'PQC Spec', 'Status', 'Timestamp', 'Merkle Root Hash']],
      body: filteredSeals.map((s) => [s.sealCode, s.pqcType, s.status, s.timestamp, s.merkleRoot]),
      theme: 'grid',
      headStyles: { fillColor: [6, 182, 212], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      columnStyles: { 0: { cellWidth: 35, fontStyle: 'bold' }, 1: { cellWidth: 28 }, 2: { cellWidth: 22 }, 3: { cellWidth: 25 }, 4: { cellWidth: 'auto' } },
      didDrawPage: (data: any) => {
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`Page ${data.pageNumber} of ${(doc as any).internal.getNumberOfPages()}`, 180, 285);
      },
    });
    doc.save(`ZYRQUEN_EVIDENCE_SEALS_${Date.now()}.pdf`);
  };

  // JSON Export
  const handleExportJSON = () => {
    triggerVibration(40);
    playTone(587.33, 0.15, 'sine');
    const blob = new Blob([JSON.stringify(filteredSeals, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZYRQUEN_EVIDENCE_PAYLOAD_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // CSV Export for external auditing software (RFC-4180 compliant)
  const handleExportCSV = () => {
    triggerVibration(40);
    playTone(523.25, 0.15, 'triangle');
    const headers = [
      'Seal Code',
      'PQC Spec',
      'Status',
      'Timestamp',
      'Merkle Root Hash',
      'Genesis Block',
      'SSoT Delta',
      'Principal ID',
      'Compliance Standard',
    ];
    const rows = filteredSeals.map((s) => [
      s.sealCode,
      s.pqcType,
      s.status,
      s.timestamp,
      s.merkleRoot,
      '849202',
      'Δ0.00%',
      '#EP-SOVEREIGN-01',
      'ETDA B.E. 2544 / PDPA Sec 37 / FIPS 204',
    ]);
    const csvContent =
      '\uFEFF' +
      [headers, ...rows]
        .map((r) =>
          r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
        )
        .join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZYRQUEN_EVIDENCE_SEALS_AUDIT_${filterStatus}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setCopiedNotification(`ไฟล์ CSV (${filteredSeals.length} รายการ)`);
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const reader = new FileReader();
    if (e.target.files?.[0]) {
      reader.readAsText(e.target.files[0], 'UTF-8');
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (Array.isArray(data)) {
            setSeals(data);
            triggerVibration(50);
            playTone(880, 0.2, 'sine');
          }
        } catch {
          alert('ไฟล์ JSON ไม่ถูกต้อง');
        }
      };
    }
  };

  const handleImportFromQR = () => {
    try {
      const data = JSON.parse(qrInputData);
      if (Array.isArray(data)) {
        setSeals(data);
        setIsQrScannerOpen(false);
        setQrInputData('');
        triggerVibration(50);
        playTone(880, 0.2, 'sine');
      }
    } catch {
      alert('QR Payload ไม่ถูกต้อง');
    }
  };

  const toggleSelect = (id: string) => {
    triggerVibration(20);
    setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const handleRemove = (id: string) => {
    triggerVibration(30);
    setSeals((p) => p.filter((s) => s.id !== id));
    setSelectedIds((p) => p.filter((x) => x !== id));
  };

  const openPreview = (s: EvidenceSeal) => {
    triggerVibration(20);
    playTone(783.99, 0.1, 'sine');
    setPreviewSeal(s);
    setIsQrPreviewOpen(true);
  };

  const handleCopyMerkle = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    triggerVibration(30);
    playTone(880, 0.1, 'sine');
    setCopiedNotification(label);
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  const handleDownloadQrPng = () => {
    if (!previewSeal) return;
    triggerVibration(30);
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 400, 400);

    // Draw frame & header
    ctx.fillStyle = '#020617';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`ZYRQUEN EVIDENCE SEAL: ${previewSeal.sealCode}`, 24, 32);
    ctx.font = '10px monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`PQC: ${previewSeal.pqcType} | Block #849202 | Status: ${previewSeal.status}`, 24, 48);

    // Grab SVG QR element
    const svgElement = document.getElementById(`preview-qr-${previewSeal.id}`);
    if (svgElement) {
      const xml = new XMLSerializer().serializeToString(svgElement);
      const svg64 = btoa(unescape(encodeURIComponent(xml)));
      const image64 = 'data:image/svg+xml;base64,' + svg64;
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 50, 65, 300, 300);
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `QR_${previewSeal.sealCode}.png`;
        a.click();
      };
      img.src = image64;
    }
  };

  const handlePrintSingleQr = () => {
    triggerVibration(30);
    playTone(700, 0.1, 'sine');
    window.print();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 font-mono text-slate-100">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json" className="hidden" />
      <div className="flex-1 space-y-4 print:w-full">
        {/* Header Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border-slate-800 print:hidden">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>ACTIVE EVIDENCE SEALS PAYLOAD</span>
            </h3>
            <p className="text-[10px] text-slate-400">
              ทั้งหมด: {seals.length} | แสดง: {filteredSeals.length} | VERIFIED:{' '}
              {seals.filter((s) => s.status === 'VERIFIED').length} | FROZEN:{' '}
              {seals.filter((s) => s.status === 'FROZEN').length}
            </p>
          </div>
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handleDownloadPDF}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 active:scale-95 shadow-[0_0_12px_rgba(6,182,212,0.2)] cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 text-xs font-bold flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 active:scale-95 shadow-[0_0_12px_rgba(16,185,129,0.2)] cursor-pointer"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Export CSV (Audit)</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Import JSON</span>
            </button>
            <button
              onClick={() => setIsQrScannerOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span>Scan QR</span>
            </button>
            <button
              onClick={() => {
                setIsBatchMode(!isBatchMode);
                if (isBatchMode) setSelectedIds([]);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                isBatchMode
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{isBatchMode ? 'Cancel Batch' : 'Batch Compare'}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print QR</span>
            </button>
          </div>
        </div>

        {/* Filter & Sort Bar */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-3 rounded-xl border-slate-800 print:hidden">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Filter:</span>
            {(['ALL', 'VERIFIED', 'FROZEN'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                  filterStatus === f
                    ? f === 'VERIFIED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : f === 'FROZEN'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-white'
                }`}
              >
                {f} {f !== 'ALL' && `(${seals.filter((s) => s.status === f).length})`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-500" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sealCode / merkleRoot..."
                className="pl-7 pr-3 py-1 rounded-lg bg-slate-950 border-slate-800 text-[11px] text-white placeholder-slate-500 outline-none focus:border-cyan-500/60 w-52 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1 rounded-lg bg-slate-950 border-slate-800 text-[11px] text-slate-300 outline-none font-mono"
            >
              <option value="timestamp">Timestamp</option>
              <option value="sealCode">Seal Code</option>
              <option value="merkleRoot">Merkle Root</option>
            </select>
            <button
              onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
              className="p-1 rounded-lg bg-slate-800 border-slate-700 text-slate-400 hover:text-white cursor-pointer"
              title="Toggle Sort Direction"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
            {(filterStatus !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setFilterStatus('ALL');
                  setSearchQuery('');
                }}
                className="px-2 py-1 rounded-lg bg-red-500/10 text-red-400 border-red-500/30 text-[11px] cursor-pointer flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Copied Notification Toast */}
        {copiedNotification && (
          <div className="p-2 rounded-xl bg-cyan-950 border-cyan-500/40 text-cyan-300 text-xs flex items-center gap-2 animate-in fade-in">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span>คัดลอก {copiedNotification} ลงคลิปบอร์ดแล้ว</span>
          </div>
        )}

        {/* Cards */}
        <div className="evidence-qr-grid grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredSeals.map((seal, index) => {
              const isSelected = selectedIds.includes(seal.id);
              return (
                <motion.div
                  key={seal.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.25, delay: index * 0.03 }}
                  className={`CourtEvidenceQR relative p-4 rounded-2xl border transition-all duration-200 ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.25)]'
                      : 'bg-slate-900/90 border-slate-800 hover:border-cyan-500/40 hover:shadow-[0_4px_20px_rgba(6,182,212,0.12)]'
                  }`}
                >
                  {isBatchMode && (
                    <button
                      onClick={() => toggleSelect(seal.id)}
                      className="absolute top-3 left-3 z-10 p-1 text-purple-400 hover:scale-110 transition print:hidden cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 fill-purple-500/20" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-500" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => handleRemove(seal.id)}
                    className="absolute top-3 right-3 p-1 text-slate-500 hover:text-red-400 transition print:hidden cursor-pointer"
                    title="Remove Seal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className={`space-y-3 ${isBatchMode ? 'pl-6' : ''}`}>
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-cyan-400" />
                        {seal.sealCode}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                          seal.status === 'VERIFIED'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        {seal.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div
                        onClick={() => openPreview(seal)}
                        className="w-20 h-20 bg-white p-1 rounded-xl flex items-center justify-center shrink-0 border-slate-300 cursor-pointer hover:scale-105 transition group relative"
                        title="Click to enlarge QR Code"
                      >
                        <QRCodeSVG
                          id={`qr-card-${seal.id}`}
                          value={JSON.stringify({
                            sys: 'ZYRQUEN_OMEGA_INF',
                            merkle_root: seal.merkleRoot,
                            seal_idx: seal.id,
                            genesis_block: 849202,
                            pqc: seal.pqcType,
                          })}
                          size={72}
                          level="M"
                          fgColor="#020617"
                          bgColor="#FFFFFF"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                          <Maximize2 className="w-5 h-5 text-slate-900" />
                        </div>
                      </div>

                      <div className="space-y-1 text-[10.5px] text-slate-300 min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <div className="truncate">
                            <span className="text-slate-500">Merkle: </span>
                            <span className="text-zinc-200">{seal.merkleRoot.slice(0, 16)}...</span>
                          </div>
                          <button
                            onClick={() => handleCopyMerkle(seal.merkleRoot, `Merkle Hash ${seal.sealCode}`)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-cyan-300 cursor-pointer shrink-0"
                            title="Copy Merkle Hash"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <div>
                          <span className="text-slate-500">PQC: </span>
                          <span className="text-purple-300 font-semibold">{seal.pqcType}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Time: </span>
                          <span>{seal.timestamp} | Block #849202 | Δ0.00%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* QR Preview Modal */}
      {isQrPreviewOpen && previewSeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-slate-900 border-cyan-500/40 rounded-2xl p-6 space-y-4 shadow-[0_0_30px_rgba(6,182,212,0.25)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-300">
                <QrCode className="w-5 h-5" />
                <h4 className="text-sm font-bold">QR Preview: {previewSeal.sealCode}</h4>
              </div>
              <button
                onClick={() => setIsQrPreviewOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-2xl shadow-xl">
                <QRCodeSVG
                  id={`preview-qr-${previewSeal.id}`}
                  value={JSON.stringify({
                    sys: 'ZYRQUEN_OMEGA_INF',
                    merkle_root: previewSeal.merkleRoot,
                    seal_idx: previewSeal.id,
                    genesis_block: 849202,
                    pqc: previewSeal.pqcType,
                    ts: previewSeal.timestamp,
                  })}
                  size={240}
                  level="M"
                  fgColor="#020617"
                  bgColor="#FFFFFF"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 w-full text-[11px]">
                <div className="p-2.5 rounded-lg bg-slate-950 border-slate-800 min-w-0">
                  <span className="text-slate-500">Merkle Root Hash:</span>
                  <div className="text-cyan-300 truncate font-mono text-[10px] mt-0.5" title={previewSeal.merkleRoot}>
                    {previewSeal.merkleRoot}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-500">PQC:</span>
                    <span className="text-purple-300 font-bold">{previewSeal.pqcType}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-slate-500">Status:</span>
                    <span className={previewSeal.status === 'VERIFIED' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                      {previewSeal.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-slate-800/80">
              <button
                onClick={handleDownloadQrPng}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Download PNG</span>
              </button>
              <button
                onClick={() => {
                  handleCopyMerkle(JSON.stringify(previewSeal, null, 2), `QR Payload (${previewSeal.sealCode})`);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Payload</span>
              </button>
              <button
                onClick={handlePrintSingleQr}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print QR Graphic</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Import Modal */}
      {isQrScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-slate-900 border-amber-500/40 rounded-2xl p-5 space-y-4 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-300">
                <QrCode className="w-5 h-5" />
                <h4 className="text-sm font-bold">QR Code Payload Re-Importer</h4>
              </div>
              <button
                onClick={() => setIsQrScannerOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              rows={5}
              value={qrInputData}
              onChange={(e) => setQrInputData(e.target.value)}
              placeholder='[{"id":"SEAL-01",...}]'
              className="w-full p-3 rounded-xl bg-slate-950 border-slate-800 focus:border-amber-500 text-xs text-slate-200 outline-none font-mono"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsQrScannerOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleImportFromQR}
                className="px-4 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                ยืนยันการนำเข้า
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Sidebar */}
      {isBatchMode && selectedIds.length > 0 && (
        <div className="w-full lg:w-80 bg-slate-950 border-purple-500/40 rounded-2xl p-4 space-y-4 shadow-[0_0_30px_rgba(168,85,247,0.15)] animate-in fade-in slide-in-from-right-4 duration-300 print:hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2 text-purple-300">
              <FileSearch className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase">Forensic Batch Compare</h4>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border-purple-500/30">
              {selectedIds.length} Selected
            </span>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
            {seals
              .filter((s) => selectedIds.includes(s.id))
              .map((s) => (
                <div key={s.id} className="p-2.5 rounded-xl bg-slate-900 border-slate-800 text-[11px] space-y-1">
                  <div className="flex justify-between font-bold text-slate-200">
                    <span>{s.sealCode}</span>
                    <span className="text-purple-400">{s.pqcType}</span>
                  </div>
                  <div className="text-[9.5px] text-slate-400 truncate font-mono">Root: {s.merkleRoot}</div>
                  <div
                    className={`text-[9px] px-1.5 py-0.5 rounded inline-block ${
                      s.status === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {s.status}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
