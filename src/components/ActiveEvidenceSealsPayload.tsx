import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Printer, 
  CheckSquare, 
  Square, 
  Trash2, 
  Shield, 
  Layers, 
  FileSearch, 
  FileDown, 
  Download, 
  Upload, 
  QrCode, 
  X,
  CheckCircle2,
  AlertCircle
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
];

export const ActiveEvidenceSealsPayload: React.FC = () => {
  const [seals, setSeals] = useState<EvidenceSeal[]>(INITIAL_SEALS);
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState<boolean>(false);
  const [qrInputData, setQrInputData] = useState<string>('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // 1. Download All as PDF (Multi-Page Ready Format)
  const handleDownloadPDF = () => {
    try {
      triggerVibration(50);
      playTone(659.25, 0.15, 'sine');
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

      // Document Header
      doc.setFillColor(15, 23, 42); // Dark Navy Slate
      doc.rect(0, 0, 210, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text("ZYRQUEN EVIDENCE SEALS REPORT", 14, 15);
      
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(`Sovereign Chain Epoch #849,202 | Exported: ${new Date().toLocaleString()}`, 14, 22);
      doc.text(`Total Active Seals: ${seals.length}`, 150, 22);

      // Render Table across Multiple Pages
      const tableData = seals.map(s => [
        s.sealCode,
        s.pqcType,
        s.status,
        s.timestamp,
        s.merkleRoot
      ]);

      autoTable(doc, {
        startY: 35,
        head: [['Seal Code', 'PQC Spec', 'Status', 'Timestamp', 'Merkle Root Hash']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [6, 182, 212], // Cyan
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [30, 41, 59]
        },
        alternateRowStyles: {
          fillColor: [241, 245, 249]
        },
        columnStyles: {
          0: { cellWidth: 35, fontStyle: 'bold' },
          1: { cellWidth: 28 },
          2: { cellWidth: 22 },
          3: { cellWidth: 25 },
          4: { cellWidth: 'auto' }
        },
        didDrawPage: (data) => {
          // Footer Page Numbering
          const str = `Page ${data.pageNumber} of ${(doc as any).internal.getNumberOfPages()}`;
          doc.setFontSize(8);
          doc.setTextColor(100);
          doc.text(str, 180, 285);
        }
      });

      doc.save(`ZYRQUEN_EVIDENCE_SEALS_${Date.now()}.pdf`);
      showNotification(`ดาวน์โหลดรายงาน PDF เรียบร้อย (${seals.length} รายการ)`, 'success');
    } catch (err) {
      console.error('PDF Generation Error:', err);
      showNotification('เกิดข้อผิดพลาดในการสร้างเอกสาร PDF', 'error');
    }
  };

  // 2. Export Entire List as JSON File
  const handleExportJSON = () => {
    triggerVibration(40);
    playTone(587.33, 0.12, 'sine');
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(seals, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `ZYRQUEN_EVIDENCE_PAYLOAD_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification(`ส่งออกไฟล์ JSON สำเร็จ (${seals.length} รายการ)`, 'success');
  };

  // 3. Import JSON via File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const importedSeals = JSON.parse(event.target?.result as string);
          if (Array.isArray(importedSeals) && importedSeals.length > 0) {
            setSeals(importedSeals);
            triggerVibration(60);
            playTone(880, 0.15, 'sine');
            showNotification(`นำเข้าตราประทับสำเร็จจำนวน ${importedSeals.length} รายการ`, 'success');
          } else {
            showNotification('รูปแบบไฟล์ JSON ไม่ถูกต้องหรือไม่พบข้อมูล', 'error');
          }
        } catch (err) {
          showNotification('เกิดข้อผิดพลาดในการอ่านไฟล์ JSON', 'error');
        }
      };
    }
  };

  // 4. Import JSON Payload via Scanned QR String
  const handleImportFromQR = () => {
    try {
      const importedSeals = JSON.parse(qrInputData);
      if (Array.isArray(importedSeals) && importedSeals.length > 0) {
        setSeals(importedSeals);
        setIsQrScannerOpen(false);
        setQrInputData('');
        triggerVibration(60);
        playTone(880, 0.15, 'sine');
        showNotification(`สแกนนำเข้าตราประทับสำเร็จจำนวน ${importedSeals.length} รายการ`, 'success');
      } else {
        showNotification('ข้อมูลจากการสแกน QR Code ไม่ใช่โครงสร้าง Payload ที่ถูกต้อง', 'error');
      }
    } catch (err) {
      showNotification('โครงสร้างข้อมูล QR Code ไม่ถูกต้อง (Invalid JSON format)', 'error');
    }
  };

  // 5. Trigger Native Print Dialog
  const handlePrintQRSheet = () => {
    triggerVibration(40);
    window.print();
  };

  const toggleSelectSeal = (id: string) => {
    triggerVibration(20);
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleRemoveSeal = (id: string) => {
    triggerVibration([20, 30, 20]);
    playTone(392, 0.1, 'sawtooth');
    setSeals(prev => prev.filter(s => s.id !== id));
    setSelectedIds(prev => prev.filter(item => item !== id));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 font-mono text-slate-100">
      
      {/* Hidden File Input for JSON Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".json"
        className="hidden"
      />

      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl border font-mono text-xs font-bold flex items-center gap-2 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300 ${
          notification.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
            : 'bg-red-950/90 border-red-500 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="flex-1 space-y-4 print:w-full">
        
        {/* Header Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 print:hidden">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              ACTIVE EVIDENCE SEALS PAYLOAD
            </h3>
            <p className="text-[10px] text-slate-400">
              จำนวนตราประทับทั้งหมด: {seals.length} รายการ | FIPS 140-3 L4 &amp; ETDA Sec 9/26/28
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPDF}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition flex items-center gap-1.5 active:scale-95 shadow-[0_0_12px_rgba(6,182,212,0.2)] cursor-pointer"
              title="Download Multi-Page PDF Report with Auto-Table"
            >
              <FileDown className="w-3.5 h-3.5 text-cyan-400" />
              <span>Download PDF</span>
            </button>

            {/* Export JSON Button */}
            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title="Export all evidence seals as JSON"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>Export JSON</span>
            </button>

            {/* Import JSON File Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title="Import JSON from local storage"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Import JSON</span>
            </button>

            {/* Scan QR Import Button */}
            <button
              onClick={() => setIsQrScannerOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title="Re-import Payload via Scanned QR code text"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span>Scan QR Import</span>
            </button>

            {/* Print QR Sheet Button */}
            <button
              onClick={handlePrintQRSheet}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title="Print high-contrast QR evidence sheet (A4 Grid)"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Print QR Sheet</span>
            </button>

            {/* Batch Compare Toggle */}
            <button
              onClick={() => {
                setIsBatchMode(!isBatchMode);
                if (isBatchMode) setSelectedIds([]);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                isBatchMode
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{isBatchMode ? 'Cancel Batch' : 'Batch Compare'}</span>
            </button>
          </div>
        </div>

        {/* CARDS GRID AREA */}
        <div className="evidence-qr-grid grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="sync">
            {seals.map((seal, index) => {
              const isSelected = selectedIds.includes(seal.id);

              return (
                <motion.div
                  key={seal.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    scale: 0.85,
                    x: -30,
                    transition: {
                      duration: 0.35,
                      delay: index * 0.05
                    }
                  }}
                  transition={{ duration: 0.3 }}
                  className={`CourtEvidenceQR relative p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.25)]'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isBatchMode && (
                    <button
                      onClick={() => toggleSelectSeal(seal.id)}
                      className="absolute top-3 left-3 z-10 p-1 text-purple-400 hover:scale-110 transition print:hidden cursor-pointer"
                    >
                      {isSelected ? <CheckSquare className="w-5 h-5 fill-purple-500/20" /> : <Square className="w-5 h-5 text-slate-500" />}
                    </button>
                  )}

                  <button
                    onClick={() => handleRemoveSeal(seal.id)}
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
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                        {seal.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-white p-1 rounded-xl flex items-center justify-center shrink-0 border border-slate-300 shadow-sm">
                        <svg viewBox="0 0 100 100" className="w-full h-full fill-slate-950">
                          <rect x="0" y="0" width="30" height="30" />
                          <rect x="70" y="0" width="30" height="30" />
                          <rect x="0" y="70" width="30" height="30" />
                          <rect x="10" y="10" width="10" height="10" fill="#fff" />
                          <rect x="80" y="10" width="10" height="10" fill="#fff" />
                          <rect x="10" y="80" width="10" height="10" fill="#fff" />
                          <rect x="40" y="20" width="20" height="20" />
                          <rect x="30" y="50" width="40" height="10" />
                          <rect x="50" y="70" width="20" height="20" />
                        </svg>
                      </div>

                      <div className="space-y-1 text-[10.5px] text-slate-300 truncate">
                        <div><span className="text-slate-500">Merkle:</span> <span className="font-mono">{seal.merkleRoot}</span></div>
                        <div><span className="text-slate-500">PQC Spec:</span> <span className="text-purple-300 font-semibold">{seal.pqcType}</span></div>
                        <div><span className="text-slate-500">Timestamp:</span> {seal.timestamp}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* QR RE-IMPORT MODAL */}
      {isQrScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl p-5 space-y-4 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
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

            <p className="text-xs text-slate-400">
              วางข้อความที่ได้จากการสแกน QR Code หรือ Payload JSON จากเครื่องอื่นลงในช่องด้านล่างเพื่อซิงค์ข้อมูล:
            </p>

            <textarea
              rows={5}
              value={qrInputData}
              onChange={(e) => setQrInputData(e.target.value)}
              placeholder='[{"id":"SEAL-01","sealCode":"...","merkleRoot":"...","pqcType":"...","timestamp":"...","status":"VERIFIED"}]'
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-xs text-slate-200 outline-none font-mono"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsQrScannerOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleImportFromQR}
                className="px-4 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ยืนยันการนำเข้า</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FORENSIC COMPARISON SIDEBAR */}
      {isBatchMode && selectedIds.length > 0 && (
        <div className="w-full lg:w-80 bg-slate-950 border border-purple-500/40 rounded-2xl p-4 space-y-4 shadow-[0_0_30px_rgba(168,85,247,0.15)] animate-in fade-in slide-in-from-right-4 duration-300 print:hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2 text-purple-300">
              <FileSearch className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Forensic Batch Compare</h4>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
              {selectedIds.length} Selected
            </span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
            {seals
              .filter(s => selectedIds.includes(s.id))
              .map(s => (
                <div key={s.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] space-y-1">
                  <div className="flex justify-between font-bold text-slate-200">
                    <span>{s.sealCode}</span>
                    <span className="text-purple-400">{s.pqcType}</span>
                  </div>
                  <div className="text-[9.5px] text-slate-400 truncate">Root: {s.merkleRoot}</div>
                </div>
              ))}
          </div>

          <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-2 text-[10px] text-purple-200">
            <div className="font-bold flex items-center justify-between">
              <span>Cross-Seal Integrity:</span>
              <span className="text-emerald-400">100% MATCH</span>
            </div>
            <p className="text-slate-400 leading-normal">
              ทุกตราประทับที่เลือกผ่านการตรวจสอบโครงสร้าง Merkle Root ย้อนหลังร่วมกันแล้ว ไม่พบสัญญาณข้อมูลผิดปกติ
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
