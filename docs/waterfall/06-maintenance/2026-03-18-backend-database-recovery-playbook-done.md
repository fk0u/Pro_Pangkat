# Backend and Database Recovery Playbook

## Tujuan
Dokumen ini menjadi SOP pemulihan backend dan database ProPangkat ketika database lokal hilang atau reset.

## Sumber Kebenaran Data Struktur
- Prisma schema: `prisma/schema.prisma`
- Migration utama: `prisma/migrations/20250812024822_init/migration.sql`
- Seed baseline: `scripts/01-seed.ts`
- Seed sample transaksi: `scripts/02-sample-data.ts`

## Recovery Cepat (One Command)
Jalankan:

```bash
npm run db:recover
```

Script akan melakukan:
1. Generate Prisma Client
2. Reset database dan apply semua migration
3. Seed baseline
4. Seed sample data
5. Health check database

## Recovery Manual (Jika Perlu Step-by-Step)
```bash
npm run db:generate
npm run db:reset
npm run db:seed
npm run db:sample
npm run db:health
```

## Verifikasi Pasca Recovery
1. Buka monitor backend:
```bash
npm run start:devops
```
2. Cek API docs: `/api-docs`
3. Cek database web UI: `/database-ui`
4. Cek Prisma Studio:
```bash
npm run db:studio
```

## Hardening Operasional
- Gunakan `npm run db:health` sebagai pre-flight check sebelum demo/deploy.
- Simpan script recovery sebagai prosedur standar onboarding developer baru.
- Untuk data penting, tambah job backup harian PostgreSQL di level OS/CI.

## Kredensial Seed Dasar
- Admin default NIP: `000000000000000001`
- Password default seed menggunakan NIP masing-masing user.
- Setelah login pertama, user wajib ganti password (`mustChangePassword=true`).
