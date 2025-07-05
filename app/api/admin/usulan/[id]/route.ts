import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { StatusProposal } from '@prisma/client'
import { logProposalActivity } from '@/lib/activity-logger'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Get usulan detail (admin can see all)
    const usulan = await prisma.promotionProposal.findUnique({
      where: { id },
      include: {
        pegawai: {
          select: {
            id: true,
            name: true,
            nip: true,
            jabatan: true,
            golongan: true,
            email: true,
            currentRank: true,
            targetRank: true,
            unitKerja: {
              select: {
                id: true,
                name: true,
                type: true,
                code: true,
                wilayah: {
                  select: {
                    id: true,
                    name: true,
                    type: true
                  }
                }
              }
            }
          }
        },
        documents: {
          include: {
            documentRequirement: {
              select: {
                id: true,
                name: true,
                code: true,
                description: true,
                required: true
              }
            }
          }
        },
        timeline: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            description: true
          }
        }
      }
    })

    if (!usulan) {
      return NextResponse.json({ message: 'Usulan not found' }, { status: 404 })
    }

    // Generate golongan tujuan
    const currentGolongan = usulan.pegawai.golongan || 'III/a'
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
    const golonganTujuan = usulan.pegawai.targetRank || golonganMap[currentGolongan] || 'IV/a'

    // Format unitKerja data
    const unitKerjaData = usulan.pegawai.unitKerja ? {
      id: usulan.pegawai.unitKerja.id,
      name: usulan.pegawai.unitKerja.name,
      type: usulan.pegawai.unitKerja.type,
      code: usulan.pegawai.unitKerja.code,
      wilayah: usulan.pegawai.unitKerja.wilayah ? {
        id: usulan.pegawai.unitKerja.wilayah.id,
        name: usulan.pegawai.unitKerja.wilayah.name,
        type: usulan.pegawai.unitKerja.wilayah.type
      } : null
    } : null;

    const formattedUsulan = {
      id: usulan.id,
      pegawai: {
        ...usulan.pegawai,
        unitKerja: unitKerjaData
      },
      golonganAsal: usulan.pegawai.currentRank || currentGolongan,
      golonganTujuan: golonganTujuan,
      periode: usulan.periode,
      status: usulan.status,
      tanggalAjukan: usulan.createdAt.toISOString().split('T')[0],
      tanggalUpdate: usulan.updatedAt.toISOString().split('T')[0],
      submissionDate: usulan.submissionDate?.toISOString().split('T')[0] || null,
      keterangan: usulan.notes || '',
      documents: usulan.documents.map(doc => ({
        id: doc.id,
        name: doc.documentRequirement?.name || doc.name || 'Dokumen',
        code: doc.documentRequirement?.code || '',
        description: doc.documentRequirement?.description || '',
        required: doc.documentRequirement?.required || false,
        fileName: doc.fileName || doc.name,
        fileUrl: doc.fileUrl,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        status: doc.status,
        notes: doc.notes,
        uploadedAt: doc.uploadedAt?.toISOString() || doc.uploadDate?.toISOString() || null
      })),
      timeline: usulan.timeline ? {
        id: usulan.timeline.id,
        title: usulan.timeline.title,
        startDate: usulan.timeline.startDate.toISOString().split('T')[0],
        endDate: usulan.timeline.endDate.toISOString().split('T')[0],
        description: usulan.timeline.description
      } : null
    }

    return NextResponse.json({ usulan: formattedUsulan })
  } catch (error) {
    console.error('Get usulan detail error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { status, catatan } = body

    if (!status) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true }
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 400 })
    }

    // Check if proposal exists
    const existingProposal = await prisma.promotionProposal.findUnique({
      where: { id },
      include: {
        pegawai: {
          select: {
            id: true,
            name: true,
            nip: true
          }
        }
      }
    })

    if (!existingProposal) {
      return NextResponse.json({ message: 'Usulan not found' }, { status: 404 })
    }

    // Define new notes
    let newNotes = existingProposal.notes || ''
    const timestamp = new Date().toISOString()

    // Add notes about the action
    if (status === 'DISETUJUI_ADMIN') {
      newNotes += `\n[${timestamp}] Disetujui oleh admin ${user.name}`
      if (catatan) newNotes += `: ${catatan}`
    } else if (status === 'DITOLAK') {
      newNotes += `\n[${timestamp}] Ditolak oleh admin ${user.name}`
      if (catatan) newNotes += `: ${catatan}`
    } else {
      newNotes += `\n[${timestamp}] Status diubah menjadi ${status} oleh admin ${user.name}`
      if (catatan) newNotes += `: ${catatan}`
    }

    // Update proposal status
    const updatedProposal = await prisma.promotionProposal.update({
      where: { id },
      data: {
        status: status as StatusProposal, // Use the imported type
        notes: newNotes.trim(),
      }
    })

    // Log activity using our activity logger
    const actionType = status === 'DISETUJUI_ADMIN' ? 'APPROVE' : (status === 'DITOLAK' ? 'REJECT' : 'UPDATE')
    await logProposalActivity(actionType, id, session, {
      fromStatus: existingProposal.status,
      toStatus: status,
      actionBy: user.name,
      pegawaiName: existingProposal.pegawai.name,
      pegawaiId: existingProposal.pegawai.id,
      notes: catatan || null,
      details: {
        proposalId: id,
        previousStatus: existingProposal.status,
        newStatus: status
      }
    })

    // Create notification for the pegawai
    await prisma.notification.create({
      data: {
        title: status === 'DISETUJUI_ADMIN' ? 'Usulan Disetujui' : 'Usulan Ditolak',
        message: status === 'DISETUJUI_ADMIN' 
          ? `Usulan kenaikan pangkat Anda telah disetujui oleh admin.` 
          : `Usulan kenaikan pangkat Anda telah ditolak oleh admin.`,
        type: status === 'DISETUJUI_ADMIN' ? 'success' : 'error',
        userId: existingProposal.pegawaiId,
        actionUrl: `/pegawai/usulan/${id}`,
        actionLabel: 'Lihat Detail'
      }
    })

    return NextResponse.json({ 
      message: `Usulan berhasil ${status === 'DISETUJUI_ADMIN' ? 'disetujui' : 'ditolak'}`,
      usulan: {
        id: updatedProposal.id,
        status: updatedProposal.status,
        notes: updatedProposal.notes
      }
    })
  } catch (error) {
    console.error('Update usulan error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
