import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Workflow,
  Clock,
  Radio,
  Activity,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { triggerVibration } from '../../utils/vibration';
import { playTone } from '../AudioSynthesizer';

export interface DashboardFeatureSection {
  id: string;
  labelEn: string;
  labelTh: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export const DASHBOARD_FEATURE_SECTIONS: DashboardFeatureSection[] = [
  {
    id: 'verification-gate-section',
    labelEn: 'Verification Gate',
    labelTh: 'เกตยืนยันความปลอดภัย',
    badge: '100% GUARD',
    icon: ShieldCheck,
    color: '#06b6d4',
  },
  {
    id: 'sovereign-isolation-section',
    labelEn: 'Sovereign Isolation',
    labelTh: 'ตัดการเชื่อมต่อแอร์แกป',
    badge: 'AIR-GAP',
    icon: ShieldAlert,
    color: '#ef4444',
  },
  {
    id: 'forensic-pipeline-section',
    labelEn: '16-Step Forensic Pipeline',
    labelTh: 'ไปป์ไลน์ 16 ขั้น',
    badge: '16/16 FROZEN',
    icon: Workflow,
    color: '#10b981',
  },
  {
    id: 'seal-clock-metrics-section',
    labelEn: 'Hardware Seal Clock',
    labelTh: 'นาฬิกาตราประทับ',
    badge: '14,902 SEALS',
    icon: Clock,
    color: '#3b82f6',
  },
  {
    id: 'hsm-cluster-section',
    labelEn: 'Deca-Key HSM Quorum',
    labelTh: 'สภาคีย์ฮาร์ดแวร์ 10/10',
    badge: '10/10 HSM',
    icon: Radio,
    color: '#a855f7',
  },
  {
    id: 'mutation-delta-section',
    labelEn: 'Mutation Delta & Zero-Drift',
    labelTh: 'เดลตาความแปรผัน 0.00%',
    badge: 'Δ0.00% SSoT',
    icon: Activity,
    color: '#06b6d4',
  },
  {
    id: 'enclaves-router-section',
    labelEn: 'Enclaves & Chambers',
    labelTh: '18 ห้องอธิปไตย',
    badge: '18 SSoT',
    icon: LayoutGrid,
    color: '#f59e0b',
  },
];

interface DashboardFeatureScrollSpyProps {
  currentView: string;
  uiScale?: number;
  onScaleChange?: (scale: number) => void;
}

export const DashboardFeatureScrollSpy: React.FC<DashboardFeatureScrollSpyProps> = ({
  currentView,
  uiScale = 1.0,
  onScaleChange,
}) => {
  const [activeSectionId, setActiveSectionId] = useState<string>(DASHBOARD_FEATURE_SECTIONS[0].id);
  const [isManualScroll, setIsManualScroll] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeBtnRef = useRef<HTMLButtonElement | null>(null);
  const manualTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto scroll spy observer: detect visible section on scroll
  useEffect(() => {
    if (currentView !== 'dashboard') return;

    const sectionElements = DASHBOARD_FEATURE_SECTIONS.map((sec) => document.getElementById(sec.id)).filter(
      Boolean
    ) as HTMLElement[];

    if (sectionElements.length === 0) return;

    // Scroll listener with bounding client rect for fluid mobile & zoomed responsiveness
    const handleScroll = () => {
      if (isManualScroll) return;

      const viewportMiddle = window.innerHeight * 0.35;
      let closestSectionId = DASHBOARD_FEATURE_SECTIONS[0].id;
      let closestDistance = Infinity;

      for (const section of DASHBOARD_FEATURE_SECTIONS) {
        const el = document.getElementById(section.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        // Distance from section top to top viewport zone
        const dist = Math.abs(rect.top - viewportMiddle);
        if (rect.top <= viewportMiddle + 100 && rect.bottom >= viewportMiddle - 100) {
          closestSectionId = section.id;
          break;
        } else if (dist < closestDistance && rect.bottom > 0) {
          closestDistance = dist;
          closestSectionId = section.id;
        }
      }

      if (closestSectionId) {
        setActiveSectionId((prev) => {
          if (prev !== closestSectionId) {
            return closestSectionId;
          }
          return prev;
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run initial detection
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [currentView, isManualScroll]);

  // Center the active feature tab button in the scrollable strip
  useEffect(() => {
    if (containerRef.current && activeBtnRef.current) {
      const container = containerRef.current;
      const btn = activeBtnRef.current;
      const targetScroll = btn.offsetLeft - container.clientWidth / 2 + btn.clientWidth / 2;
      container.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
  }, [activeSectionId]);

  const handleSelectSection = (id: string) => {
    playTone(680, 0.04);
    triggerVibration('click');
    setActiveSectionId(id);
    setIsManualScroll(true);

    if (manualTimerRef.current) clearTimeout(manualTimerRef.current);
    manualTimerRef.current = setTimeout(() => {
      setIsManualScroll(false);
    }, 1200);

    const el = document.getElementById(id);
    if (el) {
      const headerOffset = 130;
      const elementPosition = el.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = Math.max(0, elementPosition - headerOffset);

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const scrollStrip = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      playTone(520, 0.03);
      const amount = direction === 'left' ? -220 : 220;
      containerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  if (currentView !== 'dashboard') return null;

  return (
    <div className="sticky top-[58px] sm:top-[68px] z-30 w-full bg-[#070b16]/95 backdrop-blur-2xl border-b border-cyan-500/20 shadow-[0_6px_25px_rgba(0,0,0,0.5)] transition-all">
      <div className="max-w-[1780px] mx-auto px-2 sm:px-4 py-1.5 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Left Indicator & Mobile Title */}
        <div className="hidden md:flex items-center gap-1.5 shrink-0 font-mono text-[11px] text-cyan-300 font-bold uppercase tracking-wider pl-1">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="hidden xl:inline">Sovereign Feature Spy</span>
          <span className="xl:hidden">Features</span>
          <span className="text-zinc-600">/</span>
        </div>

        {/* Scroll Chevrons Left */}
        <button
          type="button"
          onClick={() => scrollStrip('left')}
          className="hidden sm:flex items-center justify-center w-6 h-7 rounded-lg bg-black/40 hover:bg-cyan-950/60 border border-white/10 text-cyan-400 transition-colors shrink-0 cursor-pointer shadow-sm"
          title="Scroll features left"
          aria-label="Scroll features left"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Horizontal Scrolling Feature Buttons */}
        <div className="relative flex-1 min-w-0 overflow-hidden">
          {/* Edge Fades */}
          <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-[#070b16] to-transparent pointer-events-none z-10" />

          <div
            ref={containerRef}
            className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 px-2 touch-pan-x scroll-smooth"
          >
            {DASHBOARD_FEATURE_SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSectionId === sec.id;
              return (
                <button
                  key={sec.id}
                  ref={isActive ? activeBtnRef : null}
                  onClick={() => handleSelectSection(sec.id)}
                  className={`group relative shrink-0 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-mono text-[11px] sm:text-xs flex items-center gap-1.5 whitespace-nowrap transition-all duration-200 select-none cursor-pointer border ${
                    isActive
                      ? 'bg-cyan-950/90 text-white border-cyan-400/90 shadow-[0_0_15px_rgba(6,182,212,0.35)] font-bold scale-[1.02]'
                      : 'bg-black/40 text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] border-white/5 hover:border-cyan-500/30'
                  }`}
                  title={`${sec.labelEn} (${sec.labelTh}) — คลิกเพื่อเลื่อนไปยังฟีเจอร์นี้`}
                >
                  {/* Glowing Bottom Line for Active */}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-cyan-400 rounded-full shadow-[0_0_6px_#06b6d4]" />
                  )}

                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 transition-transform ${
                      isActive ? 'scale-125 shadow-[0_0_6px_currentColor]' : 'opacity-50'
                    }`}
                    style={{ backgroundColor: sec.color, color: sec.color }}
                  />

                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                      isActive ? 'text-cyan-300' : 'text-zinc-500 group-hover:text-zinc-300'
                    }`}
                  />

                  <span className="tracking-wide">
                    {/* Responsive text: Thai / English */}
                    <span className="hidden sm:inline">{sec.labelEn}</span>
                    <span className="sm:hidden">{sec.labelTh}</span>
                  </span>

                  <span
                    className={`text-[9px] px-1 sm:px-1.5 py-0.2 rounded font-mono font-bold tracking-wider shrink-0 border ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40'
                        : 'bg-black/50 text-zinc-500 border-white/10 group-hover:text-zinc-400'
                    }`}
                  >
                    {sec.badge}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l from-[#070b16] to-transparent pointer-events-none z-10" />
        </div>

        {/* Scroll Chevrons Right */}
        <button
          type="button"
          onClick={() => scrollStrip('right')}
          className="hidden sm:flex items-center justify-center w-6 h-7 rounded-lg bg-black/40 hover:bg-cyan-950/60 border border-white/10 text-cyan-400 transition-colors shrink-0 cursor-pointer shadow-sm"
          title="Scroll features right"
          aria-label="Scroll features right"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Quick Zoom & Scale Tuner ("ปรับขนาด") */}
        {onScaleChange && (
          <div className="flex items-center gap-1 shrink-0 pl-1 border-l border-white/10">
            <span className="hidden lg:inline text-[10px] font-mono text-zinc-500">ปรับขนาด:</span>
            <div className="flex items-center gap-0.5 bg-black/50 p-0.5 rounded-lg border border-white/10">
              <button
                type="button"
                onClick={() => {
                  playTone(480, 0.03);
                  triggerVibration('click');
                  const next = Math.max(0.75, Math.round((uiScale - 0.05) * 100) / 100);
                  onScaleChange(next);
                }}
                disabled={uiScale <= 0.75}
                className="p-1 rounded text-zinc-400 hover:text-cyan-300 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="ย่อขนาด (Zoom out / 80% / 75%)"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={() => {
                  playTone(600, 0.03);
                  triggerVibration('click');
                  onScaleChange(1.0);
                }}
                className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold cursor-pointer transition-colors ${
                  uiScale === 1.0 ? 'text-cyan-300 bg-cyan-950/60' : 'text-zinc-400 hover:text-white'
                }`}
                title="รีเซ็ตขนาด 100%"
              >
                {Math.round(uiScale * 100)}%
              </button>

              <button
                type="button"
                onClick={() => {
                  playTone(540, 0.03);
                  triggerVibration('click');
                  const next = Math.min(1.25, Math.round((uiScale + 0.05) * 100) / 100);
                  onScaleChange(next);
                }}
                disabled={uiScale >= 1.25}
                className="p-1 rounded text-zinc-400 hover:text-cyan-300 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="ขยายขนาด (Zoom in)"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-3 h-3" />
              </button>

              {uiScale !== 1.0 && (
                <button
                  type="button"
                  onClick={() => {
                    playTone(720, 0.03);
                    triggerVibration('click');
                    onScaleChange(1.0);
                  }}
                  className="p-1 rounded text-amber-400 hover:bg-white/10 cursor-pointer"
                  title="รีเซ็ตขนาดเป็น 100%"
                  aria-label="Reset zoom"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
