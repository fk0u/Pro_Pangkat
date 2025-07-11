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
      select: { 
        unitKerja: true, 
        wilayah: true 
      }
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 400 })
    }

    // Extract unitKerja ID based on whether it's a string or an object
    let unitKerjaId = null;
    if (typeof user.unitKerja === 'string') {
      // Try to find the unitKerja by name
      const unitKerjaByName = await prisma.unitKerja.findFirst({
        where: { nama: user.unitKerja },
        select: { id: true }
      });
      unitKerjaId = unitKerjaByName?.id;
    } else if (typeof user.unitKerja === 'object' && user.unitKerja !== null) {
      // If it's already an object with an ID
      unitKerjaId = (user.unitKerja as { id: string }).id;
    }

    if (!unitKerjaId) {
      return NextResponse.json({ message: 'Unit kerja ID not found' }, { status: 400 })
    }

    // Get stats for the school
    const [totalPegawai, totalUsulan, usulanStats, activeTimeline] = await Promise.all([
      // Total pegawai in the unit kerja
      prisma.user.count({
        where: {
          role: 'PEGAWAI',
          unitKerjaId: unitKerjaId
        }
      }),

      // Total usulan from pegawai in this unit kerja
      prisma.promotionProposal.count({
        where: {
          pegawai: {
            unitKerjaId: unitKerjaId
          }
        }
      }),

      // Usulan by status
      prisma.promotionProposal.groupBy({
        by: ['status'],
        where: {
          pegawai: {
            unitKerjaId: unitKerjaId
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

    // Get the unit kerja name
    const unitKerjaData = await prisma.unitKerja.findUnique({
      where: { id: unitKerjaId },
      select: { nama: true }
    });
    const unitKerjaNama = unitKerjaData?.nama || 'Unknown';

    const response = {
      totalPegawai,
      totalUsulan,
      usulanMenunggu,
      usulanDiproses,
      usulanSelesai,
      deadlineAktif: activeTimeline?.endDate?.toISOString() || null,
      unitKerja: unitKerjaNama,
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
