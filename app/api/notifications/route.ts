import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session.isLoggedIn) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")

    // Get notifications for the user
    const where = {
      OR: [
        { userId: session.user.id },
        { userRole: session.user.role },
        { userId: null, userRole: null } // Global notifications
      ]
    }

    const total = await prisma.notification.count({ where })

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: [
        { isRead: "asc" },
        { createdAt: "desc" }
      ],
      skip: (page - 1) * limit,
      take: limit,
    })

    return NextResponse.json({
      notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      unreadCount: notifications.filter(n => !n.isRead).length
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session.isLoggedIn) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { notificationId, action } = body

    if (action === "mark_read" && notificationId) {
      await prisma.notification.update({
        where: { 
          id: notificationId,
          userId: session.user.id
        },
        data: { isRead: true }
      })
      
      return NextResponse.json({ message: "Notification marked as read" })
    }

    if (action === "mark_all_read") {
      await prisma.notification.updateMany({
        where: { 
          userId: session.user.id,
          isRead: false
        },
        data: { isRead: true }
      })
      
      return NextResponse.json({ message: "All notifications marked as read" })
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error updating notifications:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
