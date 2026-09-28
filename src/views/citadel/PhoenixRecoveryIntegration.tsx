/**
 * ZYRQUEN Ω∞ Phoenix Recovery Integration (Phase 10)
 * 2-Column Layout: Citadel Network Atlas + Phoenix Recovery Pipeline
 */
import React from 'react';
import CitadelNetworkAtlas from './CitadelNetworkAtlas';
import PhoenixPipeline from '../recovery/PhoenixPipeline';
import { Flame, Network } from 'lucide-react';

export const PhoenixRecoveryIntegration: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-[#080d1a] border border-cyan-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-mono font-black text-white">
              Citadel Atlas &amp; Phoenix Recovery Integration (Phase 10)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-sans">
            การเชื่อมต่อ Topology Map เข้ากับระบบตรวจจับข้อผิดพลาดและกู้คืนสถานะอัตโนมัติ (Self-Healing Runtime)
          </p>
        </div>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <CitadelNetworkAtlas />
        <PhoenixPipeline />
      </div>
    </div>
  );
};

export default PhoenixRecoveryIntegration;
