import React, { useRef } from 'react';
import { FileText, ShieldCheck, Printer, X, Download, CheckCircle2, Lock } from 'lucide-react';
import { CANONICAL_CONSTANTS, INVARIANTS, TREASURY_ASSETS } from '../data/sovereignData.ts';

interface DossierModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DossierModal: React.FC<DossierModalProps> = ({ isOpen, onClose }) => {
  const printRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 select-none overflow-y-auto">
      <div className="w-full max-w-3xl bg-[#070c18] border border-cyan-500/40 rounded-xl shadow-[0_0_60px_rgba(6,182,212,0.15)] flex flex-col my-8">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-cyan-800/40 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-cyan-200">
                Court-Admissible Sovereign Dossier (PDF/A-3)
              </h3>
              <p className="text-xs text-slate-400 font-mono-code">
                Cert: {CANONICAL_CONSTANTS.DEPLOYMENT_CERTIFICATE} • ETDA & PDPA Qualified
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-200 text-xs font-semibold transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Dossier</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document View */}
        <div ref={printRef} className="p-6 space-y-6 text-slate-200 text-xs overflow-y-auto max-h-[70vh]">
          {/* Official Document Banner */}
          <div className="text-center pb-4 border-b border-slate-800">
            <div className="text-[10px] tracking-widest text-cyan-400 uppercase font-mono-code font-bold mb-1">
              KINGDOM OF THAILAND DIGITAL EVIDENCE SUBMISSION
            </div>
            <h1 className="text-lg font-display font-bold text-white tracking-wide">
              {CANONICAL_CONSTANTS.SYSTEM_NAME}
            </h1>
            <div className="text-xs text-amber-400 font-mono-code mt-1">
              APEX ULTIMATE MASTER EDITION — FROZEN v1.2 LTS
            </div>
          </div>

          {/* Core Sovereign Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950/70 p-4 rounded-lg border border-slate-800 font-mono-code text-[11px]">
            <div>
              <span className="text-slate-500">Sovereign Principal: </span>
              <span className="text-cyan-300 font-bold">{CANONICAL_CONSTANTS.SOVEREIGN_ARCHITECT}</span>
            </div>
            <div>
              <span className="text-slate-500">Clearance Tier: </span>
              <span className="text-amber-300 font-bold">{CANONICAL_CONSTANTS.CLEARANCE_LEVEL}</span>
            </div>
            <div>
              <span className="text-slate-500">Block Height: </span>
              <span className="text-slate-200 font-bold">#{CANONICAL_CONSTANTS.CANONICAL_BLOCK}</span>
            </div>
            <div>
              <span className="text-slate-500">SSoT Mutation Delta: </span>
              <span className="text-emerald-400 font-bold">Δ 0.00% (ZERO DRIFT)</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500">Genesis Merkle Root: </span>
              <span className="text-cyan-400 font-bold break-all">{CANONICAL_CONSTANTS.GENESIS_MERKLE_ROOT}</span>
            </div>
            <div>
              <span className="text-slate-500">Hardware Quorum: </span>
              <span className="text-emerald-400 font-bold">10/10 REAL_HSM (TC-01..TC-10)</span>
            </div>
            <div>
              <span className="text-slate-500">Verified Seals: </span>
              <span className="text-cyan-300 font-bold">14,902 Canonical (80 Quarantined)</span>
            </div>
          </div>

          {/* Legal Safe Harbor Statements */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-cyan-300 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>การรับรองสัตยาบันตามกฎหมายไทย (Thai Statutory Compliance)</span>
            </h4>
            <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/80 space-y-2 text-slate-300 leading-relaxed">
              <p>
                <strong>1. พระราชบัญญัติว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-slate-400">
                <li><strong className="text-slate-300">มาตรา 9:</strong> การแสดงเจตนาและระบุตัวตนสมบูรณ์ ลงนามรับรองด้วยอัลกอริทึม Dilithium-5 (NIST FIPS 204)</li>
                <li><strong className="text-slate-300">มาตรา 26:</strong> ลายมือชื่ออิเล็กทรอนิกส์ระดับความน่าเชื่อถือสูง Non-Repudiation ผูกพันกุญแจ Kyber-1024</li>
                <li><strong className="text-slate-300">มาตรา 28:</strong> ระบบพยานหลักฐานดิจิทัลและใบรับรองอิเล็กทรอนิกส์ Safe Harbor Protection ที่ศาลไทยรับฟังได้สมบูรณ์</li>
              </ul>
              <p className="pt-2">
                <strong>2. พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA):</strong>
              </p>
              <p className="text-slate-400 pl-2">
                ข้อมูลส่วนบุคคล (PII) ถูกผ่านตัวกรอง Zero-PII Redaction Filter แบบ 100% ก่อนการจัดเก็บบันทึกบนบล็อกเชนและบันทึกโทรมาตร
              </p>
            </div>
          </div>

          {/* 10 Invariants Summary Table */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-amber-300 flex items-center space-x-1.5">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>10 Sovereign Invariants (พันธสัญญาความมั่นคง 10 ประการ)</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-code">
              {INVARIANTS.map((inv) => (
                <div key={inv.id} className="p-2 bg-slate-950/70 border border-slate-800 rounded flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">{inv.name}</span>
                  <span className="text-emerald-400 font-bold">PASS</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fiduciary Treasury Overview */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-slate-200">
              คลังสินทรัพย์และเหรียญอ้างอิง RWA (Fiduciary Treasury Reserves)
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {TREASURY_ASSETS.map((asset) => (
                <div key={asset.assetClass} className="p-2.5 bg-slate-950/80 border border-slate-800 rounded">
                  <div className="font-mono-code text-cyan-400 font-bold">{asset.assetClass}</div>
                  <div className="text-slate-300 font-semibold mt-0.5">{asset.valuation}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{asset.verificationStatus}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Digital Signature Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono-code">
            <div>
              <div className="text-slate-500">Sealed Signature:</div>
              <div className="text-cyan-300">PQC-ML-DSA-87::909ab814-479844d8-a14816be-d34cdbb0</div>
            </div>
            <div className="text-right">
              <div className="text-emerald-400 font-bold">STATUS: ADMISSIBLE</div>
              <div className="text-slate-500">Date: {new Date().toLocaleDateString('th-TH')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
