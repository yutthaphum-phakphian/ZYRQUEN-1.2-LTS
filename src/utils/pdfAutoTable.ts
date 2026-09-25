import type { jsPDF } from 'jspdf';
import { getAutoTableFinalY as helperGetAutoTableFinalY } from './pdfHelpers';

export function getAutoTableFinalY(doc: jsPDF, fallbackY = 80): number {
  return helperGetAutoTableFinalY(doc, fallbackY);
}

export { getLastAutoTableFinalY } from './pdfHelpers';
