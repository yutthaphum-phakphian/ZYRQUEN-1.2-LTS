import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { previewDeveloperPatch } from './developerPatchEngine.ts';
import type { SelfHealingDraft } from './selfHealingLoop.ts';
import type { GitRepositoryRef } from './gitProviderDryRun.ts';
import { defaultPRExecutionLedger, prExecutionKey, type PRExecutionLedger } from './prExecutionLedger.ts';

export type PullRequestExecutionStatus = 'CREATED' | 'BLOCKED' | 'FAILED';
export interface PullRequestResult { status: PullRequestExecutionStatus; provider: 'github'; repository: GitRepositoryRef; branchName: string; pullRequestUrl?: string; pullRequestNumber?: number; commitSha?: string; patchHash?: string; auditHash: string; reason?: string; }
export interface GitHubTokenProvider { getToken(): Promise<string | undefined>; }
export class EnvironmentGitHubTokenProvider implements GitHubTokenProvider { async getToken() { const token = process.env.GITHUB_TOKEN?.trim(); return token || undefined; } }

const sha256 = (v: unknown) => crypto.createHash('sha256').update(typeof v === 'string' ? v : JSON.stringify(v)).digest('hex');
const safePart = (v: string, field: string) => { const normalized = String(v || '').trim(); if (!normalized || normalized.length > 120 || !/^[A-Za-z0-9._-]+$/.test(normalized)) throw new Error(`INVALID_GIT_${field.toUpperCase()}`); return normalized; };
const safeBranch = (v: string) => { if (!/^[A-Za-z0-9._/-]{1,160}$/.test(v) || v.includes('..') || v.startsWith('/')) throw new Error('INVALID_GIT_BRANCH'); return v; };
const apiPath = (repo: GitRepositoryRef, suffix: string) => `/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}${suffix}`;

export interface GitHubApi { request<T>(method: string, url: string, token: string, body?: unknown): Promise<T>; }
export class FetchGitHubApi implements GitHubApi {
  async request<T>(method: string, url: string, token: string, body?: unknown): Promise<T> {
    const response = await fetch(`https://api.github.com${url}`, { method, headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'CodeVoice-ZYRQUEN-AutoHeal' }, body: body === undefined ? undefined : JSON.stringify(body) });
    const text = await response.text(); let data: any; try { data = text ? JSON.parse(text) : undefined; } catch { data = undefined; }
    if (!response.ok) throw new Error(`GITHUB_API_${response.status}:${data?.message || 'REQUEST_FAILED'}`);
    return data as T;
  }
}

interface RefResponse { object: { sha: string } }
interface CommitResponse { sha: string; tree: { sha: string } }
interface TreeResponse { sha: string }
interface BlobResponse { sha: string }
interface PullResponse { number: number; html_url: string; body?: string | null; head?: { ref?: string; sha?: string }; base?: { ref?: string } }
const reconciliationMarker = (patchHash: string) => `<!-- ZYRQUEN-AUTOHEAL patchHash=${patchHash} -->`;
const hasReconciliationMarker = (body: unknown, patchHash: string) => typeof body === 'string' && body.includes(reconciliationMarker(patchHash));

export class GitHubPullRequestAutomation {
  private readonly api: GitHubApi;
  private readonly tokenProvider: GitHubTokenProvider;
  private readonly ledger: PRExecutionLedger;
  constructor(api: GitHubApi = new FetchGitHubApi(), tokenProvider: GitHubTokenProvider = new EnvironmentGitHubTokenProvider(), ledger: PRExecutionLedger = defaultPRExecutionLedger()) { this.api = api; this.tokenProvider = tokenProvider; this.ledger = ledger; }

  async createPullRequest(input: { workspaceRoot: string; draft: SelfHealingDraft; repository: GitRepositoryRef; approved?: boolean; patchHash?: string }): Promise<PullRequestResult> {
    const base = { provider: 'github' as const, repository: input.repository, branchName: input.draft.branchName, patchHash: input.patchHash };
    try {
      if (input.repository.provider !== 'github') return this.blocked(base, 'UNSUPPORTED_GIT_PROVIDER');
      if (input.approved !== true) return this.blocked(base, 'PULL_REQUEST_APPROVAL_REQUIRED');
      if (input.draft.status !== 'DRAFT_READY') return this.blocked(base, 'DRAFT_NOT_READY');
      if (!path.isAbsolute(input.workspaceRoot)) return this.blocked(base, 'WORKSPACE_ROOT_MUST_BE_ABSOLUTE');
      safePart(input.repository.owner, 'owner');
      safePart(input.repository.name, 'repository');
      safeBranch(input.draft.branchName);
      const token = await this.tokenProvider.getToken();
      if (!token) return this.blocked(base, 'GITHUB_TOKEN_NOT_CONFIGURED');
      const preview = await previewDeveloperPatch({ workspaceRoot: input.workspaceRoot, operations: input.draft.operations, sourcePlanId: input.draft.draftId });
      if (preview.status !== 'READY_FOR_APPROVAL') return this.blocked({ ...base, patchHash: preview.patchHash }, 'NO_SAFE_PATCH');
      if (!input.patchHash || input.patchHash !== preview.patchHash) return this.blocked({ ...base, patchHash: preview.patchHash }, 'PATCH_HASH_MISMATCH');
      const executionKey = prExecutionKey({ draftId: input.draft.draftId, provider: input.repository.provider, owner: input.repository.owner, repository: input.repository.name, patchHash: preview.patchHash, baseBranch: input.draft.baseBranch, branchName: input.draft.branchName });
      const reservation = this.ledger.begin(executionKey);
      if (reservation.state === 'CREATED') return reservation.result;
      if (reservation.state === 'IN_PROGRESS') return this.blocked({ ...base, patchHash: preview.patchHash }, 'PULL_REQUEST_EXECUTION_IN_PROGRESS');

      const repo = input.repository;
      const ref = await this.api.request<RefResponse>('GET', apiPath(repo, `/git/ref/heads/${encodeURIComponent(input.draft.baseBranch)}`), token);
      const baseCommit = await this.api.request<CommitResponse>('GET', apiPath(repo, `/git/commits/${ref.object.sha}`), token);
      try {
        await this.api.request('GET', apiPath(repo, `/git/ref/heads/${encodeURIComponent(input.draft.branchName)}`), token);
        const remotePulls = await this.api.request<PullResponse[]>('GET', apiPath(repo, `/pulls?state=open&head=${encodeURIComponent(`${repo.owner}:${input.draft.branchName}`)}&base=${encodeURIComponent(input.draft.baseBranch)}`), token);
        const recovered = remotePulls.find(pr => pr.head?.ref === input.draft.branchName && pr.base?.ref === input.draft.baseBranch && hasReconciliationMarker(pr.body, preview.patchHash));
        if (recovered) {
          const auditHash = sha256({ ...base, patchHash: preview.patchHash, pullRequestNumber: recovered.number, pullRequestUrl: recovered.html_url, recovered: true });
          const result: PullRequestResult = { status: 'CREATED', ...base, patchHash: preview.patchHash, pullRequestNumber: recovered.number, pullRequestUrl: recovered.html_url, auditHash };
          this.ledger.complete(executionKey, result);
          return result;
        }
        return this.blocked({ ...base, patchHash: preview.patchHash }, 'GIT_BRANCH_ALREADY_EXISTS_REQUIRES_RECONCILIATION');
      } catch (e) {
        if (!(e instanceof Error) || !e.message.startsWith('GITHUB_API_404:')) throw e;
      }

      const treeEntries: Array<Record<string, unknown>> = [];
      for (const op of input.draft.operations) {
        const target = op.target.replace(/\\/g, '/');
        if (op.type === 'DELETE') { treeEntries.push({ path: target, mode: '100644', type: 'blob', sha: null }); continue; }
        const content = op.type === 'CREATE' || op.type === 'UPDATE' ? String(op.content ?? '') : await fs.readFile(path.join(input.workspaceRoot, target), 'utf8');
        const blob = await this.api.request<BlobResponse>('POST', apiPath(repo, '/git/blobs'), token, { content, encoding: 'utf-8' });
        treeEntries.push({ path: target, mode: '100644', type: 'blob', sha: blob.sha });
      }
      const tree = await this.api.request<TreeResponse>('POST', apiPath(repo, '/git/trees'), token, { base_tree: baseCommit.tree.sha, tree: treeEntries });
      const commit = await this.api.request<CommitResponse>('POST', apiPath(repo, '/git/commits'), token, { message: input.draft.title, tree: tree.sha, parents: [ref.object.sha] });
      await this.api.request('POST', apiPath(repo, '/git/refs'), token, { ref: `refs/heads/${input.draft.branchName}`, sha: commit.sha });
      const pull = await this.api.request<PullResponse>('POST', apiPath(repo, '/pulls'), token, { title: input.draft.title, head: input.draft.branchName, base: input.draft.baseBranch, body: `${input.draft.body}\n\n${reconciliationMarker(preview.patchHash)}`, draft: true });
      const auditHash = sha256({ ...base, patchHash: preview.patchHash, commitSha: commit.sha, pullRequestNumber: pull.number, pullRequestUrl: pull.html_url });
      const result: PullRequestResult = { status: 'CREATED', ...base, patchHash: preview.patchHash, commitSha: commit.sha, pullRequestNumber: pull.number, pullRequestUrl: pull.html_url, auditHash };
      this.ledger.complete(executionKey, result);
      return result;
    } catch (error) { const reason = error instanceof Error ? error.message : String(error); if (input.patchHash) { try { this.ledger.fail(prExecutionKey({ draftId: input.draft.draftId, provider: input.repository.provider, owner: input.repository.owner, repository: input.repository.name, patchHash: input.patchHash, baseBranch: input.draft.baseBranch, branchName: input.draft.branchName }), reason); } catch {} } return this.failed(base, reason); }
  }
  private blocked(base: any, reason: string): PullRequestResult { return { ...base, status: 'BLOCKED', auditHash: sha256({ ...base, status: 'BLOCKED', reason }), reason }; }
  private failed(base: any, reason: string): PullRequestResult { return { ...base, status: 'FAILED', auditHash: sha256({ ...base, status: 'FAILED', reason }), reason }; }
}
