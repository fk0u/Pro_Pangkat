import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn || session.user?.role !== 'OPERATOR') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const jenjang = searchParams.get('jenjang') || 'all'

    // Get user's wilayah for filtering
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { wilayah: true }
    })

    if (!user?.wilayah) {
      return NextResponse.json({ message: 'Wilayah operator not found' }, { status: 400 })
    }

    // Build filter conditions for UnitKerja
    const whereClause: Record<string, unknown> = {
      wilayah: user.wilayah // Filter by operator's wilayah
    }

    // Add search filter
    if (search) {
      whereClause.nama = {
        contains: search,
        mode: 'insensitive'
      }
    }

    // Add jenjang filter
    if (jenjang !== 'all') {
      whereClause.jenjang = jenjang
    }

    // Get unit kerja data with relations
    const unitKerjaList = await prisma.unitKerja.findMany({
      where: whereClause,
      include: {
        pegawai: {
          where: { role: 'PEGAWAI' },
          select: { id: true }
        }
      },
      orderBy: {
        nama: 'asc'
      }
    })

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
          status: unit.status,
          totalPegawai: unit.pegawai.length,
          totalUsulan,
          usulanAktif
        }
      })
    )

    // Filter out null results and sort
    const validUnitKerja = enrichedUnitKerja
      .filter(unit => unit !== null)
      .sort((a, b) => a!.nama.localeCompare(b!.nama))

    // Get summary statistics
    const totalUnitKerja = validUnitKerja.length
    const totalPegawai = validUnitKerja.reduce((sum, unit) => sum + unit!.totalPegawai, 0)
    const totalUsulan = validUnitKerja.reduce((sum, unit) => sum + unit!.totalUsulan, 0)
    const unitAktif = validUnitKerja.filter(unit => unit!.status === 'Aktif').length

    // Get filter options from the results
    const jenjangOptions = [...new Set(validUnitKerja.map(unit => unit!.jenjang))]

    return NextResponse.json({
      success: true,
      data: validUnitKerja,
      summary: {
        totalUnitKerja,
        totalPegawai,
        totalUsulan,
        unitAktif
      },
      filterOptions: {
        jenjang: jenjangOptions.filter(Boolean)
      }
    })

  } catch (error) {
    console.error('Error fetching unit kerja data:', error)
    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}

// Add the POST method to handle adding new unit kerja
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn || session.user?.role !== 'OPERATOR') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    // Get user's wilayah for filtering
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { wilayah: true }
    })

    if (!user?.wilayah) {
      return NextResponse.json({ success: false, message: 'Wilayah operator not found' }, { status: 400 })
    }

    // Check content type and handle accordingly
    const contentType = request.headers.get('content-type')
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle Excel import
      const formData = await request.formData()
      const file = formData.get('file') as File
      
      if (!file) {
        return NextResponse.json({ 
          success: false, 
          message: 'No file uploaded' 
        }, { status: 400 })
      }
      
      // Convert file to array buffer for XLSX parsing
      const arrayBuffer = await file.arrayBuffer()
      const data = new Uint8Array(arrayBuffer)
      
      // Use XLSX (must be imported at runtime to avoid SSR issues)
      const XLSX = await import('xlsx')
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      const results = {
        total: jsonData.length,
        success: 0,
        failed: 0,
        errors: [] as string[],
        created: [] as string[]
      }
      
      // Process each row in the Excel file
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as Record<string, unknown>
        const rowNumber = i + 2 // Excel starts from row 2 after header
        
        try {
          // Validate required fields
          if (!row['NAMA'] || !row['JENJANG']) {
            results.errors.push(`Baris ${rowNumber}: NAMA dan JENJANG wajib diisi`)
            results.failed++
            continue
          }
          
          const nama = String(row['NAMA']).trim()
          const jenjang = String(row['JENJANG']).trim()
          
          // Check if unit kerja already exists
          const existingUnitKerja = await prisma.unitKerja.findFirst({
            where: {
              nama: {
                equals: nama,
                mode: 'insensitive'
              },
              wilayah: user.wilayah
            }
          })
          
          if (existingUnitKerja) {
            results.errors.push(`Baris ${rowNumber}: Unit kerja "${nama}" sudah ada`)
            results.failed++
            continue
          }
          
          // Prepare data for new unit kerja
          const unitKerjaData = {
            nama: nama,
            jenjang: jenjang,
            npsn: row['NPSN'] ? String(row['NPSN']).trim() : null,
            alamat: row['ALAMAT'] ? String(row['ALAMAT']).trim() : null,
            kecamatan: row['KECAMATAN'] ? String(row['KECAMATAN']).trim() : null,
            kabupaten: row['KABUPATEN'] ? String(row['KABUPATEN']).trim() : null,
            provinsi: row['PROVINSI'] ? String(row['PROVINSI']).trim() : null,
            kepalaSekolah: row['KEPALA_SEKOLAH'] ? String(row['KEPALA_SEKOLAH']).trim() : null,
            email: row['EMAIL'] ? String(row['EMAIL']).trim() : null,
            phone: row['TELEPON'] ? String(row['TELEPON']).trim() : null,
            website: row['WEBSITE'] ? String(row['WEBSITE']).trim() : null,
            status: 'Aktif',
            wilayah: user.wilayah
          }
          }
          
          // Create new unit kerja
          await prisma.unitKerja.create({ data: unitKerjaData })
          
          results.success++
          results.created.push(nama)
          
        } catch (error) {
          console.error(`Error processing row ${rowNumber}:`, error)
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          results.errors.push(`Baris ${rowNumber}: ${errorMessage}`)
          results.failed++
        }
      }
      
      return NextResponse.json({
        success: true,
        message: `Import selesai. ${results.success} unit kerja berhasil ditambahkan.`,
        results
      })
      
    } else {
      // Handle single unit kerja creation
      let data
      
      if (contentType?.includes('application/json')) {
        data = await request.json()
      } else {
        // Handle FormData
        const formData = await request.formData()
        data = {
          nama: formData.get('nama'),
          jenjang: formData.get('jenjang'),
          npsn: formData.get('npsn') || null,
          alamat: formData.get('alamat') || null,
          kecamatan: formData.get('kecamatan') || null,
          kabupaten: formData.get('kabupaten') || null,
          provinsi: formData.get('provinsi') || null,
          kepalaSekolah: formData.get('kepalaSekolah') || null,
          email: formData.get('email') || null,
          phone: formData.get('phone') || null,
          website: formData.get('website') || null,
          status: formData.get('status') || 'Aktif'
        }
      }
      
      // Validate required fields
      if (!data.nama || !data.jenjang) {
        return NextResponse.json({ 
          success: false, 
          message: 'Nama dan jenjang wajib diisi' 
        }, { status: 400 })
      }
      
      // Check if unit kerja already exists
      const existingUnitKerja = await prisma.unitKerja.findFirst({
        where: {
          nama: {
            equals: data.nama,
            mode: 'insensitive'
          },
          wilayah: user.wilayah
        }
      })
      
      if (existingUnitKerja) {
        return NextResponse.json({ 
          success: false, 
          message: `Unit kerja "${data.nama}" sudah ada` 
        }, { status: 400 })
      }
      
      // Create new unit kerja
      const newUnitKerja = await prisma.unitKerja.create({
        data: {
          nama: data.nama,
          jenjang: data.jenjang,
          npsn: data.npsn,
          alamat: data.alamat,
          kecamatan: data.kecamatan,
          kabupaten: data.kabupaten,
          provinsi: data.provinsi,
          kepalaSekolah: data.kepalaSekolah,
          email: data.email,
          phone: data.phone,
          website: data.website,
          status: data.status,
          wilayah: user.wilayah
        }
      })
      
      return NextResponse.json({
        success: true,
        message: 'Unit kerja berhasil ditambahkan',
        data: newUnitKerja
      })
    }
    
  } catch (error) {
    console.error('Error creating unit kerja:', error)
    return NextResponse.json({ 
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}
