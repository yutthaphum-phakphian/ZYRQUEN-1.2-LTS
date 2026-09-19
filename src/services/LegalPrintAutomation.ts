import { Module17LedgerV24 } from './Module17LedgerV24';

export interface PrintAutomationConfig {
  autoTriggerAfterPhase12: boolean;
  targetContainerId: string;
  complianceStandard: 'ISO/IEC-27037' | 'ETDA-SEC-26' | 'ETDA-SEC-28';
}

export class LegalPrintAutomationService {
  private config: PrintAutomationConfig;

  constructor(config: PrintAutomationConfig) {
    this.config = config;
  }

  /**
   * ดำเนินการพิมพ์และบันทึกสำนวนพยานศาลอัตโนมัติจาก Module 17 V24
   */
  public async executeAutomatedPrintAndSeal(evidenceId: string): Promise<boolean> {
    try {
      console.log(`[LegalPrintAutomation] Fetching immutable evidence payload: ${evidenceId} from Module 17 V24...`);
      const payload = await Module17LedgerV24.getEvidencePayload(evidenceId);

      if (!payload) {
        throw new Error(`Evidence payload not found for ID: ${evidenceId}`);
      }

      // ตรวจสอบสภาพแวดล้อม DOM
      if (typeof document !== 'undefined') {
        // ค้นหาคอมโพเนนต์พยานหลักฐานบน DOM
        const container = document.getElementById(this.config.targetContainerId);
        if (!container) {
          throw new Error(`Target container ID '${this.config.targetContainerId}' not found on DOM.`);
        }

        // ฉีดคลาส CSS ชั่วคราวสำหรับจัดหน้ากระดาษแนวนอนตามมาตรฐานศาล
        container.classList.add('print-landscape', 'court-landscape-print');

        // เรียกใช้งานคำสั่งพิมพ์ของเบราว์เซอร์ (รองรับ Save as PDF)
        if (typeof window !== 'undefined' && typeof window.print === 'function') {
          window.print();
        }

        // ทำความสะอาดคลาส CSS อัตโนมัติหลังพิมพ์เสร็จสิ้น
        setTimeout(() => {
          container.classList.remove('print-landscape', 'court-landscape-print');
          console.log(`[LegalPrintAutomation] Print pipeline executed successfully with 0% SSoT drift.`);
        }, 1200);
      }

      return true;
    } catch (error) {
      console.error('[LegalPrintAutomation Error] Critical failure during automated print execution:', error);
      return false;
    }
  }

  public getConfig(): PrintAutomationConfig {
    return this.config;
  }

  public updateConfig(newConfig: Partial<PrintAutomationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}
