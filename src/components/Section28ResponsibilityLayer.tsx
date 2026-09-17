import React, { useState } from 'react';
import {
  Scale,
  ShieldCheck,
  Award,
  Fingerprint,
  Cpu,
  Lock,
  ArrowRight,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  History,
  Send,
  FileCheck,
  RefreshCw,
  Key,
  Flame,
  FileText,
  AlertOctagon,
} from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { THAI_CUSTODIANS, SYSTEM_METADATA } from '../data/canonicalData';

export interface CustodyHandoverTx {
  id: string;
  txHash: string;
  timestamp: string;
  custodianFrom: string;
  custodianTo: string;
  payloadType: string;
  dutyOfCareScore: number;
  merkleSeal: string;
  status: 'SEALED_VALID' | 'HANDOVER_IN_PROGRESS' | 'ANOMALY_RESOLVED';
  statutoryClause: string;
}

export interface Section28NonComplianceAlert {
  id: string;
  timestamp: string;
  eventType: 'KEY_DEVIATION_ATTEMPT' | 'UNAUTHORIZED_DELEGATION' | 'DRIFT_PROBE' | 'LATE_COMPROMISE_REPORT';
  severity: 'WARNING' | 'CRITICAL' | 'RESOLVED';
  titleTh: string;
  titleEn: string;
  custodianBound: string;
  statuteRef: string;
  resolutionStatus: string;
  auditTrailRef: string;
  circuitBreakerEngaged: boolean;
}

export const Section28ResponsibilityLayer: React.FC = () => {
  const [activeSubView, setActiveSubView] = useState<'RADAR' | 'HANDOVER' | 'AUDIT_LOG'>('RADAR');
  const [isSigning, setIsSigning] = useState(false);
  const [dutyOfCareMetric, setDutyOfCareMetric] = useState(100.0);
  const [auditLogFilter, setAuditLogFilter] = useState<'ALL' | 'CRITICAL' | 'RESOLVED'>('ALL');
  const [selectedAlert, setSelectedAlert] = useState<Section28NonComplianceAlert | null>(null);

  // Simulated Handover Transactions
  const [transactions, setTransactions] = useState<CustodyHandoverTx[]>([
    {
      id: 'tx-sec28-01',
      txHash: '0x909ab814...c06a38',
      timestamp: '08:14:22 ICT',
      custodianFrom: 'นายยุทธภูมิ พากเพียร (CUST-TH-01)',
      custodianTo: 'สมชาย พากเพียร (CUST-TH-02)',
      payloadType: 'พยานหลักฐานคดีแพ่งและพาณิชย์ (Court Evidence Payload)',
      dutyOfCareScore: 100.0,
      merkleSeal: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      status: 'SEALED_VALID',
      statutoryClause: 'มาตรา 28 (1) & (3) — Duty of Care & Full Verification',
    },
    {
      id: 'tx-sec28-02',
      txHash: '0x7528e185...9bf00f',
      timestamp: '08:18:05 ICT',
      custodianFrom: 'ดร. กัญญารัตน์ เวชสิทธิ์ (CUST-TH-03)',
      custodianTo: 'นายยุทธภูมิ พากเพียร (CUST-TH-01)',
      payloadType: 'Sub-Kelvin Key Ring Vault Invariant Check',
      dutyOfCareScore: 99.98,
      merkleSeal: '7528e18501da86fc4691763a43fa4c68909ab814479844d8a14816bed34cdbb0',
      status: 'SEALED_VALID',
      statutoryClause: 'มาตรา 28 (1) — Physical Isolation Duty',
    },
  ]);

  // Section 28 Non-compliance & Incident Audit Events
  const [nonComplianceAlerts, setNonComplianceAlerts] = useState<Section28NonComplianceAlert[]>([
    {
      id: 'nc-alert-01',
      timestamp: '08:02:11 ICT',
      eventType: 'KEY_DEVIATION_ATTEMPT',
      severity: 'RESOLVED',
      titleTh: 'พยายามใช้กุญแจนอก Sub-Kelvin Hardware Security Vault (ม. 28 (1))',
      titleEn: 'Attempted signature creation data extraction beyond cryostat enclosure',
      custodianBound: 'นายยุทธภูมิ พากเพียร (CUST-TH-01)',
      statuteRef: 'พ.ร.บ. ธุรกรรมฯ มาตรา 28 (1) — Duty of Reasonable Care',
      resolutionStatus: 'Fail-Closed in 0.4ms • Intercepted & Dual-Key Ring Re-locked',
      auditTrailRef: 'AUDIT-LEAF-#849202-SEC28-01',
      circuitBreakerEngaged: true,
    },
    {
      id: 'nc-alert-02',
      timestamp: '08:10:45 ICT',
      eventType: 'UNAUTHORIZED_DELEGATION',
      severity: 'RESOLVED',
      titleTh: 'การตรวจจับการมอบอำนาจเด็ดขาดที่ละเมิด Non-Delegable Veto (ม. 28 (2))',
      titleEn: 'Detected unauthorized delegation attempt on Executive Passport #EP-SOVEREIGN-01',
      custodianBound: 'ธนพล เกียรติไพศาล (CUST-TH-04)',
      statuteRef: 'พ.ร.บ. ธุรกรรมฯ มาตรา 28 (2) (ก) — Loss of Sole Control Warning',
      resolutionStatus: 'Reverted to Sovereign Principal Quorum • Veto Applied',
      auditTrailRef: 'AUDIT-LEAF-#849202-SEC28-02',
      circuitBreakerEngaged: true,
    },
    {
      id: 'nc-alert-03',
      timestamp: '08:21:00 ICT',
      eventType: 'DRIFT_PROBE',
      severity: 'RESOLVED',
      titleTh: 'การทดสอบความเบี่ยงเบนของกุญแจตรวจสอบ Invariant Drift (0.00% Zero-Drift Restored)',
      titleEn: 'Simulated Section 28 Invariant Drift probe against Merkle Root 909ab814',
      custodianBound: 'สมชาย พากเพียร (CUST-TH-02)',
      statuteRef: 'พ.ร.บ. ธุรกรรมฯ มาตรา 28 วรรคสอง — Liability Safe Harbor',
      resolutionStatus: 'Autonomous Re-anchoring via Dilithium-5 Post-Quantum Proof',
      auditTrailRef: 'AUDIT-LEAF-#849202-SEC28-03',
      circuitBreakerEngaged: false,
    },
  ]);

  // Handle Custody Handover Transaction Signing
  const handleSimulateCustodyHandover = () => {
    setIsSigning(true);
    playTone(520, 0.08);

    setTimeout(() => {
      const newTx: CustodyHandoverTx = {
        id: `tx-sec28-${Date.now().toString().slice(-4)}`,
        txHash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 8)}`,
        timestamp: new Date().toLocaleTimeString('en-GB') + ' ICT',
        custodianFrom: 'นายยุทธภูมิ พากเพียร (CUST-TH-01)',
        custodianTo: 'ธนพล เกียรติไพศาล (CUST-TH-04)',
        payloadType: 'OTLP Telemetry & NCSA Security Audit Log Handover',
        dutyOfCareScore: 100.0,
        merkleSeal: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
        status: 'SEALED_VALID',
        statutoryClause: 'มาตรา 28 (1) & (2) — Immutable Custody Chain',
      };

      setTransactions((prev) => [newTx, ...prev]);
      setDutyOfCareMetric(100.0);
      setIsSigning(false);
      playAuditChime();
    }, 750);
  };

  // Section 28 Radar Vectors (Accountability & Duty of Care dimensions)
  const radarDimensions = [
    { label: 'ม.28(1) Duty of Care', value: 100, scoreText: '100% Locked', desc: 'การดูแลรักษากุญแจใน Sub-Kelvin HSM' },
    { label: 'ม.28(2) Fail-Closed Alert', value: 99.99, scoreText: '0.4ms Cutoff', desc: 'การแจ้งเตือนทันทีเมื่อหลุดจากการควบคุม' },
    { label: 'ม.28(3) Cert Veracity', value: 100, scoreText: '100% True', desc: 'ความถูกต้องครบถ้วนของใบรับรอง #EP-01' },
    { label: 'Passport Custody', value: 100, scoreText: '4/4 Quorum', desc: 'การผูกโยงสิทธิ์กับ Thai Custodian Registry' },
    { label: 'Audit Trail Integrity', value: 100, scoreText: '14,902 Seals', desc: 'บันทึกประวัติการใช้กุญแจย้อนหลังแบบแก้ไม่ได้' },
    { label: 'Liability Safe Harbor', value: 99.98, scoreText: 'Court Proof', desc: 'ข้อสันนิษฐานเด็ดขาดตามมาตรา 28 วรรคสอง' },
  ];

  const filteredAlerts = nonComplianceAlerts.filter((a) => {
    if (auditLogFilter === 'ALL') return true;
    return a.severity === auditLogFilter;
  });

  return (
    <div className="rounded-[28px] bg-[#07080F]/95 border border-white/8 backdrop-blur-2xl p-6 sm:p-8 space-y-6 shadow-2xl font-mono">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/8 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.25)] shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Section 28 Responsibility Layer — Executive Passport #EP-SOVEREIGN-01
              </h3>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                CUSTODIAN DUTY OF CARE & LIABILITY GATE
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              Thai Electronic Transactions Act B.E. 2544 Section 28 • Real-time Accountability Radar • Custody Handover • Non-Compliance Audit Log
            </p>
          </div>
        </div>

        {/* Sub-View Switcher */}
        <div className="flex items-center bg-black/60 border border-white/10 rounded-2xl p-1 text-xs">
          <button
            onClick={() => {
              playTone(560, 0.03);
              setActiveSubView('RADAR');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeSubView === 'RADAR'
                ? 'bg-amber-500/25 text-amber-200 border border-amber-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Accountability Radar
          </button>

          <button
            onClick={() => {
              playTone(600, 0.03);
              setActiveSubView('HANDOVER');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeSubView === 'HANDOVER'
                ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Custody Handover ({transactions.length})
          </button>

          <button
            onClick={() => {
              playTone(640, 0.03);
              setActiveSubView('AUDIT_LOG');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeSubView === 'AUDIT_LOG'
                ? 'bg-rose-500/25 text-rose-200 border border-rose-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Non-Compliance Audit Log ({nonComplianceAlerts.length})
          </button>
        </div>
      </div>

      {/* VIEW 1: Accountability Radar & Statutory Mandate Cards */}
      {activeSubView === 'RADAR' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Radar Visualizer (SVG Polygons) */}
            <div className="p-6 rounded-2xl bg-black/70 border border-white/10 flex flex-col items-center justify-center space-y-4 relative overflow-hidden">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 self-start">
                <Activity className="w-4 h-4 text-amber-400" />
                <span>#EP-SOVEREIGN-01 Custody Chain Radar</span>
              </div>

              {/* Dynamic SVG Radar Chart */}
              <div className="relative w-64 h-64 flex items-center justify-center select-none">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  {/* Concentric Hexagons */}
                  {[0.25, 0.5, 0.75, 1.0].map((r, i) => (
                    <polygon
                      key={i}
                      points="100,20 170,60 170,140 100,180 30,140 30,60"
                      transform={`scale(${r}) translate(${100 * (1 - r) / r}, ${100 * (1 - r) / r})`}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Spokes */}
                  <line x1="100" y1="100" x2="100" y2="20" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                  <line x1="100" y1="100" x2="170" y2="60" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                  <line x1="100" y1="100" x2="170" y2="140" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                  <line x1="100" y1="100" x2="100" y2="180" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                  <line x1="100" y1="100" x2="30" y2="140" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                  <line x1="100" y1="100" x2="30" y2="60" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

                  {/* Filled Radar Data Polygon */}
                  <polygon
                    points="100,22 168,62 169,139 100,178 32,138 31,61"
                    fill="rgba(245, 158, 11, 0.25)"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    className="transition-all duration-700"
                  />

                  {/* Radar Nodes */}
                  <circle cx="100" cy="22" r="3.5" fill="#f59e0b" className="animate-pulse" />
                  <circle cx="168" cy="62" r="3.5" fill="#f59e0b" />
                  <circle cx="169" cy="139" r="3.5" fill="#f59e0b" />
                  <circle cx="100" cy="178" r="3.5" fill="#f59e0b" />
                  <circle cx="32" cy="138" r="3.5" fill="#f59e0b" />
                  <circle cx="31" cy="61" r="3.5" fill="#f59e0b" />
                </svg>

                {/* Center Score */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-2xl font-bold text-amber-300">100.0%</span>
                  <span className="text-[9px] text-zinc-400">Section 28 Score</span>
                </div>
              </div>

              <div className="text-[11px] text-zinc-400 font-sans text-center">
                All 6 Section 28 duty invariants locked in Sub-Kelvin Hardware Security Vault.
              </div>
            </div>

            {/* 6 Dimensions Details Grid */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {radarDimensions.map((dim, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5 hover:border-amber-500/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-200">{dim.label}</span>
                    <span className="text-[10px] font-mono text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30 font-bold">
                      {dim.scoreText}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-sans">{dim.desc}</p>
                  <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${dim.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 28 Full 3-Tier Architecture Alignment (As shown in screenshot) */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#120d04]/90 via-black/80 to-[#07080F] border border-amber-500/30 space-y-4">
            <div className="flex items-center justify-between border-b border-white/8 pb-3">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>มาตรา 28 (Section 28) — Thai Legal Foundation $\longleftrightarrow$ Cryptographic Enforcement</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">ETDA LEVEL 3+ COMPLIANT</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Box 1 */}
              <div className="p-4 rounded-xl bg-black/50 border border-white/8 space-y-2">
                <div className="text-[10px] font-bold text-amber-400 uppercase">LEGAL STATUTE</div>
                <div className="text-xs font-bold text-white">Responsibility of Data Subject / Signatory</div>
                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  กำหนด accountability ของผู้ถือ signed data, ผูกตาม พ.ร.บ.ธุรกรรมฯ มาตรา 28 (1), (2), (3) และวรรคสอง
                </p>
                <div className="text-[10px] text-zinc-500 pt-2 border-t border-white/5">
                  Ref: พ.ร.บ.ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544
                </div>
              </div>

              {/* Box 2 */}
              <div className="p-4 rounded-xl bg-black/50 border border-white/8 space-y-2">
                <div className="text-[10px] font-bold text-cyan-400 uppercase">SOVEREIGN LAYER</div>
                <div className="text-xs font-bold text-white">Responsibility Layer (Executive Passport & Custody Gate)</div>
                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  Executive Passport Issuance & Verification + Custody Gate Access Control + Sovereign Identity Binding & Role Attestation
                </p>
                <div className="text-[10px] text-zinc-500 pt-2 border-t border-white/5">
                  Passport #EP-SOVEREIGN-01 (Yuththaphum)
                </div>
              </div>

              {/* Box 3 */}
              <div className="p-4 rounded-xl bg-black/50 border border-white/8 space-y-2">
                <div className="text-[10px] font-bold text-emerald-400 uppercase">CRYPTOGRAPHIC ENFORCEMENT</div>
                <div className="text-xs font-bold text-white">Sovereign Executive Passport #EP-SOVEREIGN-01</div>
                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  Multi-Signature Key Custody (MPC/HSM) + Immutable Audit Ledger on Blockchain + Zero-Trust Validation & Time-Stamped Proof
                </p>
                <div className="text-[10px] text-amber-300 font-mono pt-2 border-t border-white/5 flex items-center justify-between">
                  <span>Anchor Hash:</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">909ab814</span>
                </div>
              </div>
            </div>

            {/* Programmatic Section 28 Certificate Anchor Footer */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-black/80 to-[#07080F] border-2 border-amber-400/50 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-1.5">
                <span className="text-[11px] font-bold text-amber-300 font-mono uppercase flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>SECTION 28 STATUTORY CERTIFICATE ANCHOR</span>
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold font-mono border border-emerald-500/40">
                  PASSPORT LINKED & HARMONIZED
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-zinc-500 block">MERKLE ROOT ANCHOR:</span>
                  <span className="text-amber-300 font-bold text-xs bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-400/40 inline-block mt-0.5">
                    909ab814
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block">EXECUTIVE PASSPORT:</span>
                  <span className="text-white font-bold text-xs block mt-0.5">#EP-SOVEREIGN-01</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">SIGNATORY BOUND:</span>
                  <span className="text-emerald-300 font-semibold block mt-0.5">นายยุทธภูมิ พากเพียร</span>
                </div>
              </div>
              <p className="text-[10px] text-amber-200/90 font-serif italic pt-1 border-t border-white/5">
                "The Merkle Root '909ab814' acts as the immutable cryptographic anchor for the #EP-SOVEREIGN-01 passport, guaranteeing signatory liability attribution and duty of care compliance under Section 28 (Thai Electronic Transactions Act B.E. 2544)."
              </p>
            </div>

            {/* Bottom 3 Lock Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px]">
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-center text-zinc-300">
                🛡️ <strong>ZERO-TRUST FABRIC</strong> (ETDA Level 3+)
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-center text-zinc-300">
                📜 <strong>SECURE AUDIT TRAIL</strong> (PDPA Aligned)
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-center text-zinc-300">
                ⚖️ <strong>CUSTODY & LIABILITY</strong> (Signatory Bound)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Interactive Custody Handover Transaction Simulator */}
      {activeSubView === 'HANDOVER' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs">
            <div className="flex items-center gap-2 text-cyan-200">
              <Zap className="w-4 h-4 text-cyan-300 shrink-0" />
              <span>
                <strong>Simulated Custody Handover:</strong> Sign transaction to transfer cryptographic custody between registered Thai custodians while maintaining continuous Section 28 Duty of Care auditability.
              </span>
            </div>
            <button
              onClick={handleSimulateCustodyHandover}
              disabled={isSigning}
              className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs shrink-0 ${
                isSigning
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
                  : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 shadow-lg'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSigning ? 'Signing Block...' : 'Sign Custody Handover Tx'}</span>
            </button>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold text-zinc-300 flex items-center justify-between">
              <span>ACTIVE SECTION 28 CUSTODY HANDOVER TRANSACTIONS</span>
              <span className="text-[10px] text-cyan-400 font-normal">Block #849202 • 14,902 Seals</span>
            </div>

            <div className="space-y-2.5">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 rounded-2xl bg-black/60 border border-white/8 space-y-2 text-xs hover:border-cyan-500/30 transition-all shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/30">
                        {tx.txHash}
                      </span>
                      <span className="text-zinc-200 font-bold">{tx.payloadType}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                      <span>{tx.timestamp}</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30">
                        DUTY OF CARE: {tx.dutyOfCareScore}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-zinc-500 block">ORIGIN CUSTODIAN (ม. 28 (1)):</span>
                      <span className="text-amber-300 font-semibold">{tx.custodianFrom}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">RECIPIENT CUSTODIAN (ม. 28 (3)):</span>
                      <span className="text-emerald-300 font-semibold">{tx.custodianTo}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500">
                    <span className="truncate max-w-[320px] font-mono">Merkle Root: {tx.merkleSeal}</span>
                    <span className="text-cyan-400 font-bold">{tx.statutoryClause}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Dedicated Custodian Responsibility Non-Compliance Audit Log */}
      {activeSubView === 'AUDIT_LOG' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-3 text-xs border-b border-white/8 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-rose-400" />
              <span className="font-bold text-zinc-200 uppercase">Section 28 Non-Compliance & Deviation Audit Log</span>
            </div>

            <div className="flex items-center gap-1.5">
              {(['ALL', 'CRITICAL', 'RESOLVED'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    playTone(550, 0.03);
                    setAuditLogFilter(f);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    auditLogFilter === f
                      ? 'bg-rose-500/25 text-rose-200 border border-rose-500/40'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Audit Events List */}
          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/20 via-black/70 to-[#07080F] border border-rose-500/25 space-y-2 text-xs hover:border-rose-500/50 transition-all shadow-lg"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold text-[10px] border border-rose-500/40 flex items-center gap-1">
                      <AlertOctagon className="w-3 h-3" />
                      <span>{alert.eventType}</span>
                    </span>
                    <span className="font-bold text-zinc-100">{alert.titleTh}</span>
                  </div>

                  <span className="text-[10px] text-zinc-400 font-mono">{alert.timestamp}</span>
                </div>

                <p className="text-[11px] text-zinc-400 font-sans italic">{alert.titleEn}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded-xl bg-black/60 border border-white/5 text-[11px]">
                  <div>
                    <span className="text-zinc-500 block">BOUND CUSTODIAN:</span>
                    <span className="text-amber-300 font-mono font-semibold">{alert.custodianBound}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">STATUTORY MANDATE:</span>
                    <span className="text-cyan-300 font-semibold">{alert.statuteRef}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-white/5 text-[10px]">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span><strong>Resolution:</strong> {alert.resolutionStatus}</span>
                  </div>

                  <button
                    onClick={() => {
                      playTone(600, 0.04);
                      setSelectedAlert(alert);
                    }}
                    className="text-cyan-400 hover:text-white font-mono flex items-center gap-1 underline underline-offset-2"
                  >
                    <span>Inspect Leaf: {alert.auditTrailRef}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Alert Modal / Expanded Viewer */}
          {selectedAlert && (
            <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 space-y-2 text-xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                <span className="font-bold text-cyan-200 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-cyan-400" />
                  <span>Audit Trail Evidence Record: {selectedAlert.auditTrailRef}</span>
                </span>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="px-2 py-0.5 rounded-md bg-white/10 text-zinc-300 hover:text-white text-[10px]"
                >
                  Dismiss
                </button>
              </div>
              <div className="text-[11px] text-zinc-300 font-mono space-y-1">
                <div>Merkle Block Height: <strong>#849202</strong></div>
                <div>Proof Anchor: <strong>sha256:909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68</strong></div>
                <div>Signatory: <strong>Thai Sovereign Custodian Passport #EP-SOVEREIGN-01</strong></div>
                <div>Circuit Breaker Latency: <strong>0.38ms (Fail-Closed Validated)</strong></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
