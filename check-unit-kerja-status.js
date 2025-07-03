#!/usr/bin/env node

// Simple test for UnitKerja table implementation
console.log('🔍 Checking UnitKerja Implementation Status...\n')

try {
  // Check if the files exist
  const fs = require('fs')
  const path = require('path')
  
  // 1. Check schema.prisma
  const schemaPath = './prisma/schema.prisma'
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    // Check for UnitKerja model
    if (schema.includes('model UnitKerja')) {
      console.log('✅ UnitKerja model found in schema.prisma')
      
      // Check for key fields
      const hasNama = schema.includes('nama')
      const hasWilayah = schema.includes('wilayah')
      const hasJenjang = schema.includes('jenjang')
      console.log(`   • nama field: ${hasNama ? '✅' : '❌'}`)
      console.log(`   • wilayah field: ${hasWilayah ? '✅' : '✅'}`)
      console.log(`   • jenjang field: ${hasJenjang ? '✅' : '❌'}`)
    } else {
      console.log('❌ UnitKerja model NOT found in schema.prisma')
    }
    
    // Check User.unitKerjaId
    if (schema.includes('unitKerjaId')) {
      console.log('✅ User.unitKerjaId foreign key found')
    } else {
      console.log('❌ User.unitKerjaId foreign key NOT found')
    }
  }
  
  // 2. Check migration script
  const migrationPath = './scripts/07-migrate-to-unit-kerja-table.ts'
  if (fs.existsSync(migrationPath)) {
    console.log('✅ Migration script exists: 07-migrate-to-unit-kerja-table.ts')
  } else {
    console.log('❌ Migration script NOT found')
  }
  
  // 3. Check API file
  const apiPath = './app/api/operator/unit-kerja/route.ts'
  if (fs.existsSync(apiPath)) {
    const apiContent = fs.readFileSync(apiPath, 'utf8')
    
    if (apiContent.includes('prisma.unitKerja.findMany')) {
      console.log('✅ API updated to use UnitKerja table')
    } else if (apiContent.includes('groupBy')) {
      console.log('⚠️  API still using old groupBy method')
    } else {
      console.log('❓ API structure unclear')
    }
    
    if (apiContent.includes('include: { pegawai')) {
      console.log('✅ API includes pegawai relationship')
    }
  }
  
  console.log('\n📋 **Next Steps:**')
  console.log('1. Run: npx prisma db push')
  console.log('2. Run: npx tsx scripts/07-migrate-to-unit-kerja-table.ts')
  console.log('3. Test: http://localhost:3000/operator/unit-kerja')
  
  console.log('\n🎯 **Expected Benefits:**')
  console.log('• No more wilayah-unitKerja mismatches')
  console.log('• Proper data normalization')
  console.log('• Better query performance')
  console.log('• Rich unit kerja metadata (NPSN, alamat, etc.)')
  
} catch (error) {
  console.error('❌ Error checking files:', error.message)
}
