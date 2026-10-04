export interface CircuitState { failures:number; openedUntil:number; }
export function recordWebhookResult(state:CircuitState, ok:boolean, now=Date.now(), threshold=3, cooldownMs=30_000):CircuitState { if(ok)return {failures:0,openedUntil:0}; const failures=state.failures+1; return failures>=threshold?{failures,openedUntil:now+cooldownMs}:{failures,openedUntil:state.openedUntil}; }
export function admitWebhook(state:CircuitState, now=Date.now()){return state.openedUntil>now?{decision:'BLOCKED',reason:'WEBHOOK_CIRCUIT_OPEN'}:{decision:'ADMITTED'};}
