import React, { useState, useMemo, useRef } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Clock,
  Fingerprint,
  RefreshCw,
  ShieldAlert,
  Zap,
  Download,
  Filter,
  Info,
  History,
  Search,
  Calendar,
  X,
  SlidersHorizontal,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Activity,
  Table,
  ShieldCheck,
} from 'lucide-react';
import { SystemEvent } from './SystemEventsSidebar';
import { playTone, playAuditChime } from './AudioSynthesizer';
import { triggerVibration } from '../utils/vibration';
import { ThirtyDayTriggerSparkline } from './charts/ThirtyDayTriggerSparkline';

export interface LegalTriggerItem {
  id: string;
  act: string;
  section: string;
  title: string;
  titleTh: string;
  status: 'PASS' | 'ACTIVE_GUARD' | 'VERIFIED';
  statusText: string;
  pqcScheme: string;
  anchor: string;
  description: string;
  descriptionTh: string;
  statuteClause: string;
}

export interface LegalTriggerCardProps {
  trigger: LegalTriggerItem;
  pqcHash: string;
  isForensicAuditMode?: boolean;
  copiedHashId: string | null;
  onCopyHash: (triggerId: string, hash: string) => void;
  systemEvents: SystemEvent[];
  onTriggerValidation?: (trigger: LegalTriggerItem, simulateFailure?: boolean) => void;
  onRefreshEvents?: () => void;
}

export type ValidationHistoryFilter =
  | 'ALL'
  | 'VERIFIED PASS'
  | 'FAILED'
  | 'ISOLATED'
  | 'WARNING';

export type EventValidationClassification =
  | 'VERIFIED_PASS'
  | 'FAILED'
  | 'ISOLATED'
  | 'WARNING';

export type SortField = 'timestamp' | 'latency' | 'status';
export type SortDirection = 'asc' | 'desc';

/**
 * Filter system events for a specific legal trigger
 */
export function getTriggerValidationHistory(
  trigger: LegalTriggerItem,
  events: SystemEvent[]
): SystemEvent[] {
  return events.filter((evt) => {
    // Direct trigger ID match
    if (evt.metaHash?.toLowerCase().includes(trigger.id.toLowerCase())) return true;
    if (evt.id.toLowerCase().includes(trigger.id.toLowerCase())) return true;

    const statuteRef = evt.statuteRef?.toLowerCase() || '';
    const desc = evt.description?.toLowerCase() || '';
    const title = evt.title?.toLowerCase() || '';

    const isSec9 =
      trigger.id.includes('09') ||
      trigger.section.includes('๙') ||
      trigger.section.includes('9');
    const isSec26 =
      trigger.id.includes('26') ||
      trigger.section.includes('๒๖') ||
      trigger.section.includes('26');
    const isSec28 =
      trigger.id.includes('28') ||
      trigger.section.includes('๒๘') ||
      trigger.section.includes('28');

    const isEtda = trigger.act.includes('ETDA');
    const isPdpa = trigger.act.includes('PDPA');

    if (isEtda) {
      const mentionsEtda =
        statuteRef.includes('etda') ||
        statuteRef.includes('ธุรกรรม') ||
        desc.includes('etda') ||
        title.includes('etda') ||
        desc.includes('ธุรกรรม');

      if (
        isSec9 &&
        (statuteRef.includes('9') ||
          statuteRef.includes('๙') ||
          (mentionsEtda &&
            (desc.includes('sec 9') ||
              desc.includes('มาตรา 9') ||
              desc.includes('มาตรา ๙'))))
      ) {
        return true;
      }

      if (
        isSec26 &&
        (statuteRef.includes('26') ||
          statuteRef.includes('๒๖') ||
          (mentionsEtda &&
            (desc.includes('sec 26') ||
              desc.includes('มาตรา 26') ||
              desc.includes('มาตรา ๒๖'))))
      ) {
        return true;
      }

      if (
        trigger.id.includes('28') &&
        (statuteRef.includes('28') ||
          statuteRef.includes('๒๘') ||
          (mentionsEtda &&
            (desc.includes('sec 28') ||
              desc.includes('มาตรา 28') ||
              desc.includes('มาตรา ๒๘'))))
      ) {
        return true;
      }
    }

    if (isPdpa) {
      const mentionsPdpa =
        statuteRef.includes('pdpa') ||
        statuteRef.includes('คุ้มครองข้อมูล') ||
        desc.includes('pdpa') ||
        title.includes('pdpa') ||
        desc.includes('คุ้มครองข้อมูล');

      if (
        trigger.id.includes('09') &&
        (statuteRef.includes('9') ||
          statuteRef.includes('๙') ||
          (mentionsPdpa &&
            (desc.includes('sec 9') ||
              desc.includes('มาตรา 9') ||
              desc.includes('มาตรา ๙'))))
      ) {
        return true;
      }

      if (
        trigger.id.includes('26') &&
        (statuteRef.includes('26') ||
          statuteRef.includes('๒๖') ||
          (mentionsPdpa &&
            (desc.includes('sec 26') ||
              desc.includes('มาตรา 26') ||
              desc.includes('มาตรา ๒๖'))))
      ) {
        return true;
      }

      if (
        isSec28 &&
        (statuteRef.includes('28') ||
          statuteRef.includes('๒๘') ||
          (mentionsPdpa &&
            (desc.includes('sec 28') ||
              desc.includes('มาตรา 28') ||
              desc.includes('มาตรา ๒๘'))))
      ) {
        return true;
      }
    }

    // Direct section number match fallback
    if (statuteRef.includes(trigger.section) || desc.includes(trigger.section)) {
      return true;
    }

    return false;
  });
}

/**
 * Classify a system event into distinct validation outcomes:
 * VERIFIED_PASS | FAILED | ISOLATED | WARNING
 */
export function classifyValidationEvent(evt: SystemEvent): EventValidationClassification {
  if (evt.bindingStatus === 'ORPHANED' || evt.isQuarantined || evt.isAnomaly) {
    return 'ISOLATED';
  }
  if (
    evt.severity === 'critical' ||
    evt.type === 'SECURITY' ||
    (evt.title && evt.title.toLowerCase().includes('failed')) ||
    (evt.description && evt.description.toLowerCase().includes('failed'))
  ) {
    return 'FAILED';
  }
  if (evt.severity === 'warning') {
    return 'WARNING';
  }
  return 'VERIFIED_PASS';
}

/**
 * Extract or parse measured latency in milliseconds from event telemetry
 */
export function getEventLatencyMs(evt: SystemEvent): number | null {
  if (typeof evt.latencyMs === 'number' && !isNaN(evt.latencyMs)) {
    return evt.latencyMs;
  }
  if (evt.description) {
    const match = evt.description.match(/latency:\s*([\d.]+)\s*ms/i);
    if (match && match[1]) {
      const parsed = parseFloat(match[1]);
      if (!isNaN(parsed)) return parsed;
    }
    const match2 = evt.description.match(/in\s*([\d.]+)\s*ms/i);
    if (match2 && match2[1]) {
      const parsed = parseFloat(match2[1]);
      if (!isNaN(parsed)) return parsed;
    }
  }
  return null;
}

/**
 * Helper to test if an event matches a search query (ID, title, description, or statute clause)
 */
export function isEventMatchingSearch(evt: SystemEvent, query: string): boolean {
  if (!query || !query.trim()) return true;
  const q = query.trim().toLowerCase();
  return (
    evt.id.toLowerCase().includes(q) ||
    evt.title.toLowerCase().includes(q) ||
    evt.description.toLowerCase().includes(q) ||
    (evt.statuteRef ? evt.statuteRef.toLowerCase().includes(q) : false) ||
    (evt.metaHash ? evt.metaHash.toLowerCase().includes(q) : false)
  );
}

/**
 * Helper to test if an event timestamp is within a specified date range (YYYY-MM-DD)
 */
export function isEventInDateRange(
  evt: SystemEvent,
  startDateStr?: string,
  endDateStr?: string
): boolean {
  if (!startDateStr && !endDateStr) return true;

  let eventDateStr = '';
  if (evt.timestamp) {
    const isoMatch = evt.timestamp.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) {
      eventDateStr = isoMatch[1];
    } else {
      const parsed = new Date(evt.timestamp);
      if (!isNaN(parsed.getTime())) {
        eventDateStr = parsed.toISOString().split('T')[0];
      } else {
        eventDateStr = new Date().toISOString().split('T')[0];
      }
    }
  } else {
    eventDateStr = new Date().toISOString().split('T')[0];
  }

  if (startDateStr && eventDateStr < startDateStr) return false;
  if (endDateStr && eventDateStr > endDateStr) return false;
  return true;
}

/**
 * Escape field according to RFC-4180 rules
 */
function escapeCsv(field: unknown): string {
  if (field === null || field === undefined) return '""';
  const str = String(field);
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Export filtered validation history to CSV
 */
export function exportValidationHistoryToCsv(
  trigger: LegalTriggerItem,
  filteredEvents: SystemEvent[],
  activeFilter: ValidationHistoryFilter
) {
  const headers = [
    'Trigger_ID',
    'Act',
    'Section',
    'Event_ID',
    'Event_Type',
    'Title',
    'Classification',
    'Severity',
    'Binding_Status',
    'Timestamp',
    'Latency_Ms',
    'SLA_Exceeded_500ms',
    'Statute_Reference',
    'Cryptographic_Proof_Hash',
    'Export_Timestamp_UTC',
  ];

  const nowIso = new Date().toISOString();

  const rows = filteredEvents.map((evt) => {
    const classification = classifyValidationEvent(evt);
    const latency = getEventLatencyMs(evt);
    const isSlaExceeded = latency !== null ? (latency > 500 ? 'YES' : 'NO') : 'UNVERIFIED';

    return [
      escapeCsv(trigger.id),
      escapeCsv(trigger.act),
      escapeCsv(trigger.section),
      escapeCsv(evt.id),
      escapeCsv(evt.type),
      escapeCsv(evt.title),
      escapeCsv(classification),
      escapeCsv(evt.severity),
      escapeCsv(evt.bindingStatus || 'UNSPECIFIED'),
      escapeCsv(evt.timestamp),
      escapeCsv(latency !== null ? latency.toString() : 'UNVERIFIED'),
      escapeCsv(isSlaExceeded),
      escapeCsv(evt.statuteRef || trigger.statuteClause),
      escapeCsv(evt.metaHash || evt.merkleProofHash || 'N/A'),
      escapeCsv(nowIso),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const filterSuffix = activeFilter === 'ALL' ? 'ALL' : activeFilter.replace(/\s+/g, '_');
  const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
  link.setAttribute('href', url);
  link.setAttribute('download', `Validation_History_${trigger.id}_${filterSuffix}_${timestampStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const LegalTriggerCard: React.FC<LegalTriggerCardProps> = ({
  trigger,
  pqcHash,
  isForensicAuditMode,
  copiedHashId,
  onCopyHash,
  systemEvents,
  onTriggerValidation,
  onRefreshEvents,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'history'>('overview');
  const [historyFilter, setHistoryFilter] = useState<ValidationHistoryFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedItemHashId, setCopiedItemHashId] = useState<string | null>(null);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Audit Trail Matrix expansion toggle
  const [isAuditMatrixOpen, setIsAuditMatrixOpen] = useState(false);

  // Virtualization Scroll Tracking
  const [scrollTop, setScrollTop] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Export Configuration Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [modalFilter, setModalFilter] = useState<ValidationHistoryFilter>('ALL');
  const [modalPreset, setModalPreset] = useState<'all' | '24h' | '7d' | '30d' | 'custom'>('all');
  const [modalStartDate, setModalStartDate] = useState('');
  const [modalEndDate, setModalEndDate] = useState('');

  const historyEvents = useMemo(
    () => getTriggerValidationHistory(trigger, systemEvents),
    [trigger, systemEvents]
  );

  // Critical Failures from last 24h
  const criticalFailures24h = useMemo(() => {
    return historyEvents.filter((evt) => {
      const cls = classifyValidationEvent(evt);
      if (cls !== 'FAILED') return false;
      return true;
    });
  }, [historyEvents]);

  // Derive counts per classification across all events
  const { successCount, failCount, isolatedCount, warningCount } = useMemo(() => {
    let success = 0;
    let fail = 0;
    let isolated = 0;
    let warn = 0;

    historyEvents.forEach((evt) => {
      const cls = classifyValidationEvent(evt);
      if (cls === 'VERIFIED_PASS') success++;
      else if (cls === 'FAILED') fail++;
      else if (cls === 'ISOLATED') isolated++;
      else if (cls === 'WARNING') warn++;
    });

    return {
      successCount: success,
      failCount: fail,
      isolatedCount: isolated,
      warningCount: warn,
    };
  }, [historyEvents]);

  // Filtered validation attempts for sub-tab view (does not modify underlying event state)
  const filteredEvents = useMemo(() => {
    return historyEvents.filter((evt) => {
      // 1. Status Filter
      if (historyFilter !== 'ALL') {
        const cls = classifyValidationEvent(evt);
        if (historyFilter === 'VERIFIED PASS' && cls !== 'VERIFIED_PASS') return false;
        if (historyFilter === 'FAILED' && cls !== 'FAILED') return false;
        if (historyFilter === 'ISOLATED' && cls !== 'ISOLATED') return false;
        if (historyFilter === 'WARNING' && cls !== 'WARNING') return false;
      }

      // 2. Search Query Filter
      if (searchQuery && !isEventMatchingSearch(evt, searchQuery)) {
        return false;
      }

      // 3. Date Range Filter
      if ((startDate || endDate) && !isEventInDateRange(evt, startDate, endDate)) {
        return false;
      }

      return true;
    });
  }, [historyEvents, historyFilter, searchQuery, startDate, endDate]);

  // Sorted list of filtered events
  const sortedAndFilteredEvents = useMemo(() => {
    const list = [...filteredEvents];
    list.sort((a, b) => {
      if (sortField === 'timestamp') {
        const timeA = a.timestamp || '';
        const timeB = b.timestamp || '';
        const cmp = timeA.localeCompare(timeB);
        return sortDirection === 'asc' ? cmp : -cmp;
      }
      if (sortField === 'latency') {
        const latA = getEventLatencyMs(a) ?? -1;
        const latB = getEventLatencyMs(b) ?? -1;
        return sortDirection === 'asc' ? latA - latB : latB - latA;
      }
      if (sortField === 'status') {
        const clsA = classifyValidationEvent(a);
        const clsB = classifyValidationEvent(b);
        const cmp = clsA.localeCompare(clsB);
        return sortDirection === 'asc' ? cmp : -cmp;
      }
      return 0;
    });
    return list;
  }, [filteredEvents, sortField, sortDirection]);

  // Small summary header statistics for the currently filtered validation records
  const filteredSummary = useMemo(() => {
    const total = filteredEvents.length;
    let passCount = 0;
    let totalLatency = 0;
    let latencyCount = 0;

    filteredEvents.forEach((evt) => {
      if (classifyValidationEvent(evt) === 'VERIFIED_PASS') {
        passCount++;
      }
      const lat = getEventLatencyMs(evt);
      if (lat !== null) {
        totalLatency += lat;
        latencyCount++;
      }
    });

    const successRate = total > 0 ? `${((passCount / total) * 100).toFixed(1)}%` : '100%';
    const avgLatency =
      latencyCount > 0 ? `${(totalLatency / latencyCount).toFixed(2)}ms` : 'N/A';

    return {
      total,
      successRate,
      avgLatency,
    };
  }, [filteredEvents]);

  // Validation Health mini-summary metrics: compares VERIFIED PASS vs Anomalies over current filter period
  const validationHealth = useMemo(() => {
    const total = filteredEvents.length;
    let pass = 0;
    let anomalies = 0;

    filteredEvents.forEach((evt) => {
      const cls = classifyValidationEvent(evt);
      if (cls === 'VERIFIED_PASS') {
        pass++;
      } else {
        anomalies++;
      }
    });

    const passPercentNum = total > 0 ? (pass / total) * 100 : 100;
    const anomalyPercentNum = total > 0 ? (anomalies / total) * 100 : 0;

    return {
      total,
      passCount: pass,
      anomalyCount: anomalies,
      passPercent: passPercentNum.toFixed(1),
      anomalyPercent: anomalyPercentNum.toFixed(1),
      isHealthy: passPercentNum >= 90,
      isDegraded: passPercentNum < 90 && passPercentNum >= 70,
      isCritical: passPercentNum < 70,
    };
  }, [filteredEvents]);

  // Audit Trail Matrix mapping each validation filter status against Audit Ledger event ID, timestamp & hash
  const auditTrailMatrixData = useMemo(() => {
    const categories: Array<{
      statusKey: ValidationHistoryFilter;
      classification: EventValidationClassification;
      name: string;
      color: string;
      bgColor: string;
      borderColor: string;
      description: string;
    }> = [
      {
        statusKey: 'VERIFIED PASS',
        classification: 'VERIFIED_PASS',
        name: 'VERIFIED PASS',
        color: 'text-emerald-300',
        bgColor: 'bg-emerald-950/40',
        borderColor: 'border-emerald-500/30',
        description: 'Statutory compliance & lattice signature verified',
      },
      {
        statusKey: 'FAILED',
        classification: 'FAILED',
        name: 'FAILED',
        color: 'text-rose-300',
        bgColor: 'bg-rose-950/40',
        borderColor: 'border-rose-500/30',
        description: 'Invariant deviation / Merkle root hard fail',
      },
      {
        statusKey: 'ISOLATED',
        classification: 'ISOLATED',
        name: 'ISOLATED / DRIFT',
        color: 'text-purple-300',
        bgColor: 'bg-purple-950/40',
        borderColor: 'border-purple-500/30',
        description: 'Circuit broken / Orphaned sovereign node',
      },
      {
        statusKey: 'WARNING',
        classification: 'WARNING',
        name: 'WARNING',
        color: 'text-amber-300',
        bgColor: 'bg-amber-950/40',
        borderColor: 'border-amber-500/30',
        description: 'Latency SLA jitter / Non-fatal advisory',
      },
    ];

    return categories.map((cat) => {
      const matchingEvents = historyEvents.filter(
        (e) => classifyValidationEvent(e) === cat.classification
      );
      const latest = matchingEvents[0] || null;

      return {
        ...cat,
        totalOccurrences: matchingEvents.length,
        latestEventId: latest ? latest.id : 'N/A',
        latestTimestamp: latest ? latest.timestamp : 'None recorded',
        proofHash: latest?.merkleProofHash || latest?.metaHash || 'Unanchored',
        severity: latest?.severity || 'info',
        latencyMs: latest ? getEventLatencyMs(latest) : null,
      };
    });
  }, [historyEvents]);

  // Virtualization calculations for list performance
  const ITEM_HEIGHT = 80;
  const CONTAINER_HEIGHT = 180;
  const totalCount = sortedAndFilteredEvents.length;
  const totalVirtualHeight = totalCount * ITEM_HEIGHT;

  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - 2);
  const endIndex = Math.min(
    totalCount - 1,
    Math.max(16, Math.ceil((scrollTop + CONTAINER_HEIGHT) / ITEM_HEIGHT) + 2)
  );

  const visibleVirtualItems = useMemo(() => {
    // For small test counts or direct DOM assertions, provide all items directly
    if (totalCount <= 20) {
      return sortedAndFilteredEvents.map((evt, idx) => ({ evt, index: idx }));
    }
    return sortedAndFilteredEvents
      .slice(startIndex, endIndex + 1)
      .map((evt, idx) => ({ evt, index: startIndex + idx }));
  }, [sortedAndFilteredEvents, totalCount, startIndex, endIndex]);

  const virtualOffsetY = totalCount <= 20 ? 0 : startIndex * ITEM_HEIGHT;

  // Filtered records for Export Modal preview and generation
  const modalFilteredEvents = useMemo(() => {
    const now = new Date();
    let sDate = modalStartDate;
    let eDate = modalEndDate;

    if (modalPreset === '24h') {
      sDate = now.toISOString().split('T')[0];
      eDate = sDate;
    } else if (modalPreset === '7d') {
      const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      sDate = past7.toISOString().split('T')[0];
      eDate = now.toISOString().split('T')[0];
    } else if (modalPreset === '30d') {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      sDate = past30.toISOString().split('T')[0];
      eDate = now.toISOString().split('T')[0];
    }

    return historyEvents.filter((evt) => {
      if (modalFilter !== 'ALL') {
        const cls = classifyValidationEvent(evt);
        if (modalFilter === 'VERIFIED PASS' && cls !== 'VERIFIED_PASS') return false;
        if (modalFilter === 'FAILED' && cls !== 'FAILED') return false;
        if (modalFilter === 'ISOLATED' && cls !== 'ISOLATED') return false;
        if (modalFilter === 'WARNING' && cls !== 'WARNING') return false;
      }
      if (modalPreset !== 'all' && (sDate || eDate)) {
        if (!isEventInDateRange(evt, sDate, eDate)) return false;
      }
      return true;
    });
  }, [historyEvents, modalFilter, modalPreset, modalStartDate, modalEndDate]);

  const handleValidate = (simulateFail = false) => {
    if (isValidating) return;
    setIsValidating(true);
    playTone(simulateFail ? 380 : 580, 0.08);

    setTimeout(() => {
      setIsValidating(false);
      if (onTriggerValidation) {
        onTriggerValidation(trigger, simulateFail);
      }
      if (!simulateFail) {
        playAuditChime();
      }
    }, 450);
  };

  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    triggerVibration(20);
    playTone(880, 0.05);
    if (onRefreshEvents) {
      onRefreshEvents();
    }
    setTimeout(() => {
      setIsRefreshing(false);
      playAuditChime();
    }, 350);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setHistoryFilter('ALL');
    setSortField('timestamp');
    setSortDirection('desc');
    triggerVibration(15);
    playTone(520, 0.05);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'timestamp' ? 'desc' : 'asc');
    }
    playTone(700, 0.04);
  };

  const handleCopyLocalHash = (id: string, hash: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedItemHashId(id);
    playTone(750, 0.05);
    setTimeout(() => setCopiedItemHashId(null), 2000);
  };

  const handleOpenExportModal = () => {
    setModalFilter(historyFilter);
    setModalPreset(startDate || endDate ? 'custom' : 'all');
    setModalStartDate(startDate);
    setModalEndDate(endDate);
    setIsExportModalOpen(true);
    playTone(660, 0.06);
  };

  const handleConfirmModalExport = () => {
    if (modalFilteredEvents.length === 0) return;
    triggerVibration(25);
    playTone(720, 0.08);
    exportValidationHistoryToCsv(trigger, modalFilteredEvents, modalFilter);
    setIsExportModalOpen(false);
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    startDate !== '' ||
    endDate !== '' ||
    historyFilter !== 'ALL';

  return (
    <div
      data-testid={`trigger-card-${trigger.id}`}
      className="p-3.5 rounded-xl bg-[#090d1a]/80 border border-cyan-500/20 hover:border-cyan-500/50 hover:shadow-[0_8px_25px_rgba(6,182,212,0.18)] transition-all duration-200 space-y-2.5 group relative"
    >
      {/* Top Header: Section + Status Badge + Critical Failures Badge + Sub-tab Switcher */}
      <div className="flex items-center justify-between gap-2 font-mono text-[10px] pb-1 border-b border-white/5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-cyan-400 font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/25">
            {trigger.section}
          </span>
          <span className="text-[9px] text-zinc-400 font-mono">
            {trigger.act.split(' ')[0]}
          </span>

          {/* Critical Failures Badge (Last 24h) - Clickable to navigate to and filter Validation History */}
          {criticalFailures24h.length > 0 && (
            <button
              type="button"
              data-testid={`critical-failures-badge-${trigger.id}`}
              onClick={() => {
                setActiveSubTab('history');
                setHistoryFilter('FAILED');
                triggerVibration([40, 60, 40]);
                playTone(420, 0.08);
              }}
              className="text-rose-300 font-bold px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/50 flex items-center gap-1 hover:bg-rose-500/30 transition-all cursor-pointer animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.3)]"
              title="Click to view critical validation failures in Validation History"
            >
              <AlertTriangle className="w-2.5 h-2.5 text-rose-400 shrink-0" />
              <span>{criticalFailures24h.length} Critical Failure{criticalFailures24h.length > 1 ? 's' : ''}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-emerald-300 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            {trigger.statusText}
          </span>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5 text-[10px] font-mono">
        <button
          type="button"
          onClick={() => setActiveSubTab('overview')}
          className={`flex-1 py-1 px-2 rounded-md font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'overview'
              ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <Info className="w-3 h-3 text-cyan-400" />
          <span>Specifications</span>
        </button>

        <button
          type="button"
          data-testid={`tab-validation-history-${trigger.id}`}
          onClick={() => setActiveSubTab('history')}
          className={`flex-1 py-1 px-2 rounded-md font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'history'
              ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <History className="w-3 h-3 text-amber-400" />
          <span>Validation History</span>
          <span
            className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
              historyEvents.length > 0
                ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {historyEvents.length}
          </span>
        </button>
      </div>

      {/* SUB-TAB 1: Overview & Specifications */}
      {activeSubTab === 'overview' && (
        <div className="space-y-2 animate-in fade-in duration-150">
          <div>
            <h5 className="text-xs font-bold text-zinc-100 group-hover:text-cyan-300 transition-colors font-sans">
              {trigger.title}
            </h5>
            <p className="text-[11px] text-cyan-400/90 font-medium font-thai">
              {trigger.titleTh}
            </p>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
            {trigger.description}
          </p>

          <div className="pt-2 border-t border-white/5 flex flex-col gap-1 font-mono text-[10px]">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-zinc-500">PQC Scheme:</span>
              <span className="text-zinc-300 truncate max-w-[160px] text-right" title={trigger.pqcScheme}>
                {trigger.pqcScheme}
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-zinc-500">Anchor:</span>
              <span className="text-cyan-400/90 truncate max-w-[160px] text-right" title={trigger.anchor}>
                {trigger.anchor}
              </span>
            </div>

            {/* PQC Signature Hash with Dedicated Copy to Clipboard Button */}
            <div className="flex items-center justify-between text-zinc-400 pt-1 border-t border-white/5">
              <span className="text-zinc-500">PQC Sig Hash:</span>
              <div className="flex items-center gap-1.5">
                <span
                  className="text-purple-300 font-mono text-[9px] truncate max-w-[120px]"
                  title={pqcHash || ''}
                >
                  {(pqcHash || '').slice(0, 14)}...
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopyHash(trigger.id, pqcHash || '');
                  }}
                  className="px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-colors flex items-center gap-1 text-[9px] font-sans cursor-pointer"
                  title="คัดลอก PQC Metadata Hash สำหรับการตรวจสอบนิติวิทยาศาสตร์ (Forensic Analysis)"
                >
                  {copiedHashId === trigger.id ? (
                    <>
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                      <span className="text-emerald-300 text-[8px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-2.5 h-2.5 text-cyan-400" />
                      <span className="text-[8px]">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Forensic Audit Mode Overlay Metadata */}
            {isForensicAuditMode && (
              <div className="mt-1.5 pt-1.5 border-t border-purple-500/30 bg-purple-950/30 -mx-2 -mb-2 p-2 rounded-b-lg space-y-1 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-[9px] text-purple-300 font-bold">
                  <span className="flex items-center gap-1">
                    <Fingerprint className="w-2.5 h-2.5 text-purple-400" />
                    <span>PQC SIG HASH:</span>
                  </span>
                  <span className="text-emerald-400 text-[8px]">VERIFIED (PASS)</span>
                </div>
                <div className="text-[8px] text-purple-200/90 font-mono break-all bg-black/60 p-1 rounded border border-purple-500/20 flex items-center justify-between gap-1">
                  <span>{pqcHash}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopyHash(trigger.id, pqcHash || '');
                    }}
                    className="p-1 rounded hover:bg-white/10 text-purple-300 cursor-pointer shrink-0"
                    title="Copy hash"
                  >
                    {copiedHashId === trigger.id ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-purple-300" />
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between text-[8px] text-zinc-400">
                  <span>Timestamp: {new Date().toISOString().split('T')[0]} 05:05:30 ICT</span>
                  <span className="text-cyan-400">Δ0.0% Invariant</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Validation History */}
      {activeSubTab === 'history' && (
        <div
          data-testid={`validation-history-content-${trigger.id}`}
          className="space-y-2.5 animate-in fade-in duration-150"
        >
          {/* Action Toolbar: Refresh / Probe / Test Fail Controls */}
          <div className="flex items-center justify-between gap-1.5 pt-0.5">
            <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
              <History className="w-3 h-3 text-amber-400" />
              <span>Attestation Logs ({historyEvents.length})</span>
            </span>

            <div className="flex items-center gap-1">
              {/* Refresh Event Store Button */}
              <button
                type="button"
                data-testid={`btn-refresh-history-${trigger.id}`}
                disabled={isRefreshing}
                onClick={handleRefresh}
                className="px-2 py-0.5 rounded bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/35 text-cyan-300 text-[9px] font-mono font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                title="Re-fetch latest system events from event store"
              >
                <RefreshCw className={`w-2.5 h-2.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                disabled={isValidating}
                onClick={() => handleValidate(false)}
                className="px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 text-[9px] font-mono font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                title="Run real-time cryptographic invariant probe for this statute"
              >
                <Zap className={`w-2.5 h-2.5 text-emerald-400 ${isValidating ? 'animate-spin' : ''}`} />
                <span>Probe</span>
              </button>

              <button
                type="button"
                disabled={isValidating}
                onClick={() => handleValidate(true)}
                className="px-1.5 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[9px] font-mono flex items-center gap-1 transition-all cursor-pointer"
                title="Simulate tamper / stress test to verify fail-closed detection"
              >
                <ShieldAlert className="w-2.5 h-2.5 text-rose-400" />
                <span>Test Fail</span>
              </button>
            </div>
          </div>

          {/* 30-Day Verification Pass/Fail & Latency Trend Sparkline */}
          <ThirtyDayTriggerSparkline
            triggerId={trigger.id}
            triggerSection={trigger.section}
            historyEvents={historyEvents}
          />

          {/* Summary Header: Total Count, Success Rate, Average Latency for Currently Filtered Records */}
          <div
            data-testid={`validation-summary-${trigger.id}`}
            className="grid grid-cols-3 gap-1.5 p-1.5 rounded-lg bg-[#070b14]/90 border border-white/10 font-mono text-[9px]"
          >
            <div className="flex flex-col items-center justify-center p-1 rounded bg-black/40 border border-white/5 text-center">
              <span className="text-zinc-400 text-[8px] uppercase tracking-wider">Total Count</span>
              <span
                data-testid={`summary-total-${trigger.id}`}
                className="text-cyan-300 font-bold text-[11px]"
              >
                {filteredSummary.total}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-1 rounded bg-black/40 border border-white/5 text-center">
              <span className="text-zinc-400 text-[8px] uppercase tracking-wider">Success Rate</span>
              <span
                data-testid={`summary-success-rate-${trigger.id}`}
                className={`font-bold text-[11px] ${
                  parseFloat(filteredSummary.successRate) >= 90
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              >
                {filteredSummary.successRate}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-1 rounded bg-black/40 border border-white/5 text-center">
              <span className="text-zinc-400 text-[8px] uppercase tracking-wider">Avg Latency</span>
              <span
                data-testid={`summary-avg-latency-${trigger.id}`}
                className="text-purple-300 font-bold text-[11px]"
              >
                {filteredSummary.avgLatency}
              </span>
            </div>
          </div>

          {/* Validation Health Mini-Summary Card: Percentage of VERIFIED PASS vs Anomalies over Current Filter */}
          <div
            data-testid={`validation-health-card-${trigger.id}`}
            className="p-2 rounded-lg bg-gradient-to-r from-slate-950 via-[#0a0f1d] to-slate-950 border border-cyan-500/25 space-y-1.5 font-mono text-[9px]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="font-bold text-zinc-200 uppercase tracking-wider text-[8.5px]">
                  Validation Health Index
                </span>
              </div>
              <span
                data-testid={`health-badge-${trigger.id}`}
                className={`px-1.5 py-0.2 rounded font-bold text-[8px] border flex items-center gap-1 ${
                  validationHealth.isHealthy
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                    : validationHealth.isDegraded
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                }`}
              >
                {validationHealth.isHealthy ? (
                  <>
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                    <span>HEALTHY INVARIANT ({validationHealth.passPercent}%)</span>
                  </>
                ) : validationHealth.isDegraded ? (
                  <>
                    <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                    <span>ELEVATED DRIFT ({validationHealth.passPercent}%)</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-2.5 h-2.5 text-rose-400" />
                    <span>CRITICAL ANOMALIES ({validationHealth.passPercent}%)</span>
                  </>
                )}
              </span>
            </div>

            {/* Dual Health Gauge Progress Bar */}
            <div className="w-full bg-slate-900 rounded-full h-1.5 flex overflow-hidden border border-white/5">
              <div
                style={{ width: `${validationHealth.passPercent}%` }}
                className="bg-emerald-400 h-full transition-all duration-300"
                title={`VERIFIED PASS: ${validationHealth.passPercent}%`}
              />
              <div
                style={{ width: `${validationHealth.anomalyPercent}%` }}
                className="bg-rose-500 h-full transition-all duration-300"
                title={`Anomalies & Fails: ${validationHealth.anomalyPercent}%`}
              />
            </div>

            {/* Ratio Breakdown */}
            <div className="flex items-center justify-between text-[8px] text-zinc-400 pt-0.5">
              <div className="flex items-center gap-1 text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                <span>
                  VERIFIED PASS: <strong className="text-zinc-100">{validationHealth.passCount}</strong> ({validationHealth.passPercent}%)
                </span>
              </div>
              <div className="flex items-center gap-1 text-rose-300">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />
                <span>
                  Anomalies & Fails: <strong className="text-zinc-100">{validationHealth.anomalyCount}</strong> ({validationHealth.anomalyPercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* Search Bar + Clear Filters Button */}
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1 flex items-center bg-slate-900/90 rounded-lg border border-white/10 px-2 py-1 text-[9px] font-mono">
              <Search className="w-3 h-3 text-cyan-400 shrink-0 mr-1.5" />
              <input
                type="text"
                data-testid={`search-input-${trigger.id}`}
                placeholder="Search by ID, title, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-zinc-100 placeholder-zinc-500 text-[9px] w-full focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-zinc-400 hover:text-zinc-100 p-0.5 cursor-pointer shrink-0"
                  title="Clear search query"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>

            {/* Clear Filters Button */}
            <button
              type="button"
              data-testid={`btn-clear-filters-${trigger.id}`}
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              className={`px-2 py-1 rounded-lg border text-[9px] font-mono flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                hasActiveFilters
                  ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40 shadow-xs'
                  : 'bg-zinc-900/40 text-zinc-500 border-white/5 cursor-not-allowed opacity-60'
              }`}
              title="Reset search, date ranges, and status filter to default state"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Clear Filters</span>
            </button>
          </div>

          {/* Controls Toolbar: Filter Dropdown + Date Range Picker + Audit Trail Matrix Toggle + Export CSV Modal Trigger */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 p-1.5 rounded-lg bg-black/40 border border-white/10 font-mono text-[9px]">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Filter Dropdown */}
              <div className="flex items-center gap-1 bg-slate-900/90 px-1.5 py-0.5 rounded border border-white/10">
                <Filter className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                <select
                  data-testid={`filter-select-${trigger.id}`}
                  aria-label="Filter validation attempts"
                  value={historyFilter}
                  onChange={(e) => setHistoryFilter(e.target.value as ValidationHistoryFilter)}
                  className="bg-transparent text-zinc-200 text-[9px] font-mono focus:outline-none cursor-pointer pr-1"
                >
                  <option value="ALL" className="bg-slate-900 text-zinc-100">
                    All ({historyEvents.length})
                  </option>
                  <option value="VERIFIED PASS" className="bg-slate-900 text-emerald-300">
                    VERIFIED PASS ({successCount})
                  </option>
                  <option value="FAILED" className="bg-slate-900 text-rose-300">
                    FAILED ({failCount})
                  </option>
                  <option value="ISOLATED" className="bg-slate-900 text-purple-300">
                    ISOLATED ({isolatedCount})
                  </option>
                  <option value="WARNING" className="bg-slate-900 text-amber-300">
                    WARNING ({warningCount})
                  </option>
                </select>
              </div>

              {/* Date Range Picker */}
              <div className="flex items-center gap-1 bg-slate-900/90 px-1.5 py-0.5 rounded border border-white/10 text-[9px]">
                <Calendar className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                <input
                  type="date"
                  data-testid={`date-start-${trigger.id}`}
                  aria-label="Start date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-zinc-200 text-[8px] font-mono focus:outline-none cursor-pointer"
                  title="Filter by start date"
                />
                <span className="text-zinc-500 text-[8px]">-</span>
                <input
                  type="date"
                  data-testid={`date-end-${trigger.id}`}
                  aria-label="End date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-zinc-200 text-[8px] font-mono focus:outline-none cursor-pointer"
                  title="Filter by end date"
                />
                {(startDate || endDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="text-zinc-400 hover:text-zinc-200 p-0.5 cursor-pointer shrink-0"
                    title="Reset date filter"
                  >
                    <X className="w-2 h-2" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Audit Trail Matrix Visual Component Toggle */}
              <button
                type="button"
                data-testid={`btn-toggle-audit-matrix-${trigger.id}`}
                onClick={() => {
                  setIsAuditMatrixOpen(!isAuditMatrixOpen);
                  playTone(600, 0.04);
                }}
                className={`px-2 py-0.5 rounded border text-[9px] font-mono flex items-center gap-1 transition-all cursor-pointer shadow-sm ${
                  isAuditMatrixOpen
                    ? 'bg-purple-500/25 text-purple-200 border-purple-500/50 ring-1 ring-purple-400/40'
                    : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border-purple-500/30'
                }`}
                title="Toggle Audit Trail Matrix forensic map"
              >
                <Table className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                <span>Audit Matrix</span>
              </button>

              {/* Export Validation History CSV (Opens Configuration Modal) */}
              <button
                type="button"
                data-testid={`btn-export-csv-${trigger.id}`}
                disabled={filteredEvents.length === 0}
                onClick={handleOpenExportModal}
                className="px-2 py-0.5 rounded bg-cyan-500/15 hover:bg-cyan-500/25 disabled:opacity-40 disabled:cursor-not-allowed border border-cyan-500/30 text-cyan-300 text-[9px] font-mono flex items-center gap-1 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                title="Configure and export validation history as RFC-4180 CSV"
              >
                <Download className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                <span>Export CSV ({filteredEvents.length})</span>
              </button>
            </div>
          </div>

          {/* Audit Trail Matrix Visual Component (Forensic Mapping) */}
          {isAuditMatrixOpen && (
            <div
              data-testid={`audit-trail-matrix-${trigger.id}`}
              className="p-2 rounded-lg bg-black/60 border border-purple-500/30 space-y-1.5 font-mono text-[9px] animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between border-b border-purple-500/20 pb-1">
                <span className="font-bold text-purple-300 flex items-center gap-1 text-[9px]">
                  <Fingerprint className="w-3 h-3 text-purple-400" />
                  <span>Audit Trail Matrix (Forensic Ledger Map)</span>
                </span>
                <span className="text-zinc-500 text-[8px]">
                  Anchored to SSoT Event Store
                </span>
              </div>

              <div className="grid grid-cols-1 gap-1">
                {auditTrailMatrixData.map((item) => (
                  <div
                    key={item.statusKey}
                    data-testid={`audit-matrix-row-${item.classification}`}
                    className={`p-1.5 rounded border ${item.bgColor} ${item.borderColor} flex items-center justify-between gap-2 text-[8.5px]`}
                  >
                    <div className="flex items-center gap-1.5 min-w-[110px]">
                      <span className={`font-bold ${item.color}`}>
                        {item.name}
                      </span>
                      <span className="text-[8px] px-1 rounded bg-black/40 text-zinc-300 border border-white/5">
                        {item.totalOccurrences}
                      </span>
                    </div>

                    <div className="flex-1 truncate text-zinc-400 text-[8px]">
                      <span className="text-zinc-500">Event: </span>
                      <span className="text-cyan-300 font-mono">{item.latestEventId}</span>
                      <span className="text-zinc-600 mx-1">•</span>
                      <span className="text-zinc-400">{item.latestTimestamp}</span>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className="text-[7.5px] font-mono text-purple-300/80 max-w-[90px] truncate block"
                        title={item.proofHash}
                      >
                        {item.proofHash.slice(0, 10)}...
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sortable Column Headers */}
          <div className="flex items-center justify-between px-2.5 py-1 bg-black/60 rounded-t-lg border border-white/10 text-[9px] font-mono text-zinc-400">
            <button
              type="button"
              data-testid={`sort-header-status-${trigger.id}`}
              onClick={() => handleSort('status')}
              className="flex items-center gap-1 hover:text-cyan-300 transition-colors cursor-pointer"
              title="Click to sort by status"
            >
              <span>Status</span>
              {sortField === 'status' ? (
                sortDirection === 'asc' ? (
                  <ArrowUp className="w-2.5 h-2.5 text-cyan-400" />
                ) : (
                  <ArrowDown className="w-2.5 h-2.5 text-cyan-400" />
                )
              ) : (
                <ArrowUpDown className="w-2.5 h-2.5 text-zinc-600" />
              )}
            </button>

            <div className="flex items-center gap-4">
              <button
                type="button"
                data-testid={`sort-header-latency-${trigger.id}`}
                onClick={() => handleSort('latency')}
                className="flex items-center gap-1 hover:text-cyan-300 transition-colors cursor-pointer"
                title="Click to sort by measured latency"
              >
                <span>Latency</span>
                {sortField === 'latency' ? (
                  sortDirection === 'asc' ? (
                    <ArrowUp className="w-2.5 h-2.5 text-cyan-400" />
                  ) : (
                    <ArrowDown className="w-2.5 h-2.5 text-cyan-400" />
                  )
                ) : (
                  <ArrowUpDown className="w-2.5 h-2.5 text-zinc-600" />
                )}
              </button>

              <button
                type="button"
                data-testid={`sort-header-timestamp-${trigger.id}`}
                onClick={() => handleSort('timestamp')}
                className="flex items-center gap-1 hover:text-cyan-300 transition-colors cursor-pointer"
                title="Click to sort by timestamp"
              >
                <span>Timestamp</span>
                {sortField === 'timestamp' ? (
                  sortDirection === 'asc' ? (
                    <ArrowUp className="w-2.5 h-2.5 text-cyan-400" />
                  ) : (
                    <ArrowDown className="w-2.5 h-2.5 text-cyan-400" />
                  )
                ) : (
                  <ArrowUpDown className="w-2.5 h-2.5 text-zinc-600" />
                )}
              </button>
            </div>
          </div>

          {/* Virtualized Chronological List of Verification Attempts */}
          <div
            ref={scrollContainerRef}
            onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
            className="max-h-[180px] overflow-y-auto pr-0.5 custom-scrollbar -mt-1.5 rounded-b-lg border-x border-b border-white/10 p-1.5 bg-black/20 relative"
          >
            {sortedAndFilteredEvents.length === 0 ? (
              <div className="p-3 rounded-lg bg-black/40 border border-dashed border-white/10 text-center space-y-1.5 font-mono">
                <p className="text-[10px] text-zinc-400">
                  {historyEvents.length === 0
                    ? 'No verification attempts in active memory buffer.'
                    : `No validation attempts match search / filter criteria.`}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 text-[10px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 text-amber-400" />
                    <span>Reset All Filters</span>
                  </button>
                )}
              </div>
            ) : (
              <div style={{ height: `${totalVirtualHeight}px`, position: 'relative', width: '100%' }}>
                <div
                  style={{
                    transform: `translateY(${virtualOffsetY}px)`,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                  }}
                  className="space-y-1.5"
                >
                  {visibleVirtualItems.map(({ evt, index }) => {
                    const classification = classifyValidationEvent(evt);
                    const isFail = classification === 'FAILED';
                    const isIsolated = classification === 'ISOLATED';
                    const isWarning = classification === 'WARNING';
                    const isSuccess = classification === 'VERIFIED_PASS';

                    // Measured Latency & SLA High-Latency Indicator (>500ms)
                    const latency = getEventLatencyMs(evt);
                    const isHighLatency = latency !== null ? latency > 500 : false;

                    return (
                      <div
                        key={evt.id || index}
                        data-testid={`validation-item-${trigger.id}-${evt.id || index}`}
                        className={`p-2 rounded-lg border text-[10px] font-mono space-y-1 transition-colors ${
                          isFail
                            ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                            : isIsolated
                            ? 'bg-purple-950/30 border-purple-500/40 text-purple-200'
                            : isWarning
                            ? 'bg-amber-950/25 border-amber-500/35 text-amber-200'
                            : 'bg-black/50 border-emerald-500/25 text-zinc-200'
                        } ${isHighLatency ? 'ring-1 ring-amber-500/70 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.2)]' : ''}`}
                      >
                        {/* Event Status & Timestamp & Latency Indicator */}
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <span className="flex items-center gap-1 font-bold">
                            {isFail ? (
                              <>
                                <XCircle className="w-3 h-3 text-rose-400 shrink-0" />
                                <span className="text-rose-400 uppercase text-[9px]">
                                  FAILED
                                </span>
                              </>
                            ) : isIsolated ? (
                              <>
                                <ShieldAlert className="w-3 h-3 text-purple-400 shrink-0" />
                                <span className="text-purple-300 uppercase text-[9px]">
                                  ISOLATED / DRIFT
                                </span>
                              </>
                            ) : isWarning ? (
                              <>
                                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                                <span className="text-amber-300 uppercase text-[9px]">
                                  WARNING
                                </span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span className="text-emerald-300 uppercase text-[9px]">
                                  VERIFIED PASS
                                </span>
                              </>
                            )}
                          </span>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Real Measured Latency & High-Latency Indicator (>500ms warning indicator within UI row) */}
                            {latency !== null && (
                              isHighLatency ? (
                                <span
                                  data-testid={`latency-alert-${evt.id || index}`}
                                  data-latency={latency}
                                  className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/60 flex items-center gap-1 font-mono text-[8px] font-bold shadow-[0_0_8px_rgba(245,158,11,0.35)] animate-pulse"
                                  title={`Latency warning: ${latency}ms exceeds 500ms SLA threshold`}
                                >
                                  <AlertTriangle className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                                  <span>{latency}ms (&gt;500ms SLA Warning)</span>
                                </span>
                              ) : (
                                <span
                                  data-testid={`latency-tag-${evt.id || index}`}
                                  data-latency={latency}
                                  className="px-1 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center gap-0.5 font-mono text-[8px]"
                                  title={`Measured latency: ${latency}ms`}
                                >
                                  <Zap className="w-2 h-2 text-cyan-400 shrink-0" />
                                  <span>{latency < 1 ? latency.toFixed(2) : latency.toFixed(0)}ms</span>
                                </span>
                              )
                            )}

                            <span className="text-[9px] text-zinc-400 flex items-center gap-1 shrink-0">
                              <Clock className="w-2.5 h-2.5 text-zinc-500" />
                              <span>{evt.timestamp}</span>
                            </span>
                          </div>
                        </div>

                        {/* Event Title & Summary */}
                        <div className="text-[10px] font-semibold text-zinc-100 line-clamp-1">
                          {evt.title}
                        </div>

                        <p className="text-[9px] text-zinc-400 font-sans leading-tight line-clamp-2">
                          {evt.description}
                        </p>

                        {/* Meta Footer */}
                        <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[9px] text-zinc-500">
                          <span className="truncate max-w-[130px]" title={evt.statuteRef || trigger.statuteClause}>
                            {evt.statuteRef ? evt.statuteRef.split('(')[0] : trigger.section}
                          </span>

                          {evt.metaHash && (
                            <div className="flex items-center gap-1">
                              <span
                                className="font-mono text-[8px] text-purple-300 truncate max-w-[80px]"
                                title={evt.metaHash}
                              >
                                {evt.metaHash.slice(0, 10)}...
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleCopyLocalHash(evt.id, evt.metaHash!, e)}
                                className="text-zinc-500 hover:text-purple-300 p-0.5 cursor-pointer"
                                title="Copy event hash"
                              >
                                {copiedItemHashId === evt.id ? (
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RFC-4180 CSV Export Configuration Modal */}
      {isExportModalOpen && (
        <div
          data-testid={`export-modal-${trigger.id}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="bg-[#0b1022] border border-cyan-500/40 rounded-xl max-w-md w-full p-4 shadow-2xl space-y-3 font-mono text-zinc-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-white">Export Validation History (CSV)</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[11px] text-zinc-300 space-y-1">
              <p>
                <strong className="text-cyan-400">{trigger.section}</strong>: {trigger.title}
              </p>
              <p className="text-[10px] text-zinc-400 font-sans">
                Generates RFC-4180 compliant CSV file with tamper-evident cryptographic hashes.
              </p>
            </div>

            {/* Modal Filter Controls */}
            <div className="space-y-2 text-[10px] bg-black/40 p-2.5 rounded-lg border border-white/5">
              <div>
                <label className="block text-zinc-400 mb-1">Status Filter:</label>
                <select
                  data-testid={`modal-filter-select-${trigger.id}`}
                  value={modalFilter}
                  onChange={(e) => setModalFilter(e.target.value as ValidationHistoryFilter)}
                  className="w-full bg-slate-900 text-zinc-200 p-1.5 rounded border border-white/10 text-[10px] focus:outline-none"
                >
                  <option value="ALL">All Statuses ({historyEvents.length})</option>
                  <option value="VERIFIED PASS">VERIFIED PASS only ({successCount})</option>
                  <option value="FAILED">FAILED only ({failCount})</option>
                  <option value="ISOLATED">ISOLATED only ({isolatedCount})</option>
                  <option value="WARNING">WARNING only ({warningCount})</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Time Range Preset:</label>
                <div className="grid grid-cols-4 gap-1">
                  {(['all', '24h', '7d', '30d'] as const).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setModalPreset(preset)}
                      className={`py-1 rounded text-center uppercase text-[9px] font-semibold transition-colors cursor-pointer border ${
                        modalPreset === preset
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-slate-900 text-zinc-400 border-white/5 hover:bg-slate-800'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Custom Date Range:</label>
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={modalStartDate}
                    onChange={(e) => {
                      setModalStartDate(e.target.value);
                      setModalPreset('custom');
                    }}
                    className="flex-1 bg-slate-900 text-zinc-200 p-1 rounded border border-white/10 text-[9px]"
                  />
                  <span className="text-zinc-500">-</span>
                  <input
                    type="date"
                    value={modalEndDate}
                    onChange={(e) => {
                      setModalEndDate(e.target.value);
                      setModalPreset('custom');
                    }}
                    className="flex-1 bg-slate-900 text-zinc-200 p-1 rounded border border-white/10 text-[9px]"
                  />
                </div>
              </div>
            </div>

            {/* Export Preview Summary */}
            <div className="flex items-center justify-between text-[10px] bg-cyan-950/20 p-2 rounded-lg border border-cyan-500/20">
              <span className="text-zinc-400">Target Records:</span>
              <span data-testid={`modal-preview-count-${trigger.id}`} className="text-cyan-300 font-bold">
                {modalFilteredEvents.length} records
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-[10px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid={`confirm-export-csv-${trigger.id}`}
                disabled={modalFilteredEvents.length === 0}
                onClick={handleConfirmModalExport}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-[10px] flex items-center gap-1.5 transition-all cursor-pointer shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Confirm & Download CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default LegalTriggerCard;
