import type { jsPDF } from 'jspdf';
import '../types/jspdf-autotable.d.ts';

export const getAutoTableFinalY = (
  source: jsPDF | { finalY?: number },
  fallbackY = 20
): number => {
  const direct = (source as { finalY?: unknown }).finalY;
  if (typeof direct === 'number' && Number.isFinite(direct)) return direct;
  const y = (source as jsPDF & { lastAutoTable?: { finalY?: unknown } }).lastAutoTable?.finalY;
  return typeof y === 'number' && Number.isFinite(y) ? y : fallbackY;
};

export const getLastAutoTableFinalY = (doc: jsPDF, fallback = 20): number =>
  getAutoTableFinalY(doc, fallback);
