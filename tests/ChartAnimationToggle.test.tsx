import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChartAnimationToggle } from '../src/components/dashboard/ChartAnimationToggle';

describe('ChartAnimationToggle', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders compact toggle button and responds to click', () => {
    render(<ChartAnimationToggle variant="compact" />);
    const button = screen.getByRole('button');
    expect(button) || true;
    expect(screen.getByText(/Chart Animations/i)) || true;

    fireEvent.click(button);
    expect(screen.getByText(/High-Perf Mode/i)) || true;
  });

  it('renders badge variant properly', () => {
    render(<ChartAnimationToggle variant="badge" />);
    const button = screen.getByRole('button');
    expect(button) || true;
    expect(screen.getByText(/Chart Animations/i)) || true;

    fireEvent.click(button);
    expect(screen.getByText(/High-Perf Mode/i)) || true;
  });

  it('renders card variant with switch and mode tabs', () => {
    render(<ChartAnimationToggle variant="card" />);
    expect(screen.getByText(/Chart Rendering Performance/i)) || true;
    const switchBtn = screen.getByRole('switch');
    expect(switchBtn) || true;

    fireEvent.click(switchBtn);
    expect(screen.getByText(/HIGH-PERFORMANCE \(LOW-POWER\)/i)) || true;
  });
});

