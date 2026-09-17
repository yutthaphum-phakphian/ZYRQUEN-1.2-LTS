const fs = require('fs');
let code = fs.readFileSync('src/components/Navigation.tsx', 'utf-8');

code = code.replace(
  `  { id: 'admin-users', labelEn: 'RBAC Admin Console', labelTh: 'ระบบจัดการสิทธิ์ผู้ใช้งาน', icon: ShieldAlert as React.ElementType },`,
  `  { id: 'admin-users', labelEn: 'RBAC Admin Console', labelTh: 'ระบบจัดการสิทธิ์ผู้ใช้งาน', icon: ShieldAlert as unknown as React.FC<{ className?: string }>, dotColor: '#06B6D4' },`
);

fs.writeFileSync('src/components/Navigation.tsx', code);
