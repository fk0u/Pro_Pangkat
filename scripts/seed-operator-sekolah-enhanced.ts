import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function seedOperatorSekolahData() {
  try {
    console.log('🌱 Seeding operator sekolah data...')

    // 1. Create sample unit kerja (schools)
    const unitKerjaList = [
      {
        nama: 'SD Negeri 001 Samarinda',
        wilayah: 'SAMARINDA',
        jenis: 'SD',
        alamat: 'Jl. Diponegoro No. 123, Samarinda',
        kodeWilayah: '6472010001'
      },
      {
        nama: 'SMP Negeri 5 Balikpapan',
        wilayah: 'BALIKPAPAN', 
        jenis: 'SMP',
        alamat: 'Jl. MT Haryono No. 456, Balikpapan',
        kodeWilayah: '6471020005'
      },
      {
        nama: 'SMA Negeri 2 Tenggarong',
        wilayah: 'KUTAI_KARTANEGARA',
        jenis: 'SMA',
        alamat: 'Jl. Sudirman No. 789, Tenggarong',
        kodeWilayah: '6103030002'
      }
    ]

    // Create unit kerja
    const createdUnitKerja = await Promise.all(
      unitKerjaList.map(async (uk) => {
        return await prisma.unitKerja.upsert({
          where: { nama: uk.nama },
          update: {},
          create: uk
        })
      })
    )

    console.log(`✅ Created ${createdUnitKerja.length} unit kerja`)

    // 2. Create operator sekolah users
    const operatorSekolahList = [
      {
        nip: '198501012009031001',
        nama: 'Budi Santoso',
        email: 'budi.operator@sd001samarinda.sch.id',
        password: 'password123',
        jabatan: 'Operator Sekolah',
        unitKerjaId: createdUnitKerja[0].id,
        unitKerja: createdUnitKerja[0].nama,
        wilayah: 'SAMARINDA',
        golongan: 'III/A',
        statusKepegawaian: 'PNS',
        jenisKelamin: 'Laki-laki',
        role: 'OPERATOR_SEKOLAH'
      },
      {
        nip: '198705152010122002',
        nama: 'Siti Nurhaliza',
        email: 'siti.operator@smp5balikpapan.sch.id',
        password: 'password123',
        jabatan: 'Operator Sekolah',
        unitKerjaId: createdUnitKerja[1].id,
        unitKerja: createdUnitKerja[1].nama,
        wilayah: 'BALIKPAPAN',
        golongan: 'III/B',
        statusKepegawaian: 'PNS',
        jenisKelamin: 'Perempuan',
        role: 'OPERATOR_SEKOLAH'
      },
      {
        nip: '198203201998032003',
        nama: 'Ahmad Fauzi',
        email: 'ahmad.operator@sma2tenggarong.sch.id',
        password: 'password123',
        jabatan: 'Operator Sekolah',
        unitKerjaId: createdUnitKerja[2].id,
        unitKerja: createdUnitKerja[2].nama,
        wilayah: 'KUTAI_KARTANEGARA',
        golongan: 'III/C',
        statusKepegawaian: 'PNS',
        jenisKelamin: 'Laki-laki',
        role: 'OPERATOR_SEKOLAH'
      }
    ]

    // Create operator sekolah users
    const createdOperators = await Promise.all(
      operatorSekolahList.map(async (op) => {
        const hashedPassword = await bcrypt.hash(op.password, 12)
        return await prisma.user.upsert({
          where: { nip: op.nip },
          update: {},
          create: {
            ...op,
            password: hashedPassword,
            tempatLahir: 'Samarinda',
            tanggalLahir: new Date('1985-01-01'),
            statusPerkawinan: 'Menikah',
            agama: 'Islam',
            alamat: 'Jl. Contoh Alamat No. 123',
            pendidikanTerakhir: 'S1',
            tanggalMasukKerja: new Date('2009-03-01'),
            masaKerja: '15 tahun',
            noHp: '08123456789'
          }
        })
      })
    )

    console.log(`✅ Created ${createdOperators.length} operator sekolah users`)

    // 3. Create sample pegawai data for each school
    const samplePegawai = [
      // SD Negeri 001 Samarinda
      {
        nip: '196805101990031001',
        nama: 'Dra. Sri Handayani',
        jabatan: 'Kepala Sekolah',
        unitKerjaId: createdUnitKerja[0].id,
        unitKerja: createdUnitKerja[0].nama,
        golongan: 'IV/A',
        statusKepegawaian: 'PNS',
        jenisKelamin: 'Perempuan'
      },
      {
        nip: '197203151995122001',
        nama: 'Endang Sulistyowati, S.Pd',
        jabatan: 'Guru Kelas',
        unitKerjaId: createdUnitKerja[0].id,
        unitKerja: createdUnitKerja[0].nama,
        golongan: 'III/D',
        statusKepegawaian: 'PNS',
        jenisKelamin: 'Perempuan'
      },
      {
        nip: '198001102005011002',
        nama: 'Agus Priyanto, S.Pd',
        jabatan: 'Guru Kelas',
        unitKerjaId: createdUnitKerja[0].id,
        unitKerja: createdUnitKerja[0].nama,
        golongan: 'III/C',
        statusKepegawaian: 'PNS',
        jenisKelamin: 'Laki-laki'
      },
      // SMP Negeri 5 Balikpapan
      {
        nip: '196512121989031003',
        nama: 'Drs. Bambang Hartono, M.Pd',
        jabatan: 'Kepala Sekolah',
        unitKerjaId: createdUnitKerja[1].id,
        unitKerja: createdUnitKerja[1].nama,
        golongan: 'IV/B',
        statusKepegawaian: 'PNS',
        jenisKelamin: 'Laki-laki'
      },
      {
        nip: '197508201998032004',
        nama: 'Indira Sari, S.Pd',
        jabatan: 'Guru Mata Pelajaran',
        unitKerjaId: createdUnitKerja[1].id,
        unitKerja: createdUnitKerja[1].nama,
        golongan: 'III/D',
        statusKepegawaian: 'PNS',
        jenisKelamin: 'Perempuan'
      },
      // SMA Negeri 2 Tenggarong
      {
        nip: '196309051987031004',
        nama: 'Prof. Dr. Supriadi, M.Ed',
        jabatan: 'Kepala Sekolah',
        unitKerjaId: createdUnitKerja[2].id,
        unitKerja: createdUnitKerja[2].nama,
        golongan: 'IV/C',
        statusKepegawaian: 'PNS',
        jenisKelamin: 'Laki-laki'
      }
    ]

    // Create pegawai
    const createdPegawai = await Promise.all(
      samplePegawai.map(async (pegawai) => {
        return await prisma.pegawai.upsert({
          where: { nip: pegawai.nip },
          update: {},
          create: {
            ...pegawai,
            email: `${pegawai.nama.toLowerCase().replace(/[^a-z0-9]/g, '')}@email.com`,
            tempatLahir: 'Samarinda',
            tanggalLahir: new Date('1970-01-01'),
            statusPerkawinan: 'Menikah',
            agama: 'Islam',
            alamat: 'Jl. Contoh Alamat Pegawai',
            pendidikanTerakhir: 'S1',
            tanggalMasukKerja: new Date('1995-01-01'),
            masaKerja: '29 tahun',
            noHp: '08123456789'
          }
        })
      })
    )

    console.log(`✅ Created ${createdPegawai.length} pegawai`)

    // 4. Create sample usulan data
    const sampleUsulan = [
      {
        pegawaiId: createdPegawai[1].id, // Endang Sulistyowati
        periode: 'Agustus 2025',
        jenisUsulan: 'Kenaikan Pangkat Reguler',
        golonganTujuan: 'IV/A',
        statusVerifikasi: 'DRAFT',
        tanggalUsulan: new Date('2025-01-15'),
        keterangan: 'Usulan kenaikan pangkat sesuai masa kerja'
      },
      {
        pegawaiId: createdPegawai[2].id, // Agus Priyanto
        periode: 'Agustus 2025',
        jenisUsulan: 'Kenaikan Pangkat Reguler',
        golonganTujuan: 'III/D',
        statusVerifikasi: 'DIAJUKAN',
        tanggalUsulan: new Date('2025-01-10'),
        keterangan: 'Usulan kenaikan pangkat reguler'
      },
      {
        pegawaiId: createdPegawai[4].id, // Indira Sari
        periode: 'Agustus 2025',
        jenisUsulan: 'Kenaikan Pangkat Reguler',
        golonganTujuan: 'IV/A',
        statusVerifikasi: 'DIVERIFIKASI',
        tanggalUsulan: new Date('2025-01-05'),
        tanggalVerifikasi: new Date('2025-01-20'),
        verifikasiOleh: createdOperators[1].id,
        keterangan: 'Usulan telah diverifikasi'
      }
    ]

    // Create usulan
    const createdUsulan = await Promise.all(
      sampleUsulan.map(async (usulan) => {
        return await prisma.usulan.create({
          data: usulan
        })
      })
    )

    console.log(`✅ Created ${createdUsulan.length} usulan`)

    // 5. Create sample timeline data
    const timelineData = [
      {
        title: 'Periode Pengajuan Kenaikan Pangkat Agustus 2025',
        description: 'Periode pengajuan usulan kenaikan pangkat untuk periode Agustus 2025',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-03-31'),
        isActive: true,
        isGlobal: true,
        priority: 1
      },
      {
        title: 'Verifikasi Dokumen oleh Operator Sekolah',
        description: 'Masa verifikasi dokumen usulan oleh operator sekolah',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-04-15'),
        isActive: true,
        isGlobal: true,
        priority: 2
      },
      {
        title: 'Verifikasi oleh Dinas Pendidikan',
        description: 'Verifikasi dan validasi oleh operator Dinas Pendidikan',
        startDate: new Date('2025-04-16'),
        endDate: new Date('2025-05-31'),
        isActive: false,
        isGlobal: true,
        priority: 3
      }
    ]

    // Create timeline
    const createdTimeline = await Promise.all(
      timelineData.map(async (timeline) => {
        return await prisma.timeline.upsert({
          where: { title: timeline.title },
          update: {},
          create: timeline
        })
      })
    )

    console.log(`✅ Created ${createdTimeline.length} timeline entries`)

    console.log('🎉 Operator sekolah data seeding completed successfully!')
    console.log('\nLogin credentials for testing:')
    console.log('1. Operator SD Negeri 001 Samarinda:')
    console.log('   Email: budi.operator@sd001samarinda.sch.id')
    console.log('   Password: password123')
    console.log('2. Operator SMP Negeri 5 Balikpapan:')
    console.log('   Email: siti.operator@smp5balikpapan.sch.id')
    console.log('   Password: password123')
    console.log('3. Operator SMA Negeri 2 Tenggarong:')
    console.log('   Email: ahmad.operator@sma2tenggarong.sch.id')
    console.log('   Password: password123')

  } catch (error) {
    console.error('❌ Error seeding operator sekolah data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seeding function
if (require.main === module) {
  seedOperatorSekolahData()
    .then(() => {
      console.log('✅ Seeding completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error)
      process.exit(1)
    })
}

export default seedOperatorSekolahData
