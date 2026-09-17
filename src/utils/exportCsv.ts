/**
 * RFC 4180 Compliant CSV Export Utility
 * Handles string escaping, comma/quote/newline containment, and blob downloading.
 */

export interface ExportableAuditEvent {
  id: string;
  timestamp: string;
  eventType: string;
  status: string;
  operator: string;
  driftPercentage: number;
  blockHash?: string;
  signature?: string;
  details?: string;
  acknowledged?: boolean;
}

export function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export function generateAuditCsv(events: ExportableAuditEvent[]): string {
  const headers = [
    'Event ID',
    'Timestamp (UTC)',
    'Event Type',
    'Status',
    'Operator',
    'Drift %',
    'Block Hash',
    'Signature',
    'Acknowledged',
    'Details'
  ];

  const headerLine = headers.map(escapeCsvField).join(',');
  const rowLines = events.map(evt => [
    escapeCsvField(evt.id),
    escapeCsvField(evt.timestamp),
    escapeCsvField(evt.eventType),
    escapeCsvField(evt.status),
    escapeCsvField(evt.operator),
    escapeCsvField(evt.driftPercentage.toFixed(2) + '%'),
    escapeCsvField(evt.blockHash || 'N/A'),
    escapeCsvField(evt.signature || 'N/A'),
    escapeCsvField(evt.acknowledged ? 'YES' : 'NO'),
    escapeCsvField(evt.details || '')
  ].join(','));

  return [headerLine, ...rowLines].join('\r\n');
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportAuditLogsAsCsv(events: ExportableAuditEvent[]): void {
  const csv = generateAuditCsv(events);
  const nowUtc = new Date().toISOString().replace(/[:.]/g, '-');
  downloadFile(csv, `zyrquen-audit-report-${nowUtc}.csv`, 'text/csv;charset=utf-8;');
}

export function exportAuditLogsAsJson(events: ExportableAuditEvent[]): void {
  const payload = {
    exportVersion: '2.0.0-SOVEREIGN',
    exportedAtUtc: new Date().toISOString(),
    totalRecords: events.length,
    events
  };
  const json = JSON.stringify(payload, null, 2);
  const nowUtc = new Date().toISOString().replace(/[:.]/g, '-');
  downloadFile(json, `zyrquen-audit-report-${nowUtc}.json`, 'application/json;charset=utf-8;');
}
