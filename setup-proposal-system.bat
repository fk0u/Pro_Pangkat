@echo off
echo Setting up the database for the Propangkat backend...

echo.
echo 1. Applying database migrations...
npx prisma migrate dev --name init

echo.
echo 2. Seeding document requirements...
npx ts-node scripts/seed-document-requirements.ts

echo.
echo 3. Seeding timeline data...
npx ts-node scripts/seed-timeline-data.ts

echo.
echo 4. Seeding proposal data...
npx ts-node scripts/seed-proposal-data.ts

echo.
echo Database setup completed successfully!
echo You can now run the application with: npm run dev
