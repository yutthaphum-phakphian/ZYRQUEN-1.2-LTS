const fs = require('fs');
let code = fs.readFileSync('src/components/Navigation.tsx', 'utf-8');

code = code.replace(
  `  { id: 'settings', labelEn: 'Sovereign Configuration', labelTh: 'การตั้งค่าระบบผู้มีอำนาจสูงสุด', icon: Settings },`,
  `  { id: 'settings', labelEn: 'Sovereign Configuration', labelTh: 'การตั้งค่าระบบผู้มีอำนาจสูงสุด', icon: Settings },
  { id: 'admin-users', labelEn: 'RBAC Admin Console', labelTh: 'ระบบจัดการสิทธิ์ผู้ใช้งาน', icon: ShieldAlert },`
);

fs.writeFileSync('src/components/Navigation.tsx', code);
