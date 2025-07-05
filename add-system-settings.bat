@echo off
echo Running Prisma migrations to add system settings...

npx prisma migrate dev --name add_system_settings

echo Setting up initial system settings...
npx ts-node scripts/08-seed-system-settings.ts

echo Done!
