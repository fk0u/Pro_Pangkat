import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedTestPegawai() {
  console.log('🌱 Seeding test pegawai data for Unit Kerja testing...');

  try {
    const salt = await bcrypt.genSalt(10);

    // Test pegawai for SAMARINDA wilayah
    const samarindaPegawai = [
      {
        nip: '19850101201901001',
        name: 'Budi Santoso',
        password: await bcrypt.hash('19850101201901001', salt),
        role: 'PEGAWAI',
        unitKerja: 'SMA Negeri 1 Samarinda',
        wilayah: 'SAMARINDA',
        golongan: 'III/c',
        jabatan: 'Guru Madya',
        email: 'budi.santoso@sman1samarinda.sch.id',
        phone: '081234567001'
      },
      {
        nip: '19820215201902002',
        name: 'Siti Aminah',
        password: await bcrypt.hash('19820215201902002', salt),
        role: 'PEGAWAI',
        unitKerja: 'SMA Negeri 1 Samarinda',
        wilayah: 'SAMARINDA',
        golongan: 'III/b',
        jabatan: 'Guru Muda',
        email: 'siti.aminah@sman1samarinda.sch.id',
        phone: '081234567002'
      },
      {
        nip: '19880305201903003',
        name: 'Ahmad Hidayat',
        password: await bcrypt.hash('19880305201903003', salt),
        role: 'PEGAWAI',
        unitKerja: 'SMP Negeri 2 Samarinda',
        wilayah: 'SAMARINDA',
        golongan: 'III/a',
        jabatan: 'Guru Pertama',
        email: 'ahmad.hidayat@smpn2samarinda.sch.id',
        phone: '081234567003'
      },
      {
        nip: '19870420201904004',
        name: 'Dewi Lestari',
        password: await bcrypt.hash('19870420201904004', salt),
        role: 'PEGAWAI',
        unitKerja: 'SMP Negeri 2 Samarinda',
        wilayah: 'SAMARINDA',
        golongan: 'III/b',
        jabatan: 'Guru Muda',
        email: 'dewi.lestari@smpn2samarinda.sch.id',
        phone: '081234567004'
      },
      {
        nip: '19830512201905005',
        name: 'Eko Prasetyo',
        password: await bcrypt.hash('19830512201905005', salt),
        role: 'PEGAWAI',
        unitKerja: 'SD Negeri 001 Samarinda',
        wilayah: 'SAMARINDA',
        golongan: 'III/c',
        jabatan: 'Guru Madya',
        email: 'eko.prasetyo@sdn001samarinda.sch.id',
        phone: '081234567005'
      }
    ];

    // Test pegawai for BALIKPAPAN_PPU wilayah
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
        email: 'rina.wulandari@sman3balikpapan.sch.id',
        phone: '081234567006'
      },
      {
        nip: '19860725201907007',
        name: 'Joko Widodo',
        password: await bcrypt.hash('19860725201907007', salt),
        role: 'PEGAWAI',
        unitKerja: 'SMK Negeri 1 Balikpapan',
        wilayah: 'BALIKPAPAN_PPU',
        golongan: 'III/a',
        jabatan: 'Guru Pertama',
        email: 'joko.widodo@smkn1balikpapan.sch.id',
        phone: '081234567007'
      }
    ];

    // Test pegawai for KUTIM_BONTANG wilayah
    const kutimPegawai = [
      {
        nip: '19890808201908008',
        name: 'Maya Sari',
        password: await bcrypt.hash('19890808201908008', salt),
        role: 'PEGAWAI',
        unitKerja: 'SMA Negeri 1 Bontang',
        wilayah: 'KUTIM_BONTANG',
        golongan: 'III/a',
        jabatan: 'Guru Pertama',
        email: 'maya.sari@sman1bontang.sch.id',
        phone: '081234567008'
      }
    ];

    const allPegawai = [...samarindaPegawai, ...balikpapanPegawai, ...kutimPegawai];

    for (const pegawai of allPegawai) {
      await prisma.user.upsert({
        where: { nip: pegawai.nip },
        update: pegawai,
        create: pegawai
      });
      console.log(`✅ Created/updated pegawai: ${pegawai.name} at ${pegawai.unitKerja}`);
    }

    console.log('\n📊 Summary:');
    console.log(`- Created ${samarindaPegawai.length} pegawai for SAMARINDA`);
    console.log(`- Created ${balikpapanPegawai.length} pegawai for BALIKPAPAN_PPU`);
    console.log(`- Created ${kutimPegawai.length} pegawai for KUTIM_BONTANG`);
    console.log(`- Total: ${allPegawai.length} pegawai`);

    // Show unit kerja summary
    const unitKerjaSummary = await prisma.user.groupBy({
      by: ['unitKerja'],
      where: { 
        role: 'PEGAWAI',
        unitKerja: { not: null }
      },
      _count: { id: true }
    });

    console.log('\n🏢 Unit Kerja Summary:');
    unitKerjaSummary.forEach(unit => {
      console.log(`- ${unit.unitKerja}: ${unit._count.id} pegawai`);
    });

  } catch (error) {
    console.error('❌ Error seeding pegawai data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedTestPegawai()
  .then(() => {
    console.log('✅ Test pegawai seeding completed!');
  })
  .catch((error) => {
    console.error('💥 Pegawai seeding failed:', error);
    process.exit(1);
  });
