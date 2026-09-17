const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  `const VALID_VIEWS: ViewType[] = [`,
  `const VALID_VIEWS: ViewType[] = [
  'admin-users',`
);

fs.writeFileSync('src/App.tsx', code);
