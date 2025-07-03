import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/password'

const prisma = new PrismaClient()

async function seedOperatorSekolahData() {
  try {
    console.log('🌱 Seeding operator sekolah test data...')

    // Create operator sekolah test user
    const operatorSekolah = await prisma.user.upsert({
      where: { nip: '197001011998031001' },
      update: {},
      create: {
        nip: '197001011998031001',
        name: 'Drs. Budi Santoso, M.Pd',
        email: 'operator.sekolah@smanegeri1balikpapan.sch.id',
        password: await hashPassword('password123'),
        role: 'OPERATOR_SEKOLAH',
        unitKerja: 'SMA Negeri 1 Balikpapan',
        wilayah: 'BALIKPAPAN_PPU',
        jabatan: 'Kepala Tata Usaha',
        jenisJabatan: 'Struktural',
        golongan: 'IV/a',
        tmtGolongan: new Date('2020-01-01'),
        phone: '081234567890',
        address: 'Jl. Pendidikan No. 1, Balikpapan',
        mustChangePassword: false,
      },
    })

    console.log('✅ Created operator sekolah:', operatorSekolah.name)

    // Create pegawai test data
    const pegawaiData = [
      {
        nip: '198501012010012001',
        name: 'Dr. Siti Aminah, S.Pd, M.Pd',
        email: 'siti.aminah@smanegeri1balikpapan.sch.id',
        jabatan: 'Guru Matematika',
        jenisJabatan: 'Guru',
        golongan: 'IV/a',
        tmtGolongan: new Date('2020-01-01'),
        phone: '081234567891',
        address: 'Jl. Pendidikan No. 10, Balikpapan',
      },
      {
        nip: '199203152015031002',
        name: 'Ahmad Wijaya, S.Pd',
        email: 'ahmad.wijaya@smanegeri1balikpapan.sch.id',
        jabatan: 'Guru Fisika',
        jenisJabatan: 'Guru',
        golongan: 'III/c',
        tmtGolongan: new Date('2018-01-01'),
        phone: '081234567892',
        address: 'Jl. Pendidikan No. 11, Balikpapan',
      },
      {
        nip: '198012102008012003',
        name: 'Dra. Fatimah, M.Pd',
        email: 'fatimah@smanegeri1balikpapan.sch.id',
        jabatan: 'Guru Bahasa Indonesia',
        jenisJabatan: 'Guru',
        golongan: 'IV/b',
        tmtGolongan: new Date('2015-01-01'),
        phone: '081234567893',
        address: 'Jl. Pendidikan No. 12, Balikpapan',
      },
      {
        nip: '199505202020121004',
        name: 'Muhammad Rizki, S.Kom',
        email: 'rizki@smanegeri1balikpapan.sch.id',
        jabatan: 'Staff IT',
        jenisJabatan: 'Tenaga Kependidikan',
        golongan: 'III/a',
        tmtGolongan: new Date('2021-01-01'),
        phone: '081234567894',
        address: 'Jl. Pendidikan No. 13, Balikpapan',
      },
      {
        nip: '198207082009122005',
        name: 'Sri Wahyuni, S.Pd',
        email: 'sri.wahyuni@smanegeri1balikpapan.sch.id',
        jabatan: 'Guru Kimia',
        jenisJabatan: 'Guru',
        golongan: 'III/d',
        tmtGolongan: new Date('2019-01-01'),
        phone: '081234567895',
        address: 'Jl. Pendidikan No. 14, Balikpapan',
      }
    ]

    const createdPegawai = []
    for (const data of pegawaiData) {
      const pegawai = await prisma.user.upsert({
        where: { nip: data.nip },
        update: {},
        create: {
          ...data,
          password: await hashPassword(data.nip), // Use NIP as default password
          role: 'PEGAWAI',
          unitKerja: 'SMA Negeri 1 Balikpapan',
          wilayah: 'BALIKPAPAN_PPU',
          mustChangePassword: true,
        },
      })
      createdPegawai.push(pegawai)
      console.log('✅ Created pegawai:', pegawai.name)
    }

    // Create some test proposals
    const proposalData = [
      {
        pegawaiId: createdPegawai[0].id, // Dr. Siti Aminah
        periode: '2025',
        status: 'DIAJUKAN',
        notes: 'Usulan kenaikan pangkat reguler periode 2025',
      },
      {
        pegawaiId: createdPegawai[1].id, // Ahmad Wijaya
        periode: '2025',
        status: 'DIPROSES_OPERATOR',
        notes: 'Dokumen telah lengkap, sedang dalam proses verifikasi',
      },
      {
        pegawaiId: createdPegawai[2].id, // Dra. Fatimah
        periode: '2024',
        status: 'SELESAI',
        notes: 'Usulan telah disetujui dan diterbitkan SK',
      },
      {
        pegawaiId: createdPegawai[3].id, // Muhammad Rizki
        periode: '2025',
        status: 'PERLU_PERBAIKAN_DARI_SEKOLAH',
        notes: 'Dokumen PAK perlu dilengkapi, mohon diperbaiki',
      },
    ]

    for (const data of proposalData) {
      const proposal = await prisma.promotionProposal.upsert({
        where: { 
          pegawaiId: data.pegawaiId,
        },
        update: {},
        create: data,
      })
      console.log('✅ Created proposal for pegawai ID:', data.pegawaiId)
    }

    // Create active timeline
    const timeline = await prisma.timeline.upsert({
      where: { id: 'timeline-2025' },
      update: {},
      create: {
        id: 'timeline-2025',
        title: 'Periode Usulan Kenaikan Pangkat 2025',
        description: 'Periode pengajuan usulan kenaikan pangkat untuk periode April dan Oktober 2025',
        jabatanType: 'all',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-03-31'),
        isActive: true,
        priority: 2,
        wilayah: 'BALIKPAPAN_PPU',
        notes: 'Pastikan semua dokumen telah lengkap sebelum batas waktu'
      }
    })

    console.log('✅ Created timeline:', timeline.title)

    console.log('🎉 Operator sekolah test data seeded successfully!')

  } catch (error) {
    console.error('❌ Error seeding operator sekolah data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
if (require.main === module) {
  seedOperatorSekolahData()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { seedOperatorSekolahData }
