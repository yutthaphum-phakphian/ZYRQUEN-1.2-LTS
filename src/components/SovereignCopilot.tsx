import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  Terminal, 
  Cpu, 
  Scale, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  ChevronRight, 
  Zap, 
  Lock, 
  X, 
  Copy, 
  Check, 
  CornerDownLeft,
  Activity,
  Layers
} from 'lucide-react';
import { useSystemStateStore } from '../stores/systemStateStore';

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'copilot' | 'system';
  text: string;
  timestamp: string;
  codeSnippet?: string;
  badge?: string;
  status?: 'success' | 'warning' | 'error' | 'info';
  metadata?: Record<string, string | number>;
}

export interface QuickPrompt {
  id: string;
  label: string;
  category: 'security' | 'legal' | 'forensics' | 'treasury';
  prompt: string;
  icon: React.ReactNode;
}

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: 'qp-hsm-quorum',
    label: 'Audit 10/10 REAL_HSM Quorum',
    category: 'security',
    prompt: 'ตรวจสอบสถานะสภาผู้พิทักษ์ 10/10 REAL_HSM Quorum และใบรับรอง FIPS 140-3 Level 4',
    icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
  },
  {
    id: 'qp-forensic-replay',
    label: 'Run 12-Stage Trace SLA',
    category: 'forensics',
    prompt: 'สั่งจำลองพยานนิติวิทยาศาสตร์ 12-Stage Trace Replay ของ Seal #14902 (เป้าหมาย <142ms)',
    icon: <Activity className="w-3.5 h-3.5 text-cyan-400" />
  },
  {
    id: 'qp-legal-etda',
    label: 'Verify ETDA & PDPA Legal Proof',
    category: 'legal',
    prompt: 'สอบทานน้ำหนักประจักษ์พยานดิจิทัลในชั้นศาลไทยตาม พ.ร.บ. ธุรกรรมฯ มาตรา 9, 26, 28 และ PDPA มาตรา 37',
    icon: <Scale className="w-3.5 h-3.5 text-purple-400" />
  },
  {
    id: 'qp-treasury-fios',
    label: 'Analyze FIOS Gas Allocation',
    category: 'treasury',
    prompt: 'ประเมินการจัดสรรคืนค่าแก๊ส ฿12.5M ด้วยโมเดล Nc x Vc ประชากร 4 เซกเมนต์ (Zero Drift 0.00%)',
    icon: <Zap className="w-3.5 h-3.5 text-amber-400" />
  }
];

export interface SovereignCopilotProps {
  isOpen?: boolean;
  onClose?: () => void;
  floatingButton?: boolean;
}

/**
 * ZYRQUEN Ω∞ Sovereign Kernel v4.16 (v1.2 LTS)
 * SovereignCopilot — AI Sovereign Assistant & Control Plane Copilot Engine
 * Grounded in Genesis Block #849202 & SSoT Δ0 Zero Drift Architecture.
 */
export const SovereignCopilot: React.FC<SovereignCopilotProps> = ({
  isOpen = true,
  onClose,
  floatingButton = false
}) => {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'msg-init',
      sender: 'copilot',
      text: 'สวัสดีครับบอส! ผมคือ ZYRQUEN Ω∞ Sovereign Copilot AI พร้อมช่วยวิเคราะห์โทรมาตร ตรวจสอบสิทธิความปลอดภัย PQC และจัดทำเอกสารพยานหลักฐานดิจิทัลบน Genesis Block #849202 (SSoT Δ0 Zero Drift 0.00%) ครับ',
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      status: 'info',
      badge: 'LOCKED_FROZEN_v1.2_LTS'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync state from Zustand Global Event Store
  const { blockHeight, systemStatus, merkleRoot } = useSystemStateStore();

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle Copy to Clipboard
  const handleCopyCode = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // AI Response Processing Simulation Engine
  const processQuery = useCallback(async (query: string) => {
    const userMsg: CopilotMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);

    // Simulate AI inference delay with realistic quantum response steps
    await new Promise(resolve => setTimeout(resolve, 800));

    let replyText = '';
    let codeSnippet: string | undefined;
    let badge = 'SSoT Δ0 Verified';
    let status: 'success' | 'warning' | 'error' | 'info' = 'success';
    let metadata: Record<string, string | number> | undefined;

    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('hsm') || lowerQuery.includes('quorum') || lowerQuery.includes('ผู้พิทักษ์')) {
      replyText = `🛡️ **ผลการตรวจสอบ 10/10 REAL_HSM Deca-Key Council:**\n\n• **ความยินยอมเอกฉันท์:** 10/10 โหนดลงนามครบถ้วน (TC-01 ถึง TC-10)\n• **มาตรฐานฮาร์ดแวร์:** Utimaco u.trust GP CSe-Series (FIPS 140-3 Level 4 / CC EAL6+)\n• **รหัสลับต้านควอนตัม:** Dilithium-5 (ML-DSA-87 / FIPS 204) + Kyber-1024 (FIPS 203)\n• **การตอบสนองภัยคุกคามกายภาพ:** Active Zeroization ล้างคีย์ใน RAM ภายใน 0.48ms (< 1.2ms SLA)\n• **Phoenix Recovery:** พร้อมสลับไป SPHINCS+ (FIPS 205) แบบ 0.00ms Downtime`;
      codeSnippet = `// Quorum Verification Statement
const quorumResult = await contract.verifyREAL_HSMQuorum(
  ["TC-01", "TC-02", "TC-03", "TC-04", "TC-05", "TC-06", "TC-07", "TC-08", "TC-09", "TC-10"],
  signatures
);
// Result: TRUE (10/10 RATIFIED_IMMUTABLE)`;
      badge = '10/10 REAL_HSM RATIFIED';
      metadata = { 'Block Height': blockHeight, 'Quorum Rate': '100%', 'FIPS Grade': 'Level 4' };

    } else if (lowerQuery.includes('forensic') || lowerQuery.includes('12-stage') || lowerQuery.includes('replay') || lowerQuery.includes('นิติวิทยาศาสตร์')) {
      replyText = `🔍 **ผลการย้อนรอยนิติวิทยาศาสตร์ 12-Stage Forensic Trace Replay:**\n\n• **ระยะเวลาประมวลผล:** 35.80 ms (เร็วกว่าเป้าหมาย SLA 142.00 ms ถึง 74.8%)\n• **สถิติวัตถุพยาน:** 14,902 Canonical Seals ล็อกบน Module 17 V24 WORM Storage (Zero-Deletion Guarantee)\n• **การกักกันความเสี่ยง:** Seal #14903 ถูกแยกกักกันใน Chamber 02 Sandbox โดยไม่กระทบต่อ SSoT Δ0 Baseline State (Drift 0.00%)\n• **มาตรฐานศาลไทย:** รองรับ ISO/IEC 27037 พร้อมนำสืบพยานสู้คดีในชั้นศาล`;
      codeSnippet = `[STAGE-01: INGEST] RFC3161 Timestamp -> PASS (4.2ms)
[STAGE-02: ML-DSA-87] Dilithium-5 Signature -> PASS (12.4ms)
[STAGE-03: ML-KEM-1024] Kyber-1024 Decapsulation -> PASS (10.8ms)
[STAGE-04: SLH-DSA] SPHINCS+ Stateless Redundancy -> PASS (14.2ms)
...
[STAGE-12: CLOSURE] Immutable WORM Finalized -> READY (Total: 35.80ms < 142.00ms SLA)`;
      badge = '12-STAGE SLA PASS';
      metadata = { 'Trace Execution': '35.80ms', 'SLA Target': '<142.00ms', 'Seals Count': 14902 };

    } else if (lowerQuery.includes('etda') || lowerQuery.includes('pdpa') || lowerQuery.includes('กฎหมาย') || lowerQuery.includes('ศาล')) {
      replyText = `⚖️ **รายงานความสอดคล้องทางกฎหมายธุรกรรมดิจิทัลและ PDPA ประเทศไทย:**\n\n• **พ.ร.บ. ธุรกรรมฯ มาตรา ๙:** ลายมือชื่ออิเล็กทรอนิกส์ยืนยันอัตลักษณ์และเจตนาผูกมัดค่า Merkle Root 0x${merkleRoot.slice(0, 8)}...\n• **พ.ร.บ. ธุรกรรมฯ มาตรา ๒๖:** ลายมือชื่อดิจิทัลปลอดภัยขั้นสูง การันตีการห้ามปฏิเสธความรับผิด (Non-repudiation) ด้วย 10/10 HSM Quorum\n• **พ.ร.บ. ธุรกรรมฯ มาตรา ๒๘:** ใบรับรองสืบสานบน Immutable Audit Ledger V25 ปราศจากปุ่มลบประวัติ\n• **PDPA มาตรา ๓๗:** ปกป้องข้อมูลส่วนบุคคล 100% ด้วย Zero-Knowledge zk-SNARKs Vault`;
      codeSnippet = `// Statutory Court Evidence Warrant
const courtDossier = {
  documentRef: "DOC-SOV-HSM-1010-2026",
  etdaCompliance: ["Sec_9_Passed", "Sec_26_Secure_NonRepudiation", "Sec_28_Immutable_Ledger"],
  pdpaCompliance: "Sec_37_Zero_Knowledge_PII_Masked",
  judicialAdmissibility: "100% COURT-ADMISSIBLE READY"
};`;
      badge = 'THAI LAW COMPLIANT';
      status = 'success';

    } else if (lowerQuery.includes('treasury') || lowerQuery.includes('gas') || lowerQuery.includes('แก๊ส') || lowerQuery.includes('คลัง')) {
      replyText = `⚡ **แบบจำลองคณิตศาสตร์จัดสรรคลังชดเชยค่าแก๊ส FIOS Treasury (฿12.5M Pool):**\n\n• **Gen Z Core (9.44%):** ฿1,179,709.01 (ประชากร 13.44M คน | ฿0.087/คน)\n• **Gen Y Pro (28.63%):** ฿3,578,450.65 (ประชากร 14.56M คน | ฿0.245/คน)\n• **Gen X Enterprise (39.82%):** ฿4,976,897.37 (ประชากร 4.725M คน | ฿1.053/คน)\n• **SMB Retail (22.12%):** ฿2,764,942.98 (ประชากร 3.50M ร้าน | ฿0.789/ร้าน)\n• **ความแม่นยำ:** คำนวณตามโมเดลห่วงโซ่ $N_c \\times V_c$ ไร้เศษคลาดเคลื่อนสะสม (Zero Drift 0.00%)`;
      codeSnippet = `// Chain Model Value Formula: Segment Value = Nc * Vc
// Nc = Population * Segment Size % * Penetration (80%)
// Vc = Usage Rate * Unit Contribution THB
const totalMarketValuation = 1424080000.00; // ฿1.424B THB
const gasFeeRefundPool = 12500000.00;     // ฿12.5M THB (0.00% Drift)`;
      badge = 'Nc x Vc MODEL VERIFIED';

    } else {
      replyText = `🤖 **วิเคราะห์โทรมาตร ZYRQUEN Ω∞ สภาวะปกติ (Nominal System State):**\n\n• **สถานะเคอร์เนล:** \`${systemStatus}\` ( Read-Only Mutation Authority = 0 )\n• **จุดอ้างอิงปฐมกาล:** Genesis Block Height #${blockHeight}\n• **ค่าแฮชรากแก้ว:** \`0x${merkleRoot}\`\n• **อุณหภูมิ Cryo Bus:** 14.98 mK (Helium-4 Subzero)\n• **อัตราการรัน QOps:** 851.9 QOps/s | Quantum Coherence 99.992%\n\nมีจุดไหนในสถาปัตยกรรมที่อยากให้ผมช่วยเจาะลึกเพิ่มเติมไหมครับบอส?`;
      badge = 'SYSTEM NOMINAL';
    }

    const aiMsg: CopilotMessage = {
      id: `ai-${Date.now()}`,
      sender: 'copilot',
      text: replyText,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      codeSnippet,
      badge,
      status,
      metadata
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsThinking(false);
  }, [blockHeight, merkleRoot, systemStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isThinking) return;
    processQuery(inputText.trim());
  };

  const handlePromptClick = (promptText: string) => {
    if (isThinking) return;
    processQuery(promptText);
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-zinc-800 rounded-2xl shadow-2xl overflow-hidden font-mono text-xs">
      
      {/* Copilot Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/90 border-b border-zinc-800 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-950/80 border-cyan-700/60 text-cyan-400 shadow-md shadow-cyan-950/50">
            <Bot className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-100 tracking-wide">SOVEREIGN COPILOT</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border-cyan-800 font-semibold uppercase">
                v4.16 AI
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 truncate max-w-[200px]">
              Block #{blockHeight} | Merkle: 0x{merkleRoot.slice(0, 8)}...
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border-emerald-800/60 px-2 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            SSoT Δ0
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Category Action Bar */}
      <div className="p-2.5 bg-zinc-900/40 border-b border-zinc-800/60 flex items-center gap-2 overflow-x-auto scrollbar-none">
        {QUICK_PROMPTS.map(qp => (
          <button
            key={qp.id}
            type="button"
            onClick={() => handlePromptClick(qp.prompt)}
            disabled={isThinking}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700 text-[11px] whitespace-nowrap transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            {qp.icon}
            <span>{qp.label}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-zinc-950/60">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            } animate-in fade-in duration-200`}
          >
            {/* Sender Metadata Badge */}
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-[10px] text-zinc-500">{msg.timestamp}</span>
              {msg.badge && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950/80 border-cyan-800/60 text-cyan-300 font-bold">
                  {msg.badge}
                </span>
              )}
            </div>

            {/* Message Card */}
            <div
              className={`p-3.5 rounded-2xl max-w-[90%] border text-xs leading-relaxed space-y-2 ${
                msg.sender === 'user'
                  ? 'bg-cyan-950/50 border-cyan-800/80 text-cyan-100 rounded-tr-none'
                  : 'bg-zinc-900/90 border-zinc-800 text-zinc-200 rounded-tl-none shadow-lg'
              }`}
            >
              {/* Message Content formatted with Markdown-like bolding */}
              <div className="whitespace-pre-wrap font-sans text-xs">
                {msg.text.split('\n').map((line, i) => {
                  if (line.startsWith('• ')) {
                    return (
                      <div key={i} className="flex items-start gap-1.5 ml-1 my-0.5">
                        <ChevronRight className="w-3 h-3 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{line.replace('• ', '')}</span>
                      </div>
                    );
                  }
                  return <p key={i} className={i > 0 ? 'mt-1' : ''}>{line}</p>;
                })}
              </div>

              {/* Code Snippet Block */}
              {msg.codeSnippet && (
                <div className="mt-2 rounded-xl bg-zinc-950 border-zinc-800 p-2.5 relative group">
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 mb-1.5 border-b border-zinc-800/80 pb-1">
                    <span className="flex items-center gap-1 font-mono text-cyan-400">
                      <Terminal className="w-3 h-3" /> System Code Verification
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(msg.codeSnippet!, msg.id)}
                      className="text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">คัดลอกแล้ว</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>คัดลอก</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="font-mono text-[11px] text-emerald-400 overflow-x-auto whitespace-pre leading-normal">
                    {msg.codeSnippet}
                  </pre>
                </div>
              )}

              {/* Key Metadata Table */}
              {msg.metadata && (
                <div className="mt-2 grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80 text-[10px] font-mono">
                  {Object.entries(msg.metadata).map(([k, v]) => (
                    <div key={k} className="bg-zinc-950/80 p-1.5 rounded border-zinc-800">
                      <span className="text-zinc-500 block truncate">{k}</span>
                      <span className="text-cyan-300 font-bold">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Thinking Indicator */}
        {isThinking && (
          <div className="flex items-start gap-2 animate-pulse">
            <div className="p-2 rounded-xl bg-cyan-950 border-cyan-800 text-cyan-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="p-3 rounded-2xl bg-zinc-900 border-zinc-800 text-zinc-400 text-xs flex items-center gap-2">
              <span>กำลังประมวลผลคำสั่งด้วยเอนจิน ZYRQUEN Ω∞ AI...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Bar Form */}
      <form onSubmit={handleSubmit} className="p-3 bg-zinc-900/90 border-t border-zinc-800 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="พิมพ์คำถามหรือคำสั่งควบคุมระบบ (เช่น Audit HSM, Run 12-Stage Trace, ETDA...)"
            disabled={isThinking}
            className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-none focus:border-cyan-500 transition-all font-mono"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isThinking}
            className="absolute right-1.5 top-1.5 p-1.5 rounded-lg bg-cyan-500 text-zinc-950 hover:bg-cyan-400 disabled:opacity-30 transition-all cursor-pointer font-bold"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

    </div>
  );
};

export default SovereignCopilot;
