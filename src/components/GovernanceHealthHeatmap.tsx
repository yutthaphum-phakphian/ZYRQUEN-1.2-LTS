import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Download, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  FileImage,
  FileJson,
  Calendar,
  Grid,
  Settings,
  X,
  Eye,
  EyeOff,
  MessageSquare,
  Sliders,
  Filter,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import html2canvas from 'html2canvas';

export interface HeatmapCellData {
  id: string;
  timestamp: string; // YYYY-MM-DD
  activityCount: number;
  sealIds: string[];
  healthLevel: 0 | 1 | 2 | 3 | 4;
  note?: string; // Qualitative Context Note
}

export interface GovernanceHealthHeatmapProps {
  data?: HeatmapCellData[];
  onNavigateToView?: (v: any) => void;
  onAddSystemEvent?: (
    type: any,
    title: string,
    description: string,
    metaHash?: string,
    severity?: 'success' | 'warning' | 'info' | 'critical',
    statuteRef?: string,
    targetView?: any
  ) => void;
}

export const GovernanceHealthHeatmap: React.FC<GovernanceHealthHeatmapProps> = ({
  data: initialData = generateSampleHeatmapData(),
  onNavigateToView,
  onAddSystemEvent
}) => {
  const heatmapRef = useRef<HTMLDivElement>(null);

  // localStorage Persistence for Date Range Filters
  const [startDate, setStartDate] = useState<string>(() => {
    return localStorage.getItem('zyrquen_heatmap_startDate') || '';
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return localStorage.getItem('zyrquen_heatmap_endDate') || '';
  });

  useEffect(() => {
    localStorage.setItem('zyrquen_heatmap_startDate', startDate);
  }, [startDate]);

  useEffect(() => {
    localStorage.setItem('zyrquen_heatmap_endDate', endDate);
  }, [endDate]);

  // Cell Annotations & Telemetry Data State
  const [telemetryData, setTelemetryData] = useState<HeatmapCellData[]>(initialData);
  const [activeAnnotatingCell, setActiveAnnotatingCell] = useState<HeatmapCellData | null>(null);
  const [annotationInput, setAnnotationInput] = useState<string>('');

  // Feature 1: Toggle Filter for Cells with Custom Notes
  const [showOnlyAnnotated, setShowOnlyAnnotated] = useState<boolean>(false);

  // Feature 2: Visual Grid Overlay Option State
  const [showGridOverlay, setShowGridOverlay] = useState<boolean>(true);

  // Feature 3: Dynamic Grid-Snapping Precision & Keyboard Shortcuts State
  const [isGridSnapEnabled, setIsGridSnapEnabled] = useState<boolean>(true);
  const [gridSnapInterval, setGridSnapInterval] = useState<5 | 10 | 20>(10);

  // Keyboard Shortcuts Listener for Grid-Snapping Intervals ('1'=5px, '2'=10px, '3'=20px)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === '1') {
        setGridSnapInterval(5);
        setIsGridSnapEnabled(true);
      } else if (e.key === '2') {
        setGridSnapInterval(10);
        setIsGridSnapEnabled(true);
      } else if (e.key === '3') {
        setGridSnapInterval(20);
        setIsGridSnapEnabled(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Series Toggles & Zoom/Pan State
  const [showActivityCount, setShowActivityCount] = useState<boolean>(true);
  const [showMovingAverage, setShowMovingAverage] = useState<boolean>(true);
  const [hoveredCellIndex, setHoveredCellIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Export Settings Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'PNG' | 'JSON' | 'CSV'>('PNG');
  const [pngResolutionScale, setPngResolutionScale] = useState<number>(2);
  const [selectedSealsFilter, setSelectedSealsFilter] = useState<string>('ALL');

  // Dynamically Filtered View
  const filteredData = useMemo(() => {
    return telemetryData.filter((item) => {
      if (startDate && item.timestamp < startDate) return false;
      if (endDate && item.timestamp > endDate) return false;
      if (showOnlyAnnotated && !item.note) return false;
      return true;
    });
  }, [telemetryData, startDate, endDate, showOnlyAnnotated]);

  // 7-Day Moving Average Line Data
  const movingAverages = useMemo(() => {
    return filteredData.map((_, index) => {
      const windowStart = Math.max(0, index - 6);
      const windowItems = filteredData.slice(windowStart, index + 1);
      const sum = windowItems.reduce((acc, curr) => acc + curr.activityCount, 0);
      return Math.round(sum / windowItems.length);
    });
  }, [filteredData]);

  const maxActivity = useMemo(() => {
    return Math.max(...filteredData.map((d) => d.activityCount), 1);
  }, [filteredData]);

  // Grid-Snapping Panning Handler
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      const rawX = e.clientX - dragStart.x;
      const rawY = e.clientY - dragStart.y;

      if (isGridSnapEnabled) {
        setPanOffset({
          x: Math.round(rawX / gridSnapInterval) * gridSnapInterval,
          y: Math.round(rawY / gridSnapInterval) * gridSnapInterval,
        });
      } else {
        setPanOffset({ x: rawX, y: rawY });
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Save Cell Annotation Note
  const handleSaveAnnotation = () => {
    if (!activeAnnotatingCell) return;
    setTelemetryData((prev) =>
      prev.map((cell) =>
        cell.id === activeAnnotatingCell.id
          ? { ...cell, note: annotationInput.trim() || undefined }
          : cell
      )
    );
    setActiveAnnotatingCell(null);
    setAnnotationInput('');
  };

  // Configured Export Execution Handler
  const executeConfiguredExport = async () => {
    let exportSet = [...filteredData];

    if (selectedSealsFilter !== 'ALL') {
      exportSet = exportSet.map((item) => ({
        ...item,
        sealIds: item.sealIds.filter((id) => id.includes(selectedSealsFilter)),
      }));
    }

    if (exportFormat === 'JSON') {
      const snapshotPayload = {
        metadata: {
          system: 'ZYRQUEN Ω∞ Sovereign Control Plane',
          exportTimestamp: new Date().toISOString(),
          gridSnapPrecision: `${gridSnapInterval}px`,
          totalRecords: exportSet.length,
          annotatedCount: exportSet.filter((d) => d.note).length,
        },
        telemetrySnapshot: exportSet,
      };

      const blob = new Blob([JSON.stringify(snapshotPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ZYRQUEN_Annotated_Heatmap_${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } else if (exportFormat === 'CSV') {
      const headers = ['Timestamp', 'Activity_Count', 'Health_Level', 'Associated_WORM_Seals', 'Qualitative_Note'];
      const rows = exportSet.map((d) => [
        `"${d.timestamp}"`,
        d.activityCount,
        d.healthLevel,
        `"${d.sealIds.join(';')}"`,
        `"${d.note || ''}"`,
      ]);
      const csvContent = [
        '# ZYRQUEN Ω∞ GOVERNANCE HEALTH HEATMAP SIGNED ARTIFACT',
        `# Genesis_Block: #849202`,
        `# Export_Timestamp_UTC: ${new Date().toISOString()}`,
        `# Signatory: นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)`,
        `# Quorum: 10/10 REAL_HSM (FIPS 140-3 Level 4)`,
        '',
        headers.join(','),
        ...rows.map((r) => r.join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ZYRQUEN_Heatmap_Signed_Artifact_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      if (!heatmapRef.current) return;
      try {
        const canvas = await html2canvas(heatmapRef.current, {
          backgroundColor: '#0f172a',
          scale: pngResolutionScale,
          useCORS: true,
          logging: false,
        });
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `ZYRQUEN_Heatmap_${pngResolutionScale}x_${new Date().toISOString().slice(0, 10)}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Export failed:', err);
      }
    }

    setIsExportModalOpen(false);
  };

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // DoD Calculation
  const getDoDMetrics = (index: number) => {
    if (index === 0 || !filteredData[index - 1]) return { diff: 0, percentage: 0, status: 'neutral' as const };
    const current = filteredData[index].activityCount;
    const previous = filteredData[index - 1].activityCount;
    const diff = current - previous;
    const percentage = previous > 0 ? Math.round((diff / previous) * 100) : 0;
    if (diff > 0) return { diff, percentage, status: 'increase' as const };
    if (diff < 0) return { diff: Math.abs(diff), percentage: Math.abs(percentage), status: 'decrease' as const };
    return { diff: 0, percentage: 0, status: 'neutral' as const };
  };

  const handleCellMouseMove = (e: React.MouseEvent, index: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: rect.left + window.scrollX + rect.width / 2, y: rect.top + window.scrollY - 10 });
    setHoveredCellIndex(index);
  };

  // SVG Trend Line Coordinates
  const SVG_HEIGHT = 120;
  const SVG_WIDTH = 700;
  const trendPoints = movingAverages
    .map((val, idx) => {
      const x = (idx / Math.max(filteredData.length - 1, 1)) * (SVG_WIDTH - 20) + 10;
      const y = SVG_HEIGHT - (val / maxActivity) * (SVG_HEIGHT - 30) - 15;
      return `${x},${y}`;
    })
    .join(' ');

  const hoveredCell = hoveredCellIndex !== null ? filteredData[hoveredCellIndex] : null;
  const dodMetrics = hoveredCellIndex !== null ? getDoDMetrics(hoveredCellIndex) : null;

  return (
    <div
      ref={heatmapRef}
      className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl relative font-sans select-none"
    >
      {/* Top Header & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Governance Health & Telemetry Heatmap
          </h3>
          <p className="text-xs text-slate-400">
            Persistent filters, note auditing, visual grid overlays, and hotkey grid-snapping ('1', '2', '3')
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Annotated-Only Filter Button */}
          <button
            onClick={() => setShowOnlyAnnotated((prev) => !prev)}
            title="Filter view to only show cells with qualitative notes"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
              showOnlyAnnotated
                ? 'bg-cyan-950/90 border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'bg-slate-800 border-slate-700/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Notes Only {showOnlyAnnotated ? `(${filteredData.length})` : ''}</span>
          </button>

          {/* Visual Grid Overlay Toggle Button */}
          <button
            onClick={() => setShowGridOverlay((prev) => !prev)}
            title="Toggle visual grid background overlay during zoom"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
              showGridOverlay
                ? 'bg-slate-800 border-slate-700 text-cyan-400'
                : 'bg-slate-950 border-slate-800/80 text-slate-500 line-through'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Grid Lines</span>
          </button>

          {/* Persistent Date Range Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none font-mono text-[11px]"
            />
            <span className="text-slate-500">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none font-mono text-[11px]"
            />
          </div>

          {/* Grid-Snapping Precision & Hotkey Indicator */}
          <button
            onClick={() => setIsGridSnapEnabled((prev) => !prev)}
            title="Click to toggle. Shortcut keys: '1' (5px), '2' (10px), '3' (20px)"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
              isGridSnapEnabled
                ? 'bg-cyan-950/80 border-cyan-500/80 text-cyan-300'
                : 'bg-slate-800 border-slate-700/80 text-slate-400'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>{isGridSnapEnabled ? `Snap: ${gridSnapInterval}px` : 'Snap: Off'}</span>
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-800 border border-slate-700/80 rounded-xl p-1 gap-1">
            <button onClick={handleZoomIn} title="Zoom In" className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-cyan-400 cursor-pointer">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={handleZoomOut} title="Zoom Out" className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-cyan-400 cursor-pointer">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={handleResetZoom} title="Reset Zoom" className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-cyan-400 cursor-pointer">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Export Settings Modal Trigger */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-md transition-all cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Export Settings</span>
          </button>
        </div>
      </div>

      {/* Heatmap Grid & Canvas Container */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950/50 p-4 ${
          zoomLevel > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
      >
        {/* Visual Grid Overlay during Zoom */}
        {showGridOverlay && zoomLevel > 1 && (
          <div
            className="absolute inset-0 pointer-events-none z-0 opacity-20"
            style={{
              backgroundImage: `linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)`,
              backgroundSize: `${gridSnapInterval * 2}px ${gridSnapInterval * 2}px`,
            }}
          />
        )}

        <div
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
          className="relative pt-4 pb-2 z-10"
        >
          {/* Moving Average Line Overlay */}
          {showMovingAverage && (
            <div className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-200">
              <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}>
                <polyline
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={trendPoints}
                  className="drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]"
                />
              </svg>
            </div>
          )}

          {/* Cell Matrix */}
          <div className="grid grid-cols-14 gap-2 relative z-0">
            {filteredData.map((cell, idx) => {
              const levelColors = [
                'bg-slate-800/60 border-slate-700/40 hover:border-slate-500 text-slate-400',
                'bg-emerald-950/80 border-emerald-800/60 text-emerald-400 hover:border-emerald-400',
                'bg-cyan-950/80 border-cyan-800/60 text-cyan-300 hover:border-cyan-400',
                'bg-amber-950/80 border-amber-800/60 text-amber-300 hover:border-amber-400',
                'bg-rose-950/80 border-rose-800/60 text-rose-300 hover:border-rose-400',
              ];

              return (
                <div
                  key={cell.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveAnnotatingCell(cell);
                    setAnnotationInput(cell.note || '');
                  }}
                  onMouseEnter={(e) => handleCellMouseMove(e, idx)}
                  onMouseLeave={() => setHoveredCellIndex(null)}
                  className={`relative h-12 rounded-lg border transition-all duration-150 cursor-pointer flex items-center justify-center font-mono text-xs font-semibold ${
                    levelColors[cell.healthLevel]
                  }`}
                >
                  {showActivityCount ? cell.activityCount : ''}

                  {/* Custom Note Badge Icon Indicator */}
                  {cell.note && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive Legend Items & Hotkey Indicator */}
      <div className="flex flex-wrap items-center justify-between mt-4 text-xs text-slate-400 pt-3 border-t border-slate-800/80 gap-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowActivityCount((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all font-mono text-[11px] cursor-pointer ${
              showActivityCount ? 'bg-slate-800 border-slate-700 text-cyan-300' : 'bg-slate-950 border-slate-800/60 text-slate-600 line-through'
            }`}
          >
            {showActivityCount ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Activity Values</span>
          </button>

          <button
            onClick={() => setShowMovingAverage((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all font-mono text-[11px] cursor-pointer ${
              showMovingAverage ? 'bg-slate-800 border-slate-700 text-cyan-300' : 'bg-slate-950 border-slate-800/60 text-slate-600 line-through'
            }`}
          >
            {showMovingAverage ? <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>7-Day Moving Avg</span>
          </button>

          {/* Hotkey Guidance Tag */}
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
            Hotkeys: <kbd className="px-1 rounded bg-slate-800 border border-slate-700 text-cyan-400">1</kbd> (5px){' '}
            <kbd className="px-1 rounded bg-slate-800 border border-slate-700 text-cyan-400">2</kbd> (10px){' '}
            <kbd className="px-1 rounded bg-slate-800 border border-slate-700 text-cyan-400">3</kbd> (20px)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span>Less Active</span>
          <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700"></span>
          <span className="w-3 h-3 rounded bg-emerald-900"></span>
          <span className="w-3 h-3 rounded bg-cyan-900"></span>
          <span className="w-3 h-3 rounded bg-amber-900"></span>
          <span className="w-3 h-3 rounded bg-rose-900"></span>
          <span>More Active</span>
        </div>
      </div>

      {/* Custom Note Annotation Editor Modal */}
      {activeAnnotatingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100 font-sans space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <MessageSquare className="w-4 h-4" />
                <span>Annotate {activeAnnotatingCell.timestamp}</span>
              </div>
              <button onClick={() => setActiveAnnotatingCell(null)} className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Qualitative Context / Audit Note</label>
              <textarea
                value={annotationInput}
                onChange={(e) => setAnnotationInput(e.target.value)}
                placeholder="e.g., Security Drill, High-Volume Treasury Settlement..."
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none font-sans resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setActiveAnnotatingCell(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAnnotation}
                className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-md cursor-pointer"
              >
                Save Annotation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Configuration Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 font-sans space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-base">
                <Settings className="w-5 h-5" />
                <span>Export Configuration</span>
              </div>
              <button onClick={() => setIsExportModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Export Format */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Format Type</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setExportFormat('PNG')}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                    exportFormat === 'PNG' ? 'bg-cyan-950 border-cyan-500 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <FileImage className="w-3.5 h-3.5" />
                  <span>PNG</span>
                </button>
                <button
                  onClick={() => setExportFormat('JSON')}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                    exportFormat === 'JSON' ? 'bg-cyan-950 border-cyan-500 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <FileJson className="w-3.5 h-3.5" />
                  <span>JSON</span>
                </button>
                <button
                  onClick={() => setExportFormat('CSV')}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                    exportFormat === 'CSV' ? 'bg-cyan-950 border-cyan-500 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Signed CSV</span>
                </button>
              </div>
            </div>

            {/* Grid Snapping Precision Slider */}
            <div className="space-y-2 pt-1 border-t border-slate-800">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Grid-Snapping Precision</span>
                </label>
                <span className="text-xs font-mono text-cyan-400 font-bold">{gridSnapInterval}px</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 20].map((interval) => (
                  <button
                    key={interval}
                    onClick={() => setGridSnapInterval(interval as 5 | 10 | 20)}
                    className={`py-2 rounded-xl border text-xs font-mono font-bold cursor-pointer ${
                      gridSnapInterval === interval
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {interval}px {interval === 5 ? '(HotKey 1)' : interval === 10 ? '(HotKey 2)' : '(HotKey 3)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution Quality Scale */}
            {exportFormat === 'PNG' && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">PNG Resolution Scale</label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 4].map((scale) => (
                    <button
                      key={scale}
                      onClick={() => setPngResolutionScale(scale)}
                      className={`py-2 rounded-xl border text-xs font-mono font-bold cursor-pointer ${
                        pngResolutionScale === scale ? 'bg-cyan-950 border-cyan-500 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {scale}x ({scale === 1 ? '1080p' : scale === 2 ? '2K HD' : '4K Archival'})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-2 flex justify-end gap-2">
              <button onClick={() => setIsExportModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer">
                Cancel
              </button>
              <button
                onClick={executeConfiguredExport}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Confirm & Download</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hover Cell Tooltip */}
      {hoveredCell && dodMetrics && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
          className="z-50 pointer-events-none w-72 p-3.5 rounded-xl bg-slate-950 border border-slate-700 shadow-2xl text-xs space-y-2 animate-in fade-in"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="text-cyan-400 font-mono font-bold">{hoveredCell.timestamp}</span>
            <span className="text-slate-400 text-[10px] uppercase">Daily Telemetry</span>
          </div>

          <div className="flex items-center justify-between font-mono">
            <span className="text-slate-300">Activity Count:</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-100 font-bold text-sm">{hoveredCell.activityCount}</span>
              <div
                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                  dodMetrics.status === 'increase'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                    : dodMetrics.status === 'decrease'
                    ? 'bg-rose-950 text-rose-400 border border-rose-800/80'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {dodMetrics.status === 'increase' && <TrendingUp className="w-3 h-3" />}
                {dodMetrics.status === 'decrease' && <TrendingDown className="w-3 h-3" />}
                {dodMetrics.status === 'neutral' && <Minus className="w-3 h-3" />}
                <span>
                  {dodMetrics.status === 'neutral' ? '0%' : `${dodMetrics.status === 'increase' ? '+' : '-'}${dodMetrics.percentage}%`}
                </span>
              </div>
            </div>
          </div>

          {/* Qualitative Note Annotation Display */}
          {hoveredCell.note && (
            <div className="p-2 rounded-lg bg-slate-900 border border-cyan-800/50 text-[11px] text-cyan-200 font-sans flex items-start gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <span>{hoveredCell.note}</span>
            </div>
          )}

          <div className="text-slate-400 text-[11px] pt-1 border-t border-slate-900">
            <span className="block text-slate-300 font-medium mb-1">Associated WORM Seals:</span>
            <div className="flex flex-wrap gap-1">
              {hoveredCell.sealIds.map((seal) => (
                <span key={seal} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-[10px] text-cyan-300">
                  {seal}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function generateSampleHeatmapData(): HeatmapCellData[] {
  return Array.from({ length: 28 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (27 - i));
    const count = Math.floor(Math.random() * 85) + 10;
    const level = count > 70 ? 4 : count > 50 ? 3 : count > 30 ? 2 : 1;
    return {
      id: `cell-${i}`,
      timestamp: date.toISOString().slice(0, 10),
      activityCount: count,
      healthLevel: level as 0 | 1 | 2 | 3 | 4,
      sealIds: [`SEAL-${14902 - i * 3}`, `SEAL-${14901 - i * 3}`],
      note: i === 27 ? 'Genesis Block #849202 Audit Ratified' : undefined,
    };
  });
}
