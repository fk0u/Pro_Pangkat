# API Documentation Baseline

## Swagger UI
- URL: `/api-docs`
- OpenAPI spec source: `/openapi.json`

## API Catalog (Baseline)

### Auth
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Shared
- `GET /api/shared/periods`
- `GET /api/shared/timeline`

### Operator
- `GET /api/operator/unit-kerja`

### Admin
- `GET /api/admin/users`

### Database Utility
- `GET /api/database-explorer`

## Versioning
- Current version: `4.1.0`
- Strategy: major.minor.patch mengikuti release aplikasi.

## Audit Notes
- Semua endpoint baru wajib ditambahkan ke `/openapi.json`.
- Perubahan contract endpoint harus disinkronkan sebelum fase verification.
