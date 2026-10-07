# CodeVoice AI V12 Universal AI Agent OS

V12 adds an orchestration layer above the existing V1–V11 implementations. It
does not replace or duplicate Agent Runtime, Tool Orchestrator, Memory, Browser
QA, V11 Team Runtime, or V10 Release Engine.

## Implemented

The Universal Runtime classifies natural-language objectives into multiple
categories including code, project, research, browser, documents, data, image,
audio, video, automation, analysis, and business. It generates a dependency-aware
workflow with Understand, Classify, Plan, Research, Execute, Verify, Review,
Deliver, and End nodes. It selects relevant V11 team roles and can hand the
production path to the existing V10 Release Agent.

A provider-agnostic model router uses configured model settings only. It returns
`MODEL_UNAVAILABLE` when a required capability is not available instead of
pretending that a model ran. A structured Universal Tool Registry wraps existing
orchestrator capabilities and declares permission, capability, availability,
input schema, and output schema. Tool discovery returns `TOOL_UNAVAILABLE` when
there is no usable tool.

The Context Assembly Layer ranks project files by objective relevance, tracks
used/maximum tokens, records compressed/omitted files, and preserves rules and
high-priority context. Mission Control exposes the workflow graph, routing,
tool discovery, context budget, unified event timeline, research status, and
reality report on desktop and mobile.

V12 voice routing supports research, data analysis, browser inspection,
screenshot-driven missions, high-level website missions, production missions,
and universal mission creation. Research and multimodal connector paths report
`RESEARCH_UNAVAILABLE` or `UNAVAILABLE` when no configured runtime connector is
present; the system does not invent citations or claim unsupported execution.

## Executed validation

| Scenario | Result |
|---|---|
| Research + landing page classification | `RESEARCH + CODE + PROJECT + MIXED` |
| Workflow generation | 9 dependency-aware nodes generated |
| Model routing with configured coding model | coding/reasoning selected; research route `MODEL_UNAVAILABLE` |
| Research without connector | `RESEARCH_UNAVAILABLE`, no fabricated citations |
| Tool discovery | structured registry queried; unavailable categories reported |
| Context budget | priority-ranked files measured and included under budget |
| V11 integration | existing team roles selected through `TeamRuntime` |
| V10 integration | production/release remains delegated to V10 Release Agent |
| V1–V11 type compatibility | passed after resolving ToolDefinition name collision |

## Reality report

Universal Agent Runtime, Task Classification, Tool Registry, Tool Discovery,
Workflow Engine, Context Engine, V11 integration, and V10 integration are REAL
in the local runtime. Model routing is PARTIAL because only the configured model
profile is known and no live provider catalog is queried. Research and
multimodal capabilities are UNAVAILABLE when their connectors are not configured.
The V12 layer provides architecture and honest routing status for them without
fabricating execution.

## Validation commands

- `npm run lint` — passed (`tsc --noEmit`)
- `npm run build` — passed
- V12 classifier/router/workflow/context/unavailability scenario — passed

The build retains the existing Vite `__dirname` future-config warning and the
large bundle advisory; these remain warnings and are not marked as failures.
