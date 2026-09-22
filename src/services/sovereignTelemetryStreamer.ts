export interface TelemetryFrame {
  timestamp: string;
  blockHeight: number;
  cryoTemperature: number;
  coherenceScore: number;
  qopsThroughput: number;
}

export class SovereignTelemetryStreamer {
  private readonly url: string;
  private ws: WebSocket | null = null;
  private mockInterval: number | null = null;
  private listeners: Array<(frame: TelemetryFrame) => void> = [];

  public constructor(url = 'wss://nexus.zyrquen.internal/v4/omni-stream') {
    this.url = url;
  }

  public connect(): void {
    if (this.ws || this.mockInterval !== null) return;
    try {
      this.ws = new WebSocket(this.url);
      this.ws.onmessage = (event) => {
        try {
          this.notify(JSON.parse(event.data) as TelemetryFrame);
        } catch {
          this.fallbackSimulatedStream();
        }
      };
      this.ws.onerror = () => this.fallbackSimulatedStream();
    } catch {
      this.fallbackSimulatedStream();
    }
  }

  private fallbackSimulatedStream(): void {
    if (this.mockInterval !== null) return;
    this.mockInterval = window.setInterval(() => {
      this.notify({
        timestamp: new Date().toISOString(),
        blockHeight: 849202,
        cryoTemperature: 14.98 + (Math.random() * 0.1 - 0.05),
        coherenceScore: 0.9989,
        qopsThroughput: 851.9 + (Math.random() * 10 - 5),
      });
    }, 1000);
  }

  public subscribe(callback: (frame: TelemetryFrame) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback);
    };
  }

  private notify(frame: TelemetryFrame): void {
    this.listeners.forEach((listener) => listener(frame));
  }

  public disconnect(): void {
    this.ws?.close();
    this.ws = null;
    if (this.mockInterval !== null) {
      window.clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
  }
}
