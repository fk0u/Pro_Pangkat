import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current logged-in user
    const { getSession } = await import('@/lib/auth')
    const session = await getSession()
    
    if (!session.isLoggedIn || session.user?.role !== 'OPERATOR') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const pegawaiId = params.id
    
    if (!pegawaiId) {
      return NextResponse.json({ success: false, message: 'ID pegawai tidak valid' }, { status: 400 })
    }

    // Get the pegawai detail
    const pegawai = await prisma.user.findUnique({
      where: { id: pegawaiId },
      select: {
        id: true,
        name: true,
        nip: true,
        email: true,
        jabatan: true,
        jenisJabatan: true,
        golongan: true,
        tmtJabatan: true,
        phone: true,
        address: true,
        unitKerjaId: true,
        unitKerja: {
          select: {
            id: true,
            nama: true,
            jenjang: true,
            npsn: true,
            alamat: true
          }
        },
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

    if (!pegawai) {
      return NextResponse.json({ success: false, message: 'Pegawai tidak ditemukan' }, { status: 404 })
    }

    // Get proposal history
    const proposals = await prisma.promotionProposal.findMany({
      where: { pegawaiId: pegawaiId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        currentGolongan: true,
        targetGolongan: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        timeline: {
          select: {
            id: true,
            status: true,
            description: true,
            createdAt: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        documents: {
          select: {
            id: true,
            name: true,
            documentType: true,
            filePath: true,
            fileSize: true,
            mimeType: true,
            uploadedAt: true
          }
        }
      }
    })

    // Transform data
    const transformedData = {
      id: pegawai.id,
      nama: pegawai.name,
      nip: pegawai.nip,
      email: pegawai.email,
      jabatan: pegawai.jabatan,
      jenisJabatan: pegawai.jenisJabatan,
      golongan: pegawai.golongan,
      tmtJabatan: pegawai.tmtJabatan ? pegawai.tmtJabatan.toISOString() : null,
      phone: pegawai.phone,
      address: pegawai.address,
      unitKerja: pegawai.unitKerja?.nama,
      unitKerjaId: pegawai.unitKerjaId,
      unitKerjaDetail: pegawai.unitKerja,
      wilayah: pegawai.wilayah,
      wilayahId: pegawai.wilayahId,
      wilayahNama: pegawai.wilayahRelasi?.nama || formatWilayahForDisplay(pegawai.wilayah),
      wilayahDetail: pegawai.wilayahRelasi,
      proposals: proposals.map(proposal => ({
        id: proposal.id,
        currentGolongan: proposal.currentGolongan,
        targetGolongan: proposal.targetGolongan,
        status: proposal.status,
        notes: proposal.notes,
        createdAt: proposal.createdAt.toISOString(),
        updatedAt: proposal.updatedAt.toISOString(),
        timeline: proposal.timeline.map(item => ({
          id: item.id,
          status: item.status,
          description: item.description,
          createdAt: item.createdAt.toISOString(),
          createdBy: item.createdBy
        })),
        documents: proposal.documents.map(doc => ({
          id: doc.id,
          name: doc.name,
          documentType: doc.documentType,
          filePath: doc.filePath,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          uploadedAt: doc.uploadedAt.toISOString()
        }))
      }))
    }

    return NextResponse.json({
      success: true,
      data: transformedData
    })

  } catch (error) {
    console.error('Error fetching pegawai detail:', error)
    let errorMessage = 'Internal server error'
    
    if (error instanceof Error) {
      errorMessage = error.message
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
