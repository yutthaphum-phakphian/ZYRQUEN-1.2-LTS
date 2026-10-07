import assert from 'node:assert/strict';
import test from 'node:test';

const originalFetch = globalThis.fetch;
const result = { status:'CREATED', provider:'github', repository:{provider:'github',owner:'o',name:'r'}, branchName:'b', auditHash:'a' } as any;

function config(deliveryId: string) { return { url:'https://hooks.example.com/cv', secret:'secret', allowedHosts:['hooks.example.com'], deliveryId, maxRetries:0, baseRetryDelayMs:0 }; }

test('milestone 12 replays a sent delivery without a second network request', async () => {
  const { InMemoryWebhookDeliveryLedger } = await import('../server/webhookDeliveryLedger.ts');
  const { WebhookNotifier } = await import('../server/webhookNotifier.ts');
  const ledger = new InMemoryWebhookDeliveryLedger(); let calls = 0;
  globalThis.fetch = (async () => { calls++; return new Response('ok', { status:200 }); }) as any;
  try {
    const notifier = new WebhookNotifier(ledger);
    const first = await notifier.notify(config('m12-replay-001'), result);
    const second = await notifier.notify(config('m12-replay-001'), result);
    assert.equal(first.ok, true); assert.deepEqual(second, first); assert.equal(calls, 1);
  } finally { globalThis.fetch = originalFetch; }
});

test('milestone 12 blocks reuse of a delivery id for a different payload', async () => {
  const { InMemoryWebhookDeliveryLedger } = await import('../server/webhookDeliveryLedger.ts');
  const { WebhookNotifier } = await import('../server/webhookNotifier.ts');
  const ledger = new InMemoryWebhookDeliveryLedger();
  globalThis.fetch = (async () => new Response('ok', { status:200 })) as any;
  try {
    const notifier = new WebhookNotifier(ledger);
    await notifier.notify(config('m12-conflict-001'), result);
    await assert.rejects(() => notifier.notify(config('m12-conflict-001'), {...result, branchName:'different'}), /WEBHOOK_DELIVERY_LEDGER_CONFLICT/);
  } finally { globalThis.fetch = originalFetch; }
});

test('milestone 12 blocks concurrent delivery with same identity', async () => {
  const { InMemoryWebhookDeliveryLedger } = await import('../server/webhookDeliveryLedger.ts');
  const { WebhookNotifier } = await import('../server/webhookNotifier.ts');
  const ledger = new InMemoryWebhookDeliveryLedger(); let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  globalThis.fetch = (async () => { await gate; return new Response('ok', { status:200 }); }) as any;
  try {
    const notifier = new WebhookNotifier(ledger);
    const pending = notifier.notify(config('m12-concurrent-001'), result);
    await new Promise(r => setTimeout(r, 0));
    await assert.rejects(() => notifier.notify(config('m12-concurrent-001'), result), /WEBHOOK_DELIVERY_IN_PROGRESS/);
    release(); await pending;
  } finally { globalThis.fetch = originalFetch; }
});
