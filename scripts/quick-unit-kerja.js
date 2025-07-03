const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function quickSeedUnitKerja() {
  console.log('🌱 Quick Unit Kerja seeding...');

  try {
    const salt = await bcrypt.genSalt(10);

    // Quick pegawai data untuk testing unit kerja
    const pegawaiData = [
      {
        nip: '19850101201901001',
        name: 'Budi Santoso',
        password: await bcrypt.hash('19850101201901001', salt),
        role: 'PEGAWAI',
        unitKerja: 'SMA Negeri 1 Samarinda',
        wilayah: 'SAMARINDA',
        golongan: 'III/c',
        jabatan: 'Guru Madya',
        jenisJabatan: 'fungsional',
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
        jenisJabatan: 'fungsional',
        email: 'siti.aminah@sman1samarinda.sch.id'
      },
      {
        nip: '19880305201903003',
        name: 'Ahmad Hidayat',
        password: await bcrypt.hash('19880305201903003', salt),
        role: 'PEGAWAI',
        unitKerja: 'SMP Negeri 1 Samarinda',
        wilayah: 'SAMARINDA',
        golongan: 'III/a',
        jabatan: 'Guru Pertama',
        jenisJabatan: 'fungsional',
        email: 'ahmad.hidayat@smpn1samarinda.sch.id'
      },
      {
        nip: '19870420201904004',
        name: 'Dewi Lestari',
        password: await bcrypt.hash('19870420201904004', salt),
        role: 'PEGAWAI',
        unitKerja: 'SD Negeri 001 Samarinda',
        wilayah: 'SAMARINDA',
        golongan: 'III/c',
        jabatan: 'Guru Madya',
        jenisJabatan: 'fungsional',
        email: 'dewi.lestari@sdn001samarinda.sch.id'
      },
      {
        nip: '19830512201905005',
        name: 'Eko Prasetyo',
        password: await bcrypt.hash('19830512201905005', salt),
        role: 'PEGAWAI',
        unitKerja: 'SMK Negeri 1 Samarinda',
        wilayah: 'SAMARINDA',
        golongan: 'IV/a',
        jabatan: 'Kepala Sekolah',
        jenisJabatan: 'struktural',
        email: 'eko.prasetyo@smkn1samarinda.sch.id'
      },
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
      }
    ];

    console.log('Creating pegawai...');
    for (const pegawai of pegawaiData) {
      await prisma.user.upsert({
        where: { nip: pegawai.nip },
        update: pegawai,
        create: pegawai
      });
      console.log(`✅ ${pegawai.name} (${pegawai.unitKerja})`);
    }

    // Create some proposals
    console.log('\nCreating proposals...');
    const pegawaiList = await prisma.user.findMany({
      where: { role: 'PEGAWAI' },
      select: { id: true, name: true },
      take: 4
    });

    const proposalData = [
      {
        periode: 'Agustus 2025',
        status: 'DIAJUKAN',
        pegawaiId: pegawaiList[0].id,
        targetGolongan: 'IV/a',
        targetJabatan: 'Guru Madya'
      },
      {
        periode: 'Agustus 2025', 
        status: 'DIPROSES_OPERATOR',
        pegawaiId: pegawaiList[1].id,
        targetGolongan: 'IV/a',
        targetJabatan: 'Guru Madya'
      },
      {
        periode: 'Agustus 2025',
        status: 'SELESAI',
        pegawaiId: pegawaiList[2].id,
        targetGolongan: 'IV/a',
        targetJabatan: 'Guru Madya'
      }
    ];

    for (const proposal of proposalData) {
      await prisma.promotionProposal.create({ data: proposal });
      console.log(`✅ Proposal for ${pegawaiList[proposalData.indexOf(proposal)].name}`);
    }

    // Show statistics
    const stats = await prisma.user.groupBy({
      by: ['unitKerja'],
      where: { role: 'PEGAWAI', unitKerja: { not: null } },
      _count: { id: true }
    });

    console.log('\n📊 Unit Kerja Statistics:');
    stats.forEach(s => console.log(`   ${s.unitKerja}: ${s._count.id} pegawai`));

    console.log('\n✅ Quick seeding completed!');
    console.log('🎯 Test at: http://localhost:3000/operator/unit-kerja');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

quickSeedUnitKerja();
