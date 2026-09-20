import { useMemo } from 'react';
import { useNavigate } from '../lib/router';
import { useSystemStateStore } from '../stores/systemStateStore';

export type SearchCategory = 'navigation' | 'system' | 'legal';

export interface SearchItem {
  id: string;
  title: string;
  description: string;
  category: SearchCategory;
  badge?: string;
  shortcut?: string;
  action: () => void;
}

export function calculateRelevanceScore(item: SearchItem, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const title = item.title.toLowerCase();
  const desc = item.description.toLowerCase();
  const cat = item.category.toLowerCase();
  const badge = item.badge?.toLowerCase() || '';

  let score = 0;

  if (title === q) score += 100;
  else if (title.startsWith(q)) score += 75;
  else if (title.includes(q)) score += 50;

  if (desc.includes(q)) score += 20;
  if (badge.includes(q)) score += 15;
  if (cat.includes(q)) score += 10;

  return score;
}

export function filterAndSortSearchItems(items: SearchItem[], query: string): SearchItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;

  return items
    .map((item) => ({ item, score: calculateRelevanceScore(item, q) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}

export function useGlobalSearch(query: string) {
  const navigate = useNavigate();
  const systemEvents = useSystemStateStore((state) => state.events || []);

  const aggregatedItems = useMemo<SearchItem[]>(() => {
    // 1. Navigation Routes
    const navItems: SearchItem[] = [
      {
        id: 'nav-dashboard',
        title: 'Sovereign Governance Dashboard',
        description: 'Real-time telemetry, QOps metrics, and cryo status',
        category: 'navigation',
        badge: 'Main View',
        action: () => navigate('/'),
      },
      {
        id: 'nav-senate-gate',
        title: 'Senate Gate & Helm Benchmarks',
        description: 'CI/CD pipeline metrics, Helm charts, and dry-run configs',
        category: 'navigation',
        badge: 'Pipeline',
        action: () => navigate('/senate-gate'),
      },
      {
        id: 'nav-codeql-audit',
        title: 'CodeQL Cryptographic Audit View',
        description: 'Smart contract vulnerability patches ZYR-01..05 status',
        category: 'navigation',
        badge: 'Security',
        action: () => navigate('/codeql-audit'),
      },
      {
        id: 'nav-chambers',
        title: 'Sovereign Chambers 18 Modules',
        description: 'Chambers 00 to 17 telemetry, coherence & cryostat health',
        category: 'navigation',
        badge: 'Chambers',
        action: () => navigate('/chambers'),
      },
      {
        id: 'nav-vault',
        title: 'Deca-Key Multi-Key Vault',
        description: 'PQC Deca-Key Council 10/10 REAL_HSM FIPS 140-3 L4 hardware keys',
        category: 'navigation',
        badge: 'Vault',
        action: () => navigate('/vault'),
      },
      {
        id: 'nav-ledger',
        title: 'WORM Immutable Audit Ledger V25',
        description: '14,902 Frozen Seals, Merkle DAG and zero-drift transaction ledger',
        category: 'navigation',
        badge: 'Ledger',
        action: () => navigate('/ledger'),
      },
      {
        id: 'nav-treasury',
        title: 'Sovereign Treasury & RWA Matrix',
        description: '฿4,230,000,000.00 THB + 14,902 oz Gold 99.99% + 400 RWA tenants',
        category: 'navigation',
        badge: 'Treasury',
        action: () => navigate('/sovereign-wallet'),
      },
    ];

    // 2. ETDA & PDPA Legal Triggers
    const legalItems: SearchItem[] = [
      {
        id: 'legal-forensic-master-dossier-v9',
        title: 'Forensic Audit Master Dossier (DOC-SOV-HSM-1010-2026-V9)',
        description: 'Sovereign Mathematical Truth & Court-Admissible Master Dossier under #EP-SOVEREIGN-01 (100% Pure Green, 14,902 Seals, Δ0.00%)',
        category: 'legal',
        badge: 'DOC-SOV-HSM-1010-2026-V9',
        shortcut: '⌘D',
        action: () => navigate('/legal/dossier-export'),
      },
      {
        id: 'legal-etda-sec9',
        title: 'ETDA Section 9: Identity & Intent Binding Verification',
        description: 'Audit statutory electronic record identity and data integrity',
        category: 'legal',
        badge: 'พ.ร.บ. ธุรกรรมฯ',
        action: () => navigate('/legal/etda-sec9'),
      },
      {
        id: 'legal-etda-sec26',
        title: 'ETDA Section 26: Advanced PQC Non-Repudiation Check',
        description: 'Enforce legal presumption of authenticity for ML-DSA-87 / Dilithium-5',
        category: 'legal',
        badge: 'พ.ร.บ. ธุรกรรมฯ',
        action: () => navigate('/legal/etda-sec26'),
      },
      {
        id: 'legal-etda-sec28',
        title: 'ETDA Section 28: Immutable Audit Evidence Dossier',
        description: 'Generate court-admissible governance packet (DOC-SOV-HSM-1010-2026-V9)',
        category: 'legal',
        badge: 'Court Dossier',
        shortcut: '⌘E',
        action: () => navigate('/legal/dossier-export'),
      },
      {
        id: 'legal-pdpa-sec37',
        title: 'PDPA Section 37: Zero-Knowledge Privacy Isolation Check',
        description: 'Verify cryptographic privacy safeguards and zero telemetry leaks',
        category: 'legal',
        badge: 'PDPA',
        action: () => navigate('/legal/pdpa-sec37'),
      },
    ];

    // 3. System Events from systemStateStore
    const sysItems: SearchItem[] = systemEvents.map((event) => ({
      id: `sys-${event.id}`,
      title: event.title,
      description: event.description,
      category: 'system' as SearchCategory,
      badge: (event.severity || 'INFO').toUpperCase(),
      action: () => {
        if (typeof event.handler === 'function') {
          event.handler();
        }
      },
    }));

    return [...navItems, ...legalItems, ...sysItems];
  }, [systemEvents, navigate]);

  // Relevance Sorting Logic
  const sortedResults = useMemo(() => {
    return filterAndSortSearchItems(aggregatedItems, query);
  }, [aggregatedItems, query]);

  return sortedResults;
}
