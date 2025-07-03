import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { StatusProposal } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn || session.user?.role !== 'OPERATOR') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Get user's wilayah
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { wilayah: true }
    })

    if (!user?.wilayah) {
      return NextResponse.json({ message: 'Wilayah not found' }, { status: 400 })
    }

    // Get usulan detail
    const usulan = await prisma.promotionProposal.findFirst({
      where: {
        id,
        pegawai: {
          wilayah: user.wilayah
        }
      },
      include: {
        pegawai: {
          select: {
            id: true,
            name: true,
            nip: true,
            jabatan: true,
            golongan: true,
            unitKerja: true,
            wilayah: true
          }
        },
        documents: {
          include: {
            documentRequirement: {
              select: {
                name: true,
                code: true
              }
            }
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
    const golonganTujuan = golonganMap[currentGolongan] || 'IV/a'

    const formattedUsulan = {
      id: usulan.id,
      pegawai: usulan.pegawai,
      golonganAsal: currentGolongan,
      golonganTujuan: golonganTujuan,
      periode: usulan.periode,
      status: usulan.status,
      tanggalAjukan: usulan.createdAt.toISOString().split('T')[0],
      tanggalUpdate: usulan.updatedAt.toISOString().split('T')[0],
      keterangan: usulan.notes || '',
      documents: usulan.documents.map(doc => ({
        id: doc.id,
        name: doc.documentRequirement.name,
        code: doc.documentRequirement.code,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl,
        status: doc.status,
        notes: doc.notes,
        uploadedAt: doc.uploadedAt.toISOString()
      }))
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
    
    if (!session.isLoggedIn || session.user?.role !== 'OPERATOR') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    // Get user's wilayah
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { wilayah: true, name: true }
    })

    if (!user?.wilayah) {
      return NextResponse.json({ message: 'Wilayah not found' }, { status: 400 })
    }

    // Check if usulan exists and belongs to user's wilayah
    const existingUsulan = await prisma.promotionProposal.findFirst({
      where: {
        id,
        pegawai: {
          wilayah: user.wilayah
        }
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

    if (!existingUsulan) {
      return NextResponse.json({ message: 'Usulan not found' }, { status: 404 })
    }

    // Check if this is an approval action
    if (body.action && ['approve', 'reject', 'return_for_revision'].includes(body.action)) {
      const { action, notes } = body

      let newStatus: StatusProposal
      let newNotes = existingUsulan.notes || ''
      const timestamp = new Date().toISOString()

      switch (action) {
        case 'approve':
          // WORKFLOW: Approve dari operator dinas ke admin pusat
          if (existingUsulan.status !== 'MENUNGGU_VERIFIKASI_DINAS') {
            return NextResponse.json({ 
              message: 'Usulan tidak dapat disetujui dalam status ini' 
            }, { status: 400 })
          }
          
          newStatus = StatusProposal.DIPROSES_ADMIN
          newNotes += `\n[${timestamp}] Disetujui oleh operator dinas (${user.name})`
          if (notes) newNotes += `: ${notes}`
          break

        case 'reject':
          // Reject usulan
          if (!['MENUNGGU_VERIFIKASI_DINAS'].includes(existingUsulan.status)) {
            return NextResponse.json({ 
              message: 'Usulan tidak dapat ditolak dalam status ini' 
            }, { status: 400 })
          }
          
          newStatus = StatusProposal.DITOLAK_DINAS
          newNotes += `\n[${timestamp}] Ditolak oleh operator dinas (${user.name})`
          if (notes) newNotes += `: ${notes}`
          break

        case 'return_for_revision':
          // Return for revision
          if (existingUsulan.status !== 'MENUNGGU_VERIFIKASI_DINAS') {
            return NextResponse.json({ 
              message: 'Usulan tidak dapat dikembalikan dalam status ini' 
            }, { status: 400 })
          }
          
          newStatus = StatusProposal.PERLU_PERBAIKAN_DARI_DINAS
          newNotes += `\n[${timestamp}] Dikembalikan untuk perbaikan oleh operator dinas (${user.name})`
          if (notes) newNotes += `: ${notes}`
          break

        default:
          return NextResponse.json({ message: 'Invalid action' }, { status: 400 })
      }

      // Update usulan status
      const updatedUsulan = await prisma.promotionProposal.update({
        where: { id },
        data: {
          status: newStatus,
          notes: newNotes.trim(),
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
          action: action.toUpperCase() + "_BY_OPERATOR_DINAS",
          details: { 
            usulanId: updatedUsulan.id,
            fromStatus: existingUsulan.status,
            toStatus: newStatus,
            actionBy: 'operator_dinas',
            operatorName: user.name,
            pegawaiName: updatedUsulan.pegawai.name,
            notes: notes
          },
          userId: session.user.id,
        },
      })

      return NextResponse.json({ 
        message: `Usulan berhasil ${action === 'approve' ? 'disetujui' : action === 'reject' ? 'ditolak' : 'dikembalikan untuk perbaikan'}`,
        usulan: {
          id: updatedUsulan.id,
          status: updatedUsulan.status,
          notes: updatedUsulan.notes
        }
      })

    } else {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Update usulan error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
