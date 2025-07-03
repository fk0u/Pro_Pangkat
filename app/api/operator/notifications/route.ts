import { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import { StatusProposal, StatusDokumen, Wilayah } from "@prisma/client"

interface AuthenticatedUser {
  id: string
  role: string
  wilayah?: Wilayah
}

interface NotificationItem {
  id: string
  type: "urgent_proposal" | "new_proposal" | "document_update" | "timeline_alert" | "system_notification"
  title: string
  message: string
  priority: "high" | "medium" | "low"
  isRead: boolean
  createdAt: string
  data?: Record<string, unknown>
}

export const GET = withAuth(async (req: NextRequest, user: AuthenticatedUser) => {
  try {
    // Hanya operator yang bisa mengakses endpoint ini
    if (user.role !== "OPERATOR") {
      return createErrorResponse("Access denied", 403)
    }

    // Get operator's wilayah
    const operatorData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { wilayah: true, name: true },
    })

    if (!operatorData?.wilayah) {
      return createErrorResponse("Operator wilayah not found", 400)
    }

    const url = new URL(req.url)
    const unreadOnly = url.searchParams.get("unreadOnly") === "true"
    const limit = parseInt(url.searchParams.get("limit") || "20")

    const notifications: NotificationItem[] = []

    // Get urgent proposals that need immediate attention
    const urgentProposals = await prisma.promotionProposal.findMany({
      where: {
        pegawai: { wilayah: operatorData.wilayah },
        status: {
          in: [StatusProposal.DIAJUKAN, StatusProposal.DIPROSES_OPERATOR]
        },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: {
        pegawai: {
          select: {
            name: true,
            nip: true,
            unitKerja: true
          }
        },
        documents: true
      },
      orderBy: { createdAt: "desc" }
    })

    // Create notifications for urgent proposals
    urgentProposals.forEach(proposal => {
      const daysSinceCreated = Math.floor(
        (new Date().getTime() - proposal.createdAt.getTime()) / (24 * 60 * 60 * 1000)
      )

      const hasUnverifiedDocs = proposal.documents.some(
        doc => doc.status === StatusDokumen.MENUNGGU_VERIFIKASI
      )

      if (daysSinceCreated > 3 && proposal.status === StatusProposal.DIAJUKAN) {
        notifications.push({
          id: `urgent_${proposal.id}`,
          type: "urgent_proposal",
          title: "Usulan Mendesak",
          message: `Usulan ${proposal.pegawai.name} (${proposal.pegawai.unitKerja}) sudah ${daysSinceCreated} hari menunggu verifikasi`,
          priority: daysSinceCreated > 7 ? "high" : "medium",
          isRead: false,
          createdAt: proposal.createdAt.toISOString(),
          data: {
            proposalId: proposal.id,
            pegawaiName: proposal.pegawai.name,
            unitKerja: proposal.pegawai.unitKerja,
            daysPending: daysSinceCreated
          }
        })
      }

      if (hasUnverifiedDocs && daysSinceCreated > 5) {
        const unverifiedCount = proposal.documents.filter(
          doc => doc.status === StatusDokumen.MENUNGGU_VERIFIKASI
        ).length

        notifications.push({
          id: `docs_${proposal.id}`,
          type: "document_update",
          title: "Dokumen Menunggu Verifikasi",
          message: `${unverifiedCount} dokumen dari ${proposal.pegawai.name} menunggu verifikasi lebih dari 5 hari`,
          priority: "medium",
          isRead: false,
          createdAt: proposal.createdAt.toISOString(),
          data: {
            proposalId: proposal.id,
            pegawaiName: proposal.pegawai.name,
            unverifiedDocsCount: unverifiedCount
          }
        })
      }
    })

    // Get new proposals in the last 24 hours
    const newProposals = await prisma.promotionProposal.findMany({
      where: {
        pegawai: { wilayah: operatorData.wilayah },
        status: StatusProposal.DIAJUKAN,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: {
        pegawai: {
          select: {
            name: true,
            nip: true,
            unitKerja: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    // Create notifications for new proposals
    newProposals.forEach(proposal => {
      notifications.push({
        id: `new_${proposal.id}`,
        type: "new_proposal",
        title: "Usulan Baru",
        message: `Usulan baru dari ${proposal.pegawai.name} (${proposal.pegawai.unitKerja}) untuk periode ${proposal.periode}`,
        priority: "medium",
        isRead: false,
        createdAt: proposal.createdAt.toISOString(),
        data: {
          proposalId: proposal.id,
          pegawaiName: proposal.pegawai.name,
          periode: proposal.periode,
          unitKerja: proposal.pegawai.unitKerja
        }
      })
    })

    // Get active timeline alerts
    const currentDate = new Date()
    const activeTimelines = await prisma.timeline.findMany({
      where: {
        isActive: true,
        OR: [
          { wilayah: null },
          { wilayah: operatorData.wilayah }
        ],
        endDate: {
          gte: currentDate,
          lte: new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000) // Within 7 days
        }
      }
    })

    // Create timeline deadline notifications
    activeTimelines.forEach(timeline => {
      const daysUntilDeadline = Math.ceil(
        (new Date(timeline.endDate).getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000)
      )

      if (daysUntilDeadline <= 7) {
        notifications.push({
          id: `timeline_${timeline.id}`,
          type: "timeline_alert",
          title: "Timeline Deadline",
          message: `Timeline "${timeline.title}" akan berakhir dalam ${daysUntilDeadline} hari`,
          priority: daysUntilDeadline <= 3 ? "high" : "medium",
          isRead: false,
          createdAt: timeline.createdAt?.toISOString() || new Date().toISOString(),
          data: {
            timelineId: timeline.id,
            timelineTitle: timeline.title,
            daysRemaining: daysUntilDeadline,
            jabatanType: timeline.jabatanType
          }
        })
      }
    })

    // Check for system notifications (from activity log)
    const systemActivities = await prisma.activityLog.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        },
        action: {
          in: ["SYSTEM_MAINTENANCE", "POLICY_UPDATE", "ANNOUNCEMENT"]
        }
      },
      orderBy: { createdAt: "desc" },
      take: 5
    })

    // Add system notifications
    systemActivities.forEach(activity => {
      notifications.push({
        id: `system_${activity.id}`,
        type: "system_notification",
        title: "Notifikasi Sistem",
        message: activity.action === "SYSTEM_MAINTENANCE" ? "Maintenance sistem akan dilakukan" :
                activity.action === "POLICY_UPDATE" ? "Pembaruan kebijakan tersedia" :
                "Pengumuman sistem baru",
        priority: "low",
        isRead: false,
        createdAt: activity.createdAt.toISOString(),
        data: {
          activityId: activity.id,
          details: activity.details
        }
      })
    })

    // Sort notifications by priority and date
    const sortedNotifications = notifications
      .sort((a, b) => {
        // First sort by priority
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        }
        // Then by date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
      .slice(0, limit)

    // Filter unread only if requested
    const filteredNotifications = unreadOnly 
      ? sortedNotifications.filter(n => !n.isRead)
      : sortedNotifications

    // Calculate summary stats
    const summary = {
      total: notifications.length,
      unread: notifications.filter(n => !n.isRead).length,
      high: notifications.filter(n => n.priority === "high").length,
      medium: notifications.filter(n => n.priority === "medium").length,
      low: notifications.filter(n => n.priority === "low").length,
      byType: {
        urgent_proposal: notifications.filter(n => n.type === "urgent_proposal").length,
        new_proposal: notifications.filter(n => n.type === "new_proposal").length,
        document_update: notifications.filter(n => n.type === "document_update").length,
        timeline_alert: notifications.filter(n => n.type === "timeline_alert").length,
        system_notification: notifications.filter(n => n.type === "system_notification").length,
      }
    }

    return createSuccessResponse({
      notifications: filteredNotifications,
      summary,
      lastUpdate: new Date().toISOString(),
      operatorWilayah: operatorData.wilayah
    })

  } catch (error: unknown) {
    console.error("Error fetching notifications:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch notifications"
    return createErrorResponse(errorMessage)
  }
})

// Mark notification as read
export const PUT = withAuth(async (req: NextRequest, user: AuthenticatedUser) => {
  try {
    if (user.role !== "OPERATOR") {
      return createErrorResponse("Access denied", 403)
    }

    const body = await req.json()
    const { notificationId, markAllAsRead } = body

    if (markAllAsRead) {
      // In a real implementation, you would update notification read status in database
      // For now, we'll just return success
      return createSuccessResponse({
        message: "All notifications marked as read",
        updatedAt: new Date().toISOString()
      })
    } else if (notificationId) {
      // Mark specific notification as read
      return createSuccessResponse({
        message: "Notification marked as read",
        notificationId,
        updatedAt: new Date().toISOString()
      })
    } else {
      return createErrorResponse("Missing notificationId or markAllAsRead flag", 400)
    }

  } catch (error: unknown) {
    console.error("Error updating notification:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to update notification"
    return createErrorResponse(errorMessage)
  }
})
