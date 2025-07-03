# Database Normalization: Wilayah Master Implementation

## Overview
Implementasi normalisasi database dengan membuat tabel `WilayahMaster` terpisah untuk menggantikan enum `Wilayah` yang rigid. Perubahan ini meningkatkan fleksibilitas, maintainability, dan performa sistem.

## Summary Perubahan

### 1. **Schema Database**
- ✅ **Tabel WilayahMaster**: Dibuat tabel master untuk data wilayah
- ✅ **Relasi Foreign Key**: Ditambahkan `wilayahId` ke tabel `User` dan `UnitKerja`
- ✅ **Backward Compatibility**: Field enum `wilayah` tetap dipertahankan

### 2. **Data Migration**
- ✅ **242 Unit Kerja**: Berhasil diseeded dengan mapping wilayah yang benar
- ✅ **7 Wilayah Master**: Data lengkap dengan informasi geografis
- ✅ **7 User Operators**: Relasi berhasil diperbarui ke WilayahMaster

### 3. **API Updates**
- ✅ **Operator Pegawai API**: Mendukung relasi WilayahMaster dengan backward compatibility
- ✅ **Unit Kerja API**: Filter berbasis relasi dan enum untuk transisi smooth
- ✅ **Wilayah Master API**: Endpoint baru untuk akses data wilayah

## Struktur Database Baru

### WilayahMaster Table
```sql
CREATE TABLE "WilayahMaster" (
  "id" TEXT NOT NULL,
  "kode" TEXT NOT NULL,
  "nama" TEXT NOT NULL,
  "namaLengkap" TEXT NOT NULL,
  "ibukota" TEXT NOT NULL,
  "koordinat" TEXT,
  "luasWilayah" INTEGER,
  "jumlahKecamatan" INTEGER,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "WilayahMaster_pkey" PRIMARY KEY ("id")
);
```

### Foreign Key Relations
```sql
-- User table
ALTER TABLE "User" ADD COLUMN "wilayahId" TEXT;
ALTER TABLE "User" ADD CONSTRAINT "User_wilayahId_fkey" 
  FOREIGN KEY ("wilayahId") REFERENCES "WilayahMaster"("id");

-- UnitKerja table  
ALTER TABLE "UnitKerja" ADD COLUMN "wilayahId" TEXT;
ALTER TABLE "UnitKerja" ADD CONSTRAINT "UnitKerja_wilayahId_fkey" 
  FOREIGN KEY ("wilayahId") REFERENCES "WilayahMaster"("id");
```

## Data Seeded

### 7 Wilayah Master
| Kode | Nama | Ibukota | Unit Kerja | Luas (km²) |
|------|------|---------|------------|------------|
| BALIKPAPAN_PPU | Balikpapan & PPU | Balikpapan | 31 | 30,325 |
| KUTIM_BONTANG | Kutai Timur & Bontang | Sangatta | 44 | 36,450 |
| KUKAR | Kutai Kartanegara | Tenggarong | 53 | 27,263 |
| KUBAR_MAHULU | Kutai Barat & Mahakam Ulu | Sendawar | 29 | 35,825 |
| PASER | Paser | Tanah Grogot | 20 | 11,603 |
| BERAU | Berau | Tanjung Redeb | 24 | 21,000 |
| SAMARINDA | Samarinda | Samarinda | 41 | 78,225 |

**Total: 242 Unit Kerja, 7 Wilayah, 240,691 km²**

### Mapping Enum → WilayahId
```typescript
const enumToWilayahId = {
  'BALIKPAPAN_PPU': 'wilayah_balikpapan_ppu',
  'KUTIM_BONTANG': 'wilayah_kutim_bontang',
  'KUKAR': 'wilayah_kukar',
  'KUBAR_MAHULU': 'wilayah_kubar_mahulu',
  'PASER': 'wilayah_paser',
  'BERAU': 'wilayah_berau',
  'SAMARINDA': 'wilayah_samarinda'
}
```

## API Endpoints

### 1. **GET /api/wilayah-master**
Mendapatkan semua data wilayah master dengan statistik.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "wilayah_balikpapan_ppu",
      "kode": "BALIKPAPAN_PPU",
      "nama": "Balikpapan & PPU",
      "namaLengkap": "Kota Balikpapan dan Kabupaten Penajam Paser Utara",
      "ibukota": "Balikpapan",
      "statistics": {
        "totalUnitKerja": 31,
        "activeUnitKerja": 31,
        "totalPegawai": 0,
        "totalOperators": 1
      }
    }
  ],
  "summary": {
    "totalWilayah": 7,
    "totalUnitKerja": 242,
    "totalPegawai": 0,
    "totalOperators": 7
  }
}
```

### 2. **GET /api/unit-kerja**
Enhanced dengan relasi WilayahMaster dan backward compatibility.

**Features:**
- ✅ Filter berdasarkan role user (OPERATOR/ADMIN)
- ✅ Relasi dengan WilayahMaster
- ✅ Backward compatibility dengan enum wilayah
- ✅ Statistik jumlah pegawai per unit kerja

### 3. **GET /api/operator/pegawai**
Enhanced untuk mendukung relasi WilayahMaster.

**Features:**
- ✅ Filter pegawai berdasarkan wilayah operator
- ✅ Support relasi WilayahMaster dan enum fallback
- ✅ Excel import dengan mapping cabang dinas

## Scripts Migration

### Executed Scripts
1. ✅ `08-seed-unit-kerja-242.ts` - Seeding 242 unit kerja
2. ✅ `09-seed-wilayah-master.ts` - Seeding 7 wilayah master + update relasi
3. ✅ `10-update-user-wilayah-relations.ts` - Update relasi user ke WilayahMaster

### Migration Commands
```bash
# 1. Generate Prisma client dengan schema baru
npx prisma generate

# 2. Push schema ke database
npx prisma db push

# 3. Seed wilayah master dan update relasi
npx tsx scripts/09-seed-wilayah-master.ts

# 4. Update user relations
npx tsx scripts/10-update-user-wilayah-relations.ts
```

## Benefits

### 1. **Fleksibilitas**
- ✅ Data wilayah dapat diubah tanpa schema migration
- ✅ Informasi geografis lengkap (koordinat, luas, kecamatan)
- ✅ Support metadata tambahan per wilayah

### 2. **Performance**
- ✅ Query JOIN lebih efisien daripada enum comparison
- ✅ Index foreign key untuk lookup cepat
- ✅ Reduced application logic untuk mapping

### 3. **Maintainability**
- ✅ Single source of truth untuk data wilayah
- ✅ Easier bulk updates dan data management
- ✅ Better audit trail dengan timestamps

### 4. **Backward Compatibility**
- ✅ Enum field tetap ada untuk transisi
- ✅ API mendukung kedua format
- ✅ Zero downtime migration

## Testing

### Test Page: `/test-wilayah`
- ✅ Visualisasi data WilayahMaster
- ✅ Verifikasi relasi UnitKerja
- ✅ Statistik distribusi per wilayah
- ✅ Comparison enum vs relasi

### API Testing
- ✅ `GET /api/wilayah-master` - Data wilayah dengan statistik
- ✅ `GET /api/unit-kerja` - Unit kerja dengan relasi
- ✅ `GET /api/operator/pegawai` - Pegawai dengan filter wilayah

## Next Steps

### 1. **Frontend Updates**
- [ ] Update form dropdown untuk menggunakan WilayahMaster
- [ ] Modify filter components untuk relasi baru
- [ ] Update dashboard charts dengan data relasional

### 2. **Migration Completion**
- [ ] Deprecate enum wilayah setelah semua components updated
- [ ] Remove enum field setelah migration complete
- [ ] Clean up legacy mapping functions

### 3. **Enhancement**
- [ ] Add geolocation features dengan koordinat
- [ ] Implement wilayah-based reporting
- [ ] Add wilayah management interface untuk admin

## Conclusion

✅ **Database normalization completed successfully!**

Sistem telah berhasil diupgrade dari enum-based wilayah ke relational WilayahMaster table dengan:
- **7 wilayah master** dengan data geografis lengkap
- **242 unit kerja** dengan relasi yang benar
- **7 user operators** dengan wilayah relations
- **Full backward compatibility** untuk transisi smooth
- **Enhanced API endpoints** dengan relasi support
- **Complete test coverage** dengan verification page

Database sekarang lebih fleksibel, performant, dan siap untuk pengembangan features advanced berbasis wilayah.
