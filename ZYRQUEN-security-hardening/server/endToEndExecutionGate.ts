import crypto from 'node:crypto';
import { evaluateOperationalAdmission, type OperationalAdmission } from './operationalAdmission.ts';
import { evaluatePRGovernance, type PRGovernanceInput } from './prAutomationGovernance.ts';
import { evaluateReleaseChange, type ReleaseChangeInput } from './releaseChangeGate.ts';
import type { ExecutionHealthGateResult } from './executionHealthGate.ts';
import type { ExecutionRecoveryPlan } from './executionRecoveryPlan.ts';
export interface EndToEndDecision { decision:'ADMITTED'|'BLOCKED'; reasons:string[]; evidenceHash:string; operational:OperationalAdmission; pr:ReturnType<typeof evaluatePRGovernance>; release:ReturnType<typeof evaluateReleaseChange>; }
export function evaluateEndToEndExecution(gate:ExecutionHealthGateResult,recovery:ExecutionRecoveryPlan,pr:PRGovernanceInput,release:ReleaseChangeInput):EndToEndDecision { const operational=evaluateOperationalAdmission(gate,recovery); const prResult=evaluatePRGovernance(pr); const releaseResult=evaluateReleaseChange(release); const reasons=[...new Set([...operational.reasons,...prResult.reasons,...releaseResult.reasons])]; const evidenceHash=crypto.createHash('sha256').update(JSON.stringify({operational,pr:prResult,release:releaseResult})).digest('hex'); return {decision:reasons.length?'BLOCKED':'ADMITTED',reasons,evidenceHash,operational,pr:prResult,release:releaseResult}; }
