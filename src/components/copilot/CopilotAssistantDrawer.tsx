import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate, PanInfo } from 'motion/react';
import { Bot, Maximize2, Minimize2, X, Send } from 'lucide-react';
import { copilotAssistantService, CopilotAssistantState } from '../../services/copilotAssistantService';
import { githubSyncService } from '../../services/githubSyncService';
import { SYSTEM_METADATA } from '../../data/canonicalData';
import { playTone, playAuditChime } from '../AudioSynthesizer';
import { CopilotAutonomyNodePanel } from './CopilotAutonomyNodePanel';
import { useSystemState } from '../../hooks/useSystemState';

interface CopilotAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: any) => void;
}

export const CopilotAssistantDrawer: React.FC<CopilotAssistantDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [copilotState, setCopilotState] = useState<CopilotAssistantState>(
    copilotAssistantService.getState()
  );
  const systemState = useSystemState();
  const [drawerMode, setDrawerMode] = useState<'DIALOGUE' | 'AUTONOMY_PANEL'>('DIALOGUE');
  const [inputQuery, setInputQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = copilotAssistantService.subscribe((s) => {
      setCopilotState(s);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [copilotState.chatHistory, isOpen]);

  const handleSendQuery = async (queryText?: string) => {
    const text = queryText || inputQuery;
    if (!text.trim() || isProcessing) return;

    setInputQuery('');
    setIsProcessing(true);
    playTone(660, 0.04);

    try {
      await copilotAssistantService.processUserQuery(text);
      playTone(840, 0.06);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleSphereTree = (mode: 'SPHERE' | 'TREE') => {
    playTone(720, 0.04);
    copilotAssistantService.setUIRendererMode(mode);
    onNavigate?.('canonical-integrity');
  };

  const handleToggleSpin = () => {
    playTone(600, 0.04);
    copilotAssistantService.toggleUISpin();
  };

  const handleRunSentinel = () => {
    playTone(540, 0.05);
    playTone(880, 0.08);
    playAuditChime();
    copilotAssistantService.runSentinelReflexAudit();
  };

  const handleActionPayload = (action: { type: string; label: string }) => {
    playTone(720, 0.05);
    switch (action.type) {
      case 'DOWNLOAD_SNAPSHOT':
        copilotAssistantService.triggerSnapshotDownload();
        playAuditChime();
        break;
      case 'PQC_AUDIT':
        copilotAssistantService.runPQCAudit();
        playAuditChime();
        break;
      case 'DISPATCH_SWARM':
        copilotAssistantService.submitSwarmTask('Autonomous Multi-Agent Quorum Verification');
        break;
      case 'SWITCH_SPHERE':
        handleToggleSphereTree('SPHERE');
        break;
      case 'SWITCH_TREE':
        handleToggleSphereTree('TREE');
        break;
      case 'TOGGLE_SPIN':
        handleToggleSpin();
        break;
      case 'FORCE_RESYNC':
        githubSyncService.forceRemoteResync();
        playAuditChime();
        break;
      default:
        break;
    }
  };

  const quickPrompts = [
    '⚡ ดึงอัปเดทระบบ (Pull SSoT)',
    '📥 ดาวน์โหลด Signed Snapshot',
    '🛡️ ตรวจสอบ PQC Dilithium-5',
    '🐝 สั่งการ Quantum Swarm',
    '📊 สถิติ Entropy 60 นาที (Max 9885)',
    '🧊 เจาะลึกเหตุการณ์ Minute 48 Cryo-Burst',
    '🧮 ส่วนร่วมโหนด TC-01..TC-10',
    '⚡ ตรวจสอบ Drift & ข้อเสนอแนะ',
    '🌌 สลับโหมด Sphere ↔ Tree',
    '🔄 ปรับการหมุน 3D Spin',
    `🛡️ ตรวจสอบ ${systemState.sealCount.toLocaleString()} Seals & Quorum`,
    `📦 ข้อมูล Epoch Block #${systemState.sealedBlock.toLocaleString()}`,
  ];

  const [isMaximized, setIsMaximized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Framer-motion gesture-based state & motion values for right-swipe to dismiss on mobile
  const x = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);

  // Dynamic transforms for mobile gesture feedback
  const drawerOpacity = useTransform(x, [0, 260], [1, 0.35]);
  const backdropOpacity = useTransform(x, [0, 220], [0.6, 0]);

  const handleMotionDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    // If dragged right past 75px or fast rightward flick (velocity > 280 px/s)
    if (info.offset.x > 75 || (info.offset.x > 25 && info.velocity.x > 280)) {
      playTone(480, 0.04);
      const dismissDistance = typeof window !== 'undefined' ? window.innerWidth : 600;
      animate(x, dismissDistance, {
        type: 'spring',
        stiffness: 400,
        damping: 32,
        onComplete: () => {
          onClose();
          x.set(0);
        },
      });
    } else {
      // Spring back to origin cleanly
      animate(x, 0, {
        type: 'spring',
        stiffness: 500,
        damping: 35,
      });
    }
  };

  // Reset motion value when drawer is opened
  useEffect(() => {
    if (isOpen) {
      x.set(0);
      setIsDragging(false);
    }
  }, [isOpen, x]);

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Dimmed Backdrop (tap to dismiss on mobile with gesture opacity sync) */}
      {!isMaximized && (
        <motion.div
          onClick={() => {
            playTone(480, 0.04);
            onClose();
          }}
          style={{
            opacity: isMobile ? backdropOpacity : undefined,
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-40 sm:hidden animate-in fade-in duration-200 cursor-pointer"
          aria-hidden="true"
        />
      )}

      <motion.div
        id="copilot-assistant-container"
        drag={!isMaximized && isMobile ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.02, right: 0.85 }}
        dragDirectionLock
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleMotionDragEnd}
        style={{
          x: !isMaximized && isMobile ? x : 0,
          opacity: !isMaximized && isMobile ? drawerOpacity : 1,
        }}
        className={
          isMaximized
            ? 'fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-6 font-mono pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]'
            : 'fixed inset-y-0 right-0 left-0 sm:left-auto sm:inset-auto sm:bottom-24 sm:right-8 z-50 w-full sm:w-[500px] md:w-[540px] h-full h-[100dvh] sm:h-[680px] sm:max-h-[85vh] bg-[#070a12]/95 backdrop-blur-2xl border-l sm:border border-cyan-500/50 rounded-none sm:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_40px_rgba(6,182,212,0.3),inset_0_0_20px_rgba(6,182,212,0.1)] flex flex-col overflow-hidden font-mono animate-in fade-in slide-in-from-right-8 sm:slide-in-from-bottom-8 duration-300 pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)] ring-1 ring-white/5'
        }
      >
        <div
          className={
            isMaximized
              ? 'w-full max-w-5xl h-full bg-[#070a12]/95 backdrop-blur-3xl border border-cyan-500/50 rounded-3xl flex flex-col shadow-2xl overflow-hidden ring-1 ring-white/5'
              : 'relative w-full h-full flex flex-col overflow-hidden'
          }
        >
          {/* Visual Horizontal Drag Handle Bar at Top Center (Mobile Swipe-to-Dismiss Affordance) */}
          <div
            className="sm:hidden w-full flex flex-col items-center justify-center pt-[calc(0.55rem+env(safe-area-inset-top,0px))] pb-2.5 px-4 bg-[#0a0f1e] cursor-grab active:cursor-grabbing select-none border-b border-cyan-500/20 shrink-0 touch-none"
            title="ปัดไปทางขวาเพื่อปิด Copilot (Swipe right to dismiss)"
          >
            {/* Centered Horizontal Drag Handle Bar */}
            <div className="flex items-center justify-center gap-2.5 py-0.5">
              <div className="relative flex items-center justify-center">
                <div
                  className={`absolute inset-0 bg-cyan-500/30 blur-[6px] rounded-full transition-all duration-200 ${
                    isDragging ? 'scale-125 bg-cyan-400/60' : ''
                  }`}
                />
                <div
                  className={`relative h-1.5 rounded-full transition-all duration-200 ${
                    isDragging
                      ? 'w-20 bg-gradient-to-r from-cyan-400 via-cyan-200 to-cyan-400 shadow-[0_0_14px_rgba(6,182,212,0.8)]'
                      : 'w-16 bg-gradient-to-r from-cyan-500/40 via-cyan-300 to-cyan-500/40 hover:from-cyan-400 hover:to-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.45)]'
                  }`}
                />
              </div>
              <span
                className={`text-xs text-cyan-300 font-mono transition-transform duration-150 ${
                  isDragging ? 'translate-x-2 text-cyan-100 font-bold' : 'animate-pulse'
                }`}
              >
                →
              </span>
            </div>

            {/* Clear Affordance Indicator Label */}
            <div className="flex items-center justify-center gap-1.5 mt-1 text-[9.5px] font-mono tracking-wider">
              <span className={isDragging ? 'text-cyan-200 font-bold' : 'text-cyan-400/90'}>
                {isDragging ? 'กำลังลากไปทางขวาเพื่อปิด...' : 'ปัดขวาเพื่อปิด • SWIPE RIGHT TO DISMISS'}
              </span>
              <span className="text-cyan-400 font-bold">→</span>
            </div>
          </div>

          {/* Left Edge Gesture Strip for Mobile Swipe-to-Dismiss Right */}
          <div
            className="sm:hidden absolute left-0 top-0 bottom-0 w-3.5 z-30 touch-none cursor-ew-resize opacity-0 hover:opacity-100 hover:bg-cyan-500/10 transition-opacity"
            title="ลากไปทางขวาเพื่อปิด (Swipe right to dismiss)"
          />

          {/* Window Header */}
          <div
            className="p-3.5 sm:p-4 border-b border-cyan-500/30 bg-gradient-to-r from-indigo-950/40 to-cyan-950/40 flex items-center justify-between shrink-0 select-none sm:select-auto cursor-grab sm:cursor-default"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-400/20 blur-md rounded-xl animate-pulse" />
                <div className="w-10 h-10 rounded-xl bg-[#070a12]/80 border border-cyan-400/50 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(6,182,212,0.4)] backdrop-blur-sm relative z-10 group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-indigo-500/10 group-hover:scale-110 transition-transform" />
                  <Bot className="w-5 h-5 text-cyan-300" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xs sm:text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                    <span>Copilot Sovereign AI</span>
                    <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-400/40 text-[9px] font-mono font-bold">
                      v5.0 ULTRA
                    </span>
                  </h2>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-950 text-[#10B981] border border-emerald-500/40 text-[9px] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>SOVEREIGN MESH</span>
                  </span>
                  <span className="hidden sm:inline px-1.5 py-0.2 rounded bg-[#070a12] text-[#D4AF37] border border-[#D4AF37]/30 text-[9px] font-mono">
                    Ω600_1000
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 truncate max-w-[280px] sm:max-w-none">
                  Epoch <span className="text-cyan-300">#{systemState.sealedBlock.toLocaleString()}</span> • gemini-3.8-flash • นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)
                </p>
              </div>
            </div>

            <div
              className="flex items-center gap-1.5"
              onTouchStart={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="w-8 h-8 rounded-lg bg-cyan-950/30 hover:bg-cyan-900/50 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 hover:text-white flex items-center justify-center text-sm transition-colors cursor-pointer"
                title={isMaximized ? 'ย่อหน้าต่าง (Restore)' : 'ขยายเต็มจอ (Maximize)'}
              >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => {
                  playTone(480, 0.04);
                  onClose();
                }}
                className="w-8 h-8 rounded-lg bg-red-950/20 hover:bg-red-900/40 border border-red-500/20 hover:border-red-500/50 text-red-400 hover:text-red-300 flex items-center justify-center text-sm transition-colors cursor-pointer"
                title="ปิดหน้าต่าง Copilot (Close)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

        {/* Drawer Mode Tabs: Dialogue vs Autonomy Node */}
        <div className="bg-[#070a12]/80 backdrop-blur-md px-4 pt-3 border-b border-cyan-500/30 flex items-center gap-4 shrink-0 relative z-10">
          <button
            onClick={() => {
              playTone(600, 0.03);
              setDrawerMode('DIALOGUE');
            }}
            className={`pb-3 px-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
              drawerMode === 'DIALOGUE'
                ? 'border-cyan-400 text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span>💬</span>
            <span>Dialogue & Reflex</span>
          </button>

          <button
            onClick={() => {
              playTone(650, 0.03);
              setDrawerMode('AUTONOMY_PANEL');
            }}
            className={`pb-3 px-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
              drawerMode === 'AUTONOMY_PANEL'
                ? 'border-amber-400 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span>⚡</span>
            <span>Autonomy Node</span>
            {copilotState.suggestions.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500 text-black font-bold">
                {copilotState.suggestions.length}
              </span>
            )}
          </button>
        </div>

        {/* 5 Copilot Sovereign Architecture Layers Strip */}
        <div className="p-3 bg-gradient-to-r from-[#0a0f1e]/80 to-indigo-950/20 backdrop-blur-md border-b border-white/5 grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] shrink-0 relative z-10 shadow-inner">
          <div className="p-2 rounded-xl bg-black/40 border border-cyan-500/20 hover:border-cyan-400/50 transition-colors shadow-sm">
            <div className="text-cyan-300 font-bold flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />⚡ Autonomy Node</div>
            <div className="text-[#10B981] mt-0.5 ml-3">Continuous Active</div>
          </div>
          <div className="p-2 rounded-xl bg-black/40 border border-purple-500/20 hover:border-purple-400/50 transition-colors shadow-sm">
            <div className="text-purple-300 font-bold flex items-center gap-1.5">🧠 Memory Mesh</div>
            <div className="text-zinc-400 mt-0.5 ml-5">{systemState.sealCount.toLocaleString()} Seals</div>
          </div>
          <div className="p-2 rounded-xl bg-black/40 border border-amber-500/20 hover:border-amber-400/50 transition-colors shadow-sm">
            <div className="text-[#D4AF37] font-bold flex items-center gap-1.5">🌌 UI Renderer</div>
            <div className="text-amber-400 mt-0.5 ml-5">{copilotState.uiRendererMode} Mode</div>
          </div>
          <div className="p-2 rounded-xl bg-black/40 border border-emerald-500/20 hover:border-emerald-400/50 transition-colors shadow-sm">
            <div className="text-emerald-300 font-bold flex items-center gap-1.5">🛡️ Sentinel Reflex</div>
            <div className="text-[#10B981] mt-0.5 ml-5">Δ{systemState.ssotMutationDrift} Zero Drift</div>
          </div>
          <div className="p-2 rounded-xl bg-black/40 border border-blue-500/20 hover:border-blue-400/50 transition-colors shadow-sm col-span-2 sm:col-span-1">
            <div className="text-blue-300 font-bold flex items-center gap-1.5">🇹🇭 Thai Semantic</div>
            <div className="text-blue-100 mt-0.5 ml-5">DSL/VM Ready</div>
          </div>
        </div>

        {/* Interactive Hologram & Reflex Quick Controls Bar */}
        <div className="p-3 bg-[#0a0f1e]/80 backdrop-blur-md border-b border-white/5 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-zinc-400 font-bold text-[10px] uppercase tracking-wider bg-white/5 px-2 py-1 rounded-md">Hologram:</span>
            <button
              onClick={() => handleToggleSphereTree('SPHERE')}
              className={`px-3 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-all ${
                copilotState.uiRendererMode === 'SPHERE'
                  ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-[#070a12] text-zinc-400 border-white/10 hover:border-cyan-500/40 hover:text-cyan-200'
              }`}
            >
              🌌 Sphere
            </button>
            <button
              onClick={() => handleToggleSphereTree('TREE')}
              className={`px-3 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-all ${
                copilotState.uiRendererMode === 'TREE'
                  ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-[#070a12] text-zinc-400 border-white/10 hover:border-cyan-500/40 hover:text-cyan-200'
              }`}
            >
              🌲 Tree
            </button>
            <button
              onClick={handleToggleSpin}
              className={`px-3 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-all ${
                copilotState.uiSpinActive
                  ? 'bg-cyan-900/60 text-cyan-200 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'bg-[#070a12] text-zinc-400 border-white/10 hover:border-cyan-500/30'
              }`}
            >
              {copilotState.uiSpinActive ? '⏸ Pause Spin' : '▶ Auto-Spin'}
            </button>
          </div>

          <button
            onClick={handleRunSentinel}
            className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-bold text-[11px] flex items-center gap-1.5 shadow-[0_0_15px_rgba(251,191,36,0.5)] hover:shadow-[0_0_25px_rgba(251,191,36,0.7)] transition-all cursor-pointer relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-[shimmer_1s_infinite]" />
            <span>🛡️</span>
            <span>Sentinel Sweep</span>
          </button>
        </div>

        {/* View Mode 1: Autonomy Node Dedicated Panel */}
        {drawerMode === 'AUTONOMY_PANEL' && (
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            <CopilotAutonomyNodePanel onNavigateToView={onNavigate} />
          </div>
        )}

        {/* View Mode 2: Chat Dialogue & Reflex Stream */}
        {drawerMode === 'DIALOGUE' && (
          <>
            {/* Scrollable Main Area: Chat & Reflex Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
              {/* Recent Autonomous Reflex Decisions Strip */}
              <div className="p-3.5 rounded-2xl bg-[#0a0f1e]/80 border border-cyan-500/30 space-y-3 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-indigo-500/5 group-hover:opacity-100 opacity-50 transition-opacity" />
                <div className="flex items-center justify-between text-[10px] text-cyan-200/80 uppercase tracking-wider relative z-10 font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span>Live Autonomous Reflex Stream</span>
                  </div>
                  <span className="text-cyan-400 font-bold bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-500/30">SSoT Δ{systemState.ssotMutationDrift}</span>
                </div>
                <div className="space-y-2 relative z-10">
                  {copilotState.reflexLogs.slice(0, 3).map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-xl bg-black/60 border border-white/10 flex items-start justify-between gap-3 text-[11px] hover:border-cyan-500/40 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="text-zinc-200 font-medium leading-relaxed">{log.messageTh}</div>
                        {log.detail && <div className="text-[10px] text-zinc-500">{log.detail}</div>}
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-cyan-300 shrink-0 font-bold">
                        {log.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Messages */}
              <div className="space-y-4 pt-2 pb-4">
                {copilotState.chatHistory.map((item) => (
                  <div
                    key={item.id}
                    className={`flex ${item.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 space-y-1.5 text-xs ${
                        item.sender === 'user'
                          ? 'bg-gradient-to-br from-cyan-900/40 to-cyan-950/40 border border-cyan-400/40 text-white rounded-br-sm shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                          : 'bg-gradient-to-br from-[#0a0f1e] to-black border border-white/10 text-zinc-200 rounded-bl-sm shadow-xl'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-[10px] text-zinc-400 pb-1 border-b border-white/5">
                        <span className="font-bold flex items-center gap-1.5">
                          {item.sender === 'user' ? (
                            <>
                              <span className="text-cyan-400">👤</span>
                              <span>Sovereign Architect</span>
                            </>
                          ) : (
                            <>
                              <Bot className="w-3.5 h-3.5 text-cyan-400" />
                              <span className="text-cyan-100">Copilot Sovereign V5</span>
                            </>
                          )}
                        </span>
                        <span className="font-mono text-[9px] opacity-60">{item.timestamp.slice(11, 19)}</span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap mt-1">{item.message}</p>
                      {item.actionPayload && (
                        <div className="pt-2.5">
                          <button
                            onClick={() => handleActionPayload(item.actionPayload!)}
                            className="w-full px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 via-sky-500/25 to-cyan-500/20 hover:from-cyan-500/30 hover:to-cyan-400/40 border border-cyan-400/50 text-cyan-200 hover:text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.25)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
                          >
                            <span>{item.actionPayload.label}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>
            </div>

            {/* Quick Prompts */}
            <div className="px-4 py-2 bg-[#0a0f1e]/40 border-t border-white/5 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 text-[11px]">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSendQuery(prompt)}
                  className="px-2.5 py-1 rounded-lg bg-[#070a12] hover:bg-cyan-950 border border-white/10 hover:border-cyan-500/40 text-zinc-300 hover:text-white whitespace-nowrap transition-colors cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Drawer Bottom Input Form */}
            <div className="p-3 sm:p-4 bg-[#0a0f1e]/80 backdrop-blur-xl border-t border-cyan-500/30 shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:pb-4 relative z-10">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendQuery();
                }}
                className="flex items-center gap-2 relative"
              >
                <div className="absolute inset-0 bg-cyan-400/5 blur-xl rounded-2xl pointer-events-none" />
                <input
                  type="text"
                  placeholder="สั่งการ Copilot (เช่น สลับเป็นโหมด Sphere, วิเคราะห์ entropy, เช็ค minute 48)..."
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  className="relative flex-1 bg-[#070a12]/90 backdrop-blur-sm border border-cyan-500/40 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all"
                />
                <button
                  type="submit"
                  disabled={isProcessing || !inputQuery.trim()}
                  className="relative px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-black font-bold text-xs shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all disabled:opacity-40 cursor-pointer shrink-0 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>สั่งการ</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </>
        )}
        </div>
      </motion.div>
    </>
  );
};
