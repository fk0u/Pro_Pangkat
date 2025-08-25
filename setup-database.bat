@echo off
echo Creating database and running migrations...

echo.
echo Step 1: Running migrations...
npx prisma migrate deploy

echo.
echo Step 2: Generating Prisma client...
npx prisma generate

echo.
echo Step 3: Running seed scripts...
npx prisma migrate dev

echo.
echo Step 2: Generating Prisma client...
npx prisma generate

echo.
echo Step 3: Running seed scripts...

REM Base setup and roles
echo    3.1: Setting up base data and roles...
npx tsx scripts/01-seed.ts
npx tsx scripts/setup-roles-permissions.ts

REM Document and timeline requirements
echo    3.2: Setting up document and timeline requirements...
npx tsx scripts/seed-document-requirements.ts
npx tsx scripts/02-seed-timeline.ts
npx tsx scripts/03-seed-timeline-operator.ts

REM Wilayah (region) setup
echo    3.3: Setting up wilayah data...
npx tsx scripts/09-seed-wilayah-master.ts
npx tsx scripts/10-fix-wilayah-balikpapan.ts

REM Unit Kerja (organizational units) setup
echo    3.4: Setting up unit kerja data...
npx tsx scripts/04-seed-unit-kerja-data.ts
npx tsx scripts/06-complete-unit-kerja-setup.ts

REM Operator accounts
echo    3.5: Setting up operator accounts...
npx tsx scripts/05-create-operator-dinas-kota.ts
npx tsx scripts/seed-operator-sekolah-enhanced.ts

REM System settings
echo    3.6: Configuring system settings...
npx tsx scripts/08-seed-system-settings.ts

REM Sample data (optional)
echo    3.7: Adding sample data...
npx tsx scripts/08-add-sample-pegawai.ts
npx tsx scripts/09-add-sample-proposals.ts

REM Final cleanup
echo    3.8: Running final cleanup...
npx tsx scripts/07-complete-cleanup.ts

echo.
echo Database setup completed!
echo.
echo Default users created:
echo - Admin: NIP = 000000000000000001, Password = 000000000000000001
echo - Sample Pegawai: NIP = 198501012010011001, Password = 198501012010011001
echo - 7 Operator users with NIP as passwords
echo.
echo Please change default passwords after first login!

pause
