# Perbaikan Akses URL Dokumen

## Status: ✅ FIXED

### Masalah yang Terjadi:
- URL yang digunakan untuk mengakses dokumen mengarah langsung ke `/uploads/documents/...` yang menyebabkan error 404
- Dokumen tidak dapat dilihat/dipreview melalui tampilan aplikasi

### Penyebab Masalah:
1. Link dokumen menggunakan field `fileUrl` dari database yang mengarah ke path fisik penyimpanan file
2. Seharusnya menggunakan URL API yang benar untuk preview dokumen: `/api/documents/{id}/preview`

### Solusi yang Diterapkan:
1. Mengubah semua referensi langsung ke `fileUrl` untuk preview dokumen menjadi endpoint API yang benar
2. Mempertahankan struktur penyimpanan file tetap di `/uploads/documents/...` (tidak perlu mengubah database)
3. Memastikan semua komponen menggunakan URL API yang benar untuk akses dokumen

### File yang Diperbaiki:
- `app/operator/inbox/inbox-client.tsx` - Memperbaiki URL preview dokumen

Dengan perbaikan ini, semua dokumen sekarang dapat diakses melalui endpoint API yang benar:
- Preview dokumen: `/api/documents/{id}/preview`
- Download dokumen: `/api/documents/{id}/download`

Perubahan ini juga memastikan semua fitur keamanan (autentikasi, otorisasi) diterapkan saat mengakses dokumen.
