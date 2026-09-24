/**
 * ZYRQUEN Ω∞ — Sovereign Chamber Verification Queue Service
 * Real-time queue manager for Sovereign Chamber verification and batch validation.
 * Supports pending chamber calculation, real-time subscriber notification,
 * and seamless coordination across VerificationGateBar, LegalTriggerMatrixSection,
 * and SovereignChambersControlPlane.
 */

export interface PendingChamberQueueItem {
  id: string; // e.g. "CH-00" ... "CH-18"
  chamberId?: number;
  name: string;
  enqueuedAt: string;
  status: 'PENDING' | 'VERIFYING' | 'VERIFIED' | 'FAILED';
  priority?: 'HIGH' | 'NORMAL' | 'LOW';
  anomalyScore?: number;
}

export type QueueListener = (pendingCount: number, queue: PendingChamberQueueItem[]) => void;

class SovereignChamberQueueService {
  private queue: PendingChamberQueueItem[] = [];
  private listeners: Set<QueueListener> = new Set();
  private isProcessing = false;

  constructor() {
    // Initialize with standard chambers pending initial verification if any
    // or seed from initial state (default 6 pending chambers awaiting periodic cycle or unverified)
    this.seedInitialQueue();
  }

  private seedInitialQueue(): void {
    // Initial chambers in queue waiting for batch verification
    const defaultPending: PendingChamberQueueItem[] = [
      { id: 'CH-02', name: 'Quarantine Enclave', enqueuedAt: new Date().toISOString(), status: 'PENDING', priority: 'HIGH', anomalyScore: 0.12 },
      { id: 'CH-06', name: 'Phoenix Recovery', enqueuedAt: new Date().toISOString(), status: 'PENDING', priority: 'NORMAL', anomalyScore: 0.02 },
      { id: 'CH-11', name: '8K Quantum Radar', enqueuedAt: new Date().toISOString(), status: 'PENDING', priority: 'NORMAL', anomalyScore: 0.04 },
      { id: 'CH-14', name: 'Warp Accelerator', enqueuedAt: new Date().toISOString(), status: 'PENDING', priority: 'NORMAL', anomalyScore: 0.05 },
      { id: 'CH-15', name: 'Cryo Fuel Synth', enqueuedAt: new Date().toISOString(), status: 'PENDING', priority: 'NORMAL', anomalyScore: 0.03 },
      { id: 'CH-18', name: 'Neural Sentinel', enqueuedAt: new Date().toISOString(), status: 'PENDING', priority: 'HIGH', anomalyScore: 0.08 },
    ];
    this.queue = defaultPending;
  }

  /**
   * Get current number of pending chambers in the verification queue
   */
  public getPendingCount(): number {
    return this.queue.filter((item) => item.status === 'PENDING' || item.status === 'VERIFYING').length;
  }

  /**
   * Get all items in the queue
   */
  public getQueue(): PendingChamberQueueItem[] {
    return [...this.queue];
  }

  /**
   * Subscribe to real-time pending queue updates
   */
  public subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    // Trigger immediately with current state
    listener(this.getPendingCount(), this.getQueue());

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const count = this.getPendingCount();
    const queue = this.getQueue();
    this.listeners.forEach((listener) => {
      try {
        listener(count, queue);
      } catch (err) {
        console.error('[ChamberQueueService] Error in listener:', err);
      }
    });
  }

  /**
   * Enqueue a chamber for verification
   */
  public enqueueChamber(chamber: { id: string; name: string; priority?: 'HIGH' | 'NORMAL' | 'LOW'; anomalyScore?: number }): void {
    const existingIndex = this.queue.findIndex((c) => c.id === chamber.id);
    if (existingIndex >= 0) {
      this.queue[existingIndex].status = 'PENDING';
      this.queue[existingIndex].enqueuedAt = new Date().toISOString();
    } else {
      this.queue.push({
        id: chamber.id,
        name: chamber.name,
        enqueuedAt: new Date().toISOString(),
        status: 'PENDING',
        priority: chamber.priority || 'NORMAL',
        anomalyScore: chamber.anomalyScore || 0.0,
      });
    }
    this.notify();
  }

  /**
   * Enqueue multiple chambers by IDs/names
   */
  public enqueueBatch(chambers: Array<{ id: string; name: string }>): void {
    chambers.forEach((c) => {
      this.enqueueChamber(c);
    });
  }

  /**
   * Process and verify all pending chambers in batch
   */
  public async processBatchVerify(): Promise<{ verifiedCount: number; durationMs: number }> {
    if (this.isProcessing) {
      return { verifiedCount: 0, durationMs: 0 };
    }

    this.isProcessing = true;
    const start = performance.now();

    // Mark as VERIFYING
    this.queue = this.queue.map((item) => ({
      ...item,
      status: item.status === 'PENDING' ? 'VERIFYING' : item.status,
    }));
    this.notify();

    // Allow UI animation step
    await new Promise((r) => setTimeout(r, 600));

    const totalToVerify = this.queue.filter((i) => i.status === 'VERIFYING').length;

    // Mark verified
    this.queue = this.queue.map((item) => ({
      ...item,
      status: item.status === 'VERIFYING' ? 'VERIFIED' : item.status,
    }));
    this.notify();

    // Clean up verified items after brief hold
    setTimeout(() => {
      this.queue = this.queue.filter((item) => item.status !== 'VERIFIED');
      this.isProcessing = false;
      this.notify();
    }, 1200);

    const durationMs = Math.round(performance.now() - start);
    return { verifiedCount: totalToVerify, durationMs };
  }

  /**
   * Reset / replenish queue for demonstration / simulation cycles
   */
  public replenishSimulatedQueue(count = 4): void {
    const pool = [
      { id: 'CH-01', name: 'Consensus Core' },
      { id: 'CH-03', name: 'HSM Deca-Key Roster' },
      { id: 'CH-05', name: 'Master Gates Array' },
      { id: 'CH-08', name: 'Dilithium-5 PQC' },
      { id: 'CH-10', name: 'Thai Legal Safe Harbor' },
      { id: 'CH-13', name: 'Multiverse Map' },
      { id: 'CH-16', name: '3D Quantum Visualizer' },
      { id: 'CH-17', name: 'Apex Command Plane' },
      { id: 'CH-18', name: 'Neural Sentinel' },
    ];

    // Pick count random items that aren't already pending
    const currentPendingIds = new Set(this.queue.map((c) => c.id));
    const available = pool.filter((c) => !currentPendingIds.has(c.id));

    available.slice(0, count).forEach((c) => {
      this.enqueueChamber({
        id: c.id,
        name: c.name,
        priority: 'NORMAL',
        anomalyScore: parseFloat((Math.random() * 0.05).toFixed(3)),
      });
    });
  }
}

export const sovereignChamberQueueService = new SovereignChamberQueueService();
