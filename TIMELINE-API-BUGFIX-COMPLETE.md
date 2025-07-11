# Perbaikan API Timeline (Jadwal)

## Masalah

- API timeline pegawai tidak mengembalikan data timeline dengan benar
- Format respons dan struktur query tidak konsisten antar endpoint
- Kode lama yang tidak relevan masih ada di endpoint pegawai

## Solusi

### 1. Perbaikan Endpoint Pegawai Timeline

- Menghapus kode lama yang tidak relevan (proposals, activities, timelineData)
- Memperbaiki struktur OR conditions untuk lebih toleran dan fleksibel
- Menambahkan transformasi data yang lebih lengkap seperti:
  - Format tanggal ISO
  - Status timeline (active, expired, upcoming, completed)
  - Jumlah hari tersisa
  - Informasi wilayah
- Menambahkan fallback untuk mengambil semua timeline aktif jika tidak ada yang cocok
- Menambahkan logging untuk mempermudah debugging

### 2. Perbaikan Endpoint Shared Timeline

- Menambahkan logging untuk kondisi query
- Memperbaiki struktur OR conditions untuk lebih konsisten
- Menambahkan transformasi data yang lebih lengkap (sama seperti endpoint pegawai)
- Memastikan format respons konsisten dengan endpoint lain

### 3. Konsistensi Format Respons

Semua endpoint timeline sekarang menggunakan format respons yang konsisten:

```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "title": "...",
      "description": "...",
      "startDate": "2023-01-01T00:00:00.000Z",
      "endDate": "2023-12-31T23:59:59.999Z",
      "isActive": true,
      "priority": 1,
      "jabatanType": "all",
      "wilayah": "SAMARINDA",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z",
      "status": "active",
      "daysRemaining": 180,
      "wilayahInfo": {
        "nama": "SAMARINDA",
        "namaLengkap": "Samarinda"
      }
    }
  ],
  "message": "Berhasil memuat X timeline",
  "wilayah": "SAMARINDA",
  "unitKerja": "Dinas Pendidikan"
}
```

## Catatan Implementasi

- Implementasi mengikuti pola yang sudah ada di endpoint operator-sekolah yang berfungsi dengan baik
- Ditambahkan beberapa field tambahan seperti status dan daysRemaining untuk kebutuhan frontend
- Pencarian data timeline lebih toleran dengan menambahkan fallback jika tidak ditemukan timeline yang cocok
- Semua log sekarang memiliki prefix konsisten untuk mempermudah debugging

## Pengujian

- Pastikan timeline dapat diakses di halaman pegawai
- Verifikasi format data yang diterima sesuai dengan yang diharapkan frontend
