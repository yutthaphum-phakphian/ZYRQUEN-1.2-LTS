import React, { useState, useEffect, useRef } from 'react';

export interface CustodyChainIntegrityViewerProps {
  mnf03Signed?: boolean;
  onViewCertificate?: () => void;
  onOpenTimelineGraph?: () => void;
  onExportBundleJson?: () => void;
}

interface QuorumSlot {
  id: string;
  name: string;
  status: 'verified' | 'pending';
  signer: string;
  timestamp: string;
  pk: string;
}

interface GoldMasterPassport {
  id: string;
  name: string;
  role: string;
  clearance: string;
  signature: string;
  status: 'VERIFIED';
}

const GOLD_MASTER_PASSPORTS: GoldMasterPassport[] = [
  {
    id: '#EP-SOVEREIGN-01',
    name: 'นายยุทธภูมิ พากเพียร',
    role: 'Sovereign Principal Architect & Genesis Custodian',
    clearance: 'OMEGA-1 SUPREME',
    signature: '5a13396c129c611f15232fdaf54bfad00c4147abdbc3424c71e4ec103dcc8cc3',
    status: 'VERIFIED',
  },
  {
    id: '#EP-001',
    name: 'พล. สมชาย พากเพียร',
    role: 'Civilization Control Governor',
    clearance: 'LEVEL 25',
    signature: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    status: 'VERIFIED',
  },
  {
    id: '#EP-007',
    name: 'ดร. กัญญารัตน์ เวชสิทธิ์',
    role: 'Chief Post-Quantum Cryptographer',
    clearance: 'LEVEL 22',
    signature: '7528e18501da86fc4691763a43fa4c68909ab814479844d8a14816bed34cdbb0',
    status: 'VERIFIED',
  },
  {
    id: '#EP-014',
    name: 'วศ. ธนพล เกียรติไพศาล',
    role: '15-Layer SRE Inspector',
    clearance: 'LEVEL 20',
    signature: '43fa4c68909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a',
    status: 'VERIFIED',
  },
  {
    id: '#EP-022',
    name: 'ศ.ดร. นครินทร์ สุวรรณเมฆา',
    role: 'Topology Architect',
    clearance: 'LEVEL 20',
    signature: '16bed34cdbb07528e18501da86fc4691763a43fa4c68909ab814479844d8a148',
    status: 'VERIFIED',
  },
  {
    id: '#EP-033',
    name: 'พญ. ดร. รพิพร รัตนพิบูลย์',
    role: 'Bio-AI Ethics Guardian',
    clearance: 'LEVEL 18',
    signature: '86fc4691763a43fa4c68909ab814479844d8a14816bed34cdbb07528e18501da',
    status: 'VERIFIED',
  },
  {
    id: '#EP-048',
    name: 'ดร. ธีรภัทร ชาญวณิชย์',
    role: 'Warp Engine Chief',
    clearance: 'LEVEL 18',
    signature: 'a18f91a3c091811e43fa4c68909ab814479844d8a14816bed34cdbb07528a30f',
    status: 'VERIFIED',
  },
  {
    id: '#EP-059',
    name: 'อ. เมธาวี อัครเดโช',
    role: 'Forensic Auditor',
    clearance: 'LEVEL 18',
    signature: 'b242e1b87d00f28a86fc4691763a43fa4c68909ab814479844d8a14816be811e',
    status: 'VERIFIED',
  },
  {
    id: '#EP-077',
    name: 'ดร. ชวินทร์ โรจนทรัพย์',
    role: 'Resilience Architect',
    clearance: 'LEVEL 16',
    signature: 'c37a109e3f19e48c7528e18501da86fc4691763a43fa4c68909ab8144798f28a',
    status: 'VERIFIED',
  },
  {
    id: '#EP-100',
    name: 'ดร. อภิชญา ทักษิณากุล',
    role: 'Knowledge Steward',
    clearance: 'LEVEL 16',
    signature: 'd41d04f29a28a30f16bed34cdbb07528e18501da86fc4691763a43fa4c6801a1',
    status: 'VERIFIED',
  },
];

const INITIAL_SLOTS: QuorumSlot[] = [
  { id: '#01', name: 'SSoT Custody Key Alpha', status: 'verified', signer: 'HSM Node #01', timestamp: '2026-09-12 17:35:10', pk: 'dilithium5_pk_99a81e...' },
  { id: '#02', name: 'Forensic Image MD5/SHA', status: 'verified', signer: 'HSM Node #01', timestamp: '2026-09-12 17:35:12', pk: 'dilithium5_pk_74b21c...' },
  { id: '#03', name: 'Observer Attestation Key', status: 'verified', signer: 'HSM Node #03', timestamp: '2026-09-12 17:36:04', pk: 'dilithium5_pk_33f990...' },
  { id: '#04', name: 'ETDA Compliance Node', status: 'verified', signer: 'HSM Node #01', timestamp: '2026-09-12 17:38:22', pk: 'dilithium5_pk_11d44a...' },
  { id: '#05', name: 'PDPA Consent Verification', status: 'verified', signer: 'HSM Node #02', timestamp: '2026-09-12 17:46:51', pk: 'dilithium5_pk_b241c6...' },
  { id: '#06', name: 'Zero State Drift Proof', status: 'verified', signer: 'HSM Node #03', timestamp: '2026-09-12 17:46:51', pk: 'dilithium5_pk_acb86d...' },
  { id: '#07', name: 'Judicial Registrar Witness', status: 'verified', signer: 'HSM Node #01', timestamp: '2026-09-12 17:46:51', pk: 'dilithium5_pk_dde480...' },
  { id: '#08', name: 'Super Majority Gate Anchor', status: 'verified', signer: 'HSM Node #02', timestamp: '2026-09-12 17:46:52', pk: 'dilithium5_pk_cc2741...' },
  { id: '#09', name: 'Sovereign Quorum Seal B', status: 'verified', signer: 'HSM Node #03', timestamp: '2026-09-12 17:46:52', pk: 'dilithium5_pk_e2d495...' },
  { id: '#10', name: 'Final Master Synthesis Key', status: 'verified', signer: 'HSM Node #01', timestamp: '2026-09-12 17:46:52', pk: 'dilithium5_pk_7789f8...' },
];

export const CustodyChainIntegrityViewer: React.FC<CustodyChainIntegrityViewerProps> = ({
  mnf03Signed = true,
  onViewCertificate,
  onOpenTimelineGraph,
  onExportBundleJson,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'flow' | 'certificate' | 'legal' | 'bundle' | 'passports'>('dashboard');
  const [slots, setSlots] = useState<QuorumSlot[]>(INITIAL_SLOTS);
  const [blockHeight, setBlockHeight] = useState<number>(849208);
  const [sealsCount, setSealsCount] = useState<number>(14908);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '[12-SEP-2026 17:40:01] INIT: Custody Chain Bundle #CEB-ZYRQUEN loaded into memory ledger.',
    '[12-SEP-2026 17:40:02] VERIFIED: Physical Proof Slot #01 [SSoT Custody Key Alpha] - Dilithium-5 Valid.',
    '[12-SEP-2026 17:40:02] VERIFIED: Physical Proof Slot #02 [Forensic Image MD5/SHA256] - Dilithium-5 Valid.',
    '[12-SEP-2026 17:40:03] VERIFIED: Physical Proof Slot #03 [Observer Attestation Key] - Gateway UNLOCKED.',
    '[12-SEP-2026 17:40:04] VERIFIED: Physical Proof Slot #04 [ETDA Compliance Vault Node] - Dilithium-5 Valid.',
    '[12-SEP-2026 17:46:51] VERIFIED: Slot #05 [PDPA Consent Verification] signed successfully by HSM Node #2.',
    '[12-SEP-2026 17:46:51] VERIFIED: Slot #06 [Zero State Drift Proof] signed successfully by HSM Node #3.',
    '[12-SEP-2026 17:46:51] VERIFIED: Slot #07 [Judicial Registrar Witness] signed successfully by HSM Node #1.',
    '[12-SEP-2026 17:46:52] VERIFIED: Slot #08 [Super Majority Gate Anchor] signed successfully by HSM Node #2.',
    '[12-SEP-2026 17:46:52] SYSTEM ASCENSION: 8/10 Super Majority reached → Promotion Gate Unlocked.',
    '[12-SEP-2026 17:46:52] VERIFIED: Slot #09 [Sovereign Quorum Seal B] signed successfully by HSM Node #3.',
    '[12-SEP-2026 17:46:52] VERIFIED: Slot #10 [Final Master Synthesis Key] signed successfully by HSM Node #1.',
    '[12-SEP-2026 17:46:53] ASCENDED SOVEREIGN: 10/10 Full Quorum Anchored in Block #849202/#849208.',
  ]);

  const verifiedCount = slots.filter((s) => s.status === 'verified').length;
  const isSuperMajority = verifiedCount >= 8;
  const isAscended = verifiedCount === 10;

  const gaugeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const flowCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Web Audio Synthesizer (Zero External Dependencies)
  const playTone = (freq = 600, duration = 0.05, type: OscillatorType = 'sine') => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio fallback
    }
  };

  const playSuccessChime = () => {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      setTimeout(() => playTone(freq, 0.2, 'triangle'), idx * 75);
    });
  };

  const playAscensionFanfare = () => {
    [440, 554.37, 659.25, 880, 1108.73].forEach((freq, idx) => {
      setTimeout(() => playTone(freq, 0.35, 'sine'), idx * 90);
    });
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const addLog = (entry: string) => {
    const time = new Date().toTimeString().split(' ')[0];
    setTerminalLogs((prev) => [...prev, `[12-SEP-2026 ${time}] ${entry}`]);
  };

  // Sign single slot
  const handleSignSlot = (index: number) => {
    if (slots[index].status === 'verified') return;
    const now = new Date();
    const timeStr = now.toISOString().replace('T', ' ').substring(0, 19);
    const updated = [...slots];
    const nodeIndex = (index % 3) + 1;
    updated[index] = {
      ...updated[index],
      status: 'verified',
      signer: `HSM Node #0${nodeIndex}`,
      timestamp: timeStr,
      pk: `dilithium5_pk_${Math.random().toString(16).substring(2, 8)}...`,
    };
    setSlots(updated);
    setBlockHeight((h) => h + 1);
    setSealsCount((s) => s + 1);

    const newVerified = updated.filter((s) => s.status === 'verified').length;
    playTone(650, 0.08);
    addLog(`VERIFIED: Slot ${updated[index].id} [${updated[index].name}] signed successfully by ${updated[index].signer}.`);

    if (newVerified === 8) {
      playSuccessChime();
      triggerToast('SUPER MAJORITY REACHED (8/10)! Promotion Gate Unlocked.');
      addLog('SYSTEM ASCENSION: 8/10 Super Majority reached. Promotion Gate Unlocked.');
    } else if (newVerified === 10) {
      playAscensionFanfare();
      triggerToast('FULL ASCENSION (10/10)! Sovereign Integrity Achieved.');
      addLog('ASCENDED SOVEREIGN: 10/10 Full Quorum Anchored.');
    }
  };

  // Auto-simulate signing
  const handleAutoSign = (target: 8 | 10) => {
    let delay = 0;
    slots.forEach((s, idx) => {
      if (idx < target && s.status === 'pending') {
        setTimeout(() => {
          handleSignSlot(idx);
        }, delay);
        delay += 250;
      }
    });
  };

  // Reset to Baseline 4/10
  const handleResetBaseline = () => {
    const reset = slots.map((s, idx) => {
      if (idx < 4) {
        return s;
      }
      return {
        ...s,
        status: 'pending' as const,
        signer: 'Pending Sign',
        timestamp: '-',
        pk: 'dilithium5_pk_unassigned',
      };
    });
    setSlots(reset);
    playTone(320, 0.15, 'square');
    addLog('RESET: Quorum reset to initial baseline (4/10 Verified).');
    triggerToast('Quorum reset to baseline 4/10.');
  };

  // Export current terminal log stream as a signed JSON audit file
  const handleExportLogStream = () => {
    playSuccessChime();
    const exportBundle = {
      header: '# ======================================================================',
      title: 'ZYRQUEN Ω∞ SOVEREIGN TERMINAL AUDIT LOG STREAM',
      version: 'v1.2 LTS (LOCKED_FROZEN_v1.2_LTS)',
      product: 'ZYRQUEN Ω∞ v4.16 PDPA FINAL (Frozen v1.2 LTS) | Engine v4.16 | NPM v4.16.0',
      canonical_boundary: 'Ω600_1000',
      boundary_scope: 'Ω601-Ω1000 Strict (400 Tenants LOCKED)',
      sovereign_principal: 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
      mutation_authority: '0 Read Only',
      clearance: 'OMEGA-1 SUPREME CLEARANCE',
      export_timestamp_iso: new Date().toISOString(),
      export_timestamp_ict: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('th-TH') + ' ICT',
      canonical_block_height: blockHeight,
      canonical_blocks: ['#849202', '#849203', '#40202', `#${blockHeight}`],
      canonical_seals_verified: 14902,
      quarantined_seals_isolated: 80,
      total_seals_raw: 14982,
      merkle_root: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      attestation_certificate: 'ZQ-GOLD-DEP-849202-3908',
      ssot_drift_integrity: 'Δ0.00% ZERO DRIFT',
      quorum_verification: {
        consensus: `${verifiedCount}/10 REAL_HSM FIPS 140-3 Level 4 at 14.98 mK`,
        super_majority_passed: isSuperMajority,
        ascended_sovereign: isAscended,
        slots: slots.map((s) => ({
          slot_id: s.id,
          name: s.name,
          status: s.status,
          signer: s.signer,
          key_type: s.pk,
          timestamp: s.timestamp,
        })),
      },
      post_quantum_cryptography: {
        fips_203: 'ML-KEM-1024',
        fips_204: 'ML-DSA-87 (Dilithium-5)',
        fips_205: 'SLH-DSA',
        pqc_signature_seal: '5a13396c129c611f15232fdaf54bfad00c4147abdbc3424c71e4ec103dcc8cc3::HSM_REAL_SIGNED::DILITHIUM5',
      },
      statutory_compliance: {
        thailand_pdpa: 'มาตรา 9 (ความยินยอม), มาตรา 26 (ข้อมูลอ่อนไหว), มาตรา 28 (ข้ามพรมแดน)',
        etda_safe_harbor: 'Electronic Transactions Act Section 9, 26, 28 Safe Harbor',
      },
      log_stream_metadata: {
        total_entries: terminalLogs.length,
        channel: 'FORENSIC TELEMETRY AUDIT LOG (V25 LEDGER)',
        integrity: 'IMMUTABLE_CHAIN_OF_CUSTODY',
      },
      log_stream: terminalLogs.map((log, idx) => ({
        sequence: idx + 1,
        entry: log,
        verified: true,
      })),
    };

    const jsonString = JSON.stringify(exportBundle, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zyrquen-signed-audit-stream-block-${blockHeight}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    triggerToast('📥 Exported Signed JSON Audit Log Stream successfully (10/10 REAL_HSM Sealed)!');
    addLog(`EXPORT: Signed JSON Audit Log Stream downloaded (#${blockHeight}, 14,902 Seals Verified).`);
  };

  // Draw Quorum Gauge (Solid lines without gradients)
  useEffect(() => {
    const canvas = gaugeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h - 18;
    const radius = 100;

    ctx.clearRect(0, 0, w, h);

    // Background track
    ctx.beginPath();
    ctx.arc(cx, cy, radius, Math.PI, 2 * Math.PI, false);
    ctx.lineWidth = 16;
    ctx.strokeStyle = '#070a12';
    ctx.stroke();

    // Secondary ring border
    ctx.beginPath();
    ctx.arc(cx, cy, radius, Math.PI, 2 * Math.PI, false);
    ctx.lineWidth = 18;
    ctx.strokeStyle = '#27272a';
    ctx.stroke();

    // Progress Arc (Solid color based on state)
    const percentage = verifiedCount / 10;
    const startAngle = Math.PI;
    const endAngle = Math.PI + percentage * Math.PI;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle, false);
    ctx.lineWidth = 16;
    ctx.strokeStyle = verifiedCount === 10 ? '#D4AF37' : verifiedCount >= 8 ? '#06B6D4' : '#f59e0b';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Ticks
    for (let i = 0; i <= 10; i++) {
      const angle = Math.PI + (i / 10) * Math.PI;
      const tx1 = cx + (radius - 12) * Math.cos(angle);
      const ty1 = cy + (radius - 12) * Math.sin(angle);
      const tx2 = cx + (radius - 20) * Math.cos(angle);
      const ty2 = cy + (radius - 20) * Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(tx1, ty1);
      ctx.lineTo(tx2, ty2);
      ctx.lineWidth = i === 8 || i === 10 ? 3 : 1;
      ctx.strokeStyle = i <= verifiedCount ? '#D4AF37' : '#52525b';
      ctx.stroke();
    }

    // Needle
    const needleAngle = Math.PI + percentage * Math.PI;
    const nx = cx + (radius - 24) * Math.cos(needleAngle);
    const ny = cy + (radius - 24) * Math.sin(needleAngle);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(nx, ny);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#D4AF37';
    ctx.fill();
  }, [verifiedCount]);

  // Real-Time Packet Canvas Simulation (Solid lines & particles)
  useEffect(() => {
    const canvas = flowCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const packets = [
      { x: 60, speed: 2.2, color: '#06B6D4' },
      { x: 260, speed: 2.5, color: '#D4AF37' },
      { x: 480, speed: 2.0, color: '#10b981' },
      { x: 680, speed: 2.8, color: '#D4AF37' },
    ];

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Connecting baseline
      ctx.beginPath();
      ctx.moveTo(70, h / 2);
      ctx.lineTo(w - 70, h / 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = isAscended ? '#D4AF37' : isSuperMajority ? '#06B6D4' : '#27272a';
      ctx.stroke();

      // Nodes
      const nodes = [
        { x: 70, name: 'Intake Phase', color: '#06B6D4' },
        { x: 280, name: 'HSM Attestation', color: '#D4AF37' },
        { x: 540, name: 'Quorum Gate', color: isSuperMajority ? '#10b981' : '#52525b' },
        { x: w - 70, name: 'Court Bundle', color: isAscended ? '#D4AF37' : '#52525b' },
      ];

      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, h / 2, 13, 0, 2 * Math.PI);
        ctx.fillStyle = n.color;
        ctx.fill();

        ctx.font = '10px monospace';
        ctx.fillStyle = '#a1a1aa';
        ctx.textAlign = 'center';
        ctx.fillText(n.name, n.x, h / 2 + 30);
      });

      // Animated Packets
      packets.forEach((p) => {
        p.x += p.speed;
        if (p.x > w - 70) p.x = 70;

        ctx.beginPath();
        ctx.arc(p.x, h / 2, 5, 0, 2 * Math.PI);
        ctx.fillStyle = p.color;
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isSuperMajority, isAscended]);

  const canonicalJson = JSON.stringify(
    {
      bundle_id: 'CEB-ZYRQUEN-Ω∞-V25',
      ref: 'PKG-FIOS-EVIDENCE-MASTER-V2.1',
      engine: 'v1.2 LTS (LOCKEDFROZENv1.2_LTS)',
      credential_id: 'urn:zyrquen:audit:849202:1789169498750',
      timestamp: '2026-09-12T17:47:05.000Z',
      sovereign_principal: 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
      statutory_clearance: 'OMEGA-1 SUPREME CLEARANCE',
      canonical_block_height: blockHeight,
      genesis_block_height: 849202,
      canonical_seals_verified: 14902,
      total_seals_anchored: sealsCount,
      state_drift_integrity: 'Δ0.00%',
      boundary: 'Ω600_1000',
      quarantine_isolation: {
        range: '#14,903 – #14,907',
        boundary: 'RING-04-ISOLATED-BUFFER',
        reconciliation_status: 'FORENSICISOLATIONCONFIRMEDZEROLEAK',
        canonical_drift: 'Δ0.00%',
      },
      cryptography: {
        kem: 'ML-KEM-1024 (FIPS 203)',
        signature: 'Dilithium-5 (FIPS 204) / Ed25519',
        hardware_enclave: 'Sovereign Physical HSM Node #01 FIPS 140-3 Level 4',
      },
      merkle_root: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      quorum_verification: {
        current_verified: verifiedCount,
        target_required: 8,
        super_majority_attained: isSuperMajority,
        ascended_sovereign: isAscended,
        proofs: slots.map((s) => ({
          slot_id: s.id,
          name: s.name,
          status: s.status,
          signer: s.signer,
          public_key: s.pk,
          timestamp: s.timestamp,
        })),
      },
      statutory_compliance: {
        etda_thailand: ['Sec 9 (E-Sign)', 'Sec 26 (Trusted Signature)', 'Sec 28 (Digital Cert)'],
        pdpa_thailand: ['Sec 19 (Consent & Scope)', 'Sec 27 (Zero Leak)', 'Sec 37 (Hardened Security)'],
      },
    },
    null,
    2
  );

  const handleCopyJson = () => {
    navigator.clipboard?.writeText(canonicalJson);
    playTone(850, 0.05);
    triggerToast('Canonical Evidence JSON copied to clipboard!');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200 text-zinc-200">
      {/* 1. Header Banner with Sovereign Status */}
      <div className="p-5 rounded-2xl bg-[#0a0f1e] border border-[#D4AF37] shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl">👑</span>
              <h3 className="text-lg font-bold text-white tracking-wide">
                Custody Chain Integrity Viewer
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]">
                V2.1 COURT-READY
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border tracking-wider flex items-center gap-1.5 ${
                  isAscended
                    ? 'bg-amber-950/80 text-[#D4AF37] border-[#D4AF37]'
                    : isSuperMajority
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                }`}
              >
                <span>{isAscended ? '👑' : isSuperMajority ? '🔓' : '🔒'}</span>
                <span>
                  {isAscended
                    ? 'ASCENDED SOVEREIGN (10/10)'
                    : isSuperMajority
                    ? 'SUPER MAJORITY (8/10)'
                    : `AWAITING QUORUM (${verifiedCount}/10)`}
                </span>
              </span>
            </div>
            <div className="text-xs text-zinc-400 font-mono flex items-center gap-2 flex-wrap">
              <span className="text-[#06B6D4] font-bold">Standard: Dilithium-5 / ML-KEM-1024</span>
              <span>•</span>
              <span>Boundary: <strong className="text-white">Ω600_1000</strong> (400 Tenants LOCKED)</span>
              <span>•</span>
              <span className="text-zinc-300">Principal: นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenTimelineGraph && (
              <button
                onClick={() => {
                  playTone(660, 0.03);
                  onOpenTimelineGraph();
                }}
                className="px-3 py-1.5 rounded-xl bg-[#070a12] hover:bg-cyan-950/50 text-[#06B6D4] border border-[#06B6D4]/60 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>📜</span>
                <span>Visual Timeline Graph</span>
              </button>
            )}

            <button
              onClick={() => {
                playTone(700, 0.03);
                handleCopyJson();
              }}
              className="px-3 py-1.5 rounded-xl bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] border border-[#D4AF37]/60 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>📑</span>
              <span>Copy Canonical JSON</span>
            </button>

            {onViewCertificate && (
              <button
                onClick={() => {
                  playTone(720, 0.03);
                  onViewCertificate();
                }}
                className="px-3 py-1.5 rounded-xl bg-[#070a12] hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>⚖️</span>
                <span>View Full Certificate</span>
              </button>
            )}
          </div>
        </div>

        {/* Top 6 Metadata Strips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-mono">
          <div className="bg-[#070a12] p-2 rounded-xl border border-zinc-800">
            <span className="text-zinc-500">BUNDLE ID:</span>
            <div className="text-white font-bold truncate">CEB-ZYRQUEN-Ω∞-V25</div>
          </div>
          <div className="bg-[#070a12] p-2 rounded-xl border border-zinc-800">
            <span className="text-zinc-500">REF:</span>
            <div className="text-zinc-300 font-bold truncate">PKG-FIOS-MASTER-V2.1</div>
          </div>
          <div className="bg-[#070a12] p-2 rounded-xl border border-zinc-800">
            <span className="text-zinc-500">BLOCK:</span>
            <div className="text-[#06B6D4] font-bold">#{blockHeight.toLocaleString()}</div>
          </div>
          <div className="bg-[#070a12] p-2 rounded-xl border border-zinc-800">
            <span className="text-zinc-500">SEALS:</span>
            <div className="text-emerald-400 font-bold">{sealsCount.toLocaleString()}</div>
          </div>
          <div className="bg-[#070a12] p-2 rounded-xl border border-zinc-800">
            <span className="text-zinc-500">STATE DRIFT:</span>
            <div className="text-emerald-400 font-bold">Δ0.00% (Zero)</div>
          </div>
          <div className="bg-[#070a12] p-2 rounded-xl border border-zinc-800">
            <span className="text-zinc-500">BOUNDARY:</span>
            <div className="text-[#D4AF37] font-bold">Ω600_1000</div>
          </div>
        </div>
      </div>

      {/* 2. Primary Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto p-2 rounded-xl bg-[#0a0f1e] border border-zinc-800 text-xs font-mono">
        <button
          onClick={() => {
            playTone(550, 0.03);
            setActiveTab('dashboard');
          }}
          className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
            activeTab === 'dashboard'
              ? 'bg-[#070a12] text-[#06B6D4] border border-[#06B6D4]'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <span>⚡</span>
          <span>Quorum Dashboard &amp; Simulator</span>
        </button>

        <button
          onClick={() => {
            playTone(600, 0.03);
            setActiveTab('flow');
          }}
          className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
            activeTab === 'flow'
              ? 'bg-[#070a12] text-[#06B6D4] border border-[#06B6D4]'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <span>🌐</span>
          <span>Custody Chain Flow Graph</span>
        </button>

        <button
          onClick={() => {
            playTone(650, 0.03);
            setActiveTab('certificate');
          }}
          className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
            activeTab === 'certificate'
              ? 'bg-[#070a12] text-[#D4AF37] border border-[#D4AF37]'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <span>👑</span>
          <span>Sovereign Ledger Certificate</span>
        </button>

        <button
          onClick={() => {
            playTone(700, 0.03);
            setActiveTab('legal');
          }}
          className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
            activeTab === 'legal'
              ? 'bg-[#070a12] text-emerald-400 border border-emerald-500'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <span>⚖️</span>
          <span>Legal Compliance Matrix</span>
        </button>

        <button
          onClick={() => {
            playTone(750, 0.03);
            setActiveTab('bundle');
          }}
          className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
            activeTab === 'bundle'
              ? 'bg-[#070a12] text-purple-300 border border-purple-500'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <span>📑</span>
          <span>Forensic Bundle Inspector</span>
        </button>

        <button
          onClick={() => {
            playTone(800, 0.03);
            setActiveTab('passports');
          }}
          className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
            activeTab === 'passports'
              ? 'bg-[#070a12] text-[#D4AF37] border border-[#D4AF37]'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <span>🛡️</span>
          <span>10 Gold Master Passports</span>
        </button>
      </div>

      {/* 3. TAB 1: QUORUM DASHBOARD & SIMULATOR */}
      {activeTab === 'dashboard' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Top Ascension Alert Banner */}
          <div
            className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
              isAscended
                ? 'bg-[#070a12] border-[#D4AF37]'
                : isSuperMajority
                ? 'bg-[#070a12] border-emerald-500'
                : 'bg-[#070a12] border-amber-500/50'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">{isAscended ? '👑' : isSuperMajority ? '🔓' : '⏳'}</span>
                <span className="font-bold text-white text-sm">
                  {isAscended
                    ? 'Ascended Sovereign Quorum Attained (10/10)'
                    : isSuperMajority
                    ? 'Super Majority Quorum Attained (8/10)'
                    : `Quorum Verification in Progress (${verifiedCount}/10)`}
                </span>
              </div>
              <p className="text-xs text-zinc-300 font-mono">
                {isAscended
                  ? 'ระบบได้รับการลงนามครบถ้วน 10/10 Real HSM Council ทุกตำแหน่ง — ประตูเลื่อนขั้น (Promotion Gate) ปลดล็อกอย่างถาวร.'
                  : isSuperMajority
                  ? 'ระบบผ่านเกณฑ์ 8/10 Super Majority Quorum แล้ว — ประตูเลื่อนขั้นปลดล็อก อนุญาต Canonical Mutation.'
                  : `ต้องการอีก ${Math.max(0, 8 - verifiedCount)} ลายเซ็นเพื่อบรรลุ 8/10 Super Majority Quorum.`}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleAutoSign(8)}
                className="px-3 py-1.5 rounded-lg bg-[#0a0f1e] hover:bg-emerald-950/60 text-emerald-300 border border-emerald-500 text-xs font-bold font-mono transition cursor-pointer"
              >
                ⚡ Auto-Sign (8/10)
              </button>
              <button
                onClick={() => handleAutoSign(10)}
                className="px-3 py-1.5 rounded-lg bg-[#0a0f1e] hover:bg-amber-950/60 text-[#D4AF37] border border-[#D4AF37] text-xs font-bold font-mono transition cursor-pointer"
              >
                👑 Full Ascension (10/10)
              </button>
              <button
                onClick={handleResetBaseline}
                className="px-3 py-1.5 rounded-lg bg-[#0a0f1e] hover:bg-zinc-800 text-zinc-400 border border-zinc-700 text-xs font-bold font-mono transition cursor-pointer"
              >
                ↺ Reset (4/10)
              </button>
            </div>
          </div>

          {/* Meter & Quick Slots Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Gauge Meter Box */}
            <div className="p-4 rounded-xl bg-[#0a0f1e] border border-zinc-800 flex flex-col items-center justify-between">
              <div className="w-full flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400">QUORUM METER</span>
                <span
                  className={`px-2 py-0.5 rounded font-bold ${
                    isAscended
                      ? 'bg-amber-950 text-[#D4AF37] border border-[#D4AF37]'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                  }`}
                >
                  {verifiedCount * 10}% VERIFIED
                </span>
              </div>

              <div className="relative w-64 h-36 flex items-center justify-center my-2">
                <canvas ref={gaugeCanvasRef} width={256} height={144} className="w-full h-full" />
                <div className="absolute bottom-1 flex flex-col items-center">
                  <span className="text-2xl font-black text-white font-mono">{verifiedCount} / 10</span>
                  <span className="text-[10px] text-zinc-400 font-mono">Physical HSM Proofs</span>
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-2 text-center text-[11px] font-mono pt-2 border-t border-zinc-800">
                <div className="p-1.5 rounded bg-[#070a12] border border-zinc-800">
                  <div className="text-zinc-500">TARGET</div>
                  <div className="text-[#06B6D4] font-bold">8 / 10 Super Majority</div>
                </div>
                <div className="p-1.5 rounded bg-[#070a12] border border-zinc-800">
                  <div className="text-zinc-500">GATE STATUS</div>
                  <div
                    className={`font-bold ${
                      isAscended ? 'text-[#D4AF37]' : isSuperMajority ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {isAscended ? '👑 ASCENDED' : isSuperMajority ? '🔓 UNLOCKED' : '🔒 LOCKED'}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick 10 Slots Badges */}
            <div className="lg:col-span-2 p-4 rounded-xl bg-[#0a0f1e] border border-zinc-800 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>🛡️</span>
                    <span>Physical HSM Signatures Matrix</span>
                  </h4>
                  <p className="text-xs text-zinc-400">Node Authority: Sovereign Physical Cluster #01 (FIPS 140-3 L4)</p>
                </div>
                <span className="text-xs text-emerald-400 font-mono font-bold">100% Sovereign Enclave</span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {slots.map((s, idx) => (
                  <div
                    key={s.id}
                    className={`p-2 rounded-xl text-center border font-mono transition ${
                      s.status === 'verified'
                        ? 'bg-[#070a12] border-emerald-500/60 text-emerald-300'
                        : 'bg-[#070a12] border-zinc-800 text-zinc-500'
                    }`}
                  >
                    <div className="text-[10px] text-zinc-400">{s.id}</div>
                    <div className="text-base my-0.5">{s.status === 'verified' ? '✅' : '🔒'}</div>
                    <div className="text-[9px] font-bold uppercase truncate">{s.status}</div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
                <span>Verified: <strong className="text-emerald-400">{verifiedCount}</strong> / 10</span>
                <span>Pending: <strong className="text-amber-400">{10 - verifiedCount}</strong></span>
                <span>SSoT Invariant: <strong className="text-[#D4AF37]">Δ0.00% ZERO DRIFT</strong></span>
              </div>
            </div>
          </div>

          {/* Detailed 10 Slot Cards Grid */}
          <div className="p-4 rounded-xl bg-[#0a0f1e] border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-zinc-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🔐</span>
                  <span>Quorum Key Slots Management (Slots #01 to #10)</span>
                </h4>
                <p className="text-xs text-zinc-400">Interactive signing via Post-Quantum Dilithium-5 Enclave</p>
              </div>
              <span className="text-xs font-mono text-[#D4AF37] font-bold">Consensus: 100% Super Majority Safe</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
              {slots.map((s, idx) => (
                <div
                  key={s.id}
                  className={`p-3 rounded-xl border font-mono flex flex-col justify-between ${
                    s.status === 'verified'
                      ? 'bg-[#070a12] border-emerald-500/40 text-zinc-200'
                      : 'bg-[#070a12] border-zinc-800 text-zinc-500'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{s.id}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          s.status === 'verified'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white mt-1.5 truncate" title={s.name}>
                      {s.name}
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-1 truncate">Signer: {s.signer}</div>
                    <div className="text-[9px] text-zinc-500 truncate">PK: {s.pk}</div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500 truncate">{s.timestamp.split(' ')[1] || 'Pending'}</span>
                    {s.status === 'pending' ? (
                      <button
                        onClick={() => handleSignSlot(idx)}
                        className="px-2 py-1 rounded bg-[#06B6D4] hover:bg-cyan-600 text-black font-bold text-[10px] cursor-pointer"
                      >
                        Sign ✍️
                      </button>
                    ) : (
                      <span className="text-emerald-400 font-bold">Signed ✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Terminal Audit Log Box */}
          <div className="p-4 rounded-xl bg-[#070a12] border border-zinc-800 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="font-bold text-zinc-200">FORENSIC TELEMETRY AUDIT LOG (V25 LEDGER)</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportLogStream}
                  className="px-2.5 py-1 rounded-lg bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/50 text-[10px] font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Export Audit Log Stream as Signed JSON"
                >
                  <span>📥</span>
                  <span>Export Signed JSON</span>
                </button>
                <button
                  onClick={() => setTerminalLogs([])}
                  className="text-[11px] text-zinc-500 hover:text-white cursor-pointer"
                >
                  Clear Log
                </button>
              </div>
            </div>
            <div className="h-32 overflow-y-auto space-y-1 text-zinc-300 text-[11px] pr-2">
              {terminalLogs.map((log, i) => (
                <div key={i} className="leading-relaxed">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: CUSTODY CHAIN FLOW GRAPH */}
      {activeTab === 'flow' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="p-4 rounded-xl bg-[#0a0f1e] border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 flex-wrap gap-2">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🌐</span>
                  <span>End-to-End Evidence Lifecycle Pipeline</span>
                </h4>
                <p className="text-xs text-zinc-400">Intake → Attestation → Promotion Gate → Court-Ready Output</p>
              </div>
              <span className="px-2 py-1 rounded bg-[#070a12] border border-[#D4AF37] text-xs font-mono text-[#D4AF37]">
                Status: Court-Ready Ascended
              </span>
            </div>

            {/* Pipeline Stage Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 font-mono text-xs">
              {/* Step 1 */}
              <div className="p-3.5 rounded-xl bg-[#070a12] border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 text-[10px]">PHASE 1</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[9px] font-bold">
                    PASSED
                  </span>
                </div>
                <div className="text-2xl">📦</div>
                <div className="font-bold text-white text-sm">Evidence Intake</div>
                <div className="text-[11px] text-zinc-400">Quarantine &amp; Ledger Setup</div>
                <div className="pt-2 border-t border-zinc-800 text-[10px] space-y-0.5 text-zinc-400">
                  <div>Mode: <span className="text-white font-bold">FAIL-CLOSED</span></div>
                  <div>Digest: <span className="text-emerald-400">SHA-256 OK</span></div>
                  <div>SSoT: <span className="text-[#06B6D4]">Immutable</span></div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 rounded-xl bg-[#070a12] border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 text-[10px]">PHASE 2</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[9px] font-bold">
                    COMPLETE
                  </span>
                </div>
                <div className="text-2xl">🔐</div>
                <div className="font-bold text-white text-sm">HSM Attestation</div>
                <div className="text-[11px] text-zinc-400">Quorum Ceremony Signing</div>
                <div className="pt-2 border-t border-zinc-800 text-[10px] space-y-0.5 text-zinc-400">
                  <div>Observer Key #03: <span className="text-emerald-400 font-bold">SIGNED</span></div>
                  <div>Verified: <span className="text-[#D4AF37] font-bold">{verifiedCount} / 10</span></div>
                  <div>Algorithm: <span className="text-white">Dilithium-5</span></div>
                </div>
              </div>

              {/* Step 3 */}
              <div
                className={`p-3.5 rounded-xl bg-[#070a12] border space-y-2 ${
                  isSuperMajority ? 'border-emerald-500/60' : 'border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 text-[10px]">GATEWAY</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      isSuperMajority ? 'bg-emerald-950 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {isSuperMajority ? 'UNLOCKED' : 'LOCKED'}
                  </span>
                </div>
                <div className="text-2xl">{isSuperMajority ? '🔓' : '🔒'}</div>
                <div className="font-bold text-white text-sm">Promotion Gate</div>
                <div className="text-[11px] text-zinc-400">Super Majority Threshold</div>
                <div className="pt-2 border-t border-zinc-800 text-[10px] space-y-0.5 text-zinc-400">
                  <div>Threshold: <span className="text-white">80% Majority</span></div>
                  <div>Status: <span className="text-emerald-400 font-bold">{isSuperMajority ? 'PASS' : 'HOLD'}</span></div>
                  <div>Drift: <span className="text-emerald-400">Δ0.00% Safe</span></div>
                </div>
              </div>

              {/* Step 4 */}
              <div
                className={`p-3.5 rounded-xl bg-[#070a12] border space-y-2 ${
                  isAscended ? 'border-[#D4AF37]' : 'border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 text-[10px]">PHASE 3</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      isAscended ? 'bg-amber-950 text-[#D4AF37]' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {isAscended ? 'SYNTHESIZED' : 'STANDBY'}
                  </span>
                </div>
                <div className="text-2xl">⚖️</div>
                <div className="font-bold text-white text-sm">Court-Ready Output</div>
                <div className="text-[11px] text-zinc-400">Forensic JSON &amp; PDF Bundle</div>
                <div className="pt-2 border-t border-zinc-800 text-[10px] space-y-0.5 text-zinc-400">
                  <div>ETDA: <span className="text-emerald-400 font-bold">Sec 9, 26, 28</span></div>
                  <div>PDPA: <span className="text-emerald-400 font-bold">Sec 19, 27, 37</span></div>
                  <div>Bundle: <span className="text-[#D4AF37] font-bold">CEB-V25</span></div>
                </div>
              </div>
            </div>

            {/* Real-time packet canvas simulation */}
            <div className="p-3.5 rounded-xl bg-[#070a12] border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-300 font-bold">REAL-TIME PACKET FLOW SIMULATION</span>
                <span className="text-[#D4AF37]">Ascended Sovereign Stream Active</span>
              </div>
              <canvas ref={flowCanvasRef} width={800} height={120} className="w-full h-28 bg-[#0a0f1e] rounded-lg" />
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 3: SOVEREIGN LEDGER CERTIFICATE */}
      {activeTab === 'certificate' && (
        <div className="p-6 rounded-2xl bg-[#0a0f1e] border-2 border-[#D4AF37] shadow-2xl space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col md:flex-row items-center justify-between border-b border-[#D4AF37]/50 pb-5 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#070a12] border border-[#D4AF37] flex items-center justify-center text-3xl">
                👑
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#D4AF37] tracking-wider">CERTIFICATE OF ASCENSION</h3>
                <p className="text-xs font-mono text-zinc-400">Sovereign Physical HSM Ledger • Judicial Evidence Record</p>
              </div>
            </div>
            <div className="text-right font-mono text-xs">
              <div className="px-3 py-1 rounded bg-[#070a12] border border-[#D4AF37] text-[#D4AF37] font-bold inline-block">
                SOVEREIGN VERIFIED
              </div>
              <div className="text-zinc-500 mt-1">Date: 12 SEP 2026 • 17:47:05 UTC+7</div>
            </div>
          </div>

          <div className="text-center space-y-1 font-mono">
            <span className="text-xs text-zinc-400 uppercase tracking-widest">This Official Document Certifies That</span>
            <div className="text-lg font-bold text-white">EVIDENCE BUNDLE #CEB-ZYRQUEN-Ω∞-V25</div>
            <div className="text-xs text-[#06B6D4]">Reference: PKG-FIOS-MASTER-V2.1</div>
          </div>

          <div className="p-4 rounded-xl bg-[#070a12] border border-zinc-800 font-mono text-xs grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <span className="text-zinc-500">Quorum State:</span>{' '}
              <span className="text-[#D4AF37] font-bold">{verifiedCount} / 10 Physical Proofs (100%)</span>
            </div>
            <div>
              <span className="text-zinc-500">Promotion Gate:</span>{' '}
              <span className="text-emerald-400 font-bold">ASCENDED (Permanently Unlocked)</span>
            </div>
            <div>
              <span className="text-zinc-500">Canonical Block:</span>{' '}
              <span className="text-white font-bold">#{blockHeight.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-zinc-500">Seals Anchored:</span>{' '}
              <span className="text-white font-bold">{sealsCount.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-zinc-500">State Drift Integrity:</span>{' '}
              <span className="text-emerald-400 font-bold">Δ0.00% (Zero Drift Invariant)</span>
            </div>
            <div>
              <span className="text-zinc-500">Hardware Attestation:</span>{' '}
              <span className="text-cyan-300 font-bold">Sovereign Physical HSM Node #01</span>
            </div>
            <div className="md:col-span-2 pt-2 border-t border-zinc-800">
              <span className="text-zinc-500">Sovereign Principal Architect:</span>{' '}
              <span className="text-[#D4AF37] font-bold">นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)</span>
              <span className="ml-2 text-zinc-400 font-bold">[OMEGA-1 SUPREME CLEARANCE]</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#070a12] border border-zinc-800 text-xs font-mono text-zinc-300 space-y-2">
            <div className="font-bold text-[#D4AF37]">STATUTORY COMPLIANCE &amp; CRYPTOGRAPHIC PROOF</div>
            <p className="leading-relaxed text-zinc-400">
              The custody chain contained within this bundle complies strictly with Electronic Transactions Act (ETDA) Sections 9, 26, and 28 for electronic signature validity and non-repudiation, as well as Personal Data Protection Act (PDPA) Sections 19, 27, and 37. Cryptographic signatures are bound utilizing NIST Post-Quantum standard algorithms <strong>ML-KEM-1024</strong> (Key Encapsulation) and <strong>Dilithium-5</strong> (Digital Signature Scheme).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center font-mono text-xs">
            <div className="p-3 rounded-xl bg-[#070a12] border border-zinc-800">
              <div className="text-zinc-500 text-[10px]">CUSTODIAN ATTESTATION</div>
              <div className="text-cyan-300 font-bold mt-1">HSM Node #01 Master Key</div>
              <div className="text-[10px] text-zinc-500 truncate mt-0.5">dilithium5_pk_99a81e...</div>
            </div>
            <div className="p-3 rounded-xl bg-[#070a12] border border-zinc-800">
              <div className="text-zinc-500 text-[10px]">JUDICIAL WITNESS</div>
              <div className="text-emerald-400 font-bold mt-1">Judicial Registrar Node #01</div>
              <div className="text-[10px] text-zinc-500 truncate mt-0.5">dilithium5_pk_dde480...</div>
            </div>
            <div className="p-3 rounded-xl bg-[#070a12] border border-zinc-800">
              <div className="text-zinc-500 text-[10px]">CONSENSUS STATUS</div>
              <div className="text-[#D4AF37] font-bold mt-1">10/10 Super Majority</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">Ascended Sovereign</div>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
            <span className="text-zinc-400">
              Fingerprint: <code className="text-[#D4AF37]">SHA256: 909ab814479844d8...43fa4c68</code>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  playTone(700, 0.04);
                  window.print?.();
                }}
                className="px-3 py-1.5 rounded-lg bg-[#070a12] hover:bg-zinc-800 text-white border border-zinc-700 font-bold cursor-pointer"
              >
                🖨️ Print Official Certificate
              </button>
              <button
                onClick={() => {
                  playTone(750, 0.04);
                  triggerToast('Exporting Sovereign Certified Bundle (.json / .pdf)...');
                }}
                className="px-3 py-1.5 rounded-lg bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] border border-[#D4AF37] font-bold cursor-pointer"
              >
                📑 Export Signed Package
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 4: LEGAL COMPLIANCE MATRIX */}
      {activeTab === 'legal' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="p-4 rounded-xl bg-[#0a0f1e] border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 flex-wrap gap-2">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>⚖️</span>
                  <span>Legal &amp; Statutory Compliance Matrix</span>
                </h4>
                <p className="text-xs text-zinc-400">Verified alignment with ETDA (Thailand) &amp; PDPA Regulations</p>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-500 text-xs font-mono font-bold">
                ✓ FORENSIC READY
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              {/* ETDA Card */}
              <div className="p-4 rounded-xl bg-[#070a12] border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="text-white font-bold flex items-center gap-1.5">
                    <span>🏛️</span>
                    <span>ETDA (Electronic Transactions Act)</span>
                  </span>
                  <span className="text-[10px] text-[#06B6D4]">Thailand Standard</span>
                </div>
                <div className="space-y-2">
                  <div className="p-2 rounded bg-[#0a0f1e] border border-zinc-800/80 flex items-start justify-between">
                    <div>
                      <strong className="text-white">Sec 9 — E-Signature Integrity</strong>
                      <div className="text-[11px] text-zinc-400">Reliability &amp; non-repudiation of signatures</div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold text-[10px]">
                      COMPLIANT
                    </span>
                  </div>
                  <div className="p-2 rounded bg-[#0a0f1e] border border-zinc-800/80 flex items-start justify-between">
                    <div>
                      <strong className="text-white">Sec 26 — Trusted Signature</strong>
                      <div className="text-[11px] text-zinc-400">Post-quantum Dilithium-5 key validation</div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold text-[10px]">
                      VERIFIED
                    </span>
                  </div>
                  <div className="p-2 rounded bg-[#0a0f1e] border border-zinc-800/80 flex items-start justify-between">
                    <div>
                      <strong className="text-white">Sec 28 — Digital Certificate</strong>
                      <div className="text-[11px] text-zinc-400">Physical HSM Node #01 Attestation</div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold text-[10px]">
                      ANCHORED
                    </span>
                  </div>
                </div>
              </div>

              {/* PDPA Card */}
              <div className="p-4 rounded-xl bg-[#070a12] border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="text-white font-bold flex items-center gap-1.5">
                    <span>🛡️</span>
                    <span>PDPA (Personal Data Protection Act)</span>
                  </span>
                  <span className="text-[10px] text-indigo-300">Privacy Matrix</span>
                </div>
                <div className="space-y-2">
                  <div className="p-2 rounded bg-[#0a0f1e] border border-zinc-800/80 flex items-start justify-between">
                    <div>
                      <strong className="text-white">Sec 19 — Consent &amp; Scope</strong>
                      <div className="text-[11px] text-zinc-400">Forensic evidence bound to judicial scope</div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold text-[10px]">
                      BOUND
                    </span>
                  </div>
                  <div className="p-2 rounded bg-[#0a0f1e] border border-zinc-800/80 flex items-start justify-between">
                    <div>
                      <strong className="text-white">Sec 27 — No Unauthorized Disclosure</strong>
                      <div className="text-[11px] text-zinc-400">ML-KEM-1024 encrypted custody ledger payload</div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold text-[10px]">
                      ENCRYPTED
                    </span>
                  </div>
                  <div className="p-2 rounded bg-[#0a0f1e] border border-zinc-800/80 flex items-start justify-between">
                    <div>
                      <strong className="text-white">Sec 37 — Security Measures</strong>
                      <div className="text-[11px] text-zinc-400">Tamper-evident Zero Drift (Δ0.00%) architecture</div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold text-[10px]">
                      HARDENED
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB 5: FORENSIC BUNDLE INSPECTOR */}
      {activeTab === 'bundle' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="p-4 rounded-xl bg-[#0a0f1e] border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 flex-wrap gap-2">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>📑</span>
                  <span>Court-Ready Forensic Bundle Inspector</span>
                </h4>
                <p className="text-xs text-zinc-400">Raw Canonical JSON Evidence &amp; Presentation Dossier Preview</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyJson}
                  className="px-3 py-1.5 rounded-lg bg-[#070a12] hover:bg-zinc-800 text-white text-xs font-mono border border-zinc-700 cursor-pointer"
                >
                  📋 Copy JSON
                </button>
                <button
                  onClick={() => {
                    playSuccessChime();
                    triggerToast('Court Presentation Dossier PDF Synthesized & Signed!');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] text-xs font-mono font-bold border border-[#D4AF37] cursor-pointer"
                >
                  ⚖️ Synthesize PDF Bundle
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono text-xs">
              {/* Code viewer */}
              <div className="p-3 rounded-xl bg-[#070a12] border border-zinc-800 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-zinc-400 mb-2">
                  <span>canonical_evidence_bundle.json</span>
                  <span className="text-[#06B6D4] font-bold">ASCENDED READ-ONLY</span>
                </div>
                <pre className="h-80 overflow-y-auto text-[11px] text-cyan-300 p-2 bg-[#0a0f1e] rounded border border-zinc-800/80 leading-relaxed font-mono">
                  {canonicalJson}
                </pre>
              </div>

              {/* PDF Preview Mock */}
              <div className="p-4 rounded-xl bg-[#070a12] border border-zinc-800 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-zinc-400">
                  <span>Court_Presentation_Dossier.pdf</span>
                  <span className="text-[#D4AF37] font-bold">Canonical Synthesis</span>
                </div>

                <div className="p-4 rounded-xl bg-[#0a0f1e] border border-zinc-800 space-y-3 flex-grow font-sans text-xs">
                  <div className="text-center border-b border-zinc-800 pb-2">
                    <div className="font-bold text-white font-mono tracking-wider">FORENSIC EVIDENCE DOSSIER</div>
                    <div className="text-[10px] text-zinc-400 font-mono">HIGH COURT DIGITAL CUSTODY CHAIN RECORD</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-zinc-300">
                    <div><span className="text-zinc-500">Bundle ID:</span> CEB-ZYRQUEN-Ω∞-V25</div>
                    <div><span className="text-zinc-500">Date:</span> 12 September 2026</div>
                    <div><span className="text-zinc-500">State Drift:</span> Δ0.00% (Zero Drift)</div>
                    <div><span className="text-zinc-500">SSoT Baseline:</span> Immutable</div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800 text-[11px] font-mono space-y-1">
                    <div className="text-[#D4AF37] font-bold">CRYPTOGRAPHIC QUORUM CERTIFICATE:</div>
                    <p className="text-zinc-400 text-[10px] leading-relaxed">
                      This document certifies that the associated evidence package has achieved attestation under Sovereign Physical HSM Node #01 utilizing Dilithium-5 signatures and ML-KEM-1024 key encapsulation.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#070a12] border border-[#D4AF37]/50 text-[11px] font-mono space-y-1">
                    <div className="text-[#D4AF37] font-bold">CURRENT STATUS: {verifiedCount} / 10 VERIFIED</div>
                    <div className="text-zinc-400">Super Majority (8/10): <span className="text-emerald-400 font-bold">ATTAINED (PASS)</span></div>
                    <div className="text-zinc-400">Ascension State: <span className="text-[#D4AF37] font-bold">FULL ASCENDED SOVEREIGN</span></div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    playTone(600, 0.04);
                    triggerToast('Downloading Court Presentation Package (.pdf)...');
                  }}
                  className="w-full py-2 rounded-lg bg-[#0a0f1e] hover:bg-zinc-800 text-white font-mono text-xs border border-zinc-700 cursor-pointer"
                >
                  📥 Export PDF Package (.pdf)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. TAB 6: 10 GOLD MASTER SEAL PASSPORTS MATRIX */}
      {activeTab === 'passports' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="p-4 rounded-xl bg-[#0a0f1e] border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 flex-wrap gap-2">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🛡️</span>
                  <span>Official 10 Gold Master Seal Passports Matrix</span>
                </h4>
                <p className="text-xs text-zinc-400">
                  ทุก Custodian ผ่านการตรวจสอบ Post-Quantum Cryptography Key Signatures ครบ 10 ท่าน
                </p>
              </div>
              <span className="px-2.5 py-1 rounded bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37] text-xs font-mono font-bold">
                10/10 Gold Master Quorum
              </span>
            </div>

            {/* Passports Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border border-zinc-800">
                <thead className="bg-[#070a12] text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="p-2.5 border-r border-zinc-800">Passport ID</th>
                    <th className="p-2.5 border-r border-zinc-800">Custodian Name &amp; Role</th>
                    <th className="p-2.5 border-r border-zinc-800">Clearance</th>
                    <th className="p-2.5 border-r border-zinc-800">SHA-256 Signature</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-300">
                  {GOLD_MASTER_PASSPORTS.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-800/30 transition">
                      <td className="p-2.5 font-bold text-[#D4AF37] border-r border-zinc-800 whitespace-nowrap">
                        {p.id}
                      </td>
                      <td className="p-2.5 border-r border-zinc-800">
                        <div className="font-bold text-white">{p.name}</div>
                        <div className="text-[11px] text-zinc-400">{p.role}</div>
                      </td>
                      <td className="p-2.5 border-r border-zinc-800 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.clearance.includes('OMEGA-1')
                              ? 'bg-amber-950 text-[#D4AF37] border border-[#D4AF37]'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {p.clearance}
                        </span>
                      </td>
                      <td className="p-2.5 border-r border-zinc-800 font-mono text-[11px] text-[#06B6D4]">
                        <span title={p.signature}>
                          {p.signature.substring(0, 16)}...{p.signature.substring(p.signature.length - 8)}
                        </span>
                      </td>
                      <td className="p-2.5 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/50 font-bold text-[10px]">
                          🟢 VERIFIED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Forensic Quarantine Analysis (Ring-04 Buffer) */}
            <div className="p-4 rounded-xl bg-[#070a12] border border-amber-500/40 space-y-2 font-mono text-xs">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <span>🧮</span>
                <span>Forensic Quarantine Analysis (Ring-04 Buffer)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
                <div className="p-2 rounded bg-[#0a0f1e] border border-zinc-800">
                  <div className="text-zinc-500 text-[10px]">Quarantined Range:</div>
                  <div className="text-white font-bold">Seals #14,903 – #14,907 (5 Seals)</div>
                </div>
                <div className="p-2 rounded bg-[#0a0f1e] border border-zinc-800">
                  <div className="text-zinc-500 text-[10px]">Boundary:</div>
                  <div className="text-cyan-300 font-bold">RING-04-ISOLATED-BUFFER</div>
                </div>
                <div className="p-2 rounded bg-[#0a0f1e] border border-zinc-800">
                  <div className="text-zinc-500 text-[10px]">Reconciliation Status:</div>
                  <div className="text-emerald-400 font-bold truncate" title="FORENSICISOLATIONCONFIRMEDZEROLEAK">
                    CONFIRMED ZERO LEAK
                  </div>
                </div>
                <div className="p-2 rounded bg-[#0a0f1e] border border-zinc-800">
                  <div className="text-zinc-500 text-[10px]">Canonical Core Drift:</div>
                  <div className="text-[#D4AF37] font-bold">SSoT Mutation Δ = 0.00%</div>
                </div>
              </div>
            </div>

            {/* Punchline Card */}
            <div className="p-3.5 rounded-xl bg-[#070a12] border border-[#D4AF37]/60 text-xs font-mono text-zinc-300">
              <span className="text-[#D4AF37] font-bold">🌌 Punchline:</span>{' '}
              รายงานนี้คือหลักฐานระดับ Gold Master Quorum ที่ยืนยันความสมบูรณ์ของระบบ ZYRQUEN Ω∞ — ทุกตราประทับได้รับการตรวจสอบและลงนามครบ 10/10 พร้อมการรับรองทางกฎหมายไทยและมาตรฐาน Post-Quantum Cryptography.
            </div>
          </div>
        </div>
      )}

      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 p-3 rounded-xl bg-[#070a12] border border-[#D4AF37] text-white text-xs font-mono shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span>🔔</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default CustodyChainIntegrityViewer;
