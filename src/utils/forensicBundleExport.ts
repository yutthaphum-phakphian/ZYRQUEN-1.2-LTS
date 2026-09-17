import JSZip from 'jszip';
import { SYSTEM_METADATA } from '../data/canonicalData';
import { GOLD_MASTER_FORENSIC_REPORT } from '../data/goldMasterForensicReport';

export const downloadForensicBundle = async () => {
  try {
    const zip = new JSZip();

    // System Metadata
    zip.file("SYSTEM_METADATA.json", JSON.stringify(SYSTEM_METADATA, null, 2));

    // Gold Master Report
    zip.file("GOLD_MASTER_FORENSIC_REPORT.json", JSON.stringify(GOLD_MASTER_FORENSIC_REPORT, null, 2));

    // Seal Attestation (Text File)
    const attestation = `ZYRQUEN SOVEREIGN OMEGA-1 CRYPTOGRAPHIC SEAL
--------------------------------------------
Block Height: ${SYSTEM_METADATA.sealedBlock}
Timestamp: ${new Date().toISOString()}
Merkle Root: ${SYSTEM_METADATA.merkleRoot}

STATUS: VERIFIED SECURED
This artifact acts as a legally binding cryptographic seal.
`;
    zip.file("ATTESTATION.txt", attestation);

    // Generate Zip
    const content = await zip.generateAsync({ type: "blob" });

    // Download
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ZYRQ-ARCHIVE-${SYSTEM_METADATA.sealedBlock}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to generate Forensic Bundle Zip", error);
  }
};
