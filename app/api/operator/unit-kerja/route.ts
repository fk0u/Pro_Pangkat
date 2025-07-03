import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Mapping enum wilayah ke wilayahId untuk backward compatibility
const enumToWilayahId: Record<string, string> = {
  'BALIKPAPAN_PPU': 'wilayah_balikpapan_ppu',
  'KUTIM_BONTANG': 'wilayah_kutim_bontang',
  'KUKAR': 'wilayah_kukar',
  'KUBAR_MAHULU': 'wilayah_kubar_mahulu',
  'PASER': 'wilayah_paser',
  'BERAU': 'wilayah_berau',
  'SAMARINDA': 'wilayah_samarinda'
}

export async function GET(request: NextRequest) {
  try {
    // Get the current logged-in user
    const { getSession } = await import('@/lib/auth')
    const session = await getSession()
    
    if (!session.isLoggedIn || session.user?.role !== 'OPERATOR') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    // Get the logged-in operator's data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        wilayah: true,
        wilayahId: true,
        wilayahRelasi: {
          select: {
            id: true,
            kode: true,
            nama: true,
            namaLengkap: true
          }
        }
      }
    })

    // Get wilayahId dari relasi atau dari enum untuk backward compatibility
    const operatorWilayahId = user?.wilayahId || enumToWilayahId[user?.wilayah || '']
    const operatorWilayahEnum = user?.wilayah

    if (!operatorWilayahId && !operatorWilayahEnum) {
      return NextResponse.json({ success: false, message: 'Wilayah operator not found' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const jenjang = searchParams.get('jenjang') || 'all'
    const kecamatan = searchParams.get('kecamatan') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Build filter conditions for UnitKerja
    const whereClause: Record<string, unknown> = {
      OR: [
        { wilayahId: operatorWilayahId },
        { wilayah: operatorWilayahEnum }
      ].filter(Boolean)
    }

    // Add search filter
    if (search) {
      whereClause.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { npsn: { contains: search } }
      ]
    }

    // Add jenjang filter
    if (jenjang !== 'all') {
      whereClause.jenjang = jenjang
    }

    // Add kecamatan filter
    if (kecamatan !== 'all') {
      whereClause.kecamatan = kecamatan
    }

    // Get unit kerja data with relations
    const [unitKerjaList, totalCount] = await Promise.all([
      prisma.unitKerja.findMany({
        where: whereClause,
        include: {
          pegawai: {
            where: { role: 'PEGAWAI' },
            select: { id: true }
          },
          wilayahRelasi: {
            select: {
              id: true,
              kode: true,
              nama: true,
              namaLengkap: true
            }
          }
        },
        orderBy: {
          nama: 'asc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.unitKerja.count({
        where: whereClause
      })
    ])

    // Get additional statistics for each unit kerja
    const enrichedUnitKerja = await Promise.all(
      unitKerjaList.map(async (unit) => {
        // Count total usulan from pegawai in this unit kerja
        const totalUsulan = await prisma.promotionProposal.count({
          where: {
            pegawai: {
              unitKerjaId: unit.id
            }
          }
        })

        // Count active usulan
        const usulanAktif = await prisma.promotionProposal.count({
          where: {
            pegawai: {
              unitKerjaId: unit.id
            },
            status: {
              notIn: ['SELESAI', 'DITOLAK']
            }
          }
        })

        return {
          id: unit.id,
          nama: unit.nama,
          npsn: unit.npsn || '-',
          jenjang: unit.jenjang,
          alamat: unit.alamat || '-',
          kecamatan: unit.kecamatan || '-',
          wilayah: unit.wilayah,
          wilayahRelasi: unit.wilayahRelasi,
          wilayahNama: unit.wilayahRelasi?.nama || formatWilayahForDisplay(unit.wilayah),
          status: unit.status,
          jumlahPegawai: unit.pegawai.length,
          totalUsulan,
          usulanAktif
        }
      })
    )

    // Filter out null results and sort
    const validUnitKerja = enrichedUnitKerja
      .filter(unit => unit !== null)
      .sort((a, b) => a!.nama.localeCompare(b!.nama))

    const totalUnitKerja = await prisma.unitKerja.count({
      where: whereClause
    })
    
    const totalPegawai = await prisma.user.count({
      where: {
        role: 'PEGAWAI',
        ...(operatorWilayahId ? { wilayahId: operatorWilayahId } : {}),
        ...(operatorWilayahEnum ? { wilayah: operatorWilayahEnum } : {})
      }
    })
    
    const totalUsulan = await prisma.promotionProposal.count({
      where: {
        pegawai: {
          ...(operatorWilayahId ? { wilayahId: operatorWilayahId } : {}),
          ...(operatorWilayahEnum ? { wilayah: operatorWilayahEnum } : {})
        }
      }
    })
    
    const unitAktif = await prisma.unitKerja.count({
      where: {
        status: 'Aktif',
        ...(operatorWilayahId ? { wilayahId: operatorWilayahId } : {}),
        ...(operatorWilayahEnum ? { wilayah: operatorWilayahEnum } : {})
      }
    })

    // Get filter options from the results
    const jenjangOptions = [...new Set(validUnitKerja.map(unit => unit!.jenjang))]
    const kecamatanOptions = [...new Set(validUnitKerja.map(unit => unit!.kecamatan).filter(Boolean))]

    return NextResponse.json({
      success: true,
      data: validUnitKerja,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit
      },
      summary: {
        totalUnitKerja,
        totalPegawai,
        totalUsulan,
        unitAktif
      },
      filterOptions: {
        jenjang: jenjangOptions.filter(Boolean),
        kecamatan: kecamatanOptions
      },
      userInfo: {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role,
        wilayah: user?.wilayah,
        wilayahId: user?.wilayahId,
        wilayahRelasi: user?.wilayahRelasi
      }
    })

  } catch (error) {
    console.error('Error fetching unit kerja data:', error)
    return NextResponse.json({ 
      success: false,
      message: 'Internal server error' 
    }, { status: 500 })
  }
}

// Helper function for backward compatibility
function formatWilayahForDisplay(wilayahCode: string | null | undefined): string {
  if (!wilayahCode) return 'Belum Ditentukan'
  const wilayahMap: Record<string, string> = {
    'BALIKPAPAN_PPU': 'Balikpapan & PPU',
    'KUTIM_BONTANG': 'Kutai Timur & Bontang',
    'KUKAR': 'Kutai Kartanegara',
    'KUBAR_MAHULU': 'Kutai Barat & Mahulu',
    'PASER': 'Paser',
    'BERAU': 'Berau',
    'SAMARINDA': 'Samarinda',
  }
  return wilayahMap[wilayahCode] || wilayahCode
}
