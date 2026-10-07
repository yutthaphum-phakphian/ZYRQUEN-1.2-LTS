export interface EmergencyStop { enabled:boolean; reason?:string; setAt?:string; }
export function evaluateEmergencyStop(s:EmergencyStop){return s.enabled?{decision:'BLOCKED' as const,reason:s.reason||'EMERGENCY_STOP'}:{decision:'ADMITTED' as const};}
