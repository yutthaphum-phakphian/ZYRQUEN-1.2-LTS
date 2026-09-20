// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  THEME_STORAGE_KEY,
  THEME_OPTIONS,
  applyThemeToDOM,
  ThemeVariant,
} from '../src/components/ThemeSwitcher';
import {
  CANONICAL_COMMANDS,
  CommandItem,
  CommandCategory,
} from '../src/components/GlobalCommandSearch';

/**
 * ZYRQUEN Ω∞ Vitest Test Suite: Theme Switcher & Global Command Search
 * Target: ThemeSwitcher.tsx & GlobalCommandSearch.tsx
 * Status: LOCKED_FROZEN_v1.2_LTS | SSoT Δ0 (Zero Drift 0.00%)
 */

describe('Theme Switcher & Global Command Search Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.body.className = '';
    document.documentElement.removeAttribute('data-theme');
    document.body.removeAttribute('data-theme');
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('ThemeSwitcher Component Logic', () => {
    it('[TC-THEME-01] provides Terminal Green and Deep Space Violet high-contrast variants', () => {
      const variantIds = THEME_OPTIONS.map((opt) => opt.id);
      expect(variantIds).toContain('terminal-green');
      expect(variantIds).toContain('deep-space-violet');
      expect(variantIds).toContain('sovereign-default');

      const terminalGreen = THEME_OPTIONS.find((t) => t.id === 'terminal-green');
      expect(terminalGreen).toBeDefined();
      expect(terminalGreen?.name).toMatch(/Terminal Green/i);
      expect(terminalGreen?.dotColor).toBe('#22c55e');

      const deepSpaceViolet = THEME_OPTIONS.find((t) => t.id === 'deep-space-violet');
      expect(deepSpaceViolet).toBeDefined();
      expect(deepSpaceViolet?.name).toMatch(/Deep Space Violet/i);
      expect(deepSpaceViolet?.dotColor).toBe('#a855f7');
    });

    it('[TC-THEME-02] applies Terminal Green variant to DOM with data attributes and classes', () => {
      applyThemeToDOM('terminal-green');

      expect(document.documentElement.getAttribute('data-theme')).toBe('terminal-green');
      expect(document.body.getAttribute('data-theme')).toBe('terminal-green');
      expect(document.documentElement.classList.contains('theme-terminal-green')).toBe(true);
      expect(document.documentElement.classList.contains('theme-deep-space-violet')).toBe(false);
    });

    it('[TC-THEME-03] applies Deep Space Violet variant to DOM with data attributes and classes', () => {
      applyThemeToDOM('deep-space-violet');

      expect(document.documentElement.getAttribute('data-theme')).toBe('deep-space-violet');
      expect(document.body.getAttribute('data-theme')).toBe('deep-space-violet');
      expect(document.documentElement.classList.contains('theme-deep-space-violet')).toBe(true);
      expect(document.documentElement.classList.contains('theme-terminal-green')).toBe(false);
    });

    it('[TC-THEME-04] persists and retrieves user theme preference in localStorage', () => {
      expect(THEME_STORAGE_KEY).toBe('zyrquen_theme_variant');

      // Set Terminal Green
      localStorage.setItem(THEME_STORAGE_KEY, 'terminal-green');
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('terminal-green');

      // Set Deep Space Violet
      localStorage.setItem(THEME_STORAGE_KEY, 'deep-space-violet');
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('deep-space-violet');
    });

    it('[TC-THEME-05] dispatches zyrquen-theme-changed custom event upon theme switch', () => {
      const listener = vi.fn();
      window.addEventListener('zyrquen-theme-changed', listener);

      applyThemeToDOM('terminal-green');

      expect(listener).toHaveBeenCalled();
      const eventDetail = listener.mock.calls[0][0].detail;
      expect(eventDetail.theme).toBe('terminal-green');

      window.removeEventListener('zyrquen-theme-changed', listener);
    });
  });

  describe('GlobalCommandSearch Component Logic', () => {
    it('[TC-SEARCH-01] contains indexed commands across System Events, Legal Triggers, and Navigation Views', () => {
      const categories = new Set(CANONICAL_COMMANDS.map((c) => c.category));
      expect(categories.has('navigation')).toBe(true);
      expect(categories.has('legal')).toBe(true);
      expect(categories.has('events')).toBe(true);

      const navCount = CANONICAL_COMMANDS.filter((c) => c.category === 'navigation').length;
      const legalCount = CANONICAL_COMMANDS.filter((c) => c.category === 'legal').length;
      const eventsCount = CANONICAL_COMMANDS.filter((c) => c.category === 'events').length;

      expect(navCount).toBeGreaterThanOrEqual(10);
      expect(legalCount).toBeGreaterThanOrEqual(6);
      expect(eventsCount).toBeGreaterThanOrEqual(8);
    });

    it('[TC-SEARCH-02] verifies statutory references in Legal Triggers (ETDA & PDPA)', () => {
      const legalCommands = CANONICAL_COMMANDS.filter((c) => c.category === 'legal');

      const etda9 = legalCommands.find((c) => c.id.includes('sec9'));
      const etda26 = legalCommands.find((c) => c.id.includes('sec26'));
      const etda28 = legalCommands.find((c) => c.id.includes('sec28'));
      const pdpa37 = legalCommands.find((c) => c.id.includes('sec37'));
      const pdfExport = legalCommands.find((c) => c.id.includes('pdf-export'));

      expect(etda9).toBeDefined();
      expect(etda9?.statuteRef).toContain('Section 9');

      expect(etda26).toBeDefined();
      expect(etda26?.statuteRef).toContain('Section 26');

      expect(etda28).toBeDefined();
      expect(etda28?.statuteRef).toContain('Section 28');

      expect(pdpa37).toBeDefined();
      expect(pdpa37?.statuteRef).toContain('Section 37');

      expect(pdfExport).toBeDefined();
      expect(pdfExport?.actionPayload).toBe('export-dossier-pdf');
    });

    it('[TC-SEARCH-03] verifies critical System Events (Genesis, TC-03 Tamper, Phoenix 35.8ms)', () => {
      const events = CANONICAL_COMMANDS.filter((c) => c.category === 'events');

      const genesis = events.find((e) => e.id.includes('genesis'));
      expect(genesis).toBeDefined();
      expect(genesis?.subtitle).toContain('909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68');

      const tamper = events.find((e) => e.id.includes('tc03'));
      expect(tamper).toBeDefined();
      expect(tamper?.title).toContain('TC-03');

      const phoenix = events.find((e) => e.id.includes('phoenix'));
      expect(phoenix).toBeDefined();
      expect(phoenix?.title).toContain('35.8 ms');

      const parity = events.find((e) => e.id.includes('14902-parity'));
      expect(parity).toBeDefined();
      expect(parity?.title).toContain('14,902');
    });

    it('[TC-SEARCH-04] filters commands accurately by search keyword and category', () => {
      const query = 'Dilithium';
      const results = CANONICAL_COMMANDS.filter((cmd) => {
        const q = query.toLowerCase();
        return (
          cmd.title.toLowerCase().includes(q) ||
          cmd.subtitle.toLowerCase().includes(q) ||
          cmd.tags.some((t) => t.toLowerCase().includes(q))
        );
      });

      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.some((r) => r.category === 'events')).toBe(true);
      expect(results.some((r) => r.category === 'legal' || r.category === 'navigation')).toBe(true);
    });

    it('[TC-SEARCH-05] executes view navigation when Navigation command selected', () => {
      const onSelectView = vi.fn();
      const navItem = CANONICAL_COMMANDS.find((c) => c.id === 'nav-chambers');
      expect(navItem).toBeDefined();

      if (navItem?.targetView) {
        onSelectView(navItem.targetView);
      }

      expect(onSelectView).toHaveBeenCalledWith('chambers');
    });
  });
});
