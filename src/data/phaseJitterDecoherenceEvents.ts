// src/data/phaseJitterDecoherenceEvents.ts
/**
 * Canonical 42 Audit Events of PHASE_JITTER_DECOHERENCE
 * Period: 2026-09-24 11:17:05 UTC – 11:24:20 UTC (~7m 15s)
 * Anomaly Score: 100.00% (All events exceeded active threshold of 85%)
 * Cascading Phase Jitter across 6 Global Mesh Consensus Nodes:
 * SG02 (11), TY03 (9), LD06 (9), SV05 (8), BK01 (4), ZH04 (2)
 */

export type CanonicalMeshNodeId = 'BK01' | 'SG02' | 'TY03' | 'ZH04' | 'SV05' | 'LD06';

export interface PhaseJitterAuditRecord {
  eventId: string;
  timestampIso: string;
  timestampMs: number;
  nodeId: CanonicalMeshNodeId;
  anomalyScorePct: number;
  triggerType: string;
  activeThresholdPct: number;
}

export const CANONICAL_PHASE_JITTER_EVENTS: PhaseJitterAuditRecord[] = [
  { eventId: 'BRK-58904', timestampIso: '2026-09-24T11:23:43.855Z', timestampMs: 1790249023855, nodeId: 'TY03', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-22217', timestampIso: '2026-09-24T11:23:59.514Z', timestampMs: 1790249039514, nodeId: 'BK01', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-72667', timestampIso: '2026-09-24T11:24:20.157Z', timestampMs: 1790249060157, nodeId: 'TY03', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-87700', timestampIso: '2026-09-24T11:23:39.361Z', timestampMs: 1790249019361, nodeId: 'SG02', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-79427', timestampIso: '2026-09-24T11:23:27.720Z', timestampMs: 1790249007720, nodeId: 'SG02', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-53780', timestampIso: '2026-09-24T11:22:52.838Z', timestampMs: 1790248972838, nodeId: 'SV05', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-53069', timestampIso: '2026-09-24T11:22:41.295Z', timestampMs: 1790248961295, nodeId: 'TY03', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-85099', timestampIso: '2026-09-24T11:22:34.077Z', timestampMs: 1790248954077, nodeId: 'BK01', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-69633', timestampIso: '2026-09-24T11:22:27.202Z', timestampMs: 1790248947202, nodeId: 'BK01', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-39411', timestampIso: '2026-09-24T11:17:58.179Z', timestampMs: 1790248678179, nodeId: 'SV05', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-32827', timestampIso: '2026-09-24T11:20:03.883Z', timestampMs: 1790248803883, nodeId: 'SG02', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-57875', timestampIso: '2026-09-24T11:17:55.337Z', timestampMs: 1790248675337, nodeId: 'SV05', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-35475', timestampIso: '2026-09-24T11:21:04.553Z', timestampMs: 1790248864553, nodeId: 'SV05', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-24377', timestampIso: '2026-09-24T11:20:55.204Z', timestampMs: 1790248855204, nodeId: 'LD06', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-91573', timestampIso: '2026-09-24T11:20:31.865Z', timestampMs: 1790248831865, nodeId: 'TY03', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-84191', timestampIso: '2026-09-24T11:19:51.504Z', timestampMs: 1790248791504, nodeId: 'LD06', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-75671', timestampIso: '2026-09-24T11:21:08.004Z', timestampMs: 1790248868004, nodeId: 'ZH04', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-88604', timestampIso: '2026-09-24T11:21:30.381Z', timestampMs: 1790248890381, nodeId: 'LD06', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-51640', timestampIso: '2026-09-24T11:20:06.751Z', timestampMs: 1790248806751, nodeId: 'SV05', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-63099', timestampIso: '2026-09-24T11:19:31.643Z', timestampMs: 1790248771643, nodeId: 'SG02', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-89928', timestampIso: '2026-09-24T11:19:54.106Z', timestampMs: 1790248794106, nodeId: 'SG02', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-57486', timestampIso: '2026-09-24T11:21:26.435Z', timestampMs: 1790248886435, nodeId: 'LD06', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-86545', timestampIso: '2026-09-24T11:18:06.889Z', timestampMs: 1790248686889, nodeId: 'SG02', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-35406', timestampIso: '2026-09-24T11:17:05.846Z', timestampMs: 1790248625846, nodeId: 'TY03', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-80864', timestampIso: '2026-09-24T11:17:18.681Z', timestampMs: 1790248638681, nodeId: 'TY03', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-44614', timestampIso: '2026-09-24T11:17:33.004Z', timestampMs: 1790248653004, nodeId: 'ZH04', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-36729', timestampIso: '2026-09-24T11:22:25.351Z', timestampMs: 1790248945351, nodeId: 'SG02', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-65729', timestampIso: '2026-09-24T11:22:22.626Z', timestampMs: 1790248942626, nodeId: 'LD06', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-15359', timestampIso: '2026-09-24T11:21:51.551Z', timestampMs: 1790248911551, nodeId: 'LD06', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-43545', timestampIso: '2026-09-24T11:21:54.018Z', timestampMs: 1790248914018, nodeId: 'LD06', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-61431', timestampIso: '2026-09-24T11:21:39.909Z', timestampMs: 1790248899909, nodeId: 'BK01', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-14168', timestampIso: '2026-09-24T11:19:18.517Z', timestampMs: 1790248758517, nodeId: 'SV05', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-38190', timestampIso: '2026-09-24T11:18:31.564Z', timestampMs: 1790248711564, nodeId: 'TY03', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-31652', timestampIso: '2026-09-24T11:18:00.071Z', timestampMs: 1790248680071, nodeId: 'ZH04', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-46223', timestampIso: '2026-09-24T11:17:36.968Z', timestampMs: 1790248656968, nodeId: 'SG02', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-62746', timestampIso: '2026-09-24T11:17:51.730Z', timestampMs: 1790248671730, nodeId: 'SV05', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-65420', timestampIso: '2026-09-24T11:19:05.559Z', timestampMs: 1790248745559, nodeId: 'TY03', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-45687', timestampIso: '2026-09-24T11:18:58.459Z', timestampMs: 1790248738459, nodeId: 'SG02', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-27534', timestampIso: '2026-09-24T11:18:23.396Z', timestampMs: 1790248703396, nodeId: 'LD06', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-34261', timestampIso: '2026-09-24T11:18:35.729Z', timestampMs: 1790248715729, nodeId: 'SV05', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-92688', timestampIso: '2026-09-24T11:21:17.676Z', timestampMs: 1790248877676, nodeId: 'SG02', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
  { eventId: 'BRK-58723', timestampIso: '2026-09-24T11:21:32.446Z', timestampMs: 1790248892446, nodeId: 'SG02', anomalyScorePct: 100.0, triggerType: 'PHASE_JITTER_DECOHERENCE', activeThresholdPct: 85 },
];

export const NODE_IMPACT_SUMMARY = [
  { nodeId: 'SG02', count: 11, role: 'Severe Sustained decoherence across window' },
  { nodeId: 'TY03', count: 9, role: 'Origin and cross-mesh transmission' },
  { nodeId: 'LD06', count: 9, role: 'Severe burst event during peak window' },
  { nodeId: 'SV05', count: 8, role: 'High frequency early-to-mid stage' },
  { nodeId: 'BK01', count: 4, role: 'Terminal tail spread' },
  { nodeId: 'ZH04', count: 2, role: 'Initial co-occurrence with TY03 & SG02' },
];
