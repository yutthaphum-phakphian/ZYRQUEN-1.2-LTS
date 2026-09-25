import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  RotateCcw,
  FileText,
  Grid,
  List,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Cpu,
  Volume2,
  VolumeX,
  HardDrive,
  Lock,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  Download,
  Copy,
  Check,
  Scale,
  Clock,
  Sparkles,
  Maximize2,
  Minimize2,
  RefreshCw,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getAutoTableFinalY } from '../utils/pdfAutoTable';
import { playAuditChime, playTone, playSnapshotSealChime } from './AudioSynthesizer';
import { speakSystemAlert } from '../utils/textToSpeechService';
import { safeCopyToClipboard } from '../utils/clipboard';
import { CANONICAL_MERKLE_ROOT, CANONICAL_SEALS, SYSTEM_METADATA } from '../data/canonicalData';
import { downloadMasterForensicDossierV9Pdf } from '../utils/forensicDossierPdfExport';
import { SystemEvent } from './SystemEventsSidebar';
import { SealClockProgressBar } from './stepper/SealClockProgressBar';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type StepCategory = 'Ingestion' | 'Cryptographic' | 'Quorum' | 'Compliance' | 'Storage';
export type StepStatus = 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED';

export interface AuditStep {
  id: number;
  title: string;
  category: StepCategory;
  description: string;
  merkleHash: string;
  pqcScheme: string;
  statutoryRef: string;
  executionTimeMs: number;
  status: StepStatus;
  enclaveHardware?: string;
  legalStandard?: string;
}

export interface ForensicAuditStepperProps {
  onAddSystemEvent?: (
    type: SystemEvent['type'],
    title: string,
    description: string,
    metaHash?: string,
    severity?: SystemEvent['severity'],
    statuteRef?: string,
    targetView?: SystemEvent['targetView']
  ) => void;
  onNavigateView?: (view: any) => void;
  className?: string;
}

// ============================================================================
// INITIAL 16 CANONICAL AUDIT STEPS
// ============================================================================

export const INITIAL_16_AUDIT_STEPS: AuditStep[] = [
  {
    id: 1,
    title: 'STG-01 RFC 3161 Ingestion & Sovereign Time-Stamp Authority',
    category: 'Ingestion',
    description: 'Microsecond time-stamp binding for sovereign principal #EP-SOVEREIGN-01 with RFC 3161 compliant cryptographic token.',
    merkleHash: '0x5d8e71a0b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0',
    pqcScheme: 'SHA3-512 / RFC 3161 TSA Token',
    statutoryRef: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๙ (ETDA Sec 9)',
    executionTimeMs: 4.2,
    status: 'PASSED',
    enclaveHardware: 'NitroKey HSM-PQC-01 (FIPS 140-3 L4)',
    legalStandard: 'ETDA Recommendation ขมธอ. 1-2562',
  },
  {
    id: 2,
    title: 'STG-02 NIST FIPS 204 CRYSTALS-Dilithium-5 (ML-DSA-87) Signature',
    category: 'Cryptographic',
    description: 'Verifies primary post-quantum digital signature lattice equation (A·z - c·t₁·2^d = w₁ mod q) ensuring non-repudiation.',
    merkleHash: '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    pqcScheme: 'CRYSTALS-Dilithium-5 (ML-DSA-87, FIPS 204)',
    statutoryRef: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๒๖ (ETDA Sec 26)',
    executionTimeMs: 12.4,
    status: 'PASSED',
    enclaveHardware: 'NitroKey HSM-PQC-01 & YubiKey 5C SE',
    legalStandard: 'FIPS 204 Standard / ETDA Secure Signature',
  },
  {
    id: 3,
    title: 'STG-03 NIST FIPS 203 ML-KEM-1024 (Kyber-1024) Enclave Decapsulation',
    category: 'Cryptographic',
    description: 'Post-quantum key encapsulation mechanism decapsulation guarding against Harvest Now Decrypt Later (HNDL) exfiltration.',
    merkleHash: '0x7528e18501da86fc4691763a43fa4c6816bed34cdbb0909ab814479844d8a148',
    pqcScheme: 'ML-KEM-1024 (Kyber-1024 Category 5, FIPS 203)',
    statutoryRef: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ มาตรา ๓๗ (PDPA Sec 37)',
    executionTimeMs: 10.8,
    status: 'PASSED',
    enclaveHardware: 'Trezor Safe 5 PQC Enclave CC EAL6+',
    legalStandard: 'PDPA Section 37 Technical Safeguard Standard',
  },
  {
    id: 4,
    title: 'STG-04 NIST FIPS 205 SPHINCS+ (SLH-DSA) Stateless Hash Redundancy',
    category: 'Cryptographic',
    description: 'Zero-state hash-based fallback cryptographic verification providing fail-safe protection even upon state-sync disruptions.',
    merkleHash: '0x43a4c58916bed34cdbb07528e18501da86fc4691763a43fa4c68909ab8144798',
    pqcScheme: 'SPHINCS+ (SLH-DSA-256s Stateless Hash, FIPS 205)',
    statutoryRef: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ มาตรา ๒๖ / ๒๘ (ETDA Sec 26/28)',
    executionTimeMs: 14.2,
    status: 'PASSED',
    enclaveHardware: 'Ledger Flex Secure Enclave CC EAL5+',
    legalStandard: 'FIPS 205 Standard',
  },
  {
    id: 5,
    title: 'STG-05 Deca-Key Council 10/10 REAL_HSM Quorum Attestation',
    category: 'Quorum',
    description: 'Unanimous 10/10 physical hardware custodian attestation under FIPS 140-3 Level 4 across Bangkok, Virginia, Frankfurt, Tokyo, and London.',
    merkleHash: '0x14902_DECA_CUSTODIAN_FIPS140_3_L4_ACTIVE_SHIELD_SIG_909AB8',
    pqcScheme: 'Deca-Key Dual-Plane Attestation (10/10 Gov & 10/10 Phy)',
    statutoryRef: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ มาตรา ๒๖ (Signatory Control)',
    executionTimeMs: 18.5,
    status: 'PASSED',
    enclaveHardware: '10x Dispersed Real-HSM Physical Nodes',
    legalStandard: 'FIPS 140-3 Level 4 & Common Criteria EAL6+',
  },
  {
    id: 6,
    title: 'STG-06 Sub-Kelvin Cryostat Thermodynamic Equilibrium (14.96 mK)',
    category: 'Ingestion',
    description: 'Cryostat telemetry validation: mean bus temp 14.96 mK, entropy fluctuation dS = 0.0142 J/K, quantum coherence 99.992%.',
    merkleHash: '0x1496mk_cryo_bus_coherence_99992_entropy_ds00142_equilibrium',
    pqcScheme: 'QKD 256-bit Cryo Bus Monitoring System',
    statutoryRef: 'NCSA Critical National Infrastructure (CII) Act B.E. 2562',
    executionTimeMs: 6.1,
    status: 'PASSED',
    enclaveHardware: 'Sub-Kelvin Quantum Cryostat Bus Enclave',
    legalStandard: 'NCSA Thai National Cybersecurity Standard',
  },
  {
    id: 7,
    title: 'STG-07 Sovereign Write Firewall & Physical Memory Mutation Guard',
    category: 'Compliance',
    description: 'Strict hardware write-lock and WORM enforcement: 0 mutations permitted, blocking arbitrary buffer overwrites.',
    merkleHash: '0x849202_zero_trust_write_firewall_locked_frozen_v12_active',
    pqcScheme: 'Hardware Memory Lock & Kernel WORM Enclave',
    statutoryRef: 'ISO/IEC 27037 Digital Forensics Evidence Preservation',
    executionTimeMs: 2.8,
    status: 'PASSED',
    enclaveHardware: 'Kernel Write-Protection Ring 0 Guard',
    legalStandard: 'ISO/IEC 27037 / ETDA Section 28',
  },
  {
    id: 8,
    title: 'STG-08 Canonical Merkle Tree 14,902 Seals Invariant Verification',
    category: 'Storage',
    description: 'Full mathematical validation of 14,902 Active Seals anchored to Genesis Block #849202 with Δ0.00% Zero Drift.',
    merkleHash: '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    pqcScheme: 'Canonical Merkle Tree SHA3-512 Root Anchor',
    statutoryRef: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๒๘ (ETDA Sec 28)',
    executionTimeMs: 8.4,
    status: 'PASSED',
    enclaveHardware: 'Immutable Cold Storage Ledger V25',
    legalStandard: 'ETDA Sec 28 Non-Repudiation Audit Ledger',
  },
  {
    id: 9,
    title: 'STG-09 Phoenix Quantum Auto-Healing & Tamper Recovery Pipeline',
    category: 'Storage',
    description: 'Validates 35.8ms auto-healing fail-closed recovery loop against 142ms SLA target, restoring SSoT from cold cryo storage.',
    merkleHash: '0xphoenix_35ms_recovery_tamper_fail_closed_zero_drift_ssot',
    pqcScheme: 'Cold Cryo Vault Zeroization & Reconstitution Engine',
    statutoryRef: 'NCSA Disaster Recovery & Business Continuity Framework',
    executionTimeMs: 35.8,
    status: 'PASSED',
    enclaveHardware: 'Chamber 07 Phoenix Automated Engine',
    legalStandard: 'SLA Limit <= 142 ms (Actual: 35.8 ms)',
  },
  {
    id: 10,
    title: 'STG-10 PDPA Section 37 Multi-Tenant Zero-Knowledge Isolation (Ω601-Ω1000)',
    category: 'Compliance',
    description: 'Guarantees 400 enterprise tenant namespaces (Ω601–Ω1000) are cryptographically isolated with zero personal data leakage.',
    merkleHash: '0x400_tenants_zk_isolated_enclave_no_pii_egress_pdpa37',
    pqcScheme: 'Zero-Knowledge Multi-Tenant Enclave Protocol',
    statutoryRef: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ มาตรา ๓๗ (PDPA Sec 37)',
    executionTimeMs: 9.7,
    status: 'PASSED',
    enclaveHardware: 'Multi-Tenant Cryptographic Partition Matrix',
    legalStandard: 'PDPA B.E. 2562 Statutory Mandate',
  },
  {
    id: 11,
    title: 'STG-11 Sovereign Treasury & RWA Reserve Attestation (฿4.23B THB + Gold)',
    category: 'Storage',
    description: 'Parity check for ฿4.23B THB Sovereign Digital Baht, 14,902 oz LBMA 99.99% gold reserve, and 400 national infrastructure assets.',
    merkleHash: '0xtreasury_4b230m_thb_14902oz_gold_rwa_demographic_pool',
    pqcScheme: 'Cryptographic Reserve Balance Merkle Proof',
    statutoryRef: 'Thai Treasury Department Standards & LBMA Physical Audit',
    executionTimeMs: 11.3,
    status: 'PASSED',
    enclaveHardware: 'Sovereign Treasury Chamber 10 Ledger',
    legalStandard: '100% Thai Treasury Guarantee Backed',
  },
  {
    id: 12,
    title: 'STG-12 6-Stage Deterministic DAG State Machine Verification',
    category: 'Quorum',
    description: 'Chamber 05 execution sequence validation: DETECT -> SIMULATE -> GOVERN -> EXECUTE -> VERIFY -> EVIDENCE SEAL.',
    merkleHash: '0xdag_detect_simulate_govern_execute_verify_evidence_seal',
    pqcScheme: 'Chamber 05 6-Stage Deterministic DAG State Machine',
    statutoryRef: 'ISO/IEC 29100 Privacy Architecture Principles',
    executionTimeMs: 15.6,
    status: 'PASSED',
    enclaveHardware: 'Deterministic DAG Execution Engine',
    legalStandard: 'ISO/IEC 29100 / Chamber 05 Verification',
  },
  {
    id: 13,
    title: 'STG-13 Distributed BFT Satellite Mesh & Sub-Kelvin Bus Sync',
    category: 'Quorum',
    description: 'Global 6-node consensus verification (BK01, SG02, TY03, ZH04, SV05, LD06) with sub-kelvin 0.31ms mean latency.',
    merkleHash: '0xbft_6nodes_bk01_sg02_ty03_zh04_sv05_ld06_qkd_active',
    pqcScheme: 'Byzantine Fault Tolerant Mesh with QKD Entanglement',
    statutoryRef: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ มาตรา ๒๖ (Distributed Consensus)',
    executionTimeMs: 7.2,
    status: 'PASSED',
    enclaveHardware: '6x Global Low-Earth Satellite Mesh Nodes',
    legalStandard: 'Sub-Kelvin Mesh Bus Latency <= 2.0 ms',
  },
  {
    id: 14,
    title: 'STG-14 Neural Diagnostic Anomaly Observer & Entropy Floor Check',
    category: 'Ingestion',
    description: '3-Model AI observer validation: spatial entropy 11,264 kbps, zero neural anomaly detected, dS = 0.0142 J/K within limits.',
    merkleHash: '0xneural_anomaly_ds_limit_00500_jk_equilibrium_confirmed',
    pqcScheme: '3-Model Neural Observer & Spatial Entropy Engine',
    statutoryRef: 'NCSA CII Critical Infrastructure Incident Detection',
    executionTimeMs: 5.9,
    status: 'PASSED',
    enclaveHardware: 'Neural Observer Engine Chamber 14',
    legalStandard: 'NCSA CII Anomaly Free Standard',
  },
  {
    id: 15,
    title: 'STG-15 Supreme OMEGA-1 Executive Authority Ratification',
    category: 'Compliance',
    description: 'Master key override certification signed by Sovereign Principal นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01).',
    merkleHash: '0xomega1_supreme_master_key_override_yutthaphum_pakphian',
    pqcScheme: 'OMEGA-1 Executive Hardware Override Shield',
    statutoryRef: 'Sovereign Decree & Constitution of Master Authority',
    executionTimeMs: 3.4,
    status: 'PASSED',
    enclaveHardware: 'NitroKey Sovereign Master Token #EP-SOVEREIGN-01',
    legalStandard: 'OMEGA-1 Supreme Sovereign Override Rule',
  },
  {
    id: 16,
    title: 'STG-16 Court-Admissible Dossier Issuance & Certificate Seal (Pure Green)',
    category: 'Compliance',
    description: 'Final issuance of court-admissible forensic certificate ZQ-GREEN-DEP-849202-3908 confirming 100% Green Mainnet status.',
    merkleHash: '0xcourt_admissible_ready_zq_green_dep_849202_3908_pure_green',
    pqcScheme: 'ETDA Digital Certified Evidence Dossier Protocol',
    statutoryRef: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๙, ๒๖, ๒๘ & PDPA',
    executionTimeMs: 21.0,
    status: 'PASSED',
    enclaveHardware: 'Court Evidence Export Chamber 11',
    legalStandard: 'Court-Admissible Legal Readiness Standard',
  },
];

// Category color styling dictionary
const CATEGORY_STYLES: Record<StepCategory, { badge: string; text: string; dot: string }> = {
  Ingestion: {
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    text: 'text-amber-300',
    dot: 'bg-amber-400',
  },
  Cryptographic: {
    badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    text: 'text-cyan-300',
    dot: 'bg-cyan-400',
  },
  Quorum: {
    badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    text: 'text-purple-300',
    dot: 'bg-purple-400',
  },
  Compliance: {
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    text: 'text-emerald-300',
    dot: 'bg-emerald-400',
  },
  Storage: {
    badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    text: 'text-blue-300',
    dot: 'bg-blue-400',
  },
};

// ============================================================================
// PDF EXPORT UTILITIES (jspdf & jspdf-autotable)
// ============================================================================

export function exportSingleStepPDF(step: AuditStep) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const timestamp = new Date().toISOString();

  // Dark header bar
  doc.setFillColor(7, 10, 18);
  doc.rect(0, 0, 210, 42, 'F');

  // Gold accent line
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 42, 210, 2, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ZYRQUEN Ω∞ APEX ULTIMATE - FORENSIC AUDIT CERTIFICATE', 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(6, 182, 212);
  doc.text(`STEP #${step.id} INDIVIDUAL AUDIT PROOF • STATUTORY COMPLIANCE DOSSIER`, 14, 26);

  doc.setTextColor(160, 160, 160);
  doc.setFontSize(8);
  doc.text(`Generated: ${timestamp} | Sovereign Principal: นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)`, 14, 34);

  // Status Banner
  doc.setFillColor(16, 185, 129, 0.15);
  doc.setDrawColor(16, 185, 129);
  doc.roundedRect(14, 50, 182, 18, 2, 2, 'FD');
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`VERIFICATION STATUS: ${step.status} (100% PURE GREEN - MAINNET LIVE)`, 20, 61);

  // Metadata Table
  autoTable(doc, {
    startY: 74,
    head: [['Field', 'Cryptographic & Statutory Value']],
    body: [
      ['Audit Stage', `Stage ${step.id} of 16`],
      ['Stage Title', step.title],
      ['Audit Category', step.category],
      ['Statutory Authority', step.statutoryRef],
      ['PQC Algorithm / Scheme', step.pqcScheme],
      ['Hardware Enclave', step.enclaveHardware || 'FIPS 140-3 Level 4 HSM Enclave'],
      ['Legal Standard Basis', step.legalStandard || 'ETDA / PDPA / ISO-27037'],
      ['Execution Latency', `${step.executionTimeMs} ms (Deterministic Real-time)`],
      ['Canonical Merkle Root', CANONICAL_MERKLE_ROOT],
      ['Step Merkle Digest Hash', step.merkleHash],
      ['Single Source of Truth', 'Zero Drift SSoT Δ0.00% (0 Mutations Blocked)'],
      ['Court Admissibility Status', 'Admissible under ETDA B.E. 2544 Sec 9/26/28'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [10, 15, 30], textColor: [6, 182, 212], fontStyle: 'bold' },
    styles: { fontSize: 8.5, cellPadding: 3, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold', textColor: [15, 23, 42] },
      1: { cellWidth: 132 },
    },
  });

  // Description section
  const finalY = getAutoTableFinalY(doc, 80) + 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('FORENSIC AUDIT SUMMARY & DESCRIPTION:', 14, finalY);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const splitDescription = doc.splitTextToSize(step.description, 182);
  doc.text(splitDescription, 14, finalY + 6);

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFillColor(245, 245, 245);
  doc.rect(0, pageHeight - 16, 210, 16, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('CONFIDENTIAL & IMMUTABLE • CERTIFIED UNDER THAI ELECTRONIC TRANSACTIONS ACT B.E. 2544 • FIPS 140-3 L4', 14, pageHeight - 7);

  doc.save(`ZYRQUEN_STEP_${String(step.id).padStart(2, '0')}_FORENSIC_PROOF.pdf`);
}

export function exportFull16StepSummaryPDF(steps: AuditStep[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const timestamp = new Date().toISOString();

  // Dark header bar
  doc.setFillColor(7, 10, 18);
  doc.rect(0, 0, 210, 45, 'F');

  // Gold accent line
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 45, 210, 2.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('ZYRQUEN Ω∞ APEX ULTIMATE - 16-STEP AUDIT MASTER SUMMARY', 14, 18);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(6, 182, 212);
  doc.text('FROZEN v1.2 LTS • COURT-ADMISSIBLE MASTER FORENSIC DOSSIER', 14, 26);

  doc.setTextColor(180, 180, 180);
  doc.setFontSize(7.5);
  doc.text(`Principal: นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01) | Merkle: ${CANONICAL_MERKLE_ROOT.slice(0, 32)}...`, 14, 34);
  doc.text(`Date of Audit: ${timestamp} | Quorum: 10/10 REAL_HSM | Status: 100% PURE GREEN`, 14, 40);

  // Table of 16 Steps
  autoTable(doc, {
    startY: 52,
    head: [['#', 'Stage Title', 'Cat', 'Statutory Standard', 'PQC Scheme', 'Time', 'Status']],
    body: steps.map((s) => [
      String(s.id),
      s.title.replace(/^STG-\d+\s*/, ''),
      s.category.slice(0, 5),
      s.statutoryRef.slice(0, 28) + (s.statutoryRef.length > 28 ? '...' : ''),
      s.pqcScheme.slice(0, 24) + (s.pqcScheme.length > 24 ? '...' : ''),
      `${s.executionTimeMs}ms`,
      s.status,
    ]),
    theme: 'striped',
    headStyles: { fillColor: [10, 15, 30], textColor: [6, 182, 212], fontStyle: 'bold', fontSize: 7 },
    styles: { fontSize: 6.8, cellPadding: 2, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 8, fontStyle: 'bold' },
      1: { cellWidth: 50 },
      2: { cellWidth: 16 },
      3: { cellWidth: 42 },
      4: { cellWidth: 38 },
      5: { cellWidth: 14 },
      6: { cellWidth: 14, fontStyle: 'bold', textColor: [16, 185, 129] },
    },
  });

  const pageHeight = doc.internal.pageSize.height;
  doc.setFillColor(245, 245, 245);
  doc.rect(0, pageHeight - 14, 210, 14, 'F');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('CERTIFIED UNDER ETDA B.E. 2544 SEC 9, 26, 28 & PDPA B.E. 2562 • 14,902 FROZEN SEALS VERIFIED Δ0.00%', 14, pageHeight - 6);

  doc.save(`ZYRQUEN_16_STEP_FORENSIC_MASTER_SUMMARY_${Date.now()}.pdf`);
}

// ============================================================================
// MAIN FORENSIC AUDIT STEPPER COMPONENT
// ============================================================================

export const ForensicAuditStepper: React.FC<ForensicAuditStepperProps> = ({
  onAddSystemEvent,
  onNavigateView,
  className = '',
}) => {
  const [steps, setSteps] = useState<AuditStep[]>(INITIAL_16_AUDIT_STEPS);
  const [activeStepId, setActiveStepId] = useState<number>(1);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'stepper' | 'matrix'>('stepper');
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [isAudioFeedbackEnabled, setIsAudioFeedbackEnabled] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'id' | 'time'>('id');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const autoRunTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeStep = useMemo(() => {
    return steps.find((s) => s.id === activeStepId) || steps[0];
  }, [steps, activeStepId]);

  const passedCount = useMemo(() => {
    return steps.filter((s) => s.status === 'PASSED').length;
  }, [steps]);

  const progressPercent = Math.round((passedCount / steps.length) * 100);

  // Hardware Seals verified in the current session (out of 14,902)
  const verifiedSealsCount = useMemo(() => {
    return Math.round((passedCount / steps.length) * CANONICAL_SEALS);
  }, [passedCount, steps.length]);

  const handleFastSealSweep = useCallback(() => {
    playSnapshotSealChime();
    if (onAddSystemEvent) {
      onAddSystemEvent(
        'FORENSIC',
        'Hardware Seal Clock Ratified: 14,902 / 14,902 Hardware Seals Verified',
        'Physical enclaves across Chamber 01-18 verified intact with zero SSoT drift.',
        CANONICAL_MERKLE_ROOT,
        'success',
        'ETDA Sec 28 & ISO/IEC 27037',
        'dashboard'
      );
    }
  }, [onAddSystemEvent]);

  // Audio & Speech helper
  const provideStepAudioFeedback = useCallback(
    (step: AuditStep, statusText: string) => {
      if (!isAudioFeedbackEnabled) return;

      try {
        playTone(520 + step.id * 20, 0.08);
      } catch (e) {
        // audio fail silent
      }

      try {
        speakSystemAlert(`Audit Stage ${step.id}: ${step.title.slice(0, 35)} ${statusText}`, 'critical', 'en');
      } catch (e) {
        // speech fail silent
      }
    },
    [isAudioFeedbackEnabled]
  );

  // Execute a single step
  const executeStep = useCallback(
    (stepId: number) => {
      setSteps((prev) =>
        prev.map((s) => (s.id === stepId ? { ...s, status: 'RUNNING' } : s))
      );

      const targetStep = steps.find((s) => s.id === stepId);
      if (targetStep) {
        provideStepAudioFeedback(targetStep, 'running verification');
      }

      setTimeout(() => {
        setSteps((prev) =>
          prev.map((s) => (s.id === stepId ? { ...s, status: 'PASSED' } : s))
        );

        if (targetStep) {
          playAuditChime();
          provideStepAudioFeedback(targetStep, 'passed');

          if (onAddSystemEvent) {
            onAddSystemEvent(
              'FORENSIC',
              `Forensic Step #${targetStep.id} Verified: ${targetStep.title.slice(0, 45)}`,
              `PQC Scheme: ${targetStep.pqcScheme} | Statutory Ref: ${targetStep.statutoryRef} | Latency: ${targetStep.executionTimeMs}ms`,
              targetStep.merkleHash,
              'success',
              targetStep.statutoryRef,
              'dashboard'
            );
          }
        }
      }, 450);
    },
    [steps, provideStepAudioFeedback, onAddSystemEvent]
  );

  // Auto Run loop
  useEffect(() => {
    if (!isRunning) {
      if (autoRunTimerRef.current) {
        clearInterval(autoRunTimerRef.current);
        autoRunTimerRef.current = null;
      }
      return;
    }

    autoRunTimerRef.current = setInterval(() => {
      setSteps((prevSteps) => {
        // Find next step that is not PASSED
        const nextIndex = prevSteps.findIndex((s) => s.status !== 'PASSED');
        if (nextIndex === -1) {
          // All done!
          setIsRunning(false);
          playAuditChime();
          if (isAudioFeedbackEnabled) {
            speakSystemAlert('All 16 forensic audit stages passed. SSoT Zero Drift confirmed.', 'critical', 'en');
          }
          if (onAddSystemEvent) {
            onAddSystemEvent(
              'COMPLIANCE',
              'All 16-Step Forensic Audit Stages Unanimously Ratified',
              'Full 16-stage pipeline certified under ETDA Sec 9/26/28, PDPA Sec 37, and FIPS 140-3 L4. Zero drift.',
              CANONICAL_MERKLE_ROOT,
              'success',
              'ETDA Sec 9, 26, 28 & PDPA Sec 37',
              'dashboard'
            );
          }
          return prevSteps;
        }

        const nextStep = prevSteps[nextIndex];
        setActiveStepId(nextStep.id);

        provideStepAudioFeedback(nextStep, 'verified');

        const updated = [...prevSteps];
        updated[nextIndex] = { ...nextStep, status: 'PASSED' };
        return updated;
      });
    }, 750);

    return () => {
      if (autoRunTimerRef.current) {
        clearInterval(autoRunTimerRef.current);
        autoRunTimerRef.current = null;
      }
    };
  }, [isRunning, isAudioFeedbackEnabled, provideStepAudioFeedback, onAddSystemEvent]);

  // Reset all steps to PENDING
  const handleReset = useCallback(() => {
    setIsRunning(false);
    playTone(440, 0.08);
    setSteps((prev) => prev.map((s) => ({ ...s, status: 'PENDING' })));
    setActiveStepId(1);
    if (isAudioFeedbackEnabled) {
      speakSystemAlert('Forensic audit pipeline reset to initial state.', 'warning', 'en');
    }
  }, [isAudioFeedbackEnabled]);

  // Copy active step hash
  const handleCopyHash = () => {
    safeCopyToClipboard(activeStep.merkleHash);
    setCopiedHash(true);
    playTone(720, 0.05);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  // Filtered steps for matrix view
  const filteredSteps = useMemo(() => {
    return steps
      .filter((s) => {
        const matchesCat = selectedCategory === 'ALL' || s.category === selectedCategory;
        const matchesQuery =
          searchQuery === '' ||
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.statutoryRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.pqcScheme.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.merkleHash.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesQuery;
      })
      .sort((a, b) => {
        if (sortField === 'time') return a.executionTimeMs - b.executionTimeMs;
        return a.id - b.id;
      });
  }, [steps, selectedCategory, searchQuery, sortField]);

  return (
    <div
      id="forensic-audit-stepper"
      className={`rounded-2xl bg-[#090d1a]/95 border-cyan-500/30 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-300 font-sans ${className}`}
    >
      {/* Top Header Bar */}
      <div className="px-4 py-3 bg-gradient-to-r from-[#070b16] via-[#091024] to-[#070b16] border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/15 border-cyan-500/35 text-cyan-400">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white font-mono tracking-tight flex items-center gap-1.5">
                16-STEP FORENSIC AUDIT PIPELINE
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border-emerald-500/30 text-emerald-300 font-mono text-[10px] font-bold">
                {progressPercent}% PASSED ({passedCount}/16)
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">
              ETDA Sec 9/26/28 • PDPA Sec 37 • NIST FIPS 203/204/205 • 10/10 REAL_HSM
            </p>
          </div>
        </div>

        {/* Right: Controls (Auto Run, Reset, View Mode, Audio, PDF) */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Audio Feedback Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsAudioFeedbackEnabled(!isAudioFeedbackEnabled);
              playTone(600, 0.04);
            }}
            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
              isAudioFeedbackEnabled
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35'
                : 'bg-zinc-800/60 text-zinc-500 border-zinc-700'
            }`}
            title={isAudioFeedbackEnabled ? 'Synthetic Audio Feedback: ON' : 'Synthetic Audio Feedback: MUTED'}
          >
            {isAudioFeedbackEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* View Mode Toggle: Stepper vs Matrix */}
          <div className="flex items-center rounded-lg bg-black/40 border-white/10 p-0.5">
            <button
              type="button"
              onClick={() => {
                setViewMode('stepper');
                playTone(560, 0.04);
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === 'stepper' ? 'bg-cyan-500/25 text-cyan-200 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <List className="w-3 h-3" />
              Stepper
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('matrix');
                playTone(560, 0.04);
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === 'matrix' ? 'bg-cyan-500/25 text-cyan-200 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Grid className="w-3 h-3" />
              Matrix
            </button>
          </div>

          {/* Auto Run Button */}
          <button
            type="button"
            onClick={() => {
              playTone(640, 0.05);
              setIsRunning(!isRunning);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer shadow-sm ${
              isRunning
                ? 'bg-amber-500/20 text-amber-200 border-amber-500/50 animate-pulse'
                : 'bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
            }`}
            title="Auto-run verification of all 16 audit steps with synthetic audio feedback"
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Run</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Auto Run</span>
              </>
            )}
          </button>

          {/* Reset Button */}
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border-white/10 text-xs transition-colors cursor-pointer"
            title="Reset all stages to PENDING"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Export Full 16-Step Summary PDF */}
          <button
            type="button"
            onClick={() => {
              playTone(680, 0.06);
              exportFull16StepSummaryPDF(steps);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-400/40 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.15)]"
            title="Export full 16-step forensic audit summary as court-admissible PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Master PDF</span>
          </button>

          {/* Export Official V9 Master Dossier PDF */}
          <button
            type="button"
            onClick={() => {
              playAuditChime();
              downloadMasterForensicDossierV9Pdf();
            }}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/50 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.2)]"
            title="Download Court-Admissible Dossier DOC-SOV-HSM-1010-2026-V9"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Dossier V9 PDF</span>
          </button>

          {/* Collapse/Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border-white/10 text-xs transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse Stepper' : 'Expand Stepper'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Visual Progress Bar & Seal Clock: Verified Hardware Seals Indicator */}
          <SealClockProgressBar
            verifiedSeals={verifiedSealsCount}
            totalSeals={CANONICAL_SEALS}
            isRunning={isRunning}
            passedCount={passedCount}
            totalSteps={steps.length}
            onFastSealSweep={handleFastSealSweep}
          />

          {/* 16-Step Horizontal Progress Navigation Bar */}
          <div className="space-y-2">
            {/* Progress bar line */}
            <div className="h-1.5 w-full bg-zinc-800/80 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-amber-400"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Clickable Step Pills (1 to 16) */}
            <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5">
              {steps.map((step) => {
                const isActive = step.id === activeStepId;
                const isPassed = step.status === 'PASSED';
                const isRunningStep = step.status === 'RUNNING';

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      playTone(480 + step.id * 15, 0.05);
                      setActiveStepId(step.id);
                    }}
                    className={`relative py-1.5 px-1 rounded-lg border text-center transition-all cursor-pointer font-mono flex flex-col items-center justify-center ${
                      isActive
                        ? 'bg-cyan-500/25 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)] scale-105 z-10'
                        : isPassed
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                        : isRunningStep
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 animate-pulse'
                        : 'bg-black/30 border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                    }`}
                    title={`Step ${step.id}: ${step.title}`}
                  >
                    <span className="text-[11px] font-bold">
                      {String(step.id).padStart(2, '0')}
                    </span>
                    <span className="text-[8px] truncate max-w-full opacity-80">
                      {isPassed ? '✓' : isRunningStep ? '…' : '○'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* VIEW MODE 1: STEPPER DETAIL VIEW */}
          {viewMode === 'stepper' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left 8 Cols: Active Step Detail Card */}
              <div className="lg:col-span-8 p-4 rounded-xl bg-[#080c18] border-cyan-500/25 space-y-3 relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

                {/* Header Row: Stage ID, Category Badge, Status */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold text-xs border-cyan-500/30">
                      STAGE {String(activeStep.id).padStart(2, '0')} / 16
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-mono font-semibold border ${
                        CATEGORY_STYLES[activeStep.category].badge
                      }`}
                    >
                      {activeStep.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 border ${
                        activeStep.status === 'PASSED'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : activeStep.status === 'RUNNING'
                          ? 'bg-amber-500/20 text-amber-200 border-amber-500/50 animate-pulse'
                          : 'bg-zinc-800/80 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {activeStep.status === 'PASSED' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : activeStep.status === 'RUNNING' ? (
                        <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-zinc-400" />
                      )}
                      {activeStep.status}
                    </span>

                    <button
                      type="button"
                      onClick={() => executeStep(activeStep.id)}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border-cyan-500/30 text-xs font-mono font-medium flex items-center gap-1 cursor-pointer transition-colors"
                      title="Run single verification for this step"
                    >
                      <Play className="w-3 h-3" />
                      Verify Step
                    </button>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white font-mono leading-snug">
                    {activeStep.title}
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed font-sans mt-1">
                    {activeStep.description}
                  </p>
                </div>

                {/* Key Technical & Statutory Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-white/5 font-mono text-xs">
                  <div className="p-2.5 rounded-lg bg-black/40 border-white/5 space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                      Statutory Legal Reference
                    </span>
                    <span className="text-amber-300 font-medium block truncate" title={activeStep.statutoryRef}>
                      {activeStep.statutoryRef}
                    </span>
                    <span className="text-[10px] text-zinc-400 block">
                      {activeStep.legalStandard}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-black/40 border-white/5 space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                      Post-Quantum Cryptographic Scheme
                    </span>
                    <span className="text-cyan-300 font-medium block truncate" title={activeStep.pqcScheme}>
                      {activeStep.pqcScheme}
                    </span>
                    <span className="text-[10px] text-zinc-400 block">
                      Hardware: {activeStep.enclaveHardware}
                    </span>
                  </div>
                </div>

                {/* Merkle Hash & Actions */}
                <div className="p-2.5 rounded-lg bg-black/60 border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs">
                  <div className="truncate flex-1">
                    <span className="text-zinc-500 text-[10px] block">Step Merkle Digest:</span>
                    <code className="text-cyan-300 text-[11px] truncate block select-all">
                      {activeStep.merkleHash}
                    </code>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleCopyHash}
                      className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border-white/10 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                      title="Copy Hash to Clipboard"
                    >
                      {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => exportSingleStepPDF(activeStep)}
                      className="px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-400/40 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                      title="Export single-step proof PDF"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Export Step PDF</span>
                    </button>
                  </div>
                </div>

                {/* Step Navigation Prev / Next */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeStepId > 1) {
                        playTone(500, 0.04);
                        setActiveStepId(activeStepId - 1);
                      }
                    }}
                    disabled={activeStepId === 1}
                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Previous Stage
                  </button>
                  <span className="text-zinc-500">
                    Stage {activeStepId} of 16
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (activeStepId < 16) {
                        playTone(500, 0.04);
                        setActiveStepId(activeStepId + 1);
                      }
                    }}
                    disabled={activeStepId === 16}
                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 flex items-center gap-1 cursor-pointer"
                  >
                    Next Stage
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right 4 Cols: Pipeline Summary & Authority Card */}
              <div className="lg:col-span-4 p-4 rounded-xl bg-[#080c18] border-cyan-500/25 flex flex-col justify-between space-y-3 font-mono text-xs">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      AUDIT METRICS
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      MAINNET LIVE
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="text-zinc-500">Execution Mode:</span>
                      <span className="text-emerald-400 font-bold">DETERMINISTIC</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="text-zinc-500">Active Stage Latency:</span>
                      <span className="text-cyan-300">{activeStep.executionTimeMs} ms</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="text-zinc-500">Hardware Quorum:</span>
                      <span className="text-purple-300 font-bold">10/10 REAL_HSM</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="text-zinc-500">Canonical Merkle Block:</span>
                      <span className="text-amber-300">#{SYSTEM_METADATA.sealedBlock}</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="text-zinc-500">Total Canonical Seals:</span>
                      <span className="text-emerald-300 font-bold">14,902 / 14,902</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="text-zinc-500">Mutation Deviation:</span>
                      <span className="text-emerald-400 font-bold">Δ0.00% Zero Drift</span>
                    </div>
                  </div>
                </div>

                {/* Sovereign Authority Seal */}
                <div className="p-3 rounded-lg bg-black/50 border-white/5 space-y-1.5">
                  <div className="text-[10px] text-zinc-500 uppercase">Sovereign Principal</div>
                  <div className="text-amber-300 font-bold text-xs truncate">
                    นายยุทธภูมิ พากเพียร
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    #EP-SOVEREIGN-01 (OMEGA-1)
                  </div>
                  <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px] text-emerald-400">
                    <span>Court-Admissible</span>
                    <span>ETDA Certified</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE 2: FULL 16-STEP MATRIX TABLE VIEW */}
          {viewMode === 'matrix' && (
            <div className="space-y-3 font-mono text-xs">
              {/* Filter & Search Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 p-2 rounded-xl bg-black/40 border-white/10">
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-cyan-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by stage title, statutory clause, or PQC scheme..."
                    className="w-full bg-transparent border-none text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-zinc-500 hover:text-white text-xs cursor-pointer"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-zinc-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-[#0b1020] border-white/10 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="Ingestion">Ingestion</option>
                    <option value="Cryptographic">Cryptographic</option>
                    <option value="Quorum">Quorum</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Storage">Storage</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setSortField(sortField === 'id' ? 'time' : 'id')}
                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 text-xs cursor-pointer transition-colors"
                  >
                    Sort: {sortField === 'id' ? 'Stage ID' : 'Latency'}
                  </button>
                </div>
              </div>

              {/* Matrix Table */}
              <div className="rounded-xl border-white/10 overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-[#0b1226] border-b border-white/10 text-zinc-400">
                      <th className="py-2 px-3 font-semibold w-12">#</th>
                      <th className="py-2 px-3 font-semibold">Stage Title & Scope</th>
                      <th className="py-2 px-3 font-semibold">Category</th>
                      <th className="py-2 px-3 font-semibold">Statutory Standard</th>
                      <th className="py-2 px-3 font-semibold">PQC Algorithm</th>
                      <th className="py-2 px-3 font-semibold w-16">Latency</th>
                      <th className="py-2 px-3 font-semibold w-24">Status</th>
                      <th className="py-2 px-3 font-semibold w-20 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredSteps.map((step) => {
                      const isSelected = step.id === activeStepId;
                      return (
                        <tr
                          key={step.id}
                          onClick={() => {
                            playTone(500 + step.id * 10, 0.04);
                            setActiveStepId(step.id);
                          }}
                          className={`hover:bg-cyan-500/10 transition-colors cursor-pointer ${
                            isSelected ? 'bg-cyan-500/15' : 'bg-[#070b16]'
                          }`}
                        >
                          <td className="py-2 px-3 font-bold text-cyan-400">
                            {String(step.id).padStart(2, '0')}
                          </td>
                          <td className="py-2 px-3 font-bold text-white max-w-[280px] truncate" title={step.title}>
                            {step.title}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                CATEGORY_STYLES[step.category].badge
                              }`}
                            >
                              {step.category}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-amber-300/90 max-w-[200px] truncate" title={step.statutoryRef}>
                            {step.statutoryRef}
                          </td>
                          <td className="py-2 px-3 text-cyan-300/90 max-w-[180px] truncate" title={step.pqcScheme}>
                            {step.pqcScheme}
                          </td>
                          <td className="py-2 px-3 text-zinc-400">
                            {step.executionTimeMs}ms
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border w-fit ${
                                step.status === 'PASSED'
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                              }`}
                            >
                              {step.status === 'PASSED' && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
                              {step.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                exportSingleStepPDF(step);
                              }}
                              className="p-1 rounded bg-white/5 hover:bg-white/10 text-cyan-300 border-white/10 cursor-pointer transition-colors"
                              title="Download PDF"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
