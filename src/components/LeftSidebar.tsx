import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layers, 
  Cpu, 
  ShieldCheck, 
  Terminal, 
  Radio, 
  Activity, 
  Database, 
  Key, 
  FileCheck, 
  GitBranch, 
  Volume2, 
  Eye, 
  Lock, 
  Scale, 
  Sparkles, 
  Globe,
  Sliders,
  X,
  PanelLeftClose,
  PanelLeft,
  LayoutDashboard,
  Search,
  ChevronRight
} from 'lucide-react';
import { SOVEREIGN_CHAMBERS, OPERATING_MODULES, CANONICAL_CONSTANTS } from '../data/sovereignData.ts';
import { Chamber, OperatingModule, ViewType } from '../types.ts';
import { NAVIGATION_ITEMS } from './Navigation.tsx';
import { playTone } from './AudioSynthesizer.ts';

export interface LeftSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle?: () => void;
  currentView?: ViewType;
  onSelectView?: (view: ViewType) => void;
  selectedChamberId?: string;
  onSelectChamber?: (id: string) => void;
  liveCryo?: number;
}

const CHAMBER_ICONS: Record<string, React.ElementType> = {
  '00': Database,
  '01': Key,
  '02': FileCheck,
  '03': Scale,
  '04': Cpu,
  '05': GitBranch,
  '06': ShieldCheck,
  '07': Activity,
  '08': Lock,
  '09': Radio,
  '10': Sliders,
  '11': FileCheck,
  '12': Lock,
  '13': Globe,
  '14': Eye,
  '15': Volume2,
  '16': Sparkles,
  '17': Layers,
};

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  isOpen,
  onClose,
  onToggle,
  currentView = 'dashboard',
  onSelectView,
  selectedChamberId = '00',
  onSelectChamber,
  liveCryo = 14.98,
}) => {
  const [activeTab, setActiveTab] = useState<'views' | 'chambers' | 'modules'>('views');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredViews = NAVIGATION_ITEMS.filter(
    (v) =>
      v.labelEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.labelTh.includes(searchQuery) ||
      v.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChambers = SOVEREIGN_CHAMBERS.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.includes(searchQuery) ||
      c.nameTh.includes(searchQuery)
  );

  const filteredModules = OPERATING_MODULES.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.number.includes(searchQuery)
  );

  const handleSelectViewItem = (viewId: ViewType) => {
    playTone(720, 0.05);
    if (onSelectView) {
      onSelectView(viewId);
    }
    // Auto close drawer on mobile/tablet viewport
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleSelectChamberItem = (chamberId: string) => {
    playTone(640, 0.05);
    if (onSelectChamber) {
      onSelectChamber(chamberId);
    }
    if (onSelectView) {
      onSelectView('chambers');
    }
    // Auto close drawer on mobile/tablet viewport
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile & Tablet Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              playTone(400, 0.05);
              onClose();
            }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
            aria-hidden="true"
          />

          {/* Sidebar Panel */}
          <motion.aside
            initial={{ x: -340, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -340, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed lg:sticky top-0 lg:top-[112px] left-0 z-50 lg:z-30 w-80 max-w-[calc(100vw-2rem)] bg-[#060a14]/98 border-r border-cyan-500/20 flex flex-col h-screen lg:h-[calc(100vh-7.5rem)] shrink-0 select-none overflow-y-auto overflow-x-hidden break-words backdrop-blur-2xl shadow-[8px_0_30px_-10px_rgba(0,0,0,0.8)]"
          >
            {/* Sidebar Top Header & Close Button */}
            <div className="p-3.5 border-b border-cyan-500/20 bg-gradient-to-r from-slate-950 via-[#070c1a] to-slate-950 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <PanelLeft className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-mono text-xs font-bold text-zinc-100 tracking-wider">
                    SOVEREIGN MENU
                  </span>
                  <div className="text-[10px] font-mono text-cyan-400/80">
                    NAVIGATION & CHAMBERS
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => {
                  playTone(480, 0.05);
                  onClose();
                }}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border-white/10 hover:border-cyan-500/30 text-zinc-400 hover:text-zinc-100 transition-colors"
                title="Close Sidebar / ปิดเมนูข้าง (Ctrl+B or [)"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            {/* Sovereign Principal Card */}
            <div className="p-3.5 border-b border-slate-800/80 bg-slate-950/60">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">Sovereign Principal</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border-amber-500/30">
                  OMEGA-1
                </span>
              </div>
              <div className="font-semibold text-sm text-slate-100 flex items-center space-x-1.5 truncate">
                <span className="text-cyan-400 font-mono">#EP-01</span>
                <span className="truncate">นายยุทธภูมิ พากเพียร</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-900 font-mono">
                <span>Boundary: <strong className="text-cyan-300">{CANONICAL_CONSTANTS.PLATFORM_BOUNDARY}</strong></span>
                <span className="text-emerald-400 font-semibold">10/10 REAL_HSM</span>
              </div>
            </div>

            {/* Navigation Mode Switcher: 18 Views vs 18 Chambers vs 17 Modules */}
            <div className="p-2 border-b border-slate-800/70 bg-slate-900/30">
              <div className="flex rounded-md bg-slate-950 p-1 border-slate-800/90 text-[11px] font-mono">
                <button
                  onClick={() => {
                    playTone(520, 0.04);
                    setActiveTab('views');
                  }}
                  className={`flex-1 py-1 rounded text-center font-medium transition-all ${
                    activeTab === 'views'
                      ? 'bg-cyan-950 text-cyan-200 border-cyan-800/60 shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Views ({NAVIGATION_ITEMS.length})
                </button>
                <button
                  onClick={() => {
                    playTone(520, 0.04);
                    setActiveTab('chambers');
                  }}
                  className={`flex-1 py-1 rounded text-center font-medium transition-all ${
                    activeTab === 'chambers'
                      ? 'bg-cyan-950 text-cyan-200 border-cyan-800/60 shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  18 Chambers
                </button>
                <button
                  onClick={() => {
                    playTone(520, 0.04);
                    setActiveTab('modules');
                  }}
                  className={`flex-1 py-1 rounded text-center font-medium transition-all ${
                    activeTab === 'modules'
                      ? 'bg-cyan-950 text-cyan-200 border-cyan-800/60 shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  17 Mod
                </button>
              </div>

              {/* Quick Search */}
              <div className="mt-2 relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={
                    activeTab === 'views'
                      ? 'Filter Views...'
                      : activeTab === 'chambers'
                      ? 'Filter Chambers...'
                      : 'Filter Modules...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/90 border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/70 font-mono"
                />
              </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {activeTab === 'views' ? (
                filteredViews.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectViewItem(item.id)}
                      className={`w-full text-left p-2 rounded-xl transition-all flex items-center justify-between border select-none group ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-950/80 to-violet-950/50 border-cyan-500/60 text-white shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                          : 'bg-slate-950/40 border-transparent hover:bg-slate-900/60 hover:border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div
                          className={`p-1.5 rounded-lg transition-colors ${
                            isActive ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-900 text-slate-400 group-hover:text-slate-200'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                            <span className={isActive ? 'text-white' : 'text-zinc-200'}>{item.labelEn}</span>
                            {item.shortcut && (
                              <span className="text-[9px] font-mono text-zinc-500 bg-black/40 px-1 py-0.2 rounded border-white/5">
                                {item.shortcut}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-500 truncate">
                            {item.labelTh}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 ml-2 shrink-0">
                        {item.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold tracking-wider ${
                              isActive
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                : 'bg-black/40 text-zinc-500 border-white/5'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'text-cyan-400 translate-x-0.5' : 'text-zinc-600 opacity-0 group-hover:opacity-100'}`} />
                      </div>
                    </button>
                  );
                })
              ) : activeTab === 'chambers' ? (
                filteredChambers.map((chamber: Chamber) => {
                  const Icon = CHAMBER_ICONS[chamber.id] || Layers;
                  const isSelected = selectedChamberId === chamber.id;
                  return (
                    <button
                      key={chamber.id}
                      onClick={() => handleSelectChamberItem(chamber.id)}
                      className={`w-full text-left p-2 rounded-xl transition-all flex items-start space-x-2.5 border ${
                        isSelected
                          ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-100 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                          : 'bg-slate-950/40 border-transparent hover:bg-slate-900/60 hover:border-slate-800 text-slate-300'
                      }`}
                    >
                      <div
                        className={`mt-0.5 p-1.5 rounded-lg ${
                          isSelected ? 'bg-cyan-900/80 text-cyan-300' : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-semibold text-cyan-400">
                            CH-{chamber.id}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                              chamber.status === 'LOCKED'
                                ? 'bg-purple-950/80 text-purple-300 border-purple-800/40'
                                : chamber.status === 'SEALED'
                                ? 'bg-blue-950/80 text-blue-300 border-blue-800/40'
                                : chamber.status === 'ENFORCED'
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/40'
                                : 'bg-cyan-950/80 text-cyan-300 border-cyan-800/40'
                            }`}
                          >
                            {chamber.status}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-slate-200 truncate mt-0.5">
                          {chamber.name}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                          {chamber.nameTh}
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                filteredModules.map((module: OperatingModule) => (
                  <div
                    key={module.id}
                    className="p-2.5 rounded-xl bg-slate-950/50 border-slate-800/80 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono text-cyan-400 font-bold">MOD {module.number}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono border-emerald-800/40">
                        {module.status}
                      </span>
                    </div>
                    <div className="font-semibold text-xs text-slate-200 truncate">{module.name}</div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 font-mono">
                      <span className="text-cyan-300">{module.stat}</span>
                      <span className="text-slate-500 text-[10px]">{module.category}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Emergency Thermal & Quarantine Guard Monitor */}
            <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-slate-400 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Thermal Fail-Closed Guard</span>
                </span>
                <span className="font-mono text-emerald-400 font-semibold">{liveCryo.toFixed(2)} mK</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border-slate-800">
                <div
                  className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (liveCryo / 85.0) * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>Stabilized: 14.98 mK</span>
                <span className="text-amber-400/80">Quarantine Cap: 85.0 °C</span>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

