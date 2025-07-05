import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

/**
 * GET endpoint for retrieving notifications
 * Supports filtering by type, role, and global/user-specific
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn || session.user?.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const type = searchParams.get("type")
    const role = searchParams.get("role")
    const globalOnly = searchParams.get("globalOnly") === "true"
    const search = searchParams.get("search")
    
    // Build query filters
    const filters: Prisma.NotificationWhereInput = {}
    
    // Filter by type
    if (type) {
      filters.type = type
    }
    
    // Filter by role
    if (role) {
      filters.userRole = role as Prisma.Role
    }
    
    // Filter global notifications
    if (globalOnly) {
      filters.userId = null
    }
    
    // Search by title or message
    if (search) {
      filters.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { message: { contains: search, mode: "insensitive" } }
      ]
    }

    // Count total matching records for pagination
    const total = await prisma.notification.count({
      where: filters
    })

    // Fetch notifications
    const notifications = await prisma.notification.findMany({
      where: filters,
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
        createdAt: "desc"
      },
      skip: (page - 1) * limit,
      take: limit
    })

    return NextResponse.json({
      data: notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session.isLoggedIn || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, message, type, userId, userRole, actionUrl, actionLabel } = body

    if (!title || !message || !type) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    // Create a notification
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        userId,
        userRole,
        actionUrl,
        actionLabel,
        isRead: false
      }
    })

    return NextResponse.json({
      message: 'Notification created successfully',
      notification
    })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
