import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Scale,
  ShieldCheck,
  ExternalLink,
  BookOpen,
  Sparkles,
  X,
  Copy,
  CheckCircle2,
  FileText,
  AlertCircle,
  Globe,
  History,
  Tag,
  Trash2,
  Layers,
  FileCheck,
  Clock,
  ArrowRight,
  Play,
  RotateCcw,
  Edit3,
  Download,
  Loader2,
} from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { THAI_CUSTODIANS, SYSTEM_METADATA } from '../data/canonicalData';
import { ThaiLegalSovereignMapping } from './ThaiLegalSovereignMapping';
import { safeCopyToClipboard } from '../utils/clipboard';
import { generateDigitalEvidenceChecklistPdf } from '../utils/digitalEvidenceChecklistPdfExport';
import { INITIAL_CHECKLIST_ITEMS } from './DigitalEvidenceChecklistModal';
import { hapticModalDismiss, hapticTap } from '../utils/haptics';

interface ThaiLegalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearchExecuted?: (query: string, resultSummary: string) => void;
}

interface SearchResult {
  query: string;
  source: string;
  answer: string;
  citations: Array<{ title: string; uri: string }>;
  timestamp: string;
}

export interface RecentLegalQuery {
  id: string;
  query: string;
  timestamp: string;
  dateStr: string;
  category?: string;
}

const STORAGE_KEY = 'zyrquen_recent_legal_queries';
const LEGACY_STORAGE_KEY = 'zyrquen_recent_searches';
const MAX_RECENT_QUERIES = 10;

const PRESET_QUERIES = [
  {
    category: 'Electronic Signatures',
    title: 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ มาตรา 9, 26, 28 (ETDA Standard)',
    query: 'พระราชบัญญัติว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 มาตรา 9 มาตรา 26 มาตรา 28 ลายมือชื่อดิจิทัลที่เชื่อถือได้ มาตรฐาน ETDA',
  },
  {
    category: 'Thai Law',
    title: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA Thailand)',
    query: 'พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 PDPA Thailand ข้อกำหนดความมั่นคงปลอดภัยและการจัดเก็บข้อมูล',
  },
  {
    category: 'Cybersecurity',
    title: 'พ.ร.บ. ความมั่นคงปลอดภัยไซเบอร์ พ.ศ. 2562 (NCSA)',
    query: 'พ.ร.บ. การรักษาความมั่นคงปลอดภัยไซเบอร์ พ.ศ. 2562 โครงสร้างพื้นฐานสำคัญทางสารสนเทศ CII NCSA Thailand',
  },
  {
    category: 'Post-Quantum',
    title: 'NIST FIPS 203 / 204 / 205 PQC Standards',
    query: 'NIST Post-Quantum Cryptography standards FIPS 203 ML-KEM FIPS 204 ML-DSA FIPS 205 SLH-DSA Merkle ledger compliance',
  },
  {
    category: 'Custodian Registry',
    title: 'Thai Custodian Registry & Merkle Authority',
    query: 'Thai Sovereign Custodian Registry Passport EP-SOVEREIGN-01 นายยุทธภูมิ พากเพียร post-quantum Merkle governance',
  },
];

const DEFAULT_RECENT_SEARCHES: string[] = [
  'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ มาตรา 9 26 28 ETDA',
  'PDPA พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล 2562 มาตรา 37',
  'NIST FIPS 203 ML-KEM Post-Quantum Cryptography',
  'พ.ร.บ. ความมั่นคงปลอดภัยไซเบอร์ 2562 NCSA CII',
  'Thai Custodian Registry #EP-SOVEREIGN-01 นายยุทธภูมิ พากเพียร',
];

const formatRelativeTime = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Recently';
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 45) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Saved';
  }
};

/**
 * Helper to deduplicate array of queries case-insensitively and keep at most MAX_RECENT_QUERIES (10)
 */
export const sanitizeUniqueRecentQueries = (items: RecentLegalQuery[]): RecentLegalQuery[] => {
  const seen = new Set<string>();
  const uniqueList: RecentLegalQuery[] = [];

  for (const item of items) {
    const normalized = item.query.trim().toLowerCase();
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      uniqueList.push(item);
      if (uniqueList.length >= MAX_RECENT_QUERIES) break;
    }
  }

  return uniqueList;
};

/**
 * Retrieve unique array of last 10 search queries directly from window.localStorage
 */
export const loadRecentQueriesFromStorage = (): RecentLegalQuery[] => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_RECENT_SEARCHES.map((q, idx) => ({
      id: `default-${idx}`,
      query: q,
      timestamp: new Date().toISOString(),
      dateStr: 'Canonical Benchmark',
    }));
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const rawItems: RecentLegalQuery[] = parsed
          .map((item: any, idx: number): RecentLegalQuery | null => {
            if (typeof item === 'string') {
              return {
                id: `q-${idx}-${Date.now()}`,
                query: item.trim(),
                timestamp: new Date().toISOString(),
                dateStr: 'Saved in LocalStorage',
              };
            }
            if (item && typeof item.query === 'string') {
              return {
                id: item.id || `q-${idx}-${Date.now()}`,
                query: item.query.trim(),
                timestamp: item.timestamp || new Date().toISOString(),
                dateStr: item.dateStr || 'Saved in LocalStorage',
                category: item.category,
              };
            }
            return null;
          })
          .filter((item): item is RecentLegalQuery => Boolean(item && item.query.length > 0));

        const sanitized = sanitizeUniqueRecentQueries(rawItems);
        if (sanitized.length > 0) {
          return sanitized;
        }
      }
    }

    const legacySaved = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacySaved) {
      const legacyParsed = JSON.parse(legacySaved);
      if (Array.isArray(legacyParsed) && legacyParsed.length > 0) {
        const rawLegacy: RecentLegalQuery[] = legacyParsed
          .map((queryText: any, idx: number) => {
            const text = typeof queryText === 'string' ? queryText : queryText?.query || '';
            return {
              id: `legacy-${idx}-${Date.now()}`,
              query: text.trim(),
              timestamp: new Date().toISOString(),
              dateStr: 'Migrated from LocalStorage',
            };
          })
          .filter((item) => item.query.length > 0);

        const sanitized = sanitizeUniqueRecentQueries(rawLegacy);
        if (sanitized.length > 0) {
          return sanitized;
        }
      }
    }
  } catch (err) {
    console.error('Failed to load recent queries from window.localStorage:', err);
  }

  return DEFAULT_RECENT_SEARCHES.map((q, idx) => ({
    id: `default-${idx}`,
    query: q,
    timestamp: new Date().toISOString(),
    dateStr: 'Canonical Benchmark',
  }));
};

export const ThaiLegalSearchModal: React.FC<ThaiLegalSearchModalProps> = ({
  isOpen,
  onClose,
  onSearchExecuted,
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'mapping'>('search');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recentQueries, setRecentQueries] = useState<RecentLegalQuery[]>(loadRecentQueriesFromStorage);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleExportPdf = () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    playTone(540, 0.08);

    try {
      generateDigitalEvidenceChecklistPdf(INITIAL_CHECKLIST_ITEMS, {
        name: SYSTEM_METADATA.sovereignPrincipal,
        organization: 'Thai Sovereign Custodian Council & Digital Forensic Lab',
        inspectorId: '#EP-SOVEREIGN-01',
        inspectionDate: new Date().toISOString().split('T')[0],
        overallConclusion: 'PASSED',
      });
      playAuditChime();
      setNotificationMsg('ส่งออกเอกสารรายงาน Digital Evidence Checklist (PDF) สำเร็จเรียบร้อยแล้ว');
      setTimeout(() => setNotificationMsg(null), 4000);
    } catch (err) {
      console.error('Failed to export PDF report:', err);
      setErrorMsg('ไม่สามารถส่งออก PDF ได้ กรุณาลองใหม่อีกครั้ง');
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const [isInputFocused, setIsInputFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Close history dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsInputFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sync to local storage on changes
  const persistQueries = (updated: RecentLegalQuery[]) => {
    const sanitized = sanitizeUniqueRecentQueries(updated);
    setRecentQueries(sanitized);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
        window.localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(sanitized.map((u) => u.query)));
      } catch (err) {
        console.warn('window.localStorage error while saving recent queries:', err);
      }
    }
  };

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => {
      setNotificationMsg((prev) => (prev === msg ? null : prev));
    }, 2500);
  };

  const saveRecentSearch = (searchQuery: string, category?: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setRecentQueries((prev) => {
      const filtered = prev.filter((item) => item.query.trim().toLowerCase() !== trimmed.toLowerCase());
      const newEntry: RecentLegalQuery = {
        id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        query: trimmed,
        timestamp: new Date().toISOString(),
        dateStr: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        category,
      };
      const updated = sanitizeUniqueRecentQueries([newEntry, ...filtered]);
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          window.localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(updated.map((u) => u.query)));
        } catch {
          // ignore storage errors
        }
      }
      return updated;
    });
  };

  const removeSingleQuery = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playTone(400, 0.03);
    const updated = recentQueries.filter((item) => item.id !== id);
    persistQueries(updated);
    showNotification('Removed query from LocalStorage history');
  };

  const clearRecentSearches = () => {
    playTone(450, 0.04);
    persistQueries([]);
    showNotification('Cleared all recent queries from LocalStorage');
  };

  const handleUseInInput = (queryText: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playTone(520, 0.03);
    setQuery(queryText);
    if (inputRef.current) {
      inputRef.current.focus();
    }
    showNotification('Query copied to search field');
  };

  if (!isOpen) return null;

  const handleSearch = async (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q) return;

    saveRecentSearch(q);
    setIsLoading(true);
    setErrorMsg(null);
    setActiveTab('search');
    playTone(580, 0.05);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data: SearchResult = await res.json();
      setResult(data);
      if (onSearchExecuted) {
        onSearchExecuted(q, data.answer?.slice(0, 120) || 'Query completed via Google Search Oracle');
      }
      playAuditChime();
    } catch (err: any) {
      console.error('Search request error:', err);
      setErrorMsg('Failed to query search oracle. Reverting to local canonical registry citations.');
      // Local fallback
      const fallbackResult: SearchResult = {
        query: q,
        source: 'Canonical Thai Legal Knowledge Base (Local Oracle)',
        answer: `**สิทธิและกฎหมายอธิปไตยไทย (Thai Sovereign & Cryptographic Registry):**\n- พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 (แก้ไข 2562) มาตรา 9 (รับรองผลทางกฎหมาย), มาตรา 26 (มาตรฐานลายมือชื่อเชื่อถือได้สูงสุด), มาตรา 28 (ความรับผิดชอบของเจ้าของข้อมูล)\n- สอดคล้องกับ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) มาตรา 19, 27, 37\n- สอดคล้องกับ พ.ร.บ. ความมั่นคงปลอดภัยไซเบอร์ พ.ศ. 2562 (NCSA)\n- มาตรฐานเข้ารหัสพ้นควอนตัม NIST FIPS 203 (ML-KEM) และ FIPS 204 (ML-DSA)\n- ควบคุมโดยผู้ถือสิทธิ์ Sovereign Principal: นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)`,
        citations: [
          { title: 'สำนักงานพัฒนาธุรกรรมทางอิเล็กทรอนิกส์ (ETDA)', uri: 'https://www.etda.or.th' },
          { title: 'ราชกิจจานุเบกษาแห่งราชอาณาจักรไทย', uri: 'https://www.ratchakitcha.soc.go.th' },
        ],
        timestamp: new Date().toISOString(),
      };
      setResult(fallbackResult);
      if (onSearchExecuted) {
        onSearchExecuted(q, 'Grounded with Thai Sovereign PDPA/NCSA Canonical Oracle');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    const textToCopy = `ZYRQUEN Ω∞ LEGAL & CRYPTOGRAPHIC SEARCH REPORT\nQuery: ${result.query}\nSource: ${result.source}\nTimestamp: ${result.timestamp}\n\n${result.answer}\n\nCitations:\n${result.citations.map((c) => `- ${c.title}: ${c.uri}`).join('\n')}`;
    safeCopyToClipboard(textToCopy);
    setCopied(true);
    playTone(700, 0.05);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="thai-legal-search-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div id="thai-legal-search-modal-container" className="modal-slide-in relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl sm:rounded-[28px] bg-[#07080F] border border-white/15 shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden">
        {/* Header */}
        <div className="stagger-1 p-4 sm:p-6 bg-[#0a0f1e] border-b border-white/8 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-mono uppercase tracking-wider">
                  THAI LAWS ↔ CRYPTOGRAPHIC SEAL CHAIN
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-mono">
                  ETDA & ROYAL GAZETTE GROUNDING
                </span>
                <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20 text-[10px] font-mono flex items-center gap-1">
                  <History className="w-3 h-3 text-violet-400" />
                  <span>{recentQueries.length} Recent in LocalStorage</span>
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-mono text-white mt-1">
                Thai Legal Compliance & Sovereign Seal Chain Mapping
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ (มาตรา 9/26/28), PDPA, NCSA และ NIST Post-Quantum Standards
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="export-thai-legal-compliance-pdf-button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              title="ส่งออกเอกสารรายงาน Digital Evidence Checklist (PDF)"
              className={`px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 border ${
                isExportingPdf
                  ? 'bg-amber-500/20 text-amber-200 border-amber-500/40 animate-pulse'
                  : 'bg-[#261405] hover:bg-[#381e08] text-amber-300 border-amber-500/40 hover:border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
              }`}
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
              ) : (
                <Download className="w-4 h-4 text-amber-400" />
              )}
              <span className="hidden sm:inline">
                {isExportingPdf ? 'Exporting PDF...' : 'Export PDF Checklist'}
              </span>
              <span className="sm:hidden">PDF</span>
            </button>

            <button
              id="close-thai-legal-search-modal-button"
              onClick={() => {
                hapticModalDismiss();
                playTone(400, 0.05);
                onClose();
              }}
              className="p-2 sm:p-2.5 min-w-[44px] min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-all flex items-center justify-center cursor-pointer active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Mode Toggle Bar */}
        <div className="stagger-2 px-3 sm:px-6 py-2.5 bg-[#0a0c16] border-b border-white/8 flex items-center justify-between gap-2 sm:gap-3 font-mono text-xs flex-wrap">
          <div className="flex items-center gap-1.5 p-1 bg-black/50 rounded-xl border border-white/6 overflow-x-auto max-w-full">
            <button
              id="tab-toggle-search-oracle"
              onClick={() => {
                hapticTap();
                playTone(580, 0.03);
                setActiveTab('search');
              }}
              className={`px-3 sm:px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'search'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span>Live Search Oracle & History</span>
              {recentQueries.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-[10px] text-cyan-300 font-mono">
                  {recentQueries.length}
                </span>
              )}
            </button>

            <button
              id="tab-toggle-legal-mapping"
              onClick={() => {
                hapticTap();
                playTone(550, 0.03);
                setActiveTab('mapping');
              }}
              className={`px-3 sm:px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'mapping'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>มาตรา 9/26/28 Flow Diagram & Mapping</span>
            </button>
          </div>

          <span className="text-[11px] text-zinc-500 hidden sm:inline">
            Sovereign Principal Custodian: {SYSTEM_METADATA.sovereignPrincipal}
          </span>
        </div>

        {/* Tab 1: Section 9 / 26 / 28 Architecture Flow Diagram & Mapping */}
        {activeTab === 'mapping' ? (
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto">
            <ThaiLegalSovereignMapping />
          </div>
        ) : (
          /* Tab 2: Live Search Oracle */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search Input Bar */}
            <div className="p-5 sm:p-6 border-b border-white/8 bg-[#0b0e1a]/60 space-y-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setIsInputFocused(false);
                  handleSearch(query);
                }}
                className="relative flex items-center gap-2"
              >
                <div ref={searchContainerRef} className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 z-10" />
                  <input
                    ref={inputRef}
                    id="thai-legal-search-input"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                      setIsInputFocused(true);
                      setHighlightedIndex(-1);
                    }}
                    onKeyDown={(e) => {
                      if (!isInputFocused || recentQueries.length === 0) {
                        if (e.key === 'ArrowDown') {
                          setIsInputFocused(true);
                          setHighlightedIndex(0);
                          e.preventDefault();
                        }
                        return;
                      }

                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setHighlightedIndex((prev) => {
                          const next = prev < recentQueries.length - 1 ? prev + 1 : 0;
                          return next;
                        });
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setHighlightedIndex((prev) => {
                          const next = prev > 0 ? prev - 1 : recentQueries.length - 1;
                          return next;
                        });
                      } else if (e.key === 'Enter') {
                        if (highlightedIndex >= 0 && highlightedIndex < recentQueries.length) {
                          e.preventDefault();
                          const selected = recentQueries[highlightedIndex];
                          if (selected) {
                            setQuery(selected.query);
                            setIsInputFocused(false);
                            setHighlightedIndex(-1);
                            handleSearch(selected.query);
                          }
                        }
                      } else if (e.key === 'Escape') {
                        setIsInputFocused(false);
                        setHighlightedIndex(-1);
                      }
                    }}
                    placeholder="Search Thai laws, มาตรา 9/26/28, PDPA, NCSA, NIST FIPS 203 PQC..."
                    className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white/[0.04] border border-white/10 focus:border-cyan-500/50 focus:bg-white/[0.07] text-white font-mono text-xs sm:text-sm placeholder-zinc-500 focus:outline-none transition-all"
                    autoFocus
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery('');
                        if (inputRef.current) inputRef.current.focus();
                      }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 z-10"
                      title="Clear search text"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Clickable History Dropdown when input is focused */}
                  {isInputFocused && recentQueries.length > 0 && (
                    <div
                      id="search-recent-queries-focus-dropdown"
                      className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl bg-[#090b14] border border-cyan-500/30 shadow-[0_12px_40px_rgba(0,0,0,0.85)] backdrop-blur-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
                    >
                      <div className="px-4 py-2.5 bg-white/[0.03] border-b border-white/8 flex items-center justify-between text-[11px] font-mono">
                        <div className="flex items-center gap-1.5 text-violet-300 font-semibold">
                          <History className="w-3.5 h-3.5 text-violet-400" />
                          <span>Recent Search History (window.localStorage)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              clearRecentSearches();
                            }}
                            className="text-zinc-500 hover:text-rose-400 text-[10px] flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-rose-500/10"
                            title="Clear all stored search queries"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Clear History</span>
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setIsInputFocused(false);
                            }}
                            className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="max-h-64 overflow-y-auto divide-y divide-white/[0.04]">
                        {recentQueries.map((item, idx) => {
                          const isHighlighted = idx === highlightedIndex;
                          return (
                            <div
                              key={item.id}
                              className={`flex items-center justify-between gap-2 px-3.5 py-2.5 transition-colors group cursor-pointer ${
                                isHighlighted
                                  ? 'bg-cyan-500/20 text-white border-l-2 border-cyan-400 pl-3'
                                  : 'hover:bg-cyan-500/10'
                              }`}
                              onMouseEnter={() => setHighlightedIndex(idx)}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setQuery(item.query);
                                setIsInputFocused(false);
                                setHighlightedIndex(-1);
                                handleSearch(item.query);
                              }}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <History className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                                  isHighlighted ? 'text-cyan-400' : 'text-zinc-500 group-hover:text-cyan-400'
                                }`} />
                                <div className="min-w-0 flex-1">
                                  <p className={`text-xs font-mono truncate font-medium ${
                                    isHighlighted ? 'text-cyan-200' : 'text-zinc-200 group-hover:text-cyan-300'
                                  }`}>
                                    {item.query}
                                  </p>
                                  <p className="text-[10px] font-mono text-zinc-500">
                                    {formatRelativeTime(item.timestamp)} • {item.dateStr}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {isHighlighted && (
                                  <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-300 text-[9px] font-mono border border-cyan-400/30">
                                    ↵ Enter
                                  </span>
                                )}
                                <button
                                  type="button"
                                  title="Edit query into search bar"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleUseInInput(item.query);
                                  }}
                                  className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 min-w-[32px] min-h-[32px] rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-all text-[11px] font-mono flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
                                  <span className="hidden sm:inline text-[10px]">Edit</span>
                                </button>
                                <button
                                  type="button"
                                  title="Run search"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setQuery(item.query);
                                    setIsInputFocused(false);
                                    setHighlightedIndex(-1);
                                    handleSearch(item.query);
                                  }}
                                  className="px-2.5 py-1.5 min-h-[32px] rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-[10px] font-mono flex items-center gap-1 border border-cyan-500/20 group-hover:border-cyan-500/40 cursor-pointer active:scale-95"
                                >
                                  <Play className="w-2.5 h-2.5 fill-cyan-400/50" />
                                  <span>Search</span>
                                </button>
                                <button
                                  type="button"
                                  title="Delete query from history"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    removeSingleQuery(item.id);
                                  }}
                                  className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 min-w-[32px] min-h-[32px] text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all flex items-center justify-center cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="px-3.5 py-1.5 bg-black/40 border-t border-white/6 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                        <span className="flex items-center gap-1.5">
                          <span className="px-1 py-0.2 bg-white/10 rounded text-zinc-300">↑</span>
                          <span className="px-1 py-0.2 bg-white/10 rounded text-zinc-300">↓</span>
                          <span>to navigate,</span>
                          <span className="px-1 py-0.2 bg-white/10 rounded text-zinc-300">Enter</span>
                          <span>to select</span>
                        </span>
                        <span>Press ESC to close</span>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  id="execute-search-oracle-button"
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className="px-3.5 sm:px-5 py-3 min-h-[44px] rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all shrink-0 cursor-pointer active:scale-95"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span className="hidden sm:inline">Searching...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4" />
                      <span className="hidden sm:inline">Search Oracle</span>
                      <span className="sm:hidden">Search</span>
                    </>
                  )}
                </button>
              </form>

              {/* Notification Banner */}
              {notificationMsg && (
                <div className="py-1 px-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono text-xs flex items-center justify-between animate-in fade-in">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    {notificationMsg}
                  </span>
                  <span className="text-[10px] text-zinc-500">localStorage synced</span>
                </div>
              )}

              {/* Recent Queries Quick Tag Bar */}
              {recentQueries.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-violet-400" />
                      <span className="text-zinc-300 font-medium">Recent Queries (Quick Re-execute):</span>
                      <span className="text-zinc-500 text-[10px]">Click any query to execute instantly</span>
                    </span>
                    <button
                      onClick={clearRecentSearches}
                      className="text-[10px] text-zinc-500 hover:text-rose-400 flex items-center gap-1 transition-colors px-2 py-0.5 rounded hover:bg-rose-500/10"
                      title="Clear all stored search queries"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear All ({recentQueries.length})</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {recentQueries.slice(0, 10).map((item) => (
                      <div
                        key={item.id}
                        className="group flex items-center gap-1 px-2.5 py-1 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/25 hover:border-violet-500/50 text-[11px] font-mono text-violet-200 hover:text-white transition-all shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setQuery(item.query);
                            handleSearch(item.query);
                          }}
                          className="flex items-center gap-1.5 text-left truncate max-w-[220px] sm:max-w-xs"
                          title={`Re-execute query: "${item.query}" (${formatRelativeTime(item.timestamp)})`}
                        >
                          <Play className="w-2.5 h-2.5 text-violet-400 group-hover:text-cyan-300 shrink-0 fill-violet-400/50" />
                          <span className="truncate">{item.query}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleUseInInput(item.query, e)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-cyan-300 transition-opacity rounded"
                          title="Edit query in search bar"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => removeSingleQuery(item.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-rose-400 transition-opacity rounded"
                          title="Remove from LocalStorage"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Preset Benchmark Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3 text-cyan-400" />
                  <span>Curated Legal & Cryptographic Benchmarks:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_QUERIES.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setQuery(preset.query);
                        handleSearch(preset.query);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-cyan-500/15 border border-white/8 hover:border-cyan-500/30 text-[11px] font-mono text-zinc-300 hover:text-cyan-300 transition-all text-left flex items-center gap-1.5"
                    >
                      <Tag className="w-3 h-3 text-cyan-400" />
                      <span>{preset.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Search Results Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {isLoading && (
                <div className="py-16 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full border-3 border-cyan-500/20 border-t-cyan-400 animate-spin mx-auto" />
                  <div className="space-y-1">
                    <p className="font-mono text-sm text-cyan-300 font-semibold">
                      Querying Google Search Grounding & Legal Corpus...
                    </p>
                    <p className="font-mono text-xs text-zinc-500">
                      Grounding against Royal Gazette, NCSA, ETDA, and NIST PQC Repositories
                    </p>
                  </div>
                </div>
              )}

              {!isLoading && result && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  {/* Header Info */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
                    <div className="space-y-0.5">
                      <div className="text-zinc-400">
                        Query: <span className="text-cyan-300 font-semibold">"{result.query}"</span>
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        Source: <span className="text-emerald-400">{result.source}</span> • Verified at{' '}
                        {new Date(result.timestamp).toLocaleTimeString('th-TH')}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleExportPdf}
                        disabled={isExportingPdf}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-mono text-amber-300 hover:text-amber-200 flex items-center gap-1.5 transition-all"
                        title="Export Digital Evidence Checklist (PDF)"
                      >
                        {isExportingPdf ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                        ) : (
                          <Download className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span>{isExportingPdf ? 'Exporting...' : 'Export PDF'}</span>
                      </button>
                      <button
                        onClick={() => handleSearch(result.query)}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 text-xs font-mono text-cyan-300 hover:text-white flex items-center gap-1.5 transition-all"
                        title="Re-execute this query"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Re-run</span>
                      </button>
                      <button
                        onClick={copyToClipboard}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white flex items-center gap-1.5 transition-all"
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Report</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Answer Content */}
                  <div className="p-5 rounded-2xl bg-black/40 border border-white/8 text-zinc-200 font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap select-text">
                    {result.answer}
                  </div>

                  {/* Citations & Web Sources */}
                  {result.citations && result.citations.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                        <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                        Verified Authorities & Grounding Sources:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {result.citations.map((cite, idx) => (
                          <a
                            key={idx}
                            href={cite.uri}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="p-3 rounded-xl bg-white/[0.03] hover:bg-cyan-500/10 border border-white/8 hover:border-cyan-500/30 text-xs font-mono text-zinc-300 hover:text-cyan-300 flex items-center justify-between gap-2 transition-all group"
                          >
                            <span className="truncate">{cite.title}</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sovereign Authority Seal */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-cyan-500/10 border border-amber-500/20 flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                    <div className="text-[11px] font-mono text-zinc-300 leading-snug">
                      <span className="text-amber-300 font-semibold">
                        Sovereign Principal Custodian Clearance (#EP-SOVEREIGN-01):
                      </span>{' '}
                      Certified immutable under {SYSTEM_METADATA.name} • Merkle Root: {SYSTEM_METADATA.merkleRoot.slice(0, 16)}...
                    </div>
                  </div>
                </div>
              )}

              {/* Comprehensive Recent Queries Dashboard when idle or below results */}
              {!isLoading && !result && (
                <div className="space-y-6">
                  {/* Detailed Recent Queries Panel */}
                  <div className="p-5 rounded-2xl bg-[#090b14] border border-white/10 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300">
                          <History className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-mono text-sm font-semibold text-white flex items-center gap-2">
                            <span>Recent Legal Queries</span>
                            <span className="px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-[10px] text-violet-300 font-mono">
                              LocalStorage Persistence
                            </span>
                          </h3>
                          <p className="font-mono text-xs text-zinc-400">
                            Saved past legal searches and benchmarks. Click to re-run immediately.
                          </p>
                        </div>
                      </div>

                      {recentQueries.length > 0 && (
                        <button
                          onClick={clearRecentSearches}
                          className="px-3 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-mono flex items-center gap-1.5 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Clear History</span>
                        </button>
                      )}
                    </div>

                    {recentQueries.length === 0 ? (
                      <div className="py-8 text-center space-y-2 border border-dashed border-white/10 rounded-xl bg-black/20">
                        <History className="w-6 h-6 text-zinc-600 mx-auto" />
                        <p className="text-xs font-mono text-zinc-400">No past search queries saved in local storage.</p>
                        <p className="text-[11px] font-mono text-zinc-500">Execute any query or preset to build your recent search history.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {recentQueries.map((item, index) => (
                          <div
                            key={item.id}
                            className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/6 hover:border-violet-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                          >
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <span className="mt-0.5 px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-mono text-zinc-400 shrink-0">
                                #{index + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div
                                  onClick={() => {
                                    setQuery(item.query);
                                    handleSearch(item.query);
                                  }}
                                  className="text-xs sm:text-sm font-mono text-zinc-200 group-hover:text-cyan-300 cursor-pointer font-medium hover:underline truncate"
                                  title={`Click to search: "${item.query}"`}
                                >
                                  {item.query}
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-zinc-500">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-zinc-500" />
                                    {formatRelativeTime(item.timestamp)}
                                  </span>
                                  <span>•</span>
                                  <span>{item.dateStr}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <button
                                onClick={() => handleUseInInput(item.query)}
                                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-mono flex items-center gap-1 transition-all"
                                title="Edit query in search box"
                              >
                                <Edit3 className="w-3 h-3 text-zinc-400" />
                                <span className="hidden sm:inline">Edit</span>
                              </button>
                              <button
                                onClick={() => {
                                  setQuery(item.query);
                                  handleSearch(item.query);
                                }}
                                className="px-3 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 hover:text-white text-xs font-mono font-medium flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                                title="Re-execute query now"
                              >
                                <Play className="w-3 h-3 text-cyan-400 fill-cyan-400/50" />
                                <span>Re-execute</span>
                              </button>
                              <button
                                onClick={(e) => removeSingleQuery(item.id, e)}
                                className="p-1 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                                title="Delete this query from history"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Empty state intro description */}
                  <div className="py-6 text-center space-y-2 font-mono border-t border-white/8">
                    <p className="text-xs text-zinc-400 font-medium">
                      Select any legal benchmark or past query above to search grounded Thai statutes
                    </p>
                    <p className="text-[11px] text-zinc-600 max-w-lg mx-auto">
                      Real-time legal search retrieves live statutory citations for Thai Electronic Transactions Act (Section 9, 26, 28), Personal Data Protection Act (PDPA), Cyber Security Framework (NCSA), and NIST Post-Quantum Cryptography standards.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Bar info */}
            <div className="px-6 py-2.5 bg-[#0a0c16]/95 border-t border-white/8 flex items-center justify-between text-[11px] font-mono text-zinc-400 flex-wrap gap-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>PDPA & ETDA Legal Grounding Engine</span>
              </span>
              <span className="text-zinc-500">
                {recentQueries.length} {recentQueries.length === 1 ? 'query' : 'queries'} stored locally in browser storage
              </span>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 bg-black/60 border-t border-white/8 flex items-center justify-between text-[11px] font-mono text-zinc-500">
          <span>Thailand Jurisdiction • Royal Gazette, ETDA & NIST Compliance</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-all"
          >
            Close Search
          </button>
        </div>
      </div>
    </div>
  );
};

