export class WorkspaceLock {
  private readonly tails = new Map<string, Promise<void>>();

  async runExclusive<T>(
    workspaceId: string,
    operation: () => Promise<T> | T
  ): Promise<T> {
    const previous = this.tails.get(workspaceId) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>(resolve => {
      release = resolve;
    });
    const tail = previous.then(() => current);
    this.tails.set(workspaceId, tail);
    await previous;
    try {
      return await operation();
    } finally {
      release();
      if (this.tails.get(workspaceId) === tail) this.tails.delete(workspaceId);
    }
  }

  isLocked(workspaceId: string): boolean {
    return this.tails.has(workspaceId);
  }
}
