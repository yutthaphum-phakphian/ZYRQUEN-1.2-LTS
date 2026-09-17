const fs = require('fs');
let code = fs.readFileSync('src/components/Navigation.tsx', 'utf-8');

code = code.replace(
  `  { id: 'admin-users', labelEn: 'RBAC Admin Console', labelTh: 'ระบบจัดการสิทธิ์ผู้ใช้งาน', icon: ShieldAlert },`,
  `  { id: 'admin-users', labelEn: 'RBAC Admin Console', labelTh: 'ระบบจัดการสิทธิ์ผู้ใช้งาน', icon: ShieldAlert as React.ElementType },`
);

fs.writeFileSync('src/components/Navigation.tsx', code);
