import React, { useState, useEffect, useCallback } from 'react';
import { Palette, Terminal, Sparkles, Shield, Check } from 'lucide-react';
import { playTone } from './AudioSynthesizer';

export type ThemeVariant = 'terminal-green' | 'deep-space-violet' | 'sovereign-default';

export const THEME_STORAGE_KEY = 'zyrquen_theme_variant';

export interface ThemeConfig {
  id: ThemeVariant;
  name: string;
  shortName: string;
  tagline: string;
  dotColor: string;
  activeBg: string;
  borderColor: string;
  textColor: string;
  icon: typeof Terminal;
}

export const THEME_OPTIONS: ThemeConfig[] = [
  {
    id: 'terminal-green',
    name: 'Terminal Green (High-Contrast)',
    shortName: 'Terminal Green',
    tagline: 'Matrix Phosphor High-Contrast Green',
    dotColor: '#22c55e',
    activeBg: 'bg-emerald-950/80',
    borderColor: 'border-emerald-500/60',
    textColor: 'text-emerald-300',
    icon: Terminal,
  },
  {
    id: 'deep-space-violet',
    name: 'Deep Space Violet (High-Contrast)',
    shortName: 'Deep Space Violet',
    tagline: 'Cosmic Abyss High-Contrast Neon Violet',
    dotColor: '#a855f7',
    activeBg: 'bg-purple-950/80',
    borderColor: 'border-purple-500/60',
    textColor: 'text-purple-300',
    icon: Sparkles,
  },
  {
    id: 'sovereign-default',
    name: 'Sovereign Cyan (Canonical)',
    shortName: 'Sovereign Cyan',
    tagline: 'Sovereign Gold Master & Cyan Engine',
    dotColor: '#06b6d4',
    activeBg: 'bg-cyan-950/80',
    borderColor: 'border-cyan-500/60',
    textColor: 'text-cyan-300',
    icon: Shield,
  },
];

/**
 * Applies the selected theme variant to the DOM (both <html> and <body> attributes/classes)
 */
export function applyThemeToDOM(theme: ThemeVariant): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const body = document.body;

  // Set standard data attributes
  root.setAttribute('data-theme', theme);
  body.setAttribute('data-theme', theme);

  // Remove existing theme classes
  root.classList.remove('theme-terminal-green', 'theme-deep-space-violet', 'theme-sovereign-default');
  body.classList.remove('theme-terminal-green', 'theme-deep-space-violet', 'theme-sovereign-default');

  // Add selected theme class
  if (theme === 'terminal-green') {
    root.classList.add('theme-terminal-green');
    body.classList.add('theme-terminal-green');
  } else if (theme === 'deep-space-violet') {
    root.classList.add('theme-deep-space-violet');
    body.classList.add('theme-deep-space-violet');
  } else {
    root.classList.add('theme-sovereign-default');
    body.classList.add('theme-sovereign-default');
  }

  // Dispatch custom event for decoupled subscribers
  window.dispatchEvent(new CustomEvent('zyrquen-theme-changed', { detail: { theme } }));
}

/**
 * Custom hook to consume and update the active theme across components
 */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemeVariant>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeVariant | null;
      if (saved && (saved === 'terminal-green' || saved === 'deep-space-violet' || saved === 'sovereign-default')) {
        return saved;
      }
    }
    return 'sovereign-default';
  });

  const setTheme = useCallback((newTheme: ThemeVariant) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // Ignore localStorage write quota/sandbox errors
    }
    applyThemeToDOM(newTheme);
  }, []);

  useEffect(() => {
    applyThemeToDOM(theme);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        const nextTheme = e.newValue as ThemeVariant;
        if (nextTheme === 'terminal-green' || nextTheme === 'deep-space-violet' || nextTheme === 'sovereign-default') {
          setThemeState(nextTheme);
          applyThemeToDOM(nextTheme);
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const nextTheme: ThemeVariant =
      theme === 'terminal-green'
        ? 'deep-space-violet'
        : theme === 'deep-space-violet'
        ? 'sovereign-default'
        : 'terminal-green';
    setTheme(nextTheme);
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}

interface ThemeSwitcherProps {
  compact?: boolean;
  className?: string;
  onThemeChange?: (theme: ThemeVariant) => void;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  compact = false,
  className = '',
  onThemeChange,
}) => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const activeConfig = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[2];
  const ActiveIcon = activeConfig.icon;

  const handleSelect = (variant: ThemeVariant) => {
    setTheme(variant);
    if (onThemeChange) onThemeChange(variant);
    setIsOpen(false);
    try {
      playTone(720, 0.05);
    } catch {
      // Audio optional
    }
  };

  // Close dropdown on outside click or escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (compact) {
    return (
      <div id="theme-switcher-compact" className={`relative inline-flex items-center ${className}`}>
        <button
          id="theme-switcher-toggle-btn"
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer active:scale-95 shadow-sm ${
            theme === 'terminal-green'
              ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60 shadow-[0_0_12px_rgba(34,197,94,0.25)]'
              : theme === 'deep-space-violet'
              ? 'bg-purple-950/70 border-purple-500/50 text-purple-300 hover:bg-purple-900/60 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
              : 'bg-slate-900/80 border-slate-700/60 text-zinc-300 hover:text-white hover:border-cyan-500/40 shadow-sm'
          }`}
          title={`Active Theme: ${activeConfig.name} (Click to change)`}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <span
            className="w-2.5 h-2.5 rounded-full ring-1 ring-white/20 transition-transform group-hover:scale-110"
            style={{ backgroundColor: activeConfig.dotColor }}
          />
          <ActiveIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-bold">{activeConfig.shortName}</span>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 top-full mt-2 z-50 w-72 p-2 rounded-2xl bg-[#090d16]/95 border-zinc-700/60 shadow-2xl backdrop-blur-2xl font-mono animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-cyan-400" />
                  HIGH-CONTRAST THEME SELECTOR
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border-zinc-700">SSoT</span>
              </div>
              <div className="py-1 space-y-1">
                {THEME_OPTIONS.map((opt) => {
                  const isSelected = theme === opt.id;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      id={`theme-btn-${opt.id}`}
                      type="button"
                      onClick={() => handleSelect(opt.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left cursor-pointer ${
                        isSelected
                          ? `${opt.activeBg} ${opt.borderColor} ${opt.textColor} shadow-md`
                          : 'bg-zinc-900/40 hover:bg-zinc-800/60 border-transparent text-zinc-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 ring-2 ring-black/40"
                          style={{ backgroundColor: opt.dotColor }}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate flex items-center gap-1.5">
                            <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                            {opt.shortName}
                          </div>
                          <div className="text-[10px] text-zinc-500 truncate">{opt.tagline}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 shrink-0 text-current ml-2" />}
                    </button>
                  );
                })}
              </div>
              <div className="mt-1 pt-2 border-t border-zinc-800 text-[10px] text-zinc-500 text-center">
                Preference saved in localStorage
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Full Segmented Control Variant
  return (
    <div
      id="theme-switcher"
      className={`p-1.5 rounded-2xl bg-[#090d16]/90 border-zinc-700/60 backdrop-blur-xl shadow-lg font-mono flex items-center gap-1.5 ${className}`}
    >
      <div className="px-2.5 py-1 text-[11px] font-bold text-zinc-400 flex items-center gap-1.5 hidden md:flex">
        <Palette className="w-3.5 h-3.5 text-cyan-400" />
        <span>THEME:</span>
      </div>

      <div className="flex items-center gap-1">
        {THEME_OPTIONS.map((opt) => {
          const isSelected = theme === opt.id;
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              id={`theme-btn-${opt.id}`}
              type="button"
              onClick={() => handleSelect(opt.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                isSelected
                  ? `${opt.activeBg} ${opt.borderColor} ${opt.textColor} shadow-md`
                  : 'bg-zinc-900/40 hover:bg-zinc-800/60 border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
              title={opt.tagline}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/40"
                style={{ backgroundColor: opt.dotColor }}
              />
              <Icon className="w-3.5 h-3.5 opacity-80" />
              <span className="text-[11px] whitespace-nowrap">{opt.shortName}</span>
              {isSelected && <Check className="w-3 h-3 text-current ml-0.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ThemeSwitcher;
