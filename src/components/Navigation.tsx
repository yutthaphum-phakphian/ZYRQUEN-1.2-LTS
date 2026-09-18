import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewType } from '../types';
import { SYSTEM_METADATA } from '../data/canonicalData';
import {
  LayoutDashboard,
  Cpu,
  Share2,
  Lock,
  FileCheck2,
  Activity,
  Workflow,
  Orbit,
  Archive,
  Terminal,
  ShieldCheck,
  Settings,
  Crown,
  Volume2,
  VolumeX,
  Award,
  Sparkles,
  Scale,
  Search,
  Keyboard,
  Users,
  TrendingUp,
  Bell,
  Radio,
  Snowflake,
  LayoutGrid,
  Grid3X3,
  Boxes,
  Eye,
  Fingerprint,
  Camera,
  Menu,
  PanelLeftClose,
  PanelLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { playTone, getHarmonicCarrierSnapshot } from './AudioSynthesizer';
import { PWAInstallButton } from './PWAInstallButton';
import { GitHubSyncWarningNav } from './navigation/GitHubSyncWarningNav';
import { CopilotAssistantDrawer } from './copilot/CopilotAssistantDrawer';

interface NavigationProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
  onOpenCertificate: () => void;
  onOpenLegalSearch: () => void;
  onOpenShortcuts: () => void;
  onOpenEventsSidebar?: () => void;
  eventsCount?: number;
  onCaptureSnapshot?: () => void;
  isAudioActive: boolean;
  onToggleAudio: () => void;
  isSystemActivityFrozen?: boolean;
  onToggleFreezeSystemActivity?: () => void;
  isForensicAuditMode?: boolean;
  onToggleForensicAuditMode?: () => void;
  sealCount?: number;
  isSnapshotIncrementing?: boolean;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onTriggerLoginLoader?: (mode?: 'login' | 'register' | 'switch_tenant') => void;
  isCopilotOpen?: boolean;
  onToggleCopilot?: () => void;
  epochCountdown?: string;
  isEmergencyLockdown?: boolean;
  onToggleEmergencyLockdown?: () => void;
}

interface NavItem {
  id: ViewType;
  labelEn: string;
  labelTh: string;
  icon: React.FC<{ className?: string }>;
  dotColor: string;
  badge?: string;
  shortcut?: string;
}

export const NAVIGATION_ITEMS: NavItem[] = [
  { id: 'dashboard', labelEn: 'Dashboard', labelTh: 'ศูนย์บัญชาการ', icon: LayoutDashboard, dotColor: '#06B6D4', badge: 'HQ', shortcut: '1' },
  { id: 'zyrquen_gg', labelEn: 'ZYRQUEN GG', labelTh: 'แผงควบคุม GG v1.2', icon: Boxes, dotColor: '#06B6D4', badge: 'GG API', shortcut: 'G' },
  { id: 'fusion', labelEn: 'Fusion Console', labelTh: 'รวมศูนย์นิติวิทยาศาสตร์', icon: Activity, dotColor: '#D946EF', badge: 'FUSION', shortcut: 'F' },
  { id: 'playback', labelEn: '12-Stage Replay', labelTh: 'จำลองสืบย้อน', icon: ShieldCheck, dotColor: '#F59E0B', badge: 'TRACE', shortcut: 'P' },
  { id: 'chambers', labelEn: '18 Chambers', labelTh: '18 ห้องอธิปไตย SSoT', icon: LayoutGrid, dotColor: '#6366F1', badge: '18 SSoT', shortcut: 'K' },
  { id: 'civilization', labelEn: 'Civilization', labelTh: 'เครื่องยนต์อารยธรรม', icon: Crown, dotColor: '#D4AF37', badge: 'WARP Ω∞', shortcut: 'W' },
  { id: 'studio', labelEn: 'Studio 3D', labelTh: 'สตูดิโอ 3D โฮโลแกรม', icon: Boxes, dotColor: '#06B6D4', badge: '3D LATTICE', shortcut: 'S' },
  { id: 'unified', labelEn: 'Multiverse Panel', labelTh: 'แผงควบคุมรวมมิติ', icon: LayoutGrid, dotColor: '#38BDF8', badge: 'TRI-VIEW', shortcut: 'U' },
  { id: 'heatmap', labelEn: '14.9K Seals Heatmap', labelTh: 'แผนผังสุขภาพ 14,902 ตรา', icon: Grid3X3, dotColor: '#10B981', badge: '14.9K', shortcut: 'H' },
  { id: 'council', labelEn: 'Council 10/10', labelTh: 'สภาผู้พิทักษ์', icon: Crown, dotColor: '#F59E0B', badge: '10/10', shortcut: 'C' },
  { id: 'production', labelEn: 'Readiness', labelTh: 'ความพร้อมผลิต', icon: ShieldCheck, dotColor: '#10B981', badge: 'PH-20', shortcut: 'R' },
  { id: 'quantum', labelEn: 'Quantum', labelTh: 'ควอนตัมเน็กซัส', icon: Cpu, dotColor: '#8B5CF6', badge: '768-Q', shortcut: '2' },
  { id: 'nexus', labelEn: 'Nexus', labelTh: 'เครือข่ายข้อมูล', icon: Share2, dotColor: '#3B82F6', shortcut: '3' },
  { id: 'vault', labelEn: 'Vault', labelTh: 'คลังรหัสผ่าน', icon: Lock, dotColor: '#F59E0B', badge: 'OMEGA', shortcut: '4' },
  { id: 'ledger', labelEn: 'Ledger', labelTh: 'สมุดบัญชีหลักฐาน', icon: FileCheck2, dotColor: '#10B981', badge: '14.9K', shortcut: '5' },
  { id: 'pulse', labelEn: 'Pulse', labelTh: 'โทรมาตรเรียลไทม์', icon: Activity, dotColor: '#06B6D4', shortcut: '6' },
  { id: 'forge', labelEn: 'Forge', labelTh: 'โรงหลอมอัตโนมัติ', icon: Workflow, dotColor: '#F59E0B', shortcut: '7' },
  { id: 'matrix', labelEn: 'Matrix', labelTh: 'มัลติเวิร์สจำลอง', icon: Orbit, dotColor: '#8B5CF6', shortcut: '8' },
  { id: 'archive', labelEn: 'Archive', labelTh: 'คลังแมนิเฟสต์ 17', icon: Archive, dotColor: '#3B82F6', badge: '17 MOD', shortcut: '9' },
  { id: 'console', labelEn: 'Console', labelTh: 'เทอร์มินัล CLI', icon: Terminal, dotColor: '#10B981', badge: 'CLI', shortcut: '0' },
  { id: 'security', labelEn: 'Security', labelTh: 'โล่ซีโร่ทรัสต์', icon: ShieldCheck, dotColor: '#10B981', badge: 'ZERO', shortcut: '-' },
  { id: 'legal', labelEn: 'Legal & PDPA', labelTh: 'กฎหมายอธิปไตย', icon: Scale, dotColor: '#3B82F6', badge: 'PDPA', shortcut: 'L' },
  { id: 'canonical', labelEn: 'Canonical Integrity', labelTh: 'ความสมบูรณ์แคนอนิคัล', icon: ShieldCheck, dotColor: '#10B981', badge: 'STABLE LOCK', shortcut: 'I' },
  { id: 'admin', labelEn: 'Admin RBAC', labelTh: 'จัดการสิทธิ์ผู้ใช้', icon: Users, dotColor: '#06B6D4', badge: 'RBAC', shortcut: 'A' },
  { id: 'analytics', labelEn: 'Audit Analytics', labelTh: 'วิเคราะห์การตรวจสอบ', icon: TrendingUp, dotColor: '#10B981', badge: 'TRENDS', shortcut: 'Y' },
  { id: 'settings', labelEn: 'Settings', labelTh: 'ผู้ดูแลชาวไทย', icon: Settings, dotColor: '#71717A', shortcut: '=' },
];

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onSelectView,
  onOpenCertificate,
  onOpenLegalSearch,
  onOpenShortcuts,
  onOpenEventsSidebar,
  eventsCount = 0,
  isAudioActive,
  onToggleAudio,
  onCaptureSnapshot,
  isSystemActivityFrozen = false,
  onToggleFreezeSystemActivity,
  isForensicAuditMode = false,
  onToggleForensicAuditMode,
  sealCount,
  isSnapshotIncrementing = false,
  isSidebarOpen = false,
  onToggleSidebar,
  onTriggerLoginLoader,
  isCopilotOpen: externalIsCopilotOpen,
  onToggleCopilot,
  epochCountdown: externalEpochCountdown,
  isEmergencyLockdown = false,
  onToggleEmergencyLockdown,
}) => {
  const [internalCountdown, setInternalCountdown] = useState<string>('00:00:00');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const hours = String(23 - now.getHours()).padStart(2, '0');
      const minutes = String(59 - now.getMinutes()).padStart(2, '0');
      const seconds = String(59 - now.getSeconds()).padStart(2, '0');
      setInternalCountdown(`${hours}:${minutes}:${seconds}`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentEpochCountdown = externalEpochCountdown || internalCountdown;

  const [carrierData, setCarrierData] = useState<{ volume: number; wavePath: string; frequency: number }>({
    volume: 0,
    wavePath: 'M 0 10 Q 25 10, 50 10 T 100 10',
    frequency: 882,
  });

  const displaySealCount = sealCount || SYSTEM_METADATA.canonicalSeals || 14902;
  const [highlightKey, setHighlightKey] = useState<number>(0);
  const [isSealHighlighting, setIsSealHighlighting] = useState<boolean>(false);
  const [internalIsCopilotOpen, setInternalIsCopilotOpen] = useState<boolean>(false);
  const effectiveIsCopilotOpen = externalIsCopilotOpen !== undefined ? externalIsCopilotOpen : internalIsCopilotOpen;
  const prevCountRef = useRef<number>(displaySealCount);

  // Tab Strip Refs for Auto-Centering and Horizontal Smooth Scrolling
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const activeTabRef = useRef<HTMLButtonElement | null>(null);

  // Auto-scroll active tab into center view
  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [currentView]);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      playTone(540, 0.04);
      const scrollAmount = direction === 'left' ? -260 : 260;
      tabsContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Trigger animation on snapshot capture / seal count change
  useEffect(() => {
    if (prevCountRef.current !== displaySealCount || isSnapshotIncrementing) {
      prevCountRef.current = displaySealCount;
      setIsSealHighlighting(true);
      setHighlightKey((k) => k + 1);
      const timer = setTimeout(() => {
        setIsSealHighlighting(false);
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [displaySealCount, isSnapshotIncrementing]);

  const handleCaptureSnapshotWithAnimation = () => {
    setIsSealHighlighting(true);
    setHighlightKey((k) => k + 1);
    playTone(740, 0.08);
    if (onCaptureSnapshot) {
      onCaptureSnapshot();
    }
    setTimeout(() => {
      setIsSealHighlighting(false);
    }, 1600);
  };

  // Frequency-reactive visualizer animation loop
  useEffect(() => {
    let animId: number;
    let phase = 0;

    const updateWave = () => {
      phase += 0.15;
      const snapshot = getHarmonicCarrierSnapshot();
      const isActive = isAudioActive && snapshot.isActive;
      const vol = isActive ? Math.max(0.04, snapshot.volume * 4) : 0;
      const freq = snapshot.frequency || 882;

      // Generate dynamic SVG cubic bezier wave path matching real-time harmonic volume
      const points: string[] = [];
      const width = 80;
      const height = 20;
      const midY = height / 2;
      const amplitude = isActive ? Math.min(8.5, 2.5 + vol * 30) : 1;

      points.push(`M 0 ${midY}`);
      const segments = 6;
      for (let i = 1; i <= segments; i++) {
        const x = (i / segments) * width;
        const sineOffset = Math.sin(phase + i * 1.2) * amplitude;
        const prevX = ((i - 1) / segments) * width;
        const cp1X = prevX + (x - prevX) / 2;
        const cp1Y = midY + (i % 2 === 0 ? sineOffset : -sineOffset);
        points.push(`Q ${cp1X} ${cp1Y}, ${x} ${midY}`);
      }

      setCarrierData({
        volume: vol,
        wavePath: points.join(' '),
        frequency: freq,
      });

      animId = requestAnimationFrame(updateWave);
    };

    animId = requestAnimationFrame(updateWave);
    return () => cancelAnimationFrame(animId);
  }, [isAudioActive]);
  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-[#070914]/95 via-[#0b0e1e]/90 to-[#070914]/95 backdrop-blur-3xl border-b border-cyan-500/20 transition-all shadow-[0_8px_30px_-10px_rgba(6,182,212,0.15)] relative overflow-hidden">
      {/* Ambient Top Glow */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
      <div className="absolute top-0 left-1/4 w-1/2 h-16 bg-cyan-500/5 rounded-b-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <div className="relative z-10 max-w-[1720px] mx-auto px-2.5 sm:px-4 md:px-6 py-2 flex items-center justify-between gap-2 sm:gap-4 overflow-hidden">
        {/* Left Brand Identity & Sidebar Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          {/* Sidebar OPEN/CLOSE Toggle Button */}
          <button
            onClick={() => {
              playTone(isSidebarOpen ? 480 : 720, 0.05);
              onToggleSidebar?.();
            }}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-xl border transition-all shadow-sm select-none group shrink-0 cursor-pointer ${
              isSidebarOpen
                ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                : 'bg-black/40 hover:bg-white/10 text-zinc-300 hover:text-white border-white/10 hover:border-cyan-500/30'
            }`}
            title="Toggle Sidebar / เปิด-ปิดเมนูข้าง (Ctrl+B or [)"
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            ) : (
              <Menu className="w-4 h-4 text-zinc-300 group-hover:text-cyan-400 group-hover:scale-110 transition-transform" />
            )}
            <span className="hidden sm:inline font-mono text-xs font-semibold">
              {isSidebarOpen ? 'Menu (Open)' : 'Menu'}
            </span>
          </button>

          <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#0a0f1e] border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.25)] group cursor-default shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse relative z-10" />
            <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 border-2 border-[#070914] shadow-[0_0_8px_#10B981]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-mono font-bold text-xs sm:text-base tracking-widest text-white uppercase whitespace-nowrap">
                ZYRQUEN <span className="text-cyan-400">Ω∞</span>
              </span>
              <span className="hidden md:inline-flex px-2 py-0.5 text-[10px] font-mono rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 shadow-sm shrink-0">
                FROZEN v1.2 LTS
              </span>
              <span className="hidden 2xl:inline-flex px-2 py-0.5 text-[10px] font-mono rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 shadow-sm items-center gap-1.5 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SSoT MUTATION = 0
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-zinc-400 font-mono mt-0.5">
              <button
                onClick={() => {
                  playTone(840, 0.05);
                  onTriggerLoginLoader?.('login');
                }}
                className="text-cyan-100/80 hover:text-cyan-300 font-medium hover:underline flex items-center gap-1 cursor-pointer truncate max-w-[140px] sm:max-w-[240px] md:max-w-none"
                title="Trigger Sovereign Quantum Login & Warp Ingress Loader"
              >
                <span className="truncate">🇹🇭 นายยุทธภูมิ ภักเพียร (#EP-SOVEREIGN-01)</span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/40 text-[9px] text-cyan-300 shrink-0">
                  LOGIN/WARP
                </span>
              </button>
              <span className="hidden sm:inline text-zinc-600">•</span>
              <span className="hidden lg:inline text-zinc-500 tracking-wider shrink-0">ROOT: <span className="text-zinc-400">909ab814...fa4c68</span></span>
            </div>
          </div>
        </div>

        {/* Center Live Telemetry Gauges with Progressive Green Highlight on Snapshot */}
        <div className="hidden 2xl:flex items-center gap-4 bg-[#0a0f1e] border border-cyan-500/20 px-5 py-2 rounded-2xl shadow-inner backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[11px] font-mono text-zinc-500">QOps:</span>
            <span className="text-[11px] font-mono text-cyan-300 font-bold tracking-wide">{SYSTEM_METADATA.qOpsTelemetry} QOps/s</span>
          </div>
          <div className="w-[1px] h-3.5 bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-zinc-500">Coherence:</span>
            <span className="text-[11px] font-mono text-violet-300 font-bold tracking-wide">{SYSTEM_METADATA.coherence}</span>
          </div>
          <div className="w-[1px] h-3.5 bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-zinc-500">Cryo:</span>
            <span className="text-[11px] font-mono text-amber-300 font-bold tracking-wide">{SYSTEM_METADATA.cryoTemp}</span>
          </div>
          <div className="w-[1px] h-3.5 bg-white/10" />
          
          {/* Verified Seals Counter with Framer Motion and Progressive Green Highlight */}
          <motion.div
            layout
            layoutId="nav-verified-seals-counter"
            animate={{
              scale: isSealHighlighting ? [1, 1.08, 1] : 1,
              backgroundColor: isSealHighlighting ? 'rgba(16, 185, 129, 0.25)' : 'rgba(0, 0, 0, 0)',
              borderColor: isSealHighlighting ? 'rgba(52, 211, 153, 0.6)' : 'rgba(255, 255, 255, 0)',
              boxShadow: isSealHighlighting
                ? '0 0 25px rgba(16, 185, 129, 0.7), inset 0 0 10px rgba(16, 185, 129, 0.3)'
                : 'none',
            }}
            transition={{
              layout: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
              duration: 0.5,
              ease: 'easeOut',
            }}
            className="flex items-center gap-2 px-2.5 py-1 rounded-xl border border-transparent transition-colors relative overflow-hidden"
          >
            {isSealHighlighting && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                className="absolute inset-0 bg-emerald-400/20 blur-sm pointer-events-none rounded-xl"
              />
            )}
            <motion.span layout className="text-[11px] font-mono text-zinc-400 font-medium relative z-10">
              Verified Seals:
            </motion.span>
            <AnimatePresence mode="wait">
              <motion.span
                layout
                key={`${displaySealCount}-${highlightKey}`}
                initial={{ y: -8, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 8, opacity: 0, scale: 1.1 }}
                transition={{
                  layout: { duration: 0.35, ease: 'easeOut' },
                  duration: 0.35,
                  ease: 'easeOut',
                }}
                className={`text-[11px] font-mono font-bold tracking-wide flex items-center gap-1.5 relative z-10 ${
                  isSealHighlighting ? 'text-emerald-200 drop-shadow-[0_0_12px_#10B981]' : 'text-emerald-400'
                }`}
              >
                <span>{displaySealCount.toLocaleString()}</span>
                <span className="text-zinc-500 font-normal">/ {SYSTEM_METADATA.canonicalSeals.toLocaleString()}</span>
                {isSealHighlighting && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                )}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Epoch Countdown Timer: SYNC_EPOCH_ROTATION */}
          <div
            id="nav-epoch-countdown"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/60 border border-cyan-500/30 text-xs font-mono shadow-[0_0_12px_rgba(6,182,212,0.15)] shrink-0 select-none"
            title="Real-time Epoch Countdown Timer (SYNC_EPOCH_ROTATION: counting down to 00:00:00)"
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider hidden xl:inline">SYNC_EPOCH_ROTATION:</span>
            <span className="text-[10px] text-zinc-400 font-bold uppercase xl:hidden">EPOCH:</span>
            <span className="text-amber-400 font-bold tracking-widest">{currentEpochCountdown}</span>
          </div>

          {/* Emergency Lockdown Toggle Button */}
          {onToggleEmergencyLockdown && (
            <button
              id="btn-nav-emergency-lockdown"
              type="button"
              onClick={() => {
                playTone(isEmergencyLockdown ? 520 : 280, 0.1);
                onToggleEmergencyLockdown();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border font-mono text-xs transition-all cursor-pointer select-none active:scale-95 ${
                isEmergencyLockdown
                  ? 'bg-red-600 text-white border-red-400 shadow-[0_0_22px_rgba(239,68,68,0.9)] animate-pulse font-bold ring-2 ring-red-400/50'
                  : 'bg-red-950/40 hover:bg-red-900/60 text-red-300 border-red-500/30 hover:border-red-500/60 shadow-[0_0_10px_rgba(239,68,68,0.15)]'
              }`}
              title="Simulate Critical Threat & Emergency Lockdown Border Glow (Quarantine Triggered)"
            >
              <span className={`w-2 h-2 rounded-full ${isEmergencyLockdown ? 'bg-white animate-ping' : 'bg-red-500'}`} />
              <span className="hidden sm:inline font-bold">
                {isEmergencyLockdown ? 'DISARM LOCKDOWN' : 'EMERGENCY LOCK'}
              </span>
              <span className="sm:hidden font-bold">
                {isEmergencyLockdown ? 'DISARM' : 'ALERT'}
              </span>
            </button>
          )}

          {/* GitHub Synchronization Warning & Drift Re-sync System */}
          <PWAInstallButton />
          <GitHubSyncWarningNav />

          {/* Copilot Assistant Layer (Sovereign Epoch #849202) Trigger Button */}
          <button
            id="btn-nav-copilot-trigger"
            onClick={() => {
              playTone(740, 0.06);
              if (onToggleCopilot) {
                onToggleCopilot();
              } else {
                setInternalIsCopilotOpen(!internalIsCopilotOpen);
              }
            }}
            className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-xs transition-all cursor-pointer active:scale-95 ${
              effectiveIsCopilotOpen
                ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'bg-purple-950/40 hover:bg-purple-900/50 border-purple-500/30 hover:border-purple-400/60 text-purple-200 hover:text-white shadow-[0_0_12px_rgba(168,85,247,0.15)] hover:shadow-[0_0_18px_rgba(168,85,247,0.3)]'
            }`}
            title="เปิด/ปิด Copilot Assistant Layer (Sovereign Epoch #849202)"
          >
            <span className="text-sm group-hover:scale-110 transition-transform">🧠</span>
            <span className="hidden sm:inline font-bold tracking-wide">Copilot</span>
            <span className={`px-1.5 py-0.2 rounded font-mono text-[9px] border ${
              effectiveIsCopilotOpen ? 'bg-black/20 text-black border-black/30 font-bold' : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
            }`}>Ω1</span>
          </button>

          {/* Dedicated Legal & PQC Search Trigger Button with Search Icon */}
          <button
            onClick={() => {
              playTone(680, 0.08);
              onOpenLegalSearch();
            }}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-400/50 text-cyan-300 hover:text-cyan-100 font-mono text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_20px_rgba(6,182,212,0.25)]"
            title="Search Thai Laws & Cryptographic Standards (Ctrl+K / ⌘K)"
          >
            <Search className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline font-bold tracking-wide">Thai Laws & PQC Search</span>
            <span className="sm:hidden font-bold">Search</span>
            <kbd className="hidden md:inline px-1.5 py-0.5 text-[10px] rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">⌘K</kbd>
          </button>

          {/* Keyboard Shortcuts Trigger Button */}
          <button
            onClick={() => {
              playTone(620, 0.06);
              onOpenShortcuts();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/30 hover:bg-white/10 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white font-mono text-xs transition-colors shadow-sm"
            title="Global Keyboard Shortcuts & Fast Navigator (? or Ctrl+/)"
          >
            <Keyboard className="w-4 h-4 text-zinc-400" />
            <span className="hidden lg:inline text-[11px] font-medium">Shortcuts</span>
            <kbd className="hidden sm:inline px-1.5 py-0.5 text-[10px] rounded bg-white/10 text-zinc-300 font-mono border border-white/10">?</kbd>
          </button>

          {/* System Events Sidebar Trigger */}
          {onOpenEventsSidebar && (
            <button
              onClick={() => {
                playTone(640, 0.05);
                onOpenEventsSidebar();
              }}
              className="relative p-2 rounded-xl bg-black/30 hover:bg-white/10 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white font-mono text-xs transition-colors flex items-center gap-1.5 shadow-sm"
              title="Toggle System Events Activity Feed (Shift+E)"
            >
              <Bell className="w-4 h-4 text-cyan-400" />
              {eventsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-cyan-500 text-black border-2 border-[#070914] text-[9px] font-bold shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                  {eventsCount}
                </span>
              )}
            </button>
          )}

          {/* Hardware Snapshot Trigger with Animated Counter Effect */}
          {onCaptureSnapshot && (
            <button
              onClick={handleCaptureSnapshotWithAnimation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-400/50 text-emerald-300 font-mono text-xs transition-all shadow-[0_0_12px_rgba(16,185,129,0.15)] active:scale-95"
              title="Capture Hardware Telemetry Snapshot (Increments Verified Seals with Progressive Green Highlight)"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xl:inline font-bold">Quick Snapshot</span>
            </button>
          )}

          {/* Forensic Audit Mode Toggle (Overlays Metadata Hashes & PQC Signatures + CRT Overlay) */}
          {onToggleForensicAuditMode && (
            <button
              id="btn-nav-forensic-crt-toggle"
              onClick={() => {
                playTone(isForensicAuditMode ? 440 : 760, 0.08);
                onToggleForensicAuditMode();
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono text-xs transition-all shadow-sm cursor-pointer ${
                isForensicAuditMode
                  ? 'bg-amber-950/40 text-amber-200 border-amber-500/60 shadow-[0_0_18px_rgba(245,158,11,0.35)] font-bold ring-1 ring-amber-400/40'
                  : 'bg-black/30 hover:bg-slate-800 border-white/10 hover:border-slate-600 text-slate-400 hover:text-slate-200'
              }`}
              title={
                isForensicAuditMode
                  ? 'Forensic CRT Mode: Active (Scanlines, Aperture Grille & Evidentiary Audit)'
                  : 'Toggle Forensic CRT Mode: Enable high-density scanlines and forensic audit'
              }
            >
              <Eye
                className={`w-3.5 h-3.5 ${
                  isForensicAuditMode ? 'text-amber-400 animate-pulse' : 'text-slate-400'
                }`}
              />
              <span className="hidden sm:inline">
                {isForensicAuditMode ? 'FORENSIC CRT' : 'Forensic CRT'}
              </span>
              <div
                className={`w-7 h-4 flex items-center rounded-full p-0.5 transition-colors ${
                  isForensicAuditMode ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <div className="w-2.5 h-2.5 bg-slate-950 rounded-full shadow-sm" />
              </div>
            </button>
          )}

          {/* Global Freeze System Activity Toggle (State-Preservation Maintenance Mode) */}
          {onToggleFreezeSystemActivity && (
            <button
              onClick={() => {
                playTone(isSystemActivityFrozen ? 580 : 340, 0.08);
                onToggleFreezeSystemActivity();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-xs transition-all shadow-sm ${
                isSystemActivityFrozen
                  ? 'bg-amber-500/20 text-amber-200 border-amber-500/50 shadow-[0_0_16px_rgba(245,158,11,0.35)] animate-pulse font-bold'
                  : 'bg-black/30 hover:bg-cyan-500/10 border-white/10 hover:border-cyan-500/30 text-zinc-400 hover:text-cyan-200'
              }`}
              title={
                isSystemActivityFrozen
                  ? 'System Activity Frozen: Telemetry capture & audio clock paused (Click to Resume)'
                  : 'Freeze System Activity: Arms state-preservation maintenance mode'
              }
            >
              <Snowflake
                className={`w-3.5 h-3.5 ${
                  isSystemActivityFrozen ? 'text-amber-400 animate-spin' : 'text-zinc-400'
                }`}
                style={{ animationDuration: isSystemActivityFrozen ? '8s' : '0s' }}
              />
              <span className="hidden sm:inline">
                {isSystemActivityFrozen ? 'ACTIVITY FROZEN' : 'Freeze Activity'}
              </span>
              {isSystemActivityFrozen && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>
          )}

          {/* Frequency-Reactive 882Hz Harmonic Carrier Visualizer */}
          <div
            onClick={() => {
              playTone(600, 0.08);
              onToggleAudio();
            }}
            className={`cursor-pointer px-3 py-1.5 rounded-xl border transition-all text-xs font-mono flex items-center gap-2 ${
              isAudioActive
                ? 'bg-cyan-950/50 border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                : 'bg-black/30 border-white/10 hover:border-white/20 text-zinc-400 hover:text-zinc-200 shadow-sm'
            }`}
            title={isAudioActive ? '882 Hz Harmonic Carrier Active (Click to toggle/mute)' : 'Click to start 882 Hz Post-Quantum Clock Pulse Carrier'}
          >
            <div className="flex items-center gap-1.5">
              {isAudioActive ? (
                <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />
              ) : (
                <VolumeX className="w-4 h-4 text-zinc-500" />
              )}
              <span className="hidden md:inline text-[11px] font-bold tracking-wide">
                {isAudioActive ? '882 Hz' : 'SYNTH'}
              </span>
            </div>

            {/* Reactive SVG Wave Animation */}
            <div className="w-16 h-5 flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 80 20" className="w-full h-full">
                <defs>
                  <linearGradient id="carrierWaveGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                    <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
                  </linearGradient>
                  <filter id="waveGlowBlur">
                    <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <path
                  d={carrierData.wavePath}
                  fill="none"
                  stroke={isAudioActive ? 'url(#carrierWaveGlow)' : 'rgba(255,255,255,0.15)'}
                  strokeWidth={isAudioActive ? '2' : '1.2'}
                  strokeLinecap="round"
                  filter={isAudioActive ? 'url(#waveGlowBlur)' : 'none'}
                />
              </svg>
            </div>

            {isAudioActive && (
              <span className="hidden xl:inline text-[10px] text-cyan-300 font-mono font-semibold">
                {Math.round(carrierData.volume * 100)}%
              </span>
            )}
          </div>

          <PWAInstallButton />

          <button
            onClick={() => {
              playTone(720, 0.1);
              onOpenCertificate();
            }}
            className="group flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-violet-500/15 to-cyan-500/20 border border-amber-500/40 text-amber-300 hover:text-amber-100 font-mono text-xs hover:border-amber-400/60 transition-all shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] ml-1"
          >
            <Award className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="font-bold tracking-wide">Gold Master</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Strip with Scroll Chevrons & Edge Fades */}
      <div className="relative z-10 max-w-[1720px] mx-auto px-1 sm:px-4 border-t border-cyan-500/15 py-1.5 flex items-center gap-1">
        {/* Left Scroll Chevron */}
        <button
          type="button"
          onClick={() => scrollTabs('left')}
          className="hidden sm:flex items-center justify-center w-7 h-8 rounded-lg bg-[#0a0f1e] hover:bg-cyan-950 border border-cyan-500/30 text-cyan-400 hover:text-cyan-200 transition-all shrink-0 cursor-pointer shadow-sm z-20"
          title="Scroll tabs left"
          aria-label="Scroll tabs left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable Container with Edge Masks */}
        <div className="relative flex-1 min-w-0 overflow-hidden">
          {/* Left Edge Mask */}
          <div className="absolute left-0 top-0 bottom-0 w-4 sm:w-6 bg-gradient-to-r from-[#070914] to-transparent pointer-events-none z-10" />

          <div
            ref={tabsContainerRef}
            className="overflow-x-auto scroll-smooth custom-scrollbar flex items-center gap-1.5 sm:gap-2 py-0.5 px-2 touch-pan-x"
          >
            {NAVIGATION_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  ref={isActive ? activeTabRef : null}
                  onClick={() => {
                    playTone(isActive ? 880 : 540, 0.06);
                    onSelectView(item.id);
                  }}
                  className={`relative shrink-0 px-3 sm:px-3.5 py-2 rounded-xl font-mono text-xs flex items-center gap-2 whitespace-nowrap transition-all duration-200 select-none cursor-pointer ${
                    isActive
                      ? 'bg-[#0a0f1e] text-white border border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] font-bold'
                      : 'bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] border border-white/5 hover:border-cyan-500/30'
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-400" />
                  )}
                  <span
                    className={`w-1.5 h-1.5 rounded-full transition-transform shrink-0 ${
                      isActive ? 'scale-150 shadow-[0_0_8px_currentColor]' : 'opacity-60'
                    }`}
                    style={{ backgroundColor: item.dotColor, color: item.dotColor }}
                  />
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-cyan-300' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                  <span className="font-semibold tracking-wide whitespace-nowrap">{item.labelEn}</span>
                  <span className={`hidden 2xl:inline text-[10px] whitespace-nowrap ${isActive ? 'text-cyan-200/70' : 'text-zinc-600 group-hover:text-zinc-400'}`}>({item.labelTh})</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold tracking-wider shrink-0 ${
                        isActive ? 'bg-cyan-950 border border-cyan-400 text-cyan-300' : 'bg-[#0a0f1e] text-zinc-500 border border-white/10 group-hover:text-zinc-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.shortcut && (
                    <span className="hidden lg:group-hover:inline-block text-[8px] font-mono text-zinc-500 bg-black/50 px-1.5 py-0.5 rounded border border-white/10 ml-1 shrink-0">
                      {item.shortcut}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Edge Mask */}
          <div className="absolute right-0 top-0 bottom-0 w-4 sm:w-6 bg-gradient-to-l from-[#070914] to-transparent pointer-events-none z-10" />
        </div>

        {/* Right Scroll Chevron */}
        <button
          type="button"
          onClick={() => scrollTabs('right')}
          className="hidden sm:flex items-center justify-center w-7 h-8 rounded-lg bg-[#0a0f1e] hover:bg-cyan-950 border border-cyan-500/30 text-cyan-400 hover:text-cyan-200 transition-all shrink-0 cursor-pointer shadow-sm z-20"
          title="Scroll tabs right"
          aria-label="Scroll tabs right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Copilot Assistant Layer Drawer (Sovereign Epoch #849202) - Rendered locally only if not handled by root App */}
      {!onToggleCopilot && (
        <CopilotAssistantDrawer
          isOpen={effectiveIsCopilotOpen}
          onClose={() => setInternalIsCopilotOpen(false)}
          onNavigate={onSelectView}
        />
      )}
    </header>
  );
};
