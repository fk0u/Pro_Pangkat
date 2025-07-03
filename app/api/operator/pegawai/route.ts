import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
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

    console.log('Operator wilayah ID:', operatorWilayahId);
    console.log('Operator wilayah enum:', operatorWilayahEnum);

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const unitKerja = searchParams.get('unitKerja') || 'all'
    const jabatan = searchParams.get('jabatan') || 'all'
    const golongan = searchParams.get('golongan') || 'all'
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const sortField = searchParams.get('sortField') || 'name'
    const sortDirection = searchParams.get('sortDirection') || 'asc'

    // Build filter conditions
    const whereClause: Record<string, unknown> = {
      role: 'PEGAWAI',
    }
    
    // Add wilayah filter with proper handling
    if (operatorWilayahId) {
      whereClause.wilayahId = operatorWilayahId;
    } else if (operatorWilayahEnum) {
      whereClause.wilayah = operatorWilayahEnum;
    }

    // Add search filter
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nip: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Add unit kerja filter
    if (unitKerja !== 'all') {
      // Find unit kerja by name
      const unitKerjaWhere: Record<string, unknown> = { 
        nama: unitKerja 
      };
      
      // Add wilayah filter to unit kerja search
      if (operatorWilayahId) {
        unitKerjaWhere.wilayahId = operatorWilayahId;
      } else if (operatorWilayahEnum) {
        unitKerjaWhere.wilayah = operatorWilayahEnum;
      }
      
      const unitKerjaObj = await prisma.unitKerja.findFirst({
        where: unitKerjaWhere
      });
      
      if (unitKerjaObj) {
        whereClause.unitKerjaId = unitKerjaObj.id;
      }
    }

    // Add jabatan filter
    if (jabatan !== 'all') {
      whereClause.jabatan = jabatan
    }

    // Add golongan filter
    if (golongan !== 'all') {
      whereClause.golongan = golongan
    }

    // Specific status filters need special handling
    if (status !== 'all') {
      // These will be applied later when getting the proposals
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Get pegawai data with pagination and simplified relations
    const [pegawaiList, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          nip: true,
          email: true,
          jabatan: true,
          jenisJabatan: true,
          golongan: true,
          phone: true,
          address: true,
          wilayah: true,
          wilayahId: true,
          wilayahRelasi: {
            select: {
              id: true,
              kode: true,
              nama: true,
              namaLengkap: true
            }
          },
          unitKerja: {
            select: {
              id: true,
              nama: true,
              jenjang: true,
              npsn: true,
              wilayahRelasi: {
                select: {
                  id: true,
                  kode: true,
                  nama: true
                }
              }
            }
          },
          createdAt: true,
          updatedAt: true
        },
        orderBy: sortField === 'unitKerja' 
          ? { unitKerja: { nama: sortDirection } }
          : { [sortField === 'name' ? 'name' : 
               sortField === 'jabatan' ? 'jabatan' : 
               sortField === 'golongan' ? 'golongan' : 'name']: sortDirection },
        skip: offset,
        take: limit
      }),
      prisma.user.count({
        where: whereClause
      })
    ])

    // Get a count of active usulan
    const activeProposalCount = await prisma.promotionProposal.count({
      where: {
        pegawai: {
          OR: [
            { wilayahId: operatorWilayahId },
            { wilayah: operatorWilayahEnum }
          ].filter(Boolean)
        },
        status: {
          notIn: ['SELESAI', 'DITOLAK']
        }
      }
    });

    // Get a count of pegawai with at least one proposal
    const pegawaiWithProposalsCount = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT "pegawaiId") 
      FROM "PromotionProposal" pp
      JOIN "User" u ON pp."pegawaiId" = u.id
      WHERE (u."wilayahId" = ${operatorWilayahId} OR u."wilayah"::text = ${operatorWilayahEnum}::text)
      AND u.role = 'PEGAWAI'
    `;

    // Get summary statistics
    const summaryStats = await Promise.all([
      // Total pegawai
      prisma.user.count({
        where: {
          role: 'PEGAWAI',
          OR: [
            { wilayahId: operatorWilayahId },
            { wilayah: operatorWilayahEnum }
          ].filter(Boolean)
        }
      }),
      
      // By jabatan
      prisma.user.groupBy({
        by: ['jabatan'],
        where: {
          role: 'PEGAWAI',
          OR: [
            { wilayahId: operatorWilayahId },
            { wilayah: operatorWilayahEnum }
          ].filter(Boolean),
          jabatan: { not: null }
        },
        _count: { jabatan: true }
      }),
      
      // By golongan
      prisma.user.groupBy({
        by: ['golongan'],
        where: {
          role: 'PEGAWAI',
          OR: [
            { wilayahId: operatorWilayahId },
            { wilayah: operatorWilayahEnum }
          ].filter(Boolean),
          golongan: { not: null }
        },
        _count: { golongan: true }
      }),
      
      // Total proposals count
      prisma.promotionProposal.count({
        where: {
          pegawai: {
            OR: [
              { wilayahId: operatorWilayahId },
              { wilayah: operatorWilayahEnum }
            ].filter(Boolean)
          }
        }
      })
    ]);

    // Transform summary data
    const summary = {
      totalPegawai: summaryStats[0],
      pegawaiDenganUsulan: Number(pegawaiWithProposalsCount[0]?.count || 0),
      totalUsulan: summaryStats[3],
      usulanAktif: activeProposalCount,
      byJabatan: summaryStats[1].reduce((acc: Record<string, number>, item) => {
        if (item.jabatan) acc[item.jabatan] = item._count.jabatan
        return acc
      }, {}),
      byGolongan: summaryStats[2].reduce((acc: Record<string, number>, item) => {
        if (item.golongan) acc[item.golongan] = item._count.golongan
        return acc
      }, {})
    };

    // Transform pegawai data with proposals information
    const transformedData = await Promise.all(pegawaiList.map(async pegawai => {
      // Get proposal count and status for this pegawai
      const proposals = await prisma.promotionProposal.findMany({
        where: { pegawaiId: pegawai.id },
        orderBy: { updatedAt: 'desc' },
        take: 1,
      });
      
      const totalProposals = await prisma.promotionProposal.count({
        where: { pegawaiId: pegawai.id }
      });
      
      const activeProposals = await prisma.promotionProposal.count({
        where: { 
          pegawaiId: pegawai.id,
          status: { notIn: ['SELESAI', 'DITOLAK'] }
        }
      });
      
      const latestProposal = proposals[0];
      let proposalStatus = 'Belum Ada Usulan';
      
      if (latestProposal) {
        if (['SELESAI', 'DITOLAK'].includes(latestProposal.status)) {
          proposalStatus = activeProposals > 0 ? 'Ada Usulan Aktif' : 'Selesai/Ditolak';
        } else {
          proposalStatus = 'Ada Usulan Aktif';
        }
      }

      return {
        id: pegawai.id,
        nama: pegawai.name || '',
        email: pegawai.email || '',
        nip: pegawai.nip,
        phone: pegawai.phone,
        address: pegawai.address,
        jabatan: pegawai.jabatan,
        jenisJabatan: pegawai.jenisJabatan,
        golongan: pegawai.golongan,
        unitKerjaId: pegawai.unitKerja?.id,
        unitKerja: pegawai.unitKerja?.nama,
        wilayah: pegawai.wilayah,
        wilayahRelasi: pegawai.wilayahRelasi,
        wilayahNama: pegawai.wilayahRelasi?.nama || formatWilayahForDisplay(pegawai.wilayah),
        totalProposals,
        activeProposals,
        proposalStatus,
        latestProposal: latestProposal || null,
        createdAt: pegawai.createdAt.toISOString(),
        updatedAt: pegawai.updatedAt.toISOString()
      };
    }));

    return NextResponse.json({
      success: true,
      data: transformedData,
      summary,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit
      },
      userInfo: {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role,
        wilayah: user?.wilayah,
        wilayahId: user?.wilayahId,
        wilayahRelasi: user?.wilayahRelasi
      }
    });

  } catch (error) {
    console.error('Error fetching pegawai data:', error)
    let errorMessage = 'Internal server error'
    
    if (error instanceof Error) {
      errorMessage = error.message
      
      // Log specific error details for debugging
      if (error.stack) {
        console.error('Stack trace:', error.stack)
      }
      
      // Prisma specific errors
      if (error.name === 'PrismaClientKnownRequestError') {
        errorMessage = 'Database query error'
      } else if (error.name === 'PrismaClientValidationError') {
        errorMessage = 'Invalid data format'
      } else if (error.name === 'PrismaClientRustPanicError') {
        errorMessage = 'Critical database error'
      }
    }
    
    return NextResponse.json({ 
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const contentType = request.headers.get('content-type')
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle file upload or form data
      const formData = await request.formData()
      const action = formData.get('action') as string

      if (action === 'import') {
        // Handle Excel import
        const file = formData.get('file') as File
        
        if (!file) {
          return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 })
        }

        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const worksheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[worksheetName]
        const data = XLSX.utils.sheet_to_json(worksheet)

        const results = {
          total: data.length,
          success: 0,
          failed: 0,
          errors: [] as string[],
          imported: 0
        }

        for (let i = 0; i < data.length; i++) {
          const row = data[i] as Record<string, unknown>
          const rowNumber = i + 2 // Excel starts from row 2

          try {
            // Validasi kolom required berdasarkan format baru
            if (!row['NIP'] || !row['NAMA']) {
              results.errors.push(`Baris ${rowNumber}: NIP dan NAMA wajib diisi`)
              results.failed++
              continue
            }

            const nipValue = row['NIP'].toString().trim()
            
            // Validasi format NIP (18 digit)
            if (!/^\d{18}$/.test(nipValue)) {
              results.errors.push(`Baris ${rowNumber}: NIP harus berupa 18 digit angka`)
              results.failed++
              continue
            }

            // Check if NIP already exists
            const existingUser = await prisma.user.findUnique({
              where: { nip: nipValue }
            })

            if (existingUser) {
              results.errors.push(`Baris ${rowNumber}: NIP ${nipValue} sudah terdaftar`)
              results.failed++
              continue
            }

            // Parse TMT Jabatan
            let tmtJabatan = null
            if (row['TMT JABATAN']) {
              const tmtValue = row['TMT JABATAN']
              if (typeof tmtValue === 'number') {
                // Excel date serial number
                const excelDate = new Date((tmtValue - 25569) * 86400 * 1000)
                tmtJabatan = excelDate
              } else if (typeof tmtValue === 'string') {
                const parsed = new Date(tmtValue)
                if (!isNaN(parsed.getTime())) {
                  tmtJabatan = parsed
                }
              }
            }

            // Generate password default dari NIP
            const defaultPassword = nipValue
            const hashedPassword = await bcrypt.hash(defaultPassword, 10)

            // Find unit kerja berdasarkan nama
            let unitKerjaId = null
            if (row['UNIT KERJA']?.toString().trim()) {
              const unitKerjaName = row['UNIT KERJA'].toString().trim()
              
              const existingUnitKerja = await prisma.unitKerja.findFirst({
                where: { 
                  nama: { contains: unitKerjaName, mode: 'insensitive' },
                  OR: [
                    { wilayahId: operatorWilayahId },
                    { wilayah: operatorWilayahEnum }
                  ].filter(Boolean)
                }
              })
              
              if (!existingUnitKerja) {
                results.errors.push(`Baris ${rowNumber}: Unit kerja "${unitKerjaName}" tidak ditemukan di wilayah ini`)
                results.failed++
                continue
              }
              
              unitKerjaId = existingUnitKerja.id
            }

            // Generate email dari NIP jika tidak ada
            const email = `${nipValue}@pegawai.local`

            // Create user dengan format baru
            await prisma.user.create({
              data: {
                name: row['NAMA'].toString().trim(),
                nip: nipValue,
                email: email,
                password: hashedPassword,
                role: 'PEGAWAI',
                golongan: row['GOLONGAN']?.toString().trim() || null,
                jabatan: row['JABATAN']?.toString().trim() || null,
                tmtJabatan: tmtJabatan,
                unitKerjaId: unitKerjaId,
                wilayahId: operatorWilayahId,
                wilayah: operatorWilayahEnum,
                mustChangePassword: true
              }
            })

            results.success++
            results.imported++

          } catch (error: unknown) {
            console.error(`Error processing row ${rowNumber}:`, error)
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            results.errors.push(`Baris ${rowNumber}: ${errorMessage}`)
            results.failed++
          }
        }

        return NextResponse.json({
          success: true,
          message: `Import selesai. ${results.imported} data berhasil diimpor.`,
          results
        })
      }
    } else {
      // Handle form data for single pegawai creation
      let data
      
      if (contentType?.includes('application/json')) {
        data = await request.json()
      } else {
        // Handle FormData
        const formData = await request.formData()
        const action = formData.get('action') as string
        
        if (action === 'create') {
          data = {
            nama: formData.get('name'),
            nip: formData.get('nip'),
            email: formData.get('email') || null,
            jabatan: formData.get('jabatan'),
            golongan: formData.get('golongan'),
            tmtJabatan: formData.get('tmtJabatan'),
            unitKerjaId: formData.get('unitKerjaId'),
            phone: formData.get('phone') || null,
            address: formData.get('address') || null
          }
        } else {
          return NextResponse.json({ 
            success: false, 
            message: 'Invalid action' 
          }, { status: 400 })
        }
      }

      // Validasi - hanya nama dan NIP yang wajib
      if (!data.nama || !data.nip) {
        return NextResponse.json({ 
          success: false, 
          message: 'Nama dan NIP wajib diisi' 
        }, { status: 400 })
      }

      // Validasi format NIP
      if (!/^\d{18}$/.test(data.nip)) {
        return NextResponse.json({ 
          success: false, 
          message: 'NIP harus berupa 18 digit angka' 
        }, { status: 400 })
      }

      // Check if NIP already exists
      const existingNip = await prisma.user.findUnique({
        where: { nip: data.nip }
      })

      if (existingNip) {
        return NextResponse.json({ 
          success: false, 
          message: 'NIP sudah terdaftar' 
        }, { status: 400 })
      }

      // Check email if provided
      if (data.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: data.email }
        })

        if (existingUser) {
          return NextResponse.json({ 
            success: false, 
            message: 'Email sudah terdaftar' 
          }, { status: 400 })
        }
      }

      // Generate password default dari NIP
      const defaultPassword = data.nip
      const hashedPassword = await bcrypt.hash(defaultPassword, 10)

      // Parse TMT Jabatan jika ada
      let tmtJabatan = null
      if (data.tmtJabatan) {
        tmtJabatan = new Date(data.tmtJabatan)
      }

      // Generate email default jika tidak ada
      const email = data.email || `${data.nip}@pegawai.local`

      // Create user
      const newUser = await prisma.user.create({
        data: {
          name: data.nama,
          email: email,
          nip: data.nip,
          password: hashedPassword,
          role: 'PEGAWAI',
          jabatan: data.jabatan || null,
          golongan: data.golongan || null,
          phone: data.phone || null,
          address: data.address || null,
          tmtJabatan: tmtJabatan,
          unitKerjaId: data.unitKerjaId || null,
          wilayahId: operatorWilayahId,
          wilayah: operatorWilayahEnum,
          mustChangePassword: true
        },
        include: {
          unitKerja: {
            select: {
              id: true,
              nama: true,
              jenjang: true
            }
          }
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Pegawai berhasil ditambahkan',
        data: {
          id: newUser.id,
          nama: newUser.name,
          email: newUser.email,
          nip: newUser.nip,
          unitKerjaId: newUser.unitKerjaId
        }
      })
    }

    return NextResponse.json({ 
      success: false, 
      message: 'Invalid request format' 
    }, { status: 400 })

  } catch (error) {
    console.error('Error in POST /api/operator/pegawai:', error)
    let errorMessage = 'Internal server error'
    
    if (error instanceof Error) {
      errorMessage = error.message
      
      // Log specific error details for debugging
      if (error.stack) {
        console.error('Stack trace:', error.stack)
      }
      
      // Prisma specific errors
      if (error.name === 'PrismaClientKnownRequestError') {
        errorMessage = 'Database query error'
      } else if (error.name === 'PrismaClientValidationError') {
        errorMessage = 'Invalid data format'
      } else if (error.name === 'PrismaClientRustPanicError') {
        errorMessage = 'Critical database error'
      }
    }
    
    return NextResponse.json({ 
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
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
