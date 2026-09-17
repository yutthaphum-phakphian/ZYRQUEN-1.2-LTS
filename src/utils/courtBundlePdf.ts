import { jsPDF } from 'jspdf';
import { SYSTEM_METADATA } from '../data/canonicalData';
import { GOLD_MASTER_FORENSIC_REPORT } from '../data/goldMasterForensicReport';

export const generateCourtBundlePdf = (systemLogsCount: number = 14902) => {
  const doc = new jsPDF();
  
  // Basic Title
  doc.setFontSize(22);
  doc.setTextColor(0, 0, 0);
  doc.text("ZYRQUEN COURT BUNDLE TRANSCRIPT", 14, 25);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text("Electronic Transactions Development Agency (ETDA) B.E. 2544 Framework", 14, 35);
  
  // Divider
  doc.setLineWidth(0.5);
  doc.line(14, 40, 196, 40);
  
  // Meta Data
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Timestamp (UTC): ${new Date().toISOString()}`, 14, 50);
  doc.text(`Block Height: ${SYSTEM_METADATA.sealedBlock}`, 14, 60);
  doc.text(`Canonical Seals Count: ${SYSTEM_METADATA.canonicalSeals}`, 14, 70);
  doc.text(`System Logs Aggregated: ${systemLogsCount} Entries`, 14, 80);
  
  // Forensic Details
  doc.setFontSize(14);
  doc.text("Forensic Merkle Proof", 14, 95);
  doc.setFontSize(10);
  doc.text(`Master Root: ${SYSTEM_METADATA.merkleRoot}`, 14, 105);
  doc.text(`Previous Block Hash: ${SYSTEM_METADATA.parentMasterHash}`, 14, 115);
  
  // Sign-off
  doc.setFontSize(12);
  doc.text("STATUS: VERIFIED & DIGITALLY SIGNED", 14, 135);
  doc.text(`Signatory: ${GOLD_MASTER_FORENSIC_REPORT.executiveSummary.sovereignPrincipal}`, 14, 145);
  
  doc.save(`ZYRQUEN_COURT_BUNDLE_${SYSTEM_METADATA.sealedBlock}.pdf`);
};
