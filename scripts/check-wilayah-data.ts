import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkWilayahData() {
  console.log('🔍 Checking operator and pegawai wilayah data...\n');

  try {
    // Check operator users and their wilayah
    const operators = await prisma.user.findMany({
      where: { role: 'OPERATOR' },
      select: { 
        name: true, 
        email: true, 
        wilayah: true,
        nip: true
      }
    });

    console.log('👥 Operator Users:');
    operators.forEach(op => {
      console.log(`   ${op.name} (${op.email || op.nip}): ${op.wilayah || 'NO WILAYAH'}`);
    });

    // Check pegawai by wilayah
    const wilayahStats = await prisma.user.groupBy({
      by: ['wilayah'],
      where: { 
        role: 'PEGAWAI',
        wilayah: { not: null }
      },
      _count: { id: true }
    });

    console.log('\n📊 Pegawai by Wilayah:');
    wilayahStats.forEach(w => {
      console.log(`   ${w.wilayah}: ${w._count.id} pegawai`);
    });

    // Check unit kerja by wilayah
    for (const wilayah of ['SAMARINDA', 'BALIKPAPAN_PPU', 'KUTIM_BONTANG', 'KUKAR']) {
      const unitKerjaInWilayah = await prisma.user.groupBy({
        by: ['unitKerja'],
        where: { 
          role: 'PEGAWAI',
          wilayah: wilayah,
          unitKerja: { not: null }
        },
        _count: { id: true }
      });

      console.log(`\n🏢 Unit Kerja di ${wilayah}:`);
      if (unitKerjaInWilayah.length === 0) {
        console.log('   (No unit kerja found)');
      } else {
        unitKerjaInWilayah.forEach(unit => {
          console.log(`   ${unit.unitKerja}: ${unit._count.id} pegawai`);
        });
      }
    }

    // Check for any problematic data
    const problematicData = await prisma.user.findMany({
      where: { 
        role: 'PEGAWAI',
        OR: [
          { wilayah: null },
          { unitKerja: null }
        ]
      },
      select: { name: true, unitKerja: true, wilayah: true }
    });

    if (problematicData.length > 0) {
      console.log('\n⚠️  Problematic Data (missing wilayah or unitKerja):');
      problematicData.forEach(p => {
        console.log(`   ${p.name}: ${p.unitKerja || 'NO UNIT'} (${p.wilayah || 'NO WILAYAH'})`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkWilayahData()
    .then(() => {
      console.log('\n✅ Data check completed!');
    })
    .catch(console.error);
}

export default checkWilayahData;
