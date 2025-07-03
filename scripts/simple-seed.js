const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedTestPegawai() {
  console.log('🌱 Seeding test pegawai data...');

  try {
    const salt = await bcrypt.genSalt(10);

    // Add some test pegawai
    const testPegawai = [
      {
        nip: '19850101201901001',
        name: 'Budi Santoso',
        password: await bcrypt.hash('19850101201901001', salt),
        role: 'PEGAWAI',
        unitKerja: 'SMA Negeri 1 Samarinda',
        wilayah: 'SAMARINDA',
        golongan: 'III/c',
        jabatan: 'Guru Madya',
        email: 'budi.santoso@sman1samarinda.sch.id'
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
        email: 'siti.aminah@sman1samarinda.sch.id'
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
        email: 'ahmad.hidayat@smpn2samarinda.sch.id'
      }
    ];

    for (const pegawai of testPegawai) {
      await prisma.user.upsert({
        where: { nip: pegawai.nip },
        update: pegawai,
        create: pegawai
      });
      console.log(`✅ Created: ${pegawai.name}`);
    }

    console.log('✅ Test pegawai seeding completed!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestPegawai();
