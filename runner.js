const fs = require('fs');

function fixFile(f) {
  let c = fs.readFileSync(f, 'utf8');
  // Strip UTF-16 null bytes just in case
  c = c.replace(/\0/g, '');
  
  c = c.replace(/import\s+DashboardLayout\s+from/g, 'import { DashboardLayout } from');
  c = c.replace(/import\s+TwoFactorSetup\s+from/g, 'import { TwoFactorSetup } from');
  c = c.replace(/role="/g, 'userType="');
  fs.writeFileSync(f, c, 'utf8');
  console.log('Fixed:', f);
}

fixFile('app/admin/profil/page.tsx');
fixFile('app/operator/settings/page.tsx');
fixFile('app/operator-sekolah/settings/page.tsx');
fixFile('app/pegawai/settings/page.tsx');