# Kebijakan Keamanan (Security Policy)

Dokumen ini menguraikan prosedur pelaporan dan penanganan celah keamanan (*vulnerability*) secara internal untuk lingkungan korporat **ProPangkat**.

## 🔒 Status Sistem (Proprietary & Closed Source)
Semua temuan, diskusi, evaluasi, hingga proses penambalan (*patching*) terkait keamanan sistem ini wajib dilakukan secara tertutup. Mengingat sifat data yang dikelola menyangkut data sensitif Pegawai Negeri Sipil (PNS), sangat dilarang keras untuk mempublikasikan detail kerentanan apapu ke forum eksternal atau publik.

## Versi yang Didukung (Supported Versions)

Saat ini, hanya rentang rilis berikut yang aktif dikelola dan menerima perbaikan peredaman serangan (*Security Patches*):

| Versi | Status Dukungan | Identifikasi | Prioritas Patch |
| ----- | --------------- | ------------ | --------------- |
| 1.0.x | ✅ Didukung     | Production   | **Kritis (Tingkat 1)** |
| < 1.0 | ❌ Tidak        | Alpha/Beta   | Menyesuaikan    |

## 🚨 Prosedur Pelaporan Celah Keamanan (Vulnerability Reporting)

**JANGAN PERNAH membuat *Issue* secara terbuka di repositori atau mengekspos temuan berupa *Proof of Concept* (PoC) ke pihak manapun yang tidak terotorisasi.**

Bagi seluruh *Tech Staff KILOUX*, perwakilan operasional klien, ataupun kontributor internal yang menemukan anomali keamanan (seperti kebocoran sesi kredensial, *bypass route*, XSS, SQLi, dsb), Anda **DIWAJIBKAN** menggunakan prosedur komunikasi darurat berikut:

1. **Email / Surel Darurat:** Segera laporkan insiden via email ke **security@kiloux.id**.
2. **Format Subjek:** `[URGENT SECURITY] ProPangkat - <Tipe Celah Keamanan>`
    - *Contoh:* `[URGENT SECURITY] ProPangkat - Token Bypass pada Endpoint Reset Katasandi`
3. **Komponen Isi Laporan:**
   - Gambaran jelas tentang bagaimana celah dapat dieksplotasi.
   - Langkah-langkah mereproduksi masalah atau *Proof of Concept* (PoC).
   - Dampak maksimum yang mungkin terjadi akibat celah tersebut.
   - (Jika mengerti), rekomendasi atau petunjuk baris program yang bermasalah.

### Service Level Agreement (SLA) & Respons
- **Waktu Tanggap Pertama:** Tim Infrastruktur dan Keamanan KILOUX akan mengonfirmasi via balasan email dalam waktu maksimal **1×24 Jam** setelah aduan masuk.
- **Tindak Lanjut Penambalan:** Temuan valid akan langsung ditekan *bypass* melalui manajemen tiket *Linear* dengan label **BLOCKER / HIGH PRIORITY**.
- **Notifikasi Rilis:** Anda akan dihubungi kembali secata personal begitu perbaikan (*hotfix*) telah selesai dimigrasi (*deploy*) ke server *production*.

---
*Perhatian:*
*Setiap kegagalan menjaga kerahasiaan *vulnerability* sebelum status *fixed* diterbitkan dan berpotensi memicu eksposur kejahatan siber pihak ketiga, akan diproses menjadi pelanggaran berat di bawah naungan **Non-Disclosure Agreement (NDA)** bagi pelakunya.*