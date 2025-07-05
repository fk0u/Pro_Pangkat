@echo off
echo.
echo ==============================================
echo Migrasi dan Setup Roles Permissions
echo ==============================================
echo.

echo Menjalankan migrasi database untuk roles dan permissions...
npx prisma migrate dev --name add_role_permissions

echo.
echo Menjalankan seed script untuk roles dan permissions...
npx ts-node scripts/setup-roles-permissions.ts

echo.
echo Setup selesai!
echo.
pause
