# Repository Structure Standard

## Tujuan
Dokumen ini menjadi standar struktur repository agar kode aplikasi, artefak dokumentasi, dan file snapshot tidak tercampur.

## Struktur Utama
- `app/`, `components/`, `lib/`, `hooks/`, `types/`: source code runtime.
- `prisma/`: schema dan migrasi database.
- `scripts/`: automation script untuk setup/seed/support.
- `docs/waterfall/`: artefak fase Waterfall.
- `docs/reports/`: laporan implementasi/fix historis.
- `archive/snapshots/`: file backup/snapshot non-runtime (`.new`, `.bak`, `.backup`).

## Kebijakan
1. Dilarang menyimpan file `.new`, `.bak`, `.backup` di dalam folder source aktif.
2. Semua snapshot harus dipindahkan ke `archive/snapshots/`.
3. Laporan implementasi ditempatkan di `docs/reports/`.
4. Dokumen requirement/design/test harus berada di `docs/waterfall/`.
5. Perubahan struktur wajib memperbarui dokumen ini.
