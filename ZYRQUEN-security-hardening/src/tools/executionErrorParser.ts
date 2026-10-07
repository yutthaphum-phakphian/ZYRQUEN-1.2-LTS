export type ExecutionErrorCategory = 'SYNTAX' | 'TYPE' | 'BUILD' | 'TEST' | 'LINT' | 'DEPENDENCY' | 'RUNTIME' | 'CONFIG' | 'UNKNOWN';
export interface ParsedExecutionError {
  file?: string;
  line?: number;
  column?: number;
  code?: string;
  message: string;
  category: ExecutionErrorCategory;
  suggestedAction?: string;
}

export function parseExecutionErrors(output: string, taskType?: string): ParsedExecutionError[] {
  const text = String(output || '');
  if (!text.trim()) return [];
  const results: ParsedExecutionError[] = [];
  const lines = text.split(/\r?\n/).filter(Boolean).slice(-120);
  for (const line of lines) {
    const match = line.match(/(?:^|\s)([^\s:(]+\.(?:tsx|ts|jsx|js|css|html|json))(?:\((\d+)(?:,(\d+))?\)|(?::(\d+))?(?::(\d+))?)/i);
    const lineNumber = match?.[2] || match?.[4];
    const columnNumber = match?.[3] || match?.[5];
    const code = line.match(/\b(?:TS\d{3,5}|[A-Z]{2,8}-\d{2,6})\b/)?.[0];
    const lower = line.toLowerCase();
    let category: ExecutionErrorCategory = 'UNKNOWN';
    if (/typescript|ts\d{3,5}|type error/.test(lower)) category = 'TYPE';
    else if (/syntaxerror|unexpected token|parse error/.test(lower)) category = 'SYNTAX';
    else if (/eslint|lint/.test(lower)) category = 'LINT';
    else if (/test failed|failing|assertion|vitest|jest|mocha/.test(lower) || taskType === 'RUN_TEST') category = 'TEST';
    else if (/vite|build failed|bundl|rollup|esbuild/.test(lower) || taskType === 'RUN_BUILD') category = 'BUILD';
    else if (/cannot find module|module not found|npm err|peer dep|dependency/.test(lower)) category = 'DEPENDENCY';
    else if (/env|config|configuration/.test(lower)) category = 'CONFIG';
    else if (/exception|runtime|referenceerror|typeerror/.test(lower)) category = 'RUNTIME';
    results.push({ file: match?.[1], line: lineNumber ? Number(lineNumber) : undefined, column: columnNumber ? Number(columnNumber) : undefined, code, message: line.trim().slice(0, 600), category, suggestedAction: category === 'TYPE' ? 'เปิดไฟล์ตาม line/column และแก้ type mismatch ก่อนรัน validation ซ้ำ' : category === 'DEPENDENCY' ? 'ตรวจ package.json และ dependencies โดยไม่ติดตั้งอัตโนมัติ' : category === 'TEST' ? 'ตรวจ failing assertion และแก้เฉพาะไฟล์ที่เกี่ยวข้อง' : undefined });
    if (results.length >= 20) break;
  }
  return results;
}
