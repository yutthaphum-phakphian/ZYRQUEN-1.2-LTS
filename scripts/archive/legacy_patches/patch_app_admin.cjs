const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

if (!code.includes("import { AdminUsersView }")) {
  code = code.replace(
    `import { ArchiveView } from './components/views/ArchiveView';`,
    `import { ArchiveView } from './components/views/ArchiveView';
import { AdminUsersView } from './components/views/AdminUsersView';`
  );
}

code = code.replace(
  `          {currentView === 'archive' && <ArchiveView />}`,
  `          {currentView === 'archive' && <ArchiveView />}
          {currentView === 'admin-users' && <AdminUsersView />}`
);

fs.writeFileSync('src/App.tsx', code);
