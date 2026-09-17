const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf-8');

code = code.replace(
  `export type ViewType =`,
  `export type ViewType =
  | 'admin-users'`
);

fs.writeFileSync('src/types.ts', code);
