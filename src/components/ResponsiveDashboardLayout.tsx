import React, { useState } from 'react';
import { Menu, X, Shield, Activity, Database, Lock, Cpu } from 'lucide-react';

export interface ResponsiveDashboardLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const ResponsiveDashboardLayout: React.FC<ResponsiveDashboardLayoutProps> = ({
  children,
  activeTab = 'overview',
  onSelectTab,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (tabId: string) => {
    if (onSelectTab) {
      onSelectTab(tabId);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-cyan-500 selection:text-slate-950">
      {/* 📱 Mobile Top Header (แสดงเฉพาะบนมือถือ < lg) */}
      <header className="lg:hidden sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border-cyan-500/30 text-cyan-400">
            <Shield className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-wider text-white">ZYRQUEN Ω∞</span>
            <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              Δ0 SSoT
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-xl bg-slate-800/80 text-slate-200 hover:bg-slate-700 active:scale-95 transition border-slate-700/50"
          aria-label="Toggle Mobile Menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5 text-cyan-400" />}
        </button>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        {/* 📑 Sidebar (Desktop: ฝังซ้ายมือ / Mobile: สไลด์เป็น Drawer) */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 bg-slate-900/98 border-r border-slate-800/80 p-5 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:z-auto ${
            isMobileMenuOpen ? 'translate-x-0 top-[53px] h-[calc(100vh-53px)]' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="space-y-6">
            <div className="hidden lg:flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-cyan-500/10 border-cyan-500/30 text-cyan-400">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-base tracking-wide text-white">ZYRQUEN Ω∞</h1>
                <p className="text-xs text-slate-400 font-mono">SOVEREIGN ENGINE v4.16</p>
              </div>
            </div>

            {/* Navigation Menu Links */}
            <nav className="space-y-1.5 font-mono text-xs">
              <button
                type="button"
                onClick={() => handleNavClick('overview')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                  activeTab === 'overview'
                    ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <Activity className="w-4 h-4 text-cyan-400" />
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('telemetry')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                  activeTab === 'telemetry'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <Cpu className="w-4 h-4 text-emerald-400" />
                Cryo Telemetry
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('ledger')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                  activeTab === 'ledger'
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <Database className="w-4 h-4 text-amber-400" />
                Immutable Ledger
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('pqc')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                  activeTab === 'pqc'
                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/30 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <Lock className="w-4 h-4 text-purple-400" />
                PQC Shielding
              </button>
            </nav>
          </div>

          <div className="pt-4 border-t border-slate-800 font-mono text-[11px] text-slate-500 flex flex-col gap-1">
            <span className="text-slate-400 font-medium">PRINCIPAL: #EP-SOVEREIGN-01</span>
            <span className="text-[10px] text-slate-600">FROZEN v1.2 LTS • PWA READY</span>
          </div>
        </aside>

        {/* 🔲 Mobile Overlay Background */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-slate-950/80 z-30 lg:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* 🖥️ Main Viewport Content */}
        <main className="flex-1 p-3 sm:p-5 lg:p-8 overflow-y-auto w-full max-w-7xl mx-auto space-y-5">
          {children}
        </main>
      </div>
    </div>
  );
};
