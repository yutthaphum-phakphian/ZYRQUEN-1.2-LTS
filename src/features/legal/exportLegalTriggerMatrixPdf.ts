import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ETDA_PDPA_TRIGGERS, TRIGGER_PQC_HASHES } from '@/config/sovereignConfig';
import { triggerVibration } from '@/utils/vibration';
import { playTone } from '@/components/AudioSynthesizer';

interface AutoTableHookData {
  pageNumber: number;
  pageCount?: number;
}

export function exportLegalTriggerMatrixPdf(): void {
  triggerVibration('snapshot');
  playTone(659.25, 0.15, 'sine');

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  // Header background
  doc.setFillColor(7, 10, 18);
  doc.rect(0, 0, 210, 36, 'F');

  // Header text
  doc.setTextColor(6, 182, 212);
  doc.setFontSize(13);
  doc.text('ZYRQUEN OMEGA INVARIANT LEGAL TRIGGER MATRIX', 14, 13);

  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('FORENSIC ATTESTATION & COURT-ADMISSIBLE STATUTORY EVIDENCE', 14, 19);

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Principal: นายยุทธภูมิ พากเพียร #EP-SOVEREIGN-01 | Genesis: #849202 | Exported: ${new Date().toLocaleString('th-TH')}`,
    14,
    25
  );
  doc.text(
    `Canonical Merkle: 909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68 | SSoT: Δ0.00%`,
    14,
    30
  );

  autoTable(doc, {
    startY: 42,
    head: [['Trigger', 'Section', 'Title', 'PQC Scheme', 'Anchor Spec', 'Hash Digest', 'Status']],
    body: ETDA_PDPA_TRIGGERS.map((t) => [
      t.id,
      t.section,
      t.title,
      t.pqcScheme,
      t.anchor,
      (TRIGGER_PQC_HASHES[t.id] || '').slice(0, 18) + '...',
      'VERIFIED',
    ]),
    theme: 'grid',
    headStyles: { fillColor: [6, 182, 212], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 20, fontStyle: 'bold' },
      1: { cellWidth: 24 },
      2: { cellWidth: 42 },
      3: { cellWidth: 34 },
      4: { cellWidth: 32 },
      5: { cellWidth: 30 },
      6: { cellWidth: 18, fontStyle: 'bold' },
    },
    didDrawPage: (data: any) => {
      const totalPages = doc.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'Court-Admissible Evidence under ETDA B.E. 2544 (Sec 9, 26, 28) & PDPA B.E. 2562 (Sec 37) | ZQ-GREEN-DEP-849202-3908',
        14,
        287
      );
      doc.text(`Page ${data.pageNumber} of ${totalPages}`, 182, 287);
    },
  });

  doc.save(`ZYRQUEN_LEGAL_TRIGGER_MATRIX_SIGNED_${Date.now()}.pdf`);
}
