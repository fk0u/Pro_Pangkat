import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * PATCH endpoint to mark multiple notifications as read
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { message: 'No notification IDs provided' },
        { status: 400 }
      )
    }

    // Mark notifications as read
    const result = await prisma.notification.updateMany({
      where: {
        id: {
          in: ids
        }
      },
      data: {
        isRead: true
      }
    })

    return NextResponse.json({
      message: `${result.count} notifications marked as read`,
      count: result.count
    })
  } catch (error) {
    console.error('Error marking notifications as read:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST endpoint for marking all notifications as read (optionally filtered)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, userRole, userId } = body
    
    // Build filter criteria
    const whereClause: any = {
      isRead: false
    }
    
    if (type) {
      whereClause.type = type
    }
    
    if (userRole) {
      whereClause.userRole = userRole
    }
    
    if (userId) {
      whereClause.userId = userId
    }

    // Mark notifications as read
    const result = await prisma.notification.updateMany({
      where: whereClause,
      data: {
        isRead: true
      }
    })

    return NextResponse.json({
      message: `${result.count} notifications marked as read`,
      count: result.count
    })
  } catch (error) {
    console.error('Error marking notifications as read:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
