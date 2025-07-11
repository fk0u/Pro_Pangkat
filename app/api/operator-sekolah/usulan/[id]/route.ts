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
    
    if (!session.isLoggedIn || session.user?.role !== 'OPERATOR_SEKOLAH') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Get user's unit kerja
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { unitKerja: true }
    })

    if (!user?.unitKerja) {
      return NextResponse.json({ message: 'Unit kerja not found' }, { status: 400 })
    }

    // Get usulan detail
    const usulan = await prisma.promotionProposal.findFirst({
      where: {
        id,
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
            golongan: true,
            unitKerja: true
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
      pegawai: {
        id: usulan.pegawai.id,
        name: usulan.pegawai.name,
        nip: usulan.pegawai.nip,
        jabatan: usulan.pegawai.jabatan,
        golongan: usulan.pegawai.golongan,
        unitKerja: typeof usulan.pegawai.unitKerja === 'object' ? {
          id: usulan.pegawai.unitKerja.id,
          nama: usulan.pegawai.unitKerja.nama,
          jenjang: usulan.pegawai.unitKerja.jenjang
        } : usulan.pegawai.unitKerja
      },
      golonganAsal: currentGolongan,
      golonganTujuan: golonganTujuan,
      periode: usulan.periode,
      status: usulan.status,
      tanggalAjukan: usulan.createdAt.toISOString().split('T')[0],
      tanggalUpdate: usulan.updatedAt.toISOString().split('T')[0],
      keterangan: usulan.notes || '',
      documents: usulan.documents.map((doc: any) => ({
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
    
    if (!session.isLoggedIn || session.user?.role !== 'OPERATOR_SEKOLAH') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    // Get user's unit kerja
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { unitKerja: true, name: true }
    })

    if (!user?.unitKerja) {
      return NextResponse.json({ message: 'Unit kerja not found' }, { status: 400 })
    }

    // Check if usulan exists and belongs to user's unit
    const existingUsulan = await prisma.promotionProposal.findFirst({
      where: {
        id,
        pegawai: {
          unitKerja: user.unitKerja
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
          // WORKFLOW: Approve dari operator sekolah ke operator dinas
          if (existingUsulan.status !== 'MENUNGGU_VERIFIKASI_SEKOLAH') {
            return NextResponse.json({ 
              message: 'Usulan tidak dapat disetujui dalam status ini' 
            }, { status: 400 })
          }
          
          newStatus = StatusProposal.MENUNGGU_VERIFIKASI_DINAS
          newNotes += `\n[${timestamp}] Disetujui oleh operator sekolah (${user.name})`
          if (notes) newNotes += `: ${notes}`
          break

        case 'reject':
          // Reject usulan
          if (!['MENUNGGU_VERIFIKASI_SEKOLAH'].includes(existingUsulan.status)) {
            return NextResponse.json({ 
              message: 'Usulan tidak dapat ditolak dalam status ini' 
            }, { status: 400 })
          }
          
          newStatus = StatusProposal.DITOLAK_SEKOLAH
          newNotes += `\n[${timestamp}] Ditolak oleh operator sekolah (${user.name})`
          if (notes) newNotes += `: ${notes}`
          break

        case 'return_for_revision':
          // Return for revision
          if (existingUsulan.status !== 'MENUNGGU_VERIFIKASI_SEKOLAH') {
            return NextResponse.json({ 
              message: 'Usulan tidak dapat dikembalikan dalam status ini' 
            }, { status: 400 })
          }
          
          newStatus = StatusProposal.PERLU_PERBAIKAN_DARI_SEKOLAH
          newNotes += `\n[${timestamp}] Dikembalikan untuk perbaikan oleh operator sekolah (${user.name})`
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
          action: action.toUpperCase() + "_BY_OPERATOR_SEKOLAH",
          details: { 
            usulanId: updatedUsulan.id,
            fromStatus: existingUsulan.status,
            toStatus: newStatus,
            actionBy: 'operator_sekolah',
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
      // Regular update
      const { periode, keterangan } = body

      // Only allow updates if status is DRAFT or similar editable states
      if (!['DRAFT', 'DIKEMBALIKAN_OPERATOR', 'DIKEMBALIKAN_ADMIN', 'PERLU_PERBAIKAN_DARI_SEKOLAH'].includes(existingUsulan.status)) {
        return NextResponse.json({ 
          message: 'Usulan tidak dapat diubah dalam status ini' 
        }, { status: 400 })
      }

      // Update usulan
      const updatedUsulan = await prisma.promotionProposal.update({
        where: { id },
        data: {
          periode: periode || existingUsulan.periode,
          notes: keterangan !== undefined ? keterangan : existingUsulan.notes,
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
          action: "UPDATE_USULAN",
          details: {
            usulanId: updatedUsulan.id,
            pegawaiName: updatedUsulan.pegawai.name,
            changes: { periode, keterangan }
          },
          userId: session.user.id,
        }
      })

      return NextResponse.json({ 
        message: 'Usulan berhasil diperbarui',
        usulan: {
          id: updatedUsulan.id,
          periode: updatedUsulan.periode,
          keterangan: updatedUsulan.notes
        }
      })
    }
  } catch (error) {
    console.error('Update usulan error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn || session.user?.role !== 'OPERATOR_SEKOLAH') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Get user's unit kerja
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { unitKerja: true }
    })

    if (!user?.unitKerja) {
      return NextResponse.json({ message: 'Unit kerja not found' }, { status: 400 })
    }

    // Check if usulan exists and belongs to user's unit
    const existingUsulan = await prisma.promotionProposal.findFirst({
      where: {
        id,
        pegawai: {
          unitKerja: user.unitKerja
        }
      },
      include: {
        pegawai: {
          select: {
            name: true
          }
        }
      }
    })

    if (!existingUsulan) {
      return NextResponse.json({ message: 'Usulan not found' }, { status: 404 })
    }

    // Only allow deletion if status is DRAFT
    if (existingUsulan.status !== 'DRAFT') {
      return NextResponse.json({ 
        message: 'Hanya usulan dengan status draft yang dapat dihapus' 
      }, { status: 400 })
    }

    // Delete related documents first
    await prisma.proposalDocument.deleteMany({
      where: { proposalId: id }
    })

    // Delete usulan
    await prisma.promotionProposal.delete({
      where: { id }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "DELETE_USULAN",
        details: {
          usulanId: id,
          pegawaiName: existingUsulan.pegawai.name,
        },
        userId: session.user.id,
      }
    })

    return NextResponse.json({ 
      message: 'Usulan berhasil dihapus'
    })
  } catch (error) {
    console.error('Delete usulan error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}