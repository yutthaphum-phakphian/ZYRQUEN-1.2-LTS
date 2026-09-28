import React, { useState, useEffect, useCallback } from 'react';
import { Palette, Terminal, Sparkles, Shield, Check, Sun, Moon } from 'lucide-react';
import { playTone } from './AudioSynthesizer';

export type ThemeVariant = 'sovereign-default' | 'solar-light' | 'terminal-green' | 'deep-space-violet';
export type ColorMode = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'zyrquen_theme_variant';
export const COLOR_MODE_STORAGE_KEY = 'zyrquen_color_mode';

export interface ThemeConfig {
  id: ThemeVariant;
  name: string;
  shortName: string;
  tagline: string;
  dotColor: string;
  mode: ColorMode;
  activeBg: string;
  borderColor: string;
  textColor: string;
  icon: typeof Shield;
}

export const THEME_OPTIONS: ThemeConfig[] = [
  {
    id: 'sovereign-default',
    name: 'Sovereign Dark Cyan (Canonical)',
    shortName: 'Dark Sovereign',
    tagline: 'Deep Cyberpunk SSoT & Neon Cyan',
    dotColor: '#06b6d4',
    mode: 'dark',
    activeBg: 'bg-cyan-950/80',
    borderColor: 'border-cyan-500/60',
    textColor: 'text-cyan-300',
    icon: Moon,
  },
  {
    id: 'solar-light',
    name: 'Solar Light Mode (High-Contrast)',
    shortName: 'Solar Light',
    tagline: 'Crisp High-Contrast Clean Light Mode',
    dotColor: '#0284c7',
    mode: 'light',
    activeBg: 'bg-sky-100 text-sky-900',
    borderColor: 'border-sky-500/60',
    textColor: 'text-sky-900',
    icon: Sun,
  },
  {
    id: 'terminal-green',
    name: 'Terminal Green (High-Contrast)',
    shortName: 'Terminal Green',
    tagline: 'Matrix Phosphor High-Contrast Green',
    dotColor: '#22c55e',
    mode: 'dark',
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
    mode: 'dark',
    activeBg: 'bg-purple-950/80',
    borderColor: 'border-purple-500/60',
    textColor: 'text-purple-300',
    icon: Sparkles,
  },
];

/**
 * Applies the selected theme variant to the DOM (both <html> and <body> attributes/classes)
 */
export function applyThemeToDOM(theme: ThemeVariant): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const body = document.body;

  const config = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];
  const isLight = config.mode === 'light' || theme === 'solar-light';

  // Set standard data attributes
  root.setAttribute('data-theme', theme);
  body.setAttribute('data-theme', theme);
  root.setAttribute('data-color-mode', isLight ? 'light' : 'dark');
  body.setAttribute('data-color-mode', isLight ? 'light' : 'dark');

  // Sync Tailwind .dark / .light class on html element
  if (isLight) {
    root.classList.remove('dark');
    root.classList.add('light');
    body.classList.remove('dark');
    body.classList.add('light');
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
    body.classList.remove('light');
    body.classList.add('dark');
  }

  // Remove existing theme variant classes
  root.classList.remove('theme-terminal-green', 'theme-deep-space-violet', 'theme-sovereign-default', 'theme-solar-light');
  body.classList.remove('theme-terminal-green', 'theme-deep-space-violet', 'theme-sovereign-default', 'theme-solar-light');

  // Add selected theme class
  root.classList.add(`theme-${theme}`);
  body.classList.add(`theme-${theme}`);

  // Dispatch custom event for decoupled subscribers
  window.dispatchEvent(new CustomEvent('zyrquen-theme-changed', { detail: { theme, mode: config.mode } }));
}

/**
 * Custom hook to consume and update the active theme and dark/light mode across components
 */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemeVariant>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeVariant | null;
      if (saved && (saved === 'terminal-green' || saved === 'deep-space-violet' || saved === 'sovereign-default' || saved === 'solar-light')) {
        return saved;
      }
      const savedMode = localStorage.getItem(COLOR_MODE_STORAGE_KEY);
      if (savedMode === 'light') return 'solar-light';
    }
    return 'sovereign-default';
  });

  const isDarkMode = theme !== 'solar-light';
  const isLightMode = theme === 'solar-light';

  const setTheme = useCallback((newTheme: ThemeVariant) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      localStorage.setItem(COLOR_MODE_STORAGE_KEY, newTheme === 'solar-light' ? 'light' : 'dark');
    } catch {
      // Ignore localStorage write quota/sandbox errors
    }
    applyThemeToDOM(newTheme);
  }, []);

  const toggleColorMode = useCallback(() => {
    const nextTheme: ThemeVariant = theme === 'solar-light' ? 'sovereign-default' : 'solar-light';
    setTheme(nextTheme);
  }, [theme, setTheme]);

  useEffect(() => {
    applyThemeToDOM(theme);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        const nextTheme = e.newValue as ThemeVariant;
        if (nextTheme === 'terminal-green' || nextTheme === 'deep-space-violet' || nextTheme === 'sovereign-default' || nextTheme === 'solar-light') {
          setThemeState(nextTheme);
          applyThemeToDOM(nextTheme);
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const sequence: ThemeVariant[] = ['sovereign-default', 'solar-light', 'terminal-green', 'deep-space-violet'];
    const currIdx = sequence.indexOf(theme);
    const nextIdx = (currIdx + 1) % sequence.length;
    setTheme(sequence[nextIdx]);
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme, toggleColorMode, isDarkMode, isLightMode };
}

interface ThemeSwitcherProps {
  compact?: boolean;
  className?: string;
  showToggleOnly?: boolean;
  onThemeChange?: (theme: ThemeVariant) => void;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  compact = false,
  className = '',
  showToggleOnly = false,
  onThemeChange,
}) => {
  const { theme, setTheme, toggleColorMode, isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const activeConfig = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];
  const ActiveIcon = activeConfig.icon;

  const handleSelect = (variant: ThemeVariant) => {
    setTheme(variant);
    if (onThemeChange) onThemeChange(variant);
    setIsOpen(false);
    try {
      playTone(variant === 'solar-light' ? 840 : 640, 0.04);
    } catch {
      // Audio optional
    }
  };

  const handleToggleClick = () => {
    playTone(isDarkMode ? 860 : 540, 0.04);
    toggleColorMode();
    if (onThemeChange) onThemeChange(isDarkMode ? 'solar-light' : 'sovereign-default');
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

  // If toggle-only button requested
  if (showToggleOnly) {
    return (
      <button
        id="btn-theme-mode-toggle"
        type="button"
        onClick={handleToggleClick}
        className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-sm ${
          isDarkMode
            ? 'bg-slate-900/80 hover:bg-slate-800 text-amber-300 border-amber-500/30 hover:border-amber-400'
            : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
        } ${className}`}
        title={isDarkMode ? 'Switch to Light Mode (Solar Sovereign)' : 'Switch to Dark Mode (Sovereign Cyan)'}
      >
        {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" /> : <Moon className="w-3.5 h-3.5 text-slate-800" />}
        <span className="hidden sm:inline">{isDarkMode ? 'LIGHT' : 'DARK'}</span>
      </button>
    );
  }

  if (compact) {
    return (
      <div id="theme-switcher-compact" className={`relative inline-flex items-center gap-1 ${className}`}>
        {/* Quick Dark / Light Switch Button */}
        <button
          id="btn-quick-color-mode"
          type="button"
          onClick={handleToggleClick}
          className={`p-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer active:scale-95 shadow-sm ${
            isDarkMode
              ? 'bg-slate-900/80 hover:bg-slate-800 text-amber-300 border-slate-700 hover:border-amber-400'
              : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
          }`}
          title={isDarkMode ? 'Switch to Light Mode (คลิกเพื่อเปลี่ยนเป็นโหมดสว่าง)' : 'Switch to Dark Mode (คลิกเพื่อเปลี่ยนเป็นโหมดมืด)'}
        >
          {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-800" />}
        </button>

        {/* Theme Palette Dropdown Button */}
        <button
          id="theme-switcher-toggle-btn"
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer active:scale-95 shadow-sm ${
            theme === 'solar-light'
              ? 'bg-sky-50 border-sky-300 text-sky-900 shadow-[0_0_12px_rgba(2,132,199,0.2)] font-bold'
              : theme === 'terminal-green'
              ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60 shadow-[0_0_12px_rgba(34,197,94,0.25)] font-bold'
              : theme === 'deep-space-violet'
              ? 'bg-purple-950/70 border-purple-500/50 text-purple-300 hover:bg-purple-900/60 shadow-[0_0_12px_rgba(168,85,247,0.25)] font-bold'
              : 'bg-slate-900/80 border-slate-700/60 text-zinc-300 hover:text-white hover:border-cyan-500/40 shadow-sm font-bold'
          }`}
          title={`Active Theme: ${activeConfig.name} (Click to open theme options)`}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <span
            className="w-2.5 h-2.5 rounded-full ring-1 ring-white/20 transition-transform group-hover:scale-110"
            style={{ backgroundColor: activeConfig.dotColor }}
          />
          <ActiveIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{activeConfig.shortName}</span>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 top-full mt-2 z-50 w-72 p-2 rounded-2xl bg-[#090d16]/95 border border-zinc-700/60 shadow-2xl backdrop-blur-2xl font-mono animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-cyan-400" />
                  THEME & COLOR MODE
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">SSoT</span>
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
                          ? `${opt.activeBg} ${opt.borderColor} ${opt.textColor} shadow-md font-bold`
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
                            {opt.name}
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
      className={`p-1.5 rounded-2xl bg-[#090d16]/90 border border-zinc-700/60 backdrop-blur-xl shadow-lg font-mono flex items-center gap-1.5 ${className}`}
    >
      <div className="px-2.5 py-1 text-[11px] font-bold text-zinc-400 flex items-center gap-1.5 hidden md:flex">
        <Palette className="w-3.5 h-3.5 text-cyan-400" />
        <span>THEME:</span>
      </div>

      <div className="flex items-center gap-1 flex-wrap">
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

