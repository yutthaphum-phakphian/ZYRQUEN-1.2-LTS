import { 
  FixStrategy, 
  EngineeringKnowledgeEntry, 
  KnowledgeQuery, 
  KnowledgeQueryResult, 
  ArchitectureDecision 
} from '../types';

const STORAGE_KEY = 'codevoice-ai:engineering-knowledge-bank';
const STRATEGIES_STORAGE_KEY = 'codevoice-ai:engineering-fix-strategies';

// Pre-seeded high-value engineering knowledge & fix patterns
const INITIAL_STRATEGIES: FixStrategy[] = [
  {
    id: 'strat-null-dom-guard',
    title: 'DOM Element Null-Check Before Event Binding & InnerHTML',
    problemPattern: "Cannot set properties of null (setting 'innerHTML')|null is not an object|document.getElementById.*is null",
    errorType: 'DOM',
    rootCause: 'JavaScript executes before target DOM element is rendered or selector ID does not match HTML structure.',
    solutionStrategy: 'Add conditional guard `const el = document.getElementById(id); if (!el) return;` and ensure script runs after DOMContentLoaded.',
    codeDiffSnippet: `// Before:\n// document.getElementById('cart-items').innerHTML = html;\n\n// Fix:\nconst container = document.getElementById('cart-items');\nif (!container) return;\ncontainer.innerHTML = html;`,
    affectedFiles: ['script.js', 'index.html'],
    successRate: 0.98,
    appliedCount: 42,
    tags: ['dom', 'null-check', 'event-binding', 'vanilla-js'],
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'strat-undefined-property-chain',
    title: 'Safe Optional Chaining on Nested State / Context Properties',
    problemPattern: "Cannot read properties of undefined|Cannot read property.*of undefined|undefined is not an object",
    errorType: 'RUNTIME',
    rootCause: 'Accessing properties of asynchronous, uninitialized, or partial state objects before data arrives.',
    solutionStrategy: 'Apply TypeScript optional chaining `?.` and provide fallback default values (e.g. `context?.files || []`).',
    codeDiffSnippet: `// Before:\n// const len = projectContext.files.length;\n\n// Fix:\nconst len = projectContext?.files?.length || 0;`,
    affectedFiles: ['src/App.tsx', 'src/components/*'],
    successRate: 0.99,
    appliedCount: 56,
    tags: ['react', 'optional-chaining', 'typescript', 'null-safety'],
    createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
  },
  {
    id: 'strat-horizontal-overflow-fix',
    title: 'Mobile Viewport Horizontal Scroll & Overflow Fix',
    problemPattern: "horizontal overflow|document.body.scrollWidth.*window.innerWidth|clipped content|overflow-x",
    errorType: 'RESPONSIVE',
    rootCause: 'Fixed pixel widths (e.g. w-[600px] or min-w-[500px]) forcing the root document to scroll horizontally on viewports < 400px.',
    solutionStrategy: 'Use Tailwind `max-w-full`, `w-full`, `overflow-x-hidden`, responsive break tags `sm:`, and replace fixed widths with `max-w-md` / `max-w-lg`.',
    codeDiffSnippet: `// Before:\n// <div className="w-[450px]">\n\n// Fix:\n<div className="w-full max-w-md px-4">`,
    affectedFiles: ['index.html', 'style.css', 'src/components/*'],
    successRate: 0.96,
    appliedCount: 28,
    tags: ['tailwind', 'css', 'responsive', 'overflow', 'mobile-first'],
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: 'strat-tts-quota-cooldown',
    title: 'API Rate Limit 429 Graceful Fallback with Smart Cooldown',
    problemPattern: "429|RESOURCE_EXHAUSTED|quota exceeded|rate limit",
    errorType: 'API',
    rootCause: 'External AI API quota exhausted in free/shared tiers without exponential backoff or local fallback.',
    solutionStrategy: 'Catch 429 errors gracefully, set an in-memory timestamp cooldown, and fallback smoothly to browser-native SpeechSynthesis or cached responses.',
    codeDiffSnippet: `// Before:\n// throw new Error('API Rate limit exceeded');\n\n// Fix:\n// Set cooldown and return graceful fallback object with browser audio`,
    affectedFiles: ['server.ts', 'src/utils/speech.ts'],
    successRate: 0.97,
    appliedCount: 35,
    tags: ['api', 'rate-limit', '429', 'fallback', 'speech-synthesis'],
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 'strat-touch-target-accessibility',
    title: 'Touch Target Minimum 44x44px for Mobile Navigation & Buttons',
    problemPattern: "touch target too small|target.*less than 44px|accessibility button size",
    errorType: 'STYLING',
    rootCause: 'Icon buttons styled with tight padding (e.g. p-1, h-6 w-6) resulting in bounding rect < 44px on mobile devices.',
    solutionStrategy: 'Add `min-h-[44px] min-w-[44px] flex items-center justify-center` or appropriate padding `p-2.5` to interactive clickable elements.',
    codeDiffSnippet: `// Before:\n// <button className="p-1"><Search className="w-3.5 h-3.5" /></button>\n\n// Fix:\n// <button className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"><Search className="w-4 h-4" /></button>`,
    affectedFiles: ['index.html', 'src/components/Header.tsx'],
    successRate: 0.99,
    appliedCount: 31,
    tags: ['accessibility', 'touch-target', 'mobile', 'wcag', 'css'],
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: 'strat-modular-script-decoupling',
    title: 'Modular Script & Style Decoupling for Multi-File Workspace',
    problemPattern: "inline scripts not executing|duplicate declaration|script loading conflict",
    errorType: 'STATE',
    rootCause: 'Mixing inline event handlers with complex global states without explicit modular lifecycle.',
    solutionStrategy: 'Separate concerns into index.html (structure), style.css (visual rules), and script.js (state & handlers) with explicit DOM ready guards.',
    codeDiffSnippet: `// Structure:\n// index.html -> <script src="script.js"></script>\n// script.js -> document.addEventListener('DOMContentLoaded', initApp);`,
    affectedFiles: ['index.html', 'script.js', 'style.css'],
    successRate: 0.95,
    appliedCount: 22,
    tags: ['architecture', 'modular', 'decoupling', 'vanilla-js'],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  }
];

const INITIAL_KNOWLEDGE_ENTRIES: EngineeringKnowledgeEntry[] = [
  {
    id: 'kb-arch-1',
    type: 'ARCHITECTURAL_DECISION',
    title: 'Separation of Presentation and Runtime Sandbox Execution',
    summary: 'Sandbox previews must execute in isolated iframes with postMessage telemetry to prevent main app freeze.',
    context: 'When previewing dynamic user-generated code, uncaught runtime syntax or infinite loops must not crash the developer studio.',
    solution: 'Use iframe sandbox with injected console interceptor and message event communication.',
    tags: ['architecture', 'iframe', 'sandbox', 'isolation'],
    confidenceScore: 0.98,
    usageCount: 45,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-arch-2',
    type: 'BEST_PRACTICE',
    title: 'Safe Secret Masking Before Client Audit & Persistence',
    summary: 'All credentials, JWT tokens, Bearer headers, and database connection strings must be masked before logging.',
    context: 'Prevent unintentional credential exposure in UI logs, export snapshots, or browser local storage.',
    solution: 'Apply regex masking on Bearer tokens, private keys, and DB passwords before audit serialization.',
    tags: ['security', 'masking', 'secrets', 'data-protection'],
    confidenceScore: 1.0,
    usageCount: 88,
    createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-arch-3',
    type: 'FIX_STRATEGY',
    title: 'Continuous Build & Validation Gate Before Preview Deployment',
    summary: 'Inspect syntax, HTML tags, script references, and CSS brackets before injecting code into the DOM.',
    context: 'Broken HTML tags or unclosed scripts corrupt the entire visual preview tree.',
    solution: 'Run pre-flight validation parser; if errors are found, automatically activate Self-Healing repair step.',
    tags: ['validation', 'self-healing', 'build-gate'],
    confidenceScore: 0.96,
    usageCount: 64,
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export class EngineeringKnowledgeBank {
  private strategies: FixStrategy[] = [];
  private entries: EngineeringKnowledgeEntry[] = [];

  constructor() {
    this.hydrate();
  }

  private hydrate(): void {
    // 1. Load Fix Strategies
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STRATEGIES_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.strategies = parsed;
          }
        }
      }
    } catch (e) {
      console.warn('EngineeringKnowledgeBank: Failed to read strategies from localStorage', e);
    }
    if (this.strategies.length === 0) {
      this.strategies = [...INITIAL_STRATEGIES];
      this.persistStrategies();
    }

    // 2. Load Knowledge Entries
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.entries = parsed;
          }
        }
      }
    } catch (e) {
      console.warn('EngineeringKnowledgeBank: Failed to read knowledge entries from localStorage', e);
    }
    if (this.entries.length === 0) {
      this.entries = [...INITIAL_KNOWLEDGE_ENTRIES];
      this.persistEntries();
    }
  }

  private persistStrategies(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STRATEGIES_STORAGE_KEY, JSON.stringify(this.strategies));
      }
    } catch (e) {
      console.warn('EngineeringKnowledgeBank: Could not persist strategies to storage', e);
    }
  }

  private persistEntries(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
      }
    } catch (e) {
      console.warn('EngineeringKnowledgeBank: Could not persist entries to storage', e);
    }
  }

  /**
   * Primary Query Interface: Query engineering knowledge before attempting new bug fixes or reasoning.
   */
  public queryKnowledge(query: KnowledgeQuery): KnowledgeQueryResult {
    const errorText = (query.error || query.query || '').toLowerCase().trim();
    const tags = query.tags || [];
    const limit = query.limit || 5;

    // 1. Find Best Matching Fix Strategy
    const matchedStrategy = this.queryFixStrategy(errorText);

    // 2. Filter & Rank Knowledge Entries
    const matchedEntries = this.entries
      .map((entry) => {
        let score = 0;
        const entryText = `${entry.title} ${entry.summary} ${entry.context} ${entry.solution} ${entry.tags.join(' ')}`.toLowerCase();

        // Exact pattern or error match
        if (entry.problemPattern) {
          try {
            const rx = new RegExp(entry.problemPattern, 'i');
            if (rx.test(errorText)) score += 50;
          } catch {
            if (errorText.includes(entry.problemPattern.toLowerCase())) score += 30;
          }
        }

        // Keyword tokens matching
        const tokens = errorText.split(/[\s,._:;(){}[\]\/\\]+/).filter((t) => t.length > 2);
        tokens.forEach((tok) => {
          if (entryText.includes(tok)) score += 5;
        });

        // Tag matching
        tags.forEach((tag) => {
          if (entry.tags.includes(tag.toLowerCase())) score += 10;
        });

        // Boost by historical confidence & usage
        score += (entry.confidenceScore || 0.5) * 10;
        score += Math.min(entry.usageCount || 0, 20);

        return { entry, score };
      })
      .filter((item) => item.score > 5 || !errorText)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.entry);

    // 3. Formulate Reasoning Context Prompt Snippet
    let reasoningContext = '';
    if (matchedStrategy) {
      reasoningContext += `[ENGINEERING KNOWLEDGE BANK - MATCHED FIX STRATEGY]\n` +
        `Strategy: ${matchedStrategy.title}\n` +
        `Root Cause: ${matchedStrategy.rootCause}\n` +
        `Recommended Fix: ${matchedStrategy.solutionStrategy}\n` +
        (matchedStrategy.codeDiffSnippet ? `Code Pattern:\n${matchedStrategy.codeDiffSnippet}\n` : '') +
        `Historical Success Rate: ${(matchedStrategy.successRate * 100).toFixed(0)}% (Used ${matchedStrategy.appliedCount} times)\n\n`;
    }

    if (matchedEntries.length > 0) {
      reasoningContext += `[RELEVANT ARCHITECTURAL PRINCIPLES]\n` +
        matchedEntries.map((e) => `- ${e.title} (${e.type}): ${e.solution}`).join('\n');
    }

    return {
      matchedEntries,
      recommendedStrategy: matchedStrategy || undefined,
      reasoningContext: reasoningContext.trim(),
      confidence: matchedStrategy ? matchedStrategy.successRate : (matchedEntries[0]?.confidenceScore || 0.5),
    };
  }

  /**
   * Dedicated Strategy Lookup based on error message or log pattern
   */
  public queryFixStrategy(errorMessage: string, _contextSnippet?: string): FixStrategy | null {
    if (!errorMessage || !errorMessage.trim()) return null;

    const lower = errorMessage.toLowerCase();

    for (const strat of this.strategies) {
      try {
        const rx = new RegExp(strat.problemPattern, 'i');
        if (rx.test(errorMessage) || rx.test(lower)) {
          return strat;
        }
      } catch {
        if (lower.includes(strat.problemPattern.toLowerCase())) {
          return strat;
        }
      }

      // Check keyword overlap in title and tags
      const hasTagMatch = strat.tags.some((t) => lower.includes(t.toLowerCase()));
      if (hasTagMatch && (lower.includes(strat.title.toLowerCase()) || lower.includes(strat.errorType.toLowerCase()))) {
        return strat;
      }
    }

    return null;
  }

  /**
   * Persists a newly learned fix strategy into the knowledge bank
   */
  public recordFixStrategy(strategyInput: Omit<FixStrategy, 'id' | 'appliedCount' | 'createdAt'>): FixStrategy {
    const existingIndex = this.strategies.findIndex(
      (s) => s.title.toLowerCase() === strategyInput.title.toLowerCase() || 
             s.problemPattern === strategyInput.problemPattern
    );

    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const existing = this.strategies[existingIndex];
      const updated: FixStrategy = {
        ...existing,
        ...strategyInput,
        appliedCount: existing.appliedCount + 1,
        lastAppliedAt: now,
      };
      this.strategies[existingIndex] = updated;
      this.persistStrategies();
      return updated;
    }

    const newStrategy: FixStrategy = {
      ...strategyInput,
      id: `strat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      appliedCount: 1,
      createdAt: now,
      lastAppliedAt: now,
    };

    this.strategies.unshift(newStrategy);
    this.persistStrategies();

    // Also register as knowledge entry
    this.recordKnowledgeEntry({
      type: 'FIX_STRATEGY',
      title: newStrategy.title,
      summary: newStrategy.solutionStrategy,
      context: `Error Pattern: ${newStrategy.problemPattern} (${newStrategy.errorType})`,
      solution: newStrategy.solutionStrategy,
      problemPattern: newStrategy.problemPattern,
      tags: newStrategy.tags,
      confidenceScore: newStrategy.successRate,
      usageCount: 1,
      fixStrategy: newStrategy,
    });

    return newStrategy;
  }

  /**
   * Persists an architectural decision into the knowledge bank
   */
  public recordArchitecturalDecision(decision: ArchitectureDecision): EngineeringKnowledgeEntry {
    return this.recordKnowledgeEntry({
      type: 'ARCHITECTURAL_DECISION',
      title: decision.decision,
      summary: decision.reason,
      context: `Category: ${decision.category || 'general'}`,
      solution: `Architectural Decision: ${decision.decision} - Rationale: ${decision.reason}`,
      tags: ['decision', decision.category || 'stack', 'architecture'],
      confidenceScore: 0.95,
      usageCount: 1,
      decision,
    });
  }

  /**
   * Generic Knowledge Entry Recorder
   */
  public recordKnowledgeEntry(entryInput: Omit<EngineeringKnowledgeEntry, 'id' | 'createdAt' | 'updatedAt'>): EngineeringKnowledgeEntry {
    const now = new Date().toISOString();
    const existingIndex = this.entries.findIndex((e) => e.title.toLowerCase() === entryInput.title.toLowerCase());

    if (existingIndex >= 0) {
      const existing = this.entries[existingIndex];
      const updated: EngineeringKnowledgeEntry = {
        ...existing,
        ...entryInput,
        usageCount: existing.usageCount + 1,
        updatedAt: now,
      };
      this.entries[existingIndex] = updated;
      this.persistEntries();
      return updated;
    }

    const newEntry: EngineeringKnowledgeEntry = {
      ...entryInput,
      id: `kb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };

    this.entries.unshift(newEntry);
    this.persistEntries();
    return newEntry;
  }

  /**
   * Feedback loop: Records whether an applied strategy succeeded or failed
   */
  public recordSuccessfulFix(strategyId: string, success: boolean): void {
    const strat = this.strategies.find((s) => s.id === strategyId);
    if (!strat) return;

    strat.appliedCount += 1;
    strat.lastAppliedAt = new Date().toISOString();

    // Adjust success rate using Exponential Moving Average
    const alpha = 0.2;
    strat.successRate = Number((strat.successRate * (1 - alpha) + (success ? 1 : 0) * alpha).toFixed(2));

    this.persistStrategies();
  }

  public getAllStrategies(): FixStrategy[] {
    return [...this.strategies];
  }

  public getAllEntries(): EngineeringKnowledgeEntry[] {
    return [...this.entries];
  }

  public deleteEntry(id: string): boolean {
    const initialLen = this.entries.length;
    this.entries = this.entries.filter((e) => e.id !== id);
    if (this.entries.length !== initialLen) {
      this.persistEntries();
      return true;
    }
    return false;
  }

  public deleteStrategy(id: string): boolean {
    const initialLen = this.strategies.length;
    this.strategies = this.strategies.filter((s) => s.id !== id);
    if (this.strategies.length !== initialLen) {
      this.persistStrategies();
      return true;
    }
    return false;
  }

  public exportKnowledgeBank(): string {
    return JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      strategies: this.strategies,
      entries: this.entries,
    }, null, 2);
  }

  public importKnowledgeBank(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data && Array.isArray(data.strategies) && Array.isArray(data.entries)) {
        this.strategies = data.strategies;
        this.entries = data.entries;
        this.persistStrategies();
        this.persistEntries();
        return true;
      }
      return false;
    } catch (e) {
      console.error('EngineeringKnowledgeBank: import failed', e);
      return false;
    }
  }
}

// Global Singleton Instance
export const engineeringKnowledgeBank = new EngineeringKnowledgeBank();
