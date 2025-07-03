import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn || session.user?.role !== 'OPERATOR_SEKOLAH') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get user's unit kerja for filtering
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { unitKerja: true }
    })

    if (!user?.unitKerja) {
      return NextResponse.json({ message: 'Unit kerja not found' }, { status: 400 })
    }

    // Get usulan for this unit kerja
    const usulan = await prisma.promotionProposal.findMany({
      where: {
        pegawai: {
          unitKerja: user.unitKerja
        }
      },
      include: {
        pegawai: {
          select: {
            id: true,
            name: true,
            nip: true,
            jabatan: true,
            golongan: true
          }
        },
        documents: {
          select: {
            id: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Format usulan data
    const formattedUsulan = usulan.map(u => {
      // Generate golongan tujuan based on current golongan
      const currentGolongan = u.pegawai.golongan || 'III/a'
      const golonganMap: Record<string, string> = {
        'III/a': 'III/b',
        'III/b': 'III/c',
        'III/c': 'III/d',
        'III/d': 'IV/a',
        'IV/a': 'IV/b',
        'IV/b': 'IV/c',
        'IV/c': 'IV/d',
        'IV/d': 'IV/e',
      }
      const golonganTujuan = golonganMap[currentGolongan] || 'IV/a'

      return {
        id: u.id,
        pegawai: {
          id: u.pegawai.id,
          name: u.pegawai.name,
          nip: u.pegawai.nip,
          jabatan: u.pegawai.jabatan,
          golongan: u.pegawai.golongan
        },
        golonganAsal: currentGolongan,
        golonganTujuan: golonganTujuan,
        periode: u.periode,
        status: u.status,
        tanggalAjukan: u.createdAt.toISOString().split('T')[0],
        tanggalUpdate: u.updatedAt.toISOString().split('T')[0],
        keterangan: u.notes || 'Tidak ada keterangan',
        dokumenCount: u.documents.length,
        dokumenDiapprove: u.documents.filter((d: any) => d.status === 'DISETUJUI').length
      }
    })

    return NextResponse.json({ 
      usulan: formattedUsulan,
      unitKerja: user.unitKerja,
      total: formattedUsulan.length
    })
  } catch (error) {
    console.error('Usulan API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn || session.user?.role !== 'OPERATOR_SEKOLAH') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data for file upload
    const formData = await request.formData()
    const pegawaiId = formData.get('pegawaiId') as string
    const periode = formData.get('periode') as string
    const keterangan = formData.get('keterangan') as string
    const nomorSuratPengantar = formData.get('nomorSuratPengantar') as string
    const tanggalSurat = formData.get('tanggalSurat') as string
    const fileSuratPengantar = formData.get('fileSuratPengantar') as File | null

    // Validation
    if (!pegawaiId) {
      return NextResponse.json({ message: 'Pegawai ID is required' }, { status: 400 })
    }
    
    if (!nomorSuratPengantar?.trim()) {
      return NextResponse.json({ message: 'Nomor surat pengantar is required' }, { status: 400 })
    }
    
    if (!tanggalSurat) {
      return NextResponse.json({ message: 'Tanggal surat is required' }, { status: 400 })
    }

    // Get user's unit kerja
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { unitKerja: true }
    })

    if (!user?.unitKerja) {
      return NextResponse.json({ message: 'Unit kerja not found' }, { status: 400 })
    }

    // Verify pegawai is in the same unit kerja
    const pegawai = await prisma.user.findFirst({
      where: {
        id: pegawaiId,
        role: 'PEGAWAI',
        unitKerja: user.unitKerja
      }
    })

    if (!pegawai) {
      return NextResponse.json({ message: 'Pegawai not found or not in your unit' }, { status: 404 })
    }

    // Check if there's already an active proposal for this pegawai
    const existingProposal = await prisma.promotionProposal.findFirst({
      where: {
        pegawaiId,
        status: {
          notIn: ['SELESAI', 'DITOLAK', 'DITARIK']
        }
      }
    })

    if (existingProposal) {
      return NextResponse.json({ 
        message: 'Pegawai sudah memiliki usulan yang aktif' 
      }, { status: 400 })
    }

    // Handle file upload if provided
    let filePath: string | null = null
    if (fileSuratPengantar && fileSuratPengantar.size > 0) {
      // Create uploads directory if not exists
      const uploadsDir = path.join(process.cwd(), 'uploads', 'cover-letters')
      
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
      }
      
      // Generate unique filename
      const fileExtension = fileSuratPengantar.name.split('.').pop()
      const fileName = `cover-letter-${Date.now()}.${fileExtension}`
      filePath = `/uploads/cover-letters/${fileName}`
      
      // Save file
      const bytes = await fileSuratPengantar.arrayBuffer()
      const buffer = Buffer.from(bytes)
      fs.writeFileSync(path.join(uploadsDir, fileName), buffer)
    }

    // Create usulan
    const usulan = await prisma.promotionProposal.create({
      data: {
        pegawaiId,
        operatorId: session.user.id,
        periode,
        notes: keterangan || null,
        nomorSuratPengantar,
        tanggalSurat: new Date(tanggalSurat),
        fileSuratPengantar: filePath,
        status: 'DRAFT'
      },
      include: {
        pegawai: {
          select: {
            name: true,
            nip: true
          }
        }
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "CREATE_USULAN",
        details: {
          usulanId: usulan.id,
          pegawaiName: usulan.pegawai.name,
          periode: usulan.periode,
          nomorSuratPengantar: usulan.nomorSuratPengantar
        },
        userId: session.user.id,
      }
    })

    // Create notification for the employee
    await prisma.notification.create({
      data: {
        title: "Usulan Kenaikan Pangkat Dibuat",
        message: `Usulan kenaikan pangkat untuk periode ${usulan.periode} telah dibuat oleh operator sekolah. Silakan lengkapi dokumen yang diperlukan.`,
        type: "info",
        userId: pegawaiId,
        actionUrl: "/pegawai/riwayat-usulan",
        actionLabel: "Lihat Usulan"
      }
    })

    return NextResponse.json({ 
      message: 'Usulan berhasil dibuat',
      usulan: {
        id: usulan.id,
        periode: usulan.periode,
        pegawai: usulan.pegawai,
        nomorSuratPengantar: usulan.nomorSuratPengantar,
        tanggalSurat: usulan.tanggalSurat
      }
    })
  } catch (error) {
    console.error('Create usulan error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
