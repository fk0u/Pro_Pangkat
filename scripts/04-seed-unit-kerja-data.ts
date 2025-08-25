import { PrismaClient, Role, Wilayah, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface UnitKerjaData {
  nama: string;
  jenjang: string;
  wilayah: Wilayah;
}

interface PegawaiData {
  nip: string;
  name: string;
  password: string;
  role: Role;
  unitKerja: string;
  wilayah: Wilayah;
  golongan: string;
  jabatan: string;
  jenisJabatan: string;
  email: string;
  phone: string;
  address?: string;
}

async function seedUnitKerjaData() {
  console.log('🌱 Seeding Unit Kerja data untuk testing halaman manajemen...');

  try {
    const salt = await bcrypt.genSalt(10);

    // Create Unit Kerja records first
    const unitKerjaData = [
      // SAMARINDA - SD
      { nama: 'SD Negeri 001 Samarinda', jenjang: 'SD', wilayah: 'SAMARINDA' },
      { nama: 'SD Negeri 002 Samarinda', jenjang: 'SD', wilayah: 'SAMARINDA' },
      // Add more unit kerja records as needed
    ];

    for (const unitKerja of unitKerjaData) {
      await prisma.unitKerja.upsert({
        where: { nama: unitKerja.nama },
        update: {},
        create: unitKerja,
      });
    }
    console.log('Created Unit Kerja records');

    // Data pegawai untuk berbagai unit kerja di berbagai wilayah
    const pegawaiData = [
      // SAMARINDA - SD
      {
        nip: '19850101201901001',
        name: 'Budi Santoso',
        password: await bcrypt.hash('19850101201901001', salt),
        role: 'PEGAWAI',
        unitKerjaNama: 'SD Negeri 001 Samarinda',
        wilayah: 'SAMARINDA',
        golongan: 'III/c',
        jabatan: 'Guru Madya',
        jenisJabatan: 'fungsional',
        email: 'budi.santoso@sdn001samarinda.sch.id',
        phone: '081234567001',
        address: 'Jl. Pangeran Antasari No. 1, Samarinda'
      },
      {
        nip: '19820215201902002',
        name: 'Siti Aminah',
        password: await bcrypt.hash('19820215201902002', salt),
        role: 'PEGAWAI',
        unitKerja: 'SD Negeri 001 Samarinda',
        wilayah: 'SAMARINDA',
        golongan: 'III/b',
        jabatan: 'Guru Muda',
        jenisJabatan: 'fungsional',
        email: 'siti.aminah@sdn001samarinda.sch.id',
        phone: '081234567002'
      },
      {
        nip: '19880305201903003',
        name: 'Ahmad Hidayat',
        password: await bcrypt.hash('19880305201903003', salt),
        role: 'PEGAWAI',
        unitKerja: 'SD Negeri 002 Samarinda',
        wilayah: 'SAMARINDA',
        golongan: 'III/a',
        jabatan: 'Guru Pertama',
        jenisJabatan: 'fungsional',
        email: 'ahmad.hidayat@sdn002samarinda.sch.id',
        phone: '081234567003'
      },

      // SAMARINDA - SMP
      {
        nip: '19870420201904004',
        name: 'Dewi Lestari',
        password: await bcrypt.hash('19870420201904004', salt),
        role: 'PEGAWAI',
        unitKerja: 'SMP Negeri 1 Samarinda',
        wilayah: 'SAMARINDA',
        golongan: 'III/c',
        jabatan: 'Guru Madya',
        jenisJabatan: 'fungsional',
        email: 'dewi.lestari@smpn1samarinda.sch.id',
        phone: '081234567004'
      },
      {
        nip: '19830512201905005',
        name: 'Eko Prasetyo',
        password: await bcrypt.hash('19830512201905005', salt),
        role: 'PEGAWAI',
        unitKerja: 'SMP Negeri 1 Samarinda',
        wilayah: 'SAMARINDA',
        golongan: 'IV/a',
        jabatan: 'Kepala Sekolah',
        jenisJabatan: 'struktural',
        email: 'eko.prasetyo@smpn1samarinda.sch.id',
        phone: '081234567005'
      },
      {
        nip: '19840610201906006',
        name: 'Rina Wulandari',
        password: await bcrypt.hash('19840610201906006', salt),
        role: 'PEGAWAI',
        unitKerja: 'SMP Negeri 2 Samarinda',
        wilayah: 'SAMARINDA',
        golongan: 'III/b',
        jabatan: 'Guru Muda',
        jenisJabatan: 'fungsional',
        email: 'rina.wulandari@smpn2samarinda.sch.id',
        phone: '081234567006'
      },

      // SAMARINDA - SMA
      {
        nip: '19860725201907007',
        name: 'Joko Widodo',
        password: await bcrypt.hash('19860725201907007', salt),
        role: 'PEGAWAI',
        unitKerja: 'SMA Negeri 1 Samarinda',
        wilayah: 'SAMARINDA',
        golongan: 'III/d',
        jabatan: 'Guru Madya',
        jenisJabatan: 'fungsional',
        email: 'joko.widodo@sman1samarinda.sch.id',
        phone: '081234567007'
      },
      {
        nip: '19890808201908008',
        name: 'Maya Sari',
        password: await bcrypt.hash('19890808201908008', salt),
        role: 'PEGAWAI',
        unitKerja: 'SMA Negeri 1 Samarinda',
        wilayah: 'SAMARINDA',
        golongan: 'III/a',
        jabatan: 'Guru Pertama',
        jenisJabatan: 'fungsional',
        email: 'maya.sari@sman1samarinda.sch.id',
        phone: '081234567008'
      },

      // SAMARINDA - SMK
      {
        nip: '19810920201909009',
        name: 'Dedi Kurniawan',
        password: await bcrypt.hash('19810920201909009', salt),
        role: 'PEGAWAI',
        unitKerja: 'SMK Negeri 1 Samarinda',
        wilayah: 'SAMARINDA',
        golongan: 'III/c',
        jabatan: 'Guru Madya',
        jenisJabatan: 'fungsional',
        email: 'dedi.kurniawan@smkn1samarinda.sch.id',
        phone: '081234567009'
      },

      // BALIKPAPAN_PPU - SMA
      {
        nip: '19831102201910010',
        name: 'Lisa Permata',
        password: await bcrypt.hash('19831102201910010', salt),
        role: 'PEGAWAI',
        unitKerja: 'SMA Negeri 3 Balikpapan',
        wilayah: 'BALIKPAPAN_PPU',
        golongan: 'III/b',
        jabatan: 'Guru Muda',
        jenisJabatan: 'fungsional',
        email: 'lisa.permata@sman3balikpapan.sch.id',
        phone: '081234567010'
      },
      {
        nip: '19871214201911011',
        name: 'Rudi Hermawan',
        password: await bcrypt.hash('19871214201911011', salt),
        role: 'PEGAWAI',
        unitKerja: 'SMA Negeri 3 Balikpapan',
        wilayah: 'BALIKPAPAN_PPU',
        golongan: 'IV/a',
        jabatan: 'Wakil Kepala Sekolah',
        jenisJabatan: 'struktural',
        email: 'rudi.hermawan@sman3balikpapan.sch.id',
        phone: '081234567011'
      },

      // BALIKPAPAN_PPU - SMK
      {
        nip: '19850326201912012',
        name: 'Indah Sari',
        password: await bcrypt.hash('19850326201912012', salt),
        role: 'PEGAWAI',
        unitKerja: 'SMK Negeri 1 Balikpapan',
        wilayah: 'BALIKPAPAN_PPU',
        golongan: 'III/c',
        jabatan: 'Guru Madya',
        jenisJabatan: 'fungsional',
        email: 'indah.sari@smkn1balikpapan.sch.id',
        phone: '081234567012'
      },

      // KUTIM_BONTANG - SMA
      {
        nip: '19880507201913013',
        name: 'Agus Setiawan',
        password: await bcrypt.hash('19880507201913013', salt),
        role: 'PEGAWAI',
        unitKerja: 'SMA Negeri 1 Bontang',
        wilayah: 'KUTIM_BONTANG',
        golongan: 'III/b',
        jabatan: 'Guru Muda',
        jenisJabatan: 'fungsional',
        email: 'agus.setiawan@sman1bontang.sch.id',
        phone: '081234567013'
      },

      // KUKAR - SD
      {
        nip: '19840618201914014',
        name: 'Nurul Hidayah',
        password: await bcrypt.hash('19840618201914014', salt),
        role: 'PEGAWAI',
        unitKerja: 'SD Negeri 001 Tenggarong',
        wilayah: 'KUKAR',
        golongan: 'III/a',
        jabatan: 'Guru Pertama',
        jenisJabatan: 'fungsional',
        email: 'nurul.hidayah@sdn001tenggarong.sch.id',
        phone: '081234567014'
      },

      // Tambahan untuk unit kerja yang sama (untuk testing statistik)
      {
        nip: '19860729201915015',
        name: 'Bambang Sutrisno',
        password: await bcrypt.hash('19860729201915015', salt),
        role: 'PEGAWAI',
        unitKerja: 'SMA Negeri 1 Samarinda',
        wilayah: 'SAMARINDA',
        golongan: 'III/b',
        jabatan: 'Guru Muda',
        jenisJabatan: 'fungsional',
        email: 'bambang.sutrisno@sman1samarinda.sch.id',
        phone: '081234567015'
      }
    ];

    // Create Unit Kerja records first
    const unitKerjas = [...new Set(pegawaiData.map(p => ({
      nama: p.unitKerja,
      jenjang: p.unitKerja?.split(' ')[0] ?? '', // Extract SD, SMP, SMA, SMK from the name
      wilayah: p.wilayah as Wilayah
    })))];

    for (const uk of unitKerjas) {
      if (uk.nama) {
        await prisma.unitKerja.upsert({
          where: { nama: uk.nama },
          update: {},
          create: {
            nama: uk.nama,
            jenjang: uk.jenjang,
            wilayah: uk.wilayah
          }
        });
      }
    }
    console.log(`Created ${unitKerjas.length} Unit Kerja records`);

    // Seed pegawai data
    let createdCount = 0;
    for (const pegawai of pegawaiData) {
      try {
        const { unitKerja: unitKerjaNama, ...userData } = pegawai;
        if (unitKerjaNama) {
          await prisma.user.upsert({
            where: { nip: pegawai.nip },
            update: {
              ...userData,
              role: userData.role as Role,
              wilayah: userData.wilayah as Wilayah,
              unitKerja: {
                connect: {
                  nama: unitKerjaNama
                }
              }
            },
            create: {
              ...userData,
              role: userData.role as Role,
              wilayah: userData.wilayah as Wilayah,
              unitKerja: {
                connect: {
                  nama: unitKerjaNama
                }
              }
            }
          });
          createdCount++;
          console.log(`✅ Created/updated: ${pegawai.name} (${unitKerjaNama})`);
        }
      } catch (error) {
        if (error instanceof Error) {
          console.log(`⚠️  Skipped ${pegawai.name}: ${error.message}`);
        } else {
          console.log(`⚠️  Skipped ${pegawai.name}: Unknown error`);
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`- Processed ${pegawaiData.length} pegawai records`);
    console.log(`- Successfully created/updated: ${createdCount} records`);

    // Show unit kerja statistics
    const unitKerjaSummary = await prisma.user.groupBy({
      by: ['unitKerjaId'],
      where: { 
        role: Role.PEGAWAI,
        unitKerjaId: { not: null }
      },
      _count: {
        _all: true
      }
    });

    // Get unit kerja details to show names instead of IDs
    const validUnitKerjaIds = unitKerjaSummary
      .map(s => s.unitKerjaId)
      .filter((id): id is string => id !== null);

    const unitKerjaDetails = await prisma.unitKerja.findMany({
      where: {
        id: {
          in: validUnitKerjaIds
        }
      }
    });

    console.log(`\n🏢 Unit Kerja Summary (${unitKerjaSummary.length} unique units):`);
    unitKerjaSummary
      .sort((a, b) => (b._count._all || 0) - (a._count._all || 0))
      .forEach(unit => {
        const ukName = unitKerjaDetails.find(uk => uk.id === unit.unitKerjaId)?.nama || 'Unknown';
        console.log(`   ${ukName}: ${unit._count._all} pegawai`);
      });

    // Show wilayah distribution
    const wilayahSummary = await prisma.user.groupBy({
      by: ['wilayah'],
      where: { 
        role: Role.PEGAWAI,
        wilayah: { not: null }
      },
      _count: {
        _all: true
      }
    });

    console.log(`\n🗺️  Wilayah Distribution:`);
    wilayahSummary.forEach(wilayah => {
      console.log(`   ${wilayah.wilayah}: ${wilayah._count._all} pegawai`);
    });

  } catch (error) {
    console.error('❌ Error seeding unit kerja data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedUnitKerjaData()
    .then(() => {
      console.log('✅ Unit Kerja seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Unit Kerja seeding failed:', error);
      process.exit(1);
    });
}

export default seedUnitKerjaData;
