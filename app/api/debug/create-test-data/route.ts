import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/password"

export async function POST(req: NextRequest) {
  // SECURITY: Disable debug routes in production
  if (process.env.NODE_ENV === 'production') {
    return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    console.log('🌱 Creating operator sekolah test data...')

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
      const existing = await prisma.user.findUnique({
        where: { nip: data.nip }
      })
      
      if (!existing) {
        const pegawai = await prisma.user.create({
          data: {
            ...data,
            password: await hashPassword(data.nip), // Use NIP as default password
            role: 'PEGAWAI',
            unitKerja: 'SMA Negeri 1 Balikpapan',
            wilayah: 'BALIKPAPAN_PPU',
            mustChangePassword: true,
          },
        })
        createdPegawai.push(pegawai)
      } else {
        createdPegawai.push(existing)
      }
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
      const existing = await prisma.promotionProposal.findFirst({
        where: { pegawaiId: data.pegawaiId }
      })
      
      if (!existing) {
        await prisma.promotionProposal.create({
          data: data,
        })
      }
    }

    // Create active timeline
    const existingTimeline = await prisma.timeline.findFirst({
      where: { title: 'Periode Usulan Kenaikan Pangkat 2025' }
    })

    if (!existingTimeline) {
      await prisma.timeline.create({
        data: {
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
    }

    return NextResponse.json({
      message: 'Test data created successfully',
      operatorSekolah: {
        nip: operatorSekolah.nip,
        name: operatorSekolah.name,
        unitKerja: operatorSekolah.unitKerja
      },
      pegawaiCount: createdPegawai.length,
      proposalCount: proposalData.length
    }, { status: 200 })

  } catch (error) {
    console.error('Create test data error:', error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
