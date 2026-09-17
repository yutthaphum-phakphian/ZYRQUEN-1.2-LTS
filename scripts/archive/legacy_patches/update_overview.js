const fs = require('fs');
const content = fs.readFileSync('src/components/views/DashboardView.tsx', 'utf8');

const targetStart = "          {/* GitHub Synchronization Status Utility (Checksum & Merkle Parity Engine) */}";
const targetEnd = "          {/* Zyrquen Manifesto Terminal */}";

const startIndex = content.indexOf(targetStart);
const endIndex = content.indexOf(targetEnd);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find targets");
  process.exit(1);
}

const replacement = `          {/* --- BEAUTIFIED BENTO GRID OVERVIEW --- */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start w-full min-w-0 max-w-full">
            
            {/* HERO COLUMN - 8 Cols */}
            <div className="xl:col-span-8 space-y-5 w-full min-w-0 max-w-full">
              
              {/* Sovereign World Engine Card */}
              <div className="p-4 sm:p-5 md:p-6 rounded-3xl bg-[#0a0f1e]/80 backdrop-blur-xl border border-cyan-500/20 space-y-4 shadow-[0_8px_32px_rgba(6,182,212,0.08)] relative overflow-hidden w-full min-w-0 max-w-full">
                {/* Header: Sovereign World Engine & Isolated UI Buffer */}
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                      {activeCanvasTab === 'overview' ? (
                        <Orbit className="w-5 h-5 animate-spin" style={{ animationDuration: '24s' }} />
                      ) : (
                        <Network className="w-5 h-5 text-violet-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                          Sovereign World Engine
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-cyan-300 bg-cyan-950/70 px-2 py-0.5 rounded-full border border-cyan-500/40 flex items-center gap-1 shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                          GPU Virtual Canvas
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-2 mt-0.5">
                        <span>ZERO CONSENSUS DRIFT</span>
                        <span className="text-zinc-600">•</span>
                        <span>THREAD #0</span>
                      </div>
                    </div>
                  </div>

                  {/* Segmented Switcher & Controls */}
                  <div className="relative z-10 flex items-center gap-1.5 flex-wrap">
                    <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10 flex-wrap gap-1">
                      <button
                        onClick={() => {
                          playTone(680, 0.04);
                          setActiveCanvasTab('hologram');
                        }}
                        className={\`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono transition-all \${
                          activeCanvasTab === 'hologram'
                            ? 'bg-cyan-500/20 text-white font-bold border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                        }\`}
                      >
                        <Boxes className="w-3.5 h-3.5 text-cyan-300" />
                        <span>3D Hologram</span>
                      </button>
                      <button
                        onClick={() => {
                          playTone(660, 0.04);
                          setActiveCanvasTab('atlas');
                        }}
                        className={\`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono transition-all \${
                          activeCanvasTab === 'atlas'
                            ? 'bg-cyan-500/20 text-white font-bold border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                        }\`}
                      >
                        <Orbit className="w-3.5 h-3.5 text-cyan-400" />
                        <span>3D Atlas</span>
                      </button>
                      <button
                        onClick={() => {
                          playTone(600, 0.04);
                          setActiveCanvasTab('overview');
                        }}
                        className={\`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono transition-all \${
                          activeCanvasTab === 'overview'
                            ? 'bg-cyan-500/20 text-white font-bold border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                        }\`}
                      >
                        <Box className="w-3.5 h-3.5 text-amber-400" />
                        <span>Wireframe</span>
                      </button>
                      <button
                        onClick={() => {
                          playTone(640, 0.04);
                          setActiveCanvasTab('topology');
                        }}
                        className={\`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono transition-all \${
                          activeCanvasTab === 'topology'
                            ? 'bg-cyan-500/20 text-white font-bold border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                        }\`}
                      >
                        <Network className="w-3.5 h-3.5 text-violet-400" />
                        <span>Topology</span>
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setIsCanvasExpanded(!isCanvasExpanded);
                        playTone(620, 0.03);
                      }}
                      className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-colors"
                    >
                      {isCanvasExpanded ? (
                        <Minimize2 className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Maximize2 className="w-4 h-4 text-zinc-300" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Canvas Viewer */}
                <div
                  className={\`relative w-full rounded-2xl bg-[#03050a] border border-cyan-500/25 overflow-hidden flex items-center justify-center transition-all duration-300 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] \${
                    isCanvasExpanded ? 'h-[580px]' : 'h-[400px] sm:h-[480px]'
                  }\`}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/10 to-transparent pointer-events-none" />
                  {activeCanvasTab === 'hologram' ? (
                    <QuantumCitadelLatticeHologramVisualizer
                      expanded={isCanvasExpanded}
                      onToggleExpand={() => setIsCanvasExpanded(!isCanvasExpanded)}
                      onNavigate={onNavigate}
                    />
                  ) : activeCanvasTab === 'atlas' ? (
                    <ChamberRuntimeAtlas3D
                      expanded={isCanvasExpanded}
                      onToggleExpand={() => setIsCanvasExpanded(!isCanvasExpanded)}
                    />
                  ) : activeCanvasTab === 'overview' ? (
                    <CitadelCanvas speedMultiplier={citadelSpeed} highlightColor="#06B6D4" />
                  ) : (
                    <TopologyCanvas />
                  )}
                </div>

                {/* Footer description */}
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono pt-2 gap-2 border-t border-white/10">
                  <div className="text-zinc-400 flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]"></span>
                     Golden Icosahedron Core #849202 • 18 Chambers Lattice
                  </div>
                  <button
                    onClick={() => {
                      playTone(660, 0.03);
                      setShowBufferModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/30 hover:bg-cyan-900/50 border border-cyan-500/30 text-[11px] text-cyan-300 hover:text-cyan-100 transition-all shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Isolated UI Buffer Details</span>
                  </button>
                </div>
              </div>

              {/* Copilot Autonomy Node */}
              <div className="w-full">
                 <CopilotAutonomyNodePanel />
              </div>

              {/* Quick Launchpad to 12 Core Views */}
              <div className="p-4 sm:p-5 md:p-6 rounded-3xl bg-[#0a0f1e]/80 backdrop-blur-xl border border-white/10 space-y-4 w-full min-w-0 max-w-full shadow-lg">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h3 className="text-sm font-mono font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-cyan-400" />
                    Core Operating Views
                  </h3>
                  <span className="text-[10px] font-mono text-zinc-400 bg-black/50 px-2 py-1 rounded-md border border-white/5">100% ROUTABLE</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { id: 'legal', name: 'Legal & PDPA', desc: 'ETDA Sec 9/26/28', emoji: '⚖️' },
                    { id: 'council', name: 'Sovereign Council', desc: '10/10 Quorum HSM', emoji: '👑' },
                    { id: 'ledger', name: 'Evidence Ledger', desc: '14,902 SHA Seals', emoji: '📜' },
                    { id: 'pulse', name: 'System Pulse', desc: 'Cryo & Telemetry', emoji: '📡' },
                    { id: 'quantum', name: 'Quantum Nexus', desc: '768-Qubit State', emoji: '🎮' },
                    { id: 'vault', name: 'Sovereign Vault', desc: 'OMEGA Clearance', emoji: '🔐' },
                    { id: 'production', name: 'Readiness PH-20', desc: 'Zero-Trust Bastion', emoji: '🛡️' },
                    { id: 'console', name: 'CLI Console', desc: 'Developer CLI', emoji: '⚙️' },
                    { id: 'archive', name: 'Archive 17 Mod', desc: 'Genesis Manifest', emoji: '📑' },
                  ].map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        playTone(560, 0.05);
                        onNavigate(v.id as ViewType);
                      }}
                      className="p-3 rounded-xl bg-gradient-to-br from-white/[0.03] to-transparent hover:from-cyan-950/40 hover:to-transparent border border-white/10 hover:border-cyan-500/30 text-left transition-all group cursor-pointer shadow-sm relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative z-10 flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-zinc-200 flex items-center gap-2">
                          <span className="text-base">{v.emoji}</span>
                          <span className="group-hover:text-cyan-300 transition-colors">{v.name}</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                      </div>
                      <div className="relative z-10 text-[10px] text-zinc-500 font-mono mt-1 group-hover:text-zinc-400 transition-colors">{v.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Telemetry & Traces - 4 Columns */}
            <div className="xl:col-span-4 space-y-5 w-full min-w-0 max-w-full">
              
              {/* GitHub Synchronization Status Utility */}
              <div className="w-full">
                <GitHubSyncStatusUtility />
              </div>

              {/* Latest Verified Forensic Transaction */}
              <div className={\`p-4 sm:p-5 md:p-6 rounded-3xl bg-[#0a0f1e]/80 backdrop-blur-xl border space-y-4 transition-all w-full min-w-0 max-w-full shadow-lg \${
                isForensicAuditMode ? 'border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'border-white/10'
              }\`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                    <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
                      Latest Forensic Trace
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                    142ms VERIFIED
                  </span>
                </div>
                
                <div className="p-3.5 rounded-xl bg-black/60 border border-white/5 space-y-1.5 text-xs font-mono relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/10 rounded-bl-full blur-xl pointer-events-none" />
                  <div className="text-zinc-100 font-bold tracking-tight">{AUDIT_TRACE_TX.txId}</div>
                  <div className="text-zinc-400 text-[11px] leading-relaxed">{AUDIT_TRACE_TX.title}</div>
                  <div className="text-zinc-500 text-[10px] pt-2 mt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-zinc-400" /> {AUDIT_TRACE_TX.rootActor}</span>
                    <span className="text-cyan-400 font-semibold bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-500/20">Block #{AUDIT_TRACE_TX.sealedLedgerBlock}</span>
                  </div>
                </div>

                {/* Stages Mini-timeline */}
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {AUDIT_TRACE_TX.stages.slice(0, 6).map((stage) => (
                    <div
                      key={stage.id}
                      className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs font-mono hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-md bg-cyan-950/50 border border-cyan-500/20 flex items-center justify-center text-[10px] text-cyan-300 font-bold shadow-inner">
                          {stage.stageNumber}
                        </span>
                        <span className="text-zinc-300 text-[11px]">{stage.name}</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono bg-black/40 px-1.5 py-0.5 rounded border border-white/5">{stage.durationMs}ms</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    playTone(600, 0.05);
                    onNavigate('ledger');
                  }}
                  className="w-full py-2.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 hover:border-cyan-400/50 text-cyan-300 font-mono text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm mt-2"
                >
                  <span>Full Evidence Ledger</span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                </button>
              </div>

              {/* Canonical Architecture Summary */}
              <div className="p-4 sm:p-5 md:p-6 rounded-3xl bg-[#0a0f1e]/80 backdrop-blur-xl border border-white/10 space-y-4 w-full min-w-0 max-w-full shadow-lg">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4 text-violet-400" />
                    17 Canonical Modules
                  </span>
                  <span className="text-[10px] font-mono text-violet-300 bg-violet-950/80 px-2 py-0.5 rounded-md border border-violet-500/30">
                    100% PRESERVED
                  </span>
                </div>
                <div className="space-y-2">
                  {CANONICAL_MODULES.slice(0, 4).map((mod) => (
                    <div
                      key={mod.id}
                      onClick={() => {
                        playTone(550, 0.05);
                        onNavigate(mod.targetView);
                      }}
                      className="p-3 rounded-xl bg-gradient-to-r from-white/[0.02] to-transparent hover:from-violet-950/30 hover:to-transparent border border-white/5 hover:border-violet-500/30 cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-xs font-mono font-bold text-zinc-200 flex items-center gap-2">
                          <span className="text-cyan-400 font-black">{mod.num}</span>
                          <span className="group-hover:text-violet-200 transition-colors">{mod.titleEn}</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono line-clamp-1 mt-1 group-hover:text-zinc-400">
                          {mod.titleTh}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-black/40 text-zinc-400 border border-white/5">
                        {mod.badge}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    playTone(600, 0.05);
                    onNavigate('archive');
                  }}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-mono text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm mt-2"
                >
                  <span>Explore All 17 Modules</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-70" />
                </button>
              </div>

            </div>
          </div>
`;

const newContent = content.substring(0, startIndex) + replacement + "\n" + content.substring(endIndex);
fs.writeFileSync('src/components/views/DashboardView.tsx', newContent);
console.log("Successfully replaced block");
