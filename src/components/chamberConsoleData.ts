export type ChamberStatus = 'pure_green' | 'unstable' | 'quarantined';
export type CoherenceTrend = 'rising' | 'stable' | 'falling';
export type GridDensity = 'compact' | 'expanded';

export interface CryoChamber {
  id: number;
  chamberId: string;
  name: string;
  coherence: number;
  coherenceTrend: CoherenceTrend;
  temperature: number;
  status: ChamberStatus;
  merkleHash: string;
  lastSync: string;
  history24h: number[];
}

export type SortCriterion =
  | 'coherence_desc'
  | 'coherence_asc'
  | 'temp_desc'
  | 'temp_asc'
  | 'sync_desc'
  | 'sync_asc'
  | 'status_pure'
  | 'status_unstable';

export interface StabilityDataPoint {
  hour: number;
  stabilityPercent: number;
  anomalyCount: number;
  avgCoherence: number;
}

export interface SignerMetadata {
  signerId: string;
  role: string;
  hsmSerial: string;
  timestamp: string;
}

export interface ToastAlert {
  id: string;
  chamberId: string;
  chamberName: string;
  coherence: number;
  timestamp: string;
}

export const INITIAL_18_CHAMBERS: CryoChamber[] = [
  { id: 1,  chamberId: 'CH-001', name: 'Cryo Array Alpha-1',   coherence: 0.998, coherenceTrend: 'rising',  temperature: 14.82, status: 'pure_green', merkleHash: '0x8f92a1c412e4', lastSync: '14:42:01', history24h: [0.992, 0.994, 0.995, 0.996, 0.997, 0.997, 0.998, 0.998] },
  { id: 2,  chamberId: 'CH-002', name: 'Cryo Array Alpha-2',   coherence: 0.995, coherenceTrend: 'stable',  temperature: 14.90, status: 'pure_green', merkleHash: '0x1a2b3c4d5e6f', lastSync: '14:42:02', history24h: [0.995, 0.996, 0.994, 0.995, 0.995, 0.994, 0.995, 0.995] },
  { id: 3,  chamberId: 'CH-003', name: 'Cryo Array Alpha-3',   coherence: 0.742, coherenceTrend: 'falling', temperature: 29.40, status: 'unstable',   merkleHash: '0x3b4c5d6e7f8a', lastSync: '14:42:03', history24h: [0.980, 0.950, 0.910, 0.880, 0.820, 0.790, 0.760, 0.742] },
  { id: 4,  chamberId: 'CH-004', name: 'Cryo Array Beta-1',    coherence: 0.999, coherenceTrend: 'rising',  temperature: 14.75, status: 'pure_green', merkleHash: '0x5c6d7e8f9a0b', lastSync: '14:42:04', history24h: [0.995, 0.996, 0.997, 0.998, 0.998, 0.999, 0.999, 0.999] },
  { id: 5,  chamberId: 'CH-005', name: 'Cryo Array Beta-2',    coherence: 0.992, coherenceTrend: 'falling', temperature: 15.10, status: 'pure_green', merkleHash: '0x7e8f9a0b1c2d', lastSync: '14:42:05', history24h: [0.998, 0.997, 0.996, 0.995, 0.994, 0.993, 0.992, 0.992] },
  { id: 6,  chamberId: 'CH-006', name: 'Cryo Array Beta-3',    coherence: 0.997, coherenceTrend: 'stable',  temperature: 14.88, status: 'pure_green', merkleHash: '0x9a0b1c2d3e4f', lastSync: '14:42:06', history24h: [0.997, 0.997, 0.996, 0.997, 0.998, 0.997, 0.997, 0.997] },
  { id: 7,  chamberId: 'CH-007', name: 'Cryo Array Gamma-1',   coherence: 0.680, coherenceTrend: 'falling', temperature: 31.20, status: 'unstable',   merkleHash: '0x0b1c2d3e4f5a', lastSync: '14:42:07', history24h: [0.940, 0.910, 0.860, 0.800, 0.750, 0.720, 0.690, 0.680] },
  { id: 8,  chamberId: 'CH-008', name: 'Cryo Array Gamma-2',   coherence: 0.996, coherenceTrend: 'rising',  temperature: 14.95, status: 'pure_green', merkleHash: '0x2c3d4e5f6a7b', lastSync: '14:42:08', history24h: [0.990, 0.992, 0.993, 0.994, 0.995, 0.995, 0.996, 0.996] },
  { id: 9,  chamberId: 'CH-009', name: 'Cryo Array Gamma-3',   coherence: 0.999, coherenceTrend: 'stable',  temperature: 14.70, status: 'pure_green', merkleHash: '0x4d5e6f7a8b9c', lastSync: '14:42:09', history24h: [0.999, 0.999, 0.998, 0.999, 0.999, 0.999, 0.999, 0.999] },
  { id: 10, chamberId: 'CH-010', name: 'Cryo Array Delta-1',   coherence: 0.991, coherenceTrend: 'falling', temperature: 15.05, status: 'pure_green', merkleHash: '0x6e7f8a9b0c1d', lastSync: '14:42:10', history24h: [0.996, 0.995, 0.994, 0.993, 0.992, 0.992, 0.991, 0.991] },
  { id: 11, chamberId: 'CH-011', name: 'Cryo Array Delta-2',   coherence: 0.994, coherenceTrend: 'rising',  temperature: 14.92, status: 'pure_green', merkleHash: '0x8a9b0c1d2e3f', lastSync: '14:42:11', history24h: [0.988, 0.990, 0.991, 0.992, 0.993, 0.993, 0.994, 0.994] },
  { id: 12, chamberId: 'CH-012', name: 'Cryo Array Delta-3',   coherence: 0.710, coherenceTrend: 'falling', temperature: 28.90, status: 'unstable',   merkleHash: '0x0b1c2d3e4f5a', lastSync: '14:42:12', history24h: [0.950, 0.920, 0.880, 0.830, 0.780, 0.740, 0.720, 0.710] },
  { id: 13, chamberId: 'CH-013', name: 'Cryo Array Epsilon-1', coherence: 0.998, coherenceTrend: 'rising',  temperature: 14.80, status: 'pure_green', merkleHash: '0x2d3e4f5a6b7c', lastSync: '14:42:13', history24h: [0.993, 0.994, 0.995, 0.996, 0.997, 0.997, 0.998, 0.998] },
  { id: 14, chamberId: 'CH-014', name: 'Cryo Array Epsilon-2', coherence: 0.997, coherenceTrend: 'stable',  temperature: 14.85, status: 'pure_green', merkleHash: '0x4f5a6b7c8d9e', lastSync: '14:42:14', history24h: [0.996, 0.997, 0.997, 0.996, 0.997, 0.997, 0.997, 0.997] },
  { id: 15, chamberId: 'CH-015', name: 'Cryo Array Epsilon-3', coherence: 0.993, coherenceTrend: 'falling', temperature: 15.12, status: 'pure_green', merkleHash: '0x6a7b8c9d0e1f', lastSync: '14:42:15', history24h: [0.997, 0.996, 0.995, 0.995, 0.994, 0.994, 0.993, 0.993] },
  { id: 16, chamberId: 'CH-016', name: 'Cryo Array Zeta-1',    coherence: 0.999, coherenceTrend: 'rising',  temperature: 14.72, status: 'pure_green', merkleHash: '0x8c9d0e1f2a3b', lastSync: '14:42:16', history24h: [0.995, 0.996, 0.997, 0.998, 0.998, 0.999, 0.999, 0.999] },
  { id: 17, chamberId: 'CH-017', name: 'Cryo Array Zeta-2',    coherence: 0.795, coherenceTrend: 'falling', temperature: 26.80, status: 'unstable',   merkleHash: '0x0a1b2c3d4e5f', lastSync: '14:42:17', history24h: [0.960, 0.930, 0.890, 0.850, 0.820, 0.810, 0.800, 0.795] },
  { id: 18, chamberId: 'CH-018', name: 'Neural Sentinel & Predictive Governance', coherence: 0.999, coherenceTrend: 'rising',  temperature: 14.98, status: 'pure_green', merkleHash: '0x2b3c4d5e6f7a', lastSync: '14:42:18', history24h: [0.995, 0.996, 0.997, 0.998, 0.998, 0.999, 0.999, 0.999] }
];

export const SYSTEM_24H_STABILITY: StabilityDataPoint[] = [
  { hour: 0,  stabilityPercent: 99.85, anomalyCount: 0, avgCoherence: 0.998 },
  { hour: 1,  stabilityPercent: 99.90, anomalyCount: 0, avgCoherence: 0.999 },
  { hour: 2,  stabilityPercent: 99.88, anomalyCount: 0, avgCoherence: 0.998 },
  { hour: 3,  stabilityPercent: 99.92, anomalyCount: 0, avgCoherence: 0.999 },
  { hour: 4,  stabilityPercent: 99.78, anomalyCount: 1, avgCoherence: 0.985 },
  { hour: 5,  stabilityPercent: 99.82, anomalyCount: 0, avgCoherence: 0.992 },
  { hour: 6,  stabilityPercent: 99.95, anomalyCount: 0, avgCoherence: 0.999 },
  { hour: 7,  stabilityPercent: 99.91, anomalyCount: 0, avgCoherence: 0.998 },
  { hour: 8,  stabilityPercent: 98.40, anomalyCount: 3, avgCoherence: 0.942 },
  { hour: 9,  stabilityPercent: 97.90, anomalyCount: 4, avgCoherence: 0.915 },
  { hour: 10, stabilityPercent: 99.10, anomalyCount: 1, avgCoherence: 0.978 },
  { hour: 11, stabilityPercent: 99.70, anomalyCount: 0, avgCoherence: 0.994 },
  { hour: 12, stabilityPercent: 99.89, anomalyCount: 0, avgCoherence: 0.998 },
  { hour: 13, stabilityPercent: 99.94, anomalyCount: 0, avgCoherence: 0.999 },
  { hour: 14, stabilityPercent: 99.80, anomalyCount: 1, avgCoherence: 0.989 },
  { hour: 15, stabilityPercent: 99.87, anomalyCount: 0, avgCoherence: 0.995 },
  { hour: 16, stabilityPercent: 99.93, anomalyCount: 0, avgCoherence: 0.998 },
  { hour: 17, stabilityPercent: 99.90, anomalyCount: 0, avgCoherence: 0.997 },
  { hour: 18, stabilityPercent: 98.20, anomalyCount: 3, avgCoherence: 0.935 },
  { hour: 19, stabilityPercent: 99.50, anomalyCount: 1, avgCoherence: 0.982 },
  { hour: 20, stabilityPercent: 99.88, anomalyCount: 0, avgCoherence: 0.998 },
  { hour: 21, stabilityPercent: 99.92, anomalyCount: 0, avgCoherence: 0.999 },
  { hour: 22, stabilityPercent: 99.96, anomalyCount: 0, avgCoherence: 0.999 },
  { hour: 23, stabilityPercent: 99.94, anomalyCount: 0, avgCoherence: 0.998 }
];
