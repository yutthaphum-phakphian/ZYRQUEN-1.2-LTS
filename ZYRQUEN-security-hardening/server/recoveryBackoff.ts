export function recoveryBackoff(attempt:number, baseMs=1000,maxMs=60_000){const a=Math.max(0,Math.floor(attempt)); return Math.min(maxMs,baseMs*2**a);}
export function recoveryRetryAllowed(attempt:number,maxAttempts:number){return Number.isInteger(attempt)&&attempt>=0&&attempt<maxAttempts;}
