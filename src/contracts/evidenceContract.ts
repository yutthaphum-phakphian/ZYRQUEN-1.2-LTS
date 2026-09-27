export type EvidenceState =
  | 'LIVE_RUNTIME'
  | 'STATIC_REFERENCE'
  | 'CACHED_FALLBACK'
  | 'TEST_FIXTURE';

export type EvidenceProvenance =
  | 'RUNTIME_API'
  | 'SOURCE_FILE'
  | 'CACHE'
  | 'TEST_FIXTURE';

export interface EvidenceBoundary {
  readonly evidenceState: EvidenceState;
  readonly provenance: EvidenceProvenance;
}

export const STATIC_REFERENCE_BOUNDARY: EvidenceBoundary = {
  evidenceState: 'STATIC_REFERENCE',
  provenance: 'SOURCE_FILE',
};

export function markStaticReference<T extends object>(value: T): T & EvidenceBoundary {
  return { ...value, ...STATIC_REFERENCE_BOUNDARY };
}
