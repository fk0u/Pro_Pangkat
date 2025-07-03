import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn || session.user?.role !== 'OPERATOR_SEKOLAH') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '2025'

    // Get user's unit kerja for filtering
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { unitKerja: true, wilayah: true }
    })

    if (!user?.unitKerja) {
      return NextResponse.json({ message: 'Unit kerja not found' }, { status: 400 })
    }

    // Build date filter based on period
    const currentYear = parseInt(period) || new Date().getFullYear()
    
    const dateFilter = {
      gte: new Date(`${currentYear}-01-01`),
      lt: new Date(`${currentYear + 1}-01-01`)
    }

    // Build where clause for proposals
    const whereClause = {
      pegawai: {
        unitKerja: user.unitKerja
      },
      createdAt: dateFilter
    }

    const [
      totalPegawai,
      totalUsulan,
      usulanSelesai,
      usulanDitolak,
      usulanProses,
      usulanMenunggu,
      monthlyData,
      statusDistribution,
      golonganDistribution
    ] = await Promise.all([
      // Total pegawai
      prisma.user.count({
        where: {
          role: 'PEGAWAI',
          unitKerja: user.unitKerja
        }
      }),

      // Total usulan
      prisma.promotionProposal.count({
        where: whereClause
      }),

      // Usulan selesai
      prisma.promotionProposal.count({
        where: {
          ...whereClause,
          status: 'SELESAI'
        }
      }),

      // Usulan ditolak
      prisma.promotionProposal.count({
        where: {
          ...whereClause,
          status: 'DITOLAK'
        }
      }),

      // Usulan sedang diproses
      prisma.promotionProposal.count({
        where: {
          ...whereClause,
          status: {
            in: ['DIPROSES_OPERATOR', 'DIPROSES_ADMIN']
          }
        }
      }),

      // Usulan menunggu
      prisma.promotionProposal.count({
        where: {
          ...whereClause,
          status: {
            in: ['MENUNGGU_VERIFIKASI_SEKOLAH', 'MENUNGGU_VERIFIKASI_DINAS']
          }
        }
      }),

      // Monthly data - get proposals grouped by month
      prisma.$queryRaw`
        SELECT 
          EXTRACT(MONTH FROM p."createdAt") as month,
          COUNT(*) as total_usulan,
          COUNT(CASE WHEN p.status = 'SELESAI' THEN 1 END) as disetujui,
          COUNT(CASE WHEN p.status = 'DITOLAK' THEN 1 END) as ditolak,
          COUNT(CASE WHEN p.status IN ('MENUNGGU_VERIFIKASI_SEKOLAH', 'MENUNGGU_VERIFIKASI_DINAS') THEN 1 END) as pending
        FROM "PromotionProposal" p
        JOIN "User" u ON p."pegawaiId" = u.id
        WHERE u."unitKerja"::text = ${user.unitKerja}::text
          AND p."createdAt" >= ${dateFilter.gte}
          AND p."createdAt" < ${dateFilter.lt}
        GROUP BY EXTRACT(MONTH FROM p."createdAt")
        ORDER BY month
      `,

      // Status distribution
      prisma.promotionProposal.groupBy({
        by: ['status'],
        where: whereClause,
        _count: {
          status: true
        }
      }),

      // Golongan distribution from pegawai
      prisma.user.groupBy({
        by: ['golongan'],
        where: {
          role: 'PEGAWAI',
          unitKerja: {
            equals: user.unitKerja,
            mode: 'insensitive'
          },
          golongan: {
            not: null
          }
        },
        _count: {
          golongan: true
        }
      })
    ])

    const tingkatPenyelesaian = totalUsulan > 0 ? (usulanSelesai / totalUsulan) * 100 : 0

    // Process monthly data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    
    interface MonthlyDataItem {
      month: number
      total_usulan: bigint
      disetujui: bigint
      ditolak: bigint
      pending: bigint
    }
    
    const processedMonthlyData = Array.from({ length: 12 }, (_, index) => {
      const monthNum = index + 1
      const monthData = (monthlyData as MonthlyDataItem[]).find((item: MonthlyDataItem) => Number(item.month) === monthNum)
      
      return {
        month: monthNames[index],
        usulan: monthData ? Number(monthData.total_usulan) : 0,
        disetujui: monthData ? Number(monthData.disetujui) : 0,
        ditolak: monthData ? Number(monthData.ditolak) : 0,
        pending: monthData ? Number(monthData.pending) : 0
      }
    })

    // Process status distribution
    const statusMap: Record<string, string> = {
      'SELESAI': 'Selesai',
      'DIPROSES_OPERATOR': 'Sedang Diproses',
      'DIPROSES_ADMIN': 'Sedang Diproses', 
      'MENUNGGU_VERIFIKASI_SEKOLAH': 'Menunggu Verifikasi',
      'MENUNGGU_VERIFIKASI_DINAS': 'Menunggu Verifikasi',
      'DITOLAK': 'Ditolak'
    }

    interface StatusDataItem {
      name: string
      value: number
      color: string
    }

    const processedStatusData = statusDistribution.reduce((acc: StatusDataItem[], item) => {
      const displayName = statusMap[item.status] || item.status
      const existing = acc.find(a => a.name === displayName)
      
      if (existing) {
        existing.value += item._count.status
      } else {
        const colors: Record<string, string> = {
          'Selesai': '#10B981',
          'Sedang Diproses': '#3B82F6',
          'Menunggu Verifikasi': '#F59E0B',
          'Ditolak': '#EF4444'
        }
        
        acc.push({
          name: displayName,
          value: item._count.status,
          color: colors[displayName] || '#6B7280'
        })
      }
      return acc
    }, [])

    // Process golongan distribution  
    const processedGolonganData = golonganDistribution.map(item => ({
      golongan: item.golongan || 'Tidak diketahui',
      jumlah: item._count.golongan
    })).sort((a, b) => a.golongan.localeCompare(b.golongan))

    const stats = {
      totalPegawai,
      totalUsulan,
      usulanSelesai,
      usulanProses,
      usulanMenunggu,
      usulanDitolak,
      tingkatPenyelesaian: Math.round(tingkatPenyelesaian * 10) / 10
    }

    return NextResponse.json({
      stats,
      monthlyData: processedMonthlyData,
      statusData: processedStatusData,
      golonganData: processedGolonganData,
      unitKerja: user.unitKerja,
      periode: period
    })
  } catch (error) {
    console.error('Laporan API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
