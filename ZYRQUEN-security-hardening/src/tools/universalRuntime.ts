import {
  ContextBudget, ModelProfile, ModelRoute, ModelRoutingMode, ProjectContext, ResearchResult, UniversalToolDefinition, ToolRoute,
  UniversalAgent, UniversalCapability, UniversalContext, UniversalExecutionEvent, UniversalRun, UniversalTaskCategory, UniversalPermission,
  UniversalWorkflow, WorkflowNode, UniversalNodeStatus,
} from '../types';
import { toolOrchestrator } from './toolOrchestrator';
import { selectTeam } from './teamRuntime';

const iso = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function classifyUniversalTask(text: string): UniversalTaskCategory[] {
  const t = text.toLowerCase();
  const categories: UniversalTaskCategory[] = [];
  const add = (x: UniversalTaskCategory, test: RegExp) => { if (test.test(t)) categories.push(x); };
  add('RESEARCH', /วิจัย|ค้นคว้า|คู่แข่ง|ตลาด|research|compare sources/);
  add('BROWSER', /เปิดเว็บ|เว็บไซต์|browser|ตรวจเว็บ|scrape|url|เข้าเว็บ/);
  add('DOCUMENT', /เอกสาร|รายงาน|document|pdf|word|สรุปเป็นรายงาน/);
  add('DATA', /csv|excel|ข้อมูล|วิเคราะห์ไฟล์|data|spreadsheet/);
  add('IMAGE', /รูป|ภาพ|screenshot|image|vision|ดู screenshot/);
  add('AUDIO', /เสียง|ฟัง|audio|transcri|สรุปเสียง/);
  add('VIDEO', /วิดีโอ|video|คลิป/);
  add('AUTOMATION', /อัตโนมัติ|automation|schedule|workflow/);
  add('BUSINESS', /ธุรกิจ|ขาย|ร้าน|เปิดตัว|business|marketing/);
  add('DEBUG', /แก้บั๊ก|bug|error|พัง|debug/);
  add('REFACTOR', /refactor|ปรับโครงสร้าง|จัดระเบียบโค้ด/);
  add('CODE', /สร้างเว็บ|เขียนโค้ด|coding|โค้ด|component|หน้า|ปุ่ม|login/);
  add('PROJECT', /โปรเจกต์|project|สร้างเว็บ|production|release|พร้อมใช้งาน/);
  add('ANALYSIS', /วิเคราะห์|analysis|insight|ประเมิน/);
  add('AGENT', /ทีม ai|agent|ทีมทำงาน|จัดการให้/);
  if (!categories.length) categories.push(/prompt|prompt/i.test(t) ? 'PROMPT' : 'CHAT');
  if (categories.length > 1 && !categories.includes('MIXED')) categories.push('MIXED');
  return categories;
}

export function buildModelProfiles(configuredModel?: string): ModelProfile[] {
  if (!configuredModel || configuredModel.trim() === '') return [];
  return [{ id: configuredModel, provider: 'configured-provider', capabilities: ['CODING', 'REASONING' as UniversalCapability, 'PLANNING', 'ANALYSIS', 'REVIEW'], contextWindow: 128000, latencyClass: 'UNKNOWN', costClass: 'UNKNOWN', reasoningLevel: 'UNKNOWN', availability: 'AVAILABLE' }];
}

export function routeModel(mode: ModelRoutingMode, profiles: ModelProfile[], required?: UniversalCapability): ModelRoute {
  const eligible = profiles.filter((p) => p.availability === 'AVAILABLE' && (!required || p.capabilities.includes(required)));
  const selected = eligible[0] || null;
  return { mode, selected, status: selected ? 'SELECTED' : 'MODEL_UNAVAILABLE', reason: selected ? `เลือก configured model สำหรับ ${mode}` : `ไม่มี model ที่พร้อมใช้งานสำหรับ ${mode}${required ? ` / ${required}` : ''}`, alternatives: profiles.filter((p) => p !== selected) };
}

export function buildUniversalToolRegistry(): UniversalToolDefinition[] {
  return [
    { id: 'file-read', name: 'Read Files', category: 'FILE', description: 'อ่าน source files จาก ProjectContext', inputSchema: { files: 'string[]' }, outputSchema: { contents: 'object[]' }, permission: 'READ_ONLY', capabilities: ['CODING', 'DOCUMENT', 'DATA', 'ANALYSIS'], availability: 'AVAILABLE', source: 'EXISTING_ORCHESTRATOR' },
    { id: 'code-validation', name: 'Code Validation', category: 'VALIDATE', description: 'ตรวจ syntax/import/reference ด้วย existing Tool Orchestrator', inputSchema: { files: 'CodeFile[]' }, outputSchema: { validation: 'ValidationResult' }, permission: 'READ_ONLY', capabilities: ['CODING', 'REVIEW'], availability: 'AVAILABLE', source: 'EXISTING_ORCHESTRATOR' },
    { id: 'browser-qa', name: 'Browser QA', category: 'BROWSER', description: 'รัน V10 runtime probe เมื่อ browser พร้อม', inputSchema: { project: 'ProjectContext' }, outputSchema: { probe: 'RuntimeProbeResult' }, permission: 'READ_ONLY', capabilities: ['BROWSER', 'VISION', 'UI_UX'], availability: 'AVAILABLE', source: 'EXISTING_ORCHESTRATOR' },
    { id: 'security-audit', name: 'Security Audit', category: 'SECURITY', description: 'สแกน secret/config โดย mask findings', inputSchema: { files: 'CodeFile[]' }, outputSchema: { audit: 'SecurityAuditResult' }, permission: 'READ_ONLY', capabilities: ['SECURITY'], availability: 'AVAILABLE', source: 'EXISTING_ORCHESTRATOR' },
    { id: 'performance-audit', name: 'Performance Audit', category: 'PERFORMANCE', description: 'วัด source size และ metric ที่พร้อมใช้งาน', inputSchema: { project: 'ProjectContext' }, outputSchema: { audit: 'PerformanceAuditResult' }, permission: 'READ_ONLY', capabilities: ['PERFORMANCE', 'ANALYSIS'], availability: 'AVAILABLE', source: 'EXISTING_ORCHESTRATOR' },
    { id: 'team-runtime', name: 'Multi-Agent Team Runtime', category: 'PROJECT', description: 'เลือกและประสาน V11 team agents ด้วย shared state', inputSchema: { objective: 'string', project: 'ProjectContext' }, outputSchema: { team: 'TeamRunRecord' }, permission: 'REVIEW', capabilities: ['PLANNING', 'CODING', 'REVIEW', 'SECURITY', 'PERFORMANCE'], availability: 'AVAILABLE', source: 'RUNTIME' },
    { id: 'research-web', name: 'Web Research', category: 'SEARCH', description: 'ต้องมี research connector/tool ที่ app runtime เชื่อมต่อได้', inputSchema: { query: 'string' }, outputSchema: { findings: 'ResearchFinding[]' }, permission: 'EXTERNAL_ACTION', capabilities: ['RESEARCH'], availability: 'UNAVAILABLE', source: 'CONNECTOR' },
    { id: 'image-vision', name: 'Vision Analysis', category: 'VISION', description: 'ต้องมี configured vision-capable model/tool', inputSchema: { asset: 'string' }, outputSchema: { analysis: 'object' }, permission: 'READ_ONLY', capabilities: ['VISION'], availability: 'UNAVAILABLE', source: 'CONNECTOR' },
    { id: 'audio-transcription', name: 'Audio Transcription', category: 'AUDIO', description: 'ต้องมี audio connector/tool ใน app runtime', inputSchema: { asset: 'string' }, outputSchema: { text: 'string' }, permission: 'READ_ONLY', capabilities: ['AUDIO'], availability: 'UNAVAILABLE', source: 'CONNECTOR' },
    { id: 'video-analysis', name: 'Video Analysis', category: 'VIDEO', description: 'ต้องมี video analysis connector/tool ใน app runtime', inputSchema: { asset: 'string' }, outputSchema: { findings: 'object' }, permission: 'READ_ONLY', capabilities: ['VIDEO'], availability: 'UNAVAILABLE', source: 'CONNECTOR' },
  ];
}

export function discoverTools(query: string, registry = buildUniversalToolRegistry()): ToolRoute {
  const q = query.toLowerCase();
  const tools = registry.filter((tool) => [tool.name, tool.category, tool.description, ...tool.capabilities].join(' ').toLowerCase().includes(q) || (q.includes('web') && tool.category === 'SEARCH') || (q.includes('data') && tool.category === 'DATA'));
  return { query, tools, status: tools.some((t) => t.availability === 'AVAILABLE') ? 'AVAILABLE' : 'TOOL_UNAVAILABLE' };
}

function relevance(file: { name: string; content: string }, objective: string): number {
  const words = objective.toLowerCase().split(/\s+/).filter(Boolean);
  const hay = `${file.name} ${file.content.slice(0, 3000)}`.toLowerCase();
  return words.reduce((score, word) => score + (hay.includes(word) ? 1 : 0), 0) + (file.name.endsWith('.html') ? 0.2 : 0);
}

export function assembleUniversalContext(objective: string, context: ProjectContext, maxTokens = 12000): UniversalContext {
  const ranked = context.files.map((f) => ({ name: f.name, content: f.content, relevance: relevance(f, objective) })).sort((a, b) => b.relevance - a.relevance);
  const maxChars = maxTokens * 4;
  let used = 0;
  const files = ranked.filter((f) => { const size = f.content.length; if (used + size > maxChars) return false; used += size; return true; });
  const omitted = ranked.filter((f) => !files.includes(f)).map((f) => f.name);
  return { objective, currentTask: context.currentTask || context.currentGoal || '', files, rules: (context.rules || []).map((r: any) => r.rule || r.description || String(r)), architecture: (context.decisions || []).map((d: any) => d.decision || String(d)), memory: ((context as any).memory || []).slice(0, 20).map((m: any) => typeof m === 'string' ? m : m.content || m.summary || ''), knowledge: (context.knowledgeBase || []).slice(0, 20).map((k: any) => typeof k === 'string' ? k : k.title || k.summary || ''), history: [], budget: { maxTokens, usedTokens: Math.ceil(used / 4), priorityItems: files.map((f) => f.name), compressedItems: omitted.length ? [`${omitted.length} lower relevance files omitted`] : [], omittedItems: omitted } };
}

function node(idValue: string, type: WorkflowNode['type'], title: string, dependencies: string[], agentIds: string[] = [], toolIds: string[] = []): WorkflowNode { return { id: idValue, type, title, dependencies, status: 'PENDING', agentIds, toolIds, evidence: [] }; }

export function createUniversalWorkflow(objective: string, context: ProjectContext, model?: string): UniversalWorkflow {
  const categories = classifyUniversalTask(objective);
  const roles = selectTeam(objective, context);
  const agents: UniversalAgent[] = roles.map((role) => ({ id: `universal-${role.toLowerCase()}`, name: role, role, capabilities: role === 'LEAD' ? ['PLANNING', 'ANALYSIS', 'REVIEW'] : role === 'QA_BROWSER' ? ['BROWSER', 'VISION', 'UI_UX'] : role === 'SECURITY' ? ['SECURITY'] : role === 'PERFORMANCE' ? ['PERFORMANCE', 'ANALYSIS'] : role === 'UI_UX' ? ['UI_UX', 'VISION'] : ['CODING', 'PLANNING'], tools: [], modelPolicy: ['REASONING', 'CODING'], memoryPolicy: ['PROJECT', 'TASK', 'KNOWLEDGE'], permissionLevel: role === 'RELEASE' ? 'REVIEW' : 'READ_ONLY', status: 'READY', contextBudget: { maxTokens: 12000, usedTokens: 0, priorityItems: [], compressedItems: [], omittedItems: [] }, maxRetries: 2 }));
  const n: WorkflowNode[] = [node('understand', 'UNDERSTAND', 'Understand objective', []), node('classify', 'CLASSIFY', 'Classify task categories', ['understand']), node('plan', 'PLAN', 'Create plan and select agents/tools', ['classify'], ['universal-lead']), ...categories.includes('RESEARCH') ? [node('research', 'RESEARCH', 'Research / collect cited evidence', ['plan'], ['universal-lead'], ['research-web'])] : [], node('execute', 'EXECUTE', 'Execute selected V11 agents/tools', [categories.includes('RESEARCH') ? 'research' : 'plan'], agents.filter((a) => a.role !== 'LEAD').map((a) => a.id), ['team-runtime']), node('verify', 'VERIFY', 'Verify with existing validators and QA', ['execute'], [], ['code-validation', 'browser-qa']), node('review', 'REVIEW', 'Review evidence and risks', ['verify'], ['universal-reviewer']), node('deliver', 'DELIVER', 'Prepare user-controlled delivery', ['review']), node('end', 'END', 'End mission', ['deliver'])];
  const edges = n.flatMap((x) => x.dependencies.map((d) => ({ from: d, to: x.id })));
  return { id: id('workflow'), name: 'Universal Mission Workflow', objective, categories, nodes: n, edges, state: 'PLANNING', agents, tools: buildUniversalToolRegistry(), evidence: [], createdAt: iso(), updatedAt: iso() };
}

export function createUniversalRun(objective: string, context: ProjectContext, model?: string): UniversalRun {
  const workflow = createUniversalWorkflow(objective, context, model);
  workflow.state = 'RUNNING';
  workflow.nodes = workflow.nodes.map((n) => n.id === 'understand' || n.id === 'classify' || n.id === 'plan'
    ? { ...n, status: 'SUCCESS', evidence: ['executed by Universal Lead'] }
    : n.id === 'research' && classifyUniversalTask(objective).includes('RESEARCH')
      ? { ...n, status: 'UNAVAILABLE', evidence: ['RESEARCH_UNAVAILABLE until a research connector is configured'] }
      : { ...n, status: 'READY' });
  const universalContext = assembleUniversalContext(objective, context);
  const profiles = buildModelProfiles(model);
  const modes: ModelRoutingMode[] = ['REASONING', ...(workflow.categories.includes('RESEARCH') ? ['RESEARCH' as ModelRoutingMode] : []), ...(workflow.categories.includes('CODE') || workflow.categories.includes('PROJECT') ? ['CODING' as ModelRoutingMode] : [])];
  const modelRoutes = modes.map((mode) => routeModel(mode, profiles, mode === 'RESEARCH' ? 'RESEARCH' : mode === 'CODING' ? 'CODING' : 'PLANNING'));
  const toolRoutes = workflow.categories.map((category) => discoverTools(category.toLowerCase()));
  const events: UniversalExecutionEvent[] = [
    { id: id('event'), timestamp: iso(), agent: 'LEAD', action: 'UNDERSTAND', inputSummary: objective, outputSummary: 'objective captured', status: 'SUCCESS', evidence: ['user objective'] },
    { id: id('event'), timestamp: iso(), agent: 'LEAD', action: 'CLASSIFY', outputSummary: workflow.categories.join(' + '), status: 'SUCCESS', evidence: ['regex classifier with multi-category output'] },
    { id: id('event'), timestamp: iso(), agent: 'LEAD', action: 'CONTEXT_ASSEMBLY', outputSummary: `${universalContext.budget.usedTokens} tokens; omitted ${universalContext.budget.omittedItems.length} files`, status: 'SUCCESS', evidence: ['priority-ranked context budget'] },
  ];
  const unavailableModels = modelRoutes.filter((r) => r.status === 'MODEL_UNAVAILABLE');
  const unavailableTools = toolRoutes.filter((r) => r.status === 'TOOL_UNAVAILABLE');
  const researchNeeded = workflow.categories.includes('RESEARCH');
  const research: ResearchResult | undefined = researchNeeded ? { status: 'RESEARCH_UNAVAILABLE', query: objective, findings: [], conflicts: [], toolsUsed: [], message: 'RESEARCH_UNAVAILABLE: ไม่มี research connector/tool ที่พร้อมใช้งานใน app runtime นี้; ไม่ได้สร้างแหล่งอ้างอิงขึ้นเอง' } : undefined;
  return { workflow, context: universalContext, modelRoutes, toolRoutes, events, research, improvementProposals: [], reality: [
    { capability: 'Universal Agent Runtime', reality: 'REAL', evidence: 'UniversalRun and workflow layer execute classification, routing, context assembly, and orchestration metadata' },
    { capability: 'Task Classification', reality: 'REAL', evidence: `classified ${workflow.categories.length} categories` },
    { capability: 'Model Router', reality: profiles.length ? 'PARTIAL' : 'UNAVAILABLE', evidence: profiles.length ? 'configured model profile only; provider catalog is not queried' : 'MODEL_UNAVAILABLE: no configured model supplied' },
    { capability: 'Multi-Model Routing', reality: profiles.length > 1 ? 'REAL' : 'PARTIAL', evidence: `${modelRoutes.length} routes; ${unavailableModels.length} unavailable` },
    { capability: 'Tool Registry', reality: 'REAL', evidence: `${workflow.tools.length} structured tool definitions, existing orchestrator reused` },
    { capability: 'Tool Discovery', reality: 'REAL', evidence: `${toolRoutes.length} category queries evaluated` },
    { capability: 'Workflow Engine', reality: 'REAL', evidence: `${workflow.nodes.length} dependency-aware nodes generated` },
    { capability: 'Research', reality: researchNeeded ? 'UNAVAILABLE' : 'PARTIAL', evidence: research?.message || 'not required for this objective' },
    { capability: 'Context Engine', reality: 'REAL', evidence: `${universalContext.budget.usedTokens}/${universalContext.budget.maxTokens} token budget; priority ranking applied` },
    { capability: 'Multimodal', reality: workflow.categories.some((c) => ['IMAGE', 'AUDIO', 'VIDEO'].includes(c)) ? 'UNAVAILABLE' : 'PARTIAL', evidence: `${unavailableTools.length} unavailable tool routes; no fabricated execution` },
    { capability: 'V11 Integration', reality: 'REAL', evidence: `selected existing team roles: ${rolesLabel(workflow.agents)}` },
    { capability: 'V10 Release Integration', reality: workflow.categories.includes('PROJECT') ? 'REAL' : 'PARTIAL', evidence: 'existing V10 Release Agent remains the release authority' },
  ] };
}

function rolesLabel(agents: UniversalAgent[]) { return agents.map((a) => a.role).join(', '); }

export function improveFromRun(run: UniversalRun) {
  const proposals = [] as UniversalRun['improvementProposals'];
  const unavailable = run.reality.filter((r) => r.reality === 'UNAVAILABLE');
  if (unavailable.length) proposals.push({ id: id('proposal'), problem: `${unavailable.length} capabilities unavailable`, evidence: unavailable.map((x) => `${x.capability}: ${x.evidence}`), proposedChange: 'Connect and validate the required provider/tool before enabling the route', expectedBenefit: 'Enable evidence-backed execution instead of unavailable status', risk: 'MEDIUM', affectedSystems: unavailable.map((x) => x.capability), status: 'PROPOSED' });
  return proposals;
}

export type UniversalFailureType = 'NETWORK' | 'TOOL' | 'MODEL' | 'CODE' | 'VALIDATION' | 'PERMISSION' | 'TIMEOUT' | 'CONTEXT' | 'RESOURCE' | 'UNKNOWN';
export interface UniversalRecoveryResult { recovered: boolean; failureType: UniversalFailureType; attempts: number; status: 'RECOVERED' | 'BLOCKED'; evidence: string[]; nextAction: string; }

export function classifyUniversalFailure(error: unknown): UniversalFailureType {
  const text = String(error instanceof Error ? error.message : error).toLowerCase();
  if (/permission|denied|forbidden/.test(text)) return 'PERMISSION';
  if (/timeout|timed out/.test(text)) return 'TIMEOUT';
  if (/model|provider|llm/.test(text)) return 'MODEL';
  if (/tool|connector/.test(text)) return 'TOOL';
  if (/network|fetch|connection/.test(text)) return 'NETWORK';
  if (/context|token|length/.test(text)) return 'CONTEXT';
  if (/validation|syntax|compile/.test(text)) return 'VALIDATION';
  return 'UNKNOWN';
}

export function recoverUniversalFailure(error: unknown, maxRetries = 2): UniversalRecoveryResult {
  const failureType = classifyUniversalFailure(error);
  const retryable = !['PERMISSION', 'CONTEXT'].includes(failureType);
  const attempts = retryable ? Math.max(1, maxRetries) : 0;
  return {
    recovered: false,
    failureType,
    attempts,
    status: 'BLOCKED',
    evidence: [`${failureType}: ${String(error)}`, retryable ? `retry policy allows ${attempts} attempt(s); no retry was fabricated` : 'policy blocks automatic retry for this failure type'],
    nextAction: failureType === 'PERMISSION' ? 'REQUEST_APPROVAL' : failureType === 'CONTEXT' ? 'COMPRESS_CONTEXT_OR_RETRIEVE_RELEVANT_FILES' : 'RETRY_WITH_ALTERNATIVE_TOOL_OR_AGENT',
  };
}

export function canExecuteUniversalTool(tool: UniversalToolDefinition, requested: UniversalPermission): { allowed: boolean; error?: 'PERMISSION_DENIED'; reason: string } {
  const order: UniversalPermission[] = ['READ_ONLY', 'SAFE', 'WRITE', 'REVIEW', 'EXTERNAL_ACTION', 'DANGEROUS', 'DESTRUCTIVE'];
  const toolIndex = order.indexOf(tool.permission);
  const requestedIndex = order.indexOf(requested);
  if (tool.permission === 'UNAVAILABLE' as any || tool.availability === 'UNAVAILABLE') return { allowed: false, error: 'PERMISSION_DENIED', reason: 'TOOL_UNAVAILABLE' };
  if (toolIndex >= order.indexOf('EXTERNAL_ACTION') || requestedIndex >= order.indexOf('EXTERNAL_ACTION')) return { allowed: false, error: 'PERMISSION_DENIED', reason: 'EXTERNAL_ACTION_REQUIRES_APPROVAL' };
  return { allowed: requestedIndex >= toolIndex, reason: requestedIndex >= toolIndex ? 'permission level satisfied' : 'requested permission is below tool requirement' };
}

export function replayUniversalRun(run: UniversalRun): UniversalExecutionEvent[] {
  return run.events.filter((event) => !/external|destructive|publish|delete|purchase/i.test(`${event.action} ${event.tool || ''}`)).map((event) => ({ ...event, outputSummary: `[REPLAY] ${event.outputSummary || ''}` }));
}

const UNIVERSAL_RUN_STORAGE_KEY = 'codevoice-ai:v12:universal-run';
export function persistUniversalRun(run: UniversalRun | null): void {
  if (typeof localStorage === 'undefined') return;
  try { if (run) localStorage.setItem(UNIVERSAL_RUN_STORAGE_KEY, JSON.stringify(run)); else localStorage.removeItem(UNIVERSAL_RUN_STORAGE_KEY); } catch { /* storage quota/private mode: runtime continues with in-memory state */ }
}
export function restoreUniversalRun(): UniversalRun | null {
  if (typeof localStorage === 'undefined') return null;
  try { const raw = localStorage.getItem(UNIVERSAL_RUN_STORAGE_KEY); return raw ? JSON.parse(raw) as UniversalRun : null; } catch { return null; }
}
