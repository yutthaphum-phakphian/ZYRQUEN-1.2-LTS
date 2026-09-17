/**
 * ZYRQUEN Ω∞ — GitHub Commit Log & SSoT Telemetry
 */

export interface CommitRecord {
  timestamp: string;
  message: string;
  merkleRoot: string;
  block: string;
  drift: string;
}

const COMMIT_LOG_STORAGE: CommitRecord[] = [];

export function logCommit(message: string, meta?: Partial<CommitRecord>): CommitRecord {
  const timestamp = new Date().toISOString();
  const record: CommitRecord = {
    timestamp,
    message,
    merkleRoot: meta?.merkleRoot || '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    block: meta?.block || '#849202',
    drift: meta?.drift || 'Δ0.00%',
  };
  COMMIT_LOG_STORAGE.unshift(record);
  console.log(`[${timestamp}] Sovereign Commit: ${message}`);
  return record;
}

export function getCommitHistory(): readonly CommitRecord[] {
  return [...COMMIT_LOG_STORAGE];
}
