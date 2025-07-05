import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET endpoint for retrieving dashboard statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get period filter from query params
    const searchParams = request.nextUrl.searchParams
    const periodId = searchParams.get('periodId')
    const timePeriod = searchParams.get('timePeriod') || 'all' // 'week', 'month', 'year', 'all'
    
    // Build date filter for time-based statistics
    let dateFilter: { gte?: Date } = {}
    if (timePeriod !== 'all') {
      const now = new Date()
      if (timePeriod === 'week') {
        const lastWeek = new Date(now)
        lastWeek.setDate(now.getDate() - 7)
        dateFilter.gte = lastWeek
      } else if (timePeriod === 'month') {
        const lastMonth = new Date(now)
        lastMonth.setMonth(now.getMonth() - 1)
        dateFilter.gte = lastMonth
      } else if (timePeriod === 'year') {
        const lastYear = new Date(now)
        lastYear.setFullYear(now.getFullYear() - 1)
        dateFilter.gte = lastYear
      }
    }
    
    // Build where clause based on period if provided
    const whereClause = periodId ? { periode: { contains: periodId } } : {}
    
    // Get total counts by status
    const proposalCountsByStatus = await prisma.promotionProposal.groupBy({
      by: ['status'],
      where: {
        ...whereClause,
        createdAt: dateFilter
      },
      _count: {
        id: true
      }
    })
    
    // Get user counts by role
    const userCountsByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true
      }
    })
    
    // Get unit kerja counts by type
    const unitKerjaCountsByJenjang = await prisma.unitKerja.groupBy({
      by: ['jenjang'],
      _count: {
        id: true
      }
    })
    
    // Get document counts by status
    const documentCountsByStatus = await prisma.proposalDocument.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })
    
    // Get recent proposals with pagination
    const recentProposals = await prisma.promotionProposal.findMany({
      where: {
        ...whereClause,
        createdAt: dateFilter
      },
      include: {
        pegawai: {
          select: {
            id: true,
            nip: true,
            name: true,
            golongan: true,
            unitKerja: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })
    
    // Get recent activities
    const recentActivities = await prisma.activityLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            nip: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })
    
    // Format the response with aggregated statistics
    const statistics = {
      proposals: {
        total: proposalCountsByStatus.reduce((sum, item) => sum + item._count.id, 0),
        byStatus: proposalCountsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.id
          return acc
        }, {} as Record<string, number>)
      },
      users: {
        total: userCountsByRole.reduce((sum, item) => sum + item._count.id, 0),
        byRole: userCountsByRole.reduce((acc, item) => {
          acc[item.role] = item._count.id
          return acc
        }, {} as Record<string, number>)
      },
      unitKerja: {
        total: unitKerjaCountsByJenjang.reduce((sum, item) => sum + item._count.id, 0),
        byJenjang: unitKerjaCountsByJenjang.reduce((acc, item) => {
          acc[item.jenjang] = item._count.id
          return acc
        }, {} as Record<string, number>)
      },
      documents: {
        total: documentCountsByStatus.reduce((sum, item) => sum + item._count.id, 0),
        byStatus: documentCountsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.id
          return acc
        }, {} as Record<string, number>)
      },
      recentData: {
        proposals: recentProposals,
        activities: recentActivities
      }
    }
    
    return NextResponse.json({ data: statistics })
  } catch (error) {
    console.error('Error fetching statistics:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
