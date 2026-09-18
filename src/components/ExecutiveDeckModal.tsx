import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Presentation,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Download,
  X,
  Maximize2,
  Minimize2,
  Volume2,
  ShieldCheck,
  Cpu,
  Lock,
  Scale,
  Sparkles,
  Layers,
  Globe,
  Award,
  Terminal,
  FileCode,
  Mic,
} from 'lucide-react';
import { playTone } from './AudioSynthesizer';

interface ExecutiveDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExecutiveDeckModal: React.FC<ExecutiveDeckModalProps> = ({ isOpen, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copiedMarp, setCopiedMarp] = useState<boolean>(false);

  const totalSlides = 9; // Slide 0 (Cover) + Slides 1-8

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
        playTone(540, 0.04);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
        playTone(480, 0.04);
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, totalSlides, isFullscreen, onClose]);

  const rawMarpMarkdown = `---
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
  .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 15px; }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 15px; }
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 15px; }
  .card { background: #0a0f1e; border: 1px solid #17233f; padding: 18px; border-radius: 8px; }
  .card-gold { background: #0a0f1e; border: 1px solid #D4AF37; padding: 18px; border-radius: 8px; }
  .card-cyan { background: #0a0f1e; border: 1px solid #06B6D4; padding: 18px; border-radius: 8px; }
  .gold { color: #D4AF37; font-weight: bold; }
  .cyan { color: #06B6D4; font-weight: bold; }
  .green { color: #10B981; font-weight: bold; }
  .metric { font-size: 1.8em; font-weight: bold; margin: 5px 0; }
  .code-block { background: #030509; border: 1px solid #17233f; padding: 12px; font-family: monospace; font-size: 0.75em; color: #10B981; border-radius: 6px; }
  blockquote { background: #0e172a; border-left: 4px solid #D4AF37; padding: 10px 15px; font-size: 0.8em; color: #9ca3af; margin-top: 15px; }
---

<!-- _class: lead -->
# ZYRQUEN Ω∞ SOVEREIGN KERNEL
## Executive Presentation & Engineering Audit Deck
STATUS: LOCKED_FROZEN_v1.2_LTS | SSoT Δ0 Baseline Drift 0.00%
Sovereign Principal: นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)
Anchor Block Height: #849202 | Security Level: APEX ULTIMATE v4.16
`;

  const handleCopyMarp = async () => {
    try {
      const response = await fetch('/executive-deck.md');
      const text = response.ok ? await response.text() : rawMarpMarkdown;
      await navigator.clipboard.writeText(text);
      setCopiedMarp(true);
      playTone(880, 0.08);
      setTimeout(() => setCopiedMarp(false), 2500);
    } catch {
      await navigator.clipboard.writeText(rawMarpMarkdown);
      setCopiedMarp(true);
      setTimeout(() => setCopiedMarp(false), 2500);
    }
  };

  const handleDownloadDeck = () => {
    const element = document.createElement('a');
    const file = new Blob([rawMarpMarkdown], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = 'executive-deck.md';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    playTone(720, 0.06);
  };

  const speakerNotes: Record<number, string> = {
    0: 'เรียนคณะกรรมการและ Auditor ทุกท่าน ยินดีต้อนรับสู่การนำเสนอ ZYRQUEN Ω∞ Sovereign Kernel ในสถานะ LOCKED_FROZEN_v1.2_LTS ซึ่งกำกับดูแลโดย Sovereign Principal คุณยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
    1: 'เรียนคณะกรรมการและ Auditor ทุกท่าน ระบบถูกตรึงไว้ที่ LOCKED_FROZEN_v1.2_LTS บนบล็อก #849202 ข้อมูลทุกชุดยืนยันด้วย Merkle Tree ที่ปราศจาก System Drift โดยสิ้นเชิง',
    2: 'เราไม่ได้คุ้มครองข้อมูลด้วยมาตรฐานเดิม แต่ใช้อัลกอริทึม PQC ที่ได้รับการรับรองจาก NIST การันตีความปลอดภัยของโครงสร้างพื้นฐานยาวนานข้ามทศวรรษ',
    3: 'คีย์ลับปฏิบัติตามฉันทามติ 10/10 โหนดบนฮาร์ดแวร์ระดับทหาร หากเกิดภัยคุกคามทางกายภาพ กลไก Active Zeroization จะล้างคีย์ใน RAM ทิ้งทันทีในไม่กี่มิลลิวินาที',
    4: 'พยานหลักฐานดิจิทัลทั้งหมดได้รับการคุ้มครองตาม พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ฯ และมาตรฐาน ISO/IEC 27037 พร้อมใช้ยื่นต่อพนักงานสอบสวนและชั้นศาลได้ทันที',
    5: 'pipeline การตรวจสอบ 12 ขั้นตอนใช้เวลาเพียง 35.80 ms ซึ่งเร็วกว่ากรอบ SLA ถึง 4 เท่า ทำงานบน Cryo Bus ที่มีความเสถียรระดับ 99.992%',
    6: 'คลังสินทรัพย์มีมูลค่ารวม 4,230 ล้านบาท หนุนหลังด้วยทองคำมาตรฐาน LBMA และเงินสำรองอธิปไตย ป้องกันความผันผวนด้วยแบบจำลอง Nc × Vc',
    7: 'เครือข่ายถูกวางรากฐานข้ามภูมิภาค โดยมีศูนย์กลางอยู่ที่ Bangkok Primary Vault เชื่อมต่อโหนดต่างประเทศผ่าน Warp Relay Latency ต่ำ',
    8: 'ขอเสนอใบรับรอง ZQ-GREEN-DEP-849202-3908 เพื่ออนุมัติเปิดใช้งานระบบ Mainnet ภายใต้การกำกับดูแลของ Sovereign Principal ครับ',
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className={`w-full bg-[#070a12] border-2 border-[#D4AF37]/50 rounded-2xl shadow-[0_0_60px_rgba(212,175,55,0.25)] flex flex-col overflow-hidden ${
          isFullscreen ? 'fixed inset-2 h-[calc(100vh-16px)]' : 'max-w-6xl max-h-[92vh] h-[850px]'
        }`}
      >
        {/* Top Header Bar */}
        <div className="px-4 py-3 bg-[#0a0f1e] border-b border-[#17233f] flex flex-wrap items-center justify-between gap-2.5 font-mono text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37]">
              <Presentation className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-[#D4AF37]">ZYRQUEN Ω∞</span> Executive Slide Deck
                <span className="px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[10px]">
                  v4.16 LTS
                </span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[10px]">
                  Marp Ready
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 font-sans">
                SSoT Δ0 Zero Drift (0.00%) | Sovereign Principal: #EP-SOVEREIGN-01
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarp}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-bold flex items-center gap-1.5 transition text-[11px] cursor-pointer"
              title="Copy Raw Marp Markdown for VS Code"
            >
              {copiedMarp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{copiedMarp ? 'Copied Marp!' : 'Copy Marp'}</span>
            </button>

            <button
              onClick={handleDownloadDeck}
              className="px-2.5 py-1.5 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 text-[#D4AF37] font-bold flex items-center gap-1.5 transition text-[11px] cursor-pointer"
              title="Download executive-deck.md file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download .md</span>
            </button>

            <button
              onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
                showSpeakerNotes
                  ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                  : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
              }`}
              title="Toggle Executive Speaker Notes"
            >
              <Mic className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Notes</span>
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 border border-white/10 text-zinc-400 transition"
              title="Close Deck"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slide Selection Strip */}
        <div className="px-4 py-2 bg-[#05070d] border-b border-[#17233f] flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono scrollbar-none">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentSlide(idx);
                playTone(500 + idx * 30, 0.03);
              }}
              className={`px-2.5 py-1 rounded-lg border shrink-0 transition-all font-bold cursor-pointer ${
                currentSlide === idx
                  ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.3)]'
                  : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {idx === 0 ? 'Cover' : `Slide 0${idx}`}
            </button>
          ))}
        </div>

        {/* Slide Viewport / Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col justify-center relative bg-[#070a12] text-[#e5e7eb]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="max-w-4xl mx-auto w-full space-y-6"
            >
              {/* SLIDE 0: LEAD / COVER */}
              {currentSlide === 0 && (
                <div className="text-center py-6 sm:py-12 space-y-6 font-sans">
                  <div className="inline-block px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-mono tracking-widest uppercase">
                    v4.16 LTS Executive Presentation
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-black text-[#D4AF37] tracking-tight border-b-0">
                    ZYRQUEN Ω∞ SOVEREIGN KERNEL
                  </h1>
                  <h2 className="text-xl sm:text-2xl text-[#06B6D4] font-light">
                    Executive Presentation & Engineering Audit Deck
                  </h2>

                  <div className="my-6">
                    <span className="inline-block px-5 py-2.5 rounded-lg bg-[#030509] border border-[#17233f] text-[#10B981] font-mono text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                      STATUS: LOCKED_FROZEN_v1.2_LTS | SSoT Δ0 Baseline Drift 0.00%
                    </span>
                  </div>

                  <div className="text-zinc-400 text-sm space-y-1">
                    <p>
                      Sovereign Principal: <strong className="text-zinc-200">นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)</strong>
                    </p>
                    <p className="font-mono text-xs text-zinc-500">
                      Anchor Block Height: #849202 | Security Level: APEX ULTIMATE v4.16
                    </p>
                  </div>
                </div>
              )}

              {/* SLIDE 1: Genesis Anchor & Immutable Baseline */}
              {currentSlide === 1 && (
                <div className="space-y-4">
                  <div className="border-b border-[#17233f] pb-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#D4AF37]">
                      01. Genesis Anchor & Immutable Baseline
                    </h1>
                    <h2 className="text-base sm:text-lg text-[#06B6D4]">
                      การเปลี่ยนผ่านสู่สัจจะทางคณิตศาสตร์สัมบูรณ์ (Mathematical Proof)
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[#0a0f1e] border border-[#D4AF37]">
                      <p className="text-xs text-zinc-400">Anchor Block Height</p>
                      <div className="text-3xl font-black text-[#D4AF37] my-1 font-mono">#849202</div>
                      <p className="text-xs text-zinc-400">Genesis Seal Rate: 100% Immutable</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#0a0f1e] border border-[#06B6D4]">
                      <p className="text-xs text-zinc-400">Baseline System Drift</p>
                      <div className="text-3xl font-black text-[#06B6D4] my-1 font-mono">0.00% (SSoT Δ0)</div>
                      <p className="text-xs text-zinc-400">Inviolable Single Source of Truth</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#030509] border border-[#17233f] font-mono text-xs text-[#10B981] space-y-1">
                    <div>Genesis Merkle Root: 909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68</div>
                    <div className="text-zinc-400">Canonical Seals: 14,902 Verified (+80 Quarantined)</div>
                  </div>

                  <ul className="list-disc list-inside text-sm text-zinc-300 space-y-1.5 pl-2 font-sans">
                    <li><strong className="text-white">Mathematical vs. Marketing Seal:</strong> ขจัดคำกล่าวอ้างแบบผิวเผินด้วยโครงสร้างพยานคณิตศาสตร์สัมบูรณ์</li>
                    <li><strong className="text-white">Zero Drift Verification:</strong> รับประกันความสอดคล้องของสถานะระบบข้ามสภาพแวดล้อม ไร้การเบี่ยงเบน</li>
                  </ul>
                </div>
              )}

              {/* SLIDE 2: Post-Quantum Cryptographic Shield */}
              {currentSlide === 2 && (
                <div className="space-y-4">
                  <div className="border-b border-[#17233f] pb-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#D4AF37]">
                      02. Post-Quantum Cryptographic Shield
                    </h1>
                    <h2 className="text-base sm:text-lg text-[#06B6D4]">
                      เกราะรหัสลับยุคหลังควอนตัม (NIST PQC Standards)
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-[#0a0f1e] border border-[#17233f] space-y-1">
                      <span className="text-[#D4AF37] font-bold font-mono text-sm">ML-DSA-87</span>
                      <p className="text-xs text-zinc-400 font-sans">Dilithium-5</p>
                      <p className="text-[11px] text-zinc-500 font-sans">Primary Digital Signature Scheme</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0a0f1e] border border-[#17233f] space-y-1">
                      <span className="text-[#06B6D4] font-bold font-mono text-sm">ML-KEM-1024</span>
                      <p className="text-xs text-zinc-400 font-sans">Kyber-1024</p>
                      <p className="text-[11px] text-zinc-500 font-sans">Post-Quantum Key Exchange</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0a0f1e] border border-[#17233f] space-y-1">
                      <span className="text-[#D4AF37] font-bold font-mono text-sm">SLH-DSA-192</span>
                      <p className="text-xs text-zinc-400 font-sans">SPHINCS+</p>
                      <p className="text-[11px] text-zinc-500 font-sans">Stateless Hash-Based Redundancy</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0a0f1e] border border-[#17233f] space-y-1">
                      <span className="text-[#06B6D4] font-bold font-mono text-sm">FALCON-1024</span>
                      <p className="text-xs text-zinc-400 font-sans">Falcon Crypt</p>
                      <p className="text-[11px] text-zinc-500 font-sans">Compact Fast Signature Verification</p>
                    </div>
                  </div>

                  <ul className="list-disc list-inside text-sm text-zinc-300 space-y-1.5 pl-2 font-sans pt-2">
                    <li><strong className="text-white">Harvest-Now-Decrypt-Later Protection:</strong> ป้องกันสตรีมข้อมูลจากการดักจับเพื่อรอถอดรหัสในอนาคต</li>
                    <li><strong className="text-white">NIST FIPS 204 Compliant:</strong> สอดคล้องกับมาตรฐานการเข้ารหัสยุคหลังควอนตัมระดับสากลสูงสุด</li>
                  </ul>
                </div>
              )}

              {/* SLIDE 3: 10/10 REAL_HSM Quorum Consensus */}
              {currentSlide === 3 && (
                <div className="space-y-4">
                  <div className="border-b border-[#17233f] pb-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#D4AF37]">
                      03. 10/10 REAL_HSM Quorum Consensus
                    </h1>
                    <h2 className="text-base sm:text-lg text-[#06B6D4]">
                      ฉันทามติสภาฮาร์ดแวร์และการทำลายคีย์ฉุกเฉิน (Active Zeroization)
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-[#0a0f1e] border border-[#D4AF37]">
                      <p className="text-xs text-zinc-400">Hardware Consensus</p>
                      <div className="text-3xl font-black text-[#D4AF37] my-1 font-mono">10 / 10</div>
                      <p className="text-xs text-zinc-400">Unanimous Ratified</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#0a0f1e] border border-[#17233f]">
                      <p className="text-xs text-zinc-400">Active Zeroization</p>
                      <div className="text-3xl font-black text-[#10B981] my-1 font-mono">0.48 ms</div>
                      <p className="text-xs text-zinc-400">SLA Limit &lt; 1.20 ms</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#0a0f1e] border border-[#06B6D4]">
                      <p className="text-xs text-zinc-400">Hardware Enclave</p>
                      <div className="text-2xl font-black text-[#06B6D4] my-1.5 font-mono">FIPS 140-3 L4</div>
                      <p className="text-xs text-zinc-400">CC EAL6+ Certified</p>
                    </div>
                  </div>

                  <ul className="list-disc list-inside text-sm text-zinc-300 space-y-1.5 pl-2 font-sans pt-2">
                    <li><strong className="text-white">Hardware Module Standard:</strong> Utimaco u.trust GP CSe-Series ตู้เซฟฮาร์ดแวร์ระดับทหาร</li>
                    <li><strong className="text-white">Anti-Tamper Circuit:</strong> ระบบตรวจจับการโจมตีทางกายภาพพร้อมล้างความจำ (RAM Clearing) ทันทีในระดับไมโครวินาที</li>
                  </ul>
                </div>
              )}

              {/* SLIDE 4: Statutory Legal Admissibility Framework */}
              {currentSlide === 4 && (
                <div className="space-y-4">
                  <div className="border-b border-[#17233f] pb-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#D4AF37]">
                      04. Statutory Legal Admissibility Framework
                    </h1>
                    <h2 className="text-base sm:text-lg text-[#06B6D4]">
                      การรับรองพยานหลักฐานดิจิทัลตามกฎหมายไทยและสากล
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-[#0a0f1e] border border-[#17233f] space-y-1">
                      <h3 className="text-sm font-bold text-white font-sans">พ.ร.บ. ธุรกรรมฯ</h3>
                      <p className="text-[#D4AF37] font-bold font-mono text-sm">มาตรา ๙, ๒๖, ๒๘</p>
                      <p className="text-xs text-zinc-400 font-sans">ลายมือชื่อดิจิทัลและความสมบูรณ์ของพยานเอกสาร</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#0a0f1e] border border-[#17233f] space-y-1">
                      <h3 className="text-sm font-bold text-white font-sans">พ.ร.บ. คุ้มครองข้อมูล</h3>
                      <p className="text-[#06B6D4] font-bold font-mono text-sm">PDPA มาตรา ๓๗</p>
                      <p className="text-xs text-zinc-400 font-sans">Zero-Knowledge Vault คุ้มครอง PII 100%</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#0a0f1e] border border-[#17233f] space-y-1">
                      <h3 className="text-sm font-bold text-white font-sans">Chain of Custody</h3>
                      <p className="text-[#10B981] font-bold font-mono text-sm">ISO/IEC 27037</p>
                      <p className="text-xs text-zinc-400 font-sans">การจัดเก็บและรักษาห่วงโซ่พยานหลักฐาน</p>
                    </div>
                  </div>

                  <ul className="list-disc list-inside text-sm text-zinc-300 space-y-1.5 pl-2 font-sans pt-2">
                    <li><strong className="text-white">Court-Admissible Readiness:</strong> พยานหลักฐานพร้อมใช้ยื่นต่อชั้นศาลไทยและพนักงานสอบสวนทันที</li>
                    <li><strong className="text-white">Delete-Nothing Guarantee:</strong> บันทึกข้อมูลแบบเขียนครั้งเดียว (WORM) ปราศจากปุ่มลบหรือแก้ไขข้อมูล</li>
                  </ul>
                </div>
              )}

              {/* SLIDE 5: Cryogenic Telemetry & Trace Replay SLA */}
              {currentSlide === 5 && (
                <div className="space-y-4">
                  <div className="border-b border-[#17233f] pb-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#D4AF37]">
                      05. Cryogenic Telemetry & Trace Replay SLA
                    </h1>
                    <h2 className="text-base sm:text-lg text-[#06B6D4]">
                      โทรมาตรสภาวะอุณหภูมิต่ำพิเศษและการตรวจสอบย้อนกลับ 12 ขั้นตอน
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-[#0a0f1e] border border-[#17233f]">
                      <span className="text-xs text-zinc-400">Cryo Temp</span>
                      <div className="text-2xl font-bold text-[#D4AF37] font-mono my-1">14.98 mK</div>
                      <span className="text-[11px] text-zinc-500">Target: 15.00 mK</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#0a0f1e] border border-[#17233f]">
                      <span className="text-xs text-zinc-400">Coherence</span>
                      <div className="text-2xl font-bold text-[#06B6D4] font-mono my-1">99.992%</div>
                      <span className="text-[11px] text-zinc-500">QOps: 851.9</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#0a0f1e] border border-[#17233f]">
                      <span className="text-xs text-zinc-400">Replay Latency</span>
                      <div className="text-2xl font-bold text-[#10B981] font-mono my-1">35.80 ms</div>
                      <span className="text-[11px] text-zinc-500">SLA &lt; 142.0 ms</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#0a0f1e] border border-[#17233f]">
                      <span className="text-xs text-zinc-400">Entropy State</span>
                      <div className="text-2xl font-bold text-[#D4AF37] font-mono my-1">0.0142 dS</div>
                      <span className="text-[11px] text-zinc-500">Equilibrium OK</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#030509] border border-[#17233f] font-mono text-xs text-[#10B981] overflow-x-auto">
                    12-Stage Pipeline: STG-01 Ingest (4.2ms) → STG-02 PQC (12.4ms) → STG-06 Merkle (15.3ms) → STG-07 Quorum (16.2ms) → STG-12 Cert (9.5ms)
                  </div>

                  <ul className="list-disc list-inside text-sm text-zinc-300 space-y-1 pl-2 font-sans">
                    <li><strong className="text-white">Performance Margin:</strong> ประมวลผลเร็วกว่าข้อกำหนด SLA ถึง 4 เท่าตัว</li>
                    <li><strong className="text-white">Sub-Kelvin Stability:</strong> ทำงานบนระนาบฮาร์ดแวร์ประมวลผลที่มีความเสถียรระดับควอนตัม</li>
                  </ul>
                </div>
              )}

              {/* SLIDE 6: FIOS Sovereign Treasury Distribution */}
              {currentSlide === 6 && (
                <div className="space-y-4">
                  <div className="border-b border-[#17233f] pb-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#D4AF37]">
                      06. FIOS Sovereign Treasury Distribution
                    </h1>
                    <h2 className="text-base sm:text-lg text-[#06B6D4]">
                      โครงสร้างคลังสินทรัพย์อธิปไตยดิจิทัลและการปันส่วนงบแก๊ส
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[#0a0f1e] border border-[#D4AF37] space-y-2">
                      <h3 className="text-sm font-bold text-[#D4AF37]">Sovereign Reserve Valuation</h3>
                      <div className="text-2xl sm:text-3xl font-black text-[#D4AF37] font-mono">
                        ฿4,230,000,000.00 THB
                      </div>
                      <ul className="text-xs text-zinc-300 space-y-1 list-disc list-inside pl-1 font-sans">
                        <li>THB-SOV Reserve: ฿1.49B THB</li>
                        <li>Gold Collateral: 14,902 oz (LBMA Standard)</li>
                        <li>RWA Tenants: 400 Institutional Units</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-[#0a0f1e] border border-[#06B6D4] space-y-2">
                      <h3 className="text-sm font-bold text-[#06B6D4]">Nc × Vc Gas Penalty Allocation</h3>
                      <div className="text-2xl sm:text-3xl font-black text-[#06B6D4] font-mono">
                        ฿12,500,000.00 THB
                      </div>
                      <ul className="text-xs text-zinc-300 space-y-1 list-disc list-inside pl-1 font-sans">
                        <li>Target Population: 36,225,000 Users</li>
                        <li>Nc × Vc Query Latency: 0.4 ms</li>
                        <li>Zero Drift Allocation Balance: Verified</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* SLIDE 7: Global Satellite Mesh Infrastructure */}
              {currentSlide === 7 && (
                <div className="space-y-4">
                  <div className="border-b border-[#17233f] pb-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#D4AF37]">
                      07. Global Satellite Mesh Infrastructure
                    </h1>
                    <h2 className="text-base sm:text-lg text-[#06B6D4]">
                      ขอบเขตการกระจายศูนย์ข้ามเขตแดน (Zone Boundaries Ω601–Ω1000)
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-xl bg-[#0a0f1e] border border-[#D4AF37]">
                      <span className="text-[10px] text-[#D4AF37] font-bold font-mono">PRIMARY ROOT</span>
                      <h4 className="text-xs font-bold text-white mt-0.5">Bangkok Vault (BK01)</h4>
                      <div className="text-lg font-bold text-[#D4AF37] font-mono">0.8 ms</div>
                      <p className="text-[10px] text-zinc-400">Sovereign Root Core</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0a0f1e] border border-[#17233f]">
                      <span className="text-[10px] text-[#06B6D4] font-bold font-mono">RELAY NEXUS</span>
                      <h4 className="text-xs font-bold text-white mt-0.5">Singapore (SG02)</h4>
                      <div className="text-lg font-bold text-[#06B6D4] font-mono">8.2 ms</div>
                      <p className="text-[10px] text-zinc-400">Regional Routing</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0a0f1e] border border-[#17233f]">
                      <span className="text-[10px] text-[#06B6D4] font-bold font-mono">QUANTUM VAULT</span>
                      <h4 className="text-xs font-bold text-white mt-0.5">Tokyo (TY03)</h4>
                      <div className="text-lg font-bold text-[#06B6D4] font-mono">24.1 ms</div>
                      <p className="text-[10px] text-zinc-400">Post-Quantum Backup</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0a0f1e] border border-[#17233f]">
                      <span className="text-[10px] text-[#10B981] font-bold font-mono">SECRET BOUNDARY</span>
                      <h4 className="text-xs font-bold text-white mt-0.5">Zurich (ZH04)</h4>
                      <div className="text-lg font-bold text-[#10B981] font-mono">112.5 ms</div>
                      <p className="text-[10px] text-zinc-400">Legal Boundary Node</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0a0f1e] border border-[#17233f]">
                      <span className="text-[10px] text-[#10B981] font-bold font-mono">GATEWAY NODE</span>
                      <h4 className="text-xs font-bold text-white mt-0.5">Silicon Valley (SV05)</h4>
                      <div className="text-lg font-bold text-[#10B981] font-mono">142.0 ms</div>
                      <p className="text-[10px] text-zinc-400">API Bridge Gateway</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0a0f1e] border border-[#17233f]">
                      <span className="text-[10px] text-[#10B981] font-bold font-mono">CUSTODIAN NODE</span>
                      <h4 className="text-xs font-bold text-white mt-0.5">London (LD06)</h4>
                      <div className="text-lg font-bold text-[#10B981] font-mono">128.4 ms</div>
                      <p className="text-[10px] text-zinc-400">Global Custody Sync</p>
                    </div>
                  </div>
                </div>
              )}

              {/* SLIDE 8: Mainnet Ratification & Sovereign Seal */}
              {currentSlide === 8 && (
                <div className="space-y-4">
                  <div className="border-b border-[#17233f] pb-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#D4AF37]">
                      08. Mainnet Ratification & Sovereign Seal
                    </h1>
                    <h2 className="text-base sm:text-lg text-[#06B6D4]">
                      การอนุมัติขึ้นระบบเมนเน็ตอย่างเป็นทางการ (Final Mainnet Deployment)
                    </h2>
                  </div>

                  <div className="p-5 rounded-xl bg-[#0a0f1e] border-2 border-[#D4AF37] text-center space-y-2 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                    <p className="text-xs text-[#D4AF37] font-bold font-mono tracking-widest uppercase">
                      DEPLOYMENT CERTIFICATE IDENTIFIER
                    </p>
                    <div className="text-2xl sm:text-4xl font-black text-[#D4AF37] font-mono">
                      ZQ-GREEN-DEP-849202-3908
                    </div>
                    <p className="text-xs text-zinc-400">
                      Zone Boundaries Ω601–Ω1000 Authorization Complete
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-[#0a0f1e] border border-[#17233f] space-y-1">
                      <p className="text-xs text-[#06B6D4] font-bold font-mono">Audit Verdict</p>
                      <p className="text-sm font-bold text-white">22/22 Master Gates Passed (100% Green)</p>
                      <p className="text-xs text-zinc-400">Zero Vulnerabilities Detected</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#0a0f1e] border border-[#17233f] space-y-1">
                      <p className="text-xs text-[#10B981] font-bold font-mono">Legal & Statutory Status</p>
                      <p className="text-sm font-bold text-white">100% Court-Admissible Ready</p>
                      <p className="text-xs text-zinc-400">Thai ETA Sec 9/26/28 + PDPA Compliant</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Executive Speaker Notes Drawer */}
        <AnimatePresence>
          {showSpeakerNotes && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-[#0e172a] border-t-2 border-[#D4AF37]/50 px-4 py-2.5 font-sans text-xs text-zinc-300 shrink-0"
            >
              <div className="flex items-start gap-2.5 max-w-4xl mx-auto">
                <div className="p-1 rounded bg-[#D4AF37]/20 text-[#D4AF37] shrink-0 mt-0.5">
                  <Mic className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="text-[#D4AF37] font-mono mr-2">Speaker Notes:</strong>
                  <span>{speakerNotes[currentSlide]}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Navigation Controller */}
        <div className="px-4 py-3 bg-[#0a0f1e] border-t border-[#17233f] flex items-center justify-between gap-3 font-mono text-xs">
          <button
            onClick={() => {
              setCurrentSlide((prev) => Math.max(prev - 1, 0));
              playTone(480, 0.04);
            }}
            disabled={currentSlide === 0}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-200 font-bold flex items-center gap-1 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-zinc-400">
              Slide <strong className="text-[#D4AF37]">{currentSlide === 0 ? 'Cover' : `0${currentSlide}`}</strong> of{' '}
              <strong className="text-zinc-200">0{totalSlides - 1}</strong>
            </span>
            <span className="text-zinc-600 hidden sm:inline">|</span>
            <span className="text-zinc-500 text-[11px] hidden sm:inline">
              Use Left / Right Arrows or Spacebar
            </span>
          </div>

          <button
            onClick={() => {
              setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
              playTone(540, 0.04);
            }}
            disabled={currentSlide === totalSlides - 1}
            className="px-3 py-1.5 rounded-xl bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 border border-[#D4AF37]/50 disabled:opacity-30 disabled:pointer-events-none text-[#D4AF37] font-bold flex items-center gap-1 transition cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.2)]"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
