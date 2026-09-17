import React, { useState, useEffect, useRef } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import { Activity, Thermometer, RefreshCw, Play, Pause, AlertCircle, ShieldCheck, Zap } from 'lucide-react';
import { CANONICAL_CONSTANTS } from '../data/sovereignData.ts';
import { soundFx } from '../services/audioEngine.ts';

interface DataPoint {
  time: string;
  timestamp: number;
  temp: number;
  nominal: number;
  delta: number;
  coherence: number;
}

interface CryoJitterChartProps {
  currentCryo?: number;
}

export const CryoJitterChart: React.FC<CryoJitterChartProps> = ({ currentCryo }) => {
  const [isLive, setIsLive] = useState<boolean>(true);
  const [windowSize, setWindowSize] = useState<number>(30); // 30 data points
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const [jitterScale, setJitterScale] = useState<'normal' | 'low' | 'burst'>('normal');

  const baseTemp = CANONICAL_CONSTANTS.BASE_CRYO_TEMP; // 14.98 mK

  // Generate initial history
  useEffect(() => {
    const now = Date.now();
    const initial: DataPoint[] = [];
    for (let i = windowSize; i >= 0; i--) {
      const ts = now - i * 1000;
      const date = new Date(ts);
      const timeStr = date.toTimeString().split(' ')[0];
      const jitter = (Math.sin(i * 0.4) * 0.02) + ((Math.random() - 0.5) * 0.02);
      const temp = Number((baseTemp + jitter).toFixed(3));
      const delta = Number((temp - baseTemp).toFixed(3));
      const coherence = Number((99.985 + (Math.random() * 0.014)).toFixed(3));
      initial.push({
        time: timeStr,
        timestamp: ts,
        temp,
        nominal: baseTemp,
        delta,
        coherence,
      });
    }
    setChartData(initial);
  }, [windowSize]);

  // Live streaming interval
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      
      let maxJitter = 0.035;
      if (jitterScale === 'low') maxJitter = 0.012;
      if (jitterScale === 'burst') maxJitter = 0.085;

      const randomJitter = (Math.random() - 0.5) * maxJitter;
      const targetTemp = currentCryo !== undefined 
        ? currentCryo + randomJitter * 0.2
        : baseTemp + randomJitter;
      
      const temp = Number(targetTemp.toFixed(3));
      const delta = Number((temp - baseTemp).toFixed(3));
      const coherence = Number((99.992 - Math.abs(delta) * 0.15 + (Math.random() * 0.005)).toFixed(3));

      setChartData((prev) => {
        const next = [
          ...prev.slice(prev.length >= windowSize ? 1 : 0),
          {
            time: timeStr,
            timestamp: Date.now(),
            temp,
            nominal: baseTemp,
            delta,
            coherence,
          },
        ];
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLive, windowSize, jitterScale, currentCryo, baseTemp]);

  // Derived metrics
  const temps = chartData.map((d) => d.temp);
  const currentVal = temps.length > 0 ? temps[temps.length - 1] : baseTemp;
  const minTemp = temps.length > 0 ? Math.min(...temps) : baseTemp;
  const maxTemp = temps.length > 0 ? Math.max(...temps) : baseTemp;
  const avgTemp = temps.length > 0 ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(3) : baseTemp.toString();
  const rmsJitter = temps.length > 0
    ? Math.sqrt(temps.reduce((sum, val) => sum + Math.pow(val - baseTemp, 2), 0) / temps.length).toFixed(4)
    : '0.0000';

  const handleTestBurst = () => {
    setJitterScale('burst');
    soundFx.playTelemetryBeacon(940, 0.06);
    setTimeout(() => {
      setJitterScale('normal');
    }, 4000);
  };

  const handleReset = () => {
    soundFx.playTelemetryBeacon(432, 0.05);
    const now = Date.now();
    const timeStr = new Date(now).toTimeString().split(' ')[0];
    setChartData([
      {
        time: timeStr,
        timestamp: now,
        temp: baseTemp,
        nominal: baseTemp,
        delta: 0,
        coherence: 99.995,
      },
    ]);
  };

  return (
    <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 shadow-lg space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-700/60 text-cyan-400">
            <Thermometer className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-display font-bold text-sm text-slate-100">
                Cryogenic System Jitter Telemetry
              </h3>
              <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                mK Scale • Real-Time
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Dilution Refrigerator Stage (Base: {baseTemp} mK • Sub-Kelvin Sensor Feed)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Window Select */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px] font-mono-code">
            <button
              onClick={() => setWindowSize(20)}
              className={`px-2 py-1 rounded transition-colors ${
                windowSize === 20 ? 'bg-cyan-900/80 text-cyan-200 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              20s
            </button>
            <button
              onClick={() => setWindowSize(30)}
              className={`px-2 py-1 rounded transition-colors ${
                windowSize === 30 ? 'bg-cyan-900/80 text-cyan-200 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              30s
            </button>
            <button
              onClick={() => setWindowSize(60)}
              className={`px-2 py-1 rounded transition-colors ${
                windowSize === 60 ? 'bg-cyan-900/80 text-cyan-200 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              60s
            </button>
          </div>

          {/* Test Jitter Burst */}
          <button
            onClick={handleTestBurst}
            disabled={jitterScale === 'burst'}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900/70 border border-amber-800/80 text-amber-300 text-[11px] font-medium transition-all active:scale-95 disabled:opacity-50"
            title="Inject thermal jitter pulse to test feedback loop"
          >
            <Zap className="w-3 h-3" />
            <span className="hidden md:inline">Test Jitter</span>
          </button>

          {/* Live Toggle */}
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
              isLive
                ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            {isLive ? (
              <>
                <Pause className="w-3 h-3" />
                <span>Live</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>Paused</span>
              </>
            )}
          </button>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200"
            title="Reset telemetry stream"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono-code text-xs">
        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <div className="text-[10px] text-slate-500">CURRENT TEMP</div>
          <div className="text-sm font-bold text-cyan-300 flex items-center space-x-1">
            <span>{currentVal.toFixed(3)}</span>
            <span className="text-[10px] text-slate-400">mK</span>
          </div>
        </div>

        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <div className="text-[10px] text-slate-500">NOMINAL BASE</div>
          <div className="text-sm font-bold text-slate-300 flex items-center space-x-1">
            <span>{baseTemp.toFixed(2)}</span>
            <span className="text-[10px] text-slate-400">mK</span>
          </div>
        </div>

        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <div className="text-[10px] text-slate-500">RMS JITTER (σ)</div>
          <div className="text-sm font-bold text-purple-300 flex items-center space-x-1">
            <span>±{rmsJitter}</span>
            <span className="text-[10px] text-slate-400">mK</span>
          </div>
        </div>

        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <div className="text-[10px] text-slate-500">MIN / MAX RANGE</div>
          <div className="text-xs font-bold text-slate-200 truncate mt-0.5">
            {minTemp.toFixed(3)} / {maxTemp.toFixed(3)}
          </div>
        </div>

        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 col-span-2 sm:col-span-1">
          <div className="text-[10px] text-slate-500">CRYO STABILITY</div>
          <div className="text-xs font-bold text-emerald-400 flex items-center space-x-1 mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>OPTIMAL</span>
          </div>
        </div>
      </div>

      {/* Recharts Line / Area Chart Container */}
      <div className="w-full h-56 relative bg-[#040813] rounded-lg p-2 border border-slate-800/60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="cryoGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              domain={[(dataMin: number) => (dataMin - 0.02).toFixed(2), (dataMax: number) => (dataMax + 0.02).toFixed(2)]}
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(val) => `${val} mK`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as DataPoint;
                  return (
                    <div className="p-2.5 bg-slate-950/95 border border-cyan-600/50 rounded-lg shadow-xl font-mono-code text-[11px] space-y-1 z-50">
                      <div className="text-slate-400 flex items-center justify-between border-b border-slate-800 pb-1">
                        <span>TIMESTAMP</span>
                        <span className="text-slate-200 font-bold">{data.time}</span>
                      </div>
                      <div className="flex justify-between space-x-4">
                        <span className="text-slate-400">Cryo Temp:</span>
                        <span className="text-cyan-300 font-bold">{data.temp} mK</span>
                      </div>
                      <div className="flex justify-between space-x-4">
                        <span className="text-slate-400">Nominal:</span>
                        <span className="text-slate-300">{data.nominal} mK</span>
                      </div>
                      <div className="flex justify-between space-x-4">
                        <span className="text-slate-400">Drift Delta:</span>
                        <span className={data.delta >= 0 ? 'text-amber-400 font-bold' : 'text-cyan-400 font-bold'}>
                          {data.delta >= 0 ? `+${data.delta}` : data.delta} mK
                        </span>
                      </div>
                      <div className="flex justify-between space-x-4">
                        <span className="text-slate-400">Coherence:</span>
                        <span className="text-emerald-400 font-bold">{data.coherence}%</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Reference Line for SSoT Canonical 14.98 mK */}
            <ReferenceLine
              y={baseTemp}
              stroke="#10b981"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `SSoT Base ${baseTemp} mK`,
                fill: '#10b981',
                fontSize: 9,
                position: 'right',
              }}
            />
            {/* Area fill under curve */}
            <Area
              type="monotone"
              dataKey="temp"
              stroke="none"
              fillOpacity={1}
              fill="url(#cryoGradient)"
              isAnimationActive={false}
            />
            {/* Crisp Telemetry Line */}
            <Line
              type="monotone"
              dataKey="temp"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={{ r: 2, fill: '#22d3ee', stroke: '#0891b2', strokeWidth: 1 }}
              activeDot={{ r: 4, fill: '#67e8f9', stroke: '#ffffff', strokeWidth: 1.5 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] font-mono-code text-slate-500 pt-1">
        <div className="flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Sensor sampling rate: 1000 ms</span>
        </div>
        <div>
          <span>Quarantine Trigger Limit: &gt; 85.0°C (358.15 K)</span>
        </div>
      </div>
    </div>
  );
};
