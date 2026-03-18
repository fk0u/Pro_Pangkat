# 🔒 ProPangkat - Sistem Informasi Manajemen Usulan Kenaikan Pangkat

![Version](https://img.shields.io/badge/Version-4.1.0-blue.svg?cacheSeconds=2592000)
![Status](https://img.shields.io/badge/Status-active-success.svg?cacheSeconds=2592000)
![License](https://img.shields.io/badge/License-Closed%20Source-red.svg?cacheSeconds=2592000)
![Stack](https://img.shields.io/badge/Tech_Stack-Next.js%2016%20%7C%20React%2019%20%7C%20PostgreSQL-black)
![Security](https://img.shields.io/badge/Security-Audited-brightgreen.svg)
	
---

## 🛑 STRICTLY CONFIDENTIAL & PROPRIETARY

**Copyright © 2026 PT. Kilasan Otak Ulet dan Eksplorasi (KILOUX). All rights reserved.**

Repository ini, beserta seluruh kode sumber, desain antarmuka, algoritma, arsitektur database, dan aset terkait di dalamnya adalah hak milik penuh dari **Startup Agency KILOUX (PT. Kilasan Otak Ulet dan Eksplorasi)**.

Project ini dikembangkan secara eksklusif untuk klien kami:
1. **Dinas Pendidikan dan Kebudayaan Provinsi Kalimantan Timur**
2. **Badan Kepegawaian Daerah Provinsi Kalimantan Timur**

### ⚠️ PERINGATAN HUKUM (LEGAL WARNING)

Sistem ini bersifat **CLOSED SOURCE** dan **PRIVATE**.
Akses ke repository ini diawasi secara ketat dan HANYA diberikan kepada:
- Karyawan, Staff Teknis, dan Manajemen yang sah dari KILOUX.
- Perwakilan resmi yang ditunjuk dari Dinas Pendidikan dan Kebudayaan Provinsi Kalimantan Timur.
- Perwakilan resmi yang ditunjuk dari Badan Kepegawaian Daerah Provinsi Kalimantan Timur.

**DILARANG KERAS** untuk:
1. Mengunduh (download), menggandakan (clone/fork), atau mendistribusikan ulang kode sumber kepada pihak manapun yang tidak memiliki otorisasi tertulis.
2. Mempelajari balik (reverse engineering), memodifikasi, mengeksploitasi, atau menyalin baris kode dan keamanan sistem ini untuk kepentingan lain (komersial/non-komersial).
3. Membocorkan, memposting, atau menyebarluaskan aset, skema database, Endpoint API, file operasional, maupun _credentials_ dari sistem ini ke domain publik.

Segala bentuk pelanggaran terhadap ketentuan di atas akan diproses ke ranah hukum pidana dan perdata berdasarkan **Undang-Undang Hak Cipta & Kekayaan Intelektual (HKI)**, maupun **Undang-Undang Informasi dan Transaksi Elektronik (UU ITE)** Republik Indonesia yang berlaku, serta mengacu pada **Perjanjian Kerahasiaan (Non-Disclosure Agreement / NDA)** yang telah ditandatangani.

---

## 📖 Ringkasan Proyek

**ProPangkat** adalah platform kepegawaian super-ordinat yang dirancang untuk mendigitalisasi, memonitor, dan memverifikasi alur usulan kenaikan pangkat Aparatur Sipil Negara (ASN). Sistem ini menyediakan operasi lintas peran secara hierarkis (Pegawai -> Operator Sekolah -> Operator Cabang Dinas -> Admin Provinsi), integrasi data kepegawaian yang sangat berjenjang, serta pemantauan tata kelola administratif yang transparan dan *auditable*.

### Karakteristik & Infrastruktur:
- Arsitektur Keamanan Berlapis: Telah diimplementasikan proteksi *throttle request* berbasis IP (anti-brute force), regenerasi token Cryptographic (HMAC SHA-256) untuk *anti-replay attacks* (captcha & reset sandi), serta *stateful* HTTP-only Cookies menggunakan *Iron Session*.
- Data Confidentiality: Proses enkripsi *Bcrypt* untuk kredensial, pencegahan *enumeration attack*, dan pembatasan debug secara ketat di layer *production middleware*.
- Standardisasi Teknologi Modern: Digawangi oleh Next.js 16 (App Router), React 19, TypeScript mutakhir, serta manajemen data relasional yang presisi melalui Prisma ORM dan PostgreSQL.

---

## 🛠 Panduan Teknis KILOUX (Classified / Confidential)

Seksi ini hanya ditujukan untuk *Software Engineer* dan *DevOps Team* internal KILOUX.

### Prasyarat (*Prerequisites*):
- Node.js version 20.x ke atas.
- PostgreSQL Database Engine V15+
- Secret keys *Vault* untuk konfigurasi spesifik *environment* (hubungi Engineering Manager untuk token/credentials asli).

### Instalasi & Menjalankan (*Local Run*):
``bash
# 1. Unduh dependensinya
npm install

# 2. Buat file env, hubungi Lead Engineer untuk kredensial sensitif
# JANGAN PERNAH MENG-COMMIT IDENTITAS DATABASE KE REPOSITORY!
# (Jadikan .env.example sebagai acuan dasar kunci)
cp .env.example .env

# 3. Synchronize schema dan setup data hierarki
npm run db:recover

# 4. Angkat server ke mode development
npm run dev
``

### Operasi Skrip Lainnya:
- \
pm run start:devops\ - Menghidupkan *environment production-ready* dengan *Web UI Runtime Monitor (Port 3030)*.
- \
pm run db:health\ - Diagnostic cepat struktur & koneksi antara API dengan PostgreSQL.
- \
pm run db:sample\ - Menjalankan *script* injeksi data *dummy* internal yang berkesinambungan (Pegawai vs Unit Kerja).

---

## 📞 Escalation & Kontrol Akses

Apabila terdapat keperluan mendesak menyangkut audit aplikasi, eskalasi perbaikan celah, maupun izin *pull request* yang berkaitan dengan perubahan komponen di taraf *production*, silakan menghubungi unit di bawah ini:

- **Security & Infrastructure Team:** security@kiloux.id
- **KILOUX Technical Support:** app-support@kiloux.id
- Gunakan papan Linear internal KILOUX untuk menandai masalah (*ticketing system*).

---
*Dokumen ini bersifat rahasia dan merupakan properti tertutup yang sah dari PT. Kilasan Otak Ulet dan Eksplorasi (KILOUX).*
