import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupWilayahData() {
  console.log('🧹 Cleaning up wilayah data inconsistencies...\n');

  try {
    // 1. Check current problematic data
    console.log('📊 Current data analysis:');
    
    const allPegawai = await prisma.user.findMany({
      where: { role: 'PEGAWAI' },
      select: { 
        id: true,
        name: true, 
        unitKerja: true, 
        wilayah: true,
        nip: true
      }
    });

    console.log(`Total pegawai: ${allPegawai.length}`);

    // Group by wilayah-unitKerja combination
    const combinations = allPegawai.reduce((acc, pegawai) => {
      const key = `${pegawai.wilayah || 'NULL'}_${pegawai.unitKerja || 'NULL'}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(pegawai);
      return acc;
    }, {} as Record<string, typeof allPegawai>);

    console.log('\n🔍 Current wilayah-unitKerja combinations:');
    Object.entries(combinations).forEach(([key, pegawaiList]) => {
      const [wilayah, unitKerja] = key.split('_');
      console.log(`   ${wilayah} - ${unitKerja}: ${pegawaiList.length} pegawai`);
    });

    // 2. Identify and fix inconsistent data
    console.log('\n🔧 Fixing inconsistent data...');

    const fixes = [
      // Fix Tenggarong schools to KUKAR
      {
        pattern: /tenggarong/i,
        correctWilayah: 'KUKAR',
        description: 'Tenggarong schools → KUKAR'
      },
      // Fix Balikpapan schools to BALIKPAPAN_PPU  
      {
        pattern: /balikpapan/i,
        correctWilayah: 'BALIKPAPAN_PPU',
        description: 'Balikpapan schools → BALIKPAPAN_PPU'
      },
      // Fix Samarinda schools to SAMARINDA
      {
        pattern: /samarinda/i,
        correctWilayah: 'SAMARINDA',
        description: 'Samarinda schools → SAMARINDA'
      },
      // Fix Bontang schools to KUTIM_BONTANG
      {
        pattern: /bontang/i,
        correctWilayah: 'KUTIM_BONTANG',
        description: 'Bontang schools → KUTIM_BONTANG'
      }
    ];

    for (const fix of fixes) {
      const affectedPegawai = allPegawai.filter(p => 
        p.unitKerja && fix.pattern.test(p.unitKerja) && p.wilayah !== fix.correctWilayah
      );

      if (affectedPegawai.length > 0) {
        console.log(`\n📝 ${fix.description}: ${affectedPegawai.length} pegawai`);
        
        for (const pegawai of affectedPegawai) {
          await prisma.user.update({
            where: { id: pegawai.id },
            data: { wilayah: fix.correctWilayah }
          });
          console.log(`   ✅ Fixed: ${pegawai.name} (${pegawai.unitKerja}) → ${fix.correctWilayah}`);
        }
      }
    }

    // 3. Show final results
    console.log('\n📊 Final results:');
    
    const finalWilayahStats = await prisma.user.groupBy({
      by: ['wilayah'],
      where: { 
        role: 'PEGAWAI',
        wilayah: { not: null }
      },
      _count: { id: true }
    });

    console.log('\nPegawai by Wilayah (after cleanup):');
    finalWilayahStats.forEach(w => {
      console.log(`   ${w.wilayah}: ${w._count.id} pegawai`);
    });

    // Show unit kerja by wilayah
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

    console.log('\n✅ Wilayah data cleanup completed!');
    console.log('🎯 Now test: http://localhost:3000/operator/unit-kerja');
    console.log('   → Balikpapan operator should only see Balikpapan schools');
    console.log('   → Samarinda operator should only see Samarinda schools');

  } catch (error) {
    console.error('❌ Error cleaning up data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  cleanupWilayahData()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Cleanup failed:', error);
      process.exit(1);
    });
}

export default cleanupWilayahData;
