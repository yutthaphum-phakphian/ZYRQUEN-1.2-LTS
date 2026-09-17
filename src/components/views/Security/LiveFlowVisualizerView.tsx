import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, FileCheck, Gavel, Activity, Play, Volume2, VolumeX, Terminal, Lock, Globe, Key, ShieldCheck, AlertTriangle, Cpu, Zap, Database, CheckCircle2 } from 'lucide-react';
import * as d3 from 'd3';

const OLD_timelineData = [
    {
        time: "0.00ms",
        stage: "INGRESS",
        title: "Chamber 11 API Gateway Hit",
        details: "Payload: Nc×Vc 36.22M | Sig: Dilithium-5 #EP-SOVEREIGN-01 | IP: 203.0.113.44",
        status: "SUSPICIOUS-ATTACKER",
        statusColor: "text-amber-500 border-amber-500/30 bg-amber-500/10",
        icon: Globe
    },
    {
        time: "0.08ms",
        stage: "L1 GATE",
        title: "ม.9 IAL1/AAL1 Verification",
        details: "Bearer token authenticated successfully.",
        status: "PASS",
        statusColor: "text-emerald-500 border-emerald-500/30 bg-emerald-500/10",
        icon: Key
    },
    {
        time: "0.15ms",
        stage: "L2 GATE",
        title: "ม.26 IAL2+/AAL2+ Signature Check",
        details: "Quantum resistant ML-DSA-87 signature signature match.",
        status: "PASS",
        statusColor: "text-emerald-500 border-emerald-500/30 bg-emerald-500/10",
        icon: ShieldCheck
    },
    {
        time: "0.22ms",
        stage: "SENTINEL AI",
        title: "OTel Stream Anomaly Scan",
        details: "Voltage Jitter Detected + Geo Mismatch BKK→Unknown | Risk Score 0.94 (Thresh 0.85)",
        status: "CRITICAL 0.94",
        statusColor: "text-rose-500 border-rose-500/30 bg-rose-500/10 animate-pulse",
        icon: AlertTriangle
    },
    {
        time: "0.34ms",
        stage: "L3 GATE",
        title: "ม.28 10/10 REAL_HSM Quorum CHECK",
        details: "TC-01..TC-10 Voting: 9/10 DENY (TC-09 Chaos Node reports Tamper Foil anomaly)",
        status: "HOLD / DENY",
        statusColor: "text-rose-500 border-rose-500/30 bg-rose-500/10",
        icon: Cpu
    },
    {
        time: "0.48ms",
        stage: "ZEROIZATION",
        title: "Active Zeroization Triggered on TC-09",
        details: "Dilithium-5 Ephemeral RAM Wiped <1.2ms → Completed in 0.48ms",
        status: "WIPED ✅",
        statusColor: "text-emerald-500 border-emerald-500/30 bg-emerald-500/10",
        icon: Zap
    },
    {
        time: "0.85ms",
        stage: "LOCKDOWN",
        title: "Fail-Closed Lockdown Engaged",
        details: "X-Zyrquen-Sovereign-Sig INVALID → Transaction Cut → Redirected to Chamber 02 Buffer",
        status: "TX CUT",
        statusColor: "text-rose-500 border-rose-500/30 bg-rose-500/10",
        icon: Lock
    },
    {
        time: "1.20ms",
        stage: "PRESERVATION",
        title: "Module 17 V24 Forensics Preservation",
        details: "Raw Evidence Cloned | Zero-Deletion Guarantee 100%",
        status: "PRESERVED",
        statusColor: "text-cyan-500 border-cyan-500/30 bg-cyan-500/10",
        icon: Database
    },
    {
        time: "35.80ms",
        stage: "TRACE REPLAY",
        title: "12-Stage Trace Replay Complete",
        details: "STAGE-01 INGEST → STAGE-12 CLOSURE | Drift 0.00% SSoT Δ0 | Seal 14,902 VERIFIED",
        status: "COURT READY",
        statusColor: "text-emerald-500 border-emerald-500/30 bg-emerald-500/10 font-bold",
        icon: CheckCircle2
    }
];

const hsmNodes = [
    { id: "TC-01", status: "DENY", type: "normal" },
    { id: "TC-02", status: "DENY", type: "normal" },
    { id: "TC-03", status: "DENY", type: "normal" },
    { id: "TC-04", status: "DENY", type: "normal" },
    { id: "TC-05", status: "DENY", type: "normal" },
    { id: "TC-06", status: "DENY", type: "normal" },
    { id: "TC-07", status: "DENY", type: "normal" },
    { id: "TC-08", status: "DENY", type: "normal" },
    { id: "TC-09", status: "TAMPER", type: "zeroized" },
    { id: "TC-10", status: "DENY", type: "normal" },
];

export const LiveFlowVisualizerView: React.FC = () => {
    const [timelineData, setTimelineData] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/v1/forensic/trace-replay')
            .then(res => res.json())
            .then(data => {
                if (data && data.stages) {
                    setTimelineData(data.stages);
                }
            })
            .catch(console.error);
    }, []);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [visibleSteps, setVisibleSteps] = useState<number>(0);
    const [logs, setLogs] = useState<{time: string, message: string, type: string}[]>([]);
    const [riskScore, setRiskScore] = useState("0.00");
    const timelineRef = useRef<HTMLDivElement>(null);
    const logRef = useRef<HTMLDivElement>(null);
    const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

    useEffect(() => {
        setAudioCtx(new (window.AudioContext || (window as any).webkitAudioContext)());
    }, []);

    const playSound = (freq: number, duration: number, type: OscillatorType = "sine") => {
        if (!soundEnabled || !audioCtx) return;
        try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (e) {
            // Ignore
        }
    };

    const startSimulation = () => {
        if (isPlaying) return;
        setIsPlaying(true);
        setVisibleSteps(0);
        setLogs([]);
        setRiskScore("0.00");

        timelineData.forEach((item, index) => {
            setTimeout(() => {
                setVisibleSteps(prev => prev + 1);

                if (item.status.includes("CRITICAL")) {
                    playSound(880, 0.3, "sawtooth");
                } else if (item.status.includes("WIPED")) {
                    playSound(440, 0.2, "square");
                } else {
                    playSound(600 + index * 40, 0.08, "sine");
                }

                setLogs(prev => [...prev, {
                    time: item.time,
                    message: `${item.stage} → ${item.title} (${item.status})`,
                    type: item.status.includes("CRITICAL") ? "danger" : (item.status.includes("COURT") ? "success" : "info")
                }]);

                if (item.stage === "SENTINEL AI") {
                    setRiskScore("0.94");
                }

                if (index === timelineData.length - 1) {
                    setIsPlaying(false);
                }
            }, index * 450);
        });
    };
    
    useEffect(() => {
        if (timelineRef.current) {
            timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
        }
    }, [visibleSteps]);

    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [logs]);

    const handleExport = () => {
        const jsonData = {
            "system": "ZYRQUEN_SOVEREIGN_SENTINEL_V6",
            "incident_id": "ZQ-GREEN-DEP-849202-3908",
            "timestamp_ms": 35.80,
            "sla_ms": 142.0,
            "sentinel_tier": 3,
            "risk_assessment": {
                "score": 0.94,
                "threshold": 0.85,
                "status": "CRITICAL_ATTACKER_DETECTED",
                "anomalies": ["Voltage Jitter", "Geo Mismatch BKK->Unknown"]
            },
            "timeline": timelineData
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "zyrquen-sentinel-risk-094-live-flow.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    };

    return (
        <div className="flex flex-col font-sans space-y-6">
            <header className="bg-[#0b101d]/85 backdrop-blur-md border border-slate-800 rounded-xl px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500/10 border border-rose-500/40 rounded-lg text-rose-500 animate-pulse">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-display font-black text-lg tracking-wider text-white">ZYRQUEN SENTINEL</span>
                            <span className="text-xs bg-rose-500/20 text-rose-500 border border-rose-500/30 px-2 py-0.5 rounded font-mono font-bold">FAIL-CLOSED</span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono">Live Incident Simulation | Event ID: <span className="text-cyan-400">ZQ-GREEN-DEP-849202-3908</span></p>
                    </div>
                </div>

                <div className="flex items-center gap-3 font-mono text-xs">
                    <div className="bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-md flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        <span className="text-slate-400">SSoT Drift:</span>
                        <span className="text-emerald-500 font-bold">Δ0.00%</span>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-md flex items-center gap-2 text-emerald-500 font-bold">
                        <Gavel className="w-3.5 h-3.5" />
                        <span>COURT READY</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 flex flex-col gap-6">
                    <div className="bg-[#0b101d]/85 backdrop-blur-md rounded-xl p-5 border-l-4 border-l-rose-500 relative overflow-hidden border border-slate-800">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Incident Root Cause Analysis</span>
                                <h2 className="text-xl font-display font-bold text-white mt-0.5">Risk 0.94 Critical Attack Containment</h2>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-display font-extrabold text-rose-500" style={{textShadow: '0 0 10px rgba(244,63,94,0.5)'}}>35.80 ms</span>
                                <p className="text-xs font-mono text-slate-400">Execution Time (SLA &lt;142ms)</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mt-4">
                            <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-lg">
                                <span className="text-[10px] font-mono text-slate-400 block uppercase">Target Vector</span>
                                <span className="text-xs font-mono font-bold text-slate-200">Chamber 11 API</span>
                            </div>
                            <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-lg">
                                <span className="text-[10px] font-mono text-slate-400 block uppercase">Attacker Payload</span>
                                <span className="text-xs font-mono font-bold text-amber-500">36.22M Nc×Vc</span>
                            </div>
                            <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-lg">
                                <span className="text-[10px] font-mono text-slate-400 block uppercase">Redirect Target</span>
                                <span className="text-xs font-mono font-bold text-cyan-400">Chamber 02 Quarantine</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0b101d]/85 backdrop-blur-md border border-slate-800 rounded-xl p-5 flex flex-col flex-1 h-[400px]">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-cyan-400" />
                                <h3 className="font-display font-semibold text-white">Live Execution Pipeline (0.00ms - 35.80ms)</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={startSimulation} disabled={isPlaying} className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-mono text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/20">
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                    {isPlaying ? 'Running...' : 'Replay Timeline'}
                                </button>
                                <button onClick={() => setSoundEnabled(!soundEnabled)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 border border-slate-700">
                                    {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </div>

                        <div ref={timelineRef} className="space-y-3 mt-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                            {timelineData.slice(0, visibleSteps).map((item, idx) => {
                                
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

                                return (
                                    <div key={idx} className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex items-start gap-3">
                                        <div className="p-2 rounded-md bg-slate-800 text-cyan-400 border border-slate-700 font-mono text-xs whitespace-nowrap">
                                            {item.time}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-mono font-bold text-slate-200 truncate">{item.stage}: {item.title}</span>
                                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border whitespace-nowrap ${statusColor}`}>{item.status}</span>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1 font-mono truncate">{item.details}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-[#0b101d]/85 backdrop-blur-md border border-slate-800 rounded-xl p-4 font-mono text-xs h-40 flex flex-col">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-slate-400">
                            <span className="flex items-center gap-1.5">
                                <Terminal className="w-4 h-4 text-slate-400" />
                                OTel Live Telemetry Stream
                            </span>
                            <span className="text-[10px] text-slate-500">Auto-Scroll Active</span>
                        </div>
                        <div ref={logRef} className="overflow-y-auto space-y-1 custom-scrollbar text-slate-300 flex-1">
                            {logs.map((log, i) => (
                                <div key={i} className="flex gap-2 text-[11px]">
                                    <span className="text-slate-500">[{log.time}]</span> 
                                    <span className={log.type === 'danger' ? 'text-rose-500 font-bold' : log.type === 'success' ? 'text-emerald-500' : 'text-slate-300'}>{log.message}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="bg-[#0b101d]/85 backdrop-blur-md border border-slate-800 rounded-xl p-5 text-center relative overflow-hidden flex flex-col items-center justify-center">
                        <span className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-1">Sentinel AI Scan Gauge</span>
                        
                        <div className="relative w-44 h-44 my-2 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                                <circle cx="50" cy="50" r="40" stroke={riskScore === "0.94" ? "#f43f5e" : "#0ea5e9"} strokeWidth="8" fill="transparent"
                                        strokeDasharray="251.2" strokeDashoffset={riskScore === "0.94" ? "15" : "251.2"} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className={`text-4xl font-display font-black ${riskScore === "0.94" ? "text-rose-500" : "text-cyan-500"}`}>{riskScore}</span>
                                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Risk Score</span>
                            </div>
                        </div>

                        <div className="w-full bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 flex justify-between items-center text-xs font-mono mt-4">
                            <span className="text-slate-400">Threshold: <span className="text-white font-bold">0.85</span></span>
                            {riskScore === "0.94" ? (
                                <span className="text-rose-500 font-bold flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                                    CRITICAL ANOMALY
                                </span>
                            ) : (
                                <span className="text-cyan-500 font-bold flex items-center gap-1">
                                    NOMINAL
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="bg-[#0b101d]/85 backdrop-blur-md border border-slate-800 rounded-xl p-5 bg-gradient-to-br from-[#0b101d] to-cyan-950/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Tier 3 Sentinel Output</span>
                                <h3 className="text-lg font-display font-bold text-white">Quarantined Transactions</h3>
                            </div>
                            <div className="p-3 bg-cyan-500/10 border border-cyan-500/40 rounded-xl text-cyan-400">
                                <Lock className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="my-4 flex items-baseline gap-3">
                            <span className="text-5xl font-display font-black text-cyan-400" style={{textShadow: '0 0 10px rgba(34,211,238,0.5)'}}>80</span>
                            <span className="text-xs font-mono text-slate-400">Transactions Isolated in Chamber 02</span>
                        </div>
                    </div>

                    <div className="bg-[#0b101d]/85 backdrop-blur-md border border-slate-800 rounded-xl p-5">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <div>
                                <h4 className="font-display font-semibold text-white text-sm">ม.28 REAL_HSM Quorum</h4>
                                <p className="text-xs font-mono text-slate-400">TC-01..TC-10 Voting Node Matrix</p>
                            </div>
                            {riskScore === "0.94" && (
                                <span className="text-xs font-mono bg-rose-500/20 text-rose-500 border border-rose-500/30 px-2 py-0.5 rounded font-bold">
                                    9/10 DENY
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-5 gap-2.5 my-4">
                            {hsmNodes.map(node => (
                                <div key={node.id} className={`p-2 rounded border text-center font-mono ${
                                    (riskScore === "0.94" && node.type === "zeroized")
                                    ? 'bg-rose-500/20 border-rose-500 text-rose-500 animate-pulse' 
                                    : 'bg-slate-900 border-slate-800 text-slate-300'
                                }`}>
                                    <div className="text-[10px] text-slate-400">{node.id}</div>
                                    <div className="text-xs font-bold mt-0.5">{(riskScore === "0.94" || node.type !== "zeroized") ? node.status : "WAIT"}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button onClick={handleExport} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold py-3 px-4 rounded-lg border border-slate-700 flex items-center justify-center gap-2 transition-all">
                        Export `zyrquen-sentinel-risk-094.json`
                    </button>
                </div>
            </div>
        </div>
    );
};
