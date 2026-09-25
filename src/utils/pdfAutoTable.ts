import type { jsPDF } from 'jspdf';

type PdfWithAutoTable = jsPDF & {
  lastAutoTable?: {
    finalY?: number;
  };
};

export function getAutoTableFinalY(doc: jsPDF, fallbackY = 80): number {
  const lastAutoTable = (doc as PdfWithAutoTable).lastAutoTable;
  return typeof lastAutoTable?.finalY === 'number' ? lastAutoTable.finalY : fallbackY;
}
