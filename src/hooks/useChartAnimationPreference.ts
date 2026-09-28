import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'zyrquen_chart_animations_enabled';
const EVENT_NAME = 'zyrquen_chart_animations_changed';

export interface ChartAnimationPreferenceState {
  animationsEnabled: boolean;
  performanceMode: boolean; // High Performance Mode = animations disabled
  setAnimationsEnabled: (enabled: boolean) => void;
  toggleAnimations: () => void;
  setPerformanceMode: (highPerf: boolean) => void;
}

/**
 * Gets the current chart animation preference from localStorage,
 * falling back to system prefers-reduced-motion or true by default.
 */
export function getChartAnimationsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      return stored === 'true';
    }
    // Check if device/browser prefers reduced motion
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }
    return true;
  } catch {
    return true;
  }
}

/**
 * Persists and broadcasts chart animation setting changes.
 */
export function setChartAnimationsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    document.documentElement.setAttribute('data-chart-animations', enabled ? 'true' : 'false');
    document.documentElement.setAttribute('data-perf-mode', enabled ? 'standard' : 'high');
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, {
        detail: { enabled, performanceMode: !enabled },
      })
    );
  } catch (err) {
    console.warn('[ChartAnimation] Failed to write localStorage preference:', err);
  }
}

/**
 * React hook to read & toggle chart animation preference in real-time.
 */
export function useChartAnimationPreference(): ChartAnimationPreferenceState {
  const [animationsEnabled, setAnimationsState] = useState<boolean>(() => getChartAnimationsEnabled());

  useEffect(() => {
    // Sync initial attribute on document root
    document.documentElement.setAttribute('data-chart-animations', animationsEnabled ? 'true' : 'false');
    document.documentElement.setAttribute('data-perf-mode', animationsEnabled ? 'standard' : 'high');

    const handleCustomEvent = (e: Event) => {
      const custom = e as CustomEvent<{ enabled: boolean }>;
      if (custom.detail && typeof custom.detail.enabled === 'boolean') {
        setAnimationsState(custom.detail.enabled);
      } else {
        setAnimationsState(getChartAnimationsEnabled());
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setAnimationsState(e.newValue !== 'false');
      }
    };

    window.addEventListener(EVENT_NAME, handleCustomEvent);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(EVENT_NAME, handleCustomEvent);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [animationsEnabled]);

  const updateEnabled = useCallback((val: boolean) => {
    setChartAnimationsEnabled(val);
    setAnimationsState(val);
  }, []);

  const toggleAnimations = useCallback(() => {
    const next = !getChartAnimationsEnabled();
    updateEnabled(next);
  }, [updateEnabled]);

  const setPerformanceMode = useCallback(
    (highPerf: boolean) => {
      updateEnabled(!highPerf);
    },
    [updateEnabled]
  );

  return {
    animationsEnabled,
    performanceMode: !animationsEnabled,
    setAnimationsEnabled: updateEnabled,
    toggleAnimations,
    setPerformanceMode,
  };
}
