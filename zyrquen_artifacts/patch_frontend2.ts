import fs from 'fs';

let content = fs.readFileSync('src/components/views/Security/LiveFlowVisualizerView.tsx', 'utf-8');

// The original map function uses `item.icon` and `item.statusColor`.
// We will replace `const Icon = item.icon;` with a mapping function.

const replacement = `
                                const iconMap: Record<string, any> = {
                                    "INGRESS": Globe,
                                    "L1 GATE": Key,
                                    "L2 GATE": ShieldCheck,
                                    "SENTINEL AI": AlertTriangle,
                                    "L3 GATE": Cpu,
                                    "ZEROIZATION": Zap,
                                    "LOCKDOWN": Lock,
                                    "PRESERVATION": Database,
                                    "TRACE REPLAY": CheckCircle2
                                };
                                const colorMap: Record<string, string> = {
                                    "INGRESS": "text-amber-500 border-amber-500/30 bg-amber-500/10",
                                    "L1 GATE": "text-emerald-500 border-emerald-500/30 bg-emerald-500/10",
                                    "L2 GATE": "text-emerald-500 border-emerald-500/30 bg-emerald-500/10",
                                    "SENTINEL AI": "text-rose-500 border-rose-500/30 bg-rose-500/10 animate-pulse",
                                    "L3 GATE": "text-rose-500 border-rose-500/30 bg-rose-500/10",
                                    "ZEROIZATION": "text-emerald-500 border-emerald-500/30 bg-emerald-500/10",
                                    "LOCKDOWN": "text-rose-500 border-rose-500/30 bg-rose-500/10",
                                    "PRESERVATION": "text-cyan-500 border-cyan-500/30 bg-cyan-500/10",
                                    "TRACE REPLAY": "text-emerald-500 border-emerald-500/30 bg-emerald-500/10 font-bold"
                                };
                                const Icon = iconMap[item.stage] || ShieldCheck;
                                const statusColor = colorMap[item.stage] || "text-slate-500 border-slate-500/30 bg-slate-500/10";
`;

content = content.replace(/const Icon = item\.icon;/, replacement);
content = content.replace(/\$\{item\.statusColor\}/g, '${statusColor}');

fs.writeFileSync('src/components/views/Security/LiveFlowVisualizerView.tsx', content);
