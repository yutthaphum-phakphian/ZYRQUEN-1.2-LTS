import React, { useState, useEffect, useCallback } from 'react';
import {
  Presentation,
  Copy,
  Check,
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  FileCode,
  Sparkles,
  ShieldCheck,
  Crown,
  Lock,
  Cpu,
  Server,
  Globe,
  Award,
  BookOpen,
  Terminal,
  Grid,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playTone } from '../AudioSynthesizer';

export const MARP_MARKDOWN_RAW = `---
marp: true
theme: default
paginate: true
header: "ZYRQUEN Ω∞ Sovereign Kernel — Executive Slide Deck (v4.16 LTS)"
footer: "LOCKED_FROZEN_v1.2_LTS | SSoT Δ0 Zero Drift (0.00%) | Sovereign Principal: #EP-SOVEREIGN-01"
style: |
  section {
    background-color: #070a12;
    color: #e5e7eb;
    font-family: 'Inter', 'Segoe UI', Tahoma, sans-serif;
    padding: 40px 60px;
  }
  h1 { color: #D4AF37; border-bottom: 2px solid #17233f; font-size: 2.2em; margin-bottom: 0.2em; }
  h2 { color: #06B6D4; font-size: 1.5em; margin-top: 0; }
  h3 { color: #10B981; font-size: 1.2em; }
  
  /* Layout Grids */
  .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 15px; }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 15px; }
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 15px; }
  
  /* Cards & Hologram Panels */
  .card { background: #0a0f1e; border: 1px solid #17233f; padding: 18px; border-radius: 8px; }
  .card-gold { background: #0a0f1e; border: 1px solid #D4AF37; padding: 18px; border-radius: 8px; }
  .card-cyan { background: #0a0f1e; border: 1px solid #06B6D4; padding: 18px; border-radius: 8px; }
  
  /* Typography Highlights */
  .gold { color: #D4AF37; font-weight: bold; }
  .cyan { color: #06B6D4; font-weight: bold; }
  .green { color: #10B981; font-weight: bold; }
  .crimson { color: #EF4444; font-weight: bold; }
  .metric { font-size: 1.8em; font-weight: bold; margin: 5px 0; }
  
  /* Code & Data Blocks */
  .code-block { background: #030509; border: 1px solid #17233f; padding: 12px; font-family: monospace; font-size: 0.75em; color: #10B981; border-radius: 6px; }
  
  /* Blockquote for Speaker Notes */
  blockquote { background: #0e172a; border-left: 4px solid #D4AF37; padding: 10px 15px; font-size: 0.8em; color: #9ca3af; margin-top: 15px; }
---

<!-- _class: lead -->
<div style="text-align: center; margin-top: 40px;">
  <h1 style="font-size: 2.8em; border: none; color: #D4AF37;">ZYRQUEN Ω∞ SOVEREIGN KERNEL</h1>
  <h2>Executive Presentation & Engineering Audit Deck</h2>
  <div style="margin: 30px 0;">
    <span class="code-block" style="font-size: 1em; padding: 10px 20px;">
      STATUS: LOCKED_FROZEN_v1.2_LTS | SSoT Δ0 Baseline Drift 0.00%
    </span>
  </div>
  <p style="color: #9ca3af; font-size: 0.9em;">
    Sovereign Principal: <strong>นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)</strong><br>
    Anchor Block Height: #849202 | Security Level: APEX ULTIMATE v4.16
  </p>
</div>

---

# 01. Genesis Anchor & Immutable Baseline
## การเปลี่ยนผ่านสู่สัจจะทางคณิตศาสตร์สัมบูรณ์ (Mathematical Proof)

<div class="grid-2">
  <div class="card-gold">
    <p style="margin:0; font-size:0.85em;">Anchor Block Height</p>
    <div class="metric gold">#849202</div>
    <p style="margin:0; font-size:0.8em; color:#9ca3af;">Genesis Seal Rate: 100% Immutable</p>
  </div>
  <div class="card-cyan">
    <p style="margin:0; font-size:0.85em;">Baseline System Drift</p>
    <div class="metric cyan">0.00% (SSoT Δ0)</div>
    <p style="margin:0; font-size:0.8em; color:#9ca3af;">Inviolable Single Source of Truth</p>
  </div>
</div>

<div class="code-block" style="margin-top: 20px;">
Genesis Merkle Root: 909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68
Canonical Seals: 14,902 Verified (+80 Quarantined)
</div>

* **Mathematical vs. Marketing Seal:** ขจัดคำกล่าวอ้างแบบผิวเผินด้วยโครงสร้างพยานคณิตศาสตร์สัมบูรณ์
* **Zero Drift Verification:** รับประกันความสอดคล้องของสถานะระบบข้ามสภาพแวดล้อม ไร้การเบี่ยงเบน

> **Speaker Notes:** เรียนคณะกรรมการและ Auditor ทุกท่าน ระบบถูกตรึงไว้ที่ LOCKED_FROZEN_v1.2_LTS บนบล็อก #849202 ข้อมูลทุกชุดยืนยันด้วย Merkle Tree ที่ปราศจาก System Drift โดยสิ้นเชิง

---

# 02. Post-Quantum Cryptographic Shield
## เกราะรหัสลับยุคหลังควอนตัม (NIST PQC Standards)

<div class="grid-4">
  <div class="card">
    <span class="gold">ML-DSA-87</span>
    <p style="font-size: 0.75em; color: #9ca3af; margin-top:5px;">Dilithium-5</p>
    <p style="font-size: 0.7em;">Primary Digital Signature Scheme</p>
  </div>
  <div class="card">
    <span class="cyan">ML-KEM-1024</span>
    <p style="font-size: 0.75em; color: #9ca3af; margin-top:5px;">Kyber-1024</p>
    <p style="font-size: 0.7em;">Post-Quantum Key Exchange</p>
  </div>
  <div class="card">
    <span class="gold">SLH-DSA-192</span>
    <p style="font-size: 0.75em; color: #9ca3af; margin-top:5px;">SPHINCS+</p>
    <p style="font-size: 0.7em;">Stateless Hash-Based Redundancy</p>
  </div>
  <div class="card">
    <span class="cyan">FALCON-1024</span>
    <p style="font-size: 0.75em; color: #9ca3af; margin-top:5px;">Falcon Crypt</p>
    <p style="font-size: 0.7em;">Compact Fast Signature Verification</p>
  </div>
</div>

* **Harvest-Now-Decrypt-Later Protection:** ป้องกันสตรีมข้อมูลจากการดักจับเพื่อรอถอดรหัสในอนาคต
* **NIST FIPS 204 Compliant:** สอดคล้องกับมาตรฐานการเข้ารหัสยุคหลังควอนตัมระดับสากลสูงสุด

> **Speaker Notes:** เราไม่ได้คุ้มครองข้อมูลด้วยมาตรฐานเดิม แต่ใช้อัลกอริทึม PQC ที่ได้รับการรับรองจาก NIST การันตีความปลอดภัยของโครงสร้างพื้นฐานยาวนานข้ามทศวรรษ

---

# 03. 10/10 REAL_HSM Quorum Consensus
## ฉันทามติสภาฮาร์ดแวร์และการทำลายคีย์ฉุกเฉิน (Active Zeroization)

<div class="grid-3">
  <div class="card-gold">
    <p style="margin:0; font-size:0.8em;">Hardware Consensus</p>
    <div class="metric gold">10 / 10</div>
    <p style="margin:0; font-size:0.75em;">Unanimous Ratified</p>
  </div>
  <div class="card">
    <p style="margin:0; font-size:0.8em;">Active Zeroization</p>
    <div class="metric green">0.48 ms</div>
    <p style="margin:0; font-size:0.75em;">SLA Limit < 1.20 ms</p>
  </div>
  <div class="card-cyan">
    <p style="margin:0; font-size:0.8em;">Hardware Enclave</p>
    <div class="metric cyan" style="font-size: 1.1em; margin: 12px 0;">FIPS 140-3 L4</div>
    <p style="margin:0; font-size:0.75em;">CC EAL6+ Certified</p>
  </div>
</div>

* **Hardware Module Standard:** Utimaco u.trust GP CSe-Series ตู้เซฟฮาร์ดแวร์ระดับทหาร
* **Anti-Tamper Circuit:** ระบบตรวจจับการโจมตีทางกายภาพพร้อมล้างความจำ (RAM Clearing) ทันทีในระดับไมโครวินาที

> **Speaker Notes:** คีย์ลับปฏิบัติตามฉันทามติ 10/10 โหนดบนฮาร์ดแวร์ระดับทหาร หากเกิดภัยคุกคามทางกายภาพ กลไก Active Zeroization จะล้างคีย์ใน RAM ทิ้งทันทีในไม่กี่มิลลิวินาที

---

# 04. Statutory Legal Admissibility Framework
## การรับรองพยานหลักฐานดิจิทัลตามกฎหมายไทยและสากล

<div class="grid-3">
  <div class="card">
    <h3 style="margin-top:0;">พ.ร.บ. ธุรกรรมฯ</h3>
    <p style="font-size:0.8em;" class="gold">มาตรา ๙, ๒๖, ๒๘</p>
    <p style="font-size:0.75em; color:#9ca3af;">ลายมือชื่อดิจิทัลและความสมบูรณ์ของพยานเอกสาร</p>
  </div>
  <div class="card">
    <h3 style="margin-top:0;">พ.ร.บ. คุ้มครองข้อมูล</h3>
    <p style="font-size:0.8em;" class="cyan">PDPA มาตรา ๓๗</p>
    <p style="font-size:0.75em; color:#9ca3af;">Zero-Knowledge Vault คุ้มครอง PII 100%</p>
  </div>
  <div class="card">
    <h3 style="margin-top:0;">Chain of Custody</h3>
    <p style="font-size:0.8em;" class="green">ISO/IEC 27037</p>
    <p style="font-size:0.75em; color:#9ca3af;">การจัดเก็บและรักษาห่วงโซ่พยานหลักฐาน</p>
  </div>
</div>

* **Court-Admissible Readiness:** พยานหลักฐานพร้อมใช้ยื่นต่อชั้นศาลไทยและพนักงานสอบสวนทันที
* **Delete-Nothing Guarantee:** บันทึกข้อมูลแบบเขียนครั้งเดียว (WORM) ปราศจากปุ่มลบหรือแก้ไขข้อมูล

> **Speaker Notes:** พยานหลักฐานดิจิทัลทั้งหมดได้รับการคุ้มครองตาม พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ฯ และมาตรฐาน ISO/IEC 27037 พร้อมใช้ยื่นต่อพนักงานสอบสวนและชั้นศาลได้ทันที

---

# 05. Cryogenic Telemetry & Trace Replay SLA
## โทรมาตรสภาวะอุณหภูมิต่ำพิเศษและการตรวจสอบย้อนกลับ 12 ขั้นตอน

<div class="grid-4">
  <div class="card">
    <span class="gold">Cryo Temp</span>
    <div class="metric gold" style="font-size:1.4em;">14.98 mK</div>
    <span style="font-size:0.7em;">Target: 15.00 mK</span>
  </div>
  <div class="card">
    <span class="cyan">Coherence</span>
    <div class="metric cyan" style="font-size:1.4em;">99.992%</div>
    <span style="font-size:0.7em;">QOps: 851.9</span>
  </div>
  <div class="card">
    <span class="green">Replay Latency</span>
    <div class="metric green" style="font-size:1.4em;">35.80 ms</div>
    <span style="font-size:0.7em;">SLA < 142.0 ms</span>
  </div>
  <div class="card">
    <span class="gold">Entropy State</span>
    <div class="metric gold" style="font-size:1.4em;">0.0142 dS</div>
    <span style="font-size:0.7em;">Equilibrium OK</span>
  </div>
</div>

<div style="margin-top:15px; font-size:0.75em;" class="code-block">
12-Stage Pipeline: STG-01 Ingest (4.2ms) -> STG-02 PQC (12.4ms) -> STG-06 Merkle (15.3ms) -> STG-07 Quorum (16.2ms) -> STG-12 Cert (9.5ms)
</div>

* **Performance Margin:** ประมวลผลเร็วกว่าข้อกำหนด SLA ถึง 4 เท่าตัว
* **Sub-Kelvin Stability:** ทำงานบนระนาบฮาร์ดแวร์ประมวลผลที่มีความเสถียรระดับควอนตัม

> **Speaker Notes:** pipeline การตรวจสอบ 12 ขั้นตอนใช้เวลาเพียง 35.80 ms ซึ่งเร็วกว่ากรอบ SLA ถึง 4 เท่า ทำงานบน Cryo Bus ที่มีความเสถียรระดับ 99.992%

---

# 06. FIOS Sovereign Treasury Distribution
## โครงสร้างคลังสินทรัพย์อธิปไตยดิจิทัลและการปันส่วนงบแก๊ส

<div class="grid-2">
  <div class="card-gold">
    <h3 style="margin:0; color:#D4AF37;">Sovereign Reserve Valuation</h3>
    <div class="metric gold" style="font-size:2em;">฿4,230,000,000.00 THB</div>
    <ul style="font-size:0.8em; margin-bottom:0; padding-left:20px;">
      <li>THB-SOV Reserve: ฿1.49B THB</li>
      <li>Gold Collateral: 14,902 oz (LBMA Standard)</li>
      <li>RWA Tenants: 400 Institutional Units</li>
    </ul>
  </div>
  <div class="card-cyan">
    <h3 style="margin:0; color:#06B6D4;">Nc × Vc Gas Penalty Allocation</h3>
    <div class="metric cyan" style="font-size:2em;">฿12,500,000.00 THB</div>
    <ul style="font-size:0.8em; margin-bottom:0; padding-left:20px;">
      <li>Target Population: 36,225,000 Users</li>
      <li>Nc × Vc Query Latency: 0.4 ms</li>
      <li>Zero Drift Allocation Balance: Verified</li>
    </ul>
  </div>
</div>

> **Speaker Notes:** คลังสินทรัพย์มีมูลค่ารวม 4,230 ล้านบาท หนุนหลังด้วยทองคำมาตรฐาน LBMA และเงินสำรองอธิปไตย ป้องกันความผันผวนด้วยแบบจำลอง Nc × Vc

---

# 07. Global Satellite Mesh Infrastructure
## ขอบเขตการกระจายศูนย์ข้ามเขตแดน (Zone Boundaries Ω601–Ω1000)

<div class="grid-3">
  <div class="card-gold">
    <span class="gold">PRIMARY ROOT</span>
    <h4>Bangkok Vault (BK01)</h4>
    <div class="metric gold" style="font-size:1.3em;">0.8 ms</div>
    <p style="font-size:0.7em;">Sovereign Root Core</p>
  </div>
  <div class="card">
    <span class="cyan">RELAY NEXUS</span>
    <h4>Singapore (SG02)</h4>
    <div class="metric cyan" style="font-size:1.3em;">8.2 ms</div>
    <p style="font-size:0.7em;">Regional Routing</p>
  </div>
  <div class="card">
    <span class="cyan">QUANTUM VAULT</span>
    <h4>Tokyo (TY03)</h4>
    <div class="metric cyan" style="font-size:1.3em;">24.1 ms</div>
    <p style="font-size:0.7em;">Post-Quantum Backup</p>
  </div>
</div>

<div class="grid-3">
  <div class="card">
    <span class="green">SECRET BOUNDARY</span>
    <h4>Zurich (ZH04)</h4>
    <div class="metric green" style="font-size:1.3em;">112.5 ms</div>
    <p style="font-size:0.7em;">Legal Boundary Node</p>
  </div>
  <div class="card">
    <span class="green">GATEWAY NODE</span>
    <h4>Silicon Valley (SV05)</h4>
    <div class="metric green" style="font-size:1.3em;">142.0 ms</div>
    <p style="font-size:0.7em;">API Bridge Gateway</p>
  </div>
  <div class="card">
    <span class="green">CUSTODIAN NODE</span>
    <h4>London (LD06)</h4>
    <div class="metric green" style="font-size:1.3em;">128.4 ms</div>
    <p style="font-size:0.7em;">Global Custody Sync</p>
  </div>
</div>

> **Speaker Notes:** เครือข่ายถูกวางรากฐานข้ามภูมิภาค โดยมีศูนย์กลางอยู่ที่ Bangkok Primary Vault เชื่อมต่อโหนดต่างประเทศผ่าน Warp Relay Latency ต่ำ

---

# 08. Mainnet Ratification & Sovereign Seal
## การอนุมัติขึ้นระบบเมนเน็ตอย่างเป็นทางการ (Final Mainnet Deployment)

<div class="card-gold" style="text-align:center; padding: 25px;">
  <p style="margin:0; font-size:0.9em;" class="gold">DEPLOYMENT CERTIFICATE IDENTIFIER</p>
  <div class="metric gold" style="font-size:2.2em; margin: 10px 0;">ZQ-GREEN-DEP-849202-3908</div>
  <p style="margin:0; font-size:0.85em; color:#9ca3af;">Zone Boundaries Ω601–Ω1000 Authorization Complete</p>
</div>

<div class="grid-2" style="margin-top: 20px;">
  <div class="card">
    <p style="margin:0; font-size:0.8em;" class="cyan">Audit Verdict</p>
    <p style="font-size:0.9em; margin:5px 0;"><strong>22/22 Master Gates Passed (100% Green)</strong></p>
    <p style="font-size:0.75em; color:#9ca3af; margin:0;">Zero Vulnerabilities Detected</p>
  </div>
  <div class="card">
    <p style="margin:0; font-size:0.8em;" class="green">Legal & Statutory Status</p>
    <p style="font-size:0.9em; margin:5px 0;"><strong>100% Court-Admissible Ready</strong></p>
    <p style="font-size:0.75em; color:#9ca3af; margin:0;">Thai ETA Sec 9/26/28 + PDPA Compliant</p>
  </div>
</div>

> **Speaker Notes:** ขอเสนอใบรับรอง ZQ-GREEN-DEP-849202-3908 เพื่ออนุมัติเปิดใช้งานระบบ Mainnet ภายใต้การกำกับดูแลของ Sovereign Principal ครับ`;

interface SlideData {
  index: number;
  title: string;
  subtitle: string;
  notes: string;
  renderContent: () => React.ReactNode;
}

export const ExecutiveSlideDeckView: React.FC = () => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'presenter' | 'grid' | 'raw' | 'guide'>('presenter');
  const [copied, setCopied] = useState<boolean>(false);
  const [showNotes, setShowNotes] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const slides: SlideData[] = [
    {
      index: 0,
      title: 'ZYRQUEN Ω∞ SOVEREIGN KERNEL',
      subtitle: 'Executive Presentation & Engineering Audit Deck (v4.16 LTS)',
      notes: 'เรียนคณะกรรมการและ Auditor ทุกท่าน ระบบถูกตรึงไว้ที่ LOCKED_FROZEN_v1.2_LTS บนบล็อก #849202 ข้อมูลทุกชุดยืนยันด้วย Merkle Tree ที่ปราศจาก System Drift โดยสิ้นเชิง',
      renderContent: () => (
        <div className="flex flex-col items-center justify-center text-center h-full py-8 sm:py-12 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-mono font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(212,175,55,0.2)]">
            <Crown className="w-4 h-4 text-[#D4AF37]" />
            SOVEREIGN AUDIT DECK v4.16 LTS
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-amber-200 to-cyan-400 tracking-tight">
            ZYRQUEN Ω∞ SOVEREIGN KERNEL
          </h1>
          
          <h2 className="text-lg sm:text-2xl font-bold text-cyan-400 font-mono tracking-wide">
            Executive Presentation & Engineering Audit Deck
          </h2>

          <div className="p-4 rounded-xl bg-[#030509] border border-cyan-500/30 max-w-xl w-full shadow-inner">
            <span className="font-mono text-xs sm:text-sm text-emerald-400 font-bold block">
              STATUS: LOCKED_FROZEN_v1.2_LTS | SSoT Δ0 Baseline Drift 0.00%
            </span>
          </div>

          <div className="text-xs sm:text-sm text-zinc-400 font-sans space-y-1">
            <p>
              Sovereign Principal: <strong className="text-white">นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)</strong>
            </p>
            <p className="font-mono text-zinc-500">
              Anchor Block Height: <span className="text-[#D4AF37]">#849202</span> | Security Level: <span className="text-cyan-400">APEX ULTIMATE v4.16</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      index: 1,
      title: '01. Genesis Anchor & Immutable Baseline',
      subtitle: 'การเปลี่ยนผ่านสู่สัจจะทางคณิตศาสตร์สัมบูรณ์ (Mathematical Proof)',
      notes: 'เรียนคณะกรรมการและ Auditor ทุกท่าน ระบบถูกตรึงไว้ที่ LOCKED_FROZEN_v1.2_LTS บนบล็อก #849202 ข้อมูลทุกชุดยืนยันด้วย Merkle Tree ที่ปราศจาก System Drift โดยสิ้นเชิง',
      renderContent: () => (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 sm:p-5 rounded-xl bg-[#0a0f1e] border border-[#D4AF37]/50 shadow-[0_0_20px_rgba(212,175,55,0.1)]">
              <p className="text-xs text-zinc-400 font-mono uppercase">Anchor Block Height</p>
              <div className="text-2xl sm:text-4xl font-bold text-[#D4AF37] font-mono my-2">#849202</div>
              <p className="text-xs text-zinc-400">Genesis Seal Rate: 100% Immutable</p>
            </div>
            <div className="p-4 sm:p-5 rounded-xl bg-[#0a0f1e] border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
              <p className="text-xs text-zinc-400 font-mono uppercase">Baseline System Drift</p>
              <div className="text-2xl sm:text-4xl font-bold text-cyan-400 font-mono my-2">0.00% (SSoT Δ0)</div>
              <p className="text-xs text-zinc-400">Inviolable Single Source of Truth</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#030509] border border-zinc-800 font-mono text-xs text-emerald-400 space-y-1 shadow-inner break-all">
            <div>Genesis Merkle Root: 909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68</div>
            <div className="text-cyan-300">Canonical Seals: 14,902 Verified (+80 Quarantined)</div>
          </div>

          <ul className="space-y-2 text-xs sm:text-sm text-zinc-300 font-sans">
            <li className="flex items-start gap-2">
              <span className="text-[#D4AF37] font-bold">▪</span>
              <span><strong>Mathematical vs. Marketing Seal:</strong> ขจัดคำกล่าวอ้างแบบผิวเผินด้วยโครงสร้างพยานคณิตศาสตร์สัมบูรณ์</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">▪</span>
              <span><strong>Zero Drift Verification:</strong> รับประกันความสอดคล้องของสถานะระบบข้ามสภาพแวดล้อม ไร้การเบี่ยงเบน</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      index: 2,
      title: '02. Post-Quantum Cryptographic Shield',
      subtitle: 'เกราะรหัสลับยุคหลังควอนตัม (NIST PQC Standards)',
      notes: 'เราไม่ได้คุ้มครองข้อมูลด้วยมาตรฐานเดิม แต่ใช้อัลกอริทึม PQC ที่ได้รับการรับรองจาก NIST การันตีความปลอดภัยของโครงสร้างพื้นฐานยาวนานข้ามทศวรรษ',
      renderContent: () => (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[#0a0f1e] border border-zinc-800">
              <span className="text-[#D4AF37] font-bold font-mono text-sm sm:text-base">ML-DSA-87</span>
              <p className="text-xs text-zinc-400 mt-1">Dilithium-5</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Primary Digital Signature</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0a0f1e] border border-zinc-800">
              <span className="text-cyan-400 font-bold font-mono text-sm sm:text-base">ML-KEM-1024</span>
              <p className="text-xs text-zinc-400 mt-1">Kyber-1024</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Post-Quantum Key Exchange</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0a0f1e] border border-zinc-800">
              <span className="text-[#D4AF37] font-bold font-mono text-sm sm:text-base">SLH-DSA-192</span>
              <p className="text-xs text-zinc-400 mt-1">SPHINCS+</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Stateless Hash Redundancy</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0a0f1e] border border-zinc-800">
              <span className="text-cyan-400 font-bold font-mono text-sm sm:text-base">FALCON-1024</span>
              <p className="text-xs text-zinc-400 mt-1">Falcon Crypt</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Compact Fast Verification</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs sm:text-sm space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              NIST FIPS 204 Compliant Architectural Enforcement
            </div>
            <p className="text-zinc-300">
              <strong>Harvest-Now-Decrypt-Later Protection:</strong> ป้องกันสตรีมข้อมูลจากการดักจับเพื่อรอถอดรหัสในอนาคตด้วยคอมพิวเตอร์ควอนตัมขนาดใหญ่
            </p>
          </div>
        </div>
      ),
    },
    {
      index: 3,
      title: '03. 10/10 REAL_HSM Quorum Consensus',
      subtitle: 'ฉันทามติสภาฮาร์ดแวร์และการทำลายคีย์ฉุกเฉิน (Active Zeroization)',
      notes: 'คีย์ลับปฏิบัติตามฉันทามติ 10/10 โหนดบนฮาร์ดแวร์ระดับทหาร หากเกิดภัยคุกคามทางกายภาพ กลไก Active Zeroization จะล้างคีย์ใน RAM ทิ้งทันทีในไม่กี่มิลลิวินาที',
      renderContent: () => (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#0a0f1e] border border-[#D4AF37]/50">
              <p className="text-xs text-zinc-400 font-mono uppercase">Hardware Consensus</p>
              <div className="text-3xl font-bold text-[#D4AF37] font-mono my-2">10 / 10</div>
              <p className="text-xs text-zinc-400">Unanimous Ratified</p>
            </div>
            <div className="p-4 rounded-xl bg-[#0a0f1e] border border-emerald-500/40">
              <p className="text-xs text-zinc-400 font-mono uppercase">Active Zeroization</p>
              <div className="text-3xl font-bold text-emerald-400 font-mono my-2">0.48 ms</div>
              <p className="text-xs text-zinc-400">SLA Limit &lt; 1.20 ms</p>
            </div>
            <div className="p-4 rounded-xl bg-[#0a0f1e] border border-cyan-500/50">
              <p className="text-xs text-zinc-400 font-mono uppercase">Hardware Enclave</p>
              <div className="text-2xl font-bold text-cyan-400 font-mono my-2.5">FIPS 140-3 L4</div>
              <p className="text-xs text-zinc-400">CC EAL6+ Certified</p>
            </div>
          </div>

          <ul className="space-y-2 text-xs sm:text-sm text-zinc-300">
            <li className="flex items-start gap-2">
              <span className="text-[#D4AF37] font-bold">▪</span>
              <span><strong>Hardware Module Standard:</strong> Utimaco u.trust GP CSe-Series ตู้เซฟฮาร์ดแวร์ระดับทหาร</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">▪</span>
              <span><strong>Anti-Tamper Circuit:</strong> ระบบตรวจจับการโจมตีทางกายภาพพร้อมล้างความจำ (RAM Clearing) ทันทีในระดับไมโครวินาที</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      index: 4,
      title: '04. Statutory Legal Admissibility Framework',
      subtitle: 'การรับรองพยานหลักฐานดิจิทัลตามกฎหมายไทยและสากล',
      notes: 'พยานหลักฐานดิจิทัลทั้งหมดได้รับการคุ้มครองตาม พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ฯ และมาตรฐาน ISO/IEC 27037 พร้อมใช้ยื่นต่อพนักงานสอบสวนและชั้นศาลได้ทันที',
      renderContent: () => (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#0a0f1e] border border-zinc-800">
              <h4 className="text-sm font-bold text-white">พ.ร.บ. ธุรกรรมฯ</h4>
              <p className="text-sm font-bold text-[#D4AF37] font-mono my-1.5">มาตรา ๙, ๒๖, ๒๘</p>
              <p className="text-xs text-zinc-400">ลายมือชื่อดิจิทัลและความสมบูรณ์ของพยานเอกสาร</p>
            </div>
            <div className="p-4 rounded-xl bg-[#0a0f1e] border border-zinc-800">
              <h4 className="text-sm font-bold text-white">พ.ร.บ. คุ้มครองข้อมูล</h4>
              <p className="text-sm font-bold text-cyan-400 font-mono my-1.5">PDPA มาตรา ๓๗</p>
              <p className="text-xs text-zinc-400">Zero-Knowledge Vault คุ้มครอง PII 100%</p>
            </div>
            <div className="p-4 rounded-xl bg-[#0a0f1e] border border-zinc-800">
              <h4 className="text-sm font-bold text-white">Chain of Custody</h4>
              <p className="text-sm font-bold text-emerald-400 font-mono my-1.5">ISO/IEC 27037</p>
              <p className="text-xs text-zinc-400">การจัดเก็บและรักษาห่วงโซ่พยานหลักฐาน</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-black/60 border border-zinc-800 text-xs sm:text-sm space-y-2">
            <div className="text-zinc-300">
              ▪ <strong>Court-Admissible Readiness:</strong> พยานหลักฐานพร้อมใช้ยื่นต่อชั้นศาลไทยและพนักงานสอบสวนทันที
            </div>
            <div className="text-zinc-300">
              ▪ <strong>Delete-Nothing Guarantee:</strong> บันทึกข้อมูลแบบเขียนครั้งเดียว (WORM) ปราศจากปุ่มลบหรือแก้ไขข้อมูล
            </div>
          </div>
        </div>
      ),
    },
    {
      index: 5,
      title: '05. Cryogenic Telemetry & Trace Replay SLA',
      subtitle: 'โทรมาตรสภาวะอุณหภูมิต่ำพิเศษและการตรวจสอบย้อนกลับ 12 ขั้นตอน',
      notes: 'pipeline การตรวจสอบ 12 ขั้นตอนใช้เวลาเพียง 35.80 ms ซึ่งเร็วกว่ากรอบ SLA ถึง 4 เท่า ทำงานบน Cryo Bus ที่มีความเสถียรระดับ 99.992%',
      renderContent: () => (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[#0a0f1e] border border-zinc-800">
              <span className="text-xs text-zinc-400 font-mono">Cryo Temp</span>
              <div className="text-xl sm:text-2xl font-bold text-[#D4AF37] font-mono my-1">14.98 mK</div>
              <span className="text-[10px] text-zinc-500">Target: 15.00 mK</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0a0f1e] border border-zinc-800">
              <span className="text-xs text-zinc-400 font-mono">Coherence</span>
              <div className="text-xl sm:text-2xl font-bold text-cyan-400 font-mono my-1">99.992%</div>
              <span className="text-[10px] text-zinc-500">QOps: 851.9</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0a0f1e] border border-zinc-800">
              <span className="text-xs text-zinc-400 font-mono">Replay Latency</span>
              <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono my-1">35.80 ms</div>
              <span className="text-[10px] text-zinc-500">SLA &lt; 142.0 ms</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0a0f1e] border border-zinc-800">
              <span className="text-xs text-zinc-400 font-mono">Entropy State</span>
              <div className="text-xl sm:text-2xl font-bold text-[#D4AF37] font-mono my-1">0.0142 dS</div>
              <span className="text-[10px] text-zinc-500">Equilibrium OK</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#030509] border border-zinc-800 font-mono text-xs text-emerald-400 shadow-inner">
            12-Stage Pipeline: STG-01 Ingest (4.2ms) → STG-02 PQC (12.4ms) → STG-06 Merkle (15.3ms) → STG-07 Quorum (16.2ms) → STG-12 Cert (9.5ms)
          </div>

          <div className="text-xs sm:text-sm text-zinc-300 space-y-1">
            <p>▪ <strong>Performance Margin:</strong> ประมวลผลเร็วกว่าข้อกำหนด SLA ถึง 4 เท่าตัว</p>
            <p>▪ <strong>Sub-Kelvin Stability:</strong> ทำงานบนระนาบฮาร์ดแวร์ประมวลผลที่มีความเสถียรระดับควอนตัม</p>
          </div>
        </div>
      ),
    },
    {
      index: 6,
      title: '06. FIOS Sovereign Treasury Distribution',
      subtitle: 'โครงสร้างคลังสินทรัพย์อธิปไตยดิจิทัลและการปันส่วนงบแก๊ส',
      notes: 'คลังสินทรัพย์มีมูลค่ารวม 4,230 ล้านบาท หนุนหลังด้วยทองคำมาตรฐาน LBMA และเงินสำรองอธิปไตย ป้องกันความผันผวนด้วยแบบจำลอง Nc × Vc',
      renderContent: () => (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-[#0a0f1e] border border-[#D4AF37]/50">
              <h4 className="text-xs font-mono text-zinc-400 uppercase">Sovereign Reserve Valuation</h4>
              <div className="text-2xl sm:text-3xl font-bold text-[#D4AF37] font-mono my-2">฿4,230,000,000.00 THB</div>
              <ul className="text-xs text-zinc-300 space-y-1 font-sans">
                <li>• THB-SOV Reserve: ฿1.49B THB</li>
                <li>• Gold Collateral: 14,902 oz (LBMA Standard)</li>
                <li>• RWA Tenants: 400 Institutional Units</li>
              </ul>
            </div>
            <div className="p-5 rounded-xl bg-[#0a0f1e] border border-cyan-500/50">
              <h4 className="text-xs font-mono text-zinc-400 uppercase">Nc × Vc Gas Penalty Allocation</h4>
              <div className="text-2xl sm:text-3xl font-bold text-cyan-400 font-mono my-2">฿12,500,000.00 THB</div>
              <ul className="text-xs text-zinc-300 space-y-1 font-sans">
                <li>• Target Population: 36,225,000 Users</li>
                <li>• Nc × Vc Query Latency: 0.4 ms</li>
                <li>• Zero Drift Allocation Balance: Verified</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      index: 7,
      title: '07. Global Satellite Mesh Infrastructure',
      subtitle: 'ขอบเขตการกระจายศูนย์ข้ามเขตแดน (Zone Boundaries Ω601–Ω1000)',
      notes: 'เครือข่ายถูกวางรากฐานข้ามภูมิภาค โดยมีศูนย์กลางอยู่ที่ Bangkok Primary Vault เชื่อมต่อโหนดต่างประเทศผ่าน Warp Relay Latency ต่ำ',
      renderContent: () => (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#0a0f1e] border border-[#D4AF37]/60">
              <span className="text-[10px] text-[#D4AF37] font-bold font-mono">PRIMARY ROOT</span>
              <h4 className="text-xs font-bold text-white mt-0.5">Bangkok Vault (BK01)</h4>
              <div className="text-lg font-bold text-[#D4AF37] font-mono my-0.5">0.8 ms</div>
              <p className="text-[10px] text-zinc-400">Sovereign Root Core</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0a0f1e] border border-zinc-800">
              <span className="text-[10px] text-cyan-400 font-bold font-mono">RELAY NEXUS</span>
              <h4 className="text-xs font-bold text-white mt-0.5">Singapore (SG02)</h4>
              <div className="text-lg font-bold text-cyan-400 font-mono my-0.5">8.2 ms</div>
              <p className="text-[10px] text-zinc-400">Regional Routing</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0a0f1e] border border-zinc-800">
              <span className="text-[10px] text-cyan-400 font-bold font-mono">QUANTUM VAULT</span>
              <h4 className="text-xs font-bold text-white mt-0.5">Tokyo (TY03)</h4>
              <div className="text-lg font-bold text-cyan-400 font-mono my-0.5">24.1 ms</div>
              <p className="text-[10px] text-zinc-400">Post-Quantum Backup</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#0a0f1e] border border-zinc-800">
              <span className="text-[10px] text-emerald-400 font-bold font-mono">SECRET BOUNDARY</span>
              <h4 className="text-xs font-bold text-white mt-0.5">Zurich (ZH04)</h4>
              <div className="text-lg font-bold text-emerald-400 font-mono my-0.5">112.5 ms</div>
              <p className="text-[10px] text-zinc-400">Legal Boundary Node</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0a0f1e] border border-zinc-800">
              <span className="text-[10px] text-emerald-400 font-bold font-mono">GATEWAY NODE</span>
              <h4 className="text-xs font-bold text-white mt-0.5">Silicon Valley (SV05)</h4>
              <div className="text-lg font-bold text-emerald-400 font-mono my-0.5">142.0 ms</div>
              <p className="text-[10px] text-zinc-400">API Bridge Gateway</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0a0f1e] border border-zinc-800">
              <span className="text-[10px] text-emerald-400 font-bold font-mono">CUSTODIAN NODE</span>
              <h4 className="text-xs font-bold text-white mt-0.5">London (LD06)</h4>
              <div className="text-lg font-bold text-emerald-400 font-mono my-0.5">128.4 ms</div>
              <p className="text-[10px] text-zinc-400">Global Custody Sync</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      index: 8,
      title: '08. Mainnet Ratification & Sovereign Seal',
      subtitle: 'การอนุมัติขึ้นระบบเมนเน็ตอย่างเป็นทางการ (Final Mainnet Deployment)',
      notes: 'ขอเสนอใบรับรอง ZQ-GREEN-DEP-849202-3908 เพื่ออนุมัติเปิดใช้งานระบบ Mainnet ภายใต้การกำกับดูแลของ Sovereign Principal ครับ',
      renderContent: () => (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#0a0f1e] border-2 border-[#D4AF37] text-center shadow-[0_0_30px_rgba(212,175,55,0.2)]">
            <p className="text-xs font-mono font-bold text-[#D4AF37] tracking-widest uppercase">
              DEPLOYMENT CERTIFICATE IDENTIFIER
            </p>
            <div className="text-2xl sm:text-4xl font-black text-[#D4AF37] font-mono my-2.5">
              ZQ-GREEN-DEP-849202-3908
            </div>
            <p className="text-xs text-zinc-400">Zone Boundaries Ω601–Ω1000 Authorization Complete</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#0a0f1e] border border-cyan-500/40">
              <p className="text-xs font-mono text-cyan-400 font-bold uppercase">Audit Verdict</p>
              <p className="text-sm font-bold text-white my-1">22/22 Master Gates Passed (100% Green)</p>
              <p className="text-xs text-zinc-400">Zero Vulnerabilities Detected</p>
            </div>
            <div className="p-4 rounded-xl bg-[#0a0f1e] border border-emerald-500/40">
              <p className="text-xs font-mono text-emerald-400 font-bold uppercase">Legal & Statutory Status</p>
              <p className="text-sm font-bold text-white my-1">100% Court-Admissible Ready</p>
              <p className="text-xs text-zinc-400">Thai ETA Sec 9/26/28 + PDPA Compliant</p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const currentSlide = slides[currentSlideIndex];

  const handlePrev = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : slides.length - 1));
    playTone(520, 0.05, 'sine');
  }, [slides.length]);

  const handleNext = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev < slides.length - 1 ? prev + 1 : 0));
    playTone(650, 0.05, 'sine');
  }, [slides.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab === 'presenter') {
        if (e.key === 'ArrowRight' || e.key === ' ') {
          handleNext();
        } else if (e.key === 'ArrowLeft') {
          handlePrev();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, handleNext, handlePrev]);

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(MARP_MARKDOWN_RAW);
    setCopied(true);
    playTone(880, 0.1, 'sine');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([MARP_MARKDOWN_RAW], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'executive-deck.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    playTone(960, 0.1, 'sine');
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* ── TOP HEADER & CONTROLS ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0f1e] border border-cyan-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 border border-[#D4AF37]/40 text-[#D4AF37]">
              <Presentation className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Executive Slide Deck
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 border border-[#D4AF37]/40 text-[#D4AF37] font-mono font-bold">
                  MARP v4.16 LTS
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                ZYRQUEN Ω∞ Sovereign Kernel | Locked Frozen v1.2 LTS (Zero Drift 0.00%)
              </p>
            </div>
          </div>
        </div>

        {/* View mode switcher */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center p-1 rounded-xl bg-black/50 border border-white/10">
            <button
              onClick={() => setActiveTab('presenter')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'presenter'
                  ? 'bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Presentation className="w-3.5 h-3.5" />
              <span>Presenter</span>
            </button>
            <button
              onClick={() => setActiveTab('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'grid'
                  ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>All Slides</span>
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'raw'
                  ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Marp Code</span>
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'guide'
                  ? 'bg-purple-500/20 border border-purple-500/50 text-purple-300'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>VS Code Guide</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-xs font-bold flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{copied ? 'Copied' : 'Copy Marp'}</span>
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-cyan-500/20 hover:from-amber-500/30 hover:to-cyan-500/30 border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .md</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── TAB 1: PRESENTER VIEW ── */}
      {activeTab === 'presenter' && (
        <div className="space-y-4">
          {/* Slide Frame Canvas */}
          <div className="relative rounded-2xl bg-[#070a12] border-2 border-[#17233f] shadow-[0_0_50px_rgba(7,10,18,0.8)] overflow-hidden min-h-[480px] p-6 sm:p-10 flex flex-col justify-between">
            {/* Slide Header */}
            <div className="flex items-center justify-between border-b border-[#17233f] pb-3 text-xs font-mono">
              <span className="text-zinc-400 flex items-center gap-2">
                <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />
                ZYRQUEN Ω∞ Sovereign Kernel — Executive Slide Deck (v4.16 LTS)
              </span>
              <span className="text-[#D4AF37] font-bold">
                Slide {currentSlideIndex + 1} of {slides.length}
              </span>
            </div>

            {/* Slide Content */}
            <div className="my-auto py-4">
              {currentSlide.index > 0 && (
                <div className="mb-4">
                  <h2 className="text-xl sm:text-2xl font-black text-[#D4AF37] border-b-2 border-[#17233f] pb-1">
                    {currentSlide.title}
                  </h2>
                  <h3 className="text-sm sm:text-base font-bold text-cyan-400 mt-1">
                    {currentSlide.subtitle}
                  </h3>
                </div>
              )}
              {currentSlide.renderContent()}
            </div>

            {/* Slide Footer */}
            <div className="flex items-center justify-between border-t border-[#17233f] pt-3 text-[11px] font-mono text-zinc-500">
              <span>LOCKED_FROZEN_v1.2_LTS | SSoT Δ0 Zero Drift (0.00%)</span>
              <span>Sovereign Principal: #EP-SOVEREIGN-01</span>
            </div>
          </div>

          {/* Slide Navigation Controls & Speaker Notes */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-[#0a0f1e] border border-white/10">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition flex items-center gap-1 text-xs font-bold"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>
              <span className="text-xs font-mono text-zinc-300 px-3">
                {currentSlideIndex + 1} / {slides.length}
              </span>
              <button
                onClick={handleNext}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition flex items-center gap-1 text-xs font-bold"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNotes(!showNotes)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  showNotes ? 'bg-amber-950/60 text-[#D4AF37] border border-[#D4AF37]/40' : 'bg-white/5 text-zinc-400'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{showNotes ? 'Hide Speaker Notes' : 'Show Speaker Notes'}</span>
              </button>
            </div>
          </div>

          {/* Presenter Speaker Notes Accordion */}
          {showNotes && (
            <div className="p-4 rounded-xl bg-[#0e172a] border-l-4 border-[#D4AF37] text-xs sm:text-sm text-zinc-300 space-y-1.5 shadow-md">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#D4AF37]">
                <Sparkles className="w-3.5 h-3.5" />
                SPEAKER NOTES (บทพูดบรรยายผู้บริหาร):
              </div>
              <p className="leading-relaxed font-sans text-zinc-200">
                {currentSlide.notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: ALL SLIDES GRID ── */}
      {activeTab === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {slides.map((s, idx) => (
            <div
              key={idx}
              onClick={() => {
                setCurrentSlideIndex(idx);
                setActiveTab('presenter');
                playTone(600, 0.05, 'sine');
              }}
              className={`p-4 rounded-xl bg-[#070a12] border cursor-pointer transition hover:border-[#D4AF37] ${
                currentSlideIndex === idx ? 'border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-2">
                <span className="text-[#D4AF37] font-bold">Slide {idx + 1}</span>
                <span>v4.16 LTS</span>
              </div>
              <h4 className="text-xs font-bold text-white line-clamp-1">{s.title}</h4>
              <p className="text-[11px] text-cyan-400 line-clamp-1">{s.subtitle}</p>
              <div className="mt-3 text-[10px] text-zinc-500 font-mono line-clamp-2">
                Notes: {s.notes}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 3: RAW MARP MARKDOWN ── */}
      {activeTab === 'raw' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#030509] border border-cyan-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-cyan-400 flex items-center gap-1.5 font-bold">
              <Terminal className="w-4 h-4" />
              executive-deck.md (Marp Format with Custom CSS & Speaker Notes)
            </span>
            <button
              onClick={handleCopyMarkdown}
              className="px-3 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy All Code'}</span>
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-[#070a12] border border-zinc-800 font-mono text-xs text-zinc-300 overflow-x-auto max-h-[500px] leading-relaxed select-all">
            {MARP_MARKDOWN_RAW}
          </pre>
        </div>
      )}

      {/* ── TAB 4: VS CODE MARP EXPORT GUIDE ── */}
      {activeTab === 'guide' && (
        <div className="p-5 rounded-2xl bg-[#0a0f1e] border border-purple-500/30 space-y-4">
          <div className="flex items-center gap-2 text-purple-300 font-bold text-base">
            <BookOpen className="w-5 h-5 text-purple-400" />
            คำแนะนำวิธีนำไป Render & Export ใน VS Code
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
              <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-mono font-bold">
                STEP 1
              </span>
              <h4 className="text-sm font-bold text-white">ติดตั้งส่วนขยาย Marp</h4>
              <p className="text-zinc-400">
                เปิดโปรแกรม VS Code แล้วค้นหา Extension ชื่อ <strong>Marp for VS Code</strong> จากปุ่ม Extensions (Ctrl+Shift+X หรือ Cmd+Shift+X) แล้วกด Install
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
              <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-mono font-bold">
                STEP 2
              </span>
              <h4 className="text-sm font-bold text-white">เปิดไฟล์ executive-deck.md</h4>
              <p className="text-zinc-400">
                ดาวน์โหลดไฟล์หรือคัดลอกโค้ดไปวางในไฟล์ <code>executive-deck.md</code> ที่ Root ของโปรเจกต์
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
              <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-mono font-bold">
                STEP 3
              </span>
              <h4 className="text-sm font-bold text-white">Preview & Export</h4>
              <p className="text-zinc-400">
                กดไอคอน Marp มุมขวาบนเพื่อเปิด Live Preview หรือกด F1 พิมพ์ <code>Marp: Export Slide Deck...</code> เพื่อเซฟเป็น PDF, PPTX หรือ HTML ได้ทันที
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
