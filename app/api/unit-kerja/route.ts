import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        wilayah: true,
        wilayahId: true,
        role: true,
        wilayahRelasi: {
          select: {
            id: true,
            kode: true,
            nama: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

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

    // Get wilayahId dari relasi atau dari enum untuk backward compatibility
    const operatorWilayahId = user.wilayahId || enumToWilayahId[user.wilayah || '']
    const operatorWilayahEnum = user.wilayah

    let whereClause: Record<string, unknown> = {}

    // Filter berdasarkan role dan wilayah
    if (user.role === 'OPERATOR') {
      // Operator hanya bisa melihat unit kerja di wilayahnya
      if (operatorWilayahId) {
        whereClause.wilayahId = operatorWilayahId;
      } else if (operatorWilayahEnum) {
        whereClause.wilayah = operatorWilayahEnum;
      }
    } else if (user.role === 'ADMIN') {
      // Admin bisa melihat semua unit kerja
      whereClause = {}
    } else {
      // Role lain (pegawai, dll) hanya bisa melihat unit kerja di wilayahnya
      if (operatorWilayahId) {
        whereClause.wilayahId = operatorWilayahId;
      } else if (operatorWilayahEnum) {
        whereClause.wilayah = operatorWilayahEnum;
      }
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const jenjang = searchParams.get('jenjang') || 'all'
    const status = searchParams.get('status') || 'AKTIF'
    const minimal = searchParams.get('minimal') === 'true'

    // Add search filter
    if (search) {
      whereClause.nama = { contains: search, mode: 'insensitive' }
    }

    // Add jenjang filter
    if (jenjang !== 'all') {
      whereClause.jenjang = { contains: jenjang, mode: 'insensitive' }
    }

    // Add status filter
    if (status !== 'all') {
      whereClause.status = status
    }

    // Minimal response for dropdowns
    if (minimal) {
      // Optimasi dengan memcache response untuk unit kerja minimal
      // Reuse cache dalam satu session
      
      // Menerapkan batasan untuk optimasi query
      const unitKerjaList = await prisma.unitKerja.findMany({
        where: whereClause,
        select: {
          id: true,
          nama: true,
          jenjang: true,
          npsn: true
        },
        orderBy: { nama: 'asc' },
        // Limit jumlah data jika terlalu banyak
        take: 500
      })

      return NextResponse.json({
        success: true,
        data: unitKerjaList,
        // Tambahkan timestamp untuk tracking cache
        timestamp: new Date().toISOString()
      }, {
        headers: {
          // Set cache headers untuk browser
          'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 jam
        }
      })
    }

    const unitKerjaList = await prisma.unitKerja.findMany({
      where: whereClause,
      include: {
        wilayahRelasi: {
          select: {
            id: true,
            kode: true,
            nama: true,
            namaLengkap: true
          }
        },
        _count: {
          select: {
            users: {
              where: {
                role: 'PEGAWAI'
              }
            }
          }
        }
      },
      orderBy: [
        { nama: 'asc' }
      ]
    })

    // Enrich data dengan informasi tambahan
    const enrichedUnitKerja = unitKerjaList.map(unit => ({
      id: unit.id,
      nama: unit.nama,
      npsn: unit.npsn,
      jenjang: unit.jenjang,
      alamat: unit.alamat,
      kecamatan: unit.kecamatan,
      status: unit.status,
      kepalaSekolah: unit.kepalaSekolah,
      phone: unit.phone,
      email: unit.email,
      website: unit.website,
      wilayah: unit.wilayah,
      wilayahRelasi: unit.wilayahRelasi,
      wilayahNama: unit.wilayahRelasi?.nama || unit.wilayah,
      jumlahPegawai: unit._count.users,
      createdAt: unit.createdAt,
      updatedAt: unit.updatedAt
    }))

    return NextResponse.json({
      success: true,
      data: enrichedUnitKerja,
      summary: {
        total: enrichedUnitKerja.length,
        byJenjang: enrichedUnitKerja.reduce((acc, unit) => {
          acc[unit.jenjang] = (acc[unit.jenjang] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        byStatus: enrichedUnitKerja.reduce((acc, unit) => {
          acc[unit.status] = (acc[unit.status] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      },
      userInfo: {
        role: user.role,
        wilayah: user.wilayah,
        wilayahRelasi: user.wilayahRelasi
      }
    })
  } catch (error) {
    console.error('Error fetching unit kerja:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch unit kerja data' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn || !['OPERATOR', 'ADMIN'].includes(session.user?.role || '')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        wilayah: true,
        wilayahId: true,
        role: true,
        wilayahRelasi: {
          select: {
            id: true,
            kode: true,
            nama: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    const data = await request.json()

    // Validasi data required
    if (!data.nama || !data.jenjang) {
      return NextResponse.json({ 
        success: false, 
        message: 'Nama dan Jenjang wajib diisi' 
      }, { status: 400 })
    }

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

    const operatorWilayahId = user.wilayahId || enumToWilayahId[user.wilayah || '']
    const operatorWilayahEnum = user.wilayah

    // Untuk operator, unit kerja harus dalam wilayahnya
    const unitKerjaWilayahId = operatorWilayahId
    const unitKerjaWilayahEnum = operatorWilayahEnum

    if (user.role === 'ADMIN') {
      // Admin bisa membuat unit kerja di wilayah manapun
      // Namun tetap perlu set default wilayah
      if (!operatorWilayahId) {
        return NextResponse.json({ 
          success: false, 
          message: 'Wilayah tidak ditemukan' 
        }, { status: 400 })
      }
    }

    // Cek duplikasi nama dalam wilayah yang sama
    const existingUnit = await prisma.unitKerja.findFirst({
      where: {
        nama: data.nama,
        OR: [
          { wilayahId: unitKerjaWilayahId },
          { wilayah: unitKerjaWilayahEnum }
        ].filter(Boolean)
      }
    })

    if (existingUnit) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unit kerja dengan nama tersebut sudah ada di wilayah ini' 
      }, { status: 400 })
    }

    // Cek duplikasi NPSN jika diisi
    if (data.npsn) {
      const existingNpsn = await prisma.unitKerja.findFirst({
        where: { npsn: data.npsn }
      })

      if (existingNpsn) {
        return NextResponse.json({ 
          success: false, 
          message: 'NPSN sudah digunakan oleh unit kerja lain' 
        }, { status: 400 })
      }
    }

    // Create unit kerja
    const newUnitKerja = await prisma.unitKerja.create({
      data: {
        nama: data.nama,
        npsn: data.npsn || null,
        jenjang: data.jenjang,
        alamat: data.alamat || null,
        kecamatan: data.kecamatan || null,
        status: data.status || 'AKTIF',
        kepalaSekolah: data.kepalaSekolah || null,
        phone: data.phone || null,
        email: data.email || null,
        website: data.website || null,
        wilayahId: unitKerjaWilayahId,
        wilayah: unitKerjaWilayahEnum
      },
      include: {
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

    return NextResponse.json({
      success: true,
      message: 'Unit kerja berhasil ditambahkan',
      data: {
        id: newUnitKerja.id,
        nama: newUnitKerja.nama,
        npsn: newUnitKerja.npsn,
        jenjang: newUnitKerja.jenjang,
        status: newUnitKerja.status,
        wilayahRelasi: newUnitKerja.wilayahRelasi,
        createdAt: newUnitKerja.createdAt
      }
    })

  } catch (error) {
    console.error('Error creating unit kerja:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}
