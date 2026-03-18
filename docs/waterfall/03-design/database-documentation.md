# Database Documentation

## Database
- Engine: PostgreSQL
- ORM: Prisma
- Schema file: `prisma/schema.prisma`
- Web UI explorer: `/database-ui`

## Core Tables
- `User`
- `UnitKerja`
- `PromotionProposal`
- `DocumentRequirement`
- `ProposalDocument`
- `ActivityLog`
- `Timeline`
- `DetailedDocumentInfo`
- `Notification`

## Main Relationships
- `User (pegawai/operator)` -> `PromotionProposal`
- `PromotionProposal` -> `ProposalDocument`
- `ProposalDocument` -> `DocumentRequirement`
- `User` -> `ActivityLog`
- `User` -> `Notification`

## Enumerations
- `Role`
- `StatusDokumen`
- `StatusProposal`
- `Wilayah`

## Operational Notes
- Prisma Studio dapat dijalankan dengan `npm run db:studio`.
- Endpoint metadata DB: `GET /api/database-explorer`.
- Untuk audit, perubahan skema wajib memperbarui dokumen ini dan SRS.
