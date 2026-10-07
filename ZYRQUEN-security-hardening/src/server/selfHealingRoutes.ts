import path from 'node:path';
import { USER_ID_RE } from './auth';
import type { SelfHealingCoordinator, FailureEvidence, SelfHealingDraft } from '../../server/selfHealingLoop.ts';
import { dryRunGitProvider } from '../../server/gitProviderDryRun.ts';
import { GitHubPullRequestAutomation } from '../../server/gitPullRequestAutomation.ts';
import { WebhookNotifier } from '../../server/webhookNotifier.ts';
import { audit } from './auditLog.ts';
import { defaultExecutionReceiptLedger, executionReceiptKey, type ExecutionReceiptIdentity } from '../../server/executionReceiptLedger.ts';

export const FINGERPRINT_RE = /^[a-f0-9]{64}$/;
export const DRAFT_ID_RE = /^self-heal-draft-[0-9]+-[a-f0-9]{8}$/;
export const PROJECT_RE = /^[A-Za-z0-9_-]{1,48}$/;

interface Req {
  userId?: string;
  params: Record<string, string>;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
}
interface Res {
  status(code: number): Res;
  json(body: unknown): unknown;
}
export interface ReadOnlyAppLike {
  get(path: string, handler: (req: Req, res: Res) => Promise<unknown>): unknown;
  post(path: string, handler: (req: Req, res: Res) => Promise<unknown>): unknown;
}
export interface SelfHealingRouteDeps {
  coordinator: SelfHealingCoordinator;
}

const ownsProject = (userId: string, projectId: string) => projectId.startsWith(`${userId}.`);
const publicProject = (userId: string, projectId: string) => projectId.slice(userId.length + 1);
const safeFingerprint = (value: unknown) => typeof value === 'string' && FINGERPRINT_RE.test(value) ? value : null;
const safeDraftId = (value: unknown) => typeof value === 'string' && DRAFT_ID_RE.test(value) ? value : null;

function who(req: Req, res: Res): string | null {
  const userId = req.userId;
  if (!userId || !USER_ID_RE.test(userId)) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return null;
  }
  return userId;
}

function summarizeEvidence(userId: string, evidence: FailureEvidence, repeated: boolean) {
  return {
    fingerprint: evidence.fingerprint,
    project: publicProject(userId, evidence.projectId),
    code: evidence.code,
    message: evidence.message,
    occurrences: evidence.occurrences,
    repeated,
    firstSeen: evidence.firstSeen,
    lastSeen: evidence.lastSeen,
    evidenceCount: evidence.evidence.length,
  };
}

function detailEvidence(userId: string, evidence: FailureEvidence, repeated: boolean) {
  return {
    ...summarizeEvidence(userId, evidence, repeated),
    normalizedStack: evidence.normalizedStack,
    evidence: evidence.evidence,
  };
}

function draftProject(coordinator: SelfHealingCoordinator, draft: SelfHealingDraft): string | null {
  const evidence = coordinator.registry.get(draft.rootCause.fingerprint);
  return evidence?.projectId || null;
}

function summarizeDraft(userId: string, coordinator: SelfHealingCoordinator, draft: SelfHealingDraft) {
  const projectId = draftProject(coordinator, draft);
  if (!projectId || !ownsProject(userId, projectId)) return null;
  return {
    draftId: draft.draftId,
    project: publicProject(userId, projectId),
    status: draft.status,
    branchName: draft.branchName,
    baseBranch: draft.baseBranch,
    title: draft.title,
    fingerprint: draft.rootCause.fingerprint,
    diagnosis: draft.rootCause.diagnosis,
    occurrences: draft.rootCause.occurrences,
    validation: draft.validation,
    pushRequested: draft.pushRequested,
    mergeRequested: draft.mergeRequested,
    auditHash: draft.auditHash,
  };
}

export function registerSelfHealingReadOnlyRoutes(app: ReadOnlyAppLike, deps: SelfHealingRouteDeps) {
  const { coordinator } = deps;

  app.get('/api/self-healing/failures', async (req, res) => {
    const userId = who(req, res);
    if (!userId) return;
    const project = req.query?.project;
    if (project !== undefined && (typeof project !== 'string' || !PROJECT_RE.test(project))) return res.status(400).json({ error: 'BAD_PROJECT' });
    const failures = coordinator.registry.list()
      .filter(evidence => ownsProject(userId, evidence.projectId))
      .filter(evidence => project === undefined || publicProject(userId, evidence.projectId) === project)
      .map(evidence => summarizeEvidence(userId, evidence, coordinator.registry.isRepeated(evidence)));
    return res.json({ failures, total: failures.length });
  });

  app.get('/api/self-healing/failures/:fingerprint', async (req, res) => {
    const userId = who(req, res);
    if (!userId) return;
    const fingerprint = safeFingerprint(req.params.fingerprint);
    if (!fingerprint) return res.status(404).json({ error: 'NOT_FOUND' });
    const evidence = coordinator.registry.get(fingerprint);
    if (!evidence || !ownsProject(userId, evidence.projectId)) return res.status(404).json({ error: 'NOT_FOUND' });
    return res.json({ failure: detailEvidence(userId, evidence, coordinator.registry.isRepeated(evidence)) });
  });

  app.get('/api/self-healing/drafts', async (req, res) => {
    const userId = who(req, res);
    if (!userId) return;
    const drafts = coordinator.listDrafts().map(draft => summarizeDraft(userId, coordinator, draft)).filter(Boolean);
    return res.json({ drafts, total: drafts.length });
  });

  app.get('/api/self-healing/drafts/:draftId', async (req, res) => {
    const userId = who(req, res);
    if (!userId) return;
    const draftId = safeDraftId(req.params.draftId);
    if (!draftId) return res.status(404).json({ error: 'NOT_FOUND' });
    const draft = coordinator.getDraft(draftId);
    const projectId = draft ? draftProject(coordinator, draft) : null;
    if (!draft || !projectId || !ownsProject(userId, projectId)) return res.status(404).json({ error: 'NOT_FOUND' });
    return res.json({ draft: { ...draft, project: publicProject(userId, projectId), rootCause: { ...draft.rootCause, stackTrace: draft.rootCause.stackTrace } } });
  });


  app.post('/api/self-healing/drafts/:draftId/pull-request', async (req, res) => {
    const userId = who(req, res);
    if (!userId) return;
    const draftId = safeDraftId(req.params.draftId);
    if (!draftId) return res.status(404).json({ error: 'NOT_FOUND' });
    const draft = coordinator.getDraft(draftId);
    const projectId = draft ? draftProject(coordinator, draft) : null;
    if (!draft || !projectId || !ownsProject(userId, projectId)) return res.status(404).json({ error: 'NOT_FOUND' });
    const body = req.body || {};
    const workspaceRoot = typeof body.workspaceRoot === 'string' ? body.workspaceRoot : '';
    const owner = typeof body.owner === 'string' ? body.owner : userId;
    const repository = typeof body.repository === 'string' ? body.repository : publicProject(userId, projectId);
    const approved = body.approved === true;
    const patchHash = typeof body.patchHash === 'string' ? body.patchHash : undefined;
    if (!workspaceRoot || !path.isAbsolute(workspaceRoot)) return res.status(400).json({ error: 'WORKSPACE_ROOT_REQUIRED' });
    const resolvedWorkspace = path.resolve(workspaceRoot);
    const serverRoot = path.resolve(process.cwd());
    if (resolvedWorkspace !== serverRoot && !resolvedWorkspace.startsWith(`${serverRoot}${path.sep}`)) return res.status(400).json({ error: 'WORKSPACE_ROOT_OUTSIDE_SERVER' });
    const result = await new GitHubPullRequestAutomation().createPullRequest({ workspaceRoot: resolvedWorkspace, draft, repository: { provider: 'github', owner, name: repository }, approved, patchHash });
    let notification: unknown = undefined;
    let executionReceipt: unknown = undefined;
    if (result.status === 'CREATED' && result.patchHash) {
      const receiptLedger = defaultExecutionReceiptLedger();
      const identity: ExecutionReceiptIdentity = {
        draftId: draft.draftId,
        provider: 'github',
        owner,
        repository,
        baseBranch: draft.baseBranch,
        branchName: draft.branchName,
        patchHash: result.patchHash,
      };
      let reservation;
      try {
        reservation = receiptLedger.begin(identity);
      } catch (error) {
        if (error instanceof Error && error.message === 'EXECUTION_RECEIPT_LEDGER_CORRUPT') {
          return res.status(503).json({ error: 'EXECUTION_RECEIPT_LEDGER_CORRUPT', result });
        }
        throw error;
      }
      if (reservation.state === 'CONFLICT') return res.status(409).json({ error: 'EXECUTION_RECEIPT_CONFLICT', result });
      if (reservation.state === 'COMPLETE') {
        executionReceipt = reservation.receipt;
        return res.status(201).json({ result, notification: reservation.receipt.webhook, executionReceipt });
      }
      const deliveryId = `autoheal-${reservation.receipt.receiptId}`;
      if (process.env.SELF_HEALING_WEBHOOK_URL && process.env.SELF_HEALING_WEBHOOK_SECRET) {
        try {
          notification = await new WebhookNotifier().notify({ url: process.env.SELF_HEALING_WEBHOOK_URL, secret: process.env.SELF_HEALING_WEBHOOK_SECRET, allowedHosts: process.env.SELF_HEALING_WEBHOOK_ALLOWED_HOSTS?.split(',').map(v => v.trim()).filter(Boolean), deliveryId }, result);
        } catch (error) {
          notification = { ok: false, error: error instanceof Error ? error.message : String(error) };
        }
      }
      const webhookResult = (notification && typeof notification === 'object' && 'deliveryId' in notification) ? notification as import('../../server/webhookNotifier.ts').WebhookDeliveryResult : undefined;
      const auditEvent = audit('self_healing.pull_request', { actor: userId, target: projectId, result: result.status, detail: result.reason || result.pullRequestUrl || result.auditHash });
      executionReceipt = webhookResult
        ? receiptLedger.complete(executionReceiptKey(identity), { pullRequest: result, webhook: webhookResult, auditEventId: auditEvent.id })
        : receiptLedger.complete(executionReceiptKey(identity), { pullRequest: result, auditEventId: auditEvent.id });
    } else {
      const auditEvent = audit('self_healing.pull_request', { actor: userId, target: projectId, result: result.status, detail: result.reason || result.pullRequestUrl || result.auditHash });
      executionReceipt = undefined;
    }
    return res.status(result.status === 'CREATED' ? 201 : result.status === 'BLOCKED' ? 409 : 502).json({ result, notification, executionReceipt });
  });

  app.post('/api/self-healing/drafts/:draftId/branch-preview', async (req, res) => {
    const userId = who(req, res);
    if (!userId) return;
    const draftId = safeDraftId(req.params.draftId);
    if (!draftId) return res.status(404).json({ error: 'NOT_FOUND' });
    const draft = coordinator.getDraft(draftId);
    const projectId = draft ? draftProject(coordinator, draft) : null;
    if (!draft || !projectId || !ownsProject(userId, projectId)) return res.status(404).json({ error: 'NOT_FOUND' });
    const body = req.body || {};
    const workspaceRoot = typeof body.workspaceRoot === 'string' ? body.workspaceRoot : '';
    const provider = body.provider === 'github' || body.provider === 'gitlab' || body.provider === 'generic' ? body.provider : 'generic';
    const owner = typeof body.owner === 'string' ? body.owner : userId;
    const repository = typeof body.repository === 'string' ? body.repository : publicProject(userId, projectId);
    if (!workspaceRoot || !path.isAbsolute(workspaceRoot)) return res.status(400).json({ error: 'WORKSPACE_ROOT_REQUIRED' });
    const resolvedWorkspace = path.resolve(workspaceRoot);
    const serverRoot = path.resolve(process.cwd());
    if (resolvedWorkspace !== serverRoot && !resolvedWorkspace.startsWith(`${serverRoot}${path.sep}`)) return res.status(400).json({ error: 'WORKSPACE_ROOT_OUTSIDE_SERVER' });
    try {
      const preview = await dryRunGitProvider.previewBranch({ workspaceRoot: resolvedWorkspace, draft, repository: { provider, owner, name: repository } });
      return res.json({ preview });
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : 'INVALID_GIT_PREVIEW' });
    }
  });
}
