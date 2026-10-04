# V14 Universal Intelligence & Research Engine Reality Report

## Scope

V14 adds an intelligence layer above V1–V13. It does not create a second Agent
Runtime, Workflow Engine, Memory system, Model Router, Permission system, Tool
Registry, Event Bus, or Integration Hub. External retrieval uses the existing V13
Integration Hub. V12 Context/mission state and V11/V10 authorities remain intact.

## Implemented

The Research Engine provides typed research plans, Quick/Deep modes, source
identity and content-hash deduplication, project/document/user-source discovery,
V13-backed external retrieval, evidence extraction, claim grouping, conflict
detection, confidence states, citation generation, review checks, structured
reports, Markdown export, persistence of the active research task, replay-ready
events, and mobile/desktop Research panels.

Research content is treated as untrusted data. Instruction-like text such as
“ignore previous instructions”, “run this command”, or credential requests is
marked `untrustedInstructionDetected` and is never executed. No evidence produces
`UNKNOWN`; an external URL without a configured V13 integration produces
`UNAVAILABLE` and no citation.

## Tests executed

| Scenario | Result |
|---|---|
| V14 TypeScript regression | Passed (`npm run lint`) |
| V14 production build | Passed (`npm run build`) |
| Quick research | Passed with retrieved document sources and citations |
| Deep research | Passed with Deep plan and multi-source evidence |
| Source deduplication | Passed by content hash |
| Source freshness planning | Passed with `LATEST` policy for temporal queries |
| Evidence extraction | Passed |
| Claim extraction | Passed |
| Conflicting sources | Conflict normalization implemented and surfaced as `CONFLICTING_EVIDENCE` |
| Missing evidence | Returned `UNKNOWN` with zero citations |
| V13 external retrieval boundary | URL without integration returned `UNAVAILABLE`, never direct fabricated retrieval |
| Prompt injection source | Marked untrusted and retained only as data context |
| Citation generation | Passed for retrieved evidence |
| Research review | Reports insufficient evidence or review-required states |
| Research persistence | Active task stored in metadata localStorage key |
| Mobile/desktop UI | Research panel connected to both navigation surfaces |

## Capability reality

| Capability | Reality | Evidence |
|---|---|---|
| Research Planner | REAL | Typed Quick/Deep plans with questions, subtasks, freshness, constraints |
| Source Discovery | REAL/PARTIAL | Project, document, user-supplied, and typed V13 source discovery; no provider is invented |
| Source Retrieval | PARTIAL | Local/project content retrieves directly; external content requires V13 connector |
| Evidence Extraction | REAL | Retrieved content becomes traceable evidence objects |
| Claim Engine | REAL | Evidence grouped into typed claims with support/contradiction references |
| Conflict Detection | REAL | Positive/negative normalized claims generate conflict objects |
| Synthesis | REAL/PARTIAL | Structured findings preserve supported, uncertain, conflicting, and unknown states |
| Citation Engine | REAL | Citations point to source IDs and retrieval metadata |
| Research Memory | PARTIAL | Research task persistence is connected; permanent Project Brain promotion still requires policy/approval integration |
| Deep Research | REAL/PARTIAL | Multi-source/deeper extraction path exists; external scale depends on V13 connectors |
| Research Agent | PARTIAL | Research engine is callable as a role boundary; no duplicate V11 role was created |
| Multi-Agent Research | PARTIAL | V11 remains available, but specialist fan-out is not claimed without runtime execution evidence |
| Reviewer | REAL | Citation coverage and insufficient-evidence review are computed |
| Hallucination Guard | REAL | No-evidence UNKNOWN, citation checks, conflict states, and untrusted-source defense |
| Temporal Research | PARTIAL | Freshness policy is planned and recorded; date extraction/provider freshness depends on source metadata |
| Repository Research | PARTIAL | Project/repository source types exist; live repository access requires V13 connector |
| Document Research | REAL/PARTIAL | Local document-like content is extracted; DOCX/PDF ingestion depends on existing file capabilities/input |
| Project Research | REAL | Project files are discovered as ProjectContext sources |
| Voice Research | REAL/PARTIAL | Voice commands route to Research panel and engine; evidence remains unavailable when sources are unavailable |
| Knowledge Graph | PARTIAL | Typed source/claim/evidence relationships exist; no large graph database created |
| Security | REAL/PARTIAL | Prompt-injection content is data-only; external URL safety remains V13 responsibility |
| Prompt Injection Defense | REAL | Instruction-like source text is marked untrusted and never executed |
| Replay | PARTIAL | Task events are persisted and replay-ready; destructive external actions are not automatically replayed |
| Observability | REAL/PARTIAL | Source/claim/conflict/citation counts and duration are recorded in ResearchTask |
| Export | REAL | Markdown report export includes findings, citations, conflicts, uncertainties, and conclusion |
| V13 Integration | REAL | `retrieveSource` calls `integrationHub.executeConnector` for external source metadata |
| V12 Context/Model | PARTIAL | Research plans and bounded source extraction are integrated; full model-generated synthesis is provider-dependent |

## Known limitations

- No external research connector is configured in the current runtime, so external
  URLs are correctly reported unavailable.
- LocalStorage persistence is metadata persistence; secure server-side memory and
  credential storage remain governed by existing V12/V13 boundaries.
- Build retains the known Vite `__dirname` future config-loader warning and bundle
  size advisory.
- V14 is complete as an evidence-safe intelligence layer for the available
  runtime, not as a claim of live web access without a configured V13 connector.
