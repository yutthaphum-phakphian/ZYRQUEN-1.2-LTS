/**
 * ZYRQUEN Ω∞ Dynamic Frame-Skip Scanner Optimizer
 *
 * Implements an adaptive frame-skipping algorithm based on real-time detected FPS:
 * - On slower devices / constrained frame rates (e.g. <= 20 FPS):
 *   Lowers the skip factor to 1 (scans every frame) so the camera remains snappy,
 *   responsive, and doesn't drop scan opportunities.
 * - On standard devices (30-60 FPS):
 *   Sets the skip factor to 2-4 (~15-18 decodes/sec), providing low latency while
 *   preventing thermal throttling and excessive CPU load.
 * - On high refresh-rate hardware (90Hz / 120Hz / 144Hz):
 *   Increases the skip factor up to 5-8 (~15-20 decodes/sec), conserving up to 85% CPU/battery.
 */

export interface FrameSkipTelemetry {
  fps: number;
  skipFactor: number;
  effectiveScanRate: number;
  tier: 'slow' | 'standard' | 'high-refresh';
}

export class DynamicFrameSkipController {
  private frameCount = 0;
  private lastTimestamp = 0;
  private frameDeltas: number[] = [];
  private maxHistory = 20;
  private currentFps = 60;
  private currentSkip = 3;
  private lastEvaluationTime = 0;
  private targetScanRate: number;
  private manualSkip: number | null;
  private isDynamic: boolean;

  constructor(options?: {
    targetScanRate?: number;
    manualSkip?: number | null;
    isDynamic?: boolean;
  }) {
    this.targetScanRate = options?.targetScanRate ?? 16;
    this.manualSkip = options?.manualSkip ?? null;
    this.isDynamic = options?.isDynamic ?? true;
  }

  public setOptions(options: {
    targetScanRate?: number;
    manualSkip?: number | null;
    isDynamic?: boolean;
  }): void {
    if (options.targetScanRate !== undefined) this.targetScanRate = options.targetScanRate;
    if (options.manualSkip !== undefined) this.manualSkip = options.manualSkip;
    if (options.isDynamic !== undefined) this.isDynamic = options.isDynamic;
  }

  /**
   * Called on every requestAnimationFrame tick.
   * Returns `true` if the expensive QR decode should run on this frame,
   * or `false` to skip the frame and save CPU cycles.
   */
  public shouldProcessFrame(now: number = typeof performance !== 'undefined' ? performance.now() : Date.now()): boolean {
    this.frameCount += 1;

    // Track delta and update FPS
    if (this.lastTimestamp > 0) {
      const delta = now - this.lastTimestamp;
      // Filter out background tab pauses or irregular spikes
      if (delta >= 4 && delta <= 500) {
        this.frameDeltas.push(delta);
        if (this.frameDeltas.length > this.maxHistory) {
          this.frameDeltas.shift();
        }
      }
    }
    this.lastTimestamp = now;

    // Periodically re-evaluate dynamic skip factor every ~300ms to avoid thrashing
    if (this.isDynamic && (!this.manualSkip || this.manualSkip <= 0)) {
      if (now - this.lastEvaluationTime > 300 && this.frameDeltas.length >= 5) {
        this.lastEvaluationTime = now;
        const avgDelta =
          this.frameDeltas.reduce((acc, val) => acc + val, 0) / this.frameDeltas.length;
        this.currentFps = Math.max(1, Math.round(1000 / avgDelta));

        // Adaptive skip factor formula:
        // Clamped between 1 (scan every frame on slow hardware) and 8 (high refresh rate hardware)
        const rawSkip = Math.round(this.currentFps / this.targetScanRate);
        this.currentSkip = Math.max(1, Math.min(8, rawSkip));
      }
    } else if (this.manualSkip && this.manualSkip > 0) {
      this.currentSkip = this.manualSkip;
    }

    return this.frameCount % this.currentSkip === 0;
  }

  public getTelemetry(): FrameSkipTelemetry {
    const fps = Math.max(1, Math.round(this.currentFps));
    const skipFactor = this.currentSkip;
    const effectiveScanRate = Math.round((fps / skipFactor) * 10) / 10;
    let tier: FrameSkipTelemetry['tier'] = 'standard';
    if (fps < 25) {
      tier = 'slow';
    } else if (fps > 75) {
      tier = 'high-refresh';
    }

    return {
      fps,
      skipFactor,
      effectiveScanRate,
      tier,
    };
  }

  public getCurrentSkip(): number {
    return this.currentSkip;
  }

  public getCurrentFps(): number {
    return this.currentFps;
  }

  public reset(): void {
    this.frameCount = 0;
    this.lastTimestamp = 0;
    this.frameDeltas = [];
    this.lastEvaluationTime = 0;
    this.currentFps = 60;
    this.currentSkip = 3;
  }
}
