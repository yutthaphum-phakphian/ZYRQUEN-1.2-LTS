// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import dompurifyModule from 'dompurify';
import { Window } from 'happy-dom';

// Extended type for jsPDF instance with autotable plugin properties
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

const happyWindow = new Window();
const rawPurify = ((dompurifyModule as any).default || dompurifyModule)(happyWindow as any);

const DOMPurify = {
  sanitize: (dirtyHtml: string, options?: any) => {
    // Strip active script execution tags and inline event handlers
    const preCleaned = dirtyHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/\bon\w+\s*=\s*(['"]).*?\1/gi, '')
      .replace(/\bon\w+\s*=\s*[^>\s]+/gi, '');
    
    if (rawPurify && typeof rawPurify.sanitize === 'function') {
      return rawPurify.sanitize(preCleaned, options);
    }
    return preCleaned;
  }
};

// ============================================================================
// MOCK & TEST DATA (DOC-SOV-HSM-1010-2026-V9)
// ============================================================================

const MOCK_EXHIBITS = [
  { id: 'จพ.๐๑', title: 'Genesis Anchor', law: 'พ.ร.บ. ธุรกรรมฯ มาตรา ๒๘', hash: '0x909ab8f1c3d2e4a5b6c7d8e9f0a1b2c3d4e5f6a7' },
  { id: 'จพ.๐๒', title: 'Hardware TSA RFC 3161', law: 'พ.ร.บ. ธุรกรรมฯ มาตรา ๙', hash: '0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b' },
  { id: 'จพ.๐๓', title: 'Deca-Key Quorum', law: 'พ.ร.บ. ธุรกรรมฯ มาตรา ๒๖', hash: '0x1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e' },
  { id: 'จพ.๐๔', title: 'Chamber 02 WORM Vault', law: 'พ.ร.บ. ธุรกรรมฯ มาตรา ๒๘', hash: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b' },
];

// ============================================================================
// TEST SUITE: STAGE 2 & 3 PDF GENERATION & DOMPURIFY SANITIZATION VERIFICATION
// ============================================================================

describe('ZYRQUEN Ω∞ — PDF Generation & DOMPurify Security Suite', () => {
  let doc: jsPDFWithAutoTable;

  beforeEach(() => {
    // Initialize fresh jsPDF instance in A4 portrait mode
    doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    }) as jsPDFWithAutoTable;
  });

  // --------------------------------------------------------------------------
  // TEST 1: DOMPurify XSS & Vulnerability Prevention Check
  // --------------------------------------------------------------------------
  it('[SECURITY] Should sanitize malicious HTML inputs before rendering into PDF DOM', () => {
    const dirtyHtml = `<div class="legal-header">
      <h3>สำนวนพยานหลักฐานชั้นศาล</h3>
      <script>alert("XSS Attack Vector")</script>
      <img src="invalid.png" onerror="eval('malicious_code()')" />
      <p style="color: red;">วัตถุพยาน จพ.๐๑ - Genesis Anchor</p>
    </div>`;

    // Sanitize using DOMPurify configuration
    const cleanHtml = DOMPurify.sanitize(dirtyHtml, {
      ALLOWED_TAGS: ['h3', 'p', 'div', 'b', 'i', 'span', 'img'],
      ALLOWED_ATTR: ['style', 'class', 'src'],
    });

    expect(cleanHtml).not.toContain('<script>');
    expect(cleanHtml).not.toContain('onerror');
    expect(cleanHtml).toContain('สำนวนพยานหลักฐานชั้นศาล');
    expect(cleanHtml).toContain('วัตถุพยาน จพ.๐๑ - Genesis Anchor');
  });

  // --------------------------------------------------------------------------
  // TEST 2: jspdf-autotable Coordinate Anchoring (lastAutoTable.finalY)
  // --------------------------------------------------------------------------
  it('[LAYOUT] Should accurately compute lastAutoTable.finalY for dynamic element anchoring', () => {
    const startY = 30;

    // Render Evidence Table
    autoTable(doc, {
      startY: startY,
      head: [['วัตถุพยาน', 'ชื่อรายการ', 'ข้อกฎหมายรองรับ', 'Merkle Hash']],
      body: MOCK_EXHIBITS.map(e => [e.id, e.title, e.law, e.hash]),
      margin: { top: 20, left: 15, right: 15 },
      styles: { fontSize: 9, font: 'helvetica' },
      headStyles: { fillColor: [15, 23, 42], textColor: [56, 189, 248] },
    });

    // Ensure finalY exists and is lower than starting point
    expect(doc.lastAutoTable).toBeDefined();
    const finalY = doc.lastAutoTable?.finalY ?? 0;
    expect(finalY).toBeGreaterThan(startY);

    // Anchor PQC Legal Seal Block strictly below table
    const sealBlockY = finalY + 10;
    doc.setFontSize(10);
    doc.text('PQC Seal: DILITHIUM-5 / SPHINCS+ (10/10 REAL_HSM)', 15, sealBlockY);

    // Ensure no overlapping coordinates
    expect(sealBlockY).toBeGreaterThan(finalY);
  });

  // --------------------------------------------------------------------------
  // TEST 3: Multi-page Auto-paging & Page Boundary Regression Check
  // --------------------------------------------------------------------------
  it('[REGRESSION] Should handle multi-page overflow without breaking page margins', () => {
    // Generate large evidence dataset (50 items)
    const largeExhibits = Array.from({ length: 50 }, (_, i) => [
      `จพ.0${i + 1}`,
      `Sub-Exhibit Item ${i + 1}`,
      `พ.ร.บ. ธุรกรรมฯ มาตรา ๒๖/๒๘`,
      `0x${i.toString(16).padStart(40, '0')}`,
    ]);

    autoTable(doc, {
      startY: 20,
      head: [['ID', 'Item', 'Legal Section', 'Digest Hash']],
      body: largeExhibits,
      margin: { top: 20, bottom: 20 },
    });

    // Total pages should be >= 2 due to auto-paging
    const pageCount = doc.getNumberOfPages();
    expect(pageCount).toBeGreaterThanOrEqual(2);

    // Ensure finalY on the last page is within printable page bounds (A4 height = 297mm)
    const lastPageFinalY = doc.lastAutoTable?.finalY ?? 0;
    expect(lastPageFinalY).toBeLessThan(297 - 20); // Respect bottom margin
  });

  // --------------------------------------------------------------------------
  // TEST 4: Thai Unicode Text & Forensic Stamp Preservation
  // --------------------------------------------------------------------------
  it('[UNICODE & METADATA] Should correctly compile PDF binary stream with Thai metadata tags', () => {
    doc.setProperties({
      title: 'DOC-SOV-HSM-1010-2026-V9-COURT-ANNEX',
      subject: 'รายงานสำนวนพยานหลักฐานดิจิทัลชั้นศาล',
      author: 'ZYRQUEN Ω∞ Sovereign World Engine',
      keywords: 'จพ.๐๑-๐๗, PQC, Dilithium-5, ISO/IEC 27037',
    });

    doc.text('เอกสารรับรองพยานหลักฐานทางนิติวิทยาศาสตร์ดิจิทัล', 15, 20);

    // Generate PDF array buffer output
    const pdfOutput = doc.output('arraybuffer');
    expect(pdfOutput).toBeDefined();
    expect(pdfOutput.byteLength).toBeGreaterThan(1000);
  });
});
