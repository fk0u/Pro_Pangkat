import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn || session.user?.role !== 'OPERATOR_SEKOLAH') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, keterangan } = body
    const usulanId = params.id

    // Get user's unit kerja
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { unitKerja: true }
    })

    if (!user?.unitKerja) {
      return NextResponse.json({ message: 'Unit kerja not found' }, { status: 400 })
    }

    // Verify usulan belongs to this unit kerja
    const usulan = await prisma.promotionProposal.findFirst({
      where: {
        id: usulanId,
        pegawai: {
          unitKerja: user.unitKerja
        }
      },
      include: {
        pegawai: {
          select: { name: true, nip: true }
        }
      }
    })

    if (!usulan) {
      return NextResponse.json({ message: 'Usulan not found' }, { status: 404 })
    }

    // Validate current status
    if (usulan.status !== 'MENUNGGU_VERIFIKASI_SEKOLAH') {
      return NextResponse.json({ 
        message: 'Usulan tidak dapat diverifikasi pada status saat ini' 
      }, { status: 400 })
    }

    // Update usulan based on action
    let newStatus = ''
    let notes = usulan.notes || ''

    if (action === 'approve') {
      newStatus = 'DIPROSES_OPERATOR'
      notes += `\n[${new Date().toISOString()}] Disetujui oleh operator sekolah`
      if (keterangan) {
        notes += `: ${keterangan}`
      }
    } else if (action === 'reject') {
      newStatus = 'PERLU_PERBAIKAN_DARI_SEKOLAH'
      notes += `\n[${new Date().toISOString()}] Dikembalikan oleh operator sekolah`
      if (keterangan) {
        notes += `: ${keterangan}`
      }
    } else {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 })
    }

    const updatedUsulan = await prisma.promotionProposal.update({
      where: { id: usulanId },
      data: {
        status: newStatus,
        notes: notes.trim(),
        processedBy: session.user.id,
        processedAt: new Date()
      }
    })

    return NextResponse.json({ 
      message: `Usulan berhasil ${action === 'approve' ? 'disetujui' : 'dikembalikan'}`,
      usulan: {
        id: updatedUsulan.id,
        status: updatedUsulan.status,
        notes: updatedUsulan.notes
      }
    })
  } catch (error) {
    console.error('Verifikasi usulan error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
