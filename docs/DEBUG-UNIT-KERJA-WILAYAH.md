# Debug Unit Kerja Wilayah Issue

## 🔍 Issue Analysis

**Problem**: Operator Balikpapan melihat sekolah dari Tenggarong (seharusnya hanya Balikpapan & PPU)

## 🔧 Root Cause Analysis

### 1. Check Operator Wilayah
```sql
SELECT name, email, wilayah, role FROM User WHERE role = 'OPERATOR';
```

### 2. Check Pegawai Data Consistency
```sql
SELECT DISTINCT wilayah, unitKerja, COUNT(*) as count 
FROM User 
WHERE role = 'PEGAWAI' AND unitKerja IS NOT NULL 
GROUP BY wilayah, unitKerja 
ORDER BY wilayah, unitKerja;
```

### 3. Expected Behavior
- Operator BALIKPAPAN_PPU should only see:
  - Unit kerja with pegawai having `wilayah = 'BALIKPAPAN_PPU'`
  - Schools like: SMA Negeri X Balikpapan, SMK Negeri X Balikpapan, etc.
  - NOT schools from Tenggarong (which should be KUKAR wilayah)

## 🛠️ Fixes Applied

### 1. API Filter Fix (`/app/api/operator/unit-kerja/route.ts`)
```typescript
// BEFORE: Filtered after grouping (inefficient + wrong)
const pegawaiWhere = {
  role: 'PEGAWAI',
  unitKerja: { not: null }
}

// AFTER: Filter by wilayah from the start
const pegawaiWhere = {
  role: 'PEGAWAI',
  unitKerja: { not: null },
  wilayah: user.wilayah  // ✅ Fixed: Filter by operator wilayah
}
```

### 2. Consistent Wilayah Filtering
```typescript
// Ensure all queries use operator's wilayah
const totalUsulan = await prisma.promotionProposal.count({
  where: {
    pegawai: {
      unitKerja: unitName,
      wilayah: user.wilayah  // ✅ Added wilayah filter
    }
  }
})
```

## 🧪 Testing Steps

### 1. Verify Operator Session
- Login as operator
- Check which wilayah the operator belongs to
- Verify API gets the correct wilayah

### 2. Test API Response
```bash
# Test the API directly (after login)
curl -b cookies.txt http://localhost:3000/api/operator/unit-kerja
```

### 3. Expected Results for BALIKPAPAN_PPU Operator
```json
{
  "data": [
    {
      "nama": "SMA Negeri 1 Balikpapan",
      "wilayah": "BALIKPAPAN_PPU"
    },
    {
      "nama": "SMK Negeri 2 Balikpapan", 
      "wilayah": "BALIKPAPAN_PPU"
    }
  ]
}
```

**Should NOT contain**: Any unit kerja from Tenggarong/KUKAR

## 🎯 Next Steps

1. **Test the fixed API** - Login as Balikpapan operator
2. **Verify data consistency** - Ensure pegawai have correct wilayah
3. **Clean up incorrect data** - Remove/fix any mismatched wilayah-unitKerja

**Status**: API logic fixed, ready for testing!
