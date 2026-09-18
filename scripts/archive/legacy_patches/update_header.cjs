const fs = require('fs');
const content = fs.readFileSync('src/components/views/DashboardView.tsx', 'utf8');

const targetStart = "      {/* Unified Executive Header & Single Status Bar (Density Reduction) */}";
const targetEnd = "      {/* Primary 4 Metric Gauges (Essential Decision View) */}";

const startIndex = content.indexOf(targetStart);
const endIndex = content.indexOf(targetEnd);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find targets. Start:", startIndex, "End:", endIndex);
  process.exit(1);
}

const replacement = `      {/* Unified Executive Header & Single Status Bar (Density Reduction) */}
      <div className="p-4 sm:p-5 md:p-6 rounded-3xl bg-[#0a0f1e]/80 backdrop-blur-xl border border-cyan-500/20 relative overflow-hidden shadow-[0_8px_32px_rgba(6,182,212,0.1)] max-[479px]:p-[16px]">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full blur-[80px] pointer-events-none -translate-x-1/2 translate-y-1/2" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-semibold flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#06b6d4]" />
                💎 FROZEN v1.2 LTS
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-semibold shadow-sm">
                🛡️ GOVERNANCE: {STATE_AUTHORITY.GOVERNANCE_CONSENSUS}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-semibold shadow-sm">
                🔐 CUSTODIAN: {STATE_AUTHORITY.CUSTODIAN_STATUS_LABEL}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-violet-950/80 text-violet-300 border border-violet-500/40 text-[10px] font-mono font-semibold shadow-sm">
                🌐 {STATE_AUTHORITY.TENANT_BOUNDARY} LOCKED
              </span>
              <span className="px-2.5 py-1 rounded-full bg-zinc-900/80 text-zinc-300 border border-zinc-700 text-[10px] font-mono font-semibold shadow-sm">
                ⚙️ RUNTIME: {STATE_AUTHORITY.RUNTIME_STATUS}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-semibold shadow-sm">
                ⚖️ ETDA / PDPA
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-mono font-black text-white tracking-tight flex items-center gap-3">
              <span className="drop-shadow-md">🏛️ ZYRQUEN <strong className="text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]">Ω∞</strong> SOVEREIGN ENGINE</span>
            </h1>
            
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-mono text-zinc-400 pt-1">
              <span className="flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded-md border border-white/5">Root: <strong className="text-zinc-200">909ab814...fa4c68</strong></span>
              <span className="flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded-md border border-white/5">Block: <strong className="text-zinc-200">#849202</strong></span>
              <span className="flex items-center gap-1.5 bg-emerald-950/30 px-2 py-0.5 rounded-md border border-emerald-500/20 text-emerald-400/80">Seals: <strong className="text-emerald-400">14,902 Verified</strong></span>
              <span className="flex items-center gap-1.5 bg-cyan-950/30 px-2 py-0.5 rounded-md border border-cyan-500/20 text-cyan-400/80">SSoT Drift: <strong className="text-cyan-400">Δ0.00%</strong></span>
              <span className="text-zinc-300 font-medium ml-1">👤 นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)</span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-start lg:justify-end gap-3 shrink-0 max-[479px]:w-full max-[479px]:grid max-[479px]:grid-cols-1">
            <button
              onClick={() => {
                playTone(880, 0.05);
                setDashboardSection('AUDIT');
              }}
              className="px-4 py-2.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/50 text-cyan-300 font-mono text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm max-[479px]:w-full"
              title="Open Sovereign Audit Dashboard"
            >
              <span>🏛️ Sovereign Audit Dashboard</span>
            </button>
            <button
              onClick={triggerSelfHealing}
              disabled={isHealing}
              className={\`px-4 py-2.5 rounded-xl font-mono text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all border shadow-sm max-[479px]:w-full \${
                isHealing
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-200 animate-pulse'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-cyan-500/40 text-zinc-100'
              }\`}
              title="Autonomous Phoenix Self-Healing (142ms recovery verification)"
            >
              <RotateCw className={\`w-3.5 h-3.5 \${isHealing ? 'animate-spin text-cyan-400' : 'text-zinc-400'}\`} />
              <span>{isHealing ? 'Healing...' : 'Phoenix Healing'}</span>
            </button>
            <button
              onClick={() => {
                playTone(740, 0.08);
                onNavigate('council');
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/50 text-amber-300 font-mono text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm max-[479px]:w-full"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>สภาผู้พิทักษ์ 10/10</span>
            </button>
            <button
              onClick={() => {
                playTone(680, 0.08);
                onOpenCertificate();
              }}
              className="px-4 py-2.5 rounded-xl bg-yellow-950/60 hover:bg-yellow-900/80 border border-amber-500/50 text-amber-300 font-mono text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm max-[479px]:w-full"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Gold Master Seal</span>
            </button>
          </div>
        </div>

        {healSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/80 backdrop-blur border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in shadow-[0_0_15px_rgba(52,211,153,0.15)]">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Autonomous Phoenix Healing complete in 142ms. 10/10 invariants verified. Block #849202 sealed.</span>
          </div>
        )}
      </div>\n\n`;

const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
fs.writeFileSync('src/components/views/DashboardView.tsx', newContent);
console.log("Successfully replaced header");
