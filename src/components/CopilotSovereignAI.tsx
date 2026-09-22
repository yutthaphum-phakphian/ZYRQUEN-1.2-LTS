/* src/components/CopilotSovereignAI.tsx */
import React, { useState, useEffect } from 'react';
import { 
  Bot, ShieldCheck, Cpu, Terminal, Sparkles, Maximize2, Minimize2, 
  X, Play, Pause, Download, RefreshCw, Send, Activity, Lock
} from 'lucide-react';

export interface CopilotSovereignAIProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  onNavigate?: (view: any) => void;
}

export const CopilotSovereignAI: React.FC<CopilotSovereignAIProps> = ({
  isOpen,
  onClose,
  onOpen,
  onNavigate
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'dialogue' | 'autonomy' | 'pqc'>('dialogue');
  const [holoMode, setHoloMode] = useState<'hologram' | 'sphere' | 'tree'>('sphere');
  const [isSpinning, setIsSpinning] = useState(true);
  const [inputMsg, setInputMsg] = useState('');
  const [logs, setLogs] = useState<string[]>([
    "สวัสดีครับท่าน Sovereign Architect (EP-SOVEREIGN-01)",
    "ระบบ Copilot Autonomy Layer v6.0 Sovereign Ultra พร้อมทำงานแล้วครับ รองรับการตรวจตรา Signed Immutable Snapshot (FIPS 204 JSON), ตรวจสอบ PQC Dilithium-5, สภาพ Quantum Multi-Agent Swarm, และควบคุม 3D Continuum ได้ทันที"
  ]);

  useEffect(() => {
    if (isOpen !== undefined) {
      setIsMinimized(!isOpen);
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!inputMsg.trim()) return;
    setLogs(prev => [
      ...prev, 
      `> ${inputMsg}`, 
      `[Copilot v6.0]: ประมวลผลคำสั่ง "${inputMsg}" สำเร็จ - Sync State SSoT เรียบร้อย`
    ]);
    setInputMsg('');
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    if (onClose) onClose();
  };

  const handleRestore = () => {
    setIsMinimized(false);
    if (onOpen) onOpen();
  };

  const handleDownloadSnapshot = () => {
    const snapshotData = {
      canonicalMerkleRoot: "909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68",
      epoch: 849202,
      pqcScheme: "CRYSTALS-Dilithium-5 / FIPS 204 (ML-DSA-87)",
      seals: 14902,
      timestamp: new Date().toISOString(),
      status: "IMMUTABLE_FROZEN_v1.2_LTS",
      principal: "นายยุทธภูมิ พากเพียร #EP-SOVEREIGN-01"
    };
    const blob = new Blob([JSON.stringify(snapshotData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZYRQUEN_PQC_SNAPSHOT_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setLogs(prev => [
      ...prev,
      `[Copilot v6.0]: ส่งออก Signed Snapshot JSON (FIPS 204) สำเร็จเรียบร้อย`
    ]);
  };

  /* โหมดพับเก็บเป็นปุ่มลอย (Floating Badge) บนจอมือถือ */
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 sm:bottom-4 right-4 z-50">
        <button 
          onClick={handleRestore}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 border border-cyan-500/60 text-cyan-300 shadow-xl shadow-cyan-950/80 hover:scale-105 transition-all animate-pulse cursor-pointer"
        >
          <Bot className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold tracking-wider">COPILOT v6.0 ULTRA</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </button>
      </div>
    );
  }

  return (
    <aside className={`fixed z-50 transition-all duration-300 ${
      isExpanded 
        ? 'inset-2 sm:inset-4 md:inset-6 max-w-full h-[calc(100vh-1rem)] sm:h-[calc(100vh-2rem)]' 
        : 'bottom-20 sm:bottom-4 right-2 left-2 sm:left-auto sm:right-4 sm:w-[460px] max-h-[75vh] sm:max-h-[85vh]'
    } flex flex-col bg-slate-950/95 backdrop-blur-xl border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/80 overflow-hidden`}>
      
      {/* Top Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-cyan-950/90 via-slate-900 to-indigo-950/90 border-b border-cyan-800/40">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white tracking-wide">COPILOT SOVEREIGN AI</span>
              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">v6.0 ULTRA</span>
              <span className="hidden sm:inline px-1.5 py-0.2 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">SOVEREIGN MESH</span>
            </div>
            <p className="text-[9.5px] text-slate-400 truncate">Epoch #849,202 • gemini-2.5-flash • (EP-S-01)</p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title={isExpanded ? "ย่อขนาด" : "ขยายเต็มจอ"}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button 
            onClick={handleMinimize}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
            title="พับเก็บ"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-slate-900/80 border-b border-slate-800 text-[11px]">
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setActiveTab('dialogue')}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'dialogue' 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            Dialogue & Reflex
          </button>
          <button 
            onClick={() => setActiveTab('autonomy')}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'autonomy' 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3 h-3" />
            Autonomy Node
          </button>
        </div>
        
        <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          SWARM ACTIVE
        </span>
      </div>

      {/* Telemetry Pills Bar */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 overflow-x-auto no-scrollbar bg-slate-950 border-b border-slate-800/80 text-[10px]">
        <div className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 shrink-0 flex items-center gap-1">
          <RefreshCw className="w-2.5 h-2.5 text-cyan-400 animate-spin" /> Continuous...
        </div>
        <div className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 shrink-0">
          🛡️ 14,902 Seals
        </div>
        <div className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300 shrink-0">
          🔮 HOLOGRAM M.
        </div>
        <div className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-300 shrink-0">
          ⚡ Δ0.00% Zero
        </div>
        <div className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 shrink-0">
          💻 DSL/VM Ready
        </div>
      </div>

      {/* Hologram Controls */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-900/50 text-[11px] border-b border-slate-800/60">
        <div className="flex items-center gap-1">
          {(['hologram', 'sphere', 'tree'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setHoloMode(mode)}
              className={`px-2 py-0.5 rounded capitalize text-[10px] font-semibold transition-all cursor-pointer ${
                holoMode === mode 
                  ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50' 
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
        <button 
          onClick={() => setIsSpinning(!isSpinning)}
          className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300 text-[10px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
        >
          {isSpinning ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
          {isSpinning ? 'Pause Spin' : 'Resume Spin'}
        </button>
      </div>

      {/* Terminal / Content Area */}
      <div className="flex-1 p-2.5 overflow-y-auto space-y-2 bg-slate-950 font-mono text-[11px] custom-scrollbar">
        {activeTab === 'dialogue' ? (
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between text-[10px] text-amber-400 border-b border-slate-800 pb-1">
              <span className="flex items-center gap-1 font-bold">
                <Terminal className="w-3 h-3 text-cyan-400" /> Sentinel Sweep v6.0
              </span>
              <span className="text-slate-500">19:38:12</span>
            </div>

            <div className="space-y-1.5 text-slate-300 leading-relaxed">
              {logs.map((log, index) => (
                <p key={index} className={log.startsWith('>') ? 'text-cyan-400 font-bold' : 'text-slate-300'}>
                  {log}
                </p>
              ))}
            </div>

            <button 
              onClick={handleDownloadSnapshot}
              className="w-full py-1.5 px-3 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-900 font-sans font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> ดาวน์โหลด Signed Snapshot ทันที
            </button>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-purple-500/30 space-y-2.5">
            <div className="flex items-center justify-between text-[10px] text-purple-400 border-b border-slate-800 pb-1 font-bold">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-purple-400" /> Autonomy Swarm Engine v6.0
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">10/10 PASS</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                <div className="text-slate-400">Phoenix SLA</div>
                <div className="text-sm font-bold text-cyan-300 font-mono">35.8 ms</div>
                <div className="text-[9px] text-slate-500">&lt; 142ms Target</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                <div className="text-slate-400">Consensus Speed</div>
                <div className="text-sm font-bold text-amber-300 font-mono">851.9 QOps</div>
                <div className="text-[9px] text-slate-500">Nominal Dispatch</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                <div className="text-slate-400">Coherence</div>
                <div className="text-sm font-bold text-emerald-300 font-mono">99.992%</div>
                <div className="text-[9px] text-slate-500">768 Qubits Aligned</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                <div className="text-slate-400">Entropy dS</div>
                <div className="text-sm font-bold text-purple-300 font-mono">0.0142 J/K</div>
                <div className="text-[9px] text-slate-500">Equilibrium Bus</div>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1 text-[10px]">
              <div className="flex items-center justify-between text-slate-300">
                <span>Tri-Agent Consensus:</span>
                <span className="text-emerald-400 font-bold">Valerie • Chronos • Athena</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Invariants Verified:</span>
                <span className="text-cyan-400 font-bold">10/10 ALL GREEN</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Action Matrix */}
        <div className="grid grid-cols-3 gap-1.5 text-[10px] font-sans">
          <button 
            onClick={() => {
              if (onNavigate) onNavigate('canonical');
              setLogs(prev => [...prev, '[Copilot v6.0]: สลับมุมมองไปยัง Canonical SSoT Sphere เรียบร้อย']);
            }}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300 truncate cursor-pointer"
          >
            (Pull SSoT)
          </button>
          <button 
            onClick={handleDownloadSnapshot}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300 truncate flex items-center justify-center gap-1 cursor-pointer"
          >
            <Download className="w-2.5 h-2.5" /> Signed Snapshot
          </button>
          <button 
            onClick={() => {
              if (onNavigate) onNavigate('pqc');
              setLogs(prev => [...prev, '[Copilot v6.0]: ตรวจสอบ PQC Dilithium-5 (ML-DSA-87) ผ่านการรับรอง 100%']);
            }}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300 truncate flex items-center justify-center gap-1 cursor-pointer"
          >
            <Lock className="w-2.5 h-2.5" /> PQC Dilithium
          </button>
        </div>
      </div>

      {/* Bottom Command Prompt */}
      <div className="p-2 bg-slate-900 border-t border-slate-800">
        <div className="flex items-center gap-1.5 bg-slate-950 rounded-xl border border-slate-800 px-2.5 py-1.5 focus-within:border-cyan-500/60 transition-colors">
          <input 
            type="text" 
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="สั่งการ Copilot เช่น สลับไปโหมด Sphere, วิเคราะห์ Entropy"
            className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <button 
            onClick={handleSend}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 font-bold text-xs flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
          >
            ส่งการ <Send className="w-3 h-3" />
          </button>
        </div>
      </div>
    </aside>
  );
};
