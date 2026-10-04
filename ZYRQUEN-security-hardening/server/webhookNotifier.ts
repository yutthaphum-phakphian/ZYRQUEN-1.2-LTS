import crypto from 'node:crypto';
import type { PullRequestResult } from './gitPullRequestAutomation.ts';
import { defaultWebhookDeliveryLedger, type WebhookDeliveryLedger } from './webhookDeliveryLedger.ts';

export interface WebhookNotification { event: 'pull_request.automation'; deliveryId: string; timestamp: string; result: PullRequestResult; }
export interface WebhookConfig { url: string; secret: string; allowedHosts?: string[]; timeoutMs?: number; maxRetries?: number; baseRetryDelayMs?: number; deliveryId?: string; }
export interface WebhookAttempt { attempt: number; status?: number; error?: string; }
export interface WebhookDeliveryResult { ok: boolean; deliveryId: string; status: number; attempts: WebhookAttempt[]; auditHash: string; }

const privateHost = (hostname: string) => hostname === 'localhost' || hostname === '::1' || hostname === '0.0.0.0' || /^127\./.test(hostname) || /^10\./.test(hostname) || /^192\.168\./.test(hostname) || /^169\.254\./.test(hostname) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);
export function validateWebhookConfig(config: WebhookConfig): URL { const u = new URL(config.url); if (u.protocol !== 'https:') throw new Error('WEBHOOK_HTTPS_REQUIRED'); if (privateHost(u.hostname)) throw new Error('WEBHOOK_PRIVATE_HOST_BLOCKED'); if (config.allowedHosts?.length && !config.allowedHosts.includes(u.hostname)) throw new Error('WEBHOOK_HOST_NOT_ALLOWLISTED'); if (!config.secret) throw new Error('WEBHOOK_SECRET_REQUIRED'); return u; }
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class WebhookNotifier {
  private readonly ledger: WebhookDeliveryLedger;
  constructor(ledger: WebhookDeliveryLedger = defaultWebhookDeliveryLedger()) { this.ledger = ledger; }

  async notify(config: WebhookConfig, result: PullRequestResult): Promise<WebhookDeliveryResult> {
    const url = validateWebhookConfig(config);
    const deliveryId = config.deliveryId?.trim() || `delivery-${Date.now()}-${crypto.randomBytes(5).toString('hex')}`;
    if (!/^[A-Za-z0-9._:-]{8,160}$/.test(deliveryId)) throw new Error('WEBHOOK_DELIVERY_ID_INVALID');
    const timestamp = new Date().toISOString();
    const payload: WebhookNotification = { event: 'pull_request.automation', deliveryId, timestamp, result };
    const raw = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', config.secret).update(raw).digest('hex');
    const payloadHash = crypto.createHash('sha256').update(JSON.stringify({ event: payload.event, deliveryId: payload.deliveryId, result: payload.result })).digest('hex');
    const reservation = this.ledger.begin(deliveryId, payloadHash);
    if (reservation.state === 'CONFLICT') throw new Error('WEBHOOK_DELIVERY_LEDGER_CONFLICT');
    if (reservation.state === 'SENT') return reservation.result;
    if (reservation.state === 'IN_PROGRESS') throw new Error('WEBHOOK_DELIVERY_IN_PROGRESS');
    const timeoutMs = Math.max(100, Math.min(config.timeoutMs ?? 5000, 30000));
    const maxRetries = Math.max(0, Math.min(config.maxRetries ?? 2, 5));
    const baseDelay = Math.max(0, Math.min(config.baseRetryDelayMs ?? 250, 5000));
    const attempts: WebhookAttempt[] = [];
    let status = 599;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const response = await fetch(url, { method: 'POST', signal: controller.signal, headers: { 'content-type': 'application/json', 'x-codevoice-event': payload.event, 'x-codevoice-delivery': deliveryId, 'x-codevoice-timestamp': timestamp, 'x-codevoice-signature': `sha256=${signature}` }, body: raw });
          status = response.status;
          attempts.push({ attempt: attempt + 1, status });
          if (response.ok || (status >= 400 && status < 500)) break;
        } finally { clearTimeout(timer); }
      } catch (error) {
        attempts.push({ attempt: attempt + 1, error: error instanceof Error ? error.message : String(error) });
      }
      if (attempt < maxRetries) await sleep(baseDelay * (2 ** attempt));
    }
    const auditHash = payloadHash;
    const deliveryResult: WebhookDeliveryResult = { ok: status >= 200 && status < 300, deliveryId, status, attempts, auditHash };
    if (deliveryResult.ok) this.ledger.complete(deliveryId, payloadHash, deliveryResult);
    else this.ledger.fail(deliveryId, payloadHash, deliveryResult);
    return deliveryResult;
  }
}
