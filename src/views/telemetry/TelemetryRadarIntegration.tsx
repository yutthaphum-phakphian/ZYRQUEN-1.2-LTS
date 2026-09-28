/**
 * ZYRQUEN Ω∞ Telemetry & Radar Integration View (Phase 8)
 * Unified Side-by-side Telemetry Dashboard G16 & Quantum Radar Mk-III
 */
import React from 'react';
import TelemetryDashboardG16 from './TelemetryDashboardG16';
import QuantumRadarMkIII from './QuantumRadarMkIII';
import { Radio, Activity } from 'lucide-react';

export const TelemetryRadarIntegration: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-[#080d1a] border border-cyan-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl sm:text-2xl font-mono font-black text-white">
              Telemetry &amp; Quantum Radar Integration (Phase 8)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-sans">
            การผสานแดชบอร์ด Telemetry Realtime เข้ากับระบบ Holographic Quantum Radar Mk-III
          </p>
        </div>
      </div>

      {/* Side-by-Side 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Telemetry Dashboard G16 (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          <TelemetryDashboardG16 />
        </div>

        {/* Right: Quantum Radar Mk-III (5 Columns) */}
        <div className="lg:col-span-5">
          <QuantumRadarMkIII />
        </div>
      </div>
    </div>
  );
};

export default TelemetryRadarIntegration;
