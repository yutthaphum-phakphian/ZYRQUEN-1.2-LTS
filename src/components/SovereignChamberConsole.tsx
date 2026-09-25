export {};
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  Volume2,
  VolumeX,
  Cpu,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldAlert,
  Grid,
  Sliders,
  X,
  FileSpreadsheet,
  CheckCircle2,
  Lock,
  ShieldCheck,
  ChevronDown,
  Eye,
  Siren,
  FileText,
  QrCode,
  Copy,
  Check,
  Camera,
  Smartphone,
  Scan,
  Printer,
  CheckSquare,
  Square,
  RotateCcw,
} from 'lucide-react';
import { useSystemStateStore } from '../store/systemStateStore';
import {
  CryoChamber,
  ChamberStatus,
  GridDensity,
  SortCriterion,
  SignerMetadata,
  ToastAlert,
  INITIAL_18_CHAMBERS,
  SYSTEM_24H_STABILITY,
} from './chamberConsoleData';
import {
  playUnstableEventChime,
  generateForensicBatchPDF,
  ChamberDetailModal,
  MiniD3StabilityChart,
  ChamberSparkline,
} from './ChamberDetailModal';
import {
  ForensicDossierQRCode,
  generateChamberFieldQRPayload,
  printChamberQRCards,
  ChamberFieldQRSection,
} from './ChamberFieldQRSection';

// Export canonical types and helpers
export * from './chamberConsoleData';
export {
  playUnstableEventChime,
  generateForensicBatchPDF,
  ChamberDetailModal,
  MiniD3StabilityChart,
  ChamberSparkline,
};
export {
  ForensicDossierQRCode,
  generateChamberFieldQRPayload,
  printChamberQRCards,
  ChamberFieldQRSection,
};

const parseSyncTimeToSeconds = (timeStr: string): number => {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3 && !parts.some(isNaN)) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
};

export const SovereignChamberConsole: React.FC = () => {
  const [chambers, setChambers] = useState<CryoChamber[]>(INITIAL_18_CHAMBERS);
  const [sortCriterion, setSortCriterion] = useState<SortCriterion>('status_unstable');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [gridDensity, setGridDensity] = useState<GridDensity>('compact');

  // Selected Chamber for Detail Modal
  const [selectedDetailChamber, setSelectedDetailChamber] = useState<CryoChamber | null>(null);

  // Toast Alert System
  const [toastAlerts, setToastAlerts] = useState<ToastAlert[]>([]);
  const notifiedChambersRef = useRef<Set<string>>(new Set());

  // Multi-Chamber Selection State
  const [selectedChamberIds, setSelectedChamberIds] = useState<Set<number>>(new Set());

  // Modals & Overlay Drawers
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [isExecModalOpen, setIsExecModalOpen] = useState<boolean>(false);
  const [isDossierModalOpen, setIsDossierModalOpen] = useState<boolean>(false);
  const [dossierActiveTab, setDossierActiveTab] = useState<'qr_verify' | 'chamber_field_qr' | 'camera_scan' | 'breakdown'>('qr_verify');
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [simulatedScanResult, setSimulatedScanResult] = useState<string | null>(null);
  const [execActiveTab, setExecActiveTab] = useState<'overview' | 'historical_audit'>('overview');
  const [isLockdownDrawerOpen, setIsLockdownDrawerOpen] = useState<boolean>(false);

  // Batch Simulation State
  const [batchProgress, setBatchProgress] = useState<number>(0);
  const [isBatchRunning, setIsBatchRunning] = useState<boolean>(false);
  const batchIntervalRef = useRef<number | null>(null);

  const TOTAL_BATCH_CHAMBERS = 14902;
  const PASSED_BATCH_CHAMBERS = 14896;
  const UNSTABLE_BATCH_CHAMBERS = 6;

  const { updateCoherence, logSystemEvent } = useSystemStateStore();

  const signerMetadata: SignerMetadata = useMemo(() => ({
    signerId: 'ZYRQUEN-HSM-CHAMBER-SIGNER-v4.1',
    role: 'Sovereign Quantum System Sentinel',
    hsmSerial: 'HSM-FIPS140-3-L4-99201',
    timestamp: new Date().toISOString()
  }), []);

  useEffect(() => {
    return () => {
      if (batchIntervalRef.current !== null) {
        window.clearInterval(batchIntervalRef.current);
        batchIntervalRef.current = null;
      }
    };
  }, []);

  const priorityLockdownQueue = useMemo(() => {
    return chambers.filter(c => c.coherence < 0.90);
  }, [chambers]);

  // Monitor coherence < 0.90 and trigger Browser Toast Alert Notifications
  useEffect(() => {
    chambers.forEach(c => {
      if (c.coherence < 0.90 && !notifiedChambersRef.current.has(c.chamberId)) {
        notifiedChambersRef.current.add(c.chamberId);
        const newToast: ToastAlert = {
          id: `toast-${c.chamberId}-${Date.now()}`,
          chamberId: c.chamberId,
          chamberName: c.name,
          coherence: c.coherence,
          timestamp: new Date().toLocaleTimeString()
        };
        setToastAlerts(prev => [newToast, ...prev.slice(0, 4)]);
        playUnstableEventChime(isMuted);
      } else if (c.coherence >= 0.90 && notifiedChambersRef.current.has(c.chamberId)) {
        notifiedChambersRef.current.delete(c.chamberId);
      }
    });
  }, [chambers, isMuted]);

  const handleDismissToast = (id: string) => {
    setToastAlerts(prev => prev.filter(t => t.id !== id));
  };

  const addToastAlert = (chamberId: string, chamberName: string, coherence: number) => {
    const newToast: ToastAlert = {
      id: `toast-${chamberId}-${Date.now()}`,
      chamberId,
      chamberName,
      coherence,
      timestamp: new Date().toLocaleTimeString()
    };
    setToastAlerts(prev => [newToast, ...prev.slice(0, 4)]);
  };

  // Multi-Selection Handlers
  const handleToggleSelectChamber = useCallback((id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedChamberIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedChamberIds.size === chambers.length) {
      setSelectedChamberIds(new Set());
    } else {
      setSelectedChamberIds(new Set(chambers.map(c => c.id)));
    }
  }, [chambers, selectedChamberIds.size]);

  const handleClearSelection = useCallback(() => {
    setSelectedChamberIds(new Set());
  }, []);

  // Batch Recalibrate & Restore
  const handleBatchRecalibrate = useCallback(() => {
    if (selectedChamberIds.size === 0) return;
    const targetIds = new Set(selectedChamberIds);
    const count = targetIds.size;

    setChambers(prev =>
      prev.map(c => {
        if (targetIds.has(c.id)) {
          return {
            ...c,
            status: 'pure_green',
            coherence: 0.998,
            coherenceTrend: 'rising',
            temperature: 14.80,
            history24h: [...c.history24h.slice(1), 0.998],
            lastSync: new Date().toLocaleTimeString('en-GB', { hour12: false })
          };
        }
        return c;
      })
    );

    updateCoherence(0.998);
    logSystemEvent({
      id: `batch-recal-${Date.now()}`,
      title: `🟢 BATCH RECALIBRATION: ${count} Cryo Chambers Restored`,
      description: `Restored ${count} cryogenic chambers to SSoT Pure Green baseline (Coherence: 99.80%, Temp: 14.80 mK)`,
      severity: 'ratified',
      handler: () => {}
    });

    addToastAlert('BATCH-RESTORE', `Recalibrated ${count} Chambers to Pure Green`, 0.998);
    playUnstableEventChime(isMuted);
    setSelectedChamberIds(new Set());
  }, [selectedChamberIds, updateCoherence, logSystemEvent, isMuted]);

  // Batch Export Selected CSV
  const handleExportSelectedCSV = useCallback(() => {
    if (selectedChamberIds.size === 0) return;
    const selectedList = chambers.filter(c => selectedChamberIds.has(c.id));
    const count = selectedList.length;

    const headers = ['Chamber ID', 'Name', 'Coherence (%)', 'Temperature (mK)', 'Status', 'Last Sync Time', 'Merkle Leaf Hash', 'Coherence Trend'];
    const rows = selectedList.map(c => [
      c.chamberId,
      `"${c.name}"`,
      (c.coherence * 100).toFixed(1),
      c.temperature.toFixed(2),
      c.status,
      c.lastSync,
      c.merkleHash,
      c.coherenceTrend
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZYRQUEN_Selected_${count}_Chambers_Report_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      if (a.parentNode && a.isConnected) a.parentNode.removeChild(a);
      URL.revokeObjectURL(url);
    }, 150);

    addToastAlert('BATCH-EXPORT', `Exported ${count} Chambers CSV Report`, 1.0);
  }, [chambers, selectedChamberIds]);

  // CSV Export for All Chambers
  const handleExportCSV = useCallback(() => {
    const headers = ['Chamber ID', 'Name', 'Coherence (%)', 'Temperature (mK)', 'Status', 'Last Sync Time', 'Merkle Leaf Hash', 'Coherence Trend'];
    const rows = chambers.map(c => [
      c.chamberId,
      `"${c.name}"`,
      (c.coherence * 100).toFixed(1),
      c.temperature.toFixed(2),
      c.status,
      c.lastSync,
      c.merkleHash,
      c.coherenceTrend
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZYRQUEN_Chamber_Status_Report_Block849202_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      if (a.parentNode && a.isConnected) a.parentNode.removeChild(a);
      URL.revokeObjectURL(url);
    }, 150);
  }, [chambers]);

  // Sorting Logic
  const sortedChambers = useMemo(() => {
    return [...chambers].sort((a, b) => {
      switch (sortCriterion) {
        case 'coherence_desc': return b.coherence - a.coherence;
        case 'coherence_asc':  return a.coherence - b.coherence;
        case 'temp_desc':      return b.temperature - a.temperature;
        case 'temp_asc':       return a.temperature - b.temperature;
        case 'sync_desc':      return parseSyncTimeToSeconds(b.lastSync) - parseSyncTimeToSeconds(a.lastSync);
        case 'sync_asc':       return parseSyncTimeToSeconds(a.lastSync) - parseSyncTimeToSeconds(b.lastSync);
        case 'status_pure':    return (a.status === 'pure_green' ? -1 : 1) - (b.status === 'pure_green' ? -1 : 1);
        case 'status_unstable':return (a.status === 'unstable' ? -1 : 1) - (b.status === 'unstable' ? -1 : 1);
        default: return 0;
      }
    });
  }, [chambers, sortCriterion]);

  const handleToggleUnstableEvent = useCallback((id: number) => {
    setChambers(prev => prev.map(c => {
      if (c.id === id) {
        const isCurrentlyPure = c.status === 'pure_green';
        const newStatus: ChamberStatus = isCurrentlyPure ? 'unstable' : 'pure_green';
        const newCoherence = isCurrentlyPure ? 0.680 : 0.998;

        if (newStatus === 'unstable') {
          playUnstableEventChime(isMuted);
        }

        return {
          ...c,
          status: newStatus,
          coherence: newCoherence,
          coherenceTrend: isCurrentlyPure ? 'falling' : 'rising',
          temperature: isCurrentlyPure ? 30.5 : 14.8,
          history24h: [...c.history24h.slice(1), newCoherence]
        };
      }
      return c;
    }));
  }, [isMuted]);

  const handleStartBatchVerification = useCallback(() => {
    if (batchIntervalRef.current !== null) {
      window.clearInterval(batchIntervalRef.current);
    }
    setIsBatchRunning(true);
    setBatchProgress(0);

    batchIntervalRef.current = window.setInterval(() => {
      setBatchProgress(prev => {
        if (prev >= 100) {
          if (batchIntervalRef.current !== null) {
            window.clearInterval(batchIntervalRef.current);
            batchIntervalRef.current = null;
          }
          setIsBatchRunning(false);
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans relative">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Navigation Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-slate-900 border-slate-800 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-cyan-950 border-cyan-800/80 rounded-xl text-cyan-400">
              <Cpu className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-cyan-950 text-cyan-400 border-cyan-800 rounded text-[10px] font-mono font-bold">
                  CRYONIC SSoT SENTINEL
                </span>
                <span className="text-xs text-slate-400">18-Cell Quantum Grid</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight mt-0.5">
                Cryo Chamber Sovereign Inspector
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* CSV Export Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-700/80 rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export Chamber CSV</span>
            </button>

            {/* Priority Lockdown Queue Button */}
            <button
              type="button"
              onClick={() => setIsLockdownDrawerOpen(true)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                priorityLockdownQueue.length > 0
                  ? 'bg-rose-950/80 border-rose-700 text-rose-200 animate-pulse'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <ShieldAlert className={`w-4 h-4 ${priorityLockdownQueue.length > 0 ? 'text-rose-400' : 'text-slate-400'}`} />
              <span>Priority Lockdown Queue</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono ${
                priorityLockdownQueue.length > 0 ? 'bg-rose-500 text-slate-950' : 'bg-slate-700 text-slate-300'
              }`}>
                {priorityLockdownQueue.length}
              </span>
            </button>

            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => setIsMuted(prev => !prev)}
              className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isMuted ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-cyan-950 border-cyan-700/60 text-cyan-400 hover:bg-cyan-900/60'
              }`}
              title={isMuted ? 'Unmute Audio Alert Chime' : 'Mute Audio Alert Chime'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Batch Forensic Audit Modal Trigger */}
            <button
              type="button"
              onClick={() => setIsBatchModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-950 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              14,902 Batch Audit
            </button>

            {/* Master Dossier (QR) Modal Trigger */}
            <button
              type="button"
              onClick={() => setIsDossierModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-950 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              Master Dossier (QR)
            </button>
          </div>
        </div>

        {/* Floating / Active Multi-Chamber Batch Action Bar */}
        <AnimatePresence>
          {selectedChamberIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="p-3.5 bg-cyan-950/90 border-2 border-cyan-500/80 rounded-2xl shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono"
            >
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-cyan-500 text-slate-950 font-black rounded-lg text-xs">
                  {selectedChamberIds.size} Selected
                </span>
                <span className="text-cyan-200">
                  Batch Multi-Chamber Operation Mode Active
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBatchRecalibrate}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg transition-all cursor-pointer shadow"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Recalibrate & Restore ({selectedChamberIds.size})</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportSelectedCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border-cyan-700/80 font-bold rounded-lg transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Export Selected ({selectedChamberIds.size})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDossierActiveTab('chamber_field_qr');
                    setIsDossierModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-300 border-emerald-700/80 font-bold rounded-lg transition-all cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Field QR Badges</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-all cursor-pointer ml-1"
                  title="Clear Selection"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toolbar: Sorting & Grid Density Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900/80 border-slate-800 rounded-xl">
          <div className="flex items-center gap-3">
            {/* Select All Toggle */}
            <button
              type="button"
              onClick={handleSelectAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-400 rounded-lg text-xs font-mono transition-all cursor-pointer"
            >
              {selectedChamberIds.size === chambers.length ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                  <span>Select All ({selectedChamberIds.size > 0 ? `${selectedChamberIds.size}/` : ''}{chambers.length})</span>
                </>
              )}
            </button>

            {/* Grid Density Toggle Button */}
            <button
              type="button"
              onClick={() => setGridDensity(prev => prev === 'compact' ? 'expanded' : 'compact')}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border-slate-700 hover:border-cyan-500 text-cyan-400 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer"
            >
              <Grid className="w-4 h-4" />
              <span>Density: {gridDensity === 'compact' ? 'Compact 6-Col' : 'Expanded 3-Col'}</span>
            </button>

            <span className="text-slate-600">|</span>

            {/* Dropdown Menu for Chamber Grid Sorting */}
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <label htmlFor="chamber-sort-select" className="font-bold">Sort Chambers:</label>
              <div className="relative">
                <select
                  id="chamber-sort-select"
                  value={sortCriterion}
                  onChange={(e) => setSortCriterion(e.target.value as SortCriterion)}
                  className="bg-slate-950 border-cyan-500/50 hover:border-cyan-400 text-cyan-300 font-bold rounded-lg px-3 py-1.5 pr-8 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-cyan-400 appearance-none cursor-pointer"
                >
                  <option value="status_unstable">⚠️ Unstable First</option>
                  <option value="status_pure">🟢 Pure Green First</option>
                  <option value="coherence_desc">📊 Coherence: High → Low</option>
                  <option value="coherence_asc">📊 Coherence: Low → High</option>
                  <option value="temp_desc">🔥 Temp: Warm → Cool (High → Low)</option>
                  <option value="temp_asc">❄️ Temp: Cool → Warm (Low → High)</option>
                  <option value="sync_desc">🕒 Last Sync: Newest First</option>
                  <option value="sync_asc">⏳ Last Sync: Oldest First</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-cyan-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-400">
            Active Filter: <span className="text-cyan-300 font-bold">{sortedChambers.length} Chambers</span> | Click card to view <span className="text-amber-400 font-bold">24h History & Proof</span>
          </div>
        </div>

        {/* 18-Cell Grid Render with motion/react Entry/Exit Animations */}
        <div className={`grid gap-3.5 ${
          gridDensity === 'compact'
            ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          <AnimatePresence mode="popLayout">
            {sortedChambers.map(chamber => {
              const isPure = chamber.status === 'pure_green';
              const isLowCoherence = chamber.coherence < 0.90;
              const isSelected = selectedChamberIds.has(chamber.id);

              return (
                <motion.div
                  key={chamber.id}
                  layout
                  initial={{ opacity: 0, scale: 0.94, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -10 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  onClick={() => setSelectedDetailChamber(chamber)}
                  className={`p-4 rounded-xl border transition-all relative flex flex-col justify-between cursor-pointer group hover:scale-[1.01] ${
                    isSelected
                      ? 'ring-2 ring-cyan-400 bg-cyan-950/40 border-cyan-500 shadow-lg shadow-cyan-950/50'
                      : isLowCoherence
                      ? 'bg-rose-950/30 border-rose-600/80 shadow-lg shadow-rose-950/50 ring-1 ring-rose-500/50'
                      : isPure
                      ? 'bg-slate-900/90 border-emerald-800/50 hover:border-emerald-500/80 shadow-md'
                      : 'bg-amber-950/20 border-amber-600/70 shadow-lg shadow-amber-950/30 animate-pulse'
                  }`}
                >
                  <div>
                    {/* Top Status Header with Multi-Select Checkbox */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleSelectChamber(chamber.id, e as unknown as React.MouseEvent)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 cursor-pointer accent-cyan-500 shrink-0"
                          title={isSelected ? `Deselect ${chamber.chamberId}` : `Select ${chamber.chamberId}`}
                        />
                        <span className="text-[10px] font-mono font-bold text-slate-400 group-hover:text-cyan-400 transition-colors flex items-center gap-1">
                          {chamber.chamberId}
                          <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        isLowCoherence
                          ? 'bg-rose-950 text-rose-300 border-rose-700'
                          : isPure
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : 'bg-amber-900/80 text-amber-300 border-amber-700'
                      }`}>
                        {isLowCoherence ? 'LOCKDOWN' : isPure ? 'Pure Green' : 'Unstable'}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-white mb-2 truncate group-hover:text-cyan-300 transition-colors">{chamber.name}</h3>

                    {/* Coherence % & Directional Trend Icon */}
                    <div className="space-y-1.5 font-mono text-[11px] mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Coherence</span>
                        <div className="flex items-center gap-1">
                          {chamber.coherenceTrend === 'rising' && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
                          {chamber.coherenceTrend === 'falling' && <TrendingDown className="w-3.5 h-3.5 text-rose-400" />}
                          {chamber.coherenceTrend === 'stable' && <Minus className="w-3.5 h-3.5 text-cyan-400" />}
                          <span className={`font-bold ${isPure ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {(chamber.coherence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Temp</span>
                        <span className="text-slate-200 font-bold">{chamber.temperature.toFixed(2)} mK</span>
                      </div>
                    </div>

                    {/* Expanded Grid Mode: Renders 24h Historical Telemetry Sparkline */}
                    {gridDensity === 'expanded' && (
                      <div className="mt-3 pt-3 border-t border-slate-800/80">
                        <ChamberSparkline data={chamber.history24h} trend={chamber.coherenceTrend} />
                        <div className="mt-2 text-[10px] font-mono text-slate-400 flex justify-between">
                          <span>Merkle: {chamber.merkleHash.slice(0, 10)}...</span>
                          <span>Sync: {chamber.lastSync}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Trigger Action */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 mt-2">
                    <span className="font-mono">Sync {chamber.lastSync}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleUnstableEvent(chamber.id);
                      }}
                      className="p-1 hover:bg-slate-800 rounded text-amber-400/80 hover:text-amber-300 transition-all flex items-center gap-1 cursor-pointer"
                      title="Toggle Unstable / Lock state"
                    >
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>Simulate Anomaly</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* 24-Hour System Stability Trend Section */}
        <MiniD3StabilityChart data={SYSTEM_24H_STABILITY} />

      </div>

      {/* CHAMBER DETAIL MODAL */}
      <ChamberDetailModal
        chamber={selectedDetailChamber}
        onClose={() => setSelectedDetailChamber(null)}
        onToggleStatus={handleToggleUnstableEvent}
      />

      {/* FORENSIC AUDIT MASTER DOSSIER MODAL */}
      {isDossierModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border-emerald-500/50 rounded-2xl w-full max-w-4xl p-6 shadow-2xl relative text-slate-100 max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <QrCode className="w-6 h-6 text-emerald-400" />
                  Forensic Audit Master Dossier & Chamber Field Verification
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  SSoT Genesis Anchor Block #849202 | Post-Quantum Dilithium-5 (ML-DSA-87) Certification
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDossierModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Badges */}
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
              <span className="px-2.5 py-1 rounded bg-emerald-950/90 border-emerald-700/80 text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                LOCKED_FROZEN_v1.2_LTS
              </span>
              <span className="px-2.5 py-1 rounded bg-cyan-950/90 border-cyan-700/80 text-cyan-400 font-semibold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                10/10 REAL_HSM QUORUM
              </span>
              <span className="px-2.5 py-1 rounded bg-purple-950/90 border-purple-700/80 text-purple-400 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                SSoT Δ0 ZERO DRIFT (0.00%)
              </span>
            </div>

            {/* Modal Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2.5">
              <button
                type="button"
                onClick={() => setDossierActiveTab('qr_verify')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  dossierActiveTab === 'qr_verify' ? 'bg-emerald-500 text-slate-950 font-black shadow' : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="w-4 h-4" />
                Master SSoT QR
              </button>

              <button
                type="button"
                onClick={() => setDossierActiveTab('chamber_field_qr')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  dossierActiveTab === 'chamber_field_qr' ? 'bg-emerald-500 text-slate-950 font-black shadow' : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                Chamber Field QR Codes ({chambers.length})
              </button>

              <button
                type="button"
                onClick={() => setDossierActiveTab('camera_scan')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  dossierActiveTab === 'camera_scan' ? 'bg-emerald-500 text-slate-950 font-black shadow' : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="w-4 h-4" />
                Camera Cross-Scan Mode
              </button>

              <button
                type="button"
                onClick={() => setDossierActiveTab('breakdown')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  dossierActiveTab === 'breakdown' ? 'bg-emerald-500 text-slate-950 font-black shadow' : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                Technical Breakdown & Field Links
              </button>
            </div>

            {/* TAB 1: MASTER SSOT QR VERIFICATION */}
            {dossierActiveTab === 'qr_verify' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pr-1">
                <div className="md:col-span-5 flex flex-col items-center justify-center bg-slate-950/80 p-4 rounded-xl border-slate-800 text-center">
                  <ForensicDossierQRCode
                    payloadUrl={`https://zyrquen.internal/verify?block=849202&merkle=0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68&status=LOCKED_FROZEN_v1.2_LTS&seals=14902`}
                    size={190}
                  />
                  <div className="mt-3 flex flex-col gap-1.5 w-full max-w-xs font-mono text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText('https://zyrquen.internal/verify?block=849202&merkle=0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68');
                          setCopiedUrl(true);
                          setTimeout(() => setCopiedUrl(false), 2000);
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                      <span>{copiedUrl ? 'Dossier URI Copied' : 'Copy Verification URI'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDossierActiveTab('chamber_field_qr')}
                      className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-800/80 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer font-bold"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>View Individual Chamber QRs (18)</span>
                    </button>
                  </div>
                </div>

                <div className="md:col-span-7 bg-slate-950/80 p-4 rounded-xl border-slate-800 font-mono text-xs space-y-3">
                  <div className="text-emerald-400 font-bold border-b border-slate-800 pb-1.5 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Cryptographic Forensic Identity Invariants</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px]">Anchor Merkle Root Digest:</span>
                    <p className="text-cyan-400 font-bold break-all bg-slate-900 p-2 rounded border-slate-800 mt-0.5 text-[11px]">
                      0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-900 p-2 rounded border-slate-800">
                      <span className="text-slate-500 text-[10px] block">Anchor Block Height:</span>
                      <span className="text-emerald-400 font-bold">#849202 (LTS SSoT)</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border-slate-800">
                      <span className="text-slate-500 text-[10px] block">Cryptographic Scheme:</span>
                      <span className="text-purple-300 font-bold">Dilithium-5 (ML-DSA-87)</span>
                    </div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border-slate-800 text-[11px]">
                    <span className="text-slate-500 text-[10px] block">Statutory Evidence Standard:</span>
                    <span className="text-slate-200">Thai Electronic Transactions Act B.E. 2544 (Sec 9, 26, 28)</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CHAMBER FIELD QR CODES (DYNAMIC PER-CHAMBER GENERATION) */}
            {dossierActiveTab === 'chamber_field_qr' && (
              <ChamberFieldQRSection
                chambers={chambers}
                selectedChamberIds={selectedChamberIds}
                onSimulateScan={(res) => {
                  setSimulatedScanResult(res);
                  setDossierActiveTab('camera_scan');
                }}
              />
            )}

            {/* TAB 3: CAMERA CROSS-SCAN MODE */}
            {dossierActiveTab === 'camera_scan' && (
              <div className="bg-slate-950 p-5 rounded-xl border-slate-800 text-center font-mono space-y-4">
                <div className="flex items-center justify-center gap-2 text-cyan-400 font-bold text-sm">
                  <Scan className="w-5 h-5" />
                  <span>Optical Camera Cross-Scan Field Simulation</span>
                </div>
                {simulatedScanResult ? (
                  <div className="bg-emerald-950/80 border-emerald-500/80 p-4 rounded-xl text-left space-y-2">
                    <div className="text-emerald-400 font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Decoded Valid Field Scan Result:</span>
                    </div>
                    <p className="text-xs text-slate-200 break-all bg-slate-900 p-3 rounded border-slate-800">
                      {simulatedScanResult}
                    </p>
                    <div className="text-[11px] text-emerald-300 flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verified against Genesis Block #849202 Merkle Leaf invariant. SSoT Δ0 Confirmed.</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 border-2 border-dashed border-slate-800 rounded-xl text-slate-500 text-xs space-y-3">
                    <p>No active camera detected in container preview. Click below to simulate scanning a field tag:</p>
                    <button
                      type="button"
                      onClick={() => setSimulatedScanResult(`CHAMBER_VERIFIED: CH-001 (Cryo Array Alpha-1) | Coherence: 99.8% | Temp: 14.82mK | Leaf: 0x8f92a1c412e4`)}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs cursor-pointer"
                    >
                      Simulate Chamber Tag Scan (CH-001)
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: DOSSIER TECHNICAL BREAKDOWN */}
            {dossierActiveTab === 'breakdown' && (
              <div className="bg-slate-950 p-4 rounded-xl border-slate-800 font-mono text-xs space-y-4 overflow-y-auto max-h-[58vh]">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-emerald-400 font-bold">18-Chamber Field Verification Roster</span>
                  <button
                    type="button"
                    onClick={() => printChamberQRCards(chambers)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded text-[11px] cursor-pointer"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Print All 18 Field QRs</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-800">
                  {chambers.map(c => (
                    <div key={c.id} className="py-2.5 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-cyan-400">{c.chamberId}</span>
                        <span className="text-slate-300">{c.name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          c.status === 'pure_green' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                        }`}>
                          {(c.coherence * 100).toFixed(1)}% ({c.status})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-slate-500 text-[10px]">{c.merkleHash.slice(0, 10)}...</code>
                        <button
                          type="button"
                          onClick={() => {
                            setDossierActiveTab('chamber_field_qr');
                          }}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[10px] cursor-pointer"
                        >
                          View QR
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsDossierModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold rounded-lg cursor-pointer"
              >
                Close Master Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 14,902 BATCH AUDIT SIMULATION MODAL */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border-cyan-500/50 rounded-2xl w-full max-w-3xl p-6 shadow-2xl relative text-slate-100 max-h-[92vh] overflow-y-auto space-y-5 font-mono text-xs">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Zap className="w-6 h-6 text-cyan-400" />
                  14,902 Batch Forensic Chamber Audit Engine
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated High-Throughput HSM Dilithium-5 Attestation Run
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-950 p-3 rounded-xl border-slate-800">
                <span className="text-slate-500 text-[10px] block">Total Batch Chambers</span>
                <span className="text-xl font-bold text-white">{TOTAL_BATCH_CHAMBERS.toLocaleString()}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border-slate-800">
                <span className="text-slate-500 text-[10px] block">Verified Passed</span>
                <span className="text-xl font-bold text-emerald-400">{PASSED_BATCH_CHAMBERS.toLocaleString()}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border-slate-800">
                <span className="text-slate-500 text-[10px] block">Unstable / Quarantined</span>
                <span className="text-xl font-bold text-amber-400">{UNSTABLE_BATCH_CHAMBERS}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-slate-950 p-4 rounded-xl border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Attestation Pipeline Progress</span>
                <span className="text-cyan-400 font-bold">{batchProgress}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${batchProgress}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                disabled={isBatchRunning}
                onClick={handleStartBatchVerification}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold rounded-lg cursor-pointer flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>{isBatchRunning ? 'Running Verification...' : 'Execute 14,902 Batch Sweep'}</span>
              </button>

              <button
                type="button"
                onClick={() => generateForensicBatchPDF(TOTAL_BATCH_CHAMBERS, PASSED_BATCH_CHAMBERS, UNSTABLE_BATCH_CHAMBERS, signerMetadata)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg cursor-pointer flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Download / Print Statutory PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRIORITY LOCKDOWN QUEUE DRAWER */}
      {isLockdownDrawerOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-end z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border-l border-rose-500/40 w-full max-w-md p-6 h-full shadow-2xl flex flex-col justify-between font-mono text-xs">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                  <ShieldAlert className="w-5 h-5" />
                  <span>Priority Lockdown Queue ({priorityLockdownQueue.length})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLockdownDrawerOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {priorityLockdownQueue.length === 0 ? (
                <div className="p-6 text-center text-slate-500 border-slate-800 rounded-xl space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="font-bold text-slate-300">All Chambers Operating Normative</p>
                  <p className="text-[11px]">No chambers currently below 90% coherence threshold.</p>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[70vh]">
                  {priorityLockdownQueue.map(c => (
                    <div key={c.id} className="p-3 bg-rose-950/30 border-rose-600/70 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-rose-300">{c.chamberId} — {c.name}</span>
                        <span className="px-2 py-0.5 bg-rose-900/80 text-rose-200 rounded text-[10px] font-bold">
                          {(c.coherence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Cryo Temp: {c.temperature.toFixed(2)} mK</span>
                        <span>Sync: {c.lastSync}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          handleToggleUnstableEvent(c.id);
                        }}
                        className="w-full py-1.5 bg-rose-600 hover:bg-rose-500 text-slate-950 font-bold rounded text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Recalibrate & Restore SSoT Baseline</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsLockdownDrawerOpen(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold cursor-pointer"
            >
              Close Queue
            </button>
          </div>
        </div>
      )}

      {/* BROWSER TOAST ALERTS */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toastAlerts.map(toast => (
          <div
            key={toast.id}
            className="p-3.5 bg-slate-900 border-rose-500/80 rounded-xl shadow-2xl text-slate-100 font-mono text-xs flex items-start gap-3 pointer-events-auto animate-in slide-in-from-right duration-200"
          >
            <Siren className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="flex-1">
              <div className="flex justify-between items-center mb-0.5">
                <span className="font-bold text-rose-300">{toast.chamberId} Warning</span>
                <span className="text-[10px] text-slate-500">{toast.timestamp}</span>
              </div>
              <p className="text-[11px] text-slate-300">
                {toast.chamberName} Coherence dropped to <strong className="text-rose-400">{(toast.coherence * 100).toFixed(1)}%</strong> (&lt;90% threshold).
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleDismissToast(toast.id)}
              className="text-slate-500 hover:text-white p-0.5 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
};

export default SovereignChamberConsole;
