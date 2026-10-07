import crypto from 'node:crypto';
export interface WebhookObservation { deliveryId:string; ok:boolean; attempts:number; status:number; latencyMs:number; observedAt:string; observationHash:string; }
export interface WebhookMetrics { total:number; succeeded:number; failed:number; retrying:number; averageLatencyMs:number; }
export function observeWebhook(input:Omit<WebhookObservation,'observationHash'>):WebhookObservation { const observationHash=crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex'); return {...input,observationHash}; }
export function summarizeWebhookObservations(items:WebhookObservation[]):WebhookMetrics { const total=items.length,succeeded=items.filter(x=>x.ok).length,failed=total-succeeded,retrying=items.filter(x=>x.attempts>1).length; return {total,succeeded,failed,retrying,averageLatencyMs:total?items.reduce((s,x)=>s+x.latencyMs,0)/total:0}; }
