/**
 * Quantum Pilot Core - Task Queue Management Service
 * Allows multiple agents to push tasks into a concurrency-controlled event loop,
 * ensuring atomic execution in the Sovereign OS.
 */

type QuantumTask = () => Promise<void>;

class QuantumPilotTaskQueue {
  private queue: QuantumTask[] = [];
  private isProcessing: boolean = false;
  private concurrencyLimit: number = 1;

  constructor(concurrencyLimit: number = 1) {
    this.concurrencyLimit = concurrencyLimit;
  }

  /**
   * Pushes a task from an agent into the atomic queue
   */
  public async pushTask(task: QuantumTask): Promise<void> {
    this.queue.push(task);
    if (!this.isProcessing) {
      // Intentionally not awaiting here to allow the caller to continue
      // while the background loop processes the queue asynchronously.
      this.processEventLoop();
    }
  }

  /**
   * Concurrency-controlled event loop ensuring atomic execution
   */
  private async processEventLoop(): Promise<void> {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }
    
    this.isProcessing = true;
    
    // Extract batch up to concurrency limit
    const batch = this.queue.splice(0, this.concurrencyLimit);
    
    // Execute atomically
    await Promise.allSettled(batch.map(task => task()));
    
    // Continue loop
    this.processEventLoop();
  }
  
  public getPendingTasksCount(): number {
    return this.queue.length;
  }
}

export const quantumTaskQueue = new QuantumPilotTaskQueue(1); // Strict atomic (1 by 1)
