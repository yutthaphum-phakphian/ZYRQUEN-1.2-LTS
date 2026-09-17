import { useState, useEffect } from 'react';
import { TelemetrySnapshot, getEntropyDrift } from '../utils/telemetrySnapshot';

export interface UseTelemetryReturn {
  snapshots: TelemetrySnapshot[];
  latestSnapshot: TelemetrySnapshot | null;
  addSnapshot: (data: Partial<TelemetrySnapshot>) => void;
  isStreaming: boolean;
}

const generateInitialSnapshots = (): TelemetrySnapshot[] => {
  const now = Date.now();
  const list: TelemetrySnapshot[] = [];
  for (let i = 20; i >= 0; i--) {
    const ts = now - i * 3000;
    const qops = 840 + Math.sin(i * 0.5) * 60;
    const coherence = 99.9;
    const drift = 26 + (Math.abs(Math.round(qops - coherence)) % 52);
    list.push({
      timestamp: ts,
      cpuLoad: +(38 + Math.sin(i * 0.4) * 8).toFixed(1),
      memoryUsage: +(5200 + Math.cos(i * 0.3) * 120).toFixed(0) as unknown as number,
      qopsThroughput: +qops.toFixed(1),
      coherence: +coherence.toFixed(2),
      entropyDrift: drift,
    });
  }
  return list;
};

export const useTelemetry = (): UseTelemetryReturn => {
  const [snapshots, setSnapshots] = useState<TelemetrySnapshot[]>(generateInitialSnapshots);

  useEffect(() => {
    const interval = setInterval(() => {
      setSnapshots((prev) => {
        const now = Date.now();
        const baseQops = 850 + (Math.random() * 80 - 40);
        const coherence = 99.98;
        const drift = getEntropyDrift({ qopsThroughput: baseQops, coherence });
        const newSnap: TelemetrySnapshot = {
          timestamp: now,
          cpuLoad: +(40 + Math.random() * 6).toFixed(1),
          memoryUsage: 5240,
          qopsThroughput: +baseQops.toFixed(1),
          coherence: +coherence.toFixed(2),
          entropyDrift: drift,
        };
        const next = [...prev.slice(-29), newSnap];
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const addSnapshot = (custom: Partial<TelemetrySnapshot>) => {
    const now = Date.now();
    const snap: TelemetrySnapshot = {
      timestamp: custom.timestamp || now,
      cpuLoad: custom.cpuLoad ?? 41.2,
      memoryUsage: custom.memoryUsage ?? 5214,
      qopsThroughput: custom.qopsThroughput ?? 851.9,
      coherence: custom.coherence ?? 99.98,
      entropyDrift: custom.entropyDrift ?? getEntropyDrift(custom),
    };
    setSnapshots((prev) => [...prev.slice(-29), snap]);
  };

  return {
    snapshots,
    latestSnapshot: snapshots[snapshots.length - 1] || null,
    addSnapshot,
    isStreaming: true,
  };
};
