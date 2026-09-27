const INDEXABLE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".md",
  ".css",
  ".html",
  ".yaml",
  ".yml",
  ".txt",
]);

const EXCLUDED_SEGMENTS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
]);

const SECRET_PATTERNS = [
  /^\.env(?:\..*)?$/i,
  /\.pem$/i,
  /\.key$/i,
  /(^|\/)(credentials?|secrets?)(\.|\/|$)/i,
  /(^|\/)(id_rsa|id_ed25519)$/i,
];

export interface ExclusionDecision {
  excluded: boolean;
  reason: string | null;
}

export function normalizeKnowledgePath(path: string): string {
  return path
    .replaceAll("\\", "/")
    .split("/")
    .filter(segment => segment && segment !== ".")
    .join("/");
}

export function isIndexablePath(path: string): boolean {
  const normalized = normalizeKnowledgePath(path);
  const extension = normalized.slice(normalized.lastIndexOf(".")).toLowerCase();
  return INDEXABLE_EXTENSIONS.has(extension);
}

export function exclusionDecision(path: string): ExclusionDecision {
  const normalized = normalizeKnowledgePath(path);
  if (!normalized) return { excluded: true, reason: "EMPTY_PATH" };
  const segments = normalized.split("/");
  if (segments.some(segment => EXCLUDED_SEGMENTS.has(segment)))
    return { excluded: true, reason: "EXCLUDED_DIRECTORY" };
  if (SECRET_PATTERNS.some(pattern => pattern.test(normalized)))
    return { excluded: true, reason: "SECRET_MATERIAL" };
  if (!isIndexablePath(normalized))
    return { excluded: true, reason: "UNSUPPORTED_EXTENSION" };
  return { excluded: false, reason: null };
}

export function indexableExtensions(): readonly string[] {
  return Array.from(INDEXABLE_EXTENSIONS).sort();
}
