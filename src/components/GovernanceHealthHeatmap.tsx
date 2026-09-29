import React, { useState, useMemo, useRef } from 'react';
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
} from 'lucide-react';
import html2canvas from 'html2canvas';

export interface HeatmapCellData {
  id: string;
  timestamp: string; // ISO String (YYYY-MM-DD)
  activityCount: number;
  sealIds: string[];
  healthLevel: 0 | 1 | 2 | 3 | 4; // 0 = Idle, 4 = Critical Peak
}

export interface GovernanceHealthHeatmapProps {
  data?: HeatmapCellData[];
  onNavigateToView?: (view: any) => void;
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
  data = generateSampleHeatmapData(),
  onNavigateToView,
  onAddSystemEvent,
}) => {
  const heatmapRef = useRef<HTMLDivElement>(null);

  // Requirement 2: Date Range Filter State
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Tooltip & Zoom/Pan State
  const [hoveredCellIndex, setHoveredCellIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Requirement 2: Dynamically Filtered Data View
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (startDate && item.timestamp < startDate) return false;
      if (endDate && item.timestamp > endDate) return false;
      return true;
    });
  }, [data, startDate, endDate]);

  // Recalculate 7-Day Moving Average on Filtered Data
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

  // Requirement 1: 10px Grid Snapping Panning Handler
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      const rawX = e.clientX - dragStart.x;
      const rawY = e.clientY - dragStart.y;
      // Snap offset coordinates to 10px grid increments
      const snappedX = Math.round(rawX / 10) * 10;
      const snappedY = Math.round(rawY / 10) * 10;
      setPanOffset({ x: snappedX, y: snappedY });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Requirement 3: Export Filtered View to Minified JSON Snapshot
  const exportToJSON = () => {
    const snapshotPayload = {
      metadata: {
        system: 'ZYRQUEN Ω∞ Sovereign Control Plane',
        exportTimestamp: new Date().toISOString(),
        totalRecords: filteredData.length,
        appliedFilter: {
          startDate: startDate || 'ALL',
          endDate: endDate || 'ALL',
        },
      },
      telemetrySnapshot: filteredData,
    };

    const jsonString = JSON.stringify(snapshotPayload); // Minified string
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ZYRQUEN_Heatmap_Snapshot_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Image & CSV Exports
  const exportToPNG = async () => {
    if (!heatmapRef.current) return;
    try {
      const canvas = await html2canvas(heatmapRef.current, {
        backgroundColor: '#0f172a',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `ZYRQUEN_Heatmap_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('PNG export failed:', err);
    }
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Activity_Count', 'Health_Level', 'Associated_Seal_IDs'];
    const rows = filteredData.map((d) => [
      `"${d.timestamp}"`,
      d.activityCount,
      d.healthLevel,
      `"${d.sealIds.join(';')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ZYRQUEN_Heatmap_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // DoD calculation
  const getDoDMetrics = (index: number) => {
    if (index === 0 || !filteredData[index - 1]) {
      return { diff: 0, percentage: 0, status: 'neutral' as const };
    }
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
    setTooltipPos({
      x: rect.left + window.scrollX + rect.width / 2,
      y: rect.top + window.scrollY - 10,
    });
    setHoveredCellIndex(index);
  };

  // SVG Coordinates for Trend Line
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
      {/* Top Header & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Governance Health & Telemetry Heatmap
          </h3>
          <p className="text-xs text-slate-400">
            Grid-aligned telemetry panning, date-filtered windowing, and audit seal snapshots
          </p>
        </div>

        {/* Toolbar & Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Requirement 2: Date Range Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none font-mono text-[11px]"
              title="Start Date"
            />
            <span className="text-slate-500">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none font-mono text-[11px]"
              title="End Date"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-slate-400 hover:text-cyan-400 text-[10px] ml-1 underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-800 border border-slate-700/80 rounded-xl p-1 gap-1">
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              title="Reset Zoom"
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Requirement 3: Export JSON Button */}
          <button
            onClick={exportToJSON}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-medium text-xs border border-slate-700/80 transition-all cursor-pointer shadow-sm"
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          {/* CSV & PNG Exports */}
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 text-xs border border-slate-700/80 transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={exportToPNG}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-lg shadow-cyan-950/50 transition-all cursor-pointer"
          >
            <FileImage className="w-3.5 h-3.5" />
            <span>PNG</span>
          </button>
        </div>
      </div>

      {/* Heatmap Grid & Canvas Container */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950/50 p-4 transition-cursor ${
          zoomLevel > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
      >
        {/* Requirement 1: 10px Grid Indicator Badge */}
        {zoomLevel > 1 && (
          <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 rounded px-2 py-0.5 text-[10px] text-cyan-400 font-mono pointer-events-none backdrop-blur-sm">
            <Grid className="w-3 h-3" />
            <span>10px Grid Snap Active</span>
          </div>
        )}

        <div
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
          className="relative pt-4 pb-2"
        >
          {/* Trend Line Overlay */}
          <div className="absolute inset-0 pointer-events-none z-10">
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

          {/* Cells Grid */}
          <div className="grid grid-cols-14 gap-2 relative z-0">
            {filteredData.map((cell, idx) => {
              const levelColors = [
                'bg-slate-800/60 border-slate-700/40 hover:border-slate-500',
                'bg-emerald-950/80 border-emerald-800/60 text-emerald-400 hover:border-emerald-400',
                'bg-cyan-950/80 border-cyan-800/60 text-cyan-300 hover:border-cyan-400',
                'bg-amber-950/80 border-amber-800/60 text-amber-300 hover:border-amber-400',
                'bg-rose-950/80 border-rose-800/60 text-rose-300 hover:border-rose-400',
              ];

              return (
                <div
                  key={cell.id}
                  onMouseEnter={(e) => handleCellMouseMove(e, idx)}
                  onMouseLeave={() => setHoveredCellIndex(null)}
                  className={`h-12 rounded-lg border transition-all duration-150 flex items-center justify-center font-mono text-xs font-semibold cursor-pointer ${
                    levelColors[cell.healthLevel]
                  }`}
                >
                  {cell.activityCount}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between mt-4 text-xs text-slate-400 pt-3 border-t border-slate-800/80">
        <span className="text-cyan-400 font-mono">
          Showing {filteredData.length} records | 7-Day Moving Avg Active
        </span>
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

      {/* Tooltip */}
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
            <span className="text-slate-400 text-[10px] uppercase">Telemetry</span>
          </div>

          <div className="flex items-center justify-between font-mono">
            <span className="text-slate-300">Activity:</span>
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
                  {dodMetrics.status === 'neutral'
                    ? '0%'
                    : `${dodMetrics.status === 'increase' ? '+' : '-'}${dodMetrics.percentage}%`}
                </span>
              </div>
            </div>
          </div>

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
    };
  });
}
