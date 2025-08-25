# Panduan Migrasi dari PostgreSQL ke MySQL

Dokumen ini memberikan langkah-langkah untuk melakukan migrasi aplikasi dari PostgreSQL ke MySQL.

## Langkah 1: Persiapan

1. **Backup Database PostgreSQL**
   ```bash
   pg_dump -U postgres -d propangkat_db > propangkat_backup.sql
   ```

2. **Install MySQL** jika belum terinstall:
   - Unduh dan install MySQL Server dari https://dev.mysql.com/downloads/mysql/
   - Pastikan MySQL service berjalan

3. **Buat database baru di MySQL**
   ```sql
   CREATE DATABASE propangkat_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

## Langkah 2: Modifikasi Konfigurasi Prisma

1. **Edit file schema.prisma**:
   Ubah provider dari `postgresql` menjadi `mysql`:

   ```prisma
   datasource db {
     provider = "mysql"
     url      = env("DATABASE_URL")
   }
   ```

2. **Perbarui string koneksi di file .env**:
   Ganti string koneksi PostgreSQL dengan string koneksi MySQL:

   ```
   # Sebelum
   DATABASE_URL="postgresql://postgres:1@localhost:5432/propangkat_db"
   
   # Sesudah
   DATABASE_URL="mysql://root:password@localhost:3306/propangkat_db"
   ```
   
   Ganti `root` dengan username MySQL Anda, dan `password` dengan password MySQL Anda.

## Langkah 3: Memigrasi Schema dan Data

1. **Reset database dan buat ulang schema**:
   ```bash
   npx prisma migrate reset --force
   npx prisma migrate dev --name init
   ```

2. **Generate ulang Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Jalankan seed scripts**:
   ```bash
   npm run db:seed
   npm run db:sample
   ```

## Langkah 4: Penyesuaian Kode

Beberapa perbedaan antara PostgreSQL dan MySQL yang mungkin memerlukan penyesuaian:

1. **Case sensitivity**: MySQL case-sensitive pada nama table/kolom di sistem operasi tertentu
2. **JSON handling**: PostgreSQL memiliki dukungan JSON yang lebih kaya, MySQL mungkin memerlukan penyesuaian
3. **Text search**: Jika menggunakan fitur text search PostgreSQL, perlu dikonversi ke syntax MySQL
4. **Date/Time functions**: Fungsi tanggal/waktu bisa berbeda antara PostgreSQL dan MySQL

## Langkah 5: Pengujian

1. **Jalankan aplikasi dalam mode development**:
   ```bash
   npm run dev
   ```

2. **Uji seluruh fitur aplikasi** untuk memastikan semua berfungsi dengan benar

3. **Periksa error log** dan perbaiki masalah yang muncul

## Catatan Penting

- MySQL dan PostgreSQL memiliki perbedaan dalam hal tipe data, jadi perhatikan penggunaan UUID atau tipe data spesifik lainnya
- MySQL memiliki batasan panjang nama tabel dan kolom
- Perbedaan syntax untuk operasi khusus seperti LATERAL JOIN atau window functions

## Troubleshooting

Jika menemui error saat migrasi, cek:
- Kompatibilitas tipe data
- Perbedaan SQL syntax
- Koneksi database (username, password, port)
- Hak akses user database
