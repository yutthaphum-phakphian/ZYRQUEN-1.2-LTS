import { useState, useEffect, useCallback } from 'react';

export interface MultiverseDimensionNode {
  id: string;
  code: string;
  name: string;
  sector: string;
  gateway: string;
  coherencePct: number;
  qOps: number;
  latencyMs: number;
  sealsBound: number;
  status: 'UNIFIED' | 'ROUTING' | 'STANDBY_BUFFER';
  coordinates: [number, number, number];
  accentHex: string;
}

export interface PanControlState {
  x: number;
  y: number;
  autoRotate: boolean;
}

export const INITIAL_MULTIVERSE_DIMENSIONS: MultiverseDimensionNode[] = [
  {
    id: 'dim-00',
    code: 'DIM-00',
    name: 'Genesis Canonical Anchor (#849202)',
    sector: 'Sector 00-GENESIS',
    gateway: 'Sovereign-Root-Gateway',
    coherencePct: 99.99,
    qOps: 851.9,
    latencyMs: 1.20,
    sealsBound: 14902,
    status: 'UNIFIED',
    coordinates: [0, 0, 0],
    accentHex: '#D4AF37',
  },
  {
    id: 'dim-01',
    code: 'DIM-01',
    name: 'Quantum Runtime Unifier Core',
    sector: 'Sector 01-UNIFIER',
    gateway: 'Unifier-Bridge-Mk3',
    coherencePct: 99.97,
    qOps: 924.4,
    latencyMs: 3.40,
    sealsBound: 14902,
    status: 'UNIFIED',
    coordinates: [-4.2, 1.1, -2.8],
    accentHex: '#06B6D4',
  },
  {
    id: 'dim-02',
    code: 'DIM-02',
    name: 'Chamber 02 Buffer Gamma Quarantine',
    sector: 'Sector 02-GAMMA',
    gateway: 'FailClosed-Airgap-Gate',
    coherencePct: 99.95,
    qOps: 412.0,
    latencyMs: 0.80,
    sealsBound: 80,
    status: 'STANDBY_BUFFER',
    coordinates: [4.2, -0.8, -2.8],
    accentHex: '#F59E0B',
  },
  {
    id: 'dim-09',
    code: 'DIM-09',
    name: 'Telemetry Core Port 8443 Stream',
    sector: 'Sector 08-XF4',
    gateway: 'OTLP-mTLS-8443',
    coherencePct: 99.98,
    qOps: 884.2,
    latencyMs: 35.80,
    sealsBound: 14902,
    status: 'UNIFIED',
    coordinates: [-3.5, 0.9, 3.2],
    accentHex: '#10B981',
  },
  {
    id: 'dim-10',
    code: 'DIM-10',
    name: 'Sovereign Dimension Router Gateway',
    sector: 'Sector 10-NEXUS',
    gateway: 'Nexus-Gateway-MkIII',
    coherencePct: 99.97,
    qOps: 1024.0,
    latencyMs: 11.20,
    sealsBound: 14902,
    status: 'ROUTING',
    coordinates: [3.6, 1.3, 3.1],
    accentHex: '#8B5CF6',
  },
  {
    id: 'dim-11',
    code: 'DIM-11',
    name: 'Celestial-Haven Continuum Node',
    sector: 'Sector 11-HAVEN',
    gateway: 'Celestial-Haven-Gate',
    coherencePct: 99.96,
    qOps: 2048.0,
    latencyMs: 14.98,
    sealsBound: 14902,
    status: 'UNIFIED',
    coordinates: [0, 2.2, -4.4],
    accentHex: '#06B6D4',
  },
];

export function useQuantumState() {
  const [dimensions, setDimensions] = useState<MultiverseDimensionNode[]>(INITIAL_MULTIVERSE_DIMENSIONS);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panControl, setPanControl] = useState<PanControlState>({
    x: 0,
    y: 0,
    autoRotate: true,
  });
  const [activeDimensionId, setActiveDimensionId] = useState<string>('dim-00');
  const [unifierStatus, setUnifierStatus] = useState<'UNIFIED_ZERO_DRIFT' | 'REBALANCING'>('UNIFIED_ZERO_DRIFT');

  useEffect(() => {
    const timer = setInterval(() => {
      setDimensions((prev) =>
        prev.map((d) => {
          const jitter = (Math.random() - 0.5) * 4.2;
          const nextQops = Math.max(200, +(d.qOps + jitter).toFixed(1));
          return {
            ...d,
            qOps: nextQops,
          };
        })
      );
    }, 2800);

    return () => clearInterval(timer);
  }, []);

  const unifyAllDimensions = useCallback(() => {
    setUnifierStatus('REBALANCING');
    setTimeout(() => {
      setDimensions((prev) =>
        prev.map((d) => ({
          ...d,
          coherencePct: d.id === 'dim-02' ? 99.95 : 99.99,
          status: d.id === 'dim-02' ? 'STANDBY_BUFFER' : 'UNIFIED',
        }))
      );
      setUnifierStatus('UNIFIED_ZERO_DRIFT');
    }, 450);
  }, []);

  return {
    dimensions,
    zoomLevel,
    setZoomLevel,
    panControl,
    setPanControl,
    activeDimensionId,
    setActiveDimensionId,
    unifierStatus,
    unifyAllDimensions,
  };
}
