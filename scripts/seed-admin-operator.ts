import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { Wilayah } from '@prisma/client';

async function seedAdminOperator() {
  try {
    console.log('Setting up admin and operator accounts...');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!existingAdmin) {
      // Create admin account
      const adminPassword = await bcrypt.hash('admin123', 10);
      const admin = await prisma.user.create({
        data: {
          nip: '196501010001010001', // 18 digit NIP untuk admin
          name: 'Administrator',
          email: 'admin@propangkat.local',
          password: adminPassword,
          role: 'ADMIN',
          mustChangePassword: false
        }
      });
      console.log('✓ Admin account created:', admin.email);
    } else {
      // Update existing admin with new NIP format
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          nip: '196501010001010001',
          name: 'System Administrator',
          email: 'admin@propangkat.local'
        }
      });
      console.log('✓ Admin account updated with new NIP format');
    }

    // Create operators for each wilayah if they don't exist
    const wilayahOperators = [
      {
        wilayah: 'BALIKPAPAN_PPU',
        nip: '196501010002010001', // 18 digit NIP
        name: 'Operator Balikpapan & PPU',
        email: 'operator.balikpapan@propangkat.local'
      },
      {
        wilayah: 'KUTIM_BONTANG',
        nip: '196501010002020001', // 18 digit NIP
        name: 'Operator Kutai Timur & Bontang',
        email: 'operator.kutim@propangkat.local'
      },
      {
        wilayah: 'KUKAR',
        nip: '196501010002030001', // 18 digit NIP
        name: 'Operator Kutai Kartanegara',
        email: 'operator.kukar@propangkat.local'
      },
      {
        wilayah: 'KUBAR_MAHULU',
        nip: '196501010002040001', // 18 digit NIP
        name: 'Operator Kutai Barat & Mahakam Ulu',
        email: 'operator.kubar@propangkat.local'
      },
      {
        wilayah: 'PASER',
        nip: '196501010002050001', // 18 digit NIP
        name: 'Operator Paser',
        email: 'operator.paser@propangkat.local'
      },
      {
        wilayah: 'BERAU',
        nip: '196501010002060001', // 18 digit NIP
        name: 'Operator Berau',
        email: 'operator.berau@propangkat.local'
      },
      {
        wilayah: 'SAMARINDA',
        nip: '196501010002070001', // 18 digit NIP
        name: 'Operator Samarinda',
        email: 'operator.samarinda@propangkat.local'
      }
    ];

    for (const operatorData of wilayahOperators) {
      const existingOperator = await prisma.user.findFirst({
        where: { 
          OR: [
            { nip: operatorData.nip },
            { email: operatorData.email }
          ]
        }
      });

      if (!existingOperator) {
        const operatorPassword = await bcrypt.hash('operator123', 10);
        const operator = await prisma.user.create({
          data: {
            nip: operatorData.nip,
            name: operatorData.name,
            email: operatorData.email,
            password: operatorPassword,
            role: 'OPERATOR',
            wilayah: operatorData.wilayah as Wilayah,
            mustChangePassword: true
          }
        });
        console.log(`✓ Operator created for ${operatorData.wilayah}:`, operator.email);
      } else {
        // Update existing operator with new NIP format
        const operator = await prisma.user.update({
          where: { id: existingOperator.id },
          data: {
            nip: operatorData.nip,
            name: operatorData.name,
            email: operatorData.email,
            wilayah: operatorData.wilayah as Wilayah
          }
        });
        console.log(`✓ Operator updated for ${operatorData.wilayah}:`, operator.email);
      }
    }

    // Create sample unit kerja
    const sampleUnitKerja = [
      {
        nama: 'SD Negeri 1 Samarinda',
        npsn: '12345678',
        jenjang: 'SD/MI',
        wilayah: 'SAMARINDA',
        alamat: 'Jl. Contoh No. 1, Samarinda',
        kepalaSekolah: 'Contoh Kepala Sekolah'
      },
      {
        nama: 'SMP Negeri 1 Balikpapan', 
        npsn: '87654321',
        jenjang: 'SMP/MTs',
        wilayah: 'BALIKPAPAN_PPU',
        alamat: 'Jl. Contoh No. 2, Balikpapan',
        kepalaSekolah: 'Contoh Kepala SMP'
      },
      {
        nama: 'Dinas Pendidikan Kutai Kartanegara',
        jenjang: 'Dinas Pendidikan',
        wilayah: 'KUKAR',
        alamat: 'Jl. Dinas No. 1, Tenggarong'
      }
    ];

    for (const unitData of sampleUnitKerja) {
      const existingUnit = await prisma.unitKerja.findUnique({
        where: { nama: unitData.nama }
      });

      if (!existingUnit) {
        const unit = await prisma.unitKerja.create({
          data: {
            nama: unitData.nama,
            npsn: unitData.npsn,
            jenjang: unitData.jenjang,
            wilayah: unitData.wilayah as Wilayah,
            alamat: unitData.alamat,
            kepalaSekolah: unitData.kepalaSekolah
          }
        });
        console.log(`✓ Unit Kerja created:`, unit.nama);
      } else {
        console.log(`✓ Unit Kerja already exists:`, unitData.nama);
      }
    }

    // Create sample operator unit kerja
    const unitKerjaForOperator = await prisma.unitKerja.findFirst({
      where: { nama: 'SD Negeri 1 Samarinda' }
    });

    if (unitKerjaForOperator) {
      const existingOpUnitKerja = await prisma.user.findFirst({
        where: { 
          role: 'OPERATOR_UNIT_KERJA',
          unitKerjaId: unitKerjaForOperator.id
        }
      });

      if (!existingOpUnitKerja) {
        const opUnitKerjaPassword = await bcrypt.hash('opunit123', 10);
        const opUnitKerja = await prisma.user.create({
          data: {
            nip: '196501010003010001', // 18 digit NIP untuk operator unit kerja
            name: 'Operator SD Negeri 1 Samarinda',
            email: 'operator.sdn1samarinda@propangkat.local',
            password: opUnitKerjaPassword,
            role: 'OPERATOR_UNIT_KERJA',
            unitKerjaId: unitKerjaForOperator.id,
            mustChangePassword: true
          }
        });
        console.log('✓ Operator Unit Kerja created:', opUnitKerja.email);
      } else {
        // Update existing operator unit kerja with new NIP format
        await prisma.user.update({
          where: { id: existingOpUnitKerja.id },
          data: {
            nip: '196501010003010001',
            name: 'Operator SD Negeri 1 Samarinda',
            email: 'operator.sdn1samarinda@propangkat.local'
          }
        });
        console.log('✓ Operator Unit Kerja updated with new NIP format');
      }
    }

    console.log('\n=== ACCOUNT SUMMARY ===');
    const allUsers = await prisma.user.findMany({
      select: {
        name: true,
        email: true,
        role: true,
        wilayah: true,
        unitKerja: {
          select: { nama: true }
        }
      },
      orderBy: { role: 'asc' }
    });

    console.log('\nCreated accounts:');
    allUsers.forEach(user => {
      let location = '';
      if (user.wilayah) location = ` - ${user.wilayah}`;
      if (user.unitKerja) location = ` - ${user.unitKerja.nama}`;
      
      console.log(`- ${user.role}: ${user.name} (${user.email})${location}`);
    });

    console.log('\n=== DEFAULT PASSWORDS ===');
    console.log('Admin: admin123');
    console.log('Operator: operator123');
    console.log('Operator Unit Kerja: opunit123');
    console.log('Note: Operators and Operator Unit Kerja will be required to change password on first login');

  } catch (error) {
    console.error('Error seeding admin and operator:', error);
    throw error;
  }
}

// Run the seed
seedAdminOperator()
  .then(() => {
    console.log('\nSeed completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
