const SENSITIVE_KEY = /secret|token|password|credential|api[_-]?key|private[_-]?key/i;
const SENSITIVE_VALUE = /\b(?:sk|rk)-[A-Za-z0-9_-]{12,}\b|\b(?:ghp|github_pat)_[A-Za-z0-9_]{12,}\b|\bAKIA[0-9A-Z]{12,}\b|Bearer\s+[A-Za-z0-9._-]{12,}/gi;

export function redactSensitive(value: unknown, key = ""): unknown {
  if (SENSITIVE_KEY.test(key)) return "[REDACTED]";
  if (typeof value === "string") return value.replace(SENSITIVE_VALUE, "[REDACTED]");
  if (Array.isArray(value)) return value.map(item => redactSensitive(item));
  if (typeof value === "object" && value !== null)
    return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [childKey, redactSensitive(childValue, childKey)]));
  return value;
}
