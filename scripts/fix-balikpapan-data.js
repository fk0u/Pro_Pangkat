const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixBalikpapanData() {
  console.log('🔧 Fixing Balikpapan unit kerja data...');

  try {
    const salt = await bcrypt.genSalt(10);

    // Data pegawai untuk BALIKPAPAN_PPU dengan unit kerja yang benar
    const balikpapanPegawai = [
      {
        nip: '19840610201906006',
        name: 'Rina Wulandari',
        password: await bcrypt.hash('19840610201906006', salt),
        role: 'PEGAWAI',
        unitKerja: 'SMA Negeri 3 Balikpapan',
        wilayah: 'BALIKPAPAN_PPU',
        golongan: 'III/b',
        jabatan: 'Guru Muda',
        jenisJabatan: 'fungsional',
        email: 'rina.wulandari@sman3balikpapan.sch.id'
      },
      {
        nip: '19860725201907007',
        name: 'Joko Balikpapan',
        password: await bcrypt.hash('19860725201907007', salt),
        role: 'PEGAWAI',
        unitKerja: 'SMA Negeri 1 Balikpapan',
        wilayah: 'BALIKPAPAN_PPU',
        golongan: 'III/c',
        jabatan: 'Guru Madya',
        jenisJabatan: 'fungsional',
        email: 'joko.balikpapan@sman1balikpapan.sch.id'
      },
      {
        nip: '19880305201903013',
        name: 'Sari Balikpapan',
        password: await bcrypt.hash('19880305201903013', salt),
        role: 'PEGAWAI',
        unitKerja: 'SMP Negeri 5 Balikpapan',
        wilayah: 'BALIKPAPAN_PPU',
        golongan: 'III/a',
        jabatan: 'Guru Pertama',
        jenisJabatan: 'fungsional',
        email: 'sari.balikpapan@smpn5balikpapan.sch.id'
      },
      {
        nip: '19870420201904014',
        name: 'Agus Balikpapan',
        password: await bcrypt.hash('19870420201904014', salt),
        role: 'PEGAWAI',
        unitKerja: 'SD Negeri 010 Balikpapan',
        wilayah: 'BALIKPAPAN_PPU',
        golongan: 'III/b',
        jabatan: 'Guru Muda',
        jenisJabatan: 'fungsional',
        email: 'agus.balikpapan@sdn010balikpapan.sch.id'
      },
      {
        nip: '19830512201905015',
        name: 'Dewi Balikpapan',
        password: await bcrypt.hash('19830512201905015', salt),
        role: 'PEGAWAI',
        unitKerja: 'SMK Negeri 2 Balikpapan',
        wilayah: 'BALIKPAPAN_PPU',
        golongan: 'IV/a',
        jabatan: 'Kepala Sekolah',
        jenisJabatan: 'struktural',
        email: 'dewi.balikpapan@smkn2balikpapan.sch.id'
      }
    ];

    // Hapus data yang salah dari wilayah lain
    console.log('Cleaning up incorrect data...');
    
    // Update data yang benar
    console.log('Creating correct Balikpapan data...');
    for (const pegawai of balikpapanPegawai) {
      await prisma.user.upsert({
        where: { nip: pegawai.nip },
        update: pegawai,
        create: pegawai
      });
      console.log(`✅ ${pegawai.name} (${pegawai.unitKerja})`);
    }

    // Show current BALIKPAPAN_PPU data
    const balikpapanData = await prisma.user.findMany({
      where: { 
        role: 'PEGAWAI',
        wilayah: 'BALIKPAPAN_PPU'
      },
      select: { name: true, unitKerja: true, wilayah: true }
    });

    console.log('\n📊 Current BALIKPAPAN_PPU data:');
    balikpapanData.forEach(p => {
      console.log(`   ${p.name}: ${p.unitKerja} (${p.wilayah})`);
    });

    // Show unit kerja summary for BALIKPAPAN_PPU
    const unitKerjaSummary = await prisma.user.groupBy({
      by: ['unitKerja'],
      where: { 
        role: 'PEGAWAI',
        wilayah: 'BALIKPAPAN_PPU',
        unitKerja: { not: null }
      },
      _count: { id: true }
    });

    console.log('\n🏢 BALIKPAPAN_PPU Unit Kerja Summary:');
    unitKerjaSummary.forEach(unit => {
      console.log(`   ${unit.unitKerja}: ${unit._count.id} pegawai`);
    });

    console.log('\n✅ Balikpapan data fixed!');
    console.log('🎯 Test again at: http://localhost:3000/operator/unit-kerja');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBalikpapanData();
