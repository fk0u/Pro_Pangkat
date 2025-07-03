@echo off
echo Creating database and running migrations...

echo.
echo Step 1: Creating database migration...
npx prisma migrate dev --name init

echo.
echo Step 2: Generating Prisma client...
npx prisma generate

echo.
echo Step 3: Running seed script...
npx tsx scripts/01-seed.ts

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
