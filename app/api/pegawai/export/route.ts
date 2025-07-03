import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

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
    const session = await getSession()
    
    if (!session.isLoggedIn || session.user?.role !== 'OPERATOR') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        wilayah: true,
        wilayahId: true,
        wilayahRelasi: {
          select: {
            id: true,
            kode: true,
            nama: true
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
    const unitKerja = searchParams.get('unitKerja') || 'all'
    const jabatan = searchParams.get('jabatan') || 'all'
    const status = searchParams.get('status') || 'AKTIF'
    const pendidikan = searchParams.get('pendidikan') || 'all'
    const format = searchParams.get('format') || 'xlsx'

    // Build filter conditions
    const whereClause: Record<string, unknown> = {
      role: 'PEGAWAI',
      OR: [
        { wilayahId: operatorWilayahId },
        { wilayah: operatorWilayahEnum }
      ].filter(Boolean)
    }

    // Add filters
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nip: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (unitKerja !== 'all') {
      whereClause.unitKerjaId = unitKerja
    }

    if (jabatan !== 'all') {
      whereClause.jabatan = jabatan
    }

    if (pendidikan !== 'all') {
      whereClause.pendidikan = pendidikan
    }

    if (status !== 'all') {
      whereClause.status = status
    }

    // Get pegawai data
    const pegawaiList = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        nip: true,
        email: true,
        jabatan: true,
        golongan: true,
        phone: true,
        address: true,
        wilayah: true,
        createdAt: true,
        updatedAt: true,
        unitKerja: {
          select: {
            nama: true,
            jenjang: true,
            npsn: true
          }
        },
        wilayahRelasi: {
          select: {
            nama: true,
            namaLengkap: true
          }
        },
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Transform data for export
    const exportData = pegawaiList.map((pegawai, index) => ({
      'No': index + 1,
      'Nama': pegawai.name || '',
      'NIP': pegawai.nip || '',
      'Email': pegawai.email || '',
      'No. HP': pegawai.phone || '',
      'Jabatan': pegawai.jabatan || '',
      'Golongan': pegawai.golongan || '',
      'Alamat': pegawai.address || '',
      'Unit Kerja': pegawai.unitKerja?.nama || '',
      'Jenjang': pegawai.unitKerja?.jenjang || '',
      'NPSN': pegawai.unitKerja?.npsn || '',
      'Wilayah': pegawai.wilayah || ''
    }))

    if (format === 'xlsx') {
      // Create Excel file
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      
      // Set column widths
      const columnWidths = [
        { wch: 5 },  // No
        { wch: 25 }, // Nama
        { wch: 20 }, // NIP
        { wch: 20 }, // NUPTK
        { wch: 30 }, // Email
        { wch: 15 }, // No. HP
        { wch: 20 }, // Jabatan
        { wch: 15 }, // Pendidikan
        { wch: 10 }, // Golongan
        { wch: 15 }, // Jenis Kelamin
        { wch: 15 }, // Tanggal Lahir
        { wch: 10 }, // Agama
        { wch: 30 }, // Alamat
        { wch: 30 }, // Unit Kerja
        { wch: 10 }, // Jenjang
        { wch: 15 }, // NPSN
        { wch: 15 }, // Wilayah
        { wch: 10 }, // Status
        { wch: 15 }, // Tanggal Dibuat
        { wch: 15 }  // Terakhir Update
      ]
      worksheet['!cols'] = columnWidths
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Pegawai')
      
      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
      
      // Set response headers
      const headers = new Headers()
      headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      headers.set('Content-Disposition', `attachment; filename="data_pegawai_${new Date().toISOString().split('T')[0]}.xlsx"`)
      
      return new NextResponse(buffer, { headers })
      
    } else {
      // Return JSON format
      return NextResponse.json({
        success: true,
        data: exportData,
        total: exportData.length,
        exported_at: new Date().toISOString(),
        wilayah: user.wilayahRelasi?.nama || user.wilayah
      })
    }

  } catch (error) {
    console.error('Error exporting pegawai data:', error)
    return NextResponse.json({ 
      success: false,
      message: 'Internal server error' 
    }, { status: 500 })
  }
}
