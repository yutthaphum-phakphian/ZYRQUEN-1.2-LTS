import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldAlert, 
  Activity, 
  Database, 
  Flame, 
  Play, 
  Pause,
  Terminal,
  Cpu,
  Lock,
  Search
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ScatterChart, Scatter, ZAxis } from 'recharts';

// Mock telemetry and audit data
const generateTelemetry = (count = 20) => {
  const data = [];
  let time = Date.now() - count * 1000;
  for (let i = 0; i < count; i++) {
    data.push({
      time,
      cryoTemp: 15.0 + Math.random() * 0.5,
      entropy: 850 + Math.random() * 100,
      riskScore: Math.random() * 0.1,
    });
    time += 1000;
  }
  return data;
};

const MOCK_ATTACKS = [
  { id: 'ATK-001', type: 'Voltage Glitch', severity: 'CRITICAL', status: 'ZEROIZED', latency: '0.48ms', timestamp: 'Just now' },
  { id: 'ATK-002', type: 'Nonce Flood', severity: 'HIGH', status: 'QUARANTINED', latency: '1.2ms', timestamp: '2s ago' },
  { id: 'ATK-003', type: 'Signature Spoof', severity: 'MEDIUM', status: 'BLOCKED', latency: '0.8ms', timestamp: '5s ago' },
];

export const QuantumAuditFusionView: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [telemetry, setTelemetry] = useState(generateTelemetry());
  const [activeSimulation, setActiveSimulation] = useState<string | null>(null);
  
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTelemetry(prev => {
        const newData = [...prev.slice(1), {
          time: Date.now(),
          cryoTemp: 15.0 + Math.random() * (activeSimulation ? 2.5 : 0.5),
          entropy: 850 + Math.random() * (activeSimulation ? 300 : 100),
          riskScore: activeSimulation ? 0.8 + Math.random() * 0.2 : Math.random() * 0.1,
        }];
        return newData;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, activeSimulation]);

  const triggerAttack = (type: string) => {
    setActiveSimulation(type);
    setTimeout(() => setActiveSimulation(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-5 h-5 text-fuchsia-400" />
            Unified Quantum Audit & Telemetry Fusion
          </h2>
          <p className="text-sm text-zinc-400 mt-1">Real-time Persistence Ledger vs Attack Simulator</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm font-bold text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? 'PAUSE STREAM' : 'RESUME STREAM'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Playback & Telemetry Chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Cpu className="w-32 h-32 text-fuchsia-500" />
            </div>
            
            <h3 className="text-sm font-bold text-zinc-300 mb-6 flex items-center gap-2 uppercase">
              <Activity className="w-4 h-4 text-fuchsia-400" />
              Quantum Telemetry Heatmap (Time-Series SSoT)
            </h3>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={telemetry} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d946ef" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#d946ef" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorEntropy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    tickFormatter={(val) => new Date(val).toLocaleTimeString()} 
                    stroke="#52525b" 
                    fontSize={10} 
                  />
                  <YAxis yAxisId="left" stroke="#d946ef" fontSize={10} />
                  <YAxis yAxisId="right" orientation="right" stroke="#0ea5e9" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                    labelFormatter={(val: any) => new Date(val).toLocaleTimeString()}
                  />
                  <Area yAxisId="left" type="monotone" dataKey="cryoTemp" stroke="#d946ef" fillOpacity={1} fill="url(#colorTemp)" />
                  <Area yAxisId="right" type="monotone" dataKey="entropy" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorEntropy)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between mt-4 text-xs font-mono text-zinc-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-fuchsia-500"></span> Cryo Temp (mK)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500"></span> Entropy (QOps)</span>
              <span>SSoT &Delta;0 Preserved</span>
            </div>
          </div>

          {/* Database Persistence Log */}
          <div className="bg-zinc-950 border border-emerald-900/30 rounded-xl p-5">
            <h3 className="text-sm font-bold text-emerald-400 mb-4 flex items-center gap-2 uppercase">
              <Database className="w-4 h-4" />
              Immutable WORM Ledger (PostgreSQL + TimescaleDB)
            </h3>
            <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-zinc-900/50 border border-emerald-900/20 rounded p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <Lock className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-xs font-mono text-emerald-300">BLOCK_SEAL_#84920{2 - i}</div>
                      <div className="text-[10px] text-zinc-500">Dilithium-5 Signature Verified</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-zinc-400">Latency: 1.1ms</div>
                    <div className="text-[10px] font-mono text-emerald-500/70">WORM RECORD</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Attack Simulator Suite */}
        <div className="space-y-6">
          <div className="bg-zinc-950 border border-rose-900/30 rounded-xl p-5">
            <h3 className="text-sm font-bold text-rose-400 mb-4 flex items-center gap-2 uppercase">
              <Flame className="w-4 h-4" />
              Adversarial Attack Simulator
            </h3>
            
            <div className="space-y-3 mb-6">
              <button 
                onClick={() => triggerAttack('VOLTAGE')}
                className="w-full flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 hover:border-rose-500/50 hover:bg-rose-950/20 rounded-lg transition-colors group"
              >
                <div className="flex flex-col items-start">
                  <span className="text-xs font-bold text-zinc-300 group-hover:text-rose-300">Voltage Glitch Injection</span>
                  <span className="text-[10px] text-zinc-500">Trigger Active Zeroization</span>
                </div>
                <Play className="w-4 h-4 text-zinc-600 group-hover:text-rose-400" />
              </button>
              
              <button 
                onClick={() => triggerAttack('NONCE')}
                className="w-full flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 hover:border-orange-500/50 hover:bg-orange-950/20 rounded-lg transition-colors group"
              >
                <div className="flex flex-col items-start">
                  <span className="text-xs font-bold text-zinc-300 group-hover:text-orange-300">Nonce Flooding</span>
                  <span className="text-[10px] text-zinc-500">10,000 req/sec Spike</span>
                </div>
                <Play className="w-4 h-4 text-zinc-600 group-hover:text-orange-400" />
              </button>
              
              <button 
                onClick={() => triggerAttack('SPOOF')}
                className="w-full flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 hover:border-fuchsia-500/50 hover:bg-fuchsia-950/20 rounded-lg transition-colors group"
              >
                <div className="flex flex-col items-start">
                  <span className="text-xs font-bold text-zinc-300 group-hover:text-fuchsia-300">Signature Spoof Replay</span>
                  <span className="text-[10px] text-zinc-500">Ed25519 Fake Payload</span>
                </div>
                <Play className="w-4 h-4 text-zinc-600 group-hover:text-fuchsia-400" />
              </button>
            </div>

            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Live Interception Logs</h4>
            <div className="space-y-2">
              {MOCK_ATTACKS.map(atk => (
                <div key={atk.id} className="bg-zinc-900/30 border border-zinc-800/50 rounded p-2 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-rose-400">{atk.type}</div>
                    <div className="text-[10px] text-zinc-500">{atk.timestamp} | {atk.severity}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-emerald-400">{atk.status}</div>
                    <div className="text-[10px] text-zinc-500">T+{atk.latency}</div>
                  </div>
                </div>
              ))}
              {activeSimulation && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-rose-950/30 border border-rose-900/50 rounded p-2 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-rose-400 uppercase">{activeSimulation} ATTACK DETECTED</div>
                    <div className="text-[10px] text-rose-500">Intercepting...</div>
                  </div>
                  <Activity className="w-4 h-4 text-rose-500 animate-pulse" />
                </motion.div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
