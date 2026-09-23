/**
 * ZYRQUEN Ω∞ GitHub Synchronization & Forensic Checksum Engine
 * Manages Local Block Height vs Remote GitHub Branch parity,
 * Merkle Root parity score, and Time-Series Git Audit Logs.
 * SSoT: Δ0.00% ZERO DRIFT | Principal: นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)
 */

export interface GitHubCommitRecord {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  timestamp: string;
  blockHeight: number;
  pqcSignStatus: string;
  branch: string;
  merkleRoot: string;
  filesChanged: number;
  insertions: number;
  deletions: number;
  sealsCount: number;
  category: 'FEAT' | 'CI' | 'FREEZE' | 'AUDIT' | 'HSM' | 'PERF' | 'TREASURY' | 'GENESIS';
}

export interface GitHubSyncState {
  localBlockHeight: number;
  remoteBranchHeight: number;
  localMerkleRoot: string;
  remoteGitTreeSha: string;
  remoteBranch: string;
  remoteRepo: string;
  lastSyncTimestamp: string;
  isSyncing: boolean;
  driftCount: number; // remote - local
  syncHealthScore: number; // 0 - 100%
  merkleParityPercentage: number;
  matchingHexChars: number;
  status: 'SYNCED' | 'DRIFT_DETECTED' | 'RESYNCING' | 'RECONCILED';
  recentCommits: GitHubCommitRecord[];
  syncAuditLog: Array<{
    id: string;
    timestamp: string;
    action: string;
    previousDrift: number;
    newDrift: number;
    healthScore: number;
    actor: string;
  }>;
}

const CANONICAL_EPOCH_BLOCK = 849205;
const CANONICAL_MERKLE_ROOT = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

export const INITIAL_GITHUB_COMMITS: GitHubCommitRecord[] = [
  {
    sha: '54783c5a7f9b1029c4857d91e320f9a84b01e234',
    shortSha: '54783c5',
    message: 'feat(epoch): anchor canonical epoch #849205 with 14,905 seals & 3D holographic continuum',
    author: 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
    timestamp: '2026-09-11T19:38:50Z',
    blockHeight: 849205,
    pqcSignStatus: 'ML-DSA-87 / FIPS 204 Validated',
    branch: 'main',
    merkleRoot: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    filesChanged: 8,
    insertions: 285,
    deletions: 42,
    sealsCount: 14905,
    category: 'FEAT',
  },
  {
    sha: '909ab814479844d8a14816bed34cdbb07528e185',
    shortSha: '909ab81',
    message: 'ci(actions): harden github pages deployment with relative base & SPA 404 fallback',
    author: 'CI Gatekeeper Bot (#BOT-CI-PQC)',
    timestamp: '2026-09-11T18:35:00Z',
    blockHeight: 849204,
    pqcSignStatus: 'SPHINCS+ / FIPS 205 Validated',
    branch: 'main',
    merkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    filesChanged: 3,
    insertions: 120,
    deletions: 18,
    sealsCount: 14902,
    category: 'CI',
  },
  {
    sha: '849203a11974ef9a0134cd981b23450912f02931',
    shortSha: '849203a',
    message: 'freeze(lts): lock sovereign kernel frozen v1.2 LTS & boundary Ω600_1000 strict',
    author: 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
    timestamp: '2026-09-11T17:15:22Z',
    blockHeight: 849203,
    pqcSignStatus: 'ML-DSA-87 / FIPS 204 Validated',
    branch: 'main',
    merkleRoot: '849203fa109844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    filesChanged: 14,
    insertions: 480,
    deletions: 110,
    sealsCount: 14902,
    category: 'FREEZE',
  },
  {
    sha: '40202bf9214a1084ef7129ca08123ef10248ab90',
    shortSha: '40202bf',
    message: 'audit(etda): verify safe harbor invariants under Thai ETDA Sec 9/26/28 & PDPA Sec 37',
    author: 'Legal HSM Attestation Oracle (#ORACLE-ETDA)',
    timestamp: '2026-09-11T16:00:10Z',
    blockHeight: 849202,
    pqcSignStatus: 'ML-KEM-1024 / FIPS 203 Validated',
    branch: 'main',
    merkleRoot: '40202bc898fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    filesChanged: 5,
    insertions: 92,
    deletions: 0,
    sealsCount: 14902,
    category: 'AUDIT',
  },
  {
    sha: '14902ac71829034ebc1928374a019842bf091244',
    shortSha: '14902ac',
    message: 'hsm(quorum): attest 10/10 hardware HSM quorum at sub-kelvin 14.98 mK temperature',
    author: 'Cryo-HSM Custodian Cluster (#HSM-QUORUM-10)',
    timestamp: '2026-09-11T14:42:00Z',
    blockHeight: 849201,
    pqcSignStatus: 'FIPS 140-3 Level 4 Hardware HSM',
    branch: 'main',
    merkleRoot: '14902aa898fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    filesChanged: 6,
    insertions: 140,
    deletions: 12,
    sealsCount: 14902,
    category: 'HSM',
  },
  {
    sha: '14200ms819024bac0192847a0293847291048123',
    shortSha: '14200ms',
    message: 'perf(sla): enforce 142ms replay execution SLA with zero drift Δ0.00% in CI gatekeeper',
    author: 'CI Gatekeeper Bot (#BOT-CI-PQC)',
    timestamp: '2026-09-11T12:10:45Z',
    blockHeight: 849200,
    pqcSignStatus: 'SPHINCS+ / FIPS 205 Validated',
    branch: 'main',
    merkleRoot: '14200bb898fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    filesChanged: 4,
    insertions: 65,
    deletions: 5,
    sealsCount: 14902,
    category: 'PERF',
  },
  {
    sha: '423000b01928374fa01928471b0293847a019284',
    shortSha: '423000b',
    message: 'treasury(rwa): bind 4.23B THB sovereign balance sheet and 14,902 oz gold reserve',
    author: 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
    timestamp: '2026-09-11T09:30:18Z',
    blockHeight: 849199,
    pqcSignStatus: 'ML-DSA-87 / FIPS 204 Validated',
    branch: 'main',
    merkleRoot: '42300ff898fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    filesChanged: 7,
    insertions: 210,
    deletions: 30,
    sealsCount: 14902,
    category: 'TREASURY',
  },
  {
    sha: 'f195204898fc1c149afbf4c8996fb92427ae41e4',
    shortSha: 'f195204',
    message: 'pqc(fips): deploy post-quantum cryptography suite FIPS 203 ML-KEM & FIPS 204 ML-DSA',
    author: 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
    timestamp: '2026-09-10T22:15:00Z',
    blockHeight: 849198,
    pqcSignStatus: 'ML-DSA-87 / FIPS 204 Validated',
    branch: 'main',
    merkleRoot: 'f195204898fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    filesChanged: 12,
    insertions: 780,
    deletions: 140,
    sealsCount: 14902,
    category: 'FEAT',
  },
  {
    sha: 'b6f001aa98fc1c149afbf4c8996fb92427ae41e4',
    shortSha: 'b6f001a',
    message: 'bft(mesh): configure 6-node consensus network with Byzantine fault tolerance',
    author: 'Consensus Mesh Coordinator (#NODE-BFT-01)',
    timestamp: '2026-09-10T18:00:30Z',
    blockHeight: 849197,
    pqcSignStatus: 'SPHINCS+ / FIPS 205 Validated',
    branch: 'main',
    merkleRoot: 'b6f001aa98fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    filesChanged: 9,
    insertions: 320,
    deletions: 45,
    sealsCount: 14902,
    category: 'FEAT',
  },
  {
    sha: '8492020a109844d8a14816bed34cdbb07528e185',
    shortSha: '8492020',
    message: 'genesis(sovereign): initialize ZYRQUEN Ω∞ sovereign world engine genesis block #849202',
    author: 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
    timestamp: '2026-09-10T12:00:00Z',
    blockHeight: 849202,
    pqcSignStatus: 'ML-DSA-87 / FIPS 204 Sovereign Genesis Master',
    branch: 'main',
    merkleRoot: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
    filesChanged: 42,
    insertions: 4500,
    deletions: 0,
    sealsCount: 14902,
    category: 'GENESIS',
  },
];

function calculateChecksumParity(str1: string, str2: string): { matchingChars: number; percentage: number } {
  let matches = 0;
  const len = Math.max(str1.length, str2.length);
  for (let i = 0; i < len; i++) {
    if (str1[i] && str2[i] && str1[i] === str2[i]) {
      matches++;
    }
  }
  const percentage = Math.round((matches / 64) * 100);
  return { matchingChars: matches, percentage: Math.min(100, Math.max(0, percentage)) };
}

function calculateSyncHealth(localBlock: number, remoteBlock: number, parityPct: number): number {
  const blockDiff = Math.abs(remoteBlock - localBlock);
  if (blockDiff === 0 && parityPct === 100) return 100;
  // Penalty for block drift and checksum mismatch
  const blockPenalty = blockDiff * 6;
  const parityPenalty = (100 - parityPct) * 0.5;
  const rawScore = 100 - blockPenalty - parityPenalty;
  return Math.max(12, Math.min(100, Math.round(rawScore)));
}

let syncState: GitHubSyncState = {
  localBlockHeight: CANONICAL_EPOCH_BLOCK,
  remoteBranchHeight: CANONICAL_EPOCH_BLOCK,
  localMerkleRoot: CANONICAL_MERKLE_ROOT,
  remoteGitTreeSha: CANONICAL_MERKLE_ROOT,
  remoteBranch: 'origin/main',
  remoteRepo: 'yutthaphum-phakphian/ZYRQUEN-1.2-LTS',
  lastSyncTimestamp: new Date().toISOString(),
  isSyncing: false,
  driftCount: 0,
  syncHealthScore: 100,
  merkleParityPercentage: 100,
  matchingHexChars: 64,
  status: 'SYNCED',
  recentCommits: [...INITIAL_GITHUB_COMMITS],
  syncAuditLog: [
    {
      id: 'SYNC-AUDIT-001',
      timestamp: new Date().toISOString(),
      action: 'CANONICAL_GENESIS_ALIGNMENT',
      previousDrift: 0,
      newDrift: 0,
      healthScore: 100,
      actor: 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
    },
  ],
};

type SyncListener = (state: GitHubSyncState) => void;
const listeners = new Set<SyncListener>();

function notify() {
  const snapshot = { ...syncState };
  listeners.forEach((fn) => {
    try {
      fn(snapshot);
    } catch {
      // ignore
    }
  });
}

export const githubSyncService = {
  getState(): GitHubSyncState {
    return { ...syncState };
  },

  subscribe(listener: SyncListener): () => void {
    listeners.add(listener);
    listener({ ...syncState });
    return () => {
      listeners.delete(listener);
    };
  },

  /**
   * Simulate a drift in the remote GitHub branch (e.g. new remote commit pushed ahead)
   */
  simulateDrift(delta = 2) {
    const newRemoteHeight = syncState.localBlockHeight + delta;
    // Generate a slightly drifted tree sha to simulate divergence
    const driftedSha = 'f9a2c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852c009';
    const parity = calculateChecksumParity(syncState.localMerkleRoot, driftedSha);
    const health = calculateSyncHealth(syncState.localBlockHeight, newRemoteHeight, parity.percentage);

    const prevDrift = syncState.driftCount;
    syncState = {
      ...syncState,
      remoteBranchHeight: newRemoteHeight,
      remoteGitTreeSha: driftedSha,
      driftCount: delta,
      matchingHexChars: parity.matchingChars,
      merkleParityPercentage: parity.percentage,
      syncHealthScore: health,
      status: 'DRIFT_DETECTED',
      lastSyncTimestamp: new Date().toISOString(),
      syncAuditLog: [
        {
          id: `SYNC-DRIFT-${Date.now().toString().slice(-4)}`,
          timestamp: new Date().toISOString(),
          action: `REMOTE_BRANCH_ADVANCE_+${delta}_BLOCKS`,
          previousDrift: prevDrift,
          newDrift: delta,
          healthScore: health,
          actor: 'Remote Git Oracle / GitHub Webhook',
        },
        ...syncState.syncAuditLog.slice(0, 19),
      ],
    };

    notify();
  },

  /**
   * Force Remote Re-sync trigger for manual intervention
   */
  async forceRemoteResync(targetBlockHeight?: number): Promise<GitHubSyncState> {
    syncState = {
      ...syncState,
      isSyncing: true,
      status: 'RESYNCING',
    };
    notify();

    // Deterministic resync delay for realistic cryptographic reconciliation animation
    await new Promise((resolve) => setTimeout(resolve, 850));

    const finalBlock = targetBlockHeight ?? Math.max(syncState.localBlockHeight, syncState.remoteBranchHeight);
    const prevDrift = syncState.driftCount;

    // Add a re-sync commit record to the top of the commit stream
    const resyncCommit: GitHubCommitRecord = {
      sha: `c${Date.now().toString(16).slice(-6)}849205f909ab814`,
      shortSha: `c${Date.now().toString(16).slice(-6)}`,
      message: `sync(reconcile): force remote re-sync aligned to canonical block #${finalBlock} (Δ0.00%)`,
      author: 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
      timestamp: new Date().toISOString(),
      blockHeight: finalBlock,
      pqcSignStatus: 'ML-DSA-87 / FIPS 204 Validated',
      branch: 'main',
      merkleRoot: CANONICAL_MERKLE_ROOT,
      filesChanged: 2,
      insertions: 18,
      deletions: 0,
      sealsCount: 14905,
      category: 'FREEZE',
    };

    syncState = {
      ...syncState,
      localBlockHeight: finalBlock,
      remoteBranchHeight: finalBlock,
      localMerkleRoot: CANONICAL_MERKLE_ROOT,
      remoteGitTreeSha: CANONICAL_MERKLE_ROOT,
      driftCount: 0,
      matchingHexChars: 64,
      merkleParityPercentage: 100,
      syncHealthScore: 100,
      status: 'SYNCED',
      isSyncing: false,
      lastSyncTimestamp: new Date().toISOString(),
      recentCommits: [resyncCommit, ...syncState.recentCommits.slice(0, 9)],
      syncAuditLog: [
        {
          id: `RESYNC-${Date.now().toString().slice(-4)}`,
          timestamp: new Date().toISOString(),
          action: `MANUAL_RECONCILIATION_RESOLVED_Δ0.00%`,
          previousDrift: prevDrift,
          newDrift: 0,
          healthScore: 100,
          actor: 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
        },
        ...syncState.syncAuditLog.slice(0, 19),
      ],
    };

    notify();
    return { ...syncState };
  },

  /**
   * Reset to baseline canonical state
   */
  resetToCanonical() {
    syncState = {
      ...syncState,
      localBlockHeight: CANONICAL_EPOCH_BLOCK,
      remoteBranchHeight: CANONICAL_EPOCH_BLOCK,
      localMerkleRoot: CANONICAL_MERKLE_ROOT,
      remoteGitTreeSha: CANONICAL_MERKLE_ROOT,
      driftCount: 0,
      matchingHexChars: 64,
      merkleParityPercentage: 100,
      syncHealthScore: 100,
      status: 'SYNCED',
      isSyncing: false,
      lastSyncTimestamp: new Date().toISOString(),
      recentCommits: [...INITIAL_GITHUB_COMMITS],
    };
    notify();
  },
};
