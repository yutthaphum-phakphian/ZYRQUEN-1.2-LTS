import 'jspdf';
import type { UserOptions } from 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: { finalY: number };
    autoTable?: (options: UserOptions | Record<string, unknown>) => jsPDF;
  }
}
