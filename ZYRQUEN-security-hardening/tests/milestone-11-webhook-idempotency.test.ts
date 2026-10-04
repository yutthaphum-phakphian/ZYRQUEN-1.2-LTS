import assert from 'node:assert/strict';
import test from 'node:test';

const originalFetch = globalThis.fetch;

test('milestone 11 reuses caller-supplied delivery id across retries', async () => {
  const { WebhookNotifier } = await import('../server/webhookNotifier.ts');
  const { InMemoryWebhookDeliveryLedger } = await import('../server/webhookDeliveryLedger.ts');
  const seen: string[] = [];
  globalThis.fetch = (async (_url: any, init: any) => {
    seen.push(String(init.headers['x-codevoice-delivery']));
    return new Response('ok', { status: 200 });
  }) as any;
  try {
    const result = await new WebhookNotifier(new InMemoryWebhookDeliveryLedger()).notify({
      url: 'https://hooks.example.com/cv', secret: 'secret', allowedHosts: ['hooks.example.com'],
      deliveryId: 'm11-fixed-delivery-001', maxRetries: 0, baseRetryDelayMs: 0
    }, { status:'CREATED', provider:'github', repository:{provider:'github',owner:'o',name:'r'}, branchName:'b', auditHash:'a' } as any);
    assert.equal(result.ok, true);
    assert.equal(result.deliveryId, 'm11-fixed-delivery-001');
    assert.deepEqual(seen, ['m11-fixed-delivery-001']);
  } finally { globalThis.fetch = originalFetch; }
});

test('milestone 11 rejects malformed caller-supplied delivery id', async () => {
  const { WebhookNotifier } = await import('../server/webhookNotifier.ts');
  await assert.rejects(() => new WebhookNotifier().notify({ url:'https://hooks.example.com/cv', secret:'secret', allowedHosts:['hooks.example.com'], deliveryId:'bad id' }, { status:'CREATED', provider:'github', repository:{provider:'github',owner:'o',name:'r'}, branchName:'b', auditHash:'a' } as any), /WEBHOOK_DELIVERY_ID_INVALID/);
});
