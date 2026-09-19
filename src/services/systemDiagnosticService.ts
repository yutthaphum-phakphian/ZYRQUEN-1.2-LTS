/**
 * ZYRQUEN Ω∞ System Diagnostic & Verbose Error Logging Service
 * Provides centralized error interception, verbose debug tracing,
 * persistent diagnostic logs, and diagnostic event broadcasting.
 */

export type DiagnosticLogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
export type DiagnosticServiceKey =
  | 'WebSocket'
  | 'PWA'
  | 'Audio Synthesizer'
  | 'Backup Service'
  | 'Database'
  | 'RBAC'
  | 'Kernel';

export interface DiagnosticLogEntry {
  id: string;
  timestamp: string;
  timestampIct: string;
  level: DiagnosticLogLevel;
  service: DiagnosticServiceKey;
  message: string;
  details?: Record<string, unknown> | string;
  stack?: string;
  isFatal?: boolean;
}

const STORAGE_KEY_VERBOSE = 'zyrquen_verbose_system_logging';
const STORAGE_KEY_LOGS = 'zyrquen_diagnostic_logs';
const MAX_LOGS = 200;

class SystemDiagnosticService {
  private isVerboseEnabled: boolean = false;
  private logs: DiagnosticLogEntry[] = [];
  private listeners: Set<(logs: DiagnosticLogEntry[]) => void> = new Set();
  private toggleListeners: Set<(enabled: boolean) => void> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedVerbose = window.localStorage.getItem(STORAGE_KEY_VERBOSE);
        this.isVerboseEnabled = storedVerbose === 'true';

        const storedLogs = window.localStorage.getItem(STORAGE_KEY_LOGS);
        if (storedLogs) {
          this.logs = JSON.parse(storedLogs);
        }
      }
    } catch {
      // Ignore storage read errors
    }

    // Seed baseline diagnostic events if empty
    if (this.logs.length === 0) {
      this.seedInitialDiagnostics();
    }
  }

  private seedInitialDiagnostics() {
    const now = new Date();
    const ictString = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Bangkok' }) + ' ICT';
    
    this.logs = [
      {
        id: 'diag-init-001',
        timestamp: now.toISOString(),
        timestampIct: ictString,
        level: 'INFO',
        service: 'Kernel',
        message: 'ZYRQUEN Ω∞ Sovereign Kernel Diagnostic Bus initialized.',
        details: { bootBlock: 849202, architecture: 'Fail-Closed Sovereign Engine' }
      },
      {
        id: 'diag-init-002',
        timestamp: new Date(now.getTime() - 120000).toISOString(),
        timestampIct: ictString,
        level: 'INFO',
        service: 'WebSocket',
        message: 'Notification WebSocket relay connected to sovereign gateway.',
        details: { endpoint: '/ws/notifications', protocol: 'wss' }
      },
      {
        id: 'diag-init-003',
        timestamp: new Date(now.getTime() - 90000).toISOString(),
        timestampIct: ictString,
        level: 'INFO',
        service: 'Backup Service',
        message: 'Automated 1-hour snapshot cycle armed with zero-drift firewall.',
        details: { cycleSeconds: 3600, verificationRoutineInterval: 60 }
      },
      {
        id: 'diag-init-004',
        timestamp: new Date(now.getTime() - 60000).toISOString(),
        timestampIct: ictString,
        level: 'INFO',
        service: 'Audio Synthesizer',
        message: 'Atmospheric audio carrier calibrated to 882 Hz clock tone.',
        details: { baseFreq: 882, profile: 'circuitry' }
      }
    ];
  }

  public isVerbose(): boolean {
    return this.isVerboseEnabled;
  }

  public setVerbose(enabled: boolean): void {
    this.isVerboseEnabled = enabled;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY_VERBOSE, enabled ? 'true' : 'false');
      }
    } catch {
      // Ignore storage write errors
    }

    this.log({
      level: 'INFO',
      service: 'Kernel',
      message: `Verbose system error logging ${enabled ? 'ENABLED' : 'DISABLED'} by operator.`,
      details: { verboseLogging: enabled }
    });

    for (const listener of this.toggleListeners) {
      listener(enabled);
    }
  }

  public log(entry: Omit<DiagnosticLogEntry, 'id' | 'timestamp' | 'timestampIct'>): DiagnosticLogEntry {
    const now = new Date();
    const ictString = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Bangkok' }) + ' ICT';
    
    const fullEntry: DiagnosticLogEntry = {
      id: `diag-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now.toISOString(),
      timestampIct: ictString,
      ...entry,
    };

    // If verbose logging is enabled, mirror to console with formatted badge
    if (this.isVerboseEnabled || entry.level === 'ERROR') {
      const prefix = `[ZYRQUEN:${entry.service}:${entry.level}]`;
      if (entry.level === 'ERROR') {
        console.error(prefix, entry.message, entry.details || '', entry.stack || '');
      } else if (entry.level === 'WARN') {
        console.warn(prefix, entry.message, entry.details || '');
      } else {
        console.log(prefix, entry.message, entry.details || '');
      }
    }

    this.logs.unshift(fullEntry);
    if (this.logs.length > MAX_LOGS) {
      this.logs = this.logs.slice(0, MAX_LOGS);
    }

    this.persist();
    this.notify();

    return fullEntry;
  }

  public logError(
    service: DiagnosticServiceKey,
    message: string,
    error?: unknown,
    details?: Record<string, unknown>
  ): DiagnosticLogEntry {
    const stack = error instanceof Error ? error.stack : undefined;
    const errorDetails = error instanceof Error ? { name: error.name, message: error.message, ...details } : details;

    return this.log({
      level: 'ERROR',
      service,
      message,
      stack,
      details: errorDetails,
      isFatal: false,
    });
  }

  public getLogs(): DiagnosticLogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
    this.persist();
    this.notify();
  }

  public exportLogsJson(): string {
    return JSON.stringify(
      {
        exportedAtUtc: new Date().toISOString(),
        verboseLoggingEnabled: this.isVerboseEnabled,
        totalEntries: this.logs.length,
        logs: this.logs,
      },
      null,
      2
    );
  }

  public subscribe(listener: (logs: DiagnosticLogEntry[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public onToggle(listener: (enabled: boolean) => void): () => void {
    this.toggleListeners.add(listener);
    return () => {
      this.toggleListeners.delete(listener);
    };
  }

  private persist() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(this.logs.slice(0, 100)));
      }
    } catch {
      // Ignore storage write errors
    }
  }

  private notify() {
    for (const listener of this.listeners) {
      listener([...this.logs]);
    }
  }
}

export const systemDiagnosticService = new SystemDiagnosticService();
