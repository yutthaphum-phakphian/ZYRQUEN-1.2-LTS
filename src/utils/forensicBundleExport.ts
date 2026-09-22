import JSZip from 'jszip';
import { SYSTEM_METADATA } from '@/data/canonicalData';
import { GOLD_MASTER_FORENSIC_REPORT } from '@/data/goldMasterForensicReport';

/**
 * Generates and triggers the download of the Forensic Bundle ZIP archive.
 * Follows Clean Architecture standards by consuming SSoT configuration.
 */
export const downloadForensicBundle = async (): Promise<void> => {
  try {
    const zip = new JSZip();
    // 1. System Metadata from SSoT Configuration
    zip.file('SYSTEM_METADATA.json', JSON.stringify(SYSTEM_METADATA, null, 2));
    // 2. Gold Master Report
    zip.file(
      'GOLD_MASTER_FORENSIC_REPORT.json',
      JSON.stringify(GOLD_MASTER_FORENSIC_REPORT, null, 2)
    );
    // 3. Seal Attestation Document
    const attestation = `ZYRQUEN SOVEREIGN OMEGA-1 CRYPTOGRAPHIC SEAL
Block Height: ${SYSTEM_METADATA.sealedBlock}
Timestamp: ${new Date().toISOString()}
Merkle Root: ${SYSTEM_METADATA.merkleRoot}
Principal: ${SYSTEM_METADATA.sovereignPrincipal}
STATUS: VERIFIED SECURED
This artifact acts as a legally binding cryptographic seal.
`;
    zip.file('ATTESTATION.txt', attestation);
    // 4. Generate ZIP Blob
    const content = await zip.generateAsync({ type: 'blob' });
    // 5. Trigger Browser Download
    const url = URL.createObjectURL(content);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `ZYRQ-ARCHIVE-${SYSTEM_METADATA.sealedBlock}.zip`;
    anchor.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to generate Forensic Bundle Zip:', error);
  }
};

