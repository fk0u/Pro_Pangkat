# ProPangkat

ProPangkat adalah platform manajemen usulan kenaikan pangkat dengan fokus pada alur verifikasi lintas peran (Pegawai, Operator, Operator Sekolah, dan Admin), keamanan login berlapis, serta operasi backend yang siap dipantau.

## Highlights

- Next.js 16 + React 19 + Prisma + PostgreSQL.
- API docs berbasis OpenAPI + Swagger UI.
- Database explorer internal untuk inspeksi struktur data.
- Runtime monitor CLI + Web UI (CPU, RAM, Disk, status proses, log).
- Auth hardening: captcha signed token, throttle login/captcha, policy password lebih kuat.

## Tech Stack

- Frontend: Next.js App Router, React, Tailwind CSS.
- Backend: Next.js Route Handlers, Prisma ORM.
- Database: PostgreSQL.
- Auth Session: iron-session.
- Tooling: TypeScript, Turbo, Prisma Migrate/Seed.

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Copy template environment

```bash
cp .env.example .env
```

3. Generate prisma client

```bash
npm run db:generate
```

4. Recover local database (migration + seed + health check)

```bash
npm run db:recover
```

5. Run development server

```bash
npm run dev
```

## Runtime & Operations

- Production monitor mode:

```bash
npm run start
```

- Development monitor mode:

```bash
npm run start:devops
```

- Runtime monitor web UI: `http://localhost:3030`
- App URL: `http://localhost:3000`

## Database Commands

- Generate Prisma client: `npm run db:generate`
- Reset database: `npm run db:reset`
- Seed baseline data: `npm run db:seed`
- Seed sample data: `npm run db:sample`
- Health check: `npm run db:health`
- Full recovery pipeline: `npm run db:recover`
- Prisma Studio: `npm run db:studio`

## API & Data Docs

- Swagger UI: `/api-docs`
- OpenAPI JSON: `/openapi.json`
- Database UI: `/database-ui`

## Repository Map

- `app/`, `components/`, `lib/`, `hooks/`, `types/`: source code.
- `prisma/`: schema dan migrations.
- `scripts/`: automation, seed, operational utilities.
- `docs/waterfall/`: artefak delivery berbasis fase waterfall.
- `docs/reports/`: laporan implementasi historis.
- `archive/snapshots/`: snapshot non-runtime.

## Security Notes

- File environment sensitif tidak di-commit.
- Lihat `.env.example` untuk template konfigurasi aman.
- Endpoint debug dibatasi di environment non-development.
- Token captcha dan password reset memakai signed/hashed strategy.

## Documentation Index

- Waterfall docs: `docs/waterfall/README.md`
- Governance: `docs/governance/repository-structure.md`
- Recovery playbook: `docs/waterfall/06-maintenance/2026-03-18-backend-database-recovery-playbook-done.md`
- Delivery summary (Linear-ready): `docs/2026-03-18-linear-delivery-summary.md`

## Contributor Guidance

- Gunakan `.env.example` sebagai acuan lokal.
- Jangan commit data sensitif, kredensial, atau secret key.
- Untuk isu keamanan, buat laporan internal maintainer-only.
