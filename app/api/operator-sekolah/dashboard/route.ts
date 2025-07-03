import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn || session.user?.role !== 'OPERATOR_SEKOLAH') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get user's unit kerja for filtering
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { unitKerja: true, wilayah: true }
    })

    if (!user?.unitKerja) {
      return NextResponse.json({ message: 'Unit kerja not found' }, { status: 400 })
    }

    // Get stats for the school
    const [totalPegawai, totalUsulan, usulanStats, activeTimeline] = await Promise.all([
      // Total pegawai in the unit kerja
      prisma.user.count({
        where: {
          role: 'PEGAWAI',
          unitKerja: user.unitKerja
        }
      }),

      // Total usulan from pegawai in this unit kerja
      prisma.promotionProposal.count({
        where: {
          pegawai: {
            unitKerja: user.unitKerja
          }
        }
      }),

      // Usulan by status
      prisma.promotionProposal.groupBy({
        by: ['status'],
        where: {
          pegawai: {
            unitKerja: user.unitKerja
          }
        },
        _count: {
          status: true
        }
      }),

      // Active timeline
      prisma.timeline.findFirst({
        where: {
          isActive: true,
          OR: [
            { wilayah: null },
            { wilayah: user.wilayah }
          ]
        },
        select: {
          endDate: true,
          title: true
        }
      })
    ])

    // Process usulan stats
    const usulanMenunggu = usulanStats.find(s => 
      ['DIAJUKAN', 'MENUNGGU_VERIFIKASI_SEKOLAH'].includes(s.status)
    )?._count.status || 0

    const usulanDiproses = usulanStats.find(s => 
      ['DIPROSES_OPERATOR', 'DIPROSES_ADMIN', 'MENUNGGU_VERIFIKASI_DINAS'].includes(s.status)
    )?._count.status || 0

    const usulanSelesai = usulanStats.find(s => 
      ['SELESAI'].includes(s.status)
    )?._count.status || 0

    const response = {
      totalPegawai,
      totalUsulan,
      usulanMenunggu,
      usulanDiproses,
      usulanSelesai,
      deadlineAktif: activeTimeline?.endDate?.toISOString() || null,
      unitKerja: user.unitKerja,
      wilayah: user.wilayah
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
