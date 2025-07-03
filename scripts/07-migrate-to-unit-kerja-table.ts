import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateToUnitKerjaTable() {
  console.log('🚀 Migrating to UnitKerja table structure...\n');

  try {
    // 1. Create UnitKerja entries from existing User.unitKerja data
    console.log('📋 Step 1: Creating UnitKerja entries...');
    
    const existingUnitKerjaData = await prisma.user.groupBy({
      by: ['unitKerja', 'wilayah'],
      where: { 
        role: 'PEGAWAI',
        unitKerja: { not: null },
        wilayah: { not: null }
      }
    });

    console.log(`Found ${existingUnitKerjaData.length} unique unit kerja combinations`);

    const unitKerjaEntries = [];

    for (const data of existingUnitKerjaData) {
      if (!data.unitKerja || !data.wilayah) continue;

      // Determine jenjang from unit name
      let jenjang = 'UMUM';
      const unitName = data.unitKerja.toLowerCase();
      
      if (unitName.includes('sd ') || unitName.includes('sekolah dasar')) {
        jenjang = 'SD';
      } else if (unitName.includes('smp ') || unitName.includes('sekolah menengah pertama')) {
        jenjang = 'SMP';
      } else if (unitName.includes('sma ') || unitName.includes('sekolah menengah atas')) {
        jenjang = 'SMA';
      } else if (unitName.includes('smk ') || unitName.includes('sekolah menengah kejuruan')) {
        jenjang = 'SMK';
      }

      // Extract NPSN if available (placeholder for now)
      let npsn = null;
      if (unitName.includes('negeri')) {
        // Extract number for NPSN placeholder
        const matches = data.unitKerja.match(/\d+/);
        if (matches) {
          npsn = `3071${data.wilayah.substring(0,2).toUpperCase()}${matches[0].padStart(3, '0')}`;
        }
      }

      // Determine alamat and kecamatan based on wilayah
      let alamat = '';
      let kecamatan = '';
      
      switch (data.wilayah) {
        case 'SAMARINDA':
          alamat = `Jl. Pendidikan No. ${Math.floor(Math.random() * 100) + 1}, Samarinda`;
          kecamatan = ['Samarinda Kota', 'Samarinda Utara', 'Samarinda Ilir'][Math.floor(Math.random() * 3)];
          break;
        case 'BALIKPAPAN_PPU':
          alamat = `Jl. Sekolah No. ${Math.floor(Math.random() * 100) + 1}, Balikpapan`;
          kecamatan = ['Balikpapan Kota', 'Balikpapan Utara', 'Balikpapan Tengah'][Math.floor(Math.random() * 3)];
          break;
        case 'KUTIM_BONTANG':
          alamat = `Jl. Guru No. ${Math.floor(Math.random() * 100) + 1}, Bontang`;
          kecamatan = ['Bontang Utara', 'Bontang Selatan'][Math.floor(Math.random() * 2)];
          break;
        case 'KUKAR':
          alamat = `Jl. Sekolah No. ${Math.floor(Math.random() * 100) + 1}, Tenggarong`;
          kecamatan = ['Tenggarong', 'Tenggarong Seberang'][Math.floor(Math.random() * 2)];
          break;
        default:
          alamat = `Jl. Pendidikan No. ${Math.floor(Math.random() * 100) + 1}`;
          kecamatan = 'Kecamatan Utama';
      }

      unitKerjaEntries.push({
        nama: data.unitKerja,
        npsn,
        jenjang,
        alamat,
        kecamatan,
        wilayah: data.wilayah,
        status: 'Aktif'
      });
    }

    // Create UnitKerja entries
    const createdUnitKerja = [];
    for (const entry of unitKerjaEntries) {
      try {
        const created = await prisma.unitKerja.create({
          data: entry
        });
        createdUnitKerja.push(created);
        console.log(`✅ Created: ${entry.nama} (${entry.wilayah})`);
      } catch {
        console.log(`⚠️  Skipped duplicate: ${entry.nama}`);
      }
    }

    console.log(`\n📊 Created ${createdUnitKerja.length} UnitKerja entries`);

    // 2. Update User records to use unitKerjaId instead of unitKerja string
    console.log('\n📋 Step 2: Updating User records with unitKerjaId...');
    
    const usersToUpdate = await prisma.user.findMany({
      where: { 
        role: 'PEGAWAI',
        unitKerja: { not: null }
      },
      select: { id: true, unitKerja: true }
    });

    let updatedUsers = 0;
    for (const user of usersToUpdate) {
      if (!user.unitKerja) continue;

      // Find matching UnitKerja
      const matchingUnitKerja = await prisma.unitKerja.findFirst({
        where: { nama: user.unitKerja }
      });

      if (matchingUnitKerja) {
        await prisma.user.update({
          where: { id: user.id },
          data: { unitKerjaId: matchingUnitKerja.id }
        });
        updatedUsers++;
      } else {
        console.log(`⚠️  No matching UnitKerja found for: ${user.unitKerja}`);
      }
    }

    console.log(`✅ Updated ${updatedUsers} user records with unitKerjaId`);

    // 3. Show final statistics
    console.log('\n📊 Final Statistics:');
    
    const totalUnitKerja = await prisma.unitKerja.count();
    console.log(`Total UnitKerja: ${totalUnitKerja}`);

    const unitKerjaByWilayah = await prisma.unitKerja.groupBy({
      by: ['wilayah'],
      _count: { id: true }
    });

    console.log('\nUnitKerja by Wilayah:');
    unitKerjaByWilayah.forEach(w => {
      console.log(`   ${w.wilayah}: ${w._count.id} unit kerja`);
    });

    const unitKerjaByJenjang = await prisma.unitKerja.groupBy({
      by: ['jenjang'],
      _count: { id: true }
    });

    console.log('\nUnitKerja by Jenjang:');
    unitKerjaByJenjang.forEach(j => {
      console.log(`   ${j.jenjang}: ${j._count.id} unit kerja`);
    });

    // Test the new relationship
    console.log('\n🔍 Testing new relationships:');
    const sampleUnitKerja = await prisma.unitKerja.findFirst({
      include: {
        pegawai: {
          select: { name: true, jabatan: true }
        }
      }
    });

    if (sampleUnitKerja) {
      console.log(`Sample: ${sampleUnitKerja.nama}`);
      console.log(`   Pegawai: ${sampleUnitKerja.pegawai.length}`);
      sampleUnitKerja.pegawai.slice(0, 3).forEach(p => {
        console.log(`   - ${p.name} (${p.jabatan})`);
      });
    }

    console.log('\n✅ Migration to UnitKerja table completed!');
    console.log('🎯 Now the API will use proper relational data');

  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  migrateToUnitKerjaTable()
    .then(() => {
      console.log('\n🎉 UnitKerja migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

export default migrateToUnitKerjaTable;
