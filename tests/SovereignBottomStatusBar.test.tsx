import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SovereignBottomStatusBar } from '../src/components/SovereignBottomStatusBar';

describe('SovereignBottomStatusBar Battery Saver Toggle', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders battery saver status button and toggles between 60FPS motion and battery saver', () => {
    render(<SovereignBottomStatusBar />);
    
    // Initially animations are enabled (60FPS MOTION)
    const button = screen.getByTitle(/โหมดประสิทธิภาพมาตรฐาน/i);
    expect(button).toBeTruthy();
    expect(screen.getAllByText(/60FPS/i).length).toBeGreaterThan(0);

    // Click to activate Battery Saver / High-Performance Mode
    fireEvent.click(button);

    // Now Battery Saver is active
    expect(screen.getAllByText(/SAVER/i).length).toBeGreaterThan(0);
    expect(localStorage.getItem('zyrquen_chart_animations_enabled')).toBe('false');

    // Click again to restore
    fireEvent.click(button);
    expect(screen.getAllByText(/60FPS/i).length).toBeGreaterThan(0);
    expect(localStorage.getItem('zyrquen_chart_animations_enabled')).toBe('true');
  });
});
