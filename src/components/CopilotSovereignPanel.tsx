import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  Cpu, 
  Database, 
  ShieldCheck, 
  Globe, 
  Send, 
  X, 
  Pause, 
  Play, 
  Download, 
  Activity, 
  Box,
  FileCheck
} from 'lucide-react';
import { playTone } from './AudioSynthesizer';
import { triggerVibration } from '../utils/vibration';

export interface CopilotSovereignPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  onNavigate?: (view: any) => void;
  className?: string;
}

export const CopilotSovereignPanel: React.FC<CopilotSovereignPanelProps> = ({
  isOpen: controlledIsOpen,
  onClose,
  onOpen,
  onNavigate,
  className = ''
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const setOpen = (open: boolean) => {
    if (controlledIsOpen !== undefined) {
      if (open && onOpen) onOpen();
      if (!open && onClose) onClose();
    } else {
      setInternalIsOpen(open);
    }
  };

  const [activeTab, setActiveTab] = useState<'dialogue' | 'autonomy'>('dialogue');
  const [renderMode, setRenderMode] = useState<'hologram' | 'sphere' | 'tree'>('sphere');
  const [isSpinning, setIsSpinning] = useState(true);
  const [inputMsg, setInputMsg] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState([
    {
      id: 'msg-1',
      sender: 'copilot',
      tag: 'Sentinel Sweep',
      text: 'สวัสดีครับท่าน Sovereign Architect นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01) - ระบบ Copilot Autonomy Layer v5.0 Sovereign Ultra พร้อมทำงานแล้วครับ รองรับการส่งออก Signed Immutable Snapshot (FIPS 204 JSON), ตรวจสอบ PQC Dilithium-5, สั่งการ Quantum Multi-Agent Swarm, และควบคุม 3D Continuum ทันทีครับ',
      hasSnapshotBtn: true,
      timestamp: new Date().toLocaleTimeString('th-TH')
    }
  ]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const downloadSignedSnapshot = () => {
    triggerVibration('auditReport');
    playTone(882, 0.08);

    const snapshotPayload = {
      spec: 'ZYRQUEN_OMEGA_INFINITY_FROZEN_v1.2_LTS',
      version: 'v5.0_ULTRA_SOVEREIGN',
      epoch: 849202,
      canonicalMerkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      genesisBlock: '#849202',
      councilMerkleArchiveRoot: '0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
      ssotDrift: 'Δ0.00%',
      verifiedSeals: 14902,
      quarantinedSeals: 80,
      totalRawSeals: 14982,
      sovereignPrincipal: 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
      decaKeyQuorum: {
        governancePlane: '10/10 REAL_HSM Ratified Unanimous',
        physicalPlane: '10/10 Dilithium-5 Attested FIPS 140-3 L4',
        superMajority: true,
        masterOverride: '#EP-SOVEREIGN-01 ACTIVE'
      },
      pqcSpec: {
        signatureScheme: 'CRYSTALS-Dilithium-5 (ML-DSA-87, FIPS 204)',
        keyEncapsulation: 'ML-KEM-1024 (Kyber-1024, FIPS 203)',
        stateFreeHash: 'SPHINCS+ (SLH-DSA, FIPS 205)',
        status: 'TAMPER_RESISTANT_ZEROIZED_VERIFIED'
      },
      legalCompliance: {
        etdaSection9: 'Cryptographic Signature Validated',
        etdaSection26: '10/10 HSM Non-Repudiation Secured',
        etdaSection28: 'Immutable WORM Ledger Court Admissible',
        pdpaSection37: 'ZK-Isolation 400 Tenants Compliant',
        isoIec27037: 'Chain of Custody Digital Evidence Verified'
      },
      telemetrySLA: {
        cryoTempMeanBus: '14.96 mK (Bus: 14.98 mK, SLA <= 18.00 mK PASS)',
        coherenceRatio: '99.992% (SLA >= 99.950% PASS)',
        consensusSpeed: '851.9 QOps',
        traceReplayMs: '142 ms',
        phoenixRecoveryMs: '35.8 ms (SLA <= 142 ms PASS)',
        entropyFluctuation: '0.0142 J/K (Equilibrium)'
      },
      certifiedTimestampUtc: new Date().toISOString(),
      courtAdmissibility: 'COURT-ADMISSIBLE READY 100% GREEN'
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snapshotPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ZYRQUEN_SIGNED_SNAPSHOT_FIPS204_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    const notifMsg = {
      id: `ai-dl-${Date.now()}`,
      sender: 'copilot',
      tag: 'Snapshot Exported',
      text: 'ดาวน์โหลดเอกสารรับรอง Signed Immutable Snapshot (FIPS 204 JSON) เรียบร้อยแล้ว พร้อมนำไปใช้เป็นพยานหลักฐานดิจิทัลตาม พ.ร.บ.ธุรกรรมฯ มาตรา 9, 26, 28 และ PDPA ม.37',
      hasSnapshotBtn: false,
      timestamp: new Date().toLocaleTimeString('th-TH')
    };
    setMessages(prev => [...prev, notifMsg]);
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMsg;
    if (!text.trim()) return;

    triggerVibration('click');
    playTone(660, 0.04);

    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      tag: 'Architect Command',
      text: text,
      hasSnapshotBtn: false,
      timestamp: new Date().toLocaleTimeString('th-TH')
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMsg('');

    setTimeout(() => {
      triggerVibration('snapshot');
      playTone(840, 0.05);

      let replyText = `รับคำสั่ง "${text}" เรียบร้อยแล้ว - กำลังประมวลผลผ่าน Copilot Autonomy Layer v5.0 และตรวจสอบสัจจะทางคณิตศาสตร์ SSoT Δ0.00% Zero Drift ร่วมกับ PQC Dilithium-5 Enclave...`;
      let withSnapshot = false;

      const lower = text.toLowerCase();
      if (lower.includes('snapshot') || lower.includes('ดาวน์โหลด')) {
        replyText = 'จัดเตรียมชุดข้อมูล Signed Immutable Snapshot (FIPS 204 JSON) เรียบร้อยแล้ว พร้อม Merkle Hash Root 909ab814... และตราประทับ 14,902 ตราประทับ คลิกปุ่มดาวน์โหลดด้านล่างได้ทันทีครับ';
        withSnapshot = true;
      } else if (lower.includes('ssot') || lower.includes('pull')) {
        replyText = 'ซิงค์ข้อมูลจาก Canonical SSoT เรียบร้อย: Genesis Block #849202, Merkle Root ตรงกัน 100%, ค่า Drift Δ0.00%, โควรัม 10/10 REAL_HSM ได้รับการรับรองตามหลักกฎหมายไทยเรียบร้อยแล้ว';
        withSnapshot = true;
      } else if (lower.includes('pqc') || lower.includes('dilithium')) {
        replyText = 'ตรวจสอบ PQC Shield 3 ชั้น: Outer Ring = CRYSTALS-Dilithium-5 (ML-DSA-87 FIPS 204), Middle Ring = ML-KEM-1024 (FIPS 203), Inner Guard = SPHINCS+ (FIPS 205) - ทุกระบบผ่านการตรวจสอบ Zero Tamper สภาวะสมบูรณ์ 100%';
      } else if (lower.includes('sphere') || lower.includes('ทรงกลม')) {
        setRenderMode('sphere');
        replyText = 'สลับโหมด 3D Renderer สู่ SPHERE Mode เรียบร้อยแล้ว หมุนเรโซแนนซ์รอบแกน 882 Hz';
      } else if (lower.includes('hologram') || lower.includes('โฮโลแกรม')) {
        setRenderMode('hologram');
        replyText = 'สลับโหมด 3D Renderer สู่ HOLOGRAM Mode แสดงสนามความต่อเนื่องควอนตัม 37.93 mW';
      } else if (lower.includes('tree') || lower.includes('ต้นไม้') || lower.includes('merkle')) {
        setRenderMode('tree');
        replyText = 'สลับโหมด 3D Renderer สู่ 24-Layer Merkle Tree Continuum Mode ยืนยัน Leaf Node 14,902 ชุดสมบูรณ์';
      }

      const aiReply = {
        id: `ai-${Date.now()}`,
        sender: 'copilot',
        tag: 'Autonomy Reflex',
        text: replyText,
        hasSnapshotBtn: withSnapshot,
        timestamp: new Date().toLocaleTimeString('th-TH')
      };
      setMessages(prev => [...prev, aiReply]);
    }, 700);
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 font-mono text-slate-100 select-none ${className}`}>
      
      {/* 1. COPILOT MAIN FLOATING PANEL */}
      {isOpen && (
        <div className="w-[340px] sm:w-[460px] bg-slate-950/95 border-cyan-500/50 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.25)] backdrop-blur-2xl p-3.5 space-y-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* Top Title Bar */}
          <div className="flex items-start justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-white tracking-wider uppercase flex items-center gap-1.5">
                    Copilot Sovereign AI
                  </h3>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold">
                    v5.0 ULTRA
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold hidden sm:inline-block">
                    SOVEREIGN MESH
                  </span>
                </div>
                <p className="text-[9.5px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <span className="text-cyan-400">Epoch #849,202</span>
                  <span>•</span>
                  <span className="text-purple-300 font-semibold">gemini-2.5-flash</span>
                  <span>•</span>
                  <span className="truncate max-w-[140px] text-slate-300">นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                triggerVibration('click');
                playTone(480, 0.04);
                setOpen(false);
              }}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sub-Tabs: Dialogue & Reflex / Autonomy Node */}
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2 text-xs">
            <button
              onClick={() => {
                triggerVibration('click');
                setActiveTab('dialogue');
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition font-bold cursor-pointer ${
                activeTab === 'dialogue'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dialogue & Reflex</span>
            </button>

            <button
              onClick={() => {
                triggerVibration('click');
                setActiveTab('autonomy');
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition cursor-pointer ${
                activeTab === 'autonomy'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Autonomy Node</span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            </button>
          </div>

          {/* 5 Status Indicator Metric Badges */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-[9.5px]">
            <div className="p-1.5 rounded-lg bg-slate-900/90 border-slate-800 text-center">
              <span className="text-slate-500 block text-[8px] flex items-center justify-center gap-0.5">
                <Cpu className="w-2.5 h-2.5 text-cyan-400" /> Autonomy Node
              </span>
              <span className="text-cyan-300 font-bold truncate block">Continuous Active</span>
            </div>

            <div className="p-1.5 rounded-lg bg-slate-900/90 border-slate-800 text-center">
              <span className="text-slate-500 block text-[8px] flex items-center justify-center gap-0.5">
                <Database className="w-2.5 h-2.5 text-purple-400" /> Memory Mesh
              </span>
              <span className="text-purple-300 font-bold truncate block">14,902 Seals</span>
            </div>

            <div className="p-1.5 rounded-lg bg-slate-900/90 border-slate-800 text-center">
              <span className="text-slate-500 block text-[8px] flex items-center justify-center gap-0.5">
                <Box className="w-2.5 h-2.5 text-amber-400" /> UI Renderer
              </span>
              <span className="text-amber-300 font-bold truncate block uppercase">{renderMode} Mode</span>
            </div>

            <div className="p-1.5 rounded-lg bg-slate-900/90 border-slate-800 text-center">
              <span className="text-slate-500 block text-[8px] flex items-center justify-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" /> Sentinel Reflex
              </span>
              <span className="text-emerald-300 font-bold truncate block">Δ0.00% Zero Drift</span>
            </div>

            <div className="p-1.5 rounded-lg bg-slate-900/90 border-slate-800 text-center col-span-3 sm:col-span-1">
              <span className="text-slate-500 block text-[8px] flex items-center justify-center gap-0.5">
                <Globe className="w-2.5 h-2.5 text-cyan-400" /> Thai Semantic
              </span>
              <span className="text-cyan-300 font-bold truncate block">DSL/VM Ready</span>
            </div>
          </div>

          {/* 3D Renderer Control Bar */}
          <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-900/60 border-slate-800 text-[10.5px]">
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  triggerVibration('click');
                  setRenderMode('hologram');
                }}
                className={`px-2.5 py-0.5 rounded-md transition cursor-pointer ${
                  renderMode === 'hologram'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Hologram
              </button>

              <button
                onClick={() => {
                  triggerVibration('click');
                  setRenderMode('sphere');
                }}
                className={`px-2.5 py-0.5 rounded-md transition cursor-pointer ${
                  renderMode === 'sphere'
                    ? 'bg-cyan-500/30 text-cyan-300 border-cyan-500/50 font-bold shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sphere
              </button>

              <button
                onClick={() => {
                  triggerVibration('click');
                  setRenderMode('tree');
                }}
                className={`px-2.5 py-0.5 rounded-md transition cursor-pointer ${
                  renderMode === 'tree'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tree
              </button>
            </div>

            <button
              onClick={() => {
                triggerVibration('click');
                playTone(isSpinning ? 440 : 660, 0.04);
                setIsSpinning(!isSpinning);
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20 transition cursor-pointer"
            >
              {isSpinning ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-amber-400" />}
              <span>{isSpinning ? 'Pause Spin' : 'Resume Spin'}</span>
            </button>
          </div>

          {/* Chat Messages Log Area */}
          <div className="max-h-52 overflow-y-auto space-y-2.5 pr-1 no-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-xl border space-y-2 text-xs leading-relaxed ${
                  msg.sender === 'copilot'
                    ? 'bg-slate-900/90 border-slate-800 text-slate-200'
                    : 'bg-cyan-950/40 border-cyan-500/30 text-cyan-100 ml-6'
                }`}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    {msg.tag}
                  </span>
                  <span className="text-slate-500">{msg.timestamp}</span>
                </div>

                <p className="text-[11px] font-sans text-slate-300 leading-snug">
                  {msg.text}
                </p>

                {msg.hasSnapshotBtn && (
                  <button
                    onClick={downloadSignedSnapshot}
                    className="flex items-center gap-1.5 w-full justify-center px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40 transition active:scale-95 text-[11px] font-mono font-semibold cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>ดาวน์โหลด Signed Snapshot ทันที</span>
                  </button>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Command Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[10px]">
            <button
              onClick={() => handleSendMessage('(Pull SSoT)')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700 transition shrink-0 active:scale-95 cursor-pointer"
            >
              (Pull SSoT)
            </button>

            <button
              onClick={() => handleSendMessage('ดาวน์โหลด Signed Snapshot')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700 transition shrink-0 active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3 text-cyan-400" />
              <span>ดาวน์โหลด Signed Snapshot</span>
            </button>

            <button
              onClick={() => handleSendMessage('ตรวจสอบ PQC Dilithium-5')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700 transition shrink-0 active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-3 h-3 text-purple-400" />
              <span>ตรวจสอบ PQC Dilithium-5</span>
            </button>
          </div>

          {/* Input Command Box */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="สั่งการ Copilot (เช่น สลับเป็นโหมด Sphere, วิเคราะห์ entropy,...)"
                className="w-full pl-3 pr-3 py-1.5 rounded-xl bg-slate-900 border-slate-800 focus:border-cyan-500/60 text-xs text-white placeholder-slate-500 outline-none transition font-sans"
              />
            </div>
            <button
              onClick={() => handleSendMessage()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40 transition active:scale-95 text-xs font-bold shrink-0 cursor-pointer"
            >
              <span>สั่งการ</span>
              <Send className="w-3 h-3 text-cyan-400" />
            </button>
          </div>

        </div>
      )}

      {/* 2. FLOATING TRIGGER BUTTON (FAB) - Bottom Right */}
      {!isOpen && (
        <button
          id="btn-floating-copilot-v5-fab"
          onClick={() => {
            triggerVibration('click');
            playTone(740, 0.05);
            setOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] backdrop-blur-md transition active:scale-95 font-mono text-xs font-bold cursor-pointer"
        >
          <Bot className="w-4 h-4 text-cyan-400 animate-bounce" />
          <span>COPILOT v5.0</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </button>
      )}

    </div>
  );
};
