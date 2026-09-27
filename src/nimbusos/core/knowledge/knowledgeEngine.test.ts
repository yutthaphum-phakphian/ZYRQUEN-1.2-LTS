import { describe, expect, it } from "vitest";
import { InMemoryAuditRepository } from "../audit/auditRepository";
import { InMemoryKnowledgeRepository } from "./repository";
import { KnowledgeEngine } from "./knowledgeEngine";
import { chunkContent } from "./chunking";
import { exclusionDecision } from "./policy";

const NOW = "2026-09-27T00:00:00.000Z";

function createEngine() {
  let id = 0;
  const audit = new InMemoryAuditRepository();
  const engine = new KnowledgeEngine(
    new InMemoryKnowledgeRepository(),
    audit,
    () => `knowledge-test-${++id}`,
    () => NOW
  );
  return { engine, audit };
}

describe("Knowledge policy and deterministic chunking", () => {
  it("excludes secret, generated, and unsupported files while accepting source files", () => {
    expect(exclusionDecision(".env")).toEqual({ excluded: true, reason: "SECRET_MATERIAL" });
    expect(exclusionDecision("node_modules/pkg/index.js")).toEqual({
      excluded: true,
      reason: "EXCLUDED_DIRECTORY",
    });
    expect(exclusionDecision("src/logo.png")).toEqual({
      excluded: true,
      reason: "UNSUPPORTED_EXTENSION",
    });
    expect(exclusionDecision("src/core.ts")).toEqual({ excluded: false, reason: null });
  });

  it("chunks TypeScript declarations and preserves deterministic offsets and line ranges", () => {
    const chunks = chunkContent("src/core.ts", "const first = 1;\n\nexport function second() { return first; }\n");
    expect(chunks.length).toBe(2);
    expect(chunks.map(chunk => chunk.sequence)).toEqual([0, 1]);
    expect(chunks[0].startLine).toBe(1);
    expect(chunks[1].content).toContain("second");
  });
});

describe("KnowledgeEngine", () => {
  it("indexes actual file content, excludes secrets, and returns traceable lexical results", async () => {
    const { engine, audit } = createEngine();
    const result = await engine.indexFiles("ws-a", "project-a", [
      { path: "src/runtime.ts", content: "export function startRuntime() { return 'local'; }" },
      { path: "README.md", content: "# Runtime\n\nThe local runtime is browser scoped." },
      { path: ".env", content: "API_KEY=should-never-index" },
    ]);

    expect(result.indexed).toEqual(["src/runtime.ts", "README.md"]);
    expect(result.excluded).toEqual([".env"]);
    expect(result.errors).toEqual([]);
    expect((await engine.getStats("ws-a", "project-a"))).toMatchObject({
      sources: 3,
      documents: 2,
      excluded: 1,
    });

    const results = await engine.search({
      workspaceId: "ws-a",
      projectId: "project-a",
      query: "runtime",
    });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toMatchObject({
      metadata: {
        workspaceId: "ws-a",
        projectId: "project-a",
        contentHash: expect.stringMatching(/^(sha256|fnv1a)-/),
      },
      scoreType: "MATCH_COUNT",
    });
    expect(results[0].path).not.toBe(".env");
    expect(results[0].metadata.startLine).toBeTypeOf("number");

    const auditRecords = await audit.list("ws-a");
    expect(auditRecords.some(record => "actionType" in record && record.actionType === "KNOWLEDGE_SEARCHED")).toBe(true);
    expect(auditRecords.some(record => "actionType" in record && record.actionType === "KNOWLEDGE_SOURCE_EXCLUDED")).toBe(true);
  });

  it("skips unchanged content, marks changed sources stale, and reindexes updates", async () => {
    const { engine } = createEngine();
    const file = { path: "src/app.ts", content: "export const version = 1;" };
    const first = await engine.indexFile("ws-a", "project-a", file);
    const second = await engine.indexFile("ws-a", "project-a", file);
    expect(first.indexed).toEqual(["src/app.ts"]);
    expect(second.unchanged).toEqual(["src/app.ts"]);

    const stale = await engine.markStale("ws-a", "project-a", "src/app.ts");
    expect(stale?.status).toBe("STALE");
    const updated = await engine.indexFile("ws-a", "project-a", {
      ...file,
      content: "export const version = 2;",
    });
    expect(updated.indexed).toEqual(["src/app.ts"]);
    expect((await engine.search({ workspaceId: "ws-a", projectId: "project-a", query: "version = 2" })).length).toBe(1);
  });

  it("isolates workspace/project scopes and respects approximate context budget", async () => {
    const { engine } = createEngine();
    await engine.indexFile("ws-a", "project-a", { path: "a.md", content: "alpha shared context" });
    await engine.indexFile("ws-b", "project-a", { path: "b.md", content: "alpha other workspace" });
    await engine.indexFile("ws-a", "project-b", { path: "c.md", content: "alpha other project" });

    const results = await engine.search({ workspaceId: "ws-a", projectId: "project-a", query: "alpha" });
    expect(results).toHaveLength(1);
    expect(results[0].metadata.workspaceId).toBe("ws-a");
    expect(results[0].metadata.projectId).toBe("project-a");

    const context = await engine.retrieveContext(
      { workspaceId: "ws-a", projectId: "project-a", query: "alpha" },
      { maxTokens: 10, reservedTokens: 0, remainingTokens: 10, estimation: "APPROXIMATE" }
    );
    expect(context.budget.estimation).toBe("APPROXIMATE");
    expect(context.estimatedSize).toBeLessThanOrEqual(10);
    expect(context.sources[0]).toMatchObject({ path: "a.md", documentId: expect.any(String) });
  });
});
