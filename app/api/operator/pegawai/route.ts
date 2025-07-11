import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import * as XLSX from 'xlsx'

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
        unitKerja: {
          select: {
            id: true,
            nama: true,
            wilayah: true
          }
        }
      }
    })

    // Get operator wilayah
    const operatorWilayahEnum = user?.wilayah

    if (!operatorWilayahEnum) {
      return NextResponse.json({ success: false, message: 'Wilayah operator not found' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const unitKerja = searchParams.get('unitKerja') || 'all'
    const jabatan = searchParams.get('jabatan') || 'all'
    const golongan = searchParams.get('golongan') || 'all'
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build filter conditions
    const whereClause: Record<string, unknown> = {
      role: 'PEGAWAI',
      wilayah: operatorWilayahEnum
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
      // Improved unit kerja filter with better search capabilities
      const unitKerjaObj = await prisma.unitKerja.findFirst({
        where: { 
          OR: [
            { nama: { equals: unitKerja, mode: 'insensitive' } },
            { nama: { contains: unitKerja, mode: 'insensitive' } }
          ],
          wilayah: operatorWilayahEnum
        }
      });
      
      if (unitKerjaObj) {
        whereClause.unitKerjaId = unitKerjaObj.id;
      } else {
        // If specific unit kerja not found, include as part of search instead
        // This prevents returning empty results when a unit kerja name has typos
        const searchOR = whereClause.OR as Array<Record<string, unknown>> || [];
        searchOR.push({ unitKerja: { nama: { contains: unitKerja, mode: 'insensitive' } } });
        whereClause.OR = searchOR;
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
      // Pre-filter users based on having proposals or not
      if (status === 'belum_ada') {
        // Find all pegawai IDs that have proposals
        const pegawaiWithProposals = await prisma.promotionProposal.findMany({
          where: {
            pegawai: {
              wilayah: operatorWilayahEnum,
              role: 'PEGAWAI'
            }
          },
          select: {
            pegawaiId: true
          },
          distinct: ['pegawaiId']
        });
        
        // Exclude these IDs from our query (users WITH proposals)
        if (pegawaiWithProposals.length > 0) {
          whereClause.id = {
            notIn: pegawaiWithProposals.map(p => p.pegawaiId)
          };
        }
      } else if (status === 'ada_usulan') {
        // Find all pegawai IDs that have active proposals
        const pegawaiWithActiveProposals = await prisma.promotionProposal.findMany({
          where: {
            pegawai: {
              wilayah: operatorWilayahEnum,
              role: 'PEGAWAI'
            },
            status: { 
              notIn: ['SELESAI', 'DITOLAK'] 
            }
          },
          select: {
            pegawaiId: true
          },
          distinct: ['pegawaiId']
        });
        
        // Only include these IDs (users with active proposals)
        if (pegawaiWithActiveProposals.length > 0) {
          whereClause.id = {
            in: pegawaiWithActiveProposals.map(p => p.pegawaiId)
          };
        } else {
          // If no one has active proposals, return empty result
          whereClause.id = '0'; // This will match no users
        }
      } else if (status === 'selesai') {
        // Find all pegawai IDs that only have completed/rejected proposals
        // This requires checking if they have proposals AND all are completed/rejected
        
        // Step 1: Get all pegawai with any proposals
        const allPegawaiWithProposals = await prisma.promotionProposal.findMany({
          where: {
            pegawai: {
              wilayah: operatorWilayahEnum,
              role: 'PEGAWAI'
            }
          },
          select: {
            pegawaiId: true
          },
          distinct: ['pegawaiId']
        });
        
        // Step 2: Get all pegawai with active proposals
        const pegawaiWithActiveProposals = await prisma.promotionProposal.findMany({
          where: {
            pegawai: {
              wilayah: operatorWilayahEnum,
              role: 'PEGAWAI'
            },
            status: { 
              notIn: ['SELESAI', 'DITOLAK'] 
            }
          },
          select: {
            pegawaiId: true
          },
          distinct: ['pegawaiId']
        });
        
        // Step 3: Filter for users with proposals but no active ones
        const pegawaiWithOnlyCompletedProposals = allPegawaiWithProposals
          .filter(p => !pegawaiWithActiveProposals.some(ap => ap.pegawaiId === p.pegawaiId))
          .map(p => p.pegawaiId);
        
        if (pegawaiWithOnlyCompletedProposals.length > 0) {
          whereClause.id = {
            in: pegawaiWithOnlyCompletedProposals
          };
        } else {
          // If no one has only completed proposals, return empty result
          whereClause.id = '0'; // This will match no users
        }
      }
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
          unitKerja: {
            select: {
              id: true,
              nama: true,
              jenjang: true,
              npsn: true,
              wilayah: true
            }
          },
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          name: 'asc'
        },
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
          wilayah: operatorWilayahEnum
        },
        status: {
          notIn: ['SELESAI', 'DITOLAK']
        }
      }
    });

    // Get a count of pegawai with at least one proposal
    let pegawaiWithProposalsCount = 0;
    try {
      const result = await prisma.$queryRaw`
        SELECT COUNT(DISTINCT "pegawaiId") as count
        FROM "PromotionProposal" pp
        JOIN "User" u ON pp."pegawaiId" = u.id
        WHERE u."wilayah" = ${operatorWilayahEnum}
        AND u.role = 'PEGAWAI'
      `;
      if (Array.isArray(result) && result.length > 0 && result[0].count) {
        pegawaiWithProposalsCount = Number(result[0].count);
      }
    } catch (err) {
      console.error("Error in pegawaiWithProposalsCount query:", err);
      // Fallback: Get count with regular Prisma query
      const distinctPegawaiIds = await prisma.promotionProposal.findMany({
        where: {
          pegawai: {
            wilayah: operatorWilayahEnum,
            role: 'PEGAWAI'
          }
        },
        select: {
          pegawaiId: true
        },
        distinct: ['pegawaiId']
      });
      pegawaiWithProposalsCount = distinctPegawaiIds.length;
    }

    // Get summary statistics
    const summaryStats = await Promise.all([
      // Total pegawai
      prisma.user.count({
        where: {
          role: 'PEGAWAI',
          wilayah: operatorWilayahEnum
        }
      }),
      
      // By jabatan
      prisma.user.groupBy({
        by: ['jabatan'],
        where: {
          role: 'PEGAWAI',
          wilayah: operatorWilayahEnum,
          jabatan: { not: null }
        },
        _count: { jabatan: true }
      }),
      
      // By golongan
      prisma.user.groupBy({
        by: ['golongan'],
        where: {
          role: 'PEGAWAI',
          wilayah: operatorWilayahEnum,
          golongan: { not: null }
        },
        _count: { golongan: true }
      }),
      
      // Total proposals count
      prisma.promotionProposal.count({
        where: {
          pegawai: {
            wilayah: operatorWilayahEnum
          }
        }
      })
    ]);

    // Transform summary data
    const summary = {
      totalPegawai: summaryStats[0],
      pegawaiDenganUsulan: pegawaiWithProposalsCount,
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
      try {
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
          nip: pegawai.nip || '',
          phone: pegawai.phone || '',
          address: pegawai.address || '',
          jabatan: pegawai.jabatan || '',
          jenisJabatan: pegawai.jenisJabatan || '',
          golongan: pegawai.golongan || '',
          unitKerjaId: pegawai.unitKerja?.id || '',
          unitKerja: pegawai.unitKerja?.nama || 'Belum Ditentukan',
          wilayah: pegawai.wilayah || '',
          wilayahNama: formatWilayahForDisplay(pegawai.wilayah),
          totalProposals,
          activeProposals,
          proposalStatus,
          latestProposal: latestProposal || null,
          createdAt: pegawai.createdAt.toISOString(),
          updatedAt: pegawai.updatedAt.toISOString()
        };
      } catch (err) {
        console.error(`Error transforming pegawai data for id ${pegawai.id}:`, err);
        // Return fallback data with minimal information to prevent page failure
        return {
          id: pegawai.id,
          nama: pegawai.name || '',
          email: pegawai.email || '',
          nip: pegawai.nip || '',
          phone: pegawai.phone || '',
          address: pegawai.address || '',
          jabatan: pegawai.jabatan || '',
          jenisJabatan: pegawai.jenisJabatan || '',
          golongan: pegawai.golongan || '',
          unitKerjaId: pegawai.unitKerja?.id || '',
          unitKerja: pegawai.unitKerja?.nama || 'Belum Ditentukan',
          wilayah: pegawai.wilayah || '',
          wilayahNama: formatWilayahForDisplay(pegawai.wilayah),
          totalProposals: 0,
          activeProposals: 0,
          proposalStatus: 'Error: Data Tidak Tersedia',
          latestProposal: null,
          createdAt: pegawai.createdAt.toISOString(),
          updatedAt: pegawai.updatedAt.toISOString()
        };
      }
    }));

    // Get all available unit kerja and jabatan for filtering
    const unitKerjaList = await prisma.unitKerja.findMany({
      where: {
        wilayah: operatorWilayahEnum
      },
      select: {
        nama: true
      },
      orderBy: {
        nama: 'asc'
      }
    });

    const jabatanList = await prisma.user.findMany({
      where: {
        role: 'PEGAWAI',
        wilayah: operatorWilayahEnum,
        jabatan: { not: null }
      },
      select: {
        jabatan: true
      },
      distinct: ['jabatan']
    });

    // Prepare filter options for frontend
    const filterOptions = {
      unitKerja: unitKerjaList.map(uk => uk.nama),
      jabatan: jabatanList.map(j => j.jabatan || '').filter(Boolean),
      status: [
        { value: 'ada_usulan', label: 'Ada Usulan' },
        { value: 'belum_ada', label: 'Belum Ada Usulan' },
        { value: 'selesai', label: 'Selesai/Ditolak' }
      ]
    };

    return NextResponse.json({
      success: true,
      data: transformedData,
      summary,
      filterOptions,
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
        wilayah: user?.wilayah
      }
    });

  } catch (error) {
    console.error('Error fetching pegawai data:', error);
    
    // Create a more detailed error message for debugging
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      errorMessage = `${error.name}: ${error.message}`;
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json({ 
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
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
        unitKerja: {
          select: {
            id: true,
            nama: true,
            wilayah: true
          }
        }
      }
    })

    // Get operator wilayah
    const operatorWilayahEnum = user?.wilayah

    if (!operatorWilayahEnum) {
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

            // Find unit kerja berdasarkan nama dengan pencarian yang lebih fleksibel
            let unitKerjaId = null
            if (row['UNIT KERJA']?.toString().trim()) {
              const unitKerjaName = row['UNIT KERJA'].toString().trim()
              
              // Coba pencarian dengan contains terlebih dahulu
              let existingUnitKerja = await prisma.unitKerja.findFirst({
                where: { 
                  nama: { contains: unitKerjaName, mode: 'insensitive' },
                  wilayah: operatorWilayahEnum
                }
              })
              
              // Jika tidak ditemukan, coba dengan pencarian exact match
              if (!existingUnitKerja) {
                existingUnitKerja = await prisma.unitKerja.findFirst({
                  where: { 
                    nama: { equals: unitKerjaName, mode: 'insensitive' },
                    wilayah: operatorWilayahEnum
                  }
                })
              }
              
              // Jika masih tidak ditemukan, coba pencarian dengan startsWith
              if (!existingUnitKerja) {
                existingUnitKerja = await prisma.unitKerja.findFirst({
                  where: { 
                    nama: { startsWith: unitKerjaName, mode: 'insensitive' },
                    wilayah: operatorWilayahEnum
                  }
                })
              }
              
              // Jika masih tidak ditemukan, cari berdasarkan sebagian kata
              if (!existingUnitKerja) {
                const words = unitKerjaName.split(' ').filter(word => word.length > 3);
                if (words.length > 0) {
                  for (const word of words) {
                    existingUnitKerja = await prisma.unitKerja.findFirst({
                      where: { 
                        nama: { contains: word, mode: 'insensitive' },
                        wilayah: operatorWilayahEnum
                      }
                    });
                    if (existingUnitKerja) break;
                  }
                }
              }
              
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
    return NextResponse.json({ 
      success: false,
      message: 'Internal server error' 
    }, { status: 500 })
  }
}

// Add OPTIONS method to support export functionality
export async function OPTIONS(request: NextRequest) {
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
        unitKerja: {
          select: {
            id: true,
            nama: true,
            wilayah: true
          }
        }
      }
    })

    // Get operator wilayah
    const operatorWilayahEnum = user?.wilayah

    if (!operatorWilayahEnum) {
      return NextResponse.json({ success: false, message: 'Wilayah operator not found' }, { status: 400 })
    }

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url)
    const unitKerja = searchParams.get('unitKerja') || 'all'
    const jabatan = searchParams.get('jabatan') || 'all'
    const golongan = searchParams.get('golongan') || 'all'
    
    // Build filter conditions - similar to GET but without pagination
    const whereClause: Record<string, unknown> = {
      role: 'PEGAWAI',
      wilayah: operatorWilayahEnum
    }

    // Add unit kerja filter
    if (unitKerja !== 'all') {
      const unitKerjaObj = await prisma.unitKerja.findFirst({
        where: { 
          OR: [
            { nama: { equals: unitKerja, mode: 'insensitive' } },
            { nama: { contains: unitKerja, mode: 'insensitive' } }
          ],
          wilayah: operatorWilayahEnum
        }
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

    // Get pegawai data without pagination
    const pegawaiList = await prisma.user.findMany({
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
        unitKerja: {
          select: {
            id: true,
            nama: true,
            jenjang: true,
            npsn: true
          }
        },
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // For each pegawai, get their proposal information
    const exportData = await Promise.all(pegawaiList.map(async (pegawai) => {
      // Get latest proposal and counts
      const proposals = await prisma.promotionProposal.findMany({
        where: { pegawaiId: pegawai.id },
        orderBy: { updatedAt: 'desc' },
        take: 1,
        select: {
          status: true,
          createdAt: true,
          updatedAt: true
        }
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
      
      // Create export row
      return {
        "NIP": pegawai.nip || '',
        "NAMA": pegawai.name || '',
        "EMAIL": pegawai.email || '',
        "JABATAN": pegawai.jabatan || '',
        "JENIS JABATAN": pegawai.jenisJabatan || '',
        "GOLONGAN": pegawai.golongan || '',
        "TELEPON": pegawai.phone || '',
        "ALAMAT": pegawai.address || '',
        "UNIT KERJA": pegawai.unitKerja?.nama || 'Belum Ditentukan',
        "JENJANG": pegawai.unitKerja?.jenjang || '',
        "NPSN": pegawai.unitKerja?.npsn || '',
        "WILAYAH": formatWilayahForDisplay(pegawai.wilayah),
        "TOTAL USULAN": totalProposals,
        "USULAN AKTIF": activeProposals,
        "STATUS USULAN TERAKHIR": latestProposal ? formatStatusProposal(latestProposal.status) : 'Belum Ada Usulan',
        "TERAKHIR DIPERBARUI": pegawai.updatedAt.toLocaleDateString('id-ID')
      };
    }));

    // Create Excel workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths for better readability
    const columnWidths = [
      { wch: 20 }, // NIP
      { wch: 30 }, // NAMA
      { wch: 25 }, // EMAIL
      { wch: 25 }, // JABATAN
      { wch: 15 }, // JENIS JABATAN
      { wch: 10 }, // GOLONGAN
      { wch: 15 }, // TELEPON
      { wch: 30 }, // ALAMAT
      { wch: 30 }, // UNIT KERJA
      { wch: 10 }, // JENJANG
      { wch: 10 }, // NPSN
      { wch: 20 }, // WILAYAH
      { wch: 12 }, // TOTAL USULAN
      { wch: 12 }, // USULAN AKTIF
      { wch: 20 }, // STATUS USULAN TERAKHIR
      { wch: 20 }, // TERAKHIR DIPERBARUI
    ];
    
    worksheet['!cols'] = columnWidths;
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Pegawai");
    
    // Generate the Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Return Excel file
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Daftar_Pegawai_${formatDateForFileName()}.xlsx"`
      }
    });
    
  } catch (error) {
    console.error('Error exporting pegawai data:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Internal server error during export',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}

// Helper for formatting file names
function formatDateForFileName() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// Helper for formatting status
function formatStatusProposal(status: string): string {
  const statusMap: Record<string, string> = {
    'DRAFT': 'Draft',
    'DIAJUKAN': 'Diajukan',
    'DIPROSES_OPERATOR': 'Diproses Operator',
    'DISETUJUI_OPERATOR': 'Disetujui Operator',
    'DIPROSES_ADMIN': 'Diproses Admin',
    'SELESAI': 'Selesai',
    'DITOLAK': 'Ditolak',
  };
  
  return statusMap[status] || status;
}

// Helper function for backward compatibility
function formatWilayahForDisplay(wilayahCode: string | null | undefined): string {
  if (!wilayahCode) return 'Belum Ditentukan';
  
  // Define a map of wilayah codes to display names
  const wilayahMap: Record<string, string> = {
    'BALIKPAPAN_PPU': 'Balikpapan & PPU',
    'KUTIM_BONTANG': 'Kutai Timur & Bontang',
    'KUKAR': 'Kutai Kartanegara',
    'KUBAR_MAHULU': 'Kutai Barat & Mahulu',
    'PASER': 'Paser',
    'BERAU': 'Berau',
    'SAMARINDA': 'Samarinda',
  };
  
  // Return the mapped name if it exists, otherwise return the original code
  return wilayahMap[wilayahCode] || String(wilayahCode);
}