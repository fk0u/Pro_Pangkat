@echo off
echo Migrating from PostgreSQL to MySQL...

echo.
echo Step 1: Backing up current Prisma schema...
copy prisma\schema.prisma prisma\schema.prisma.postgres.backup

echo.
echo Step 2: Updating Prisma schema to use MySQL...
echo Changing provider from postgresql to mysql
powershell -Command "(Get-Content prisma\schema.prisma) -replace 'provider = \"postgresql\"', 'provider = \"mysql\"' | Set-Content prisma\schema.prisma"

echo.
echo Step 3: Setting up MySQL connection string
echo Please update your .env file with MySQL connection details
echo Example: DATABASE_URL="mysql://username:password@localhost:3306/propangkat_db"
echo.
pause

echo.
echo Step 4: Running Prisma migrations
echo WARNING: This will reset your database! All existing data will be lost!
echo.
echo Press Ctrl+C to cancel or any key to continue...
pause

echo.
echo Running migrations...
npx prisma migrate reset --force
npx prisma migrate dev --name init_mysql

echo.
echo Step 5: Generating Prisma client...
npx prisma generate

echo.
echo Step 6: Running seed scripts...
npm run db:seed
npm run db:sample

echo.
echo Migration complete! Please test your application thoroughly.
echo Read PANDUAN-MIGRASI-MYSQL.md for more details and troubleshooting.
pause
