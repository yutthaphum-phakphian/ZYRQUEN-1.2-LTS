import { useRef, useState, useCallback, TouchEvent as ReactTouchEvent } from 'react';
import { ViewType } from '../types';
import { playTone } from '../components/AudioSynthesizer';

export const SWIPABLE_VIEWS: ViewType[] = [
  'dashboard',
  'quantum',
  'nexus',
  'vault',
  'ledger',
  'pulse',
  'matrix',
  'security',
  'council',
  'civilization',
  'legal',
  'settings',
];

export const VIEW_LABELS: Record<ViewType, { en: string; th: string }> = {
  dashboard: { en: 'Dashboard', th: 'ศูนย์บัญชาการ' },
  quantum: { en: 'Quantum Nexus', th: 'ควอนตัมเน็กซัส' },
  nexus: { en: 'Nexus Mesh', th: 'เครือข่ายข้อมูล' },
  vault: { en: 'Cipher Vault', th: 'คลังรหัสผ่าน' },
  ledger: { en: 'Evidence Ledger', th: 'สมุดบัญชีหลักฐาน' },
  pulse: { en: 'Pulse Telemetry', th: 'โทรมาตรเรียลไทม์' },
  forge: { en: 'Forge Pipeline', th: 'โรงหลอมอัตโนมัติ' },
  matrix: { en: 'Matrix Multiverse', th: 'มัลติเวิร์สจำลอง' },
  archive: { en: 'Archive Registry', th: 'คลังแมนิเฟสต์' },
  console: { en: 'CLI Console', th: 'เทอร์มินัลคำสั่ง' },
  security: { en: 'Zero-Trust Shield', th: 'โล่ซีโร่ทรัสต์' },
  council: { en: 'Council 10/10', th: 'สภาผู้พิทักษ์' },
  civilization: { en: 'Civilization Engine', th: 'เครื่องยนต์อารยธรรม' },
  legal: { en: 'Legal & PDPA', th: 'กฎหมายอธิปไตย' },
  canonical: { en: 'Canonical Locks', th: 'ล็อกแคนอนิคัล' },
  admin: { en: 'Admin RBAC', th: 'จัดการสิทธิ์' },
  health: { en: 'System Health', th: 'สถานะระบบ' },
  settings: { en: 'Settings', th: 'การตั้งค่า' },
  zyrquen_gg: { en: 'ZYRQUEN GG', th: 'แผงควบคุม GG' },
  fusion: { en: 'Fusion Console', th: 'รวมศูนย์นิติวิทยาศาสตร์' },
  playback: { en: '12-Stage Replay', th: 'จำลองสืบย้อน' },
  chambers: { en: '18 Chambers', th: '18 ห้องอธิปไตย' },
  studio: { en: 'Studio 3D', th: 'สตูดิโอ 3D' },
  unified: { en: 'Multiverse Panel', th: 'แผงควบคุมรวม' },
  heatmap: { en: '14.9K Heatmap', th: 'แผนผัง 14,902 ตรา' },
  production: { en: 'Production Readiness', th: 'ความพร้อมผลิต' },
  analytics: { en: 'Audit Analytics', th: 'วิเคราะห์ตรวจสอบ' },
};

export interface SwipeNavigationOptions {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  onToggleSidebar?: () => void;
  onCloseSidebar?: () => void;
  isSidebarOpen?: boolean;
  enabled?: boolean;
  minDistance?: number;
  maxTimeMs?: number;
}

export interface SwipeFeedback {
  direction: 'next' | 'prev' | 'edge_open' | 'edge_close';
  targetView?: ViewType;
  targetLabelEn: string;
  targetLabelTh: string;
  timestamp: number;
}

export function useSwipeNavigation({
  currentView,
  onNavigate,
  onToggleSidebar,
  onCloseSidebar,
  isSidebarOpen = false,
  enabled = true,
  minDistance = 50,
  maxTimeMs = 600,
}: SwipeNavigationOptions) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [swipeFeedback, setSwipeFeedback] = useState<SwipeFeedback | null>(null);

  // Compute adjacent views in swipe progression
  const currentIndex = SWIPABLE_VIEWS.indexOf(currentView);
  const nextView: ViewType = currentIndex >= 0
    ? SWIPABLE_VIEWS[(currentIndex + 1) % SWIPABLE_VIEWS.length]
    : 'dashboard';

  const prevView: ViewType = currentIndex > 0
    ? SWIPABLE_VIEWS[currentIndex - 1]
    : SWIPABLE_VIEWS[SWIPABLE_VIEWS.length - 1];

  const handleTouchStart = useCallback(
    (e: ReactTouchEvent) => {
      if (!enabled || e.touches.length !== 1) return;

      const touch = e.touches[0];
      const target = e.target as HTMLElement | null;

      // Skip elements that require horizontal dragging or interaction
      if (
        target &&
        (target.closest('input[type="range"]') ||
          target.closest('pre') ||
          target.closest('code') ||
          target.closest('[data-no-swipe]') ||
          target.closest('.overflow-x-auto') ||
          target.closest('.no-swipe'))
      ) {
        touchStartRef.current = null;
        return;
      }

      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    },
    [enabled]
  );

  const handleTouchEnd = useCallback(
    (e: ReactTouchEvent) => {
      if (!enabled || !touchStartRef.current || e.changedTouches.length === 0) {
        touchStartRef.current = null;
        return;
      }

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const duration = Date.now() - touchStartRef.current.time;
      const startX = touchStartRef.current.x;

      touchStartRef.current = null;

      // Check velocity and distance constraints
      if (duration > maxTimeMs || Math.abs(deltaX) < minDistance) {
        return;
      }

      // Ensure horizontal intent dominates vertical scrolling (prevent accidental page jumping)
      if (Math.abs(deltaX) < Math.abs(deltaY) * 1.35) {
        return;
      }

      // Edge Swipe from left border (x <= 32px) to open sidebar if closed
      if (deltaX > minDistance && startX <= 32 && !isSidebarOpen && onToggleSidebar) {
        onToggleSidebar();
        try {
          playTone(520, 0.04, 'triangle', 0.05);
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(12);
          }
        } catch {}
        setSwipeFeedback({
          direction: 'edge_open',
          targetLabelEn: 'Sidebar Drawer',
          targetLabelTh: 'เปิดเมนูด้านข้าง',
          timestamp: Date.now(),
        });
        setTimeout(() => setSwipeFeedback(null), 1400);
        return;
      }

      // Swipe Left on open sidebar to close it
      if (deltaX < -minDistance && isSidebarOpen && onCloseSidebar) {
        onCloseSidebar();
        try {
          playTone(480, 0.04, 'sine', 0.04);
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(8);
          }
        } catch {}
        return;
      }

      // Main View Navigation Swipe
      if (deltaX < -minDistance) {
        // Swipe Left -> Navigate to NEXT view
        const target = nextView;
        onNavigate(target);

        try {
          playTone(840, 0.04, 'sine', 0.05);
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
          }
        } catch {}

        const labels = VIEW_LABELS[target] || { en: target, th: target };
        setSwipeFeedback({
          direction: 'next',
          targetView: target,
          targetLabelEn: labels.en,
          targetLabelTh: labels.th,
          timestamp: Date.now(),
        });
        setTimeout(() => setSwipeFeedback(null), 1400);
      } else if (deltaX > minDistance) {
        // Swipe Right -> Navigate to PREVIOUS view
        const target = prevView;
        onNavigate(target);

        try {
          playTone(660, 0.04, 'sine', 0.05);
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
          }
        } catch {}

        const labels = VIEW_LABELS[target] || { en: target, th: target };
        setSwipeFeedback({
          direction: 'prev',
          targetView: target,
          targetLabelEn: labels.en,
          targetLabelTh: labels.th,
          timestamp: Date.now(),
        });
        setTimeout(() => setSwipeFeedback(null), 1400);
      }
    },
    [
      enabled,
      minDistance,
      maxTimeMs,
      isSidebarOpen,
      onToggleSidebar,
      onCloseSidebar,
      onNavigate,
      nextView,
      prevView,
    ]
  );

  const handleTouchCancel = useCallback(() => {
    touchStartRef.current = null;
  }, []);

  return {
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel,
    },
    nextView,
    prevView,
    swipeFeedback,
  };
}
