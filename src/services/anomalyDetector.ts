/**
 * ZYRQUEN Sovereign Anomaly Detection Engine & Notification Dispatcher
 * Strictly implements Zero-Trust Fail-Closed invariant auditing.
 */

export interface SovereignAuditEvent {
  id: string;
  timestamp: string;
  eventType: string;
  status: 'SUCCESS' | 'FAILED' | 'TAMPERED' | 'WARNING';
  operator: string;
  driftPercentage: number;
  blockHash?: string;
  signature?: string;
  metadata?: Record<string, unknown>;
  acknowledged?: boolean;
}

export interface AnomalyEvaluationResult {
  isAnomaly: boolean;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'NONE';
  reasons: string[];
}

/**
 * Anomaly filter specification:
 * - Event is an anomaly if:
 *   1. Drift percentage >= 15%
 *   2. Status is 'FAILED' or 'TAMPERED' (case-insensitive)
 * - Zero-drift success events (status === 'SUCCESS' && driftPercentage === 0) MUST return false.
 */
export function isAnomalyEvent(event: SovereignAuditEvent): boolean {
  // Defensive zero-drift success rule
  const normStatus = (event.status || '').toUpperCase();
  if (normStatus === 'SUCCESS' && (event.driftPercentage === 0 || !event.driftPercentage)) {
    return false;
  }

  if (event.driftPercentage >= 15) {
    return true;
  }

  if (normStatus === 'FAILED' || normStatus === 'TAMPERED') {
    return true;
  }

  return false;
}

export function evaluateAnomaly(event: SovereignAuditEvent): AnomalyEvaluationResult {
  const reasons: string[] = [];
  const normStatus = (event.status || '').toUpperCase();

  if (normStatus === 'TAMPERED') {
    reasons.push('Cryptographic signature or hash tampering detected.');
  }

  if (normStatus === 'FAILED') {
    reasons.push('Invariant execution pipeline returned FAILED status.');
  }

  if (event.driftPercentage >= 50) {
    reasons.push(`Extreme telemetric drift detected (${event.driftPercentage.toFixed(1)}% >= 50%).`);
  } else if (event.driftPercentage >= 15) {
    reasons.push(`Significant telemetric drift observed (${event.driftPercentage.toFixed(1)}% >= 15%).`);
  }

  if (reasons.length === 0) {
    return {
      isAnomaly: false,
      severity: 'NONE',
      reasons: ['Nominal execution parameters verified.']
    };
  }

  const severity = (normStatus === 'TAMPERED' || event.driftPercentage >= 50)
    ? 'CRITICAL'
    : normStatus === 'FAILED'
    ? 'HIGH'
    : 'MEDIUM';

  return {
    isAnomaly: true,
    severity,
    reasons
  };
}

// In-memory 15-minute notification cooldown tracker
const notificationCooldownMap = new Map<string, number>();
const COOLDOWN_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export interface NotificationResponse {
  status: 'sent' | 'cooldown' | 'unavailable';
  detail: string;
  targetId?: string;
  sentAt?: string;
}

/**
 * Dispatches notification to Sovereign Project Owner.
 * Strict Fallback Rule:
 * - If OWNER_NOTIFICATION_WEBHOOK_URL is not set, returns { status: 'unavailable' }
 * - Never returns fake success.
 */
export async function sendOwnerNotification(
  event: SovereignAuditEvent,
  webhookUrl?: string
): Promise<NotificationResponse> {
  const targetKey = `${event.operator || 'system'}-${event.eventType}-${event.id}`;
  const now = Date.now();

  const lastSent = notificationCooldownMap.get(targetKey);
  if (lastSent && now - lastSent < COOLDOWN_DURATION_MS) {
    const remainingMins = Math.ceil((COOLDOWN_DURATION_MS - (now - lastSent)) / 60000);
    return {
      status: 'cooldown',
      detail: `Notification throttled by 15-minute cooldown policy. ${remainingMins}m remaining.`,
      targetId: event.id
    };
  }

  const activeWebhook = webhookUrl || (typeof process !== 'undefined' ? process.env.OWNER_NOTIFICATION_WEBHOOK_URL : undefined);

  if (!activeWebhook) {
    return {
      status: 'unavailable',
      detail: 'OWNER_NOTIFICATION_WEBHOOK_URL is not configured. Telemetry stored in immutable audit trail without external dispatch.',
      targetId: event.id
    };
  }

  try {
    const payload = {
      source: 'ZYRQUEN Ω∞ Sovereign Telemetry Guard',
      timestampUtc: new Date().toISOString(),
      event: {
        id: event.id,
        status: event.status,
        driftPercentage: event.driftPercentage,
        operator: event.operator,
        signature: event.signature
      }
    };

    const res = await fetch(activeWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      return {
        status: 'unavailable',
        detail: `Webhook target responded with HTTP ${res.status}: ${res.statusText}`,
        targetId: event.id
      };
    }

    notificationCooldownMap.set(targetKey, now);
    return {
      status: 'sent',
      detail: 'Sovereign anomaly dispatch delivered successfully to owner endpoint.',
      targetId: event.id,
      sentAt: new Date().toISOString()
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      status: 'unavailable',
      detail: `Network dispatch error: ${msg}`,
      targetId: event.id
    };
  }
}
