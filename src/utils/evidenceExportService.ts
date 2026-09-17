import { TerminalJobLifecycleManager } from '../services/TerminalJobLifecycleManager';

/**
 * ZYRQUEN Ω∞ SOVEREIGN WORLD ENGINE - EVIDENCE EXPORT SERVICE
 * Canonical Utility for serializing telemetry, quantum state, and seal indices
 * into JSON Blobs and triggering browser-native downloads.
 * Strictly guarded against duplicate submissions or re-triggers of terminal states.
 */

export class EvidenceExportService {
  /**
   * Serializes a data object to a JSON Blob and triggers a browser-native file download.
   *
   * @param data - The JavaScript/TypeScript object to serialize into formatted JSON.
   * @param filename - The target download filename (e.g. 'zyrquen-evidence.json').
   * @returns boolean indicating success or failure.
   */
  public static downloadJsonBlob(data: Record<string, any> | unknown, filename: string): boolean {
    const idempotencyKey = `IDEMP-UTIL-JSON-${filename}`;
    const existingJob = TerminalJobLifecycleManager.getJobOrByKey(idempotencyKey);
    const currentStatus = existingJob?.state;

    // Strict guard pattern: prevent re-triggering of terminal states
    if (currentStatus === 'COMPLETED' || currentStatus === 'UPLOADED' || currentStatus === 'TERMINAL_BLOCKED' || currentStatus === 'TERMINAL_REJECTED') {
      console.warn(`[EvidenceExportService] Execution blocked: job ${idempotencyKey} is already in terminal state '${currentStatus}'.`);
      return true;
    }

    TerminalJobLifecycleManager.submitJob({
      jobType: 'AUDIT_SEAL_EXPORT',
      idempotencyKey,
      payload: { filename },
      actor: 'SOVEREIGN_UTIL_EXPORT_ACTOR',
    });

    try {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const anchor = document.createElement('a');
      anchor.style.display = 'none';
      anchor.href = url;
      anchor.download = filename.endsWith('.json') ? filename : `${filename}.json`;
      
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      
      // Clean up the object URL after triggering download
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      TerminalJobLifecycleManager.transitionState(idempotencyKey, 'COMPLETED', {
        filename,
        downloaded: true,
      });
      return true;
    } catch (error) {
      console.error('[EvidenceExportService] downloadJsonBlob failed:', error);
      TerminalJobLifecycleManager.transitionState(idempotencyKey, 'FAILED', {
        filename,
        error: String(error),
      });
      return false;
    }
  }

  /**
   * Formats telemetry / hardware snapshot records as a RFC-4180 compliant CSV Blob
   * and triggers a browser-native file download.
   */
  public static downloadCsvBlob(
    data: Array<Record<string, any>>,
    filename: string = 'zyrquen-telemetry-snapshots'
  ): boolean {
    const idempotencyKey = `IDEMP-UTIL-CSV-${filename}`;
    const existingJob = TerminalJobLifecycleManager.getJobOrByKey(idempotencyKey);
    const currentStatus = existingJob?.state;

    // Strict guard pattern: prevent re-triggering of terminal states
    if (currentStatus === 'COMPLETED' || currentStatus === 'UPLOADED' || currentStatus === 'TERMINAL_BLOCKED' || currentStatus === 'TERMINAL_REJECTED') {
      console.warn(`[EvidenceExportService] Execution blocked: job ${idempotencyKey} is already in terminal state '${currentStatus}'.`);
      return true;
    }

    TerminalJobLifecycleManager.submitJob({
      jobType: 'AUDIT_SEAL_EXPORT',
      idempotencyKey,
      payload: { filename, rowCount: Array.isArray(data) ? data.length : 0 },
      actor: 'SOVEREIGN_UTIL_EXPORT_ACTOR',
    });

    try {
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn('[EvidenceExportService] No data provided for CSV export.');
        TerminalJobLifecycleManager.transitionState(idempotencyKey, 'TERMINAL_BLOCKED', {
          reason: 'No data provided',
        });
        return false;
      }

      const priorityHeaders = [
        'snapshotNumber',
        'id',
        'timestampIct',
        'timestampUtc',
        'epoch',
        'status',
        'cpuAverage',
        'cpuCores',
        'memoryUsedMb',
        'memoryTotalMb',
        'cryoTempMk',
        'heliumFlowPct',
        'networkRxMbps',
        'networkTxMbps',
        'qopsThroughput',
        'coherencePct',
        'otelSpansSec',
        'ssdWearLevelPct',
        'voltageStabilityPct',
        'actor',
        'parentHash',
        'sealedHash'
      ];

      const allKeysSet = new Set<string>();
      priorityHeaders.forEach((k) => allKeysSet.add(k));
      data.forEach((row) => {
        Object.keys(row).forEach((k) => allKeysSet.add(k));
      });
      const headers = Array.from(allKeysSet);

      const csvRows: string[] = [];
      csvRows.push(headers.map((h) => `"${h}"`).join(','));

      for (const row of data) {
        const line = headers.map((header) => {
          const val = row[header];
          if (val === undefined || val === null) {
            return '""';
          }
          if (Array.isArray(val)) {
            return `"${val.join(';').replace(/"/g, '""')}"`;
          }
          if (typeof val === 'object') {
            return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
          }
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        });
        csvRows.push(line.join(','));
      }

      const csvContent = '\uFEFF' + csvRows.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.style.display = 'none';
      anchor.href = url;
      const cleanFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
      anchor.download = cleanFilename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return true;
    } catch (error) {
      console.error('[EvidenceExportService] downloadCsvBlob failed:', error);
      return false;
    }
  }

  /**
   * Alias for backward-compatible full manifest export.
   */
  public static exportToJsonFile(payload: Record<string, any>, filenamePrefix: string = 'zyrquen-evidence'): boolean {
    const cleanTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${filenamePrefix}-${cleanTimestamp}.json`;
    return this.downloadJsonBlob(payload, filename);
  }
}
