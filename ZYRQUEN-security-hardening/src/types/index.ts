export type AppMode = 'all' | 'voice' | 'coding' | 'prompt' | 'debug';
export type MainAgentMode = 'CHAT' | 'CODE' | 'AGENT';

export type TaskClassification = 
  | 'CHAT'
  | 'PROMPT'
  | 'CODE'
  | 'DEBUG'
  | 'REFACTOR'
  | 'PROJECT'
  | 'RESEARCH'
  | 'EXPLAIN'
  | 'AGENT';

export type IntentType = 
  | 'CHAT'
  | 'PROMPT'
  | 'CODE'
  | 'DEBUG'
  | 'EXPLAIN'
  | 'MODIFY'
  | 'PROJECT'
  | 'AGENT'
  | 'VOICE_COMMAND';

export type AssistantState = 
  | 'READY'
  | 'LISTENING'
  | 'THINKING'
  | 'GENERATING'
  | 'SPEAKING'
  | 'ERROR';

export type AgentRuntimeState = 
  | 'IDLE'
  | 'UNDERSTANDING'
  | 'PLANNING'
  | 'WAITING_CONFIRMATION'
  | 'EXECUTING'
  | 'VALIDATING'
  | 'FIXING'
  | 'WAITING_USER'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'PAUSED';

export type ToolPermissionLevel = 'SAFE' | 'REVIEW' | 'DANGEROUS';

export interface ToolDefinition {
  name: string;
  description: string;
  permissionLevel: ToolPermissionLevel;
  inputSchema?: any;
  outputSchema?: any;
}

export interface ToolResult<T = any> {
  success: boolean;
  tool: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  } | string | null;
  metadata?: {
    durationMs?: number;
    timestamp?: string;
    affectedFile?: string;
  };
}

export interface CodeFile {
  name: string;
  language: string;
  content: string;
  description?: string;
  action?: 'create' | 'update' | 'inspect' | 'delete';
}

export interface AgentStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  detail?: string;
  tool?: string;
}

export interface AgentPlan {
  goal: string;
  steps: AgentStep[];
  affectedFiles: string[];
  toolsRequired?: string[];
  permissionLevel: 'SAFE' | 'REVIEW' | 'DANGEROUS';
  requiresConfirmation: boolean;
}

export interface FileChangeDiff {
  fileName: string;
  action: 'create' | 'update' | 'delete' | 'rename';
  oldContent?: string;
  newContent: string;
  language: string;
  status: 'pending' | 'applied' | 'rejected';
  description?: string;
}

export interface AgentActivityLog {
  id: string;
  time: string;
  message: string;
  tool?: string;
  type: 'info' | 'tool' | 'validation' | 'error' | 'success' | 'build' | 'snapshot';
  status?: 'running' | 'success' | 'failed' | 'cancelled';
  details?: string;
  durationMs?: number;
}

export interface ParsedBuildError {
  error: string;
  file?: string;
  line?: number;
  column?: number;
  likelyCause?: string;
  suggestedFix?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  attemptCount: number;
  parsedErrors?: ParsedBuildError[];
  buildPassed?: boolean;
}

export interface ProjectSnapshot {
  id: string;
  timestamp: string;
  label: string;
  files: CodeFile[];
  projectMetadata: {
    projectName: string;
    framework: string;
    description: string;
  };
  agentTask?: string;
}

export interface PromptObject {
  title: string;
  role: string;
  context: string;
  goal: string;
  requirements: string[];
  constraints: string[];
  input?: string;
  expectedOutput: string;
  qualityCriteria: string[];
  fullPromptText: string;
  recommendedModels?: string[];
}

export interface DebugObject {
  errorMessage?: string;
  rootCause: string;
  possibleCauses?: string[];
  fixExplanation: string;
  preventionTip?: string;
  modifiedFiles?: CodeFile[];
}

export interface ProjectRule {
  id: string;
  text: string;
  active: boolean;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  type: 'doc' | 'readme' | 'api' | 'guideline' | 'note';
  source?: string;
  addedAt: string;
}

export interface UserPreferences {
  preferredLanguage: string;
  preferredFramework: string;
  preferredStyle: string;
  responseDetail: 'concise' | 'balanced' | 'comprehensive';
  theme: 'dark' | 'light';
  voicePersona: 'Puck' | 'Kore' | 'Zephyr' | 'Fenrir';
  autoSpeak: boolean;
  continuousVoice: boolean;
}

export type TaskStatus = 
  | 'TODO'
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'PAUSED'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface ProjectTask {
  id: string; // taskId
  taskId?: string; // alias
  title: string;
  description: string;
  status: TaskStatus;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dependencies?: string[]; // array of prerequisite taskIds
  blockedReason?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  filesChanged?: string[];
  toolsUsed?: string[];
  validationResult?: ValidationResult;
  errors?: string[];
  decisions?: string[];
  pendingActions?: string[];
  order: number;
}

export interface ArchitectureDecision {
  id: string;
  decision: string;
  reason: string;
  category?: 'stack' | 'style' | 'state' | 'api' | 'security' | 'convention';
  affectedFiles?: string[];
  createdAt: string;
  status?: 'active' | 'superseded';
  supersededBy?: string;
}

export interface FixStrategy {
  id: string;
  title: string;
  problemPattern: string;
  errorType: string;
  rootCause: string;
  solutionStrategy: string;
  codeDiffSnippet?: string;
  affectedFiles: string[];
  successRate: number;
  appliedCount: number;
  tags: string[];
  createdAt: string;
  lastAppliedAt?: string;
}

export interface EngineeringKnowledgeEntry {
  id: string;
  type: string;
  title: string;
  summary: string;
  context: string;
  solution: string;
  tags: string[];
  confidenceScore: number;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  problemPattern?: string;
  fixStrategy?: FixStrategy;
  decision?: ArchitectureDecision;
}

export interface KnowledgeQuery {
  query?: string;
  error?: string;
  tags?: string[];
  limit?: number;
}

export interface KnowledgeQueryResult {
  matchedEntries: EngineeringKnowledgeEntry[];
  recommendedStrategy?: FixStrategy;
  reasoningContext: string;
  confidence: number;
}

export interface RuleConflictRecord {
  id: string;
  ruleId: string;
  previous: string;
  current: string;
  timestamp: string;
}

export interface ChangeImpact {
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  affectedComponents: string[];
  affectedRoutes?: string[];
  affectedFiles: string[];
  dependentCallers?: string[];
  requiresConfirmation: boolean;
  reason: string;
}

// ==================== V9 BROWSER AGENT & VISUAL QA TYPES ====================

export type BrowserActionType = 
  | 'openPage'
  | 'click'
  | 'type'
  | 'select'
  | 'scroll'
  | 'hover'
  | 'pressKey'
  | 'goBack'
  | 'goForward'
  | 'refresh'
  | 'waitForElement'
  | 'getText'
  | 'getElement'
  | 'takeScreenshot'
  | 'assert';

export interface BrowserAction {
  id: string;
  action: BrowserActionType;
  target?: string; // selector, text, role, label, or test-id
  value?: string; // input value
  expected?: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  actualResult?: string;
  error?: string;
  screenshot?: string;
  durationMs?: number;
}

export interface BrowserConsoleLog {
  message: string;
  source?: string;
  line?: number;
  timestamp: string;
  type: 'error' | 'warn' | 'info';
}

export interface BrowserNetworkLog {
  url: string;
  status: number;
  method?: string;
  message?: string;
  timestamp: string;
}

export interface BrowserState {
  currentUrl: string;
  pageTitle: string;
  viewport: {
    width: number;
    height: number;
    name: 'mobile' | 'tablet' | 'desktop';
  };
  selectedElement?: string;
  lastAction?: string;
  consoleErrors: BrowserConsoleLog[];
  networkErrors: BrowserNetworkLog[];
  pageState: 'loading' | 'ready' | 'interactive' | 'error';
  screenshot?: string;
}

export interface VisualIssue {
  id: string;
  type: 'overflow' | 'clipping' | 'overlap' | 'touch_target' | 'contrast' | 'missing_label' | 'responsive' | 'console_error';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  elementSelector?: string;
  description: string;
  screenshot?: string;
  suggestedFix?: string;
  affectedFile?: string;
}

export interface VisualQAResult {
  passed: boolean;
  viewport: 'mobile' | 'tablet' | 'desktop';
  dimensions: { width: number; height: number };
  issues: VisualIssue[];
  hasHorizontalOverflow: boolean;
  hasConsoleErrors: boolean;
  touchTargetFailuresCount: number;
  score: number; // 0 - 100
  testedAt: string;
}

export interface UserFlowStep {
  stepId: string;
  action: BrowserActionType;
  target: string;
  value?: string;
  expected?: string;
  expectedResult: string;
  actualResult?: string;
  status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'SKIPPED';
  screenshot?: string;
  errorMessage?: string;
  durationMs?: number;
}

export interface UserFlowTest {
  id: string;
  name: string;
  description: string;
  category: 'cart' | 'auth' | 'checkout' | 'navigation' | 'responsive' | 'custom';
  steps: UserFlowStep[];
  status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED';
  durationMs?: number;
  createdAt: string;
  autoFixAttempts?: number;
  fixedFiles?: string[];
  errorSummary?: string;
}

export interface BugReport {
  id: string;
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  route: string;
  viewport: string;
  stepsToReproduce: string[];
  expected: string;
  actual: string;
  evidence?: string;
  possibleCause: string;
  affectedFiles: string[];
  fixStatus: 'identified' | 'fixing' | 'resolved' | 'reopened';
}

export interface TestReport {
  id: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  autoFixedCount: number;
  visualQAPassed: boolean;
  visualIssuesCount: number;
  consoleErrorsCount: number;
  tests: UserFlowTest[];
  visualResults: VisualQAResult[];
  bugReports: BugReport[];
  generatedAt: string;
}

export interface ProjectHandoff {
  projectName: string;
  category: string;
  framework: string;
  currentGoal: string;
  completed: string[];
  inProgress: string[];
  blocked: Array<{ title: string; reason: string }>;
  knownIssues: string[];
  architecture: string[];
  importantDecisions: Array<{ decision: string; reason: string }>;
  nextRecommendedActions: string[];
  generatedAt: string;
}

export interface ProjectBrainState {
  identity: {
    name: string;
    category: string;
    description: string;
    framework: string;
  };
  tasks: ProjectTask[];
  activeTaskId?: string;
  taskQueue: string[]; // ordered taskIds
  decisions: ArchitectureDecision[];
  rules: ProjectRule[];
  ruleConflictHistory: RuleConflictRecord[];
  knowledgeBase: KnowledgeItem[];
  knownIssues: string[];
  recentChanges: string[];
  lastSessionTimestamp: string;
  pendingRecoveryState?: {
    hasIncompleteWork: boolean;
    task?: ProjectTask;
    lastError?: string;
    pendingDiffs?: FileChangeDiff[];
  };
}

export interface ProjectContext {
  id?: string;
  projectId?: string;
  projectName?: string;
  name?: string; // alias
  category?: 'Web App' | 'Landing Page' | 'Portfolio' | 'Dashboard' | 'E-commerce' | 'API' | 'Custom';
  description: string;
  language?: string;
  framework: string;
  architecture?: string;
  files: CodeFile[];
  features?: string[];
  completedFeatures?: string[]; // alias
  dependencies?: string[];
  currentTask?: string;
  currentGoal?: string;
  conversationSummary?: string;
  activeIssues?: string;
  lastUpdated?: string;
  // V4, V5, V6, V7, V8 Extensions
  rules?: ProjectRule[];
  ruleConflictHistory?: RuleConflictRecord[];
  knowledgeBase?: KnowledgeItem[];
  knownIssues?: string[];
  recentChanges?: string[];
  projectSummary?: string;
  lastAction?: string;
  currentPlan?: AgentPlan;
  completedSteps?: string[];
  pendingSteps?: string[];
  snapshots?: ProjectSnapshot[];
  // V8 Project Brain & Multi-Task Memory
  tasks?: ProjectTask[];
  activeTaskId?: string;
  taskQueue?: string[];
  decisions?: ArchitectureDecision[];
  impactAnalysis?: ChangeImpact;
  handoffSummary?: ProjectHandoff;
  // V9 Browser Agent & Visual QA
  testReport?: TestReport;
  browserState?: BrowserState;
  // V10 Production Release Agent
  releaseRun?: ReleaseRun;
  releaseSnapshots?: ReleaseSnapshot[];
  releaseVersion?: string;
  runtimeProbe?: RuntimeProbeResult;
  changelog?: ChangelogEntry[];
  releaseHistory?: ReleaseHistoryEntry[];
}

export interface SavedProject {
  id: string;
  name: string;
  projectName?: string;
  category: string;
  description: string;
  framework: string;
  updatedAt: string;
  files: CodeFile[];
  features: string[];
  rules: ProjectRule[];
  knowledgeBase: KnowledgeItem[];
}

export interface ModelRoutingInfo {
  taskType: TaskClassification;
  selectedModel: string;
  routeReason: string;
  knowledgeSourcesUsed?: string[];
  toolsSelected?: string[];
}

export interface DevMetadata {
  model: string;
  latencyMs: number;
  apiStatus: 'healthy' | 'error';
  timestamp: string;
  promptTokensEstimate?: number;
  intent?: IntentType;
  routingInfo?: ModelRoutingInfo;
  toolCallsCount?: number;
  runtimeState?: AgentRuntimeState;
}

export interface ApiLogRecord {
  id: string;
  timestamp: string;
  endpoint: string;
  requestPayload: any;
  responsePayload: any;
  latencyMs: number;
  status: 'success' | 'error';
  errorDetails?: string;
  model: string;
  intent?: IntentType;
  toolResults?: ToolResult[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  timestamp: string;
  isVoiceInput?: boolean;
  content: string;
  displayResponse?: string;
  voiceResponse?: string;
  voiceSummary?: string; // alias
  summaryText?: string; // alias
  intent?: IntentType;
  type?: string;
  status?: 'success' | 'error';
  files?: CodeFile[];
  diffs?: FileChangeDiff[];
  plan?: AgentPlan;
  steps?: AgentStep[];
  activityLogs?: AgentActivityLog[];
  validation?: ValidationResult;
  prompt?: PromptObject;
  promptData?: any;
  debug?: DebugObject;
  debugData?: any;
  citations?: string[];
  nextAction?: string;
  audioBase64?: string;
  devMetadata?: DevMetadata;
  toolResults?: ToolResult[];
}

export interface AppSettings {
  model: string;
  temperature: number;
  maxOutputTokens: number;
  voiceEnabled: boolean;
  autoSpeak: boolean;
  continuousVoice: boolean;
  language: 'th-TH' | 'en-US';
  developerMode: boolean;
  voicePersona: 'Puck' | 'Kore' | 'Zephyr' | 'Fenrir';
  agentAutoApplySafeChanges?: boolean;
  maxSelfHealingAttempts?: number;
  responseDetail?: 'concise' | 'balanced' | 'comprehensive';
}

// ==================== V10 PRODUCTION RELEASE AGENT TYPES ====================

/**
 * Honest capability classification. NEVER report REAL unless the implementation
 * actually executed and produced verifiable evidence in this run.
 */
export type CapabilityReality = 'REAL' | 'PARTIAL' | 'UNAVAILABLE' | 'MOCK';

export type ReleaseStageId =
  | 'UNDERSTAND'
  | 'ANALYZE'
  | 'PLAN'
  | 'CODE'
  | 'VALIDATE'
  | 'BROWSER_QA'
  | 'VISUAL_QA'
  | 'SECURITY_AUDIT'
  | 'PERFORMANCE_AUDIT'
  | 'PRODUCTION_BUILD'
  | 'RELEASE_CHECK'
  | 'EXPORT'
  | 'SUMMARY';

/** PASS is only ever assigned after an actual verification produced evidence. */
export type StageStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'PASS'
  | 'WARN'
  | 'FAIL'
  | 'SKIPPED'
  | 'BLOCKED'
  | 'UNAVAILABLE';

export interface ReleaseEvidence {
  label: string;
  value: string;
  detail?: string;
}

export interface ReleaseStageResult {
  id: ReleaseStageId;
  name: string;
  description: string;
  status: StageStatus;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  evidence: ReleaseEvidence[];
  messages: string[];
  /** How trustworthy this stage result is. */
  capability: CapabilityReality;
}

export type SecurityFindingCategory =
  | 'api_key'
  | 'token'
  | 'password'
  | 'private_key'
  | 'committed_credentials'
  | 'unsafe_environment_usage'
  | 'insecure_configuration'
  | 'client_side_secret';

export interface SecurityFinding {
  id: string;
  category: SecurityFindingCategory;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  file?: string;
  line?: number;
  /** Always masked - the real secret value is never stored or displayed. */
  maskedSample: string;
  description: string;
  recommendation: string;
}

export interface SecurityAuditResult {
  passed: boolean;
  releaseBlocked: boolean;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  findings: SecurityFinding[];
  scannedFiles: number;
  scannedBytes: number;
  scannedAt: string;
}

export interface DependencyRecord {
  package: string;
  version: string;
  declared: boolean;
  usageCount: number;
  usedIn: string[];
  issues: string[];
  source: 'package.json' | 'cdn' | 'import';
}

export interface DependencyAuditResult {
  dependencies: DependencyRecord[];
  total: number;
  unused: string[];
  missing: string[];
  cdnAssets: Array<{ url: string; host: string; integrity: boolean }>;
  vulnerabilityScan: 'VULNERABILITY_SCAN_UNAVAILABLE' | 'SCANNED';
  notes: string[];
  auditedAt: string;
}

export interface PerformanceMetric {
  label: string;
  value: string;
  numeric?: number;
  unit?: string;
  status: 'MEASURED' | 'UNAVAILABLE';
  detail?: string;
}

export interface PerformanceAuditResult {
  metrics: PerformanceMetric[];
  totalBytes: number;
  totalFiles: number;
  largestFiles: Array<{ name: string; bytes: number }>;
  blockingScripts: string[];
  externalRequests: string[];
  unavailable: string[];
  auditedAt: string;
}

export interface ProductionBuildResult {
  success: boolean;
  entryFile?: string;
  mode: 'STATIC_BUILD_VERIFICATION';
  durationMs: number;
  errors: string[];
  warnings: string[];
  outputBytes: number;
  outputFiles: number;
  assembledDocumentBytes: number;
  startedAt: string;
  finishedAt: string;
  fixAttempts: number;
}

export interface ReleaseChecklistItem {
  id: string;
  label: string;
  status: 'PASS' | 'WARN' | 'FAIL' | 'UNAVAILABLE';
  evidence: string;
}

export type ReleaseDecision = 'READY' | 'NOT_READY' | 'BLOCKED';

export interface ReleaseGateResult {
  decision: ReleaseDecision;
  blockingIssues: string[];
  warnings: string[];
  checklist: ReleaseChecklistItem[];
  evaluatedAt: string;
}

export interface ChangelogEntry {
  type: 'Added' | 'Changed' | 'Fixed' | 'Removed';
  description: string;
  files: string[];
}

export interface VersionSuggestion {
  current: string;
  suggested: string;
  bump: 'MAJOR' | 'MINOR' | 'PATCH' | 'NONE';
  rationale: string;
  counts: { added: number; changed: number; removed: number };
}

export interface ReleaseSnapshot {
  id: string;
  version: string;
  timestamp: string;
  label: string;
  files: CodeFile[];
  projectMetadata: {
    projectName: string;
    framework: string;
    category: string;
    description: string;
  };
  buildResult?: ProductionBuildResult;
  validationResult?: ValidationResult;
  testSummary?: {
    totalTests: number;
    passed: number;
    failed: number;
    consoleErrors: number;
    visualIssues: number;
    probeBacked: boolean;
  };
  changelog: ChangelogEntry[];
  releaseCheck?: ReleaseGateResult;
  gateDecision?: ReleaseDecision;
}

export interface ReleaseHistoryEntry {
  version: string;
  releasedAt: string;
  decision: ReleaseDecision;
  snapshotId: string;
}

export interface ReleaseReport {
  id: string;
  generatedAt: string;
  projectName: string;
  version: string;
  versionSuggestion: VersionSuggestion;
  decision: ReleaseDecision;
  productionReadiness: ReleaseChecklistItem[];
  build: ProductionBuildResult | null;
  validation: ValidationResult | null;
  browserQA: ReleaseStageResult | null;
  visualQA: ReleaseStageResult | null;
  security: SecurityAuditResult | null;
  dependencies: DependencyAuditResult | null;
  performance: PerformanceAuditResult | null;
  accessibility: ReleaseChecklistItem[];
  filesChanged: string[];
  changelog: ChangelogEntry[];
  warnings: string[];
  blockingIssues: string[];
  runtimeProbe: RuntimeProbeResult | null;
}

export interface CapabilityAssessment {
  capability: string;
  reality: CapabilityReality;
  evidence: string;
}

export interface RealityReport {
  generatedAt: string;
  assessments: CapabilityAssessment[];
}

export type ReleaseRunStatus =
  | 'IDLE'
  | 'RUNNING'
  | 'BLOCKED'
  | 'NOT_READY'
  | 'READY'
  | 'RELEASED'
  | 'FAILED'
  | 'CANCELLED';

export interface ReleaseRun {
  id: string;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  version: string;
  status: ReleaseRunStatus;
  stages: ReleaseStageResult[];
  currentStage?: ReleaseStageId;
  build: ProductionBuildResult | null;
  validation: ValidationResult | null;
  security: SecurityAuditResult | null;
  dependencies: DependencyAuditResult | null;
  performance: PerformanceAuditResult | null;
  gate: ReleaseGateResult | null;
  report: ReleaseReport | null;
  reality: RealityReport | null;
  snapshotId?: string;
  changelog: ChangelogEntry[];
  exportReady: boolean;
  exportConfirmed: boolean;
  notes: string[];
}

/**
 * Result of the REAL in-browser execution probe (hidden iframe running the
 * assembled project document inside the actual browser).
 */
export interface RuntimeProbeResult {
  loaded: boolean;
  viewport: { width: number; height: number; name: 'mobile' | 'tablet' | 'desktop' };
  consoleErrors: string[];
  consoleWarnings: string[];
  runtimeExceptions: string[];
  failedAssets: string[];
  domChecks: Array<{ selector: string; found: boolean; count: number }>;
  overflow: { hasHorizontalOverflow: boolean; documentWidth: number; viewportWidth: number };
  touchTargets: { total: number; tooSmall: number; samples: string[] };
  accessibility: { imagesWithoutAlt: number; inputsWithoutLabel: number; documentTitle: string };
  loadTimeMs?: number;
  measuredAt: string;
  unavailableReason?: string;
  error?: string;
}

export interface ReleasePipelineOptions {
  trigger: 'VOICE' | 'UI' | 'AGENT';
  requestedBy?: string;
  targetVersion?: string;
  maxFixAttempts?: number;
}

export interface ReleasePipelineCallbacks {
  onStageUpdate?: (stage: ReleaseStageResult, run: ReleaseRun) => void;
  onProbe?: (probe: RuntimeProbeResult) => void;
  shouldCancel?: () => boolean;
}

// ==================== V11 MULTI-AGENT TEAM RUNTIME TYPES ====================

export type TeamAgentRole = 'LEAD' | 'CODER' | 'UI_UX' | 'QA_BROWSER' | 'SECURITY' | 'PERFORMANCE' | 'REVIEWER' | 'RELEASE';
export type TeamAgentStatus = 'IDLE' | 'WAITING' | 'WORKING' | 'SUCCESS' | 'PARTIAL' | 'BLOCKED' | 'FAILED' | 'CANCELLED' | 'NEEDS_REVIEW';
export type TeamTaskStatus = 'PENDING' | 'READY' | 'RUNNING' | 'SUCCESS' | 'PARTIAL' | 'BLOCKED' | 'FAILED' | 'CANCELLED';
export type TeamRunStatus = 'TEAM_IDLE' | 'TEAM_PLANNING' | 'TEAM_EXECUTING' | 'TEAM_WAITING_REVIEW' | 'TEAM_WAITING_USER' | 'TEAM_PAUSED' | 'TEAM_COMPLETED' | 'TEAM_FAILED' | 'TEAM_CANCELLED';
export type TeamMessageType = 'TASK_ASSIGN' | 'TASK_UPDATE' | 'TASK_COMPLETE' | 'TASK_BLOCKED' | 'REQUEST_REVIEW' | 'REQUEST_CONTEXT' | 'REQUEST_FILE_LOCK' | 'CONFLICT' | 'EVIDENCE' | 'ERROR' | 'CANCEL' | 'RESUME';
export type ReviewRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AgentResultStatus = 'SUCCESS' | 'PARTIAL' | 'BLOCKED' | 'FAILED' | 'CANCELLED' | 'NEEDS_REVIEW';

export interface FileOwnership { path: string; agentId: string; taskId: string; locked: boolean; lockedAt: string; releasedAt?: string; }
export interface ChangeSet { id: string; agentId: string; taskId: string; files: string[]; additions: number; deletions: number; summary: string; riskLevel: ReviewRiskLevel; reversible: boolean; timestamp: string; status: 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'APPLIED' | 'ROLLED_BACK'; }
export interface AgentEvidence { id: string; label: string; value: string; source: string; measured: boolean; timestamp: string; }
export interface AgentResult {
  agentId: string; role: TeamAgentRole; status: AgentResultStatus; summary: string; changes: ChangeSet[]; filesRead: string[]; filesCreated: string[]; filesModified: string[]; findings: string[]; evidence: AgentEvidence[]; tests: string[]; blockers: string[]; recommendations: string[]; nextActions: string[]; toolCalls: string[]; retries: number; durationMs: number;
}
export interface TeamTaskNode { id: string; title: string; role: TeamAgentRole; dependencies: string[]; status: TeamTaskStatus; riskLevel: ReviewRiskLevel; files: string[]; result?: AgentResult; assignedAt?: string; completedAt?: string; }
export interface AgentMessage { id: string; from: string; to: string; type: TeamMessageType; taskId: string; payload: Record<string, any>; priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL'; timestamp: string; }
export interface TeamAgentState { id: string; role: TeamAgentRole; label: string; status: TeamAgentStatus; currentTaskId?: string; currentTask?: string; currentFile?: string; currentAction?: string; progress: number; filesTouched: string[]; findings: string[]; evidence: AgentEvidence[]; errors: string[]; retries: number; startedAt?: string; finishedAt?: string; result?: AgentResult; }
export interface TeamTaskState {
  id: string; objective: string; status: TeamRunStatus; activeAgents: TeamAgentState[]; completedAgents: string[]; blockedAgents: string[]; waitingAgents: string[]; taskGraph: TeamTaskNode[]; dependencies: Record<string, string[]>;
  sharedContext: { projectName: string; framework: string; rules: ProjectRule[]; decisions: ArchitectureDecision[]; knownIssues: string[]; knowledgeCount: number; activeRoadmap: string[]; currentSnapshotId?: string; contextBytes: number; };
  projectSnapshot?: ProjectSnapshot; changeSets: ChangeSet[]; evidence: AgentEvidence[]; findings: string[]; decisions: string[];
  approvals: Array<{ id: string; reviewerId: string; changeSetId: string; approved: boolean; reason: string; timestamp: string }>;
  messages: AgentMessage[]; errors: string[]; retries: number; startedAt: string; updatedAt: string; completedAt?: string;
}
export interface TeamRealityAssessment { capability: string; reality: CapabilityReality; evidence: string; }
export interface TeamRealityReport { generatedAt: string; assessments: TeamRealityAssessment[]; }
export interface TeamRunRecord { state: TeamTaskState; reality: TeamRealityReport; }

// ==================== V12 UNIVERSAL AI AGENT OS TYPES ====================
export type UniversalCapability = 'CODING' | 'RESEARCH' | 'BROWSER' | 'VISION' | 'AUDIO' | 'VIDEO' | 'DOCUMENT' | 'DATA' | 'API' | 'AUTOMATION' | 'ANALYSIS' | 'PLANNING' | 'REVIEW' | 'SECURITY' | 'PERFORMANCE' | 'UI_UX';
export type UniversalTaskCategory = 'CHAT' | 'PROMPT' | 'CODE' | 'DEBUG' | 'REFACTOR' | 'PROJECT' | 'RESEARCH' | 'AGENT' | 'BROWSER' | 'DOCUMENT' | 'DATA' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'AUTOMATION' | 'ANALYSIS' | 'BUSINESS' | 'MIXED';
export type UniversalPermission = 'SAFE' | 'REVIEW' | 'DANGEROUS' | 'READ_ONLY' | 'WRITE' | 'EXTERNAL_ACTION' | 'DESTRUCTIVE';
export type UniversalWorkflowNodeType = 'UNDERSTAND' | 'CLASSIFY' | 'PLAN' | 'RESEARCH' | 'EXECUTE' | 'VERIFY' | 'REVIEW' | 'APPROVE' | 'FIX' | 'DELIVER' | 'WAIT' | 'END';
export type UniversalNodeStatus = 'PENDING' | 'READY' | 'RUNNING' | 'SUCCESS' | 'PARTIAL' | 'BLOCKED' | 'FAILED' | 'CANCELLED' | 'UNAVAILABLE';
export type ModelRoutingMode = 'FAST' | 'REASONING' | 'CODING' | 'VISION' | 'VOICE' | 'RESEARCH' | 'LONG_CONTEXT';
export type UniversalReality = 'REAL' | 'PARTIAL' | 'UNAVAILABLE' | 'MOCK';

export interface UniversalAgent { id: string; name: string; role: string; capabilities: UniversalCapability[]; tools: string[]; modelPolicy: ModelRoutingMode[]; memoryPolicy: string[]; permissionLevel: UniversalPermission; status: string; currentTask?: string; contextBudget: ContextBudget; maxRetries: number; }
export interface ModelProfile { id: string; provider: string; capabilities: UniversalCapability[]; contextWindow: number; latencyClass: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN'; costClass: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN'; reasoningLevel: 'BASIC' | 'STANDARD' | 'ADVANCED' | 'UNKNOWN'; availability: 'AVAILABLE' | 'UNAVAILABLE' | 'UNKNOWN'; }
export interface ModelRoute { mode: ModelRoutingMode; selected: ModelProfile | null; status: 'SELECTED' | 'MODEL_UNAVAILABLE'; reason: string; alternatives: ModelProfile[]; }
export interface UniversalToolDefinition { id: string; name: string; category: string; description: string; inputSchema: Record<string, any>; outputSchema: Record<string, any>; permission: UniversalPermission; capabilities: UniversalCapability[]; availability: 'AVAILABLE' | 'UNAVAILABLE'; source: 'EXISTING_ORCHESTRATOR' | 'RUNTIME' | 'CONNECTOR'; }
export interface ToolRoute { query: string; tools: UniversalToolDefinition[]; status: 'AVAILABLE' | 'TOOL_UNAVAILABLE'; }
export interface ContextBudget { maxTokens: number; usedTokens: number; priorityItems: string[]; compressedItems: string[]; omittedItems: string[]; }
export interface UniversalContext { objective: string; currentTask: string; files: Array<{ name: string; content: string; relevance: number }>; rules: string[]; architecture: string[]; memory: string[]; knowledge: string[]; history: string[]; budget: ContextBudget; }
export interface WorkflowNode { id: string; type: UniversalWorkflowNodeType; title: string; dependencies: string[]; status: UniversalNodeStatus; agentIds: string[]; toolIds: string[]; evidence: string[]; error?: string; }
export interface UniversalWorkflow { id: string; name: string; objective: string; categories: UniversalTaskCategory[]; nodes: WorkflowNode[]; edges: Array<{ from: string; to: string }>; state: 'PLANNING' | 'RUNNING' | 'PAUSED' | 'WAITING_APPROVAL' | 'COMPLETED' | 'FAILED' | 'CANCELLED'; agents: UniversalAgent[]; tools: UniversalToolDefinition[]; evidence: string[]; createdAt: string; updatedAt: string; }
export interface ResearchFinding { id: string; source: string; title: string; summary: string; facts: string[]; citations: string[]; confidence: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN'; projectRelevance: string; timestamp: string; }
export interface ResearchResult { status: 'SUCCESS' | 'PARTIAL' | 'RESEARCH_UNAVAILABLE'; query: string; findings: ResearchFinding[]; conflicts: string[]; toolsUsed: string[]; message: string; }
export interface ImprovementProposal { id: string; problem: string; evidence: string[]; proposedChange: string; expectedBenefit: string; risk: string; affectedSystems: string[]; status: 'PROPOSED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'IMPLEMENTED'; }
export interface UniversalExecutionEvent { id: string; timestamp: string; agentId?: string; agent?: string; model?: string; tool?: string; action: string; inputSummary?: string; outputSummary?: string; status: UniversalNodeStatus; durationMs?: number; error?: string; evidence?: string[]; }
export interface UniversalRun { workflow: UniversalWorkflow; context: UniversalContext; modelRoutes: ModelRoute[]; toolRoutes: ToolRoute[]; events: UniversalExecutionEvent[]; research?: ResearchResult; improvementProposals: ImprovementProposal[]; reality: Array<{ capability: string; reality: UniversalReality; evidence: string }>; }

// ==================== V13 UNIVERSAL INTEGRATION HUB TYPES ====================
export type IntegrationType = 'REST_API' | 'GRAPHQL' | 'WEBSOCKET' | 'WEBHOOK' | 'MCP' | 'DATABASE' | 'FILE_SYSTEM' | 'AI_MODEL' | 'INTERNAL_TOOL' | 'CUSTOM';
export type IntegrationHealth = 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'AUTH_REQUIRED' | 'CONFIG_REQUIRED' | 'ERROR' | 'UNKNOWN';
export type IntegrationAuthType = 'NONE' | 'API_KEY' | 'BEARER' | 'OAUTH2' | 'BASIC' | 'CUSTOM_HEADER' | 'CUSTOM_QUERY' | 'SERVICE_CREDENTIAL';
export type IntegrationOperation = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LIST' | 'SEARCH' | 'EXECUTE' | 'STREAM' | 'SUBSCRIBE';
export type IntegrationPermission = 'READ' | 'WRITE' | 'EXECUTE' | 'DELETE' | 'ADMIN';
export type IntegrationRisk = 'SAFE' | 'REVIEW' | 'DANGEROUS';
export type IntegrationEventType = 'integration.connected' | 'integration.disconnected' | 'integration.failed' | 'integration.health_changed' | 'webhook.received' | 'webhook.failed' | 'connector.executed' | 'connector.failed' | 'credential.expired' | 'authentication.required' | 'schema.updated';
export type IntegrationExecutionStatus = 'LIVE' | 'UNAVAILABLE' | 'BLOCKED' | 'FAILED' | 'PARTIAL';

export interface IntegrationDefinition { id: string; name: string; provider: string; type: IntegrationType; category: string; status: 'CONNECTED' | 'DISCONNECTED' | 'CONFIG_REQUIRED' | 'DISABLED'; authType: IntegrationAuthType; capabilities: string[]; scopes: string[]; health: IntegrationHealth; metadata: Record<string, unknown>; }
export interface ConnectorDefinition { id: string; integrationId: string; name: string; description: string; type: IntegrationType; baseUrl?: string; operations: IntegrationOperation[]; inputSchema: Record<string, unknown>; outputSchema: Record<string, unknown>; permissions: Array<{ operation: IntegrationOperation; permission: IntegrationPermission; risk: IntegrationRisk }>; timeoutMs: number; retryPolicy: { maxAttempts: number; backoffMs: number; retryableStatuses: number[] }; availability: 'AVAILABLE' | 'UNAVAILABLE'; }
export interface ConnectionMetadata { id: string; integrationId: string; status: 'CONNECTED' | 'DISCONNECTED' | 'AUTH_REQUIRED' | 'CONFIG_REQUIRED'; authType: IntegrationAuthType; createdAt: string; updatedAt: string; lastHealthCheck?: string; lastExecutionAt?: string; credentialRef?: string; }
export interface IntegrationEvent { eventId: string; type: IntegrationEventType; source: string; timestamp: string; integrationId?: string; payload: Record<string, unknown>; metadata: Record<string, unknown>; }
export interface IntegrationAuditEntry { id: string; timestamp: string; integrationId?: string; connectorId?: string; operation?: IntegrationOperation; actor: string; mission?: string; workflow?: string; permission: 'ALLOWED' | 'DENIED' | 'NOT_CHECKED'; status: IntegrationExecutionStatus; durationMs: number; retryCount: number; errorClass?: string; sanitizedMetadata: Record<string, unknown>; }
export interface IntegrationHealthRecord { integrationId: string; status: IntegrationHealth; checkedAt: string; latencyMs?: number; error?: string; retryCount: number; lastSuccessfulExecution?: string; evidence: string[]; }
export interface IntegrationExecutionResult<T = unknown> { status: IntegrationExecutionStatus; data?: T; error?: { code: string; message: string; retryable: boolean; canonicalClass: string }; evidence: string[]; sanitizedResponse?: unknown; durationMs: number; retryCount: number; auditId: string; }
export interface OpenApiImportResult { status: 'REGISTERED' | 'INVALID' | 'UNAVAILABLE'; integration?: IntegrationDefinition; connectors: ConnectorDefinition[]; errors: string[]; warnings: string[]; }
export interface WebhookDefinition { id: string; integrationId: string; path: string; eventTypes: string[]; signatureHeader?: string; secretRef?: string; replayWindowMs: number; enabled: boolean; }
export interface IntegrationHubState { integrations: IntegrationDefinition[]; connectors: ConnectorDefinition[]; connections: ConnectionMetadata[]; health: IntegrationHealthRecord[]; events: IntegrationEvent[]; audit: IntegrationAuditEntry[]; webhooks: WebhookDefinition[]; updatedAt: string; }
export interface IntegrationDiscoveryResult { query: string; integrations: Array<IntegrationDefinition & { usableConnectors: ConnectorDefinition[] }>; status: 'AVAILABLE' | 'UNAVAILABLE'; }

// ==================== V14 UNIVERSAL INTELLIGENCE TYPES ====================
export type ResearchDepth = 'QUICK' | 'DEEP';
export type ResearchFreshness = 'LATEST' | 'RECENT' | 'HISTORICAL' | 'ANY';
export type EvidenceQuality = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
export type EvidenceConfidence = 'VERIFIED' | 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'UNCERTAIN' | 'CONFLICTING' | 'UNVERIFIED';
export type ResearchFindingState = 'SUPPORTED' | 'UNCERTAIN' | 'CONFLICTING' | 'UNKNOWN';
export interface ResearchPlan { objective: string; questions: string[]; subtasks: string[]; sourceRequirements: string[]; constraints: string[]; outputFormat: string; depth: ResearchDepth; freshness: ResearchFreshness; createdAt: string; }
export interface ResearchSource { id: string; type: 'WEB' | 'API' | 'DOCUMENT' | 'REPOSITORY' | 'PROJECT' | 'KNOWLEDGE' | 'DATABASE' | 'MCP'; title: string; url?: string; provider: string; retrievedAt?: string; publishedAt?: string; updatedAt?: string; reliability: EvidenceQuality; metadata: Record<string, unknown>; contentHash: string; status: 'DISCOVERED' | 'RETRIEVED' | 'REJECTED' | 'UNAVAILABLE'; content?: string; }
export interface ResearchEvidence { id: string; sourceId: string; claim: string; excerptReference: string; context: string; quality: EvidenceQuality; confidence: EvidenceConfidence; timestamp: string; untrustedInstructionDetected?: boolean; }
export interface ResearchClaim { id: string; claim: string; supportingEvidence: string[]; contradictingEvidence: string[]; sourceCount: number; confidence: EvidenceConfidence; lastVerified: string; state: ResearchFindingState; }
export interface ResearchConflict { id: string; claimIds: string[]; sourceIds: string[]; description: string; dates: string[]; context: string; status: 'CONFLICT_DETECTED' | 'RESOLVED' | 'UNRESOLVED'; }
export interface ResearchCitation { id: string; sourceId: string; label: string; claimIds: string[]; reference: string; }
export interface ResearchReport { id: string; objective: string; plan: ResearchPlan; sources: ResearchSource[]; evidence: ResearchEvidence[]; claims: ResearchClaim[]; conflicts: ResearchConflict[]; citations: ResearchCitation[]; findings: Array<{ claim: string; state: ResearchFindingState; confidence: EvidenceConfidence; citations: string[] }>; executiveSummary: string; uncertainties: string[]; conclusion: string; status: 'COMPLETE' | 'PARTIAL' | 'UNKNOWN' | 'CANCELLED'; createdAt: string; updatedAt: string; }
export interface ResearchObservation { sourcesSearched: number; sourcesRetrieved: number; sourcesRejected: number; claimsExtracted: number; conflictsFound: number; citationCoverage: number; failedRetrievals: number; contextUsedTokens: number; durationMs: number; }
export interface ResearchTask { id: string; objective: string; depth: ResearchDepth; status: 'PLANNING' | 'RUNNING' | 'PAUSED' | 'CANCELLED' | 'COMPLETE' | 'UNAVAILABLE'; plan: ResearchPlan; report?: ResearchReport; observation: ResearchObservation; events: Array<{ id: string; action: string; status: string; evidence: string[]; timestamp: string }>; createdAt: string; updatedAt: string; }

// ==================== V15 PRODUCTION EXECUTION TYPES ====================
export type ExecutionMode = 'LIVE' | 'DRY_RUN' | 'REPLAY';
export type ExecutionStatus = 'IDLE' | 'RUNNING' | 'WAITING_APPROVAL' | 'PAUSED' | 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'CANCELLED' | 'UNAVAILABLE';
export type ExecutionEventType = 'MISSION_STARTED' | 'TASK_CLASSIFIED' | 'PLAN_CREATED' | 'APPROVAL_REQUESTED' | 'APPROVAL_GRANTED' | 'APPROVAL_DENIED' | 'AGENT_STARTED' | 'TOOL_CALLED' | 'TOOL_COMPLETED' | 'TOOL_FAILED' | 'INTEGRATION_CALLED' | 'INTEGRATION_COMPLETED' | 'INTEGRATION_FAILED' | 'RESEARCH_STARTED' | 'SOURCE_DISCOVERED' | 'EVIDENCE_CREATED' | 'CLAIM_CREATED' | 'CONFLICT_DETECTED' | 'VALIDATION_STARTED' | 'VALIDATION_FAILED' | 'RECOVERY_STARTED' | 'RECOVERY_COMPLETED' | 'ACTION_EXECUTED' | 'CHECKPOINT_CREATED' | 'MISSION_COMPLETED' | 'MISSION_FAILED' | 'MISSION_CANCELLED';
export type ExecutionFailureClass = 'NETWORK' | 'TOOL' | 'MODEL' | 'VALIDATION' | 'PERMISSION' | 'TIMEOUT' | 'CONTEXT' | 'RESOURCE' | 'UNKNOWN';
export interface ExecutionTraceEvent { id: string; executionId: string; type: ExecutionEventType; timestamp: string; actor?: string; status: string; summary: string; evidence: string[]; sanitizedMetadata: Record<string, unknown>; }
export interface RecoveryAttempt { attempt: number; reason: string; strategy: string; result: string; failureClass: ExecutionFailureClass; }
export interface ExecutionCheckpoint { executionId: string; missionId: string; status: ExecutionStatus; currentStep: string; completedNodes: string[]; pendingNodes: string[]; activeAgents: string[]; integrationState: Record<string, unknown>; researchState: Record<string, unknown>; memoryReferences: string[]; permissionState: string; lastSuccessfulStep?: string; createdAt: string; }
export interface ExecutionApproval { id: string; action: string; target: string; system: string; data: string; risk: 'SAFE' | 'REVIEW' | 'DANGEROUS'; reason: string; expectedResult: string; status: 'PENDING' | 'GRANTED' | 'DENIED'; }
export interface ExecutionTrace { executionId: string; missionId: string; taskId?: string; parentExecutionId?: string; startedAt: string; completedAt?: string; status: ExecutionStatus; currentStep: string; mode: ExecutionMode; actors: string[]; tools: string[]; integrations: string[]; researchTasks: string[]; actions: string[]; evidence: string[]; failures: Array<{ class: ExecutionFailureClass; message: string }>; recoveries: RecoveryAttempt[]; approvals: ExecutionApproval[]; outputs: string[]; events: ExecutionTraceEvent[]; checkpoint?: ExecutionCheckpoint; idempotencyKeys: string[]; }
export interface ExecutionLimits { maxAgents: number; maxDepth: number; maxParallelTasks: number; maxToolCalls: number; maxResearchSources: number; maxRetries: number; maxExecutionTimeMs: number; }
export interface ProductionExecutionResult { trace: ExecutionTrace; status: ExecutionStatus; dryRunPlan: string[]; sideEffects: Array<{ action: string; status: 'NOT_EXECUTED' | 'EXECUTED' | 'BLOCKED' | 'PARTIAL'; reason: string }>; }

// ==================== V16 PRODUCTION INFRASTRUCTURE TYPES ====================
export type V16CapabilityStatus = 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE' | 'UNKNOWN';
export type V16ConnectionState = 'CONFIG_REQUIRED' | 'AUTH_REQUIRED' | 'AUTHENTICATING' | 'CONNECTED' | 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'ERROR' | 'DISCONNECTED' | 'REVOKED' | 'EXPIRED';
export type V16SecurityState = 'SECURE' | 'DEGRADED' | 'BLOCKED' | 'UNKNOWN';
export interface CredentialReference { credentialId: string; providerId: string; credentialType: 'API_KEY' | 'BEARER_TOKEN' | 'OAUTH2' | 'BASIC_AUTH' | 'DATABASE_PASSWORD' | 'PRIVATE_KEY' | 'CUSTOM'; createdAt: string; updatedAt: string; expiresAt?: string; status: 'AVAILABLE' | 'EXPIRED' | 'REVOKED' | 'UNAVAILABLE'; }
export interface ProviderCapabilityMetadata { providerId: string; connectorId: string; version?: string; capabilities: string[]; authenticationMethods: string[]; supportedOperations: string[]; healthCheck: V16CapabilityStatus; idempotencySupport: V16CapabilityStatus; webhookSupport: V16CapabilityStatus; streamingSupport: V16CapabilityStatus; transactionSupport: V16CapabilityStatus; rollbackSupport: V16CapabilityStatus; }
export interface ProviderReadiness { providerId: string; connectorId: string; credential: V16CapabilityStatus; connection: V16ConnectionState; health: V16CapabilityStatus; capabilities: Record<string, V16CapabilityStatus>; readiness: 'READY' | 'PARTIAL' | 'BLOCKED' | 'UNAVAILABLE'; reasons: string[]; evidence: string[]; }
export interface SSRFCheckResult { decision: 'ALLOW' | 'DENY' | 'UNKNOWN'; url: string; reasons: string[]; checkedAt: string; }
export interface V16HealthCheckResult { providerId: string; connectorId: string; status: V16CapabilityStatus; testedAt: string; endpoint?: string; operation?: string; statusCode?: number; latencyMs?: number; errorClass?: string; capabilitiesVerified: string[]; evidence: string[]; }
export interface ApprovalRecordV16 { approvalId: string; executionId: string; actionId: string; requestedAt: string; requestedBy: string; risk: 'SAFE' | 'REVIEW' | 'DANGEROUS'; target: string; reason: string; status: 'PENDING' | 'APPROVED' | 'DENIED' | 'EXPIRED' | 'CANCELLED'; approvedAt?: string; expiresAt?: string; }
export interface WebhookValidationResult { status: 'ACCEPTED' | 'REJECTED' | 'UNAVAILABLE'; eventId?: string; reasons: string[]; untrusted: true; }
export interface V16InfrastructureReport { secureCredentialVault: V16CapabilityStatus; oauth: V16CapabilityStatus; rest: V16CapabilityStatus; database: V16CapabilityStatus; mcp: V16CapabilityStatus; graphql: V16CapabilityStatus; websocket: V16CapabilityStatus; webhook: V16CapabilityStatus; durableCheckpoint: V16CapabilityStatus; approvalService: V16CapabilityStatus; security: V16SecurityState; providerMatrix: ProviderReadiness[]; ssrfTests: SSRFCheckResult[]; findings: string[]; generatedAt: string; }

// ==================== V17 LIVE PROVIDER TYPES ====================
export type V17ProviderState = 'CONFIG_REQUIRED' | 'AUTH_REQUIRED' | 'AUTHENTICATING' | 'CONNECTED' | 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'ERROR' | 'DISCONNECTED' | 'REVOKED' | 'EXPIRED';
export type V17ProviderStatus = 'READY' | 'PARTIAL' | 'CONFIG_REQUIRED' | 'AUTH_REQUIRED' | 'UNAVAILABLE' | 'DEGRADED' | 'ERROR' | 'UNKNOWN';
export interface V17CredentialMetadata { id: string; provider: string; type: string; scopes: string[]; status: 'AVAILABLE' | 'EXPIRED' | 'REVOKED' | 'UNAVAILABLE'; createdAt: string; expiresAt?: string; lastValidatedAt?: string; }
export interface V17ProviderConnection { providerId: string; connectionId: string; credentialReferenceId?: string; state: V17ProviderState; capabilities: Record<string, string>; lastHealthCheck?: string; healthEvidence: string[]; latencyMs?: number; errorClass?: string; rateLimitState?: string; }
export interface V17CheckpointRecord { missionId: string; executionId: string; nodeId: string; state: string; timestamp: string; version: number; integrityHash: string; durability: 'LOCAL_ONLY' | 'DURABLE' | 'UNAVAILABLE'; }
export interface V17ApprovalRecord { approvalId: string; missionId: string; executionId: string; actionId: string; tool: string; provider: string; operation: string; risk: 'SAFE' | 'REVIEW' | 'DANGEROUS'; parametersHash: string; status: 'WAITING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED'; requestedAt: string; approvedAt?: string; expiresAt?: string; }
export interface V17VerificationResult { status: 'VERIFIED' | 'EXECUTED_UNVERIFIED' | 'FAILED' | 'BLOCKED' | 'PARTIAL'; evidence: string[]; checkedAt: string; }
export interface V17CompensationResult { status: 'NOT_REQUIRED' | 'AVAILABLE' | 'ATTEMPTED' | 'SUCCEEDED' | 'FAILED' | 'UNSUPPORTED'; evidence: string[]; }
export interface V17RealityReport { credentialVault: 'REAL' | 'PARTIAL' | 'UNAVAILABLE'; oauth: 'REAL' | 'PARTIAL' | 'UNAVAILABLE'; providerConnections: V17ProviderConnection[]; checkpoints: V17CheckpointRecord[]; approvals: V17ApprovalRecord[]; webhookReplayProtection: 'REAL' | 'PARTIAL' | 'UNAVAILABLE'; verification: 'REAL' | 'PARTIAL' | 'UNAVAILABLE'; compensation: 'REAL' | 'PARTIAL' | 'UNAVAILABLE'; security: string[]; readiness: Array<{ providerId: string; status: V17ProviderStatus; evidence: string[] }>; generatedAt: string; }
