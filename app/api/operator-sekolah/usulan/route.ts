import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

export async function GET(_request: NextRequest) {
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

    // Get usulan for this unit kerja, excluding drafts
    const usulan = await prisma.promotionProposal.findMany({
      where: {
        pegawai: {
          unitKerja: user.unitKerja
        },
        // Exclude DRAFT status to only show active proposals
        status: {
          not: 'DRAFT'
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
            fileName: true,
            fileUrl: true,
            status: true,
            documentRequirementId: true,
            documentRequirement: {
              select: {
                name: true,
                code: true
              }
            }
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

      // Format documents for easy access
      const documents = u.documents.map((doc: any) => ({
        id: doc.id,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl,
        status: doc.status,
        documentRequirementId: doc.documentRequirementId,
        documentType: doc.documentRequirement?.name || 'Dokumen',
        documentCode: doc.documentRequirement?.code || '',
        previewUrl: `/api/documents/${doc.id}/preview`,
        downloadUrl: `/api/documents/${doc.id}/download`
      }))

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
        documents: documents,
        dokumenCount: documents.length,
        dokumenDiapprove: documents.filter((d: any) => d.status === 'DISETUJUI').length,
        allDocumentsApproved: documents.length > 0 && documents.every((d: any) => d.status === 'DISETUJUI')
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

    const body = await request.json()
    const { usulanId, action, notes } = body

    if (!usulanId || !action) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    // Validate action
    const validActions = ['APPROVE', 'REJECT', 'RETURN']
    if (!validActions.includes(action)) {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 })
    }

    // Get user's unit kerja for validation
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { unitKerja: true, name: true }
    })

    if (!user?.unitKerja) {
      return NextResponse.json({ message: 'Unit kerja not found' }, { status: 400 })
    }

    // Get the proposal and verify it belongs to the operator's unit kerja
    const proposal = await prisma.promotionProposal.findUnique({
      where: { id: usulanId },
      include: {
        pegawai: {
          select: {
            id: true,
            name: true,
            nip: true,
            unitKerja: true
          }
        },
        documents: true
      }
    })

    if (!proposal) {
      return NextResponse.json({ message: 'Proposal not found' }, { status: 404 })
    }

    // Verify unit kerja matches or that the proposal status is 'MENUNGGU_KONFIRMASI' or 'MENUNGGU_VERIFIKASI_SEKOLAH'
    const isValidStatus = ['MENUNGGU_KONFIRMASI', 'MENUNGGU_VERIFIKASI_SEKOLAH', 'SUBMITTED', 'PENDING'].includes(proposal.status);
    const unitKerjaMatches = typeof proposal.pegawai.unitKerja === 'object' 
      ? proposal.pegawai.unitKerja?.id === user.unitKerja.id
      : proposal.pegawai.unitKerja === user.unitKerja;

    if (!unitKerjaMatches && !isValidStatus) {
      return NextResponse.json({ 
        message: 'You can only manage proposals from your unit kerja or with pending confirmation status' 
      }, { status: 403 })
    }

    // Process action
    let newStatus = proposal.status
    let actionNotes = `Diproses oleh ${user.name} (Operator Sekolah)`
    
    if (notes) {
      actionNotes += `: ${notes}`
    }

    switch (action) {
      case 'APPROVE':
        // If approving, forward to operator (dinas)
        newStatus = 'DISETUJUI_SEKOLAH'
        break
      case 'REJECT':
        // If rejecting, set status to rejected
        newStatus = 'DITOLAK_SEKOLAH'
        break
      case 'RETURN':
        // If returning for corrections, set status accordingly
        newStatus = 'PERLU_PERBAIKAN_DARI_SEKOLAH'
        break
    }

    // Update the proposal
    const updatedProposal = await prisma.promotionProposal.update({
      where: { id: usulanId },
      data: {
        status: newStatus,
        notes: proposal.notes ? `${proposal.notes}\n\n${actionNotes}` : actionNotes,
        // Create a timeline entry
        timeline: {
          create: {
            status: newStatus,
            notes: actionNotes,
            actor: user.name,
            actorRole: 'OPERATOR_SEKOLAH'
          }
        }
      }
    })

    // Create notification for pegawai
    await prisma.notification.create({
      data: {
        userId: proposal.pegawai.id,
        title: `Usulan Kenaikan Pangkat ${action === 'APPROVE' ? 'Disetujui' : action === 'REJECT' ? 'Ditolak' : 'Perlu Perbaikan'}`,
        message: actionNotes,
        type: action === 'APPROVE' ? 'SUCCESS' : action === 'REJECT' ? 'ERROR' : 'WARNING',
        isRead: false,
        metadata: {
          proposalId: usulanId,
          action: action
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: `Usulan berhasil ${action === 'APPROVE' ? 'disetujui' : action === 'REJECT' ? 'ditolak' : 'dikembalikan'}`,
      proposal: updatedProposal
    })
  } catch (error) {
    console.error('Process usulan API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
