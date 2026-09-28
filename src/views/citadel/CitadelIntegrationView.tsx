/**
 * ZYRQUEN Ω∞ Citadel Integration View (Phase 9)
 * 3-Column Layout: Telemetry Dashboard G16 + Quantum Radar Mk-III + Citadel Network Atlas
 */
import React from 'react';
import TelemetryDashboardG16 from '../telemetry/TelemetryDashboardG16';
import QuantumRadarMkIII from '../telemetry/QuantumRadarMkIII';
import CitadelNetworkAtlas from './CitadelNetworkAtlas';
import { Network, Server } from 'lucide-react';

export const CitadelIntegrationView: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-[#080d1a] border border-cyan-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl sm:text-2xl font-mono font-black text-white">
              Citadel Network Atlas &amp; Multi-Agent Integration (Phase 9)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-sans">
            ภาพรวมระบบสหพันธ์ Multi-Agent Federation, Topology Map และ Telemetry Quantum Radar
          </p>
        </div>
      </div>

      {/* 3-Column Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Telemetry Dashboard G16 */}
        <div className="lg:col-span-1 space-y-6">
          <TelemetryDashboardG16 />
        </div>

        {/* Middle: Quantum Radar Mk-III */}
        <div className="lg:col-span-1">
          <QuantumRadarMkIII />
        </div>

        {/* Right: Citadel Network Atlas */}
        <div className="lg:col-span-1">
          <CitadelNetworkAtlas />
        </div>
      </div>
    </div>
  );
};

export default CitadelIntegrationView;
