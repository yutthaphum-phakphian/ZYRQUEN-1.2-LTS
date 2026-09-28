import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  Layers,
  Activity,
  ShieldCheck,
  Scale,
  Clock,
  Fingerprint,
  ChevronRight,
  AlertTriangle,
  FileCheck2,
  Terminal,
  Cpu,
  Lock,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { ViewType } from '../../types';
import { FORENSIC_DOSSIER_V9, ForensicAuditStep } from '../../data/forensicAuditMasterDossierData';
import { playTone, playAuditChime } from '../AudioSynthesizer';

export type SearchCategoryFilter = 'all' | 'events' | 'forensics' | 'legal' | 'views';

export interface GlobalSearchItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: 'events' | 'forensics' | 'legal' | 'views';
  badge: string;
  badgeColor: string;
  icon: React.ComponentType<{ className?: string }>;
  tags: string[];
  action: () => void;
}

interface TopNavGlobalSearchBarProps {
  onSelectView: (view: ViewType) => void;
  onOpenForensicDossier?: () => void;
  onOpenEventsSidebar?: () => void;
  onOpenLegalSearch?: () => void;
  className?: string;
}

export const TopNavGlobalSearchBar: React.FC<TopNavGlobalSearchBarProps> = ({
  onSelectView,
  onOpenForensicDossier,
  onOpenEventsSidebar,
  onOpenLegalSearch,
  className = '',
}) => {
  const [query, setQuery] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<SearchCategoryFilter>('all');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Keyboard shortcut listener for Command+K / Ctrl+K / '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
        playTone(680, 0.04);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Build searchable database of system events, forensic audit logs, legal statutes, and views
  const allSearchableItems = useMemo<GlobalSearchItem[]>(() => {
    // 1. Forensic Audit Logs (16-Step Master Dossier)
    const forensicItems: GlobalSearchItem[] = FORENSIC_DOSSIER_V9.steps.map((step) => ({
      id: `forensic-step-${step.step}`,
      title: `Step #${step.step}: ${step.title}`,
      subtitle: `${step.statutoryStandard} • ${step.cryptographicScheme}`,
      description: `${step.description} | Merkle Hash: ${step.merkleHash.substring(0, 24)}... | Enclave: ${step.enclaveHardware}`,
      category: 'forensics',
      badge: step.eventType,
      badgeColor:
        step.eventType === 'VERIFIED'
          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
          : step.eventType === 'PENDING'
          ? 'bg-amber-950 text-amber-300 border-amber-500/40'
          : 'bg-rose-950 text-rose-300 border-rose-500/40',
      icon: ShieldCheck,
      tags: ['forensic', 'audit', 'step', step.eventType.toLowerCase(), step.statutoryStandard.toLowerCase(), step.cryptographicScheme.toLowerCase(), 'merkle', 'hash', 'pqc'],
      action: () => {
        playAuditChime();
        if (onOpenForensicDossier) onOpenForensicDossier();
        setIsOpen(false);
      },
    }));

    // 2. System Events & Telemetry
    const systemEventsList: GlobalSearchItem[] = [
      {
        id: 'sys-evt-1',
        title: 'Chamber 02 Quarantine Buffer Enclosure',
        subtitle: '80 Ephemeral Drift Traces Isolated (SSoT Protected)',
        description: 'Automatic fail-closed circuit engaged. Anomalous mutation drift quarantined in cold memory ring buffer within 35.8ms SLA.',
        category: 'events',
        badge: 'QUARANTINE',
        badgeColor: 'bg-rose-950 text-rose-300 border-rose-500/40',
        icon: AlertTriangle,
        tags: ['quarantine', 'buffer', 'chamber02', 'drift', 'isolation', 'system', 'event', 'alert'],
        action: () => {
          playTone(660, 0.05);
          if (onOpenEventsSidebar) onOpenEventsSidebar();
          setIsOpen(false);
        },
      },
      {
        id: 'sys-evt-2',
        title: 'Deca-Key 10/10 REAL_HSM Quorum Heartbeat',
        subtitle: 'Utimaco u.trust GP CSe-Series L4 Unanimous Pulse',
        description: 'Physical super-majority 10/10 verified across Bangkok, Virginia, Frankfurt, Tokyo, and London hardware nodes.',
        category: 'events',
        badge: 'QUORUM 10/10',
        badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-500/40',
        icon: Lock,
        tags: ['hsm', 'quorum', 'utimaco', 'deca-key', 'fips140', 'system', 'event'],
        action: () => {
          playTone(660, 0.05);
          onSelectView('vault');
          setIsOpen(false);
        },
      },
      {
        id: 'sys-evt-3',
        title: 'Sub-Kelvin Cryostat Thermodynamic Pulse (14.98 mK)',
        subtitle: 'Helium-4 Dilution Refrigerator Bus & Coherence 99.992%',
        description: 'Cryostat telemetry equilibrium verified. Entropy fluctuation dS = 0.0142 J/K (<< 0.0500 J/K threshold).',
        category: 'events',
        badge: '14.98 mK NOMINAL',
        badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-500/40',
        icon: Activity,
        tags: ['cryo', 'temperature', 'sub-kelvin', 'quantum', 'coherence', 'system', 'event'],
        action: () => {
          playTone(660, 0.05);
          onSelectView('quantum');
          setIsOpen(false);
        },
      },
      {
        id: 'sys-evt-4',
        title: 'Genesis Block #849202 Memory Write-Lock Verification',
        subtitle: 'WORM Enclave Lock (Mutation Authority = 0)',
        description: 'Immutable read-only execution active. All 14,902 canonical seals verified with bit-for-bit mathematical determinism.',
        category: 'events',
        badge: 'WORM LOCKED',
        badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-500/40',
        icon: Fingerprint,
        tags: ['genesis', 'block', 'worm', 'lock', 'immutable', 'system', 'event'],
        action: () => {
          playTone(660, 0.05);
          onSelectView('ledger');
          setIsOpen(false);
        },
      },
    ];

    // 3. Legal Statutes (ETDA & PDPA)
    const legalItems: GlobalSearchItem[] = FORENSIC_DOSSIER_V9.legalAlignments.map((leg, idx) => ({
      id: `legal-statute-${idx + 1}`,
      title: `${leg.section}: ${leg.title}`,
      subtitle: `${leg.lawName} • ${leg.complianceLevel}`,
      description: `${leg.mechanism} | Evidentiary Anchor: ${leg.evidence}`,
      category: 'legal',
      badge: leg.complianceLevel === '100% FULL COMPLIANCE' ? 'COMPLIANT' : 'SAFE HARBOR',
      badgeColor:
        leg.complianceLevel === '100% FULL COMPLIANCE'
          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
          : 'bg-cyan-950 text-cyan-300 border-cyan-500/40',
      icon: Scale,
      tags: ['legal', 'statute', 'etda', 'pdpa', 'section', leg.section.toLowerCase(), 'court', 'evidence', 'compliance'],
      action: () => {
        playTone(700, 0.04);
        if (onOpenLegalSearch) onOpenLegalSearch();
        else onSelectView('legal');
        setIsOpen(false);
      },
    }));

    // 4. System Views & Chambers
    const viewItems: GlobalSearchItem[] = [
      {
        id: 'view-dashboard',
        title: 'Executive Dashboard & Sovereign Headquarters',
        subtitle: 'Mainnet Live SSoT Δ0.00% • 14,902 Canonical Seals',
        description: 'Comprehensive operational HUD, real-time quantum telemetry, and high-performance animation controls.',
        category: 'views',
        badge: 'HQ',
        badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-500/40',
        icon: Layers,
        tags: ['dashboard', 'view', 'hq', 'home', 'mainnet'],
        action: () => {
          onSelectView('dashboard');
          setIsOpen(false);
        },
      },
      {
        id: 'view-chambers',
        title: '18 Sovereign Chambers Control Plane',
        subtitle: 'Chamber 00 Canonical Kernel to Chamber 17 Apex Matrix',
        description: 'Inspect individual chamber invariants, telemetry logs, and cryptographic verification status.',
        category: 'views',
        badge: '18 SSoT',
        badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-500/40',
        icon: Cpu,
        tags: ['chambers', 'view', '18', 'modules', 'matrix'],
        action: () => {
          onSelectView('chambers');
          setIsOpen(false);
        },
      },
      {
        id: 'view-ledger',
        title: 'Immutable WORM Audit Ledger',
        subtitle: '14,902 Active Evidence Seals (Zero Drift)',
        description: 'Full transactional record of all cryptographic seals and Merkle tree roots.',
        category: 'views',
        badge: '14.9K SEALS',
        badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-500/40',
        icon: FileCheck2,
        tags: ['ledger', 'view', 'seals', 'audit', 'worm'],
        action: () => {
          onSelectView('ledger');
          setIsOpen(false);
        },
      },
    ];

    return [...forensicItems, ...systemEventsList, ...legalItems, ...viewItems];
  }, [onOpenForensicDossier, onOpenEventsSidebar, onOpenLegalSearch, onSelectView]);

  // Filter items by search query and category
  const filteredResults = useMemo(() => {
    let items = allSearchableItems;

    if (activeCategory !== 'all') {
      items = items.filter((i) => i.category === activeCategory);
    }

    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 10);

    return items
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.tags.some((t) => t.includes(q))
      )
      .slice(0, 15);
  }, [allSearchableItems, activeCategory, query]);

  // Handle outside click to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
    playTone(500, 0.03);
  };

  const handleCategoryClick = (cat: SearchCategoryFilter) => {
    setActiveCategory(cat);
    playTone(620, 0.03);
    setSelectedIndex(0);
  };

  return (
    <div className={`relative flex-1 max-w-md min-w-[200px] ${className}`}>
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-cyan-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          id="global-top-search-bar"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Filter system events, forensic audit logs... (⌘K)"
          className="w-full pl-9 pr-16 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 focus:bg-slate-950 border border-cyan-500/30 focus:border-cyan-400 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 shadow-inner transition-all"
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {query ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono font-semibold rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/60 pointer-events-none">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* Real-Time Dropdown Results Palette */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl bg-[#080d18]/95 border border-cyan-500/40 shadow-2xl backdrop-blur-2xl font-mono overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[80vh] flex flex-col"
        >
          {/* Category Filter Pills Bar */}
          <div className="p-2 border-b border-zinc-800 bg-[#060a14] flex items-center gap-1.5 overflow-x-auto text-[10px]">
            <button
              type="button"
              onClick={() => handleCategoryClick('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              All Results
            </button>
            <button
              type="button"
              onClick={() => handleCategoryClick('events')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                activeCategory === 'events'
                  ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
                  : 'text-zinc-400 hover:text-rose-300 hover:bg-rose-950/20'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>System Events</span>
            </button>
            <button
              type="button"
              onClick={() => handleCategoryClick('forensics')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                activeCategory === 'forensics'
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                  : 'text-zinc-400 hover:text-emerald-300 hover:bg-emerald-950/20'
              }`}
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Forensic Audit Logs</span>
            </button>
            <button
              type="button"
              onClick={() => handleCategoryClick('legal')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                activeCategory === 'legal'
                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40'
                  : 'text-zinc-400 hover:text-cyan-300 hover:bg-cyan-950/20'
              }`}
            >
              <Scale className="w-3 h-3 text-cyan-400" />
              <span>Legal Standards</span>
            </button>
            <button
              type="button"
              onClick={() => handleCategoryClick('views')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                activeCategory === 'views'
                  ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40'
                  : 'text-zinc-400 hover:text-indigo-300 hover:bg-indigo-950/20'
              }`}
            >
              <Layers className="w-3 h-3 text-indigo-400" />
              <span>Views</span>
            </button>
          </div>

          {/* Results List */}
          <div className="p-2 space-y-1 overflow-y-auto max-h-[380px] custom-scrollbar">
            {filteredResults.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <Search className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-zinc-400 text-xs">No matching system events or forensic audit logs found</p>
                <p className="text-[10px] text-zinc-500">Try searching for "RFC 3161", "Dilithium", "Quorum", "Chamber 02", or "Section 28"</p>
              </div>
            ) : (
              filteredResults.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.action}
                    className="w-full text-left p-2.5 rounded-xl border border-transparent hover:border-cyan-500/40 bg-zinc-900/40 hover:bg-cyan-950/40 transition-all cursor-pointer flex items-start justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300 group-hover:text-cyan-300 group-hover:border-cyan-500/50 shrink-0 mt-0.5">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-zinc-100 group-hover:text-white truncate">
                            {item.title}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                        </div>
                        <div className="text-[10px] text-cyan-400 font-medium truncate mt-0.5">
                          {item.subtitle}
                        </div>
                        <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition shrink-0 mt-1" />
                  </button>
                );
              })
            )}
          </div>

          {/* Dropdown Footer Status */}
          <div className="p-2 border-t border-zinc-800 bg-[#060a14] flex items-center justify-between text-[10px] text-zinc-500 px-3">
            <span>Showing {filteredResults.length} live items</span>
            <span>Press <kbd className="px-1 py-0.2 rounded bg-zinc-800 text-zinc-400">ESC</kbd> to exit</span>
          </div>
        </div>
      )}
    </div>
  );
};
