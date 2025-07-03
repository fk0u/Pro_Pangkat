import { prisma } from '../lib/prisma'

async function testUnitKerjaAPI() {
  console.log('🧪 Testing UnitKerja API Implementation...\n')

  try {
    // 1. Check if UnitKerja table exists and has data
    console.log('1️⃣ Checking UnitKerja table...')
    const unitKerjaCount = await prisma.unitKerja.count()
    console.log(`   ✅ Found ${unitKerjaCount} unit kerja records`)

    if (unitKerjaCount > 0) {
      const sampleUnitKerja = await prisma.unitKerja.findFirst({
        include: {
          pegawai: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        }
      })
      console.log('   📄 Sample UnitKerja:')
      console.log(`      • Name: ${sampleUnitKerja?.nama}`)
      console.log(`      • Jenjang: ${sampleUnitKerja?.jenjang}`)
      console.log(`      • Wilayah: ${sampleUnitKerja?.wilayah}`)
      console.log(`      • Staff count: ${sampleUnitKerja?.pegawai.length}`)
    }

    // 2. Check User.unitKerjaId relationships
    console.log('\n2️⃣ Checking User-UnitKerja relationships...')
    const usersWithUnitKerja = await prisma.user.count({
      where: {
        role: 'PEGAWAI',
        unitKerjaId: { not: null }
      }
    })
    console.log(`   ✅ ${usersWithUnitKerja} PEGAWAI users linked to UnitKerja`)

    // 3. Test wilayah filtering (like the API does)
    console.log('\n3️⃣ Testing wilayah filtering...')
    const wilayahGroups = await prisma.unitKerja.groupBy({
      by: ['wilayah'],
      _count: { id: true }
    })
    console.log('   📊 UnitKerja by wilayah:')
    wilayahGroups.forEach(group => {
      console.log(`      • ${group.wilayah}: ${group._count.id} units`)
    })

    // 4. Test the actual API query logic
    console.log('\n4️⃣ Testing API query logic...')
    const testWilayah = 'BALIKPAPAN_PPU' // Example wilayah
    
    const unitKerjaData = await prisma.unitKerja.findMany({
      where: {
        wilayah: testWilayah,
        status: 'Aktif'
      },
      include: {
        pegawai: {
          select: {
            id: true,
            name: true,
            position: true,
            promotionProposals: {
              select: {
                id: true,
                status: true,
                createdAt: true
              }
            }
          }
        }
      },
      orderBy: {
        nama: 'asc'
      }
    })

    console.log(`   ✅ Found ${unitKerjaData.length} unit kerja for ${testWilayah}`)
    
    if (unitKerjaData.length > 0) {
      const sample = unitKerjaData[0]
      console.log(`   📄 Sample for ${testWilayah}:`)
      console.log(`      • ${sample.nama} (${sample.jenjang})`)
      console.log(`      • Staff: ${sample.pegawai.length}`)
      console.log(`      • Total proposals: ${sample.pegawai.reduce((acc, p) => acc + p.promotionProposals.length, 0)}`)
    }

    // 5. Generate summary statistics
    console.log('\n5️⃣ Summary statistics...')
    const totalUnits = await prisma.unitKerja.count()
    const totalPegawai = await prisma.user.count({ where: { role: 'PEGAWAI' } })
    const activeUnits = await prisma.unitKerja.count({ where: { status: 'Aktif' } })
    
    console.log(`   📊 Summary:`)
    console.log(`      • Total unit kerja: ${totalUnits}`)
    console.log(`      • Total pegawai: ${totalPegawai}`)
    console.log(`      • Active units: ${activeUnits}`)

    console.log('\n🎉 UnitKerja API test completed successfully!')

  } catch (error) {
    console.error('❌ Test failed:', error)
    
    // Check if it's a missing table error
    if (error.message.includes('relation "UnitKerja" does not exist')) {
      console.log('\n💡 Solution: Run database migration first:')
      console.log('   npx prisma db push')
      console.log('   npx tsx scripts/07-migrate-to-unit-kerja-table.ts')
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testUnitKerjaAPI()
