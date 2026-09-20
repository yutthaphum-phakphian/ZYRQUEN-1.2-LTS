import { useEffect } from 'react';
import { ViewType } from '@/types';
import { playTone } from '@/components/AudioSynthesizer';

interface UseKeyboardShortcutsOptions {
  isLeftSidebarOpen: boolean;
  setIsLeftSidebarOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
  handleToggleSidebar: () => void;
  isEventsSidebarOpen: boolean;
  setIsEventsSidebarOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
  isShortcutsOpen: boolean;
  setIsShortcutsOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
  isLegalSearchOpen: boolean;
  setIsLegalSearchOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
  isCertificateOpen: boolean;
  setIsCertificateOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
  handleToggleAudio: () => void;
  setCurrentView: (view: ViewType) => void;
}

const VIEW_KEY_MAP: Record<string, ViewType> = {
  '1': 'dashboard',
  'c': 'council',
  'C': 'council',
  'r': 'production',
  'R': 'production',
  '2': 'quantum',
  '3': 'nexus',
  '4': 'vault',
  '5': 'ledger',
  '6': 'pulse',
  '7': 'forge',
  '8': 'matrix',
  '9': 'archive',
  '0': 'console',
  'u': 'unified',
  'U': 'unified',
  'h': 'heatmap',
  'H': 'heatmap',
  '-': 'security',
  '=': 'settings',
  'l': 'legal',
  'L': 'legal',
  'j': 'audithistory',
  'J': 'audithistory',
  'x': 'securitypipeline',
  'X': 'securitypipeline',
  'e': 'briefing',
  'E': 'briefing',
};

export function useKeyboardShortcuts({
  isLeftSidebarOpen,
  setIsLeftSidebarOpen,
  handleToggleSidebar,
  isEventsSidebarOpen,
  setIsEventsSidebarOpen,
  isShortcutsOpen,
  setIsShortcutsOpen,
  isLegalSearchOpen,
  setIsLegalSearchOpen,
  isCertificateOpen,
  setIsCertificateOpen,
  handleToggleAudio,
  setCurrentView,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      // 1. Meta / Ctrl shortcuts (work even inside inputs for global commands)
      if (e.metaKey || e.ctrlKey) {
        const key = e.key.toLowerCase();

        if (key === 'k') {
          e.preventDefault();
          playTone(680, 0.08);
          setIsLegalSearchOpen((prev) => !prev);
          return;
        }

        if (key === 'b') {
          e.preventDefault();
          playTone(600, 0.06);
          handleToggleSidebar();
          return;
        }

        if (key === 'e') {
          e.preventDefault();
          playTone(640, 0.06);
          setIsEventsSidebarOpen((prev) => !prev);
          return;
        }

        if (key === 'l') {
          e.preventDefault();
          playTone(540, 0.06);
          setCurrentView('ledger');
          return;
        }

        if (key === 'p') {
          e.preventDefault();
          playTone(540, 0.06);
          setCurrentView('pulse');
          return;
        }

        if (key === 'q') {
          e.preventDefault();
          playTone(540, 0.06);
          setCurrentView('quantum');
          return;
        }

        if (key === 'g') {
          e.preventDefault();
          playTone(720, 0.1);
          setIsCertificateOpen((prev) => !prev);
          return;
        }

        if (key === '/') {
          e.preventDefault();
          playTone(620, 0.06);
          setIsShortcutsOpen((prev) => !prev);
          return;
        }
      }

      // 2. Escape to dismiss modals and sidebars
      if (e.key === 'Escape') {
        if (isLeftSidebarOpen && typeof window !== 'undefined' && window.innerWidth < 1024) {
          setIsLeftSidebarOpen(false);
          return;
        }
        if (isEventsSidebarOpen) {
          setIsEventsSidebarOpen(false);
          return;
        }
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
          return;
        }
        if (isLegalSearchOpen) {
          setIsLegalSearchOpen(false);
          return;
        }
        if (isCertificateOpen) {
          setIsCertificateOpen(false);
          return;
        }
      }

      // 3. Direct single-key shortcuts when NOT focusing an input
      if (!isInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key === '[') {
          e.preventDefault();
          playTone(600, 0.06);
          setIsLeftSidebarOpen((prev) => !prev);
          return;
        }

        if (e.key === '?' || (e.shiftKey && e.key === '/')) {
          e.preventDefault();
          playTone(620, 0.06);
          setIsShortcutsOpen((prev) => !prev);
          return;
        }

        if (e.key.toLowerCase() === 'e' && e.shiftKey) {
          e.preventDefault();
          playTone(640, 0.06);
          setIsEventsSidebarOpen((prev) => !prev);
          return;
        }

        if (e.key.toLowerCase() === 'm') {
          e.preventDefault();
          handleToggleAudio();
          return;
        }

        if (VIEW_KEY_MAP[e.key]) {
          e.preventDefault();
          playTone(560, 0.06);
          setCurrentView(VIEW_KEY_MAP[e.key]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isLeftSidebarOpen,
    setIsLeftSidebarOpen,
    handleToggleSidebar,
    isEventsSidebarOpen,
    setIsEventsSidebarOpen,
    isShortcutsOpen,
    setIsShortcutsOpen,
    isLegalSearchOpen,
    setIsLegalSearchOpen,
    isCertificateOpen,
    setIsCertificateOpen,
    handleToggleAudio,
    setCurrentView,
  ]);
}
