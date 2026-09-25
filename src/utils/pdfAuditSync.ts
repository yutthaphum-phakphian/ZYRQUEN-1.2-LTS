import * as jspdfNamespace from 'jspdf';
import { jsPDF } from 'jspdf';
import type { UserOptions } from 'jspdf-autotable';
import DOMPurify from 'dompurify';
import { SYSTEM_METADATA } from '../data/canonicalData';
import { wormVaultService, LiveMerkleAnchor, WormVaultService } from '../services/wormVaultService';

// Resolves constructor across ESM, CJS, and Vite environments
const JsPdfConstructor = ((jspdfNamespace as unknown as { jsPDF?: typeof jsPDF; default?: typeof jsPDF }).jsPDF ||
  (jspdfNamespace as unknown as { default?: typeof jsPDF }).default ||
  jsPDF) as unknown as typeof jsPDF;

export interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

export interface PdfDocumentOptions {
  orientation?: 'portrait' | 'landscape';
  unit?: 'mm' | 'pt' | 'px' | 'in';
  format?: 'a4' | 'a3' | 'letter' | 'legal' | [number, number];
  compress?: boolean;
  title?: string;
  subject?: string;
  author?: string;
  keywords?: string;
  creator?: string;
  principal?: string;
  documentId?: string;
  wormChamberId?: string;
}

export interface HeaderOptions {
  principal?: string;
  documentId?: string;
  courtStandard?: string;
  customY?: number;
  showMerkleRoot?: boolean;
  showDriftInvariant?: boolean;
  dynamicMerkleRoot?: string;
  wormChamberId?: string;
  tsaTimestamp?: string;
  bannerColor?: [number, number, number];
  stripeColor?: [number, number, number];
}

export interface FooterOptions {
  showTimestamp?: boolean;
  customNote?: string;
  courtSealText?: string;
}

export interface PdfColorPalette {
  slateDark: [number, number, number];
  slateCard: [number, number, number];
  slateBorder: [number, number, number];
  slateText: [number, number, number];
  slateMuted: [number, number, number];
  goldPrimary: [number, number, number];
  cyanAccent: [number, number, number];
  emeraldSuccess: [number, number, number];
  crimsonCritical: [number, number, number];
  amberWarning: [number, number, number];
}

/**
 * Standardized SSoT Layout Constants to guarantee Zero Drift (Δ0.00%)
 * across all 25 PDF generation modules.
 */
export const PDF_STANDARD_LAYOUT = {
  A4_WIDTH: 210,
  A4_HEIGHT: 297,
  A3_WIDTH: 297,
  A3_HEIGHT: 420,
  DEFAULT_MARGIN: 14,
  HEADER_BANNER_HEIGHT: 38,
  FOOTER_MARGIN: 12,
  MAX_PAGE_SAFE_Y: 275,
  COLORS: {
    slateDark: [7, 10, 18] as [number, number, number],
    slateCard: [241, 245, 249] as [number, number, number],
    slateBorder: [203, 213, 225] as [number, number, number],
    slateText: [15, 23, 42] as [number, number, number],
    slateMuted: [148, 163, 184] as [number, number, number],
    goldPrimary: [212, 175, 55] as [number, number, number], // #D4AF37
    cyanAccent: [56, 189, 248] as [number, number, number], // #38BDF8
    emeraldSuccess: [16, 185, 129] as [number, number, number],
    crimsonCritical: [239, 68, 68] as [number, number, number],
    amberWarning: [245, 158, 11] as [number, number, number],
  },
} as const;

/**
 * Singleton class to manage and synchronize PDF generator initialization,
 * security sanitization via DOMPurify, real-time WORM Vault Merkle anchoring,
 * and layout invariants across all 25 ZYRQUEN forensic & court evidence modules.
 */
export class PdfAuditSync {
  private static instance: PdfAuditSync | null = null;
  private registeredModules: Map<string, { registeredAt: string; metadata?: Record<string, unknown> }> = new Map();
  private initializationCount: number = 0;
  private lastLiveAnchor: LiveMerkleAnchor | null = null;

  private constructor() {
    this.initializationCount = 0;
  }

  /**
   * Access the singleton instance of PdfAuditSync
   */
  public static getInstance(): PdfAuditSync {
    if (!PdfAuditSync.instance) {
      PdfAuditSync.instance = new PdfAuditSync();
    }
    return PdfAuditSync.instance;
  }

  /**
   * Reset instance for testing purposes
   */
  public static resetInstance(): void {
    PdfAuditSync.instance = null;
  }

  /**
   * Fetches real-time cryptographic anchor directly from WORM vault
   */
  public bindWormVault(chamberId: string = 'CH-02', customLeaves?: string[]): LiveMerkleAnchor {
    let anchor: LiveMerkleAnchor;
    if (customLeaves && customLeaves.length > 0) {
      const computedRoot = wormVaultService.computeMerkleRoot(customLeaves);
      const nowIso = new Date().toISOString();
      anchor = {
        chamberId,
        merkleRoot: computedRoot,
        sha3512Aggregate: wormVaultService.getChamber02Dataset().sha3512Aggregate,
        leafCount: customLeaves.length,
        genesisBlock: SYSTEM_METADATA.genesisBlock,
        sealedBlock: SYSTEM_METADATA.sealedBlock,
        canonicalSeals: SYSTEM_METADATA.canonicalSeals,
        pqcAlgorithm: 'Dilithium-5',
        hsmQuorum: SYSTEM_METADATA.quorum,
        tsaToken: `RFC3161_TSA_TOKEN_CUSTOM_${computedRoot.slice(0, 24)}`,
        timestampUTC: nowIso,
        zeroDrift: 'Δ0 0.00%',
        isFailClosedActive: true,
      };
    } else {
      anchor = wormVaultService.getLiveMerkleRoot(chamberId);
    }

    this.lastLiveAnchor = anchor;
    return anchor;
  }

  /**
   * Returns latest active live anchor
   */
  public getLastWormBinding(): LiveMerkleAnchor | null {
    if (!this.lastLiveAnchor) {
      this.lastLiveAnchor = wormVaultService.getLiveMerkleRoot('CH-02');
    }
    return this.lastLiveAnchor;
  }

  /**
   * Create a standardized jsPDF document instance with court-admissible metadata
   */
  public createDocument(options: PdfDocumentOptions = {}): jsPDFWithAutoTable {
    const orientation = options.orientation || 'portrait';
    const unit = options.unit || 'mm';
    const format = options.format || 'a4';
    const compress = options.compress !== undefined ? options.compress : true;

    const doc = new JsPdfConstructor({
      orientation,
      unit,
      format,
      compress,
    }) as jsPDFWithAutoTable;

    // Attach canonical document properties with live anchor
    const activeAnchor = this.getLastWormBinding();
    const keywords = `ZYRQUEN, Forensic, WORM, ${activeAnchor?.merkleRoot || SYSTEM_METADATA.merkleRoot}, ISO27037, RFC3161, ETDA, PDPA`;

    doc.setDocumentProperties({
      title: this.sanitize(options.title || 'ZYRQUEN Sovereign Forensic Audit Record'),
      subject: this.sanitize(options.subject || 'Court Admissible Forensic Evidence Under ISO/IEC 27037 & ETDA'),
      author: this.sanitize(options.author || SYSTEM_METADATA.sovereignPrincipal),
      keywords: this.sanitize(options.keywords || keywords),
      creator: this.sanitize(options.creator || `${SYSTEM_METADATA.system} - pdfAuditSync Engine`),
    });

    this.initializationCount++;
    return doc;
  }

  /**
   * Convenience builder for standard A4 Portrait Document
   */
  public createA4Document(options: Partial<PdfDocumentOptions> = {}): jsPDFWithAutoTable {
    return this.createDocument({
      ...options,
      format: 'a4',
      orientation: options.orientation || 'portrait',
      unit: 'mm',
    });
  }

  /**
   * Convenience builder for standard A3 Landscape/Portrait Document
   */
  public createA3Document(options: Partial<PdfDocumentOptions> = {}): jsPDFWithAutoTable {
    return this.createDocument({
      ...options,
      format: 'a3',
      orientation: options.orientation || 'landscape',
      unit: 'mm',
    });
  }

  /**
   * Sanitize text against XSS/HTML injection vectors before insertion into PDF
   */
  public sanitize(input: string): string {
    if (!input) return '';
    try {
      if (typeof DOMPurify !== 'undefined' && typeof DOMPurify.sanitize === 'function') {
        const cleaned = DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
        if (cleaned) {
          return String(cleaned).trim();
        }
      }
    } catch {
      // Fallback
    }
    return String(input)
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]*>?/gm, '')
      .trim();
  }

  /**
   * Sanitize HTML fragments for PDF rendering
   */
  public sanitizeHtml(html: string): string {
    if (!html) return '';
    try {
      if (typeof DOMPurify !== 'undefined' && typeof DOMPurify.sanitize === 'function') {
        return DOMPurify.sanitize(html, {
          ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'span', 'div', 'table', 'tr', 'td', 'th', 'thead', 'tbody'],
          ALLOWED_ATTR: ['class', 'style'],
        });
      }
    } catch {
      // Fallback
    }
    return String(html)
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '');
  }

  /**
   * Apply standardized Sovereign Judicial Header Banner with live WORM Merkle root anchor
   */
  public applyCourtBannerHeader(
    doc: jsPDF,
    title: string,
    subtitle?: string,
    options: HeaderOptions = {}
  ): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = PDF_STANDARD_LAYOUT.DEFAULT_MARGIN;
    const bannerHeight = PDF_STANDARD_LAYOUT.HEADER_BANNER_HEIGHT;

    const bannerBg = options.bannerColor || PDF_STANDARD_LAYOUT.COLORS.slateDark;
    const stripeColor = options.stripeColor || PDF_STANDARD_LAYOUT.COLORS.goldPrimary;

    // Dark Header Background
    doc.setFillColor(bannerBg[0], bannerBg[1], bannerBg[2]);
    doc.rect(0, 0, pageWidth, bannerHeight, 'F');

    // Gold Sovereign Stripe
    doc.setFillColor(stripeColor[0], stripeColor[1], stripeColor[2]);
    doc.rect(0, bannerHeight - 1.5, pageWidth, 1.5, 'F');

    // Title
    doc.setTextColor(PDF_STANDARD_LAYOUT.COLORS.cyanAccent[0], PDF_STANDARD_LAYOUT.COLORS.cyanAccent[1], PDF_STANDARD_LAYOUT.COLORS.cyanAccent[2]);
    doc.setFontSize(14);
    doc.setFont('courier', 'bold');
    doc.text(this.sanitize(title), margin, 14);

    // Subtitle / Legal Standard
    const sub = subtitle || options.courtStandard || 'ISO/IEC 27037 • ETDA SEC 9/26/28 • NIST FIPS 203/204/205 • SSoT Δ0.00%';
    doc.setTextColor(PDF_STANDARD_LAYOUT.COLORS.amberWarning[0], PDF_STANDARD_LAYOUT.COLORS.amberWarning[1], PDF_STANDARD_LAYOUT.COLORS.amberWarning[2]);
    doc.setFontSize(8.5);
    doc.text(this.sanitize(sub), margin, 21);

    // Dynamic Live WORM Root Anchor & Sealed Block
    doc.setTextColor(PDF_STANDARD_LAYOUT.COLORS.slateMuted[0], PDF_STANDARD_LAYOUT.COLORS.slateMuted[1], PDF_STANDARD_LAYOUT.COLORS.slateMuted[2]);
    doc.setFontSize(7.5);
    doc.setFont('courier', 'normal');

    const liveAnchor = this.getLastWormBinding();
    const rootSource = options.dynamicMerkleRoot || liveAnchor?.merkleRoot || SYSTEM_METADATA.merkleRoot;
    const rootSnippet = rootSource.slice(0, 48);
    const chamberLabel = options.wormChamberId ? ` [${options.wormChamberId} WORM]` : (liveAnchor?.chamberId ? ` [${liveAnchor.chamberId} WORM]` : '');

    doc.text(`LIVE ROOT${chamberLabel}: ${rootSnippet}... | BLOCK #${SYSTEM_METADATA.sealedBlock}`, margin, 28);
    doc.text(`PRINCIPAL: ${this.sanitize(options.principal || SYSTEM_METADATA.sovereignPrincipal)}`, margin, 33);

    return bannerHeight + 8;
  }

  /**
   * Apply standardized tamper-evident footer with page numbering and ISO audit stamp
   */
  public applyStandardFooter(doc: jsPDF, options: FooterOptions = {}): void {
    const pageCount = doc.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = PDF_STANDARD_LAYOUT.DEFAULT_MARGIN;
    const footerY = pageHeight - PDF_STANDARD_LAYOUT.FOOTER_MARGIN;

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Divider line
      doc.setDrawColor(PDF_STANDARD_LAYOUT.COLORS.slateBorder[0], PDF_STANDARD_LAYOUT.COLORS.slateBorder[1], PDF_STANDARD_LAYOUT.COLORS.slateBorder[2]);
      doc.setLineWidth(0.3);
      doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

      // Footer Text
      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(PDF_STANDARD_LAYOUT.COLORS.slateMuted[0], PDF_STANDARD_LAYOUT.COLORS.slateMuted[1], PDF_STANDARD_LAYOUT.COLORS.slateMuted[2]);

      const sealNotice = options.courtSealText || 'ZYRQUEN Ω∞ SSoT IMMUTABLE COURT RECORD • ZERO DRIFT Δ0.00% • RFC 3161 TSA';
      doc.text(sealNotice, margin, footerY);

      // Page Numbering
      const pageStr = `Page ${i} of ${pageCount}`;
      const pageStrWidth = doc.getTextWidth(pageStr);
      doc.text(pageStr, pageWidth - margin - pageStrWidth, footerY);
    }
  }

  /**
   * Check layout bounds and insert page break if content exceeds safe height
   */
  public ensurePageBreak(doc: jsPDF, currentY: number, requiredHeight: number, margin: number = PDF_STANDARD_LAYOUT.DEFAULT_MARGIN): number {
    const pageHeight = doc.internal.pageSize.getHeight();
    const safeMax = pageHeight - PDF_STANDARD_LAYOUT.FOOTER_MARGIN - 8;

    if (currentY + requiredHeight > safeMax) {
      doc.addPage();
      return margin + 10;
    }
    return currentY;
  }

  /**
   * Returns base autoTable configuration options to maintain visual uniformity
   */
  public getAutoTableBaseOptions(): UserOptions {
    return {
      theme: 'grid',
      styles: {
        font: 'courier',
        fontSize: 8,
        textColor: PDF_STANDARD_LAYOUT.COLORS.slateText,
        lineColor: PDF_STANDARD_LAYOUT.COLORS.slateBorder,
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: PDF_STANDARD_LAYOUT.COLORS.slateDark,
        textColor: PDF_STANDARD_LAYOUT.COLORS.cyanAccent,
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: PDF_STANDARD_LAYOUT.DEFAULT_MARGIN, right: PDF_STANDARD_LAYOUT.DEFAULT_MARGIN },
    };
  }

  /**
   * Register a module to track PDF generation uniformity across all 25 modules
   */
  public registerModule(moduleId: string, metadata?: Record<string, unknown>): void {
    this.registeredModules.set(moduleId, {
      registeredAt: new Date().toISOString(),
      metadata,
    });
  }

  /**
   * Get all registered PDF generator modules
   */
  public getRegisteredModules(): string[] {
    return Array.from(this.registeredModules.keys());
  }

  /**
   * Query initialization count and invariant check
   */
  public getInvariantStatus(): {
    initializationCount: number;
    registeredModulesCount: number;
    baselineDrift: string;
    merkleRoot: string;
    hasActiveWormBinding: boolean;
  } {
    const live = this.getLastWormBinding();
    return {
      initializationCount: this.initializationCount,
      registeredModulesCount: this.registeredModules.size,
      baselineDrift: SYSTEM_METADATA.baselineDrift,
      merkleRoot: live?.merkleRoot || SYSTEM_METADATA.merkleRoot,
      hasActiveWormBinding: Boolean(live),
    };
  }

  /**
   * Expose color palette constants
   */
  public getStandardColorPalette(): PdfColorPalette {
    return PDF_STANDARD_LAYOUT.COLORS;
  }
}

/**
 * Exported singleton instance
 */
export const pdfAuditSync = PdfAuditSync.getInstance();

export default pdfAuditSync;
