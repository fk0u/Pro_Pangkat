# 🚀 UnitKerja Table Migration - Implementation Guide

## ✅ **Perubahan yang Sudah Dilakukan:**

### 1. **Database Schema Update**
- ✅ Added `UnitKerja` model to `prisma/schema.prisma`
- ✅ Updated `User` model to use `unitKerjaId` (foreign key)
- ✅ Added proper indexes and relationships

### 2. **API Modernization**
- ✅ Updated `/api/operator/unit-kerja/route.ts` to use UnitKerja table
- ✅ Proper relational queries instead of string grouping
- ✅ More efficient data fetching with includes

### 3. **Migration Script**
- ✅ Created `scripts/07-migrate-to-unit-kerja-table.ts`
- ✅ Automatic data migration from User.unitKerja to UnitKerja table
- ✅ Intelligent jenjang detection and NPSN generation

## 📋 **Execution Steps:**

### 1. Generate and Push Schema Changes
```bash
# Generate Prisma client with new schema
npx prisma generate

# Push schema changes to database  
npx prisma db push
```

### 2. Run Data Migration
```bash
# Migrate existing data to UnitKerja table
npx tsx scripts/07-migrate-to-unit-kerja-table.ts
```

### 3. Test New Implementation
```bash
# Start development server
pnpm dev

# Test operator unit kerja page
# http://localhost:3000/operator/unit-kerja
```

## 🎯 **Benefits of UnitKerja Table:**

### ✅ **Data Consistency**
- No more wilayah-unitKerja mismatches
- Proper normalization with foreign keys
- Centralized unit kerja management

### ✅ **Rich Data Model**
```typescript
interface UnitKerja {
  id: string
  nama: string        // School name
  npsn: string?       // National school number
  jenjang: string     // SD/SMP/SMA/SMK
  alamat: string?     // Full address
  kecamatan: string?  // Sub-district
  wilayah: Wilayah    // Region (enforced)
  status: string      // Active/Inactive
  pegawai: User[]     // Staff relation
}
```

### ✅ **Better API Performance**
```typescript
// BEFORE: String grouping + manual filtering
const units = await prisma.user.groupBy({
  by: ['unitKerja'],
  where: { role: 'PEGAWAI' }
})

// AFTER: Proper relational query
const units = await prisma.unitKerja.findMany({
  where: { wilayah: operator.wilayah },
  include: { pegawai: true }
})
```

### ✅ **Scalability**
- Easy to add more unit kerja fields (phone, email, kepala sekolah)
- Proper relationship management
- Better query optimization with indexes

## 🧪 **Expected Results After Migration:**

### Database Structure:
```sql
-- New UnitKerja table
SELECT nama, jenjang, wilayah, COUNT(pegawai) 
FROM UnitKerja 
LEFT JOIN User ON User.unitKerjaId = UnitKerja.id
GROUP BY UnitKerja.id;

-- Updated User table
SELECT name, unitKerjaId, wilayah 
FROM User 
WHERE role = 'PEGAWAI';
```

### API Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-unit-kerja",
      "nama": "SMA Negeri 1 Balikpapan",
      "npsn": "30710001",
      "jenjang": "SMA", 
      "alamat": "Jl. Sekolah No. 1, Balikpapan",
      "kecamatan": "Balikpapan Kota",
      "wilayah": "BALIKPAPAN_PPU",
      "status": "Aktif",
      "totalPegawai": 5,
      "totalUsulan": 3,
      "usulanAktif": 1
    }
  ],
  "summary": {
    "totalUnitKerja": 10,
    "totalPegawai": 45,
    "totalUsulan": 20,
    "unitAktif": 10
  }
}
```

## 🎉 **Status: Ready for Migration!**

Semua persiapan sudah selesai. Tinggal jalankan:
1. `npx prisma db push` 
2. `npx tsx scripts/07-migrate-to-unit-kerja-table.ts`
3. Test di `http://localhost:3000/operator/unit-kerja`

**Masalah wilayah inconsistency akan teratasi sepenuhnya!** 🚀
