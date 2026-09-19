/**
 * ZYRQUEN Ω∞ System Logging Utility
 * Checks global `systemStateStore.isVerboseLoggingEnabled` state.
 * When enabled, outputs detailed system errors and diagnostic traces
 * to the browser console and records them into the diagnostic panel.
 */

import { systemStateStore } from '../store/systemStateStore';
import {
  systemDiagnosticService,
  DiagnosticServiceKey,
  DiagnosticLogEntry
} from '../services/systemDiagnosticService';

export interface SystemErrorContext {
  service?: DiagnosticServiceKey | string;
  component?: string;
  errorCode?: string;
  timestamp?: string;
  stack?: string;
  details?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Checks if verbose logging is currently enabled on the global systemStateStore.
 */
export function isVerboseLogging(): boolean {
  return systemStateStore.isVerboseLoggingEnabled;
}

/**
 * Primary error logging utility.
 * Always records error to diagnostic panel; when isVerboseLoggingEnabled is true,
 * prints high-visibility, formatted deep diagnostics and stack traces to the console.
 */
export function logSystemError(
  service: DiagnosticServiceKey | string,
  message: string,
  error?: unknown,
  context?: Record<string, unknown>
): DiagnosticLogEntry {
  const isVerbose = systemStateStore.isVerboseLoggingEnabled;
  const stack = error instanceof Error ? error.stack : undefined;
  const errorObj = error instanceof Error ? { name: error.name, message: error.message } : error;

  const mergedContext: Record<string, unknown> = {
    ...context,
    rawError: errorObj,
    loggedAtUtc: new Date().toISOString(),
    isVerboseActive: isVerbose,
  };

  // Output to console if verbose logging is enabled or for fatal/critical errors
  if (isVerbose) {
    console.group(`🚨 [ZYRQUEN VERBOSE SYSTEM ERROR] [${service}] ${message}`);
    console.error('Error Details:', errorObj);
    if (stack) {
      console.error('Stack Trace:', stack);
    }
    if (context && Object.keys(context).length > 0) {
      console.dir(context);
    }
    console.groupEnd();
  } else {
    // Concise standard console output
    console.error(`[ZYRQUEN:ERROR:${service}] ${message}`, errorObj);
  }

  // Record to the diagnostic panel for debugging purposes
  return systemDiagnosticService.logError(
    service as DiagnosticServiceKey,
    message,
    error,
    mergedContext
  );
}

/**
 * Warn logging utility honoring verbose state.
 */
export function logSystemWarning(
  service: DiagnosticServiceKey | string,
  message: string,
  context?: Record<string, unknown>
): DiagnosticLogEntry {
  const isVerbose = systemStateStore.isVerboseLoggingEnabled;
  if (isVerbose) {
    console.warn(`⚠️ [ZYRQUEN VERBOSE SYSTEM WARN] [${service}] ${message}`, context || '');
  }

  return systemDiagnosticService.log({
    level: 'WARN',
    service: service as DiagnosticServiceKey,
    message,
    details: context,
  });
}

/**
 * Info logging utility honoring verbose state.
 */
export function logSystemInfo(
  service: DiagnosticServiceKey | string,
  message: string,
  context?: Record<string, unknown>
): DiagnosticLogEntry {
  const isVerbose = systemStateStore.isVerboseLoggingEnabled;
  if (isVerbose) {
    console.info(`ℹ️ [ZYRQUEN VERBOSE SYSTEM INFO] [${service}] ${message}`, context || '');
  }

  return systemDiagnosticService.log({
    level: 'INFO',
    service: service as DiagnosticServiceKey,
    message,
    details: context,
  });
}

/**
 * Global system logger object interface
 */
export const systemLogger = {
  error: logSystemError,
  warn: logSystemWarning,
  info: logSystemInfo,
  isVerbose: isVerboseLogging,
  setVerbose(enabled: boolean) {
    systemStateStore.setVerboseLoggingEnabled(enabled);
    systemDiagnosticService.setVerbose(enabled);
  },
  toggleVerbose(): boolean {
    const next = systemStateStore.toggleVerboseLoggingEnabled();
    systemDiagnosticService.setVerbose(next);
    return next;
  },
  getDiagnosticLogs() {
    return systemDiagnosticService.getLogs();
  },
  clearDiagnosticLogs() {
    systemDiagnosticService.clearLogs();
  }
};
