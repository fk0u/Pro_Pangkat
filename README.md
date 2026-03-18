# ProPangkat

Repository aplikasi ProPangkat (Next.js + Prisma + PostgreSQL) dengan struktur dokumentasi yang dirapikan untuk mendukung metode Waterfall.

## Struktur Repository

- `app/`, `components/`, `lib/`, `hooks/`, `types/`: source code runtime.
- `prisma/`: schema dan migrasi database.
- `scripts/`: script setup, seed, dan utilitas.
- `docs/waterfall/`: artefak resmi per fase Waterfall.
- `docs/reports/`: laporan implementasi/fix historis.
- `archive/snapshots/`: file backup non-runtime (`.new`, `.bak`, `.backup`).

## Waterfall Workspace

- Inisiasi: `docs/waterfall/01-initiation/`
- Requirement: `docs/waterfall/02-requirements/`
- Design: `docs/waterfall/03-design/`
- Implementation: `docs/waterfall/04-implementation/`
- Verification: `docs/waterfall/05-verification/`
- Maintenance: `docs/waterfall/06-maintenance/`

Lihat panduan lengkap di `docs/waterfall/README.md` dan kebijakan struktur di `docs/governance/repository-structure.md`.

## Menjalankan Proyek

1. Install dependency:
	- `npm install`
2. Generate Prisma Client:
	- `npx prisma generate`
3. Jalankan aplikasi:
	- `npm run dev`
4. Build produksi:
	- `npm run build`
5. Jalankan mode operasional (app + monitor CLI + web UI monitor):
	- `npm run start`

## API Dan Database Docs

- Swagger UI: `/api-docs`
- OpenAPI JSON: `/openapi.json`
- Database Web UI (ringkasan tabel): `/database-ui`
- Prisma Studio (data editor): jalankan `npm run db:studio` lalu buka URL yang diberikan Prisma Studio.

## Runtime Monitor (CLI + Web UI)

- Command utama: `npm run start`
- App URL: `http://localhost:3000`
- Monitor Web UI: `http://localhost:3030`
- Endpoint monitor:
	- `GET /api/metrics`
	- `GET /api/logs?limit=250`

Catatan:
- Default mode start adalah production (`next start`), pastikan sudah `npm run build`.
- Untuk mode development dengan monitor: `npm run start:devops`.

## Catatan Operasional

- Gunakan `archive/snapshots/` untuk menyimpan file eksperimen atau backup.
- Hindari menyimpan file snapshot di folder source aktif.
- Simpan bukti uji dan sign-off di fase verification sebelum rilis.
