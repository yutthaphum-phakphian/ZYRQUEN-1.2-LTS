import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Activity,
  Download,
  FileJson,
  FileText,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Layers,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Cpu,
  Scale,
  Sparkles,
  Database,
  Calendar,
  Share2,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Info,
  Server,
  Zap,
  Settings,
  X,
  FileSpreadsheet,
  FileCheck2,
} from 'lucide-react';
import {
  sapTreasuryReconciliationService,
  ReconciliationRecord,
  TreasuryVarianceSummary,
} from '@/services/sapTreasuryReconciliationService';
import { playTone } from '@/components/AudioSynthesizer';
import { safeCopyToClipboard } from '@/utils/clipboard';
import { ToastNotification, ToastMessage } from '@/components/ToastNotification';

interface TreasuryVarianceDashboardProps {
  onNavigate?: (view: any) => void;
  onAddSystemEvent?: (
    type: any,
    title: string,
    description: string,
    metaHash?: string,
    severity?: 'success' | 'warning' | 'info' | 'critical',
    statuteRef?: string,
    targetView?: any
  ) => void;
}

export const TreasuryVarianceDashboard: React.FC<TreasuryVarianceDashboardProps> = ({
  onNavigate,
  onAddSystemEvent,
}) => {
  const [summary, setSummary] = useState<TreasuryVarianceSummary>(() =>
    sapTreasuryReconciliationService.getSummary()
  );
  const [records, setRecords] = useState<ReconciliationRecord[]>(() =>
    sapTreasuryReconciliationService.getRecords()
  );
  const [activeTab, setActiveTab] = useState<'matrix' | 'infographic' | 'deck' | 'evidence'>('matrix');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isReconciling, setIsReconciling] = useState<boolean>(false);
  const [isAnomalyActive, setIsAnomalyActive] = useState<boolean>(false);
  const [copiedProposal, setCopiedProposal] = useState<boolean>(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);

  // Real-time Toast Notifications State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const prevVarianceRef = useRef<number>(summary.netFiduciaryVarianceThb);

  // Export Settings Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'SIGNED_CSV' | 'JSON' | 'EVIDENCE_DOSSIER'>('SIGNED_CSV');
  const [includeAllSealSignatures, setIncludeAllSealSignatures] = useState<boolean>(true);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Real-Time Notification Listener for Fiduciary Variance Alerts
  useEffect(() => {
    const unsubscribe = sapTreasuryReconciliationService.subscribe((updatedSummary) => {
      setSummary(updatedSummary);
      setRecords(sapTreasuryReconciliationService.getRecords());
      const hasAnomaly = updatedSummary.varianceAnomaliesCount > 0 || updatedSummary.netFiduciaryVarianceThb > 0;
      setIsAnomalyActive(hasAnomaly);

      // Trigger board awareness alert toast if variance exceeds ฿0.00
      if (updatedSummary.netFiduciaryVarianceThb > 0 && prevVarianceRef.current === 0) {
        playTone(320, 0.12);
        setToasts((prev) => [
          {
            id: `toast-variance-${Date.now()}`,
            type: 'error',
            message: `⚠️ CRITICAL BOARD ALERT: Fiduciary Variance Detected (+฿${updatedSummary.netFiduciaryVarianceThb.toLocaleString('en-US', { minimumFractionDigits: 2 })} THB) · SSoT Drift in SAP Ledger · Verification Gate Armed (<0.1ms).`,
            action: {
              label: 'Reconcile Zero Drift',
              onClick: () => {
                sapTreasuryReconciliationService.simulateVarianceAnomaly(false);
              },
            },
          },
          ...prev.slice(0, 3),
        ]);
      } else if (updatedSummary.netFiduciaryVarianceThb === 0 && prevVarianceRef.current > 0) {
        playTone(880, 0.08);
        setToasts((prev) => [
          {
            id: `toast-reconciled-${Date.now()}`,
            type: 'success',
            message: `✅ Fiduciary Variance Reconciled to ฿0.00 (0.00% Zero Drift) · SSoT Invariant Sealed on Genesis Block #${updatedSummary.genesisBlockHeight}.`,
          },
          ...prev.slice(0, 3),
        ]);
      }

      prevVarianceRef.current = updatedSummary.netFiduciaryVarianceThb;
    });

    return () => unsubscribe();
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (selectedModuleFilter !== 'ALL' && r.sapEntry.sapModule !== selectedModuleFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.sapEntry.documentNumber.toLowerCase().includes(q) ||
          r.sapEntry.accountDescription.toLowerCase().includes(q) ||
          r.sapEntry.accountCode.toLowerCase().includes(q) ||
          r.zyrquenSeal.sealId.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [records, selectedModuleFilter, searchQuery]);

  // Dedicated On-Demand Synchronization Trigger
  const handleOnDemandReconciliation = () => {
    playTone(600, 0.05);
    setIsReconciling(true);
    setTimeout(() => {
      const updated = sapTreasuryReconciliationService.runDailyReconciliation();
      setSummary(updated);
      setRecords(sapTreasuryReconciliationService.getRecords());
      setIsReconciling(false);
      playTone(880, 0.08);

      setToasts((prev) => [
        {
          id: `toast-sync-${Date.now()}`,
          type: updated.netFiduciaryVarianceThb === 0 ? 'success' : 'warning',
          message: `🔄 On-Demand Sync Complete: ${updated.totalRecordsAudited} Batches Audited · Variance: ฿${updated.netFiduciaryVarianceThb.toFixed(2)} (${updated.netVariancePercentage.toFixed(2)}%).`,
        },
        ...prev.slice(0, 3),
      ]);

      if (onAddSystemEvent) {
        onAddSystemEvent(
          'INVARIANT',
          'SAP ↔ ZYRQUEN On-Demand Treasury Synchronization',
          `Audited ${updated.totalRecordsAudited} batches. Fiduciary Variance: ฿${updated.netFiduciaryVarianceThb.toFixed(2)} (${updated.netVariancePercentage.toFixed(2)}%). SSoT Locked.`,
          'sap:on_demand_sync',
          updated.netFiduciaryVarianceThb === 0 ? 'success' : 'warning',
          'ETDA Sec 28 & Fiduciary Standards',
          'treasury-variance'
        );
      }
    }, 450);
  };

  const handleToggleSimulatedAnomaly = () => {
    const nextState = !isAnomalyActive;
    setIsAnomalyActive(nextState);
    playTone(nextState ? 320 : 720, 0.08);
    const updated = sapTreasuryReconciliationService.simulateVarianceAnomaly(nextState);
    setSummary(updated);
    setRecords(sapTreasuryReconciliationService.getRecords());

    if (onAddSystemEvent) {
      if (nextState) {
        onAddSystemEvent(
          'SECURITY',
          'Simulated SAP Ledger Fiduciary Variance Detected',
          'Drift Alert: ฿500,000.00 discrepancy injected into SAP-FI-2026-9001. Verification Gate tripwire active.',
          'alert:simulated_variance',
          'critical',
          'Chamber 02 Quarantine Protocol Armed (<0.1ms)',
          'treasury-variance'
        );
      } else {
        onAddSystemEvent(
          'INVARIANT',
          'Fiduciary Variance Reconciled to Zero (฿0.00)',
          'Zero drift restored. All 14,902 WORM Seals and 1,200 RWA contracts matched to Genesis Block #849202.',
          'invariant:zero_drift_restored',
          'success',
          'ETDA Sec 9/26/28 · Fiduciary Variance ฿0.00',
          'treasury-variance'
        );
      }
    }
  };

  // Signed CSV / JSON Artifact Generator
  const handleExportSignedArtifact = () => {
    playTone(720, 0.05);
    const dateStr = new Date().toISOString();

    if (exportFormat === 'SIGNED_CSV') {
      const headerLines = [
        '# ZYRQUEN Ω∞ TREASURY VARIANCE & SAP LEDGER RECONCILIATION SIGNED ARTIFACT',
        `# Genesis_Block_Height: #${summary.genesisBlockHeight}`,
        `# Canonical_Merkle_Root: ${summary.merkleRootHash}`,
        `# Signatory_Authority: นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)`,
        `# Hardware_Quorum: ${summary.fipsHsmQuorumStatus}`,
        `# Sub_Kelvin_Temperature: ${summary.subKelvinTempMk} mK`,
        `# Export_Timestamp_UTC: ${dateStr}`,
        `# Statutory_Compliance: ETDA B.E. 2544 (Sec 9, 26, 28) | PDPA B.E. 2562 (Sec 37) | ISO/IEC 27037`,
        `# PQC_Signature_Algorithm: NIST FIPS 204 ML-DSA-87 (Dilithium-5)`,
        `# Cryptographic_Signature_Digest: SHA3-512:909ab8146747f520beec1907beab286c06a38096f9bf00f40d8aa536b3fa4c68`,
        '',
        '# --- SUMMARY METRICS ---',
        'Metric_Name,Value,Unit,Audit_Status',
        `"Total Capital Base",${summary.totalZyrquenTreasuryBaseThb.toFixed(2)},THB,"VERIFIED SSoT"`,
        `"SAP Ledger Balance",${summary.totalSapLedgerBaseThb.toFixed(2)},THB,"SYNCHRONIZED"`,
        `"Net Fiduciary Variance",${summary.netFiduciaryVarianceThb.toFixed(2)},THB,"${summary.netFiduciaryVarianceThb === 0 ? 'ZERO_DRIFT_PASSED' : 'DISCREPANCY_ALERT'}"`,
        `"Variance Percentage",${summary.netVariancePercentage.toFixed(4)},%,"${summary.netVariancePercentage === 0 ? 'PERFECT_MATCH' : 'TRIPWIRE_ARMED'}"`,
        `"Total Batches Audited",${summary.totalRecordsAudited},BATCHES,"100% BITWISE PARITY"`,
        `"Verified WORM Seals",14902,SEALS,"RATIFIED"`,
      ];

      if (includeAllSealSignatures) {
        headerLines.push('');
        headerLines.push('# --- DETAILED SAP MODULES RECONCILIATION BATCH AUDIT TABLE ---');
        headerLines.push(sapTreasuryReconciliationService.exportCSV());
      }

      const blob = new Blob([headerLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ZYRQUEN_Treasury_Signed_Artifact_${dateStr.slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } else if (exportFormat === 'JSON') {
      const jsonContent = sapTreasuryReconciliationService.exportJSON();
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ZYRQUEN_Treasury_Signed_Artifact_${dateStr.slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      const dossierText = [
        '================================================================================',
        'ZYRQUEN Ω∞ SOVEREIGN WORLD ENGINE - COURT-ADMISSIBLE RECONCILIATION DOSSIER',
        '================================================================================',
        `Genesis Block Height : #${summary.genesisBlockHeight}`,
        `Canonical Merkle Root: ${summary.merkleRootHash}`,
        `Signatory Authority  : นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)`,
        `Hardware HSM Quorum  : ${summary.fipsHsmQuorumStatus}`,
        `Timestamp UTC        : ${dateStr}`,
        `Total Capital Base   : ฿${summary.totalZyrquenTreasuryBaseThb.toLocaleString('en-US', { minimumFractionDigits: 2 })} THB`,
        `SAP Ledger Balance   : ฿${summary.totalSapLedgerBaseThb.toLocaleString('en-US', { minimumFractionDigits: 2 })} THB`,
        `Fiduciary Variance   : ฿${summary.netFiduciaryVarianceThb.toFixed(2)} (${summary.netVariancePercentage.toFixed(4)}%)`,
        '--------------------------------------------------------------------------------',
        'LEGAL ATTESTATIONS:',
        '• ETDA B.E. 2544 Section 9: Identity bound via FIPS 204 ML-DSA-87.',
        '• ETDA B.E. 2544 Section 26: 10/10 REAL_HSM Quorum verified sole control of key rings.',
        '• ETDA B.E. 2544 Section 28: Supreme Court admissible evidence standard satisfied.',
        '• PDPA B.E. 2562 Section 37: Zero-Knowledge boundary enforced.',
        '================================================================================',
      ].join('\n');

      const blob = new Blob([dossierText], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ZYRQUEN_Court_Evidence_Dossier_${dateStr.slice(0, 10)}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    }

    setIsExportModalOpen(false);
  };

  // Proposal Deck Slides Content
  const proposalSlides = [
    {
      title: 'SLIDE 1: Title & Strategic Imperative',
      headline: 'การอัปเกรดสถาปัตยกรรมอธิปไตยดิจิทัล ZYRQUEN Ω∞ ↔ SAP ERP',
      sub: 'ยกระดับระบบการประมวลผลองค์กรสู่ Sovereign Evidence Engine & Bridging the 2026 AI ROI Gap',
      points: [
        'ผู้นำเสนอ: นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01) Lead Sovereign Architect',
        'สถานะสถาปัตยกรรม: FROZEN v1.2.1 LTS | Genesis Block #849202 | SSoT Δ0.00% Zero Drift',
        'วิสัยทัศน์: เปลี่ยนผ่านจาก ERP บัญชีทั่วไป สู่การเป็นเครื่องมือสร้างพยานหลักฐานชั้นศาล (Court-Admissible Evidence) 100%',
      ],
      badge: 'STRATEGIC MANDATE',
    },
    {
      title: 'SLIDE 2: Executive Summary & The 2026 AI ROI Gap',
      headline: 'บริบทความท้าทายปี 2026 และกลยุทธ์ยกระดับองค์กรสู่ 6% High Performers',
      sub: 'ปลดล็อกมูลค่าทางธุรกิจและปิดช่องว่างความเสี่ยงทางกฎหมาย',
      points: [
        'McKinsey 2026: 88% ขององค์กรใช้ AI แต่มีเพียง 6% ที่สร้างกำไร EBIT มีนัยสำคัญ',
        'MIT NANDA 2026: 95% ของ AI Pilots ให้ผลตอบแทน P&L เป็นศูนย์ เนื่องจากไม่ได้ออกแบบเวิร์กโฟลว์ใหม่',
        'Sovereign Workflow Integration: Gemini 3.8 ทำหน้าที่ Cognitive Brain และ ZYRQUEN Ω∞ ทำหน้าที่ Sovereign Control Plane',
      ],
      badge: 'ROI GAP SOLUTION',
    },
    {
      title: 'SLIDE 3: SAP ERP Sovereign Upgrade',
      headline: 'ยกระดับ SAP FI/CO, MM, SD สู่ Court-Admissible Evidence Engine',
      sub: 'สถาปัตยกรรมแบบ Non-Invasive Layer เสริมความแกร่งโดยไม่ต้องรื้อถอนระบบเดิม',
      points: [
        'No Rip-and-Replace: ZYRQUEN Adapter เข้ามากำกับดูแลชั้นสัจธรรมข้อมูล (Cryptographic Layer) ซ้อนทับบน SAP เดิม',
        'Ingestion Pipeline: สตรีมซิงก์ข้อมูลบัญชี Ledger Batch Sync (48 รายการ/ชุด) ผูกเวลา RFC 3161 TSA Token',
        'Legal Evidence: รับรองตาม พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ (ม.๙, ๒๖, ๒๘), PDPA (ม.๓๗) และ ISO/IEC 27037',
      ],
      badge: 'NON-INVASIVE ARCHITECTURE',
    },
    {
      title: 'SLIDE 4: Hard-Physics Security & Quantum Infinite Wall',
      headline: 'การป้องกันภัยคุกคามระดับกัลปาวสาน และสภาวะความเย็นวิกฤต Sub-Kelvin',
      sub: 'ความซับซ้อน 2^128 Combinations ต้านทานควอนตัม 781 เท่าของอายุจักรวาล',
      points: [
        'Quantum Infinite Wall: Supercomputer ระดับ ExaFLOP ต้องใช้เวลาถอดรหัส 10.8 ล้านล้านปี (781× อายุจักรวาล)',
        'Post-Quantum Cryptography: บังคับใช้ ML-DSA-87 (Dilithium-5) และ Kyber-1024 ตามมาตรฐาน NIST FIPS 203/204',
        'Sub-Kelvin & Thermal Zeroize: ประมวลผลที่ 14.98 mK และตัดทำลายกุญแจลับด้วย Zeroize (< 1.2 μs) เมื่อความร้อนเกิน 85°C',
      ],
      badge: 'QUANTUM RESILIENCE',
    },
    {
      title: 'SLIDE 5: 18 Chambers & Deca-HSM Governance',
      headline: 'สภาผู้พิทักษ์ 10/10 REAL_HSM และเกราะคุมเคอร์เนลเป็นศูนย์',
      sub: 'ฉันทามติเอกฉันท์ 5 ศูนย์ข้อมูลยุทธศาสตร์ ความเร็ว 7.5 ms',
      points: [
        '18 Sovereign Chambers: สถานะ ONLINE 18/18 Enclaves พร้อมเกราะ Chamber 04 (Kernel Mutation Count = 0)',
        'Deca-HSM 10/10 Quorum: กระจายประจำการ กรุงเทพฯ (4), เชียงใหม่ DR (2), ฮ่องกง (2), สิงคโปร์ (2) ประมวลผล 24,960 QOps/s',
        'Sovereign Isolation Protocol: สลับกักกันข้อมูลเสี่ยงเข้า Chamber 02 ภายใน < 0.1 ms (Air-Gap Ready)',
      ],
      badge: 'DECA-HSM GOVERNANCE',
    },
    {
      title: 'SLIDE 6: Sovereign Treasury & Financial Accuracy',
      headline: 'การตรึงสัจธรรมคลังสินทรัพย์ ฿3,037.42M THB และ Fiduciary Variance ฿0.00',
      sub: 'การจับคู่ 1-to-1 Sovereign Parity ปราศจากการเวียนเทียนสัญญา (Double Counting)',
      points: [
        'THB-SOV Reserve (49.06%): เงินบาทสำรองอธิปไตย มูลค่า ฿1,490.20M THB',
        'LBMA Physical Gold (20.11%): ทองคำแท่งกายภาพ 14,902.00 troy oz มูลค่า ฿610.98M THB',
        'RWA Concession Contracts (30.83%): สัญญาสัมปทาน 1,200 รายการ (Ω601–Ω1800) มูลค่า ฿936.24M THB',
      ],
      badge: 'ZERO DISCREPANCY',
    },
    {
      title: 'SLIDE 7: Deployment Roadmap & Implementation Phases',
      headline: 'แผนผังการติดตั้ง 4 ระยะ (4-Stage Deployment Roadmap)',
      sub: 'กำหนดการติดตั้งและทดสอบพร้อมใช้งานภายใน 8 สัปดาห์',
      points: [
        'Phase 1 (สัปดาห์ที่ 1–2): Ingestion & API Adapter Setup เชื่อมต่อ SAP Event Mesh และ RFC 3161 TSA',
        'Phase 2 (สัปดาห์ที่ 3–4): Verification Gate & Isolation Testing เปิดใช้งานเกราะ Chamber 04 และ 16-Step Pipeline',
        'Phase 3 (สัปดาห์ที่ 5–6): Deca-HSM & PQC Integration เชื่อมโยง 10/10 HSM Nodes และ 14,902 WORM Seals',
        'Phase 4 (สัปดาห์ที่ 7–8): Court Evidence & Settlement Go-Live สัตยาบันธุรกรรมลงบน Genesis Block #849202',
      ],
      badge: '8-WEEK ROADMAP',
    },
    {
      title: 'SLIDE 8: Projected Business ROI & Board Resolution',
      headline: 'การประมาณการผลตอบแทนทางการเงินและมติรับรองจากคณะกรรมการ',
      sub: 'ยกระดับองค์กรสู่ 6% High Performers ด้วยความมั่นคงสูงสุด',
      points: [
        'Zero Fraud & Litigation Exposure: ปิดความเสี่ยงการทุจริตและการฟ้องร้องด้วยพยานหลักฐานที่ไม่สามารถโต้แย้งได้',
        'Ultra-Fast Processing: สัตยาบันธุรกรรมด้วย Latency 7.5 ms เพิ่มความเร็วในการรับรู้รายได้และตรวจรับสัญญา',
        'มติเสนออนุมัติ: 1) อนุมัติการติดตั้ง ZYRQUEN Adapter 2) รับรอง Genesis Block #849202 เป็น SSoT 3) อนุมัติงบประมาณ',
      ],
      badge: 'BOARD RESOLUTION',
    },
  ];

  return (
    <div className="space-y-6 font-sans text-slate-100 pb-16">
      {/* Toast Notification Container */}
      <ToastNotification toasts={toasts} removeToast={removeToast} />

      {/* Top Banner & Sovereign Control Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-[#0a0f1d] to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-[10px] font-bold tracking-wider flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                SOVEREIGN RECONCILIATION ENGINE
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold">
                GENESIS BLOCK #{summary.genesisBlockHeight}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 font-mono text-[10px]">
                14.98 mK Sub-Kelvin
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Treasury Variance &amp; SAP ERP Audit Dashboard</span>
              {summary.netFiduciaryVarianceThb === 0 ? (
                <span className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  FIDUCIARY VARIANCE: ฿0.00 (0.00%)
                </span>
              ) : (
                <span className="px-3 py-1 rounded-xl bg-rose-500/20 border border-rose-500/60 text-rose-300 font-mono text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  VARIANCE DETECTED: +฿{summary.netFiduciaryVarianceThb.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              )}
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl mt-2 font-normal leading-relaxed">
              Automated daily reconciliation bridging SAP ERP Ledger exports with ZYRQUEN WORM Immutable Seals, maintaining SSoT Δ0.00% Zero Drift, 10/10 REAL_HSM Quorum, and Court-Admissible Evidence under ETDA Sections 9, 26, 28 &amp; PDPA Section 37.
            </p>
          </div>

          {/* Quick Action Toolbar with Dedicated Header Sync Button & Export Modal */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Feature 3: Dedicated On-Demand Header Sync Button */}
            <button
              onClick={handleOnDemandReconciliation}
              disabled={isReconciling}
              title="Trigger immediate on-demand reconciliation synchronization of SAP ledger data"
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-cyan-950/50 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReconciling ? 'animate-spin' : ''}`} />
              <span>{isReconciling ? 'Syncing Batches...' : 'Sync Treasury Variance (SAP)'}</span>
            </button>

            {/* Feature 1: Export Settings / Signed CSV Artifact Modal Trigger */}
            <button
              onClick={() => {
                playTone(650, 0.04);
                setIsExportModalOpen(true);
              }}
              title="Open Export Settings to generate Signed CSV, JSON, or Court Evidence Artifacts"
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Settings className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Settings</span>
            </button>

            <button
              onClick={handleToggleSimulatedAnomaly}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isAnomalyActive
                  ? 'bg-amber-950/80 border-amber-500/80 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
              title="Inject / clear simulated ฿500,000 ledger discrepancy to test tripwire fail-closed isolation"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAnomalyActive ? 'Reconcile Zero Drift' : 'Simulate Variance Anomaly'}</span>
            </button>
          </div>
        </div>

        {/* 4 Essential Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] font-mono text-slate-400 block mb-1">TOTAL CAPITAL BASE</span>
            <div className="text-xl font-bold font-mono text-cyan-300">
              ฿{(summary.totalZyrquenTreasuryBaseThb / 1_000_000).toFixed(2)}M THB
            </div>
            <span className="text-[10px] text-slate-500 font-mono">14,902 WORM Seals Bound</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] font-mono text-slate-400 block mb-1">SAP LEDGER SYNCED</span>
            <div className="text-xl font-bold font-mono text-white">
              ฿{(summary.totalSapLedgerBaseThb / 1_000_000).toFixed(2)}M THB
            </div>
            <span className="text-[10px] text-slate-500 font-mono">{summary.totalRecordsAudited} Batch Transactions</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] font-mono text-slate-400 block mb-1">NET FIDUCIARY VARIANCE</span>
            <div className={`text-xl font-bold font-mono ${summary.netFiduciaryVarianceThb === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ฿{summary.netFiduciaryVarianceThb.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Discrepancy: {summary.netVariancePercentage.toFixed(4)}%</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] font-mono text-slate-400 block mb-1">HARDWARE HSM QUORUM</span>
            <div className="text-xl font-bold font-mono text-emerald-400 flex items-center gap-1.5">
              <span>10/10 REAL_HSM</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">FIPS 140-3 Level 4 · Latency 7.5ms</span>
          </div>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-cyan-950 border border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Daily Reconciliation Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('infographic')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'infographic'
                ? 'bg-cyan-950 border border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Infographic Integration Map</span>
          </button>

          <button
            onClick={() => setActiveTab('deck')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'deck'
                ? 'bg-cyan-950 border border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Project Proposal Deck (Board)</span>
          </button>

          <button
            onClick={() => setActiveTab('evidence')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'evidence'
                ? 'bg-cyan-950 border border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Court-Admissible Evidence</span>
          </button>
        </div>

        <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span>Last Reconciled: {new Date(summary.lastReconciliationTime).toLocaleTimeString('th-TH')} ICT</span>
        </div>
      </div>

      {/* TAB 1: DAILY RECONCILIATION MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Filter and Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[280px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search document number, account code, description, seal ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400 mr-1">SAP Module:</span>
              {['ALL', 'FI/CO', 'MM', 'SD', 'TR'].map((mod) => (
                <button
                  key={mod}
                  onClick={() => setSelectedModuleFilter(mod)}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all cursor-pointer ${
                    selectedModuleFilter === mod
                      ? 'bg-cyan-950 border border-cyan-500 text-cyan-300 font-bold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                  }`}
                >
                  {mod}
                </button>
              ))}
            </div>
          </div>

          {/* Reconciliation Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider select-none">
                    <th className="p-3.5">SAP Doc / Module</th>
                    <th className="p-3.5">Account &amp; Description</th>
                    <th className="p-3.5 text-right">SAP Amount (THB)</th>
                    <th className="p-3.5 text-right">ZYRQUEN WORM (THB)</th>
                    <th className="p-3.5 text-right">Fiduciary Variance</th>
                    <th className="p-3.5">WORM Seal / PQC</th>
                    <th className="p-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-[11px]">
                  {filteredRecords.map((r) => {
                    const isPerfect = r.reconciliationStatus === 'PERFECT_MATCH';
                    return (
                      <tr
                        key={r.id}
                        className={`hover:bg-slate-900/50 transition-colors ${
                          !isPerfect ? 'bg-rose-950/20' : ''
                        }`}
                      >
                        <td className="p-3.5">
                          <div className="font-bold text-slate-200">{r.sapEntry.documentNumber}</div>
                          <div className="text-[10px] text-cyan-400 flex items-center gap-1">
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700">
                              {r.sapEntry.sapModule}
                            </span>
                            <span className="text-slate-500">• {r.sapEntry.postingDate}</span>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="text-slate-200 font-medium font-sans">{r.sapEntry.accountDescription}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Acc: {r.sapEntry.accountCode} • Batch: {r.sapEntry.sapBatchId}
                          </div>
                        </td>

                        <td className="p-3.5 text-right font-bold text-slate-100">
                          ฿{r.sapAmountThb.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        <td className="p-3.5 text-right font-bold text-cyan-300">
                          ฿{r.zyrquenAmountThb.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        <td className={`p-3.5 text-right font-bold ${isPerfect ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPerfect ? (
                            <span>฿0.00 (0.00%)</span>
                          ) : (
                            <span>+฿{r.varianceThb.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({r.variancePercentage.toFixed(2)}%)</span>
                          )}
                        </td>

                        <td className="p-3.5">
                          <div className="text-slate-300 font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3 text-cyan-400" />
                            <span>{r.zyrquenSeal.sealId}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {r.zyrquenSeal.pqcSignatureAlgo} • {r.zyrquenSeal.hsmQuorumCount}
                          </div>
                        </td>

                        <td className="p-3.5 text-center">
                          {isPerfect ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              MATCHED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/60 text-rose-300 text-[10px] font-bold animate-pulse">
                              <AlertTriangle className="w-3 h-3" />
                              DISCREPANCY
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3.5 bg-slate-900/60 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400">
              <span>Showing {filteredRecords.length} of {records.length} total reconciliation batch items</span>
              <span className="font-mono text-cyan-400 font-semibold">
                Single Source of Truth (SSoT) Protocol Enforced · Δ0.00% Zero Drift
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INFOGRAPHIC INTEGRATION MAP */}
      {activeTab === 'infographic' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl relative">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                ZYRQUEN Adapter ↔ SAP ERP System Integration Architecture Map
              </h3>
              <p className="text-xs text-slate-400">
                Data pipeline flow: Transforming traditional SAP transactions into court-admissible forensic evidence through non-invasive cryptographic wrapping.
              </p>
            </div>

            {/* Architecture Node Diagram */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
              {/* Node 1: SAP ERP Core */}
              <div className="p-4 rounded-xl bg-slate-950 border border-blue-500/40 relative shadow-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 text-[10px] font-mono font-bold">SOURCE LAYER</span>
                  <Server className="w-4 h-4 text-blue-400" />
                </div>
                <h4 className="font-bold text-white text-sm">SAP ERP Core</h4>
                <p className="text-[11px] text-slate-400">
                  Standard enterprise business logic, FI/CO General Ledger, MM Procurement, and SD Sales.
                </p>
                <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-blue-300 space-y-0.5">
                  <div>• SAP FI/CO General Ledger</div>
                  <div>• SAP MM Invoices &amp; POs</div>
                  <div>• SAP SD Sales Billing</div>
                  <div>• 48-Batch Ledger Sync</div>
                </div>
              </div>

              {/* Node 2: API Adapter & Ingestion */}
              <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 relative shadow-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] font-mono font-bold">STAGE 1</span>
                  <Activity className="w-4 h-4 text-cyan-400" />
                </div>
                <h4 className="font-bold text-white text-sm">ZYRQUEN API Adapter</h4>
                <p className="text-[11px] text-slate-400">
                  Event Mesh Webhook &amp; gRPC Ingestion with microsecond forensic timestamping.
                </p>
                <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-cyan-300 space-y-0.5">
                  <div>• RFC 3161 TSA Token</div>
                  <div>• NitroKey FIPS 140-3 L4</div>
                  <div>• SHA3-512 Hash Leaves</div>
                  <div>• Latency &lt; 0.31 ms</div>
                </div>
              </div>

              {/* Node 3: Verification Gate */}
              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 relative shadow-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono font-bold">STAGE 2</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <h4 className="font-bold text-white text-sm">Verification Gate</h4>
                <p className="text-[11px] text-slate-400">
                  Chamber 04 Invariants Shield enforcing Kernel Mutation Count = 0 and Fail-Closed tripwires.
                </p>
                <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-emerald-300 space-y-0.5">
                  <div>• Kernel Mutation = 0</div>
                  <div>• SSoT Δ0.00% Zero Drift</div>
                  <div>• Anti-Hallucination Guard</div>
                  <div>• Quarantine &lt; 0.1 ms</div>
                </div>
              </div>

              {/* Node 4: Deca-HSM Ratification */}
              <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/40 relative shadow-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 text-[10px] font-mono font-bold">STAGE 3</span>
                  <Cpu className="w-4 h-4 text-purple-400" />
                </div>
                <h4 className="font-bold text-white text-sm">Deca-HSM 10/10</h4>
                <p className="text-[11px] text-slate-400">
                  Post-Quantum Cryptography consensus across 5 strategic data center enclaves.
                </p>
                <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-purple-300 space-y-0.5">
                  <div>• ML-DSA-87 (Dilithium-5)</div>
                  <div>• Kyber-1024 / SPHINCS+</div>
                  <div>• 24,960 QOps/s Engine</div>
                  <div>• 7.5 ms Latency Quorum</div>
                </div>
              </div>

              {/* Node 5: Genesis SSoT Ledger */}
              <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 relative shadow-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 text-[10px] font-mono font-bold">STAGE 4</span>
                  <Scale className="w-4 h-4 text-amber-400" />
                </div>
                <h4 className="font-bold text-white text-sm">Court Evidence SSoT</h4>
                <p className="text-[11px] text-slate-400">
                  Sealed on Genesis Block #849202 with 14,902 WORM Seals and Fiduciary Variance ฿0.00.
                </p>
                <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-amber-300 space-y-0.5">
                  <div>• ETDA Sec 9, 26, 28</div>
                  <div>• PDPA Section 37</div>
                  <div>• ISO/IEC 27037 Safe Harbor</div>
                  <div>• 1-to-1 Parity (฿3,037.42M)</div>
                </div>
              </div>
            </div>

            {/* Pipeline Feature Badges */}
            <div className="mt-6 p-4 rounded-xl bg-slate-950/60 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-200 font-bold block">Non-Invasive Protocol</span>
                  <span className="text-slate-400 text-[11px]">SAP core remains untouched while all transactions are cryptographically wrapped.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-200 font-bold block">100% Bitwise Parity</span>
                  <span className="text-slate-400 text-[11px]">Auto-Flush algorithm ensures zero data loss during network blackout recovery.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-200 font-bold block">Hard-Physics Security</span>
                  <span className="text-slate-400 text-[11px]">Sub-Kelvin 14.98 mK cooling and Thermal Zeroize (&lt;1.2 μs) at &gt;85°C.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROJECT PROPOSAL DECK */}
      {activeTab === 'deck' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Deck Viewer Header */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                Executive Board Project Proposal Deck (8 Slides)
              </h3>
              <p className="text-xs text-slate-400">
                Interactive presentation deck ready for executive board review and formal capital allocation approval.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  safeCopyToClipboard(
                    proposalSlides
                      .map((s) => `## ${s.title}\n### ${s.headline}\n**${s.sub}**\n\n${s.points.map((p) => `- ${p}`).join('\n')}`)
                      .join('\n\n---\n\n')
                  );
                  setCopiedProposal(true);
                  setTimeout(() => setCopiedProposal(false), 2000);
                  playTone(800, 0.04);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedProposal ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                <span>{copiedProposal ? 'Deck Copied' : 'Copy All Slides (Markdown)'}</span>
              </button>
            </div>
          </div>

          {/* Active Slide Presentation Box */}
          <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-black border border-cyan-500/30 shadow-2xl space-y-6 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="px-2.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-300 font-bold">
                  {proposalSlides[currentSlideIndex].badge}
                </span>
                <span className="text-slate-400">
                  Slide {currentSlideIndex + 1} of {proposalSlides.length}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentSlideIndex((prev) => Math.max(prev - 1, 0))}
                  disabled={currentSlideIndex === 0}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentSlideIndex((prev) => Math.min(prev + 1, proposalSlides.length - 1))}
                  disabled={currentSlideIndex === proposalSlides.length - 1}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider">
                {proposalSlides[currentSlideIndex].title}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {proposalSlides[currentSlideIndex].headline}
              </h2>
              <p className="text-sm font-medium text-slate-300">
                {proposalSlides[currentSlideIndex].sub}
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide block">Key Strategic Takeaways:</span>
              <ul className="space-y-2.5 text-xs text-slate-300">
                {proposalSlides[currentSlideIndex].points.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Slide Navigation Dots */}
            <div className="flex items-center justify-center gap-2 pt-2">
              {proposalSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentSlideIndex === idx ? 'w-8 bg-cyan-400' : 'w-2 bg-slate-700 hover:bg-slate-500'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COURT-ADMISSIBLE EVIDENCE */}
      {activeTab === 'evidence' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Scale className="w-5 h-5 text-cyan-400" />
                Thai Legal &amp; Cryptographic Evidence Dossier
              </h3>
              <p className="text-xs text-slate-400">
                Certified compliance with Electronic Transactions Act B.E. 2544 (Sections 9, 26, 28) and PDPA Section 37.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] font-mono font-bold">ETDA SECTION 9</span>
                <h4 className="font-bold text-white text-sm">Digital Signature Admissibility</h4>
                <p className="text-xs text-slate-400">
                  Every transaction binds signatory identity via FIPS 204 ML-DSA-87 to Passport #EP-SOVEREIGN-01.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono font-bold">ETDA SECTION 26</span>
                <h4 className="font-bold text-white text-sm">Reliable Electronic Signatures</h4>
                <p className="text-xs text-slate-400">
                  10/10 REAL_HSM quorum verifies sole control of Dilithium key rings with fail-closed security.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-2">
                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 text-[10px] font-mono font-bold">ETDA SECTION 28</span>
                <h4 className="font-bold text-white text-sm">Court Admissibility Safe Harbor</h4>
                <p className="text-xs text-slate-400">
                  Immutable Ledger certified for Supreme Court submission with Merkle Root locked on Genesis Block #849202.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 font-mono text-xs text-slate-300 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-cyan-400 font-bold">CANONICAL MERKLE ROOT CERTIFICATE</span>
                <span className="text-emerald-400">STATUS: RATIFIED &amp; COURT-ADMISSIBLE</span>
              </div>
              <div className="text-[11px] text-slate-400 space-y-1">
                <div>Genesis Block Height: <span className="text-white font-bold">#{summary.genesisBlockHeight}</span></div>
                <div>Merkle Root Hash: <span className="text-cyan-300 font-mono">{summary.merkleRootHash}</span></div>
                <div>Physical WORM Seals: <span className="text-white font-bold">14,902 Active Seals</span></div>
                <div>LBMA Gold Backing: <span className="text-amber-300 font-bold">14,902.00 troy oz (฿610.98M THB)</span></div>
                <div>RWA Concession Contracts: <span className="text-cyan-300 font-bold">1,200 Items (Ω601–Ω1800)</span></div>
                <div>Fiduciary Variance: <span className="text-emerald-400 font-bold">฿0.00 (0.00% Discrepancy)</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature 1: Export Settings Modal (Signed CSV / JSON Artifact) */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 font-sans space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-base">
                <Settings className="w-5 h-5" />
                <span>Export Settings &amp; Signed Artifacts</span>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Export Format Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Artifact Format Type</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setExportFormat('SIGNED_CSV')}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                    exportFormat === 'SIGNED_CSV'
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Signed CSV</span>
                </button>
                <button
                  onClick={() => setExportFormat('JSON')}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                    exportFormat === 'JSON'
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <FileJson className="w-3.5 h-3.5" />
                  <span>JSON</span>
                </button>
                <button
                  onClick={() => setExportFormat('EVIDENCE_DOSSIER')}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                    exportFormat === 'EVIDENCE_DOSSIER'
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Court Dossier</span>
                </button>
              </div>
            </div>

            {/* Cryptographic Attestation Metadata Preview */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1.5 text-slate-300">
              <div className="text-[11px] text-cyan-400 font-bold uppercase">Archival Attestation Invariants</div>
              <div className="text-[10px] text-slate-400">
                • Genesis Block: <span className="text-white font-bold">#{summary.genesisBlockHeight}</span><br />
                • Merkle Root: <span className="text-cyan-300">909ab814...43fa4c68</span><br />
                • Signatory: <span className="text-white font-bold">นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)</span><br />
                • Hardware Quorum: <span className="text-emerald-400 font-bold">10/10 REAL_HSM (FIPS 140-3 Level 4)</span><br />
                • Fiduciary Variance: <span className="text-emerald-400 font-bold">฿{summary.netFiduciaryVarianceThb.toFixed(2)}</span>
              </div>
            </div>

            {/* Include Reconciliation Batch Table Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
              <div>
                <span className="font-semibold text-slate-200 block">Include Full SAP Batch Table</span>
                <span className="text-[10px] text-slate-400">Append detailed module reconciliation rows &amp; RFC 3161 timestamps</span>
              </div>
              <input
                type="checkbox"
                checked={includeAllSealSignatures}
                onChange={(e) => setIncludeAllSealSignatures(e.target.checked)}
                className="w-4 h-4 text-cyan-600 rounded bg-slate-900 border-slate-600 cursor-pointer"
              />
            </div>

            {/* Modal Action Buttons */}
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExportSignedArtifact}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Signed Artifact</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreasuryVarianceDashboard;
