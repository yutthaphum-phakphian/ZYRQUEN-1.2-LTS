import { FORENSIC_DOSSIER_V9, ForensicDossierMaster, ForensicAuditStep } from '../data/forensicAuditMasterDossierData';
import { escapeCsvField, downloadFile } from './exportCsv';

/**
 * Generates RFC 4180 compliant CSV string for the Master Forensic Audit Trail (16 steps + metadata)
 */
export function generateForensicAuditTrailCsv(dossier: ForensicDossierMaster = FORENSIC_DOSSIER_V9): string {
  const headers = [
    'Step',
    'Audit Stage Title',
    'Statutory Standard',
    'Cryptographic Scheme',
    'Execution Time (ms)',
    'Result',
    'Merkle Hash',
    'Hardware Enclave',
    'Legal Standard',
    'Description',
    'Document ID',
    'Genesis Block',
    'Audit Timestamp',
    'Passport ID',
    'Principal Authority',
  ];

  const headerLine = headers.map((h) => escapeCsvField(h)).join(',');

  const rowLines = dossier.steps.map((s: ForensicAuditStep) => {
    return [
      escapeCsvField(s.step),
      escapeCsvField(s.title),
      escapeCsvField(s.statutoryStandard),
      escapeCsvField(s.cryptographicScheme),
      escapeCsvField(s.executionTimeMs.toFixed(2)),
      escapeCsvField(s.result),
      escapeCsvField(s.merkleHash),
      escapeCsvField(s.enclaveHardware),
      escapeCsvField(s.legalStandard),
      escapeCsvField(s.description),
      escapeCsvField(dossier.documentId),
      escapeCsvField(dossier.genesisBlock),
      escapeCsvField(dossier.auditTimestamp),
      escapeCsvField(dossier.passportId),
      escapeCsvField(dossier.principalAuthority),
    ].join(',');
  });

  return [headerLine, ...rowLines].join('\r\n');
}

/**
 * Downloads the Master Forensic Audit Trail as a standard CSV file
 */
export function downloadForensicAuditTrailCsv(dossier: ForensicDossierMaster = FORENSIC_DOSSIER_V9): void {
  const csvContent = generateForensicAuditTrailCsv(dossier);
  const filename = `${dossier.documentId}_Audit_Trail_${Date.now()}.csv`;
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}
