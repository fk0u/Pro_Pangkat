import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()

    if (!session.isLoggedIn) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Mark the notification as read
    const notification = await prisma.notification.update({
      where: {
        id,
        userId: session.user.id
      },
      data: {
        isRead: true
      }
    })

    if (!notification) {
      return NextResponse.json({ message: "Notification not found" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Notification marked as read",
      notification
    })
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
