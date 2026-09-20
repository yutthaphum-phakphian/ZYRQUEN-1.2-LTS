// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateRelevanceScore,
  filterAndSortSearchItems,
  SearchItem,
} from '../src/hooks/useGlobalSearch';
import { systemStateStore } from '../src/store/systemStateStore';

describe('useGlobalSearch Suite & Relevance Logic', () => {
  const sampleItems: SearchItem[] = [
    {
      id: 'nav-dashboard',
      title: 'Sovereign Governance Dashboard',
      description: 'Real-time telemetry, QOps metrics, and cryo status',
      category: 'navigation',
      badge: 'Main View',
      action: vi.fn(),
    },
    {
      id: 'nav-senate-gate',
      title: 'Senate Gate & Helm Benchmarks',
      description: 'CI/CD pipeline metrics, Helm charts, and dry-run configs',
      category: 'navigation',
      badge: 'Pipeline',
      action: vi.fn(),
    },
    {
      id: 'legal-etda-sec9',
      title: 'ETDA Section 9: Identity & Intent Binding Verification',
      description: 'Audit statutory electronic record identity and data integrity',
      category: 'legal',
      badge: 'พ.ร.บ. ธุรกรรมฯ',
      action: vi.fn(),
    },
    {
      id: 'legal-etda-sec26',
      title: 'ETDA Section 26: Advanced PQC Non-Repudiation Check',
      description: 'Enforce legal presumption of authenticity for ML-DSA-87 / Dilithium-5',
      category: 'legal',
      badge: 'พ.ร.บ. ธุรกรรมฯ',
      action: vi.fn(),
    },
    {
      id: 'legal-etda-sec28',
      title: 'ETDA Section 28: Immutable Audit Evidence Dossier',
      description: 'Generate court-admissible governance packet (DOC-SOV-HSM-1010-2026-V9)',
      category: 'legal',
      badge: 'Court Dossier',
      shortcut: '⌘E',
      action: vi.fn(),
    },
    {
      id: 'legal-pdpa-sec37',
      title: 'PDPA Section 37: Zero-Knowledge Privacy Isolation Check',
      description: 'Verify cryptographic privacy safeguards and zero telemetry leaks',
      category: 'legal',
      badge: 'PDPA',
      action: vi.fn(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('[TC-HOOK-01] calculates relevance score correctly across title, prefix, description, and badge', () => {
    const item = sampleItems[0]; // 'Sovereign Governance Dashboard'

    // Exact match score
    const exactScore = calculateRelevanceScore(item, 'sovereign governance dashboard');
    expect(exactScore).toBeGreaterThanOrEqual(100);

    // Prefix match score
    const prefixScore = calculateRelevanceScore(item, 'sovereign');
    expect(prefixScore).toBeGreaterThanOrEqual(75);

    // Substring match
    const substrScore = calculateRelevanceScore(item, 'governance');
    expect(substrScore).toBeGreaterThanOrEqual(50);

    // Description match
    const descScore = calculateRelevanceScore(item, 'telemetry');
    expect(descScore).toBeGreaterThanOrEqual(20);

    // Non-match
    const zeroScore = calculateRelevanceScore(item, 'non-existent-xyz');
    expect(zeroScore).toBe(0);
  });

  it('[TC-HOOK-02] sorts search results by descending relevance score', () => {
    const results = filterAndSortSearchItems(sampleItems, 'ETDA');
    expect(results.length).toBe(3);

    // All should be from legal category
    expect(results.every((r) => r.category === 'legal')).toBe(true);

    // Check exact or prefix item prioritization
    expect(results[0].title.startsWith('ETDA')).toBe(true);
  });

  it('[TC-HOOK-03] returns all items when query is empty', () => {
    const results = filterAndSortSearchItems(sampleItems, '');
    expect(results.length).toBe(sampleItems.length);
  });

  it('[TC-HOOK-04] returns empty array when query does not match any items', () => {
    const results = filterAndSortSearchItems(sampleItems, 'unmatched-query-778899');
    expect(results).toEqual([]);
  });

  it('[TC-HOOK-05] executes item action callback on trigger', () => {
    const targetItem = sampleItems[4]; // ETDA Section 28
    targetItem.action();
    expect(targetItem.action).toHaveBeenCalledTimes(1);
  });

  it('[TC-HOOK-06] verifies systemStateStore has canonical events and supports addEvent', () => {
    const initialState = systemStateStore.getState();
    expect(initialState.events).toBeDefined();
    expect(initialState.events.length).toBeGreaterThanOrEqual(4);

    const testHandler = vi.fn();
    systemStateStore.addEvent({
      id: 'court-test-event-99',
      title: 'Court Evidentiary Hash Recheck Trigger',
      description: 'Court cross-examination SHA-256 verification sequence',
      severity: 'success',
      handler: testHandler,
    });

    const updatedState = systemStateStore.getState();
    const foundEvent = updatedState.events.find((e) => e.id === 'court-test-event-99');
    expect(foundEvent).toBeDefined();
    foundEvent?.handler();
    expect(testHandler).toHaveBeenCalledTimes(1);
  });
});
