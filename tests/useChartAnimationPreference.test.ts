import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useChartAnimationPreference,
  getChartAnimationsEnabled,
  setChartAnimationsEnabled,
} from '../src/hooks/useChartAnimationPreference';

describe('useChartAnimationPreference', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-chart-animations');
    document.documentElement.removeAttribute('data-perf-mode');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('defaults to true when localStorage is empty and prefers-reduced-motion is not active', () => {
    expect(getChartAnimationsEnabled()).toBe(true);
    const { result } = renderHook(() => useChartAnimationPreference());
    expect(result.current.animationsEnabled).toBe(true);
    expect(result.current.performanceMode).toBe(false);
  });

  it('allows toggling animations off (enabling High-Performance Mode)', () => {
    const { result } = renderHook(() => useChartAnimationPreference());

    act(() => {
      result.current.toggleAnimations();
    });

    expect(result.current.animationsEnabled).toBe(false);
    expect(result.current.performanceMode).toBe(true);
    expect(localStorage.getItem('zyrquen_chart_animations_enabled')).toBe('false');
    expect(document.documentElement.getAttribute('data-chart-animations')).toBe('false');
    expect(document.documentElement.getAttribute('data-perf-mode')).toBe('high');
  });

  it('allows enabling High-Performance Mode directly via setPerformanceMode', () => {
    const { result } = renderHook(() => useChartAnimationPreference());

    act(() => {
      result.current.setPerformanceMode(true);
    });

    expect(result.current.animationsEnabled).toBe(false);
    expect(result.current.performanceMode).toBe(true);
    expect(localStorage.getItem('zyrquen_chart_animations_enabled')).toBe('false');

    act(() => {
      result.current.setPerformanceMode(false);
    });

    expect(result.current.animationsEnabled).toBe(true);
    expect(result.current.performanceMode).toBe(false);
    expect(localStorage.getItem('zyrquen_chart_animations_enabled')).toBe('true');
  });

  it('syncs across multiple hook instances via CustomEvent', () => {
    const hook1 = renderHook(() => useChartAnimationPreference());
    const hook2 = renderHook(() => useChartAnimationPreference());

    expect(hook1.result.current.animationsEnabled).toBe(true);
    expect(hook2.result.current.animationsEnabled).toBe(true);

    act(() => {
      setChartAnimationsEnabled(false);
    });

    expect(hook1.result.current.animationsEnabled).toBe(false);
    expect(hook2.result.current.animationsEnabled).toBe(false);
    expect(hook1.result.current.performanceMode).toBe(true);
    expect(hook2.result.current.performanceMode).toBe(true);
  });
});
