import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')
    const dateFilter = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Construct date range 
    let dateRange: { gte?: Date, lte?: Date } = {}
    const now = new Date()
    
    // Handle custom date range if provided
    if (startDate && endDate) {
      const fromDate = new Date(startDate)
      fromDate.setHours(0, 0, 0, 0)

      const toDate = new Date(endDate)
      toDate.setHours(23, 59, 59, 999)

      dateRange = {
        gte: fromDate,
        lte: toDate
      }
    }
    // Otherwise use predefined date filters
    else if (dateFilter) {
      switch (dateFilter) {
        case 'today':
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const endOfToday = new Date()
          endOfToday.setHours(23, 59, 59, 999)
          dateRange = { gte: today, lte: endOfToday }
          break
        case 'yesterday':
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          yesterday.setHours(0, 0, 0, 0)
          const endOfYesterday = new Date()
          endOfYesterday.setDate(endOfYesterday.getDate() - 1)
          endOfYesterday.setHours(23, 59, 59, 999)
          dateRange = { gte: yesterday, lte: endOfYesterday }
          break
        case 'last7days':
          const last7Days = new Date()
          last7Days.setDate(last7Days.getDate() - 7)
          dateRange = { gte: last7Days }
          break
        case 'last30days':
          const last30Days = new Date()
          last30Days.setDate(last30Days.getDate() - 30)
          dateRange = { gte: last30Days }
          break
        case 'thisMonth':
          const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          lastDayOfMonth.setHours(23, 59, 59, 999)
          dateRange = { gte: firstDayOfMonth, lte: lastDayOfMonth }
          break
        case 'lastMonth':
          const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
          lastDayOfLastMonth.setHours(23, 59, 59, 999)
          dateRange = { gte: firstDayOfLastMonth, lte: lastDayOfLastMonth }
          break
      }
    }

    // Build where conditions for search
    const whereConditions: Prisma.ActivityLogWhereInput = {}
    
    if (action) {
      whereConditions.action = action
    }
    
    if (userId) {
      whereConditions.userId = userId
    }
    
    if (role) {
      whereConditions.user = {
        role: role
      }
    }
    
    if (Object.keys(dateRange).length > 0) {
      whereConditions.createdAt = dateRange
    }
    
    if (search) {
      whereConditions.OR = [
        {
          action: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          details: {
            path: ['$'],
            string_contains: search
          }
        },
        {
          user: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          user: {
            email: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ]
    }

    // Count total matching records for pagination
    const total = await prisma.activityLog.count({
      where: whereConditions
    })

    // Fetch activity logs
    const logs = await prisma.activityLog.findMany({
      where: whereConditions,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    })

    return NextResponse.json({
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching activity logs:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
