# Waterfall Workspace

Folder ini menjadi pusat artefak proyek berdasarkan metode Waterfall.

## Struktur Fase

- `01-initiation`: ruang lingkup, tujuan bisnis, stakeholder.
- `02-requirements`: kebutuhan fungsional/non-fungsional, use case, acceptance criteria.
- `03-design`: arsitektur, ERD, sequence, desain UI/UX, rancangan API.
- `04-implementation`: rencana sprint implementasi, task breakdown, changelog teknis.
- `05-verification`: test plan, test case, hasil uji, defect log, UAT.
- `06-maintenance`: incident log, patch plan, monitoring, retrospective.

## Aturan Kerja

1. Dokumen fase wajib disetujui sebelum lanjut ke fase berikutnya.
2. Setiap perubahan scope harus memperbarui dokumen fase 01 dan 02.
3. Semua keputusan teknis harus direkam di fase 03 sebelum coding besar.
4. Hasil coding harus menaut ke artefak fase 04 dan bukti uji fase 05.
5. Perubahan produksi harus dicatat di fase 06.
