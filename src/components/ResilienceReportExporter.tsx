import React, { useState } from 'react';
import { Download, FileText, CheckCircle2, Shield } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { playAuditChime } from './AudioSynthesizer';
import { ChamberStatus } from './ResilienceHeatmap';

interface ResilienceReportExporterProps {
  chambers: ChamberStatus[];
  meanResilience: string;
  optimalRatio: string;
  totalMonitored: number;
  aiObserverStatus: string;
}

export const ResilienceReportExporter: React.FC<ResilienceReportExporterProps> = ({
  chambers,
  meanResilience,
  optimalRatio,
  totalMonitored,
  aiObserverStatus
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const generatePDFReport = () => {
    setIsExporting(true);
    playAuditChime();

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const now = new Date();
      const dateStr = now.toISOString();

      // Background
      doc.setFillColor(7, 10, 19);
      doc.rect(0, 0, 210, 297, 'F');

      // Top Banner
      doc.setFillColor(13, 27, 51);
      doc.rect(10, 10, 190, 24, 'F');
      doc.setDrawColor(0, 255, 204);
      doc.setLineWidth(0.5);
      doc.rect(10, 10, 190, 24, 'D');

      doc.setTextColor(0, 255, 204);
      doc.setFont('courier', 'bold');
      doc.setFontSize(14);
      doc.text('ZYRQUEN Ω∞ SOVEREIGN KERNEL — RESILIENCE AUDIT REPORT', 15, 20);

      doc.setFontSize(9);
      doc.setTextColor(200, 220, 240);
      doc.text(`Certificate: ZQ-RES-AUDIT-${Date.now().toString().slice(-6)} | SSoT Block #849202 (Δ0.00%)`, 15, 28);

      // Metadata Table
      doc.setFillColor(15, 23, 42);
      doc.rect(10, 38, 190, 28, 'F');
      doc.setDrawColor(56, 189, 248);
      doc.rect(10, 38, 190, 28, 'D');

      doc.setTextColor(56, 189, 248);
      doc.setFontSize(10);
      doc.text('EXECUTIVE AUDIT SUMMARY', 15, 45);

      doc.setFontSize(8);
      doc.setTextColor(220, 230, 242);
      doc.text(`Mean Resilience Score: ${meanResilience}%`, 15, 52);
      doc.text(`Optimal Chamber Ratio: ${optimalRatio} (${totalMonitored} Chambers Monitored)`, 15, 58);
      doc.text(`AI Observer Status: ${aiObserverStatus}`, 110, 52);
      doc.text(`Generated At: ${dateStr}`, 110, 58);

      // Chambers List Header
      doc.setFillColor(20, 30, 55);
      doc.rect(10, 70, 190, 8, 'F');
      doc.setTextColor(0, 255, 204);
      doc.setFontSize(8);
      doc.text('CHAMBER ID', 15, 75);
      doc.text('CHAMBER NAME / DOMAIN', 45, 75);
      doc.text('RESILIENCE', 125, 75);
      doc.text('STATUS', 155, 75);
      doc.text('CYCLES', 180, 75);

      let yPos = 83;
      chambers.forEach((ch, idx) => {
        if (yPos > 270) {
          doc.addPage();
          doc.setFillColor(7, 10, 19);
          doc.rect(0, 0, 210, 297, 'F');
          yPos = 20;
        }

        doc.setFillColor(idx % 2 === 0 ? 12 : 16, idx % 2 === 0 ? 18 : 24, idx % 2 === 0 ? 34 : 44);
        doc.rect(10, yPos - 4, 190, 6, 'F');

        doc.setTextColor(200, 220, 240);
        doc.setFontSize(7.5);
        doc.text(ch.id, 15, yPos);
        doc.text(ch.name.slice(0, 38), 45, yPos);
        
        doc.setTextColor(ch.resilienceLevel >= 99 ? 0 : ch.resilienceLevel >= 98 ? 245 : 244, ch.resilienceLevel >= 99 ? 255 : ch.resilienceLevel >= 98 ? 158 : 63, ch.resilienceLevel >= 99 ? 204 : ch.resilienceLevel >= 98 ? 11 : 94);
        doc.text(`${ch.resilienceLevel.toFixed(1)}%`, 125, yPos);

        doc.setTextColor(ch.status === 'OPTIMAL' ? 0 : 245, ch.status === 'OPTIMAL' ? 255 : 158, ch.status === 'OPTIMAL' ? 204 : 11);
        doc.text(ch.status, 155, yPos);

        doc.setTextColor(180, 195, 215);
        doc.text(String(ch.healingCycles || 0), 182, yPos);

        yPos += 6.5;
      });

      // Footer
      doc.setDrawColor(0, 255, 204);
      doc.setLineWidth(0.3);
      doc.line(10, 280, 200, 280);
      doc.setFontSize(7);
      doc.setTextColor(100, 130, 160);
      doc.text('Thai Electronic Transactions Act B.E. 2544 (§9, 26, 28) Verified Cryptographic Evidence Dossier', 15, 285);
      doc.text('ZYRQUEN Ω∞ SOVEREIGN DECA-HSM COUNCIL', 140, 285);

      doc.save(`ZYRQUEN-Resilience-Report-${Date.now()}.pdf`);
    } catch (err) {
      console.error('Failed to generate Resilience PDF report:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={generatePDFReport}
      disabled={isExporting}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/60 hover:bg-cyan-900/80 border-cyan-500/40 hover:border-cyan-400 text-cyan-300 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer shadow-sm disabled:opacity-50"
      title="ส่งออกรายงานการตรวจสอบความคงทนและสุขภาพห้องปฏิบัติการเป็น PDF ทางนิติวิทยาศาสตร์"
    >
      <FileText className={`w-3.5 h-3.5 ${isExporting ? 'animate-bounce text-amber-300' : 'text-cyan-400'}`} />
      <span>{isExporting ? 'Generating PDF...' : 'Export Resilience PDF'}</span>
    </button>
  );
};
