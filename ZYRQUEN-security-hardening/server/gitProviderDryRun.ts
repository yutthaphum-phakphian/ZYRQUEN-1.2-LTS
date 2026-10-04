import path from 'node:path';
import { previewDeveloperPatch, type DeveloperPatchPreview } from './developerPatchEngine.ts';
import type { SelfHealingDraft } from './selfHealingLoop.ts';

export type GitProviderId = 'github' | 'gitlab' | 'generic';
export type GitDryRunStatus = 'READY' | 'BLOCKED';

export interface GitRepositoryRef {
  owner: string;
  name: string;
  provider: GitProviderId;
}

export interface GitBranchDiffPreview {
  status: GitDryRunStatus;
  mode: 'DRY_RUN';
  provider: GitRepositoryRef;
  baseBranch: string;
  proposedBranch: string;
  patchId?: string;
  patchHash?: string;
  changedFiles: Array<{ target: string; type: string; beforeHash?: string; afterHash?: string; diff: string }>;
  unifiedDiff: string;
  pullRequest: {
    title: string;
    body: string;
    draft: true;
    labels: string[];
  };
  branchCreated: false;
  pushRequested: false;
  pullRequestCreated: false;
  reason?: string;
}

export interface GitProvider {
  readonly id: GitProviderId;
  previewBranch(input: { workspaceRoot: string; draft: SelfHealingDraft; repository: GitRepositoryRef }): Promise<GitBranchDiffPreview>;
  createBranch(): Promise<never>;
  createPullRequest(): Promise<never>;
}

const safePart = (value: string, field: string) => {
  const normalized = String(value || '').trim();
  if (!normalized || normalized.length > 120 || !/^[A-Za-z0-9._-]+$/.test(normalized)) throw new Error(`INVALID_GIT_${field.toUpperCase()}`);
  return normalized;
};

const safeBranch = (value: string) => {
  const normalized = String(value || '').trim();
  if (!normalized || normalized.length > 160 || normalized.startsWith('/') || normalized.includes('..') || !/^[A-Za-z0-9._/-]+$/.test(normalized)) throw new Error('INVALID_GIT_BRANCH');
  return normalized;
};

const emptyPreview = (repository: GitRepositoryRef, draft: SelfHealingDraft, reason: string): GitBranchDiffPreview => ({
  status: 'BLOCKED',
  mode: 'DRY_RUN',
  provider: repository,
  baseBranch: draft.baseBranch,
  proposedBranch: draft.branchName,
  changedFiles: [],
  unifiedDiff: '',
  pullRequest: { title: draft.title, body: draft.body, draft: true, labels: ['auto-heal', 'dry-run'] },
  branchCreated: false,
  pushRequested: false,
  pullRequestCreated: false,
  reason,
});

export class DryRunGitProvider implements GitProvider {
  readonly id: GitProviderId;

  constructor(id: GitProviderId = 'generic') {
    this.id = id;
  }

  async previewBranch(input: { workspaceRoot: string; draft: SelfHealingDraft; repository: GitRepositoryRef }): Promise<GitBranchDiffPreview> {
    const repository = { ...input.repository, owner: safePart(input.repository.owner, 'owner'), name: safePart(input.repository.name, 'repository') };
    const draft = input.draft;
    safeBranch(draft.baseBranch);
    safeBranch(draft.branchName);
    if (draft.status !== 'DRAFT_READY') return emptyPreview(repository, draft, 'DRAFT_NOT_READY');
    if (!path.isAbsolute(input.workspaceRoot)) return emptyPreview(repository, draft, 'WORKSPACE_ROOT_MUST_BE_ABSOLUTE');
    try {
      const patch = await previewDeveloperPatch({ workspaceRoot: input.workspaceRoot, operations: draft.operations, sourcePlanId: draft.draftId });
      return this.fromPatch(repository, draft, patch);
    } catch (error) {
      return emptyPreview(repository, draft, error instanceof Error ? error.message : String(error));
    }
  }

  async createBranch(): Promise<never> {
    throw new Error('DRY_RUN_ONLY_BRANCH_CREATION_DISABLED');
  }

  async createPullRequest(): Promise<never> {
    throw new Error('DRY_RUN_ONLY_PULL_REQUEST_DISABLED');
  }

  private fromPatch(repository: GitRepositoryRef, draft: SelfHealingDraft, patch: DeveloperPatchPreview): GitBranchDiffPreview {
    const changedFiles = patch.files.filter(file => file.changed).map(file => ({ target: file.target, type: file.type, beforeHash: file.beforeHash, afterHash: file.afterHash, diff: file.diff }));
    return {
      status: changedFiles.length ? 'READY' : 'BLOCKED',
      mode: 'DRY_RUN',
      provider: repository,
      baseBranch: draft.baseBranch,
      proposedBranch: draft.branchName,
      patchId: patch.patchId,
      patchHash: patch.patchHash,
      changedFiles,
      unifiedDiff: changedFiles.map(file => file.diff).join('\n\n'),
      pullRequest: { title: draft.title, body: draft.body, draft: true, labels: ['auto-heal', 'dry-run'] },
      branchCreated: false,
      pushRequested: false,
      pullRequestCreated: false,
    };
  }
}

export const dryRunGitProvider = new DryRunGitProvider();
