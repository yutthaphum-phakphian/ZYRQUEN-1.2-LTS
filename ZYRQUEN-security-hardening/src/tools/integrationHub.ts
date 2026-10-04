import {
  ConnectorDefinition, IntegrationAuditEntry, IntegrationDefinition, IntegrationDiscoveryResult, IntegrationEvent, IntegrationEventType,
  IntegrationExecutionResult, IntegrationExecutionStatus, IntegrationHealthRecord, IntegrationHubState, IntegrationOperation, IntegrationPermission,
  IntegrationRisk, OpenApiImportResult, ConnectionMetadata, WebhookDefinition,
} from '../types';
import { classifyUniversalFailure } from './universalRuntime';
import { validateExternalUrlResolved } from './externalUrlGuard';

const STORAGE_KEY = 'codevoice-ai:v13:integration-hub-metadata';
const now = () => new Date().toISOString();
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function emptyState(): IntegrationHubState { return { integrations: [], connectors: [], connections: [], health: [], events: [], audit: [], webhooks: [], updatedAt: now() }; }
function safeMeta(value: unknown): unknown {
  if (typeof value === 'string') return value.replace(/(Bearer\s+|(?:api[_-]?key|token|secret|password)\s*[=:]?\s*)([^\s,;]+)/gi, '$1********').slice(0, 2000);
  if (Array.isArray(value)) return value.slice(0, 20).map(safeMeta);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([k]) => !/secret|token|password|credential|authorization|api[_-]?key/i.test(k)).slice(0, 30).map(([k, v]) => [k, safeMeta(v)]));
  return value;
}

export class IntegrationHub {
  private state: IntegrationHubState;
  constructor() { this.state = this.restore(); }
  getState(): IntegrationHubState { return JSON.parse(JSON.stringify(this.state)); }
  private persist() { this.state.updatedAt = now(); try { if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state)); } catch { /* metadata persistence is optional; secrets are never stored */ } }
  private emit(type: IntegrationEventType, payload: Record<string, unknown>, integrationId?: string) { const event: IntegrationEvent = { eventId: uid('event'), type, source: 'integration-hub', timestamp: now(), integrationId, payload: safeMeta(payload) as Record<string, unknown>, metadata: { sanitized: true } }; this.state.events.unshift(event); this.state.events = this.state.events.slice(0, 200); this.persist(); return event; }
  private audit(entry: Omit<IntegrationAuditEntry, 'id' | 'timestamp'>) { const record = { ...entry, id: uid('audit'), timestamp: now(), sanitizedMetadata: safeMeta(entry.sanitizedMetadata) as Record<string, unknown> }; this.state.audit.unshift(record); this.state.audit = this.state.audit.slice(0, 500); this.persist(); return record; }
  registerIntegration(integration: IntegrationDefinition): IntegrationDefinition { if (!integration.id || this.state.integrations.some((x) => x.id === integration.id)) throw new Error('INTEGRATION_ALREADY_REGISTERED'); this.state.integrations.push({ ...integration, health: integration.health || 'UNKNOWN' }); this.emit('integration.connected', { name: integration.name, status: integration.status }, integration.id); return integration; }
  registerConnector(connector: ConnectorDefinition): ConnectorDefinition { if (!connector.integrationId || !this.state.integrations.some((x) => x.id === connector.integrationId)) throw new Error('INTEGRATION_NOT_FOUND'); if (this.state.connectors.some((x) => x.id === connector.id)) throw new Error('CONNECTOR_ALREADY_REGISTERED'); this.state.connectors.push(connector); this.emit('schema.updated', { connectorId: connector.id }, connector.integrationId); return connector; }
  registerConnection(connection: ConnectionMetadata): ConnectionMetadata { this.state.connections = [...this.state.connections.filter((x) => x.id !== connection.id), { ...connection, credentialRef: connection.credentialRef ? `ref:${connection.credentialRef.replace(/^ref:/, '')}` : undefined }]; this.persist(); return connection; }
  discover(query: string): IntegrationDiscoveryResult { const q = query.toLowerCase(); const integrations = this.state.integrations.map((integration) => ({ ...integration, usableConnectors: this.state.connectors.filter((c) => c.integrationId === integration.id && c.availability === 'AVAILABLE' && `${c.name} ${c.description} ${c.type}`.toLowerCase().includes(q)) })).filter((x) => `${x.name} ${x.provider} ${x.category}`.toLowerCase().includes(q) || x.usableConnectors.length > 0); return { query, integrations, status: integrations.length ? 'AVAILABLE' : 'UNAVAILABLE' }; }
  async testConnection(integrationId: string): Promise<IntegrationHealthRecord> {
    const integration = this.state.integrations.find((x) => x.id === integrationId);
    const connection = this.state.connections.find((x) => x.integrationId === integrationId);
    const started = Date.now();
    let record: IntegrationHealthRecord;
    if (!integration) {
      record = { integrationId, status: 'UNAVAILABLE', checkedAt: now(), retryCount: 0, evidence: ['INTEGRATION_NOT_FOUND'] };
    } else if (integration.id === 'int-github' || integration.provider === 'GitHub') {
      // Public probe — does not require a token
      try {
        const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timer = ctrl ? setTimeout(() => ctrl.abort(), 8000) : null;
        const res = await fetch('https://api.github.com/rate_limit', {
          method: 'GET',
          headers: { Accept: 'application/vnd.github+json' },
          signal: ctrl?.signal,
        });
        if (timer) clearTimeout(timer);
        const latencyMs = Date.now() - started;
        if (res.ok) {
          record = {
            integrationId,
            status: connection?.status === 'CONNECTED' ? 'HEALTHY' : 'DEGRADED',
            checkedAt: now(),
            latencyMs,
            retryCount: 0,
            evidence: [
              `GitHub API reachable HTTP ${res.status}`,
              connection?.status === 'CONNECTED'
                ? 'credentialRef present (private ops may work)'
                : 'No credentialRef — public endpoints only; set token for private repos',
            ],
          };
        } else {
          record = {
            integrationId,
            status: 'ERROR',
            checkedAt: now(),
            latencyMs,
            retryCount: 0,
            error: `HTTP ${res.status}`,
            evidence: [`GitHub probe failed: HTTP ${res.status}`],
          };
        }
      } catch (err) {
        record = {
          integrationId,
          status: 'UNAVAILABLE',
          checkedAt: now(),
          latencyMs: Date.now() - started,
          retryCount: 0,
          error: String(err),
          evidence: ['GitHub probe network error', String(err)],
        };
      }
    } else if (integration.id === 'int-slack' || integration.provider === 'Slack') {
      if (!connection || connection.status !== 'CONNECTED' || !connection.credentialRef) {
        record = {
          integrationId,
          status: 'CONFIG_REQUIRED',
          checkedAt: now(),
          latencyMs: Date.now() - started,
          retryCount: 0,
          evidence: [
            'Slack webhook URL not configured',
            'Register ConnectionMetadata with credentialRef pointing to webhook URL in secure storage',
          ],
        };
      } else {
        record = {
          integrationId,
          status: 'UNKNOWN',
          checkedAt: now(),
          latencyMs: Date.now() - started,
          retryCount: 0,
          evidence: [
            'credentialRef present — not executing live POST to avoid accidental messages',
            'Mark HEALTHY after a successful manual notify test',
          ],
        };
      }
    } else if (!connection || connection.status !== 'CONNECTED') {
      record = {
        integrationId,
        status: 'AUTH_REQUIRED',
        checkedAt: now(),
        latencyMs: Date.now() - started,
        retryCount: 0,
        evidence: ['No connected credentialRef; secure storage is not available in this runtime'],
      };
    } else {
      record = {
        integrationId,
        status: 'UNKNOWN',
        checkedAt: now(),
        latencyMs: Date.now() - started,
        retryCount: 0,
        evidence: ['Connection metadata exists but no connector-specific health endpoint was executed'],
      };
    }
    this.state.health = [...this.state.health.filter((x) => x.integrationId !== integrationId), record];
    if (integration) integration.health = record.status;
    this.audit({
      actor: 'user',
      integrationId,
      permission: 'NOT_CHECKED',
      status: record.status === 'HEALTHY' || record.status === 'DEGRADED' ? 'LIVE' : record.status === 'ERROR' ? 'FAILED' : 'UNAVAILABLE',
      durationMs: record.latencyMs || 0,
      retryCount: 0,
      sanitizedMetadata: { action: 'test_connection', health: record.status, evidence: record.evidence },
    });
    this.emit(
      record.status === 'AUTH_REQUIRED' || record.status === 'CONFIG_REQUIRED'
        ? 'authentication.required'
        : 'integration.health_changed',
      { status: record.status, evidence: record.evidence },
      integrationId,
    );
    this.persist();
    return record;
  }
  async executeConnector<T = unknown>(integrationId: string, connectorId: string, operation: IntegrationOperation, input: Record<string, unknown>, actor = 'universal-agent', permission: IntegrationPermission = 'READ'): Promise<IntegrationExecutionResult<T>> {
    const started = Date.now(); const connector = this.state.connectors.find((x) => x.id === connectorId && x.integrationId === integrationId); const integration = this.state.integrations.find((x) => x.id === integrationId); const auditBase = { integrationId, connectorId, operation, actor, permission: 'DENIED' as const, status: 'UNAVAILABLE' as const, durationMs: 0, retryCount: 0, sanitizedMetadata: { inputKeys: Object.keys(input) } };
    if (!integration || !connector || connector.availability === 'UNAVAILABLE') { const audit = this.audit({ ...auditBase, errorClass: 'INTEGRATION_UNAVAILABLE' }); return { status: 'UNAVAILABLE', error: { code: 'INTEGRATION_UNAVAILABLE', message: 'Integration or connector is unavailable', retryable: false, canonicalClass: 'TOOL' }, evidence: ['No live connector registered'], durationMs: Date.now() - started, retryCount: 0, auditId: audit.id }; }
    const opPermission = connector.permissions.find((p) => p.operation === operation); if (!opPermission || !this.permissionAllowed(opPermission.permission, permission, opPermission.risk)) { const audit = this.audit({ ...auditBase, errorClass: 'PERMISSION_DENIED' }); this.emit('connector.failed', { code: 'PERMISSION_DENIED' }, integrationId); return { status: 'BLOCKED', error: { code: 'PERMISSION_DENIED', message: 'Permission gate denied before connector execution', retryable: false, canonicalClass: 'PERMISSION' }, evidence: ['Permission check executed before external call'], durationMs: Date.now() - started, retryCount: 0, auditId: audit.id }; }
    if (integration.status !== 'CONNECTED') { const audit = this.audit({ ...auditBase, errorClass: 'AUTH_REQUIRED' }); return { status: 'UNAVAILABLE', error: { code: 'AUTH_REQUIRED', message: 'Connection is not connected', retryable: false, canonicalClass: 'PERMISSION' }, evidence: ['No active connected metadata'], durationMs: Date.now() - started, retryCount: 0, auditId: audit.id }; }
    const result = await this.executeRest<T>(connector, operation, input); const audit = this.audit({ ...auditBase, permission: 'ALLOWED', status: result.status, durationMs: result.durationMs, retryCount: result.retryCount, errorClass: result.error?.code }); result.auditId = audit.id; return result;
  }
  private permissionAllowed(required: IntegrationPermission, granted: IntegrationPermission, risk: IntegrationRisk) { const order: IntegrationPermission[] = ['READ', 'WRITE', 'EXECUTE', 'DELETE', 'ADMIN']; return risk === 'DANGEROUS' ? false : order.indexOf(granted) >= order.indexOf(required); }
  private async executeRest<T>(connector: ConnectorDefinition, operation: IntegrationOperation, input: Record<string, unknown>): Promise<IntegrationExecutionResult<T>> { const started = Date.now(); if (!connector.baseUrl || !/^https:\/\//i.test(connector.baseUrl)) return { status: 'UNAVAILABLE', error: { code: 'CONFIG_REQUIRED', message: 'REST connector requires an HTTPS baseUrl', retryable: false, canonicalClass: 'TOOL' }, evidence: ['Unsafe or missing URL rejected before fetch'], durationMs: Date.now() - started, retryCount: 0, auditId: '' }; const configuredDomains = String(process.env.CODEVOICE_ALLOWED_EXTERNAL_DOMAINS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean); const fixedDomains = connector.baseUrl === 'https://api.github.com' ? ['api.github.com'] : configuredDomains; const urlCheck = await validateExternalUrlResolved(connector.baseUrl, fixedDomains); if (urlCheck.decision !== 'ALLOW') return { status: 'UNAVAILABLE', error: { code: 'EXTERNAL_URL_BLOCKED', message: urlCheck.reasons.join(','), retryable: false, canonicalClass: 'TOOL' }, evidence: ['External URL rejected before fetch', ...urlCheck.reasons], durationMs: Date.now() - started, retryCount: 0, auditId: '' }; const method = operation === 'CREATE' ? 'POST' : operation === 'UPDATE' ? 'PUT' : operation === 'DELETE' ? 'DELETE' : 'GET'; try { const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), connector.timeoutMs); const response = await fetch(connector.baseUrl, { method, headers: { 'Content-Type': 'application/json' }, body: method === 'GET' || method === 'DELETE' ? undefined : JSON.stringify(input), signal: controller.signal, redirect: 'manual' }); clearTimeout(timer); const text = await response.text(); let data: unknown; try { data = text ? JSON.parse(text) : null; } catch { data = text.slice(0, 1000); } const status: IntegrationExecutionStatus = response.ok ? 'LIVE' : response.status === 429 ? 'PARTIAL' : 'FAILED'; return { status, data: data as T, sanitizedResponse: safeMeta(data), error: response.ok ? undefined : { code: response.status === 429 ? 'RATE_LIMITED' : 'REMOTE_ERROR', message: `Remote response ${response.status}`, retryable: response.status === 429 || response.status >= 500, canonicalClass: response.status === 429 || response.status >= 500 ? 'NETWORK' : 'TOOL' }, evidence: [`HTTPS ${method} executed`, `status=${response.status}`], durationMs: Date.now() - started, retryCount: 0, auditId: '' }; } catch (error) { const failure = classifyUniversalFailure(error); return { status: 'FAILED', error: { code: failure === 'TIMEOUT' ? 'TIMEOUT' : 'CONNECTION_FAILED', message: 'External request failed; raw error omitted from audit', retryable: true, canonicalClass: failure }, evidence: [`failureClass=${failure}`], durationMs: Date.now() - started, retryCount: 0, auditId: '' }; } }
  importOpenApi(schema: unknown, integrationBase: Omit<IntegrationDefinition, 'id' | 'status' | 'health'> & { id?: string }): OpenApiImportResult { if (!schema || typeof schema !== 'object') return { status: 'INVALID', connectors: [], errors: ['SCHEMA_INVALID'], warnings: [] }; const doc = schema as any; if (!doc.openapi && !doc.swagger) return { status: 'INVALID', connectors: [], errors: ['OpenAPI/Swagger version missing'], warnings: [] }; const integration: IntegrationDefinition = { ...integrationBase, id: integrationBase.id || uid('integration'), status: 'CONFIG_REQUIRED', health: 'CONFIG_REQUIRED' }; const connectors: ConnectorDefinition[] = []; Object.entries(doc.paths || {}).forEach(([path, methods]) => Object.keys((methods || {}) as object).filter((m) => ['get', 'post', 'put', 'patch', 'delete'].includes(m)).forEach((method) => connectors.push({ id: uid('connector'), integrationId: integration.id, name: `${method.toUpperCase()} ${path}`, description: `Imported OpenAPI endpoint ${method.toUpperCase()} ${path}`, type: 'REST_API', baseUrl: doc.servers?.[0]?.url, operations: [method === 'get' ? 'READ' : method === 'delete' ? 'DELETE' : method === 'post' ? 'CREATE' : 'UPDATE'], inputSchema: {}, outputSchema: {}, permissions: [{ operation: method === 'get' ? 'READ' : method === 'delete' ? 'DELETE' : method === 'post' ? 'CREATE' : 'UPDATE', permission: method === 'get' ? 'READ' : 'WRITE', risk: method === 'delete' ? 'DANGEROUS' : method === 'get' ? 'SAFE' : 'REVIEW' }], timeoutMs: 10000, retryPolicy: { maxAttempts: 2, backoffMs: 250, retryableStatuses: [408, 429, 500, 502, 503, 504] }, availability: doc.servers?.[0]?.url ? 'AVAILABLE' : 'UNAVAILABLE' }))); try { this.registerIntegration(integration); connectors.forEach((c) => this.registerConnector(c)); return { status: 'REGISTERED', integration, connectors, errors: [], warnings: integration.authType !== 'NONE' ? ['AUTH_REQUIRED: credentialRef must be configured; no secrets were imported'] : [] }; } catch (error) { return { status: 'INVALID', connectors, errors: [String(error)], warnings: [] }; } }
  addWebhook(webhook: WebhookDefinition) { this.state.webhooks.push({ ...webhook, secretRef: webhook.secretRef ? `ref:${webhook.secretRef.replace(/^ref:/, '')}` : undefined }); this.persist(); return webhook; }
  recordWebhook(event: Omit<IntegrationEvent, 'eventId' | 'timestamp' | 'source'>) { return this.emit('webhook.received', event.payload, event.integrationId); }
  transform(input: unknown, mapping: Record<string, string>): Record<string, unknown> { const source = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>; return Object.fromEntries(Object.entries(mapping).map(([target, path]) => [target, path.split('.').reduce((v: any, key) => v?.[key], source)])); }
  private restore(): IntegrationHubState {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as IntegrationHubState;
          if (parsed && Array.isArray(parsed.integrations)) return parsed;
        }
      }
    } catch { /* ignore invalid metadata */ }
    return emptyState();
  }

  /** Register built-in sample connectors (idempotent). Does not invent fake "connected" secrets. */
  ensureBuiltinConnectors(): IntegrationHubState {
    const samples: IntegrationDefinition[] = [
      {
        id: 'int-github',
        name: 'GitHub',
        provider: 'GitHub',
        type: 'REST_API',
        category: 'source-control',
        status: 'CONFIG_REQUIRED',
        authType: 'BEARER',
        capabilities: ['repos', 'issues', 'pulls'],
        scopes: ['public_repo', 'read:user'],
        health: 'AUTH_REQUIRED',
        metadata: { docs: 'https://docs.github.com/en/rest', probe: 'https://api.github.com/rate_limit' },
      },
      {
        id: 'int-slack',
        name: 'Slack Incoming Webhook',
        provider: 'Slack',
        type: 'WEBHOOK',
        category: 'messaging',
        status: 'CONFIG_REQUIRED',
        authType: 'NONE',
        capabilities: ['notify'],
        scopes: ['incoming-webhook'],
        health: 'CONFIG_REQUIRED',
        metadata: { docs: 'https://api.slack.com/messaging/webhooks' },
      },
    ];
    for (const integ of samples) {
      if (!this.state.integrations.some((x) => x.id === integ.id)) {
        this.state.integrations.push(integ);
        this.emit('integration.connected', { name: integ.name, status: integ.status, sample: true }, integ.id);
      }
    }
    const connectors: ConnectorDefinition[] = [
      {
        id: 'conn-github-rest',
        integrationId: 'int-github',
        name: 'GitHub REST API',
        description: 'Public GitHub REST (rate_limit probe ใช้ได้โดยไม่ต้องมี token; private ops ต้องมี credentialRef)',
        type: 'REST_API',
        baseUrl: 'https://api.github.com',
        operations: ['READ', 'CREATE', 'UPDATE'],
        inputSchema: { path: 'string' },
        outputSchema: {},
        permissions: [
          { operation: 'READ', permission: 'READ', risk: 'SAFE' },
          { operation: 'CREATE', permission: 'WRITE', risk: 'REVIEW' },
          { operation: 'UPDATE', permission: 'WRITE', risk: 'REVIEW' },
        ],
        timeoutMs: 10000,
        retryPolicy: { maxAttempts: 2, backoffMs: 300, retryableStatuses: [408, 429, 500, 502, 503, 504] },
        availability: 'AVAILABLE',
      },
      {
        id: 'conn-slack-webhook',
        integrationId: 'int-slack',
        name: 'Slack Incoming Webhook',
        description: 'ส่งข้อความเข้า channel ผ่าน webhook URL (เก็บเฉพาะ ref ไม่เก็บ URL/secret ใน state)',
        type: 'WEBHOOK',
        operations: ['CREATE'],
        inputSchema: { text: 'string' },
        outputSchema: {},
        permissions: [{ operation: 'CREATE', permission: 'WRITE', risk: 'REVIEW' }],
        timeoutMs: 8000,
        retryPolicy: { maxAttempts: 2, backoffMs: 250, retryableStatuses: [408, 429, 500, 502, 503, 504] },
        availability: 'AVAILABLE',
      },
    ];
    for (const conn of connectors) {
      if (!this.state.connectors.some((x) => x.id === conn.id)) {
        this.state.connectors.push(conn);
        this.emit('schema.updated', { connectorId: conn.id, sample: true }, conn.integrationId);
      }
    }
    this.persist();
    return this.getState();
  }
}


export const integrationHub = new IntegrationHub();
// Seed sample GitHub + Slack connectors when hub is empty (idempotent)
try {
  if (integrationHub.getState().integrations.length === 0) {
    integrationHub.ensureBuiltinConnectors();
  }
} catch { /* SSR / no localStorage */ }
