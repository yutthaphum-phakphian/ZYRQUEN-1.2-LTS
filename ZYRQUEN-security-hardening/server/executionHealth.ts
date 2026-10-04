import { verifyWebhookLedgerFile, type WebhookLedgerIntegrity } from './webhookDeliveryLedgerIntegrity.ts';
import type { ExecutionReceiptIntegrity } from './executionReceiptLedger.ts';

export type ExecutionHealthStatus = 'HEALTHY' | 'DEGRADED' | 'BLOCKED';
export interface ExecutionHealthSnapshot { status: ExecutionHealthStatus; receipts: ExecutionReceiptIntegrity; webhookLedger: WebhookLedgerIntegrity; generatedAt: string; reasons: string[]; }

export function buildExecutionHealthSnapshot(receipts: ExecutionReceiptIntegrity, webhookLedger: WebhookLedgerIntegrity, now = new Date().toISOString()): ExecutionHealthSnapshot {
  const reasons: string[] = [];
  if (!receipts.valid) reasons.push('EXECUTION_RECEIPT_LEDGER_INVALID');
  if (!webhookLedger.valid) reasons.push('WEBHOOK_DELIVERY_LEDGER_INVALID');
  const status: ExecutionHealthStatus = reasons.length === 0 ? 'HEALTHY' : 'BLOCKED';
  return { status, receipts, webhookLedger, generatedAt: now, reasons };
}

export function readExecutionHealthSnapshot(receipts: ExecutionReceiptIntegrity, webhookLedgerPath: string): ExecutionHealthSnapshot {
  return buildExecutionHealthSnapshot(receipts, verifyWebhookLedgerFile(webhookLedgerPath));
}
